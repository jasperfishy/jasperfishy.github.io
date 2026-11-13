// Burrow Sense — the sand cutaway.
// An alvarezsaur digs for a colony it cannot see. The ground answers when the
// snout is pressed to the wall; the air in the tunnel does not wait.

import { canvasTex, grain, rng, clamp, lerp, MOODS, W } from '../engine.js?v=du-cd75bb4cc7df44ba';

const SURFACE = 84;
const CELL = 40;
const COLS = 24;
const ROWS = 11;
const BOTTOM = SURFACE + ROWS * CELL;
const STAR = [7, 13, 20];
const BEST = 20;
const EARS = 430;
const TAU = Math.PI * 2;
const PAL = MOODS.amber;

const KINDS = ['colony', 'root', 'water', 'collapse'];
const CUE = {
  colony: {
    color: 0xffcf5a, rings: 3, spread: 0.62, gain: 0.17, freq: 58, trail: 22, label: 'colony',
    tex: 'bs-chamber', scale: 0.72, carve: 32, power: 1.7, word: 'tunnel', tint: '#ffe6a8'
  },
  root: {
    color: 0xf2f7ff, rings: 4, spread: 0.28, gain: 0.07, freq: 318, trail: 13, label: 'taproot',
    tex: 'bs-root', scale: 0.8, carve: 18, power: 0.7, word: 'jammed', tint: '#f2e2b8'
  },
  water: {
    color: 0x86e2ea, rings: 2, spread: 0.88, gain: 0.13, freq: 124, trail: 28, label: 'water',
    tex: 'bs-wet', scale: 0.78, carve: 28, power: 1.1, word: 'flooded', tint: '#a9f0ff'
  },
  collapse: {
    color: 0xcbb18a, rings: 5, spread: 0.5, gain: 0.08, freq: 206, trail: 16, label: 'loose roof',
    tex: 'bs-rubble', scale: 0.8, carve: 24, power: 1, word: 'roof goes', tint: '#dcc79c'
  }
};

const BAND_WORDS = ['close', 'near', 'mid', 'far', 'deep'];

const OPEN_LINES = [
  'the chamber opens warm',
  'the colony is louder than the sand',
  'grubs, and cooler air',
  'they moved seed here. you were right.'
];
const HURT_LINES = [
  'sand in the mouth. one feather gone.',
  'the tunnel gave you back to the light.',
  'up you come, gasping, into the heat.'
];

/* ------------------------------------------------------------------- art */
function diggerArt(scene) {
  const poses = {
    'dig-a': { claw: 1, head: 0.1, leg: 1 },
    'dig-b': { claw: -0.55, head: -0.05, leg: -1 },
    listen: { claw: 0.15, head: 0.85, press: true },
    walk: { claw: 0.1, head: 0, leg: 2 }
  };
  Object.keys(poses).forEach((name) => {
    const f = poses[name];
    canvasTex(scene, 'bs-digger-' + name, 196, 152, (c) => {
      const rand = rng(410 + name.length * 7);
      const duck = f.press ? 14 : 0;
      const hy = 52 + f.head * 14 + duck;

      c.strokeStyle = '#6a4a22';
      c.lineCap = 'round';
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(96, 112); c.quadraticCurveTo(92 + f.leg * 6, 126, 86 + f.leg * 8, 137);
      c.stroke();
      c.strokeStyle = '#e6d6a8';
      c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(86 + f.leg * 8, 137); c.lineTo(97 + f.leg * 8, 140); c.stroke();

      const tail = c.createLinearGradient(10, 60, 62, 100);
      tail.addColorStop(0, '#5a3d1c');
      tail.addColorStop(1, '#7d5726');
      c.strokeStyle = tail;
      c.lineWidth = 17;
      c.beginPath();
      c.moveTo(62, 94);
      c.quadraticCurveTo(30, 86 - duck * 0.6, 8, 68 - duck * 1.1);
      c.stroke();
      c.strokeStyle = '#4a3116';
      c.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const x = 62 - 54 * t;
        const y = 94 - 26 * t - duck * 0.8 * t;
        c.beginPath();
        c.moveTo(x, y - 6);
        c.quadraticCurveTo(x - 6, y - 17, x - 14, y - 13);
        c.stroke();
      }

      const body = c.createLinearGradient(56, 62, 130, 122);
      body.addColorStop(0, '#b07c39');
      body.addColorStop(0.52, '#82552a');
      body.addColorStop(1, '#4f351a');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(96, 94, 44, 29, -0.09, 0, TAU); c.fill();
      c.fillStyle = 'rgba(232,206,150,0.28)';
      c.beginPath(); c.ellipse(100, 111, 30, 10, -0.05, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(58,38,16,0.7)';
      c.lineWidth = 2.2;
      for (let i = 0; i < 9; i++) {
        const x = 62 + i * 8;
        c.beginPath();
        c.moveTo(x, 74 + Math.abs(i - 4) * 1.6);
        c.quadraticCurveTo(x + 3, 61 + Math.abs(i - 4) * 1.4, x + 12, 68 + Math.abs(i - 4));
        c.stroke();
      }

      c.strokeStyle = '#8a6130';
      c.lineWidth = 10;
      c.beginPath();
      c.moveTo(110, 114); c.quadraticCurveTo(114 - f.leg * 5, 128, 122 - f.leg * 7, 139);
      c.stroke();
      c.strokeStyle = '#efe0b4';
      c.lineWidth = 2.8;
      c.beginPath(); c.moveTo(122 - f.leg * 7, 139); c.lineTo(134 - f.leg * 7, 142); c.stroke();

      c.strokeStyle = '#9a6c33';
      c.lineWidth = 15;
      c.beginPath();
      c.moveTo(128, 78);
      c.quadraticCurveTo(150, 66 + duck * 0.4, 158, hy - 4);
      c.stroke();

      c.fillStyle = '#a8763a';
      c.beginPath(); c.ellipse(160, hy, 14, 10, -0.16, 0, TAU); c.fill();
      const snout = c.createLinearGradient(164, hy - 6, 196, hy + 6);
      snout.addColorStop(0, '#c99b56');
      snout.addColorStop(1, '#e8d7a8');
      c.fillStyle = snout;
      c.beginPath();
      c.moveTo(166, hy - 7);
      c.quadraticCurveTo(190, hy - 4, 195, hy + 2);
      c.quadraticCurveTo(186, hy + 8, 165, hy + 6);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(40,26,10,0.55)';
      c.beginPath(); c.arc(186, hy + 1, 1.4, 0, TAU); c.fill();

      c.fillStyle = '#fff3cf';
      c.beginPath(); c.arc(163, hy - 3, 4.4, 0, TAU); c.fill();
      c.fillStyle = '#1c130a';
      c.beginPath(); c.arc(164.2, hy - 3, 2.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath(); c.arc(162.4, hy - 4.4, 0.9, 0, TAU); c.fill();

      const wristY = 106 - f.claw * 14;
      c.strokeStyle = '#7d5726';
      c.lineWidth = 11;
      c.beginPath();
      c.moveTo(116, 96); c.quadraticCurveTo(136, 104, 150, wristY);
      c.stroke();
      c.strokeStyle = '#f4e7c2';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(150, wristY);
      c.quadraticCurveTo(176, wristY + 4, 184, wristY + 22);
      c.stroke();
      c.strokeStyle = 'rgba(120,90,40,0.55)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(152, wristY + 3);
      c.quadraticCurveTo(172, wristY + 9, 180, wristY + 20);
      c.stroke();

      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(40, 30, 190, 140);
      rim.addColorStop(0, 'rgba(255,236,180,0.26)');
      rim.addColorStop(0.55, 'rgba(255,236,180,0)');
      rim.addColorStop(1, 'rgba(255,150,70,0.14)');
      c.fillStyle = rim; c.fillRect(0, 0, 196, 152);
      c.globalCompositeOperation = 'source-over';
      grain(c, 196, 152, 0.035, 411 + rand() * 9);
    });
  });
}

function propArt(scene) {
  canvasTex(scene, 'bs-root', 128, 128, (c) => {
    const rand = rng(771);
    const g = c.createLinearGradient(10, 20, 118, 112);
    g.addColorStop(0, '#c7ab74');
    g.addColorStop(0.5, '#8f6f42');
    g.addColorStop(1, '#5b4227');
    c.strokeStyle = g;
    c.lineCap = 'round';
    c.lineWidth = 26;
    c.beginPath();
    c.moveTo(4, 32);
    c.quadraticCurveTo(58, 62, 124, 90);
    c.stroke();
    c.lineWidth = 11;
    c.beginPath(); c.moveTo(48, 56); c.quadraticCurveTo(58, 88, 44, 120); c.stroke();
    c.beginPath(); c.moveTo(92, 74); c.quadraticCurveTo(108, 52, 122, 30); c.stroke();
    c.strokeStyle = 'rgba(52,36,18,0.55)';
    c.lineWidth = 2.4;
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      c.beginPath();
      c.moveTo(4 + 120 * t, 32 + 58 * t - 9);
      c.quadraticCurveTo(14 + 108 * t, 32 + 58 * t, 20 + 100 * t, 42 + 50 * t);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,240,200,0.16)';
    for (let i = 0; i < 12; i++) {
      c.beginPath(); c.arc(10 + rand() * 108, 30 + rand() * 70, 1 + rand() * 2.4, 0, TAU); c.fill();
    }
    grain(c, 128, 128, 0.05, 773);
  });

  canvasTex(scene, 'bs-wet', 124, 104, (c) => {
    const g = c.createRadialGradient(62, 54, 4, 62, 54, 58);
    g.addColorStop(0, 'rgba(186,248,255,0.85)');
    g.addColorStop(0.45, 'rgba(72,168,190,0.68)');
    g.addColorStop(1, 'rgba(18,58,72,0.12)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(62, 54, 56, 42, 0.1, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(226,252,255,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(62, 40 + i * 12, 42 - i * 9, 9 - i * 1.6, 0.06, 0, Math.PI);
      c.stroke();
    }
  });

  canvasTex(scene, 'bs-rubble', 124, 104, (c) => {
    const rand = rng(809);
    c.fillStyle = 'rgba(12,10,6,0.55)';
    c.beginPath(); c.ellipse(62, 58, 54, 40, 0, 0, TAU); c.fill();
    for (let i = 0; i < 14; i++) {
      const x = 12 + rand() * 100;
      const y = 20 + rand() * 70;
      const s = 7 + rand() * 15;
      c.fillStyle = ['#6b5230', '#4e3b20', '#836444'][i % 3];
      c.beginPath();
      c.moveTo(x, y - s * 0.5);
      c.lineTo(x + s * 0.6, y);
      c.lineTo(x + s * 0.2, y + s * 0.55);
      c.lineTo(x - s * 0.5, y + s * 0.2);
      c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(230,206,150,0.2)';
    c.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) {
      c.beginPath();
      c.moveTo(14 + rand() * 90, 22 + rand() * 60);
      c.lineTo(20 + rand() * 84, 26 + rand() * 56);
      c.stroke();
    }
    grain(c, 124, 104, 0.05, 811);
  });

  canvasTex(scene, 'bs-chamber', 150, 118, (c) => {
    const rand = rng(823);
    const g = c.createRadialGradient(75, 58, 6, 75, 58, 72);
    g.addColorStop(0, 'rgba(255,226,150,0.5)');
    g.addColorStop(0.55, 'rgba(214,150,60,0.26)');
    g.addColorStop(1, 'rgba(90,58,20,0.04)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(75, 58, 70, 52, 0.05, 0, TAU); c.fill();
    for (let i = 0; i < 5; i++) {
      const x = 34 + (i % 3) * 42;
      const y = 44 + Math.floor(i / 3) * 30;
      c.fillStyle = 'rgba(255,238,190,0.28)';
      c.beginPath(); c.ellipse(x, y, 13, 9, 0.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(120,80,26,0.4)';
      c.beginPath(); c.ellipse(x, y + 3, 10, 5, 0.2, 0, TAU); c.fill();
    }
    for (let i = 0; i < 26; i++) {
      const x = 18 + rand() * 114;
      const y = 22 + rand() * 74;
      c.fillStyle = 'rgba(48,30,10,0.85)';
      c.beginPath(); c.ellipse(x, y, 2.6, 1.7, rand() * Math.PI, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,214,120,0.5)';
      c.beginPath(); c.arc(x + 2, y - 1, 0.8, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(255,214,120,0.3)';
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(75, 58, 62, 45, 0.05, 0, TAU); c.stroke();
    grain(c, 150, 118, 0.04, 827);
  });

  canvasTex(scene, 'bs-tuft', 96, 54, (c) => {
    const rand = rng(853);
    c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const bx = 48 + (rand() - 0.5) * 30;
      const tipX = bx + (rand() - 0.5) * 78;
      const tipY = 4 + rand() * 22;
      c.strokeStyle = ['#b6934a', '#d6b26a', '#8f6f34'][i % 3];
      c.lineWidth = 1.6 + rand() * 1.8;
      c.beginPath();
      c.moveTo(bx, 54);
      c.quadraticCurveTo((bx + tipX) / 2, 34, tipX, tipY);
      c.stroke();
    }
  });
}

function groundArt(scene, M, topPx, soilH) {
  canvasTex(scene, 'bs-sky', W, topPx, (c) => {
    const rand = rng('burrow-sky');
    const g = c.createLinearGradient(0, 0, 0, topPx);
    PAL.sky.forEach(([stop, color]) => g.addColorStop(stop, color));
    c.fillStyle = g; c.fillRect(0, 0, W, topPx);
    const sx = M.sunX;
    const sy = M.portrait ? M.Y(24) : topPx * 0.4;
    const halo = c.createRadialGradient(sx, sy, 6, sx, sy, M.portrait ? 430 : 240);
    halo.addColorStop(0, 'rgba(255,240,184,0.95)');
    halo.addColorStop(0.2, 'rgba(255,200,79,0.5)');
    halo.addColorStop(1, 'rgba(255,200,79,0)');
    c.globalCompositeOperation = 'screen';
    c.fillStyle = halo; c.fillRect(0, 0, W, topPx);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#fff6d6';
    c.beginPath(); c.arc(sx, sy, M.portrait ? 38 : 22, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,226,160,0.15)';
    for (let i = 0; i < 22; i++) {
      const y = rand() * topPx;
      const x = rand() * W;
      c.lineWidth = 1 + rand() * 2;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 40, y - 3, x + 70 + rand() * 90, y + 2);
      c.stroke();
    }
    grain(c, W, topPx, 0.014, 31);
  });

  canvasTex(scene, 'bs-soil', W, soilH, (c) => {
    const rand = rng('burrow-cut');
    const g = c.createLinearGradient(0, 0, 0, soilH);
    g.addColorStop(0, '#b08a45');
    g.addColorStop(0.06, '#8d6c36');
    g.addColorStop(0.3, '#6b4e22');
    g.addColorStop(0.62, '#4d3a1f');
    g.addColorStop(0.86, '#382a18');
    g.addColorStop(1, '#241a0f');
    c.fillStyle = g; c.fillRect(0, 0, W, soilH);

    for (let i = 0; i < 20; i++) {
      const y = 12 + (i / 20) * soilH;
      c.strokeStyle = i % 3 === 0 ? 'rgba(255,224,160,0.07)' : 'rgba(20,14,6,0.24)';
      c.lineWidth = 1.4 + rand() * 4;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= W; x += 60) c.lineTo(x, y + Math.sin(x * 0.008 + i * 1.3) * (5 + rand() * 9));
      c.stroke();
    }
    for (let i = 0; i < 260; i++) {
      const x = rand() * W;
      const y = 8 + rand() * (soilH - 12);
      const s = 1 + rand() * 3.4;
      c.fillStyle = rand() > 0.6 ? 'rgba(255,232,178,0.15)' : 'rgba(18,12,4,0.3)';
      c.beginPath(); c.ellipse(x, y, s, s * (0.5 + rand() * 0.5), rand() * Math.PI, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(74,52,22,0.5)';
    for (let i = 0; i < 34; i++) {
      const x = rand() * W;
      const len = 20 + rand() * 90;
      c.lineWidth = 1.2 + rand() * 2.6;
      c.beginPath();
      c.moveTo(x, 2);
      c.quadraticCurveTo(x + (rand() - 0.5) * 30, len * 0.6, x + (rand() - 0.5) * 54, len);
      c.stroke();
    }
    const crust = c.createLinearGradient(0, 0, 0, 16);
    crust.addColorStop(0, 'rgba(255,226,158,0.62)');
    crust.addColorStop(1, 'rgba(255,226,158,0)');
    c.fillStyle = crust; c.fillRect(0, 0, W, 16);

    const rockTop = M.Y(BOTTOM) - topPx;
    const rock = c.createLinearGradient(0, rockTop, 0, soilH);
    rock.addColorStop(0, 'rgba(14,12,8,0.5)');
    rock.addColorStop(1, 'rgba(6,6,4,0.94)');
    c.fillStyle = rock; c.fillRect(0, rockTop, W, soilH - rockTop);
    c.strokeStyle = 'rgba(200,170,110,0.12)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, rockTop);
    for (let x = 0; x <= W; x += 40) c.lineTo(x, rockTop + Math.sin(x * 0.03) * 3);
    c.stroke();
    grain(c, W, soilH, 0.05, 53);
  });

  canvasTex(scene, 'bs-dug', W, soilH, (c) => { c.clearRect(0, 0, W, soilH); });

  canvasTex(scene, 'bs-vig', W, M.H, (c) => {
    const cy = M.Y(272);
    const g = c.createRadialGradient(W / 2, cy, M.portrait ? 420 : 200, W / 2, cy, M.portrait ? 1180 : 540);
    g.addColorStop(0, 'rgba(10,7,3,0)');
    g.addColorStop(0.62, 'rgba(10,7,3,' + (M.portrait ? 0.12 : 0.2) + ')');
    g.addColorStop(1, 'rgba(10,7,3,' + (M.portrait ? 0.46 : 0.68) + ')');
    c.fillStyle = g; c.fillRect(0, 0, W, M.H);
  });
}

/* ---------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M;
  const K = scene.k;
  const topPx = M.Y(SURFACE);
  const soilH = M.H - topPx;
  const ly = (v) => M.Y(v) - topPx;
  const vScale = M.portrait ? M.band : 1;
  diggerArt(scene);
  propArt(scene);
  groundArt(scene, M, topPx, soilH);
  const rand = rng(20261129);

  const dugTex = scene.textures.get('bs-dug');
  const dctx = dugTex.getContext();
  let dirty = false;
  let lastFlush = 0;

  const cells = [];
  for (let i = 0; i < COLS * ROWS; i++) cells.push({ kind: null, dug: false, blocked: false, rubble: false, done: false });
  const features = [];
  const ripples = [];
  const path = [];

  const state = {
    air: 1, maxAir: 1, daylight: 1, hearts: 3, score: 0, level: 0,
    hold: false, holdT: 0, listen: false, rising: false, atSurface: true,
    flooded: 0, jam: 0, digging: false, airRate: 0, over: false, t: 0,
    pulseT: 0, visits: 0, collapsed: 0, cues: [], openLine: 0, hurtLine: 0, spawn: true
  };
  const p = { x: 470, y: SURFACE, tx: 520, ty: 250, dir: 1, bob: 0 };

  /* ------------------------------------------------------------- layers */
  scene.add.image(0, 0, 'bs-sky').setOrigin(0).setDepth(-20);
  scene.add.image(0, topPx, 'bs-soil').setOrigin(0).setDepth(-18);
  const dugImg = scene.add.image(0, topPx, 'bs-dug').setOrigin(0).setDepth(-17)
    .setBlendMode(Phaser.BlendModes.ADD);
  const heat = scene.add.rectangle(0, 0, W, topPx, 0xff8a2e, 0).setOrigin(0).setDepth(-16)
    .setBlendMode(Phaser.BlendModes.ADD);

  for (let i = 0; i < 16; i++) {
    scene.add.image(24 + rand() * (W - 48), M.Y(SURFACE + 2), 'bs-tuft').setOrigin(0.5, 1)
      .setScale((0.5 + rand() * 0.5) * K).setDepth(-13).setAlpha(0.72).setAngle((rand() - 0.5) * 14);
  }

  const veil = scene.add.rectangle(0, topPx, W, soilH, 0x120c05, 0.36).setOrigin(0).setDepth(10);
  const floodVeil = scene.add.rectangle(0, topPx, W, soilH, 0x0e4a5a, 0).setOrigin(0).setDepth(11);
  const lamp = scene.add.image(p.x, M.Y(p.y), 'arc-glow').setDepth(12).setScale(1.8 * K)
    .setAlpha(0.22).setTint(0xffc06a).setBlendMode(Phaser.BlendModes.ADD);
  const waveG = scene.add.graphics().setDepth(20);
  const crust = scene.add.graphics().setDepth(21);
  const digger = scene.add.image(p.x, M.Y(p.y), 'bs-digger-walk').setDepth(24).setScale(0.62 * K);
  const snoutGlow = scene.add.image(p.x, M.Y(p.y), 'arc-glow').setDepth(23).setScale(0.5 * K)
    .setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
  scene.add.image(0, 0, 'bs-vig').setOrigin(0).setDepth(30).setAlpha(0.9);

  const sand = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 34, max: 150 }, angle: { min: 0, max: 360 },
    lifespan: { min: 240, max: 560 }, scale: { start: 0.3, end: 0 },
    alpha: { start: 0.85, end: 0 }, tint: [0xffd98a, 0xe0b264, 0xb8873f],
    gravityY: 240, emitting: false
  }).setDepth(26);

  scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 0, max: W }, y: { min: topPx + 40, max: M.Y(BOTTOM) },
    speedX: { min: -8, max: 8 }, speedY: { min: -12, max: -2 },
    lifespan: { min: 2400, max: 4400 }, scale: { start: 0.2, end: 0 },
    alpha: { start: 0.28, end: 0 }, tint: 0xffe6a8, frequency: 520, quantity: 1
  }).setDepth(13);

  /* -------------------------------------------------------- soil paint */
  function paint(x, y, r, strength) {
    const px = clamp(x, -r, W + r);
    const py = ly(y);
    if (py < -r || py > soilH + r) return;
    const g = dctx.createRadialGradient(px, py, 1, px, py, r);
    g.addColorStop(0, 'rgba(255,232,178,' + (0.62 * strength) + ')');
    g.addColorStop(0.45, 'rgba(214,152,64,' + (0.4 * strength) + ')');
    g.addColorStop(1, 'rgba(110,66,18,0)');
    dctx.fillStyle = g;
    dctx.beginPath(); dctx.arc(px, py, r, 0, TAU); dctx.fill();
    dctx.strokeStyle = 'rgba(255,214,150,' + (0.34 * strength) + ')';
    dctx.lineWidth = 2.4;
    const a0 = rand() * TAU;
    dctx.beginPath(); dctx.arc(px, py, r * 0.86, a0, a0 + 2.2); dctx.stroke();
    dirty = true;
  }

  function erase(x, y, r) {
    const px = clamp(x, -r, W + r);
    const py = ly(y);
    dctx.globalCompositeOperation = 'destination-out';
    const g = dctx.createRadialGradient(px, py, 1, px, py, r);
    g.addColorStop(0, 'rgba(0,0,0,0.92)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g;
    dctx.beginPath(); dctx.arc(px, py, r, 0, TAU); dctx.fill();
    dctx.globalCompositeOperation = 'source-over';
    dirty = true;
  }

  function flush(time) {
    if (!dirty || time - lastFlush < 80) return;
    lastFlush = time;
    dirty = false;
    dugTex.refresh();
  }

  /* ------------------------------------------------------- world build */
  function gridOf(x, y) {
    return {
      c: clamp(Math.floor(x / CELL), 0, COLS - 1),
      r: clamp(Math.floor((y - SURFACE) / CELL), 0, ROWS - 1)
    };
  }
  function cellAt(x, y) {
    if (y <= SURFACE) return null;
    const { c, r } = gridOf(x, y);
    return cells[r * COLS + c];
  }
  function cellCenter(c, r) {
    return { x: c * CELL + CELL / 2, y: SURFACE + r * CELL + CELL / 2 };
  }

  function addFeature(kind, x, y) {
    const { c, r } = gridOf(x, y);
    const cell = cells[r * COLS + c];
    if (cell.kind) return null;
    const at = cellCenter(c, r);
    cell.kind = kind;
    const f = { kind, x: at.x, y: at.y, row: r, cell, done: false, opened: false, img: null, glow: null };
    features.push(f);
    return f;
  }

  function place(kind, opts) {
    const o = opts || {};
    const minRow = o.minRow || 1;
    const maxRow = o.maxRow == null ? ROWS - 1 : o.maxRow;
    const minDist = o.minDist || 0;
    for (let tries = 0; tries < 70; tries++) {
      const c = 1 + Math.floor(rand() * (COLS - 2));
      const r = minRow + Math.floor(rand() * Math.max(1, maxRow - minRow + 1));
      const at = cellCenter(c, r);
      if (Math.hypot(at.x - p.x, (at.y - p.y) * vScale) < minDist) continue;
      if (features.some((f) => Math.abs(f.x - at.x) < CELL * 1.2 && Math.abs(f.y - at.y) < CELL * 1.2)) continue;
      const made = addFeature(kind, at.x, at.y);
      if (made) return made;
    }
    return null;
  }

  const liveCount = (kind) => features.filter((f) => f.kind === kind && !f.done).length;

  function demand() {
    const l = state.level;
    return {
      colony: 3 + (l > 5 ? 1 : 0),
      root: 4 + Math.floor(l * 0.9),
      water: 2 + Math.floor(l * 0.6),
      collapse: 2 + Math.floor(l * 0.6),
      minRow: clamp(1 + Math.floor(l * 0.45), 1, ROWS - 3),
      minDist: 130 + l * 14
    };
  }

  function topUp() {
    if (!state.spawn) return;
    const d = demand();
    if (liveCount('colony') < d.colony) place('colony', { minRow: d.minRow, minDist: d.minDist });
    if (liveCount('root') < d.root) place('root', { maxRow: ROWS - 2 });
    if (liveCount('water') < d.water) place('water', { minRow: 2 });
    if (liveCount('collapse') < d.collapse) place('collapse', { minRow: 2 });
  }

  /* ------------------------------------------------------------- events */
  function reveal(f, key, scale) {
    f.img = scene.add.image(f.x, M.Y(f.y), key).setDepth(15)
      .setScale(scale * K).setAlpha(0.96).setAngle((rand() - 0.5) * 0.7);
    f.glow = scene.add.image(f.x, M.Y(f.y), 'arc-glow').setDepth(14.5)
      .setScale(0.9 * K).setAlpha(0.16).setTint(CUE[f.kind].color)
      .setBlendMode(Phaser.BlendModes.ADD);
    if (f.kind === 'root') f.img.setFlipX(rand() < 0.5);
  }

  function collapseBehind(n) {
    let closed = 0;
    for (let i = path.length - 2; i >= 0 && closed < n; i--) {
      const q = path[i];
      const cell = cellAt(q.x, q.y);
      if (!cell || cell.rubble) continue;
      cell.rubble = true;
      cell.dug = false;
      erase(q.x, q.y, 26);
      closed++;
    }
    state.collapsed += closed;
    return closed;
  }

  function hit(f) {
    const c = CUE[f.kind];
    f.done = true;
    reveal(f, c.tex, c.scale);
    paint(f.x, f.y, c.carve, c.power);
    if (f.kind === 'colony') {
      f.opened = true;
      const value = f.row >= 6 ? 2 : 1;
      state.score += value;
      state.air = Math.min(state.maxAir, state.air + 0.07);
      scene.burst(f.x, M.Y(f.y), c.color, 16, { life: 620, gravity: 120, spin: true, scale: 0.7 });
      scene.popText(f.x, M.Y(f.y - 34), '+' + value + (value > 1 ? ' tunnels' : ' tunnel'), c.tint);
      scene.sfx(value > 1 ? 'good' : 'chime');
      scene.shake(90, 0.004);
      scene.notice(OPEN_LINES[state.openLine++ % OPEN_LINES.length], 1700);
      topUp();
      return;
    }
    scene.burst(f.x, M.Y(f.y), c.color, 13, { life: 580, gravity: 190 });
    scene.popText(f.x, M.Y(f.y - 30), c.word, c.tint);
    if (f.kind === 'root') {
      f.cell.blocked = true;
      state.jam = 0.55;
      scene.sfx('bad');
      scene.shake(210, 0.011);
      scene.notice('a taproot. the wall will not give — dig around it.', 2100);
    } else if (f.kind === 'water') {
      state.flooded = 20;
      scene.sfx('splash');
      scene.notice('water. the dark is heavier now.', 2000);
    } else {
      f.cell.rubble = true;
      const closed = collapseBehind(9);
      scene.sfx('boom');
      scene.shake(340, 0.017);
      scene.cameras.main.flash(280, 40, 26, 8);
      scene.popText(p.x, M.Y(p.y - 30), closed > 1 ? 'way closed' : c.word, c.tint);
      scene.notice('the roof goes. the way back is not yours any more.', 2200);
    }
  }

  function resolve(cell) {
    if (!cell || !cell.kind || cell.done) return;
    const f = features.find((x) => x.cell === cell);
    if (!f) return;
    cell.done = true;
    hit(f);
  }

  function buried() {
    state.hearts--;
    state.air = 0.55 * state.maxAir;
    state.flooded = 0;
    state.rising = false;
    state.listen = false;
    state.hold = false;
    state.atSurface = true;
    state.jam = 0.4;
    collapseBehind(12);
    p.x = clamp(p.x, 30, W - 30);
    p.y = SURFACE;
    aim(p.x, SURFACE);
    scene.sfx('hurt');
    scene.shake(330, 0.018);
    scene.cameras.main.flash(300, 60, 34, 8);
    scene.burst(p.x, M.Y(SURFACE), 0xd9b477, 16, { life: 700, gravity: 260 });
    scene.popText(p.x, M.Y(SURFACE - 40), 'buried', '#ffcf9a');
    if (state.hearts > 0) scene.notice(HURT_LINES[state.hurtLine++ % HURT_LINES.length], 2100);
    else endRun(false);
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    const short = Math.max(0, STAR[0] - state.score);
    scene.finish(win, {
      score: state.score,
      note: win
        ? state.score >= BEST ? 'every chamber in the sand is mapped' : `${state.score} tunnels cut by ear alone`
        : short > 0 ? `the sand keeps the last ${short} of them` : `${state.score} tunnels, and the light went`
    });
  }

  /* ---------------------------------------------------------- listening */
  function tone(kind, strength) {
    const a = scene.audio;
    if (!a || !a.ctx) return;
    const c = CUE[kind];
    const t = a.ctx.currentTime;
    try {
      if (kind === 'colony') {
        a.thump(c.freq, t, c.gain * (0.5 + strength), 0.5);
        a.burst({ dur: 0.32, freq: 210, q: 0.4, gain: 0.03 * strength, sweep: -70, type: 'lowpass' });
      } else if (kind === 'root') {
        a.bell(c.freq, t, c.gain * (0.5 + strength));
        a.burst({ dur: 0.07, freq: 2400, q: 1.4, gain: 0.026 * strength });
      } else if (kind === 'water') {
        a.thump(c.freq, t, c.gain * (0.5 + strength), 0.34);
        a.burst({ dur: 0.3, freq: 430, q: 0.5, gain: 0.045 * strength, sweep: -280, type: 'lowpass' });
      } else {
        a.thump(c.freq, t, c.gain * (0.5 + strength), 0.18);
        a.burst({ dur: 0.5, freq: 170, q: 0.7, gain: 0.05 * strength, sweep: -60, type: 'lowpass' });
      }
    } catch { /* the audio clock is optional */ }
  }

  function pulse() {
    const found = [];
    KINDS.forEach((kind) => {
      let best = null;
      for (const f of features) {
        if (f.kind !== kind || f.done) continue;
        const gx = f.x - p.x;
        const gy = (f.y - p.y) * vScale;
        const d = Math.hypot(gx, gy);
        if (d > EARS) continue;
        if (!best || d < best.d) best = { f, d, gx, gy };
      }
      if (!best) return;
      const game = Math.hypot(best.f.x - p.x, best.f.y - p.y);
      const band = Math.max(1, Math.round(game / 70));
      found.push({
        kind,
        dist: game,
        band,
        px: (band * 70) * (best.d / Math.max(1, game)),
        angle: Math.atan2(best.gy, best.gx),
        strength: clamp(1 - best.d / EARS, 0.08, 1)
      });
    });
    found.sort((a, b) => b.strength - a.strength);
    state.cues = found;
    found.forEach((c) => {
      const arrive = 0.3 + c.px / 620;
      ripples.push({
        kind: c.kind, angle: c.angle, px: c.px, t: 0, arrive,
        life: arrive + 0.5, strength: c.strength,
        jx: (rand() - 0.5) * 30, jy: (rand() - 0.5) * 26
      });
      tone(c.kind, c.strength);
    });
    if (found.length) {
      scene.shake(70, 0.0016);
      snoutGlow.setAlpha(0.45);
    } else {
      scene.sfx('tick');
      if (rand() < 0.4) scene.notice('nothing but the grit of the sand.', 1400);
    }
    return found;
  }

  /* ------------------------------------------------------------ motion */
  function aim(x, y) {
    p.tx = clamp(x, 24, W - 24);
    p.ty = clamp(y, SURFACE - 20, BOTTOM - 8);
  }

  function rise() {
    if (state.atSurface || state.over) return;
    state.rising = true;
    state.listen = false;
    state.hold = false;
    aim(p.x, SURFACE);
    scene.sfx('whoosh');
  }

  function passable(x, y) {
    if (y <= SURFACE + 1) return true;
    const cell = cellAt(x, y);
    return !cell || !cell.blocked;
  }

  function carveTrail(fromX, fromY) {
    if (Math.hypot(p.x - fromX, p.y - fromY) < 0.4) return;
    const cell = cellAt(p.x, p.y);
    const fresh = cell && !cell.dug;
    paint(p.x, p.y, fresh ? 24 : 15, fresh ? 1.15 : 0.45);
    if (cell) cell.dug = true;
    const last = path[path.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 12) {
      path.push({ x: p.x, y: p.y });
      if (path.length > 300) path.shift();
    }
    if (state.digging && rand() < 0.6) {
      sand.emitParticleAt(p.x + p.dir * 26 * K, M.Y(p.y) + 5 * K, 2);
    }
  }

  let downReal = 0;
  let downX = 0;
  let downY = 0;
  let travel = 0;

  scene.input.on('pointerdown', (ptr) => {
    state.hold = true;
    state.holdT = 0;
    downReal = scene.time.now;
    downX = ptr.x;
    downY = scene.uY(ptr.y);
    travel = 0;
    aim(ptr.x, scene.uY(ptr.y));
  });
  scene.input.on('pointermove', (ptr) => {
    const step = Math.hypot(ptr.x - downX, scene.uY(ptr.y) - downY);
    if (state.hold) {
      travel += step;
      // a dragging finger aims; only a still finger presses the snout to the wall
      if (step > 2) { state.holdT = 0; state.listen = false; }
    }
    downX = ptr.x;
    downY = scene.uY(ptr.y);
    aim(ptr.x, scene.uY(ptr.y));
  });
  scene.input.on('pointerup', () => {
    state.hold = false;
    state.holdT = 0;
    state.listen = false;
    if (scene.time.now - downReal < 260 && travel < 26) rise();
  });

  const keys = scene.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    w: 'W', a: 'A', s: 'S', d: 'D'
  });
  scene.input.keyboard.on('keydown-SPACE', () => { state.hold = true; state.holdT = 0.2; });
  scene.input.keyboard.on('keyup-SPACE', () => { state.hold = false; state.listen = false; });
  scene.input.keyboard.on('keydown-E', () => rise());

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'hold to listen' });
  scene.notice('press your snout to the wall and listen. tap to rise for air.', 3200);

  /* ------------------------------------------------------------ update */
  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.t += dt;

    state.level = clamp(Math.floor(state.score / 2), 0, 9);
    state.maxAir = clamp(1 - state.level * 0.045, 0.62, 1);
    state.air = Math.min(state.air, state.maxAir);

    const kb = 340 * dt;
    if (keys.left.isDown || keys.a.isDown) p.tx -= kb;
    if (keys.right.isDown || keys.d.isDown) p.tx += kb;
    if (keys.up.isDown || keys.w.isDown) p.ty -= kb;
    if (keys.down.isDown || keys.s.isDown) p.ty += kb;
    p.tx = clamp(p.tx, 24, W - 24);
    p.ty = clamp(p.ty, SURFACE - 20, BOTTOM - 8);

    if (state.hold && !state.rising) {
      state.holdT += dt;
      if (state.holdT > 0.18) {
        if (!state.listen) { pulse(); state.pulseT = 0; }
        state.listen = true;
        state.pulseT += dt;
        if (state.pulseT > 0.66) { state.pulseT = 0; pulse(); }
      }
    } else if (!state.hold) {
      state.listen = false;
    }

    state.digging = false;
    const wasX = p.x;
    const wasY = p.y;

    if (state.atSurface && !state.rising && p.ty > SURFACE + 14) {
      state.atSurface = false;
      scene.sfx('whoosh');
    }

    if (state.jam > 0) {
      state.jam -= dt;
    } else if (state.listen) {
      p.dir = p.tx >= p.x ? 1 : -1;
    } else if (state.rising) {
      p.y = Math.max(SURFACE, p.y - 200 * dt);
      const cell = cellAt(p.x, p.y);
      if (cell) cell.dug = true;
      carveTrail(wasX, wasY);
      if (p.y <= SURFACE) {
        state.rising = false;
        state.atSurface = true;
        state.visits++;
        state.flooded = 0;
        scene.sfx('land');
        scene.burst(p.x, M.Y(SURFACE), 0xffe0a8, 10, { life: 520, gravity: 180 });
        scene.notice('the sun is a weight on the back. breathe.', 1600);
      }
    } else if (state.atSurface) {
      const dx = p.tx - p.x;
      if (Math.abs(dx) > 5) {
        p.x = clamp(p.x + clamp(dx, -1, 1) * 170 * dt, 24, W - 24);
        p.dir = dx >= 0 ? 1 : -1;
        p.bob += dt * 9;
      }
    } else {
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 3) {
        const here = cellAt(p.x, p.y);
        const slow = here && here.rubble && !here.dug;
        const step = (slow ? 92 : 168) * dt;
        const nx = p.x + (dx / d) * step;
        const ny = p.y + (dy / d) * step;
        if (passable(nx, p.y)) p.x = clamp(nx, 20, W - 20);
        if (passable(p.x, ny)) p.y = clamp(ny, SURFACE, BOTTOM - 6);
        p.dir = dx >= 0 ? 1 : -1;
        state.digging = p.y > SURFACE + 1;
        carveTrail(wasX, wasY);
        const entered = cellAt(p.x, p.y);
        if (entered && entered.kind && !entered.done) {
          p.x = wasX;
          p.y = wasY;
          resolve(entered);
        }
      }
    }
    if (!state.rising && p.y <= SURFACE + 1 && p.ty <= SURFACE + 14) {
      state.atSurface = true;
      p.y = SURFACE;
    }

    const depthFrac = clamp((p.y - SURFACE) / (BOTTOM - SURFACE), 0, 1);
    if (!state.atSurface) {
      const modeMul = state.digging ? 1.5 : state.listen ? 0.55 : 0.95;
      state.airRate = (0.026 + depthFrac * 0.05) * modeMul * (state.flooded > 0 ? 2 : 1) * (1 + state.level * 0.05);
      state.air -= state.airRate * dt;
      if (state.air <= 0) { state.air = 0; buried(); }
    } else {
      state.airRate = 0;
      state.air = Math.min(state.maxAir, state.air + dt * 0.52);
    }
    if (state.flooded > 0) state.flooded = Math.max(0, state.flooded - dt);

    const heatRate = 0.0045 + (state.atSurface ? 0.013 + state.visits * 0.0032 : 0);
    state.daylight = Math.max(0, state.daylight - heatRate * dt);
    heat.setFillStyle(0xff8a2e, clamp((1 - state.daylight) * 0.18 + (state.atSurface ? 0.05 : 0), 0, 0.3));

    const pose = state.listen ? 'listen' : state.atSurface ? 'walk'
      : state.digging ? (Math.floor(time / 130) % 2 ? 'dig-a' : 'dig-b') : 'walk';
    digger.setTexture('bs-digger-' + pose);
    digger.x = p.x;
    digger.y = M.Y(p.y) + (state.atSurface ? -Math.abs(Math.sin(p.bob)) * 3 * K : Math.sin(time / 260) * 1.2);
    digger.setFlipX(p.dir < 0);
    digger.setAngle(state.listen ? 9 : state.rising ? -16 : 0);

    snoutGlow.x = p.x + p.dir * 32 * K;
    snoutGlow.y = M.Y(p.y) + 4;
    snoutGlow.setAlpha(Math.max(0, snoutGlow.alpha - dt * 1.6) + (state.listen ? 0.12 : 0));
    snoutGlow.setScale((0.45 + (state.listen ? 0.22 : 0)) * K);
    if (state.digging && rand() < dt * 12) sand.emitParticleAt(p.x + p.dir * 28 * K, M.Y(p.y) + 6, 1);

    lamp.x = p.x;
    lamp.y = M.Y(p.y);
    lamp.setScale(lerp(1.2, 2, state.air / state.maxAir) * K);
    lamp.setAlpha(0.14 + Math.sin(time / 520) * 0.02 + state.air * 0.12);

    veil.setAlpha(0.2 + (1 - state.air / state.maxAir) * 0.3);
    floodVeil.setAlpha(state.flooded > 0 ? 0.18 + Math.sin(time / 700) * 0.04 : 0);
    dugImg.setAlpha(0.95 + Math.sin(time / 1400) * 0.05);

    crust.clear();
    crust.lineStyle(2 * K, 0xffd98a, 0.22);
    crust.beginPath();
    crust.moveTo(0, M.Y(SURFACE));
    for (let x = 0; x <= W; x += 24) crust.lineTo(x, M.Y(SURFACE) + Math.sin(x * 0.03 + time / 900) * 1.6);
    crust.strokePath();

    waveG.clear();
    const cx = p.x;
    const cy = M.Y(p.y);
    for (let i = ripples.length - 1; i >= 0; i--) {
      const w = ripples[i];
      w.t += dt;
      if (w.t > w.life) { ripples.splice(i, 1); continue; }
      const c = CUE[w.kind];
      const fade = clamp(1 - w.t / w.life, 0, 1);
      const front = (w.t / w.arrive) * w.px;
      for (let k = 0; k < c.rings; k++) {
        const rr = front - k * c.trail * K;
        if (rr < 8) continue;
        const jitter = w.kind === 'collapse' ? Math.sin(w.t * 46 + k) * 3 * K : 0;
        const wob = w.kind === 'water' ? Math.sin(w.t * 9 + k) * 5 * K : 0;
        const sp = c.spread * (1 - k * 0.12);
        const al = fade * w.strength * (1 - k / c.rings);
        waveG.lineStyle((w.kind === 'root' ? 2.6 : 5 - k * 0.5) * K, c.color, al);
        waveG.beginPath();
        waveG.arc(cx, cy, Math.max(2, rr + jitter + wob), w.angle - sp, w.angle + sp);
        waveG.strokePath();
      }
      if (front >= w.px) {
        const bl = clamp(1 - (front - w.px) / 70, 0, 1) * w.strength;
        const bx = cx + Math.cos(w.angle) * (w.px + w.jx);
        const by = cy + Math.sin(w.angle) * (w.px + w.jy);
        waveG.fillStyle(c.color, bl * 0.5);
        waveG.fillCircle(bx, by, 7 * K);
        waveG.fillStyle(c.color, bl * 0.2);
        waveG.fillCircle(bx, by, 16 * K);
        waveG.lineStyle(1.6 * K, c.color, bl * 0.7);
        for (let s = 0; s < 3; s++) {
          waveG.beginPath();
          waveG.arc(bx, by, (10 + s * 9) * K, w.angle - 0.5, w.angle + 0.5);
          waveG.strokePath();
        }
      }
    }

    features.forEach((f) => {
      if (f.glow) f.glow.setAlpha(0.12 + (f.opened ? 0.16 : 0) + Math.sin(time / 620 + f.x * 0.05) * 0.05);
    });

    topUp();
    flush(time);

    const top = state.cues[0];
    scene.hud({
      score: state.score,
      progress: state.air / state.maxAir,
      hearts: state.hearts,
      extra: state.listen
        ? (top ? 'listening — ' + CUE[top.kind].label + ', ' + BAND_WORDS[Math.min(top.band - 1, 4)] : 'listening — nothing but grit')
        : state.flooded > 0 ? 'flooded — air goes fast'
        : state.air < 0.26 ? 'air low — rise'
        : state.atSurface ? 'hot sand, deep sand waits'
        : state.digging ? 'digging' : 'hold to listen'
    });
    scene.audio.setTension(clamp((1 - state.air / state.maxAir) * 0.7 + (1 - state.daylight) * 0.3, 0, 1));

    if (state.score >= BEST) { endRun(true); return; }
    if (state.daylight <= 0) endRun(state.score >= STAR[0]);
  }

  /* --------------------------------------------------------- debug face */
  const r2 = (v) => Math.round(v * 100) / 100;

  return {
    update,
    state: () => ({
      tunnels: state.score,
      time: Number(state.t.toFixed(2)),
      hearts: state.hearts,
      air: r2(state.air),
      maxAir: r2(state.maxAir),
      airRate: Number(state.airRate.toFixed(4)),
      daylight: r2(state.daylight),
      level: state.level,
      listening: state.listen,
      holding: state.hold,
      rising: state.rising,
      digging: state.digging,
      atSurface: state.atSurface,
      flooded: state.flooded > 0,
      jammed: state.jam > 0,
      collapsed: state.collapsed,
      visits: state.visits,
      x: Math.round(p.x),
      y: Math.round(p.y),
      aim: [Math.round(p.tx), Math.round(p.ty)],
      depth: r2(clamp((p.y - SURFACE) / (BOTTOM - SURFACE), 0, 1)),
      over: state.over,
      cues: state.cues.map((c) => ({
        kind: c.kind, band: c.band, dist: Math.round(c.dist),
        angle: r2(c.angle), strength: r2(c.strength), tone: CUE[c.kind].freq
      })),
      features: features.map((f) => ({
        kind: f.kind, x: Math.round(f.x), y: Math.round(f.y),
        done: f.done, opened: f.opened, blocked: f.cell.blocked, revealed: !!f.img
      }))
    }),
    setDigger: (x, y) => {
      p.x = clamp(x, 24, W - 24);
      p.y = clamp(y, SURFACE, BOTTOM - 8);
      p.tx = p.x;
      p.ty = p.y + 24;
      state.atSurface = p.y <= SURFACE + 1;
      state.rising = false;
      path.push({ x: p.x, y: p.y });
      paint(p.x, p.y, 24, 1.2);
    },
    digTo: (x, y) => aim(x, y),
    setListen: (on) => {
      state.hold = !!on;
      if (!on) { state.listen = false; return []; }
      state.listen = true;
      return pulse().map((c) => ({ kind: c.kind, band: c.band, strength: r2(c.strength), tone: CUE[c.kind].freq }));
    },
    pulse: () => pulse().map((c) => ({
      kind: c.kind, band: c.band, dist: Math.round(c.dist), strength: r2(c.strength), tone: CUE[c.kind].freq
    })),
    surface: () => rise(),
    addFeatureAt: (kind, x, y) => {
      const f = addFeature(kind, x, y);
      if (f) topUp();
      return f ? { kind: f.kind, x: Math.round(f.x), y: Math.round(f.y) } : null;
    },
    setSpawn: (on) => { state.spawn = !!on; },
    clearFeatures: () => {
      features.forEach((f) => {
        if (f.img) f.img.destroy();
        if (f.glow) f.glow.destroy();
        f.cell.kind = null;
        f.cell.done = false;
        f.cell.blocked = false;
      });
      features.length = 0;
      state.cues = [];
      return features.length;
    },
    setAir: (v) => { state.air = clamp(v, 0, state.maxAir); },
    setHearts: (v) => { state.hearts = clamp(Math.round(v), 0, 3); },
    setDaylight: (v) => { state.daylight = clamp(v, 0, 1); },
    setScore: (v) => { state.score = Math.max(0, Math.round(v)); },
    toCanvas: (gx, gy) => {
      const cv = scene.game.canvas;
      const rect = cv.getBoundingClientRect();
      return { x: rect.left + gx * (rect.width / cv.width), y: rect.top + M.Y(gy) * (rect.height / cv.height) };
    }
  };
}

export default {
  id: 'burrow-sense', unit: 'tunnels', mood: 'amber', stars: STAR,
  // the whole frame is a soil cutaway: the shared horizon ridges would read as
  // bushes growing inside the bank
  backdrop: false,
  create,
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
