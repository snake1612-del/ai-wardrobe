"use client";

export default function WardrobeError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[var(--aw-error)] bg-[var(--aw-error-surface)] p-8"
    >
      <h1 className="text-2xl font-semibold">Гардероб не загрузился</h1>
      <p className="mt-2">Приватные данные не были показаны. Попробуйте запрос ещё раз.</p>
      <button
        className="mt-5 min-h-12 rounded-lg bg-accent px-5 font-semibold text-white"
        onClick={reset}
      >
        Повторить
      </button>
    </div>
  );
}
