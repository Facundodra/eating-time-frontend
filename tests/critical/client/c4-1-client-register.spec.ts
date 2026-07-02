import { expect, test } from "@playwright/test";

import { makeClientRegistrationData } from "../../fixtures/test-data";

test.describe("C.4.1 - Creacion de cuenta de usuario", () => {
  test("valida que las contrasenas coincidan", async ({ page }) => {
    await page.goto("/register/client");

    await expect(
      page.getByRole("heading", { name: /Crear cuenta cliente/i }),
    ).toBeVisible();
    await page.getByLabel(/Contrase/i).first().fill("12345678");
    await page.getByLabel(/Confirmar contrase/i).fill("87654321");

    await expect(page.getByText(/no coinciden/i)).toBeVisible();
  });

  test("registra un cliente con datos unicos", async ({ page }) => {
    const client = makeClientRegistrationData();

    await page.goto("/register/client");
    await page.getByLabel(/Nombre y apellido/i).fill(client.name);
    await page.getByLabel(/Documento de identidad/i).fill(client.document);
    await page.getByLabel(/Telefono|Tel/i).fill(client.phone);
    await page.getByLabel(/Correo electr/i).fill(client.email);
    await page.getByLabel(/Contrase/i).first().fill(client.password);
    await page.getByLabel(/Confirmar contrase/i).fill(client.password);
    await page.getByRole("button", { name: /^Crear cuenta$/i }).click();

    await expect(page.getByText(/Cuenta creada exitosamente/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: /Inici/i })).toBeVisible();
  });
});
