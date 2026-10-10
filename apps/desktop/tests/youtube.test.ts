import { markUnavailable, isUnavailable, clearUnavailable } from '../src/services/youtube/availability';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseYoutubeId, parseDuration, searchYoutube, trackFromYoutubeLink } from '../src/services/youtube/catalog';
import { usePlayerStore } from '../src/stores/playerStore';
import { useQueueStore } from '../src/stores/queueStore';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); clearUnavailable(); });
describe('YouTube', () => {
  it('aceita links oficiais e recusa sites e protocolos não permitidos', () => {
    for (const link of ['https://youtu.be/M7lc1UVf-VE?t=10', 'https://www.youtube.com/watch?v=M7lc1UVf-VE&list=123', 'https://youtube.com/shorts/M7lc1UVf-VE', 'https://m.youtube.com/live/M7lc1UVf-VE']) expect(parseYoutubeId(link)).toBe('M7lc1UVf-VE');
    for (const link of ['https://youtube.com.example.org/watch?v=M7lc1UVf-VE', 'javascript:alert(1)', 'https://youtu.be/short', 'https://name:pass@youtube.com/watch?v=M7lc1UVf-VE']) expect(parseYoutubeId(link)).toBeNull();
  });
  it('converte duração e preserva identidade do vídeo', () => {
    expect(parseDuration('PT1H2M3S')).toBe(3723); expect(parseDuration('P1DT1S')).toBe(86401);
    expect(trackFromYoutubeLink('M7lc1UVf-VE').id).toBe('yt-M7lc1UVf-VE');
  });
  it('busca apenas vídeos incorporáveis e mantém a chave fora da URL', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ nextPageToken: 'next', items: [{ id: { videoId: 'M7lc1UVf-VE' } }] }))).mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: 'M7lc1UVf-VE', snippet: { title: 'Teste', channelTitle: 'Canal' }, contentDetails: { duration: 'PT3M20S' }, status: { embeddable: true } }] })));
    vi.stubGlobal('fetch', fetchMock);
    const result = await searchYoutube('Benson Boone', 'test-key', new AbortController().signal);
    expect(result.tracks[0].duration).toBe(200); expect(result.nextPageToken).toBe('next');
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.get('q')).toBe('Benson Boone karaoke');
    expect(url.searchParams.get('videoEmbeddable')).toBe('true'); expect(url.toString()).not.toContain('test-key');
    expect(fetchMock.mock.calls[0][1].headers['X-Goog-Api-Key']).toBe('test-key');
  });
  it('explica falta de chave e cota sem expor mensagens com credenciais', async () => {
    await expect(searchYoutube('teste', '', new AbortController().signal)).rejects.toThrow('Configure uma chave');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { errors: [{ reason: 'quotaExceeded' }] } }), { status: 403 })));
    await expect(searchYoutube('teste', 'test-key', new AbortController().signal)).rejects.toThrow('cota');
  });
  it('o relógio simulado não encerra vídeos reais nem inventa progresso', () => {
    useQueueStore.getState().clearQueue(); usePlayerStore.getState().play(trackFromYoutubeLink('M7lc1UVf-VE'));
    usePlayerStore.getState().tick(); expect(usePlayerStore.getState().status).toBe('playing'); expect(usePlayerStore.getState().currentTime).toBe(0);
    usePlayerStore.getState().syncMedia(42, 100); usePlayerStore.getState().tick(); expect(usePlayerStore.getState().currentTime).toBe(42);
    usePlayerStore.getState().finish(); expect(usePlayerStore.getState().status).toBe('idle');
  });
});

it('só omite falhas de disponibilidade e permite nova tentativa após 15 minutos', () => {
  vi.useFakeTimers();
  for (const code of [5, 153, 0]) { markUnavailable('M7lc1UVf-VE', code); expect(isUnavailable('M7lc1UVf-VE')).toBe(false); }
  markUnavailable('M7lc1UVf-VE', 150); expect(isUnavailable('M7lc1UVf-VE')).toBe(true);
  vi.advanceTimersByTime(15 * 60_000); expect(isUnavailable('M7lc1UVf-VE')).toBe(false);
});
it('filtra restrições regionais, incorporação e indisponibilidade conhecida', async () => {
  const ids = ['M7lc1UVf-VE','dQw4w9WgXcQ','abcdefghijk','lmnopqrstuv'];
  markUnavailable(ids[3], 101);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ items: ids.map(videoId => ({ id: { videoId } })) }))).mockResolvedValueOnce(new Response(JSON.stringify({ items: ids.map((id, i) => ({ id, snippet: { title: id }, status: { embeddable: i !== 2 }, contentDetails: { regionRestriction: i === 0 ? { blocked: ['BR'] } : i === 1 ? { allowed: ['BR'] } : {} } })) }))));
  const result = await searchYoutube('teste', 'test-key', new AbortController().signal);
  expect(result.tracks.map(track => track.youtubeVideoId)).toEqual([ids[1]]);
});
