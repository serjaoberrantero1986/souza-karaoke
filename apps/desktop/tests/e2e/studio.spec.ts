import { expect, test } from '@playwright/test';

test('AI Studio fica isolado por PIN do administrador', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByRole('button', { name: /AI Studio/ }).click();
  await expect(page.getByRole('heading', { name: 'Área do administrador' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Configurar PIN' })).toBeVisible();

  await page.getByRole('button', { name: 'Configurar PIN' }).click();
  await page.getByLabel('PIN do operador', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Salvar PIN' }).click();
  await page.goto('/#/studio');
  await page.getByLabel('PIN do administrador').fill('0000');
  await page.getByRole('button', { name: 'Acessar Studio' }).click();
  await expect(page.getByText('PIN incorreto.', { exact: true })).toBeVisible();
  await page.getByLabel('PIN do administrador').fill('1234');
  await page.getByRole('button', { name: 'Acessar Studio' }).click();
  await expect(page.getByRole('heading', { name: 'Nova música' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Processar música' })).toBeDisabled();
  await expect(page.getByText(/fluxo Python externo/)).toBeVisible();
});
