import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  acceptedMediaTypes,
  MEDIA_MAX_BYTES,
  mediaStateLabel,
  uploadIntentSchema,
} from "../../src/modules/media/model";
import { detectMediaMagic, validateMediaBuffer } from "../../src/modules/media/validation";

describe("private media contract", () => {
  it("accepts only JPEG, PNG and WebP intent MIME types within 16 MiB", () => {
    for (const declaredMimeType of acceptedMediaTypes) {
      expect(
        uploadIntentSchema.safeParse({
          itemId: crypto.randomUUID(),
          originalFilename: "photo.bin",
          declaredMimeType,
          declaredByteSize: MEDIA_MAX_BYTES,
          idempotencyKey: crypto.randomUUID(),
        }).success,
      ).toBe(true);
    }
    for (const declaredMimeType of [
      "image/heic",
      "image/heif",
      "image/svg+xml",
      "image/gif",
      "image/avif",
      "application/pdf",
    ]) {
      expect(
        uploadIntentSchema.safeParse({
          itemId: crypto.randomUUID(),
          originalFilename: "blocked",
          declaredMimeType,
          declaredByteSize: 10,
          idempotencyKey: crypto.randomUUID(),
        }).success,
      ).toBe(false);
    }
  });

  it("rejects browser-controlled ownership fields instead of accepting them", () => {
    expect(
      uploadIntentSchema.safeParse({
        itemId: crypto.randomUUID(),
        originalFilename: "photo.png",
        declaredMimeType: "image/png",
        declaredByteSize: 10,
        idempotencyKey: crypto.randomUUID(),
        account_id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        owner_id: crypto.randomUUID(),
      }).success,
    ).toBe(false);
  });

  it("detects supported magic bytes independently of declared MIME", () => {
    expect(detectMediaMagic(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg");
    expect(detectMediaMagic(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      "image/png",
    );
    expect(detectMediaMagic(Buffer.from("RIFF0000WEBP", "ascii"))).toBe("image/webp");
  });

  it.each([
    ["HEIC", Buffer.from("0000ftypheic", "ascii")],
    ["HEIF", Buffer.from("0000ftypheif", "ascii")],
    ["AVIF", Buffer.from("0000ftypavif", "ascii")],
    ["SVG", Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>")],
    ["GIF", Buffer.from("GIF89a", "ascii")],
    ["PDF", Buffer.from("%PDF-1.7", "ascii")],
  ])("rejects unsupported %s magic", (_label, fixture) => {
    expect(detectMediaMagic(fixture)).toBe("unsupported");
  });

  it("quarantines a declared MIME and magic mismatch", async () => {
    const png = await sharp({
      create: { width: 2, height: 2, channels: 3, background: "#336655" },
    })
      .png()
      .toBuffer();
    await expect(validateMediaBuffer(png, "image/jpeg")).resolves.toEqual({
      valid: false,
      quarantine: true,
      failureCode: "mime_magic_mismatch",
    });
  });

  it("fully decodes a valid image and records verified metadata", async () => {
    const webp = await sharp({
      create: { width: 7, height: 5, channels: 3, background: "#336655" },
    })
      .webp()
      .toBuffer();
    const result = await validateMediaBuffer(webp, "image/webp");
    expect(result).toMatchObject({ valid: true, mimeType: "image/webp", width: 7, height: 5 });
    if (result.valid) expect(result.contentHash).toMatch(/^\\x[0-9a-f]{64}$/u);
  });

  it("quarantines corrupt bytes carrying a supported magic prefix", async () => {
    await expect(
      validateMediaBuffer(Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]), "image/jpeg"),
    ).resolves.toMatchObject({ valid: false, quarantine: true, failureCode: "decode_failed" });
  });

  it("rejects an excessive axis before media can become ready", async () => {
    const tooWide = await sharp({
      create: { width: 12_001, height: 1, channels: 3, background: "#000000" },
    })
      .png()
      .toBuffer();
    await expect(validateMediaBuffer(tooWide, "image/png")).resolves.toMatchObject({
      valid: false,
      failureCode: "pixel_budget_exceeded",
    });
  });

  it("exposes distinct accessible lifecycle copy", () => {
    expect(mediaStateLabel("ready", null)).toBe("Готово");
    expect(mediaStateLabel("quarantined", "decode_failed")).toContain("изолирован");
    expect(mediaStateLabel("failed", "unsupported_format")).toContain("не поддерживается");
    expect(mediaStateLabel("processing", null)).toContain("Готовим");
  });
});
