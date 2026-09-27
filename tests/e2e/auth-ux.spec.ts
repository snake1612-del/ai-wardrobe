import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test.describe.configure({ mode: "serial" });

const address = `auth-ux-${randomUUID()}@example.test`;
const initialPassword = "lettersonly";
const changedPassword = "changedletters";
const recoveredPassword = "recoveredletters";
const mailpitUrl = "http://127.0.0.1:54324";
let userId: string | undefined;

type MailpitMessage = {
  ID: string;
  To?: { Address?: string }[];
};

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

async function waitForRecoveryLink(): Promise<string> {
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
          const body = `${detail.HTML ?? ""}
${detail.Text ?? ""}`.replaceAll("&amp;", "&");
          const links = body.match(/https?:\/\/[^\s"'<>]+/gu) ?? [];
          const recovery = links.find((link) => link.includes("/auth/v1/verify"));
          if (recovery) return recovery;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Auth UX recovery email was not delivered");
}

async function login(page: Page, password: string, next = "/app") {
  await page.goto(`/auth?next=${encodeURIComponent(next)}`);
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Войти" }) });
  await form.getByLabel("Email").fill(address);
  await form.getByLabel("Пароль").fill(password);
  await form.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/app$/u);
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/auth\?status=signed-out$/u);
}

test.afterAll(async () => {
  const admin = adminClient();
  if (!userId) {
    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listed.error) throw listed.error;
    userId = listed.data.users.find((candidate) => candidate.email === address)?.id;
  }
  if (!userId) return;

  const account = await admin
    .from("accounts")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (account.error) throw account.error;
  if (account.data) {
    const preferenceDelete = await admin
      .from("account_preferences")
      .delete()
      .eq("account_id", account.data.id);
    if (preferenceDelete.error) throw preferenceDelete.error;
    const accountDelete = await admin.from("accounts").delete().eq("id", account.data.id);
    if (accountDelete.error) throw accountDelete.error;
  }
  const identityDelete = await admin.auth.admin.deleteUser(userId);
  if (identityDelete.error) throw identityDelete.error;
});

test("login-first Auth UX validates, recovers, and changes one fictional identity", async ({
  page,
  baseURL,
}) => {
  const hydrationErrors = captureHydrationErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/auth?next=https%3A%2F%2Fevil.example%2Fsteal");

  await expect(page.getByRole("heading", { name: "Войти" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Создать аккаунт" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Забыли пароль?" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  await page.locator('select[name="locale"]').selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  const englishSignup = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Create account" }) });
  await englishSignup.getByLabel("Email", { exact: true }).fill(address);
  await englishSignup.getByLabel("Password", { exact: true }).fill("Abc123");
  await englishSignup.getByLabel("Confirm password", { exact: true }).fill("Abc123");
  await englishSignup.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText(
    "The password must contain 8 to 128 characters.",
  );
  await page.locator('select[name="locale"]').selectOption("ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  const openSignup = page.getByRole("button", { name: "Создать аккаунт", exact: true });
  await expect(openSignup).toBeEnabled();
  await openSignup.click();
  const signup = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Создать аккаунт" }) });
  await expect(signup.getByRole("button", { name: "Уже есть аккаунт? Войти" })).toBeVisible();
  await signup.getByLabel("Email").fill(address);

  await signup.getByLabel("Пароль", { exact: true }).fill("Abc123");
  await signup.getByLabel("Подтвердите пароль").fill("Abc123");
  await signup.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.locator('p[role=\"alert\"]')).toHaveText(
    "Пароль должен содержать от 8 до 128 символов.",
  );

  await signup.getByLabel("Пароль", { exact: true }).fill("12345678");
  await signup.getByLabel("Подтвердите пароль").fill("12345678");
  await signup.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.locator('p[role=\"alert\"]')).toHaveText(
    "Пароль должен содержать минимум одну латинскую букву.",
  );

  await signup.getByLabel("Пароль", { exact: true }).fill(initialPassword);
  await signup.getByLabel("Подтвердите пароль").fill("differentletters");
  await signup.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.locator('p[role=\"alert\"]')).toHaveText("Пароли не совпадают.");

  await signup.getByLabel("Подтвердите пароль").fill(initialPassword);
  await signup.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/app$/u);
  expect(new URL(page.url()).origin).toBe(new URL(baseURL ?? "").origin);

  const admin = adminClient();
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  const created = listed.data.users.find((candidate) => candidate.email === address);
  expect(created).toBeTruthy();
  userId = created?.id;
  expect(created?.email_confirmed_at).toBeTruthy();

  await logout(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, initialPassword, "//evil.example/steal");
  expect(new URL(page.url()).origin).toBe(new URL(baseURL ?? "").origin);

  await page.goto("/app/profile");
  await page.getByLabel("Текущий пароль", { exact: true }).fill(initialPassword);
  await page.getByLabel("Новый пароль", { exact: true }).fill("12345678");
  await page.getByLabel("Повторите новый пароль", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Изменить пароль" }).click();
  await expect(page.locator('p[role=\"alert\"]')).toHaveText(
    "Пароль должен содержать минимум одну латинскую букву.",
  );

  await page.getByLabel("Текущий пароль", { exact: true }).fill(initialPassword);
  await page.getByLabel("Новый пароль", { exact: true }).fill(changedPassword);
  await page.getByLabel("Повторите новый пароль", { exact: true }).fill(changedPassword);
  await page.getByRole("button", { name: "Изменить пароль" }).click();
  await expect(page.getByText(/Пароль изменён/u)).toBeVisible();

  await logout(page);
  await login(page, changedPassword);
  await logout(page);

  await page.goto("/auth/recovery");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  const recoveryLink = await waitForRecoveryLink();
  await page.goto(recoveryLink);
  await expect(page).toHaveURL(/\/auth\/update-password$/u);

  await page.getByLabel("Новый пароль", { exact: true }).fill("abcdefg");
  await page.getByLabel("Подтвердите новый пароль", { exact: true }).fill("abcdefg");
  await page.getByRole("button", { name: "Сохранить пароль" }).click();
  await expect(page.locator('p[role=\"alert\"]')).toHaveText(
    "Пароль должен содержать от 8 до 128 символов.",
  );

  await page.getByLabel("Новый пароль", { exact: true }).fill(recoveredPassword);
  await page.getByLabel("Подтвердите новый пароль", { exact: true }).fill("mismatchletters");
  await page.getByRole("button", { name: "Сохранить пароль" }).click();
  await expect(page.locator('p[role=\"alert\"]')).toHaveText("Пароли не совпадают.");

  await page.getByLabel("Подтвердите новый пароль", { exact: true }).fill(recoveredPassword);
  await page.getByRole("button", { name: "Сохранить пароль" }).click();
  await expect(page).toHaveURL(/\/app$/u);
  await logout(page);
  await login(page, recoveredPassword);

  await page.setViewportSize({ width: 1280, height: 800 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(hydrationErrors).toEqual([]);
});
