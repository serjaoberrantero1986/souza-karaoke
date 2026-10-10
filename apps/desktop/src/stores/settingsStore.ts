import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultSettings } from '../config/defaultSettings';
import type { Settings } from '../types/settings';
type SettingsStore = { settings: Settings; update: <K extends keyof Settings>(key: K, value: Settings[K]) => void; reset: () => void };
export const useSettingsStore = create<SettingsStore>()(persist((set) => ({ settings: structuredClone(defaultSettings), update: (key, value) => set(s => ({ settings: { ...s.settings, [key]: value } })), reset: () => set({ settings: structuredClone(defaultSettings) }) }), {
  name: 'karaoke-settings-v1', version: 6,
  migrate: (persisted: unknown) => { const state = persisted as Partial<SettingsStore>; const previous: Partial<Settings> = state.settings ?? {}; return { ...state, settings: { ...defaultSettings, ...previous, microphone: !previous.microphone || previous.microphone === 'Padrão do sistema' ? 'default' : previous.microphone, sort: previous.sort === 'name' ? 'title' : previous.sort || defaultSettings.sort } } as SettingsStore; },
}));
