import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthStateBoundary } from "@/app/app/auth-state-boundary";
import { getServerI18n } from "@/i18n/server";
import { DisplayNameForm, EmailForm, PasswordForm } from "@/modules/account/profile-forms";
import { resolveAccountContext } from "@/modules/account/server/account-context";
import { getAccountProfile } from "@/modules/account/server/account-profile";
import { Surface } from "@/ui/surface";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [{ t }, resolution] = await Promise.all([getServerI18n(), resolveAccountContext()]);
  if (resolution.status === "anonymous") redirect("/auth?error=invalid-session");
  if (resolution.status === "unavailable")
    return (
      <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-4 py-12">
        <Surface tone="error">
          <h1 className="text-2xl font-semibold">{t("Профиль временно недоступен")}</h1>
          <p className="mt-3">{t("Повторите попытку позже. Данные аккаунта не изменялись.")}</p>
        </Surface>
      </main>
    );
  const profile = await getAccountProfile(resolution.context.accountId);
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6">
      <AuthStateBoundary authUserId={resolution.context.authUserId}>
        <div className="mb-6">
          <nav aria-label={t("Навигация настроек")} className="flex flex-wrap gap-4">
            <Link className="font-semibold text-accent hover:underline" href="/app">
              {t("← Назад")}
            </Link>
            <Link className="text-text-secondary hover:underline" href="/app/settings">
              {t("Настройки")}
            </Link>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold">{t("Личный аккаунт")}</h1>
          <p className="mt-2 text-text-secondary">
            {t("Управляйте именем, email и паролем текущего аккаунта.")}
          </p>
        </div>
        <div className="space-y-6">
          <Surface aria-labelledby="profile-name-heading">
            <h2 id="profile-name-heading" className="mb-4 text-xl font-semibold">
              {t("Профиль")}
            </h2>
            <DisplayNameForm displayName={profile.displayName} version={profile.version} />
          </Surface>
          <Surface aria-labelledby="profile-email-heading">
            <h2 id="profile-email-heading" className="mb-4 text-xl font-semibold">
              Email
            </h2>
            <EmailForm email={resolution.context.email} />
          </Surface>
          <Surface aria-labelledby="profile-password-heading">
            <h2 id="profile-password-heading" className="mb-4 text-xl font-semibold">
              {t("Пароль")}
            </h2>
            <PasswordForm />
          </Surface>
        </div>
      </AuthStateBoundary>
    </main>
  );
}
