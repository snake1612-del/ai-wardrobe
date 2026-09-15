import { describe, expect, it } from "vitest";

import { ApplicationError, toPublicError } from "../../src/platform/errors/application-error";

describe("application error mapping", () => {
  it("preserves an expected safe failure", () => {
    expect(toPublicError(new ApplicationError("conflict", "Данные уже изменились."))).toEqual({
      code: "conflict",
      message: "Данные уже изменились.",
    });
  });

  it("hides unexpected details", () => {
    expect(toPublicError(new Error("postgres secret detail"))).toEqual({
      code: "internal",
      message: "Не удалось выполнить действие. Попробуйте ещё раз.",
    });
  });
});
