export function getSafeLocaleReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }
  try {
    const parsed = new URL(value, "http://locale.local");
    return parsed.origin === "http://locale.local" ? `${parsed.pathname}${parsed.search}` : "/";
  } catch {
    return "/";
  }
}
