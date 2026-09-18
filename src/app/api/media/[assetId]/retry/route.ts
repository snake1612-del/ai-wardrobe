import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { retrySchema } from "@/modules/media/model";
import { retryMediaCapability } from "@/modules/media/server/media-capability";
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
    const parsed = retrySchema.safeParse(await request.json());
    if (!parsed.success) throw new ApplicationError("validation", "Некорректный запрос повтора.");
    const result = await retryMediaCapability(accountId, assetId, parsed.data);
    return NextResponse.json(
      { assetId: result.asset_id, state: result.processing_state, version: result.asset_version },
      { headers: privateHeaders },
    );
  } catch (error) {
    return mediaErrorResponse(error);
  }
}
