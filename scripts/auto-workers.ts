import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

function parseEnvironment(output: string): Record<string, string> {
  const environment: Record<string, string> = {};
  for (const line of output.split(/\r?\n/u)) {
    const match = /^([A-Z0-9_]+)=(?:"([^"]*)"|'([^']*)'|(.*))$/u.exec(line.trim());
    if (match?.[1]) environment[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return environment;
}

if (!process.env.SUPABASE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  let local: Record<string, string>;
  try {
    local = parseEnvironment(
      execFileSync("pnpm", ["exec", "supabase", "status", "--output", "env"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    console.error("Automatic workers unavailable: local Supabase status failed.");
    process.exit(1);
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = local.API_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = local.PUBLISHABLE_KEY ?? local.ANON_KEY;
  process.env.SUPABASE_SECRET_KEY = local.SECRET_KEY ?? local.SERVICE_ROLE_KEY;
}

const [{ runImportWorkerOnce }, { runMediaWorkerOnce }] = await Promise.all([
  import("../src/modules/import/server/import-worker"),
  import("../src/modules/media/server/media-worker"),
]);

const stop = new AbortController();
process.once("SIGINT", () => stop.abort());
process.once("SIGTERM", () => stop.abort());

async function workerLoop(
  kind: "import" | "media",
  runOnce: (workerId: string, previewOnly: boolean) => Promise<"idle" | "processed" | "retry">,
): Promise<void> {
  const workerId = `${kind}-auto-${randomUUID()}`;
  while (!stop.signal.aborted) {
    let waitMs = 1_500;
    try {
      const result = await runOnce(workerId, true);
      waitMs = result === "idle" ? 1_500 : result === "retry" ? 2_000 : 50;
    } catch {
      console.warn(JSON.stringify({ operation: "worker.loop_unavailable", kind }));
      waitMs = 5_000;
    }
    try {
      await delay(waitMs, undefined, { signal: stop.signal });
    } catch {
      break;
    }
  }
}

await Promise.all([
  workerLoop("import", runImportWorkerOnce),
  workerLoop("media", runMediaWorkerOnce),
]);
