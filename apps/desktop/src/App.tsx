import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AudienceDisplay } from './components/AudienceDisplay';
import { QueueManager } from './components/QueueManager';
import { Panel } from './components/ui';
import { VocalAnalyzer } from './components/VocalAnalyzer';
import { History } from './pages/History';
import { Karaokes } from './pages/Karaokes';
import { Photos } from './pages/Photos';
import { Player } from './pages/Player';
import { Playlists } from './pages/Playlists';
import { Settings } from './pages/Settings';
import { Studio } from './pages/studio/Studio';
import { usePlayerStore } from './stores/playerStore';
import { useSettingsStore } from './stores/settingsStore';
import { useYoutubeStore } from './stores/youtubeStore';
import { useLocalTracksStore } from './stores/localTracksStore';

function QueuePage() { const navigate = useNavigate(); return <Panel title="Fila de músicas" onBack={() => navigate('/')}><QueueManager/></Panel>; }
export function App() {
  const settings = useSettingsStore(state => state.settings); const player = usePlayerStore();
  const isAudience = new URLSearchParams(window.location.search).has('audience');
  useEffect(() => { let active = true; if (window.desktop && !isAudience) void window.desktop.loadYoutubeKey().then(key => { if (active && !useYoutubeStore.getState().apiKey) useYoutubeStore.getState().setApiKey(key); }).catch(() => { if (active) useYoutubeStore.setState({ error: 'Não foi possível recuperar a chave salva. Configure-a novamente.' }); }); return () => { active = false; }; }, [isAudience]);
  useEffect(() => { if (!window.desktop || isAudience) return; void window.desktop.loadLocalLibrary().then(library => { useLocalTracksStore.getState().setLibrary(library.folder, library.tracks); useSettingsStore.getState().update('folder', library.folder); }).catch(() => undefined); }, [isAudience]);
  useEffect(() => { if (isAudience) return; const timer = setInterval(() => usePlayerStore.getState().tick(), 1000); return () => clearInterval(timer); }, [isAudience]);
  useEffect(() => { if (!isAudience) void window.desktop?.setAutoStart(settings.autoStart); }, [settings.autoStart, isAudience]);
  useEffect(() => { if (!isAudience) void window.desktop?.setSecondDisplay(settings.twoMonitors); }, [settings.twoMonitors, isAudience]);
  useEffect(() => {
    if (isAudience) return; const channel = new BroadcastChannel('karaoke-audience-v1');
    const publish = () => channel.postMessage({ status: player.status, requestedBy: player.requestedBy, score: player.score, scoreNotice: player.scoreNotice, countdown: player.countdown, photoDataUrl: player.photoDataUrl, title: player.currentTrack?.title, artist: player.currentTrack?.artist, youtubeVideoId: player.currentTrack?.youtubeVideoId, mediaUrl: player.currentTrack?.mediaUrl, currentTime: player.currentTime });
    publish(); channel.onmessage = event => { if (event.data?.request) publish(); }; return () => channel.close();
  }, [isAudience, player.status, player.requestedBy, player.score, player.scoreNotice, player.countdown, player.photoDataUrl, player.currentTrack, player.currentTime]);
  useEffect(() => {
    if (isAudience) return; const onKey = (event: KeyboardEvent) => { const target = event.target as HTMLElement; if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return; const shortcuts = useSettingsStore.getState().settings.shortcuts; const current = usePlayerStore.getState(); if (event.code === shortcuts.playPause) { event.preventDefault(); if (current.status === 'paused') current.resume(); else current.pause(); } if (event.code === shortcuts.next) { event.preventDefault(); current.skip(); } if (event.code === shortcuts.pitchDown) { event.preventDefault(); current.decreasePitch(); } if (event.code === shortcuts.pitchUp) { event.preventDefault(); current.increasePitch(); } if (event.code === shortcuts.queue) { event.preventDefault(); window.location.hash = '#/queue'; } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [isAudience]);
  if (isAudience) return <AudienceDisplay/>;
  return <HashRouter><AppShell>{settings.scoreEnabled && settings.scoreMode === 'microphone' && player.status === 'playing' && <VocalAnalyzer/>}<Routes>
    <Route path="/" element={null}/><Route path="/karaokes" element={<Karaokes/>}/><Route path="/queue" element={<QueuePage/>}/><Route path="/player" element={<Player/>}/><Route path="/playlists" element={<Playlists/>}/><Route path="/history" element={<History/>}/><Route path="/photos" element={<Photos/>}/><Route path="/settings/:section?" element={<Settings/>}/><Route path="/studio" element={<Studio/>}/><Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></AppShell></HashRouter>;
}
