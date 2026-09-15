# AI Wardrobe — Visual Design / Design System

**Phase:** 3 — Visual Design / Design System  
**Status:** Approved / Complete  
**Baseline:** Approved PRD, UX and Decisions D-001–D-042  
**Date:** 2026-09-14

# Design Vision

AI Wardrobe follows **quiet editorial utility**: fashion-editorial whitespace and image confidence, premium-commerce care for product imagery, and the clarity of a modern utility app.

The interface behaves like a calm private gallery that becomes operational exactly where the user needs to act. Premium quality comes from proportion, alignment, typography, image consistency and precise feedback—not ornamental serif type, glossy gradients or oversized elevation. Real clothing remains the visual hero; UI chrome recedes until an action or state needs attention.

The visual direction explicitly avoids generic AI SaaS, cyber/neon effects, glassmorphism, social-feed conventions, card nesting and luxury clichés. Future AI uses the same system and appears as a labeled assistive state, never as a chatbot skin applied to the whole product.

# Brand Personality

| Trait           | Visual and interaction effect                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| **Calm**        | Low-chroma neutrals, one accent, restrained motion, controlled density and no competing primary actions       |
| **Precise**     | Strong alignment, stable aspect ratios, explicit labels, tabular numerals and exact state feedback            |
| **Editorial**   | Deliberate whitespace, image-led composition and confident type hierarchy without magazine-scale headlines    |
| **Personal**    | Real wardrobe imagery, warm canvas and plain human wording; no marketplace or social signals                  |
| **Trustworthy** | Factual language, visible coverage/provenance, honest pending/error/draft states and predictable confirmation |
| **Tactile**     | Clear pressed/selected feedback, modest radii and physical-feeling sheets without decorative skeuomorphism    |
| **Intelligent** | Evidence is visually adjacent to conclusions; future AI is quiet, contextual and explicitly labeled           |

# Visual Principles

1. **Clothing is the hero.** Give garments the largest high-contrast visual area; accent and chrome stay subordinate.
2. **Quiet does not mean faint.** Text, focus, controls and state boundaries meet accessibility contrast even on soft neutrals.
3. **One dominant action per local context.** Hierarchy comes from position, label and fill—not oversized scale.
4. **Surfaces express structure.** Prefer whitespace, grouping and 1px borders; use elevation only for actual layering.
5. **Image-first, never image-only.** Every garment, appearance, outfit and event keeps a textual identity.
6. **Editorial, not theatrical.** Use composition and spacing for character; avoid giant heroes, serif decoration and fashion-magazine ambiguity.
7. **State is visible without alarm.** Draft, saving, archived, processing, error and future AI suggestion use a consistent icon + label + surface vocabulary.
8. **Responsive means related.** Mobile and desktop share proportions, tokens, hierarchy and outcomes while changing density and container behavior.
9. **Motion explains change.** Short transitions connect cause and effect; reduced motion preserves the same information instantly.
10. **Facts look different from suggestions.** Actual wear, confirmed records, imported/unreviewed data and future AI drafts are never visually conflated.

# Color System

## Accent directions considered

| Direction              |     Candidate | Strength                                                                          | Risk                                                           |
| ---------------------- | ------------: | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Muted olive            |     `#65704D` | Warm, fashion-aware, natural with off-white                                       | Can feel military and overlap with warning/earth-tone garments |
| Deep blue-grey         |     `#465E70` | Trustworthy and highly legible                                                    | Colder and closer to conventional productivity/SaaS products   |
| **Deep mineral green** | **`#3E6658`** | Calm, distinctive, tactile and compatible with warm neutrals and diverse garments | Must not become a large decorative brand field                 |

**Decision:** use deep mineral green `#3E6658`. It is reserved for primary interaction, selection and branded focus—not large backgrounds or decorative gradients. Photography supplies most of the color.

## Foundation palette

| Semantic role    |     Value | Usage                                                          |
| ---------------- | --------: | -------------------------------------------------------------- |
| Canvas           | `#F8F7F3` | Default page background; warm gallery field                    |
| Elevated surface | `#FFFFFF` | Sheets, dialogs, sticky bars and image mats needing separation |
| Muted surface    | `#F1F0EB` | Image wells, grouped controls, skeletons and quiet sections    |
| Selected surface | `#E7EFEA` | Selected rows/cards/chips together with border/icon cues       |
| Text primary     | `#1F2321` | Headings, body and critical facts                              |
| Text secondary   | `#59615D` | Supporting copy and metadata                                   |
| Text tertiary    | `#6B736F` | De-emphasized non-critical text, at 14px or larger             |
| Text disabled    | `#858B88` | Disabled labels only; never essential information              |
| Text inverse     | `#FFFFFF` | On sufficiently dark interactive/status fills                  |
| Border subtle    | `#DADDD8` | Passive separation, never the sole control boundary            |
| Border strong    | `#858D89` | Input/control boundary and high-emphasis divider               |
| Focus            | `#31594B` | 2–3px outer indicator with offset and shape cue                |

## Interactive colors

| Role            |     Value | Rule                                                |
| --------------- | --------: | --------------------------------------------------- |
| Accent/default  | `#3E6658` | Primary button, selected indicator, key link        |
| Accent hover    | `#35594D` | Pointer hover only; label/state remains available   |
| Accent pressed  | `#2C4C42` | Pressed/active feedback                             |
| Accent muted    | `#E7EFEA` | Selected background or quiet callout                |
| Accent disabled | `#B8C3BE` | Disabled fill with disabled text; no action implied |

## Semantic colors

| State       | Foreground |   Surface | Required companion                                              |
| ----------- | ---------: | --------: | --------------------------------------------------------------- |
| Success     |  `#2F6B4F` | `#E7F2EB` | check icon + specific result text                               |
| Warning     |  `#795B00` | `#FFF4CC` | warning icon + required choice/impact text                      |
| Error       |  `#A23434` | `#FCE9E9` | error icon + recovery action; approximately 5.8:1 text contrast |
| Information |  `#365F7B` | `#EAF2F7` | info icon + explanatory label                                   |

## Accessibility rules

- Primary text on Canvas is approximately 14.8:1; secondary approximately 6:1; tertiary is at least 4.5:1 for normal-size text.
- White text on the chosen accent is approximately 6.5:1. Accent hover/pressed only increase contrast.
- Focus is a 2px minimum high-contrast outer ring with 2px offset; it is never replaced by a subtle border-color change.
- Informational tints are backgrounds only. Semantic foreground supplies readable text/icon contrast.
- Selected, favorite, archived, error and chart states always add shape, icon, pattern or label; hue is never the only cue.
- Disabled content is exempt only when it is genuinely unavailable and non-essential; read-only content uses normal text contrast.
- Photography is never used directly behind text unless a solid/scrim treatment produces verified contrast; catalog UI defaults to separate text surfaces.

# Light / Dark Mode

MVP is **light-only**. The warm light canvas best preserves consistent judgment of catalog photography, matches white/transparent source assets and limits the visual/state QA surface.

Dark mode is deferred, not rejected. Future evaluation must retest every garment mat, transparent asset, semantic status, shadow, image placeholder and contrast pair. The product may expose a future System theme after those assets exist; Phase 3 does not promise it. Reduced motion and OS/browser high-contrast preferences are respected independently of theme.

# Typography

## Strategy

Use **Manrope** as the single product family, with the platform sans-serif stack as fallback. Its neutral geometry, open forms and Cyrillic support keep the product modern without making it a corporate dashboard or fashion masthead. One family prevents visual fragmentation; hierarchy comes from size, weight, line height and spacing.

Use sentence case. Do not use all-caps labels, artificially wide tracking or decorative italics. Counts, dates, money and analytics use tabular numerals. Main body, actions, form labels, instructions, errors and critical state text are never set below 14px. Caption remains limited to short supplemental metadata.

Short persistent navigation labels use a dedicated **Navigation Label** token at 12–13px; they never borrow Caption. This is a narrow exception allowed only when every label is paired with its persistent icon and complete textual identity, rendered at sufficient weight/contrast and able to scale under browser/text zoom. Validate the complete dock at 320px, 360px, 375px, 200% zoom and 400% reflow. If Manrope or the Russian labels fail, increase type or change geometry; never solve it with unclear abbreviations.

## Semantic scale

| Token            | Compact size / line               | Wide size / line | Weight | Usage                                                                           |
| ---------------- | --------------------------------- | ---------------- | -----: | ------------------------------------------------------------------------------- |
| Display          | 34 / 40                           | 40 / 48          |    600 | First-use statement or one editorial insight; never routine page chrome         |
| H1               | 28 / 36                           | 32 / 40          |    600 | Page title and item/outfit identity                                             |
| H2               | 24 / 32                           | 24 / 32          |    600 | Major page section                                                              |
| H3               | 20 / 28                           | 20 / 28          |    600 | Component group, sheet/dialog title                                             |
| Body large       | 18 / 28                           | 18 / 28          |    400 | Introductory copy and selected facts                                            |
| Body             | 16 / 24                           | 16 / 24          |    400 | Default content and forms                                                       |
| Small            | 14 / 20                           | 14 / 20          |    400 | Metadata and secondary descriptions                                             |
| Caption          | 12 / 16                           | 12 / 16          |    500 | Non-essential timestamp, compact count, image view label                        |
| Label            | 14 / 20                           | 14 / 20          |    600 | Field/control/card labels                                                       |
| Navigation label | 12 / 16 compact; 13 / 16 standard | 13 / 16          |    600 | Short persistent destination/action identity paired with an icon; never Caption |
| Button           | 15 / 20                           | 15 / 20          |    600 | Action labels                                                                   |
| Numeric feature  | 32 / 36                           | 40 / 44          |    600 | One insight value with adjacent period/population                               |

Limit a module to two visibly prominent type sizes. Long-form settings/help content uses a 680–720px reading width. Truncation never removes the only identity: cards use one-line name with an accessible full label; detail screens show the full name.

# Spacing

Use an 8px base rhythm with 4px intermediates only for optical correction and compact relationships.

| Token      | Value | Typical use                                        |
| ---------- | ----: | -------------------------------------------------- |
| `space.1`  |     4 | icon/text optical gap, status internals            |
| `space.2`  |     8 | tight control internals, related metadata          |
| `space.3`  |    12 | card grid gap, chip gap                            |
| `space.4`  |    16 | compact page margin, field stack, card padding     |
| `space.6`  |    24 | control group, medium gutter                       |
| `space.8`  |    32 | ordinary section gap                               |
| `space.10` |    40 | mobile major section / desktop module gap          |
| `space.12` |    48 | desktop section gap, spacious hero/action division |
| `space.16` |    64 | large page-zone separation                         |
| `space.20` |    80 | rare first-use/editorial separation                |

- Mobile page margin: 16px; card gap: 12px; field gap: 16px; section gap: 32–40px.
- Tablet page margin/gutter: 24px; section gap: 40px.
- Desktop outer margin: 32–48px; grid gutter: 24px; section gap: 40–64px.
- Density increases by adding grid columns and using available width—not by shrinking type, 44px touch targets or essential whitespace.

# Layout Grid

Breakpoints are conceptual behavior ranges, not framework names.

| Range                   | Grid                 | Margins / gutters | Primary behavior                                                      |
| ----------------------- | -------------------- | ----------------- | --------------------------------------------------------------------- |
| Compact, below ~600px   | 4 columns            | 16px / 12px       | single flow, 2-column wardrobe, full-height sheets, bottom navigation |
| Medium, ~600–1023px     | 8 columns            | 24px / 16–24px    | 3-column wardrobe, split detail where useful, drawer/rail transition  |
| Wide, ~1024px and above | 12 columns + sidebar | 32–48px / 24px    | persistent 240px sidebar, 4–6-column wardrobe, multi-pane workspaces  |

Main content is capped near 1400px and centered within the shell. Standard collection content prefers 1180–1280px. Reading/forms use 640–720px. Item detail uses up to 1200px. Builder and Import may use the full 1400px because the approved UX requires simultaneous composition/workspace and picker/detail regions.

The desktop sidebar is outside the main content grid. At constrained wide widths it may collapse from 240px to 72px while preserving icon names, active state and keyboard access. Mobile safe-area insets are added to bottom navigation/sheets and never subtract from the 44px control target.

# Radius

| Token         | Value | Usage                                                               |
| ------------- | ----: | ------------------------------------------------------------------- |
| `radius.sm`   |   8px | inputs, compact controls, thumbnails                                |
| `radius.md`   |  12px | cards, buttons, image wells, status surfaces                        |
| `radius.lg`   |  16px | hero media, sheets, drawers, dialogs                                |
| `radius.full` |  full | filter chips, compact status badges, avatar, segmented control only |

Do not nest equal rounded containers. A card inside a section loses its own shell unless it is independently actionable. Full-pill geometry is semantic, never the default brand shape.

# Borders & Elevation

| Level   | Treatment                                       | Use                                                        |
| ------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Flat    | no shadow; optional 1px subtle border           | page sections, cards on canvas, image wells                |
| Raised  | 1px border + `0 1px 2px` soft 6% neutral shadow | sticky header/bar and actionable card on same-color canvas |
| Overlay | `0 8px 24px` soft 10% shadow + border           | menu, picker sheet, popover                                |
| Modal   | `0 16px 40px` soft 14% shadow + scrim           | confirmation/review dialog only                            |

Shadows express z-order and must disappear when the layer closes. Cards are not permanently floated. Scrims are neutral graphite at 32–44% opacity and do not replace focus trapping or clear close actions.

# Iconography

Use one rounded-outline set with a consistent 1.75px stroke. Sizes are 16px inline, 20px in controls, 24px in navigation and at most 28px in quiet empty states. Filled icons are limited to selected Favorite and, when useful, the selected bottom-nav glyph; active navigation also has label weight and a shape indicator.

| Concept       | Visual rule                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Favorite      | outline heart → filled heart; always accessible label/state                                    |
| Archive       | box/tray with downward arrow; never trash can                                                  |
| Edit          | pencil with text in critical contexts                                                          |
| Delete        | trash only inside explicitly destructive flow; error color + text                              |
| Add/Create    | plus; Create launcher has visible or programmatic action name                                  |
| Camera        | literal camera; file/photo alternatives remain textual                                         |
| Filter/Search | conventional funnel/magnifier with active-count/text cue                                       |
| Calendar      | calendar outline; selected destination also has label/indicator                                |
| Outfit        | layered garment silhouettes, not magic sparkles                                                |
| Wardrobe      | hanger or wardrobe-door outline, tested at 20/24px                                             |
| Future AI     | restrained wand/assistant glyph paired with `AI‑предложение`; never ambient sparkle decoration |

Icons never carry the sole meaning of a destructive action, status or appearance. Tooltips supplement labels on desktop collapsed navigation; they do not fix missing accessible names.

# Image System

## Principles

- Preserve the complete garment. Default catalog presentation uses contain, never automatic edge-to-edge crop.
- Use a consistent warm-neutral image mat so white, transparent and inconsistent source backgrounds coexist calmly.
- Crop only after explicit user framing; the uncropped source remains reachable according to approved image semantics.
- Garment identity is carried by image + display name; variant and ImageView labels remain text.
- Progressive loading reserves final geometry, preventing layout shift.

## Ratios and fit

| Context                    | Ratio                                            | Fit / padding               | Rationale                                                                     |
| -------------------------- | ------------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------- |
| Wardrobe Clothing Card     | 4:5                                              | contain; 8–12% safe padding | Fashion/product proportion with enough height for coats, trousers and dresses |
| Item Detail hero           | 4:5 compact; adaptive 4:5 or square wide         | contain; 6–10%              | Preserves evidence and lets desktop gallery use available pane                |
| Outfit composition tile    | 1:1 visual zone with internal role-aware contain | 8–14%                       | Stable collage geometry across different garment shapes                       |
| Gallery / picker thumbnail | 1:1                                              | contain; 8%                 | Fast scanning and stable rows                                                 |
| Source-photo viewer        | intrinsic within bounded stage                   | contain, no forced crop     | Shows the actual asset and its framing                                        |

Shoes, bags and small accessories may occupy less visual area than outerwear, but are normalized within bounded scale classes rather than stretched. Recommended perceived-height bands: outerwear/one-piece 72–82%; tops/bottoms 66–78%; shoes/accessories 48–66%. These are art-direction targets, not inferred domain rules.

## Asset states

- **Placeholder:** muted mat, 28px garment outline, full item name below; no giant illustration.
- **Loading:** fixed-ratio neutral skeleton; optional low-detail preview fades to final image without pulse under reduced motion.
- **Failed:** placeholder plus `Изображение не загрузилось` and Retry where actionable.
- **Multiple images:** small count/icon in a fixed corner; never cover the garment silhouette.
- **Processing:** subtle progress/status row below image; card remains identifiable.
- **Archived:** preserve normal image legibility; add label/icon and slightly muted chrome, not a heavy opacity wash over evidence.

## Outfit preview composition

Use only real catalog images by default, never AI-generated photorealistic composites:

- 1 item: one centered 4:5 visual.
- 2 items: two equal vertical zones.
- 3 items: one larger anchor plus two equal secondary zones.
- 4 items: balanced 2×2 grid.
- 5+ items: show four leading semantic items plus a textual `+N` count; detail reveals all.

All zones share the same mat and divider logic, creating one coherent card rather than cards inside a card. Semantic scale classes keep shoes/accessories recognizable without pretending the collage represents physical size.

## Real-asset validation gate

The Image System architecture and 4:5 contain rule remain approved, but the final Image Mat token/media treatment must be tested with the real existing catalog assets:

- opaque white-background PNG and JPEG;
- transparent PNG;
- square source assets inside 4:5 wells;
- front/back pairs;
- shoes;
- trousers;
- long outerwear.

If a warm-neutral mat exposes undesirable white rectangles around opaque catalog assets, Phase 4/implementation must not hide the issue through arbitrary crop. Adjust the visual token or media treatment after real-asset validation while preserving complete-object containment and approved image semantics. This is a validation gate, not a redesign of the Phase 3 Image System.

# Navigation

## Mobile bottom navigation

Keep the approved four destinations and one separate Create action. The recommended visual structure is a single 64px high bottom dock above the device safe area:

- `Главная` and `Гардероб` on the left; `Образы` and `История` on the right.
- The Create group occupies the central dock position but is not a destination. Its visual button is a 48×48px accent rounded square, raised only 6–8px above the dock plane; a plus icon is centered inside the square.
- At ordinary mobile widths (360px and wider), the visible **Добавить** label is centered directly below the 48px square, outside its accent fill but inside the 64px dock. The label uses the dedicated Navigation Label token; the combined visual group remains aligned with destination icon/label groups.
- The bar remains one flat/elevated surface with a top border and very soft raised shadow. No circular camera FAB, deep notch, glow or oversized floating shadow.
- Destination items show a 24px icon plus the dedicated 12–13px Navigation Label. Active state combines semibold text, selected glyph or short 2px indicator and accessible current-page semantics.
- Create opens a sheet with exact actions: `Добавить вещь`, `Создать образ`, `Отметить носку`; repeat Import appears only when contextual.
- At 320–375px, first preserve the visible label through compact geometry and the 12px Navigation Label token. If validated testing shows collision or unreadable scaling, only the visual `Добавить` label in the center group may be hidden in the narrow mode; the 48px rounded-square plus remains visually distinct as the attached Create action, never a selected tab.
- The accessible name is always `Добавить`, whether or not its visual label is present. The opened sheet immediately exposes the full textual actions `Добавить вещь`, `Создать образ` and `Отметить носку`.
- Validate ordinary and compact anatomy at 320px, 360px, 375px, 200% text/browser zoom and 400% reflow. If it fails, change dock spacing/height/geometry or increase type; do not abbreviate destination names and do not enlarge Create into a floating FAB.

Content has bottom padding equal to dock + safe area. The dock does not cover focused content or the software keyboard; task sheets may temporarily replace it with their own safe-area footer.

## Activity terminology decision

The internal approved domain remains Activity with children Calendar and Insights. Recommended Russian presentation label: **История**.

- `История` naturally covers the factual calendar and evidence derived from recorded wear.
- `Активность` can imply fitness, social activity or system events.
- `Журнал` overemphasizes manual data entry and makes the feature feel laborious.

This is a visual/copy decision, not an IA change. Page title may be `История носки`; children are `Календарь` and `Статистика`.

## Desktop sidebar

- Expanded width: 240px; collapsed width: 72px.
- Product mark at top; 44–48px `Добавить` button below it; then Home, Wardrobe, Outfits and expanded History group.
- Utilities—Import, Archive, Settings—sit after a divider and may settle toward the bottom when height permits.
- Active row uses Selected Surface, a 3px accent leading rail, semibold label and active glyph; not color alone.
- Collapsed mode retains icons, tooltips, accessible names and active rail. Create remains a plus control with tooltip/name, not a nav destination.
- Future Assistant/Planning add labeled groups without moving MVP destinations.

## Page header / top bar

Use one reusable compact anatomy: optional Back → title → count/status → flexible space → primary action → overflow/profile. Height is 56px compact and 64–72px wide. H1 is used inside page content or at the header start without becoming a hero banner.

Sticky headers use Elevated Surface, bottom Subtle Border and no permanent large shadow. Back, overflow and profile are 44px targets. Counts are Small/secondary, not badges unless they communicate a bounded actionable state.

# Cards

Cards are content-specific. There is no universal visual `Card` shell applied to every block.

## Clothing Card

Anatomy: 4:5 image well → one/two-line display name → one-line category → optional compact state. Favorite is a 44px overlay control with a solid Surface backing in a fixed image corner.

| State                | Treatment                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Default              | no outer shell/shadow; 12px image radius; text directly on Canvas                               |
| Hover                | subtle Strong Border around image well and optional 1–2px image lift; no hidden critical action |
| Focus                | 2px Focus ring around complete target with offset                                               |
| Pressed              | image mat darkens slightly; no large scale animation                                            |
| Selected             | Accent Border + Selected Surface + visible checkmark and selected text                          |
| Archived             | normal readable image, archive icon + `В архиве`; chrome muted, not evidence obscured           |
| Processing           | stable image well with progress icon/label below or restrained scrim                            |
| Missing/failed image | garment placeholder + identity; failed adds Retry when permitted                                |

Names use Label or Body at 600 and may wrap to two lines on narrow cards. Category uses Small/secondary. Do not add price-commerce cues to owned Clothing Cards.

## Outfit Card

Use one coherent 4:5 composition stage following the 1–4/+N layout rules, then title, Favorite and factual last-recorded-wear text. Do not place mini Clothing Cards inside it. Archived or missing-member states preserve the composition and add explicit labels/placeholders. Hover/focus treatment matches Clothing Card.

## Insight Card

Anatomy: plain-language statement → one Numeric Feature or compact comparison → period/population → coverage note → evidence link/action. Use border/divider and whitespace, not KPI-dashboard elevation. A maximum of one visually dominant figure appears per card. Incomplete coverage is an Information state, not Warning/Error.

## Draft / Resume Card

Use Selected Surface or a subtle 3px accent leading rule, `Черновик` label, draft type/name, last saved time and `Продолжить`. It is visibly different from committed content without a large warning banner. `Не сохранено` adds Error icon/text and Retry; `Конфликт изменений` adds focused review action.

# Buttons

| Type        | Visual treatment                                                      | Use                                                      |
| ----------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| Primary     | Accent fill, inverse text, 12px radius, 48px height                   | strongest local action; normally one per action area     |
| Secondary   | Surface, Strong Border, primary text, 48px                            | alternative with similar reach but lower emphasis        |
| Tertiary    | transparent, accent text, 44px min target                             | inline/section action                                    |
| Ghost       | transparent, primary/secondary text, 44px min target                  | navigation, menus and low-emphasis utilities             |
| Destructive | Error foreground/border; filled error only at final irreversible step | hard delete and destructive confirmation                 |
| Icon button | 44×44 min touch target; 20px icon                                     | favorite, overflow, navigation; accessible name required |

Button anatomy: optional leading icon, single action label, optional progress indicator. Do not combine two verbs. Loading preserves button width and replaces/augments label with specific progress. Disabled is not a substitute for explaining validation; when reason is non-obvious, show adjacent help.

States: default → hover tone shift → pressed darker fill and 1px optical compression → focus outer ring → disabled readable neutral state → loading retained width. Error belongs beside the failed outcome, not as a permanent red button state.

# Form Controls

All controls use persistent Label above, 48px default height, 8px radius, Surface fill and Strong Border. Help/error sits below and is programmatically associated; placeholder is an example, never the only label. `Необязательно` appears in label or group help rather than on every optional field.

| Control           | Visual rule                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Text input        | 16px input text; leading/trailing icons only when conventional; clear action is labeled        |
| Search            | 48px, magnifier, query, labeled clear; suggestions in Overlay surface                          |
| Textarea          | 96px minimum, resizable wide; character guidance only when meaningful                          |
| Select            | value + chevron; sheet on compact, menu/listbox wide; never native-looking mixed styles        |
| Multi-select      | selected values summarized as removable tokens below/within bounded field; avoid pill overflow |
| Checkbox          | 20px visible box within 44px row; selected check + text                                        |
| Radio             | 20px circle within 44px row; card-radio only when visual comparison matters                    |
| Switch            | only immediate binary settings; label states the setting, not the action                       |
| Segmented control | 2–3 mutually exclusive compact views, full-pill container; not for long filters                |
| Date control      | localized textual date + calendar action; validation remains visible                           |
| File/image upload | bordered drop/select zone + exact file action; camera/files choices remain separate            |
| Numeric input     | tabular numerals, visible units/currency, keyboard-accessible increment only when meaningful   |

Read-only fields use normal contrast and a muted surface, not disabled opacity. Error adds Error Border/icon/message; focus remains visible outside the error border. A group-level error links to the first invalid control.

# Filters

- Default chip: transparent/Surface, Subtle Border, 36–40px height, full radius only because it is a compact filter token.
- Active chip: Selected Surface + Accent Border + checkmark + label; optional result count uses tabular numerals.
- Clear uses a text action `Сбросить фильтры`; clearing filters preserves Search unless the combined action is explicit.
- Mobile frequent chips apply immediately in a horizontal row. Advanced Filters opens a full-height staged sheet with a sticky `Показать N вещей`; closing without Apply restores last-applied filters.
- Desktop rail is 220–248px, flat and separated by whitespace/border. Groups use H3/Label, check rows and live counts; updates are immediate.
- Loading a count does not disable selection; use a small progress status. Failure preserves the current filter and explains retry.
- Avoid a pill for every metadata value. Pills are for active filters/statuses, not ordinary content.

# Item Detail

The direction is fashion/product-detail inspired but explicitly represents an owned thing, not merchandise.

## Compact

Semantic order is compact Page Header with full identity/status → visually dominant 4:5 gallery → Appearance switcher when present → actions → facts → related outfits → wear history. The gallery may occupy up to about 60–65% of the initial viewport, but identity and Back remain visible.

Primary action is `Добавить в образ`; `Отметить носку` is Secondary. When both scroll away, an optional compact sticky action strip may appear without competing with bottom navigation. Metadata uses grouped rows/dividers, not cards. Archived state replaces active actions with `Вернуть из архива` and keeps evidence/history at normal contrast.

## Wide

Use up to 1200px: gallery left (about 58%) and content/actions right (about 42%), with 32–48px gap. The left pane has a 4:5 hero and square labeled thumbnail rail. The right may remain sticky until below-page related/history sections begin. At medium widths, thumbnails move below the hero and the content column stops sticking.

# AppearanceVariant

User-facing term: **Внешний вид**. Use image-based radio cards rather than a text-only segmented control because the choice is intrinsically visual.

An Appearance Option contains 64–88px cover image, full label, selected radio/check and optional `В архиве`. Selected state uses Accent Border + check + text. In compact view options scroll horizontally only when all labels and current selection remain reachable; wide view uses a small grid.

Directly below, ImageViews are a separate gallery row labeled **Ракурсы** with `Спереди`, `Сзади`, `Сбоку`, `Деталь`. They never reuse radio-card selection visuals. Builder tiles show `Вид: Чёрная сторона`; activating it opens the same appearance-card chooser.

Archived appearances retain label and historical image/placeholder but cannot be selected for a new outfit. Never show variant-level Favorite, lifecycle or wear counts: those belong to the Physical Item.

Recommended helper copy:

> Добавьте внешний вид, если одну и ту же вещь можно носить по-разному — например, разными сторонами. Фото спереди и сзади одного внешнего вида — это ракурсы, а не разные внешние виды.

# Image Manager

Use a flat ordered thumbnail list/grid. Each 1:1 thumbnail has: image; Primary marker when applicable; `Ракурс` label; assigned `Внешний вид` label; origin/evidence detail on expansion; processing/error status; overflow.

Reorder mode adds visible handles and numbered positions, plus `Раньше`/`Позже` actions in each menu. Drag is supplemental. Primary is a text action and icon, not inferred from first position. Source/catalog information uses plain descriptions in a detail disclosure; technical renditions never appear.

Processing holds space and shows label/progress. Failure preserves the asset row with Retry/Remove. Removing a primary/historically referenced asset opens only the approved dependency review; ordinary reversible image actions use immediate feedback/Undo where possible.

# Outfit Library

Use a two-column compact, three-column medium and three-to-five-column wide grid. Each Outfit Card has a 4:5 coherent composition, title, Favorite and `Последняя носка: …` when known. Unknown is `Нет отмеченных носок`, never `Никогда не надевали`.

Draft Resume appears as a distinct horizontal strip before committed results. Search/filter/sort follows Wardrobe visual semantics. Archived is an explicit route/filter. Mixed missing imagery retains the preview grid using labeled placeholders rather than collapsing the composition.

# Outfit Builder

## Composition model

Use a **structured editorial board**, not a free canvas. Garment images remain contained in stable tiles; main clothing roles receive larger central zones and footwear/accessories smaller side/bottom zones. Semantic roles guide placement but never enforce completeness or reject layering/multiple accessories.

Builder mode exposes tile boundaries, role, Appearance label and controls. Saved Library/Detail mode removes most tile chrome and shows the same arrangement as a calm composition. For more than six items, keep leading items readable and expose the full ordered list below or via `Ещё N`; never hide members from detail/history.

Drag is optional. Every selected tile offers `Заменить`, `Раньше`, `Позже`, role and `Убрать`. Images do not overlap enough to hide garment identity. No photorealistic body/composite is the default.

## Mobile

- Sticky 56px header: Close, title, quiet Draft Status and Save.
- Composition occupies about 40–50% of the initial viewport and remains above the picker trigger.
- The board uses a stable two-column/modular arrangement with 12px gaps and generous images; it may scroll as content, not as a tiny independent canvas.
- `Добавить вещь` opens the approved full-height picker sheet: compact composition count → Search → instant chips → Filters → two-column item grid.
- Selecting returns to composition; `Добавить ещё` keeps the picker open. Multi-appearance choice occurs before final add.
- Replace mode shows a persistent named header and keeps the old tile until success. Duplicate physical item is explained inline.
- Remove acts immediately with Undo. Save remains reachable above keyboard/safe area; `Не сохранено` retains the complete board.

## Desktop

Use three visual zones within the app: 240px global sidebar, flexible composition workspace and 380–420px picker. Composition gets a compact local header with title, Draft Status and Save. The centered board is the strongest element; notes/occasion live below or in a restrained inspector, never between board and picker.

Picker Search/filters are sticky; results scroll independently. Selected tile shows Accent Border, role/appearance and contextual toolbar. Replace changes picker heading to `Заменить: [вещь]` with explicit Cancel. At medium width the picker becomes a drawer without obscuring the whole composition.

# Wear Feedback

`Отметить носку` is a calm Primary action. On an outfit, use `Отметить носку сегодня` when the date distinction matters. The accessible name includes the local date.

Success uses an Undo Bar near the bottom safe area: check icon, `Носка за сегодня отмечена`, `Отменить`, optional `Открыть день`. No confetti, streak, sparkle or large celebration. It remains perceivable about 8–10 seconds, pauses while hovered/focused and is announced once.

Duplicate same-day detection is a neutral/Warning review—not an Error. Pending/offline uses Information icon + `Ожидает сохранения` and Retry/cancel semantics from approved UX. A failed optimistic action rolls back or remains explicitly pending; it never borrows success green.

# Calendar

The presentation label for the parent is `История`; the page may use `История носки`. Calendar and Statistics remain the two views.

- Month header is compact: previous, localized month/year, next, `Сегодня`, Agenda toggle where needed.
- Cells are at least 44×44px. Show date numeral and small event count/dot; a single tiny preview is optional only at wide cell sizes.
- Today = labeled ring; selected = Selected Surface + Strong/Accent Border; event presence = numeral/icon. These states remain distinct without color.
- Compact: month grid followed by selected-day agenda. Wide: month about two-thirds, agenda about one-third.
- Wear Event Card uses a small snapshot strip, date/time, outfit/item identity and Appearance labels when needed.
- Empty day offers one quiet `Отметить носку`; Agenda is a complete alternate view.

No planned outfit, wishlist, trip or AI recommendation appears in MVP Calendar. The visual system does not create a legend for states that do not exist.

# Insights

Insights remain evidence-first editorial summaries, not a dashboard.

- Period and population controls precede figures; Coverage Note stays directly below them.
- Each result uses one editorial number/statement, a clear label, period/population, evidence definition and `Посмотреть вещи` or `Посмотреть события`.
- Compact bars are permitted for comparisons. Always print the value; provide a table/text equivalent.
- Avoid gauges, rings, traffic-light judgments, scorecards and equal-height KPI tile walls.
- Unknown uses dash + explanation. Incomplete coverage uses Information Surface and observation start, never zero or an Error.
- Compact view stacks. Wide view may use a limited 2–3-column summary row followed by evidence lists; every card retains its own scope/coverage.

# Bulk Import

Apply high-fidelity treatment only to the approved staged shell: Choose → Prepare → Review → Resolve → Preview → Confirm → Results.

## Wide workspace

Use three zones: 200–224px step rail, 400–480px group list and flexible selected-detail pane. Header shows stage, batch counts and Draft Status. Step rows use icon + label for complete/current/upcoming/error. Review tabs show All, Needs review and Skipped with counts. A sticky footer holds selection summary, Back and Continue/Confirm.

Group rows may show proposed Physical Item identity, image count, appearance count and issue state. Selected detail visually separates Physical Item, Appearances and ImageViews. Clean, Warning, Error, Skipped and Confirmed always use icon + label + border/surface.

## Compact workspace

Show one stage at a time. Stage header/progress remains sticky; group cards replace dense rows; selected detail opens in the next sheet/page; safe-area footer retains Back/Continue. Parsing preserves layout and uses determinate progress when known.

The following remain **provisional pending Source Audit**: exact mapping controls, grouping density/rules, duplicate resolution, image reconciliation, source/catalog mapping and detailed AppearanceVariant import handling. The design may define their state vocabulary but cannot finalize their interaction or hierarchy from hypothetical source data.

# Settings

Settings is a flat grouped list on Canvas, not dashboard cards. Use 16px compact margins, 32px section gaps, 48–56px rows and Subtle Dividers.

Groups follow approved order: Account & privacy; Data; Preferences; Accessibility; Help & about. Import lives under Data; Archive is a clear utility row. Delete Account is isolated in a final group with a text label; strong Error fill appears only at the final irreversible confirmation. Row-level loading/error preserves the rest of Settings.

# Draft / Status System

## Draft vocabulary

| State          | Visual treatment                         | Russian label / action             |
| -------------- | ---------------------------------------- | ---------------------------------- |
| Working        | neutral pencil/dot + secondary text      | `Черновик`                         |
| Saving         | small restrained progress + stable label | `Сохраняется…`                     |
| Saved draft    | check/clock + secondary text             | `Черновик сохранён`                |
| Not saved      | Error icon/text, no giant banner         | `Не сохранено` / `Повторить`       |
| Conflict/stale | Warning icon + bordered review row       | `Конфликт изменений` / `Проверить` |

Draft is never styled like a committed item/outfit. Accent-tinted Resume cards and compact status labels distinguish it; ordinary Draft is not a warning.

## General status vocabulary

| Status                                        | Visual cues beyond color                                      |
| --------------------------------------------- | ------------------------------------------------------------- |
| Active                                        | normally no badge; available actions establish active state   |
| Archived                                      | archive icon + `В архиве` + quiet border/surface              |
| Draft                                         | pencil/clock + explicit label                                 |
| Processing                                    | progress glyph + action-specific text                         |
| Failed                                        | error icon + message + recovery action                        |
| Unavailable (future)                          | unavailable icon + reason/time when known                     |
| AI suggestion (future)                        | restrained assistant glyph + `AI‑предложение` + draft surface |
| Imported/unreviewed (future/source-dependent) | import/info icon + `Не проверено` + review action             |

Badges remain compact and factual. Avoid using several simultaneous badges; put detailed provenance in the relevant detail/review surface.

# Empty / Loading / Error

## Empty

Use a small 28px outline icon or subtle garment silhouette, H3 statement, one Body explanation and one Primary action. Avoid giant illustrations, mascots and decorative blank-space filling. First-use Home is the exception that may use Display type, still without a giant hero graphic. Filtered empty names the active constraint and offers `Сбросить фильтры`.

## Loading

Skeletons match final image/card/list geometry. Image wells load progressively while identity text may appear. Use static or slow low-contrast pulse only; reduced motion makes it static. Long import/export tasks show named progress and allow safe return. Endless spinner is never the primary page pattern.

## Error

Keep errors local whenever possible: icon, exact failure sentence, preserved user content and one Retry/alternative. Reserve full-screen Error for a true fatal page failure. Red never consumes the whole screen. Permission denial supplies the relevant files/manual alternative. Partial image/import failure leaves successful content visible.

# Motion

Motion communicates press, selection, insertion, layer movement and state change.

| Interaction                          | Duration / behavior                                         |
| ------------------------------------ | ----------------------------------------------------------- |
| Button press                         | 80–100ms tone/optical response                              |
| Favorite, selection, status          | 120–160ms fill/border transition                            |
| Item insert/remove, appearance image | 160–200ms stable insertion or crossfade                     |
| Sheet/drawer/dialog enter            | 220–260ms restrained translate + fade; exit slightly faster |
| Save/status change                   | 120–160ms crossfade without layout jump                     |

No transition exceeds 300ms in routine use. Avoid spring overshoot, parallax, confetti, garment-flying animation and decorative loops. Favorite fills without a burst. Add-to-outfit highlights source and inserts a stable tile. Appearance updates text immediately and crossfades within a reserved frame. Archive fades/collapses after moving focus predictably, then exposes Undo.

With reduced motion, remove spatial transforms, pulsing and auto-scroll; use instant change or a ≤100ms opacity transition. The same status/relationship remains visible.

# Responsive Rules

## Visual modes

| Mode                       | Layout behavior                                                         | Visual density                                                      |
| -------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Narrow phone               | 4-column base, 16px edge, bottom dock, sheets, one reading column       | 2-column image collections; full 44px controls; 32px section rhythm |
| Large phone / small tablet | 4–8 columns, 20–24px edge, bottom dock or compact rail when appropriate | 2–3 collection columns; wider sheets/drawers                        |
| Tablet / compact desktop   | 8–12 columns, 24–32px edge, rail/collapsible sidebar                    | 3–4 collection columns; picker/filter as drawer                     |
| Wide desktop               | 12 columns + 240px sidebar, 32–48px edge, main content ≤1400px          | 4–6 collection columns; simultaneous panes                          |

- Validate narrow behavior at approximately 320px. Do not solve width pressure by hiding core labels or reducing touch targets.
- Typography changes only at Display/H1. Body/control sizes stay stable across modes.
- Sticky regions are limited: one page/task header plus either bottom navigation or task footer. Avoid stacks that consume the viewport.
- Wardrobe/Outfit cards keep ratios while columns change. Minimum useful Clothing Card visual width is approximately 140px compact and 176px wide.
- Reading/edit forms remain one column at 640–720px even on large screens.
- Item Detail transitions stacked → gallery/content split. Semantic reading/focus order remains unchanged.
- Mobile sheets become drawers or persistent side panes without changing action order or staged/instant semantics.
- Builder preserves composition above compact picker and beside wide picker. Import preserves stage/list/detail relationships.
- Calendar becomes month-above-agenda → month-beside-agenda. Insights stack → limited columns, with scope attached.
- At 200% zoom or when usable width collapses, treat the layout as a narrower mode. At 400% reflow, ordinary content becomes one readable column; tables become labeled rows/cards.
- Hover remains supplemental. Wide touch devices retain coarse-pointer sizes and visible actions.

# Design Tokens

Tokens express visual intent and are not implementation configuration.

## Color tokens

| Token                             |                 Value |
| --------------------------------- | --------------------: |
| `color.bg.canvas`                 |             `#F8F7F3` |
| `color.bg.surface`                |             `#FFFFFF` |
| `color.bg.muted`                  |             `#F1F0EB` |
| `color.bg.selected`               |             `#E7EFEA` |
| `color.text.primary`              |             `#1F2321` |
| `color.text.secondary`            |             `#59615D` |
| `color.text.tertiary`             |             `#6B736F` |
| `color.text.disabled`             |             `#858B88` |
| `color.text.inverse`              |             `#FFFFFF` |
| `color.border.subtle`             |             `#DADDD8` |
| `color.border.strong`             |             `#858D89` |
| `color.border.focus`              |             `#31594B` |
| `color.action.primary`            |             `#3E6658` |
| `color.action.hover`              |             `#35594D` |
| `color.action.pressed`            |             `#2C4C42` |
| `color.action.selected`           |             `#E7EFEA` |
| `color.status.success.fg` / `.bg` | `#2F6B4F` / `#E7F2EB` |
| `color.status.warning.fg` / `.bg` | `#795B00` / `#FFF4CC` |
| `color.status.error.fg` / `.bg`   | `#A23434` / `#FCE9E9` |
| `color.status.info.fg` / `.bg`    | `#365F7B` / `#EAF2F7` |

## Typography tokens

| Token                  | Compact / wide               | Line height | Weight |
| ---------------------- | ---------------------------- | ----------: | -----: |
| `type.display`         | 34 / 40px                    |   40 / 48px |    600 |
| `type.h1`              | 28 / 32px                    |   36 / 40px |    600 |
| `type.h2`              | 24px                         |        32px |    600 |
| `type.h3`              | 20px                         |        28px |    600 |
| `type.body.large`      | 18px                         |        28px |    400 |
| `type.body`            | 16px                         |        24px |    400 |
| `type.small`           | 14px                         |        20px |    400 |
| `type.caption`         | 12px                         |        16px |    500 |
| `type.label`           | 14px                         |        20px |    600 |
| `type.navigation`      | 12px compact / 13px standard |        16px |    600 |
| `type.button`          | 15px                         |        20px |    600 |
| `type.numeric.feature` | 32 / 40px                    |   36 / 44px |    600 |

## Geometry, space and elevation tokens

| Family  | Tokens                                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Space   | `space.1` 4; `space.2` 8; `space.3` 12; `space.4` 16; `space.6` 24; `space.8` 32; `space.10` 40; `space.12` 48; `space.16` 64; `space.20` 80 |
| Radius  | `radius.sm` 8; `radius.md` 12; `radius.lg` 16; `radius.full` semantic full round                                                             |
| Border  | `border.subtle` 1px; `border.strong` 1px; `border.focus` 2px + 2px offset; `border.active` 3px indicator                                     |
| Shadow  | `shadow.flat` none; `shadow.raised` 0 1px 2px / 6%; `shadow.overlay` 0 8px 24px / 10%; `shadow.modal` 0 16px 40px / 14%                      |
| Icon    | `icon.inline` 16; `icon.control` 20; `icon.navigation` 24; `icon.empty` 28                                                                   |
| Control | `control.compact` 40; `control.default` 48; `control.touch-min` 44                                                                           |
| Content | `content.reading` 680–720; `content.detail` ≤1200; `content.application` ≤1400; `sidebar.expanded` 240; `sidebar.collapsed` 72               |
| Motion  | `motion.press` 80–100ms; `motion.state` 120–160ms; `motion.content` 160–200ms; `motion.layer` 220–260ms                                      |

# Component Inventory

## Navigation

- **AppShell:** Canvas, global status, desktop Sidebar or mobile Bottom Nav.
- **BottomNav / BottomNavItem:** four destinations, active indicator and safe-area behavior.
- **CreateAction / CreateSheet:** separate Add launcher and precise domain actions.
- **Sidebar / SidebarSection:** expanded/collapsed, primary Activity children, utilities and future groups.
- **PageHeader:** Back, title, count/status, primary action, overflow/profile.
- **ActivityTabs:** Calendar / Statistics switch inside History.
- **Breadcrumb:** deep desktop task flows only.
- **OfflineStatus:** persistent, quiet, not toast-only.

## Wardrobe

- **ClothingCard / ClothingCardMedia:** item identity and state.
- **FavoriteControl.**
- **ItemGallery / GalleryThumbnail / ImageViewLabel.**
- **AppearanceSwitcher / AppearanceOption.**
- **MetadataGroup / MetadataRow.**
- **FilterChip / FilterGroup / FilterSheet / FilterRail.**
- **ResultCount / SortControl / ViewToggle / CollectionEnd.**

## Outfits

- **OutfitCard / OutfitComposition.**
- **OutfitItemTile / AppearanceIndicator / SemanticRoleControl.**
- **CompositionToolbar.**
- **ItemPicker / PickerItemCard.**
- **ReplaceModeBanner / DuplicateItemMessage / AvailabilityNotice.**

## Activity

- **MonthCalendar / CalendarCell / DayAgenda.**
- **WearEventCard / WearFeedback / DuplicateWearReview.**
- **InsightCard / MetricFigure / CoverageNote / EvidenceLink.**
- **CompactBar / AccessibleDataTable.**

## Import

- **ImportStepper / ImportStageHeader.**
- **ImportBatchSummary / ImportReviewTabs.**
- **ImportGroupRow / ImportGroupCard / ImportIssueBadge.**
- **ImportDetailPane / ImportSelectionSummary / ImportOutcomeSummary.**

Import Group/Detail anatomy is provisional where it depends on real mapping, grouping, duplicate, image reconciliation, source/catalog and AppearanceVariant cases.

## System

- **Button:** Primary, Secondary, Tertiary, Ghost, Destructive.
- **IconButton.**
- **Input, Textarea, Search, Select, MultiSelect.**
- **Checkbox, Radio, Switch, SegmentedControl.**
- **DateControl, NumericInput, FileUpload, ImageUpload.**
- **Sheet, Drawer, Dialog, Menu, Tooltip.**
- **Toast, UndoBar, InlineAlert.**
- **Skeleton, ProgressiveImage, Progress.**
- **EmptyState, StatusBadge, DraftStatus.**
- **Divider, SectionHeader, Disclosure, ListRow.**

# Component States

Every major interactive component defines default, hover, focus, pressed, selected where applicable, disabled, loading and error. Hover is never required to discover or complete an action.

| Component           | Required state treatment                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button              | default fill/border; modest hover; darker pressed; outer focus ring; readable disabled; width-stable loading; failed outcome paired with Inline Alert                                        |
| Icon Button         | same interaction states; Tooltip + accessible name; destructive meaning receives text in menu/dialog                                                                                         |
| Clothing Card       | default; hover image border; full-target focus; pressed mat; selected check/border/surface; bounded-picker disabled with reason; processing label; failed image + Retry; archived icon/label |
| Outfit Card         | Clothing Card interaction model; missing member remains labeled; selected only in bounded chooser                                                                                            |
| Outfit Item Tile    | default; focus; selected; `Заменяется` mode; archived/unavailable icon + label; loading/error; move position announced                                                                       |
| Appearance Option   | image-radio default/hover/focus/pressed; selected check + border + label; archived unavailable for new use; missing image still text-identifiable                                            |
| Search/Input        | empty/populated; hover/focus; disabled/read-only distinction; suggestion loading; inline error; offline limitation; labeled Clear                                                            |
| Filter Chip         | default/hover/focus/pressed; selected check + selected surface + count; disabled reason; count loading/error without clearing selection                                                      |
| Sheet/Drawer/Dialog | entering/open/exiting; content loading; validation/error; focus trap; deterministic focus return; destructive emphasis only when relevant                                                    |
| Calendar Cell       | default/hover/focus; today ring; selected surface/border; event numeral/icon; outside-month/disabled; region-level loading/error                                                             |
| Insight Card        | default/focus/hover when linked; label-preserving skeleton; incomplete coverage; calculation unavailable; error + Retry; retained drill-down context                                         |
| Import Group        | Clean, Warning, Error, Skipped, Confirmed, Processing, Selected, Focus and source-dependent Ambiguous; each icon + label + count                                                             |
| Draft Status        | Working, Saving, Saved Draft, Not Saved, Conflict; compact inline state, action only for recovery/review                                                                                     |
| Undo Bar            | specific result, Undo, optional destination, focus pause, live announcement and exact reversal only                                                                                          |
| Upload              | idle/drag-over where pointer exists; selecting; progress; processing; partial success; unsupported/error; Retry/Remove; permission denied alternative                                        |

Selected and Focus may coexist: selected communicates data state, Focus communicates current input location. Error never removes Focus. Disabled components cannot be the only explanation of what the user should do next.

# High-Fidelity Screen Specifications

These are build-independent visual specifications. Measurements define hierarchy and proportion, not implementation syntax.

## 1. Mobile Home

**Visual hierarchy:** 56px top bar → conditional Resume → Quick Actions → Recent Outfits → Recent Wear → Recently Added → one Insight → compact summary → bottom dock. First use replaces this with one focused activation block.

**Composition:** 16px page margins; 24px within activation/resume groups; 32–40px section gaps. Returning Quick Actions are simple 48px buttons/rows—Add item, Create outfit, Log wear—not dashboard cards. Recent Outfits scroll horizontally as 168–184px visual cards; Recent Wear is a compact list; Recently Added uses small 4:5 tiles.

**Typography:** H1 page/activation title, Body Large value statement, H2 section titles, Small metadata. Only the first-use statement may use Display.

**First use:** `У меня уже есть цифровой гардероб` is the Primary import action; `Начать с нуля` is an equal-quality Secondary. Use a real-interface/image-mat hint at most, not a giant illustration. Returning Home never keeps Import in daily Quick Actions.

**States/sticky:** Resume appears only when relevant and uses Draft styling. Pending/offline status sits below the header. Empty modules disappear rather than form hollow cards. Bottom dock is fixed; content padding prevents obstruction. Tablet/wide may form two columns while preserving approved order.

## 2. Mobile Wardrobe

**Visual hierarchy:** Page Header (`Гардероб`, count, view/sort) → sticky Search → instant chips/active summary → grid → Collection End → bottom dock.

**Composition:** 16px gutters, two equal columns, 12px gap. Image well is 4:5 with 8–12% contain padding; name below in Label/600 up to two lines; category in Small/secondary. Favorite sits on a solid 44px control backing inside the image corner.

**Filters:** Advanced sheet fills the available height. Field groups scroll; footer remains sticky with Secondary Reset and Primary `Показать N вещей`. Closing does not apply staged changes. Frequent chips remain instant.

**States/sticky:** Search/chip area may compress to one sticky block without hiding the title on focus. Processing holds grid position with labeled status. Missing image retains name/category. Filtered Empty repeats active scope. Loading skeletons keep 4:5 geometry. `Загрузить ещё` and collection end are keyboard reachable. At medium width move to approximately three columns.

## 3. Mobile Item Detail

**Visual hierarchy:** compact Page Header with full name/status → dominant gallery → Appearance Switcher → actions → key facts → Images/related Outfits → wear summary/history.

**Composition:** 16px page edge; gallery is full content width at 4:5 and may use up to about 60–65% viewport height. Square labeled thumbnails sit below with 8px gaps. Appearance cards follow immediately so the selection clearly controls the hero. Actions use full-width Primary `Добавить в образ` plus Secondary `Отметить носку`.

**Typography:** H1 is full identity in header/content, Small status, Label facts, Body notes. Name may wrap and is never reduced to Caption.

**States/sticky:** an optional compact action strip appears only after original actions leave the viewport and must not overlap bottom navigation. Archived replaces active emphasis with Restore but keeps history normal. Failed hero preserves frame and provides Retry; historical-only appearance remains labeled. Wide transition is specified in Screen 12.

## 4. Mobile Item Edit

**Visual hierarchy:** sticky 56px bar with Cancel/title/Save → Draft Status → Identity → Visual → Appearance → collapsed Classification/Use/Purchase/Notes → lifecycle Archive.

**Composition:** 16px margins; 16px field gaps; 32px groups. Image strip uses 72–88px thumbnails and visible Primary/Rакурс/status. Appearance rows show cover, label and Edit; helper copy sits before `Добавить внешний вид`.

**Typography/forms:** H3 group headings, Label outside every field, Body input, Small help/error. Identity and Visual are expanded; later groups use Disclosures with populated summaries.

**States/sticky:** top Save stays reachable above software keyboard. Saving/Not Saved never clears values. Field error is inline and summarized near Save. Ordinary Archive is a neutral lifecycle row, applies immediately and produces Undo; it is not red or modal. Dependency ambiguity invokes approved review. Medium/wide keeps the form at 640–720px.

## 5. Mobile Outfit Library

**Visual hierarchy:** Page Header (`Образы`, count, Create) → Draft Resume strip → Search/filter/sort → active outfit grid → archive route/end.

**Composition:** 16px edge, two columns, 12px gap. Each card uses a coherent 4:5 outfit stage with 2–4 leading garment images/+N, then two-line title, Favorite and Small factual wear text.

**States/sticky:** Drafts never mix into saved results. Missing members retain labeled zones. `Нет отмеченных носок` is not styled as failure. Archived is an explicit filtered route. Search may stick like Wardrobe. Medium width moves to three columns; wide follows collection rules.

## 6. Mobile Outfit Builder

**Visual hierarchy:** sticky task header with Close/title/Draft Status/Save → structured composition → composition controls/metadata → persistent `Добавить вещь`; picker sheet becomes the active layer.

**Composition:** 16px page edge; board occupies about 40–50% of initial viewport. Use 2-column/modular tiles with 12px gaps and 4:5/contained garment areas. Main roles may receive a larger zone; footwear/accessories use smaller zones without implying required completeness.

**Tile anatomy:** image, display name, `Вид: …` where applicable, role, 44px overflow. Selected tile gets Accent Border/check; its toolbar exposes Replace, Move Earlier/Later and Remove.

**Picker:** full-height Surface sheet; 56px header with composition count; sticky Search + instant chips; Filters opens staged sub-sheet; two-column grid. Selection returns to board unless `Добавить ещё` is active. Appearance chooser interrupts only the selected item.

**States/sticky:** Replace Banner names the target and keeps old tile until success. Duplicate item is inline Information, not Error. Remove is immediate + Undo. Saving/Not Saved is visible in header; offline board stays editable. Save is enabled at 1+ unique item and does not claim completeness. Tablet picker becomes drawer; wide follows Screen 13.

## 7. Mobile Outfit Detail

**Visual hierarchy:** Page Header/title/status → large 4:5 composition → Primary `Отметить носку сегодня` → Edit/Duplicate → selected Appearance labels and item list → occasion/notes → wear summary/history → Archive utility.

**Composition:** 16px edge; one calm outfit stage, no nested item cards. Favorite is a small labeled Icon Button, never competing with Wear. Secondary actions sit in a two-column row or menu based on width.

**States/feedback:** Undo Bar states `Носка за сегодня отмечена` with Undo and View Day. Same-day duplicate opens Warning review, not red Error. Archived/unavailable members keep images plus labels and replace affordance; historical composition remains intact. Archive is ordinary immediate + Undo unless a real dependency choice exists.

## 8. Mobile History / Calendar

**Visual hierarchy:** Page Header `История носки` → segmented `Календарь / Статистика` → month toolbar → month grid → selected-day agenda → Log Wear.

**Composition:** 16px page edge. Toolbar fits previous/month-next and Today; Agenda alternative is a labeled action. Seven equal calendar columns; every cell at least 44px. Use date numeral, event count/icon and at most one tiny preview only when cell width permits.

**States:** Today has ring + accessible label; selected has border/surface; events have number/icon. Outside-month dates remain readable but de-emphasized. Selected-day agenda lists every event chronologically with small snapshot, identity and appearance labels. Empty date offers one action. Loading keeps month dimensions; region error retains month/date controls. No future plans or AI content.

## 9. Mobile Insights

**Visual hierarchy:** History header/tabs → Period and Population controls → Coverage Note → leading insight → supporting insights/evidence → definitions.

**Composition:** 16px edge; cards stack with 16px internal padding and 24px gaps. One Numeric Feature per card, statement in H3/Body Large, scope in Small, evidence action in Tertiary. Compact bars show printed values; table alternative follows.

**States:** Incomplete coverage uses Information Surface and exact observation start. Unknown is dash + explanation, never zero. Calculation Error is local with Retry and direct history links. Drill-down return restores period/population. Wide layout may use a limited 2–3-column summary row without becoming a KPI wall.

## 10. Mobile Settings

**Visual hierarchy:** Page Header → Account & privacy → Data → Preferences → Accessibility → Help/about → separated Delete Account.

**Composition:** 16px edge; 32px group gap; 48–56px List Rows with Subtle Dividers. Avoid section cards and icons unless they improve recognition. Secondary description is one Small line when helpful.

**States:** Import appears at Data → Import; Archive is its own utility row. Destructive entry uses Error text/icon but no filled red surface until final confirmation. Row-level loading/error leaves other groups usable. Re-auth explains recovery without replacing the whole screen.

## 11. Desktop Wardrobe

**Visual hierarchy:** 240px Sidebar → content Page Header → sticky Search/sort/action row → 220–248px Filter Rail + grid.

**Composition:** main content up to 1400px with 32–48px outer gutter and 24px column gap. Choose 4–6 grid columns so image wells remain roughly 180–240px. Clothing Card anatomy and 4:5 imagery are identical to mobile. Create is available in Sidebar/header without a floating social FAB.

**States/sticky/responsive:** Filter Rail updates immediately; active chips/result count remain visible. Hover exposes supplemental actions while keyboard/touch paths stay present. At constrained width Rail becomes Drawer; Sidebar collapses to 72px. At high zoom both become narrow-mode controls and grid reflows without two-dimensional scrolling.

## 12. Desktop Item Detail

**Visual hierarchy/composition:** Sidebar retained; detail content up to 1200px. Use gallery/content split around 58/42 and 32–48px gap. Left: large contained 4:5 hero with 72–88px vertical square thumbnails. Right: H1 name/status, Appearance Switcher, actions, key facts. Related Outfits and Wear History span below.

**Behavior:** right column may stick until lower sections begin. Appearance cards remain distinct from ImageView thumbnails. Metadata uses sections/dividers. Archived changes actions to Restore without dimming historical evidence. At medium width thumbnail rail moves below hero and right pane stops sticking; compact order matches Screen 3.

## 13. Desktop Outfit Builder

**Visual hierarchy/composition:** 240px Sidebar → flexible composition workspace → 380–420px Item Picker. Workspace header holds title, Draft Status and Save; the board is centered and visually dominant. Metadata/notes sit below or in a restrained inspector.

**Components:** contained garment tiles expose selected border, role, Appearance and contextual toolbar. Picker has sticky Search/filters and independent results scroll. Replace changes picker title to `Заменить: [вещь]` and shows Cancel; source tile remains visible until replacement succeeds.

**States/responsive:** Clicking adds; drag is supplemental. Failed save leaves the board untouched. Conflict opens explicit review. Loading keeps pane widths. At tablet width Picker becomes Drawer while composition remains visible; sidebar may collapse. At 400% reflow the task follows compact ordering.

## 14. Desktop Calendar / Insights

**Calendar:** Sidebar highlights History and expanded child. Main content uses Page Header then view switch. Month consumes about two-thirds, selected-day Agenda one-third with 24px gap. Cells show date/event count; one preview is optional only when large enough. Agenda scrolls independently only when necessary.

**Insights:** controls and Coverage Note span top. Use a limited 2–3-column summary row and evidence lists below, never a full dashboard grid. Cards align by content rather than forced equal KPI heights. Charts print values and link to accessible tables.

**States/responsive:** switching views preserves meaningful date/period context but never mixes factual Calendar with future planning. Medium collapses Agenda beneath Calendar and stacks Insight cards. Error/empty remains local to the affected region.

## 15. Desktop Bulk Import

**Visual hierarchy:** full 1400px task workspace → stage/header summary → Step Rail 200–224px → Group List 400–480px → flexible Selected Detail → sticky action footer.

**Components:** Stepper uses complete/current/upcoming/error icon + label. Review Tabs show All/Needs review/Skipped counts. Group Row shows proposed Physical Item identity, ID where meaningful, image/appearance counts and issue state. Detail visually separates Physical Item, Appearances and ImageViews. Footer shows selection scope, Back and Continue/Confirm.

**States:** Clean, Warning, Error, Skipped, Confirmed and Processing use label/icon/border/surface. Warning may continue; unresolved Error states whether correction or Skip is required. Parsing uses determinate progress when known and stable skeletons otherwise. Results show created/updated/skipped/failed and Retry Failed.

**Provisional boundary:** exact mapping controls, grouping and duplicate rules, image reconciliation, source/catalog mapping and detailed AppearanceVariant import handling cannot be finalized before Source Audit. These specifications approve the staged visual shell only. Compact mode uses one stage at a time and a safe-area footer.

# Accessibility

WCAG 2.2 AA remains a release criterion, not a visual-polish task.

## Visual audit checklist

- Normal text contrast is at least 4.5:1; large text and meaningful non-text controls are at least 3:1.
- Default Body is 16px. Main body, actions, form labels, instructions, errors and critical states are at least 14px. Caption is supplemental only.
- Short persistent navigation labels alone may use the dedicated 12–13px Navigation Label token, never Caption, and only with an icon + complete textual identity, sufficient weight/contrast and correct zoom scaling.
- Every touch target is at least 44×44px, with safe separation around destructive/adjacent actions.
- Focus surrounds the complete interactive target, is at least 2px, contrasts against Canvas/Surface/Selected/Error states, is never clipped by overflow and remains visible under sticky UI.
- Inputs have persistent labels; help/error associations and required/optional meaning do not depend on placeholder text.
- Active nav, selected cards/filters, Favorite, Appearance and all statuses use at least two cues: border/surface plus icon/check/text.
- Disabled controls remain legible; non-obvious unavailability gets a nearby explanation. Read-only content is not dimmed as disabled.
- Semantic reading/focus order stays stable when desktop visually repositions gallery, content, picker or agenda.
- At 200% zoom and 400% reflow, ordinary screens become a single readable flow without two-dimensional scrolling. Dense tables convert to labeled rows/cards. Bottom navigation and Create are specifically checked at 320px, 360px and 375px; geometry/type must adapt before any label is abbreviated.
- Clothing links use item identity in accessible names. Decorative duplicates have empty alternative text; meaningful image alt may include item, Appearance and Rакурс only when each adds information.
- Appearance and Rакурс are always expressed in visible/accessibility text, never inferred from image differences.
- Calendar Cell exposes full date, today/selected status and event count. Agenda is the complete non-grid equivalent.
- Charts state title, period, population, coverage and unit; printed values and a table/text equivalent exist. Unknown is labeled, not plotted as zero.
- Toast/Undo success is announced once and has sufficient dwell time; critical result/recovery remains reachable outside an expiring message where needed.
- Errors are associated with the failed control and focus moves predictably to a summary/field without erasing input.
- Reduced motion removes transforms/pulse without removing feedback. Forced-colors/high-contrast mode keeps boundaries and state icons.

## Required design validation

Validate primary flows using keyboard only, screen reader, 200% zoom, 400% reflow, forced colors/high contrast, reduced motion, low vision/contrast simulation and coarse pointer. Include mobile Calendar/Agenda, Outfit Builder non-drag reorder, Appearance selection, staged Filters and Bulk Import stage navigation.

# Russian UI Terminology

| Concept              | Recommended presentation                                                              | Why                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Home                 | `Главная`                                                                             | familiar top-level destination                                                                      |
| Wardrobe             | `Гардероб`                                                                            | natural owned-collection term                                                                       |
| Outfits              | `Образы`                                                                              | concise fashion vocabulary without luxury tone                                                      |
| Activity domain      | **`История`**                                                                         | factual and natural; avoids social/fitness meaning and laborious logbook tone                       |
| Activity page        | `История носки`                                                                       | clarifies the parent outside compact navigation                                                     |
| Calendar             | `Календарь`                                                                           | familiar factual view                                                                               |
| Insights             | `Статистика`                                                                          | clearer to a broad user than technical `Аналитика`; individual cards may be `Наблюдения`            |
| Create control       | **`Добавить`**                                                                        | umbrella launcher; plus supports but does not replace label                                         |
| Create sheet actions | `Добавить вещь`; `Создать образ`; `Отметить носку`                                    | precise verb/object pairs                                                                           |
| Wear today           | **`Отметить носку сегодня`**                                                          | records a fact; unlike `Надеть сегодня` it is not a plan, unlike `Носил сегодня` it is not gendered |
| ClothingItem         | `Вещь`                                                                                | plain language; explanatory copy may say `одна физическая вещь`                                     |
| Outfit Builder       | `Собрать образ`                                                                       | task-oriented and familiar                                                                          |
| AppearanceVariant    | `Внешний вид`                                                                         | describes selectable appearance without exposing technical `variant`                                |
| ImageView            | `Ракурс`                                                                              | values `Спереди`, `Сзади`, `Сбоку`, `Деталь` preserve the semantic distinction                      |
| WearEvent            | `Запись о носке`; compact `Носка`                                                     | clear record language                                                                               |
| No recorded wear     | `Нет отмеченных носок за выбранный период`                                            | does not claim the item was never worn                                                              |
| Archive / Restore    | `Убрать в архив`; `Вернуть из архива`; status `В архиве`                              | calm reversible lifecycle language                                                                  |
| Hard delete          | `Удалить безвозвратно`                                                                | unmistakably different from Archive                                                                 |
| Favorite             | `В избранное`; `Убрать из избранного`                                                 | action/state is explicit beyond heart fill                                                          |
| Draft                | `Черновик`; `Сохраняется…`; `Черновик сохранён`; `Не сохранено`; `Конфликт изменений` | shared approved draft semantics                                                                     |
| Bulk Import          | `Импортировать гардероб`                                                              | onboarding remains `У меня уже есть цифровой гардероб`                                              |

Recommended mobile labels: **Главная · Гардероб · Образы · История**, with separate **Добавить**. The underlying IA remains Home / Wardrobe / Outfits / Activity → Calendar + Insights.

# Visual References

Do not copy one product. Use a blend of reference qualities:

- editorial whitespace that gives a garment room without turning navigation into a magazine;
- premium product-imagery discipline: stable ratios, neutral mats, consistent scale and restrained labels;
- modern native-app density: reachable controls, short headers, direct sheets and clear pressed states;
- utility-level clarity: visible search/filter scope, calm error recovery and explicit draft/confirmation states;
- private personal-tool tone: no social counters, feed gestures, marketplace price emphasis or public-profile cues.

Any future product reference must name the specific quality being evaluated—image grid, spacing, motion or control anatomy—and must not import unrelated brand language or interaction patterns.

# Design Risks

| Risk                                      | Visual consequence                                        | Mitigation                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| UI competes with clothing images          | garment color/form loses priority                         | warm neutrals, accent only for actions/states, large fixed image zones, diverse-garment visual QA            |
| Too generic SaaS                          | product feels like a metrics tool                         | no KPI wall, excessive pills, gradient brand field or generic nested cards; use collection/editorial layouts |
| Too fashion/editorial                     | actions become ambiguous or precious                      | one readable sans family, compact headers, plain verbs, visible states and utility density                   |
| Excessive card nesting                    | fragmented noisy surfaces                                 | whitespace/dividers first; cards only for discrete reusable objects                                          |
| Accent conflicts with garments            | selection or CTA disappears beside green/colorful clothes | keep action on separate Canvas/Surface, verify contrast, do not overlay accent directly on imagery           |
| Low-contrast premium neutrals             | inaccessible labels/controls                              | token-level contrast gates; tertiary minimum AA; Strong Border/Focus tokens for controls                     |
| Desktop becomes too dense                 | scan fatigue at 300 items and wide import tables          | cap content width, maintain 24px gutters/44px controls, scale via columns not micro-type                     |
| Mobile becomes too empty                  | excessive scrolling and hidden relationships              | 32px rhythm, compact lists/rails, omit empty modules, keep composition/context visible                       |
| Create resembles a social-media FAB       | wrong product tone and nav confusion                      | attached rounded-square action, shallow rise, same dock geometry, no circle/notch/camera/glow                |
| Appearance confused with Rакурс           | false variants and wrong outfit selection                 | image-radio Appearance cards; separate labeled thumbnail row for Rакурс; test real reversible item           |
| Outfit composition is inconsistent        | shoes/accessories dominate or disappear                   | predefined layout templates and scale bands; no free canvas; test 1–7+ item sets                             |
| Analytics becomes dashboard-heavy         | facts look like performance scores                        | one figure per section/card, printed scope/coverage, evidence links, no gauges/traffic lights                |
| Draft resembles committed content         | accidental trust in unfinished data                       | dedicated Draft Status and Resume treatment; explicit Save/Confirm remains                                   |
| Status relies on color                    | inaccessible or ambiguous state                           | icon + label + border/surface for every non-default state                                                    |
| Import appears finalized without evidence | false confidence in hypothetical mapping                  | mark source-dependent controls provisional; Source Audit gates their final design                            |
| Light-only feels incomplete               | expectation mismatch for some users                       | document the deliberate MVP choice and re-evaluate System theme with full asset/state audit later            |

# Open Visual Questions

1. Validate the selected mineral green against the real wardrobe's garment colors, transparent images, Selected Surface and all semantic states.
2. Test the attached `Добавить` control at 320–375px for reachability, accidental activation, label fit and social-app resemblance.
3. Validate `История` against `Активность` and `Журнал` in a short Russian terminology study; `История` is the Phase 3 recommendation.
4. Confirm Manrope Cyrillic rendering, required weights and final font delivery/licensing constraints before implementation.
5. Test the `Внешний вид` / `Ракурс` pattern with the known reversible item and an ordinary front/back-only item.
6. Use the mandatory Source Audit to validate image background, transparency, crop/scale variation and all source-dependent Bulk Import presentation.
7. Validate outfit composition templates with shoes, trousers, outerwear, one-piece items, small accessories and 7+ item outfits.
8. Determine from usability testing whether 300-item wardrobes need an explicit density preference; do not add it by default.
9. Choose exact compact chart forms only after testing narrow screens, color-vision conditions and table equivalence.
10. Confirm the final device/browser/network visual-validation matrix, including installed PWA, software keyboard and safe areas.
11. Re-evaluate a System dark theme only after complete image/status/contrast design exists; it is not MVP scope.
12. Detailed Import mapping, grouping, duplicate resolution, image reconciliation, source/catalog mapping and AppearanceVariant import handling remain provisional pending Source Audit.

# Phase 3 Acceptance Criteria

- [x] Visual language is coherent: quiet editorial utility with clothing as the visual focus.
- [x] The product avoids generic AI SaaS, social-feed and overdecorated fashion/luxury aesthetics.
- [x] Brand traits and their concrete interface effects are defined.
- [x] Three accent directions were compared; deep mineral green `#3E6658` is recommended.
- [x] Semantic light palette, interaction/status colors, contrast and non-color cues are defined.
- [x] MVP light-only decision is explicit; dark/System theme is deferred.
- [x] One Cyrillic-capable sans family and complete semantic type scale are defined.
- [x] 8px spacing, responsive grid, max widths, radius, borders, elevation and iconography are defined.
- [x] Image ratios, contain/crop rules, placeholders, loading/failure and outfit composition are defined.
- [x] Distinct Clothing, Outfit, Insight and Draft/Resume card systems are defined.
- [x] Button, form, filter, navigation, page-header and feedback systems include major states.
- [x] Appearance is visually distinct from Rакурс and remains subordinate to one Physical Item.
- [x] Outfit Builder has a clear structured editorial composition model and non-drag controls.
- [x] Calendar remains factual actual-wear-only and has a complete Agenda equivalent.
- [x] Insights remain evidence-first with period, population, coverage and accessible values.
- [x] Bulk Import visual shell follows approved stages while source-dependent details remain provisional.
- [x] Draft, general status, empty, loading, error and motion systems are defined.
- [x] Mobile and desktop share one system; detailed responsive transformations are specified.
- [x] Semantic tokens and a complete component inventory/state matrix exist.
- [x] All 15 required high-fidelity written screen specifications are present.
- [x] Visual accessibility targets meet WCAG 2.2 AA and include concrete audit conditions.
- [x] Russian terminology recommendation exists; `История` is selected for Activity presentation without changing IA.
- [x] No Phase 1/2 scope, entity, navigation, flow, draft, confirmation, Archive, Calendar or AI boundary was changed.
- [x] No application code, React/Next.js, CSS/Tailwind, database, API, backend or AI architecture was created.
- [x] Phase 4 has not started.

# Phase 3 Self-Review

The specification was critically checked and adjusted before completion.

- **Visual hierarchy:** each required screen has one dominant local action. Secondary and destructive actions are positionally separated and do not compete through color/scale.
- **Clothing focus:** garment imagery receives the largest stable regions. Accent is reserved for action/state, while cards avoid metric shells and permanent shadows.
- **Consistency:** interaction, selection, focus, draft, archive, processing, error and future AI states reuse the same token and cue logic.
- **Density:** desktop scales through 4–6 columns and multi-pane workspaces without shrinking controls; mobile omits empty modules and uses compact lists to prevent ornamental whitespace.
- **Fashion vs utility:** the initial risk of fashion-magazine ambiguity was corrected through one neutral sans, compact headers and explicit verbs; SaaS risk was corrected by removing KPI/card-wall patterns.
- **Create action:** a large floating circular option was rejected. The attached shallow-rise rounded square preserves the separate-action semantics without mimicking a social camera/feed.
- **Item hierarchy:** the apparent name-first/image-first tension is resolved visually: identity is first in semantic/header order, while the immediately following gallery remains the dominant visual area.
- **Appearance semantics:** image-radio Appearance cards and a separate Rакурс thumbnail row prevent one appearance's front/back from looking like different variants.
- **Outfit Builder:** free-drag canvas was rejected as complex and inaccessible; the structured board remains attractive, scalable and non-prescriptive.
- **Calendar/Insights:** no planning or AI content was introduced into Calendar; analytics uses coverage/evidence instead of performance scoring.
- **Accessibility:** early low-contrast-neutral risk was corrected with explicit AA text values, Strong Border and Focus tokens, non-color states, Agenda/table equivalents and reduced-motion rules.
- **Future AI:** the system already supports a restrained `AI‑предложение` state without changing global chrome or making chat foundational.
- **Scale:** 70 and 300 items are supported by stable multi-column collections/filter rail; 100 outfits by the same collection system; long wear history by month/agenda and progressive lists. Very large outfit compositions and a possible density preference remain validation questions, not silent scope additions.
- **Bulk Import:** only the approved staged shell is high-fidelity. Source-dependent controls remain explicitly gated by Source Audit.
- **Scope audit:** no application or technical architecture artifact was created, and no approved Phase 1/2 decision was rewritten.

Result: the Phase 3 visual/design-system package is approved and complete. The listed real-asset, narrow-screen, terminology and scale validations remain explicit downstream gates and do not reopen the approved visual architecture.
