-- Automatic development workers prepare private Review data only.
-- They never claim import.commit, import.cleanup or media.cleanup.
create or replace function public.claim_import_prepare_job(
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns table (
  job_id uuid, account_id uuid, import_session_id uuid,
  job_type text, payload jsonb, attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_id uuid;
  resolved_account_id uuid;
  resolved_session_id uuid;
  resolved_updated integer;
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
  join public.accounts owner_account on owner_account.id = candidate.account_id
  where candidate.job_type = 'import.parse'
    and candidate.available_at <= now()
    and candidate.attempt_count < candidate.max_attempts
    and (candidate.state = 'queued'
      or (candidate.state = 'running' and candidate.lease_expires_at < now()))
    and owner_account.state = 'active'
    and session.state in ('uploaded', 'failed', 'parsing')
    and session.expires_at > now()
  order by candidate.available_at, candidate.created_at, candidate.id
  for update of candidate skip locked
  limit 1;
  if candidate_id is null then return; end if;

  update public.jobs
  set state = 'running', lease_owner = p_worker_id,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      attempt_count = public.jobs.attempt_count + 1, updated_at = now()
  where id = candidate_id
  returning id, public.jobs.account_id, public.jobs.import_session_id,
    public.jobs.job_type, public.jobs.payload, public.jobs.attempt_count
  into job_id, resolved_account_id, resolved_session_id,
    job_type, payload, attempt_count;

  update public.import_sessions
  set state = 'parsing', updated_at = now()
  where id = resolved_session_id
    and public.import_sessions.account_id = resolved_account_id
    and public.import_sessions.state in ('uploaded', 'failed', 'parsing')
    and public.import_sessions.expires_at > now();
  get diagnostics resolved_updated = row_count;
  if resolved_updated <> 1 then
    raise exception 'import session lease unavailable' using errcode = '40001';
  end if;

  account_id := resolved_account_id;
  import_session_id := resolved_session_id;
  return next;
end
$$;

revoke all on function public.claim_import_prepare_job(text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_import_prepare_job(text, integer)
  to service_role;

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
