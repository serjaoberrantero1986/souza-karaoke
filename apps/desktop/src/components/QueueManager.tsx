import { useUiStore } from '../stores/uiStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Play, Trash2 } from 'lucide-react';
import { useQueueStore } from '../stores/queueStore';
import { usePlayerStore } from '../stores/playerStore';
import { TrackRow } from './TrackRow';
import { Button, ConfirmDialog, EmptyState, IconButton } from './ui';
export function QueueManager() {
  const navigate = useNavigate(); const player = usePlayerStore();
  const { queue, removeFromQueue, moveQueueItem, clearQueue } = useQueueStore(); const [confirm, setConfirm] = useState(false);
  return <>{player.sessionTracks.length > 0 && <section><h3>Histórico da sessão</h3>{player.sessionTracks.map((item, index) => <TrackRow key={item.id} track={item.track} onRequest={() => { useQueueStore.getState().addToQueue(item.track); useUiStore.getState().notify(`${item.track.title} adicionada à fila.`); }} subtitle={`${item.requestedBy} · ${index === player.sessionIndex && player.currentTrack ? 'Atual' : index <= player.sessionIndex ? 'Anterior' : 'A seguir'}`}/>)}</section>}<div className="inline-actions"><p className="muted">{queue.length} música(s) aguardando</p><Button className="push-right" disabled={!queue.length} onClick={() => setConfirm(true)}>Limpar fila</Button></div>{queue.map((item, i) => <TrackRow key={item.id} track={item.track} prefix={<small>{i + 1}</small>} subtitle={`Pedido por ${item.requestedBy}`} actions={<><IconButton label={`Subir ${item.track.title}`} disabled={i === 0} onClick={() => moveQueueItem(item.id, -1)}><ArrowUp size={14}/></IconButton><IconButton label={`Descer ${item.track.title}`} disabled={i === queue.length - 1} onClick={() => moveQueueItem(item.id, 1)}><ArrowDown size={14}/></IconButton><IconButton label={`Tocar ${item.track.title} agora`} onClick={() => { removeFromQueue(item.id); usePlayerStore.getState().play(item.track, item.requestedBy, false, item.requestedByDeviceId); navigate('/player'); }}><Play size={14}/></IconButton><IconButton label={`Remover ${item.track.title}`} onClick={() => removeFromQueue(item.id)}><Trash2 size={14}/></IconButton></>}/>)}{!queue.length && <EmptyState title="A fila está vazia" description="Adicione uma música para continuar a festa."/>}{confirm && <ConfirmDialog title="Limpar fila?" description="Todas as músicas aguardando serão removidas. A música atual continua." onConfirm={clearQueue} onClose={() => setConfirm(false)}/>}</>;
}
