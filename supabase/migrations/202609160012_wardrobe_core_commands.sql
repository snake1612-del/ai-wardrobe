create or replace function private.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.accounts
  where auth_user_id = (select auth.uid())
    and state = 'active'
$$;

revoke all on function private.current_account_id() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_account_id() to authenticated;

create or replace function public.save_wardrobe_item(
  p_account_id uuid,
  p_item_id uuid,
  p_expected_version bigint,
  p_record_state text,
  p_display_name text,
  p_reference_code text,
  p_category_id uuid,
  p_brand text,
  p_description text,
  p_notes text,
  p_pattern text,
  p_material text,
  p_size_label text,
  p_color_ids uuid[],
  p_season_ids uuid[],
  p_purpose_labels text[],
  p_style_labels text[],
  p_custom_labels text[],
  p_variant_labels text[]
)
returns table (item_id uuid, item_version bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_item_id uuid := p_item_id;
  resolved_version bigint;
  label_value text;
  tag_kind text;
  tag_id_value uuid;
  label_position integer;
begin
  if p_account_id is null or p_item_id is null or p_expected_version is null then
    raise exception 'account, item and version are required' using errcode = '22004';
  end if;
  if p_expected_version < 0 then
    raise exception 'invalid expected version' using errcode = '22023';
  end if;
  if p_record_state not in ('draft', 'committed') then
    raise exception 'invalid record state' using errcode = '22023';
  end if;
  if p_record_state = 'committed' and nullif(btrim(p_display_name), '') is null then
    raise exception 'display name is required' using errcode = '23514';
  end if;
  if p_category_id is not null
    and p_category_id <> '00000000-0000-0000-0000-000000000000'::uuid
    and not exists (
      select 1 from public.categories where id = p_category_id and is_active
  ) then
    raise exception 'invalid category' using errcode = '23503';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_color_ids, '{}'::uuid[])) requested(id)
    where not exists (
      select 1 from public.colors where colors.id = requested.id and colors.is_active
    )
  ) then
    raise exception 'invalid color' using errcode = '23503';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_season_ids, '{}'::uuid[])) requested(id)
    where not exists (
      select 1 from public.seasons where seasons.id = requested.id and seasons.is_active
    )
  ) then
    raise exception 'invalid season' using errcode = '23503';
  end if;

  if p_expected_version = 0 then
    insert into public.clothing_items (
      id, account_id, record_state, lifecycle_state, display_name, reference_code,
      category_id, brand, description, notes, pattern, material, size_label,
      observation_started_on
    ) values (
      resolved_item_id, p_account_id, p_record_state, 'active',
      nullif(btrim(p_display_name), ''), nullif(btrim(p_reference_code), ''),
      nullif(p_category_id, '00000000-0000-0000-0000-000000000000'::uuid),
      nullif(btrim(p_brand), ''), nullif(btrim(p_description), ''),
      nullif(btrim(p_notes), ''), nullif(btrim(p_pattern), ''),
      nullif(btrim(p_material), ''), nullif(btrim(p_size_label), ''), current_date
    )
    on conflict (id) do nothing
    returning version into resolved_version;
    if not found then
      select version into resolved_version
      from public.clothing_items
      where id = p_item_id and account_id = p_account_id and version = 1;
      if not found then
        raise exception 'item create conflict or ownership mismatch' using errcode = '40001';
      end if;
      return query select resolved_item_id, resolved_version;
      return;
    end if;
  else
    update public.clothing_items
    set record_state = p_record_state,
        display_name = nullif(btrim(p_display_name), ''),
        reference_code = nullif(btrim(p_reference_code), ''),
        category_id = nullif(p_category_id, '00000000-0000-0000-0000-000000000000'::uuid),
        brand = nullif(btrim(p_brand), ''),
        description = nullif(btrim(p_description), ''),
        notes = nullif(btrim(p_notes), ''),
        pattern = nullif(btrim(p_pattern), ''),
        material = nullif(btrim(p_material), ''),
        size_label = nullif(btrim(p_size_label), ''),
        updated_at = now(),
        version = version + 1
    where id = p_item_id
      and account_id = p_account_id
      and lifecycle_state = 'active'
      and version = p_expected_version
    returning version into resolved_version;
    if not found then
      if exists (select 1 from public.clothing_items where id = p_item_id and account_id = p_account_id) then
        raise exception 'item conflict or ownership mismatch' using errcode = '40001';
      end if;
      raise exception 'item not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.clothing_item_colors
  where account_id = p_account_id and clothing_item_id = resolved_item_id;
  insert into public.clothing_item_colors (account_id, clothing_item_id, color_id, position)
  select p_account_id, resolved_item_id, requested.id, min(requested.ordinality)::smallint - 1
  from unnest(coalesce(p_color_ids, '{}'::uuid[])) with ordinality requested(id, ordinality)
  group by requested.id;

  delete from public.clothing_item_seasons
  where account_id = p_account_id and clothing_item_id = resolved_item_id;
  insert into public.clothing_item_seasons (account_id, clothing_item_id, season_id)
  select distinct p_account_id, resolved_item_id, requested.id
  from unnest(coalesce(p_season_ids, '{}'::uuid[])) requested(id);

  delete from public.clothing_item_tags
  where account_id = p_account_id and clothing_item_id = resolved_item_id;
  foreach tag_kind in array array['purpose', 'style', 'custom'] loop
    for label_value in
      select distinct btrim(value)
      from unnest(
        case tag_kind
          when 'purpose' then coalesce(p_purpose_labels, '{}'::text[])
          when 'style' then coalesce(p_style_labels, '{}'::text[])
          else coalesce(p_custom_labels, '{}'::text[])
        end
      ) value
      where nullif(btrim(value), '') is not null
    loop
      insert into public.tags (account_id, kind, label, normalized_label)
      values (p_account_id, tag_kind, label_value, lower(label_value))
      on conflict (account_id, kind, normalized_label) where archived_at is null
      do update set label = excluded.label, updated_at = now()
      returning id into tag_id_value;
      insert into public.clothing_item_tags (account_id, clothing_item_id, tag_id)
      values (p_account_id, resolved_item_id, tag_id_value)
      on conflict do nothing;
    end loop;
  end loop;

  update public.appearance_variants
  set is_default = false,
      archived_at = case
        when lower(btrim(label)) = any (
          select lower(btrim(value))
          from unnest(coalesce(p_variant_labels, '{}'::text[])) value
          where nullif(btrim(value), '') is not null
        ) then null
        else now()
      end,
      updated_at = now()
  where account_id = p_account_id
    and clothing_item_id = resolved_item_id
    and archived_at is null;

  label_position := 0;
  for label_value in
    select btrim(value)
    from unnest(coalesce(p_variant_labels, '{}'::text[])) with ordinality submitted(value, ordinality)
    where nullif(btrim(value), '') is not null
    group by lower(btrim(value)), btrim(value), ordinality
    order by ordinality
  loop
    update public.appearance_variants
    set label = label_value, position = label_position, archived_at = null, updated_at = now()
    where id = (
      select id from public.appearance_variants
      where account_id = p_account_id
        and clothing_item_id = resolved_item_id
        and lower(btrim(label)) = lower(label_value)
      order by archived_at nulls first, created_at
      limit 1
    );
    if not found then
      insert into public.appearance_variants (
        account_id, clothing_item_id, label, is_default, position
      ) values (p_account_id, resolved_item_id, label_value, false, label_position);
    end if;
    label_position := label_position + 1;
  end loop;

  update public.appearance_variants
  set is_default = true, updated_at = now()
  where id = (
    select id from public.appearance_variants
    where account_id = p_account_id
      and clothing_item_id = resolved_item_id
      and archived_at is null
    order by position, created_at
    limit 1
  );

  return query select resolved_item_id, resolved_version;
end
$$;

revoke all on function public.save_wardrobe_item(
  uuid, uuid, bigint, text, text, text, uuid, text, text, text, text, text, text,
  uuid[], uuid[], text[], text[], text[], text[]
) from public, anon, authenticated;
grant execute on function public.save_wardrobe_item(
  uuid, uuid, bigint, text, text, text, uuid, text, text, text, text, text, text,
  uuid[], uuid[], text[], text[], text[], text[]
) to service_role;

create or replace function public.set_wardrobe_item_state(
  p_account_id uuid,
  p_item_id uuid,
  p_expected_version bigint,
  p_action text
)
returns table (
  item_id uuid, item_version bigint, lifecycle_state text, is_favorite boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_action not in ('favorite', 'unfavorite', 'archive', 'restore') then
    raise exception 'invalid item action' using errcode = '22023';
  end if;
  if p_action = 'archive' and exists (
    select 1
    from public.clothing_items
    where id = p_item_id
      and account_id = p_account_id
      and version = p_expected_version
      and record_state = 'draft'
  ) then
    raise exception 'draft item cannot be archived' using errcode = '23514';
  end if;

  return query
  update public.clothing_items item
  set is_favorite = case
        when p_action = 'favorite' then true
        when p_action = 'unfavorite' then false
        else item.is_favorite
      end,
      lifecycle_state = case
        when p_action = 'archive' then 'archived'
        when p_action = 'restore' then 'active'
        else item.lifecycle_state
      end,
      archived_at = case
        when p_action = 'archive' then now()
        when p_action = 'restore' then null
        else item.archived_at
      end,
      updated_at = now(),
      version = item.version + 1
  where item.id = p_item_id
    and item.account_id = p_account_id
    and item.version = p_expected_version
    and (p_action not in ('favorite', 'unfavorite') or item.lifecycle_state = 'active')
  returning item.id, item.version, item.lifecycle_state, item.is_favorite;

  if not found then
    if exists (select 1 from public.clothing_items where id = p_item_id and account_id = p_account_id) then
      raise exception 'item conflict or ownership mismatch' using errcode = '40001';
    end if;
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  if p_action in ('archive', 'restore') then
    insert into public.audit_events (
      account_id, event_type, target_type, target_id, metadata
    ) values (
      p_account_id,
      case p_action when 'archive' then 'item.archived' else 'item.restored' end,
      'clothing_item',
      p_item_id,
      jsonb_build_object('source', 'wardrobe_core')
    );
  end if;
end
$$;

revoke all on function public.set_wardrobe_item_state(uuid, uuid, bigint, text)
  from public, anon, authenticated;
grant execute on function public.set_wardrobe_item_state(uuid, uuid, bigint, text)
  to service_role;


create or replace function public.search_wardrobe_item_ids(
  p_query text default null,
  p_category_id uuid default null,
  p_color_id uuid default null,
  p_season_id uuid default null,
  p_tag_id uuid default null,
  p_favorite boolean default null,
  p_lifecycle_state text default 'active',
  p_limit integer default 25
)
returns table (item_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  select item.id
  from public.clothing_items item
  where item.lifecycle_state = p_lifecycle_state
    and (p_category_id is null or item.category_id = p_category_id)
    and (p_favorite is null or item.is_favorite = p_favorite)
    and (
      p_color_id is null
      or exists (
        select 1
        from public.clothing_item_colors item_color
        where item_color.clothing_item_id = item.id
          and item_color.color_id = p_color_id
      )
    )
    and (
      p_season_id is null
      or exists (
        select 1
        from public.clothing_item_seasons item_season
        where item_season.clothing_item_id = item.id
          and item_season.season_id = p_season_id
      )
    )
    and (
      p_tag_id is null
      or exists (
        select 1
        from public.clothing_item_tags item_tag
        where item_tag.clothing_item_id = item.id
          and item_tag.tag_id = p_tag_id
      )
    )
    and (
      nullif(btrim(p_query), '') is null
      or item.search_document @@ websearch_to_tsquery('simple'::regconfig, btrim(p_query))
      or position(lower(btrim(p_query)) in item.search_text) > 0
      or exists (
        select 1
        from public.clothing_item_tags item_tag
        join public.tags tag on tag.id = item_tag.tag_id
        where item_tag.clothing_item_id = item.id
          and tag.archived_at is null
          and position(lower(btrim(p_query)) in lower(tag.label)) > 0
      )
    )
  order by item.is_favorite desc, item.updated_at desc, item.id desc
  limit least(greatest(coalesce(p_limit, 25), 1), 961)
$$;

revoke all on function public.search_wardrobe_item_ids(
  text, uuid, uuid, uuid, uuid, boolean, text, integer
) from public, anon;
grant execute on function public.search_wardrobe_item_ids(
  text, uuid, uuid, uuid, uuid, boolean, text, integer
) to authenticated;
