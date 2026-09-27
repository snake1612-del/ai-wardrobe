import { getServerI18n } from "@/i18n/server";

export default async function Loading() {
  const { t } = await getServerI18n();
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-5xl px-4 py-12" aria-busy="true">
      <span className="sr-only">{t("Загрузка")}</span>
      <div className="h-48 max-w-2xl animate-pulse rounded-[var(--aw-radius-lg)] bg-surface-muted motion-reduce:animate-none" />
    </main>
  );
}
