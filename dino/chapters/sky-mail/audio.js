// Small WebAudio ensemble: wind bed, adaptive three-route score, and flight SFX.
// Every sound is synthesized, so the chapter stays fully offline.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

const SCORES = {
  dawn: { root: 57, scale: [0, 2, 4, 7, 9, 12, 14], bpm: 84, pad: [0, 4, 7], bells: true },
  dusk: { root: 50, scale: [0, 2, 3, 5, 7, 10, 12], bpm: 76, pad: [0, 3, 7], bells: false },
  night: { root: 52, scale: [0, 2, 3, 7, 10, 12, 15], bpm: 62, pad: [0, 7, 12], bells: true }
};

export class SkyAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.route = 'dawn';
    this.musicOn = false;
    this.windNodes = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.tension = 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    // One AudioContext per page: the bank joins this one instead of opening a
    // second, or the sample and the synthesiser run on two different clocks.
    if (window.DUAudio) window.DUAudio.useContext(ctx);

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 22;
    this.compressor.ratio.value = 3.4;
    this.compressor.attack.value = 0.006;
    this.compressor.release.value = 0.28;

    this.master.connect(this.compressor);
    this.compressor.connect(ctx.destination);

    // soft hall
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(2.4, 2.6);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.3;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.compressor);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.5;
    this.musicBus.connect(this.master);
    this.musicSend = ctx.createGain();
    this.musicSend.gain.value = 0.5;
    this.musicBus.connect(this.musicSend);
    this.musicSend.connect(this.reverb);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);
    this.sfxSend = ctx.createGain();
    this.sfxSend.gain.value = 0.32;
    this.sfxBus.connect(this.sfxSend);
    this.sfxSend.connect(this.reverb);

    this.startWind();
  }

  impulse(seconds, decay) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  noiseBuffer(seconds = 2) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + white * 0.02) * 0.995;
      data[i] = white * 0.7 + last * 2.2;
    }
    return buf;
  }

  startWind() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(3);
    src.loop = true;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 520;
    band.Q.value = 0.55;

    const air = ctx.createBiquadFilter();
    air.type = 'lowpass';
    air.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.028;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(band); band.connect(air); air.connect(gain);
    if (pan) { pan.pan.value = 0; gain.connect(pan); pan.connect(this.master); }
    else gain.connect(this.master);

    src.start();
    lfo.start();
    this.windNodes = { src, band, air, gain, pan, lfoGain };
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.08);
    }
  }

  setRoute(route) {
    this.route = route;
    const s = SCORES[route];
    if (!this.ctx) return;
    if (this.windNodes) {
      this.windNodes.band.frequency.setTargetAtTime(route === 'night' ? 380 : 540, this.ctx.currentTime, 1.2);
    }
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.15;
    if (!this.musicOn) { this.musicOn = true; this.pump(); }
  }

  pump() {
    if (this.timer) return;
    this.timer = setInterval(() => this.schedule(), 120);
  }

  stopMusic() {
    this.musicOn = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  setTension(v) { this.tension = Math.max(0, Math.min(1, v)); }

  updateWind(speed01, height01) {
    if (!this.windNodes || !this.ctx) return;
    const t = this.ctx.currentTime;
    const node = this.windNodes;
    node.gain.gain.setTargetAtTime(0.035 + speed01 * 0.05, t, 0.3);
    node.air.frequency.setTargetAtTime(1400 + height01 * 1600 + speed01 * 900, t, 0.4);
    if (node.pan) node.pan.pan.setTargetAtTime((height01 - 0.5) * 0.5, t, 0.5);
  }

  schedule() {
    if (!this.musicOn || !this.ctx) return;
    const s = SCORES[this.route];
    const spb = 60 / s.bpm;
    while (this.nextTime < this.ctx.currentTime + 0.45) {
      this.playStep(this.step, this.nextTime, s, spb);
      this.step++;
      this.nextTime += spb * (this.step % 16 === 0 ? 2 : 1);
    }
  }

  playStep(step, t, s, spb) {
    const bar = Math.floor(step / 8);
    const deg = s.scale;
    const rootMidi = s.root + (bar % 2 === 1 ? -2 : 0);

    // low pad every 8 steps
    if (step % 8 === 0) {
      s.pad.forEach((iv, k) => {
        this.pad(NOTE(rootMidi - 12 + iv), t, spb * 7.4, 0.055 - k * 0.008);
      });
    }

    // plucked arpeggio, sparse on night route
    const pattern = this.route === 'night' ? [0, 4, 2, 6, 4, 1] : [0, 2, 4, 2, 5, 4, 6, 3];
    if (step % (this.route === 'night' ? 4 : 2) === 0) {
      const idx = pattern[(step / 2 | 0) % pattern.length];
      const octave = step % 16 === 8 ? 12 : 0;
      const midi = rootMidi + deg[idx % deg.length] + octave;
      this.pluck(NOTE(midi), t + (step % 4 === 0 ? 0 : 0.01), 0.05, this.route === 'night' ? 1.3 : 0.75);
    }

    // accent bell at phrase ends
    if (s.bells && step % 32 === 24) {
      this.bell(NOTE(rootMidi + 24), t, 0.035);
    }

    // low pulse during tension
    if (this.tension > 0.45 && step % 2 === 0) {
      this.thump(NOTE(rootMidi - 24), t, 0.03 * this.tension, 0.16);
    }
  }

  pad(freq, t, dur, gain) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    [1, 1.005, 2].forEach((mult, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'sine' : 'triangle';
      o.frequency.value = freq * mult;
      o.detune.value = i * 4;
      const og = ctx.createGain();
      og.gain.value = i === 2 ? 0.25 : 0.6;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + dur + 0.1);
    });
    g.connect(lp); lp.connect(this.musicBus);
  }

  pluck(freq, t, gain, decay) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = freq * 2.002;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    const g2 = ctx.createGain();
    g2.gain.value = 0.22;
    o.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(this.musicBus);
    o.start(t); o2.start(t);
    o.stop(t + decay + 0.05); o2.stop(t + decay + 0.05);
  }

  bell(freq, t, gain) {
    const ctx = this.ctx;
    [1, 2.76, 5.4].forEach((mult, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain / (i + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6 + i * 0.2);
      o.connect(g); g.connect(this.sfxBus);
      o.start(t); o.stop(t + 2);
    });
  }

  thump(freq, t, gain, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  burst({ dur = 0.2, freq = 900, q = 0.8, gain = 0.1, sweep = 0, type = 'bandpass' }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(Math.max(0.4, dur + 0.1));
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(80, freq + sweep), t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t); src.stop(t + dur + 0.05);
  }

  /* The recorded bank, when this page carries it. Every sound below is still
   * synthesised: a sample only wins once it has actually arrived, and it plays
   * through this engine's own buses so the mute button and the compressor still
   * own it. */
  sample(name, o) {
    const A = window.DUAudio;
    if (!A || !this.ctx) return false;
    return A.play(name, Object.assign({ dest: this.sfxBus }, o || {}));
  }

  flap() {
    if (this.sample('whoosh')) return;
    this.burst({ dur: 0.16, freq: 380 + Math.random() * 180, q: 0.9, gain: 0.05, sweep: -160 });
  }

  letter() {
    if (!this.ctx) return;
    if (this.sample('chime')) return;
    const t = this.ctx.currentTime;
    this.bell(NOTE(84), t, 0.05);
    this.bell(NOTE(88), t + 0.09, 0.035);
    this.pluck(NOTE(91), t + 0.02, 0.07, 0.6);
  }

  gate() {
    if (this.sample('scrape')) return;
    this.burst({ dur: 0.34, freq: 600, q: 1.4, gain: 0.07, sweep: 1400 });
    if (this.ctx) this.pluck(NOTE(79), this.ctx.currentTime, 0.05, 0.45);
  }

  deliver() {
    if (!this.ctx) return;
    if (this.sample('good')) return;
    const t = this.ctx.currentTime;
    [72, 76, 79, 84].forEach((n, i) => this.pluck(NOTE(n), t + i * 0.11, 0.08, 1.2));
    this.bell(NOTE(96), t + 0.44, 0.04);
    this.burst({ dur: 0.5, freq: 1200, q: 0.7, gain: 0.04, sweep: -700 });
  }

  hurt() {
    if (!this.ctx) return;
    if (this.sample('hurt')) return;
    const t = this.ctx.currentTime;
    this.thump(110, t, 0.18, 0.4);
    this.burst({ dur: 0.3, freq: 700, q: 0.6, gain: 0.12, sweep: -500, type: 'lowpass' });
  }

  thunder(delay = 0) {
    if (!this.ctx) return;
    if (this.sample('boom', { at: delay })) return;
    const t = this.ctx.currentTime + delay;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(2.6);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(320, t);
    f.frequency.exponentialRampToValueAtTime(90, t + 1.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + 2.4);
  }

  ui() {
    if (!this.ctx) return;
    if (this.sample('ui')) return;
    this.pluck(NOTE(81), this.ctx.currentTime, 0.05, 0.28);
  }

  routeComplete() {
    if (!this.ctx) return;
    if (this.sample('win')) return;
    const t = this.ctx.currentTime;
    [67, 71, 74, 79, 83, 86].forEach((n, i) => this.pluck(NOTE(n), t + i * 0.13, 0.075, 1.6));
    this.bell(NOTE(98), t + 0.8, 0.03);
  }

  fail() {
    if (!this.ctx) return;
    if (this.sample('fail')) return;
    const t = this.ctx.currentTime;
    [72, 68, 63, 59].forEach((n, i) => this.pluck(NOTE(n), t + i * 0.16, 0.07, 0.9));
  }
}
