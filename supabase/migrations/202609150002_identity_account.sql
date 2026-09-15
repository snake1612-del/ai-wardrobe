create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  state text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint accounts_auth_user_unique unique (auth_user_id),
  constraint accounts_id_auth_user_unique unique (id, auth_user_id),
  constraint accounts_state_allowed check (state in ('active', 'restricted', 'deleting')),
  constraint accounts_version_positive check (version > 0)
);

create table public.account_preferences (
  account_id uuid primary key references public.accounts(id) on delete restrict,
  locale_code text,
  timezone_name text,
  week_starts_on smallint not null default 1,
  units_code text,
  onboarding_state text not null default 'not_started',
  preference_schema_version smallint not null default 1,
  extra_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint account_preferences_weekday check (week_starts_on between 1 and 7),
  constraint account_preferences_onboarding check (
    onboarding_state in ('not_started', 'in_progress', 'completed', 'skipped')
  ),
  constraint account_preferences_schema_version check (preference_schema_version > 0),
  constraint account_preferences_version check (version > 0),
  constraint account_preferences_extra_object check (jsonb_typeof(extra_preferences) = 'object')
);
