import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';

export function BackgroundMusic() {
  const audio = useRef<HTMLAudioElement>(null); const [source, setSource] = useState('');
  const settings = useSettingsStore(state => state.settings); const status = usePlayerStore(state => state.status);
  useEffect(() => { if (settings.backgroundMusic) void window.desktop?.loadBackgroundMusic().then(setSource); }, [settings.backgroundMusic]);
  useEffect(() => { const element = audio.current; if (!element || !source) return; element.volume = settings.backgroundVolume / 100; if (settings.backgroundMusic && ['idle', 'intermission'].includes(status)) void element.play().catch(() => undefined); else element.pause(); }, [source, settings.backgroundMusic, settings.backgroundVolume, status]);
  return <audio ref={audio} src={source} loop/>;
}
