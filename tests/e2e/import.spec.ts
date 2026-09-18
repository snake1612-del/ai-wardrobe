import AxeBuilder from "@axe-core/playwright";
import { expect, request as playwrightRequest, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

import { createSyntheticImportFixture } from "../fixtures/bulk-import/synthetic-fixture";

test.describe.configure({ mode: "serial" });

const suffix = randomUUID();
const password = "phase10-import-password";
const emailA = (project: string) => `phase10-a-${project}-${suffix}@example.test`;
const emailB = (project: string) => `phase10-b-${project}-${suffix}@example.test`;
const sessionIds = new Map<string, string>();

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

function runScript(script: "import:worker:drain" | "media:worker:drain") {
  const result = spawnSync("pnpm", [script], { env: process.env, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${script} failed: ${result.stderr}`);
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
      const { data: archives } = await admin
        .from("import_archive_parts")
        .select("storage_bucket,storage_object_key")
        .eq("account_id", account.id);
      const { data: assets } = await admin
        .from("media_assets")
        .select("storage_bucket,storage_object_key")
        .eq("account_id", account.id);
      const { data: renditions } = await admin
        .from("media_renditions")
        .select("storage_bucket,storage_object_key")
        .eq("account_id", account.id);
      for (const object of [...(archives ?? []), ...(assets ?? []), ...(renditions ?? [])]) {
        await admin.storage.from(object.storage_bucket).remove([object.storage_object_key]);
      }
      await admin.from("jobs").delete().eq("account_id", account.id);
      await admin.from("idempotency_records").delete().eq("account_id", account.id);
      await admin.from("audit_events").delete().eq("account_id", account.id);
      await admin.from("media_bindings").delete().eq("account_id", account.id);
      await admin.from("media_renditions").delete().eq("account_id", account.id);
      await admin.from("import_asset_links").delete().eq("account_id", account.id);
      await admin.from("media_assets").delete().eq("account_id", account.id);
      await admin.from("import_records").delete().eq("account_id", account.id);
      await admin.from("import_archive_parts").delete().eq("account_id", account.id);
      await admin.from("import_sessions").delete().eq("account_id", account.id);
      await admin.from("import_sources").delete().eq("account_id", account.id);
      await admin.from("appearance_variants").delete().eq("account_id", account.id);
      await admin.from("clothing_items").delete().eq("account_id", account.id);
      await admin.from("account_preferences").delete().eq("account_id", account.id);
      await admin.from("accounts").delete().eq("id", account.id);
    }
    await admin.auth.admin.deleteUser(user.id);
  }
}

test.afterAll(async ({}, testInfo) => cleanup(testInfo.project.name));

test("Choose through Results is sealed, responsive, accessible and hostile-Origin safe", async ({
  page,
  baseURL,
}, testInfo) => {
  await provision(page, emailA(testInfo.project.name));
  const owner = await accountId(page);
  await page.goto("/app/import");
  await expect(page.getByRole("heading", { name: "Bulk Import", exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const beforeHostile = await adminClient()
    .from("import_sessions")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  const hostile = await page.request.post("/api/import/sessions", {
    headers: { Origin: "https://evil.example" },
    data: {
      parts: [{ byteSize: 100 }],
      idempotencyKey: randomUUID(),
    },
  });
  expect(hostile.status()).toBe(403);
  expect(hostile.headers()["cache-control"]).toContain("no-store");
  expect(hostile.headers()["x-content-type-options"]).toBe("nosniff");
  const afterHostile = await adminClient()
    .from("import_sessions")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  expect(afterHostile.count).toBe(beforeHostile.count);

  const fixture = await createSyntheticImportFixture();
  await page.locator('input[type="file"]').setInputFiles({
    name: "fictional-wardrobe.zip",
    mimeType: "application/zip",
    buffer: fixture,
  });
  await page.getByRole("button", { name: "Prepare" }).click();
  await expect(page).toHaveURL(/\/app\/import\/[0-9a-f-]+$/u);
  const sessionId = page.url().split("/").at(-1) ?? "";
  sessionIds.set(testInfo.project.name, sessionId);

  const beforeConfirm = await adminClient()
    .from("clothing_items")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  expect(beforeConfirm.count).toBe(0);
  runScript("import:worker:drain");
  runScript("media:worker:drain");
  await expect(page.getByText("Нужно проверить")).toBeVisible({ timeout: 15_000 });
  const groupChoices = page.getByLabel(/Выбрать для группировки/u);
  await expect(groupChoices.first()).toBeVisible({ timeout: 15_000 });
  const initialGroupCount = await groupChoices.count();
  expect(initialGroupCount).toBeGreaterThanOrEqual(3);
  await expect(page.getByRole("heading", { name: "Bulk Import", level: 1 })).toBeVisible();
  await expect(page.getByAltText("Приватное изображение для проверки импорта")).toHaveCount(
    initialGroupCount,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(2_000);
  await expect(page.getByRole("heading", { name: "Bulk Import", level: 1 })).toBeVisible();
  await expect(page.getByAltText("Приватное изображение для проверки импорта")).toHaveCount(
    initialGroupCount,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const names = page.getByLabel("Название");
  for (let index = 0; index < (await names.count()); index += 1) {
    await names.nth(index).fill(`Fictional item ${index + 1}`);
  }
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible();
  await groupChoices.nth(0).check();
  await groupChoices.nth(1).check();
  await page.getByRole("button", { name: "Объединить выбранные" }).click();
  await expect(page.getByLabel(/Выбрать для группировки/u)).toHaveCount(initialGroupCount - 1);
  await expect(page.getByLabel("Выбрать для группировки (2 изображений)")).toBeVisible();
  await page.getByRole("button", { name: "Создать Preview" }).click();
  await expect(page.getByText("Предпросмотр запечатан")).toBeVisible();

  const stillBeforeConfirm = await adminClient()
    .from("clothing_items")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  expect(stillBeforeConfirm.count).toBe(0);
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByText(/Confirm принят/u)).toBeVisible();
  runScript("import:worker:drain");
  await expect(page.getByText("Импорт завершён", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByText(/created/u)).toHaveCount(initialGroupCount - 1);

  const { count: importedItems } = await adminClient()
    .from("clothing_items")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  expect(importedItems).toBe(initialGroupCount - 1);
  const { count: inferredWear } = await adminClient()
    .from("wear_events")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner);
  expect(inferredWear).toBe(0);

  const anonymous = await playwrightRequest.newContext({ baseURL });
  try {
    const response = await anonymous.get(`/app/import/${sessionId}`);
    expect(response.url()).toContain("/auth");
  } finally {
    await anonymous.dispose();
  }
});

test("User B cannot access User A import by known ID", async ({ page }, testInfo) => {
  await provision(page, emailB(testInfo.project.name));
  const sessionId = sessionIds.get(testInfo.project.name);
  expect(sessionId).toBeTruthy();
  await page.goto(`/app/import/${sessionId}`);
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  const idor = await page.evaluate(async (knownSessionId) => {
    const response = await fetch(`/api/import/sessions/${knownSessionId}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedVersion: 1 }),
    });
    return {
      status: response.status,
      cacheControl: response.headers.get("cache-control"),
    };
  }, sessionId);
  expect(idor.status).toBe(409);
  expect(idor.cacheControl).toContain("no-store");
});
