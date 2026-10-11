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

test('nome em branco permanece oculto e título não identifica demonstração', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('karaoke-settings-v1', JSON.stringify({ version: 6, state: { settings: { operatorPin: '1234' } } })); });
  await page.goto('/#/settings/about');
  await page.getByLabel('Nome do programa', { exact: true }).fill(''); await page.getByLabel('PIN para alterar nome').fill('1234');
  await page.getByRole('button', { name: 'Salvar nome' }).click();
  await page.goto('/'); await expect(page.locator('.brand-name')).toHaveCount(0); await expect(page).toHaveTitle('Meu Karaokê');
  await page.reload(); await expect(page.locator('.brand-name')).toHaveCount(0);
});
test('sugestão usa o espaço livre sem alterar fonte e histórico recebe novo pedido', async ({ page }) => {
  await page.addInitScript(() => {
    const track = { id: 'yt-example', youtubeVideoId: 'M7lc1UVf-VE', title: 'Jorge e Mateus — Uma canção para cantar juntos', artist: 'Canal', duration: 180, source: 'youtube', category: 'YouTube' };
    localStorage.setItem('karaoke-settings-v1', JSON.stringify({ version: 5, state: { settings: { suggestions: true } } }));
    localStorage.setItem('karaoke-library-v1', JSON.stringify({ version: 3, state: { history: [{ id: 'real-entry', track, requestedBy: 'Ana', playedAt: new Date().toISOString() }], playlists: [], youtubeTracks: {}, youtubeRatings: {} } }));
  });
  await page.goto('/');
  const button = page.locator('.home-suggestions button');
  expect(await button.evaluate(el => el.clientWidth)).toBeGreaterThan(300);
  expect(await button.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.goto('/#/history'); await page.getByRole('button', { name: /Pedir Jorge e Mateus/ }).click();
  await expect(page.getByRole('button', { name: 'Fila de músicas (1)' })).toBeVisible();
});
