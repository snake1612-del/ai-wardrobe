import { z } from "zod";

export type WardrobeActionState = Readonly<{
  status: "idle" | "error";
  message?: string;
}>;

export type WardrobeReference = Readonly<{
  id: string;
  code: string;
  label: string;
  parentId?: string | null;
}>;

export type WardrobeItemSummary = Readonly<{
  id: string;
  displayName: string | null;
  recordState: "draft" | "committed";
  lifecycleState: "active" | "archived";
  categoryLabel: string | null;
  brand: string | null;
  description: string | null;
  isFavorite: boolean;
  updatedAt: string;
  version: number;
  colors: ReadonlyArray<Readonly<{ id: string; label: string }>>;
  seasons: ReadonlyArray<Readonly<{ id: string; label: string }>>;
  tags: ReadonlyArray<Readonly<{ id: string; kind: string; label: string }>>;
}>;

export type WardrobeItemDetail = WardrobeItemSummary &
  Readonly<{
    referenceCode: string | null;
    notes: string | null;
    pattern: string | null;
    material: string | null;
    sizeLabel: string | null;
    categoryId: string | null;
    variants: ReadonlyArray<Readonly<{ id: string; label: string; isDefault: boolean }>>;
  }>;

export const WARDROBE_PAGE_SIZE = 24;
export const WARDROBE_MAX_VISIBLE = 960;

export const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

const optionalText = z.string().trim().max(500).optional().default("");
const uuidList = z.array(z.string().uuid()).max(24);
const labelList = z.array(z.string().trim().min(1).max(80)).max(24);

export const wardrobeItemInputSchema = z
  .object({
    itemId: z.string().uuid(),
    expectedVersion: z.number().int().nonnegative(),
    recordState: z.enum(["draft", "committed"]),
    displayName: z.string().trim().max(160),
    referenceCode: z.string().trim().max(120),
    categoryId: z.string().uuid().nullable(),
    brand: z.string().trim().max(160),
    description: optionalText,
    notes: optionalText,
    pattern: z.string().trim().max(120),
    material: z.string().trim().max(160),
    sizeLabel: z.string().trim().max(80),
    colorIds: uuidList,
    seasonIds: uuidList,
    purposeLabels: labelList,
    styleLabels: labelList,
    customLabels: labelList,
    variantLabels: labelList,
  })
  .superRefine((value, context) => {
    if (value.recordState === "committed" && value.displayName.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["displayName"],
        message: "Введите название вещи перед сохранением.",
      });
    }
  });

export function parseCommaSeparated(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

export function parseWardrobeLimit(value: string | undefined): number {
  const parsed = z.coerce.number().int().positive().safeParse(value);
  if (!parsed.success) return WARDROBE_PAGE_SIZE;
  const rounded = Math.ceil(parsed.data / WARDROBE_PAGE_SIZE) * WARDROBE_PAGE_SIZE;
  return Math.min(WARDROBE_MAX_VISIBLE, Math.max(WARDROBE_PAGE_SIZE, rounded));
}
export function splitWardrobeResultIds<T>(
  ids: readonly T[],
  limit: number,
): { visibleIds: T[]; hasMore: boolean } {
  return {
    visibleIds: ids.slice(0, limit),
    hasMore: ids.length > limit,
  };
}

export function getWardrobeReturnPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/app/wardrobe")) {
    return "/app/wardrobe";
  }
  if (value.startsWith("//") || value.includes("\\")) return "/app/wardrobe";
  try {
    const url = new URL(value, "https://wardrobe.invalid");
    const allowedPath =
      url.pathname === "/app/wardrobe" || url.pathname.startsWith("/app/wardrobe/");
    return url.origin === "https://wardrobe.invalid" && allowedPath
      ? `${url.pathname}${url.search}`
      : "/app/wardrobe";
  } catch {
    return "/app/wardrobe";
  }
}
