"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { resolveAccountContext } from "@/modules/account/server/account-context";
import { ApplicationError } from "@/platform/errors/application-error";
import { getTrustedMutationOrigin } from "@/platform/security/server-origin";

import {
  getWardrobeReturnPath,
  parseCommaSeparated,
  type WardrobeActionState,
  wardrobeItemInputSchema,
} from "../model";
import { saveWardrobeItemCapability, setWardrobeItemStateCapability } from "./wardrobe-capability";

const stateInputSchema = z.object({
  itemId: z.string().uuid(),
  expectedVersion: z.coerce.number().int().positive(),
  action: z.enum(["favorite", "unfavorite", "archive", "restore"]),
});

function failure(message: string): WardrobeActionState {
  return { status: "error", message };
}

function withError(path: string, error: string): string {
  const url = new URL(path, "https://wardrobe.invalid");
  url.searchParams.set("error", error);
  return `${url.pathname}${url.search}`;
}

async function readyAccountId(): Promise<string | null> {
  if (!(await getTrustedMutationOrigin())) return null;
  const resolution = await resolveAccountContext();
  return resolution.status === "ready" ? resolution.context.accountId : null;
}

export async function saveWardrobeItemAction(
  _previous: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const accountId = await readyAccountId();
  if (!accountId) return failure("Сессия устарела или запрос не прошёл проверку origin.");
  const returnTo = getWardrobeReturnPath(formData.get("returnTo"));

  const itemIdValue = formData.get("itemId");
  const versionValue = formData.get("expectedVersion");
  const categoryValue = formData.get("categoryId");
  const parsed = wardrobeItemInputSchema.safeParse({
    itemId: itemIdValue,
    expectedVersion: typeof versionValue === "string" ? Number(versionValue) : Number.NaN,
    recordState: formData.get("intent") === "draft" ? "draft" : "committed",
    displayName: formData.get("displayName"),
    referenceCode: formData.get("referenceCode"),
    categoryId: typeof categoryValue === "string" && categoryValue ? categoryValue : null,
    brand: formData.get("brand"),
    description: formData.get("description"),
    notes: formData.get("notes"),
    pattern: formData.get("pattern"),
    material: formData.get("material"),
    sizeLabel: formData.get("sizeLabel"),
    colorIds: formData.getAll("colorIds"),
    seasonIds: formData.getAll("seasonIds"),
    purposeLabels: parseCommaSeparated(formData.get("purposeLabels")),
    styleLabels: parseCommaSeparated(formData.get("styleLabels")),
    customLabels: parseCommaSeparated(formData.get("customLabels")),
    variantLabels: parseCommaSeparated(formData.get("variantLabels")),
  });
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Проверьте поля формы.");
  }

  try {
    const saved = await saveWardrobeItemCapability(accountId, parsed.data);
    const detailParams = new URLSearchParams({ status: "saved" });
    if (returnTo !== "/app/wardrobe") detailParams.set("from", returnTo);
    revalidatePath("/app/wardrobe");
    redirect("/app/wardrobe/" + saved.itemId + "?" + detailParams);
  } catch (error) {
    if (error instanceof ApplicationError) return failure(error.message);
    throw error;
  }
}

export async function setWardrobeItemStateAction(formData: FormData): Promise<void> {
  const returnTo = getWardrobeReturnPath(formData.get("returnTo"));
  const accountId = await readyAccountId();
  if (!accountId) redirect(withError(returnTo, "request"));

  const parsed = stateInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(withError(returnTo, "invalid-action"));
  try {
    await setWardrobeItemStateCapability(
      accountId,
      parsed.data.itemId,
      parsed.data.expectedVersion,
      parsed.data.action,
    );
  } catch {
    redirect(withError(returnTo, "conflict"));
  }
  revalidatePath("/app/wardrobe");
  redirect(returnTo);
}
