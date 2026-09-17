import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/infrastructure/database/database.types";
import { getPublicEnvironment } from "@/platform/env/public";

const privateHeaders = { "Cache-Control": "private, no-store" };

function copySessionCookies(source: NextResponse, target: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie);
  target.headers.set("Cache-Control", privateHeaders["Cache-Control"]);
  return target;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dev") && process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { ...privateHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  let sessionResponse = NextResponse.next({ request });
  const environment = getPublicEnvironment();
  const supabase = createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const cookie of cookiesToSet) request.cookies.set(cookie);
          sessionResponse = NextResponse.next({ request });
          for (const cookie of cookiesToSet) sessionResponse.cookies.set(cookie);
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const isProtectedPage = pathname === "/app" || pathname.startsWith("/app/");
  const isProtectedApi = pathname === "/api/account";

  if (!data.user && isProtectedApi) {
    return copySessionCookies(
      sessionResponse,
      NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    );
  }

  if (!data.user && isProtectedPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return copySessionCookies(sessionResponse, NextResponse.redirect(loginUrl));
  }

  sessionResponse.headers.set("Cache-Control", privateHeaders["Cache-Control"]);
  return sessionResponse;
}

export const config = {
  matcher: ["/dev/:path*", "/auth/:path*", "/app/:path*", "/api/account"],
};
