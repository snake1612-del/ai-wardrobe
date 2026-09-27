"use client";

import { useI18n } from "@/i18n/context";
import { Button } from "@/ui/button";
import { Surface } from "@/ui/surface";

export default function SettingsError({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-4xl px-4 py-12">
      <Surface tone="error">
        <h1 className="text-2xl font-semibold">{t("Не удалось загрузить настройки")}</h1>
        <p className="mt-3">{t("Повторите попытку. Настройки аккаунта не изменялись.")}</p>
        <Button className="mt-5" onClick={reset}>
          {t("Повторить")}
        </Button>
      </Surface>
    </main>
  );
}
