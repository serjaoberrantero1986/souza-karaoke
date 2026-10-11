const { app, BrowserWindow, ipcMain, dialog, safeStorage, screen } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes, createHash, timingSafeEqual } = require('node:crypto');
const { startRendererServer } = require('./renderer-server.cjs');
const { startRemoteServer } = require('./remote-server.cjs');
const { registerYoutubeAudio } = require('./youtube-audio.cjs');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
let remoteSession;
const pending = new Map();
let requestId = 0;
let rendererServer;
let rendererUrl;
let audienceWindow;
let remoteOpening;

async function setAudienceDisplay(enabled) {
  if (!enabled) { audienceWindow?.close(); audienceWindow = undefined; return { active: false, external: false }; }
  if (audienceWindow && !audienceWindow.isDestroyed()) { audienceWindow.focus(); return { active: true, external: screen.getAllDisplays().length > 1 }; }
  const primary = screen.getPrimaryDisplay(); const external = screen.getAllDisplays().find(item => item.id !== primary.id); const bounds = external?.bounds || { x: primary.bounds.x + 80, y: primary.bounds.y + 80, width: 1100, height: 700 };
  audienceWindow = new BrowserWindow({ ...bounds, fullscreen: !!external, autoHideMenuBar: true, backgroundColor: '#000', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  audienceWindow.on('closed', () => { audienceWindow = undefined; }); audienceWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const base = process.env.KARAOKE_DEV_URL === 'http://127.0.0.1:5173' ? process.env.KARAOKE_DEV_URL : rendererUrl; await audienceWindow.loadURL(`${base}/?audience=1#/player`); return { active: true, external: !!external };
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1100, minHeight: 680,
    backgroundColor: '#080808', autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_contents, permission, callback, details) => { const allowedOrigin = details.requestingUrl.startsWith('http://127.0.0.1:') || details.requestingUrl.startsWith('http://localhost:'); callback(permission === 'media' && allowedOrigin); });
  if (process.env.KARAOKE_DEV_URL === 'http://127.0.0.1:5173') await window.loadURL(process.env.KARAOKE_DEV_URL);
  else {
    // Preserve Phase 1 preferences/playlists before moving away from file://.
    await window.loadFile(path.join(__dirname, '../dist/index.html'));
    const oldStorage = await window.webContents.executeJavaScript(`Object.fromEntries(['karaoke-library-v1','karaoke-settings-v1','karaoke-theme-v1'].map(key => [key, localStorage.getItem(key)]))`);
    await window.loadURL(rendererUrl);
    const changed = await window.webContents.executeJavaScript(`(() => { let changed = false; for (const [key, value] of Object.entries(${JSON.stringify(oldStorage)})) { if (value && !localStorage.getItem(key)) { localStorage.setItem(key, value); changed = true; } } return changed; })()`);
    if (changed) await window.loadURL(rendererUrl);
  }
  window.show();
}
app.whenReady().then(async () => {
  rendererServer = await startRendererServer(path.join(__dirname, '../dist'));
  const closeYoutubeAudio = registerYoutubeAudio(() => process.env.KARAOKE_DEV_URL === 'http://127.0.0.1:5173' ? process.env.KARAOKE_DEV_URL : 'http://127.0.0.1:17843');
  app.on('before-quit', closeYoutubeAudio);
  if (process.env.KARAOKE_DEV_URL !== 'http://127.0.0.1:5173') {
    rendererUrl = 'http://127.0.0.1:17843';
  }
  ipcMain.handle('app:quit', () => app.quit());
  ipcMain.handle('app:auto-start', (_event, enabled) => { if (typeof enabled !== 'boolean') throw new Error('Opção inválida.'); app.setLoginItemSettings({ openAtLogin: enabled, path: process.execPath }); });
  ipcMain.handle('display:set-enabled', (_event, enabled) => setAudienceDisplay(!!enabled));
  const backgroundMusicFile = path.join(app.getPath('userData'), 'background-music.json');
  async function loadBackgroundMusic() { try { const saved = JSON.parse(await fs.readFile(backgroundMusicFile, 'utf8')); const data = await fs.readFile(saved.path); if (data.length > 40_000_000) throw new Error('O arquivo de música ambiente excede 40 MB.'); const extension = path.extname(saved.path).slice(1).toLowerCase(); const mime = extension === 'mp3' ? 'audio/mpeg' : extension === 'wav' ? 'audio/wav' : extension === 'ogg' ? 'audio/ogg' : 'audio/mp4'; return `data:${mime};base64,${data.toString('base64')}`; } catch (error) { if (error.code === 'ENOENT') return ''; throw error; } }
  ipcMain.handle('music:select', async () => { const result = await dialog.showOpenDialog({ title: 'Escolher música ambiente', properties: ['openFile'], filters: [{ name: 'Áudio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'] }] }); if (result.canceled || !result.filePaths[0]) return ''; await fs.writeFile(backgroundMusicFile, JSON.stringify({ path: result.filePaths[0] }), 'utf8'); return loadBackgroundMusic(); });
  ipcMain.handle('music:load', () => loadBackgroundMusic());
  const localLibraryFile = path.join(app.getPath('userData'), 'local-library.json');
  async function scanLocalLibrary(directory) { if (!directory) return { folder: '', tracks: [] }; const root = path.resolve(directory); const tracks = []; const relativeFiles = []; async function walk(current) { if (tracks.length >= 5000) return; for (const entry of await fs.readdir(current, { withFileTypes: true })) { const full = path.join(current, entry.name); if (entry.isDirectory()) await walk(full); else if (entry.isFile() && /\.(mp4|webm|ogv|ogg|mp3|wav|m4a)$/i.test(entry.name)) { const relative = path.relative(root, full); relativeFiles.push(relative); tracks.push({ id: `local-${createHash('sha1').update(full).digest('hex')}`, title: path.basename(entry.name, path.extname(entry.name)), artist: path.basename(path.dirname(full)) === path.basename(root) ? 'Arquivo local' : path.basename(path.dirname(full)), source: 'local', category: 'Local', duration: 0, filePath: full, mediaUrl: `http://127.0.0.1:17843/__media/${Buffer.from(relative).toString('base64url')}` }); } } } await walk(root); rendererServer?.setMediaDirectory(root, relativeFiles); return { folder: root, tracks }; }
  ipcMain.handle('library:select', async () => { const result = await dialog.showOpenDialog({ title: 'Selecionar pasta de karaokês', properties: ['openDirectory'] }); if (result.canceled || !result.filePaths[0]) return null; await fs.writeFile(localLibraryFile, JSON.stringify({ folder: result.filePaths[0] }), 'utf8'); return scanLocalLibrary(result.filePaths[0]); });
  ipcMain.handle('library:load', async () => { try { const saved = JSON.parse(await fs.readFile(localLibraryFile, 'utf8')); return await scanLocalLibrary(saved.folder); } catch (error) { if (error.code === 'ENOENT') return { folder: '', tracks: [] }; throw error; } });
  const credentialFile = path.join(app.getPath('userData'), 'youtube-key.enc');
  const canEncrypt = () => safeStorage.isEncryptionAvailable() && !(process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text');
  const recoveryFile = path.join(app.getPath('userData'), 'pin-recovery.enc');
  async function loadRecovery() {
    try {
      if (!canEncrypt()) throw new Error('Proteção do sistema indisponível.');
      return JSON.parse(safeStorage.decryptString(await fs.readFile(recoveryFile)));
    } catch (error) { if (error.code === 'ENOENT') return { email: '', challenge: null, sentAt: [] }; throw error; }
  }
  async function saveRecovery(state) {
    if (!canEncrypt()) throw new Error('Proteção do Windows indisponível. Os dados de recuperação não foram salvos.');
    await fs.writeFile(recoveryFile, safeStorage.encryptString(JSON.stringify(state)), { mode: 0o600 });
  }
  async function sendRecoveryCode(email, purpose) {
    const apiKey = process.env.KARAOKE_RESEND_API_KEY;
    const from = process.env.KARAOKE_RESEND_FROM || 'Meu Karaokê <onboarding@resend.dev>';
    if (!apiKey) throw new Error('O envio de recuperação ainda não foi configurado neste computador.');
    if (!/^.{1,80}\s*<[^<>\s]+@[^<>\s]+>$/.test(from) || from.length > 150) throw new Error('O remetente do e-mail está inválido.');
    const state = await loadRecovery(); const now = Date.now();
    state.sentAt = (state.sentAt || []).map(item => typeof item === 'number' ? { time: item, purpose: 'reset' } : item).filter(item => now - item.time < 86_400_000);
    if (state.sentAt.some(item => item.purpose === purpose && now - item.time < 60_000)) throw new Error('Aguarde um minuto antes de solicitar outro código.');
    if (state.sentAt.length >= 5) throw new Error('O limite diário de códigos foi atingido. Tente novamente amanhã.');
    if (purpose === 'reset' && (!state.email || email !== state.email)) throw new Error('Configure e confirme um e-mail de recuperação primeiro.');
    if (purpose === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) throw new Error('Informe um endereço de e-mail válido.');
    const destination = purpose === 'reset' ? state.email : email.toLowerCase();
    const code = String(randomBytes(4).readUInt32BE() % 1_000_000).padStart(6, '0');
    state.sentAt.push({ time: now, purpose });
    state.challenge = { purpose, email: destination, hash: createHash('sha256').update(`${destination}:${purpose}:${code}`).digest('hex'), expiresAt: now + 10 * 60_000, attempts: 0 };
    await saveRecovery(state);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [destination], subject: purpose === 'reset' ? 'Código para redefinir o PIN do karaokê' : 'Confirme o e-mail de recuperação do karaokê', text: `Seu código é ${code}. Ele expira em 10 minutos. Se você não solicitou este código, ignore esta mensagem.` }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) { state.challenge = null; await saveRecovery(state); throw new Error('O Resend não conseguiu enviar o e-mail. Confira o remetente autorizado e tente novamente.'); }
  }
  ipcMain.handle('recovery:status', async () => ({ email: (await loadRecovery()).email || '' }));
  ipcMain.handle('recovery:send-email-code', async (_event, email) => {
    await sendRecoveryCode(String(email || '').trim().toLowerCase(), 'email');
  });
  ipcMain.handle('recovery:confirm-email', async (_event, code) => {
    const state = await loadRecovery(); const challenge = state.challenge;
    const expected = createHash('sha256').update(`${challenge?.email}:email:${String(code || '')}`).digest();
    const actual = Buffer.from(challenge?.hash || '', 'hex');
    if (!challenge || challenge.purpose !== 'email' || Date.now() > challenge.expiresAt || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      if (challenge) { challenge.attempts++; if (challenge.attempts >= 5 || Date.now() > challenge.expiresAt) state.challenge = null; await saveRecovery(state); }
      throw new Error('Código incorreto ou expirado. Solicite outro e-mail.');
    }
    state.email = challenge.email; state.challenge = null; await saveRecovery(state); return { email: state.email };
  });
  ipcMain.handle('recovery:send-reset-code', async () => { const state = await loadRecovery(); await sendRecoveryCode(state.email, 'reset'); });
  ipcMain.handle('recovery:reset-pin', async (_event, { code, pin }) => {
    if (!/^\d{4,8}$/.test(String(pin || ''))) throw new Error('O novo PIN deve ter de 4 a 8 números.');
    const state = await loadRecovery(); const challenge = state.challenge;
    const expected = createHash('sha256').update(`${challenge?.email}:reset:${String(code || '')}`).digest();
    const actual = Buffer.from(challenge?.hash || '', 'hex');
    if (!challenge || challenge.purpose !== 'reset' || Date.now() > challenge.expiresAt || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      if (challenge) { challenge.attempts++; if (challenge.attempts >= 5 || Date.now() > challenge.expiresAt) state.challenge = null; await saveRecovery(state); }
      throw new Error('Código incorreto ou expirado. Solicite outro e-mail.');
    }
    state.challenge = null; await saveRecovery(state);
    return { pin: String(pin) };
  });
  ipcMain.handle('youtube:load-key', async () => {
    try { if (!canEncrypt()) throw new Error('Proteção do sistema indisponível.'); return safeStorage.decryptString(await fs.readFile(credentialFile)); }
    catch (error) { if (error.code === 'ENOENT') return ''; throw new Error('Não foi possível recuperar a chave protegida. Configure-a novamente.'); }
  });
  ipcMain.handle('youtube:save-key', async (_event, key) => {
    if (typeof key !== 'string' || key.length > 512) throw new Error('Chave inválida.');
    if (!key.trim()) { await fs.rm(credentialFile, { force: true }); return; }
    if (!canEncrypt()) throw new Error('Proteção do sistema indisponível. A chave não foi salva.');
    await fs.writeFile(credentialFile, safeStorage.encryptString(key.trim()), { mode: 0o600 });
  });
  const defaultPhotoDirectory = path.join(app.getPath('pictures'), 'Meu Karaoke'); const photoConfigFile = path.join(app.getPath('userData'), 'photo-folder.json');
  async function getPhotoDirectory() { try { const saved = JSON.parse(await fs.readFile(photoConfigFile, 'utf8')); return typeof saved.folder === 'string' && saved.folder ? saved.folder : defaultPhotoDirectory; } catch (error) { if (error.code === 'ENOENT') return defaultPhotoDirectory; throw error; } }
  async function readPhotoIndex(directory) { try { const target = directory || await getPhotoDirectory(); const items = JSON.parse(await fs.readFile(path.join(target, 'galeria.json'), 'utf8')); return Array.isArray(items) ? items : []; } catch (error) { if (error.code === 'ENOENT') return []; throw error; } }
  ipcMain.handle('photos:get-folder', () => getPhotoDirectory());
  ipcMain.handle('photos:select-folder', async () => { const result = await dialog.showOpenDialog({ title: 'Escolher pasta para as fotos', properties: ['openDirectory', 'createDirectory'] }); if (result.canceled || !result.filePaths[0]) return ''; await fs.writeFile(photoConfigFile, JSON.stringify({ folder: result.filePaths[0] }), 'utf8'); return result.filePaths[0]; });
  ipcMain.handle('photos:save', async (_event, photo) => {
    if (!photo || typeof photo.dataUrl !== 'string' || photo.dataUrl.length > 5_500_000) throw new Error('Foto inválida ou muito grande.');
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(photo.dataUrl); if (!match) throw new Error('Formato de foto inválido.');
    const extensions = { jpeg: 'jpg', png: 'png', webp: 'webp' }; const id = `${Date.now()}-${randomBytes(5).toString('hex')}`; const fileName = `${id}.${extensions[match[1]]}`;
    const photoDirectory = await getPhotoDirectory(); await fs.mkdir(photoDirectory, { recursive: true }); await fs.writeFile(path.join(photoDirectory, fileName), Buffer.from(match[2], 'base64'), { flag: 'wx' });
    const item = { id, fileName, singer: String(photo.singer || '').slice(0, 80), song: String(photo.song || '').slice(0, 180), score: Math.max(0, Math.min(100, Number(photo.score) || 0)), createdAt: new Date().toISOString() }; const items = [item, ...(await readPhotoIndex(photoDirectory))].slice(0, 1000); await fs.writeFile(path.join(photoDirectory, 'galeria.json'), JSON.stringify(items, null, 2), 'utf8'); return item;
  });
  ipcMain.handle('photos:list', () => readPhotoIndex());
  ipcMain.handle('photos:read', async (_event, id) => { const photoDirectory = await getPhotoDirectory(); const item = (await readPhotoIndex(photoDirectory)).find(photo => photo.id === id); if (!item) throw new Error('Foto não encontrada.'); const extension = path.extname(item.fileName).slice(1); const mime = extension === 'jpg' ? 'jpeg' : extension; return `data:image/${mime};base64,${(await fs.readFile(path.join(photoDirectory, item.fileName))).toString('base64')}`; });
  ipcMain.handle('photos:delete', async (_event, id) => { const photoDirectory = await getPhotoDirectory(); const items = await readPhotoIndex(photoDirectory); const item = items.find(photo => photo.id === id); if (!item) return; await fs.rm(path.join(photoDirectory, item.fileName), { force: true }); await fs.writeFile(path.join(photoDirectory, 'galeria.json'), JSON.stringify(items.filter(photo => photo.id !== id), null, 2), 'utf8'); });
  const remoteTokenFile = path.join(app.getPath('userData'), 'remote-tokens.json'); let remoteTokens;
  const dispatchRemote = event => payload => new Promise((resolve, reject) => { const id = ++requestId; const timer = setTimeout(() => { pending.delete(id); reject(new Error('O computador não respondeu. Tente novamente.')); }, 18000); pending.set(id, { resolve, reject, timer, sender: event.sender.id }); event.sender.send('remote:request', { id, ...payload }); });
  async function closeRemote() { if (remoteOpening) { try { await remoteOpening; } catch { /* A failed open has no server to close. */ } } if (!remoteSession) return; remoteSession.server.closeAllConnections?.(); await new Promise(resolve => remoteSession.server.close(resolve)); remoteSession = undefined; }
  async function openRemote(event) {
    if (remoteSession) return remoteSession.info;
    if (!remoteOpening) remoteOpening = startRemoteServer(dispatchRemote(event), 17844, remoteTokens).then(session => { remoteSession = session; return session; }).finally(() => { remoteOpening = undefined; });
    return (await remoteOpening).info;
  }
  ipcMain.handle('remote:start', async event => {
    return openRemote(event);
  });
  ipcMain.handle('remote:configure', async (event, permanent) => {
    if (!permanent && !remoteTokens && (remoteSession || remoteOpening)) return openRemote(event);
    await closeRemote();
    if (permanent) { try { remoteTokens = JSON.parse(await fs.readFile(remoteTokenFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; remoteTokens = { participant: randomBytes(24).toString('hex'), operator: randomBytes(24).toString('hex') }; await fs.writeFile(remoteTokenFile, JSON.stringify(remoteTokens), { mode: 0o600 }); } }
    else { remoteTokens = undefined; await fs.rm(remoteTokenFile, { force: true }); }
    return openRemote(event);
  });
  ipcMain.handle('remote:stop', () => closeRemote());
  ipcMain.on('remote:reply', (event, { id, result, error }) => {
    const job = pending.get(id); if (!job || job.sender !== event.sender.id) return;
    clearTimeout(job.timer); pending.delete(id);
    if (error) job.reject(new Error(error)); else job.resolve(result);
  });
  await createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) void createWindow(); });
}).catch(error => { dialog.showErrorBox('Não foi possível iniciar', error.code === 'EADDRINUSE' ? 'A porta local 17843 está ocupada. Feche outra instância do karaokê e tente novamente.' : 'Falha ao carregar o aplicativo. Confira se pnpm build foi executado.'); app.quit(); });
app.on('before-quit', () => { audienceWindow?.destroy(); rendererServer?.close(); remoteSession?.server.close(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
