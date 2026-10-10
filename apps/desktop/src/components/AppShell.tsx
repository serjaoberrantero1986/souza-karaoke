import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Images, LogOut, Play, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';
import { useQueueStore } from '../stores/queueStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useLocalTracksStore } from '../stores/localTracksStore';
import type { Track } from '../types/track';
import { Button, ConfirmDialog } from './ui';
import { RemoteQrCard } from './RemoteQrCard';
import { RemoteBridge } from './RemoteBridge';
import { BackgroundMusic } from './BackgroundMusic';
import { YoutubeRating } from './YoutubeRating';
import { programName, welcomeStyle } from '../lib/identity';
import { copy } from '../i18n/pt-BR';

export function BrandLogo() { const theme = useThemeStore(state => state.theme); return <div className="brand-identity">{theme.logoUrl && <img className="brand-image" src={theme.logoUrl} alt="Logotipo do karaokê"/>}<div className="brand-name">{programName(theme)}</div></div>; }
export function AppShell({ children }: { children: ReactNode }) {
  const theme = useThemeStore(state => state.theme); const settings = useSettingsStore(state => state.settings); const toast = useUiStore(state => state.toast); const clearToast = useUiStore(state => state.clearToast); const library = useLibraryStore(); const localTracks = useLocalTracksStore(state => state.tracks);
  const location = useLocation(); const navigate = useNavigate(); const [exit, setExit] = useState(false); const queueCount = useQueueStore(state => state.queue.length); const isHome = location.pathname === '/'; const isPlayer = location.pathname === '/player';
  const suggestions = useMemo(() => { if (!settings.suggestions) return []; if (settings.suggestionSource === 'Playlists') return [...new Set(library.playlists.flatMap(item => item.trackIds))].map(id => library.youtubeTracks[id] || localTracks.find(track => track.id === id)).filter((track): track is Track => !!track).slice(0, 4); const recent = [...new Map(library.history.map(item => [item.track.id, item.track])).values()]; if (settings.suggestionSource === 'Histórico recente') return recent.slice(0, 4); const counts = new Map<string, { track: Track; count: number }>(); library.history.forEach(item => { const current = counts.get(item.track.id); counts.set(item.track.id, { track: item.track, count: (current?.count || 0) + 1 }); }); return [...counts.values()].sort((a, b) => b.count - a.count).map(item => item.track).slice(0, 4); }, [settings.suggestions, settings.suggestionSource, library.playlists, library.youtubeTracks, library.history, localTracks]);
  useEffect(() => { if (toast) { const timer = setTimeout(clearToast, 3500); return () => clearTimeout(timer); } }, [toast, clearToast]);
  const style = { '--accent': theme.accentColor, ...(theme.backgroundImageUrl ? { backgroundImage: `url("${theme.backgroundImageUrl}")` } : {}) } as CSSProperties;
  return <div className={`app-shell ${!isHome && !isPlayer ? 'has-panel' : ''}`} style={style}>
    {!isPlayer && <><div className="shell-background" aria-hidden={!isHome}><div className="brand-position"><BrandLogo/></div>{settings.showQr && <div className="qr-position"><RemoteQrCard/></div>}<div className="home-welcome" style={welcomeStyle(theme)}><h1>{copy.home}</h1><p>{copy.welcome}</p>{suggestions.length > 0 && <div className="home-suggestions"><small>SUGESTÕES</small>{suggestions.map(track => <button key={track.id} onClick={() => { useQueueStore.getState().addToQueue(track); useUiStore.getState().notify(`${track.title} adicionada à fila.`); }}>{track.title}</button>)}</div>}</div></div><nav inert={!isHome} className="home-actions" aria-label="Navegação principal"><Button primary onClick={() => navigate('/karaokes')}><Play size={16} fill="currentColor"/> Escolher música</Button><Button onClick={() => navigate('/photos')}><Images size={16}/> Fotos</Button>{!settings.hideSettings && <Button onClick={() => navigate('/settings')}><Settings size={16}/> Configurações</Button>}<Button onClick={() => setExit(true)}><LogOut size={16}/> Sair</Button></nav>{settings.showShortcuts && <small className="shortcut-hint">Atalhos ativos: pausar/continuar · próxima · tom −/+ · fila</small>}</>}
    <RemoteBridge/><BackgroundMusic/><YoutubeRating/>{!isPlayer && <Button className="queue-shortcut" onClick={() => navigate('/queue')}>Fila de músicas ({queueCount})</Button>}{children}
    {toast && <div className="toast" role="status">{toast}</div>}
    {exit && <ConfirmDialog title="Sair do karaokê?" description="As playlists, preferências e o histórico ficam salvos neste computador. A fila da sessão será encerrada." onClose={() => setExit(false)} onConfirm={() => { if (window.desktop) void window.desktop.quit(); else useUiStore.getState().notify('Prévia no navegador: feche esta aba para sair.'); }}/>} 
  </div>;
}
