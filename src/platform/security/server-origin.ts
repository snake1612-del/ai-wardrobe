import "server-only";

import { headers } from "next/headers";

import { getApplicationOrigin } from "@/platform/env/server";
import { isTrustedSameOrigin } from "./origin";

export async function getTrustedMutationOrigin(): Promise<string | null> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto");
  const allowLocalAliases =
    process.env.NODE_ENV !== "production" && process.env.APP_ENV === "local";
  return isTrustedSameOrigin(origin, host, protocol, getApplicationOrigin(), allowLocalAliases)
    ? origin
    : null;
}
