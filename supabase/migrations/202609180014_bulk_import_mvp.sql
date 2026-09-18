alter table public.import_sessions
  drop constraint import_sessions_state_allowed;

alter table public.import_sessions
  add column preview_manifest_hash bytea,
  add column expires_at timestamptz not null default (now() + interval '7 days'),
  add column cleanup_after timestamptz,
  add constraint import_sessions_state_allowed check (
    state in (
      'awaiting_upload', 'uploaded', 'parsing', 'review', 'ready',
      'committing', 'completed', 'partial', 'failed', 'cancelled', 'cleaning'
    )
  ),
  add constraint import_sessions_expiry_after_creation check (expires_at > created_at);

alter table public.import_asset_links
  add column disposition text not null default 'pending',
  add column proposed_variant_key text,
  add column proposed_primary boolean not null default false,
  add constraint import_asset_links_disposition_allowed
    check (disposition in ('pending', 'assigned', 'skipped')),
  add constraint import_asset_links_assignment_consistency check (
    (disposition = 'assigned' and import_record_id is not null) or
    (disposition <> 'assigned' and import_record_id is null)
  );

alter table public.import_asset_links
  drop constraint import_asset_links_asset_fk,
  add constraint import_asset_links_asset_fk foreign key (account_id, media_asset_id)
    references public.media_assets(account_id, id) on delete cascade;

create table public.import_archive_parts (
  id uuid primary key,
  account_id uuid not null,
  import_session_id uuid not null,
  part_ordinal integer not null,
  storage_bucket text not null default 'wardrobe-imports',
  storage_object_key text not null,
  declared_byte_size bigint not null,
  observed_byte_size bigint,
  content_hash bytea,
  state text not null default 'awaiting_upload',
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_archive_parts_account_id_unique unique (account_id, id),
  constraint import_archive_parts_session_ordinal_unique unique (import_session_id, part_ordinal),
  constraint import_archive_parts_storage_key_unique unique (storage_bucket, storage_object_key),
  constraint import_archive_parts_session_fk foreign key (account_id, import_session_id)
    references public.import_sessions(account_id, id) on delete cascade,
  constraint import_archive_parts_ordinal_bounded check (part_ordinal between 0 and 3),
  constraint import_archive_parts_bucket check (storage_bucket = 'wardrobe-imports'),
  constraint import_archive_parts_key_nonblank check (btrim(storage_object_key) <> ''),
  constraint import_archive_parts_declared_size check (
    declared_byte_size > 0 and declared_byte_size <= 1073741824
  ),
  constraint import_archive_parts_observed_size check (
    observed_byte_size is null or
    (observed_byte_size > 0 and observed_byte_size <= 1073741824)
  ),
  constraint import_archive_parts_state_allowed check (
    state in ('awaiting_upload', 'uploaded', 'prepared', 'failed', 'pending_delete', 'deleted')
  )
);

alter table public.import_archive_parts enable row level security;
alter table public.import_archive_parts force row level security;

create policy import_archive_parts_owner_read on public.import_archive_parts
  for select to authenticated
  using (account_id = (select private.current_account_id()));

revoke all on public.import_archive_parts from public, anon, authenticated;
grant select on public.import_archive_parts to authenticated;

create index import_archive_parts_session_state
  on public.import_archive_parts (account_id, import_session_id, state, part_ordinal);

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'wardrobe-imports', 'wardrobe-imports', false, 1073741824,
  array['application/zip', 'application/x-zip-compressed']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy wardrobe_imports_authenticated_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wardrobe-imports'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1
    from public.import_archive_parts part
    where part.account_id = (select private.current_account_id())
      and part.state = 'awaiting_upload'
      and part.storage_bucket = bucket_id
      and part.storage_object_key = name
      and name = 'accounts/' || part.account_id::text ||
        '/imports/' || part.import_session_id::text ||
        '/parts/' || part.id::text || '/source/v1'
  )
);

create or replace function public.create_import_session_intent(
  p_account_id uuid,
  p_session_id uuid,
  p_parts jsonb,
  p_idempotency_key text,
  p_request_hash bytea
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_source_id uuid;
  part jsonb;
  resolved_part_id uuid;
  resolved_size bigint;
  resolved_count integer;
  resolved_total bigint;
  inserted_count integer;
  existing_hash bytea;
  existing_session_id uuid;
  response jsonb;
begin
  if p_account_id is null or p_session_id is null
    or jsonb_typeof(p_parts) <> 'array'
    or nullif(btrim(p_idempotency_key), '') is null
    or p_request_hash is null then
    raise exception 'invalid import intent' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.accounts
    where id = p_account_id and state = 'active'
  ) then
    raise exception 'account unavailable' using errcode = 'P0002';
  end if;

  resolved_count := jsonb_array_length(p_parts);
  if resolved_count < 1 or resolved_count > 4 then
    raise exception 'invalid import part count' using errcode = '22023';
  end if;
  select coalesce(sum((value ->> 'byte_size')::bigint), 0)
  into resolved_total
  from jsonb_array_elements(p_parts);
  if resolved_total <= 0 or resolved_total > 1073741824 then
    raise exception 'import source set too large' using errcode = '22023';
  end if;

  insert into public.idempotency_records (
    account_id, operation_scope, idempotency_key, request_hash, state,
    resource_type, resource_id, expires_at
  ) values (
    p_account_id, 'import.intent', p_idempotency_key, p_request_hash, 'in_progress',
    'import_session', p_session_id, now() + interval '7 days'
  ) on conflict (account_id, operation_scope, idempotency_key) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    select request_hash, resource_id into existing_hash, existing_session_id
    from public.idempotency_records
    where account_id = p_account_id
      and operation_scope = 'import.intent'
      and idempotency_key = p_idempotency_key
    for update;
    if existing_hash <> p_request_hash then
      raise exception 'idempotency key payload mismatch' using errcode = '22023';
    end if;
    select jsonb_build_object(
      'session_id', session.id,
      'state', session.state,
      'version', session.version,
      'parts', coalesce((
        select jsonb_agg(jsonb_build_object(
          'part_id', archive.id,
          'ordinal', archive.part_ordinal,
          'bucket', archive.storage_bucket,
          'object_key', archive.storage_object_key,
          'state', archive.state
        ) order by archive.part_ordinal)
        from public.import_archive_parts archive
        where archive.account_id = p_account_id
          and archive.import_session_id = session.id
      ), '[]'::jsonb)
    ) into response
    from public.import_sessions session
    where session.account_id = p_account_id and session.id = existing_session_id;
    return response;
  end if;

  insert into public.import_sources (
    account_id, source_kind, source_namespace, display_name, adapter_version, last_used_at
  ) values (
    p_account_id, 'wardrobe_image_set', 'legacy-wardrobe-image-set-v1',
    'Legacy wardrobe image set', 'legacy-wardrobe-image-set/v1', now()
  )
  on conflict (account_id, source_kind, source_namespace)
  do update set adapter_version = excluded.adapter_version, last_used_at = now()
  returning id into resolved_source_id;

  insert into public.import_sessions (
    id, account_id, import_source_id, state, source_schema_version,
    summary, expires_at
  ) values (
    p_session_id, p_account_id, resolved_source_id, 'awaiting_upload',
    'aiw.bulk-import/1',
    jsonb_build_object(
      'adapter', 'legacy-wardrobe-image-set/v1',
      'part_count', resolved_count,
      'declared_bytes', resolved_total
    ),
    now() + interval '7 days'
  );

  for part in select value from jsonb_array_elements(p_parts)
  loop
    resolved_part_id := (part ->> 'part_id')::uuid;
    resolved_size := (part ->> 'byte_size')::bigint;
    if resolved_part_id is null or resolved_size <= 0 or resolved_size > 1073741824 then
      raise exception 'invalid import part' using errcode = '22023';
    end if;
    insert into public.import_archive_parts (
      id, account_id, import_session_id, part_ordinal,
      storage_object_key, declared_byte_size
    ) values (
      resolved_part_id, p_account_id, p_session_id, (part ->> 'ordinal')::integer,
      'accounts/' || p_account_id::text || '/imports/' || p_session_id::text ||
        '/parts/' || resolved_part_id::text || '/source/v1',
      resolved_size
    );
  end loop;

  insert into public.jobs (
    account_id, job_type, deduplication_key, import_session_id, payload, available_at
  ) values (
    p_account_id, 'import.cleanup',
    'cleanup:' || p_session_id::text || ':1', p_session_id,
    jsonb_build_object('reason', 'retention_expiry'), now() + interval '7 days'
  );

  update public.idempotency_records
  set state = 'succeeded', completed_at = now(),
      response_summary = jsonb_build_object('session_id', p_session_id)
  where account_id = p_account_id
    and operation_scope = 'import.intent'
    and idempotency_key = p_idempotency_key;

  select jsonb_build_object(
    'session_id', p_session_id,
    'state', 'awaiting_upload',
    'version', 1,
    'parts', jsonb_agg(jsonb_build_object(
      'part_id', archive.id,
      'ordinal', archive.part_ordinal,
      'bucket', archive.storage_bucket,
      'object_key', archive.storage_object_key,
      'state', archive.state
    ) order by archive.part_ordinal)
  ) into response
  from public.import_archive_parts archive
  where archive.account_id = p_account_id
    and archive.import_session_id = p_session_id;
  return response;
end
$$;

create or replace function public.claim_import_job(
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns table (
  job_id uuid,
  account_id uuid,
  import_session_id uuid,
  job_type text,
  payload jsonb,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_id uuid;
  resolved_account_id uuid;
  resolved_session_id uuid;
  resolved_job_type text;
  resolved_session_updated integer;
  resolved_prior_state text;
  resolved_session_expired boolean;
begin
  if nullif(btrim(p_worker_id), '') is null
    or p_lease_seconds < 30 or p_lease_seconds > 900 then
    raise exception 'invalid import worker lease' using errcode = '22023';
  end if;
  select candidate.id into candidate_id
  from public.jobs candidate
  join public.import_sessions session
    on session.account_id = candidate.account_id
    and session.id = candidate.import_session_id
  join public.accounts owner_account
    on owner_account.id = candidate.account_id
  where candidate.job_type in ('import.parse', 'import.commit', 'import.cleanup')
    and candidate.available_at <= now()
    and candidate.attempt_count < candidate.max_attempts
    and (
      candidate.state = 'queued' or
      (candidate.state = 'running' and candidate.lease_expires_at < now())
    )
    and (candidate.job_type = 'import.cleanup' or owner_account.state = 'active')
    and (
      (candidate.job_type = 'import.parse'
        and session.state in ('uploaded', 'failed', 'parsing')
        and session.expires_at > now()) or
      (candidate.job_type = 'import.commit' and session.state in ('committing', 'partial')) or
      (candidate.job_type = 'import.cleanup' and (
        session.state in ('completed', 'partial', 'cancelled', 'cleaning') or
        (session.state in ('awaiting_upload', 'uploaded', 'failed') and session.expires_at <= now())
      ))
    )
  order by candidate.available_at, candidate.created_at, candidate.id
  for update skip locked
  limit 1;
  if candidate_id is null then return; end if;

  update public.jobs
  set state = 'running',
      lease_owner = p_worker_id,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      attempt_count = public.jobs.attempt_count + 1,
      updated_at = now()
  where id = candidate_id
  returning id, public.jobs.account_id, public.jobs.import_session_id,
    public.jobs.job_type, public.jobs.payload, public.jobs.attempt_count
  into job_id, resolved_account_id, resolved_session_id, resolved_job_type, payload, attempt_count;

  select state, expires_at <= now()
  into resolved_prior_state, resolved_session_expired
  from public.import_sessions claimed_session
  where claimed_session.account_id = resolved_account_id
    and claimed_session.id = resolved_session_id;

  update public.import_sessions
  set state = case resolved_job_type
      when 'import.parse' then 'parsing'
      when 'import.commit' then 'committing'
      when 'import.cleanup' then case
        when public.import_sessions.state in ('awaiting_upload', 'uploaded', 'failed')
          and public.import_sessions.expires_at <= now()
          then 'cancelled'
        else public.import_sessions.state
      end
      else public.import_sessions.state
    end,
    updated_at = now()
  where id = resolved_session_id and public.import_sessions.account_id = resolved_account_id
    and (
      (resolved_job_type = 'import.parse' and public.import_sessions.state in ('uploaded', 'failed', 'parsing')) or
      (resolved_job_type = 'import.commit' and public.import_sessions.state in ('committing', 'partial')) or
      (resolved_job_type = 'import.cleanup' and (
        public.import_sessions.state in ('completed', 'partial', 'cancelled', 'cleaning') or
        (public.import_sessions.state in ('awaiting_upload', 'uploaded', 'failed')
          and public.import_sessions.expires_at <= now())
      ))
    );
  get diagnostics resolved_session_updated = row_count;
  if resolved_session_updated <> 1 then
    raise exception 'import session lease unavailable' using errcode = '40001';
  end if;
  if resolved_job_type = 'import.cleanup'
    and resolved_prior_state in ('awaiting_upload', 'uploaded', 'failed')
    and resolved_session_expired then
    update public.jobs as stale_job
    set state = 'cancelled', lease_owner = null, lease_expires_at = null, updated_at = now()
    where stale_job.account_id = resolved_account_id
      and stale_job.import_session_id = resolved_session_id
      and stale_job.id <> candidate_id
      and stale_job.job_type in ('import.parse', 'import.commit')
      and stale_job.state = 'queued';
    update public.import_asset_links as stale_link
    set import_record_id = null, disposition = 'skipped',
        proposed_variant_key = null, proposed_primary = false
    where stale_link.account_id = resolved_account_id
      and stale_link.import_session_id = resolved_session_id
      and not exists (
        select 1 from public.media_bindings binding
        where binding.account_id = resolved_account_id
          and binding.media_asset_id = stale_link.media_asset_id
      );
  end if;
  account_id := resolved_account_id;
  import_session_id := resolved_session_id;
  job_type := resolved_job_type;
  return next;
end
$$;

create or replace function public.stage_import_asset(
  p_worker_id text,
  p_job_id uuid,
  p_asset_id uuid,
  p_source_reference text,
  p_storage_object_key text,
  p_mime_type text,
  p_byte_size bigint,
  p_content_hash bytea,
  p_origin_proposal text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  resolved_session_id uuid;
  resolved_role text;
  resolved_origin text;
  resolved_evidence text;
begin
  select account_id, import_session_id
  into resolved_account_id, resolved_session_id
  from public.jobs
  where id = p_job_id and job_type = 'import.parse' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now()
  for update;
  if not found then
    raise exception 'import parse lease unavailable' using errcode = '40001';
  end if;
  if not exists (
    select 1 from public.accounts
    where id = resolved_account_id and state = 'active'
  ) then
    raise exception 'account unavailable' using errcode = '40001';
  end if;
  if p_mime_type not in ('image/jpeg', 'image/png')
    or p_byte_size <= 0 or p_byte_size > 16777216
    or p_content_hash is null
    or nullif(btrim(p_source_reference), '') is null
    or nullif(btrim(p_storage_object_key), '') is null
    or p_origin_proposal not in ('source_candidate', 'catalog_candidate') then
    raise exception 'invalid staged import asset' using errcode = '22023';
  end if;
  if p_storage_object_key <> 'accounts/' || resolved_account_id::text ||
    '/imports/' || resolved_session_id::text || '/assets/' || p_asset_id::text || '/source/v1' then
    raise exception 'invalid staged object path' using errcode = '22023';
  end if;

  resolved_role := case p_origin_proposal
    when 'source_candidate' then 'evidence_source'
    else 'catalog'
  end;
  resolved_origin := case p_origin_proposal
    when 'source_candidate' then 'imported'
    else 'external_catalog'
  end;
  resolved_evidence := case p_origin_proposal
    when 'source_candidate' then 'real_item_evidence'
    else 'reference_only'
  end;

  insert into public.media_assets (
    id, account_id, origin_code, evidence_status, storage_bucket,
    storage_object_key, declared_mime_type, verified_mime_type, byte_size,
    content_hash, processing_state
  ) values (
    p_asset_id, resolved_account_id, resolved_origin, resolved_evidence,
    'wardrobe-originals', p_storage_object_key, p_mime_type, p_mime_type,
    p_byte_size, p_content_hash, 'uploaded'
  ) on conflict (id) do nothing;
  if not exists (
    select 1 from public.media_assets
    where account_id = resolved_account_id and id = p_asset_id
      and storage_bucket = 'wardrobe-originals'
      and storage_object_key = p_storage_object_key
      and content_hash = p_content_hash
  ) then
    raise exception 'staged import asset replay mismatch' using errcode = '40001';
  end if;
  insert into public.import_asset_links (
    account_id, import_session_id, media_asset_id, source_reference,
    proposed_role, proposed_view, disposition
  ) values (
    resolved_account_id, resolved_session_id, p_asset_id,
    left(p_source_reference, 240), resolved_role, 'unspecified', 'pending'
  ) on conflict (import_session_id, media_asset_id) do nothing;
  insert into public.jobs (
    account_id, job_type, deduplication_key, media_asset_id, payload
  ) values (
    resolved_account_id, 'media.validate',
    'validate:' || p_asset_id::text, p_asset_id, '{}'::jsonb
  ) on conflict (account_id, job_type, deduplication_key) do nothing;
  return p_asset_id;
end
$$;

create or replace function public.finish_import_prepare(
  p_worker_id text,
  p_job_id uuid,
  p_part_hashes jsonb,
  p_summary jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  resolved_session_id uuid;
  part jsonb;
  resolved_version bigint;
begin
  if jsonb_typeof(p_part_hashes) <> 'array' or jsonb_typeof(p_summary) <> 'object' then
    raise exception 'invalid prepare result' using errcode = '22023';
  end if;
  select account_id, import_session_id
  into resolved_account_id, resolved_session_id
  from public.jobs
  where id = p_job_id and job_type = 'import.parse' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now()
  for update;
  if not found then
    raise exception 'import parse lease unavailable' using errcode = '40001';
  end if;
  if not exists (
    select 1 from public.accounts
    where id = resolved_account_id and state = 'active'
  ) then
    raise exception 'account unavailable' using errcode = '40001';
  end if;

  for part in select value from jsonb_array_elements(p_part_hashes)
  loop
    update public.import_archive_parts
    set content_hash = decode(part ->> 'sha256', 'hex'),
        state = 'prepared', updated_at = now()
    where account_id = resolved_account_id
      and import_session_id = resolved_session_id
      and id = (part ->> 'part_id')::uuid
      and state in ('uploaded', 'prepared');
    if not found then
      raise exception 'import part prepare mismatch' using errcode = '40001';
    end if;
  end loop;

  if exists (
    select 1 from public.import_archive_parts
    where account_id = resolved_account_id and import_session_id = resolved_session_id
      and state <> 'prepared'
  ) then
    raise exception 'not all import parts prepared' using errcode = '40001';
  end if;

  update public.import_sessions
  set state = 'review',
      source_schema_version = 'aiw.bulk-import/1',
      summary = p_summary || jsonb_build_object('adapter', 'legacy-wardrobe-image-set/v1'),
      failure_code = null,
      preview_manifest_hash = null,
      preview_revision = preview_revision + 1,
      version = version + 1,
      updated_at = now()
  where account_id = resolved_account_id and id = resolved_session_id
    and state = 'parsing'
  returning version into resolved_version;
  if resolved_version is null then
    raise exception 'import prepare state conflict' using errcode = '40001';
  end if;

  update public.jobs
  set state = 'succeeded', lease_owner = null, lease_expires_at = null,
      updated_at = now(), checkpoint = p_summary
  where id = p_job_id;
  return resolved_version;
end
$$;

create or replace function public.fail_import_job(
  p_worker_id text,
  p_job_id uuid,
  p_failure_code text,
  p_retry_delay_seconds integer default 15
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_session_id uuid;
  resolved_account_id uuid;
  resolved_type text;
  resolved_attempts integer;
  resolved_max integer;
  retryable boolean;
begin
  select import_session_id, account_id, job_type, attempt_count, max_attempts
  into resolved_session_id, resolved_account_id, resolved_type, resolved_attempts, resolved_max
  from public.jobs
  where id = p_job_id and state = 'running' and lease_owner = p_worker_id
  for update;
  if not found then return false; end if;
  retryable := resolved_attempts < resolved_max;
  update public.jobs
  set state = case when retryable then 'queued' else 'failed' end,
      available_at = case when retryable then now() + make_interval(secs => greatest(1, p_retry_delay_seconds)) else available_at end,
      failure_code = left(coalesce(nullif(btrim(p_failure_code), ''), 'import_worker_failed'), 120),
      lease_owner = null, lease_expires_at = null, updated_at = now()
  where id = p_job_id;
  update public.import_sessions
  set state = case
      when resolved_type = 'import.cleanup' then state
      when retryable and resolved_type = 'import.parse' then 'uploaded'
      when retryable and resolved_type = 'import.commit' then 'partial'
      else 'failed'
    end,
    failure_code = left(coalesce(nullif(btrim(p_failure_code), ''), 'import_worker_failed'), 120),
    updated_at = now()
  where account_id = resolved_account_id and id = resolved_session_id;
  return retryable;
end
$$;

create or replace function public.complete_import_archive_part(
  p_account_id uuid,
  p_session_id uuid,
  p_part_id uuid,
  p_observed_byte_size bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_declared bigint;
  resolved_state text;
  resolved_session_state text;
  resolved_job_id uuid;
begin
  if p_observed_byte_size is null or p_observed_byte_size <= 0
    or p_observed_byte_size > 1073741824 then
    raise exception 'invalid observed archive size' using errcode = '22023';
  end if;
  select declared_byte_size, state into resolved_declared, resolved_state
  from public.import_archive_parts
  where account_id = p_account_id and import_session_id = p_session_id and id = p_part_id
  for update;
  if not found then
    raise exception 'import part unavailable' using errcode = 'P0002';
  end if;
  if resolved_state in ('uploaded', 'prepared') then
    return jsonb_build_object('part_id', p_part_id, 'state', resolved_state);
  end if;
  if resolved_state <> 'awaiting_upload' or resolved_declared <> p_observed_byte_size then
    raise exception 'archive completion conflict' using errcode = '40001';
  end if;

  update public.import_archive_parts
  set state = 'uploaded', observed_byte_size = p_observed_byte_size, updated_at = now()
  where account_id = p_account_id and id = p_part_id;

  if not exists (
    select 1 from public.import_archive_parts
    where account_id = p_account_id and import_session_id = p_session_id
      and state = 'awaiting_upload'
  ) then
    update public.import_sessions
    set state = 'uploaded', updated_at = now(), version = version + 1
    where account_id = p_account_id and id = p_session_id
      and state = 'awaiting_upload'
    returning state into resolved_session_state;
    insert into public.jobs (
      account_id, job_type, deduplication_key, import_session_id, payload
    ) values (
      p_account_id, 'import.parse', 'prepare:' || p_session_id::text || ':1',
      p_session_id, jsonb_build_object('adapter', 'legacy-wardrobe-image-set/v1')
    )
    on conflict (account_id, job_type, deduplication_key)
    do update set available_at = least(public.jobs.available_at, now())
    returning id into resolved_job_id;
  end if;

  select state into resolved_session_state
  from public.import_sessions
  where account_id = p_account_id and id = p_session_id;
  return jsonb_build_object(
    'part_id', p_part_id,
    'state', 'uploaded',
    'session_state', resolved_session_state,
    'job_id', resolved_job_id
  );
end
$$;

create or replace function public.replace_import_resolution(
  p_account_id uuid,
  p_session_id uuid,
  p_expected_version bigint,
  p_resolution jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_version bigint;
  record jsonb;
  mapping jsonb;
  variant jsonb;
  resolved_record_id uuid;
  resolved_item_id uuid;
  resolved_category_id uuid;
  resolved_ordinal integer := 0;
  resolved_mapping_count integer;
begin
  if jsonb_typeof(p_resolution) <> 'object'
    or jsonb_typeof(p_resolution -> 'records') <> 'array'
    or jsonb_array_length(p_resolution -> 'records') > 500 then
    raise exception 'invalid import resolution' using errcode = '22023';
  end if;

  select version into resolved_version
  from public.import_sessions
  where account_id = p_account_id and id = p_session_id
    and state in ('review', 'ready') and version = p_expected_version
  for update;
  if not found then
    raise exception 'import resolution conflict' using errcode = '40001';
  end if;

  update public.import_asset_links
  set import_record_id = null, disposition = 'pending',
      proposed_variant_key = null, proposed_primary = false
  where account_id = p_account_id and import_session_id = p_session_id;
  delete from public.import_records
  where account_id = p_account_id and import_session_id = p_session_id;

  for record in select value from jsonb_array_elements(p_resolution -> 'records')
  loop
    if jsonb_typeof(record) <> 'object'
      or (record ->> 'action') not in ('create', 'update', 'link', 'skip')
      or nullif(btrim(record ->> 'source_record_key'), '') is null
      or jsonb_typeof(coalesce(record -> 'asset_mappings', '[]'::jsonb)) <> 'array'
      or jsonb_typeof(coalesce(record -> 'variants', '[]'::jsonb)) <> 'array' then
      raise exception 'invalid import record resolution' using errcode = '22023';
    end if;
    resolved_record_id := coalesce(nullif(record ->> 'record_id', '')::uuid, gen_random_uuid());
    resolved_item_id := nullif(record ->> 'target_item_id', '')::uuid;
    resolved_category_id := null;

    if (record ->> 'action') in ('update', 'link') then
      if resolved_item_id is null or not exists (
        select 1 from public.clothing_items
        where account_id = p_account_id and id = resolved_item_id
          and lifecycle_state = 'active'
      ) then
        raise exception 'owner-scoped update target unavailable' using errcode = 'P0002';
      end if;
    elsif resolved_item_id is not null then
      raise exception 'unexpected import target' using errcode = '22023';
    end if;

    if nullif(btrim(record ->> 'category_code'), '') is not null then
      select id into resolved_category_id from public.categories
      where code = record ->> 'category_code' and is_active;
      if resolved_category_id is null then
        raise exception 'unknown import category' using errcode = '22023';
      end if;
    end if;

    if (record ->> 'action') in ('create', 'update')
      and nullif(btrim(record ->> 'display_name'), '') is null then
      raise exception 'resolved item name required' using errcode = '22023';
    end if;
    if (record ->> 'action') = 'update'
      and coalesce((record ->> 'expected_item_version')::bigint, 0) <= 0 then
      raise exception 'expected item version required' using errcode = '22023';
    end if;
    if ((record ->> 'action') = 'skip'
        and jsonb_array_length(coalesce(record -> 'asset_mappings', '[]'::jsonb)) > 0)
      or ((record ->> 'action') <> 'skip'
        and jsonb_array_length(coalesce(record -> 'asset_mappings', '[]'::jsonb)) = 0) then
      raise exception 'invalid import record asset mapping count' using errcode = '22023';
    end if;
    if (
      select count(*) <> count(distinct value ->> 'key')
        or count(*) <> count(distinct lower(btrim(value ->> 'label')))
        or count(*) filter (where coalesce((value ->> 'is_default')::boolean, false)) > 1
      from jsonb_array_elements(coalesce(record -> 'variants', '[]'::jsonb))
    ) then
      raise exception 'duplicate appearance variant resolution' using errcode = '22023';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(coalesce(record -> 'asset_mappings', '[]'::jsonb))
        as primary_mapping(value)
      where coalesce((primary_mapping.value ->> 'is_primary')::boolean, false)
      group by coalesce(
        nullif(btrim(primary_mapping.value ->> 'variant_key'), ''),
        '__item__'
      )
      having count(*) > 1
    ) then
      raise exception 'duplicate primary import mapping' using errcode = '22023';
    end if;

    for variant in
      select value from jsonb_array_elements(coalesce(record -> 'variants', '[]'::jsonb))
    loop
      if nullif(btrim(variant ->> 'key'), '') is null
        or nullif(btrim(variant ->> 'label'), '') is null then
        raise exception 'invalid appearance variant resolution' using errcode = '22023';
      end if;
    end loop;

    insert into public.import_records (
      id, account_id, import_session_id, record_ordinal, source_record_key,
      raw_payload, normalized_payload, validation_state, issues,
      candidate_item_id, proposed_action, user_decision, decision_payload
    ) values (
      resolved_record_id, p_account_id, p_session_id, resolved_ordinal,
      left(record ->> 'source_record_key', 240),
      jsonb_build_object('adapter', 'legacy-wardrobe-image-set/v1'),
      jsonb_build_object(
        'display_name', nullif(btrim(record ->> 'display_name'), ''),
        'category_code', nullif(btrim(record ->> 'category_code'), ''),
        'physical_set', coalesce((record ->> 'physical_set')::boolean, false),
        'variants', coalesce(record -> 'variants', '[]'::jsonb)
      ),
      case when (record ->> 'action') = 'skip' then 'warning' else 'valid' end,
      case when (record ->> 'action') = 'skip'
        then jsonb_build_array(jsonb_build_object('code', 'record_skipped', 'severity', 'info'))
        else '[]'::jsonb
      end,
      resolved_item_id, record ->> 'action',
      case when (record ->> 'action') = 'skip' then 'skip' else 'approve' end,
      jsonb_build_object(
        'expected_item_version', nullif(record ->> 'expected_item_version', '')::bigint,
        'asset_mappings', coalesce(record -> 'asset_mappings', '[]'::jsonb)
      )
    );

    for mapping in
      select value from jsonb_array_elements(coalesce(record -> 'asset_mappings', '[]'::jsonb))
    loop
      if (mapping ->> 'role') not in ('evidence_source', 'catalog', 'reference')
        or (mapping ->> 'view') not in ('front', 'back', 'side', 'detail', 'unspecified')
        or (coalesce((mapping ->> 'is_primary')::boolean, false)
          and (mapping ->> 'role') <> 'catalog') then
        raise exception 'invalid import asset mapping' using errcode = '22023';
      end if;
      update public.import_asset_links
      set import_record_id = resolved_record_id,
          disposition = 'assigned',
          proposed_role = mapping ->> 'role',
          proposed_view = mapping ->> 'view',
          proposed_variant_key = nullif(btrim(mapping ->> 'variant_key'), ''),
          proposed_primary = coalesce((mapping ->> 'is_primary')::boolean, false)
      where account_id = p_account_id and import_session_id = p_session_id
        and media_asset_id = (mapping ->> 'asset_id')::uuid
        and disposition = 'pending';
      get diagnostics resolved_mapping_count = row_count;
      if resolved_mapping_count <> 1 then
        raise exception 'import asset assignment conflict' using errcode = '40001';
      end if;
    end loop;
    resolved_ordinal := resolved_ordinal + 1;
  end loop;

  if jsonb_typeof(coalesce(p_resolution -> 'skipped_asset_ids', '[]'::jsonb)) <> 'array' then
    raise exception 'invalid skipped asset list' using errcode = '22023';
  end if;
  update public.import_asset_links
  set disposition = 'skipped'
  where account_id = p_account_id and import_session_id = p_session_id
    and disposition = 'pending'
    and media_asset_id in (
      select (value #>> '{}')::uuid
      from jsonb_array_elements(coalesce(p_resolution -> 'skipped_asset_ids', '[]'::jsonb))
    );

  if exists (
    select 1 from public.import_asset_links
    where account_id = p_account_id and import_session_id = p_session_id
      and disposition = 'pending'
  ) then
    raise exception 'every import asset requires an explicit decision' using errcode = '22023';
  end if;

  update public.import_sessions
  set state = 'review', preview_manifest_hash = null,
      confirmed_revision = null, confirmed_manifest_hash = null, confirmed_at = null,
      preview_revision = preview_revision + 1, version = version + 1, updated_at = now()
  where account_id = p_account_id and id = p_session_id
  returning version into resolved_version;
  return resolved_version;
end
$$;

create or replace function public.build_import_preview(
  p_account_id uuid,
  p_session_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_version bigint;
  resolved_revision bigint;
  resolved_hash bytea;
  record public.import_records%rowtype;
  current_item jsonb;
  desired jsonb;
  invalid_count integer;
begin
  select version, preview_revision into resolved_version, resolved_revision
  from public.import_sessions
  where account_id = p_account_id and id = p_session_id
    and state in ('review', 'ready') and version = p_expected_version
  for update;
  if not found then
    raise exception 'import preview conflict' using errcode = '40001';
  end if;
  if exists (
    select 1 from public.import_asset_links
    where account_id = p_account_id and import_session_id = p_session_id
      and disposition = 'pending'
  ) then
    raise exception 'unresolved import assets' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.import_asset_links link
    join public.media_assets asset
      on asset.account_id = link.account_id and asset.id = link.media_asset_id
    where link.account_id = p_account_id
      and link.import_session_id = p_session_id
      and link.disposition = 'assigned'
      and asset.processing_state <> 'ready'
  ) then
    raise exception 'import media processing incomplete' using errcode = '40001';
  end if;

  invalid_count := 0;
  for record in
    select * from public.import_records
    where account_id = p_account_id and import_session_id = p_session_id
    order by record_ordinal
    for update
  loop
    desired := jsonb_build_object(
      'display_name', record.normalized_payload -> 'display_name',
      'category_code', record.normalized_payload -> 'category_code',
      'physical_set', record.normalized_payload -> 'physical_set',
      'variants', record.normalized_payload -> 'variants'
    );
    current_item := null;
    if record.proposed_action in ('update', 'link') then
      select jsonb_build_object(
        'id', item.id, 'version', item.version, 'display_name', item.display_name,
        'category_code', category.code
      ) into current_item
      from public.clothing_items item
      left join public.categories category on category.id = item.category_id
      where item.account_id = p_account_id and item.id = record.candidate_item_id;
      if current_item is null or (
        record.proposed_action = 'update' and
        (current_item ->> 'version')::bigint <>
          coalesce((record.decision_payload ->> 'expected_item_version')::bigint, 0)
      ) then
        invalid_count := invalid_count + 1;
      end if;
    end if;
    update public.import_records
    set proposed_diff = jsonb_build_object(
      'action', record.proposed_action,
      'before', current_item,
      'after', case when record.proposed_action = 'skip' then null else desired end
    ),
    validation_state = case
      when record.proposed_action in ('update', 'link') and current_item is null then 'error'
      when record.proposed_action = 'update' and
        (current_item ->> 'version')::bigint <>
          coalesce((record.decision_payload ->> 'expected_item_version')::bigint, 0)
        then 'error'
      else validation_state
    end,
    issues = case
      when record.proposed_action in ('update', 'link') and current_item is null
        then issues || jsonb_build_array(jsonb_build_object('code', 'target_missing', 'severity', 'error'))
      when record.proposed_action = 'update' and
        (current_item ->> 'version')::bigint <>
          coalesce((record.decision_payload ->> 'expected_item_version')::bigint, 0)
        then issues || jsonb_build_array(jsonb_build_object('code', 'target_version_changed', 'severity', 'error'))
      else issues
    end,
    updated_at = now()
    where id = record.id;
  end loop;
  if invalid_count > 0 then
    raise exception 'import preview has conflicts' using errcode = '40001';
  end if;

  select extensions.digest(
    convert_to(jsonb_build_object(
      'schema', 'aiw.bulk-import/1',
      'session_id', p_session_id,
      'revision', resolved_revision,
      'records', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', id, 'commit_key', commit_key, 'action', proposed_action,
          'normalized', normalized_payload, 'decision', decision_payload,
          'diff', proposed_diff
        ) order by record_ordinal)
        from public.import_records
        where account_id = p_account_id and import_session_id = p_session_id
      ), '[]'::jsonb),
      'assets', coalesce((
        select jsonb_agg(jsonb_build_object(
          'asset_id', media_asset_id, 'record_id', import_record_id,
          'disposition', disposition, 'role', proposed_role, 'view', proposed_view,
          'variant_key', proposed_variant_key, 'primary', proposed_primary
        ) order by media_asset_id)
        from public.import_asset_links
        where account_id = p_account_id and import_session_id = p_session_id
      ), '[]'::jsonb)
    )::text, 'UTF8'), 'sha256'
  ) into resolved_hash;

  update public.import_sessions
  set state = 'ready', preview_manifest_hash = resolved_hash,
      version = version + 1, updated_at = now()
  where account_id = p_account_id and id = p_session_id
  returning version into resolved_version;
  return jsonb_build_object(
    'session_id', p_session_id, 'state', 'ready',
    'version', resolved_version, 'revision', resolved_revision,
    'manifest_hash', encode(resolved_hash, 'hex'),
    'record_count', (
      select count(*) from public.import_records
      where account_id = p_account_id and import_session_id = p_session_id
    )
  );
end
$$;

create or replace function public.confirm_import_session(
  p_account_id uuid,
  p_session_id uuid,
  p_expected_version bigint,
  p_expected_revision bigint,
  p_expected_manifest_hash bytea,
  p_idempotency_key text,
  p_request_hash bytea
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_session public.import_sessions%rowtype;
  inserted_count integer;
  existing_hash bytea;
  response jsonb;
begin
  if nullif(btrim(p_idempotency_key), '') is null
    or p_expected_manifest_hash is null or p_request_hash is null then
    raise exception 'invalid import confirmation' using errcode = '22023';
  end if;
  insert into public.idempotency_records (
    account_id, operation_scope, idempotency_key, request_hash, state,
    resource_type, resource_id, expires_at
  ) values (
    p_account_id, 'import.confirm', p_idempotency_key, p_request_hash, 'in_progress',
    'import_session', p_session_id, now() + interval '7 days'
  ) on conflict (account_id, operation_scope, idempotency_key) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    select request_hash, response_summary into existing_hash, response
    from public.idempotency_records
    where account_id = p_account_id and operation_scope = 'import.confirm'
      and idempotency_key = p_idempotency_key;
    if existing_hash <> p_request_hash then
      raise exception 'idempotency key payload mismatch' using errcode = '22023';
    end if;
    return response;
  end if;

  select * into resolved_session
  from public.import_sessions
  where account_id = p_account_id and id = p_session_id
  for update;
  if not found or resolved_session.state <> 'ready'
    or resolved_session.version <> p_expected_version
    or resolved_session.preview_revision <> p_expected_revision
    or resolved_session.preview_manifest_hash <> p_expected_manifest_hash then
    raise exception 'sealed import preview conflict' using errcode = '40001';
  end if;
  if exists (
    select 1 from public.import_records
    where account_id = p_account_id and import_session_id = p_session_id
      and (validation_state = 'error' or user_decision in ('pending', 'needs_review'))
  ) then
    raise exception 'import review incomplete' using errcode = '22023';
  end if;

  update public.import_sessions
  set state = 'committing', confirmed_revision = preview_revision,
      confirmed_manifest_hash = preview_manifest_hash, confirmed_at = now(),
      version = version + 1, updated_at = now()
  where account_id = p_account_id and id = p_session_id;
  insert into public.jobs (
    account_id, job_type, deduplication_key, import_session_id, payload
  ) values (
    p_account_id, 'import.commit',
    'commit:' || p_session_id::text || ':' || p_expected_revision::text,
    p_session_id, jsonb_build_object('revision', p_expected_revision)
  ) on conflict (account_id, job_type, deduplication_key)
  do update set available_at = least(public.jobs.available_at, now());
  insert into public.audit_events (
    account_id, actor_auth_user_id, event_type, target_type, target_id, metadata
  ) values (
    p_account_id, null, 'import.confirmed', 'import_session', p_session_id,
    jsonb_build_object('revision', p_expected_revision)
  );
  response := jsonb_build_object(
    'session_id', p_session_id, 'state', 'committing',
    'revision', p_expected_revision, 'version', p_expected_version + 1
  );
  update public.idempotency_records
  set state = 'succeeded', completed_at = now(), response_summary = response
  where account_id = p_account_id and operation_scope = 'import.confirm'
    and idempotency_key = p_idempotency_key;
  return response;
end
$$;

create or replace function public.commit_import_record(
  p_worker_id text,
  p_job_id uuid,
  p_record_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  resolved_session_id uuid;
  record public.import_records%rowtype;
  resolved_item_id uuid;
  resolved_category_id uuid;
  resolved_variant_id uuid;
  resolved_variant_label text;
  resolved_action text;
  resolved_outcome text;
  variant jsonb;
  asset public.import_asset_links%rowtype;
  resolved_position integer := 0;
  resolved_variant_count integer;
  resolved_binding_count integer;
begin
  select account_id, import_session_id
  into resolved_account_id, resolved_session_id
  from public.jobs
  where id = p_job_id and job_type = 'import.commit' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now()
  for update;
  if not found then
    raise exception 'import commit lease unavailable' using errcode = '40001';
  end if;
  if not exists (
    select 1 from public.accounts
    where id = resolved_account_id and state = 'active'
  ) then
    raise exception 'account unavailable' using errcode = '40001';
  end if;
  if not exists (
    select 1 from public.import_sessions
    where account_id = resolved_account_id and id = resolved_session_id
      and state in ('committing', 'partial')
      and confirmed_revision is not null
      and confirmed_manifest_hash is not null
  ) then
    raise exception 'sealed import unavailable' using errcode = '40001';
  end if;

  select * into record
  from public.import_records
  where account_id = resolved_account_id and import_session_id = resolved_session_id
    and id = p_record_id
  for update;
  if not found then
    raise exception 'import record unavailable' using errcode = 'P0002';
  end if;
  if record.commit_outcome <> 'pending' then
    return jsonb_build_object(
      'record_id', record.id, 'outcome', record.commit_outcome,
      'item_id', record.committed_item_id
    );
  end if;

  resolved_action := record.proposed_action;
  if resolved_action = 'skip' or record.user_decision = 'skip' then
    update public.import_records
    set commit_outcome = 'skipped', committed_at = now(), updated_at = now()
    where id = record.id;
    return jsonb_build_object('record_id', record.id, 'outcome', 'skipped');
  end if;
  if record.user_decision <> 'approve'
    or resolved_action not in ('create', 'update', 'link') then
    raise exception 'import record not approved' using errcode = '22023';
  end if;

  if nullif(btrim(record.normalized_payload ->> 'category_code'), '') is not null then
    select id into resolved_category_id
    from public.categories
    where code = record.normalized_payload ->> 'category_code' and is_active;
    if resolved_category_id is null then
      raise exception 'import category unavailable' using errcode = '40001';
    end if;
  end if;

  if resolved_action = 'create' then
    insert into public.clothing_items (
      account_id, record_state, lifecycle_state, display_name, category_id
    ) values (
      resolved_account_id, 'committed', 'active',
      record.normalized_payload ->> 'display_name', resolved_category_id
    ) returning id into resolved_item_id;
    resolved_outcome := 'created';
  else
    resolved_item_id := record.candidate_item_id;
    if resolved_action = 'update' then
      update public.clothing_items
      set display_name = record.normalized_payload ->> 'display_name',
          category_id = resolved_category_id,
          version = version + 1,
          updated_at = now()
      where account_id = resolved_account_id and id = resolved_item_id
        and lifecycle_state = 'active'
        and version = (record.decision_payload ->> 'expected_item_version')::bigint
      returning id into resolved_item_id;
      if resolved_item_id is null then
        raise exception 'import item version conflict' using errcode = '40001';
      end if;
      resolved_outcome := 'updated';
    else
      if not exists (
        select 1 from public.clothing_items
        where account_id = resolved_account_id and id = resolved_item_id
          and lifecycle_state = 'active'
      ) then
        raise exception 'import item unavailable' using errcode = 'P0002';
      end if;
      resolved_outcome := 'linked';
    end if;
  end if;

  for variant in
    select value
    from jsonb_array_elements(coalesce(record.normalized_payload -> 'variants', '[]'::jsonb))
  loop
    resolved_variant_label := btrim(variant ->> 'label');
    insert into public.appearance_variants (
      account_id, clothing_item_id, label, is_default, position
    ) values (
      resolved_account_id, resolved_item_id, resolved_variant_label,
      coalesce((variant ->> 'is_default')::boolean, false),
      coalesce((variant ->> 'position')::integer, 0)
    )
    on conflict do nothing;
    select count(*) into resolved_variant_count
    from public.appearance_variants
    where account_id = resolved_account_id
      and clothing_item_id = resolved_item_id
      and lower(btrim(label)) = lower(resolved_variant_label)
      and is_default = coalesce((variant ->> 'is_default')::boolean, false)
      and position = coalesce((variant ->> 'position')::integer, 0)
      and archived_at is null;
    if resolved_variant_count <> 1 then
      raise exception 'import variant conflict' using errcode = '40001';
    end if;
  end loop;

  for asset in
    select *
    from public.import_asset_links
    where account_id = resolved_account_id
      and import_session_id = resolved_session_id
      and import_record_id = record.id
      and disposition = 'assigned'
    order by created_at, id
  loop
    if not exists (
      select 1 from public.media_assets
      where account_id = resolved_account_id and id = asset.media_asset_id
        and processing_state = 'ready'
    ) then
      raise exception 'import media not ready' using errcode = '40001';
    end if;
    resolved_variant_id := null;
    if asset.proposed_variant_key is not null then
      select variant_value ->> 'label' into resolved_variant_label
      from jsonb_array_elements(
        coalesce(record.normalized_payload -> 'variants', '[]'::jsonb)
      ) variant_value
      where variant_value ->> 'key' = asset.proposed_variant_key;
      if resolved_variant_label is null then
        raise exception 'import variant mapping unavailable' using errcode = '22023';
      end if;
      select id into resolved_variant_id
      from public.appearance_variants
      where account_id = resolved_account_id
        and clothing_item_id = resolved_item_id
        and lower(btrim(label)) = lower(btrim(resolved_variant_label))
        and archived_at is null;
      if resolved_variant_id is null then
        raise exception 'import variant unavailable' using errcode = '40001';
      end if;
    end if;
    insert into public.media_bindings (
      account_id, media_asset_id, clothing_item_id, appearance_variant_id,
      product_role, image_view, position, is_primary
    ) values (
      resolved_account_id, asset.media_asset_id, resolved_item_id, resolved_variant_id,
      asset.proposed_role, asset.proposed_view, resolved_position, asset.proposed_primary
    ) on conflict do nothing;
    get diagnostics resolved_binding_count = row_count;
    if resolved_binding_count = 0 and not exists (
      select 1
      from public.media_bindings binding
      where binding.account_id = resolved_account_id
        and binding.media_asset_id = asset.media_asset_id
        and binding.clothing_item_id = resolved_item_id
        and binding.appearance_variant_id is not distinct from resolved_variant_id
        and binding.product_role = asset.proposed_role
        and binding.image_view = asset.proposed_view
        and binding.is_primary = asset.proposed_primary
    ) then
      raise exception 'import media binding conflict' using errcode = '40001';
    end if;
    resolved_position := resolved_position + 1;
  end loop;

  update public.import_records
  set commit_outcome = resolved_outcome,
      committed_item_id = resolved_item_id,
      outcome_detail = jsonb_build_object('commit_key', commit_key),
      committed_at = now(), updated_at = now()
  where id = record.id;
  return jsonb_build_object(
    'record_id', record.id, 'outcome', resolved_outcome, 'item_id', resolved_item_id
  );
end
$$;

create or replace function public.record_import_record_failure(
  p_worker_id text,
  p_job_id uuid,
  p_record_id uuid,
  p_failure_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  resolved_session_id uuid;
begin
  select account_id, import_session_id
  into resolved_account_id, resolved_session_id
  from public.jobs
  where id = p_job_id and job_type = 'import.commit' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now();
  if not found then return false; end if;
  update public.import_records
  set commit_outcome = 'failed',
      outcome_detail = jsonb_build_object(
        'failure_code', left(coalesce(nullif(btrim(p_failure_code), ''), 'record_commit_failed'), 120)
      ),
      committed_at = now(), updated_at = now()
  where account_id = resolved_account_id and import_session_id = resolved_session_id
    and id = p_record_id and commit_outcome = 'pending';
  return found;
end
$$;

create or replace function public.finalize_import_commit(
  p_worker_id text,
  p_job_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  resolved_session_id uuid;
  resolved_pending integer;
  resolved_failed integer;
  resolved_succeeded integer;
  resolved_skipped integer;
  resolved_state text;
begin
  select account_id, import_session_id
  into resolved_account_id, resolved_session_id
  from public.jobs
  where id = p_job_id and job_type = 'import.commit' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now()
  for update;
  if not found then
    raise exception 'import commit lease unavailable' using errcode = '40001';
  end if;
  select
    count(*) filter (where commit_outcome = 'pending'),
    count(*) filter (where commit_outcome = 'failed'),
    count(*) filter (where commit_outcome in ('created', 'updated', 'linked')),
    count(*) filter (where commit_outcome = 'skipped')
  into resolved_pending, resolved_failed, resolved_succeeded, resolved_skipped
  from public.import_records
  where account_id = resolved_account_id and import_session_id = resolved_session_id;
  if resolved_pending > 0 then
    raise exception 'import records remain pending' using errcode = '40001';
  end if;
  resolved_state := case when resolved_failed > 0 then 'partial' else 'completed' end;
  update public.import_sessions
  set state = resolved_state,
      summary = summary || jsonb_build_object(
        'commit', jsonb_build_object(
          'succeeded', resolved_succeeded,
          'failed', resolved_failed,
          'skipped', resolved_skipped
        )
      ),
      cleanup_after = now() + interval '24 hours',
      failure_code = case when resolved_failed > 0 then 'partial_failure' else null end,
      version = version + 1, updated_at = now()
  where account_id = resolved_account_id and id = resolved_session_id;
  update public.jobs
  set state = 'succeeded', checkpoint = jsonb_build_object(
    'succeeded', resolved_succeeded, 'failed', resolved_failed, 'skipped', resolved_skipped
  ), lease_owner = null, lease_expires_at = null, updated_at = now()
  where id = p_job_id;
  insert into public.audit_events (
    account_id, actor_auth_user_id, event_type, target_type, target_id, metadata
  ) values (
    resolved_account_id, null, 'import.completed', 'import_session', resolved_session_id,
    jsonb_build_object(
      'state', resolved_state, 'succeeded', resolved_succeeded,
      'failed', resolved_failed, 'skipped', resolved_skipped
    )
  );
  insert into public.jobs (
    account_id, job_type, deduplication_key, import_session_id, payload, available_at
  ) values (
    resolved_account_id, 'import.cleanup',
    'cleanup:' || resolved_session_id::text || ':1', resolved_session_id,
    '{}'::jsonb, now()
  ) on conflict (account_id, job_type, deduplication_key)
  do update set available_at = now(), state = 'queued',
    lease_owner = null, lease_expires_at = null, updated_at = now();
  return jsonb_build_object(
    'session_id', resolved_session_id, 'state', resolved_state,
    'succeeded', resolved_succeeded, 'failed', resolved_failed, 'skipped', resolved_skipped
  );
end
$$;

create or replace function public.retry_import_commit(
  p_account_id uuid,
  p_session_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_revision bigint;
  resolved_version bigint;
  resolved_failed integer;
begin
  select confirmed_revision into resolved_revision
  from public.import_sessions
  where account_id = p_account_id and id = p_session_id
    and state = 'partial' and version = p_expected_version
  for update;
  if not found then
    raise exception 'import retry conflict' using errcode = '40001';
  end if;
  update public.import_records
  set commit_outcome = 'pending', outcome_detail = '{}'::jsonb,
      committed_at = null, updated_at = now()
  where account_id = p_account_id and import_session_id = p_session_id
    and commit_outcome = 'failed';
  get diagnostics resolved_failed = row_count;
  if resolved_failed = 0 then
    raise exception 'no failed import records' using errcode = '22023';
  end if;
  update public.import_sessions
  set state = 'committing', failure_code = null, version = version + 1, updated_at = now()
  where account_id = p_account_id and id = p_session_id
  returning version into resolved_version;
  insert into public.jobs (
    account_id, job_type, deduplication_key, import_session_id, payload
  ) values (
    p_account_id, 'import.commit',
    'commit-retry:' || p_session_id::text || ':' || resolved_version::text,
    p_session_id, jsonb_build_object('revision', resolved_revision, 'retry', true)
  );
  return jsonb_build_object(
    'session_id', p_session_id, 'state', 'committing',
    'version', resolved_version, 'retry_records', resolved_failed
  );
end
$$;

create or replace function public.cancel_import_session(
  p_account_id uuid,
  p_session_id uuid,
  p_expected_version bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_version bigint;
begin
  update public.import_sessions
  set state = 'cancelled', cleanup_after = now(),
      version = version + 1, updated_at = now()
  where account_id = p_account_id and id = p_session_id
    and version = p_expected_version
    and state in ('awaiting_upload', 'uploaded', 'review', 'ready', 'failed')
  returning version into resolved_version;
  if resolved_version is null then
    raise exception 'import cancellation conflict' using errcode = '40001';
  end if;
  update public.import_asset_links
  set import_record_id = null, disposition = 'skipped',
      proposed_variant_key = null, proposed_primary = false
  where account_id = p_account_id and import_session_id = p_session_id;
  update public.jobs
  set state = 'cancelled', lease_owner = null, lease_expires_at = null, updated_at = now()
  where account_id = p_account_id and import_session_id = p_session_id
    and job_type in ('import.parse', 'import.commit')
    and state = 'queued';
  insert into public.jobs (
    account_id, job_type, deduplication_key, import_session_id, payload
  ) values (
    p_account_id, 'import.cleanup',
    'cleanup:' || p_session_id::text || ':1', p_session_id, '{}'::jsonb
  ) on conflict (account_id, job_type, deduplication_key)
  do update set available_at = now();
  return resolved_version;
end
$$;

create or replace function public.finalize_import_cleanup(
  p_worker_id text,
  p_job_id uuid,
  p_deleted_part_ids uuid[]
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_account_id uuid;
  resolved_session_id uuid;
begin
  select account_id, import_session_id
  into resolved_account_id, resolved_session_id
  from public.jobs
  where id = p_job_id and job_type = 'import.cleanup' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now()
  for update;
  if not found then
    raise exception 'import cleanup lease unavailable' using errcode = '40001';
  end if;
  update public.import_archive_parts
  set state = 'deleted', updated_at = now()
  where account_id = resolved_account_id and import_session_id = resolved_session_id
    and id = any(coalesce(p_deleted_part_ids, '{}'::uuid[]));
  if exists (
    select 1 from public.import_archive_parts
    where account_id = resolved_account_id and import_session_id = resolved_session_id
      and state <> 'deleted'
  ) then
    raise exception 'import cleanup incomplete' using errcode = '40001';
  end if;
  update public.media_assets asset
  set processing_state = 'pending_delete', delete_after = now(),
      updated_at = now(), version = version + 1
  where asset.account_id = resolved_account_id
    and not exists (
      select 1 from public.media_bindings binding
      where binding.account_id = asset.account_id and binding.media_asset_id = asset.id
    )
    and exists (
      select 1 from public.import_asset_links link
      where link.account_id = resolved_account_id
        and link.import_session_id = resolved_session_id
        and link.media_asset_id = asset.id
        and link.disposition = 'skipped'
    )
    and asset.processing_state <> 'pending_delete';
  update public.media_renditions rendition
  set state = 'pending_delete', updated_at = now(), version = version + 1
  where rendition.account_id = resolved_account_id
    and exists (
      select 1 from public.media_assets asset
      where asset.account_id = resolved_account_id
        and asset.id = rendition.media_asset_id
        and asset.processing_state = 'pending_delete'
    );
  insert into public.jobs (
    account_id, job_type, deduplication_key, media_asset_id, payload
  )
  select resolved_account_id, 'media.cleanup', 'cleanup:' || asset.id::text,
    asset.id, '{}'::jsonb
  from public.media_assets asset
  where asset.account_id = resolved_account_id
    and asset.processing_state = 'pending_delete'
    and exists (
      select 1 from public.import_asset_links link
      where link.account_id = resolved_account_id
        and link.import_session_id = resolved_session_id
        and link.media_asset_id = asset.id
        and link.disposition = 'skipped'
    )
  on conflict (account_id, job_type, deduplication_key) do nothing;
  update public.jobs
  set state = 'succeeded', lease_owner = null, lease_expires_at = null, updated_at = now()
  where id = p_job_id;
  return true;
end
$$;

revoke all on function public.create_import_session_intent(uuid, uuid, jsonb, text, bytea)
  from public, anon, authenticated;
revoke all on function public.complete_import_archive_part(uuid, uuid, uuid, bigint)
  from public, anon, authenticated;
revoke all on function public.replace_import_resolution(uuid, uuid, bigint, jsonb)
  from public, anon, authenticated;
revoke all on function public.build_import_preview(uuid, uuid, bigint)
  from public, anon, authenticated;
revoke all on function public.confirm_import_session(uuid, uuid, bigint, bigint, bytea, text, bytea)
  from public, anon, authenticated;
revoke all on function public.retry_import_commit(uuid, uuid, bigint)
  from public, anon, authenticated;
revoke all on function public.cancel_import_session(uuid, uuid, bigint)
  from public, anon, authenticated;
revoke all on function public.claim_import_job(text, integer)
  from public, anon, authenticated;
revoke all on function public.stage_import_asset(text, uuid, uuid, text, text, text, bigint, bytea, text)
  from public, anon, authenticated;
revoke all on function public.finish_import_prepare(text, uuid, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.fail_import_job(text, uuid, text, integer)
  from public, anon, authenticated;
revoke all on function public.commit_import_record(text, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.record_import_record_failure(text, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.finalize_import_commit(text, uuid)
  from public, anon, authenticated;
revoke all on function public.finalize_import_cleanup(text, uuid, uuid[])
  from public, anon, authenticated;

grant execute on function public.create_import_session_intent(uuid, uuid, jsonb, text, bytea)
  to service_role;
grant execute on function public.complete_import_archive_part(uuid, uuid, uuid, bigint)
  to service_role;
grant execute on function public.replace_import_resolution(uuid, uuid, bigint, jsonb)
  to service_role;
grant execute on function public.build_import_preview(uuid, uuid, bigint)
  to service_role;
grant execute on function public.confirm_import_session(uuid, uuid, bigint, bigint, bytea, text, bytea)
  to service_role;
grant execute on function public.retry_import_commit(uuid, uuid, bigint)
  to service_role;
grant execute on function public.cancel_import_session(uuid, uuid, bigint)
  to service_role;
grant execute on function public.claim_import_job(text, integer)
  to service_role;
grant execute on function public.stage_import_asset(text, uuid, uuid, text, text, text, bigint, bytea, text)
  to service_role;
grant execute on function public.finish_import_prepare(text, uuid, jsonb, jsonb)
  to service_role;
grant execute on function public.fail_import_job(text, uuid, text, integer)
  to service_role;
grant execute on function public.commit_import_record(text, uuid, uuid)
  to service_role;
grant execute on function public.record_import_record_failure(text, uuid, uuid, text)
  to service_role;
grant execute on function public.finalize_import_commit(text, uuid)
  to service_role;
grant execute on function public.finalize_import_cleanup(text, uuid, uuid[])
  to service_role;

revoke all on public.import_archive_parts from anon;
revoke insert, update, delete on public.import_archive_parts from authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
