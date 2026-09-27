import { NextResponse } from "next/server";
import { z } from "zod";

import { importErrorResponse, importPrivateHeaders } from "@/modules/import/server/import-http";
import { getImportProgress } from "@/modules/import/server/import-progress";
import { resolveAccountContext } from "@/modules/account/server/account-context";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const resolution = await resolveAccountContext();
    if (resolution.status === "anonymous") {
      throw new ApplicationError("unauthenticated", "Войдите в аккаунт.");
    }
    if (resolution.status !== "ready") {
      throw new ApplicationError("transient_dependency", "Аккаунт временно недоступен.");
    }
    const sessionId = z
      .string()
      .uuid()
      .safeParse((await params).sessionId);
    if (!sessionId.success) throw new ApplicationError("not_found", "Импорт недоступен.");
    const progress = await getImportProgress(resolution.context.accountId, sessionId.data);
    return NextResponse.json(progress, { headers: importPrivateHeaders });
  } catch (error) {
    return importErrorResponse(error);
  }
}
