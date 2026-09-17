# AI Wardrobe — Product Decision Log

**Фаза:** Phase 1 — Product Requirements; Phase 2 — UX / Information Architecture; Phase 3 — Visual Design / Design System; Phase 4 — Technical Architecture; Phase 5 — Database / Data Model  
**Дата:** 2026-09-15  
**Статус:** Phase 1 Approved; Phase 2 Approved / Complete; Phase 3 Approved / Complete; Phase 4 Approved / Complete; Phase 5 Approved / Complete

Статусы:

- **Accepted — source constraint:** прямо задано владельцем продукта.
- **Accepted — approved product decision:** профессиональное решение Phase 1, утверждённое вместе с PRD.
- **Accepted — approved UX decision:** UX/IA-решение утверждено по итогам внешнего Phase 2 review.
- **Accepted — approved visual decision:** visual/design-system решение утверждено по итогам внешнего Phase 3 review.
- **Accepted — approved architecture decision:** architecture/security решение утверждено по итогам внешнего Phase 4 review.
- **Accepted — approved data-model decision:** database/data-model решение утверждено по итогам внешнего Phase 5 review.
- **Deferred:** решение сознательно оставлено следующей фазе.

## D-001 — Web/PWA first

### Decision

Первый продукт — responsive mobile-first web/PWA с полноценной desktop-версией. Installability входит в продуктовый baseline.

### Why

Камера и быстрый wear logging требуют удобного телефона, а массовый import, фильтры и аналитика выигрывают от desktop. Один web/PWA surface уменьшает ранний scope.

### Alternatives considered

- Нативные iOS/Android приложения.
- Desktop-only web.
- Отдельные native mobile приложения одновременно с web.

### Consequences

Нужны context-specific permissions, responsive images и проверяемая browser matrix. Native-only функции не являются ранней зависимостью.

### Status

Accepted — source constraint.

## D-002 — Private by default with ownership from day one

### Decision

Все пользовательские данные и изображения приватны. Даже single-user-oriented MVP применяет ownership/isolation ко всем сущностям и AI retrieval.

### Why

Гардероб, фото, заметки, location и preferences чувствительны. Позднее добавление изоляции создало бы критический migration/security риск.

### Alternatives considered

- Локальный single-user prototype без account boundary.
- Публичные профили по умолчанию.
- Изоляция только при появлении второго пользователя.

### Consequences

Privacy и отсутствие cross-user access становятся release gates. Sharing/social не появляются без отдельного consent и product decision.

### Status

Accepted — source constraint.

## D-003 — AI is an enhancement, not the foundation

### Decision

Каталог, search, outfits, wear и analytics имеют самостоятельную ценность и не зависят от LLM. AI усиливает работающую систему данных.

### Why

AI не может компенсировать плохую идентичность вещей, import, search или wear history. Базовая полезность и graceful degradation обязательны.

### Alternatives considered

- AI chat как единственный главный product surface.
- AI metadata recognition как обязательный onboarding.
- Запуск stylist одновременно с каталогом.

### Consequences

AI outage/cost не должен блокировать базовые операции. Конкретная граница MVP фиксируется отдельным решением.

### Status

Accepted — source constraint.

## D-004 — Bulk import is an MVP activation requirement

### Decision

Ограниченный документированный bulk import с validate, preview, confirmation, duplicate protection, partial success и report входит в MVP.

### Why

Первичный пользователь уже имеет крупный цифровой архив. Ручное повторное создание вещей противоречит исходному сценарию и сорвёт активацию.

### Alternatives considered

- Отложить import в V2.
- Выполнить одноразовую скрытую миграцию без пользовательского preview.
- Поддержать любые форматы и папки сразу.

### Consequences

До implementation нужно исследовать реальный пакет. MVP поддерживает один согласованный format; универсальный self-service mapping развивается позже. External ID scoped к владельцу и источнику; повторный import показывает field-level diff и не перезаписывает user-confirmed data, primary image, lifecycle или связи без явного выбора. Import становится самостоятельным release gate.

### Status

Accepted — approved product decision.

## D-005 — Physical item is the unit of ownership and wear

### Decision

Одна ClothingItem соответствует одному физическому экземпляру. Два одинаковых экземпляра — две вещи; несколько изображений или способов выглядеть — не новые вещи.

### Why

Только физический экземпляр имеет корректные lifecycle, availability, price и wear count.

### Alternatives considered

- Item на каждое изображение.
- Одна запись с quantity для одинаковых вещей.
- Item на каждую сторону reversible garment.

### Consequences

Import и add flows должны отличать duplicate asset от отдельного физического экземпляра. Wear analytics агрегируется по physical item.

### Status

Accepted — source constraint.

## D-006 — Appearance variants and image views are separate concepts

### Decision

Выбираемый внешний вариант/сторона вещи отделяется от ракурса изображения front/back/side/detail.

### Why

Ракурс описывает asset; reversible side описывает, как одна физическая вещь использована в outfit. Смешение создаёт дубли и неоднозначную статистику.

### Alternatives considered

- Единая сущность одновременно для AppearanceVariant и ImageView.
- Две ClothingItem для двух сторон.
- Не поддерживать selectable appearance в product model.

### Consequences

Outfit/WearEvent может сохранить выбранный appearance, но wear count остаётся общим. Техническое имя сущности решается позже.

### Status

Accepted — approved product decision.

## D-007 — Image origin, role and rendition are independent

### Decision

Для изображения отдельно определяются происхождение, продуктовая роль и техническое представление. Catalog image не автоматически source of truth.

### Why

Один пользовательский original может быть catalog primary и иметь thumbnail/medium; AI visualization имеет другую степень доверия. Один `image_type` не выражает эту модель безопасно.

### Alternatives considered

- Единственный тип source/catalog/optimized/AI.
- Хранить только каталоговые картинки.
- Заменять original обработанным asset.

### Consequences

Нужны lineage, управляемый primary и предсказуемое удаление. Сетки используют derivatives, originals сохраняются согласно data policy.

### Status

Accepted — approved product decision.

## D-008 — AI-generated images never become evidence

### Decision

AI-generated outfit, flat lay, model или lookbook image всегда маркируется как производная визуализация и не подтверждает свойства/существование реального предмета.

### Why

Генерация может изменить форму, цвет, детали и пропорции, разрушая доверие к каталогу.

### Alternatives considered

- Использовать AI image как primary без маркировки.
- Извлекать metadata обратно из AI visualization.
- Не хранить lineage.

### Consequences

AI images вынесены в Future до отдельной проверки ценности, точности, privacy и стоимости; они отделены от source/evidence и не используются для распознавания metadata.

### Status

Accepted — source constraint.

## D-009 — Minimal metadata and progressive enrichment

### Decision

Working draft может быть неполным. Каждый saved active item получает стабильный различимый display name: пользовательский или нейтрально созданный системой; `uncategorized` без имени/изображения не создаёт пустую активную карточку. Остальные поля опциональны и дополняются позже.

### Why

Обязательное заполнение полного профиля делает capture и import неприемлемо тяжёлыми.

### Alternatives considered

- Все свойства обязательны.
- Обязательное ручное название для каждого item.
- AI auto-fill как обязательное условие сохранения.

### Consequences

Search/analytics обязаны корректно работать с unknown. System display name обеспечивает различимость и accessible label; completeness остаётся подсказкой, а не блокером.

### Status

Accepted — approved product decision.

## D-010 — AI metadata is a proposal until confirmation

### Decision

Для AI/imported field независимо различаются origin, review state и confidence. Effective trusted value появляется после принятия/исправления пользователем, но принятие не скрывает исходный origin.

### Why

Фото не гарантирует точное определение material, season, brand или других свойств. Молчаливые ошибки ухудшат search и recommendations.

### Alternatives considered

- Сохранять AI результат автоматически.
- Показывать общий confidence на всю вещь.
- Смешивать origin и confirmed/unreviewed state.

### Consequences

Пользовательский ввод имеет приоритет; повторный AI/import run не перезаписывает confirmed data. Confidence применяется только к машинной гипотезе и не превращает её в факт. Review добавляет шаг, поэтому AI capture появляется после MVP.

### Status

Accepted — source constraint.

## D-011 — Separate lifecycle, purpose, declutter intent and availability

### Decision

Не использовать один долгосрочный status для `active`, `sport`, `rarely used`, `want to sell` и `archived`. Развести lifecycle, purpose, declutter intent и temporary availability; rare/stale usage вычислять.

### Why

Эти признаки независимы: спортивная вещь может быть активной, временно в стирке и рассматриваться к продаже.

### Alternatives considered

- Один взаимоисключающий enum.
- Только свободные tags.
- Ручной статус «редко ношу» как источник аналитики.

### Consequences

MVP оставляет active/archived и purpose/tags. Declutter и availability добавляются позже без разрушения семантики. Фильтры формулируются явно.

### Status

Accepted — approved product decision.

## D-012 — Packed is trip-scoped before it affects availability

### Decision

Planned/packed — состояние строки конкретного packing list. Добавление вещи в будущую поездку само по себе не меняет глобальную availability.

### Why

Одна вещь может быть в нескольких планах; будущий список не означает физическую недоступность сейчас.

### Alternatives considered

- Глобально ставить `packed` при добавлении в список.
- Запрещать одну вещь в нескольких trips.
- Не различать planned и packed.

### Consequences

Для вывода недоступности понадобятся правила active trip и подтверждённой упаковки. Trip lifecycle `draft/upcoming/active/completed/cancelled` обязан снимать derived unavailability при завершении/отмене и сохранять историю. Это не часть MVP.

### Status

Accepted — approved product decision.

## D-013 — Outfit slots guide but do not constrain composition

### Decision

Semantic roles помогают selection и AI, но outfit остаётся гибким набором уникальных physical items с layering и несколькими аксессуарами.

### Why

Жёсткая схема top/bottom/one-piece не покрывает layered и нестандартные образы.

### Alternatives considered

- Ровно один item на slot.
- Полностью неструктурированный список.
- Невозможность сохранить неполный outfit.

### Consequences

Builder допускает autosaved working draft с 0+ items и soft warnings; явный Save при 1+ unique item создаёт saved outfit. Продукт не присваивает субъективную «полноту» автоматически. Один physical item не дублируется внутри outfit.

### Status

Accepted — approved product decision.

## D-014 — Wear events preserve the historical composition

### Decision

WearEvent фиксирует фактически надетые уникальные items и selected AppearanceVariant на дату; ссылка на mutable Outfit — только источник события.

### Why

Иначе редактирование outfit перепишет календарь, а item-only logging станет невозможным. Snapshot также предотвращает двойной счёт.

### Alternatives considered

- WearEvent хранит только outfit ID.
- Создавать новый outfit для каждой носки.
- Считать wear count из текущего состава outfit.

### Consequences

В продуктовой модели появляется логический WearEventItem/snapshot. Edit/delete event пересчитывает analytics; outfit editing не меняет прошлое.

### Status

Accepted — approved product decision.

## D-015 — MVP calendar contains actual wear, not future planning

### Decision

Calendar MVP показывает только подтверждённые фактические wear events. Будущий outfit plan — отдельное понятие и не влияет на wear analytics.

### Why

Смешение намерения и факта разрушает достоверность истории.

### Alternatives considered

- Единый event type без различения.
- Полный planning calendar в MVP.
- Автоматически превращать plan в wear.

### Consequences

Будущее планирование может появиться позже с явным confirm-as-worn. MVP calendar остаётся проще.

### Status

Accepted — approved product decision.

## D-016 — Analytics use explicit populations and cautious language

### Decision

Каждая метрика имеет период, eligible population, observation coverage и drill-down. `Never worn` заменяется на «нет зарегистрированных носок»; stale list требует полного observation window, unknown не равен zero, а cost per wear называется cost per recorded wear без подтверждённой lifetime-history.

### Why

История начинается не с покупки вещи и может быть неполной. Без определений insights вводят в заблуждение.

### Alternatives considered

- Простые totals без определения.
- Считать import notes фактом носки.
- Показывать cost per recorded wear при неизвестных данных.

### Consequences

Метрики показывают caveat/observation coverage. Cost per recorded wear требует цену, валюту и wear; vanity cards исключаются.

### Status

Accepted — approved product decision.

## D-017 — Archive is the normal removal path

### Decision

Archive/restore — основной обратимый lifecycle action. Hard delete отделён от archive и не должен разрушать историю незаметно.

### Why

Вещи связаны с outfits, events и analytics. Необратимое удаление легко повреждает контекст.

### Alternatives considered

- Hard delete из карточки как стандарт.
- Удалять связанные events каскадно.
- Не поддерживать восстановление.

### Consequences

Archived items скрыты из новых picker, но видны в истории. Точная individual-delete/tombstone policy остаётся открытой; account deletion охватывает всё.

### Status

Accepted — approved product decision.

## D-018 — Wardrobe Agent uses controlled capabilities, not direct DB access

### Decision

AI получает минимальные данные через разрешённые product capabilities/tools; LLM не получает прямой SQL-доступ и полный dump гардероба.

### Why

Это улучшает privacy, groundedness, auditability, cost и возможность проверять ownership/availability.

### Alternatives considered

- Полный JSON всех вещей в каждом prompt.
- Прямой SQL для LLM.
- Отдельная несогласованная логика для каждого AI surface.

### Consequences

Конкретные tool schemas откладываются до AI architecture. Все AI surfaces используют общие policies и validation.

### Status

Accepted — source constraint.

## D-019 — Draft before consequential AI write

### Decision

AI может автономно читать scoped data и создавать временные drafts. Постоянные writes требуют явного действия; destructive/mass actions AI самостоятельно не выполняет.

### Why

Пользователь должен контролировать каталог, preferences, packing и историю.

### Alternatives considered

- AI автоматически сохраняет рекомендации и metadata.
- Универсальное подтверждение один раз на все будущие actions.
- Автономное массовое расхламление.

### Consequences

Нужны preview, confirmation и undo где разумно. AI UX не должен маскировать draft под сохранённый факт.

### Status

Accepted — source constraint.

## D-020 — No complex multi-agent system initially

### Decision

Ранний AI — единый интеллектуальный слой с контролируемыми capabilities, а не сложная multi-agent architecture.

### Why

Multi-agent orchestration не создаёт ранней пользовательской ценности и увеличивает cost, latency и surface ошибок.

### Alternatives considered

- Отдельный agent на styling, import, packing и purchase с автономной координацией.
- Microservice-per-agent design.

### Consequences

Разделение ответственности реализуется продуктово через scopes/tools. Архитектурное усложнение возможно только после доказанного ограничения.

### Status

Accepted — source constraint.

## D-021 — Owned items and purchase candidates are distinct

### Decision

Wishlist/PurchaseCandidate не является ClothingItem до подтверждённой покупки/конвертации. AI визуально и семантически отделяет candidate/gap от owned inventory.

### Why

Это снимает конфликт между «AI рекомендует только реальные мои вещи» и purchase/gap сценариями.

### Alternatives considered

- Помещать wishlist в wardrobe со статусом not owned.
- Разрешить AI смешивать owned и suggested items в одном outfit.

### Consequences

Candidate не участвует в wear, utilization и обычном outfit builder. Hypothetical outfit с candidate допустим только внутри Purchase Checker и явно отделён от owned-only outfits; Grounded Stylist остаётся строго owned-only.

### Status

Accepted — approved product decision.

## D-022 — Manual domain precedes AI automation

### Decision

Wishlist, packing и declutter сначала должны работать как понятные ручные продукты; purchase/gap/packing AI строится поверх них позже.

### Why

AI не должен скрывать неразработанные состояния, действия и ownership rules.

### Alternatives considered

- Сразу AI packing без ручного списка.
- Gap analysis без coverage/history.
- Declutter только в форме AI chat.

### Consequences

Wishlist/manual packing/declutter входят не раньше V2, advanced AI — V3. Их journeys описаны сейчас, но не становятся MVP scope.

### Status

Accepted — approved product decision.

## D-023 — Feedback signals require confirmation to become preferences

### Decision

Like/dislike/too hot/too cold являются контекстными signals. Устойчивое правило становится UserPreference только после явного подтверждения; item-level `don't suggest` может быть сразу явным обратимым правилом.

### Why

Одна реакция зависит от конкретного образа и не доказывает постоянный вкус.

### Alternatives considered

- Каждый dislike немедленно меняет профиль.
- Не использовать implicit patterns вообще.
- Скрыто формировать preferences.

### Consequences

Нужны observation и confirmed preference semantics, управление/отмена правил и достаточный signal threshold, который определяется позже.

### Status

Accepted — source constraint.

## D-024 — Export and account deletion are MVP trust features

### Decision

MVP предоставляет переносимый export каталога/отношений/изображений и понятный account/data deletion flow.

### Why

Пользователь переносит ценный личный архив. Lock-in и неясное удаление несовместимы с private-by-default обещанием.

### Alternatives considered

- Export и deletion после beta.
- Только CSV без изображений/отношений.
- Ручное удаление через поддержку.

### Consequences

Формат должен сохранять identities и связи; scope/SLA удаления operational data и backups утверждаются до приёма реальных MVP-данных и раскрываются пользователю. Детальная реализация остаётся architecture task.

### Status

Accepted — approved product decision.

## D-025 — Accessibility is a product release criterion

### Decision

Основные flows ориентируются на WCAG 2.2 AA; image-first builder/calendar не могут быть drag-only или color-only.

### Why

Accessibility нельзя надёжно добавить после фиксации interaction model; premium-визуал не должен ухудшать использование.

### Alternatives considered

- Best effort после MVP.
- Исключительно touch/drag builder.
- Изображения без текстовой идентичности.

### Consequences

UX phase обязана предусмотреть keyboard alternatives, agenda calendar, focus, labels, contrast и async announcements.

### Status

Accepted — approved product decision.

## D-026 — Early exclusions remain explicit

### Decision

Social network, followers, public profiles, marketplace, AR fitting, complex virtual try-on, 3D avatar, own ML model, complex multi-agent system и microservice agenda не входят в MVP/V2/V3 без нового decision.

### Why

Они не нужны для core loop, несут непропорциональные risk/cost и создают feature creep.

### Alternatives considered

- Использовать social/marketplace как growth loop с первого релиза.
- Включить virtual try-on в AI differentiation.
- Закрепить техническую архитектуру до product validation.

### Consequences

Future exploration допустим только после отдельного discovery и business case; roadmap не создаёт скрытых зависимостей.

### Status

Accepted — source constraint.

## D-027 — Explicit phase gate before UX/IA

### Decision

Phase 2 — UX / Information Architecture требует утверждённого PRD и отдельного явного запроса пользователя; approval Phase 1 не запускает следующую фазу автоматически.

### Why

IA и flows должны опираться на согласованные boundaries, concepts и release scope, а смена фазы должна оставаться явным управленческим действием.

### Alternatives considered

- Параллельно проектировать UI.
- Автоматически продолжить после создания документов.

### Consequences

Phase 1 теперь Approved / Complete, но Phase 2 остаётся not started до отдельной команды. Open Questions сохраняются и закрываются в соответствующих gates.

### Status

Accepted — source constraint.

## D-028 — MVP closes the core loop without AI

### Decision

MVP включает import → catalog/search → outfit → wear → calendar/insight и не включает AI capture, stylist, weather или AI-generated images.

### Why

Это минимальный замкнутый набор, который создаёт самостоятельную ценность и качественные данные для будущего AI. Частичный AI увеличил бы risk/cost, не устранив основной activation barrier.

### Alternatives considered

- Выпустить только каталог без wear/analytics.
- Сделать AI metadata или stylist обязательным MVP differentiator.
- Включить все будущие surfaces в один релиз.

### Consequences

Название продукта отражает долгосрочную vision. AI V2/V3 проходит отдельные grounding, privacy, data-quality и cost gates; outage не влияет на MVP core loop.

### Status

Accepted — approved product decision.

## D-029 — MVP PWA is resilient online, not full offline-first

### Decision

MVP устанавливается как PWA, показывает честные offline/pending states и сохраняет пользовательский ввод при кратких сбоях, но не обещает полный offline catalog/edit/sync.

### Why

Полноценная синхронизация заметно расширяет integrity surface, особенно для imports, images и duplicate wear events, до доказанной потребности.

### Alternatives considered

- Полный offline-first с первого релиза.
- Online-only UI без draft recovery.
- Нативное приложение как способ решить offline.

### Consequences

Нужны retry и no-silent-loss guarantees. Offline capture/queued wear рассматривается в V2 только по данным реального использования.

### Status

Accepted — approved product decision.

## D-030 — Minimal AppearanceVariant flow is required in MVP

### Decision

MVP сохраняет distinction Physical Item / AppearanceVariant / ImageView и включает минимальный user-facing AppearanceVariant flow для реальных reversible/multi-appearance вещей.

### Why

В исходном гардеробе подтверждён как минимум один реальный случай двусторонней вещи: это одна ClothingItem с двумя выбираемыми внешними состояниями. Следовательно, variant flow необходим для достоверного import, outfit и wear history, а не является гипотезой.

### Alternatives considered

- Оставить user-facing variant flow под gate будущего import audit.
- Создать сложную универсальную variant-management систему в MVP.
- Игнорировать variant semantics до V2.
- Создавать отдельные physical items для разных сторон.

### Consequences

Пользователь может создать/импортировать variant, задать label и собственные catalog images/ImageViews, выбрать variant в Outfit Builder; OutfitItem и WearEvent snapshot сохраняют выбор. Wear count, ownership, physical lifecycle и основная статистика остаются на ClothingItem. Разные variants не создают разные items. Архивирование/удаление variant исключает его из новых выборов, но не разрушает historical WearEvent. UX ограничен этим минимальным набором.

Перед окончательным проектированием Bulk Import UX всё равно обязателен read-only аудит реального набора: item IDs, source photos, catalog images, front/back, AppearanceVariants, usage notes, naming conventions и возможные дубли. Аудит уточняет import contract, но не решает, входит ли AppearanceVariant в MVP — это уже утверждено.

### Status

Accepted — approved product decision.

## D-031 — MVP information architecture has four stable domains and a separate action layer

### Decision

MVP использует четыре глобальных destination: Home, Wardrobe, Outfits и Activity. Create является отдельным action layer, а не пятым content destination. Settings, Import и Archive остаются utility routes.

### Why

Эти четыре области соответствуют continuation, owned inventory, reusable compositions и recorded activity. Отделение действий от мест предотвращает превращение навигации в список функций.

### Alternatives considered

- Отдельные глобальные tabs для Calendar, Insights, Import и Settings.
- Create как выбранная вкладка с собственной страницей.
- Один универсальный Home без стабильных domain destinations.

### Consequences

Calendar и Insights живут внутри Activity; Create открывает контекстное меню. Wishlist/Trips и Assistant не занимают MVP navigation slots.

`Activity` остаётся рабочим IA label. Финальный localized navigation label выбирается в Phase 3 terminology review после сравнения как минимум `Активность`, `История` и `Журнал`; смена label не меняет IA.

### Status

Accepted — approved UX decision.

## D-032 — Mobile uses four bottom destinations plus a distinct Create control

### Decision

На mobile нижняя навигация содержит Home, Wardrobe, Outfits и Activity; отдельная заметная кнопка Create открывает action sheet. Settings/Profile находится в global header.

### Why

Так сохраняется достижимость основных разделов одной рукой и остаётся место для потенциального Assistant без перестановки существующих destinations.

### Alternatives considered

- Пять MVP tabs, включая Create.
- Hamburger-only navigation.
- Отдельные Calendar и Insights tabs.

### Consequences

Положение, label и safe-area поведение Create требуют usability/accessibility validation. Будущий Assistant получает пятый tab только при доказанном повторяющемся использовании.

### Status

Accepted — approved UX decision.

## D-033 — Desktop uses a persistent hierarchical sidebar

### Decision

Desktop использует persistent left sidebar: primary domains, раскрываемый Activity и отдельную utility group. Create закреплён как action в sidebar.

### Why

Sidebar лучше показывает вложенность и масштабируется к будущим Planning/Assistant, не скрывая переходы и не меняя смысл mobile IA.

### Alternatives considered

- Горизонтальная top navigation.
- Mobile-style bottom bar на desktop.
- Полностью скрываемое hamburger menu.

### Consequences

Content panes получают больше горизонтального пространства только после сохранения читаемой ширины; collapsed sidebar обязан сохранять accessible names и current location.

### Status

Accepted — approved UX decision.

## D-034 — Home is a prioritized continuation surface

### Decision

Empty/first-use Home приоритизирует contextual choice между `У меня уже есть цифровой гардероб` → Bulk Import и `Начать с нуля` → Add first item; для primary existing-wardrobe user Import является recommended path, но не обязательным. Returning Home приоритизирует pending/recoverable work, Add item, Create outfit, Log wear, recent outfits/history/items и один explainable insight. Он не становится полным analytics dashboard.

### Why

Главная задача Home — вернуть пользователя в core loop с минимальным выбором, а не повторить все коллекции.

### Alternatives considered

- Analytics-first dashboard.
- Полный chronological activity feed.
- Статичная marketing/onboarding page после первого запуска.

### Consequences

Каждая preview-секция ограничена и ведёт в domain collection. Блоки без релевантных данных скрываются или заменяются честным next action. После формирования рабочего гардероба Bulk Import не занимает постоянный daily quick-action slot; повторный import доступен через contextual Create и Settings → Data / Import.

### Status

Accepted — approved UX decision.

## D-035 — Filters adapt by input density, not by different semantics

### Decision

На mobile high-frequency chips применяются сразу, а расширенные filters редактируются в sheet и применяются через Apply. На desktop доступная filter rail обновляет результаты сразу. Query, filter meanings, counts и Clear semantics одинаковы.

### Why

Mobile нужен безопасный staged выбор без скачущего background, desktop — быстрый iterative exploration.

### Alternatives considered

- Только instant filters на всех размерах.
- Apply для каждого фильтра на всех размерах.
- Разные наборы фильтров для mobile и desktop.

### Consequences

Clear filters по умолчанию сохраняет search query. Back закрывает непрымёненный sheet без изменения текущих результатов.

### Status

Accepted — approved UX decision.

## D-036 — Outfit Builder has composition and picker as stable regions

### Decision

Outfit Builder всегда разделяет composition и wardrobe picker. На mobile picker — расширяемый bottom sheet/full-screen layer; на desktop — persistent side pane.

### Why

Пользователь должен одновременно понимать текущий outfit и источник следующего item, сохраняя одинаковую mental model на устройствах.

### Alternatives considered

- Последовательный wizard по категориям.
- Отдельный экран выбора для каждого item без видимой composition.
- Свободный canvas как единственный способ управления.

### Consequences

Add/replace mode, selected variants и save state видимы. Drag остаётся опциональным; reorder/replace имеют labelled alternatives. Неполный working draft допустим.

### Status

Accepted — approved UX decision.

## D-037 — Drafts share one recovery vocabulary but not one publication rule

### Decision

Item, Outfit, Import и будущие AI drafts используют общие состояния Working, Saving, Saved draft, Not saved и Conflict/stale. Финальная операция остаётся domain-specific: Save item/outfit или Confirm import/AI-derived write.

### Why

Единая recovery model уменьшает потерю данных и обучение, но autosave не должен выглядеть как окончательная публикация или import commit.

### Alternatives considered

- Отдельная несогласованная модель черновика в каждом модуле.
- Autosave как немедленное создание финальных entities.
- Обязательная confirmation после каждого поля.

### Consequences

Home/Draft Center возвращает к незавершённой работе. Неуспешное сохранение удерживает input; discard требует явного действия только при реальной потере восстановления.

### Status

Accepted — approved UX decision.

## D-038 — Confirmation strength follows reversibility and ambiguity

### Decision

Частые обратимые действия выполняются сразу с Undo; ambiguous actions открывают review; import/export и conversions используют preview + Confirm; destructive identity/history actions требуют сильного подтверждения.

### Why

Одинаковое подтверждение для всех действий либо создаёт friction, либо не защищает важные данные.

### Alternatives considered

- Confirm modal для каждой записи.
- Только toast/Undo даже для deletion/import.
- Невидимые optimistic writes без recovery.

### Consequences

Wear today, favorite и single ordinary archive выполняются сразу с Undo. Archive с необычной dependency/ambiguity открывает focused review; bulk archive использует preview + confirmation; hard delete остаётся отдельным destructive flow со strong confirmation. Duplicate wear требует review; event/account deletion имеют пропорциональную защиту. Success и failure никогда не сообщаются только исчезающим toast.

### Status

Accepted — approved UX decision.

## D-039 — Calendar is actual-wear only and always has an agenda equivalent

### Decision

MVP Calendar показывает только фактические WearEvents. Month grid дополняется day/agenda view, которая является полноценной accessible и narrow-screen альтернативой.

### Why

Смешивание планов и фактов разрушает смысл истории; один визуальный grid недостаточен для нескольких событий, клавиатуры и screen reader.

### Alternatives considered

- Смешанный календарь actual/planned.
- Только month thumbnails.
- Timeline без календарного обзора.

### Consequences

Wishlist, Trips и recommendations не появляются в MVP Calendar. Дата, count и event details доступны текстом и не кодируются только цветом/изображением.

### Status

Accepted — approved UX decision.

## D-040 — Staged Bulk Import is approved; source-dependent details remain provisional

### Decision

Phase 2 утверждает безопасные стадии Choose → Prepare → Review → Resolve → Preview → Confirm → Results, но не финализирует detailed mapping, grouping, duplicate resolution, image reconciliation, source/catalog mapping и AppearanceVariant import handling до read-only аудита реального source wardrobe.

### Why

Import является MVP requirement, однако неподтверждённые предположения о IDs, images, variants, notes и duplicates могут сделать UX неверным.

### Alternatives considered

- Отложить весь import UX.
- Зафиксировать generic CSV/folder contract без аудита.
- Автоматически импортировать без review.

### Consequences

Staged interaction model утверждена и не блокирует approval остальной Phase 2. До final detailed Import UX обязательна проверка item IDs, photos, catalog images, front/back, AppearanceVariants, usage notes, naming conventions, possible duplicates и наличия historical wear data. AppearanceVariant как MVP requirement не пересматривается.

### Status

Accepted — approved UX decision; detailed Bulk Import UX remains provisional pending Source Audit.

## D-041 — Future AI is contextual-first and draft-only for consequential writes

### Decision

AI actions появляются прежде всего в Item, Outfit Builder, Wishlist/Purchase и Trip contexts. Отдельный Assistant destination добавляется только при повторяющемся cross-domain использовании. AI-result начинает как reviewable draft.

### Why

Контекст даёт ясное намерение и grounding, а также сохраняет самостоятельность manual core loop.

### Alternatives considered

- AI chat как обязательная Home.
- Постоянный Assistant tab с MVP.
- Автоматическое применение рекомендаций.

### Consequences

AI outage не блокирует MVP. Owned/candidate/unavailable distinctions и evidence видимы; создание/изменение данных требует user confirmation.

### Status

Accepted — approved UX decision.

## D-042 — Responsive layouts preserve meaning, state and return context

### Decision

Breakpoints могут менять sheet/pane, grid/list и column count, но не terminology, available outcomes, content hierarchy или data semantics. Back/deep-link transitions восстанавливают query, filters, scroll и selected date где это безопасно.

### Why

Пользователь чередует mobile capture и desktop organization; разные ментальные модели увеличили бы ошибки и стоимость обучения.

### Alternatives considered

- Независимые mobile и desktop products.
- Desktop как растянутый mobile layout.
- Responsive adaptation только визуального grid.

### Consequences

QA проверяет cross-device parity, focus order и state restoration. Hover, drag и dense tables всегда имеют mobile/accessibility equivalents.

### Status

Accepted — approved UX decision.

## D-043 — Visual direction is quiet editorial utility

### Decision

AI Wardrobe сочетает fashion-editorial whitespace, premium product-imagery discipline и ясность utility app. Реальные вещи являются главным визуальным контентом; chrome, акцент и decoration остаются вторичными.

### Why

Направление поддерживает image-first гардероб и premium ощущение без magazine ambiguity или generic SaaS dashboard.

### Alternatives considered

- Generic AI SaaS с gradients/glow.
- Luxury-editorial serif и большие hero layouts.
- Social/feed-first fashion product.

### Consequences

Character создаётся пропорциями, spacing, typography и image consistency. Не используются neon, glassmorphism, тяжёлые shadows, card walls и декоративные AI sparkles.

### Status

Accepted — approved visual decision.

## D-044 — Deep mineral green is the restrained accent

### Decision

Основной accent — deep mineral green `#3E6658` на тёплой нейтральной light palette. Accent используется для primary action, focus/selection support и ключевых links, а не как декоративное поле.

### Why

Он спокойнее и менее SaaS-like, чем blue-grey, более нейтрален к fashion imagery, чем burgundy, и менее military-coded, чем muted olive.

### Alternatives considered

- Muted olive `#65704D`.
- Deep blue-grey `#465E70`.
- Desaturated burgundy.

### Consequences

Нужна проверка на реальных цветах/transparent assets. Semantic success/warning/error/info имеют собственные пары, а selected/status никогда не кодируются только цветом.

### Status

Accepted — approved visual decision.

## D-045 — MVP visual theme is light-only

### Decision

MVP поставляется с одной тщательно проверенной warm light theme. Dark/System theme откладывается до отдельного полного image/status/contrast audit.

### Why

Светлая gallery surface согласуется с catalog assets, упрощает color judgment и уменьшает state/asset QA cost.

### Alternatives considered

- Light + dark одновременно.
- System theme с первого релиза.
- Dark-first fashion direction.

### Consequences

Dark mode не обещается MVP. Reduced motion и high-contrast preferences поддерживаются независимо от theme.

### Status

Accepted — approved visual decision.

## D-046 — Manrope is the single typography family

### Decision

Использовать Manrope как единую UI-family с system sans fallback, weight hierarchy и tabular numerals для dates/counts/data.

### Why

Family имеет современный характер и подходящую кириллицу, оставаясь readable и менее corporate, чем типичная SaaS typography. Второй декоративный font не нужен.

### Alternatives considered

- Inter/system sans only.
- Neutral sans + editorial serif.
- Serif-first fashion typography.

### Consequences

Направление Manrope утверждено; final delivery/licensing/weights всё равно проверяются до implementation. Sentence case обязателен. Main body/actions/forms/instructions/errors/critical states не меньше 14px. Short persistent navigation labels используют отдельный 12–13px Navigation Label token с icon + text, достаточными weight/contrast и обязательной zoom/reflow validation; Caption не используется для основной навигации.

### Status

Accepted — approved visual decision.

## D-047 — Layout uses an 8px rhythm and adaptive 4/8/12-column grid

### Decision

Spacing основан на 8px с разрешёнными 4px intermediates. Visual modes используют 4, 8 и 12 columns; main content capped около 1400px, reading forms — 640–720px.

### Why

Единый rhythm связывает mobile/desktop, а content-specific max widths сохраняют читаемость и рабочую плотность.

### Alternatives considered

- 4px-only dense system.
- Fluid layout без max widths.
- Одинаковая сетка на всех размерах.

### Consequences

Mobile margins 16px, tablet 24px, desktop 32–48px. Density растёт columns, не уменьшением body text или 44px targets.

### Status

Accepted — approved visual decision.

## D-048 — Surfaces use modest radii, borders and functional elevation

### Decision

Core radii — 8/12/16px; full round только для chips/status/segmented controls. Flat surfaces и 1px borders являются default; shadows показывают реальный raised/overlay/modal z-order.

### Why

Так интерфейс остаётся tactile и premium без floating SaaS-dashboard эстетики.

### Alternatives considered

- Большие 24–32px radii везде.
- Borderless layers with heavy shadows.
- Полностью плоская система без различения overlays.

### Consequences

Card nesting ограничивается; overlays получают restrained shadow, а постоянные collection cards — обычно нет.

### Status

Accepted — approved visual decision.

## D-049 — Garment imagery defaults to complete-object containment

### Decision

Wardrobe cards используют 4:5 neutral image wells с contain и 8–12% safe padding. Detail hero — compact 4:5/adaptive wide; thumbnails и composition zones — square. Crop требует явного user framing.

### Why

Автоматический cover-crop может обрезать обувь, рукава, брюки и разрушить каталог как evidence.

### Alternatives considered

- Edge-to-edge cover crop everywhere.
- Square ratio for every context.
- Intrinsic unaligned ratios in collection grids.

### Consequences

Placeholder/loading/error сохраняют ratio. Outfit previews используют реальные catalog images и детерминированные 1–4/+N layouts, не AI photorealistic composites. Final image mat/media treatment проверяется на real opaque-white PNG/JPEG, transparent PNG, square sources, front/back, shoes, trousers и long outerwear. Белые прямоугольники не маскируются случайным crop; после validation корректируется token/treatment при сохранении contain architecture.

### Status

Accepted — approved visual decision.

## D-050 — Card families are content-specific

### Decision

Clothing, Outfit, Insight и Draft/Resume имеют отдельную anatomy и visual treatment; универсальный bordered/shadowed Card не применяется ко всем modules.

### Why

Один generic Card превращает fashion collection в SaaS dashboard и стирает distinction committed/draft/data evidence.

### Alternatives considered

- Один Card component для каждого блока.
- Completely cardless product.
- Nested cards for metadata and actions.

### Consequences

Clothing Card — image + identity без outer shell; Outfit — coherent collage; Insight — editorial fact/evidence; Draft — явно recoverable state.

### Status

Accepted — approved visual decision.

## D-051 — Mobile Create is an attached central action, not a destination or floating FAB

### Decision

Mobile `Добавить` — отдельная central action group внутри 64px dock. 48×48px accent rounded square поднят на 6–8px; plus icon расположен по центру square. На обычной mobile ширине visible label `Добавить` центрирован под square, вне fill, но внутри dock, и использует Navigation Label token. Control не получает selected-tab state.

### Why

Это сохраняет утверждённое различие action/destination, не ломает bar и не создаёт social-camera/FAB образ.

### Alternatives considered

- Большой floating circular button.
- Create как пятая navigation tab.
- Trailing floating action поверх content.

### Consequences

Четыре destination остаются стабильными; sheet содержит точные текстовые действия. Accessible name всегда `Добавить`. На 320–375px сначала сохраняется visual label; скрытие допустимо только после usability/accessibility validation, при сохранении однозначного plus control и немедленных text actions в sheet. Проверяются 320/360/375px, 200% zoom и 400% reflow; при failure меняется geometry/type, а не используются аббревиатуры или большой FAB.

### Status

Accepted — approved visual decision.

## D-052 — Activity is presented in Russian as “История”

### Decision

Рабочий IA domain Activity получает рекомендуемый user-facing label `История`; page title — `История носки`, children — `Календарь` и `Статистика`.

### Why

`История` естественно охватывает фактические записи и derived evidence. `Активность` звучит social/fitness/technical, `Журнал` подчёркивает ручной труд.

### Alternatives considered

- `Активность`.
- `Журнал`.
- Изменить IA и вынести Calendar/Insights отдельно.

### Consequences

Меняется только presentation wording; утверждённая Activity → Calendar + Insights IA не меняется. Решение требует короткой terminology validation.

### Status

Accepted — approved visual decision.

## D-053 — Appearance uses image-radio cards; ImageView uses labeled thumbnails

### Decision

`Внешний вид` выбирается image-based radio cards с cover, label и check. `Ракурс` отображается отдельным thumbnail row со Спереди/Сзади/Сбоку/Деталь.

### Why

Разные visual grammars объясняют AppearanceVariant ≠ ImageView лучше, чем два одинаковых segmented controls.

### Alternatives considered

- Text-only segmented control для appearances.
- Одинаковые thumbnails для appearance и ImageView.
- Отдельные Clothing Cards для sides.

### Consequences

Builder tile текстово показывает выбранный appearance. Variant-level favorite/lifecycle/wear controls запрещены; pattern тестируется на reversible и ordinary front/back item.

### Status

Accepted — approved visual decision.

## D-054 — Outfit composition is a structured editorial board

### Decision

Builder использует contained garment tiles в управляемой modular composition. Semantic roles влияют на visual zones/scale, но не ограничивают состав; free-drag canvas исключён.

### Why

Structured board создаёт цельный outfit preview, сохраняет доступность и предсказуемость reorder/replace на mobile и desktop.

### Alternatives considered

- Freeform drag canvas.
- Только horizontal list.
- Жёсткий slot template, запрещающий layering.

### Consequences

Drag supplemental; доступны Replace/Move/Remove. 7+ item compositions и scale classes требуют validation, но не создают completeness rules.

### Status

Accepted — approved visual decision.

## D-055 — Draft and status states use shared non-color visual grammar

### Decision

Working, Saving, Saved Draft, Not Saved, Conflict, Archived, Processing, Failed, unavailable и future AI/import states используют согласованные icon + label + surface/border cues.

### Why

State должен быть понятен без цвета, не маскировать draft как committed content и не превращать обычные pending states в alarms.

### Alternatives considered

- Badge color only.
- Large warning banners for every draft.
- Domain-specific inconsistent state styles.

### Consequences

Обычный active state не требует badge. Error всегда содержит recovery; future AI получает quiet `AI‑предложение` label без отдельного chatbot language.

### Status

Accepted — approved visual decision.

## D-056 — Motion is restrained, functional and reduced-motion complete

### Decision

Routine feedback занимает 80–200ms, layers 220–260ms; transitions объясняют press, state, insertion и layer continuity. Reduced motion removes transforms/pulse while preserving instant feedback.

### Why

Functional motion улучшает causality, но flashy animation конкурирует с одеждой и снижает accessibility.

### Alternatives considered

- Spring-heavy expressive motion.
- No transition feedback.
- Decorative garment/AI animations.

### Consequences

Нет confetti, parallax, flying garments или loops. Undo остаётся perceptible 8–10 seconds и pauses on focus/hover.

### Status

Accepted — approved visual decision.

## D-057 — Responsive visual change preserves component meaning and accessibility

### Decision

Mobile sheets могут стать desktop drawers/panes, grids добавляют columns, Item/Calendar становятся split layouts, но terminology, states, focus order, action hierarchy и 44px touch baseline сохраняются.

### Why

Primary user переключается между mobile capture и desktop organization; visual divergence не должна создавать две системы.

### Alternatives considered

- Независимые mobile/desktop visual languages.
- Растянутый mobile UI на desktop.
- Dense desktop за счёт мелких controls/type.

### Consequences

Wide layouts используют sidebar/multi-pane и max widths. Zoom/high reflow переводит их обратно в narrow behavior; hover remains supplemental.

### Status

Accepted — approved visual decision.

## D-058 — Application architecture is a server-authoritative modular monolith

### Decision

MVP строится как один deployable Next.js modular monolith с явными Presentation, Application, Domain, Data Access и Infrastructure boundaries. Server определяет identity, authorization и domain transitions; microservices не создаются без измеренного extraction trigger.

### Why

Core domains тесно связаны транзакциями, ownership и историческими invariants. Один deployable уменьшает distributed failure/cost, а module boundaries сохраняют возможность эволюции.

### Alternatives considered

- Microservice per domain с первого релиза.
- Неограниченный monolith без dependency rules.
- Browser напрямую управляет database entities.

### Consequences

Domain/Application code не зависит от Next.js/Vercel/Supabase SDK. Circular module dependencies запрещены; image worker или другой module извлекается только при доказанной runtime, scale, compliance или team-boundary необходимости.

### Status

Accepted — approved architecture decision.

## D-059 — Web stack uses Next.js App Router, React and TypeScript

### Decision

Recommended application stack — Next.js App Router + React + TypeScript strict. Server Components обслуживают authenticated reads, Client Components — необходимую интерактивность/browser APIs, Server Actions — same-app mutations, Route Handlers — uploads, callbacks, jobs, exports и будущие external clients.

### Why

Стек поддерживает mobile-first PWA и desktop в одном продукте, server rendering, progressive UI и единый application/server boundary.

### Alternatives considered

- Separate SPA + independent API service.
- Native-first clients.
- Full client-side Supabase domain access.

### Consequences

Server Actions/Route Handlers считаются публичными endpoints и повторяют auth/input/ownership checks. Server Components не вызывают собственный HTTP API. Exact supported versions фиксируются перед implementation.

### Status

Accepted — approved architecture decision.

## D-060 — Styling uses Tailwind under an internal design-token and component layer

### Decision

Tailwind CSS используется как utility/build layer под semantic tokens и внутренними доступными components из утверждённого Design System. Низкоуровневые accessible primitives допускаются точечно после проверки.

### Why

Это ускоряет consistent implementation, не превращая framework classes или generic UI kit в product language.

### Alternatives considered

- Full custom CSS without utility layer.
- Off-the-shelf component system как visual source of truth.
- CSS-in-JS runtime foundation.

### Consequences

Component API и semantic tokens являются стабильной границей. Tailwind major выбирается после target browser matrix; visual accessibility проверяется независимо от library.

### Status

Accepted — approved architecture decision.

## D-061 — Supabase PostgreSQL, Auth and private Storage form the initial data platform

### Decision

Использовать managed Supabase PostgreSQL как relational source of truth, Supabase Auth как identity provider и Supabase private Storage для media/import/export objects.

### Why

Один platform покрывает transactions, relational history, Auth, RLS и private object access, сохраняя переносимый Postgres/file core и уменьшая MVP operational burden.

### Alternatives considered

- Separate managed Postgres, Auth and object-storage vendors immediately.
- Proprietary document database.
- Local-only personal database.

### Consequences

Platform не отменяет application authorization, object backup и provider adapters. Serverless DB path использует подходящий pooler/connection strategy; exact Data API vs pooled SQL split определяется в Phase 5.

### Status

Accepted — approved architecture decision.

## D-062 — Verified server identity and authorization own every request scope

### Decision

Server derives actor/account from verified Supabase Auth session. Browser/request/model-provided `user_id` never grants authority. Authentication and domain authorization remain separate checks.

### Why

Client-controlled tenant scope creates direct IDOR/cross-user risk and cannot support safe public evolution.

### Alternatives considered

- Trust user ID in form/API payload.
- Frontend route/filter as authorization.
- One shared personal credential until beta.

### Consequences

Every read, write, job, export and future AI tool receives server-injected scope and re-authorizes object IDs. Account switch/logout clears user-scoped local state.

### Status

Accepted — approved architecture decision.

## D-063 — Application authorization is backed by deny-by-default RLS

### Decision

Every exposed user-owned relation and Storage path uses minimum grants plus deny-by-default RLS. Root ownership is direct; child access is derived through a verified parent. Service-role access is isolated server-side.

### Why

Application-only filters are vulnerable to missed code paths. RLS provides an independent database/storage barrier for User A/B isolation.

### Alternatives considered

- RLS only without application authorization.
- Application authorization only.
- Service-role access for ordinary browser operations.

### Consequences

Views/functions/joins and Storage policies require explicit audit. Phase 5 defines the model; implementation tests same-user allow and cross-user/anonymous deny for every operation.

### Status

Accepted — approved architecture decision.

## D-064 — User media stays private and uploads bypass application functions after authorization

### Decision

Originals, catalog images, derivatives, staged imports and exports use private Storage only. Server authorizes the intent; browser uploads large bytes directly; reads use authenticated delivery or short-lived authorized signed URLs.

### Why

Public media contradicts privacy requirements, while proxying large images/import packages through serverless requests adds payload, duration and cost risk.

### Alternatives considered

- Public bucket with obscure URLs.
- Send every image through Next.js Function.
- Store images in PostgreSQL.

### Consequences

The direct-upload mechanism remains an implementation gate: either the current authenticated Supabase identity is evaluated by Storage RLS for each operation, or the server issues a bounded signed upload URL/token that becomes a bearer capability until provider expiry. In both cases the server selects an opaque/versioned destination, binds exactly one expected object to owner and domain parent, checks quota before authorization, distrusts completion claims and keeps the object staged until byte-level validation. Tokens are not logged or shared-cached. Archive retains media; delete follows lifecycle workflow.

### Status

Accepted — approved architecture decision.

## D-065 — Images use a validated, asynchronous and idempotent derivative pipeline

### Decision

Upload verification is followed by magic-byte/decode/dimension/pixel-budget validation, metadata-safe processing and async generation of thumbnail/medium/full derivatives from a retained original. A stable asset/version identity makes retries idempotent.

### Why

Image-first screens require responsive assets, while untrusted uploads and CPU-heavy conversion do not belong in an interactive request.

### Alternatives considered

- Use originals in all screens.
- Destructive automatic cover-crop.
- Request-time processing without durable status.

### Consequences

Failed processing leaves recoverable source/item state. HEIC and processor location remain implementation gates. Real opaque/transparent/square/front-back/shoes/trousers/outerwear fixture validates contain/media treatment without random crop.

### Status

Accepted — approved architecture decision.

## D-066 — Critical slow work uses durable jobs with provider-neutral application boundaries

### Decision

Image processing, large import, export and deletion cleanup execute as durable, status-bearing, idempotent jobs. Queue/worker transport sits behind an application port; post-response hooks and cron are not completion guarantees.

### Why

Serverless requests have execution limits, may stop, and queue delivery may repeat. Users need progress, recovery and exact outcomes.

### Alternatives considered

- Perform all work synchronously.
- Fire-and-forget after the HTTP response.
- Fix one beta queue API into domain code.

### Consequences

Jobs have owner scope, identity, attempts, checkpoints and terminal outcome conceptually. Supabase Queues and Vercel Queues/Workflow are implementation candidates; final runner is selected after runtime/region/maturity/cost validation.

### Status

Accepted — approved architecture decision.

## D-067 — Bulk Import separates read-only review from idempotent bounded commit

### Decision

Import follows Upload → Parse → Validate → Normalize → Preview → User decisions → Confirm → bounded Commit → Report. No ClothingItem/Image relationship is changed before Confirm; retries reconcile record-level idempotent outcomes.

### Why

Large source sets contain ambiguity and partial failures. One long transaction or implicit merge would risk duplication, overwrite and unusable recovery.

### Alternatives considered

- Write while parsing.
- One all-or-nothing transaction for an entire archive.
- Visual-similarity automatic merge.

### Consequences

External identity is scoped by owner + source. Confirmed fields, primary image, lifecycle, ownership, variants and history are protected. Exact mapping/grouping/duplicate/image/AppearanceVariant rules remain provisional until mandatory Source Audit.

### Status

Accepted — approved architecture decision.

## D-068 — Domain writes use explicit transactions, versions and idempotency

### Decision

Outfit composition, WearEvent snapshot, archive dependency, primary image and confirmed import groups use explicit transaction boundaries. Concurrent edits use optimistic versions; retryable commands use idempotency identities.

### Why

Two tabs, duplicate taps, queue replay and network timeouts otherwise create silent overwrite, double wear or contradictory primary state.

### Alternatives considered

- Last-write-wins everywhere.
- Long user-held database locks.
- Full event sourcing/CRDTs.

### Consequences

Stale writes produce reviewable Conflict. Outfit edits cannot rewrite WearEvent snapshots. External calls are not held inside DB transactions and require reconciliation/outbox-style handling where necessary.

### Status

Accepted — approved architecture decision.

## D-069 — Vercel is the initial hosting target, not a domain dependency

### Decision

Deploy the Next.js application initially on Vercel Node.js runtime, with compute near Supabase. Domain/Application modules do not import Vercel-specific APIs.

### Why

Vercel provides mature Next.js deployment and preview workflow while preserving a practical self-host/other-host exit path.

### Alternatives considered

- Self-host containers from day one.
- Edge runtime everywhere.
- Bind application workflows directly to Vercel primitives.

### Consequences

Local/preview/production data and secrets are isolated. Large files use direct Storage upload and long work uses jobs. Region and serverless limits are production gates.

### Status

Accepted — approved architecture decision.

## D-070 — MVP PWA is installable and resilient online with private-cache defaults

### Decision

PWA caches a versioned public/static shell and may retain minimal user-scoped recoverable drafts, but server remains source of truth. Authenticated responses, private images and signed URLs are not service-worker/shared cached by default.

### Why

Browser install, storage and Background Sync support varies; promising offline writes would expand conflict/security complexity beyond MVP.

### Alternatives considered

- Full offline-first synchronization.
- No draft recovery or offline status.
- Cache the last full wardrobe and images indiscriminately.

### Consequences

Offline never reports false server success. Local state clears on logout/account change/deletion. Future queued offline writes require a separate V2 decision and idempotent sync design.

### Status

Accepted — approved architecture decision.

## D-071 — Future AI integrates only through a server-side AI Gateway

### Decision

Future AI uses one server-only Gateway and an initial OpenAI Responses API adapter with allowlisted tools, strict schemas/Structured Outputs, context minimization, validation, usage controls and graceful failure. Model/provider output never bypasses domain authorization.

### Why

The boundary prevents key exposure, cross-user access, direct SQL, prompt/tool abuse and provider-specific logic throughout the product.

### Alternatives considered

- OpenAI calls directly from the browser.
- Direct model access to SQL/full wardrobe.
- Separate autonomous agent per feature.

### Consequences

Server injects authenticated scope; tools do not accept arbitrary authority-bearing user ID. Read-only capabilities are default, persistent writes require normal user confirmation/idempotency, and core works during AI outage. Provider state/retention is minimized and reviewed before AI launch.

### Status

Accepted — approved architecture decision.

## D-072 — Future model choice is configuration- and eval-routed, not globally hardcoded

### Decision

AI Gateway maps logical task profiles—simple extraction, ordinary recommendation, complex planning—to tested provider/model snapshots through deployment configuration and eval-backed routing.

### Why

Model quality, price, latency, vision and tool reliability change. One global ID in domain code either overpays or blocks safe upgrades.

### Alternatives considered

- One permanent model for every feature.
- User chooses arbitrary provider/model.
- Premature universal multi-provider framework.

### Consequences

Model changes require quality/safety eval and canary evidence. Fallback cannot broaden context/tool authority. One narrow adapter is sufficient until a real portability/compliance need appears.

### Status

Accepted — approved architecture decision.

## D-073 — Public SaaS evolution uses internal entitlements without changing personal ownership

### Decision

Future Free/Premium capabilities resolve through `Verified Identity → Entitlements → capabilities/limits`. Personal ownership remains fundamental; Household later adds explicit membership/grants instead of replacing owner identity.

### Why

Scattered premium conditionals and ownerless/shared data would make subscriptions, limits, Household departure and privacy unsafe to evolve.

### Alternatives considered

- Add `if premium` in each screen/module later.
- Make Household the owner of all personal records.
- Build billing/subscription schema now.

### Consequences

Current architecture can later add AI/storage/import/analytics/Household limits through one capability boundary. Prices, billing tables, Stripe, checkout and subscription lifecycle remain unimplemented and require separate decisions.

### Status

Accepted — approved architecture decision.

## D-074 — Observability is portable, content-minimized and separate from audit evidence

### Decision

Use structured redacted logs, correlation IDs and OpenTelemetry-compatible metrics/traces across app, DB, Storage, jobs, import and future AI. Security/business audit events are a separate minimal stream.

### Why

Operations need end-to-end diagnosis without placing private photos, notes, signed URLs, credentials or AI context into long-lived telemetry or a proprietary-only format.

### Alternatives considered

- Log full payloads for convenience.
- No cross-service correlation.
- Treat product analytics, audit and infrastructure logs as one dataset.

### Consequences

Default logs contain safe metadata/outcome only; sensitive debug capture is explicit, time-limited and access-controlled. Monitoring provider can change without rewriting domain events.

### Status

Accepted — approved architecture decision.

## D-075 — Portability and recovery cover both PostgreSQL and object bytes

### Decision

Preserve stable domain IDs, machine-readable relationship export, original/catalog assets and combined database/object recovery. Managed database backup alone is not considered complete recovery.

### Why

Supabase database backups do not include Storage object bytes, and a relational dump without images cannot satisfy trust or migration requirements.

### Alternatives considered

- Rely only on managed DB backups.
- Export flat CSV without relationships/images.
- Treat archive as backup.

### Consequences

Production defines RPO/RTO, separate Storage backup/export and combined restore drills. Export/delete/backup SLA and exact package format remain explicit downstream gates.

### Status

Accepted — approved architecture decision.

## D-076 — Auth identity and personal ownership use separate identifiers

### Decision

Provider-managed authenticated identity maps one-to-one to an application `account` in MVP. Personal domain roots belong to `account_id`, not directly to a provider user ID. Future Household access adds explicit membership/grants without changing the personal owner of existing rows.

### Why

Authentication identity, durable ownership and permission to access are different concepts. Keeping them separate avoids provider lock-in and prevents a future sharing feature from requiring an ownership rewrite.

### Alternatives considered

- Use the Auth provider user ID as every domain foreign key.
- Make a Household/shared tenant the owner from day one.
- Use one global single-user namespace until SaaS evolution.

### Consequences

Every personal aggregate has one stable owner scope. Identity-to-account resolution is a small indexed boundary. Household tables, membership and sharing are not implemented in Phase 5.

### Status

Accepted — approved data-model decision.

## D-077 — Internal identifiers use PostgreSQL UUID with UUIDv4 defaults

### Decision

Application entities use PostgreSQL `uuid` primary keys generated with UUIDv4 defaults. Human-facing reference codes and source-system identifiers are separate, scoped fields; a later UUIDv7 generator may be adopted without changing the column type or domain identity.

### Why

Opaque UUIDs work across browser/server/job/import boundaries and are safe to create independently. External IDs and display codes have different uniqueness, privacy and lifecycle semantics.

### Alternatives considered

- Sequential integers exposed across boundaries.
- UUIDv7 as a hard Phase 5 dependency.
- Reuse source IDs as primary keys.

### Consequences

Source IDs are unique only inside owner+source scope. UUID generation/version support must be confirmed against the selected production PostgreSQL/Supabase version before migrations.

### Status

Accepted — approved data-model decision.

## D-078 — Core wardrobe metadata is typed, with controlled references and joins

### Decision

Frequently queried or behavior-driving attributes are typed columns or explicit reference/join tables. Categories, colors and seasons use controlled references; tags remain account-owned and typed by purpose/style/custom intent. A generic EAV metadata store is not used for authoritative state.

### Why

Typed state makes constraints, filtering, indexes, export and later AI grounding predictable. A universal key/value model would defer correctness to application code and obscure query behavior.

### Alternatives considered

- Generic EAV rows for every property.
- One unvalidated JSON document per item.
- Free-text category/color/season values only.

### Consequences

Schema evolution is explicit. Optional/unknown values use `NULL` or absence rather than synthetic “unknown” reference rows. Bounded evidence JSON may record import/AI proposals but cannot replace authoritative typed fields.

### Status

Accepted — approved data-model decision.

## D-079 — AppearanceVariant rows are sparse and represent real selectable appearances

### Decision

Create `appearance_variants` only when one physical ClothingItem has multiple real user-selectable appearances. Ordinary items have no implicit/default variant row. Variant labels and catalog ImageViews are variant-scoped, while ownership, lifecycle, wear count and primary statistics stay at Physical Item level.

### Why

This preserves the approved Physical Item / AppearanceVariant / ImageView distinction without forcing every ordinary item into unnecessary variant management.

### Alternatives considered

- One ClothingItem per appearance.
- An automatic default variant for every item.
- Treat front/back ImageViews as variants.

### Consequences

OutfitItem and WearEvent snapshot may store a chosen variant. Composite ownership/item constraints prevent cross-item or cross-account selection. Variant archive/delete cannot erase historical snapshot meaning.

### Status

Accepted — approved data-model decision.

## D-080 — Media asset, semantic binding and technical rendition are separate

### Decision

`media_assets` describe private source objects, `media_bindings` attach an asset to an item and optional AppearanceVariant with ImageView/product role, and `media_renditions` describe generated technical derivatives. Primary-image uniqueness is enforced per item-level or variant-level scope.

### Why

One binary, its domain meaning and its generated sizes/formats have different lifecycles. Combining them would confuse front/back semantics, catalog provenance, primary selection and processing state.

### Alternatives considered

- Store image URLs directly on ClothingItem/AppearanceVariant.
- One image table mixing originals, bindings and thumbnails.
- Encode ImageView in object paths only.

### Consequences

Database rows never make object paths an authorization source. Account and parent compatibility, including replacement lineage, use composite foreign keys; Storage access remains separately authorized and Phase 6 implementation work. MediaAsset `version` is only optimistic row concurrency. Immutable source identity is `media_asset_id`; one current rendition exists per asset+kind, with separate processor profile/rendition-row concurrency and reconciled cleanup of replaced derivative objects. MVP does not keep rendition-generation history.

### Status

Accepted — approved data-model decision.

## D-081 — Drafts are domain-local states, not a universal draft aggregate

### Decision

Item creation, Outfit editing and Import preview keep draft/progress state inside their own bounded aggregates. Phase 5 does not add one polymorphic `drafts` table.

### Why

These workflows have different validation, ownership, recovery and commit rules. A universal draft abstraction would couple unrelated flows before repeated behavior is proven.

### Alternatives considered

- One polymorphic draft table with arbitrary JSON payloads.
- No durable draft state.
- Model every intermediate step as final domain data.

### Consequences

Draft cleanup and optimistic concurrency are specified per aggregate. A shared abstraction may be extracted later only from real implementation evidence.

### Status

Accepted — approved data-model decision.

## D-082 — Outfit composition is relational and preserves physical-item identity

### Decision

An Outfit is a mutable aggregate with relational `outfit_items`. One Physical Item appears at most once in an Outfit, and an optional selected AppearanceVariant must belong to that same item and account.

### Why

Relational composition supports stable editing, filtering and referential checks. Adding two appearances of the same physical object would imply an impossible simultaneous outfit and later distort use semantics.

### Alternatives considered

- Store composition as an unvalidated JSON array.
- Allow the same ClothingItem once per variant.
- Copy all item metadata into the mutable Outfit.

### Consequences

Outfit edits use aggregate versioning. Wear history never depends on current OutfitItem rows; logging produces an independent event snapshot.

### Status

Accepted — approved data-model decision.

## D-083 — WearEvent uses local calendar date plus a minimal immutable item snapshot

### Decision

`wear_events.occurred_on` is the authoritative wardrobe calendar date, accompanied by timezone context and optional instant. `wear_event_items` store snapshot physical-item and selected-variant identifiers plus minimal labels/category needed to keep history intelligible; nullable live references support navigation while the source exists.

### Why

Users reason about what they wore on a local day, while current item names, variants, outfits and lifecycle may change. History must remain truthful without copying the entire catalog.

### Alternatives considered

- Derive history from current OutfitItems.
- Store only live foreign keys.
- Duplicate every ClothingItem field into each event.

### Consequences

Archive does not break history. Reviewed individual hard delete clears live item/variant references while retaining snapshot facts and creates no ClothingItem tombstone; full account deletion purges the account and snapshots. Voided events are excluded from wear counts. This accepted Phase 5 rule closes the tombstone-policy consequence that D-011 intentionally left open for later data-model design without changing D-011's archive-first decision.

### Status

Accepted — approved data-model decision.

## D-084 — Bulk Import commits from sealed staging with scoped external identity

### Decision

Import uses durable Source → Session → Record/Asset staging. Preview remains non-production until Confirm. The confirmed revision is sealed; every record has an idempotent commit identity and terminal outcome. External item identities are unique in account+source scope.

### Why

Preview decisions, retries and partial record failures must not silently duplicate or overwrite wardrobe data. Source identifiers are not globally meaningful.

### Alternatives considered

- Write ClothingItems while parsing.
- Treat filenames as global identities.
- Retry the whole batch as one transaction.

### Consequences

Commit uses bounded per-record transactions and produces a report. Individual ClothingItem hard delete removes its current external identity mappings and clears ImportRecord candidate/result live FKs while retaining safe source/session/outcome history. A new session with the same external identifier is an unmapped Preview + explicit Confirm case; replaying the old terminal committed session cannot recreate the deleted item. Exact mapping/grouping/duplicate/image/source/catalog/AppearanceVariant rules remain provisional until the mandatory Source Audit.

### Status

Accepted — approved data-model decision.

## D-085 — Idempotency is hybrid: generic request records plus domain uniqueness

### Decision

Retryable commands use a generic account-scoped idempotency record where response replay is needed, reinforced by operation-specific unique keys and durable job checkpoints in the affected domain.

### Why

One mechanism alone cannot cover synchronous duplicate requests, import record retries, job redelivery and one-time workflow starts without either gaps or needless coupling.

### Alternatives considered

- Generic idempotency table only.
- Domain unique constraints only.
- Best-effort client-side duplicate prevention.

### Consequences

Keys have explicit operation scope and retention. Side effects occur after authoritative checks inside bounded transactions; jobs remain safe under at-least-once execution.

### Status

Accepted — approved data-model decision.

## D-086 — Wardrobe search uses owner-scoped PostgreSQL FTS plus trigram matching

### Decision

MVP search combines structured filters/joins, a generated text-search vector with GIN indexing, and account-scoped trigram matching for tolerant name/label lookup. Results use deterministic keyset pagination rather than deep offsets.

### Why

The wardrobe corpus is relational and private; PostgreSQL can cover its initial full-text, partial-name and typo-tolerant needs without adding a second search system.

### Alternatives considered

- Exact `ILIKE` scans only.
- External search service from MVP.
- Client-side full-wardrobe search.

### Consequences

Every personal search begins with account scope and respects archive/lifecycle filters. Generated ClothingItem search columns contain only same-row scalar values; category/tag/color/season labels use structured filters or bounded relational lookups. Any future unified lexical document with relational labels requires a separately maintained read model/trigger decision after profiling. Language configuration, trigram thresholds and extension availability require representative-data validation before migration/release.

### Status

Accepted — approved data-model decision.

## D-087 — Ownership locality is explicit and reinforced with composite foreign keys

### Decision

Personal aggregate roots and directly exposed/query-heavy children carry indexed `account_id`. High-risk child-to-parent relationships use composite `(account_id, parent_id)` foreign keys so ownership compatibility is enforced structurally, not inferred only through joins.

### Why

Direct ownership predicates keep deny-by-default RLS understandable and efficient, while composite keys block cross-account child injection even if privileged application code makes a mistake.

### Alternatives considered

- Derive all child ownership through long parent chains.
- Put `account_id` on every table without a consistency constraint.
- Rely only on application authorization.

### Consequences

Phase 5 defines a conceptual RLS/relationship matrix, not executable policies. The personal secondary-FK audit makes non-polymorphic relationships account-compatible; deliberately polymorphic audit/idempotency locators are documented and never authorize access. RLS row eligibility does not imply a direct browser mutation GRANT; Data API, GRANT, pooled SQL and RPC boundaries remain Phase 6 implementation decisions. Global controlled references remain read-only; provider auth and service-worker paths require separate implementation tests.

### Status

Accepted — approved data-model decision.

## D-088 — Account deletion is an orchestrated purge, not a single cascade promise

### Decision

Full account deletion is a durable, idempotent workflow that blocks new mutation, inventories dependencies, removes private objects and provider-side data, purges database rows, verifies reconciliation and records only the minimum non-personal completion evidence allowed by policy.

### Why

Database cascades cannot delete Storage bytes, external provider artifacts, caches or backups, and a partial failure must be resumable rather than reported as success.

### Alternatives considered

- One synchronous database cascade.
- Archive the account instead of deleting it.
- Best-effort asynchronous cleanup without checkpoints.

### Consequences

Exact SLA, backup scope and retained operational evidence remain production policy gates. This workflow is modeled but not implemented in Phase 5.

### Status

Accepted — approved data-model decision.

## D-089 — Foundation toolchain uses Node 24, pnpm and the current compatible Next.js stack

### Decision

Use Node.js 24, pnpm 11.19.0, Next.js 16.3.5 App Router, React 19.3.0, TypeScript 6.0.3, Tailwind CSS 4.3.3 and an exact dependency lockfile. Use ESLint 9.39.5 temporarily because the current official Next.js lint preset's bundled React/a11y plugins do not yet declare ESLint 10 compatibility.

### Why

Node 24 is an active LTS baseline aligned across local files and CI. The selected framework versions avoid deprecated Pages Router/`next lint` patterns. TypeScript 7 does not yet expose the compiler API needed by the surrounding ecosystem; TypeScript 6 is its supported compatibility bridge. Ignoring peer ranges would be less reproducible than a documented compatibility choice.

### Alternatives considered

- npm instead of pnpm.
- TypeScript 7 before tool API compatibility.
- ESLint 10 with ignored peer incompatibilities.

### Consequences

One package manager and lockfile are authoritative. CI uses the same Node major. The production command uses Next.js's supported `--webpack` opt-out because the current Turbopack CSS worker opens an internal loopback port that is forbidden in the local execution environment; development retains the current default. Re-evaluate Turbopack production build, ESLint 10 and TypeScript 7 when their concrete compatibility gates clear.

### Status

Recommended — pending Phase 6 approval.

## D-090 — Foundation source layout is a small modular monolith

### Decision

Keep Next.js presentation in `src/app`, future product module entry points in `src/modules`, cross-cutting policy in `src/platform`, provider/database adapters in `src/infrastructure` and semantic primitives in `src/ui`. Do not create empty layer trees or a universal `lib` directory.

### Why

The layout makes trust and responsibility boundaries visible while leaving domain structure to emerge with real features.

### Alternatives considered

- Flat route-centric application.
- One physical directory for every conceptual layer.
- Generic shared `lib` for unrelated helpers.

### Consequences

React Server Components remain the default and product modules stay inside one deployable application. Module contracts must not become aliases for generated database rows.

### Status

Recommended — pending Phase 6 approval.

## D-091 — Database access is a controlled hybrid with read-only browser grants

### Decision

Use browser-safe and user-context server Supabase clients only for narrow RLS-protected reads. Authenticated receives explicit SELECT grants on approved reference/ordinary domain tables and no direct domain mutations. Invariant-heavy writes will use trusted server application commands with short PostgreSQL transactions, explicit account predicates and operation-specific authorization. Do not create a universal service-role client.

### Why

User-context reads benefit from RLS, while Outfit, Wear, media, import and deletion commands require multi-row transactions. RLS row eligibility and SQL privileges are separate controls.

### Alternatives considered

- Direct authenticated CRUD through the Data API.
- Run ordinary queries as unrestricted service role.
- Direct pooled SQL for every read and write.

### Consequences

All personal tables force RLS. Operational/identity/idempotency tables have no ordinary browser grant. A future privileged worker must be server-only, capability-specific and revalidate account plus subject.

### Status

Recommended — pending Phase 6 approval.

## D-092 — Account bootstrap is a trusted application command, deferred to Phase 7

### Decision

Prepare a unique, race-safe `accounts.auth_user_id` binding but do not create an automatic database trigger in Phase 6. Phase 7 must implement an idempotent trusted bootstrap after verified Auth identity creation; the server chooses the account UUID and reconciles unique conflicts.

### Why

There is no Auth flow to exercise or recover a trigger yet. A trusted command keeps provider lifecycle failure and retry visible without allowing a browser-selected owner ID or ghost duplicate.

### Alternatives considered

- `auth.users` insert trigger now.
- Client-created account row.
- Auth user ID as every domain owner key.

### Consequences

The schema is ready but signup is not implemented. Phase 7 cannot expose protected product routes until account bootstrap/recovery and session tests pass.

### Status

Recommended — pending Phase 6 approval.

## D-093 — Test foundation uses Vitest, pgTAP and Playwright with axe

### Decision

Use Vitest for pure unit tests, Supabase CLI + pgTAP for migration/constraint/RLS integration tests, and Playwright Chromium with `@axe-core/playwright` for desktop/mobile shell smoke and automated accessibility checks.

### Why

Each tool tests the layer that owns the invariant. SQL constraints and grants are not inferred from frontend behavior or service-role queries.

### Alternatives considered

- Browser tests only.
- Mock PostgreSQL constraints in TypeScript.
- Add Storybook before product components exist.

### Consequences

CI has separate application, database and browser jobs. Docker/Podman is required for the local database gate.

### Status

Recommended — pending Phase 6 approval.

## D-094 — PWA foundation starts with a native manifest; service worker is deferred

### Decision

Use the App Router manifest API, stable theme/background colors and an application icon now. Do not add an unvalidated third-party PWA package, cache private data offline or register a service worker in Phase 6.

### Why

Installability direction can be established without prematurely choosing authenticated caching/offline semantics.

### Alternatives considered

- Full offline mirror and sync engine.
- Add a PWA plugin before the target browser matrix.
- Defer the manifest as well.

### Consequences

The product is not yet claimed as fully installable/offline-capable. Service-worker and private-cache rules remain gated by browser/device and authenticated-cache tests.

### Status

Recommended — pending Phase 6 approval.

## D-095 — PostgreSQL 17, UUIDv4 and minimal controlled reference seed form the local baseline

### Decision

Configure local Supabase for PostgreSQL 17, retain `uuid` with `gen_random_uuid()` UUIDv4 defaults, enable only `pg_trgm`, and seed a deliberately small language-neutral category/color/season vocabulary. Do not enable vector search or import user wardrobe fixtures.

### Why

This closes foundation runtime and seed choices without changing the approved ID type or pretending the initial vocabulary is a complete fashion taxonomy. Representative Russian/English search behavior has an executable fixture.

### Alternatives considered

- UUIDv7 before a production Supabase version is approved.
- No reference rows.
- A large speculative taxonomy or real wardrobe data.

### Consequences

Reference codes remain stable and Russian labels are presentation values. Production region/version remains a deployment gate. Search tuning and taxonomy expansion require representative data; Source Audit stays separate.

### Status

Recommended — pending Phase 6 approval.

## D-096 — Cookie mutations require exact same-origin validation and bootstrap stays capability-specific

### Decision

For Phase 7 password/session Server Actions, require an exact `Origin` match against the effective host and forwarded protocol in addition to Supabase cookie defaults. Treat SameSite as defense in depth. PKCE/OTP callback GETs are authorized by one-time provider material and allowlisted local redirect destinations. Keep account creation behind one server-only, service-role-only `bootstrap_account` capability invoked only after `auth.getUser()` verifies the subject.

### Why

Cookie authentication alone does not prove that a mutation was intentionally initiated by this origin. Conversely, a broad privileged database client would erase the useful RLS/grant boundary. Exact origin validation addresses the implemented browser mutation surface, while a narrow idempotent function provides the minimum authority needed to reconcile Auth identity with the durable account.

### Alternatives considered

- Rely only on SameSite/framework defaults.
- Add a separate synchronizer token to the current Server Action forms.
- Create accounts with an `auth.users` trigger.
- Expose account INSERT or a broad service-role repository to ordinary application code.

### Consequences

Deployments must preserve trustworthy host/protocol headers and test the configured proxy chain. Non-browser clients do not receive a cookie mutation API in this phase. Any future cross-origin surface must define its own explicit anti-CSRF/authentication contract. The bootstrap secret remains server-only, the function chooses/reconciles server-controlled identity data, and every new privileged operation requires a separate capability and review.

External-review remediation uses required server-only `APP_ORIGIN` as the canonical Auth redirect and mutation origin. Incoming Host and forwarded protocol are consistency checks only: missing protocol, lists and mismatches fail closed, and forwarded host never constructs a redirect destination.

### Status

Accepted — approved Phase 7 implementation decision.

## D-097 — Wardrobe writes use capability-specific RPCs while reads retain user-context RLS

### Decision

Implement the first invariant-heavy Wardrobe aggregate writes as two narrow server-only PostgreSQL capabilities: `save_wardrobe_item` and `set_wardrobe_item_state`. The application verifies the Auth subject, derives the durable account, enforces exact-origin request intent and validates the payload before a service-role client invokes either function. Keep ordinary reads on the publishable user-context client under forced RLS. Do not expose direct browser mutation grants or a generic privileged repository.

### Why

D-091 intentionally deferred the exact command transport until the first real aggregate. ClothingItem save spans the root, controlled joins, owner-scoped tags and sparse AppearanceVariants and must be atomic. A reviewed function gives that transaction one bounded authority while preserving RLS as an independent read/isolation layer and keeping ownership outside browser control.

### Alternatives considered

- Direct authenticated PostgREST inserts/updates across aggregate tables.
- A broad service-role repository callable by arbitrary application modules.
- A pooled SQL adapter before the project has another transaction shape that justifies it.
- Client-side compensation across multiple independent writes.

### Consequences

Each new privileged command still requires its own schema, grants, server authorization, idempotency/concurrency behavior and negative tests; D-097 is not permission to bypass RLS generically. Functions use an empty search path and are revoked from `public`, `anon` and `authenticated`. The service credential stays in `server-only` code. Reads and known-ID denial continue to be proven with real authenticated RLS context. A future pooled adapter may coexist if it preserves the same capability boundary.

High-cardinality structured filtering is implemented separately as the authenticated-only `SECURITY INVOKER` function `search_wardrobe_item_ids`. It keeps user identity and ownership under RLS, performs relational filters in PostgreSQL and caps results below the Data API row ceiling; it is not a privileged write capability.

### Status

Implemented in Phase 8. Independent review findings were remediated; explicit Phase 8 approval remains separate.
