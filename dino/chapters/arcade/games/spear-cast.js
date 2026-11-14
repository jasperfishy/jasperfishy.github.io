// Spear Cast — the bright shallows.
// The water lies about where the fish is. Draw, lead, and cast at the shadow.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-b206df16c491b071';

const SURFACE = 62;
const FLOOR = 496;
const FEET_Y = 450;
const STAR = [8, 15, 24];
const DRAG = 1.15;
const SINK = 38;
const V0 = 300;
const V1 = 780;
const STOP = 130;

// light bends the bright image of a fish up out of its real depth, and the
// bend grows with depth: the spear only ever lands where the shadow is
const refr = (y) => clamp((y - SURFACE) * 0.22, 6, 84);
const reach = (p) => (V0 + V1 * clamp(p, 0.05, 1) - STOP) / DRAG;

const TIER = [
  { key: 'silver', w: 62, h: 36, rad: 13, value: 1, lo: 104, hi: 206 },
  { key: 'gold', w: 76, h: 44, rad: 16, value: 2, lo: 206, hi: 312 },
  { key: 'deep', w: 94, h: 54, rad: 19, value: 3, lo: 312, hi: 428 }
];

function fishTex(scene, key, w, h, top, bottom, dark) {
  canvasTex(scene, key, w, h, (c) => {
    const cx = w * 0.5, cy = h * 0.52;
    c.lineCap = 'round';
    c.fillStyle = bottom;
    c.beginPath(); c.moveTo(cx - w * 0.3, cy); c.lineTo(cx - w * 0.48, cy - h * 0.4);
    c.quadraticCurveTo(cx - w * 0.4, cy, cx - w * 0.48, cy + h * 0.4); c.closePath(); c.fill();

    const g = c.createLinearGradient(0, cy - h * 0.45, 0, cy + h * 0.45);
    g.addColorStop(0, top); g.addColorStop(0.62, bottom); g.addColorStop(1, dark);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(cx + w * 0.42, cy);
    c.quadraticCurveTo(cx + w * 0.14, cy - h * 0.44, cx - w * 0.12, cy - h * 0.34);
    c.quadraticCurveTo(cx - w * 0.32, cy - h * 0.16, cx - w * 0.32, cy);
    c.quadraticCurveTo(cx - w * 0.3, cy + h * 0.22, cx - w * 0.1, cy + h * 0.34);
    c.quadraticCurveTo(cx + w * 0.18, cy + h * 0.42, cx + w * 0.42, cy); c.closePath(); c.fill();

    c.fillStyle = dark;
    c.beginPath(); c.moveTo(cx - w * 0.02, cy - h * 0.32);
    c.quadraticCurveTo(cx + w * 0.08, cy - h * 0.52, cx + w * 0.2, cy - h * 0.3); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(cx + w * 0.02, cy + h * 0.3);
    c.quadraticCurveTo(cx + w * 0.12, cy + h * 0.48, cx + w * 0.22, cy + h * 0.24); c.closePath(); c.fill();

    c.strokeStyle = 'rgba(255,255,255,0.28)';
    c.lineWidth = Math.max(1.2, h * 0.045);
    c.beginPath(); c.moveTo(cx + w * 0.28, cy - h * 0.02);
    c.quadraticCurveTo(cx + w * 0.02, cy - h * 0.1, cx - w * 0.26, cy + h * 0.02); c.stroke();

    c.fillStyle = 'rgba(255,255,255,0.38)';
    c.beginPath(); c.ellipse(cx + w * 0.1, cy - h * 0.16, w * 0.14, h * 0.07, -0.16, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f7f2d8';
    c.beginPath(); c.arc(cx + w * 0.3, cy - h * 0.06, h * 0.11, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#0f2429';
    c.beginPath(); c.arc(cx + w * 0.315, cy - h * 0.06, h * 0.06, 0, Math.PI * 2); c.fill();
    grain(c, w, h, 0.03, 19 + w);
  });
}

function art(scene) {
  const pal = MOODS.underwater;

  canvasTex(scene, 'sc-hunter', 170, 230, (c) => {
    c.lineCap = 'round';
    c.lineJoin = 'round';

    c.strokeStyle = '#6f4a2c';
    c.lineWidth = 16;
    c.beginPath(); c.moveTo(84, 150); c.quadraticCurveTo(72, 190, 64, 222); c.stroke();
    c.strokeStyle = '#93623b';
    c.lineWidth = 17;
    c.beginPath(); c.moveTo(97, 152); c.quadraticCurveTo(106, 192, 112, 224); c.stroke();
    c.fillStyle = '#4d3320';
    c.beginPath(); c.ellipse(60, 224, 12, 5, -0.1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(118, 226, 13, 5, 0.08, 0, Math.PI * 2); c.fill();

    const body = c.createLinearGradient(62, 70, 132, 158);
    body.addColorStop(0, '#c58e5c'); body.addColorStop(0.6, '#a06c3e'); body.addColorStop(1, '#7c5030');
    c.fillStyle = body;
    c.beginPath(); c.moveTo(72, 154); c.quadraticCurveTo(64, 110, 86, 80);
    c.quadraticCurveTo(110, 60, 124, 84); c.quadraticCurveTo(130, 124, 112, 154);
    c.closePath(); c.fill();

    c.fillStyle = '#8e4530';
    c.beginPath(); c.moveTo(70, 150); c.quadraticCurveTo(94, 164, 116, 146); c.lineTo(119, 122);
    c.quadraticCurveTo(92, 138, 67, 122); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,226,170,0.3)';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(72 + i * 12, 126 + i * 2); c.lineTo(76 + i * 12, 152); c.stroke();
    }

    c.strokeStyle = '#8a5a36';
    c.lineWidth = 12;
    c.beginPath(); c.moveTo(90, 92); c.quadraticCurveTo(104, 98, 116, 93); c.stroke();
    c.strokeStyle = '#b07a44';
    c.lineWidth = 12;
    c.beginPath(); c.moveTo(100, 86); c.quadraticCurveTo(118, 88, 130, 95); c.stroke();
    c.fillStyle = '#c9945f';
    c.beginPath(); c.arc(116, 92, 6.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(131, 95, 7, 0, Math.PI * 2); c.fill();

    c.fillStyle = '#cb9260';
    c.beginPath(); c.ellipse(118, 52, 19, 21, 0.14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a2018';
    c.beginPath(); c.moveTo(100, 46); c.quadraticCurveTo(102, 22, 124, 26);
    c.quadraticCurveTo(140, 30, 136, 48); c.quadraticCurveTo(126, 38, 112, 44);
    c.closePath(); c.fill();
    c.beginPath(); c.arc(104, 56, 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f6ead0';
    c.beginPath(); c.arc(127, 50, 3.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#13262b';
    c.beginPath(); c.arc(128.2, 50, 1.7, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(90,50,30,0.6)';
    c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(131, 60); c.quadraticCurveTo(134, 63, 130, 65); c.stroke();

    c.strokeStyle = pal.accent;
    c.lineWidth = 2.6;
    c.globalAlpha = 0.55;
    c.beginPath(); c.arc(112, 74, 13, 0.2, Math.PI - 0.4); c.stroke();
    c.globalAlpha = 1;

    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(50, 20, 140, 210);
    rim.addColorStop(0, 'rgba(214,251,255,0.3)');
    rim.addColorStop(0.5, 'rgba(214,251,255,0)');
    rim.addColorStop(1, 'rgba(4,26,34,0.32)');
    c.fillStyle = rim; c.fillRect(0, 0, 170, 230);
    c.globalCompositeOperation = 'source-over';
    grain(c, 170, 230, 0.03, 61);
  });

  [0, 0.45, 0.95].forEach((bend, i) => {
    canvasTex(scene, 'sc-spear-' + i, 150, 30, (c) => {
      const bow = -bend * 10;
      c.lineCap = 'round';
      c.strokeStyle = '#5b3f24';
      c.lineWidth = 6.4;
      c.beginPath(); c.moveTo(10, 15); c.quadraticCurveTo(74, 15 + bow, 136, 15); c.stroke();
      c.strokeStyle = '#a97a45';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(12, 14); c.quadraticCurveTo(74, 14 + bow, 134, 13.4); c.stroke();

      c.strokeStyle = '#d9c79a';
      c.lineWidth = 2.2;
      for (let k = 0; k < 3; k++) {
        const t = 0.26 + k * 0.07;
        const x = 10 + 126 * t;
        const y = 15 + bow * 4 * t * (1 - t);
        c.beginPath(); c.moveTo(x - 3, y - 4.4); c.lineTo(x + 3, y + 4.4); c.stroke();
      }
      c.fillStyle = '#7d5a34';
      c.beginPath(); c.ellipse(12, 15, 7, 4.4, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#e6dcc0';
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(17, 12); c.quadraticCurveTo(30, 4, 41, 9); c.stroke();

      const head = c.createLinearGradient(126, 6, 149, 22);
      head.addColorStop(0, '#eaf4f0'); head.addColorStop(0.55, '#a8c4c2'); head.addColorStop(1, '#4f6f72');
      c.fillStyle = head;
      c.beginPath(); c.moveTo(148, 15); c.quadraticCurveTo(136, 5, 126, 9);
      c.quadraticCurveTo(130, 15, 126, 21); c.quadraticCurveTo(136, 25, 148, 15);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(146, 15); c.lineTo(128, 10); c.stroke();
      grain(c, 150, 30, 0.04, 71 + i);
    });
  });

  TIER.forEach((t, i) => {
    const cols = [['#eef9f3', '#9dc6c2', '#4d7d80'], ['#ffe6a6', '#d79a4c', '#8a5a2c'], ['#a6d8f0', '#4a7fa8', '#22456a']][i];
    fishTex(scene, 'sc-fish-' + t.key, t.w, t.h, cols[0], cols[1], cols[2]);
  });

  canvasTex(scene, 'sc-mark', 78, 42, (c) => {
    const g = c.createRadialGradient(39, 21, 2, 39, 21, 38);
    g.addColorStop(0, 'rgba(2,18,24,0.9)'); g.addColorStop(0.62, 'rgba(2,18,24,0.42)');
    g.addColorStop(1, 'rgba(2,18,24,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(39, 21, 37, 19, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(3,20,26,0.78)';
    c.beginPath(); c.moveTo(58, 21); c.quadraticCurveTo(42, 11, 26, 16); c.lineTo(19, 10);
    c.lineTo(22, 21); c.lineTo(19, 32); c.quadraticCurveTo(42, 31, 58, 21);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(178,240,234,0.42)';
    c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(39, 21, 28, 13.5, 0, 0, Math.PI * 2); c.stroke();
  });

  canvasTex(scene, 'sc-rock', 240, 150, (c) => {
    const g = c.createLinearGradient(30, 10, 200, 145);
    g.addColorStop(0, '#3f7b80'); g.addColorStop(0.45, '#1e5560'); g.addColorStop(1, '#0a2c35');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(6, 140); c.quadraticCurveTo(0, 74, 44, 42);
    c.quadraticCurveTo(104, 6, 176, 30); c.quadraticCurveTo(240, 54, 234, 116);
    c.quadraticCurveTo(226, 148, 150, 148); c.closePath(); c.fill();
    c.fillStyle = 'rgba(160,224,214,0.15)';
    c.beginPath(); c.ellipse(108, 34, 74, 12, -0.14, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(4,22,28,0.5)';
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(58, 132); c.quadraticCurveTo(78, 92, 62, 60); c.stroke();
    c.beginPath(); c.moveTo(150, 140); c.quadraticCurveTo(168, 100, 196, 78); c.stroke();
    c.fillStyle = 'rgba(120,190,150,0.18)';
    for (let i = 0; i < 16; i++) {
      c.beginPath(); c.ellipse(24 + i * 12, 40 + Math.sin(i) * 8, 7, 3.4, 0.4, 0, Math.PI * 2); c.fill();
    }
    grain(c, 240, 150, 0.05, 53);
  });

  canvasTex(scene, 'sc-sand', 420, 160, (c) => {
    const g = c.createLinearGradient(0, 20, 0, 160);
    g.addColorStop(0, '#dcbf8c'); g.addColorStop(0.5, '#b6975f'); g.addColorStop(1, '#6a5a44');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, 160); c.quadraticCurveTo(30, 74, 150, 48);
    c.quadraticCurveTo(280, 24, 420, 96); c.lineTo(420, 160); c.closePath(); c.fill();
    const rand = rng(808);
    c.fillStyle = 'rgba(255,246,210,0.2)';
    for (let i = 0; i < 40; i++) {
      c.beginPath();
      c.ellipse(rand() * 420, 60 + rand() * 90, 3 + rand() * 9, 1.4 + rand() * 2, rand(), 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = 'rgba(40,30,18,0.28)';
    for (let i = 0; i < 22; i++) {
      c.beginPath(); c.arc(rand() * 420, 70 + rand() * 84, 1.6 + rand() * 3.4, 0, Math.PI * 2); c.fill();
    }
    grain(c, 420, 160, 0.05, 37);
  });

  canvasTex(scene, 'sc-kelp', 96, 250, (c) => {
    c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const x = 26 + i * 15;
      const g = c.createLinearGradient(x, 250, x, 20);
      g.addColorStop(0, '#255040'); g.addColorStop(1, '#57956a');
      c.strokeStyle = g;
      c.lineWidth = 6 - i * 0.6;
      c.beginPath(); c.moveTo(x, 250); c.quadraticCurveTo(x - 20 + i * 8, 160, x + 8, 44 - i * 6); c.stroke();
      c.strokeStyle = i % 2 ? '#417c52' : '#2f6046';
      c.lineWidth = 3.2;
      for (let j = 0; j < 5; j++) {
        const t = j / 5;
        const lx = x - 18 * t + i * 6 * t;
        const ly = 250 - 200 * t;
        c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx - 16, ly - 4, lx - 22, ly - 18); c.stroke();
      }
    }
    grain(c, 96, 250, 0.03, 47);
  });

  canvasTex(scene, 'sc-pred', 460, 170, (c) => {
    const g = c.createLinearGradient(0, 40, 0, 150);
    g.addColorStop(0, 'rgba(5,24,30,0.92)'); g.addColorStop(1, 'rgba(3,16,22,0.6)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(34, 98); c.quadraticCurveTo(150, 46, 300, 68);
    c.quadraticCurveTo(392, 80, 452, 52); c.quadraticCurveTo(416, 96, 452, 142);
    c.quadraticCurveTo(382, 122, 300, 128); c.quadraticCurveTo(150, 142, 34, 98);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(4,20,26,0.8)';
    c.beginPath(); c.moveTo(190, 118); c.quadraticCurveTo(210, 160, 254, 166);
    c.quadraticCurveTo(232, 130, 226, 116); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(150, 60); c.quadraticCurveTo(180, 26, 224, 30);
    c.quadraticCurveTo(196, 54, 186, 68); c.closePath(); c.fill();
    c.fillStyle = 'rgba(220,250,246,0.45)';
    c.beginPath(); c.arc(60, 94, 4, 0, Math.PI * 2); c.fill();

    c.globalCompositeOperation = 'destination-in';
    c.save();
    c.translate(230, 96);
    c.scale(1.95, 0.98);
    const rg = c.createRadialGradient(0, 0, 110, 0, 0, 240);
    rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.78, 'rgba(0,0,0,0.8)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg;
    c.fillRect(-250, -250, 500, 500);
    c.restore();
    c.globalCompositeOperation = 'source-over';
  });

  canvasTex(scene, 'sc-caustic', 960, 76, (c) => {
    const rand = rng(1225);
    const g = c.createLinearGradient(0, 0, 0, 76);
    g.addColorStop(0, 'rgba(214,251,255,0.24)'); g.addColorStop(1, 'rgba(214,251,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 960, 46);
    for (let i = 0; i < 60; i++) {
      const y = 4 + rand() * 66;
      const x = rand() * 960;
      const len = 40 + rand() * 150;
      c.strokeStyle = 'rgba(230,255,255,' + (0.05 + rand() * 0.2) + ')';
      c.lineWidth = 2 + rand() * 6;
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x + len * 0.5, y - 7 + rand() * 14, x + len, y); c.stroke();
    }
    c.strokeStyle = 'rgba(240,255,255,0.35)';
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(0, 10);
    for (let x = 0; x <= 960; x += 24) c.lineTo(x, 10 + Math.sin(x * 0.03) * 3.4);
    c.stroke();
  });
}

function create(scene) {
  const M = scene.M, K = scene.k, VB = M.band;
  art(scene);
  const r = rng(9142);
  const ACC = Phaser.Display.Color.HexStringToColor(MOODS.underwater.accent).color;
  const HS = 0.85 * K, PS = 0.8 * K, HUNTER_X = 108;
  const HAND = { x: HUNTER_X + 45 * HS, y: FEET_Y - 138 * HS / VB };
  const TIPX = 73 * PS;
  const BAND_H = M.Y(540) - M.Y(0);
  const vAng = (a) => Math.atan2(Math.sin(a) * VB, Math.cos(a));

  const state = {
    casts: 0, hearts: 3, light: 1, over: false, level: 0, elapsed: 0,
    power: 0, drawing: false, aimX: 640, aimY: 300, angle: 0.05, overFlag: false,
    tide: 0.5, tideLock: null, spook: 0, tight: 0, castSeq: 0, spawnOn: true,
    last: { seq: 0, result: 'ready', value: 0, x: 0, y: 0 },
    spawnT: 0.25, predT: 8
  };
  const spear = { x: HAND.x, y: HAND.y, vx: 0, vy: 0, a: 0, live: false };

  const shafts = [];
  for (let i = 0; i < 6; i++) {
    const sh = scene.add.rectangle(80 + i * 160, M.Y(SURFACE - 10), 84 + r() * 70, M.Y(FLOOR) - M.Y(SURFACE), 0xd6fbff, 0.05)
      .setOrigin(0.5, 0).setDepth(1).setAngle(-6).setBlendMode(Phaser.BlendModes.ADD);
    shafts.push(Object.assign(sh, { _ph: r() * 6 }));
  }
  scene.add.image(W / 2, M.Y(SURFACE), 'sc-caustic').setDepth(2).setScale(K).setAlpha(0.9);
  const veil = scene.add.rectangle(0, M.Y(0), W, BAND_H, 0x03161d, 0).setOrigin(0, 0).setDepth(30);

  scene.add.image(HUNTER_X + 46, M.Y(FEET_Y + 52), 'sc-sand').setOrigin(0.5, 1).setDepth(5).setScale(1.02 * K).setAlpha(0.98);
  scene.add.image(700, M.Y(FLOOR + 52), 'sc-sand').setOrigin(0.5, 1).setDepth(3).setScale(0.82 * K).setAlpha(0.72);

  const kelp = [];
  for (let i = 0; i < 7; i++) {
    const k = scene.add.image(240 + r() * (W - 280), M.Y(FLOOR + 14 + r() * 24), 'sc-kelp')
      .setOrigin(0.5, 1).setDepth(4 + (i % 3)).setScale((0.6 + r() * 0.48) * K).setAlpha(0.8);
    kelp.push(Object.assign(k, { _ph: r() * 6 }));
  }

  const rocks = [];
  function addRock(x, base, s, amp) {
    const img = scene.add.image(x, M.Y(base), 'sc-rock').setOrigin(0.5, 0.5).setDepth(7).setScale(s * K).setAlpha(0.96);
    rocks.push({ img, x, base, amp, y: base, rx: 92 * s * K, ry: 46 * s * K / VB });
  }
  [[590, 250, 1.16, -150], [842, 190, 0.92, 116], [452, 132, 0.74, -64],
    [316, 452, 0.72, 0], [742, 462, 0.86, 0], [912, 448, 0.62, 0]].forEach((a) => addRock(...a));

  const bubbles = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 18, max: 54 }, angle: { min: 252, max: 288 },
    lifespan: { min: 1100, max: 2100 }, scale: { start: 0.26, end: 0.05 },
    alpha: { start: 0.4, end: 0 }, tint: 0xd9fbff, frequency: 250, quantity: 1,
    emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(
      70, M.Y(SURFACE + 40), W - 140, M.Y(FLOOR) - M.Y(SURFACE + 60)) }
  }).setDepth(5);

  const trail = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 8, max: 46 }, angle: { min: 200, max: 340 },
    lifespan: { min: 420, max: 900 }, scale: { start: 0.34, end: 0.03 },
    alpha: { start: 0.7, end: 0 }, tint: 0xe9ffff, emitting: false
  }).setDepth(24);

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 50, max: 230 }, angle: { min: 180, max: 360 },
    lifespan: { min: 400, max: 820 }, scale: { start: 0.6, end: 0 },
    alpha: { start: 0.6, end: 0 }, tint: 0xcbb488, gravityY: 90, emitting: false
  }).setDepth(25);

  const pred = {
    img: scene.add.image(-600, M.Y(320), 'sc-pred').setDepth(6).setAlpha(0).setScale(1.35 * K),
    x: -600, y: 320, vx: 0, active: false, hold: false,
    rx: 150 * 1.35 * K, ry: 42 * 1.35 * K / VB
  };

  const hunter = scene.add.image(HUNTER_X, M.Y(FEET_Y), 'sc-hunter').setOrigin(0.5, 1).setDepth(16).setScale(HS);
  scene.add.ellipse(HUNTER_X + 6, M.Y(FEET_Y + 4), 104 * HS, 15 * HS / VB, 0x062228, 0.42).setDepth(8);
  const spearImg = scene.add.image(HAND.x, M.Y(HAND.y), 'sc-spear-0').setDepth(22).setScale(PS);
  const glint = scene.add.image(HAND.x, M.Y(HAND.y), 'arc-glow').setDepth(21).setScale(0.5 * K).setAlpha(0)
    .setTint(ACC).setBlendMode(Phaser.BlendModes.ADD);
  const fx = scene.add.graphics().setDepth(20);

  const fish = [];
  let fishId = 0;

  function spawnFish(tierKey, opts = {}) {
    if (fish.length >= 6) return null;
    const t = TIER.find((x) => x.key === tierKey) || TIER[0];
    const still = !!opts.still;
    const ty = opts.y !== undefined ? clamp(opts.y, t.lo, t.hi) : t.lo + r() * (t.hi - t.lo);
    const fromLeft = opts.dir !== undefined ? opts.dir > 0 : r() < 0.42;
    const x = opts.x !== undefined ? opts.x : (fromLeft ? -50 : W + 50);
    const fs = (still ? 1 : 0.88 + r() * 0.26) * K;
    const img = scene.add.image(x, M.Y(ty - refr(ty)), 'sc-fish-' + t.key).setDepth(12).setScale(fs).setFlipX(!fromLeft);
    const halo = scene.add.image(img.x, img.y, 'arc-glow').setDepth(11).setScale(fs * 0.72).setAlpha(0.18)
      .setTint(0xd9fbff).setBlendMode(Phaser.BlendModes.ADD);
    const mark = scene.add.image(x, M.Y(ty), 'sc-mark').setDepth(9).setScale(fs * 0.92).setAlpha(0.5);
    const speed = still ? 0 : (34 + state.level * 13) * (0.72 + r() * 0.62) * (fromLeft ? 1 : -1);
    const f = {
      id: ++fishId, tier: t.key, value: t.value, img, halo, mark, fs,
      x, ty, base: ty, lo: t.lo, hi: t.hi, vx: speed,
      rx: (t.rad + 10) * fs, ry: (t.h * 0.5 + 10) * fs / VB,
      ph: r() * 6, amp: still ? 0 : 8 + r() * 14, spook: 0, calm: 0, got: false, still
    };
    fish.push(f);
    return f;
  }

  function pickTier() {
    const roll = r(), deep = 0.16 + state.level * 0.07, mid = 0.32 + state.level * 0.05;
    return roll < deep ? 'deep' : roll < deep + mid ? 'gold' : 'silver';
  }

  function scatter(x, y, radius) {
    state.spook = 1.3;
    fish.forEach((f) => {
      if (f.still) return;
      if (Math.hypot(f.x - x, (f.ty - y) / 2) > radius) return;
      f.spook = 1 + r() * 0.6;
      f.vx = (f.x < x ? -1 : 1) * Math.min(210, Math.abs(f.vx) * 1.5 + 62);
    });
  }

  function tighten(f) {
    state.tight = 1.5;
    fish.forEach((o) => {
      if (o === f || o.still) return;
      o.calm = 1.8;
      o.base = lerp(o.base, f.base, 0.18);
    });
  }

  function release() {
    if (state.over || spear.live) return;
    const p = clamp(state.power, 0.05, 1);
    const a = state.angle;
    const rest = 108 - p * 44;
    spear.x = HAND.x + Math.cos(a) * rest;
    spear.y = HAND.y + Math.sin(a) * rest;
    spear.vx = Math.cos(a) * (V0 + V1 * p);
    spear.vy = Math.sin(a) * (V0 + V1 * p);
    spear.a = a;
    spear.live = true;
    state.overFlag = false;
    state.castSeq++;
    state.drawing = false;
    state.power = 0;
    scene.sfx('whoosh');
    scene.shake(90, 0.003);
    for (let i = 0; i < 5; i++) trail.emitParticleAt(spear.x, M.Y(spear.y), 1);
  }

  function setDrawing(on) {
    if (state.over || spear.live) return;
    if (on) {
      if (!state.drawing) {
        state.drawing = true;
        state.power = 0.05;
        scene.sfx('tick');
      }
    } else if (state.drawing) release();
  }

  function resolve(result, value, x, y) {
    spear.live = false;
    state.last = { seq: state.castSeq, result, value, x: Math.round(x), y: Math.round(y) };
    if (result === 'rock' || result === 'shadow') badCast(result, x, y);
    else if (result === 'short') scene.notice('The cast dies in the water. Draw further back.', 1500);
    else if (result === 'over') scene.notice('Light bends it. The shadow is the true fish.', 1700);
  }

  function badCast(kind, x, y) {
    state.hearts--;
    state.light = Math.max(0, state.light - 0.03);
    scatter(x, y, 260);
    scene.sfx(kind === 'rock' ? 'bad' : 'hurt');
    scene.shake(210, 0.011);
    scene.cameras.main.flash(180, 20, 40, 60);
    dust.emitParticleAt(x, M.Y(y), 16);
    scene.burst(x, M.Y(y), kind === 'rock' ? 0xcbb488 : 0x6fa6b4, 12, { life: 520, gravity: 60 });
    scene.popText(x, M.Y(y - 40), kind === 'rock' ? 'rock' : 'shadow', '#bfe4e0');
    if (state.hearts <= 0) endRun(state.casts >= STAR[0], 'lost');
    else scene.notice(kind === 'rock' ? 'The spear finds rock. The shoal scatters.' : 'A shadow crosses and the water empties.', 1700);
  }

  function catchFish(f, tipX, tipY) {
    f.got = true;
    state.casts += f.value;
    state.light = Math.min(1, state.light + 0.026 * f.value);
    state.level = Math.min(5, Math.floor(state.casts / 4));
    tighten(f);
    scene.sfx(f.value >= 3 ? 'good' : 'pick');
    scene.burst(f.x, M.Y(f.ty), f.value >= 3 ? 0x9fd8ee : 0xd9f7ee, 14, { life: 560, gravity: 40 });
    scene.popText(tipX, M.Y(tipY - 26), '+' + f.value + ' ' + f.tier, f.value >= 3 ? '#a9e7ff' : '#e6fff6');
    scene.shake(110, 0.005);
    scene.tweens.add({
      targets: [f.img, f.halo, f.mark], alpha: 0, scale: f.fs * 0.2, duration: 260, ease: 'back.in',
      onComplete: () => [f.img, f.halo, f.mark].forEach((o) => o.destroy())
    });
    if (state.casts >= STAR[2]) endRun(true, 'full');
  }

  function endRun(win, why) {
    if (state.over) return;
    state.over = true;
    const notes = {
      full: () => `${state.casts} casts and the pouch is heavy`,
      dark: () => `${state.casts} casts kept before the water went dark`,
      lost: () => `${state.casts} casts, then the shoal took the hint`,
      good: () => `${state.casts} casts, all of them read from the shadow`
    };
    scene.finish(win, { score: state.casts, note: (notes[why] || notes.good)() });
  }

  function aimAt(px, py) {
    state.aimX = clamp(px, HAND.x + 40, W - 20);
    state.aimY = clamp(py, SURFACE + 16, FLOOR - 6);
    state.angle = clamp(Math.atan2(state.aimY - HAND.y, state.aimX - HAND.x), -0.9, 0.62);
  }

  scene.input.on('pointermove', (ptr) => aimAt(ptr.x, scene.uY(ptr.y)));
  scene.input.on('pointerdown', (ptr) => { aimAt(ptr.x, scene.uY(ptr.y)); setDrawing(true); });
  scene.input.on('pointerup', () => setDrawing(false));

  const keys = scene.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    w: 'W', a: 'A', s: 'S', d: 'D', space: 'SPACE'
  });
  scene.input.keyboard.on('keydown-SPACE', () => setDrawing(true));
  scene.input.keyboard.on('keyup-SPACE', () => setDrawing(false));

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'hold to draw' });
  scene.notice('The water lies about where the fish is. Cast at the shadow.', 2800);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;

    state.elapsed += dt;
    state.spook = Math.max(0, state.spook - dt);
    state.tight = Math.max(0, state.tight - dt);
    state.tide = state.tideLock === null ? 0.5 + 0.5 * Math.sin(state.elapsed / 9.5) : state.tideLock;

    const kStep = 330 * dt;
    if (keys.left.isDown || keys.a.isDown) aimAt(state.aimX - kStep, state.aimY);
    if (keys.right.isDown || keys.d.isDown) aimAt(state.aimX + kStep, state.aimY);
    if (keys.up.isDown || keys.w.isDown) aimAt(state.aimX, state.aimY - kStep);
    if (keys.down.isDown || keys.s.isDown) aimAt(state.aimX, state.aimY + kStep);

    if (state.drawing) {
      const before = state.power;
      state.power = Math.min(1, state.power + dt / 0.85);
      if (before < 1 && state.power >= 1) scene.sfx('tick');
    }

    state.light -= dt * (0.0122 + state.level * 0.0016 + state.elapsed * 0.00004);
    if (state.light <= 0) { state.light = 0; endRun(state.casts >= STAR[0], 'dark'); return; }

    rocks.forEach((rk) => {
      rk.y = rk.base + (state.tide - 0.5) * rk.amp;
      rk.img.y = M.Y(rk.y);
    });

    hunter.rotation = (state.drawing ? -0.05 - state.power * 0.05 : -0.01) + Math.sin(time / 1400) * 0.012;

    const a = spear.live ? spear.a : state.angle;
    if (spear.live) {
      const sp = Math.hypot(spear.vx, spear.vy);
      spear.vx -= spear.vx * Math.min(1, DRAG * dt);
      spear.vy = spear.vy - spear.vy * Math.min(1, DRAG * dt) + SINK * dt;
      spear.x += spear.vx * dt;
      spear.y += spear.vy * dt;
      spear.a = Math.atan2(spear.vy, spear.vx);
      spearImg.setTexture('sc-spear-0');
      if (Math.random() < dt * 46) trail.emitParticleAt(spear.x, M.Y(spear.y), 1);

      let done = false;
      if (pred.active && Math.abs(spear.x - pred.x) < pred.rx && Math.abs(spear.y - pred.y) < pred.ry) {
        resolve('shadow', 0, spear.x, spear.y);
        done = true;
      }
      if (!done) {
        for (const rk of rocks) {
          const dx = (spear.x - rk.x) / rk.rx, dy = (spear.y - rk.y) / rk.ry;
          if (dx * dx + dy * dy <= 1) {
            scene.sfx('land');
            resolve('rock', 0, spear.x, spear.y);
            done = true;
            break;
          }
        }
      }
      if (!done) {
        for (const f of fish) {
          if (f.got) continue;
          const dx = (spear.x - f.x) / f.rx, dy = (spear.y - f.ty) / f.ry;
          if (dx * dx + dy * dy <= 1) {
            catchFish(f, spear.x, spear.y);
            resolve('catch', f.value, spear.x, spear.y);
            done = true;
            break;
          }
          if (Math.abs(spear.x - f.x) < f.rx) {
            const off = Math.abs(spear.y - f.ty);
            if (off > f.ry && off < 160) state.overFlag = true;
          }
        }
      }
      if (!done && spear.y > FLOOR - 12) {
        dust.emitParticleAt(spear.x, M.Y(FLOOR - 10), 10);
        scene.sfx('land');
        resolve('sand', 0, spear.x, FLOOR - 12);
        done = true;
      }
      if (!done && (spear.x > W - 24 || spear.x < -30 || spear.y < SURFACE - 6)) {
        resolve(state.overFlag ? 'over' : 'out', 0, clamp(spear.x, 24, W - 24), spear.y);
        done = true;
      }
      if (!done && sp < STOP) resolve(state.overFlag ? 'over' : 'short', 0, spear.x, spear.y);
    } else {
      const rest = 108 - (state.drawing ? state.power * 44 : 0);
      spear.x = HAND.x + Math.cos(a) * rest;
      spear.y = HAND.y + Math.sin(a) * rest;
      spear.a = a;
      spearImg.setTexture('sc-spear-' + (state.power > 0.66 ? 2 : state.power > 0.3 ? 1 : 0));
      if (state.drawing && Math.random() < dt * 12) {
        trail.emitParticleAt(HAND.x - Math.cos(a) * 46, M.Y(HAND.y - Math.sin(a) * 46), 1);
      }
    }

    const va = vAng(spear.a);
    spearImg.x = spear.x - Math.cos(va) * TIPX;
    spearImg.y = M.Y(spear.y) - Math.sin(va) * TIPX;
    spearImg.rotation = va;
    spearImg.setAlpha(spear.live || state.drawing ? 1 : 0.92);

    glint.setPosition(spear.x, M.Y(spear.y));
    glint.setAlpha(state.drawing ? 0.14 + state.power * 0.42 : 0);
    glint.setScale((0.4 + state.power * 0.5) * K);

    fx.clear();
    if (state.drawing) {
      const rr = reach(state.power);
      for (let i = 1; i <= 11; i++) {
        const d = (rr * i) / 11;
        const gx = HAND.x + Math.cos(a) * d;
        if (gx > W - 16) break;
        fx.fillStyle(ACC, 0.62 * (1 - i / 15));
        fx.fillCircle(gx, M.Y(HAND.y + Math.sin(a) * d), Math.max(1.5, (3 - i * 0.13)) * K);
      }
    }
    fx.lineStyle(1.4, 0x052029, 0.32);
    fish.forEach((f) => {
      const off = refr(f.ty);
      if (off < 16) return;
      fx.beginPath();
      fx.moveTo(f.x, M.Y(f.ty - off + f.ry * 0.5));
      fx.lineTo(f.x, M.Y(f.ty - f.ry * 0.4));
      fx.strokePath();
    });

    if (state.spawnOn && fish.length < 5) {
      state.spawnT -= dt;
      if (state.spawnT <= 0) {
        spawnFish(pickTier());
        state.spawnT = Math.max(0.5, 1.2 + r() * 1.3 - state.level * 0.1);
      }
    }

    for (let i = fish.length - 1; i >= 0; i--) {
      const f = fish[i];
      if (f.got) { fish.splice(i, 1); continue; }
      f.spook = Math.max(0, f.spook - dt);
      f.calm = Math.max(0, f.calm - dt);
      const mul = f.spook > 0 ? 2.5 : f.calm > 0 ? 0.62 : 1;
      if (!f.still) {
        f.x += f.vx * mul * dt;
        f.base = clamp(f.base + Math.sin(time / 1500 + f.ph) * dt * 7, f.lo, f.hi);
        f.ty = clamp(f.base + Math.sin(time / 900 + f.ph) * f.amp, f.lo - 8, FLOOR - 22);
      }
      const off = refr(f.ty);
      const fy = M.Y(f.ty - off);
      f.img.setPosition(f.x, fy).setAngle(Math.sin(time / 420 + f.ph) * (f.spook > 0 ? 11 : 4));
      f.img.setFlipX(f.vx < 0);
      f.halo.setPosition(f.x, fy)
        .setAlpha(0.14 + Math.sin(time / 500 + f.ph) * 0.05 + (f.spook > 0 ? 0.12 : 0));
      f.mark.setPosition(f.x, M.Y(f.ty)).setAlpha(0.08 + off / 115 + (f.spook > 0 ? 0.14 : 0));
      if (!f.still && (f.x < -90 || f.x > W + 90)) {
        [f.img, f.halo, f.mark].forEach((o) => o.destroy());
        fish.splice(i, 1);
      }
    }

    if (!pred.active) {
      state.predT -= dt;
      if (state.predT <= 0) {
        pred.active = true;
        pred.hold = false;
        pred.y = 190 + r() * 200;
        const fromLeft = r() < 0.5;
        pred.x = fromLeft ? -330 : W + 330;
        pred.vx = (fromLeft ? 1 : -1) * (86 + state.level * 17);
        pred.img.setPosition(pred.x, M.Y(pred.y));
        state.predT = Math.max(3.4, 9.2 - state.level * 1.15) + r() * 3;
        scene.sfx('splash');
        scene.notice('Something long crosses the light.', 1500);
      }
    } else {
      if (!pred.hold) {
        pred.x += pred.vx * dt;
        pred.y = clamp(pred.y + Math.sin(time / 1600) * dt * 18, 150, 430);
        pred.img.y = M.Y(pred.y);
        pred.img.setFlipX(pred.vx < 0);
        if (pred.x < -430 || pred.x > W + 430) { pred.active = false; pred.img.setAlpha(0); }
      }
      pred.img.x = pred.x;
      pred.img.rotation = Math.sin(time / 900) * 0.03;
      pred.img.setAlpha(lerp(pred.img.alpha, 0.8, Math.min(1, dt * 2)));
    }

    shafts.forEach((sh, i) => {
      sh.alpha = (0.028 + Math.sin(time / 2600 + sh._ph) * 0.012) * (0.35 + state.light);
      sh.x += Math.sin(time / 4600 + i) * dt * 4;
    });
    kelp.forEach((k) => { k.rotation = Math.sin(time / 1500 + k._ph) * 0.06; });
    veil.setFillStyle(0x03161d, (1 - state.light) * 0.5);
    bubbles.setAlpha({ start: 0.12 + state.light * 0.3, end: 0 });

    const tideMsg = state.tide > 0.66 ? 'the tide lifts off the deep shelf'
      : state.tide < 0.34 ? 'the shelf shuts the deep water' : '';
    scene.hud({
      score: state.casts, progress: state.light, hearts: state.hearts,
      extra: state.spook > 0 ? 'the shoal scatters'
        : state.tight > 0 ? 'the shoal closes in'
          : state.drawing && state.power > 0.94 ? 'full draw'
            : state.light < 0.26 ? 'the light is going'
              : tideMsg || (state.casts === 0 ? 'aim at the shadow' : '')
    });
    scene.audio.setTension(clamp(0.14 + (1 - state.light) * 0.5 + (state.spook > 0 ? 0.2 : 0), 0, 1));
  }

  return {
    update,
    state: () => ({
      casts: state.casts, hearts: state.hearts, light: Number(state.light.toFixed(3)),
      level: state.level, tide: Number(state.tide.toFixed(2)), spook: Number(state.spook.toFixed(2)),
      tight: Number(state.tight.toFixed(2)),
      drawing: state.drawing, power: Number(state.power.toFixed(2)), over: state.over,
      angle: Number(state.angle.toFixed(3)),
      aim: { x: Math.round(state.aimX), y: Math.round(state.aimY) },
      spear: {
        x: Math.round(spear.x), y: Math.round(spear.y), live: spear.live,
        speed: Math.round(Math.hypot(spear.vx, spear.vy))
      },
      castSeq: state.castSeq,
      last: { ...state.last },
      fish: fish.map((f) => ({
        id: f.id, tier: f.tier, value: f.value, x: Math.round(f.x),
        trueY: Math.round(f.ty), apparentY: Math.round(f.ty - refr(f.ty)),
        offset: Math.round(refr(f.ty)), rx: Math.round(f.rx), ry: Math.round(f.ry),
        vx: Math.round(f.vx), spooked: f.spook > 0
      })),
      rocks: rocks.map((rk) => ({ x: Math.round(rk.x), y: Math.round(rk.y), rx: Math.round(rk.rx), ry: Math.round(rk.ry) })),
      predator: { x: Math.round(pred.x), y: Math.round(pred.y), active: pred.active, hold: pred.hold }
    }),
    refrAt: (y) => Math.round(refr(y)),
    reachAt: (p) => Math.round(reach(p)),
    hand: () => ({ x: Math.round(HAND.x), y: Math.round(HAND.y) }),
    aimAt: (x, y) => aimAt(x, y),
    drawTo: (v) => { state.drawing = true; state.power = clamp(v, 0.05, 1); },
    release,
    setCasts: (v) => { state.casts = v; state.level = Math.min(5, Math.floor(v / 4)); },
    setHearts: (v) => { state.hearts = v; },
    setLight: (v) => { state.light = clamp(v, 0, 1); },
    setTide: (v) => { state.tideLock = v === null ? null : clamp(v, 0, 1); },
    setSpawn: (on) => { state.spawnOn = !!on; },
    spawnFishAt: (x, y, tone, dir) => {
      const f = spawnFish(tone || 'deep', { x, y, still: true, dir: dir === undefined ? 1 : dir });
      return f ? f.id : -1;
    },
    spawnSwimmer: (x, y, tone, dir) => {
      const f = spawnFish(tone || 'silver', { x, y, dir: dir === undefined ? 1 : dir });
      return f ? f.id : -1;
    },
    clearFish: () => {
      fish.forEach((f) => [f.img, f.halo, f.mark].forEach((o) => o.destroy()));
      fish.length = 0;
    },
    parkPredator: (x, y) => {
      pred.active = true;
      pred.hold = true;
      pred.x = x;
      pred.vx = 0;
      pred.y = y === undefined ? 300 : y;
      pred.img.setPosition(x, M.Y(pred.y)).setAlpha(0.8);
    },
    liftPredator: () => {
      pred.hold = false;
      pred.active = false;
      pred.img.setAlpha(0);
    }
  };
}

export default { id: 'spear-cast', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
