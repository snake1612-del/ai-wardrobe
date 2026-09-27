begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select has_function(
  'public', 'retry_import_prepare',
  array['uuid','uuid','bigint'],
  'Prepare retry capability exists'
);
select ok(
  (select prosecdef from pg_proc
   where oid = 'public.retry_import_prepare(uuid,uuid,bigint)'::regprocedure),
  'retry is SECURITY DEFINER'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc
   where oid = 'public.retry_import_prepare(uuid,uuid,bigint)'::regprocedure),
  'retry uses empty search_path'
);
select ok(
  has_function_privilege('service_role',
    'public.retry_import_prepare(uuid,uuid,bigint)', 'EXECUTE'),
  'service role may retry'
);
select ok(
  not has_function_privilege('authenticated',
    'public.retry_import_prepare(uuid,uuid,bigint)', 'EXECUTE'),
  'browser role cannot retry'
);
select ok(
  not has_function_privilege('anon',
    'public.retry_import_prepare(uuid,uuid,bigint)', 'EXECUTE'),
  'anonymous cannot retry'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000981', 'retry-owner@example.invalid'),
  ('00000000-0000-0000-0000-000000000982', 'retry-other@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000000983', '00000000-0000-0000-0000-000000000981'),
  ('00000000-0000-0000-0000-000000000984', '00000000-0000-0000-0000-000000000982');
insert into public.import_sources (
  id, account_id, source_kind, source_namespace, display_name, adapter_version
) values (
  '00000000-0000-0000-0000-000000000985',
  '00000000-0000-0000-0000-000000000983',
  'wardrobe_image_set', 'fictional-retry-test', 'Fictional retry source',
  'legacy-wardrobe-image-set/v1'
);
insert into public.import_sessions (
  id, account_id, import_source_id, state, failure_code
) values (
  '00000000-0000-0000-0000-000000000986',
  '00000000-0000-0000-0000-000000000983',
  '00000000-0000-0000-0000-000000000985',
  'failed', 'import_original_download_failed'
);
insert into public.import_archive_parts (
  id, account_id, import_session_id, part_ordinal, storage_object_key,
  declared_byte_size, observed_byte_size, state
) values (
  '00000000-0000-0000-0000-000000000987',
  '00000000-0000-0000-0000-000000000983',
  '00000000-0000-0000-0000-000000000986',
  0, 'fictional/retry/archive', 100, 100, 'uploaded'
);
insert into public.jobs (
  id, account_id, job_type, state, deduplication_key, import_session_id,
  attempt_count, max_attempts, failure_code
) values (
  '00000000-0000-0000-0000-000000000988',
  '00000000-0000-0000-0000-000000000983',
  'import.parse', 'failed', 'fictional-prepare-retry',
  '00000000-0000-0000-0000-000000000986',
  5, 5, 'import_original_download_failed'
);

select throws_ok(
  $$select public.retry_import_prepare(
    '00000000-0000-0000-0000-000000000984',
    '00000000-0000-0000-0000-000000000986', 1
  )$$, '40001', null, 'other account cannot retry known session ID'
);
select is(
  (public.retry_import_prepare(
    '00000000-0000-0000-0000-000000000983',
    '00000000-0000-0000-0000-000000000986', 1
  ) ->> 'state'), 'uploaded', 'owner requeues failed Prepare'
);
select results_eq(
  $$select state, attempt_count, max_attempts
    from public.jobs where id = '00000000-0000-0000-0000-000000000988'$$,
  $$values ('queued'::text, 5::integer, 6::integer)$$,
  'exactly one attempt is added and attempt history is retained'
);
select results_eq(
  $$select state, version from public.import_sessions
    where id = '00000000-0000-0000-0000-000000000986'$$,
  $$values ('uploaded'::text, 2::bigint)$$,
  'linked session returns to uploaded only'
);
select is(
  (select count(*)::integer from public.import_records
    where import_session_id = '00000000-0000-0000-0000-000000000986'),
  0, 'retry creates no import records'
);
select throws_ok(
  $$select public.retry_import_prepare(
    '00000000-0000-0000-0000-000000000983',
    '00000000-0000-0000-0000-000000000986', 2
  )$$, '40001', null, 'duplicate retry cannot grant another attempt'
);
select is(
  (select count(*)::integer from public.jobs
    where import_session_id = '00000000-0000-0000-0000-000000000986'),
  1, 'retry does not create duplicate jobs'
);
select is(
  (select count(*)::integer from public.clothing_items
    where account_id = '00000000-0000-0000-0000-000000000983'),
  0, 'retry creates no production item'
);

select * from finish();
rollback;
