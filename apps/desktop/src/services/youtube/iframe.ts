export type YoutubePlayer = {
  playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void; mute(): void; getCurrentTime(): number; getDuration(): number;
  getPlayerState(): number; destroy(): void;
};
type Event = { target: YoutubePlayer; data: number };
export type YoutubeApi = { Player: new (element: HTMLElement, options: {
  videoId: string; width: string; height: string;
  playerVars: Record<string, string | number>;
  events: { onReady: (event: Event) => void; onStateChange: (event: Event) => void; onError: (event: Event) => void; onAutoplayBlocked: () => void };
}) => YoutubePlayer };
declare global { interface Window { YT?: YoutubeApi; onYouTubeIframeAPIReady?: () => void } }

let pending: Promise<YoutubeApi> | undefined;
export function loadYoutubeApi(): Promise<YoutubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (pending) return pending;
  pending = new Promise<YoutubeApi>((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; script.async = true;
    const previous = window.onYouTubeIframeAPIReady;
    const cleanup = () => { clearTimeout(timer); window.onYouTubeIframeAPIReady = previous; script.onerror = null; };
    const fail = () => { cleanup(); script.remove(); reject(new Error('Não foi possível carregar o player do YouTube. Verifique a conexão.')); };
    const timer = setTimeout(fail, 15000);
    script.onerror = fail;
    window.onYouTubeIframeAPIReady = () => { cleanup(); if (window.YT?.Player) resolve(window.YT); else fail(); previous?.(); };
    document.head.append(script);
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}

export function youtubeError(code: number): string {
  if (code === 100) return 'Este vídeo foi removido, está privado ou não está disponível.';
  if (code === 101 || code === 150) return 'O autor não permite reproduzir este vídeo fora do YouTube. Escolha outro vídeo.';
  if (code === 153) return 'O YouTube não reconheceu a origem do aplicativo. Reinicie pelo comando pnpm dev ou confira a instalação.';
  if (code === 2) return 'O identificador do vídeo é inválido.';
  if (code === 5) return 'Não foi possível reproduzir este vídeo neste dispositivo.';
  return 'O YouTube não conseguiu reproduzir este vídeo. Tente novamente ou escolha outro.';
}
