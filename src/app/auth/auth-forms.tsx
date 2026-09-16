"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthActionState } from "@/modules/account/auth-state";
import { loginAction, signupAction } from "@/modules/account/server/auth-actions";
import { Button } from "@/ui/button";

const initialState: AuthActionState = { status: "idle" };
const inputClass =
  "min-h-12 w-full rounded-[var(--aw-radius-md)] border border-border-strong bg-white px-3 py-2 text-base";

function Feedback({ state }: { state: AuthActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={state.status === "error" ? "text-[var(--aw-error)]" : "text-[var(--aw-success)]"}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  pending,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
}) {
  return (
    <Button disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function AuthForms({ next }: { next: string }) {
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState);
  const [signupState, signupFormAction, signupPending] = useActionState(signupAction, initialState);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={loginFormAction} className="space-y-4" aria-labelledby="login-heading">
        <input name="next" type="hidden" value={next} />
        <h2 id="login-heading" className="text-xl font-semibold">
          Войти
        </h2>
        <label className="block space-y-1">
          <span>Email</span>
          <input className={inputClass} name="email" type="email" autoComplete="email" required />
        </label>
        <label className="block space-y-1">
          <span>Пароль</span>
          <input
            className={inputClass}
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={10}
            maxLength={128}
            required
          />
        </label>
        <Feedback state={loginState} />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton label="Войти" pendingLabel="Входим…" pending={loginPending} />
          <Link className="underline underline-offset-4" href="/auth/recovery">
            Забыли пароль?
          </Link>
        </div>
      </form>

      <form
        action={signupFormAction}
        className="space-y-4 border-t border-border-subtle pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
        aria-labelledby="signup-heading"
      >
        <input name="next" type="hidden" value={next} />
        <h2 id="signup-heading" className="text-xl font-semibold">
          Создать аккаунт
        </h2>
        <label className="block space-y-1">
          <span>Email</span>
          <input className={inputClass} name="email" type="email" autoComplete="email" required />
        </label>
        <label className="block space-y-1">
          <span>Пароль</span>
          <input
            className={inputClass}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            required
            aria-describedby="signup-password-help"
          />
        </label>
        <p id="signup-password-help" className="text-sm text-text-secondary">
          От 10 до 128 символов.
        </p>
        <Feedback state={signupState} />
        <SubmitButton label="Создать аккаунт" pendingLabel="Создаём…" pending={signupPending} />
      </form>
    </div>
  );
}
