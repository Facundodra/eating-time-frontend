import type { Page } from "@playwright/test";

import { testUsers, type TestUserRole } from "../fixtures/users";
import { AuthAutomationService } from "../services/auth-automation-service";

export async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
) {
  await new AuthAutomationService(page).fillLoginForm(email, password);
}

export async function loginAs(page: Page, role: TestUserRole) {
  await new AuthAutomationService(page).loginAs(role);
}

export async function logoutFromClientHeader(page: Page) {
  await new AuthAutomationService(page).logoutFromClientHeader();
}

export async function logoutFromSideNav(page: Page) {
  await new AuthAutomationService(page).logoutFromSideNav();
}

export { testUsers };
