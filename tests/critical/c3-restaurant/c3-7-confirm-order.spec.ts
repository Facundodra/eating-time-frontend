import { expect, test } from "@playwright/test";

import { isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

test.describe("C.3.7 - Confirmacion de un pedido", () => {
  test.describe("Flujo principal", () => {
    test("abre el modal de aceptacion cuando hay pedidos pendientes", async ({ page }) => {
      await loginAs(page, "restaurant");
      await page.goto("/restaurant/workbench");
      await expect(page.getByRole("heading", { name: /Pendiente confirm/i })).toBeVisible({
        timeout: 20_000,
      });

      const acceptButton = page.getByLabel(/Mover pedido a Aceptado/i).first();
      if (!(await isVisible(acceptButton, 5_000))) {
        return;
      }

      await acceptButton.click();
      await expect(page.getByRole("heading", { name: /Aceptar pedido/i })).toBeVisible();
      await expect(page.getByLabel(/Tiempo estimado/i)).toBeVisible();
      await page.getByRole("button", { name: /Cancelar|Cerrar/i }).first().click();
    });
  });
});
