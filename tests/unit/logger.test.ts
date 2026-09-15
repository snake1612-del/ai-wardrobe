import { describe, expect, it } from "vitest";

import { sanitizeLogContext } from "../../src/platform/logging/safe-context";

describe("structured log redaction", () => {
  it("drops sensitive fields and preserves safe diagnostics", () => {
    expect(
      sanitizeLogContext({
        requestId: "req-1",
        durationMs: 12,
        token: "do-not-log",
        rawPayload: "private",
      }),
    ).toEqual({ requestId: "req-1", durationMs: 12 });
  });
});
