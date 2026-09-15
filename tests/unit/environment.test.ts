import { describe, expect, it } from "vitest";

import { parsePublicEnvironment } from "../../src/platform/env/public";

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
