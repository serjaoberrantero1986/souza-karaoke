import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Panel } from '../components/ui';
import type { SavedPhoto } from '../stores/remoteStore';

export function Photos() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [error, setError] = useState('');
  async function load() {
    if (!window.desktop) return;
    try {
      const items = await window.desktop.listPhotos();
      setPhotos(await Promise.all(items.map(async item => ({ ...item, dataUrl: await window.desktop!.readPhoto(item.id) }))));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a galeria.'); }
  }
  useEffect(() => { void load(); }, []);
  return <Panel title="Galeria de fotos" onBack={() => navigate('/')}>
    {error && <p role="alert" className="youtube-message">{error}</p>}
    {!photos.length ? <EmptyState title="Nenhuma foto ainda" description="As fotos feitas pelo controle do celular aparecerão aqui."/> : <div className="photo-gallery">{photos.map(photo => <article key={photo.id}><img src={photo.dataUrl} alt={`Apresentação de ${photo.singer}`}/><h2>{photo.singer || 'Participante'}</h2><p>{photo.song}</p><small>{photo.score} pontos · {new Date(photo.createdAt).toLocaleString('pt-BR')}</small><div className="inline-actions"><Button onClick={() => { const anchor = document.createElement('a'); anchor.href = photo.dataUrl || ''; anchor.download = `${photo.singer || 'karaoke'}-${photo.id}.jpg`; anchor.click(); }}>Baixar</Button><Button danger onClick={() => { void window.desktop?.deletePhoto(photo.id).then(load); }}>Excluir</Button></div></article>)}</div>}
  </Panel>;
}
