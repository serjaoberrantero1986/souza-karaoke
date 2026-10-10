import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const profile = await mkdtemp(path.join(tmpdir(), 'karaoke-audio-live-'));
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE; delete env.KARAOKE_DEV_URL;
const app = await electron.launch({ args: ['.', `--user-data-dir=${profile}`], env });
try {
  const page = await app.firstWindow(); await page.waitForURL('http://127.0.0.1:17843/');
  await page.evaluate(() => { window.audioEvents = []; window.desktop.audioListen(message => window.audioEvents.push(message)); location.hash = '/settings/player'; });
  await page.getByRole('checkbox', { name: 'Alterar tom no YouTube (experimental)' }).check();
  await page.getByRole('checkbox', { name: 'Mostrar controles de tonalidade' }).check();
  await page.evaluate(() => { location.hash = '/karaokes'; });
  await page.getByLabel('Cole o link de um vídeo do YouTube').fill('https://youtu.be/M7lc1UVf-VE');
  await page.getByRole('button', { name: 'Selecionar pelo link' }).click();
  await page.getByRole('button', { name: 'Tocar selecionada(s)' }).click();
  await page.getByRole('button', { name: 'Iniciar agora' }).click();
  await expect.poll(() => page.evaluate(() => window.audioEvents.find(event => event.type === 'audio-ready') || window.audioEvents.find(event => event.type === 'error')), { timeout: 40000 }).toMatchObject({ type: 'audio-ready' });
  await expect.poll(() => page.getByTestId('current-time').textContent(), { timeout: 35000 }).not.toBe('0:00');
  await page.getByRole('button', { name: 'Aumentar tom', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.audioEvents.filter(event => event.type === 'diagnostic').at(-1)?.pitch)).toBe(1);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.audioEvents.filter(event => event.type === 'diagnostic').at(-1)?.rms ?? 1), { timeout: 10000 }).toBeLessThan(.001);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Reiniciar', exact: true }).click();
  await expect.poll(() => page.getByTestId('current-time').textContent()).toBe('0:00');
  await page.getByRole('button', { name: 'Restaurar tom', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.audioEvents.filter(event => event.type === 'diagnostic').at(-1)?.pitch)).toBe(0);
  await page.getByLabel('Volume', { exact: true }).fill('0');
  console.log('YouTube real no Electron: captura pronta, relógio avançando, +1 semitom, pausa silenciosa, reinício e tom original aprovados. Latência física e qualidade perceptiva ainda precisam de avaliação no equipamento de uso.');
} catch (error) {
  const page = await app.firstWindow(); console.log(await page.evaluate(() => window.audioEvents?.slice(-5))); throw error;
} finally {
  await app.close();
  if (path.dirname(path.resolve(profile)) === path.resolve(tmpdir()) && path.basename(profile).startsWith('karaoke-audio-live-')) await rm(profile, { recursive: true, force: true });
}
