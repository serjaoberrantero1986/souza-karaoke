export type ScoreMode = 'random' | 'microphone' | 'audience' | 'operator';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type AppTheme = { accentColor: string; programName?: string; messageGradient?: boolean; messageColor?: string; messageColorEnd?: string; messageOpacity?: number; messageText?: string; logoUrl?: string; backgroundImageUrl?: string };
export type Settings = {
  folder: string; autoStart: boolean; hideSettings: boolean; showShortcuts: boolean; showYoutube: boolean; showRecent: boolean; backgroundMusic: boolean; backgroundVolume: number; microphone: string; sort: string;
  scoreEnabled: boolean; scoreMode: ScoreMode; difficulty: Difficulty; scoreTrend: boolean; scoreSeconds: number;
  youtubeRegion: string; youtubePitch: boolean; pitchButtons: boolean; rememberPitch: boolean; showQueue: boolean; autoNext: boolean; intervalSeconds: number; rateYoutube: boolean;
  showQr: boolean; permanentQr: boolean; requestName: boolean; allowAdd: boolean; maxRequests: number; requestInterval: number; allowPlayback: boolean; allowPitch: boolean; allowQueue: boolean; allowReactions: boolean; multipleReactions: boolean;
  operatorEnabled: boolean; operatorPin: string; twoMonitors: boolean;
  photoEnabled: boolean; photoFolder: string; photoCountdown: number; photoMinimum: number; photoDownload: boolean; photoFrame: string; photoStampName: boolean; photoStampSong: boolean; photoStampDate: boolean; photoStampScore: boolean; photoStampLogo: boolean;
  suggestions: boolean; suggestionSource: string; shortcuts: Record<string, string>;
};
