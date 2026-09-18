# AI Wardrobe — Testing

**Status:** Phase 8 approved: YES; Phase 9 approved: YES — APPROVE WITH WARNINGS; Phase 10 approved: YES — `APPROVE WITH WARNINGS`; production deployment: NOT RUN.

# Testing Principles

Tests prove server and database boundaries, not the visibility of a UI control. Results are never marked passing unless the command ran. Fixtures are synthetic, deterministic and account-scoped. A known identifier is not proof of access.

# Test Pyramid / Layers

1. Unit tests for pure validation, error and privacy helpers.
2. PostgreSQL integration tests for constraints, search and authorization.
3. Browser smoke tests for the compiled shell and safe operational endpoint.
4. Manual and adversarial checks added alongside each future product capability.

# Unit Tests

Vitest executes `tests/unit`. Coverage includes environment validation, stable application errors, structured-log redaction, safe auth and Wardrobe return-path allowlisting, canonical exact-origin validation, persistent owner-bound browser-state cleanup, ClothingItem/media validation and Bulk Import parser, normalization, issue, grouping, variant/view and resolution invariants. Run `pnpm test`.

# Database Integration Tests

pgTAP SQL under `supabase/tests/database` executes against the local migrated Supabase database. It verifies the 32-table inventory, UUID foundation, `pg_trgm`, search, composite ownership, AppearanceVariant compatibility, Outfit/Wear uniqueness, scoped external IDs, media/import ownership, RLS/grants, account-bootstrap idempotency and capability-specific Wardrobe, private-media and Bulk Import commands.

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
fresh local stack → replay all fourteen migrations → apply controlled seed → lint schema → run pgTAP → generate TypeScript types
```

CI repeats this from an empty runner. No manual dashboard step is accepted as schema history.

# Browser Smoke Tests

Playwright runs the compiled application in desktop and mobile Chromium. In addition to the Phase 7–9 auth/Wardrobe/private-media suites, Phase 10 covers responsive Choose/upload progress, Prepare polling, Review/Resolve, sealed Preview/Confirm, Results, partial retry, hostile-Origin denial and known-ID User A/User B IDOR isolation.

# Accessibility Tests

`@axe-core/playwright` checks the public foundation shell, auth page, Wardrobe/media states and the Bulk Import review flow in desktop/mobile viewports. Semantic HTML, labelled fields, pending/error feedback, `lang="ru"`, keyboard focus, skip navigation and reduced-motion styling remain manual review companions.

# Security Regression Tests

Automated definitions cover known-ID and search cross-user reads, account/API scope, missing anonymous/direct/operational grants, cross-account FK injection, privileged capability denial/idempotency, canonical redirect/origin policy, invalid sessions, recovery enumeration resistance, private/no-store responses, Storage isolation, import hostile-Origin/IDOR and secret/log/path patterns. Definitions are not reported passing until their command completes. Export/deletion and later product-object IDOR remain future feature gates.

# Fixtures

SQL fixtures use reserved-looking UUIDs and `example.invalid` emails. No real user identity, credential, image, note, archive or wardrobe record may enter tests, CI artifacts, logs or screenshots. Reference seed rows are a minimal controlled vocabulary, not personal fixtures.

# CI Gates

The application job runs frozen install, formatting, lint, typecheck, unit tests and build. The database job starts local Supabase, resets/replays, lints, runs pgTAP and generates types. The browser job starts/resets local Supabase, installs Chromium and runs the real auth Playwright/axe flow, then always stops the stack. CI has read-only repository permission.

# What Is Deferred

OAuth/MFA, production email, onboarding, Outfit/Wear/Calendar/Analytics, production worker scheduling and performance budgets remain deferred. Phase 10 tests use only the fully fictional executable ZIP fixture; real source bytes, names, notes and images never enter Git or CI.

# Phase-specific Release Gates

Phase 7 requires application/database/browser gates, generated bootstrap types, a manual secret boundary review and the checklist in `PROJECT_STATE.md`.

Final Phase 7 status: the remediation gate above passed, repeat external review approved commit `544c089`, and the user explicitly approved Phase 7 in commit `52cc4cb`. Production deployment was not run.

# Phase 8 Release Gate

Phase 8 adds Wardrobe unit, database and real browser coverage. On 2026-09-17 the following local checks passed:

- formatting, lint, typecheck and 51/51 unit assertions, including strict rejection of non-HTTP local/private-origin exceptions;
- clean replay of all 12 migrations and controlled seed;
- DB lint with no schema errors;
- 90/90 pgTAP assertions, including aggregate create/update, reconcile-only create retry, optimistic conflict, category/color rejection, tags, sparse variants, favorite, archive/restore, draft-archive rejection, audit events, privileged-function denial, high-cardinality filter coverage and active-account/User A/B isolation;
- database type generation with only the expected migration-12 command/search RPC signatures and no unexpected schema/type drift;
- 32/32 Playwright tests across desktop/mobile, including the Phase 8 vertical-slice/isolation/account-state tests, real hostile-Origin replay and expanded Wardrobe accessibility coverage;
- `pnpm security:secrets` and `git diff --check`.

Independent Phase 8 review initially returned `CHANGES REQUIRED`; no P0 was found, and all P1/P2/P3 findings were remediated and locally revalidated. The final repeat review outcome is `APPROVE`, Phase 8 approval is YES and production deployment is NOT RUN. Phase 9 is next and not started.

# Phase 9 Media Gate

Phase 9 adds unit tests for path/state/validation contracts; pgTAP for buckets, policies, grants, capability transitions, replay, concurrency and User A/User B isolation; and real local Storage API tests for authenticated TUS, anonymous denial, known-path isolation, overwrite denial, original-read denial and rendition-write denial. Adversarial fixtures cover corrupt content, false MIME, unsupported HEIC/HEIF/SVG/GIF/AVIF/PDF, multiple frames, excessive dimensions and pixel budget.

Worker tests cover job deduplication, leases, expired-lease recovery, bounded retry, crash-before-record and crash-after-object cases. Playwright covers accessible upload progress, retry, failure, quarantine, ready placeholders, reorder/primary/replace/remove, account switching and exact-origin rejection on desktop/mobile. Delivery tests assert authorization and exact cache/nosniff headers. The full gate also regenerates database types, checks drift, scans repository and browser bundles for secrets and builds production output.

On 2026-09-17 the Phase 9 local gate passed: formatting, lint and typecheck; 65/65 unit assertions; clean replay of all 13 migrations; DB lint with no schema errors; 146/146 pgTAP assertions; real Storage API integration with authenticated TUS transport retry, User A/User B and anonymous denial, overwrite/original-read/rendition-write denial and duplicate completion; byte-for-byte stable generated database types; 36/36 Playwright desktop/mobile tests including accessibility and private delivery headers; repository plus 47-file browser-bundle secret scan; 31-table RLS schema inventory; production build; and `git diff --check`.

The independent implementation review found and corrected completion replay, processing-retry, rendition-existence, cleanup-FK, gallery mutation serialization and primary-removal/reorder semantics defects before the final gate. No blocking findings remain. The external review outcome is `APPROVE WITH WARNINGS`, and the user explicitly approved Phase 9 on 2026-09-18. Hosted Storage/production scheduling remain untested, general antivirus remains outside the allowlisted manual-image scope, and the stable type generator retains its known nonfatal `MaxListenersExceededWarning`. Production deployment is NOT RUN.

# Phase 10 Bulk Import Gate

The real two-part source set was audited read-only outside the repository. Both ZIP parts passed integrity and unsafe-entry preflight; all 255 JPEG/PNG files decoded, no exact duplicates or corrupt assets were found, and no private filename, image, EXIF value or note entered Git. The source has no manifest, stable item ID, source/catalog mapping or historical wear evidence. Accepted D-099 and `docs/BULK_IMPORT_SOURCE_AUDIT.md` define the single `legacy-wardrobe-image-set/v1` adapter, archive limits, bounded issues, manual Resolve boundary, sealed Confirm, retention and sanitized fixture specification.

Implementation coverage now includes archive adversarial cases, canonical hashing, no-pre-Confirm domain-write proof, anonymous/User A/User B isolation, hostile-Origin/IDOR, stale preview conflicts, duplicate completion/Confirm, worker lease/retry, Storage-API cleanup, accessibility and secret/log/path scans. A fully fictional executable ZIP fixture covers ordinary views, AppearanceVariant, physical set, duplicate candidates, unresolved/corrupt/missing cases, explicit update conflict and a usage note that never becomes WearEvent.

Migration 14 adds the private `wardrobe-imports` bucket, exact-path authenticated INSERT policy, `import_archive_parts` and service-role-only import capabilities with empty `search_path`. Real local Storage integration exercises authenticated TUS retry, overwrite denial, anonymous/cross-account isolation, completion replay and original-read denial.

On 2026-09-18 the Phase 10 local gate passed: formatting, lint and typecheck; 80/80 unit assertions; clean replay of all 14 migrations; DB lint with no schema errors; 208/208 pgTAP assertions; real Storage API integration; byte-for-byte stable generated database types; 40/40 Playwright desktop/mobile tests including axe accessibility, hostile-Origin and known-ID isolation; 32-table RLS schema inventory; repository plus 59-file browser-bundle secret scan; production build; and `git diff --check`.

The independent review found and corrected stale-worker/cancellation, terminal cleanup, skipped-UUID casting, variant/media binding conflicts, inactive category/account/archived-target checks, ZIP parser bounds, blind Review, fabricated default names, declarative-only fixture coverage, Review media-readiness polling and desktop/mobile E2E state collisions before the final gate. No P0/P1/P2 remains open. Outcome: `APPROVE WITH WARNINGS`; the user explicitly approved Phase 10 on 2026-09-18. Hosted Storage/production scheduling were not validated; compressed archive parts are currently held in worker memory; generated type output remains stable despite the inherited nonfatal `MaxListenersExceededWarning`; source identity remains manual because the real archive has no stable item IDs. Production deployment and Phase 11 are NOT RUN.
