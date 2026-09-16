"use client";

import { type ReactNode, useEffect, useState } from "react";

import { bindClientStateToUser, clearUserScopedClientState } from "@/modules/account/client-state";
import { logoutAction } from "@/modules/account/server/auth-actions";
import { Button } from "@/ui/button";

export function AuthStateBoundary({
  authUserId,
  children,
}: {
  authUserId: string;
  children: ReactNode;
}) {
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

  if (boundUserId !== authUserId) return <p role="status">Подготавливаем приватную сессию…</p>;
  return (
    <>
      {children}
      <form action={logoutAction} onSubmit={clearUserScopedClientState}>
        <Button type="submit">Выйти</Button>
      </form>
    </>
  );
}
