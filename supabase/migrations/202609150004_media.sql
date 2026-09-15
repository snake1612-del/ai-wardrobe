create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  origin_code text not null,
  evidence_status text not null,
  storage_bucket text not null,
  storage_object_key text not null,
  original_filename text,
  declared_mime_type text,
  verified_mime_type text,
  byte_size bigint,
  width_px integer,
  height_px integer,
  content_hash bytea,
  processing_state text not null default 'awaiting_upload',
  failure_code text,
  replaces_asset_id uuid,
  delete_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint media_assets_account_id_unique unique (account_id, id),
  constraint media_assets_storage_key_unique unique (storage_bucket, storage_object_key),
  constraint media_assets_replacement_fk foreign key (account_id, replaces_asset_id)
    references public.media_assets(account_id, id) on delete restrict,
  constraint media_assets_origin_allowed check (
    origin_code in ('user_captured', 'user_uploaded', 'imported', 'external_catalog')
  ),
  constraint media_assets_evidence_allowed check (
    evidence_status in ('real_item_evidence', 'reference_only')
  ),
  constraint media_assets_state_allowed check (
    processing_state in ('awaiting_upload', 'uploaded', 'validating', 'processing', 'ready', 'quarantined', 'failed', 'pending_delete')
  ),
  constraint media_assets_private_bucket check (
    storage_bucket in ('wardrobe-originals', 'wardrobe-import-staging')
  ),
  constraint media_assets_storage_key_nonblank check (btrim(storage_object_key) <> ''),
  constraint media_assets_byte_size check (byte_size is null or byte_size > 0),
  constraint media_assets_dimensions check (
    (width_px is null and height_px is null) or
    (width_px > 0 and height_px > 0)
  ),
  constraint media_assets_replacement_not_self check (replaces_asset_id is null or replaces_asset_id <> id),
  constraint media_assets_version_positive check (version > 0)
);

create table public.media_bindings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  media_asset_id uuid not null,
  clothing_item_id uuid not null,
  appearance_variant_id uuid,
  product_role text not null,
  image_view text not null default 'unspecified',
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint media_bindings_asset_fk foreign key (account_id, media_asset_id)
    references public.media_assets(account_id, id) on delete restrict,
  constraint media_bindings_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete restrict,
  constraint media_bindings_variant_fk foreign key (account_id, appearance_variant_id, clothing_item_id)
    references public.appearance_variants(account_id, id, clothing_item_id) on delete restrict,
  constraint media_bindings_role_allowed check (product_role in ('evidence_source', 'catalog', 'reference')),
  constraint media_bindings_view_allowed check (image_view in ('front', 'back', 'side', 'detail', 'unspecified')),
  constraint media_bindings_primary_catalog_only check (not is_primary or product_role = 'catalog'),
  constraint media_bindings_position_nonnegative check (position >= 0)
);

create unique index media_bindings_semantic_unique
  on public.media_bindings (
    account_id,
    media_asset_id,
    clothing_item_id,
    coalesce(appearance_variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    product_role,
    image_view
  );
create unique index media_bindings_item_primary_unique
  on public.media_bindings (account_id, clothing_item_id)
  where is_primary and appearance_variant_id is null;
create unique index media_bindings_variant_primary_unique
  on public.media_bindings (account_id, appearance_variant_id)
  where is_primary and appearance_variant_id is not null;

create table public.media_renditions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  media_asset_id uuid not null,
  rendition_kind text not null,
  processor_profile_version text not null,
  storage_bucket text not null,
  storage_object_key text not null,
  mime_type text,
  byte_size bigint,
  width_px integer,
  height_px integer,
  state text not null default 'pending',
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint media_renditions_asset_kind_unique unique (account_id, media_asset_id, rendition_kind),
  constraint media_renditions_storage_key_unique unique (storage_bucket, storage_object_key),
  constraint media_renditions_asset_fk foreign key (account_id, media_asset_id)
    references public.media_assets(account_id, id) on delete cascade,
  constraint media_renditions_kind_allowed check (rendition_kind in ('thumbnail', 'medium', 'full')),
  constraint media_renditions_profile_nonblank check (btrim(processor_profile_version) <> ''),
  constraint media_renditions_private_bucket check (storage_bucket = 'wardrobe-renditions'),
  constraint media_renditions_storage_key_nonblank check (btrim(storage_object_key) <> ''),
  constraint media_renditions_state_allowed check (state in ('pending', 'processing', 'ready', 'failed', 'pending_delete')),
  constraint media_renditions_byte_size check (byte_size is null or byte_size > 0),
  constraint media_renditions_dimensions check (
    (width_px is null and height_px is null) or
    (width_px > 0 and height_px > 0)
  ),
  constraint media_renditions_ready_metadata check (
    state <> 'ready' or
    (mime_type is not null and byte_size is not null and width_px is not null and height_px is not null)
  ),
  constraint media_renditions_version_positive check (version > 0)
);
