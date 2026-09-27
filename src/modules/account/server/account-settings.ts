import "server-only";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";

import type { AccountSettings } from "../settings-model";

export async function getAccountSettings(accountId: string): Promise<AccountSettings> {
  const client = await createSupabaseUserContextClient();
  const { data, error } = await client
    .from("account_preferences")
    .select("locale_code, timezone_name, units_code, week_starts_on, version")
    .eq("account_id", accountId)
    .single();

  if (error || !data) throw new Error("account_preferences_unavailable");

  return {
    localeCode: data.locale_code === "ru" || data.locale_code === "en" ? data.locale_code : null,
    timezoneName: data.timezone_name ?? "UTC",
    unitsCode: data.units_code === "imperial" ? "imperial" : "metric",
    weekStartsOn: data.week_starts_on === 7 ? 7 : 1,
    version: Number(data.version),
  };
}
