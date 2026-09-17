import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { getWardrobeReturnPath } from "@/modules/wardrobe/model";
import { setWardrobeItemStateAction } from "@/modules/wardrobe/server/wardrobe-actions";
import { getWardrobeItem } from "@/modules/wardrobe/server/wardrobe-queries";
import { ButtonLink } from "@/ui/button";
import { Surface } from "@/ui/surface";

export const dynamic = "force-dynamic";

export default async function WardrobeItemPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ from?: string; status?: string; error?: string }>;
}>) {
  const route = await params;
  if (!z.string().uuid().safeParse(route.itemId).success) notFound();
  const query = await searchParams;
  const item = await getWardrobeItem(route.itemId);
  if (!item) notFound();
  const returnTo = getWardrobeReturnPath(query.from ?? null);
  const detailPath =
    returnTo === "/app/wardrobe"
      ? `/app/wardrobe/${item.id}`
      : `/app/wardrobe/${item.id}?from=${encodeURIComponent(returnTo)}`;
  const collectionUrl = new URL(returnTo, "https://wardrobe.invalid");
  if (collectionUrl.pathname !== "/app/wardrobe") {
    collectionUrl.pathname = "/app/wardrobe";
    collectionUrl.search = "";
  }
  collectionUrl.searchParams.set("archived", item.id);
  const archiveReturnTo = `${collectionUrl.pathname}${collectionUrl.search}`;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={returnTo} className="text-sm text-accent underline">
        ← К результатам
      </Link>
      {query.status === "saved" ? (
        <p
          role="status"
          className="mt-4 rounded-lg bg-[var(--aw-success-surface)] p-4 text-[var(--aw-success)]"
        >
          Вещь сохранена.
        </p>
      ) : null}
      {query.error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-[var(--aw-error-surface)] p-4 text-[var(--aw-error)]"
        >
          Изменение не применено. Обновите страницу.
        </p>
      ) : null}
      <Surface className="mt-4">
        <div className="grid gap-8 md:grid-cols-[minmax(16rem,2fr)_3fr]">
          <div className="flex aspect-square items-center justify-center rounded-xl bg-surface-muted text-text-secondary">
            Изображение не добавлено
          </div>
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-text-tertiary">
                  {item.recordState === "draft"
                    ? "Черновик"
                    : item.lifecycleState === "archived"
                      ? "В архиве"
                      : "Активная вещь"}
                </p>
                <h1 className="mt-1 text-3xl font-semibold">
                  {item.displayName ?? "Без названия"}
                </h1>
                <p className="mt-2 text-text-secondary">
                  {item.categoryLabel ?? "Без категории"}
                  {item.brand ? ` · ${item.brand}` : ""}
                </p>
              </div>
              {item.lifecycleState === "active" ? (
                <ButtonLink
                  href={{ pathname: `/app/wardrobe/${item.id}/edit`, query: { from: returnTo } }}
                >
                  Редактировать
                </ButtonLink>
              ) : null}
            </div>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-text-tertiary">Цвета</dt>
                <dd>{item.colors.map(({ label }) => label).join(", ") || "Не указаны"}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-tertiary">Сезоны</dt>
                <dd>{item.seasons.map(({ label }) => label).join(", ") || "Не указаны"}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-tertiary">Материал</dt>
                <dd>{item.material || "Не указан"}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-tertiary">Размер</dt>
                <dd>{item.sizeLabel || "Не указан"}</dd>
              </div>
            </dl>
            {item.description ? <p className="mt-6">{item.description}</p> : null}
            {item.notes ? (
              <div className="mt-5 rounded-lg bg-surface-muted p-4">
                <p className="text-sm font-medium">Приватная заметка</p>
                <p className="mt-1">{item.notes}</p>
              </div>
            ) : null}
            {item.variants.length ? (
              <div className="mt-6">
                <h2 className="font-semibold">Варианты внешнего вида</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {item.variants.map((variant) => (
                    <li
                      className="rounded-full bg-surface-muted px-3 py-2 text-sm"
                      key={variant.id}
                    >
                      {variant.label}
                      {variant.isDefault ? " · основной" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.tags.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    className="rounded-full border border-border-subtle px-3 py-2 text-sm"
                    key={tag.id}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3 border-t border-border-subtle pt-5">
              <form action={setWardrobeItemStateAction}>
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="expectedVersion" value={item.version} />
                <input
                  type="hidden"
                  name="action"
                  value={
                    item.lifecycleState === "archived"
                      ? "restore"
                      : item.isFavorite
                        ? "unfavorite"
                        : "favorite"
                  }
                />
                <input type="hidden" name="returnTo" value={detailPath} />
                <button className="min-h-12 rounded-lg border border-border-strong bg-surface px-5 font-semibold">
                  {item.lifecycleState === "archived"
                    ? "Восстановить"
                    : item.isFavorite
                      ? "Убрать из избранного"
                      : "Добавить в избранное"}
                </button>
              </form>
              {item.lifecycleState === "active" && item.recordState === "committed" ? (
                <form action={setWardrobeItemStateAction}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="expectedVersion" value={item.version} />
                  <input type="hidden" name="action" value="archive" />
                  <input type="hidden" name="returnTo" value={archiveReturnTo} />
                  <button className="min-h-12 rounded-lg px-5 font-semibold text-[var(--aw-error)] underline">
                    Архивировать
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </Surface>
    </div>
  );
}
