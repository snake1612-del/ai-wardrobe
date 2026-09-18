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

select plan(62);

select ok(exists(select 1 from storage.buckets where id = 'wardrobe-imports'), 'import bucket exists');
select ok(not (select public from storage.buckets where id = 'wardrobe-imports'), 'import bucket is private');
select ok(exists(
  select 1 from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'wardrobe_imports_authenticated_insert' and cmd = 'INSERT'
), 'import bucket exposes only the narrow upload policy');
select has_function(
  'public', 'create_import_session_intent',
  array['uuid','uuid','jsonb','text','bytea'],
  'import intent capability exists'
);
select has_function(
  'public', 'confirm_import_session',
  array['uuid','uuid','bigint','bigint','bytea','text','bytea'],
  'sealed confirm capability exists'
);
select ok(
  (select 'search_path=""' = any(proconfig)
   from pg_proc
   where oid = 'public.confirm_import_session(uuid,uuid,bigint,bigint,bytea,text,bytea)'::regprocedure),
  'security definer confirm has empty search_path'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.create_import_session_intent(uuid,uuid,jsonb,text,bytea)',
    'EXECUTE'
  ),
  'service role can invoke import intent'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.create_import_session_intent(uuid,uuid,jsonb,text,bytea)',
    'EXECUTE'
  ),
  'browser cannot invoke the service capability'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.confirm_import_session(uuid,uuid,bigint,bigint,bytea,text,bytea)',
    'EXECUTE'
  ),
  'anonymous cannot confirm imports'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000181', 'import-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000182', 'import-b@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000000281', '00000000-0000-0000-0000-000000000181'),
  ('00000000-0000-0000-0000-000000000282', '00000000-0000-0000-0000-000000000182');

create temporary table import_intent as
select * from jsonb_to_record(public.create_import_session_intent(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  '[{"part_id":"00000000-0000-0000-0000-000000000481","ordinal":0,"byte_size":100}]'::jsonb,
  'import-intent-000001',
  decode(repeat('11', 32), 'hex')
)) as result(session_id uuid, state text, version bigint, parts jsonb);
select is(
  (select session_id from import_intent),
  '00000000-0000-0000-0000-000000000381'::uuid,
  'intent creates the server-selected session'
);
select is(
  (select storage_object_key from public.import_archive_parts where id = '00000000-0000-0000-0000-000000000481'),
  'accounts/00000000-0000-0000-0000-000000000281/imports/00000000-0000-0000-0000-000000000381/parts/00000000-0000-0000-0000-000000000481/source/v1',
  'archive object path is opaque and server-derived'
);
select is(
  (select count(*)::integer from public.clothing_items where account_id = '00000000-0000-0000-0000-000000000281'),
  0,
  'Choose creates no production domain record'
);
select is(
  (select count(*)::integer from public.jobs where import_session_id = '00000000-0000-0000-0000-000000000381' and job_type = 'import.cleanup' and available_at > now()),
  1,
  'Choose schedules one bounded retention cleanup for an abandoned session'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000181","role":"authenticated"}', true);
select lives_ok($$insert into storage.objects (bucket_id, name, owner_id, metadata) values (
  'wardrobe-imports',
  'accounts/00000000-0000-0000-0000-000000000281/imports/00000000-0000-0000-0000-000000000381/parts/00000000-0000-0000-0000-000000000481/source/v1',
  '00000000-0000-0000-0000-000000000181',
  '{"size":100}'::jsonb
)$$, 'User A can upload only the exact awaiting archive object');
select ok(pg_temp.raises_sqlstate($$insert into storage.objects (bucket_id, name, owner_id) values (
  'wardrobe-imports',
  'accounts/00000000-0000-0000-0000-000000000281/imports/00000000-0000-0000-0000-000000000381/parts/00000000-0000-0000-0000-000000000481/source/v1',
  '00000000-0000-0000-0000-000000000181'
)$$, '23505'), 'archive overwrite is denied');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000182","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.import_sessions where id = '00000000-0000-0000-0000-000000000381'),
  0,
  'User B cannot read User A session by known ID'
);
select is(
  (select count(*)::integer from public.import_archive_parts where id = '00000000-0000-0000-0000-000000000481'),
  0,
  'User B cannot read User A archive metadata by known ID'
);
select ok(pg_temp.raises_sqlstate($$insert into storage.objects (bucket_id, name, owner_id) values (
  'wardrobe-imports',
  'accounts/00000000-0000-0000-0000-000000000281/imports/00000000-0000-0000-0000-000000000381/parts/00000000-0000-0000-0000-000000000481/foreign',
  '00000000-0000-0000-0000-000000000182'
)$$, '42501'), 'User B cannot upload to User A known path');
reset role;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$select count(*) from public.import_sessions$$,
  '42501',
  null,
  'anonymous cannot read import staging'
);
reset role;

create temporary table completed_part as
select * from jsonb_to_record(public.complete_import_archive_part(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  '00000000-0000-0000-0000-000000000481',
  100
)) as result(part_id uuid, state text, session_state text, job_id uuid);
select is((select session_state from completed_part), 'uploaded', 'completion advances session after Storage verification');
select is(
  (select count(*)::integer from public.jobs where import_session_id = '00000000-0000-0000-0000-000000000381' and job_type = 'import.parse'),
  1,
  'completion enqueues one parse job'
);
select lives_ok($$select public.complete_import_archive_part(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  '00000000-0000-0000-0000-000000000481',
  100
)$$, 'duplicate completion is idempotent');
select is(
  (select count(*)::integer from public.jobs where import_session_id = '00000000-0000-0000-0000-000000000381' and job_type = 'import.parse'),
  1,
  'duplicate completion creates no parse job'
);

update public.accounts
set state = 'restricted'
where id = '00000000-0000-0000-0000-000000000281';
select is(
  (select count(*)::integer from public.claim_import_job('import-worker-restricted', 120)),
  0,
  'restricted account cannot start Prepare or commit work'
);
update public.accounts
set state = 'active'
where id = '00000000-0000-0000-0000-000000000281';
create temporary table parse_claim as
select * from public.claim_import_job('import-worker-prepare', 120);
select is((select job_type from parse_claim), 'import.parse', 'worker claims Prepare');
select is(
  public.stage_import_asset(
    'import-worker-prepare',
    (select job_id from parse_claim),
    '00000000-0000-0000-0000-000000000581',
    'p0:e0',
    'accounts/00000000-0000-0000-0000-000000000281/imports/00000000-0000-0000-0000-000000000381/assets/00000000-0000-0000-0000-000000000581/source/v1',
    'image/jpeg', 90, decode(repeat('58', 32), 'hex'), 'catalog_candidate'
  ),
  '00000000-0000-0000-0000-000000000581'::uuid,
  'Prepare stages media separately from ClothingItem'
);
update public.media_assets
set processing_state = 'ready', width_px = 10, height_px = 10
where id = '00000000-0000-0000-0000-000000000581';
select is(
  public.finish_import_prepare(
    'import-worker-prepare',
    (select job_id from parse_claim),
    '[{"part_id":"00000000-0000-0000-0000-000000000481","sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]'::jsonb,
    '{"schema":"aiw.bulk-import/1","adapter":"legacy-wardrobe-image-set/v1","asset_count":1}'::jsonb
  ),
  3::bigint,
  'Prepare creates the canonical internal manifest and Review state'
);
select is(
  (select count(*)::integer from public.clothing_items where account_id = '00000000-0000-0000-0000-000000000281'),
  0,
  'Prepare still creates no production ClothingItem'
);
insert into public.clothing_items (
  id, account_id, record_state, lifecycle_state, display_name, archived_at
) values (
  '00000000-0000-0000-0000-000000000782',
  '00000000-0000-0000-0000-000000000281',
  'committed', 'archived', 'Archived fictional item', now()
);
select ok(pg_temp.raises_sqlstate($$select public.replace_import_resolution(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  3,
  '{"records":[{"source_record_key":"archived-target","action":"update","display_name":"Forbidden archived update","target_item_id":"00000000-0000-0000-0000-000000000782","expected_item_version":1,"variants":[],"asset_mappings":[{"asset_id":"00000000-0000-0000-0000-000000000581","role":"catalog","view":"front","is_primary":true}]}],"skipped_asset_ids":[]}'::jsonb
)$$, 'P0002'), 'archived item cannot be selected as an import update target');
delete from public.clothing_items
where id = '00000000-0000-0000-0000-000000000782';
insert into public.categories (id, code, label_ru, is_active) values (
  '00000000-0000-0000-0000-000000000781',
  'inactive-import-category',
  'Неактивная категория импорта',
  false
);
select ok(pg_temp.raises_sqlstate($$select public.replace_import_resolution(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  3,
  '{"records":[{"source_record_key":"inactive-category","action":"create","display_name":"Fictional coat","category_code":"inactive-import-category","variants":[],"asset_mappings":[{"asset_id":"00000000-0000-0000-0000-000000000581","role":"catalog","view":"front","is_primary":true}]}],"skipped_asset_ids":[]}'::jsonb
)$$, '22023'), 'inactive category cannot enter an import resolution');

select is(
  public.replace_import_resolution(
    '00000000-0000-0000-0000-000000000281',
    '00000000-0000-0000-0000-000000000381',
    3,
    '{"records":[],"skipped_asset_ids":["00000000-0000-0000-0000-000000000581"]}'::jsonb
  ),
  4::bigint,
  'Resolve accepts explicit skipped UUIDs without treating JSON quotes as UUID text'
);
select is(
  (select disposition from public.import_asset_links where media_asset_id = '00000000-0000-0000-0000-000000000581'),
  'skipped',
  'explicit skipped asset is recorded for cleanup'
);

select is(
  public.replace_import_resolution(
    '00000000-0000-0000-0000-000000000281',
    '00000000-0000-0000-0000-000000000381',
    4,
    '{"records":[{"record_id":"00000000-0000-0000-0000-000000000681","source_record_key":"resolved-1","action":"create","display_name":"Fictional coat","physical_set":false,"variants":[{"key":"blue","label":"Blue","is_default":true,"position":0}],"asset_mappings":[{"asset_id":"00000000-0000-0000-0000-000000000581","role":"catalog","view":"front","variant_key":"blue","is_primary":true}]}],"skipped_asset_ids":[]}'::jsonb
  ),
  5::bigint,
  'Resolve records explicit grouping, ImageView and AppearanceVariant separately'
);
update public.media_assets
set processing_state = 'uploaded'
where id = '00000000-0000-0000-0000-000000000581';
select ok(pg_temp.raises_sqlstate($$select public.build_import_preview(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  5
)$$, '40001'), 'Preview cannot seal assigned media before processing is ready');
update public.media_assets
set processing_state = 'ready'
where id = '00000000-0000-0000-0000-000000000581';
create temporary table preview as
select * from jsonb_to_record(public.build_import_preview(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  5
)) as result(session_id uuid, state text, version bigint, revision bigint, manifest_hash text, record_count integer);
select is((select state from preview), 'ready', 'Preview seals a ready revision');
select is(
  (select count(*)::integer from public.clothing_items where account_id = '00000000-0000-0000-0000-000000000281'),
  0,
  'Preview creates no production ClothingItem'
);
select ok(pg_temp.raises_sqlstate($$select public.replace_import_resolution(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  6,
  '{"records":[{"source_record_key":"foreign-update","action":"update","display_name":"Forbidden","target_item_id":"00000000-0000-0000-0000-000000000999","expected_item_version":1,"variants":[],"asset_mappings":[]}],"skipped_asset_ids":["00000000-0000-0000-0000-000000000581"]}'::jsonb
)$$, 'P0002'), 'known foreign or missing update target is rejected');

create temporary table confirmed as
select * from jsonb_to_record(public.confirm_import_session(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000381',
  (select version from preview),
  (select revision from preview),
  decode((select manifest_hash from preview), 'hex'),
  'confirm-import-0001',
  decode(repeat('22', 32), 'hex')
)) as result(session_id uuid, state text, revision bigint, version bigint);
select is((select state from confirmed), 'committing', 'explicit sealed Confirm opens production commit');
select is(
  (select count(*)::integer from public.audit_events where event_type = 'import.confirmed' and target_id = '00000000-0000-0000-0000-000000000381'),
  1,
  'Confirm is audit logged without private source content'
);
select lives_ok(format(
  $$select public.confirm_import_session(
    '00000000-0000-0000-0000-000000000281',
    '00000000-0000-0000-0000-000000000381',
    %s, %s, decode(%L, 'hex'),
    'confirm-import-0001', decode(repeat('22', 32), 'hex')
  )$$,
  (select version from preview), (select revision from preview), (select manifest_hash from preview)
), 'duplicate Confirm returns the prior idempotent result');
select is(
  (select count(*)::integer from public.jobs where import_session_id = '00000000-0000-0000-0000-000000000381' and job_type = 'import.commit'),
  1,
  'duplicate Confirm creates no duplicate commit job'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000181","role":"authenticated"}', true);
select throws_ok(format(
  $$select public.confirm_import_session(
    '00000000-0000-0000-0000-000000000281',
    '00000000-0000-0000-0000-000000000381',
    5, 3, decode(repeat('44', 32), 'hex'),
    'browser-confirm-denied', decode(repeat('33', 32), 'hex')
  )$$
), '42501', null, 'authenticated browser cannot invoke Confirm RPC directly');
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'wardrobe-imports'),
  0,
  'browser cannot read private archive objects directly'
);
reset role;

create temporary table commit_claim as
select * from public.claim_import_job('import-worker-commit', 120);
select is((select job_type from commit_claim), 'import.commit', 'worker claims bounded commit');
create temporary table committed_record as
select * from jsonb_to_record(public.commit_import_record(
  'import-worker-commit',
  (select job_id from commit_claim),
  '00000000-0000-0000-0000-000000000681'
)) as result(record_id uuid, outcome text, item_id uuid);
select is((select outcome from committed_record), 'created', 'per-record commit creates one item');
select lives_ok($$select public.commit_import_record(
  'import-worker-commit',
  (select job_id from commit_claim),
  '00000000-0000-0000-0000-000000000681'
)$$, 'commit-key replay returns the existing record outcome');
select is(
  (select count(*)::integer from public.clothing_items where account_id = '00000000-0000-0000-0000-000000000281'),
  1,
  'commit retry does not duplicate a physical item'
);
select is(
  (select count(*)::integer from public.media_bindings where clothing_item_id = (select item_id from committed_record)),
  1,
  'committed media remains a separate binding'
);
select is(
  (select count(*)::integer from public.appearance_variants where clothing_item_id = (select item_id from committed_record)),
  1,
  'AppearanceVariant remains a separate entity'
);
select is(
  (select count(*)::integer from public.wear_events where account_id = '00000000-0000-0000-0000-000000000281'),
  0,
  'import does not infer WearEvent'
);
create temporary table finalized as
select * from jsonb_to_record(public.finalize_import_commit(
  'import-worker-commit',
  (select job_id from commit_claim)
)) as result(session_id uuid, state text, succeeded integer, failed integer, skipped integer);
select is((select state from finalized), 'completed', 'all successful records complete the session');
select is((select succeeded from finalized), 1, 'Results report successful records item by item');
create temporary table cleanup_claim as
select * from public.claim_import_job('import-worker-cleanup', 120);
select is((select job_type from cleanup_claim), 'import.cleanup', 'worker claims terminal cleanup');
select is(
  (select state from public.import_sessions where id = '00000000-0000-0000-0000-000000000381'),
  'completed',
  'cleanup lease preserves the terminal Results state'
);
select ok(
  public.fail_import_job(
    'import-worker-cleanup',
    (select job_id from cleanup_claim),
    'synthetic_cleanup_failure',
    30
  ),
  'cleanup failure remains retryable without rewriting import outcomes'
);
select is(
  (select state from public.import_sessions where id = '00000000-0000-0000-0000-000000000381'),
  'completed',
  'cleanup failure preserves completed Results state'
);
select set_config(
  'test.imported_item_id',
  (select item_id::text from committed_record),
  true
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000182","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.clothing_items where id = current_setting('test.imported_item_id')::uuid),
  0,
  'User B cannot read imported User A item by known ID'
);
select is(
  (select count(*)::integer from public.import_records where id = '00000000-0000-0000-0000-000000000681'),
  0,
  'User B cannot read User A itemized report by known ID'
);
reset role;

select public.create_import_session_intent(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000382',
  '[{"part_id":"00000000-0000-0000-0000-000000000482","ordinal":0,"byte_size":100}]'::jsonb,
  'import-intent-cancel-01',
  decode(repeat('66', 32), 'hex')
);
insert into storage.objects (bucket_id, name, owner_id, metadata) values (
  'wardrobe-imports',
  'accounts/00000000-0000-0000-0000-000000000281/imports/00000000-0000-0000-0000-000000000382/parts/00000000-0000-0000-0000-000000000482/source/v1',
  '00000000-0000-0000-0000-000000000181',
  '{"size":100}'::jsonb
);
select public.complete_import_archive_part(
  '00000000-0000-0000-0000-000000000281',
  '00000000-0000-0000-0000-000000000382',
  '00000000-0000-0000-0000-000000000482',
  100
);
select is(
  public.cancel_import_session(
    '00000000-0000-0000-0000-000000000281',
    '00000000-0000-0000-0000-000000000382',
    2
  ),
  3::bigint,
  'uploaded session can be cancelled before Prepare'
);
select is(
  (select state from public.jobs where import_session_id = '00000000-0000-0000-0000-000000000382' and job_type = 'import.parse'),
  'cancelled',
  'cancellation invalidates the stale queued Prepare job'
);
create temporary table cancelled_cleanup_claim as
select * from public.claim_import_job('import-worker-cancel-cleanup', 120);
select is((select job_type from cancelled_cleanup_claim), 'import.cleanup', 'cancelled session exposes only cleanup work');
select is(
  (select state from public.import_sessions where id = '00000000-0000-0000-0000-000000000382'),
  'cancelled',
  'cancel cleanup lease preserves cancelled state'
);

select * from finish();
rollback;
