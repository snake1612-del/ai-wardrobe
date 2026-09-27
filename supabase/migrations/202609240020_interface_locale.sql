create or replace function public.set_own_locale(p_locale_code text)
returns table (
  locale_code text,
  preference_version bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  normalized_locale text := lower(nullif(btrim(p_locale_code), ''));
begin
  if normalized_locale not in ('ru', 'en') then
    raise exception using errcode = '22023', message = 'unsupported_locale';
  end if;

  select account.id
  into resolved_account_id
  from public.accounts as account
  where account.auth_user_id = (select auth.uid())
    and account.state = 'active';

  if resolved_account_id is null then
    raise exception using errcode = '40001', message = 'account_unavailable';
  end if;

  return query
  update public.account_preferences as preference
  set locale_code = normalized_locale,
      updated_at = case
        when preference.locale_code is distinct from normalized_locale then now()
        else preference.updated_at
      end,
      version = case
        when preference.locale_code is distinct from normalized_locale then preference.version + 1
        else preference.version
      end
  where preference.account_id = resolved_account_id
  returning preference.locale_code, preference.version;

  if not found then
    raise exception using errcode = '40001', message = 'preferences_unavailable';
  end if;
end;
$$;

revoke all on function public.set_own_locale(text) from public, anon;
grant execute on function public.set_own_locale(text) to authenticated;
