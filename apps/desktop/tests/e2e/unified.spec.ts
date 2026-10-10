import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

test('busca geral automática mistura YouTube e pasta real; fila acessível fora do player', async ({ page }) => {
  let queries = 0;
  await page.route('https://www.googleapis.com/youtube/v3/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/search')) { queries++; expect(url.searchParams.get('q')).toBe('Beautiful karaoke'); }
    return route.fulfill({ json: url.pathname.endsWith('/search') ? { items: [{ id: { videoId: 'M7lc1UVf-VE' } }] } : { items: [{ id: 'M7lc1UVf-VE', snippet: { title: 'Beautiful karaoke', channelTitle: 'Canal' }, contentDetails: { duration: 'PT3M' }, status: { embeddable: true } }] } });
  });
  const folder = path.resolve('test-results/local-fixture'); await mkdir(folder, { recursive: true });
  const samples = 44100 * 3; const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(44100, 24); wav.writeUInt32LE(88200, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  await writeFile(path.join(folder, 'Beautiful local.wav'), wav);
  await page.goto('/#/settings/youtube'); await page.locator('#youtube-api-key').fill('test'); await page.getByRole('button', { name: 'Usar chave nesta sessão' }).click();
  await page.goto('/#/karaokes'); await page.locator('input[type=file]').setInputFiles(folder);
  await page.getByRole('searchbox', { name: 'Buscar músicas' }).fill('Beautiful');
  await expect(page.locator('.track-row')).toHaveCount(2); expect(queries).toBe(1);
  await page.getByRole('checkbox', { name: 'Selecionar Beautiful local' }).check();
  await page.getByRole('button', { name: 'À fila', exact: true }).click();
  await page.getByRole('button', { name: 'Fila de músicas (1)' }).click();
  await expect(page.getByText('Arquivo local — Beautiful local')).toBeVisible();
  await page.getByRole('button', { name: 'Tocar Beautiful local agora' }).click();
  await expect(page.locator('video')).toBeVisible();
  await expect.poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => video.duration)).toBe(3);
});
