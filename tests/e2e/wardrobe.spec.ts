import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test.describe.configure({ mode: "serial" });

const suffix = randomUUID();
const emailA = (projectName: string) => `phase8-a-${projectName}-${suffix}@example.test`;
const emailB = (projectName: string) => `phase8-b-${projectName}-${suffix}@example.test`;
const password = "phase8-password";
let itemId = "";

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

async function expectNoAccessibilityViolations(page: Page) {
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
}

async function provisionAndLogin(page: Page, email: string) {
  const { error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  await login(page, email);
}

async function removeIdentity(email: string) {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = data.users.find((candidate) => candidate.email === email);
  if (!user) return;
  const { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (account) {
    const accountId = account.id;
    await admin.from("audit_events").delete().eq("account_id", accountId);
    await admin.from("appearance_variants").delete().eq("account_id", accountId);
    await admin.from("clothing_item_colors").delete().eq("account_id", accountId);
    await admin.from("clothing_item_seasons").delete().eq("account_id", accountId);
    await admin.from("clothing_item_tags").delete().eq("account_id", accountId);
    await admin.from("clothing_items").delete().eq("account_id", accountId);
    await admin.from("tags").delete().eq("account_id", accountId);
    await admin.from("account_preferences").delete().eq("account_id", accountId);
    await admin.from("accounts").delete().eq("id", accountId);
  }
  await admin.auth.admin.deleteUser(user.id);
}

test.afterAll(async ({}, testInfo) => {
  await removeIdentity(emailA(testInfo.project.name));
  await removeIdentity(emailB(testInfo.project.name));
});

test("User A completes the wardrobe vertical slice without images or AI", async ({
  page,
}, testInfo) => {
  await provisionAndLogin(page, emailA(testInfo.project.name));
  await page.getByRole("link", { name: "Открыть гардероб" }).click();
  await expect(page.getByRole("heading", { name: "Гардероб", exact: true })).toBeVisible();
  await expectNoAccessibilityViolations(page);
  const mobileFilters = page.getByRole("button", { name: "Фильтры" });
  if (await mobileFilters.isVisible()) {
    await mobileFilters.click();
    await expect(page.getByRole("dialog", { name: "Фильтры" })).toBeVisible();
    await expectNoAccessibilityViolations(page);
    await page.getByRole("button", { name: "Закрыть" }).click();
  }
  await page.getByRole("link", { name: "+ Добавить вещь" }).click();
  await expect(page.getByRole("heading", { name: "Новая вещь" })).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await page.getByRole("button", { name: "Сохранить черновик" }).click();
  await expect(page).toHaveURL(/\/app\/wardrobe\/[0-9a-f-]+\?status=saved$/u);
  await expect(page.getByRole("button", { name: "Архивировать" })).toHaveCount(0);
  await page.goto("/app/wardrobe/new");

  await page.getByLabel("Название вещи").fill("Синее двустороннее пальто");
  await page.getByLabel("Категория / подкатегория").selectOption({ label: "Верхняя одежда" });
  await page.getByLabel("Бренд").fill("Example");
  await page.getByLabel("Синий").check();
  await page.getByLabel("Зима").check();
  await page.getByLabel("Назначение").fill("Работа");
  await page.getByLabel("Стиль").fill("Классика");
  await page.getByLabel("Свои теги").fill("Travel");
  await page.getByLabel("Варианты внешнего вида").fill("Синяя сторона, Узорная сторона");
  await page.getByRole("button", { name: "Сохранить вещь" }).click();

  await expect(page).toHaveURL(/\/app\/wardrobe\/[0-9a-f-]+\?status=saved$/u);
  itemId = new URL(page.url()).pathname.split("/").at(-1) ?? "";
  expect(itemId).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Синее двустороннее пальто" })).toBeVisible();
  await expect(page.getByText("Синяя сторона · основной")).toBeVisible();

  await expectNoAccessibilityViolations(page);

  await page.getByRole("link", { name: "Гардероб", exact: true }).click();
  await page.getByLabel("Поиск по гардеробу").fill("Travel");
  await page.getByRole("button", { name: "Найти" }).click();
  await expect(page.getByText("Синее двустороннее пальто")).toBeVisible();
  await page.getByRole("button", { name: /Добавить .* в избранное/u }).click();
  await expect(page.getByRole("button", { name: /Убрать .* из избранного/u })).toBeVisible();

  await page.getByText("Синее двустороннее пальто").click();
  await page.getByRole("link", { name: "Редактировать" }).click();
  await page.getByLabel("Название вещи").fill("Синее пальто");
  await page.getByRole("button", { name: "Сохранить вещь" }).click();
  await expect(page.getByRole("link", { name: "← К результатам" })).toHaveAttribute(
    "href",
    /q=Travel/u,
  );
  await expect(page.getByRole("heading", { name: "Синее пальто" })).toBeVisible();
  await page.goto(`/app/wardrobe/${itemId}/edit`);
  await expect(page.getByRole("heading", { name: "Редактировать вещь" })).toBeVisible();
  await expectNoAccessibilityViolations(page);
  let intercepted = false;
  let interceptedRequestUrl = "";
  let interceptedRequestHeaders: Record<string, string> = {};
  let interceptedRequestBody: Buffer | undefined;
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (
      request.method() === "POST" &&
      request.headers()["next-action"] &&
      request.postData()?.includes("Forged title")
    ) {
      intercepted = true;
      interceptedRequestUrl = request.url();
      interceptedRequestHeaders = request.headers();
      interceptedRequestBody = request.postDataBuffer() ?? undefined;
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.getByLabel("Название вещи").fill("Forged title");
  await page.getByRole("button", { name: "Сохранить вещь" }).click();
  await expect.poll(() => intercepted).toBe(true);
  await page.unroute("**/*");
  expect(interceptedRequestUrl).toBeTruthy();
  const hostileHeaders = { ...interceptedRequestHeaders, origin: "https://evil.example" };
  delete hostileHeaders["content-length"];
  delete hostileHeaders.host;
  await page.request.fetch(interceptedRequestUrl, {
    method: "POST",
    headers: hostileHeaders,
    data: interceptedRequestBody,
    failOnStatusCode: false,
  });
  const { data: persistedItem, error: persistedItemError } = await adminClient()
    .from("clothing_items")
    .select("display_name")
    .eq("id", itemId)
    .single();
  expect(persistedItemError).toBeNull();
  expect(persistedItem?.display_name).toBe("Синее пальто");
  await page.goto(`/app/wardrobe/${itemId}`);

  await page.getByRole("button", { name: "Архивировать" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/wardrobe\\?archived=${itemId}$`, "u"));
  await expect(page.getByText("Архивирование «Синее пальто» выполнено.")).toBeVisible();
  await page.getByRole("button", { name: "Отменить архивирование" }).click();
  await expect(page).toHaveURL(/\/app\/wardrobe$/u);
  await page.goto(`/app/wardrobe/${itemId}`);
  await expect(page.getByText("Активная вещь")).toBeVisible();
});

test("User B cannot discover or open User A wardrobe item by known ID", async ({
  page,
}, testInfo) => {
  await provisionAndLogin(page, emailB(testInfo.project.name));
  await page.goto("/app/wardrobe");
  await expect(page.getByRole("heading", { name: "Гардероб пока пуст" })).toBeVisible();
  await expect(page.getByText("Синее пальто")).toHaveCount(0);
  await page.goto(`/app/wardrobe/${itemId}`);
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
});

test("restricted and deleting accounts cannot open Wardrobe routes", async ({ page }, testInfo) => {
  await login(page, emailA(testInfo.project.name));
  const admin = adminClient();
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = users.users.find((candidate) => candidate.email === emailA(testInfo.project.name));
  if (!user) throw new Error("User A identity is missing");
  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (accountError) throw accountError;

  try {
    for (const state of ["restricted", "deleting"] as const) {
      const { error } = await admin.from("accounts").update({ state }).eq("id", account.id);
      if (error) throw error;
      await page.goto("/app/wardrobe");
      await expect(
        page.getByRole("heading", { name: "Аккаунт временно недоступен" }),
      ).toBeVisible();
      await expect(page.getByText("Синее пальто")).toHaveCount(0);
      await page.goto(`/app/wardrobe/${itemId}`);
      await expect(
        page.getByRole("heading", { name: "Аккаунт временно недоступен" }),
      ).toBeVisible();
    }
  } finally {
    const { error } = await admin.from("accounts").update({ state: "active" }).eq("id", account.id);
    if (error) throw error;
  }
});
