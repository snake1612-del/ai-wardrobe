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

select plan(56);

select ok(exists(select 1 from storage.buckets where id = 'wardrobe-originals'), 'original bucket exists');
select ok(not (select public from storage.buckets where id = 'wardrobe-originals'), 'original bucket is private');
select is((select file_size_limit from storage.buckets where id = 'wardrobe-originals'), 16777216::bigint, 'original bucket has 16 MiB limit');
select is((select allowed_mime_types from storage.buckets where id = 'wardrobe-originals'), array['image/jpeg','image/png','image/webp']::text[], 'original allowlist is exact');
select ok(exists(select 1 from storage.buckets where id = 'wardrobe-renditions' and not public), 'rendition bucket is private');
select ok(exists(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'wardrobe_originals_authenticated_insert' and cmd = 'INSERT'), 'authenticated original insert policy exists');
select is((select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'wardrobe_renditions%'), 0, 'browser has no rendition policy');
select has_function('public', 'create_media_upload_intent', array['uuid','uuid','uuid','uuid','text','text','bigint','text','text','uuid','text','bytea'], 'upload intent capability exists');
select ok(has_function_privilege('service_role', 'public.create_media_upload_intent(uuid,uuid,uuid,uuid,text,text,bigint,text,text,uuid,text,bytea)', 'EXECUTE'), 'service role can create upload intent');
select ok(not has_function_privilege('authenticated', 'public.create_media_upload_intent(uuid,uuid,uuid,uuid,text,text,bigint,text,text,uuid,text,bytea)', 'EXECUTE'), 'authenticated role cannot call upload capability');
select ok(not has_function_privilege('anon', 'public.create_media_upload_intent(uuid,uuid,uuid,uuid,text,text,bigint,text,text,uuid,text,bytea)', 'EXECUTE'), 'anonymous role cannot call upload capability');
select ok((select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.create_media_upload_intent(uuid,uuid,uuid,uuid,text,text,bigint,text,text,uuid,text,bytea)'::regprocedure), 'upload capability has empty search_path');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000171', 'media-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000172', 'media-b@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000000271', '00000000-0000-0000-0000-000000000171'),
  ('00000000-0000-0000-0000-000000000272', '00000000-0000-0000-0000-000000000172');
insert into public.clothing_items (id, account_id, record_state, lifecycle_state, display_name) values
  ('00000000-0000-0000-0000-000000000371', '00000000-0000-0000-0000-000000000271', 'committed', 'active', 'Media A item'),
  ('00000000-0000-0000-0000-000000000372', '00000000-0000-0000-0000-000000000272', 'committed', 'active', 'Media B item');

create temporary table intent_a as
select * from public.create_media_upload_intent(
  '00000000-0000-0000-0000-000000000271',
  '00000000-0000-0000-0000-000000000471',
  '00000000-0000-0000-0000-000000000371',
  null, 'a.webp', 'image/webp', 100, 'catalog', 'front', null,
  'intent-a-00000001', decode(repeat('11', 32), 'hex')
);
select is((select asset_id from intent_a), '00000000-0000-0000-0000-000000000471'::uuid, 'intent creates server-selected asset');
select is((select storage_object_key from intent_a), 'accounts/00000000-0000-0000-0000-000000000271/assets/00000000-0000-0000-0000-000000000471/source/v1', 'intent derives exact immutable object path');
select is((select count(*)::integer from public.media_bindings where media_asset_id = '00000000-0000-0000-0000-000000000471'), 1, 'intent creates a separate media binding');
select is((select asset_id from public.create_media_upload_intent(
  '00000000-0000-0000-0000-000000000271', gen_random_uuid(),
  '00000000-0000-0000-0000-000000000371', null, 'a.webp', 'image/webp', 100,
  'catalog', 'front', null, 'intent-a-00000001', decode(repeat('11',32),'hex')
)), '00000000-0000-0000-0000-000000000471'::uuid, 'duplicate intent returns the original asset');
select is((select count(*)::integer from public.media_assets where account_id = '00000000-0000-0000-0000-000000000271'), 1, 'duplicate intent creates no asset');
select ok(pg_temp.raises_sqlstate($$select * from public.create_media_upload_intent(
  '00000000-0000-0000-0000-000000000271', gen_random_uuid(),
  '00000000-0000-0000-0000-000000000371', null, 'a.webp', 'image/webp', 100,
  'catalog', 'front', null, 'intent-a-00000001', decode(repeat('22',32),'hex'))$$, '22023'), 'intent replay with changed payload is rejected');

create temporary table intent_b as
select * from public.create_media_upload_intent(
  '00000000-0000-0000-0000-000000000272',
  '00000000-0000-0000-0000-000000000472',
  '00000000-0000-0000-0000-000000000372',
  null, 'b.png', 'image/png', 100, 'catalog', 'front', null,
  'intent-b-00000001', decode(repeat('33', 32), 'hex')
);
select is((select processing_state from intent_b), 'awaiting_upload', 'second account receives an independent intent');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000171","role":"authenticated"}', true);
select lives_ok($$insert into storage.objects (bucket_id, name, owner_id, metadata) values (
  'wardrobe-originals',
  'accounts/00000000-0000-0000-0000-000000000271/assets/00000000-0000-0000-0000-000000000471/source/v1',
  '00000000-0000-0000-0000-000000000171', '{"size":100}'::jsonb
)$$, 'User A can insert only the exact awaiting path');
select ok(pg_temp.raises_sqlstate($$insert into storage.objects (bucket_id, name, owner_id) values (
  'wardrobe-originals',
  'accounts/00000000-0000-0000-0000-000000000271/assets/00000000-0000-0000-0000-000000000471/source/v1',
  '00000000-0000-0000-0000-000000000171')$$, '23505'), 'overwrite is denied by immutable object identity');
select ok(pg_temp.raises_sqlstate($$insert into storage.objects (bucket_id, name, owner_id) values (
  'wardrobe-originals',
  'accounts/00000000-0000-0000-0000-000000000272/assets/00000000-0000-0000-0000-000000000472/source/v1',
  '00000000-0000-0000-0000-000000000171')$$, '42501'), 'User A cannot insert at User B known path');
select is((select count(*)::integer from storage.objects where bucket_id = 'wardrobe-originals'), 0, 'direct original read is denied');
select ok(pg_temp.raises_sqlstate($$insert into storage.objects (bucket_id, name, owner_id) values (
  'wardrobe-renditions', 'accounts/a/fake.webp', '00000000-0000-0000-0000-000000000171')$$, '42501'), 'direct rendition write is denied');
select throws_ok($$select * from public.create_media_upload_intent(
  '00000000-0000-0000-0000-000000000271', gen_random_uuid(),
  '00000000-0000-0000-0000-000000000371', null, 'x.webp', 'image/webp', 100,
  'catalog', 'front', null, 'intent-browser-denied', decode(repeat('44',32),'hex'))$$,
  '42501', null, 'browser cannot call service-role media command');
reset role;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select ok(pg_temp.raises_sqlstate($$insert into storage.objects (bucket_id, name, owner_id) values (
  'wardrobe-originals', 'accounts/anonymous/source/v1', null)$$, '42501'), 'anonymous upload is denied');
reset role;

create temporary table completed_a as
select * from public.complete_media_upload(
  '00000000-0000-0000-0000-000000000271',
  '00000000-0000-0000-0000-000000000471', 100,
  'complete-a-000001', decode(repeat('55',32),'hex')
);
select is((select processing_state from completed_a), 'uploaded', 'verified completion moves asset to uploaded');
select is((select count(*)::integer from public.jobs where media_asset_id = '00000000-0000-0000-0000-000000000471' and job_type = 'media.validate'), 1, 'completion enqueues one validation job');
select is((select processing_state from public.complete_media_upload(
  '00000000-0000-0000-0000-000000000271',
  '00000000-0000-0000-0000-000000000471', 100,
  'complete-a-000001', decode(repeat('55',32),'hex')
)), 'uploaded', 'duplicate completion returns the existing outcome');
select is((select count(*)::integer from public.jobs where media_asset_id = '00000000-0000-0000-0000-000000000471' and job_type = 'media.validate'), 1, 'duplicate completion creates no job');

create temporary table claimed as
select * from public.claim_media_job('worker-test', 120);
select is((select media_asset_id from claimed), '00000000-0000-0000-0000-000000000471'::uuid, 'worker claims the queued media job');
select is((select attempt_count from claimed), 1, 'claim increments bounded attempt count');
select is(public.record_media_validation(
  (select job_id from claimed), 'worker-test', true, false, '', 'image/webp', 100, 10, 10,
  decode(repeat('66',32),'hex')
), 'processing', 'valid media advances to processing');
select is((select count(*)::integer from public.media_renditions where media_asset_id = '00000000-0000-0000-0000-000000000471'), 3, 'validation creates exactly three rendition entities');
select is((select count(*)::integer from public.jobs where media_asset_id = '00000000-0000-0000-0000-000000000471' and job_type = 'media.process'), 1, 'validation enqueues one processing job');

create temporary table process_claim_one as
select * from public.claim_media_job('worker-process-one', 120);
select is((select job_type from process_claim_one), 'media.process', 'processing job can be leased');
select is((select attempt_count from process_claim_one), 1, 'first processing lease is attempt one');
update public.jobs set lease_expires_at = now() - interval '1 second'
where id = (select job_id from process_claim_one);
create temporary table process_claim_two as
select * from public.claim_media_job('worker-process-two', 120);
select is((select job_id from process_claim_two), (select job_id from process_claim_one), 'expired crash lease is reclaimed');
select is((select attempt_count from process_claim_two), 2, 'reclaimed crash lease increments attempt');
select is(public.fail_media_job(
  (select job_id from process_claim_two), 'worker-process-two', 'synthetic_worker_crash', 1
), 'queued', 'retryable worker failure returns the job to queue');
select ok((select lease_owner is null and lease_expires_at is null from public.jobs where id = (select job_id from process_claim_two)), 'retry clears the worker lease');
update public.jobs set available_at = now(), max_attempts = 3
where id = (select job_id from process_claim_two);
create temporary table process_claim_three as
select * from public.claim_media_job('worker-process-three', 120);
select is((select attempt_count from process_claim_three), 3, 'bounded final attempt can be claimed');
select is(public.fail_media_job(
  (select job_id from process_claim_three), 'worker-process-three', 'synthetic_terminal_failure', 1
), 'failed', 'exhausted worker retry becomes terminal');
select is((select processing_state from public.media_assets where id = '00000000-0000-0000-0000-000000000471'), 'failed', 'terminal worker failure makes asset explicitly failed');
create temporary table processing_retry as
select * from public.retry_media_asset(
  '00000000-0000-0000-0000-000000000271',
  '00000000-0000-0000-0000-000000000471',
  (select version from public.media_assets where id = '00000000-0000-0000-0000-000000000471')
);
select is((select processing_state from processing_retry), 'processing', 'processing failure retry resumes without recreating renditions');
select is((select count(*)::integer from public.jobs where media_asset_id = '00000000-0000-0000-0000-000000000471' and job_type = 'media.process' and state = 'queued'), 1, 'processing retry creates one fresh deduplicated job');

insert into public.media_assets (
  id, account_id, origin_code, evidence_status, storage_bucket, storage_object_key,
  original_filename, declared_mime_type, verified_mime_type, byte_size, width_px,
  height_px, content_hash, processing_state
) values
  (
    '00000000-0000-0000-0000-000000000473', '00000000-0000-0000-0000-000000000271',
    'user_uploaded', 'real_item_evidence', 'wardrobe-originals',
    'accounts/00000000-0000-0000-0000-000000000271/assets/00000000-0000-0000-0000-000000000473/source/v1',
    'ready-one.webp', 'image/webp', 'image/webp', 100, 10, 10, decode(repeat('73',32),'hex'), 'ready'
  ),
  (
    '00000000-0000-0000-0000-000000000474', '00000000-0000-0000-0000-000000000271',
    'user_uploaded', 'real_item_evidence', 'wardrobe-originals',
    'accounts/00000000-0000-0000-0000-000000000271/assets/00000000-0000-0000-0000-000000000474/source/v1',
    'ready-two.webp', 'image/webp', 'image/webp', 100, 10, 10, decode(repeat('74',32),'hex'), 'ready'
  );
insert into public.media_bindings (
  id, account_id, media_asset_id, clothing_item_id, product_role, image_view, position, is_primary
) values
  (
    '00000000-0000-0000-0000-000000000573', '00000000-0000-0000-0000-000000000271',
    '00000000-0000-0000-0000-000000000473', '00000000-0000-0000-0000-000000000371',
    'catalog', 'front', 1, false
  ),
  (
    '00000000-0000-0000-0000-000000000574', '00000000-0000-0000-0000-000000000271',
    '00000000-0000-0000-0000-000000000474', '00000000-0000-0000-0000-000000000371',
    'catalog', 'back', 2, false
  );
select is(public.set_media_gallery(
  '00000000-0000-0000-0000-000000000271', '00000000-0000-0000-0000-000000000371', 1,
  array[
    '00000000-0000-0000-0000-000000000573'::uuid,
    (select id from public.media_bindings where media_asset_id = '00000000-0000-0000-0000-000000000471'),
    '00000000-0000-0000-0000-000000000574'::uuid
  ],
  '00000000-0000-0000-0000-000000000573'
), 2::bigint, 'gallery reorder accepts complete order containing a non-ready placeholder');
select is((select position from public.media_bindings where media_asset_id = '00000000-0000-0000-0000-000000000471'), 1, 'non-ready placeholder receives its requested position');
select throws_ok($$select public.set_media_gallery(
  '00000000-0000-0000-0000-000000000271', '00000000-0000-0000-0000-000000000371', 2,
  array[
    '00000000-0000-0000-0000-000000000573'::uuid,
    (select id from public.media_bindings where media_asset_id = '00000000-0000-0000-0000-000000000471'),
    '00000000-0000-0000-0000-000000000574'::uuid
  ],
  (select id from public.media_bindings where media_asset_id = '00000000-0000-0000-0000-000000000471')
)$$, 'P0002', 'gallery primary unavailable', 'a non-ready asset cannot become primary');
select is(public.remove_media_binding(
  '00000000-0000-0000-0000-000000000271', '00000000-0000-0000-0000-000000000371',
  '00000000-0000-0000-0000-000000000573', 2
), 3::bigint, 'current primary can be removed with optimistic concurrency');
select ok((select is_primary from public.media_bindings where id = '00000000-0000-0000-0000-000000000574'), 'removing current primary promotes the next ready catalog binding');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000171","role":"authenticated"}', true);
select is((select count(*)::integer from public.media_assets where id = '00000000-0000-0000-0000-000000000471'), 1, 'User A reads own media metadata');
select is((select count(*)::integer from public.media_assets where id = '00000000-0000-0000-0000-000000000472'), 0, 'User A cannot read User B media by known ID');
reset role;

do $archive$
begin
  perform * from public.set_wardrobe_item_state(
    '00000000-0000-0000-0000-000000000271',
    '00000000-0000-0000-0000-000000000371',
    (select version from public.clothing_items where id = '00000000-0000-0000-0000-000000000371'),
    'archive'
  );
end
$archive$;
select is((select count(*)::integer from public.media_assets where id = '00000000-0000-0000-0000-000000000471'), 1, 'archiving ClothingItem does not delete media');
select is((select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and cmd in ('SELECT','UPDATE','DELETE') and policyname like 'wardrobe_%'), 0, 'Phase 9 exposes no browser Storage read, update or delete policy');
select ok(not has_function_privilege('authenticated', 'public.claim_media_job(text,integer)', 'EXECUTE'), 'browser cannot claim worker jobs');

select * from finish();
rollback;
