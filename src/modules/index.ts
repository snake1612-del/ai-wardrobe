export const moduleBoundaries = [
  "account",
  "wardrobe",
  "media",
  "outfits",
  "wear",
  "import",
  "insights",
  "settings",
  "operations",
] as const;

export type ModuleName = (typeof moduleBoundaries)[number];
