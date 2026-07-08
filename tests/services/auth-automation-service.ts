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
const usesExplicitClientCredentials = Boolean(process.env.E2E_CLIENT_EMAIL);

function pathRegex(path: string) {
  return new RegExp(`${path.replaceAll("/", "\\/")}(?:$|[/?#])`);
}

export class AuthAutomationService {
  constructor(private readonly page: Page) {}

  async fillLoginForm(email: string, password: string) {
    await this.page.goto("/login");
    await expect(
      this.page.getByRole("heading", { name: /Iniciar sesi/i }),
    ).toBeVisible();
    await this.page.getByLabel(/Correo electr/i).fill(email);
    await this.page.getByLabel(/Contrase/i).fill(password);
    await this.page.getByRole("button", { name: /Ingresar/i }).click();
  }

  async loginAs(role: TestUserRole) {
    const user = role === "client" && runtimeClientUser
      ? runtimeClientUser
      : testUsers[role];

    const result = await this.attemptLogin(role, user.email, user.password);
    if (result === "success") {
      return;
    }

    if (role !== "client" || usesExplicitClientCredentials) {
      throw new Error(
        `No se pudo iniciar sesion como ${role}. La pagina quedo en ${this.page.url()}.`,
      );
    }

    await this.registerRuntimeClient();
    if (!runtimeClientUser) {
      throw new Error("No se pudo generar el cliente E2E.");
    }

    const fallbackResult = await this.attemptLogin(
      "client",
      runtimeClientUser.email,
      runtimeClientUser.password,
    );

    if (fallbackResult !== "success") {
      throw new Error("No se pudo iniciar sesion con el cliente E2E generado.");
    }
  }

  async logoutFromClientHeader() {
    await this.page.getByLabel(/Abrir opciones de cuenta/i).click();
    await this.page.getByRole("link", { name: /Salir/i }).click();
    await expect(this.page).toHaveURL(/\/login(?:$|[/?#])/, {
      timeout: 20_000,
    });
  }

  async logoutFromSideNav() {
    await this.page.locator("aside").first().hover();
    await this.page.getByRole("button", { name: /Cerrar sesi/i }).first().click();
    await expect(this.page).toHaveURL(/\/login(?:$|[/?#])/, {
      timeout: 20_000,
    });
  }

  private async waitForLoginResult(
    role: TestUserRole,
    timeout = 30_000,
  ): Promise<LoginResult> {
    const success = this.page
      .waitForURL(pathRegex(roleHomePath[role]), { timeout })
      .then(() => "success" as const)
      .catch(() => "timeout" as const);
    const error = this.page
      .getByText(/credenciales incorrectas|no se pudo|no tenes permiso|revisa los datos/i)
      .first()
      .waitFor({ state: "visible", timeout })
      .then(() => "error" as const)
      .catch(() => "timeout" as const);

    return Promise.race([success, error]);
  }

  private async attemptLogin(
    role: TestUserRole,
    email: string,
    password: string,
  ) {
    await this.page.context().clearCookies();
    await this.fillLoginForm(email, password);

    return this.waitForLoginResult(role);
  }

  private async registerRuntimeClient() {
    const client = makeClientRegistrationData();

    await this.page.goto("/register/client");
    await this.page.getByLabel(/Nombre y apellido/i).fill(client.name);
    await this.page.getByLabel(/Documento de identidad/i).fill(client.document);
    await this.page.getByLabel(/Telefono|Tel/i).fill(client.phone);
    await this.page.getByLabel(/Correo electr/i).fill(client.email);
    await this.page.getByLabel(/Contrase/i).first().fill(client.password);
    await this.page.getByLabel(/Confirmar contrase/i).fill(client.password);
    await this.page.getByRole("button", { name: /^Crear cuenta$/i }).click();
    await expect(this.page.getByText(/Cuenta creada exitosamente/i)).toBeVisible({
      timeout: 30_000,
    });

    runtimeClientUser = {
      email: client.email,
      password: client.password,
    };
  }
}
