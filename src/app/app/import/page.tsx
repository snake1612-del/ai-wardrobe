import Link from "next/link";

import { ImportChooser } from "@/modules/import/components/import-chooser";
import { importStateLabel, type ImportSessionState } from "@/modules/import/model";
import { listImportSessions } from "@/modules/import/server/import-queries";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const sessions = await listImportSessions();
  return (
    <>
      <header className="mb-6">
        <p className="text-sm text-text-tertiary">Приватный staging</p>
        <h1 className="text-3xl font-semibold">Bulk Import</h1>
        <p className="mt-2 max-w-3xl text-text-secondary">
          Adapter legacy-wardrobe-image-set/v1 принимает только image-only ZIP. Optional input
          manifest не поддерживается.
        </p>
      </header>
      <ImportChooser />
      <section className="mt-8" aria-labelledby="sessions-heading">
        <h2 id="sessions-heading" className="text-xl font-semibold">
          Последние импорты
        </h2>
        {sessions.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  className="block rounded-xl border border-border-subtle bg-surface p-4 hover:border-border-strong"
                  href={`/app/import/${session.id}`}
                >
                  <span className="font-medium">
                    {importStateLabel(session.state as ImportSessionState)}
                  </span>
                  <span className="mt-1 block text-sm text-text-secondary">
                    Версия {session.version}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-text-secondary">Импортов пока нет.</p>
        )}
      </section>
    </>
  );
}
