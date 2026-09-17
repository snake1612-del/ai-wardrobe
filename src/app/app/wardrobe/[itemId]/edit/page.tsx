import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getWardrobeReturnPath } from "@/modules/wardrobe/model";

import { ItemForm } from "@/modules/wardrobe/components/item-form";
import {
  getWardrobeItem,
  getWardrobeReferenceData,
} from "@/modules/wardrobe/server/wardrobe-queries";
import { Surface } from "@/ui/surface";

export const dynamic = "force-dynamic";

export default async function EditWardrobeItemPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ from?: string }>;
}>) {
  const { itemId } = await params;
  const query = await searchParams;
  if (!z.string().uuid().safeParse(itemId).success) notFound();
  const [item, references] = await Promise.all([
    getWardrobeItem(itemId),
    getWardrobeReferenceData(),
  ]);
  if (!item || item.lifecycleState !== "active") notFound();
  const returnTo = getWardrobeReturnPath(query.from ?? null);
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={{ pathname: `/app/wardrobe/${item.id}`, query: { from: returnTo } }}
        className="text-sm text-accent underline"
      >
        ← К карточке
      </Link>
      <Surface className="mt-4">
        <h1 className="text-3xl font-semibold">Редактировать вещь</h1>
        <p className="mt-2 text-text-secondary">
          Версия {item.version}. При конфликте данные не будут перезаписаны.
        </p>
        <div className="mt-8">
          <ItemForm item={item} returnTo={returnTo} {...references} />
        </div>
      </Surface>
    </div>
  );
}
