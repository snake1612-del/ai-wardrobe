import "server-only";

import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/infrastructure/database/database.types";
import { ApplicationError } from "@/platform/errors/application-error";
import { getAccountBootstrapEnvironment } from "@/platform/env/server";
import { logEvent } from "@/platform/logging/logger";

export type BootstrappedAccount = Readonly<{
  id: string;
  state: "active" | "restricted" | "deleting";
}>;

export async function bootstrapAccountForVerifiedUser(
  verifiedAuthUserId: string,
): Promise<BootstrappedAccount> {
  const environment = getAccountBootstrapEnvironment();
  const capabilityClient = createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    },
  );

  const { data, error } = await capabilityClient
    .rpc("bootstrap_account", {
      p_account_id: randomUUID(),
      p_auth_user_id: verifiedAuthUserId,
    })
    .single();

  if (error || !data) {
    logEvent("error", "account.bootstrap.failed", { errorCode: error?.code ?? "missing_result" });
    throw new ApplicationError("transient_dependency", "Не удалось подготовить аккаунт.");
  }

  return {
    id: data.account_id,
    state: data.account_state as BootstrappedAccount["state"],
  };
}
