# AI Wardrobe

Private, server-authoritative wardrobe application. This repository currently contains only the Phase 6 project and data foundation; product features begin in later phases.

# Current Status

Phase 6 implementation is present. Application checks pass locally. Database migration, generated-type and RLS execution remain a release gate until run in an environment with Docker or Podman; the current workstation has neither. Nothing has been deployed publicly.

# Architecture Summary

- Next.js App Router with React Server Components by default.
- Modular monolith: presentation in `src/app`, product boundaries in `src/modules`, cross-cutting policy in `src/platform`, provider adapters in `src/infrastructure` and visual primitives in `src/ui`.
- Browser → Next.js trusted application layer → database/storage/provider boundary.
- Controlled hybrid database access: user-context Supabase clients for narrow RLS-protected reads; invariant-heavy writes belong to trusted server commands and transactions added with their product modules.
- One durable `accounts.id` owns personal data; provider Auth identity is only the identity binding.

# Prerequisites

- Node.js 24 (see `.node-version` and `.nvmrc`).
- pnpm 11.19.0.
- Docker Desktop or Podman for the local Supabase stack.

# Installation

```bash
pnpm install --frozen-lockfile
```

The lockfile is authoritative. Do not use npm or Yarn in this repository.

# Environment

Copy `.env.example` to `.env.local` and use values from `pnpm db:start` for local development. Public variables contain only the project URL and publishable key. Never add service-role/admin credentials to a `NEXT_PUBLIC_*` variable.

- `local`: local Next.js plus local Supabase only.
- `preview`: isolated preview/staging project with synthetic data; never the production project.
- `production`: separate production project and secrets, created only after explicit approval.
- `test`: synthetic configuration used by automated checks.

# Local Development

```bash
pnpm db:start
pnpm dev
```

The root page is deliberately a private-product foundation placeholder, not a marketing site. `/dev/ui` is available only outside production for token/primitives inspection. `/api/health` validates configuration without returning secret or database details.

# Supabase Local Development

```bash
pnpm db:start
pnpm db:reset
pnpm test:db
pnpm db:stop
```

The CLI uses `supabase/config.toml`. It must target the local container stack; never substitute the production database for development. No Storage bucket is created in Phase 6. Future wardrobe buckets must remain private.

# Database Migrations

Ten ordered migrations under `supabase/migrations` create the approved 31 application tables, indexes, `pg_trgm`, deny-by-default RLS and narrow grants. `pnpm db:reset` proves a fresh database can replay the entire history and controlled `supabase/seed.sql` vocabulary.

Create future migrations through the Supabase CLI and commit the SQL. Do not make dashboard-only schema changes.

# Generate DB Types

With local Supabase running and fully migrated:

```bash
pnpm db:types
pnpm typecheck
```

`src/infrastructure/database/database.types.ts` is generated infrastructure output and must not be edited manually. Database rows remain infrastructure types; domain/application semantics must use module-local contracts.

# Tests

```bash
pnpm test
pnpm test:db
pnpm test:e2e
```

Unit tests cover environment parsing, application errors and log redaction. pgTAP covers schema/search, structural ownership invariants and the RLS/grant matrix. Playwright runs desktop/mobile smoke checks plus axe accessibility checks. See `docs/TESTING.md`.

# Quality Checks

```bash
pnpm check
```

This local application gate runs format check, lint, typecheck, unit tests, static migration inventory/RLS coverage, a lightweight committed-secret scan and the production build. Database and browser gates remain separate because they require containers and an installed browser respectively. CI runs all three groups.

# Build

```bash
pnpm build
pnpm start
```

The production command uses Next.js's supported webpack build path because the current Turbopack CSS worker requires a loopback port that is unavailable in the constrained local runner; `pnpm dev` keeps the framework default. Production and preview builds require valid public Supabase configuration. Critical server-only secrets will be introduced and validated only with the feature that needs them.

# Project Structure

```text
src/app/                 Next.js routes and framework boundaries
src/modules/             Product module entry points; no product CRUD yet
src/platform/            Environment, errors and safe logging policy
src/infrastructure/      Browser/server Supabase adapters and DB types
src/ui/                  Small semantic visual primitives
supabase/migrations/     Reproducible schema history
supabase/tests/database/ pgTAP constraints and authorization tests
tests/unit/              Fast foundation tests
tests/e2e/               Browser and accessibility smoke tests
docs/                    Approved product/design/architecture records
```

# Security Rules

- Browser IDs and values are untrusted; ownership is derived from verified Auth identity.
- No service-role/admin client exists in the browser or shared client module.
- RLS is forced on personal tables and ordinary browser roles receive no direct mutations.
- Cross-account personal relationships use composite foreign keys.
- Authenticated/private responses and signed URLs must use private/no-store caching when introduced.
- Cookie-backed mutations must validate authentication, authorization, allowed Origin and request intent; SameSite is defense in depth, not the only CSRF control.
- Logs accept only allowlisted scalar context and discard token, cookie, URL, note, image and payload-shaped keys.
- Use only synthetic test identities and assets. Never commit real wardrobe data.

# What Is Not Implemented Yet

No signup/login UI, onboarding, wardrobe CRUD, media upload/processing, Bulk Import parser/UI, Outfit Builder, wear tracking, Calendar/Insights, AI, weather, billing, Household sharing, analytics tracking, service worker/offline sync, production jobs, remote infrastructure or deployment exists.

# Next Phase

Phase 7 — Authentication & Privacy. Do not start it until Phase 6 database/RLS execution has passed and Phase 6 receives external approval.
