import { getServerI18n } from "@/i18n/server";

export default async function SettingsLoading() {
  const { t } = await getServerI18n();
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-4xl px-4 py-12" aria-busy="true">
      <div className="animate-pulse space-y-6" role="status">
        <span className="sr-only">{t("Загружаем настройки…")}</span>
        <div className="h-10 w-56 rounded bg-surface-muted" />
        <div className="h-48 rounded-[var(--aw-radius-lg)] bg-surface-muted" />
        <div className="h-80 rounded-[var(--aw-radius-lg)] bg-surface-muted" />
      </div>
    </main>
  );
}
