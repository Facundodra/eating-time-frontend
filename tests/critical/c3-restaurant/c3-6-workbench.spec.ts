import { expect, test } from "@playwright/test";

import { loginAs } from "../../helpers/auth";

test.describe("C.3.6 - Mesa de trabajo", () => {
  test.describe("Flujo principal", () => {
    test("muestra pedidos de las ultimas 24 horas organizados por estado", async ({ page }) => {
      await loginAs(page, "restaurant");
      await page.goto("/restaurant/workbench");

      await expect(page.getByRole("heading", { name: /Mesa de trabajo/i })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("heading", { name: /Pendiente confirm/i })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("heading", { name: /^Aceptado$/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /^En curso$/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /^En camino$/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /^Finalizado$/i })).toBeVisible();
    });
  });
});
