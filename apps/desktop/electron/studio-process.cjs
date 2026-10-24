const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

function registerStudioProcess({ ipcMain, dialog, rendererServer, root }) {
  let active;
  const send = (sender, update) => { if (!sender.isDestroyed()) sender.send('studio:progress', update); };

  ipcMain.handle('studio:select-audio', async () => {
    const result = await dialog.showOpenDialog({ title: 'Escolher música para o Studio', properties: ['openFile'], filters: [{ name: 'Áudio', extensions: ['mp3', 'wav', 'flac'] }] });
    return result.canceled ? '' : result.filePaths[0] || '';
  });
  ipcMain.handle('studio:start', async (event, options) => {
    if (active) throw new Error('Já existe uma música sendo processada.');
    const source = path.resolve(String(options?.source || '')); const mode = options?.mode === 'instruments' ? 'instruments' : 'karaoke';
    if (!/\.(mp3|wav|flac)$/i.test(source) || !fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error('Escolha um arquivo MP3, WAV ou FLAC válido.');
    const python = process.env.KARAOKE_STUDIO_PYTHON || path.join(root, '.studio-venv312', 'Scripts', 'python.exe');
    const script = path.join(root, 'tools', 'studio', 'separate.py');
    if (!fs.existsSync(python) || !fs.existsSync(script)) throw new Error('O mecanismo do Studio ainda não foi preparado neste computador. Consulte tools/studio/README.md.');
    const args = ['-u', script, source, ...(mode === 'instruments' ? ['--instruments'] : [])];
    const child = spawn(python, args, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const running = { child, sender: event.sender, project: '', cancelled: false }; active = running;
    const consume = data => { const text = data.toString('utf8').trim(); if (!text) return; const match = /Projeto:\s*(.+)/.exec(text); if (match) running.project = match[1].trim(); send(event.sender, { status: 'processing', message: text.split(/\r?\n/).at(-1) }); };
    child.stdout.on('data', consume); child.stderr.on('data', consume);
    return await new Promise((resolve, reject) => {
      child.once('error', error => { active = undefined; reject(new Error(`Não foi possível iniciar o processamento: ${error.message}`)); });
      child.once('close', async code => {
        const job = active; active = undefined;
        if (job?.cancelled) { resolve({ status: 'cancelled' }); return; }
        if (code !== 0 || !job?.project) { reject(new Error('A separação não foi concluída. Consulte a mensagem exibida pelo Studio.')); return; }
        try {
          const manifest = JSON.parse(await fsp.readFile(path.join(job.project, 'manifest.json'), 'utf8'));
          if (manifest.status !== 'completed') throw new Error('O processamento terminou sem gerar um projeto válido.');
          let entries;
          if (mode === 'instruments') entries = Object.entries(manifest.instrumentStems || {}).map(([key, file]) => ({ key, label: ({ vocals: 'Voz', drums: 'Bateria', bass: 'Baixo', other: 'Outros instrumentos' })[key] || key, file }));
          else { const wanted = ['Instrumental', 'Voz principal (candidata)', 'Coral (candidato)']; entries = wanted.filter(label => manifest.stems?.[label]).map(label => ({ key: label, label, file: manifest.stems[label] })); }
          if (!entries.length) throw new Error('O projeto não contém as faixas esperadas.');
          rendererServer.setStudioDirectory(job.project, entries.map(item => item.file));
          resolve({ status: 'completed', manifest, tracks: entries.map(item => ({ key: item.key, label: item.label, url: `http://127.0.0.1:17843/__studio/${Buffer.from(item.file).toString('base64url')}` })) });
        } catch (error) { reject(error); }
      });
    });
  });
  ipcMain.handle('studio:cancel', () => { if (!active) return false; active.cancelled = true; active.child.kill(); return true; });
  return () => { if (active) { active.cancelled = true; active.child.kill(); active = undefined; } };
}

module.exports = { registerStudioProcess };
