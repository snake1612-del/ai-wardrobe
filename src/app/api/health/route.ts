import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/platform/env/server";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const env = getServerEnvironment();
    return NextResponse.json(
      { status: "ok", environment: env.APP_ENV, configuration: "valid" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", configuration: "invalid" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
