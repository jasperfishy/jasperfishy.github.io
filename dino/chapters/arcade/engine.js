import { addEnvironment } from '../../photoreal-environments.js?v=du-7df8fa9b17a78b51';
// Prehistoric Arcade — shared engine.
// One stage, one audio ensemble, one set of hand-painted procedural layers, so
// every little game inherits the same finish as Sky Mail without shipping any
// image or sound files.
import { applyPhotorealTexture } from '../../photoreal-textures.js?v=du-7df8fa9b17a78b51';

export const W = 960;
export const SAVE_KEY = 'du-arcade-v1';
export const UNIVERSE_KEY = 'dinosaur-universe-player-v1';

export const shell = {
  onReady: () => {},
  onHud: () => {},
  onNotice: () => {},
  onFinish: () => {},
  onPause: () => {},
  audio: null
};

/* ---------------------------------------------------------------- metrics */
export function metrics() {
  const portrait = window.innerWidth < 900 && window.innerHeight > window.innerWidth * 1.05;
  if (!portrait) {
    return {
      portrait: false, W, H: 540, band: 1, top: 0, bottom: 540,
      sunX: 760, sunY: 142, Y: (v) => v
    };
  }
  const top = 560, bottom = 1748;
  const band = (bottom - top) / 540;
  return {
    portrait: true, W, H: 1920, band, top, bottom,
    sunX: 640, sunY: 500, Y: (v) => top + v * band
  };
}

/* -------------------------------------------------------------------- rng */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const rng = (seed) => mulberry32(typeof seed === 'string' ? hashSeed(seed) : seed);

/* -------------------------------------------------------------- palettes */
export const MOODS = {
  dawn: {
    sky: [[0, '#163a44'], [0.34, '#2c5b5e'], [0.62, '#6f7566'], [0.82, '#c08a63'], [1, '#f0c489']],
    sun: '#ffe6b0', sunGlow: '#ffcf8f', cloud: '#f6d9b5',
    ridges: ['#5c7268', '#3c5a55', '#273f3d'], ground: ['#33514a', '#16282a'],
    mist: '#d9b98f', accent: '#ffb56b', motes: '#ffe6ad', stars: false,
    music: { root: 57, scale: [0, 2, 4, 7, 9, 12, 14], bpm: 80, pad: [0, 4, 7] }
  },
  dusk: {
    sky: [[0, '#241f33'], [0.38, '#4b3547'], [0.66, '#8a4f4c'], [0.86, '#cf7a51'], [1, '#f4b878']],
    sun: '#ffd9a0', sunGlow: '#ff9d63', cloud: '#f0b08a',
    ridges: ['#6a4b55', '#493449', '#2b2030'], ground: ['#3d2e3a', '#1b141e'],
    mist: '#e6a077', accent: '#ff8f5e', motes: '#ffd2a1', stars: true,
    music: { root: 50, scale: [0, 2, 3, 5, 7, 10, 12], bpm: 72, pad: [0, 3, 7] }
  },
  night: {
    sky: [[0, '#060e1d'], [0.42, '#0d2036'], [0.72, '#173247'], [1, '#27495a']],
    sun: '#f4f0d4', sunGlow: '#b9d8ff', cloud: '#7d9ab0',
    ridges: ['#254254', '#1a3141', '#0f202d'], ground: ['#1c3340', '#08131c'],
    mist: '#7fa6bc', accent: '#8fd0ff', motes: '#d8efff', stars: true,
    music: { root: 52, scale: [0, 2, 3, 7, 10, 12, 15], bpm: 60, pad: [0, 7, 12] }
  },
  jungle: {
    sky: [[0, '#0e2d2b'], [0.3, '#1d4a3e'], [0.6, '#4e7248'], [0.82, '#a59c5a'], [1, '#e4c477']],
    sun: '#fff2bd', sunGlow: '#e8dc8c', cloud: '#d7e3b6',
    ridges: ['#4a7357', '#315845', '#1b3c34'], ground: ['#2b5240', '#10261f'],
    mist: '#c8d69a', accent: '#ffd06a', motes: '#f5eaa7', stars: false,
    music: { root: 55, scale: [0, 2, 4, 7, 9, 12, 16], bpm: 92, pad: [0, 4, 7] }
  },
  volcanic: {
    sky: [[0, '#1a0f15'], [0.32, '#39191c'], [0.6, '#7a2c22'], [0.84, '#c45527'], [1, '#f2a44a']],
    sun: '#ffd08a', sunGlow: '#ff7a3c', cloud: '#c07a5d',
    ridges: ['#5a302c', '#3b1f20', '#1e1013'], ground: ['#341a19', '#120a0c'],
    mist: '#d97a48', accent: '#ff7d4d', motes: '#ffb066', stars: false,
    music: { root: 45, scale: [0, 1, 3, 5, 7, 8, 11], bpm: 108, pad: [0, 3, 6] }
  },
  underwater: {
    sky: [[0, '#062b3b'], [0.4, '#0c4b5e'], [0.74, '#14708a'], [1, '#2a97a3']],
    sun: '#d5fbff', sunGlow: '#8fe9f0', cloud: '#9fd8dc',
    ridges: ['#1a5b66', '#124650', '#0a333c'], ground: ['#c9ad7c', '#6a5a44'],
    mist: '#9fe3e8', accent: '#7de3d4', motes: '#d6fdff', stars: false,
    music: { root: 48, scale: [0, 2, 5, 7, 9, 12, 14], bpm: 64, pad: [0, 5, 9] }
  },
  canyon: {
    sky: [[0, '#2a2440'], [0.36, '#5c3e50'], [0.68, '#b0624a'], [0.88, '#e29a5f'], [1, '#f6cd8f']],
    sun: '#ffe8b5', sunGlow: '#ffb070', cloud: '#e8a98a',
    ridges: ['#8a5544', '#633c37', '#3f262a'], ground: ['#6b4034', '#2a1918'],
    mist: '#eab382', accent: '#ffb06a', motes: '#ffe0b0', stars: false,
    music: { root: 53, scale: [0, 2, 3, 7, 9, 10, 12], bpm: 76, pad: [0, 4, 7] }
  },
  amber: {
    sky: [[0, '#1f2a1c'], [0.36, '#4a4a26'], [0.66, '#9a7a34'], [0.88, '#d6a94f'], [1, '#f6d68a']],
    sun: '#fff0b8', sunGlow: '#ffc84f', cloud: '#d9c58a',
    ridges: ['#5f6136', '#434a2b', '#2a331f'], ground: ['#4a4a26', '#1b1e12'],
    mist: '#e5c56a', accent: '#ffcf5a', motes: '#ffeb9e', stars: false,
    music: { root: 58, scale: [0, 2, 4, 5, 7, 9, 11], bpm: 84, pad: [0, 4, 7] }
  },
  storm: {
    sky: [[0, '#121b26'], [0.38, '#243746'], [0.68, '#44606c'], [0.88, '#7b8f8c'], [1, '#b9c2a6']],
    sun: '#e6f0de', sunGlow: '#b9d1c8', cloud: '#9aadae',
    ridges: ['#3c5054', '#2a3a40', '#18262b'], ground: ['#263c3e', '#0d171a'],
    mist: '#9fb8b4', accent: '#9fe8d4', motes: '#d4efe6', stars: false,
    music: { root: 49, scale: [0, 2, 3, 5, 7, 10, 12], bpm: 68, pad: [0, 3, 7] }
  },
  ice: {
    sky: [[0, '#0d2136'], [0.36, '#1d4560'], [0.66, '#58819a'], [0.88, '#a9c6d0'], [1, '#e8f2ec']],
    sun: '#f2fbff', sunGlow: '#b8e3f2', cloud: '#d4e8ee',
    ridges: ['#567a8c', '#3d6273', '#244657'], ground: ['#cfe4e6', '#7fa4ad'],
    mist: '#d6ecf0', accent: '#9fe6ff', motes: '#eafcff', stars: false,
    music: { root: 60, scale: [0, 2, 4, 7, 9, 12, 14], bpm: 74, pad: [0, 4, 7] }
  }
};

/* ---------------------------------------------------------------- canvas */
export function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return scene.textures.get(key);
  const tex = scene.textures.createCanvas(key, Math.round(w), Math.round(h));
  const c = tex.getContext();
  draw(c, w, h);
  tex.refresh();
  const pose = key.split('-').at(-1);
  const prop = {'rr-branch':'branch','tp-branch':'branch','ac-branch':'branch','vc-branch':'branch','vc-canopy':'branch','vc-crown':'fern','vc-broadleaf':'fern','vc-basket':'empty-nest','pp-kelp':'kelp','tc-boulder':'boulder','tc-stone':'boulder','lw-stone':'boulder','lw-grass':'fern','rb-tree':'pine','rb-reed':'kelp','rb-weed':'kelp','ss-nest':'empty-nest','ss-egg':'egg','ng-nest':'empty-nest','ng-tuft':'fern','mw-nest':'nest','et-nest':'empty-nest','fh-trunk':'fallen-log','sc-kelp':'kelp','dc-reed':'kelp','dc-stone':'boulder','sl-bush':'fern','sl-grass':'fern','sl-canopy':'fern'}[key] || (/^et-egg-/.test(key)?'egg':null) || ({log:'fallen-log',rock:'boulder',boulder:'boulder',fern:'fern'})[pose];
  if (prop) applyPhotorealTexture(tex, prop, {inset:0, library:'props'});
  const environment = {'cl-wall':'cave','bs-sky':'jungle','bs-soil':'soil'}[key];
  if (environment) applyPhotorealTexture(tex, environment, {inset:0,cover:true,library:'environments'});
  if (!environment && /^(?:tc-floor-|fb-floor$|sl-floor$|ts-floor$|rb-bank-|sp-bank$)/.test(key))
    applyPhotorealTexture(tex,'soil',{inset:0,cover:true,material:true,library:'environments'});
  if (/^(?:ve-(?:ledge|wall|crumble|summit)|gl-(?:wall|shelf|pad|shelter|chimney)|ts-(?:ledge|wall)$)/.test(key))
    applyPhotorealTexture(tex,'material-rock',{inset:0,cover:true,material:true,library:'environments'});
  if (/^tp-rock-/.test(key)) applyPhotorealTexture(tex,'material-rock',{inset:0,cover:true,material:true,library:'environments'});
  if (/^(?:bb-(?:cliffs|ravine|peaks)$|et-(?:ridge-|stone$))/.test(key)) applyPhotorealTexture(tex,'material-ice',{inset:0,cover:true,material:true,library:'environments'});
  if (/^(?:sl|vc)-trunk$/.test(key)) applyPhotorealTexture(tex,'material-bark',{inset:0,cover:true,material:true,library:'environments'});
  if (/^fh-(?:front|frozen|drift|crest)$/.test(key)) applyPhotorealTexture(tex,'material-ice',{inset:0,cover:true,material:true,library:'environments'});
  if (/^(?:ng-sand|sc-sand|rb-bar|mw-scree|sp-dune)$/.test(key)) applyPhotorealTexture(tex,'soil',{inset:0,cover:true,material:true,library:'environments'});
  if (/^(?:ng-sea|rb-bed)$/.test(key)) applyPhotorealTexture(tex,'material-water',{inset:0,cover:true,material:true,library:'environments'});
  if (key==='dc-spire') applyPhotorealTexture(tex,'material-bark',{inset:0,cover:true,material:true,library:'environments'});
  const poseOptions = ['duck', 'crouch', 'slide', 'tuck', 'hang'].includes(pose)
    ? { scaleY: 0.72, offsetY: 0.1 }
    : ['jump', 'leap', 'hop', 'lunge', 'charge', 'flap'].includes(pose)
      ? { scaleY: 0.9, offsetY: -0.04 }
      : {};
  const match = key.match(/^(?:bb-walker|mh-(?:lead|calf)-|rm-longneck-|sp-herd-|sp-calf$)/);
  if (match) applyPhotorealTexture(tex, 'bronto', poseOptions);
  else if (/^(?:dc-raptor|rr-raptor-|ss-raptor-|sl-hero-)/.test(key)) applyPhotorealTexture(tex, 'raptor', poseOptions);
  else if (/^rm-shellback-/.test(key)) applyPhotorealTexture(tex, 'ankylosaurus', poseOptions);
  else if (/^ss-stego-/.test(key)) applyPhotorealTexture(tex, 'stego', poseOptions);
  else if (/^tc-trike-|^tc-calf$/.test(key)) applyPhotorealTexture(tex, 'tricera', poseOptions);
  else if (/^(?:pp-ptero-|ts-soar-)/.test(key)) applyPhotorealTexture(tex, 'ptero', poseOptions);
  else if (/^(?:gl-keeper-|tc-keeper-|ve-player-|ng-builder-|bs-digger-|lw-hunter-|vc-hatch-|tc-hatch-|rb-hatch-|tp-hatch$)/.test(key)) applyPhotorealTexture(tex, 'trex', poseOptions);
  else if (/^rm-nibbler-/.test(key)) applyPhotorealTexture(tex, 'parasaurolophus', poseOptions);
  if (/^fh-(?:mother|hatch)-/.test(key)) applyPhotorealTexture(tex, 'oviraptor', poseOptions);
  else if (/^sl-hunter-/.test(key)) applyPhotorealTexture(tex, 'trex', { ...poseOptions, scaleY: key.endsWith('sleep') ? .65 : 1 });
  else if (key === 'ac-herder') applyPhotorealTexture(tex, 'raptor', poseOptions);
  else if (key === 'tc-raider') applyPhotorealTexture(tex, 'raptor', poseOptions);
  else if (key === 'dc-herd') applyPhotorealTexture(tex, 'parasaurolophus', {flipX:true});
  else if (/^pd-side-/.test(key)) applyPhotorealTexture(tex, 'raptor', poseOptions);
  else if (/^pd-rear-/.test(key)) applyPhotorealTexture(tex, 'raptor-rear', poseOptions);
  else if (key === 'tp-hang') applyPhotorealTexture(tex, 'raptor-hang');
  else if (/^(?:dc-bird-|ng-gull-)/.test(key)) applyPhotorealTexture(tex, 'archaeopteryx');
  else if (key === 'tp-glide') applyPhotorealTexture(tex, 'archaeopteryx');
  return tex;
}

export function grain(c, w, h, amount, seed) {
  const rand = rng(seed || 1);
  const img = c.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 255 * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  c.putImageData(img, 0, 0);
}

function softCloud(scene, key, tint, seed, scale) {
  canvasTex(scene, key, 420, 260, (c) => {
    const rand = rng(seed);
    c.save();
    c.translate(210, 125);
    c.scale(scale, scale);
    c.translate(-210, -125);
    for (let i = 0; i < 26; i++) {
      const x = 60 + rand() * 300;
      const y = 112 + rand() * 52;
      const r = 32 + rand() * 64;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, tint + '3c');
      g.addColorStop(0.5, tint + '22');
      g.addColorStop(1, tint + '00');
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    c.globalCompositeOperation = 'destination-out';
    const top = c.createLinearGradient(0, 0, 0, 70);
    top.addColorStop(0, 'rgba(0,0,0,1)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = top; c.fillRect(0, 0, 420, 70);
    const bottom = c.createLinearGradient(0, 190, 0, 260);
    bottom.addColorStop(0, 'rgba(0,0,0,0)');
    bottom.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = bottom; c.fillRect(0, 190, 420, 70);
    c.globalCompositeOperation = 'source-over';
  });
}

function ridgeTex(scene, key, colorFar, colorNear, seed) {
  canvasTex(scene, key, W + 120, 320, (c) => {
    const rand = rng(seed);
    const g = c.createLinearGradient(0, 40, 0, 320);
    g.addColorStop(0, colorFar);
    g.addColorStop(1, colorNear);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 320);
    c.lineTo(0, 190 + rand() * 20);
    let x = 0;
    while (x < W + 120) {
      const step = 60 + rand() * 110;
      const peak = 90 + rand() * 150;
      c.quadraticCurveTo(x + step * 0.5, 320 - peak, x + step, 200 + rand() * 70);
      x += step;
    }
    c.lineTo(W + 120, 320);
    c.closePath();
    c.fill();
    grain(c, W + 120, 320, 0.02, seed + 5);
  });
}

function groundTex(scene, key, M, mood) {
  const top = Math.round(M.Y(422));
  const h = Math.round(M.H - top);
  canvasTex(scene, key, W, h, (c, w, hh) => {
    const pal = MOODS[mood] || MOODS.dawn;
    const g = c.createLinearGradient(0, 0, 0, hh);
    g.addColorStop(0, pal.ground[0]);
    g.addColorStop(1, pal.ground[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, w, hh);
    const rand = rng('ground-' + mood);
    c.strokeStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 30; i++) {
      const y = 18 + rand() * hh;
      c.lineWidth = 1 + rand() * 2;
      c.beginPath(); c.moveTo(0, y);
      for (let x = 0; x <= w; x += 80) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 4);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 90; i++) c.fillRect(rand() * w, 4 + rand() * hh * 0.7, 2 + rand() * 7, 1 + rand() * 3);
    grain(c, w, hh, 0.035, 31);
  });
}

/* ------------------------------------------------------------- backdrop */
export function paintWorld(scene, M, moodName, opts = {}) {
  const photoLayers = new Set(scene.children.list);
  const pal = MOODS[moodName] || MOODS.dawn;
  const tall = M.portrait;
  const skyKey = 'arc-sky-' + moodName + (tall ? '-p' : '-w');
  canvasTex(scene, skyKey, W, M.H, (c) => {
    const g = c.createLinearGradient(0, 0, 0, M.H);
    for (const [stop, color] of pal.sky) g.addColorStop(stop, color);
    c.fillStyle = g; c.fillRect(0, 0, W, M.H);
    const sx = pal.sunX ?? M.sunX, sy = pal.sunY ?? M.sunY;
    const halo = c.createRadialGradient(sx, sy, 8, sx, sy, tall ? 520 : 330);
    halo.addColorStop(0, pal.sunGlow);
    halo.addColorStop(0.25, pal.sunGlow + '88');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalCompositeOperation = 'screen';
    c.fillStyle = halo; c.fillRect(0, 0, W, M.H);
    c.globalCompositeOperation = 'source-over';
    grain(c, W, M.H, 0.012, 7);
  });
  scene.add.image(0, 0, skyKey).setOrigin(0).setDepth(-20);

  if (pal.stars && !opts.noStars) {
    const rand = rng('stars-' + moodName);
    const far = scene.add.container(0, 0).setDepth(-19);
    for (let i = 0; i < (tall ? 110 : 60); i++) {
      const s = scene.add.circle(rand() * W, rand() * M.Y(tall ? 300 : 240), rand() > 0.85 ? 1.6 : 1, 0xfdf6da, 0.35 + rand() * 0.5);
      far.add(s);
      if (i % 5 === 0) scene.tweens.add({ targets: s, alpha: 0.12, duration: 1400 + rand() * 2400, yoyo: true, repeat: -1, delay: rand() * 2600 });
    }
  }

  const sx = pal.sunX ?? M.sunX, sy = pal.sunY ?? M.sunY;
  if (opts.sun !== false) {
    const glow = scene.add.image(sx, sy, 'arc-glow').setDepth(-18).setScale(tall ? 1.9 : 1.7).setAlpha(0.62)
      .setTint(Phaser.Display.Color.HexStringToColor(pal.sun).color).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: glow, scale: glow.scale * 1.07, alpha: 0.5, duration: 2600, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    scene.add.circle(sx, sy, tall ? 46 : 32, Phaser.Display.Color.HexStringToColor(pal.sun).color, 0.92).setDepth(-17);
  }

  const clouds = [];
  const bandKeys = ['arc-cloud-a', 'arc-cloud-b', 'arc-cloud-c'];
  bandKeys.forEach((key, i) => softCloud(scene, key, pal.cloud, 41 + i * 17, 1.25 - i * 0.15));
  const rows = tall
    ? [[220, 0.34, 0.028, 0], [540, 0.48, 0.05, 1], [880, 0.62, 0.075, 2], [1200, 0.72, 0.1, 1]]
    : [[38, 0.4, 0.03, 0], [128, 0.55, 0.06, 1], [218, 0.72, 0.095, 2]];
  rows.forEach(([y, alpha, factor, art], i) => {
    // keep the tile at its native height: scaling it vertically crops the soft
    // top/bottom fade and leaves a hard seam across the sky
    const t = scene.add.tileSprite(0, y, W, 260, bandKeys[art]).setOrigin(0).setAlpha(alpha)
      .setDepth(-16 + i).setTileScale(1.3 - art * 0.12, 1);
    t._factor = factor;
    clouds.push(t);
  });
  scene._clouds = clouds;

  if (opts.ridges !== false) {
    ridgeTex(scene, 'arc-ridge-far', pal.ridges[0], pal.ridges[1], 71);
    ridgeTex(scene, 'arc-ridge-near', pal.ridges[1], pal.ridges[2], 93);
    const far = scene.add.image(0, M.Y(318), 'arc-ridge-far').setOrigin(0, 1).setDepth(-12);
    far.setScale(W / far.width, tall ? 1.8 : 0.9);
    // the far ridge texture ends flat; fill its base in the same colour so the
    // sky never shows through as a seam between the two ridge layers
    scene.add.rectangle(0, M.Y(318), W, M.H - M.Y(318),
      Phaser.Display.Color.HexStringToColor(pal.ridges[1]).color, 1)
      .setOrigin(0, 0).setDepth(-11);
    const near = scene.add.image(0, M.Y(424), 'arc-ridge-near').setOrigin(0, 1).setDepth(-9).setAlpha(0.95);
    near.setScale(W / near.width, tall ? 2.1 : 0.78);
  }

  if (opts.ground !== false) {
    const gk = 'arc-ground-' + moodName;
    groundTex(scene, gk, M, moodName);
    scene.add.image(0, M.Y(422), gk).setOrigin(0).setDepth(6);
    const mist = scene.add.rectangle(0, M.Y(424), W, tall ? 90 : 46, Phaser.Display.Color.HexStringToColor(pal.mist).color, 0.12)
      .setOrigin(0, 0.5).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: mist, alpha: 0.2, duration: 3000, yoyo: true, repeat: -1 });
  }

  const rand = rng('motes-' + moodName);
  for (let i = 0; i < (tall ? 34 : 20); i++) {
    const dot = scene.add.circle(rand() * W, M.Y(rand() * 540), 1 + rand() * 2.2,
      Phaser.Display.Color.HexStringToColor(pal.motes).color, 0.18 + rand() * 0.3).setDepth(4);
    scene.tweens.add({
      targets: dot, x: dot.x + (rand() - 0.5) * 160, y: dot.y - 90 - rand() * 140,
      alpha: 0, duration: 5000 + rand() * 6000, delay: rand() * 4000, repeat: -1,
      ease: 'sine.out', onRepeat: () => { dot.x = rand() * W; dot.y = M.Y(rand() * 540); }
    });
  }

  const paintedLayers = scene.children.list.filter(child => !photoLayers.has(child));
  const photoMood = {'tide-causeway':'coast','nest-gather':'coast','spear-cast':'coast','cave-line':'cave'}[scene.def?.id] || moodName;
  addEnvironment(scene, W, M.H, photoMood, -10).then(background => {
    if (!background) return;
    // Remove only the common world's illustrated layers, never game platforms.
    paintedLayers.forEach(layer => { if (layer.depth < 0 || layer.depth === 6) layer.setVisible(false); });
  });
  scene._paintT = 0;
  scene.events.on('update', (t) => {
    scene._paintT = t;
    if (scene._clouds) scene._clouds.forEach((c) => { c.tilePositionX = t * 0.001 * c._factor * 40; });
  });
}

/* ----------------------------------------------------------------- audio */
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class ArcadeAudio {
  constructor() { this.ctx = null; this.muted = false; this.mood = 'dawn'; this.musicOn = false; this.timer = null; this.step = 0; this.nextTime = 0; this.tension = 0; }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    if (window.DUAudio) window.DUAudio.useContext(ctx);
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.8;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -18; this.comp.knee.value = 22; this.comp.ratio.value = 3.4;
    this.comp.attack.value = 0.006; this.comp.release.value = 0.28;
    this.master.connect(this.comp); this.comp.connect(ctx.destination);
    this.reverb = ctx.createConvolver(); this.reverb.buffer = this.impulse(2.3, 2.5);
    this.reverbGain = ctx.createGain(); this.reverbGain.gain.value = 0.28;
    this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.comp);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.42; this.musicBus.connect(this.master);
    this.musicSend = ctx.createGain(); this.musicSend.gain.value = 0.5; this.musicBus.connect(this.musicSend); this.musicSend.connect(this.reverb);
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    this.sfxSend = ctx.createGain(); this.sfxSend.gain.value = 0.3; this.sfxBus.connect(this.sfxSend); this.sfxSend.connect(this.reverb);
    this.air = this.noiseLoop();
  }

  impulse(seconds, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  noiseBuffer(seconds = 2) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + w * 0.02) * 0.995; d[i] = w * 0.7 + last * 2.2; }
    return buf;
  }

  noiseLoop() {
    const ctx = this.ctx, src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(3); src.loop = true;
    const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 480; band.Q.value = 0.5;
    const air = ctx.createBiquadFilter(); air.type = 'lowpass'; air.frequency.value = 1500;
    const gain = ctx.createGain(); gain.gain.value = 0.035;
    src.connect(band); band.connect(air); air.connect(gain); gain.connect(this.master);
    src.start();
    return { src, band, air, gain };
  }

  setMuted(m) { this.muted = m; if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.08); }

  setMood(mood) {
    this.mood = MOODS[mood] ? mood : 'dawn';
    if (!this.ctx) return;
    this.step = 0; this.nextTime = this.ctx.currentTime + 0.12;
    if (!this.musicOn) { this.musicOn = true; this.pump(); }
  }

  pump() { if (this.timer) return; this.timer = setInterval(() => this.schedule(), 120); }
  stopMusic() { this.musicOn = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  setTension(v) { this.tension = Math.max(0, Math.min(1, v)); }

  schedule() {
    if (!this.musicOn || !this.ctx) return;
    const s = MOODS[this.mood].music;
    const spb = 60 / s.bpm;
    while (this.nextTime < this.ctx.currentTime + 0.45) {
      this.playStep(this.step, this.nextTime, s, spb);
      this.step++;
      this.nextTime += spb * (this.step % 16 === 0 ? 2 : 1);
    }
  }

  playStep(step, t, s, spb) {
    const bar = Math.floor(step / 8), deg = s.scale;
    const root = s.root + (bar % 2 === 1 ? -2 : 0);
    if (step % 8 === 0) s.pad.forEach((iv, k) => this.pad(NOTE(root - 12 + iv), t, spb * 7, 0.05 - k * 0.007));
    const pattern = [0, 2, 4, 2, 5, 4, 6, 3];
    if (step % 2 === 0) {
      const idx = pattern[(step / 2 | 0) % pattern.length];
      const midi = root + deg[idx % deg.length] + (step % 16 === 8 ? 12 : 0);
      this.pluck(NOTE(midi), t, 0.042, 0.72);
    }
    if (this.tension > 0.45 && step % 2 === 0) this.thump(NOTE(root - 24), t, 0.028 * this.tension, 0.16);
    if (step % 32 === 24) this.bell(NOTE(root + 24), t, 0.028);
  }

  pad(freq, t, dur, gain) {
    const ctx = this.ctx, g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1000;
    [1, 1.005, 2].forEach((mult, i) => {
      const o = ctx.createOscillator(); o.type = i === 2 ? 'sine' : 'triangle'; o.frequency.value = freq * mult; o.detune.value = i * 4;
      const og = ctx.createGain(); og.gain.value = i === 2 ? 0.24 : 0.58; o.connect(og); og.connect(g);
      o.start(t); o.stop(t + dur + 0.1);
    });
    g.connect(lp); lp.connect(this.musicBus);
  }

  pluck(freq, t, gain, decay) {
    const ctx = this.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq; o2.type = 'triangle'; o2.frequency.value = freq * 2.002;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g2.gain.value = 0.22; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.musicBus);
    o.start(t); o2.start(t); o.stop(t + decay + 0.05); o2.stop(t + decay + 0.05);
  }

  bell(freq, t, gain) {
    const ctx = this.ctx;
    [1, 2.76, 5.4].forEach((mult, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain / (i + 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6 + i * 0.2);
      o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + 2);
    });
  }

  thump(freq, t, gain, dur) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq * 1.6, t); o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }

  burst({ dur = 0.2, freq = 900, q = 0.8, gain = 0.09, sweep = 0, type = 'bandpass' }) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime, src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(Math.max(0.4, dur + 0.1));
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(80, freq + sweep), t + dur);
    f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start(t); src.stop(t + dur + 0.05);
  }

  ui() { if (this.ctx) this.pluck(NOTE(81), this.ctx.currentTime, 0.045, 0.26); }

  sfx(name) {
    if (!this.ctx) return;
    // The recorded bank whenever it is on the page and has this file. It answers
    // true even when it deliberately swallows a duplicate, so the synthesised
    // sound below can never arrive a half-second late on top of a sample.
    const A = window.DUAudio;
    if (A && A.play(name, { dest: this.sfxBus })) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump': this.burst({ dur: 0.14, freq: 320, q: 0.9, gain: 0.05, sweep: 420 }); this.pluck(NOTE(72), t, 0.035, 0.2); break;
      case 'land': this.burst({ dur: 0.12, freq: 180, q: 0.7, gain: 0.06, sweep: -80, type: 'lowpass' }); break;
      case 'pick': [84, 88, 91].forEach((n, i) => this.pluck(NOTE(n), t + i * 0.05, 0.05, 0.4)); break;
      case 'good': [72, 76, 79, 84].forEach((n, i) => this.pluck(NOTE(n), t + i * 0.09, 0.06, 0.9)); this.bell(NOTE(96), t + 0.34, 0.03); break;
      case 'bad': this.thump(120, t, 0.14, 0.34); this.burst({ dur: 0.26, freq: 560, q: 0.6, gain: 0.1, sweep: -380, type: 'lowpass' }); break;
      case 'hurt': this.thump(98, t, 0.18, 0.4); break;
      case 'splash': this.burst({ dur: 0.4, freq: 900, q: 0.6, gain: 0.11, sweep: -620 }); break;
      case 'boom': this.thump(70, t, 0.2, 0.5); this.burst({ dur: 0.5, freq: 420, q: 0.5, gain: 0.15, sweep: -320, type: 'lowpass' }); break;
      case 'whoosh': this.burst({ dur: 0.28, freq: 700, q: 1.2, gain: 0.06, sweep: 900 }); break;
      case 'chime': this.bell(NOTE(88), t, 0.05); this.bell(NOTE(95), t + 0.08, 0.03); break;
      case 'win': [67, 71, 74, 79, 83, 86].forEach((n, i) => this.pluck(NOTE(n), t + i * 0.13, 0.07, 1.5)); this.bell(NOTE(98), t + 0.8, 0.035); break;
      case 'fail': [72, 68, 63, 59].forEach((n, i) => this.pluck(NOTE(n), t + i * 0.16, 0.06, 0.9)); break;
      case 'tick': this.pluck(NOTE(76), t, 0.025, 0.12); break;
      case 'drum1': this.thump(NOTE(38), t, 0.2, 0.34); this.burst({ dur: 0.16, freq: 240, q: 0.7, gain: 0.06, sweep: -120, type: 'lowpass' }); break;
      case 'drum2': this.thump(NOTE(45), t, 0.17, 0.28); this.burst({ dur: 0.12, freq: 420, q: 0.9, gain: 0.05, sweep: -180 }); break;
      case 'drum3': this.bell(NOTE(81), t, 0.035); this.thump(NOTE(50), t, 0.11, 0.2); break;
      case 'drum4': this.bell(NOTE(88), t, 0.03); this.burst({ dur: 0.1, freq: 1200, q: 1.2, gain: 0.04, sweep: -500 }); break;
      default: this.ui();
    }
  }
}

/* --------------------------------------------------------------- textures */
export function commonTextures(scene) {
  if (scene.textures.exists('arc-glow')) return;
  canvasTex(scene, 'arc-glow', 256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 4, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  });
  canvasTex(scene, 'arc-dot', 16, 16, (c) => {
    const g = c.createRadialGradient(8, 8, 1, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(8, 8, 8, 0, Math.PI * 2); c.fill();
  });
  canvasTex(scene, 'arc-spark', 24, 24, (c) => {
    c.fillStyle = '#fff';
    [[12, 0, 15, 9, 9, 9], [12, 24, 15, 15, 9, 15], [0, 12, 9, 9, 9, 15], [24, 12, 15, 9, 15, 15]]
      .forEach(([ax, ay, bx, by, cx, cy]) => {
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.closePath(); c.fill();
      });
  });
  canvasTex(scene, 'arc-ring', 96, 96, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.lineWidth = 7; c.beginPath(); c.arc(48, 48, 40, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.28)';
    c.lineWidth = 14; c.beginPath(); c.arc(48, 48, 40, 0, Math.PI * 2); c.stroke();
  });
  canvasTex(scene, 'arc-star', 48, 48, (c) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 20 : 8.5, a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push([24 + Math.cos(a) * r, 25 + Math.sin(a) * r]);
    }
    c.fillStyle = '#ffd77a';
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,70,20,0.45)'; c.lineWidth = 2; c.stroke();
  });
}

/* ------------------------------------------------------------- scene base */
export function makeScene(def) {
  return class ArcadeScene extends Phaser.Scene {
    constructor() { super({ key: 'arcade-' + def.id }); }

    create() {
      const scene = this;
      this.def = def;
      this.M = metrics();
      this.audio = shell.audio;
      this.audio.setMood(def.mood || 'dawn');
      this.finished = false;
      this.pausedGame = false;
      this.hudState = {};
      this.lastHud = 0;
      commonTextures(this);
      if (def.backdrop !== false) paintWorld(this, this.M, def.mood || 'dawn', def.backdropOpts || {});
      this.gameObj = def.create ? def.create(this) : null;
      shell.onReady(this);
    }

    update(time, delta) {
      if (this.finished) return;
      if (this.def.update) this.def.update(this, time, delta);
      const hud = this.hudState;
      if (time - this.lastHud > 90) { this.lastHud = time; shell.onHud(hud); }
    }

    /* helpers available to every game */
    Y(v) { return this.M.Y(v); }
    X(v) { return v; }
    // portrait stretches the play band, so heroes and props grow a little to
    // keep their presence without widening the arena
    get k() { return this.M.portrait ? 1.6 : 1; }
    // pointer coordinates are canvas pixels; games think in 0..540 stage units
    uY(py) { return this.M.portrait ? (py - this.M.top) / this.M.band : py; }
    uX(px) { return px; }

    hud(patch) { Object.assign(this.hudState, patch); }

    notice(text, ms = 1900) { shell.onNotice(text, ms); }

    sfx(name) { this.audio.sfx(name); }

    burst(x, y, tint = 0xffffff, n = 14, opts = {}) {
      const e = this.add.particles(x, y, opts.texture || 'arc-dot', {
        speed: { min: 70, max: 260 }, lifespan: opts.life || 520,
        scale: { start: opts.scale || 0.7, end: 0 }, tint,
        gravityY: opts.gravity || 0, quantity: n, emitting: false,
        rotate: opts.spin ? { min: 0, max: 360 } : 0
      }).setDepth(opts.depth || 40);
      e.explode(n);
      this.time.delayedCall((opts.life || 520) + 120, () => e.destroy());
    }

    popText(x, y, text, color = '#ffe6a8') {
      const t = this.add.text(x, y, text, {
        fontFamily: "'Iowan Old Style','Palatino Linotype',Georgia,serif",
        fontSize: '30px', fontStyle: 'bold', color, stroke: '#12262a', strokeThickness: 6
      }).setOrigin(0.5).setDepth(60);
      /* one flash can answer several beasts at once and their labels land on the
         same pixels, where they read as one garbled word: each new label climbs
         until it has clear air. */
      const live = this.__pops || (this.__pops = []);
      const half = Math.max(46, t.width * 0.62);
      let dy = 0, guard = 0;
      while (guard++ < 6 && live.some((p) => Math.abs(p.x - x) < half && Math.abs(p.y - (y + dy)) < 30)) dy -= 30;
      if (dy) t.setY(y + dy);
      const rec = { x, y: y + dy };
      live.push(rec);
      this.tweens.add({
        targets: t, y: y + dy - 56, alpha: 0, scale: 1.2, duration: 760, ease: 'cubic.out',
        onComplete: () => { t.destroy(); const i = live.indexOf(rec); if (i >= 0) live.splice(i, 1); }
      });
    }

    shake(ms = 140, amount = 0.006) { this.cameras.main.shake(ms, amount); }

    finish(win, stats = {}) {
      if (this.finished) return;
      this.finished = true;
      const score = Math.max(0, Math.round(stats.score || 0));
      const stars = win ? (def.stars ? (score >= def.stars[2] ? 3 : score >= def.stars[1] ? 2 : score >= def.stars[0] ? 1 : 0) : 3) : 0;
      this.audio.stopMusic();
      this.sfx(win ? 'win' : 'fail');
      if (win) this.burst(W / 2, this.M.Y(220), 0xffd77a, 26, { life: 900, gravity: 180, spin: true });
      shell.onFinish({ win, score, stars, note: stats.note || '', best: bestFor(def.id) });
    }

    /* the arcade shell owns pause; the scene just stops stepping */
    setPaused(on) {
      this.pausedGame = on;
      if (on) { this.audio.stopMusic(); this.scene.pause(); }
      else { this.audio.setMood(this.def.mood || 'dawn'); this.scene.resume(); }
    }
  };
}

/* ---------------------------------------------------------------- progress */
export function readSave() {
  try { const o = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; }
}
export function bestFor(id) { return Math.max(0, Number(readSave()[id]) || 0); }
export function saveStars(id, stars) {
  const save = readSave();
  if (stars > (Number(save[id]) || 0)) save[id] = stars;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* storage is optional */ }
  try {
    if (window.DUJourney && window.DUJourney.record) window.DUJourney.record('arcade.' + id, { stars });
  } catch { /* the ledger is optional */ }
}

/* --------------------------------------------------------------- utilities */
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function approach(v, target, step) { return v < target ? Math.min(v + step, target) : Math.max(v - step, target); }
export function starsMarkup(stars) {
  return Array.from({ length: 3 }, (_, i) => `<svg viewBox="0 0 48 48" aria-hidden="true" class="${i < stars ? 'lit' : ''}"><path d="M24 3l6.4 13.2 14.6 2.1-10.6 10.2 2.5 14.4L24 36.1 11.1 42.9l2.5-14.4L3 18.3l14.6-2.1z"/></svg>`).join('');
}
