import { describe, expect, it } from "vitest";

import {
  getWardrobeReturnPath,
  parseCommaSeparated,
  parseWardrobeLimit,
  splitWardrobeResultIds,
  wardrobeItemInputSchema,
  WARDROBE_MAX_VISIBLE,
  WARDROBE_PAGE_SIZE,
} from "../../src/modules/wardrobe/model";

const valid = {
  itemId: "11111111-1111-4111-8111-111111111111",
  expectedVersion: 0,
  recordState: "committed" as const,
  displayName: "Blue coat",
  referenceCode: "",
  categoryId: null,
  brand: "",
  description: "",
  notes: "",
  pattern: "",
  material: "",
  sizeLabel: "",
  colorIds: [],
  seasonIds: [],
  purposeLabels: [],
  styleLabels: [],
  customLabels: [],
  variantLabels: [],
};

describe("wardrobe item validation", () => {
  it("requires a committed item name but permits an incomplete draft", () => {
    expect(wardrobeItemInputSchema.safeParse({ ...valid, displayName: "" }).success).toBe(false);
    expect(
      wardrobeItemInputSchema.safeParse({
        ...valid,
        recordState: "draft",
        displayName: "",
      }).success,
    ).toBe(true);
  });

  it("requires a server-generated item identity and a nonnegative version", () => {
    expect(wardrobeItemInputSchema.safeParse({ ...valid, itemId: null }).success).toBe(false);
    expect(wardrobeItemInputSchema.safeParse({ ...valid, expectedVersion: -1 }).success).toBe(
      false,
    );
  });

  it("normalizes comma-separated sparse labels without duplicates", () => {
    expect(parseCommaSeparated(" Work,Travel, Work ,,")).toEqual(["Work", "Travel"]);
  });

  it("bounds and normalizes progressive wardrobe limits", () => {
    expect(parseWardrobeLimit(undefined)).toBe(WARDROBE_PAGE_SIZE);
    expect(parseWardrobeLimit("1")).toBe(WARDROBE_PAGE_SIZE);
    expect(parseWardrobeLimit("25")).toBe(WARDROBE_PAGE_SIZE * 2);
    expect(parseWardrobeLimit("invalid")).toBe(WARDROBE_PAGE_SIZE);
    expect(parseWardrobeLimit(String(WARDROBE_MAX_VISIBLE + 1))).toBe(WARDROBE_MAX_VISIBLE);
  });
  it("separates visible results from a high-cardinality continuation row", () => {
    const ids = Array.from({ length: WARDROBE_PAGE_SIZE + 1 }, (_, index) => index);
    expect(splitWardrobeResultIds(ids, WARDROBE_PAGE_SIZE)).toEqual({
      visibleIds: ids.slice(0, WARDROBE_PAGE_SIZE),
      hasMore: true,
    });
    expect(
      splitWardrobeResultIds(ids.slice(0, WARDROBE_PAGE_SIZE), WARDROBE_PAGE_SIZE).hasMore,
    ).toBe(false);
  });
});

describe("wardrobe return path", () => {
  it.each([
    ["https://evil.example/app/wardrobe", "/app/wardrobe"],
    ["//evil.example/app/wardrobe", "/app/wardrobe"],
    ["/app/wardrobe\\evil", "/app/wardrobe"],
    ["/app/wardrobe-redirect", "/app/wardrobe"],
    ["/app/outfits", "/app/wardrobe"],
  ])("rejects unsafe path %s", (value, expected) => {
    expect(getWardrobeReturnPath(value)).toBe(expected);
  });

  it("preserves local wardrobe filters", () => {
    expect(getWardrobeReturnPath("/app/wardrobe?status=archived&q=coat")).toBe(
      "/app/wardrobe?status=archived&q=coat",
    );
  });
});
