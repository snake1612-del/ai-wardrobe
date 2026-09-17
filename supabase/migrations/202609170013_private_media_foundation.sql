insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values
  (
    'wardrobe-originals', 'wardrobe-originals', false, 16777216,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'wardrobe-renditions', 'wardrobe-renditions', false, 8388608,
    array['image/webp']::text[]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy wardrobe_originals_authenticated_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wardrobe-originals'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1
    from public.media_assets asset
    where asset.account_id = (select private.current_account_id())
      and asset.processing_state = 'awaiting_upload'
      and asset.storage_bucket = bucket_id
      and asset.storage_object_key = name
      and name = 'accounts/' || asset.account_id::text || '/assets/' || asset.id::text || '/source/v1'
  )
);

create or replace function public.create_media_upload_intent(
  p_account_id uuid,
  p_asset_id uuid,
  p_item_id uuid,
  p_appearance_variant_id uuid,
  p_original_filename text,
  p_declared_mime_type text,
  p_declared_byte_size bigint,
  p_product_role text,
  p_image_view text,
  p_replaces_asset_id uuid,
  p_idempotency_key text,
  p_request_hash bytea
)
returns table (
  asset_id uuid,
  storage_bucket text,
  storage_object_key text,
  processing_state text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
  existing_hash bytea;
  existing_asset_id uuid;
  resolved_key text;
  resolved_position integer;
begin
  if p_account_id is null or p_asset_id is null or p_item_id is null
    or nullif(btrim(p_idempotency_key), '') is null or p_request_hash is null then
    raise exception 'missing media intent input' using errcode = '22004';
  end if;
  if p_declared_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
    raise exception 'unsupported media type' using errcode = '22023';
  end if;
  if p_declared_byte_size is null or p_declared_byte_size <= 0 or p_declared_byte_size > 16777216 then
    raise exception 'invalid media size' using errcode = '22023';
  end if;
  if p_product_role not in ('evidence_source', 'catalog', 'reference')
    or p_image_view not in ('front', 'back', 'side', 'detail', 'unspecified') then
    raise exception 'invalid media binding' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.clothing_items item
    where item.account_id = p_account_id and item.id = p_item_id
      and item.lifecycle_state = 'active'
  ) then
    raise exception 'media target unavailable' using errcode = 'P0002';
  end if;
  if p_appearance_variant_id is not null and not exists (
    select 1 from public.appearance_variants variant
    where variant.account_id = p_account_id
      and variant.id = p_appearance_variant_id
      and variant.clothing_item_id = p_item_id
      and variant.archived_at is null
  ) then
    raise exception 'media target unavailable' using errcode = 'P0002';
  end if;
  if p_replaces_asset_id is not null and not exists (
    select 1
    from public.media_assets asset
    join public.media_bindings binding
      on binding.account_id = asset.account_id and binding.media_asset_id = asset.id
    where asset.account_id = p_account_id and asset.id = p_replaces_asset_id
      and asset.processing_state = 'ready' and binding.clothing_item_id = p_item_id
  ) then
    raise exception 'replacement target unavailable' using errcode = 'P0002';
  end if;

  insert into public.idempotency_records (
    account_id, operation_scope, idempotency_key, request_hash, state,
    resource_type, resource_id, expires_at
  ) values (
    p_account_id, 'media.upload_intent', p_idempotency_key, p_request_hash, 'in_progress',
    'media_asset', p_asset_id, now() + interval '24 hours'
  ) on conflict (account_id, operation_scope, idempotency_key) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    select request_hash, resource_id into existing_hash, existing_asset_id
    from public.idempotency_records
    where account_id = p_account_id
      and operation_scope = 'media.upload_intent'
      and idempotency_key = p_idempotency_key
    for update;
    if existing_hash <> p_request_hash then
      raise exception 'idempotency key payload mismatch' using errcode = '22023';
    end if;
    return query
      select asset.id, asset.storage_bucket, asset.storage_object_key, asset.processing_state
      from public.media_assets asset
      where asset.account_id = p_account_id and asset.id = existing_asset_id;
    return;
  end if;

  resolved_key := 'accounts/' || p_account_id::text || '/assets/' || p_asset_id::text || '/source/v1';
  insert into public.media_assets (
    id, account_id, origin_code, evidence_status, storage_bucket,
    storage_object_key, original_filename, declared_mime_type,
    processing_state, replaces_asset_id
  ) values (
    p_asset_id, p_account_id, 'user_uploaded', 'real_item_evidence', 'wardrobe-originals',
    resolved_key, left(nullif(btrim(p_original_filename), ''), 255), p_declared_mime_type,
    'awaiting_upload', p_replaces_asset_id
  );

  select coalesce(max(position) + 1, 0) into resolved_position
  from public.media_bindings
  where account_id = p_account_id and clothing_item_id = p_item_id;

  insert into public.media_bindings (
    account_id, media_asset_id, clothing_item_id, appearance_variant_id,
    product_role, image_view, position, is_primary
  ) values (
    p_account_id, p_asset_id, p_item_id, p_appearance_variant_id,
    p_product_role, p_image_view, resolved_position, false
  );

  update public.idempotency_records
  set state = 'succeeded', completed_at = now(),
      response_summary = jsonb_build_object('asset_id', p_asset_id)
  where account_id = p_account_id
    and operation_scope = 'media.upload_intent'
    and idempotency_key = p_idempotency_key;

  return query select p_asset_id, 'wardrobe-originals'::text, resolved_key, 'awaiting_upload'::text;
end
$$;

create or replace function public.complete_media_upload(
  p_account_id uuid,
  p_asset_id uuid,
  p_observed_byte_size bigint,
  p_idempotency_key text,
  p_request_hash bytea
)
returns table (asset_id uuid, processing_state text, job_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
  existing_hash bytea;
  existing_job_id uuid;
  resolved_bucket text;
  resolved_key text;
  resolved_state text;
begin
  if p_observed_byte_size is null or p_observed_byte_size <= 0 or p_observed_byte_size > 16777216
    or nullif(btrim(p_idempotency_key), '') is null or p_request_hash is null then
    raise exception 'invalid completion input' using errcode = '22023';
  end if;

  insert into public.idempotency_records (
    account_id, operation_scope, idempotency_key, request_hash, state,
    resource_type, resource_id, expires_at
  ) values (
    p_account_id, 'media.complete', p_idempotency_key, p_request_hash, 'in_progress',
    'media_asset', p_asset_id, now() + interval '24 hours'
  ) on conflict (account_id, operation_scope, idempotency_key) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    select record.request_hash,
      nullif(record.response_summary ->> 'job_id', '')::uuid
    into existing_hash, existing_job_id
    from public.idempotency_records record
    where record.account_id = p_account_id
      and record.operation_scope = 'media.complete'
      and record.idempotency_key = p_idempotency_key
    for update;
    if existing_hash <> p_request_hash then
      raise exception 'idempotency key payload mismatch' using errcode = '22023';
    end if;
    return query
      select asset.id, asset.processing_state, existing_job_id
      from public.media_assets asset
      where asset.account_id = p_account_id and asset.id = p_asset_id;
    return;
  end if;

  select asset.storage_bucket, asset.storage_object_key, asset.processing_state
  into resolved_bucket, resolved_key, resolved_state
  from public.media_assets asset
  where asset.account_id = p_account_id and asset.id = p_asset_id
  for update;
  if not found then
    raise exception 'media asset unavailable' using errcode = 'P0002';
  end if;
  if resolved_state <> 'awaiting_upload' then
    raise exception 'media asset cannot be completed' using errcode = '40001';
  end if;
  if not exists (
    select 1 from storage.objects object
    where object.bucket_id = resolved_bucket and object.name = resolved_key
      and object.owner_id = (select account.auth_user_id::text from public.accounts account where account.id = p_account_id)
  ) then
    raise exception 'uploaded object unavailable' using errcode = 'P0002';
  end if;

  update public.media_assets
  set processing_state = 'uploaded', byte_size = p_observed_byte_size,
      failure_code = null, updated_at = now(), version = version + 1
  where account_id = p_account_id and id = p_asset_id;

  insert into public.jobs (
    account_id, job_type, deduplication_key, media_asset_id, payload, max_attempts
  ) values (
    p_account_id, 'media.validate', 'validate:' || p_asset_id::text || ':1', p_asset_id,
    jsonb_build_object('profile', 'media-v1'), 5
  ) returning id into existing_job_id;

  update public.idempotency_records
  set state = 'succeeded', completed_at = now(),
      response_summary = jsonb_build_object('asset_id', p_asset_id, 'job_id', existing_job_id)
  where account_id = p_account_id
    and operation_scope = 'media.complete'
    and idempotency_key = p_idempotency_key;

  return query select p_asset_id, 'uploaded'::text, existing_job_id;
end
$$;

create or replace function public.retry_media_asset(
  p_account_id uuid,
  p_asset_id uuid,
  p_expected_version bigint
)
returns table (asset_id uuid, processing_state text, asset_version bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_version bigint;
  resolved_key text;
  resume_processing boolean;
  next_state text;
begin
  select asset.version, asset.storage_object_key into resolved_version, resolved_key
  from public.media_assets asset
  where asset.account_id = p_account_id and asset.id = p_asset_id
    and asset.processing_state = 'failed' and asset.version = p_expected_version
  for update;
  if not found then
    raise exception 'media retry conflict' using errcode = '40001';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'wardrobe-originals' and name = resolved_key
  ) then
    raise exception 'uploaded object unavailable' using errcode = 'P0002';
  end if;
  select exists (
    select 1 from public.media_renditions
    where account_id = p_account_id and media_asset_id = p_asset_id
  ) into resume_processing;
  next_state := case when resume_processing then 'processing' else 'uploaded' end;
  update public.media_assets asset
  set processing_state = next_state, failure_code = null,
      updated_at = now(), version = asset.version + 1
  where asset.account_id = p_account_id and asset.id = p_asset_id
  returning asset.version into resolved_version;
  if resume_processing then
    insert into public.jobs (
      account_id, job_type, deduplication_key, media_asset_id, payload, max_attempts
    ) values (
      p_account_id, 'media.process',
      'process:' || p_asset_id::text || ':media-v1:' || resolved_version::text,
      p_asset_id, jsonb_build_object('profile', 'media-v1'), 5
    );
  else
    insert into public.jobs (
      account_id, job_type, deduplication_key, media_asset_id, payload, max_attempts
    ) values (
      p_account_id, 'media.validate',
      'validate:' || p_asset_id::text || ':' || resolved_version::text,
      p_asset_id, jsonb_build_object('profile', 'media-v1'), 5
    );
  end if;
  return query select p_asset_id, next_state, resolved_version;
end
$$;

create or replace function public.claim_media_job(
  p_worker_id text,
  p_lease_seconds integer default 120
)
returns table (
  job_id uuid, account_id uuid, job_type text, media_asset_id uuid,
  payload jsonb, attempt_count integer, max_attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_id uuid;
begin
  if nullif(btrim(p_worker_id), '') is null or p_lease_seconds < 15 or p_lease_seconds > 900 then
    raise exception 'invalid worker lease' using errcode = '22023';
  end if;
  select candidate.id into claimed_id
  from public.jobs candidate
  where candidate.job_type in ('media.validate', 'media.process', 'media.cleanup')
    and candidate.attempt_count < candidate.max_attempts
    and candidate.available_at <= now()
    and (
      candidate.state = 'queued'
      or (candidate.state = 'running' and candidate.lease_expires_at < now())
    )
  order by candidate.available_at, candidate.created_at
  for update skip locked
  limit 1;
  if claimed_id is null then return; end if;
  update public.media_assets asset
  set processing_state = case job.job_type
        when 'media.validate' then 'validating'
        when 'media.process' then 'processing'
        else asset.processing_state
      end,
      updated_at = now()
  from public.jobs job
  where job.id = claimed_id
    and asset.account_id = job.account_id
    and asset.id = job.media_asset_id
    and (
      (job.job_type = 'media.validate' and asset.processing_state = 'uploaded')
      or (job.job_type = 'media.process' and asset.processing_state = 'processing')
      or job.job_type = 'media.cleanup'
    );
  return query
    update public.jobs job
    set state = 'running', attempt_count = job.attempt_count + 1,
        lease_owner = p_worker_id,
        lease_expires_at = now() + make_interval(secs => p_lease_seconds),
        failure_code = null, updated_at = now()
    where job.id = claimed_id
    returning job.id, job.account_id, job.job_type, job.media_asset_id,
      job.payload, job.attempt_count, job.max_attempts;
end
$$;

create or replace function public.record_media_validation(
  p_job_id uuid,
  p_worker_id text,
  p_valid boolean,
  p_quarantine boolean,
  p_failure_code text,
  p_verified_mime_type text,
  p_byte_size bigint,
  p_width_px integer,
  p_height_px integer,
  p_content_hash bytea
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_asset_id uuid;
  resolved_account_id uuid;
  rendition_id uuid;
  kind_value text;
  next_state text;
begin
  select account_id, media_asset_id into resolved_account_id, resolved_asset_id
  from public.jobs
  where id = p_job_id and job_type = 'media.validate' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now()
  for update;
  if not found then raise exception 'media job lease unavailable' using errcode = '40001'; end if;

  if not p_valid then
    next_state := case when p_quarantine then 'quarantined' else 'failed' end;
    update public.media_assets
    set processing_state = next_state, failure_code = left(coalesce(p_failure_code, 'validation_failed'), 120),
        updated_at = now(), version = version + 1
    where account_id = resolved_account_id and id = resolved_asset_id
      and processing_state in ('uploaded', 'validating');
  else
    if p_verified_mime_type not in ('image/jpeg', 'image/png', 'image/webp')
      or p_byte_size <= 0 or p_byte_size > 16777216
      or p_width_px <= 0 or p_height_px <= 0
      or p_width_px > 12000 or p_height_px > 12000
      or p_width_px::bigint * p_height_px::bigint > 40000000
      or p_content_hash is null then
      raise exception 'invalid verified media metadata' using errcode = '22023';
    end if;
    update public.media_assets
    set processing_state = 'processing', verified_mime_type = p_verified_mime_type,
        byte_size = p_byte_size, width_px = p_width_px, height_px = p_height_px,
        content_hash = p_content_hash, failure_code = null,
        updated_at = now(), version = version + 1
    where account_id = resolved_account_id and id = resolved_asset_id
      and processing_state in ('uploaded', 'validating');
    if not found then raise exception 'media validation state conflict' using errcode = '40001'; end if;

    foreach kind_value in array array['thumbnail', 'medium', 'full'] loop
      rendition_id := gen_random_uuid();
      insert into public.media_renditions (
        id, account_id, media_asset_id, rendition_kind, processor_profile_version,
        storage_bucket, storage_object_key, state
      ) values (
        rendition_id, resolved_account_id, resolved_asset_id, kind_value, 'media-v1',
        'wardrobe-renditions',
        'accounts/' || resolved_account_id::text || '/assets/' || resolved_asset_id::text ||
          '/renditions/media-v1/' || kind_value || '/' || rendition_id::text || '.webp',
        'pending'
      );
    end loop;
    insert into public.jobs (
      account_id, job_type, deduplication_key, media_asset_id, payload, max_attempts
    ) values (
      resolved_account_id, 'media.process', 'process:' || resolved_asset_id::text || ':media-v1',
      resolved_asset_id, jsonb_build_object('profile', 'media-v1'), 5
    ) on conflict (account_id, job_type, deduplication_key) do nothing;
    next_state := 'processing';
  end if;

  update public.jobs
  set state = 'succeeded', lease_owner = null, lease_expires_at = null,
      checkpoint = jsonb_build_object('result', next_state), updated_at = now()
  where id = p_job_id;
  return next_state;
end
$$;

create or replace function public.record_media_processing(
  p_job_id uuid,
  p_worker_id text,
  p_renditions jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_asset_id uuid;
  resolved_account_id uuid;
  replacement_id uuid;
  entry jsonb;
  updated_count integer := 0;
  old_primary boolean;
  old_position integer;
begin
  if jsonb_typeof(p_renditions) <> 'array' or jsonb_array_length(p_renditions) <> 3 then
    raise exception 'invalid rendition result' using errcode = '22023';
  end if;
  select account_id, media_asset_id into resolved_account_id, resolved_asset_id
  from public.jobs
  where id = p_job_id and job_type = 'media.process' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now()
  for update;
  if not found then raise exception 'media job lease unavailable' using errcode = '40001'; end if;

  for entry in select value from jsonb_array_elements(p_renditions) loop
    update public.media_renditions rendition
    set state = 'ready', mime_type = 'image/webp',
        byte_size = (entry ->> 'byteSize')::bigint,
        width_px = (entry ->> 'width')::integer,
        height_px = (entry ->> 'height')::integer,
        failure_code = null, updated_at = now(), version = version + 1
    where rendition.account_id = resolved_account_id
      and rendition.media_asset_id = resolved_asset_id
      and rendition.rendition_kind = entry ->> 'kind'
      and rendition.storage_object_key = entry ->> 'objectKey'
      and rendition.state in ('pending', 'processing')
      and exists (
        select 1 from storage.objects object
        where object.bucket_id = rendition.storage_bucket
          and object.name = rendition.storage_object_key
      );
    if not found then raise exception 'rendition result mismatch' using errcode = '22023'; end if;
    updated_count := updated_count + 1;
  end loop;
  if updated_count <> 3 or (
    select count(*) from public.media_renditions
    where account_id = resolved_account_id and media_asset_id = resolved_asset_id and state = 'ready'
  ) <> 3 then
    raise exception 'incomplete rendition set' using errcode = '22023';
  end if;

  select replaces_asset_id into replacement_id
  from public.media_assets
  where account_id = resolved_account_id and id = resolved_asset_id
  for update;
  update public.media_assets
  set processing_state = 'ready', failure_code = null, updated_at = now(), version = version + 1
  where account_id = resolved_account_id and id = resolved_asset_id
    and processing_state = 'processing';
  if not found then raise exception 'media processing state conflict' using errcode = '40001'; end if;

  if replacement_id is not null then
    select is_primary, position into old_primary, old_position
    from public.media_bindings
    where account_id = resolved_account_id and media_asset_id = replacement_id
    order by created_at limit 1;
    delete from public.media_bindings
    where account_id = resolved_account_id and media_asset_id = replacement_id;
    update public.media_bindings
    set is_primary = coalesce(old_primary, false), position = coalesce(old_position, position)
    where account_id = resolved_account_id and media_asset_id = resolved_asset_id;
    update public.media_assets
    set processing_state = 'pending_delete', delete_after = now() + interval '1 hour',
        updated_at = now(), version = version + 1
    where account_id = resolved_account_id and id = replacement_id;
    update public.media_renditions
    set state = 'pending_delete', updated_at = now(), version = version + 1
    where account_id = resolved_account_id and media_asset_id = replacement_id;
    insert into public.jobs (
      account_id, job_type, deduplication_key, media_asset_id, payload
    ) values (
      resolved_account_id, 'media.cleanup', 'cleanup:' || replacement_id::text,
      replacement_id, '{}'::jsonb
    ) on conflict (account_id, job_type, deduplication_key) do nothing;
    update public.jobs
    set available_at = now() + interval '1 hour'
    where account_id = resolved_account_id and media_asset_id = replacement_id
      and job_type = 'media.cleanup' and state = 'queued';
  else
    update public.media_bindings binding
    set is_primary = true
    where binding.account_id = resolved_account_id
      and binding.media_asset_id = resolved_asset_id
      and binding.product_role = 'catalog'
      and not exists (
        select 1 from public.media_bindings other
        join public.media_assets asset
          on asset.account_id = other.account_id and asset.id = other.media_asset_id
        where other.account_id = resolved_account_id
          and other.clothing_item_id = binding.clothing_item_id
          and other.appearance_variant_id is not distinct from binding.appearance_variant_id
          and other.is_primary and asset.processing_state = 'ready'
      );
  end if;

  update public.jobs
  set state = 'succeeded', lease_owner = null, lease_expires_at = null,
      checkpoint = jsonb_build_object('renditions', 3), updated_at = now()
  where id = p_job_id;
  return 'ready';
end
$$;

create or replace function public.fail_media_job(
  p_job_id uuid,
  p_worker_id text,
  p_failure_code text,
  p_retry_delay_seconds integer default 30
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_asset_id uuid;
  attempts integer;
  maximum integer;
  next_job_state text;
begin
  select media_asset_id, attempt_count, max_attempts
  into resolved_asset_id, attempts, maximum
  from public.jobs
  where id = p_job_id and state = 'running' and lease_owner = p_worker_id
  for update;
  if not found then raise exception 'media job lease unavailable' using errcode = '40001'; end if;
  next_job_state := case when attempts < maximum then 'queued' else 'failed' end;
  update public.jobs
  set state = next_job_state,
      available_at = case when attempts < maximum
        then now() + make_interval(secs => greatest(1, least(p_retry_delay_seconds, 3600)))
        else available_at end,
      lease_owner = null, lease_expires_at = null,
      failure_code = left(coalesce(p_failure_code, 'worker_failed'), 120), updated_at = now()
  where id = p_job_id;
  if attempts >= maximum then
    update public.media_assets
    set processing_state = 'failed', failure_code = left(coalesce(p_failure_code, 'worker_failed'), 120),
        updated_at = now(), version = version + 1
    where id = resolved_asset_id and processing_state not in ('ready', 'pending_delete');
  end if;
  return next_job_state;
end
$$;

create or replace function public.set_media_gallery(
  p_account_id uuid,
  p_item_id uuid,
  p_expected_item_version bigint,
  p_binding_ids uuid[],
  p_primary_binding_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  binding_id_value uuid;
  binding_position integer := 0;
  resolved_version bigint;
begin
  if p_binding_ids is null or cardinality(p_binding_ids) = 0
    or cardinality(p_binding_ids) <> (select count(distinct value) from unnest(p_binding_ids) value)
    or p_primary_binding_id is null or not (p_primary_binding_id = any(p_binding_ids)) then
    raise exception 'invalid gallery order' using errcode = '22023';
  end if;
  if (select count(*) from public.media_bindings binding
      where binding.account_id = p_account_id and binding.clothing_item_id = p_item_id
        and binding.id = any(p_binding_ids)) <> cardinality(p_binding_ids)
    or (select count(*) from public.media_bindings binding
        where binding.account_id = p_account_id and binding.clothing_item_id = p_item_id) <> cardinality(p_binding_ids) then
    raise exception 'gallery binding unavailable' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.media_bindings binding
    join public.media_assets asset
      on asset.account_id = binding.account_id and asset.id = binding.media_asset_id
    where binding.account_id = p_account_id and binding.clothing_item_id = p_item_id
      and binding.id = p_primary_binding_id and asset.processing_state = 'ready'
  ) then
    raise exception 'gallery primary unavailable' using errcode = 'P0002';
  end if;
  update public.clothing_items
  set version = version + 1, updated_at = now()
  where account_id = p_account_id and id = p_item_id
    and lifecycle_state = 'active' and version = p_expected_item_version
  returning version into resolved_version;
  if not found then raise exception 'gallery conflict' using errcode = '40001'; end if;
  update public.media_bindings set is_primary = false
  where account_id = p_account_id and clothing_item_id = p_item_id;
  foreach binding_id_value in array p_binding_ids loop
    update public.media_bindings
    set position = binding_position,
        is_primary = binding_id_value = p_primary_binding_id
    where account_id = p_account_id and clothing_item_id = p_item_id and id = binding_id_value;
    binding_position := binding_position + 1;
  end loop;
  return resolved_version;
end
$$;

create or replace function public.remove_media_binding(
  p_account_id uuid,
  p_item_id uuid,
  p_binding_id uuid,
  p_expected_item_version bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_asset_id uuid;
  resolved_version bigint;
begin
  update public.clothing_items
  set version = version + 1, updated_at = now()
  where account_id = p_account_id and id = p_item_id
    and lifecycle_state = 'active' and version = p_expected_item_version
  returning version into resolved_version;
  if not found then raise exception 'gallery conflict' using errcode = '40001'; end if;
  delete from public.media_bindings
  where account_id = p_account_id and clothing_item_id = p_item_id and id = p_binding_id
  returning media_asset_id into resolved_asset_id;
  if not found then raise exception 'gallery binding unavailable' using errcode = 'P0002'; end if;
  if not exists (
    select 1 from public.media_bindings
    where account_id = p_account_id and media_asset_id = resolved_asset_id
  ) then
    update public.media_assets
    set processing_state = 'pending_delete', delete_after = now() + interval '1 hour',
        updated_at = now(), version = version + 1
    where account_id = p_account_id and id = resolved_asset_id;
    update public.media_renditions
    set state = 'pending_delete', updated_at = now(), version = version + 1
    where account_id = p_account_id and media_asset_id = resolved_asset_id;
    insert into public.jobs (
      account_id, job_type, deduplication_key, media_asset_id, payload
    ) values (
      p_account_id, 'media.cleanup', 'cleanup:' || resolved_asset_id::text,
      resolved_asset_id, '{}'::jsonb
    ) on conflict (account_id, job_type, deduplication_key) do nothing;
    update public.jobs
    set available_at = now() + interval '1 hour'
    where account_id = p_account_id and media_asset_id = resolved_asset_id
      and job_type = 'media.cleanup' and state = 'queued';
  end if;
  if not exists (
    select 1 from public.media_bindings
    where account_id = p_account_id and clothing_item_id = p_item_id and is_primary
  ) then
    update public.media_bindings binding
    set is_primary = true
    where binding.id = (
      select candidate.id
      from public.media_bindings candidate
      join public.media_assets asset
        on asset.account_id = candidate.account_id and asset.id = candidate.media_asset_id
      where candidate.account_id = p_account_id and candidate.clothing_item_id = p_item_id
        and candidate.product_role = 'catalog' and asset.processing_state = 'ready'
      order by candidate.position, candidate.created_at, candidate.id
      limit 1
    );
  end if;
  return resolved_version;
end
$$;

create or replace function public.finalize_media_cleanup(
  p_job_id uuid,
  p_worker_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_asset_id uuid;
  resolved_account_id uuid;
begin
  select account_id, media_asset_id into resolved_account_id, resolved_asset_id
  from public.jobs
  where id = p_job_id and job_type = 'media.cleanup' and state = 'running'
    and lease_owner = p_worker_id and lease_expires_at >= now()
  for update;
  if not found then raise exception 'media job lease unavailable' using errcode = '40001'; end if;
  if exists (select 1 from public.media_bindings where account_id = resolved_account_id and media_asset_id = resolved_asset_id)
    or exists (
      select 1 from storage.objects object
      where (object.bucket_id, object.name) in (
        select asset.storage_bucket, asset.storage_object_key
        from public.media_assets asset
        where asset.account_id = resolved_account_id and asset.id = resolved_asset_id
        union all
        select rendition.storage_bucket, rendition.storage_object_key
        from public.media_renditions rendition
        where rendition.account_id = resolved_account_id and rendition.media_asset_id = resolved_asset_id
      )
    ) then
    raise exception 'media cleanup is not reconciled' using errcode = '40001';
  end if;
  delete from public.jobs
  where account_id = resolved_account_id and media_asset_id = resolved_asset_id
    and job_type in ('media.validate', 'media.process', 'media.cleanup');
  delete from public.media_assets
  where account_id = resolved_account_id and id = resolved_asset_id
    and processing_state = 'pending_delete';
  return found;
end
$$;

revoke all on function public.create_media_upload_intent(
  uuid, uuid, uuid, uuid, text, text, bigint, text, text, uuid, text, bytea
) from public, anon, authenticated;
revoke all on function public.complete_media_upload(uuid, uuid, bigint, text, bytea)
  from public, anon, authenticated;
revoke all on function public.retry_media_asset(uuid, uuid, bigint)
  from public, anon, authenticated;
revoke all on function public.claim_media_job(text, integer)
  from public, anon, authenticated;
revoke all on function public.record_media_validation(
  uuid, text, boolean, boolean, text, text, bigint, integer, integer, bytea
) from public, anon, authenticated;
revoke all on function public.record_media_processing(uuid, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.fail_media_job(uuid, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.set_media_gallery(uuid, uuid, bigint, uuid[], uuid)
  from public, anon, authenticated;
revoke all on function public.remove_media_binding(uuid, uuid, uuid, bigint)
  from public, anon, authenticated;
revoke all on function public.finalize_media_cleanup(uuid, text)
  from public, anon, authenticated;

grant execute on function public.create_media_upload_intent(
  uuid, uuid, uuid, uuid, text, text, bigint, text, text, uuid, text, bytea
) to service_role;
grant execute on function public.complete_media_upload(uuid, uuid, bigint, text, bytea)
  to service_role;
grant execute on function public.retry_media_asset(uuid, uuid, bigint)
  to service_role;
grant execute on function public.claim_media_job(text, integer)
  to service_role;
grant execute on function public.record_media_validation(
  uuid, text, boolean, boolean, text, text, bigint, integer, integer, bytea
) to service_role;
grant execute on function public.record_media_processing(uuid, text, jsonb)
  to service_role;
grant execute on function public.fail_media_job(uuid, text, text, integer)
  to service_role;
grant execute on function public.set_media_gallery(uuid, uuid, bigint, uuid[], uuid)
  to service_role;
grant execute on function public.remove_media_binding(uuid, uuid, uuid, bigint)
  to service_role;
grant execute on function public.finalize_media_cleanup(uuid, text)
  to service_role;
