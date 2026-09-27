alter table public.accounts
  add column display_name text;

alter table public.accounts
  add constraint accounts_display_name_valid check (
    display_name is null
    or (
      display_name = btrim(display_name)
      and char_length(display_name) between 1 and 80
    )
  );

create or replace function public.update_own_account_profile(
  p_display_name text,
  p_expected_version bigint
)
returns table (
  account_id uuid,
  account_version bigint,
  display_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_user_id uuid := (select auth.uid());
  resolved_name text := nullif(btrim(p_display_name), '');
begin
  if resolved_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_expected_version is null or p_expected_version < 1 then
    raise exception 'invalid account version' using errcode = '22023';
  end if;
  if resolved_name is null or char_length(resolved_name) > 80 then
    raise exception 'invalid display name' using errcode = '22023';
  end if;

  update public.accounts account
  set display_name = resolved_name,
      version = account.version + 1,
      updated_at = now()
  where account.auth_user_id = resolved_user_id
    and account.state = 'active'
    and account.version = p_expected_version
  returning account.id, account.version, account.display_name
  into account_id, account_version, display_name;

  if account_id is null then
    raise exception 'account profile conflict' using errcode = '40001';
  end if;
  return next;
end
$$;

revoke all on function public.update_own_account_profile(text, bigint)
  from public, anon;
grant execute on function public.update_own_account_profile(text, bigint)
  to authenticated;

comment on function public.update_own_account_profile(text, bigint) is
  'Updates only the active account derived from auth.uid(); no account identifier is accepted.';
