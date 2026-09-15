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
          <StatusBadge tone="info">Project foundation</StatusBadge>
          <div className="space-y-3">
            <h1 className="text-[2rem] leading-10 font-semibold tracking-[-0.02em] sm:text-[2.5rem] sm:leading-12">
              AI Wardrobe
            </h1>
            <p className="max-w-xl text-lg leading-7 text-text-secondary">
              Базовая среда приложения запущена. Пользовательские функции гардероба будут
              реализованы в следующих фазах.
            </p>
          </div>
          <dl className="grid gap-3 border-t border-border-subtle pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Этап</dt>
              <dd className="mt-1 text-text-secondary">Phase 6 — Project Foundation</dd>
            </div>
            <div>
              <dt className="font-semibold">Данные</dt>
              <dd className="mt-1 text-text-secondary">Только синтетические fixtures</dd>
            </div>
          </dl>
        </div>
      </Surface>
    </main>
  );
}
