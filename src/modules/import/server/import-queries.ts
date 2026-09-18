import "server-only";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";

export async function listImportSessions() {
  const client = await createSupabaseUserContextClient();
  const { data, error } = await client
    .from("import_sessions")
    .select("id,state,summary,preview_revision,version,created_at,updated_at,failure_code")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("import_sessions_read_failed");
  return data;
}

export async function getImportReview(sessionId: string) {
  const client = await createSupabaseUserContextClient();
  const [sessionResult, assetResult, recordResult, itemsResult, categoryResult] = await Promise.all(
    [
      client
        .from("import_sessions")
        .select(
          "id,state,summary,preview_revision,preview_manifest_hash,version,created_at,updated_at,failure_code",
        )
        .eq("id", sessionId)
        .maybeSingle(),
      client
        .from("import_asset_links")
        .select(
          "id,media_asset_id,source_reference,proposed_role,proposed_view,proposed_variant_key,proposed_primary,disposition,import_record_id",
        )
        .eq("import_session_id", sessionId)
        .order("created_at"),
      client
        .from("import_records")
        .select(
          "id,record_ordinal,source_record_key,normalized_payload,validation_state,issues,candidate_item_id,proposed_action,proposed_diff,user_decision,commit_outcome,committed_item_id,outcome_detail",
        )
        .eq("import_session_id", sessionId)
        .order("record_ordinal"),
      client
        .from("clothing_items")
        .select("id,display_name,version,lifecycle_state")
        .eq("record_state", "committed")
        .eq("lifecycle_state", "active")
        .order("display_name")
        .limit(500),
      client
        .from("categories")
        .select("id,code,label_ru")
        .eq("is_active", true)
        .order("sort_order"),
    ],
  );
  if (
    sessionResult.error ||
    assetResult.error ||
    recordResult.error ||
    itemsResult.error ||
    categoryResult.error
  ) {
    throw new Error("import_review_read_failed");
  }
  if (!sessionResult.data) return null;
  const assetIds = (assetResult.data ?? []).map((asset) => asset.media_asset_id);
  const [mediaResult, renditionResult] = assetIds.length
    ? await Promise.all([
        client.from("media_assets").select("id,processing_state").in("id", assetIds),
        client
          .from("media_renditions")
          .select("id,media_asset_id,rendition_kind,width_px,height_px")
          .in("media_asset_id", assetIds)
          .eq("state", "ready")
          .order("rendition_kind"),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];
  if (mediaResult.error || renditionResult.error) throw new Error("import_media_read_failed");
  const mediaStates = new Map(
    (mediaResult.data ?? []).map((asset) => [asset.id, asset.processing_state]),
  );
  const renditionByAsset = new Map<
    string,
    { id: string; width_px: number | null; height_px: number | null }
  >();
  for (const rendition of renditionResult.data ?? []) {
    if (
      !renditionByAsset.has(rendition.media_asset_id) ||
      rendition.rendition_kind === "thumbnail"
    ) {
      renditionByAsset.set(rendition.media_asset_id, rendition);
    }
  }
  const summary =
    typeof sessionResult.data.summary === "object" &&
    sessionResult.data.summary !== null &&
    !Array.isArray(sessionResult.data.summary)
      ? sessionResult.data.summary
      : {};
  const rawIssues = "issues" in summary && Array.isArray(summary.issues) ? summary.issues : [];
  const issues = rawIssues.flatMap((issue) => {
    if (
      typeof issue !== "object" ||
      issue === null ||
      Array.isArray(issue) ||
      typeof issue.code !== "string" ||
      typeof issue.count !== "number" ||
      !["info", "warning", "error"].includes(String(issue.severity))
    ) {
      return [];
    }
    return [{ code: issue.code, count: issue.count, severity: String(issue.severity) }];
  });
  return {
    session: {
      ...sessionResult.data,
      preview_manifest_hash: sessionResult.data.preview_manifest_hash
        ? String(sessionResult.data.preview_manifest_hash).replace(/^\\x/u, "")
        : null,
    },
    assets: (assetResult.data ?? []).map((asset) => ({
      ...asset,
      processing_state: mediaStates.get(asset.media_asset_id) ?? "missing",
      rendition: renditionByAsset.get(asset.media_asset_id) ?? null,
    })),
    issues,
    records: recordResult.data ?? [],
    items: itemsResult.data ?? [],
    categories: (categoryResult.data ?? []).map((category) => ({
      id: category.id,
      code: category.code,
      label: category.label_ru,
    })),
  };
}
