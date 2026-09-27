import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test.describe.configure({ mode: "serial" });

const suffix = randomUUID();
const initialPassword = "profile-initial-password";
const replacementPassword = "profile-replacement-password";
const userIds = new Map<string, string>();

const mailpitUrl = "http://127.0.0.1:54324";

type MailpitMessage = {
  ID: string;
  To?: { Address?: string }[];
};

function email(project: string, changed = false) {
  return `profile-${changed ? "changed-" : ""}${project}-${suffix}@example.test`;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("E2E Supabase environment is incomplete");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function signUp(page: Page, address: string) {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Создать аккаунт", exact: true }).click();
  const form = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Создать аккаунт" }) });
  await form.getByLabel("Email").fill(address);
  await form.getByLabel("Пароль", { exact: true }).fill(initialPassword);
  await form.getByLabel("Подтвердите пароль").fill(initialPassword);
  await form.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/app$/u);
}

async function login(page: Page, address: string, password: string) {
  await page.goto("/auth");
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Войти" }) });
  await form.getByLabel("Email").fill(address);
  await form.getByLabel("Пароль").fill(password);
  await form.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/app$/u);
}

async function waitForEmailChangeLink(address: string): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`${mailpitUrl}/api/v1/messages`);
    if (response.ok) {
      const payload = (await response.json()) as { messages?: MailpitMessage[] };
      const message = payload.messages?.find(({ To }) =>
        To?.some(({ Address }) => Address?.toLowerCase() === address.toLowerCase()),
      );
      if (message) {
        const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
        if (detailResponse.ok) {
          const detail = (await detailResponse.json()) as { HTML?: string; Text?: string };
          const body = `${detail.HTML ?? ""}\n${detail.Text ?? ""}`.replaceAll("&amp;", "&");
          const links = body.match(/https?:\/\/[^\s"'<>]+/gu) ?? [];
          const confirmation = links.find((link) => link.includes("/auth/v1/verify"));
          if (confirmation) return confirmation;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Profile email-change confirmation was not delivered");
}

test.afterAll(async ({}, testInfo) => {
  const userId = userIds.get(testInfo.project.name);
  if (!userId) return;
  const admin = adminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (account) {
    await admin.from("account_preferences").delete().eq("account_id", account.id);
    await admin.from("accounts").delete().eq("id", account.id);
  }
  await admin.auth.admin.deleteUser(userId);
});

test("profile requires authentication and keeps the account API private", async ({ page }) => {
  await page.goto("/app/profile");
  await expect(page).toHaveURL(/\/auth\?next=%2Fapp%2Fprofile$/u);
  await expect(page.getByRole("heading", { name: "Войти" })).toBeVisible();

  const response = await page.request.get("/api/account");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(response.json()).resolves.toEqual({ error: "unauthenticated" });

  await page.goto("/auth?error=signout");
  await expect(
    page.getByText("Не удалось завершить сессию. Вернитесь в приложение и повторите попытку."),
  ).toBeVisible();
});

test("owner edits profile, reloads, changes credentials, and signs in again", async ({
  page,
}, testInfo) => {
  const originalEmail = email(testInfo.project.name);
  const changedEmail = email(testInfo.project.name, true);
  await signUp(page, originalEmail);

  const admin = adminClient();
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) throw usersError;
  const user = users.users.find((candidate) => candidate.email === originalEmail);
  if (!user) throw new Error("Synthetic profile identity was not created");
  userIds.set(testInfo.project.name, user.id);

  await page.getByRole("link", { name: "Личный аккаунт" }).click();
  await expect(page).toHaveURL(/\/app\/profile$/u);
  await page.getByLabel("Отображаемое имя").fill("Synthetic Wardrobe Owner");
  await page.getByRole("button", { name: "Сохранить имя" }).click();
  await expect(page.getByText("Отображаемое имя сохранено.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Отображаемое имя")).toHaveValue("Synthetic Wardrobe Owner");
  const accountResponse = await page.request.get("/api/account");
  expect(accountResponse.status()).toBe(200);
  expect(accountResponse.headers()["cache-control"]).toContain("no-store");
  expect(accountResponse.headers()["x-content-type-options"]).toBe("nosniff");
  const accountBody = (await accountResponse.json()) as {
    account: { id: string; displayName: string; version: number };
  };
  expect(accountBody.account.displayName).toBe("Synthetic Wardrobe Owner");
  expect(accountBody.account.version).toBe(2);

  await page.getByLabel("Новый email").fill(changedEmail);
  await page.getByRole("button", { name: "Изменить email" }).click();
  await expect(page.getByText(/Запрос принят/u)).toBeVisible();

  const oldAddressLink = await waitForEmailChangeLink(originalEmail);
  await waitForEmailChangeLink(changedEmail);

  const callbackRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === "/auth/callback" && url.searchParams.has("code");
  });
  await page.goto(oldAddressLink);
  await callbackRequest;
  await expect(page).toHaveURL(/\/app\/profile$/u);
  expect(new URL(page.url()).searchParams.has("code")).toBe(false);
  await expect
    .poll(async () => {
      const { data, error } = await admin.auth.admin.getUserById(user.id);
      if (error) throw error;
      return data.user.email;
    })
    .toBe(changedEmail);

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/auth\?status=signed-out$/u);
  await login(page, changedEmail, initialPassword);
  await page.goto("/app/profile");
  await expect(page.getByText(`Текущий email: ${changedEmail}`)).toBeVisible();
  await expect(page.getByLabel("Отображаемое имя")).toHaveValue("Synthetic Wardrobe Owner");

  await page.getByLabel("Текущий пароль").fill("incorrect-current-password");
  await page.getByLabel("Новый пароль", { exact: true }).fill(replacementPassword);
  await page.getByLabel("Повторите новый пароль").fill(replacementPassword);
  await page.getByRole("button", { name: "Изменить пароль" }).click();
  await expect(page.getByText("Текущий пароль указан неверно.")).toBeVisible();

  await page.getByLabel("Текущий пароль").fill(initialPassword);
  await page.getByLabel("Новый пароль", { exact: true }).fill(replacementPassword);
  await page.getByLabel("Повторите новый пароль").fill(replacementPassword);
  await page.getByRole("button", { name: "Изменить пароль" }).click();
  await expect(page.getByText(/Пароль изменён/u)).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/auth\?status=signed-out$/u);
  await login(page, changedEmail, replacementPassword);
  await page.goto("/app/profile");
  await expect(page.getByLabel("Отображаемое имя")).toHaveValue("Synthetic Wardrobe Owner");
});
