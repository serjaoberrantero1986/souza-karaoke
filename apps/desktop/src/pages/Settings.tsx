import { useNavigate, useParams } from 'react-router-dom';
import { Panel } from '../components/ui';
import { GeneralSettings, PhotoSettings, PlayerSettings, ScoreSettings } from './settings/GeneralSettings';
import { OperatorSettings, RemoteSettings } from './settings/RemoteSettings';
import { ThemeSettings } from './settings/AppearanceSettings';
import { AboutSettings } from './settings/AboutSettings';
import { YoutubeSettings } from './settings/YoutubeSettings';
import { Statistics } from './settings/Statistics';
import { MusicSettings } from './settings/MusicSettings';
import { ShortcutSettings } from './settings/ShortcutSettings';
import { FilesSettings } from './settings/FilesSettings';
import { PhotoFolderPicker } from '../components/PhotoFolderPicker';
export const settingsSections = [['general', 'Geral'], ['files', 'Arquivos locais'], ['youtube', 'YouTube'], ['player', 'Reprodução'], ['music', 'Música ambiente'], ['score', 'Pontuação'], ['photo', 'Fotos'], ['remote', 'Controle pelo celular'], ['operator', 'Operador remoto'], ['shortcuts', 'Atalhos'], ['theme', 'Personalização'], ['statistics', 'Estatísticas'], ['about', 'Sobre']] as const;
export function Settings() {
  const { section = 'general' } = useParams(); const navigate = useNavigate();
  const content = section === 'files' ? <FilesSettings/> : section === 'youtube' ? <YoutubeSettings/> : section === 'player' ? <PlayerSettings/> : section === 'music' ? <MusicSettings/> : section === 'score' ? <ScoreSettings/> : section === 'photo' ? <><PhotoFolderPicker/><PhotoSettings/></> : section === 'remote' ? <RemoteSettings/> : section === 'operator' ? <OperatorSettings/> : section === 'shortcuts' ? <ShortcutSettings/> : section === 'theme' ? <ThemeSettings/> : section === 'statistics' ? <Statistics/> : section === 'about' ? <AboutSettings/> : <GeneralSettings/>;
  return <Panel title="Configurações" onBack={() => navigate('/')}><div className="split-layout"><nav className="inner-sidebar" aria-label="Seções das configurações">{settingsSections.map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => navigate(`/settings/${id}`)}>{label}</button>)}</nav><div className="content-scroll" key={section}><div className="settings-content">{content}</div></div></div></Panel>;
}
