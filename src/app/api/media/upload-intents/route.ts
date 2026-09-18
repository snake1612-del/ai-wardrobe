import { NextResponse, type NextRequest } from "next/server";

import { uploadIntentSchema } from "@/modules/media/model";
import { createUploadIntentCapability } from "@/modules/media/server/media-capability";
import {
  mediaErrorResponse,
  privateHeaders,
  requireMediaMutationAccount,
} from "@/modules/media/server/media-http";
import { getPublicEnvironment } from "@/platform/env/public";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const accountId = await requireMediaMutationAccount();
    const parsed = uploadIntentSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApplicationError("validation", "Проверьте выбранный файл.");
    const intent = await createUploadIntentCapability(accountId, parsed.data);
    return NextResponse.json(
      {
        assetId: intent.asset_id,
        bucket: intent.storage_bucket,
        objectKey: intent.storage_object_key,
        state: intent.processing_state,
        tusEndpoint: `${getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      },
      { status: 201, headers: privateHeaders },
    );
  } catch (error) {
    return mediaErrorResponse(error);
  }
}
