import { create } from 'zustand';

// Renderer holds only the active key; encrypted persistence belongs to Electron.
export const useYoutubeStore = create<{ apiKey: string; error: string; setApiKey: (key: string) => void }>(set => ({ apiKey: '', error: '', setApiKey: apiKey => set({ apiKey: apiKey.trim(), error: '' }) }));
