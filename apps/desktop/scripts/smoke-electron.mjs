import { _electron as electron } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE; delete env.KARAOKE_DEV_URL;
const app = await electron.launch({ args: ['.'], env });
try {
  const page = await app.firstWindow();
  await page.waitForURL('http://127.0.0.1:17843/');
  await page.waitForSelector('.home-welcome');
  await page.getByRole('button', { name: 'Escolher música' }).click();
  await page.waitForSelector('.youtube-browser');
  const isolated = await page.evaluate(() => typeof window.require === 'undefined' && typeof window.desktop?.quit === 'function');
  if (!isolated) throw new Error('Preload ou isolamento inválido');
  await mkdir('test-results/screenshots', { recursive: true });
  await page.screenshot({ path: 'test-results/screenshots/electron-desktop.png' });
  console.log('Electron iniciou o build, navegou para Karaokês e validou o preload isolado.');
} finally { await app.close(); }
