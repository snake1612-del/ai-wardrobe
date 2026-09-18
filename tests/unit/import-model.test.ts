import { describe, expect, it } from "vitest";

import { readImageOnlyZip } from "../../src/modules/import/archive";
import { validateMediaBuffer } from "../../src/modules/media/validation";
import {
  importIntentSchema,
  importIssueCodes,
  importResolutionSchema,
  importStateLabel,
} from "../../src/modules/import/model";
import {
  createSyntheticImportFixture,
  createSyntheticCorruptAssetFixture,
  createSyntheticZip,
  syntheticImportContractFixture,
  syntheticImportScenarios,
} from "../fixtures/bulk-import/synthetic-fixture";

describe("Bulk Import contract", () => {
  it("keeps the synthetic fixture representative and entirely fictional", () => {
    expect(syntheticImportScenarios).toEqual(
      expect.arrayContaining([
        "ordinary_item_views",
        "appearance_variant",
        "physical_set",
        "exact_duplicate",
        "probable_duplicate",
        "unresolved_metadata",
        "orphan_asset",
        "missing_asset",
        "corrupt_asset",
        "explicit_update_conflict",
        "usage_note_without_wear_event",
      ]),
    );
    expect(importIssueCodes).toContain("target_version_changed");
    expect(importIssueCodes).toContain("asset_decode_failed");
  });

  it("parses the executable image-only ZIP fixture without using names as identity", async () => {
    const entries = readImageOnlyZip(await createSyntheticImportFixture());
    expect(entries).toHaveLength(7);
    expect(entries.map(({ ordinal }) => ordinal)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(entries[0]?.bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });

  it("executes the fictional Resolve, issue, conflict and no-WearEvent contract fixture", async () => {
    expect(
      importResolutionSchema.safeParse(syntheticImportContractFixture.resolution).success,
    ).toBe(true);
    expect(syntheticImportContractFixture.resolution.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ physicalSet: true }),
        expect.objectContaining({ variants: [expect.objectContaining({ key: "inside" })] }),
      ]),
    );
    expect(syntheticImportContractFixture.issues).toEqual(
      expect.arrayContaining([
        "asset_unassigned",
        "asset_declared_missing",
        "asset_decode_failed",
        "target_version_changed",
        "history_evidence_absent",
      ]),
    );
    expect(syntheticImportContractFixture.updateConflict.observedItemVersion).toBeGreaterThan(
      syntheticImportContractFixture.updateConflict.expectedItemVersion,
    );
    expect(syntheticImportContractFixture.usageNoteEvidence.createsWearEvent).toBe(false);

    const [corruptEntry] = readImageOnlyZip(createSyntheticCorruptAssetFixture());
    expect(corruptEntry).toBeDefined();
    const validation = await validateMediaBuffer(corruptEntry!.bytes, "image/jpeg");
    expect(validation).toMatchObject({ valid: false, failureCode: "decode_failed" });
  });

  it("rejects browser-controlled ownership in strict intent and resolution inputs", () => {
    expect(
      importIntentSchema.safeParse({
        parts: [{ byteSize: 100 }],
        idempotencyKey: crypto.randomUUID(),
        account_id: crypto.randomUUID(),
      }).success,
    ).toBe(false);
    expect(
      importResolutionSchema.safeParse({
        expectedVersion: 1,
        records: [],
        skippedAssetIds: [],
        owner_id: crypto.randomUUID(),
      }).success,
    ).toBe(false);
  });

  it("requires an explicit owner-scoped target and version for updates", () => {
    const base = {
      expectedVersion: 1,
      records: [
        {
          sourceRecordKey: "resolved-1",
          action: "update",
          displayName: "Fictional coat",
          variants: [],
          assetMappings: [
            {
              assetId: crypto.randomUUID(),
              role: "catalog",
              view: "front",
              isPrimary: true,
            },
          ],
        },
      ],
      skippedAssetIds: [],
    };
    expect(importResolutionSchema.safeParse(base).success).toBe(false);
    expect(
      importResolutionSchema.safeParse({
        ...base,
        records: [
          {
            ...base.records[0],
            targetItemId: crypto.randomUUID(),
            expectedItemVersion: 2,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects ambiguous variants, primary mappings and skipped assignments", () => {
    const assetA = crypto.randomUUID();
    const assetB = crypto.randomUUID();
    const common = {
      expectedVersion: 1,
      skippedAssetIds: [],
    };
    expect(
      importResolutionSchema.safeParse({
        ...common,
        records: [
          {
            sourceRecordKey: "duplicate-variants",
            action: "create",
            displayName: "Fictional jacket",
            variants: [
              { key: "outer", label: "Blue", isDefault: true, position: 0 },
              { key: "outer", label: "BLUE", isDefault: true, position: 1 },
            ],
            assetMappings: [
              { assetId: assetA, role: "catalog", view: "front", isPrimary: true },
              { assetId: assetB, role: "catalog", view: "back", isPrimary: true },
            ],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      importResolutionSchema.safeParse({
        ...common,
        records: [
          {
            sourceRecordKey: "skipped-with-image",
            action: "skip",
            variants: [],
            assetMappings: [{ assetId: assetA, role: "catalog", view: "front", isPrimary: false }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("keeps ImageView and AppearanceVariant as different mapping dimensions", () => {
    const assetId = crypto.randomUUID();
    const parsed = importResolutionSchema.parse({
      expectedVersion: 1,
      records: [
        {
          sourceRecordKey: "resolved-variant",
          action: "create",
          displayName: "Fictional reversible coat",
          physicalSet: true,
          variants: [{ key: "inside", label: "Inside", isDefault: true, position: 0 }],
          assetMappings: [
            {
              assetId,
              role: "catalog",
              view: "back",
              variantKey: "inside",
              isPrimary: true,
            },
          ],
        },
      ],
      skippedAssetIds: [],
    });
    expect(parsed.records[0]?.assetMappings[0]).toMatchObject({
      view: "back",
      variantKey: "inside",
    });
    expect(parsed.records[0]?.physicalSet).toBe(true);
  });

  it.each([
    ["path traversal", "../escape.jpg", 0o100644, "zip_path_traversal"],
    ["nested archive", "fictional/payload.zip", 0o100644, "nested_archive_rejected"],
    ["symlink", "fictional/link.jpg", 0o120777, "zip_link_or_device_rejected"],
    ["executable", "fictional/run.jpg", 0o100755, "zip_executable_rejected"],
  ])("rejects %s entries before extraction", (_label, name, unixMode, code) => {
    const archive = createSyntheticZip([{ name, unixMode, bytes: Buffer.from("not-executed") }]);
    expect(() => readImageOnlyZip(archive)).toThrow(code);
  });

  it("rejects encrypted and corrupt archives", () => {
    const encrypted = createSyntheticZip([
      { name: "fictional/encrypted.jpg", bytes: Buffer.from("encrypted"), flags: 1 },
    ]);
    expect(() => readImageOnlyZip(encrypted)).toThrow("zip_encrypted_rejected");
    const corrupt = Buffer.from(
      createSyntheticZip([{ name: "fictional/corrupt.jpg", bytes: Buffer.from("jpeg") }]),
    );
    const dataOffset = 30 + corrupt.readUInt16LE(26) + corrupt.readUInt16LE(28);
    corrupt[dataOffset] = (corrupt[dataOffset] ?? 0) ^ 0xff;
    expect(() => readImageOnlyZip(corrupt)).toThrow();
  });

  it("rejects central/local header mismatches and bounds decompression output", () => {
    const mismatched = Buffer.from(
      createSyntheticZip([{ name: "fictional/view.jpg", bytes: Buffer.from("fictional-image") }]),
    );
    mismatched.writeUInt16LE(0, 8);
    expect(() => readImageOnlyZip(mismatched)).toThrow("zip_local_mismatch");

    const oversized = Buffer.from(
      createSyntheticZip([
        {
          name: "fictional/compressed.jpg",
          bytes: Buffer.alloc(8_192, 0x41),
          method: 8,
        },
      ]),
    );
    const central = oversized.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    expect(central).toBeGreaterThan(0);
    oversized.writeUInt32LE(1, central + 24);
    oversized.writeUInt32LE(1, 22);
    expect(() => readImageOnlyZip(oversized)).toThrow("zip_integrity_failed");
  });

  it("rejects missing roots, normalized collisions and excessive compression ratios", () => {
    expect(() =>
      readImageOnlyZip(
        createSyntheticZip([{ name: "rootless.jpg", bytes: Buffer.from("fictional") }]),
      ),
    ).toThrow("zip_root_required");
    expect(() =>
      readImageOnlyZip(
        createSyntheticZip([
          { name: "fictional/View.jpg", bytes: Buffer.from("first") },
          { name: "fictional/view.jpg", bytes: Buffer.from("second") },
        ]),
      ),
    ).toThrow("zip_duplicate_path");
    expect(() =>
      readImageOnlyZip(
        createSyntheticZip([
          { name: "fictional/bomb.jpg", bytes: Buffer.alloc(8_192, 0), method: 8 },
        ]),
      ),
    ).toThrow("zip_compression_ratio_limit");
  });

  it("exposes distinct loading, review, retry and result labels", () => {
    expect(importStateLabel("parsing")).toContain("Подготавливаем");
    expect(importStateLabel("review")).toContain("проверить");
    expect(importStateLabel("partial")).toContain("частично");
    expect(importStateLabel("completed")).toContain("завершён");
  });
});
