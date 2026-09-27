"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";
import { resolveAccountContext } from "@/modules/account/server/account-context";
import { getTrustedMutationOrigin } from "@/platform/security/server-origin";

import { parseLocale, translate } from "./dictionary";
import { setLocaleCookie } from "./server";
import { getSafeLocaleReturnPath } from "./redirect";

export type LocaleActionState = Readonly<{ status: "idle" | "error"; message?: string }>;

export async function changeLocaleAction(
  _previous: LocaleActionState,
  formData: FormData,
): Promise<LocaleActionState> {
  const currentLocale = parseLocale(formData.get("currentLocale")) ?? "ru";
  if (!(await getTrustedMutationOrigin())) {
    return {
      status: "error",
      message: translate(currentLocale, "Не удалось сохранить язык. Попробуйте ещё раз."),
    };
  }
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return {
      status: "error",
      message: translate(currentLocale, "Не удалось сохранить язык. Попробуйте ещё раз."),
    };
  }

  const client = await createSupabaseUserContextClient();
  const { data } = await client.auth.getUser();
  if (data.user) {
    const resolution = await resolveAccountContext();
    if (resolution.status !== "ready") {
      return { status: "error", message: translate(currentLocale, "Аккаунт временно недоступен.") };
    }
    const { error } = await client.rpc("set_own_locale", { p_locale_code: locale });
    if (error) {
      return {
        status: "error",
        message: translate(currentLocale, "Не удалось сохранить язык. Попробуйте ещё раз."),
      };
    }
  }

  await setLocaleCookie(locale);
  revalidatePath("/", "layout");
  const returnTo = getSafeLocaleReturnPath(formData.get("returnTo"));
  redirect(returnTo);
}
