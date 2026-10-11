import { markUnavailable } from '../services/youtube/availability';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { loadYoutubeApi, youtubeError, type YoutubePlayer as PlayerApi } from '../services/youtube/iframe';
import { usePlayerStore } from '../stores/playerStore';
import { Button } from './ui';
import { useSettingsStore } from '../stores/settingsStore';
import { CapturedYoutubePlayer } from './CapturedYoutubePlayer';

export function YoutubePlayer({ videoId }: { videoId: string }) {
  const capture = useSettingsStore(state => state.settings.youtubePitch);
  const fallback = usePlayerStore(state => state.audioFallback);
  return capture && !fallback && window.desktop ? <CapturedYoutubePlayer videoId={videoId}/> : <OfficialYoutubePlayer videoId={videoId}/>;
}
function OfficialYoutubePlayer({ videoId }: { videoId: string }) {
  const navigate = useNavigate();
  const mount = useRef<HTMLDivElement>(null); const player = useRef<PlayerApi | null>(null);
  const [message, setMessage] = useState('Carregando player do YouTube…'); const [failed, setFailed] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false; let ready = false; let endHandled = false;
    const host = document.createElement('div'); mount.current?.append(host);
    setFailed(false); setMessage('Carregando player do YouTube…');
    const fail = (message: string) => { if (disposed) return; setMessage(message); setFailed(true); usePlayerStore.getState().pause(); };
    const readyTimer = setTimeout(() => fail('O player demorou para responder. Verifique sua conexão e tente novamente.'), 25000);
    void loadYoutubeApi().then(api => {
      if (disposed) return;
      player.current = new api.Player(host, {
        videoId, width: '100%', height: '100%',
        playerVars: { origin: window.location.origin, playsinline: 1, controls: 0, autoplay: 0 },
        events: {
          onReady: event => {
            if (disposed) return;
            clearTimeout(readyTimer); ready = true; setMessage('');
            event.target.setVolume(usePlayerStore.getState().volume);
            if (usePlayerStore.getState().status === 'playing') event.target.playVideo();
          },
          onStateChange: event => {
            if (disposed) return;
            if (event.data === 1) { endHandled = false; setMessage(''); usePlayerStore.getState().resume(); }
            if (event.data === 2) usePlayerStore.getState().pause();
            if (event.data === 3) setMessage('Carregando vídeo…');
            if (event.data === 0 && !endHandled) { endHandled = true; usePlayerStore.getState().finish(); }
          },
          onError: event => { markUnavailable(videoId, event.data); clearTimeout(readyTimer); fail(youtubeError(event.data)); },
          onAutoplayBlocked: () => { if (!disposed) { setMessage('Clique em Continuar ou no player do YouTube para iniciar o vídeo.'); usePlayerStore.getState().pause(); } },
        },
      });
    }).catch(error => { clearTimeout(readyTimer); fail((error as Error).message); });
    const unsubscribe = usePlayerStore.subscribe((state, previous) => {
      const instance = player.current;
      if (!ready || !instance || state.currentTrack?.youtubeVideoId !== videoId) return;
      if (state.volume !== previous.volume) instance.setVolume(state.volume);
      if (state.seekRevision !== previous.seekRevision) instance.seekTo(state.currentTime, true);
      if (state.status !== previous.status) {
        if (state.status === 'playing' && instance.getPlayerState() !== 1) instance.playVideo();
        if (state.status === 'paused' && instance.getPlayerState() !== 2) instance.pauseVideo();
      }
    });
    const timer = setInterval(() => {
      if (!ready || !player.current) return;
      const time = player.current.getCurrentTime(); const duration = player.current.getDuration();
      if (Number.isFinite(time) && Number.isFinite(duration)) usePlayerStore.getState().syncMedia(time, duration);
    }, 500);
    return () => { disposed = true; clearTimeout(readyTimer); clearInterval(timer); unsubscribe(); player.current?.destroy(); player.current = null; host.remove(); };
  }, [videoId, attempt]);
  return <div className="youtube-playback"><div className="youtube-frame" ref={mount}/>{message && <div className="youtube-playback-message" role={failed ? 'alert' : 'status'}>{message}{failed && <><Button onClick={() => navigate(`/karaokes?q=${encodeURIComponent(usePlayerStore.getState().currentTrack?.title || '')}`)}>Buscar outra versão</Button><Button onClick={() => { usePlayerStore.getState().resume(); setAttempt(n => n + 1); }}>Tentar novamente</Button></>}</div>}</div>;
}
