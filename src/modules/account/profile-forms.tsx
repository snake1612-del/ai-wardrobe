"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/context";
import {
  getNewPasswordValidationMessage,
  PASSWORD_MAX_LENGTH,
  PASSWORD_POLICY_HELP,
  passwordsMatch,
} from "@/modules/account/password-policy";
import { Button } from "@/ui/button";
import type { ProfileActionState } from "./profile-model";
import {
  changeEmailAction,
  changePasswordAction,
  saveDisplayNameAction,
} from "./server/profile-actions";

const idle: ProfileActionState = { status: "idle" };

function ActionMessage({ state }: { state: ProfileActionState }) {
  const { t } = useI18n();
  if (state.status === "idle") return null;
  return (
    <p
      className={
        state.status === "error"
          ? "rounded-lg bg-[var(--aw-error-surface)] p-3 text-[var(--aw-error)]"
          : "rounded-lg bg-surface-muted p-3 text-text-primary"
      }
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {t(state.message ?? "")}
    </p>
  );
}

export function DisplayNameForm({
  displayName,
  version,
}: {
  displayName: string | null;
  version: number;
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(saveDisplayNameAction, { ...idle, version });
  return (
    <form action={action} className="space-y-4">
      <ActionMessage state={state} />
      <input type="hidden" name="expectedVersion" value={state.version ?? version} />
      <label className="block">
        <span className="mb-2 block font-medium">{t("Отображаемое имя")}</span>
        <input
          className="field"
          name="displayName"
          defaultValue={displayName ?? ""}
          required
          minLength={1}
          maxLength={80}
          autoComplete="name"
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? t("Сохраняем…") : t("Сохранить имя")}
      </Button>
    </form>
  );
}

export function EmailForm({ email }: { email: string | null }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(changeEmailAction, idle);
  return (
    <form action={action} className="space-y-4">
      <ActionMessage state={state} />
      <p className="text-sm text-text-secondary">
        {t("Текущий email:")}{" "}
        <span className="font-medium text-text-primary">{email ?? t("недоступен")}</span>
      </p>
      <label className="block">
        <span className="mb-2 block font-medium">{t("Новый email")}</span>
        <input
          className="field"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <p className="text-sm text-text-tertiary">
        {t("Адрес изменится только после подтверждения, если подтверждение включено в Auth.")}
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? t("Отправляем…") : t("Изменить email")}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const { t } = useI18n();
  const [clientError, setClientError] = useState("");
  const [state, action, pending] = useActionState(changePasswordAction, idle);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
  }, [state.status]);

  function validate(event: FormEvent<HTMLFormElement>) {
    const fields = new FormData(event.currentTarget);
    const newPassword = String(fields.get("newPassword") ?? "");
    const confirmation = String(fields.get("confirmPassword") ?? "");
    const policyMessage = getNewPasswordValidationMessage(newPassword);
    const message = policyMessage
      ? policyMessage
      : passwordsMatch(newPassword, confirmation)
        ? ""
        : "Подтверждение нового пароля не совпадает.";
    if (!message) return;
    event.preventDefault();
    setClientError(message);
  }

  return (
    <form ref={formRef} action={action} className="space-y-4" onSubmit={validate}>
      <ActionMessage state={state} />
      <label className="block">
        <span className="mb-2 block font-medium">{t("Текущий пароль")}</span>
        <input
          className="field"
          name="currentPassword"
          type="password"
          required
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete="current-password"
          disabled={pending}
        />
      </label>
      <label className="block">
        <span className="mb-2 block font-medium">{t("Новый пароль")}</span>
        <input
          className="field"
          name="newPassword"
          type="password"
          required
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete="new-password"
          disabled={pending}
          aria-describedby="profile-password-help"
          onChange={() => setClientError("")}
        />
      </label>
      <p id="profile-password-help" className="text-sm text-text-secondary">
        {t(PASSWORD_POLICY_HELP)}
      </p>
      <label className="block">
        <span className="mb-2 block font-medium">{t("Повторите новый пароль")}</span>
        <input
          className="field"
          name="confirmPassword"
          type="password"
          required
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete="new-password"
          disabled={pending}
          onChange={() => setClientError("")}
        />
      </label>
      {clientError ? (
        <p className="text-[var(--aw-error)]" role="alert" aria-live="polite">
          {t(clientError)}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("Меняем…") : t("Изменить пароль")}
      </Button>
    </form>
  );
}
