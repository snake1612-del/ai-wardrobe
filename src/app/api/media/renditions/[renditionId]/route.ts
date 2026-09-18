import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveAccountContext } from "@/modules/account/server/account-context";
import { createMediaServiceClient } from "@/modules/media/server/media-capability";
import { privateHeaders } from "@/modules/media/server/media-http";
import { resolveReadyRendition } from "@/modules/media/server/media-queries";

export const dynamic = "force-dynamic";

const deliveryHeaders = {
  ...privateHeaders,
  "X-Content-Type-Options": "nosniff",
  "Content-Disposition": "inline",
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ renditionId: string }> },
) {
  const { renditionId } = await params;
  if (!z.string().uuid().safeParse(renditionId).success) {
    return new NextResponse(null, { status: 404, headers: deliveryHeaders });
  }
  const resolution = await resolveAccountContext();
  if (resolution.status === "anonymous") {
    return new NextResponse(null, { status: 401, headers: deliveryHeaders });
  }
  if (resolution.status !== "ready") {
    return new NextResponse(null, { status: 503, headers: deliveryHeaders });
  }
  const rendition = await resolveReadyRendition(renditionId);
  if (!rendition) return new NextResponse(null, { status: 404, headers: deliveryHeaders });
  const { data, error } = await createMediaServiceClient()
    .storage.from(rendition.storage_bucket)
    .download(rendition.storage_object_key);
  if (error || !data) return new NextResponse(null, { status: 503, headers: deliveryHeaders });
  return new NextResponse(await data.arrayBuffer(), {
    headers: { ...deliveryHeaders, "Content-Type": "image/webp" },
  });
}
