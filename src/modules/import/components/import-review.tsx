"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/i18n/context";

import { importStateLabel, type ImportSessionState } from "../model";

type Asset = Readonly<{
  version: number;
  media_asset_id: string;
  source_reference: string;
  proposed_role: string | null;
  proposed_view: string | null;
  processing_state: string;
  rendition: { id: string; width_px: number | null; height_px: number | null } | null;
}>;
type Issue = Readonly<{ code: string; count: number; severity: string }>;
type Item = Readonly<{
  id: string;
  display_name: string | null;
  version: number;
  lifecycle_state: string;
}>;
type Category = Readonly<{ id: string; code: string; label: string }>;
type RecordResult = Readonly<{
  id: string;
  source_record_key: string;
  commit_outcome: string;
  committed_item_id: string | null;
  outcome_detail: unknown;
}>;
type Props = Readonly<{
  sessionId: string;
  initialState: ImportSessionState;
  initialVersion: number;
  revision: number;
  manifestHash: string | null;
  assets: Asset[];
  issues: Issue[];
  items: Item[];
  categories: Category[];
  records: RecordResult[];
}>;
type Draft = {
  key: string;
  assets: {
    id: string;
    action: "unresolved" | "create" | "link" | "skip";
    view: "unresolved" | "front" | "back" | "detail" | "alternate";
    role: "unresolved" | "evidence_source" | "catalog" | "reference";
  }[];
  displayName: string;
  targetItemId: string;
  categoryCode: string;
  lifecycleState: "" | "active";
  physicalSet: boolean;
  variantLabel: string;
};
type ProgressStatus = Readonly<{
  state: ImportSessionState;
  version: number;
  failureCode: string | null;
  jobState: string | null;
  jobUpdatedAt: string | null;
  canRetryPrepare: boolean;
  uploadedParts: number;
  totalParts: number;
  totalAssets: number;
  readyAssets: number;
  failedAssets: number;
}>;

async function responseBody(response: Response) {
  const body = (await response.json()) as {
    error?: { message?: string };
    version?: number;
    revision?: number;
    manifest_hash?: string;
    state?: ImportSessionState;
  };
  if (!response.ok) throw new Error(body.error?.message ?? "Операция не выполнена.");
  return body;
}

export function ImportReview(props: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const mediaPending = props.assets.some(
    (asset) =>
      ["awaiting_upload", "uploaded", "validating", "processing"].includes(
        asset.processing_state,
      ) ||
      (asset.processing_state === "ready" && !asset.rendition),
  );
  const initialDrafts = useMemo<Draft[]>(
    () =>
      props.assets.map((asset) => ({
        key: asset.media_asset_id,
        assets: [
          {
            id: asset.media_asset_id,
            action: "unresolved",
            view: "unresolved",
            role: "unresolved",
          },
        ],
        displayName: "",
        targetItemId: "",
        categoryCode: "",
        lifecycleState: "",
        physicalSet: false,
        variantLabel: "",
      })),
    [props.assets],
  );
  const [drafts, setDrafts] = useState(initialDrafts);
  const [version, setVersion] = useState(props.initialVersion);
  const [state, setState] = useState(props.initialState);
  const [revision, setRevision] = useState(props.revision);
  const [manifestHash, setManifestHash] = useState(props.manifestHash);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [savedVersion, setSavedVersion] = useState<number | null>(null);

  const [progressStatus, setProgressStatus] = useState<ProgressStatus | null>(null);
  const [workerStalled, setWorkerStalled] = useState(false);
  const [progressError, setProgressError] = useState("");

  useEffect(() => {
    const needsStatus =
      ["uploaded", "parsing", "committing", "failed"].includes(state) ||
      (state === "review" &&
        (mediaPending ||
          props.assets.length === 0 ||
          props.assets.some((asset) => asset.processing_state === "failed")));
    if (!needsStatus) return;
    let active = true;
    let pending = false;
    const visibleReady = props.assets.filter(
      (asset) => asset.processing_state === "ready" && asset.rendition,
    ).length;

    async function poll() {
      if (pending || !active) return;
      pending = true;
      try {
        const response = await fetch(`/api/import/sessions/${props.sessionId}/progress`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Статус обработки временно недоступен.");
        const current = (await response.json()) as ProgressStatus;
        if (!active) return;
        setProgressStatus(current);
        setWorkerStalled(
          !!current.jobUpdatedAt &&
            ((current.jobState === "queued" &&
              Date.now() - new Date(current.jobUpdatedAt).getTime() > 90_000) ||
              (current.jobState === "running" &&
                Date.now() - new Date(current.jobUpdatedAt).getTime() > 150_000)),
        );
        setProgressError("");
        setVersion(current.version);
        if (current.state !== state) {
          setState(current.state);
          router.refresh();
        } else if (
          current.state === "review" &&
          (current.totalAssets !== props.assets.length || current.readyAssets > visibleReady)
        ) {
          router.refresh();
        } else if (current.state === "committing") {
          router.refresh();
        }
      } catch {
        if (active) setProgressError("Не удалось проверить обработку. Проверьте соединение.");
      } finally {
        pending = false;
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), 4_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [mediaPending, props.assets, props.sessionId, router, state]);

  function updateDraft(key: string, patch: Partial<Draft>) {
    setSavedVersion(null);
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );
  }

  function updateAsset(key: string, assetId: string, patch: Partial<Draft["assets"][number]>) {
    setSavedVersion(null);
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key
          ? {
              ...draft,
              assets: draft.assets.map((asset) =>
                asset.id === assetId ? { ...asset, ...patch } : asset,
              ),
            }
          : draft,
      ),
    );
  }

  function groupSelected() {
    if (selected.length < 2) return;
    const selectedDrafts = drafts.filter((draft) => selected.includes(draft.key));
    const first = selectedDrafts[0];
    if (!first) return;
    if (
      selectedDrafts.some(
        (draft) =>
          draft.assets.some((asset) => asset.action !== "unresolved") ||
          draft.displayName ||
          draft.categoryCode ||
          draft.targetItemId ||
          draft.lifecycleState ||
          draft.physicalSet ||
          draft.variantLabel,
      )
    ) {
      setMessage("Сначала объедините группы, затем принимайте решения по изображениям.");
      return;
    }
    const merged = {
      ...first,
      key: crypto.randomUUID(),
      assets: selectedDrafts.flatMap((draft) => draft.assets),
    };
    setSavedVersion(null);
    setDrafts((current) => [...current.filter((draft) => !selected.includes(draft.key)), merged]);
    setSelected([]);
  }
  function splitGroup(key: string) {
    setSavedVersion(null);
    setSelected((current) => current.filter((selectedKey) => selectedKey !== key));
    setDrafts((current) =>
      current.flatMap((draft) =>
        draft.key !== key || draft.assets.length < 2
          ? [draft]
          : draft.assets.map((asset) => ({
              ...draft,
              key: asset.id,
              assets: [asset],
              displayName: "",
              targetItemId: "",
              categoryCode: "",
              lifecycleState: "" as const,
              physicalSet: false,
              variantLabel: "",
            })),
      ),
    );
  }

  async function saveResolution() {
    setBusy(true);
    setMessage("");
    try {
      const choices = drafts.flatMap((draft) => draft.assets);
      if (
        choices.length !== props.assets.length ||
        new Set(choices.map((asset) => asset.id)).size !== props.assets.length ||
        choices.some((asset) => asset.action === "unresolved")
      ) {
        throw new Error("Каждому изображению нужно явно выбрать действие.");
      }
      if (
        choices.some((choice) => {
          if (choice.action === "skip") return false;
          const asset = props.assets.find((candidate) => candidate.media_asset_id === choice.id);
          return asset?.processing_state !== "ready" || !asset.rendition;
        })
      ) {
        throw new Error("Дождитесь готовности private previews для назначаемых изображений.");
      }

      const records = [];
      const skippedAssetIds: string[] = [];
      for (const draft of drafts) {
        const actions = new Set(draft.assets.map((asset) => asset.action));
        if (actions.size !== 1) {
          throw new Error("В одной группе изображения должны иметь одинаковое действие.");
        }
        const action = draft.assets[0]?.action;
        if (action === "skip") {
          skippedAssetIds.push(...draft.assets.map((asset) => asset.id));
          continue;
        }
        if (action !== "create" && action !== "link") {
          throw new Error("Решение для группы не завершено.");
        }
        if (
          draft.assets.some((asset) => asset.role === "unresolved" || asset.view === "unresolved")
        ) {
          throw new Error("Для каждого изображения выберите роль и ракурс.");
        }
        if (
          action === "create" &&
          (!draft.displayName.trim() || !draft.categoryCode || draft.lifecycleState !== "active")
        ) {
          throw new Error("Новая вещь требует название, категорию и явное состояние «Активна».");
        }
        const target = props.items.find((item) => item.id === draft.targetItemId);
        if (action === "link" && (!target || target.lifecycle_state !== "active")) {
          throw new Error("Выберите доступную вещь текущего аккаунта.");
        }
        const variantLabel = action === "create" ? draft.variantLabel.trim() : "";
        const variantKey = variantLabel ? "owner-variant" : null;
        records.push({
          sourceRecordKey: `manual-${draft.key}`,
          action,
          displayName: action === "create" ? draft.displayName.trim() : null,
          categoryCode: action === "create" ? draft.categoryCode : null,
          targetItemId: action === "link" ? target?.id : null,
          expectedItemVersion: null,
          physicalSet: action === "create" ? draft.physicalSet : false,
          variants: variantLabel
            ? [{ key: variantKey, label: variantLabel, isDefault: true, position: 0 }]
            : [],
          assetMappings: draft.assets.map((asset) => ({
            assetId: asset.id,
            role: asset.role,
            view: asset.view === "alternate" ? "unspecified" : asset.view,
            variantKey,
            isPrimary: false,
          })),
        });
      }
      const response = await fetch(`/api/import/sessions/${props.sessionId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: version, records, skippedAssetIds }),
      });
      const resolved = await responseBody(response);
      if (typeof resolved.version !== "number") throw new Error("Версия Resolve недоступна.");
      setVersion(resolved.version);
      setSavedVersion(resolved.version);
      setMessage("Решения сохранены в staging. Sealed Preview ещё не построен.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Resolve не выполнен.");
    } finally {
      setBusy(false);
    }
  }

  async function buildPreview() {
    if (savedVersion === null || savedVersion !== version) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/import/sessions/${props.sessionId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: savedVersion }),
      });
      const preview = await responseBody(response);
      setVersion(preview.version ?? version);
      setRevision(preview.revision ?? revision);
      setManifestHash(preview.manifest_hash ?? null);
      setState("ready");
      setSavedVersion(null);
      setMessage("Preview запечатан. Confirm остаётся отдельным действием.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Предпросмотр не построен.");
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!manifestHash) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/import/sessions/${props.sessionId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedVersion: version,
          expectedRevision: revision,
          expectedManifestHash: manifestHash,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = await responseBody(response);
      setVersion(body.version ?? version);
      setState(body.state ?? "committing");
      setMessage("Confirm принят. Production-записи создаются worker-ом с itemized результатом.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Confirm не выполнен.");
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    setBusy(true);
    try {
      const response = await fetch(`/api/import/sessions/${props.sessionId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: version }),
      });
      const body = await responseBody(response);
      setVersion(body.version ?? version);
      setState(body.state ?? "committing");
      setMessage("Повтор поставлен в очередь; успешные записи не дублируются.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Повтор не выполнен.");
    } finally {
      setBusy(false);
    }
  }
  async function retryPrepare() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/import/sessions/${props.sessionId}/retry-prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: version }),
      });
      const body = await responseBody(response);
      setVersion(body.version ?? version);
      setState("uploaded");
      setProgressStatus(null);
      setMessage("Обработка повторно поставлена в очередь. Архив загружать заново не нужно.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Повтор обработки недоступен.");
    } finally {
      setBusy(false);
    }
  }

  async function retryThumbnail(asset: Asset) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/media/${asset.media_asset_id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: asset.version }),
      });
      await responseBody(response);
      setMessage("Изображение повторно поставлено на обработку.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Повтор изображения недоступен.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/import/sessions/${props.sessionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: version }),
      });
      const body = await responseBody(response);
      setVersion(body.version ?? version);
      setState("cancelled");
      setMessage("Импорт отменён; staged data поставлены на cleanup.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Импорт не отменён.");
    } finally {
      setBusy(false);
    }
  }

  const editable = state === "review";
  const canCancel = ["review", "ready", "failed"].includes(state);
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-surface p-5 sm:p-6">
        <p className="text-sm text-text-tertiary">
          {t("Проверка → Решение → Предпросмотр → Подтверждение → Результаты")}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{t("Bulk Import")}</h1>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-sm" role="status">
            {t(importStateLabel(state))}
          </span>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          {t(
            "Файлы обозначены непрозрачными ссылками. Имя файла, порядок ZIP и hash не считаются identity вещи.",
          )}
        </p>
        {["uploaded", "parsing"].includes(state) ? (
          <div className="mt-3 space-y-2" role="status" aria-live="polite">
            <p className="text-sm font-medium">
              {t(
                state === "uploaded"
                  ? "Загрузка завершена. Ожидаем обработку ZIP…"
                  : "Проверяем ZIP и извлекаем изображения…",
              )}
            </p>
            <p className="text-sm text-text-secondary">
              {t("Архивов принято: {uploaded}/{total}. Изображений найдено: {assets}.", {
                uploaded: progressStatus?.uploadedParts ?? 0,
                total: progressStatus?.totalParts ?? "…",
                assets: progressStatus?.totalAssets ?? 0,
              })}
            </p>
            {workerStalled ? (
              <p className="text-sm text-[var(--aw-error)]" role="alert">
                {t(
                  "Сервис обработки не отвечает. Архив сохранён; повтор после ошибки будет безопасным.",
                )}
              </p>
            ) : null}
            {progressStatus && !progressStatus.jobState ? (
              <p className="text-sm text-[var(--aw-error)]" role="alert">
                {t("Задание обработки не найдено. Архив сохранён; обратитесь к поддержке.")}
              </p>
            ) : null}
          </div>
        ) : null}
        {state === "review" ? (
          <p className="mt-3 text-sm" role="status" aria-live="polite">
            {props.assets.length === 0
              ? t("Подготавливаем список изображений…")
              : progressStatus?.failedAssets
                ? t(
                    "Не удалось подготовить {count} изображений. Повторите только допустимые failed assets.",
                    { count: progressStatus.failedAssets },
                  )
                : progressStatus && progressStatus.readyAssets < progressStatus.totalAssets
                  ? t("Подготавливаем private thumbnails: {ready}/{total}.", {
                      ready: progressStatus.readyAssets,
                      total: progressStatus.totalAssets,
                    })
                  : mediaPending
                    ? t("Подготавливаем private thumbnails…")
                    : t("Изображения готовы к ручному разбору.")}
          </p>
        ) : null}
        {state === "failed" ? (
          <div className="mt-3 rounded-lg bg-[var(--aw-error-surface)] p-3" role="alert">
            <p>
              {t("Обработка ZIP остановилась. Архив сохранён. Код: {code}.", {
                code: progressStatus?.failureCode ?? "import_prepare_failed",
              })}
            </p>
            {progressStatus?.canRetryPrepare ? (
              <button
                type="button"
                className="mt-3 min-h-11 rounded-lg border border-border-strong px-4 font-semibold disabled:opacity-50"
                disabled={busy}
                onClick={() => void retryPrepare()}
              >
                {t("Повторить обработку без загрузки ZIP")}
              </button>
            ) : (
              <p className="mt-2 text-sm">
                {t("Безопасный повтор недоступен; обратитесь к поддержке.")}
              </p>
            )}
          </div>
        ) : null}
        {progressError ? (
          <p className="mt-3 text-sm text-[var(--aw-error)]" role="alert">
            {t(progressError)}
          </p>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            className="mt-4 min-h-11 rounded-lg border border-border-strong px-4 font-semibold disabled:opacity-50"
            disabled={busy}
            onClick={() => void cancel()}
          >
            {t("Отменить импорт")}
          </button>
        ) : null}
      </section>

      {props.issues.length ? (
        <section
          className="rounded-xl border border-border-subtle bg-surface p-5"
          aria-labelledby="issues-heading"
        >
          <h2 id="issues-heading" className="text-xl font-semibold">
            {t("Проблемы")}
          </h2>
          <ul className="mt-3 space-y-2">
            {props.issues.map((issue) => (
              <li key={issue.code} className="rounded-lg bg-surface-muted p-3">
                {issue.code}: {issue.count} · {t(issue.severity)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {editable ? (
        <section aria-labelledby="resolve-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="resolve-heading" className="text-xl font-semibold">
                {t("Ручное решение")}
              </h2>
              <p className="text-sm text-text-secondary">
                {t(
                  "Для каждого opaque asset выберите действие. Группируйте изображения только после подтверждения, что они относятся к одной физической вещи.",
                )}
              </p>
              <p className="mt-2 text-sm" role="status" aria-live="polite">
                {t(
                  "Решений: {resolved}/{total}. Без manifest неизвестное число отсутствующих assets не равно нулю.",
                  {
                    resolved: drafts
                      .flatMap((draft) => draft.assets)
                      .filter((asset) => asset.action !== "unresolved").length,
                    total: props.assets.length,
                  },
                )}
              </p>
            </div>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border-strong px-4 font-semibold disabled:opacity-50"
              disabled={selected.length < 2 || busy}
              onClick={groupSelected}
            >
              {t("Объединить выбранные группы")}
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {drafts.map((draft, index) => {
              const actions = new Set(draft.assets.map((asset) => asset.action));
              const groupAction = actions.size === 1 ? draft.assets[0]?.action : "mixed";
              return (
                <fieldset
                  key={draft.key}
                  className="rounded-xl border border-border-subtle bg-surface p-4"
                >
                  <legend className="px-1 font-semibold">
                    {t("Группа {number}", { number: index + 1 })}
                  </legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {draft.assets.map((choice) => {
                      const asset = props.assets.find(
                        (candidate) => candidate.media_asset_id === choice.id,
                      );
                      return (
                        <div key={choice.id} className="rounded-lg bg-surface-muted p-3">
                          {asset?.rendition ? (
                            <Image
                              unoptimized
                              className="aspect-[4/5] w-full rounded-md object-contain"
                              src={`/api/media/renditions/${asset.rendition.id}`}
                              width={asset.rendition.width_px ?? 320}
                              height={asset.rendition.height_px ?? 400}
                              alt={t("Приватное изображение для ручного Resolve")}
                            />
                          ) : (
                            <div
                              className="flex aspect-[4/5] items-center justify-center rounded-md border border-dashed border-border-strong p-2 text-center text-xs text-text-secondary"
                              role="status"
                            >
                              {t(
                                asset?.processing_state === "ready"
                                  ? "Превью недоступно"
                                  : asset?.processing_state === "failed"
                                    ? "Ошибка подготовки изображения"
                                    : "Изображение обрабатывается",
                              )}
                            </div>
                          )}
                          <p className="mt-1 truncate text-xs text-text-secondary">
                            {asset?.source_reference ?? t("opaque asset")}
                          </p>
                          {asset?.processing_state === "failed" ? (
                            <button
                              type="button"
                              className="mt-2 min-h-11 rounded-lg border border-border-strong px-3 text-sm disabled:opacity-50"
                              disabled={busy}
                              onClick={() => void retryThumbnail(asset)}
                            >
                              {t("Повторить подготовку изображения")}
                            </button>
                          ) : null}
                          {asset?.processing_state === "quarantined" ? (
                            <p className="mt-2 text-sm text-[var(--aw-error)]" role="alert">
                              {t(
                                "Изображение отклонено проверкой безопасности. Его можно только пропустить.",
                              )}
                            </p>
                          ) : null}
                          <label className="mt-3 block">
                            <span className="mb-1 block text-sm font-medium">
                              {t("Действие для asset")}
                            </span>
                            <select
                              className="field"
                              value={choice.action}
                              onChange={(event) =>
                                updateAsset(draft.key, choice.id, {
                                  action: event.target.value as typeof choice.action,
                                })
                              }
                            >
                              <option value="unresolved">{t("Нужно решение владельца")}</option>
                              <option value="link">{t("Добавить к существующей вещи")}</option>
                              <option value="create">{t("Создать новую вещь")}</option>
                              <option value="skip">{t("Пропустить")}</option>
                            </select>
                          </label>
                          {choice.action === "create" || choice.action === "link" ? (
                            <>
                              <label className="mt-3 block">
                                <span className="mb-1 block text-sm font-medium">
                                  {t("Источник изображения")}
                                </span>
                                <select
                                  className="field"
                                  value={choice.role}
                                  onChange={(event) =>
                                    updateAsset(draft.key, choice.id, {
                                      role: event.target.value as typeof choice.role,
                                    })
                                  }
                                >
                                  <option value="unresolved">{t("Выберите явно")}</option>
                                  <option value="evidence_source">
                                    {t("Исходное подтверждение")}
                                  </option>
                                  <option value="catalog">{t("Каталог")}</option>
                                  <option value="reference">{t("Справочное изображение")}</option>
                                </select>
                              </label>
                              <label className="mt-3 block">
                                <span className="mb-1 block text-sm font-medium">
                                  {t("Ракурс изображения")}
                                </span>
                                <select
                                  className="field"
                                  value={choice.view}
                                  onChange={(event) =>
                                    updateAsset(draft.key, choice.id, {
                                      view: event.target.value as typeof choice.view,
                                    })
                                  }
                                >
                                  <option value="unresolved">{t("Выберите явно")}</option>
                                  <option value="front">{t("Спереди")}</option>
                                  <option value="back">{t("Сзади")}</option>
                                  <option value="detail">{t("Деталь")}</option>
                                  <option value="alternate">{t("Другой ракурс")}</option>
                                </select>
                              </label>
                              {choice.view === "alternate" ? (
                                <p className="mt-1 text-xs text-text-secondary">
                                  {t(
                                    "Другой ракурс сохраняется как ImageView unspecified, не как AppearanceVariant. Физический вариант задаётся отдельно.",
                                  )}
                                </p>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="choice">
                      <input
                        type="checkbox"
                        checked={selected.includes(draft.key)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, draft.key]
                              : current.filter((key) => key !== draft.key),
                          )
                        }
                      />
                      {t("Выбрать группу ({count} изображений)", { count: draft.assets.length })}
                    </label>
                    {draft.assets.length > 1 ? (
                      <button
                        type="button"
                        className="min-h-11 rounded-lg border border-border-strong px-3"
                        disabled={busy}
                        onClick={() => splitGroup(draft.key)}
                      >
                        {t("Разделить группу")}
                      </button>
                    ) : null}
                  </div>
                  {groupAction === "mixed" ? (
                    <p className="mt-3 text-sm text-[var(--aw-error)]" role="alert">
                      {t(
                        "В одной группе разные действия. Разделите группу или согласуйте решения.",
                      )}
                    </p>
                  ) : null}
                  {groupAction === "link" ? (
                    <label className="mt-3 block">
                      <span className="mb-1 block text-sm font-medium">
                        {t("Вещь текущего владельца")}
                      </span>
                      <select
                        className="field"
                        value={draft.targetItemId}
                        onChange={(event) =>
                          updateDraft(draft.key, { targetItemId: event.target.value })
                        }
                      >
                        <option value="">{t("Выберите явно")}</option>
                        {props.items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.display_name ?? t("Без названия")} · v{item.version}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {groupAction === "create" ? (
                    <>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-sm font-medium">
                          {t("Название новой вещи")}
                        </span>
                        <input
                          className="field"
                          value={draft.displayName}
                          maxLength={180}
                          onChange={(event) =>
                            updateDraft(draft.key, { displayName: event.target.value })
                          }
                        />
                      </label>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-sm font-medium">
                          {t("Допустимая категория")}
                        </span>
                        <select
                          className="field"
                          value={draft.categoryCode}
                          onChange={(event) =>
                            updateDraft(draft.key, { categoryCode: event.target.value })
                          }
                        >
                          <option value="">{t("Выберите явно")}</option>
                          {props.categories.map((category) => (
                            <option key={category.id} value={category.code}>
                              {t(category.label)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-sm font-medium">
                          {t("Состояние после Confirm")}
                        </span>
                        <select
                          className="field"
                          value={draft.lifecycleState}
                          onChange={(event) =>
                            updateDraft(draft.key, {
                              lifecycleState: event.target.value as Draft["lifecycleState"],
                            })
                          }
                        >
                          <option value="">{t("Выберите явно")}</option>
                          <option value="active">{t("Сохранена / активна")}</option>
                        </select>
                      </label>
                      <p className="mt-1 text-xs text-text-secondary">
                        {t(
                          "Import MVP создаёт только active вещи; archived и состояние качества не поддерживаются этим контрактом.",
                        )}
                      </p>
                    </>
                  ) : null}
                  {groupAction === "create" ? (
                    <>
                      <label className="choice mt-3">
                        <input
                          type="checkbox"
                          checked={draft.physicalSet}
                          onChange={(event) =>
                            updateDraft(draft.key, { physicalSet: event.target.checked })
                          }
                        />
                        {t("Это подтверждённый physical set: одна группа — одна ClothingItem")}
                      </label>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-sm font-medium">
                          {t("Физически выбираемый AppearanceVariant, если подтверждён")}
                        </span>
                        <input
                          className="field"
                          value={draft.variantLabel}
                          maxLength={120}
                          onChange={(event) =>
                            updateDraft(draft.key, { variantLabel: event.target.value })
                          }
                          placeholder={t("Необязательно; не используйте для front/back")}
                        />
                      </label>
                    </>
                  ) : null}
                </fieldset>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-12 rounded-lg bg-accent px-5 font-semibold text-inverse disabled:opacity-50"
              disabled={
                busy ||
                drafts
                  .flatMap((draft) => draft.assets)
                  .filter((asset) => asset.action !== "unresolved").length !== props.assets.length
              }
              onClick={() => void saveResolution()}
            >
              {busy ? t("Сохраняем…") : t("Сохранить Resolve без Preview")}
            </button>
            <button
              type="button"
              className="min-h-12 rounded-lg border border-border-strong px-5 font-semibold disabled:opacity-50"
              disabled={busy || mediaPending || savedVersion === null}
              onClick={() => void buildPreview()}
            >
              {t("Построить Sealed Preview")}
            </button>
          </div>
        </section>
      ) : null}

      {state === "ready" ? (
        <section
          className="rounded-xl border border-border-strong bg-surface p-5"
          aria-labelledby="confirm-heading"
        >
          <h2 id="confirm-heading" className="text-xl font-semibold">
            {t("Запечатанное подтверждение")}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {t(
              "Только после этой команды разрешены bounded production writes. Повтор той же команды идемпотентен.",
            )}
          </p>
          <button
            type="button"
            className="mt-4 min-h-12 rounded-lg bg-accent px-5 font-semibold text-inverse disabled:opacity-50"
            disabled={busy || !manifestHash}
            onClick={() => void confirm()}
          >
            {t("Подтвердить импорт")}
          </button>
        </section>
      ) : null}

      {state === "partial" ? (
        <button
          type="button"
          className="min-h-12 rounded-lg bg-accent px-5 font-semibold text-inverse disabled:opacity-50"
          disabled={busy}
          onClick={() => void retry()}
        >
          {t("Повторить только ошибки")}
        </button>
      ) : null}

      {message ? (
        <p className="rounded-lg bg-surface-muted p-4" role="status" aria-live="polite">
          {t(message)}
        </p>
      ) : null}
      {props.records.length ? (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-xl font-semibold">
            {t("Результаты")}
          </h2>
          <ul className="mt-3 space-y-2">
            {props.records.map((record) => (
              <li key={record.id} className="rounded-lg border border-border-subtle bg-surface p-3">
                {t("Запись {key}: {outcome}", {
                  key: record.source_record_key,
                  outcome: record.commit_outcome,
                })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
