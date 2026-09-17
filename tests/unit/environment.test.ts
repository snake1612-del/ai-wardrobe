import { describe, expect, it } from "vitest";

import { parsePublicEnvironment } from "../../src/platform/env/public";
import { parseApplicationOrigin } from "../../src/platform/security/application-origin";

describe("public environment", () => {
  it("accepts synthetic local Supabase configuration", () => {
    expect(
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-publishable-key-for-tests",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-publishable-key-for-tests",
    });
  });

  it("rejects insecure remote URLs", () => {
    expect(() =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "http://example.com",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-publishable-key-for-tests",
      }),
    ).toThrow();
  });
});

describe("application origin", () => {
  it("accepts an exact local or HTTPS origin", () => {
    expect(parseApplicationOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    expect(parseApplicationOrigin("https://wardrobe.example")).toBe("https://wardrobe.example");
    expect(parseApplicationOrigin("http://172.27.195.61:3000", true)).toBe(
      "http://172.27.195.61:3000",
    );
  });

  it("requires an explicit local-development allowance for private-network HTTP", () => {
    expect(() => parseApplicationOrigin("http://172.27.195.61:3000")).toThrow();
  });

  it.each(["http://203.0.113.10:3000", "ftp://172.27.195.61:3000", "ftp://localhost:3000"])(
    "does not broaden the local-development exception for %s",
    (origin) => {
      expect(() => parseApplicationOrigin(origin, true)).toThrow();
    },
  );

  it.each([undefined, "http://wardrobe.example", "https://wardrobe.example/path"])(
    "rejects a missing or non-canonical origin",
    (origin) => expect(() => parseApplicationOrigin(origin)).toThrow(),
  );
});
