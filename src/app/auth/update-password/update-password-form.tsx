"use client";

import { useActionState, useState, type FormEvent } from "react";

import { useI18n } from "@/i18n/context";
import type { AuthActionState } from "@/modules/account/auth-state";
import {
  getNewPasswordValidationMessage,
  PASSWORD_MAX_LENGTH,
  PASSWORD_POLICY_HELP,
  passwordsMatch,
} from "@/modules/account/password-policy";
import { updatePasswordAction } from "@/modules/account/server/auth-actions";
import { Button } from "@/ui/button";

const initialState: AuthActionState = { status: "idle" };

export function UpdatePasswordForm() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [clientError, setClientError] = useState("");
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);

  function validate(event: FormEvent<HTMLFormElement>) {
    const policyMessage = getNewPasswordValidationMessage(password);
    const message = policyMessage
      ? policyMessage
      : passwordsMatch(password, confirmation)
        ? ""
        : "Пароли не совпадают.";
    if (!message) return;
    event.preventDefault();
    setClientError(message);
  }

  return (
    <form action={action} className="space-y-4" onSubmit={validate}>
      <label className="block space-y-1">
        <span>{t("Новый пароль")}</span>
        <input
          className="min-h-12 w-full rounded-[var(--aw-radius-md)] border border-border-strong bg-white px-3 py-2 text-base"
          name="password"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          required
          disabled={pending}
          aria-describedby="recovery-password-help"
          value={password}
          onChange={(event) => {
            setPassword(event.currentTarget.value);
            setClientError("");
          }}
        />
      </label>
      <p id="recovery-password-help" className="text-sm text-text-secondary">
        {t(PASSWORD_POLICY_HELP)}
      </p>
      <label className="block space-y-1">
        <span>{t("Подтвердите новый пароль")}</span>
        <input
          className="min-h-12 w-full rounded-[var(--aw-radius-md)] border border-border-strong bg-white px-3 py-2 text-base"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          required
          disabled={pending}
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.currentTarget.value);
            setClientError("");
          }}
        />
      </label>
      {clientError ? (
        <p role="alert" className="text-[var(--aw-error)]" aria-live="polite">
          {t(clientError)}
        </p>
      ) : null}
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error" ? "text-[var(--aw-error)]" : "text-[var(--aw-success)]"
          }
          aria-live="polite"
        >
          {t(state.message)}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("Сохраняем…") : t("Сохранить пароль")}
      </Button>
    </form>
  );
}
