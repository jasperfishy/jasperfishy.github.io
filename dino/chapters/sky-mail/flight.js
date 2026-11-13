import { addEnvironment } from '../../photoreal-environments.js?v=du-58e7197a7bd67562';
// Prehistoric Sky Mail — a pterosaur courier flight.
// Phaser 3.80, procedural illustration, synthesized score, three routes.

import { makeAtlas, PALETTES } from './atlas.js?v=du-58e7197a7bd67562';
import { SkyAudio } from './audio.js?v=du-58e7197a7bd67562';

const W = 960;

// The flight is the same courier run in both shapes of sky: a wide ridge line
// in landscape, and a tall one on a phone. Portrait raises the ceiling, lifts
// the sun, and turns the top spire into a floating island.
function metrics() {
  const portrait = window.innerWidth < 900 && window.innerHeight > window.innerWidth * 1.05;
  if (!portrait) {
    return {
      portrait: false, H: 540, offY: 0, band: 1, playerX: 258, playerMin: 66, playerMax: 478,
      pointerMin: 74, pointerMax: 468, postBottom: 585, postScale: 0.72, cliff: 362,
      topThresh: 244, bottomThresh: 336, topY: -5, bottomY: 545, bottomScale: 0.86,
      thermalY: 540
    };
  }
  return {
    portrait: true, H: 1920, offY: 560, band: 2.22, playerX: 330, playerMin: 640, playerMax: 1720,
    pointerMin: 724, pointerMax: 1720, postBottom: 1880, postScale: 0.8, cliff: 1638,
    topThresh: 955, bottomThresh: 1546, topY: 520, bottomY: 1900, bottomScale: 1.3,
    islandTip: 990, thermalY: 1780
  };
}

let M = metrics();
const Y = (v) => M.offY + v * M.band;
const SAVE_KEY = 'du-sky-mail-v1';
const UNIVERSE_KEY = 'dinosaur-universe-player-v1';

const ROUTES = [
  { id: 'dawn', name: 'Dawn Ridge', no: '01', palette: 'dawn', speed: 198, breeze: 'A warm updraft', blurb: 'A fern sea at first light. Three rookeries are waiting.' },
  { id: 'dusk', name: 'Amber Canyon', no: '02', palette: 'dusk', speed: 218, breeze: 'Crosswinds at sundown', blurb: 'Hot stone, long shadows, and a storm on the rim.' },
  { id: 'night', name: 'Moonlit Cliffs', no: '03', palette: 'night', speed: 238, breeze: 'Cold sea wind', blurb: 'Lantern light on black water. The last letters of the day.' }
];

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readProgress() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch { return {}; }
}
function writeProgress(p) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch { /* progress is a bonus, not a gate */ }
}
function recordUniverse() {
  try {
    const u = JSON.parse(localStorage.getItem(UNIVERSE_KEY) || '{}') || {};
    u.completed = Array.isArray(u.completed) ? u.completed : [];
    u.levels = u.levels && typeof u.levels === 'object' ? u.levels : {};
    if (!u.completed.includes('skymail')) {
      u.completed.push('skymail');
      u.levels.skymail = (Number(u.levels.skymail) || 0) + 1;
      u.stars = (Number(u.stars) || 0) + 1;
    }
    localStorage.setItem(UNIVERSE_KEY, JSON.stringify(u));
  } catch { /* storage may be unavailable in private mode */ }
}

const audio = new SkyAudio();
let gameScene = null;
let selectedRoute = 0;
let calm = false;
let noticeTimer = null;
let noticeQueue = Promise.resolve();

function notice(text, ms = 2400) {
  const node = $('notice');
  noticeQueue = noticeQueue.then(() => new Promise((resolve) => {
    node.textContent = text;
    node.classList.add('show');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      node.classList.remove('show');
      setTimeout(resolve, 220);
    }, ms);
  }));
}

function setMode(mode) {
  document.body.dataset.mode = mode;
}

function starsMarkup(n) {
  let out = '';
  for (let i = 0; i < 3; i++) {
    out += `<svg viewBox="0 0 24 24" class="${i < n ? 'lit' : ''}" aria-hidden="true"><path d="M12 2.6l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.4l-5.6 3.3 1.4-6.3L3 9.1l6.4-.6z"/></svg>`;
  }
  return out;
}

function paintMenu() {
  const p = readProgress();
  const unlocked = Math.max(1, Number(p.unlocked) || 1);
  selectedRoute = clamp(Number(p.lastRoute) || 0, 0, unlocked - 1);
  const line = $('routeLine');
  line.innerHTML = '';
  ROUTES.forEach((route, i) => {
    const b = document.createElement('button');
    b.className = 'route' + (i === selectedRoute ? ' chosen' : '') + (i >= unlocked ? ' locked' : '');
    b.disabled = i >= unlocked;
    b.innerHTML = `<span>${route.no}</span>${route.name}<em>${i >= unlocked ? 'locked' : (p.best && p.best[route.id]) ? 'best ' + p.best[route.id].stars + '/3' : 'unflown'}</em>`;
    b.addEventListener('click', () => {
      if (i >= unlocked) return;
      selectedRoute = i;
      audio.ui();
      paintMenu();
    });
    line.appendChild(b);
  });
  const r = ROUTES[selectedRoute];
  document.body.dataset.palette = r.id;
  $('copy').innerHTML = `${r.blurb}<br><span class="breeze">${r.breeze}</span>`;
  $('flightNo').textContent = r.no;
  const best = p.best && p.best[ROUTES[selectedRoute].id];
  $('best').textContent = best ? `Best passage: ${best.stars} of 3 stars · ${best.time}s` : 'No letter has yet crossed this sky.';
}

function launch(index) {
  selectedRoute = clamp(index, 0, ROUTES.length - 1);
  document.body.dataset.palette = ROUTES[selectedRoute].id;
  audio.init();
  audio.setMuted(localStorage.getItem('du-sky-muted') === '1');
  audio.setRoute(ROUTES[selectedRoute].id);
  audio.ui();
  $('results').hidden = true;
  $('pausePanel').hidden = true;
  setMode('flight');
  const begin = () => phaserGame.scene.start('flight', { route: selectedRoute });
  if (phaserGame.isBooted) begin();
  else phaserGame.events.once('ready', begin);
}

function openMenu() {
  audio.stopMusic();
  setMode('title');
  $('results').hidden = true;
  $('pausePanel').hidden = true;
  paintMenu();
  if (phaserGame && phaserGame.isBooted) phaserGame.scene.start('attract');
}

function toggleMute() {
  const muted = localStorage.getItem('du-sky-muted') !== '1';
  localStorage.setItem('du-sky-muted', muted ? '1' : '0');
  audio.setMuted(muted);
  $('mute').textContent = muted ? 'Sound off' : 'Sound on';
  $('mute').setAttribute('aria-pressed', String(!muted));
}

function showResults(data) {
  const { route, success, stars, time, misses, hearts } = data;
  setMode('results');
  $('resultKicker').textContent = success ? `Flight ${route.no} · logged` : `Flight ${route.no} · letters returned`;
  $('resultTitle').textContent = success ? route.name : 'A second attempt';
  $('resultStars').innerHTML = success ? starsMarkup(stars) : starsMarkup(0);
  $('resultLine').textContent = success
    ? `${time}s aloft · ${misses === 0 ? 'no missed rookeries' : misses + ' second pass' + (misses === 1 ? '' : 'es')} · ${hearts} of 3 feathers kept`
    : 'The letters stayed aboard. The sky will still be there.';
  $('next').hidden = !(success && selectedRoute < ROUTES.length - 1);
  $('next').textContent = success && selectedRoute < ROUTES.length - 1 ? `On to ${ROUTES[selectedRoute + 1].name} →` : '';
  $('results').hidden = false;
}

document.addEventListener('DOMContentLoaded', () => {
  // module runs after DOM anyway; kept for clarity
});

$('launch').addEventListener('click', () => launch(selectedRoute));
$('mute').addEventListener('click', toggleMute);
$('again').addEventListener('click', () => launch(selectedRoute));
$('next').addEventListener('click', () => launch(selectedRoute + 1));
$('home').addEventListener('click', openMenu);
$('pause').addEventListener('click', () => { if (gameScene) gameScene.togglePause(); });
$('resume').addEventListener('click', () => { if (gameScene) gameScene.togglePause(); });
$('leave').addEventListener('click', openMenu);

if (matchMedia('(pointer: coarse)').matches) {
  $('hint').textContent = 'Guide with your finger · hold to ride the wind';
}

window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'du-settings') return;
  if (e.data.sound === false || e.data.sound === 'off') {
    audio.setMuted(true);
    $('mute').textContent = 'Sound off';
  }
  calm = !!e.data.calmCelebrations || !!e.data.calm;
});
window.parent.postMessage({ type: 'du-ready' }, '*');

window.addEventListener('visibilitychange', () => {
  if (document.hidden && gameScene && gameScene.running && !gameScene.paused) gameScene.togglePause();
});

// ---- backdrop --------------------------------------------------------------
class Backdrop {
  constructor(scene, palId, opts = {}) {
    this.scene = scene;
    this.pal = PALETTES[palId];
    this.palId = palId;
    this.opts = opts;
    addEnvironment(scene,W,M.H,/night|moon/.test(palId)?'night':'mountain',9.1);
    const tall = M.portrait;
    this.far = scene.add.image(0, 0, `sky-${palId}`).setOrigin(0).setDepth(0);
    const sunX = tall ? 620 : (opts.sunX ?? 780);
    const sunY = tall ? 340 : (opts.sunY ?? 140);
    this.sun = scene.add.image(sunX, sunY, 'glow')
      .setScale(tall ? 2.5 : 1.65).setAlpha(0.75).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    this.disc = scene.add.circle(sunX, sunY, palId === 'night' ? 20 : (tall ? 46 : 34),
      Phaser.Display.Color.HexStringToColor(this.pal.sun).color, 0.9).setDepth(2);
    this.discGlow = scene.add.image(sunX, sunY, 'glow')
      .setScale(tall ? 1.2 : 0.75).setTint(0xfff0c0).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);

    if (palId === 'night') {
      this.disc.setVisible(false);
      this.discGlow.setVisible(false);
      this.moon = scene.add.image(sunX, sunY, 'moon').setScale(tall ? 1.05 : 0.72).setDepth(2);
      this.stars = scene.add.container(0, 0).setDepth(1);
      const rand = mulberry32(4113);
      const count = tall ? 130 : 70;
      for (let i = 0; i < count; i++) {
        const s = scene.add.circle(rand() * W, rand() * (tall ? 1120 : 300), rand() > 0.82 ? 1.5 : 1, 0xfdf6da, 0.4 + rand() * 0.5);
        this.stars.add(s);
        if (!reducedMotion && i % 4 === 0) {
          scene.tweens.add({ targets: s, alpha: 0.15, duration: 1400 + rand() * 2600, yoyo: true, repeat: -1, delay: rand() * 3000 });
        }
      }
    }

    this.clouds = [];
    const bands = tall
      ? [
        { key: 'cloud-c', y: 150, alpha: 0.42, factor: 0.03 },
        { key: 'cloud-b', y: 330, alpha: 0.6, factor: 0.055 },
        { key: 'cloud-a', y: 520, alpha: 0.72, factor: 0.085 },
        { key: 'cloud-c', y: 760, alpha: 0.34, factor: 0.115 },
        { key: 'cloud-b', y: 1040, alpha: 0.28, factor: 0.15 },
        { key: 'cloud-a', y: 1280, alpha: 0.3, factor: 0.19 }
      ]
      : [
        { key: 'cloud-c', y: 46, alpha: 0.5, factor: 0.035 },
        { key: 'cloud-b', y: 152, alpha: 0.78, factor: 0.075 },
        { key: 'cloud-a', y: 238, alpha: 0.92, factor: 0.13 }
      ];
    bands.forEach((b) => {
      const t = scene.add.tileSprite(0, b.y, W, 260, `${b.key}-${palId}`).setOrigin(0).setAlpha(b.alpha).setDepth(3);
      t.factor = b.factor;
      this.clouds.push(t);
    });

    this.ridges = [];
    const ridgeBase = tall ? 1920 : 540;
    const ridges = [
      { key: `ridge-far-${palId}`, y: ridgeBase, depth: 6, alpha: 0.9, factor: 0.09 },
      { key: `ridge-mid-${palId}`, y: ridgeBase + 5, depth: 7, alpha: 0.96, factor: 0.2 },
      { key: `ridge-near-${palId}`, y: ridgeBase + 15, depth: 8, alpha: 1, factor: 0.42 }
    ];
    ridges.forEach((r) => {
      const t = scene.add.tileSprite(0, r.y, W, 460, r.key).setOrigin(0, 1).setDepth(r.depth).setAlpha(r.alpha);
      t.factor = r.factor;
      this.ridges.push(t);
    });

    this.mistA = scene.add.tileSprite(0, tall ? 1140 : 292, W, 220, `mist-${palId}`).setOrigin(0).setAlpha(tall ? 0.34 : 0.5).setDepth(8.4);
    this.mistB = scene.add.tileSprite(0, tall ? 1410 : 372, W, 220, `mist-${palId}`).setOrigin(0).setAlpha(tall ? 0.24 : 0.34).setDepth(8.6);
    this.front = scene.add.tileSprite(0, tall ? 1922 : 562, W, 250, `front-${palId}`).setOrigin(0, 1).setDepth(9).setAlpha(0.96);
    this.haze = scene.add.rectangle(0, tall ? 1380 : 400, W, tall ? 400 : 220, Phaser.Display.Color.HexStringToColor(this.pal.fog).color, 0.08)
      .setOrigin(0).setDepth(9).setBlendMode(Phaser.BlendModes.SCREEN);
    this.veil = scene.add.rectangle(0, 0, W, M.H, 0x000000, 0).setOrigin(0).setDepth(60);

    // drifting specks
    this.motes = scene.add.particles(0, 0, 'mote', {
      x: { min: -40, max: W + 40 }, y: { min: tall ? 160 : 60, max: tall ? 1800 : 480 },
      lifespan: 9000, frequency: tall ? 160 : 220, quantity: 1,
      speedX: { min: -10, max: 6 }, speedY: { min: -9, max: 3 },
      alpha: { start: 0.3, end: 0 }, scale: { start: 0.28, end: 0.06 },
      tint: palId === 'night' ? 0xbfd6ff : 0xffe7b0,
      blendMode: 'ADD'
    }).setDepth(10);

    if (palId === 'night') {
      this.fireflies = scene.add.particles(0, 0, 'mote', {
        x: { min: 40, max: W - 40 }, y: { min: tall ? 1280 : 300, max: tall ? 1820 : 500 },
        lifespan: 6000, frequency: 420, quantity: 1,
        speedX: { min: -14, max: 14 }, speedY: { min: -10, max: 6 },
        alpha: { start: 0.75, end: 0 }, scale: { start: 0.42, end: 0.15 },
        tint: 0xd8f5a6, blendMode: 'ADD'
      }).setDepth(12);
    }
    if (palId === 'dusk') {
      this.embers = scene.add.particles(0, 0, 'mote', {
        x: { min: 0, max: W }, y: { min: tall ? 1550 : 400, max: tall ? 1900 : 540 },
        lifespan: 5000, frequency: 300, quantity: 1,
        speedX: { min: -22, max: -6 }, speedY: { min: -26, max: -8 },
        alpha: { start: 0.5, end: 0 }, scale: { start: 0.32, end: 0.05 },
        tint: 0xffb15e, blendMode: 'ADD'
      }).setDepth(10);
    }
  }

  update(dt, speed) {
    const d = dt * speed;
    this.clouds.forEach((t) => { t.tilePositionX += d * t.factor; });
    this.ridges.forEach((r) => { r.tilePositionX += d * r.factor; });
    this.front.tilePositionX += d * 0.72;
    this.mistA.tilePositionX += d * 0.1;
    this.mistB.tilePositionX += d * 0.17;
    this.discGlow.setAlpha(0.55 + Math.sin(this.scene.time.now * 0.0011) * 0.12);
  }

  flash(alpha = 0.28, hold = 90) {
    const veil = this.veil;
    veil.setFillStyle(0xd9e8ff, 1);
    veil.setAlpha(alpha);
    this.scene.tweens.add({ targets: veil, alpha: 0, duration: 420, ease: 'Cubic.easeOut' });
  }
}

// ---- scenes ----------------------------------------------------------------
class Boot extends Phaser.Scene {
  constructor() { super('boot'); }
  create() {
    makeAtlas(this, M);
    this.anims.create({
      key: 'flap',
      frames: Array.from({ length: 8 }, (_, i) => ({ key: `ptero-${i}` })),
      frameRate: 12,
      repeat: -1
    });
    this.scene.start('attract');
  }
}

class Attract extends Phaser.Scene {
  constructor() { super('attract'); }
  create() {
    const heroX = M.portrait ? 560 : 650;
    const heroY = M.portrait ? 690 : 300;
    this.backdrop = new Backdrop(this, 'dawn', { sunX: 790, sunY: 150 });
    this.hero = this.add.sprite(heroX, heroY, 'ptero-0').setScale(M.portrait ? 0.95 : 0.66).setDepth(20);
    this.hero.play('flap');
    this.hero.anims.timeScale = 0.65;
    this.tweens.add({ targets: this.hero, y: heroY - (M.portrait ? 46 : 26), duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.hero, rotation: 0.05, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.hero, x: heroX - 44, duration: 6400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.feathers = this.add.particles(0, 0, 'feather', {
      lifespan: 4200, frequency: 900, quantity: 1,
      speedX: { min: -30, max: -8 }, speedY: { min: -6, max: 14 },
      rotate: { min: -40, max: 40 }, alpha: { start: 0.5, end: 0 },
      scale: { start: 0.5, end: 0.2 }
    }).setDepth(19);
    this.feathers.startFollow(this.hero, -40, 18);
    this.glowA = this.add.image(heroX, heroY - 40, 'glow').setAlpha(0.18).setScale(M.portrait ? 2.4 : 1.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(12);
    this.events.on('shutdown', () => { if (this.feathers) this.feathers.destroy(); });
  }
  update(time, delta) {
    this.backdrop.update(delta / 1000, 26);
  }
}

class Flight extends Phaser.Scene {
  constructor() { super('flight'); }
  init(data) {
    this.routeIndex = clamp(Number(data && data.route) || 0, 0, ROUTES.length - 1);
    this.attempt = (this.attempt || 0) + 1;
    this.paused = false;
    this.running = false;
  }
  create() {
    const route = ROUTES[this.routeIndex];
    this.route = route;
    this.shape = M;
    const started = this.time.now;
    this.calm = calm || reducedMotion;
    this.backdrop = new Backdrop(this, route.palette, route.palette === 'night' ? { sunX: 770, sunY: 116 } : { sunX: 780, sunY: route.palette === 'dusk' ? 210 : 140 });

    this.travel = 0;
    this.elapsed = 0;
    this.speed = route.speed;
    this.baseSpeed = route.speed;
    this.hearts = 3;
    this.delivered = 0;
    this.carrying = false;
    this.misses = 0;
    this.invuln = 0;
    this.slowUntil = 0;
    this.tailwind = 0;
    this.stamina = 1;
    this.surging = false;
    this.objects = [];
    this.chart = buildChart(this.routeIndex, this.attempt);
    this.chartIndex = 0;
    this.finished = false;
    this.nextStage = 0;
    this.running = true;
    this.spawnTimer = 0;

    this.player = this.add.container(M.playerX, Y(300)).setDepth(30);
    this.wing = this.add.sprite(0, 0, 'ptero-0').setScale(M.portrait ? 0.78 : 0.62);
    this.wing.play('flap');
    this.player.add(this.wing);
    this.satchel = this.add.image(M.portrait ? -72 : -62, M.portrait ? 22 : 20, 'letter').setScale(0.52).setAlpha(0);
    this.player.addAt(this.satchel, 0);
    this.playerGlow = this.add.image(M.playerX, Y(300), 'glow').setAlpha(0.12).setScale(M.portrait ? 1.05 : 0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(29);

    this.targetY = Y(300);
    this.vy = 0;

    this.feathers = this.add.particles(0, 0, 'feather', {
      lifespan: 2400, frequency: 150, quantity: 1,
      speedX: { min: -150, max: -60 }, speedY: { min: -18, max: 26 },
      rotate: { min: -60, max: 60 }, alpha: { start: 0.55, end: 0 },
      scale: { start: 0.42, end: 0.1 }, tint: 0xffe6bd
    }).setDepth(28);
    this.feathers.startFollow(this.player, -48, 14);
    this.speedLines = this.add.particles(0, 0, 'mote', {
      lifespan: 520, frequency: 60, quantity: 1,
      x: { min: M.portrait ? 620 : W - 20, max: M.portrait ? 950 : W + 30 },
      y: { min: Y(60), max: Y(500) },
      speedX: { min: -900, max: -600 }, alpha: { start: 0.22, end: 0 }, scaleX: 6, scaleY: 0.7,
      tint: 0xfff3cf, blendMode: 'ADD'
    }).setDepth(14);
    this.speedLines.stop();

    this.bursts = this.add.particles(0, 0, 'star', {
      lifespan: 900, speed: { min: 40, max: 200 }, angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 }, alpha: { start: 0.95, end: 0 }, scale: { start: 0.6, end: 0 },
      gravityY: 40, emitting: false
    }).setDepth(35);
    this.smoke = this.add.particles(0, 0, 'mote', {
      lifespan: 700, speed: { min: 10, max: 70 }, angle: { min: 0, max: 360 },
      alpha: { start: 0.5, end: 0 }, scale: { start: 0.9, end: 0.2 }, tint: 0x8a7a70,
      emitting: false
    }).setDepth(19);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.input.on('pointermove', (p) => {
      if (!this.running || this.paused) return;
      this.targetY = clamp(p.y, M.pointerMin, M.pointerMax);
    });
    this.input.on('pointerdown', (p) => {
      if (!this.running || this.paused) return;
      this.targetY = clamp(p.y, M.pointerMin, M.pointerMax);
      this.surging = true;
    });
    this.input.on('pointerup', () => { this.surging = false; });

    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-M', () => toggleMute());

    this.cameras.main.fadeIn(500, 8, 18, 24);
    this.running = true;

    gameScene = this;
    window.__sky = this;

    uiHud(route, this);
    $('pause').hidden = false;
    setMode('flight');
    audio.setRoute(route.id);
    audio.setMuted(localStorage.getItem('du-sky-muted') === '1');
    this.time.delayedCall(300, () => notice(`Flight ${route.no} · ${route.name}`, 2100));

    this.events.once('shutdown', () => {
      this.running = false;
      $('pause').hidden = true;
      if (this.feathers) this.feathers.destroy();
      if (this.speedLines) this.speedLines.destroy();
    });
  }

  togglePause() {
    if (!this.running || this.finished) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.scene.pause();
      audio.stopMusic();
      $('pausePanel').hidden = false;
      setMode('pause');
    } else {
      $('pausePanel').hidden = true;
      setMode('flight');
      audio.setRoute(this.route.id);
      this.scene.resume();
    }
  }

  update(time, delta) {
    if (!this.running || this.paused) return;
    const dt = Math.min(delta, 50) / 1000;
    if (!this.finished) this.elapsed += dt;

    // steering
    const key = this.cursors;
    if (key.up.isDown || key.left.isDown) this.targetY -= 320 * M.band * dt;
    if (key.down.isDown || key.right.isDown) this.targetY += 320 * M.band * dt;
    this.targetY = clamp(this.targetY, M.pointerMin, M.pointerMax);

    const thermal = this.thermalAt();
    if (thermal) this.targetY -= 210 * M.band * dt;

    const desired = this.finished
      ? Y(250) + Math.sin(time * 0.0009) * 60 * M.band
      : this.targetY;
    const dy = desired - this.player.y;
    this.vy = lerp(this.vy, dy * 6.4, 1 - Math.pow(0.0015, dt));
    this.player.y = clamp(this.player.y + this.vy * dt, M.playerMin, M.playerMax);
    this.player.rotation = clamp(this.vy * 0.00042, -0.34, 0.34);
    this.playerGlow.setPosition(this.player.x, this.player.y);
    this.playerGlow.setAlpha(0.1 + (this.invuln > time ? 0.1 : 0));
    this.playerGlow.setTint(0xffefc4);

    // surge
    const wantSurge = (this.space.isDown || this.shift.isDown || this.surging) && this.stamina > 0.05 && !this.finished;
    this.surging = wantSurge;
    if (wantSurge) this.stamina = Math.max(0, this.stamina - dt * 0.42);
    else this.stamina = Math.min(1, this.stamina + dt * 0.2);
    $('staminaFill').style.width = Math.round(this.stamina * 100) + '%';
    const linesOn = wantSurge || time < (this.forceLinesUntil || 0);
    if (linesOn && !this.linesRunning) { this.speedLines.start(); this.linesRunning = true; }
    if (!linesOn && this.linesRunning) { this.speedLines.stop(); this.linesRunning = false; }

    if (!this.finished && time > (this.flapAt || 0)) {
      this.flapAt = time + (wantSurge ? 260 : 460);
      audio.flap();
    }

    this.tailwind = Math.max(0, this.tailwind - dt * 0.22);
    let target = this.baseSpeed * (1 + this.tailwind * 0.16) * (wantSurge ? 1.42 : 1);
    if (this.invuln > time) target *= 0.72;
    if (time < this.slowUntil) target *= 0.5;
    if (this.finished) target *= 0.35;
    if (thermal) target *= 1.08;
    this.speed = lerp(this.speed, target, 1 - Math.pow(0.008, dt));
    this.travel += this.speed * dt;

    this.wing.anims.timeScale = 0.75 + this.speed / 420;
    audio.updateWind(clamp((this.speed - 150) / 180, 0, 1), this.player.y / M.H);
    audio.setTension(clamp((3 - this.hearts) / 3 + this.tailwind * 0.2, 0, 1));

    this.backdrop.update(dt, this.speed);

    // spawn chart
    if (!this.finished) {
      while (this.chartIndex < this.chart.length && this.chart[this.chartIndex].x - this.travel < 1240) {
        this.spawnObject(this.chart[this.chartIndex]);
        this.chartIndex++;
      }
    }
    this.updateObjects(time, dt);

    // player invulnerability blink
    this.wing.setAlpha(this.invuln > time ? (Math.floor(time / 90) % 2 ? 0.35 : 1) : 1);

    if (!this.finished && this.delivered >= 3 && this.objects.every((o) => o.kind !== 'post' || o.done)) {
      this.finish(true);
    }
  }

  thermalAt() {
    for (const o of this.objects) {
      if (o.kind !== 'thermal' || o.dead) continue;
      const sx = o.x - this.travel;
      if (Math.abs(sx - M.playerX) < 74 && this.player.y > Y(150)) return o;
    }
    return null;
  }

  spawnObject(item) {
    const sx = item.x - this.travel;
    if (item.type === 'gate') {
      const gy = Y(item.y);
      const sprite = this.add.image(sx, gy, 'gate').setScale(0.68).setDepth(15).setAlpha(0.92);
      this.tweens.add({ targets: sprite, rotation: 0.12, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.objects.push({ kind: 'gate', x: item.x, y: gy, sprite, passed: false });
    } else if (item.type === 'letter') {
      const ly = Y(item.y);
      const glow = this.add.image(sx, ly, 'glow').setScale(0.55).setAlpha(0.5).setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
      const sprite = this.add.image(sx, ly, 'letter').setDepth(18).setScale(0.9);
      this.tweens.add({ targets: [sprite, glow], y: ly - 12 * M.band, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: sprite, rotation: 0.08, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.objects.push({ kind: 'letter', x: item.x, y: ly, sprite, glow, stage: item.s, collected: false });
    } else if (item.type === 'post') {
      const variant = (item.s + this.routeIndex) % 3;
      const post = this.add.image(sx, M.postBottom, `post-${this.route.palette}-${variant}`)
        .setOrigin(0.5, 1).setScale(M.postScale).setDepth(14);
      const ringY = M.portrait ? 1497 + (item.y - 205) * 0.5 : item.y;
      const ring = this.add.image(sx - 190, ringY, 'gate').setScale(0.72).setDepth(16).setAlpha(0.9);
      this.tweens.add({ targets: ring, rotation: 0.2, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: ring, alpha: 0.62, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.objects.push({ kind: 'post', x: item.x, y: ringY, sprite: post, ring, done: false, checked: false, stage: item.s, lanterns: [] });
    } else if (item.type === 'storm') {
      const sy = Y(item.y);
      const sprite = this.add.image(sx, sy, 'storm').setDepth(13).setScale(0.92).setAlpha(0.96);
      const glow = this.add.image(sx, sy + 40, 'glow').setTint(0x7f9dc4).setAlpha(0.12).setScale(1.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(12);
      this.objects.push({
        kind: 'storm', x: item.x, y: sy, sprite, glow, nextFlash: this.time.now + 900 + Math.random() * 1500
      });
    } else if (item.type === 'spire-b' || item.type === 'spire-t') {
      if (M.portrait) {
        const tex = item.type === 'spire-b' ? 'spire-up' : 'island';
        const sprite = this.add.image(sx, item.type === 'spire-b' ? M.bottomY : M.topY, tex)
          .setOrigin(0.5, item.type === 'spire-b' ? 1 : 0)
          .setScale(item.type === 'spire-b' ? M.bottomScale : 1).setDepth(13);
        this.objects.push({ kind: item.type, x: item.x, y: 0, sprite });
      } else {
        const tex = item.type === 'spire-b' ? 'spire-up' : 'spire-down';
        const sprite = this.add.image(sx, item.type === 'spire-b' ? M.bottomY : M.topY, tex)
          .setOrigin(0.5, item.type === 'spire-b' ? 1 : 0).setScale(M.bottomScale).setDepth(13);
        this.objects.push({ kind: item.type, x: item.x, y: 0, sprite });
      }
    } else if (item.type === 'thermal') {
      const emitter = this.add.particles(sx, M.thermalY, 'mote', {
        x: { min: -54, max: 54 }, y: { min: -40, max: 10 },
        speedY: M.portrait ? { min: -330, max: -170 } : { min: -190, max: -90 },
        speedX: { min: -12, max: 12 },
        lifespan: M.portrait ? 2500 : 1900, frequency: 80, quantity: 1,
        alpha: { start: 0.35, end: 0 }, scale: { start: 0.5, end: 0.08 },
        tint: 0xffe8b0, blendMode: 'ADD'
      }).setDepth(11);
      this.objects.push({ kind: 'thermal', x: item.x, y: 0, emitter, dead: false });
    }
  }

  updateObjects(time, dt) {
    const player = this.player;
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const o = this.objects[i];
      const sx = o.x - this.travel;
      if (o.kind === 'gate') {
        if (!o.sprite) continue;
        o.sprite.x = sx;
        if (!o.passed && sx < M.playerX) {
          o.passed = true;
          if (Math.abs(player.y - o.y) < 78) {
            this.tailwind = 1;
            audio.gate();
            this.bursts.emitParticleAt(sx, o.y, 8);
            this.tweens.add({ targets: o.sprite, alpha: 0, scale: 1.35, duration: 500, onComplete: () => o.sprite.destroy() });
            this.forceLinesUntil = time + 650;
          }
        }
        if (sx < -160) { if (o.sprite.active) o.sprite.destroy(); this.objects.splice(i, 1); }
      } else if (o.kind === 'letter') {
        if (o.collected) { this.objects.splice(i, 1); continue; }
        o.sprite.x = sx; o.glow.x = sx;
        const d = Phaser.Math.Distance.Between(sx, o.sprite.y, player.x, player.y);
        if (d < 58) {
          o.collected = true;
          this.carrying = true;
          this.tweens.add({ targets: this.satchel, alpha: 1, duration: 220 });
          audio.letter();
          this.bursts.emitParticleAt(sx, o.sprite.y, 14);
          this.tweens.add({ targets: [o.sprite, o.glow], x: player.x, y: player.y, scale: 0.2, alpha: 0, duration: 280, ease: 'Cubic.easeIn', onComplete: () => { o.sprite.destroy(); o.glow.destroy(); } });
          notice(o.stage === 0 ? 'A letter for the high rookery.' : o.stage === 1 ? 'A letter, sealed in red wax.' : 'The last letter — for the sea cliff.', 1700);
          this.updateHud(false);
        }
        if (sx < -80) { o.sprite.destroy(); o.glow.destroy(); this.objects.splice(i, 1); }
      } else if (o.kind === 'post') {
        o.sprite.x = sx;
        o.ring.x = sx - 190;
        if (Math.abs(sx - player.x) < 142 && player.y > M.cliff) this.hurt(time);
        if (!o.checked && sx - 190 < M.playerX) {
          o.checked = true;
          if (this.carrying && Math.abs(player.y - o.ring.y) < (M.portrait ? 92 : 84)) this.deliver(o);
          else if (!this.carrying) notice('The rookery waits for a letter.', 1800);
          else this.missPost(o);
        }
        if (sx < -320) { o.sprite.destroy(); o.ring.destroy(); this.objects.splice(i, 1); }
      } else if (o.kind === 'storm') {
        o.sprite.x = sx; o.glow.x = sx;
        o.sprite.y = o.y + Math.sin(time * 0.0012 + o.x) * 9;
        o.glow.y = o.sprite.y + 40;
        if (time > o.nextFlash && sx > -100 && sx < W + 100 && !this.calm) {
          o.nextFlash = time + 1900 + Math.random() * 2200;
          const bolt = this.add.image(sx + 30 + Math.random() * 60, o.sprite.y + 46, 'bolt')
            .setScale(0.8).setAlpha(0.95).setDepth(34).setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({ targets: bolt, alpha: 0, duration: 260, onComplete: () => bolt.destroy() });
          this.backdrop.flash(0.16);
          audio.thunder(0.06);
        }
        const d = Phaser.Math.Distance.Between(sx, o.sprite.y, player.x, player.y);
        if (d < 88) this.hurt(time);
        if (sx < -260) { o.sprite.destroy(); o.glow.destroy(); this.objects.splice(i, 1); }
      } else if (o.kind === 'spire-b' || o.kind === 'spire-t') {
        o.sprite.x = sx;
        const halfW = o.kind === 'spire-t' && M.portrait ? 92 : 44;
        if (Math.abs(sx - player.x) < halfW) {
          if (o.kind === 'spire-b' && player.y > M.bottomThresh) this.hurt(time);
          if (o.kind === 'spire-t' && player.y < M.topThresh) this.hurt(time);
        }
        if (sx < -160) { o.sprite.destroy(); this.objects.splice(i, 1); }
      } else if (o.kind === 'thermal') {
        o.emitter.x = sx;
        if (sx < -120) { o.emitter.destroy(); this.objects.splice(i, 1); }
      }
    }
  }

  deliver(post) {
    this.delivering = true;
    this.slowUntil = this.time.now + 900;
    this.carrying = false;
    this.satchel.setAlpha(0);
    this.delivered++;
    post.done = true;
    audio.deliver();
    this.bursts.emitParticleAt(post.ring.x, post.ring.y, 24);
    this.backdrop.flash(0.1);
    this.tweens.add({ targets: post.ring, scale: 1.5, alpha: 0, duration: 700, ease: 'Cubic.easeOut' });
    const glow = this.add.image(post.ring.x + 60, post.ring.y + 30, 'glow').setBlendMode(Phaser.BlendModes.ADD).setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: glow, alpha: 0.75, scale: 1.1, duration: 700, yoyo: true, hold: 500 });
    this.updateHud(true);
    notice(this.delivered === 3 ? 'The last letter is home.' : 'Delivered. The lanterns are lit.', 2200);
    this.cameras.main.zoomTo(1.035, 420, 'Sine.easeOut');
    this.time.delayedCall(700, () => this.cameras.main.zoomTo(1, 700, 'Sine.easeInOut'));
  }

  missPost(post) {
    this.misses++;
    post.done = true;
    notice('A second pass — the rookery keeps a lantern lit.', 2400);
    this.time.delayedCall(650, () => {
      if (!this.running) return;
      // put the letter back in the air, further along
      this.chart.splice(this.chartIndex, 0, {
        type: 'letter', x: post.x + 980, y: 150 + Math.random() * 240, s: post.stage
      });
      this.updateHud(false);
    });
  }

  hurt(time) {
    if (time < this.invuln || this.finished) return;
    this.invuln = time + 1700;
    this.hearts--;
    this.slowUntil = time + 520;
    audio.hurt();
    if (!this.calm) {
      this.cameras.main.shake(240, 0.008);
      this.cameras.main.flash(160, 255, 226, 186, false);
    }
    this.bursts.emitParticleAt(this.player.x, this.player.y, 10);
    this.smoke.emitParticleAt(this.player.x, this.player.y, 8);
    this.updateHud(false);
    if (this.hearts <= 0) {
      this.finish(false);
    } else {
      notice(this.hearts === 2 ? 'A grazed wing. Steady now.' : 'One feather left. The letters are still safe.', 1800);
    }
  }

  updateHud(pulse) {
    $('pip1').classList.toggle('done', this.delivered >= 1);
    $('pip2').classList.toggle('done', this.delivered >= 2);
    $('pip3').classList.toggle('done', this.delivered >= 3);
    $('pip1').classList.toggle('aboard', this.carrying && this.delivered === 0);
    $('pip2').classList.toggle('aboard', this.carrying && this.delivered === 1);
    $('pip3').classList.toggle('aboard', this.carrying && this.delivered === 2);
    for (let i = 1; i <= 3; i++) $('heart' + i).classList.toggle('spent', i > this.hearts);
    $('meterFill').style.width = Math.round((this.delivered / 3) * 100) + '%';
    $('staminaFill').style.width = Math.round(this.stamina * 100) + '%';
    if (pulse) {
      const node = $('instruments');
      node.classList.remove('pulse');
      void node.offsetWidth;
      node.classList.add('pulse');
    }
  }

  finish(success) {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    this.speedLines.stop();
    this.feathers.stop();
    const route = this.route;
    const stars = success ? 1 + (this.hearts === 3 ? 1 : 0) + (this.misses === 0 ? 1 : 0) : 0;
    const time = Math.round(this.elapsed);
    const progress = readProgress();
    progress.best = progress.best || {};
    const prev = progress.best[route.id];
    if (success && (!prev || stars > prev.stars || (stars === prev.stars && time < prev.time))) {
      progress.best[route.id] = { stars, time };
    }
    if (success) {
      progress.unlocked = Math.max(Number(progress.unlocked) || 1, Math.min(ROUTES.length, this.routeIndex + 2));
      progress.lastRoute = Math.min(ROUTES.length - 1, this.routeIndex + 1);
      recordUniverse();
    } else {
      progress.lastRoute = this.routeIndex;
    }
    writeProgress(progress);
    if (success) audio.routeComplete(); else audio.fail();
    $('pause').hidden = true;
    if (success) this.bursts.emitParticleAt(this.player.x + 40, this.player.y, 26);
    this.time.delayedCall(success ? 1500 : 1300, () => {
      showResults({ route, success, stars, time, misses: this.misses, hearts: Math.max(this.hearts, 0) });
      this.scene.pause();
    });
  }
}

function buildChart(routeIndex, attempt) {
  const rand = mulberry32(9173 + routeIndex * 131 + attempt * 17);
  const list = [];
  let x = 1180;
  for (let s = 0; s < 3; s++) {
    list.push({ type: 'gate', x: (x += 250), y: 120 + rand() * 300 });
    list.push({ type: 'gate', x: (x += 250), y: 120 + rand() * 300 });
    list.push({ type: 'letter', x: (x += 310), y: 130 + rand() * 280, s });
    list.push({ type: 'gate', x: (x += 290), y: 120 + rand() * 300 });
    list.push({ type: 'post', x: (x += 570), y: 205 + rand() * 105, s });
    list.push({ type: 'thermal', x: (x += 520), y: 300 });
    list.push({ type: rand() > 0.5 ? 'spire-b' : 'spire-t', x: (x += 430) });
    list.push({ type: 'storm', x: (x += 470), y: 120 + rand() * 300 });
    x += 200;
  }
  return list;
}

function uiHud(route, scene) {
  $('route').textContent = `Flight ${route.no}`;
  $('routeName').textContent = route.name;
  $('meterFill').style.width = '0%';
  $('staminaFill').style.width = '100%';
  ['pip1', 'pip2', 'pip3'].forEach((id) => $(id).classList.remove('done', 'aboard'));
  ['heart1', 'heart2', 'heart3'].forEach((id) => $(id).classList.remove('spent'));
  $('instruments').hidden = false;
}

// ---- boot ------------------------------------------------------------------
function createGame() {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'air',
    width: W,
    height: M.H,
    backgroundColor: '#142c37',
    transparent: true,
    scale: {
      mode: M.portrait ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
    audio: { noAudio: true },
    scene: [Boot, Attract, Flight]
  });
}

let phaserGame = createGame();

// A phone turned on its side changes the shape of the sky, not the run.
// Rebuild the stage in the new shape and put the courier back on the wind.
let shapeTimer = null;
function onShapeChange() {
  clearTimeout(shapeTimer);
  shapeTimer = setTimeout(() => {
    const next = metrics();
    if (next.portrait === M.portrait) return;
    const mode = document.body.dataset.mode;
    const route = selectedRoute;
    const wasPaused = mode === 'pause';
    gameScene = null;
    window.__sky = null;
    $('pausePanel').hidden = true;
    $('pause').hidden = true;
    try { phaserGame.destroy(true); } catch { /* the old stage is already gone */ }
    M = next;
    phaserGame = createGame();
    const enter = () => {
      if (mode === 'flight' || mode === 'pause') {
        launch(route);
        notice('The sky turned — the flight begins again.', 2600);
        if (wasPaused) setTimeout(() => { if (gameScene) gameScene.togglePause(); }, 700);
      } else {
        phaserGame.scene.start('attract');
      }
    };
    if (phaserGame.isBooted) enter();
    else phaserGame.events.once('ready', enter);
  }, 220);
}
window.addEventListener('resize', onShapeChange);
window.addEventListener('orientationchange', onShapeChange);

audio.setMuted(localStorage.getItem('du-sky-muted') === '1');
$('mute').textContent = localStorage.getItem('du-sky-muted') === '1' ? 'Sound off' : 'Sound on';
$('mute').setAttribute('aria-pressed', String(localStorage.getItem('du-sky-muted') !== '1'));
paintMenu();

// launch after the first frame so Attract is ready
window.addEventListener('load', () => {
  if (window.__pendingRoute != null) launch(window.__pendingRoute);
});
