import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Playlist } from '../types/playlist';
import type { HistoryEntry } from '../types/session';
import type { Track } from '../types/track';
type LibraryStore = {
  playlists: Playlist[]; history: HistoryEntry[]; youtubeTracks: Record<string, Track>; youtubeRatings: Record<string, number>;
  rememberTrack: (track: Track) => void;
  createPlaylist: (name: string) => string; renamePlaylist: (id: string, name: string) => void; deletePlaylist: (id: string) => void;
  addTrack: (id: string, trackId: string) => void; removeTrack: (id: string, index: number) => void; moveTrack: (id: string, index: number, offset: number) => void;
  record: (track: Track, requestedBy: string) => void; clearHistory: () => void; rateYoutube: (trackId: string, rating: number) => void;
};
export const useLibraryStore = create<LibraryStore>()(persist(set => ({
  playlists: [], history: [], youtubeTracks: {}, youtubeRatings: {},
  rememberTrack: track => set(s => ({ youtubeTracks: { ...s.youtubeTracks, [track.id]: track } })),
  createPlaylist: name => { const id = crypto.randomUUID(); set(s => ({ playlists: [...s.playlists, { id, name: name.trim(), trackIds: [] }] })); return id; },
  renamePlaylist: (id, name) => set(s => ({ playlists: s.playlists.map(p => p.id === id ? { ...p, name: name.trim() } : p) })),
  deletePlaylist: id => set(s => ({ playlists: s.playlists.filter(p => p.id !== id) })),
  addTrack: (id, trackId) => set(s => ({ playlists: s.playlists.map(p => p.id === id && !p.trackIds.includes(trackId) ? { ...p, trackIds: [...p.trackIds, trackId] } : p) })),
  removeTrack: (id, index) => set(s => ({ playlists: s.playlists.map(p => p.id === id ? { ...p, trackIds: p.trackIds.filter((_, i) => i !== index) } : p) })),
  moveTrack: (id, index, offset) => set(s => ({ playlists: s.playlists.map(p => { if (p.id !== id || index + offset < 0 || index + offset >= p.trackIds.length) return p; const items = [...p.trackIds]; [items[index], items[index + offset]] = [items[index + offset], items[index]]; return { ...p, trackIds: items }; }) })),
  record: (track, requestedBy) => set(s => ({ history: [{ id: crypto.randomUUID(), track, requestedBy, playedAt: new Date().toISOString() }, ...s.history].slice(0, 500) })),
  clearHistory: () => set({ history: [] }),
  rateYoutube: (trackId, rating) => set(state => ({ youtubeRatings: { ...state.youtubeRatings, [trackId]: Math.max(1, Math.min(5, Math.round(rating))) } })),
}), {
  name: 'karaoke-library-v1', version: 3,
  migrate: (persisted: unknown) => {
    const state = persisted as Partial<LibraryStore>;
    return { ...state, playlists: (state.playlists ?? []).filter(item => !['rock', 'festa'].includes(item.id)), history: (state.history ?? []).filter(item => !item.id.startsWith('history-')), youtubeTracks: state.youtubeTracks ?? {}, youtubeRatings: state.youtubeRatings ?? {} } as LibraryStore;
  },
}));
