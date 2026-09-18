import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { importResolutionSchema } from "@/modules/import/model";
import { replaceImportResolution } from "@/modules/import/server/import-capability";
import {
  importErrorResponse,
  importPrivateHeaders,
  requireImportMutationAccount,
} from "@/modules/import/server/import-http";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const accountId = await requireImportMutationAccount();
    const sessionId = z
      .string()
      .uuid()
      .safeParse((await params).sessionId);
    const input = importResolutionSchema.safeParse(await request.json());
    if (!sessionId.success || !input.success) {
      throw new ApplicationError("validation", "Проверьте решения импорта.");
    }
    const version = await replaceImportResolution(accountId, sessionId.data, input.data);
    return NextResponse.json({ version, state: "review" }, { headers: importPrivateHeaders });
  } catch (error) {
    return importErrorResponse(error);
  }
}
