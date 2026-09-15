import "server-only";

import { z } from "zod";

import { getPublicEnvironment } from "./public";

const serverEnvironmentSchema = z.object({
  APP_ENV: z.enum(["local", "preview", "production", "test"]).default("local"),
});

export function getServerEnvironment() {
  return {
    ...getPublicEnvironment(),
    ...serverEnvironmentSchema.parse({ APP_ENV: process.env.APP_ENV }),
  };
}
