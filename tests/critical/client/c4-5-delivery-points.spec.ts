import { expect, test } from "@playwright/test";

import { makeDeliveryPointData } from "../../fixtures/test-data";
import { loginAs } from "../../helpers/auth";

test.describe("C.4.5 - Registrar puntos de entrega", () => {
  test("registra un nuevo punto de entrega con datos unicos", async ({ page }) => {
    const deliveryPoint = makeDeliveryPointData();

    await loginAs(page, "client");
    await page.goto("/client/mi-cuenta/puntos-de-entrega");

    await expect(
      page.getByRole("heading", { name: /^Puntos de entrega$/i }),
    ).toBeVisible();
    await page.getByLabel(/Localidad/i).fill(deliveryPoint.city);
    await page.getByLabel(/^Calle$/i).fill(deliveryPoint.street);
    await page.getByLabel(/N.mero/i).fill(deliveryPoint.number);
    await page.getByLabel(/Indicaciones/i).fill(deliveryPoint.indications);
    await page.getByRole("button", { name: /Guardar punto/i }).click();

    await expect(page.getByText(/Punto guardado/i)).toBeVisible({
      timeout: 20_000,
    });
  });
});
