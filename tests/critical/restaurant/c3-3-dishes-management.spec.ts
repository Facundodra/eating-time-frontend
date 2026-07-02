import { expect, test } from "@playwright/test";

import { isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

test.describe("C.3.3 - Gestion de platos", () => {
  test("muestra listado y formulario de alta o edicion de platos", async ({ page }) => {
    await loginAs(page, "restaurant");
    await page.goto("/restaurant/dishes");

    await expect(page.getByRole("heading", { name: /^Platos$/i })).toBeVisible({
      timeout: 20_000,
    });

    const newDishButton = page.getByRole("button", { name: /Nuevo plato/i }).first();
    if (await isVisible(newDishButton, 20_000)) {
      await newDishButton.click();
    }

    await expect(page.getByText(/Nuevo plato|Detalle del plato/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/^Nombre$/i).first()).toBeVisible();
    await expect(page.getByText(/Precio/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Crear plato|Guardar cambios/i }).first(),
    ).toBeVisible();
  });
});
