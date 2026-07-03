import { test } from "@playwright/test";

import { searchData } from "../../fixtures/test-data";
import { loginAs } from "../../helpers/auth";
import { ClientAutomationService } from "../../services/client-automation-service";

test.describe("C.4.3 - Busqueda y listado de platos y descuentos", () => {
  test("permite ordenar y filtrar platos con descuento", async ({ page }) => {
    const client = new ClientAutomationService(page);

    await loginAs(page, "client");
    await client.openDishSearch();
    await client.sortDishesByLowestPrice();
    await client.filterDiscountedDishes();
    await client.expectDishResultsOrEmpty();

    await client.searchDish(searchData.impossibleDishName);
    await client.expectNoDishResults();
  });
});
