import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/infrastructure/supabase/route-client";
import { getSafeAuthRedirectPath } from "@/modules/account/auth-redirect";
import { bootstrapAccountForVerifiedUser } from "@/modules/account/server/account-bootstrap";
import { getApplicationOrigin } from "@/platform/env/server";

function authError(code: string) {
  const url = new URL("/auth", getApplicationOrigin());
  url.searchParams.set("error", code);
  return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return authError("invalid-callback");

  const target = new URL(
    getSafeAuthRedirectPath(request.nextUrl.searchParams.get("next")),
    getApplicationOrigin(),
  );
  const response = NextResponse.redirect(target, {
    headers: { "Cache-Control": "private, no-store" },
  });
  const client = createSupabaseRouteClient(request, response);
  const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
  if (exchangeError) return authError("expired-link");

  const { data, error: userError } = await client.auth.getUser();
  if (userError || !data.user) return authError("invalid-session");
  try {
    await bootstrapAccountForVerifiedUser(data.user.id);
  } catch {
    return authError("account-unavailable");
  }
  return response;
}
