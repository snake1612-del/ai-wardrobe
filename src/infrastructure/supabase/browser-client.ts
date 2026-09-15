"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/infrastructure/database/database.types";
import { getPublicEnvironment } from "@/platform/env/public";

export function createSupabaseBrowserClient() {
  const env = getPublicEnvironment();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
