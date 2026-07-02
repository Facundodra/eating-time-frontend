import { expect, test } from "@playwright/test";

test.describe("C.3.2 - Confirmacion de local", () => {
  test("valida contrasenas antes de confirmar la cuenta", async ({ page }) => {
    await page.goto("/register/restaurant/confirmation");

    await expect(
      page.getByRole("heading", { name: /Confirm/i }).first(),
    ).toBeVisible();
    await page.getByLabel(/Codigo|C.digo/i).fill("codigo-invalido-e2e");
    await page.getByLabel(/^Contrase/i).fill("12345678");
    await page.getByLabel(/Confirmar contrase/i).fill("87654321");
    await page.getByRole("button", { name: /Confirmar cuenta/i }).click();

    await expect(page.getByText(/no coinciden/i)).toBeVisible();
  });
});
