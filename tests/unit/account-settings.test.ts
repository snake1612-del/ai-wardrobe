import { describe, expect, it } from "vitest";

import {
  regionalSettingsSchema,
  timezoneNameSchema,
} from "../../src/modules/account/settings-model";

describe("account regional settings validation", () => {
  it("normalizes a valid IANA time zone and accepts metric Monday", () => {
    expect(
      regionalSettingsSchema.parse({
        timezoneName: "  Europe/Moscow  ",
        unitsCode: "metric",
        weekStartsOn: "1",
        expectedVersion: "2",
      }),
    ).toEqual({
      timezoneName: "Europe/Moscow",
      unitsCode: "metric",
      weekStartsOn: 1,
      expectedVersion: 2,
    });
  });

  it("accepts UTC with imperial units and Sunday", () => {
    expect(
      regionalSettingsSchema.safeParse({
        timezoneName: "UTC",
        unitsCode: "imperial",
        weekStartsOn: 7,
        expectedVersion: 1,
      }).success,
    ).toBe(true);
  });

  it("rejects path-like, newline, and empty time zones", () => {
    expect(timezoneNameSchema.safeParse("../Europe/Moscow").success).toBe(false);
    expect(timezoneNameSchema.safeParse("Europe/Moscow\nUTC").success).toBe(false);
    expect(timezoneNameSchema.safeParse(" ").success).toBe(false);
  });

  it("rejects unsupported units and week starts", () => {
    const input = { timezoneName: "UTC", expectedVersion: 1 };
    expect(
      regionalSettingsSchema.safeParse({ ...input, unitsCode: "custom", weekStartsOn: 1 }).success,
    ).toBe(false);
    expect(
      regionalSettingsSchema.safeParse({ ...input, unitsCode: "metric", weekStartsOn: 2 }).success,
    ).toBe(false);
  });

  it("requires a positive safe preference version", () => {
    const input = { timezoneName: "UTC", unitsCode: "metric", weekStartsOn: 1 };
    expect(regionalSettingsSchema.safeParse({ ...input, expectedVersion: 0 }).success).toBe(false);
    expect(
      regionalSettingsSchema.safeParse({ ...input, expectedVersion: Number.MAX_SAFE_INTEGER + 1 })
        .success,
    ).toBe(false);
  });
});
