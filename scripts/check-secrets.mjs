import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const roots = [".github", "docs", "scripts", "src", "supabase", "tests"];
const rootFiles = [".env.example", "README.md", "package.json", "next.config.ts"];
const textExtensions = new Set([
  ".css",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const forbidden = [
  { label: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  {
    label: "legacy Supabase service-role assignment",
    pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#]{20,}/,
  },
  {
    label: "Supabase secret assignment",
    pattern: /SUPABASE_SECRET_KEY\s*=\s*(?!replace-with-local-secret-key\b)[^\s#]{20,}/,
  },
  { label: "Supabase secret marker", pattern: /sb_secret_[A-Za-z0-9_-]{20,}/ },
  { label: "production API key", pattern: /(?:sk|rk)-(?:live|prod)-[A-Za-z0-9_-]{20,}/ },
  {
    label: "JWT-shaped credential",
    pattern: /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  },
];

const syntheticRegressionFixtures = [
  {
    label: "modern Supabase secret",
    content: [
      "SUPABASE_SECRET",
      "_KEY=sb_",
      "secret_",
      "synthetic_regression_value_000000000000",
    ].join(""),
    expected: ["Supabase secret assignment", "Supabase secret marker"],
  },
  {
    label: "legacy service-role secret",
    content: ["SUPABASE_SERVICE_ROLE", "_KEY=", "synthetic_legacy_value_000000000000"].join(""),
    expected: ["legacy Supabase service-role assignment"],
  },
  {
    label: "Markdown modern Supabase secret marker",
    fileName: "synthetic-secret-regression.md",
    content: [
      "Example credential: `sb_",
      "secret_",
      "synthetic_markdown_value_000000000000",
      "`",
    ].join(""),
    expected: ["Supabase secret marker"],
  },
];

for (const fixture of syntheticRegressionFixtures) {
  if (fixture.fileName && !textExtensions.has(extname(fixture.fileName))) {
    throw new Error(`Secret scanner regression failed: ${fixture.fileName} is not scanned`);
  }
  const detected = forbidden
    .filter(({ pattern }) => pattern.test(fixture.content))
    .map(({ label }) => label);
  for (const expected of fixture.expected) {
    if (!detected.includes(expected)) {
      throw new Error(`Secret scanner regression failed: ${fixture.label} missed ${expected}`);
    }
  }
}

const examplePlaceholder = ["SUPABASE_SECRET", "_KEY=replace-with-local-secret-key"].join("");
if (forbidden.some(({ pattern }) => pattern.test(examplePlaceholder))) {
  throw new Error("Secret scanner regression failed: .env.example placeholder was rejected");
}

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
  for (const { label, pattern } of forbidden) {
    if (pattern.test(content)) findings.push(`${relative(root, file)}: ${label}`);
  }
}

if (findings.length > 0) {
  console.error(`Potential committed secrets:\n${findings.join("\n")}`);
  process.exitCode = 1;
} else {
  console.info(
    `Secret scan passed (${files.length} text files and ${syntheticRegressionFixtures.length} regression fixtures checked).`,
  );
}
