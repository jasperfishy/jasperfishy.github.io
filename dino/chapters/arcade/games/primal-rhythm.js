// Primal Rhythm — the great chorus at dusk.
// Four hide drums ring a stone floor. Runes fall with the beat; strike each one
// as it crosses its drum and the herd answers, note by note, until the valley
// is drumming with you.

import { canvasTex, grain, clamp, W } from '../engine.js?v=du-58e7197a7bd67562';

const BPM = 112;
const BEAT = 60 / BPM;
const EIGHTH = BEAT / 2;
const LEAD = 8 * BEAT;
const RING_Y = 388;
const LANES = [120, 360, 600, 840];
const APPROACH = 2.35;
const PERFECT = 0.08;
const GOOD = 0.2;
const SPEED = (RING_Y + 80) / APPROACH;
const STAR = [40, 90, 150];
const COLORS = [0xffcf6a, 0xff8f5e, 0x7de3d4, 0xc9b6ff];
const CSS = ['#ffcf6a', '#ff8f5e', '#7de3d4', '#c9b6ff'];
const RGB = ['255,207,106', '255,143,94', '125,227,212', '201,182,255'];
const SERIF = "'Iowan Old Style','Palatino Linotype',Georgia,serif";
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

const PATTERNS = {
  introD: [[0, 3], [1, 2], [2, 1], [3, 0]],
  intro: [[0, 0], [1, 1], [2, 2], [3, 3]],
  walk: [[0, 0], [0.5, 1], [1, 2], [1.5, 3], [2, 1], [2.5, 2], [3, 3], [3.5, 2]],
  chop: [[0, 1], [0.5, 3], [1, 2], [1.5, 0], [2, 1], [2.5, 3]],
  call: [[0, 0], [1, 1], [1.5, 0], [2, 2], [3, 3], [3.5, 2]],
  pairs: [[0, [0, 3]], [1.5, [1, 2]], [2.5, [0, 2]], [3.5, [1, 3]]],
  stomp: [[0, 0], [1, 3], [2, 1], [3, 2], [3.5, 0]],
  run: [[0, 0], [0.5, 1], [1, 2], [1.5, 3], [2, 0], [2.5, 1], [3, 2], [3.5, 3]],
  finale: [[0, 0], [0.5, 2], [1, 1], [1.5, 3], [2, [0, 3]], [3, [1, 2]]],
  finale2: [[0, 0], [0.5, 1], [1, 2], [1.5, 3], [2, 2], [2.5, 1], [3, [0, 3]]]
};

const PLAN = [
  'introD', 'intro',
  'walk', 'chop', 'call', 'pairs',
  'walk', 'stomp', 'run', 'chop',
  'walk', 'call', 'pairs', 'run',
  'chop', 'walk', 'call', 'stomp',
  'walk', 'pairs', 'run', 'chop',
  'walk', 'call', 'stomp', 'run',
  'finale', 'finale2'
];

function buildChart() {
  const notes = [];
  PLAN.forEach((name, bar) => {
    const t0 = LEAD + bar * 4 * BEAT;
    const rot = (bar * 3) % 4;
    PATTERNS[name].forEach(([b, lane]) => {
      const t = t0 + b * BEAT;
      if (Array.isArray(lane)) lane.forEach((l) => notes.push({ t, lane: (l + rot) % 4 }));
      else notes.push({ t, lane: (lane + rot) % 4 });
    });
  });
  notes.sort((a, b) => a.t - b.t || a.lane - b.lane);
  return { notes, end: LEAD + PLAN.length * 4 * BEAT + BEAT * 2 };
}

/* ------------------------------------------------------------------- art */
function drawGlyph(c, idx, cx, cy, s, color) {
  c.save();
  c.translate(cx, cy);
  c.fillStyle = color;
  c.strokeStyle = color;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (idx === 0) {
    c.lineWidth = s * 0.24;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(i * s * 0.48, -s * 0.7);
      c.quadraticCurveTo(i * s * 0.66 + s * 0.08, 0, i * s * 0.5 + s * 0.2, s * 0.68);
      c.stroke();
    }
  } else if (idx === 1) {
    c.beginPath();
    c.moveTo(-s * 0.55, -s * 0.66);
    c.quadraticCurveTo(s * 0.5, -s * 0.3, s * 0.46, s * 0.06);
    c.quadraticCurveTo(s * 0.2, s * 0.54, -s * 0.44, s * 0.62);
    c.quadraticCurveTo(-s * 0.08, s * 0.06, -s * 0.55, -s * 0.66);
    c.closePath();
    c.fill();
  } else if (idx === 2) {
    c.lineWidth = s * 0.16;
    c.beginPath();
    c.moveTo(-s * 0.14, s * 0.72);
    c.quadraticCurveTo(s * 0.36, 0, s * 0.06, -s * 0.74);
    c.stroke();
    c.lineWidth = s * 0.1;
    for (let i = 0; i < 4; i++) {
      const yy = -s * 0.44 + i * s * 0.3;
      c.beginPath();
      c.moveTo(s * 0.08, yy);
      c.quadraticCurveTo(-s * 0.24, yy + s * 0.1, -s * 0.52, yy + s * 0.26);
      c.stroke();
      c.beginPath();
      c.moveTo(s * 0.16, yy + s * 0.08);
      c.quadraticCurveTo(s * 0.32, yy + s * 0.24, s * 0.3, yy + s * 0.42);
      c.stroke();
    }
  } else {
    c.beginPath();
    c.arc(0, 0, s * 0.26, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = s * 0.14;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      c.beginPath();
      c.moveTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42);
      c.lineTo(Math.cos(a) * s * 0.74, Math.sin(a) * s * 0.74);
      c.stroke();
    }
  }
  c.restore();
}

function art(scene) {
  canvasTex(scene, 'pr-drum', 240, 176, (c) => {
    const sh = c.createRadialGradient(120, 162, 8, 120, 162, 100);
    sh.addColorStop(0, 'rgba(0,0,0,0.5)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sh;
    c.beginPath(); c.ellipse(120, 161, 102, 17, 0, 0, Math.PI * 2); c.fill();

    const body = c.createLinearGradient(24, 40, 216, 172);
    body.addColorStop(0, '#57392c');
    body.addColorStop(0.42, '#3b251d');
    body.addColorStop(0.74, '#2a1a16');
    body.addColorStop(1, '#190f0d');
    c.fillStyle = body;
    c.beginPath();
    c.moveTo(26, 54);
    c.bezierCurveTo(22, 104, 30, 148, 48, 158);
    c.lineTo(192, 158);
    c.bezierCurveTo(210, 148, 218, 104, 214, 54);
    c.closePath(); c.fill();

    c.strokeStyle = 'rgba(12,6,4,0.28)'; c.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 20;
      c.beginPath(); c.moveTo(x, 60); c.bezierCurveTo(x - 3, 96, x - 3, 128, x + 2, 152); c.stroke();
    }
    c.strokeStyle = 'rgba(255,196,140,0.10)'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(52, 64); c.bezierCurveTo(47, 100, 54, 130, 66, 150); c.stroke();

    c.strokeStyle = '#1b1110'; c.lineWidth = 10;
    c.beginPath(); c.moveTo(27, 84); c.quadraticCurveTo(120, 100, 213, 84); c.stroke();
    c.beginPath(); c.moveTo(33, 136); c.quadraticCurveTo(120, 150, 207, 136); c.stroke();
    c.strokeStyle = 'rgba(255,170,110,0.14)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(30, 80); c.quadraticCurveTo(120, 96, 210, 80); c.stroke();
    c.beginPath(); c.moveTo(36, 132); c.quadraticCurveTo(120, 146, 204, 132); c.stroke();

    c.strokeStyle = 'rgba(214,170,116,0.5)'; c.lineWidth = 3;
    for (let i = 0; i < 2; i++) {
      const y0 = 94 + i * 18;
      c.beginPath(); c.moveTo(31, y0); c.quadraticCurveTo(120, y0 + 14, 209, y0 - 5); c.stroke();
      c.beginPath(); c.moveTo(31, y0 + 5); c.quadraticCurveTo(120, y0 - 10, 209, y0 + 19); c.stroke();
    }

    c.fillStyle = '#5d3a29';
    c.beginPath(); c.ellipse(120, 54, 108, 36, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(20,10,8,0.6)'; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(255,190,130,0.34)'; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(120, 52, 105, 33, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const x = 120 + Math.cos(a) * 101, y = 54 + Math.sin(a) * 31;
      c.fillStyle = '#2a1a16'; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,200,150,0.4)'; c.beginPath(); c.arc(x - 0.7, y - 0.7, 1.2, 0, Math.PI * 2); c.fill();
    }

    const skin = c.createRadialGradient(110, 44, 6, 120, 54, 94);
    skin.addColorStop(0, '#f7e7c9');
    skin.addColorStop(0.55, '#e3c89d');
    skin.addColorStop(1, '#b8936a');
    c.fillStyle = skin;
    c.beginPath(); c.ellipse(120, 53, 96, 30, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(120,84,52,0.2)'; c.lineWidth = 1.4;
    for (let i = 1; i <= 3; i++) {
      c.beginPath(); c.ellipse(120, 53, 20 + i * 20, 6 + i * 6.2, 0, 0, Math.PI * 2); c.stroke();
    }
    c.strokeStyle = 'rgba(90,62,38,0.28)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(82, 59); c.quadraticCurveTo(104, 50, 128, 55); c.stroke();
    c.beginPath(); c.moveTo(142, 62); c.quadraticCurveTo(158, 56, 174, 58); c.stroke();
    c.strokeStyle = 'rgba(60,34,20,0.5)'; c.lineWidth = 5;
    c.beginPath(); c.ellipse(120, 53, 94, 28, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,180,120,0.16)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(46, 152); c.quadraticCurveTo(120, 166, 194, 152); c.stroke();
    grain(c, 240, 176, 0.04, 71);
  });

  for (let i = 0; i < 4; i++) {
    canvasTex(scene, 'pr-glyph-' + i, 110, 56, (c) => {
      drawGlyph(c, i, 55, 28, 23, 'rgba(46,24,12,0.7)');
      drawGlyph(c, i, 55, 28, 21, CSS[i]);
    });
    canvasTex(scene, 'pr-note-' + i, 92, 92, (c) => {
      const cx = 46, cy = 46;
      const halo = c.createRadialGradient(cx, cy, 3, cx, cy, 45);
      halo.addColorStop(0, `rgba(${RGB[i]},0.85)`);
      halo.addColorStop(0.42, `rgba(${RGB[i]},0.36)`);
      halo.addColorStop(0.78, `rgba(${RGB[i]},0.1)`);
      halo.addColorStop(1, `rgba(${RGB[i]},0)`);
      c.fillStyle = halo;
      c.beginPath(); c.arc(cx, cy, 45, 0, Math.PI * 2); c.fill();

      c.fillStyle = 'rgba(255,245,225,0.96)';
      c.beginPath(); c.arc(cx, cy, 16, 0, Math.PI * 2); c.fill();

      c.strokeStyle = CSS[i]; c.lineWidth = 3.5;
      c.beginPath(); c.arc(cx, cy, 25, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = 'rgba(255,250,236,0.6)'; c.lineWidth = 1.2;
      c.beginPath(); c.arc(cx, cy, 29.5, 0, Math.PI * 2); c.stroke();
      c.fillStyle = CSS[i];
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        c.save();
        c.translate(cx + Math.cos(a) * 25, cy + Math.sin(a) * 25);
        c.rotate(a);
        c.beginPath(); c.moveTo(-3.4, -2.6); c.lineTo(3.4, 0); c.lineTo(-3.4, 2.6); c.closePath(); c.fill();
        c.restore();
      }
      drawGlyph(c, i, cx, cy, 10.5, 'rgba(64,32,18,0.92)');
    });
  }

  canvasTex(scene, 'pr-beam', 240, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.04)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.2)');
    g.addColorStop(0.96, 'rgba(255,255,255,0.46)');
    g.addColorStop(1, 'rgba(255,255,255,0.1)');
    c.fillStyle = g;
    c.fillRect(0, 0, 240, 512);
    const core = c.createLinearGradient(0, 300, 0, 512);
    core.addColorStop(0, 'rgba(255,255,255,0)');
    core.addColorStop(1, 'rgba(255,255,255,0.28)');
    c.fillStyle = core;
    c.fillRect(98, 300, 44, 212);
    c.globalCompositeOperation = 'destination-in';
    const mask = c.createLinearGradient(0, 0, 240, 0);
    mask.addColorStop(0, 'rgba(0,0,0,0)');
    mask.addColorStop(0.24, 'rgba(0,0,0,1)');
    mask.addColorStop(0.76, 'rgba(0,0,0,1)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = mask;
    c.fillRect(0, 0, 240, 512);
    c.globalCompositeOperation = 'source-over';
  });

  canvasTex(scene, 'pr-brazier', 96, 200, (c) => {
    const glow = c.createRadialGradient(48, 60, 4, 48, 60, 54);
    glow.addColorStop(0, 'rgba(255,180,100,0.55)');
    glow.addColorStop(0.5, 'rgba(255,120,60,0.18)');
    glow.addColorStop(1, 'rgba(255,110,50,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, 96, 130);

    const col = c.createLinearGradient(0, 80, 0, 200);
    col.addColorStop(0, '#4c3a38');
    col.addColorStop(0.5, '#332526');
    col.addColorStop(1, '#1a1214');
    c.fillStyle = col;
    c.beginPath(); c.moveTo(30, 200); c.lineTo(23, 84); c.lineTo(73, 84); c.lineTo(66, 200); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,180,120,0.1)';
    c.fillRect(28, 92, 4, 108);
    c.fillStyle = '#241719';
    c.fillRect(22, 116, 52, 7);
    c.fillRect(25, 160, 46, 6);

    c.fillStyle = '#3b2a29';
    c.beginPath(); c.ellipse(48, 80, 34, 15, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#160e10';
    c.beginPath(); c.ellipse(48, 76, 27, 10, 0, 0, Math.PI * 2); c.fill();
    const em = c.createRadialGradient(48, 74, 2, 48, 74, 24);
    em.addColorStop(0, 'rgba(255,236,170,0.95)');
    em.addColorStop(0.45, 'rgba(255,150,70,0.7)');
    em.addColorStop(1, 'rgba(180,60,30,0)');
    c.fillStyle = em;
    c.beginPath(); c.ellipse(48, 73, 24, 10, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,190,130,0.3)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(48, 78, 33, 14, 0, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    grain(c, 96, 200, 0.03, 101);
  });
}

/* ---------------------------------------------------------------- groove */
function startGroove(scene) {
  try { scene.audio.stopMusic(); } catch { /* no audio context */ }
  const a = scene.audio;
  if (!a.ctx) return null;
  return { step: 0, next: a.ctx.currentTime + 0.08 };
}

function pumpGroove(scene, groove, done) {
  const a = scene.audio;
  if (!groove || done || !a.ctx) return;
  if (groove.next < a.ctx.currentTime - 0.3) {
    groove.next = a.ctx.currentTime + 0.06;
    groove.step = 0;
  }
  while (groove.next < a.ctx.currentTime + 0.5) {
    grooveStep(a, groove.step, groove.next);
    groove.step++;
    groove.next += EIGHTH;
  }
}

function grooveStep(a, step, t) {
  const pos = step % 8;
  const bar = Math.floor(step / 8) % 4;
  if (pos === 0) a.thump(NOTE(31), t, 0.15, 0.34);
  if (pos === 3) a.thump(NOTE(35), t, 0.06, 0.16);
  if (pos === 5) a.thump(NOTE(43), t, 0.06, 0.14);
  if (pos % 2 === 1) a.pluck(NOTE(72), t, 0.01, 0.07);
  if (pos === 0 || pos === 4) a.pluck(NOTE(38 + [0, 3, 5, 7][bar]), t, 0.045, 0.42);
  if (pos === 6 && bar === 3) a.thump(NOTE(45 + pos), t, 0.05, 0.12);
  if (step % 32 === 0) a.bell(NOTE(74), t, 0.018);
}

/* ---------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M;
  const portrait = M.portrait;
  const DW = portrait ? 0.9 : 0.96;
  const DH = portrait ? 1.24 : 1;
  const NS = portrait ? 1.14 : 1;
  const ringPx = M.Y(RING_Y);
  const beamH = ringPx - M.Y(-80);

  art(scene);

  const chart = buildChart();
  const state = {
    t: 0, hits: 0, perfect: 0, good: 0, misses: 0, stray: 0,
    combo: 0, best: 0, hearts: 3, over: false, auto: false,
    next: 0, active: [], finale: false
  };
  let groove = startGroove(scene);
  let grooveDone = false;
  let lastCount = '';
  let lastCombo = 0;
  let comboPulse = 0;

  // stone inlay on the floor
  const floor = scene.add.graphics().setDepth(7);
  floor.lineStyle(3, 0xffcf6a, 0.16);
  floor.strokeEllipse(480, M.Y(474), 830, 124);
  floor.lineStyle(1.5, 0xffcf6a, 0.09);
  floor.strokeEllipse(480, M.Y(474), 700, 98);
  floor.lineStyle(1.5, 0xffcf6a, 0.07);
  for (let i = 0; i < 4; i++) {
    floor.beginPath();
    floor.arc(480, M.Y(474), 176 + i * 88, Math.PI * 0.12, Math.PI * 0.88);
    floor.strokePath();
  }

  // light columns behind the drums
  const beams = LANES.map((x, i) => scene.add.image(x, M.Y(-80), 'pr-beam')
    .setOrigin(0.5, 0).setDepth(4).setDisplaySize(238, beamH)
    .setTint(COLORS[i]).setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD));

  // braziers at the edge of the clearing
  const torchGlow = [];
  const brazierScale = portrait ? 0.98 : 0.86;
  [16, 944].forEach((x) => {
    const b = scene.add.image(x, M.Y(470), 'pr-brazier').setOrigin(0.5, 1).setDepth(15).setScale(brazierScale);
    const g = scene.add.image(x, M.Y(470) - 122 * brazierScale, 'arc-glow').setDepth(15.2).setScale(0.72)
      .setTint(0xff8a3c).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
    g._ph = torchGlow.length * 2.4;
    torchGlow.push(g);
    scene.tweens.add({ targets: b, scaleY: b.scaleY * 1.01, duration: 2000, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  });

  // drums
  const lanes = LANES.map((x, i) => {
    const drum = scene.add.image(x, ringPx, 'pr-drum').setOrigin(0.5, 52 / 176).setDepth(16).setScale(DW, DH);
    const glyph = scene.add.image(x, ringPx - 1, 'pr-glyph-' + i).setDepth(17).setScale(DW * 0.82, DH * 0.82).setAlpha(0.94);
    const ring = scene.add.image(x, ringPx, 'arc-ring').setDepth(18)
      .setTint(COLORS[i]).setBlendMode(Phaser.BlendModes.ADD)
      .setScale((94 / 40) * DW, (30 / 40) * DH).setAlpha(0.22);
    const pool = scene.add.image(x, M.Y(512), 'arc-glow').setDepth(8).setTint(COLORS[i])
      .setScale(1.5, 0.36).setAlpha(0.12).setBlendMode(Phaser.BlendModes.ADD);
    return { drum, glyph, ring, pool, flash: 0, dim: 0 };
  });

  // rising embers
  scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 40, max: W - 40 },
    y: M.Y(RING_Y + 70),
    speedY: { min: -48, max: -16 },
    speedX: { min: -14, max: 14 },
    lifespan: { min: 2400, max: 4200 },
    scale: { start: 0.17, end: 0 },
    alpha: { start: 0.5, end: 0 },
    tint: [0xffb066, 0xff8a4a, 0xffd9a0],
    frequency: 150,
    quantity: 1
  }).setDepth(11).setBlendMode(Phaser.BlendModes.ADD);

  const comboText = scene.add.text(480, M.Y(146), '', {
    fontFamily: SERIF, fontSize: '58px', fontStyle: 'bold',
    color: '#ffe6b8', stroke: '#180d13', strokeThickness: 8
  }).setOrigin(0.5).setDepth(30).setAlpha(0);

  const comboLabel = scene.add.text(480, M.Y(192), '', {
    fontFamily: SERIF, fontSize: '19px', fontStyle: 'italic',
    color: '#ffb98a', stroke: '#180d13', strokeThickness: 4
  }).setOrigin(0.5).setDepth(30).setAlpha(0);

  const countText = scene.add.text(480, M.Y(232), '', {
    fontFamily: SERIF, fontSize: '40px', fontStyle: 'italic',
    color: '#ffd9a8', stroke: '#180d13', strokeThickness: 6
  }).setOrigin(0.5).setDepth(31);

  function judge(x, y, text, color) {
    const label = scene.add.text(x, y, text, {
      fontFamily: SERIF, fontSize: '22px', fontStyle: 'bold',
      color, stroke: '#180d13', strokeThickness: 5
    }).setOrigin(0.5).setDepth(32);
    scene.tweens.add({
      targets: label, y: y - 30, alpha: 0, duration: 460, ease: 'cubic.out',
      onComplete: () => label.destroy()
    });
  }

  function notePulse(lane) {
    const L = lanes[lane];
    L.flash = 1;
    const sh = scene.add.image(LANES[lane], ringPx, 'arc-ring').setDepth(23)
      .setTint(COLORS[lane]).setBlendMode(Phaser.BlendModes.ADD)
      .setScale((94 / 40) * DW, (30 / 40) * DH).setAlpha(0.85);
    scene.tweens.add({
      targets: sh, scaleX: sh.scaleX * 1.55, scaleY: sh.scaleY * 1.55, alpha: 0,
      duration: 420, ease: 'cubic.out', onComplete: () => sh.destroy()
    });
  }

  function tap(lane) {
    if (state.over) return null;
    lane = clamp(Math.floor(lane), 0, 3);
    let best = null, bestDt = Infinity;
    for (const a of state.active) {
      if (a.done || a.n.lane !== lane) continue;
      const dt = Math.abs(a.n.t - state.t);
      if (dt < bestDt) { bestDt = dt; best = a; }
    }
    if (best && bestDt <= GOOD) { resolveHit(best, bestDt); return true; }
    stray(lane);
    return false;
  }

  function resolveHit(a, dt) {
    if (a.done || state.over) return;
    a.done = true;
    const i = state.active.indexOf(a);
    if (i >= 0) state.active.splice(i, 1);
    const perfect = dt <= PERFECT;
    state.hits++;
    state.combo++;
    if (perfect) state.perfect++; else state.good++;
    if (state.combo > state.best) state.best = state.combo;
    const lane = a.n.lane;

    scene.sfx('drum' + (lane + 1));
    const audio = scene.audio;
    if (audio.ctx) {
      const pitch = [62, 65, 69, 74][lane] + (perfect ? 12 : 0);
      audio.pluck(NOTE(pitch), audio.ctx.currentTime, perfect ? 0.055 : 0.04, 0.55);
    }

    notePulse(lane);
    lanes[lane].pool.setAlpha(0.2);
    scene.burst(LANES[lane], ringPx - 4, COLORS[lane], perfect ? 15 : 9,
      { life: 460, texture: 'arc-spark', spin: true, gravity: perfect ? 150 : 60, depth: 24 });
    scene.burst(LANES[lane], ringPx - 2, 0xfff3d8, perfect ? 6 : 3,
      { life: 340, depth: 24 });

    if (perfect) judge(LANES[lane], ringPx - 96, 'flawless', '#ffe6a8');
    else judge(LANES[lane], ringPx - 96, 'good', '#cfd8c0');

    if (a.img) {
      const img = a.img;
      scene.tweens.add({
        targets: img, y: img.y - 34, scale: NS * 1.5, alpha: 0, angle: 28,
        duration: 220, ease: 'cubic.out', onComplete: () => img.destroy()
      });
    }

    if (state.combo % 20 === 0) {
      if (state.hearts < 3) {
        state.hearts++;
        scene.notice('The chorus swells — another drumbeat returns.', 1600);
      } else {
        scene.notice(`${state.combo} in a row. The herd is with you.`, 1600);
      }
      scene.sfx('chime');
      scene.cameras.main.flash(150, 80, 36, 8);
      scene.popText(480, M.Y(300), 'the chorus swells', '#ffd8a0');
    }
  }

  function stray(lane) {
    const had = state.combo;
    state.stray++;
    state.combo = 0;
    scene.sfx('land');
    scene.burst(LANES[lane], ringPx + 12, 0x8a6a52, 4, { life: 300, gravity: 120, depth: 22 });
    if (had >= 5) judge(LANES[lane], ringPx - 70, 'stray', '#b9a08e');
  }

  function missNote(a) {
    if (a.done || state.over) return;
    a.done = true;
    const i = state.active.indexOf(a);
    if (i >= 0) state.active.splice(i, 1);
    state.misses++;
    state.combo = 0;
    state.hearts--;
    lanes[a.n.lane].dim = 1;
    scene.sfx('bad');
    scene.shake(200, 0.008);
    scene.cameras.main.flash(160, 120, 26, 18);
    judge(LANES[a.n.lane], ringPx + 46, 'missed', '#ff9d7a');
    if (a.img) {
      const img = a.img;
      scene.tweens.add({
        targets: img, y: img.y + 60, alpha: 0, angle: -18, duration: 360,
        ease: 'cubic.in', onComplete: () => img.destroy()
      });
    }
    if (state.hearts <= 0) endRun(false);
    else if (state.hearts === 1) scene.notice('One drumbeat left. Breathe, and keep time.', 1700);
  }

  function spawnNote(n) {
    const img = scene.add.image(LANES[n.lane], M.Y(-80), 'pr-note-' + n.lane)
      .setDepth(20).setScale(NS * 0.9).setAlpha(0);
    scene.tweens.add({ targets: img, alpha: 1, duration: 180 });
    state.active.push({ n, img, done: false });
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    grooveDone = true;
    comboText.setAlpha(0);
    comboLabel.setAlpha(0);
    countText.setVisible(false);
    scene.finish(win, {
      score: state.hits,
      note: win
        ? `${state.perfect} flawless · best chain ${state.best}`
        : `${state.hits} beats before the drums went quiet`
    });
  }

  function advance(dt) {
    state.t += dt;
    const t = state.t;

    while (state.next < chart.notes.length && chart.notes[state.next].t <= t + APPROACH) {
      spawnNote(chart.notes[state.next]);
      state.next++;
    }

    for (let i = state.active.length - 1; i >= 0; i--) {
      const a = state.active[i];
      if (a.done) { state.active.splice(i, 1); continue; }
      if (state.auto && t >= a.n.t - 0.01) { resolveHit(a, 0.001); continue; }
      if (t > a.n.t + GOOD) missNote(a);
    }

    if (!state.finale && t >= LEAD + 26 * 4 * BEAT) {
      state.finale = true;
      scene.notice('The last two bars. Drum the world awake.', 1900);
      scene.sfx('chime');
    }

    if (!state.over && t >= chart.end + 1.2) endRun(true);

    scene.hud({
      score: state.hits,
      progress: clamp((t - LEAD) / (chart.end - LEAD), 0, 1),
      hearts: state.hearts,
      extra: state.combo >= 4 ? `${state.combo} in a row` : t < LEAD ? 'the herd is listening' : ''
    });
  }

  function paint(time, dt) {
    const beatPulse = 1 - ((state.t % BEAT) + BEAT) % BEAT / BEAT;

    lanes.forEach((L, i) => {
      L.flash = Math.max(0, L.flash - dt * 3.4);
      L.dim = Math.max(0, L.dim - dt * 1.8);
      L.drum.setScale(DW * (1 + 0.022 * L.flash), DH * (1 + 0.012 * beatPulse - 0.06 * L.flash));
      L.drum.setAlpha(1 - L.dim * 0.3);
      L.glyph.setAlpha(0.95 - L.dim * 0.5);
      L.ring.setAlpha(0.13 + 0.2 * beatPulse + 0.55 * L.flash - L.dim * 0.1);
      L.ring.setScale(
        (94 / 40) * DW * (1 + 0.02 * beatPulse + 0.16 * L.flash),
        (30 / 40) * DH * (1 + 0.02 * beatPulse + 0.16 * L.flash)
      );
      L.pool.setAlpha(0.1 + 0.05 * beatPulse + 0.18 * L.flash);
      beams[i].setAlpha(0.11 + 0.03 * beatPulse + 0.004 * Math.min(30, state.combo) + 0.3 * L.flash);
    });

    for (const a of state.active) {
      if (!a.img || a.done) continue;
      const dtNote = a.n.t - state.t;
      const stageY = RING_Y - dtNote * SPEED;
      a.img.y = M.Y(stageY);
      a.img.x = LANES[a.n.lane];
      const near = clamp(1 - Math.abs(dtNote) / APPROACH, 0, 1);
      a.img.setScale(NS * (0.88 + near * 0.24 + (dtNote < 0 ? 0.08 : 0)));
      a.img.setAngle(Math.sin(time / 340 + a.n.lane) * 4);
    }

    torchGlow.forEach((g) => {
      g.setAlpha(0.45 + Math.sin(time / 120 + g._ph) * 0.08 + Math.sin(time / 47 + g._ph * 2) * 0.04);
      g.setScale(0.7 + Math.sin(time / 190 + g._ph) * 0.03);
    });

    if (state.t < LEAD) {
      const remaining = Math.ceil((LEAD - state.t) / BEAT);
      const label = remaining > 4 ? 'the herd gathers' : String(Math.max(1, remaining));
      if (label !== lastCount) {
        lastCount = label;
        countText.setText(label);
        countText.setVisible(true);
        countText.setScale(1.22);
        scene.tweens.add({ targets: countText, scale: 1, duration: 240, ease: 'cubic.out' });
      }
      countText.setAlpha(0.4 + 0.5 * beatPulse);
    } else if (countText.visible) {
      countText.setVisible(false);
      scene.popText(480, M.Y(300), 'drum!', '#ffd7a0');
    }

    if (state.combo !== lastCombo) {
      if (state.combo >= 4) {
        comboText.setText(String(state.combo));
        comboPulse = 1;
      }
      lastCombo = state.combo;
    }
    comboPulse = Math.max(0, comboPulse - dt * 4);
    comboText.setScale(1 + comboPulse * 0.2);
    if (state.combo >= 4) {
      comboText.setAlpha(Math.min(0.95, comboText.alpha + dt * 8));
      comboLabel.setAlpha(Math.min(0.72, comboLabel.alpha + dt * 8));
    } else {
      comboText.setAlpha(Math.max(0, comboText.alpha - dt * 3));
      comboLabel.setAlpha(Math.max(0, comboLabel.alpha - dt * 3));
    }
    comboLabel.setText('in a row');
  }

  /* ---------------------------------------------------------------- input */
  scene.input.addPointer(2);
  scene.input.on('pointerdown', (pointer) => {
    if (pointer.y < scene.M.top && scene.M.portrait) return;
    tap(pointer.x / 240);
  });
  ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((key, i) => {
    scene.input.keyboard.on('keydown-' + key, () => tap(i));
  });

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'the herd is listening' });
  scene.notice('Feel the drum. Strike each rune as it crosses its ring.', 2800);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) { grooveDone = true; return; }
    if (scene.audio.musicOn) scene.audio.stopMusic();
    advance(dt);
    pumpGroove(scene, groove, grooveDone);
    paint(time, dt);
  }

  function dropActive() {
    state.active.forEach((a) => { if (a.img) a.img.destroy(); });
    state.active = [];
  }

  return {
    update,
    state: () => ({
      t: Number(state.t.toFixed(2)), score: state.hits, hits: state.hits,
      perfect: state.perfect, good: state.good, misses: state.misses, stray: state.stray,
      combo: state.combo, best: state.best, hearts: state.hearts, over: state.over,
      active: state.active.length, chart: chart.notes.length, spawned: state.next,
      finale: state.finale, phase: state.t < LEAD ? 'count-in' : 'song'
    }),
    next: () => {
      const live = state.active.filter((a) => !a.done).sort((a, b) => a.n.t - b.n.t)[0];
      if (live) return { lane: live.n.lane, t: Number(live.n.t.toFixed(2)), dt: Number((live.n.t - state.t).toFixed(3)) };
      const n = chart.notes[state.next];
      return n ? { lane: n.lane, t: Number(n.t.toFixed(2)), dt: Number((n.t - state.t).toFixed(3)) } : null;
    },
    tap,
    hitNext: () => {
      const live = state.active.filter((a) => !a.done).sort((a, b) => a.n.t - b.n.t)[0];
      if (live) resolveHit(live, 0.001);
      return Boolean(live);
    },
    missNext: () => {
      const live = state.active.filter((a) => !a.done).sort((a, b) => a.n.t - b.n.t)[0];
      if (live) missNote(live);
      return Boolean(live);
    },
    setHearts: (v) => { state.hearts = clamp(Math.round(v), 1, 3); },
    auto: (on) => { state.auto = Boolean(on); },
    wind: (sec) => {
      const target = Math.min(chart.end + 2, state.t + sec);
      for (const a of state.active) {
        if (a.done) continue;
        state.hits++;
        state.perfect++;
        state.combo++;
        if (state.combo > state.best) state.best = state.combo;
        if (state.combo % 20 === 0 && state.hearts < 3) state.hearts++;
      }
      while (state.next < chart.notes.length && chart.notes[state.next].t <= target) {
        state.next++;
        state.hits++;
        state.perfect++;
        state.combo++;
        if (state.combo > state.best) state.best = state.combo;
        if (state.combo % 20 === 0 && state.hearts < 3) state.hearts++;
      }
      dropActive();
      state.t = target;
      return state.t;
    }
  };
}

export default {
  id: 'primal-rhythm', stars: STAR, mood: 'dusk', unit: 'beats',
  create, update: (scene, t, d) => scene.gameObj.update(t, d)
};
