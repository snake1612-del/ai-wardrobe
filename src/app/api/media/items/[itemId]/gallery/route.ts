import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { gallerySchema } from "@/modules/media/model";
import { setGalleryCapability } from "@/modules/media/server/media-capability";
import {
  mediaErrorResponse,
  privateHeaders,
  requireMediaMutationAccount,
} from "@/modules/media/server/media-http";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const accountId = await requireMediaMutationAccount();
    const { itemId } = await params;
    if (!z.string().uuid().safeParse(itemId).success) {
      throw new ApplicationError("not_found", "Вещь недоступна.");
    }
    const parsed = gallerySchema.safeParse(await request.json());
    if (!parsed.success) throw new ApplicationError("validation", "Некорректный порядок галереи.");
    const version = await setGalleryCapability(accountId, itemId, parsed.data);
    return NextResponse.json({ version }, { headers: privateHeaders });
  } catch (error) {
    return mediaErrorResponse(error);
  }
}
