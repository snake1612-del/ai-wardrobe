import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test.describe.configure({ mode: "serial" });

const suffix = randomUUID();
const password = "i18n-fictional-password";
const userIds = new Map<string, string>();

function email(project: string) {
  return `i18n-${project}-${suffix}@example.test`;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("E2E Supabase environment is incomplete");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function expectEnglishPage(page: Page, visibleText: string) {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText(visibleText, { exact: false }).first()).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/[А-Яа-яЁё]/u);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
}

function captureHydrationErrors(page: Page) {
  const errors: string[] = [];
  const capture = (message: string) => {
    if (/hydration failed|server rendered text didn't match/iu.test(message)) {
      errors.push(message);
    }
  };
  page.on("console", (message) => {
    if (message.type() === "error") capture(message.text());
  });
  page.on("pageerror", (error) => capture(error.message));
  return errors;
}

async function setLocaleCookie(page: Page, locale: "ru" | "en") {
  await page.context().addCookies([
    {
      name: "aw-locale",
      value: locale,
      url: new URL(page.url()).origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
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
    const { error: preferenceDeleteError } = await admin
      .from("account_preferences")
      .delete()
      .eq("account_id", account.id);
    if (preferenceDeleteError) throw preferenceDeleteError;
    const { error: accountDeleteError } = await admin
      .from("accounts")
      .delete()
      .eq("id", account.id);
    if (accountDeleteError) throw accountDeleteError;
  }
  const { error: userDeleteError } = await admin.auth.admin.deleteUser(userId);
  if (userDeleteError) throw userDeleteError;
});

test("locale switches immediately and persists through reload, logout, and login", async ({
  page,
}, testInfo) => {
  const hydrationErrors = captureHydrationErrors(page);
  const address = email(testInfo.project.name);
  await page.goto("/auth");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByText("Ваш приватный гардероб")).toBeVisible();
  await page.getByLabel("Язык интерфейса").selectOption("en");
  await expectEnglishPage(page, "Your private wardrobe");
  const localeCookie = (await page.context().cookies()).find(({ name }) => name === "aw-locale");
  expect(localeCookie).toMatchObject({
    value: "en",
    httpOnly: true,
    sameSite: "Lax",
  });

  await page.reload();
  await expectEnglishPage(page, "Your private wardrobe");

  await expect(page.getByRole("heading", { name: "Create account" })).toHaveCount(0);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  const admin = adminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: address,
    password,
    email_confirm: true,
  });
  if (createError) throw createError;
  userIds.set(testInfo.project.name, created.user.id);

  const login = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Sign in" }) });
  await login.getByLabel("Email").fill(address);
  await login.getByLabel("Password").fill(password);
  await login.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/u);

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id")
    .eq("auth_user_id", created.user.id)
    .single();
  if (accountError) throw accountError;
  await expect
    .poll(async () => {
      const { data, error } = await admin
        .from("account_preferences")
        .select("locale_code")
        .eq("account_id", account.id)
        .single();
      if (error) throw error;
      return data.locale_code;
    })
    .toBe("en");

  await expectEnglishPage(page, "Protected session");

  await page.goto("/app/wardrobe");
  await expectEnglishPage(page, "Wardrobe is empty");

  await page.goto("/app/wardrobe/new");
  await expectEnglishPage(page, "New item");

  await page.goto("/app/import");
  await expectEnglishPage(page, "Choose archive");
  await expect(page.getByText("No imports yet.")).toBeVisible();
  await page.reload();
  await expectEnglishPage(page, "Choose archive");

  await page.goto("/app/settings");
  await expectEnglishPage(page, "Regional settings");
  await expect(page.getByLabel("Time zone")).toHaveValue("UTC");
  await page.reload();
  await expectEnglishPage(page, "Regional settings");

  await page.getByRole("combobox", { name: "Interface language" }).last().selectOption("ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { name: "Региональные настройки" })).toBeVisible();

  await setLocaleCookie(page, "en");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { name: "Региональные настройки" })).toBeVisible();

  await page.goto("/app");
  await expect(page.getByText("Защищённая сессия")).toBeVisible();
  await page.goto("/app/wardrobe");
  await expect(page.getByText("Гардероб пока пуст")).toBeVisible();
  await page.goto("/app/profile");
  await expect(page.getByRole("heading", { name: "Личный аккаунт" })).toBeVisible();
  await page.goto("/app/import");
  await expect(page.getByRole("heading", { name: "Выбор архива" })).toBeVisible();
  await page.goto("/app/settings");
  await expect(page.getByRole("heading", { name: "Настройки", exact: true })).toBeVisible();

  await page.getByRole("combobox", { name: "Язык интерфейса" }).last().selectOption("en");
  await expectEnglishPage(page, "Regional settings");
  await setLocaleCookie(page, "ru");
  await page.reload();
  await expectEnglishPage(page, "Regional settings");
  await setLocaleCookie(page, "en");

  await page.goto("/app/profile");
  await expectEnglishPage(page, "Personal account");
  await expect(page.getByLabel("Display name")).toBeVisible();

  await page.reload();
  await expectEnglishPage(page, "Personal account");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/auth\?status=signed-out$/u);
  await expectEnglishPage(page, "You signed out.");

  const relogin = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Sign in" }) });
  await relogin.getByLabel("Email").fill(address);
  await relogin.getByLabel("Password").fill(password);
  await relogin.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/u);
  await expectEnglishPage(page, "Protected session");

  expect(hydrationErrors).toEqual([]);
});
