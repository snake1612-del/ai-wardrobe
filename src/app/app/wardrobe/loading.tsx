export default function WardrobeLoading() {
  return (
    <div role="status" aria-busy="true">
      <p className="sr-only">Загружаем приватный гардероб…</p>
      <div className="mb-6 h-10 w-56 animate-pulse rounded-lg bg-surface-selected" />
      <div className="mb-5 h-12 animate-pulse rounded-lg bg-surface-selected" />
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="hidden h-80 animate-pulse rounded-xl bg-surface-selected lg:block" />
        <ul aria-hidden="true" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <li
              key={index}
              className="overflow-hidden rounded-xl border border-border-subtle bg-surface"
            >
              <div className="aspect-square animate-pulse bg-surface-selected" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-4/5 animate-pulse rounded bg-surface-selected" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-surface-selected" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
