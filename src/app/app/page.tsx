import Link from "next/link";
import { redirect } from "next/navigation";

import { resolveAccountContext } from "@/modules/account/server/account-context";
import { StatusBadge } from "@/ui/status-badge";
import { Surface } from "@/ui/surface";

import { AuthStateBoundary } from "./auth-state-boundary";

export const dynamic = "force-dynamic";

export default async function ProtectedAppPage() {
  const resolution = await resolveAccountContext();
  if (resolution.status === "anonymous") redirect("/auth?error=invalid-session");
  if (resolution.status === "unavailable") {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12"
      >
        <Surface tone="error" className="w-full">
          <h1 className="text-2xl font-semibold">Аккаунт временно недоступен</h1>
          <p className="mt-3">Повторите попытку позже. Приватные данные не загружались.</p>
        </Surface>
      </main>
    );
  }

  const { context } = resolution;
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6">
      <Surface>
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <AuthStateBoundary authUserId={context.authUserId}>
            <div className="space-y-3">
              <StatusBadge tone="success">Защищённая сессия</StatusBadge>
              <h1 className="text-3xl font-semibold">AI Wardrobe</h1>
              <p className="text-text-secondary">Ваш приватный каталог готов к работе.</p>
              <p className="text-sm text-text-tertiary">{context.email ?? "Email недоступен"}</p>
              <Link
                className="inline-flex min-h-12 items-center rounded-lg bg-accent px-5 font-semibold text-white"
                href="/app/wardrobe"
              >
                Открыть гардероб
              </Link>
              <Link
                className="ml-3 inline-flex min-h-12 items-center rounded-lg border border-border-strong px-5 font-semibold"
                href="/app/import"
              >
                Bulk Import
              </Link>
            </div>
          </AuthStateBoundary>
        </div>
      </Surface>
    </main>
  );
}
