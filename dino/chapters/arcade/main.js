import { CATALOG, byId, LOADERS } from './catalog.js?v=du-b206df16c491b071';
import { emblemFor } from './emblems.js?v=du-b206df16c491b071';
import {
  W, metrics, makeScene, ArcadeAudio, readSave, saveStars, shell,
  starsMarkup, bestFor
} from './engine.js?v=du-b206df16c491b071';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const MUTE_KEY = 'du-arcade-muted';
const EMBEDDED = window.self !== window.top;

const audio = new ArcadeAudio();
shell.audio = audio;
audio.muted = localStorage.getItem(MUTE_KEY) === '1';

let game = null;
let scene = null;
let current = null;
let mode = 'menu';
let lastPortrait = metrics().portrait;
let resizeTimer = 0;
let noticeTimer = 0;
let soundOn = !audio.muted;

const FEATHER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 3.6c-6.2-.6-11.8 3.4-13.2 9.5-.5 2.2-.2 4.4.8 6.2l-2.7 2.7 1.8 1.8 2.6-2.6c1.9 1 4.1 1.1 6.2.5 6-1.7 9.7-7.5 9-13.7-.2-1.5-.8-2.9-1.7-4l-2.8 2.4z"/></svg>';

function setMode(next) {
  mode = next;
  document.body.dataset.mode = next;
  $('menu').hidden = next !== 'menu';
  $('cover').hidden = next !== 'cover';
  $('instruments').hidden = !(next === 'play' || next === 'pause');
  $('pause').hidden = next !== 'play';
  $('results').hidden = next !== 'results';
  $('pausePanel').hidden = next !== 'pause';
  $('hint').hidden = next === 'menu' || next === 'cover';
}

function miniStars(n) {
  return `<span class="mini-stars" aria-label="${n} of 3">${[0, 1, 2].map((i) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" class="${i < n ? 'lit' : ''}"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>`).join('')}</span>`;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
function numberWords(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
}

function renderMenu() {
  const word = numberWords(CATALOG.length);
  $('menuCount').textContent = word.charAt(0).toUpperCase() + word.slice(1) + ' small worlds';
  $('menuWays').textContent = word + ' ways';
  const save = readSave();
  $('gameGrid').innerHTML = CATALOG.map((g, i) => {
    const best = Number(save[g.id]) || 0;
    return `<button class="game-card" type="button" data-game="${g.id}" style="--accent:${g.accent};--i:${i}">
      <span class="gc-no">${String(g.no).padStart(2, '0')}</span>
      <span class="gc-art">${emblemFor(g)}</span>
      <span class="gc-body">
        <span class="gc-title">${g.title}${best ? miniStars(best) : ''}</span>
        <span class="gc-tag">${g.tagline}</span>
      </span>
      <span class="gc-open" aria-hidden="true">→</span>
    </button>`;
  }).join('');
  document.querySelectorAll('[data-game]').forEach((el) => {
    el.addEventListener('click', () => select(el.dataset.game));
  });
}

function setPalette(g) {
  document.body.dataset.mood = g.mood;
  document.documentElement.style.setProperty('--accent', g.accent);
}

function select(id, startNow) {
  const g = byId(id);
  if (!g) return;
  dispose();
  current = g;
  setPalette(g);
  audio.ui();
  $('coverNo').textContent = String(g.no).padStart(2, '0');
  $('coverMood').textContent = g.mood.charAt(0).toUpperCase() + g.mood.slice(1) + ' world';
  $('coverTitle').textContent = g.title;
  $('coverCopy').textContent = g.tagline;
  $('coverHow').textContent = g.how;
  $('coverControls').textContent = g.controls;
  const best = bestFor(g.id);
  $('coverBest').innerHTML = best ? `${miniStars(best)}<span>${best} of 3 stars</span>` : 'Not yet played';
  setMode('cover');
  history.replaceState(null, '', `?game=${g.id}`);
  if (startNow) start();
}

function setHint(g) {
  const touch = matchMedia('(pointer: coarse)').matches;
  $('hint').textContent = touch ? g.controls : `${g.controls} · Esc rests the world`;
}

function makeGame(g) {
  const M = metrics();
  setHint(g);
  const Scene = makeScene({ ...g, ...g.module, create: g.module.create, update: g.module.update });
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'air',
    width: W,
    height: M.H,
    backgroundColor: '#0b1a20',
    transparent: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
    audio: { noAudio: true },
    scene: [Scene]
  });
}

async function start() {
  if (!current) return;
  const g = current;
  const startBtn = $('startBtn');
  startBtn.disabled = true;
  startBtn.querySelector('span').textContent = 'Opening…';
  try {
    if (!g.module) {
      const mod = await LOADERS[g.id]();
      g.module = mod.default || mod;
      // a game's own thresholds and palette win over the menu's display copy
      g.stars = g.module.stars || g.stars;
      g.mood = g.module.mood || g.mood;
      g.unit = g.module.unit || g.unit;
    }
    audio.init();
    audio.setMuted(!soundOn);
    dispose();
    setMode('play');
    $('instGame').textContent = g.title;
    $('instUnit').textContent = g.unit;
    $('instScore').textContent = '0';
    $('instHearts').innerHTML = '';
    $('instExtra').textContent = '';
    $('instBar').style.width = '0%';
    game = makeGame(g);
  } catch (err) {
    console.error(err);
    notice('That world would not open. Try again.', 2600);
    setMode('cover');
  } finally {
    startBtn.disabled = false;
    startBtn.querySelector('span').textContent = 'Enter the world';
  }
}

function dispose() {
  if (game) {
    try { game.destroy(true); } catch { /* already gone */ }
    game = null;
  }
  scene = null;
  $('air').innerHTML = '';
}

function notice(text, ms = 1900) {
  const el = $('notice');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function togglePause() {
  if (!scene || scene.finished) return;
  if (mode === 'play') {
    scene.setPaused(true);
    setMode('pause');
  } else if (mode === 'pause') {
    audio.init();
    scene.setPaused(false);
    setMode('play');
  }
}

function showResults(data) {
  const g = current;
  saveStars(g.id, data.stars);
  setMode('results');
  $('resultTitle').textContent = g.title;
  $('resultKicker').textContent = data.win ? (data.stars === 3 ? 'A perfect crossing' : 'World cleared') : 'The wild keeps its secrets';
  $('resultStars').innerHTML = starsMarkup(data.stars);
  const best = bestFor(g.id);
  $('resultLine').textContent = data.win
    ? `${data.score} ${g.unit} · ${data.stars} of 3 stars kept${data.note ? ' · ' + data.note : ''}`
    : `${data.score} ${g.unit} · best so far ${best} of 3 stars. The world will wait.`;
  $('again').querySelector('span').textContent = data.win ? 'Play it again' : 'Try again';
  const next = CATALOG[CATALOG.indexOf(g) + 1];
  $('next').hidden = !next;
  $('next').textContent = next ? `On to ${next.title} →` : '';
  $('next').onclick = () => { audio.ui(); select(next.id, true); };
  if (scene) { try { scene.scene.pause(); } catch { /* already stopped */ } }
  audio.stopMusic();
}

/* --------------------------------------------------------------- shell */
shell.onReady = (s) => {
  scene = s;
};
shell.onHud = (hud) => {
  if (!current) return;
  if (hud.score !== undefined) $('instScore').textContent = Math.round(hud.score);
  const bar = $('instBar');
  if (hud.progress === undefined || hud.progress === null) { bar.parentElement.style.visibility = 'hidden'; }
  else { bar.parentElement.style.visibility = 'visible'; bar.style.width = Math.max(0, Math.min(1, hud.progress)) * 100 + '%'; }
  if (hud.hearts !== undefined) {
    const n = Math.max(0, Math.min(3, hud.hearts));
    if ($('instHearts').childElementCount !== n) {
      $('instHearts').innerHTML = Array.from({ length: n }, () => FEATHER).join('');
    }
  }
  if (hud.extra !== undefined) $('instExtra').textContent = hud.extra;
};
shell.onNotice = (text, ms) => notice(text, ms);
shell.onFinish = showResults;

/* --------------------------------------------------------------- input */
$('startBtn').addEventListener('click', start);
$('coverBack').addEventListener('click', () => { audio.ui(); backToMenu(); });
$('home').addEventListener('click', () => { audio.ui(); backToMenu(); });
$('again').addEventListener('click', () => { audio.ui(); start(); });
$('resume').addEventListener('click', () => { audio.ui(); togglePause(); });
$('leave').addEventListener('click', () => { audio.ui(); backToMenu(); });
$('pause').addEventListener('click', togglePause);
// inside the hub the header link belongs to the hub, not to a nested page
$('back').addEventListener('click', (e) => {
  if (!EMBEDDED) return;
  e.preventDefault();
  try { window.parent.postMessage({ type: 'du-back' }, location.origin); } catch { /* standalone */ }
});

function backToMenu() {
  dispose();
  setMode('menu');
  history.replaceState(null, '', location.pathname);
  current = null;
  renderMenu();
  document.body.dataset.mood = 'dusk';
}

$('mute').addEventListener('click', () => {
  soundOn = !soundOn;
  audio.init();
  audio.setMuted(!soundOn);
  localStorage.setItem(MUTE_KEY, soundOn ? '0' : '1');
  $('mute').textContent = soundOn ? 'Sound on' : 'Sound off';
  $('mute').setAttribute('aria-pressed', String(soundOn));
});
$('mute').textContent = soundOn ? 'Sound on' : 'Sound off';
$('mute').setAttribute('aria-pressed', String(soundOn));

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (mode === 'play' || mode === 'pause')) { e.preventDefault(); togglePause(); }
  if (e.key === 'm' || e.key === 'M') $('mute').click();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'play') togglePause();
});

/* orientation only — a browser address bar changing height must not restart a run */
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const portrait = metrics().portrait;
    if (portrait === lastPortrait) return;
    lastPortrait = portrait;
    if (current && (mode === 'play' || mode === 'pause')) {
      const g = current;
      dispose();
      setMode('play');
      notice('The world turned — beginning again.', 2200);
      game = makeGame(g);
    }
  }, 320);
});

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data) return;
  if (e.data.type === 'du-settings') {
    const sound = e.data.sound;
    if (typeof sound === 'boolean' && sound !== soundOn) $('mute').click();
  }
});

/* ---------------------------------------------------------------- boot */
window.__arcade = {
  catalog: CATALOG,
  get scene() { return scene; },
  get game() { return game; },
  get current() { return current; },
  get mode() { return mode; },
  select,
  start,
  dispose,
  backToMenu,
  showResults,
  togglePause
};

renderMenu();
const wanted = params.get('game');
if (wanted && byId(wanted)) select(wanted, params.get('play') === '1');
else setMode('menu');

if (EMBEDDED) {
  try { window.parent.postMessage({ type: 'du-ready' }, location.origin); } catch { /* standalone */ }
}
