import * as tus from "tus-js-client";

export const IMPORT_TUS_CHUNK_SIZE = 6 * 1024 * 1024;

export type ImportUploadSelection = Readonly<{
  files: readonly File[];
  idempotencyKey: string;
}>;

export function retainImportUploadSelection(
  previous: ImportUploadSelection | null,
  files: readonly File[],
  createKey: () => string = () => crypto.randomUUID(),
): ImportUploadSelection {
  if (
    previous?.files.length === files.length &&
    files.every((file, index) => file === previous.files[index])
  ) {
    return previous;
  }
  return { files: [...files], idempotencyKey: createKey() };
}

export async function shouldTransferImportPart(
  state: string,
  retrying: boolean,
  completeExisting: () => Promise<Response>,
): Promise<boolean> {
  if (state === "uploaded" || state === "prepared") return false;
  if (!retrying) return true;
  const recovery = await completeExisting();
  if (recovery.ok) return false;
  if (recovery.status === 503) return true;
  throw new Error("Загрузка не подтверждена.");
}

export type SafeImportTusFailure = Readonly<{
  status: number | null;
  errorCode: string;
  durationMs: number;
  byteSize: number;
  stage: "storage_tus";
}>;

const knownStorageCodes = new Set([
  "AccessDenied",
  "AssetAlreadyExists",
  "BucketNotFound",
  "EntityTooLarge",
  "InvalidJWT",
  "InvalidMimeType",
  "KeyAlreadyExists",
  "PayloadTooLarge",
  "Unauthorized",
]);

export function safeImportTusFailure(
  error: unknown,
  byteSize: number,
  durationMs: number,
): SafeImportTusFailure {
  const response =
    typeof error === "object" && error !== null && "originalResponse" in error
      ? error.originalResponse
      : null;
  const observedStatus =
    response &&
    typeof response === "object" &&
    "getStatus" in response &&
    typeof response.getStatus === "function"
      ? response.getStatus()
      : null;
  let errorCode = "StorageUnknown";
  if (
    response &&
    typeof response === "object" &&
    "getBody" in response &&
    typeof response.getBody === "function"
  ) {
    try {
      const body: unknown = JSON.parse(String(response.getBody()));
      if (body && typeof body === "object") {
        const code = "code" in body ? body.code : "errorCode" in body ? body.errorCode : null;
        if (typeof code === "string" && knownStorageCodes.has(code)) errorCode = code;
      }
    } catch {
      // The response may contain private paths. Never log or return its body.
    }
  }
  return {
    status:
      typeof observedStatus === "number" &&
      Number.isInteger(observedStatus) &&
      observedStatus >= 100 &&
      observedStatus <= 599
        ? observedStatus
        : null,
    errorCode,
    durationMs: Math.max(0, Math.round(durationMs)),
    byteSize,
    stage: "storage_tus",
  };
}

type UploadOperation = Pick<tus.Upload, "start" | "abort">;
type UploadFactory = (file: File, options: tus.UploadOptions) => UploadOperation;

export function transferImportPart(
  file: File,
  input: Readonly<{
    endpoint: string;
    accessToken: string;
    apiKey: string;
    bucket: string;
    objectKey: string;
    onProgress: (uploaded: number, total: number) => void;
    onFailure: (failure: SafeImportTusFailure) => void;
    setCancel: (cancel: (() => void) | null) => void;
  }>,
  createUpload: UploadFactory = (source, options) => new tus.Upload(source, options),
  now: () => number = () => performance.now(),
): Promise<void> {
  const startedAt = now();
  return new Promise((resolve, reject) => {
    try {
      const operation = createUpload(file, {
        endpoint: input.endpoint,
        chunkSize: IMPORT_TUS_CHUNK_SIZE,
        retryDelays: [0, 1_000, 3_000, 5_000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        storeFingerprintForResuming: false,
        headers: {
          authorization: "Bearer " + input.accessToken,
          apikey: input.apiKey,
        },
        metadata: {
          bucketName: input.bucket,
          objectName: input.objectKey,
          contentType: "application/zip",
          cacheControl: "0",
        },
        onError: (error) => {
          input.setCancel(null);
          input.onFailure(safeImportTusFailure(error, file.size, now() - startedAt));
          reject(new Error("Не удалось передать архив. Повторите загрузку."));
        },
        onProgress: input.onProgress,
        onSuccess: () => {
          input.setCancel(null);
          resolve();
        },
      });
      input.setCancel(() => {
        void operation.abort().finally(() => reject(new Error("upload_cancelled")));
      });
      operation.start();
    } catch (error) {
      input.setCancel(null);
      input.onFailure(safeImportTusFailure(error, file.size, now() - startedAt));
      reject(new Error("Не удалось передать архив. Повторите загрузку."));
    }
  });
}
