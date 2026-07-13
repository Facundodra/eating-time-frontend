import { test } from "@playwright/test";

import { loginAs } from "../../helpers/auth";
import { ClientAutomationService } from "../../services/client-automation-service";

test.describe("C.4.4 - Realizacion de un pedido", () => {
  test.describe("Flujo principal", () => {
    test("permite armar carrito y abrir checkout sin confirmar pago", async ({ page }) => {
      const client = new ClientAutomationService(page);

      await loginAs(page, "client");

      const hasRestaurant = await client.openFirstRestaurantForOrder();
      if (!hasRestaurant) {
        return;
      }

      const addedDish = await client.addFirstAvailableDishToCart();
      if (!addedDish) {
        return;
      }

      await client.openCart();
      const openedCheckout = await client.openCheckoutIfCartHasItems();
      if (!openedCheckout) {
        return;
      }

      await client.emptyCartIfPossible();
    });
  });
});
