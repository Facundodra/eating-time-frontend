import { expect, test } from "@playwright/test";

import { isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

test.describe("C.3.8 - Rechazo de un pedido", () => {
  test.describe("Flujo principal", () => {
    test("abre el modal de rechazo cuando hay pedidos pendientes", async ({ page }) => {
      await loginAs(page, "restaurant");
      await page.goto("/restaurant/workbench");
      await expect(page.getByRole("heading", { name: /Pendiente confirm/i })).toBeVisible({
        timeout: 20_000,
      });

      const rejectButton = page.getByLabel(/Mover pedido a rechazado/i).first();
      if (!(await isVisible(rejectButton, 5_000))) {
        return;
      }

      await rejectButton.click();
      await expect(page.getByRole("heading", { name: /Rechazar pedido/i })).toBeVisible();
      await expect(page.getByLabel(/Motivo de rechazo/i)).toBeVisible();
      await page.getByRole("button", { name: /Cancelar|Cerrar/i }).first().click();
    });
  });
});
