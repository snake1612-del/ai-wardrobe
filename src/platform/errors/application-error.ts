export const applicationErrorCodes = [
  "validation",
  "unauthenticated",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "transient_dependency",
  "internal",
] as const;

export type ApplicationErrorCode = (typeof applicationErrorCodes)[number];

export class ApplicationError extends Error {
  constructor(
    readonly code: ApplicationErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export function toPublicError(error: unknown): { code: ApplicationErrorCode; message: string } {
  if (error instanceof ApplicationError && error.code !== "internal") {
    return { code: error.code, message: error.message };
  }

  return { code: "internal", message: "Не удалось выполнить действие. Попробуйте ещё раз." };
}
