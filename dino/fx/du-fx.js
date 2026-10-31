/* Dinosaur Universe — shared motion engine.
 *
 *   DUFX.burst(x, y, {kind, n})      particles: confetti | stars | hearts | leaves | bubbles | sparkle | dust | drops | notes | bones | embers
 *   DUFX.celebrate()                 a proper win celebration (gentler when "calmer celebrations" is on)
 *   DUFX.floatText(x, y, '+1 ⭐')    rising, fading text
 *   DUFX.pop/shake/wiggle/bounce/pulse/squish(el)   one-shot element animations
 *   DUFX.flyTo(fromEl, toEl, {emoji})               an item arcs from one place to another
 *   DUFX.shakeScreen()               a little rumble
 *   DUFX.sfx.tap/pop/good/bad/win/roar/chirp/chomp/splash/whoosh/boing/sparkle/drum/note
 *   DUFX.iris(x, y, cb)              circular screen wipe
 *   DUFX.juice(true)                 auto-feedback for buttons, correct and wrong answers (on by default)
 * Everything honours "reduce motion", the parent's sound switch and the calmer-celebrations setting.
 */
(function () {
  'use strict';
  if (window.DUFX && window.DUFX.burst) return;
  const DUFX = window.DUFX = window.DUFX || {};
  const doc = document;
  const TAU = Math.PI * 2;
  const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  DUFX.rnd = rnd; DUFX.pick = pick; DUFX.clamp = clamp;

  /* ---------- settings (hub → chapter via postMessage) ---------- */
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const S = DUFX.settings = { calm: false, sound: true, reduce: mq.matches, juice: true };
  if (mq.addEventListener) mq.addEventListener('change', (e) => { S.reduce = e.matches; });
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.type !== 'du-settings' || e.origin !== location.origin) return;
    if (typeof d.calmCelebrations === 'boolean') S.calm = d.calmCelebrations;
    if (typeof d.sound === 'boolean') S.sound = d.sound;
  });
  DUFX.configure = (o) => Object.assign(S, o || {});
  DUFX.motionOK = () => !S.reduce;

  /* ---------- sound ---------- */
  let ac = null;
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = false; } }
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    return ac || null;
  }
  function tone(f, dur, type = 'sine', vol = .14, at = 0, slideTo) {
    if (!S.sound) return;
    const c = ctx(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .03);
  }
  function noise(dur, vol = .12, at = 0, lo = 200, hi = 4000, sweepTo) {
    if (!S.sound) return;
    const c = ctx(); if (!c) return;
    const t = c.currentTime + at, len = Math.max(1, (c.sampleRate * dur) | 0);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(lo, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur); else f.frequency.value = hi;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(t);
  }
  const NOTES = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784];
  DUFX.tone = tone; DUFX.noise = noise; DUFX.audioCtx = ctx;
  DUFX.sfx = {
    tap: () => tone(520, .06, 'triangle', .09),
    pop: () => { tone(300, .09, 'sine', .16, 0, 760); noise(.05, .05, 0, 1800, 3000); },
    good: () => { tone(660, .1, 'triangle', .13); tone(880, .16, 'triangle', .13, .08); },
    bad: () => { tone(260, .22, 'sawtooth', .06, 0, 170); },
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .24, 'triangle', .12, i * .1)),
    roar: () => { tone(120, .6, 'sawtooth', .13, 0, 70); tone(90, .7, 'square', .06, .02, 60); noise(.6, .12, 0, 300, 0, 120); },
    chirp: () => { tone(900, .08, 'sine', .1, 0, 1500); tone(1300, .1, 'sine', .1, .1, 900); },
    chomp: () => { noise(.09, .16, 0, 600, 1500); tone(180, .08, 'square', .06, 0, 110); },
    splash: () => { noise(.35, .14, 0, 3000, 0, 500); tone(500, .15, 'sine', .05, 0, 250); },
    whoosh: () => noise(.3, .08, 0, 400, 0, 2600),
    boing: () => tone(240, .3, 'sine', .15, 0, 700),
    sparkle: () => [1319, 1568, 1976, 2349].forEach((f, i) => tone(f, .12, 'sine', .06, i * .045)),
    drum: (n = 0) => { tone(150 + n * 40, .16, 'sine', .22, 0, 60); noise(.06, .05, 0, 900, 1500); },
    note: (i = 0, dur = .35) => tone(NOTES[((i % 12) + 12) % 12], dur, 'triangle', .14),
    engine: () => tone(70, .25, 'sawtooth', .05, 0, 90),
    star: () => { tone(988, .09, 'triangle', .12); tone(1319, .18, 'triangle', .12, .07); },
    thud: () => { tone(110, .16, 'sine', .22, 0, 55); noise(.1, .08, 0, 200, 600); },
  };

  /* ---------- particle layer ---------- */
  let cv = null, cx = null, W = 0, H = 0, dpr = 1, parts = [], raf = 0, lastT = 0;
  function layer() {
    if (cv) return cv;
    if (!doc.body) return null;
    cv = doc.createElement('canvas'); cv.id = 'du-fx-layer'; cv.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(cv); cx = cv.getContext('2d');
    sizeLayer(); window.addEventListener('resize', sizeLayer);
    return cv;
  }
  function sizeLayer() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const CONFETTI = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#ff9f43', '#2ec4b6'];
  const KINDS = {
    confetti: { shape: 'rect', g: 420, drag: .6, size: [7, 12], life: [1.6, 2.6], speed: [220, 560], spread: 1 },
    stars: { emoji: ['⭐', '✨', '🌟', '💫'], g: 120, drag: 1.2, size: [16, 26], life: [.8, 1.4], speed: [120, 320], spread: 1 },
    hearts: { emoji: ['💚', '💛', '🧡', '💖', '💜'], g: -90, drag: 1.4, size: [16, 26], life: [1, 1.6], speed: [60, 190], spread: 1, up: true },
    leaves: { emoji: ['🍃', '🌿', '🍀'], g: 160, drag: 1.1, size: [16, 24], life: [1.2, 2], speed: [90, 240], spread: 1, flutter: true },
    bubbles: { shape: 'bubble', g: -110, drag: .8, size: [8, 22], life: [1.2, 2.2], speed: [30, 120], spread: 1, up: true },
    sparkle: { shape: 'spark', g: 0, drag: 2.2, size: [3, 7], life: [.4, .9], speed: [60, 260], spread: 1, add: true },
    dust: { shape: 'dust', g: -20, drag: 2.6, size: [10, 22], life: [.5, .9], speed: [30, 110], spread: 1 },
    drops: { emoji: ['💧'], g: 520, drag: .4, size: [12, 18], life: [.7, 1.1], speed: [120, 300], spread: 1 },
    notes: { emoji: ['🎵', '🎶'], g: -70, drag: 1, size: [18, 28], life: [1, 1.6], speed: [50, 140], spread: 1, up: true },
    bones: { emoji: ['🦴'], g: 380, drag: .5, size: [18, 26], life: [1, 1.5], speed: [140, 340], spread: 1 },
    embers: { shape: 'spark', g: -60, drag: .9, size: [2, 5], life: [.8, 1.6], speed: [30, 100], spread: 1, add: true, hot: true },
  };
  DUFX.burst = function (x, y, o) {
    if (S.reduce) return;
    o = o || {};
    const K = KINDS[o.kind || 'sparkle'] || KINDS.sparkle;
    if (!layer()) return;
    let n = o.n || 14;
    if (S.calm) n = Math.max(2, Math.round(n * .4));
    n = Math.min(n, 120);
    for (let i = 0; i < n; i++) {
      const a = o.angle !== undefined ? o.angle + rnd(-1, 1) * (o.spread || .6) : rnd(TAU);
      const sp = rnd(K.speed[0], K.speed[1]) * (S.calm ? .6 : 1) * (o.power || 1);
      const life = rnd(K.life[0], K.life[1]) * (S.calm ? 1.2 : 1);
      parts.push({
        k: K, x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (K.up ? 0 : sp * .25),
        r: rnd(TAU), vr: rnd(-6, 6), life, max: life, size: rnd(K.size[0], K.size[1]) * (o.scale || 1),
        color: o.color || pick(CONFETTI), e: K.emoji ? pick(K.emoji) : '', ph: rnd(TAU), text: null,
      });
    }
    kick();
  };
  DUFX.floatText = function (x, y, text, o) {
    if (S.reduce) return;
    o = o || {};
    if (!layer()) return;
    parts.push({ k: { g: -40, drag: 1 }, text, x, y, vx: rnd(-10, 10), vy: -70, r: 0, vr: 0, life: 1.3, max: 1.3, size: o.size || 26, color: o.color || '#ffcf33', e: '', ph: 0 });
    kick();
  };
  DUFX.celebrate = function (o) {
    if (S.reduce) return;
    o = o || {};
    if (!layer()) return;
    DUFX.sfx.win();
    if (S.calm) {
      for (let i = 0; i < 5; i++) setTimeout(() => DUFX.burst(rnd(W * .2, W * .8), rnd(H * .25, H * .6), { kind: 'sparkle', n: 14, color: '#fff2a8' }), i * 220);
      return;
    }
    const left = o.x !== undefined ? o.x : W * .15, right = o.x !== undefined ? o.x : W * .85, by = o.y !== undefined ? o.y : H * .95;
    DUFX.burst(left, by, { kind: 'confetti', n: 46, angle: -Math.PI * .38, spread: .45, power: 1.5 });
    DUFX.burst(right, by, { kind: 'confetti', n: 46, angle: -Math.PI * .62, spread: .45, power: 1.5 });
    for (let i = 0; i < 6; i++) setTimeout(() => DUFX.burst(rnd(W * .15, W * .85), -10, { kind: 'confetti', n: 10, angle: Math.PI / 2, spread: 1.2, power: .4 }), 250 + i * 180);
    setTimeout(() => DUFX.burst(W / 2, H * .4, { kind: 'stars', n: 18, power: 1.1 }), 180);
  };
  function kick() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(t) {
    const dt = Math.min(.04, (t - lastT) / 1000 || .016); lastT = t;
    cx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], K = p.k;
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += K.g * dt; const damp = Math.exp(-K.drag * dt); p.vx *= damp; p.vy *= (K.g ? Math.exp(-K.drag * .35 * dt) : damp);
      if (K.flutter) p.vx += Math.sin(p.ph + p.life * 6) * 160 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const a = clamp(p.life / p.max * 2.2, 0, 1);
      cx.globalAlpha = a;
      if (p.text) { cx.font = `900 ${p.size}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.lineWidth = 5; cx.strokeStyle = 'rgba(30,60,50,.55)'; cx.strokeText(p.text, p.x, p.y); cx.fillStyle = p.color; cx.fillText(p.text, p.x, p.y); continue; }
      if (K.emoji) { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r * .25); cx.font = `${p.size}px serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(p.e, 0, 0); cx.restore(); continue; }
      if (K.shape === 'rect') { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.scale(1, Math.cos(p.r * 1.7)); cx.fillStyle = p.color; cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); cx.restore(); continue; }
      if (K.shape === 'bubble') { cx.beginPath(); cx.arc(p.x, p.y, p.size, 0, TAU); cx.fillStyle = 'rgba(180,230,255,.28)'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.stroke(); cx.beginPath(); cx.arc(p.x - p.size * .3, p.y - p.size * .3, p.size * .22, 0, TAU); cx.fillStyle = 'rgba(255,255,255,.85)'; cx.fill(); continue; }
      if (K.shape === 'dust') { const s = p.size * (1.6 - a * .6); cx.beginPath(); cx.arc(p.x, p.y, s, 0, TAU); cx.fillStyle = 'rgba(200,180,150,.5)'; cx.fill(); continue; }
      if (K.shape === 'spark') { cx.globalCompositeOperation = 'lighter'; const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.4); const c = K.hot ? ['255,200,90', '255,90,20'] : ['255,255,220', '255,214,102']; g.addColorStop(0, `rgba(${c[0]},${a})`); g.addColorStop(1, `rgba(${c[1]},0)`); cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, p.size * 2.4, 0, TAU); cx.fill(); cx.globalCompositeOperation = 'source-over'; continue; }
    }
    cx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; cx.clearRect(0, 0, W, H); }
  }

  /* ---------- element animations (Web Animations API) ---------- */
  function anim(el, frames, opt) {
    if (!el || S.reduce || !el.animate) return null;
    return el.animate(frames, Object.assign({ duration: 400, easing: 'ease-out' }, opt || {}));
  }
  DUFX.anim = anim;
  DUFX.pop = (el) => anim(el, [{ transform: 'scale(.6)', opacity: .4 }, { transform: 'scale(1.18)', opacity: 1, offset: .6 }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
  DUFX.shake = (el) => anim(el, [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px) rotate(-2deg)' }, { transform: 'translateX(8px) rotate(2deg)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 380 });
  DUFX.wiggle = (el) => anim(el, [{ transform: 'rotate(0)' }, { transform: 'rotate(-9deg) scale(1.06)' }, { transform: 'rotate(8deg) scale(1.06)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0)' }], { duration: 520 });
  DUFX.bounce = (el) => anim(el, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(-26px) scale(.94,1.08)', offset: .4 }, { transform: 'translateY(0) scale(1.1,.88)', offset: .75 }, { transform: 'translateY(-6px)', offset: .9 }, { transform: 'translateY(0) scale(1)' }], { duration: 640, easing: 'cubic-bezier(.3,.7,.4,1)' });
  DUFX.pulse = (el) => anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 360 });
  DUFX.squish = (el) => anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(.9,.94)', offset: .3 }, { transform: 'scale(1.06,1.04)', offset: .7 }, { transform: 'scale(1)' }], { duration: 300 });
  DUFX.shakeScreen = function (amount) {
    if (S.reduce || S.calm) return;
    const a = amount || 5;
    anim(doc.body, [{ transform: 'translate(0,0)' }, { transform: `translate(${-a}px,${a * .6}px)` }, { transform: `translate(${a}px,${-a * .5}px)` }, { transform: `translate(${-a * .6}px,${-a * .4}px)` }, { transform: 'translate(0,0)' }], { duration: 320 });
  };
  const centre = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };
  DUFX.centre = centre;
  DUFX.flyTo = function (from, to, o) {
    o = o || {};
    return new Promise((resolve) => {
      const a = from && from.getBoundingClientRect ? centre(from) : from, b = to && to.getBoundingClientRect ? centre(to) : to;
      if (!a || !b || S.reduce || !doc.body.animate) return resolve();
      const f = doc.createElement('div');
      f.className = 'du-flyer'; f.textContent = o.emoji || (from && from.textContent) || '⭐';
      f.style.fontSize = (o.size || 38) + 'px'; f.style.lineHeight = 1; f.style.marginLeft = '-.5em'; f.style.marginTop = '-.5em';
      doc.body.appendChild(f);
      const dur = o.duration || 650, lift = o.lift !== undefined ? o.lift : Math.min(160, Math.hypot(b.x - a.x, b.y - a.y) * .5);
      const frames = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; frames.push({ transform: `translate(${a.x + (b.x - a.x) * t}px,${a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * lift}px) rotate(${t * (o.spin || 360)}deg) scale(${1 - t * .35})` }); }
      const an = f.animate(frames, { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
      DUFX.sfx.whoosh();
      an.onfinish = () => { f.remove(); if (o.burst !== false) DUFX.burst(b.x, b.y, { kind: o.kind || 'sparkle', n: 10 }); resolve(); };
    });
  };

  /* ---------- screen wipe ---------- */
  DUFX.iris = function (x, y, cb, color) {
    if (S.reduce || !doc.body.animate) { cb && cb(); return; }
    const el = doc.createElement('div'); el.className = 'du-iris';
    if (color) el.style.background = color;
    el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px');
    doc.body.appendChild(el);
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const open = el.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
    DUFX.sfx.whoosh();
    open.onfinish = () => {
      cb && cb();
      const close = el.animate([{ clipPath: `circle(${R}px at 50% 50%)` }, { clipPath: 'circle(0px at 50% 50%)' }], { duration: 480, easing: 'ease-out', fill: 'forwards', delay: 120 });
      close.onfinish = () => el.remove();
    };
  };

  /* ---------- auto-juice: every button, correct answer and wrong answer reacts ---------- */
  const GOOD = ['right', 'good', 'correct', 'matched', 'found', 'filled', 'complete', 'completed', 'success', 'solved', 'placed', 'fed', 'clean', 'lit', 'collected'];
  const BAD = ['wrong', 'bad', 'incorrect', 'miss', 'error', 'nope'];
  const ENTER = '.tile, .choice, .module-card, .chapter-card, .cell, .slot, .swatch, .pc, .basket, .dino-btn, .activity-card, .filter-chip, .part-card, .toy, .card, .destination, .big-btn, .scene-choice, .car-card, .piece, .sticker, .note, .bubble';
  let juiceOn = false, mo = null, enterTimes = new WeakMap();
  DUFX.juice = function (on) {
    S.juice = on !== false;
    if (!S.juice || juiceOn) return;
    juiceOn = true;
    doc.addEventListener('pointerdown', (e) => {
      if (!S.juice || S.reduce) return;
      const b = e.target.closest && e.target.closest('button, [role="button"], .tile, .choice, .cell, .slot, .pc, .basket, .dino-btn, .module-card, .chapter-card');
      if (!b || b.disabled) return;
      DUFX.sfx.tap();
      anim(b, [{ transform: 'scale(1)' }, { transform: 'scale(.92,.95)', offset: .35 }, { transform: 'scale(1.04)', offset: .75 }, { transform: 'scale(1)' }], { duration: 260, composite: 'add' });
      if (!S.calm) DUFX.burst(e.clientX, e.clientY, { kind: 'sparkle', n: 5, scale: .8 });
    }, true);
    mo = new MutationObserver((list) => {
      if (S.reduce) return;
      for (const m of list) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const el = m.target, was = new Set((m.oldValue || '').split(/\s+/)), now = el.classList;
          const gained = [...now].filter((c) => !was.has(c));
          if (!gained.length) continue;
          if (gained.some((c) => GOOD.includes(c))) {
            const c = centre(el); DUFX.pop(el); DUFX.sfx.good();
            if (!el.closest('#du-fx-layer')) DUFX.burst(c.x, c.y, { kind: 'stars', n: 7, scale: .8 });
          } else if (gained.some((c) => BAD.includes(c))) { DUFX.shake(el); DUFX.sfx.bad(); }
        } else if (m.type === 'childList' && m.addedNodes.length) staggerIn(m);
      }
    });
    mo.observe(doc.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  };
  function staggerIn(m) {
    const host = m.target;
    if (!(host instanceof Element) || host.closest('#du-fx-layer, #du-ambient, .du-flyer, .du-iris')) return;
    if (m.removedNodes.length === m.addedNodes.length && m.addedNodes.length > 3) return;      // a re-render of the same board
    const last = enterTimes.get(host) || 0, now = performance.now();
    if (now - last < 700) return;
    const items = [];
    m.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.matches(ENTER)) items.push(n); else n.querySelectorAll && n.querySelectorAll(ENTER).forEach((x) => items.push(x)); } });
    if (items.length < 2) return;
    enterTimes.set(host, now);
    items.slice(0, 40).forEach((el, i) => anim(el, [{ opacity: 0, transform: 'translateY(16px) scale(.8)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 420, delay: i * 38, easing: 'cubic-bezier(.2,.9,.3,1.25)', fill: 'backwards' }));
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => DUFX.juice(true)); else DUFX.juice(true);
})();
