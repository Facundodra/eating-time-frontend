import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://eating-time-frontend-kappa.vercel.app/login');
  await page.getByRole('button', { name: 'Abrir menu de navegacion' }).click();
  await page.getByRole('link', { name: 'Salir' }).click();
});