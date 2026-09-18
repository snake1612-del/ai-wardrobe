import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

function parseEnvironment(output: string): Record<string, string> {
  const environment: Record<string, string> = {};
  for (const line of output.split(/\r?\n/u)) {
    const match = /^([A-Z0-9_]+)=(?:"([^"]*)"|'([^']*)'|(.*))$/u.exec(line.trim());
    if (match?.[1]) environment[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return environment;
}

if (!process.env.SUPABASE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  const local = parseEnvironment(
    execFileSync("pnpm", ["exec", "supabase", "status", "--output", "env"], {
      encoding: "utf8",
    }),
  );
  process.env.NEXT_PUBLIC_SUPABASE_URL = local.API_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = local.PUBLISHABLE_KEY ?? local.ANON_KEY;
  process.env.SUPABASE_SECRET_KEY = local.SECRET_KEY ?? local.SERVICE_ROLE_KEY;
}

const { runImportWorkerOnce } = await import("../src/modules/import/server/import-worker");

const workerId = `import-worker-${randomUUID()}`;
const drain = process.argv.includes("--drain");
let result: Awaited<ReturnType<typeof runImportWorkerOnce>>;

do {
  result = await runImportWorkerOnce(workerId);
  console.info(`Import worker result: ${result}`);
} while (drain && result !== "idle");
