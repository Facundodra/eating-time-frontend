import { expect, type Locator, type Page } from "@playwright/test";

import { isVisible } from "./assertions";

export async function goToAppPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
}

export function restaurantCards(page: Page): Locator {
  return page.locator('main a[href*="/client/restaurant/"] article');
}

export async function openFirstRestaurantFromList(page: Page) {
  const firstRestaurant = restaurantCards(page).first();

  if (!(await isVisible(firstRestaurant, 15_000))) {
    return false;
  }

  await firstRestaurant.click();
  await expect(page).toHaveURL(/\/client\/restaurant\/\d+/);
  return true;
}
