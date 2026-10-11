import { ChoiceSetting } from '../../components/SettingsFields';
import { clearUnavailable } from '../../services/youtube/availability';
import { useState } from 'react';
import { useYoutubeStore } from '../../stores/youtubeStore';
import { Button } from '../../components/ui';

export function YoutubeSettings() {
  const { apiKey, setApiKey, error: loadError } = useYoutubeStore(); const [draft, setDraft] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function save(value: string) {
    setBusy(true); setMessage('');
    try { if (window.desktop) await window.desktop.saveYoutubeKey(value); setApiKey(value); setDraft(''); setMessage(value ? window.desktop ? 'Chave salva com proteção do sistema. Será recuperada ao abrir o aplicativo.' : 'Chave disponível nesta sessão no navegador.' : 'Chave removida.'); }
    catch { setMessage('Não foi possível salvar a chave com proteção do sistema. Tente novamente no aplicativo desktop.'); }
    finally { setBusy(false); }
  }
  return <><h2>YouTube</h2><p>A busca geral pesquisa versões de karaokê no YouTube. Configure sua chave uma vez neste computador.</p><form className="form-stack" onSubmit={event => { event.preventDefault(); void save(draft.trim()); }}><label htmlFor="youtube-api-key">Chave da YouTube Data API v3</label><input id="youtube-api-key" type="password" autoComplete="off" spellCheck={false} value={draft} placeholder={apiKey ? 'Chave configurada' : 'Cole a chave aqui'} onChange={event => setDraft(event.target.value)}/><div className="inline-actions"><Button primary type="submit" disabled={busy || !draft.trim()}>{window.desktop ? 'Salvar chave neste computador' : 'Usar chave nesta sessão'}</Button><Button disabled={busy || !apiKey} onClick={() => void save('')}>Remover chave</Button></div></form><p role="status">{message || loadError || (apiKey ? 'Busca configurada.' : 'Nenhuma chave configurada.')}</p><p className="settings-note">No desktop, a chave é armazenada criptografada pelo sistema operacional. Ela não é enviada ao celular. No navegador, fica somente na sessão. Habilite a YouTube Data API v3 e restrinja a chave a essa API.</p><ChoiceSetting field="youtubeRegion" label="País da reprodução" options={[{ value: 'BR', label: 'Brasil' }, { value: 'PT', label: 'Portugal' }, { value: 'US', label: 'Estados Unidos' }]}/><p>Vídeos bloqueados na reprodução ficam fora das novas buscas por 15 minutos. Restrições podem mudar após a busca.</p><Button onClick={() => { clearUnavailable(); setMessage('Vídeos liberados para uma nova verificação.'); }}>Rever vídeos indisponíveis</Button><h3>Reprodução</h3><p>Os comandos do aplicativo controlam o player oficial. A barra de controles do YouTube fica oculta pelo parâmetro oficial; anúncios, marca e mensagens do YouTube permanecem. Ative Alterar Tom em Reprodução para usar os controles de tonalidade.</p></>;
}
