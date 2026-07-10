import { expect, test } from "@playwright/test";

import { isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

test.describe("C.3.3 - Definicion de horarios de disponibilidad", () => {
  test.describe("Flujo principal", () => {
    test("permite revisar la configuracion semanal de horarios", async ({ page }) => {
      await loginAs(page, "restaurant");
      await page.goto("/restaurant/schedules");

      await expect(
        page.getByRole("heading", { name: /Horarios y estado de servicio/i }),
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        page.getByRole("heading", { name: /^Estado de servicio$/i }),
      ).toBeVisible();
      const saveButton = page.getByRole("button", { name: /Guardar horarios/i });
      if (await isVisible(saveButton, 5_000)) {
        await expect(page.getByRole("heading", { name: /Definici.n de horarios/i })).toBeVisible();
        await expect(saveButton).toBeVisible();
        return;
      }

      await expect(page.getByText(/Siempre abierto/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Cambiar siempre abierto/i }),
      ).toBeVisible();
    });
  });
});
