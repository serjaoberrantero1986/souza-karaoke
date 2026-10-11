import { useState } from 'react';
import { SettingsRow } from '../../components/SettingsFields';
import { Button } from '../../components/ui';
import { useThemeStore } from '../../stores/themeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { programName } from '../../lib/identity';
export function AboutSettings() {
  const { theme, update } = useThemeStore();
  const [name, setName] = useState(programName(theme));
  const [pin, setPin] = useState(''); const [message, setMessage] = useState('');
  function save() {
    const saved = useSettingsStore.getState().settings.operatorPin;
    if (!saved) { setMessage('Configure primeiro um PIN em Operador remoto.'); return; }
    if (pin !== saved) { setMessage('PIN incorreto.'); return; }
    update({ programName: name.trim().slice(0, 60) }); setPin(''); setMessage('Nome atualizado no computador e no controle remoto.');
  }
  return <><h2>Sobre</h2><small>Versão 0.4.1</small>
    <SettingsRow label="Nome do programa" description="Exibido abaixo do logotipo e no controle pelo celular."><input aria-label="Nome do programa" maxLength={60} value={name} onChange={event => setName(event.target.value)}/></SettingsRow>
    <SettingsRow label="PIN do administrador"><input aria-label="PIN para alterar nome" type="password" inputMode="numeric" maxLength={8} value={pin} onChange={event => setPin(event.target.value)}/><Button onClick={save}>Salvar nome</Button></SettingsRow>
    <p role="status">{message}</p><SettingsRow label="Plataforma"><span>Aplicativo desktop local</span></SettingsRow><SettingsRow label="Fontes de música"><span>YouTube e arquivos do computador</span></SettingsRow><SettingsRow label="Controle"><span>Navegador do celular na mesma rede Wi-Fi</span></SettingsRow><p className="settings-note">Histórico, playlists, identidade visual e chave protegida do YouTube permanecem neste computador.</p></>;
}
