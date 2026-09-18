import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { removeBindingSchema } from "@/modules/media/model";
import { removeBindingCapability } from "@/modules/media/server/media-capability";
import {
  mediaErrorResponse,
  privateHeaders,
  requireMediaMutationAccount,
} from "@/modules/media/server/media-http";
import { ApplicationError } from "@/platform/errors/application-error";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bindingId: string }> },
) {
  try {
    const accountId = await requireMediaMutationAccount();
    const { bindingId } = await params;
    if (!z.string().uuid().safeParse(bindingId).success) {
      throw new ApplicationError("not_found", "Изображение недоступно.");
    }
    const parsed = removeBindingSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApplicationError("validation", "Некорректное удаление.");
    const version = await removeBindingCapability(accountId, bindingId, parsed.data);
    return NextResponse.json({ version }, { headers: privateHeaders });
  } catch (error) {
    return mediaErrorResponse(error);
  }
}
