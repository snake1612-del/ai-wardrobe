import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";

import type { Database } from "@/infrastructure/database/database.types";
import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";

import { parseLocale, translate, type Locale } from "./dictionary";

export const LOCALE_COOKIE = "aw-locale";

export async function getRequestLocale(): Promise<Locale> {
  const store = await cookies();
  return parseLocale(store.get(LOCALE_COOKIE)?.value) ?? "ru";
}

const resolveInitialLocale = cache(async (): Promise<Locale> => {
  const cookieLocale = await getRequestLocale();
  try {
    const client = await createSupabaseUserContextClient();
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) return cookieLocale;

    const { data: preference, error: preferenceError } = await client
      .from("account_preferences")
      .select("locale_code")
      .maybeSingle();
    if (preferenceError) return cookieLocale;
    return parseLocale(preference?.locale_code) ?? cookieLocale;
  } catch {
    return cookieLocale;
  }
});

export async function getInitialLocale(): Promise<Locale> {
  return resolveInitialLocale();
}

export async function getServerI18n() {
  const locale = await getInitialLocale();
  return {
    locale,
    t: (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
  };
}

export function localeCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function setLocaleCookie(locale: Locale) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, localeCookieOptions());
}

export async function resolveAuthenticatedLocale(
  client: SupabaseClient<Database>,
  accountId: string,
  fallback: Locale,
): Promise<Locale> {
  const { data } = await client
    .from("account_preferences")
    .select("locale_code")
    .eq("account_id", accountId)
    .maybeSingle();
  const persisted = parseLocale(data?.locale_code);
  if (persisted) return persisted;
  await client.rpc("set_own_locale", { p_locale_code: fallback });
  return fallback;
}
