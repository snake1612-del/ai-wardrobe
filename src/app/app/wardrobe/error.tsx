"use client";
import { useI18n } from "@/i18n/context";
export default function WardrobeError({ reset }: Readonly<{ reset: () => void }>) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-[var(--aw-error-surface)] p-6 text-[var(--aw-error)]">
      <h1 className="text-2xl font-semibold">{t("Гардероб не загрузился")}</h1>
      <p className="mt-2">{t("Приватные данные не были показаны. Попробуйте запрос ещё раз.")}</p>
      <button
        className="mt-5 min-h-12 rounded-lg border border-current px-5 font-semibold"
        onClick={reset}
      >
        {t("Повторить")}
      </button>
    </div>
  );
}
