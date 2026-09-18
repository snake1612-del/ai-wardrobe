import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type { Json } from "@/infrastructure/database/database.types";
import { ApplicationError } from "@/platform/errors/application-error";
import { logEvent } from "@/platform/logging/logger";

import type { z } from "zod";
import {
  type importConfirmSchema,
  type importIntentSchema,
  type importResolutionSchema,
  type importRetrySchema,
} from "../model";
import { createMediaServiceClient } from "../../media/server/media-capability";

type Intent = z.infer<typeof importIntentSchema>;
type Resolution = z.infer<typeof importResolutionSchema>;
type Confirmation = z.infer<typeof importConfirmSchema>;
type Retry = z.infer<typeof importRetrySchema>;

export const createImportServiceClient = createMediaServiceClient;

function requestHash(value: unknown): string {
  return `\\x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function capabilityFailure(event: string, error: unknown): never {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "missing_result";
  logEvent("warn", event, { errorCode: code });
  if (code === "40001") {
    throw new ApplicationError("conflict", "Состояние импорта изменилось. Обновите страницу.");
  }
  if (["22023", "23503", "23505", "23514"].includes(code)) {
    throw new ApplicationError("validation", "Проверьте архив и решения импорта.");
  }
  if (code === "P0002") {
    throw new ApplicationError("not_found", "Импорт или выбранная вещь недоступны.");
  }
  throw new ApplicationError("transient_dependency", "Операция импорта не выполнена.");
}

export async function createImportIntent(accountId: string, input: Intent) {
  const sessionId = randomUUID();
  const parts = input.parts.map((part, ordinal) => ({
    part_id: randomUUID(),
    ordinal,
    byte_size: part.byteSize,
  }));
  const request = { parts: input.parts };
  const { data, error } = await createImportServiceClient()
    .rpc("create_import_session_intent", {
      p_account_id: accountId,
      p_session_id: sessionId,
      p_parts: parts,
      p_idempotency_key: input.idempotencyKey,
      p_request_hash: requestHash(request),
    })
    .single();
  if (error || !data) capabilityFailure("import.intent.failed", error);
  return data as {
    session_id: string;
    state: string;
    version: number;
    parts: Array<{
      part_id: string;
      ordinal: number;
      bucket: string;
      object_key: string;
      state: string;
    }>;
  };
}

export async function inspectImportPart(
  accountId: string,
  sessionId: string,
  partId: string,
): Promise<number> {
  const client = createImportServiceClient();
  const { data: part, error: partError } = await client
    .from("import_archive_parts")
    .select("storage_bucket,storage_object_key,declared_byte_size,state")
    .eq("account_id", accountId)
    .eq("import_session_id", sessionId)
    .eq("id", partId)
    .maybeSingle();
  if (partError || !part || !["awaiting_upload", "uploaded", "prepared"].includes(part.state)) {
    capabilityFailure("import.complete.part_unavailable", partError);
  }
  const slash = part.storage_object_key.lastIndexOf("/");
  const directory = part.storage_object_key.slice(0, slash);
  const filename = part.storage_object_key.slice(slash + 1);
  const { data: objects, error } = await client.storage
    .from(part.storage_bucket)
    .list(directory, { limit: 2, search: filename });
  const object = objects?.find((candidate) => candidate.name === filename);
  const observed = Number(object?.metadata?.size ?? 0);
  if (
    error ||
    !object?.id ||
    !Number.isSafeInteger(observed) ||
    observed !== Number(part.declared_byte_size)
  ) {
    capabilityFailure("import.complete.object_unavailable", error);
  }
  return observed;
}

export async function completeImportPart(
  accountId: string,
  sessionId: string,
  partId: string,
  observedSize: number,
) {
  const { data, error } = await createImportServiceClient()
    .rpc("complete_import_archive_part", {
      p_account_id: accountId,
      p_session_id: sessionId,
      p_part_id: partId,
      p_observed_byte_size: observedSize,
    })
    .single();
  if (error || !data) capabilityFailure("import.complete.failed", error);
  return data;
}

function resolutionPayload(input: Resolution): Json {
  return {
    records: input.records.map((record) => ({
      record_id: record.recordId,
      source_record_key: record.sourceRecordKey,
      action: record.action,
      display_name: record.displayName,
      category_code: record.categoryCode,
      target_item_id: record.targetItemId,
      expected_item_version: record.expectedItemVersion,
      physical_set: record.physicalSet,
      variants: record.variants.map((variant) => ({
        key: variant.key,
        label: variant.label,
        is_default: variant.isDefault,
        position: variant.position,
      })),
      asset_mappings: record.assetMappings.map((mapping) => ({
        asset_id: mapping.assetId,
        role: mapping.role,
        view: mapping.view,
        variant_key: mapping.variantKey,
        is_primary: mapping.isPrimary,
      })),
    })),
    skipped_asset_ids: input.skippedAssetIds,
  };
}

export async function replaceImportResolution(
  accountId: string,
  sessionId: string,
  input: Resolution,
) {
  const { data, error } = await createImportServiceClient().rpc("replace_import_resolution", {
    p_account_id: accountId,
    p_session_id: sessionId,
    p_expected_version: input.expectedVersion,
    p_resolution: resolutionPayload(input),
  });
  if (error || data === null) capabilityFailure("import.resolve.failed", error);
  return Number(data);
}

export async function buildImportPreview(
  accountId: string,
  sessionId: string,
  expectedVersion: number,
) {
  const { data, error } = await createImportServiceClient()
    .rpc("build_import_preview", {
      p_account_id: accountId,
      p_session_id: sessionId,
      p_expected_version: expectedVersion,
    })
    .single();
  if (error || !data) capabilityFailure("import.preview.failed", error);
  return data;
}

export async function confirmImport(accountId: string, sessionId: string, input: Confirmation) {
  const request = {
    sessionId,
    expectedVersion: input.expectedVersion,
    expectedRevision: input.expectedRevision,
    expectedManifestHash: input.expectedManifestHash,
  };
  const { data, error } = await createImportServiceClient()
    .rpc("confirm_import_session", {
      p_account_id: accountId,
      p_session_id: sessionId,
      p_expected_version: input.expectedVersion,
      p_expected_revision: input.expectedRevision,
      p_expected_manifest_hash: `\\x${input.expectedManifestHash}`,
      p_idempotency_key: input.idempotencyKey,
      p_request_hash: requestHash(request),
    })
    .single();
  if (error || !data) capabilityFailure("import.confirm.failed", error);
  return data;
}

export async function retryImport(accountId: string, sessionId: string, input: Retry) {
  const { data, error } = await createImportServiceClient()
    .rpc("retry_import_commit", {
      p_account_id: accountId,
      p_session_id: sessionId,
      p_expected_version: input.expectedVersion,
    })
    .single();
  if (error || !data) capabilityFailure("import.retry.failed", error);
  return data;
}

export async function cancelImport(accountId: string, sessionId: string, input: Retry) {
  const { data, error } = await createImportServiceClient().rpc("cancel_import_session", {
    p_account_id: accountId,
    p_session_id: sessionId,
    p_expected_version: input.expectedVersion,
  });
  if (error || data === null) capabilityFailure("import.cancel.failed", error);
  return Number(data);
}

export async function claimImportJob(workerId: string) {
  const { data, error } = await createImportServiceClient()
    .rpc("claim_import_job", { p_worker_id: workerId, p_lease_seconds: 300 })
    .maybeSingle();
  if (error) capabilityFailure("import.worker.claim_failed", error);
  return data;
}

export async function stageImportAsset(
  workerId: string,
  jobId: string,
  input: {
    assetId: string;
    sourceReference: string;
    objectKey: string;
    mimeType: "image/jpeg" | "image/png";
    byteSize: number;
    contentHash: string;
    originProposal: "source_candidate" | "catalog_candidate";
  },
) {
  const { data, error } = await createImportServiceClient().rpc("stage_import_asset", {
    p_worker_id: workerId,
    p_job_id: jobId,
    p_asset_id: input.assetId,
    p_source_reference: input.sourceReference,
    p_storage_object_key: input.objectKey,
    p_mime_type: input.mimeType,
    p_byte_size: input.byteSize,
    p_content_hash: `\\x${input.contentHash}`,
    p_origin_proposal: input.originProposal,
  });
  if (error || !data) capabilityFailure("import.worker.stage_failed", error);
}

export async function finishImportPrepare(
  workerId: string,
  jobId: string,
  partHashes: Json,
  summary: Json,
) {
  const { data, error } = await createImportServiceClient().rpc("finish_import_prepare", {
    p_worker_id: workerId,
    p_job_id: jobId,
    p_part_hashes: partHashes,
    p_summary: summary,
  });
  if (error || data === null) capabilityFailure("import.worker.prepare_failed", error);
}

export async function commitImportRecord(workerId: string, jobId: string, recordId: string) {
  const { data, error } = await createImportServiceClient()
    .rpc("commit_import_record", {
      p_worker_id: workerId,
      p_job_id: jobId,
      p_record_id: recordId,
    })
    .single();
  if (error || !data) capabilityFailure("import.worker.record_failed", error);
  return data;
}

export async function recordImportRecordFailure(
  workerId: string,
  jobId: string,
  recordId: string,
  failureCode: string,
) {
  const { error } = await createImportServiceClient().rpc("record_import_record_failure", {
    p_worker_id: workerId,
    p_job_id: jobId,
    p_record_id: recordId,
    p_failure_code: failureCode,
  });
  if (error) capabilityFailure("import.worker.failure_record_failed", error);
}

export async function finalizeImportCommit(workerId: string, jobId: string) {
  const { data, error } = await createImportServiceClient()
    .rpc("finalize_import_commit", { p_worker_id: workerId, p_job_id: jobId })
    .single();
  if (error || !data) capabilityFailure("import.worker.commit_finalize_failed", error);
  return data;
}

export async function failImportJob(workerId: string, jobId: string, failureCode: string) {
  const { data, error } = await createImportServiceClient().rpc("fail_import_job", {
    p_worker_id: workerId,
    p_job_id: jobId,
    p_failure_code: failureCode,
    p_retry_delay_seconds: 30,
  });
  if (error) capabilityFailure("import.worker.failure_failed", error);
  return Boolean(data);
}

export async function finalizeImportCleanup(
  workerId: string,
  jobId: string,
  deletedPartIds: string[],
) {
  const { error } = await createImportServiceClient().rpc("finalize_import_cleanup", {
    p_worker_id: workerId,
    p_job_id: jobId,
    p_deleted_part_ids: deletedPartIds,
  });
  if (error) capabilityFailure("import.worker.cleanup_finalize_failed", error);
}
