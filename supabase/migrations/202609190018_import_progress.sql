-- One bounded owner-scoped read replaces long browser/server IN lists for large ZIPs.
create or replace function public.get_import_progress(
  p_account_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  resolved_session public.import_sessions%rowtype;
  resolved_job public.jobs%rowtype;
  resolved_parts integer;
  resolved_uploaded integer;
  resolved_assets integer;
  resolved_ready integer;
  resolved_failed integer;
  resolved_failure text;
begin
  select * into resolved_session from public.import_sessions
  where account_id = p_account_id and id = p_session_id;
  if not found then return null; end if;

  select * into resolved_job from public.jobs
  where account_id = p_account_id and import_session_id = p_session_id
    and job_type = 'import.parse'
  order by created_at desc limit 1;

  select count(*)::integer,
    count(*) filter (where state in ('uploaded', 'prepared'))::integer
  into resolved_parts, resolved_uploaded
  from public.import_archive_parts
  where account_id = p_account_id and import_session_id = p_session_id;

  select count(*)::integer,
    count(*) filter (
      where asset.processing_state = 'ready' and exists (
        select 1 from public.media_renditions rendition
        where rendition.account_id = p_account_id
          and rendition.media_asset_id = asset.id
          and rendition.rendition_kind = 'thumbnail'
          and rendition.state = 'ready'
      )
    )::integer,
    count(*) filter (where asset.processing_state in ('failed', 'quarantined'))::integer
  into resolved_assets, resolved_ready, resolved_failed
  from public.import_asset_links link
  join public.media_assets asset
    on asset.account_id = link.account_id and asset.id = link.media_asset_id
  where link.account_id = p_account_id
    and link.import_session_id = p_session_id;

  resolved_failure := case
    when resolved_session.failure_code in (
      'import_archive_download_failed', 'import_original_upload_failed',
      'import_original_download_failed', 'import_parts_unavailable',
      'import_prepare_lease_lost', 'import_worker_failed'
    ) then resolved_session.failure_code
    when resolved_session.failure_code is not null then 'import_prepare_failed'
    else null
  end;

  return jsonb_build_object(
    'state', resolved_session.state,
    'version', resolved_session.version,
    'failureCode', resolved_failure,
    'jobState', resolved_job.state,
    'jobUpdatedAt', resolved_job.updated_at,
    'canRetryPrepare', coalesce((
      resolved_session.state = 'failed'
      and resolved_session.confirmed_revision is null
      and resolved_session.expires_at > now()
      and resolved_job.state = 'failed'
      and resolved_job.lease_owner is null
      and resolved_job.lease_expires_at is null
      and resolved_job.attempt_count = resolved_job.max_attempts
      and resolved_job.max_attempts < 8
      and resolved_job.failure_code = resolved_session.failure_code
      and resolved_failure <> 'import_prepare_failed'
      and resolved_failure is not null
      and resolved_parts > 0 and resolved_uploaded = resolved_parts
      and not exists (
        select 1 from public.import_records
        where account_id = p_account_id and import_session_id = p_session_id
      )
    ), false),
    'uploadedParts', resolved_uploaded,
    'totalParts', resolved_parts,
    'totalAssets', resolved_assets,
    'readyAssets', resolved_ready,
    'failedAssets', resolved_failed
  );
end
$$;

revoke all on function public.get_import_progress(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_import_progress(uuid, uuid) to service_role;

-- Preview workers do not process imports that owners already cancelled.
create or replace function public.claim_media_preview_job(
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
  if nullif(btrim(p_worker_id), '') is null
    or p_lease_seconds < 15 or p_lease_seconds > 900 then
    raise exception 'invalid worker lease' using errcode = '22023';
  end if;
  select candidate.id into claimed_id
  from public.jobs candidate
  join public.accounts owner_account on owner_account.id = candidate.account_id
  where candidate.job_type in ('media.validate', 'media.process')
    and candidate.attempt_count < candidate.max_attempts
    and candidate.available_at <= now()
    and owner_account.state = 'active'
    and (candidate.state = 'queued'
      or (candidate.state = 'running' and candidate.lease_expires_at < now()))
    and not exists (
      select 1
      from public.import_asset_links link
      join public.import_sessions session
        on session.account_id = link.account_id
        and session.id = link.import_session_id
      where link.account_id = candidate.account_id
        and link.media_asset_id = candidate.media_asset_id
        and session.state in ('cancelled', 'cleaning', 'failed')
    )
  order by candidate.available_at, candidate.created_at, candidate.id
  for update of candidate skip locked
  limit 1;
  if claimed_id is null then return; end if;

  update public.media_assets asset
  set processing_state = case job.job_type
        when 'media.validate' then 'validating'
        else 'processing'
      end,
      updated_at = now()
  from public.jobs job
  where job.id = claimed_id
    and asset.account_id = job.account_id
    and asset.id = job.media_asset_id
    and (
      (job.job_type = 'media.validate' and asset.processing_state = 'uploaded')
      or (job.job_type = 'media.process' and asset.processing_state = 'processing')
    );
  if not found then
    raise exception 'media job asset unavailable' using errcode = '40001';
  end if;

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

revoke all on function public.claim_media_preview_job(text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_media_preview_job(text, integer)
  to service_role;
