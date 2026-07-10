import { expect, test } from "@playwright/test";

import { loginAs } from "../../helpers/auth";

test.describe("C.3.4 - Gestion de estado y disponibilidad del local", () => {
  test.describe("Flujo principal", () => {
    test("muestra los controles de servicio manual del local", async ({ page }) => {
      await loginAs(page, "restaurant");
      await page.goto("/restaurant/schedules");

      await expect(page.getByText(/Siempre abierto/i)).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(/Fuera de servicio/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Cambiar fuera de servicio/i }),
      ).toBeVisible();
    });
  });
});
