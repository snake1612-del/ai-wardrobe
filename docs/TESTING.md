# AI Wardrobe — Testing

**Status:** Phase 6 foundation; database execution pending a Docker/Podman-capable environment.

# Testing Principles

Tests prove server and database boundaries, not the visibility of a UI control. Results are never marked passing unless the command ran. Fixtures are synthetic, deterministic and account-scoped. A known identifier is not proof of access.

# Test Pyramid / Layers

1. Unit tests for pure validation, error and privacy helpers.
2. PostgreSQL integration tests for constraints, search and authorization.
3. Browser smoke tests for the compiled shell and safe operational endpoint.
4. Manual and adversarial checks added alongside each future product capability.

# Unit Tests

Vitest executes `tests/unit`. Current useful coverage includes public environment validation, stable application error codes/status mapping and structured-log redaction. Run `pnpm test`.

# Database Integration Tests

pgTAP SQL under `supabase/tests/database` executes against the local migrated Supabase database. It verifies the 31-table inventory, UUID foundation, `pg_trgm`, same-row search, composite ownership, AppearanceVariant compatibility, Outfit physical-item uniqueness, Wear snapshot uniqueness, same-day distinct events, scoped external IDs, media replacement ownership and rendition uniqueness.

Run `pnpm db:start`, `pnpm db:reset`, then `pnpm test:db`.

# RLS / Authorization Matrix

| Actor                      | Read own ordinary domain row |    Read other known ID |   Direct domain mutation |         Operational tables |
| -------------------------- | ---------------------------: | ---------------------: | -----------------------: | -------------------------: |
| Anonymous                  |                         Deny |                   Deny |                     Deny |                       Deny |
| Authenticated User A       |          Allow where granted |                   Deny |          Deny in Phase 6 |                       Deny |
| Authenticated User B       |          Allow where granted |                   Deny |          Deny in Phase 6 |                       Deny |
| Trusted application/worker |        Explicit command only | Explicitly scoped only | Command/transaction only | Narrow workflow capability |

The test changes to the real `authenticated` role and supplies a synthetic JWT subject; it does not use service-role credentials while pretending to be a user. Grant assertions cover SELECT/INSERT/UPDATE/DELETE capability boundaries.

# Migration Tests

The database release gate is:

```text
fresh local stack → replay all ten migrations → apply controlled seed → lint schema → run pgTAP → generate TypeScript types
```

CI repeats this from an empty runner. No manual dashboard step is accepted as schema history.

# Browser Smoke Tests

Playwright runs the compiled application in desktop and mobile Chromium projects. It checks the root landmark/heading, absence of fatal console errors and the redacted health response. Run `pnpm build` before `pnpm test:e2e` when no reusable server is active.

# Accessibility Tests

`@axe-core/playwright` checks the foundation shell in both viewports. Semantic HTML, `lang="ru"`, keyboard focus, skip navigation and reduced-motion styling also require manual review as interactive features arrive.

# Security Regression Tests

Current automated checks cover known-ID cross-user reads, missing anonymous grants, missing direct mutation grants, cross-account FK injection and sensitive log-key removal. Future feature suites must add Auth/session, IDOR, CSRF origin, private Storage, upload validation, cache isolation, export/deletion and replay tests before those capabilities ship.

# Fixtures

SQL fixtures use reserved-looking UUIDs and `example.invalid` emails. No real user identity, credential, image, note, archive or wardrobe record may enter tests, CI artifacts, logs or screenshots. Reference seed rows are a minimal controlled vocabulary, not personal fixtures.

# CI Gates

The application job runs frozen install, formatting, lint, typecheck, unit tests and build. The database job starts local Supabase, resets/replays, lints, runs pgTAP and generates types. The browser job installs Chromium and runs Playwright/axe. CI has read-only repository permission and only synthetic public configuration.

# What Is Deferred

Product flow tests, Auth/session tests, Storage tests, upload/image adversarial fixtures, import archives, background workers, accessibility interaction coverage and performance budgets are deferred to the phases that implement those capabilities. Source Audit remains mandatory before real import fixtures or detailed Bulk Import behavior.

# Phase-specific Release Gates

Phase 6 requires every application, database and browser command to pass, generated types to reflect the migrated schema, and a manual no-secret/no-public-storage review. On this workstation the application and browser gates pass; the database gate is pending solely because Docker/Podman is unavailable. Therefore Phase 6 must remain unapproved until CI or a suitable local machine records passing DB migration/RLS results.
