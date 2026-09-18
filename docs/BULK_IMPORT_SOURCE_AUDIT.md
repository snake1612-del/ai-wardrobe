# Phase 10 — Bulk Import Source Audit And Contract Addendum

**Date:** 2026-09-18
**Status:** Source Audit complete; D-099 accepted; Bulk Import MVP technical gate PASS; external review `APPROVE WITH WARNINGS`; Phase 10 explicitly approved
**Scope:** sanitized audit evidence plus the separately authorized local Bulk Import MVP; no real source bytes or production records entered Git

# Safety And Evidence Boundary

The two owner-supplied ZIP parts were treated as one candidate source set only after each part passed an independent preflight. The archives were read without modification and extracted only to a temporary directory outside the repository. Extracted copies were made read-only. No archive entry was executed, rendered into a report, uploaded, committed or sent to an external service. This document intentionally omits local paths, original filenames, image content, EXIF values and any personal text.

| Evidence                                       |                                                             Part A |                                                             Part B |                                                               Combined |
| ---------------------------------------------- | -----------------------------------------------------------------: | -----------------------------------------------------------------: | ---------------------------------------------------------------------: |
| SHA-256                                        | `0a49bc18cd6e6bfae3d064da356a113c8be84b8c86fb46679738df2cfe677e76` | `584c96476342cbeb1b2860d158e14c7ac36bd8f3fff3490d4ad5f839bf5d1834` | source-set identity is the ordered pair of part hashes, not a filename |
| ZIP integrity                                  |                                                               PASS |                                                               PASS |                                                                   PASS |
| Compressed bytes                               |                                                        473,699,745 |                                                        401,103,620 |                                                            874,803,365 |
| Uncompressed bytes                             |                                                        475,155,997 |                                                        407,347,859 |                                                            882,503,856 |
| Files                                          |                                                                125 |                                                                130 |                                                                    255 |
| JPEG                                           |                                                                 88 |                                                                 89 |                                                                    177 |
| PNG                                            |                                                                 37 |                                                                 41 |                                                                     78 |
| Corrupt/undecodable images                     |                                                                  0 |                                                                  0 |                                                                      0 |
| Encrypted/symlink/executable/traversal entries |                                                                  0 |                                                                  0 |                                                                      0 |
| Exact byte duplicates                          |                                                                  0 |                                                                  0 |                                                                      0 |

All 255 files decode as single-frame JPEG or PNG. The largest entry is 7,262,168 bytes and the largest decoded image is 12,582,912 pixels, within the Phase 9 media limits. There are no documents, structured records, nested archives, scripts or binaries. The set is therefore an image-only wardrobe source set, not a code archive and not a self-describing import package.

# Manifest And Source Schema Finding

Neither part contains a manifest. Consequently there is no source-declared schema, item record, item identifier, category, name, lifecycle/status, image role, ImageView, AppearanceVariant, catalog page/slot, usage note or historical wear record.

Filename-derived identifiers are not item identifiers:

- 175 JPEG names follow a camera timestamp pattern; the remaining two are compatible collision-renamed camera files.
- All 78 PNG names are unique UUID-shaped asset names.
- Camera timestamps and PNG UUIDs have zero overlap between parts, but they identify files, not physical items.
- Nine distinct first numeric-token values overlap between parts, proving that partial filename tokens cannot define a global or owner-scoped item namespace.

The source therefore has **no stable external item ID**. A camera timestamp, UUID-shaped filename, ZIP ordinal, archive path, content hash or visual similarity must never be promoted to `external_item_id` authority.

# Safe Source Classification

The audit uses evidence labels, not production truth:

- The 177 EXIF-bearing camera JPEG files are `source_candidate` assets.
- The 78 PNG files have no EXIF and use screenshot/catalog-like dimensions; they are `catalog_candidate` assets.
- No source asset is labelled front/back/side/detail. A 30-second proximity heuristic produces 45 two-image clusters but also 13 ambiguous clusters with more than two images, so it cannot assign an `ImageView` automatically.
- No catalog asset declares `catalog_page` or `catalog_slot`, and ZIP entry order places all source candidates before catalog candidates. Entry order cannot map source and catalog assets.
- There is no explicit AppearanceVariant evidence. Front/back or similar-looking images remain ImageView candidates; a variant exists only after the user confirms a physically selectable appearance of one item.
- There is no reliable physical-set marker. A set is one physical item only when the user explicitly confirms that it is owned, used and tracked as one unit.

# Duplicate, Orphan And History Findings

- Exact SHA-256 comparison found zero duplicate files.
- Conservative perceptual review produced seven strong **possible duplicate pairs**, all within one source part and none across parts. The reproducible audit threshold was 64-bit dHash distance ≤5 plus normalized 32×32 RGB mean absolute error ≤6%. They remain review issues; they are never merged automatically.
- A broader perceptual candidate set is too noisy to be authoritative. Similarity may prioritize review only.
- Because no manifest or item mapping exists, all 255 assets begin as `unassigned`, not as confirmed orphans. `missing asset` counts are unknowable because there is no declared expected inventory.
- No text or structured data exists, so usage notes and historical wear evidence are absent. Phase 10 must not synthesize WearEvents or move an observation boundary backward.
- Category, display name and lifecycle/status are unknown. Unknown values remain null/unresolved; they do not become empty strings, defaults or inferred facts.

# D-099 Contract Addendum

## One Supported MVP Adapter

The only source adapter proposed for the first Bulk Import implementation is `legacy-wardrobe-image-set/v1`.

It accepts one user-selected source set containing one to four ZIP parts. Each part contains a single root directory and only JPEG/PNG image entries. An input manifest or other structured file is not part of this adapter and is rejected as an unsupported entry; the audited source has none. The absence of source metadata forces all item grouping and semantic mapping through Resolve. No record may reach Preview-ready or Confirm until its blocking issues are resolved or it is explicitly skipped.

Prepare computes an immutable inventory and an internal canonical manifest. This internal manifest is staging evidence, not production truth and not an exported copy of private filenames. It has this normalized shape:

```json
{
  "schema_version": "aiw.bulk-import/1",
  "adapter": "legacy-wardrobe-image-set/v1",
  "source_set_hashes": ["sha256-part-a", "sha256-part-b"],
  "assets": [
    {
      "asset_key": "asset-001",
      "content_sha256": "sha256",
      "media_type": "image/jpeg",
      "origin_proposal": "source_candidate",
      "view_proposal": "unknown",
      "record_key": null
    }
  ],
  "records": [
    {
      "source_record_key": "record-001",
      "external_item_id": null,
      "item_fields": {
        "display_name": null,
        "category_code": null,
        "lifecycle_state": null
      },
      "appearance_variants": [],
      "asset_keys": [],
      "historical_wear_evidence": []
    }
  ]
}
```

The example above is a schema illustration with synthetic values. Raw private filenames, EXIF values and notes are not copied into logs or ordinary report payloads.

## Workflow And Trust Boundary

The fixed user flow is:

```text
Choose → Prepare → Review → Resolve → Preview → Confirm → Results
```

- **Choose:** authenticate, derive the active account server-side and select all ZIP parts belonging to one source set.
- **Prepare:** quarantine, hash, validate, decode, inventory and build untrusted staging rows only.
- **Review:** show bounded totals and issues; no ClothingItem, AppearanceVariant, media binding, Outfit or WearEvent exists.
- **Resolve:** the user groups assets into physical items, distinguishes ImageView from AppearanceVariant, supplies required item fields and chooses skip/link/update decisions.
- **Preview:** show the exact create/update/link/skip plan, field-level diffs, asset mappings and conflicts for one versioned revision.
- **Confirm:** exact-origin mutation seals the manifest hash and preview revision. Only the sealed scope is eligible for bounded commit.
- **Results:** show one durable terminal outcome per record and safe retry for failed records.

Browser input expresses intent only. The server derives account scope, re-authorizes every session/record/target ID and supplies ownership to capability-specific commands. Anonymous access and User A reading or mutating User B's session, staged assets, decisions, preview or report must fail even with known IDs.

## Grouping And Reconciliation Rules

1. One confirmed physical group creates or links at most one ClothingItem.
2. Multiple source/catalog images and ImageViews never create additional ClothingItems.
3. Front/back/side/detail are ImageViews. A selectable reversible appearance is an AppearanceVariant only after explicit user confirmation.
4. `catalog_page` and `catalog_slot` are optional staging coordinates, never identity or authorization evidence.
5. Exact duplicate bytes collapse to one proposed asset while retaining staging aliases for the report.
6. Probable duplicates remain separate until the user chooses one, keeps both as views, or skips one. Similarity never authorizes merge, link or update.
7. An unassigned asset blocks Confirm unless explicitly skipped. A missing declared asset is an error; absence cannot be computed when the source did not declare it.
8. The audited source has no stable external item IDs. First import may create or explicitly link records but cannot auto-update by filename. Retry uses the sealed session and record `commit_key`; a later source set requires Preview again.
9. This adapter offers update only after the user explicitly selects an owner-scoped existing item. It has no source external ID suitable for automatic update. The Preview always shows a field/relation diff and preserves user-confirmed fields, lifecycle, primary media and links unless explicitly changed.
10. Record conflicts include duplicate external ID, multiple target candidates, stale target version, changed preview revision and inconsistent item/variant/view grouping. Conflicts never silently rebase.
11. Unknown category/name/status remains unresolved. A record lacking production-required fields is skipped or kept in review; defaults are not invented.
12. Usage text alone is not a WearEvent. Only explicit dated historical evidence in a future supported schema could propose an event, and that proposal would require separate review.

## Bounded Issue Taxonomy

Issue codes are versioned and bounded; arbitrary parser strings are not client contracts.

| Family          | Codes                                                                                                                                                                                  | Confirm behavior                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Archive         | `archive_integrity_failed`, `archive_encrypted`, `archive_path_unsafe`, `archive_unsupported_entry`, `archive_limit_exceeded`, `archive_duplicate_path`                                | blocking                                                                   |
| Source metadata | `source_metadata_absent`                                                                                                                                                               | expected audited finding; forces Resolve but is not itself a parse failure |
| Asset           | `asset_type_unsupported`, `asset_decode_failed`, `asset_limit_exceeded`, `asset_exact_duplicate`, `asset_probable_duplicate`, `asset_unassigned`, `asset_declared_missing`             | invalid/missing/unassigned block; duplicate candidates require resolution  |
| Record          | `record_external_id_missing`, `record_external_id_duplicate`, `record_name_missing`, `record_category_unknown`, `record_status_unknown`                                                | required-field/duplicate conflicts block; allowed unknowns remain explicit |
| Mapping         | `mapping_item_ambiguous`, `mapping_view_unknown`, `mapping_variant_ambiguous`, `mapping_catalog_position_unknown`, `mapping_physical_set_ambiguous`, `mapping_existing_item_candidate` | blocks unless explicitly resolved or skipped                               |
| History         | `history_evidence_absent`, `history_evidence_ambiguous`                                                                                                                                | never creates WearEvent implicitly                                         |
| Conflict        | `preview_stale`, `target_version_changed`, `target_missing`, `target_foreign_or_missing`                                                                                               | blocking; foreign and missing share a non-enumerating result               |
| Workflow        | `record_skipped`, `commit_retryable`, `commit_terminal_failure`, `cleanup_pending`                                                                                                     | reflected in per-record result; never converted to success                 |

## Archive Security Limits

`legacy-wardrobe-image-set/v1` is bounded as follows:

- at most four ZIP parts and 1 GiB compressed bytes combined;
- at most 2 GiB uncompressed bytes, 2,000 entries and 16 MiB per image entry combined;
- path depth at most 16 and normalized relative path length at most 240 UTF-8 bytes;
- no encryption, symlink, hardlink, device, executable, nested archive, absolute/traversal path, control character, duplicate normalized path or Unicode normalization collision;
- archive compression ratio at most 20:1 overall and 50:1 per entry;
- only magic-verified, fully decoded, single-frame JPEG/PNG; maximum 12,000 pixels per axis and 40 megapixels, aligned with D-098;
- extraction occurs in isolated quarantine outside the application/repository/web root, with no execution and no direct production binding;
- client filenames and archive paths are display-only untrusted data and never become Storage paths, HTML, authorization keys or log fields.

Any bound violation fails Prepare before semantic review. Antivirus remains a future deployment gate; it is not silently claimed by format allowlisting and safe decode.

## Retention, Cleanup And Retry

- Cancelled staging and raw archive bytes become cleanup-eligible immediately and must be deleted within 24 hours.
- An unconfirmed inactive session expires after seven days; reopening after expiry requires a new upload and hash/inventory pass.
- After terminal Results, raw ZIP bytes become cleanup-eligible immediately and must be deleted within 24 hours. Only bounded source hashes, normalized decisions, external identities and per-record outcomes follow the import-history policy.
- Unbound staged media are deleted through Storage APIs after session cleanup; application SQL never mutates `storage.objects` directly.
- Cleanup is idempotent and may retry. A missing object is reconciled as already absent; an authorization/account mismatch is terminal and audited safely.
- Retrying Prepare with the same account, adapter version and ordered part hashes returns/reconciles the existing active session. Confirm replay uses the same sealed manifest hash, preview revision and record commit keys and cannot duplicate domain rows.

## Future Capability Contracts

No endpoint is implemented in this phase. A later implementation may expose only capability-specific server commands for:

- create/resume source-set intent;
- complete a part after Storage verification;
- start/retry Prepare;
- read owner-scoped review pages and issues;
- save a version-checked resolution;
- generate a versioned Preview;
- Confirm one exact preview revision and manifest hash;
- retry a failed subset, cancel a session and fetch Results.

Every mutation requires verified Auth, server-derived active account, exact-origin CSRF validation, bounded payloads, optimistic session version and idempotency key/request hash binding. There is no generic service-role import repository. Workers claim only account-bound jobs and revalidate session state before each effect.

# Sanitized Representative Fixture Specification

The future test fixture is generated synthetic data and must not copy any audited filename, note, EXIF value or image pixel. It uses tiny deterministic JPEG/PNG files below test limits and `example.invalid` identities only.

| Synthetic record | Purpose                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `record-001`     | one physical item with source front/back and one catalog primary                                        |
| `record-002`     | one physical item with two explicitly labelled AppearanceVariants, each with its own catalog ImageViews |
| `record-003`     | user-confirmed physical set that remains one ClothingItem                                               |
| `record-004`     | exact asset duplicate aliases; one proposed asset, two staging references                               |
| `record-005`     | probable visual duplicate that remains separate pending resolution                                      |
| `record-006`     | absent external ID and unknown category/status; create-only after explicit required-field resolution    |
| `record-007`     | orphan/unassigned asset plus a declared missing asset and a corrupt fake-MIME file                      |
| `record-008`     | explicit owner-scoped existing-item selection with a field/version update conflict                      |
| `record-009`     | usage note without dated evidence; no WearEvent proposal                                                |

The fixture also includes traversal, duplicate normalized path, nested archive, excessive entry/ratio/dimensions/pixels and unsupported type cases. User A and User B receive distinct source namespaces while reusing known synthetic IDs to prove isolation.

# Test Strategy For The Future Implementation

- **Unit:** ZIP path normalization, bounds, schema validation, canonical hashing, issue taxonomy, grouping rules, ImageView/AppearanceVariant distinction, exact/probable duplicate behavior, sealed-manifest hashing and log redaction.
- **Archive integration:** real ZIP parsing in quarantine, corrupt/truncated/encrypted/traversal/nested/bomb-like inputs, magic/decode/dimension limits and cleanup.
- **Database/pgTAP:** account-composite FKs, forced RLS, no direct browser mutations, owner+source external identity uniqueness, sealed revision consistency and record-level idempotency.
- **Storage integration:** private staged objects, anonymous denial, User A/User B known-path denial, overwrite denial and Storage-API-only cleanup.
- **Server/security:** verified account derivation, exact-origin rejection, IDOR against session/record/asset/target IDs, foreign-or-missing non-enumeration, stale Preview conflict and no privileged credential in browser/logs.
- **Browser/accessibility:** Choose → Prepare → Review → Resolve → Preview → Confirm → Results on desktop/mobile; progress, cancellation, resume, empty/error/partial/conflict/retry; keyboard grouping controls, focus restoration, live progress and issue summaries.
- **Idempotency:** duplicate part completion, duplicate Prepare, duplicate Confirm, crash before/after each record outcome and failed-subset retry create no duplicate ClothingItem/media binding.
- **No-write proof:** snapshots before and after every pre-Confirm stage show no new/changed production ClothingItem, AppearanceVariant, media binding, Outfit or WearEvent.

# Phase 10 Source-Audit Acceptance Checklist

- [x] SHA-256 and integrity recorded independently for both source parts.
- [x] Safe inventory totals, decoded dimensions and format classifications recorded without private filenames/content.
- [x] Stable item-ID finding recorded: no stable item IDs exist; camera/UUID asset names are not promoted to item identity.
- [x] Source and catalog candidate images classified, with uncertainty preserved.
- [x] ImageView and AppearanceVariant rules are distinct; neither is inferred from similarity or front/back grouping.
- [x] Exact and probable duplicate policy is explicit; visual similarity never auto-merges.
- [x] Unassigned/orphan and missing-asset semantics are documented without inventing an expected inventory.
- [x] Historical wear finding recorded: no evidence exists, so no WearEvent may be synthesized.
- [x] One supported adapter and version are named: `legacy-wardrobe-image-set/v1`.
- [x] Archive traversal, decompression, entry, size, ratio, decode, dimension and pixel limits are bounded.
- [x] Sanitized representative fixture specification contains no real personal data.
- [x] No production-domain write is possible before an exact sealed Confirm.
- [x] Server-derived account scope, anonymous denial and User A/User B known-ID isolation requirements are explicit.
- [x] Hostile-Origin, CSRF and IDOR regression requirements are explicit.
- [x] Cleanup retention, retry, replay and record-level idempotency semantics are explicit.
- [x] D-099 and this addendum received explicit approval on 2026-09-18.
- [x] Bulk Import implementation, migration 014 and executable synthetic fixture were separately authorized and implemented.
- [x] Independent external review and the complete final quality gate approve the technical implementation with documented warnings.

# Blockers And Unresolved Questions

1. The raw set has no stable item IDs or source-to-catalog mapping. MVP therefore requires manual grouping and create/link decisions; it cannot promise automatic update across new source sets.
2. The audit cannot prove missing files, physical sets, ImageViews or AppearanceVariants from metadata alone. Resolve must expose these as user decisions.
3. Production antivirus, hosted quarantine/worker scheduling and operational deletion evidence remain deployment gates. They do not authorize expanding Phase 10 documentation into implementation.
4. Import-history retention beyond the staging/raw-byte windows still needs the broader privacy/export/account-deletion retention decision.
5. Exact committed-item required fields must be revalidated against the then-current Wardrobe contract before implementation; unknown values must not be fabricated.
