import { _electron as electron } from '@playwright/test';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE; delete env.KARAOKE_DEV_URL;
const profile = await mkdtemp(path.join(tmpdir(), 'karaoke-youtube-test-'));
const app = await electron.launch({ args: ['.', `--user-data-dir=${profile}`], env });
try {
  const page = await app.firstWindow();
  await page.waitForURL('http://127.0.0.1:17843/');
  await page.getByRole('button', { name: 'Tocar karaokês' }).click();
  await page.getByLabel('Cole o link de um vídeo do YouTube').fill('https://www.youtube.com/watch?v=M7lc1UVf-VE');
  await page.getByRole('button', { name: 'Selecionar pelo link' }).click();
  await page.getByRole('button', { name: 'Tocar selecionada(s)' }).click();
  await page.getByRole('button', { name: 'Iniciar agora' }).click();
  // Mute this unattended live verification through the application's volume control.
  await page.getByLabel('Volume', { exact: true }).fill('0');
  const outcome = await Promise.race([
    page.waitForFunction(() => { const text = document.querySelector('[data-testid="current-time"]')?.textContent; return text && text !== '0:00'; }, { timeout: 35000 }).then(() => 'playing'),
    page.getByRole('alert').waitFor({ state: 'visible', timeout: 35000 }).then(() => 'error'),
  ]).catch(() => 'timeout');
  await mkdir('test-results/screenshots', { recursive: true });
  await page.screenshot({ path: 'test-results/screenshots/youtube-live-electron.png' });
  console.log(JSON.stringify({ outcome, time: await page.getByTestId('current-time').textContent(), message: await page.locator('.youtube-playback-message').textContent().catch(() => ''), origin: new URL(page.url()).origin }));
  if (outcome !== 'playing') process.exitCode = 1;
} finally { await app.close(); }
