import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  upload: vi.fn(),
  download: vi.fn(),
  logEvent: vi.fn(),
  renew: vi.fn(),
  stage: vi.fn(),
  claim: vi.fn(),
  fail: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../../src/modules/import/server/import-capability", () => ({
  createImportServiceClient: () => ({
    storage: { from: () => ({ upload: storageMocks.upload, download: storageMocks.download }) },
  }),
  renewImportPrepareLease: storageMocks.renew,
  stageImportAsset: storageMocks.stage,
  claimImportJob: storageMocks.claim,
  failImportJob: storageMocks.fail,
}));
vi.mock("../../src/platform/logging/logger", () => ({
  logEvent: storageMocks.logEvent,
}));

import {
  createImportPrepareLeaseGuard,
  stageImportAssetWhileLeased,
  uploadImmutableOriginal,
  runImportWorkerOnce,
} from "../../src/modules/import/server/import-worker";

const key = "synthetic/immutable-original";
const bytes = Buffer.from("entirely-fictional-image-bytes");
const duplicateError = { status: 400, code: "KeyAlreadyExists", message: "PRIVATE_SENTINEL" };

function existingObject(value: Buffer = bytes) {
  return { data: new Blob([Uint8Array.from(value)]), error: null };
}

describe("Bulk Import immutable original upload", () => {
  beforeEach(() => {
    storageMocks.upload.mockReset();
    storageMocks.download.mockReset();
    storageMocks.logEvent.mockReset();
    storageMocks.renew.mockReset();
    storageMocks.stage.mockReset();
    storageMocks.claim.mockReset();
    storageMocks.fail.mockReset();
    storageMocks.renew.mockResolvedValue(true);
    storageMocks.upload.mockResolvedValue({ error: duplicateError });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reconciles KeyAlreadyExists by downloading and hashing the complete existing object", async () => {
    storageMocks.download.mockResolvedValue(existingObject());

    await expect(uploadImmutableOriginal(key, bytes, "image/jpeg")).resolves.toBeUndefined();

    expect(storageMocks.upload).toHaveBeenCalledWith(
      key,
      bytes,
      expect.objectContaining({ upsert: false }),
    );
    expect(storageMocks.download).toHaveBeenCalledExactlyOnceWith(
      key,
      {},
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(storageMocks.logEvent).toHaveBeenCalledWith(
      "warn",
      "import.worker.original_upload_failed",
      { status: 400, errorCode: "KeyAlreadyExists", durationMs: expect.any(Number) },
    );
    expect(JSON.stringify(storageMocks.logEvent.mock.calls)).not.toContain(key);
    expect(JSON.stringify(storageMocks.logEvent.mock.calls)).not.toContain("PRIVATE_SENTINEL");
  });

  it("rejects a same-key object with a different complete SHA-256", async () => {
    storageMocks.download.mockResolvedValue(
      existingObject(Buffer.from("different-fictional-bytes")),
    );

    await expect(uploadImmutableOriginal(key, bytes, "image/jpeg")).rejects.toThrow(
      "import_original_replay_conflict",
    );
    expect(storageMocks.download).toHaveBeenCalledTimes(1);
  });

  it("retries a temporary download 5xx and then verifies the full object", async () => {
    vi.useFakeTimers();
    storageMocks.download
      .mockResolvedValueOnce({ data: null, error: { status: 500, code: "InternalError" } })
      .mockResolvedValueOnce(existingObject());

    const result = expect(
      uploadImmutableOriginal(key, bytes, "image/jpeg"),
    ).resolves.toBeUndefined();
    await vi.runAllTimersAsync();
    await result;

    expect(storageMocks.download).toHaveBeenCalledTimes(2);
    expect(storageMocks.logEvent).toHaveBeenCalledWith(
      "warn",
      "import.worker.original_download_failed",
      { status: 500, errorCode: "InternalError", durationMs: expect.any(Number) },
    );
  });

  it("stops after the bounded number of download 5xx attempts", async () => {
    vi.useFakeTimers();
    storageMocks.download.mockResolvedValue({
      data: null,
      error: { status: 503, code: "UnexpectedError" },
    });

    const result = expect(uploadImmutableOriginal(key, bytes, "image/jpeg")).rejects.toThrow(
      "import_original_download_failed",
    );
    await vi.runAllTimersAsync();
    await result;

    expect(storageMocks.download).toHaveBeenCalledTimes(3);
  });

  it("does not retry an ordinary download 4xx", async () => {
    storageMocks.download.mockResolvedValue({
      data: null,
      error: { status: 403, code: "AccessDenied" },
    });

    await expect(uploadImmutableOriginal(key, bytes, "image/jpeg")).rejects.toThrow(
      "import_original_download_failed",
    );
    expect(storageMocks.download).toHaveBeenCalledTimes(1);
  });

  it("does not download or retry after an ordinary upload 4xx", async () => {
    storageMocks.upload.mockResolvedValue({
      error: { status: 403, code: "AccessDenied", message: "PRIVATE_SENTINEL" },
    });

    await expect(uploadImmutableOriginal(key, bytes, "image/jpeg")).rejects.toThrow(
      "import_original_upload_failed",
    );
    expect(storageMocks.download).not.toHaveBeenCalled();
    expect(storageMocks.logEvent).toHaveBeenCalledWith(
      "warn",
      "import.worker.original_upload_failed",
      { status: 403, errorCode: "AccessDenied", durationMs: expect.any(Number) },
    );
    expect(JSON.stringify(storageMocks.logEvent.mock.calls)).not.toContain("PRIVATE_SENTINEL");
  });
  it("bounds a timed-out download and logs only safe status, code and duration", async () => {
    vi.useFakeTimers();
    vi.spyOn(AbortSignal, "timeout").mockImplementation((milliseconds) => {
      expect(milliseconds).toBe(15_000);
      return AbortSignal.abort();
    });
    storageMocks.download.mockResolvedValue({
      data: null,
      error: { status: 500, code: "InternalError" },
    });

    const result = expect(uploadImmutableOriginal(key, bytes, "image/jpeg")).rejects.toThrow(
      "import_original_download_failed",
    );
    await vi.runAllTimersAsync();
    await result;

    expect(storageMocks.download).toHaveBeenCalledTimes(3);
    expect(storageMocks.logEvent).toHaveBeenCalledWith(
      "warn",
      "import.worker.original_download_failed",
      { status: null, errorCode: "Timeout", durationMs: expect.any(Number) },
    );
  });

  it("renews the owned lease before the 300-second deadline", async () => {
    vi.useFakeTimers();
    const lease = createImportPrepareLeaseGuard("fictional-worker", "fictional-job");
    await lease.renew();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(storageMocks.renew).toHaveBeenCalledTimes(2);
    expect(lease.lost).toBe(false);
    await lease.stop();
  });

  it("aborts an in-flight download when renewal loses the lease", async () => {
    vi.useFakeTimers();
    vi.spyOn(AbortSignal, "timeout").mockImplementation(() => new AbortController().signal);
    storageMocks.renew.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    storageMocks.download.mockImplementation(
      (_objectKey: string, _options: unknown, parameters: { signal: AbortSignal }) =>
        new Promise((resolve) => {
          parameters.signal.addEventListener(
            "abort",
            () => resolve({ data: null, error: { status: 500, code: "InternalError" } }),
            { once: true },
          );
        }),
    );
    const lease = createImportPrepareLeaseGuard("fictional-worker", "fictional-job");
    await lease.renew();
    const result = expect(
      uploadImmutableOriginal(key, bytes, "image/jpeg", lease.signal),
    ).rejects.toThrow("import_prepare_lease_lost");

    await vi.advanceTimersByTimeAsync(60_000);
    await result;
    expect(lease.lost).toBe(true);
    expect(storageMocks.download).toHaveBeenCalledTimes(1);
    await lease.stop();
  });

  it.each(["cancelled session", "restricted account"])("rejects renewal for a %s", async () => {
    storageMocks.renew.mockResolvedValue(false);
    const lease = createImportPrepareLeaseGuard("fictional-worker", "fictional-job");

    await expect(lease.renew()).rejects.toThrow("import_prepare_lease_lost");
    expect(lease.signal.aborted).toBe(true);
    await lease.stop();
  });

  it("starts no Storage or stage write after the lease is lost", async () => {
    storageMocks.renew.mockResolvedValue(false);
    const lease = createImportPrepareLeaseGuard("fictional-worker", "fictional-job");
    await expect(lease.renew()).rejects.toThrow("import_prepare_lease_lost");
    await expect(uploadImmutableOriginal(key, bytes, "image/jpeg", lease.signal)).rejects.toThrow(
      "import_prepare_lease_lost",
    );
    await expect(
      stageImportAssetWhileLeased(lease, "fictional-worker", "fictional-job", {
        assetId: "00000000-0000-0000-0000-000000000996",
        sourceReference: "fictional-reference",
        objectKey: key,
        mimeType: "image/jpeg",
        byteSize: bytes.length,
        contentHash: "00".repeat(32),
        originProposal: "source_candidate",
      }),
    ).rejects.toThrow("import_prepare_lease_lost");

    expect(storageMocks.upload).not.toHaveBeenCalled();
    expect(storageMocks.stage).not.toHaveBeenCalled();
    await lease.stop();
  });

  it("does not mark a lost parse lease as a failed job", async () => {
    storageMocks.claim.mockResolvedValue({
      job_type: "import.parse",
      job_id: "fictional-job",
      account_id: "fictional-account",
      import_session_id: "fictional-session",
    });
    storageMocks.renew.mockResolvedValue(false);

    await expect(runImportWorkerOnce("fictional-worker")).resolves.toBe("idle");
    expect(storageMocks.fail).not.toHaveBeenCalled();
    expect(storageMocks.stage).not.toHaveBeenCalled();
  });
});
