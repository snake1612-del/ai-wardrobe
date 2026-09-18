"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { importStateLabel, type ImportSessionState } from "../model";

type Asset = Readonly<{
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
  assetIds: string[];
  displayName: string;
  action: "create" | "update" | "link" | "skip";
  targetItemId: string;
  categoryCode: string;
  view: "front" | "back" | "side" | "detail" | "unspecified";
  role: "evidence_source" | "catalog" | "reference";
  physicalSet: boolean;
  variantLabel: string;
};

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
  const router = useRouter();
  const mediaPending = props.assets.some((asset) =>
    ["uploaded", "validating", "processing"].includes(asset.processing_state),
  );
  const initialDrafts = useMemo<Draft[]>(
    () =>
      props.assets.map((asset) => ({
        key: asset.media_asset_id,
        assetIds: [asset.media_asset_id],
        displayName: "",
        action: "create",
        targetItemId: "",
        categoryCode: "",
        view: (asset.proposed_view as Draft["view"]) ?? "unspecified",
        role: (asset.proposed_role as Draft["role"]) ?? "evidence_source",
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

  useEffect(() => {
    if (!["uploaded", "parsing", "committing"].includes(state) && !mediaPending) return;
    const timer = window.setInterval(() => window.location.reload(), 1_500);
    return () => window.clearInterval(timer);
  }, [mediaPending, state]);

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );
  }

  function groupSelected() {
    if (selected.length < 2) return;
    const selectedDrafts = drafts.filter((draft) => selected.includes(draft.key));
    const first = selectedDrafts[0];
    if (!first) return;
    const merged = {
      ...first,
      key: crypto.randomUUID(),
      assetIds: selectedDrafts.flatMap((draft) => draft.assetIds),
    };
    setDrafts((current) => [...current.filter((draft) => !selected.includes(draft.key)), merged]);
    setSelected([]);
  }

  async function saveAndPreview() {
    setBusy(true);
    setMessage("");
    try {
      const records = drafts.map((draft, index) => {
        const target = props.items.find((item) => item.id === draft.targetItemId);
        const variantKey = draft.variantLabel ? `variant-${index + 1}` : null;
        return {
          sourceRecordKey: `resolved-group-${index + 1}`,
          action: draft.action,
          displayName:
            draft.action === "link" || draft.action === "skip" ? null : draft.displayName,
          categoryCode: draft.categoryCode || null,
          targetItemId: draft.targetItemId || null,
          expectedItemVersion: draft.action === "update" ? target?.version : null,
          physicalSet: draft.physicalSet,
          variants: draft.variantLabel
            ? [{ key: variantKey, label: draft.variantLabel, isDefault: true, position: 0 }]
            : [],
          assetMappings:
            draft.action === "skip"
              ? []
              : draft.assetIds.map((assetId, position) => ({
                  assetId,
                  role: draft.role,
                  view: draft.view,
                  variantKey,
                  isPrimary: draft.role === "catalog" && position === 0,
                })),
        };
      });
      const skippedAssetIds = drafts
        .filter((draft) => draft.action === "skip")
        .flatMap((draft) => draft.assetIds);
      const resolveResponse = await fetch(`/api/import/sessions/${props.sessionId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: version, records, skippedAssetIds }),
      });
      const resolved = await responseBody(resolveResponse);
      const previewResponse = await fetch(`/api/import/sessions/${props.sessionId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: resolved.version }),
      });
      const preview = await responseBody(previewResponse);
      setVersion(preview.version ?? version);
      setRevision(preview.revision ?? revision);
      setManifestHash(preview.manifest_hash ?? null);
      setState("ready");
      setMessage("Preview запечатан. Проверьте итог и подтвердите запись.");
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
        <p className="text-sm text-text-tertiary">Review → Resolve → Preview → Confirm → Results</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Bulk Import</h1>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-sm" role="status">
            {importStateLabel(state)}
          </span>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Файлы обозначены непрозрачными ссылками. Имя файла, порядок ZIP и hash не считаются
          identity вещи.
        </p>
        {["uploaded", "parsing", "committing"].includes(state) ? (
          <p className="mt-3 text-sm" role="status" aria-live="polite">
            Состояние обновляется автоматически…
          </p>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            className="mt-4 min-h-11 rounded-lg border border-border-strong px-4 font-semibold disabled:opacity-50"
            disabled={busy}
            onClick={() => void cancel()}
          >
            Отменить импорт
          </button>
        ) : null}
      </section>

      {props.issues.length ? (
        <section
          className="rounded-xl border border-border-subtle bg-surface p-5"
          aria-labelledby="issues-heading"
        >
          <h2 id="issues-heading" className="text-xl font-semibold">
            Issues
          </h2>
          <ul className="mt-3 space-y-2">
            {props.issues.map((issue) => (
              <li key={issue.code} className="rounded-lg bg-surface-muted p-3">
                {issue.code}: {issue.count} · {issue.severity}
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
                Resolve
              </h2>
              <p className="text-sm text-text-secondary">
                Явно сгруппируйте views одной физической вещи.
              </p>
            </div>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border-strong px-4 font-semibold disabled:opacity-50"
              disabled={selected.length < 2}
              onClick={groupSelected}
            >
              Объединить выбранные
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {drafts.map((draft, index) => (
              <fieldset
                key={draft.key}
                className="rounded-xl border border-border-subtle bg-surface p-4"
              >
                <legend className="px-1 font-semibold">Группа {index + 1}</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {draft.assetIds.map((assetId) => {
                    const asset = props.assets.find(
                      (candidate) => candidate.media_asset_id === assetId,
                    );
                    return (
                      <div key={assetId} className="rounded-lg bg-surface-muted p-2">
                        {asset?.rendition ? (
                          <Image
                            unoptimized
                            className="aspect-[4/5] w-full rounded-md object-contain"
                            src={`/api/media/renditions/${asset.rendition.id}`}
                            width={asset.rendition.width_px ?? 320}
                            height={asset.rendition.height_px ?? 400}
                            alt="Приватное изображение для проверки импорта"
                          />
                        ) : (
                          <div
                            className="flex aspect-[4/5] items-center justify-center rounded-md border border-dashed border-border-strong p-2 text-center text-xs text-text-secondary"
                            role="status"
                          >
                            {asset?.processing_state === "ready"
                              ? "Превью недоступно"
                              : "Изображение обрабатывается"}
                          </div>
                        )}
                        <p className="mt-1 truncate text-xs text-text-secondary">
                          {asset?.source_reference ?? "opaque asset"}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <label className="choice mt-2">
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
                  Выбрать для группировки ({draft.assetIds.length} изображений)
                </label>
                <label className="mt-3 block">
                  <span className="mb-1 block text-sm font-medium">Действие</span>
                  <select
                    className="field"
                    value={draft.action}
                    onChange={(event) =>
                      updateDraft(draft.key, { action: event.target.value as Draft["action"] })
                    }
                  >
                    <option value="create">Создать вещь</option>
                    <option value="update">Обновить выбранную вещь</option>
                    <option value="link">Только привязать изображения</option>
                    <option value="skip">Пропустить</option>
                  </select>
                </label>
                {draft.action === "update" || draft.action === "link" ? (
                  <label className="mt-3 block">
                    <span className="mb-1 block text-sm font-medium">Вещь владельца</span>
                    <select
                      className="field"
                      value={draft.targetItemId}
                      onChange={(event) =>
                        updateDraft(draft.key, { targetItemId: event.target.value })
                      }
                      required
                    >
                      <option value="">Выберите явно</option>
                      {props.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.display_name ?? "Без названия"} · v{item.version}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {draft.action === "create" || draft.action === "update" ? (
                  <>
                    <label className="mt-3 block">
                      <span className="mb-1 block text-sm font-medium">Название</span>
                      <input
                        className="field"
                        value={draft.displayName}
                        required
                        maxLength={180}
                        onChange={(event) =>
                          updateDraft(draft.key, { displayName: event.target.value })
                        }
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="mb-1 block text-sm font-medium">Категория</span>
                      <select
                        className="field"
                        value={draft.categoryCode}
                        onChange={(event) =>
                          updateDraft(draft.key, { categoryCode: event.target.value })
                        }
                      >
                        <option value="">Не указана</option>
                        {props.categories.map((category) => (
                          <option key={category.id} value={category.code}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}
                {draft.action !== "skip" ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className="mb-1 block text-sm font-medium">ImageView</span>
                      <select
                        className="field"
                        value={draft.view}
                        onChange={(event) =>
                          updateDraft(draft.key, { view: event.target.value as Draft["view"] })
                        }
                      >
                        <option value="unspecified">Не указан</option>
                        <option value="front">Front</option>
                        <option value="back">Back</option>
                        <option value="side">Side</option>
                        <option value="detail">Detail</option>
                      </select>
                    </label>
                    <label>
                      <span className="mb-1 block text-sm font-medium">Роль</span>
                      <select
                        className="field"
                        value={draft.role}
                        onChange={(event) =>
                          updateDraft(draft.key, { role: event.target.value as Draft["role"] })
                        }
                      >
                        <option value="evidence_source">Source evidence</option>
                        <option value="catalog">Catalog</option>
                        <option value="reference">Reference</option>
                      </select>
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-1 block text-sm font-medium">
                        AppearanceVariant (не ImageView)
                      </span>
                      <input
                        className="field"
                        value={draft.variantLabel}
                        onChange={(event) =>
                          updateDraft(draft.key, { variantLabel: event.target.value })
                        }
                        placeholder="Необязательно"
                      />
                    </label>
                  </div>
                ) : null}
                <label className="choice mt-3">
                  <input
                    type="checkbox"
                    checked={draft.physicalSet}
                    onChange={(event) =>
                      updateDraft(draft.key, { physicalSet: event.target.checked })
                    }
                  />
                  Это physical set; одна группа остаётся одной ClothingItem
                </label>
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            className="mt-5 min-h-12 rounded-lg bg-accent px-5 font-semibold text-white disabled:opacity-50"
            disabled={busy || drafts.length === 0}
            onClick={() => void saveAndPreview()}
          >
            {busy ? "Проверяем…" : "Создать Preview"}
          </button>
        </section>
      ) : null}

      {state === "ready" ? (
        <section
          className="rounded-xl border border-border-strong bg-surface p-5"
          aria-labelledby="confirm-heading"
        >
          <h2 id="confirm-heading" className="text-xl font-semibold">
            Sealed Confirm
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Только после этой команды разрешены bounded production writes. Повтор той же команды
            идемпотентен.
          </p>
          <button
            type="button"
            className="mt-4 min-h-12 rounded-lg bg-accent px-5 font-semibold text-white disabled:opacity-50"
            disabled={busy || !manifestHash}
            onClick={() => void confirm()}
          >
            Confirm import
          </button>
        </section>
      ) : null}

      {state === "partial" ? (
        <button
          type="button"
          className="min-h-12 rounded-lg bg-accent px-5 font-semibold text-white disabled:opacity-50"
          disabled={busy}
          onClick={() => void retry()}
        >
          Повторить только ошибки
        </button>
      ) : null}

      {message ? (
        <p className="rounded-lg bg-surface-muted p-4" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
      {props.records.length ? (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-xl font-semibold">
            Results
          </h2>
          <ul className="mt-3 space-y-2">
            {props.records.map((record) => (
              <li key={record.id} className="rounded-lg border border-border-subtle bg-surface p-3">
                Запись {record.source_record_key}: {record.commit_outcome}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
