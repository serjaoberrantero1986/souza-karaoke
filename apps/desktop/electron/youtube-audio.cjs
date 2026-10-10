const { BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
const path = require('node:path');

// Source playback and processed output belong to different webContents.
// Never capture system loopback: it would include the processed output itself.
function registerYoutubeAudio(getBaseUrl) {
  let active;
  function close(id) {
    if (!active || (id && active.id !== id)) return;
    const pipeline = active; active = undefined;
    pipeline.owner.removeListener('closed', pipeline.onClosed);
    if (!pipeline.output?.isDestroyed()) pipeline.output.destroy();
    if (!pipeline.owner.isDestroyed()) pipeline.owner.contentView.removeChildView(pipeline.source);
    if (!pipeline.source.webContents.isDestroyed()) pipeline.source.webContents.close();
  }
  function allowed(event) {
    const url = new URL(event.sender.getURL());
    if (url.searchParams.has('youtube-source') || url.searchParams.has('audio-output')) throw new Error('Origem de comando inválida.');
    const owner = BrowserWindow.fromWebContents(event.sender);
    if (!owner) throw new Error('Janela principal indisponível.');
    return owner;
  }
  ipcMain.handle('audio:open', async (event, { id, videoId, bounds }) => {
    const owner = allowed(event);
    if (!/^[a-f0-9-]{32,40}$/.test(id) || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new Error('Vídeo inválido.');
    close();
    const preferences = { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false };
    const source = new WebContentsView({ webPreferences: preferences });
    source.setBackgroundColor('#000000'); owner.contentView.addChildView(source);
    source.setBounds(safeBounds(bounds));
    source.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    source.webContents.on('will-navigate', event => event.preventDefault());
    const captureSession = session.fromPartition(`karaoke-audio-${id}`);
    const output = new BrowserWindow({ width: 320, height: 240, show: false, webPreferences: { ...preferences, session: captureSession } });
    output.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    output.webContents.on('will-navigate', event => event.preventDefault());
    const onClosed = () => close(id);
    active = { id, owner, source, output, onClosed };
    owner.once('closed', onClosed);
    captureSession.setDisplayMediaRequestHandler((request, callback) => {
      if (active?.id !== id || source.webContents.isDestroyed() || request.frame?.top !== output.webContents.mainFrame) return callback({});
      callback({ video: source.webContents.mainFrame, audio: source.webContents.mainFrame, enableLocalEcho: false });
    });
    // Different partitions prevent BroadcastChannel, so commands use targeted IPC.
    const base = getBaseUrl();
    try {
      await source.webContents.loadURL(`${base}/?youtube-source=${videoId}&pipeline=${id}`);
      if (active?.id !== id) return;
      await output.loadURL(`${base}/?audio-output=1&pipeline=${id}`);
    } catch (error) { close(id); throw error; }
  });
  ipcMain.handle('audio:bounds', (event, { id, bounds }) => { const owner = allowed(event); if (active?.id === id && active.owner === owner) active.source.setBounds(safeBounds(bounds)); });
  ipcMain.handle('audio:close', (event, id) => { const owner = allowed(event); if (active?.owner === owner) close(id); });
  ipcMain.on('audio:message', (event, message) => {
    if (!active || !message || message.id !== active.id) return;
    const { source, output, owner } = active;
    if (event.sender === owner.webContents) {
      source.webContents.send('audio:message', message); output.webContents.send('audio:message', message);
    } else if (event.sender === source.webContents || event.sender === output.webContents) {
      owner.webContents.send('audio:message', message);
    }
  });
  return () => close();
}
function safeBounds(bounds) {
  const result = {};
  for (const key of ['x', 'y', 'width', 'height']) { if (!Number.isFinite(bounds?.[key])) throw new Error('Posição inválida.'); result[key] = Math.round(bounds[key]); }
  result.width = Math.max(1, result.width); result.height = Math.max(1, result.height);
  return result;
}
module.exports = { registerYoutubeAudio };
