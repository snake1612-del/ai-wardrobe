# AI Wardrobe — Testing

**Status:** Phase 8 approved: YES; Phase 9 approved: YES — APPROVE WITH WARNINGS; Phase 10 approved: YES — `APPROVE WITH WARNINGS`; production deployment: NOT RUN.

# Testing Principles

Tests prove server and database boundaries, not the visibility of a UI control. Results are never marked passing unless the command ran. Fixtures are synthetic, deterministic and account-scoped. A known identifier is not proof of access.

# Test Pyramid / Layers

1. Unit tests for pure validation, error and privacy helpers.
2. PostgreSQL integration tests for constraints, search and authorization.
3. Browser tests for authenticated product flows, account isolation, localization and accessibility.
4. Manual and adversarial checks for environment-specific or destructive operational behavior.

# Unit Tests

Vitest executes `tests/unit`. Coverage includes environment validation, stable application errors, structured-log redaction, auth/password and return-path policy, canonical exact-origin validation, owner-bound browser-state cleanup, profile/settings validation, ru/en dictionary completeness, ClothingItem/media validation and Bulk Import parser, normalization, issue, grouping, variant/view, Storage retry and lease-renewal invariants. Run `pnpm test`.

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
disposable local stack → replay all 21 migrations → apply controlled seed → lint schema → run pgTAP → generate TypeScript types
```

CI repeats this from an empty runner. No manual dashboard step is accepted as schema history.
The approved Phase 10 gate covered fourteen migrations. The current publication candidate adds migrations 015–018 for long Prepare leases, bounded Prepare retry, preview-worker separation and owner-scoped progress; migration 019 for profile data; migration 020 for locale; and migration 021 for regional settings. The latest generated types were stable and the targeted profile/locale/settings suites passed, but this is not a new full release gate.

For local manual review, `pnpm dev` supervises preview-only `import.parse` and media validation/processing workers. It does not auto-claim `import.commit`, import cleanup or media cleanup. Production scheduling remains unvalidated.

The retained local database currently exposes one independent known failure in `supabase/tests/database/007_bulk_import_mvp.test.sql`: `invalid staged object path`. The failure is outside Documentation & Product Copy and must not be hidden by changing docs, unrelated fixtures or Bulk Import logic.

# Browser Smoke Tests

Playwright runs the compiled application in desktop and mobile Chromium. In addition to the Phase 7–9 auth/Wardrobe/private-media suites, Phase 10 covers responsive Choose/upload progress, Prepare polling, Review/Resolve, sealed Preview/Confirm, Results, partial retry, hostile-Origin denial and known-ID User A/User B IDOR isolation.

# Accessibility Tests

`@axe-core/playwright` checks the public shell, auth, Wardrobe/media, Bulk Import review, profile and settings in desktop/mobile viewports. Semantic HTML, labelled fields, pending/error feedback, correct `lang` for ru/en, keyboard focus, skip navigation and reduced-motion styling remain manual review companions.

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

Independent Phase 8 review initially returned `CHANGES REQUIRED`; no P0 was found, and all P1/P2/P3 findings were remediated and locally revalidated. The final repeat review outcome is `APPROVE`, Phase 8 approval is YES and production deployment is NOT RUN. At that historical gate, Phase 9 had not started; its later gate is recorded below.

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

# Post-approval Account Profile Gate

The post-Phase-10 account-profile patch adds migration 019, owner-derived display-name mutation, confirmed Auth email change, current-password-verified replacement, private account API fields and accessible loading/success/error UI. Targeted validation passed: 3/3 model tests, 14/14 rollback-scoped pgTAP assertions, database lint, generated types, typecheck, anonymous route/API denial, private/no-store and nosniff headers, secret scan and production build.

The full database suite currently reports one pre-existing Bulk Import assertion failure in `007_bulk_import_mvp.test.sql` when run against retained local import jobs; the new `012_account_profile.test.sql` suite passes. Bulk Import was not changed to mask that state.

The isolated authenticated browser test passed display-name save/reload, private API, PKCE email change, current-password-verified replacement, logout/re-login and accessibility. It used one fictional identity and removed only that identity and its linked account after the run.

# Russian/English i18n Gate

The post-Phase-10 i18n patch adds migration 020 and D-100. It uses a single ru/en dictionary, Russian fallback, an SSR-visible HTTP-only locale cookie for anonymous visitors and owner-derived account_preferences.locale_code persistence through set_own_locale. No account identifier is accepted from the browser.

Validation passed without db:reset: formatting, lint, typecheck, targeted locale pgTAP assertions, production build and isolated Playwright desktop/mobile flows. The browser flow covered anonymous switching, reload, authenticated persistence, logout/login, auth, dashboard, empty wardrobe, new item, Bulk Import, profile and settings routes, no mixed Cyrillic in English mode and axe accessibility. Only fictional identities were used and removed; Import workers and Confirm were not run.

# Account Settings Gate

Migration 021 adds constraints and authenticated-only `update_own_regional_preferences`. Targeted tests cover IANA timezone validation, metric/imperial units, Monday/Sunday week start, idempotent same-value save, optimistic conflict, anonymous/restricted-account denial and User A/User B isolation. The combined current unit gate passed 117/117 assertions. Isolated settings/i18n Playwright passed 6/6 desktop/mobile flows with axe, reload and logout/login persistence; its fictional identities were removed.

# Documentation and Copy Checks

Documentation-only verification includes Markdown formatting, internal relative-link targets, referenced repository files, documented package scripts, route inventory, stale Phase 7-only claims, the repository secret scan and `git diff --check`. On 2026-09-27 the check covered 12 Markdown files, 10 internal links, 17 package commands, eight principal routes, seven explicit file references and all 21 migration files. Format, lint, typecheck, 117/117 unit, secret scan, production build and `git diff --check` passed.

This gate did not run pgTAP, Storage integration or Playwright and did not reset a database, upload an archive, execute Import Confirm or mutate an account. The known retained-database failure in `007_bulk_import_mvp.test.sql` remains independent and open.
