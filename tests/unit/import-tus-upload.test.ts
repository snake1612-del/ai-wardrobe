import { describe, expect, it, vi } from "vitest";
import type { UploadOptions } from "tus-js-client";

import {
  IMPORT_TUS_CHUNK_SIZE,
  retainImportUploadSelection,
  safeImportTusFailure,
  shouldTransferImportPart,
  transferImportPart,
} from "../../src/modules/import/import-tus-upload";

const fictionalFile = () =>
  new File([new Uint8Array(42)], "fictional.zip", { type: "application/zip" });

function uploadInput() {
  return {
    endpoint: "https://fictional.example/storage/v1/upload/resumable",
    accessToken: "fictional-access-token",
    apiKey: "fictional-publishable-key",
    bucket: "wardrobe-imports",
    objectKey: "private-object-sentinel",
    onProgress: vi.fn(),
    onFailure: vi.fn(),
    setCancel: vi.fn(),
  };
}

describe("Bulk Import browser TUS transfer", () => {
  it("keeps the same intent key for an unchanged selection and rotates it for changed files", () => {
    const file = fictionalFile();
    const first = retainImportUploadSelection(null, [file], () => "first-fictional-key");
    const retried = retainImportUploadSelection(first, [file], () => "unexpected-key");
    const changed = retainImportUploadSelection(
      first,
      [fictionalFile()],
      () => "second-fictional-key",
    );

    expect(retried).toBe(first);
    expect(changed.idempotencyKey).toBe("second-fictional-key");
  });

  it("uses Supabase's 6 MiB chunks, retains bounded TUS retries and completes", async () => {
    const input = uploadInput();
    let options: UploadOptions | undefined;
    const factory = vi.fn((_file: File, supplied: UploadOptions) => {
      options = supplied;
      return {
        start: () => {
          supplied.onProgress?.(42, 42);
          supplied.onSuccess?.();
        },
        abort: vi.fn(),
      };
    });

    await expect(transferImportPart(fictionalFile(), input, factory)).resolves.toBeUndefined();

    expect(IMPORT_TUS_CHUNK_SIZE).toBe(6 * 1024 * 1024);
    expect(options).toMatchObject({
      chunkSize: IMPORT_TUS_CHUNK_SIZE,
      retryDelays: [0, 1_000, 3_000, 5_000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: false,
      metadata: { contentType: "application/zip", cacheControl: "0" },
    });
    expect(input.onProgress).toHaveBeenCalledWith(42, 42);
    expect(input.onFailure).not.toHaveBeenCalled();
    expect(input.setCancel).toHaveBeenLastCalledWith(null);
  });

  it("reports only allowlisted Storage status and code while showing a generic error", async () => {
    const input = uploadInput();
    const error = {
      message: "private-object-sentinel fictional-access-token fictional.zip",
      originalResponse: {
        getStatus: () => 413,
        getBody: () =>
          JSON.stringify({
            code: "EntityTooLarge",
            message: "private-object-sentinel fictional-access-token fictional.zip",
          }),
      },
    };
    const factory = vi.fn((_file: File, options: UploadOptions) => ({
      start: () => options.onError?.(error as never),
      abort: vi.fn(),
    }));

    await expect(transferImportPart(fictionalFile(), input, factory, () => 1_000)).rejects.toThrow(
      "Не удалось передать архив. Повторите загрузку.",
    );

    expect(input.onFailure).toHaveBeenCalledWith({
      status: 413,
      errorCode: "EntityTooLarge",
      durationMs: 0,
      byteSize: 42,
      stage: "storage_tus",
    });
    const diagnostic = JSON.stringify(input.onFailure.mock.calls);
    expect(diagnostic).not.toContain("private-object-sentinel");
    expect(diagnostic).not.toContain("fictional-access-token");
    expect(diagnostic).not.toContain("fictional.zip");
  });

  it("does not expose a synchronous TUS exception to the user", async () => {
    const input = uploadInput();
    const factory = vi.fn((): never => {
      throw new Error("private-object-sentinel fictional-access-token fictional.zip");
    });

    await expect(transferImportPart(fictionalFile(), input, factory)).rejects.toThrow(
      "Не удалось передать архив. Повторите загрузку.",
    );
    expect(JSON.stringify(input.onFailure.mock.calls)).not.toContain("private-object-sentinel");
    expect(JSON.stringify(input.onFailure.mock.calls)).not.toContain("fictional-access-token");
  });

  it("never echoes unknown Storage codes or response bodies", () => {
    const result = safeImportTusFailure(
      {
        originalResponse: {
          getStatus: () => 403,
          getBody: () =>
            JSON.stringify({ code: "private-object-sentinel", message: "fictional.zip" }),
        },
      },
      42,
      15.8,
    );
    expect(result).toEqual({
      status: 403,
      errorCode: "StorageUnknown",
      durationMs: 16,
      byteSize: 42,
      stage: "storage_tus",
    });
  });

  it("reuses completed parts, reconciles an existing object, and retries an absent object", async () => {
    const complete = vi.fn();
    expect(await shouldTransferImportPart("uploaded", true, complete)).toBe(false);
    expect(await shouldTransferImportPart("prepared", true, complete)).toBe(false);
    expect(await shouldTransferImportPart("awaiting_upload", false, complete)).toBe(true);
    expect(complete).not.toHaveBeenCalled();

    complete.mockResolvedValueOnce({ ok: true });
    expect(await shouldTransferImportPart("awaiting_upload", true, complete)).toBe(false);
    complete.mockResolvedValueOnce({ ok: false, status: 503 });
    expect(await shouldTransferImportPart("awaiting_upload", true, complete)).toBe(true);
    complete.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(shouldTransferImportPart("awaiting_upload", true, complete)).rejects.toThrow(
      "Загрузка не подтверждена.",
    );
  });
});
