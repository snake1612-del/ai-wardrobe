import { randomUUID } from "node:crypto";

import Link from "next/link";

import { ItemForm } from "@/modules/wardrobe/components/item-form";
import { getWardrobeReferenceData } from "@/modules/wardrobe/server/wardrobe-queries";
import { Surface } from "@/ui/surface";

export const dynamic = "force-dynamic";

export default async function NewWardrobeItemPage() {
  const references = await getWardrobeReferenceData();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/wardrobe" className="text-sm text-accent underline">
        ← К гардеробу
      </Link>
      <Surface className="mt-4">
        <h1 className="text-3xl font-semibold">Новая вещь</h1>
        <p className="mt-2 text-text-secondary">
          Сначала сохраните минимум, остальное можно заполнить позже.
        </p>
        <div className="mt-8">
          <ItemForm createId={randomUUID()} {...references} />
        </div>
      </Surface>
    </div>
  );
}
