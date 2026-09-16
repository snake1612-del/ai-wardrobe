begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000121', 'user-a-rls@example.invalid'),
  ('00000000-0000-0000-0000-000000000122', 'user-b-rls@example.invalid');
insert into public.accounts (id, auth_user_id) values
  ('00000000-0000-0000-0000-000000000221', '00000000-0000-0000-0000-000000000121'),
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000122');
insert into public.clothing_items (id, account_id, record_state, display_name) values
  ('00000000-0000-0000-0000-000000000321', '00000000-0000-0000-0000-000000000221', 'committed', 'User A private item'),
  ('00000000-0000-0000-0000-000000000322', '00000000-0000-0000-0000-000000000222', 'committed', 'User B private item');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000121","role":"authenticated"}', true);

select is((select count(*)::integer from public.accounts), 1, 'User A sees only own account');
select is((select count(*)::integer from public.clothing_items), 1, 'User A sees only own item');
select is((select count(*)::integer from public.clothing_items where id = '00000000-0000-0000-0000-000000000321'), 1, 'User A sees own known item ID');
select is((select count(*)::integer from public.clothing_items where id = '00000000-0000-0000-0000-000000000322'), 0, 'User A cannot read User B known item ID');
select is((select count(*)::integer from public.clothing_items where search_document @@ plainto_tsquery('simple', 'User B')), 0, 'User A search cannot discover User B item');

reset role;

select ok(has_table_privilege('authenticated', 'public.clothing_items', 'SELECT'), 'authenticated has narrow item read grant');
select ok(not has_table_privilege('authenticated', 'public.clothing_items', 'INSERT'), 'authenticated has no direct item insert grant');
select ok(not has_table_privilege('authenticated', 'public.clothing_items', 'UPDATE'), 'authenticated has no direct item update grant');
select ok(not has_table_privilege('authenticated', 'public.clothing_items', 'DELETE'), 'authenticated has no direct item delete grant');
select ok(not has_table_privilege('authenticated', 'public.outfit_items', 'INSERT'), 'authenticated cannot directly mutate outfit composition');
select ok(not has_table_privilege('authenticated', 'public.wear_events', 'INSERT'), 'authenticated cannot directly create wear events');
select ok(not has_table_privilege('authenticated', 'public.external_item_identities', 'SELECT'), 'external identities are behind the application boundary');
select ok(not has_table_privilege('authenticated', 'public.export_requests', 'SELECT'), 'export requests stay behind the application boundary');
select ok(not has_table_privilege('authenticated', 'public.account_deletion_requests', 'SELECT'), 'deletion requests stay behind the application boundary');
select ok(not has_table_privilege('authenticated', 'public.jobs', 'SELECT'), 'operational jobs stay behind the application boundary');
select ok(not has_table_privilege('anon', 'public.clothing_items', 'SELECT'), 'anonymous has no wardrobe read grant');

select * from finish();
rollback;
