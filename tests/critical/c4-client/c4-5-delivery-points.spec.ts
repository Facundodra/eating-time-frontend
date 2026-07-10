import { test } from "@playwright/test";

import { makeDeliveryPointData } from "../../fixtures/test-data";
import { loginAs } from "../../helpers/auth";
import { ClientAutomationService } from "../../services/client-automation-service";

test.describe("C.4.5 - Registrar puntos de entrega", () => {
  test.describe("Flujo principal", () => {
    test("registra un nuevo punto de entrega con datos unicos", async ({ page }) => {
      const client = new ClientAutomationService(page);
      const deliveryPoint = makeDeliveryPointData();

      await loginAs(page, "client");
      await client.createDeliveryPoint(deliveryPoint);
      await client.expectDeliveryPointSaved();
    });
  });
});
