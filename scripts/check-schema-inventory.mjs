import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const expectedTables = [
  "account_deletion_requests",
  "account_preferences",
  "accounts",
  "appearance_variants",
  "audit_events",
  "categories",
  "clothing_item_colors",
  "clothing_item_seasons",
  "clothing_item_tags",
  "clothing_items",
  "colors",
  "export_requests",
  "external_item_identities",
  "idempotency_records",
  "import_asset_links",
  "import_records",
  "import_sessions",
  "import_sources",
  "item_metadata_evidence",
  "jobs",
  "media_assets",
  "media_bindings",
  "media_renditions",
  "outfit_items",
  "outfit_seasons",
  "outfit_tags",
  "outfits",
  "seasons",
  "tags",
  "wear_event_items",
  "wear_events",
].sort();

const migrationDirectory = join(process.cwd(), "supabase", "migrations");
const migrationNames = (await readdir(migrationDirectory))
  .filter((name) => name.endsWith(".sql"))
  .sort();
const migrations = await Promise.all(
  migrationNames.map(async (name) => ({
    name,
    sql: await readFile(join(migrationDirectory, name), "utf8"),
  })),
);
const allSql = migrations.map(({ sql }) => sql).join("\n");
const actualTables = [...allSql.matchAll(/create table public\.([a-z_]+)/g)]
  .map((match) => match[1])
  .sort();

const errors = [];
if (migrationNames.length !== 11)
  errors.push(`expected 11 migrations, found ${migrationNames.length}`);
if (JSON.stringify(actualTables) !== JSON.stringify(expectedTables)) {
  errors.push(`table inventory mismatch: ${JSON.stringify(actualTables)}`);
}
if (/\bsource_version\b/.test(allSql)) errors.push("removed source_version appears in migrations");

const securitySql =
  migrations.find(({ name }) => name.endsWith("security_rls_grants.sql"))?.sql ?? "";
const dynamicRlsBlock = securitySql.match(/do \$security\$([\s\S]+?)\$security\$;/)?.[1] ?? "";
for (const table of expectedTables) {
  const directlyEnabled = securitySql.includes(
    `alter table public.${table} enable row level security`,
  );
  const dynamicallyEnabled = dynamicRlsBlock.includes(`'${table}'`);
  if (!directlyEnabled && !dynamicallyEnabled)
    errors.push(`${table} is missing from RLS enablement`);
}

if (errors.length > 0) {
  console.error(`Schema inventory check failed:\n${errors.join("\n")}`);
  process.exitCode = 1;
} else {
  console.info("Schema inventory passed: 11 migrations, 31 tables, all tables RLS-enabled.");
}
