"use client";
import { useI18n } from "@/i18n/context";
import { Button } from "@/ui/button";
import { Surface } from "@/ui/surface";
export default function ProfileError({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <Surface tone="error">
        <h1 className="text-2xl font-semibold">{t("Не удалось загрузить профиль")}</h1>
        <p className="mt-3">{t("Повторите попытку. Данные аккаунта не изменялись.")}</p>
        <Button className="mt-5" onClick={reset}>
          {t("Повторить")}
        </Button>
      </Surface>
    </main>
  );
}
