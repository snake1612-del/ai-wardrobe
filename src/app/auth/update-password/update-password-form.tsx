"use client";

import { useActionState } from "react";

import type { AuthActionState } from "@/modules/account/auth-state";
import { updatePasswordAction } from "@/modules/account/server/auth-actions";
import { Button } from "@/ui/button";

const initialState: AuthActionState = { status: "idle" };

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1">
        <span>Новый пароль</span>
        <input
          className="min-h-12 w-full rounded-[var(--aw-radius-md)] border border-border-strong bg-white px-3 py-2 text-base"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
        />
      </label>
      <p className="text-sm text-text-secondary">От 10 до 128 символов.</p>
      {state.message ? (
        <p role="alert" className="text-[var(--aw-error)]">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить пароль"}
      </Button>
    </form>
  );
}
