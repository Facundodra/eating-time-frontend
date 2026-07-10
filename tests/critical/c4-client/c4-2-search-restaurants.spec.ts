import { test } from "@playwright/test";

import { searchData } from "../../fixtures/test-data";
import { loginAs } from "../../helpers/auth";
import { ClientAutomationService } from "../../services/client-automation-service";

test.describe("C.4.2 - Busqueda y listado de locales", () => {
  test.describe("Flujo principal", () => {
    test("lista, ordena y filtra locales", async ({ page }) => {
      const client = new ClientAutomationService(page);

      await loginAs(page, "client");
      await client.openRestaurantSearch();
      await client.expectRestaurantResultsOrEmpty();

      await client.sortRestaurantsByName();
      await client.filterOpenRestaurants();

      await client.expectRestaurantResultsOrEmpty();

      await client.searchRestaurant(searchData.impossibleRestaurantName);
      await client.expectNoRestaurantResults();
    });
  });
});
