create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  record_state text not null default 'draft',
  lifecycle_state text not null default 'active',
  title text,
  notes text,
  is_favorite boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint outfits_account_id_unique unique (account_id, id),
  constraint outfits_record_state_allowed check (record_state in ('draft', 'committed')),
  constraint outfits_lifecycle_state_allowed check (lifecycle_state in ('active', 'archived')),
  constraint outfits_committed_title check (
    record_state <> 'committed' or (title is not null and btrim(title) <> '')
  ),
  constraint outfits_archive_consistency check (
    (lifecycle_state = 'active' and archived_at is null) or
    (lifecycle_state = 'archived' and archived_at is not null)
  ),
  constraint outfits_draft_active check (record_state <> 'draft' or lifecycle_state = 'active'),
  constraint outfits_version_positive check (version > 0)
);

create table public.outfit_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  outfit_id uuid not null,
  clothing_item_id uuid not null,
  appearance_variant_id uuid,
  semantic_role text,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint outfit_items_account_id_unique unique (account_id, id),
  constraint outfit_items_physical_item_unique unique (outfit_id, clothing_item_id),
  constraint outfit_items_position_unique unique (outfit_id, position),
  constraint outfit_items_outfit_fk foreign key (account_id, outfit_id)
    references public.outfits(account_id, id) on delete cascade,
  constraint outfit_items_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete restrict,
  constraint outfit_items_variant_fk foreign key (account_id, appearance_variant_id, clothing_item_id)
    references public.appearance_variants(account_id, id, clothing_item_id) on delete restrict,
  constraint outfit_items_role_allowed check (
    semantic_role is null or semantic_role in ('top', 'bottom', 'one_piece', 'outerwear', 'shoes', 'accessory', 'other')
  ),
  constraint outfit_items_position_nonnegative check (position >= 0)
);

create table public.outfit_seasons (
  account_id uuid not null,
  outfit_id uuid not null,
  season_id uuid not null references public.seasons(id) on delete restrict,
  primary key (outfit_id, season_id),
  constraint outfit_seasons_outfit_fk foreign key (account_id, outfit_id)
    references public.outfits(account_id, id) on delete cascade
);

create table public.outfit_tags (
  account_id uuid not null,
  outfit_id uuid not null,
  tag_id uuid not null,
  primary key (outfit_id, tag_id),
  constraint outfit_tags_outfit_fk foreign key (account_id, outfit_id)
    references public.outfits(account_id, id) on delete cascade,
  constraint outfit_tags_tag_fk foreign key (account_id, tag_id)
    references public.tags(account_id, id) on delete restrict
);
