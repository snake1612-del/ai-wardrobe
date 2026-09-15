import { spawn } from "node:child_process";
import { rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputPath = join(process.cwd(), "src", "infrastructure", "database", "database.types.ts");
const temporaryPath = `${outputPath}.tmp`;
const content = await new Promise((resolve, reject) => {
  const child = spawn("supabase", ["gen", "types", "typescript", "--local", "--schema", "public"], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const chunks = [];

  child.stdout.on("data", (chunk) => chunks.push(chunk));
  child.on("error", reject);
  child.on("close", (code) => {
    if (code === 0) resolve(Buffer.concat(chunks).toString("utf8"));
    else reject(new Error(`Supabase CLI exited with code ${code ?? "unknown"}`));
  });
}).catch((error) => {
  console.error(`${error.message}. The existing generated file was preserved.`);
  process.exit(1);
});

if (!content.includes("export type Database")) {
  console.error("Supabase CLI returned unexpected type output; the existing file was preserved.");
  process.exit(1);
}

await writeFile(temporaryPath, content, "utf8");
await rename(temporaryPath, outputPath);
console.info("Generated database types from the migrated local schema.");
