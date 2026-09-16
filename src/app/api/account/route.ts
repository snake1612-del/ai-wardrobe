import { NextResponse } from "next/server";

import { resolveAccountContext } from "@/modules/account/server/account-context";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const resolution = await resolveAccountContext();
  if (resolution.status === "anonymous")
    return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers });
  if (resolution.status === "unavailable")
    return NextResponse.json({ error: "account_unavailable" }, { status: 503, headers });
  return NextResponse.json(
    { account: { id: resolution.context.accountId, email: resolution.context.email } },
    { headers },
  );
}
