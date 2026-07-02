import { expect, type Locator, type Page } from "@playwright/test";

export async function expectAppReady(page: Page) {
  await expect(page.locator("body")).toBeVisible();
  await expect(
    page.getByText(/Application error|Unhandled Runtime Error/i),
  ).toHaveCount(0);
}

export async function expectHeading(page: Page, name: RegExp | string) {
  await expect(page.getByRole("heading", { name }).first()).toBeVisible({
    timeout: 20_000,
  });
}

export async function isVisible(locator: Locator, timeout = 5_000) {
  await locator.waitFor({ state: "visible", timeout }).catch(() => null);

  return locator.isVisible().catch(() => false);
}

export async function expectResultsOrEmpty(
  page: Page,
  result: Locator,
  emptyText: RegExp,
) {
  if (await isVisible(result.first(), 15_000)) {
    await expect(result.first()).toBeVisible();
    return "results" as const;
  }

  await expect(page.getByText(emptyText).first()).toBeVisible({
    timeout: 10_000,
  });

  return "empty" as const;
}
