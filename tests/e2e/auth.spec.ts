import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { combineChunks, createChunks, stringFromBase64URL, stringToBase64URL } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test.describe.configure({ mode: "serial" });

const suffix = randomUUID();
const emailA = `phase7-a-${suffix}@example.test`;
const emailB = `phase7-b-${suffix}@example.test`;
const passwordA = "phase7-password-a";
const passwordB = "phase7-password-b";
const replacementPassword = "phase7-password-a-replaced";
const mailpitUrl = "http://127.0.0.1:54324";
let accountA = "";
let authCookieName = "";

type StoredAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  [key: string]: unknown;
};

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

async function removeIdentity(userId: string) {
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
}

async function signUp(page: Page, email: string, password: string) {
  await page.goto("/auth");
  const form = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Создать аккаунт" }) });
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Пароль").fill(password);
  await form.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/app$/u);
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/auth");
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Войти" }) });
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Пароль").fill(password);
  await form.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/app$/u);
  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/auth\?status=signed-out$/u);
}

async function readAuthSession(context: BrowserContext) {
  const cookies = await context.cookies();
  const authCookie = cookies.find(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
  );
  expect(authCookie).toBeTruthy();
  const baseName = authCookie?.name.replace(/\.\d+$/u, "") ?? "";
  const encoded = await combineChunks(
    baseName,
    (name) => cookies.find((cookie) => cookie.name === name)?.value,
  );
  expect(encoded?.startsWith("base64-")).toBeTruthy();
  const session = JSON.parse(
    stringFromBase64URL(encoded?.slice("base64-".length) ?? ""),
  ) as StoredAuthSession;
  return { baseName, session };
}

async function writeAuthSession(
  context: BrowserContext,
  baseURL: string,
  baseName: string,
  session: StoredAuthSession,
) {
  const existing = await context.cookies();
  for (const cookie of existing.filter(
    ({ name }) => name === baseName || name.startsWith(`${baseName}.`),
  )) {
    await context.clearCookies({ name: cookie.name });
  }
  const encoded = `base64-${stringToBase64URL(JSON.stringify(session))}`;
  await context.addCookies(
    createChunks(baseName, encoded).map(({ name, value }) => ({
      name,
      value,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax" as const,
    })),
  );
}

async function waitForRecoveryLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await fetch(`${mailpitUrl}/api/v1/messages`);
    if (response.ok) {
      const payload = (await response.json()) as { messages?: MailpitMessage[] };
      const message = payload.messages?.find(({ To }) =>
        To?.some(({ Address }) => Address?.toLowerCase() === email.toLowerCase()),
      );
      if (message) {
        const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
        if (detailResponse.ok) {
          const detail = (await detailResponse.json()) as { HTML?: string; Text?: string };
          const body = `${detail.HTML ?? ""}\n${detail.Text ?? ""}`.replaceAll("&amp;", "&");
          const links = body.match(/https?:\/\/[^\s"'<>]+/gu) ?? [];
          const recoveryLink = links.find((link) => link.includes("/auth/v1/verify"));
          if (recoveryLink) return recoveryLink;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Recovery email was not delivered for ${email}`);
}

test.afterAll(async () => {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const user of data.users.filter(
    (candidate) => candidate.email === emailA || candidate.email === emailB,
  )) {
    await removeIdentity(user.id);
  }
});

test("anonymous visitors cannot read the protected shell", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth\?next=%2Fapp$/u);
  await expect(page.getByRole("heading", { name: "Ваш приватный гардероб" })).toBeVisible();
});

test("User A signs up, receives an isolated account, and logout clears local state", async ({
  page,
}) => {
  await signUp(page, emailA, passwordA);
  await expect(page.getByText("Защищённая сессия")).toBeVisible();
  const response = await page.request.get("/api/account");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["cache-control"]).toContain("private");
  expect(response.headers()["cache-control"]).toContain("no-store");
  const payload = await response.json();
  accountA = payload.account.id;
  expect(accountA).toBeTruthy();
  await page.evaluate(() => localStorage.setItem("ai-wardrobe:e2e", "private"));
  await logout(page);
  expect(await page.evaluate(() => localStorage.getItem("ai-wardrobe:e2e"))).toBeNull();
});

test("User B cannot select User A account through client input", async ({ page }) => {
  await signUp(page, emailB, passwordB);
  const response = await page.request.get(`/api/account?account_id=${accountA}`);
  const payload = await response.json();
  expect(response.ok()).toBeTruthy();
  expect(payload.account.id).not.toBe(accountA);
  expect(payload.account.email).toBe(emailB);
  await logout(page);
});

test("same-profile account switches clear state across tabs and closed tabs", async ({
  page,
  context,
}) => {
  await login(page, emailA, passwordA);
  await page.evaluate(() => localStorage.setItem("ai-wardrobe:same-tab", "user-a-private"));
  await login(page, emailB, passwordB);
  expect(await page.evaluate(() => localStorage.getItem("ai-wardrobe:same-tab"))).toBeNull();

  await login(page, emailA, passwordA);
  await page.evaluate(() => localStorage.setItem("ai-wardrobe:closed-tab", "user-a-private"));
  const newTab = await context.newPage();
  await newTab.goto("/app");
  await expect(newTab.getByText(emailA)).toBeVisible();
  expect(await newTab.evaluate(() => localStorage.getItem("ai-wardrobe:closed-tab"))).toBe(
    "user-a-private",
  );
  await page.close();
  await newTab.close();

  const afterClose = await context.newPage();
  await login(afterClose, emailB, passwordB);
  expect(
    await afterClose.evaluate(() => localStorage.getItem("ai-wardrobe:closed-tab")),
  ).toBeNull();
  await logout(afterClose);
});

test("persisted profile state is isolated after a browser-context restart", async ({
  browser,
  baseURL,
}) => {
  expect(baseURL).toBeTruthy();
  const firstContext = await browser.newContext({ baseURL });
  const firstPage = await firstContext.newPage();
  await login(firstPage, emailA, passwordA);
  await firstPage.evaluate(() => localStorage.setItem("ai-wardrobe:restart", "user-a-private"));
  const storageState = await firstContext.storageState();
  await firstContext.close();

  const restartedContext = await browser.newContext({ baseURL, storageState });
  try {
    const restartedPage = await restartedContext.newPage();
    await login(restartedPage, emailB, passwordB);
    expect(
      await restartedPage.evaluate(() => localStorage.getItem("ai-wardrobe:restart")),
    ).toBeNull();
    await logout(restartedPage);
  } finally {
    await restartedContext.close();
  }
});

test("a hostile Origin cannot invoke the real login Server Action", async ({ page }) => {
  let intercepted = false;
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() === "POST" && request.headers()["next-action"]) {
      intercepted = true;
      await route.continue({ headers: { ...request.headers(), origin: "https://evil.example" } });
      return;
    }
    await route.continue();
  });

  await page.goto("/auth");
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Войти" }) });
  await form.getByLabel("Email").fill(emailA);
  await form.getByLabel("Пароль").fill(passwordA);
  await form.getByRole("button", { name: "Войти" }).click();
  await expect.poll(() => intercepted).toBe(true);
  await expect(page).toHaveURL(/\/auth/u);
  expect((await page.request.get("/api/account")).status()).toBe(401);
});

test("real recovery email completes PKCE callback and replaces the password", async ({ page }) => {
  await page.goto("/auth/recovery");
  await page.getByLabel("Email").fill("unknown@example.test");
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  const unknownMessage = await page.getByRole("status").textContent();

  await page.goto("/auth/recovery");
  await page.getByLabel("Email").fill(emailA);
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(page.getByRole("status")).toHaveText(unknownMessage ?? "");

  const recoveryLink = await waitForRecoveryLink(emailA);
  const callbackRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === "/auth/callback" && url.searchParams.has("code");
  });
  await page.goto(recoveryLink);
  await callbackRequest;
  await expect(page).toHaveURL(/\/auth\/update-password$/u);
  expect(new URL(page.url()).searchParams.has("code")).toBe(false);
  await page.getByLabel("Новый пароль").fill(replacementPassword);
  await page.getByRole("button", { name: "Сохранить пароль" }).click();
  await expect(page).toHaveURL(/\/app$/u);
  await logout(page);

  await login(page, emailA, replacementPassword);
  await logout(page);
});

test("expired access tokens rotate cookies and invalid refresh tokens lose access", async ({
  page,
  context,
  baseURL,
}) => {
  expect(baseURL).toBeTruthy();
  await login(page, emailA, replacementPassword);
  const before = await readAuthSession(context);
  authCookieName = before.baseName;
  await writeAuthSession(context, baseURL ?? "", before.baseName, {
    ...before.session,
    expires_at: 1,
    expires_in: 0,
  });

  const protectedResponse = await page.goto("/app");
  expect(protectedResponse?.headers()["cache-control"]).toContain("private");
  expect(protectedResponse?.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByText(emailA)).toBeVisible();
  const refreshed = await readAuthSession(context);
  expect(refreshed.session.access_token).not.toBe(before.session.access_token);
  expect(refreshed.session.refresh_token).not.toBe(before.session.refresh_token);

  await page.evaluate(() => localStorage.setItem("ai-wardrobe:expired", "user-a-private"));
  await writeAuthSession(context, baseURL ?? "", refreshed.baseName, {
    ...refreshed.session,
    expires_at: 1,
    expires_in: 0,
    refresh_token: `synthetic-invalid-${randomUUID()}`,
  });
  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth\?next=%2Fapp$/u);
  await expect(page.getByText(emailA)).toHaveCount(0);
  expect((await page.request.get("/api/account")).status()).toBe(401);

  await login(page, emailB, passwordB);
  expect(await page.evaluate(() => localStorage.getItem("ai-wardrobe:expired"))).toBeNull();
  await logout(page);
});

test("a revoked User A session is isolated before User B binds", async ({ page }) => {
  await login(page, emailA, replacementPassword);
  await page.evaluate(() => localStorage.setItem("ai-wardrobe:revoked", "user-a-private"));

  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = data.users.find((candidate) => candidate.email === emailA);
  expect(user).toBeTruthy();
  await removeIdentity(user?.id ?? "");

  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth\?next=%2Fapp$/u);
  await expect(page.getByText(emailA)).toHaveCount(0);
  await login(page, emailB, passwordB);
  expect(await page.evaluate(() => localStorage.getItem("ai-wardrobe:revoked"))).toBeNull();
  await logout(page);
});

test("callback redirects ignore spoofed headers and malformed sessions expose no data", async ({
  page,
  context,
  baseURL,
}) => {
  const callback = await page.request.get("/auth/callback?code=invalid-code", {
    headers: {
      host: "evil.example",
      "x-forwarded-host": "evil.example",
      "x-forwarded-proto": "http",
    },
    maxRedirects: 0,
  });
  expect(callback.status()).toBe(307);
  expect(new URL(callback.headers().location).origin).toBe(new URL(baseURL ?? "").origin);

  await context.clearCookies();
  await context.addCookies([
    { name: authCookieName, value: "invalid-session", domain: "127.0.0.1", path: "/" },
  ]);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth\?next=%2Fapp$/u);
  await expect(page.getByText(emailA)).toHaveCount(0);
  const response = await page.request.get("/api/account");
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: "unauthenticated" });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
