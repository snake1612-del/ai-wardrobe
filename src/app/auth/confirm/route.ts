import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/infrastructure/supabase/route-client";
import { getSafeAuthRedirectPath } from "@/modules/account/auth-redirect";
import { bootstrapAccountForVerifiedUser } from "@/modules/account/server/account-bootstrap";
import { getApplicationOrigin } from "@/platform/env/server";

const allowedTypes = new Set<EmailOtpType>(["recovery", "signup", "invite", "email"]);

function authError() {
  const url = new URL("/auth?error=expired-link", getApplicationOrigin());
  return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const candidateType = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  if (!tokenHash || !candidateType || !allowedTypes.has(candidateType)) return authError();

  const response = NextResponse.redirect(
    new URL(
      getSafeAuthRedirectPath(request.nextUrl.searchParams.get("next")),
      getApplicationOrigin(),
    ),
    { headers: { "Cache-Control": "private, no-store" } },
  );
  const client = createSupabaseRouteClient(request, response);
  const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: candidateType });
  if (error) return authError();

  const { data, error: userError } = await client.auth.getUser();
  if (userError || !data.user) return authError();
  try {
    await bootstrapAccountForVerifiedUser(data.user.id);
  } catch {
    return authError();
  }
  return response;
}
