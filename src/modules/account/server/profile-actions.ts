"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";
import { getTrustedMutationOrigin } from "@/platform/security/server-origin";

import {
  profileDisplayNameSchema,
  profileEmailSchema,
  profilePasswordSchema,
  type ProfileActionState,
} from "../profile-model";
import { resolveAccountContext } from "./account-context";

const requestFailure: ProfileActionState = {
  status: "error",
  message: "Сессия устарела или запрос не прошёл проверку origin.",
};

async function readyProfileMutation() {
  const origin = await getTrustedMutationOrigin();
  if (!origin) return null;
  const resolution = await resolveAccountContext();
  if (resolution.status !== "ready") return null;
  return { context: resolution.context, origin };
}

export async function saveDisplayNameAction(
  previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const request = await readyProfileMutation();
  if (!request) return requestFailure;

  const displayName = profileDisplayNameSchema.safeParse(formData.get("displayName"));
  const expectedVersion = Number(formData.get("expectedVersion") ?? previous.version);
  if (!displayName.success || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return {
      status: "error",
      message: displayName.error?.issues[0]?.message ?? "Обновите страницу и повторите попытку.",
      ...(previous.version === undefined ? {} : { version: previous.version }),
    };
  }

  const client = await createSupabaseUserContextClient();
  const { data, error } = await client
    .rpc("update_own_account_profile", {
      p_display_name: displayName.data,
      p_expected_version: expectedVersion,
    })
    .single();

  if (error || !data) {
    return {
      status: "error",
      message:
        error?.code === "40001"
          ? "Профиль изменился в другой вкладке. Обновите страницу."
          : error?.code === "22023"
            ? "Проверьте отображаемое имя."
            : "Не удалось сохранить профиль. Попробуйте ещё раз.",
      ...(previous.version === undefined ? {} : { version: previous.version }),
    };
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  return {
    status: "success",
    message: "Отображаемое имя сохранено.",
    version: Number(data.account_version),
  };
}

export async function changeEmailAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const request = await readyProfileMutation();
  if (!request) return requestFailure;

  const email = profileEmailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { status: "error", message: email.error.issues[0]?.message ?? "Проверьте email." };
  }
  if (request.context.email?.toLocaleLowerCase() === email.data.toLocaleLowerCase()) {
    return { status: "error", message: "Укажите новый email." };
  }

  const client = await createSupabaseUserContextClient();
  const { data, error } = await client.auth.updateUser(
    { email: email.data },
    { emailRedirectTo: `${request.origin}/auth/callback?next=/app/profile` },
  );
  if (error) {
    return {
      status: "error",
      message: "Не удалось отправить подтверждение. Проверьте email и попробуйте ещё раз.",
    };
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  const changedImmediately =
    data.user.email?.toLocaleLowerCase() === email.data.toLocaleLowerCase();
  return {
    status: "success",
    message: changedImmediately
      ? "Email изменён."
      : "Запрос принят. Подтвердите новый адрес по письму; до подтверждения действует текущий email.",
  };
}

export async function changePasswordAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const request = await readyProfileMutation();
  if (!request) return requestFailure;

  const password = profilePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!password.success) {
    return {
      status: "error",
      message: password.error.issues[0]?.message ?? "Проверьте поля пароля.",
    };
  }

  if (!request.context.email) {
    return { status: "error", message: "Email текущей сессии недоступен." };
  }

  const client = await createSupabaseUserContextClient();
  const { error: verificationError } = await client.auth.signInWithPassword({
    email: request.context.email,
    password: password.data.currentPassword,
  });
  if (verificationError) {
    return { status: "error", message: "Текущий пароль указан неверно." };
  }

  const { error } = await client.auth.updateUser({
    current_password: password.data.currentPassword,
    password: password.data.newPassword,
  });
  if (error) {
    return {
      status: "error",
      message: "Не удалось сменить пароль. Проверьте текущий пароль и повторите попытку.",
    };
  }

  return {
    status: "success",
    message: "Пароль изменён. Новый пароль будет использоваться при следующем входе.",
  };
}
