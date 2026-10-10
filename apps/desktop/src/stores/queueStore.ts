import { create } from 'zustand';
import type { QueueItem } from '../types/queue';
import type { Track } from '../types/track';
type QueueStore = { queue: QueueItem[]; addToQueue: (track: Track, requestedBy?: string, requestedByDeviceId?: string) => void; removeFromQueue: (id: string) => void; moveQueueItem: (id: string, offset: number) => void; clearQueue: () => void; takeNext: () => QueueItem | undefined; reset: () => void };
export const useQueueStore = create<QueueStore>((set, get) => ({
  queue: [],
  addToQueue: (track, requestedBy = 'Operador', requestedByDeviceId) => set(s => ({ queue: [...s.queue, { id: crypto.randomUUID(), track, requestedBy: requestedBy.trim() || 'Operador', requestedByDeviceId }] })),
  removeFromQueue: id => set(s => ({ queue: s.queue.filter(item => item.id !== id) })),
  moveQueueItem: (id, offset) => set(s => { const items = [...s.queue]; const from = items.findIndex(item => item.id === id); const to = from + offset; if (from < 0 || to < 0 || to >= items.length) return s; [items[from], items[to]] = [items[to], items[from]]; return { queue: items }; }),
  clearQueue: () => set({ queue: [] }),
  takeNext: () => { const [next, ...rest] = get().queue; set({ queue: rest }); return next; },
  reset: () => set({ queue: [] }),
}));
