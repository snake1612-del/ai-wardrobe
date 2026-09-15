begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name in (
        'accounts', 'account_preferences', 'categories', 'colors', 'seasons', 'tags',
        'clothing_items', 'clothing_item_colors', 'clothing_item_seasons',
        'clothing_item_tags', 'item_metadata_evidence', 'appearance_variants',
        'media_assets', 'media_bindings', 'media_renditions', 'outfits', 'outfit_items',
        'outfit_seasons', 'outfit_tags', 'wear_events', 'wear_event_items',
        'import_sources', 'external_item_identities', 'import_sessions', 'import_records',
        'import_asset_links', 'jobs', 'idempotency_records', 'audit_events',
        'export_requests', 'account_deletion_requests'
      )
  ),
  31,
  'all 31 approved application tables exist'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public' and column_name = 'source_version'
  ),
  0,
  'removed media source_version has not returned'
);

select has_extension('pg_trgm', 'pg_trgm is installed');
select col_is_pk('public', 'accounts', 'id', 'accounts uses id as primary key');
select col_type_is('public', 'accounts', 'id', 'uuid', 'account IDs are UUID');
select col_has_default('public', 'accounts', 'id', 'account UUID has a database default');

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000101', 'foundation-search@example.invalid');
insert into public.accounts (id, auth_user_id)
values ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101');
insert into public.clothing_items (
  id, account_id, record_state, display_name, brand, description
)
values (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000201',
  'committed',
  'Тёплая куртка',
  'Columbia',
  'Синяя зимняя одежда'
);

select ok(
  (select search_document @@ websearch_to_tsquery('simple', 'куртка') from public.clothing_items where id = '00000000-0000-0000-0000-000000000301'),
  'simple FTS finds Russian text'
);
select ok(
  (select search_document @@ websearch_to_tsquery('simple', 'Columbia') from public.clothing_items where id = '00000000-0000-0000-0000-000000000301'),
  'simple FTS finds an English brand'
);
select ok(
  (select extensions.word_similarity('теплая курка', search_text) > 0.25 from public.clothing_items where id = '00000000-0000-0000-0000-000000000301'),
  'trigram word similarity is useful for a Cyrillic typo'
);
select ok(
  (select search_text like '%co%' from public.clothing_items where id = '00000000-0000-0000-0000-000000000301'),
  'same-row search text supports a short normalized query'
);

select * from finish();
rollback;
