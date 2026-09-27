import { describe, expect, it } from "vitest";

import {
  profileDisplayNameSchema,
  profileEmailSchema,
  profilePasswordSchema,
} from "../../src/modules/account/profile-model";

describe("account profile validation", () => {
  it("normalizes a bounded display name", () => {
    expect(profileDisplayNameSchema.parse("  Wardrobe Owner  ")).toBe("Wardrobe Owner");
    expect(profileDisplayNameSchema.safeParse("").success).toBe(false);
    expect(profileDisplayNameSchema.safeParse("x".repeat(81)).success).toBe(false);
  });

  it("accepts a valid email and rejects malformed input", () => {
    expect(profileEmailSchema.parse("  owner@example.test ")).toBe("owner@example.test");
    expect(profileEmailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("requires a distinct confirmed password", () => {
    expect(
      profilePasswordSchema.safeParse({
        currentPassword: "current-password",
        newPassword: "replacement-password",
        confirmPassword: "replacement-password",
      }).success,
    ).toBe(true);
    expect(
      profilePasswordSchema.safeParse({
        currentPassword: "same-password",
        newPassword: "same-password",
        confirmPassword: "same-password",
      }).success,
    ).toBe(false);
    expect(
      profilePasswordSchema.safeParse({
        currentPassword: "current-password",
        newPassword: "12345678",
        confirmPassword: "12345678",
      }).success,
    ).toBe(false);
    expect(
      profilePasswordSchema.safeParse({
        currentPassword: "current-password",
        newPassword: "replacement-password",
        confirmPassword: "different-password",
      }).success,
    ).toBe(false);
  });
});
