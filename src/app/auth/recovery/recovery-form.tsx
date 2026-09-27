"use client";
import { useActionState } from "react";
import { useI18n } from "@/i18n/context";
import type { AuthActionState } from "@/modules/account/auth-state";
import { requestRecoveryAction } from "@/modules/account/server/auth-actions";
import { Button } from "@/ui/button";
const initialState: AuthActionState = { status: "idle" };
export function RecoveryForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(requestRecoveryAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1">
        <span>Email</span>
        <input
          className="min-h-12 w-full rounded-[var(--aw-radius-md)] border border-border-strong bg-white px-3 py-2 text-base"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </label>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error" ? "text-[var(--aw-error)]" : "text-[var(--aw-success)]"
          }
        >
          {t(state.message)}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("Отправляем…") : t("Отправить ссылку")}
      </Button>
    </form>
  );
}
