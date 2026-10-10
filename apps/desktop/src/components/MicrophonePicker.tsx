import { useEffect, useState } from 'react';
import { SettingsRow } from './SettingsFields';
import { Button } from './ui';
import { useSettingsStore } from '../stores/settingsStore';

export function MicrophonePicker() {
  const selected = useSettingsStore(state => state.settings.microphone); const update = useSettingsStore(state => state.update); const [devices, setDevices] = useState<MediaDeviceInfo[]>([]); const [message, setMessage] = useState('');
  async function refresh(requestPermission = false) { try { let stream: MediaStream | undefined; if (requestPermission) stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const list = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === 'audioinput'); stream?.getTracks().forEach(track => track.stop()); setDevices(list); setMessage(list.length ? `${list.length} microfone(s) detectado(s).` : 'Nenhum microfone detectado.'); } catch { setMessage('Não foi possível acessar o microfone. Confira a permissão do Windows.'); } }
  useEffect(() => { void refresh(); }, []);
  return <><SettingsRow label="Microfone da análise vocal"><div className="inline-actions"><select aria-label="Microfone" value={selected} onChange={event => update('microphone', event.target.value)}><option value="default">Padrão do sistema</option>{devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microfone ${index + 1}`}</option>)}</select><Button onClick={() => void refresh(true)}>Detectar e testar</Button></div></SettingsRow>{message && <p className="settings-note" role="status">{message}</p>}</>;
}
