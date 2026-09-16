import "server-only";

import { z } from "zod";

import { parseApplicationOrigin } from "@/platform/security/application-origin";

import { getPublicEnvironment } from "./public";

const serverEnvironmentSchema = z.object({
  APP_ENV: z.enum(["local", "preview", "production", "test"]).default("local"),
});

const accountBootstrapEnvironmentSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(20),
});

export function getServerEnvironment() {
  return {
    ...getPublicEnvironment(),
    ...serverEnvironmentSchema.parse({ APP_ENV: process.env.APP_ENV }),
  };
}

export function getApplicationOrigin(): string {
  return parseApplicationOrigin(process.env.APP_ORIGIN);
}

export function getAccountBootstrapEnvironment() {
  return {
    ...getPublicEnvironment(),
    ...accountBootstrapEnvironmentSchema.parse({
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    }),
  };
}
