import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/infrastructure/database/database.types";
import { ApplicationError } from "@/platform/errors/application-error";
import { getAccountBootstrapEnvironment } from "@/platform/env/server";
import { logEvent } from "@/platform/logging/logger";

import { EMPTY_UUID, type wardrobeItemInputSchema } from "../model";
import type { z } from "zod";

type WardrobeItemInput = z.infer<typeof wardrobeItemInputSchema>;
type ItemAction = "favorite" | "unfavorite" | "archive" | "restore";

function capabilityClient() {
  const environment = getAccountBootstrapEnvironment();
  return createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } },
  );
}

export async function saveWardrobeItemCapability(
  accountId: string,
  input: WardrobeItemInput,
): Promise<{ itemId: string; version: number }> {
  const { data, error } = await capabilityClient()
    .rpc("save_wardrobe_item", {
      p_account_id: accountId,
      p_item_id: input.itemId,
      p_expected_version: input.expectedVersion,
      p_record_state: input.recordState,
      p_display_name: input.displayName,
      p_reference_code: input.referenceCode,
      p_category_id: input.categoryId ?? EMPTY_UUID,
      p_brand: input.brand,
      p_description: input.description,
      p_notes: input.notes,
      p_pattern: input.pattern,
      p_material: input.material,
      p_size_label: input.sizeLabel,
      p_color_ids: input.colorIds,
      p_season_ids: input.seasonIds,
      p_purpose_labels: input.purposeLabels,
      p_style_labels: input.styleLabels,
      p_custom_labels: input.customLabels,
      p_variant_labels: input.variantLabels,
    })
    .single();

  if (error || !data) {
    logEvent("warn", "wardrobe.item.save_failed", { errorCode: error?.code ?? "missing_result" });
    if (error?.code === "40001") {
      throw new ApplicationError(
        "conflict",
        "Вещь изменилась в другой вкладке. Обновите страницу.",
      );
    }
    if (["22023", "23503", "23505", "23514"].includes(error?.code ?? "")) {
      throw new ApplicationError(
        "validation",
        "Проверьте категорию, справочные значения и уникальные поля.",
      );
    }
    throw new ApplicationError("transient_dependency", "Не удалось сохранить вещь.");
  }
  return { itemId: data.item_id, version: Number(data.item_version) };
}

export async function setWardrobeItemStateCapability(
  accountId: string,
  itemId: string,
  expectedVersion: number,
  action: ItemAction,
): Promise<void> {
  const { error } = await capabilityClient().rpc("set_wardrobe_item_state", {
    p_account_id: accountId,
    p_item_id: itemId,
    p_expected_version: expectedVersion,
    p_action: action,
  });
  if (error) {
    logEvent("warn", "wardrobe.item.state_failed", { errorCode: error.code });
    if (error.code === "40001") {
      throw new ApplicationError("conflict", "Вещь изменилась. Обновите страницу.");
    }
    throw new ApplicationError("transient_dependency", "Не удалось изменить вещь.");
  }
}
