begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select has_function('public', 'set_own_locale', array['text'], 'owner locale command exists');
select ok(
  (select prosecdef from pg_proc where oid = 'public.set_own_locale(text)'::regprocedure),
  'locale command is SECURITY DEFINER'
);
select ok(
  (select 'search_path=""' = any(proconfig)
   from pg_proc where oid = 'public.set_own_locale(text)'::regprocedure),
  'locale command uses empty search_path'
);
select ok(
  has_function_privilege('authenticated', 'public.set_own_locale(text)', 'EXECUTE'),
  'authenticated owner may set locale'
);
select ok(
  not has_function_privilege('anon', 'public.set_own_locale(text)', 'EXECUTE'),
  'anonymous cannot set a persisted account locale'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000002001', 'locale-a@example.invalid'),
  ('00000000-0000-0000-0000-000000002002', 'locale-b@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000002011', '00000000-0000-0000-0000-000000002001'),
  ('00000000-0000-0000-0000-000000002012', '00000000-0000-0000-0000-000000002002');
insert into public.account_preferences (account_id, locale_code) values
  ('00000000-0000-0000-0000-000000002011', 'ru'),
  ('00000000-0000-0000-0000-000000002012', 'ru');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000002001","role":"authenticated"}',
  true
);

select is(
  (select locale_code from public.set_own_locale('en')),
  'en',
  'User A persists the selected locale'
);
select is(
  (select locale_code from public.account_preferences),
  'en',
  'User A reads the persisted locale through RLS'
);
select is(
  (select preference_version from public.set_own_locale('en')),
  2::bigint,
  'idempotent selection does not increment the version twice'
);
select throws_ok(
  $$select public.set_own_locale('de')$$,
  '22023',
  'unsupported_locale',
  'unsupported locale is rejected'
);

reset role;
select is(
  (select locale_code from public.account_preferences
   where account_id = '00000000-0000-0000-0000-000000002012'),
  'ru',
  'User A did not modify User B locale'
);

update public.accounts
set state = 'restricted'
where id = '00000000-0000-0000-0000-000000002011';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000002001","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.set_own_locale('ru')$$,
  '40001',
  'account_unavailable',
  'restricted account cannot update locale'
);

select * from finish();
rollback;
