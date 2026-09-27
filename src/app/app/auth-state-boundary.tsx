"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { useI18n } from "@/i18n/context";
import { bindClientStateToUser, clearUserScopedClientState } from "@/modules/account/client-state";
import { logoutAction } from "@/modules/account/server/auth-actions";
import { Button } from "@/ui/button";

function LogoutButton() {
  const { t } = useI18n();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("Выходим…") : t("Выйти")}
    </Button>
  );
}

export function AuthStateBoundary({
  authUserId,
  children,
}: {
  authUserId: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [boundUserId, setBoundUserId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    bindClientStateToUser(authUserId);
    queueMicrotask(() => {
      if (active) setBoundUserId(authUserId);
    });
    return () => {
      active = false;
    };
  }, [authUserId]);
  if (boundUserId !== authUserId)
    return <p role="status">{t("Подготавливаем приватную сессию…")}</p>;
  return (
    <>
      {children}
      <form action={logoutAction} onSubmit={clearUserScopedClientState}>
        <LogoutButton />
      </form>
    </>
  );
}
