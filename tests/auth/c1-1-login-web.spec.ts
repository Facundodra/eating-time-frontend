import { expect, test } from "@playwright/test";

import { fillLoginForm, loginAs } from "../helpers/auth";
import { testUsers, type TestUserRole } from "../fixtures/users";

const loginCases: Array<{
  expectedHeading: RegExp;
  expectedLink?: RegExp;
  role: TestUserRole;
  title: string;
}> = [
  {
    expectedHeading: /Top 10 locales/i,
    expectedLink: /Explorar locales/i,
    role: "client",
    title: "cliente",
  },
  {
    role: "restaurant",
    expectedHeading: /Inicio/i,
    title: "local",
  },
  {
    role: "admin",
    expectedHeading: /Inicio|Solicitudes de locales/i,
    title: "administrador",
  },
];

test.describe("C.1.1 - Inicio de sesion web", () => {
  for (const loginCase of loginCases) {
    test(`permite iniciar sesion como ${loginCase.title}`, async ({ page }) => {
      await loginAs(page, loginCase.role);

      if (loginCase.expectedLink) {
        await expect(
          page.locator("main").getByRole("link", { name: loginCase.expectedLink }),
        ).toBeVisible({ timeout: 20_000 });
      }

      await expect(
        page
          .locator("main")
          .getByRole("heading", { name: loginCase.expectedHeading })
          .first(),
      ).toBeVisible({ timeout: 20_000 });
    });
  }

  test("muestra error cuando las credenciales son incorrectas", async ({ page }) => {
    await fillLoginForm(page, testUsers.client.email, "password-incorrecta");

    await expect(page).toHaveURL(/\/login(?:$|[/?#])/);
    await expect(
      page.getByText(/credencial|incorrect|No se pudo|No fue posible/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
