begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

select has_function(
  'public',
  'update_own_regional_preferences',
  array['text', 'text', 'smallint', 'bigint'],
  'owner regional preferences command exists'
);
select ok(
  (select prosecdef
   from pg_proc
   where oid = 'public.update_own_regional_preferences(text,text,smallint,bigint)'::regprocedure),
  'regional preferences command is SECURITY DEFINER'
);
select ok(
  (select 'search_path=""' = any(proconfig)
   from pg_proc
   where oid = 'public.update_own_regional_preferences(text,text,smallint,bigint)'::regprocedure),
  'regional preferences command uses an empty search_path'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.update_own_regional_preferences(text,text,smallint,bigint)',
    'EXECUTE'
  ),
  'authenticated owner may update regional preferences'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.update_own_regional_preferences(text,text,smallint,bigint)',
    'EXECUTE'
  ),
  'anonymous cannot update regional preferences'
);
select ok(
  not has_table_privilege('authenticated', 'public.account_preferences', 'UPDATE'),
  'browser roles cannot update account_preferences directly'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000002101', 'settings-a@example.invalid'),
  ('00000000-0000-0000-0000-000000002102', 'settings-b@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000002111', '00000000-0000-0000-0000-000000002101'),
  ('00000000-0000-0000-0000-000000002112', '00000000-0000-0000-0000-000000002102');
insert into public.account_preferences (account_id, locale_code, timezone_name, units_code) values
  ('00000000-0000-0000-0000-000000002111', 'ru', 'UTC', 'metric'),
  ('00000000-0000-0000-0000-000000002112', 'ru', 'UTC', 'metric');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000002101","role":"authenticated"}',
  true
);

select is(
  (select timezone_name
   from public.update_own_regional_preferences('Europe/Moscow', 'imperial', 7::smallint, 1::bigint)),
  'Europe/Moscow',
  'User A updates the time zone'
);
select is(
  (select units_code
   from public.update_own_regional_preferences('Europe/Moscow', 'imperial', 7::smallint, 1::bigint)),
  'imperial',
  'User A updates the units system'
);
select is(
  (select week_starts_on
   from public.update_own_regional_preferences('Europe/Moscow', 'imperial', 7::smallint, 1::bigint)),
  7::smallint,
  'User A updates the first day of the week'
);
select is(
  (select preference_version
   from public.update_own_regional_preferences('Europe/Moscow', 'imperial', 7::smallint, 1::bigint)),
  2::bigint,
  'identical retry returns the current version without another increment'
);
select is(
  (select timezone_name || ':' || units_code || ':' || week_starts_on::text || ':' || version::text
   from public.account_preferences),
  'Europe/Moscow:imperial:7:2',
  'owner reads the persisted regional preferences through RLS'
);
select is(
  (select preference_version
   from public.update_own_regional_preferences('Europe/Moscow', 'imperial', 7::smallint, 1::bigint)),
  2::bigint,
  'repeated identical save is idempotent'
);
select throws_ok(
  $$select public.update_own_regional_preferences('Not/A_Real_Zone', 'metric', 1::smallint, 2::bigint)$$,
  '22023',
  'unsupported_timezone',
  'unknown time zone is rejected'
);
select throws_ok(
  $$select public.update_own_regional_preferences('UTC', 'custom', 1::smallint, 2::bigint)$$,
  '22023',
  'unsupported_units',
  'unknown units system is rejected'
);
select throws_ok(
  $$select public.update_own_regional_preferences('UTC', null::text, 1::smallint, 2::bigint)$$,
  '22023',
  'unsupported_units',
  'null units system is rejected'
);
select throws_ok(
  $$select public.update_own_regional_preferences('UTC', 'metric', null::smallint, 2::bigint)$$,
  '22023',
  'unsupported_week_start',
  'null first day of week is rejected'
);
select throws_ok(
  $$select public.update_own_regional_preferences('UTC', 'metric', 2::smallint, 2::bigint)$$,
  '22023',
  'unsupported_week_start',
  'unsupported first day of week is rejected'
);
select throws_ok(
  $$select public.update_own_regional_preferences('UTC', 'metric', 1::smallint, 1::bigint)$$,
  '40001',
  'preference_conflict',
  'a changed save with a stale version is rejected'
);
select is(
  (select count(*)
   from public.account_preferences
   where account_id = '00000000-0000-0000-0000-000000002112'),
  0::bigint,
  'User A cannot read User B preferences even with a known account ID'
);

reset role;
select is(
  (select timezone_name || ':' || units_code || ':' || week_starts_on::text || ':' || version::text
   from public.account_preferences
   where account_id = '00000000-0000-0000-0000-000000002112'),
  'UTC:metric:1:1',
  'User B preferences remain unchanged'
);

update public.accounts
set state = 'restricted'
where id = '00000000-0000-0000-0000-000000002111';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000002101","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.update_own_regional_preferences('Europe/Moscow', 'imperial', 7::smallint, 2::bigint)$$,
  '40001',
  'account_unavailable',
  'restricted account cannot update regional preferences'
);

select * from finish();
rollback;
