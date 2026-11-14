/* Dinosaur Universe — the recorded bank (DUAudio).
 *
 *   DUAudio.play('tap')                    a sample if one is ready, else false
 *   DUAudio.startMusic('park', destNode)   a seamless loop under a scene
 *   DUAudio.ambience('rain', destNode)     a world bed with weather in it
 *   DUAudio.stopMusic() / DUAudio.stopAmbience()
 *   DUAudio.ready                          resolves with the index, or null
 *
 * fx/du-fx.js and fx/du-music.js still synthesise every sound they always did.
 * This file only ever *replaces* a synthesised sound with its recorded version,
 * and it hands control straight back whenever a file is missing, undecodable
 * or simply has not arrived yet. A first visit on a bad network therefore
 * sounds exactly the way it used to; a second visit does not.
 *
 * The bank is rendered by tools/build-audio.py from the same note tables the
 * synthesizers use, which is why the recorded park theme is the park theme
 * rather than a different tune with the same name.
 */
(function () {
  'use strict';
  if (window.DUAudio && window.DUAudio.play) return;
  const DUAudio = window.DUAudio = {};

  /* ---------- where the app lives, worked out from this page's own URL ---------- */
  function root() {
    const p = location.pathname;
    const i = p.indexOf('/chapters/');
    const dir = i >= 0 ? p.slice(0, i + 1) : p.replace(/[^/]*$/, '');
    return location.origin + dir;
  }
  const BASE = root() + 'assets/audio/';

  let ac = null, index = null, live = 0;
  let out = null, sfxBus = null, musicBus = null, ambBus = null;
  let music = null, amb = null, wantAmb = null;
  const bufs = new Map(), loading = new Map(), broken = new Set(), lastAt = new Map();

  DUAudio.levels = { sfx: 1, music: 1, ambience: 0.85 };

  function ctx() {
    if (ac) return ac;
    const FX = window.DUFX;
    ac = (FX && FX.audioCtx) ? FX.audioCtx() : null;
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume().catch(() => { });
    return ac;
  }

  function buses() {
    const c = ctx();
    if (!c) return null;
    if (out) return c;
    out = c.createGain(); out.gain.value = 1;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 18; comp.ratio.value = 2.6;
    comp.attack.value = 0.004; comp.release.value = 0.25;
    out.connect(comp); comp.connect(c.destination);
    sfxBus = c.createGain(); sfxBus.gain.value = DUAudio.levels.sfx; sfxBus.connect(out);
    musicBus = c.createGain(); musicBus.gain.value = DUAudio.levels.music; musicBus.connect(out);
    ambBus = c.createGain(); ambBus.gain.value = DUAudio.levels.ambience; ambBus.connect(out);
    return c;
  }

  DUAudio.bus = function (kind) {
    if (!buses()) return null;
    return kind === 'music' ? musicBus : kind === 'ambience' ? ambBus : sfxBus;
  };

  /* The parent's sound switch. Gating the next sound is not muting: the bed
   * that started on the first frame is still running, so a grown-up who presses
   * mute during the opening keeps hearing the wind. Everything in this context
   * passes through `out`, so that one gain is pulled down, and the rest of the
   * app is told through an event so the spoken lines stop mid-sentence.
   *
   * Nothing is built here on purpose. A page that has not made a sound yet has
   * nothing to silence, and creating a context just to mute it is how a browser
   * ends up logging an autoplay warning on a game that is perfectly quiet. */
  let muted = false;
  DUAudio.mute = function (on) {
    muted = !!on;
    if (ac && out) {
      const t = ac.currentTime;
      try {
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t);
        out.gain.linearRampToValueAtTime(muted ? 0.0001 : 1, t + 0.3);
      } catch (e) { out.gain.value = muted ? 0.0001 : 1; }
    }
    const M = window.DUMusic;
    // The synth keeps its own level, and its resume() refuses to come back while
    // the switch is still off, so the settings have to be written before this.
    if (M && typeof M[muted ? 'pause' : 'resume'] === 'function') { (muted ? M.pause : M.resume).call(M); }
    if (!muted && !amb && wantAmb) DUAudio.ambience(wantAmb);
    document.dispatchEvent(new CustomEvent('du-mute', { detail: { muted } }));
    return muted;
  };
  DUAudio.isMuted = () => muted;

  /* A game that already owns an AudioContext should not have to share a page
   * with a second one: two contexts is two clock domains, and the sound the
   * child hears is the one that lost. Adopting theirs also re-decodes what the
   * old context made, since a buffer belongs to the context that created it. */
  DUAudio.useContext = function (c) {
    if (!c || c === ac) return false;
    const old = ac;
    // Only a context this file made itself is ours to close: if anything has
    // already been routed through it, the game owning the new one is not the
    // place to cut a live graph off from its output.
    const mine = !!old && old !== c && !out && !music && !amb;
    ac = c; out = null; sfxBus = musicBus = ambBus = null;
    if (mine) { try { if (old.close) old.close(); } catch (e) { } }
    bufs.clear(); loading.clear();
    if (index) prefetch();
    return true;
  };

  /* ---------- the index ---------- */
  DUAudio.ready = fetch(BASE + 'index.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { index = j; if (j) prefetch(); return j; })
    .catch(() => null);

  /* An answer for a scene that asked first and was told no. A theme is usually
   * chosen within the first second of a page, long before a 400 KB loop has
   * arrived, so "not yet" has to mean "hand it over the moment it lands" or a
   * first visit plays the synthesiser for the whole session. The callback is
   * the scene's decision, not this file's: only it knows whether it still wants
   * this theme. */
  DUAudio.whenReady = function (name, pool, cb) {
    const go = () => {
      const e = entry(name, pool);
      if (!e) { cb(false); return; }
      if (bufs.has(e.file)) { cb(true); return; }
      load(e.file).then((b) => cb(!!b));
    };
    if (index) go(); else DUAudio.ready.then(go, go);
  };

  function entry(name, pool) {
    if (!index) return null;
    let n = String(name);
    if (pool !== 'music' && pool !== 'ambience' && index.alias && index.alias[n]) n = index.alias[n];
    const src = pool === 'music' ? index.music : pool === 'ambience' ? index.ambient : index.sfx;
    const e = src && src[n];
    if (!e) return null;
    if (pool === 'music' || pool === 'ambience') return { key: pool + '/' + n, file: e.file, files: [e.file] };
    const files = e.files && e.files.length ? e.files : [];
    if (!files.length) return null;
    // Prefer a variant that is already decoded. Picking one of three at random
    // misses two thirds of the time while the cache is still filling, and a miss
    // is an oscillator where the game asked for a recording. Once the page has
    // been open a moment all three are usually ready and the variety stays.
    const ready = files.filter((f) => bufs.has(f));
    const pickFrom = ready.length ? ready : files;
    return { key: n, file: pickFrom[(Math.random() * pickFrom.length) | 0], files: files };
  }

  function load(file) {
    if (bufs.has(file)) return Promise.resolve(bufs.get(file));
    if (broken.has(file)) return Promise.resolve(null);
    if (loading.has(file)) return loading.get(file);
    const url = BASE + String(file).replace(/^\.\//, '').replace(/^assets\/audio\//, '');
    const p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('http ' + r.status))))
      .then((ab) => new Promise((res) => {
        const c = ctx();
        if (!c) return res(null);
        let settled = false;
        const done = (b) => { if (!settled) { settled = true; res(b || null); } };
        try {
          const maybe = c.decodeAudioData(ab, done, () => done(null));
          if (maybe && maybe.then) maybe.then((b) => done(b), () => done(null));
        } catch (e) { done(null); }
      }))
      .then((buf) => {
        loading.delete(file);
        if (!buf || !buf.length || !buf.sampleRate) { broken.add(file); return null; }
        const b = trimHead(buf);
        bufs.set(file, b);
        return b;
      })
      .catch(() => { loading.delete(file); broken.add(file); return null; });
    loading.set(file, p);
    return p;
  }

  /* LAME delays every file by about 26 ms and pads the end of it. Left in, that
   * silence is what a child feels as lag between a tap and its sound. Only the
   * head is trimmed: on a loop the tail is part of the period. */
  function trimHead(buf) {
    const d0 = buf.getChannelData(0);
    const cap = Math.min(d0.length - 1, Math.round(0.044 * buf.sampleRate));
    let i = 0;
    while (i < cap && Math.abs(d0[i]) < 0.0009) i++;
    if (i < 8) return buf;
    const c = ctx();
    if (!c) return buf;
    const nb = c.createBuffer(buf.numberOfChannels, buf.length - i, buf.sampleRate);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      nb.copyToChannel(buf.getChannelData(ch).subarray(i), ch);
    }
    return nb;
  }

  function grab(e) { return e ? (bufs.get(e.file) || null) : null; }
  function touch(e) {
    if (!e) return;
    // Warm every variant of the name, not just the one just missed: a game that
    // asks for a coin once will ask for it again within the minute, and the
    // three takes are what stops a repeated sound from being the same file.
    for (const f of (e.files || [e.file])) {
      if (!bufs.has(f) && !broken.has(f)) load(f);
    }
  }

  /* The names the collection fires most, decoded as soon as the index lands,
   * so the first correct answer in the first game is already a recording.
   * Nothing is played here — a bank that warms itself up by making a sound in
   * a room where nobody has asked for one is a bug, not a feature. */
  function prefetch() {
    const first = ['tap', 'pop', 'sparkle', 'whoosh', 'win', 'chirp', 'roar',
      'star', 'coin', 'thud', 'good', 'bad', 'jump', 'splash', 'drum-1',
      'note-00', 'note-04', 'note-07', 'stinger-win', 'stinger-lose'];
    first.forEach((n) => touch(entry(n)));
  }

  /* ---------- one-shots ---------- */
  const MAX_VOICES = 36;

  DUAudio.play = function (name, o) {
    o = o || {};
    const FX = window.DUFX;
    if (FX && FX.settings && FX.settings.sound === false) return false;
    if (!index) return false;
    const e = entry(name, o.pool || 'sfx');
    if (!e) return false;
    const buf = grab(e);
    if (!buf) { touch(e); return false; }
    const c = ctx();
    if (!c || c.state !== 'running') return false;
    const dest = o.dest || DUAudio.bus('sfx');
    if (!dest) return false;
    const t = c.currentTime + (o.at || 0);
    const gap = o.gap === undefined ? 0.02 : o.gap;
    const prev = lastAt.get(e.key);
    // The same sound eight times inside a frame is a stutter, not a flourish:
    // swallow it, but report it as handled so the oscillator does not double it.
    if (prev !== undefined && t - prev < gap) return true;
    lastAt.set(e.key, t);
    if (live > MAX_VOICES) return true;
    const rate = o.rate || (o.jitter === false ? 1 : 1 + (Math.random() * 2 - 1) * 0.018);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.max(0.5, Math.min(2, rate));
    const g = c.createGain();
    g.gain.value = o.gain === undefined ? 1 : o.gain;
    let tail = src;
    if (buf.numberOfChannels > 1 && c.createStereoPanner) {
      const pan = c.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1,
        o.pan === undefined ? (Math.random() * 2 - 1) * 0.34 : o.pan));
      src.connect(pan); tail = pan;
    }
    tail.connect(g); g.connect(dest);
    live++;
    src.onended = () => {
      live = Math.max(0, live - 1);
      try { src.disconnect(); g.disconnect(); if (tail !== src) tail.disconnect(); } catch (e2) { }
    };
    src.start(t);
    src.stop(t + buf.duration / rate + 0.4);
    if (o.duck) duck((o.duck + 1) * 0.35);
    return true;
  };

  /* A stinger over a theme: the score gives a little way for a second, which
   * is what keeps a win sound from arriving as one indistinct crash. */
  function duck(amount) {
    if (!ac || !music) return;
    const t = ac.currentTime, base = music.outer.gain.value;
    music.outer.gain.cancelScheduledValues(t);
    music.outer.gain.setValueAtTime(Math.max(0.0001, base), t);
    music.outer.gain.linearRampToValueAtTime(Math.max(0.02, base * (1 - amount)), t + 0.06);
    music.outer.gain.linearRampToValueAtTime(base, t + 1.1);
  }

  /* ---------- a looping bed: score or world ---------- */
  function looper(name, pool, dest, o) {
    o = o || {};
    const FX = window.DUFX;
    if (FX && FX.settings && FX.settings.sound === false) return null;
    const e = entry(name, pool);
    if (!e) return null;
    const buf = grab(e);
    if (!buf) { touch(e); return null; }
    const c = ctx();
    if (!c) return null;
    const outer = c.createGain();
    // A neutral stage whose only job is to be pulled down for a moment; the
    // level the child set lives on the bus, so a duck cannot overwrite it.
    outer.gain.value = 1;
    outer.connect(dest || DUAudio.bus(pool));
    const g = c.createGain();
    g.gain.value = 0.0001;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.3;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = buf.duration;
    src.connect(lp); lp.connect(g); g.connect(outer);
    const t = c.currentTime + 0.02;
    const target = Math.max(0.05, o.gain === undefined ? 1 : o.gain);
    src.start(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(target, t + (o.fade || 1.2));
    return { src, g, lp, outer, name, level: target };
  }

  function stopLoops(which, fade) {
    const m = which === 'music' ? music : amb;
    if (!m) return;
    if (which === 'music') music = null; else amb = null;
    const t = ac.currentTime, f = fade === undefined ? 0.6 : fade;
    try {
      m.g.gain.cancelScheduledValues(t);
      m.g.gain.setValueAtTime(Math.max(0.0001, m.g.gain.value), t);
      m.g.gain.linearRampToValueAtTime(0.0001, t + f);
      setTimeout(() => {
        try { m.src.stop(); m.src.disconnect(); m.lp.disconnect(); m.g.disconnect(); m.outer.disconnect(); }
        catch (e) { }
      }, (f + 0.2) * 1000);
    } catch (e) { }
  }

  function restoreAmbience() {
    if (amb && ac) {
      try { amb.outer.gain.linearRampToValueAtTime(1, ac.currentTime + 2.0); } catch (e) { }
    }
  }

  DUAudio.startMusic = function (name, dest) {
    if (!index) return false;
    const p = looper(name, 'music', dest, { fade: 0.9 });
    if (!p) return false;
    stopLoops('music', 1.1);
    music = p;
    // Weather under a tune, not beside it.
    if (amb) amb.outer.gain.linearRampToValueAtTime(0.55, ac.currentTime + 2.0);
    return true;
  };
  DUAudio.stopMusic = function (f) { stopLoops('music', f === undefined ? 0.5 : f); restoreAmbience(); };
  DUAudio.musicTheme = () => (music ? music.name : null);

  /* The recorded loop is one finished mix, so DUMusic's "add layers as the
   * level gets busy" has to become a filter and a level instead of extra
   * oscillators. Thin at 0, full at 1. */
  DUAudio.musicIntensity = function (v) {
    if (!music || !ac) return;
    const x = Math.max(0, Math.min(1, Number(v) || 0));
    const t = ac.currentTime;
    try {
      music.lp.frequency.linearRampToValueAtTime(3000 + 15000 * x, t + 0.8);
      music.g.gain.linearRampToValueAtTime(music.level * (0.62 + 0.38 * x), t + 0.8);
    } catch (e) { }
  };

  DUAudio.ambience = function (name, dest) {
    if (!name) { wantAmb = null; stopLoops('ambience', 1.0); return true; }
    wantAmb = name;
    if (amb && amb.name === name) return true;
    const start = () => {
      const p = looper(name, 'ambience', dest || DUAudio.bus('ambience'), { fade: 2.4, gain: 1 });
      if (!p) return false;
      stopLoops('ambience', 1.4);
      amb = p;
      return true;
    };
    if (start()) return true;
    // Weather beds are 400 KB of rain; a scene that names one on the first
    // frame would otherwise never hear it. The want is a name, not a promise,
    // so the most recent request is the only one that can still start.
    DUAudio.whenReady(name, 'ambience', (ok) => {
      if (ok && wantAmb === name && (!amb || amb.name !== name)) start();
    });
    return false;
  };
  DUAudio.stopAmbience = function (f) { stopLoops('ambience', f); };

  /* ---------- levels, from the parent's settings message ---------- */
  DUAudio.setLevel = function (kind, v) {
    if (!(kind in DUAudio.levels)) return;
    DUAudio.levels[kind] = Math.max(0, Math.min(1.5, Number(v) || 0));
    const bus = DUAudio.bus(kind === 'music' ? 'music' : kind === 'ambience' ? 'ambience' : 'sfx');
    if (!bus || !ac) return;
    try { bus.gain.linearRampToValueAtTime(DUAudio.levels[kind], ac.currentTime + 0.25); }
    catch (e) { bus.gain.value = DUAudio.levels[kind]; }
  };
  window.addEventListener('message', (ev) => {
    const d = ev.data;
    if (!d || d.type !== 'du-settings' || ev.origin !== location.origin) return;
    if (typeof d.musicLevel === 'number') DUAudio.setLevel('music', d.musicLevel);
    if (typeof d.ambienceLevel === 'number') DUAudio.setLevel('ambience', d.ambienceLevel);
    // Pulled down rather than stopped: a bed that was stopped cannot be
    // restarted by unmuting, and a child expects the world to be where they
    // left it.
    if (typeof d.sound === 'boolean') DUAudio.mute(!d.sound);
  });

  /* ---------- taking over from the synthesizers ---------- */
  const RESOLVE = {
    note: (i) => 'note-' + String(((((Number(i) || 0) % 12) + 12) % 12)).padStart(2, '0'),
    drum: (n) => 'drum-' + Math.max(1, Math.min(4, (Number(n) || 0) + 1)),
  };

  function bindDUFX() {
    const FX = window.DUFX;
    if (!FX || !FX.sfx || FX.sfx.__banked) return;
    Object.keys(FX.sfx).forEach((key) => {
      const orig = FX.sfx[key];
      if (typeof orig !== 'function') return;
      FX.sfx[key] = function (a, b) {
        const name = RESOLVE[key] ? RESOLVE[key](a) : key;
        const pitched = !!RESOLVE[key];
        if (DUAudio.play(name, { jitter: !pitched })) return;
        return orig.call(FX.sfx, a, b);
      };
      FX.sfx[key].fallback = orig;
    });
    FX.sfx.__banked = true;
  }

  function bindDUMusic() {
    const M = window.DUMusic;
    if (!M || M.__banked) return;
    M.__banked = true;
    if (typeof M.mood === 'function') {
      const mood = M.mood;
      M.mood = function (kind) {
        if (DUAudio.play('stinger-' + kind, { gap: 0.2, pool: 'sfx' })) { duck(0.4); return; }
        return mood.apply(M, arguments);
      };
    }
    if (typeof M.intensity === 'function') {
      const intensity = M.intensity;
      M.intensity = function (v) { intensity.apply(M, arguments); DUAudio.musicIntensity(v); };
    }
    if (typeof M.stop === 'function') {
      const stop = M.stop;
      M.stop = function () { DUAudio.stopMusic(0.45); return stop.apply(M, arguments); };
    }
  }

  function bindAmbient() {
    const FX = window.DUFX;
    if (!FX || typeof FX.ambient !== 'function' || FX.ambient.__banked) return;
    const orig = FX.ambient;
    FX.ambient = function (name, o) {
      const drew = orig.apply(FX, arguments);
      DUAudio.ambience(name);
      return drew;
    };
    FX.ambient.__banked = true;
  }

  DUAudio.bind = function () { bindDUFX(); bindDUMusic(); bindAmbient(); };

  DUAudio.status = () => ({
    index: !!index,
    decoded: bufs.size,
    broken: Array.from(broken),
    voices: live,
    music: music && music.name,
    ambience: amb && amb.name,
    levels: DUAudio.levels
  });

  /* du-fx.js and du-music.js are ordinary scripts and are nearly always
   * already here; arcade's engine.js is a module that defines its audio class
   * later, so bind again on the two moments that can only mean "everything is
   * loaded now". */
  DUAudio.bind();
  if (document.readyState === 'complete') setTimeout(DUAudio.bind, 0);
  else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(DUAudio.bind, 0));
    window.addEventListener('load', () => setTimeout(DUAudio.bind, 0));
  }
})();
