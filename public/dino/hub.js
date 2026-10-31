// Dinosaur Universe — hub shell.
// Shared state: child name and parent preferences. Chapters receive them via postMessage.
import { chapters, activities } from './chapters.js';
import { heroScene, chapterArt } from './hub-art.js';

const FX = window.DUFX;
const hub = document.querySelector('#hub');
const stage = document.querySelector('#stage');
const frame = document.querySelector('#chapter');
const loader = document.querySelector('#loader');
const stageTitle = document.querySelector('#stageTitle');
const toastEl = document.querySelector('#toast');
const params = new URLSearchParams(location.search);
let toastTimer;

function normalizeName(value) {
  const candidate = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  return candidate && /^[\p{L}\p{M}][\p{L}\p{M} '’-]*$/u.test(candidate) ? candidate : '';
}
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));
}
function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || {}; } catch { return {}; }
}
const savedSettings = readJson('du-parent-settings');
const previousAdventureSettings = readJson('dinosaur-universe-player-v1');
const settings = {
  sound: true,
  difficulty: savedSettings.difficulty || previousAdventureSettings.difficulty || 'curious',
  speech: typeof savedSettings.speech === 'boolean' ? savedSettings.speech : Boolean(previousAdventureSettings.speech),
  calmCelebrations: typeof savedSettings.calmCelebrations === 'boolean' ? savedSettings.calmCelebrations : Boolean(previousAdventureSettings.calmCelebrations),
};
try { settings.sound = JSON.parse(localStorage.getItem('du-sound') ?? JSON.stringify(savedSettings.sound ?? previousAdventureSettings.sound ?? true)) !== false; } catch {}
let name = '';
try { name = normalizeName(localStorage.getItem('du-name') || ''); } catch {}
FX.configure({ sound: settings.sound, calm: settings.calmCelebrations });

function toast(text) {
  toastEl.textContent = text;
  toastEl.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.display = 'none'; }, 3500);
}
function saveSettings() {
  try { localStorage.setItem('du-sound', JSON.stringify(settings.sound)); } catch {}
  try { localStorage.setItem('du-parent-settings', JSON.stringify({ sound: settings.sound, difficulty: settings.difficulty, speech: settings.speech, calmCelebrations: settings.calmCelebrations })); } catch {}
  const soundButton = document.querySelector('#soundBtn');
  soundButton.textContent = settings.sound ? '🔊' : '🔇';
  soundButton.setAttribute('aria-label', settings.sound ? 'Turn sound off' : 'Turn sound on');
  FX.configure({ sound: settings.sound, calm: settings.calmCelebrations });
  broadcast();
}
function broadcast() {
  if (frame && frame.contentWindow) {
    frame.contentWindow.postMessage({ type: 'du-settings', name, sound: settings.sound, difficulty: settings.difficulty, speech: settings.speech, calmCelebrations: settings.calmCelebrations }, location.origin);
  }
}

// Re-broadcast when a chapter finishes loading (its listener may miss the first send).
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.source !== frame.contentWindow || !e.data) return;
  if (e.data.type === 'du-ready') { broadcast(); frameReady(); }
  if (e.data.type === 'du-back') closeChapter();
  if (e.data.type === 'du-settings-update') {
    if (typeof e.data.name === 'string') {
      const nextName = normalizeName(e.data.name);
      if (e.data.name.trim() && !nextName) return;
      name = nextName;
      try { localStorage.setItem('du-name', name); } catch {}
    }
    if (typeof e.data.sound === 'boolean') settings.sound = e.data.sound;
    if (['gentle', 'curious', 'adventurer'].includes(e.data.difficulty)) settings.difficulty = e.data.difficulty;
    if (typeof e.data.speech === 'boolean') settings.speech = e.data.speech;
    if (typeof e.data.calmCelebrations === 'boolean') settings.calmCelebrations = e.data.calmCelebrations;
    saveSettings();
    if (stage.hidden) renderMenu();
  }
});

// ---------- Name dialog ----------
function nameDialog(first = false) {
  const root = document.querySelector('#modal-root');
  root.innerHTML = `
  <div class="modal-backdrop">
    <div class="modal">
      <div style="width:150px;margin:-6px auto 4px">${FX.dinoHTML('trex', { state: 'happy', color: 'green' })}</div>
      <h2>A universe just for you</h2>
      <p>Grown-ups: what first name should the dinosaur friends use?</p>
      <form id="name-form">
        <label>First name
          <input id="child-name" type="text" maxlength="24" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Child's first name">
        </label>
        <p class="subtle">Optional. Saved only in this browser on this device. Used everywhere in Dinosaur Universe.</p>
        <p id="name-error" role="status"></p>
        <div class="toolbar">
          <button class="pill primary" type="submit">Let's play</button>
          <button class="pill" type="button" id="skip-name">${first ? 'Skip for now' : 'Remove name'}</button>
        </div>
      </form>
    </div>
  </div>`;
  const input = document.querySelector('#child-name');
  input.value = name;
  const apply = (n) => {
    name = n;
    try { localStorage.setItem('du-name', n); } catch {}
    root.innerHTML = '';
    renderMenu();
    broadcast();
    toast(n ? `Hello, ${n}!` : 'Welcome!');
    FX.sfx.good(); FX.burst(innerWidth / 2, innerHeight / 3, { kind: 'stars', n: 16 });
  };
  document.querySelector('#name-form').onsubmit = (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (v && !normalizeName(v)) {
      document.querySelector('#name-error').textContent = 'Use a first name with letters, spaces, apostrophes or hyphens (up to 24 characters).';
      return;
    }
    apply(v);
  };
  document.querySelector('#skip-name').onclick = () => apply('');
  setTimeout(() => input.focus(), 50);
}

// ---------- Parents ----------
function parentsDialog() {
  const root = document.querySelector('#modal-root');
  root.innerHTML = `
  <div class="modal-backdrop">
    <div class="modal">
      <h2>Parents’ settings</h2>
      <p class="subtle">Personalise Dinosaur Universe. These choices are saved on this device.</p>
      <form id="parent-settings-form">
        <label class="setting-field" for="set-name">Child’s first name
          <input type="text" id="set-name" maxlength="24" value="${escapeHtml(name)}" autocomplete="off" autocapitalize="words">
        </label>
        <label class="setting-field" for="set-difficulty">Starting challenge
          <select id="set-difficulty">
            <option value="gentle" ${settings.difficulty === 'gentle' ? 'selected' : ''}>Little Explorer</option>
            <option value="curious" ${settings.difficulty === 'curious' ? 'selected' : ''}>Curious Explorer</option>
            <option value="adventurer" ${settings.difficulty === 'adventurer' ? 'selected' : ''}>Dino Adventurer</option>
          </select>
        </label>
        <label class="row"><input type="checkbox" id="set-sound" ${settings.sound ? 'checked' : ''}> Sound effects</label>
        <label class="row"><input type="checkbox" id="set-speech" ${settings.speech ? 'checked' : ''}> Speak gentle instructions</label>
        <label class="row"><input type="checkbox" id="set-calm" ${settings.calmCelebrations ? 'checked' : ''}> Use calmer celebrations</label>
        <p class="subtle">Name, sound and calmer celebrations are shared across the whole universe. Challenge and speech apply to the original activities; the full worlds keep their own game settings.</p>
        <p class="setting-error" id="parent-settings-error" role="status"></p>
        <div class="toolbar">
          <button class="pill primary" type="submit">Save settings</button>
          <button class="pill" type="button" id="close-parents">Close</button>
        </div>
      </form>
    </div>
  </div>`;
  document.querySelector('#parent-settings-form').onsubmit = (event) => {
    event.preventDefault();
    const nextName = document.querySelector('#set-name').value.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (nextName && !normalizeName(nextName)) {
      document.querySelector('#parent-settings-error').textContent = 'Use letters, spaces, apostrophes or hyphens for the first name.';
      return;
    }
    name = nextName;
    settings.difficulty = document.querySelector('#set-difficulty').value;
    settings.sound = document.querySelector('#set-sound').checked;
    settings.speech = document.querySelector('#set-speech').checked;
    settings.calmCelebrations = document.querySelector('#set-calm').checked;
    try { localStorage.setItem('du-name', name); } catch {}
    saveSettings();
    root.innerHTML = '';
    if (stage.hidden) renderMenu();
    toast('Settings saved.');
  };
  document.querySelector('#close-parents').onclick = () => { root.innerHTML = ''; };
}

// ---------- Time of day (follows the real clock; tap the sun or moon to change it) ----------
const PHASES = ['day', 'dusk', 'night', 'dawn'];
function clockPhase() {
  const h = new Date().getHours();
  return h >= 7 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'dusk' : h >= 19 || h < 5 ? 'night' : 'dawn';
}
let tod = PHASES.includes(params.get('tod')) ? params.get('tod') : clockPhase();
function applyTod() {
  document.body.dataset.tod = tod;
  const hero = document.querySelector('.hero-scene');
  if (hero) hero.dataset.tod = tod;
  FX.ambient(tod === 'night' ? 'night' : 'meadow');
}

// ---------- Progress badges read from each world's own saved data ----------
function progress() {
  let park = 0, meadow = 0, drive = 0, adventures = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^dino_[a-z]+$/.test(k)) park += Math.min(3, Number(JSON.parse(localStorage.getItem(k))) || 0); } } catch {}
  try { meadow = (JSON.parse(localStorage.getItem('dm-completed') || '[]') || []).length; } catch {}
  try { drive = Number((JSON.parse(localStorage.getItem('dino-car-studio-v1') || '{}') || {}).totalStars) || 0; } catch {}
  try { adventures = (JSON.parse(localStorage.getItem('dinosaur-universe-player-v1') || '{}') || {}).completed || []; } catch {}
  return { park, meadow, drive, adventures };
}

// ---------- Menu ----------
const TINTS = { 'Puzzles': '#e6e3f5', 'Cozy play': '#fae8d5', 'Creative': '#f7e1d7', 'Discovery': '#dff0e8', 'Learning': '#dceef5', 'Adventures': '#f5e4cb' };
const CAT_ICON = { 'Puzzles': '🧩', 'Cozy play': '🧸', 'Creative': '🎨', 'Discovery': '🔭', 'Learning': '🌱', 'Adventures': '🗺️' };
let sayTimer = 0, parallaxOff = null, emberTimer = 0;

function wave(text) { return [...text].map((ch, i) => `<span style="--i:${i}">${escapeHtml(ch)}</span>`).join(''); }

function renderMenu() {
  stage.hidden = true;
  document.body.classList.remove('in-stage');
  frame.removeAttribute('src');
  frame.classList.remove('ready');
  hub.hidden = false;
  const done = progress();
  const hello = name ? `Hello, ${name}!` : 'Hello!';
  const chips = { park: done.park ? `⭐ ${done.park} / ${10 * 3} stars` : '', meadow: done.meadow ? `🌟 ${done.meadow} / 100 found` : '', drive: done.drive ? `🏁 ${done.drive} stars` : '', adventures: done.adventures.length ? `⭐ ${done.adventures.length} / ${activities.length} played` : '' };
  hub.innerHTML = `
    <section class="hero-scene" data-tod="${tod}">
      ${heroScene()}
      <div class="hs-greet"><h1 class="wave">${wave(hello)}</h1><p>Where shall we go${name ? ', ' + escapeHtml(name) : ''}?</p></div>
      <span class="hs-hint">Tap Rex! Tap the sun!</span>
    </section>
    <section class="worlds-section"><span class="section-kicker">${chapters.length} FULL DINO WORLDS</span><h2>Explore a dinosaur world</h2><p>Each world is a whole game of its own, with lots to find and do.</p>
    <div class="chapter-grid">
      ${chapters.map((c, i) => `
        <button class="chapter-card du-in" data-chapter="${c.id}" style="--du-delay:${i * .12 + .2}s">
          <span class="cc-art">${chapterArt(c.id)}<span class="cc-play" aria-hidden="true">▶</span></span>
          <span class="cc-body">
            <span class="chapter-title">${c.title}</span>
            <span class="chapter-sub">${c.subtitle}</span>
            ${chips[c.id] ? `<span class="cc-chip">${chips[c.id]}</span>` : ''}
          </span>
      </button>`).join('')}
    </div></section>
    <button class="pill" id="renameBtn">✏️ Change name</button>`;
  applyTod();
  for (const c of chapters) {
    const el = document.querySelector(`[data-chapter="${c.id}"]`);
    el.onclick = (e) => openChapter(c, e);
    tilt(el);
  }
  document.querySelector('#renameBtn').onclick = () => nameDialog(false);
  wireHero();
}

/* Cards lean toward the pointer. */
function tilt(el) {
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || FX.settings.reduce) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--rx', (((e.clientX - r.left) / r.width) - .5) * 9);
    el.style.setProperty('--ry', (((e.clientY - r.top) / r.height) - .5) * -9);
  });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', 0); el.style.setProperty('--ry', 0); });
}

function wireHero() {
  const hero = document.querySelector('.hero-scene');
  if (!hero) return;
  const rex = hero.querySelector('.hs-rex .du-dino');
  FX.dinoTrack(rex);
  const say = (text) => {
    const bubble = hero.querySelector('.hs-bubble'), out = hero.querySelector('#hsSay');
    clearInterval(sayTimer);
    bubble.classList.remove('say'); void bubble.offsetWidth; bubble.classList.add('say');
    let i = 0; out.textContent = '';
    sayTimer = setInterval(() => { out.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(sayTimer); }, 28);
  };
  const lines = [
    'Hi! I am Rex! Tap me and I will ROAR!', 'Tap the sun to change the time of day!',
    'Pick a world below!', 'I love dinosaur games!', 'Look! A pterosaur is flying by!',
  ];
  let li = 0;
  say(lines[li++ % lines.length]);
  clearInterval(hero._say); hero._say = setInterval(() => { if (!hero.isConnected) return clearInterval(hero._say); if (stage.hidden && !document.hidden) say(lines[li++ % lines.length]); }, 7500);
  hero.querySelector('.hs-rex').addEventListener('pointerdown', (e) => {
    FX.dinoState(rex, 'roar', 1200); FX.sfx.roar(); FX.shakeScreen(4);
    const r = rex.getBoundingClientRect(); FX.burst(r.left + r.width * .8, r.top + r.height * .3, { kind: 'dust', n: 10 });
    say(['ROOOAR!!', 'Rawr! That was a big one!', 'I am a mighty T-rex!'][li++ % 3]);
    e.stopPropagation();
  });
  hero.querySelectorAll('[data-orb]').forEach((o) => o.addEventListener('pointerdown', () => {
    tod = PHASES[(PHASES.indexOf(tod) + 1) % PHASES.length];
    applyTod(); FX.sfx.sparkle();
    const r = o.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', n: 14 });
    say({ day: 'Good day! Time to play!', dusk: 'The sun is going to bed…', night: 'Shh… the fireflies are out!', dawn: 'A new day is starting!' }[tod]);
    FX.dinoState(rex, tod === 'night' ? 'sleep' : 'happy', tod === 'night' ? 0 : 1400);
    rex.setAttribute('data-base', tod === 'night' ? 'sleep' : 'idle');
  }));
  rex.setAttribute('data-base', tod === 'night' ? 'sleep' : 'idle');
  if (tod === 'night') FX.dinoState(rex, 'sleep');
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--px', (((e.clientX - r.left) / r.width) - .5) * 2);
    hero.style.setProperty('--py', (((e.clientY - r.top) / r.height) - .5) * 2);
  });
  hero.addEventListener('pointerleave', () => { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); });
  // Embers puff from the volcano's crater.
  clearInterval(emberTimer);
  emberTimer = setInterval(() => {
    if (!hero.isConnected) return clearInterval(emberTimer);
    if (!stage.hidden || document.hidden || FX.settings.reduce) return;
    const v = hero.querySelector('.hs-vol'); if (!v) return;
    const r = v.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    FX.burst(r.left + r.width * .5, r.top + r.height * .12, { kind: 'embers', n: 5, angle: -Math.PI / 2, spread: .8 });
  }, 650);
}

const CHAPTER_COLOUR = { park: '#ff8a4d', meadow: '#7fd16e', drive: '#4aa8ff' };
function openChapter(c, e) {
  const x = e && e.clientX ? e.clientX : innerWidth / 2, y = e && e.clientY ? e.clientY : innerHeight / 2;
  const go = () => {
    hub.hidden = true;
    stage.hidden = false;
    document.body.classList.add('in-stage');
    FX.ambient(null);
    loader.classList.remove('off');
    loader.innerHTML = FX.dinoHTML(['trex', 'tricera', 'stego', 'bronto', 'raptor'][Math.floor(Math.random() * 5)], { state: 'walk' });
    frame.classList.remove('ready');
    stageTitle.textContent = c.title;
    frame.title = c.title;
    frame.src = c.url;
    clearTimeout(frame._guard);
    frame._guard = setTimeout(frameReady, 3500);   // never leave a child staring at a blank frame
    broadcast();
    window.scrollTo(0, 0);
  };
  FX.iris(x, y, go, CHAPTER_COLOUR[c.id] || '#0b6e5f');
}
function frameReady() {
  clearTimeout(frame._guard);
  frame.classList.add('ready');
  loader.classList.add('off');
}
frame.addEventListener('load', () => { if (frame.getAttribute('src')) setTimeout(frameReady, 80); });
function closeChapter() {
  const b = document.querySelector('#backBtn').getBoundingClientRect();
  FX.iris(b.left + b.width / 2, b.top + b.height / 2, () => { renderMenu(); window.scrollTo(0, 0); }, '#0b6e5f');
}

// ---------- Boot ----------
document.querySelector('#soundBtn').onclick = () => { settings.sound = !settings.sound; saveSettings(); if (settings.sound) FX.sfx.good(); };
document.querySelector('#parentsBtn').onclick = parentsDialog;
document.querySelector('#backBtn').onclick = closeChapter;
document.querySelector('#soundBtn').textContent = settings.sound ? '🔊' : '🔇';
document.querySelector('#soundBtn').setAttribute('aria-label', settings.sound ? 'Turn sound off' : 'Turn sound on');

renderMenu();
let askForName = false;
try {
  askForName = !localStorage.getItem('du-name-seen');
  if (askForName) localStorage.setItem('du-name-seen', '1');
} catch { /* The game remains playable when browser storage is unavailable. */ }
if (askForName && !params.get('open')) nameDialog(true);

// Deep links: ?open=park | meadow | drive | <activity id>
const wanted = params.get('open');
if (wanted) {
  const c = chapters.find((x) => x.id === wanted), a = activities.find((x) => x.id === wanted);
  if (c) openChapter(c);
  else if (a) openChapter({ title: a.title, url: 'chapters/adventures/index.html?activity=' + encodeURIComponent(a.id) });
}
