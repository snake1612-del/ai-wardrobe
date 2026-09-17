import { describe, expect, it } from "vitest";

import { isTrustedSameOrigin } from "../../src/platform/security/origin";

describe("isTrustedSameOrigin", () => {
  it("accepts an exact forwarded origin", () => {
    expect(
      isTrustedSameOrigin(
        "https://wardrobe.example",
        "wardrobe.example",
        "https",
        "https://wardrobe.example",
      ),
    ).toBe(true);
  });

  it.each([
    [null, "wardrobe.example", "https", "https://wardrobe.example"],
    ["https://wardrobe.example", null, "https", "https://wardrobe.example"],
    ["https://wardrobe.example", "wardrobe.example", null, "https://wardrobe.example"],
    ["https://evil.example", "wardrobe.example", "https", "https://wardrobe.example"],
    ["http://wardrobe.example", "wardrobe.example", "https", "https://wardrobe.example"],
    ["https://wardrobe.example", "evil.example", "https", "https://wardrobe.example"],
    ["https://wardrobe.example", "wardrobe.example", "http", "https://wardrobe.example"],
    [
      "https://wardrobe.example",
      "wardrobe.example, evil.example",
      "https",
      "https://wardrobe.example",
    ],
    ["https://wardrobe.example", "wardrobe.example", "https, http", "https://wardrobe.example"],
    ["https://wardrobe.example/path", "wardrobe.example", "https", "https://wardrobe.example"],
    ["not a url", "wardrobe.example", "https", "https://wardrobe.example"],
    ["https://wardrobe.example", "wardrobe.example", "https", "https://other.example"],
  ])("rejects an untrusted request origin", (origin, host, protocol, applicationOrigin) => {
    expect(isTrustedSameOrigin(origin, host, protocol, applicationOrigin)).toBe(false);
  });
});
