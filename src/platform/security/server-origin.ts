import "server-only";

import { headers } from "next/headers";

import { getApplicationOrigin } from "@/platform/env/server";
import { isTrustedSameOrigin } from "./origin";

export async function getTrustedMutationOrigin(): Promise<string | null> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto");
  return isTrustedSameOrigin(origin, host, protocol, getApplicationOrigin()) ? origin : null;
}
