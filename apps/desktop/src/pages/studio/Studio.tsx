import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Headphones, LockKeyhole, Pause, Play, RotateCcw, SlidersHorizontal, Volume2, VolumeX, WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Panel } from '../../components/ui';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLocalTracksStore } from '../../stores/localTracksStore';
import { lockStudio, studioAccessGranted, unlockStudio } from './studioAccess';
import { readStudioProject, type ProcessedStudioProject, type StudioManifest } from './studioProject';

type Track = { key: string; label: string; buffer: AudioBuffer; volume: number; muted: boolean; solo: boolean; gain: GainNode };
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function StudioUnlock({ onUnlock }: { onUnlock: () => void }) {
  const navigate = useNavigate(); const configuredPin = useSettingsStore(state => state.settings.operatorPin);
  const [pin, setPin] = useState(''); const [message, setMessage] = useState(configuredPin ? '' : 'Configure primeiro um PIN em Operador remoto.');
  function submit(event: FormEvent) { event.preventDefault(); const result = unlockStudio(configuredPin, pin); if (result === 'granted') onUnlock(); else setMessage(result === 'pin-not-configured' ? 'Configure primeiro um PIN em Operador remoto.' : 'PIN incorreto.'); }
  return <Panel title="AI Studio" onBack={() => navigate('/settings')} className="studio-panel"><div className="studio-unlock"><LockKeyhole size={42}/><h2>Área do administrador</h2><p>O Studio prepara e revisa as faixas usadas na produção do karaokê.</p>{configuredPin ? <form onSubmit={submit}><label htmlFor="studio-pin">PIN do administrador</label><input id="studio-pin" autoFocus type="password" inputMode="numeric" autoComplete="current-password" maxLength={8} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}/><Button primary disabled={pin.length < 4} type="submit">Acessar Studio</Button></form> : <Button onClick={() => navigate('/settings/operator')}>Configurar PIN</Button>}{message && <p role="alert" className="studio-message">{message}</p>}</div></Panel>;
}

function StudioWorkspace() {
  const navigate = useNavigate(); const folderInput = useRef<HTMLInputElement>(null); const audio = useRef<AudioContext | undefined>(undefined); const sources = useRef<AudioBufferSourceNode[]>([]); const startedAt = useRef(0); const offset = useRef(0); const tracksRef = useRef<Track[]>([]); const playingRef = useRef(false); const operation = useRef(0);
  const library = useLocalTracksStore(state => state.tracks).filter(track => track.filePath && /\.(mp3|wav|flac)$/i.test(track.filePath));
  const [source, setSource] = useState(''); const [mode, setMode] = useState<'karaoke' | 'instruments'>('karaoke'); const [processing, setProcessing] = useState(false);
  const [manifest, setManifest] = useState<StudioManifest>(); const [tracks, setTracks] = useState<Track[]>([]); const [playing, setPlaying] = useState(false); const [position, setPosition] = useState(0); const [duration, setDuration] = useState(0); const [master, setMaster] = useState(50); const [message, setMessage] = useState('Abra a pasta de um projeto que já tenha sido separado pelo Studio.'); const masterGain = useRef<GainNode | undefined>(undefined);
  tracksRef.current = tracks;
  function setPlayback(value: boolean) { playingRef.current = value; setPlaying(value); }
  function stopSources() { sources.current.forEach(source => { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); }); sources.current = []; }
  function currentPosition() { return Math.min(duration, offset.current + (playingRef.current && audio.current ? Math.max(0, audio.current.currentTime - startedAt.current) : 0)); }
  function pause() { operation.current += 1; const next = currentPosition(); stopSources(); offset.current = next; setPosition(next); setPlayback(false); }
  function updateGains(next = tracksRef.current) { const hasSolo = next.some(track => track.solo); next.forEach(track => track.gain.gain.setTargetAtTime(track.muted || (hasSolo && !track.solo) ? 0 : track.volume, audio.current?.currentTime ?? 0, .015)); }
  async function play() { const context = audio.current; if (!context || playingRef.current || !tracksRef.current.length) return; const token = ++operation.current; await context.resume(); if (token !== operation.current || context !== audio.current || playingRef.current) return; if (offset.current >= duration) { offset.current = 0; setPosition(0); } const when = context.currentTime + .05; sources.current = tracksRef.current.map(track => { const source = context.createBufferSource(); source.buffer = track.buffer; source.connect(track.gain); source.start(when, offset.current); return source; }); startedAt.current = when; setPlayback(true); }
  function seek(value: number) { const resume = playingRef.current; pause(); offset.current = Math.max(0, Math.min(duration, value)); setPosition(offset.current); if (resume && offset.current < duration) void play(); }
  function closeAudio() { operation.current += 1; stopSources(); const context = audio.current; audio.current = undefined; masterGain.current = undefined; tracksRef.current = []; setPlayback(false); if (context) void context.close(); }
  useEffect(() => { const timer = window.setInterval(() => { if (!playingRef.current) return; const next = currentPosition(); if (next >= duration) { pause(); offset.current = duration; setPosition(duration); } else setPosition(next); }, 100); return () => window.clearInterval(timer); });
  useEffect(() => () => {
    operation.current += 1;
    sources.current.forEach(source => { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); });
    sources.current = [];
    const context = audio.current;
    audio.current = undefined;
    masterGain.current = undefined;
    tracksRef.current = [];
    if (context) void context.close();
  }, []);
  useEffect(() => window.desktop?.studioListen(update => setMessage(update.message)), []);
  async function loadProcessedProject(project: ProcessedStudioProject) {
    pause(); closeAudio(); setTracks([]); setManifest(undefined); setMessage('Carregando e validando as faixas…');
    const token = ++operation.current; const context = new AudioContext({ latencyHint: 'interactive' }); audio.current = context; const output = context.createGain(); output.gain.value = master / 100; output.connect(context.destination); masterGain.current = output;
    const decoded = await Promise.all(project.tracks.map(async item => { const response = await fetch(item.url); if (!response.ok) throw new Error(`Não foi possível carregar a faixa “${item.label}”.`); return { ...item, buffer: await context.decodeAudioData(await response.arrayBuffer()) }; }));
    if (token !== operation.current || context !== audio.current) { void context.close(); return; }
    const lengths = decoded.map(item => item.buffer.duration); const shortest = Math.min(...lengths); const longest = Math.max(...lengths); if (!Number.isFinite(shortest) || shortest <= 0 || longest - shortest > .05) throw new Error('As faixas têm durações incompatíveis e não podem ser reproduzidas sincronizadas.');
    const loaded = decoded.map(item => { const gain = context.createGain(); gain.connect(output); return { ...item, volume: 1, muted: false, solo: false, gain }; });
    offset.current = 0; setPosition(0); setDuration(shortest); setManifest(project.manifest); setTracks(loaded); setMessage('Projeto carregado. Os arquivos originais não foram modificados.');
  }
  async function processSource() {
    if (!window.desktop) { setMessage('O processamento está disponível no aplicativo instalado para computador.'); return; }
    if (!source) { setMessage('Escolha uma música antes de iniciar.'); return; }
    setProcessing(true); setMessage('Preparando o processamento…');
    try { const result = await window.desktop.studioStart({ source, mode }); if (result.status === 'completed') await loadProcessedProject(result); else setMessage('Processamento cancelado.'); }
    catch (error) { setMessage((error as Error).message); } finally { setProcessing(false); }
  }
  async function openProject(files: File[]) {
    pause(); closeAudio(); setTracks([]); setManifest(undefined); setMessage('Carregando e validando as faixas…');
    try {
      const token = ++operation.current; const project = await readStudioProject(files); if (token !== operation.current) return; const context = new AudioContext({ latencyHint: 'interactive' }); audio.current = context; const output = context.createGain(); output.gain.value = master / 100; output.connect(context.destination); masterGain.current = output;
      const decoded = await Promise.all(project.tracks.map(async item => ({ ...item, buffer: await context.decodeAudioData(await item.file.arrayBuffer()) })));
      if (token !== operation.current || context !== audio.current) { void context.close(); return; }
      const lengths = decoded.map(item => item.buffer.duration); const shortest = Math.min(...lengths); const longest = Math.max(...lengths); if (!Number.isFinite(shortest) || shortest <= 0 || longest - shortest > .05) throw new Error('As faixas têm durações incompatíveis e não podem ser reproduzidas sincronizadas.');
      const loaded = decoded.map(item => { const gain = context.createGain(); gain.connect(output); return { ...item, volume: 1, muted: false, solo: false, gain }; });
      offset.current = 0; setPosition(0); setDuration(shortest); setManifest(project.manifest); setTracks(loaded); setMessage('Projeto carregado. As alterações de volume não modificam os arquivos originais.');
    } catch (error) { closeAudio(); setDuration(0); setMessage((error as Error).message); }
  }
  function changeTrack(key: string, patch: Partial<Pick<Track, 'volume' | 'muted' | 'solo'>>) { setTracks(current => { const next = current.map(track => track.key === key ? { ...track, ...patch } : track); updateGains(next); return next; }); }
  function resetMix() { setTracks(current => { const next = current.map(track => ({ ...track, volume: 1, muted: false, solo: false })); updateGains(next); return next; }); }
  const newProject = <section className="studio-new-project"><h2>Nova música</h2><p>Escolha a música bruta. O original será preservado e o projeto será aberto automaticamente ao concluir.</p><label>Música da biblioteca<select value={source} disabled={processing} onChange={event => setSource(event.target.value)}><option value="">Selecione uma música</option>{library.map(track => <option key={track.id} value={track.filePath}>{track.title} — {track.artist}</option>)}</select></label><div className="inline-actions"><Button disabled={processing} onClick={() => void window.desktop?.studioSelectAudio().then(file => { if (file) setSource(file); })}>Escolher arquivo do computador</Button>{source && <span className="studio-source">{source.split(/[\\/]/).at(-1)}</span>}</div><fieldset disabled={processing}><legend>Tipo de separação</legend><label><input type="radio" name="studio-mode" checked={mode === 'karaoke'} onChange={() => setMode('karaoke')}/> Karaokê: instrumental, voz principal e coral</label><label><input type="radio" name="studio-mode" checked={mode === 'instruments'} onChange={() => setMode('instruments')}/> Instrumentos: voz, bateria, baixo e outros</label></fieldset><div className="inline-actions"><Button primary disabled={!source || processing} onClick={() => void processSource()}>{processing ? 'Processando…' : 'Processar música'}</Button>{processing && <Button onClick={() => void window.desktop?.studioCancel()}>Cancelar</Button>}<Button disabled={processing} onClick={() => folderInput.current?.click()}>Abrir projeto processado</Button></div></section>;
  function EmptyState(props: Record<string, unknown>) { void props; return newProject; }
  return <Panel title="DoRéMiFode AI Studio" onBack={() => navigate('/settings')} className="studio-panel" actions={<><Button onClick={() => folderInput.current?.click()}><WandSparkles size={16}/> Abrir projeto</Button><Button onClick={() => { pause(); lockStudio(); navigate('/settings'); }}><LockKeyhole size={16}/> Bloquear</Button></>}><input ref={node => { folderInput.current = node; node?.setAttribute('webkitdirectory', ''); }} hidden type="file" multiple onChange={event => { const files = Array.from(event.target.files || []); event.currentTarget.value = ''; if (files.length) void openProject(files); }}/><div className="studio-workspace">{!tracks.length ? <EmptyState title="Abra um projeto processado" description="Selecione a pasta .studio-data/jobs/IDENTIFICADOR criada pelo processamento externo."><Button primary onClick={() => folderInput.current?.click()}>Escolher pasta do projeto</Button></EmptyState> : <><header className="studio-project-header"><div><small>PROJETO ATUAL</small><h2>{manifest?.source.split(/[\\/]/).at(-1) || 'Projeto do Studio'}</h2></div><span className="source-badge">4 faixas</span></header><section className="studio-transport" aria-label="Reprodução do Studio"><div className="inline-actions"><Button primary onClick={() => playing ? pause() : void play()}>{playing ? <Pause size={18}/> : <Play size={18}/>} {playing ? 'Pausar' : 'Reproduzir'}</Button><Button onClick={() => seek(0)}><RotateCcw size={18}/> Reiniciar</Button><Button onClick={resetMix}><SlidersHorizontal size={18}/> Restaurar mixagem</Button></div><div className="studio-timeline-label"><span>Posição</span><output>{time(position)} / {time(duration)}</output></div><input aria-label="Posição no projeto" className="studio-timeline" type="range" min={0} max={duration || 1} step="0.01" value={position} onChange={event => seek(Number(event.target.value))}/><label className="studio-master"><Volume2 size={18}/> Volume geral<input aria-label="Volume geral do Studio" type="range" min={0} max={100} value={master} onChange={event => { const value = Number(event.target.value); setMaster(value); masterGain.current?.gain.setTargetAtTime(value / 100, audio.current?.currentTime ?? 0, .015); }}/><output>{master}%</output></label></section><div className="studio-tracks">{tracks.map(track => <article key={track.key} className={track.muted ? 'muted-track' : ''}><h3>{track.label}</h3><div className="inline-actions"><Button aria-pressed={track.muted} onClick={() => changeTrack(track.key, { muted: !track.muted })}>{track.muted ? <Volume2 size={16}/> : <VolumeX size={16}/>} {track.muted ? 'Ativar' : 'Silenciar'}</Button><Button aria-pressed={track.solo} onClick={() => changeTrack(track.key, { solo: !track.solo })}><Headphones size={16}/> Ouvir só</Button></div><label>Volume<input aria-label={`Volume: ${track.label}`} type="range" min={0} max={100} value={Math.round(track.volume * 100)} onChange={event => changeTrack(track.key, { volume: Number(event.target.value) / 100 })}/><output>{Math.round(track.volume * 100)}%</output></label></article>)}</div></>}<p role="status" className="studio-message">{message}</p><p className="settings-note">A separação de áudio continua sendo executada pelo fluxo Python externo nesta etapa. Esta área abre e revisa os projetos concluídos sem alterar o player principal.</p></div></Panel>;
}

export function Studio() { const [unlocked, setUnlocked] = useState(studioAccessGranted()); return unlocked ? <StudioWorkspace/> : <StudioUnlock onUnlock={() => setUnlocked(true)}/>; }
