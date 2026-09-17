import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("foundation shell renders without accessibility violations", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "AI Wardrobe" })).toBeVisible();
  await expect(page.getByText("Phase 7 — Auth Foundation")).toBeVisible();
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/icon.svg");

  const icon = await page.request.get("/icon.svg");
  expect(icon.ok()).toBeTruthy();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("health route exposes no configuration values", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({
    status: "ok",
    environment: "test",
    configuration: "valid",
  });
});

test("production shell applies security headers and hides the development lab", async ({
  request,
}) => {
  const root = await request.get("/");
  expect(root.headers()["x-content-type-options"]).toBe("nosniff");
  expect(root.headers()["x-frame-options"]).toBe("DENY");
  expect(root.headers()["referrer-policy"]).toBe("no-referrer");
  expect(root.headers()["permissions-policy"]).toContain("camera=()");

  const developmentLab = await request.get("/dev/ui");
  expect(developmentLab.status()).toBe(404);
});
