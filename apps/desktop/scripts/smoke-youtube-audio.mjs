import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const profile = await mkdtemp(path.join(tmpdir(), 'karaoke-audio-'));
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE; delete env.KARAOKE_DEV_URL;
const app = await electron.launch({ args: ['.', `--user-data-dir=${profile}`], env });
try {
  const page = await app.firstWindow(); await page.waitForURL('http://127.0.0.1:17843/');
  await page.evaluate(async () => {
    window.audioEvents = [];
    window.desktop.audioListen(message => window.audioEvents.push(message));
    await window.desktop.audioOpen({ id: 'c'.repeat(32), videoId: 'M7lc1UVf-VE', bounds: { x: 20, y: 20, width: 480, height: 270 } });
  });
  // Inject a known 440 Hz signal into the dedicated source, not the processor.
  await app.evaluate(async ({ BrowserWindow }) => {
    const main = BrowserWindow.getAllWindows().find(win => !win.webContents.getURL().includes('audio-output'));
    const view = main.contentView.children[0];
    await view.webContents.executeJavaScript(`window.fixtureContext = new AudioContext(); window.fixtureGain = fixtureContext.createGain(); fixtureGain.gain.value = .08; const oscillator = fixtureContext.createOscillator(); oscillator.frequency.value = 440; oscillator.connect(fixtureGain); fixtureGain.connect(fixtureContext.destination); oscillator.start(); fixtureContext.resume();`);
  });
  await expect.poll(() => page.evaluate(() => window.audioEvents.find(event => event.type === 'audio-ready') || window.audioEvents.find(event => event.type === 'error')), { timeout: 30000 }).toMatchObject({ type: 'audio-ready' });
  const command = pitch => page.evaluate(pitch => { window.desktop.audioSend({ id: 'c'.repeat(32), type: 'command', status: 'paused', pitch, volume: 80, seekRevision: 0 }); window.audioEvents = []; }, pitch);
  const frequency = () => page.evaluate(() => window.audioEvents.filter(event => event.type === 'diagnostic' && event.rms > .0005).at(-1)?.frequency || 0);
  await command(0); await expect.poll(frequency, { timeout: 20000 }).toBeGreaterThan(420); expect(await frequency()).toBeLessThan(460);
  await command(12); await expect.poll(() => page.evaluate(() => window.audioEvents.filter(event => event.type === 'diagnostic').at(-1)?.pitch), { timeout: 10000 }).toBe(12); await expect.poll(frequency, { timeout: 20000 }).toBeGreaterThan(850); expect(await frequency()).toBeLessThan(910);
  await command(-12); await expect.poll(frequency, { timeout: 20000 }).toBeGreaterThan(200); await expect.poll(frequency, { timeout: 20000 }).toBeLessThan(240);
  await page.evaluate(() => { window.desktop.audioSend({ id: 'c'.repeat(32), type: 'command', status: 'paused', pitch: 0, volume: 0, seekRevision: 0 }); window.audioEvents = []; });
  await expect.poll(() => page.evaluate(() => window.audioEvents.filter(event => event.type === 'diagnostic').at(-1)?.rms ?? 1), { timeout: 15000 }).toBeLessThan(.001);
  await page.evaluate(() => window.desktop.audioClose('c'.repeat(32)));
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().filter(win => win.webContents.getURL().includes('audio-output')).length)).toBe(0);
  console.log('Captura real isolada + SoundTouch: 440 Hz → 880 Hz (+12), 220 Hz (−12), volume zero e fechamento aprovados. Não valida disponibilidade de vídeos reais nem latência física de saída.');
} catch (error) {
  const page = await app.firstWindow(); console.log(await page.evaluate(() => window.audioEvents.slice(-4))); throw error;
} finally {
  await app.close();
  if (path.dirname(path.resolve(profile)) === path.resolve(tmpdir()) && path.basename(profile).startsWith('karaoke-audio-')) await rm(profile, { recursive: true, force: true });
}
