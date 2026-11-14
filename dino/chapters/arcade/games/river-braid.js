import { addMaterialLayer } from '../../../photoreal-environments.js?v=du-276e018775e133bb';
// River Braid — the braided jungle river.
// A hatchling goes downstream and may only spend breath where the water spends
// it for them: the dark deep threads, and the lee of anything that drifts.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-276e018775e133bb';

const STAR = [9, 16, 25];
const BENDS = 25;
const C = 318;
const PIN = 46;
const TAU = Math.PI * 2;
const PAL = MOODS.jungle;
const TUNE = {
  paceLow: 176, paceHigh: 262, swim: 134, back: 78, cross: 176,
  drift: 0.05, hard: 0.3, coast: 0.085, tuck: 0.3, tuckLife: 3.2
};
const lg = (c, x0, y0, x1, y1, s) => { const g = c.createLinearGradient(x0, y0, x1, y1); s.forEach((p) => g.addColorStop(p[0], p[1])); return g; };
const rg = (c, x0, y0, r0, x1, y1, r1, s) => { const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); s.forEach((p) => g.addColorStop(p[0], p[1])); return g; };
const blob = (c, x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); };
const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
const qpath = (c, x, y, seg) => { c.beginPath(); c.moveTo(x, y); seg.forEach((s) => c.quadraticCurveTo(s[0], s[1], s[2], s[3])); c.closePath(); };
const qstroke = (c, x, y, seg) => { c.beginPath(); c.moveTo(x, y); seg.forEach((s) => c.quadraticCurveTo(s[0], s[1], s[2], s[3])); c.stroke(); };
const wash = (c, w, h, s, x0, y0, x1, y1) => { c.globalCompositeOperation = 'source-atop'; c.fillStyle = lg(c, x0, y0, x1, y1, s); c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over'; };

// one call for every blade of marsh: n stalks leaning up from baseY
function tuft(c, rand, n, x0, x1, baseY, lenMin, lenMax, cols, heads) {
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + rand() * (x1 - x0);
    const sway = (rand() - 0.5) * 40;
    const len = lenMin + rand() * (lenMax - lenMin);
    c.strokeStyle = cols[i % cols.length];
    c.lineWidth = 2 + rand() * 3;
    qstroke(c, x, baseY, [[x + sway * 0.4, baseY - len * 0.6, x + sway, baseY - len]]);
    if (heads && i % 3 === 0) {
      c.fillStyle = '#7a5c33'; blob(c, x + sway, baseY - len - 6, 4, 12, sway * 0.006);
      c.fillStyle = 'rgba(226,206,140,0.7)'; blob(c, x + sway, baseY - len - 16, 2.4, 5);
    }
  }
}

// the mud everything runs over: banded silt, pale ripples, wet blotches
function silt(c, rand, w, h, stops, pale) {
  c.fillStyle = lg(c, 0, 0, 0, h, stops); c.fillRect(0, 0, w, h);
  for (let i = 0; i < 42; i++) {
    c.fillStyle = i % 2 ? 'rgba(222,204,152,0.22)' : 'rgba(58,50,34,0.2)';
    blob(c, rand() * w, rand() * h, 20 + rand() * 90, 6 + rand() * 18, (rand() - 0.5) * 0.5);
  }
  c.strokeStyle = pale;
  for (let i = 0; i < 26; i++) {
    const y = rand() * h;
    c.lineWidth = 1 + rand() * 2; c.beginPath(); c.moveTo(0, y);
    for (let x = 0; x <= w; x += 60) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 3);
    c.stroke();
  }
}
function hatchArt(scene) {
  [0, 1].forEach((frame) => {
    const reach = frame ? 15 : -11;
    const lift = frame ? -6 : 5;
    canvasTex(scene, 'rb-hatch-' + frame, 128, 100, (c) => {
      c.fillStyle = 'rgba(8,32,36,0.3)'; blob(c, 62, 80, 42, 10);
      c.lineCap = 'round'; c.strokeStyle = '#4a6b3c'; c.lineWidth = 9;
      qstroke(c, 38, 62, [[18, 68, 6, 58 + lift]]);
      c.fillStyle = '#3c5a31'; qpath(c, 8, 58 + lift, [[-4, 46 + lift, 0, 64 + lift]]); c.fill();
      c.fillStyle = lg(c, 30, 34, 90, 82, [[0, '#93b267'], [0.46, '#5f8249'], [1, '#2f4429']]);
      blob(c, 60, 58, 30, 22, -0.12);
      c.fillStyle = 'rgba(236,220,158,0.4)'; blob(c, 63, 70, 21, 8, -0.05);
      c.fillStyle = '#c8a15e';
      for (let i = 0; i < 4; i++) { const x = 44 + i * 11; qpath(c, x, 41, [[x + 3, 29 - i, x + 8, 41]]); c.fill(); }
      c.strokeStyle = '#6d8f52'; c.lineWidth = 7;
      qstroke(c, 52, 72, [[48 + reach, 84, 38 + reach, 88]]);
      qstroke(c, 74, 72, [[80 + reach, 86, 90 + reach, 84 - lift]]);
      c.fillStyle = '#e6d59a';
      blob(c, 38 + reach, 88, 6, 3.4, -0.5); blob(c, 90 + reach, 84 - lift, 6, 3.4, 0.5);
      c.strokeStyle = '#7ba05c'; c.lineWidth = 13; qstroke(c, 80, 48, [[96, 40, 102, 28]]);
      c.fillStyle = '#88ad67'; blob(c, 108, 22, 15, 11.5, -0.3);
      c.fillStyle = '#6d8f52'; qpath(c, 118, 16, [[130, 18, 128, 25], [122, 27, 116, 25]]); c.fill();
      c.fillStyle = PAL.accent; qpath(c, 104, 11, [[98, 0, 87, 3], [95, 9, 98, 17]]); c.fill();
      c.fillStyle = '#fdf3cd'; dot(c, 111, 19, 4.2);
      c.fillStyle = '#17291c'; dot(c, 112.4, 19, 2.1);
      c.strokeStyle = 'rgba(226,246,220,0.28)'; c.lineWidth = 2;
      c.beginPath(); c.arc(60, 58, 30, -2.4, -0.7); c.stroke();
      wash(c, 128, 100, [[0, 'rgba(255,240,190,0.22)'], [0.55, 'rgba(255,240,190,0)'], [1, 'rgba(0,0,0,0.22)']], 20, 20, 110, 92);
      grain(c, 128, 100, 0.03, 21 + frame);
    });
  });
}

function floatArt(scene, M) {
  canvasTex(scene, 'rb-log', 200, 70, (c) => {
    const rand = rng(311);
    c.fillStyle = lg(c, 0, 12, 0, 62, [[0, '#7a5836'], [0.4, '#5b3f26'], [1, '#2e1f14']]);
    qpath(c, 12, 26, [[100, 12, 190, 22], [198, 36, 190, 48], [100, 60, 12, 50], [2, 38, 12, 26]]); c.fill();
    c.strokeStyle = 'rgba(26,16,9,0.55)';
    for (let i = 0; i < 11; i++) {
      const y = 20 + rand() * 30; c.lineWidth = 1 + rand() * 1.8;
      qstroke(c, 16 + rand() * 30, y, [[100, y + (rand() - 0.5) * 8, 186 - rand() * 30, y + (rand() - 0.5) * 6]]);
    }
    c.fillStyle = '#3a2716'; blob(c, 190, 35, 8, 14, 0.1);
    c.strokeStyle = '#6d4d2c'; c.lineWidth = 2;
    for (let k = 2; k > 0; k--) { c.beginPath(); c.ellipse(190, 35, k * 3.4, k * 6, 0.1, 0, TAU); c.stroke(); }
    for (let i = 0; i < 9; i++) {
      c.fillStyle = i % 2 ? 'rgba(108,132,58,0.9)' : 'rgba(146,168,78,0.78)';
      blob(c, 24 + rand() * 150, 20 + rand() * 9, 6 + rand() * 12, 4 + rand() * 5, rand() * 0.6);
    }
    c.strokeStyle = '#4d3a22'; c.lineWidth = 2.4; c.lineCap = 'round';
    qstroke(c, 72, 20, [[84, 8, 100, 4]]); qstroke(c, 126, 20, [[132, 10, 146, 8]]);
    grain(c, 200, 70, 0.04, 77);
  });
  canvasTex(scene, 'rb-raft', 168, 84, (c) => {
    const rand = rng(907);
    c.fillStyle = 'rgba(10,34,38,0.3)'; blob(c, 84, 64, 70, 14);
    c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const y = 32 + rand() * 28;
      c.strokeStyle = i % 2 ? '#6b4c2c' : '#4d3620'; c.lineWidth = 5 + rand() * 5;
      qstroke(c, 14 + rand() * 26, y, [[84, y + (rand() - 0.5) * 22, 150 - rand() * 26, y + (rand() - 0.5) * 12]]);
    }
    c.fillStyle = '#7c8f4a';
    for (let i = 0; i < 5; i++) blob(c, 30 + rand() * 110, 30 + rand() * 20, 14 + rand() * 10, 7 + rand() * 5, rand());
    c.fillStyle = '#d9c49a'; blob(c, 118, 52, 13, 9, 0.3);
    c.strokeStyle = '#a8906a'; c.lineWidth = 1.6;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(118, 52, 3 + k * 2.4, 0.6, 3.4); c.stroke(); }
    c.fillStyle = '#3f5a2f'; qpath(c, 52, 40, [[44, 16, 62, 6], [64, 26, 60, 40]]); c.fill();
    grain(c, 168, 84, 0.04, 121);
  });
  canvasTex(scene, 'rb-leaf', 34, 22, (c) => {
    c.fillStyle = lg(c, 2, 4, 32, 18, [[0, '#8fae5c'], [1, '#5a7534']]);
    qpath(c, 2, 12, [[14, 0, 32, 6], [22, 21, 2, 12]]); c.fill();
    c.strokeStyle = 'rgba(226,240,180,0.4)'; c.lineWidth = 1; qstroke(c, 4, 12, [[18, 9, 30, 7]]);
  });
  canvasTex(scene, 'rb-shadow', 380, 150, (c) => {
    c.save(); c.translate(190, 78);
    c.fillStyle = lg(c, -180, 0, 180, 0, [[0, 'rgba(6,26,30,0.35)'], [0.45, 'rgba(4,20,24,0.92)'], [1, 'rgba(6,26,30,0.3)']]);
    qpath(c, -176, 4, [[-120, -26, -52, -22], [10, -34, 78, -20], [140, -12, 178, 6], [132, 30, 66, 26], [-4, 36, -78, 28], [-140, 22, -176, 4]]); c.fill();
    c.fillStyle = 'rgba(3,16,20,0.8)';
    [[-96, 8], [-30, 12], [46, 10], [112, 6]].forEach((p, i) => { qpath(c, p[0], p[1], [[p[0] + 12, p[1] + 26 - i * 2, p[0] + 26, p[1] + 8]]); c.fill(); });
    qpath(c, 150, -12, [[186, -22, 178, -4]]); c.fill();
    c.fillStyle = 'rgba(240,250,240,0.45)';
    [[-142, -6], [-128, -9], [-114, -11]].forEach((p) => dot(c, p[0], p[1], 2.2));
    c.restore();
    c.globalCompositeOperation = 'destination-in';
    c.fillStyle = rg(c, 190, 78, 40, 190, 78, 196, [[0, 'rgba(0,0,0,1)'], [0.7, 'rgba(0,0,0,0.7)'], [1, 'rgba(0,0,0,0)']]);
    c.fillRect(0, 0, 380, 150);
    c.globalCompositeOperation = 'source-over';
  });
  canvasTex(scene, 'rb-weed', 118, 92, (c) => {
    const rand = rng(455);
    tuft(c, rand, 16, 12, 108, 88, 30, 80, ['#3d5c30', '#547238', '#47643a'], false);
    c.fillStyle = 'rgba(196,178,96,0.55)';
    for (let i = 0; i < 7; i++) blob(c, 16 + rand() * 88, 20 + rand() * 46, 4 + rand() * 5, 2 + rand() * 3, rand());
    grain(c, 118, 92, 0.03, 33);
  });
  canvasTex(scene, 'rb-reed', 136, 180, (c) => {
    const rand = rng(223);
    tuft(c, rand, 15, 24, 114, 178, 90, 170, ['#4f6d38', '#6c8a45'], true);
    c.fillStyle = 'rgba(20,52,48,0.45)'; blob(c, 68, 174, 52, 8);
    grain(c, 136, 180, 0.03, 59);
  });
  canvasTex(scene, 'rb-bar', 250, 104, (c) => {
    const rand = rng(8801);
    c.fillStyle = lg(c, 0, 10, 0, 96, [[0, '#e0cb9c'], [0.5, '#b39a6c'], [1, '#7d6a49']]);
    qpath(c, 6, 62, [[50, 18, 128, 22], [210, 26, 244, 60], [200, 96, 124, 92], [40, 90, 6, 62]]); c.fill();
    c.fillStyle = 'rgba(255,248,214,0.32)'; blob(c, 120, 40, 70, 12, -0.04);
    c.strokeStyle = 'rgba(90,72,48,0.36)'; c.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) { const y = 44 + i * 5; qstroke(c, 30 + rand() * 20, y, [[126, y + (rand() - 0.5) * 10, 220 - rand() * 24, y]]); }
    c.fillStyle = 'rgba(70,58,40,0.5)';
    for (let i = 0; i < 14; i++) blob(c, 30 + rand() * 190, 40 + rand() * 44, 2 + rand() * 4, 1.4 + rand() * 2);
    grain(c, 250, 104, 0.05, 41);
  });
  canvasTex(scene, 'rb-tree', 170, 300, (c) => {
    const rand = rng(617);
    c.strokeStyle = '#33261a'; c.lineWidth = 15; c.lineCap = 'round';
    qstroke(c, 86, 300, [[78, 200, 92, 120]]);
    c.lineWidth = 7; qstroke(c, 88, 190, [[58, 168, 34, 172]]); qstroke(c, 90, 158, [[124, 140, 146, 150]]);
    for (let i = 0; i < 26; i++) {
      const x = 86 + (rand() - 0.5) * 130;
      const y = 96 + (rand() - 0.5) * 100;
      const rad = 16 + rand() * 30;
      c.fillStyle = rg(c, x, y - rad * 0.3, 2, x, y, rad, [[0, i % 3 ? 'rgba(104,136,66,0.95)' : 'rgba(126,158,78,0.9)'], [1, 'rgba(30,62,44,0.7)']]);
      blob(c, x, y, rad, rad * 0.7, rand());
    }
    wash(c, 170, 300, [[0, 'rgba(255,236,170,0.2)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(6,26,22,0.62)']], 0, 40, 0, 300);
    grain(c, 170, 300, 0.03, 73);
  });
  canvasTex(scene, 'rb-foam', 150, 54, (c) => {
    const rand = rng(1551);
    for (let i = 0; i < 20; i++) {
      const x = 10 + rand() * 130;
      const y = 20 + (rand() - 0.5) * 20;
      const rad = 4 + rand() * 12;
      c.fillStyle = rg(c, x, y, 0, x, y, rad, [[0, 'rgba(240,252,244,0.75)'], [0.6, 'rgba(210,238,226,0.3)'], [1, 'rgba(200,230,220,0)']]);
      dot(c, x, y, rad);
    }
  });
  canvasTex(scene, 'rb-bed', W, Math.round(M.Y(478) - M.Y(156)), (c, w, h) => {
    const rand = rng(2024);
    silt(c, rand, w, h, [[0, '#6b5e40'], [0.28, '#8a7a55'], [0.66, '#6d5f42'], [1, '#4a4230']], 'rgba(240,250,238,0.08)');
    c.fillStyle = 'rgba(30,60,52,0.16)';
    for (let i = 0; i < 90; i++) blob(c, rand() * w, rand() * h, 3 + rand() * 12, 2 + rand() * 5);
    grain(c, w, h, 0.028, 19);
  });
  canvasTex(scene, 'rb-bank-far', W, Math.round(M.Y(200) - M.Y(142)), (c, w, h) => {
    const rand = rng(551);
    c.fillStyle = lg(c, 0, 0, 0, h, [[0, '#1b3a2b'], [0.46, '#43502e'], [1, '#6d5f3c']]); c.fillRect(0, 0, w, h);
    tuft(c, rand, 90, 0, w, h + 2, h * 0.55, h + 12, ['rgba(22,44,34,0.85)', 'rgba(38,62,44,0.8)'], false);
    c.fillStyle = 'rgba(214,232,168,0.14)';
    for (let i = 0; i < 40; i++) blob(c, rand() * w, rand() * h * 0.6, 8 + rand() * 20, 3 + rand() * 6);
    grain(c, w, h, 0.04, 63);
  });
  canvasTex(scene, 'rb-bank-near', W, Math.round(M.Y(540) - M.Y(458)), (c, w, h) => {
    const rand = rng(733);
    c.fillStyle = lg(c, 0, 0, 0, h, [[0, 'rgba(96,86,56,0.15)'], [0.34, '#4a4630'], [1, '#14251d']]); c.fillRect(0, 0, w, h);
    tuft(c, rand, 120, 0, w, h, h * 0.45, h * 1.05, ['rgba(46,72,42,0.9)', 'rgba(78,104,58,0.85)', 'rgba(30,52,36,0.9)'], false);
    grain(c, w, h, 0.04, 87);
  });
}
const chanY = (ch, x) => ch.c + ch.amp * Math.sin((x - ch.x0) / ch.wl + ch.ph) + ch.amp2 * Math.sin((x - ch.x0) / 96 + ch.ph * 2.3);
const startY = (ch) => ch.c;
function chW(ch, x) { return ch.w0 + (ch.w - ch.w0) * clamp((x - ch.x0) / 260, 0, 1); }
function halfAt(s, x) { return s.half0 + (s.half - s.half0) * clamp((x - s.x0) / 260, 0, 1); }
function persp(y, half) { return 0.8 + 0.4 * clamp((y - (C - half)) / (2 * half), 0, 1); }
const isMouth = (s, ch) => s.mouths.some((m) => m.ch === ch);
// only the two mouth threads carry on past a gate; the rest shoal out into bars
const threadW = (s, ch, x) => chW(ch, x) * (isMouth(s, ch) ? 1 : clamp((s.gate - x) / 170, 0, 1));
function cover(s, ch, x, y) {
  const w = threadW(s, ch, x);
  if (w < 1) return 0;
  const d = (y - chanY(ch, x)) / (w * persp(y, halfAt(s, x)));
  return d > 2.6 ? 0 : Math.exp(-d * d * 1.5);
}
const bankOf = (s, x, side) => {
  const h = halfAt(s, x);
  return C + side * (h + 7 * Math.sin(x / (side < 0 ? 214 : 197) + (side < 0 ? 0.7 : 2.4))
    + 4 * Math.sin(x / (side < 0 ? 83 : 79) + (side < 0 ? 2.4 : 0.7)));
};
const bankTop = (s, x) => bankOf(s, x, -1);
const bankBot = (s, x) => bankOf(s, x, 1);
const inWeedAt = (s, x) => !!(s.weed && x > s.weed.x && x < s.weed.x + s.weed.w);

// a thread leaves the previous gate where another one arrived, so the braid
// reads as one river that splits and rejoins instead of stitched-together strips
function makeStretch(r, index, kind, x0, prev) {
  const t = clamp(index / (BENDS - 1), 0, 1);
  const len = Math.round(lerp(920, 660, t) + r() * 120);
  const half = lerp(156, 118, t) - (kind === 'shallow' ? 4 : 0);
  const pace = lerp(TUNE.paceLow, TUNE.paceHigh, t) * (kind === 'deep' ? 1.05 : 0.93);
  const n = kind === 'deep' ? (index < 5 ? 3 : 2) : (index < 5 ? 4 : 3);
  const chans = [];
  for (let i = 0; i < n; i++) {
    const off = ((i + 0.5) / n - 0.5) * 2;
    const ch = {
      x0, w0: 0, c: 0, amp: (kind === 'deep' ? 15 : 10) + r() * (index < 4 ? 26 : 14),
      amp2: 3 + r() * 6, wl: 250 + r() * 300, ph: r() * 6.28,
      w: half * (kind === 'deep' ? 0.3 : 0.24) * (0.82 + r() * 0.4),
      depth: kind === 'deep' ? (Math.abs(off) < 0.45 ? 1 : 0.5 + r() * 0.16)
        : 0.26 + (1 - Math.abs(off)) * 0.28 + r() * 0.08
    };
    ch.w0 = ch.w;
    ch.c = C + off * half * 0.84 + (r() - 0.5) * 12 - ch.amp * Math.sin(ch.ph) - ch.amp2 * Math.sin(ch.ph * 2.3);
    chans.push(ch);
  }
  chans.sort((a, b) => b.depth - a.depth);
  if (prev) {
    const last = prev.tail.length - 1;
    chans.forEach((ch, i) => {
      const f = chans.length === 1 ? 0 : (i / (chans.length - 1)) * last;
      const k = Math.min(last - 1, Math.floor(f)), mix = f - k;
      ch.c = lerp(prev.tail[k].y, prev.tail[k + 1].y, mix) - ch.amp * Math.sin(ch.ph) - ch.amp2 * Math.sin(ch.ph * 2.3);
      ch.w0 = lerp(prev.tail[k].w, prev.tail[k + 1].w, mix);
    });
  }
  const deep = chans[0];
  let slow = chans[chans.length - 1];
  if (chans.length > 2 && Math.abs(chanY(slow, x0 + len) - chanY(deep, x0 + len)) < 78) slow = chans[1];
  const mouthOf = (ch, name) => ({ y: chanY(ch, x0 + len), w: chW(ch, x0 + len), kind: name, ch });
  return {
    index, kind, x0, len, half, half0: prev ? prev.half : half, pace, chans, gate: x0 + len,
    mouths: [mouthOf(deep, 'deep'), mouthOf(slow, 'shallow')],
    tail: chans.map((ch) => ({ y: chanY(ch, x0 + len), w: chW(ch, x0 + len) })),
    weed: kind === 'shallow' ? { x: x0 + len * 0.32, w: len * 0.42 } : null,
    ledge: index >= 3 && index % 5 === 4 ? { x: x0 + len * 0.6, done: false, warned: false } : null,
    deco: null
  };
}
function create(scene) {
  const M = scene.M, K = scene.k, r = rng('river-braid');
  hatchArt(scene); floatArt(scene, M);

  const st = {
    bend: 0, crossed: 0, hearts: 3, breath: 1, over: false, iFrames: 0, camX: 0,
    pace: TUNE.paceLow, time: 0, nextKind: 'deep', spawnT: 1.2, shadowT: 7, gasp: 0, nudge: 0
  };
  const h = { wx: 240, x: 240, y: C, tx: 300, ty: C, own: 0, vy: 0 };
  let tuck = null, tuckT = 0, hold = false, keyHold = false, pinned = false;

  const bedTile = scene.add.tileSprite(0, M.Y(156), W, M.Y(478) - M.Y(156), 'rb-bed').setOrigin(0, 0).setDepth(0);
  const farTile = scene.add.tileSprite(0, M.Y(142), W, M.Y(200) - M.Y(142), 'rb-bank-far').setOrigin(0, 0).setDepth(2);
  const nearTile = scene.add.tileSprite(0, M.Y(458), W, M.Y(540) - M.Y(458), 'rb-bank-near').setOrigin(0, 0).setDepth(20);
  const treeRow = [];
  for (let i = 0; i < 9; i++) treeRow.push(scene.add.image(0, M.Y(196), 'rb-tree').setOrigin(0.5, 1)
    .setScale((0.58 + r() * 0.46) * K).setAlpha(0.95).setDepth(1));
  const gWater = scene.add.graphics().setDepth(4);
  const gFlow = scene.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
  const gEdge = scene.add.graphics().setDepth(6);
  addMaterialLayer(scene,gWater,'material-water',W,M.H,{alpha:.55,flow:true});
  const glow = scene.add.image(h.x, M.Y(h.y), 'arc-glow').setDepth(10).setScale(1.05 * K).setTint(0xfff0b8).setAlpha(0.12).setBlendMode(Phaser.BlendModes.ADD);
  const player = scene.add.sprite(h.x, M.Y(h.y), 'rb-hatch-0').setDepth(13).setScale(1.14 * K);
  const leaves = [];
  for (let i = 0; i < 22; i++) {
    const img = scene.add.image(0, 0, 'rb-leaf').setDepth(9).setScale((0.7 + r() * 0.55) * K).setAlpha(0.85);
    leaves.push({ img, wx: r() * 1500, y: 176 + r() * 288, spin: (r() - 0.5) * 2.2, ph: r() * 6 });
  }
  const wake = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 4, max: 26 }, lifespan: { min: 420, max: 940 }, scale: { start: 0.34, end: 0.02 },
    alpha: { start: 0.55, end: 0 }, tint: 0xe4f7ea, emitting: false
  }).setDepth(11);
  const froth = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 30, max: 130 }, angle: { min: 200, max: 340 }, lifespan: { min: 240, max: 620 },
    scale: { start: 0.42, end: 0.04 }, alpha: { start: 0.8, end: 0 }, tint: 0xf2fbf2, emitting: false
  }).setDepth(14);
  const stretches = [];
  let head = null, cur = null;

  const stretchAt = (x) => {
    for (const s of stretches) if (x >= s.x0 && x < s.x0 + s.len) return s;
    return stretches.length && x < stretches[0].x0 ? stretches[0] : head;
  };
  function flowF(s, x, y) {
    if (!s) return 0.3;
    let best = 0.17;
    for (const ch of s.chans) {
      const g = cover(s, ch, x, y);
      if (g < 0.02) continue;
      const v = (0.2 + 0.86 * ch.depth) * (0.34 + 0.66 * g);
      if (v > best) best = v;
    }
    return clamp(inWeedAt(s, x) ? best * 0.54 : best, 0.12, 1.12);
  }
  const flowAt = (x, y) => { const s = stretchAt(x); return flowF(s, x, y) * s.pace; };
  const laneOf = (f) => (f > 0.76 ? 'deep' : f > 0.5 ? 'mid' : f > 0.32 ? 'reed' : 'bar');

  function addStretch(kind) {
    if (head && head.index + 1 >= BENDS) return head;
    const prev = stretches.length ? stretches[stretches.length - 1] : null;
    const index = prev ? prev.index + 1 : 0;
    const s = makeStretch(r, index, kind, prev ? prev.x0 + prev.len : 0, prev);
    const rr = rng('decor-' + index + '-' + kind);
    s.deco = scene.add.container(0, 0).setDepth(7);
    const spot = (key, x, y, sc, a, oy) => s.deco.add(scene.add.image(x, M.Y(y), key).setScale(sc * K).setAlpha(a).setOrigin(0.5, oy));
    const bar = (x, y, sc, a) => spot('rb-bar', x, y, sc * persp(y, s.half), a, 0.5);
    const reed = (x, y, sc) => spot('rb-reed', x, y, sc, 0.92, 0.84);
    // a bar of its own in every gap wide enough to walk across, split and rejoin included
    for (let i = 0; i < s.chans.length - 1; i++) {
      for (const [gx, a, b] of [[0, startY(s.chans[i]), startY(s.chans[i + 1])], [s.len, s.tail[i].y, s.tail[i + 1].y]]) {
        if (b - a < 122) continue;
        const y = (a + b) / 2;
        bar(gx, y, 0.24 + Math.min(0.3, (b - a) / 900), 0.95);
        if (rr() < 0.7) reed(gx + (rr() - 0.5) * 44, y, 0.32 + rr() * 0.3);
      }
    }
    for (let x = 110; x < s.len - 70; x += 92 + rr() * 68) {
      const wx = s.x0 + x, y = C + (rr() - 0.5) * halfAt(s, wx) * 1.7;
      let bestG = 0;
      for (const ch of s.chans) bestG = Math.max(bestG, cover(s, ch, wx, y));
      if (bestG > 0.34) continue;
      if (rr() < 0.66) bar(x, y, 0.26 + rr() * 0.34, 0.92);
      if (rr() < 0.55 && Math.abs(y - C) > s.half * 0.55) reed(x, y, 0.36 + rr() * 0.4);
    }
    if (s.weed) for (let k = 0; k < 13; k++) {
      const wx = s.weed.x + rr() * s.weed.w;
      const ch = s.chans[1 + Math.floor(rr() * (s.chans.length - 1))];
      spot('rb-weed', wx - s.x0, chanY(ch, wx) + (rr() - 0.5) * chW(ch, wx) * 1.3, 0.4 + rr() * 0.42, 0.9, 0.5);
    }
    if (s.ledge) for (let k = 0; k < 8; k++) {
      spot('rb-foam', s.ledge.x - s.x0 + 26 + (rr() - 0.5) * 54, C - s.half + 20 + (k / 8) * (s.half * 2 - 34), 0.28 + rr() * 0.34, 0.46, 0.5);
    }
    stretches.push(s); head = s;
    if (!cur) cur = s;
    return s;
  }
  function retire(xLimit) {
    while (stretches.length > 1 && stretches[0].x0 + stretches[0].len < xLimit) stretches.shift().deco.destroy();
  }
  addStretch('deep'); addStretch('deep');
  cur = stretchAt(h.wx);

  const logs = [], shadows = [];
  function spawnFloat(wx, y, kind) {
    const o = {
      img: scene.add.image(0, 0, kind === 'raft' ? 'rb-raft' : 'rb-log').setDepth(10)
        .setScale((kind === 'raft' ? 0.74 : 0.68) * K).setAlpha(0.98),
      wx, y, kind, len: kind === 'raft' ? 104 : 122, v: 0, gone: false, roll: (r() - 0.5) * 0.1, ph: r() * 6.28
    };
    logs.push(o);
    return o;
  }
  function spawnShadow(wx, y) {
    const o = {
      img: scene.add.image(0, 0, 'rb-shadow').setDepth(11).setScale(0.92 * K).setAlpha(0),
      wx, y, v: -(92 + r() * 58), ph: r() * 6.28, warn: 0.9, hit: false
    };
    shadows.push(o);
    return o;
  }
  function endRun(win) {
    if (st.over) return;
    st.over = true;
    scene.finish(win, { score: st.bend, note: win
      ? `${st.bend} bends read, and the braid hands you over to the sea`
      : `${st.bend} bends read before the river took the hatchling back` });
  }
  function hurt(text, kind) {
    if (st.iFrames > 0 || st.over) return false;
    const tumble = kind === 'tumble';
    st.hearts--; st.iFrames = 1.4; tuck = null; tuckT = 0;
    scene.sfx(tumble ? 'bad' : 'hurt');
    scene.shake(tumble ? 300 : 230, tumble ? 0.017 : 0.012);
    scene.cameras.main.flash(190, 70, 30, 18);
    scene.burst(h.x, M.Y(h.y), 0xffd06a, 15, { life: 560, gravity: 140, scale: 0.8 });
    scene.popText(h.x, M.Y(h.y - 58), tumble ? 'tumble' : 'slam', '#ff9d6a');
    scene.notice(text, 1800);
    if (st.hearts <= 0) endRun(false);
    return true;
  }
  const BEND_LINES = ['the braid narrows and quickens', 'deeper water, faster bends',
    'the sandbars lean in closer', 'the river is losing patience', 'the last bends are the quickest'];
  function creditBend(clean, why) {
    st.crossed++;
    if (clean) {
      st.bend++;
      scene.sfx('chime');
      scene.popText(h.x + 44, M.Y(h.y - 42), '+1 bend', '#ffe6a8');
      scene.burst(h.x + 30, M.Y(h.y), 0xd9f2d0, 10, { life: 460, scale: 0.5 });
      if (st.bend % 5 === 0) scene.notice(BEND_LINES[((st.bend / 5) - 1) % BEND_LINES.length], 1900);
    } else {
      scene.sfx('bad');
      scene.burst(h.x, M.Y(h.y), 0x9fc4b8, 9, { life: 420, scale: 0.5 });
      scene.popText(h.x, M.Y(h.y - 46), 'missed', '#bfe6dc');
      scene.notice(why, 1900);
      st.breath = clamp(st.breath - 0.14, 0, 1);
    }
  }
  const aim = (p) => {
    h.tx = clamp(scene.uX(p.x), 90, 720);
    h.ty = clamp(scene.uY(p.y), 150, 500);
  };
  const drop = () => { hold = false; };
  scene.input.on('pointermove', aim);
  scene.input.on('pointerdown', (p) => { hold = true; aim(p); });
  scene.input.on('pointerup', drop);
  scene.input.on('pointerupoutside', drop);
  const keys = scene.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    w: 'W', a: 'A', s: 'S', d: 'D', space: 'SPACE', shift: 'SHIFT'
  });
  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'let the water carry you' });
  scene.notice('hold behind a drifting log and the river spends nothing on you', 2800);
  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (st.over) return;
    st.time += dt;
    cur = stretchAt(h.wx);
    const s = cur;
    st.pace = lerp(st.pace, s.pace, Math.min(1, dt * 1.4));
    st.camX += st.pace * dt;
    while (head && head.index + 1 < BENDS && head.x0 + head.len < st.camX + W + 900) addStretch(st.nextKind);
    retire(st.camX - 300);
    const f = flowF(s, h.wx, h.y), localFlow = f * s.pace;
    const inWeed = inWeedAt(s, h.wx), kb = 330 * dt;
    const dn = (a, b) => a.isDown || b.isDown;
    if (dn(keys.left, keys.a)) h.tx -= kb;
    if (dn(keys.right, keys.d)) h.tx += kb;
    if (dn(keys.up, keys.w)) h.ty -= kb;
    if (dn(keys.down, keys.s)) h.ty += kb;
    h.tx = clamp(h.tx, 90, 720);
    h.ty = clamp(h.ty, bankTop(s, h.wx) + 14, bankBot(s, h.wx) - 14);
    keyHold = dn(keys.space, keys.shift);
    const wantHold = hold || keyHold;
    if (st.gasp > 0) st.gasp -= dt;
    if (wantHold && !tuck && st.gasp <= 0) {
      let best = null, bestD = 1e9;
      for (const o of logs) {
        const dx = Math.abs(h.wx - (o.wx + o.len * 0.5 + 42)), dy = Math.abs(h.y - o.y);
        if (dx > 78 || dy > 36) continue;
        if (dx + dy * 0.6 < bestD) { bestD = dx + dy * 0.6; best = o; }
      }
      if (best) {
        tuck = best; tuckT = 0;
        scene.sfx('splash');
        froth.emitParticleAt(h.x - 24, M.Y(h.y), 8);
        scene.burst(h.x - 10, M.Y(h.y), 0xeafaf0, 8, { life: 380, scale: 0.42 });
        scene.popText(h.x - 30, M.Y(h.y - 46), 'tucked', '#d9f2d0');
      } else if (st.time - st.nudge > 0.9) {
        st.nudge = st.time;
        scene.sfx('tick');
        scene.notice('nothing to hold — reach a log or a raft first', 1300);
      }
    }
    if (tuck) {
      tuckT += dt;
      if (!wantHold || tuckT > TUNE.tuckLife || tuck.gone || Math.abs(h.y - tuck.y) > 74) {
        const rolled = wantHold;
        tuck = null; tuckT = 0;
        if (rolled) { scene.sfx('whoosh'); scene.notice('the log rolls on and leaves you in the current', 1500); }
      }
    }
    if (tuck) {
      h.own = 0; h.vy = 0;
      h.wx += flowAt(tuck.wx, tuck.y) * dt;
      h.y = lerp(h.y, tuck.y + (h.ty > tuck.y ? 18 : -18), Math.min(1, dt * 1.2));
    } else if (st.gasp > 0) {
      h.own = lerp(h.own, 0, Math.min(1, dt * 6)); h.vy = 0;
      h.wx += localFlow * dt;
    } else {
      const want = clamp((h.tx - h.x) * 2.4, -TUNE.back, TUNE.swim);
      h.own = lerp(h.own, want, Math.min(1, dt * 4.2));
      h.wx += (localFlow + h.own * (inWeed ? 0.5 : 1)) * dt;
      const crossSpeed = TUNE.cross * (inWeed ? 0.6 : 1);
      h.vy = clamp((h.ty - h.y) * 4.4, -crossSpeed, crossSpeed);
      h.y += h.vy * dt;
    }
    h.x = h.wx - st.camX;
    pinned = false;
    if (h.x < PIN) { h.wx = st.camX + PIN; h.x = PIN; pinned = true; }
    if (h.x > 790) { h.wx = st.camX + 790; h.x = 790; }
    h.y = clamp(h.y, bankTop(s, h.wx) + 12, bankBot(s, h.wx) - 12);
    const crossE = clamp(Math.abs(h.vy) / TUNE.cross, 0, 1) * 0.45;
    const effort = clamp(Math.abs(h.own) / TUNE.swim + (tuck ? 0 : crossE), 0, 1.5);
    let bd = tuck ? TUNE.tuck : st.gasp > 0 ? 0.16
      : effort < 0.1 ? TUNE.coast : -(TUNE.drift + TUNE.hard * (effort - 0.1));
    if (inWeed) bd = bd > 0 ? bd * 0.25 : bd * 2.3;
    st.breath = clamp(st.breath + bd * dt, 0, 1);
    if (st.breath <= 0.001) {
      st.breath = 0.46; st.gasp = 1.3; tuck = null;
      st.iFrames = Math.max(st.iFrames, 1.1);
      scene.sfx('bad');
      scene.shake(240, 0.012);
      scene.cameras.main.flash(240, 20, 60, 80);
      scene.burst(h.x, M.Y(h.y), 0xbfe6dc, 14, { life: 620, gravity: 90 });
      scene.popText(h.x, M.Y(h.y - 56), 'gasp', '#bfe6dc');
      scene.notice('the breath goes — the water takes you under and gives you back', 2200);
    }
    st.iFrames = Math.max(0, st.iFrames - dt);

    if (h.wx >= s.gate) {
      let mouth = null;
      for (const m of s.mouths) {
        if (Math.abs(h.y - m.y) < m.w * persp(m.y, s.half) * 1.3 + 26) { mouth = m; break; }
      }
      const clean = !pinned && !!mouth;
      creditBend(clean, pinned ? 'that bend went by while you hung at the edge of the day' : 'the bar took you past the fork');
      st.nextKind = clean ? mouth.kind : 'deep';
      if (clean && mouth.kind === 'shallow') st.breath = clamp(st.breath - 0.05, 0, 1);
      cur = stretchAt(h.wx);
      if (st.crossed >= BENDS) { endRun(true); return; }
    }
    const led = s.ledge;
    if (led) {
      if (!led.warned && led.x - st.camX < 640) {
        led.warned = true;
        scene.notice('the braid goes over a lip — get into the slow channel', 2300);
      }
      if (!led.done && h.wx > led.x) {
        led.done = true;
        if (flowF(s, led.x, h.y) < 0.5) {
          scene.sfx('good');
          scene.popText(h.x, M.Y(h.y - 52), 'slow side', '#d9f2d0');
          scene.burst(h.x, M.Y(h.y), 0xf2fbf2, 14, { life: 540, scale: 0.5 });
          scene.notice('you go over in the quiet water, barely wet', 1700);
        } else {
          st.breath = clamp(st.breath - 0.2, 0, 1);
          hurt('over the lip in fast water — the pool takes you down', 'tumble');
          scene.cameras.main.flash(260, 30, 70, 90);
        }
      }
    }
    st.spawnT -= dt;
    if (st.spawnT <= 0 && logs.length < 7) {
      st.spawnT = lerp(2.5, 1.6, clamp(s.index / BENDS, 0, 1)) + r() * 1.1;
      const ch = s.chans[Math.floor(r() * s.chans.length)], wx = st.camX + W + 130;
      spawnFloat(wx, chanY(ch, wx), r() < 0.3 ? 'raft' : 'log');
    }
    for (let i = logs.length - 1; i >= 0; i--) {
      const o = logs[i];
      o.v = flowAt(o.wx, o.y);
      o.wx += o.v * dt;
      o.y += Math.sin(time / 900 + o.ph) * dt * 5;
      o.img.x = o.wx - st.camX;
      o.img.y = M.Y(o.y);
      o.img.rotation = o.roll + Math.sin(time / 1100 + o.ph) * 0.03;
      if (o.img.x < -230) {
        o.gone = true; o.img.destroy(); logs.splice(i, 1);
        if (tuck === o) { tuck = null; tuckT = 0; }
        continue;
      }
      const dx = (h.wx - o.wx) / (o.len * 0.4), dy = (h.y - o.y) / 23;
      if (dx * dx + dy * dy < 1 && !tuck && st.gasp <= 0
        && hurt('a log you did not duck behind finds you first', 'slam')) { h.own = -TUNE.back; h.wx -= 30; }
    }
    st.shadowT -= dt;
    if (st.shadowT <= 0 && s.index >= 2 && shadows.length < 2) {
      st.shadowT = lerp(11, 7, clamp(s.index / BENDS, 0, 1)) + r() * 4;
      const wx = st.camX + W + 300;
      spawnShadow(wx, chanY(s.chans[0], wx));
      scene.notice('something long is coming up the deep channel', 2100);
    }
    for (let i = shadows.length - 1; i >= 0; i--) {
      const o = shadows[i];
      o.wx += o.v * dt;
      o.y += Math.sin(time / 1300 + o.ph) * dt * 30;
      o.img.x = o.wx - st.camX;
      o.img.y = M.Y(o.y);
      o.img.alpha = o.warn > 0 ? (o.warn -= dt, clamp(0.2 - o.warn * 0.12, 0, 0.2)) : 0.6 + Math.sin(time / 700 + o.ph) * 0.1;
      if (!o.hit && st.iFrames <= 0 && Math.abs(o.img.x - h.x) < 104 && Math.abs(o.y - h.y) < 38) {
        o.hit = true;
        st.breath = clamp(st.breath - 0.12, 0, 1);
        hurt('the shadow closes over you in the deep thread', 'slam');
      }
      if (o.img.x < -340) { o.img.destroy(); shadows.splice(i, 1); }
    }
    for (const l of leaves) {
      l.wx += flowAt(l.wx, l.y) * dt;
      l.y += Math.sin(time / 1400 + l.ph) * dt * 7;
      if (l.wx - st.camX < -40 || l.wx - st.camX > W + 60) {
        l.wx = st.camX + W + 20 + r() * 180;
        const ch = s.chans[Math.floor(r() * s.chans.length)];
        l.y = chanY(ch, l.wx) + (r() - 0.5) * chW(ch, l.wx);
      }
      l.img.x = l.wx - st.camX;
      l.img.y = M.Y(l.y);
      l.img.rotation = l.spin + Math.sin(time / 600 + l.ph) * 0.2;
    }
    drawWater(time);
    bedTile.tilePositionX = -st.camX;
    farTile.tilePositionX = -st.camX * 0.86;
    nearTile.tilePositionX = -st.camX * 1.12;
    treeRow.forEach((t, i) => { t.x = ((((i * 130) - st.camX * 0.22) % 1170) + 1170) % 1170 - 105; });
    for (const ss of stretches) if (ss.deco) ss.deco.x = ss.x0 - st.camX;

    const py = M.Y(h.y);
    player.x = h.x; player.y = py;
    glow.x = h.x; glow.y = py;
    player.setTexture(Math.floor(time / Math.max(90, tuck ? 980 : 250 - 90 * clamp(effort, 0, 1))) % 2 ? 'rb-hatch-0' : 'rb-hatch-1');
    player.setAngle(clamp(h.vy * 0.05, -13, 13) + Math.sin(time / 420) * 2);
    player.setAlpha(st.iFrames > 0 && Math.floor(time / 70) % 2 ? 0.4 : 1);
    player.setScale((1.14 + (tuck ? 0.05 : 0)) * K);
    glow.setAlpha(0.09 + Math.sin(time / 500) * 0.03 + (tuck ? 0.12 : 0));
    glow.setTint(st.breath < 0.28 ? 0xff9d6a : 0xfff0b8);
    if (Math.random() < dt * (tuck ? 26 : 9 + effort * 26)) wake.emitParticleAt(h.x - 36 * K, M.Y(h.y + 9), 1);
    if (tuck && Math.random() < dt * 30) froth.emitParticleAt(h.x - 54, M.Y(h.y + (Math.random() - 0.5) * 22), 1);
    const extra = tuck ? 'drafting'
      : st.gasp > 0 ? 'under'
        : inWeed ? 'weed jam — push'
          : pinned ? 'falling behind the bend'
            : st.breath < 0.3 ? 'breath low — find a wake'
              : f > 0.76 ? 'the deep thread'
                : f < 0.32 ? 'reeds and sand' : '';
    scene.hud({ score: st.bend, progress: st.breath, hearts: st.hearts, extra });
    scene.audio.setTension(st.breath < 0.3 ? 0.6 : pinned ? 0.45 : clamp(1 - f, 0, 0.35));
  }
  const TONE = [
    { body: 0x0d3b46, core: 0x06222a, edge: 0xd8efdd, streak: 0x9fe0d8, gap: 96, a: 0.42 },
    { body: 0x245a4e, core: 0x14424a, edge: 0xc3e6d6, streak: 0x8fd0c8, gap: 128, a: 0.26 },
    { body: 0x556b3c, core: 0x3d5230, edge: 0xdcdca4, streak: 0xd8e6a8, gap: 162, a: 0.15 }
  ];
  const toneOf = (d) => (d > 0.7 ? TONE[0] : d > 0.45 ? TONE[1] : TONE[2]);

  function drawWater(time) {
    gWater.clear(); gFlow.clear(); gEdge.clear();
    const camX = st.camX, step = 26;
    const yAt = (s, ch, wx, side) => M.Y(chanY(ch, wx) + side * threadW(s, ch, wx) * persp(chanY(ch, wx), halfAt(s, wx)));
    const band = (g, s, ch, k) => {
      const n = Math.ceil(s.len / step);
      g.beginPath();
      for (let pass = 0; pass < 2; pass++) for (let j = 0; j <= n; j++) {
        const i = pass ? n - j : j, wx = s.x0 + i * step;
        const lo = yAt(s, ch, wx, -1), hi = yAt(s, ch, wx, 1);
        const y = (lo + hi) / 2 + ((lo - hi) / 2 * k) * (pass ? -1 : 1);
        pass || j ? g.lineTo(wx - camX, y) : g.moveTo(wx - camX, y);
      }
    };
    for (const s of stretches) {
      if (s.x0 + s.len < camX - 40 || s.x0 > camX + W + 40) continue;
      for (const ch of s.chans) {
        const tone = toneOf(ch.depth);
        gWater.fillStyle(tone.body, 0.5 + ch.depth * 0.4);
        band(gWater, s, ch, 1); gWater.fill();
        gWater.fillStyle(tone.core, 0.45);
        band(gWater, s, ch, 0.46); gWater.fill();
        gEdge.lineStyle(2, tone.edge, ch.depth > 0.6 ? 0.34 : 0.16);
        band(gEdge, s, ch, 1); gEdge.strokePath();
        const off = (time * 0.001 * flowF(s, s.x0, chanY(ch, s.x0)) * s.pace + ch.ph * 40) % tone.gap;
        gFlow.lineStyle(ch.depth > 0.7 ? 2.4 : 1.6, tone.streak, tone.a);
        for (let k = -1; k * tone.gap + off < s.len; k++) {
          const lx = k * tone.gap + off;
          if (lx < 0 || lx > s.len || threadW(s, ch, s.x0 + lx) < 12) continue;
          const wx = s.x0 + lx - camX;
          for (const side of [-0.56, 0.06, 0.62]) {
            gFlow.beginPath();
            gFlow.moveTo(wx, yAt(s, ch, wx + camX, side));
            gFlow.lineTo(wx + 30, yAt(s, ch, wx + camX + 30, side));
            gFlow.strokePath();
          }
        }
      }
      if (s.weed) {
        gWater.fillStyle(0x35491f, 0.24);
        gWater.fillRect(s.weed.x - camX, M.Y(C - s.half), s.weed.w, M.Y(C + s.half) - M.Y(C - s.half));
      }
      if (s.ledge && s.ledge.x - camX > -160 && s.ledge.x - camX < W + 160) {
        const lx = s.ledge.x - camX, top = M.Y(C - halfAt(s, s.ledge.x));
        const fall = M.Y(C + halfAt(s, s.ledge.x)) - top;
        gWater.fillStyle(0x06222a, 0.44); gWater.fillRect(lx, top, 26, fall);
        gWater.fillStyle(0x0a3138, 0.3); gWater.fillRect(lx + 26, top, 62, fall);
        for (const [d, w, a, sp] of [[0, 5, 0.6, 340], [14, 2.6, 0.4, 260], [30, 1.6, 0.24, 190]]) {
          gEdge.lineStyle(w, 0xf4fbf4, a).beginPath();
          for (let i = 0; i <= 12; i++) {
            const t = i / 12, y = M.Y(C - s.half + t * s.half * 2);
            const x = lx + d + Math.sin(t * 5.4 + time / sp) * 10 + Math.sin(t * 2.3 - time / (sp * 1.6)) * 5;
            i ? gEdge.lineTo(x, y) : gEdge.moveTo(x, y);
          }
          gEdge.strokePath();
        }
      }
      const gx = s.gate - camX;
      if (gx > -90 && gx < W + 90) for (const m of s.mouths) {
        const wide = Math.min(34, m.w * persp(m.y, s.half));
        const col = m.kind === 'deep' ? 0x9fe0d8 : 0xe0c47c;
        for (const [d, w, a] of [[0, 4.5, 0.5], [19, 3, 0.2]]) {
          gEdge.lineStyle(w, col, a).beginPath();
          gEdge.moveTo(gx + d, M.Y(m.y - wide));
          gEdge.lineTo(gx + d + 15, M.Y(m.y));
          gEdge.lineTo(gx + d, M.Y(m.y + wide));
          gEdge.strokePath();
        }
      }
    }
  }
  return {
    update,
    state: () => {
      const s = stretchAt(h.wx), f = flowF(s, h.wx, h.y);
      return {
        bend: st.bend, crossed: st.crossed, hearts: st.hearts,
        time: Number(st.time.toFixed(2)), breath: Number(st.breath.toFixed(2)), gasp: Number(st.gasp.toFixed(1)),
        x: Math.round(h.x), y: Math.round(h.y), wx: Math.round(h.wx),
        own: Math.round(h.own), flow: Math.round(f * s.pace), current: Number(f.toFixed(2)),
        lane: laneOf(f), tucked: !!tuck, tuckT: Number(tuckT.toFixed(1)),
        pace: Math.round(st.pace), pinned, kind: s.kind, index: s.index, weed: inWeedAt(s, h.wx),
        logs: logs.length, shadows: shadows.length, gate: Math.round(s.gate - h.wx), bends: BENDS, over: st.over
      };
    },
    spots: () => {
      const s = stretchAt(h.wx);
      return { deep: Math.round(chanY(s.chans[0], h.wx)), reed: Math.round(chanY(s.chans[s.chans.length - 1], h.wx)),
        edge: Math.round(bankTop(s, h.wx) + 18) };
    },
    mouths: () => {
      const s = stretchAt(h.wx);
      return s.mouths.map((m) => ({ y: Math.round(m.y), kind: m.kind, gate: Math.round(s.gate - h.wx) }));
    },
    flowAtY: (y) => Math.round(flowAt(h.wx, y)),
    place: (x, y) => {
      h.wx = st.camX + x; h.x = x; h.y = y; h.own = 0; h.vy = 0; h.tx = x; h.ty = y;
      tuck = null; tuckT = 0; st.gasp = 0;
    },
    aim: (x, y) => { h.tx = x; h.ty = clamp(y, 150, 500); },
    addLog: (x, y, kind) => {
      const o = spawnFloat(st.camX + x, y, kind || 'log');
      return { x: Math.round(o.wx - st.camX), y: Math.round(o.y) };
    },
    addShadow: (x, y) => { spawnShadow(st.camX + x, y).warn = 0; return true; },
    forceLedge: (ahead) => {
      const s = stretchAt(h.wx);
      s.ledge = { x: Math.min(h.wx + (ahead || 260), s.gate - 70), done: false, warned: true };
      return Math.round(s.ledge.x - h.wx);
    },
    clearProps: () => {
      logs.forEach((o) => { o.gone = true; o.img.destroy(); });
      shadows.forEach((o) => o.img.destroy());
      logs.length = 0; shadows.length = 0; tuck = null; tuckT = 0;
    },
    skipTo: (n) => {
      const target = clamp(Math.round(n), 0, BENDS - 1);
      while (head.index < target) addStretch(st.nextKind);
      const s = stretches.find((x) => x.index === target) || head;
      st.camX = s.x0 - 240; retire(st.camX - 300); cur = s;
      h.wx = st.camX + 240; h.x = 240; h.own = 0; h.vy = 0; h.tx = 240; h.ty = h.y;
      st.crossed = target; tuck = null; tuckT = 0;
      return { index: target, camX: Math.round(st.camX), gate: Math.round(s.gate - h.wx) };
    },
    setBend: (v) => { st.bend = v; }, setHearts: (v) => { st.hearts = v; },
    setBreath: (v) => { st.breath = v; }, setIFrames: (v) => { st.iFrames = v; },
    hold: (on) => { hold = !!on; }
  };
}

export default { id: 'river-braid', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
