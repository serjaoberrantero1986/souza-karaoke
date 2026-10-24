const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { mkdirSync } = require('node:fs');
const requireDesktop = createRequire(resolve('apps/desktop/package.json'));
const { chromium, expect } = requireDesktop('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:17845/mixer.html');
    await expect(page.locator('#play')).toBeEnabled({ timeout: 30000 });
    await expect(page.locator('.track')).toHaveCount(4);
    await page.getByRole('button', { name: 'Ouvir só: Bateria', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ouvir só: Bateria', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Silenciar: Voz', exact: true }).click();
    await page.getByRole('slider', { name: 'Volume: Baixo', exact: true }).fill('35');
    await page.locator('#play').click();
    await expect(page.locator('#play')).toHaveText('Ⅱ Pausar');
    await expect(page.locator('#time')).not.toHaveText('0:00 / 0:30', { timeout: 5000 });
    await page.locator('#play').click();
    await page.locator('#timeline').fill('12');
    await expect(page.locator('#time')).toHaveText('0:12 / 0:30');
    await page.locator('#reset').click();
    await expect(page.getByRole('button', { name: 'Ouvir só: Bateria', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('slider', { name: 'Volume: Baixo', exact: true })).toHaveValue('100');
    await page.locator('#group').selectOption('1');
    await expect(page.locator('#status')).toContainText('Moises · referência · 4 faixa(s) prontas');
    await page.locator('#group').selectOption('2');
    await expect(page.locator('.track')).toHaveCount(1);
    await page.locator('#group').selectOption('0');
    await expect(page.locator('.track')).toHaveCount(4);
    mkdirSync('test-results/studio', { recursive: true });
    await page.screenshot({ path: 'test-results/studio/mixer-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/studio/mixer-mobile.png', fullPage: true });
    expect(errors).toEqual([]);
    console.log('Mixer verificado: carregamento real, reprodução, pausa, busca, volume, solo, silenciar, referências e layout móvel.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
