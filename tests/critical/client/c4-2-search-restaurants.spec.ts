import { expect, test } from "@playwright/test";

import { searchData } from "../../fixtures/test-data";
import { expectResultsOrEmpty } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";
import { restaurantCards } from "../../helpers/navigation";

test.describe("C.4.2 - Busqueda y listado de locales", () => {
  test("lista, ordena y filtra locales", async ({ page }) => {
    await loginAs(page, "client");
    await page.goto("/client/restaurant");

    await expect(page.getByPlaceholder(/Buscar local/i).first()).toBeVisible();
    await expectResultsOrEmpty(
      page,
      restaurantCards(page),
      /No hay locales|No se encontraron/i,
    );

    await page.getByLabel(/Ordenar locales/i).selectOption("nombre-asc");
    await page.getByLabel(/Filtrar locales por estado/i).selectOption("open");

    await expectResultsOrEmpty(
      page,
      restaurantCards(page),
      /No hay locales|No se encontraron/i,
    );

    await page.getByPlaceholder(/Buscar local/i).first().fill(
      searchData.impossibleRestaurantName,
    );

    await expect(page.getByText(/No hay locales|No se encontraron/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
