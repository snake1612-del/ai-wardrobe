"use client";

import { useActionState } from "react";

import { Button } from "@/ui/button";

import type { WardrobeItemDetail, WardrobeReference } from "../model";
import { saveWardrobeItemAction } from "../server/wardrobe-actions";

type Props = Readonly<{
  item?: WardrobeItemDetail;
  createId?: string;
  returnTo?: string;
  categories: WardrobeReference[];
  colors: WardrobeReference[];
  seasons: WardrobeReference[];
}>;

const initialState = { status: "idle" as const };

function joined(item: WardrobeItemDetail | undefined, kind: string): string {
  return (
    item?.tags
      .filter((tag) => tag.kind === kind)
      .map((tag) => tag.label)
      .join(", ") ?? ""
  );
}

export function ItemForm({ item, createId, returnTo, categories, colors, seasons }: Props) {
  const [state, action, pending] = useActionState(saveWardrobeItemAction, initialState);
  const selectedColors = new Set(item?.colors.map(({ id }) => id));
  const selectedSeasons = new Set(item?.seasons.map(({ id }) => id));

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="itemId" value={item?.id ?? createId} />
      <input type="hidden" name="expectedVersion" value={item?.version ?? 0} />
      <input type="hidden" name="returnTo" value={returnTo ?? "/app/wardrobe"} />

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-lg bg-[var(--aw-error-surface)] p-4 text-[var(--aw-error)]"
        >
          {state.message}
        </p>
      ) : null}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-xl font-semibold">Основное</legend>
        <label className="sm:col-span-2">
          <span className="mb-2 block font-medium">Название вещи</span>
          <input
            className="field"
            name="displayName"
            defaultValue={item?.displayName ?? ""}
            maxLength={160}
          />
        </label>
        <label>
          <span className="mb-2 block font-medium">Категория / подкатегория</span>
          <select className="field" name="categoryId" defaultValue={item?.categoryId ?? ""}>
            <option value="">Без категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? "— " : ""}
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block font-medium">Бренд</span>
          <input className="field" name="brand" defaultValue={item?.brand ?? ""} maxLength={160} />
        </label>
        <label>
          <span className="mb-2 block font-medium">Артикул</span>
          <input
            className="field"
            name="referenceCode"
            defaultValue={item?.referenceCode ?? ""}
            maxLength={120}
          />
        </label>
        <label>
          <span className="mb-2 block font-medium">Размер</span>
          <input
            className="field"
            name="sizeLabel"
            defaultValue={item?.sizeLabel ?? ""}
            maxLength={80}
          />
        </label>
        <label>
          <span className="mb-2 block font-medium">Материал</span>
          <input
            className="field"
            name="material"
            defaultValue={item?.material ?? ""}
            maxLength={160}
          />
        </label>
        <label>
          <span className="mb-2 block font-medium">Узор</span>
          <input
            className="field"
            name="pattern"
            defaultValue={item?.pattern ?? ""}
            maxLength={120}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block font-medium">Описание</span>
          <textarea
            className="field min-h-24"
            name="description"
            defaultValue={item?.description ?? ""}
            maxLength={500}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block font-medium">Приватные заметки</span>
          <textarea
            className="field min-h-24"
            name="notes"
            defaultValue={item?.notes ?? ""}
            maxLength={500}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xl font-semibold">Цвета</legend>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <label key={color.id} className="choice">
              <input
                type="checkbox"
                name="colorIds"
                value={color.id}
                defaultChecked={selectedColors.has(color.id)}
              />
              {color.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xl font-semibold">Сезоны</legend>
        <div className="flex flex-wrap gap-3">
          {seasons.map((season) => (
            <label key={season.id} className="choice">
              <input
                type="checkbox"
                name="seasonIds"
                value={season.id}
                defaultChecked={selectedSeasons.has(season.id)}
              />
              {season.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-xl font-semibold">Организация</legend>
        <label>
          <span className="mb-2 block font-medium">Назначение</span>
          <input
            className="field"
            name="purposeLabels"
            defaultValue={joined(item, "purpose")}
            placeholder="Работа, спорт"
          />
        </label>
        <label>
          <span className="mb-2 block font-medium">Стиль</span>
          <input
            className="field"
            name="styleLabels"
            defaultValue={joined(item, "style")}
            placeholder="Повседневный"
          />
        </label>
        <label>
          <span className="mb-2 block font-medium">Свои теги</span>
          <input
            className="field"
            name="customLabels"
            defaultValue={joined(item, "custom")}
            placeholder="Любимое, отпуск"
          />
        </label>
        <label>
          <span className="mb-2 block font-medium">Варианты внешнего вида</span>
          <input
            className="field"
            name="variantLabels"
            defaultValue={item?.variants.map(({ label }) => label).join(", ") ?? ""}
            placeholder="Синяя сторона, узорная сторона"
          />
          <span className="mt-2 block text-sm text-text-tertiary">
            Только реальные состояния одной физической вещи, через запятую.
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-border-subtle pt-6">
        <Button name="intent" value="committed" type="submit" disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить вещь"}
        </Button>
        <button
          name="intent"
          value="draft"
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-[var(--aw-radius-md)] bg-surface-muted px-5 py-3 text-[15px] leading-5 font-semibold text-text-primary transition-colors hover:bg-surface-selected disabled:cursor-not-allowed disabled:opacity-60"
        >
          Сохранить черновик
        </button>
      </div>
    </form>
  );
}
