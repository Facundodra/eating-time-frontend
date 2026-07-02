import { expect, type Page } from "@playwright/test";

import { makeClientRegistrationData } from "../fixtures/test-data";
import { testUsers, type TestUserRole } from "../fixtures/users";

const roleHomePath: Record<TestUserRole, string> = {
  admin: "/admin",
  client: "/client",
  restaurant: "/restaurant",
};

type LoginResult = "success" | "error" | "timeout";

let runtimeClientUser: { email: string; password: string } | null = null;
const usesExplicitClientCredentials =
  Boolean(process.env.E2E_CLIENT_EMAIL) || Boolean(process.env.E2E_CLIENT_PASSWORD);

function pathRegex(path: string) {
  return new RegExp(`${path.replaceAll("/", "\\/")}(?:$|[/?#])`);
}

export async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Iniciar sesi/i })).toBeVisible();
  await page.getByLabel(/Correo electr/i).fill(email);
  await page.getByLabel(/Contrase/i).fill(password);
  await page.getByRole("button", { name: /Ingresar/i }).click();
}

async function waitForLoginResult(
  page: Page,
  role: TestUserRole,
  timeout = 30_000,
): Promise<LoginResult> {
  const success = page
    .waitForURL(pathRegex(roleHomePath[role]), { timeout })
    .then(() => "success" as const)
    .catch(() => "timeout" as const);
  const error = page
    .getByText(/credenciales incorrectas|no se pudo|no tenes permiso|revisa los datos/i)
    .first()
    .waitFor({ state: "visible", timeout })
    .then(() => "error" as const)
    .catch(() => "timeout" as const);

  return Promise.race([success, error]);
}

async function registerRuntimeClient(page: Page) {
  const client = makeClientRegistrationData();

  await page.goto("/register/client");
  await page.getByLabel(/Nombre y apellido/i).fill(client.name);
  await page.getByLabel(/Documento de identidad/i).fill(client.document);
  await page.getByLabel(/Telefono|Tel/i).fill(client.phone);
  await page.getByLabel(/Correo electr/i).fill(client.email);
  await page.getByLabel(/Contrase/i).first().fill(client.password);
  await page.getByLabel(/Confirmar contrase/i).fill(client.password);
  await page.getByRole("button", { name: /^Crear cuenta$/i }).click();
  await expect(page.getByText(/Cuenta creada exitosamente/i)).toBeVisible({
    timeout: 30_000,
  });

  runtimeClientUser = {
    email: client.email,
    password: client.password,
  };
}

async function attemptLogin(
  page: Page,
  role: TestUserRole,
  email: string,
  password: string,
) {
  await page.context().clearCookies();
  await fillLoginForm(page, email, password);

  return waitForLoginResult(page, role);
}

export async function loginAs(page: Page, role: TestUserRole) {
  const user = role === "client" && runtimeClientUser
    ? runtimeClientUser
    : testUsers[role];

  const result = await attemptLogin(page, role, user.email, user.password);
  if (result === "success") {
    return;
  }

  if (role !== "client" || usesExplicitClientCredentials) {
    throw new Error(
      `No se pudo iniciar sesion como ${role}. La pagina quedo en ${page.url()}.`,
    );
  }

  await registerRuntimeClient(page);
  if (!runtimeClientUser) {
    throw new Error("No se pudo generar el cliente E2E.");
  }

  const fallbackUser = runtimeClientUser;
  const fallbackResult = await attemptLogin(
    page,
    "client",
    fallbackUser.email,
    fallbackUser.password,
  );

  if (fallbackResult !== "success") {
    throw new Error("No se pudo iniciar sesion con el cliente E2E generado.");
  }
}

export async function logoutFromClientHeader(page: Page) {
  await page.getByLabel(/Abrir opciones de cuenta/i).click();
  await page.getByRole("link", { name: /Salir/i }).click();
  await expect(page).toHaveURL(/\/login(?:$|[/?#])/, { timeout: 20_000 });
}

export async function logoutFromSideNav(page: Page) {
  await page.locator("aside").first().hover();
  await page.getByRole("button", { name: /Cerrar sesi/i }).first().click();
  await expect(page).toHaveURL(/\/login(?:$|[/?#])/, { timeout: 20_000 });
}
