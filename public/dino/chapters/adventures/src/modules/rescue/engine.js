// Shared engine for "The Great Dino Rescue": saved progress, music, narration, choices and small helpers.
const FX = window.DUFX;
const SAVE_KEY = 'du-rescue-v1';
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const rnd = (a, b) => a + Math.random() * (b - a);
export const tile = (svg, w, h) => "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + svg + '</svg>') + "')";

export const MOUNTS = [
  { id: 'trex', name: 'Rex the T-rex', color: 'green', blurb: 'Strong, loud and brave.' },
  { id: 'tricera', name: 'Bumper the Triceratops', color: 'orange', blurb: 'Bumps through anything.' },
  { id: 'raptor', name: 'Zip the Raptor', color: 'purple', blurb: 'The speediest runner.' },
  { id: 'stego', name: 'Spike the Stegosaurus', color: 'teal', blurb: 'Gentle, steady and swishy.' },
  { id: 'bronto', name: 'Gentle the Brontosaurus', color: 'blue', blurb: 'Tall enough to see everything.' },
];

// ---------------------------------------------------------------- saved progress
export function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && typeof s.next === 'number') return s; } catch (e) { /* fresh start */ }
  return { next: 0, mount: 'trex', badges: [], gems: 0, party: [], won: 0 };
}
export function writeSave(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* storage is optional */ } }

// ---------------------------------------------------------------- music
// Each theme is a tiny arrangement: a bass line, a lead melody and a soft hat, in a scale.
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], penta: [0, 2, 4, 7, 9] };
const THEMES = {
  home:   { bpm: 84, root: 261.6, scale: 'major', bass: [0, 4, 5, 3], lead: [4, 2, 4, 5, 4, 2, 0, null, 2, 4, 5, 4, 2, 1, 0, null], wave: 'triangle', hat: false },
  forest: { bpm: 100, root: 220, scale: 'penta', bass: [0, 0, 2, 3], lead: [0, 2, 4, 2, 3, 2, 1, 0, 4, 3, 2, 1, 2, 3, 4, null], wave: 'sine', hat: true },
  bridge: { bpm: 108, root: 293.7, scale: 'major', bass: [0, 3, 4, 3], lead: [4, null, 4, 5, 6, null, 4, 2, 3, null, 3, 4, 5, 4, 3, 2], wave: 'triangle', hat: true },
  cave:   { bpm: 70, root: 196, scale: 'minor', bass: [0, 5, 3, 4], lead: [0, null, 2, null, 4, null, 2, null, 3, null, 1, null, 0, null, null, null], wave: 'sine', hat: false },
  lava:   { bpm: 120, root: 164.8, scale: 'minor', bass: [0, 0, 5, 4], lead: [0, 2, 3, 2, 0, 2, 4, 3, 5, 4, 3, 2, 3, 2, 0, null], wave: 'square', hat: true },
  sky:    { bpm: 92, root: 329.6, scale: 'major', bass: [0, 5, 3, 4], lead: [2, 4, 6, 4, 5, 4, 2, 4, 6, 7, 6, 4, 5, 4, 2, null], wave: 'triangle', hat: false },
  storm:  { bpm: 132, root: 174.6, scale: 'minor', bass: [0, 0, 1, 0], lead: [0, 3, 4, 3, 0, 3, 5, 4, 3, 2, 3, 4, 5, 6, 4, null], wave: 'sawtooth', hat: true },
  joy:    { bpm: 104, root: 261.6, scale: 'major', bass: [0, 4, 5, 3], lead: [4, 4, 5, 7, 7, 5, 4, 2, 0, 2, 4, 4, 2, 2, 0, null], wave: 'triangle', hat: true },
};
const freq = (root, scale, deg) => { const sc = SCALES[scale], n = sc.length, oct = Math.floor(deg / n), i = ((deg % n) + n) % n; return root * Math.pow(2, (sc[i] + oct * 12) / 12); };
export const noteFreq = (deg, scale) => freq(261.6, scale || 'major', deg);

export function createEngine(context) {
  const E = { context, save: loadSave(), alive: true, skip: null, musicOn: true, theme: null };
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  let musicTimer = 0, step = 0;
  const leaving = () => { E.alive = false; E.stopMusic(); timers.forEach(clearTimeout); document.removeEventListener('keydown', E._key); };
  context.stage.addEventListener('du-leave', leaving);
  const obs = new MutationObserver(() => { if (!document.contains(context.stage)) { leaving(); obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });

  E.playNote = (deg, scale, dur, vol, wave) => FX.tone && FX.tone(freq(261.6, scale || 'major', deg), dur || .35, wave || 'triangle', vol == null ? .12 : vol);
  E.sfx = FX.sfx;
  E.music = function (name) {
    E.stopMusic(); const th = THEMES[name]; if (!th) return; E.theme = name; step = 0;
    const eighth = 60000 / th.bpm / 2;
    musicTimer = setInterval(() => {
      if (!E.alive || !E.musicOn || !FX.tone) return;
      const s = step++ % 16, bar = Math.floor((step - 1) / 16) % th.bass.length;
      if (s % 4 === 0) FX.tone(freq(th.root / 2, th.scale, th.bass[bar]), eighth * 3.6 / 1000, 'sine', .07);
      if (s % 8 === 4) FX.tone(freq(th.root, th.scale, th.bass[bar] + 2), eighth * 3 / 1000, 'sine', .035);
      const l = th.lead[s]; if (l != null) FX.tone(freq(th.root * 2, th.scale, l + (bar % 2 ? 1 : 0)), eighth * 1.8 / 1000, th.wave, .045);
      if (th.hat && s % 2 === 1 && FX.noise) FX.noise(.05, .018, 0, 6000, 8000);
    }, eighth);
  };
  E.stopMusic = () => { clearInterval(musicTimer); musicTimer = 0; };

  // ---------------------------------------------------------------- stage and scene
  E.build = function () {
    context.stage.innerHTML = '<div class="rs"><div class="rs-area"><div class="rs-world"></div><div class="rs-hud"><span class="rs-chap"></span><span class="rs-gems">💎 <b>0</b></span><button class="rs-mus" aria-label="Music on or off">🎵</button></div><div class="rs-cap" hidden><span class="rs-face"></span><span class="rs-txt"></span></div></div></div>';
    E.area = context.stage.querySelector('.rs-area'); E.world = E.area.querySelector('.rs-world');
    E.cap = E.area.querySelector('.rs-cap'); E.capFace = E.cap.querySelector('.rs-face'); E.capTxt = E.cap.querySelector('.rs-txt');
    E.chapEl = E.area.querySelector('.rs-chap'); E.gemEl = E.area.querySelector('.rs-gems b');
    E.gemEl.textContent = E.save.gems;
    E.area.querySelector('.rs-mus').addEventListener('click', (e) => { E.musicOn = !E.musicOn; e.currentTarget.classList.toggle('off', !E.musicOn); });
    context.stage._rs = E;
    E._key = (e) => { if (e.key === 'Enter' && E.nextTap) E.nextTap(); };
    document.addEventListener('keydown', E._key);
  };
  E.scene = function (html, opts) {
    opts = opts || {};
    E.world.innerHTML = html; E.world.className = 'rs-world' + (opts.cls ? ' ' + opts.cls : '');
    if (opts.ambient && FX.ambient) FX.ambient(opts.ambient);
    if (opts.music) E.music(opts.music);
    E.hush(); E.skip = null;
  };
  E.add = (html, cls, style) => { const d = document.createElement('div'); d.className = cls || ''; if (style) d.style.cssText = style; d.innerHTML = html || ''; E.world.append(d); return d; };
  E.dino = (species, x, y, w, state, color) => { const d = E.add(FX.dinoHTML(species, { state: state || 'idle', color }), 'rs-dino', 'left:' + x + '%;top:' + y + '%;width:' + w + '%'); d.el = d.querySelector('.du-dino'); return d; };
  E.person = (who, x, y, size, state) => { const d = E.add(FX.personHTML(who, { state: state || 'idle', size }), 'rs-person', 'left:' + x + '%;top:' + y + '%'); d.el = d.querySelector('.du-person'); return d; };
  E.mount = (x, y, w, state) => E.dino(E.save.mount, x, y, w, state, (MOUNTS.find((m) => m.id === E.save.mount) || MOUNTS[0]).color);
  E.moveTo = (d, x, y, ms) => { d.style.transition = 'left ' + ms + 'ms linear, top ' + ms + 'ms linear'; if (x != null) d.style.left = x + '%'; if (y != null) d.style.top = y + '%'; return wait(ms); };
  E.walk = async (d, x, y, ms) => { if (d.el && d.el.classList.contains('du-dino')) FX.dinoState(d.el, 'walk'); E.world.classList.add('walking'); await E.moveTo(d, x, y, ms); E.world.classList.remove('walking'); if (d.el && d.el.classList.contains('du-dino')) FX.dinoState(d.el, 'idle'); };
  E.setChapter = (n, name) => { E.chapEl.textContent = n ? 'Chapter ' + n + ' · ' + name : name; };
  E.addGems = (n, at) => {
    E.save.gems += n; writeSave(E.save); E.gemEl.textContent = E.save.gems; E.gemEl.parentElement.classList.remove('bump'); void E.gemEl.offsetWidth; E.gemEl.parentElement.classList.add('bump');
    FX.sfx.sparkle(); if (at && FX.floatText) FX.floatText(at.x, at.y, '+' + n + ' 💎');
  };

  // ---------------------------------------------------------------- words
  const FACES = { narrator: '📖', mummy: '<i class="rs-head m"></i>', daddy: '<i class="rs-head d"></i>', pip: '🐦', grayson: '🧒', bumper: '🦕', grumble: '⛈️', owl: '🦉', volcano: '🌋' };
  E.say = async function (text, who, hold) {
    if (!E.alive) return;
    E.cap.hidden = false; E.cap.classList.remove('pop'); void E.cap.offsetWidth; E.cap.classList.add('pop');
    E.capFace.innerHTML = FACES[who || 'narrator'] || FACES.narrator; E.cap.dataset.who = who || 'narrator';
    try { context.speak && context.speak(text); } catch (e) { /* speech is optional */ }
    let skipped = false; E.nextTap = () => { skipped = true; };
    const tap = () => { skipped = true; }; E.cap.addEventListener('pointerdown', tap);
    for (let i = 1; i <= text.length && E.alive && !skipped; i++) { E.capTxt.textContent = text.slice(0, i); await wait(20); }
    E.capTxt.textContent = text;
    const end = Date.now() + (hold == null ? 1100 + text.length * 16 : hold);
    while (E.alive && !skipped && Date.now() < end) await wait(60);
    E.cap.removeEventListener('pointerdown', tap); E.nextTap = null;
  };
  E.hush = () => { if (E.cap) E.cap.hidden = true; };
  E.choose = (prompt, options) => new Promise((resolve) => {
    const box = E.add('<p>' + prompt + '</p><div>' + options.map((o, i) => '<button data-i="' + i + '"><span>' + o.icon + '</span>' + o.label + '</button>').join('') + '</div>', 'rs-choice');
    E.area.append(box);
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { FX.sfx.pop(); box.remove(); resolve(Number(b.dataset.i)); }));
  });
  // a card in the middle of the screen (badges, facts, chapter ends)
  E.card = (o) => new Promise((resolve) => {
    const c = document.createElement('div'); c.className = 'rs-card' + (o.cls ? ' ' + o.cls : '');
    c.innerHTML = (o.tag ? '<div class="rs-tag">' + o.tag + '</div>' : '') + '<div class="rs-card-icon">' + (o.icon || '⭐') + '</div><h2>' + o.title + '</h2><p>' + (o.body || '') + '</p><button>' + (o.button || 'Carry on ›') + '</button>';
    E.area.append(c); if (o.win !== false) { FX.sfx.win(); FX.celebrate && FX.celebrate(); }
    c.querySelector('button').addEventListener('click', () => { FX.sfx.pop(); c.remove(); resolve(); });
  });
  E.titleCard = async (n, title, sub) => {
    const t = document.createElement('div'); t.className = 'rs-title'; t.innerHTML = '<small>' + (n ? 'CHAPTER ' + n : '') + '</small><h1>' + title + '</h1><p>' + (sub || '') + '</p>';
    E.area.append(t); FX.sfx.roar(); await wait(2600); t.classList.add('out'); await wait(700); t.remove();
  };
  E.tapAll = (spots, cls, onTap) => new Promise((resolve) => {
    let left = spots.length;
    spots.forEach((s, i) => {
      const el = document.createElement('button'); el.className = 'rs-spot ' + (cls || ''); el.textContent = s[2];
      el.style.cssText = 'left:' + s[0] + '%;top:' + s[1] + '%'; el.setAttribute('aria-label', 'Tap me');
      el.addEventListener('click', () => { el.disabled = true; el.classList.add('got'); FX.sfx.sparkle(); const r = el.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', n: 14 }); onTap && onTap(i, el); later(() => el.remove(), 500); if (--left === 0) resolve(); });
      E.world.append(el);
    });
    E.skip = () => { E.world.querySelectorAll('.rs-spot:not(.got)').forEach((b) => b.click()); };
  });
  // Simon-style melody: keys is [{icon,deg}] ; seq is an array of key indexes the child repeats.
  E.melody = (keys, seq, label, scale) => new Promise(async (resolve) => {
    const pad = E.add('<div class="rs-keys">' + keys.map((k, i) => '<button data-k="' + i + '" style="--c:' + k.color + '"><span>' + k.icon + '</span></button>').join('') + '</div>', 'rs-melody');
    const btns = [...pad.querySelectorAll('button')]; let busy = true, pos = 0;
    const play = (i) => { E.playNote(keys[i].deg, scale || 'penta', .5, .16, 'sine'); btns[i].classList.add('lit'); setTimeout(() => btns[i].classList.remove('lit'), 360); };
    const demo = async () => { busy = true; await E.say('Listen to the song…', 'narrator', 300); await wait(500); for (const i of seq) { if (!E.alive) return; play(i); await wait(620); } E.hush(); busy = false; pos = 0; E.say(label || 'Now you play it!', 'narrator', 300); };
    btns.forEach((b, i) => b.addEventListener('pointerdown', async () => {
      if (busy) return; play(i);
      if (i === seq[pos]) { if (++pos === seq.length) { busy = true; pad.classList.add('done'); await wait(700); pad.remove(); resolve(); } }
      else { busy = true; pos = 0; FX.sfx.boing(); pad.classList.add('shake'); await wait(500); pad.classList.remove('shake'); await E.say('Oops, let’s listen once more!', 'narrator', 400); demo(); }
    }));
    E.skip = () => { busy = true; pad.remove(); resolve(); };
    demo();
  });
  E.finishBadge = async (id, icon, title, body) => {
    if (!E.save.badges.includes(id)) E.save.badges.push(id);
    writeSave(E.save); await E.card({ tag: 'NEW BADGE', icon, title, body });
  };
  // an optional real photo or clip from assets/real/manifest.json, with a friendly fallback card
  E.real = async (id, icon, fact) => {
    E.hush();
    let m = null;
    try { const r = await fetch('assets/real/manifest.json', { cache: 'no-cache' }); if (r.ok) m = ((await r.json()).moments || []).find((x) => x.id === id); } catch (e) { /* no media yet */ }
    if (!m || !m.src) return E.card({ tag: 'DINO FACT', icon, title: 'Did you know?', body: fact });
    const media = m.type === 'video'
      ? '<video src="assets/real/' + m.src + '"' + (m.poster ? ' poster="assets/real/' + m.poster + '"' : '') + ' autoplay muted loop playsinline controls></video>'
      : '<img alt="" src="assets/real/' + m.src + '">';
    return E.card({ tag: 'REAL DINO WORLD', icon: media, title: 'Did you know?', body: m.caption + (m.credit ? '<br><small>' + m.credit + '</small>' : ''), cls: 'media', win: false });
  };
  E.later = later;
  return E;
}
