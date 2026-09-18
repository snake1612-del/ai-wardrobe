# AI Wardrobe — Project State

**Дата:** 2026-09-18
**Статус:** Phase 8 approved: YES / Phase 9 approved: YES — APPROVE WITH WARNINGS / Phase 10 approved: YES — `APPROVE WITH WARNINGS` / production deployment: NOT RUN

# Current Phase

**Phase 10 — Bulk Import Source Audit & Contract Freeze — Source Audit complete / D-099 accepted / Bulk Import MVP implemented / technical gate PASS / external review `APPROVE WITH WARNINGS` / explicitly approved / production deployment NOT RUN**

# Completed

- Реализованы signup, login, local logout, generic password recovery и authenticated password replacement поверх Supabase Auth.
- Реализованы SSR cookie refresh, PKCE code callback и token-hash email confirmation routes с allowlisted redirects и явной передачей cookies в redirect response.
- Добавлен idempotent service-role-only `bootstrap_account`, создающий ровно один durable account и preferences после server-side `auth.getUser()`.
- Добавлены minimal protected `/app` shell и `/api/account`; account scope всегда выводится из verified identity, а client-provided `account_id` игнорируется.
- Authenticated HTML/API responses помечаются `private, no-store`; persistent owner marker закрывает перенос `ai-wardrobe:*` state между аккаунтами, а protected client content скрыт до owner binding.
- Обязательный server-only `APP_ORIGIN` задаёт Auth redirects и exact-origin CSRF contract; отсутствующий protocol и несовпадающие/spoofed host/protocol значения отклоняются.
- Unit suite расширен до 36 проверок; secret scanner распознаёт modern `SUPABASE_SECRET_KEY`, сканирует Markdown/CSS и выполняет synthetic regression fixtures.
- Browser suite расширен для real Mailpit→PKCE recovery, refresh rotation, expired session, same-profile account switch, hostile Server Action Origin и protected HTML headers.
- Post-remediation quality gate пройден: clean replay всех 11 миграций, DB lint, 51/51 pgTAP, database type generation без schema/type drift, typecheck, 26/26 Playwright desktop/mobile, accessibility и secret scan — PASS.
- Initial external Phase 7 review завершён с outcome `CHANGES REQUIRED` без P0/P1; документационный P2 и оба P3 исправлены. Repeat external review commit `544c089` завершён с outcome `APPROVE`, после чего пользователь явно утвердил Phase 7. Production deployment не запускался.
- Реализован первый non-AI Wardrobe vertical slice: create/read/edit draft и committed ClothingItem, favorite/unfavorite, archive/restore с immediate Undo, detail и responsive grid с bounded progressive `Показать ещё`.
- Добавлены deterministic server-side search и structured filters по category/subcategory reference, color, season, purpose/style/custom tag, lifecycle и favorite; URL state сохраняется через detail/edit.
- Реализована sparse AppearanceVariant metadata model: обычная вещь не получает variant row, а reversible item остаётся одной physical ClothingItem.
- Mutation scope выводится только из verified server account context; browser не выбирает account/user/owner. Reads выполняются user-context client под forced RLS.
- Migration 12 добавляет service-role-only aggregate commands с optimistic version, atomic typed relations, idempotent create reconciliation и narrow archive/restore audit events.
- Responsive UI показывает честный no-image placeholder, explicit draft/favorite/archive states, distinct empty/filtered-empty/loading/error/success/failure states, mobile full-height filter sheet, desktop filter rail и keyboard-accessible bounded progressive reveal.
- Initial independent Phase 8 review завершён с outcome `CHANGES REQUIRED`: P0 отсутствуют; P1/P2/P3 findings по inactive-account access, high-cardinality filters, draft archive, error normalization и accessibility исправлены.
- Phase 8 final gate после remediation: 12-migration clean replay, DB lint, 90/90 pgTAP, generated types без unexpected drift, 51/51 unit, 32/32 Playwright desktop/mobile, accessibility, hostile-Origin CSRF replay, User A/B isolation, secret scan и production build — PASS.
- Local WSL development origin разрешён только как canonical HTTP origin на loopback/RFC1918 адресе при `NODE_ENV != production` и `APP_ENV=local`; production path по-прежнему требует HTTPS.
- Phase 10 read-only Source Audit выполнен для подтверждённого двухчастного image-only wardrobe set: integrity/hashes, безопасный inventory, decode/dimensions, identifier/mapping gaps и duplicate candidates задокументированы без private filenames/content.
- Добавлен `docs/BULK_IMPORT_SOURCE_AUDIT.md` с accepted adapter `legacy-wardrobe-image-set/v1`, D-099 contract addendum, bounded issue/security/retention rules, sanitized fixture specification и acceptance checklist.
- Реализован Phase 10 Bulk Import MVP: private staged ZIP upload, bounded Prepare, canonical `aiw.bulk-import/1` manifest, Review/Resolve/Preview, sealed explicit Confirm, bounded per-record commit, partial retry, itemized Results и Storage-API cleanup.
- До sealed Confirm production-domain writes отсутствуют; account scope server-derived, exact-origin CSRF и known-ID User A/User B isolation сохраняются. Filename/hash/similarity не являются item identity, а ImageView и AppearanceVariant остаются отдельными измерениями.
- Phase 10 local gate пройден: format, lint, typecheck, 80/80 unit, clean replay 14 migrations, DB lint, 208/208 pgTAP, real Storage API integration, stable generated types, 40/40 Playwright desktop/mobile, accessibility, 32-table RLS inventory, secret scan, production build и `git diff --check` — PASS.
- Independent Phase 10 review завершён с outcome `APPROVE WITH WARNINGS`: P0/P1 отсутствуют; P2 по декларативному synthetic fixture, Review media-readiness polling и cross-project E2E state collision исправлены исполняемыми regressions и повторным 40/40 browser gate. Пользователь явно утвердил Phase 10 2026-09-18 с перечисленными ниже warnings.
- Реализован Phase 9 Private Media Foundation: authenticated TUS, private Storage RLS, server-derived immutable paths, quarantined validation/processing, три WebP rendition, authorized same-origin delivery и versioned gallery mutations.
- Phase 9 local gate пройден: clean replay 13 миграций, DB lint, 146/146 pgTAP, real Storage API integration, stable generated types, 65/65 unit, 36/36 Playwright desktop/mobile, accessibility, repository/browser-bundle secret scan, schema inventory и production build — PASS.
- Phase 9 external review outcome — `APPROVE WITH WARNINGS`; пользователь явно утвердил Phase 9 с перечисленными ниже ограничениями.

- Определены product vision, problems, target users, JTBD и core user loop.
- Описаны 19 ключевых journeys: onboarding, bulk import, manual/AI-assisted add, search, outfit creation/save/reuse, wear tracking, calendar, analytics, wishlist, declutter, packing, AI styling, weather recommendation, purchase checking, gap analysis и AI packing.
- Сформирована концептуальная модель сущностей и отношений без фиксации database schema.
- Разведены physical item, AppearanceVariant, ImageView/UI role и technical rendition.
- Разведены lifecycle, purpose, declutter intent, temporary availability и trip-scoped packing state.
- Зафиксированы историческая семантика WearEvent и защита от double counting.
- Определены functional requirements, dependencies, edge cases и product-level acceptance criteria по модулям.
- Определены границы MVP, V2, V3 и Future/Out of Scope.
- Зафиксированы AI product/safety principles, privacy, image management, portability, accessibility, PWA и failure-state requirements.
- Определены non-functional product requirements, risks, success metrics и конкретный MVP readiness checklist.
- Создан decision log с ключевыми решениями и последствиями.
- Проведён self-review на противоречия, дублирование, feature creep, преждевременную техническую детализацию и пропущенные сущности; найденные проблемы исправлены в PRD.
- Проведено внешнее product review; PRD и остальные recommended product decisions утверждены.
- AppearanceVariant подтверждён как обязательный минимальный MVP requirement на основании реальной двусторонней вещи исходного гардероба.
- Создан `docs/UX.md` с полной IA для MVP и направлением эволюции V2/V3.
- Зафиксированы mobile navigation из четырёх стабильных destinations плюс отдельный Create action и desktop navigation с persistent sidebar.
- Описаны Home, Wardrobe, search/filtering, Item, AppearanceVariant, images, Outfit Library/Builder/Detail, wear, Calendar, Insights, Archive, Settings, export/delete и onboarding.
- Staged Bulk Import interaction model дополнена результатами Source Audit: raw set не имеет manifest/stable item IDs, поэтому grouping, ImageView/AppearanceVariant и source/catalog reconciliation требуют явного Resolve; D-099 принят для Phase 10.
- Созданы screen inventory для MVP/V2/V3, 26 end-to-end user flows, content hierarchy, textual low-fidelity wireframes и responsive behavior matrix.
- Определены единые draft, confirmation, feedback, empty/loading/error/offline и accessibility models.
- Описаны lower-fidelity future surfaces для Assistant, Wishlist, Packing, weather, purchase checking, gap analysis и AI capture без расширения MVP.
- Выполнен Phase 2 self-review на навигационную перегрузку, contradictions, missing states, feature creep, historical integrity, responsive consistency и accessibility.
- Проведено внешнее UX review; Phase 2 утверждён и завершён.
- UX/IA decisions D-031–D-042 приняты со статусом Accepted — approved UX decision; source-dependent детали D-040 уточнены accepted D-099.
- Создан `docs/DESIGN_SYSTEM.md` с visual direction `quiet editorial utility`: fashion editorial × premium e-commerce × modern utility app.
- Выбран рекомендуемый deep mineral green accent `#3E6658`, warm light-only MVP palette и Manrope typography strategy с поддержкой кириллицы.
- Определены semantic color/type/spacing/grid/radius/border/elevation/icon/motion tokens и WCAG 2.2 AA visual constraints.
- Определены image ratios/contain rules, Clothing/Outfit/Insight/Draft card systems, navigation, buttons, forms, filters и status vocabulary.
- Разработан visual pattern `Внешний вид` через image-radio cards отдельно от `Ракурс` thumbnails.
- Разработан structured editorial board для Outfit Builder без сложного free-drag canvas и с non-drag actions.
- Созданы responsive visual rules и 15 high-fidelity written screen specifications для обязательных mobile/desktop surfaces.
- Проведён Phase 3 terminology review: рекомендуемый presentation label для Activity — `История`; IA Activity → Calendar + Insights не изменена.
- Проведено внешнее Phase 3 review; Visual Design / Design System утверждён и завершён.
- Visual decisions D-043–D-057 приняты со статусом Accepted — approved visual decision; обязательные downstream validation gates сохранены в Consequences.
- Исправлено typography/navigation противоречие: добавлен отдельный 12–13px Navigation Label token для коротких persistent icon+text labels с обязательной zoom/reflow validation.
- Уточнена anatomy mobile `Добавить`: centered plus в 48×48 rounded square, visible label внутри 64px dock на обычной ширине, постоянный accessible name и validated narrow-mode exception.
- Сохранена Image System architecture; real-asset image-mat validation остаётся открытым gate без random-crop workaround.
- Проведён Phase 3 self-review по visual hierarchy, clothing focus, consistency, density, fashion/utility balance, accessibility, future AI и scale.
- Создан `docs/ARCHITECTURE.md` с server-authoritative modular-monolith architecture для Browser/PWA, Next.js application, domain modules, PostgreSQL, Auth, private Storage и durable background jobs.
- Рекомендован stack Next.js App Router + React + TypeScript, Tailwind CSS под internal design-token/component layer, Supabase PostgreSQL/Auth/private Storage и Vercel deployment без привязки domain modules к hosting provider.
- Определены Presentation/Application/Domain/Data Access/Infrastructure boundaries, module dependency rules и pragmatic boundary Server Components / Server Actions / Route Handlers без создания public API.
- Зафиксирована multi-user ownership model с первого дня: verified server identity, explicit per-account ownership, application authorization и deny-by-default RLS; второй пользователь работает в том же продукте через независимый account.
- Описана private image architecture: authorized direct upload, staged validation, retained original, async versioned derivatives, short-lived authorized delivery и обязательная real-asset validation без destructive crop.
- Определена durable background-job strategy с persisted state, checkpoints, at-least-once-safe handlers и provider-neutral queue boundary; final runner остаётся implementation gate.
- Описана безопасная Bulk Import architecture `Upload → Parse → Validate → Normalize → Preview → User decisions → Confirm → Commit → Report`, record-level idempotency и bounded transactions.
- Обязательный Source Audit gate выполнен; exact contract, mapping/grouping, duplicate/image reconciliation, AppearanceVariant handling и synthetic fixture specification зафиксированы в accepted D-099 и реализованы в Phase 10 MVP.
- Определены transaction/concurrency, error/retry/idempotency, caching, PWA/offline, logging/observability, portability, export/deletion и backup/recovery boundaries.
- Создан `docs/SECURITY.md` с data classification, trust boundaries, Auth/AuthZ/RLS/Storage/upload/browser/API/secret controls, threat model и security testing requirements.
- Определён future server-only AI Gateway с OpenAI Responses API adapter direction, allowlisted tools, Structured Outputs, server-injected ownership, context minimization и eval-backed model routing; AI implementation не создавалась.
- Зафиксирована эволюция Personal Alpha → Closed Beta → Public Beta → Free/Premium SaaS, internal Entitlements boundary и future Household compatibility без реализации billing/subscriptions/sharing.
- Проведено внешнее architecture/security review; Phase 4 утверждён и завершён.
- Architecture/security decisions D-058–D-075 приняты со статусом `Accepted — approved architecture decision`; D-001–D-057 не изменены.
- Уточнена semantics direct Storage upload: механизм остаётся выбором между authenticated identity + per-operation RLS и bounded server-issued signed capability; общие authorization, staging, validation, completion и User A/B isolation invariants утверждены.
- Для Phase 5 зафиксировано разделение authenticated identity, personal ownership/account scope и будущего sharing/access; Household tables и совместный tenant сейчас не проектируются.
- Проведена проверка текущих технологических допущений по официальным документам Next.js, React, TypeScript, Tailwind CSS, Supabase, Vercel, OpenAI и browser/PWA APIs.
- Проведён Phase 4 architecture/security self-review: не найдено намеренного пути выбора tenant scope browser/model, выдачи privileged credential, public originals, неидемпотентного import retry или зависимости core app от AI.
- Создан `docs/DATABASE.md`: полный PostgreSQL data-model design из 31 application table с ER-моделью, data dictionary, типами, ключами, отношениями, constraints, lifecycle/archive/delete semantics и transaction boundaries.
- Разведены Auth identity, durable personal `account` ownership и future access grants; owner-scoped relationships усилены composite foreign keys, а RLS описан только как conceptual table-by-table matrix.
- Зафиксированы sparse AppearanceVariant model, раздельные media asset/binding/rendition, relational Outfit composition и immutable minimal WearEvent snapshot, сохраняющий выбранный variant.
- Спроектированы staged/idempotent Bulk Import, durable jobs, audit/export/account-deletion workflows, owner-scoped PostgreSQL FTS + trigram search, keyset pagination и initial index strategy.
- Проведён внешний database/data-model review; Phase 5 утверждён и завершён, D-076–D-088 переведены в `Accepted — approved data-model decision` без изменения D-001–D-075.
- MediaAsset optimistic concurrency version отделена от immutable source identity: source определяется `media_asset_id`, а current rendition — asset+kind; processor/rendition concurrency не создаёт новую logical source version.
- Зафиксирована individual ClothingItem hard-delete/import policy: отдельной tombstone table нет; current external mappings удаляются, ImportRecord live FKs очищаются, а минимальные Wear/import reports сохраняются до собственной retention/account deletion.
- Завершён аудит personal secondary FKs: replacement lineage и import evidence/provenance стали same-account; намеренно polymorphic locators явно не являются authorization evidence.
- Уточнено, что RLS определяет row eligibility, но не выдаёт browser direct mutation grant; invariant-heavy writes остаются за application command boundary.
- Generated ClothingItem search document ограничен same-row scalar data; relational category/tag/color/season labels ищутся структурно или bounded joins. Bulk Import реализован отдельно через accepted D-099 sealed-confirm boundary.
- Создан runnable Next.js 16 App Router repository на Node 24, pnpm, React 19.3, strict TypeScript, Tailwind 4 и зафиксированном lockfile.
- Реализованы semantic design tokens, Manrope Cyrillic font delivery, доступный root shell, development-only component route, manifest, framework error/loading/not-found states и safe health endpoint.
- Созданы modular-monolith boundaries для presentation, modules, platform policy, infrastructure adapters и UI primitives без реализации product features.
- Добавлены разделённые browser/user-context server Supabase clients; universal privileged client и service-role browser path отсутствуют.
- Созданы Supabase configuration, controlled reference seed и 10 migrations с ровно 31 application tables, `pg_trgm`, UUIDv4 defaults, approved constraints, composite ownership FKs, search/index foundation и archive/history-safe semantics.
- На всех personal tables включены и принудительно применяются deny-by-default RLS; authenticated browser role получает только явно перечисленные owner-scoped reads и ни одной прямой domain mutation capability.
- Созданы pgTAP database/RLS tests, Vitest unit tests, Playwright desktop/mobile smoke tests и axe accessibility checks.
- Созданы CI foundation, `README.md` и `docs/TESTING.md`; актуальные implementation decisions добавлены как D-089–D-095 со статусом pending Phase 6 review.
- Локально фактически пройдены frozen install, formatting, lint, typecheck, unit tests, production build и browser/accessibility smoke.
- Локально фактически пройдены clean Supabase reset всех 10 миграций с seed, DB lint, 37 pgTAP schema/constraint/RLS tests и повторная генерация Supabase TypeScript types без Git diff; предупреждение `MaxListenersExceededWarning` не повлияло на код завершения или generated output.

# Approved Product Decisions

Все перечисленные ниже source constraints и product decisions утверждены. Подробный статус каждого решения указан в `docs/DECISIONS.md`.

## Source-approved constraints

- Web/PWA first, mobile-first с полноценным desktop.
- Private by default; продукт должен допускать безопасную поддержку нескольких пользователей.
- AI усиливает работающий продукт и не является базой данных/foundation.
- Physical item не равен изображению и может иметь несколько внешних представлений.
- AI-generated image не является source of truth.
- AI metadata требует подтверждения; origin/confidence различаются.
- AI работает через controlled capabilities/tools, не получает direct DB access/full wardrobe dump.
- AI может создавать drafts; consequential writes требуют user action; destructive actions не автономны.
- Нет сложной multi-agent architecture на раннем этапе.
- Social, marketplace, AR/3D/complex try-on, own ML model и публичные профили не входят в ранний roadmap.
- После утверждения Phase 1 переходить к Phase 2 только по отдельному явному запросу пользователя.

## Approved product decisions

- MVP работает без AI; full offline-first также не входит в MVP.
- Ограниченный безопасный bulk import входит в MVP как activation requirement.
- Ownership/isolation является MVP release gate, а не будущей миграцией.
- AppearanceVariant, ImageView, UI role и rendition — разные понятия; минимальный user-facing AppearanceVariant flow входит в MVP.
- Пользователь может создать/импортировать variant, задать label/catalog images/ImageViews и выбрать его в Outfit Builder; OutfitItem/WearEvent сохраняют выбор, а wear/lifecycle/statistics остаются на physical item.
- Item metadata вводится прогрессивно; каждый saved item имеет различимый display name.
- Lifecycle, purpose, declutter intent, availability и packed state не объединяются в один status.
- Outfit slots помогают, но не запрещают layering, несколько аксессуаров или working draft.
- WearEvent хранит фактический состав на дату; изменение Outfit не переписывает прошлое.
- MVP calendar содержит фактические носки, а не будущие планы.
- Analytics имеет observation windows, явные populations и drill-down; unknown не равен zero.
- Archive — основной обратимый путь; hard delete отделён от lifecycle.
- Owned items и purchase/wishlist candidates строго различаются.
- Ручные wishlist/packing/declutter domains предшествуют advanced AI.
- Экспорт и account/data deletion входят в MVP как trust features.
- Accessibility target WCAG 2.2 AA является release criterion.

# Phase 2 Approved UX Decisions

Решения D-031–D-042 утверждены по итогам Phase 2 review:

- четыре MVP domains: Home, Wardrobe, Outfits, Activity; Create — отдельный action layer;
- mobile bottom navigation из четырёх destinations, desktop persistent sidebar;
- Home как приоритизированная continuation surface;
- единая semantics фильтров при mobile staged sheet и desktop instant rail;
- Outfit Builder с composition + picker;
- общая recovery vocabulary для drafts и domain-specific final confirmation;
- сила подтверждения зависит от reversibility/ambiguity;
- actual-wear-only Calendar с полноценным agenda equivalent;
- staged Bulk Import interaction model утверждена, а source-audited mapping/grouping/duplicate/image/source/catalog/AppearanceVariant handling принята в D-099;
- future AI contextual-first и draft-only для consequential writes;
- responsive layouts сохраняют meaning, state и return context.

# Phase 3 Approved Visual Decisions

Решения D-043–D-057 утверждены по итогам внешнего Phase 3 review:

- visual direction `quiet editorial utility`; реальные вещи остаются visual hero;
- deep mineral green `#3E6658` как restrained accent на warm neutral light palette;
- light-only MVP; dark/System theme отложена;
- Manrope как единая UI typography family и отдельный Navigation Label token;
- 8px spacing, adaptive 4/8/12-column grid и content max width около 1400px;
- 8/12/16px radii, subtle borders и functional elevation;
- 4:5 contained garment imagery и deterministic outfit compositions;
- content-specific Clothing/Outfit/Insight/Draft card systems;
- attached central `Добавить` action без semantics navigation destination/FAB;
- `История` как рекомендуемый русский presentation label для Activity;
- image-radio `Внешний вид` отдельно от thumbnail `Ракурс`;
- structured editorial Outfit Builder;
- shared non-color Draft/Status grammar;
- restrained reduced-motion-complete microinteractions;
- responsive visual transformations сохраняют semantics/accessibility.

# Not Implemented

**Phase 8 Wardrobe Core, Phase 9 Private Media Foundation и Phase 10 Bulk Import MVP реализованы локально; перечисленные ниже capabilities остаются вне scope.**

- Remote Supabase project не создавался; migrations и RLS/grants проверены только в локальном development stack.
- Social/OAuth providers, MFA, onboarding/profile collection и production email delivery не реализованы.
- Production queue runner и schedules не создавались; локальные media/import workers используют существующую durable jobs модель.
- AI prompts, tool schemas, provider calls и model implementation не создавались.
- Onboarding, Outfit Builder, Wear, Calendar и Insights не реализованы. Wardrobe UI/CRUD, private media и Bulk Import ограничены утверждёнными Phase 8–10 slices.
- Product high-fidelity screens и interactive prototype не реализованы; foundation shell не является продуктовым экраном.
- Full PWA service worker/offline behavior и внешние integrations не реализованы; private Storage/media/import pipelines существуют только в локально проверенном Phase 9–10 scope.
- Supabase/Vercel/OpenAI projects, buckets, queues, environments, credentials и deployment не создавались.
- Production deployment не создавался и не выполнялся.
- Конкретные AI model, weather/email/billing providers и production job runner не выбраны/не реализованы.
- Никакие пользовательские данные не импортированы и не изменены.

# Known Risks

- Реальный цифровой архив может не соответствовать предполагаемому import format.
- Import review может стать слишком тяжёлым и сорвать activation.
- Item/image/variant ambiguity может создать дубликаты и неверную статистику.
- Слишком большое число metadata-полей повышает стоимость ведения.
- Пользователь может не сформировать привычку wear logging.
- Неполная история может сделать insights вводящими в заблуждение.
- Изменяемые outfits без event snapshot могли бы разрушить историю; PRD требует snapshot semantics.
- Медленные image grids особенно опасны на мобильной сети.
- AI может дать слабую рекомендацию или представить выдуманную вещь как owned; для V2 установлены grounding gates.
- AI cost/latency может превысить utility.
- Cross-user data leak имеет критическое влияние даже при низкой вероятности.
- Feature creep со стороны wishlist, packing, AI и visualizations может сорвать core MVP.
- Bounded progressive Wardrobe reveal ограничен 960 результатами ниже Data API row ceiling; до beta для больших каталогов требуется keyset pagination и representative performance validation.
- Неопределённая hard-delete/backup policy может конфликтовать с portability/privacy promise.

# Required Before Final Bulk Import UX

До окончательного проектирования Bulk Import UX обязателен read-only аудит реального исходного набора:

- существующие item IDs;
- исходные фотографии;
- catalog images;
- front/back и другие ImageViews;
- AppearanceVariants и их связь с одной physical item;
- usage notes;
- naming conventions;
- точные и вероятные дубли.

Аудит завершён 2026-09-18 и зафиксирован в `docs/BULK_IMPORT_SOURCE_AUDIT.md` и accepted D-099. Он подтвердил image-only source без manifest/stable item IDs; реализованный MVP поэтому требует явного Resolve и sealed Confirm. Минимальный AppearanceVariant flow не пересматривается.

# Open Questions

1. Source Audit contract закрыт accepted D-099: два image-only ZIP, 255 assets, без manifest/stable item IDs/source-to-catalog mapping; реальные private bytes не входят в repository или tests.
2. Historical wear/usage text в source отсутствуют; WearEvents не импортируются и не синтезируются.
3. Как учитывать физические комплекты, части которых могут носиться отдельно.
4. Scope и SLA удаления operational data/backups (обязательно до реальных MVP-данных); допустимые data regions и AI providers (до AI V2).
5. Нужна ли AI conversation history по умолчанию или только явно сохранённые recommendations.
6. Нужен ли reversible undo whole import batch после появления зависимых outfits/events.
7. Нужен ли full offline capture/queued wear в V2 на основании реального использования.
8. Финальная target device/browser/network matrix для MVP acceptance.
9. Usability/accessibility validation четырёх mobile destinations и отдельного Create control.
10. Финальный localized navigation label для родительского раздела Calendar + Insights: утверждённая Phase 3 recommendation — `История`; дополнительная terminology usability validation остаётся полезной и не меняет IA.
11. Проверка AppearanceVariant helper copy на реальной reversible вещи и ordinary front/back-only вещи.

# Phase 3 Open Visual Questions

1. Проверить approved mineral green accent/focus/status direction на реальных фотографиях гардероба и transparent assets.
2. Протестировать attached `Добавить` на ширинах 320–375px: reachability, label fit, accidental activation и отсутствие social-app association.
3. Валидировать approved presentation recommendation `История` против `Активность` и `Журнал` в коротком terminology test, не меняя IA.
4. Подтвердить Manrope Cyrillic rendering, необходимые weights и delivery/licensing constraints до implementation.
5. Протестировать `Внешний вид` / `Ракурс` на подтверждённой reversible вещи и ordinary front/back item.
6. Проверить outfit composition templates на shoes, trousers, outerwear, accessories и 7+ items.
7. Решить по usability evidence, нужен ли density control для гардероба из ~300 вещей.
8. Выбрать exact compact chart forms после narrow-screen/color-vision/table-equivalence validation.
9. Source Audit завершён, D-099 принят, а implemented Import controls требуют final usability/accessibility validation.
10. Dark/System theme остаётся deferred до полного asset/state/contrast audit.

# Phase 4 Open Technical Questions

1. Exact Supabase data region и Vercel compute region; решение требуется до production с отдельным privacy/residency review.
2. Final durable job runner/queue и image-processing runtime; Supabase Queues и Vercel Queues/Workflow остаются implementation candidates, не domain dependencies.
3. Direct private upload mechanism: authenticated Storage operation with current identity/RLS или server-issued signed upload capability, включая provider TTL, scope, replay/exposure, cleanup и User A/B tests. Private derivative delivery отдельно остаётся выбором между signed Storage URL, authorized proxy или hybrid с явным TTL/cache/revocation behavior.
4. HEIC/HEIF support and conversion policy; unsupported format должен давать явный fallback.
5. Exact database access split: user-context Data API, server-side pooled SQL или контролируемое сочетание при сохранении RLS context.
6. Export package/versioning, large-export generation и expiry behavior.
7. Production backup/deletion SLA, approved RPO/RTO и отдельная Storage-object recovery strategy.
8. Security scanning/isolation для untrusted images и import archives.
9. Source Audit implications зафиксированы accepted D-099; final external review и implementation validation остаются gates.
10. Exact browser/device/PWA matrix, которая также определяет поддерживаемый Tailwind major и local-draft behavior.
11. Future Entitlements остается internal module или позже синхронизируется с external billing source; billing сейчас не проектируется.
12. Future AI provider region/retention/data controls и необходимость ZDR/MAM до image/context processing.

Эти вопросы не отменяют утверждение Phase 4 или завершение design work Phase 5, но остаются явными gates соответствующих implementation/production/future-AI решений.

# Phase 5 Open Database Questions

1. Local baseline закрыт D-095: PostgreSQL 17 + UUIDv4. Exact production Supabase version/region остаются deployment gate.
2. Какая text-search language configuration и какие trigram thresholds подтверждает representative Russian/English dataset.
3. Foundation baseline закрыт D-095 минимальным controlled category/color/season seed; расширение taxonomy/localization остаётся evidence-driven.
4. Foundation split закрыт D-091: user-context RLS reads + trusted transactional commands, без broad browser mutations; exact pooled driver/RPC mechanism выбирается с первым invariant-heavy command.
5. Каковы retention сроки для Wear/import history, idempotency records, import staging/assets, failed jobs, audit events, exports и deletion-workflow evidence.
6. Proposed D-099 фиксирует adapter/schema, issue codes, mappings и archive bounds; exact typed staging constraints проверяются перед migration после approval.
7. Какие exact account/data deletion SLA, backup exclusions и минимальные неперсональные completion records допустимы.
8. Поддерживается ли HEIC/HEIF и где выполняются validation/conversion.
9. Какой direct private Storage upload mechanism и object-key/RLS layout пройдёт User A/B review.

Open Questions предыдущих фаз сохранены выше; их наличие не блокирует review/approval Phase 5, если вопрос явно обозначен downstream gate.

# Phase 6 Open Implementation Questions

1. Повторить clean Supabase reset, DB lint, pgTAP и type generation в CI и получить обязательный внешний Phase 6 review; локальный gate пройден 2026-09-15.
2. Какой exact pooled PostgreSQL driver/transaction adapter будет использован первым invariant-heavy command, не меняя D-091.
3. Когда official Next lint stack объявит ESLint 10 compatibility и позволит снять временный ESLint 9 gate.
4. Production Supabase/Vercel region, backup/deletion SLA, private upload/delivery model, job/image runner и target browser/PWA matrix остаются release/feature gates.
5. Search ranking/trigram thresholds и reference vocabulary требуют representative synthetic/approved data; import tests используют только D-099 synthetic fixture, не реальные private archives.

# Phase 7 Acceptance Checklist

All technical criteria below passed the post-remediation application, database and desktop/mobile browser gates. The initial external-review findings were remediated, repeat external review approved commit `544c089`, and the user explicitly approved Phase 7. Production deployment remains a separate, incomplete gate.

- [x] Signup and password login use provider Auth without creating a browser-authorized account write path.
- [x] Login failures do not disclose whether an email exists.
- [x] Password recovery returns the same success message for known and unknown addresses.
- [x] Recovery token exchange and password replacement require a verified server-side session.
- [x] PKCE callback consumes the code server-side and removes it from the destination URL.
- [x] Callback/recovery redirects allow only `/app`, `/app/*` and `/auth/update-password`.
- [x] Session refresh is performed in the request proxy with cookie propagation.
- [x] Missing, malformed and expired session material cannot open `/app` or `/api/account`.
- [x] Protected HTML/API responses use `Cache-Control: private, no-store`.
- [x] Cookie-backed Server Action mutations require an exact same-origin `Origin`/host/protocol match.
- [x] Account bootstrap runs only after `auth.getUser()` verifies the subject.
- [x] Bootstrap is idempotent and race-safe on unique `accounts.auth_user_id`.
- [x] Bootstrap creates account preferences and returns the existing durable account on retry.
- [x] `anon` and `authenticated` cannot execute the bootstrap function; only `service_role` can.
- [x] Account API derives scope from verified identity and ignores client account identifiers.
- [x] User A cannot read User B account/item/search rows under RLS.
- [x] Operational export/deletion/job tables remain outside ordinary authenticated grants.
- [x] Logout clears the local Auth session and `ai-wardrobe:*` local/session state.
- [x] Account switching clears user-scoped browser state before binding the next subject.
- [x] Desktop and mobile browser flows pass automated accessibility checks.
- [x] No onboarding, wardrobe CRUD, Storage, export/delete workflow or unrelated product scope was added.
- [x] Initial external Phase 7 review completed with outcome `CHANGES REQUIRED` and no P0/P1 findings.
- [x] Repeat external review approved commit `544c089`.
- [x] Phase 7 approved by explicit user decision.
- [ ] Production deployment — NOT RUN.

# Phase 8 Acceptance Checklist

Technical criteria below passed locally on 2026-09-17. Independent review findings were remediated, the repeat review passed and Phase 8 is explicitly approved. Production deployment remains a separate incomplete gate.

- [x] Authenticated user can create, reopen and edit committed or incomplete draft ClothingItem records.
- [x] One physical item remains one ClothingItem; AppearanceVariant rows are sparse label metadata subordinate to that item.
- [x] Favorite/unfavorite and archive/restore are optimistic-versioned; archive never deletes the row, exposes immediate Undo and restore reuses the same ID.
- [x] Category IDs and controlled color/season IDs are revalidated by the server command; hierarchy remains the single category reference plus its controlled parent.
- [x] Purpose/style/custom tags are owner-scoped, deduplicated on active normalized identity and filterable without cross-account reuse.
- [x] Deterministic server-side search and filters cover category, color, season, tag, lifecycle and favorite; active items are the default.
- [x] Search/filter state is private-bookmarkable and preserved through Item detail, favorite and edit/save/cancel paths.
- [x] Wardrobe grid is responsive and accessible, with explicit draft/favorite/archive states, honest no-image placeholders and bounded keyboard-accessible progressive reveal.
- [x] Empty, filtered-empty, loading, success, validation/conflict failure and route error states are implemented.
- [x] Reads use verified user context plus forced RLS; service-role mutation commands receive only a server-derived account ID.
- [x] `anon` and `authenticated` cannot execute wardrobe mutation functions or directly mutate domain tables.
- [x] Known foreign UUID read and mutation attempts fail; automated User A/User B browser and pgTAP isolation pass.
- [x] Cookie-backed mutations retain exact-origin protection; a real hostile-Origin Server Action replay does not change the database.
- [x] Protected Wardrobe HTML/RSC remains behind `/app` auth enforcement and `Cache-Control: private, no-store`.
- [x] Create retry with the same server-generated item ID reconciles without duplicating or rewriting the aggregate.
- [x] Restricted/deleting accounts cannot read Wardrobe routes or rows; the shared layout and RLS account resolver both require active account state.
- [x] Search and relational filters execute through a bounded authenticated `SECURITY INVOKER` RPC; high-cardinality regression proves the result is not silently truncated at 1000 relation rows.
- [x] Draft items cannot be archived in either UI or database command; foreign/missing IDs share the same non-revealing result class.
- [x] Clean replay of all 12 migrations, DB lint, 90/90 pgTAP, generated DB types, typecheck, 51/51 unit, 32/32 Playwright desktop/mobile, accessibility, secret scan and production build pass.
- [x] At the Phase 8 gate, Source Audit availability was checked read-only and no archive was then supplied; Phase 10 later performed the separately documented audit without changing Phase 8.
- [x] Bulk Import, private Storage, images, onboarding, Outfit Builder, Wear, Calendar, Analytics, export/delete execution, AI and Phase 9 were not implemented.
- [x] Independent external review — COMPLETED; initial `CHANGES REQUIRED` findings and the final local-origin/documentation findings were remediated, and repeat review outcome is `APPROVE`.
- [x] Phase 8 approved — YES.
- [ ] Production deployment — NOT RUN.

# Next Step

**Опубликовать approved Phase 10 snapshot в отдельной ветке и открыть Pull Request. Merge и production deployment требуют отдельного разрешения; Phase 11 не начинать.**

# Gate

**Phase 8 is approved. Phase 9 is approved with warnings. D-099 is accepted; Phase 10 Bulk Import MVP technical gate passed, external review outcome is `APPROVE WITH WARNINGS`, and Phase 10 is explicitly approved. Production deployment is NOT RUN.**

# Phase 9 Acceptance Checklist

The checklist records the verified local gates for Private Media Foundation. Technical implementation and review items passed; approval and production deployment remain separate explicit gates.

- [x] Upload intent derives the active account server-side and returns only a server-selected immutable `wardrobe-originals` object path.
- [x] Browser upload uses authenticated Supabase TUS with the current user JWT, no signed upload URL and no persisted cross-account resume capability.
- [x] Private `wardrobe-originals` and `wardrobe-renditions` buckets enforce Storage RLS; anonymous access, cross-account known paths, overwrite, original reads and direct rendition writes are denied.
- [x] Completion verifies the exact object via Storage API, is idempotent/replay-safe and schedules one validation job.
- [x] Only JPEG, PNG and WebP pass magic-byte, full decode, single-frame, 12,000-axis and 40-megapixel validation; HEIC/HEIF, SVG, GIF, AVIF, PDF, fake MIME and corrupt payloads fail safely.
- [x] An isolated pinned sharp/libvips worker supports bounded lease/retry/crash recovery and creates immutable `media-v1` WebP thumbnail, medium and full renditions.
- [x] Unconfirmed, failed or quarantined uploads never become production-ready media.
- [x] Authorized same-origin rendition delivery re-verifies user/account/RLS and returns `private, no-store` and `nosniff`; originals have no browser delivery path.
- [x] Gallery primary/reorder/replace/remove preserve entity boundaries, optimistic concurrency and ready-only publishing; archiving a ClothingItem does not delete media.
- [x] Cleanup marks unreferenced assets/renditions pending delete and reconciles objects only through Storage API, never direct SQL writes to `storage.objects`.
- [x] Loading, progress, retry, failed, quarantined, ready and accessible placeholder states work on desktop and mobile.
- [x] Unit, pgTAP, real Storage API integration, User A/User B known-ID, anonymous, CSRF, TUS retry/replay, worker and cache-header tests pass.
- [x] Browser bundle and repository secret scans pass; service-role credentials remain server/worker-only.
- [x] Generated database types match migration 013 with no unexpected drift.
- [x] At the Phase 9 approval gate, Bulk Import implementation and later product scope were not present.
- [x] External review — `APPROVE WITH WARNINGS`; implementation-pass findings were remediated and no blocking findings remain.
- [x] Phase 9 approved — YES by explicit user decision on 2026-09-18.
- [ ] Production deployment — NOT RUN.

## Accepted Phase 9 Warnings

- Hosted Supabase Storage and a production worker scheduler were not validated because production deployment is not authorized.
- General antivirus is not part of the allowlisted manual-image scope; protection is limited to format allowlisting, magic-byte/full-decode validation, bounded dimensions/pixels and safe WebP re-encoding.
- Database type generation may emit the known nonfatal `MaxListenersExceededWarning`; repeated generation is byte-for-byte stable.
- These are documented constraints of the approved phase and do not authorize AV work or production deployment.

# Phase 10 Acceptance Checklist

- [x] Real source archives were audited read-only outside Git; only safe totals, hashes, classifications and a fully fictional executable fixture are retained.
- [x] D-099 is accepted; the only adapter is `legacy-wardrobe-image-set/v1`, with canonical internal manifest `aiw.bulk-import/1`.
- [x] Choose → Prepare → Review → Resolve → Preview → Confirm → Results is implemented with explicit loading, issue, conflict, partial failure and retry states.
- [x] Private staged archive upload uses authenticated Storage RLS and server-derived opaque account/session/part paths.
- [x] Prepare rejects traversal, links/devices, executable entries, encryption, nested archives, normalized path collisions, unsupported compression and bounded size/count/ratio violations.
- [x] JPEG/PNG bytes require magic match, full single-frame decode and Phase 9 dimension/pixel limits before staging.
- [x] No ClothingItem, MediaBinding, AppearanceVariant or WearEvent is written before a sealed, revision-bound explicit Confirm.
- [x] Filename, timestamp, UUID, ZIP order, content hash and visual similarity are not accepted as physical-item identity.
- [x] ImageView and AppearanceVariant remain separate; usage notes never create WearEvents.
- [x] Create/link/update/skip decisions are explicit; update requires an owner-scoped target and optimistic item version.
- [x] Per-record commit keys, terminal outcomes and replay-safe Confirm prevent duplicate records; retry targets failed records only.
- [x] Partial success yields an itemized report; cleanup and reconciliation use Storage API rather than direct SQL object mutation.
- [x] Anonymous and known-ID User A/User B reads/writes are denied; browser ownership fields are rejected and exact-origin CSRF is required.
- [x] Synthetic unit, archive-security, pgTAP/RLS, real Storage API, integration, Playwright/accessibility, hostile-Origin/IDOR and secret/path-leak tests exist.
- [x] Full final quality gate — PASS; exact results are recorded in `docs/TESTING.md`.
- [x] Independent external review — `APPROVE WITH WARNINGS`; no P0/P1/P2 remains open.
- [x] Phase 10 approved — YES by explicit user decision on 2026-09-18.
- [x] Implementation commit, branch push and Pull Request — explicitly authorized for this approved snapshot.
- [ ] Production deployment — NOT RUN.
- [ ] Phase 11 — NOT STARTED.

## Phase 10 Review Warnings

- Hosted Storage, production worker scheduling and operational cleanup evidence were not validated because production deployment is not authorized.
- The worker bounds expanded entries and iterates them one at a time, but currently downloads each compressed archive part into worker memory; production sizing must respect the documented 1 GiB aggregate input limit or introduce a separately reviewed streaming spool design.
- Database type generation may emit the inherited nonfatal `MaxListenersExceededWarning`; repeated Phase 10 output was byte-for-byte stable.
- The real source archive has no stable item IDs; Resolve therefore remains an explicit manual grouping/mapping boundary and does not infer identity from filenames, order, hashes or visual similarity.
