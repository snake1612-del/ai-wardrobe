import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { resolveAccountContext } from "@/modules/account/server/account-context";
import { Surface } from "@/ui/surface";

export default async function WardrobeLayout({ children }: Readonly<{ children: ReactNode }>) {
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

  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Гардероб" className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/app" className="font-semibold text-accent underline-offset-4 hover:underline">
          AI Wardrobe
        </Link>
        <Link
          href="/app/wardrobe"
          className="text-text-secondary underline-offset-4 hover:underline"
        >
          Гардероб
        </Link>
      </nav>
      {children}
    </main>
  );
}
