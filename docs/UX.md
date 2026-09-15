# AI Wardrobe — UX / Information Architecture

**Phase:** 2 — UX / Information Architecture  
**Status:** Approved / Complete  
**Baseline:** Approved PRD and Decisions D-001–D-030  
**Date:** 2026-09-14

# Executive UX Summary

AI Wardrobe uses one conceptual hierarchy across mobile and desktop: **Home → Wardrobe → Outfits → Activity**, with a persistent contextual **Create** action. The MVP is optimized for the loop `capture/import → find → compose → save/reuse → log wear → inspect history/insight → act` and never requires AI.

Mobile uses four stable bottom destinations plus a separate Create button. Desktop uses a persistent sidebar with the same destinations and grouped utilities. This leaves a fifth mobile destination available for a future Assistant without moving existing destinations. Wishlist and Trips remain secondary planning domains rather than contaminating the owned Wardrobe.

The interface is image-first but every image has a textual identity. Metadata is progressively disclosed. Obvious actions such as Wear today use immediate save plus Undo; consequential changes use confirmation; imports and future AI writes use preview plus confirm. Draft recovery is shared across item, outfit, import and future AI flows.

Bulk Import IA and its stage model are defined, but exact mapping, grouping, duplicate and image/variant reconciliation UX remain provisional until the mandatory Source Audit.

# UX Principles

1. **Continue the loop:** every primary screen offers one credible next action.
2. **Images lead; identity remains textual:** cards prioritize imagery but retain accessible display names and state labels.
3. **Progressive disclosure:** essentials first, advanced metadata and history in sections.
4. **One-tap when intent is unambiguous:** no review form after Wear today unless an exception exists.
5. **State is explicit:** working draft, saved, imported, archived, failed and future AI suggestion never look identical.
6. **Reversible by default:** autosave, Undo, archive/restore and preview precede irreversible operations.
7. **Same concepts, adaptive controls:** mobile sheets and desktop panels expose the same filters and actions.
8. **Accessibility is structural:** no drag-, gesture-, image- or color-only operation.
9. **History is factual:** calendar shows recorded wear only; future planning is separate.
10. **No hidden intelligence:** deterministic search remains primary; future AI results are drafts with evidence and confirmation.

# Information Architecture

## Domain Hierarchy

- **Home** — continuation surface, not a BI dashboard.
- **Wardrobe** — owned physical items.
  - Browse/search/filter
  - Item detail
  - Item create/edit draft
  - AppearanceVariants and images
  - Item archive
- **Outfits** — reusable compositions of owned items.
  - Library and archive
  - Builder/working drafts
  - Outfit detail and wear history
- **Activity** — recorded facts and decisions.
  - Quick wear composer
  - Calendar month/day/agenda
  - Wear event detail/edit
  - Insights and drill-down
- **Create action layer** — contextual launcher, not a destination.
  - Add item, create outfit, log wear; desktop also starts import.
- **Utilities / Settings**
  - Bulk Import, export, privacy/account, preferences, archived access and draft recovery.
- **Future Planning** — Wishlist and Trips/Packing, hidden from MVP primary navigation.
- **Future Assistant** — cross-surface AI drafts plus an optional destination; never replaces contextual actions.

Top-level entities are ClothingItem, Outfit and WearEvent. AppearanceVariant, ClothingImage/ImageView and OutfitItem are subordinate to their parent. Import sessions are task flows. Insights are computed entry points into existing collections, not separate content entities.

# Navigation Strategy

## Mobile Navigation

Persistent bottom navigation contains **Home, Wardrobe, Outfits, Activity**. A prominent Create button is visually associated with the bar but behaves as an action sheet, not a selected tab. Settings/Profile is opened from the top bar. Back returns to the prior collection with query, filters and scroll preserved.

`Activity` is the working IA label and contains Calendar and Insights. Its final localized navigation label remains open for Phase 3 terminology review; changing the label must not change this hierarchy.

Create sheet order is contextual: Add item, Create outfit, Log wear; Bulk Import is present only on suitable devices or routes to the import handoff. From Item, `Create outfit with this item` bypasses the sheet. From Outfit, `Wear today` remains local.

## Desktop Navigation

Use a persistent left sidebar. Primary group: Home, Wardrobe, Outfits, Activity. Activity expands to Calendar and Insights. Create is a fixed sidebar button. Utility group: Import, Archive, Settings. This is preferred over top navigation because the product has persistent collections, nested utilities and future domains; a sidebar scales without hiding hierarchy.

## Navigation Evolution

- **MVP:** four stable destinations + Create; Import/Archive/Settings are secondary.
- **V2:** add Assistant as the optional fifth mobile destination only after it becomes a recurring workflow. Add Planning entry in secondary navigation with Wishlist and Trips. Desktop adds Assistant and Planning groups without moving MVP destinations.
- **V3:** Purchase Checker, Weather and Gap Analysis are entry points inside Assistant, Wishlist, Item/Outfit and Home contexts—not new global tabs.

# Home Strategy

Returning Home with a working wardrobe uses this order:

1. **Resume:** unfinished item/outfit/import draft, at most one highest-priority card.
2. **Quick actions:** Add item, Create outfit, Log wear.
3. **Recent outfits:** optimized for Wear today and Edit.
4. **Recent history:** last recorded events and Calendar link.
5. **Recently added items:** return to incomplete metadata or start outfit.
6. **One actionable insight:** only when evidence is sufficient; link to exact drill-down.
7. **Compact wardrobe summary:** active items and observation coverage, not decorative totals.

Empty/first-use Home replaces the daily modules with two contextual entry choices: `У меня уже есть цифровой гардероб` → Bulk Import and `Начать с нуля` → Add first item, followed by privacy reassurance. For the primary user with an existing digitized wardrobe, Import is the recommended primary path; it is not mandatory for users starting from scratch.

Returning Home prioritizes resume/repeat over discovery. Its daily quick actions are Add item, Create outfit and Log wear; Bulk Import does not occupy a permanent quick-action slot after a working wardrobe exists. Repeat import remains available through Create when contextually appropriate and through Settings → Data / Import. Blocks with no meaningful content are omitted rather than rendered as empty widgets. Later, one contextual card may show active Trip or weather-based AI draft; it replaces the single recommendation slot and does not create a widget wall.

# Wardrobe UX

The default is a visual grid of active items. Each card has primary image/placeholder, display name, category and compact non-color favorite/archived/processing state. Tapping opens detail; selection mode is never the default.

- **Mobile:** sticky compact search; horizontally scrollable high-frequency category chips; Filters opens a full-height bottom sheet; sort lives in the same sheet. Grid uses progressive loading. Returning from detail restores state and position.
- **Desktop:** sticky search/sort row, optional collapsible left filter panel and denser grid. Filters update the visible count immediately.
- **Loading:** stable card skeletons; more results append without moving existing content.
- **Pagination:** continuous loading is acceptable for browse, but show result count, a reachable end state and `Load more` fallback for keyboard/screen-reader use. Deep links restore the filtered collection, not an unstable scroll-only state.
- **Multi-select:** absent from ordinary MVP browsing. It appears only in explicit bounded tasks such as choosing wear items or reviewed import/bulk archive later; entering/exiting selection is labeled and reversible.

# Search & Filtering

Search entry is always visible on Wardrobe and available inside the outfit picker. It covers display name, brand, category, tags, description, notes and supported structured values without AI.

- Suggestions show matching categories/tags and up to five recent queries; recent queries are local/private, clearable and do not appear before use.
- Typo tolerance is communicated as `Results for …` with an option to use the exact query; never silently changes saved metadata.
- Search text and filters combine with AND across groups and OR within a multi-select group, stated in filter help.
- Mobile filter selections are staged in a sheet and applied with `Show N items`; closing without Apply preserves the last applied state. High-frequency chips apply immediately.
- Desktop filters apply immediately with live count; rapid changes remain reversible via chips.
- Active filters appear as removable chips plus count. `Clear all` preserves the text query unless the user chooses `Clear search and filters`.
- Zero results separates spelling/query from filters, suggests removing one restrictive filter and never invokes AI.
- Query/filter/sort state survives Item Detail and is encoded in a private bookmarkable URL; transient selection and drafts are not.
- Availability is omitted in MVP and added to the same filter model in V2.

# Clothing Item UX

Item Detail hierarchy:

1. Primary catalog image, image count, variant switcher when applicable.
2. Display name, category, favorite and explicit archived state.
3. Primary actions: Add to outfit; contextual Wear item; overflow Edit/Archive.
4. Key facts: color, season, purpose, brand—only populated facts.
5. AppearanceVariants section with label, cover image and archived marker.
6. Notes.
7. Used in outfits: visual links.
8. Recorded wear summary and recent history.
9. Expandable All details and provenance/import information.

Analytics is summarized, not duplicated. Missing values show `Not added` only inside edit/detail expansion, not as a wall of empty rows. Overflow contains image management, archive/restore and rare actions; hard delete is not a normal item action.

# Item Creation & Editing

## Quick capture

`Create → Add item → Camera / Photos / Files → image preview → display name or concrete category → Save`. A neutral display name may be generated. Source/catalog role defaults are explained only when multiple assets exist. Success opens Item Detail with `Add to outfit` and `Add more details`; Undo archives/removes the just-created draft according to the safe recovery policy.

## Full edit

Edit groups fields as Identity, Visual, Classification, Use, Purchase and Notes. Only Identity and Visual are initially expanded. Multi-value fields use clear tokens. Save is explicit for a committed item; field edits may be locally draft-preserved until Save. Cancel offers Keep draft / Discard only when changes exist.

Camera denial offers Photos/Files and permission help. Failed upload preserves metadata and shows Retry/Remove. Multiple garments in one image prompts crop/select one or separate drafts; never silently creates one item.

# AppearanceVariant UX

The item asks a plain-language question: `Can this same physical item be worn in more than one appearance?` Helper copy: `Front and back photos of the same appearance are image views, not variants.`

Minimal MVP flow:

1. From Item edit choose `Add appearance`.
2. Enter a short required label such as `Black side`; optional helper example avoids technical terminology.
3. Add or assign catalog images; each image may be marked Front, Back, Side or Detail.
4. Choose the default appearance used on item cards when no context is selected.
5. Save returns to Item Detail with a compact switcher.

In Outfit Builder, adding a multi-appearance item immediately opens a small variant chooser with images and labels; the chosen state is visible on the outfit tile and can be changed via `Change appearance`. OutfitItem stores that choice. Wear today inherits it into the immutable event snapshot.

Archiving a variant explains that it disappears from new choices while saved outfits and wear history keep its label and historical image/placeholder. Restore is available. Removing a never-used variant may be immediate with Undo; a historically referenced variant uses Archive by default. Physical favorite, lifecycle, ownership and all wear statistics remain at ClothingItem level.

# Image Management UX

Image manager is reached from Item Edit or the gallery overflow. It shows user-visible assets only—not thumbnail/medium/full derivatives.

- Add by camera/files; assign item or AppearanceVariant.
- Reorder via drag **or** Move earlier/later controls.
- Set primary with a labeled action; variant primary is scoped to that variant.
- Change ImageView (Front/Back/Side/Detail/Unspecified) independently of variant.
- Show Source/Catalog/reference meaning in details, not as technical storage terminology.
- Failed processing remains in place with Failed label, Retry and Remove.
- Delete warns when primary or historically referenced. A replacement primary is chosen before destructive completion where needed.

# Outfit Library

Default is an image-first grid of saved active outfits. Preview is a stable collage/list of 2–4 leading item images plus total count; it must not imply a generated photograph. Card shows title, favorite and last recorded wear when known.

Filters: favorite, occasion, season, recently worn and contains item/category. Sort: recently updated, recently worn, title. `No recorded wear` is a valid factual filter; `never worn` is not used. Text search covers title and notes only when library size warrants it; MVP still provides a simple search field. Archived is a separate filter/view. Drafts are a distinct Resume section, not mixed with saved results.

# Outfit Builder

The builder has two stable regions: **composition** and **item picker**.

- Start empty, from Item, Duplicate, Edit, or future AI draft.
- Picker reuses Wardrobe search/filter semantics but selection is scoped to the current outfit.
- Add appends an item with suggested semantic role; role is editable and never enforces completeness.
- Replace opens picker with current role/filter context and preserves the old item until a replacement is chosen.
- Remove is immediate with Undo.
- Reorder/layer uses drag plus Move earlier/later and role controls.
- Multi-appearance item requires a labeled variant choice; it remains changeable.
- Duplicate physical item is blocked with explanation; multiple accessories/layers are allowed.
- Working draft autosaves after meaningful changes and displays `Saved just now`/`Saving…`/`Not saved`.
- Explicit Save requires 1+ unique item, requests title only if no neutral title exists, and creates a saved outfit. It does not infer subjective completeness.

**Mobile:** composition is the top summary strip/canvas; picker is a bottom sheet that can expand full-screen. A persistent `Add item` opens it. Selecting an item adds it and returns to composition; `Add another` keeps the picker open. Save remains reachable above the keyboard/safe area.

**Desktop:** composition occupies the main pane; searchable/filterable picker is a persistent side pane. Clicking adds; drag is optional. Replace mode is visibly bounded to one tile. Unsaved exit invokes the shared draft model.

# Outfit Detail

Hierarchy: visual composition → title/favorite/archive state → primary `Wear today` → Edit, Duplicate, Replace item → selected variant labels → occasion/season/notes → recorded wear summary → event history. An unavailable/archived item is identified on its tile; Repeat opens a review only when composition is no longer unambiguous.

# Wear Tracking

`Wear today` is a fast, optimistic action from Outfit Detail, Home recent outfits and an item action menu. On success it creates one event for the user's local date and shows an immediate confirmation with **Undo** and **View day**. If the same saved outfit already has a wear event today, the action changes to a review screen with `Keep both` and `Cancel`; it never silently merges or duplicates.

An item-level `Log wear` opens a compact composer for date, additional items and the item's AppearanceVariant when applicable. Backdating uses the same composer with an explicit date header. The user may record multiple real wears on one day; potential duplicates are warnings, not hard blocks.

Event detail shows date, source label when relevant, snapshot composition and selected variants. `Correct` creates an editable view of the event snapshot; changes never mutate the source saved outfit. Removing an event requires confirmation because it changes counts and insights, then offers a short Undo. Network failure leaves a retryable pending action and does not show success.

# Calendar

Calendar is a factual record of completed WearEvents only. It does not mix planned outfits, packing or recommendations into MVP.

- Month cells show a count and small non-essential visual previews; count/date remain available to assistive technology.
- Selecting a date opens a chronological day agenda with every event and snapshot summary.
- `Log wear` is the primary action on an empty date; past dates open the backdated composer.
- Agenda view provides the accessible and narrow-screen alternative to the visual month grid.
- Today, selected date and dates with events are never distinguished by color alone.
- Time-zone/date corrections are explicit; changing the date updates the event, not the outfit.

# Insights / Analytics

Insights are descriptive, not judgmental. Every surface names its observation window, included population and data coverage before presenting a conclusion. Unknown or incomplete history is never rendered as zero or `never worn`.

The screen hierarchy is: period/population controls → coverage note → key summaries → ranked or grouped details → exact-item/event drill-down → suggested manual action. MVP views include wear frequency, most recorded, no recorded wear in the selected window and category distribution when data supports it. An insight card links to the filtered wardrobe or exact event list that produced it; the user can archive, edit or log a wear from that destination, but the system does not auto-declutter.

Empty state distinguishes `No events in this period`, `History starts after this period` and `Population contains no active items`. Loading preserves labels and layout. Calculation failure shows the unaffected wardrobe/history links plus Retry.

# Archive / Restore

Archive is a history-safe, fully reversible lifecycle action, available from item detail/edit and explicit multi-select mode.

- **Single ordinary archive:** apply immediately and show a visible Undo. Do not open a confirmation modal.
- **Unusual dependency or ambiguity:** open a focused review only when the user must make a real choice; explain the consequences and preserve history.
- **Bulk archive:** show a preview/count and require confirmation before applying, followed by Undo when exact reversal is available.
- **Hard delete:** keep separate from Archive and use a destructive flow with strong confirmation.

Archive has separate Item, Outfit and AppearanceVariant filters. Restoring returns the entity to active selection without reconstructing history. Restoring a variant whose physical item is archived requires restoring the item as well and says so before confirmation. Hard delete is not presented as an archive shortcut.

# Settings

Settings groups only user-owned controls:

1. **Account & privacy** — identity/session, privacy summary and account deletion entry.
2. **Data** — export, import history and provisional Bulk Import entry.
3. **Preferences** — locale, units, week start, reduced motion/theme when supported.
4. **Accessibility** — links to platform controls and non-drag interaction guidance.
5. **About & help** — product version, feedback/help and data-policy links.

Technical diagnostics and future AI provider controls stay out of the primary hierarchy until they are real user choices. Settings is reached from the profile/control in the global header, not a permanent MVP bottom tab.

# Export / Delete

Export is a preview-and-confirm flow. The preview explains included domains, image inclusion, approximate size when known and that export does not delete data. The job has Preparing, Ready, Failed and Expired states; the user can leave and return from Settings. A ready export exposes a clearly dated download action.

Account deletion is a separate, deliberately high-friction flow: explain scope and known retention caveats → re-authenticate when required → enter/confirm the account-specific phrase → final irreversible confirmation. It is never bundled with export, though `Export first` is offered. Failure leaves the account unchanged and provides recovery/contact guidance. Individual hard-delete semantics remain an open product/architecture question and are not invented here.

# Onboarding

Onboarding aims to establish a trustworthy wardrobe and reveal the core loop without forcing the same activation path on every user.

1. Welcome: private-by-default value and `Start`.
2. Choose context: `У меня уже есть цифровой гардероб` → Bulk Import, or `Начать с нуля` → Add first item; skip leads to an explorable empty Home.
3. For a user with an existing digitized wardrobe, Bulk Import is visually recommended and primary. Manual add remains a full path for new users, and Import is never mandatory.
4. Show the corresponding minimal capture/import preview with only required decisions.
5. Success: show the imported wardrobe/result or new item and offer the next core action, additional import/add, or Home.

Permission requests are contextual (camera only after camera action). Progressive tips point to Create, Wear today and Calendar after relevant content exists. Onboarding completion is resumable and does not gate Settings/export/delete.

# Bulk Import UX — Provisional Pending Source Audit

Bulk Import is an MVP activation flow and the recommended onboarding path for the primary user who already has a digitized wardrobe. Its detailed mapping, grouping, duplicate resolution, image reconciliation, source/catalog mapping and AppearanceVariant import handling remain explicitly provisional until the read-only audit of the real source wardrobe. The staged interaction model may be approved now without assuming an unverified file structure or blocking the rest of Phase 2.

Provisional stages:

1. **Choose source** — identify supported material in plain language; preserve originals.
2. **Read & prepare** — progress, cancel-safe boundary and recoverable failures.
3. **Review groups** — proposed physical items, attached photos/catalog images, ImageViews and AppearanceVariants; every proposal is editable.
4. **Resolve issues** — missing names, ambiguous grouping, likely duplicates and unsupported entries; unresolved items may be skipped without blocking the batch.
5. **Preview changes** — counts for create/update/skip, warnings and explicit ownership scope.
6. **Confirm import** — consequential write only after review.
7. **Results** — created/skipped/failed counts, retry failed, open Wardrobe and durable batch record.

AppearanceVariants are first-class in review: several appearances remain under one Physical Item, may have labels and their own catalog images/ImageViews, and never become separate ClothingItems merely because they look different. Front/back alone are ImageViews unless source evidence says they are selectable appearances.

Before this UX is finalized, the audit must inspect: existing item IDs; source photographs; catalog images; front/back and other views; AppearanceVariants; usage notes; naming conventions; and exact/possible duplicates. It must also establish whether historical wear data exists. Until then the document does not prescribe column schemas, folder rules, duplicate thresholds, batch limits or an automatic matching algorithm.

# Future AI Surfaces

AI remains an assistive layer on top of the core IA:

- Contextual actions appear where intent starts: `Suggest with this item`, `Help complete outfit`, future capture metadata and purchase checking.
- A V2 Assistant destination is added only if conversations/recommendations become a repeated cross-domain workflow; otherwise AI remains contextual.
- Every recommendation visibly separates owned, wishlist/candidate and unavailable items, gives grounded reasons and links to source item details.
- AI output starts as a draft. Saving an outfit, changing owned records or creating a purchase candidate requires user confirmation; destructive changes are never autonomous.
- Unavailable AI leaves manual Wardrobe, Outfit Builder and wear tracking fully usable.

# Wishlist Future UX

Wishlist is a V2 Planning subdomain, visually and semantically separate from Wardrobe. Candidate detail shows source, price/date if known, notes, comparison to owned items and `Mark as purchased`. Purchase conversion opens a review that creates a new owned ClothingItem, carries only confirmed metadata and preserves the candidate as provenance; it never flips ownership invisibly. Dismiss/archive remains reversible.

# Packing Future UX

Trips are a V2 Planning subdomain. A trip contains dates/context, a packing list and references to owned items; `Packed` is trip-scoped and never changes item lifecycle. The list separates suggested, selected, packed and unavailable. AI packing in V3 produces an editable proposal with coverage/reasoning and conflicts, after which the user confirms additions or removals.

# Draft Model

Drafts use one vocabulary and recovery pattern across item capture, outfit building, import review and future AI proposals.

| State          | Meaning                                 | User treatment                                          |
| -------------- | --------------------------------------- | ------------------------------------------------------- |
| Working        | Valid local edits exist                 | Continue editing; leave safely when autosave is current |
| Saving         | Persistence in progress                 | Non-blocking indicator; do not claim saved              |
| Saved draft    | Recoverable but not published/committed | Resume from Home/Drafts; explicit Save/Confirm remains  |
| Not saved      | Latest change failed                    | Keep input in place; Retry or copy; warn on exit        |
| Conflict/stale | Source changed elsewhere                | Show differences; choose reload or keep a new draft     |
| Discarded      | User explicitly discards                | Confirm only when recovery would otherwise be lost      |

Draft Center is a lightweight filtered list reached from Home's resume card, not a new primary domain. Item drafts may lack optional metadata; saved ClothingItems require a display name. Outfit drafts may be incomplete; saved outfits require at least one unique item. Import drafts preserve the staged review but create no items until Confirm. Future AI drafts are labeled AI-generated and require review.

# Confirmation Model

| Action class                      | Pattern                                      | Examples                                                                                      |
| --------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Frequent and reversible           | Act immediately + visible Undo               | add/remove builder item, favorite, Wear today, single ordinary archive                        |
| Consequential but reviewable      | Preview/summary + Confirm                    | import batch, bulk archive, export request, purchase conversion                               |
| Destructive or identity-level     | Explain impact + strong confirmation/re-auth | delete WearEvent, delete account                                                              |
| Ambiguous or dependency-sensitive | Review choices before write                  | duplicate wear, variant selection, unusual archive dependency, restore child of archived item |

Success uses an inline status when the result remains on screen and a toast with a specific noun/action when it does not. Errors stay adjacent to the failed action and include recovery. Toasts never carry the only copy of critical information, remain long enough to perceive and are announced accessibly. Undo restores the exact prior state when possible. Reversibility alone does not justify a modal: single ordinary Archive is immediate; only ambiguity/dependency or bulk scope adds review/confirmation. Hard delete remains a separate destructive flow.

# Empty / Loading / Error / Offline States

Every primary screen defines all five state families:

- **Empty-first-use:** explain value and one primary creation/import action.
- **Empty-filtered:** name active query/filters and offer Clear filters without implying no data exists.
- **Loading:** preserve structural placeholders, labels and focus; avoid indefinite unlabelled spinners.
- **Error:** state what failed, what remains safe and a specific Retry/alternate route.
- **Offline/pending:** distinguish cached read-only content, unsaved local input and queued/unsupported actions. MVP does not promise full offline synchronization.

Permission denied, partial image failure and partial import failure are component states rather than full-screen dead ends. Authentication expiry preserves recoverable draft input while asking the user to sign in again. A retry is idempotent from the user's perspective.

# Accessibility

WCAG 2.2 AA is a Phase 2 design constraint and MVP release criterion.

- All actions, dialogs, sheets, filters, calendar dates, galleries and reordering are keyboard-operable with visible focus.
- Drag, swipe, long-press, hover and color always have labeled alternatives.
- Touch targets are at least 44×44 CSS px where practical; destructive and adjacent actions have safe spacing.
- Semantic headings, landmarks, names and error associations follow content hierarchy; dynamic status uses appropriate live announcements.
- Images require meaningful alt text or are decorative; variant label and ImageView meaning are not conveyed only by imagery.
- Text/background and non-text controls meet contrast targets; focus and selected states use more than color.
- Zoom/reflow works to 400% without two-dimensional scrolling for ordinary content; dense desktop tables become cards/lists.
- Reduced motion is respected; skeletons and progress do not flash.
- Calendar and charts have equivalent agenda/table summaries, explicit units, periods and populations.
- Language is neutral: `no recorded wear` instead of claims or shame-based wording.

# Screen Inventory

`Primary` means the strongest action in the current state, not a permanently enabled button. All screens inherit authenticated, loading, error, offline and permission-expired states where relevant.

## MVP screens

| ID  | Screen                     | Purpose / entry                     | Primary content                                                  | Primary / secondary actions                                 | Key states / exit / related                                                          |
| --- | -------------------------- | ----------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| M01 | Welcome & entry choice     | First run                           | privacy promise, contextual start paths                          | `У меня уже есть цифровой гардероб` / `Начать с нуля`, Skip | import recommended only for existing digitized wardrobe; new, resumed; → M15/M02/M03 |
| M02 | Quick item capture         | Onboarding or Create                | image, display name, optional category                           | Save item / More details, Cancel                            | empty, uploading, failed, draft; → M05/M03                                           |
| M03 | Home                       | Global Home                         | resume, quick actions, recent outfits/history/items, one insight | Resume or contextual next action / View all                 | empty, active, pending; → M02/M08/M11/M14                                            |
| M04 | Wardrobe                   | Tab, search links                   | search, filters, active item grid/list                           | Open item / Add, multi-select, clear                        | first-empty, filtered-empty, loading, partial images, offline; → M05/M06             |
| M05 | Item detail                | Card/deep link                      | identity, primary image, variant, status, metadata, wear         | Add to outfit or Log wear / Edit, archive                   | active, archived, incomplete image, historical-only variant; → M06/M09/M12           |
| M06 | Item edit                  | Detail, capture More details        | progressive fields, variants, images                             | Save / Archive, discard                                     | working, saving, validation, conflict; → M05/M07                                     |
| M07 | Image manager              | Edit/gallery menu                   | asset list, ImageView, variant assignment, primary               | Add image / reorder, remove                                 | upload, processing, failed, offline; → M06                                           |
| M08 | Outfit library             | Tab                                 | saved grid, drafts, search/filters                               | Open outfit / New, resume                                   | first-empty, filtered-empty, loading; → M09/M10                                      |
| M09 | Outfit Builder             | Create, item action, edit/duplicate | composition + wardrobe picker                                    | Save / add, replace, remove, discard                        | working, saving, variant-required, conflict/offline; → M10/M08                       |
| M10 | Outfit detail              | Library/deep link                   | composition, title, Wear today, metadata/history                 | Wear today / edit, duplicate, archive                       | active, archived item, duplicate warning; → M09/M12                                  |
| M11 | Activity hub               | Tab                                 | Calendar/Insights switch, recent events                          | Open selected subview / Log wear                            | empty, partial coverage; → M12/M13/M14                                               |
| M12 | Wear composer/event detail | Wear actions, day agenda            | date, snapshot items/variants                                    | Save correction/log / remove, cancel                        | new, duplicate warning, pending, error; → source/M13                                 |
| M13 | Calendar & day agenda      | Activity                            | month plus accessible agenda                                     | Open event or Log wear / change month                       | empty, selected day, loading, offline; → M12                                         |
| M14 | Insights                   | Activity/Home card                  | period, population, coverage, summaries                          | Open evidence / change scope                                | insufficient data, empty period, calculation error; → M04/M12                        |
| M15 | Bulk Import workspace      | Onboarding/Settings/Create          | staged source, group review, issues, preview                     | Continue/Confirm at stage / Save draft, cancel              | provisional, parsing, partial, unresolved, ready, committed; → M16/M04               |
| M16 | Import result/history      | Import completion/Settings          | batch counts and issues                                          | Open Wardrobe / Retry failed, view batch                    | success, partial, failed; → M04/M15                                                  |
| M17 | Archive                    | Settings or filtered domain         | archived items/outfits/variants                                  | Restore selected / inspect                                  | empty, restore dependency, loading; → source detail                                  |
| M18 | Settings                   | Header profile                      | grouped account/data/preferences/help                            | Contextual setting / Export, Delete                         | loading, signed-out recovery; → M19/M20/M15/M17                                      |
| M19 | Export                     | Settings                            | scope summary and job status                                     | Prepare/Download / cancel before job                        | preparing, ready, failed, expired; → M18                                             |
| M20 | Delete account             | Settings                            | impact, retention caveat, identity confirmation                  | Delete account / Export first, cancel                       | re-auth, validation, processing, failed; → signed-out                                |
| M21 | Draft Center               | Home resume/View all                | item/outfit/import drafts by type/date                           | Resume / discard                                            | empty, stale, not-saved warning; → M02/M09/M15                                       |

## V2 screens

| ID   | Screen                              | Purpose / entry            | Primary content                                | Primary / secondary actions         | Key states / exit / related                                |
| ---- | ----------------------------------- | -------------------------- | ---------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| V201 | Assistant (conditional destination) | Optional nav/contextual AI | grounded conversation and draft cards          | Review draft / refine, dismiss      | unavailable, partial grounding, safety refusal; → V202/M09 |
| V202 | AI recommendation review            | Assistant/context action   | owned/candidate separation, reasons, conflicts | Open editable outfit draft / reject | grounded, missing item, stale availability; → M09          |
| V203 | Wishlist                            | Planning                   | candidate cards, source/status filters         | Add candidate / compare             | empty, stale price, offline; → V204                        |
| V204 | Candidate detail                    | Wishlist/purchase check    | provenance, notes, comparison, price record    | Mark purchased / edit, archive      | incomplete source, possible duplicate; → V205              |
| V205 | Purchase conversion review          | Candidate detail           | candidate-to-owned field mapping               | Create owned item / cancel          | duplicate warning, validation, failed; → M05/V204          |
| V206 | Trips                               | Planning                   | upcoming/past trip list                        | New trip / open                     | empty, offline; → V207                                     |
| V207 | Trip packing workspace              | Trip                       | dates, selected/packed/unavailable groups      | Add item / toggle packed, edit      | empty, conflicts, offline queue if approved; → M05         |
| V208 | Availability editor                 | Item/trip                  | time-bound unavailability                      | Save / clear                        | overlap warning, expired                                   | → M05/V207 |

## V3 screens

| ID   | Screen               | Purpose / entry                  | Primary content                                    | Primary / secondary actions         | Key states / exit / related                                     |
| ---- | -------------------- | -------------------------------- | -------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| V301 | Weather outfit brief | Home/Assistant                   | forecast provenance, constraints, grounded outfits | Review outfit / refresh             | provider unavailable, stale weather; → V202/M09                 |
| V302 | Purchase checker     | Candidate/browser-assisted entry | candidate, owned overlap, gap evidence             | Save candidate or dismiss / compare | insufficient source, ambiguous item, AI unavailable; → V204/M04 |
| V303 | Gap analysis         | Insights/Assistant               | coverage assumptions, wardrobe evidence            | Explore evidence / create candidate | insufficient history, disputed assumption; → M14/V204           |
| V304 | AI packing proposal  | Trip                             | editable suggested items and coverage              | Apply reviewed changes / reject     | conflicts, unavailable owned items; → V207                      |
| V305 | AI capture review    | Create                           | proposed metadata with origin/confidence           | Confirm item / edit fields          | low confidence, unsupported image, unavailable AI; → M06        |

# User Flows

Each flow below preserves the current context on recoverable failure. `Cancel` means no committed domain change unless the flow explicitly started from an existing saved entity.

|   # | Flow                          | Trigger and main path                                                                                                                                                    | Branches                                                                                                                                                         | Success                                                                                      | Failure, cancel and recovery                                                                                                                                          |
| --: | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Onboarding                    | First authenticated visit → Welcome → choose context: existing digital wardrobe or start from scratch → follow Bulk Import #2 or capture first item #3 → success choices | Import is recommended for the primary existing-wardrobe user but optional; manual add is a full path; Skip opens empty Home; denied camera allows Files/no image | Imported wardrobe or first owned item exists; next core action is clear                      | Input/review is retained on upload/network failure; Cancel/Skip commits nothing; Resume card restores draft                                                           |
|   2 | Bulk Import (provisional)     | Onboarding/Settings/Create → choose source → prepare → review groups → resolve/skip issues → preview → Confirm → result                                                  | Save review as draft; split/merge proposed physical items; map variant vs ImageView; retry failed subset                                                         | Confirmed items created once and batch result recorded                                       | Parse/write errors identify affected entries; Cancel before confirm creates nothing; retry is idempotent; final rules await source audit                              |
|   3 | Manual add item               | Create → Add item → image/name → optional details → Save                                                                                                                 | Quick save after minimum; More details; add variant via #4; possible duplicate warning allows review/cancel                                                      | Distinguishable active ClothingItem opens                                                    | Validation is inline; upload can retry/remove; unsaved exit offers Keep draft/Discard/Continue                                                                        |
|   4 | Add AppearanceVariant         | Item edit/import review → Add appearance → helper explanation → label → own catalog images/ImageViews → choose default if useful → Save                                  | Label may be initially neutral; camera/files; front/back-only case redirects to ImageView instead                                                                | Variant belongs to same physical item and is selectable in builder                           | Failed media stays retryable; Cancel leaves item unchanged; archived duplicate can be inspected/restored                                                              |
|   5 | Edit item                     | Item detail → Edit → change progressive fields/images/variants → Save                                                                                                    | Archive is separate #19; conflicting remote change offers Reload or Save as reviewed draft                                                                       | Item updates; historical WearEvent snapshots unchanged                                       | Inline validation/retry; Cancel with changes offers Keep draft/Discard; failed save preserves form                                                                    |
|   6 | Find item                     | Wardrobe/Home search → enter terms → scan result → open item                                                                                                             | Suggestions/recent terms; no match offers clear query/Add item; archived search is opt-in                                                                        | Correct item detail opens with query return state                                            | Search error keeps query and Retry; Back returns same scroll/filters; Cancel clears focus only                                                                        |
|   7 | Filter wardrobe               | Wardrobe → open filters/chips → choose criteria → Apply on mobile/result updates on desktop → open item                                                                  | Combine categories/status/attributes; Clear filters preserves search; filtered-empty explains scope                                                              | Results and active-filter summary match chosen criteria                                      | Invalid/unavailable option is explained; Cancel mobile sheet keeps prior applied set; reload restores applied state                                                   |
|   8 | Create outfit from scratch    | Create/Outfits New → empty builder → Add item → search/filter → choose item/variant → repeat/reorder → Save/title                                                        | Incomplete draft allowed; duplicate physical item blocked; archived/unavailable item excluded; Save & Wear may follow                                            | Saved outfit with unique items and chosen variants                                           | Picker/save failures retain composition; exit offers Keep draft/Discard/Continue; resume from Draft Center                                                            |
|   9 | Create outfit from item       | Item detail → Add to outfit → New outfit → builder seeded with item → add others → Save                                                                                  | Choose existing draft instead; multi-appearance item requests variant before seed                                                                                | New saved outfit contains source item/variant                                                | If item becomes unavailable, keep tile and request replace/remove; Cancel returns to item with no saved outfit                                                        |
|  10 | Select AppearanceVariant      | Add multi-appearance item or tap variant label in builder → variant chooser → inspect label/images → Select                                                              | Default preselected but visible; archived variant shown only for historical/edit recovery and requires active replacement for new use                            | OutfitItem stores selected active variant                                                    | Missing images use text label; failure preserves old choice; Cancel leaves previous choice/item uncommitted                                                           |
|  11 | Edit outfit                   | Outfit detail → Edit → add/remove/replace/reorder/change variants/title → Save                                                                                           | Existing wear history remains snapshots; unavailable tile can remain in saved outfit but is flagged                                                              | Saved outfit reflects edits; past events unchanged                                           | Failed save retains draft; Cancel offers Keep draft/Discard; conflict requires explicit review                                                                        |
|  12 | Duplicate outfit              | Outfit detail → Duplicate → builder opens copied composition/title marker → edit → Save                                                                                  | Archived/unavailable members flagged for replace/remove; duplicate physical members normalized or blocked                                                        | New outfit ID is saved; source unchanged                                                     | Save error preserves duplicate draft; Cancel discards/keeps draft; never overwrites source                                                                            |
|  13 | One-tap Wear today            | Outfit detail/Home recent → Wear today → optimistic confirmation                                                                                                         | Same outfit/date warning opens review; Keep both for true multiple wear; View day                                                                                | One WearEvent snapshot on local today; Undo available                                        | Network failure changes to pending/retry and never claims success; Undo removes exact event; Cancel duplicate review creates none                                     |
|  14 | Item-level wear               | Item detail → Log wear → choose variant if needed → optionally add items → date defaults today → Save                                                                    | Can convert selection to saved outfit after logging; duplicate warning; add another item                                                                         | WearEvent snapshot records actual items/variants; physical-item counts update                | Error retains composer; Cancel creates none; Retry does not double count                                                                                              |
|  15 | Backdate wear                 | Calendar past day/Add past wear → composer with selected date → choose outfit/items → Save                                                                               | Multiple events allowed; future date rejected in MVP; ambiguous current outfit reviewed as snapshot                                                              | Event appears on selected historical date                                                    | Date/duplicate validation inline; Cancel returns to same day; failed save retains selections                                                                          |
|  16 | Correct historical wear       | Event detail → Correct → edit date/items/variants → Review → Save                                                                                                        | Delete event is separate strong confirmation; missing/archived entities remain historical labels or may be replaced for correction                               | That event snapshot/counts recalculate; source outfit/items unchanged                        | Failure preserves original event and edit draft; Cancel leaves original; delete Undo restores event when feasible                                                     |
|  17 | Calendar navigation           | Activity → Calendar → change month or agenda → select date → open event                                                                                                  | Empty date offers Log wear; keyboard/agenda alternative; Today shortcut                                                                                          | Desired day/event reached with selection announced                                           | Load failure keeps month shell and Retry; Back restores selected month/day; leaving cancels no data                                                                   |
|  18 | Insight to action             | Home/Insights → choose period/population → open card → view exact items/events → take manual action                                                                      | Insufficient coverage explains limitation; no-recorded-wear can filter wardrobe; action may be archive/edit/log                                                  | Evidence is inspectable and chosen action completes through its own flow                     | Calculation error retains scope and offers Retry/direct data views; Back preserves scope; no automatic action                                                         |
|  19 | Archive item                  | Item detail/edit → single ordinary Archive applies immediately → show Undo                                                                                               | Unusual dependency/ambiguity opens focused review and choice; bounded multi-select uses bulk preview + Confirm; saved outfits/history are preserved              | Item leaves active pickers; history/outfits remain intact; exact ordinary action is undoable | Failure leaves active; canceling dependency review/bulk preview changes nothing; Undo restores prior active state; hard delete is a separate strong-confirmation flow |
|  20 | Restore item/variant          | Archive → inspect entity → Restore → dependency check → Confirm if parent also needs restore                                                                             | Restore variant plus archived physical item together; outfit restore does not auto-restore items                                                                 | Entity returns to active selection with identity/history intact                              | Failure remains archived with Retry; Cancel retains archive state; dependency choice is reversible                                                                    |
|  21 | Export                        | Settings → Export → review scope/image inclusion → Prepare → leave or wait → Ready → Download                                                                            | Retry expired/failed job; images optional if policy supports; notification/status return                                                                         | Dated export is downloadable; no data changed                                                | Failure shows reason/retry; Cancel before preparation stops request where possible; expired job can regenerate                                                        |
|  22 | Delete account                | Settings → Delete account → impact/retention info → optional Export first → re-auth → confirmation phrase → final Delete                                                 | Re-auth recovery; export opens #21 then returns; policy caveats remain explicit                                                                                  | Account deletion request accepted and signed-out/completion state shown                      | Any failure leaves account active; Cancel at any pre-final step; support/retry path without silent partial claim                                                      |
|  23 | AI stylist (future)           | Contextual Suggest/Assistant → state intent → grounded tool review → recommendations → open chosen editable draft → Save                                                 | AI unavailable uses manual builder; exclude unavailable/non-owned; clarify only material ambiguity                                                               | User-confirmed saved outfit; recommendation provenance retained as appropriate               | Unsupported claim/low grounding is labeled or refused; Cancel saves nothing; retry/refine keeps user intent                                                           |
|  24 | Wishlist to purchase (future) | Candidate detail → Mark purchased → compare possible duplicates → review carried fields → confirm → create owned item                                                    | Link to existing owned duplicate; edit ownership date/price; keep/archive candidate provenance                                                                   | New or linked owned ClothingItem, never silent status flip                                   | Failure leaves candidate unchanged and draft recoverable; Cancel commits nothing; duplicate can be inspected                                                          |
|  25 | Packing (future)              | Trip → packing workspace → add owned items/search → mark selected/packed → use list                                                                                      | Unavailable conflicts; same item in multiple trips allowed; AI proposal routes through #26-like review                                                           | Trip-scoped list/state saved; item lifecycle unchanged                                       | Offline behavior follows approved later scope; failed change remains pending/retry; Cancel editor preserves prior saved list                                          |
|  26 | Purchase checker (future)     | Candidate/product input → request check → show source quality, owned overlap and gap evidence → compare → Save candidate or dismiss                                      | Insufficient evidence asks for details/manual comparison; possible duplicate opens item; AI unavailable allows manual wishlist entry                             | Explicit user decision recorded; no owned item auto-created                                  | Failure preserves provided link/details; Cancel makes no change; Retry does not duplicate candidate                                                                   |

# Content Hierarchy

The order below is also the default reading and focus order; responsive layouts may reposition controls visually without changing meaning.

| Screen              | Ordered content hierarchy                                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                | identity/global status → resumable draft/pending problem → primary quick actions → recent outfits → recent wear → recent items → one explainable insight → all-domain links              |
| Wardrobe            | title/count → search → active-filter summary/chips → sort/view controls → results → continuation/loading → Add item                                                                      |
| Item detail         | display name/status → primary/variant image and label → Add to outfit/Log wear → edit/archive actions → key attributes → image views → outfit references → recorded wear summary/history |
| Item edit           | save/status → required identity → images → AppearanceVariants → core metadata → lifecycle/purpose → notes → archive action                                                               |
| Outfit library      | title/New → drafts → search/filter/sort → favorites/recent → results → archive link                                                                                                      |
| Outfit Builder      | save/draft status → title → composition and variant labels → add/replace/reorder controls → picker search/filters/results → notes/occasion/season → Save/Discard                         |
| Outfit detail       | composition/title/status → Wear today → edit/duplicate/archive → selected variants → attributes/notes → recorded wear → event history                                                    |
| Wear composer/event | date/action status → snapshot composition/variants → add/remove/correct controls → duplicate warning → Save/Delete → provenance/details                                                  |
| Calendar            | Calendar/Insights switch → month/date controls → month grid → selected-day agenda → Log wear → legend/help                                                                               |
| Insights            | period/population → coverage → headline summaries → detail groups/rankings → evidence links → manual actions/method note                                                                 |
| Bulk Import         | stage/progress → stage-specific instruction → group/issues workspace → selection summary → Back/Continue or Confirm → save/cancel help                                                   |
| Settings            | account/privacy → data/export/import/archive → preferences/accessibility → help/about → delete account                                                                                   |

# Low-Fidelity Wireframes

These are structural wireframes, not pixel designs. `[P]` is primary action; `[S]` is secondary; `(status)` is persistent feedback.

## Mobile — Home

```text
Empty / first use:
┌──────────────────────────────┐
│ AI Wardrobe        [Profile] │
│ Bring in your wardrobe       │
│ [P У меня уже есть цифровой  │
│    гардероб → Import]        │
│ [Начать с нуля → Add item]   │
│ Private by default           │
└──────────────────────────────┘

Returning / working wardrobe:
┌──────────────────────────────┐
│ AI Wardrobe        [Profile] │
│ (Offline / pending if needed)│
├──────────────────────────────┤
│ Resume outfit draft   [Open] │  shown only when relevant
├──────────────────────────────┤
│ [Add item] [Create outfit]   │
│ [Log wear]                   │
├──────────────────────────────┤
│ Recent outfits        See all│
│ [card] [card] [card]         │
│ Recent wear           See all│
│ 14 Sep · Outfit name         │
│ Recent items          See all│
│ [item] [item] [item]         │
│ Insight · 30 days     [View] │
├──────────────────────────────┤
│ Home Wardrobe Outfits Activity│
│             [+ Create]       │
└──────────────────────────────┘

Repeat Import: Create when contextual, or Profile → Settings → Data / Import.
```

## Mobile — Wardrobe and filters

```text
┌──────────────────────────────┐
│ Wardrobe · 128        [View] │
│ [ Search wardrobe…         ] │
│ [Category] [Season] [Filters]│
│ 3 filters · [Clear filters]  │
├──────────────────────────────┤
│ [img] Black coat     [img] … │
│ [img] Blue shirt     [img] … │
│ Loading… / [Load more]       │
├──────────────────────────────┤
│ tabs…              [+ Create]│
└──────────────────────────────┘

Filter sheet (full height):
│ Filters              [Close] │
│ Category …                   │
│ Season …                     │
│ Status …                     │
│ [Reset]        [P Apply · 24]│
```

## Mobile — Item detail / edit

```text
┌──────────────────────────────┐
│ [Back] Item name      [More] │
│ [      primary image       ] │
│ Appearance: Navy side [v]    │
│ [P Add to outfit] [Log wear] │
│ Category · Color · Season    │
│ Images: Front Back Detail    │
│ In 4 outfits · 7 recorded wears│
└──────────────────────────────┘

Edit:
│ [Cancel] Edit item [Save]    │
│ (Saved just now)             │
│ Name* / Images               │
│ Appearances                  │
│  Navy side [Edit]            │
│  Pattern side [Edit]         │
│  [+ Add appearance]          │
│ Details / Lifecycle / Notes  │
│ [Archive item]               │
```

## Mobile — Outfit Builder / detail

```text
┌──────────────────────────────┐
│ [Close] New outfit    [Save] │
│ (Saving…)                    │
│ [tile variant] [tile] [+]    │  composition
│ [P Add item]                 │
│ Title / occasion / notes     │
├── picker sheet ──────────────┤
│ [Search…] [Filters]          │
│ [item +] [item +] [item +]   │
└──────────────────────────────┘

Detail:
│ Outfit title        [Favorite]│
│ [composition with labels]    │
│ [P Wear today]               │
│ [Edit] [Duplicate] [Archive] │
│ 7 recorded wears · [History] │
```

## Mobile — Activity, Calendar and Insights

```text
┌──────────────────────────────┐
│ Activity                     │
│ [Calendar] [Insights]        │
│ ‹  September 2026  › [Agenda]│
│ Mo Tu We Th Fr Sa Su         │
│  .  1  2• 3  4  5  6        │
│ ...                          │
│ Sat, 14 Sep · 2 events       │
│ [snapshot] 09:00       [Open]│
│ [snapshot] 18:00       [Open]│
│ [P Log wear]                 │
└──────────────────────────────┘

Insights variant:
│ [30 days v] [Active items v] │
│ Coverage: records since …    │
│ Most recorded          [Open]│
│ No recorded wear       [Open]│
│ Category distribution [Table]│
```

## Mobile — Bulk Import and Settings

```text
Import:
│ [Close] Review import  3 of 6│
│ ███████░░                    │
│ 42 proposed · 5 need review  │
│ [group] Physical item        │
│  images · views · variants   │
│  [Edit grouping] [Skip]      │
│ [Back]       [P Continue]    │
│ Save draft · Cancel import   │

Settings:
│ Settings                     │
│ Account & privacy          › │
│ Data: Export / Import      › │
│ Archive                    › │
│ Preferences               › │
│ Accessibility             › │
│ Help & about              › │
│ Delete account            › │
```

## Desktop — application shell and Wardrobe

```text
┌───────────────┬──────────────────────────────────────────┐
│ AI Wardrobe   │ Wardrobe · 128            [P + Create]  │
│ Home          │ [Search________________] [Sort] [View]   │
│ Wardrobe      ├──────────┬───────────────────────────────┤
│ Outfits       │ Filters  │ [card] [card] [card] [card]  │
│ Activity      │ Category │ [card] [card] [card] [card]  │
│  Calendar     │ Season   │ [card] [card] [card] [card]  │
│  Insights     │ Status   │ Load more / result status     │
│───────────────│ [Clear]  │                               │
│ Import        │          │                               │
│ Archive       │          │                               │
│ Settings      │          │                               │
└───────────────┴──────────┴───────────────────────────────┘
```

## Desktop — Outfit Builder

```text
┌───────────────┬───────────────────────┬──────────────────┐
│ Global nav    │ Composition           │ Item picker      │
│               │ New outfit (Saved)    │ [Search_______]  │
│               │ [tile] [tile] [+]     │ filters/sort     │
│               │ roles + variants      │ [item +] [item +]│
│               │ title/occasion/notes  │ [item +] [item +]│
│               │ [Discard] [P Save]    │ result status    │
└───────────────┴───────────────────────┴──────────────────┘
```

## Desktop — Bulk Import review

```text
┌───────────────┬──────────────────────────────────────────┐
│ Steps         │ Review groups · 42 proposed             │
│ ✓ Source      │ [All] [Needs review 5] [Skipped 2]      │
│ ✓ Prepare     ├───────────────────────────┬──────────────┤
│ • Review      │ groups/table/cards        │ Selected     │
│   Issues      │ item ID · name · images   │ grouping     │
│   Preview     │ variant/view warnings     │ edit panel   │
│   Confirm     │                           │              │
│               │ [Save draft] [Back] [P Continue]         │
└───────────────┴───────────────────────────┴──────────────┘
```

# Responsive Behavior Matrix

| Area              | Mobile / narrow                                                                | Tablet                                        | Desktop / wide                                   | Invariant                                                       |
| ----------------- | ------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Global navigation | 4-tab bottom bar + separate Create; Settings in header                         | bottom bar or compact rail by available width | persistent left sidebar + Create                 | same destinations, labels and current-location state            |
| Home              | single column; horizontal recent rails with See all                            | two-column sections where meaningful          | bounded two/three-column dashboard               | resume/error precedes discovery; no hidden core action          |
| Wardrobe          | 2-column grid default; filters in staged full-height sheet                     | 3-column grid; filter drawer                  | 4–6-column grid/list with persistent filter rail | query/filter summary and result semantics identical             |
| Item detail/edit  | stacked sections; sticky safe-area primary action only when helpful            | image + facts may split                       | image/gallery left, content/actions right        | reading order remains identity → action → detail → history      |
| Outfit library    | 2-column cards                                                                 | 3-column cards                                | 3–5-column cards/list                            | draft and archived distinctions preserved                       |
| Outfit Builder    | composition above; picker expandable bottom sheet                              | composition with overlay/side drawer          | composition main pane + persistent picker        | selected items/variants and save state always visible/reachable |
| Calendar          | month plus day agenda below; agenda switch prominent                           | month and agenda split if space               | month grid + day agenda side panel               | factual events only; full non-visual date/event access          |
| Insights          | stacked cards and data tables on demand                                        | two-column cards                              | summary row + detail panels                      | period/population/coverage never separated from figures         |
| Bulk Import       | one stage at a time; group cards; sticky Continue                              | steps + main review, detail drawer            | step rail + group workspace + detail pane        | selection/counts/draft state survive layout changes             |
| Dialogs/forms     | full-screen sheet for complex tasks; simple alerts only for short confirmation | modal/drawer sized to task                    | modal or side panel, never hover-only            | focus trap/return, Escape/Cancel, error association             |
| Data collections  | continuous reveal with accessible Load more fallback                           | same                                          | pagination or Load more when scale requires      | stable focus/scroll and explicit end/result count               |
| Images            | responsive thumbnails; tap opens gallery                                       | larger preview                                | hover may supplement, never replace controls     | alt/label, aspect handling, variant/ImageView text              |

# UX Risks

| Risk                                          | UX consequence                             | Mitigation / validation                                                                                             |
| --------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Create action competes with four destinations | accidental or hidden creation              | test placement/safe-area reach; keep textual Create label where space allows                                        |
| Home becomes a dashboard dump                 | core loop loses priority                   | cap each preview; show only one insight and one resume issue                                                        |
| Variant and ImageView are confused            | duplicate items and wrong outfit snapshots | helper examples, explicit labels, import review and variant-required chooser                                        |
| Mobile filters feel slow or surprising        | abandonment and lost context               | instant high-frequency chips; staged advanced sheet with result count and Apply                                     |
| Image-first grids become inaccessible/slow    | key content unavailable                    | names/status always textual, alt text, progressive loading and list option                                          |
| Autosave appears to publish work              | incomplete outfits/items treated as final  | separate `Saved draft` from explicit Save/Confirm; persistent status vocabulary                                     |
| One-tap wear double-counts                    | corrupt statistics                         | local-date duplicate review, exact Undo and idempotent retry behavior                                               |
| Historical corrections mutate source outfit   | history becomes untrustworthy              | event snapshot editor explicitly detached from current outfit                                                       |
| Analytics overstates incomplete data          | false declutter decisions                  | coverage/window/population labels and evidence drill-down                                                           |
| Import review overwhelms activation           | user abandons before value                 | staged issues-first review, skippable entries, draft resume; validate after source audit                            |
| Archive and delete are conflated              | unintended data loss                       | ordinary archive immediately + Undo; dependency review; bulk preview; hard delete separate with strong confirmation |
| Future AI colonizes navigation                | manual core becomes secondary              | contextual-first AI; Assistant tab only after recurring workflow evidence                                           |
| Desktop and mobile diverge semantically       | relearning and inconsistent outcomes       | shared IA, terminology, state model and content order across breakpoints                                            |
| Dense calendar/charts exclude users           | inaccessible history/insights              | agenda/table equivalents and full keyboard navigation                                                               |

# Open UX Questions

Open Questions are retained as gates; Phase 2 does not convert them into unreviewed architecture decisions.

## Must resolve in the explicit Bulk Import addendum or Phase 3 terminology review

1. Complete the mandatory real-source audit before declaring detailed Bulk Import UX final: item IDs, photographs, catalog images, front/back, AppearanceVariants, usage notes, naming conventions and possible duplicates; also verify whether historical wear data exists.
2. Keep `Activity` as the working IA label for Calendar + Insights. During Visual Design / terminology review compare at minimum `Активность`, `История` and `Журнал`; changing the localized label must not change the IA.
3. Test the AppearanceVariant helper copy with the known reversible item and at least one ordinary front/back-only item.

## Must resolve before technical architecture

1. How individual hard deletion preserves referential and historical integrity before full account deletion.
2. How physical sets are represented when components can be worn independently; this may change add/edit and builder affordances.
3. Whether future AI conversation history exists by default or only explicitly saved recommendations, because that changes privacy surfaces.
4. Whether a whole import batch can be reversed after dependent outfits/WearEvents exist; Phase 2 currently guarantees pre-confirm cancel and partial retry, not post-dependency rollback.

## Must resolve before MVP implementation or release validation

1. Final supported device/browser/network matrix, including installed PWA and constrained mobile network scenarios.
2. Operational-data and backup deletion scope/SLA, so Delete Account copy can be exact.
3. Source-audit-derived import contract, size/format constraints, mapping cases and representative acceptance fixture.
4. Final localization terminology for Physical Item, AppearanceVariant, ImageView, `no recorded wear`, Archive and WearEvent actions; the Activity parent-label comparison is tracked above for Phase 3.

## Can remain deferred

1. Approved AI providers, data regions, cost/latency targets and detailed AI retention controls until AI V2 gates.
2. Full offline capture and queued wear until V2 usage evidence justifies the synchronization complexity.
3. Whether Assistant merits a permanent fifth mobile destination; contextual AI is the default until repeated use is proven.
4. Detailed Wishlist, Trips, weather, purchase-checker, gap-analysis and AI-packing interactions beyond the lower-fidelity future flows in this document.

# Phase 2 Acceptance Criteria

- [x] IA separates owned wardrobe, saved outfits, factual activity, utilities and future planning/AI domains.
- [x] Mobile MVP navigation, desktop navigation and V2/V3 evolution are explicit without making the bottom bar an action dump.
- [x] Home has a prioritized strategy for first use, continuation, pending work and habitual actions.
- [x] Wardrobe, search/filtering, item detail/edit, AppearanceVariant and image-management UX are specified.
- [x] Minimal MVP AppearanceVariant creation/import, catalog images/ImageViews, builder selection and history-safe behavior are explicit.
- [x] Outfit Library, Builder and Detail cover scratch/from-item/edit/duplicate/replace/reorder/variant/draft workflows on mobile and desktop.
- [x] Wear today, item-level/backdated wear, duplicate protection, correction and deletion recovery are specified.
- [x] Calendar contains actual WearEvents only and has accessible month/agenda behavior.
- [x] Insights state period, population, coverage and evidence drill-down; unknown is not zero.
- [x] Archive/restore, Settings, export and account deletion are distinct and have proportional confirmation.
- [x] Onboarding and provisional Bulk Import flows are complete enough for UX review, with final import details gated by source audit.
- [x] Future AI, Wishlist and Packing surfaces remain lower-fidelity and do not distort the MVP IA.
- [x] A shared draft, confirmation, feedback, empty/loading/error/offline and accessibility model is defined.
- [x] Screen inventory is separated into MVP/V2/V3 and records entry, content, actions, states, exits and related screens.
- [x] All 26 required flows include triggers, steps, branches, success, failure, cancel and recovery behavior.
- [x] Content hierarchy, mobile/desktop textual wireframes and responsive behavior matrix are present.
- [x] UX risks and unresolved questions are categorized by decision gate.
- [x] No database schema, API contract, security architecture, framework, pixel UI or design system has been selected.
- [x] Phase 3 has not started.

# Phase 2 Self-Review

The document was checked against the approved Phase 1 boundaries and the Phase 2 brief.

- **Contradictions:** none intentionally introduced. Calendar remains factual; AI remains non-foundational; archive remains history-safe; AppearanceVariants remain within one physical item.
- **Missing states:** primary modules include first-empty, filtered-empty, loading, error and offline/pending treatment; specialized permission, partial-media, duplicate and conflict states are called out.
- **Navigation overload:** MVP keeps four destinations and one distinct Create action. Settings/Archive/Import remain utilities; Wishlist/Trips remain future Planning; AI earns a destination only through demonstrated recurrence.
- **Feature creep:** V2/V3 surfaces are described only far enough to protect IA and handoffs. No implementation or universal variant-management system is specified.
- **Historical integrity:** outfit edits, item/variant archive and event correction explicitly preserve WearEvent snapshots.
- **Mobile/desktop consistency:** layout changes but terminology, action outcomes, focus order and data meaning remain aligned.
- **Accessibility:** non-pointer alternatives, focus/status behavior, calendar/chart equivalents, touch sizing, reflow and neutral language are included as constraints rather than later polish.
- **Provisional import honesty:** unverified file, threshold and mapping assumptions were deliberately excluded; the mandatory source-audit gate remains open.

Result: the Phase 2 UX/IA package is approved and complete. The listed open questions remain gated to their later reviews, and detailed Bulk Import UX still requires the explicit Source Audit addendum; neither condition blocks approval of the rest of Phase 2.
