import { redirect } from "next/navigation";
import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";
import { getServerI18n } from "@/i18n/server";
import { Surface } from "@/ui/surface";
import { UpdatePasswordForm } from "./update-password-form";
export const dynamic = "force-dynamic";
export default async function UpdatePasswordPage() {
  const [client, { t }] = await Promise.all([createSupabaseUserContextClient(), getServerI18n()]);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect("/auth?error=invalid-session");
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
      <Surface className="w-full">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{t("Новый пароль")}</h1>
            <p className="text-text-secondary">
              {t("Обновите пароль для подтверждённой сессии восстановления.")}
            </p>
          </div>
          <UpdatePasswordForm />
        </div>
      </Surface>
    </main>
  );
}
