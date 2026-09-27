"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useI18n } from "@/i18n/context";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { getPublicEnvironment } from "@/platform/env/public";
import { IMPORT_MAX_ARCHIVE_BYTES, IMPORT_MAX_PARTS } from "@/modules/import/model";
import {
  retainImportUploadSelection,
  shouldTransferImportPart,
  transferImportPart,
  type ImportUploadSelection,
} from "@/modules/import/import-tus-upload";

type Progress = Readonly<{ part: number; percent: number }>;

function publicMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function ImportChooser() {
  const { t } = useI18n();
  const router = useRouter();
  const cancelUploadRef = useRef<(() => void) | null>(null);
  const activeSessionRef = useRef<{ id: string; version: number } | null>(null);
  const selectionRef = useRef<ImportUploadSelection | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retryAvailable, setRetryAvailable] = useState(false);

  async function start() {
    if (files.length < 1 || files.length > IMPORT_MAX_PARTS) return;
    setBusy(true);
    setError("");
    const retrying = selectionRef.current !== null;
    const selection = retainImportUploadSelection(selectionRef.current, files);
    selectionRef.current = selection;
    try {
      const intentResponse = await fetch("/api/import/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parts: files.map((file) => ({ byteSize: file.size })),
          idempotencyKey: selection.idempotencyKey,
        }),
      });
      const intent = (await intentResponse.json()) as {
        session_id?: string;
        version?: number;
        tusEndpoint?: string;
        parts?: Array<{ part_id: string; bucket: string; object_key: string; state: string }>;
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
        const completionUrl = `/api/import/sessions/${intent.session_id}/parts/${part.part_id}/complete`;
        const shouldTransfer = await shouldTransferImportPart(part.state, retrying, () =>
          fetch(completionUrl, { method: "POST" }),
        );
        if (!shouldTransfer) continue;
        await transferImportPart(file, {
          endpoint: tusEndpoint,
          accessToken: data.session.access_token,
          apiKey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          bucket: part.bucket,
          objectKey: part.object_key,
          onFailure: (failure) => console.warn("import.tus.upload.failed", failure),
          onProgress: (uploaded, total) => {
            setProgress({
              part: index + 1,
              percent: total > 0 ? Math.round((uploaded / total) * 100) : 0,
            });
          },
          setCancel: (cancel) => {
            cancelUploadRef.current = cancel;
          },
        });
        const completion = await fetch(completionUrl, { method: "POST" });
        const completionBody = (await completion.json()) as { error?: { message?: string } };
        if (!completion.ok) {
          throw new Error(completionBody.error?.message ?? "Загрузка не подтверждена.");
        }
      }
      selectionRef.current = null;
      setRetryAvailable(false);
      router.push(`/app/import/${intent.session_id}`);
      router.refresh();
    } catch (caught) {
      if (caught instanceof Error && caught.message === "upload_cancelled") {
        selectionRef.current = null;
        setRetryAvailable(false);
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
        setRetryAvailable(true);
        setError(publicMessage(caught, "Импорт не подготовлен."));
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
      <h2 className="text-xl font-semibold">{t("Выбор архива")}</h2>
      <p className="mt-2 text-sm text-text-secondary">
        {t("Выберите до четырёх ZIP с JPEG/PNG. До явного Confirm вещи не создаются.")}
      </p>
      <label className="mt-5 block">
        <span className="mb-2 block font-medium">{t("Архивы")}</span>
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
            selectionRef.current = null;
            setRetryAvailable(false);
            setError("");
          }}
        />
      </label>
      {files.length ? (
        <p className="mt-3 text-sm" aria-live="polite">
          {t("Выбрано архивов: {count}", { count: files.length })}
        </p>
      ) : null}
      {progress ? (
        <div className="mt-4" role="status" aria-live="polite">
          <p className="text-sm">
            {t("Архив {part}: {percent}%", { part: progress.part, percent: progress.percent })}
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
          {t(error)}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="min-h-12 rounded-lg bg-accent px-5 font-semibold text-inverse disabled:opacity-50"
          type="button"
          disabled={busy || files.length === 0}
          onClick={() => void start()}
        >
          {busy ? t("Загружаем…") : retryAvailable ? t("Повторить загрузку") : t("Загрузить")}
        </button>
        {busy ? (
          <button
            className="min-h-12 rounded-lg border border-border-strong px-5 font-semibold"
            type="button"
            onClick={() => cancelUploadRef.current?.()}
          >
            {t("Остановить")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
