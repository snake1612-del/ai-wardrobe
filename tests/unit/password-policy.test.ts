import { describe, expect, it } from "vitest";

import {
  getNewPasswordValidationMessage,
  passwordsMatch,
} from "../../src/modules/account/password-policy";

describe("new password policy", () => {
  it("accepts 8 to 128 characters with at least one Latin letter", () => {
    expect(getNewPasswordValidationMessage("abcdefgh")).toBeNull();
    expect(getNewPasswordValidationMessage("A!!!!!!!")).toBeNull();
    expect(getNewPasswordValidationMessage("letter-only-password")).toBeNull();
    expect(getNewPasswordValidationMessage(`${"a".repeat(127)}1`)).toBeNull();
  });

  it("rejects short and overlong passwords", () => {
    expect(getNewPasswordValidationMessage("abcdefg")).toBe(
      "Пароль должен содержать от 8 до 128 символов.",
    );
    expect(getNewPasswordValidationMessage("a".repeat(129))).toBe(
      "Пароль должен содержать от 8 до 128 символов.",
    );
  });

  it("rejects passwords without a Latin letter and checks confirmation", () => {
    expect(getNewPasswordValidationMessage("12345678")).toBe(
      "Пароль должен содержать минимум одну латинскую букву.",
    );
    expect(getNewPasswordValidationMessage("парольпароль")).toBe(
      "Пароль должен содержать минимум одну латинскую букву.",
    );
    expect(passwordsMatch("password", "password")).toBe(true);
    expect(passwordsMatch("password", "different")).toBe(false);
  });
});
