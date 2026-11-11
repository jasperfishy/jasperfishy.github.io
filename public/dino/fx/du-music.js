/* Dinosaur Universe — procedural music engine (DUMusic).
 *
 * No audio files: every theme is synthesised, so the offline app stays small.
 *
 *   DUMusic.play('park')        start/crossfade to a named theme
 *   DUMusic.pause() / resume()  silent toggle, keeps the place in the tune
 *   DUMusic.stop()
 *   DUMusic.mood('win'|'lose'|'hush')   one-shot stinger
 *   DUMusic.intensity(0..1)     add/remove layers live (used when a level gets busy)
 *   DUMusic.theme               the currently named theme, or null
 *
 * Shares one AudioContext with DUFX, honours the parent sound switch and
 * prefers-reduced-motion-adjacent audio habits, and parks itself when the tab
 * is hidden so a tablet in a bag does not play to an empty room.
 */
(function () {
  'use strict';
  if (window.DUMusic && window.DUMusic.play) return;
  const DUMusic = window.DUMusic = {};
  const FX = window.DUFX;

  let ac = null, master = null, verb = null, ready = false, started = false;
  let current = null, gainNode = null, timer = 0, step = 0, nextAt = 0;
  let intensity = 0.55, pending = null, duckUntil = 0;

  /* ---------- context ---------- */
  function ctx() {
    if (ac === null) {
      try { ac = (FX && FX.audioCtx) ? FX.audioCtx() : new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ac = false; }
    }
    return ac || null;
  }
  function build() {
    const c = ctx();
    if (!c || ready) return ready;
    master = c.createGain();
    master.gain.value = 0.0001;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = 0.4;
    // Cheap reverb: two feedback delays. Long enough to feel like a cave.
    verb = c.createGain(); verb.gain.value = 0.3;
    const d1 = c.createDelay(1); d1.delayTime.value = 0.19;
    const d2 = c.createDelay(1); d2.delayTime.value = 0.31;
    const fb1 = c.createGain(); fb1.gain.value = 0.42;
    const fb2 = c.createGain(); fb2.gain.value = 0.34;
    verb.connect(d1); d1.connect(fb1); fb1.connect(d1); d1.connect(lp);
    verb.connect(d2); d2.connect(fb2); fb2.connect(d2); d2.connect(lp);
    lp.connect(master); master.connect(c.destination);
    ready = true;
    return true;
  }
  const on = () => !(FX && FX.settings && FX.settings.sound === false);
  const reduce = () => !!(FX && FX.settings && FX.settings.reduce);

  /* ---------- instruments ---------- */
  function env(node, t, a, d, peak) {
    const g = node.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function voice(t, freq, dur, type, peak, opts) {
    const c = ctx(); if (!c || !gainNode || peak <= 0) return;
    opts = opts || {};
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    let head = o;
    if (opts.detune) { o.detune.value = opts.detune; }
    if (opts.filter) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(opts.filter, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(120, opts.filter * 0.28), t + dur);
      f.Q.value = opts.q || 3;
      head.connect(f); head = f;
    }
    head.connect(g);
    g.connect(gainNode);
    if (opts.send) g.connect(verb);
    // A second detuned oscillator gives bells and pads their shimmer.
    if (opts.pair) {
      const o2 = c.createOscillator(), g2 = c.createGain();
      o2.type = type; o2.frequency.setValueAtTime(freq * opts.pair, t);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(peak * 0.5, t + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o2.connect(g2); g2.connect(gainNode);
      o2.start(t); o2.stop(t + dur + 0.05);
    }
    env(g, t, opts.attack || 0.012, dur, peak);
    o.start(t); o.stop(t + dur + 0.06);
  }
  // Karplus-Strong-ish pluck: a short noise burst through a tuned delay.
  function pluck(t, freq, peak, send) {
    const c = ctx(); if (!c || !gainNode || peak <= 0) return;
    const dur = 0.55;
    const len = Math.max(1, Math.round(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const src = c.createBufferSource(); src.buffer = buf;
    const dl = c.createDelay(0.02); dl.delayTime.value = Math.min(0.0199, 1 / freq);
    const fb = c.createGain(); fb.gain.value = 0.86;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400;
    const g = c.createGain();
    src.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(g);
    g.connect(gainNode);
    if (send) g.connect(verb);
    env(g, t, 0.005, dur, peak);
    src.start(t); src.stop(t + dur + 0.05);
  }

  /* ---------- theory ---------- */
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const MINOR = [0, 2, 3, 5, 7, 8, 10];
  // `degree` counts scale steps, not semitones: 7 is the tonic an octave up and
  // negative degrees reach below it, so melody patterns stay readable.
  // Clamped to what a tablet speaker can actually reproduce — a 32 Hz bass note
  // is pure battery drain in a child's ear.
  function hz(T, degree, oct) {
    const scale = T.minor ? MINOR : MAJOR;
    const s = scale.length;
    const idx = ((degree % s) + s) % s;
    const midi = 12 * ((oct || 0) + 4 + Math.floor(degree / s)) + T.root + scale[idx];
    return Math.max(58, Math.min(2800, 440 * Math.pow(2, (midi - 69) / 12)));
  }
  // A chord is three scale degrees; a pattern picks one of them per step.
  function toneOf(T, chord, pattern, i, oct) {
    const step = pattern[(i / 2 | 0) % pattern.length] % 3;
    const deg = chord[step] !== undefined ? chord[step] : chord[0];
    return hz(T, deg, oct);
  }

  /* ---------- themes ----------
   * chords  : scale degrees, triads built on them
   * bells   : melody degrees over one 32-step bar cycle (null = rest)
   * colour  : the palette a world feels like, reused by the story screens
   */
  const THEMES = {
    park: {
      bpm: 104, root: SEMI.C, minor: false, vol: 0.30, colour: '#ff8a4d',
      chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]],
      bells: [0, null, 4, null, 7, null, 4, null, 2, null, 4, null, 0, null, null, null,
        7, null, 9, null, 11, null, 9, null, 7, null, 4, null, 2, null, 0, null],
      pluck: [0, 4, 7, 11], bass: [0, 2, 3, 1], pad: true
    },
    meadow: {
      bpm: 78, root: SEMI.G, minor: false, vol: 0.26, colour: '#7fd16e',
      chords: [[0, 4, 7], [-3, 0, 4], [2, 5, 9], [4, 7, 11]],
      bells: [7, null, null, 4, null, null, 7, null, 9, null, null, null, 7, null, 4, null,
        5, null, null, 2, null, null, 5, null, 7, null, null, 4, null, null, null, null],
      pluck: [0, 2, 4, 7], bass: [0, 3, 1, 2], pad: true
    },
    drive: {
      bpm: 126, root: SEMI.A, minor: true, vol: 0.28, colour: '#4aa8ff',
      chords: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [0, 3, 7]],
      bells: [0, null, 0, 3, null, 0, null, 7, 5, null, 5, 3, null, 0, null, null,
        7, null, 7, 9, null, 7, null, 3, 5, null, 3, 0, null, null, null, null],
      pluck: [0, 3, 5, 7], bass: [0, 0, 2, 3], pad: false
    },
    adventures: {
      bpm: 92, root: SEMI.D, minor: false, vol: 0.27, colour: '#c77dff',
      chords: [[0, 4, 7], [7, 11, 14], [5, 9, 12], [2, 5, 9]],
      bells: [4, null, 7, null, 11, null, 9, null, 7, null, null, 4, null, 5, null, null,
        9, null, 11, null, 14, null, 12, null, 11, null, null, 9, null, 7, null, null],
      pluck: [2, 4, 7, 9], bass: [0, 3, 1, 2], pad: true
    },
    night: {
      bpm: 62, root: SEMI.E, minor: true, vol: 0.22, colour: '#5b6ee1',
      chords: [[0, 3, 7], [-2, 2, 5], [3, 7, 10], [0, 3, 7]],
      bells: [7, null, null, null, 10, null, null, null, 7, null, 12, null, null, null, null, null,
        5, null, null, null, 7, null, null, null, 3, null, null, null, null, null, null, null],
      pluck: [0, 3, 7, 10], bass: [0, 1, 3, 1], pad: true
    },
    egg: {
      bpm: 118, root: SEMI.F, minor: false, vol: 0.28, colour: '#ffd93d',
      chords: [[0, 4, 7], [7, 11, 14], [2, 5, 9], [4, 7, 11]],
      bells: [0, 4, 7, null, 4, null, 7, 11, 9, null, 7, null, 4, null, 0, null,
        2, 5, 9, null, 5, null, 9, 12, 11, null, 9, null, 7, null, 4, null],
      pluck: [0, 2, 4, 7], bass: [0, 3, 1, 2], pad: false
    },
    story: {
      bpm: 70, root: SEMI.C, minor: false, vol: 0.24, colour: '#ffe6a7',
      chords: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]],
      bells: [0, null, null, null, 4, null, null, null, 7, null, null, null, 11, null, null, null,
        12, null, null, null, 11, null, null, null, 7, null, null, null, 4, null, null, null],
      pluck: [0, 4, 7, 11], bass: [0, 1, 3, 2], pad: true
    }
  };
  DUMusic.THEMES = THEMES;
  DUMusic.colour = (name) => (THEMES[name] || THEMES.park).colour;

  /* ---------- sequencer ----------
   * 32 steps = two 4/4 bars per loop. The chord moves once a bar and walks the
   * four-chord cycle over two loops, so a theme takes ~8s to repeat instead of
   * thudding through the same change every two seconds.
   */
  let barCount = 0;
  function schedule() {
    const c = ctx(); if (!c || !current) return;
    const spb = 60 / current.bpm / 4;              // one 16th note
    if (nextAt < c.currentTime) nextAt = c.currentTime + 0.05;   // a hidden tab must not spam
    // Muted: keep the clock honest but build no nodes, so a muted tablet does
    // not burn CPU on music nobody can hear, and does not burst when unmuted.
    if (!on()) { nextAt = c.currentTime + 0.05; return; }
    while (nextAt < c.currentTime + 0.22) {
      play(current, step, nextAt, spb);
      nextAt += spb;
      step = (step + 1) % 32;
      if (step === 0) barCount = (barCount + 1) % 4;
    }
  }
  function play(T, i, t, spb) {
    const ch = T.chords[(barCount * 2 + ((i / 16) | 0)) % T.chords.length];
    const beat = i % 8;
    if (T.pad && beat === 0) {
      for (const d of ch) {
        voice(t, hz(T, d, 0), spb * 9, 'triangle', 0.05 * T.vol * 4,
          { attack: 0.5, filter: 1400, pair: 1.005, send: 0.5 });
      }
    }
    if (T.bass && (beat === 0 || beat === 4 || (intensity > 0.6 && beat === 6))) {
      voice(t, hz(T, ch[T.bass[(i / 8 | 0) % T.bass.length] % 3], -1), spb * 3.2, 'sine', 0.2 * T.vol * 4, { attack: 0.008 });
    }
    if (T.pluck && intensity > 0.25 && beat % 2 === 0) {
      pluck(t, toneOf(T, ch, T.pluck, i, 1), 0.055 * T.vol * 4 * intensity, true);
    }
    const mel = T.bells[i];
    if (mel !== null && mel !== undefined && intensity > 0.12) {
      const peak = (0.11 + 0.09 * intensity) * T.vol * 4;
      voice(t, hz(T, mel, 1), 0.62, 'sine', peak, { attack: 0.004, send: 0.9, pair: 2.01 });
      if (intensity > 0.72) voice(t + spb * 0.5, hz(T, mel, 2), 0.3, 'sine', peak * 0.25, { send: 0.8 });
    }
    // A soft egg-timer tick so a fast world feels fast.
    if (T.bpm > 118 && beat === 2 && intensity > 0.5) {
      const c = ctx();
      const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      const len = Math.round(c.sampleRate * 0.05);
      const buf = c.createBuffer(1, len, c.sampleRate), dd = buf.getChannelData(0);
      for (let k = 0; k < len; k++) dd[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 6);
      src.buffer = buf; f.type = 'highpass'; f.frequency.value = 6200;
      g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(f); f.connect(g); g.connect(gainNode); src.start(t); src.stop(t + 0.06);
    }
  }

  function fade(to, time) {
    const c = ctx(); if (!c || !master) return;
    const t = c.currentTime;
    const audible = on() && !document.hidden ? to : 0.0001;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, audible), t + (time || 0.7));
  }

  function begin(name) {
    const T = THEMES[name]; if (!T || !build()) return;
    const c = ctx(); if (!c) return;
    const next = c.createGain();
    next.gain.value = 0.0001;
    next.connect(master);
    if (gainNode) {
      const old = gainNode, at = c.currentTime;
      old.gain.cancelScheduledValues(at);
      old.gain.setValueAtTime(Math.max(0.0001, old.gain.value), at);
      old.gain.exponentialRampToValueAtTime(0.0001, at + 0.8);
      setTimeout(() => { try { old.disconnect(); } catch (e) { } }, 1100);
    }
    gainNode = next;
    current = T;
    step = 0;
    barCount = 0;
    nextAt = c.currentTime + 0.08;
    DUMusic.theme = name;
    clearInterval(timer);
    timer = setInterval(schedule, 45);
    schedule();
    fade(T.vol * 3.4);
  }

  /* ---------- public API ---------- */
  DUMusic.play = function (name) {
    if (!name || !THEMES[name]) { DUMusic.stop(); return; }
    pending = name;
    if (!on()) return;
    if (current === THEMES[name] && timer) return;
    if (!started) {                                    // wait for a real gesture
      if (!ac) ctx();
      if (!ac || ac.state === 'suspended') { arm(); return; }
    }
    started = true;
    begin(name);
  };
  function arm() {
    const go = () => {
      const c = ctx();
      if (!c) return;
      c.resume().then(() => {
        ready = false; build(); ac = c;
        if (ready && pending && on()) { started = true; begin(pending); }
      }).catch(() => { });
      window.removeEventListener('pointerdown', go, true);
      window.removeEventListener('keydown', go, true);
      window.removeEventListener('touchend', go, true);
    };
    window.addEventListener('pointerdown', go, true);
    window.addEventListener('keydown', go, true);
    window.addEventListener('touchend', go, true);
  }
  DUMusic.stop = function () {
    pending = null;
    clearInterval(timer); timer = 0; current = null; DUMusic.theme = null;
    fade(0.0001, 0.45);
    const c = ctx();
    if (c && gainNode) { const old = gainNode; setTimeout(() => { try { old.disconnect(); } catch (e) { } }, 600); gainNode = null; }
  };
  DUMusic.pause = function () { fade(0.0001, 0.35); };
  DUMusic.resume = function () { if (current && on()) fade(current.vol * 3.4, 0.5); };
  DUMusic.enabled = function (flag) {
    if (flag) { if (pending && (!current || DUMusic.theme !== pending)) DUMusic.play(pending); else DUMusic.resume(); }
    else DUMusic.pause();
  };
  DUMusic.intensity = function (v) { intensity = Math.max(0, Math.min(1, Number(v) || 0)); };
  DUMusic.mood = function (kind) {
    if (!on() || !build()) return;
    const c = ctx(); if (!c) return;
    if (ac && ac.state === 'suspended') ac.resume().catch(() => { });
    const t = c.currentTime + 0.02;
    const bus = c.createGain(); bus.gain.value = 1; bus.connect(master); bus.connect(verb);
    const seq = {
      win: [523, 659, 784, 1047, 1319],
      star: [784, 1047, 1319],
      lose: [523, 440, 349, 262],
      hush: [1047, 784, 523],
      magic: [659, 880, 1175, 1568, 2093],
      find: [880, 1175, 1568]
    }[kind] || [659, 880];
    seq.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = kind === 'lose' ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(f, t + i * 0.085);
      g.gain.setValueAtTime(0.0001, t + i * 0.085);
      g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.085 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.085 + 0.55);
      o.connect(g); g.connect(bus); o.start(t + i * 0.085); o.stop(t + i * 0.085 + 0.6);
    });
    if (kind === 'win' || kind === 'magic') {
      for (let i = 0; i < 5; i++) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(1600 + i * 520, t + 0.34 + i * 0.05);
        g.gain.setValueAtTime(0.0001, t + 0.34 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.35 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8 + i * 0.05);
        o.connect(g); g.connect(verb); o.start(t + 0.34 + i * 0.05); o.stop(t + 0.9 + i * 0.05);
      }
    }
  };

  /* ---------- follow the app, not the pocket ---------- */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) fade(0.0001, 0.3);
    else if (current && on()) fade(current.vol * 3.4, 0.6);
  });
  if (FX) {
    // DUFX owns the single source of truth for the sound switch.
    const watch = setInterval(() => {
      if (!on()) fade(0.0001, 0.3);
      else if (current && !timer) DUMusic.play(pending || Object.keys(THEMES)[0]);
      else if (current && !document.hidden) fade(current.vol * 3.4, 0.6);
    }, 900);
    if (window.addEventListener) window.addEventListener('pagehide', () => clearInterval(watch));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { build(); }, { once: true });
  else build();
})();
