import { useEffect, useState } from 'react';
import { SettingsRow } from './SettingsFields';
import { Button } from './ui';
import { useSettingsStore } from '../stores/settingsStore';

export function PhotoFolderPicker() {
  const saved = useSettingsStore(state => state.settings.photoFolder); const [folder, setFolder] = useState(saved);
  useEffect(() => { if (!window.desktop) return; void window.desktop.getPhotoFolder().then(value => { setFolder(value); useSettingsStore.getState().update('photoFolder', value); }); }, []);
  return <SettingsRow label="Pasta das fotos" description="A galeria usa esta pasta neste computador."><div><div className="folder-display">{folder || 'Pasta Imagens do Windows'}</div><Button onClick={() => { void window.desktop?.selectPhotoFolder().then(value => { if (value) { setFolder(value); useSettingsStore.getState().update('photoFolder', value); } }); }}>Escolher pasta</Button></div></SettingsRow>;
}
