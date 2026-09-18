import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/infrastructure/database/database.types";
import { ApplicationError } from "@/platform/errors/application-error";
import { getAccountBootstrapEnvironment } from "@/platform/env/server";
import { logEvent } from "@/platform/logging/logger";

import type { z } from "zod";
import { gallerySchema, removeBindingSchema, retrySchema, uploadIntentSchema } from "../model";

type UploadIntent = z.infer<typeof uploadIntentSchema>;
type GalleryInput = z.infer<typeof gallerySchema>;
type RemoveInput = z.infer<typeof removeBindingSchema>;
type RetryInput = z.infer<typeof retrySchema>;

export function createMediaServiceClient() {
  const environment = getAccountBootstrapEnvironment();
  return createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } },
  );
}

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
    throw new ApplicationError("conflict", "Данные изменились. Обновите страницу и повторите.");
  }
  if (["22023", "23503", "23505", "23514"].includes(code)) {
    throw new ApplicationError("validation", "Файл или параметры изображения недопустимы.");
  }
  if (code === "P0002") {
    throw new ApplicationError("not_found", "Изображение недоступно.");
  }
  throw new ApplicationError("transient_dependency", "Операция с изображением не выполнена.");
}

export async function createUploadIntentCapability(accountId: string, input: UploadIntent) {
  const assetId = randomUUID();
  const request = {
    itemId: input.itemId,
    appearanceVariantId: input.appearanceVariantId,
    originalFilename: input.originalFilename,
    declaredMimeType: input.declaredMimeType,
    declaredByteSize: input.declaredByteSize,
    productRole: input.productRole,
    imageView: input.imageView,
    replacesAssetId: input.replacesAssetId,
  };
  const { data, error } = await createMediaServiceClient()
    .rpc("create_media_upload_intent", {
      p_account_id: accountId,
      p_asset_id: assetId,
      p_item_id: input.itemId,
      p_appearance_variant_id: (input.appearanceVariantId ?? null) as unknown as string,
      p_original_filename: input.originalFilename,
      p_declared_mime_type: input.declaredMimeType,
      p_declared_byte_size: input.declaredByteSize,
      p_product_role: input.productRole,
      p_image_view: input.imageView,
      p_replaces_asset_id: (input.replacesAssetId ?? null) as unknown as string,
      p_idempotency_key: input.idempotencyKey,
      p_request_hash: requestHash(request),
    })
    .single();
  if (error || !data) capabilityFailure("media.intent.failed", error);
  return data;
}

export async function inspectUploadedObject(accountId: string, assetId: string) {
  const client = createMediaServiceClient();
  const { data: asset, error: assetError } = await client
    .from("media_assets")
    .select("storage_bucket,storage_object_key,processing_state,byte_size")
    .eq("account_id", accountId)
    .eq("id", assetId)
    .maybeSingle();
  if (assetError || !asset || asset.processing_state === "pending_delete") {
    capabilityFailure("media.complete.asset_unavailable", assetError);
  }
  const slash = asset.storage_object_key.lastIndexOf("/");
  const directory = asset.storage_object_key.slice(0, slash);
  const filename = asset.storage_object_key.slice(slash + 1);
  const { data: objects, error } = await client.storage
    .from(asset.storage_bucket)
    .list(directory, { limit: 2, search: filename });
  const object = objects?.find((candidate) => candidate.name === filename);
  const observedSize = Number(object?.metadata?.size ?? asset.byte_size ?? 0);
  if (error || !object?.id || !Number.isSafeInteger(observedSize) || observedSize <= 0) {
    capabilityFailure("media.complete.object_unavailable", error);
  }
  return { observedSize };
}

export async function completeUploadCapability(
  accountId: string,
  assetId: string,
  idempotencyKey: string,
  observedSize: number,
) {
  const { data, error } = await createMediaServiceClient()
    .rpc("complete_media_upload", {
      p_account_id: accountId,
      p_asset_id: assetId,
      p_observed_byte_size: observedSize,
      p_idempotency_key: idempotencyKey,
      p_request_hash: requestHash({ assetId, observedSize }),
    })
    .single();
  if (error || !data) capabilityFailure("media.complete.failed", error);
  return data;
}

export async function retryMediaCapability(accountId: string, assetId: string, input: RetryInput) {
  const { data, error } = await createMediaServiceClient()
    .rpc("retry_media_asset", {
      p_account_id: accountId,
      p_asset_id: assetId,
      p_expected_version: input.expectedVersion,
    })
    .single();
  if (error || !data) capabilityFailure("media.retry.failed", error);
  return data;
}

export async function setGalleryCapability(accountId: string, itemId: string, input: GalleryInput) {
  const { data, error } = await createMediaServiceClient().rpc("set_media_gallery", {
    p_account_id: accountId,
    p_item_id: itemId,
    p_expected_item_version: input.expectedItemVersion,
    p_binding_ids: input.bindingIds,
    p_primary_binding_id: input.primaryBindingId,
  });
  if (error || data === null) capabilityFailure("media.gallery.failed", error);
  return Number(data);
}

export async function removeBindingCapability(
  accountId: string,
  bindingId: string,
  input: RemoveInput,
) {
  const { data, error } = await createMediaServiceClient().rpc("remove_media_binding", {
    p_account_id: accountId,
    p_item_id: input.itemId,
    p_binding_id: bindingId,
    p_expected_item_version: input.expectedItemVersion,
  });
  if (error || data === null) capabilityFailure("media.remove.failed", error);
  return Number(data);
}

export async function claimMediaJob(workerId: string) {
  const { data, error } = await createMediaServiceClient()
    .rpc("claim_media_job", { p_worker_id: workerId, p_lease_seconds: 180 })
    .maybeSingle();
  if (error) capabilityFailure("media.worker.claim_failed", error);
  return data;
}

export async function recordValidation(
  workerId: string,
  jobId: string,
  result:
    | {
        valid: true;
        mimeType: string;
        byteSize: number;
        width: number;
        height: number;
        contentHash: string;
      }
    | { valid: false; quarantine: boolean; failureCode: string },
) {
  const args = result.valid
    ? {
        p_valid: true,
        p_quarantine: false,
        p_failure_code: "",
        p_verified_mime_type: result.mimeType,
        p_byte_size: result.byteSize,
        p_width_px: result.width,
        p_height_px: result.height,
        p_content_hash: result.contentHash,
      }
    : {
        p_valid: false,
        p_quarantine: result.quarantine,
        p_failure_code: result.failureCode,
        p_verified_mime_type: "",
        p_byte_size: 0,
        p_width_px: 0,
        p_height_px: 0,
        p_content_hash: "\\x00",
      };
  const { error } = await createMediaServiceClient().rpc("record_media_validation", {
    p_job_id: jobId,
    p_worker_id: workerId,
    ...args,
  });
  if (error) capabilityFailure("media.worker.validation_record_failed", error);
}

export async function recordProcessing(workerId: string, jobId: string, renditions: Json) {
  const { error } = await createMediaServiceClient().rpc("record_media_processing", {
    p_job_id: jobId,
    p_worker_id: workerId,
    p_renditions: renditions,
  });
  if (error) capabilityFailure("media.worker.processing_record_failed", error);
}

export async function failMediaJob(workerId: string, jobId: string, failureCode: string) {
  const { error } = await createMediaServiceClient().rpc("fail_media_job", {
    p_job_id: jobId,
    p_worker_id: workerId,
    p_failure_code: failureCode,
    p_retry_delay_seconds: 30,
  });
  if (error) capabilityFailure("media.worker.failure_record_failed", error);
}

export async function finalizeCleanup(workerId: string, jobId: string) {
  const { error } = await createMediaServiceClient().rpc("finalize_media_cleanup", {
    p_job_id: jobId,
    p_worker_id: workerId,
  });
  if (error) capabilityFailure("media.worker.cleanup_record_failed", error);
}
