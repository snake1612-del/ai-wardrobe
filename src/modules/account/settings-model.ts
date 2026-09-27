import { z } from "zod";

export const unitsCodes = ["metric", "imperial"] as const;
export const weekStartsOnValues = [1, 7] as const;

export const timezoneNameSchema = z
  .string()
  .trim()
  .min(1, "Укажите часовой пояс.")
  .max(100, "Название часового пояса слишком длинное.")
  .regex(/^[A-Za-z0-9._+-]+(?:\/[A-Za-z0-9._+-]+)*$/u, "Укажите корректный часовой пояс IANA.")
  .refine(
    (value) => !value.split("/").some((part) => part === "." || part === ".."),
    "Укажите корректный часовой пояс IANA.",
  );

export const regionalSettingsSchema = z.object({
  timezoneName: timezoneNameSchema,
  unitsCode: z.enum(unitsCodes, { error: "Выберите систему единиц." }),
  weekStartsOn: z.coerce
    .number()
    .pipe(z.union([z.literal(1), z.literal(7)], { error: "Выберите начало недели." })),
  expectedVersion: z.coerce.number().int().positive().safe(),
});

export type UnitsCode = (typeof unitsCodes)[number];
export type WeekStartsOn = (typeof weekStartsOnValues)[number];

export type AccountSettings = Readonly<{
  localeCode: "ru" | "en" | null;
  timezoneName: string;
  unitsCode: UnitsCode;
  weekStartsOn: WeekStartsOn;
  version: number;
}>;

export type SettingsActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
  version?: number;
}>;
