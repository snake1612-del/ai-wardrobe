import Link from "next/link";
import { z } from "zod";

import {
  MobileWardrobeFilterSheet,
  WardrobeFilterForm,
} from "@/modules/wardrobe/components/wardrobe-filters";
import {
  parseWardrobeLimit,
  WARDROBE_MAX_VISIBLE,
  WARDROBE_PAGE_SIZE,
} from "@/modules/wardrobe/model";
import { setWardrobeItemStateAction } from "@/modules/wardrobe/server/wardrobe-actions";
import {
  getWardrobeItem,
  getWardrobeReferenceData,
  listWardrobeItems,
} from "@/modules/wardrobe/server/wardrobe-queries";
import { ButtonLink } from "@/ui/button";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function uuid(value: string | undefined): string | undefined {
  const parsed = z.string().uuid().safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export default async function WardrobePage({
  searchParams,
}: Readonly<{ searchParams: Promise<Params> }>) {
  const params = await searchParams;
  const archivedItemId = uuid(one(params.archived));
  const input = {
    query: one(params.q),
    categoryId: uuid(one(params.category)),
    colorId: uuid(one(params.color)),
    seasonId: uuid(one(params.season)),
    tagId: uuid(one(params.tag)),
    favorite: one(params.favorite) === "1" ? true : undefined,
    lifecycle: one(params.status) === "archived" ? ("archived" as const) : ("active" as const),
    limit: parseWardrobeLimit(one(params.limit)),
  };
  const [{ items, hasMore }, references, archivedItem] = await Promise.all([
    listWardrobeItems(input),
    getWardrobeReferenceData(),
    archivedItemId ? getWardrobeItem(archivedItemId) : Promise.resolve(null),
  ]);
  const currentParams = new URLSearchParams();
  if (input.query?.trim()) currentParams.set("q", input.query.trim());
  if (input.categoryId) currentParams.set("category", input.categoryId);
  if (input.colorId) currentParams.set("color", input.colorId);
  if (input.seasonId) currentParams.set("season", input.seasonId);
  if (input.tagId) currentParams.set("tag", input.tagId);
  if (input.favorite) currentParams.set("favorite", "1");
  if (input.lifecycle === "archived") currentParams.set("status", "archived");
  if (input.limit > WARDROBE_PAGE_SIZE) currentParams.set("limit", String(input.limit));
  const currentQuery = currentParams.toString();
  const current = `/app/wardrobe${currentQuery ? `?${currentQuery}` : ""}`;
  const moreParams = new URLSearchParams(currentParams);
  moreParams.set("limit", String(Math.min(WARDROBE_MAX_VISIBLE, input.limit + WARDROBE_PAGE_SIZE)));
  const loadMoreHref = `/app/wardrobe?${moreParams}#wardrobe-grid`;
  const hasSearchOrFilters =
    Boolean(input.query?.trim()) ||
    Boolean(input.categoryId || input.colorId || input.seasonId || input.tagId) ||
    Boolean(input.favorite) ||
    input.lifecycle === "archived";

  const filterFields = (
    <>
      {input.query?.trim() ? <input type="hidden" name="q" value={input.query.trim()} /> : null}
      <label>
        <span className="mb-1 block text-sm font-medium">Категория</span>
        <select className="field" name="category" defaultValue={input.categoryId ?? ""}>
          <option value="">Все</option>
          {references.categories.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.parentId ? "— " : ""}
              {entry.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Цвет</span>
        <select className="field" name="color" defaultValue={input.colorId ?? ""}>
          <option value="">Все</option>
          {references.colors.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Сезон</span>
        <select className="field" name="season" defaultValue={input.seasonId ?? ""}>
          <option value="">Все</option>
          {references.seasons.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Тег / назначение / стиль</span>
        <select className="field" name="tag" defaultValue={input.tagId ?? ""}>
          <option value="">Все</option>
          {references.tags.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Статус</span>
        <select className="field" name="status" defaultValue={input.lifecycle}>
          <option value="active">Активные</option>
          <option value="archived">Архив</option>
        </select>
      </label>
      <label className="choice">
        <input type="checkbox" name="favorite" value="1" defaultChecked={input.favorite} />
        Только избранное
      </label>
      <div className="flex gap-3">
        <button className="min-h-12 flex-1 rounded-lg bg-accent px-4 font-semibold text-white">
          Применить
        </button>
        <Link
          href={
            input.query?.trim()
              ? { pathname: "/app/wardrobe", query: { q: input.query.trim() } }
              : "/app/wardrobe"
          }
          className="inline-flex min-h-12 items-center px-2 text-sm underline"
        >
          Сбросить фильтры
        </Link>
      </div>
    </>
  );

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-text-tertiary">Приватный каталог</p>
          <h1 className="text-3xl font-semibold">Гардероб</h1>
          <p className="mt-1 text-sm text-text-secondary" aria-live="polite">
            Показано: {items.length}
            {hasMore ? " · есть ещё" : items.length ? " · конец списка" : ""}
          </p>
        </div>
        <ButtonLink href="/app/wardrobe/new">+ Добавить вещь</ButtonLink>
      </header>
      {archivedItem?.lifecycleState === "archived" ? (
        <div
          role="status"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--aw-success-surface)] p-4 text-[var(--aw-success)]"
        >
          <span>Архивирование «{archivedItem.displayName ?? "вещь"}» выполнено.</span>
          <form action={setWardrobeItemStateAction}>
            <input type="hidden" name="itemId" value={archivedItem.id} />
            <input type="hidden" name="expectedVersion" value={archivedItem.version} />
            <input type="hidden" name="action" value="restore" />
            <input type="hidden" name="returnTo" value={current} />
            <button className="min-h-11 rounded-lg border border-current px-4 font-semibold underline">
              Отменить архивирование
            </button>
          </form>
        </div>
      ) : null}

      {one(params.error) ? (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-[var(--aw-error-surface)] p-4 text-[var(--aw-error)]"
        >
          Изменение не применено: обновите страницу и повторите.
        </p>
      ) : null}

      <form action="/app/wardrobe" className="mb-5 flex gap-3">
        {input.categoryId ? <input type="hidden" name="category" value={input.categoryId} /> : null}
        {input.colorId ? <input type="hidden" name="color" value={input.colorId} /> : null}
        {input.seasonId ? <input type="hidden" name="season" value={input.seasonId} /> : null}
        {input.tagId ? <input type="hidden" name="tag" value={input.tagId} /> : null}
        {input.favorite ? <input type="hidden" name="favorite" value="1" /> : null}
        {input.lifecycle === "archived" ? (
          <input type="hidden" name="status" value="archived" />
        ) : null}
        <label className="flex-1">
          <span className="sr-only">Поиск по гардеробу</span>
          <input
            className="field"
            name="q"
            defaultValue={input.query ?? ""}
            placeholder="Поиск по названию, бренду, заметкам и тегам"
          />
        </label>
        <button className="min-h-12 rounded-lg border border-border-strong bg-surface px-5 font-semibold">
          Найти
        </button>
      </form>

      <MobileWardrobeFilterSheet>
        <WardrobeFilterForm className="grid flex-1 content-start gap-4">
          {filterFields}
        </WardrobeFilterForm>
      </MobileWardrobeFilterSheet>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside aria-label="Фильтры гардероба" className="hidden lg:block">
          <WardrobeFilterForm
            autoApply
            className="sticky top-4 grid gap-4 rounded-xl border border-border-subtle bg-surface p-5"
          >
            {filterFields}
          </WardrobeFilterForm>
        </aside>

        <section id="wardrobe-grid" aria-label="Вещи гардероба">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center">
              <h2 className="text-xl font-semibold">
                {hasSearchOrFilters ? "Ничего не найдено" : "Гардероб пока пуст"}
              </h2>
              <p className="mt-2 text-text-secondary">
                {hasSearchOrFilters
                  ? "Измените запрос или сбросьте один из фильтров."
                  : "Добавьте первую физическую вещь — изображение можно подключить позже."}
              </p>
              <ButtonLink href="/app/wardrobe/new" className="mt-5">
                Добавить вещь
              </ButtonLink>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--aw-shadow-raised)]"
                  >
                    <Link
                      href={{ pathname: `/app/wardrobe/${item.id}`, query: { from: current } }}
                      className="block"
                    >
                      <div className="flex aspect-square items-center justify-center bg-surface-muted text-sm text-text-secondary">
                        Без изображения
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex flex-wrap gap-2 text-xs">
                          {item.recordState === "draft" ? (
                            <span className="rounded-full bg-surface-selected px-2 py-1">
                              Черновик
                            </span>
                          ) : null}
                          {item.lifecycleState === "archived" ? (
                            <span className="rounded-full bg-surface-selected px-2 py-1">
                              В архиве
                            </span>
                          ) : null}
                          {item.isFavorite ? (
                            <span className="rounded-full bg-surface-selected px-2 py-1">
                              ★ Избранное
                            </span>
                          ) : null}
                        </div>
                        <p className="font-semibold">
                          {item.displayName ?? "Черновик без названия"}
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {item.categoryLabel ?? "Без категории"}
                          {item.brand ? ` · ${item.brand}` : ""}
                        </p>
                        <p className="mt-3 line-clamp-1 text-xs text-text-tertiary">
                          {item.tags.map(({ label }) => label).join(" · ") || "Теги не заданы"}
                        </p>
                      </div>
                    </Link>
                    {item.lifecycleState === "active" ? (
                      <form
                        action={setWardrobeItemStateAction}
                        className="border-t border-border-subtle p-2"
                      >
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="expectedVersion" value={item.version} />
                        <input
                          type="hidden"
                          name="action"
                          value={item.isFavorite ? "unfavorite" : "favorite"}
                        />
                        <input type="hidden" name="returnTo" value={current} />
                        <button
                          className="min-h-11 w-full rounded-lg text-sm font-medium hover:bg-surface-muted"
                          aria-label={
                            item.isFavorite
                              ? `Убрать ${item.displayName ?? "вещь"} из избранного`
                              : `Добавить ${item.displayName ?? "вещь"} в избранное`
                          }
                        >
                          {item.isFavorite ? "★ В избранном" : "☆ В избранное"}
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
              {hasMore && input.limit < WARDROBE_MAX_VISIBLE ? (
                <div className="mt-6 flex justify-center">
                  <Link
                    href={loadMoreHref}
                    className="inline-flex min-h-12 items-center rounded-lg border border-border-strong bg-surface px-5 font-semibold"
                  >
                    Показать ещё
                  </Link>
                </div>
              ) : null}
              {hasMore && input.limit >= WARDROBE_MAX_VISIBLE ? (
                <p className="mt-6 text-center text-sm text-text-secondary">
                  Достигнут безопасный предел выдачи. Уточните поиск или фильтры.
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </>
  );
}
