import { expect, test } from "@playwright/test";

import {
  loginAs,
  logoutFromClientHeader,
  logoutFromSideNav,
} from "../helpers/auth";

test.describe("C.1.3 - Cierre de sesion", () => {
  test("permite cerrar sesion desde el perfil del cliente", async ({ page }) => {
    await loginAs(page, "client");

    await logoutFromClientHeader(page);

    await expect(page.getByRole("heading", { name: /Iniciar sesi/i })).toBeVisible();
  });

  test("permite cerrar sesion desde el panel del local", async ({ page }) => {
    await loginAs(page, "restaurant");

    await logoutFromSideNav(page);

    await expect(page.getByRole("heading", { name: /Iniciar sesi/i })).toBeVisible();
  });
});
