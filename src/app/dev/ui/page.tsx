import { notFound } from "next/navigation";

import { Button } from "@/ui/button";
import { StatusBadge } from "@/ui/status-badge";
import { Surface } from "@/ui/surface";

export const dynamic = "force-dynamic";

export default function UiFoundationPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header>
        <p className="text-sm font-semibold text-accent">Development only</p>
        <h1 className="mt-2 text-3xl leading-10 font-semibold">UI foundation</h1>
      </header>
      <Surface>
        <h2 className="text-2xl leading-8 font-semibold">Semantic primitives</h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button>Основное действие</Button>
          <StatusBadge tone="success">Готово</StatusBadge>
          <StatusBadge tone="warning">Требует внимания</StatusBadge>
          <StatusBadge tone="error">Ошибка</StatusBadge>
          <StatusBadge tone="info">Информация</StatusBadge>
        </div>
      </Surface>
    </main>
  );
}
