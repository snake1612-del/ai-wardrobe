import { NextResponse } from "next/server";

import { resolveAccountContext } from "@/modules/account/server/account-context";
import { getAccountProfile } from "@/modules/account/server/account-profile";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  try {
    const resolution = await resolveAccountContext();
    if (resolution.status === "anonymous")
      return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers });
    if (resolution.status === "unavailable")
      return NextResponse.json({ error: "account_unavailable" }, { status: 503, headers });

    const profile = await getAccountProfile(resolution.context.accountId);
    return NextResponse.json(
      {
        account: {
          id: resolution.context.accountId,
          email: resolution.context.email,
          displayName: profile.displayName,
          version: profile.version,
        },
      },
      { headers },
    );
  } catch {
    return NextResponse.json({ error: "account_unavailable" }, { status: 503, headers });
  }
}
