import { useState } from 'react';
import { Button } from '../../components/ui';
import { SettingsRow } from '../../components/SettingsFields';
import { useSettingsStore } from '../../stores/settingsStore';
import { defaultSettings } from '../../config/defaultSettings';

const actions = [{ id: 'playPause', label: 'Pausar ou continuar' }, { id: 'next', label: 'Próxima música' }, { id: 'pitchDown', label: 'Diminuir tom' }, { id: 'pitchUp', label: 'Aumentar tom' }, { id: 'queue', label: 'Abrir fila' }];
const names: Record<string, string> = { Space: 'Espaço', ArrowRight: 'Seta direita', ArrowLeft: 'Seta esquerda', Minus: '−', Equal: '+', KeyQ: 'Q', Escape: 'Esc' };
export function ShortcutSettings() {
  const shortcuts = useSettingsStore(state => state.settings.shortcuts); const update = useSettingsStore(state => state.update); const [message, setMessage] = useState('');
  function assign(action: string, code: string) { if (Object.entries(shortcuts).some(([id, value]) => id !== action && value === code)) { setMessage('Este atalho já está sendo usado por outra ação.'); return; } update('shortcuts', { ...shortcuts, [action]: code }); setMessage('Atalho atualizado.'); }
  return <><h2>Atalhos editáveis</h2>{actions.map(action => <SettingsRow key={action.id} label={action.label}><input className="shortcut-input" readOnly aria-label={`Atalho para ${action.label}`} value={names[shortcuts[action.id]] || shortcuts[action.id] || 'Nenhum'} onKeyDown={event => { event.preventDefault(); assign(action.id, event.code); }} onFocus={event => event.currentTarget.select()}/></SettingsRow>)}<Button onClick={() => update('shortcuts', { ...defaultSettings.shortcuts })}>Restaurar atalhos</Button><p className="settings-note" role="status">Clique em um campo e pressione a nova tecla. {message}</p></>;
}
