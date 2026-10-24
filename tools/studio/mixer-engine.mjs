export function effectiveGain(track, tracks) {
  const hasSolo = tracks.some(item => item.solo);
  return track.muted || (hasSolo && !track.solo) ? 0 : track.volume;
}

// Todas as faixas compartilham o mesmo relógio e instante de início.
export class Mixer {
  constructor(context) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0.5;
    this.headroom = context.createGain();
    this.master.connect(this.headroom);
    this.headroom.connect(context.destination);
    this.tracks = [];
    this.sources = [];
    this.offset = 0;
    this.duration = 0;
    this.playing = false;
    this.revision = 0;
  }

  setTracks(tracks, outputGain = 1) {
    this.pause();
    this.tracks.forEach(track => track.gain.disconnect());
    this.tracks = tracks.map(track => {
      const gain = this.context.createGain();
      gain.connect(this.master);
      return { ...track, gain, volume: 1, muted: false, solo: false };
    });
    this.duration = Math.min(...tracks.map(track => track.buffer.duration));
    this.offset = 0;
    this.headroom.gain.value = Math.max(0, Math.min(1, outputGain));
    this.update();
  }

  get position() {
    return Math.min(this.duration, this.offset + (this.playing ? Math.max(0, this.context.currentTime - this.startedAt) : 0));
  }

  async play() {
    if (this.playing || !this.tracks.length) return;
    const revision = this.revision;
    await this.context.resume();
    // Uma segunda chamada pode ter aguardado o mesmo resume.
    if (this.playing || revision !== this.revision) return;
    if (this.offset >= this.duration) this.offset = 0;
    const when = this.context.currentTime + 0.05;
    this.sources = this.tracks.map(track => {
      const source = this.context.createBufferSource();
      source.buffer = track.buffer;
      source.connect(track.gain);
      source.start(when, this.offset);
      return source;
    });
    this.startedAt = when;
    this.playing = true;
  }

  pause() {
    this.revision++;
    this.offset = this.position;
    this.sources.forEach(source => { source.stop(); source.disconnect(); });
    this.sources = [];
    this.playing = false;
  }

  async seek(seconds) {
    const resume = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(this.duration, seconds));
    if (resume && this.offset < this.duration) await this.play();
  }

  update() {
    this.tracks.forEach(track => {
      track.gain.gain.setTargetAtTime(effectiveGain(track, this.tracks), this.context.currentTime, 0.015);
    });
  }

  reset() {
    this.tracks.forEach(track => Object.assign(track, { volume: 1, muted: false, solo: false }));
    this.update();
  }
}
