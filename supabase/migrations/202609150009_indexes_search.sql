create index accounts_state_idx on public.accounts (state, id);
create index categories_parent_sort_idx on public.categories (parent_id, sort_order, id);
create index categories_active_sort_idx on public.categories (is_active, sort_order);
create index colors_active_label_idx on public.colors (is_active, label_ru);
create index seasons_active_sort_idx on public.seasons (is_active, sort_order);
create index tags_browse_idx on public.tags (account_id, kind, archived_at, label);

create index clothing_items_browse_idx
  on public.clothing_items (account_id, archived_at, created_at desc, id desc);
create index clothing_items_category_idx
  on public.clothing_items (account_id, category_id, archived_at, id);
create index clothing_items_favorite_idx
  on public.clothing_items (account_id, updated_at desc, id desc)
  where is_favorite and archived_at is null;
create index clothing_items_search_document_idx
  on public.clothing_items using gin (search_document);
create index clothing_items_search_text_trgm_idx
  on public.clothing_items using gin (search_text extensions.gin_trgm_ops);

create index clothing_item_colors_filter_idx
  on public.clothing_item_colors (account_id, color_id, clothing_item_id);
create index clothing_item_colors_position_idx
  on public.clothing_item_colors (clothing_item_id, position);
create index clothing_item_seasons_filter_idx
  on public.clothing_item_seasons (account_id, season_id, clothing_item_id);
create index clothing_item_tags_filter_idx
  on public.clothing_item_tags (account_id, tag_id, clothing_item_id);
create index item_metadata_evidence_item_idx
  on public.item_metadata_evidence (account_id, clothing_item_id, field_code, created_at desc);
create index item_metadata_evidence_pending_idx
  on public.item_metadata_evidence (account_id, created_at desc)
  where review_state = 'proposed';
create index appearance_variants_browse_idx
  on public.appearance_variants (account_id, clothing_item_id, archived_at, position, id);

create index media_assets_state_idx
  on public.media_assets (account_id, processing_state, created_at);
create index media_assets_hash_idx
  on public.media_assets (account_id, content_hash)
  where content_hash is not null;
create index media_assets_cleanup_idx
  on public.media_assets (processing_state, delete_after)
  where processing_state = 'pending_delete';
create index media_bindings_item_idx
  on public.media_bindings (account_id, clothing_item_id, appearance_variant_id, product_role, position);
create index media_bindings_asset_idx
  on public.media_bindings (account_id, media_asset_id);
create index media_renditions_state_idx
  on public.media_renditions (account_id, media_asset_id, state);
create index media_renditions_reconcile_idx
  on public.media_renditions (state, updated_at)
  where state in ('failed', 'pending_delete');

create index outfits_library_idx
  on public.outfits (account_id, archived_at, updated_at desc, id desc);
create index outfits_favorite_idx
  on public.outfits (account_id, updated_at desc, id desc)
  where is_favorite and archived_at is null;
create index outfits_title_trgm_idx
  on public.outfits using gin (title extensions.gin_trgm_ops);
create index outfit_items_position_idx
  on public.outfit_items (account_id, outfit_id, position);
create index outfit_items_item_idx
  on public.outfit_items (account_id, clothing_item_id, outfit_id);
create index outfit_seasons_filter_idx
  on public.outfit_seasons (account_id, season_id, outfit_id);
create index outfit_tags_filter_idx
  on public.outfit_tags (account_id, tag_id, outfit_id);

create index wear_events_calendar_idx
  on public.wear_events (account_id, occurred_on desc, id desc)
  where voided_at is null;
create index wear_events_source_outfit_idx
  on public.wear_events (account_id, source_outfit_id, occurred_on desc)
  where source_outfit_id is not null;
create index wear_events_updated_idx
  on public.wear_events (account_id, updated_at);
create index wear_event_items_live_item_idx
  on public.wear_event_items (account_id, clothing_item_id, wear_event_id)
  where clothing_item_id is not null;
create index wear_event_items_snapshot_item_idx
  on public.wear_event_items (account_id, snapshot_item_id, wear_event_id);
create index wear_event_items_event_position_idx
  on public.wear_event_items (account_id, wear_event_id, position);

create index import_sources_recent_idx
  on public.import_sources (account_id, last_used_at desc);
create index external_item_identities_item_idx
  on public.external_item_identities (account_id, clothing_item_id);
create index import_sessions_state_idx
  on public.import_sessions (account_id, state, updated_at desc);
create index import_sessions_source_idx
  on public.import_sessions (account_id, import_source_id, created_at desc);
create index import_records_review_idx
  on public.import_records (account_id, import_session_id, validation_state, user_decision, record_ordinal);
create index import_records_external_idx
  on public.import_records (account_id, external_identifier)
  where external_identifier is not null;
create index import_records_candidate_idx
  on public.import_records (account_id, candidate_item_id)
  where candidate_item_id is not null;
create index import_asset_links_record_idx
  on public.import_asset_links (account_id, import_record_id);
create index import_asset_links_media_idx
  on public.import_asset_links (account_id, media_asset_id);

create index jobs_available_idx
  on public.jobs (state, available_at, created_at)
  where state = 'queued';
create index jobs_lease_idx
  on public.jobs (lease_expires_at)
  where state = 'running';
create index jobs_owner_state_idx
  on public.jobs (account_id, state, updated_at desc);
create index idempotency_records_expiry_idx on public.idempotency_records (expires_at);
create index idempotency_records_resource_idx
  on public.idempotency_records (account_id, resource_type, resource_id)
  where resource_id is not null;
create index audit_events_recent_idx
  on public.audit_events (account_id, occurred_at desc, id desc);
create index audit_events_type_idx
  on public.audit_events (account_id, event_type, occurred_at desc);
create index export_requests_state_idx
  on public.export_requests (account_id, state, created_at desc);
create index export_requests_expiry_idx
  on public.export_requests (expires_at)
  where expires_at is not null;
create index account_deletion_requests_recovery_idx
  on public.account_deletion_requests (state, updated_at);
