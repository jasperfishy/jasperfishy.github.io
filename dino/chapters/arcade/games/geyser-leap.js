// Geyser Leap — the caldera breathes water and ash on a beat.
// You do not climb this wall. You stand on a vent, wait for the breath, and
// let it throw you up the terraces. Read the cycle or the water reads you.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-f652baf3e7fda2b1';

const STAR = [10, 18, 28];
const STEP = 78;
const RIM = 28;
const GRAV = 1500;
const FIX = 1 / 60;
const TAU = Math.PI * 2;
const SHELF_W = [232, 252, 272, 296];
const PLATE = 0.44;
const PAL = MOODS.volcanic;

const LINES = {
  open: 'the mountain breathes — ride the breath, not the panic',
  cold: 'the pad is cold, it has not filled yet',
  drown: 'ash-water in the mouth — back on the pad',
  ashIn: 'ash is falling; the vents will not open',
  ashOut: 'the ash lifts — the mountain breathes again',
  shelter: 'under the lip, and the rock cooks you slowly',
  out: 'out from under the lip',
  climb: 'up the chimney, hand over hand, and it is warm in here',
  noVent: 'step onto a vent first',
  heat: 'the steam found you — shake it off',
  flooded: 'the water closed the way and you came out counting',
  rim: 'the rim, and the breath still going under you',
  smothered: 'the ash took the breath out of it'
};

// this Phaser build gives Graphics straight segments only, so curves are traced
function quad(g, x0, y0, cx, cy, x1, y1) {
  for (let i = 1; i <= 8; i++) {
    const u = i / 8, v = 1 - u;
    g.lineTo(v * v * x0 + 2 * v * u * cx + u * u * x1, v * v * y0 + 2 * v * u * cy + u * u * y1);
  }
}

function art(scene) {
  const rim = (c, w, h, rgb, seed, ga) => {
    c.globalCompositeOperation = 'source-atop';
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(' + rgb + ',0.28)');
    g.addColorStop(0.6, 'rgba(' + rgb + ',0)');
    g.addColorStop(1, 'rgba(' + rgb + ',0.13)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, ga, seed);
  };

  const keeper = (pose) => {
    canvasTex(scene, 'gl-keeper-' + pose, 132, 128, (c) => {
      const ride = pose === 'ride';
      const fall = pose === 'fall';
      const duck = pose === 'crouch';
      const by = 76 + (duck ? 15 : 0) - (ride ? 8 : 0);
      const hy = 44 + (duck ? 20 : 0) - (ride ? 10 : 0);
      const foot = fall ? 106 : 122;
      c.lineCap = 'round';
      if (!ride && !fall) {
        c.fillStyle = 'rgba(12,6,8,0.3)';
        c.beginPath(); c.ellipse(66, 124, 28, 5, 0, 0, TAU); c.fill();
      }
      c.strokeStyle = '#7f8d88'; c.lineWidth = 11;
      c.beginPath(); c.moveTo(46, by + 2);
      c.quadraticCurveTo(22, by + (ride ? 18 : 2), 7, by + (ride ? 34 : fall ? 20 : -14));
      c.stroke();
      c.strokeStyle = '#54635f'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.moveTo(40 - i * 8, by - 2 - i); c.lineTo(32 - i * 8, by + 12 - i * 3); c.stroke();
      }
      const bg = c.createLinearGradient(36, by - 26, 108, by + 26);
      bg.addColorStop(0, '#c3cec4'); bg.addColorStop(0.5, '#7d918b'); bg.addColorStop(1, '#3e5151');
      c.fillStyle = bg;
      c.beginPath(); c.ellipse(72, by, ride ? 30 : 37, ride ? 26 : 23, ride ? -0.5 : -0.1, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,214,166,0.34)';
      c.beginPath(); c.ellipse(76, by + 12, ride ? 18 : 25, 8, -0.06, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(48,66,66,0.5)'; c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.moveTo(58 + i * 12, by - 17 + i * 2);
        c.quadraticCurveTo(62 + i * 12, by - 4, 58 + i * 12, by + 9); c.stroke();
      }
      c.strokeStyle = '#93a69d'; c.lineWidth = 13;
      c.beginPath(); c.moveTo(100, by - 8);
      c.quadraticCurveTo(114, hy + 14, ride ? 118 : 116, hy + 4); c.stroke();
      c.fillStyle = '#a9bab0';
      c.beginPath(); c.ellipse(119, hy, 17, 12, ride ? -0.5 : -0.2, 0, TAU); c.fill();
      c.fillStyle = '#5d6f68';
      c.beginPath(); c.moveTo(131, hy - 3); c.quadraticCurveTo(150, hy + 1, 146, hy + 8);
      c.quadraticCurveTo(138, hy + 10, 130, hy + 6); c.closePath(); c.fill();
      c.fillStyle = '#e9d9ac';
      c.beginPath(); c.moveTo(132, hy + 1); c.quadraticCurveTo(152, hy + 3, 149, hy + 8);
      c.quadraticCurveTo(140, hy + 7, 132, hy + 5); c.closePath(); c.fill();
      c.strokeStyle = '#4fb3a4'; c.lineWidth = 3.4;
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.moveTo(113 + i * 3, hy - 9);
        c.quadraticCurveTo(100 + i * 4, hy - 22 - i * 4, 88 + i * 3, hy - 20 - i * 5); c.stroke();
      }
      c.fillStyle = '#fff3d2'; c.beginPath(); c.arc(123, hy - 3, 4.4, 0, TAU); c.fill();
      c.fillStyle = '#171215'; c.beginPath(); c.arc(124.4, hy - 3, 2.2, 0, TAU); c.fill();
      c.strokeStyle = '#6f827c'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(92, by - 2);
      c.quadraticCurveTo(104, by + (ride ? -22 : fall ? 8 : 10), 110, by + (ride ? -32 : fall ? 4 : 14));
      c.stroke();
      c.strokeStyle = '#e6e2c8'; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(110, by + (ride ? -32 : fall ? 4 : 14));
      c.lineTo(116, by + (ride ? -38 : fall ? 0 : 18)); c.stroke();
      const legs = ride
        ? [[74, by + 18, 58, foot - 8], [86, by + 16, 78, foot - 2]]
        : fall
          ? [[70, by + 16, 56, foot - 14], [84, by + 18, 76, foot - 4]]
          : [[72, by + 18, duck ? 60 : 92, foot], [86, by + 18, duck ? 96 : 58, foot]];
      legs.forEach(([hx, hyy, fx, fy], i) => {
        c.strokeStyle = i ? '#6d807a' : '#849792'; c.lineWidth = 8;
        c.beginPath(); c.moveTo(hx, hyy);
        c.quadraticCurveTo((hx + fx) / 2 + 7, (hyy + fy) / 2, fx, fy); c.stroke();
        c.strokeStyle = '#e6e2c8'; c.lineWidth = 2.6;
        c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 10, fy + 2);
        c.moveTo(fx, fy); c.lineTo(fx + 6, fy + 5); c.stroke();
      });
      rim(c, 132, 128, '255,190,140', 211 + pose.length * 9, 0.03);
    });
  };
  ['wait', 'ride', 'fall', 'crouch'].forEach(keeper);

  const shelf = (w) => {
    canvasTex(scene, 'gl-shelf-' + w, w, 78, (c) => {
      const rand = rng(900 + w);
      const top = 14;
      const cx = w / 2;
      const pl = (w * PLATE) / 2;
      const g = c.createLinearGradient(0, top, 0, 78);
      g.addColorStop(0, '#6b4a43'); g.addColorStop(0.42, '#422a2c'); g.addColorStop(1, '#1b0f13');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(cx - pl, top);
      c.quadraticCurveTo(cx - pl * 0.4, top - 5, cx, top - 4);
      c.quadraticCurveTo(cx + pl * 0.5, top - 5, cx + pl, top);
      c.lineTo(cx + pl + 12, top + 19);
      c.lineTo(w - 5, top + 40);
      c.lineTo(w - 22, 62); c.lineTo(cx + pl * 0.55, 76);
      c.lineTo(cx - pl * 0.62, 72); c.lineTo(14, 60); c.lineTo(3, top + 34);
      c.lineTo(cx - pl - 14, top + 16);
      c.closePath(); c.fill();
      const face = c.createLinearGradient(0, top - 8, 0, top + 12);
      face.addColorStop(0, '#96695a'); face.addColorStop(1, '#583a37');
      c.fillStyle = face;
      c.beginPath(); c.ellipse(cx, top + 1, pl, 7.2, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,146,78,0.42)'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(cx - pl + 3, top + 4);
      c.quadraticCurveTo(cx, top - 3, cx + pl - 3, top + 4); c.stroke();
      c.fillStyle = 'rgba(26,13,15,0.42)';
      c.beginPath();
      c.moveTo(cx + pl, top + 1); c.lineTo(cx + pl + 12, top + 19); c.lineTo(w - 5, top + 40);
      c.lineTo(w - 12, top + 46); c.lineTo(cx + pl + 6, top + 24); c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(cx - pl, top + 1); c.lineTo(cx - pl - 14, top + 16); c.lineTo(3, top + 34);
      c.lineTo(10, top + 41); c.lineTo(cx - pl - 8, top + 22); c.closePath(); c.fill();
      c.fillStyle = 'rgba(18,9,11,0.5)';
      for (let i = 0; i < 6; i++) c.fillRect(cx - pl + rand() * pl * 2, 30 + rand() * 14, 4 + rand() * 7, 20 + rand() * 14);
      c.strokeStyle = 'rgba(255,206,150,0.16)'; c.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const x = cx - pl + rand() * pl * 2;
        c.beginPath(); c.moveTo(x, top + 8); c.lineTo(x + 6 + rand() * 10, 42 + rand() * 14); c.stroke();
      }
      c.fillStyle = 'rgba(120,86,72,0.5)';
      for (let i = 0; i < 9; i++) {
        const ox = (rand() < 0.5 ? -1 : 1) * (pl + 6 + rand() * (w / 2 - pl - 10));
        c.beginPath(); c.ellipse(cx + ox, top + 20 + rand() * 16, 3 + rand() * 5, 1.8 + rand() * 2.4, rand(), 0, TAU); c.fill();
      }
      grain(c, w, 78, 0.05, 77 + w);
    });
  };
  SHELF_W.forEach(shelf);

  canvasTex(scene, 'gl-pad', 118, 54, (c) => {
    const rand = rng(1313);
    const g = c.createLinearGradient(0, 4, 0, 54);
    g.addColorStop(0, '#7f5c4d'); g.addColorStop(0.5, '#4a3134'); g.addColorStop(1, '#211317');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(6, 21); c.quadraticCurveTo(22, 7, 59, 7); c.quadraticCurveTo(96, 7, 112, 21);
    c.lineTo(104, 44); c.lineTo(59, 52); c.lineTo(14, 44); c.closePath(); c.fill();
    for (let i = 0; i < 7; i++) {
      c.fillStyle = i % 2 ? '#6d4b42' : '#553836';
      c.beginPath(); c.ellipse(11 + i * 15 + rand() * 4, 17, 9.5, 5.2, 0, 0, TAU); c.fill();
    }
    const th = c.createRadialGradient(59, 18, 2, 59, 18, 27);
    th.addColorStop(0, '#0d0709'); th.addColorStop(0.55, '#241318'); th.addColorStop(1, 'rgba(38,18,18,0)');
    c.fillStyle = th;
    c.beginPath(); c.ellipse(59, 18, 25, 9.4, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,168,96,0.3)'; c.lineWidth = 1.8;
    c.beginPath(); c.ellipse(59, 18, 26, 10, 0, Math.PI, TAU); c.stroke();
    c.fillStyle = 'rgba(210,180,140,0.14)';
    for (let i = 0; i < 12; i++) c.fillRect(12 + rand() * 92, 26 + rand() * 18, 3 + rand() * 8, 1.6);
    grain(c, 118, 54, 0.05, 1321);
  });

  canvasTex(scene, 'gl-shelter', 156, 86, (c) => {
    const rand = rng(1707);
    const g = c.createLinearGradient(0, 6, 0, 86);
    g.addColorStop(0, '#7a574c'); g.addColorStop(0.5, '#452b2c'); g.addColorStop(1, '#150c0f');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(2, 30); c.quadraticCurveTo(30, 8, 78, 12); c.quadraticCurveTo(130, 16, 154, 40);
    c.lineTo(150, 62); c.quadraticCurveTo(104, 46, 62, 50); c.quadraticCurveTo(24, 54, 6, 74);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(8,4,6,0.62)';
    c.beginPath(); c.moveTo(12, 60); c.quadraticCurveTo(56, 48, 112, 56);
    c.quadraticCurveTo(74, 78, 14, 78); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,178,110,0.3)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(6, 32); c.quadraticCurveTo(60, 14, 150, 42); c.stroke();
    c.fillStyle = 'rgba(226,196,150,0.12)';
    for (let i = 0; i < 14; i++) c.fillRect(rand() * 150, 20 + rand() * 40, 2 + rand() * 6, 1.4);
    grain(c, 156, 86, 0.05, 1719);
  });

  canvasTex(scene, 'gl-chimney', 92, 178, (c) => {
    const rand = rng(1901);
    c.fillStyle = '#1a0e11';
    c.beginPath();
    c.moveTo(24, 176); c.quadraticCurveTo(14, 108, 26, 40); c.quadraticCurveTo(34, 12, 46, 2);
    c.quadraticCurveTo(62, 16, 66, 48); c.quadraticCurveTo(76, 112, 68, 176);
    c.closePath(); c.fill();
    const g = c.createLinearGradient(46, 176, 46, 20);
    g.addColorStop(0, 'rgba(255,120,50,0.5)'); g.addColorStop(0.5, 'rgba(255,150,70,0.16)');
    g.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(32, 174); c.quadraticCurveTo(26, 108, 34, 44); c.lineTo(56, 44);
    c.quadraticCurveTo(62, 110, 58, 174); c.closePath(); c.fill();
    c.strokeStyle = '#6f5348'; c.lineWidth = 6; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const y = 150 - i * 24;
      const x = 30 + (i % 2 ? 26 : 4) + rand() * 4;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 16, y - 4); c.stroke();
    }
    c.strokeStyle = 'rgba(255,214,166,0.4)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(28, 172); c.quadraticCurveTo(20, 100, 34, 30); c.stroke();
    grain(c, 92, 178, 0.05, 1913);
  });

  canvasTex(scene, 'gl-wall', 168, 560, (c) => {
    const rand = rng(2401);
    const g = c.createLinearGradient(0, 0, 168, 0);
    g.addColorStop(0, '#150a0d'); g.addColorStop(0.55, '#33201f'); g.addColorStop(1, '#1d1114');
    c.fillStyle = g; c.fillRect(0, 0, 168, 560);
    c.strokeStyle = 'rgba(10,5,7,0.65)';
    for (let i = 0; i < 16; i++) {
      const y = (i * 41 + rand() * 20) % 560;
      c.lineWidth = 1 + rand() * 2.4;
      c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(84, y + 12, 168, y - 8); c.stroke();
    }
    c.strokeStyle = 'rgba(255,124,60,0.2)'; c.lineWidth = 2.2;
    for (let i = 0; i < 4; i++) {
      const y = 40 + i * 132;
      c.beginPath(); c.moveTo(28 + i * 16, y); c.lineTo(46 + i * 6, y + 46); c.lineTo(26, y + 96); c.stroke();
    }
    c.fillStyle = 'rgba(255,178,120,0.05)';
    for (let i = 0; i < 22; i++) {
      c.beginPath(); c.ellipse(rand() * 168, rand() * 560, 9 + rand() * 22, 3 + rand() * 7, rand() * 2, 0, TAU); c.fill();
    }
    grain(c, 168, 560, 0.05, 2411);
  });

  canvasTex(scene, 'gl-ash', 14, 14, (c) => {
    const g = c.createRadialGradient(7, 7, 1, 7, 7, 7);
    g.addColorStop(0, 'rgba(226,206,190,0.9)');
    g.addColorStop(0.55, 'rgba(150,120,108,0.5)');
    g.addColorStop(1, 'rgba(120,92,82,0)');
    c.fillStyle = g; c.fillRect(0, 0, 14, 14);
  });
}

function create(scene) {
  const M = scene.M, K = scene.k;
  // terraces live on the horizontal axis, which never stretches, so props grow
  // with SS and only the keeper grows with K
  const SS = M.portrait ? 1.16 : 1;
  art(scene);
  const col = (h) => Phaser.Display.Color.HexStringToColor(h).color;
  const accent = col(PAL.accent), motes = col(PAL.motes), mist = col(PAL.mist);
  const r = rng(20261116);

  const st = {
    at: 0, best: 0, hearts: 3, heat: 0, over: false, clock: 1, time: 0, acc: 0,
    mode: 'ground', invuln: 0, ash: 0, ashT: 19, ashEvery: 27, ashLen: 6,
    flood: -220, refH: 0, camH: -180, walkTo: null, shelter: false, tickN: 0,
    climb: { t: 0, dur: 1.5, fx: 0, tx: 0, fh: 0, th: 0, from: 0, to: 0 },
    last: { apex: 0, full: 0, gain: 0, short: false, pad: -1, clean: false, peak: 0, from: 0, to: 0 },
    peak: 0, launchH: 0, launchPad: -1
  };
  const p = { x: 300, h: 0, vx: 0, vh: 0, face: 1, pose: 'wait' };

  /* ------------------------------------------------------------ terraces */
  const terraces = [];
  let side = 1;
  for (let i = 0; i <= RIM; i++) {
    const wTex = SHELF_W[Math.max(0, Math.min(SHELF_W.length - 1, 3 - Math.floor(i / 8)))];
    const half = (wTex / 2) * SS - 6;
    const flat = (wTex * PLATE / 2) * SS;
    let x = 480;
    if (i > 0) {
      const hold = r() < 0.16 && i > 4;
      if (!hold) side = -side;
      const amp = 116 + i * 1.1 + r() * 24 + (hold ? 72 : 0);
      x = clamp(480 + side * amp + (r() - 0.5) * 40, 252, 708);
    }
    terraces.push({
      i, x, h: i * STEP, wTex, half, flat, pads: [], chimney: null, dir: 1,
      img: null, shelterImg: null, chimneyImg: null, shelterX: 0, hasShelter: false
    });
  }

  const pads = [];
  terraces.forEach((t, i) => {
    const to = Math.min(RIM, i + (i > 5 && i < RIM - 1 && r() < 0.2 ? 2 : 1));
    let dir = Math.sign(terraces[to].x - t.x) || (t.x < W / 2 ? 1 : -1);
    t.dir = dir;
    const n = i === 0 ? 2 : r() < 0.46 ? 2 : 1;
    const offs = n === 2 ? [0.24, 0.72] : [0.5];
    const lim = Math.max(12, t.flat - 24);
    for (let k = 0; k < n; k++) {
      const P = lerp(3, 1.9, i / RIM);
      const E = lerp(0.62, 0.34, i / RIM);
      const pad = {
        id: pads.length, x: t.x + dir * Math.min(offs[k] * t.flat, lim), h: t.h + 4,
        terrace: i, dir, to, P, E,
        c: i < 5 ? 0 : r() * P, fill: 0, erupt: false, left: 0, was: false, rumbled: false,
        aimX: t.x, dh: 0, apex: 130, tRef: 0.6, vxRef: 0, img: null
      };
      pads.push(pad);
      t.pads.push(pad);
    }
    const back = -dir;
    if (i > 2 && i < RIM && r() < 0.3) {
      t.chimney = { x: t.x + back * Math.min(t.flat - 8, lim), to: Math.min(RIM, i + 1), landX: 0 };
    } else if (r() < 0.5) {
      t.hasShelter = true;
      t.shelterX = t.x + back * (t.flat * 0.6);
    }
  });

  function plan(pad) {
    const target = terraces[pad.to];
    pad.aimX = clamp(target.x - pad.dir * 0.1 * target.flat, 42, W - 42);
    const dh = Math.max(42, target.h - pad.h + 24);
    const d = Math.abs(pad.aimX - pad.x);
    // clearing the next terrace is only half the promise: the jet has to stay in
    // the air long enough to cross the gap at the fastest horizontal it will ever
    // give, so a wide zigzag is planned taller instead of falling short into the water
    const reach = Math.max(0.34, d / 296);
    const vh = (dh + 0.5 * GRAV * reach * reach) / reach;
    pad.dh = dh;
    pad.apex = Math.max(dh + 30 + Math.min(58, d * 0.26), (vh * vh) / (2 * GRAV));
    const v0 = Math.sqrt(2 * GRAV * pad.apex);
    pad.tRef = (v0 + Math.sqrt(Math.max(0, v0 * v0 - 2 * GRAV * dh))) / GRAV;
    pad.vxRef = clamp((pad.aimX - pad.x) / pad.tRef, -296, 296);
  }
  pads.forEach(plan);
  terraces.forEach((t) => {
    if (!t.chimney) return;
    const target = terraces[t.chimney.to];
    const sd = Math.sign(target.x - t.x) || 1;
    t.chimney.landX = clamp(target.x - sd * 0.2 * target.flat, 42, W - 42);
  });

  /* ------------------------------------------------------------- objects */
  terraces.forEach((t) => {
    t.img = scene.add.image(t.x, M.Y(400), 'gl-shelf-' + t.wTex).setOrigin(0.5, 14 / 78).setDepth(6)
      .setScale(SS).setTint([0xd8c0b4, 0xe8cfae, 0xcbb2a8, 0xdcc6b8][t.i % 4]);
    if (t.hasShelter) {
      t.shelterImg = scene.add.image(t.shelterX, M.Y(400), 'gl-shelter').setOrigin(0.5, 0.84).setDepth(8)
        .setScale(0.62 * SS).setFlipX(t.dir > 0).setVisible(false);
    }
    if (t.chimney) {
      t.chimneyImg = scene.add.image(t.chimney.x, M.Y(400), 'gl-chimney').setOrigin(0.5, 0.98).setDepth(5)
        .setScale(0.66 * SS).setFlipX(t.dir < 0).setVisible(false);
    }
  });
  pads.forEach((pad) => {
    pad.img = scene.add.image(pad.x, M.Y(400), 'gl-pad').setOrigin(0.5, 18 / 54).setDepth(7)
      .setScale(0.5 * SS).setVisible(false);
  });

  const leftWall = scene.add.tileSprite(0, 0, 168, M.H, 'gl-wall').setOrigin(0, 0).setDepth(2).setAlpha(0.96);
  const rightWall = scene.add.tileSprite(W - 168, 0, 168, M.H, 'gl-wall').setOrigin(0, 0).setDepth(2)
    .setAlpha(0.96).setFlipX(true);
  const rimBand = scene.add.rectangle(0, 0, W, 26, col('#f2a44a'), 0.5).setOrigin(0, 1).setDepth(5).setVisible(false);

  const sig = scene.add.graphics().setDepth(9);
  const glowG = scene.add.graphics().setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
  const waterG = scene.add.graphics().setDepth(11);
  const player = scene.add.image(p.x, M.Y(340), 'gl-keeper-wait').setOrigin(0.5, 122 / 128).setDepth(16)
    .setScale(0.82 * K);
  const halo = scene.add.image(p.x, M.Y(340), 'arc-glow').setDepth(15).setScale(0.7 * K).setAlpha(0.18)
    .setTint(motes).setBlendMode(Phaser.BlendModes.ADD);
  const veil = scene.add.rectangle(0, 0, W, M.H, col('#241a1c'), 0).setOrigin(0, 0).setDepth(28);

  const plumeP = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 130, max: 320 }, angle: { min: 252, max: 288 },
    lifespan: { min: 520, max: 1000 }, scale: { start: 0.85, end: 0 },
    alpha: { start: 0.72, end: 0 }, tint: [0xfff0d4, motes], gravityY: -180, emitting: false
  }).setDepth(14);
  const steamP = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 18, max: 60 }, angle: { min: 245, max: 295 },
    lifespan: { min: 700, max: 1300 }, scale: { start: 0.4, end: 0 },
    alpha: { start: 0.34, end: 0 }, tint: mist, gravityY: -40, emitting: false
  }).setDepth(13);
  const dustP = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 40, max: 170 }, angle: { min: 190, max: 350 },
    lifespan: { min: 260, max: 520 }, scale: { start: 0.5, end: 0 },
    alpha: { start: 0.6, end: 0 }, tint: 0xd8b48c, gravityY: 260, emitting: false
  }).setDepth(15);
  const splashP = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 90, max: 300 }, angle: { min: 225, max: 315 },
    lifespan: { min: 380, max: 760 }, scale: { start: 0.6, end: 0 },
    alpha: { start: 0.85, end: 0 }, tint: [0xe8cfae, accent], gravityY: 620, emitting: false
  }).setDepth(17);
  const sparkP = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 60, max: 240 }, lifespan: 520, scale: { start: 0.5, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0xffae5e, gravityY: 320, emitting: false
  }).setDepth(15);
  const ashP = scene.add.particles(0, 0, 'gl-ash', {
    x: { min: -20, max: W + 20 }, y: { min: -40, max: 40 },
    speedX: { min: -26, max: 26 }, speedY: { min: 60, max: 170 },
    lifespan: { min: 2600, max: 5200 }, scale: { start: 0.9, end: 0.3 },
    alpha: { start: 0.55, end: 0 }, rotate: { min: 0, max: 360 },
    frequency: 34, quantity: 1
  }).setDepth(27);
  ashP.visible = false;

  const view = (h) => 540 - (h - st.camH);
  const vy = (h) => M.Y(view(h));
  const waterH = () => Math.max(st.flood, st.refH - 152);

  /* --------------------------------------------------------------- input */
  let steerKey = 0, dragging = false, moved = false, downX = 0;
  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', up: 'UP', down: 'DOWN',
    w: 'W', s: 'S', space: 'SPACE'
  });

  const near = (a, b, d) => Math.abs(a - b) <= d;
  const edgeX = (t) => Math.max(14, t.flat - 13);
  const onPlate = (t, x) => clamp(x, t.x - edgeX(t), t.x + edgeX(t));
  function padUnder() {
    const t = terraces[st.at];
    let best = null, bd = 30;
    for (let i = 0; i < t.pads.length; i++) {
      const d = Math.abs(t.pads[i].x - p.x);
      if (d < bd) { bd = d; best = t.pads[i]; }
    }
    return best;
  }
  // the vent is one fixed jet vector: inside the erupting window it is the whole
  // arc, outside it the spurt is weaker in height and reach alike
  const powerFor = (pad) => (pad.erupt
    ? 1
    : pad.fill > 0.06 ? 0.22 + 0.42 * pad.fill : 0);

  function ride(which) {
    if (st.over || st.mode !== 'ground') return;
    if (st.shelter) { setShelter(false); return; }
    const pad = which || padUnder();
    if (!pad) { scene.sfx('tick'); scene.notice(LINES.noVent, 1200); return; }
    const f = powerFor(pad);
    if (f <= 0) {
      scene.sfx('tick');
      steamP.emitParticleAt(pad.x, vy(pad.h), 3);
      scene.notice(LINES.cold, 1300);
      return;
    }
    const clean = pad.erupt;
    const top = clean && pad.left > pad.E * 0.45;
    const s = f * (st.ash > 0 ? 0.58 : 1);
    const apex = pad.apex * s * s;
    const v0 = Math.sqrt(2 * GRAV * apex);
    p.h = pad.h;
    p.vx = pad.vxRef * s;
    p.vh = v0;
    st.mode = 'fly';
    st.peak = 0;
    st.launchH = pad.h;
    st.launchPad = pad.id;
    st.walkTo = null;
    st.last = { apex: Math.round(apex), full: Math.round(pad.apex), gain: 0, short: true, pad: pad.id, clean, peak: 0, from: pad.terrace, to: pad.to };
    scene.sfx(clean ? 'chime' : 'jump');
    scene.sfx('whoosh');
    plumeP.emitParticleAt(pad.x, vy(pad.h), clean ? 20 : 12);
    scene.burst(pad.x, vy(pad.h) - 4, 0xffe4c8, clean ? 14 : 8, { life: 620, gravity: -40 });
    if (top) scene.popText(pad.x, vy(pad.h) - 54 * M.band, 'top of the breath', '#ffe6a8');
    else if (clean) scene.popText(pad.x, vy(pad.h) - 54 * M.band, 'clean', '#ffe6a8');
    else if (st.ash > 0) {
      scene.popText(pad.x, vy(pad.h) - 54 * M.band, 'smothered', '#c9b2a4');
      scene.notice(LINES.smothered, 1600);
    }
    scene.shake(clean ? 150 : 90, 0.005);
  }

  function setShelter(on) {
    if (st.mode !== 'ground') return;
    st.shelter = on;
    p.pose = on ? 'crouch' : 'wait';
    st.walkTo = null;
    scene.sfx(on ? 'land' : 'tick');
    scene.notice(on ? LINES.shelter : LINES.out, 1300);
  }

  function startClimb() {
    const t = terraces[st.at];
    if (!t.chimney || st.mode !== 'ground' || st.shelter) return;
    if (!near(p.x, t.chimney.x, 30)) { st.walkTo = t.chimney.x; return; }
    st.mode = 'climb';
    st.climb.t = 0;
    st.climb.fx = p.x; st.climb.fh = t.h;
    st.climb.tx = t.chimney.landX; st.climb.th = terraces[t.chimney.to].h;
    st.climb.from = t.i; st.climb.to = t.chimney.to;
    scene.sfx('whoosh');
    scene.notice(LINES.climb, 1500);
  }

  function tapAt(px) {
    if (st.over) return;
    if (st.shelter) { setShelter(false); return; }
    if (st.mode !== 'ground') return;
    const t = terraces[st.at];
    if (t.hasShelter && near(px, t.shelterX, 34)) {
      if (near(p.x, t.shelterX, 40)) setShelter(true);
      else st.walkTo = t.shelterX;
      return;
    }
    if (t.chimney && near(px, t.chimney.x, 34)) { startClimb(); return; }
    let target = null, bd = 32;
    t.pads.forEach((pad) => { if (Math.abs(pad.x - px) < bd) { bd = Math.abs(pad.x - px); target = pad; } });
    if (target && Math.abs(target.x - p.x) > 22) { st.walkTo = target.x; return; }
    if (!target) { st.walkTo = onPlate(t, px); return; }
    ride(target);
  }

  scene.input.on('pointerdown', (ptr) => { dragging = true; moved = false; downX = ptr.x; tapAt(ptr.x); });
  scene.input.on('pointermove', (ptr) => {
    if (!dragging) return;
    if (Math.abs(ptr.x - downX) > 14) moved = true;
    if (st.mode === 'fly') { st.walkTo = clamp(ptr.x, 30, W - 30); return; }
    if (st.mode !== 'ground' || st.shelter) return;
    st.walkTo = onPlate(terraces[st.at], ptr.x);
  });
  scene.input.on('pointerup', () => { dragging = false; if (moved) st.walkTo = null; });
  scene.input.keyboard.on('keydown-SPACE', () => {
    if (st.shelter) { setShelter(false); return; }
    if (st.mode === 'ground') ride();
  });
  scene.input.keyboard.on('keydown-UP', startClimb);
  scene.input.keyboard.on('keydown-W', startClimb);
  scene.input.keyboard.on('keydown-DOWN', () => {
    if (st.mode !== 'ground') return;
    const t = terraces[st.at];
    if (st.shelter || (t.hasShelter && near(p.x, t.shelterX, 40))) setShelter(!st.shelter);
  });

  /* ------------------------------------------------------------- events */
  function drown() {
    if (st.over || st.invuln > 0) return;
    st.hearts--;
    st.invuln = 1.5;
    st.last.peak = Math.round(st.peak);
    st.last.gain = 0;
    st.last.short = true;
    const wy = vy(waterH());
    scene.sfx('splash'); scene.sfx('hurt');
    scene.shake(320, 0.016);
    scene.cameras.main.flash(260, 60, 30, 34);
    splashP.emitParticleAt(p.x, wy - 6, 22);
    scene.burst(p.x, wy - 8, 0xd8b48c, 14, { life: 700, gravity: 420 });
    scene.popText(p.x, wy - 52 * M.band, 'ash-water', '#ffb1a1');
    if (st.hearts <= 0) { finish(false); return; }
    const back = pads[st.launchPad] || pads[0];
    st.at = back.terrace;
    p.x = back.x; p.h = back.h; p.vx = 0; p.vh = 0;
    st.mode = 'ground'; st.walkTo = null;
    scene.notice(st.hearts === 1 ? LINES.drown + ' — one feather of luck left' : LINES.drown, 2100);
  }

  function scald() {
    if (st.over || st.invuln > 0) return;
    st.hearts--;
    st.heat = 0.32;
    st.invuln = 1.2;
    scene.sfx('hurt');
    scene.shake(240, 0.012);
    scene.burst(p.x, vy(p.h) - 28 * M.band, 0xffb066, 12, { life: 620, gravity: -120 });
    scene.popText(p.x, vy(p.h) - 60 * M.band, 'scalded', '#ffb08a');
    if (st.hearts <= 0) { finish(false); return; }
    scene.notice(LINES.heat, 1900);
  }

  function gainTerrace(i) {
    if (i <= st.best) return false;
    const got = i - st.best;
    st.best = i;
    st.refH = Math.max(st.refH, terraces[i].h);
    scene.sfx('land');
    scene.popText(terraces[i].x, vy(terraces[i].h) - 60 * M.band,
      '+' + got + (got > 1 ? ' terraces' : ' terrace'), '#ffe6a8');
    dustP.emitParticleAt(p.x, vy(terraces[i].h), 8);
    if (got > 1) { scene.sfx('good'); scene.cameras.main.flash(160, 255, 210, 140); }
    if (i >= RIM) finish(true);
    return true;
  }

  function finish(win) {
    if (st.over) return;
    st.over = true;
    st.mode = 'ground';
    scene.finish(win, {
      score: st.best,
      note: st.best >= RIM ? LINES.rim
        : win ? LINES.flooded + ' — ' + st.best + ' of them'
          : st.best + ' terraces, and the caldera keeps the rest'
    });
  }

  function startAsh() {
    st.ash = st.ashLen;
    st.ashEvery = Math.max(16, st.ashEvery - 1.1);
    st.ashLen = Math.min(9.5, st.ashLen + 0.42);
    st.ashT = st.ashEvery + r() * 4;
    ashP.visible = true;
    scene.sfx('boom');
    scene.shake(420, 0.008);
    scene.notice(LINES.ashIn, 2400);
  }

  function endAsh() {
    ashP.visible = false;
    scene.sfx('chime');
    scene.notice(LINES.ashOut, 2100);
  }

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'find a vent and wait' });
  scene.notice(LINES.open, 2900);

  /* -------------------------------------------------------------- update */
  let me = null;

  // headless and low-end devices starve the frame loop to a few frames a second,
  // so the breath is integrated on fixed steps and only drawn once per frame
  function sim(dt) {
    st.time += dt;
    st.invuln = Math.max(0, st.invuln - dt);

    if (st.ash > 0) {
      st.ash -= dt;
      if (st.ash <= 0) { st.ash = 0; endAsh(); }
    } else {
      st.ashT -= dt;
      if (st.ashT <= 0) startAsh();
    }

    st.flood += (8.6 + st.best * 0.19) * dt;
    if (st.flood >= RIM * STEP) { finish(st.best >= STAR[0]); return; }

    me = padUnder();
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      pad.c = (pad.c + dt) % pad.P;
      const eF = pad.E / pad.P;
      const q = pad.c / pad.P;
      pad.fill = q < 0.3 ? 0 : clamp((q - 0.3) / (0.7 - eF), 0, 1);
      pad.erupt = q >= 1 - eF;
      pad.left = pad.erupt ? (1 - q) * pad.P : 0;
      if (pad.erupt) {
        if (!pad.was) {
          pad.was = true;
          if (st.ash <= 0 && view(pad.h) > -40 && view(pad.h) < 600) {
            scene.sfx('whoosh');
            plumeP.emitParticleAt(pad.x, vy(pad.h), 12);
            scene.shake(80, 0.003);
          }
        }
      } else {
        if (pad.fill < 0.08) pad.was = false;
        if (pad.fill === 0) pad.rumbled = false;
      }
      if (pad === me) {
        if (pad.erupt) st.tickN = 0;
        else if (st.ash <= 0 && pad.fill > 0.02) {
          if (!pad.rumbled) { pad.rumbled = true; scene.sfx('drum1'); }
          const want = Math.floor(pad.fill * 5);
          if (want > st.tickN) { st.tickN = want; scene.sfx('tick'); }
          else st.tickN = want;
        }
      }
    }

    steerKey = (keys.right.isDown || keys.d.isDown ? 1 : 0) - (keys.left.isDown || keys.a.isDown ? 1 : 0);
    const t0 = terraces[st.at];

    if (st.mode === 'ground') {
      if (st.shelter) {
        // the lip keeps the ash off you, but it sits on the same terrace: water
        // reaches it just as it reaches you
        st.heat += 0.028 * dt;
        if (p.h <= waterH() && st.invuln <= 0) drown();
        if (st.heat >= 1) scald();
      } else {
        if (steerKey) { p.x += steerKey * 196 * dt; p.face = steerKey; st.walkTo = null; }
        else if (st.walkTo !== null) {
          p.x += clamp(st.walkTo - p.x, -196 * dt, 196 * dt);
          if (Math.abs(st.walkTo - p.x) < 3) st.walkTo = null;
          else p.face = st.walkTo > p.x ? 1 : -1;
        }
        p.x = onPlate(t0, p.x);
        p.pose = 'wait';
        // the steam only lays on while the mountain is shedding it: out of the ash
        // and clear of the water line, the wind off the caldera shakes it off again
        const soak = (st.ash > 0 ? 0.1 : 0) + (p.h - waterH() < 110 ? 0.045 : 0);
        if (soak > 0) st.heat = Math.min(1.15, st.heat + soak * dt);
        else st.heat = Math.max(0, st.heat - 0.08 * dt);
        if (st.heat >= 1) scald();
      }
    } else if (st.mode === 'fly') {
      const air = steerKey || (dragging && st.walkTo !== null ? Math.sign(st.walkTo - p.x) : 0);
      p.vx = clamp(p.vx + air * 210 * dt, -330, 330);
      p.vh -= GRAV * dt;
      const prevH = p.h;
      p.h += p.vh * dt;
      p.x = clamp(p.x + p.vx * dt, 30, W - 30);
      st.peak = Math.max(st.peak, p.h - st.launchH);
      p.face = p.vx >= 0 ? 1 : -1;
      p.pose = p.vh > 60 ? 'ride' : 'fall';
      if (p.vh < 0) {
        for (let i = terraces.length - 1; i >= 0; i--) {
          const t = terraces[i];
          if (t.h > prevH || t.h < p.h) continue;
          if (Math.abs(p.x - t.x) > t.flat - 4) continue;
          const got = Math.max(0, t.i - st.best);
          st.at = t.i;
          p.h = t.h; p.vh = 0; p.vx = 0;
          st.mode = 'ground';
          st.walkTo = null;
          st.refH = Math.max(st.refH, t.h);
          st.last.peak = Math.round(st.peak);
          st.last.gain = got;
          st.last.short = got === 0;
          gainTerrace(t.i);
          if (st.over) return;
          if (got === 0 && p.h <= waterH()) { st.invuln = 0; drown(); }
          break;
        }
      }
      if (st.mode === 'fly' && p.h <= waterH()) drown();
      else if (st.mode === 'fly' && p.h < st.launchH - 30 && Math.random() < dt * 4) {
        steamP.emitParticleAt(p.x, vy(p.h), 1);
      }
    } else if (st.mode === 'climb') {
      const c = st.climb;
      c.t += dt / c.dur;
      const q = clamp(c.t, 0, 1);
      p.x = lerp(c.fx, c.tx, q);
      p.h = lerp(c.fh, c.th, q * q * 0.4 + q * 0.6) + Math.sin(q * Math.PI) * 12;
      p.pose = 'fall';
      st.heat += 0.12 * dt;
      if (st.heat >= 1) scald();
      if (Math.random() < dt * 6) sparkP.emitParticleAt(p.x + (r() - 0.5) * 22, vy(p.h) - 10, 1);
      if (q >= 1) {
        st.mode = 'ground';
        st.at = c.to;
        p.h = terraces[c.to].h;
        st.refH = Math.max(st.refH, p.h);
        st.last = {
          apex: Math.round(p.h - c.fh), full: terraces[c.to].h - c.fh, gain: c.to - c.from,
          short: false, pad: -1, clean: false, peak: Math.round(p.h - c.fh), from: c.from, to: c.to
        };
        gainTerrace(c.to);
        dustP.emitParticleAt(p.x, vy(p.h), 6);
      }
    }

    const camWant = p.h - 200;
    st.camH += (camWant - st.camH) * Math.min(1, dt * (st.mode === 'fly' ? 6.5 : 4));
    if (st.camH < -180) st.camH = -180;

    /* ------------------------------------------------------------ render */
  }

  function draw(time, dt) {
    for (let i = 0; i < terraces.length; i++) {
      const t = terraces[i];
      const v = view(t.h);
      const on = v > -90 && v < 640;
      t.img.setVisible(on);
      if (t.shelterImg) t.shelterImg.setVisible(on);
      if (t.chimneyImg) t.chimneyImg.setVisible(on);
      if (!on) continue;
      const y = vy(t.h);
      t.img.x = t.x; t.img.y = y;
      if (t.shelterImg) {
        t.shelterImg.x = t.shelterX; t.shelterImg.y = y + 2 * M.band;
        t.shelterImg.setAlpha(t.i === st.at ? 1 : 0.82);
      }
      if (t.chimneyImg) {
        t.chimneyImg.x = t.chimney.x;
        t.chimneyImg.y = y - 2 * M.band;
        t.chimneyImg.setAlpha(t.i === st.at ? 1 : 0.7);
      }
      t.img.setAlpha(t.h < waterH() ? 0.5 : 1);
    }
    const rimV = view(RIM * STEP);
    rimBand.setVisible(rimV > -60 && rimV < 640);
    rimBand.y = vy(RIM * STEP);

    sig.clear(); glowG.clear();
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      const v = view(pad.h);
      const on = v > -140 && v < 620;
      pad.img.setVisible(on);
      if (!on) continue;
      pad.img.x = pad.x; pad.img.y = vy(pad.h);
      const dim = st.ash > 0 ? 0.34 : 1;
      const here = pad === me;
      const py = vy(pad.h);
      if (pad.erupt) {
        const k = 1 - pad.left / pad.E;
        const ph = (st.ash > 0 ? 0.4 : 1) * Math.min(pad.apex, 176) * (0.62 + 0.38 * Math.sin(k * Math.PI));
        const top = vy(pad.h + ph);
        const mid = M.Y((v + view(pad.h + ph)) / 2);
        const bw = 21 * SS, tw = 7 * SS;
        const wob = Math.sin(time / 130 + pad.id) * 5 * SS;
        sig.fillStyle(accent, 0.16 * dim);
        sig.fillTriangle(pad.x - bw, py, pad.x + bw, py, pad.x + wob, mid);
        sig.lineStyle(2.4 * SS, 0xfff0d4, 0.55 * dim);
        sig.beginPath();
        sig.moveTo(pad.x - bw, py);
        quad(sig, pad.x - bw, py, pad.x - tw + wob, mid, pad.x + wob * 0.6, top);
        sig.strokePath();
        sig.lineStyle(1.6 * SS, motes, 0.36 * dim);
        sig.beginPath();
        sig.moveTo(pad.x + bw, py);
        quad(sig, pad.x + bw, py, pad.x + tw + wob, mid, pad.x + wob * 0.6, top);
        sig.strokePath();
        sig.lineStyle(1.2 * SS, 0xffe9c8, 0.3 * dim);
        sig.beginPath();
        sig.moveTo(pad.x, py - 3 * M.band);
        quad(sig, pad.x, py - 3 * M.band, pad.x + wob * 0.4, mid, pad.x + wob * 0.5, top);
        sig.strokePath();
        if (Math.random() < dt * 44) plumeP.emitParticleAt(pad.x + (r() - 0.5) * 22, py, 1);
        glowG.fillStyle(motes, 0.3 * dim);
        glowG.fillCircle(pad.x, py - 8 * M.band, 26 * SS);
      } else if (pad.fill > 0.02) {
        const f = pad.fill;
        sig.fillStyle(col('#8fe3e8'), (0.1 + f * 0.5) * dim);
        sig.fillCircle(pad.x, py - 2 * M.band, (5 + f * 8) * SS);
        glowG.fillStyle(accent, (0.08 + f * 0.3) * dim);
        glowG.fillCircle(pad.x, py - 4 * M.band, (14 + f * 15) * SS);
        if (here && st.ash <= 0) {
          const rad = lerp(34, 14, f) * SS;
          sig.lineStyle(2.6 * SS, motes, 0.34 + f * 0.5);
          sig.beginPath();
          for (let a = 0; a <= 20; a++) {
            const an = (a / 20) * TAU - Math.PI / 2;
            const qx = pad.x + Math.cos(an) * rad;
            const qy = py - 11 * M.band + Math.sin(an) * rad * 0.42;
            if (a === 0) sig.moveTo(qx, qy); else sig.lineTo(qx, qy);
          }
          sig.strokePath();
          if (f > 0.74) {
            sig.lineStyle(3 * SS, accent, 0.45 + Math.sin(time / 90) * 0.3);
            sig.strokeCircle(pad.x, py - 11 * M.band, 38 * SS);
          }
        }
        if (Math.random() < dt * (4 + f * 14) * dim) steamP.emitParticleAt(pad.x + (r() - 0.5) * 26, py - 6, 1);
      }
    }

    const wh = waterH();
    const wy = vy(wh);
    waterG.clear();
    if (wy > -30) {
      const wave = (x, t2) => wy + Math.sin(x * 0.017 + t2) * 3.4 * M.band + Math.sin(x * 0.041 - t2 * 0.7) * 1.6 * M.band;
      const t2 = time / 520;
      waterG.fillStyle(col('#3a2622'), 0.92);
      waterG.beginPath();
      waterG.moveTo(0, M.Y(560));
      waterG.lineTo(0, wave(0, t2));
      for (let x = 24; x <= W; x += 24) waterG.lineTo(x, wave(x, t2));
      waterG.lineTo(W, M.Y(560));
      waterG.closePath(); waterG.fill();
      waterG.fillStyle(col('#c45527'), 0.18);
      waterG.beginPath();
      waterG.moveTo(0, wave(0, t2) + 14 * M.band);
      for (let x = 24; x <= W; x += 24) waterG.lineTo(x, wave(x, t2) + 14 * M.band);
      waterG.lineTo(W, M.Y(560)); waterG.lineTo(0, M.Y(560)); waterG.closePath(); waterG.fill();
      waterG.lineStyle(2.2 * SS, motes, 0.34);
      waterG.beginPath();
      for (let x = 0; x <= W; x += 20) { if (x === 0) waterG.moveTo(x, wave(x, t2)); else waterG.lineTo(x, wave(x, t2)); }
      waterG.strokePath();
      for (let k = 0; k < 14; k++) {
        const bx = (k * 173 + time * 0.02) % W;
        waterG.fillStyle(motes, 0.08 + (k % 3) * 0.04);
        waterG.fillCircle(bx, wave(bx, t2) + (7 + (k * 13) % 40) * M.band, (1.6 + (k % 3)) * SS);
      }
      if (Math.random() < dt * 6) steamP.emitParticleAt(r() * W, wy - 4, 1);
    }

    leftWall.tilePositionY = -st.camH * 0.9;
    rightWall.tilePositionY = -st.camH * 0.9;

    player.x = p.x;
    player.y = vy(p.h);
    player.setTexture('gl-keeper-' + p.pose).setFlipX(p.face < 0);
    player.setAngle(st.mode === 'fly' ? clamp(-p.vh / 45, -15, 15) : Math.sin(time / 480) * 1.6);
    player.setAlpha(st.invuln > 0 && Math.floor(time / 70) % 2 ? 0.4 : 1);
    halo.x = p.x;
    halo.y = player.y - 34 * K;
    halo.setAlpha(0.14 + (st.mode === 'fly' ? 0.2 : 0) + (me && me.erupt ? 0.2 : 0));

    veil.setFillStyle(col('#241a1c'), st.ash > 0 ? clamp(st.ash / 1.4, 0, 1) * 0.26 : 0);

    scene.hud({
      score: st.best,
      progress: clamp(st.heat, 0, 1),
      hearts: st.hearts,
      extra: st.shelter ? 'sheltered — the rock is hot'
        : st.ash > 0 ? 'ash falling, vents smothered'
          : st.mode === 'fly' ? 'riding the breath'
            : st.mode === 'climb' ? 'up the chimney'
              : me && me.erupt ? 'the vent is open — now'
                : me && me.fill > 0.55 ? 'filling'
                  : st.best >= STAR[1] ? 'the rim is close'
                    : 'wait for the breath'
    });
    scene.audio.setTension(clamp(0.16 + (st.ash > 0 ? 0.24 : 0) + st.heat * 0.3 +
      (1 - clamp((p.h - wh) / 260, 0, 1)) * 0.3, 0, 1));
  }

  function update(time, delta) {
    if (st.over) return;
    const raw = Math.min(0.05, delta / 1000) * st.clock;
    st.acc += raw;
    let n = 0;
    while (st.acc >= FIX && n < 48) {
      sim(FIX);
      st.acc -= FIX;
      n++;
      if (st.over) { st.acc = 0; break; }
    }
    if (n >= 48) st.acc = 0;
    draw(time, raw);
  }

  /* --------------------------------------------------------------- debug */
  function pagePoint(gx, gy) {
    const rect = scene.game.canvas.getBoundingClientRect();
    return { x: rect.left + (gx / W) * rect.width, y: rect.top + (gy / M.H) * rect.height };
  }

  return {
    update,
    ride,
    state: () => {
      const pad = padUnder();
      return {
        terraces: st.best, best: st.best, at: st.at, hearts: st.hearts,
        time: Number(st.time.toFixed(1)),
        heat: Number(st.heat.toFixed(3)), mode: st.mode, shelter: st.shelter,
        ash: Number(st.ash.toFixed(2)), ashT: Number(st.ashT.toFixed(2)),
        flood: Math.round(st.flood), waterH: Math.round(waterH()),
        x: Math.round(p.x), h: Math.round(p.h), vh: Math.round(p.vh), vx: Math.round(p.vx),
        peak: Math.round(st.peak), camH: Math.round(st.camH), viewY: Math.round(view(p.h)),
        pad: pad ? pad.id : -1, padErupt: pad ? pad.erupt : false,
        padFill: pad ? Number(pad.fill.toFixed(2)) : 0,
        padLeft: pad ? Number(pad.left.toFixed(2)) : 0,
        padApex: pad ? Math.round(pad.apex) : 0,
        padReach: pad ? Math.round(pad.apex * (st.ash > 0 ? 0.58 * 0.58 : 1)) : 0,
        padTo: pad ? pad.to : -1,
        last: st.last, over: st.over, invuln: Number(st.invuln.toFixed(2))
      };
    },
    vents: () => pads.map((pad) => ({
      id: pad.id, terrace: pad.terrace, x: Math.round(pad.x), h: pad.h, to: pad.to,
      aimX: Math.round(pad.aimX), P: Number(pad.P.toFixed(2)), E: Number(pad.E.toFixed(2)),
      phase: Number(pad.c.toFixed(2)), fill: Number(pad.fill.toFixed(2)), erupt: pad.erupt,
      left: Number(pad.left.toFixed(3)), apex: Math.round(pad.apex), viewY: Math.round(view(pad.h))
    })),
    road: () => terraces.map((t) => ({
      i: t.i, x: Math.round(t.x), h: t.h, half: Math.round(t.half), flat: Math.round(t.flat),
      pads: t.pads.map((q) => q.id), chimney: t.chimney ? t.chimney.to : -1,
      chimneyX: t.chimney ? Math.round(t.chimney.x) : 0,
      shelterX: t.hasShelter ? Math.round(t.shelterX) : 0,
      viewY: Math.round(view(t.h))
    })),
    ventScreen: (id) => {
      const pad = pads[clamp(Math.round(Number(id) || 0), 0, pads.length - 1)];
      return pagePoint(pad.x, view(pad.h));
    },
    terraceScreen: (i) => {
      const t = terraces[clamp(Math.round(Number(i) || 0), 0, terraces.length - 1)];
      return pagePoint(t.x, view(t.h));
    },
    standOn: (id) => {
      const pad = pads[clamp(Math.round(Number(id) || 0), 0, pads.length - 1)];
      st.at = pad.terrace; p.x = pad.x; p.h = pad.h; p.vx = 0; p.vh = 0;
      st.mode = 'ground'; st.shelter = false; st.walkTo = null;
      st.refH = Math.max(st.refH, pad.h); st.launchPad = pad.id; st.launchH = pad.h;
      return pad.id;
    },
    tapVent: (id) => {
      const pad = pads[clamp(Math.round(Number(id) || 0), 0, pads.length - 1)];
      tapAt(pad.x);
      return pad.terrace;
    },
    tapAtScreen: (x) => { tapAt(Number(x) || 0); },
    setClock: (v) => { st.clock = clamp(Number(v) || 1, 0.2, 8); },
    setHearts: (v) => { st.hearts = clamp(Math.round(Number(v) || 0), 0, 3); },
    setBest: (v) => {
      st.best = clamp(Math.round(Number(v) || 0), 0, RIM);
      const t = terraces[st.best];
      const pd = t.pads[0];
      st.at = st.best; p.x = pd ? pd.x : t.x; p.h = pd ? pd.h : t.h; p.vx = 0; p.vh = 0;
      st.refH = Math.max(st.refH, t.h); st.mode = 'ground'; st.shelter = false;
      st.launchPad = pd ? pd.id : 0; st.launchH = p.h;
    },
    setHeat: (v) => { st.heat = clamp(Number(v) || 0, 0, 1); },
    setWater: (h) => { st.flood = clamp(Number(h) || 0, 0, RIM * STEP); },
    ashNow: (sec) => { st.ashLen = clamp(Number(sec) || st.ashLen, 2, 14); startAsh(); },
    clearAsh: () => { if (st.ash > 0) { st.ash = 0; endAsh(); } },
    climbUp: () => startClimb(),
    shelterOn: (on) => setShelter(!!on),
    walkTo: (x) => { st.walkTo = Number(x); },
    floodLeft: () => Math.max(0, Math.round((RIM * STEP - st.flood) / Math.max(1, 8.6 + st.best * 0.19)))
  };
}

export default {
  id: 'geyser-leap', unit: 'terraces', stars: STAR, create,
  backdropOpts: { ground: false },
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
