import { spawn } from "node:child_process";

const children = new Map();
let stopping = false;
let workerRestart = null;

function launch(name, args, environment = process.env) {
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
  });
  children.set(name, child);
  child.on("exit", (code, signal) => {
    if (children.get(name) === child) children.delete(name);
    if (stopping) return;
    if (name === "next") {
      console.error(JSON.stringify({ operation: "dev.next_stopped", exitCode: code, signal }));
      process.exitCode = code ?? 1;
      shutdown();
      return;
    }
    console.warn(JSON.stringify({ operation: "dev.workers_restarting", exitCode: code, signal }));
    workerRestart = setTimeout(startWorkers, 5_000);
  });
}

function startWorkers() {
  workerRestart = null;
  if (stopping) return;
  launch("workers", ["node_modules/tsx/dist/cli.mjs", "scripts/auto-workers.ts"], {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--conditions=react-server"].filter(Boolean).join(" "),
  });
}

function shutdown() {
  if (stopping) return;
  stopping = true;
  if (workerRestart) clearTimeout(workerRestart);
  for (const child of children.values()) child.kill("SIGTERM");
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
launch("next", ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)]);
startWorkers();
