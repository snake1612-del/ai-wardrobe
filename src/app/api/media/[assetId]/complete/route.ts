import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { completionSchema } from "@/modules/media/model";
import {
  completeUploadCapability,
  inspectUploadedObject,
} from "@/modules/media/server/media-capability";
import {
  mediaErrorResponse,
  privateHeaders,
  requireMediaMutationAccount,
} from "@/modules/media/server/media-http";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> },
) {
  try {
    const accountId = await requireMediaMutationAccount();
    const { assetId } = await params;
    if (!z.string().uuid().safeParse(assetId).success) {
      throw new ApplicationError("not_found", "Изображение недоступно.");
    }
    const parsed = completionSchema.safeParse(await request.json());
    if (!parsed.success)
      throw new ApplicationError("validation", "Некорректное завершение загрузки.");
    const { observedSize } = await inspectUploadedObject(accountId, assetId);
    const completed = await completeUploadCapability(
      accountId,
      assetId,
      parsed.data.idempotencyKey,
      observedSize,
    );
    return NextResponse.json(
      { assetId: completed.asset_id, state: completed.processing_state },
      { headers: privateHeaders },
    );
  } catch (error) {
    return mediaErrorResponse(error);
  }
}
