import { describe, expect, it } from "vitest";

import { dictionary, parseLocale, supportedLocales, translate } from "../../src/i18n/dictionary";
import { getSafeLocaleReturnPath } from "../../src/i18n/redirect";

describe("interface locale", () => {
  it("accepts only supported locales", () => {
    expect(supportedLocales).toEqual(["ru", "en"]);
    expect(parseLocale("ru")).toBe("ru");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("de")).toBeNull();
    expect(parseLocale(null)).toBeNull();
  });

  it("translates known keys and falls back to the Russian source key", () => {
    expect(translate("en", "Ваш приватный гардероб")).toBe("Your private wardrobe");
    expect(translate("ru", "Ваш приватный гардероб")).toBe("Ваш приватный гардероб");
    expect(translate("en", "Непереведённая строка")).toBe("Непереведённая строка");
    expect(translate("en", "Показано: {count}", { count: 7 })).toBe("Shown: 7");
  });

  it("keeps every declared translation non-empty", () => {
    for (const entry of Object.values(dictionary)) {
      expect(entry.ru.trim()).not.toBe("");
      expect(entry.en.trim()).not.toBe("");
    }
  });

  it("allows same-origin paths and rejects redirect-shaped input", () => {
    expect(getSafeLocaleReturnPath("/")).toBe("/");
    expect(getSafeLocaleReturnPath("/auth?error=invalid-session")).toBe(
      "/auth?error=invalid-session",
    );
    expect(getSafeLocaleReturnPath("/app/wardrobe?q=coat")).toBe("/app/wardrobe?q=coat");
    expect(getSafeLocaleReturnPath("//example.test/path")).toBe("/");
    expect(getSafeLocaleReturnPath("/\\example.test/path")).toBe("/");
    expect(getSafeLocaleReturnPath("https://example.test/path")).toBe("/");
    expect(getSafeLocaleReturnPath(null)).toBe("/");
  });
});
