begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select has_function(
  'public', 'renew_import_prepare_lease',
  array['text','uuid','integer'],
  'Prepare renewal capability exists'
);
select ok(
  (select prosecdef from pg_proc
   where oid = 'public.renew_import_prepare_lease(text,uuid,integer)'::regprocedure),
  'renewal is SECURITY DEFINER'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc
   where oid = 'public.renew_import_prepare_lease(text,uuid,integer)'::regprocedure),
  'renewal uses an empty search_path'
);
select ok(
  has_function_privilege('service_role',
    'public.renew_import_prepare_lease(text,uuid,integer)', 'EXECUTE'),
  'service role may renew'
);
select ok(
  not has_function_privilege('authenticated',
    'public.renew_import_prepare_lease(text,uuid,integer)', 'EXECUTE'),
  'browser role cannot renew'
);
select ok(
  not has_function_privilege('anon',
    'public.renew_import_prepare_lease(text,uuid,integer)', 'EXECUTE'),
  'anonymous cannot renew'
);
select throws_ok(
  $$select public.renew_import_prepare_lease(
    'synthetic-worker', '00000000-0000-0000-0000-000000000995', 30
  )$$, '22023', null, 'renewal duration is bounded'
);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000991', 'lease-fixture@example.invalid');
insert into public.accounts (id, auth_user_id)
values ('00000000-0000-0000-0000-000000000992', '00000000-0000-0000-0000-000000000991');
insert into public.import_sources (
  id, account_id, source_kind, source_namespace, display_name, adapter_version
) values (
  '00000000-0000-0000-0000-000000000993',
  '00000000-0000-0000-0000-000000000992',
  'wardrobe_image_set', 'synthetic-lease-test', 'Fictional lease source',
  'legacy-wardrobe-image-set/v1'
);
insert into public.import_sessions (
  id, account_id, import_source_id, state
) values (
  '00000000-0000-0000-0000-000000000994',
  '00000000-0000-0000-0000-000000000992',
  '00000000-0000-0000-0000-000000000993',
  'parsing'
);
insert into public.jobs (
  id, account_id, job_type, state, deduplication_key, import_session_id,
  attempt_count, lease_owner, lease_expires_at
) values (
  '00000000-0000-0000-0000-000000000995',
  '00000000-0000-0000-0000-000000000992',
  'import.parse', 'running', 'synthetic-prepare-lease',
  '00000000-0000-0000-0000-000000000994',
  1, 'synthetic-worker', now() + interval '120 seconds'
);

select ok(public.renew_import_prepare_lease(
  'synthetic-worker', '00000000-0000-0000-0000-000000000995', 300
), 'owner renews before expiry');
select ok(
  (select lease_expires_at > now() + interval '295 seconds'
   from public.jobs where id = '00000000-0000-0000-0000-000000000995'),
  'lease extends before the old deadline'
);
select ok(not public.renew_import_prepare_lease(
  'wrong-worker', '00000000-0000-0000-0000-000000000995', 300
), 'another worker cannot renew');

update public.jobs set lease_expires_at = now() - interval '1 second'
where id = '00000000-0000-0000-0000-000000000995';
select ok(not public.renew_import_prepare_lease(
  'synthetic-worker', '00000000-0000-0000-0000-000000000995', 300
), 'expired lease cannot be revived');
select throws_ok(
  $$select public.stage_import_asset(
    'synthetic-worker',
    '00000000-0000-0000-0000-000000000995',
    '00000000-0000-0000-0000-000000000996',
    'synthetic-reference', 'never-written', 'image/jpeg', 10,
    decode(repeat('11', 32), 'hex'), 'source_candidate'
  )$$, '40001', null, 'expired worker cannot stage an asset'
);
select is(
  (select count(*)::integer from public.media_assets
   where id = '00000000-0000-0000-0000-000000000996'),
  0, 'lost lease leaves no staged write'
);
update public.jobs set lease_expires_at = now() + interval '120 seconds'
where id = '00000000-0000-0000-0000-000000000995';

update public.import_sessions set state = 'cancelled'
where id = '00000000-0000-0000-0000-000000000994';
select ok(not public.renew_import_prepare_lease(
  'synthetic-worker', '00000000-0000-0000-0000-000000000995', 300
), 'cancelled session cannot renew');
update public.import_sessions set state = 'parsing'
where id = '00000000-0000-0000-0000-000000000994';

update public.accounts set state = 'restricted'
where id = '00000000-0000-0000-0000-000000000992';
select ok(not public.renew_import_prepare_lease(
  'synthetic-worker', '00000000-0000-0000-0000-000000000995', 300
), 'restricted account cannot renew');
update public.accounts set state = 'deleting'
where id = '00000000-0000-0000-0000-000000000992';
select ok(not public.renew_import_prepare_lease(
  'synthetic-worker', '00000000-0000-0000-0000-000000000995', 300
), 'deleting account cannot renew');
update public.accounts set state = 'active'
where id = '00000000-0000-0000-0000-000000000992';

update public.jobs set state = 'cancelled', lease_owner = null, lease_expires_at = null
where id = '00000000-0000-0000-0000-000000000995';
select ok(not public.renew_import_prepare_lease(
  'synthetic-worker', '00000000-0000-0000-0000-000000000995', 300
), 'cancelled job cannot renew');

select * from finish();
rollback;
