// Fossil Brush — sixty million years, one afternoon.
// A trench in a canyon wash. Sand is a real field of depth you lift grain by
// grain; the bone under it dries out, and a hurried hand on dry bone cracks it.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-8607dafbfd11334e';

const TAU = Math.PI * 2;
const PAL = MOODS.canyon;
const ACCENT = '#ffb06a';
const STAR = [5, 9, 14];

const COLS = 220;              // grid cells across the trench (1 cell = 4 canvas px)
const CELL = 4;
const TRENCH_X = 40;
const TRENCH_W = COLS * CELL;  // 880
const WAVES = 4;
const PER_WAVE = 39;           // seconds of afternoon per tray
const DAY = WAVES * PER_WAVE;
const EXP = 0.14;              // sand depth under which bone reads as exposed
const WET_SAFE = 0.22;         // dampness at or above which bone cannot be ground
const K_SHOCK = 0.55;          // stress from lifting matrix off dry bone
const K_ABRASE = 0.46;         // stress per second of grinding bare dry bone
const BUDGET = 1.0;            // stress one bone can take before it cracks
const REF_SPEED = 120;         // cells per second: above this a stroke only grazes

const TOOLS = [
  { key: 'fb-tool-fine', name: 'fine brush', rate: 1.6, radius: 6.4, risk: 0.55,
    hardK: 3.2, slurry: 0.5, waterMul: 1.0 },
  { key: 'fb-tool-stiff', name: 'stiff brush', rate: 3.1, radius: 9.2, risk: 1.4,
    hardK: 2.0, slurry: 1.0, waterMul: 1.25 },
  { key: 'fb-tool-awl', name: 'awl', rate: 4.8, radius: 3.7, risk: 2.3,
    hardK: 0.15, slurry: 0.2, waterMul: 0.8 }
];

/* --------------------------------------------------------------- bone plans
   Every piece is a set of capsules and ellipses in grid cells, which is both
   the mask the sand covers and the art drawn underneath it, so what you feel
   is exactly what you see. */
function kindSpec(k) {
  const cap = (ax, ay, bx, by, r) => ({ t: 'c', a: [ax, ay], b: [bx, by], r });
  const ell = (cx, cy, rx, ry, rot = 0) => ({ t: 'e', c: [cx, cy], rx, ry, rot });
  switch (k) {
    case 'rib': return {
      label: 'rib', bones: 2, mass: 1.0, hx: 64, hy: 18,
      body: [cap(-52, 8, 0, -2, 4.3), cap(0, -2, 50, 8, 4.0), ell(-58, 10, 6, 5, -0.3)],
      key: [ell(4, -4, 5, 4)]
    };
    case 'vertebra': return {
      label: 'vertebra', bones: 2, mass: 0.8, hx: 30, hy: 26,
      body: [ell(0, 8, 13, 9), cap(0, 0, 0, -16, 4.2), cap(-13, 6, -26, 10, 3.0), cap(13, 6, 26, 10, 3.0)],
      key: [ell(0, -20, 6.5, 4)]
    };
    case 'skull': return {
      label: 'skull', bones: 3, mass: 1.8, hx: 50, hy: 22,
      body: [ell(-26, -2, 20, 15), cap(-30, 4, 26, 8, 7.5), cap(-34, 10, 20, 15, 4.5)],
      key: [ell(-24, -6, 7, 6), ell(-40, -2, 5, 5)]
    };
    case 'limb': return {
      label: 'metatarsal', bones: 2, mass: 1.1, hx: 58, hy: 14,
      body: [cap(-46, 0, 44, 0, 4.4), ell(-50, 0, 7, 6), ell(48, 0, 6, 5)],
      key: [ell(4, 4, 5, 4)]
    };
    case 'pelvis': return {
      label: 'pelvis', bones: 3, mass: 1.2, hx: 38, hy: 24,
      body: [cap(-26, -14, 14, -10, 7.5), ell(-4, 4, 12, 9), cap(12, -8, 30, 14, 5)],
      key: [ell(-6, 2, 6.5, 6)]
    };
    case 'tooth': return {
      label: 'tooth', bones: 1, mass: 0.3, hx: 16, hy: 20,
      body: [cap(-8, 12, 7, -12, 6), ell(-10, 14, 6, 5)],
      key: [ell(4, -8, 4, 4)]
    };
    default: return {
      label: 'gastralia', bones: 1, mass: 0.35, hx: 28, hy: 10,
      body: [cap(-24, 5, 22, -5, 3.6)],
      key: [ell(-24, 5, 4.5, 4)]
    };
  }
}

const PLANS = [
  [['rib', 0.24, 0.30], ['vertebra', 0.70, 0.30], ['tooth', 0.44, 0.74]],
  [['limb', 0.26, 0.30], ['rib', 0.74, 0.28], ['gastralia', 0.50, 0.72]],
  [['skull', 0.28, 0.30], ['vertebra', 0.76, 0.32], ['tooth', 0.50, 0.76]],
  [['pelvis', 0.24, 0.32], ['limb', 0.72, 0.28], ['vertebra', 0.46, 0.76]]
];

/* -------------------------------------------------------------------- art */
function art(scene, cols, rows) {
  canvasTex(scene, 'fb-tool-fine', 168, 62, (c) => {
    c.save();
    c.translate(20, 46);
    c.rotate(-0.42);
    const h = c.createLinearGradient(0, -5, 120, 6);
    h.addColorStop(0, '#7a5a34'); h.addColorStop(0.35, '#b08a52'); h.addColorStop(1, '#5a3f24');
    c.fillStyle = h; c.beginPath();
    c.moveTo(26, -4); c.lineTo(128, -7); c.quadraticCurveTo(140, 0, 128, 7);
    c.lineTo(26, 5); c.quadraticCurveTo(20, 0.5, 26, -4); c.closePath(); c.fill();
    c.fillStyle = '#c9cdd2'; c.fillRect(14, -5, 12, 10);
    c.strokeStyle = '#d8c79a'; c.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      c.beginPath(); c.moveTo(14, -4 + i); c.quadraticCurveTo(-2, -6 + i * 1.4, -16, 2 + i * 1.1); c.stroke();
    }
    c.restore();
    grain(c, 168, 62, 0.03, 44);
  });

  canvasTex(scene, 'fb-tool-stiff', 168, 62, (c) => {
    c.save();
    c.translate(24, 46);
    c.rotate(-0.42);
    const h = c.createLinearGradient(0, -7, 120, 8);
    h.addColorStop(0, '#4a3a2c'); h.addColorStop(0.4, '#8b6b45'); h.addColorStop(1, '#3a2b1e');
    c.fillStyle = h; c.beginPath();
    c.moveTo(24, -7); c.lineTo(130, -9); c.quadraticCurveTo(144, 0, 130, 9);
    c.lineTo(24, 7); c.quadraticCurveTo(17, 0, 24, -7); c.closePath(); c.fill();
    c.fillStyle = '#aab2b8'; c.fillRect(10, -8, 16, 16);
    c.strokeStyle = '#a98f5c'; c.lineWidth = 2.6;
    for (let i = 0; i < 8; i++) {
      c.beginPath(); c.moveTo(10, -7 + i * 2); c.lineTo(-16, -9 + i * 2.4); c.stroke();
    }
    c.restore();
    grain(c, 168, 62, 0.035, 91);
  });

  canvasTex(scene, 'fb-tool-awl', 168, 62, (c) => {
    c.save();
    c.translate(22, 46);
    c.rotate(-0.42);
    const h = c.createLinearGradient(40, -8, 130, 8);
    h.addColorStop(0, '#6a4b2c'); h.addColorStop(0.5, '#9c7444'); h.addColorStop(1, '#43301d');
    c.fillStyle = h; c.beginPath();
    c.moveTo(44, -8); c.lineTo(128, -6); c.quadraticCurveTo(140, 0, 128, 6);
    c.lineTo(44, 8); c.closePath(); c.fill();
    const m = c.createLinearGradient(0, -4, 44, 4);
    m.addColorStop(0, '#e8eef2'); m.addColorStop(0.6, '#98a5ad'); m.addColorStop(1, '#6d7880');
    c.fillStyle = m; c.beginPath();
    c.moveTo(46, -7); c.lineTo(46, 7); c.lineTo(4, 1); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(44, -3); c.lineTo(6, 0.6); c.stroke();
    c.restore();
    grain(c, 168, 62, 0.03, 173);
  });

  canvasTex(scene, 'fb-dish', 92, 62, (c) => {
    const rand = rng(771);
    const g = c.createLinearGradient(6, 12, 86, 56);
    g.addColorStop(0, '#8d6f52'); g.addColorStop(0.5, '#5e4531'); g.addColorStop(1, '#33231a');
    c.fillStyle = g; c.beginPath();
    c.moveTo(10, 20); c.quadraticCurveTo(4, 46, 20, 54); c.quadraticCurveTo(46, 61, 72, 53);
    c.quadraticCurveTo(88, 44, 82, 20); c.quadraticCurveTo(46, 12, 10, 20); c.closePath(); c.fill();
    const w = c.createLinearGradient(20, 22, 74, 40);
    w.addColorStop(0, '#4d7f8c'); w.addColorStop(1, '#26505f');
    c.fillStyle = w; c.beginPath(); c.ellipse(46, 27, 32, 10, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(210,240,246,0.5)'; c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(46, 27, 32, 10, 0, Math.PI, TAU); c.stroke();
    c.fillStyle = 'rgba(230,245,250,0.35)';
    for (let i = 0; i < 7; i++) c.fillRect(24 + i * 7, 20 + rand() * 6, 3, 1.4);
    grain(c, 92, 62, 0.04, 313);
  });

  canvasTex(scene, 'fb-floor', 440, Math.max(64, Math.round(rows * 2)), (c, w, h) => {
    const rand = rng(20260129);
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#8a5a3c'); g.addColorStop(0.45, '#6d4230'); g.addColorStop(1, '#4d2c22');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(36,20,16,0.32)';
    for (let i = 0; i < 34; i++) {
      c.lineWidth = 0.8 + rand() * 2.2;
      const y = rand() * h;
      c.beginPath(); c.moveTo(-10, y);
      for (let x = 0; x <= w + 10; x += 40) c.lineTo(x, y + Math.sin(x * 0.03 + i) * 3);
      c.stroke();
    }
    c.fillStyle = 'rgba(246,214,164,0.10)';
    for (let i = 0; i < 150; i++) {
      c.beginPath(); c.arc(rand() * w, rand() * h, 0.8 + rand() * 3.4, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(28,16,14,0.26)';
    for (let i = 0; i < 46; i++) {
      const x = rand() * w, y = rand() * h, r = 2 + rand() * 5;
      c.beginPath(); c.ellipse(x, y, r, r * 0.6, rand() * 3, 0, TAU); c.fill();
    }
    grain(c, w, h, 0.06, 812);
  });
}

/* ----------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M;
  const portrait = M.portrait;
  const band = M.band;
  const ROWS = portrait ? 150 : 75;
  const cellY = CELL / band;                       // stage units per cell, keeps pixels square
  const trenchY = portrait ? 112 : 140;
  const trenchH = ROWS * cellY;
  const trenchCY = trenchY + trenchH / 2;
  const pileY = trenchY + trenchH + (portrait ? 46 : 34);
  const K = scene.k;

  const col = (h) => Phaser.Display.Color.HexStringToColor(h).color;
  const ACC = col(ACCENT);
  const SAND_DRY = [col('#d9b06f'), col(PAL.mist), col('#c99b5f')];
  const SAND_WET = col('#5c3a26');
  const CON_COL = col('#4b3a2c');

  art(scene, COLS, ROWS);
  const r = rng(290112 + (portrait ? 7 : 0));

  /* ------------------------------------------------------------ the field */
  const cells = COLS * ROWS;
  const sand = new Float32Array(cells);   // sand depth over the floor 0..1
  const wet = new Float32Array(cells);    // dampness 0..1
  const con = new Float32Array(cells);    // concretion hardness 0..1
  const mat = new Uint8Array(cells);      // 0 matrix, 1 bone, 2 key region
  const tone = new Uint8Array(cells);     // per cell colour jitter, keeps sand painterly
  const owner = new Int16Array(cells);    // piece index, -1 for matrix
  const exposed = new Uint8Array(cells);  // bone cells already cleaned
  const depthRnd = rng('fb-tone');
  for (let i = 0; i < cells; i++) tone[i] = Math.floor(depthRnd() * 256);

  const fossilTex = canvasTex(scene, 'fb-fossil', COLS, ROWS, (c) => c.clearRect(0, 0, COLS, ROWS));
  const sandTex = canvasTex(scene, 'fb-sand', COLS, ROWS, (c) => c.clearRect(0, 0, COLS, ROWS));
  const fossilCtx = fossilTex.getContext();
  const sandCtx = sandTex.getContext();
  const sandImgData = sandCtx.createImageData(COLS, ROWS);

  /* ------------------------------------------------------------- scenery
     the trench is a stage rectangle, and on a phone the stage is squeezed into a
     band that starts 560 units down the screen: anything placed at a raw stage y
     lands in the sky, which is exactly where the dig surface used to be drawn. */
  const digCY = M.Y(trenchCY);
  const digH = trenchH * band;
  const rim = scene.add.graphics().setDepth(6);
  const floor = scene.add.image(TRENCH_X + TRENCH_W / 2, digCY, 'fb-floor')
    .setDisplaySize(TRENCH_W, digH).setDepth(7);
  const frame = scene.add.graphics().setDepth(13);
  const shadowImg = scene.add.image(TRENCH_X + TRENCH_W / 2 + 1.6, M.Y(trenchCY + cellY * 1.1), 'fb-sand')
    .setDisplaySize(TRENCH_W, digH).setDepth(8).setTint(0x2a1712).setAlpha(0.4);
  const boneImg = scene.add.image(TRENCH_X + TRENCH_W / 2, digCY, 'fb-fossil')
    .setDisplaySize(TRENCH_W, digH).setDepth(8.5);
  const sandImg = scene.add.image(TRENCH_X + TRENCH_W / 2, digCY, 'fb-sand')
    .setDisplaySize(TRENCH_W, digH).setDepth(9);

  const light = scene.add.image(600, digCY, 'arc-glow').setDepth(10)
    .setScale(portrait ? 5.4 : 3.4, portrait ? 5.4 * band : 3.4)
    .setAlpha(0.3).setTint(ACC).setBlendMode(Phaser.BlendModes.ADD);
  const warm = scene.add.rectangle(TRENCH_X + TRENCH_W / 2, digCY, TRENCH_W + 40, digH + 30 * band, ACC, 0)
    .setDepth(11).setBlendMode(Phaser.BlendModes.ADD);
  const shade = scene.add.rectangle(TRENCH_X + TRENCH_W / 2, digCY, TRENCH_W + 40, digH + 30 * band,
    col('#1a0f14'), 0).setDepth(12);

  const trails = scene.add.graphics().setDepth(19);
  const marks = scene.add.graphics().setDepth(12.5);

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 22, max: 96 }, angle: { min: 190, max: 350 }, lifespan: { min: 480, max: 1080 },
    scale: { start: 0.42, end: 0.02 }, alpha: { start: 0.6, end: 0 },
    tint: [col('#e6c692'), col('#d3a76a'), col('#f0dcae')], gravityY: 130, emitting: false
  }).setDepth(15);
  const grit = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 30, max: 90 }, angle: { min: 200, max: 340 }, lifespan: { min: 260, max: 520 },
    scale: { start: 0.34, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [col('#ffe9bd'), ACC],
    gravityY: 240, emitting: false
  }).setDepth(16);
  const steam = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 12, max: 34 }, angle: { min: 250, max: 290 }, lifespan: { min: 700, max: 1400 },
    scale: { start: 0.6, end: 1.5 }, alpha: { start: 0.22, end: 0 }, tint: col('#f3e3cc'),
    emitting: false
  }).setDepth(16);
  const drips = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 20, max: 70 }, angle: { min: 240, max: 300 }, lifespan: { min: 320, max: 620 },
    scale: { start: 0.34, end: 0 }, alpha: { start: 0.85, end: 0 }, tint: [col('#8fd0e0'), col('#d8f4fa')],
    gravityY: 420, emitting: false
  }).setDepth(16);

  const brushImg = scene.add.image(-400, -400, 'fb-tool-fine')
    .setOrigin(22 / 168, 48 / 62).setDepth(20).setScale(K * 0.62).setVisible(false);

  /* ------------------------------------------------------- tool pile + dish
     the shelf sits under the trench, so it lives in stage space and is mapped
     through M.Y when drawn: the hit test and the probe read the stage numbers. */
  const pile = scene.add.graphics().setDepth(12);
  const pileSlots = TOOLS.map((t, i) => ({ x: TRENCH_X + 34 + i * 96, y: pileY }));
  const pileImgs = TOOLS.map((t, i) => scene.add.image(pileSlots[i].x + 16, M.Y(pileSlots[i].y), t.key)
    .setOrigin(0.5, 0.5).setDepth(13).setScale(K * 0.42).setAlpha(0.86));
  const pileRing = scene.add.graphics().setDepth(14);
  const dishX = TRENCH_X + TRENCH_W - 46, dishY = pileY;
  const dish = scene.add.image(dishX, M.Y(dishY), 'fb-dish')
    .setDepth(13).setScale(K * 0.6).setOrigin(0.5, 0.5);
  const dishGauge = scene.add.graphics().setDepth(14);

  /* ------------------------------------------------------------- run state */
  const st = {
    day: 0, wave: -1, banked: 0, hearts: 3, over: false, clock: 1,
    water: 1, removed: 0, steps: 0, cracks: 0, exposedTotal: 0, boneCellsTotal: 0,
    maxBones: 0, trayClear: 0, deadline: PER_WAVE
  };
  const brush = {
    on: false, x: 0, y: 0, px: 0, py: 0, speed: 0, travel: 0, spraying: false,
    downT: 0, moved: 0, dwell: 0
  };
  const accTouch = new Float64Array(4);
  const accAbra = new Float64Array(4);
  const accRem = new Float64Array(4);
  let scrapeT = 0;
  let pieces = [];
  let toolIdx = 0;
  const tool = () => TOOLS[toolIdx];

  const toCol = (sx) => (sx - TRENCH_X) / CELL;
  const toRow = (sy) => (sy - trenchY) / cellY;
  const toStageX = (c) => TRENCH_X + c * CELL;
  const toStageY = (rr) => trenchY + rr * cellY;
  const inTrench = (sx, sy) => sx >= TRENCH_X && sx <= TRENCH_X + TRENCH_W && sy >= trenchY && sy <= trenchY + trenchH;

  /* ------------------------------------------------------- geometry helpers */
  function primMask(p, prim) {
    if (prim.t === 'c') {
      const [ax, ay] = prim.a, [bx, by] = prim.b;
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1;
      let t = ((p[0] - ax) * dx + (p[1] - ay) * dy) / len2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = ax + dx * t - p[0], qy = ay + dy * t - p[1];
      return Math.hypot(qx, qy) <= prim.r;
    }
    const [cx, cy] = prim.c, cos = Math.cos(-prim.rot), sin = Math.sin(-prim.rot);
    const dx = p[0] - cx, dy = p[1] - cy;
    const u = (dx * cos - dy * sin) / prim.rx, v = (dx * sin + dy * cos) / prim.ry;
    return u * u + v * v <= 1;
  }

  function primPath(c, prim) {
    if (prim.t === 'c') {
      const [ax, ay] = prim.a, [bx, by] = prim.b;
      const ang = Math.atan2(by - ay, bx - ax);
      c.moveTo(bx + Math.cos(ang) * prim.r, by + Math.sin(ang) * prim.r);
      c.arc(bx, by, prim.r, ang, ang + Math.PI);
      c.arc(ax, ay, prim.r, ang + Math.PI, ang + TAU);
      c.closePath();
    } else {
      const [cx, cy] = prim.c;
      c.moveTo(cx + prim.rx, cy);
      c.ellipse(cx, cy, prim.rx, prim.ry, prim.rot, 0, TAU);
    }
  }

  /* ------------------------------------------------------------ the fossil */
  function drawFossil() {
    const c = fossilCtx;
    c.clearRect(0, 0, COLS, ROWS);
    for (const p of pieces) {
      if (!p.live) continue;
      c.save();
      c.translate(p.cx, p.cy);
      c.rotate(p.rot);
      // seating shadow so the bone sits in the matrix, not on top of it
      c.save();
      c.translate(0.7, 0.9);
      c.fillStyle = 'rgba(26,14,10,0.3)';
      c.beginPath();
      for (const prim of p.spec.body) primPath(c, prim);
      for (const prim of p.spec.key) primPath(c, prim);
      c.fill();
      c.restore();

      const g = c.createLinearGradient(-p.spec.hx, -p.spec.hy, p.spec.hx, p.spec.hy);
      g.addColorStop(0, '#f6ecd0'); g.addColorStop(0.42, '#dfcba0'); g.addColorStop(1, '#a68c62');
      c.fillStyle = g;
      c.beginPath();
      for (const prim of p.spec.body) primPath(c, prim);
      c.fill();
      c.strokeStyle = 'rgba(96,72,44,0.75)'; c.lineWidth = 1.1; c.stroke();

      const kg = c.createLinearGradient(-10, -10, 12, 12);
      kg.addColorStop(0, '#fff6de'); kg.addColorStop(1, '#cbb287');
      c.fillStyle = kg;
      c.beginPath();
      for (const prim of p.spec.key) primPath(c, prim);
      c.fill();
      c.strokeStyle = 'rgba(255,232,180,0.6)'; c.lineWidth = 0.8; c.stroke();

      // cortical ring and trabecular hinting
      c.strokeStyle = 'rgba(120,92,58,0.34)'; c.lineWidth = 0.7;
      for (const prim of p.spec.body) {
        if (prim.t === 'c') {
          c.beginPath();
          c.moveTo(prim.a[0], prim.a[1]); c.lineTo(prim.b[0], prim.b[1]); c.stroke();
        } else {
          c.beginPath();
          c.ellipse(prim.c[0], prim.c[1], prim.rx * 0.62, prim.ry * 0.62, prim.rot, 0, TAU);
          c.stroke();
        }
      }
      const pr = rng(p.seed + 11);
      c.fillStyle = 'rgba(84,60,40,0.3)';
      for (let i = 0; i < 26; i++) {
        const x = (pr() - 0.5) * p.spec.hx * 1.7, y = (pr() - 0.5) * p.spec.hy * 1.7;
        let inside = false;
        for (const prim of p.spec.body) if (primMask([x, y], prim)) { inside = true; break; }
        if (!inside) continue;
        c.beginPath(); c.arc(x, y, 0.5 + pr() * 1.1, 0, TAU); c.fill();
      }
      for (const cr of p.crackLines) {
        c.strokeStyle = 'rgba(30,16,12,0.85)'; c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(cr[0][0], cr[0][1]);
        for (let i = 1; i < cr.length; i++) c.lineTo(cr[i][0], cr[i][1]);
        c.stroke();
        c.strokeStyle = 'rgba(255,244,214,0.4)'; c.lineWidth = 0.6;
        c.beginPath(); c.moveTo(cr[0][0] + 0.8, cr[0][1] - 0.8);
        for (let i = 1; i < cr.length; i++) c.lineTo(cr[i][0] + 0.8, cr[i][1] - 0.8);
        c.stroke();
      }
      c.restore();
    }
    fossilTex.refresh();
  }

  /* ----------------------------------------------------------- wave layout */
  function rasterize(p) {
    const cos = Math.cos(p.rot), sin = Math.sin(p.rot);
    const x0 = Math.max(0, Math.floor(p.cx - p.spec.hx - 2));
    const x1 = Math.min(COLS - 1, Math.ceil(p.cx + p.spec.hx + 2));
    const y0 = Math.max(0, Math.floor(p.cy - p.spec.hy - 2));
    const y1 = Math.min(ROWS - 1, Math.ceil(p.cy + p.spec.hy + 2));
    let n = 0, nk = 0, bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const dx = xx + 0.5 - p.cx, dy = yy + 0.5 - p.cy;
        const lx = dx * cos + dy * sin, ly = -dx * sin + dy * cos;
        let isKey = false, isBody = false;
        for (const prim of p.spec.key) if (primMask([lx, ly], prim)) { isKey = true; break; }
        if (!isKey) for (const prim of p.spec.body) if (primMask([lx, ly], prim)) { isBody = true; break; }
        if (!isKey && !isBody) continue;
        const i = yy * COLS + xx;
        if (mat[i]) continue;                       // one bone per cell
        mat[i] = isKey ? 2 : 1;
        owner[i] = p.idx;
        if (xx < bx0) bx0 = xx;
        if (xx > bx1) bx1 = xx;
        if (yy < by0) by0 = yy;
        if (yy > by1) by1 = yy;
        if (isKey) { p.keyCells.push(i); nk++; } else n++;
      }
    }
    p.boneCells = n + nk;
    p.keyCount = nk;
    p.box = { x0: bx0, y0: by0, x1: bx1, y1: by1 };
    return p.boneCells;
  }

  function plant(kind, fx, fy, rot) {
    const spec = kindSpec(kind);
    const cx = clamp(fx * COLS, spec.hx + 3, COLS - spec.hx - 3);
    const cy = clamp(fy * ROWS, spec.hy + 3, ROWS - spec.hy - 3);
    const p = {
      idx: pieces.length, kind, spec, cx, cy, rot, live: true, done: false, lost: false,
      cracks: 0, stress: 0, seed: Math.floor(r() * 1e6), crackLines: [],
      boneCells: 0, keyCount: 0, keyCells: [], keyLeft: 0, left: 0, keyDone: false,
      credit: 0, name: spec.label
    };
    pieces.push(p);
    return p;
  }

  function seedConcretions() {
    const cr = rng(4100 + st.wave * 17);
    for (const p of pieces) {
      const lumps = p.kind === 'tooth' || p.kind === 'gastralia' ? 2 : 3;
      for (let l = 0; l < lumps; l++) {
        const rad = 5 + cr() * 5;
        const lx = p.cx + (cr() - 0.5) * p.spec.hx * 1.6;
        const ly = p.cy + (cr() - 0.5) * p.spec.hy * 1.4;
        const x0 = Math.max(0, Math.floor(lx - rad)), x1 = Math.min(COLS - 1, Math.ceil(lx + rad));
        const y0 = Math.max(0, Math.floor(ly - rad)), y1 = Math.min(ROWS - 1, Math.ceil(ly + rad));
        for (let yy = y0; yy <= y1; yy++) {
          for (let xx = x0; xx <= x1; xx++) {
            const d = Math.hypot(xx - lx, yy - ly) / rad;
            if (d > 1) continue;
            const i = yy * COLS + xx;
            con[i] = Math.min(1, con[i] + (1 - d * d) * (0.7 + cr() * 0.3));
          }
        }
      }
    }
    for (let l = 0; l < 5; l++) {                       // stray lumps in the matrix
      const lx = 10 + cr() * (COLS - 20), ly = 8 + cr() * (ROWS - 16), rad = 4 + cr() * 6;
      const x0 = Math.max(0, Math.floor(lx - rad)), x1 = Math.min(COLS - 1, Math.ceil(lx + rad));
      const y0 = Math.max(0, Math.floor(ly - rad)), y1 = Math.min(ROWS - 1, Math.ceil(ly + rad));
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const d = Math.hypot(xx - lx, yy - ly) / rad;
          if (d > 1) continue;
          con[yy * COLS + xx] = Math.min(1, con[yy * COLS + xx] + (1 - d) * 0.6);
        }
      }
    }
  }

  function layoutWave() {
    st.wave++;
    if (st.wave >= WAVES) { endRun(); return; }
    pieces = [];
    mat.fill(0); owner.fill(-1); exposed.fill(0); con.fill(0);
    sand.fill(1);
    for (let i = 0; i < cells; i++) wet[i] = 0.26 + depthRnd() * 0.07;
    st.water = 1;
    st.boneCellsTotal = 0;
    const plan = PLANS[st.wave];
    for (let i = 0; i < plan.length; i++) {
      const rot = i === 2 ? (r() - 0.5) * 0.9 : (r() - 0.5) * 0.4;
      plant(plan[i][0], plan[i][1], plan[i][2], rot);
    }
    for (const p of pieces) {
      p.left = rasterize(p);
      p.keyLeft = p.keyCells.length;
      st.boneCellsTotal += p.boneCells;
      st.maxBones += p.spec.bones + 1;
      p.frag = clamp(1 / Math.max(0.45, p.spec.mass), 0.5, 1.7);
    }
    seedConcretions();
    st.exposedTotal = 0;
    st.trayClear = 0;
    st.deadline = Math.min((st.wave + 1) * PER_WAVE, st.day + PER_WAVE);
    drawFossil();
    scene.notice('tray ' + (st.wave + 1) + ' of ' + WAVES + ' — ' +
      pieces.map((p) => p.name).join(', ') + ' in the matrix', 2600);
  }

  function nextWave() {
    if (st.over) return;
    if (st.wave + 1 >= WAVES) { endRun(); return; }
    st.trayClear = 0;
    layoutWave();
    scene.sfx('chime');
  }

  /* --------------------------------------------------------------- brushing */
  function setSand(i, v) {
    const nv = v < 0 ? 0 : v > 1 ? 1 : v;
    const was = exposed[i];
    sand[i] = nv;
    if (!mat[i]) { exposed[i] = 0; return; }
    const now = nv <= EXP ? 1 : 0;
    if (now === was) return;
    exposed[i] = now;
    const p = pieces[owner[i]];
    if (!p || !p.live) return;
    if (now) {
      p.left--; st.exposedTotal++;
      if (mat[i] === 2) {
        p.keyLeft--;
        if (p.keyLeft === 0 && !p.keyDone) { p.keyDone = true; p.credit = 1; }
      }
      if (Math.random() < 0.03 && grit.count < 46) {
        grit.explode(1, toStageX(i % COLS) + 2, M.Y(toStageY(Math.floor(i / COLS)) + cellY / 2));
      }
      if (p.left <= 0) complete(p);
    } else {
      p.left++; st.exposedTotal--;
      if (mat[i] === 2) p.keyLeft++;
    }
  }

  function brushStamp(gx, gy, speed, dt) {
    const t = tool();
    const rad = t.radius * (portrait ? 1.18 : 1);
    const slow = 1 - clamp(speed / REF_SPEED, 0, 1);
    const power = t.rate * (0.32 + 0.68 * slow) * dt;
    if (power <= 0) return 0;
    const x0 = Math.max(0, Math.floor(gx - rad * 1.9)), x1 = Math.min(COLS - 1, Math.ceil(gx + rad * 1.9));
    const y0 = Math.max(0, Math.floor(gy - rad * 1.9)), y1 = Math.min(ROWS - 1, Math.ceil(gy + rad * 1.9));
    let removed = 0, slurry = 0;
    for (let k = 0; k < 4; k++) { accTouch[k] = 0; accAbra[k] = 0; accRem[k] = 0; }
    for (let yy = y0; yy <= y1; yy++) {
      const dyy = yy + 0.5 - gy;
      for (let xx = x0; xx <= x1; xx++) {
        const dxx = xx + 0.5 - gx;
        const d = Math.hypot(dxx, dyy) / rad;
        if (d > 1) continue;
        const i = yy * COLS + xx;
        const w = 1 - d * d;
        const before = sand[i];
        let rem = 0;
        if (before > 0.001) {
          const eff = power * w / (1 + con[i] * t.hardK);
          rem = before < eff ? before : eff;
          if (rem > 0) {
            removed += rem;
            slurry += rem * wet[i];
            setSand(i, before - rem);
          }
        }
        if (con[i] > 0 && t.hardK < 0.4) con[i] = Math.max(0, con[i] - (rem * 0.9 + power * w * 0.3));
        const m = mat[i];
        if (m) {
          const pi = owner[i];
          const p = pieces[pi];
          if (p && p.live) {
            const dry = clamp(1 - wet[i] / WET_SAFE, 0, 1);
            accTouch[pi]++;
            if (dry > 0.02) {
              const protect = clamp(before / 0.35, 0, 1);
              accAbra[pi] += (1 - protect) * dry;
              accRem[pi] += rem * dry * lerp(1, 0.18, protect);
            }
          }
        }
      }
    }
    // a wet stroke leaves a thin mud film on the clean bone just outside the
    // brush: you can see it, and you have to go over it again, but it is the
    // wash itself (see dampenStamp) that can bury bone you had already freed
    if (slurry > 0.004 && t.slurry > 0.3) {
      for (let yy = y0; yy <= y1; yy++) {
        const dyy = yy + 0.5 - gy;
        for (let xx = x0; xx <= x1; xx++) {
          const d = Math.hypot(xx + 0.5 - gx, dyy) / rad;
          if (d < 0.9 || d > 1.8) continue;
          const i = yy * COLS + xx;
          if (sand[i] >= 0.1) continue;
          setSand(i, sand[i] + Math.min(0.1 - sand[i], slurry * 0.0015 * t.slurry));
        }
      }
    }
    for (let pi = 0; pi < pieces.length; pi++) {
      const p = pieces[pi];
      if (!p.live || !accTouch[pi]) continue;
      // what the bone under the brush actually feels: the mean dryness it was
      // ground at, plus the matrix that came off it while it was dry. Small
      // fragile pieces take this harder than a big skull does.
      p.stress += t.risk * p.frag * (K_ABRASE * dt * accAbra[pi] / accTouch[pi]
        + K_SHOCK * accRem[pi] / accTouch[pi]);
      let guard = 0;
      while (p.live && p.stress >= BUDGET && guard++ < 3) {
        p.stress -= BUDGET * 0.85;
        crack(p);
      }
    }
    st.removed += removed;
    return removed;
  }

  function crack(p) {
    p.cracks++;
    st.cracks++;
    const cr = rng(p.seed + p.cracks * 31);
    const line = [];
    const y0 = (cr() - 0.5) * p.spec.hy * 1.2;
    for (let i = 0; i <= 8; i++) {
      line.push([(i / 8 - 0.5) * p.spec.hx * 1.9, y0 + (cr() - 0.5) * p.spec.hy * 0.8]);
    }
    p.crackLines.push(line);
    drawFossil();
    scene.sfx('bad');
    scene.shake(220, 0.009);
    scene.cameras.main.flash(120, 90, 60, 40);
    const px = toStageX(p.cx), py = toStageY(p.cy);
    scene.burst(px, M.Y(py), 0xf1dcae, 12, { life: 560, gravity: 260, scale: 0.5 });
    scene.popText(px, M.Y(py - p.spec.hy * cellY - 14), 'it cracked', '#ffb1a1');
    if (p.cracks >= 3) shatter(p);
    else scene.notice('the ' + p.name + ' cracked — dampen it before you brush again', 2200);
  }

  function shatter(p) {
    p.live = false; p.lost = true;
    for (const i of p.keyCells) if (mat[i] === 2) mat[i] = 1;
    scene.sfx('boom');
    scene.shake(420, 0.016);
    const px = toStageX(p.cx), py = toStageY(p.cy);
    scene.burst(px, M.Y(py), 0xd8b487, 22, { life: 760, gravity: 380, scale: 0.6, spin: true });
    scene.popText(px, M.Y(py - 20), 'gone to powder', '#ff9f8a');
    st.hearts--;
    if (st.hearts <= 0) { endRun(false); return; }
    scene.notice('a bone went to powder in your hand — three of those and the day is lost', 2400);
  }

  function complete(p) {
    p.done = true; p.live = false;
    const intact = clamp(1 - 0.2 * p.cracks, 0.2, 1);
    const gained = Math.max(1, Math.round((p.spec.bones + (p.keyDone ? 1 : 0)) * intact));
    st.banked += gained;
    scene.sfx('good');
    scene.sfx('chime');
    const px = toStageX(p.cx), py = toStageY(p.cy);
    scene.burst(px, M.Y(py), 0xffd77a, 22, { life: 860, gravity: 150, spin: true });
    scene.burst(px, M.Y(py), 0xf3e2bb, 14, { life: 620, gravity: 90, scale: 0.5 });
    scene.popText(px, M.Y(py - p.spec.hy * cellY - 10), '+' + gained + ' ' +
      (gained === 1 ? 'bone' : 'bones'), '#ffe6a8');
    if (p.keyDone) scene.popText(px + 60, M.Y(py - 4), 'the joint came out clean', '#c8f0ff');
    scene.shake(120, 0.004);
    const live = pieces.filter((q) => q.live);
    if (live.length === 0 && !st.trayClear) st.trayClear = 1.1;
  }

  function endRun(win) {
    if (st.over) return;
    st.over = true;
    const ok = win === undefined ? st.banked >= STAR[0] : win;
    scene.hud({ score: st.banked, progress: clamp(st.banked / st.maxBones, 0, 1), hearts: Math.max(0, st.hearts), extra: 'the light is off the trench' });
    scene.finish(ok, {
      score: st.banked,
      note: ok
        ? st.banked + ' bones out of the wash, ' + st.cracks + ' crack' + (st.cracks === 1 ? '' : 's') + ' to show for it'
        : st.hearts <= 0 ? 'three bones went to powder before the light failed'
          : 'the afternoon ended with ' + st.banked + ' bones free and the rest still in the matrix'
    });
  }

  /* ------------------------------------------------------------- dampening */
  function dampenStamp(gx, gy, dt) {
    if (st.water <= 0) return false;
    const t = tool();
    const rad = t.radius * 2.3 * (portrait ? 1.15 : 1);
    const x0 = Math.max(0, Math.floor(gx - rad)), x1 = Math.min(COLS - 1, Math.ceil(gx + rad));
    const y0 = Math.max(0, Math.floor(gy - rad)), y1 = Math.min(ROWS - 1, Math.ceil(gy + rad));
    let lift = 0;
    const bare = [];
    for (let yy = y0; yy <= y1; yy++) {
      const dyy = yy + 0.5 - gy;
      for (let xx = x0; xx <= x1; xx++) {
        const dxx = xx + 0.5 - gx;
        const d = Math.hypot(dxx, dyy) / rad;
        if (d > 1) continue;
        const i = yy * COLS + xx;
        const w = 1 - d * d;
        wet[i] = Math.min(1, wet[i] + w * dt * 4.6);
        if (sand[i] > 0.55) {
          // the wash cuts mud loose out of deep sand ...
          const v = (sand[i] - 0.55) * w * dt * 0.7;
          setSand(i, sand[i] - v);
          lift += v;
        } else if (mat[i] && sand[i] < 0.1 && d > 0.55) {
          // ... and it comes to rest on the bone you had already laid bare
          bare.push(i);
        }
      }
    }
    if (lift > 0.0004 && bare.length) {
      const per = Math.min(0.2, lift * 0.5 / bare.length);
      for (const i of bare) setSand(i, sand[i] + per);
    }
    st.water = Math.max(0, st.water - dt * 0.11 * t.waterMul);
    return true;
  }

  /* ------------------------------------------------------------ the sandbox */
  function dryOut(dt) {
    const heat = 0.03 + 0.05 * clamp(st.day / DAY, 0, 1) + 0.022 * sunStrength();
    const k = heat * dt;
    // loose grains left on bare bone have nothing holding them: the wind off
    // the wash carries a thin film away, so a smudged piece recovers if you
    // give it the afternoon. Deep sand stays put.
    const off = dt * 0.055;
    for (let i = 0; i < cells; i++) {
      if (wet[i] > 0) wet[i] = Math.max(0, wet[i] - k);
      if (mat[i] && sand[i] > 0.0005 && sand[i] <= 0.3) setSand(i, sand[i] - (sand[i] < off ? sand[i] : off));
    }
  }

  const sunStrength = () => {
    const f = clamp(st.day / DAY, 0, 1);
    return Math.sin(Math.PI * Math.min(1, f * 1.02));
  };

  function paintSand() {
    const d = sandImgData.data;
    for (let i = 0; i < cells; i++) {
      const o = i * 4;
      const s = sand[i];
      const w = wet[i];
      const cIdx = (tone[i] >> 6) % SAND_DRY.length;
      const base = SAND_DRY[cIdx];
      if (s > 0.012) {
        const t = tone[i] / 255;
        const jitter = (t - 0.5) * 26;
        const darken = w * 0.34 + clamp(con[i], 0, 1) * 0.3;
        const mixc = darken > 1 ? 1 : darken;
        const wetC = SAND_WET;
        let rr = ((base >> 16) & 255) + jitter;
        let gg = ((base >> 8) & 255) + jitter * 0.8;
        let bb = (base & 255) + jitter * 0.6;
        if (con[i] > 0.35) {
          const cm = clamp(con[i], 0, 1) * 0.42;
          rr = lerp(rr, (CON_COL >> 16) & 255, cm);
          gg = lerp(gg, (CON_COL >> 8) & 255, cm);
          bb = lerp(bb, CON_COL & 255, cm);
        }
        rr = lerp(rr, (wetC >> 16) & 255, mixc * 0.55);
        gg = lerp(gg, (wetC >> 8) & 255, mixc * 0.55);
        bb = lerp(bb, wetC & 255, mixc * 0.55);
        d[o] = rr < 0 ? 0 : rr > 255 ? 255 : rr;
        d[o + 1] = gg < 0 ? 0 : gg > 255 ? 255 : gg;
        d[o + 2] = bb < 0 ? 0 : bb > 255 ? 255 : bb;
        d[o + 3] = Math.round(clamp(s * 1.35, 0, 1) * 255);
      } else {
        // a damp sheen left on clean bone: it darkens the fossil a little, it
        // never buries it
        const film = w * (mat[i] ? 0.2 : 0.1);
        if (film < 0.02) { d[o + 3] = 0; continue; }
        d[o] = 62; d[o + 1] = 46; d[o + 2] = 34;
        d[o + 3] = Math.round(film * 255);
      }
    }
    sandCtx.putImageData(sandImgData, 0, 0);
    sandTex.refresh();
  }

  function paintTrench() {
    rim.clear();
    // the cut in the wash: a bevelled rim of undisturbed sandstone
    const x0 = TRENCH_X - 16, x1 = TRENCH_X + TRENCH_W + 16;
    const yTop = trenchY - 14, yBot = trenchY + trenchH + 14;
    rim.fillStyle(col('#7c4c33'), 1);
    rim.fillRect(x0, M.Y(yTop), x1 - x0, M.Y(yBot) - M.Y(yTop));
    rim.fillStyle(col('#5b3526'), 1);
    rim.fillRect(TRENCH_X, M.Y(trenchY), TRENCH_W, trenchH * band);
    rim.lineStyle(3 * K, col('#a9744a'), 0.55);
    rim.strokeRect(x0 + 1.5, M.Y(yTop) + 1.5, x1 - x0 - 3, M.Y(yBot) - M.Y(yTop) - 3);
    rim.lineStyle(2 * K, col('#2a1712'), 0.7);
    rim.strokeRect(TRENCH_X - 1, M.Y(trenchY) - 1, TRENCH_W + 2, trenchH * band + 2);

    frame.clear();
    for (let i = 0; i < 5; i++) {
      frame.lineStyle(1.4 * K, col('#3c241a'), 0.22);
      const y = M.Y(trenchY - 12 - i * 4);
      frame.beginPath();
      frame.moveTo(x0, y);
      for (let x = x0; x <= x1; x += 60) frame.lineTo(x, y + Math.sin(x * 0.02 + i) * 3 * band * 0.3);
      frame.strokePath();
    }
  }

  function paintPile() {
    pile.clear(); pileRing.clear(); dishGauge.clear();
    // the shelf is measured from the slots it holds - a fixed width hung off the
    // middle tool ran 32 units off the left edge of the stage in both layouts
    const last = pileSlots[pileSlots.length - 1];
    const cx = (pileSlots[0].x + last.x) / 2 + 16;
    const w = (last.x - pileSlots[0].x) + 116, h = (portrait ? 66 : 46) * K;
    const cy = pileY;
    pile.fillStyle(col('#3f271c'), 0.85);
    pile.fillRoundedRect(cx - w / 2, M.Y(cy) - h / 2, w, h, 8);
    pile.lineStyle(1.6 * K, col('#8a5a3a'), 0.6);
    pile.strokeRoundedRect(cx - w / 2, M.Y(cy) - h / 2, w, h, 8);
    const ring = pileSlots[toolIdx];
    pileRing.lineStyle(2.4 * K, ACC, 0.9);
    pileRing.strokeCircle(ring.x + 16, M.Y(ring.y), 26 * K);
    pileRing.fillStyle(ACC, 0.14);
    pileRing.fillCircle(ring.x + 16, M.Y(ring.y), 26 * K);
    for (let i = 0; i < pileImgs.length; i++) pileImgs[i].setAlpha(i === toolIdx ? 1 : 0.6);
    const dh = 7 * K;
    dishGauge.fillStyle(col('#0f2b34'), 0.8);
    dishGauge.fillRect(dishX - 26 * K, M.Y(dishY + 16 * K), 52 * K, dh);
    dishGauge.fillStyle(col('#7fd8e8'), 0.95);
    dishGauge.fillRect(dishX - 26 * K, M.Y(dishY + 16 * K), 52 * K * st.water, dh);
  }

  function drawMarks(time) {
    marks.clear();
    const f = clamp(st.day / DAY, 0, 1);
    // raking light lines showing where the sun is working
    const sx = lerp(-120, W + 120, f);
    marks.lineStyle(20 * K, ACC, 0.05 + sunStrength() * 0.05);
    for (let i = 0; i < 5; i++) {
      const x = sx + i * 46 - 92;
      marks.beginPath();
      marks.moveTo(x, M.Y(trenchY));
      marks.lineTo(x + 70, M.Y(trenchY + trenchH));
      marks.strokePath();
    }
    for (const p of pieces) {
      if (!p.live || p.left <= 0) continue;
      const frac = 1 - p.left / p.boneCells;
      if (frac < 0.02) continue;
      const y = M.Y(toStageY(p.cy) - p.spec.hy * cellY - 10 * (portrait ? 1.6 : 1));
      const bw = Math.min(120, p.spec.hx * CELL * 0.9);
      marks.fillStyle(col('#22120e'), 0.5);
      marks.fillRect(p.cx * CELL + TRENCH_X - bw / 2, y, bw, 5 * K);
      marks.fillStyle(ACC, 0.85);
      marks.fillRect(p.cx * CELL + TRENCH_X - bw / 2, y, bw * frac, 5 * K);
      if (p.keyCount && !p.keyDone) {
        const kf = 1 - p.keyLeft / p.keyCount;
        marks.fillStyle(col('#c8f0ff'), 0.8);
        marks.fillRect(p.cx * CELL + TRENCH_X - bw / 2, y + 6 * K, bw * kf * 0.6, 2.4 * K);
      }
    }
  }

  /* ---------------------------------------------------------------- step */
  function step(dt, time) {
    if (st.over || dt <= 0) return;
    st.day += dt;
    const f = clamp(st.day / DAY, 0, 1);
    dryOut(dt);

    if (st.trayClear > 0) {
      st.trayClear -= dt;
      if (st.trayClear <= 0) { nextWave(); return; }
    }
    // the afternoon is the clock: each tray only keeps the light it has left
    if (st.day >= st.deadline) { nextWave(); return; }
    if (st.day >= DAY) { endRun(); return; }

    // pointer in stage units
    const pt = scene.input.activePointer;
    if (pt.isDown && !brush.on) {
      brush.on = true;
      brush.x = pt.x; brush.y = scene.uY(pt.y);
      brush.px = brush.x; brush.py = brush.y;
      brush.downT = 0; brush.moved = 0; brush.travel = 0;
    } else if (!pt.isDown && brush.on) {
      brush.on = false; brush.spraying = false; brush.travel = 99;
    }
    if (brush.on) {
      const nx = pt.x, ny = scene.uY(pt.y);
      const ddx = nx - brush.x, ddy = ny - brush.y;
      brush.px = brush.x; brush.py = brush.y;
      brush.x = nx; brush.y = ny;
      brush.downT += dt;
      brush.moved += Math.hypot(ddx, ddy);
      const movePx = Math.hypot(nx - brush.px, ny - brush.py);
      const speedCells = dt > 0 ? (movePx / CELL) / dt : 0;
      brush.speed = speedCells;
      // a leaky window over the last quarter second: a resting hand dampens,
      // a moving hand brushes, however slowly
      brush.travel = brush.travel * Math.exp(-dt / 0.22) + movePx;
      brush.spraying = brush.travel < 5 && st.water > 0 && inTrench(nx, ny);
      if (brush.spraying) {
        dampenStamp(toCol(nx), toRow(ny), dt);
        drips.explode(2, nx, M.Y(ny));
        if (Math.random() < dt * 5) scene.sfx('splash');
      } else if (inTrench(nx, ny)) {
        const gxx = toCol(brush.px), gyy = toRow(brush.py);
        const gx2 = toCol(nx), gy2 = toRow(ny);
        const seg = Math.hypot(gx2 - gxx, gy2 - gyy);
        const rad = tool().radius;
        const n = clamp(Math.ceil(seg / (rad * 0.45)), 1, 20);
        const slice = dt / n;
        for (let k = 1; k <= n; k++) {
          const t2 = k / n;
          brushStamp(lerp(gxx, gx2, t2), lerp(gyy, gy2, t2), speedCells, slice);
        }
        brush.dwell = clamp(1 - speedCells / REF_SPEED, 0, 1);
      }
    } else {
      brush.spraying = false;
      brush.dwell = 0;
    }

    // bones left in the sun keep drying, and dry bone is a standing risk
    const brushing = brush.on && !brush.spraying && inTrench(brush.x, brush.y);
    const bx = Math.round(toCol(brush.x)), by = Math.round(toRow(brush.y));
    const atDamp = (bx >= 0 && bx < COLS && by >= 0 && by < ROWS) ? wet[by * COLS + bx] : 1;
    const dryBone = pieces.some((p) => p.live && p.stress > BUDGET * 0.45);
    const gritDry = clamp(1 - atDamp / WET_SAFE, 0, 1);
    scene.audio.setTension(clamp(
      (brushing ? gritDry * 0.72 : 0) + (dryBone ? 0.25 : 0) + (1 - st.water) * 0.1 +
      f * 0.12 + (3 - st.hearts) * 0.1, 0, 1));
    if (brushing) {
      scrapeT += dt;
      if (scrapeT > (0.1 + 0.06 * brush.dwell)) {
        scrapeT = 0;
        scene.audio.burst({
          dur: 0.08, freq: 900 + brush.dwell * 1500, q: 1.6,
          gain: 0.018 + brush.dwell * 0.022, sweep: -240
        });
      }
    }
    st.steps++;
  }

  /* --------------------------------------------------------------- render */
  function render(time) {
    const f = clamp(st.day / DAY, 0, 1);
    light.x = lerp(-140, W + 140, f);
    light.y = M.Y(trenchY + trenchH * (0.3 + 0.4 * Math.sin(Math.PI * f)));
    light.setAlpha(0.16 + sunStrength() * 0.3);
    warm.setAlpha(0.03 + sunStrength() * 0.05);
    shade.setAlpha(clamp(f - 0.62, 0, 0.38) * 0.5);
    const heat = sunStrength();
    floor.setTint((Math.round(lerp(214, 255, heat)) << 16) + (Math.round(lerp(218, 206, heat)) << 8)
      + Math.round(lerp(224, 158, heat)));

    paintSand();
    drawMarks(time);
    paintPile();

    // brush, dust and steam
    const pt = scene.input.activePointer;
    const inside = !pt.wasTouch || pt.isDown;
    const show = inside && pt.x > 0 && pt.x < W && scene.uY(pt.y) > 20 && scene.uY(pt.y) < 530;
    brushImg.setVisible(show && !st.over);
    if (show) {
      const bx = brush.on ? brush.x : pt.x;
      const by = brush.on ? brush.y : scene.uY(pt.y);
      brushImg.x = bx; brushImg.y = M.Y(by);
      brushImg.setTexture(tool().key);
      const vx = bx - brush.px, vy = (by - brush.py) * band;
      if (Math.hypot(vx, vy) > 1.2) brushImg.rotation = lerp(brushImg.rotation, -0.15 - clamp(vx / 40, -0.5, 0.5), 0.3);
      brush.px = bx; brush.py = by;
    }
    trails.clear();
    if (brush.on && inTrench(brush.x, brush.y)) {
      const rad = tool().radius * CELL;
      trails.lineStyle(1.6 * K, ACC, brush.spraying ? 0.5 : 0.35);
      trails.strokeCircle(brush.x, M.Y(brush.y), rad * (brush.spraying ? 2.2 : 1));
      if (brush.spraying) {
        trails.lineStyle(2.4 * K, col('#8fd8e8'), 0.6);
        trails.strokeCircle(brush.x, M.Y(brush.y), rad * 1.3 + Math.sin(time / 120) * 4);
      }
      if (!brush.spraying) {
        const n = 1 + Math.round(brush.dwell * 3);
        dust.explode(n, brush.x, M.Y(brush.y) + 3);
        if (Math.random() < 0.09) grit.explode(1, brush.x, M.Y(brush.y));
      } else if (Math.random() < 0.3) {
        steam.explode(1, brush.x + (Math.random() - 0.5) * rad, M.Y(brush.y) - 4);
      }
    }
    if (sunStrength() > 0.55) {
      for (const p of pieces) {
        if (!p.live) continue;
        if (wet[toIdx(p)] > 0.55 && Math.random() < 0.05) {
          steam.explode(1, toStageX(p.cx) + (Math.random() - 0.5) * 60, M.Y(toStageY(p.cy)));
        }
      }
    }
    dish.setAlpha(0.6 + st.water * 0.4);
  }

  const toIdx = (p) => Math.floor(p.cy) * COLS + Math.floor(p.cx);

  /* ---------------------------------------------------------------- input */
  function tapTool(sx, sy) {
    for (let i = 0; i < pileSlots.length; i++) {
      const s = pileSlots[i];
      if (Math.hypot(sx - (s.x + 16), (sy - s.y) * (portrait ? 2.2 : 1)) < 42 * K) {
        if (i !== toolIdx) {
          toolIdx = i;
          scene.sfx('tick');
          scene.notice(TOOLS[i].name + ' — ' + (i === 0 ? 'slow, safe, wide of a concretion'
            : i === 1 ? 'fast and deep, but it grinds dry bone'
              : 'biting through concretions; keep it off bare bone'), 2200);
        }
        return true;
      }
    }
    return false;
  }

  scene.input.on('pointerdown', (pt) => { tapTool(pt.x, scene.uY(pt.y)); });
  scene.input.on('pointerup', (pt) => {
    if (brush.moved < 10 && brush.downT > 0.05) tapTool(pt.x, scene.uY(pt.y));
  });
  const keys = scene.input.keyboard.addKeys({ one: 'ONE', two: 'TWO', three: 'THREE' });

  /* ------------------------------------------------------------------ loop */
  function update(time, delta) {
    if (scene.pausedGame || st.over) return;
    const dt = Math.min(0.05, delta / 1000) * st.clock;
    if (keys.one.isDown) toolIdx = 0;
    if (keys.two.isDown) toolIdx = 1;
    if (keys.three.isDown) toolIdx = 2;
    step(dt, time);
    render(time);
    scene.hud({
      score: st.banked,
      progress: clamp(st.banked / Math.max(1, st.maxBones), 0, 1),
      hearts: Math.max(0, st.hearts),
      extra: extraText()
    });
  }

  function boneDamp() {
    let n = 0, sum = 0;
    for (const p of pieces) {
      if (!p.live) continue;
      const i = toIdx(p);
      sum += wet[i]; n++;
    }
    return n ? sum / n : 0;
  }

  function extraText() {
    const damp = boneDamp();
    const live = pieces.filter((p) => p.live);
    return tool().name + ' · water ' + Math.round(st.water * 100) + '% · bone ' +
      (damp < 0.18 ? 'parched' : damp < 0.4 ? 'drying' : 'damp') +
      (live.length ? ' · ' + live.length + ' bone' + (live.length === 1 ? '' : 's') + ' in the tray' : '');
  }

  layoutWave();
  scene.hud({ score: 0, progress: 0, hearts: 3, extra: tool().name });
  scene.notice('drag to brush the sand · hold still to dampen the bone · tap a tool to change it', 3400);
  paintTrench();

  /* ---------------------------------------------------------- probe surface */
  function pagePoint(gx, gy) {
    const rect = scene.game.canvas.getBoundingClientRect();
    return { x: rect.left + (gx / W) * rect.width, y: rect.top + (M.Y(gy) / M.H) * rect.height };
  }

  function simStroke(gx, gy, seconds, speed) {
    let left = seconds;
    const sp = speed === undefined ? 0 : speed;
    while (left > 0.0001) {
      const s = Math.min(1 / 30, left);
      brushStamp(gx, gy, sp, s);
      left -= s;
    }
    return st.removed;
  }

  return {
    update,
    state: () => ({
      score: st.banked,
      banked: st.banked,
      maxBones: st.maxBones,
      wave: st.wave + 1,
      waves: WAVES,
      hearts: st.hearts,
      over: st.over,
      daylight: Math.round(clamp(st.day / DAY, 0, 1) * 1000) / 1000,
      secondsLeft: Math.max(0, Math.round(DAY - st.day)),
      water: Math.round(st.water * 1000) / 1000,
      damp: Math.round(boneDamp() * 1000) / 1000,
      damage: st.cracks,
      coverage: Math.round((st.exposedTotal / Math.max(1, st.boneCellsTotal)) * 1000) / 1000,
      sandRemoved: Math.round(st.removed * 100) / 100,
      tool: tool().name,
      toolIndex: toolIdx,
      stroke: {
        x: Math.round(brush.x), y: Math.round(brush.y * 100) / 100,
        speed: Math.round(brush.speed * 100) / 100,
        down: brush.on, spraying: brush.spraying, dwell: Math.round((brush.dwell || 0) * 100) / 100,
        travel: Math.round(brush.travel * 100) / 100
      },
      pieces: pieces.map((p) => ({
        name: p.name, bones: p.spec.bones, cells: p.boneCells,
        exposed: Math.round((1 - p.left / Math.max(1, p.boneCells)) * 1000) / 1000,
        keyExposed: Math.round((1 - p.keyLeft / Math.max(1, p.keyCount)) * 1000) / 1000,
        keyClaimed: p.keyDone,
        cracks: p.cracks, damage: p.cracks,
        stress: Math.round(p.stress * 1000) / 1000,
        done: p.done, lost: p.lost, live: p.live,
        damp: Math.round(wet[toIdx(p)] * 1000) / 1000
      })),
      steps: st.steps
    }),

    /* --- readouts a probe can check without touching anything --- */
    read: (sx, sy) => {
      const xx = clamp(Math.floor(toCol(sx)), 0, COLS - 1);
      const yy = clamp(Math.floor(toRow(sy)), 0, ROWS - 1);
      const i = yy * COLS + xx;
      return {
        cell: [xx, yy], sand: Math.round(sand[i] * 10000) / 10000,
        damp: Math.round(wet[i] * 10000) / 10000, concretion: Math.round(con[i] * 1000) / 1000,
        material: mat[i] === 2 ? 'key' : mat[i] === 1 ? 'bone' : 'matrix',
        exposed: exposed[i] === 1, piece: owner[i] < 0 ? null : pieces[owner[i]].name
      };
    },
    bonePoint: (k, f) => {
      const p = pieces[clamp(Math.round(Number(k) || 0), 0, pieces.length - 1)];
      const along = clamp(Number(f) || 0, -0.75, 0.75);
      const cos = Math.cos(p.rot), sin = Math.sin(p.rot);
      const lx = along * p.spec.hx * 1.5, ly = 0;
      return {
        x: toStageX(p.cx + lx * cos - ly * sin), y: toStageY(p.cy + lx * sin + ly * cos),
        piece: p.name, index: p.idx, material: mat[Math.round(p.cy) * COLS + Math.round(p.cx)] ? 'bone' : 'matrix'
      };
    },
    boneCells: (k) => {
      const p = pieces[clamp(Math.round(Number(k) || 0), 0, pieces.length - 1)];
      return { name: p.name, cells: p.boneCells, left: p.left, keyCells: p.keyCount };
    },
    boneBox: (k) => {
      const p = pieces[clamp(Math.round(Number(k) || 0), 0, pieces.length - 1)];
      if (!p.box) return null;
      return {
        x0: toStageX(p.box.x0), y0: toStageY(p.box.y0),
        x1: toStageX(p.box.x1 + 1), y1: toStageY(p.box.y1 + 1),
        cell: CELL, portrait, live: p.live, name: p.name
      };
    },
    trench: () => ({
      x0: TRENCH_X, y0: trenchY, x1: TRENCH_X + TRENCH_W, y1: trenchY + trenchH,
      cols: COLS, rows: ROWS, cell: CELL, portrait, band
    }),
    screen: (sx, sy) => pagePoint(sx, sy),
    pileScreen: (k) => {
      const s = pileSlots[clamp(Math.round(Number(k) || 0), 0, pileSlots.length - 1)];
      return pagePoint(s.x + 16, s.y);
    },

    /* --- drivers that run the same simulation the pointer runs --- */
    stroke: (sx, sy, seconds, speed) => {
      if (st.over) return 0;
      return simStroke(toCol(sx), toRow(sy), Math.min(6, Number(seconds) || 0), speed);
    },
    dampen: (sx, sy, seconds) => {
      if (st.over) return 0;
      let left = Math.min(6, Number(seconds) || 0);
      while (left > 0.0001) {
        const s = Math.min(1 / 30, left);
        dampenStamp(toCol(sx), toRow(sy), s);
        left -= s;
      }
      return st.water;
    },
    advance: (seconds) => {
      let left = Math.min(40, Number(seconds) || 0);
      while (left > 0.0001 && !st.over) {
        const s = Math.min(0.1, left);
        step(s, 0);
        left -= s;
      }
      return st.day;
    },
    dryField: (seconds) => {
      let left = Math.min(200, Number(seconds) || 0);
      while (left > 0.0001) { const s = Math.min(1, left); dryOut(s); left -= s; }
      return boneDamp();
    },
    setClock: (v) => { st.clock = clamp(Number(v) || 1, 0.2, 12); },
    setTool: (i) => { toolIdx = clamp(Math.round(Number(i) || 0), 0, TOOLS.length - 1); return TOOLS[toolIdx].name; },
    setWater: (v) => { st.water = clamp(Number(v), 0, 1); return st.water; },
    nextTray: () => { nextWave(); return st.wave + 1; },
    crackCount: () => st.cracks,
    render: () => { render(scene.time.now); return true; },
    maxBones: () => st.maxBones,
    endRun: () => { endRun(); return st.banked; }
  };
}

export default {
  id: 'fossil-brush', unit: 'bones', mood: 'canyon', stars: STAR, create,
  backdropOpts: { ground: false },
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
