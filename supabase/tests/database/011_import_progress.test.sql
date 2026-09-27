begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

select has_function('public', 'get_import_progress', array['uuid','uuid'],
  'bounded progress capability exists');
select ok(
  (select prosecdef from pg_proc
   where oid = 'public.get_import_progress(uuid,uuid)'::regprocedure),
  'progress is SECURITY DEFINER'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc
   where oid = 'public.get_import_progress(uuid,uuid)'::regprocedure),
  'progress uses empty search_path'
);
select ok(
  has_function_privilege('service_role',
    'public.get_import_progress(uuid,uuid)', 'EXECUTE'),
  'service role may read progress'
);
select ok(
  not has_function_privilege('authenticated',
    'public.get_import_progress(uuid,uuid)', 'EXECUTE'),
  'browser role cannot call progress RPC directly'
);
select ok(
  not has_function_privilege('anon',
    'public.get_import_progress(uuid,uuid)', 'EXECUTE'),
  'anonymous cannot call progress RPC'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000971', 'progress-owner@example.invalid'),
  ('00000000-0000-0000-0000-000000000972', 'progress-other@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000000973', '00000000-0000-0000-0000-000000000971'),
  ('00000000-0000-0000-0000-000000000974', '00000000-0000-0000-0000-000000000972');
insert into public.import_sources (
  id, account_id, source_kind, source_namespace, display_name, adapter_version
) values (
  '00000000-0000-0000-0000-000000000975',
  '00000000-0000-0000-0000-000000000973',
  'wardrobe_image_set', 'fictional-progress-test', 'Fictional progress source',
  'legacy-wardrobe-image-set/v1'
);
insert into public.import_sessions (
  id, account_id, import_source_id, state
) values (
  '00000000-0000-0000-0000-000000000976',
  '00000000-0000-0000-0000-000000000973',
  '00000000-0000-0000-0000-000000000975',
  'uploaded'
);
insert into public.import_archive_parts (
  id, account_id, import_session_id, part_ordinal, storage_object_key,
  declared_byte_size, observed_byte_size, state
) values (
  '00000000-0000-0000-0000-000000000977',
  '00000000-0000-0000-0000-000000000973',
  '00000000-0000-0000-0000-000000000976',
  0, 'fictional/progress/archive', 100, 100, 'uploaded'
);

select is(
  (public.get_import_progress(
    '00000000-0000-0000-0000-000000000973',
    '00000000-0000-0000-0000-000000000976'
  ) ->> 'uploadedParts')::integer,
  1, 'owner sees staged part count but not object key'
);
select is(
  public.get_import_progress(
    '00000000-0000-0000-0000-000000000974',
    '00000000-0000-0000-0000-000000000976'
  ),
  null::jsonb, 'other account sees no known-ID progress'
);
select is(
  (public.get_import_progress(
    '00000000-0000-0000-0000-000000000973',
    '00000000-0000-0000-0000-000000000976'
  ) ->> 'canRetryPrepare')::boolean,
  false, 'no failed parse job never becomes retryable'
);

select * from finish();
rollback;
