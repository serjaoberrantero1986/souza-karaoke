import { test, expect } from '@playwright/test';

test('link real usa eventos do player, mantém vídeo visível na busca e preserva playlist', async ({ page }) => {
  // Contract double for the official IFrame API: no external video or key in CI.
  await page.route('https://www.youtube.com/iframe_api', route => route.fulfill({ contentType: 'text/javascript', body: `
    window.YT = { Player: class {
      constructor(host, options) {
        this.options = options; this.state = -1; this.time = 0;
        this.node = document.createElement('iframe'); this.node.title = 'YouTube test player'; host.replaceWith(this.node);
        window.youtubeTest = this;
        setTimeout(() => options.events.onReady({ target: this }), 10);
      }
      playVideo() { this.state = 1; this.options.events.onStateChange({ data: 1, target: this }); }
      pauseVideo() { this.state = 2; this.options.events.onStateChange({ data: 2, target: this }); }
      seekTo(time) { this.time = time; }
      setVolume(volume) { this.volume = volume; }
      getDuration() { return 120; }
      getCurrentTime() { return this.time; }
      getPlayerState() { return this.state; }
      destroy() { this.node.remove(); }
    }}; window.onYouTubeIframeAPIReady();
  ` }));
  await page.goto('/#/playlists');
  await page.getByLabel('Nome da nova playlist').fill('Favoritas');
  await page.getByRole('button', { name: 'Criar playlist' }).click();
  await page.getByRole('button', { name: 'Adicionar músicas' }).click();
  await page.getByLabel('Cole o link de um vídeo do YouTube').fill('https://youtu.be/M7lc1UVf-VE');
  await page.getByRole('button', { name: 'Adicionar pelo link' }).click();
  await page.keyboard.press('Escape'); await page.reload();
  await expect(page.getByText('YouTube — Vídeo do YouTube (M7lc1UVf-VE)')).toBeVisible();
  await page.goto('/#/karaokes');
  await page.getByLabel('Cole o link de um vídeo do YouTube').fill('https://youtu.be/M7lc1UVf-VE');
  await page.getByRole('button', { name: 'Selecionar pelo link' }).click();
  await page.getByRole('button', { name: 'Tocar selecionada(s)' }).click();
  const ring = page.locator('.countdown');
  await expect(ring).toBeVisible();
  const before = await ring.evaluate(element => getComputedStyle(element, '::before').transform);
  await expect.poll(() => ring.evaluate(element => getComputedStyle(element, '::before').transform)).not.toBe(before);
  await page.getByRole('button', { name: 'Iniciar agora' }).click();
  await expect(page.getByTitle('YouTube test player')).toBeVisible();
  await expect(page.getByText('TOCANDO AGORA · YOUTUBE')).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Tom', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar música', exact: true }).click();
  const video = await page.locator('.youtube-frame').boundingBox();
  const panel = await page.locator('.player-side-panel').boundingBox();
  expect(video!.x + video!.width).toBeLessThanOrEqual(panel!.x);
  await page.getByRole('button', { name: 'Fechar painel' }).click();
  await page.evaluate(() => { const player = (window as unknown as { youtubeTest: { time: number } }).youtubeTest; player.time = 42; });
  await expect(page.getByTestId('current-time')).toHaveText('0:42');
  await page.getByRole('button', { name: 'Reiniciar', exact: true }).click();
  await expect(page.getByTestId('current-time')).toHaveText('0:00');
  await page.evaluate(() => { const player = (window as unknown as { youtubeTest: { options: { events: { onStateChange: (event: { data: number }) => void } } } }).youtubeTest; player.options.events.onStateChange({ data: 0 }); });
  await expect(page.getByRole('heading', { name: 'Vamos cantar?' })).toBeVisible();
});

test('busca oficial mapeia respostas, erros e não persiste a chave', async ({ page }) => {
  await page.route('https://www.googleapis.com/youtube/v3/**', route => {
    const url = new URL(route.request().url());
    expect(url.searchParams.has('key')).toBe(false);
    const data = url.pathname.endsWith('/search') ? { items: [{ id: { videoId: 'M7lc1UVf-VE' } }] } : { items: [{ id: 'M7lc1UVf-VE', snippet: { title: 'Karaokê de teste', channelTitle: 'Canal de teste' }, contentDetails: { duration: 'PT2M' }, status: { embeddable: true } }] };
    return route.fulfill({ json: data });
  });
  await page.goto('/#/settings/youtube');
  await page.getByLabel('Chave da YouTube Data API v3', { exact: true }).fill('test-key-only');
  await page.getByRole('button', { name: 'Usar chave nesta sessão' }).click();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('button', { name: 'Escolher música' }).click();
  await page.getByRole('searchbox', { name: 'Buscar músicas' }).fill('karaoke');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByText('Canal de teste — Karaokê de teste')).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('test-key-only');
  await page.route('https://www.googleapis.com/youtube/v3/search**', route => route.fulfill({ status: 403, json: { error: { errors: [{ reason: 'quotaExceeded' }] } } }));
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('cota');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeDisabled();
});
