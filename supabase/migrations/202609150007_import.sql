create table public.import_sources (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  source_kind text not null,
  source_namespace text not null,
  display_name text not null,
  adapter_version text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  constraint import_sources_account_id_unique unique (account_id, id),
  constraint import_sources_namespace_unique unique (account_id, source_kind, source_namespace),
  constraint import_sources_kind_nonblank check (btrim(source_kind) <> ''),
  constraint import_sources_namespace_nonblank check (btrim(source_namespace) <> ''),
  constraint import_sources_name_nonblank check (btrim(display_name) <> ''),
  constraint import_sources_adapter_nonblank check (btrim(adapter_version) <> '')
);

create table public.import_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  import_source_id uuid not null,
  state text not null default 'uploaded',
  source_schema_version text,
  preview_revision bigint not null default 1,
  confirmed_revision bigint,
  confirmed_manifest_hash bytea,
  confirmed_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint import_sessions_account_id_unique unique (account_id, id),
  constraint import_sessions_source_fk foreign key (account_id, import_source_id)
    references public.import_sources(account_id, id) on delete restrict,
  constraint import_sessions_state_allowed check (
    state in ('uploaded', 'parsing', 'review', 'ready', 'committing', 'completed', 'partial', 'failed', 'cancelled')
  ),
  constraint import_sessions_revision_positive check (preview_revision > 0 and version > 0),
  constraint import_sessions_confirmation_triplet check (
    (confirmed_revision is null and confirmed_manifest_hash is null and confirmed_at is null) or
    (confirmed_revision is not null and confirmed_revision > 0 and confirmed_manifest_hash is not null and confirmed_at is not null)
  ),
  constraint import_sessions_confirmed_when_committing check (
    state not in ('committing', 'completed', 'partial') or confirmed_revision is not null
  ),
  constraint import_sessions_summary_object check (jsonb_typeof(summary) = 'object')
);

create table public.external_item_identities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  import_source_id uuid not null,
  external_identifier text not null,
  clothing_item_id uuid not null,
  first_seen_session_id uuid,
  last_seen_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_item_identities_account_id_unique unique (account_id, id),
  constraint external_item_identities_scoped_identifier unique (account_id, import_source_id, external_identifier),
  constraint external_item_identities_source_fk foreign key (account_id, import_source_id)
    references public.import_sources(account_id, id) on delete restrict,
  constraint external_item_identities_item_fk foreign key (account_id, clothing_item_id)
    references public.clothing_items(account_id, id) on delete restrict,
  constraint external_item_identities_first_session_fk foreign key (account_id, first_seen_session_id)
    references public.import_sessions(account_id, id) on delete restrict,
  constraint external_item_identities_last_session_fk foreign key (account_id, last_seen_session_id)
    references public.import_sessions(account_id, id) on delete restrict,
  constraint external_item_identities_identifier_nonblank check (btrim(external_identifier) <> '')
);

create table public.import_records (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  import_session_id uuid not null,
  record_ordinal integer not null,
  source_record_key text not null,
  external_identifier text,
  raw_payload jsonb not null,
  normalized_payload jsonb,
  validation_state text not null default 'pending',
  issues jsonb not null default '[]'::jsonb,
  candidate_item_id uuid,
  proposed_action text,
  proposed_diff jsonb not null default '{}'::jsonb,
  user_decision text not null default 'pending',
  decision_payload jsonb not null default '{}'::jsonb,
  commit_key uuid not null default gen_random_uuid(),
  commit_outcome text not null default 'pending',
  committed_item_id uuid,
  outcome_detail jsonb not null default '{}'::jsonb,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_records_account_id_unique unique (account_id, id),
  constraint import_records_ordinal_unique unique (import_session_id, record_ordinal),
  constraint import_records_source_key_unique unique (import_session_id, source_record_key),
  constraint import_records_commit_key_unique unique (account_id, commit_key),
  constraint import_records_session_fk foreign key (account_id, import_session_id)
    references public.import_sessions(account_id, id) on delete cascade,
  constraint import_records_candidate_item_fk foreign key (account_id, candidate_item_id)
    references public.clothing_items(account_id, id) on delete restrict,
  constraint import_records_committed_item_fk foreign key (account_id, committed_item_id)
    references public.clothing_items(account_id, id) on delete restrict,
  constraint import_records_ordinal_nonnegative check (record_ordinal >= 0),
  constraint import_records_source_key_nonblank check (btrim(source_record_key) <> ''),
  constraint import_records_validation_allowed check (validation_state in ('pending', 'valid', 'warning', 'error')),
  constraint import_records_issues_array check (jsonb_typeof(issues) = 'array'),
  constraint import_records_action_allowed check (proposed_action is null or proposed_action in ('create', 'update', 'link', 'skip')),
  constraint import_records_decision_allowed check (user_decision in ('pending', 'approve', 'skip', 'needs_review')),
  constraint import_records_outcome_allowed check (commit_outcome in ('pending', 'created', 'updated', 'linked', 'skipped', 'failed')),
  constraint import_records_json_objects check (
    jsonb_typeof(proposed_diff) = 'object' and
    jsonb_typeof(decision_payload) = 'object' and
    jsonb_typeof(outcome_detail) = 'object'
  ),
  constraint import_records_terminal_consistency check (
    (commit_outcome = 'pending' and committed_at is null) or
    (commit_outcome <> 'pending' and committed_at is not null)
  ),
  constraint import_records_item_outcome_consistency check (
    commit_outcome not in ('created', 'updated', 'linked') or committed_item_id is not null
  )
);

alter table public.item_metadata_evidence
  add constraint item_metadata_evidence_import_record_fk
  foreign key (account_id, import_record_id)
  references public.import_records(account_id, id) on delete restrict;

create table public.import_asset_links (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  import_session_id uuid not null,
  import_record_id uuid,
  media_asset_id uuid not null,
  source_reference text not null,
  proposed_role text,
  proposed_view text,
  created_at timestamptz not null default now(),
  constraint import_asset_links_source_unique unique (import_session_id, source_reference),
  constraint import_asset_links_asset_unique unique (import_session_id, media_asset_id),
  constraint import_asset_links_session_fk foreign key (account_id, import_session_id)
    references public.import_sessions(account_id, id) on delete cascade,
  constraint import_asset_links_record_fk foreign key (account_id, import_record_id)
    references public.import_records(account_id, id) on delete cascade,
  constraint import_asset_links_asset_fk foreign key (account_id, media_asset_id)
    references public.media_assets(account_id, id) on delete restrict,
  constraint import_asset_links_source_nonblank check (btrim(source_reference) <> ''),
  constraint import_asset_links_role_allowed check (
    proposed_role is null or proposed_role in ('evidence_source', 'catalog', 'reference')
  ),
  constraint import_asset_links_view_allowed check (
    proposed_view is null or proposed_view in ('front', 'back', 'side', 'detail', 'unspecified')
  )
);
