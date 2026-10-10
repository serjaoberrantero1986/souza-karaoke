import { useEffect, useRef, useState } from 'react';
import { SoundTouchNode } from '@soundtouchjs/audio-worklet';
import processorUrl from '@soundtouchjs/audio-worklet/processor?url';
import { usePlayerStore } from '../stores/playerStore';
export function LocalPlayer({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null); const [error, setError] = useState('');
  useEffect(() => {
    const video = ref.current!;
    const context = new AudioContext(); let soundTouch: SoundTouchNode | undefined; let disposed = false;
    const audioReady = SoundTouchNode.register(context, processorUrl).then(() => { if (disposed) return; const source = context.createMediaElementSource(video); soundTouch = new SoundTouchNode({ context }); soundTouch.pitchSemitones.value = usePlayerStore.getState().pitch; source.connect(soundTouch); soundTouch.connect(context.destination); video.preservesPitch = false; });
    const play = () => { void audioReady.then(() => context.resume()).then(() => video.play()).catch(() => { usePlayerStore.getState().pause(); setError('Clique em Continuar para reproduzir. Se não abrir, o formato pode não ser compatível.'); }); };
    video.volume = usePlayerStore.getState().volume / 100;
    if (usePlayerStore.getState().status === 'playing') play();
    const unsubscribe = usePlayerStore.subscribe((state, previous) => {
      video.volume = state.volume / 100;
      if (state.seekRevision !== previous.seekRevision) video.currentTime = state.currentTime;
      if (state.pitch !== previous.pitch && soundTouch) soundTouch.pitchSemitones.value = state.pitch;
      if (state.status !== previous.status) { if (state.status === 'playing') play(); else if (state.status === 'paused') video.pause(); }
    });
    return () => { disposed = true; unsubscribe(); video.pause(); soundTouch?.disconnect(); void context.close(); };
  }, [url]);
  return <div className="youtube-playback"><video ref={ref} src={url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onTimeUpdate={event => { const v = event.currentTarget; if (Number.isFinite(v.duration)) usePlayerStore.getState().syncMedia(v.currentTime, v.duration); }} onPlay={() => setError('')} onEnded={() => usePlayerStore.getState().finish()} onError={() => { usePlayerStore.getState().pause(); setError('Arquivo indisponível ou formato incompatível. Selecione a pasta novamente.'); }}/>{error && <p role="alert">{error}</p>}</div>;
}
