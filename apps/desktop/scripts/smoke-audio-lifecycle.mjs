import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const profile = await mkdtemp(path.join(tmpdir(), 'karaoke-lifecycle-'));
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE; delete env.KARAOKE_DEV_URL;
const app = await electron.launch({ args: ['.', `--user-data-dir=${profile}`], env });
try {
  const page = await app.firstWindow(); await page.waitForURL('http://127.0.0.1:17843/');
  await app.context().route('**/?youtube-source=*', async route => {
    if (route.request().url().includes('pipeline=dddd')) { await route.abort('failed'); return; }
    await new Promise(resolve => setTimeout(resolve, 150));
    await route.fulfill({ contentType: 'text/html', body: '<html><body>Source</body></html>' }).catch(() => undefined);
  });
  await app.context().route('**/?audio-output=*', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Output</body></html>' }));
  const results = await page.evaluate(async () => {
    const options = id => ({ id: id.repeat(32), videoId: 'M7lc1UVf-VE', bounds: { x: 0, y: 0, width: 400, height: 200 } });
    return Promise.all(['a', 'b', 'c'].map(id => window.desktop.audioOpen(options(id))));
  });
  expect(results.map(result => result.status)).toEqual(['cancelled', 'cancelled', 'ready']);
  await page.evaluate(() => window.desktop.audioClose('a'.repeat(32)));
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(win => !win.webContents.getURL().includes('audio-output')).contentView.children.length)).toBe(1);
  await page.evaluate(() => window.desktop.audioClose('c'.repeat(32)));
  const failure = await page.evaluate(() => window.desktop.audioOpen({ id: 'd'.repeat(32), videoId: 'M7lc1UVf-VE', bounds: { x: 0, y: 0, width: 400, height: 200 } }));
  expect(failure.status).toBe('failed'); expect(failure.message).toContain('tom original');
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
  console.log('Troca rápida: cancelamentos esperados, reprodução atual preservada, falha real tratada e janelas liberadas.');
} finally {
  await app.close();
  if (path.dirname(path.resolve(profile)) === path.resolve(tmpdir()) && path.basename(profile).startsWith('karaoke-lifecycle-')) await rm(profile, { recursive: true, force: true });
}
