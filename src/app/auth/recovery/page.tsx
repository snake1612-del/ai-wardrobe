import Link from "next/link";

import { RecoveryForm } from "./recovery-form";
import { Surface } from "@/ui/surface";

export default function RecoveryPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
      <Surface className="w-full">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Восстановить доступ</h1>
            <p className="text-text-secondary">
              Ответ одинаков для существующих и неизвестных адресов.
            </p>
          </div>
          <RecoveryForm />
          <Link className="inline-block underline underline-offset-4" href="/auth">
            Вернуться ко входу
          </Link>
        </div>
      </Surface>
    </main>
  );
}
