"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";
import { getTrustedMutationOrigin } from "@/platform/security/server-origin";

import { regionalSettingsSchema, type SettingsActionState } from "../settings-model";
import { resolveAccountContext } from "./account-context";

const requestFailure: SettingsActionState = {
  status: "error",
  message: "Сессия устарела или запрос не прошёл проверку origin.",
};
const accountUnavailable: SettingsActionState = {
  status: "error",
  message: "Аккаунт временно недоступен.",
};

export async function saveRegionalSettingsAction(
  previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  if (!(await getTrustedMutationOrigin())) return requestFailure;
  const resolution = await resolveAccountContext();
  if (resolution.status === "anonymous") return requestFailure;
  if (resolution.status === "unavailable") return accountUnavailable;

  const settings = regionalSettingsSchema.safeParse({
    timezoneName: formData.get("timezoneName"),
    unitsCode: formData.get("unitsCode"),
    weekStartsOn: formData.get("weekStartsOn"),
    expectedVersion: formData.get("expectedVersion") ?? previous.version,
  });
  if (!settings.success) {
    return {
      status: "error",
      message: settings.error.issues[0]?.message ?? "Проверьте региональные настройки.",
      ...(previous.version === undefined ? {} : { version: previous.version }),
    };
  }

  const client = await createSupabaseUserContextClient();
  const { data, error } = await client
    .rpc("update_own_regional_preferences", {
      p_timezone_name: settings.data.timezoneName,
      p_units_code: settings.data.unitsCode,
      p_week_starts_on: settings.data.weekStartsOn,
      p_expected_version: settings.data.expectedVersion,
    })
    .single();

  if (error || !data) {
    const message = error?.message.includes("account_unavailable")
      ? "Аккаунт временно недоступен."
      : error?.code === "40001"
        ? "Настройки изменились в другой вкладке. Обновите страницу."
        : error?.message.includes("unsupported_timezone")
          ? "Укажите корректный часовой пояс IANA."
          : error?.message.includes("unsupported_units")
            ? "Выберите систему единиц."
            : error?.message.includes("unsupported_week_start")
              ? "Выберите начало недели."
              : "Не удалось сохранить настройки. Попробуйте ещё раз.";
    return {
      status: "error",
      message,
      version: settings.data.expectedVersion,
    };
  }

  revalidatePath("/app/settings");
  return {
    status: "success",
    message: "Региональные настройки сохранены.",
    version: Number(data.preference_version),
  };
}
