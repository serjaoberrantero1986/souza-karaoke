import { markUnavailable } from '../services/youtube/availability';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';

export function CapturedYoutubePlayer({ videoId }: { videoId: string }) {
  const navigate = useNavigate();
  const pipelineId = useRef(''); const [canFallback, setCanFallback] = useState(true);
  const mount = useRef<HTMLDivElement>(null); const [error, setError] = useState(''); const [ready, setReady] = useState(false);
  useEffect(() => {
    const desktop = window.desktop!; const id = crypto.randomUUID(); let disposed = false; let captured = false; pipelineId.current = id; setError(''); setReady(false); setCanFallback(true);
    const bounds = () => { const rect = mount.current!.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; };
    const command = () => { const state = usePlayerStore.getState(); desktop.audioSend({ id, type: 'command', status: captured ? state.status : 'paused', pitch: state.pitch, volume: state.volume, time: state.currentTime, seekRevision: state.seekRevision }); };
    const unsubscribe = desktop.audioListen(message => {
      if (disposed || message.id !== id) return;
      if (message.type === 'audio-ready') { captured = true; setReady(true); clearTimeout(timeout); command(); }
      if (message.type === 'ready') command();
      if (message.type === 'media') { if (message.status === 'ended') usePlayerStore.getState().finish(); else if (Number.isFinite(message.time) && Number.isFinite(message.duration)) usePlayerStore.getState().syncMedia(message.time!, message.duration!); }
      if (message.type === 'error') { clearTimeout(timeout); setCanFallback(!message.errorCode); markUnavailable(videoId, message.errorCode || 0); setError(message.error || 'Falha no processamento de áudio.'); usePlayerStore.getState().pause(); }
    });
    const timeout = window.setTimeout(() => { setError('A captura de áudio não respondeu. Você pode reproduzir esta música no tom original.'); usePlayerStore.getState().pause(); }, 30000);
    const stopStore = usePlayerStore.subscribe((state, previous) => { if (state.status !== previous.status || state.pitch !== previous.pitch || state.volume !== previous.volume || state.seekRevision !== previous.seekRevision) command(); });
    const observer = new ResizeObserver(() => { if (!disposed) void desktop.audioBounds({ id, bounds: bounds() }).catch(() => undefined); }); observer.observe(mount.current!);
    const reposition = () => { if (!disposed) void desktop.audioBounds({ id, bounds: bounds() }).catch(() => undefined); };
    window.addEventListener('resize', reposition); window.addEventListener('scroll', reposition, true);
    void desktop.audioOpen({ id, videoId, bounds: bounds() }).then(result => { if (disposed) return desktop.audioClose(id); if (result.status === 'cancelled') return; if (result.status === 'failed') { clearTimeout(timeout); setError(result.message || 'Não foi possível preparar o áudio.'); usePlayerStore.getState().pause(); return; } command(); }).catch(error => { if (!disposed) { clearTimeout(timeout); setError(error.message); usePlayerStore.getState().pause(); } });
    return () => { disposed = true; clearTimeout(timeout); unsubscribe(); stopStore(); observer.disconnect(); window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true); void desktop.audioClose(id).catch(() => undefined); };
  }, [videoId]);
  return <div className="youtube-playback"><div ref={mount} className="youtube-frame"/>{error ? <p className="audio-notice" role="alert">{error}{canFallback && <Button onClick={async () => { await window.desktop?.audioClose(pipelineId.current); usePlayerStore.setState({ audioFallback: true, pitch: 0 }); usePlayerStore.getState().resume(); }}>Reproduzir no tom original</Button>}<Button onClick={() => navigate(`/karaokes?q=${encodeURIComponent(usePlayerStore.getState().currentTrack?.title || '')}`)}>Buscar outra versão</Button></p> : <small className="audio-notice">{ready ? 'Alterar Tom ativo' : 'Preparando áudio…'}</small>}</div>;
}
