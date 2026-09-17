import { z } from "zod";

export const MEDIA_MAX_BYTES = 16 * 1024 * 1024;
export const MEDIA_MAX_AXIS = 12_000;
export const MEDIA_MAX_PIXELS = 40_000_000;
export const MEDIA_PROFILE = "media-v1";

export const acceptedMediaTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedMediaType = (typeof acceptedMediaTypes)[number];

export const uploadIntentSchema = z
  .object({
    itemId: z.string().uuid(),
    appearanceVariantId: z.string().uuid().nullable().optional().default(null),
    originalFilename: z.string().trim().min(1).max(255),
    declaredMimeType: z.enum(acceptedMediaTypes),
    declaredByteSize: z.number().int().positive().max(MEDIA_MAX_BYTES),
    productRole: z.enum(["evidence_source", "catalog", "reference"]).default("catalog"),
    imageView: z.enum(["front", "back", "side", "detail", "unspecified"]).default("unspecified"),
    replacesAssetId: z.string().uuid().nullable().optional().default(null),
    idempotencyKey: z.string().trim().min(16).max(128),
  })
  .strict();

export const completionSchema = z
  .object({
    idempotencyKey: z.string().trim().min(16).max(128),
  })
  .strict();

export const retrySchema = z
  .object({
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export const gallerySchema = z
  .object({
    expectedItemVersion: z.number().int().positive(),
    bindingIds: z.array(z.string().uuid()).min(1).max(48),
    primaryBindingId: z.string().uuid(),
  })
  .strict();

export const removeBindingSchema = z
  .object({
    itemId: z.string().uuid(),
    expectedItemVersion: z.number().int().positive(),
  })
  .strict();

export type MediaState =
  | "awaiting_upload"
  | "uploaded"
  | "validating"
  | "processing"
  | "ready"
  | "quarantined"
  | "failed"
  | "pending_delete";

export type MediaGalleryEntry = Readonly<{
  bindingId: string;
  assetId: string;
  renditionId: string | null;
  state: MediaState;
  failureCode: string | null;
  version: number;
  position: number;
  isPrimary: boolean;
  imageView: string;
  productRole: string;
  originalFilename: string | null;
}>;

export function mediaStateLabel(state: MediaState, failureCode: string | null): string {
  if (state === "awaiting_upload") return "Ожидает загрузки";
  if (state === "uploaded" || state === "validating") return "Проверяем файл";
  if (state === "processing") return "Готовим изображение";
  if (state === "ready") return "Готово";
  if (state === "quarantined") return "Файл изолирован как небезопасный";
  if (state === "failed") {
    if (failureCode === "unsupported_format") return "Формат не поддерживается";
    if (failureCode === "pixel_budget_exceeded") return "Изображение слишком большое";
    return "Обработка не удалась";
  }
  return "Ожидает безопасного удаления";
}
