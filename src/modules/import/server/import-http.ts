import "server-only";

import { NextResponse } from "next/server";

import { resolveAccountContext } from "@/modules/account/server/account-context";
import { ApplicationError, toPublicError } from "@/platform/errors/application-error";
import { getTrustedMutationOrigin } from "@/platform/security/server-origin";

export const importPrivateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function requireImportMutationAccount(): Promise<string> {
  if (!(await getTrustedMutationOrigin())) {
    throw new ApplicationError("forbidden", "Запрос не прошёл проверку origin.");
  }
  const resolution = await resolveAccountContext();
  if (resolution.status === "anonymous") {
    throw new ApplicationError("unauthenticated", "Войдите в аккаунт.");
  }
  if (resolution.status !== "ready") {
    throw new ApplicationError("transient_dependency", "Аккаунт временно недоступен.");
  }
  return resolution.context.accountId;
}

export function importErrorResponse(error: unknown): NextResponse {
  const publicError = toPublicError(error);
  const status =
    publicError.code === "unauthenticated"
      ? 401
      : publicError.code === "forbidden"
        ? 403
        : publicError.code === "not_found"
          ? 404
          : publicError.code === "conflict"
            ? 409
            : publicError.code === "validation"
              ? 400
              : 503;
  return NextResponse.json({ error: publicError }, { status, headers: importPrivateHeaders });
}
