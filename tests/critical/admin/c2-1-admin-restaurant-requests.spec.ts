import { expect, test } from "@playwright/test";

import { isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

test.describe("C.2.1 - Aprobacion o rechazo de locales", () => {
  test("permite revisar solicitudes de locales sin procesarlas", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/requests");

    await expect(page.getByRole("heading", { name: /Solicitudes de locales/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("searchbox", { name: /Nombre del local/i })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: /Email/i })).toBeVisible();

    const main = page.locator("main");
    const detailLink = main.getByRole("link", { name: /Ver solicitud/i }).first();
    if (!(await isVisible(detailLink, 15_000))) {
      await expect(main.getByRole("columnheader", { name: /Local/i })).toBeVisible();
      await expect(main.getByRole("columnheader", { name: /Contacto/i })).toBeVisible();
      return;
    }

    await detailLink.click();

    await expect(page.getByText(/Acciones administrativas/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Nombre del local/i)).toBeVisible();

    const processedMessage = page.getByText(/Esta solicitud ya fue procesada/i);
    if (await isVisible(processedMessage, 5_000)) {
      await expect(processedMessage).toBeVisible();
      return;
    }

    await expect(
      page.getByRole("button", { name: /Aprobar solicitud/i }),
    ).toBeVisible();
  });
});
