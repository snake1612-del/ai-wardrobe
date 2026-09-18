import { deflateRawSync } from "node:zlib";

import sharp from "sharp";

export const syntheticImportScenarios = Object.freeze([
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
] as const);

const fixtureAssetIds = Object.freeze({
  ordinaryFront: "00000000-0000-4000-8000-000000000101",
  ordinaryBack: "00000000-0000-4000-8000-000000000102",
  variant: "00000000-0000-4000-8000-000000000103",
  physicalSet: "00000000-0000-4000-8000-000000000104",
  orphan: "00000000-0000-4000-8000-000000000105",
});

export const syntheticImportContractFixture = Object.freeze({
  resolution: {
    expectedVersion: 1,
    records: [
      {
        sourceRecordKey: "fictional-ordinary-item",
        action: "create" as const,
        displayName: "Fictional everyday jacket",
        physicalSet: false,
        variants: [],
        assetMappings: [
          {
            assetId: fixtureAssetIds.ordinaryFront,
            role: "catalog" as const,
            view: "front" as const,
            isPrimary: true,
          },
          {
            assetId: fixtureAssetIds.ordinaryBack,
            role: "catalog" as const,
            view: "back" as const,
            isPrimary: false,
          },
        ],
      },
      {
        sourceRecordKey: "fictional-appearance-variant",
        action: "create" as const,
        displayName: "Fictional reversible layer",
        physicalSet: false,
        variants: [{ key: "inside", label: "Inside", isDefault: true, position: 0 }],
        assetMappings: [
          {
            assetId: fixtureAssetIds.variant,
            role: "catalog" as const,
            view: "front" as const,
            variantKey: "inside",
            isPrimary: true,
          },
        ],
      },
      {
        sourceRecordKey: "fictional-physical-set",
        action: "create" as const,
        displayName: "Fictional two-piece set",
        physicalSet: true,
        variants: [],
        assetMappings: [
          {
            assetId: fixtureAssetIds.physicalSet,
            role: "evidence_source" as const,
            view: "unspecified" as const,
            isPrimary: false,
          },
        ],
      },
    ],
    skippedAssetIds: [fixtureAssetIds.orphan],
  },
  issues: [
    "asset_exact_duplicate",
    "asset_probable_duplicate",
    "record_name_missing",
    "asset_unassigned",
    "asset_declared_missing",
    "asset_decode_failed",
    "target_version_changed",
    "history_evidence_absent",
  ] as const,
  updateConflict: {
    targetItemId: "00000000-0000-4000-8000-000000000201",
    expectedItemVersion: 3,
    observedItemVersion: 4,
    issue: "target_version_changed" as const,
  },
  usageNoteEvidence: {
    text: "Fictional observation without a date or independent wear evidence.",
    createsWearEvent: false,
  },
});

export type SyntheticZipEntry = Readonly<{
  name: string;
  bytes: Buffer;
  method?: 0 | 8;
  flags?: number;
  unixMode?: number;
}>;

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createSyntheticZip(entries: SyntheticZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const method = entry.method ?? 8;
    const compressed = method === 8 ? deflateRawSync(entry.bytes) : entry.bytes;
    const checksum = crc32(entry.bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE((entry.flags ?? 0) | 0x800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x031e, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE((entry.flags ?? 0) | 0x800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(((entry.unixMode ?? 0o100644) << 16) >>> 0, 38);
    central.writeUInt32LE(localOffset, 42);
    centrals.push(central, name);
    localOffset += local.length + name.length + compressed.length;
  }
  const centralBytes = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBytes.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...locals, centralBytes, eocd]);
}

export async function createSyntheticImportFixture(): Promise<Buffer> {
  const ordinaryFront = await sharp({
    create: { width: 8, height: 6, channels: 3, background: "#325d88" },
  })
    .jpeg()
    .toBuffer();
  const ordinaryBack = await sharp({
    create: { width: 8, height: 6, channels: 3, background: "#294e73" },
  })
    .jpeg()
    .toBuffer();
  const variant = await sharp({
    create: { width: 8, height: 6, channels: 3, background: "#a05a75" },
  })
    .png()
    .toBuffer();
  const probable = await sharp({
    create: { width: 8, height: 6, channels: 3, background: "#425d88" },
  })
    .jpeg()
    .toBuffer();
  const physicalSet = await sharp({
    create: { width: 8, height: 6, channels: 3, background: "#4c7f55" },
  })
    .jpeg()
    .toBuffer();
  const orphan = await sharp({
    create: { width: 8, height: 6, channels: 3, background: "#8a7045" },
  })
    .png()
    .toBuffer();
  return createSyntheticZip([
    { name: "fictional/ordinary_front.jpg", bytes: ordinaryFront },
    { name: "fictional/ordinary_back.jpg", bytes: ordinaryBack },
    { name: "fictional/variant_catalog.png", bytes: variant },
    { name: "fictional/exact_duplicate.jpg", bytes: ordinaryFront },
    { name: "fictional/probable_duplicate.jpg", bytes: probable },
    { name: "fictional/physical_set.jpg", bytes: physicalSet },
    { name: "fictional/orphan_asset.png", bytes: orphan },
  ]);
}

export function createSyntheticCorruptAssetFixture(): Buffer {
  return createSyntheticZip([
    {
      name: "fictional/corrupt_asset.jpg",
      bytes: Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02, 0x03]),
    },
  ]);
}
