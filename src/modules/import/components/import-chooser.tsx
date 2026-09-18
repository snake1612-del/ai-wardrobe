"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import * as tus from "tus-js-client";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { getPublicEnvironment } from "@/platform/env/public";
import { IMPORT_MAX_ARCHIVE_BYTES, IMPORT_MAX_PARTS } from "@/modules/import/model";

type Progress = Readonly<{ part: number; percent: number }>;

function publicMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Импорт не подготовлен.";
}

export function ImportChooser() {
  const router = useRouter();
  const cancelUploadRef = useRef<(() => void) | null>(null);
  const activeSessionRef = useRef<{ id: string; version: number } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    if (files.length < 1 || files.length > IMPORT_MAX_PARTS) return;
    setBusy(true);
    setError("");
    try {
      const intentResponse = await fetch("/api/import/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parts: files.map((file) => ({ byteSize: file.size })),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const intent = (await intentResponse.json()) as {
        session_id?: string;
        version?: number;
        tusEndpoint?: string;
        parts?: Array<{ part_id: string; bucket: string; object_key: string }>;
        error?: { message?: string };
      };
      if (!intentResponse.ok || !intent.session_id || !intent.tusEndpoint || !intent.parts) {
        throw new Error(intent.error?.message ?? "Не удалось подготовить загрузку.");
      }
      activeSessionRef.current = { id: intent.session_id, version: intent.version ?? 1 };
      const tusEndpoint = intent.tusEndpoint;
      const { data } = await createSupabaseBrowserClient().auth.getSession();
      if (!data.session?.access_token) throw new Error("Сессия устарела. Войдите снова.");
      const environment = getPublicEnvironment();
      for (const [index, file] of files.entries()) {
        const part = intent.parts[index];
        if (!part) throw new Error("Ответ загрузки неполный.");
        await new Promise<void>((resolve, reject) => {
          const operation = new tus.Upload(file, {
            endpoint: tusEndpoint,
            retryDelays: [0, 1_000, 3_000, 5_000],
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            storeFingerprintForResuming: false,
            headers: {
              authorization: `Bearer ${data.session!.access_token}`,
              apikey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
            },
            metadata: {
              bucketName: part.bucket,
              objectName: part.object_key,
              contentType: "application/zip",
              cacheControl: "0",
            },
            onError: () => reject(new Error("Не удалось передать архив. Повторите загрузку.")),
            onProgress: (uploaded, total) => {
              setProgress({
                part: index + 1,
                percent: total > 0 ? Math.round((uploaded / total) * 100) : 0,
              });
            },
            onSuccess: () => {
              cancelUploadRef.current = null;
              resolve();
            },
          });
          cancelUploadRef.current = () => {
            void operation.abort().finally(() => reject(new Error("upload_cancelled")));
          };
          operation.start();
        });
        const completion = await fetch(
          `/api/import/sessions/${intent.session_id}/parts/${part.part_id}/complete`,
          { method: "POST" },
        );
        const completionBody = (await completion.json()) as { error?: { message?: string } };
        if (!completion.ok) {
          throw new Error(completionBody.error?.message ?? "Загрузка не подтверждена.");
        }
      }
      router.push(`/app/import/${intent.session_id}`);
      router.refresh();
    } catch (caught) {
      if (caught instanceof Error && caught.message === "upload_cancelled") {
        const active = activeSessionRef.current;
        if (active) {
          const cancellation = await fetch(`/api/import/sessions/${active.id}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedVersion: active.version }),
          });
          if (!cancellation.ok) {
            setError("Передача остановлена. Откройте импорт и повторите отмену.");
            return;
          }
        }
        setError("Импорт отменён; staged data поставлены на cleanup.");
      } else {
        setError(publicMessage(caught));
      }
    } finally {
      cancelUploadRef.current = null;
      activeSessionRef.current = null;
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Choose</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Выберите до четырёх ZIP с JPEG/PNG. До явного Confirm вещи не создаются.
      </p>
      <label className="mt-5 block">
        <span className="mb-2 block font-medium">Архивы</span>
        <input
          className="field"
          type="file"
          accept=".zip,application/zip"
          multiple
          disabled={busy}
          onChange={(event) => {
            const selected = [...(event.target.files ?? [])];
            const total = selected.reduce((sum, file) => sum + file.size, 0);
            if (
              selected.length < 1 ||
              selected.length > IMPORT_MAX_PARTS ||
              selected.some((file) => !file.name.toLowerCase().endsWith(".zip")) ||
              total > IMPORT_MAX_ARCHIVE_BYTES
            ) {
              setFiles([]);
              setError("Выберите 1–4 ZIP общим размером не более 1 ГиБ.");
              return;
            }
            setFiles(selected);
            setError("");
          }}
        />
      </label>
      {files.length ? (
        <p className="mt-3 text-sm" aria-live="polite">
          Выбрано архивов: {files.length}
        </p>
      ) : null}
      {progress ? (
        <div className="mt-4" role="status" aria-live="polite">
          <p className="text-sm">
            Архив {progress.part}: {progress.percent}%
          </p>
          <progress className="w-full" value={progress.percent} max={100}>
            {progress.percent}%
          </progress>
        </div>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-lg bg-[var(--aw-error-surface)] p-3 text-[var(--aw-error)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="min-h-12 rounded-lg bg-accent px-5 font-semibold text-white disabled:opacity-50"
          type="button"
          disabled={busy || files.length === 0}
          onClick={() => void start()}
        >
          {busy ? "Загружаем…" : "Prepare"}
        </button>
        {busy ? (
          <button
            className="min-h-12 rounded-lg border border-border-strong px-5 font-semibold"
            type="button"
            onClick={() => cancelUploadRef.current?.()}
          >
            Остановить
          </button>
        ) : null}
      </div>
    </section>
  );
}
