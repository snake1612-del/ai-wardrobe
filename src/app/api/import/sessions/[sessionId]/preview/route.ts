import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { importPreviewSchema } from "@/modules/import/model";
import { buildImportPreview } from "@/modules/import/server/import-capability";
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
    const input = importPreviewSchema.safeParse(await request.json());
    if (!sessionId.success || !input.success) {
      throw new ApplicationError("validation", "Предпросмотр недоступен.");
    }
    const preview = await buildImportPreview(accountId, sessionId.data, input.data.expectedVersion);
    return NextResponse.json(preview, { headers: importPrivateHeaders });
  } catch (error) {
    return importErrorResponse(error);
  }
}
