import { expect, test } from "@playwright/test";

import { expectResultsOrEmpty, isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";
import {
  openFirstRestaurantFromList,
  restaurantCards,
} from "../../helpers/navigation";

test.describe("C.4.4 - Realizacion de un pedido", () => {
  test("permite armar carrito y abrir checkout sin confirmar pago", async ({ page }) => {
    await loginAs(page, "client");
    await page.goto("/client/restaurant");

    const hasRestaurant = await openFirstRestaurantFromList(page);
    if (!hasRestaurant) {
      await expectResultsOrEmpty(
        page,
        restaurantCards(page),
        /No hay locales|No se encontraron/i,
      );
      return;
    }

    await expect(page.getByRole("heading", { name: /Platos disponibles/i })).toBeVisible({
      timeout: 20_000,
    });

    const addButton = page.getByRole("button", { name: /Agregar/i }).first();
    if (!(await isVisible(addButton, 20_000))) {
      await expect(
        page.getByText(/No se encontraron resultados|No hay platos/i).first(),
      ).toBeVisible();
      return;
    }

    await addButton.click();
    await page.getByRole("link", { name: /Ver carrito/i }).click();

    await expect(page.getByRole("heading", { name: /Tu carrito/i })).toBeVisible({
      timeout: 20_000,
    });

    if (await isVisible(page.getByText(/Tu carrito est/i).first(), 5_000)) {
      return;
    }

    await page.getByRole("button", { name: /Realizar pedido/i }).click();
    await expect(page.getByText(/Direccion de entrega|Direcci/i).first()).toBeVisible({
      timeout: 20_000,
    });

    const emptyCartButton = page.getByRole("button", { name: /Vaciar carrito/i });
    if (await isVisible(emptyCartButton, 5_000)) {
      await emptyCartButton.click();
      await expect(page.getByText(/Tu carrito est/i)).toBeVisible({
        timeout: 20_000,
      });
    }
  });
});
