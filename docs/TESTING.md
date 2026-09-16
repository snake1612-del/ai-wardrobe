# AI Wardrobe — Testing

**Status:** Phase 7 technical quality gate passed; external review completed with documentation changes required; repeat external review pending.

# Testing Principles

Tests prove server and database boundaries, not the visibility of a UI control. Results are never marked passing unless the command ran. Fixtures are synthetic, deterministic and account-scoped. A known identifier is not proof of access.

# Test Pyramid / Layers

1. Unit tests for pure validation, error and privacy helpers.
2. PostgreSQL integration tests for constraints, search and authorization.
3. Browser smoke tests for the compiled shell and safe operational endpoint.
4. Manual and adversarial checks added alongside each future product capability.

# Unit Tests

Vitest executes `tests/unit`. Coverage includes environment validation, stable application errors, structured-log redaction, safe auth redirect allowlisting, canonical exact-origin validation and persistent owner-bound browser-state cleanup, including missing/mismatched markers and new-tab behavior. Run `pnpm test`.

# Database Integration Tests

pgTAP SQL under `supabase/tests/database` executes against the local migrated Supabase database. It verifies the 31-table inventory, UUID foundation, `pg_trgm`, same-row search, composite ownership, AppearanceVariant compatibility, Outfit/Wear uniqueness, scoped external IDs, media ownership, RLS/grants and service-role-only account-bootstrap idempotency.

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
fresh local stack → replay all eleven migrations → apply controlled seed → lint schema → run pgTAP → generate TypeScript types
```

CI repeats this from an empty runner. No manual dashboard step is accepted as schema history.

# Browser Smoke Tests

Playwright runs the compiled application in desktop and mobile Chromium. The E2E runner reads local Supabase status without logging credentials, rebuilds with the real local public/server environment, then checks anonymous protection, signup/login/logout, real Mailpit recovery through PKCE callback, access/refresh-token rotation, expired/revoked/invalid sessions, same-profile switching across tabs/context restart, ignored client account IDs, hostile Server Action Origin, canonical callback redirects, private/no-store headers, shell and health behavior.

# Accessibility Tests

`@axe-core/playwright` checks the public foundation shell and the auth page after invalid-session handling in both viewports. Semantic HTML, labelled fields, pending/error feedback, `lang="ru"`, keyboard focus, skip navigation and reduced-motion styling remain manual review companions.

# Security Regression Tests

Automated definitions cover known-ID and search cross-user reads, account API scope, missing anonymous/direct/operational grants, cross-account FK injection, privileged bootstrap denial/idempotency, canonical redirect/origin policy, invalid sessions, recovery enumeration resistance, private/no-store responses, persistent owner binding and secret patterns. Definitions are not reported passing until their command completes. Private Storage, uploads, export/deletion and product-object IDOR remain future feature gates.

# Fixtures

SQL fixtures use reserved-looking UUIDs and `example.invalid` emails. No real user identity, credential, image, note, archive or wardrobe record may enter tests, CI artifacts, logs or screenshots. Reference seed rows are a minimal controlled vocabulary, not personal fixtures.

# CI Gates

The application job runs frozen install, formatting, lint, typecheck, unit tests and build. The database job starts local Supabase, resets/replays, lints, runs pgTAP and generates types. The browser job starts/resets local Supabase, installs Chromium and runs the real auth Playwright/axe flow, then always stops the stack. CI has read-only repository permission.

# What Is Deferred

Wardrobe product flows, OAuth/MFA, production email, Storage, upload/image adversarial fixtures, import archives, background workers and performance budgets are deferred to the phases that implement those capabilities. Source Audit remains mandatory before real import fixtures or detailed Bulk Import behavior.

# Phase-specific Release Gates

Phase 7 requires application/database/browser gates, generated bootstrap types, a manual secret boundary review and the checklist in `PROJECT_STATE.md`.

Post-review remediation status on 2026-09-16: `pnpm check` PASS, including formatting, lint, typecheck, 36/36 unit assertions and production build; clean replay of all 11 migrations PASS; DB lint PASS; 51/51 pgTAP PASS; database type generation PASS with no unexpected schema/type drift; 26/26 Playwright desktop/mobile PASS, including automated accessibility; secret scan PASS. External review is COMPLETED with outcome `CHANGES REQUIRED`, no P0/P1 findings and a documentation-only mandatory fix. Phase 7 is not approved and production deployment was not run; repeat external review and explicit approval remain separate gates.
