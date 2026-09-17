# AI Wardrobe — Testing

**Status:** Phase 8 local quality gate passed; external-review findings remediated; approval NO; production deployment NOT RUN.

# Testing Principles

Tests prove server and database boundaries, not the visibility of a UI control. Results are never marked passing unless the command ran. Fixtures are synthetic, deterministic and account-scoped. A known identifier is not proof of access.

# Test Pyramid / Layers

1. Unit tests for pure validation, error and privacy helpers.
2. PostgreSQL integration tests for constraints, search and authorization.
3. Browser smoke tests for the compiled shell and safe operational endpoint.
4. Manual and adversarial checks added alongside each future product capability.

# Unit Tests

Vitest executes `tests/unit`. Coverage includes environment validation, stable application errors, structured-log redaction, safe auth and Wardrobe return-path allowlisting, canonical exact-origin validation, persistent owner-bound browser-state cleanup, ClothingItem validation and sparse comma-separated metadata normalization. Run `pnpm test`.

# Database Integration Tests

pgTAP SQL under `supabase/tests/database` executes against the local migrated Supabase database. It verifies the 31-table inventory, UUID foundation, `pg_trgm`, search, composite ownership, AppearanceVariant compatibility, Outfit/Wear uniqueness, scoped external IDs, media ownership, RLS/grants, account-bootstrap idempotency and Phase 8 wardrobe aggregate commands.

Run `pnpm db:start`, `pnpm db:reset`, then `pnpm test:db`.

# RLS / Authorization Matrix

| Actor                      | Read own ordinary domain row |    Read other known ID |           Direct domain mutation |         Operational tables |
| -------------------------- | ---------------------------: | ---------------------: | -------------------------------: | -------------------------: |
| Anonymous                  |                         Deny |                   Deny |                             Deny |                       Deny |
| Authenticated User A       |          Allow where granted |                   Deny | Deny direct; server command only |                       Deny |
| Authenticated User B       |          Allow where granted |                   Deny | Deny direct; server command only |                       Deny |
| Trusted application/worker |        Explicit command only | Explicitly scoped only |         Command/transaction only | Narrow workflow capability |

The test changes to the real `authenticated` role and supplies a synthetic JWT subject; it does not use service-role credentials while pretending to be a user. Grant assertions cover SELECT/INSERT/UPDATE/DELETE capability boundaries.

# Migration Tests

The database release gate is:

```text
fresh local stack → replay all twelve migrations → apply controlled seed → lint schema → run pgTAP → generate TypeScript types
```

CI repeats this from an empty runner. No manual dashboard step is accepted as schema history.

# Browser Smoke Tests

Playwright runs the compiled application in desktop and mobile Chromium. In addition to the complete Phase 7 auth/session suite, Phase 8 covers create/read/edit, favorite, archive with visible Undo/restore, deterministic tag search, saved return state, sparse AppearanceVariant labels, hostile-Origin replay against persisted data, empty state and known-ID User A/User B isolation. Unit coverage verifies that progressive result limits are normalized and bounded; the UI exposes a keyboard-accessible `Показать ещё` fallback.

# Accessibility Tests

`@axe-core/playwright` checks the public foundation shell, auth page and Wardrobe empty/grid, mobile filter dialog, new, detail and edit states in both viewports. Semantic HTML, labelled fields, native modal filtering, pending/error feedback, `lang="ru"`, keyboard focus, skip navigation and reduced-motion styling remain manual review companions.

# Security Regression Tests

Automated definitions cover known-ID and search cross-user reads, account API scope, missing anonymous/direct/operational grants, cross-account FK injection, privileged bootstrap denial/idempotency, canonical redirect/origin policy, invalid sessions, recovery enumeration resistance, private/no-store responses, persistent owner binding and secret patterns. Definitions are not reported passing until their command completes. Private Storage, uploads, export/deletion and product-object IDOR remain future feature gates.

# Fixtures

SQL fixtures use reserved-looking UUIDs and `example.invalid` emails. No real user identity, credential, image, note, archive or wardrobe record may enter tests, CI artifacts, logs or screenshots. Reference seed rows are a minimal controlled vocabulary, not personal fixtures.

# CI Gates

The application job runs frozen install, formatting, lint, typecheck, unit tests and build. The database job starts local Supabase, resets/replays, lints, runs pgTAP and generates types. The browser job starts/resets local Supabase, installs Chromium and runs the real auth Playwright/axe flow, then always stops the stack. CI has read-only repository permission.

# What Is Deferred

OAuth/MFA, production email, private Storage, upload/image adversarial fixtures, import archives/Bulk Import, onboarding, Outfit/Wear/Calendar/Analytics, background workers and performance budgets remain deferred. Source Audit remains mandatory before real import fixtures or detailed Bulk Import behavior.

# Phase-specific Release Gates

Phase 7 requires application/database/browser gates, generated bootstrap types, a manual secret boundary review and the checklist in `PROJECT_STATE.md`.

Final Phase 7 status: the remediation gate above passed, repeat external review approved commit `544c089`, and the user explicitly approved Phase 7 in commit `52cc4cb`. Production deployment was not run.

# Phase 8 Release Gate

Phase 8 adds Wardrobe unit, database and real browser coverage. On 2026-09-17 the following local checks passed:

- formatting, lint, typecheck and 47/47 unit assertions;
- clean replay of all 12 migrations and controlled seed;
- DB lint with no schema errors;
- 90/90 pgTAP assertions, including aggregate create/update, reconcile-only create retry, optimistic conflict, category/color rejection, tags, sparse variants, favorite, archive/restore, draft-archive rejection, audit events, privileged-function denial, high-cardinality filter coverage and active-account/User A/B isolation;
- database type generation with only the expected migration-12 command/search RPC signatures and no unexpected schema/type drift;
- 32/32 Playwright tests across desktop/mobile, including the Phase 8 vertical-slice/isolation/account-state tests, real hostile-Origin replay and expanded Wardrobe accessibility coverage;
- `pnpm security:secrets` and `git diff --check`.

Independent Phase 8 external review completed with outcome `CHANGES REQUIRED`; no P0 was found, and all P1/P2/P3 findings were remediated and locally revalidated. Phase 8 approval is NO. Production deployment is NOT RUN.
