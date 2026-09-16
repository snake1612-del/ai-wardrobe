import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import type { Database } from "@/infrastructure/database/database.types";
import { getPublicEnvironment } from "@/platform/env/public";

export function createSupabaseRouteClient(request: NextRequest, response: NextResponse) {
  const environment = getPublicEnvironment();
  return createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const cookie of cookiesToSet) response.cookies.set(cookie);
        },
      },
    },
  );
}
