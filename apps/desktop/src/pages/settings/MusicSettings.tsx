import { useState } from 'react';
import { BooleanSetting, NumericSetting } from '../../components/SettingsFields';
import { Button } from '../../components/ui';

export function MusicSettings() {
  const [message, setMessage] = useState('');
  return <><h2>Música ambiente</h2><BooleanSetting field="backgroundMusic" label="Tocar música ambiente quando o karaokê estiver parado"/><NumericSetting field="backgroundVolume" label="Volume da música ambiente" min={0} max={100}/><Button onClick={() => { void window.desktop?.selectBackgroundMusic().then(source => setMessage(source ? 'Música ambiente salva.' : 'Seleção cancelada.')).catch(error => setMessage(error.message)); }}>Escolher arquivo de áudio</Button><p className="settings-note" role="status">{message || 'A música pausa automaticamente durante uma apresentação.'}</p></>;
}
