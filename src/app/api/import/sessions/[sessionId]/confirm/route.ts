import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { importConfirmSchema } from "@/modules/import/model";
import { confirmImport } from "@/modules/import/server/import-capability";
import {
  importErrorResponse,
  importPrivateHeaders,
  requireImportMutationAccount,
} from "@/modules/import/server/import-http";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const accountId = await requireImportMutationAccount();
    const sessionId = z
      .string()
      .uuid()
      .safeParse((await params).sessionId);
    const input = importConfirmSchema.safeParse(await request.json());
    if (!sessionId.success || !input.success) {
      throw new ApplicationError("validation", "Подтверждение не соответствует предпросмотру.");
    }
    const result = await confirmImport(accountId, sessionId.data, input.data);
    return NextResponse.json(result, { headers: importPrivateHeaders });
  } catch (error) {
    return importErrorResponse(error);
  }
}
