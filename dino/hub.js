// Dinosaur Universe — hub shell.
// Shared state: name (du-name), sound (du-sound). Chapters get these via postMessage.
import { chapters, activities } from './chapters.js';

const hub = document.querySelector('#hub');
const stage = document.querySelector('#stage');
const frame = document.querySelector('#chapter');
const stageTitle = document.querySelector('#stageTitle');
const toastEl = document.querySelector('#toast');
let toastTimer;

const settings = { sound: true };
try { settings.sound = JSON.parse(localStorage.getItem('du-sound') ?? 'true') !== false; } catch {}
let name = '';
try { name = localStorage.getItem('du-name') || ''; } catch {}

function toast(text) {
  toastEl.textContent = text;
  toastEl.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.display = 'none'; }, 3500);
}
function saveSound() {
  try { localStorage.setItem('du-sound', JSON.stringify(settings.sound)); } catch {}
  document.querySelector('#soundBtn').textContent = settings.sound ? '🔊' : '🔇';
  broadcast();
}
function broadcast() {
  if (frame && frame.contentWindow) {
    frame.contentWindow.postMessage({ type: 'du-settings', name, sound: settings.sound }, location.origin);
  }
}

// Re-broadcast when a chapter finishes loading (its listener may miss the first send).
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.source !== frame.contentWindow || !e.data) return;
  if (e.data.type === 'du-ready') broadcast();
  if (e.data.type === 'du-back') renderMenu();
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
      <h2>Parents</h2>
      <p class="subtle">Small controls for the whole universe. Saved on this device only.</p>
      <label class="row"><input type="checkbox" id="set-sound" ${settings.sound ? 'checked' : ''}> Sound effects</label>
      <p class="subtle">Speech and calm celebrations are set inside each chapter. Pictures and progress stay on this device.</p>
      <div class="toolbar">
        <button class="pill primary" id="save-parents">Save</button>
        <button class="pill" id="close-parents">Close</button>
      </div>
    </div>
  </div>`;
  document.querySelector('#save-parents').onclick = () => {
    settings.sound = document.querySelector('#set-sound').checked;
    saveSound();
    root.innerHTML = '';
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
    <section class="worlds-section"><h2>Explore a dinosaur world</h2><p>Open a whole world of games and discoveries.</p>
    <div class="chapter-grid">
      ${chapters.map((c) => `
        <button class="chapter-card" data-chapter="${c.id}">
          <span class="chapter-icon" aria-hidden="true">${c.icon}</span>
          <span class="chapter-title">${c.title}</span>
          <span class="chapter-sub">${c.subtitle}</span>
      </button>`).join('')}
    </div></section>
    <section class="activities-section"><div class="activities-heading"><h2>Pick an activity</h2><p>Little adventures, creative play and discoveries all live here.</p></div>${activityGroups}</section>
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
document.querySelector('#soundBtn').onclick = () => { settings.sound = !settings.sound; saveSound(); };
document.querySelector('#parentsBtn').onclick = parentsDialog;
document.querySelector('#backBtn').onclick = renderMenu;
document.querySelector('#soundBtn').textContent = settings.sound ? '🔊' : '🔇';

renderMenu();
if (!localStorage.getItem('du-name-seen')) {
  try { localStorage.setItem('du-name-seen', '1'); } catch {}
  nameDialog(true);
}
