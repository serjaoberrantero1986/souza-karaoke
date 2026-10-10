import { useSettingsStore } from '../../stores/settingsStore';
import { isUnavailable } from './availability';
import type { Track } from '../../types/track';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (VIDEO_ID.test(value)) return value;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    let id: string | null = null;
    if (host === 'youtu.be') id = parts[0] ?? null;
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (['embed', 'shorts', 'live'].includes(parts[0])) id = parts[1] ?? null;
    }
    return id && VIDEO_ID.test(id) ? id : null;
  } catch { return null; }
}

export function trackFromYoutubeLink(input: string): Track {
  const id = parseYoutubeId(input);
  if (!id) throw new Error('Cole um link válido de vídeo do YouTube (watch, youtu.be, Shorts ou live).');
  return { id: `yt-${id}`, youtubeVideoId: id, title: `Vídeo do YouTube (${id})`, artist: 'YouTube', duration: 0, source: 'youtube', category: 'YouTube', thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
}

export function parseDuration(value: string): number {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  return match ? Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0) : 0;
}

type YoutubeResponse = {
  nextPageToken?: string;
  error?: { errors?: { reason?: string }[] };
  items?: { id: string | { videoId?: string }; snippet?: { title?: string; channelTitle?: string }; contentDetails?: { duration?: string; regionRestriction?: { allowed?: string[]; blocked?: string[] } }; status?: { embeddable?: boolean } }[];
};

async function request(endpoint: string, params: Record<string, string>, key: string, signal: AbortSignal): Promise<YoutubeResponse> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, value));
  // Keep the key out of URLs, browser history and application storage.
  const response = await fetch(url, { signal, headers: { 'X-Goog-Api-Key': key }, referrerPolicy: 'strict-origin-when-cross-origin' });
  const data = await response.json() as YoutubeResponse;
  if (!response.ok) {
    const reason = data.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || response.status === 429) throw new Error('A cota de busca do YouTube foi atingida. Você ainda pode adicionar vídeos pelo link.');
    if (response.status === 400 || response.status === 403) throw new Error('Confira a chave, a ativação da YouTube Data API v3 e as restrições do projeto no Google Cloud.');
    throw new Error('O YouTube não respondeu à busca. Tente novamente.');
  }
  return data;
}

export async function searchYoutube(query: string, key: string, signal: AbortSignal, pageToken = '') {
  if (!key.trim()) throw new Error('Configure uma chave da YouTube Data API para buscar por nome, ou adicione um link.');
  const timeout = AbortSignal.timeout(15000);
  const combined = AbortSignal.any([signal, timeout]);
  const region = useSettingsStore.getState().settings.youtubeRegion || 'BR';
  const results = await request('search', { part: 'snippet', type: 'video', videoEmbeddable: 'true', videoSyndicated: 'true', regionCode: region, maxResults: '15', q: /karaok[eê]/i.test(query) ? query.trim() : `${query.trim()} karaoke`, ...(pageToken ? { pageToken } : {}) }, key.trim(), combined);
  const ids = (results.items ?? []).flatMap(item => typeof item.id !== 'string' && item.id.videoId && VIDEO_ID.test(item.id.videoId) ? [item.id.videoId] : []);
  if (!ids.length) return { tracks: [], nextPageToken: results.nextPageToken };
  const details = await request('videos', { part: 'snippet,contentDetails,status', id: ids.join(',') }, key.trim(), combined);
  const tracks: Track[] = (details.items ?? []).flatMap(item => {
    if (typeof item.id !== 'string' || !VIDEO_ID.test(item.id) || !item.snippet || item.status?.embeddable === false) return [];
    const restriction = item.contentDetails?.regionRestriction;
    if (isUnavailable(item.id) || restriction?.blocked?.includes(region) || (restriction?.allowed && !restriction.allowed.includes(region))) return [];
    return [{ id: `yt-${item.id}`, youtubeVideoId: item.id, title: item.snippet.title || 'Vídeo do YouTube', artist: item.snippet.channelTitle || 'YouTube', source: 'youtube', category: 'YouTube', duration: parseDuration(item.contentDetails?.duration ?? ''), thumbnail: `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg` }];
  });
  return { tracks, nextPageToken: results.nextPageToken };
}
