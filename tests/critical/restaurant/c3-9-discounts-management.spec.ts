import { expect, test } from "@playwright/test";

import { isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

test.describe("C.3.9 - Gestion de descuentos", () => {
  test("muestra listado y formulario de alta o edicion de descuentos", async ({ page }) => {
    await loginAs(page, "restaurant");
    await page.goto("/restaurant/discounts");

    await expect(
      page.getByRole("heading", { name: /Descuentos del local/i }),
    ).toBeVisible({ timeout: 20_000 });

    const newDiscountButton = page.getByRole("button", { name: /Nuevo descuento/i }).first();
    if (await isVisible(newDiscountButton, 20_000)) {
      await newDiscountButton.click();
    }

    await expect(page.getByText(/Nuevo descuento|Detalle del descuento/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Porcentaje/i).first()).toBeVisible();
    await expect(page.getByText(/Fecha de vencimiento/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Crear descuento|Guardar cambios/i }).first(),
    ).toBeVisible();
  });
});
