"use client";

import { useRef, type ReactNode } from "react";

type FilterFormProps = Readonly<{
  autoApply?: boolean;
  children: ReactNode;
  className?: string;
}>;

export function WardrobeFilterForm({ autoApply = false, children, className }: FilterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action="/app/wardrobe"
      className={className}
      onChange={autoApply ? () => formRef.current?.requestSubmit() : undefined}
    >
      {children}
    </form>
  );
}

export function MobileWardrobeFilterSheet({ children }: Readonly<{ children: ReactNode }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <div className="mb-5 lg:hidden">
      <button
        type="button"
        className="min-h-12 w-full rounded-xl border border-border-subtle bg-surface px-4 text-left font-semibold"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        Фильтры
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="wardrobe-filter-title"
        className="fixed inset-x-0 bottom-0 top-auto m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-surface p-0 text-text-primary backdrop:bg-black/40"
      >
        <div className="mx-auto flex min-h-full max-w-xl flex-col p-5">
          <header className="mb-5 flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <h2 id="wardrobe-filter-title" className="text-2xl font-semibold">
              Фильтры гардероба
            </h2>
            <button
              type="button"
              className="min-h-11 rounded-lg px-3 text-sm font-semibold underline"
              onClick={() => dialogRef.current?.close()}
            >
              Закрыть
            </button>
          </header>
          {children}
        </div>
      </dialog>
    </div>
  );
}
