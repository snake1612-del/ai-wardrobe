begin;

create extension if not exists pgtap with schema extensions;
select plan(39);

select has_function(
  'public',
  'save_wardrobe_item',
  array[
    'uuid','uuid','bigint','text','text','text','uuid','text','text','text',
    'text','text','text','uuid[]','uuid[]','text[]','text[]','text[]','text[]'
  ],
  'atomic wardrobe save capability exists'
);
select has_function(
  'public',
  'set_wardrobe_item_state',
  array['uuid','uuid','bigint','text'],
  'wardrobe state capability exists'
);
select has_function(
  'public',
  'search_wardrobe_item_ids',
  array['text','uuid','uuid','uuid','uuid','boolean','text','integer'],
  'bounded wardrobe search function exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.search_wardrobe_item_ids(text,uuid,uuid,uuid,uuid,boolean,text,integer)',
    'EXECUTE'
  ),
  'authenticated user context can execute bounded search'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.search_wardrobe_item_ids(text,uuid,uuid,uuid,uuid,boolean,text,integer)',
    'EXECUTE'
  ),
  'anonymous cannot execute wardrobe search'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.save_wardrobe_item(uuid,uuid,bigint,text,text,text,uuid,text,text,text,text,text,text,uuid[],uuid[],text[],text[],text[],text[])',
    'EXECUTE'
  ),
  'service role can execute save capability'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.save_wardrobe_item(uuid,uuid,bigint,text,text,text,uuid,text,text,text,text,text,text,uuid[],uuid[],text[],text[],text[],text[])',
    'EXECUTE'
  ),
  'authenticated cannot execute save capability'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.set_wardrobe_item_state(uuid,uuid,bigint,text)',
    'EXECUTE'
  ),
  'anonymous cannot execute state capability'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000141', 'wardrobe-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000142', 'wardrobe-b@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000000241', '00000000-0000-0000-0000-000000000141'),
  ('00000000-0000-0000-0000-000000000242', '00000000-0000-0000-0000-000000000142');

create temporary table saved_item as
select * from public.save_wardrobe_item(
  '00000000-0000-0000-0000-000000000241',
  '00000000-0000-0000-0000-000000000341', 0, 'committed',
  'Blue reversible coat', 'coat-1', (select id from public.categories where code = 'outerwear'),
  'Example', 'Two sided coat', 'private note', 'plain', 'wool', 'M',
  array[(select id from public.colors where code = 'blue')],
  array[(select id from public.seasons where code = 'winter')],
  array['Work'], array['Classic'], array['Travel'],
  array['Blue side', 'Pattern side']
);

select lives_ok(
  $$select * from public.save_wardrobe_item(
    '00000000-0000-0000-0000-000000000241',
    '00000000-0000-0000-0000-000000000341', 0, 'committed',
    'Tampered retry', 'different-code',
    null,
    '', '', '', '', '', '',
    '{}'::uuid[],
    '{}'::uuid[],
    '{}'::text[], '{}'::text[], '{}'::text[],
    '{}'::text[]
  )$$,
  'retry with the same server item ID reconciles without rewriting the aggregate'
);
select is(
  (select count(*)::integer from public.clothing_items where id = '00000000-0000-0000-0000-000000000341'),
  1,
  'idempotent create retry does not duplicate the physical item'
);

select is((select count(*)::integer from saved_item), 1, 'create returns one stable item');
select is(
  (select display_name from public.clothing_items where id = (select item_id from saved_item)),
  'Blue reversible coat',
  'committed item is persisted'
);
select is(
  (select observation_started_on from public.clothing_items where id = (select item_id from saved_item)),
  current_date,
  'observation start is known while past wear remains unknown'
);
select is(
  (select count(*)::integer from public.clothing_item_colors where clothing_item_id = (select item_id from saved_item)),
  1,
  'color relation is saved'
);
select is(
  (select count(*)::integer from public.clothing_item_seasons where clothing_item_id = (select item_id from saved_item)),
  1,
  'season relation is saved'
);
select is(
  (select count(*)::integer from public.clothing_item_tags where clothing_item_id = (select item_id from saved_item)),
  3,
  'purpose, style and custom tags are saved'
);
select is(
  (select count(*)::integer from public.appearance_variants where clothing_item_id = (select item_id from saved_item) and archived_at is null),
  2,
  'sparse appearance variants remain one physical item'
);
select is(
  (select count(*)::integer from public.appearance_variants where clothing_item_id = (select item_id from saved_item) and is_default),
  1,
  'exactly one submitted variant is default'
);

create temporary table updated_item as
select * from public.save_wardrobe_item(
  '00000000-0000-0000-0000-000000000241',
  (select item_id from saved_item), (select item_version from saved_item), 'committed',
  'Blue coat updated', 'coat-1', (select id from public.categories where code = 'outerwear'),
  'Example', 'Updated', '', 'plain', 'wool', 'M',
  array[(select id from public.colors where code = 'blue')],
  array[(select id from public.seasons where code = 'winter')],
  array['Work'], array['Classic'], array['Travel'],
  array['Blue side']
);
select is(
  (select item_version from updated_item),
  (select item_version + 1 from saved_item),
  'successful edit increments optimistic version once'
);
select is(
  (select count(*)::integer from public.appearance_variants where clothing_item_id = (select item_id from saved_item) and archived_at is null),
  1,
  'omitted variant is archived rather than deleted'
);
select is(
  (select count(*)::integer from public.appearance_variants where clothing_item_id = (select item_id from saved_item)),
  2,
  'variant historical identity is retained'
);

select throws_ok(
  format(
    $$select * from public.save_wardrobe_item(
      %L, %L, %s, 'committed', 'Stale', '', null, '', '', '', '', '', '',
      '{}'::uuid[], '{}'::uuid[], '{}'::text[], '{}'::text[], '{}'::text[], '{}'::text[]
    )$$,
    '00000000-0000-0000-0000-000000000241',
    (select item_id from saved_item),
    (select item_version from saved_item)
  ),
  '40001',
  null,
  'stale write is rejected'
);
select throws_ok(
  format(
    $$select * from public.set_wardrobe_item_state(%L, %L, %s, 'archive')$$,
    '00000000-0000-0000-0000-000000000242',
    (select item_id from saved_item),
    (select item_version from updated_item)
  ),
  'P0002',
  null,
  'known foreign item ID cannot be mutated'
);

create temporary table favorite_result as
select * from public.set_wardrobe_item_state(
  '00000000-0000-0000-0000-000000000241',
  (select item_id from saved_item),
  (select item_version from updated_item),
  'favorite'
);
select ok((select is_favorite from favorite_result), 'favorite is set');
create temporary table archive_result as
select * from public.set_wardrobe_item_state(
  '00000000-0000-0000-0000-000000000241',
  (select item_id from saved_item),
  (select item_version from favorite_result),
  'archive'
);
select is((select lifecycle_state from archive_result), 'archived', 'archive changes lifecycle');
select isnt(
  (select archived_at from public.clothing_items where id = (select item_id from saved_item)),
  null::timestamptz,
  'archive records its timestamp'
);
create temporary table restore_result as
select * from public.set_wardrobe_item_state(
  '00000000-0000-0000-0000-000000000241',
  (select item_id from saved_item),
  (select item_version from archive_result),
  'restore'
);
select is((select lifecycle_state from restore_result), 'active', 'restore returns the same item');
select is(
  (select count(*)::integer from public.clothing_items where id = (select item_id from saved_item)),
  1,
  'restore does not create a duplicate'
);
select is(
  (select count(*)::integer from public.audit_events where target_id = (select item_id from saved_item)),
  2,
  'archive and restore create narrow audit events'
);

select set_config('test.item_id', (select item_id::text from saved_item), true);
select set_config('test.item_version', (select item_version::text from restore_result), true);
insert into public.clothing_items (
  account_id, record_state, lifecycle_state, display_name, reference_code
)
select
  '00000000-0000-0000-0000-000000000241',
  'committed',
  'active',
  'Bulk filtered item ' || generated,
  'bulk-filter-' || generated
from generate_series(1, 1005) generated;

insert into public.clothing_item_colors (
  account_id, clothing_item_id, color_id, position
)
select
  item.account_id,
  item.id,
  (select id from public.colors where code = 'blue'),
  0
from public.clothing_items item
where item.account_id = '00000000-0000-0000-0000-000000000241'
  and item.reference_code like 'bulk-filter-%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000141","role":"authenticated"}',
  true
);
select is(
  (
    select count(*)
    from public.search_wardrobe_item_ids(
      null,
      null,
      (select id from public.colors where code = 'blue'),
      null,
      null,
      null,
      'active',
      961
    )
  ),
  961::bigint,
  'bounded relational search crosses the Data API 1000-row ceiling without truncation'
);

reset role;
update public.accounts
set state = 'restricted'
where id = '00000000-0000-0000-0000-000000000241';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000141","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.clothing_items where id = current_setting('test.item_id')::uuid),
  0,
  'restricted account cannot read its Wardrobe rows through RLS'
);

reset role;
update public.accounts
set state = 'deleting'
where id = '00000000-0000-0000-0000-000000000241';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000141","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.clothing_items where id = current_setting('test.item_id')::uuid),
  0,
  'deleting account cannot read its Wardrobe rows through RLS'
);

reset role;
update public.accounts
set state = 'active'
where id = '00000000-0000-0000-0000-000000000241';


set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000142","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.clothing_items where id = current_setting('test.item_id')::uuid),
  0,
  'User B cannot read User A item by known ID'
);
select throws_ok(
  format(
    $$select * from public.set_wardrobe_item_state(%L, %L, %s, 'archive')$$,
    '00000000-0000-0000-0000-000000000242',
    current_setting('test.item_id'),
    current_setting('test.item_version')
  ),
  '42501',
  null,
  'authenticated role cannot invoke privileged state transition'
);

reset role;
select lives_ok(
  $$select * from public.save_wardrobe_item(
    '00000000-0000-0000-0000-000000000241',
    '00000000-0000-0000-0000-000000000342', 0, 'draft',
    '', '', null, '', '', '', '', '', '', '{}'::uuid[], '{}'::uuid[],
    '{}'::text[], '{}'::text[], '{}'::text[], '{}'::text[]
  )$$,
  'incomplete draft is allowed'
);
select throws_ok(
  $$select * from public.set_wardrobe_item_state(
    '00000000-0000-0000-0000-000000000241',
    '00000000-0000-0000-0000-000000000342',
    1,
    'archive'
  )$$,
  '23514',
  null,
  'draft archive is rejected by the state capability'
);
select throws_ok(
  $$select * from public.save_wardrobe_item(
    '00000000-0000-0000-0000-000000000241',
    '00000000-0000-0000-0000-000000000343', 0, 'committed',
    '', '', null, '', '', '', '', '', '', '{}'::uuid[], '{}'::uuid[],
    '{}'::text[], '{}'::text[], '{}'::text[], '{}'::text[]
  )$$,
  '23514',
  null,
  'empty committed item is rejected'
);

select throws_ok(
  $$select * from public.save_wardrobe_item(
    '00000000-0000-0000-0000-000000000241',
    '00000000-0000-0000-0000-000000000344', 0, 'committed',
    'Invalid category', '', '00000000-0000-0000-0000-000000000444',
    '', '', '', '', '', '', '{}'::uuid[], '{}'::uuid[],
    '{}'::text[], '{}'::text[], '{}'::text[], '{}'::text[]
  )$$,
  '23503',
  null,
  'unknown category is rejected by the server capability'
);
select throws_ok(
  $$select * from public.save_wardrobe_item(
    '00000000-0000-0000-0000-000000000241',
    '00000000-0000-0000-0000-000000000345', 0, 'committed',
    'Invalid color', '', null,
    '', '', '', '', '', '',
    array['00000000-0000-0000-0000-000000000445'::uuid], '{}'::uuid[],
    '{}'::text[], '{}'::text[], '{}'::text[], '{}'::text[]
  )$$,
  '23503',
  null,
  'unknown controlled color is rejected by the server capability'
);

select * from finish();
rollback;
