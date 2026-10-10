import { useEffect, useRef, useState } from 'react';
import { loadYoutubeApi, type YoutubePlayer } from '../services/youtube/iframe';
import type { PlayerState } from '../types/player';

type AudienceState = Pick<PlayerState, 'status' | 'requestedBy' | 'score' | 'countdown' | 'photoDataUrl' | 'currentTime'> & { scoreNotice?: string; title?: string; artist?: string; youtubeVideoId?: string; mediaUrl?: string };
function AudienceMedia({ state }: { state: AudienceState }) {
  const video = useRef<HTMLVideoElement>(null); const mount = useRef<HTMLDivElement>(null); const youtube = useRef<YoutubePlayer | null>(null); const latest = useRef(state); latest.current = state;
  useEffect(() => { const element = video.current; if (!element || !state.mediaUrl) return; if (Math.abs(element.currentTime - state.currentTime) > 1.5) element.currentTime = state.currentTime; if (state.status === 'playing') void element.play().catch(() => undefined); else element.pause(); }, [state.mediaUrl, state.currentTime, state.status]);
  useEffect(() => { if (!state.youtubeVideoId || !mount.current) return; let disposed = false; const host = document.createElement('div'); mount.current.replaceChildren(host); void loadYoutubeApi().then(api => { if (disposed) return; youtube.current = new api.Player(host, { videoId: state.youtubeVideoId!, width: '100%', height: '100%', playerVars: { origin: window.location.origin, playsinline: 1, controls: 0, autoplay: 1, mute: 1 }, events: { onReady: event => { event.target.mute(); event.target.seekTo(latest.current.currentTime, true); if (latest.current.status === 'playing') event.target.playVideo(); }, onStateChange: () => undefined, onError: () => undefined, onAutoplayBlocked: () => undefined } }); }); return () => { disposed = true; youtube.current?.destroy(); youtube.current = null; }; }, [state.youtubeVideoId]);
  useEffect(() => { const player = youtube.current; if (!player) return; if (Math.abs(player.getCurrentTime() - state.currentTime) > 2) player.seekTo(state.currentTime, true); if (state.status === 'playing') player.playVideo(); else player.pauseVideo(); }, [state.currentTime, state.status]);
  if (state.mediaUrl) return <video ref={video} className="audience-media" src={state.mediaUrl} muted playsInline/>;
  if (state.youtubeVideoId) return <div ref={mount} className="audience-media"/>;
  return null;
}
export function AudienceDisplay() {
  const [state, setState] = useState<AudienceState>({ status: 'idle', requestedBy: '', score: 0, countdown: 0, currentTime: 0 });
  useEffect(() => { const channel = new BroadcastChannel('karaoke-audience-v1'); channel.onmessage = event => setState(event.data as AudienceState); channel.postMessage({ request: true }); return () => channel.close(); }, []);
  const playing = ['playing', 'paused'].includes(state.status) && (state.youtubeVideoId || state.mediaUrl);
  return <main className="audience-display">{state.status === 'idle' ? <><h1>MEU <span>KARAOKÊ</span></h1><p>Aguardando a próxima apresentação</p></> : state.status === 'scoring' ? <><small>PONTUAÇÃO DE {state.requestedBy}</small><strong>{state.scoreNotice || state.score}</strong></> : state.status === 'photo' && state.photoDataUrl ? <><img src={state.photoDataUrl} alt="Foto da apresentação"/><h2>{state.requestedBy} · {state.score} pontos</h2></> : playing ? <><AudienceMedia state={state}/><div className="audience-caption"><span>{state.title}</span><small>{state.requestedBy}</small></div></> : <><small>{state.status === 'intermission' ? `COMEÇA EM ${state.countdown}` : 'TOCANDO AGORA'}</small><h1>{state.title}</h1><h2>{state.artist}</h2><p>Quem canta: {state.requestedBy}</p></>}</main>;
}
