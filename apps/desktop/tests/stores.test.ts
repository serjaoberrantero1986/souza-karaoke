import { beforeEach, describe, expect, it } from 'vitest';
import { usePlayerStore } from '../src/stores/playerStore';
import { useQueueStore } from '../src/stores/queueStore';
import { useLibraryStore } from '../src/stores/libraryStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import type { Track } from '../src/types/track';
const first: Track = { id: 'yt-first', title: 'Primeira', artist: 'Canal', duration: 180, category: 'YouTube', source: 'youtube', youtubeVideoId: 'M7lc1UVf-VE' };
const second: Track = { id: 'yt-second', title: 'Segunda', artist: 'Canal', duration: 200, category: 'YouTube', source: 'youtube', youtubeVideoId: 'dQw4w9WgXcQ' };
beforeEach(() => { useSettingsStore.getState().reset(); usePlayerStore.getState().stop(); usePlayerStore.setState({ sessionTracks: [], sessionIndex: -1 }); useQueueStore.getState().clearQueue(); useLibraryStore.setState({ history: [], playlists: [], youtubeTracks: {}, youtubeRatings: {} }); });
describe('fila e reprodução reais', () => {
  it('usa a última nota de cada aparelho com o mesmo peso na média', () => { useSettingsStore.setState(state => ({ settings: { ...state.settings, scoreEnabled: true, scoreMode: 'audience', scoreTrend: false, autoNext: false } })); const player = usePlayerStore.getState(); player.play(first); player.react('phone-a', 10); player.react('phone-a', 70); player.react('phone-b', 80); player.finish(); expect(usePlayerStore.getState().score).toBe(75); expect(Object.keys(usePlayerStore.getState().reactions)).toHaveLength(2); });
  it('preserva pedidos independentes, ordem e nome do participante', () => { const queue = useQueueStore.getState(); queue.addToQueue(first, 'Ana'); queue.addToQueue(first, 'João'); const [a, b] = useQueueStore.getState().queue; queue.moveQueueItem(b.id, -1); expect(useQueueStore.getState().queue.map(item => item.requestedBy)).toEqual(['João', 'Ana']); queue.removeFromQueue(a.id); expect(useQueueStore.getState().queue[0].id).toBe(b.id); });
  it('termina vídeo real, grava histórico e inicia o próximo pedido', () => { useQueueStore.getState().addToQueue(second, 'Celular'); const player = usePlayerStore.getState(); player.play(first, 'Operador'); player.finish(); expect(useLibraryStore.getState().history[0].track.id).toBe(first.id); expect(usePlayerStore.getState().currentTrack?.id).toBe(second.id); expect(usePlayerStore.getState().requestedBy).toBe('Celular'); });
  it('pausa, continua e limita volume e posição', () => { const player = usePlayerStore.getState(); player.play(first); player.pause(); expect(usePlayerStore.getState().status).toBe('paused'); player.resume(); player.setVolume(120); player.seek(999); expect(usePlayerStore.getState().volume).toBe(100); expect(usePlayerStore.getState().currentTime).toBe(180); });
  it('calcula nota do público por aparelho e anima até o valor final', () => { useSettingsStore.setState(state => ({ settings: { ...state.settings, scoreEnabled: true, scoreMode: 'audience', scoreTrend: true, scoreSeconds: 3, autoNext: false } })); const player = usePlayerStore.getState(); player.play(first); player.react('phone-a', 100); player.react('phone-b', 80); player.finish(); expect(usePlayerStore.getState().scoreTarget).toBe(90); expect(usePlayerStore.getState().score).toBe(0); player.tick(); expect(usePlayerStore.getState().score).toBeGreaterThan(0); player.tick(); player.tick(); expect(usePlayerStore.getState().score).toBe(90); });
});

describe('histórico navegável e pontuação', () => {
  it('volta e avança preservando pedidos, identidade e votos independentes', () => {
    const p = usePlayerStore.getState(); const q = useQueueStore.getState();
    q.addToQueue(first, 'Ana', 'phone-a'); q.addToQueue(second, 'João', 'phone-b');
    p.skip(); p.react('phone-a', 90); p.skip(); p.previous();
    expect(usePlayerStore.getState().currentTrack?.id).toBe(first.id);
    expect(usePlayerStore.getState().requestedByDeviceId).toBe('phone-a');
    expect(usePlayerStore.getState().reactions).toEqual({});
    p.skip(); expect(usePlayerStore.getState().currentTrack?.id).toBe(second.id);
    expect(usePlayerStore.getState().sessionTracks).toHaveLength(2);
    expect(useQueueStore.getState().queue).toHaveLength(0);
    p.skip(); expect(usePlayerStore.getState().currentTrack).toBeNull();
    p.previous(); expect(usePlayerStore.getState().currentTrack?.id).toBe(second.id);
  });
  it('não reinicia uma apresentação encerrada nem transforma falta de áudio em nota', () => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, scoreEnabled: true, scoreMode: 'microphone', photoEnabled: true, photoMinimum: 0 } }));
    const p = usePlayerStore.getState(); p.play(first); p.finish(); p.restart();
    expect(usePlayerStore.getState().status).toBe('scoring');
    expect(usePlayerStore.getState().scoreNotice).toContain('Áudio insuficiente');
    p.advance(); expect(usePlayerStore.getState().status).not.toBe('photo');
  });
  it('aguarda a nota manual sem expirar e aceita zero como nota válida', () => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, scoreEnabled: true, scoreMode: 'operator', photoEnabled: true, photoMinimum: 90 } }));
    const p = usePlayerStore.getState(); p.play(first); p.finish();
    for (let i = 0; i < 40; i++) p.tick();
    expect(usePlayerStore.getState().status).toBe('scoring');
    p.setScore(95); p.setScore(0); p.advance();
    expect(usePlayerStore.getState().score).toBe(0); expect(usePlayerStore.getState().status).not.toBe('photo');
  });
  it('distingue ausência de votos de pontuação e mantém a nota aleatória nos limites', () => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, scoreEnabled: true, scoreMode: 'audience' } }));
    const p = usePlayerStore.getState(); p.play(first); p.finish();
    expect(usePlayerStore.getState().scoreNotice).toContain('Nenhuma avaliação');
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      useSettingsStore.setState(s => ({ settings: { ...s.settings, scoreMode: 'random', difficulty } }));
      for (let i = 0; i < 25; i++) { p.play(first); p.finish(); expect(usePlayerStore.getState().score).toBeGreaterThanOrEqual(55); expect(usePlayerStore.getState().score).toBeLessThanOrEqual(100); }
    }
  });
});
