const token = location.hash.slice(1);
// LAN HTTP is not a secure context: randomUUID is unavailable on mobile.
function createDeviceId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}
let deviceId;
try { deviceId = localStorage.getItem('karaoke-device-id'); } catch { /* Private mode may deny storage. */ }
if (!/^[a-zA-Z0-9-]{8,80}$/.test(deviceId || '')) deviceId = createDeviceId();
try { localStorage.setItem('karaoke-device-id', deviceId); } catch { /* Keep this session usable without persistence. */ }
let operatorPin = '';
try { operatorPin = sessionStorage.getItem('karaoke-operator-pin') || ''; } catch { /* PIN can still be entered for this page. */ }
let allowPhotoDownload = false;
let currentPerformance = {};
let themeVersion;
let themeLoading = false;
async function updateTheme(version) {
  if (themeLoading || themeVersion === version) return;
  themeLoading = true;
  try {
    const theme = await call('theme');
    if (/^#[a-f0-9]{6}$/i.test(theme.accentColor)) document.documentElement.style.setProperty('--accent', theme.accentColor);
    const image = value => typeof value === 'string' && /^data:image\//.test(value) ? value : '';
    const logo = image(theme.logoUrl); el('brand-logo').src = logo; el('brand-logo').hidden = !logo; const name = theme.programName === undefined ? 'Meu Karaokê' : theme.programName.trim(); el('brand-title').hidden = !name; el('brand-title').textContent = name; document.title = name || 'Meu Karaokê'; el('copyright').textContent = `© ${new Date().getFullYear()}${name ? ` ${name}` : ''}. Todos os direitos reservados.`;
    const background = image(theme.backgroundImageUrl); document.body.style.backgroundImage = background ? `url("${background}")` : '';
    themeVersion = version;
  } finally { themeLoading = false; }
}
window.addEventListener('hashchange', () => location.reload());
const el = id => document.getElementById(id);
let busy = false;
async function call(action, data = {}) {
  const response = await fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, deviceId, pin: operatorPin, ...data }), signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || 'Falha de conexão.');
  return result;
}
async function refresh() {
  try {
    const state = await call('state');
    currentPerformance = state;
    if (state.themeVersion !== themeVersion) void updateTheme(state.themeVersion).catch(() => undefined);
    el('pin-form').hidden = !state.locked;
    el('remote-content').hidden = !!state.locked;
    if (state.locked) { el('connection').classList.remove('connected'); el('connection').textContent = state.pinRequired ? 'Informe o PIN para operar' : 'Operador remoto desativado'; return; }
    el('connection').classList.add('connected');
    el('connection').textContent = state.role === 'operator' ? 'Administrador' : 'Peça sua música';
    el('controls').hidden = state.role !== 'operator' && !state.permissions.allowPlayback && !state.permissions.allowPitch;
    document.querySelector('[data-action="start"]').hidden = state.role !== 'operator' || ['playing', 'paused'].includes(state.status);
    document.querySelector('[data-action="pause"]').hidden = state.status !== 'playing';
    document.querySelector('[data-action="resume"]').hidden = state.status !== 'paused';
    const active = ['playing', 'paused'].includes(state.status);
    for (const action of ['skip', 'previous']) { const button = document.querySelector(`[data-action="${action}"]`); button.hidden = state.role !== 'operator'; button.disabled = action === 'previous' && !state.canPrevious; }
    for (const action of ['pause', 'resume', 'restart', 'back']) { const button = document.querySelector(`[data-action="${action}"]`); button.hidden = (state.role !== 'operator' && !state.permissions.allowPlayback) || (action === 'pause' && state.status !== 'playing') || (action === 'resume' && state.status !== 'paused'); button.disabled = !active; }
    document.querySelectorAll('.pitch-control').forEach(button => { button.hidden = state.role !== 'operator' && !state.permissions.allowPitch; button.disabled = !state.pitchAvailable || !active; });
    el('pitch-value').hidden = !state.pitchAvailable;
    el('pitch-value').textContent = state.pitch ? `Tom: ${state.pitch > 0 ? '+' : ''}${state.pitch} semitom(ns)` : 'Tom original';
    renderRatings(state);
    el('search').hidden = !state.permissions.allowAdd;
    el('queue-section').hidden = !state.permissions.allowQueue && state.role !== 'operator';
    el('name').required = state.permissions.requestName;
    el('name').parentElement.querySelector('label[for="name"]').hidden = !state.permissions.requestName;
    el('name').hidden = !state.permissions.requestName;
    el('reactions').hidden = !state.permissions.allowReactions || !state.current || !['playing', 'paused'].includes(state.status);
    el('photo-offer').hidden = !state.photoOffer;
    allowPhotoDownload = !!state.photoDownload; el('photo-download').hidden = !allowPhotoDownload || !el('photo-download').href;
    el('operator-score').hidden = state.role !== 'operator' || state.status !== 'scoring' || state.scoreMode !== 'operator';
    el('score').hidden = state.status !== 'scoring';
    el('score').textContent = state.status === 'scoring' ? (state.scoreNotice || `Pontuação: ${state.score}`) : '';
    const labels = { playing: 'Tocando', paused: 'Pausado', intermission: 'Intervalo', idle: 'Parado', scoring: 'Pontuação', photo: 'Foto' };
    el('playing').textContent = state.current ? `${state.current} · ${labels[state.status] || state.status}` : 'Nenhuma música em reprodução';
    el('session-history').replaceChildren(...(state.sessionTracks || []).map(item => { const li = document.createElement('li'); const button = document.createElement('button'); button.className = 'history-request'; button.textContent = `${item.title} — ${item.name} · ${item.position}`; button.setAttribute('aria-label', `Pedir ${item.title} novamente`); button.disabled = !state.permissions.allowAdd; button.onclick = async () => { button.disabled = true; try { await call('add', { trackId: item.trackId, name: el('name').value }); el('message').textContent = 'Música adicionada à fila!'; await refresh(); } catch (error) { el('message').textContent = error.message; if (state.permissions.requestName && !el('name').value.trim()) { el('name').scrollIntoView({ block: 'center' }); el('name').focus(); } } finally { button.disabled = !currentPerformance.permissions?.allowAdd; } }; li.append(button); return li; }));
    el('queue').replaceChildren(...state.queue.map(item => { const li = document.createElement('li'); const label = document.createElement('span'); label.textContent = `${item.title} — ${item.name}`; li.append(label); if (state.role === 'operator') { [['queueUp', '↑'], ['queueDown', '↓'], ['queueRemove', 'Remover']].forEach(([action, text]) => { const button = document.createElement('button'); button.textContent = text; button.onclick = async () => { try { await call(action, { queueId: item.id }); await refresh(); } catch (error) { el('message').textContent = error.message; } }; li.append(button); }); } return li; }));
  } catch (error) { el('connection').classList.remove('connected'); el('connection').textContent = `Sem conexão: ${error.message}`; }
}
el('operator-score').addEventListener('submit', async event => { event.preventDefault(); try { await call('confirmScore', { score: Number(el('manual-score').value) }); el('manual-score').value = ''; await refresh(); } catch (error) { el('message').textContent = error.message; } });
el('search').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return; busy = true; el('search-button').disabled = true; el('message').textContent = 'Buscando versões para karaokê…';
  try {
    const result = await call('search', { query: el('query').value });
    el('results').replaceChildren(...result.tracks.map(track => {
      const row = document.createElement('article'); const title = document.createElement('div'); title.textContent = track.title;
      const img = document.createElement('img'); img.src = track.thumbnail; img.alt = ''; img.loading = 'lazy';
      const channel = document.createElement('small'); channel.textContent = track.artist;
      const button = document.createElement('button'); button.textContent = 'Pedir música';
      button.onclick = async () => { button.disabled = true; try { await call('add', { trackId: track.id, name: el('name').value }); el('message').textContent = 'Música adicionada à fila!'; await refresh(); } catch (error) { el('message').textContent = error.message; } finally { button.disabled = false; } };
      row.append(img, title, channel, document.createElement('br'), button); return row;
    }));
    el('message').textContent = result.tracks.length ? 'Escolha sua versão. Os resultados podem incluir voz.' : 'Nenhum resultado encontrado.';
  } catch (error) { el('message').textContent = error.message; } finally { busy = false; el('search-button').disabled = false; }
});
document.querySelectorAll('[data-action]').forEach(button => { button.onclick = async () => { button.disabled = true; try { await call(button.dataset.action); await refresh(); } catch (error) { el('message').textContent = error.message; } finally { await refresh(); } }; });
function renderRatings(state) {
  if (!el('rating-options').children.length && state.ratingLevels) {
    state.ratingLevels.forEach(level => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.rating = level.score;
      button.setAttribute('aria-label', `${level.label}: ${level.score} pontos`);
      const emoji = document.createElement('span'); emoji.className = 'emoji'; emoji.textContent = level.emoji;
      const label = document.createElement('span'); label.textContent = level.label;
      const points = document.createElement('span'); points.className = 'points'; points.textContent = level.score;
      button.append(emoji, label, points);
      button.onclick = async () => { button.disabled = true; try { await call('react', { reaction: level.score }); el('rating-feedback').textContent = `Sua nota: ${level.score}/100`; await refresh(); } catch (error) { el('message').textContent = error.message; } finally { button.disabled = false; } };
      el('rating-options').append(button);
    });
  }
  el('rating-options').querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.rating) === state.rating));
    button.disabled = !!state.rating && !state.permissions.multipleReactions;
  });
}
let pendingPhotoBitmap;
let photoEdit = { rotation: 0, zoom: 1, brightness: 100, contrast: 100, saturation: 100, panX: 0, panY: 0 };
const photoCanvas = el('photo-canvas');
function releasePendingPhoto() { pendingPhotoBitmap?.close(); pendingPhotoBitmap = undefined; }
function renderPhotoCanvas() {
  if (!pendingPhotoBitmap) return;
  const [ratioWidth, ratioHeight] = el('photo-ratio').value.split(':').map(Number);
  photoCanvas.width = ratioWidth >= ratioHeight ? 960 : 720;
  photoCanvas.height = Math.round(photoCanvas.width * ratioHeight / ratioWidth);
  const context = photoCanvas.getContext('2d'); const width = photoCanvas.width; const height = photoCanvas.height;
  context.fillStyle = '#151515'; context.fillRect(0, 0, width, height);
  const radians = photoEdit.rotation * Math.PI / 180; const cosine = Math.abs(Math.cos(radians)); const sine = Math.abs(Math.sin(radians));
  const rotatedWidth = pendingPhotoBitmap.width * cosine + pendingPhotoBitmap.height * sine; const rotatedHeight = pendingPhotoBitmap.width * sine + pendingPhotoBitmap.height * cosine;
  const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * photoEdit.zoom;
  context.save(); context.translate(width / 2 + photoEdit.panX * width / 100, height / 2 + photoEdit.panY * height / 100); context.rotate(radians); context.scale(scale, scale);
  context.filter = `brightness(${photoEdit.brightness}%) contrast(${photoEdit.contrast}%) saturate(${photoEdit.saturation}%)`;
  context.drawImage(pendingPhotoBitmap, -pendingPhotoBitmap.width / 2, -pendingPhotoBitmap.height / 2); context.restore(); context.filter = 'none';
  if (currentPerformance.photoFrame === 'Evento' || currentPerformance.photoFrame === 'Polaroid') { const size = Math.max(12, Math.round(width / (currentPerformance.photoFrame === 'Evento' ? 55 : 28))); context.strokeStyle = currentPerformance.photoFrame === 'Evento' ? '#ff8a00' : '#fff'; context.lineWidth = size; context.strokeRect(size / 2, size / 2, width - size, height - size); }
  const stamp = currentPerformance.photoStamp || {}; const lines = []; if (stamp.logo) lines.push('MEU KARAOKÊ'); if (stamp.name) lines.push(currentPerformance.singer || 'Participante'); if (stamp.song) lines.push(currentPerformance.current || ''); if (stamp.score) lines.push(`${currentPerformance.score || 0} pontos`); if (stamp.date) lines.push(new Date().toLocaleString('pt-BR'));
  if (lines.length) { const fontSize = Math.max(18, Math.round(width / 42)); const padding = fontSize; const bannerHeight = lines.length * fontSize * 1.35 + padding * 1.4; context.fillStyle = 'rgba(0,0,0,.68)'; context.fillRect(0, height - bannerHeight, width, bannerHeight); context.font = `600 ${fontSize}px system-ui`; context.fillStyle = '#fff'; lines.forEach((line, index) => context.fillText(String(line).slice(0, 80), padding, height - bannerHeight + padding + fontSize * (index + .7), width - padding * 2)); }
}
function openPhotoEditor(file) {
  const reader = file ? createImageBitmap(file) : Promise.reject(new Error('Não foi possível abrir a foto.'));
  reader.then(bitmap => { releasePendingPhoto(); pendingPhotoBitmap = bitmap; photoEdit = { rotation: 0, zoom: 1, brightness: 100, contrast: 100, saturation: 100, panX: 0, panY: 0 }; ['zoom', 'brightness', 'contrast', 'saturation'].forEach(key => { el(`photo-${key}`).value = photoEdit[key]; }); el('photo-ratio').value = '4:3'; el('photo-editor-message').textContent = ''; renderPhotoCanvas(); el('photo-editor').showModal(); }).catch(error => { el('message').textContent = error.message || 'Não foi possível abrir a foto.'; });
}
el('photo').addEventListener('change', event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) openPhotoEditor(file); });
el('prepare-photo').addEventListener('click', () => { el('photo').value = ''; el('photo').click(); });
['zoom', 'brightness', 'contrast', 'saturation'].forEach(key => el(`photo-${key}`).addEventListener('input', event => { photoEdit[key] = Number(event.target.value); renderPhotoCanvas(); }));
el('photo-ratio').addEventListener('change', renderPhotoCanvas);
el('rotate-left').addEventListener('click', () => { photoEdit.rotation = (photoEdit.rotation + 270) % 360; renderPhotoCanvas(); });
el('rotate-right').addEventListener('click', () => { photoEdit.rotation = (photoEdit.rotation + 90) % 360; renderPhotoCanvas(); });
let dragPhoto;
photoCanvas.addEventListener('pointerdown', event => { dragPhoto = { x: event.clientX, y: event.clientY }; photoCanvas.setPointerCapture(event.pointerId); });
photoCanvas.addEventListener('pointermove', event => { if (!dragPhoto) return; const bounds = photoCanvas.getBoundingClientRect(); photoEdit.panX = Math.max(-50, Math.min(50, photoEdit.panX + (event.clientX - dragPhoto.x) / bounds.width * 100)); photoEdit.panY = Math.max(-50, Math.min(50, photoEdit.panY + (event.clientY - dragPhoto.y) / bounds.height * 100)); dragPhoto = { x: event.clientX, y: event.clientY }; renderPhotoCanvas(); });
photoCanvas.addEventListener('pointerup', () => { dragPhoto = undefined; });
photoCanvas.addEventListener('pointercancel', () => { dragPhoto = undefined; });
el('retake-photo').addEventListener('click', () => { el('photo-editor').close(); releasePendingPhoto(); el('photo').click(); });
el('close-photo-editor').addEventListener('click', () => { el('photo-editor').close(); releasePendingPhoto(); });
el('photo-editor').addEventListener('cancel', releasePendingPhoto);
el('confirm-photo').addEventListener('click', async event => {
  if (!pendingPhotoBitmap) return; const button = event.currentTarget; button.disabled = true; el('photo-editor-message').textContent = 'Enviando foto ao karaokê…';
  try {
    const photoDataUrl = photoCanvas.toDataURL('image/jpeg', .84); await call('photo', { photoDataUrl });
    el('photo-preview').src = photoDataUrl; el('photo-preview').hidden = false; el('photo-download').href = photoDataUrl; el('photo-download').hidden = !allowPhotoDownload; el('message').textContent = 'Foto enviada e recebida pelo karaokê!'; el('photo-editor').close(); releasePendingPhoto(); await refresh();
  } catch (error) { el('photo-editor-message').textContent = error.message || 'Não foi possível enviar a foto. Tente novamente.'; } finally { button.disabled = false; }
});
el('pin-form').addEventListener('submit', event => { event.preventDefault(); operatorPin = el('pin').value; try { sessionStorage.setItem('karaoke-operator-pin', operatorPin); } catch { /* Keep the PIN in memory when storage is denied. */ } void refresh(); });
void updateTheme(0).catch(() => undefined); void refresh(); setInterval(refresh, 2500);
