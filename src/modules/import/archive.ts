import { inflateRawSync } from "node:zlib";

import {
  IMPORT_MAX_ARCHIVE_COMPRESSION_RATIO,
  IMPORT_MAX_ENTRIES,
  IMPORT_MAX_ENTRY_COMPRESSION_RATIO,
  IMPORT_MAX_ENTRY_BYTES,
  IMPORT_MAX_EXPANDED_BYTES,
  IMPORT_MAX_PATH_BYTES,
  IMPORT_MAX_PATH_DEPTH,
} from "./model";

export type ZipImageEntry = Readonly<{
  ordinal: number;
  privateName: string;
  bytes: Buffer;
}>;

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

function archiveError(code: string): never {
  throw new Error(code);
}

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

function safePath(name: string): boolean {
  if (
    !name ||
    /[\u0000-\u001f\u007f]/u.test(name) ||
    name.startsWith("/") ||
    name.startsWith("\\")
  ) {
    return false;
  }
  if (/^[a-z]:/iu.test(name)) return false;
  const segments = name.replaceAll("\\", "/").split("/");
  return (
    segments.length <= IMPORT_MAX_PATH_DEPTH &&
    Buffer.byteLength(name.normalize("NFC"), "utf8") <= IMPORT_MAX_PATH_BYTES &&
    !segments.some((segment) => segment === ".." || segment === "." || segment === "")
  );
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const floor = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= floor; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD) return offset;
  }
  return archiveError("zip_eocd_missing");
}

export function* iterateImageOnlyZip(buffer: Buffer): Generator<ZipImageEntry> {
  if (buffer.length < 22) archiveError("zip_too_small");
  const eocd = findEndOfCentralDirectory(buffer);
  const disk = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const diskCount = buffer.readUInt16LE(eocd + 8);
  const count = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  const archiveCommentLength = buffer.readUInt16LE(eocd + 20);
  if (
    disk !== 0 ||
    centralDisk !== 0 ||
    diskCount !== count ||
    count === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    archiveError("zip64_or_multidisk_rejected");
  }
  if (eocd + 22 + archiveCommentLength !== buffer.length) archiveError("zip_eocd_bounds");
  if (count < 1 || count > IMPORT_MAX_ENTRIES) archiveError("zip_entry_limit");
  if (centralOffset + centralSize > eocd) archiveError("zip_central_bounds");

  const normalizedPaths = new Set<string>();
  let rootDirectory: string | null = null;
  let cursor = centralOffset;
  let expandedTotal = 0;
  let compressedTotal = 0;
  for (let ordinal = 0; ordinal < count; ordinal += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== CENTRAL) {
      archiveError("zip_central_corrupt");
    }
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const expectedCrc = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const expandedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const externalAttributes = buffer.readUInt32LE(cursor + 38);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const end = cursor + 46 + nameLength + extraLength + commentLength;
    if (end > buffer.length) archiveError("zip_central_bounds");
    const centralName = buffer.subarray(cursor + 46, cursor + 46 + nameLength);
    const name = centralName.toString("utf8");
    const unixMode = (externalAttributes >>> 16) & 0xffff;
    const fileType = unixMode & 0xf000;
    if ((flags & 1) !== 0) archiveError("zip_encrypted_rejected");
    if (name.includes("\ufffd")) archiveError("zip_filename_encoding");
    if (!safePath(name)) archiveError("zip_path_traversal");
    const normalizedPath = name.replaceAll("\\", "/").normalize("NFC").toLocaleLowerCase("en-US");
    if (normalizedPaths.has(normalizedPath)) archiveError("zip_duplicate_path");
    normalizedPaths.add(normalizedPath);
    if (!normalizedPath.includes("/")) archiveError("zip_root_required");
    const entryRoot = normalizedPath.split("/", 1)[0] ?? "";
    rootDirectory ??= entryRoot;
    if (rootDirectory !== entryRoot) archiveError("zip_multiple_roots");
    if (name.endsWith("/")) archiveError("zip_directory_entry_rejected");
    if (fileType !== 0 && fileType !== 0x8000) archiveError("zip_link_or_device_rejected");
    if ((unixMode & 0o111) !== 0) archiveError("zip_executable_rejected");
    if (/\.(?:zip|7z|rar|tar|gz|bz2|xz)$/iu.test(name)) archiveError("nested_archive_rejected");
    if (!/\.(?:jpe?g|png)$/iu.test(name)) archiveError("non_image_entry_rejected");
    if (method !== 0 && method !== 8) archiveError("zip_compression_rejected");
    if (expandedSize <= 0 || expandedSize > IMPORT_MAX_ENTRY_BYTES) {
      archiveError("zip_entry_size_limit");
    }
    if (
      compressedSize === 0 ||
      expandedSize / compressedSize > IMPORT_MAX_ENTRY_COMPRESSION_RATIO
    ) {
      archiveError("zip_compression_ratio_limit");
    }
    expandedTotal += expandedSize;
    compressedTotal += compressedSize;
    if (expandedTotal > IMPORT_MAX_EXPANDED_BYTES) archiveError("zip_expanded_size_limit");
    if (expandedTotal / compressedTotal > IMPORT_MAX_ARCHIVE_COMPRESSION_RATIO) {
      archiveError("zip_archive_ratio_limit");
    }
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== LOCAL) {
      archiveError("zip_local_corrupt");
    }
    const localFlags = buffer.readUInt16LE(localOffset + 6);
    const localMethod = buffer.readUInt16LE(localOffset + 8);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const localNameStart = localOffset + 30;
    const localNameEnd = localNameStart + localNameLength;
    if (
      localNameEnd + localExtraLength > buffer.length ||
      localFlags !== flags ||
      localMethod !== method ||
      localNameLength !== nameLength ||
      !buffer.subarray(localNameStart, localNameEnd).equals(centralName)
    ) {
      archiveError("zip_local_mismatch");
    }
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > centralOffset) archiveError("zip_entry_bounds");
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let bytes: Buffer;
    try {
      bytes =
        method === 0
          ? Buffer.from(compressed)
          : inflateRawSync(compressed, { maxOutputLength: expandedSize });
    } catch {
      archiveError("zip_integrity_failed");
    }
    if (bytes.length !== expandedSize || crc32(bytes) !== expectedCrc) {
      archiveError("zip_integrity_failed");
    }
    yield { ordinal, privateName: name, bytes };
    cursor = end;
  }
  if (cursor !== centralOffset + centralSize) archiveError("zip_central_size_mismatch");
}

export function readImageOnlyZip(buffer: Buffer): ZipImageEntry[] {
  return [...iterateImageOnlyZip(buffer)];
}
