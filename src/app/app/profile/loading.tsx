import { getServerI18n } from "@/i18n/server";
export default async function ProfileLoading() {
  const { t } = await getServerI18n();
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-4 py-12" aria-busy="true">
      <div className="animate-pulse space-y-6" role="status">
        <span className="sr-only">{t("Загружаем профиль…")}</span>
        <div className="h-10 w-56 rounded bg-surface-muted" />
        <div className="h-56 rounded-[var(--aw-radius-lg)] bg-surface-muted" />
        <div className="h-64 rounded-[var(--aw-radius-lg)] bg-surface-muted" />
      </div>
    </main>
  );
}
