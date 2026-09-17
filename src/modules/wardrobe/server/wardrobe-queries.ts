import "server-only";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";

import {
  splitWardrobeResultIds,
  type WardrobeItemDetail,
  type WardrobeItemSummary,
  type WardrobeReference,
} from "../model";

type SearchInput = Readonly<{
  query?: string | undefined;
  categoryId?: string | undefined;
  colorId?: string | undefined;
  seasonId?: string | undefined;
  tagId?: string | undefined;
  favorite?: boolean | undefined;
  lifecycle: "active" | "archived";
  limit: number;
}>;

type RawItem = {
  id: string;
  display_name: string | null;
  record_state: "draft" | "committed";
  lifecycle_state: "active" | "archived";
  reference_code: string | null;
  category_id: string | null;
  brand: string | null;
  description: string | null;
  notes: string | null;
  pattern: string | null;
  material: string | null;
  size_label: string | null;
  is_favorite: boolean;
  updated_at: string;
  version: number;
  categories: { label_ru: string } | null;
  clothing_item_colors: Array<{ colors: { id: string; label_ru: string } | null }>;
  clothing_item_seasons: Array<{ seasons: { id: string; label_ru: string } | null }>;
  clothing_item_tags: Array<{
    tags: { id: string; kind: string; label: string } | null;
  }>;
  appearance_variants?: Array<{
    id: string;
    label: string;
    is_default: boolean;
    archived_at: string | null;
  }>;
};

const summarySelect = `
  id, display_name, record_state, lifecycle_state, reference_code, category_id,
  brand, description, notes, pattern, material, size_label, is_favorite,
  updated_at, version, categories(label_ru),
  clothing_item_colors(colors(id,label_ru)),
  clothing_item_seasons(seasons(id,label_ru)),
  clothing_item_tags(tags(id,kind,label))
`;

function toSummary(raw: RawItem): WardrobeItemSummary {
  return {
    id: raw.id,
    displayName: raw.display_name,
    recordState: raw.record_state,
    lifecycleState: raw.lifecycle_state,
    categoryLabel: raw.categories?.label_ru ?? null,
    brand: raw.brand,
    description: raw.description,
    isFavorite: raw.is_favorite,
    updatedAt: raw.updated_at,
    version: Number(raw.version),
    colors: raw.clothing_item_colors.flatMap(({ colors }) =>
      colors ? [{ id: colors.id, label: colors.label_ru }] : [],
    ),
    seasons: raw.clothing_item_seasons.flatMap(({ seasons }) =>
      seasons ? [{ id: seasons.id, label: seasons.label_ru }] : [],
    ),
    tags: raw.clothing_item_tags.flatMap(({ tags }) =>
      tags ? [{ id: tags.id, kind: tags.kind, label: tags.label }] : [],
    ),
  };
}

async function fetchItems(ids: string[], lifecycle: "active" | "archived"): Promise<RawItem[]> {
  if (ids.length === 0) return [];
  const client = await createSupabaseUserContextClient();
  const { data, error } = await client
    .from("clothing_items")
    .select(summarySelect)
    .in("id", ids)
    .eq("lifecycle_state", lifecycle)
    .order("is_favorite", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(ids.length);
  if (error) throw new Error("wardrobe_read_failed");
  return data as unknown as RawItem[];
}

export async function listWardrobeItems(
  input: SearchInput,
): Promise<{ items: WardrobeItemSummary[]; hasMore: boolean }> {
  const client = await createSupabaseUserContextClient();
  const { data, error } = await client.rpc("search_wardrobe_item_ids", {
    ...(input.query?.trim() ? { p_query: input.query.trim() } : {}),
    ...(input.categoryId ? { p_category_id: input.categoryId } : {}),
    ...(input.colorId ? { p_color_id: input.colorId } : {}),
    ...(input.seasonId ? { p_season_id: input.seasonId } : {}),
    ...(input.tagId ? { p_tag_id: input.tagId } : {}),
    ...(input.favorite !== undefined ? { p_favorite: input.favorite } : {}),
    p_lifecycle_state: input.lifecycle,
    p_limit: input.limit + 1,
  });
  if (error) throw new Error("wardrobe_search_read_failed");

  const resultIds = (data ?? []).map(({ item_id }) => item_id);
  const { visibleIds, hasMore } = splitWardrobeResultIds(resultIds, input.limit);
  const rows = await fetchItems(visibleIds, input.lifecycle);
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  return {
    items: visibleIds.flatMap((id) => {
      const row = rowsById.get(id);
      return row ? [toSummary(row)] : [];
    }),
    hasMore,
  };
}

export async function getWardrobeItem(itemId: string): Promise<WardrobeItemDetail | null> {
  const client = await createSupabaseUserContextClient();
  const { data, error } = await client
    .from("clothing_items")
    .select(`${summarySelect}, appearance_variants(id,label,is_default,archived_at)`)
    .eq("id", itemId)
    .maybeSingle();
  if (error) throw new Error("wardrobe_read_failed");
  if (!data) return null;
  const raw = data as unknown as RawItem;
  return {
    ...toSummary(raw),
    referenceCode: raw.reference_code,
    notes: raw.notes,
    pattern: raw.pattern,
    material: raw.material,
    sizeLabel: raw.size_label,
    categoryId: raw.category_id,
    variants: (raw.appearance_variants ?? [])
      .filter(({ archived_at }) => archived_at === null)
      .map(({ id, label, is_default }) => ({ id, label, isDefault: is_default })),
  };
}

export async function getWardrobeReferenceData(): Promise<{
  categories: WardrobeReference[];
  colors: WardrobeReference[];
  seasons: WardrobeReference[];
  tags: Array<WardrobeReference & { kind: string }>;
}> {
  const client = await createSupabaseUserContextClient();
  const [categories, colors, seasons, tags] = await Promise.all([
    client
      .from("categories")
      .select("id,code,label_ru,parent_id")
      .eq("is_active", true)
      .order("sort_order"),
    client.from("colors").select("id,code,label_ru").eq("is_active", true).order("label_ru"),
    client.from("seasons").select("id,code,label_ru").eq("is_active", true).order("sort_order"),
    client.from("tags").select("id,kind,label").is("archived_at", null).order("label"),
  ]);
  if (categories.error || colors.error || seasons.error || tags.error) {
    throw new Error("wardrobe_reference_read_failed");
  }
  return {
    categories: (categories.data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label_ru,
      parentId: row.parent_id,
    })),
    colors: (colors.data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label_ru,
    })),
    seasons: (seasons.data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label_ru,
    })),
    tags: (tags.data ?? []).map((row) => ({
      id: row.id,
      code: row.id,
      label: row.label,
      kind: row.kind,
    })),
  };
}
