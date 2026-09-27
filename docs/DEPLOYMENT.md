# AI Wardrobe — Environment and Deployment Guide

**Current status:** local development is implemented; production deployment is **NOT RUN**. This guide records the repository's current commands and release boundaries. It is not evidence that a hosted environment has passed them.

## Environment separation

| Environment | Application origin                                 | Supabase                        | Data policy                                 | Status                   |
| ----------- | -------------------------------------------------- | ------------------------------- | ------------------------------------------- | ------------------------ |
| Local       | Loopback or approved private WSL address over HTTP | Local Docker stack              | Synthetic or explicitly retained local data | Implemented              |
| Preview     | Exact HTTPS Vercel preview origin                  | Separate non-production project | Synthetic test data only                    | Not validated end to end |
| Production  | Exact approved HTTPS origin                        | Separate production project     | Real data after release gates               | NOT RUN                  |

Do not point local or preview code at the production project. Do not reuse production credentials in preview.

## Required environment variables

Set only the names defined by `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `APP_ORIGIN`
- `APP_ENV`
- `SUPABASE_SECRET_KEY`

The two `NEXT_PUBLIC_*` values are browser-safe project coordinates. `SUPABASE_SECRET_KEY` is server-only and must never be copied into a public variable, client component, log, screenshot or committed file. `APP_ORIGIN` is the canonical exact origin used by CSRF checks and Auth redirects. `APP_ENV` is one of the runtime labels accepted by the server environment parser.

## Local setup

1. Start Docker Desktop and enable WSL integration.
2. Install the locked dependency graph with `pnpm install --frozen-lockfile`.
3. Start the local stack with `pnpm db:start`.
4. Copy `.env.example` to the ignored `.env.local` and fill it from the local Supabase status output without publishing the values.
5. Set `APP_ORIGIN` to the exact address used in the browser.
6. Apply pending migrations with `pnpm db:migrate`.
7. Start the application with `pnpm dev`.

The local CLI configuration exposes API `54321`, database `54322`, Studio `54323` and Mailpit `54324`. The values are developer-local defaults, not hosted endpoints.

`pnpm dev` runs Next.js plus preview-only import/media workers. The local worker supervisor may claim archive parsing and thumbnail preparation. It does not automatically claim `import.commit`, import cleanup or media cleanup; confirming an import remains a separate owner action.

## Migration workflow

For a retained local database:

```bash
pnpm db:migrate
pnpm db:lint
pnpm db:types
pnpm typecheck
```

For an explicitly disposable local database only, `pnpm db:reset` proves a fresh replay. It destroys and recreates that local database and must not be used as a routine update command or against retained user/import data.

Every schema or policy change must be an ordered file in `supabase/migrations`. Dashboard-only changes are not release history. Generated types must be regenerated from the fully migrated target and reviewed for unexpected drift.

## Preview on Vercel and Supabase

Preview deployment requires a dedicated non-production Supabase project and an HTTPS Vercel preview origin.

1. Create or select the isolated preview project; never use production as the preview target.
2. Review the ordered migrations and inspect the linked migration state before applying anything.
3. Apply migrations to that explicitly selected preview project using the Supabase CLI linked-project migration workflow.
4. Configure the five environment variables in the Vercel Preview environment. Set `APP_ENV=preview` and make `APP_ORIGIN` exactly match the HTTPS preview origin.
5. Add the exact preview callback and redirect destinations to Supabase Auth configuration. Do not use broad wildcard redirects as a substitute for the application's allowlist.
6. Build with `pnpm build` and use the repository lockfile for installation.
7. Run only synthetic smoke identities and assets. Verify auth, private/no-store responses, User A/User B isolation, private media delivery, hostile-Origin rejection and accessible ru/en rendering.

Hosted Storage, the production worker scheduler and cleanup scheduling have not been validated. A preview that lacks a supervised worker cannot be described as supporting automatic media/import processing.

## Production gate

Production deployment needs separate explicit approval. Before it can run, the release owner must resolve and record:

- Supabase and compute regions plus privacy/residency requirements;
- database and private-object backup/restore evidence;
- production email and redirect configuration;
- durable import/media worker scheduling, leases, alerts and cleanup;
- retention and deletion operational policy;
- resource limits for ZIP parts currently loaded into worker memory;
- the known Bulk Import pgTAP failure in `007_bulk_import_mvp.test.sql`;
- a complete application, database, Storage, browser, accessibility and secret gate against release code.

Production variables belong only in the production environment. Never print or copy their values into GitHub, CI logs, documentation or issue text.

## Safe verification order

1. Review `git diff` and confirm only intended source, documentation and migration files are present.
2. Run formatting, lint, typecheck, unit, secret and production-build checks.
3. Start the isolated target and inspect pending migrations.
4. Apply migrations before deploying code that depends on them.
5. Generate and review database types for drift.
6. Run database/RLS tests, then Storage integration, then browser/accessibility tests using synthetic identities.
7. Confirm exact origins, private response headers, cross-account denial and safe logs.
8. Deploy only after the environment-specific gate is recorded.

Do not run destructive resets, imports or Confirm operations merely to prove documentation changes.

## Rollback considerations

Migrations are forward-only release history; there is no automatic down-migration contract. Before a hosted migration, take the environment-appropriate backup and prepare a reviewed forward remediation. Application rollback is safe only when the previous build remains compatible with the already-applied schema.

Private Storage requires its own backup and reconciliation plan; database restore alone does not restore object bytes. Jobs are at-least-once and idempotent by design, but an operator must not blindly requeue failed work or repeat Import Confirm without reviewing the owner-scoped state and terminal outcomes.
