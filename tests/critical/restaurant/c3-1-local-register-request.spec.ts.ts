import { expect, test } from "@playwright/test";

import { makeRestaurantRequestData } from "../../fixtures/test-data";

test.describe("C.3.1 - Solicitud de registro de local", () => {
  test("valida que se adjunte al menos una foto de referencia", async ({ page }) => {
    const request = makeRestaurantRequestData();

    await page.goto("/register/restaurant");

    await expect(
      page.getByRole("heading", { name: /Solicit/i }).first(),
    ).toBeVisible();
    await page.getByLabel(/Nombre del local/i).fill(request.name);
    await page.getByLabel(/Correo electr/i).fill(request.email);
    await page.getByLabel(/Tel/i).fill(request.phone);
    await page.getByLabel(/Direcci/i).fill(request.address);
    await page.getByLabel(/Descripci/i).fill(request.description);
    await page.getByRole("button", { name: /Enviar solicitud/i }).click();

    await expect(page.getByText(/subir al menos una foto/i)).toBeVisible();
  });
});
