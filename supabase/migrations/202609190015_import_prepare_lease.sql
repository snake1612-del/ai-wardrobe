-- A running Prepare may outlive its initial lease while Storage retries.
-- Only the current worker can renew a live parse lease for an active account/session.
create or replace function public.renew_import_prepare_lease(
  p_worker_id text,
  p_job_id uuid,
  p_lease_seconds integer default 300
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_job_id uuid;
begin
  if nullif(btrim(p_worker_id), '') is null
    or p_lease_seconds < 120 or p_lease_seconds > 900 then
    raise exception 'invalid import prepare lease' using errcode = '22023';
  end if;

  select job.id into resolved_job_id
  from public.jobs job
  join public.import_sessions session
    on session.id = job.import_session_id
    and session.account_id = job.account_id
  join public.accounts owner_account
    on owner_account.id = job.account_id
  where job.id = p_job_id
    and job.job_type = 'import.parse'
    and job.state = 'running'
    and job.lease_owner = p_worker_id
    and job.lease_expires_at > now()
    and session.state = 'parsing'
    and session.expires_at > now()
    and session.confirmed_revision is null
    and owner_account.state = 'active'
  for update of job, session, owner_account;

  if resolved_job_id is null then
    return false;
  end if;

  update public.jobs
  set lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      updated_at = now()
  where id = resolved_job_id;
  return true;
end
$$;

revoke all on function public.renew_import_prepare_lease(text, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.renew_import_prepare_lease(text, uuid, integer)
  to service_role;
