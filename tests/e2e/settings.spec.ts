import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test.describe.configure({ mode: "serial" });

const suffix = randomUUID();
const password = "settings-fictional-password";
const userIds = new Map<string, string>();

function email(project: string) {
  return `settings-${project}-${suffix}@example.test`;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("E2E Supabase environment is incomplete");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function captureHydrationErrors(page: Page) {
  const errors: string[] = [];
  const capture = (message: string) => {
    if (/hydration failed|server rendered text didn't match/iu.test(message)) errors.push(message);
  };
  page.on("console", (message) => {
    if (message.type() === "error") capture(message.text());
  });
  page.on("pageerror", (error) => capture(error.message));
  return errors;
}

async function login(page: Page, address: string, locale: "ru" | "en") {
  await page.goto("/auth");
  const signIn = locale === "ru" ? "Войти" : "Sign in";
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: signIn }) });
  await form.getByLabel("Email").fill(address);
  await form.getByLabel(locale === "ru" ? "Пароль" : "Password").fill(password);
  await form.getByRole("button", { name: signIn }).click();
  await expect(page).toHaveURL(/\/app$/u);
}

test.afterAll(async ({}, testInfo) => {
  const admin = adminClient();
  let userId = userIds.get(testInfo.project.name);
  if (!userId) {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = data.users.find((candidate) => candidate.email === email(testInfo.project.name))?.id;
  }
  if (!userId) return;
  const { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (account) {
    const { error: preferenceError } = await admin
      .from("account_preferences")
      .delete()
      .eq("account_id", account.id);
    if (preferenceError) throw preferenceError;
    const { error: accountError } = await admin.from("accounts").delete().eq("id", account.id);
    if (accountError) throw accountError;
  }
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
});

test("settings requires an authenticated account", async ({ page }) => {
  await page.goto("/app/settings");
  await expect(page).toHaveURL(/\/auth\?next=%2Fapp%2Fsettings$/u);
  await expect(page.getByRole("heading", { name: "Войти" })).toBeVisible();
});

test("owner saves regional settings and locale across reload and sign-in", async ({
  page,
}, testInfo) => {
  const hydrationErrors = captureHydrationErrors(page);
  const address = email(testInfo.project.name);
  const admin = adminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: address,
    password,
    email_confirm: true,
  });
  if (createError) throw createError;
  userIds.set(testInfo.project.name, created.user.id);

  await login(page, address, "ru");
  await page.getByRole("link", { name: "Настройки" }).click();
  await expect(page).toHaveURL(/\/app\/settings$/u);
  await expect(page.getByRole("heading", { name: "Настройки", exact: true })).toBeVisible();

  await page.getByLabel("Часовой пояс").fill("Europe/Moscow");
  await page.getByLabel("Система единиц").selectOption("imperial");
  await page.getByLabel("Начало недели").selectOption("7");
  await page.getByRole("button", { name: "Сохранить региональные настройки" }).click();
  await expect(page.getByText("Региональные настройки сохранены.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Часовой пояс")).toHaveValue("Europe/Moscow");
  await expect(page.getByLabel("Система единиц")).toHaveValue("imperial");
  await expect(page.getByLabel("Начало недели")).toHaveValue("7");

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id")
    .eq("auth_user_id", created.user.id)
    .single();
  if (accountError) throw accountError;
  const { data: preferences, error: preferenceError } = await admin
    .from("account_preferences")
    .select("timezone_name, units_code, week_starts_on, version")
    .eq("account_id", account.id)
    .single();
  if (preferenceError) throw preferenceError;
  expect(preferences).toMatchObject({
    timezone_name: "Europe/Moscow",
    units_code: "imperial",
    week_starts_on: 7,
  });
  expect(preferences.version).toBeGreaterThanOrEqual(2);

  await page.getByRole("combobox", { name: "Язык интерфейса" }).last().selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/[А-Яа-яЁё]/u);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/auth\?status=signed-out$/u);
  await login(page, address, "en");
  await page.goto("/app/settings");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByLabel("Time zone")).toHaveValue("Europe/Moscow");
  await expect(page.getByLabel("Units system")).toHaveValue("imperial");
  await expect(page.getByLabel("Week starts on")).toHaveValue("7");
  expect(hydrationErrors).toEqual([]);
});
