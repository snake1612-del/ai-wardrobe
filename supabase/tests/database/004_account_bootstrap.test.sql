begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select has_function(
  'public',
  'bootstrap_account',
  array['uuid', 'uuid'],
  'trusted account bootstrap capability exists'
);
select ok(
  has_function_privilege('service_role', 'public.bootstrap_account(uuid, uuid)', 'EXECUTE'),
  'service role can execute the trusted capability'
);
select ok(
  not has_function_privilege('authenticated', 'public.bootstrap_account(uuid, uuid)', 'EXECUTE'),
  'authenticated browser role cannot execute account bootstrap directly'
);
select ok(
  not has_function_privilege('anon', 'public.bootstrap_account(uuid, uuid)', 'EXECUTE'),
  'anonymous role cannot execute account bootstrap'
);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000131', 'bootstrap-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000132', 'bootstrap-b@example.invalid');

select is(
  (
    select account_id
    from public.bootstrap_account(
      '00000000-0000-0000-0000-000000000131',
      '00000000-0000-0000-0000-000000000231'
    )
  ),
  '00000000-0000-0000-0000-000000000231'::uuid,
  'first bootstrap uses the server-selected account ID'
);
select is(
  (
    select account_id
    from public.bootstrap_account(
      '00000000-0000-0000-0000-000000000131',
      '00000000-0000-0000-0000-000000000239'
    )
  ),
  '00000000-0000-0000-0000-000000000231'::uuid,
  'retry reconciles the unique Auth binding instead of replacing ownership'
);
select is(
  (
    select count(*)::integer
    from public.accounts
    where auth_user_id = '00000000-0000-0000-0000-000000000131'
  ),
  1,
  'repeated bootstrap creates one account'
);
select is(
  (
    select count(*)::integer
    from public.account_preferences
    where account_id = '00000000-0000-0000-0000-000000000231'
  ),
  1,
  'repeated bootstrap creates one preferences row'
);
select is(
  (
    select account_id
    from public.bootstrap_account(
      '00000000-0000-0000-0000-000000000132',
      '00000000-0000-0000-0000-000000000232'
    )
  ),
  '00000000-0000-0000-0000-000000000232'::uuid,
  'a second Auth identity receives an independent account'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000131","role":"authenticated"}',
  true
);
select throws_ok(
  $$select * from public.bootstrap_account('00000000-0000-0000-0000-000000000131', gen_random_uuid())$$,
  '42501',
  null,
  'an authenticated user cannot bypass the trusted server command'
);

select * from finish();
rollback;
