import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus } from 'lucide-react';
import { Button, ConfirmDialog, EmptyState, Panel, SearchInput, Select } from '../components/ui';
import { TrackRow } from '../components/TrackRow';
import { useLibraryStore } from '../stores/libraryStore';
import { useQueueStore } from '../stores/queueStore';
import { usePlayerStore } from '../stores/playerStore';
import { useUiStore } from '../stores/uiStore';
import { formatDate, normalize } from '../lib/format';
export function History() {
  const { history, clearHistory } = useLibraryStore(); const navigate = useNavigate(); const [query, setQuery] = useState(''); const [source, setSource] = useState('all'); const [selected, setSelected] = useState<string[]>([]); const [confirm, setConfirm] = useState(false);
  const filtered = history.filter(h => normalize(`${h.track.title} ${h.track.artist} ${h.requestedBy}`).includes(normalize(query)) && (source === 'all' || h.track.source === source));
  const chosen = history.filter(h => selected.includes(h.id));
  return <Panel title="Histórico" onBack={() => navigate('/karaokes')} actions={<><small>{history.length} reprodução(ões)</small><Button danger disabled={!history.length} onClick={() => setConfirm(true)}>Limpar histórico</Button></>} footer={<><Button onClick={() => setSelected([])}>Limpar seleção</Button><span className="accent-text">{chosen.length} selecionada(s)</span><Button className="push-right" disabled={!chosen.length} onClick={() => { chosen.forEach(h => useQueueStore.getState().addToQueue(h.track)); useUiStore.getState().notify('Músicas adicionadas à fila.'); setSelected([]); }}><Plus size={15}/> À fila</Button><Button primary disabled={!chosen.length} onClick={() => { const [first, ...rest] = chosen; rest.forEach(h => useQueueStore.getState().addToQueue(h.track)); usePlayerStore.getState().play(first.track, 'Operador', true); navigate('/player'); }}><Play size={15}/> Tocar selecionada(s)</Button></>}><div className="search-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="Buscar no histórico..."/><Select label="Filtrar histórico por origem" value={source} onChange={e => setSource(e.target.value)}><option value="all">Fonte: Todas</option><option value="local">Local</option><option value="youtube">YouTube</option></Select></div><div className="history-list">{filtered.map(h => <TrackRow key={h.id} track={h.track} onRequest={() => { useQueueStore.getState().addToQueue(h.track); useUiStore.getState().notify(`${h.track.title} adicionada à fila.`); }} prefix={<time className="history-time" dateTime={h.playedAt}>{formatDate(h.playedAt)}</time>} subtitle={`Pedido por ${h.requestedBy}`} selected={selected.includes(h.id)} onSelect={() => setSelected(ids => ids.includes(h.id) ? ids.filter(id => id !== h.id) : [...ids, h.id])}/>)}{!filtered.length && <EmptyState title="Nenhuma reprodução encontrada"/>}</div>{confirm && <ConfirmDialog title="Limpar histórico?" description="Os registros locais serão removidos. As playlists serão mantidas." onClose={() => setConfirm(false)} onConfirm={() => { clearHistory(); setSelected([]); }}/>}</Panel>;
}
