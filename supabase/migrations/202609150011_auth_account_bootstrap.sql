create or replace function public.bootstrap_account(
  p_auth_user_id uuid,
  p_account_id uuid
)
returns table (account_id uuid, account_state text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  resolved_account_state text;
begin
  if p_auth_user_id is null or p_account_id is null then
    raise exception 'bootstrap identifiers are required' using errcode = '22004';
  end if;

  insert into public.accounts (id, auth_user_id)
  values (p_account_id, p_auth_user_id)
  on conflict (auth_user_id) do nothing;

  select accounts.id, accounts.state
  into strict resolved_account_id, resolved_account_state
  from public.accounts
  where accounts.auth_user_id = p_auth_user_id;

  insert into public.account_preferences (account_id)
  values (resolved_account_id)
  on conflict on constraint account_preferences_pkey do nothing;

  return query
  select resolved_account_id, resolved_account_state;
end
$$;

comment on function public.bootstrap_account(uuid, uuid) is
  'Trusted Phase 7 capability. The application supplies a verified Auth user ID and a server-generated account UUID.';

revoke all on function public.bootstrap_account(uuid, uuid) from public;
revoke all on function public.bootstrap_account(uuid, uuid) from anon, authenticated;
grant execute on function public.bootstrap_account(uuid, uuid) to service_role;
