import { test, expect } from "@playwright/test";

test("landing page loads for signed-out visitors", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /encuentra en qué plataforma ver cada título/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/inicia sesión y personaliza tus servicios/i),
  ).toBeVisible();
});
