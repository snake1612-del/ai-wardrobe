"use client";

import { useEffect } from "react";
import { useI18n } from "@/i18n/context";
import { Button } from "@/ui/button";
import { Surface } from "@/ui/surface";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(
      JSON.stringify({ level: "error", code: "route_error", digest: error.digest ?? null }),
    );
  }, [error]);
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12">
      <Surface tone="error">
        <h1 className="text-2xl leading-8 font-semibold">{t("Не удалось загрузить страницу")}</h1>
        <p className="mt-3">
          {t(
            "Попробуйте ещё раз. Технические детали не показываются и не содержат пользовательские данные.",
          )}
        </p>
        <Button className="mt-6" onClick={reset}>
          {t("Повторить")}
        </Button>
      </Surface>
    </main>
  );
}
