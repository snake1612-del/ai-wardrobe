import "server-only";

import { createHash } from "node:crypto";

import sharp from "sharp";

import { logEvent } from "@/platform/logging/logger";

import { MEDIA_PROFILE } from "../model";
import { validateMediaBuffer } from "../validation";
import {
  claimMediaJob,
  createMediaServiceClient,
  failMediaJob,
  finalizeCleanup,
  recordProcessing,
  recordValidation,
} from "./media-capability";

const renditionSizes = { thumbnail: 480, medium: 960, full: 1600 } as const;

async function blobBuffer(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

async function downloadObject(bucket: string, objectKey: string): Promise<Buffer> {
  const { data, error } = await createMediaServiceClient().storage.from(bucket).download(objectKey);
  if (error || !data) throw new Error("storage_download_failed");
  return blobBuffer(data);
}

async function uploadImmutableRendition(objectKey: string, bytes: Buffer): Promise<void> {
  const storage = createMediaServiceClient().storage.from("wardrobe-renditions");
  const { error } = await storage.upload(objectKey, bytes, {
    contentType: "image/webp",
    cacheControl: "0",
    upsert: false,
  });
  if (!error) return;
  const { data: existing, error: downloadError } = await storage.download(objectKey);
  if (downloadError || !existing) throw new Error("rendition_upload_failed");
  const existingBytes = await blobBuffer(existing);
  const expected = createHash("sha256").update(bytes).digest("hex");
  const observed = createHash("sha256").update(existingBytes).digest("hex");
  if (expected !== observed) throw new Error("immutable_rendition_conflict");
}

async function validateJob(workerId: string, jobId: string, accountId: string, assetId: string) {
  const client = createMediaServiceClient();
  const { data: asset, error } = await client
    .from("media_assets")
    .select("storage_bucket,storage_object_key,declared_mime_type")
    .eq("account_id", accountId)
    .eq("id", assetId)
    .single();
  if (error) throw new Error("asset_lookup_failed");
  const original = await downloadObject(asset.storage_bucket, asset.storage_object_key);
  const result = await validateMediaBuffer(original, asset.declared_mime_type);
  await recordValidation(workerId, jobId, result);
}

async function processJob(workerId: string, jobId: string, accountId: string, assetId: string) {
  const client = createMediaServiceClient();
  const [{ data: asset, error: assetError }, { data: rows, error: renditionError }] =
    await Promise.all([
      client
        .from("media_assets")
        .select("storage_bucket,storage_object_key")
        .eq("account_id", accountId)
        .eq("id", assetId)
        .single(),
      client
        .from("media_renditions")
        .select("rendition_kind,storage_object_key")
        .eq("account_id", accountId)
        .eq("media_asset_id", assetId)
        .eq("processor_profile_version", MEDIA_PROFILE),
    ]);
  if (assetError || renditionError || !rows || rows.length !== 3) {
    throw new Error("rendition_lookup_failed");
  }
  const original = await downloadObject(asset.storage_bucket, asset.storage_object_key);
  const results = [];
  for (const row of rows) {
    const kind = row.rendition_kind as keyof typeof renditionSizes;
    const size = renditionSizes[kind];
    if (!size) throw new Error("unknown_rendition_kind");
    const output = await sharp(original, { failOn: "error" })
      .rotate()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .toColorspace("srgb")
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    await uploadImmutableRendition(row.storage_object_key, output.data);
    results.push({
      kind,
      objectKey: row.storage_object_key,
      byteSize: output.data.length,
      width: output.info.width,
      height: output.info.height,
    });
  }
  await recordProcessing(workerId, jobId, results);
}

async function cleanupJob(workerId: string, jobId: string, accountId: string, assetId: string) {
  const client = createMediaServiceClient();
  const [{ data: asset, error: assetError }, { data: renditions, error: renditionError }] =
    await Promise.all([
      client
        .from("media_assets")
        .select("storage_bucket,storage_object_key")
        .eq("account_id", accountId)
        .eq("id", assetId)
        .single(),
      client
        .from("media_renditions")
        .select("storage_bucket,storage_object_key")
        .eq("account_id", accountId)
        .eq("media_asset_id", assetId),
    ]);
  if (assetError || renditionError) throw new Error("cleanup_lookup_failed");
  const grouped = new Map<string, string[]>();
  for (const object of [asset, ...(renditions ?? [])]) {
    const keys = grouped.get(object.storage_bucket) ?? [];
    keys.push(object.storage_object_key);
    grouped.set(object.storage_bucket, keys);
  }
  for (const [bucket, keys] of grouped) {
    const { error } = await client.storage.from(bucket).remove(keys);
    if (error) throw new Error("cleanup_storage_failed");
  }
  await finalizeCleanup(workerId, jobId);
}

export async function runMediaWorkerOnce(
  workerId: string,
): Promise<"idle" | "processed" | "retry"> {
  const job = await claimMediaJob(workerId);
  if (!job) return "idle";
  try {
    if (job.job_type === "media.validate") {
      await validateJob(workerId, job.job_id, job.account_id, job.media_asset_id);
    } else if (job.job_type === "media.process") {
      await processJob(workerId, job.job_id, job.account_id, job.media_asset_id);
    } else if (job.job_type === "media.cleanup") {
      await cleanupJob(workerId, job.job_id, job.account_id, job.media_asset_id);
    } else {
      throw new Error("unsupported_media_job");
    }
    logEvent("info", "media.worker.job_succeeded", { jobType: job.job_type });
    return "processed";
  } catch (error) {
    const failureCode = error instanceof Error ? error.message : "worker_failed";
    logEvent("warn", "media.worker.job_failed", { jobType: job.job_type, failureCode });
    await failMediaJob(workerId, job.job_id, failureCode);
    return "retry";
  }
}
