import { z } from "zod";

export const IMPORT_ADAPTER = "legacy-wardrobe-image-set/v1";
export const IMPORT_MANIFEST_SCHEMA = "aiw.bulk-import/1";
export const IMPORT_MAX_PARTS = 4;
export const IMPORT_MAX_ARCHIVE_BYTES = 1024 * 1024 * 1024;
export const IMPORT_MAX_ENTRY_BYTES = 16 * 1024 * 1024;
export const IMPORT_MAX_ENTRIES = 2_000;
export const IMPORT_MAX_EXPANDED_BYTES = 2 * 1024 * 1024 * 1024;
export const IMPORT_MAX_ENTRY_COMPRESSION_RATIO = 50;
export const IMPORT_MAX_ARCHIVE_COMPRESSION_RATIO = 20;
export const IMPORT_MAX_PATH_BYTES = 240;
export const IMPORT_MAX_PATH_DEPTH = 16;

export const importIssueCodes = [
  "archive_integrity_failed",
  "archive_encrypted",
  "archive_path_unsafe",
  "archive_unsupported_entry",
  "archive_limit_exceeded",
  "archive_duplicate_path",
  "source_metadata_absent",
  "asset_type_unsupported",
  "asset_decode_failed",
  "asset_limit_exceeded",
  "asset_exact_duplicate",
  "asset_probable_duplicate",
  "asset_unassigned",
  "asset_declared_missing",
  "record_external_id_missing",
  "record_external_id_duplicate",
  "record_name_missing",
  "record_category_unknown",
  "record_status_unknown",
  "mapping_item_ambiguous",
  "mapping_view_unknown",
  "mapping_variant_ambiguous",
  "mapping_catalog_position_unknown",
  "mapping_physical_set_ambiguous",
  "mapping_existing_item_candidate",
  "history_evidence_absent",
  "history_evidence_ambiguous",
  "preview_stale",
  "target_version_changed",
  "target_missing",
  "target_foreign_or_missing",
  "record_skipped",
  "commit_retryable",
  "commit_terminal_failure",
  "cleanup_pending",
] as const;

export type ImportIssueCode = (typeof importIssueCodes)[number];

export const importIntentSchema = z
  .object({
    parts: z
      .array(
        z
          .object({
            byteSize: z.number().int().positive().max(IMPORT_MAX_ARCHIVE_BYTES),
          })
          .strict(),
      )
      .min(1)
      .max(IMPORT_MAX_PARTS)
      .refine(
        (parts) =>
          parts.reduce((total, part) => total + part.byteSize, 0) <= IMPORT_MAX_ARCHIVE_BYTES,
        "Суммарный размер архивов превышает лимит.",
      ),
    idempotencyKey: z.string().trim().min(16).max(128),
  })
  .strict();

export const importCompleteSchema = z.object({}).strict();

const mappingSchema = z
  .object({
    assetId: z.string().uuid(),
    role: z.enum(["evidence_source", "catalog", "reference"]),
    view: z.enum(["front", "back", "side", "detail", "unspecified"]),
    variantKey: z.string().trim().min(1).max(80).nullable().optional().default(null),
    isPrimary: z.boolean().default(false),
  })
  .strict();

const variantSchema = z
  .object({
    key: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120),
    isDefault: z.boolean().default(false),
    position: z.number().int().nonnegative().max(100).default(0),
  })
  .strict();

export const importResolutionSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    records: z
      .array(
        z
          .object({
            recordId: z.string().uuid().optional(),
            sourceRecordKey: z.string().trim().min(1).max(240),
            action: z.enum(["create", "update", "link", "skip"]),
            displayName: z.string().trim().min(1).max(180).nullable().optional().default(null),
            categoryCode: z.string().trim().min(1).max(80).nullable().optional().default(null),
            targetItemId: z.string().uuid().nullable().optional().default(null),
            expectedItemVersion: z.number().int().positive().nullable().optional().default(null),
            physicalSet: z.boolean().default(false),
            variants: z.array(variantSchema).max(24).default([]),
            assetMappings: z.array(mappingSchema).max(96).default([]),
          })
          .strict(),
      )
      .max(500),
    skippedAssetIds: z.array(z.string().uuid()).max(2_000).default([]),
  })
  .strict()
  .superRefine((value, context) => {
    const assigned = new Set<string>();
    for (const [recordIndex, record] of value.records.entries()) {
      if ((record.action === "create" || record.action === "update") && !record.displayName) {
        context.addIssue({
          code: "custom",
          path: ["records", recordIndex, "displayName"],
          message: "Для создания или обновления требуется название.",
        });
      }
      if (
        (record.action === "update" || record.action === "link") &&
        (!record.targetItemId || (record.action === "update" && !record.expectedItemVersion))
      ) {
        context.addIssue({
          code: "custom",
          path: ["records", recordIndex, "targetItemId"],
          message: "Обновление требует явно выбранную вещь и её версию.",
        });
      }
      const variantKeys = new Set<string>();
      const variantLabels = new Set<string>();
      let defaultVariantCount = 0;
      for (const [variantIndex, variant] of record.variants.entries()) {
        const normalizedLabel = variant.label.trim().toLocaleLowerCase("ru");
        if (variantKeys.has(variant.key) || variantLabels.has(normalizedLabel)) {
          context.addIssue({
            code: "custom",
            path: ["records", recordIndex, "variants", variantIndex],
            message: "Ключи и названия AppearanceVariant должны быть уникальны.",
          });
        }
        variantKeys.add(variant.key);
        variantLabels.add(normalizedLabel);
        if (variant.isDefault) defaultVariantCount += 1;
      }
      if (defaultVariantCount > 1) {
        context.addIssue({
          code: "custom",
          path: ["records", recordIndex, "variants"],
          message: "Для вещи разрешён только один default AppearanceVariant.",
        });
      }
      if (record.action === "skip" && record.assetMappings.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["records", recordIndex, "assetMappings"],
          message: "Пропущенная запись не может назначать изображения.",
        });
      }
      if (record.action !== "skip" && record.assetMappings.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["records", recordIndex, "assetMappings"],
          message: "Подтверждаемая запись должна содержать хотя бы одно изображение.",
        });
      }
      const primaryScopes = new Set<string>();
      for (const [mappingIndex, mapping] of record.assetMappings.entries()) {
        if (assigned.has(mapping.assetId)) {
          context.addIssue({
            code: "custom",
            path: ["records", recordIndex, "assetMappings", mappingIndex, "assetId"],
            message: "Изображение назначено более одного раза.",
          });
        }
        assigned.add(mapping.assetId);
        if (mapping.variantKey && !variantKeys.has(mapping.variantKey)) {
          context.addIssue({
            code: "custom",
            path: ["records", recordIndex, "assetMappings", mappingIndex, "variantKey"],
            message: "Неизвестный AppearanceVariant.",
          });
        }
        if (mapping.isPrimary && mapping.role !== "catalog") {
          context.addIssue({
            code: "custom",
            path: ["records", recordIndex, "assetMappings", mappingIndex, "isPrimary"],
            message: "Primary разрешён только для catalog image.",
          });
        }
        if (mapping.isPrimary) {
          const primaryScope = mapping.variantKey ?? "__item__";
          if (primaryScopes.has(primaryScope)) {
            context.addIssue({
              code: "custom",
              path: ["records", recordIndex, "assetMappings", mappingIndex, "isPrimary"],
              message: "В каждой области разрешено только одно primary image.",
            });
          }
          primaryScopes.add(primaryScope);
        }
      }
    }
  });

export const importPreviewSchema = z
  .object({ expectedVersion: z.number().int().positive() })
  .strict();

export const importConfirmSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    expectedRevision: z.number().int().positive(),
    expectedManifestHash: z.string().regex(/^[a-f0-9]{64}$/u),
    idempotencyKey: z.string().trim().min(16).max(128),
  })
  .strict();

export const importRetrySchema = z
  .object({ expectedVersion: z.number().int().positive() })
  .strict();

export type ImportSessionState =
  | "awaiting_upload"
  | "uploaded"
  | "parsing"
  | "review"
  | "ready"
  | "committing"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled"
  | "cleaning";

export function importStateLabel(state: ImportSessionState): string {
  const labels: Record<ImportSessionState, string> = {
    awaiting_upload: "Ожидает загрузки",
    uploaded: "Загрузка завершена",
    parsing: "Подготавливаем",
    review: "Нужно проверить",
    ready: "Предпросмотр запечатан",
    committing: "Подтверждаем импорт",
    completed: "Импорт завершён",
    partial: "Импорт завершён частично",
    failed: "Требуется повтор",
    cancelled: "Отменён",
    cleaning: "Удаляем временные данные",
  };
  return labels[state];
}
