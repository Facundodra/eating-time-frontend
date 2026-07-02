import { expect, test } from "@playwright/test";

import { loginAs } from "../../helpers/auth";

test.describe("Critico C.1.1 - Inicio de sesion web", () => {
  test("autentica al cliente y redirige a su pantalla principal", async ({ page }) => {
    await loginAs(page, "client");

    await expect(
      page
        .locator("main")
        .getByRole("link", { name: /Explorar locales/i })
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
