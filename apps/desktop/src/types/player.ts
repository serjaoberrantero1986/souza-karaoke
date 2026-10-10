import type { Track } from './track';
export type PlayerStatus = 'idle' | 'intermission' | 'playing' | 'paused' | 'scoring' | 'photo';
export type ReactionKind = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
export type VocalMetrics = { samples: number; voiced: number; pitchSamples: number; pitchSum: number; pitchSquareSum: number; minHz: number; maxHz: number };
export type PlayerState = { status: PlayerStatus; currentTrack: Track | null; requestedBy: string; requestedByDeviceId?: string; currentTime: number; duration: number; pitch: number; volume: number; microphoneLevel: number; countdown: number; score: number; scoreTarget: number; reactions: Record<string, ReactionKind>; photoDataUrl?: string; vocal: VocalMetrics };
