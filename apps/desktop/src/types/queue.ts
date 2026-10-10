import type { Track } from './track';
export type QueueItem = { id: string; track: Track; requestedBy: string; requestedByDeviceId?: string };
