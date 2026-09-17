import AxeBuilder from "@axe-core/playwright";
import { expect, request as playwrightRequest, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

test.describe.configure({ mode: "serial" });

const suffix = randomUUID();
const emailA = (project: string) => `phase9-a-${project}-${suffix}@example.test`;
const emailB = (project: string) => `phase9-b-${project}-${suffix}@example.test`;
const password = "phase9-media-password";
const itemIds = new Map<string, string>();
const renditionIds = new Map<string, string>();

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("E2E Supabase environment is incomplete");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function login(page: Page, email: string) {
  await page.goto("/auth");
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Войти" }) });
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Пароль").fill(password);
  await form.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/app$/u);
}

async function provision(page: Page, email: string) {
  const { error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  await login(page, email);
}

async function accountId(page: Page): Promise<string> {
  const response = await page.request.get("/api/account");
  expect(response.ok()).toBeTruthy();
  return (await response.json()).account.id as string;
}

async function runWorker() {
  const result = spawnSync("pnpm", ["media:worker:drain"], {
    env: process.env,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`media worker failed: ${result.stderr}`);
}

async function uploadImage(page: Page, name: string, color: string) {
  const bytes = await sharp({
    create: { width: 24, height: 18, channels: 3, background: color },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name, mimeType: "image/png", buffer: bytes });
  await expect(
    page.getByText("Файл загружен. Обработка выполняется в приватной очереди."),
  ).toBeVisible();
  await runWorker();
  await page.reload();
  await expect(page.locator('img[src^="/api/media/renditions/"]').last()).toBeVisible();
}

async function cleanup(project: string) {
  const admin = adminClient();
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const user of users.users.filter(
    ({ email }) => email === emailA(project) || email === emailB(project),
  )) {
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (account) {
      const { data: assets } = await admin
        .from("media_assets")
        .select("storage_bucket,storage_object_key")
        .eq("account_id", account.id);
      const { data: renditions } = await admin
        .from("media_renditions")
        .select("storage_bucket,storage_object_key")
        .eq("account_id", account.id);
      for (const object of [...(assets ?? []), ...(renditions ?? [])]) {
        await admin.storage.from(object.storage_bucket).remove([object.storage_object_key]);
      }
      await admin.from("jobs").delete().eq("account_id", account.id);
      await admin.from("idempotency_records").delete().eq("account_id", account.id);
      await admin.from("media_bindings").delete().eq("account_id", account.id);
      await admin.from("media_renditions").delete().eq("account_id", account.id);
      await admin.from("media_assets").delete().eq("account_id", account.id);
      await admin.from("audit_events").delete().eq("account_id", account.id);
      await admin.from("clothing_items").delete().eq("account_id", account.id);
      await admin.from("account_preferences").delete().eq("account_id", account.id);
      await admin.from("accounts").delete().eq("id", account.id);
    }
    await admin.auth.admin.deleteUser(user.id);
  }
}

test.afterAll(async ({}, testInfo) => cleanup(testInfo.project.name));

test("private media upload, processing, gallery and cache contract", async ({
  page,
  baseURL,
}, testInfo) => {
  await provision(page, emailA(testInfo.project.name));
  const owner = await accountId(page);
  const itemId = randomUUID();
  itemIds.set(testInfo.project.name, itemId);
  const { error } = await adminClient().from("clothing_items").insert({
    id: itemId,
    account_id: owner,
    record_state: "committed",
    display_name: "Private media item",
  });
  if (error) throw error;
  await page.goto(`/app/wardrobe/${itemId}`);
  await expect(page.getByRole("heading", { name: "Изображения" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const beforeHostile = await adminClient()
    .from("media_assets")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  const hostile = await page.request.post("/api/media/upload-intents", {
    headers: { Origin: "https://evil.example" },
    data: {
      itemId,
      originalFilename: "hostile.png",
      declaredMimeType: "image/png",
      declaredByteSize: 10,
      productRole: "catalog",
      imageView: "front",
      idempotencyKey: randomUUID(),
    },
  });
  expect(hostile.status()).toBe(403);
  const afterHostile = await adminClient()
    .from("media_assets")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  expect(afterHostile.count).toBe(beforeHostile.count);

  await uploadImage(page, "first.png", "#225544");
  const firstImage = page.locator('img[src^="/api/media/renditions/"]').first();
  const firstSrc = await firstImage.getAttribute("src");
  expect(firstSrc).toBeTruthy();
  const renditionId = firstSrc?.split("/").at(-1) ?? "";
  renditionIds.set(testInfo.project.name, renditionId);
  const delivery = await page.request.get(firstSrc ?? "");
  expect(delivery.ok()).toBeTruthy();
  expect(delivery.headers()["cache-control"]).toContain("private");
  expect(delivery.headers()["cache-control"]).toContain("no-store");
  expect(delivery.headers()["x-content-type-options"]).toBe("nosniff");
  expect(delivery.headers()["content-type"]).toContain("image/webp");

  const anonymous = await playwrightRequest.newContext({ baseURL });
  try {
    const denied = await anonymous.get(firstSrc ?? "");
    expect(denied.status()).toBe(401);
    expect(denied.headers()["cache-control"]).toContain("no-store");
    expect(denied.headers()["x-content-type-options"]).toBe("nosniff");
  } finally {
    await anonymous.dispose();
  }

  await uploadImage(page, "second.png", "#553322");
  await expect(page.locator('img[src^="/api/media/renditions/"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Сделать основным" }).last().click();
  await expect(page.getByText("Основное")).toHaveCount(1);
  await page.getByRole("button", { name: "Раньше" }).last().click();
  await page
    .getByRole("listitem")
    .filter({ hasText: "Основное" })
    .getByRole("button", { name: "Убрать" })
    .click();
  await expect(page.locator('img[src^="/api/media/renditions/"]')).toHaveCount(1);
  await expect(page.getByText("Основное")).toHaveCount(1);

  await page.getByLabel("Заменить").selectOption({ label: "first.png" });
  await uploadImage(page, "replacement.png", "#224477");
  await expect(page.locator('img[src^="/api/media/renditions/"]')).toHaveCount(1);

  const stateFixtures = [
    ["uploaded", null],
    ["processing", null],
    ["failed", "unsupported_format"],
    ["quarantined", "decode_failed"],
  ] as const;
  const fixtureAssets = stateFixtures.map(([processing_state, failure_code], index) => {
    const assetId = randomUUID();
    return {
      id: assetId,
      account_id: owner,
      origin_code: "user_uploaded",
      evidence_status: "real_item_evidence",
      storage_bucket: "wardrobe-originals",
      storage_object_key: `accounts/${owner}/assets/${assetId}/source/v1`,
      original_filename: `state-${index}.png`,
      processing_state,
      failure_code,
    };
  });
  const fixtureInsert = await adminClient().from("media_assets").insert(fixtureAssets);
  if (fixtureInsert.error) throw fixtureInsert.error;
  const bindingInsert = await adminClient()
    .from("media_bindings")
    .insert(
      fixtureAssets.map((asset, index) => ({
        account_id: owner,
        media_asset_id: asset.id,
        clothing_item_id: itemId,
        product_role: "catalog",
        image_view: "detail",
        position: 20 + index,
      })),
    );
  if (bindingInsert.error) throw bindingInsert.error;
  await page.reload();
  await expect(page.getByText("Проверяем файл")).toBeVisible();
  await expect(page.getByText("Готовим изображение")).toBeVisible();
  await expect(page.getByText("Формат не поддерживается")).toBeVisible();
  await expect(page.getByText("Файл изолирован как небезопасный")).toBeVisible();
  await expect(page.getByRole("button", { name: "Повторить" })).toHaveCount(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "Архивировать" }).click();
  const { count: retained } = await adminClient()
    .from("media_assets")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  expect(retained).toBeGreaterThan(0);
});

test("User B cannot read User A item or known rendition", async ({ page }, testInfo) => {
  await provision(page, emailB(testInfo.project.name));
  const itemId = itemIds.get(testInfo.project.name);
  const renditionId = renditionIds.get(testInfo.project.name);
  expect(itemId).toBeTruthy();
  expect(renditionId).toBeTruthy();
  await page.goto(`/app/wardrobe/${itemId}`);
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  const denied = await page.request.get(`/api/media/renditions/${renditionId}`);
  expect(denied.status()).toBe(404);
  expect(denied.headers()["cache-control"]).toContain("no-store");
});
