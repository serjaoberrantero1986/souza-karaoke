import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppTheme } from '../types/settings';
export const useThemeStore = create<{ theme: AppTheme; update: (theme: Partial<AppTheme>) => void; reset: () => void }>()(persist(set => ({ theme: { accentColor: '#ff8800' }, update: theme => set(s => ({ theme: { ...s.theme, ...theme } })), reset: () => set(s => ({ theme: { accentColor: '#ff8800', programName: s.theme.programName } })) }), { name: 'karaoke-theme-v1', version: 1 }));
