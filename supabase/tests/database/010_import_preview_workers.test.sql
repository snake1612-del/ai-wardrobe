begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select has_function('public', 'claim_import_prepare_job', array['text','integer'],
  'automatic Prepare claim exists');
select has_function('public', 'claim_media_preview_job', array['text','integer'],
  'automatic thumbnail claim exists');
select ok(
  (select prosecdef from pg_proc
   where oid = 'public.claim_import_prepare_job(text,integer)'::regprocedure),
  'Prepare claim is SECURITY DEFINER'
);
select ok(
  (select prosecdef from pg_proc
   where oid = 'public.claim_media_preview_job(text,integer)'::regprocedure),
  'thumbnail claim is SECURITY DEFINER'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc
   where oid = 'public.claim_import_prepare_job(text,integer)'::regprocedure),
  'Prepare claim has empty search_path'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc
   where oid = 'public.claim_media_preview_job(text,integer)'::regprocedure),
  'thumbnail claim has empty search_path'
);
select ok(
  not has_function_privilege('authenticated',
    'public.claim_import_prepare_job(text,integer)', 'EXECUTE'),
  'browser cannot claim Prepare jobs'
);
select ok(
  not has_function_privilege('authenticated',
    'public.claim_media_preview_job(text,integer)', 'EXECUTE'),
  'browser cannot claim thumbnail jobs'
);
select ok(
  has_function_privilege('service_role',
    'public.claim_import_prepare_job(text,integer)', 'EXECUTE'),
  'service role can claim Prepare jobs'
);
select ok(
  has_function_privilege('service_role',
    'public.claim_media_preview_job(text,integer)', 'EXECUTE'),
  'service role can claim thumbnail jobs'
);
select ok(
  (select pg_get_functiondef('public.claim_import_prepare_job(text,integer)'::regprocedure))
    like '%candidate.job_type = ''import.parse''%',
  'automatic import claim excludes Confirm and cleanup'
);
select ok(
  (select pg_get_functiondef('public.claim_media_preview_job(text,integer)'::regprocedure))
    like '%candidate.job_type in (''media.validate'', ''media.process'')%',
  'automatic media claim excludes cleanup'
);

select * from finish();
rollback;
