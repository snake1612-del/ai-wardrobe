create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.accounts
  where auth_user_id = (select auth.uid())
$$;

revoke all on function private.current_account_id() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_account_id() to authenticated;

alter table public.categories enable row level security;
alter table public.categories force row level security;
alter table public.colors enable row level security;
alter table public.colors force row level security;
alter table public.seasons enable row level security;
alter table public.seasons force row level security;

create policy categories_authenticated_read on public.categories
  for select to authenticated using (true);
create policy colors_authenticated_read on public.colors
  for select to authenticated using (true);
create policy seasons_authenticated_read on public.seasons
  for select to authenticated using (true);

do $security$
declare
  table_name text;
begin
  foreach table_name in array array[
    'accounts', 'account_preferences', 'tags', 'clothing_items',
    'clothing_item_colors', 'clothing_item_seasons', 'clothing_item_tags',
    'item_metadata_evidence', 'appearance_variants', 'media_assets',
    'media_bindings', 'media_renditions', 'outfits', 'outfit_items',
    'outfit_seasons', 'outfit_tags', 'wear_events', 'wear_event_items',
    'import_sources', 'external_item_identities', 'import_sessions',
    'import_records', 'import_asset_links', 'jobs', 'idempotency_records',
    'audit_events', 'export_requests', 'account_deletion_requests'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end
$security$;

create policy accounts_owner_read on public.accounts
  for select to authenticated using (id = (select private.current_account_id()));

do $policies$
declare
  table_name text;
begin
  foreach table_name in array array[
    'account_preferences', 'tags', 'clothing_items', 'clothing_item_colors',
    'clothing_item_seasons', 'clothing_item_tags', 'item_metadata_evidence',
    'appearance_variants', 'media_assets', 'media_bindings', 'media_renditions',
    'outfits', 'outfit_items', 'outfit_seasons', 'outfit_tags', 'wear_events',
    'wear_event_items', 'import_sources', 'import_sessions', 'import_records',
    'import_asset_links'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (account_id = (select private.current_account_id()))',
      table_name || '_owner_read',
      table_name
    );
  end loop;
end
$policies$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.colors, public.seasons to authenticated;
grant select on
  public.accounts,
  public.account_preferences,
  public.tags,
  public.clothing_items,
  public.clothing_item_colors,
  public.clothing_item_seasons,
  public.clothing_item_tags,
  public.item_metadata_evidence,
  public.appearance_variants,
  public.media_assets,
  public.media_bindings,
  public.media_renditions,
  public.outfits,
  public.outfit_items,
  public.outfit_seasons,
  public.outfit_tags,
  public.wear_events,
  public.wear_event_items,
  public.import_sources,
  public.import_sessions,
  public.import_records,
  public.import_asset_links
to authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
