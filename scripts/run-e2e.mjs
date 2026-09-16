import { spawnSync } from "node:child_process";

function parseEnvironment(output) {
  const environment = {};
  for (const line of output.split(/\r?\n/u)) {
    const match = /^([A-Z0-9_]+)=(?:"([^"]*)"|'([^']*)'|(.*))$/u.exec(line.trim());
    if (match) environment[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return environment;
}

let environment = { ...process.env };
if (!environment.SUPABASE_SECRET_KEY || !environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  const status = spawnSync("pnpm", ["exec", "supabase", "status", "--output", "env"], {
    encoding: "utf8",
  });
  if (status.status !== 0) {
    console.error("Local Supabase credentials are unavailable. Start Supabase before E2E tests.");
    process.exit(status.status ?? 1);
  }
  const local = parseEnvironment(status.stdout);
  environment = {
    ...environment,
    NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.PUBLISHABLE_KEY ?? local.ANON_KEY,
    SUPABASE_SECRET_KEY: local.SECRET_KEY ?? local.SERVICE_ROLE_KEY,
  };
}
environment.APP_ORIGIN ??= "http://127.0.0.1:3000";

const build = spawnSync("pnpm", ["build"], { env: environment, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

const result = spawnSync("pnpm", ["exec", "playwright", "test", ...process.argv.slice(2)], {
  env: environment,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
