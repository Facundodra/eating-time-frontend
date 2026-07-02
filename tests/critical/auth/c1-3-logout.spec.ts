import { expect, test } from "@playwright/test";

import { loginAs, logoutFromClientHeader } from "../../helpers/auth";

test.describe("Critico C.1.3 - Cierre de sesion", () => {
  test("cierra la sesion activa y vuelve al login", async ({ page }) => {
    await loginAs(page, "client");
    await logoutFromClientHeader(page);

    await expect(page.getByRole("heading", { name: /Iniciar sesi/i })).toBeVisible();
  });
});
