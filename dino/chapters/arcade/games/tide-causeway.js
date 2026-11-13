import { addMaterialLayer } from '../../../photoreal-environments.js?v=du-cd75bb4cc7df44ba';
// Tide Causeway — the road the sea takes twice a day.
// Ribbed stones, one rising tide, and a hatchling a long hop behind you.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-cd75bb4cc7df44ba';

const LOW = 398, NEAR_TOP = 348, OUTER_TOP = 372, BEACH_TOP = 288, ASHORE_TOP = 280;
const BEACH_X = 104, ASHORE_X = 898, REACH_MIN = 34, REACH_MAX = 190, SHORE_REACH = 140;
const RISE = 0.7, NEED = 4, BOT = 2100, TAU = Math.PI * 2, STAR = [12, 22, 34];

const PAL = MOODS.storm;
const BANDS = [
  { o: -2, amp: 3.2, spd: 0.5, wave: 0.0115, c: '#5d8b8e', a: 0.62 },
  { o: 9, amp: 4.4, spd: 0.72, wave: 0.0135, c: '#3d6a72', a: 0.8 },
  { o: 26, amp: 5.4, spd: 0.98, wave: 0.0105, c: '#28505c', a: 0.9 },
  { o: 52, amp: 6.4, spd: 1.3, wave: 0.0155, c: '#173845', a: 0.95 },
  { o: 92, amp: 7.2, spd: 1.7, wave: 0.0125, c: '#0d2530', a: 1 },
  { o: 150, amp: 8.6, spd: 2.1, wave: 0.009, c: '#12303a', a: 1 },
  { o: 214, amp: 10, spd: 2.5, wave: 0.0115, c: '#0a2029', a: 1 }
];
const LINES = [{ top: NEAR_TOP, rise: 6, n: 9, x0: 176, dx: 77.5, w: 0.86 },
  { top: OUTER_TOP, rise: 6, n: 5, x0: 250, dx: 135, w: 1.02 }];

const tideLevel = (p) => (p < RISE ? 0.5 - 0.5 * Math.cos(Math.PI * p / RISE)
  : 0.5 + 0.5 * Math.cos(Math.PI * (p - RISE) / (1 - RISE)));

function art(scene) {
  const rim = (c, w, h, rgb, seed, ga) => {
    c.globalCompositeOperation = 'source-atop';
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(' + rgb + ',0.27)'); g.addColorStop(0.6, 'rgba(' + rgb + ',0)');
    g.addColorStop(1, 'rgba(' + rgb + ',0.12)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, ga, seed);
  };

  canvasTex(scene, 'tc-stone', 96, 62, (c) => {
    const rand = rng(2211);
    const body = c.createLinearGradient(12, 10, 84, 60);
    body.addColorStop(0, '#5d6b64'); body.addColorStop(0.45, '#3d4b48'); body.addColorStop(1, '#1c2628');
    c.fillStyle = body; c.beginPath();
    c.moveTo(14, 20); c.quadraticCurveTo(5, 36, 11, 50); c.quadraticCurveTo(22, 61, 48, 61);
    c.quadraticCurveTo(77, 61, 86, 47); c.quadraticCurveTo(93, 32, 83, 18);
    c.quadraticCurveTo(58, 9, 30, 13); c.closePath(); c.fill();
    const face = c.createLinearGradient(16, 6, 80, 24);
    face.addColorStop(0, '#9dab9f'); face.addColorStop(0.5, '#7c8b81'); face.addColorStop(1, '#5b6a64');
    c.fillStyle = face; c.beginPath(); c.ellipse(48, 15, 35, 9.5, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(24,38,40,0.34)'; c.beginPath(); c.ellipse(48, 19, 33, 5.4, 0, 0, Math.PI); c.fill();
    c.strokeStyle = 'rgba(14,24,26,0.5)'; c.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = 19 + i * 14 + rand() * 4;
      c.beginPath(); c.moveTo(x, 22); c.quadraticCurveTo(x + 4, 40, x - 3, 59); c.stroke();
    }
    c.fillStyle = 'rgba(126,178,146,0.22)';
    for (let i = 0; i < 8; i++) {
      const x = 12 + rand() * 72, y = 28 + rand() * 28;
      c.beginPath(); c.ellipse(x, y, 4 + rand() * 9, 2 + rand() * 4, rand() * 2, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(212,239,230,0.42)'; c.lineWidth = 1.7;
    c.beginPath(); c.ellipse(48, 14, 32, 7.6, 0, Math.PI, TAU); c.stroke();
    c.fillStyle = 'rgba(212,239,230,0.16)';
    c.beginPath(); c.ellipse(38, 13, 15, 3.4, -0.1, 0, TAU); c.fill();
    grain(c, 96, 62, 0.045, 88);
  });

  const keeper = (pose) => {
    canvasTex(scene, 'tc-keeper-' + pose, 150, 140, (c) => {
      const stride = pose === 'walk' ? 1 : 0;
      const tuck = pose === 'hop' ? 1 : 0;
      const lift = tuck ? -8 : 0;
      const foot = (v) => v - tuck * 17;
      c.lineCap = 'round';
      if (!tuck) {
        c.fillStyle = 'rgba(8,18,20,0.26)';
        c.beginPath(); c.ellipse(72, 132, 34, 6, 0, 0, TAU); c.fill();
      }
      c.strokeStyle = '#4a6152'; c.lineWidth = 15;
      c.beginPath(); c.moveTo(52, 86 + lift);
      c.quadraticCurveTo(26, 92 + lift - tuck * 12, 8, 76 + lift - tuck * 20); c.stroke();
      c.strokeStyle = '#38503f'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(26, 90 + lift - tuck * 10); c.quadraticCurveTo(14, 96 + lift, 4, 88 + lift); c.stroke();
      c.strokeStyle = '#3f5546'; c.lineWidth = 12;
      [[58, 100, 50 - stride * 9], [74, 102, 82 + stride * 7]].forEach(([hx, hy, fx]) => {
        c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx - 4, hy + 16 - tuck * 12, fx, foot(128)); c.stroke();
        c.fillStyle = '#2b3b31'; c.beginPath(); c.ellipse(fx + 3, foot(128), 10, 4.6, 0, 0, TAU); c.fill();
      });
      const body = c.createLinearGradient(48, 56 + lift, 108, 108 + lift);
      body.addColorStop(0, '#7f9a72'); body.addColorStop(0.5, '#5b7a5f'); body.addColorStop(1, '#365148');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(76, 86 + lift, 34, 26, -0.12 + tuck * 0.16, 0, TAU); c.fill();
      c.fillStyle = 'rgba(214,232,196,0.26)';
      c.beginPath(); c.ellipse(78, 99 + lift, 24, 9, -0.06, 0, TAU); c.fill();
      c.fillStyle = '#42604f';
      for (let i = 0; i < 5; i++) {
        const x = 54 + i * 8, y = 66 + lift + Math.sin(i * 0.48) * 5;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 4, y - 9, x + 9, y - 1); c.closePath(); c.fill();
      }
      c.strokeStyle = '#a8863f'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(58, 76 + lift); c.quadraticCurveTo(76, 92 + lift, 96, 80 + lift); c.stroke();
      c.fillStyle = '#f0dca8'; c.beginPath(); c.arc(78, 96 + lift, 5.4, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(120,90,40,0.7)'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(78, 96 + lift, 5.4, 0.3, 2.9); c.stroke();
      c.strokeStyle = '#557056'; c.lineWidth = 13;
      [[64, 104, 58 + stride * 10], [84, 104, 74 - stride * 10]].forEach(([hx, hy, fx]) => {
        c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + 5, hy + 16 - tuck * 14, fx, foot(130)); c.stroke();
        c.fillStyle = '#e6ead2'; c.beginPath(); c.ellipse(fx + 4, foot(130), 8, 3.4, 0, 0, TAU); c.fill();
      });
      c.strokeStyle = '#6b8a68'; c.lineWidth = 17;
      c.beginPath(); c.moveTo(98, 72 + lift); c.quadraticCurveTo(112, 60 + lift, 118, 52 + lift); c.stroke();
      c.fillStyle = '#7d9b74'; c.beginPath(); c.ellipse(124, 48 + lift, 17, 12, -0.2, 0, TAU); c.fill();
      c.fillStyle = '#5d7a5e';
      c.beginPath(); c.moveTo(136, 44 + lift); c.quadraticCurveTo(150, 48 + lift, 146, 56 + lift);
      c.quadraticCurveTo(138, 58 + lift, 132, 54 + lift); c.closePath(); c.fill();
      c.fillStyle = '#c6743c';
      c.beginPath(); c.moveTo(118, 38 + lift); c.quadraticCurveTo(110, 26 + lift, 122, 28 + lift);
      c.quadraticCurveTo(128, 32 + lift, 128, 40 + lift); c.closePath(); c.fill();
      c.fillStyle = '#f7ecc2'; c.beginPath(); c.arc(128, 45 + lift, 4.2, 0, TAU); c.fill();
      c.fillStyle = '#152418'; c.beginPath(); c.arc(129.2, 45 + lift, 2.1, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(127.8, 43.6 + lift, 1, 0, TAU); c.fill();
      c.strokeStyle = '#557056'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(92, 88 + lift);
      c.quadraticCurveTo(104, 92 + lift - tuck * 8, 110, 84 + lift - tuck * 6); c.stroke();
      rim(c, 150, 140, '190,224,214', 313 + pose.length * 7, 0.03);
    });
  };
  ['stand', 'walk', 'hop'].forEach(keeper);

  const hatchling = (pose) => {
    canvasTex(scene, 'tc-hatch-' + pose, 80, 68, (c) => {
      const tuck = pose === 'hop' ? 1 : 0;
      const stride = pose === 'walk' ? 1 : 0;
      const d = tuck * 3;
      c.lineCap = 'round';
      if (!tuck) {
        c.fillStyle = 'rgba(8,18,20,0.22)';
        c.beginPath(); c.ellipse(38, 62, 17, 3.6, 0, 0, TAU); c.fill();
      }
      c.strokeStyle = '#5c7559'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(24, 42 - d); c.quadraticCurveTo(12, 46 - d - 8, 5, 38 - d - 10); c.stroke();
      c.strokeStyle = '#4f6a4e'; c.lineWidth = 5;
      [[30, 48, 26 - stride * 5], [44, 48, 48 + stride * 5]].forEach(([hx, hy, fx]) => {
        c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, 60 - tuck * 11); c.stroke();
      });
      const body = c.createLinearGradient(20, 24, 56, 52);
      body.addColorStop(0, '#a8bd8a'); body.addColorStop(0.6, '#7a9470'); body.addColorStop(1, '#4c6452');
      c.fillStyle = body; c.beginPath(); c.ellipse(38, 40 - d, 20, 16, -0.08, 0, TAU); c.fill();
      c.fillStyle = 'rgba(232,240,206,0.3)';
      c.beginPath(); c.ellipse(39, 48 - d, 13, 5, 0, 0, TAU); c.fill();
      c.fillStyle = '#e0a35a';
      for (let i = 0; i < 4; i++) {
        const x = 44 + i * 3;
        c.beginPath(); c.moveTo(x, 26 - d); c.quadraticCurveTo(x + 2, 18 - d, x + 5, 25 - d); c.closePath(); c.fill();
      }
      c.fillStyle = '#93ac82'; c.beginPath(); c.ellipse(56, 28 - d, 12, 9, 0.1, 0, TAU); c.fill();
      c.fillStyle = '#6d8468';
      c.beginPath(); c.moveTo(64, 27 - d); c.quadraticCurveTo(74, 30 - d, 70, 34 - d);
      c.quadraticCurveTo(65, 34 - d, 62, 31 - d); c.closePath(); c.fill();
      c.fillStyle = '#1a2a1c'; c.beginPath(); c.arc(58, 26 - d, 3.1, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(57, 25 - d, 1.1, 0, TAU); c.fill();
      rim(c, 80, 68, '200,232,220', 517 + pose.length, 0.035);
    });
  };
  ['stand', 'walk', 'hop'].forEach(hatchling);

  canvasTex(scene, 'tc-log', 220, 56, (c) => {
    const rand = rng(9041);
    const g = c.createLinearGradient(0, 8, 0, 48);
    g.addColorStop(0, '#6b563c'); g.addColorStop(0.45, '#4e3d2a'); g.addColorStop(1, '#2c2118');
    c.fillStyle = g; c.beginPath();
    c.moveTo(10, 22); c.quadraticCurveTo(60, 10, 128, 14); c.quadraticCurveTo(186, 17, 212, 26);
    c.quadraticCurveTo(188, 44, 122, 44); c.quadraticCurveTo(56, 44, 12, 36); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(28,20,14,0.6)'; c.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      const y = 18 + i * 3.4;
      c.beginPath(); c.moveTo(18, y); c.quadraticCurveTo(110, y - 4 + rand() * 3, 206, y + 2); c.stroke();
    }
    c.fillStyle = '#3a2b1d';
    c.beginPath(); c.moveTo(64, 16); c.lineTo(52, 2); c.lineTo(74, 12); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(150, 18); c.lineTo(166, 4); c.lineTo(160, 20); c.closePath(); c.fill();
    c.fillStyle = 'rgba(206,222,214,0.6)';
    for (let i = 0; i < 16; i++) {
      c.beginPath(); c.arc(20 + rand() * 180, 26 + rand() * 14, 1.6 + rand() * 2.6, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(120,170,140,0.2)';
    c.beginPath(); c.ellipse(96, 40, 62, 5, 0, 0, TAU); c.fill();
    grain(c, 220, 56, 0.05, 1234);
  });

  canvasTex(scene, 'tc-fern', 104, 92, (c) => {
    const rand = rng(6612);
    c.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = -1.9 + i * 0.3 + rand() * 0.1;
      const len = 40 + rand() * 34;
      const ox = 52 + (i - 3) * 4;
      const g = c.createLinearGradient(ox, 88, ox + Math.cos(a) * len, 88 + Math.sin(a) * len);
      g.addColorStop(0, '#2f4a3a'); g.addColorStop(1, '#5f8558');
      c.strokeStyle = g; c.lineWidth = 3.2;
      c.beginPath(); c.moveTo(ox, 88);
      c.quadraticCurveTo(ox + Math.cos(a) * len * 0.6, 88 + Math.sin(a) * len * 0.7, ox + Math.cos(a) * len, 88 + Math.sin(a) * len);
      c.stroke();
      c.strokeStyle = 'rgba(120,160,110,0.65)'; c.lineWidth = 1.6;
      for (let j = 1; j < 6; j++) {
        const px = ox + Math.cos(a) * len * (j / 6), py = 88 + Math.sin(a) * len * (j / 6) * 0.95;
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a - 1) * 8, py + Math.sin(a - 1) * 8); c.stroke();
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a + 1) * 8, py + Math.sin(a + 1) * 8); c.stroke();
      }
    }
    grain(c, 104, 92, 0.04, 771);
  });

  canvasTex(scene, 'tc-cairn', 84, 108, (c) => {
    const rand = rng(3307);
    [[42, 92, 30, 15], [40, 70, 24, 13], [44, 52, 19, 11], [41, 36, 14, 9], [43, 24, 9, 7]].forEach(([x, y, rx, ry], i) => {
      const g = c.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
      g.addColorStop(0, i % 2 ? '#7b887f' : '#68766e'); g.addColorStop(1, '#2e3b38');
      c.fillStyle = g; c.beginPath();
      c.ellipse(x, y, rx, ry, (rand() - 0.5) * 0.2, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(14,22,24,0.5)'; c.lineWidth = 1.4; c.stroke();
      c.strokeStyle = 'rgba(212,239,230,0.3)';
      c.beginPath(); c.ellipse(x, y - ry * 0.5, rx * 0.7, ry * 0.4, 0, Math.PI, TAU); c.stroke();
    });
    c.fillStyle = 'rgba(200,170,90,0.5)';
    c.beginPath(); c.ellipse(30, 60, 8, 3, 0.4, 0, TAU); c.fill();
    grain(c, 84, 108, 0.05, 4001);
  });

  canvasTex(scene, 'tc-rain', 5, 42, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 42);
    g.addColorStop(0, 'rgba(206,232,232,0)'); g.addColorStop(0.5, 'rgba(206,232,232,0.75)');
    g.addColorStop(1, 'rgba(206,232,232,0)');
    c.fillStyle = g; c.fillRect(1, 0, 3, 42);
  });

  canvasTex(scene, 'tc-ripple', 96, 34, (c) => {
    c.strokeStyle = 'rgba(212,239,230,0.85)'; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(48, 17, 42, 12, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(212,239,230,0.35)'; c.lineWidth = 5;
    c.beginPath(); c.ellipse(48, 17, 42, 12, 0, 0, TAU); c.stroke();
  });
}

function create(scene) {
  const M = scene.M, K = scene.k, S = M.band;
  // the road is laid out on the horizontal axis, which never stretches, so the
  // stones grow far less than K or the two lines would merge into one wall
  const SS = M.portrait ? 1.12 : 1;
  art(scene);
  const r = rng(20261112);
  const col = (h) => Phaser.Display.Color.HexStringToColor(h).color;
  const accent = col(PAL.accent), foamCol = col(PAL.motes);
  const stones = [];
  LINES.forEach((ln, li) => {
    for (let i = 0; i < ln.n; i++) {
      stones.push({ line: li, x: ln.x0 + i * ln.dx, blocked: false, ph: r() * 6,
        top: ln.top - i * ln.rise + (i % 3 === 1 ? -3 : i % 3 === 2 ? 3 : 0),
        w: ln.w * (0.84 + r() * 0.3), tint: [0xa9b8ae, 0xb2bfb5, 0x9fada6, 0x93a4a0, 0x9baaa4, 0x8fa09c][li * 3 + i % 3]
      });
    }
  });
  stones.sort((a, b) => a.x - b.x);
  stones.forEach((s) => {
    s.img = scene.add.image(s.x, M.Y(s.top), 'tc-stone').setOrigin(0.5, 15 / 62)
      .setDepth(s.line === 0 ? 11 : 13).setScale(s.w * SS).setTint(s.tint);
  });

  const st = {
    score: 0, stepped: 0, hearts: 3, drowned: 0, crossings: 0, cycle: 1,
    over: false, invuln: 0, clock: 1, sel: 0, hover: -1, lastPeak: -1
  };
  const tide = { phase: 0.015, period: 40, amp: 62, level: 0, y: LOW, crest: 0 };
  const me = { x: BEACH_X, y: BEACH_TOP, kind: 'beach', i: -2, pose: 'stand', face: 1 };
  const hatch = { x: BEACH_X - 34, y: BEACH_TOP, gap: 0, pose: 'stand', ph: r() * 6, wet: 0 };
  const trail = [{ x: BEACH_X, y: BEACH_TOP }];
  const hop = { on: false, t: 0, dur: 0.5, fx: 0, fy: 0, tx: 0, ty: 0, kind: 'beach', i: -2 };
  const surge = { t: 0, every: 8.4, warn: 2.2, after: -1, p: 0, h: 18 };
  const drift = { on: false, x: 0, vx: 0, hold: 0, i: -1, t: 0, every: 17 };
  const surfaceY = () => tide.y - tide.crest;
  const under = (y) => surfaceY() < y - 1;

  const shore = scene.add.graphics().setDepth(10);
  const water = scene.add.graphics().setDepth(16);
  const foam = scene.add.graphics().setDepth(17);
  const marks = scene.add.graphics().setDepth(24);
  addMaterialLayer(scene,shore,'material-rock',W,M.H);
  addMaterialLayer(scene,water,'material-water',W,M.H,{alpha:.7,flow:true});
  const glowG = scene.add.graphics().setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
  const lightning = scene.add.graphics().setDepth(-10);
  const veil = scene.add.rectangle(0, 0, W, M.H, col('#0d2530'), 0).setOrigin(0).setDepth(34);
  const meImg = scene.add.image(me.x, M.Y(me.y), 'tc-keeper-stand')
    .setOrigin(0.5, 132 / 140).setDepth(22).setScale(0.8 * K);
  const hatchImg = scene.add.image(hatch.x, M.Y(hatch.y), 'tc-hatch-stand')
    .setOrigin(0.5, 60 / 68).setDepth(21).setScale(0.82 * K);
  const hatchGlow = scene.add.image(hatch.x, M.Y(hatch.y), 'arc-glow').setDepth(20)
    .setScale(0.5 * K).setAlpha(0).setTint(accent).setBlendMode(Phaser.BlendModes.ADD);
  const logImg = scene.add.image(-300, M.Y(LOW), 'tc-log').setDepth(18).setScale(0.8 * SS).setAlpha(0);
  const ripple = scene.add.image(0, 0, 'tc-ripple').setDepth(19).setVisible(false).setScale(SS);
  const ferns = [];
  for (let i = 0; i < 4; i++) ferns.push(scene.add.image(876 + i * 26 + r() * 12, M.Y(ASHORE_TOP + 2 + (i % 2) * 3), 'tc-fern')
    .setOrigin(0.5, 0.94).setDepth(9).setScale((0.5 + r() * 0.26) * SS).setAlpha(0.9));
  for (let i = 0; i < 3; i++) ferns.push(scene.add.image(16 + i * 42 + r() * 18, M.Y(BEACH_TOP + 4), 'tc-fern')
    .setOrigin(0.5, 0.94).setDepth(9).setScale((0.42 + r() * 0.2) * SS).setAlpha(0.75).setTint(0x8fa894));
  scene.add.image(926, M.Y(ASHORE_TOP + 2), 'tc-cairn').setOrigin(0.5, 0.96).setDepth(14).setScale(0.72 * SS);
  scene.add.particles(0, 0, 'tc-rain', {
    x: { min: -60, max: W + 60 }, y: -50, speedX: { min: 70, max: 130 }, speedY: { min: 620, max: 880 },
    lifespan: 900, alpha: { start: 0.32, end: 0.1 }, rotate: 11, frequency: 26, quantity: 1
  }).setDepth(30);
  const spray = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 60, max: 210 }, angle: { min: 210, max: 300 }, lifespan: { min: 420, max: 780 },
    scale: { start: 0.42, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: [foamCol, accent],
    gravityY: 460, emitting: false
  }).setDepth(26);
  const drip = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 20, max: 70 }, lifespan: 520, scale: { start: 0.3, end: 0 }, alpha: { start: 0.7, end: 0 },
    tint: foamCol, gravityY: 520, emitting: false
  }).setDepth(26);
  let boltT = 4 + r() * 5;

  function candidates() {
    const cx = hop.on ? hop.tx : me.x, list = [];
    for (let i = 0; i < stones.length; i++) {
      const s = stones[i];
      const dx = s.x - cx;
      if (dx < REACH_MIN || dx > REACH_MAX || s.blocked || under(s.top)) continue;
      list.push({ kind: 'stone', i, x: s.x, y: s.top });
    }
    if (cx > 640 && ASHORE_X - cx <= SHORE_REACH) list.push({ kind: 'ashore', i: -3, x: ASHORE_X, y: ASHORE_TOP });
    return list;
  }

  const poly = (g, hex, a, pts) => {
    g.fillStyle(col(hex), a); g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, M.Y(y)) : g.moveTo(x, M.Y(y))));
    g.closePath(); g.fill();
  };
  // this build of phaser has no Graphics#ellipse, so ovals are traced by hand
  const oval = (gr, x, y, rx, ry, filled) => {
    gr.beginPath();
    for (let i = 0; i <= 22; i++) {
      const a = (i / 22) * TAU, px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry;
      if (i === 0) gr.moveTo(px, py); else gr.lineTo(px, py);
    }
    if (filled) { gr.closePath(); gr.fill(); } else gr.strokePath();
  };
  function drawShore() {
    const damp = clamp((surfaceY() - BEACH_TOP) / 90, 0, 1);
    shore.clear();
    poly(shore, '#2c4040', 1, [[0, 246], [128, BEACH_TOP], [196, 352], [232, 520], [236, BOT], [0, BOT]]);
    poly(shore, '#3f5a56', 1, [[0, 252], [126, BEACH_TOP + 2], [150, BEACH_TOP + 12], [0, 300]]);
    poly(shore, '#16292e', 0.35 + damp * 0.5, [[96, 318], [200, 356], [236, BOT], [80, BOT]]);
    poly(shore, '#25363a', 1, [[W, 212], [858, ASHORE_TOP - 4], [838, 330], [812, 470], [820, BOT], [W, BOT]]);
    poly(shore, '#3d5254', 1, [[W, 214], [860, ASHORE_TOP - 2], [884, ASHORE_TOP + 14], [W, 268]]);
    poly(shore, '#6d8478', 0.5, [[860, ASHORE_TOP - 3], [W, ASHORE_TOP - 20], [W, ASHORE_TOP - 8], [872, ASHORE_TOP + 6]]);
    poly(shore, '#16292e', 0.3 + damp * 0.45, [[812, 470], [838, 330], [858, 360], [830, BOT], [812, BOT]]);
  }

  const swell = (x, bd, t) => Math.sin(x * bd.wave + t * bd.spd) * bd.amp
    + Math.sin(x * bd.wave * 2.3 - t * bd.spd * 0.7) * bd.amp * 0.45;

  const trace = (g, step, line, bd, t, mul) => {
    g.beginPath();
    for (let x = 0; x <= W; x += step) {
      const y = M.Y(line + swell(x, bd, t) * mul);
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokePath();
  };

  function drawWater(time) {
    const wy = surfaceY(), t = time * 0.011, warn = surge.p;
    water.clear(); foam.clear(); glowG.clear();

    for (let b = BANDS.length - 1; b >= 0; b--) {
      const bd = BANDS[b];
      const line = wy + bd.o;
      water.fillStyle(col(bd.c), bd.a);
      water.beginPath();
      water.moveTo(0, M.Y(BOT)); water.lineTo(0, M.Y(line + swell(0, bd, t)));
      for (let x = 16; x <= W; x += 16) water.lineTo(x, M.Y(line + swell(x, bd, t)));
      water.lineTo(W, M.Y(BOT)); water.closePath(); water.fill();
    }

    foam.lineStyle(2.6 * K, foamCol, lerp(0.34, 0.95, warn));
    trace(foam, 12, wy + BANDS[0].o, BANDS[0], t, 1);
    for (let b = 2; b < BANDS.length; b++) {
      foam.lineStyle((1.8 + (b - 2) * 0.45) * (M.portrait ? 1.05 : K), foamCol, 0.14 + (b - 2) * 0.04);
      trace(foam, 18, wy + BANDS[b].o, BANDS[b], t, (1.4 + (b - 2) * 0.35) * (M.portrait ? 0.62 : 1));
    }
    for (let k = 0; k < 26; k++) {
      const gx = (k * 137 + time * (0.02 + (k % 5) * 0.006)) % (W + 40) - 20;
      const gy = wy + 26 + (k * 61) % 190 + Math.sin(time / 700 + k) * 3;
      foam.fillStyle(foamCol, 0.08 + (k % 4) * 0.03);
      foam.fillCircle(gx, M.Y(gy), (1.3 + (k % 3) * 0.9) * SS);
    }
    if (warn > 0.02) {
      glowG.lineStyle(8 * K, accent, 0.16 + warn * 0.42);
      trace(glowG, 24, wy + BANDS[0].o, BANDS[0], t, 1);
    }

    for (let i = 0; i < stones.length; i++) {
      const s = stones[i];
      const e = wy - s.top;
      if (e > -14 && e < 30) {
        const wob = Math.sin(time / 320 + s.ph) * 2.4;
        foam.fillStyle(foamCol, clamp(0.42 - Math.abs(e) * 0.01, 0.1, 0.42));
        for (let k = 0; k < 6; k++) {
          const bx = s.x + (k * 13.6 - 34) * s.w * SS;
          foam.fillCircle(bx, M.Y(wy + wob * (k % 2 ? 0.5 : -0.5) + (k % 3) * 1.4), (1.8 + (k % 3) * 1.4) * SS);
        }
        if (Math.random() < 0.05 + warn * 0.12) spray.explode(1, s.x + (r() - 0.5) * 60, M.Y(wy));
      }
      if (e < -6) {
        foam.fillStyle(0x0a1c24, 0.15);
        oval(foam, s.x, M.Y(s.top + 9), 31 * s.w * SS, 8 * SS, true);
        foam.fillStyle(foamCol, 0.1);
        oval(foam, s.x, M.Y(wy + 3), 26 * s.w * SS, 4.5 * SS, true);
        if (!ripple.visible && Math.random() < 0.05) {
          ripple.setVisible(true).setAlpha(0.5);
          ripple.x = s.x; ripple.y = M.Y(wy + 2); ripple.scale = 0.7 * SS;
          scene.tweens.add({ targets: ripple, scale: 1.4 * SS, alpha: 0, duration: 900, onComplete: () => ripple.setVisible(false) });
        }
      } else if (e < 26) {
        const t2 = 1 - e / 26;
        foam.lineStyle(1.8 * K, accent, 0.08 + t2 * 0.2 + Math.sin(time / 160) * 0.05 * t2);
        oval(foam, s.x, M.Y(s.top + 2), 32 * s.w * SS, 7.5 * s.w * SS, false);
      }
    }
  }

  function drawMarks(time) {
    marks.clear();
    if (st.over) return;
    candidates().forEach((c, k) => {
      const hot = k === st.sel || k === st.hover;
      const y = M.Y(c.y);
      const wide = c.kind === 'ashore' ? 30 : 28;
      marks.lineStyle(hot ? 3.4 * K : 2 * K, hot ? accent : col(PAL.mist), hot ? 0.9 : 0.34);
      oval(marks, c.x, y + 4 * S, wide * SS, 8 * SS, false);
      if (hot) {
        marks.fillStyle(accent, 0.2);
        marks.fillCircle(c.x, y - 6 * S, 5 * K);
        marks.lineStyle(2 * K, accent, 0.55);
        marks.beginPath();
        marks.moveTo(c.x, y - (26 + Math.sin(time / 220) * 4) * S);
        marks.lineTo(c.x, y - 10 * S);
        marks.strokePath();
      }
    });
  }

  const splashAt = (x, y, big) => {
    scene.burst(x, M.Y(y) + 4, foamCol, big ? 16 : 10, { life: 520, gravity: 420, scale: 0.5 });
    spray.explode(big ? 10 : 6, x, M.Y(y + 6));
  };

  function hopTo(c) {
    if (hop.on || st.over) return false;
    hop.on = true; hop.t = 0; hop.kind = c.kind; hop.i = c.i;
    hop.dur = 0.3 + Math.abs(c.x - me.x) / 300;
    hop.fx = me.x; hop.fy = me.y; hop.tx = c.x; hop.ty = c.y;
    me.face = c.x >= me.x ? 1 : -1;
    scene.sfx('jump');
    return true;
  }

  function land() {
    hop.on = false;
    me.x = hop.tx; me.y = hop.ty; me.kind = hop.kind; me.i = hop.i;
    if (hop.kind === 'ashore') { crossing(); return; }
    const s = stones[hop.i];
    st.stepped++; hatch.gap += 0.85;
    trail.push({ x: s.x, y: s.top });
    scene.sfx('splash');
    splashAt(s.x, s.top, false);
    scene.popText(s.x, M.Y(s.top - 62), '+1 stone', '#d8fff2');
    if (st.stepped % 5 === 0 && hatch.gap > 1.4) scene.notice('the little one is a long way back', 1500);
  }

  function resetRoad() {
    me.x = BEACH_X; me.y = BEACH_TOP; me.kind = 'beach'; me.i = -2;
    hop.on = false; hatch.gap = 0;
    trail.length = 0; trail.push({ x: BEACH_X, y: BEACH_TOP });
    stones.forEach((s) => { s.blocked = false; });
    drift.on = false; drift.i = -1; drift.hold = 0;
    logImg.setAlpha(0);
  }

  function nextCycle() {
    tide.amp = Math.min(104, tide.amp + 12);
    tide.period = Math.max(17, tide.period * 0.8);
    tide.phase = 0.001;
    surge.every = Math.max(5.4, surge.every - 0.9);
    surge.warn = Math.max(1.15, surge.warn - 0.28);
    drift.every = Math.max(9, drift.every - 2.4);
  }

  function crossing() {
    const got = st.stepped + 1;
    st.score += got; st.stepped = 0; st.crossings++; st.cycle++; st.invuln = 0.9;
    resetRoad();
    scene.sfx('chime'); scene.sfx('good');
    scene.cameras.main.flash(260, 150, 220, 210);
    scene.burst(ASHORE_X - 60, M.Y(ASHORE_TOP - 70), 0xffd77a, 20, { life: 820, gravity: 240, spin: true });
    scene.popText(ASHORE_X - 70, M.Y(ASHORE_TOP - 96), '+' + got + ' stones', '#ffe6a8');
    if (st.crossings >= NEED) { finish(true); return; }
    nextCycle();
    scene.notice(got + ' stones kept — the next tide comes in higher', 2400);
  }

  function wash(reason) {
    if (st.over || st.invuln > 0) return;
    const px = me.x, py = me.y;
    st.drowned++; st.stepped = 0;
    resetRoad();
    st.invuln = 1.6;
    scene.sfx('splash'); scene.sfx('hurt');
    scene.shake(300, 0.014);
    scene.cameras.main.flash(300, 40, 90, 100);
    splashAt(px, py + 10, true);
    scene.popText(px - 20, M.Y(py - 76), 'washed off', '#ffb1a1');
    if (st.drowned >= 3) { finish(false); return; }
    scene.notice(reason, 2100);
  }

  function loseHatch() {
    if (st.over) return;
    st.hearts--; st.invuln = 1.2; hatch.gap = 0;
    scene.sfx('hurt');
    scene.shake(240, 0.012);
    scene.burst(hatch.x, M.Y(hatch.y - 20), 0xffc9a8, 12, { life: 620, gravity: 300 });
    scene.popText(hatch.x, M.Y(hatch.y - 76), 'under the water', '#ffcfae');
    if (st.hearts <= 0) { finish(false); return; }
    scene.notice('the little one went under — wait at a stone for it', 2200);
  }

  function finish(win) {
    if (st.over) return;
    st.over = true;
    scene.finish(win, {
      score: st.score,
      note: win ? 'four crossings, ' + st.score + ' stones, and the little one dry'
        : st.drowned >= 3 ? st.score + ' stones kept, then the sea took the road'
          : st.score + ' stones kept, and the water got the little one'
    });
  }

  function strikeBolt() {
    let px = 140 + r() * (W - 280), py = -20;
    lightning.clear(); lightning.lineStyle(3, 0xdff4ff, 0.7);
    lightning.beginPath(); lightning.moveTo(px, py);
    for (let i = 0; i < 8; i++) {
      px += (r() - 0.5) * 96; py += 26 + r() * 30;
      lightning.lineTo(px, py);
    }
    lightning.strokePath();
    lightning.lineStyle(1.1, 0xffffff, 0.85); lightning.strokePath();
    scene.cameras.main.flash(140, 180, 210, 220);
    scene.time.delayedCall(180, () => lightning.clear());
  }

  function pickAt(px, py) {
    const list = candidates();
    let best = 118, pick = -1;
    list.forEach((c, k) => {
      const d = Math.hypot(c.x - px, (c.y - py) * 0.8);
      if (d < best) { best = d; pick = k; }
    });
    if (pick < 0 && list.length && px > (hop.on ? hop.tx : me.x)) {
      let bd = 1e9; list.forEach((c, k) => { if (Math.abs(c.x - px) < bd) { bd = Math.abs(c.x - px); pick = k; } });
    }
    return { list, pick };
  }

  const hopSel = () => { const l = candidates(); if (l[st.sel]) hopTo(l[st.sel]); };
  scene.input.on('pointermove', (ptr) => { st.hover = pickAt(ptr.x, scene.uY(ptr.y)).pick; });
  scene.input.on('pointerdown', (ptr) => {
    const { list, pick } = pickAt(ptr.x, scene.uY(ptr.y));
    if (pick >= 0) { st.sel = pick; hopTo(list[pick]); }
  });
  scene.input.keyboard.on('keydown-SPACE', hopSel);
  scene.input.keyboard.on('keydown-ENTER', hopSel);
  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S'
  });

  let edge = 0;
  function steer() {
    const list = candidates();
    if (!list.length) return;
    st.sel = clamp(st.sel, 0, list.length - 1);
    const now = scene.time.now;
    const tap = (a, b) => (a.isDown || b.isDown) && now - edge > 160;
    if (tap(keys.right, keys.d)) { st.sel = Math.min(list.length - 1, st.sel + 1); edge = now; }
    else if (tap(keys.left, keys.a)) { st.sel = Math.max(0, st.sel - 1); edge = now; }
    else if (tap(keys.up, keys.w) || tap(keys.down, keys.s)) {
      const cur = list[st.sel];
      const want = stones[cur.i] ? 1 - stones[cur.i].line : 0;
      let best = -1, bd = 1e9;
      list.forEach((c, k) => {
        if (c.kind !== 'stone' || stones[c.i].line !== want) return;
        if (Math.abs(c.x - cur.x) < bd) { bd = Math.abs(c.x - cur.x); best = k; }
      });
      if (best >= 0) st.sel = best;
      edge = now;
    }
  }

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'low water — the road is draining' });
  scene.notice('the sea takes the road twice a day — be ashore when it does', 3000);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000) * st.clock;
    if (st.over) return;
    steer();

    tide.phase += dt / tide.period;
    if (tide.phase >= 1) tide.phase -= 1;
    tide.level = tideLevel(tide.phase); tide.y = LOW - tide.amp * tide.level;

    if (tide.phase >= RISE && st.lastPeak !== st.cycle) {
      st.lastPeak = st.cycle;
      if (me.kind === 'stone') wash('the top of the tide took the road');
      else if (me.kind === 'beach') scene.notice('the sea holds the road — wait for it to back off', 2100);
      tide.amp = Math.min(104, tide.amp + 4);
    }

    surge.t += dt;
    if (surge.after >= 0) {
      surge.after += dt;
      tide.crest = Math.max(0, 1 - surge.after / 1.1) * surge.h;
      surge.p = 0;
      if (surge.after > 1.1) { surge.after = -1; tide.crest = 0; }
    } else {
      surge.p = clamp((surge.warn - (surge.every - surge.t)) / surge.warn, 0, 1);
      tide.crest = surge.p * surge.p * surge.h;
      if (surge.t >= surge.every) {
        surge.t = 0; surge.after = 0; surge.h = 16 + tide.level * 10;
        scene.sfx('whoosh');
        scene.shake(180, 0.005 + surge.p * 0.004);
        for (let i = 0; i < 5; i++) spray.explode(3, 60 + r() * (W - 120), M.Y(surfaceY()));
        if (under(hatch.y)) {
          if (hatch.gap > 0.45) loseHatch();
          else if (me.kind === 'stone') wash('the wave took your footing');
        } else if (surge.p > 0.6) scene.sfx('tick');
      }
    }
    st.invuln = Math.max(0, st.invuln - dt);

    if (hop.on) {
      hop.t += dt;
      const p = clamp(hop.t / hop.dur, 0, 1);
      me.x = lerp(hop.fx, hop.tx, p);
      me.y = lerp(hop.fy, hop.ty, p) - Math.sin(Math.PI * p) * (30 + Math.abs(hop.tx - hop.fx) * 0.16);
      me.pose = 'hop';
      if (p >= 1) land();
    } else {
      hatch.gap = Math.max(0, hatch.gap - dt * (me.kind === 'beach' ? 1.5 : 0.9));
      me.pose = 'stand';
      if (me.kind === 'stone' && st.invuln <= 0 && under(stones[me.i].top)) wash('the water came up the stone');
      else if (me.kind === 'beach' && st.invuln <= 0 && tide.y < BEACH_TOP - 1) wash('the sea reached the beach');
    }

    const back = trail[clamp(trail.length - 1 - Math.round(hatch.gap), 0, trail.length - 1)];
    const ease = Math.min(1, dt * (hatch.gap > 0.2 ? 3.4 : 5.2));
    hatch.x += (back.x - 22 - hatch.x) * ease;
    hatch.y += (back.y - hatch.y) * ease;
    hatch.pose = hop.on ? 'hop' : (Math.abs(back.x - 22 - hatch.x) > 6 ? 'walk' : 'stand');
    hatch.wet = clamp((hatch.y - surfaceY()) / 26, 0, 1);
    if (hatch.wet > 0.1 && Math.random() < dt * 6) drip.explode(1, hatch.x, M.Y(surfaceY()));

    if (!drift.on) {
      drift.t += dt;
      if (drift.t >= drift.every) {
        drift.t = 0; drift.on = true; drift.hold = 0; drift.i = -1;
        drift.x = r() < 0.5 ? -140 : W + 140;
        drift.vx = (drift.x < 0 ? 1 : -1) * (34 + r() * 22);
        logImg.setAlpha(0.96);
        scene.notice('a log is coming in on the swell', 1800);
      }
    } else if (drift.hold > 0) {
      drift.hold -= dt;
      if (drift.hold <= 0 && drift.i >= 0) { stones[drift.i].blocked = false; drift.i = -1; }
    } else {
      drift.x += drift.vx * dt;
      for (let i = 0; i < stones.length; i++) {
        const s = stones[i];
        const e = surfaceY() - s.top;
        if (s.blocked || Math.abs(s.x - drift.x) > 34 || e < -6 || e > 30) continue;
        s.blocked = true; drift.i = i; drift.hold = 5.5 + r() * 3; drift.x = s.x;
        scene.sfx('land');
        scene.shake(140, 0.005);
        scene.notice('a log has jammed the ' + (i + 1) + 'th stone', 1900);
        break;
      }
    }
    if (drift.on) {
      const ly = drift.i >= 0 ? stones[drift.i].top - 6 : surfaceY() - 4;
      logImg.x = drift.x;
      logImg.y = M.Y(ly) + Math.sin(time / 420) * 3 * S;
      logImg.rotation = Math.sin(time / 900) * 0.05;
      if (drift.x < -200 || drift.x > W + 200) { drift.on = false; logImg.setAlpha(0); }
    }

    boltT -= dt; if (boltT <= 0) { boltT = 5 + r() * 7; strikeBolt(); }
    ferns.forEach((f, i) => { f.rotation = Math.sin(time / 620 + i) * 0.07 - 0.03; });

    meImg.x = me.x; meImg.y = M.Y(me.y);
    meImg.setTexture('tc-keeper-' + me.pose).setFlipX(me.face < 0);
    meImg.setAngle(hop.on ? me.face * -7 : Math.sin(time / 500) * 1.4);
    meImg.setAlpha(st.invuln > 0 && Math.floor(time / 80) % 2 ? 0.45 : 1);
    meImg.setScale((0.8 + (hop.on ? 0.03 : 0)) * K);
    hatchImg.x = hatch.x; hatchImg.y = M.Y(hatch.y);
    hatchImg.setTexture('tc-hatch-' + hatch.pose).setFlipX(me.face < 0);
    hatchImg.setAlpha(hatch.wet > 0.5 ? 0.75 : 1);
    hatchGlow.x = hatch.x; hatchGlow.y = M.Y(hatch.y - 14);
    hatchGlow.setAlpha(hatch.wet * 0.3 + (hatch.gap > 1.6 ? 0.16 : 0));

    for (let i = 0; i < stones.length; i++) {
      const s = stones[i];
      const gone = under(s.top);
      s.img.setTint(gone ? 0x35505a : s.blocked ? 0x8a7a62 : s.tint);
      s.img.setAlpha(gone ? 0.55 : 1);
      s.img.y = M.Y(s.top) + (gone ? Math.sin(time / 500 + s.ph) * 1.6 * S : 0);
    }

    drawShore(); drawWater(time); drawMarks(time);
    veil.setFillStyle(col('#0d2530'), clamp((tide.level - 0.55) * 0.22, 0, 0.13));
    scene.hud({
      score: st.score + st.stepped,
      progress: clamp(tide.level + tide.crest / 90, 0, 1),
      hearts: st.hearts,
      extra: hatch.gap > 1.7 ? 'the little one is behind'
        : surge.p > 0.45 ? 'a wave is rolling in'
          : tide.level > 0.82 ? 'top of the tide'
            : candidates().length === 0 ? 'the road is still under'
              : 'tide ' + Math.round(tide.level * 100) + ' percent'
    });
    scene.audio.setTension(clamp(tide.level * 0.55 + surge.p * 0.4 + (3 - st.hearts) * 0.08 + st.drowned * 0.08, 0, 1));
  }

  function pagePoint(gx, gy) {
    const rect = scene.game.canvas.getBoundingClientRect();
    return { x: rect.left + (gx / W) * rect.width, y: rect.top + (M.Y(gy) / M.H) * rect.height };
  }

  const pickList = (k) => {
    const list = candidates();
    return list[clamp(Math.round(Number(k) || 0), 0, list.length - 1)];
  };

  return {
    update,
    state: () => ({
      score: st.score, pending: st.stepped, live: st.score + st.stepped,
      hearts: st.hearts, drowned: st.drowned, crossings: st.crossings, cycle: st.cycle,
      level: Number(tide.level.toFixed(3)), waterY: Number(surfaceY().toFixed(1)),
      phase: Number(tide.phase.toFixed(3)), period: Number(tide.period.toFixed(1)), amp: tide.amp,
      crest: Number(tide.crest.toFixed(1)), surge: Number(surge.p.toFixed(2)),
      at: me.kind, stone: me.i, x: Math.round(me.x), y: Math.round(me.y),
      hopping: hop.on, invuln: Number(st.invuln.toFixed(2)),
      hatch: { x: Math.round(hatch.x), y: Math.round(hatch.y), gap: Number(hatch.gap.toFixed(2)), wet: Number(hatch.wet.toFixed(2)) },
      candidates: candidates().map((c) => ({ kind: c.kind, i: c.i, x: Math.round(c.x) })),
      blocked: stones.map((s, i) => (s.blocked ? i : -1)).filter((i) => i >= 0),
      under: stones.map((s, i) => (under(s.top) ? i : -1)).filter((i) => i >= 0),
      over: st.over
    }),
    setClock: (v) => { st.clock = clamp(Number(v) || 1, 0.2, 10); },
    step: (k) => { const c = pickList(k); return c ? hopTo(c) : false; },
    candidateCount: () => candidates().length,
    nextScreen: (k) => { const c = pickList(k); return c ? pagePoint(c.x, c.y) : null; },
    stoneScreen: (i) => {
      const s = stones[clamp(Math.round(Number(i) || 0), 0, stones.length - 1)];
      return pagePoint(s.x, s.top);
    },
    road: () => stones.map((s, i) => ({ i, line: s.line, x: Math.round(s.x), top: s.top, under: under(s.top), blocked: s.blocked })),
    setTide: (level) => {
      const l = clamp(Number(level) || 0, 0, 0.999);
      tide.phase = RISE * Math.acos(1 - 2 * l) / Math.PI;
      tide.level = tideLevel(tide.phase); tide.y = LOW - tide.amp * tide.level;
    },
    rollNow: () => { surge.t = surge.every; },
    jamLog: () => {
      const open = stones.findIndex((s) => !s.blocked && !under(s.top));
      if (open < 0) return -1;
      stones[open].blocked = true;
      drift.on = true; drift.i = open; drift.hold = 8; drift.x = stones[open].x;
      logImg.setAlpha(0.96);
      return open;
    },
    clearLog: () => {
      if (drift.i >= 0) stones[drift.i].blocked = false;
      drift.on = false; drift.i = -1; drift.hold = 0; drift.t = 0;
      logImg.setAlpha(0);
    }
  };
}

export default {
  id: 'tide-causeway', unit: 'stones', stars: STAR, create,
  backdropOpts: { ground: false },
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
