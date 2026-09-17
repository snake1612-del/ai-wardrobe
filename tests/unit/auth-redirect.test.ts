import { describe, expect, it } from "vitest";

import { getSafeAuthRedirectPath } from "../../src/modules/account/auth-redirect";

describe("getSafeAuthRedirectPath", () => {
  it.each([null, "", "https://evil.example", "//evil.example", "/", "/auth"])(
    "rejects unsafe target %s",
    (target) => {
      expect(getSafeAuthRedirectPath(target)).toBe("/app");
    },
  );

  it.each(["/app", "/app/settings", "/auth/update-password"])(
    "allows scoped target %s",
    (target) => {
      expect(getSafeAuthRedirectPath(target)).toBe(target);
    },
  );
});
