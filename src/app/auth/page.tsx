import type { Metadata } from "next";
import { AuthForms } from "@/app/auth/auth-forms";
import { getServerI18n } from "@/i18n/server";
import { getSafeAuthRedirectPath } from "@/modules/account/auth-redirect";
import { Surface } from "@/ui/surface";

const messages: Record<string, string> = { "signed-out": "Вы вышли из аккаунта." };
const errors: Record<string, string> = {
  "invalid-callback": "Ссылка для входа некорректна.",
  "expired-link": "Ссылка устарела или уже использована.",
  "invalid-session": "Не удалось подтвердить сессию.",
  "account-unavailable": "Аккаунт временно недоступен.",
  request: "Не удалось подтвердить источник запроса.",
  signout: "Не удалось завершить сессию. Вернитесь в приложение и повторите попытку.",
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: `${t("Войти")} — AI Wardrobe` };
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; next?: string }>;
}) {
  const [query, { t }] = await Promise.all([searchParams, getServerI18n()]);
  const key = query.error ? errors[query.error] : query.status ? messages[query.status] : undefined;
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8"
    >
      <Surface className="w-full">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-accent">{t("AI Wardrobe")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("Ваш приватный гардероб")}</h1>
          <p className="text-text-secondary">
            {t("Войдите или создайте аккаунт. Данные каждого аккаунта изолированы.")}
          </p>
        </div>
        {key ? (
          <p
            className={`mb-6 rounded-lg p-3 ${query.error ? "bg-[var(--aw-error-surface)] text-[var(--aw-error)]" : "bg-[var(--aw-success-surface)] text-[var(--aw-success)]"}`}
            role={query.error ? "alert" : "status"}
          >
            {t(key)}
          </p>
        ) : null}
        <AuthForms next={getSafeAuthRedirectPath(query.next ?? null)} />
      </Surface>
    </main>
  );
}
