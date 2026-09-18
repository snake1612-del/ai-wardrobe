import "server-only";

import { createHash } from "node:crypto";

import sharp from "sharp";

import { logEvent } from "@/platform/logging/logger";
import { validateMediaBuffer } from "@/modules/media/validation";

import { iterateImageOnlyZip } from "../archive";
import { IMPORT_MAX_ENTRIES, IMPORT_MAX_EXPANDED_BYTES } from "../model";
import {
  claimImportJob,
  commitImportRecord,
  createImportServiceClient,
  failImportJob,
  finalizeImportCleanup,
  finalizeImportCommit,
  finishImportPrepare,
  recordImportRecordFailure,
  stageImportAsset,
} from "./import-capability";

function deterministicUuid(seed: string): string {
  const bytes = createHash("sha256").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}

async function blobBuffer(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

async function uploadImmutableOriginal(objectKey: string, bytes: Buffer, mimeType: string) {
  const storage = createImportServiceClient().storage.from("wardrobe-originals");
  const { error } = await storage.upload(objectKey, bytes, {
    contentType: mimeType,
    cacheControl: "0",
    upsert: false,
  });
  if (!error) return;
  const { data: existing, error: downloadError } = await storage.download(objectKey);
  if (downloadError || !existing) throw new Error("import_original_upload_failed");
  const observed = createHash("sha256")
    .update(await blobBuffer(existing))
    .digest("hex");
  const expected = createHash("sha256").update(bytes).digest("hex");
  if (observed !== expected) throw new Error("import_original_replay_conflict");
}

async function perceptualHash(bytes: Buffer): Promise<bigint> {
  const pixels = await sharp(bytes, { failOn: "error" })
    .rotate()
    .greyscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer();
  let hash = 0n;
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      hash <<= 1n;
      const offset = row * 9 + column;
      if ((pixels[offset] ?? 0) > (pixels[offset + 1] ?? 0)) hash |= 1n;
    }
  }
  return hash;
}

function hammingDistance(left: bigint, right: bigint): number {
  let value = left ^ right;
  let distance = 0;
  while (value > 0n) {
    distance += Number(value & 1n);
    value >>= 1n;
  }
  return distance;
}

async function prepareJob(workerId: string, jobId: string, accountId: string, sessionId: string) {
  const client = createImportServiceClient();
  const { data: parts, error } = await client
    .from("import_archive_parts")
    .select("id,part_ordinal,storage_bucket,storage_object_key,state")
    .eq("account_id", accountId)
    .eq("import_session_id", sessionId)
    .order("part_ordinal");
  if (error || !parts?.length) throw new Error("import_parts_unavailable");

  const partHashes: Array<{ part_id: string; sha256: string }> = [];
  const manifestAssets: Array<{
    reference: string;
    asset_id: string;
    sha256: string;
    byte_size: number;
    mime_type: string;
    origin_proposal: string;
  }> = [];
  const hashes = new Map<string, number>();
  const canonicalAssets = new Map<string, { assetId: string; reference: string }>();
  const aliases: Array<{ alias: string; canonical_reference: string }> = [];
  const fingerprints: Array<{ reference: string; hash: bigint }> = [];
  const probablePairs: Array<{ left: string; right: string }> = [];
  let expandedBytes = 0;
  let entryCount = 0;
  for (const part of parts) {
    if (!["uploaded", "prepared"].includes(part.state)) throw new Error("import_part_not_uploaded");
    const { data: blob, error: downloadError } = await client.storage
      .from(part.storage_bucket)
      .download(part.storage_object_key);
    if (downloadError || !blob) throw new Error("import_archive_download_failed");
    const archive = await blobBuffer(blob);
    const partHash = createHash("sha256").update(archive).digest("hex");
    partHashes.push({ part_id: part.id, sha256: partHash });
    for (const entry of iterateImageOnlyZip(archive)) {
      entryCount += 1;
      expandedBytes += entry.bytes.length;
      if (entryCount > IMPORT_MAX_ENTRIES || expandedBytes > IMPORT_MAX_EXPANDED_BYTES) {
        throw new Error("archive_limit_exceeded");
      }
      const validation = await validateMediaBuffer(entry.bytes);
      if (!validation.valid || !["image/jpeg", "image/png"].includes(validation.mimeType)) {
        throw new Error(validation.valid ? "unsupported_import_image" : validation.failureCode);
      }
      const importMimeType = validation.mimeType as "image/jpeg" | "image/png";
      const contentHash = validation.contentHash.slice(2);
      hashes.set(contentHash, (hashes.get(contentHash) ?? 0) + 1);
      const reference = `p${part.part_ordinal}:e${entry.ordinal}`;
      const canonical = canonicalAssets.get(contentHash);
      if (canonical) {
        aliases.push({ alias: reference, canonical_reference: canonical.reference });
        continue;
      }
      const assetId = deterministicUuid(`${sessionId}:${reference}`);
      canonicalAssets.set(contentHash, { assetId, reference });
      const objectKey = `accounts/${accountId}/imports/${sessionId}/assets/${assetId}/source/v1`;
      await uploadImmutableOriginal(objectKey, entry.bytes, importMimeType);
      const originProposal = entry.privateName.toLowerCase().endsWith(".png")
        ? "catalog_candidate"
        : "source_candidate";
      await stageImportAsset(workerId, jobId, {
        assetId,
        sourceReference: reference,
        objectKey,
        mimeType: importMimeType,
        byteSize: validation.byteSize,
        contentHash,
        originProposal,
      });
      const fingerprint = await perceptualHash(entry.bytes);
      for (const previous of fingerprints) {
        if (hammingDistance(previous.hash, fingerprint) <= 5) {
          probablePairs.push({ left: previous.reference, right: reference });
        }
      }
      fingerprints.push({ reference, hash: fingerprint });
      manifestAssets.push({
        reference,
        asset_id: assetId,
        sha256: contentHash,
        byte_size: validation.byteSize,
        mime_type: validation.mimeType,
        origin_proposal: originProposal,
      });
    }
  }
  const exactDuplicateAssets = [...hashes.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );
  await finishImportPrepare(workerId, jobId, partHashes, {
    schema: "aiw.bulk-import/1",
    adapter: "legacy-wardrobe-image-set/v1",
    part_count: parts.length,
    asset_count: manifestAssets.length,
    exact_duplicate_assets: exactDuplicateAssets,
    probable_duplicate_pairs: probablePairs.length,
    asset_aliases: aliases,
    issues: [
      ...(exactDuplicateAssets
        ? [{ code: "asset_exact_duplicate", count: exactDuplicateAssets, severity: "warning" }]
        : []),
      ...(probablePairs.length
        ? [{ code: "asset_probable_duplicate", count: probablePairs.length, severity: "warning" }]
        : []),
      { code: "source_metadata_absent", count: manifestAssets.length, severity: "warning" },
    ],
    assets: manifestAssets,
  });
}

async function commitJob(workerId: string, jobId: string, accountId: string, sessionId: string) {
  const client = createImportServiceClient();
  const { data: records, error } = await client
    .from("import_records")
    .select("id,commit_outcome")
    .eq("account_id", accountId)
    .eq("import_session_id", sessionId)
    .order("record_ordinal");
  if (error || !records) throw new Error("import_records_unavailable");
  for (const record of records) {
    if (record.commit_outcome !== "pending") continue;
    try {
      await commitImportRecord(workerId, jobId, record.id);
    } catch (error) {
      const failureCode = error instanceof Error ? error.message : "record_commit_failed";
      await recordImportRecordFailure(workerId, jobId, record.id, failureCode);
    }
  }
  await finalizeImportCommit(workerId, jobId);
}

async function cleanupJob(workerId: string, jobId: string, accountId: string, sessionId: string) {
  const client = createImportServiceClient();
  const { data: parts, error } = await client
    .from("import_archive_parts")
    .select("id,storage_bucket,storage_object_key,state")
    .eq("account_id", accountId)
    .eq("import_session_id", sessionId);
  if (error || !parts) throw new Error("import_cleanup_parts_unavailable");
  const deleted: string[] = [];
  for (const part of parts) {
    if (part.state !== "deleted") {
      const { error: deleteError } = await client.storage
        .from(part.storage_bucket)
        .remove([part.storage_object_key]);
      if (deleteError) throw new Error("import_archive_cleanup_failed");
    }
    deleted.push(part.id);
  }
  await finalizeImportCleanup(workerId, jobId, deleted);
}

export async function runImportWorkerOnce(
  workerId: string,
): Promise<"idle" | "processed" | "retry"> {
  const job = await claimImportJob(workerId);
  if (!job) return "idle";
  try {
    if (job.job_type === "import.parse") {
      await prepareJob(workerId, job.job_id, job.account_id, job.import_session_id);
    } else if (job.job_type === "import.commit") {
      await commitJob(workerId, job.job_id, job.account_id, job.import_session_id);
    } else if (job.job_type === "import.cleanup") {
      await cleanupJob(workerId, job.job_id, job.account_id, job.import_session_id);
    } else {
      throw new Error("unsupported_import_job");
    }
    logEvent("info", "import.worker.job_succeeded", { jobType: job.job_type });
    return "processed";
  } catch (error) {
    const failureCode = error instanceof Error ? error.message : "import_worker_failed";
    logEvent("warn", "import.worker.job_failed", { jobType: job.job_type, failureCode });
    await failImportJob(workerId, job.job_id, failureCode);
    return "retry";
  }
}
