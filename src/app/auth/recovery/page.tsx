import Link from "next/link";
import { getServerI18n } from "@/i18n/server";
import { Surface } from "@/ui/surface";
import { RecoveryForm } from "./recovery-form";
export default async function RecoveryPage() {
  const { t } = await getServerI18n();
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
      <Surface className="w-full">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{t("Восстановить доступ")}</h1>
            <p className="text-text-secondary">
              {t("Ответ одинаков для существующих и неизвестных адресов.")}
            </p>
          </div>
          <RecoveryForm />
          <Link className="inline-block underline underline-offset-4" href="/auth">
            {t("Вернуться ко входу")}
          </Link>
        </div>
      </Surface>
    </main>
  );
}
