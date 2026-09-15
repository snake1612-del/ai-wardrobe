create table public.idempotency_records (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  operation_scope text not null,
  idempotency_key text not null,
  request_hash bytea not null,
  state text not null default 'in_progress',
  resource_type text,
  resource_id uuid,
  response_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null,
  constraint idempotency_records_request_unique unique (account_id, operation_scope, idempotency_key),
  constraint idempotency_records_scope_nonblank check (btrim(operation_scope) <> ''),
  constraint idempotency_records_key_nonblank check (btrim(idempotency_key) <> ''),
  constraint idempotency_records_state_allowed check (state in ('in_progress', 'succeeded', 'failed_retryable', 'failed_final')),
  constraint idempotency_records_expiry check (expires_at > created_at),
  constraint idempotency_records_terminal_consistency check (
    (state = 'in_progress' and completed_at is null) or
    (state <> 'in_progress' and completed_at is not null)
  ),
  constraint idempotency_records_response_object check (jsonb_typeof(response_summary) = 'object')
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  actor_auth_user_id uuid,
  event_type text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint audit_events_type_allowed check (
    event_type in (
      'item.archived', 'item.restored', 'item.deleted',
      'variant.archived', 'variant.restored', 'variant.deleted',
      'outfit.archived', 'outfit.restored', 'outfit.deleted',
      'wear.voided', 'wear.restored',
      'import.confirmed', 'import.completed',
      'export.requested', 'export.downloaded',
      'account_deletion.requested', 'account_deletion.completed',
      'auth.suspicious', 'privileged.action'
    )
  ),
  constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.export_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  state text not null default 'queued',
  scope_manifest jsonb not null,
  package_version text not null,
  storage_bucket text,
  storage_object_key text,
  byte_size bigint,
  expires_at timestamptz,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint export_requests_account_id_unique unique (account_id, id),
  constraint export_requests_state_allowed check (state in ('queued', 'running', 'ready', 'failed', 'expired', 'cancelled')),
  constraint export_requests_scope_object check (jsonb_typeof(scope_manifest) = 'object'),
  constraint export_requests_package_nonblank check (btrim(package_version) <> ''),
  constraint export_requests_private_bucket check (storage_bucket is null or storage_bucket = 'wardrobe-exports'),
  constraint export_requests_pointer_pair check ((storage_bucket is null) = (storage_object_key is null)),
  constraint export_requests_byte_size check (byte_size is null or byte_size >= 0),
  constraint export_requests_ready_fields check (
    state <> 'ready' or
    (storage_bucket is not null and storage_object_key is not null and byte_size is not null and expires_at is not null)
  )
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique,
  state text not null default 'requested',
  requested_by_auth_user_id uuid not null,
  checkpoint jsonb not null default '{}'::jsonb,
  failure_code text,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_deletion_requests_account_id_unique unique (account_id, id),
  constraint account_deletion_requests_account_fk foreign key (account_id)
    references public.accounts(id) on delete restrict,
  constraint account_deletion_requests_requester_fk foreign key (account_id, requested_by_auth_user_id)
    references public.accounts(id, auth_user_id) on delete restrict,
  constraint account_deletion_requests_state_allowed check (
    state in ('requested', 'restricted', 'deleting', 'verifying', 'failed', 'cancelled')
  ),
  constraint account_deletion_requests_checkpoint_object check (jsonb_typeof(checkpoint) = 'object')
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  job_type text not null,
  state text not null default 'queued',
  deduplication_key text not null,
  media_asset_id uuid,
  import_session_id uuid,
  export_request_id uuid,
  account_deletion_request_id uuid,
  payload jsonb not null default '{}'::jsonb,
  checkpoint jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  available_at timestamptz not null default now(),
  lease_owner text,
  lease_expires_at timestamptz,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_deduplication_unique unique (account_id, job_type, deduplication_key),
  constraint jobs_media_asset_fk foreign key (account_id, media_asset_id)
    references public.media_assets(account_id, id) on delete restrict,
  constraint jobs_import_session_fk foreign key (account_id, import_session_id)
    references public.import_sessions(account_id, id) on delete restrict,
  constraint jobs_export_request_fk foreign key (account_id, export_request_id)
    references public.export_requests(account_id, id) on delete restrict,
  constraint jobs_account_deletion_request_fk foreign key (account_id, account_deletion_request_id)
    references public.account_deletion_requests(account_id, id) on delete restrict,
  constraint jobs_type_allowed check (
    job_type in (
      'media.validate', 'media.process', 'media.cleanup',
      'import.parse', 'import.commit', 'import.cleanup',
      'export.build', 'export.cleanup', 'account.delete'
    )
  ),
  constraint jobs_state_allowed check (state in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  constraint jobs_deduplication_nonblank check (btrim(deduplication_key) <> ''),
  constraint jobs_one_subject check (
    num_nonnulls(media_asset_id, import_session_id, export_request_id, account_deletion_request_id) = 1
  ),
  constraint jobs_attempts check (attempt_count >= 0 and max_attempts > 0 and attempt_count <= max_attempts),
  constraint jobs_lease_pair check ((lease_owner is null) = (lease_expires_at is null)),
  constraint jobs_running_has_lease check (state <> 'running' or lease_owner is not null),
  constraint jobs_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint jobs_checkpoint_object check (jsonb_typeof(checkpoint) = 'object')
);
