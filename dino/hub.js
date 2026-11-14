// Dinosaur Universe — hub shell.
// Shared state: child name and parent preferences. Chapters receive them via postMessage.
import { chapters, activities } from './chapters.js?v=du-1c099b1be40dab88';
import { heroScene, chapterArt } from './hub-art.js?v=du-1c099b1be40dab88';
import { playRexRoar, stopRexRoar } from './rex-audio.js?v=du-1c099b1be40dab88';

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
  window.DUICONS.set(soundButton, settings.sound ? 'sound' : 'sound-off', {
    size: 20, label: settings.sound ? 'Turn sound off' : 'Turn sound on'
  });
  FX.configure({ sound: settings.sound, calm: settings.calmCelebrations });
  if (!settings.sound) stopRexRoar();
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
  // A chapter keeps its own store and writes the shared ledger from inside the
  // iframe; the same write reaches us here, so the map can refresh as it happens.
  if (e.data.type === 'du-journey') {
    if (window.DUJourney) window.DUJourney.reload();
    if (stage.hidden) renderMenu();
    else {
      // The child is mid-game, so the reward is armed rather than dropped on top
      // of the run: the strip turns gold and the ending plays on the way back.
      renderStageStory(stage._chapter);
      if (!storyArmed) {
        const w = pendingWorld();
        if (w) { storyArmed = w; toast('The story is ready for you! Back to the map to see what happens next ▶'); }
      }
    }
  }
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

// ---------- Progress, straight from the ledger every world writes to ----------
// Each world keeps its own key prefix in the shared star ledger: park.*, meadow.*,
// drive.*, act.* and egg.*. Reading the ledger instead of the old per-world stores
// means a star earned in any edition of any world lights up the map.
const LEDGER = { park: 'park', meadow: 'meadow', drive: 'drive', adventures: 'act', 'egg-dash': 'egg', arcade: 'arcade' };
function progress() {
  const J = window.DUJourney;
  const out = { total: 0, gems: 0, finds: 0, chapter: 0, worlds: {} };
  for (const id in LEDGER) out.worlds[id] = { stars: 0, played: 0 };
  if (!J) return out;
  for (const id in LEDGER) {
    const p = LEDGER[id];
    out.worlds[id] = { stars: J.worldStars(p), played: J.worldProgress(p).have };
  }
  out.total = J.total(); out.gems = J.gems(); out.finds = storiesSeen(J).length; out.chapter = J.chapter();
  return out;
}
/* What the child has actually been through. Wonder visitors used to write
 * themselves into the codex at random, which is why the ledger distinguishes
 * them at all; the only record left that a child can genuinely say they
 * found is the story they watched. */
function storiesSeen(J) {
  return J.finds().filter((f) => f.indexOf('story:') === 0);
}
function crystalOf(id) {
  const J = window.DUJourney, S = window.DUSTORY;
  if (!J || !S) return false;
  const c = S.CHAPTERS[S.chapterFor(id)];
  return c ? J.has('crystal:' + c.id) : false;
}
// The words a child picked, straight off the choice beat, so the map shows the
// path in the same language the story used to offer it. Half the forks now sit
// in the reward sequence, so both lists are searched.
function pickLabel(chapter, tag) {
  for (const b of (chapter.beats || []).concat(chapter.win || [])) {
    const o = b.ask && b.ask.options && b.ask.options.find((x) => x.tag === tag);
    if (o) return o.label;
  }
  return tag;
}

/* The path this child chose is part of the map, not a secret left inside a
 * cutscene: the words they picked come back to them everywhere they look.
 * The companion badge shows the animal that actually rides with them, because
 * one feather standing in for both Pip and Bumper told a child they had made
 * the same choice twice. */
function trailHtml(S) {
  if (!S || !S.trail) return '';
  const t = S.trail();
  const made = S.forksAnswered ? S.forksAnswered() : t.length;
  const total = S.forkTotal ? S.forkTotal() : 0;
  const end = S.ending ? S.ending() : null;
  const friend = S.companion ? S.FRIENDS[S.companion()] : null;
  return `<p class="sr-path">${friend ? `<b>${mateMark(friend)} Riding with ${escapeHtml(friend.name)}</b> · ` : ''}` +
    `<b>${made}</b> of ${total} choices are yours` +
    (end ? ` · heading for <b>${escapeHtml(end)}</b>` : '') + `</p>` +
    (t.length ? `<p class="sr-trail">${t.map(escapeHtml).join(' → ')}</p>` : '');
}

// Which part of the main story a page belongs to — a whole world by id, and a
// quick game through the Adventures chapter, so nothing sits outside the tale.
function chapterIndexFor(id) {
  const S = window.DUSTORY;
  if (!S) return undefined;
  const direct = S.chapterFor(id);
  if (direct !== undefined) return direct;
  return activities.some((a) => a.id === id) ? S.chapterFor('adventures') : undefined;
}

// The next story reward waiting to be handed out: a world whose stars are all
// earned but whose ending cutscene has never been seen.
function pendingWorld() {
  const J = window.DUJourney, S = window.DUSTORY;
  if (!J || !S) return null;
  for (const id in LEDGER) {
    const i = S.chapterFor(id);
    const c = i === undefined ? null : S.CHAPTERS[i];
    if (!c || !c.goal || !c.win) continue;
    if (J.has('crystal:' + c.id)) continue;
    if (J.worldStars(LEDGER[id]) >= c.goal.stars) return id;
  }
  return null;
}
let storyArmed = null;

// The 23 quick-play games, grouped the way a child chooses: what shall we do?
function groupsHtml(done) {
  const J = window.DUJourney;
  const order = ['Adventures', 'Puzzles', 'Creative', 'Cozy play', 'Discovery', 'Learning'];
  const byCat = {};
  for (const a of activities) (byCat[a.category] = byCat[a.category] || []).push(a);
  return order.filter((c) => byCat[c]).map((cat) => `
    <div class="module-group">
      <h3>${CAT_ICON[cat] || '⭐'} ${cat}</h3>
      <div class="module-grid">
        ${byCat[cat].map((a, i) => {
          const played = J && (J.played('act.' + a.id) || J.stars('act.' + a.id));
          return `
        <button class="module-card du-in${played ? ' played' : ''}" data-activity="${a.id}" style="--du-delay:${i * .06}s">
          <span class="module-icon" style="--tint:${TINTS[a.category] || '#edf6ed'}">${a.icon}</span>
          <span class="module-copy">
            <span class="module-title">${a.title}</span>
            <span class="module-sub">${a.subtitle}</span>
          </span>
          ${played ? '<span class="module-badge" aria-label="played">⭐</span>' : ''}
          <span class="module-open" aria-hidden="true">▶</span>
        </button>`;
        }).join('')}
      </div>
    </div>`).join('');
}

/* Wonder belongs to whichever page is showing: the hub owns the screen between
 * chapters, the iframe owns it inside one. */
function pauseWonder() { if (window.DUWONDER) window.DUWONDER.stop(); }
function resumeWonder() { if (window.DUWONDER && !window.DUWONDER.running()) window.DUWONDER.start({ world: 'hub' }); }

// ---------- Menu ----------
const TINTS = { 'Puzzles': '#e6e3f5', 'Cozy play': '#fae8d5', 'Creative': '#f7e1d7', 'Discovery': '#dff0e8', 'Learning': '#dceef5', 'Adventures': '#f5e4cb' };
const CAT_ICON = { 'Puzzles': '🧩', 'Cozy play': '🪹', 'Creative': '🎨', 'Discovery': '🔭', 'Learning': '🌱', 'Adventures': '🗺️' };
let sayTimer = 0, parallaxOff = null, emberTimer = 0;

/* A companion badge shows the animal that actually travels with you, in the
 * same animated form the story stages use — it used to choose between a wing
 * and a mammoth, and only one of those two lives here. */
function mateMark(friend) {
  const F = window.DUFX;
  return F && F.dinoHTML && friend.species ? F.dinoHTML(friend.species, { state: 'happy', color: friend.colour, size: '22px' }) : '';
}

function wave(text) { return [...text].map((ch, i) => `<span style="--i:${i}">${escapeHtml(ch)}</span>`).join(''); }

function renderMenu() {
  stage.hidden = true;
  document.body.classList.remove('in-stage');
  frame.removeAttribute('src');
  frame.classList.remove('ready');
  hub.hidden = false;
  resumeWonder();
  const done = progress();
  const hello = name ? `Hello, ${name}!` : 'Hello!';
  const chips = {};
  for (const id in done.worlds) {
    const w = done.worlds[id];
    if (!w.stars && !w.played) continue;
    chips[id] = `⭐ ${w.stars}` + (w.played ? ` · ${w.played} played` : '');
  }
  const J = window.DUJourney, S = window.DUSTORY;
  const arc = S ? S.CHAPTERS : [];
  const here = J ? J.nextChapter() : 0;
  const chapter = arc[here];
  hub.innerHTML = `
    <section class="hero-scene" data-tod="${tod}">
      ${heroScene()}
      <div class="hs-greet"><h1 class="wave">${wave(hello)}</h1><p>Where shall we go${name ? ', ' + escapeHtml(name) : ''}?</p></div>
      <span class="hs-hint">Tap Rex! Tap the sun!</span>
    </section>
    ${chapter ? `
    <section class="story-ribbon du-in">
      <span class="sr-crystals">${arc.map((c, i) =>
        `<span class="sr-pip${J && J.has('crystal:' + c.id) ? ' won' : i === here ? ' now' : ''}" title="${escapeHtml(c.title)}"></span>`).join('')}</span>
      <div class="sr-body">
        <span class="section-kicker">THE STARLIGHT GARDEN · PART ${here + 1} OF ${arc.length}</span>
        <h2>${escapeHtml(chapter.title)}</h2>
        <p>${escapeHtml(S.fill((chapter.goal && chapter.goal.text) || chapter.beats[0].text))}</p>
        ${trailHtml(S)}
        <div class="toolbar">
          <button class="pill primary" id="storyBtn">📖 Play this part</button>
          <button class="pill" id="allStoryBtn">The whole story</button>
          <button class="pill" id="cinemaBtn">🎬 The beginning</button>
        </div>
      </div>
    </section>` : ''}
    <section class="worlds-section"><span class="section-kicker">${chapters.filter((c) => !c.artId).length} FULL DINO WORLDS</span><h2>Explore a dinosaur world</h2><p>Each world is a whole game of its own, with lots to find and do.</p>
    <div class="chapter-grid">
      ${chapters.map((c, i) => `
        <button class="chapter-card du-in${chips[c.id] ? ' begun' : ''}" data-chapter="${c.id}" style="--du-delay:${i * .12 + .2}s">
          <span class="cc-art">${chapterArt(c.artId || c.id)}<span class="cc-play" aria-hidden="true">▶</span></span>
          <span class="cc-body">
            <span class="chapter-title">${c.title}</span>
            <span class="chapter-sub">${c.subtitle}</span>
            ${!c.artId && chips[c.id] ? `<span class="cc-chip">${chips[c.id]}</span>` : ''}
          </span>
          ${crystalOf(c.id) ? '<span class="cc-crystal" title="You finished this world\'s story">💎</span>' : ''}
      </button>`).join('')}
    </div></section>
    <section class="activities-section">
      <span class="section-kicker activities-heading">${activities.length} QUICK-PLAY GAMES</span>
      <h2>Or pop in for just one game</h2>
      <p>Short ones, all still in the universe. Every game you finish adds a star to your Journey.</p>
      ${groupsHtml(done)}
    </section>
    <button class="pill" id="renameBtn">✏️ Change name</button>`;
  applyTod();
  for (const c of chapters) {
    const el = document.querySelector(`[data-chapter="${c.id}"]`);
    el.onclick = (e) => openChapter(c, e);
    tilt(el);
  }
  document.querySelector('#renameBtn').onclick = () => nameDialog(false);
  const sb = document.querySelector('#storyBtn');
  if (sb) sb.onclick = () => window.DUSTORY.play(here, {});
  const asb = document.querySelector('#allStoryBtn');
  if (asb) asb.onclick = journeyDialog;
  const cb = document.querySelector('#cinemaBtn');
  if (cb) cb.onclick = () => window.DUINTRO && DUINTRO.play({ replay: true });
  for (const a of activities) {
    const el = document.querySelector(`[data-activity="${a.id}"]`);
    el.onclick = (e) => openChapter({ id: a.id, title: a.title, url: 'chapters/adventures/index.html?activity=' + encodeURIComponent(a.id) }, e);
  }
  wireHero();
}

// ---------- The Journey map ----------
// One screen that answers "what have I done, and what is left to find?" — the
// story path, every world's stars, and the codex of friends and wonders.
function journeyDialog() {
  const J = window.DUJourney, S = window.DUSTORY;
  if (!J) { toast('Your journey is still being written…'); return; }
  const done = progress();
  const arc = S ? S.CHAPTERS : [];
  const picks = S ? S.picks() : {};
  const path = arc.filter((c) => picks[c.id]).map((c) => ({ c, label: pickLabel(c, picks[c.id]) }));
  const root = document.querySelector('#modal-root');
  const fill = (t) => (S ? S.fill(t || '') : String(t || ''));
  root.innerHTML = `
  <div class="modal-backdrop">
    <div class="modal modal-wide" role="dialog" aria-label="My journey">
      <h2>🗺️ ${escapeHtml(name ? name + '’s Journey' : 'Your Journey')}</h2>
      <div class="jy-totals">
        <span class="jy-pill">⭐ <b>${done.total}</b> stars</span>
        <span class="jy-pill">💎 <b>${done.gems}</b> treasures</span>
        <span class="jy-pill">📖 <b>${done.finds}</b> chapters witnessed</span>
        <span class="jy-pill">🌟 <b>${arc.filter((c) => J.has('crystal:' + c.id)).length} / ${arc.length}</b> story crystals</span>
      </div>

      <h3 class="jy-h">The Starlight Garden</h3>
      <ol class="jy-path">
        ${arc.map((c, i) => {
          const won = J.has('crystal:' + c.id);
          const now = i === J.nextChapter();
          return `<li class="jy-step${won ? ' won' : now ? ' now' : ''}">
            <button data-chapter-story="${i}"><span class="jy-num">${i + 1}</span>
            <span class="jy-what"><b>${escapeHtml(c.title)}</b><i>${escapeHtml(fill((c.goal && c.goal.text) || ((S.beats(i) || [])[0] || {}).text))}</i></span>
            <span class="jy-mark">${won ? '💎' : now ? '▶' : '·'}</span></button></li>`;
        }).join('')}
      </ol>

      ${path.length ? `<h3 class="jy-h">The way you chose</h3>
      <ul class="jy-picks">
        ${path.map((p) => `<li><b>${escapeHtml(p.c.title.split(' and ')[0].split('The ').pop())}</b><i>${escapeHtml(p.label)}</i></li>`).join('')}
      </ul>
      <p class="jy-wonders">${path.length >= 4 ? 'That is your own ending — the Starlight Garden remembers it.' : 'Choose again in a story and your ending changes too.'}</p>` : ''}

      <h3 class="jy-h">Every world</h3>
      <ul class="jy-worlds">
        ${chapters.map((c) => {
          const w = done.worlds[c.id] || { stars: 0, played: 0 };
          return `<li><button data-jy-open="${c.id}">
            <span class="jy-icon">${c.icon}</span>
            <span class="jy-what"><b>${escapeHtml(c.title)}</b><i>${w.played ? `${w.played} game${w.played === 1 ? '' : 's'} played` : 'Not visited yet'}</i></span>
            <span class="jy-stars">${window.DUICONS.stars(Math.min(3, Math.round(w.stars / 3)), { max: 3 })}${w.stars ? ' ' + w.stars + ' ' + window.DUICONS.i('star', { size: 14, filled: true }) : ''}${crystalOf(c.id) ? ' 💎' : ''}</span>
          </button></li>`;
        }).join('')}
      </ul>

      <div class="toolbar">
        <button class="pill primary" type="button" id="closeJourney">Back to the worlds</button>
      </div>
    </div>
  </div>`;
  root.querySelector('#closeJourney').onclick = () => { root.innerHTML = ''; };
  root.querySelector('.modal-backdrop').addEventListener('pointerdown', (e) => {
    if (e.target === e.currentTarget) root.innerHTML = '';
  });
  root.querySelectorAll('[data-chapter-story]').forEach((b) => {
    b.onclick = () => { root.innerHTML = ''; S.play(Number(b.dataset.chapterStory), {}); };
  });
  root.querySelectorAll('[data-jy-open]').forEach((b) => {
    b.onclick = (e) => {
      const c = chapters.find((x) => x.id === b.dataset.jyOpen);
      root.innerHTML = '';
      if (c) openChapter(c, e);
    };
  });
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
  // Photographic Rex uses a whole-body breathing and roar animation.
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
  hero.querySelector('.hs-rex').addEventListener('click', (e) => {
    FX.dinoState(rex, 'roar', 3300); playRexRoar(); FX.shakeScreen(4);
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

const CHAPTER_COLOUR = { park: '#ff8a4d', meadow: '#7fd16e', drive: '#4aa8ff', arcade: '#ff8f5e' };
/* The main story travels with the child into the game: which part this is, how
 * close the goal is, who is riding with them, and the way to the reward
 * cutscene. A quick game belongs to the Adventures chapter rather than having
 * no story at all, so nothing on the site sits outside the tale. */
function renderStageStory(c) {
  const bar = document.querySelector('#stagebar');
  const J = window.DUJourney, S = window.DUSTORY;
  let el = bar.querySelector('#stageStory');
  if (!el) { el = document.createElement('span'); el.id = 'stageStory'; bar.appendChild(el); }
  const i = S ? chapterIndexFor((c && (c.artId || c.id)) || '') : undefined;
  if (!S || i === undefined) { el.innerHTML = ''; return; }
  const ch = S.CHAPTERS[i];
  const prefix = LEDGER[ch.world];
  const have = prefix && J ? J.worldStars(prefix) : 0;
  const need = (ch.goal && ch.goal.stars) || 0;
  const won = need > 0 && have >= need;
  const friend = S.companion ? S.FRIENDS[S.companion()] : null;
  el.innerHTML = `<span class="ss-part">PART ${i + 1} OF ${S.count}</span>` +
    `<span class="ss-title">${escapeHtml(ch.title)}</span>` +
    (need ? `<span class="ss-goal${won ? ' met' : ''}">${won ? '🎉' : '⭐'} ${have} / ${need}</span>` : '') +
    (friend ? `<span class="ss-mate">${mateMark(friend)} ${escapeHtml(friend.name)}</span>` : '') +
    `<button class="pill ss-btn" id="stageStoryBtn" type="button">${won ? '🎉 See what happens next' : '📖 This part of the story'}</button>`;
  el.querySelector('#stageStoryBtn').onclick = () => {
    if (!won) return S.play(i, {});
    if (J && J.has('crystal:' + ch.id)) return S.play(i, { mode: 'win' });
    storyArmed = null;
    S.celebrateWorld(ch.world);
  };
}
function openChapter(c, e) {
  const x = e && e.clientX ? e.clientX : innerWidth / 2, y = e && e.clientY ? e.clientY : innerHeight / 2;
  const go = () => {
    pauseWonder();
    hub.hidden = true;
    stopRexRoar();
    stage.hidden = false;
    document.body.classList.add('in-stage');
    FX.ambient(null);
    loader.classList.remove('off');
    loader.innerHTML = FX.dinoHTML(['trex', 'tricera', 'stego', 'bronto', 'raptor'][Math.floor(Math.random() * 5)], { state: 'walk' });
    frame.classList.remove('ready');
    stageTitle.textContent = c.title;
    stage._chapter = c;
    renderStageStory(c);
    frame.title = c.title;
    frame.src = c.url;
    clearTimeout(frame._guard);
    frame._guard = setTimeout(frameReady, 3500);   // never leave a child staring at a blank frame
    broadcast();
    window.scrollTo(0, 0);
  };
  // The story of a world is told the first time a child sets foot in it, and
  // never again: the arc only ever adds context, it never withholds a game, and
  // a rerun goes straight to the door. Single activities are not worlds, so the
  // ledger lookup simply calls them back immediately.
  const enter = () => FX.iris(x, y, go, CHAPTER_COLOUR[c.artId || c.id] || '#0b6e5f');
  if (window.DUSTORY) DUSTORY.intro(c.id, enter); else enter();
}
function frameReady() {
  clearTimeout(frame._guard);
  frame.classList.add('ready');
  loader.classList.add('off');
}
frame.addEventListener('load', () => { if (frame.getAttribute('src')) setTimeout(frameReady, 80); });
function closeChapter() {
  const b = document.querySelector('#backBtn').getBoundingClientRect();
  FX.iris(b.left + b.width / 2, b.top + b.height / 2, () => {
    renderMenu(); window.scrollTo(0, 0);
    // The reward cutscene is the end of a chapter, so it plays the moment a
    // child is back on the map and free to watch it. Nothing is ever locked:
    // the story only ever arrives on top of a game that is already finished.
    const w = storyArmed || pendingWorld();
    storyArmed = null;
    if (w && window.DUSTORY) setTimeout(() => DUSTORY.celebrateWorld(w), 450);
  }, '#0b6e5f');
}

// ---------- Boot ----------
document.querySelector('#soundBtn').onclick = () => { settings.sound = !settings.sound; saveSettings(); if (settings.sound) FX.sfx.good(); };
document.querySelector('#journeyBtn').onclick = journeyDialog;
document.querySelector('#parentsBtn').onclick = parentsDialog;
document.querySelector('#backBtn').onclick = closeChapter;
window.DUICONS.set(document.querySelector('#soundBtn'), settings.sound ? 'sound' : 'sound-off', { size: 20, label: settings.sound ? 'Turn sound off' : 'Turn sound on' });

renderMenu();
let askForName = false;
try {
  askForName = !localStorage.getItem('du-name-seen');
  if (askForName) localStorage.setItem('du-name-seen', '1');
} catch { /* The game remains playable when browser storage is unavailable. */ }

// A first visit should open on the universe itself, not on a form. The film
// needs a tap to begin, because that tap is what lets a browser make any
// sound at all, so it asks for it on its own title card and only then reaches
// for the child's name.
const deepLinked = !!params.get('open');
if (askForName && !deepLinked && window.DUINTRO && DUINTRO.needs()) {
  DUINTRO.play({ onDone: () => nameDialog(true) });
} else if (askForName && !deepLinked) {
  nameDialog(true);
}

// Deep links: ?open=park | meadow | drive | <activity id>
const wanted = params.get('open');
if (wanted) {
  const c = chapters.find((x) => x.id === wanted), a = activities.find((x) => x.id === wanted);
  if (c) openChapter(c);
  else if (a) openChapter({ title: a.title, url: 'chapters/adventures/index.html?activity=' + encodeURIComponent(a.id) });
}
