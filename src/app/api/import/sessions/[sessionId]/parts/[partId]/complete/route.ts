import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { completeImportPart, inspectImportPart } from "@/modules/import/server/import-capability";
import {
  importErrorResponse,
  importPrivateHeaders,
  requireImportMutationAccount,
} from "@/modules/import/server/import-http";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; partId: string }> },
) {
  try {
    const accountId = await requireImportMutationAccount();
    const identifiers = z
      .object({ sessionId: z.string().uuid(), partId: z.string().uuid() })
      .safeParse(await params);
    if (!identifiers.success) throw new ApplicationError("validation", "Некорректный импорт.");
    const observedSize = await inspectImportPart(
      accountId,
      identifiers.data.sessionId,
      identifiers.data.partId,
    );
    const result = await completeImportPart(
      accountId,
      identifiers.data.sessionId,
      identifiers.data.partId,
      observedSize,
    );
    return NextResponse.json(result, { headers: importPrivateHeaders });
  } catch (error) {
    return importErrorResponse(error);
  }
}
