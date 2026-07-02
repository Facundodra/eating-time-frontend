import { expect, test } from "@playwright/test";

import { searchData } from "../../fixtures/test-data";
import { expectResultsOrEmpty } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

function dishCards(page: import("@playwright/test").Page) {
  return page.locator('main a[href*="dishId="]');
}

test.describe("C.4.3 - Busqueda y listado de platos y descuentos", () => {
  test("permite ordenar y filtrar platos con descuento", async ({ page }) => {
    await loginAs(page, "client");
    await page.goto("/client/dishes");

    await expect(page.getByPlaceholder(/Buscar plato/i).first()).toBeVisible();
    await expect(page.getByLabel(/Ordenar platos/i).first()).toBeVisible();

    await page.getByLabel(/Ordenar platos/i).first().selectOption("precio-asc");
    await page.getByRole("button", { name: /Con descuento/i }).first().click();

    await expectResultsOrEmpty(
      page,
      dishCards(page),
      /No se encontraron resultados|No se encontraron platos|No hay platos/i,
    );

    await page.getByPlaceholder(/Buscar plato/i).first().fill(
      searchData.impossibleDishName,
    );

    await expect(
      page
        .getByText(/No se encontraron resultados|No se encontraron platos|No hay platos/i)
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
