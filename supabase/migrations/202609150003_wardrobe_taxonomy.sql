create table public.tags (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  kind text not null default 'custom',
  code text,
  label text not null,
  normalized_label text not null,
  is_system_seed boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_account_id_unique unique (account_id, id),
  constraint tags_kind_allowed check (kind in ('purpose', 'style', 'custom')),
  constraint tags_label_nonblank check (btrim(label) <> ''),
  constraint tags_normalized_label_nonblank check (btrim(normalized_label) <> '')
);

create unique index tags_account_kind_code_unique
  on public.tags (account_id, kind, code)
  where code is not null;
create unique index tags_account_active_label_unique
  on public.tags (account_id, kind, normalized_label)
  where archived_at is null;

create table public.clothing_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  record_state text not null default 'draft',
  lifecycle_state text not null default 'active',
  display_name text,
  reference_code text,
  category_id uuid references public.categories(id) on delete restrict,
  brand text,
  description text,
  notes text,
  pattern text,
  material text,
  size_label text,
  purchase_amount numeric(14,2),
  purchase_currency char(3),
  purchased_on date,
  observation_started_on date,
  is_favorite boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  search_text text generated always as (
    lower(
      coalesce(reference_code, '') || ' ' || coalesce(display_name, '') || ' ' ||
      coalesce(brand, '') || ' ' || coalesce(pattern, '') || ' ' ||
      coalesce(material, '') || ' ' || coalesce(size_label, '') || ' ' ||
      coalesce(description, '') || ' ' || coalesce(notes, '')
    )
  ) stored,
  search_document tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(reference_code, '') || ' ' || coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(pattern, '') || ' ' || coalesce(material, '') || ' ' || coalesce(size_label, '')), 'C') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(description, '') || ' ' || coalesce(notes, '')), 'D')
  ) stored,
  constraint clothing_items_account_id_unique unique (account_id, id),
  constraint clothing_items_record_state check (record_state in ('draft', 'committed')),
  constraint clothing_items_lifecycle_state check (lifecycle_state in ('active', 'archived')),
  constraint clothing_items_committed_name check (
    record_state <> 'committed' or (display_name is not null and btrim(display_name) <> '')
  ),
  constraint clothing_items_money_pair check (
    (purchase_amount is null) = (purchase_currency is null)
  ),
  constraint clothing_items_money_nonnegative check (purchase_amount is null or purchase_amount >= 0),
  constraint clothing_items_currency_shape check (
    purchase_currency is null or purchase_currency ~ '^[A-Z]{3}$'
  ),
  constraint clothing_items_archive_consistency check (
    (lifecycle_state = 'active' and archived_at is null) or
    (lifecycle_state = 'archived' and archived_at is not null)
  ),
  constraint clothing_items_draft_active check (record_state <> 'draft' or lifecycle_state = 'active'),
  constraint clothing_items_version_positive check (version > 0)
);

create unique index clothing_items_reference_code_unique
  on public.clothing_items (account_id, lower(btrim(reference_code)))
  where reference_code is not null;

create table public.clothing_item_colors (
  account_id uuid not null,
  clothing_item_id uuid not null,
  color_id uuid not null references public.colors(id) on delete restrict,
  position smallint not null default 0,
  primary key (clothing_item_id, color_id),
  constraint clothing_item_colors_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete cascade,
  constraint clothing_item_colors_position check (position >= 0)
);

create table public.clothing_item_seasons (
  account_id uuid not null,
  clothing_item_id uuid not null,
  season_id uuid not null references public.seasons(id) on delete restrict,
  primary key (clothing_item_id, season_id),
  constraint clothing_item_seasons_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete cascade
);

create table public.clothing_item_tags (
  account_id uuid not null,
  clothing_item_id uuid not null,
  tag_id uuid not null,
  primary key (clothing_item_id, tag_id),
  constraint clothing_item_tags_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete cascade,
  constraint clothing_item_tags_tag_fk foreign key (account_id, tag_id)
    references public.tags(account_id, id) on delete restrict
);

create table public.appearance_variants (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  clothing_item_id uuid not null,
  label text not null,
  is_default boolean not null default false,
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appearance_variants_account_id_unique unique (account_id, id),
  constraint appearance_variants_item_identity_unique unique (account_id, id, clothing_item_id),
  constraint appearance_variants_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete restrict,
  constraint appearance_variants_label_nonblank check (btrim(label) <> ''),
  constraint appearance_variants_position_nonnegative check (position >= 0),
  constraint appearance_variants_archived_not_default check (archived_at is null or not is_default)
);

create unique index appearance_variants_one_default
  on public.appearance_variants (account_id, clothing_item_id)
  where is_default;
create unique index appearance_variants_active_label_unique
  on public.appearance_variants (account_id, clothing_item_id, lower(btrim(label)))
  where archived_at is null;

create table public.item_metadata_evidence (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  clothing_item_id uuid not null,
  field_code text not null,
  origin_code text not null,
  review_state text not null default 'proposed',
  proposed_value jsonb not null,
  decided_value jsonb,
  confidence numeric(5,4),
  import_record_id uuid,
  applied_item_version bigint,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint item_metadata_evidence_account_id_unique unique (account_id, id),
  constraint item_metadata_evidence_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete cascade,
  constraint item_metadata_evidence_field_allowed check (
    field_code in ('display_name', 'category_id', 'brand', 'description', 'pattern', 'material', 'size_label', 'color', 'season', 'tag')
  ),
  constraint item_metadata_evidence_origin_allowed check (
    origin_code in ('user_entered', 'imported', 'ai_detected', 'system_derived')
  ),
  constraint item_metadata_evidence_review_allowed check (
    review_state in ('proposed', 'accepted', 'corrected', 'rejected', 'superseded')
  ),
  constraint item_metadata_evidence_confidence check (
    (confidence is null) or
    (origin_code in ('ai_detected', 'system_derived') and confidence between 0 and 1)
  ),
  constraint item_metadata_evidence_applied_version check (
    applied_item_version is null or
    (applied_item_version > 0 and review_state in ('accepted', 'corrected'))
  )
);
