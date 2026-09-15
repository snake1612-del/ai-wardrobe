begin;

create extension if not exists pgtap with schema extensions;

create function pg_temp.raises_sqlstate(statement text, expected_state text)
returns boolean
language plpgsql
as $$
declare
  actual_state text;
begin
  execute statement;
  return false;
exception when others then
  get stacked diagnostics actual_state = returned_sqlstate;
  return actual_state = expected_state;
end
$$;

select plan(15);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000111', 'user-a-constraints@example.invalid'),
  ('00000000-0000-0000-0000-000000000112', 'user-b-constraints@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000111'),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000112');
insert into public.clothing_items (id, account_id, record_state, display_name) values
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000211', 'committed', 'A item one'),
  ('00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000211', 'committed', 'A item two'),
  ('00000000-0000-0000-0000-000000000313', '00000000-0000-0000-0000-000000000212', 'committed', 'B item');
insert into public.appearance_variants (id, account_id, clothing_item_id, label, is_default) values
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000311', 'Face A', true);
insert into public.outfits (id, account_id) values
  ('00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000211');

insert into public.outfit_items (account_id, outfit_id, clothing_item_id, appearance_variant_id, position)
values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000411', 0);
select pass('same-account outfit item and variant succeed');

select ok(pg_temp.raises_sqlstate(
  $$insert into public.outfit_items (account_id, outfit_id, clothing_item_id, position) values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000313', 1)$$,
  '23503'
), 'User A outfit cannot reference User B item');

select ok(pg_temp.raises_sqlstate(
  $$insert into public.outfit_items (account_id, outfit_id, clothing_item_id, appearance_variant_id, position) values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000411', 1)$$,
  '23503'
), 'variant from another item is rejected');

select ok(pg_temp.raises_sqlstate(
  $$insert into public.outfit_items (account_id, outfit_id, clothing_item_id, position) values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000311', 2)$$,
  '23505'
), 'same physical item cannot occur twice in one outfit');

insert into public.media_assets (id, account_id, origin_code, evidence_status, storage_bucket, storage_object_key) values
  ('00000000-0000-0000-0000-000000000611', '00000000-0000-0000-0000-000000000211', 'user_uploaded', 'real_item_evidence', 'wardrobe-originals', 'a/source'),
  ('00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-000000000212', 'user_uploaded', 'real_item_evidence', 'wardrobe-originals', 'b/source');

insert into public.media_bindings (account_id, media_asset_id, clothing_item_id, product_role)
values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000611', '00000000-0000-0000-0000-000000000311', 'catalog');
select pass('same-account media binding succeeds');

select ok(pg_temp.raises_sqlstate(
  $$insert into public.media_bindings (account_id, media_asset_id, clothing_item_id, product_role) values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-000000000311', 'catalog')$$,
  '23503'
), 'User A binding cannot reference User B asset');

select ok(pg_temp.raises_sqlstate(
  $$insert into public.media_assets (account_id, origin_code, evidence_status, storage_bucket, storage_object_key, replaces_asset_id) values ('00000000-0000-0000-0000-000000000211', 'user_uploaded', 'real_item_evidence', 'wardrobe-originals', 'a/replacement', '00000000-0000-0000-0000-000000000612')$$,
  '23503'
), 'media replacement lineage is same-account only');

insert into public.media_assets (account_id, origin_code, evidence_status, storage_bucket, storage_object_key, replaces_asset_id)
values ('00000000-0000-0000-0000-000000000211', 'user_uploaded', 'real_item_evidence', 'wardrobe-originals', 'a/replacement-valid', '00000000-0000-0000-0000-000000000611');
select pass('same-account media replacement lineage succeeds');

insert into public.media_renditions (account_id, media_asset_id, rendition_kind, processor_profile_version, storage_bucket, storage_object_key)
values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000611', 'thumbnail', 'v1', 'wardrobe-renditions', 'a/thumb-v1');
select ok(pg_temp.raises_sqlstate(
  $$insert into public.media_renditions (account_id, media_asset_id, rendition_kind, processor_profile_version, storage_bucket, storage_object_key) values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000611', 'thumbnail', 'v2', 'wardrobe-renditions', 'a/thumb-v2')$$,
  '23505'
), 'one current rendition exists per account, immutable asset and kind');

insert into public.wear_events (id, account_id, occurred_on, timezone_name) values
  ('00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000211', '2026-09-15', 'Europe/Simferopol'),
  ('00000000-0000-0000-0000-000000000712', '00000000-0000-0000-0000-000000000211', '2026-09-15', 'Europe/Simferopol');
select is((select count(*)::integer from public.wear_events where account_id = '00000000-0000-0000-0000-000000000211' and occurred_on = '2026-09-15'), 2, 'two separate wear events on one day are legitimate');

insert into public.wear_event_items (account_id, wear_event_id, snapshot_item_id, clothing_item_id, item_display_name_snapshot, position)
values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000311', 'A item one', 0);
select ok(pg_temp.raises_sqlstate(
  $$insert into public.wear_event_items (account_id, wear_event_id, snapshot_item_id, clothing_item_id, item_display_name_snapshot, position) values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000311', 'A item one', 1)$$,
  '23505'
), 'one physical item cannot occur twice in one wear snapshot');

insert into public.wear_event_items (
  account_id, wear_event_id, snapshot_item_id, clothing_item_id,
  snapshot_variant_id, appearance_variant_id, item_display_name_snapshot,
  variant_label_snapshot, position
)
values (
  '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000712',
  '00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000311',
  '00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000411',
  'A item one', 'Face A', 0
);
update public.appearance_variants
set is_default = false, archived_at = now()
where id = '00000000-0000-0000-0000-000000000411';
select is(
  (select variant_label_snapshot from public.wear_event_items where wear_event_id = '00000000-0000-0000-0000-000000000712'),
  'Face A',
  'archiving a variant does not change its historical wear snapshot'
);

insert into public.wear_event_items (
  account_id, wear_event_id, snapshot_item_id, clothing_item_id,
  item_display_name_snapshot, position
)
values (
  '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000712',
  '00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000312',
  'A item two', 1
);
update public.wear_event_items
set clothing_item_id = null
where wear_event_id = '00000000-0000-0000-0000-000000000712'
  and snapshot_item_id = '00000000-0000-0000-0000-000000000312';
delete from public.clothing_items where id = '00000000-0000-0000-0000-000000000312';
select is(
  (select item_display_name_snapshot from public.wear_event_items where wear_event_id = '00000000-0000-0000-0000-000000000712' and snapshot_item_id = '00000000-0000-0000-0000-000000000312'),
  'A item two',
  'reviewed item hard-delete path retains minimal historical snapshot'
);

insert into public.import_sources (id, account_id, source_kind, source_namespace, display_name, adapter_version) values
  ('00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000211', 'test', 'archive-a', 'Synthetic A', '1'),
  ('00000000-0000-0000-0000-000000000812', '00000000-0000-0000-0000-000000000212', 'test', 'archive-b', 'Synthetic B', '1');
insert into public.external_item_identities (account_id, import_source_id, external_identifier, clothing_item_id) values
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000811', 'ITEM-1', '00000000-0000-0000-0000-000000000311'),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000812', 'ITEM-1', '00000000-0000-0000-0000-000000000313');
select pass('same external identifier on different account/source scopes succeeds');
select ok(pg_temp.raises_sqlstate(
  $$insert into public.external_item_identities (account_id, import_source_id, external_identifier, clothing_item_id) values ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000811', 'ITEM-1', '00000000-0000-0000-0000-000000000311')$$,
  '23505'
), 'external identifier is unique within owner and source');

select * from finish();
rollback;
