import { overlayPhotorealMaterial } from '../../../photoreal-textures.js?v=du-276e018775e133bb';
// Mud Wall — a storm slope and one trowel of work.
// The lahar is a real flow: it only ever goes down, it splits when the drops are
// equal, it cuts where it runs and pools where it is dammed. You cannot wall a
// mountain, so you choose the two or three decisions that matter.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-276e018775e133bb';

const STAR = [6, 11, 17];

const COLS = 30, ROWS = 18, N = COLS * ROWS;
const TOP = 104, BOTTOM = 534;
const CW = W / COLS;
const RH = (BOTTOM - TOP) / ROWS;
const SS = 3;
const LW = COLS * SS, LH = ROWS * SS;

const TOTAL_ROUNDS = 18;
const PREP = 6.4;
const WORK_MAX = 100;
const DIG_COST = 4, DIG_DEPTH = 5.5, CUT_MAX = 26;
const PILE_COST = 6, PILE_RAISE = 4.6, PILE_MAX = 15;
const FLUX = 11, EROS = 0.006, CAPF = 0.9, DEPR = 2.2;
const SIM_STEP = 1 / 60;
const SCREE_C = 12;
const NEST_C0 = 15, NEST_C1 = 22;
const DAM_ROW = 6, DAM_C0 = 19, DAM_C1 = 23, NOTCH_ROW = 8, NOTCH_C0 = 16, NOTCH_C1 = 19;
const BREACH_FRAC = 0.3;

const TAU = Math.PI * 2;
const pal = MOODS.storm;
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const MUD_LO = rgb('#33443f'), MUD_MID = rgb('#636a5a'), MUD_HI = rgb('#97967a');
const WET_MUD = rgb('#2a3834');
const CLEAN = rgb('#3a8f8c'), MUDDY = rgb('#7a5c31'), FOAM = rgb('#cdeee2');
const ACC = rgb(pal.accent);

const drawC = (r) => 19.4 + Math.sin(r * 0.34 + 0.4) * 3.0;
const gullyC = (r) => 5.4 + Math.sin(r * 0.3) * 2.2;
const gauss = (d, s) => Math.exp(-(d * d) / (2 * s * s));
const cellX = (c) => c * CW + CW / 2;
const cellStageY = (r) => TOP + r * RH + RH / 2;

// the side valley the player is trying to feed: it runs south-west off the
// spur above the draw down to the scree. beds are the floor the mud was cut
// to, one node per cell so the valley never sill-blocks itself.
const DIV = [[19, 8, 20.4], [18, 8, 19.9], [17, 8, 21.4], [16, 8, 21.0], [15, 8, 8.4],
  [14, 8, 8.0], [14, 9, 7.5], [13, 9, 7.0], [12, 10, 6.5], [11, 10, 6.0],
  [10, 11, 5.5], [9, 11, 5.0], [9, 12, 4.5], [8, 13, 3.9], [7, 13, 3.3],
  [7, 14, 2.7], [6, 15, 2.0], [5, 15, 1.4], [5, 16, 0.8], [4, 17, -6.0]];
const DIV_R = 2.6;
const span = (a, b) => { const out = []; for (let c = a; c <= b; c++) out.push(c); return out; };

function divBed(c, r) {
  let best = 1e9, bed = 0;
  for (let k = 0; k < DIV.length - 1; k++) {
    const c0 = DIV[k][0], r0 = DIV[k][1], c1 = DIV[k + 1][0], r1 = DIV[k + 1][1];
    const dc = c1 - c0, dr = r1 - r0;
    const len = dc * dc + dr * dr || 1;
    const t = clamp(((c - c0) * dc + (r - r0) * dr) / len, 0, 1);
    const d = Math.hypot(c - (c0 + dc * t), r - (r0 + dr * t));
    if (d < best) { best = d; bed = DIV[k][2] + (DIV[k + 1][2] - DIV[k][2]) * t; }
  }
  return { d: best, bed };
}

function paintPit(c, w, h) {
  const rand = rng('mw-pit');
  for (let i = 0; i < 150; i++) {
    const x = rand() * w, y = rand() * h;
    const rx = 2.2 + rand() * 7, ry = rx * (0.42 + rand() * 0.3);
    c.fillStyle = `rgba(10,20,22,${0.09 + rand() * 0.12})`;
    c.beginPath(); c.ellipse(x, y, rx, ry, rand() * 3, 0, TAU); c.fill();
    c.fillStyle = `rgba(214,238,232,${0.05 + rand() * 0.08})`;
    c.beginPath(); c.ellipse(x - rx * 0.25, y - ry * 0.55, rx * 0.62, ry * 0.5, 0, 0, TAU); c.fill();
  }
  for (let i = 0; i < 40; i++) {
    const x = rand() * w, y = rand() * h;
    c.strokeStyle = `rgba(18,30,32,${0.05 + rand() * 0.07})`;
    c.lineWidth = 0.8 + rand();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rand() - 0.5) * 26, y + 12 + rand() * 26); c.stroke();
  }
  grain(c, w, h, 0.05, 91);
}

function art(scene) {
  canvasTex(scene, 'mw-pit', 220, 220, paintPit);

  canvasTex(scene, 'mw-rain', 300, 340, (c, w, h) => {
    const rand = rng('mw-rain');
    c.lineCap = 'round';
    for (let i = 0; i < 130; i++) {
      const x = rand() * w, y = rand() * h;
      const len = 22 + rand() * 70;
      const g = c.createLinearGradient(x, y, x - len * 0.22, y + len);
      g.addColorStop(0, 'rgba(214,240,236,0)');
      g.addColorStop(0.35, `rgba(214,240,236,${0.16 + rand() * 0.3})`);
      g.addColorStop(1, 'rgba(214,240,236,0)');
      c.strokeStyle = g;
      c.lineWidth = 0.7 + rand() * 1.5;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - len * 0.22, y + len); c.stroke();
    }
  });

  canvasTex(scene, 'mw-nest', 190, 118, (c, w, h) => {
    const rand = rng('mw-nest');
    c.strokeStyle = 'rgba(12,22,24,0.5)';
    c.lineWidth = 8;
    c.beginPath(); c.ellipse(95, 74, 74, 26, 0, 0, TAU); c.stroke();
    for (let i = 0; i < 34; i++) {
      const a = rand() * TAU;
      const rx = 66 + rand() * 16, ry = 22 + rand() * 8;
      const x = 95 + Math.cos(a) * rx, y = 74 + Math.sin(a) * ry * 0.85;
      c.strokeStyle = ['#4a4132', '#66593f', '#38302a', '#7b6a4a'][i % 4];
      c.lineWidth = 2.6 + rand() * 3.4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x - 22 - rand() * 16, y + rand() * 8 - 4);
      c.quadraticCurveTo(x, y - 10 - rand() * 8, x + 22 + rand() * 16, y + rand() * 8 - 2);
      c.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const ex = 66 + i * 30, ey = 70 - (i === 1 ? 6 : 0);
      const g = c.createRadialGradient(ex - 5, ey - 10, 2, ex, ey, 22);
      g.addColorStop(0, '#f4ecd4');
      g.addColorStop(0.6, '#ddd0ae');
      g.addColorStop(1, '#9c8f6d');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(ex, ey, 15, 19, (i - 1) * 0.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,252,236,0.5)';
      c.beginPath(); c.ellipse(ex - 5, ey - 8, 5, 7, (i - 1) * 0.2, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(14,26,28,0.35)';
    c.beginPath(); c.ellipse(95, 96, 78, 12, 0, 0, TAU); c.fill();
    grain(c, w, h, 0.04, 13);
  });

  canvasTex(scene, 'mw-scree', 430, 210, (c, w, h) => {
    const rand = rng('mw-scree');
    const fan = c.createLinearGradient(30, 40, 300, 200);
    fan.addColorStop(0, 'rgba(150,156,138,0.55)');
    fan.addColorStop(0.55, 'rgba(112,120,108,0.42)');
    fan.addColorStop(1, 'rgba(70,82,78,0.05)');
    c.fillStyle = fan;
    c.beginPath();
    c.moveTo(24, 6);
    c.quadraticCurveTo(210, 30, 402, 150);
    c.quadraticCurveTo(250, 208, 40, 196);
    c.closePath(); c.fill();
    for (let i = 0; i < 210; i++) {
      const t = rand();
      const x = 30 + t * 340 * rand() + rand() * 40;
      const y = 20 + rand() * 170;
      const s = 1.4 + rand() * (3.4 + t * 4);
      c.fillStyle = ['#8b8f7c', '#6f766a', '#a6a894', '#556059'][(rand() * 4) | 0];
      c.globalAlpha = 0.32 + rand() * 0.4;
      c.beginPath(); c.ellipse(x, y, s, s * 0.72, rand() * 3, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(226,246,238,0.1)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      const y = 30 + i * 19;
      c.beginPath(); c.moveTo(20, y); c.quadraticCurveTo(160 + i * 12, y + 16, 320 - i * 8, y + 44); c.stroke();
    }
    grain(c, w, h, 0.06, 57);
  });

  canvasTex(scene, 'mw-boulder', 88, 82, (c, w, h) => {
    const rand = rng('mw-rock');
    const body = c.createRadialGradient(32, 26, 4, 46, 46, 42);
    body.addColorStop(0, '#8c918b');
    body.addColorStop(0.5, '#5d6462');
    body.addColorStop(1, '#283132');
    c.fillStyle = body;
    c.beginPath();
    const pts = 13;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * TAU;
      const r = 34 + Math.sin(a * 3 + 1.2) * 5 + rand() * 3;
      const x = 44 + Math.cos(a) * r, y = 42 + Math.sin(a) * r * 0.9;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(16,24,26,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const x = 16 + rand() * 50, y = 18 + rand() * 46;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10 + rand() * 14, y + (rand() - 0.5) * 18); c.stroke();
    }
    c.fillStyle = 'rgba(216,240,232,0.18)';
    c.beginPath(); c.ellipse(32, 24, 13, 7, -0.5, 0, TAU); c.fill();
    grain(c, w, h, 0.05, 71);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene);
  const rand = rng('mud-wall');

  const base = new Float32Array(N);
  const cut = new Float32Array(N);
  const pile = new Float32Array(N);
  const wet = new Float32Array(N);
  const w = new Float32Array(N);
  const sed = new Float32Array(N);
  const outF = new Float32Array(N);
  const vx = new Float32Array(N);
  const vy = new Float32Array(N);
  const dW = new Float32Array(N);
  const dSed = new Float32Array(N);
  const mottle = new Float32Array(N);
  const topped = new Uint8Array(N);
  const topVol = new Float32Array(N);
  const elevArr = new Float32Array(N);
  const elevSm = new Float32Array(N);
  const wSm = new Float32Array(N);
  const sedSm = new Float32Array(N);
  const wetSm = new Float32Array(N);
  const tmpA = new Float32Array(N);

  function buildField() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        let e = (ROWS - 1 - r) * 3.1;
        e -= 6.3 * gauss(c - drawC(r), 1.35);
        if (r >= 4) e -= 5.9 * gauss(c - gullyC(r), 1.25);
        e -= 4.6 * gauss(r - 6, 0.9) * clamp((16.5 - c) / 3.5, 0, 1) * (c >= 4 ? 1 : 0.4);
        e += 6.6 * gauss(r - 3.5, 0.95) * clamp((c - 8.4) / 2.4, 0, 1) * clamp((17.6 - c) / 3.2, 0, 1);
        e += 3.4 * gauss(c - 28.5, 2.4);
        e += 2.2 * gauss(c - 0.5, 1.8);
        e -= 1.6 * gauss(c - drawC(r), 4.2);
        base[i] = e;
        mottle[i] = rand();
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
          const i = r * COLS + c;
          base[i] = (base[i] * 4 + base[i - 1] + base[i + 1] + base[i - COLS] + base[i + COLS]) / 9;
        }
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const spur = 4.8 * gauss(r - NOTCH_ROW, 1.3)
          * clamp((c - 14.6) / 1.5, 0, 1) * clamp((19.9 - c) / 1.0, 0, 1);
        const dv = divBed(c, r);
        let e = base[i] + spur;
        if (dv.d < DIV_R) {
          const cv = clamp((DIV_R - dv.d) / (DIV_R - 0.8), 0, 1);
          e -= Math.min(Math.max(0, e - dv.bed), 12) * cv;
        }
        const slot = gauss(r - DAM_ROW, 1.0) * gauss(c - drawC(r), 1.0);
        if (slot > 0.02) e -= Math.max(0, e - 11.6) * slot * 0.94;
        base[i] = e + mottle[i] * 0.5 - 0.25;
      }
    }
    cut.fill(0); pile.fill(0); w.fill(0); sed.fill(0); wet.fill(0); topped.fill(0); topVol.fill(0);
    outF.fill(0); vx.fill(0); vy.fill(0);
    st.cracks = 0;
    st.overtops = 0;
    st.washouts = 0;
  }

  const st = {
    round: 1, phase: 'prep', prepLeft: PREP * 0.55, releaseLeft: 0, relTime: 4.4, flowT: 0,
    settleT: 0, work: WORK_MAX, hearts: 3, diverted: 0, over: false,
    volWave: 78, volIn: 0, scree: 0, nest: 0, flank: 0, rain: 0.5,
    frontRow: 0, headCol: drawC(0), poolMax: 0, totalWater: 0, breached: false,
    cracks: 0, overtops: 0, washouts: 0, boulder: null, time: 0,
    lastEvent: 0, sprayT: 0, remaining: 0
  };
  const rowWater = new Float32Array(ROWS);
  const rowFlux = new Float32Array(ROWS);
  const srcCells = [];
  for (let c = 18; c <= 23; c++) srcCells.push(c);

  buildField();

  const cell = (c, r) => clamp(r, 0, ROWS - 1) * COLS + clamp(c, 0, COLS - 1);
  const elevAt = (i) => base[i] - cut[i] + pile[i];

  /* ------------------------------------------------------------ sim */
  function simStep(h) {
    const rain = st.rain;
    for (let i = 0; i < N; i++) {
      if (rain > 0) w[i] += rain * h * 0.0015;
      if (pile[i] > 0) pile[i] = Math.max(0, pile[i] - h * (0.03 + rain * 0.2));
      if (w[i] > 0.05) wet[i] = Math.min(1, wet[i] + h * 0.6);
      else wet[i] = Math.max(0, wet[i] - h * 0.02);
    }

    if (st.phase === 'flow' && st.releaseLeft > 0) {
      const q = (st.volWave / st.relTime) * h;
      const spread = q / srcCells.length;
      for (let k = 0; k < srcCells.length; k++) w[cell(srcCells[k], 0)] += spread;
      st.volIn += q;
      st.releaseLeft -= h;
      if (st.releaseLeft <= 0) st.phase = 'drain';
    }

    dW.fill(0); dSed.fill(0);
    rowFlux.fill(0);
    const nb = [-COLS, 1, COLS, -1];
    const dxs = [0, 1, 0, -1], dys = [-1, 0, 1, 0];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const wi = w[i];
        if (wi < 0.014) { outF[i] = 0; vx[i] = 0; vy[i] = 0; continue; }
        const ei = base[i] - cut[i] + pile[i];
        const si = ei + wi;
        let t0 = 0, t1 = 0, t2 = 0, t3 = 0, te = 0;
        for (let d = 0; d < 4; d++) {
          const nr = r + dys[d], nc = c + dxs[d];
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          const j = i + nb[d];
          const s = base[j] - cut[j] + pile[j] + w[j];
          const ds = si - s;
          if (d === 0) t0 = ds > 0 ? ds : 0;
          else if (d === 1) t1 = ds > 0 ? ds : 0;
          else if (d === 2) t2 = ds > 0 ? ds : 0;
          else t3 = ds > 0 ? ds : 0;
        }
        if (r === ROWS - 1) te = wi + 2.6;
        const tot = t0 + t1 + t2 + t3 + te;
        if (tot <= 0) { outF[i] = 0; vx[i] = 0; vy[i] = 0; continue; }
        const out = Math.min(wi * 0.62, h * FLUX * tot);
        if (out <= 1e-5) { outF[i] = 0; continue; }
        outF[i] = out / h;
        dW[i] -= out;
        const ts = [t0, t1, t2, t3];
        let mx = 0, my = 0;
        for (let d = 0; d < 4; d++) {
          const ds = ts[d];
          if (ds <= 0) continue;
          const share = out * ds / tot;
          const nr = r + dys[d], nc = c + dxs[d];
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          const j = i + nb[d];
          dW[j] += share;
          if (pile[j] > 1.4 && si > base[j] - cut[j] + pile[j] + 0.12) {
            topVol[j] += share;
            if (!topped[j]) { topped[j] = 1; st.overtops++; noteOvertop(j); }
          }
          const load = sed[i] * (share / out);
          dSed[i] -= load; dSed[j] += load;
          mx += dxs[d] * share; my += dys[d] * share;
        }
        vx[i] = out > 0 ? mx / out : 0;
        vy[i] = out > 0 ? my / out : 0;
        if (te > 0) {
          const share = out * te / tot;
          if (c <= SCREE_C) st.scree += share;
          else if (c >= NEST_C0 && c <= NEST_C1) st.nest += share;
          else st.flank += share;
          dSed[i] -= sed[i] * (share / out);
        }
        const dsAvg = (t0 + t1 + t2 + t3 + te) / 4;
        const er = Math.min(EROS * out * (0.45 + dsAvg * 0.75), pile[i] + 0.055);
        if (er > 0) {
          const soft = Math.min(pile[i], er);
          pile[i] -= soft;
          const hard = er - soft;
          if (hard > 0) cut[i] = Math.min(CUT_MAX, cut[i] + hard);
          sed[i] += er;
          if (soft > 0.02 && pile[i] < 1 && soft > 0) noteWashout(i);
        }
        rowFlux[r] += outF[i] * h;
      }
    }

    for (let i = 0; i < N; i++) {
      w[i] = Math.max(0, w[i] + dW[i]);
      sed[i] = Math.max(0, sed[i] + dSed[i]);
      const cap = CAPF * (0.1 + Math.min(outF[i], 26) * 0.055);
      if (sed[i] > cap) {
        const dep = Math.min(sed[i] - cap, h * DEPR * (sed[i] - cap));
        sed[i] -= dep;
        cut[i] = Math.max(-6, cut[i] - dep);
      } else if (sed[i] < cap * 0.55) {
        const eat = Math.min(sed[i], h * 0.4 * (cap - sed[i]));
        sed[i] -= eat;
        cut[i] = Math.min(CUT_MAX, cut[i] + eat);
      }
    }

    let pool = 0, front = 0, hc = 0, total = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      let s = 0, acc = 0;
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        s += w[i];
        acc += w[i] * c;
        if (w[i] > pool) pool = w[i];
        total += w[i];
        if (pile[i] > 1.4 && topVol[i] > 1.4 + pile[i] * 0.42) {
          const gone = pile[i];
          pile[i] = 0; topVol[i] = 0; topped[i] = 0;
          sed[i] += gone * 0.35;
          noteBreach(i);
        } else if (w[i] < 0.2) {
          topVol[i] = Math.max(0, topVol[i] - h * 0.5);
        }
      }
      rowWater[r] = s;
      if (s > 0.5 && front === 0) { front = r; hc = acc / s; }
    }
    st.frontRow = front;
    st.headCol = front ? hc : drawC(0);
    st.poolMax = pool;
    st.totalWater = total;
    st.remaining = Math.max(0, st.volIn - st.scree - st.nest - st.flank);
    if (st.nest > st.volWave * BREACH_FRAC && !st.breached) breach();
  }

  /* ------------------------------------------------------- feedback */
  function noteOvertop(i) {
    const c = i % COLS, r = (i / COLS) | 0;
    scene.sfx('whoosh');
    scene.burst(cellX(c), M.Y(cellStageY(r)), 0xd8f5ea, 12, { life: 620, gravity: 120 });
    scene.popText(cellX(c), M.Y(cellStageY(r) - 14), 'overtopped', '#bff2e2');
    if (st.time - st.lastEvent > 2.4) {
      st.lastEvent = st.time;
      scene.notice('the wall is overtopped — water came back harder', 1700);
    }
  }

  function noteBreach(i) {
    st.washouts++;
    const c = i % COLS, r = (i / COLS) | 0;
    scene.sfx('bad');
    scene.shake(230, 0.013);
    scene.burst(cellX(c), M.Y(cellStageY(r)), 0xa98c5c, 16, { life: 620, gravity: 250 });
    scene.popText(cellX(c), M.Y(cellStageY(r) - 54), 'the wall went', '#ffb08a');
    if (st.time - st.lastEvent > 2.0) {
      st.lastEvent = st.time;
      scene.notice('a dam with nowhere to go comes back harder', 1900);
    }
  }

  function noteWashout(i) {
    st.washouts++;
    const c = i % COLS, r = (i / COLS) | 0;
    if (rand() < 0.22) {
      scene.sfx('splash');
      scene.burst(cellX(c), M.Y(cellStageY(r)), 0xa98c5c, 8, { life: 480, gravity: 220 });
    }
  }

  function breach() {
    st.breached = true;
    st.hearts--;
    scene.sfx('bad');
    scene.shake(320, 0.016);
    scene.cameras.main.flash(260, 90, 40, 30);
    scene.burst(nestX, M.Y(BOTTOM - 26), 0x8fb6a8, 22, { life: 760, gravity: 140 });
    scene.popText(nestX, M.Y(BOTTOM - 90), 'the nest is wet', '#ffb08a');
    scene.notice('mud in the eggs. argue with it later', 2100);
  }

  /* ------------------------------------------------------ round flow */
  const nestX = cellX(Math.round((NEST_C0 + NEST_C1) / 2));

  function startWave() {
    st.volWave = 62 + st.round * 10;
    st.relTime = clamp(7.0 - st.round * 0.2, 3.4, 7.0);
    st.volIn = 0; st.scree = 0; st.nest = 0; st.flank = 0;
    st.breached = false; st.releaseLeft = st.relTime; st.flowT = 0;
    topped.fill(0); topVol.fill(0);
    st.phase = 'flow';
    crack();
    if (st.round >= 3 && rand() < 0.75) spawnBoulder();
    scene.sfx('boom');
    scene.shake(240, 0.01);
    scene.cameras.main.flash(320, 60, 90, 96);
    scene.audio.setTension(0.55);
  }

  function crack() {
    if (st.round < 2) return;
    let c = 3 + Math.floor(rand() * (COLS - 7));
    const r0 = 1 + Math.floor(rand() * 2);
    const len = 5 + Math.floor(rand() * 6);
    for (let k = 0; k < len; k++) {
      const r = Math.min(ROWS - 2, r0 + k);
      const i = cell(c, r);
      cut[i] = Math.min(CUT_MAX, cut[i] + 4.8);
      c += rand() < 0.5 ? -1 : 1;
      c = clamp(c, 1, COLS - 2);
    }
    st.cracks++;
    if (st.time - st.lastEvent > 1.4) {
      st.lastEvent = st.time;
      scene.notice('a crack opened on the shoulder — it has picked a way', 1900);
    }
  }

  function spawnBoulder(atCol) {
    const c = atCol === undefined
      ? 4 + Math.floor(rand() * (COLS - 8))
      : clamp(Math.round(atCol), 1, COLS - 2);
    st.boulder = { c, r: 0, t: 0, x: cellX(c), y: cellStageY(0), next: null };
    rockImg.setVisible(true).setAlpha(1);
    scene.notice('a boulder is loose above the wall', 1700);
    scene.sfx('land');
  }

  function rollBoulder(h) {
    const b = st.boulder;
    if (!b) return;
    b.t -= h;
    if (b.t > 0) {
      b.x = lerp(b.x, cellX(b.c), Math.min(1, h * 12));
      b.y = lerp(b.y, cellStageY(b.r), Math.min(1, h * 12));
      return;
    }
    b.t = 0.2;
    const i = cell(b.c, b.r);
    pile[i] = 0;
    cut[i] = Math.min(CUT_MAX, cut[i] + 0.9);
    let best = i, be = elevAt(i);
    for (let d = 0; d < 4; d++) {
      const nc = b.c + [0, 1, 0, -1][d], nr = b.r + [-1, 0, 1, 0][d];
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const j = cell(nc, nr);
      const s = elevAt(j) + w[j] * 0.4;
      if (s < be) { be = s; best = j; b.next = { c: nc, r: nr }; }
    }
    if (b.r >= ROWS - 1 || best === i) { land(b); return; }
    if (b.next) { b.c = b.next.c; b.r = b.next.r; }
    if (rand() < 0.4) scene.burst(cellX(b.c), M.Y(cellStageY(b.r)), 0x9aa79b, 5, { life: 380, gravity: 260 });
  }

  function land(b) {
    st.boulder = null;
    rockImg.setVisible(false);
    scene.sfx('boom');
    scene.shake(300, 0.018);
    scene.burst(b.x, M.Y(b.y), 0xb0a184, 24, { life: 720, gravity: 320 });
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const i = cell(b.c + dc, b.r + dr);
        const wiped = pile[i];
        pile[i] = 0;
        cut[i] = Math.min(CUT_MAX, cut[i] + (dc === 0 && dr === 0 ? 4.2 : 2.2));
        if (wiped > 3) st.washouts++;
      }
    }
    if (st.phase === 'prep' || st.phase === 'flow') {
      scene.notice('the boulder took the wall with it', 1900);
    }
  }

  function settleRound() {
    const nestFrac = st.volIn > 1 ? st.nest / st.volIn : 0;
    const hit = st.breached || nestFrac >= BREACH_FRAC;
    if (hit) {
      if (!st.breached) { st.hearts--; scene.sfx('bad'); scene.shake(260, 0.012); }
      scene.notice(`${Math.round(st.nest)} of the lahar found the nest`, 2000);
    } else {
      st.diverted++;
      scene.sfx('good');
      scene.popText(cellX(6), M.Y(BOTTOM - 60), `${Math.round(st.scree)} diverted`, '#bff2e2');
      scene.burst(cellX(5), M.Y(BOTTOM - 30), 0x9fe8d4, 18, { life: 700, gravity: 60 });
      scene.notice('the gully took it and the scree spread it', 1900);
    }
    st.phase = 'settle';
    st.settleT = 1.5;
    scene.audio.setTension(0.12);
    if (st.hearts <= 0) endRun(false);
    else if (st.round >= TOTAL_ROUNDS) endRun(true);
  }

  function nextRound() {
    st.round++;
    st.work = WORK_MAX;
    st.rain = 0.45 + st.round * 0.09;
    st.phase = 'prep';
    st.prepLeft = clamp(PREP - st.round * 0.12, 4.6, PREP);
    scene.hud({ score: st.diverted, progress: 1, hearts: st.hearts, extra: 'the slope is quiet' });
    if (st.round === 2) scene.notice('rain is already unmaking the piles', 2000);
    if (st.round === 5) scene.notice('more volume up there than work down here', 2000);
  }

  function endRun(win) {
    if (st.over) return;
    st.over = true;
    st.phase = 'over';
    scene.finish(win, {
      score: st.diverted,
      note: win
        ? `${st.diverted} waves turned aside and the eggs stayed dry`
        : `the lahar reached the nest on wave ${st.round} after ${st.diverted} turnings`
    });
  }

  function tickLogic(h) {
    st.time += h;
    if (st.over) return;
    rollBoulder(h);
    if (st.phase === 'prep') {
      st.prepLeft -= h;
      if (st.prepLeft <= 0) startWave();
    } else if (st.phase === 'flow' || st.phase === 'drain') {
      st.flowT += h;
      if (st.phase === 'drain' && (st.remaining < 1.5 || st.flowT > 16)) settleRound();
    } else if (st.phase === 'settle') {
      st.settleT -= h;
      if (st.settleT <= 0) nextRound();
    }
  }

  /* ------------------------------------------------------ player work */
  const dug = new Uint8Array(N);

  function digCell(c, r) {
    const i = cell(c, r);
    if (st.work < DIG_COST) { refuse(); return false; }
    if (cut[i] >= CUT_MAX) return false;
    st.work -= DIG_COST;
    cut[i] = Math.min(CUT_MAX, cut[i] + DIG_DEPTH);
    pile[i] = Math.max(0, pile[i] - 2.2);
    w[i] += 0.05;
    dirty = true;
    scene.sfx('tick');
    scene.burst(cellX(c), M.Y(cellStageY(r)), 0x8b8467, 5, { life: 320, gravity: 260, scale: 0.45 });
    return true;
  }

  function pileCell(c, r) {
    const i = cell(c, r);
    if (st.work < PILE_COST) { refuse(); return false; }
    if (pile[i] >= PILE_MAX) return false;
    st.work -= PILE_COST;
    pile[i] = Math.min(PILE_MAX, pile[i] + PILE_RAISE);
    dirty = true;
    scene.sfx('land');
    scene.burst(cellX(c), M.Y(cellStageY(r) - 8), 0xb6a377, 6, { life: 380, gravity: 300, scale: 0.5 });
    return true;
  }

  let refuseT = 0;
  function refuse() {
    if (st.time - refuseT < 2.4) return;
    refuseT = st.time;
    scene.sfx('ui');
    scene.notice('no work left this round — the lahar does not negotiate', 1700);
  }

  function digLine(x0, y0, x1, y1) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (CW * 0.55)));
    let did = 0;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const x = lerp(x0, x1, t), y = lerp(y0, y1, t);
      const c = Math.floor(x / CW), r = Math.round((y - TOP - RH / 2) / RH);
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      const i = cell(c, r);
      if (dug[i]) continue;
      dug[i] = 1;
      if (digCell(c, r)) did++;
    }
    return did;
  }

  let drag = null;
  const brush = { x: nestX - 120, y: 300, shown: 0 };

  function stagePoint(p) { return { x: scene.uX(p.x), y: scene.uY(p.y) }; }

  scene.input.on('pointerdown', (p) => {
    if (st.over) return;
    const q = stagePoint(p);
    brush.x = q.x; brush.y = q.y; brush.shown = 1;
    drag = { x: q.x, y: q.y, moved: 0, down: true };
    dug.fill(0);
  });

  scene.input.on('pointermove', (p) => {
    const q = stagePoint(p);
    brush.x = q.x; brush.y = q.y; brush.shown = 1;
    if (!drag || !drag.down || st.over) return;
    const d = Math.hypot(q.x - drag.x, q.y - drag.y);
    if (d > CW * 0.5) {
      drag.moved += d;
      digLine(drag.x, drag.y, q.x, q.y);
      drag.x = q.x; drag.y = q.y;
    }
  });

  scene.input.on('pointerup', (p) => {
    if (drag && drag.moved < CW * 0.8) {
      const c = Math.floor(drag.x / CW);
      const r = Math.round((drag.y - TOP - RH / 2) / RH);
      if (r >= 0 && r < ROWS) pileCell(c, r);
    }
    drag = null;
    dug.fill(0);
  });

  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN',
    dig: 'SPACE', pile: 'KEY_F', j: 'KEY_D'
  });
  let keyCool = 0;

  function keyboardWork(dt) {
    keyCool -= dt;
    const sp = 300 * dt;
    if (keys.left.isDown) brush.x -= sp;
    if (keys.right.isDown) brush.x += sp;
    if (keys.up.isDown) brush.y -= sp;
    if (keys.down.isDown) brush.y += sp;
    brush.x = clamp(brush.x, 6, W - 6);
    brush.y = clamp(brush.y, TOP, BOTTOM);
    const c = Math.floor(brush.x / CW), r = Math.round((brush.y - TOP - RH / 2) / RH);
    if (keyCool <= 0 && (keys.dig.isDown || keys.j.isDown)) { keyCool = 0.16; digCell(c, r); }
    if (keyCool <= 0 && keys.pile.isDown) { keyCool = 0.2; pileCell(c, r); }
  }

  /* ---------------------------------------------------------- layers */
  const FW = W;
  const FH = Math.max(2, Math.round(M.Y(BOTTOM) - M.Y(TOP)));
  const fieldTex = scene.textures.exists('mw-field')
    ? scene.textures.get('mw-field')
    : scene.textures.createCanvas('mw-field', FW, FH);
  const fctx = fieldTex.getContext();
  const lowCv = document.createElement('canvas');
  lowCv.width = LW; lowCv.height = LH;
  const lowCtx = lowCv.getContext('2d');
  const lowImg = lowCtx.createImageData(LW, LH);
  const surf = new Float32Array(LW * LH);
  const eArr = new Float32Array(LW * LH);
  const wAt = new Float32Array(LW * LH);
  const sAt = new Float32Array(LW * LH);
  const tAt = new Float32Array(LW * LH);
  const pitTile = document.createElement('canvas');
  pitTile.width = 220; pitTile.height = 220;
  paintPit(pitTile.getContext('2d'), 220, 220);
  let pitPat = fctx.createPattern(pitTile, 'repeat');

  const fieldImg = scene.add.image(0, M.Y(TOP), 'mw-field').setOrigin(0, 0).setDepth(8);
  const scree = scene.add.image(cellX(SCREE_C) - 6, M.Y(BOTTOM - 8), 'mw-scree')
    .setOrigin(0.5, 1).setDepth(9).setScale(1 * K).setAlpha(0.58);
  const nestImg = scene.add.image(nestX, M.Y(BOTTOM - 4), 'mw-nest')
    .setOrigin(0.5, 1).setDepth(10).setScale(0.82 * K);
  const nestGlow = scene.add.image(nestX, M.Y(BOTTOM - 40), 'arc-glow').setDepth(9)
    .setScale(0.8 * K).setAlpha(0.16).setTint(0x9fe8d4).setBlendMode(Phaser.BlendModes.ADD);
  const rockImg = scene.add.image(nestX, M.Y(120), 'mw-boulder').setDepth(12)
    .setScale(0.6 * K).setVisible(false);

  const label = (x, y, text, size, alpha) => scene.add.text(x, y, text, {
    fontFamily: "'Iowan Old Style','Palatino Linotype',Georgia,serif",
    fontSize: `${Math.round(size * K)}px`, color: pal.mist, letterSpacing: 3
  }).setOrigin(0.5).setAlpha(alpha).setDepth(16);
  label(cellX(6), M.Y(BOTTOM - 14), 'gully', 13, 0.42);
  label(nestX, M.Y(BOTTOM - 6), 'nest', 13, 0.4);
  label(cellX(21), M.Y(TOP + 6), 'the lahar', 13, 0.34);

  const rainFar = scene.add.tileSprite(0, 0, W, M.H, 'mw-rain').setOrigin(0).setDepth(20)
    .setAlpha(0.2).setTileScale(1.1, 1).setBlendMode(Phaser.BlendModes.ADD);
  const rainNear = scene.add.tileSprite(0, 0, W, M.H, 'mw-rain').setOrigin(0).setDepth(22)
    .setAlpha(0.26).setTileScale(0.7, 1.4).setBlendMode(Phaser.BlendModes.ADD);
  const veil = scene.add.rectangle(0, 0, W, M.H, 0x0d1c22, 0).setOrigin(0).setDepth(21);

  const splash = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 12, max: 44 }, angle: { min: 240, max: 300 },
    lifespan: { min: 220, max: 460 }, scale: { start: 0.22, end: 0 },
    alpha: { start: 0.34, end: 0 }, tint: [0xd4efe6, 0x9fb8b4],
    frequency: 70, quantity: 1,
    emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(40, M.Y(TOP + 30), W - 80, FH - 60) }
  }).setDepth(13);

  const spray = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 40, max: 170 }, angle: { min: 200, max: 340 },
    lifespan: { min: 300, max: 620 }, scale: { start: 0.42, end: 0 },
    alpha: { start: 0.7, end: 0 }, tint: [0x9fe8d4, 0xd8f5ea, 0xb6a377],
    emitting: false, gravityY: 180
  }).setDepth(15);

  const brushRing = scene.add.circle(brush.x, M.Y(brush.y), 15 * K, 0x9fe8d4, 0).setDepth(24);
  brushRing.setStrokeStyle(2 * K, 0x9fe8d4, 0.6);

  /* ----------------------------------------------------------- paint */
  let dirty = true, lastFlush = -999;

  function sample(arr, gx, gy) {
    const x0 = clamp(Math.floor(gx), 0, COLS - 1), y0 = clamp(Math.floor(gy), 0, ROWS - 1);
    const x1 = clamp(x0 + 1, 0, COLS - 1), y1 = clamp(y0 + 1, 0, ROWS - 1);
    const fx = clamp(gx - x0, 0, 1), fy = clamp(gy - y0, 0, 1);
    return lerp(lerp(arr[y0 * COLS + x0], arr[y0 * COLS + x1], fx), lerp(arr[y1 * COLS + x0], arr[y1 * COLS + x1], fx), fy);
  }

  let eMin = 0, eMax = 1, eMean = 20;
  function blur(src, dst) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        let s = src[i] * 3, n = 3;
        if (r > 0) { s += src[i - COLS] * 1.4; n += 1.4; }
        if (r < ROWS - 1) { s += src[i + COLS] * 1.6; n += 1.6; }
        if (c > 0) { s += src[i - 1] * 1.4; n += 1.4; }
        if (c < COLS - 1) { s += src[i + 1] * 1.4; n += 1.4; }
        dst[i] = s / n;
      }
    }
  }
  function smooth2(src, dst) { blur(src, tmpA); blur(tmpA, dst); }
  function smooth1(src, dst) { blur(src, dst); }
  function fieldRange() {
    let lo = Infinity, hi = -Infinity, sum = 0;
    for (let i = 0; i < N; i++) {
      const e = base[i] - cut[i] + pile[i];
      elevArr[i] = e;
      sum += e;
      if (e < lo) lo = e;
      if (e > hi) hi = e;
    }
    eMin = lo; eMax = Math.max(lo + 1, hi); eMean = sum / N;
    smooth1(elevArr, elevSm);
    smooth2(w, wSm);
    smooth2(sed, sedSm);
    smooth2(wet, wetSm);
  }

  function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

  function paintLow() {
    fieldRange();
    const pxX = FW / LW, pxY = FH / LH;
    for (let py = 0; py < LH; py++) {
      for (let px = 0; px < LW; px++) {
        const a = py * LW + px;
        const gx = (px + 0.5) / SS - 0.5, gy = (py + 0.5) / SS - 0.5;
        const e = sample(elevSm, gx, gy);
        const ww = sample(wSm, gx, gy);
        eArr[a] = e;
        wAt[a] = ww;
        sAt[a] = Math.min(1, sample(sedSm, gx, gy) * 2.3);
        tAt[a] = sample(wetSm, gx, gy);
        surf[a] = e + (ww > 0.02 ? ww : 0);
      }
    }
    const d = lowImg.data;
    const SHADE = 6.4;
    for (let py = 0; py < LH; py++) {
      for (let px = 0; px < LW; px++) {
        const a = py * LW + px;
        const l = surf[py * LW + clamp(px - 1, 0, LW - 1)];
        const rr = surf[py * LW + clamp(px + 1, 0, LW - 1)];
        const u = surf[clamp(py - 1, 0, LH - 1) * LW + px];
        const dn = surf[clamp(py + 1, 0, LH - 1) * LW + px];
        const dhx = (rr - l) / (2 * pxX) * SHADE;
        const dhy = (dn - u) / (2 * pxY) * SHADE;
        const inv = 1 / Math.sqrt(dhx * dhx + dhy * dhy + 1);
        let lam = (-dhx * -0.42 - dhy * -0.58 + 0.62) * inv;
        lam = clamp(lam * 1.5 + 0.22, 0, 1.6);
        const ao = clamp((surf[a] - (l + rr + u + dn) * 0.25) * 0.55, -0.3, 0.3);
        lam = clamp(lam + ao, 0.05, 1.7);

        const t = clamp((eArr[a] - (eMean - 10)) / 17, 0, 1);
        let col = t < 0.45 ? mix(MUD_LO, MUD_MID, t / 0.45) : mix(MUD_MID, MUD_HI, (t - 0.45) / 0.55);
        col = mix(col, WET_MUD, tAt[a] * 0.5);
        col = mix(col, MUD_LO, mottleApprox(px, py) * 0.15);

        const ww = wAt[a];
        if (ww > 0.02) {
          const sd = sAt[a];
          const rim = clamp((ww - 0.7) * 0.75, 0, 1);
          if (ww < 0.45) col = mix(col, WET_MUD, 0.55 * (ww / 0.45));
          const alpha = clamp(0.16 + ww * 0.62, 0, 0.92);
          col = mix(col, mix(CLEAN, MUDDY, sd), alpha);
          const shimmer = 0.5 + Math.sin((px * 0.7 + py * 1.3) - st.time * 3.4) * 0.5;
          const spec = clamp(dhy * 1.1, 0, 1) * 0.34 + shimmer * 0.26 * rim;
          col = mix(col, FOAM, clamp(spec * (0.34 + rim * 0.5) * (1 - sd * 0.5), 0, 0.44));
        }
        const o = a * 4;
        d[o] = clamp(col[0] * lam, 0, 255);
        d[o + 1] = clamp(col[1] * lam, 0, 255);
        d[o + 2] = clamp(col[2] * lam, 0, 255);
        d[o + 3] = 255;
      }
    }
    lowCtx.putImageData(lowImg, 0, 0);
  }

  function mottleApprox(px, py) {
    const c = clamp(Math.floor((px + 0.5) / SS), 0, COLS - 1);
    const r = clamp(Math.floor((py + 0.5) / SS), 0, ROWS - 1);
    return mottle[r * COLS + c];
  }

  function paint() {
    paintLow();
    fctx.save();
    fctx.clearRect(0, 0, FW, FH);
    fctx.imageSmoothingEnabled = true;
    fctx.drawImage(lowCv, 0, 0, FW, FH);
    overlayPhotorealMaterial(fctx,'soil',.5,'soft-light','environments');

    if (pitPat) {
      fctx.globalAlpha = 0.5;
      fctx.fillStyle = pitPat;
      fctx.fillRect(0, 0, FW, FH);
      fctx.globalAlpha = 1;
    }

    const yScale = FH / ((BOTTOM - TOP));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const sp = outF[i];
        if (sp < 0.35 || (vx[i] === 0 && vy[i] === 0)) continue;
        const x = (c + 0.5) * CW;
        const y = ((r + 0.5) * RH) * yScale;
        const len = Math.min(22, 4 + sp * 2.1);
        const nx = vx[i], ny = vy[i] * (RH * M.band / CW);
        const m = Math.hypot(nx, ny) || 1;
        const ux = nx / m, uy = ny / m;
        const sd = clamp(sed[i] * 1.5, 0, 1);
        const alpha = clamp(0.06 + sp * 0.03, 0, 0.26);
        fctx.strokeStyle = `rgba(${Math.round(lerp(216, 150, sd))},${Math.round(lerp(245, 130, sd))},${Math.round(lerp(234, 92, sd))},${alpha})`;
        for (let k = 0; k < 2; k++) {
          const ox = (rand() - 0.5) * CW * 0.7, oy = (rand() - 0.5) * RH * M.band * 0.6;
          fctx.lineWidth = 1 + rand() * 1.4;
          fctx.beginPath();
          fctx.moveTo(x + ox, y + oy);
          fctx.lineTo(x + ox + ux * len, y + oy + uy * len);
          fctx.stroke();
        }
        if (sp > 2.4 && rand() < 0.05) {
          fctx.strokeStyle = 'rgba(224,248,240,0.22)';
          fctx.lineWidth = 2;
          fctx.beginPath();
          fctx.arc(x, y, 5 + rand() * 9, 0.2, 2.4);
          fctx.stroke();
        }
      }
    }

    const fogH = Math.min(FH * 0.26, 120 * M.band);
    const fog = fctx.createLinearGradient(0, 0, 0, fogH);
    fog.addColorStop(0, 'rgba(18,27,38,0.6)');
    fog.addColorStop(0.55, 'rgba(24,38,48,0.24)');
    fog.addColorStop(1, 'rgba(20,32,40,0)');
    fctx.fillStyle = fog;
    fctx.fillRect(0, 0, FW, fogH);

    const foot = fctx.createLinearGradient(0, FH - 90 * M.band, 0, FH);
    foot.addColorStop(0, 'rgba(6,14,18,0)');
    foot.addColorStop(1, 'rgba(6,14,18,0.5)');
    fctx.fillStyle = foot;
    fctx.fillRect(0, FH - 90 * M.band, FW, 90 * M.band);

    fctx.restore();
  }

  function flush(time) {
    if (!dirty && time - lastFlush < 70) return;
    lastFlush = time;
    dirty = false;
    paint(time);
    fieldTex.refresh();
  }

  /* --------------------------------------------------------- update */
  let simAcc = 0;

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    keyboardWork(dt);

    simAcc += dt;
    let guard = 0;
    while (simAcc >= SIM_STEP && guard < 8) {
      simAcc -= SIM_STEP;
      guard++;
      tickLogic(SIM_STEP);
      simStep(SIM_STEP);
      dirty = true;
    }
    if (guard >= 8) simAcc = 0;

    rainFar.tilePositionX += dt * 130;
    rainFar.tilePositionY += dt * 460;
    rainNear.tilePositionX += dt * 210;
    rainNear.tilePositionY += dt * 900;
    const gust = 0.1 + Math.sin(time / 2600) * 0.03 + (st.phase === 'flow' ? 0.07 : 0);
    rainFar.setAlpha(gust);
    rainNear.setAlpha(gust * 1.15);
    const dark = st.phase === 'flow' ? 0.12 : st.phase === 'prep' ? 0.05 : 0.08;
    veil.setFillStyle(0x0b1a20, dark + Math.max(0, st.poolMax - 3) * 0.012);

    nestImg.y = M.Y(BOTTOM - 4);
    const wetness = clamp(st.nest / Math.max(1, st.volWave * BREACH_FRAC), 0, 1);
    nestImg.setTint(wetness > 0.55 ? 0xd8a08a : wetness > 0.2 ? 0xbfd0bc : 0xffffff);
    nestGlow.setAlpha(0.12 + Math.sin(time / 620) * 0.04 - wetness * 0.06);
    nestGlow.setTint(wetness > 0.5 ? 0xff9a6a : 0x9fe8d4);

    if (st.boulder) {
      rockImg.x = st.boulder.x;
      rockImg.y = M.Y(st.boulder.y);
      rockImg.rotation += dt * 3.4;
    }

    if ((st.phase === 'flow' || st.phase === 'drain') && st.time - st.sprayT > 0.32) {
      st.sprayT = st.time;
      let best = -1, bs = 0;
      for (let i = 0; i < N; i++) {
        const s = outF[i] * (Math.abs(vx[i]) + Math.abs(vy[i]));
        if (s > bs) { bs = s; best = i; }
      }
      if (best >= 0 && bs > 0.4) {
        const c = best % COLS, r = (best / COLS) | 0;
        spray.emitParticleAt(cellX(c), M.Y(cellStageY(r)), 2 + Math.min(6, bs | 0));
        dirty = true;
      }
    }

    brushRing.x = brush.x;
    brushRing.y = M.Y(clamp(brush.y, TOP - RH, BOTTOM + RH));
    const ringOn = st.work >= DIG_COST || st.work >= PILE_COST;
    brushRing.setStrokeStyle(2 * K, ringOn ? 0x9fe8d4 : 0xff9a6a, 0.62);
    brushRing.setScale(st.work < PILE_COST ? 0.7 : 1);

    const tension = st.phase === 'flow'
      ? clamp(0.35 + wetness * 0.5 + (st.frontRow / ROWS) * 0.2, 0, 1)
      : st.phase === 'drain' ? clamp(0.25 + wetness * 0.4, 0, 1) : 0.1;
    scene.audio.setTension(tension);

    flush(time);

    if (st.over) return;
    const extra = st.phase === 'prep'
      ? (st.prepLeft < 2.2 ? 'lahar in two' : st.work < 20 ? 'little work left' : 'cut the notch, then the wall')
      : st.poolMax > 2.4 && st.phase === 'drain' ? 'the pool is rising'
      : st.overtops > 0 && st.phase !== 'prep' ? 'overtopped — brace'
      : st.breached ? 'the nest is wet'
      : st.frontRow > ROWS - 5 ? 'mud at the nest'
      : 'the flow is finding down';
    scene.hud({
      score: st.diverted,
      progress: clamp(st.work / WORK_MAX, 0, 1),
      hearts: clamp(st.hearts, 0, 3),
      extra
    });
  }

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'cut the notch, then the wall' });
  scene.notice('the mountain has let go — decide where the water goes', 2600);

  /* ------------------------------------------------------- surface */
  function toCanvas(gx, gy) {
    const cv = scene.game.canvas;
    const rect = cv.getBoundingClientRect();
    return { x: rect.left + gx * (rect.width / cv.width), y: rect.top + M.Y(gy) * (rect.height / cv.height) };
  }

  return {
    update,
    state: () => ({
      round: st.round, phase: st.phase, time: Number(st.time.toFixed(2)),
      work: Math.round(st.work), workMax: WORK_MAX,
      hearts: st.hearts, diverted: st.diverted, over: st.over,
      field: {
        min: Number(eMin.toFixed(2)), max: Number(eMax.toFixed(2)),
        mean: Number((() => { let s = 0; for (let i = 0; i < N; i++) s += elevAt(i); return s / N; })().toFixed(2)),
        dug: Number((() => { let s = 0; for (let i = 0; i < N; i++) s += cut[i]; return s; })().toFixed(1)),
        piled: Number((() => { let s = 0; for (let i = 0; i < N; i++) s += pile[i]; return s; })().toFixed(1)),
        cols: COLS, rows: ROWS
      },
      flow: {
        volume: Number(st.volWave), in: Number(st.volIn.toFixed(1)),
        water: Number((st.totalWater || 0).toFixed(1)),
        scree: Number(st.scree.toFixed(1)), nest: Number(st.nest.toFixed(1)), flank: Number(st.flank.toFixed(1)),
        left: Number(st.remaining.toFixed(1)),
        poolMax: Number(st.poolMax.toFixed(2)),
        headRow: st.frontRow, headCol: Number(st.headCol.toFixed(2)),
        headX: Number(cellX(st.headCol).toFixed(0)),
        frontFrac: Number((st.frontRow / (ROWS - 1)).toFixed(2))
      },
      nest: {
        integrity: Number(clamp(1 - st.nest / Math.max(1, st.volWave * BREACH_FRAC), 0, 1).toFixed(2)),
        load: Number(st.nest.toFixed(1)), breached: st.breached
      },
      events: { overtops: st.overtops, washouts: st.washouts, cracks: st.cracks },
      boulder: st.boulder ? { col: st.boulder.c, row: st.boulder.r } : null,
      rain: Number(st.rain.toFixed(2)),
      rowWater: Array.from(rowWater, (v) => Number(v.toFixed(1))),
      rowFlux: Array.from(rowFlux, (v) => Number(v.toFixed(2)))
    }),

    cellInfo: (c, r) => {
      const i = cell(c, r);
      return {
        e: Number(elevAt(i).toFixed(2)), base: Number(base[i].toFixed(2)),
        cut: Number(cut[i].toFixed(2)), pile: Number(pile[i].toFixed(2)),
        w: Number(w[i].toFixed(2)), sed: Number(sed[i].toFixed(2)), out: Number(outF[i].toFixed(2))
      };
    },
    cellPos: (c, r) => toCanvas(cellX(c), cellStageY(r)),
    layout: () => ({
      cols: COLS, rows: ROWS,
      dam: { row: DAM_ROW, cols: span(DAM_C0, DAM_C1) },
      notch: { row: NOTCH_ROW, cols: span(NOTCH_C0, NOTCH_C1) },
      gullyCol: Math.round(gullyC(12)), screeCol: SCREE_C, nestCol: Math.round(nestX / CW),
      sourceCols: srcCells.slice(),
      digCost: DIG_COST, digDepth: DIG_DEPTH, pileCost: PILE_COST, pileRaise: PILE_RAISE
    }),
    digCell: (c, r, times = 1) => {
      let n = 0;
      for (let k = 0; k < times; k++) if (digCell(c, r)) n++;
      return n;
    },
    pileCell: (c, r, times = 1) => {
      let n = 0;
      for (let k = 0; k < times; k++) if (pileCell(c, r)) n++;
      return n;
    },
    setWork: (v) => { st.work = clamp(v, 0, WORK_MAX); return st.work; },
    setHearts: (v) => { st.hearts = clamp(Math.round(v), 0, 3); return st.hearts; },
    setScore: (v) => { st.diverted = Math.max(0, Math.round(v)); return st.diverted; },
    setRound: (v) => { st.round = clamp(Math.round(v), 1, TOTAL_ROUNDS); return st.round; },
    releaseFlow: () => { st.prepLeft = 0; if (st.phase === 'prep') startWave(); return st.phase; },
    skipPrep: () => { st.prepLeft = 0; return st.prepLeft; },
    setPrep: (v) => { st.prepLeft = Math.max(0, v); if (st.phase !== 'prep') st.phase = 'prep'; return st.prepLeft; },
    advance: (seconds) => {
      const steps = Math.min(2400, Math.max(0, Math.round((seconds || 0) / SIM_STEP)));
      for (let k = 0; k < steps; k++) { tickLogic(SIM_STEP); simStep(SIM_STEP); }
      dirty = true;
      return Number((steps * SIM_STEP).toFixed(2));
    },
    resetWater: () => { w.fill(0); sed.fill(0); st.totalWater = 0; dirty = true; return true; },
    newField: () => {
      buildField();
      st.phase = 'prep'; st.prepLeft = PREP; st.work = WORK_MAX;
      st.rain = 0.45 + st.round * 0.09;
      st.volIn = 0; st.scree = 0; st.nest = 0; st.flank = 0;
      st.breached = false; st.frontRow = 0; st.headCol = drawC(0);
      st.poolMax = 0; st.totalWater = 0; st.overtops = 0; st.washouts = 0;
      st.boulder = null; rockImg.setVisible(false);
      return true;
    },
    rollBoulder: (c) => { spawnBoulder(clamp(Math.round(c), 1, COLS - 2)); return true; },
    softRain: (v) => { st.rain = clamp(v, 0, 4); return st.rain; },
    finishRun: (win) => { endRun(win !== false); return st.diverted; },
    toCanvas
  };
}

export default { id: 'mud-wall', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
