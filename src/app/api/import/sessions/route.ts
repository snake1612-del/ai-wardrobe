import { NextResponse, type NextRequest } from "next/server";

import { importIntentSchema } from "@/modules/import/model";
import { createImportIntent } from "@/modules/import/server/import-capability";
import {
  importErrorResponse,
  importPrivateHeaders,
  requireImportMutationAccount,
} from "@/modules/import/server/import-http";
import { getPublicEnvironment } from "@/platform/env/public";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const accountId = await requireImportMutationAccount();
    const parsed = importIntentSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApplicationError("validation", "Проверьте выбранные ZIP.");
    const intent = await createImportIntent(accountId, parsed.data);
    return NextResponse.json(
      {
        ...intent,
        tusEndpoint: `${getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      },
      { status: 201, headers: importPrivateHeaders },
    );
  } catch (error) {
    return importErrorResponse(error);
  }
}
