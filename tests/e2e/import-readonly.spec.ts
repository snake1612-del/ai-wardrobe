import { expect, test } from "@playwright/test";

const unknownSession = "00000000-0000-4000-8000-000000000001";

test("Bulk Import remains private on desktop and mobile without uploading or confirming", async ({
  page,
}) => {
  await page.goto("/app/import");
  await expect(page).toHaveURL(/\/auth/u);
  await expect(page.getByRole("heading", { name: "Войти" })).toBeVisible();

  const progress = await page.request.get(`/api/import/sessions/${unknownSession}/progress`);
  expect(progress.status()).toBe(401);
  expect(progress.headers()["cache-control"]).toContain("no-store");
  expect(progress.headers()["x-content-type-options"]).toBe("nosniff");

  const retry = await page.request.post(`/api/import/sessions/${unknownSession}/retry-prepare`, {
    headers: { Origin: "https://hostile.example" },
    data: { expectedVersion: 1 },
  });
  expect(retry.status()).toBe(403);
  expect(retry.headers()["cache-control"]).toContain("no-store");
  expect(retry.headers()["x-content-type-options"]).toBe("nosniff");
});
