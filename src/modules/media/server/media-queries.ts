import "server-only";

import { createSupabaseUserContextClient } from "@/infrastructure/supabase/server-client";

import type { MediaGalleryEntry, MediaState } from "../model";

export async function listItemMedia(itemId: string): Promise<MediaGalleryEntry[]> {
  const client = await createSupabaseUserContextClient();
  const { data: bindings, error: bindingError } = await client
    .from("media_bindings")
    .select("id,media_asset_id,position,is_primary,image_view,product_role")
    .eq("clothing_item_id", itemId)
    .order("position");
  if (bindingError || !bindings?.length) return [];
  const assetIds = bindings.map(({ media_asset_id }) => media_asset_id);
  const [{ data: assets, error: assetError }, { data: renditions, error: renditionError }] =
    await Promise.all([
      client
        .from("media_assets")
        .select("id,processing_state,failure_code,version,original_filename")
        .in("id", assetIds),
      client
        .from("media_renditions")
        .select("id,media_asset_id")
        .in("media_asset_id", assetIds)
        .eq("rendition_kind", "medium")
        .eq("state", "ready"),
    ]);
  if (assetError || renditionError) throw new Error("media_gallery_read_failed");
  const assetsById = new Map((assets ?? []).map((asset) => [asset.id, asset]));
  const renditionsByAsset = new Map(
    (renditions ?? []).map((rendition) => [rendition.media_asset_id, rendition.id]),
  );
  return bindings.flatMap((binding) => {
    const asset = assetsById.get(binding.media_asset_id);
    if (!asset || asset.processing_state === "pending_delete") return [];
    return [
      {
        bindingId: binding.id,
        assetId: asset.id,
        renditionId: renditionsByAsset.get(asset.id) ?? null,
        state: asset.processing_state as MediaState,
        failureCode: asset.failure_code,
        version: Number(asset.version),
        position: binding.position,
        isPrimary: binding.is_primary,
        imageView: binding.image_view,
        productRole: binding.product_role,
        originalFilename: asset.original_filename,
      },
    ];
  });
}

export async function resolveReadyRendition(renditionId: string) {
  const client = await createSupabaseUserContextClient();
  const { data, error } = await client
    .from("media_renditions")
    .select("storage_bucket,storage_object_key,mime_type,byte_size")
    .eq("id", renditionId)
    .eq("state", "ready")
    .maybeSingle();
  if (error) throw new Error("rendition_read_failed");
  return data;
}
