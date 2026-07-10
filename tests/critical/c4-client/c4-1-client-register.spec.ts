import { test } from "@playwright/test";

import { makeClientRegistrationData } from "../../fixtures/test-data";
import { ClientAutomationService } from "../../services/client-automation-service";

test.describe("C.4.1 - Creacion de cuenta de usuario", () => {
  test.describe("Flujo principal", () => {
    test("registra un cliente con datos unicos", async ({ page }) => {
      const clientService = new ClientAutomationService(page);
      const client = makeClientRegistrationData();

      await clientService.registerClient(client);
      await clientService.expectRegistrationSuccess();
    });
  });

  test.describe("Flujo alternativo A - Datos invalidos", () => {
    test("valida que las contrasenas coincidan", async ({ page }) => {
      const client = new ClientAutomationService(page);

      await client.openRegistration();
      await client.assertPasswordMismatch("12345678", "87654321");
    });
  });
});
