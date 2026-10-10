import { create } from 'zustand';
export const useUiStore = create<{ toast: string; notify: (message: string) => void; clearToast: () => void }>(set => ({ toast: '', notify: toast => set({ toast }), clearToast: () => set({ toast: '' }) }));
