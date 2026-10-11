import type { Settings } from '../types/settings';
export const defaultSettings: Settings = {
  folder: '', autoStart: false, hideSettings: false, showShortcuts: false, showYoutube: true, showRecent: false, backgroundMusic: false, backgroundVolume: 50, microphone: 'default', sort: 'relevance',
  scoreEnabled: false, scoreMode: 'random', difficulty: 'normal', scoreTrend: false, scoreSeconds: 5,
  youtubeRegion: 'BR', youtubePitch: false, pitchButtons: true, rememberPitch: false, showQueue: true, autoNext: true, intervalSeconds: 7, rateYoutube: true,
  showQr: true, permanentQr: false, requestName: true, allowAdd: true, maxRequests: 3, requestInterval: 0, allowPlayback: true, allowPitch: true, allowQueue: true, allowReactions: false, multipleReactions: false,
  operatorEnabled: true, operatorPin: '', twoMonitors: false,
  photoEnabled: false, photoFolder: '', photoMinimum: 90, photoDownload: false, photoFrame: 'Nenhuma', photoStampName: true, photoStampSong: true, photoStampDate: true, photoStampScore: true, photoStampLogo: true,
  suggestions: false, suggestionSource: 'Mais tocadas aqui', shortcuts: { playPause: 'Space', next: 'ArrowRight', pitchDown: 'Minus', pitchUp: 'Equal', queue: 'KeyQ' },
};
