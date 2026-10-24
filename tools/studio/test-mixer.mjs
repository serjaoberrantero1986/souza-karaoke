import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Mixer, effectiveGain } from './mixer-engine.mjs';

function fakeContext() {
  return {
    currentTime: 1, destination: {}, starts: [],
    async resume() {},
    createGain() { return { gain: { value: 1, setTargetAtTime(value) { this.value = value; } }, connect() {}, disconnect() {} }; },
    createBufferSource() { const context = this; return { connect() {}, disconnect() {}, stop() {}, start(...args) { context.starts.push(args); } }; },
  };
}
const tracks = () => ['Voz', 'Bateria', 'Baixo', 'Outros'].map(label => ({ label, buffer: { duration: 30 } }));

test('solo e silenciar respeitam os volumes individuais', () => {
  const all = [{ solo: true, muted: false, volume: 0.4 }, { solo: false, muted: false, volume: 1 }];
  assert.equal(effectiveGain(all[0], all), 0.4);
  assert.equal(effectiveGain(all[1], all), 0);
  all[0].muted = true;
  assert.equal(effectiveGain(all[0], all), 0);
});
test('todas as faixas iniciam no mesmo instante e ponto após buscar', async () => {
  const context = fakeContext(), mixer = new Mixer(context);
  mixer.setTracks(tracks());
  await mixer.seek(12);
  await mixer.play();
  assert.equal(context.starts.length, 4);
  context.starts.forEach(start => assert.deepEqual(start, [1.05, 12]));
  context.currentTime = 4.05;
  mixer.pause();
  assert.equal(mixer.offset, 15);
  assert.equal(mixer.sources.length, 0);
});
test('trocar conjunto interrompe reprodução e restaura posição', async () => {
  const context = fakeContext(), mixer = new Mixer(context);
  mixer.setTracks(tracks()); await mixer.play();
  mixer.setTracks(tracks());
  assert.equal(mixer.playing, false);
  assert.equal(mixer.position, 0);
});
test('restaurar mantém a posição e redefine volume, solo e silenciar', async () => {
  const mixer = new Mixer(fakeContext()); mixer.setTracks(tracks());
  await mixer.seek(10);
  Object.assign(mixer.tracks[0], { volume: 0.1, solo: true, muted: true });
  mixer.reset();
  assert.equal(mixer.position, 10);
  mixer.tracks.forEach(track => { assert.equal(track.volume, 1); assert.equal(track.solo, false); assert.equal(track.muted, false); });
});
test('pausar durante ativação do áudio cancela o início pendente', async () => {
  const context = fakeContext();
  let resume;
  context.resume = () => new Promise(resolve => { resume = resolve; });
  const mixer = new Mixer(context); mixer.setTracks(tracks());
  const pending = mixer.play(); mixer.pause(); resume(); await pending;
  assert.equal(mixer.playing, false);
  assert.equal(context.starts.length, 0);
});
