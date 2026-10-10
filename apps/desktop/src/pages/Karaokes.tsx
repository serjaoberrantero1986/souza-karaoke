import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { History, ListMusic, Play, Plus } from 'lucide-react';
import { Button, Panel } from '../components/ui';
import { TrackBrowser } from '../components/TrackBrowser';
import { useLibraryStore } from '../stores/libraryStore';
import { useLocalTracksStore } from '../stores/localTracksStore';
import { usePlayerStore } from '../stores/playerStore';
import { useQueueStore } from '../stores/queueStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';

export function Karaokes() {
  const folderInput = useRef<HTMLInputElement>(null); const localTracks = useLocalTracksStore(state => state.tracks); const savedTracks = useLibraryStore(state => state.youtubeTracks); const catalog = [...localTracks, ...Object.values(savedTracks)];
  const navigate = useNavigate(); const [params] = useSearchParams(); const [selected, setSelected] = useState<string[]>([]);
  function playSelection() { const chosen = selected.map(id => catalog.find(track => track.id === id)).filter(track => !!track); const [first, ...rest] = chosen; if (!first) return; rest.forEach(track => useQueueStore.getState().addToQueue(track)); usePlayerStore.getState().play(first, 'Operador', true); navigate('/player'); }
  function selectFolder() { if (window.desktop) void window.desktop.selectLocalLibrary().then(library => { if (!library) return; useLocalTracksStore.getState().setLibrary(library.folder, library.tracks); useSettingsStore.getState().update('folder', library.folder); useUiStore.getState().notify(`${library.tracks.length} arquivo(s) local(is) encontrados.`); }).catch(error => useUiStore.getState().notify(error.message)); else folderInput.current?.click(); }
  return <Panel title="Músicas" onBack={() => navigate('/')} actions={<><Button onClick={() => navigate('/playlists')}><ListMusic size={16}/> Playlists</Button><Button onClick={() => navigate('/history')}><History size={16}/> Histórico</Button><small>{localTracks.length} arquivo(s) local(is)</small></>} footer={<><input type="file" hidden multiple ref={node => { folderInput.current = node; node?.setAttribute('webkitdirectory', ''); }} onChange={event => { useLocalTracksStore.getState().importFiles(Array.from(event.target.files || [])); useUiStore.getState().notify('Arquivos compatíveis adicionados à busca nesta sessão.'); }}/><Button onClick={selectFolder}>Selecionar pasta local</Button><Button onClick={() => setSelected([])}>Limpar</Button><span className="accent-text">{selected.length} selecionada(s)</span><Button className="push-right" disabled={!selected.length} onClick={() => { selected.forEach(id => { const track = catalog.find(item => item.id === id); if (track) useQueueStore.getState().addToQueue(track); }); useUiStore.getState().notify(`${selected.length} música(s) adicionada(s) à fila.`); setSelected([]); }}><Plus size={16}/> À fila</Button><Button primary disabled={!selected.length} onClick={playSelection}><Play size={16}/> Tocar selecionada(s)</Button></>}><TrackBrowser key={params.toString()} initialQuery={params.get('q') ?? ''} selected={selected} onSelect={track => setSelected(ids => ids.includes(track.id) ? ids.filter(id => id !== track.id) : [...ids, track.id])}/></Panel>;
}
