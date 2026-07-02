import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://eating-time-frontend-kappa.vercel.app/login');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('lucas.rodriguez@gmail.com');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('12345678');
});