import { useEffect, useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';

function detectPitch(data: Float32Array, sampleRate: number) {
  let rms = 0; for (const value of data) rms += value * value; rms = Math.sqrt(rms / data.length); if (rms < 0.015) return undefined;
  let bestOffset = -1; let best = 0;
  const minOffset = Math.floor(sampleRate / 1000); const maxOffset = Math.min(Math.floor(sampleRate / 70), data.length / 2);
  for (let offset = minOffset; offset < maxOffset; offset++) { let correlation = 0; for (let i = 0; i < data.length - offset; i++) correlation += data[i] * data[i + offset]; if (correlation > best) { best = correlation; bestOffset = offset; } }
  return bestOffset > 0 ? sampleRate / bestOffset : undefined;
}

export function VocalAnalyzer() {
  const [error, setError] = useState('');
  const microphone = useSettingsStore(state => state.settings.microphone);
  useEffect(() => {
    let stopped = false; let frame = 0; let stream: MediaStream | undefined; let context: AudioContext | undefined;
    void navigator.mediaDevices.getUserMedia({ audio: { deviceId: microphone && microphone !== 'default' ? { exact: microphone } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false }).then(media => {
      if (stopped) { media.getTracks().forEach(track => track.stop()); return; } stream = media; context = new AudioContext(); const analyser = context.createAnalyser(); analyser.fftSize = 2048; context.createMediaStreamSource(media).connect(analyser); const data = new Float32Array(analyser.fftSize);
      const sample = () => { if (stopped) return; analyser.getFloatTimeDomainData(data); let rms = 0; for (const value of data) rms += value * value; const level = Math.min(100, Math.round(Math.sqrt(rms / data.length) * 350)); usePlayerStore.getState().sampleVocal(level, detectPitch(data, context!.sampleRate)); frame = window.setTimeout(sample, 180); }; sample();
    }).catch(() => setError('Microfone indisponível. Libere o acesso no Windows e reinicie a música.'));
    return () => { stopped = true; clearTimeout(frame); stream?.getTracks().forEach(track => track.stop()); void context?.close(); };
  }, [microphone]);
  const level = usePlayerStore(state => state.microphoneLevel); const vocal = usePlayerStore(state => state.vocal);
  return <div className="microphone-meter"><span>Voz {vocal.maxHz ? `· ${Math.round(vocal.minHz)}–${Math.round(vocal.maxHz)} Hz` : ''}</span><div className="meter"><span style={{ width: `${level}%` }}/></div>{error && <small role="alert">{error}</small>}</div>;
}
