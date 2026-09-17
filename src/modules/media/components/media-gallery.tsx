"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import * as tus from "tus-js-client";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { getPublicEnvironment } from "@/platform/env/public";

import {
  acceptedMediaTypes,
  MEDIA_MAX_BYTES,
  mediaStateLabel,
  type MediaGalleryEntry,
} from "../model";

type Props = Readonly<{
  itemId: string;
  itemVersion: number;
  variants: ReadonlyArray<Readonly<{ id: string; label: string }>>;
  initialEntries: ReadonlyArray<MediaGalleryEntry>;
}>;

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "completing" }
  | { kind: "error"; message: string }
  | { kind: "done" };

async function responseJson(response: Response) {
  const body = (await response.json()) as { error?: { message?: string }; version?: number };
  if (!response.ok) throw new Error(body.error?.message ?? "Операция не выполнена.");
  return body;
}

export function MediaGallery({ itemId, itemVersion, variants, initialEntries }: Props) {
  const router = useRouter();
  const uploadRef = useRef<tus.Upload | null>(null);
  const [entries, setEntries] = useState(
    [...initialEntries].sort((a, b) => a.position - b.position),
  );
  const [version, setVersion] = useState(itemVersion);
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" });
  const [mutationPending, setMutationPending] = useState(false);
  const [appearanceVariantId, setAppearanceVariantId] = useState("");
  const [imageView, setImageView] = useState("unspecified");
  const [replacesAssetId, setReplacesAssetId] = useState("");
  const accepted = useMemo(() => acceptedMediaTypes.join(","), []);

  async function upload(file: File) {
    if (!acceptedMediaTypes.includes(file.type as (typeof acceptedMediaTypes)[number])) {
      setUploadState({
        kind: "error",
        message:
          "Поддерживаются только JPEG, PNG и WebP. HEIC/HEIF, SVG, GIF, AVIF и PDF отклоняются.",
      });
      return;
    }
    if (file.size <= 0 || file.size > MEDIA_MAX_BYTES) {
      setUploadState({ kind: "error", message: "Файл должен быть не больше 16 МиБ." });
      return;
    }
    setUploadState({ kind: "uploading", progress: 0 });
    try {
      const intentResponse = await fetch("/api/media/upload-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          appearanceVariantId: appearanceVariantId || null,
          originalFilename: file.name,
          declaredMimeType: file.type,
          declaredByteSize: file.size,
          productRole: "catalog",
          imageView,
          replacesAssetId: replacesAssetId || null,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const intent = (await intentResponse.json()) as {
        assetId?: string;
        bucket?: string;
        objectKey?: string;
        tusEndpoint?: string;
        error?: { message?: string };
      };
      if (
        !intentResponse.ok ||
        !intent.assetId ||
        !intent.bucket ||
        !intent.objectKey ||
        !intent.tusEndpoint
      ) {
        throw new Error(intent.error?.message ?? "Не удалось подготовить загрузку.");
      }
      const { data } = await createSupabaseBrowserClient().auth.getSession();
      if (!data.session?.access_token) throw new Error("Сессия устарела. Войдите снова.");
      const environment = getPublicEnvironment();
      const tusEndpoint = intent.tusEndpoint;
      const bucket = intent.bucket;
      const objectKey = intent.objectKey;
      const accessToken = data.session.access_token;
      await new Promise<void>((resolve, reject) => {
        const operation = new tus.Upload(file, {
          endpoint: tusEndpoint,
          retryDelays: [0, 1000, 3000, 5000],
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          storeFingerprintForResuming: false,
          headers: {
            authorization: `Bearer ${accessToken}`,
            apikey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          },
          metadata: {
            bucketName: bucket,
            objectName: objectKey,
            contentType: file.type,
            cacheControl: "0",
          },
          onError: reject,
          onProgress: (uploaded, total) => {
            setUploadState({
              kind: "uploading",
              progress: total > 0 ? Math.round((uploaded / total) * 100) : 0,
            });
          },
          onSuccess: () => resolve(),
        });
        uploadRef.current = operation;
        operation.start();
      });
      setUploadState({ kind: "completing" });
      const completion = await fetch(`/api/media/${intent.assetId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      await responseJson(completion);
      setUploadState({ kind: "done" });
      setReplacesAssetId("");
      router.refresh();
    } catch (error) {
      setUploadState({
        kind: "error",
        message: error instanceof Error ? error.message : "Загрузка не выполнена.",
      });
    }
  }

  async function saveGallery(nextEntries: MediaGalleryEntry[], primaryBindingId: string) {
    if (mutationPending) return;
    setMutationPending(true);
    try {
      const response = await fetch(`/api/media/items/${itemId}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedItemVersion: version,
          bindingIds: nextEntries.map(({ bindingId }) => bindingId),
          primaryBindingId,
        }),
      });
      const result = await responseJson(response);
      setVersion(result.version ?? version);
      setEntries(
        nextEntries.map((entry, index) => ({
          ...entry,
          position: index,
          isPrimary: entry.bindingId === primaryBindingId,
        })),
      );
      router.refresh();
    } catch (error) {
      setUploadState({
        kind: "error",
        message: error instanceof Error ? error.message : "Конфликт галереи.",
      });
    } finally {
      setMutationPending(false);
    }
  }

  async function remove(entry: MediaGalleryEntry) {
    if (mutationPending) return;
    setMutationPending(true);
    try {
      const response = await fetch(`/api/media/bindings/${entry.bindingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, expectedItemVersion: version }),
      });
      const result = await responseJson(response);
      setVersion(result.version ?? version);
      setEntries((current) => {
        const remaining = current.filter(({ bindingId }) => bindingId !== entry.bindingId);
        if (!entry.isPrimary || remaining.some(({ isPrimary }) => isPrimary)) return remaining;
        const nextPrimary = remaining.find(({ state, productRole }) => {
          return state === "ready" && productRole === "catalog";
        });
        return remaining.map((candidate) => ({
          ...candidate,
          isPrimary: candidate.bindingId === nextPrimary?.bindingId,
        }));
      });
      router.refresh();
    } catch (error) {
      setUploadState({
        kind: "error",
        message: error instanceof Error ? error.message : "Удаление не выполнено.",
      });
    } finally {
      setMutationPending(false);
    }
  }

  async function retry(entry: MediaGalleryEntry) {
    try {
      const response = await fetch(`/api/media/${entry.assetId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: entry.version }),
      });
      await responseJson(response);
      router.refresh();
    } catch (error) {
      setUploadState({
        kind: "error",
        message: error instanceof Error ? error.message : "Повтор не выполнен.",
      });
    }
  }

  function move(index: number, delta: -1 | 1) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= entries.length) return;
    const next = [...entries];
    [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
    const primary = next.find(({ isPrimary }) => isPrimary)?.bindingId ?? next[0]?.bindingId;
    if (primary) void saveGallery(next, primary);
  }

  const readyEntries = entries.filter(({ state }) => state === "ready");

  return (
    <section className="mt-8 border-t border-border-subtle pt-6" aria-labelledby="media-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="media-heading" className="text-xl font-semibold">
            Изображения
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Приватные оригиналы проверяются до публикации.
          </p>
        </div>
        <label className="inline-flex min-h-12 cursor-pointer items-center rounded-lg bg-accent px-4 font-semibold text-white">
          Добавить изображение
          <input
            className="sr-only"
            type="file"
            accept={accepted}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label>
          <span className="mb-1 block text-sm font-medium">Ракурс</span>
          <select
            className="field"
            value={imageView}
            onChange={(event) => setImageView(event.target.value)}
          >
            <option value="unspecified">Не указан</option>
            <option value="front">Спереди</option>
            <option value="back">Сзади</option>
            <option value="side">Сбоку</option>
            <option value="detail">Деталь</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">Внешний вид</span>
          <select
            className="field"
            value={appearanceVariantId}
            onChange={(event) => setAppearanceVariantId(event.target.value)}
          >
            <option value="">Общий для вещи</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">Заменить</span>
          <select
            className="field"
            value={replacesAssetId}
            onChange={(event) => setReplacesAssetId(event.target.value)}
          >
            <option value="">Добавить новое</option>
            {readyEntries.map((entry) => (
              <option key={entry.assetId} value={entry.assetId}>
                {entry.originalFilename ?? entry.imageView}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4" aria-live="polite">
        {uploadState.kind === "uploading" ? (
          <div>
            <p>Загрузка: {uploadState.progress}%</p>
            <progress className="mt-2 w-full" max={100} value={uploadState.progress}>
              {uploadState.progress}%
            </progress>
            <button
              className="mt-2 text-sm underline"
              type="button"
              onClick={() => uploadRef.current?.abort()}
            >
              Отменить
            </button>
          </div>
        ) : uploadState.kind === "completing" ? (
          <p>Проверяем загруженный объект…</p>
        ) : uploadState.kind === "done" ? (
          <p>Файл загружен. Обработка выполняется в приватной очереди.</p>
        ) : uploadState.kind === "error" ? (
          <p role="alert" className="text-[var(--aw-error)]">
            {uploadState.message}
          </p>
        ) : null}
      </div>

      {entries.length ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2" aria-label="Галерея вещи">
          {entries.map((entry, index) => (
            <li key={entry.bindingId} className="rounded-xl border border-border-subtle p-3">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
                {entry.state === "ready" && entry.renditionId ? (
                  <Image
                    alt={`${entry.imageView === "unspecified" ? "Изображение вещи" : `Ракурс: ${entry.imageView}`}${entry.isPrimary ? ", основное" : ""}`}
                    src={`/api/media/renditions/${entry.renditionId}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-contain"
                  />
                ) : (
                  <p className="px-4 text-center text-sm text-text-secondary">
                    {mediaStateLabel(entry.state, entry.failureCode)}
                  </p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {entry.isPrimary ? (
                  <span className="rounded-full bg-surface-selected px-2 py-1">Основное</span>
                ) : null}
                <span>{entry.imageView}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.state === "ready" ? (
                  <>
                    <button
                      type="button"
                      className="underline disabled:opacity-40"
                      disabled={mutationPending || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      Раньше
                    </button>
                    <button
                      type="button"
                      className="underline disabled:opacity-40"
                      disabled={mutationPending || index === entries.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      Позже
                    </button>
                    {!entry.isPrimary ? (
                      <button
                        type="button"
                        disabled={mutationPending}
                        className="underline disabled:opacity-40"
                        onClick={() => void saveGallery(entries, entry.bindingId)}
                      >
                        Сделать основным
                      </button>
                    ) : null}
                  </>
                ) : null}
                {entry.state === "failed" ? (
                  <button type="button" className="underline" onClick={() => void retry(entry)}>
                    Повторить
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={mutationPending}
                  className="text-[var(--aw-error)] underline disabled:opacity-40"
                  onClick={() => void remove(entry)}
                >
                  Убрать
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-lg bg-surface-muted p-5 text-text-secondary">
          Изображений пока нет.
        </p>
      )}
    </section>
  );
}
