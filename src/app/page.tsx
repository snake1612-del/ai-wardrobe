import { ButtonLink } from "@/ui/button";
import { StatusBadge } from "@/ui/status-badge";
import { Surface } from "@/ui/surface";

export default function Home() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8"
    >
      <Surface className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <StatusBadge tone="info">Auth foundation</StatusBadge>
          <div className="space-y-3">
            <h1 className="text-[2rem] leading-10 font-semibold tracking-[-0.02em] sm:text-[2.5rem] sm:leading-12">
              AI Wardrobe
            </h1>
            <p className="max-w-xl text-lg leading-7 text-text-secondary">
              Приватная основа аккаунта готова: защищённые сессии, восстановление доступа и изоляция
              данных.
            </p>
          </div>
          <div>
            <ButtonLink href="/auth">Войти или создать аккаунт</ButtonLink>
          </div>
          <dl className="grid gap-3 border-t border-border-subtle pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Этап</dt>
              <dd className="mt-1 text-text-secondary">Phase 7 — Auth Foundation</dd>
            </div>
            <div>
              <dt className="font-semibold">Данные</dt>
              <dd className="mt-1 text-text-secondary">Приватно для каждого аккаунта</dd>
            </div>
          </dl>
        </div>
      </Surface>
    </main>
  );
}
