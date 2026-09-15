create table public.wear_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  occurred_on date not null,
  occurred_at timestamptz,
  timezone_name text not null,
  source_outfit_id uuid,
  source_outfit_title_snapshot text,
  notes text,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint wear_events_account_id_unique unique (account_id, id),
  constraint wear_events_outfit_fk foreign key (account_id, source_outfit_id)
    references public.outfits(account_id, id) on delete restrict,
  constraint wear_events_timezone_nonblank check (btrim(timezone_name) <> ''),
  constraint wear_events_version_positive check (version > 0)
);

create table public.wear_event_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  wear_event_id uuid not null,
  snapshot_item_id uuid not null,
  clothing_item_id uuid,
  snapshot_variant_id uuid,
  appearance_variant_id uuid,
  item_display_name_snapshot text not null,
  variant_label_snapshot text,
  category_code_snapshot text,
  category_label_snapshot text,
  position integer not null,
  constraint wear_event_items_snapshot_item_unique unique (wear_event_id, snapshot_item_id),
  constraint wear_event_items_position_unique unique (wear_event_id, position),
  constraint wear_event_items_event_fk foreign key (account_id, wear_event_id)
    references public.wear_events(account_id, id) on delete cascade,
  constraint wear_event_items_live_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete restrict,
  constraint wear_event_items_live_variant_fk foreign key (account_id, appearance_variant_id, clothing_item_id)
    references public.appearance_variants(account_id, id, clothing_item_id) on delete restrict,
  constraint wear_event_items_item_snapshot_nonblank check (btrim(item_display_name_snapshot) <> ''),
  constraint wear_event_items_variant_snapshot_pair check (
    (snapshot_variant_id is null and variant_label_snapshot is null) or
    (snapshot_variant_id is not null and variant_label_snapshot is not null and btrim(variant_label_snapshot) <> '')
  ),
  constraint wear_event_items_live_variant_requires_item check (
    appearance_variant_id is null or clothing_item_id is not null
  ),
  constraint wear_event_items_position_nonnegative check (position >= 0)
);
