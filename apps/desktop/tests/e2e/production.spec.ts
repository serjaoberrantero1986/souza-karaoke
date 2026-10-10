import { test, expect } from '@playwright/test';
import { settingsSections } from '../../src/pages/Settings';
test('interface de produção inicia vazia e sem conteúdo fictício', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Meu Karaokê', { exact: true })).toBeVisible(); await expect(page.getByText(/DEMO|demonstração|simulad/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Escolher música' }).click(); await expect(page.getByRole('heading', { name: 'Músicas' })).toBeVisible(); await expect(page.getByRole('button', { name: /Fila de músicas \(0\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Demonstração' })).toHaveCount(0); await expect(page.locator('.track-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'Playlists' }).click(); await expect(page.getByRole('heading', { name: 'Selecione ou crie uma playlist' })).toBeVisible();
  await page.goto('/#/history'); await expect(page.getByRole('heading', { name: 'Nenhuma reprodução encontrada' })).toBeVisible();
});
test('configurações contêm apenas seções operacionais', async ({ page }) => { await page.goto('/#/settings'); for (const [id, label] of settingsSections) { await page.locator('.inner-sidebar').getByRole('button', { name: label, exact: true }).click(); await expect(page).toHaveURL(new RegExp(`/settings/${id}$`)); await expect(page.locator('.settings-content')).not.toBeEmpty(); } await expect(page.getByText(/demonstração|simulad|fase futura/i)).toHaveCount(0); });

test('nome exige PIN e personalização mantém contraste configurável', async ({ page }) => {
  await page.goto('/#/settings/about');
  await page.getByLabel('Nome do programa', { exact: true }).fill('Karaokê da Família');
  await page.getByRole('button', { name: 'Salvar nome' }).click();
  await expect(page.getByText('Configure primeiro um PIN em Operador remoto.')).toBeVisible();
  await page.goto('/#/settings/operator');
  await page.getByLabel('PIN do operador', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Salvar PIN' }).click();
  await page.goto('/#/settings/about');
  await page.getByLabel('Nome do programa', { exact: true }).fill('Karaokê da Família');
  await page.getByLabel('PIN para alterar nome').fill('0000');
  await page.getByRole('button', { name: 'Salvar nome' }).click();
  await expect(page.getByText('PIN incorreto.', { exact: true })).toBeVisible();
  await page.getByLabel('PIN para alterar nome').fill('1234');
  await page.getByRole('button', { name: 'Salvar nome' }).click();
  await page.goto('/#/settings/theme');
  await page.getByLabel('Estilo do fundo da mensagem').selectOption('gradient');
  await page.getByLabel('Cor do fundo', { exact: true }).fill('#123456');
  await page.getByLabel('Segunda cor').fill('#654321');
  await page.goto('/');
  await expect(page.locator('.brand-name')).toHaveText('Karaokê da Família');
  await expect(page.locator('.home-welcome')).toHaveCSS('background-image', /linear-gradient/);
  await page.reload(); await expect(page.locator('.brand-name')).toHaveText('Karaokê da Família');
});
