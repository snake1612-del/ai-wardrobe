"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";

import { useI18n } from "@/i18n/context";
import type { AuthActionState } from "@/modules/account/auth-state";
import {
  getNewPasswordValidationMessage,
  PASSWORD_MAX_LENGTH,
  PASSWORD_POLICY_HELP,
  passwordsMatch,
} from "@/modules/account/password-policy";
import { loginAction, signupAction } from "@/modules/account/server/auth-actions";
import { Button } from "@/ui/button";

const initialState: AuthActionState = { status: "idle" };
const inputClass =
  "min-h-12 w-full rounded-[var(--aw-radius-md)] border border-border-strong bg-white px-3 py-2 text-base";

function Feedback({ state }: { state: AuthActionState }) {
  const { t } = useI18n();
  if (!state.message) return null;
  return (
    <p
      className={state.status === "error" ? "text-[var(--aw-error)]" : "text-[var(--aw-success)]"}
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {t(state.message)}
    </p>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  pending,
  disabled = pending,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <Button disabled={disabled} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function AuthForms({ next }: { next: string }) {
  const { t } = useI18n();
  const hydrationRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmation, setSignupConfirmation] = useState("");
  const [signupClientError, setSignupClientError] = useState("");
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState);
  const [signupState, signupFormAction, signupPending] = useActionState(signupAction, initialState);

  useEffect(() => {
    hydrationRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  function validateSignup(event: FormEvent<HTMLFormElement>) {
    const policyMessage = getNewPasswordValidationMessage(signupPassword);
    const message = policyMessage
      ? policyMessage
      : passwordsMatch(signupPassword, signupConfirmation)
        ? ""
        : "Пароли не совпадают.";
    if (!message) return;
    event.preventDefault();
    setSignupClientError(message);
  }

  const anyPending = loginPending || signupPending;
  const controlsDisabled = anyPending;

  return (
    <div ref={hydrationRef} data-hydrated="false" className="max-w-xl">
      {mode === "login" ? (
        <form
          key="login"
          action={loginFormAction}
          className="space-y-4"
          aria-labelledby="login-heading"
        >
          <input name="next" type="hidden" value={next} />
          <h2 id="login-heading" className="text-xl font-semibold">
            {t("Войти")}
          </h2>
          <label className="block space-y-1">
            <span>Email</span>
            <input
              className={inputClass}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              disabled={loginPending}
            />
          </label>
          <label className="block space-y-1">
            <span>{t("Пароль")}</span>
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={PASSWORD_MAX_LENGTH}
              required
              disabled={loginPending}
            />
          </label>
          <Feedback state={loginState} />
          <div className="flex flex-wrap items-center gap-4">
            <SubmitButton
              label={t("Войти")}
              pendingLabel={t("Входим…")}
              pending={loginPending}
              disabled={loginPending}
            />
            <Link className="underline underline-offset-4" href="/auth/recovery">
              {t("Забыли пароль?")}
            </Link>
          </div>
          <div className="border-t border-border-subtle pt-4">
            <button
              className="min-h-10 rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold disabled:opacity-60"
              type="button"
              aria-controls="signup-form"
              aria-expanded="false"
              disabled={controlsDisabled}
              onClick={() => {
                setSignupClientError("");
                setMode("signup");
              }}
            >
              {t("Создать аккаунт")}
            </button>
          </div>
        </form>
      ) : (
        <form
          key="signup"
          id="signup-form"
          action={signupFormAction}
          className="space-y-4"
          aria-labelledby="signup-heading"
          onSubmit={validateSignup}
        >
          <input name="next" type="hidden" value={next} />
          <h2 id="signup-heading" className="text-xl font-semibold">
            {t("Создать аккаунт")}
          </h2>
          <label className="block space-y-1">
            <span>Email</span>
            <input
              className={inputClass}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              disabled={signupPending}
            />
          </label>
          <label className="block space-y-1">
            <span>{t("Пароль")}</span>
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              required
              disabled={signupPending}
              aria-describedby="signup-password-help"
              value={signupPassword}
              onChange={(event) => {
                setSignupPassword(event.currentTarget.value);
                setSignupClientError("");
              }}
            />
          </label>
          <p id="signup-password-help" className="text-sm text-text-secondary">
            {t(PASSWORD_POLICY_HELP)}
          </p>
          <label className="block space-y-1">
            <span>{t("Подтвердите пароль")}</span>
            <input
              className={inputClass}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              required
              disabled={signupPending}
              value={signupConfirmation}
              onChange={(event) => {
                setSignupConfirmation(event.currentTarget.value);
                setSignupClientError("");
              }}
            />
          </label>
          {signupClientError ? (
            <p className="text-[var(--aw-error)]" role="alert" aria-live="polite">
              {t(signupClientError)}
            </p>
          ) : null}
          <Feedback state={signupState} />
          <div className="flex flex-wrap items-center gap-4">
            <SubmitButton
              label={t("Создать аккаунт")}
              pendingLabel={t("Создаём…")}
              pending={signupPending}
              disabled={signupPending}
            />
            <button
              className="min-h-10 px-2 text-sm font-semibold underline underline-offset-4 disabled:opacity-60"
              type="button"
              disabled={controlsDisabled}
              onClick={() => {
                setSignupClientError("");
                setMode("login");
              }}
            >
              {t("Уже есть аккаунт? Войти")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
