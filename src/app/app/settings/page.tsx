import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthStateBoundary } from "@/app/app/auth-state-boundary";
import { LocaleSwitcher } from "@/i18n/locale-switcher";
import { getServerI18n } from "@/i18n/server";
import { RegionalSettingsForm } from "@/modules/account/settings-forms";
import { resolveAccountContext } from "@/modules/account/server/account-context";
import { getAccountSettings } from "@/modules/account/server/account-settings";
import { Surface } from "@/ui/surface";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [{ t }, resolution] = await Promise.all([getServerI18n(), resolveAccountContext()]);
  if (resolution.status === "anonymous") redirect("/auth?error=invalid-session");
  if (resolution.status === "unavailable") {
    return (
      <main id="main-content" className="mx-auto min-h-screen max-w-4xl px-4 py-12">
        <Surface tone="error">
          <h1 className="text-2xl font-semibold">{t("Настройки временно недоступны")}</h1>
          <p className="mt-3">{t("Повторите попытку позже. Настройки аккаунта не изменялись.")}</p>
        </Surface>
      </main>
    );
  }

  const settings = await getAccountSettings(resolution.context.accountId);

  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6">
      <AuthStateBoundary authUserId={resolution.context.authUserId}>
        <nav aria-label={t("Навигация настроек")} className="mb-6 flex flex-wrap gap-4">
          <Link className="font-semibold text-accent hover:underline" href="/app">
            {t("AI Wardrobe")}
          </Link>
          <Link className="text-text-secondary hover:underline" href="/app/profile">
            {t("Личный аккаунт")}
          </Link>
          <Link className="text-text-secondary hover:underline" href="/app/wardrobe">
            {t("Гардероб")}
          </Link>
          <Link className="text-text-secondary hover:underline" href="/app/import">
            {t("Bulk Import")}
          </Link>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold">{t("Настройки")}</h1>
          <p className="mt-2 text-text-secondary">
            {t("Управляйте языком и региональными параметрами текущего аккаунта.")}
          </p>
        </div>

        <div className="space-y-6">
          <Surface aria-labelledby="settings-language-heading">
            <h2 id="settings-language-heading" className="mb-2 text-xl font-semibold">
              {t("Язык интерфейса")}
            </h2>
            <p className="mb-4 text-sm text-text-secondary">
              {t("Язык применяется ко всему интерфейсу и сохраняется между входами.")}
            </p>
            <LocaleSwitcher />
          </Surface>

          <Surface aria-labelledby="settings-regional-heading">
            <h2 id="settings-regional-heading" className="mb-4 text-xl font-semibold">
              {t("Региональные настройки")}
            </h2>
            <RegionalSettingsForm settings={settings} />
          </Surface>

          <Surface aria-labelledby="settings-account-heading">
            <h2 id="settings-account-heading" className="mb-2 text-xl font-semibold">
              {t("Аккаунт и приватность")}
            </h2>
            <p className="text-text-secondary">
              {t("Имя, email и пароль редактируются в профиле текущего аккаунта.")}
            </p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
              href="/app/profile"
            >
              {t("Открыть профиль")}
            </Link>
          </Surface>

          <Surface aria-labelledby="settings-data-heading">
            <h2 id="settings-data-heading" className="mb-2 text-xl font-semibold">
              {t("Данные")}
            </h2>
            <p className="text-text-secondary">
              {t("Откройте гардероб или подготовьте приватный массовый импорт.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link className="font-semibold text-accent hover:underline" href="/app/wardrobe">
                {t("Открыть гардероб")}
              </Link>
              <Link className="font-semibold text-accent hover:underline" href="/app/import">
                {t("Открыть Bulk Import")}
              </Link>
            </div>
          </Surface>
        </div>
      </AuthStateBoundary>
    </main>
  );
}
