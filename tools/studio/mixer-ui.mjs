import { Mixer } from './mixer-engine.mjs';

const $ = id => document.getElementById(id);
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
let config, mixer, busy = true;
const context = new AudioContext();
mixer = new Mixer(context);

function updateButtons() {
  $('play').textContent = mixer.playing ? 'Ⅱ Pausar' : '▶ Reproduzir';
  for (const id of ['play', 'restart', 'reset', 'timeline', 'group']) $(id).disabled = busy;
}

function renderTracks() {
  $('tracks').replaceChildren();
  mixer.tracks.forEach(track => {
    const card = document.createElement('section');
    card.className = `track${track.muted ? ' is-muted' : ''}`;
    const title = document.createElement('h2');
    title.textContent = track.label;
    card.append(title);
    const buttons = document.createElement('div');
    buttons.className = 'buttons';
    for (const [key, label] of [['muted', 'Silenciar'], ['solo', 'Ouvir só']]) {
      const button = document.createElement('button');
      button.textContent = label;
      button.setAttribute('aria-label', `${label}: ${track.label}`);
      button.setAttribute('aria-pressed', String(track[key]));
      button.onclick = () => {
        track[key] = !track[key];
        mixer.update();
        button.setAttribute('aria-pressed', String(track[key]));
        card.classList.toggle('is-muted', track.muted);
      };
      buttons.append(button);
    }
    card.append(buttons);
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'range'; input.min = '0'; input.max = '100'; input.value = String(track.volume * 100);
    input.setAttribute('aria-label', `Volume: ${track.label}`);
    const output = document.createElement('output');
    output.textContent = `${input.value}%`;
    input.oninput = () => { track.volume = Number(input.value) / 100; output.textContent = `${input.value}%`; mixer.update(); };
    label.append(input, output); card.append(label); $('tracks').append(card);
  });
}

async function loadGroup() {
  busy = true; mixer.pause(); updateButtons(); $('tracks').replaceChildren();
  $('status').textContent = 'Preparando as faixas para reprodução sincronizada…';
  try {
    const group = config.groups[Number($('group').value)];
    const tracks = await Promise.all(group.tracks.map(async track => {
      const response = await fetch(track.url);
      if (!response.ok) throw new Error(`Falha ao carregar ${track.url}`);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      return { ...track, buffer };
    }));
    if (!tracks.length || Math.max(...tracks.map(t => t.buffer.duration)) - Math.min(...tracks.map(t => t.buffer.duration)) > 0.01) {
      throw new Error('Durações incompatíveis');
    }
    mixer.setTracks(tracks, config.outputGain);
    $('timeline').max = String(mixer.duration);
    renderTracks(); busy = false;
    $('status').textContent = `${group.label} · ${tracks.length} faixa(s) prontas · trecho a partir de ${formatTime(config.startSeconds)}.`;
  } catch (error) {
    console.error(error);
    $('status').textContent = 'Não foi possível carregar as faixas. Reabra o Studio pelo servidor local e tente novamente.';
    // Permite escolher outro conjunto, mas impede reproduzir as faixas anteriores.
    $('group').disabled = false;
  }
  updateButtons();
  if (busy) $('group').disabled = false;
}

$('group').onchange = loadGroup;
$('play').onclick = async () => {
  try { if (mixer.playing) mixer.pause(); else await mixer.play(); updateButtons(); }
  catch (error) { console.error(error); $('status').textContent = 'Não foi possível iniciar o áudio. Tente novamente.'; }
};
$('restart').onclick = async () => { await mixer.seek(0); updateButtons(); };
$('timeline').onchange = async () => { await mixer.seek(Number($('timeline').value)); updateButtons(); };
$('reset').onclick = () => { mixer.reset(); renderTracks(); };
$('master').oninput = () => {
  const volume = Number($('master').value);
  mixer.master.gain.setTargetAtTime(volume / 100, context.currentTime, 0.015);
  $('master-value').textContent = `${volume}%`;
};
function animate() {
  if (mixer.playing && mixer.position >= mixer.duration) { mixer.pause(); updateButtons(); }
  if (document.activeElement !== $('timeline')) $('timeline').value = String(mixer.position);
  $('time').textContent = `${formatTime(mixer.position)} / ${formatTime(mixer.duration)}`;
  requestAnimationFrame(animate);
}
animate();
window.addEventListener('pagehide', () => { mixer.pause(); void context.close(); });
try {
  const response = await fetch('mixer.json');
  if (!response.ok) throw new Error('Projeto indisponível');
  config = await response.json();
  $('title').textContent = config.title;
  config.groups.forEach((group, index) => { const option = new Option(group.label, String(index)); $('group').add(option); });
  await loadGroup();
} catch (error) {
  console.error(error);
  $('status').textContent = 'Abra esta página pelo servidor local do Studio para carregar o projeto.';
}
