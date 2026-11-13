/* Dinosaur Universe — the opening cinematic (DUINTRO).
 *
 * The collection already tells a story once you are inside it (DUSTORY), but a
 * child arriving for the first time was handed a grid of cards. This is the
 * other opening: ninety seconds of a living valley, spoken out loud, that
 * shows what this universe is before asking anyone to choose anything.
 *
 *   DUINTRO.play({ onDone })   run it (poster first, so audio may unlock)
 *   DUINTRO.needs()            true until the opening has been watched once
 *   DUINTRO.watched()          the flag alone
 *
 * Three rules hold it together:
 *  - Nothing is required. Every asset that fails to arrive degrades into a
 *    still frame or straight into the hub; a missing file must never be a
 *    black screen or a stuck child.
 *  - The plates are photographs, so the movement comes from what is drawn on
 *    top of them: mist that drifts at three speeds, a herd that actually puts
 *    one foot in front of the other, and a camera that never stops breathing.
 *  - Narration is a real voice, rendered once at build time by
 *    tools/build-intro-audio.py, so nothing here needs a network or a key.
 */
(function () {
  'use strict';
  if (window.DUINTRO && window.DUINTRO.play) return;

  // document.currentScript is only set while this file is being read, so the
  // base URLs have to be captured now — the roar is fetched long afterwards.
  const HERE = (document.currentScript && document.currentScript.src) || location.href;
  const BASE = new URL('../assets/cinema/', HERE).href;
  const ROAR = new URL('../assets/rex/rex-roar.mp3', HERE).href;
  const FX = () => window.DUFX;

  const TAIL = 1.0;          // seconds of held shot after each spoken line
  const CROSSFADE = 0.75;    // seconds between plates

  /* ---------------------------------------------------------------- the art
   * A scene is one photograph plus the layers that make it move. Positions are
   * fractions of the plate, so a scene survives any viewport; sizes are
   * fractions of the plate width for the same reason.
   */
  const SCENES = {
    'star-seeds': {
      plate: 'star-seeds',
      camera: { zoom: [1.04, 1.14], pan: [[0.52, 0.52], [0.44, 0.57]] },
      grade: { tint: '#0b1a33', amount: 0.14, vignette: 0.52 },
      layers: [
        { type: 'twinkle', n: 150, seed: 7 },
        // the seeds themselves are in the photograph; these pulses are what
        // make a still light look like it is falling
        { type: 'glow', seed: 3, points: [[0.875, 0.115], [0.775, 0.255], [0.648, 0.405], [0.562, 0.515], [0.516, 0.585], [0.478, 0.645]], colour: '255,214,150', r: 0.055, pulse: 0.55, rate: 0.7 },
        { type: 'motes', n: 40, colour: '200,225,255', speed: 0.014, size: [0.4, 1.4], seed: 11 },
        { type: 'mist', seed: 5, bands: [{ y: 0.70, h: 0.13, a: 0.13, s: 0.008 }, { y: 0.79, h: 0.15, a: 0.17, s: -0.005 }] }
      ]
    },
    'valley-dawn': {
      plate: 'valley-dawn',
      camera: { zoom: [1.02, 1.16], pan: [[0.5, 0.52], [0.46, 0.58]] },
      grade: { tint: '#ffcf8a', amount: 0.07, vignette: 0.42 },
      layers: [
        { type: 'rays', seed: 2, at: [0.705, 0.245], colour: '255,226,170', n: 9, len: 1.25, spread: 0.5, pulse: 0.22 },
        { type: 'mist', seed: 9, bands: [{ y: 0.44, h: 0.10, a: 0.11, s: 0.006 }, { y: 0.56, h: 0.13, a: 0.14, s: -0.009 }, { y: 0.70, h: 0.15, a: 0.17, s: 0.012 }] },
        { type: 'flyers', seed: 4, n: 5, art: 'ptero', band: [0.16, 0.34], size: [0.03, 0.05], speed: [0.02, 0.045] },
        // this plate is a view from the rim, so the herd belongs on the valley
        // floor: small, hazed, and standing in the mist the photograph already
        // has rather than on treetops that would show them floating
        { type: 'herd', seed: 6, sprites: [
          { art: 'diplodocus', at: [0.63, 0.565], w: 0.040, depth: 0.22, dir: 1, speed: 0.004, bob: 0.004 },
          { art: 'mamenchisaurus', at: [0.40, 0.585], w: 0.042, depth: 0.24, dir: 1, speed: 0.004, bob: 0.004 },
          { art: 'parasaurolophus', at: [0.52, 0.625], w: 0.034, depth: 0.28, dir: -1, speed: 0.005, bob: 0.004 },
          { art: ['brachiosaurus', 'brachiosaurus-step'], at: [0.30, 0.715], w: 0.095, depth: 0.72, dir: 1, speed: 0.008, bob: 0.007, stride: 1.2 },
          { art: ['brachiosaurus', 'brachiosaurus-step'], at: [0.47, 0.755], w: 0.125, depth: 0.86, dir: 1, speed: 0.010, bob: 0.009, stride: 1.35, phase: 0.45 }
        ] },
        { type: 'mist', seed: 12, bands: [{ y: 0.90, h: 0.20, a: 0.13, s: 0.017 }] }
      ]
    },
    'rex-mist': {
      plate: 'rex-mist',
      // the plate is cover-fit to the window, so on tall or narrow screens it is
      // taller than the window and any pan below 1 crops the top: pin the top edge
      camera: { zoom: [1.05, 1.17], pan: [[0.56, 1.0], [0.60, 1.0]] },
      grade: { tint: '#ffd9a8', amount: 0.06, vignette: 0.46 },
      layers: [
        { type: 'rays', seed: 1, at: [0.115, 0.175], colour: '255,232,190', n: 7, len: 1.1, spread: 0.42, pulse: 0.18 },
        { type: 'mist', seed: 8, bands: [{ y: 0.52, h: 0.16, a: 0.20, s: 0.010 }, { y: 0.66, h: 0.20, a: 0.26, s: -0.014 }, { y: 0.82, h: 0.22, a: 0.30, s: 0.019 }] },
        // the nostril is the only place a photograph cannot move, so the
        // breath is drawn there and nobody notices the rest is still
        { type: 'breath', seed: 13, at: [0.452, 0.238], rate: 3.4, life: 3.2, rise: 0.05, colour: '245,248,252', max: 0.16 },
        { type: 'motes', n: 34, colour: '255,240,215', speed: 0.010, size: [0.5, 1.8], seed: 15 }
      ]
    },
    'lagoon-home': {
      plate: 'lagoon-home',
      camera: { zoom: [1.03, 1.13], pan: [[0.44, 0.52], [0.56, 0.57]] },
      grade: { tint: '#bfe9ff', amount: 0.05, vignette: 0.38 },
      layers: [
        { type: 'shimmer', seed: 16, at: [0.06, 0.55, 0.94, 0.45], colour: '255,255,255', n: 90 },
        { type: 'rays', seed: 3, at: [0.06, 0.06], colour: '255,246,214', n: 6, len: 1.0, spread: 0.5, pulse: 0.2 },
        { type: 'mist', seed: 10, bands: [{ y: 0.40, h: 0.10, a: 0.10, s: -0.007 }, { y: 0.60, h: 0.12, a: 0.12, s: 0.009 }] },
        { type: 'flyers', seed: 5, n: 3, art: 'ptero', band: [0.10, 0.24], size: [0.03, 0.05], speed: [0.025, 0.05] },
        // the lagoon's own ground: a sand bar across the middle, open water
        // below it, boulders on the right. Feet go on those lines and wading
        // animals give the water something to give back.
        { type: 'herd', seed: 7, sprites: [
          { art: 'stego', at: [0.21, 0.515], w: 0.07, depth: 0.46, dir: 1, speed: 0.005, bob: 0.005 },
          { art: 'parasaurolophus', at: [0.44, 0.47], w: 0.06, depth: 0.52, dir: -1, speed: 0.006, bob: 0.005 },
          { art: ['brachiosaurus', 'brachiosaurus-step'], at: [0.31, 0.555], w: 0.14, depth: 0.74, dir: 1, speed: 0.008, bob: 0.008, stride: 1.2, reflect: true },
          { art: 'trex', at: [0.52, 0.535], w: 0.115, depth: 0.88, dir: -1, speed: 0.006, bob: 0.006 },
          { art: 'tricera', at: [0.66, 0.655], w: 0.085, depth: 0.8, dir: -1, speed: 0.007, bob: 0.006, reflect: true }
        ] },
        { type: 'motes', n: 46, colour: '255,255,235', speed: 0.016, size: [0.5, 2.0], seed: 17 }
      ]
    }
  };

  /* ---------------------------------------------------------------- asset load
   * The world itself — plates, sprites, layers and the camera — lives in
   * DUWORLD (fx/du-world.js) so the chapter cutscenes run on the same engine as
   * this. Only the voice-over is the opening's own.
   */
  const WORLD = window.DUWORLD;
  const audio = new Map();    // beat id -> Audio

  function loadBeatAudio(id) {
    if (audio.has(id)) return audio.get(id);
    const a = new Audio(BASE + 'voice/' + id + '.mp3');
    a.preload = 'auto';
    audio.set(id, a);
    return a;
  }

  /* ------------------------------------------------------------------ player
   * One canvas for the photographs and their layers, one DOM layer for words
   * and buttons, because text drawn into a canvas is text a screen reader
   * cannot read and a small child cannot rely on.
   */
  let root = null, state = null, raf = 0;

  function mount() {
    root = document.createElement('div');
    root.className = 'du-intro';
    // The update pill sits at the top of the stacking order on purpose, so it
    // is taken out of the page rather than out-z-indexed.
    document.body.classList.add('du-cinema');
    root.innerHTML =
      '<canvas class="du-intro-canvas"></canvas>' +
      '<div class="du-intro-bars"><i></i><i></i></div>' +
      '<div class="du-intro-ui">' +
        '<button id="introSkip" class="du-intro-skip">Skip the story ›</button>' +
        '<div class="du-intro-caption"><b id="introWho"></b><p id="introLine"></p></div>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function unmount() {
    cancelAnimationFrame(raf);
    stopAll();
    document.body.classList.remove('du-cinema');
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    state = null;
  }

  function stopAll() {
    for (const a of audio.values()) { try { a.pause(); a.currentTime = 0; } catch (e) { /* already stopped */ } }
    if (state && state.roar) { try { state.roar.pause(); } catch (e) { } }
  }

  const spoken = () => FX() && FX().settings && FX().settings.sound;

  function speakLine(beat) {
    if (!spoken()) return;
    const a = loadBeatAudio(beat.id);
    try { a.currentTime = 0; } catch (e) { }
    a.volume = 0.95;
    a.onended = () => { if (window.DUMusic && window.DUMusic.unduck) window.DUMusic.unduck(); };
    if (window.DUMusic && window.DUMusic.duck) window.DUMusic.duck(0.2);
    const p = a.play();
    if (p && p.catch) p.catch(() => { /* blocked or still decoding; captions carry on */ });
    state.audio = a;
  }

  function captionText(beat) {
    const who = root.querySelector('#introWho');
    const line = root.querySelector('#introLine');
    who.textContent = beat.speaker === 'rex' ? 'REX' : '';
    who.style.display = beat.speaker === 'rex' ? '' : 'none';
    line.textContent = beat.text;
    line.dataset.text = beat.text;
  }

  /* Words light up as the voice says them. The caption is spelled from the
   * script, not from the voice service, so a full stop survives; the timings
   * arrive one word per spoken word and are matched by index. If the counts
   * ever disagree the line is simply shown whole — a slightly early subtitle
   * is better than one that highlights the wrong word.
   */
  function buildTokens(beat, timing) {
    const raw = String(beat.text).trim().split(/\s+/);
    if (!timing || !Array.isArray(timing.words) || timing.words.length !== raw.length) return null;
    return raw.map((w, i) => ({ w, t: timing.words[i].t, d: timing.words[i].d }));
  }

  /* What this caption line was last told to show. The DOM is not the place to
   * ask: the object layer swaps a glyph in the line for its photograph, and
   * comparing against textContent would then "repair" the line back to the
   * glyph on every frame of the film. */
  let captionShown = null;

  function paintCaption(t) {
    const line = root && root.querySelector('#introLine');
    if (!line) return;
    const words = state.tokens;
    if (!words || !spoken()) {
      if (line.dataset.text !== captionShown) { line.textContent = line.dataset.text; captionShown = line.dataset.text; }
      return;
    }
    let html = '';
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const done = t >= w.t + w.d;
      const now = !done && t >= w.t;
      html += '<span' + (done ? ' class="said"' : now ? ' class="now"' : ' class="todo"') + '>' + esc(w.w) + '</span> ';
    }
    if (line.innerHTML !== html) line.innerHTML = html;
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function sizeCanvas() {
    const c = root.querySelector('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(window.innerWidth * dpr), h = Math.round(window.innerHeight * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return { c, ctx: c.getContext('2d'), W: w, H: h };
  }

  function loop() {
    if (!state) return;
    raf = requestAnimationFrame(loop);
    const { ctx, W, H } = sizeCanvas();
    const beat = state.script.beats[state.i];
    const scene = SCENES[beat.scene] || SCENES['valley-dawn'];
    state.elapsed += 1 / 60;

    // camera runs on the whole shot, so a longer line is a slower push
    const k = Math.min(1, state.elapsed / Math.max(1, state.dur));
    const reduce = FX() && FX().settings && FX().settings.reduce;
    WORLD.paint(ctx, { scene, layers: state.layers, time: state.time, k, W, H, reduce });
    state.time += reduce ? 0 : 1 / 60;
    // Words follow the voice itself, not the clock, so a line that took a
    // moment to start decoding does not leave the captions a sentence behind.
    const a = state.audio;
    paintCaption(a && !a.paused && a.currentTime > 0.02 ? a.currentTime : state.elapsed);

    if (state.elapsed >= state.dur) next();
  }

  function startBeat(i) {
    const beat = state.script.beats[i];
    const scene = SCENES[beat.scene] || SCENES['valley-dawn'];
    state.i = i;
    state.elapsed = 0;
    state.layers = WORLD.make(scene, 1 + i * 3);
    const timing = (state.timings && state.timings.beats) ? state.timings.beats[beat.id] : null;
    state.tokens = buildTokens(beat, timing);
    const voice = spoken() ? (timing ? timing.duration : 0) : 0;
    state.dur = Math.max(3.2, voice + TAIL);
    captionText(beat);
    music(THEME[beat.scene] || 'intro');
    speakLine(beat);
    if (beat.id === 'b06' || beat.id === 'b07') roar();
    if (beat.id === 'b11') sneeze();
  }

  function next() {
    if (!state) return;
    if (state.audio) { try { state.audio.pause(); } catch (e) { } }
    if (state.i + 1 >= state.script.beats.length) return finish();
    startBeat(state.i + 1);
  }

  function roar() {
    if (!spoken()) return;
    const a = new Audio(ROAR);
    a.volume = FX() && FX().settings.calm ? 0.5 : 0.85;
    a.play().catch(() => { });
    state.roar = a;
    root.classList.add('shake');
    setTimeout(() => root && root.classList.remove('shake'), 700);
  }

  // Grumblecloud's sneeze is the one sound the collection has no sample of,
  // so it is made from the synth every game already uses.
  function sneeze() {
    const s = FX() && FX().sfx;
    if (!spoken() || !s) return;
    setTimeout(() => { s.boing && s.boing(); }, 300);
    setTimeout(() => { s.thud && s.thud(); }, 620);
  }

  function finish() {
    const cb = state && state.onDone;
    const seen = state && state.markSeen;
    unmount();
    if (seen) seen();
    if (cb) cb();
  }

  /* ------------------------------------------------------------ the poster
   * Browsers will not let a page make sound until a child has touched it, so
   * the opening starts on a title card. That is also how films begin: a name,
   * then the first light.
   */
  function poster(script, timings, opts) {
    mount();
    const holder = root;
    holder.classList.add('du-intro-poster');
    /* state is normally made by begin(), but a child who taps "Not now" never
     * reaches begin() — and finish() reads the callback out of state, so without
     * this the title card swallows the hand-off and the child is never asked
     * their name, which the hub only ever asks once. */
    state = { script, timings, i: 0, time: 0, elapsed: 0, dur: 0, layers: null, onDone: opts.onDone, markSeen: opts.markSeen, audio: null, tokens: null };
    const canvas = holder.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    /* The title card is the first image of the universe a child sees, so it is
     * the real valley with its mist and its herd still moving behind the type —
     * not a photograph pinned to a screen. A heavier grade keeps the white title
     * readable, and the camera breathes instead of pushing. */
    const scene = Object.assign({}, SCENES['valley-dawn'], { grade: { tint: '#ffcf8a', amount: 0.05, vignette: 0.72 } });
    const layers = WORLD.make(scene, 2);
    let t = 0;
    const still = () => {
      const { W, H } = sizeCanvas();
      t += 1 / 60;
      const breathe = 1.05 + Math.sin(t * 0.12) * 0.012;
      scene.camera = { zoom: [breathe, breathe], pan: [[0.5, 0.52], [0.5, 0.52]] };
      WORLD.paint(ctx, { scene, layers, time: t, k: 0, W, H, reduce: FX() && FX().settings && FX().settings.reduce });
      if (!holder.classList.contains('du-intro-poster')) return;
      raf = requestAnimationFrame(still);
    };
    raf = requestAnimationFrame(still);

    const ui = holder.querySelector('.du-intro-ui');
    ui.innerHTML =
      '<div class="du-intro-title"><span class="du-intro-kicker">THE DINOSAUR UNIVERSE PRESENTS</span>' +
      '<h1>' + esc(script.title || 'The First Morning') + '</h1>' +
      '<p>' + esc(script.subtitle || '') + '</p>' +
      '<button id="introBegin">Begin the story ▶</button>' +
      '<button id="introPass" class="du-intro-quiet">Not now ›</button></div>';
    const begin = () => {
      cancelAnimationFrame(raf);
      holder.classList.remove('du-intro-poster');
      holder.querySelector('.du-intro-ui').innerHTML =
        '<button id="introSkip" class="du-intro-skip">Skip the story ›</button>' +
        '<div class="du-intro-caption"><b id="introWho"></b><p id="introLine"></p></div>';
      holder.querySelector('#introSkip').onclick = (e) => { e.stopPropagation(); finish(); };
      state = { script, timings, i: 0, time: 0, elapsed: 0, dur: 0, layers: null, onDone: opts.onDone, markSeen: opts.markSeen, audio: null, tokens: null };
      startBeat(0);
      raf = requestAnimationFrame(loop);
    };
    holder.querySelector('#introBegin').onclick = begin;
    holder.querySelector('#introPass').onclick = () => { music(null); finish(); };
    holder.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); begin(); }
      if (ev.key === 'Escape') finish();
    });
  }

  // the score follows the photograph it is under, the way a film score does
  const THEME = { 'star-seeds': 'night', 'valley-dawn': 'intro', 'rex-mist': 'intro', 'lagoon-home': 'intro' };

  function music(name) {
    try {
      if (!window.DUMusic) return;
      if (name) window.DUMusic.play && window.DUMusic.play(name);
      else window.DUMusic.stop && window.DUMusic.stop();
    } catch (e) { /* music is a bonus, never a dependency */ }
  }

  /* ------------------------------------------------------------------- api */
  const flag = () => !!(window.DUJourney && window.DUJourney.has && window.DUJourney.has('cinema:opening'));

  async function load() {
    const grab = async (path) => {
      try { const r = await fetch(BASE + path, { cache: 'no-cache' }); return r.ok ? await r.json() : null; }
      catch (e) { return null; }
    };
    const [script, timings] = await Promise.all([grab('script.json'), grab('voice/index.json')]);
    return { script, timings };
  }

  const DUINTRO = window.DUINTRO = {
    needs: () => !flag(),
    watched: flag,
    scenes: SCENES,
    /**
     * Run the opening. Resolves straight through when the script or the audio
     * index never arrived, because a half-loaded film is worse than none.
     */
    async play(opts) {
      opts = opts || {};
      if (root) return;
      if (!WORLD) return opts.onDone && opts.onDone();
      const { script, timings } = await load();
      if (!script || !script.beats || !script.beats.length) return opts.onDone && opts.onDone();
      poster(script, timings, {
        onDone: opts.onDone,
        markSeen: opts.replay ? null : () => { window.DUJourney && window.DUJourney.badge && window.DUJourney.badge('cinema:opening'); }
      });
    },
    close: () => { if (root) unmount(); }
  };

  window.addEventListener('pagehide', () => { if (root) unmount(); });
})();
