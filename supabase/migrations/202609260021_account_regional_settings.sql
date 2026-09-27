alter table public.account_preferences
  add constraint account_preferences_units_allowed
  check (units_code is null or units_code in ('metric', 'imperial'))
  not valid;

alter table public.account_preferences
  add constraint account_preferences_week_start_allowed
  check (week_starts_on in (1, 7))
  not valid;

alter table public.account_preferences
  add constraint account_preferences_timezone_shape
  check (
    timezone_name is null
    or (
      timezone_name = btrim(timezone_name)
      and char_length(timezone_name) between 1 and 100
    )
  )
  not valid;

create or replace function public.update_own_regional_preferences(
  p_timezone_name text,
  p_units_code text,
  p_week_starts_on smallint,
  p_expected_version bigint
)
returns table (
  timezone_name text,
  units_code text,
  week_starts_on smallint,
  preference_version bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  normalized_timezone text := nullif(btrim(p_timezone_name), '');
  normalized_units text := lower(nullif(btrim(p_units_code), ''));
  current_preference public.account_preferences%rowtype;
begin
  if normalized_timezone is null
     or char_length(normalized_timezone) > 100
     or not exists (
       select 1
       from pg_catalog.pg_timezone_names as zone
       where zone.name = normalized_timezone
     ) then
    raise exception using errcode = '22023', message = 'unsupported_timezone';
  end if;

  if normalized_units is null or normalized_units not in ('metric', 'imperial') then
    raise exception using errcode = '22023', message = 'unsupported_units';
  end if;

  if p_week_starts_on is null or p_week_starts_on not in (1, 7) then
    raise exception using errcode = '22023', message = 'unsupported_week_start';
  end if;

  select preference.*
  into current_preference
  from public.accounts as account
  join public.account_preferences as preference
    on preference.account_id = account.id
  where account.auth_user_id = (select auth.uid())
    and account.state = 'active'
  for update of preference;

  resolved_account_id := current_preference.account_id;
  if resolved_account_id is null then
    raise exception using errcode = '40001', message = 'account_unavailable';
  end if;

  if current_preference.timezone_name is not distinct from normalized_timezone
     and current_preference.units_code is not distinct from normalized_units
     and current_preference.week_starts_on = p_week_starts_on then
    return query
    select
      current_preference.timezone_name,
      current_preference.units_code,
      current_preference.week_starts_on,
      current_preference.version;
    return;
  end if;

  if p_expected_version is null
     or p_expected_version < 1
     or current_preference.version <> p_expected_version then
    raise exception using errcode = '40001', message = 'preference_conflict';
  end if;

  return query
  update public.account_preferences as preference
  set timezone_name = normalized_timezone,
      units_code = normalized_units,
      week_starts_on = p_week_starts_on,
      updated_at = now(),
      version = preference.version + 1
  where preference.account_id = resolved_account_id
  returning
    preference.timezone_name,
    preference.units_code,
    preference.week_starts_on,
    preference.version;
end;
$$;

revoke all on function public.update_own_regional_preferences(text, text, smallint, bigint)
  from public, anon;
grant execute on function public.update_own_regional_preferences(text, text, smallint, bigint)
  to authenticated;
