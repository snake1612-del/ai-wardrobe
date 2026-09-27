import "server-only";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";
import { ApplicationError } from "@/platform/errors/application-error";

export type AccountProfile = Readonly<{
  displayName: string | null;
  version: number;
}>;

export async function getAccountProfile(accountId: string): Promise<AccountProfile> {
  const client = await createSupabaseUserContextClient();
  const { data, error } = await client
    .from("accounts")
    .select("display_name,version")
    .eq("id", accountId)
    .maybeSingle();

  if (error) {
    throw new ApplicationError("transient_dependency", "Профиль временно недоступен.");
  }
  if (!data) {
    throw new ApplicationError("not_found", "Профиль недоступен.");
  }
  return { displayName: data.display_name, version: Number(data.version) };
}
