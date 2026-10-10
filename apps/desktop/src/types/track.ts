export type TrackSource = 'local' | 'youtube';
export type Track = { id: string; title: string; artist: string; duration: number; thumbnail?: string; source: TrackSource; category: string; filePath?: string; youtubeVideoId?: string; mediaUrl?: string };
