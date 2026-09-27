-- A failed Prepare can be retried by its owner without re-upload or domain writes.
-- Each explicit retry grants exactly one further attempt, capped at eight total.
create or replace function public.retry_import_prepare(
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
  resolved_session public.import_sessions%rowtype;
  resolved_job public.jobs%rowtype;
  resolved_version bigint;
begin
  select session.* into resolved_session
  from public.import_sessions session
  join public.accounts account on account.id = session.account_id
  where session.account_id = p_account_id
    and session.id = p_session_id
    and session.version = p_expected_version
    and session.state = 'failed'
    and session.confirmed_revision is null
    and session.expires_at > now()
    and account.state = 'active'
  for update of session;
  if not found then
    raise exception 'import prepare retry conflict' using errcode = '40001';
  end if;

  if exists (
    select 1 from public.import_records
    where account_id = p_account_id and import_session_id = p_session_id
  ) then
    raise exception 'import prepare retry unavailable' using errcode = '40001';
  end if;

  select job.* into resolved_job
  from public.jobs job
  where job.account_id = p_account_id
    and job.import_session_id = p_session_id
    and job.job_type = 'import.parse'
  for update;
  if not found
    or resolved_job.state <> 'failed'
    or resolved_job.lease_owner is not null
    or resolved_job.lease_expires_at is not null
    or resolved_job.attempt_count <> resolved_job.max_attempts
    or resolved_job.max_attempts >= 8
    or resolved_job.failure_code is distinct from resolved_session.failure_code
    or resolved_job.failure_code is null
    or resolved_job.failure_code not in (
      'import_archive_download_failed',
      'import_original_upload_failed',
      'import_original_download_failed',
      'import_parts_unavailable',
      'import_prepare_lease_lost',
      'import_worker_failed'
    ) then
    raise exception 'import prepare retry unavailable' using errcode = '40001';
  end if;

  if not exists (
    select 1 from public.import_archive_parts
    where account_id = p_account_id and import_session_id = p_session_id
  ) or exists (
    select 1 from public.import_archive_parts
    where account_id = p_account_id and import_session_id = p_session_id
      and (state not in ('uploaded', 'prepared') or observed_byte_size is null)
  ) then
    raise exception 'staged import parts unavailable' using errcode = '40001';
  end if;

  update public.jobs
  set state = 'queued', max_attempts = max_attempts + 1,
      available_at = now(), failure_code = null, updated_at = now()
  where id = resolved_job.id;

  update public.import_sessions
  set state = 'uploaded', failure_code = null,
      version = version + 1, updated_at = now()
  where id = p_session_id
  returning version into resolved_version;

  return jsonb_build_object(
    'session_id', p_session_id, 'state', 'uploaded',
    'version', resolved_version
  );
end
$$;

revoke all on function public.retry_import_prepare(uuid, uuid, bigint)
  from public, anon, authenticated;
grant execute on function public.retry_import_prepare(uuid, uuid, bigint)
  to service_role;
