import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const roots = [".github", "scripts", "src", "supabase", "tests"];
const rootFiles = [".env.example", "package.json", "next.config.ts"];
const textExtensions = new Set([".json", ".mjs", ".sql", ".toml", ".ts", ".tsx", ".yaml", ".yml"]);
const forbidden = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#]{20,}/,
  /(?:sk|rk)-(?:live|prod)-[A-Za-z0-9_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
];

async function collect(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(fullPath)));
    else if (textExtensions.has(extname(entry.name))) files.push(fullPath);
  }
  return files;
}

const files = [
  ...rootFiles.map((path) => join(root, path)),
  ...(await Promise.all(roots.map((path) => collect(join(root, path))))).flat(),
];
const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(content)) findings.push(`${relative(root, file)}: ${pattern.source}`);
  }
}

if (findings.length > 0) {
  console.error(`Potential committed secrets:\n${findings.join("\n")}`);
  process.exitCode = 1;
} else {
  console.info(`Secret scan passed (${files.length} text files checked).`);
}
