import type { Metadata } from "next";

import { AuthForms } from "@/app/auth/auth-forms";
import { getSafeAuthRedirectPath } from "@/modules/account/auth-redirect";
import { Surface } from "@/ui/surface";

export const metadata: Metadata = { title: "Вход — AI Wardrobe" };

const messages: Record<string, string> = {
  "signed-out": "Вы вышли из аккаунта.",
};
const errors: Record<string, string> = {
  "invalid-callback": "Ссылка для входа некорректна.",
  "expired-link": "Ссылка устарела или уже использована.",
  "invalid-session": "Не удалось подтвердить сессию.",
  "account-unavailable": "Аккаунт временно недоступен.",
  request: "Не удалось подтвердить источник запроса.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; next?: string }>;
}) {
  const query = await searchParams;
  const message = query.error
    ? errors[query.error]
    : query.status
      ? messages[query.status]
      : undefined;

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8"
    >
      <Surface className="w-full">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-accent">AI Wardrobe</p>
          <h1 className="text-3xl font-semibold tracking-tight">Ваш приватный гардероб</h1>
          <p className="text-text-secondary">
            Войдите или создайте аккаунт. Данные каждого аккаунта изолированы.
          </p>
        </div>
        {message ? (
          <p
            className={`mb-6 rounded-lg p-3 ${query.error ? "bg-[var(--aw-error-surface)] text-[var(--aw-error)]" : "bg-[var(--aw-success-surface)] text-[var(--aw-success)]"}`}
            role={query.error ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
        <AuthForms next={getSafeAuthRedirectPath(query.next ?? null)} />
      </Surface>
    </main>
  );
}
