begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select has_column('public', 'accounts', 'display_name', 'account display name exists');
select has_function(
  'public',
  'update_own_account_profile',
  array['text', 'bigint'],
  'owner-scoped profile command exists'
);
select ok(
  (select prosecdef from pg_proc
   where oid = 'public.update_own_account_profile(text,bigint)'::regprocedure),
  'profile command is SECURITY DEFINER'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc
   where oid = 'public.update_own_account_profile(text,bigint)'::regprocedure),
  'profile command uses empty search_path'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.update_own_account_profile(text,bigint)',
    'EXECUTE'
  ),
  'authenticated owner may call profile command'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.update_own_account_profile(text,bigint)',
    'EXECUTE'
  ),
  'anonymous cannot call profile command'
);
select ok(
  not has_table_privilege('authenticated', 'public.accounts', 'UPDATE'),
  'browser role still has no direct account update grant'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000001901', 'profile-a@example.invalid'),
  ('00000000-0000-0000-0000-000000001902', 'profile-b@example.invalid');
insert into public.accounts (id, auth_user_id, display_name) values
  (
    '00000000-0000-0000-0000-000000001911',
    '00000000-0000-0000-0000-000000001901',
    'Owner A'
  ),
  (
    '00000000-0000-0000-0000-000000001912',
    '00000000-0000-0000-0000-000000001902',
    'Owner B'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000001901","role":"authenticated"}',
  true
);

select is(
  (select account_id from public.update_own_account_profile('  Updated A  ', 1)),
  '00000000-0000-0000-0000-000000001911'::uuid,
  'command resolves the account from auth.uid()'
);
select is(
  (select display_name from public.accounts),
  'Updated A',
  'owner reads the persisted normalized name'
);
select is(
  (select version from public.accounts),
  2::bigint,
  'profile update increments optimistic version'
);
select is(
  (select count(*)::integer
   from public.accounts
   where id = '00000000-0000-0000-0000-000000001912'),
  0,
  'User A cannot read User B by known account ID'
);
select throws_ok(
  $$select public.update_own_account_profile('Stale update', 1)$$,
  '40001',
  null,
  'stale profile update is rejected'
);

reset role;
select is(
  (select display_name from public.accounts
   where id = '00000000-0000-0000-0000-000000001912'),
  'Owner B',
  'owner-scoped command did not modify User B'
);

update public.accounts
set state = 'restricted'
where id = '00000000-0000-0000-0000-000000001911';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000001901","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.update_own_account_profile('Restricted update', 2)$$,
  '40001',
  null,
  'restricted account cannot update profile'
);

select * from finish();
rollback;
