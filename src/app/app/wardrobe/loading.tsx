import { getServerI18n } from "@/i18n/server";
export default async function WardrobeLoading() {
  const { t } = await getServerI18n();
  return (
    <div className="animate-pulse space-y-5 motion-reduce:animate-none" aria-busy="true">
      <p className="sr-only">{t("Загружаем приватный гардероб…")}</p>
      <div className="h-10 w-52 rounded bg-surface-muted" />
      <div className="h-12 rounded bg-surface-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="aspect-[4/5] rounded-xl bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
