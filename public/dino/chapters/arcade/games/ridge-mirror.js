// Ridge Mirror — one bend of dawn light, thrown off wet stone onto the mist.
// Sun -> hide mirror -> exactly ONE bounce off a wet rock face -> the stragglers.
// Nothing here is faked: every bounce is the law of reflection against that
// face's own normal, so a face that leans a little differently lands the flash
// a long way off, and only a narrow tilt puts the light at a beast's feet.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js';

const PAL = MOODS.dawn;
const TAU = Math.PI * 2;
const RAD = 180 / Math.PI;
const COL = (h) => Phaser.Display.Color.HexStringToColor(h).color;
const ACCENT = COL(PAL.accent);
const SUN = COL(PAL.sun);
const MOTES = COL(PAL.motes);
const STAR = [8, 14, 22];

const SPECIES = ['longneck', 'nibbler', 'shellback'];
const SPEED = [21, 30, 15];
const COOLDOWN = 0.4;
const FLASH_SPEED = 4200;

/* Faces are listed top-end first. The code takes the perpendicular that points
   away from the rock mass, so the drawn sheen IS the reflecting surface.
   Each orientation is laid out for its own shape: landscape runs one long low
   reach of wet flat with the light landing far along it, portrait stacks the
   scene in depth so the sun rides high over a low wet shelf. */
const LAYOUTS = {
  wide: {
    mirror: { x: 196, v: 478 }, keeper: { x: 146, v: 494 }, kraal: { x: 76, v: 520 },
    sun: { x0: 744, x1: 886, v0: 300, v1: 148 },
    floorV: 442,
    rocks: [
      { id: 'dry-tooth', ax: 418, av: 168, bx: 452, bv: 256, wet: false, wd: 22, tint: 0x5d6b60 },
      { id: 'wet-elbow', ax: 452, av: 272, bx: 742, bv: 362, wet: true, wd: 26, tint: 0x4b605e },
      { id: 'wet-stack', ax: 780, av: 368, bx: 800, bv: 442, wet: true, wd: 16, tint: 0x536a66 }
    ],
    pool: { ax: 600, av: 442, bx: 664, bv: 442 },
    lane: { x0: 500, x1: 780, v0: 438, v1: 446 },
    carry: [560, 760],
    hit: 34,
    base: 0.82,
    headY: 20
  },
  tall: {
    mirror: { x: 150, v: 470 }, keeper: { x: 104, v: 486 }, kraal: { x: 60, v: 506 },
    sun: { x0: 640, x1: 800, v0: -60, v1: -140 },
    floorV: 430,
    rocks: [
      { id: 'dry-tooth', ax: 352, av: 314, bx: 380, bv: 364, wet: false, wd: 18, tint: 0x5d6b60 },
      { id: 'wet-shelf', ax: 372, av: 396, bx: 712, bv: 412, wet: true, wd: 20, tint: 0x4b605e },
      { id: 'wet-stack', ax: 758, av: 396, bx: 776, bv: 430, wet: true, wd: 15, tint: 0x536a66 }
    ],
    pool: { ax: 560, av: 430, bx: 620, bv: 430 },
    lane: { x0: 440, x1: 756, v0: 426, v1: 434 },
    carry: [200, 330],
    hit: 42,
    base: 0.8,
    headY: 12
  }
};

const WAVES = [
  { count: 8, window: 46, spread: 1 },
  { count: 8, window: 42, spread: 1.1 },
  { count: 8, window: 38, spread: 1.2 },
  { count: 8, window: 34, spread: 1.3 }
];

/* ------------------------------------------------------------------- art */
function art(scene) {
  canvasTex(scene, 'rm-mirror', 196, 104, (c) => {
    const g = c.createLinearGradient(12, 14, 184, 92);
    g.addColorStop(0, '#101d24'); g.addColorStop(0.5, '#33474c'); g.addColorStop(1, '#0b1418');
    c.fillStyle = g; c.beginPath(); c.ellipse(98, 52, 90, 40, 0, 0, TAU); c.fill();
    const s = c.createLinearGradient(26, 16, 172, 88);
    s.addColorStop(0, '#0e1a1f'); s.addColorStop(0.3, '#8fa6a4'); s.addColorStop(0.56, '#f7e6c0');
    s.addColorStop(0.72, '#a8b6ae'); s.addColorStop(1, '#16262b');
    c.fillStyle = s; c.beginPath(); c.ellipse(98, 52, 77, 30, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(24,18,12,0.82)'; c.lineWidth = 5;
    c.beginPath(); c.ellipse(98, 52, 87, 38, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,232,182,0.34)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(98, 52, 81, 33, 0, Math.PI * 1.05, Math.PI * 1.85); c.stroke();
    c.strokeStyle = 'rgba(198,152,92,0.5)'; c.lineWidth = 3.4;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(98, 52);
      c.lineTo(20 + i * 52, 96 - Math.abs(i - 1.5) * 9); c.stroke();
    }
    grain(c, 196, 104, 0.03, 4411);
  });

  canvasTex(scene, 'rm-keeper', 128, 140, (c) => {
    c.lineCap = 'round';
    const body = c.createLinearGradient(28, 44, 104, 126);
    body.addColorStop(0, '#41564c'); body.addColorStop(1, '#16262a');
    c.fillStyle = body; c.beginPath();
    c.moveTo(42, 62); c.quadraticCurveTo(26, 96, 32, 128); c.lineTo(96, 128);
    c.quadraticCurveTo(104, 92, 86, 62); c.quadraticCurveTo(64, 50, 42, 62); c.closePath(); c.fill();
    c.fillStyle = '#2b3d38'; c.beginPath();
    c.moveTo(40, 60); c.quadraticCurveTo(64, 44, 90, 58); c.quadraticCurveTo(96, 74, 84, 78);
    c.quadraticCurveTo(62, 68, 44, 78); c.closePath(); c.fill();
    c.fillStyle = '#6b533a'; c.beginPath(); c.ellipse(66, 46, 15, 13, -0.1, 0, TAU); c.fill();
    c.fillStyle = '#243036'; c.beginPath(); c.ellipse(72, 52, 7, 6, 0, 0, TAU); c.fill();
    c.strokeStyle = '#5e7466'; c.lineWidth = 12;
    c.beginPath(); c.moveTo(86, 74); c.quadraticCurveTo(106, 70, 118, 58); c.stroke();
    c.fillStyle = '#6b533a'; c.beginPath(); c.arc(120, 56, 6.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,214,150,0.3)'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(90, 66); c.quadraticCurveTo(106, 62, 116, 52); c.stroke();
    c.fillStyle = 'rgba(10,20,24,0.4)'; c.beginPath(); c.ellipse(64, 132, 38, 6, 0, 0, TAU); c.fill();
    grain(c, 128, 140, 0.05, 812);
  });

  canvasTex(scene, 'rm-cairn', 140, 96, (c) => {
    const rand = rng(3311);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI + (i / 8) * Math.PI;
      const x = 70 + Math.cos(a) * 58, y = 78 + Math.sin(a) * 17;
      c.strokeStyle = 'rgba(236,224,196,0.7)'; c.lineWidth = 3.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rand() - 0.5) * 7, y - 24 - rand() * 17); c.stroke();
      c.strokeStyle = 'rgba(120,110,90,0.4)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x + 3, y - 12); c.lineTo(x + 10, y - 15); c.stroke();
    }
    c.fillStyle = '#4b3a28'; c.beginPath(); c.ellipse(70, 82, 27, 8, 0, 0, TAU); c.fill();
    grain(c, 140, 96, 0.05, 991);
  });

  canvasTex(scene, 'rm-mist', 420, 200, (c) => {
    const rand = rng(5151);
    const tint = PAL.mist;
    for (let i = 0; i < 30; i++) {
      const x = 40 + rand() * 340, y = 84 + rand() * 62, r = 40 + rand() * 78;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, tint + '4a'); g.addColorStop(0.45, tint + '25'); g.addColorStop(1, tint + '00');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'destination-out';
    const top = c.createLinearGradient(0, 0, 0, 78);
    top.addColorStop(0, 'rgba(0,0,0,1)'); top.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = top; c.fillRect(0, 0, 420, 78);
    const bot = c.createLinearGradient(0, 128, 0, 200);
    bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = bot; c.fillRect(0, 128, 420, 72);
    c.globalCompositeOperation = 'source-over';
  });

  const beast = (kind, pose) => {
    const stride = pose === 'trot' ? 1 : 0;
    canvasTex(scene, 'rm-' + kind + '-' + pose, 124, 92, (c) => {
      c.lineCap = 'round';
      c.fillStyle = 'rgba(9,20,24,0.26)';
      c.beginPath(); c.ellipse(62, 87, 30, 5, 0, 0, TAU); c.fill();
      const leg = (hx, hy, fx, phase) => {
        const lift = stride ? Math.max(0, Math.sin(phase)) * 6 : 0;
        c.strokeStyle = '#1d3230'; c.lineWidth = kind === 'shellback' ? 8 : 6.5;
        c.beginPath(); c.moveTo(hx, hy);
        c.quadraticCurveTo(hx + (fx - hx) * 0.4, hy + 15 - lift, fx, 85 - lift * 0.6); c.stroke();
        c.fillStyle = '#152424'; c.beginPath(); c.ellipse(fx + 2, 86 - lift * 0.6, 5, 2.4, 0, 0, TAU); c.fill();
      };
      const bodyG = c.createLinearGradient(24, 30, 100, 68);
      bodyG.addColorStop(0, '#8fa07f'); bodyG.addColorStop(0.48, '#5b7267'); bodyG.addColorStop(1, '#2b4341');
      if (kind === 'shellback') { bodyG.addColorStop(0, '#9a9169'); bodyG.addColorStop(1, '#2f3a2c'); }
      leg(44, 58, 38 - stride * 9, 0.4); leg(80, 58, 88 + stride * 9, 2.6);
      c.fillStyle = bodyG;
      c.beginPath();
      c.ellipse(62, 52, kind === 'shellback' ? 30 : 27, kind === 'shellback' ? 19 : 17, -0.05, 0, TAU); c.fill();
      c.fillStyle = 'rgba(226,238,206,0.2)';
      c.beginPath(); c.ellipse(62, 62, 19, 6, 0, 0, TAU); c.fill();
      if (kind === 'shellback') {
        c.fillStyle = '#4a4a30'; c.beginPath();
        c.moveTo(34, 46); c.quadraticCurveTo(62, 20, 92, 46); c.quadraticCurveTo(62, 56, 34, 46);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(20,26,20,0.5)'; c.lineWidth = 1.6;
        for (let i = 0; i < 5; i++) {
          c.beginPath(); c.moveTo(40 + i * 11, 44); c.lineTo(44 + i * 11, 30 + Math.abs(i - 2) * 4); c.stroke();
        }
      } else {
        c.fillStyle = 'rgba(255,214,150,0.18)';
        for (let i = 0; i < 5; i++) {
          c.beginPath(); c.ellipse(44 + i * 9, 46 + (i % 2) * 4, 4.4, 2.6, 0.3, 0, TAU); c.fill();
        }
      }
      const len = kind === 'longneck' ? 26 : kind === 'nibbler' ? 12 : 8;
      c.strokeStyle = bodyG; c.lineWidth = kind === 'shellback' ? 13 : 11;
      c.beginPath(); c.moveTo(84, 48);
      c.quadraticCurveTo(98, 44 - len * 0.4, 100 + len * 0.16, 30 - len * 0.5); c.stroke();
      const hx = 101 + len * 0.2, hy = 28 - len * 0.52;
      c.fillStyle = '#6d8073'; c.beginPath(); c.ellipse(hx, hy, 10.5, 7.6, 0.36, 0, TAU); c.fill();
      c.fillStyle = '#4e6158'; c.beginPath();
      c.moveTo(hx + 6, hy - 3); c.quadraticCurveTo(hx + 17, hy + 1, hx + 12, hy + 6);
      c.quadraticCurveTo(hx + 6, hy + 5, hx + 3, hy + 2); c.closePath(); c.fill();
      c.fillStyle = '#101c1e'; c.beginPath(); c.arc(hx + 1, hy - 1.6, 2.1, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(hx, hy - 2.4, 0.9, 0, TAU); c.fill();
      if (kind === 'longneck') {
        c.strokeStyle = '#7e8f7c'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(hx - 2, hy - 6);
        c.quadraticCurveTo(hx - 12, hy - 16, hx - 22, hy - 13); c.stroke();
      }
      c.fillStyle = '#243a34'; c.beginPath();
      c.moveTo(36, 46); c.quadraticCurveTo(20, 44 + stride * 6, 12, 54 + stride * 8);
      c.quadraticCurveTo(24, 56, 36, 54); c.closePath(); c.fill();
      leg(46, 58, 44 + stride * 8, 3.4); leg(78, 58, 76 - stride * 8, 5.6);
      c.strokeStyle = 'rgba(255,214,150,0.4)'; c.lineWidth = 2.2;
      c.beginPath();
      c.ellipse(62, 52, kind === 'shellback' ? 29 : 26, kind === 'shellback' ? 18 : 16, -0.05,
        Math.PI * 1.08, Math.PI * 1.72);
      c.stroke();
      grain(c, 124, 92, 0.045, 700 + kind.length * 13 + stride * 5);
    });
  };
  SPECIES.forEach((k) => ['idle', 'trot'].forEach((p) => beast(k, p)));
}

/* ---------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M, K = scene.k;
  const Y = (v) => scene.Y(v);
  const L = LAYOUTS[M.portrait ? 'tall' : 'wide'];
  const r = rng('ridge-mirror-29');
  art(scene);

  /* ---- the field, in canvas pixels: the picture and the physics share space */
  const mirror = { x: L.mirror.x, y: Y(L.mirror.v) };
  const floor = { A: { x: -60, y: Y(L.floorV) }, B: { x: W + 60, y: Y(L.floorV) } };
  const rocks = L.rocks.map((s) => {
    const A = { x: s.ax, y: Y(s.av) }, B = { x: s.bx, y: Y(s.bv) };
    const ex = B.x - A.x, ey = B.y - A.y, len = Math.hypot(ex, ey) || 1;
    let n = { x: ey / len, y: -ex / len };
    if ((n.x > 0) !== !!s.right) n = { x: -n.x, y: -n.y };
    return { ...s, A, B, n, len, sp: r() * 6 };
  });
  const pool = { A: { x: L.pool.ax, y: Y(L.pool.av) }, B: { x: L.pool.bx, y: Y(L.pool.bv) } };
  pool.id = 'pool';
  const edge = [
    { A: { x: 0, y: 0 }, B: { x: W, y: 0 }, tag: 'mist' },
    { A: { x: 0, y: 0 }, B: { x: 0, y: M.H }, tag: 'mist' },
    { A: { x: W, y: 0 }, B: { x: W, y: M.H }, tag: 'mist' },
    { A: { x: 0, y: M.H }, B: { x: W, y: M.H }, tag: 'mist' }
  ];

  const cross = (a, b) => a.x * b.y - a.y * b.x;
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };
  const stageLen = (a, b) => Math.hypot(b.x - a.x, (b.y - a.y) / M.band);
  const segHit = (o, d, s) => {
    const ex = s.B.x - s.A.x, ey = s.B.y - s.A.y;
    const den = cross(d, { x: ex, y: ey });
    if (Math.abs(den) < 1e-7) return null;
    const ax = s.A.x - o.x, ay = s.A.y - o.y;
    const t = cross({ x: ax, y: ay }, { x: ex, y: ey }) / den;
    const u = cross({ x: ax, y: ay }, d) / den;
    if (t <= 1e-4 || u < -0.015 || u > 1.015) return null;
    return { t, x: o.x + d.x * t, y: o.y + d.y * t };
  };

  /* the dawn sun climbs through the whole run, so the tilt that reaches a
     given beast is never the same tilt twice */
  let sunP = 0;
  const sunPos = () => ({ x: lerp(L.sun.x0, L.sun.x1, sunP), y: Y(lerp(L.sun.v0, L.sun.v1, sunP)) });
  let sunDir = unit(mirror.x - W * 0.8, mirror.y - 140);
  const refreshSun = () => { const s = sunPos(); sunDir = unit(mirror.x - s.x, mirror.y - s.y); };
  refreshSun();

  /* the first thing a ray meets. Flat water and the mist floor only stop rays
     that are actually coming down; the mirror sits in front of both. */
  const firstHit = (o, d, skip) => {
    let best = null;
    const take = (h, kind, rock) => {
      if (h && (!best || h.t < best.t)) best = { t: h.t, x: h.x, y: h.y, kind, rock: rock || null };
    };
    for (const s of rocks) {
      if (s === skip || dot(d, s.n) >= -0.02) continue;
      take(segHit(o, d, s), s.wet ? 'wet' : 'dry', s);
    }
    if (d.y > 0) {
      take(segHit(o, d, pool), 'water', pool);
      take(segHit(o, d, floor), 'floor', null);
    }
    for (const s of edge) take(segHit(o, d, s), 'mist', null);
    return best;
  };

  function trace(angleDeg) {
    const n0 = { x: Math.cos(angleDeg / RAD), y: Math.sin(angleDeg / RAD) };
    const n1 = cross(n0, sunDir) < 0 ? { x: -n0.x, y: -n0.y } : n0;
    const r1 = unit(sunDir.x - 2 * dot(sunDir, n1) * n1.x, sunDir.y - 2 * dot(sunDir, n1) * n1.y);
    const dead = (p, outcome, rock, bounce) => ({
      segs: [mirror, { x: p.x, y: p.y }],
      bounce: bounce === false ? null : { x: p.x, y: p.y },
      rock: rock || null, outcome, r1, one: true
    });
    const h1 = firstHit(mirror, r1, null);
    if (!h1) return dead({ x: mirror.x + r1.x * 1400, y: mirror.y + r1.y * 1400 }, 'nofirst');
    if (h1.kind === 'mist') return dead(h1, 'nofirst');
    if (h1.kind === 'floor') return dead(h1, 'ground');
    if (h1.kind === 'water') return dead(h1, 'water');
    const leg1 = Math.hypot(h1.x - mirror.x, h1.y - mirror.y);
    if (h1.kind === 'dry') return dead(h1, 'dry', h1.rock);
    if (leg1 > st.carryPx) {
      const p = { x: mirror.x + r1.x * st.carryPx, y: mirror.y + r1.y * st.carryPx };
      return { segs: [mirror, p], bounce: null, rock: null, outcome: 'short', r1, one: true };
    }
    const b = { x: h1.x, y: h1.y };
    const rn = dot(r1, h1.rock.n);
    const r2 = unit(r1.x - 2 * rn * h1.rock.n.x, r1.y - 2 * rn * h1.rock.n.y);
    const rest = st.carryPx - leg1;
    const h2 = firstHit(b, r2, h1.rock);
    const reach = h2 ? Math.hypot(h2.x - b.x, h2.y - b.y) : 1e9;
    if (reach > rest) {
      const p = { x: b.x + r2.x * Math.max(6, rest), y: b.y + r2.y * Math.max(6, rest) };
      return { segs: [mirror, b, p], bounce: b, rock: h1.rock, outcome: 'short', r1, r2 };
    }
    const kindMap = { floor: 'floor', wet: 'blocked', dry: 'blocked', water: 'water', mist: 'lost' };
    const outcome = kindMap[h2.kind] || 'lost';
    return {
      segs: [mirror, b, { x: h2.x, y: h2.y }], bounce: b, rock: h1.rock,
      outcome, blocker: h2.kind === 'wet' || h2.kind === 'dry' ? h2.rock.id : null, r1, r2
    };
  }

  /* the tilt that sends the first leg along a given direction: the mirror
     normal bisects the sun ray and its reflection, so this is exact */
  const tiltFromRay = (rx, ry) => {
    const d = unit(rx, ry);
    const n = unit(d.x - sunDir.x, d.y - sunDir.y);
    let a = Math.atan2(n.y, n.x) * RAD;
    if (cross({ x: Math.cos(a / RAD), y: Math.sin(a / RAD) }, sunDir) < 0) a += 180;
    return ((a + 540) % 360) - 180;
  };

  /* The inverse of that same forward trace: walk every tilt, keep the ones
     whose light lands on the wet flat near the beast, then cut the step in
     three until the landing sits still. Debug aimbot — the game never uses it. */
  function solveFor(p) {
    let best = null;
    const consider = (ang) => {
      const t = trace(ang);
      if (t.outcome !== 'floor') return null;
      const e = t.segs[t.segs.length - 1];
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (!best || d < best.dist) best = { angle: ang, dist: d, trace: t };
      return best;
    };
    for (let i = 0; i <= 360; i++) consider(-180 + i);
    if (!best) return null;
    let step = 1;
    for (let k = 0; k < 9; k++) {
      step /= 3;
      for (const o of [-step, step]) consider(best.angle + o);
    }
    return best.dist > L.hit * 0.8 ? null : best;
  }

  /* the thread of wet flat the light can actually reach at this sun height and
     in this thickness of mist: sampled off the same trace, drawn faint, and
     the reason the stragglers keep themselves inside it */
  let fanRun = -1, fanPts = [], fanBreak = -1, fanRuns_ = [];
  const buildRuns = () => {
    const pts = fanPts.slice().sort((a, b) => a.x - b.x);
    if (!pts.length) { fanRuns_ = []; return; }
    /* gaps are judged against the typical step between neighbouring landings,
       so a hole the light cannot cross (dry stone, water, a face that needs a
       second bend) splits the flat into separate runs */
    let sum = 0, n = 0;
    for (let i = 1; i < pts.length; i++) {
      const g = pts[i].x - pts[i - 1].x;
      if (g > 0.5) { sum += g; n++; }
    }
    const step = n ? sum / n : 20;
    const runs = [];
    for (const p of pts) {
      const last = runs[runs.length - 1];
      if (last && p.x - last[1] < step * 2.4) last[1] = p.x;
      else runs.push([p.x, p.x]);
    }
    fanRuns_ = runs.filter((s) => s[1] - s[0] > 24);
  };
  const reachFan = () => {
    const stamp = Math.round(st.elapsed * 7);
    if (stamp === fanRun && fanPts.length) return fanPts;
    fanRun = stamp;
    const out = [];
    for (let i = 0; i < 360; i++) {
      const t = trace(-180 + i);
      if (t.outcome !== 'floor') continue;
      const e = t.segs[t.segs.length - 1];
      out.push({ x: e.x, y: e.y, ang: -180 + i });
    }
    fanPts = out;
    buildRuns();
    return out;
  };
  const fanRuns = () => {
    const stamp = Math.round(st.elapsed * 7);
    if (stamp !== fanBreak) { fanBreak = stamp; reachFan(); }
    return fanRuns_;
  };

  /* ---- run state */
  const st = {
    angle: -30, want: -30, guided: 0, hearts: 3, waste: 0, wave: 0,
    window: WAVES[0].window, windowMax: WAVES[0].window, mist: 0.44, mistLock: -1, carryPx: 300,
    elapsed: 0, clock: 1, cool: 0, over: false, lost: 0, flashes: 0, hits: 0, resolved: 0, endT: -1
  };
  st.carryPx = lerp(L.carry[1], L.carry[0], st.mist) * M.band;
  const animals = [];
  const flashes = [];
  const dust = [];

  /* ---- props */
  const rockG = scene.add.graphics().setDepth(9);
  const floorG = scene.add.graphics().setDepth(8);
  const markG = scene.add.graphics().setDepth(31);
  const beamG = scene.add.graphics().setDepth(32).setBlendMode(Phaser.BlendModes.ADD);
  const veil = scene.add.rectangle(0, 0, W, M.H, COL(PAL.mist), 0).setOrigin(0).setDepth(37);

  const mImg = scene.add.image(mirror.x, mirror.y, 'rm-mirror').setDepth(27)
    .setScale(0.6 * K).setOrigin(0.5, 0.62);
  const mGlow = scene.add.image(mirror.x, mirror.y, 'arc-glow').setDepth(26)
    .setScale(0.8 * K).setAlpha(0.3).setTint(ACCENT).setBlendMode(Phaser.BlendModes.ADD);
  scene.add.image(L.keeper.x, Y(L.keeper.v), 'rm-keeper').setDepth(25).setScale(0.62 * K)
    .setOrigin(0.5, 0.94);
  const tripod = scene.add.graphics().setDepth(24);
  tripod.lineStyle(4 * K, COL('#3a2c1d'), 0.95);
  tripod.beginPath();
  tripod.moveTo(L.mirror.x, Y(L.mirror.v) - 4 * K);
  tripod.lineTo(L.mirror.x - 18 * K, Y(L.mirror.v) + 30 * K);
  tripod.moveTo(L.mirror.x, Y(L.mirror.v) - 4 * K);
  tripod.lineTo(L.mirror.x + 18 * K, Y(L.mirror.v) + 30 * K);
  tripod.moveTo(L.mirror.x, Y(L.mirror.v) - 4 * K);
  tripod.lineTo(L.mirror.x + 2 * K, Y(L.mirror.v) + 32 * K);
  tripod.strokePath();

  scene.add.image(L.kraal.x, Y(L.kraal.v), 'rm-cairn').setDepth(28).setScale(0.62 * K)
    .setOrigin(0.5, 0.9);
  const kraalGlow = scene.add.image(L.kraal.x + 8, Y(L.kraal.v) - 20, 'arc-glow').setDepth(23)
    .setScale(0.9 * K).setAlpha(0.22).setTint(ACCENT).setBlendMode(Phaser.BlendModes.ADD);
  const herdG = scene.add.graphics().setDepth(22);

  const mistTiles = [
    scene.add.tileSprite(0, Y(L.floorV - 46), W, 200, 'rm-mist').setOrigin(0, 0.5).setDepth(10),
    scene.add.tileSprite(0, Y(L.floorV + 4), W, 200, 'rm-mist').setOrigin(0, 0.5).setDepth(19),
    scene.add.tileSprite(0, Y(L.floorV + 58), W, 200, 'rm-mist').setOrigin(0, 0.5).setDepth(34)
  ].map((t, i) => t.setAlpha(0.16 + i * 0.05).setTileScale(1.25, M.portrait ? 1.5 : 0.85));
  mistTiles[0]._spd = 6; mistTiles[1]._spd = 13; mistTiles[2]._spd = 22;

  const sunImg = scene.add.image(sunPos().x, sunPos().y, 'arc-glow').setDepth(-15)
    .setScale(1.6 * K).setAlpha(0.85).setTint(SUN).setBlendMode(Phaser.BlendModes.ADD);
  const sunDisc = scene.add.circle(sunImg.x, sunImg.y, 26 * K, SUN, 0.95).setDepth(-14);

  const bounceFx = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 40, max: 190 }, angle: { min: 0, max: 360 }, lifespan: { min: 220, max: 620 },
    scale: { start: 0.55 * K, end: 0 }, alpha: { start: 1, end: 0 }, tint: [MOTES, ACCENT, 0xffffff],
    rotate: { min: 0, max: 360 }, emitting: false
  }).setDepth(33);
  const scatterFx = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 30, max: 150 }, lifespan: { min: 300, max: 700 }, scale: { start: 0.5 * K, end: 0 },
    alpha: { start: 0.7, end: 0 }, tint: 0xb9c8bd, emitting: false
  }).setDepth(33);
  const waterFx = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 60, max: 220 }, angle: { min: 210, max: 330 }, lifespan: { min: 320, max: 640 },
    scale: { start: 0.46 * K, end: 0 }, alpha: { start: 0.85, end: 0 }, tint: [MOTES, 0x9fd8dc],
    gravityY: 460, emitting: false
  }).setDepth(33);
  const headGlow = scene.add.image(-300, -300, 'arc-glow').setDepth(34)
    .setScale(1.1 * K).setAlpha(0).setTint(ACCENT).setBlendMode(Phaser.BlendModes.ADD);
  const ring = scene.add.image(-300, -300, 'arc-ring').setDepth(33).setVisible(false)
    .setScale(0.3 * K).setAlpha(0.8).setTint(ACCENT).setBlendMode(Phaser.BlendModes.ADD);
  for (let i = 0; i < SPECIES.length; i++) {
    dust.push(scene.add.particles(0, 0, 'arc-dot', {
      speed: { min: 12, max: 66 }, angle: { min: 200, max: 340 }, lifespan: { min: 340, max: 700 },
      scale: { start: 0.42 * K, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: [0xd8c9a6, 0xbfae8c],
      emitting: false
    }).setDepth(20));
  }

  /* the stragglers are placed on the wet flat inside the light's reach, and
     they drift along it as the sun and the mist move the reach about */
  function spawnWave() {
    const cfg = WAVES[st.wave];
    const runs = fanRuns();
    let tries = 0, made = 0;
    while (made < cfg.count && tries++ < 160) {
      const kind = SPECIES[(made + st.wave) % SPECIES.length];
      let x, v;
      if (runs.length && tries < 110) {
        const run = runs[Math.floor(r() * runs.length) % runs.length];
        x = lerp(run[0], run[1], 0.06 + r() * 0.88);
        v = lerp(L.lane.v0, L.lane.v1, r());
      } else {
        x = lerp(L.lane.x0, L.lane.x1, r());
        v = lerp(L.lane.v0, L.lane.v1, r());
      }
      const p = { x, y: Y(v) };
      const sol = solveFor(p);
      if (!sol) continue;
      const dir = r() < 0.5 ? -1 : 1;
      const sc = L.base * (0.82 + (v - L.lane.v0) * 0.02);
      const a = {
        id: 'a' + (st.wave + 1) + '-' + made, kind, x, y: p.y, v, sc, lit: 0, hold: 0,
        dir, wob: r() * 6, state: 'out', lostT: 0,
        spd: SPEED[SPECIES.indexOf(kind)] * (0.7 + r() * 0.6) * cfg.spread,
        rock: sol.trace.rock ? sol.trace.rock.id : null,
        homeX: lerp(44, 138, r()), homeV: lerp(L.floorV + 34, L.floorV + 74, r()),
        img: scene.add.image(x, p.y, 'rm-' + kind + '-idle').setOrigin(0.46, 0.94)
          .setDepth(16 + clamp(Math.round((v - L.lane.v0) / 4), 0, 4)).setScale(sc * K),
        aura: scene.add.image(x, p.y - 34 * K * sc, 'arc-glow').setDepth(15)
          .setScale(0.55 * K * sc).setAlpha(0).setTint(ACCENT).setBlendMode(Phaser.BlendModes.ADD)
      };
      a.img.setFlipX(a.dir > 0).setTint(0xbcc9bb);
      animals.push(a);
      made++;
    }
    st.window = st.windowMax = cfg.window;
    scene.notice(made + ' shapes at the fog line — one bend, choose where it lands', 2600);
  }

  function light(a) {
    a.lit = clamp(a.lit + 0.56, 0, 1);
    a.hold = 6.5;
    st.hits++;
    scene.sfx('pick');
    scene.burst(a.x, a.y - 26 * K * a.sc, MOTES, 8, { life: 420, scale: 0.4 * K });
    if (a.lit >= 1) {
      a.state = 'home';
      scene.sfx('chime');
      scene.popText(a.x, a.y - 76 * K * a.sc, 'turned', '#ffe6a8');
      dust[SPECIES.indexOf(a.kind)].explode(7, a.x, a.y);
    } else {
      scene.popText(a.x, a.y - 70 * K * a.sc, 'listening', '#d9e6c9');
    }
  }

  function fire(angleDeg) {
    if (st.over || st.cool > 0) return null;
    st.cool = COOLDOWN;
    st.flashes++;
    const t = trace(angleDeg);
    const s = t.segs;
    const px1 = Math.hypot(s[1].x - s[0].x, s[1].y - s[0].y);
    const px2 = s.length > 2 ? Math.hypot(s[2].x - s[1].x, s[2].y - s[1].y) : 0;
    const f = {
      t, p: 0, b1: Math.max(24, px1), b2: Math.max(16, px2), done: false,
      litAny: false, litIds: new Set(), head: { x: mirror.x, y: mirror.y }
    };
    f.total = f.b1 + f.b2;
    flashes.push(f);
    scene.sfx('whoosh');
    scene.shake(80, 0.003);
    return f;
  }

  function resolveMiss(f) {
    const t = f.t;
    const at = t.segs[t.segs.length - 1];
    if (t.outcome === 'dry') {
      scatterFx.explode(12, at.x, at.y);
      scene.sfx('land');
      scene.popText(at.x, at.y - 40 * K, 'dry stone', '#c3cfc4');
    } else if (t.outcome === 'water') {
      waterFx.explode(14, at.x, at.y);
      scene.sfx('splash');
      scene.popText(at.x, at.y - 40 * K, 'the pool scatters it', '#bfe4e6');
    } else if (t.outcome === 'blocked') {
      scatterFx.explode(9, at.x, at.y);
      scene.sfx('land');
      scene.popText(at.x, at.y - 40 * K, 'a second bend', '#cbd4c8');
    } else if (t.outcome === 'short') {
      scene.sfx('tick');
      scene.popText(at.x, at.y - 30 * K, 'the mist ate it', '#a9bcb8');
    } else if (t.outcome === 'ground') {
      scatterFx.explode(8, at.x, at.y);
      scene.sfx('land');
      scene.popText(at.x, at.y - 40 * K, 'bare ground', '#b9c6bb');
    } else {
      scene.sfx('tick');
      scene.popText(clamp(at.x, 70, W - 70), clamp(at.y - 30 * K, 24, M.H - 30),
        t.outcome === 'floor' ? 'nobody standing there'
          : t.outcome === 'lost' ? 'the beam walked off into the mist' : 'nothing but mist', '#a9bcb8');
    }
    st.waste++;
    if (st.waste >= 4) {
      st.waste = 0;
      loseHeart('the mirror cooled — four flashes thrown away');
    }
  }

  function loseHeart(reason) {
    if (st.over) return;
    st.hearts--;
    scene.sfx('hurt');
    scene.shake(260, 0.012);
    scene.cameras.main.flash(220, 190, 110, 70);
    if (st.hearts <= 0) {
      st.hearts = 0;
      finishRun(false, 'the light came up with ' + st.guided +
        ' of the lost ones home');
      return;
    }
    scene.notice(reason, 2400);
  }

  function closeWave() {
    const out = animals.filter((a) => a.state === 'out');
    out.forEach((a) => { a.state = 'lost'; a.lostT = 0; st.lost++; });
    if (out.length >= 3) {
      loseHeart(out.length + ' stragglers went back into the mist');
    } else if (out.length > 0) {
      scene.sfx('bad');
      scene.notice(out.length + (out.length === 1 ? ' shape' : ' shapes') +
        ' gave up the fog line', 2200);
    } else {
      scene.sfx('good');
      scene.cameras.main.flash(260, 255, 220, 160);
      scene.notice('the fog line is empty — every one accounted for', 2200);
    }
    if (st.over) return;
    st.wave++;
    if (st.wave >= WAVES.length) { st.endT = 2.4; return; }
    spawnWave();
  }

  function finishRun(win, note) {
    if (st.over) return;
    st.over = true;
    scene.finish(win, {
      score: st.guided,
      note: win ? st.guided + ' guided home off one bend of wet stone' : note
    });
  }

  /* ---- input: move to tilt, tap to flash. The pointer sets where the FIRST
     leg of the beam goes; the tilt that does it is the bisector of that
     direction and the sun ray, so aiming at the stone aims the light. */
  const aimFromPointer = (ptr) => {
    const dx = ptr.x - mirror.x, dy = ptr.y - mirror.y;
    if (Math.hypot(dx, dy) < 14) return;
    st.want = tiltFromRay(dx, dy);
  };
  scene.input.on('pointermove', (ptr) => { if (ptr.isDown || !M.portrait) aimFromPointer(ptr); });
  scene.input.on('pointerdown', (ptr) => {
    aimFromPointer(ptr);
    st.angle = st.want;
    fire(st.angle);
  });
  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D'
  });
  scene.input.keyboard.on('keydown-SPACE', () => fire(st.angle));
  scene.input.keyboard.on('keydown-ENTER', () => fire(st.angle));

  /* ---- painting */
  function drawRocks(time) {
    rockG.clear();
    for (const s of rocks) {
      const bx = -s.n.x * s.wd * 1.7, by = -s.n.y * s.wd * 1.7;
      rockG.fillStyle(s.tint, 1);
      rockG.beginPath();
      rockG.moveTo(s.A.x, s.A.y); rockG.lineTo(s.B.x, s.B.y);
      rockG.lineTo(s.B.x + bx, s.B.y + by); rockG.lineTo(s.A.x + bx, s.A.y + by);
      rockG.closePath(); rockG.fill();
      rockG.fillStyle(0x16282a, 0.5);
      rockG.beginPath();
      rockG.moveTo(s.A.x + bx, s.A.y + by); rockG.lineTo(s.B.x + bx, s.B.y + by);
      rockG.lineTo(s.B.x + bx * 0.45, s.B.y + by * 0.45); rockG.closePath(); rockG.fill();
      if (s.wet) {
        const sheen = 0.32 + 0.24 * Math.sin(time / 900 + s.sp);
        rockG.lineStyle(3.6 * K, MOTES, sheen * 0.5);
        rockG.beginPath(); rockG.moveTo(s.A.x, s.A.y); rockG.lineTo(s.B.x, s.B.y); rockG.strokePath();
        rockG.lineStyle(1.5 * K, 0xffffff, 0.42 + sheen * 0.4);
        rockG.beginPath();
        rockG.moveTo(s.A.x - s.n.x * 2 * K, s.A.y - s.n.y * 2 * K);
        rockG.lineTo(s.B.x - s.n.x * 2 * K, s.B.y - s.n.y * 2 * K);
        rockG.strokePath();
        for (let i = 0; i < 4; i++) {
          const u = 0.14 + i * 0.23 + Math.sin(time / 900 + i + s.sp) * 0.03;
          rockG.fillStyle(0xfff4d8, 0.24 + 0.26 * Math.sin(time / 380 + i * 2 + s.sp));
          rockG.fillCircle(lerp(s.A.x, s.B.x, u) + s.n.x * 2.5 * K,
            lerp(s.A.y, s.B.y, u) + s.n.y * 2.5 * K, (1.4 + (i % 2)) * K);
        }
      } else {
        rockG.lineStyle(1.6 * K, 0x9aa79c, 0.26);
        rockG.beginPath(); rockG.moveTo(s.A.x, s.A.y); rockG.lineTo(s.B.x, s.B.y); rockG.strokePath();
        rockG.lineStyle(1.2 * K, 0x22322f, 0.5);
        for (let i = 0; i < 5; i++) {
          const u = 0.1 + i * 0.19;
          rockG.beginPath();
          rockG.moveTo(lerp(s.A.x, s.B.x, u), lerp(s.A.y, s.B.y, u));
          rockG.lineTo(lerp(s.A.x, s.B.x, u + 0.06) + bx * 0.7, lerp(s.A.y, s.B.y, u + 0.06) + by * 0.7);
          rockG.strokePath();
        }
      }
    }
  }

  function drawFloor(time) {
    floorG.clear();
    const fy = Y(L.floorV);
    /* the wet flat the light lands on: mist gone still and glassy */
    floorG.fillStyle(0x2a4a4e, 0.34);
    floorG.beginPath();
    floorG.moveTo(0, fy); floorG.lineTo(W, fy - 2);
    floorG.lineTo(W, fy + 40 * K); floorG.lineTo(0, fy + 46 * K);
    floorG.closePath(); floorG.fill();
    floorG.lineStyle(1.6 * K, MOTES, 0.16 + 0.08 * Math.sin(time / 1400));
    floorG.beginPath(); floorG.moveTo(0, fy); floorG.lineTo(W, fy - 2); floorG.strokePath();
    const q = 7 * K;
    floorG.fillStyle(0x14343f, 0.92);
    floorG.beginPath();
    floorG.moveTo(pool.A.x, pool.A.y); floorG.lineTo(pool.B.x, pool.B.y);
    floorG.lineTo(pool.B.x, pool.B.y + q); floorG.lineTo(pool.A.x, pool.A.y + q);
    floorG.closePath(); floorG.fill();
    floorG.lineStyle(1.8 * K, 0xa8dfe0, 0.3);
    floorG.beginPath(); floorG.moveTo(pool.A.x, pool.A.y); floorG.lineTo(pool.B.x, pool.B.y);
    floorG.strokePath();
    for (let i = 0; i < 14; i++) {
      const u = (i * 0.071 + time * 0.00005) % 1;
      const gx = lerp(pool.A.x, pool.B.x, u);
      const gy = lerp(pool.A.y, pool.B.y, u) + 3 * K + Math.sin(time / 460 + i) * 1.4 * K;
      floorG.fillStyle(0xf2e6c8, 0.08 + 0.1 * Math.abs(Math.sin(time / 700 + i * 1.7)));
      floorG.fillCircle(gx, gy, (2 + (i % 3) * 1.7) * K);
    }
  }

  function drawHerd(time) {
    herdG.clear();
    herdG.lineStyle(2.2 * K, 0xe8d9b4, 0.3);
    for (let i = 0; i < 6; i++) {
      const x = L.kraal.x + Math.cos(i * 1.05 + 0.3) * 44 * K;
      const y = Y(L.kraal.v) - 4 * K + Math.sin(i * 1.05) * 7 * K;
      const bob = Math.sin(time / 900 + i) * 1.6 * K;
      herdG.beginPath();
      herdG.moveTo(x - 7 * K, y + bob);
      herdG.lineTo(x - 3 * K, y - 15 * K + bob);
      herdG.lineTo(x + 5 * K, y - 12 * K + bob);
      herdG.lineTo(x + 8 * K, y + bob);
      herdG.strokePath();
    }
  }

  function drawPreview(t) {
    markG.clear();
    if (st.over || st.endT > 0) return;
    /* the reachable thread: where the light is allowed to land right now */
    const fan = reachFan();
    const now = scene.time.now;
    for (let i = 0; i < fan.length; i += 2) {
      const p = fan[i];
      markG.fillStyle(MOTES, 0.05 + 0.03 * Math.sin(now / 420 + i * 0.6));
      markG.fillCircle(p.x, p.y, 1.5 * K);
    }
    const end = t.segs[t.segs.length - 1];
    const good = t.outcome === 'floor';
    const tint = good ? ACCENT : (t.outcome === 'blocked' || t.outcome === 'short' ? 0xc9b79a : 0x8fa1a0);
    const blink = Math.floor(now / 110) % 2 === 0;
    markG.lineStyle(1.8 * K, tint, (good ? 0.3 : 0.18) * (blink ? 1 : 0.5));
    markG.beginPath();
    markG.moveTo(t.segs[0].x, t.segs[0].y);
    markG.lineTo(t.segs[1].x, t.segs[1].y);
    markG.strokePath();
    if (!t.bounce || t.segs.length < 3) return;
    markG.lineStyle(1.8 * K, tint, (good ? 0.26 : 0.14) * (blink ? 0.55 : 1));
    markG.beginPath();
    markG.moveTo(t.segs[1].x, t.segs[1].y);
    markG.lineTo(end.x, end.y);
    markG.strokePath();
    const arm = (good ? 9 : 6) * K;
    markG.lineStyle(1.6 * K, tint, good ? 0.62 : 0.3);
    markG.beginPath();
    markG.moveTo(end.x - arm, end.y); markG.lineTo(end.x + arm, end.y);
    markG.moveTo(end.x, end.y - arm * 0.7); markG.lineTo(end.x, end.y + arm * 0.7);
    markG.strokePath();
    if (good) {
      markG.fillStyle(ACCENT, 0.42 + 0.28 * Math.sin(now / 240));
      markG.fillCircle(end.x, end.y, 3.4 * K);
    }
    markG.fillStyle(ACCENT, 0.45 + 0.3 * Math.sin(now / 260));
    markG.fillCircle(t.segs[1].x, t.segs[1].y, 2.8 * K);
  }

  function drawFlashes() {
    beamG.clear();
    let hot = 0;
    for (const f of flashes) {
      const fade = clamp(1 - (f.p - f.total) / (f.total * 0.5), 0, 1);
      if (fade <= 0) continue;
      const s0 = f.t.segs[0], s1 = f.t.segs[1], s2 = f.t.segs[f.t.segs.length - 1];
      const hx = f.head.x, hy = f.head.y;
      beamG.lineStyle(11 * K, ACCENT, 0.18 * fade);
      beamG.beginPath(); beamG.moveTo(s0.x, s0.y); beamG.lineTo(hx, hy); beamG.strokePath();
      beamG.lineStyle(4 * K, 0xfff3d8, 0.9 * fade);
      beamG.beginPath(); beamG.moveTo(s0.x, s0.y); beamG.lineTo(hx, hy); beamG.strokePath();
      if (f.p > f.b1) {
        beamG.lineStyle(13 * K, SUN, 0.2 * fade);
        beamG.beginPath(); beamG.moveTo(s1.x, s1.y); beamG.lineTo(hx, hy); beamG.strokePath();
        beamG.lineStyle(4.5 * K, 0xfffdf4, 0.95 * fade);
        beamG.beginPath(); beamG.moveTo(s1.x, s1.y); beamG.lineTo(hx, hy); beamG.strokePath();
      }
      hot = Math.max(hot, fade);
    }
    headGlow.setAlpha(0.8 * hot);
  }

  /* ---- go */
  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'low sun, wet stone, one bend' });
  scene.notice('the herd is over the ridge — the lost ones are at the fog line', 3200);
  spawnWave();

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000) * st.clock;
    if (st.over) return;
    st.elapsed += dt;
    sunP = clamp(st.elapsed / 168, 0, 1);
    refreshSun();
    st.cool = Math.max(0, st.cool - dt);

    /* the tilt eases toward the pointer, or walks under the keys */
    let kb = 0;
    if (keys.left.isDown || keys.a.isDown) kb -= 1;
    if (keys.right.isDown || keys.d.isDown) kb += 1;
    if (keys.up.isDown) kb += 0.4;
    if (keys.down.isDown) kb -= 0.4;
    if (kb !== 0) st.want += kb * 44 * dt;
    const diff = ((st.want - st.angle + 540) % 360) - 180;
    st.angle += diff * Math.min(1, dt * 17);

    /* the air */
    st.mist = st.mistLock >= 0 ? st.mistLock : clamp(0.44 + 0.34 * Math.sin(st.elapsed * 0.082 + 1.1) +
      0.14 * Math.sin(st.elapsed * 0.031), 0.04, 1);
    st.carryPx = lerp(L.carry[1], L.carry[0], st.mist) * M.band;
    mistTiles.forEach((t, i) => {
      t.tilePositionX = time * 0.001 * t._spd;
      t.tilePositionY = Math.sin(time / (5200 + i * 900)) * 10;
      t.setAlpha(0.08 + i * 0.04 + st.mist * (0.2 + i * 0.18));
    });
    veil.setFillStyle(COL(PAL.mist), 0.03 + st.mist * 0.1);

    /* the sun */
    const sp = sunPos();
    sunImg.setPosition(sp.x, sp.y);
    sunDisc.setPosition(sp.x, sp.y);
    sunDisc.setRadius((22 + 10 * (1 - sunP)) * K);
    sunImg.setScale((1.4 + 0.6 * (1 - sunP)) * K);

    /* the window */
    if (st.endT > 0) {
      st.endT -= dt;
      if (st.endT <= 0) { finishRun(true, 'full light'); return; }
    } else {
      st.window -= dt;
      if (st.window <= 0) closeWave();
    }

    /* the beasts */
    for (const a of animals) {
      if (a.state === 'out') {
        a.wob += dt;
        const runs = fanRuns();
        let inside = false;
        for (const s of runs) if (a.x > s[0] + 6 && a.x < s[1] - 6) inside = true;
        if (!inside && runs.length) {
          /* out of the light's reach: the stragggers drift back to it */
          let near = runs[0], nd = 1e9;
          for (const s of runs) {
            const c = (s[0] + s[1]) / 2;
            if (Math.abs(c - a.x) < nd) { nd = Math.abs(c - a.x); near = s; }
          }
          a.dir = (near[0] + near[1]) / 2 > a.x ? 1 : -1;
        } else if (r() < dt * 0.24) a.dir *= -1;
        a.x += a.dir * a.spd * dt;
        if (a.x < L.lane.x0 - 14) { a.x = L.lane.x0 - 14; a.dir = 1; }
        if (a.x > L.lane.x1 + 14) { a.x = L.lane.x1 + 14; a.dir = -1; }
        a.y = Y(a.v) + Math.sin(a.wob * 1.6) * 1.6 * K * a.sc;
        a.hold = Math.max(0, a.hold - dt);
        if (a.hold <= 0) a.lit = Math.max(0, a.lit - dt * 0.13);
        a.img.setTexture('rm-' + a.kind + '-idle').setFlipX(a.dir > 0);
      } else if (a.state === 'home') {
        const tx = a.homeX, ty = Y(a.homeV);
        const dx = tx - a.x, dy = ty - a.y;
        const dl = Math.hypot(dx, dy);
        const step = (230 + 150 * a.sc) * K * dt;
        if (dl < 12) {
          a.state = 'done';
          st.guided++;
          scene.sfx('good');
          scene.popText(a.x, a.y - 70 * K * a.sc, '+1', '#ffe6a8');
          scene.burst(a.x, a.y - 24 * K, MOTES, 12, { life: 620, scale: 0.5 * K });
          kraalGlow.setAlpha(0.55);
        } else {
          a.x += (dx / dl) * step; a.y += (dy / dl) * step;
          a.v = M.portrait ? (a.y - M.top) / M.band : a.y;
          a.dir = dx > 0 ? 1 : -1;
          a.img.setTexture('rm-' + a.kind + '-trot').setFlipX(a.dir > 0);
          if (r() < dt * 13) dust[SPECIES.indexOf(a.kind)].explode(1, a.x - a.dir * 9 * K, a.y);
        }
      } else if (a.state === 'lost') {
        a.lostT += dt;
        a.x -= 30 * dt;
        a.img.setAlpha(clamp(1 - a.lostT / 1.6, 0, 1));
      }
      if (a.state === 'done') {
        a.img.setTexture('rm-' + a.kind + '-idle').setFlipX(a.dir > 0).setAlpha(1);
      }
      a.img.setPosition(a.x, a.y);
      a.img.setTint(a.state === 'out' ? (a.lit > 0.2 ? 0xffe9c4 : 0xbcc9bb) : 0xf6e7c6);
      a.aura.setPosition(a.x, a.y - 34 * K * a.sc);
      a.aura.setAlpha(a.state === 'out' ? a.lit * 0.42 : (a.state === 'home' ? 0.5 : 0.12));
    }

    /* the flash travels, and the light only counts where it arrives */
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      const before = f.p;
      f.p += FLASH_SPEED * K * dt;
      const s0 = f.t.segs[0], s1 = f.t.segs[1], s2 = f.t.segs[f.t.segs.length - 1];
      const at = (d) => (d <= f.b1)
        ? { x: lerp(s0.x, s1.x, f.b1 > 0 ? d / f.b1 : 1), y: lerp(s0.y, s1.y, f.b1 > 0 ? d / f.b1 : 1) }
        : { x: lerp(s1.x, s2.x, f.b2 > 0 ? Math.min(1, (d - f.b1) / f.b2) : 1),
          y: lerp(s1.y, s2.y, f.b2 > 0 ? Math.min(1, (d - f.b1) / f.b2) : 1) };
      if (before < f.b1 && f.p >= f.b1 && f.t.bounce) {
        bounceFx.explode(16, f.t.bounce.x, f.t.bounce.y);
        scene.sfx('drum4');
        scene.cameras.main.flash(110, 255, 226, 170);
      }
      f.head = at(Math.min(f.p, f.total));
      headGlow.setPosition(f.head.x, f.head.y);
      if (!f.done && f.p >= f.total) {
        f.done = true;
        st.resolved++;
        const land = f.t.segs[f.t.segs.length - 1];
        if (f.t.outcome === 'floor') {
          for (const a of animals) {
            if (a.state !== 'out' || f.litIds.has(a.id)) continue;
            if (Math.hypot(a.x - land.x, a.y - land.y) < L.hit * (1 + a.sc * 0.4)) {
              f.litIds.add(a.id);
              light(a);
              f.litAny = true;
            }
          }
        }
        if (f.litAny) {
          ring.setPosition(land.x, land.y).setVisible(true).setScale(0.18 * K).setAlpha(0.9);
          scene.tweens.add({
            targets: ring, scale: 0.7 * K, alpha: 0, duration: 420,
            onComplete: () => ring.setVisible(false)
          });
          scene.cameras.main.flash(160, 255, 214, 150);
        } else {
          resolveMiss(f);
        }
      }
      if (f.p > f.total * 1.8) flashes.splice(i, 1);
    }

    /* the mirror itself */
    const ang = st.angle / RAD;
    let n1 = { x: Math.cos(ang), y: Math.sin(ang) };
    if (cross(n1, sunDir) < 0) n1 = { x: -n1.x, y: -n1.y };
    mImg.setPosition(mirror.x, mirror.y).setAngle(Math.atan2(n1.y, n1.x) * RAD - 90);
    const catchSun = clamp(-dot(sunDir, n1), 0, 1);
    mGlow.setPosition(mirror.x, mirror.y).setAlpha(0.16 + catchSun * 0.44)
      .setScale((0.7 + catchSun * 0.5) * K);
    mImg.setTint(Phaser.Display.Color.GetColor(198 + Math.round(catchSun * 57),
      188 + Math.round(catchSun * 52), 178 + Math.round(catchSun * 42)));

    drawRocks(time);
    drawFloor(time);
    drawHerd(time);
    drawPreview(trace(st.angle));
    drawFlashes();

    scene.audio.setTension(clamp(
      (st.window < 11 ? (11 - st.window) / 11 : 0) * 0.7 + st.mist * 0.2 +
      (3 - st.hearts) * 0.1, 0, 1));
    if (st.window < 8 && st.window > 0 &&
      Math.floor(st.window * 2) !== Math.floor((st.window + dt) * 2)) scene.sfx('tick');

    const out = animals.filter((x) => x.state === 'out').length;
    scene.hud({
      score: st.guided,
      progress: st.endT > 0 ? 1 : clamp(st.window / st.windowMax, 0, 1),
      hearts: st.hearts,
      extra: st.endT > 0 ? 'the ridge is in full light'
        : st.window < 9 ? 'the sun is rounding the ridge'
          : out === 0 ? 'the fog line is empty — hold the tilt'
            : st.mist > 0.66 ? 'mist thick — the flash falls short'
              : out + ' at the fog line, wet stone throws the light'
    });
  }

  /* ---- probe surface: everything the harness measures is read off the same
     trace the beam runs */
  const pagePoint = (p) => {
    const rect = scene.game.canvas.getBoundingClientRect();
    return { x: rect.left + (p.x / W) * rect.width, y: rect.top + (p.y / M.H) * rect.height };
  };
  const vOf = (py) => M.portrait ? (py - M.top) / M.band : py;
  const packTrace = (t) => ({
    outcome: t.outcome,
    rock: t.rock && t.rock.id ? t.rock.id : null,
    blocker: t.blocker || null,
    segments: t.segs.length - 1,
    path: t.segs.map((p) => ({ x: Math.round(p.x), y: Math.round(vOf(p.y)) })),
    bounce: t.bounce ? { x: Math.round(t.bounce.x), y: Math.round(vOf(t.bounce.y)) } : null,
    land: { x: Math.round(t.segs[t.segs.length - 1].x), y: Math.round(vOf(t.segs[t.segs.length - 1].y)) },
    landPx: { x: Math.round(t.segs[t.segs.length - 1].x), y: Math.round(t.segs[t.segs.length - 1].y) },
    bounceToLand: Math.round(stageLen(t.bounce || t.segs[1], t.segs[t.segs.length - 1])),
    hitRadius: L.hit
  });
  const nearestTo = (t) => {
    const live = animals.filter((z) => z.state === 'out');
    const e = t.segs[t.segs.length - 1];
    let nd = 1e9, id = null;
    for (const z of live) {
      const d = Math.hypot(z.x - e.x, z.y - e.y);
      if (d < nd) { nd = d; id = z.id; }
    }
    return { nearestBeast: live.length ? Math.round(nd) : null, beastId: id };
  };

  return {
    update,
    state: () => {
      const cur = trace(st.angle);
      return {
        guided: st.guided, score: st.guided, hearts: st.hearts, stars: STAR,
        angle: Number(st.angle.toFixed(2)), want: Number(st.want.toFixed(2)),
        mist: Number(st.mist.toFixed(3)), carry: Math.round(st.carryPx / M.band),
        sunV: Number(lerp(L.sun.v0, L.sun.v1, sunP).toFixed(1)), sunP: Number(sunP.toFixed(3)),
        wave: st.wave + 1, waves: WAVES.length,
        window: Number(Math.max(0, st.window).toFixed(1)), windowMax: st.windowMax,
        waste: st.waste, lost: st.lost, flashes: st.flashes, hits: st.hits,
        resolved: st.resolved,
        cool: Number(st.cool.toFixed(2)), canFire: st.cool <= 0 && !st.over,
        beams: flashes.length,
        elapsed: Number(st.elapsed.toFixed(1)),
        over: st.over, endT: Number(st.endT.toFixed(1)), layout: M.portrait ? 'tall' : 'wide',
        hitRadius: L.hit,
        outcome: cur.outcome, rock: cur.rock && cur.rock.id ? cur.rock.id : null,
        blocker: cur.blocker || null,
        segments: cur.segs.length - 1,
        path: cur.segs.map((p) => ({ x: Math.round(p.x), y: Math.round(vOf(p.y)) })),
        bounce: cur.bounce ? { x: Math.round(cur.bounce.x), y: Math.round(vOf(cur.bounce.y)) } : null,
        land: { x: Math.round(cur.segs[cur.segs.length - 1].x), y: Math.round(vOf(cur.segs[cur.segs.length - 1].y)) },
        targets: animals.filter((a) => a.state === 'out' || a.state === 'home').map((a) => ({
          id: a.id, kind: a.kind, x: Math.round(a.x), y: Math.round(vOf(a.y)),
          lit: Number(a.lit.toFixed(2)), state: a.state, rock: a.rock
        })),
        faces: rocks.map((s) => ({
          id: s.id, wet: s.wet, right: !!s.right,
          a: { x: Math.round(s.A.x), y: Math.round(vOf(s.A.y)) },
          b: { x: Math.round(s.B.x), y: Math.round(vOf(s.B.y)) },
          n: { x: Number(s.n.x.toFixed(3)), y: Number(s.n.y.toFixed(3)) }
        })),
        floor: { v: L.floorV, x0: 0, x1: W },
        pool: { x0: pool.A.x, x1: pool.B.x, v: Math.round(vOf(pool.A.y)) },
        mirror: { x: mirror.x, y: Math.round(vOf(mirror.y)) },
        lane: L.lane, clock: st.clock,
        runs: fanRuns().map((s) => [Math.round(s[0]), Math.round(s[1])])
      };
    },
    setClock: (v) => { st.clock = clamp(Number(v) || 1, 0.2, 8); },
    setMist: (v) => {
      const m = Number(v);
      st.mistLock = Number.isFinite(m) ? clamp(m, 0.04, 1) : -1;
      if (st.mistLock >= 0) {
        st.mist = st.mistLock;
        st.carryPx = lerp(L.carry[1], L.carry[0], st.mist) * M.band;
        fanRun = -1; fanBreak = -1;
      }
      return st.mistLock;
    },
    setAngle: (deg) => {
      const d = Number(deg);
      if (!Number.isFinite(d)) return null;
      st.want = ((d + 540) % 360) - 180;
      st.angle = st.want;
      return st.angle;
    },
    aim: () => packTrace(trace(st.angle)),
    flash: (deg) => {
      if (deg !== undefined && deg !== null) {
        st.want = ((Number(deg) + 540) % 360) - 180;
        st.angle = st.want;
      }
      const f = fire(st.angle);
      return f ? { ok: true, outcome: f.t.outcome, rock: f.t.rock && f.t.rock.id } : { ok: false };
    },
    /* the exact tilt that puts the landing at a stage point, solved off the
       real geometry and then verified by running it */
    solve: (x, y) => {
      const p = { x: Number(x), y: Y(Number(y)) };
      const s = solveFor(p, true);
      return s ? {
        angle: Number(s.angle.toFixed(2)), dist: Math.round(s.dist),
        rock: s.trace.rock && s.trace.rock.id, outcome: s.trace.outcome
      } : null;
    },
    bestTarget: () => {
      const list = animals.filter((a) => a.state === 'out').map((a) => {
        const s = solveFor({ x: a.x, y: a.y }, true);
        return s ? {
          id: a.id, angle: Number(s.angle.toFixed(2)), dist: Math.round(s.dist),
          rock: s.trace.rock && s.trace.rock.id, lit: Number(a.lit.toFixed(2)),
          d: Math.round(stageLen(a, mirror))
        } : null;
      }).filter(Boolean);
      /* a beast already half lit first, then the nearest one */
      list.sort((p, q) => (q.lit >= 0.5 ? 1 : 0) - (p.lit >= 0.5 ? 1 : 0) || p.d - q.d);
      return list[0] || null;
    },
    /* one angle per shape of the puzzle, all found by walking the same trace */
    probeAngles: () => {
      const found = {};
      for (let i = 0; i < 1440; i++) {
        const ang = -180 + i * 0.25;
        const t = trace(ang);
        if (!found[t.outcome]) found[t.outcome] = { angle: ang, t };
        if (found.floor && found.dry && found.water && found.blocked && found.short) break;
      }
      const out = {};
      for (const key of ['floor', 'dry', 'water', 'blocked', 'short', 'ground', 'nofirst', 'mist']) {
        const f = found[key];
        if (!f) { out[key] = null; continue; }
        out[key] = Object.assign(packTrace(f.t), nearestTo(f.t), { angle: Number(f.angle.toFixed(2)) });
      }
      return out;
    },
    mirrorScreen: () => pagePoint(mirror),
    pointScreen: (x, v) => pagePoint({ x: Number(x), y: Y(Number(v)) }),
    faces: () => rocks.map((s) => ({
      id: s.id, wet: s.wet,
      screenA: pagePoint(s.A), screenB: pagePoint(s.B),
      n: { x: Number(s.n.x.toFixed(3)), y: Number(s.n.y.toFixed(3)) }
    })),
    sunScreen: () => pagePoint(sunPos())
  };
}

export default {
  id: 'ridge-mirror', unit: 'guided', stars: STAR, create,
  backdropOpts: { sun: false },
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
