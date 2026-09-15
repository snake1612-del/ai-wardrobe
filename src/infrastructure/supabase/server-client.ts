import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/infrastructure/database/database.types";
import { getServerEnvironment } from "@/platform/env/server";

export async function createSupabaseUserContextClient() {
  const env = getServerEnvironment();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet)
            cookieStore.set(name, value, options);
        },
      },
    },
  );
}
