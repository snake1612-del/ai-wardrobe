import "server-only";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";

import { bootstrapAccountForVerifiedUser, type BootstrappedAccount } from "./account-bootstrap";

export type AccountContext = Readonly<{
  accountId: string;
  authUserId: string;
  email: string | null;
}>;

export type AccountResolution =
  | Readonly<{ status: "anonymous" }>
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "ready"; context: AccountContext }>;

export async function resolveAccountContext(): Promise<AccountResolution> {
  const userClient = await createSupabaseUserContextClient();
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return { status: "anonymous" };

  const { data: existingAccount, error: accountError } = await userClient
    .from("accounts")
    .select("id, state")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  if (accountError) return { status: "unavailable" };

  let account: BootstrappedAccount;
  try {
    account = existingAccount
      ? {
          id: existingAccount.id,
          state: existingAccount.state as BootstrappedAccount["state"],
        }
      : await bootstrapAccountForVerifiedUser(userData.user.id);
  } catch {
    return { status: "unavailable" };
  }

  if (account.state !== "active") return { status: "unavailable" };
  return {
    status: "ready",
    context: {
      accountId: account.id,
      authUserId: userData.user.id,
      email: userData.user.email ?? null,
    },
  };
}
