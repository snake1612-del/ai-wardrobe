import { createHash } from "node:crypto";

import sharp from "sharp";

import { MEDIA_MAX_AXIS, MEDIA_MAX_BYTES, MEDIA_MAX_PIXELS, type AcceptedMediaType } from "./model";

export type MediaValidationResult =
  | Readonly<{
      valid: true;
      mimeType: AcceptedMediaType;
      byteSize: number;
      width: number;
      height: number;
      contentHash: string;
    }>
  | Readonly<{
      valid: false;
      quarantine: boolean;
      failureCode: string;
    }>;

function startsWith(buffer: Buffer, bytes: readonly number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

export function detectMediaMagic(buffer: Buffer): AcceptedMediaType | "unsupported" | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  const prefix = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  const brand = buffer.subarray(4, 12).toString("ascii").toLowerCase();
  if (
    prefix.startsWith("<svg") ||
    prefix.startsWith("<?xml") ||
    prefix.startsWith("%pdf") ||
    buffer.subarray(0, 6).toString("ascii").startsWith("GIF8") ||
    brand.includes("ftyp")
  ) {
    return "unsupported";
  }
  return null;
}

export async function validateMediaBuffer(
  buffer: Buffer,
  declaredMimeType?: string | null,
): Promise<MediaValidationResult> {
  if (buffer.length === 0 || buffer.length > MEDIA_MAX_BYTES) {
    return { valid: false, quarantine: false, failureCode: "invalid_byte_size" };
  }
  const detected = detectMediaMagic(buffer);
  if (detected === "unsupported") {
    return { valid: false, quarantine: false, failureCode: "unsupported_format" };
  }
  if (!detected || (declaredMimeType && declaredMimeType !== detected)) {
    return { valid: false, quarantine: true, failureCode: "mime_magic_mismatch" };
  }
  try {
    const decoder = sharp(buffer, {
      failOn: "error",
      limitInputPixels: MEDIA_MAX_PIXELS,
      sequentialRead: true,
    });
    const metadata = await decoder.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if ((metadata.pages ?? 1) !== 1) {
      return { valid: false, quarantine: false, failureCode: "multiple_frames" };
    }
    if (
      width <= 0 ||
      height <= 0 ||
      width > MEDIA_MAX_AXIS ||
      height > MEDIA_MAX_AXIS ||
      width * height > MEDIA_MAX_PIXELS
    ) {
      return { valid: false, quarantine: false, failureCode: "pixel_budget_exceeded" };
    }
    await decoder.clone().rotate().toColorspace("srgb").raw().toBuffer();
    return {
      valid: true,
      mimeType: detected,
      byteSize: buffer.length,
      width,
      height,
      contentHash: `\\x${createHash("sha256").update(buffer).digest("hex")}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return {
      valid: false,
      quarantine: !message.includes("pixel limit"),
      failureCode: message.includes("pixel limit") ? "pixel_budget_exceeded" : "decode_failed",
    };
  }
}
