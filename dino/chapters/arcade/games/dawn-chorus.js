// Dawn Chorus — four bars are already running before you arrive.
// The herd hums in four, the raptor's tail answers in three, the wide cry opens
// in six and the wind bends in four. Tap a creature as its ring closes and its
// voice stays in the air for good; come in late and the whole valley flinches.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-276e018775e133bb';

const STAR = [10, 18, 27];
const SERIF = "'Iowan Old Style','Palatino Linotype',Georgia,serif";
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const MUS = MOODS.dawn.music;
const BPM0 = 76;
const CLEAN = 0.3;
const PERFECT = 0.12;
const TARGET = 4;
const TAU = Math.PI * 2;

const SPEC = [
  {
    id: 'herd', label: 'the herd', timbre: 'drone', len: 4, pat: [0, 2], ring: 1.5,
    x: 152, y: 474, scale: 0.84, band: [0, 288], hoop: { x: 152, y: 320, r: 72 },
    color: 0xffb56b, css: '#ffb56b', rgb: '255,181,107'
  },
  {
    id: 'raptor', label: 'the raptor', timbre: 'thump', len: 3, pat: [0, 1], ring: 0.6,
    x: 420, y: 464, scale: 0.78, band: [288, 548], hoop: { x: 436, y: 312, r: 70 },
    color: 0xf2875c, css: '#f2875c', rgb: '242,135,92'
  },
  {
    id: 'cry', label: 'the wide cry', timbre: 'bell', len: 6, pat: [0, 3], ring: 1.7,
    x: 700, y: 246, scale: 0.8, band: [548, 808], hoop: { x: 700, y: 120, r: 66 },
    color: 0xffe2a2, css: '#ffe2a2', rgb: '255,226,162'
  },
  {
    id: 'wind', label: 'the wind', timbre: 'whir', len: 4, pat: [0, 2], ring: 0.85,
    x: 880, y: 504, scale: 0.86, band: [808, W], hoop: { x: 872, y: 300, r: 68 },
    color: 0xa9dcc6, css: '#a9dcc6', rgb: '169,220,198'
  }
];

const CHANGES = [{ i: 2, to: 4 }, { i: 3, to: 2 }, { i: 1, to: 4 }, { i: 2, to: 6 }, { i: 3, to: 6 }];

const BANK_LINES = [
  'three voices hold — the sky lets go of the dark',
  'the light comes up through the noise of them',
  'they found each other without you watching',
  'the valley answers in a key you did not choose'
];
const BARK_LINES = [
  'something with teeth answers from the treeline',
  'a bark rolls down the ridge and a voice forgets itself',
  'the predator tests the dark — the chorus stumbles'
];
const MISS_LINES = [
  'that one came in early and the whole air flinched',
  'the note landed on top of another note',
  'too soon — the herd stops to look at you'
];

const mod = (a, n) => ((a % n) + n) % n;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => Math.abs(a * b) / (gcd(a, b) || 1);
const r2 = (v) => Math.round(v * 100) / 100;
const seedsRate = (em, f) => { if (em && typeof em.setFrequency === 'function') em.setFrequency(f); };

/* ------------------------------------------------------------------- art */
function hoopTex(scene, len) {
  const key = 'dc-hoop-' + len;
  canvasTex(scene, key, 176, 176, (c) => {
    c.translate(88, 88);
    c.strokeStyle = 'rgba(255,240,214,0.26)';
    c.lineWidth = 2.4;
    c.beginPath(); c.arc(0, 0, 74, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,240,214,0.1)';
    c.lineWidth = 1.4;
    c.beginPath(); c.arc(0, 0, 56, 0, TAU); c.stroke();
    for (let i = 0; i < len; i++) {
      const a = -Math.PI / 2 + (i / len) * TAU;
      const top = i === 0;
      c.strokeStyle = top ? 'rgba(255,214,140,0.95)' : 'rgba(255,240,214,0.34)';
      c.lineWidth = top ? 5 : 2.4;
      c.beginPath();
      c.moveTo(Math.cos(a) * (top ? 62 : 67), Math.sin(a) * (top ? 62 : 67));
      c.lineTo(Math.cos(a) * 82, Math.sin(a) * 82);
      c.stroke();
    }
    c.setLineDash([2, 7]);
    c.strokeStyle = 'rgba(255,240,214,0.2)';
    c.lineWidth = 1.6;
    c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.stroke();
    c.setLineDash([]);
  });
  return key;
}

function art(scene) {
  canvasTex(scene, 'dc-wave', 160, 160, (c) => {
    c.translate(80, 80);
    for (let i = 0; i < 3; i++) {
      const r = 44 + i * 14;
      c.strokeStyle = `rgba(255,255,255,${0.5 - i * 0.15})`;
      c.lineWidth = 6 - i * 1.6;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    }
    c.globalCompositeOperation = 'destination-in';
    const m = c.createRadialGradient(0, 0, 30, 0, 0, 80);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(0.75, 'rgba(0,0,0,0.75)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = m; c.fillRect(-80, -80, 160, 160);
    c.globalCompositeOperation = 'source-over';
  });

  canvasTex(scene, 'dc-herd', 250, 196, (c) => {
    const sh = c.createRadialGradient(125, 186, 6, 125, 186, 108);
    sh.addColorStop(0, 'rgba(0,0,0,0.5)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sh;
    c.beginPath(); c.ellipse(125, 184, 100, 15, 0, 0, TAU); c.fill();

    c.fillStyle = '#22352f';
    [[58, 116], [92, 124], [158, 124], [192, 116]].forEach(([x, y], i) => {
      c.beginPath();
      c.moveTo(x - 13, y); c.quadraticCurveTo(x - 16, 176, x - 11, 184);
      c.lineTo(x + 12, 184); c.quadraticCurveTo(x + 15, 152, x + 13, y);
      c.closePath(); c.fill();
      c.fillStyle = i % 2 ? '#1b2c27' : '#22352f';
    });

    const body = c.createLinearGradient(40, 44, 200, 170);
    body.addColorStop(0, '#8a9270');
    body.addColorStop(0.42, '#5c7059');
    body.addColorStop(0.78, '#334a42');
    body.addColorStop(1, '#1f332f');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(128, 106, 92, 58, -0.04, 0, TAU); c.fill();

    c.fillStyle = 'rgba(196,206,168,0.22)';
    c.beginPath(); c.ellipse(150, 78, 60, 20, -0.1, 0, TAU); c.fill();

    c.fillStyle = '#2b4038';
    for (let i = 0; i < 8; i++) {
      const x = 58 + i * 20;
      const h = 9 + Math.sin(i * 1.3) * 5;
      c.beginPath();
      c.moveTo(x - 8, 58 + Math.abs(x - 128) * 0.09);
      c.lineTo(x, 46 - h);
      c.lineTo(x + 9, 58 + Math.abs(x - 128) * 0.09);
      c.closePath(); c.fill();
    }

    // chest — the part that rises
    const chest = c.createRadialGradient(110, 140, 4, 116, 146, 62);
    chest.addColorStop(0, '#c9c8a0');
    chest.addColorStop(0.6, '#8f9a78');
    chest.addColorStop(1, 'rgba(70,90,80,0)');
    c.fillStyle = chest;
    c.beginPath(); c.ellipse(116, 144, 58, 30, 0.04, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(40,58,50,0.4)'; c.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      c.beginPath(); c.ellipse(116, 146, 20 + i * 12, 8 + i * 5.4, 0.04, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
    }

    // neck and head to the left
    c.strokeStyle = '#5d7059'; c.lineWidth = 30; c.lineCap = 'round';
    c.beginPath(); c.moveTo(62, 92); c.quadraticCurveTo(30, 84, 20, 58); c.stroke();
    c.fillStyle = '#77876a';
    c.beginPath(); c.ellipse(18, 50, 25, 16, -0.34, 0, TAU); c.fill();
    c.fillStyle = '#4d5f4b';
    c.beginPath(); c.ellipse(4, 52, 13, 9, -0.2, 0, TAU); c.fill();
    c.strokeStyle = '#3a4c40'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(20, 36); c.quadraticCurveTo(24, 22, 34, 18); c.stroke();
    c.fillStyle = '#ffe6b0';
    c.beginPath(); c.arc(22, 46, 3.4, 0, TAU); c.fill();
    c.fillStyle = '#16261f';
    c.beginPath(); c.arc(21, 46, 1.7, 0, TAU); c.fill();

    c.strokeStyle = 'rgba(255,196,132,0.4)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(48, 62); c.quadraticCurveTo(120, 34, 200, 76); c.stroke();
    grain(c, 250, 196, 0.035, 11);
  });

  canvasTex(scene, 'dc-raptor', 210, 190, (c) => {
    const sh = c.createRadialGradient(110, 178, 5, 110, 178, 82);
    sh.addColorStop(0, 'rgba(0,0,0,0.48)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sh;
    c.beginPath(); c.ellipse(110, 176, 74, 12, 0, 0, TAU); c.fill();

    c.strokeStyle = '#4a3226'; c.lineWidth = 13; c.lineCap = 'round';
    c.beginPath(); c.moveTo(112, 116); c.quadraticCurveTo(106, 146, 112, 166); c.stroke();
    c.beginPath(); c.moveTo(136, 114); c.quadraticCurveTo(146, 144, 140, 164); c.stroke();
    c.strokeStyle = '#38251c'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(112, 166); c.lineTo(92, 172); c.moveTo(112, 166); c.lineTo(126, 174); c.stroke();
    c.beginPath(); c.moveTo(140, 164); c.lineTo(122, 170); c.moveTo(140, 164); c.lineTo(154, 172); c.stroke();

    const body = c.createLinearGradient(60, 50, 176, 130);
    body.addColorStop(0, '#c08a5c');
    body.addColorStop(0.45, '#8e5f3e');
    body.addColorStop(1, '#4a3126');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(120, 96, 56, 40, -0.2, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,224,178,0.26)';
    c.beginPath(); c.ellipse(128, 116, 38, 15, -0.14, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(58,36,24,0.5)'; c.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(92 + i * 16, 74 + i * 2);
      c.quadraticCurveTo(100 + i * 16, 92, 92 + i * 16, 112);
      c.stroke();
    }

    c.strokeStyle = '#96663f'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(44, 96); c.quadraticCurveTo(30, 108, 36, 120); c.stroke();
    c.strokeStyle = '#5a3a26'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(36, 120); c.lineTo(28, 128); c.moveTo(36, 120); c.lineTo(42, 130); c.stroke();

    c.strokeStyle = '#a9764a'; c.lineWidth = 20; c.lineCap = 'round';
    c.beginPath(); c.moveTo(150, 74); c.quadraticCurveTo(176, 58, 178, 40); c.stroke();
    c.fillStyle = '#c69463';
    c.beginPath(); c.ellipse(182, 32, 24, 16, 0.28, 0, TAU); c.fill();
    c.fillStyle = '#e8d5a8';
    c.beginPath(); c.moveTo(196, 26); c.quadraticCurveTo(216, 30, 212, 38); c.quadraticCurveTo(202, 40, 194, 38); c.closePath(); c.fill();
    c.fillStyle = '#6d3f22';
    c.beginPath(); c.moveTo(176, 18); c.quadraticCurveTo(160, 6, 148, 12); c.quadraticCurveTo(162, 22, 172, 28); c.closePath(); c.fill();
    c.fillStyle = '#ffe9a8';
    c.beginPath(); c.arc(186, 28, 4.4, 0, TAU); c.fill();
    c.fillStyle = '#1b1008';
    c.beginPath(); c.arc(187, 28, 2.1, 0, TAU); c.fill();

    c.strokeStyle = 'rgba(255,190,120,0.34)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(74, 66); c.quadraticCurveTo(120, 48, 164, 62); c.stroke();
    // rump where the tail sprite takes over
    c.fillStyle = '#7d5334';
    c.beginPath(); c.ellipse(70, 96, 22, 20, 0, 0, TAU); c.fill();
    grain(c, 210, 190, 0.035, 23);
  });

  canvasTex(scene, 'dc-tail', 220, 90, (c) => {
    const g = c.createLinearGradient(8, 20, 214, 74);
    g.addColorStop(0, '#9a6a41');
    g.addColorStop(0.55, '#6f4728');
    g.addColorStop(1, '#3b2417');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(8, 26);
    c.quadraticCurveTo(120, 18, 212, 40);
    c.quadraticCurveTo(150, 52, 8, 64);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(46,28,18,0.5)'; c.lineWidth = 2.4;
    for (let i = 0; i < 7; i++) {
      const x = 24 + i * 26;
      c.beginPath(); c.moveTo(x, 24 + i * 1.2); c.lineTo(x - 4, 62 - i * 1.6); c.stroke();
    }
    c.strokeStyle = 'rgba(255,206,150,0.3)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(12, 28); c.quadraticCurveTo(120, 20, 208, 40); c.stroke();
    c.fillStyle = 'rgba(60,38,24,0.75)';
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(170 + i * 8, 42);
      c.quadraticCurveTo(160 + i * 8, 58, 176 + i * 6, 68);
      c.quadraticCurveTo(184 + i * 6, 56, 182 + i * 8, 42);
      c.closePath(); c.fill();
    }
    grain(c, 220, 90, 0.03, 29);
  });

  ['rest', 'cry'].forEach((frame) => {
    const open = frame === 'cry';
    canvasTex(scene, 'dc-bird-' + frame, 200, 170, (c) => {
      const body = c.createLinearGradient(50, 40, 160, 130);
      body.addColorStop(0, '#e9dcc0');
      body.addColorStop(0.5, '#b7ae90');
      body.addColorStop(1, '#5f6656');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(108, 92, 46, 30, open ? -0.3 : -0.1, 0, TAU); c.fill();

      c.fillStyle = 'rgba(72,80,66,0.9)';
      c.beginPath();
      c.moveTo(96, 82);
      if (open) c.quadraticCurveTo(64, 40, 26, 34);
      else c.quadraticCurveTo(70, 66, 40, 96);
      c.quadraticCurveTo(76, 106, 100, 96);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,232,190,0.4)'; c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(96, 84);
      if (open) c.quadraticCurveTo(66, 46, 32, 40);
      else c.quadraticCurveTo(72, 68, 44, 94);
      c.stroke();

      c.fillStyle = '#6d7565';
      c.beginPath();
      c.moveTo(148, 96); c.quadraticCurveTo(188, 104, 196, 122);
      c.quadraticCurveTo(170, 118, 146, 110); c.closePath(); c.fill();

      const hx = open ? 138 : 142, hy = open ? 52 : 62;
      c.strokeStyle = '#c2b896'; c.lineWidth = 13; c.lineCap = 'round';
      c.beginPath(); c.moveTo(132, 82); c.quadraticCurveTo(hx - 4, hy + 14, hx, hy + 6); c.stroke();
      c.fillStyle = '#ece2c4';
      c.beginPath(); c.ellipse(hx + 4, hy, 17, 13, open ? -0.6 : -0.15, 0, TAU); c.fill();
      c.fillStyle = '#f6c470';
      c.beginPath();
      c.moveTo(hx + 16, hy - 4);
      if (open) c.quadraticCurveTo(hx + 42, hy - 18, hx + 36, hy - 6);
      else c.quadraticCurveTo(hx + 40, hy - 2, hx + 34, hy + 4);
      c.quadraticCurveTo(hx + 24, hy + 6, hx + 15, hy + 4);
      c.closePath(); c.fill();
      c.fillStyle = '#3a3222';
      c.beginPath(); c.arc(hx + 14, hy - 2, 4, 0, TAU); c.fill();
      c.fillStyle = '#fff6dd';
      c.beginPath(); c.arc(hx + 15, hy - 3, 1.6, 0, TAU); c.fill();
      c.fillStyle = '#c9743f';
      c.beginPath();
      c.moveTo(hx - 6, hy - 10); c.quadraticCurveTo(hx - 24, hy - 26, hx - 30, hy - 14);
      c.quadraticCurveTo(hx - 16, hy - 8, hx - 8, hy - 2); c.closePath(); c.fill();

      c.strokeStyle = '#7c8270'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(96, 118); c.lineTo(94, 134); c.moveTo(116, 118); c.lineTo(118, 134); c.stroke();
      grain(c, 200, 170, 0.03, 37);
    });
  });

  canvasTex(scene, 'dc-spire', 170, 300, (c) => {
    const g = c.createLinearGradient(50, 0, 130, 300);
    g.addColorStop(0, '#4b5b50');
    g.addColorStop(0.5, '#31413a');
    g.addColorStop(1, '#182621');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(62, 300); c.quadraticCurveTo(56, 190, 66, 120);
    c.quadraticCurveTo(72, 60, 84, 18);
    c.lineTo(104, 20); c.quadraticCurveTo(112, 82, 116, 148);
    c.quadraticCurveTo(122, 226, 116, 300);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(16,26,22,0.6)'; c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(66 + i * 8, 292); c.quadraticCurveTo(62 + i * 8, 180, 76 + i * 5, 40);
      c.stroke();
    }
    c.strokeStyle = '#2b3a33'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(88, 92); c.quadraticCurveTo(126, 76, 148, 44); c.stroke();
    c.beginPath(); c.moveTo(80, 150); c.quadraticCurveTo(44, 138, 22, 108); c.stroke();
    c.strokeStyle = 'rgba(255,196,132,0.28)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(84, 22); c.quadraticCurveTo(100, 90, 112, 200); c.stroke();
    grain(c, 170, 300, 0.04, 43);
  });

  canvasTex(scene, 'dc-stone', 160, 96, (c) => {
    const g = c.createLinearGradient(20, 10, 140, 90);
    g.addColorStop(0, '#7d8a80');
    g.addColorStop(1, '#33423c');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(12, 88); c.quadraticCurveTo(6, 46, 44, 28);
    c.quadraticCurveTo(96, 8, 142, 38); c.quadraticCurveTo(158, 66, 138, 88);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,228,180,0.4)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(80, 44, 40, 15, -0.06, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
    c.strokeStyle = 'rgba(255,244,214,0.3)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(80, 52, 26, 9, -0.04, 0, TAU); c.stroke();
    grain(c, 160, 96, 0.05, 47);
  });

  canvasTex(scene, 'dc-reed', 230, 250, (c) => {
    c.lineCap = 'round';
    const rand = rng('reeds');
    for (let i = 0; i < 11; i++) {
      const bx = 24 + i * 18 + rand() * 6;
      const h = 110 + rand() * 120;
      const lean = (i - 5) * 4 + rand() * 10;
      const g = c.createLinearGradient(bx, 250, bx + lean, 250 - h);
      g.addColorStop(0, '#22352c');
      g.addColorStop(0.55, '#4f6b45');
      g.addColorStop(1, '#c8b077');
      c.strokeStyle = g;
      c.lineWidth = 5.4 - i * 0.12;
      c.beginPath();
      c.moveTo(bx, 248);
      c.quadraticCurveTo(bx + lean * 0.4, 250 - h * 0.55, bx + lean, 250 - h);
      c.stroke();
      if (i % 2 === 0) {
        c.fillStyle = 'rgba(255,226,170,0.8)';
        c.beginPath(); c.ellipse(bx + lean, 250 - h - 5, 4.6, 10, lean * 0.01, 0, TAU); c.fill();
        for (let k = 0; k < 4; k++) {
          c.strokeStyle = 'rgba(255,236,190,0.5)'; c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(bx + lean, 250 - h - 4);
          c.lineTo(bx + lean + (k - 1.5) * 6, 250 - h - 18);
          c.stroke();
        }
      }
      c.strokeStyle = 'rgba(38,58,46,0.85)'; c.lineWidth = 3;
      c.beginPath();
      c.moveTo(bx, 246);
      c.quadraticCurveTo(bx - 16, 246 - h * 0.4, bx - 26, 246 - h * 0.6);
      c.stroke();
    }
    grain(c, 230, 250, 0.03, 53);
  });

  canvasTex(scene, 'dc-beam', 190, 540, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, 'rgba(255,240,206,0.5)');
    g.addColorStop(0.35, 'rgba(255,214,150,0.24)');
    g.addColorStop(0.78, 'rgba(255,190,120,0.07)');
    g.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = g; c.fillRect(0, 0, 190, 540);
    c.globalCompositeOperation = 'destination-in';
    const m = c.createLinearGradient(0, 0, 190, 0);
    m.addColorStop(0, 'rgba(0,0,0,0)');
    m.addColorStop(0.3, 'rgba(0,0,0,1)');
    m.addColorStop(0.7, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = m; c.fillRect(0, 0, 190, 540);
    c.globalCompositeOperation = 'source-over';
  });

  canvasTex(scene, 'dc-fore', 960, 150, (c) => {
    const rand = rng('dc-fore');
    const g = c.createLinearGradient(0, 40, 0, 150);
    g.addColorStop(0, 'rgba(11,26,24,0.6)');
    g.addColorStop(1, 'rgba(8,18,18,0.96)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 150);
    c.lineTo(0, 108);
    for (let x = 0; x <= 960; x += 26) c.lineTo(x, 96 + Math.sin(x * 0.03) * 10 + rand() * 12);
    c.lineTo(960, 150);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(7,16,16,0.9)';
    for (let i = 0; i < 130; i++) {
      const x = rand() * 960;
      const base = 116 + rand() * 34;
      const h = 26 + rand() * 62;
      c.lineWidth = 2 + rand() * 3;
      c.beginPath();
      c.moveTo(x, base);
      c.quadraticCurveTo(x + (rand() - 0.5) * 22, base - h * 0.6, x + (rand() - 0.5) * 40, base - h);
      c.stroke();
    }
    grain(c, 960, 150, 0.05, 61);
  });

  SPEC.forEach((v) => hoopTex(scene, v.len));
  hoopTex(scene, 2);
  hoopTex(scene, 6);
}

/* ---------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene);
  const r = rng('dawn-chorus');
  // the table is module level, so each run gets its own mutable copy
  const VOICES = SPEC.map((s) => Object.assign({}, s));

  const S = {
    beats: 0, bpm: BPM0, tempoLocked: false, drift: 0,
    voices: 0, hearts: 3, rounds: 0, roundPos: 0, roundBeats: 46,
    changeAt: 26, changeIdx: 0, nextBark: 0,
    warm: 0, dawn: 0, glow: 0, beatPulse: 0, over: false, won: false,
    log: [], alignHits: [], started: false, ripples: 0, frozen: false
  };

  VOICES.forEach((v, i) => {
    v.idx = i;
    v.layered = false;
    v.env = 0;
    v.pulse = 0;
    v.lock = 0;
    v.hits = 0;
    v.clean = 0;
    v.missed = 0;
    v.frame = 'rest';
  });

  /* ---------------------------------------------------------- world paint */
  const veil = scene.add.rectangle(W / 2, M.H / 2, W, M.H, 0xffb56b, 0)
    .setDepth(3).setBlendMode(Phaser.BlendModes.ADD);

  const horizon = scene.add.image(480, M.Y(424), 'arc-glow').setDepth(5)
    .setScale((M.portrait ? 3.4 : 2.9), M.portrait ? 1.1 : 0.72)
    .setTint(0xffb56b).setAlpha(0.1).setBlendMode(Phaser.BlendModes.ADD);

  const beams = [214, 480, 748].map((x, i) => scene.add.image(x, M.Y(0), 'dc-beam').setOrigin(0.5, 0)
    .setDepth(6).setAlpha(0).setTint(0xffe2b0).setBlendMode(Phaser.BlendModes.ADD)
    .setDisplaySize(190, M.Y(540) - M.Y(0)).setAngle((i - 1) * 5));

  const clockLine = scene.add.graphics().setDepth(12);

  const rScale = VOICES[1].scale * K;
  const tailPivot = { x: VOICES[1].x + 30 * rScale, y: M.Y(VOICES[1].y) - 62 * rScale };
  const stoneX = tailPivot.x + 186 * rScale;
  const stoneY = M.Y(500);
  const herdScale = VOICES[0].scale * K;

  scene.add.image(716, M.Y(478), 'dc-spire').setOrigin(0.5, 1).setDepth(8)
    .setScale(K * (M.portrait ? 0.8 : 0.82));
  scene.add.image(stoneX, stoneY, 'dc-stone').setOrigin(0.5, 1).setDepth(9)
    .setScale(K * 0.5).setAlpha(0.95);

  const herd = scene.add.image(VOICES[0].x, M.Y(VOICES[0].y), 'dc-herd').setOrigin(0.5, 0.94)
    .setDepth(14).setScale(herdScale);
  const herdGlow = scene.add.image(VOICES[0].x, M.Y(VOICES[0].y) - 30 * herdScale, 'arc-glow').setDepth(13)
    .setScale(1.25 * herdScale, 0.8 * herdScale).setTint(VOICES[0].color).setAlpha(0)
    .setBlendMode(Phaser.BlendModes.ADD);

  const raptor = scene.add.image(VOICES[1].x, M.Y(VOICES[1].y), 'dc-raptor').setOrigin(0.52, 0.92)
    .setDepth(15).setScale(-rScale, rScale);
  const tail = scene.add.image(tailPivot.x, tailPivot.y, 'dc-tail').setOrigin(0.05, 0.5)
    .setDepth(14).setScale(rScale, rScale);

  const bird = scene.add.image(VOICES[2].x, M.Y(VOICES[2].y), 'dc-bird-rest').setOrigin(0.5, 0.82)
    .setDepth(16).setScale(VOICES[2].scale * K);

  const reeds = [
    scene.add.image(VOICES[3].x - 48, M.Y(512), 'dc-reed').setOrigin(0.5, 1).setDepth(13)
      .setScale(0.54 * K).setAlpha(0.72),
    scene.add.image(VOICES[3].x + 6, M.Y(516), 'dc-reed').setOrigin(0.5, 1).setDepth(17)
      .setScale(VOICES[3].scale * K),
    scene.add.image(VOICES[3].x + 62, M.Y(508), 'dc-reed').setOrigin(0.5, 1).setDepth(12)
      .setScale(0.48 * K).setAlpha(0.66)
  ];

  // portrait leaves a strip of bare water under the world band: the same silhouette
  // keeps its top edge and stretches down to the foot of the canvas
  const foreH = M.portrait ? M.H - (M.Y(540) - 90) : 90;
  scene.add.image(480, M.portrait ? M.H : M.Y(540), 'dc-fore').setOrigin(0.5, 1).setDepth(46)
    .setScale(1, foreH / 150);

  const seeds = scene.add.particles(0, 0, 'arc-dot', {
    emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(700, M.Y(330), W - 730, M.Y(520) - M.Y(330)) },
    speedX: { min: -34, max: 26 }, speedY: { min: -58, max: -18 },
    lifespan: { min: 1800, max: 3600 }, scale: { start: 0.3, end: 0.05 },
    alpha: { start: 0.6, end: 0 }, tint: [0xffe6ad, 0xf6d9b5],
    frequency: 420, quantity: 1
  }).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);

  /* -------------------------------------------------------------- helpers */
  const phaseOf = (i) => mod(S.beats, VOICES[i].len);
  const toDown = (i) => {
    const v = VOICES[i];
    const p = mod(S.beats, v.len);
    if (p < 1e-7 || v.len - p < 1e-7) return 0;
    return v.len - p;
  };
  const living = () => VOICES.filter((v) => v.layered);
  const alignEvery = () => living().reduce((n, v) => lcm(n, v.len), 1);
  const toAlign = () => {
    const n = alignEvery();
    if (n < 2 || living().length < 2) return 0;
    return n - mod(S.beats, n);
  };

  function ripple(i, strength = 1) {
    const v = VOICES[i];
    if (S.ripples > 14) return;
    S.ripples++;
    const y = i === 2 ? v.y - 6 : v.y - 30;
    const im = scene.add.image(v.x, M.Y(y), 'dc-wave').setDepth(i === 2 ? 15 : 12)
      .setTint(v.color).setAlpha(0.55 * strength).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.5 * K * strength);
    scene.tweens.add({
      targets: im, scale: (1.9 + strength * 0.8) * K * (i === 2 ? 0.8 : 1), alpha: 0,
      duration: 700 + 260 * strength, ease: 'cubic.out',
      onComplete: () => { S.ripples--; im.destroy(); }
    });
  }

  function puff(x, y, color, n, opts) {
    scene.burst(x, y, color, n, Object.assign({ life: 460, gravity: 90, depth: 20 }, opts || {}));
  }

  function log(ev, i) {
    S.log.push({ e: ev, v: i, b: r2(S.beats) });
    if (S.log.length > 48) S.log.shift();
  }

  /* --------------------------------------------------------------- audio */
  function fireVoice(i, beat) {
    const v = VOICES[i];
    const pos = mod(beat, v.len);
    if (v.pat.indexOf(pos) < 0) return;
    const main = pos === 0;
    const a = scene.audio;
    const spb = 60 / S.bpm;
    const g = 0.7 + 0.6 * S.warm;
    if (a.ctx) {
      const t = a.ctx.currentTime;
      if (v.timbre === 'drone') {
        if (main) a.pad(NOTE(MUS.root - 12), t, clamp(v.len * spb * 1.05, 1, 3.4), 0.052 * g);
        else a.pad(NOTE(MUS.root - 5), t, clamp(v.len * spb * 0.5, 0.6, 1.8), 0.02 * g);
      } else if (v.timbre === 'thump') {
        if (main) {
          a.thump(NOTE(31), t, 0.19 * g, 0.3);
          a.burst({ dur: 0.12, freq: 260, q: 0.8, gain: 0.045, sweep: -140, type: 'lowpass' });
        } else a.thump(NOTE(38), t, 0.075 * g, 0.18);
      } else if (v.timbre === 'bell') {
        if (main) {
          a.bell(NOTE(MUS.root + 19), t, 0.032 * g);
          a.pluck(NOTE(MUS.root + 7), t, 0.03 * g, 0.7);
        } else a.pluck(NOTE(MUS.root + 14), t, 0.022 * g, 0.5);
      } else {
        a.burst({
          dur: main ? 0.42 : 0.26, freq: main ? 620 : 900, q: main ? 0.7 : 1.1,
          gain: (main ? 0.055 : 0.026) * g, sweep: main ? 760 : 420
        });
        if (main) a.pluck(NOTE(MUS.root + 24), t + spb * 0.5, 0.012 * g, 0.4);
      }
    }
    v.env = v.ring * (0.85 + 0.35 * S.warm);
    v.pulse = 1;
    v.hits++;
    log('hit', i);
    if (main) {
      ripple(i, 0.85 + 0.5 * S.warm);
      if (v.id === 'raptor') puff(stoneX, stoneY - 26, 0xd9c39a, 4, { life: 380, gravity: 150 });
    }
  }

  function dissonance(i) {
    const a = scene.audio;
    if (!a.ctx) return;
    const t = a.ctx.currentTime;
    a.pluck(NOTE(MUS.root - 1), t, 0.06, 0.6);
    a.pluck(NOTE(MUS.root), t + 0.02, 0.055, 0.55);
    a.pluck(NOTE(MUS.root + 6), t + 0.05, 0.03, 0.4);
    a.thump(NOTE(26), t, 0.16, 0.42);
    a.burst({ dur: 0.3, freq: 420, q: 0.5, gain: 0.07, sweep: -260, type: 'lowpass' });
  }

  function bark() {
    const a = scene.audio;
    if (!a.ctx) return;
    const t = a.ctx.currentTime;
    a.thump(NOTE(28), t, 0.2, 0.42);
    a.thump(NOTE(25), t + 0.14, 0.16, 0.5);
    a.burst({ dur: 0.34, freq: 300, q: 0.55, gain: 0.11, sweep: -190, type: 'lowpass' });
    a.burst({ dur: 0.2, freq: 1500, q: 1.4, gain: 0.03, sweep: -900 });
  }

  /* ------------------------------------------------------------- judging */
  function goodEntry(i, d) {
    const v = VOICES[i];
    const perfect = d <= PERFECT;
    v.lock = 0;
    if (v.layered) {
      v.env = v.ring * 1.2;
      v.pulse = 1;
      scene.sfx('chime');
      ripple(i, 1.2);
      scene.popText(v.x, M.Y(v.y - 74), 'steady', v.css);
      S.glow = Math.min(1, S.glow + 0.16);
      log('hold', i);
      return true;
    }
    v.layered = true;
    v.clean++;
    S.voices++;
    v.env = v.ring * 1.3;
    v.pulse = 1;
    fireVoice(i, Math.round(S.beats));
    scene.popText(v.x, M.Y(v.y - 78), v.label, v.css);
    scene.burst(v.x, M.Y(v.y - 34), v.color, perfect ? 16 : 10,
      { life: 620, texture: perfect ? 'arc-spark' : 'arc-dot', spin: perfect, gravity: 40, depth: 22 });
    if (perfect) {
      scene.sfx('good');
      scene.cameras.main.flash(140, 60, 40, 12);
      scene.popText(v.x, M.Y(v.y - 108), 'on the nose', '#fff2cf');
    } else {
      scene.sfx('pick');
    }
    log('layer', i);
    S.glow = Math.min(1, S.glow + 0.3);
    if (!S.started) {
      S.started = true;
      scene.notice('there it is — hold the four bars apart and listen for the seam', 2200);
    } else if (living().length === 2) {
      scene.notice('two voices, two different lengths. count the gap', 1900);
    } else if (living().length === 3) {
      scene.notice('three of them — now wait for the round to come home', 2100);
    }
    return true;
  }

  function badEntry(i, d) {
    const v = VOICES[i];
    v.missed++;
    v.lock = 1.35;
    S.hearts--;
    dissonance(i);
    if (v.layered) {
      v.layered = false;
      v.env = 0;
      scene.popText(v.x, M.Y(v.y - 78), 'lost the line', '#ff9d7a');
    } else {
      scene.popText(v.x, M.Y(v.y - 78), d < v.len * 0.5 ? 'too soon' : 'dragging', '#ff9d7a');
    }
    scene.sfx('bad');
    scene.shake(220, 0.011);
    scene.cameras.main.flash(180, 120, 30, 14);
    puff(v.x, M.Y(v.y - 40), 0x9c5a3c, 8, { life: 520, gravity: 200 });
    log('miss', i);
    S.glow = Math.max(0, S.glow - 0.4);
    if (S.hearts <= 0) { endRun(false); return false; }
    if (S.hearts === 1) scene.notice('one feather of patience left. wait for the ring', 2000);
    else scene.notice(MISS_LINES[Math.floor(r() * MISS_LINES.length)], 1800);
    return false;
  }

  function tap(i) {
    if (S.over) return false;
    i = clamp(Math.floor(i), 0, VOICES.length - 1);
    const v = VOICES[i];
    if (v.lock > 0) {
      scene.sfx('land');
      puff(v.x, M.Y(v.y - 30), 0x7c6a58, 3, { life: 260 });
      return false;
    }
    const p = phaseOf(i);
    const d = Math.min(p, v.len - p);
    if (d <= CLEAN) return goodEntry(i, d);
    return badEntry(i, d);
  }

  function nearestVoice(px) {
    for (const v of VOICES) if (px >= v.band[0] && px < v.band[1]) return v.idx;
    return px < 300 ? 0 : 3;
  }

  /* ------------------------------------------------------ round machinery */
  function bank() {
    const carried = living();
    const n = carried.length;
    S.rounds++;
    S.voices += n;
    scene.notice(BANK_LINES[Math.floor(r() * BANK_LINES.length)], 2300);
    scene.sfx('win');
    scene.cameras.main.flash(520, 120, 90, 40);
    scene.shake(260, 0.008);
    scene.burst(480, M.Y(180), 0xffe2b0, 30, { life: 1100, gravity: 120, spin: true, depth: 44 });
    scene.popText(480, M.Y(196), 'the sky opens', '#fff0cd');
    S.glow = 1;
    log('bank', -1);

    const keeper = carried.reduce((a, b) => (!a || b.hits > a.hits ? b : a), null);
    VOICES.forEach((v) => {
      if (!v.layered || v === keeper) return;
      v.layered = false;
      v.env = 0;
    });
    if (keeper) {
      keeper.pulse = 1;
      ripple(keeper.idx, 1.4);
      scene.popText(keeper.x, M.Y(keeper.y - 110), 'still holding', keeper.css);
    }

    if (S.rounds >= TARGET) { endRun(true); return; }
    S.roundPos = 0;
    S.roundBeats = Math.max(28, 46 - S.rounds * 4);
    S.changeAt = S.roundBeats * (0.5 - S.rounds * 0.04);
    S.nextBark = S.beats + 9 + r() * 5;
  }

  function failRound() {
    S.hearts--;
    S.roundPos = 0;
    S.beatPulse = 1;
    VOICES.forEach((v) => { v.layered = false; v.env = 0; v.lock = 0.6; });
    scene.sfx('boom');
    scene.shake(320, 0.014);
    scene.cameras.main.flash(300, 40, 20, 40);
    scene.notice('the light went up without you. begin again, quieter', 2200);
    log('timeout', -1);
    if (S.hearts <= 0) endRun(false);
  }

  function applyChange() {
    const plan = CHANGES[S.changeIdx % CHANGES.length];
    S.changeIdx++;
    S.changeAt = 0;
    const v = VOICES[plan.i];
    if (v.len === plan.to) return;
    const was = v.len;
    v.len = plan.to;
    hoopTex(scene, v.len);
    v.ring = v.timbre === 'drone' ? 1.5 : v.timbre === 'bell' ? 1.7 : v.timbre === 'whir' ? 0.85 : 0.6;
    scene.notice(`${v.label} changed its bar — ${was} became ${v.len}`, 2300);
    scene.sfx('tick');
    v.pulse = 1;
    ripple(v.idx, 1.1);
    log('shift', v.idx);
  }

  function fireBark() {
    S.nextBark = S.beats + 13 + r() * 7;
    bark();
    scene.shake(240, 0.01);
    scene.cameras.main.flash(200, 60, 26, 10);
    log('bark', -1);
    const live = living();
    if (!live.length) {
      scene.notice('a bark rolls down the ridge. nothing to lose yet', 1900);
      return;
    }
    const v = live[Math.floor(r() * live.length)];
    v.layered = false;
    v.env = 0;
    v.lock = 0.5;
    scene.popText(v.x, M.Y(v.y - 82), 'shaken out', '#ffa07a');
    puff(v.x, M.Y(v.y - 44), 0xb06a44, 10, { life: 600, gravity: 160 });
    scene.notice(BARK_LINES[Math.floor(r() * BARK_LINES.length)] + ` — ${v.label} drops`, 2200);
    log('drop', v.idx);
  }

  function endRun(win) {
    if (S.over) return;
    S.over = true;
    S.won = win;
    VOICES.forEach((v) => { if (win) { v.env = Math.max(v.env, 0.4); } else { v.layered = false; v.env = 0; } });
    scene.finish(win, {
      score: S.voices,
      note: win
        ? `${S.rounds} rounds opened the sky · ${cleanTotal()} clean entries`
        : `${S.voices} voices before the valley gave up on you`
    });
  }

  const cleanTotal = () => VOICES.reduce((n, v) => n + v.clean, 0);

  /* ------------------------------------------------------------ the clock */
  function advanceClock(dBeats) {
    if (dBeats <= 0 || S.over) return;
    const spb = 60 / S.bpm;
    VOICES.forEach((v) => {
      v.env = Math.max(0, v.env - dBeats * spb);
      if (v.lock > 0) v.lock = Math.max(0, v.lock - dBeats);
    });
    const target = S.beats + dBeats;
    S.roundPos += dBeats;
    let guard = 0;
    while (Math.floor(target + 1e-9) > Math.floor(S.beats + 1e-9) && guard++ < 2000) {
      const b = Math.floor(S.beats) + 1;
      S.beats = b;
      onBeat(b);
      if (S.over) return;
    }
    S.beats = target;
    if (S.changeAt > 0 && S.roundPos >= S.changeAt) applyChange();
    if (S.nextBark > 0 && S.beats >= S.nextBark) fireBark();
    if (!S.over && S.roundPos >= S.roundBeats) failRound();
  }

  function onBeat(b) {
    S.beatPulse = 1;
    for (const v of VOICES) if (v.layered) fireVoice(v.idx, b);
    if (S.over) return;
    const live = living();
    if (live.length >= 2 && live.every((v) => mod(b, v.len) === 0)) {
      S.alignHits.push(b);
      if (S.alignHits.length > 10) S.alignHits.shift();
    }
    if (live.length >= 3 && live.every((v) => mod(b, v.len) === 0)) bank();
  }

  /* ---------------------------------------------------------------- paint */
  function paint(time, dt) {
    if (!S.tempoLocked) {
      S.drift = Math.sin(S.beats * 0.09) * 5 + Math.sin(S.beats * 0.021) * 3;
      S.bpm = BPM0 + S.drift + S.rounds * 5;
    }
    const live = living().length;
    const want = clamp(live / 4 + S.glow * 0.1, 0, 1);
    S.warm = lerp(S.warm, want, Math.min(1, dt * 3.2));
    S.glow = Math.max(0, S.glow - dt * 0.85);
    S.beatPulse = Math.max(0, S.beatPulse - dt * 4.2);
    S.dawn = clamp((S.rounds + clamp(S.roundPos / S.roundBeats, 0, 1)) / TARGET, 0, 1)
      * (0.66 + 0.34 * S.warm);

    veil.setAlpha(0.03 + S.dawn * 0.13 + S.glow * 0.05);
    horizon.setAlpha(0.09 + S.dawn * 0.3 + S.warm * 0.12);
    horizon.setScale((M.portrait ? 3.4 : 2.9) * (1 + S.warm * 0.08), M.portrait ? 1.1 : 0.72);
    beams.forEach((bm, i) => {
      bm.setAlpha(S.glow * (0.3 - i * 0.05) + S.dawn * S.warm * 0.09);
      bm.setAngle((i - 1) * (5 + Math.sin(time / 2600 + i) * 1.6));
    });
    seedsRate(seeds, live >= 3 ? 150 : live >= 1 ? 300 : 620);

    const warmRgb = [255, 208, 150];
    const coolRgb = [122, 148, 156];
    VOICES.forEach((v, i) => {
      v.pulse = Math.max(0, v.pulse - dt * 3.4);
      const p = phaseOf(i);
      const u = clamp((v.len - p) / v.len, 0, 1);
      const swing = Math.cos((p / v.len) * TAU);
      const sounding = v.layered && v.env > 0.03;
      const cue = v.layered ? 1 : 0.5;
      const lit = v.layered ? clamp(0.42 + S.dawn * 0.58, 0, 1) : 0;
      const mix = [0, 1, 2].map((k) => Math.round(lerp(coolRgb[k], warmRgb[k], lit)));
      v.body.setTint(Phaser.Display.Color.GetColor(mix[0], mix[1], mix[2]));

      const key = 'dc-hoop-' + v.len;
      if (v.hoopImg.texture.key !== key) v.hoopImg.setTexture(key);
      v.hoopImg.setAlpha(0.22 + 0.5 * cue + v.pulse * 0.3);
      v.hoopImg.setAngle(Math.sin(time / 1800 + i) * 1.4);
      const orbit = v.hr;
      const ang = -Math.PI / 2 + (p / v.len) * TAU;
      v.marker.x = v.hx + Math.cos(ang) * orbit;
      v.marker.y = M.Y(v.hy) + Math.sin(ang) * orbit;
      v.marker.setAlpha(clamp((0.4 + 0.6 * cue) * (0.6 + v.pulse * 0.4), 0, 1));
      v.marker.setScale((0.5 + 0.34 * cue + v.pulse * 0.5) * K);
      v.approach.setAlpha(clamp(0.12 + (1 - u) * 0.4 + v.pulse * 0.4, 0, 1) * cue);
      const cs = (v.hr / 48) * (1.14 + 1.18 * u);
      v.approach.setScale(cs, cs);
      v.approach.x = v.hx;

      if (i === 0) {
        const swell = 0.5 + 0.5 * swing;
        const s = herdScale * (1 + 0.035 * swell + 0.06 * v.pulse);
        herd.setScale(s, s * (1 + 0.045 * swell));
        herd.y = M.Y(v.y) - 5 * swell * herdScale;
        herdGlow.y = herd.y - 30 * s;
        herdGlow.setAlpha(sounding ? 0.1 + 0.22 * swell + 0.2 * v.pulse : 0.03 * swell);
      } else if (i === 1) {
        const swingA = (13 * swing - 4) * (Math.PI / 180);
        tail.rotation = v.layered ? swingA : swingA * 0.55;
        raptor.setScale(-rScale * (1 + 0.03 * v.pulse), rScale * (1 + 0.04 * v.pulse));
      } else if (i === 2) {
        const want = sounding && p < v.len * 0.34 ? 'dc-bird-cry' : 'dc-bird-rest';
        if (v.frame !== want) { v.frame = want; bird.setTexture(want); }
        const bs = VOICES[2].scale * K;
        bird.setScale(bs * (1 + 0.05 * v.pulse));
        bird.y = M.Y(v.y) - (10 * v.pulse + 5 * (v.layered ? 1 : 0)) * bs;
      } else {
        const bend = (-0.02 + 0.15 * swing) * (v.layered ? 1 : 0.6);
        reeds[1].rotation = bend;
        reeds[0].rotation = bend * 0.55;
        reeds[2].rotation = bend * 1.25;
        reeds[1].setScale(v.scale * K * (1 + 0.02 * v.pulse));
      }

      v.footRing.setStrokeStyle(2, v.layered ? v.color : 0x7f8f92, 1);
      v.footRing.setAlpha(clamp((v.layered ? 0.3 : 0.1) + v.pulse * 0.4, 0, 1));
      v.caption.setAlpha(v.layered ? 0.92 : 0.42);
    });

    // the round clock, drawn into the near bank between the ridges and the herd
    clockLine.clear();
    const cy = M.Y(434);
    clockLine.lineStyle(3, 0xffd9a0, 0.2 + S.warm * 0.2);
    clockLine.lineBetween(60, cy, W - 60, cy);
    const frac = clamp(S.roundPos / S.roundBeats, 0, 1);
    const hot = frac > 0.78;
    clockLine.lineStyle(6, hot ? 0xff9a6a : 0xffcf8f, hot ? 0.85 : 0.6);
    clockLine.lineBetween(60, cy, 60 + (W - 120) * frac, cy);
    clockLine.fillStyle(hot ? 0xffb56b : 0xffe6b0, 0.9);
    clockLine.fillCircle(60 + (W - 120) * frac, cy, hot ? 6 + Math.sin(time / 90) * 2 : 4.5);
    clockLine.lineStyle(2, 0xffe6b0, 0.22);
    for (let k = 1; k < TARGET; k++) {
      const x = 60 + ((W - 120) * k) / TARGET;
      clockLine.lineBetween(x, cy - 9, x, cy + 9);
    }
  }

  /* ------------------------------------------------- per-voice cue sprites */
  // portrait scales bodies by K but the stage is only 960 wide, so the ring cues
  // take a smaller multiplier and get pulled in from the edges to stay on screen
  const HS = (M.portrait ? 0.7 : 1) * K;
  VOICES.forEach((v, i) => {
    v.hr = v.hoop.r * HS;
    v.hx = clamp(v.hoop.x, 18 + v.hr, W - 18 - v.hr);
    v.hy = M.portrait ? v.hoop.y + (v.y - 66 - v.hoop.y) * 0.5 : v.hoop.y;
    v.hoopImg = scene.add.image(v.hx, M.Y(v.hy), 'dc-hoop-' + v.len)
      .setDepth(11).setOrigin(0.5).setScale(v.hr / 74).setTint(v.color).setAlpha(0.3);
    v.marker = scene.add.image(v.hx, M.Y(v.hy) - v.hr, 'arc-spark').setDepth(12)
      .setTint(v.color).setBlendMode(Phaser.BlendModes.ADD).setScale(0.7 * K);
    v.approach = scene.add.image(v.hx, M.Y(v.hy), 'arc-ring').setDepth(11)
      .setTint(v.color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.2)
      .setScale(K, K);
    v.footRing = scene.add.circle(v.x, M.Y(v.y - 8), 52 * HS, 0x000000, 0).setStrokeStyle(2, v.color, 0.2)
      .setDepth(10);
    v.caption = scene.add.text(v.x, M.Y(v.y) + 12 * K, v.label, {
      fontFamily: SERIF, fontSize: (M.portrait ? 34 : 15) + 'px', fontStyle: 'italic',
      color: v.css, stroke: '#12262a', strokeThickness: M.portrait ? 8 : 5
    }).setOrigin(0.5, 0).setDepth(48).setAlpha(0.45);
    v.body = [herd, raptor, bird, reeds[1]][i];
  });

  /* ---------------------------------------------------------------- input */
  scene.input.addPointer(3);
  const onDown = (ptr) => {
    const y = scene.uY(ptr.y);
    if (y < 8 || y > 540) return;
    tap(nearestVoice(ptr.x));
  };
  scene.input.on('pointerdown', onDown);

  scene.input.keyboard.addKeys({
    one: 'ONE', two: 'TWO', three: 'THREE', four: 'FOUR', space: 'SPACE'
  });
  ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((k, i) => {
    scene.input.keyboard.on('keydown-' + k, () => tap(i));
  });
  scene.input.keyboard.on('keydown-SPACE', () => {
    let best = 0, bd = Infinity;
    VOICES.forEach((v, i) => {
      if (v.layered || v.lock > 0) return;
      const d = Math.min(phaseOf(i), v.len - phaseOf(i));
      if (d < bd) { bd = d; best = i; }
    });
    tap(best);
  });

  /* -------------------------------------------------------------- start */
  S.roundBeats = 46;
  S.changeAt = 26;
  S.nextBark = 0;
  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'four bars are already running' });
  scene.notice('tap a creature as its ring closes. its voice keeps singing after that', 3000);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (scene.audio.musicOn) { try { scene.audio.stopMusic(); } catch { /* no context */ } }
    if (!S.over && !S.frozen) {
      const dBeats = dt * S.bpm / 60;
      advanceClock(dBeats);
    }
    paint(time, S.over ? dt * 0.5 : dt);
    scene.hud({
      score: S.voices,
      progress: clamp(S.warm, 0, 1),
      hearts: Math.max(0, S.hearts),
      extra: S.over
        ? (S.won ? 'the dawn is finished' : 'the valley goes quiet')
        : living().length === 0
          ? `round ${S.rounds + 1} · listening for the first bar`
          : `${['none', 'one', 'two', 'three', 'four'][living().length]} voices · round ${Math.min(TARGET, S.rounds + 1)} of ${TARGET}`
    });
    scene.audio.setTension(clamp(0.12 + S.warm * 0.5 + (S.roundPos / S.roundBeats > 0.8 ? 0.3 : 0), 0, 1));
  }

  return {
    update,
    state: () => ({
      beats: r2(S.beats), bpm: r2(S.bpm), roundPos: r2(S.roundPos), roundBeats: S.roundBeats,
      score: S.voices, voices: S.voices, hearts: S.hearts, rounds: S.rounds, target: TARGET,
      warm: r2(S.warm), dawn: r2(S.dawn), glow: r2(S.glow), layers: living().length,
      alignEvery: living().length >= 2 ? alignEvery() : 0, toAlign: r2(toAlign()),
      over: S.over, won: S.won, barkAt: r2(S.nextBark), changeAt: r2(S.changeAt), frozen: S.frozen,
      alignHits: S.alignHits.slice(),
      log: S.log.slice(-10).map((e) => ({ e: e.e, v: e.v, b: e.b })),
      bars: VOICES.map((v, i) => ({
        id: v.id, len: v.len, phase: r2(phaseOf(i)), toDown: r2(toDown(i)),
        layered: v.layered, sounding: v.layered && v.env > 0.03,
        hits: v.hits, clean: v.clean, missed: v.missed, lock: r2(v.lock)
      }))
    }),
    tapVoice: (i) => tap(i),
    tapScreen: (i) => ({ x: VOICES[i].x, y: M.Y(VOICES[i].y - 30) }),
    nextDown: (i) => r2(toDown(i)),
    phase: (i) => r2(phaseOf(i)),
    alignBeats: () => (living().length >= 2 ? alignEvery() : 0),
    setTempo: (v) => { S.bpm = clamp(Number(v) || BPM0, 20, 240); S.tempoLocked = true; },
    setHearts: (v) => { S.hearts = clamp(Math.round(v), 0, 3); },
    setVoices: (v) => { S.voices = Math.max(0, Math.round(v)); },
    advanceBeats: (n) => {
      let left = Math.max(0, Number(n) || 0);
      while (left > 1e-6) {
        const step = Math.min(1 / 8, left);
        advanceClock(step);
        left -= step;
        if (S.over) break;
      }
      return r2(S.beats);
    },
    enterOnBeat: (i) => {
      const d = toDown(i);
      if (d > 1e-6) advanceClock(d);
      return tap(i);
    },
    enterOffBeat: (i, off) => {
      const d = toDown(i) + (off === undefined ? 1.5 : off);
      advanceClock(d);
      return tap(i);
    },
    forceBank: () => {
      VOICES.forEach((v, i) => {
        v.layered = true;
        v.env = v.ring;
        if (v.hits === 0) { v.hits = 1; v.clean++; S.voices++; }
        fireVoice(i, Math.floor(S.beats));
      });
      const n = alignEvery() - mod(S.beats, alignEvery());
      advanceClock(n > 1e-6 ? n : alignEvery());
      return r2(S.beats);
    },
    barkNow: () => { S.nextBark = S.beats + 0.01; return true; },
    setRound: (n) => { S.rounds = clamp(Math.round(n), 0, TARGET); return S.rounds; },
    setRoundBeats: (n) => { S.roundBeats = clamp(Math.round(Number(n)) || 46, 6, 4000); return S.roundBeats; },
    setChange: (n) => { S.changeAt = Math.max(0, Number(n) || 0); return S.changeAt; },
    setBark: (n) => { S.nextBark = Math.max(0, Number(n) || 0); return S.nextBark; },
    dropAll: () => {
      VOICES.forEach((v) => { v.layered = false; v.env = 0; v.lock = 0.35; });
      S.alignHits.length = 0;
      return true;
    },
    setFrozen: (v) => { S.frozen = !!v; return S.frozen; },
    holdChorus: () => {
      const b = Math.floor(S.beats);
      VOICES.forEach((v, i) => {
        v.layered = true;
        v.lock = 0;
        if (v.pat.indexOf(mod(b, v.len)) < 0) v.env = v.ring * 0.9;
        else fireVoice(i, b);
        if (v.hits === 0) { v.hits = 1; v.clean++; S.voices++; }
      });
      S.glow = 0.8;
      return living().length;
    },
    starLine: STAR
  };
}

export default {
  id: 'dawn-chorus', stars: STAR, mood: 'dawn', unit: 'voices',
  create, update: (scene, t, d) => scene.gameObj.update(t, d)
};
