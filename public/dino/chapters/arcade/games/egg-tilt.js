// Egg Tilt — the frozen ridge.
// Nobody carries the egg. You lean the whole ridge and gravity does the walking,
// while the cold reaches for the shell and the wind keeps changing its mind.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js';

const STAR = [8, 15, 24];
const GOAL = 26;

const HS = 280;                 // half span of the ridge, in canvas px
const RW = HS * 2;
const STEP = 4;                 // heightfield sample, in px
const PIVOT_X = 470;            // the ridge turns above here
const PIVOT_S = 300;            // stage y of the pivot
const LOSS_S = 446;             // below this the egg is in the drift and gone
const MAX_TILT = 0.175;         // about ten degrees either way
const G = 1350;                 // px/s^2
const DRAG = 0.0012;            // v^2 drag, so every lean has a top speed
const RES = 13;                 // rolling resistance, so a flat ridge can stall
const IMPACT_CRACK = 240;
const IMPACT_FATAL = 470;
const THROAT = 158;             // arrival speed the bank can still hold
const GRADE = 78;               // every ridge falls about this much, in px
const CRACKS = 5;

const LINES = {
  open: 'nobody carries it. we lean the world and let it roll kindly.',
  bank: [
    'that one is over. say nothing out loud.',
    'safe on the bank. small miracle, keep it quiet.',
    'it made it. the next ridge is longer and colder.',
    'gently done. the shell is still a shell.'
  ],
  cold: 'it is going cold. lean, gently, lean.',
  freeze: 'the cold got inside it. this ridge again, quicker.',
  crack: 'that sounded like a shell. look at the ridge, not at me.',
  shatter: 'it broke. everyone is fine. there is another one.',
  hard: 'it came down far too hard.',
  off: 'it went over the side into the drift.',
  gust: 'the wind has found its teeth.',
  gap: 'a hole in the ridge. momentum, not courage.',
  shelf: 'soft snow. it eats speed for breakfast.',
  channel: 'meltwater is quick and it ends in a drop.',
  spine: 'a thin spine. hurry over it and it throws the egg.',
  cup: 'the wind scooped a cup. cups keep things.',
  nest: 'the bank is at the end of this one. arrive slowly, please.',
  late: 'the far nest is close and the ridges are getting mean.'
};

// the first time the egg touches each kind of ground on a ridge, say what it is
const SAY = { shelf: LINES.shelf, channel: LINES.channel, spine: LINES.spine, corniche: LINES.cup };

// drag and res multiply the two loss terms, wind weights how much the weather
// gets hold of the egg while it is standing on that ground
const KIND = {
  ice: { drag: 1, res: 1, wind: 1 },
  shelf: { drag: 4, res: 6, wind: 0.35 },
  channel: { drag: 0.25, res: 0.3, wind: 1.6 },
  corniche: { drag: 0.9, res: 0.85, wind: 2.7 },
  spine: { drag: 0.8, res: 0.7, wind: 1.5 },
  nest: { drag: 3, res: 4, wind: 0.6 }
};

/* ---------------------------------------------------------------- ridge */
function planRidge(n, rand) {
  const feats = ['shelf', 'cup', 'gap'];
  if (n >= 2) feats.push('channel');
  if (n >= 3) feats.push('spine', 'steps');
  if (n >= 6) feats.push('channel', 'gap', 'spine');
  const count = clamp(2 + Math.floor(n / 2), 2, 6);
  const plan = ['cradle'];
  for (let i = 0; i < count; i++) plan.push(feats[Math.floor(rand() * feats.length)]);
  if (n >= 2 && !plan.includes('gap')) plan.splice(count, 0, 'gap');
  if (n >= 4 && !plan.includes('channel')) plan.splice(1, 0, 'channel');
  plan.push('runin', 'nest');
  return plan;
}

// [width, kind, drop, bump] — bump is a sine half wave, plus a bowl, minus a crest.
// Every feature ends lower than it starts, or a few px higher: a ridge you cannot
// lean your way out of is not a puzzle, it is a soft lock.
const PIECES = {
  cradle: [[26, 'ice', 4], [46, 'ice', 12], [24, 'ice', -6]],
  shelf: [[50, 'ice', 16], [112, 'shelf', 5], [36, 'ice', -8]],
  cup: [[38, 'corniche', 18], [84, 'corniche', -5, 6], [32, 'corniche', -8]],
  gap: [[20, 'ice', 13], [0, 'void', 0], [26, 'ice', 12]],
  channel: [[42, 'channel', 24], [86, 'channel', 14, 7], [12, 'ice', 34]],
  spine: [[56, 'spine', -11, -8], [42, 'spine', 26], [24, 'ice', 8]],
  steps: [[28, 'ice', 14], [26, 'ice', -8], [30, 'ice', 12]],
  runin: [[50, 'ice', 10]],
  nest: [[42, 'nest', 18], [50, 'nest', 3, 16], [32, 'nest', -26]]
};

// a bowl lets you lean out only while half its width over its depth clears
// 1/tan(MAX_TILT) ~ 5.7; anything deeper has to be escaped with arriving speed
function piecesOf(plan, n, VS) {
  const amp = clamp(1 + n * 0.03, 1, 1.15);      // ridges get more broken with the run
  const pieces = [];
  for (const f of plan) {
    for (const q of PIECES[f]) {
      pieces.push({
        w: q[1] === 'void' ? clamp(46 + n * 3.4, 46, 102) : q[0],
        kind: q[1],
        dy: q[2] * VS,
        bump: (q[3] || 0) * VS * amp
      });
    }
  }
  return pieces;
}

function buildModel(n, salt, VS) {
  const rand = rng('egg-ridge-' + n + '-' + salt);
  const plan = planRidge(n, rand);
  const pieces = piecesOf(plan, n, VS);
  const TOP = Math.ceil(84 * VS);
  const TH = 108;
  const RH = Math.ceil(TOP + 58 * VS + TH + 20);
  const N = Math.floor(RW / STEP) + 1;

  // the same fall whatever was rolled, so ridge 1 and ridge 26 feel related.
  // no climb, either, is steeper than a full lean can pay for at rest: the
  // difference between a puzzle and a soft lock
  const sc = RW / pieces.reduce((a, p) => a + p.w, 0);
  const f = clamp(GRADE * VS / Math.max(24, Math.abs(pieces.reduce((a, p) => a + p.dy, 0))), 0.7, 1.5);
  const LEAN = Math.sin(MAX_TILT) * 0.82;
  for (const p of pieces) {
    p.dy *= f;
    const pay = LEAN * p.w * sc;
    if (p.dy < 0) p.dy = Math.max(p.dy, -pay);
    if (p.kind === 'nest') continue;
    if (p.bump < 0) p.bump = Math.max(p.bump, -pay * 0.5);
    else p.bump = Math.min(p.bump, pay * 0.5);
  }

  // every piece leaves the surface exactly where the next one takes it
  const entry = [];
  let cy = 0;
  for (let i = 0; i < pieces.length; i++) {
    entry.push(cy);
    cy = clamp(cy + pieces[i].dy, -40 * VS, 54 * VS);
    pieces[i].dy = cy - entry[i];
  }
  const starts = [];
  let acc = -HS;
  for (const p of pieces) { starts.push(acc); acc += p.w * sc; }

  const ys = new Float64Array(N);
  const ks = new Float64Array(N);
  const solid = new Uint8Array(N);
  const kind = new Array(N);
  let seg = 0;
  for (let i = 0; i < N; i++) {
    const x = -HS + i * STEP;
    while (seg < pieces.length - 2 && x >= starts[seg] + pieces[seg].w * sc) seg++;
    const p = pieces[seg];
    const t = clamp((x - starts[seg]) / Math.max(1, p.w * sc), 0, 1);
    ys[i] = clamp(entry[seg] + p.dy * t + p.bump * Math.sin(Math.PI * t), -52 * VS, 58 * VS);
    solid[i] = p.kind === 'void' ? 0 : 1;
    kind[i] = p.kind;
  }
  for (let i = 0; i < N; i++) ks[i] = (ys[Math.min(N - 1, i + 1)] - ys[Math.max(0, i - 1)]) / (2 * STEP);

  let path = 0;
  for (let i = 1; i < N; i++) if (solid[i] && solid[i - 1]) path += Math.hypot(STEP, ys[i] - ys[i - 1]);

  let nestX = HS - 96;
  for (let i = 0; i < N; i++) if (kind[i] === 'nest') { nestX = -HS + i * STEP; break; }

  const runs = [];
  let cur = null;
  for (let i = 0; i < N; i++) {
    if (solid[i]) { if (cur) cur.b = i; else { cur = { a: i, b: i }; runs.push(cur); } } else cur = null;
  }
  let hole = 0, best = 0;
  for (let i = 0; i < N; i++) {
    if (!solid[i]) { hole++; if (hole > best) best = hole; } else hole = 0;
  }
  return {
    n, salt, VS, TOP, TH, RH, N, ys, ks, solid, kind, runs, nestX, path,
    features: plan.length - 3, gapW: best * STEP, wind: 34 + n * 6.5, drain: 0.031 + n * 0.0021
  };
}

function sampleAt(model, lx) {
  if (lx < -HS + 2 || lx > HS - 2) return null;
  const fi = (lx + HS) / STEP;
  const i = clamp(Math.round(fi), 0, model.N - 1);
  if (!model.solid[i]) return null;
  const j = clamp(Math.floor(fi), 0, model.N - 2);
  const t = clamp(fi - j, 0, 1);
  return {
    y: lerp(model.ys[j], model.ys[j + 1], t),
    k: clamp(lerp(model.ks[j], model.ks[j + 1], t), -2.2, 2.2),
    kind: model.kind[i], i
  };
}

/* ------------------------------------------------------------------ art */
function paintRidge(scene, model, key) {
  const { TOP, TH, RH, VS } = model;
  canvasTex(scene, key, RW, RH, (c) => {
    const rand = rng('egg-art-' + model.n + '-' + model.salt);
    const X = (i) => i * STEP;
    const Y = (i) => model.ys[i] + TOP;
    const trace = (run, dy) => {
      c.beginPath();
      for (let i = run.a; i <= run.b; i++) { if (i === run.a) c.moveTo(X(i), Y(i) + dy); else c.lineTo(X(i), Y(i) + dy); }
    };
    for (const run of model.runs) {
      const len = (run.b - run.a) * STEP;
      const thin = { spine: 0.24, channel: 0.62, shelf: 0.88, nest: 1.2 };
      const thick = [];
      for (let i = run.a; i <= run.b; i++) {
        const edge = Math.min(i - run.a, run.b - i) * STEP;
        let t = TH * (0.66 + 0.42 * rand()) * (thin[model.kind[i]] || 1);
        t *= 0.2 + 0.8 * clamp(edge / 64, 0, 1);
        thick.push(clamp(t, 9, RH - Y(i) - 3));
      }
      c.beginPath();
      c.moveTo(X(run.a), Y(run.a));
      for (let i = run.a; i <= run.b; i++) c.lineTo(X(i), Y(i));
      for (let s = thick.length - 1; s >= 0; s--) {
        const i = run.a + s;
        c.lineTo(X(i) - 1, Y(i) + thick[s] + Math.sin(s * 0.7 + run.a) * 4 * VS);
      }
      c.closePath();
      c.save();
      c.clip();

      let lo = Infinity, hi = -Infinity;
      for (let i = run.a; i <= run.b; i++) { lo = Math.min(lo, Y(i)); hi = Math.max(hi, Y(i) + thick[i - run.a]); }
      const g = c.createLinearGradient(0, lo - 6, 0, hi + 6);
      g.addColorStop(0, '#cbe6ef');
      g.addColorStop(0.15, '#7fadc2');
      g.addColorStop(0.45, '#3f7089');
      g.addColorStop(0.8, '#204a61');
      g.addColorStop(1, '#132f42');
      c.fillStyle = g;
      c.fillRect(X(run.a) - 2, lo - 10, len + 6, hi - lo + 24);

      c.strokeStyle = 'rgba(10,32,44,0.3)';
      for (let b = 0; b < 3; b++) {                       // strata
        c.lineWidth = 0.8 + rand() * 1.3;
        c.beginPath();
        const off = 15 + b * 21 * VS + rand() * 9;
        for (let i = run.a; i <= run.b; i += 3) c.lineTo(X(i), Y(i) + off + Math.sin(i * 0.3 + b) * 3);
        c.stroke();
      }
      c.strokeStyle = 'rgba(206,240,250,0.22)';
      c.lineWidth = 0.9;
      for (let k = 0; k < 4; k++) {                       // fractures
        const sx = X(run.a) + rand() * len;
        const sy = Y(run.a) + 10 + rand() * 38;
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx + (rand() - 0.5) * 24, sy + 15 + rand() * 26);
        c.stroke();
      }

      for (let i = run.a; i <= run.b; i++) {              // the ground itself
        const kd = model.kind[i];
        if (kd === 'channel') {
          c.fillStyle = 'rgba(126,226,246,0.3)';
          c.fillRect(X(i) - 1, Y(i), STEP + 2, 9 * VS);
          c.fillStyle = 'rgba(232,255,255,0.32)';
          if ((i - run.a) % 6 === 0) c.fillRect(X(i), Y(i) + 2, STEP * 2, 1.6);
        } else if (kd === 'shelf') {
          c.fillStyle = 'rgba(247,253,255,0.55)';
          c.fillRect(X(i) - 1, Y(i) + 2, STEP + 2, 14 * VS);
        } else if (kd === 'corniche') {
          c.strokeStyle = 'rgba(226,246,252,0.2)';
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(X(i), Y(i) + 6);
          c.quadraticCurveTo(X(i) + 11, Y(i) + 16, X(i) + 2, Y(i) + 29);
          c.stroke();
        } else if (kd === 'spine') {
          c.fillStyle = 'rgba(184,232,248,0.3)';
          c.fillRect(X(i) - 1, Y(i) + 3, STEP + 2, Math.max(4, thick[i - run.a] * 0.7));
        } else if (kd === 'nest') {
          c.fillStyle = 'rgba(255,226,170,0.15)';
          c.fillRect(X(i) - 1, Y(i) + 3, STEP + 2, 22 * VS);
        }
      }
      const shade = c.createLinearGradient(0, hi - 38, 0, hi + 8);
      shade.addColorStop(0, 'rgba(8,26,38,0)');
      shade.addColorStop(1, 'rgba(8,26,38,0.55)');
      c.fillStyle = shade;
      c.fillRect(X(run.a) - 2, hi - 38, len + 6, 44);
      c.restore();

      c.lineCap = 'round';
      c.strokeStyle = 'rgba(28,66,84,0.5)';               // the crust, three passes
      c.lineWidth = 6;
      trace(run, 3); c.stroke();
      c.strokeStyle = '#eef9fc';
      c.lineWidth = 3.4;
      trace(run, 0); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 1.2;
      trace(run, -1.4); c.stroke();

      const mid = model.kind[Math.round((run.a + run.b) / 2)];
      if (mid === 'shelf') {
        c.fillStyle = 'rgba(246,252,255,0.68)';
        for (let i = run.a; i <= run.b; i += 8) {
          c.beginPath();
          c.ellipse(X(i), Y(i) - 2.5, 7 + Math.sin(i * 0.4) * 3, 3.4, 0, 0, Math.PI * 2);
          c.fill();
        }
      } else if (mid === 'corniche') {
        c.fillStyle = 'rgba(238,250,255,0.4)';
        c.beginPath();
        c.moveTo(X(run.b), Y(run.b) - 2);
        c.quadraticCurveTo(X(run.b) - 34, Y(run.b) - 26 * VS, X(run.b) - 66, Y(run.b) - 9);
        c.quadraticCurveTo(X(run.b) - 36, Y(run.b) - 7, X(run.b), Y(run.b) - 2);
        c.fill();
      }

      c.fillStyle = 'rgba(176,222,240,0.6)';              // icicles under the lip
      for (let i = run.a + 2; i < run.b - 2; i += 6) {
        if (rand() < 0.55) continue;
        const h = 8 + rand() * 19 * VS;
        const bx = Y(i) + thick[i - run.a] - 2;
        if (bx > RH - h) continue;
        c.beginPath();
        c.moveTo(X(i) - 2.4, bx);
        c.lineTo(X(i) + 2.4, bx);
        c.lineTo(X(i) + (rand() - 0.5) * 2, bx + h);
        c.closePath();
        c.fill();
      }
    }
    grain(c, RW, RH, 0.05, 7711 + model.n * 13);
  });
}

function paintEgg(scene, R, lvl) {
  canvasTex(scene, 'et-egg-' + lvl, Math.ceil(R * 3), Math.ceil(R * 3), (c, w) => {
    const cx = w / 2, cy = w / 2, rx = R, ry = R * 1.22;
    c.save();
    c.beginPath();
    c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    c.clip();
    const g = c.createLinearGradient(cx - rx, cy - ry, cx + rx * 0.6, cy + ry);
    g.addColorStop(0, '#fffaf0');
    g.addColorStop(0.42, '#f0e2c6');
    g.addColorStop(0.82, '#d6bd97');
    g.addColorStop(1, '#b39771');
    c.fillStyle = g;
    c.fillRect(0, 0, w, w);
    const rand = rng('egg-shell-' + lvl);
    for (let i = 0; i < 30; i++) {
      c.fillStyle = i % 4 ? 'rgba(150,120,86,0.24)' : 'rgba(255,255,255,0.32)';
      c.beginPath();
      c.ellipse(cx + (rand() - 0.5) * rx * 1.9, cy + (rand() - 0.5) * ry * 1.9,
        0.8 + rand() * 2.2, 0.6 + rand() * 1.4, rand(), 0, Math.PI * 2);
      c.fill();
    }
    const warm = c.createRadialGradient(cx - rx * 0.2, cy + ry * 0.3, 1, cx - rx * 0.2, cy + ry * 0.3, rx * 1.1);
    warm.addColorStop(0, 'rgba(255,186,110,0.34)');
    warm.addColorStop(1, 'rgba(255,186,110,0)');
    c.fillStyle = warm;
    c.fillRect(0, 0, w, w);
    const hl = c.createRadialGradient(cx - rx * 0.42, cy - ry * 0.5, 1, cx - rx * 0.42, cy - ry * 0.5, rx * 0.8);
    hl.addColorStop(0, 'rgba(255,255,255,0.8)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hl;
    c.fillRect(0, 0, w, w);
    c.fillStyle = 'rgba(30,62,78,0.26)';
    c.beginPath();
    c.ellipse(cx + rx * 0.4, cy + ry * 0.42, rx * 0.6, ry * 0.4, 0.4, 0, Math.PI * 2);
    c.fill();
    const rc = rng('egg-crack-' + lvl);
    for (let s = 0; s < lvl; s++) {                       // hairline cracks, one per level
      let px = cx + Math.cos(-1.3 + s * 0.85 + rc() * 0.5) * rx * 0.82;
      let py = cy + Math.sin(-1.3 + s * 0.85 + rc() * 0.5) * ry * 0.82;
      c.strokeStyle = 'rgba(58,40,30,0.75)';
      c.lineWidth = 1 + s * 0.24;
      c.beginPath();
      c.moveTo(px, py);
      for (let k = 0; k < 3 + s; k++) {
        px += (cx - px) * (0.24 + rc() * 0.16) + (rc() - 0.5) * rx * 0.34;
        py += (cy - py) * (0.24 + rc() * 0.16) + (rc() - 0.5) * ry * 0.3;
        c.lineTo(px, py);
      }
      c.stroke();
      c.strokeStyle = 'rgba(255,250,240,0.5)';
      c.lineWidth = 0.7;
      c.stroke();
    }
    c.restore();
    c.strokeStyle = 'rgba(46,78,92,0.5)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.ellipse(cx, cy, rx - 0.6, ry - 0.6, 0, 0, Math.PI * 2);
    c.stroke();
  });
}

function art(scene, R, VS) {
  const pal = MOODS.ice;
  for (let lvl = 0; lvl < CRACKS; lvl++) paintEgg(scene, R, lvl);

  canvasTex(scene, 'et-claw', Math.ceil(96 * VS), Math.ceil(120 * VS), (c, w, h) => {
    c.scale(w / 96, h / 120);
    c.lineCap = 'round';
    const ker = c.createLinearGradient(20, 0, 80, 110);
    ker.addColorStop(0, '#4b6472');
    ker.addColorStop(0.5, '#2f4856');
    ker.addColorStop(1, '#1a2c38');
    [[16, 18, 34, 96], [48, 10, 48, 100], [80, 18, 62, 96]].forEach(([x0, y0, x1, y1]) => {
      c.strokeStyle = ker;
      c.lineWidth = 15;
      c.beginPath();
      c.moveTo(x0, y0);
      c.quadraticCurveTo(x0 + (x1 - x0) * 0.1, y0 + (y1 - y0) * 0.55, x1, y1);
      c.stroke();
      c.strokeStyle = 'rgba(228,244,250,0.34)';
      c.lineWidth = 3.4;
      c.beginPath();
      c.moveTo(x0 - 4, y0 + 4);
      c.quadraticCurveTo(x0 + (x1 - x0) * 0.1, y0 + (y1 - y0) * 0.55, x1 - 3, y1 - 4);
      c.stroke();
    });
    c.fillStyle = '#d9e8ee';
    [[34, 96], [48, 100], [62, 96]].forEach(([x, y]) => {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 4, y + 15);
      c.lineTo(x - 4, y + 12);
      c.closePath();
      c.fill();
    });
    grain(c, w, h, 0.04, 63);
  });

  canvasTex(scene, 'et-nest', Math.ceil(150 * VS), Math.ceil(110 * VS), (c, w, h) => {
    c.scale(w / 150, h / 110);
    const rand = rng('et-nest');
    for (let i = 0; i < 15; i++) {
      c.strokeStyle = i % 3 ? '#6a5233' : '#8b6d43';
      c.lineWidth = 2 + rand() * 2.4;
      const y = 54 + rand() * 40;
      c.beginPath();
      c.moveTo(6 + rand() * 20, y);
      c.quadraticCurveTo(75, y - 16 - rand() * 16, 144 - rand() * 20, y - 4);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,196,116,0.3)';
    c.beginPath();
    c.ellipse(75, 62, 44, 22, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 5; i++) {
      c.fillStyle = '#e9f6fb';
      c.beginPath();
      c.ellipse(20 + rand() * 110, 34 + rand() * 24, 8 + rand() * 10, 4 + rand() * 4, rand(), 0, Math.PI * 2);
      c.fill();
    }
    grain(c, w, h, 0.045, 21);
  });

  canvasTex(scene, 'et-stone', Math.ceil(120 * VS), Math.ceil(150 * VS), (c, w, h) => {
    c.scale(w / 120, h / 150);
    const g = c.createLinearGradient(10, 20, 110, 150);
    g.addColorStop(0, '#5c8497');
    g.addColorStop(0.6, '#2f566a');
    g.addColorStop(1, '#173443');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(6, 150);
    c.quadraticCurveTo(2, 90, 30, 54);
    c.quadraticCurveTo(60, 14, 92, 46);
    c.quadraticCurveTo(120, 78, 114, 150);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(232,246,250,0.5)';
    c.beginPath();
    c.ellipse(58, 40, 30, 9, -0.2, 0, Math.PI * 2);
    c.fill();
    grain(c, w, h, 0.05, 88);
  });

  canvasTex(scene, 'et-flake', 18, 18, (c) => {
    const g = c.createRadialGradient(9, 9, 0, 9, 9, 9);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, 'rgba(226,246,255,0.5)');
    g.addColorStop(1, 'rgba(226,246,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(9, 9, 9, 0, Math.PI * 2);
    c.fill();
  });

  canvasTex(scene, 'et-streak', 120, 8, (c) => {
    const g = c.createLinearGradient(0, 4, 120, 4);
    g.addColorStop(0, 'rgba(214,244,255,0)');
    g.addColorStop(0.4, pal.mist + 'cc');
    g.addColorStop(1, 'rgba(214,244,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 2.6, 120, 2);
  });
}

/* ------------------------------------------------------------ gameplay */
function create(scene) {
  const M = scene.M;
  const K = scene.k;
  const VS = M.portrait ? 1.22 : 1;
  const R = M.portrait ? 26 : 20;
  const PY = M.Y(PIVOT_S);
  const LOSS_Y = M.Y(LOSS_S);
  const weather = rng('egg-weather');
  art(scene, R, VS);

  let model = buildModel(1, 1, VS);
  let ridgeKey = 'et-ridge-1-1';
  paintRidge(scene, model, ridgeKey);

  const st = {
    n: 1, salt: 1, score: 0, hearts: 3, warmth: 1, cracks: 0,
    over: false, busy: 0, phase: 'roll', braced: false,
    wind: 0, gust: 0, gustT: 6, gustLife: 0, windLock: null,
    landV: 0, losses: 0, lastLine: '', spin: 0, coldWarn: 0, slowT: 0, airT: 0,
    lastEnd: 'bank', told: {}
  };
  const e = { x: 0, y: 0, vx: 0, vy: 0, lx: 0, ly: 0, vt: 0, kind: 'ice' };
  const tilt = { th: 0, target: 0, manual: false, key: 0, ptr: 0 };

  const ridge = scene.add.container(PIVOT_X, PY).setDepth(12);
  const ridgeImg = scene.add.image(-HS, -model.TOP, ridgeKey).setOrigin(0, 0);
  ridge.add(ridgeImg);
  const nestGlow = scene.add.image(0, 0, 'arc-glow').setAlpha(0.3)
    .setTint(0xffcf8a).setBlendMode(Phaser.BlendModes.ADD);
  ridge.add(nestGlow);

  function placeNestGlow() {
    const s = sampleAt(model, model.nestX + 30);
    nestGlow.x = model.nestX + 30;
    nestGlow.y = (s ? s.y : 0) - 6;
    nestGlow.setScale(0.95 * K);
  }
  placeNestGlow();

  scene.add.image(148, M.Y(432), 'et-stone').setOrigin(0.5, 1).setScale(1.5 * K).setAlpha(0.72).setDepth(5);
  scene.add.image(846, M.Y(438), 'et-stone').setOrigin(0.5, 1).setScale(1.9 * K).setAlpha(0.78).setDepth(5);
  scene.add.image(864, M.Y(420), 'et-nest').setOrigin(0.5, 1).setScale(K).setDepth(7);
  const farGlow = scene.add.image(864, M.Y(406), 'arc-glow').setDepth(6).setScale(1.5 * K)
    .setAlpha(0.34).setTint(0xffb663).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: farGlow, alpha: 0.52, scale: 1.62 * K, duration: 2200, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  const fr = rng('et-flakes');
  const flakes = [];
  for (let i = 0; i < (M.portrait ? 40 : 26); i++) {
    const f = scene.add.image(fr() * W, M.Y(fr() * 540), 'et-flake')
      .setDepth(18).setScale((0.5 + fr() * 0.9) * K).setAlpha(0.28 + fr() * 0.4);
    f._d = { x: f.x, y: f.y, sp: 12 + fr() * 26, ph: fr() * 6.28 };
    flakes.push(f);
  }
  const streaks = [];
  for (let i = 0; i < 7; i++) {
    const s = scene.add.image(fr() * W, M.Y(150 + fr() * 330), 'et-streak').setDepth(19).setAlpha(0);
    s._sp = 620 + fr() * 480;
    streaks.push(s);
  }

  const spray = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 20, max: 130 }, lifespan: { min: 420, max: 900 },
    scale: { start: 0.3, end: 0.02 }, alpha: { start: 0.6, end: 0 },
    tint: 0xeef8ff, gravityY: 60, emitting: false
  }).setDepth(20);

  const egg = scene.add.image(0, 0, 'et-egg-0').setDepth(15).setScale(K * 0.92);
  const eggGlow = scene.add.image(0, 0, 'arc-glow').setDepth(13).setScale(1.25 * K)
    .setAlpha(0.3).setTint(0xffc07a).setBlendMode(Phaser.BlendModes.ADD);
  const claw = scene.add.image(0, 0, 'et-claw').setDepth(16).setScale(0.9 * K).setAlpha(0);
  const shadow = scene.add.ellipse(0, 0, R * 2.2, R * 0.7, 0x0b2230, 0.28).setDepth(11);
  const veil = scene.add.rectangle(0, M.Y(0), W, M.Y(540) - M.Y(0), 0x8ec3d6, 0).setOrigin(0, 0).setDepth(30);
  let coldPulse = 0;
  let t = 0;

  function setEggTexture() {
    egg.setTexture('et-egg-' + clamp(Math.round(st.cracks * (CRACKS - 1) / 0.9), 0, CRACKS - 1));
  }

  function toWorld(lx, ly) {
    const c = Math.cos(tilt.th), s = Math.sin(tilt.th);
    return [PIVOT_X + c * lx - s * ly, PY + s * lx + c * ly];
  }

  function restOn(lx, vt) {
    const s = sampleAt(model, clamp(lx, -HS + 4, model.nestX + 40));
    if (!s) return false;
    e.lx = clamp(lx, -HS + 4, model.nestX + 40);
    e.ly = s.y - R * Math.min(1.9, Math.hypot(1, s.k));
    const [wx, wy] = toWorld(e.lx, e.ly);
    e.x = wx; e.y = wy;
    const L = Math.hypot(1, s.k);
    const c = Math.cos(tilt.th), sn = Math.sin(tilt.th);
    e.vx = vt * (c - sn * s.k) / L;
    e.vy = vt * (sn + c * s.k) / L;
    e.kind = s.kind;
    e.vt = vt;
    st.phase = 'roll';
    return true;
  }

  function resetEgg() {
    restOn(-HS + 64, 0);
    e.vx = 0; e.vy = 0; e.vt = 0;
    st.braced = false;
    claw.setAlpha(0);
    egg.setVisible(true);
    egg.alpha = 1;
  }
  resetEgg();

  /* ----------------------------------------------------------- input */
  const keys = scene.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D' });
  scene.input.keyboard.on('keydown-SPACE', () => brace(true));
  scene.input.keyboard.on('keyup-SPACE', () => brace(false));
  scene.input.on('pointerdown', (p) => { lean(p.x); brace(true); });
  scene.input.on('pointermove', (p) => lean(p.x));
  scene.input.on('pointerup', () => brace(false));

  function lean(px) { tilt.ptr = clamp((px - PIVOT_X) / 250, -1, 1) * MAX_TILT; }

  function brace(on) {
    if (on) {
      if (st.phase !== 'roll' || st.braced || st.busy > 0 || st.warmth <= 0.04) return;
      st.braced = true;
      scene.sfx('tick');
      return;
    }
    if (!st.braced) return;
    st.braced = false;
    claw.setAlpha(0);
    // released at rest on purpose: the claw is a re-aim, never a throw
    e.vx = 0;
    e.vy = 0;
    e.vt = 0;
  }

  /* --------------------------------------------------------- outcomes */
  function line(text, ms) {
    st.lastLine = text;
    scene.notice(text, ms || 2100);
  }

  function land(impact) {
    st.landV = Math.round(impact);
    if (impact > IMPACT_FATAL * (1 - 0.42 * st.cracks)) {
      shatter(LINES.hard);
      return;
    }
    if (impact > IMPACT_CRACK) {
      st.cracks = clamp(st.cracks + 0.16 + (impact - IMPACT_CRACK) / 900, 0, 1);
      setEggTexture();
      scene.sfx('hurt');
      scene.shake(150, 0.007);
      scene.popText(e.x, e.y - R * 2.6, 'a crack', '#ffd9d1');
      line(LINES.crack, 1700);
    } else scene.sfx('land');
    spray.emitParticleAt(e.x, e.y + R * 0.7, clamp(Math.round(impact / 26), 3, 14));
  }

  function loseHeart(reason) {
    if (st.over || st.busy > 0) return;
    st.hearts--;
    st.losses++;
    st.lastEnd = 'lost';
    scene.sfx('bad');
    scene.shake(260, 0.013);
    scene.cameras.main.flash(220, 120, 170, 200);
    line(reason, 2200);
    if (st.hearts <= 0) { finish(false); return; }
    st.busy = 1.15;
    st.warmth = Math.max(0.55, st.warmth);
    st.cracks = Math.max(0, st.cracks - 0.25);
    setEggTexture();
    st.phase = 'carry';
  }

  function shatter(why) {
    scene.sfx('boom');
    scene.shake(300, 0.016);
    scene.burst(e.x, e.y, 0xf6e6c4, 20, { life: 780, gravity: 320, spin: true });
    scene.burst(e.x, e.y, 0xdff2fb, 12, { life: 620, gravity: 120 });
    scene.popText(e.x, e.y - R * 3, 'it broke', '#ffd9d1');
    egg.setVisible(false);
    loseHeart(why + ' ' + LINES.shatter);
  }

  function offStage() {
    st.phase = 'lost';
    egg.setVisible(false);
    scene.burst(clamp(e.x, 24, W - 24), M.Y(LOSS_S - 6), 0xeaf7fb, 16, { life: 640, gravity: 140 });
    scene.sfx('boom');
    loseHeart(LINES.off);
  }

  function bank() {
    st.score++;
    st.phase = 'carry';
    st.lastEnd = 'bank';
    st.busy = 1.05;
    if (st.cracks > 0.05) scene.sfx('chime');
    st.cracks = Math.max(0, st.cracks - 0.55);
    st.warmth = clamp(st.warmth + 0.42, 0, 1);
    setEggTexture();
    scene.sfx('good');
    scene.burst(e.x, e.y, 0xffd77a, 16, { life: 700, gravity: 60, spin: true });
    scene.popText(e.x, e.y - R * 3, '+1 ridge', '#dff6e8');
    if (st.score >= GOAL) { finish(true); return; }
    if (st.score === 12) line(LINES.late, 2100);
    else line(LINES.bank[st.score % LINES.bank.length], 1900);
  }

  function finish(win) {
    st.over = true;
    st.phase = 'over';
    scene.finish(win, {
      score: st.score,
      note: win
        ? `${st.score} ridges leaned and the egg arrived whole`
        : `${st.score} ridges, and the cold kept the last one`
    });
  }

  function swapRidge() {
    const oldKey = ridgeKey;
    model = buildModel(st.n, st.salt, VS);
    ridgeKey = 'et-ridge-' + st.n + '-' + st.salt;
    paintRidge(scene, model, ridgeKey);
    ridgeImg.setTexture(ridgeKey);
    ridgeImg.y = -model.TOP;
    placeNestGlow();
    if (oldKey !== ridgeKey && scene.textures.exists(oldKey)) scene.textures.remove(oldKey);
    resetEgg();
    st.told = {};
    st.gustT = 4 + weather() * 3;
  }

  /* -------------------------------------------------------------- loop */
  function windBase() { return model.wind; }

  function windNow() {
    if (st.windLock !== null) return st.windLock;
    const sway = 0.42 + 0.38 * Math.sin(t * 0.42) + 0.2 * Math.sin(t * 0.17 + 1.3);
    return windBase() * sway + st.gust;
  }

  function hud() {
    const speed = Math.abs(e.vt);
    scene.hud({
      score: st.score,
      progress: st.warmth,
      hearts: st.hearts,
      extra: st.warmth < 0.26 ? 'the cold is in it'
        : st.slowT > 1.6 ? 'it has stopped moving'
          : st.braced ? 'braced, lean it over'
            : speed > 330 ? 'too fast'
              : st.gustLife > 0.5 ? 'the wind has it'
                : e.kind === 'shelf' ? 'soft snow'
                  : e.kind === 'nest' ? 'arrive slowly' : ''
    });
  }

  // one short step of the egg against the rotated heightfield
  function step(dt) {
    const kd = KIND[e.kind] || KIND.ice;
    let acc = st.wind * kd.wind * Math.cos(tilt.th);
    if (st.phase === 'air') acc += st.gust * 0.4;
    e.vy += G * dt;
    e.vx += acc * dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    const c = Math.cos(tilt.th), sn = Math.sin(tilt.th);
    e.lx = c * (e.x - PIVOT_X) + sn * (e.y - PY);
    e.ly = -sn * (e.x - PIVOT_X) + c * (e.y - PY);

    const s = sampleAt(model, e.lx);
    if (!s) {
      st.phase = 'air';
      st.airT += dt;
      e.vt = e.vx * c + e.vy * sn;
      return true;
    }
    const L = Math.hypot(1, s.k);
    const pen = R * Math.min(1.9, L) - (s.y - e.ly);
    if (pen <= 0) {
      st.phase = 'air';
      st.airT += dt;
      e.vt = e.vx * c + e.vy * sn;
      return true;
    }
    e.x += sn * pen;
    e.y -= c * pen;
    let lvx = c * e.vx + sn * e.vy;
    let lvy = -sn * e.vx + c * e.vy;
    let vt = (lvx + lvy * s.k) / L;
    let vn = (lvx * s.k - lvy) / L;
    if (st.phase === 'air') {
      // only a real leave-and-return is a landing: the 0.1 restitution bounce
      // lifts the egg for a step or two and re-grazes the same surface, and a
      // graze must not record itself as the impact you arrived with
      if (st.airT > 0.05) land(-vn);
      if (st.over || st.busy > 0) return false;
    }
    st.phase = 'roll';
    st.airT = 0;
    e.kind = s.kind;
    if (vn < 0) vn = -vn * 0.1;
    const kk = KIND[e.kind] || KIND.ice;
    const dv = (DRAG * kk.drag * vt * vt + RES * kk.res) * dt;
    vt = Math.abs(vt) <= dv ? 0 : vt - Math.sign(vt) * dv;
    lvx = (vt + vn * s.k) / L;
    lvy = (vt * s.k - vn) / L;
    e.vx = c * lvx - sn * lvy;
    e.vy = sn * lvx + c * lvy;
    e.vt = vt;
    if (Math.abs(vt) > 60 && weather() < dt * 26) {
      spray.emitParticleAt(e.x - vt * 0.05, e.y + R * 0.85, 1);
    }
    return true;
  }

  function chill(dt, speed) {
    const still = clamp(1 - speed / 175, 0, 1);
    st.slowT = speed < 42 ? st.slowT + dt : 0;
    if (st.warmth < 0.3 && st.coldWarn <= 0 && still > 0.7) {
      st.coldWarn = 7;
      line(LINES.cold, 1800);
      scene.sfx('hurt');
    }
    st.coldWarn -= dt;
    st.warmth = clamp(st.warmth - dt * model.drain * (0.3 + 3.4 * still), 0, 1);
    if (st.warmth > 0.001) return true;
    st.warmth = 0.4;
    scene.burst(e.x, e.y, 0xdff2fb, 16, { life: 620, gravity: 100 });
    loseHeart(LINES.freeze);
    return false;
  }

  function present(dt, speed) {
    egg.x = e.x;
    egg.y = e.y;
    egg.visible = st.phase !== 'lost' && st.phase !== 'carry';
    st.spin += (e.vx / R) * dt;
    egg.rotation = st.spin * 0.86 + tilt.th * 0.4;
    eggGlow.x = e.x;
    eggGlow.y = e.y;
    eggGlow.alpha = 0.1 + st.warmth * 0.34 + Math.sin(t * 2.4) * 0.03;
    eggGlow.setTint(st.warmth < 0.3 ? 0x9fe6ff : 0xffc07a);
    shadow.x = e.x;
    shadow.y = e.y + R * 1.15;
    shadow.alpha = st.phase === 'roll' ? 0.3 : 0.12;
    nestGlow.alpha = 0.22 + Math.sin(t * 1.7) * 0.08;
    coldPulse = st.warmth < 0.34 ? Math.min(0.34, coldPulse + dt * 0.3) : Math.max(0, coldPulse - dt * 0.6);
    veil.setFillStyle(0xa9d3e2, coldPulse);
    scene.audio.setTension(st.warmth < 0.32 ? 0.7 : speed > 320 ? 0.42 : 0.15);
  }

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    t += dt;
    if (st.over) return;

    // ---- the lean, with a little weight in it
    if (keys.left.isDown) tilt.key = clamp(tilt.key - dt * 0.4, -MAX_TILT, MAX_TILT);
    else if (keys.right.isDown) tilt.key = clamp(tilt.key + dt * 0.4, -MAX_TILT, MAX_TILT);
    else tilt.key = lerp(tilt.key, tilt.ptr, Math.min(1, dt * 1.4));
    // the claw carries the egg in level: a lean still held through the hand-off
    // would set it down on a slope already sliding toward the edge
    const want = st.busy > 0 ? 0 : clamp(tilt.manual ? tilt.target : tilt.ptr + tilt.key, -MAX_TILT, MAX_TILT);
    tilt.th = lerp(tilt.th, want, Math.min(1, dt * 6.4));
    ridge.rotation = tilt.th;

    // ---- the wind, and the sky moving with it
    st.gustT -= dt;
    if (st.gustT <= 0) {
      st.gustT = 5.5 + weather() * 6 - Math.min(3, st.n * 0.15);
      st.gust = (weather() < 0.62 ? 1 : -1) * (60 + st.n * 9 + weather() * 60);
      st.gustLife = 1.9;
      scene.sfx('whoosh');
      if (Math.abs(st.gust) > 130 && weather() < 0.5) line(LINES.gust, 1600);
    }
    st.gustLife = Math.max(0, st.gustLife - dt);
    if (st.gustLife <= 0) st.gust *= 0.94;
    st.wind = windNow();
    flakes.forEach((f) => {
      const d = f._d;
      d.y += (d.sp * 0.5 + 18) * dt;
      d.x += (st.wind * 0.5 + Math.sin(t * 0.7 + d.ph) * 12) * dt;
      if (d.y > M.Y(548)) { d.y = M.Y(-10); d.x = weather() * W; }
      if (d.x > W + 20) d.x = -20;
      if (d.x < -20) d.x = W + 20;
      f.x = d.x; f.y = d.y;
      f.rotation += dt * 0.6;
    });
    streaks.forEach((s) => {
      s.x += (s._sp + Math.abs(st.wind) * 2) * dt * (st.wind >= 0 ? 1 : -1);
      if (s.x > W + 140) s.x = -140;
      if (s.x < -140) s.x = W + 140;
      s.setFlipX(st.wind < 0);
      s.alpha = clamp(Math.abs(st.wind) / 300, 0, 0.45) * (st.gustLife > 0 ? 1.5 : 0.7);
    });

    // ---- the pause while the egg is picked up and put down again
    if (st.busy > 0) {
      st.busy -= dt;
      egg.alpha = Math.max(0, egg.alpha - dt * 3);
      claw.setAlpha(0);
      if (st.busy <= 0) {
        if (st.lastEnd === 'bank') { st.n++; st.salt = 1 + Math.floor(weather() * 9999); }
        swapRidge();
        scene.burst(e.x, e.y, 0xe8f7ff, 8, { life: 500, gravity: 90 });
      }
      hud();
      return;
    }

    // ---- the claw holds the egg still while the ridge is re-angled under it
    if (st.braced && st.phase === 'roll') {
      const s = sampleAt(model, e.lx);
      if (s) {
        e.ly = s.y - R * Math.min(1.9, Math.hypot(1, s.k));
        const [wx, wy] = toWorld(e.lx, e.ly);
        e.x = wx; e.y = wy;
        e.vx = 0; e.vy = 0; e.vt = 0;
        e.kind = s.kind;
      }
      claw.alpha = Math.min(1, claw.alpha + dt * 9);
      claw.x = e.x;
      claw.y = e.y - R * 1.8;
      claw.rotation = tilt.th;
      if (weather() < dt * 9) spray.emitParticleAt(e.x + (weather() - 0.5) * R * 2, e.y + R * 0.8, 1);
      st.slowT += dt;
      st.warmth -= dt * 0.085;
      if (st.warmth <= 0.001) {
        st.warmth = 0.4;
        scene.burst(e.x, e.y, 0xdff2fb, 16, { life: 620, gravity: 100 });
        loseHeart(LINES.freeze);
        hud();
        return;
      }
      present(dt, 0);
      hud();
      return;
    }
    claw.alpha = Math.max(0, claw.alpha - dt * 7);

    // ---- the egg: gravity and weather, then the ridge tells it what to do
    const sub = Math.max(1, Math.min(4, Math.ceil(dt / 0.014)));
    for (let i = 0; i < sub; i++) if (!step(dt / sub)) break;
    if (st.over || st.busy > 0) { hud(); return; }

    const speed = Math.abs(e.vt);
    if (!st.told[e.kind] && SAY[e.kind]) {
      st.told[e.kind] = 1;
      line(SAY[e.kind], 1700);
    } else if (!st.told.gap && st.phase === 'air' && e.lx > -HS + 10 && e.lx < model.nestX - 10 && model.gapW > 30) {
      st.told.gap = 1;
      line(LINES.gap, 1700);
    }
    if (!chill(dt, speed)) { hud(); return; }

    // ---- gone, or home
    if (e.y > LOSS_Y || e.x < -40 || e.x > W + 40) offStage();
    else if (st.phase === 'roll' && e.lx > model.nestX - 4 && speed < THROAT) bank();
    if (st.over || st.busy > 0) { hud(); return; }

    present(dt, speed);
    hud();
  }

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'lean the ridge' });
  line(LINES.open, 2800);
  scene.time.delayedCall(2900, () => line(LINES.nest, 2000));

  // headless rAF only manages a frame or two a second, so the probe asks for
  // game time in fixed 12.5ms slices through the very same update the loop calls
  const tick = (gs) => {
    const n = clamp(Math.round((gs || 0.0125) / 0.0125), 1, 6000);
    for (let i = 0; i < n; i++) update(0, 12.5);
    return state();
  };

  const state = () => ({
    ridge: st.n, score: st.score, hearts: st.hearts, warmth: Number(st.warmth.toFixed(3)),
    time: Number(t.toFixed(2)), tilt: Number(tilt.th.toFixed(4)),
    tiltTarget: Number((tilt.manual ? tilt.target : tilt.ptr + tilt.key).toFixed(4)),
    speed: Number(e.vt.toFixed(1)), wind: Number(st.wind.toFixed(1)), gust: Number(st.gust.toFixed(1)),
    lx: Math.round(e.lx), ly: Math.round(e.ly), kind: e.kind, phase: st.phase,
    braced: st.braced, cracks: Number(st.cracks.toFixed(2)), landV: st.landV,
    path: Math.round(model.path), nestX: Math.round(model.nestX), busy: Number(st.busy.toFixed(2)),
    features: model.features, gapW: model.gapW, drain: Number(model.drain.toFixed(4)),
    losses: st.losses, ready: st.busy <= 0, over: st.over, line: st.lastLine
  });

  return {
    update,
    state,
    tick,
    setTilt: (v) => { tilt.manual = true; tilt.target = clamp(v, -MAX_TILT, MAX_TILT); },
    releaseTilt: () => { tilt.manual = false; tilt.target = 0; },
    setBrace: (v) => brace(!!v),
    setWarmth: (v) => { st.warmth = clamp(v, 0, 1); },
    setHearts: (v) => { st.hearts = v; },
    setCracks: (v) => { st.cracks = clamp(v, 0, 1); setEggTexture(); },
    setWind: (v) => { st.windLock = (v === null || v === undefined) ? null : Number(v); },
    setRidge: (v) => { st.n = clamp(Math.round(v), 1, GOAL); st.salt = 1; swapRidge(); },
    newRidge: (v) => { st.n = clamp(Math.round(v), 1, GOAL); st.salt = 7; swapRidge(); },
    windBase: () => Math.round(windBase()),
    forceGust: (dir) => { st.gust = (dir >= 0 ? 1 : -1) * (160 + st.n * 9); st.gustLife = 2.4; st.gustT = 7; },
    featureX: (kindName) => {
      for (let i = 0; i < model.N; i++) if (model.kind[i] === kindName) return -HS + i * STEP + STEP;
      return null;
    },
    surfaceY: (lx) => { const q = sampleAt(model, lx); return q ? Number(q.y.toFixed(1)) : null; },
    slopeAt: (lx) => { const q = sampleAt(model, lx); return q ? Number(q.k.toFixed(2)) : null; },
    kindAt: (lx) => { const q = sampleAt(model, lx); return q ? q.kind : null; },
    climbCheck: () => {
      // the steepest one-way climb the full lean cannot pay for, in px: a lean of
      // MAX_TILT buys sin(MAX_TILT) of height per px of run, so >0 means soft lock
      let worst = 0;
      for (let a = 1; a < model.N; a++) {
        if (-HS + a * STEP >= model.nestX) break;
        if (!model.solid[a]) continue;
        let b = a;
        while (b + 1 < model.N && model.solid[b + 1] && model.ys[b + 1] < model.ys[b]) b++;
        worst = Math.max(worst, model.ys[a] - model.ys[b] - Math.sin(MAX_TILT) * (b - a) * STEP);
        a = b;
      }
      return Number(worst.toFixed(1));
    },
    placeOn: (lx, vt) => restOn(lx, vt || 0),
    // probe hook: re-surface one stretch of the ridge that is already built, so
    // two surfaces can be raced over identical ground instead of two similar hills
    setSurface: (x0, x1, kindName) => {
      if (!KIND[kindName]) return 0;
      let n = 0;
      for (let i = Math.floor((x0 + HS) / STEP); i <= Math.ceil((x1 + HS) / STEP); i++) {
        if (i < 0 || i >= model.N || !model.solid[i]) continue;
        model.kind[i] = kindName;
        n++;
      }
      return n;
    },
    dropFrom: (lx, height, vy) => {
      const q = sampleAt(model, clamp(lx, -HS + 4, model.nestX + 40));
      if (!q) return false;
      e.lx = clamp(lx, -HS + 4, model.nestX + 40);
      e.ly = q.y - R - (height || 140);
      const [wx, wy] = toWorld(e.lx, e.ly);
      e.x = wx; e.y = wy;
      e.vx = 0; e.vy = vy || 0; e.vt = 0;
      e.kind = q.kind;
      st.phase = 'air';
      egg.setVisible(true);
      egg.alpha = 1;
      return true;
    },
    advance: () => {
      if (st.over) return;
      st.score++;
      if (st.score >= GOAL) { finish(true); return; }
      st.n++;
      st.salt = 1 + Math.floor(weather() * 9999);
      swapRidge();
      st.busy = 0;
    },
    goal: GOAL,
    stars: STAR
  };
}

export default { id: 'egg-tilt', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
