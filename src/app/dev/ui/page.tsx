import { notFound } from "next/navigation";
import { getServerI18n } from "@/i18n/server";

import { StatusBadge } from "@/ui/status-badge";
import { Surface } from "@/ui/surface";

export const dynamic = "force-dynamic";

export default async function UiFoundationPage() {
  const { t } = await getServerI18n();
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header>
        <p className="text-sm font-semibold text-accent">{t("Development only")}</p>
        <h1 className="mt-2 text-3xl leading-10 font-semibold">{t("UI foundation")}</h1>
      </header>
      <Surface>
        <h2 className="text-2xl leading-8 font-semibold">{t("Semantic primitives")}</h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StatusBadge tone="success">{t("Готово")}</StatusBadge>
          <StatusBadge tone="warning">{t("Требует внимания")}</StatusBadge>
          <StatusBadge tone="error">{t("Ошибка")}</StatusBadge>
          <StatusBadge tone="info">{t("Информация")}</StatusBadge>
        </div>
      </Surface>
    </main>
  );
}
