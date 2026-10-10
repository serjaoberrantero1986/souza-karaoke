import { useEffect, useRef } from 'react';
import { SoundTouchNode } from '@soundtouchjs/audio-worklet';
import processorUrl from '@soundtouchjs/audio-worklet/processor?url';
import { loadYoutubeApi, youtubeError, type YoutubePlayer } from '../services/youtube/iframe';
import type { AudioPipelineMessage } from '../stores/remoteStore';

const params = new URLSearchParams(window.location.search);
const pipelineId = params.get('pipeline') || '';
const send = (message: Omit<AudioPipelineMessage, 'id'>) => window.desktop?.audioSend({ id: pipelineId, ...message });

export function YoutubeAudioSource() {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false; let ready = false; let player: YoutubePlayer | undefined; let latest: AudioPipelineMessage | undefined; let seekRevision: number | undefined;
    const apply = () => {
      if (!ready || !player || !latest) return;
      player.setVolume(100);
      if (latest.seekRevision !== seekRevision) { player.seekTo(latest.time || 0, true); seekRevision = latest.seekRevision; }
      if (latest.status === 'playing' && player.getPlayerState() !== 1) player.playVideo();
      else if (latest.status !== 'playing' && player.getPlayerState() === 1) player.pauseVideo();
    };
    const unsubscribe = window.desktop?.audioListen(message => { if (message.id === pipelineId && message.type === 'command') { latest = message; apply(); } });
    const host = document.createElement('div'); mount.current?.replaceChildren(host);
    void loadYoutubeApi().then(api => {
      if (disposed) return;
      player = new api.Player(host, { videoId: params.get('youtube-source') || '', width: '100%', height: '100%', playerVars: { origin: window.location.origin, controls: 0, autoplay: 0, playsinline: 1 }, events: {
        onReady: () => { ready = true; send({ type: 'ready' }); apply(); },
        onStateChange: event => { if (event.data === 0) send({ type: 'media', status: 'ended' }); if (event.data === 1 && latest?.status !== 'playing') player?.pauseVideo(); },
        onError: event => send({ type: 'error', error: youtubeError(event.data), errorCode: event.data }),
        onAutoplayBlocked: () => send({ type: 'error', error: 'O YouTube bloqueou o início automático. Clique no vídeo para iniciar.' }),
      } });
    }).catch(error => send({ type: 'error', error: error.message }));
    const timer = setInterval(() => { if (ready && player) send({ type: 'media', time: player.getCurrentTime(), duration: player.getDuration() }); }, 250);
    return () => { disposed = true; unsubscribe?.(); clearInterval(timer); player?.destroy(); };
  }, []);
  return <div ref={mount} className="isolated-youtube-source"/>;
}

export function YoutubeAudioOutput() {
  useEffect(() => {
    let disposed = false; let stream: MediaStream | undefined; let context: AudioContext | undefined; let touch: SoundTouchNode | undefined; let gain: GainNode | undefined; let timer: number | undefined;
    let latest: AudioPipelineMessage | undefined;
    const apply = () => { if (touch && latest) touch.pitchSemitones.value = latest.pitch || 0; if (gain && latest) gain.gain.value = (latest.volume ?? 80) / 100; };
    const unsubscribe = window.desktop?.audioListen(message => { if (message.id === pipelineId && message.type === 'command') { latest = message; apply(); } });
    void (async () => {
      const media = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (disposed) { media.getTracks().forEach(track => track.stop()); return; }
      stream = media;
      if (!media.getAudioTracks().length) throw new Error('A captura isolada não forneceu áudio neste computador.');
      context = new AudioContext({ latencyHint: 'interactive' });
      await SoundTouchNode.register(context, processorUrl);
      if (disposed) return;
      touch = new SoundTouchNode({ context }); gain = context.createGain();
      const analyser = context.createAnalyser(); analyser.fftSize = 4096;
      context.createMediaStreamSource(new MediaStream(media.getAudioTracks())).connect(touch); touch.connect(gain); gain.connect(analyser); analyser.connect(context.destination);
      apply(); await context.resume();
      send({ type: 'audio-ready' });
      const data = new Float32Array(analyser.frequencyBinCount);
      const waveform = new Float32Array(analyser.fftSize);
      timer = window.setInterval(() => {
        analyser.getFloatFrequencyData(data); analyser.getFloatTimeDomainData(waveform);
        let peak = 1; for (let i = 2; i < data.length; i++) if (data[i] > data[peak]) peak = i;
        let sum = 0; for (const value of waveform) sum += value * value;
        send({ type: 'diagnostic', status: context!.state, time: context!.currentTime, duration: touch?.metrics?.blockCount, pitch: touch?.pitchSemitones.value, frequency: peak * context!.sampleRate / analyser.fftSize, rms: Math.sqrt(sum / waveform.length) });
      }, 500);
    })().catch(error => {
      if (!disposed) { stream?.getTracks().forEach(track => track.stop()); void context?.close(); send({ type: 'error', error: `Processamento de tom: ${error.message}` }); }
    });
    return () => { disposed = true; unsubscribe?.(); clearInterval(timer); stream?.getTracks().forEach(track => track.stop()); touch?.disconnect(); void context?.close(); };
  }, []);
  return null;
}
