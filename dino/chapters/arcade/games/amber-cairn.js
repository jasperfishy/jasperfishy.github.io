// Amber Cairn — the last light on the amber plain.
// The herd marks the safe route with a stack of stones and you are the one who
// builds it before dusk. Where each stone lands moves the lean of the whole
// cairn, the wind leans back, and a cairn past its tolerance comes down.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-276e018775e133bb';

const STAR = [8, 14, 21];
const CX = 470;
const BASE_Y = 432;
const PIVOT_MIN = 302;
const PIVOT_MAX = 638;
const MARKERS = [84, 104, 126, 146];
const DAYS = [26, 23, 20, 18];
const TOL0 = 30;
const TOL_MIN = 16;
const WIND_PUSH = 7;
const BASE_HALF = 96;
const MINI_X = [770, 856, 934, 690];
const ACCENT = MOODS.amber.accent;

const KINDS = [
  { key: 'ac-slab', name: 'slab', w: 112, h: 15, m: 1.7, cord: 206, g: 1450, damp: 0.1, grip: 0.9, rock: 0.3 },
  { key: 'ac-mid', name: 'mid', w: 72, h: 22, m: 1.0, cord: 158, g: 1900, damp: 0.07, grip: 0.62, rock: 0.62 },
  { key: 'ac-pebble', name: 'pebble', w: 44, h: 13, m: 0.5, cord: 112, g: 2400, damp: 0.05, grip: 0.34, rock: 1.3 }
];

const CACHE = [
  { k: 0, x: 108, y: 503 },
  { k: 1, x: 58, y: 452 },
  { k: 2, x: 172, y: 446 }
];

const LINES = {
  open: 'The herd follows the mark, not the maker. Build it true.',
  gust: 'Wind comes. Drop in the calm, brace when it takes hold.',
  true: 'That one sat like it had always been there.',
  off: 'It leans. Put the next one back over the middle.',
  slab: 'A broad stone is slow and honest.',
  pebble: 'Small stones rock. Keep them few.',
  mid: 'A fair stone. It will carry anything.',
  down: 'Over it goes. We have lost stones before.',
  tip: 'One stone on a wide plinth only tips. A tower is another matter.',
  dusk: 'The light took the rest of it. Start again, quicker.',
  mark: 'That mark holds. The wind will be meaner on the next.',
  held: 'The herd will find this one in the dark.',
  half: 'Halfway to the mark and the top is already twitching.',
  slip: 'That one found the air and not the stack.'
};

/* -------------------------------------------------------------------- art */
function stonePts(w, h, rand, chip) {
  const n = 13;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const rr = 1 - chip * rand();
    pts.push([w / 2 + Math.cos(a) * (w / 2 - 1) * rr, h / 2 + Math.sin(a) * Math.max(1.4, h / 2 - 0.9) * rr]);
  }
  return pts;
}

function traceStone(c, pts) {
  const n = pts.length;
  c.beginPath();
  c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  c.closePath();
}

function paintStone(c, w, h, seed, pal, chip, dusty) {
  const rand = rng(seed);
  // the clip must trace the same points as the fill, so the outline is built once
  const pts = stonePts(w, h, rand, chip === undefined ? 0.16 : chip);
  traceStone(c, pts);
  const g = c.createLinearGradient(w * 0.18, 0, w * 0.5, h);
  g.addColorStop(0, pal[0]);
  g.addColorStop(0.42, pal[1]);
  g.addColorStop(1, pal[2]);
  c.fillStyle = g;
  c.fill();

  c.save();
  traceStone(c, pts);
  c.clip();
  c.strokeStyle = 'rgba(46,30,14,0.2)';
  for (let i = 0; i < 3; i++) {
    const y = h * (0.28 + i * 0.22) + rand() * 2;
    c.lineWidth = 0.7 + rand() * 1.1;
    c.beginPath();
    c.moveTo(0, y);
    for (let x = 0; x <= w; x += 14) c.lineTo(x, y + Math.sin(x * 0.09 + i) * h * 0.06);
    c.stroke();
  }
  for (let i = 0; i < 9; i++) {
    c.fillStyle = i % 3 ? 'rgba(120,132,66,0.22)' : 'rgba(255,238,190,0.22)';
    c.beginPath();
    c.ellipse(rand() * w, rand() * h, 1 + rand() * 3.4, 0.8 + rand() * 1.6, rand(), 0, Math.PI * 2);
    c.fill();
  }
  const shade = c.createLinearGradient(0, h * 0.5, 0, h);
  shade.addColorStop(0, 'rgba(28,16,6,0)');
  shade.addColorStop(1, 'rgba(28,16,6,0.4)');
  c.fillStyle = shade;
  c.fillRect(0, 0, w, h);
  c.restore();

  c.strokeStyle = 'rgba(255,236,186,0.5)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(w * 0.16, h * 0.26);
  c.quadraticCurveTo(w * 0.5, h * 0.06, w * 0.84, h * 0.28);
  c.stroke();
  // grain() writes raw pixels from the canvas origin, so it must be skipped
  // whenever the stone is painted inside a translated context
  if (dusty !== false) grain(c, w, h, 0.05, seed + 3);
}

function art(scene, S) {
  paintStoneGen(scene, 'ac-slab', 112, 15, 1201, ['#f4e0b4', '#c8a468', '#755730'], 0.1);
  paintStoneGen(scene, 'ac-mid', 72, 22, 1223, ['#f0dcb2', '#bfa06c', '#6a5330'], 0.18);
  paintStoneGen(scene, 'ac-pebble', 44, 13, 1249, ['#f6e6be', '#c9ae79', '#7a6139'], 0.22);

  canvasTex(scene, 'ac-base', 240, 48, (c) => {
    const rand = rng(1301);
    const g = c.createLinearGradient(0, 0, 0, 48);
    g.addColorStop(0, '#c6ab77');
    g.addColorStop(0.22, '#96794c');
    g.addColorStop(1, '#43331f');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(6, 46);
    c.quadraticCurveTo(2, 20, 26, 12);
    c.lineTo(60, 6);
    c.lineTo(120, 4);
    c.lineTo(188, 9);
    c.quadraticCurveTo(234, 15, 234, 40);
    c.lineTo(230, 48);
    c.lineTo(10, 48);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(255,238,196,0.34)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(28, 12);
    c.lineTo(206, 10);
    c.stroke();
    c.strokeStyle = 'rgba(40,26,12,0.3)';
    for (let i = 0; i < 5; i++) {
      const y = 20 + i * 6;
      c.lineWidth = 0.8 + rand();
      c.beginPath();
      c.moveTo(12 + rand() * 20, y);
      c.lineTo(220 - rand() * 30, y + rand() * 3);
      c.stroke();
    }
    for (let i = 0; i < 12; i++) {
      c.fillStyle = 'rgba(112,124,60,0.3)';
      c.beginPath();
      c.ellipse(20 + rand() * 200, 8 + rand() * 16, 3 + rand() * 7, 1.6 + rand() * 2.6, 0, 0, Math.PI * 2);
      c.fill();
    }
    grain(c, 240, 48, 0.045, 1307);
  });

  canvasTex(scene, 'ac-branch', 660, 96, (c) => {
    const rand = rng(1421);
    const g = c.createLinearGradient(0, 18, 0, 82);
    g.addColorStop(0, '#7c5c36');
    g.addColorStop(0.34, '#5a3f24');
    g.addColorStop(0.8, '#3a2718');
    g.addColorStop(1, '#22160e');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-8, 22);
    c.quadraticCurveTo(180, 12, 400, 26);
    c.quadraticCurveTo(560, 34, 664, 52);
    c.lineTo(664, 74);
    c.quadraticCurveTo(560, 62, 400, 58);
    c.quadraticCurveTo(180, 52, -8, 66);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(24,14,8,0.5)';
    for (let i = 0; i < 30; i++) {
      const x = rand() * 640;
      const y = 26 + rand() * 32;
      c.lineWidth = 1 + rand() * 2.2;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 30, y + (rand() - 0.5) * 6, x + 70 + rand() * 40, y + (rand() - 0.5) * 5);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,214,150,0.2)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 10; i++) {
      const x = 10 + rand() * 600;
      c.beginPath();
      c.moveTo(x, 22 + rand() * 6);
      c.lineTo(x + 40 + rand() * 70, 24 + rand() * 8);
      c.stroke();
    }
    for (let i = 0; i < 22; i++) {
      const x = rand() * 640;
      const y = 20 + Math.sin(x * 0.01) * 5 + rand() * 10;
      c.fillStyle = i % 3 ? 'rgba(104,118,54,0.85)' : 'rgba(142,156,74,0.8)';
      c.beginPath();
      c.ellipse(x, y, 5 + rand() * 12, 3 + rand() * 4, rand() * 0.5, 0, Math.PI * 2);
      c.fill();
    }
    // the worn groove the trolley rides
    c.strokeStyle = 'rgba(18,10,6,0.55)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(120, 58);
    c.quadraticCurveTo(360, 62, 640, 70);
    c.stroke();
    c.strokeStyle = 'rgba(226,196,140,0.22)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(120, 60);
    c.quadraticCurveTo(360, 64, 640, 72);
    c.stroke();
    // short twigs with leaves
    [58, 214, 330, 470, 590].forEach((tx, i) => {
      const len = 26 + rand() * 30;
      c.strokeStyle = '#3b2718';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(tx, 62);
      c.quadraticCurveTo(tx + (i % 2 ? 8 : -8), 62 + len * 0.6, tx + (i % 2 ? 16 : -14), 62 + len);
      c.stroke();
      for (let k = 1; k <= 3; k++) {
        const t = k / 4;
        const lx = tx + (i % 2 ? 16 : -14) * t;
        const ly = 62 + len * t;
        c.fillStyle = k % 2 ? '#5e7134' : '#4c5f2c';
        c.beginPath();
        c.ellipse(lx + (k % 2 ? 7 : -7), ly, 8, 3.2, (k % 2 ? 0.6 : -0.6), 0, Math.PI * 2);
        c.fill();
      }
    });
    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(0, 10, 0, 90);
    rim.addColorStop(0, 'rgba(255,214,150,0.24)');
    rim.addColorStop(0.5, 'rgba(255,214,150,0)');
    rim.addColorStop(1, 'rgba(30,14,4,0.3)');
    c.fillStyle = rim;
    c.fillRect(0, 0, 660, 96);
    c.globalCompositeOperation = 'source-over';
    grain(c, 660, 96, 0.035, 1431);
  });

  canvasTex(scene, 'ac-knot', 44, 44, (c) => {
    const rand = rng(1451);
    c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      c.strokeStyle = i % 2 ? '#a07c42' : '#7a5a2e';
      c.lineWidth = 5 - i * 0.6;
      c.beginPath();
      c.ellipse(22, 18 + i * 4, 15 - i, 7 + i, -0.18 + i * 0.1, 0, Math.PI * 2);
      c.stroke();
    }
    c.strokeStyle = '#3d2a16';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(22, 30);
    c.quadraticCurveTo(26, 38, 22, 43);
    c.stroke();
    c.fillStyle = '#d8b070';
    c.beginPath();
    c.arc(22, 20, 4.6, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = 'rgba(232,206,150,0.4)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(12 + rand() * 20, 12 + rand() * 18);
      c.lineTo(12 + rand() * 20, 12 + rand() * 18);
      c.stroke();
    }
    grain(c, 44, 44, 0.04, 1459);
  });

  canvasTex(scene, 'ac-grass', 60, 92, (c) => {
    const rand = rng(1471);
    c.lineCap = 'round';
    for (let i = 0; i < 13; i++) {
      const x = 8 + i * 3.6 + rand() * 4;
      const len = 34 + rand() * 52;
      const bend = (rand() - 0.4) * 30;
      const g = c.createLinearGradient(x, 92, x, 92 - len);
      g.addColorStop(0, '#4d5a26');
      g.addColorStop(1, i % 3 ? '#8b9444' : '#a89a4a');
      c.strokeStyle = g;
      c.lineWidth = 1.4 + rand() * 1.6;
      c.beginPath();
      c.moveTo(x, 92);
      c.quadraticCurveTo(x + bend * 0.3, 92 - len * 0.6, x + bend, 92 - len);
      c.stroke();
    }
  });

  canvasTex(scene, 'ac-fern', 74, 122, (c) => {
    const rand = rng(1489);
    c.lineCap = 'round';
    for (let f = 0; f < 3; f++) {
      const bx = 20 + f * 16;
      const top = 10 + rand() * 22;
      c.strokeStyle = '#3f5124';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(bx, 122);
      c.quadraticCurveTo(bx - 14 + f * 8, 70, bx + 6 - f * 4, top);
      c.stroke();
      for (let i = 0; i < 9; i++) {
        const t = i / 9;
        const x = bx + (-14 + f * 8) * 2 * t * (1 - t) + (bx + 6 - f * 4 - bx) * t * t;
        const y = 122 + (top - 122) * t * t;
        const s = 1 - t * 0.6;
        [-1, 1].forEach((side) => {
          c.fillStyle = i % 2 ? '#556b2e' : '#486029';
          c.beginPath();
          c.ellipse(x + side * 8 * s, y, 9 * s, 3.2 * s, side * 0.5, 0, Math.PI * 2);
          c.fill();
        });
      }
    }
    grain(c, 74, 122, 0.03, 1493);
  });

  canvasTex(scene, 'ac-herder', 120, 134, (c) => {
    const rand = rng(1511);
    c.fillStyle = 'rgba(40,26,10,0.28)';
    c.beginPath();
    c.ellipse(60, 130, 34, 5, 0, 0, Math.PI * 2);
    c.fill();
    // tail
    c.strokeStyle = '#6e7a3c';
    c.lineWidth = 10;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(42, 74);
    c.quadraticCurveTo(20, 78, 6, 96);
    c.stroke();
    c.fillStyle = '#5c6a32';
    c.beginPath();
    c.moveTo(8, 94);
    c.quadraticCurveTo(0, 104, 12, 106);
    c.quadraticCurveTo(20, 100, 16, 90);
    c.closePath();
    c.fill();
    // far leg
    c.strokeStyle = '#8d6b38';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(52, 92);
    c.quadraticCurveTo(48, 108, 50, 124);
    c.stroke();
    // body
    const body = c.createLinearGradient(38, 50, 88, 96);
    body.addColorStop(0, '#9aa452');
    body.addColorStop(0.5, '#77853f');
    body.addColorStop(1, '#4d5a28');
    c.fillStyle = body;
    c.beginPath();
    c.ellipse(62, 76, 27, 23, -0.16, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(232,214,158,0.5)';
    c.beginPath();
    c.ellipse(66, 86, 17, 10, -0.1, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(40,52,20,0.4)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.arc(52 + i * 5, 68 + (i % 2) * 6, 4, 0.3, 2.5);
      c.stroke();
    }
    // near leg
    c.strokeStyle = '#a37c40';
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(72, 92);
    c.quadraticCurveTo(74, 110, 70, 126);
    c.stroke();
    c.strokeStyle = '#d8b878';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(70, 126);
    c.lineTo(78, 130);
    c.moveTo(70, 126);
    c.lineTo(63, 131);
    c.stroke();
    // neck and head
    c.strokeStyle = '#87943f';
    c.lineWidth = 12;
    c.beginPath();
    c.moveTo(80, 62);
    c.quadraticCurveTo(94, 50, 98, 36);
    c.stroke();
    c.fillStyle = '#92a04a';
    c.beginPath();
    c.ellipse(101, 30, 15, 11, 0.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#d7a95c';
    c.beginPath();
    c.moveTo(112, 28);
    c.quadraticCurveTo(124, 30, 122, 36);
    c.quadraticCurveTo(114, 37, 110, 34);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff4d2';
    c.beginPath();
    c.arc(105, 27, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#221a10';
    c.beginPath();
    c.arc(106.2, 27, 2, 0, Math.PI * 2);
    c.fill();
    // crest
    c.strokeStyle = '#e0a94e';
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(96 - i * 2, 20);
      c.quadraticCurveTo(88 - i * 4, 8 - i * 2, 78 - i * 5, 6 - i * 3);
      c.stroke();
    }
    // arm holding the brace strap
    c.strokeStyle = '#7d8b40';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(74, 72);
    c.quadraticCurveTo(92, 78, 104, 70);
    c.stroke();
    c.fillStyle = '#3c2a16';
    c.beginPath();
    c.ellipse(106, 69, 4, 3, 0.4, 0, Math.PI * 2);
    c.fill();
    // shoulder wrap
    c.strokeStyle = 'rgba(214,176,110,0.75)';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(50, 60);
    c.quadraticCurveTo(66, 52, 80, 62);
    c.stroke();
    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(20, 0, 110, 130);
    rim.addColorStop(0, 'rgba(255,224,160,0.28)');
    rim.addColorStop(0.6, 'rgba(255,224,160,0)');
    rim.addColorStop(1, 'rgba(40,20,6,0.2)');
    c.fillStyle = rim;
    c.fillRect(0, 0, 120, 134);
    c.globalCompositeOperation = 'source-over';
    grain(c, 120, 134, 0.03, 1523);
  });

  canvasTex(scene, 'ac-mini', 68, 124, (c) => {
    const sizes = [[58, 16, 5, 108], [48, 18, 10, 92], [40, 15, 14, 77], [32, 16, 18, 61], [22, 13, 23, 48], [14, 11, 27, 37]];
    sizes.forEach((s, i) => {
      c.save();
      c.translate(s[2], s[3]);
      paintStone(c, s[0], s[1], 1600 + i * 17, ['#c9b184', '#9c8358', '#5c4a2e'], 0.14, false);
      c.restore();
    });
    c.globalCompositeOperation = 'source-atop';
    const warm = c.createLinearGradient(0, 0, 0, 124);
    warm.addColorStop(0, 'rgba(255,206,120,0.3)');
    warm.addColorStop(1, 'rgba(28,18,6,0.34)');
    c.fillStyle = warm;
    c.fillRect(0, 0, 68, 124);
    c.globalCompositeOperation = 'source-over';
  });

  canvasTex(scene, 'ac-glowring', 96, 96, (c) => {
    const g = c.createRadialGradient(48, 48, 6, 48, 48, 46);
    g.addColorStop(0, 'rgba(255,214,130,0.55)');
    g.addColorStop(0.55, 'rgba(255,190,90,0.22)');
    g.addColorStop(1, 'rgba(255,190,90,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 96, 96);
  });
}

function paintStoneGen(scene, key, w, h, seed, pal, chip) {
  canvasTex(scene, key, w, h, (c) => paintStone(c, w, h, seed, pal, chip));
}

/* ----------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M;
  const K = scene.k;
  const S = K;
  const VS = S / M.band;
  art(scene, S);

  const ACC = Phaser.Display.Color.HexStringToColor(ACCENT).color;
  const PIVOT_Y = 40 + 96 * VS + 12;
  const GRAV = 1500 * S / M.band;

  const r = rng(8231);
  const state = {
    t: 0, course: 0, banked: 0, hearts: 3, day: DAYS[0], over: false,
    kind: 1, phase: 'swing', reload: 0, rest: 0,
    pivot: CX, aim: CX, theta: 0.34, avel: 0, len: 150,
    lean: 0, leanV: 0, wob: 0, com: 0, stackArt: 0, jolt: 0,
    brace: false, holding: false, holdT: 0,
    stress: 0, tol: TOL0, creakT: 0, gustNoticed: false, warned: false, trueNoticed: false,
    halfNoticed: false
  };

  const wind = { v: 0, dir: 1, power: 0.6, phase: 'calm', t: 3.2 };
  const stones = [];
  let drop = null;

  /* ------------------------------------------------------------- backdrop */
  scene.add.image(0, M.Y(40), 'ac-branch').setOrigin(0, 0).setScale(S).setDepth(14);

  const plinth = scene.add.image(CX, M.Y(BASE_Y - 4), 'ac-base').setOrigin(0.5, 0)
    .setScale(S).setDepth(12);

  const herder = scene.add.image(246, M.Y(440), 'ac-herder').setOrigin(0.5, 1)
    .setScale(0.82 * S).setDepth(11);

  const grass = [];
  [[40, 470, 1.1], [210, 486, 0.9], [300, 462, 1.05], [620, 470, 1], [700, 492, 1.2],
    [860, 468, 0.95], [930, 496, 1.1], [380, 508, 0.85], [540, 512, 0.95], [760, 514, 1.05]]
    .forEach(([x, y, s], i) => {
      const img = scene.add.image(x, M.Y(y), i % 3 === 0 ? 'ac-fern' : 'ac-grass')
        .setOrigin(0.5, 1).setScale(s * S).setDepth(i % 3 === 0 ? 13 : 15).setAlpha(0.95);
      img._ph = i * 0.7;
      img._s = s;
      grass.push(img);
    });

  const cache = CACHE.map((slot) => {
    const k = KINDS[slot.k];
    const img = scene.add.image(slot.x, M.Y(slot.y), k.key).setDepth(16).setScale(0.86 * S);
    const ring = scene.add.image(slot.x, M.Y(slot.y), 'ac-glowring').setDepth(15)
      .setScale(1.5 * S).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    return { ...slot, k, img, ring };
  });

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 40, max: 190 }, angle: { min: 170, max: 380 },
    lifespan: { min: 320, max: 720 }, scale: { start: 0.55, end: 0 },
    alpha: { start: 0.55, end: 0 }, tint: [0xd9bd86, 0xb6975e, 0xf0dcae],
    gravityY: 220, emitting: false
  }).setDepth(24);

  const sparks = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 60, max: 220 }, lifespan: 620, scale: { start: 0.5, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0xffd98a, gravityY: 260, emitting: false
  }).setDepth(25);

  const drift = scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 0, max: W }, y: { min: M.Y(180), max: M.Y(520) },
    speedX: { min: 20, max: 70 }, speedY: { min: -12, max: 12 },
    lifespan: { min: 2200, max: 4200 }, scale: { start: 0.3, end: 0 },
    alpha: { start: 0.35, end: 0 }, tint: 0xffe6a8, frequency: 460, quantity: 1
  }).setDepth(23);

  const frameG = scene.add.graphics().setDepth(15);
  const guideG = scene.add.graphics().setDepth(17);
  const windG = scene.add.graphics().setDepth(33);
  const braceG = scene.add.graphics().setDepth(26);

  const bob = scene.add.image(CX, M.Y(PIVOT_Y + 120), KINDS[1].key).setDepth(21).setScale(S);
  const bobGlow = scene.add.image(CX, M.Y(PIVOT_Y + 120), 'ac-glowring').setDepth(20)
    .setScale(1.4 * S).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);

  const dusk = scene.add.rectangle(0, 0, W, M.H, 0x170f22, 0).setOrigin(0).setDepth(31);

  const minis = [];

  /* ------------------------------------------------------------ geometry */
  const topY = () => BASE_Y - state.stackArt * VS;
  const topOx = () => (stones.length ? stones[stones.length - 1].ox : 0);
  const topHalf = () => (stones.length ? stones[stones.length - 1].k.w * S / 2 : BASE_HALF * S);
  const tolPx = () => state.tol * S;

  function tolerance() {
    return clamp(TOL0 - state.stackArt * 0.075 - state.course * 1.0, TOL_MIN, TOL0);
  }

  // the plinth carries an offset that sits low; the same offset near the top is a lever
  function hFactor() {
    return clamp(0.32 + state.stackArt * 0.009, 0.32, 1.05);
  }

  function cordLen() {
    const k = KINDS[state.kind];
    const room = (topY() - PIVOT_Y) * M.band;
    const maxL = Math.max(64 * S, room - k.h * S * 0.7 - 16);
    return clamp(k.cord * S, 64 * S, maxL);
  }

  function bobPos() {
    const L = state.len;
    const x = state.pivot + L * Math.sin(state.theta);
    const yc = M.Y(PIVOT_Y) + L * Math.cos(state.theta);
    return { x, y: (yc - M.top) / M.band, L };
  }

  function predict() {
    const k = KINDS[state.kind];
    const b = bobPos();
    const vx = b.L * state.avel * Math.cos(state.theta);
    const vy = -b.L * state.avel * Math.sin(state.theta) / M.band;
    const dy = Math.max(4, topY() - b.y - k.h * VS / 2);
    const t = (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * GRAV * dy))) / GRAV;
    return { x: b.x + (vx + wind.v * 26 * S * 0.5) * t, y: topY(), vx, vy, t };
  }

  /* ------------------------------------------------------------ placement */
  function recompute() {
    let m = 0, mx = 0, art = 0;
    stones.forEach((st) => {
      m += st.k.m;
      mx += st.k.m * st.ox;
      art += st.k.h;
    });
    state.com = m > 0 ? mx / m : 0;
    state.stackArt = art;
    state.tol = tolerance();
  }

  function landDust(x, y, n) {
    dust.emitParticleAt(x, M.Y(y), n);
    scene.burst(x, M.Y(y), 0xd9bd86, n, { life: 520, gravity: 300, scale: 0.5 });
  }

  function settle(kind, landX, carried) {
    const anchor = CX + topOx();
    const dx = landX - anchor;
    const limit = topHalf() * 0.88;
    if (Math.abs(dx) > limit + kind.w * S * 0.18) { slip(kind, landX, dx, carried); return; }

    const st = {
      kind, k: kind, ox: topOx() + dx, base: state.stackArt,
      bounce: 0.26,
      img: carried || scene.add.image(landX, M.Y(topY()), kind.key).setDepth(18).setScale(S)
    };
    st.img.setDepth(18).setScale(S);
    stones.push(st);
    recompute();

    state.leanV += dx * kind.rock * 0.55 * hFactor();
    state.leanV *= kind.grip;
    state.wob = state.wob * kind.grip + Math.min(9, (Math.abs(dx) / S) * kind.rock * 0.55) + 1.6;
    state.jolt = Math.min(9, 3 + Math.abs(dx) / S);

    const trueBy = Math.abs(dx) < 5 * S;
    if (trueBy) {
      state.lean *= 0.86;
      state.day = Math.min(DAYS[state.course], state.day + 0.7);
      scene.sfx('good');
      scene.popText(landX, M.Y(topY() - 26 * VS), 'true', '#ffeec0');
      sparks.explode(8, landX, M.Y(topY()));
      if (!state.trueNoticed) { state.trueNoticed = true; scene.notice(LINES.true, 1900); }
    } else {
      scene.sfx('land');
      scene.popText(landX, M.Y(topY() - 26 * VS), dx > 0 ? 'leans out' : 'leans in', '#e8cf9a');
      if (Math.abs(dx) > limit * 0.6 && !state.warned) {
        state.warned = true;
        scene.notice(LINES.off, 1900);
      }
    }
    landDust(landX, topY() + 4, 10);
    scene.shake(90, 0.0035);
    state.phase = 'swing';
    state.reload = 0.42;
    state.rest = 0.3;
    if (state.stackArt >= MARKERS[state.course] * 0.55 && !state.halfNoticed) {
      state.halfNoticed = true;
      scene.notice(LINES.half, 2100);
    }
    checkCourse();
  }

  function slip(kind, landX, dx, carried) {
    const img = carried || scene.add.image(landX, M.Y(topY()), kind.key).setDepth(22).setScale(S);
    img.setDepth(22).setScale(S);
    const dir = Math.sign(dx) || 1;
    scene.tweens.add({
      targets: img, y: M.Y(506), x: landX + dir * 90 * S, angle: dir * 140, alpha: 0.9,
      duration: 760, ease: 'quad.in', onComplete: () => img.destroy()
    });
    state.wob += 3;
    state.leanV += dir * 14 * S;
    scene.sfx('bad');
    scene.shake(150, 0.006);
    landDust(landX, topY() + 6, 8);
    scene.popText(landX, M.Y(topY() - 24 * VS), 'slipped', '#e0a274');
    scene.notice(LINES.slip, 1700);
    state.phase = 'swing';
    state.reload = 0.5;
  }

  function checkCourse() {
    if (state.stackArt + 0.001 < MARKERS[state.course]) return;
    const markTop = topY();
    state.banked += stones.length;
    clearStones(true);
    scene.sfx('chime');
    scene.cameras.main.flash(260, 255, 226, 150);
    scene.burst(CX, M.Y(markTop - 20), 0xffd98a, 24, { life: 820, gravity: 160, spin: true });
    scene.popText(CX, M.Y(markTop - 52 * VS), 'the mark holds', '#ffeec0');
    const mx = MINI_X[state.course] ?? 940;
    const mini = scene.add.image(mx, M.Y(430), 'ac-mini').setOrigin(0.5, 1)
      .setScale(0.5 * S).setDepth(9).setAlpha(0);
    minis.push(mini);
    scene.tweens.add({ targets: mini, alpha: 0.95, duration: 700 });
    state.course++;
    if (state.course >= MARKERS.length) { finish(true, LINES.held); return; }
    state.day = DAYS[state.course];
    scene.notice(LINES.mark, 2400);
  }

  function clearStones(gone) {
    stones.forEach((st) => { if (gone) st.img.destroy(); });
    stones.length = 0;
    state.stackArt = 0;
    state.com = 0;
    state.lean = 0;
    state.leanV = 0;
    state.wob = 0;
    state.stress = 0;
    state.halfNoticed = false;
    recompute();
  }

  function collapse() {
    if (state.over) return;
    if (!stones.length) { state.lean = 0; state.leanV = 0; state.wob = 0; state.stress = 0; return; }
    const lone = stones.length < 2;
    const dir = Math.sign(state.lean) || 1;
    stones.forEach((st, i) => {
      const t = 0.5 + i * 0.045;
      scene.tweens.add({
        targets: st.img,
        y: M.Y(500 + (i % 3) * 10),
        x: st.img.x + dir * (70 + i * 26) * S,
        angle: dir * (120 + i * 20),
        alpha: 0.85,
        duration: t * 1000,
        ease: 'quad.in',
        onComplete: () => st.img.destroy()
      });
    });
    stones.length = 0;
    state.stackArt = 0;
    state.com = 0;
    state.lean = 0;
    state.leanV = 0;
    state.wob = 0;
    state.jolt = 0;
    state.halfNoticed = false;
    if (!lone) {
      state.hearts--;
      if (state.hearts < 0) state.hearts = 0;
    }
    recompute();
    scene.sfx(lone ? 'bad' : 'boom');
    scene.shake(lone ? 150 : 420, lone ? 0.006 : 0.02);
    scene.cameras.main.flash(240, 120, 74, 20);
    for (let i = 0; i < 5; i++) {
      dust.emitParticleAt(CX + (r() - 0.5) * 160 * S, M.Y(300 + i * 30), 12);
    }
    scene.burst(CX, M.Y(360), 0xc9a76a, 26, { life: 900, gravity: 320, scale: 0.7 });
    scene.popText(CX, M.Y(300), lone ? 'it only tipped' : 'the cairn goes over', '#ffbe86');
    state.day = Math.max(state.day, DAYS[state.course] * 0.55);
    state.reload = 0.9;
    if (lone) scene.notice(LINES.tip, 1900);
    else if (state.hearts <= 0) finish(false, LINES.down);
    else scene.notice(LINES.down, 2300);
  }

  function duskFall() {
    if (state.over) return;
    state.hearts--;
    scene.sfx('bad');
    scene.shake(260, 0.01);
    scene.cameras.main.flash(320, 40, 20, 60);
    clearStones(true);
    state.day = DAYS[state.course];
    state.reload = 0.8;
    if (state.hearts <= 0) finish(false, 'the plain went dark with the mark unfinished');
    else scene.notice(LINES.dusk, 2300);
  }

  function finish(win, note) {
    if (state.over) return;
    state.over = true;
    scene.finish(win, { score: state.banked, note });
  }

  /* -------------------------------------------------------------- release */
  function release() {
    if (state.over || state.phase !== 'swing' || state.reload > 0) return;
    const k = KINDS[state.kind];
    const b = bobPos();
    drop = {
      k, img: scene.add.image(b.x, M.Y(b.y), k.key).setDepth(21).setScale(S),
      x: b.x, y: b.y,
      vx: b.L * state.avel * Math.cos(state.theta),
      vy: -b.L * state.avel * Math.sin(state.theta) / M.band,
      rot: state.theta * 0.6, spin: state.avel * 0.8
    };
    state.phase = 'fall';
    state.avel *= 0.4;
    scene.sfx('whoosh');
    bob.setVisible(false);
    bobGlow.setAlpha(0);
  }

  function selectKind(i) {
    if (i === state.kind) return;
    state.kind = clamp(i, 0, KINDS.length - 1);
    scene.sfx('tick');
    scene.notice(state.kind === 0 ? LINES.slab : state.kind === 2 ? LINES.pebble : LINES.mid, 1500);
  }

  /* ---------------------------------------------------------------- input */
  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D'
  });

  function pressStart() {
    if (state.over) return;
    state.holding = true;
    state.holdT = 0;
  }
  function pressEnd() {
    if (state.over) { state.holding = false; state.brace = false; return; }
    if (state.brace) state.brace = false;
    else if (state.holding) release();
    state.holding = false;
    state.holdT = 0;
  }

  scene.input.on('pointermove', (p) => {
    state.aim = clamp(p.x, PIVOT_MIN, PIVOT_MAX);
  });
  scene.input.on('pointerdown', (p) => {
    const py = scene.uY(p.y);
    for (const slot of cache) {
      if (Math.abs(p.x - slot.x) < slot.k.w * S * 0.62 && Math.abs(py - slot.y) < 30) {
        selectKind(slot.k === KINDS[0] ? 0 : slot.k === KINDS[1] ? 1 : 2);
        return;
      }
    }
    state.aim = clamp(p.x, PIVOT_MIN, PIVOT_MAX);
    pressStart();
  });
  scene.input.on('pointerup', pressEnd);
  scene.input.on('pointerupoutside', () => { state.holding = false; state.brace = false; });

  scene.input.keyboard.on('keydown-SPACE', () => { if (!state.holding) pressStart(); });
  scene.input.keyboard.on('keyup-SPACE', pressEnd);
  scene.input.keyboard.on('keydown-UP', () => { if (!state.holding) pressStart(); });
  scene.input.keyboard.on('keyup-UP', pressEnd);
  scene.input.keyboard.on('keydown-W', () => { if (!state.holding) pressStart(); });
  scene.input.keyboard.on('keyup-W', pressEnd);
  scene.input.keyboard.on('keydown-ONE', () => selectKind(0));
  scene.input.keyboard.on('keydown-TWO', () => selectKind(1));
  scene.input.keyboard.on('keydown-THREE', () => selectKind(2));

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'move to set the line' });
  scene.notice(LINES.open, 3000);

  /* ----------------------------------------------------------------- wind */
  function stepWind(dt) {
    wind.t -= dt;
    if (wind.t <= 0) {
      if (wind.phase === 'calm') {
        wind.phase = 'rising';
        wind.t = 1.15;
        wind.dir = r() < 0.5 ? -1 : 1;
        wind.power = clamp(0.42 + state.course * 0.14 + r() * 0.34, 0.3, 1);
        scene.sfx('whoosh');
        if (!state.gustNoticed) { state.gustNoticed = true; scene.notice(LINES.gust, 2400); }
      } else if (wind.phase === 'rising') { wind.phase = 'gusting'; wind.t = 1.5 + r() * 0.9; }
      else if (wind.phase === 'gusting') { wind.phase = 'easing'; wind.t = 1.1; }
      else { wind.phase = 'calm'; wind.t = Math.max(1.2, 3.8 - state.course * 0.5 + r() * 1.6); }
    }
    let target = 0;
    if (wind.phase === 'rising') target = wind.dir * wind.power * (1 - clamp(wind.t / 1.15, 0, 1));
    else if (wind.phase === 'gusting') target = wind.dir * wind.power;
    else if (wind.phase === 'easing') target = wind.dir * wind.power * clamp(wind.t / 1.1, 0, 1);
    wind.v = lerp(wind.v, target, Math.min(1, dt * 6));
  }

  const wrap = (v, m) => ((v % m) + m) % m;

  /* --------------------------------------------------------------- update */
  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.t += dt;

    const kl = keys.left.isDown || keys.a.isDown;
    const kr = keys.right.isDown || keys.d.isDown;
    if (kl || kr) state.aim = clamp(state.aim + (kr - kl) * 430 * dt, PIVOT_MIN, PIVOT_MAX);
    const prevPivot = state.pivot;
    state.pivot += (state.aim - state.pivot) * Math.min(1, dt * 6.5);
    const pivotVel = (state.pivot - prevPivot) / Math.max(0.0001, dt);

    if (state.holding) {
      state.holdT += dt;
      if (state.holdT > 0.26) state.brace = true;
    }

    stepWind(dt);

    state.day -= dt * (state.brace ? 2.6 : 1);
    if (state.day <= 0) { duskFall(); return; }

    /* pendulum */
    const kind = KINDS[state.kind];
    state.len = cordLen();
    const cordArt = Math.max(40, state.len / S);
    const omega2 = kind.g / cordArt;
    const amp = Math.hypot(state.theta, state.avel / Math.sqrt(omega2));
    if (state.phase === 'swing' && amp < 0.4 && state.rest <= 0) state.avel += (state.avel >= 0 ? 1 : -1) * 1.1 * dt;
    state.avel += -omega2 * Math.sin(state.theta) * dt;
    state.avel *= Math.exp(-kind.damp * dt);
    state.avel -= clamp((pivotVel / Math.max(80, state.len)) * Math.cos(state.theta) * 0.5, -6, 6) * dt;
    state.theta += state.avel * dt;
    if (Math.abs(state.theta) > 1.02) { state.theta = Math.sign(state.theta) * 1.02; state.avel *= -0.3; }

    /* lean dynamics */
    const exposure = 0.45 + state.stackArt / Math.max(40, MARKERS[state.course]);
    const push = wind.v * WIND_PUSH * exposure * (state.brace ? 0.35 : 1) * S;
    const target = clamp(state.com, -TOL0, TOL0) * 0.8 * hFactor() * S + push;
    state.leanV += (target - state.lean) * 5.4 * dt;
    state.leanV *= Math.exp(-(state.brace ? 7.5 : 1.7) * dt);
    state.lean += state.leanV * dt;
    state.wob *= Math.exp(-(0.95 + (state.brace ? 2.4 : 0)) * dt);
    state.wob = Math.max(0, state.wob + Math.abs(wind.v) * dt * 1.6);
    state.jolt *= Math.exp(-6 * dt);
    state.stress = Math.abs(state.lean) + state.wob * 0.45 * S;
    state.tol = tolerance();

    if (state.stress > tolPx() * 0.68) {
      state.creakT -= dt;
      if (state.creakT <= 0) {
        state.creakT = 0.42;
        scene.sfx('tick');
        scene.shake(80, 0.0022);
      }
    }

    if (state.stress > tolPx()) { collapse(); return; }

    /* falling stone */
    if (state.phase === 'fall' && drop) {
      drop.vy += GRAV * dt;
      drop.vx += wind.v * 26 * S * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.rot += drop.spin * dt;
      if (drop.y + drop.k.h * VS / 2 >= topY()) {
        const d = drop;
        drop = null;
        settle(d.k, d.x, d.img);
      } else if (drop.y > 520) {
        const d = drop;
        drop = null;
        slip(d.k, clamp(d.x, 40, W - 40), d.x - (CX + topOx()), d.img);
      }
    }

    if (state.reload > 0) {
      state.reload -= dt;
      if (state.reload <= 0) {
        state.reload = 0;
        bob.setTexture(KINDS[state.kind].key);
        bob.setVisible(true);
      }
    }
    if (state.rest > 0) state.rest -= dt;

    /* ---------------------------------------------------------- rendering */
    const swayPhase = time / 1000;
    stones.forEach((st, i) => {
      const mid = st.base + st.k.h / 2;
      const frac = state.stackArt > 1 ? mid / state.stackArt : 0;
      const sway = (state.lean + Math.sin(swayPhase * 6.2 + i * 0.7) * state.wob * S * 0.5
        + Math.sin(swayPhase * 34) * state.jolt * S * 0.35) * frac;
      st.bounce = Math.max(0, st.bounce - dt);
      const hop = Math.abs(Math.sin((0.26 - st.bounce) * 12)) * st.bounce * 22 * S;
      st.img.x = CX + st.ox + sway;
      st.img.y = M.Y(BASE_Y - mid * VS) - hop;
      st.img.setAngle(state.lean / S * frac * 0.5);
      st.img.setVisible(true);
    });
    plinth.x = CX + state.lean * 0.12;

    const b = bobPos();
    const loaded = state.phase === 'swing' && state.reload <= 0;
    bob.setVisible(loaded);
    bobGlow.setVisible(loaded);
    if (loaded) {
      bob.setTexture(KINDS[state.kind].key);
      bob.x = b.x;
      bob.y = M.Y(b.y);
      bob.setAngle(state.theta * 26);
      bobGlow.x = b.x;
      bobGlow.y = M.Y(b.y);
      bobGlow.setAlpha(0.32 + Math.sin(time / 320) * 0.08);
    } else if (drop) {
      drop.img.x = drop.x;
      drop.img.y = M.Y(drop.y);
      drop.img.setAngle(drop.rot * 30);
    }

    /* frame: trolley, cord, knot */
    frameG.clear();
    const tt = clamp((state.pivot - 60) / 600, 0, 1);
    const barY = M.Y(40) + 58 * S + tt * 12 * S;
    frameG.fillStyle(0x2f2013, 1);
    frameG.fillRoundedRect(state.pivot - 11 * S, barY - 7 * S, 22 * S, 12 * S, 4 * S);
    frameG.fillStyle(ACC, 0.5);
    frameG.fillCircle(state.pivot - 5 * S, barY - 1 * S, 2.2 * S);
    frameG.fillCircle(state.pivot + 5 * S, barY - 1 * S, 2.2 * S);
    const hookX = drop ? drop.x : b.x;
    const hookY = drop ? M.Y(drop.y) : M.Y(b.y);
    const hookA = drop ? drop.rot * 30 : state.theta * 26;
    const hookTop = hookY - Math.cos(hookA * Math.PI / 180) * kind.h * S * 0.4;
    frameG.lineStyle(3.4 * S, 0x6d5330, 1);
    frameG.beginPath();
    frameG.moveTo(state.pivot, barY + 3 * S);
    frameG.lineTo(hookX, hookTop);
    frameG.strokePath();
    frameG.lineStyle(1.4 * S, 0xd8b878, 0.7);
    frameG.beginPath();
    frameG.moveTo(state.pivot + 1.4 * S, barY + 3 * S);
    frameG.lineTo(hookX + 1.4 * S, hookTop);
    frameG.strokePath();
    frameG.fillStyle(0x3c2a16, 1);
    frameG.fillCircle(hookX, hookTop, 3.2 * S);

    /* guide: plumb to the predicted landing point */
    guideG.clear();
    if (state.phase === 'swing' && state.reload <= 0) {
      const pr = predict();
      const anchor = CX + topOx();
      const err = Math.abs(pr.x - anchor) / Math.max(1, topHalf());
      const col = err > 0.85 ? 0xff9a5e : err > 0.55 ? 0xffd27a : 0xb9e08a;
      const pulse = 0.32 + Math.sin(time / 260) * 0.1;
      guideG.lineStyle(1.4 * S, col, pulse * 0.7);
      for (let i = 0; i < 6; i++) {
        const t0 = i / 6, t1 = (i + 0.5) / 6;
        guideG.beginPath();
        guideG.moveTo(b.x + (pr.x - b.x) * t0, M.Y(b.y) + (M.Y(pr.y) - M.Y(b.y)) * t0);
        guideG.lineTo(b.x + (pr.x - b.x) * t1, M.Y(b.y) + (M.Y(pr.y) - M.Y(b.y)) * t1);
        guideG.strokePath();
      }
      guideG.lineStyle(2.2 * S, col, 0.5 + pulse * 0.4);
      const tickW = Math.max(10, topHalf());
      guideG.beginPath();
      guideG.moveTo(pr.x - tickW, M.Y(pr.y));
      guideG.lineTo(pr.x + tickW, M.Y(pr.y));
      guideG.strokePath();
      guideG.fillStyle(col, 0.35 + pulse * 0.3);
      guideG.fillCircle(pr.x, M.Y(pr.y), 3 * S);
    }

    /* marker line and measure rail */
    const markY = M.Y(BASE_Y - MARKERS[state.course] * VS);
    guideG.lineStyle(2 * S, ACC, 0.42 + Math.sin(time / 700) * 0.08);
    guideG.beginPath();
    guideG.moveTo(CX - 150 * S, markY);
    guideG.lineTo(CX + 150 * S, markY);
    guideG.strokePath();
    guideG.fillStyle(ACC, 0.6);
    guideG.fillTriangle(CX - 150 * S, markY, CX - 162 * S, markY - 6 * S, CX - 162 * S, markY + 6 * S);
    guideG.fillTriangle(CX + 150 * S, markY, CX + 162 * S, markY - 6 * S, CX + 162 * S, markY + 6 * S);
    const railX = CX + 196 * S;
    const railTop = M.Y(BASE_Y - MARKERS[state.course] * VS);
    const full = M.Y(BASE_Y) - railTop;
    guideG.lineStyle(2 * S, 0x2a1c10, 0.5);
    guideG.beginPath();
    guideG.moveTo(railX, M.Y(BASE_Y));
    guideG.lineTo(railX, railTop);
    guideG.strokePath();
    guideG.lineStyle(4 * S, ACC, 0.75);
    guideG.beginPath();
    guideG.moveTo(railX, M.Y(BASE_Y));
    guideG.lineTo(railX, M.Y(BASE_Y) - full * clamp(state.stackArt / MARKERS[state.course], 0, 1));
    guideG.strokePath();

    /* tolerance gauge on the other side */
    const gX = CX - 196 * S;
    const gY = M.Y(BASE_Y - 30);
    const gHalf = 52 * S;
    guideG.lineStyle(2 * S, 0x2a1c10, 0.45);
    guideG.beginPath();
    guideG.moveTo(gX - gHalf, gY);
    guideG.lineTo(gX + gHalf, gY);
    guideG.strokePath();
    const tolFrac = clamp(state.tol / (TOL0 * S), 0, 1);
    guideG.lineStyle(2 * S, 0xd8c48a, 0.5);
    guideG.beginPath();
    guideG.moveTo(gX - gHalf * tolFrac, gY);
    guideG.lineTo(gX + gHalf * tolFrac, gY);
    guideG.strokePath();
    const heat = clamp(state.stress / Math.max(1, tolPx()), 0, 1);
    guideG.fillStyle(heat > 0.8 ? 0xff8a52 : heat > 0.55 ? 0xffc46a : 0xb9e08a, 0.95);
    guideG.fillCircle(gX + clamp(state.lean / (TOL0 * S), -1, 1) * gHalf, gY, 4.4 * S);

    /* brace strap */
    braceG.clear();
    if (state.brace) {
      const h2 = Math.max(30, state.stackArt * VS);
      braceG.lineStyle(3 * S, ACC, 0.35 + Math.sin(time / 140) * 0.12);
      braceG.strokeRoundedRect(CX - 96 * S, M.Y(BASE_Y - h2 - 14 * VS), 192 * S, h2 + 22 * VS, 16 * S);
      braceG.lineStyle(1.6 * S, 0xffe6b0, 0.3);
      for (let i = 0; i < 4; i++) {
        const yy = M.Y(BASE_Y - h2 * (i + 0.5) / 4);
        braceG.beginPath();
        braceG.moveTo(CX - 104 * S, yy);
        braceG.lineTo(CX + 104 * S, yy);
        braceG.strokePath();
      }
    }

    /* wind telegraph */
    windG.clear();
    const wv = wind.v;
    if (Math.abs(wv) > 0.04) {
      const a = clamp(Math.abs(wv), 0, 1);
      const dir = Math.sign(wv);
      windG.lineStyle(2 * S, 0xf0dfae, 0.1 + a * 0.34);
      for (let i = 0; i < 7; i++) {
        const span = W + 240;
        const x = wrap(i * 173 + time * 0.34 * (0.4 + a) * dir, span) - 120;
        const y = M.Y(150 + ((i * 47) % 210));
        const len = (16 + a * 26) * S;
        windG.beginPath();
        windG.moveTo(x - len * dir, y - 5 * S);
        windG.lineTo(x, y);
        windG.lineTo(x - len * dir, y + 5 * S);
        windG.strokePath();
      }
      const gx = 858, gy = M.Y(PIVOT_Y + 62);
      windG.lineStyle(3 * S, a > 0.7 ? 0xff9d5e : ACC, 0.35 + a * 0.55);
      windG.beginPath();
      windG.moveTo(gx - 44 * dir * S, gy);
      windG.lineTo(gx + 44 * dir * S * a, gy);
      windG.strokePath();
      windG.fillStyle(a > 0.7 ? 0xff9d5e : ACC, 0.4 + a * 0.55);
      const hx = gx + 44 * dir * S * a;
      windG.fillTriangle(hx + 12 * dir * S, gy, hx - 4 * dir * S, gy - 8 * S, hx - 4 * dir * S, gy + 8 * S);
    }

    /* grass and ferns bend into the wind */
    grass.forEach((g) => {
      g.rotation = wind.v * 0.3 + Math.sin(time / 900 + g._ph) * 0.045 * (1 + Math.abs(wind.v));
      g.setAlpha(0.9 + Math.abs(wind.v) * 0.08);
    });
    herder.rotation = wind.v * 0.1;
    herder.x = 246 + wind.v * 3;
    herder.y = M.Y(440) + (state.brace ? -3 * S : Math.sin(time / 620) * 1.4);
    herder.setScale(0.82 * S * (state.brace ? 1.04 : 1));

    cache.forEach((slot, i) => {
      const on = i === state.kind;
      slot.ring.setAlpha(on ? 0.5 + Math.sin(time / 300) * 0.12 : 0);
      slot.img.y = M.Y(slot.y) - (on ? 4 * S : 0);
      slot.img.setAlpha(on ? 1 : 0.62);
      slot.img.setAngle(Math.sin(time / 900 + i) * 1.5);
    });

    minis.forEach((m, i) => {
      m.setAlpha(0.9 + Math.sin(time / 1200 + i) * 0.05);
    });

    if (Math.abs(wind.v) > 0.5 && Math.random() < dt * 8) {
      drift.emitParticleAt(wind.v > 0 ? -20 : W + 20, M.Y(300 + r() * 200), 1);
    }

    const dayFrac = clamp(state.day / DAYS[state.course], 0, 1);
    dusk.setAlpha((1 - dayFrac) * 0.4);

    /* ------------------------------------------------------------- hud */
    const heatNow = clamp(state.stress / Math.max(1, tolPx()), 0, 1);
    scene.hud({
      score: state.banked + stones.length,
      progress: dayFrac,
      hearts: state.hearts,
      extra: state.brace ? 'bracing — the light burns'
        : heatNow > 0.8 ? 'it is leaning — put weight back over'
        : heatNow > 0.55 ? 'creaking'
        : wind.phase === 'gusting' ? 'the wind has it'
        : dayFrac < 0.25 ? 'the light is going'
        : state.kind === 0 ? 'broad stone — slow and wide' : ''
    });
    scene.audio.setTension(clamp(heatNow * 0.7 + (1 - dayFrac) * 0.3, 0, 1));
  }

  update(0, 16);

  return {
    update,
    state: () => ({
      score: state.banked + stones.length,
      banked: state.banked,
      stack: stones.length,
      hearts: state.hearts,
      course: state.course + 1,
      marker: MARKERS[state.course],
      height: Math.round(state.stackArt),
      lean: Math.round(state.lean / S * 10) / 10,
      leanRate: Math.round(state.leanV / S * 10) / 10,
      com: Math.round(state.com / S * 10) / 10,
      wobble: Math.round(state.wob * 10) / 10,
      stress: Math.round(state.stress / S * 10) / 10,
      tolerance: Math.round(state.tol * 10) / 10,
      wind: Math.round(wind.v * 100) / 100,
      windPhase: wind.phase,
      bracing: state.brace,
      daylight: Math.round(state.day * 10) / 10,
      phase: state.phase,
      ready: state.phase === 'swing' && state.reload <= 0 && !state.over,
      settle: Math.round(state.rest * 100) / 100,
      kind: KINDS[state.kind].name,
      pivot: Math.round(state.pivot),
      theta: Math.round(state.theta * 100) / 100,
      over: state.over
    }),
    setPivot: (x) => { state.pivot = clamp(x, PIVOT_MIN, PIVOT_MAX); state.aim = state.pivot; },
    setSwing: (theta, av = 0) => {
      if (state.phase === 'fall') { const d = drop; drop = null; settle(d.k, d.x, d.img); }
      state.phase = 'swing';
      state.reload = 0;
      state.theta = theta;
      state.avel = av;
    },
    selectKind,
    release,
    dropTrue: () => { state.aim = CX; state.pivot = CX; state.theta = 0; state.avel = 0; release(); },
    dropOff: (side, amt = 17) => {
      const x = clamp(CX + (side < 0 ? -amt : amt), PIVOT_MIN, PIVOT_MAX);
      state.aim = x; state.pivot = x; state.theta = 0; state.avel = 0; release();
    },
    setBrace: (on) => { state.brace = !!on; state.holding = !!on; state.holdT = on ? 1 : 0; },
    setLean: (v) => { state.lean = v * S; },
    setHearts: (v) => { state.hearts = clamp(Math.round(v), 0, 3); },
    setDaylight: (v) => { state.day = clamp(v, 0.2, DAYS[state.course]); },
    forceGust: (dir) => {
      wind.dir = dir < 0 ? -1 : 1;
      wind.power = 0.95;
      wind.phase = 'gusting';
      wind.t = 2.4;
      wind.v = wind.dir * wind.power;
      if (!state.gustNoticed) { state.gustNoticed = true; scene.notice(LINES.gust, 2400); }
    },
    clear: () => {
      if (state.phase === 'fall' && drop) { const d = drop; drop = null; d.img.destroy(); }
      clearStones(true);
      state.phase = 'swing';
      state.reload = 0;
      state.rest = 0;
      state.stress = 0;
      state.jolt = 0;
      bob.setTexture(KINDS[state.kind].key);
      bob.setVisible(true);
    },
    setStones: (n) => {
      for (let i = 0; i < n && !state.over; i++) {
        if (state.phase === 'fall' && drop) { const d = drop; drop = null; settle(d.k, d.x, d.img); }
        state.phase = 'swing';
        state.reload = 0;
        settle(KINDS[state.kind], CX + topOx());
      }
      state.reload = 0;
      bob.setVisible(true);
    },
    nextCourse: () => {
      let guard = 0;
      while (!state.over && state.stackArt + 0.001 < MARKERS[state.course] && guard++ < 40) {
        if (state.phase === 'fall' && drop) { const d = drop; drop = null; settle(d.k, d.x, d.img); }
        state.phase = 'swing';
        state.reload = 0;
        settle(KINDS[state.kind], CX + topOx());
      }
      state.reload = 0;
    },
    stackTally: () => stones.map((st) => ({
      kind: st.k.name, ox: Math.round(st.ox / S * 10) / 10, base: st.base
    }))
  };
}

export default {
  id: 'amber-cairn', unit: 'stones', mood: 'amber', stars: STAR,
  create,
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
