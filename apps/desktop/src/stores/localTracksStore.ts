import { create } from 'zustand';
import type { Track } from '../types/track';
export const useLocalTracksStore = create<{ tracks: Track[]; folder: string; importFiles: (files: File[]) => void; setLibrary: (folder: string, tracks: Track[]) => void }>(set => ({
  tracks: [],
  folder: '',
  setLibrary: (folder, tracks) => set({ folder, tracks }),
  importFiles: files => set(state => {
    const added = files.filter(file => /\.(mp4|webm|ogv|ogg|mp3|wav|m4a)$/i.test(file.name)).map(file => ({ id: `local-${crypto.randomUUID()}`, title: file.name.replace(/\.[^.]+$/, ''), artist: 'Arquivo local', source: 'local' as const, category: 'Local', duration: 0, mediaUrl: URL.createObjectURL(file) }));
    // Retain URLs for tracks already queued or playing until the application closes.
    return { tracks: [...state.tracks, ...added] };
  }),
}));
