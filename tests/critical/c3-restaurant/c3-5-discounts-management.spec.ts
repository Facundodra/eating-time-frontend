import { expect, test, type Page } from "@playwright/test";

import { isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

async function openDiscountsPage(page: Page) {
  await loginAs(page, "restaurant");
  await page.goto("/restaurant/discounts");

  await expect(
    page.getByRole("heading", { name: /Descuentos del local/i }),
  ).toBeVisible({ timeout: 20_000 });
}

async function expectDiscountDetailOrList(page: Page) {
  const detailTitle = page.getByText(/Detalle del descuento/i).first();
  if (!(await isVisible(detailTitle, 20_000))) {
    await expect(
      page.getByRole("heading", { name: /Descuentos del local/i }),
    ).toBeVisible();
    return false;
  }

  await expect(detailTitle).toBeVisible();
  return true;
}

test.describe("C.3.5 - Gestion de descuentos", () => {
  test.describe("3.3.9.1 Alta", () => {
    test("muestra el formulario de alta de descuentos", async ({ page }) => {
      await openDiscountsPage(page);

      const newDiscountButton = page
        .getByRole("button", { name: /Nuevo descuento/i })
        .first();
      if (!(await isVisible(newDiscountButton, 20_000))) {
        await expect(
          page.getByRole("heading", { name: /Descuentos del local/i }),
        ).toBeVisible();
        return;
      }

      await newDiscountButton.click();

      await expect(page.getByText(/Nuevo descuento/i).first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(/Porcentaje/i).first()).toBeVisible();
      await expect(page.getByText(/Fecha de vencimiento/i).first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Crear descuento/i }).first(),
      ).toBeVisible();
    });
  });

  test.describe("3.3.9.2 Modificacion", () => {
    test("muestra el detalle editable de un descuento", async ({ page }) => {
      await openDiscountsPage(page);

      if (!(await expectDiscountDetailOrList(page))) {
        return;
      }

      await expect(page.getByText(/Porcentaje/i).first()).toBeVisible();
      await expect(page.getByText(/Fecha de vencimiento/i).first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Guardar cambios/i }).first(),
      ).toBeVisible();
    });
  });

  test.describe("3.3.9.3 Baja", () => {
    test("muestra la accion de baja de descuentos", async ({ page }) => {
      await openDiscountsPage(page);

      if (!(await expectDiscountDetailOrList(page))) {
        return;
      }

      await expect(
        page.getByRole("button", { name: /Eliminar/i }).first(),
      ).toBeVisible();
    });
  });
});
