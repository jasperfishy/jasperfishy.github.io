// Dinosaur Universe — hub shell.
// Shared state: child name and parent preferences. Chapters receive them via postMessage.
import { chapters, activities } from './chapters.js';

const hub = document.querySelector('#hub');
const stage = document.querySelector('#stage');
const frame = document.querySelector('#chapter');
const stageTitle = document.querySelector('#stageTitle');
const toastEl = document.querySelector('#toast');
let toastTimer;

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
try { name = localStorage.getItem('du-name') || ''; } catch {}

function toast(text) {
  toastEl.textContent = text;
  toastEl.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.display = 'none'; }, 3500);
}
function saveSettings() {
  try { localStorage.setItem('du-sound', JSON.stringify(settings.sound)); } catch {}
  try { localStorage.setItem('du-parent-settings', JSON.stringify({ sound: settings.sound, difficulty: settings.difficulty, speech: settings.speech, calmCelebrations: settings.calmCelebrations })); } catch {}
  document.querySelector('#soundBtn').textContent = settings.sound ? '🔊' : '🔇';
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
  if (e.data.type === 'du-ready') broadcast();
  if (e.data.type === 'du-back') renderMenu();
  if (e.data.type === 'du-settings-update') {
    const nextName = String(e.data.name || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (nextName && !/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{1,24}$/.test(nextName)) return;
    name = nextName;
    try { localStorage.setItem('du-name', name); } catch {}
    if (typeof e.data.sound === 'boolean') settings.sound = e.data.sound;
    if (['gentle', 'curious', 'adventurer'].includes(e.data.difficulty)) settings.difficulty = e.data.difficulty;
    if (typeof e.data.speech === 'boolean') settings.speech = e.data.speech;
    if (typeof e.data.calmCelebrations === 'boolean') settings.calmCelebrations = e.data.calmCelebrations;
    saveSettings();
  }
});

// ---------- Name dialog (shared, carried over from Dino Meadow) ----------
function nameDialog(first = false) {
  const root = document.querySelector('#modal-root');
  root.innerHTML = `
  <div class="modal-backdrop">
    <div class="modal">
      <h2>A universe just for you</h2>
      <p>Grown-ups: what first name should the dinosaur friends use?</p>
      <form id="name-form">
        <label>First name
          <input id="child-name" type="text" maxlength="24" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Child's first name">
        </label>
        <p class="subtle">Optional. Saved only in this browser on this device. Used in both Dino Park and Dino Meadow.</p>
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
  };
  document.querySelector('#name-form').onsubmit = (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (v && !/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{1,24}$/.test(v)) {
      document.querySelector('#name-error').textContent = 'Use a first name with letters, spaces, apostrophes or hyphens (up to 24 characters).';
      return;
    }
    apply(v);
  };
  document.querySelector('#skip-name').onclick = () => apply('');
  setTimeout(() => input.focus(), 50);
}

// ---------- Parents (shared settings, carried over from Dino Meadow) ----------
function parentsDialog() {
  const root = document.querySelector('#modal-root');
  root.innerHTML = `
  <div class="modal-backdrop">
    <div class="modal">
      <h2>Parents’ settings</h2>
      <p class="subtle">Personalise Dinosaur Universe. These choices are saved on this device.</p>
      <form id="parent-settings-form">
        <label class="setting-field" for="set-name">Child’s first name
          <input type="text" id="set-name" maxlength="24" value="${name.replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]))}" autocomplete="off" autocapitalize="words">
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
        <p class="subtle">Name and sound are shared across the whole game. Challenge, speech and calmer rewards apply to the original activities; Dino Park and Dino Meadow keep their chapter-specific options.</p>
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
    if (nextName && !/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{1,24}$/.test(nextName)) {
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

// ---------- Menu ----------
function renderMenu() {
  stage.hidden = true;
  frame.removeAttribute('src');
  hub.hidden = false;
  const hello = name ? `Hello, ${name}!` : 'Hello!';
  const categoryOrder = ['Puzzles', 'Cozy play', 'Creative', 'Discovery', 'Learning', 'Adventures'];
  const activityGroups = categoryOrder.filter((category) => activities.some((activity) => activity.category === category)).map((category) => `
    <section class="module-group">
      <h3>${category}</h3>
      <div class="module-grid">
        ${activities.filter((activity) => activity.category === category).map((activity) => `
          <button class="module-card" data-module="${activity.id}">
            <span class="module-icon" aria-hidden="true">${activity.icon}</span>
            <span class="module-copy"><span class="module-title">${activity.title}</span><span class="module-sub">${activity.subtitle}</span></span>
            <span class="module-open" aria-hidden="true">›</span>
          </button>`).join('')}
      </div>
    </section>`).join('');
  hub.innerHTML = `
    <section class="hero">
      <h1>${hello}</h1>
      <p>Where shall we go${name ? ', ' + name : ''}?</p>
    </section>
    <section class="worlds-section"><span class="section-kicker">FULL GAME CHAPTERS</span><h2>Explore a dinosaur world</h2><p>Each tile opens a complete collection from one of the original games.</p>
    <div class="chapter-grid">
      ${chapters.map((c) => `
        <button class="chapter-card" data-chapter="${c.id}">
          <span class="chapter-icon" aria-hidden="true">${c.icon}</span>
          <span class="chapter-title">${c.title}</span>
          <span class="chapter-sub">${c.subtitle}</span>
      </button>`).join('')}
    </div></section>
    <section class="activities-section"><div class="activities-heading"><span class="section-kicker">${activities.length} NEW QUICK-PLAY GAMES</span><h2>Dinosaur Universe originals</h2><p>These games were made for this shared universe. They are separate activities, beyond the full Dino Park and Dino Meadow chapters above.</p></div>${activityGroups}</section>
    <button class="pill" id="renameBtn">✏️ Change name</button>`;
  for (const c of chapters) {
    document.querySelector(`[data-chapter="${c.id}"]`).onclick = () => openChapter(c);
  }
  for (const activity of activities) {
    document.querySelector(`[data-module="${activity.id}"]`).onclick = () => openChapter({
      title: activity.title,
      url: 'chapters/adventures/index.html?activity=' + encodeURIComponent(activity.id),
    });
  }
  document.querySelector('#renameBtn').onclick = () => nameDialog(false);
}

function openChapter(c) {
  hub.hidden = true;
  stage.hidden = false;
  stageTitle.textContent = c.title;
  frame.title = c.title;
  frame.src = c.url;
  broadcast();
  window.scrollTo(0, 0);
}

// ---------- Boot ----------
document.querySelector('#soundBtn').onclick = () => { settings.sound = !settings.sound; saveSettings(); };
document.querySelector('#parentsBtn').onclick = parentsDialog;
document.querySelector('#backBtn').onclick = renderMenu;
document.querySelector('#soundBtn').textContent = settings.sound ? '🔊' : '🔇';

renderMenu();
if (!localStorage.getItem('du-name-seen')) {
  try { localStorage.setItem('du-name-seen', '1'); } catch {}
  nameDialog(true);
}
