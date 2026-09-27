# AI Wardrobe

AI Wardrobe is a private, server-authoritative wardrobe application built with Next.js and Supabase. The current repository contains the approved foundations for authentication, Wardrobe Core, private media and the Bulk Import MVP, plus local post-Phase-10 work for profile, Russian/English localization and account settings.

Production deployment has **not** been run. Hosted Storage, production workers and retention cleanup remain deployment gates.

## What works

- Email/password signup, login, logout and recovery with SSR cookie refresh, PKCE callbacks and allowlisted redirects. Signup, recovery and password change require 8–128 characters with at least one Latin letter.
- Profile editing for display name, confirmed email change and current-password-verified password change.
- A private wardrobe with draft/committed items, search, filters, favorites, archive/restore and optimistic conflict handling.
- Private JPEG/PNG/WebP media upload, validation, WebP renditions and owner-authorized delivery.
- Bulk Import for image-only ZIP files: upload, automatic preparation, private thumbnails, manual decisions, preview, explicit confirmation and itemized results.
- Russian and English UI with an SSR-stable locale; account owners can also save timezone, metric/imperial units and Monday/Sunday week start.

Export, account deletion, onboarding, Outfit Builder, wear tracking, Calendar/Analytics and AI features are not implemented.

## Technology

- Node.js 24 and pnpm 11.19
- Next.js 16 App Router, React 19 and TypeScript 6
- Tailwind CSS 4 behind project UI primitives and design tokens
- Supabase PostgreSQL 17, Auth and private Storage
- Zod, authenticated TUS upload and pinned Sharp/libvips image processing
- Vitest, pgTAP, Playwright and axe accessibility checks

The application is a modular monolith:

```text
src/app/                 Next.js routes, layouts and request boundaries
src/modules/             Account, wardrobe, media and import modules
src/platform/            Environment, origin, error and logging policy
src/infrastructure/      Supabase adapters and generated database types
src/i18n/                Shared ru/en dictionary and locale resolution
src/ui/                  Semantic UI primitives
supabase/migrations/     Ordered database and Storage policy history
supabase/tests/database/ pgTAP constraints and authorization tests
tests/unit/              Fast deterministic tests
tests/e2e/               Browser, isolation and accessibility flows
docs/                    Product, architecture, security and operations records
```

## Prerequisites

- Node.js `>=24 <25` (`.node-version` and `.nvmrc`)
- pnpm `11.19.0`
- Docker Desktop with WSL integration, or another Docker-compatible runtime supported by the local Supabase CLI

Install the locked dependency graph:

```bash
pnpm install --frozen-lockfile
```

Do not use npm or Yarn in this repository.

## Environment

Copy `.env.example` to an ignored `.env.local`. The required variable names are:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `APP_ORIGIN`
- `APP_ENV`
- `SUPABASE_SECRET_KEY`

Obtain local values from the local Supabase CLI output. Never commit `.env.local`, print credentials in reports, or place a secret/admin key in a `NEXT_PUBLIC_*` variable.

`APP_ORIGIN` must exactly match the browser origin used for local development. Non-production local mode accepts canonical HTTP only for loopback or a private RFC1918 address; preview and production require HTTPS.

## Local development

Start Docker first, then run:

```bash
pnpm db:start
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000` unless `APP_ORIGIN` specifies another allowed local address.

`pnpm dev` supervises Next.js and local preview workers. Those workers automatically prepare Bulk Import archives and private thumbnails, but deliberately do not claim Import Confirm or cleanup jobs. Import Confirm remains an explicit owner action in the UI.

Useful local Supabase endpoints use the ports configured in `supabase/config.toml`: API `54321`, database `54322`, Studio `54323` and Mailpit `54324`. Treat them as local developer services, not public endpoints.

Protected routes include:

- `/app`
- `/app/wardrobe`
- `/app/import`
- `/app/profile`
- `/app/settings`

The public Auth surface is `/auth`; its callback, confirmation and recovery routes are internal parts of that flow. `/dev/ui` is a non-production design-system inspection route, not an application setting.

## Bulk Import behavior

The current adapter accepts one source set of up to four image-only ZIP parts containing JPEG or PNG files. It does not accept an input manifest and never infers a thing's name, category, grouping or identity from a filename, timestamp, archive order, UUID-like text, hash or visual similarity.

After upload, a worker validates and reads the archive, stages images and prepares private thumbnails. The owner then reviews every image and explicitly chooses `create`, `link`, `group` or `skip`. Confirmation is the only boundary that may write production wardrobe records. Retrying upload/preparation and repeating a confirmation are protected against overwrite and duplicate records; existing items can be updated only after an explicit owner-scoped selection.

Long Prepare jobs renew their owner/job-protected lease before expiry. Storage downloads use bounded retry for transient server failures and retain full SHA-256 verification. These safeguards do not authorize cross-account access or weaken immutable uploads.

## Database and generated types

Apply pending local migrations without rebuilding the database:

```bash
pnpm db:migrate
pnpm db:lint
pnpm db:types
pnpm typecheck
```

`pnpm db:reset` is destructive and is only for an explicitly disposable local database. It replays the complete migration history and controlled seed; never run it against retained local data, preview or production.

`src/infrastructure/database/database.types.ts` is generated output. Do not edit it manually.

## Verification

Safe application checks:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm security:secrets
pnpm build
git diff --check
```

Database, Storage and browser checks have separate prerequisites and may create/delete only synthetic fixtures. Follow [docs/TESTING.md](docs/TESTING.md) before running them.

The current retained local database has an independent known failure in `supabase/tests/database/007_bulk_import_mvp.test.sql`: `invalid staged object path`. It predates this documentation/copy work and is not a documentation regression. Do not hide it with an unrelated schema or fixture change.

## Security model

- Account scope comes from the verified server session; browser-provided account/user/owner identifiers are never authorization authority.
- Personal tables use forced RLS and known-ID User A/User B isolation.
- Capability-specific privileged commands replace a generic service-role repository.
- Cookie-backed mutations require exact-origin validation; redirect destinations are allowlisted.
- Originals, renditions and staged archives stay in private buckets. Private responses use `private, no-store`; image delivery also uses `nosniff`.
- Service-role credentials stay in server-only modules and must not enter browser bundles, URLs, logs or errors.
- Logs use safe codes/counts and must not contain filenames, object keys, notes, pixels, tokens or provider payloads.

## Environments and deployment

Local, preview and production use separate configuration and data boundaries. Preview should use an isolated Supabase project and synthetic data. Production requires an explicit deployment approval plus resolved region, backup, worker scheduling, email and retention gates.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the verified workflow and rollback considerations. No Vercel preview or production deployment is claimed by this README.

## Documentation

- [Project state](docs/PROJECT_STATE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Security](docs/SECURITY.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Decision log](docs/DECISIONS.md)
- [Bulk Import source audit](docs/BULK_IMPORT_SOURCE_AUDIT.md)
