import "server-only";

import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import sharp from "sharp";

import { logEvent } from "../../../platform/logging/logger";
import { validateMediaBuffer } from "../../media/validation";

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
  renewImportPrepareLease,
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

const prepareLeaseRenewIntervalMs = 60_000;
const prepareLeaseLostCode = "import_prepare_lease_lost";

function assertLeaseSignal(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error(prepareLeaseLostCode);
}

export function createImportPrepareLeaseGuard(workerId: string, jobId: string) {
  const controller = new AbortController();
  let lost = false;
  let stopped = false;
  let inFlight: Promise<void> | null = null;

  function markLost(): void {
    lost = true;
    controller.abort();
  }

  function assertActive(): void {
    if (lost) throw new Error(prepareLeaseLostCode);
  }

  async function renew(): Promise<void> {
    assertActive();
    if (stopped) throw new Error(prepareLeaseLostCode);
    if (!inFlight) {
      inFlight = (async () => {
        if (!(await renewImportPrepareLease(workerId, jobId))) markLost();
      })()
        .catch(markLost)
        .finally(() => {
          inFlight = null;
        });
    }
    await inFlight;
    assertActive();
  }

  const timer = setInterval(() => {
    void renew().catch(() => {});
  }, prepareLeaseRenewIntervalMs);
  timer.unref?.();

  return {
    signal: controller.signal,
    renew,
    assertActive,
    get lost() {
      return lost;
    },
    async stop() {
      stopped = true;
      clearInterval(timer);
      await inFlight;
    },
  };
}

type PrepareLeaseGuard = ReturnType<typeof createImportPrepareLeaseGuard>;

export async function stageImportAssetWhileLeased(
  lease: PrepareLeaseGuard,
  workerId: string,
  jobId: string,
  input: Parameters<typeof stageImportAsset>[2],
): Promise<void> {
  await lease.renew();
  lease.assertActive();
  await stageImportAsset(workerId, jobId, input);
}

const originalDownloadAttempts = 3;
const originalDownloadRetryDelayMs = 200;
const originalDownloadTimeoutMs = 15_000;
const safeStorageErrorCodes = new Set([
  "AccessDenied",
  "DatabaseError",
  "InternalError",
  "KeyAlreadyExists",
  "NoSuchKey",
  "UnexpectedError",
]);

function storageFailure(error: unknown): { status: number | null; errorCode: string } {
  if (typeof error !== "object" || error === null) {
    return { status: null, errorCode: "unknown" };
  }
  const status = "status" in error && typeof error.status === "number" ? error.status : null;
  const code = "code" in error && typeof error.code === "string" ? error.code : "unknown";
  return {
    status,
    errorCode: safeStorageErrorCodes.has(code) ? code : "unknown",
  };
}

async function waitForOriginalDownloadRetry(
  attempt: number,
  leaseSignal?: AbortSignal,
): Promise<void> {
  try {
    await delay(
      originalDownloadRetryDelayMs * attempt,
      undefined,
      leaseSignal ? { signal: leaseSignal } : undefined,
    );
  } catch {
    assertLeaseSignal(leaseSignal);
    throw new Error("import_original_download_failed");
  }
}

export async function uploadImmutableOriginal(
  objectKey: string,
  bytes: Buffer,
  mimeType: string,
  leaseSignal?: AbortSignal,
) {
  assertLeaseSignal(leaseSignal);
  const storage = createImportServiceClient().storage.from("wardrobe-originals");
  const uploadStartedAt = performance.now();
  const { error: uploadError } = await storage.upload(objectKey, bytes, {
    contentType: mimeType,
    cacheControl: "0",
    upsert: false,
  });
  assertLeaseSignal(leaseSignal);
  if (!uploadError) return;
  const uploadFailure = storageFailure(uploadError);
  logEvent("warn", "import.worker.original_upload_failed", {
    ...uploadFailure,
    durationMs: Math.round(performance.now() - uploadStartedAt),
  });
  if (
    uploadFailure.errorCode !== "KeyAlreadyExists" ||
    uploadFailure.status === null ||
    uploadFailure.status < 400 ||
    uploadFailure.status >= 500
  ) {
    throw new Error("import_original_upload_failed");
  }

  const expected = createHash("sha256").update(bytes).digest("hex");
  for (let attempt = 1; attempt <= originalDownloadAttempts; attempt += 1) {
    assertLeaseSignal(leaseSignal);
    const timeoutSignal = AbortSignal.timeout(originalDownloadTimeoutMs);
    const requestSignal = leaseSignal
      ? AbortSignal.any([timeoutSignal, leaseSignal])
      : timeoutSignal;
    const downloadStartedAt = performance.now();
    let existing: Blob | null = null;
    let downloadError: unknown = null;
    try {
      const result = await storage.download(objectKey, {}, { signal: requestSignal });
      existing = result.data;
      downloadError = result.error;
    } catch (error) {
      downloadError = error;
    }
    assertLeaseSignal(leaseSignal);
    if (downloadError || !existing) {
      const failure = timeoutSignal.aborted
        ? { status: null, errorCode: "Timeout" }
        : storageFailure(downloadError);
      logEvent("warn", "import.worker.original_download_failed", {
        ...failure,
        durationMs: Math.round(performance.now() - downloadStartedAt),
      });
      const retryable =
        timeoutSignal.aborted ||
        (failure.status !== null && failure.status >= 500 && failure.status < 600);
      if (retryable && attempt < originalDownloadAttempts) {
        await waitForOriginalDownloadRetry(attempt, leaseSignal);
        continue;
      }
      throw new Error("import_original_download_failed");
    }
    const observed = createHash("sha256")
      .update(await blobBuffer(existing))
      .digest("hex");
    assertLeaseSignal(leaseSignal);
    if (observed !== expected) throw new Error("import_original_replay_conflict");
    return;
  }
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

async function prepareJob(
  workerId: string,
  jobId: string,
  accountId: string,
  sessionId: string,
  lease: PrepareLeaseGuard,
) {
  await lease.renew();
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
    await lease.renew();
    if (!["uploaded", "prepared"].includes(part.state)) throw new Error("import_part_not_uploaded");
    const { data: blob, error: downloadError } = await client.storage
      .from(part.storage_bucket)
      .download(part.storage_object_key);
    if (downloadError || !blob) throw new Error("import_archive_download_failed");
    const archive = await blobBuffer(blob);
    lease.assertActive();
    const partHash = createHash("sha256").update(archive).digest("hex");
    partHashes.push({ part_id: part.id, sha256: partHash });
    for (const entry of iterateImageOnlyZip(archive)) {
      await lease.renew();
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
      await lease.renew();
      await uploadImmutableOriginal(objectKey, entry.bytes, importMimeType, lease.signal);
      const originProposal = entry.privateName.toLowerCase().endsWith(".png")
        ? "catalog_candidate"
        : "source_candidate";
      await stageImportAssetWhileLeased(lease, workerId, jobId, {
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
  await lease.renew();
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
  previewOnly = false,
): Promise<"idle" | "processed" | "retry"> {
  const job = await claimImportJob(workerId, previewOnly);
  if (!job) return "idle";
  const lease =
    job.job_type === "import.parse" ? createImportPrepareLeaseGuard(workerId, job.job_id) : null;
  try {
    if (job.job_type === "import.parse" && lease) {
      await prepareJob(workerId, job.job_id, job.account_id, job.import_session_id, lease);
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
    if (lease) {
      try {
        await lease.renew();
      } catch {
        logEvent("warn", "import.worker.lease_lost", { jobType: job.job_type });
        return "idle";
      }
    }
    const failureCode = error instanceof Error ? error.message : "import_worker_failed";
    logEvent("warn", "import.worker.job_failed", { jobType: job.job_type, failureCode });
    await failImportJob(workerId, job.job_id, failureCode);
    return "retry";
  } finally {
    await lease?.stop();
  }
}
