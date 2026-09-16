import { z } from "zod";

const applicationOriginSchema = z.url();

export function parseApplicationOrigin(value: string | undefined): string {
  const candidate = applicationOriginSchema.parse(value);
  const parsed = new URL(candidate);
  if (parsed.origin !== candidate) throw new Error("APP_ORIGIN must contain only scheme and host");
  if (
    parsed.protocol !== "https:" &&
    parsed.hostname !== "127.0.0.1" &&
    parsed.hostname !== "localhost"
  ) {
    throw new Error("APP_ORIGIN must use HTTPS outside local development");
  }
  return parsed.origin;
}
