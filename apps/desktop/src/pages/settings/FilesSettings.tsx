import { useState } from 'react';
import { Button } from '../../components/ui';
import { ChoiceSetting, SettingsRow } from '../../components/SettingsFields';
import { useLocalTracksStore } from '../../stores/localTracksStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function FilesSettings() {
  const folder = useLocalTracksStore(state => state.folder); const count = useLocalTracksStore(state => state.tracks.length); const [message, setMessage] = useState('');
  function select() { void window.desktop?.selectLocalLibrary().then(library => { if (!library) return; useLocalTracksStore.getState().setLibrary(library.folder, library.tracks); useSettingsStore.getState().update('folder', library.folder); setMessage(`${library.tracks.length} arquivo(s) compatível(is) encontrado(s).`); }).catch(error => setMessage(error.message)); }
  return <><h2>Arquivos locais</h2><SettingsRow label="Pasta de karaokês" description="A pasta é reindexada automaticamente quando o aplicativo abre."><div><div className="folder-display">{folder || 'Nenhuma pasta selecionada'}</div><Button onClick={select}>Selecionar pasta</Button></div></SettingsRow><ChoiceSetting field="sort" label="Ordenação inicial" options={[{ value: 'relevance', label: 'Relevância' }, { value: 'title', label: 'Título' }, { value: 'artist', label: 'Artista/pasta' }, { value: 'duration', label: 'Duração' }]}/><p className="settings-note" role="status">{message || `${count} arquivo(s) disponíveis na busca geral.`}</p></>;
}
