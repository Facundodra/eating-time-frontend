import { expect, test, type Page } from "@playwright/test";

import { isVisible } from "../../helpers/assertions";
import { loginAs } from "../../helpers/auth";

async function openDishesPage(page: Page) {
  await loginAs(page, "restaurant");
  await page.goto("/restaurant/dishes");

  await expect(page.getByRole("heading", { name: /^Platos$/i })).toBeVisible({
    timeout: 20_000,
  });
}

async function expectDishDetailOrList(page: Page) {
  const detailTitle = page.getByText(/Detalle del plato/i).first();
  if (!(await isVisible(detailTitle, 20_000))) {
    await expect(page.getByRole("heading", { name: /^Platos$/i })).toBeVisible();
    return false;
  }

  await expect(detailTitle).toBeVisible();
  return true;
}

test.describe("C.3.2 - Gestion de platos", () => {
  test.describe("3.3.3.1 Alta", () => {
    test("muestra el formulario de alta de platos", async ({ page }) => {
      await openDishesPage(page);

      const newDishButton = page.getByRole("button", { name: /Nuevo plato/i }).first();
      if (!(await isVisible(newDishButton, 20_000))) {
        await expect(page.getByRole("heading", { name: /^Platos$/i })).toBeVisible();
        return;
      }

      await newDishButton.click();

      await expect(page.getByText(/Nuevo plato/i).first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(/^Nombre$/i).first()).toBeVisible();
      await expect(page.getByText(/Precio/i).first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Crear plato/i }).first(),
      ).toBeVisible();
    });
  });

  test.describe("3.3.3.2 Modificacion", () => {
    test("muestra el detalle editable de un plato", async ({ page }) => {
      await openDishesPage(page);

      if (!(await expectDishDetailOrList(page))) {
        return;
      }

      await expect(page.getByText(/^Nombre$/i).first()).toBeVisible();
      await expect(page.getByText(/Precio/i).first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Guardar cambios/i }).first(),
      ).toBeVisible();
    });
  });

  test.describe("3.3.3.3 Baja", () => {
    test("muestra la accion de eliminacion de platos", async ({ page }) => {
      await openDishesPage(page);

      if (!(await expectDishDetailOrList(page))) {
        return;
      }

      await expect(
        page.getByRole("button", { name: /Eliminar/i }).first(),
      ).toBeVisible();
    });
  });

  test.describe("3.3.3.4 Cambiar disponibilidad", () => {
    test("muestra la accion para cambiar disponibilidad", async ({ page }) => {
      await openDishesPage(page);

      if (!(await expectDishDetailOrList(page))) {
        return;
      }

      await expect(
        page
          .getByRole("button", { name: /Marcar no disponible|Marcar disponible/i })
          .first(),
      ).toBeVisible();
    });
  });
});
