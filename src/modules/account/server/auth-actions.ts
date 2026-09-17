"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";
import { getSafeAuthRedirectPath } from "@/modules/account/auth-redirect";
import type { AuthActionState } from "@/modules/account/auth-state";
import { getTrustedMutationOrigin } from "@/platform/security/server-origin";

import { resolveAccountContext } from "./account-context";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);
const credentialsSchema = z.object({ email: emailSchema, password: passwordSchema });

const invalidCredentials: AuthActionState = {
  status: "error",
  message: "Проверьте email и пароль и попробуйте ещё раз.",
};
const unavailable: AuthActionState = {
  status: "error",
  message: "Сервис входа временно недоступен. Попробуйте ещё раз.",
};

async function finishAuthenticatedFlow(next: FormDataEntryValue | null): Promise<AuthActionState> {
  const resolution = await resolveAccountContext();
  if (resolution.status !== "ready") return unavailable;
  redirect(getSafeAuthRedirectPath(typeof next === "string" ? next : null));
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!(await getTrustedMutationOrigin())) return unavailable;
  const credentials = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!credentials.success) return invalidCredentials;

  const client = await createSupabaseUserContextClient();
  const { error } = await client.auth.signInWithPassword(credentials.data);
  if (error) return invalidCredentials;
  return finishAuthenticatedFlow(formData.get("next"));
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const origin = await getTrustedMutationOrigin();
  if (!origin) return unavailable;
  const credentials = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!credentials.success) return invalidCredentials;

  const client = await createSupabaseUserContextClient();
  const next = getSafeAuthRedirectPath(
    typeof formData.get("next") === "string" ? (formData.get("next") as string) : null,
  );
  const { data, error } = await client.auth.signUp({
    ...credentials.data,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return unavailable;
  if (data.session) return finishAuthenticatedFlow(next);
  return {
    status: "success",
    message: "Если адрес можно использовать, письмо для продолжения уже отправлено.",
  };
}

export async function requestRecoveryAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const origin = await getTrustedMutationOrigin();
  if (!origin) return unavailable;
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { status: "error", message: "Введите корректный email." };

  const client = await createSupabaseUserContextClient();
  const { error } = await client.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });
  if (error) return unavailable;
  return {
    status: "success",
    message: "Если аккаунт существует, письмо для восстановления уже отправлено.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!(await getTrustedMutationOrigin())) return unavailable;
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) {
    return { status: "error", message: "Пароль должен содержать от 10 до 128 символов." };
  }

  const client = await createSupabaseUserContextClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return { status: "error", message: "Сессия устарела." };
  const { error } = await client.auth.updateUser({ password: password.data });
  if (error) return unavailable;
  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  if (!(await getTrustedMutationOrigin())) redirect("/auth?error=request");
  const client = await createSupabaseUserContextClient();
  await client.auth.signOut({ scope: "local" });
  redirect("/auth?status=signed-out");
}
