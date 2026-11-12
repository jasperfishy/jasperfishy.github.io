// Bone Bridge — an ice ravine, a swinging rib, and a herd that trusts you.
// Lay the next span before the lead walker runs out of bone.

import { canvasTex, grain, rng, clamp, lerp, W } from '../engine.js';

const LEFT = 150;
const RIGHT = 828;
const BRIDGE_Y = 262;
const CROSS_X = 860;
const RIB_MIN = 55;
const RIB_MAX = 145;
const MAX_RIBS = 12;
const HERD = 6;
const FAR = 900;
const STAR = [2, 4, 6];

function art(scene, M) {
  canvasTex(scene, 'bb-walker', 120, 96, (c) => {
    const rand = rng(431);
    c.fillStyle = 'rgba(6,12,14,0.28)';
    c.beginPath(); c.ellipse(60, 92, 38, 5, 0, 0, Math.PI * 2); c.fill();
    // tail
    c.strokeStyle = '#b3c2bf';
    c.lineWidth = 11;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(36, 56); c.quadraticCurveTo(6, 50, 2, 68); c.stroke();
    // hind legs
    [[44, 66], [58, 68]].forEach(([hx, hy], i) => {
      c.strokeStyle = i ? '#9aa9a6' : '#aebebb';
      c.lineWidth = 8;
      c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx - 2, hy + 16, hx - 6, hy + 24); c.stroke();
      c.strokeStyle = '#e6ead9';
      c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(hx - 6, hy + 24); c.lineTo(hx + 4, hy + 25); c.stroke();
    });
    // front legs
    [[76, 68], [86, 70]].forEach(([hx, hy], i) => {
      c.strokeStyle = i ? '#9aa9a6' : '#b7c6c2';
      c.lineWidth = 7;
      c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + 2, hy + 14, hx - 1, hy + 22); c.stroke();
      c.strokeStyle = '#e6ead9';
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(hx - 1, hy + 22); c.lineTo(hx + 8, hy + 23); c.stroke();
    });
    // body
    const body = c.createLinearGradient(34, 34, 100, 82);
    body.addColorStop(0, '#d3ddd7');
    body.addColorStop(0.55, '#b0c0bc');
    body.addColorStop(1, '#8fa09d');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(64, 58, 38, 21, -0.08, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(238,243,234,0.45)';
    c.beginPath(); c.ellipse(60, 66, 28, 9, -0.1, 0, Math.PI * 2); c.fill();
    // neck + head
    c.strokeStyle = '#c3d0cb';
    c.lineWidth = 13;
    c.beginPath(); c.moveTo(92, 48); c.quadraticCurveTo(106, 28, 108, 18); c.stroke();
    c.fillStyle = '#cfdad5';
    c.beginPath(); c.ellipse(111, 16, 14, 9, 0.15, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#97a8a4';
    c.beginPath();
    c.moveTo(116, 8);
    c.quadraticCurveTo(126, 2, 128, 12);
    c.quadraticCurveTo(120, 14, 116, 14);
    c.closePath(); c.fill();
    c.fillStyle = '#1a2528';
    c.beginPath(); c.arc(118, 15, 2.4, 0, Math.PI * 2); c.fill();
    // feather crest along the spine
    c.fillStyle = 'rgba(126,150,146,0.7)';
    for (let i = 0; i < 5; i++) {
      const x = 52 + i * 9;
      c.beginPath();
      c.moveTo(x, 38 - i * 0.6);
      c.quadraticCurveTo(x + 3, 28, x + 9, 34);
      c.quadraticCurveTo(x + 6, 39, x, 38 - i * 0.6);
      c.fill();
    }
    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(20, 0, 120, 90);
    rim.addColorStop(0, 'rgba(150,205,255,0.2)');
    rim.addColorStop(0.55, 'rgba(150,205,255,0)');
    rim.addColorStop(1, 'rgba(255,196,120,0.14)');
    c.fillStyle = rim; c.fillRect(0, 0, 120, 96);
    c.globalCompositeOperation = 'source-over';
    grain(c, 120, 96, 0.03, 211 + rand() * 8);
  });

  canvasTex(scene, 'bb-rib', 130, 36, (c) => {
    const g = c.createLinearGradient(0, 4, 0, 32);
    g.addColorStop(0, '#f8f4e2');
    g.addColorStop(0.42, '#e8e1c6');
    g.addColorStop(0.78, '#c3bc9e');
    g.addColorStop(1, '#8e8972');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(15, 18, 12, 10, -0.2, 0, Math.PI * 2); c.fill();
    // the shaft bends a little; no bone is ever truly straight
    c.beginPath();
    c.moveTo(22, 12);
    c.quadraticCurveTo(70, 7, 116, 12);
    c.quadraticCurveTo(125, 13, 124, 21);
    c.quadraticCurveTo(70, 28, 23, 24);
    c.quadraticCurveTo(18, 18, 22, 12);
    c.closePath(); c.fill();
    c.beginPath(); c.ellipse(121, 17, 9, 8, 0.25, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,252,235,0.45)';
    c.beginPath(); c.ellipse(70, 10.5, 42, 2.1, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(96,92,74,0.25)';
    c.beginPath(); c.ellipse(70, 22, 40, 2.4, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(96,92,74,0.35)';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(56, 12); c.lineTo(60, 16); c.lineTo(57, 21); c.stroke();
    c.beginPath(); c.moveTo(86, 11); c.lineTo(90, 15); c.stroke();
    c.strokeStyle = 'rgba(255,252,235,0.3)';
    c.beginPath(); c.arc(15, 18, 7.5, 3.5, 5.1); c.stroke();
    grain(c, 130, 36, 0.045, 223);
  });

  canvasTex(scene, 'bb-knob', 44, 44, (c) => {
    const g = c.createRadialGradient(17, 15, 2, 22, 22, 20);
    g.addColorStop(0, '#efe9cf');
    g.addColorStop(0.6, '#d6cfb2');
    g.addColorStop(1, '#9c977e');
    c.fillStyle = g;
    c.beginPath(); c.arc(22, 22, 17, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + 0.4;
      c.beginPath(); c.ellipse(22 + Math.cos(a) * 14, 22 + Math.sin(a) * 14, 5.4, 4.4, a, 0, Math.PI * 2); c.fill();
    }
    // the socket the next rib slots into
    c.fillStyle = '#6d6957';
    c.beginPath(); c.arc(22, 22, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4a473a';
    c.beginPath(); c.arc(22, 23, 6.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,250,230,0.24)';
    c.lineWidth = 1.4;
    c.beginPath(); c.arc(22, 22, 11.5, Math.PI * 1.05, Math.PI * 1.85); c.stroke();
    c.strokeStyle = 'rgba(60,58,48,0.4)';
    c.lineWidth = 1.2;
    c.beginPath(); c.arc(22, 22, 17, 0.2, 2.9); c.stroke();
  });

  const stageH = (M.H - M.top) / M.band + 4;
  const beginStage = (c) => { c.save(); c.translate(0, M.top); c.scale(1, M.band); };
  const endStage = (c) => { c.restore(); };

  canvasTex(scene, 'bb-ravine', W, M.H, (c) => {
    const rand = rng(443);
    beginStage(c);
    const g = c.createLinearGradient(0, 272, 0, 540);
    g.addColorStop(0, 'rgba(22,45,58,0.5)');
    g.addColorStop(0.16, 'rgba(11,26,35,0.88)');
    g.addColorStop(0.52, 'rgba(5,13,19,1)');
    g.addColorStop(1, 'rgba(2,5,8,1)');
    c.fillStyle = g; c.fillRect(0, 272, W, stageH - 272);

    // the far wall of the gorge, lower than either rim
    const wallTop = [];
    let wx = 96;
    while (wx < W - 52) {
      wallTop.push([wx, 302 + rand() * 10]);
      wx += 46 + rand() * 60;
    }
    const wallGrad = c.createLinearGradient(0, 330, 0, stageH);
    wallGrad.addColorStop(0, 'rgba(50,82,98,0.55)');
    wallGrad.addColorStop(0.55, 'rgba(22,44,58,0.5)');
    wallGrad.addColorStop(1, 'rgba(6,14,20,0.55)');
    c.fillStyle = wallGrad;
    c.beginPath();
    c.moveTo(96, 344);
    wallTop.forEach(([x, y]) => c.lineTo(x, y));
    c.lineTo(W - 40, 344);
    c.lineTo(W - 40, stageH);
    c.lineTo(96, stageH);
    c.closePath(); c.fill();

    c.strokeStyle = 'rgba(176,216,234,0.09)';
    c.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const y = 332 + i * 28 + rand() * 8;
      c.beginPath();
      c.moveTo(90, y);
      for (let x = 90; x <= W - 40; x += 90) c.lineTo(x, y + Math.sin(x * 0.014 + i * 1.7) * 7);
      c.stroke();
    }
    // meltwater frozen mid-fall
    for (let i = 0; i < 5; i++) {
      const x = 170 + rand() * 620;
      const top = 300 + rand() * 24;
      const len = 50 + rand() * 110;
      const fg = c.createLinearGradient(0, top, 0, top + len);
      fg.addColorStop(0, 'rgba(196,232,246,0.08)');
      fg.addColorStop(0.35, 'rgba(172,214,234,0.05)');
      fg.addColorStop(1, 'rgba(172,214,234,0)');
      c.fillStyle = fg;
      c.fillRect(x, top, 2 + rand() * 4, len);
    }
    // ledges catching the light
    c.fillStyle = 'rgba(96,136,152,0.14)';
    for (let i = 0; i < 4; i++) {
      const x = 150 + rand() * 640;
      const y = 350 + rand() * 100;
      const w = 50 + rand() * 90;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + w, y + 3 + rand() * 4);
      c.lineTo(x + w * 0.78, y + 6 + rand() * 5);
      c.lineTo(x + 4, y + 5);
      c.closePath(); c.fill();
    }
    // cold mist rising off the floor
    const mg = c.createLinearGradient(0, 392, 0, 486);
    mg.addColorStop(0, 'rgba(150,200,220,0)');
    mg.addColorStop(0.5, 'rgba(150,200,220,0.10)');
    mg.addColorStop(1, 'rgba(150,200,220,0)');
    c.fillStyle = mg; c.fillRect(0, 392, W, 94);
    // the frozen river far below
    const rg = c.createLinearGradient(0, 486, 0, 512);
    rg.addColorStop(0, 'rgba(150,206,232,0)');
    rg.addColorStop(0.6, 'rgba(150,206,232,0.16)');
    rg.addColorStop(1, 'rgba(150,206,232,0)');
    c.fillStyle = rg; c.fillRect(110, 486, W - 220, 26);
    c.strokeStyle = 'rgba(196,234,248,0.16)';
    c.lineWidth = 1.4;
    c.beginPath();
    for (let x = 120; x < W - 110; x += 60) {
      const y = 498 + Math.sin(x * 0.02) * 2;
      if (x === 120) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    endStage(c);
    grain(c, W, M.H, 0.03, 227);
  });

  canvasTex(scene, 'bb-cliffs', W, M.H, (c) => {
    beginStage(c);
    const rim = (side) => {
      const rand = rng(side === 'l' ? 457 : 463);
      const s = side === 'l' ? 1 : -1;
      const x0 = side === 'l' ? 0 : W;
      c.save();
      c.translate(x0, 0);
      c.scale(s, 1);
      const g = c.createLinearGradient(0, 220, 0, 540);
      g.addColorStop(0, '#a9c7d6');
      g.addColorStop(0.18, '#6d90a4');
      g.addColorStop(0.45, '#3d5d70');
      g.addColorStop(1, '#182d3a');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-10, stageH);
      c.lineTo(-10, 250);
      c.lineTo(34, 244);
      c.lineTo(66, 250);
      c.lineTo(96, 242);
      c.lineTo(128, 250);
      c.lineTo(150, 246);
      c.lineTo(166, 264);
      c.lineTo(158, 296);
      c.lineTo(174, 334);
      c.lineTo(232, stageH);
      c.closePath(); c.fill();
      // strata
      c.strokeStyle = 'rgba(226,244,252,0.2)';
      c.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const y = 286 + i * 26;
        c.beginPath();
        c.moveTo(4, y + rand() * 8);
        c.quadraticCurveTo(80, y - 18 + rand() * 20, 150 + i * 6, y + rand() * 12);
        c.stroke();
      }
      // snow cap
      c.fillStyle = '#e8f4fa';
      c.beginPath();
      c.moveTo(-10, 254);
      c.quadraticCurveTo(34, 234, 72, 250);
      c.quadraticCurveTo(104, 234, 132, 248);
      c.quadraticCurveTo(154, 238, 168, 258);
      c.lineTo(168, 272);
      c.quadraticCurveTo(150, 258, 132, 262);
      c.quadraticCurveTo(104, 250, 72, 264);
      c.quadraticCurveTo(34, 250, -10, 268);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(160,198,216,0.6)';
      c.beginPath();
      c.moveTo(-10, 268);
      c.quadraticCurveTo(34, 250, 72, 264);
      c.quadraticCurveTo(104, 250, 132, 262);
      c.quadraticCurveTo(150, 258, 168, 272);
      c.lineTo(168, 278);
      c.quadraticCurveTo(150, 266, 132, 270);
      c.quadraticCurveTo(104, 258, 72, 272);
      c.quadraticCurveTo(34, 258, -10, 276);
      c.closePath(); c.fill();
      // wind-scoured crest
      c.strokeStyle = 'rgba(255,255,255,0.55)';
      c.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) {
        const x = 12 + i * 32 + rand() * 8;
        c.beginPath(); c.moveTo(x, 252 + rand() * 6); c.lineTo(x + 9 + rand() * 10, 251 + rand() * 5); c.stroke();
      }
      // lip shadow, so the rim reads as a ledge and not a wall
      c.fillStyle = 'rgba(10,26,36,0.35)';
      c.beginPath();
      c.moveTo(150, 280);
      c.quadraticCurveTo(160, 292, 166, 296);
      c.lineTo(174, 334);
      c.lineTo(158, 296);
      c.closePath(); c.fill();
      // icicles hanging from the rim
      for (let i = 0; i < 9; i++) {
        const x = 22 + i * 16;
        const len = 8 + rand() * 34;
        c.fillStyle = 'rgba(206,236,248,0.85)';
        c.beginPath();
        c.moveTo(x, 290 + rand() * 10);
        c.lineTo(x + 5, 290);
        c.lineTo(x + 2.5, 290 + len);
        c.closePath(); c.fill();
      }
      // embedded boulders
      for (let i = 0; i < 7; i++) {
        const x = 20 + rand() * 130;
        const y = 336 + rand() * 170;
        c.fillStyle = 'rgba(20,42,54,0.24)';
        c.beginPath(); c.ellipse(x, y, 8 + rand() * 14, 6 + rand() * 9, rand(), 0, Math.PI * 2); c.fill();
      }
      c.restore();
    };
    rim('l');
    rim('r');
    endStage(c);
    grain(c, W, M.H, 0.02, 233);
  });

  canvasTex(scene, 'bb-peaks', W, M.H, (c) => {
    const rand = rng(469);
    beginStage(c);
    const layer = (baseY, minH, maxH, minW, maxW, colTop, colBase) => {
      const pts = [];
      let x = -70;
      while (x < W + 70) {
        const w = minW + rand() * (maxW - minW);
        pts.push({ x: x + w * 0.5, w, h: minH + rand() * (maxH - minH), base: baseY + rand() * 20 });
        x += w;
      }
      const g = c.createLinearGradient(0, baseY - maxH, 0, baseY + 60);
      g.addColorStop(0, colTop);
      g.addColorStop(1, colBase);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-70, baseY + 60);
      pts.forEach((p) => {
        c.lineTo(p.x - p.w * 0.52, p.base);
        c.lineTo(p.x - p.w * 0.12, p.base - p.h * 0.7);
        c.lineTo(p.x, p.base - p.h);
        c.lineTo(p.x + p.w * 0.16, p.base - p.h * 0.62);
        c.lineTo(p.x + p.w * 0.52, p.base);
      });
      c.lineTo(W + 70, baseY + 60);
      c.closePath(); c.fill();
      return pts;
    };
    const far = layer(322, 100, 175, 120, 380, 'rgba(64,98,118,0.95)', 'rgba(116,152,170,0.9)');
    // shaded faces give the peaks form
    c.fillStyle = 'rgba(12,30,42,0.16)';
    far.forEach((p) => {
      c.beginPath();
      c.moveTo(p.x, p.base - p.h);
      c.lineTo(p.x + p.w * 0.16, p.base - p.h * 0.62);
      c.lineTo(p.x + p.w * 0.52, p.base);
      c.lineTo(p.x + p.w * 0.06, p.base);
      c.closePath(); c.fill();
    });
    // snow crests on the far peaks
    c.fillStyle = 'rgba(226,242,250,0.5)';
    far.forEach((p) => {
      const tip = p.base - p.h;
      c.beginPath();
      c.moveTo(p.x, tip);
      c.lineTo(p.x - p.w * 0.07, tip + p.h * 0.13);
      c.lineTo(p.x - p.w * 0.02, tip + p.h * 0.1);
      c.lineTo(p.x + p.w * 0.02, tip + p.h * 0.14);
      c.lineTo(p.x + p.w * 0.07, tip + p.h * 0.11);
      c.lineTo(p.x + p.w * 0.1, tip + p.h * 0.16);
      c.closePath(); c.fill();
    });
    layer(366, 40, 70, 200, 320, 'rgba(34,60,76,0.6)', 'rgba(18,36,48,0.6)');
    endStage(c);
    grain(c, W, M.H, 0.02, 239);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene, M);

  const state = {
    t: 0, ribs: MAX_RIBS, end: LEFT, complete: false, crossed: 0, lost: 0,
    spawned: 0, over: false, dropping: false, dropCD: 0, walkers: [], spans: [],
    spawnTimer: 0, marker: LEFT + 40, markerDir: 1, lead: 0
  };

  scene.add.image(0, 0, 'bb-peaks').setOrigin(0).setDepth(5);
  scene.add.image(0, 0, 'bb-ravine').setOrigin(0).setDepth(8);
  scene.add.image(0, 0, 'bb-cliffs').setOrigin(0).setDepth(12);

  // aurora curtains
  const aurora = [];
  const auroraCols = [0x6fffd0, 0x8fc8ff, 0xb79bff];
  auroraCols.forEach((col, i) => {
    const a = scene.add.rectangle(W / 2, M.Y(90 + i * 46), W * 0.92, 26, col, 0.07)
      .setDepth(3).setBlendMode(Phaser.BlendModes.ADD).setAngle(-3 + i * 2);
    a._ph = i * 2.1;
    aurora.push(a);
  });

  // snow
  scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 0, max: W }, y: { min: M.Y(-20), max: M.Y(240) },
    speedX: { min: -26, max: 12 }, speedY: { min: 24, max: 64 },
    lifespan: { min: 4200, max: 7600 }, scale: { start: 0.45, end: 0.2 },
    alpha: { start: 0.55, end: 0 }, tint: 0xdff3ff, frequency: 90, quantity: 1
  }).setDepth(26);

  scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 120, max: W - 120 }, y: { min: M.Y(300), max: M.Y(340) },
    speedX: { min: -8, max: 8 }, speedY: { min: -10, max: -2 },
    lifespan: { min: 2600, max: 5200 }, scale: { start: 0.3, end: 0 },
    alpha: { start: 0.2, end: 0 }, tint: 0x9fd8ff, frequency: 420, quantity: 1,
    blendMode: 'ADD'
  }).setDepth(10);

  const marks = scene.add.graphics().setDepth(24);

  // the waiting herd on the near rim, bunched under the rig
  const waiters = [];
  const waiterSpots = [
    { x: 2, s: 0.27, tint: 0xf0dfc4, a: 0.86 },
    { x: 26, s: 0.31, tint: 0xffffff, a: 0.95 },
    { x: 50, s: 0.28, tint: 0xdcefe6, a: 0.88 },
    { x: 74, s: 0.3, tint: 0xcfe4ee, a: 0.92 },
    { x: 98, s: 0.26, tint: 0xffffff, a: 0.84 },
    { x: 122, s: 0.29, tint: 0xf0dfc4, a: 0.9 }
  ];
  for (let i = 0; i < HERD; i++) {
    const spot = waiterSpots[i % waiterSpots.length];
    const img = scene.add.image(spot.x, M.Y(BRIDGE_Y + 3), 'bb-walker').setOrigin(0.5, 1)
      .setScale(spot.s * K).setDepth(17).setTint(spot.tint).setAlpha(spot.a);
    waiters.push({ img, ph: i * 0.9, s: spot.s, a: spot.a });
  }

  // anchor joint at the near rim
  scene.add.image(LEFT, M.Y(BRIDGE_Y + 3), 'bb-knob').setScale(0.8 * K).setDepth(16).setTint(0xbfe8ff);
  const endMarker = scene.add.image(LEFT, M.Y(BRIDGE_Y - 22), 'arc-dot').setDepth(23)
    .setScale(0.45 * K).setTint(0xbfe8ff).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);

  const heldRib = scene.add.image(LEFT + 90, M.Y(BRIDGE_Y - 58), 'bb-rib').setDepth(22)
    .setScale(0.62 * K, K).setAlpha(0.95);

  const crane = scene.add.graphics().setDepth(21);

  function addSpan(x) {
    const s = {
      x1: state.end, x2: x, sag: 5, left: null, right: null
    };
    s.left = scene.add.image(0, 0, 'bb-rib').setOrigin(0, 0.5).setDepth(15);
    s.right = scene.add.image(0, 0, 'bb-rib').setOrigin(1, 0.5).setDepth(15);
    scene.add.image(x, M.Y(BRIDGE_Y + 3), 'bb-knob').setScale(0.62 * K).setDepth(16).setTint(0xd8eef8);
    state.spans.push(s);
    state.end = x;
    if (state.end >= RIGHT - 2) {
      state.end = RIGHT;
      completeBridge();
    }
  }

  function completeBridge() {
    if (state.complete) return;
    state.complete = true;
    scene.notice('The far rim. The herd smells it.', 2200);
    scene.sfx('win');
    scene.burst(LEFT + (RIGHT - LEFT) * 0.5, M.Y(BRIDGE_Y - 10), 0xbfe8ff, 22, { life: 800 });
  }

  function spawnWalker() {
    if (state.spawned >= HERD) return;
    state.spawned++;
    const tint = waiterSpots[state.spawned % waiterSpots.length].tint;
    const w = {
      x: 146, bob: rng(state.spawned * 71)(),
      img: scene.add.image(146, M.Y(BRIDGE_Y + 3), 'bb-walker').setOrigin(0.5, 1)
        .setDepth(18).setScale(0.62 * K).setTint(tint),
      alive: true
    };
    scene.burst(146, M.Y(BRIDGE_Y - 8), 0xdff3ff, 8, { life: 500 });
    state.walkers.push(w);
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].img.visible) {
        waiters[i].img.setVisible(false);
        break;
      }
    }
  }

  function loseWalker(w) {
    if (!w.alive) return;
    w.alive = false;
    state.lost++;
    scene.sfx('hurt');
    scene.shake(220, 0.012);
    scene.burst(w.x, M.Y(BRIDGE_Y + 4), 0xbfe8ff, 20, { life: 700, gravity: 260, spin: true });
    scene.popText(clamp(w.x, 80, W - 80), M.Y(BRIDGE_Y - 70), 'the span gives way', '#bfe8ff');
    if (state.lost === 1) scene.notice('A rib slipped. Keep the lead walker on bone.', 2200);
    scene.tweens.add({
      targets: w.img, y: M.Y(BRIDGE_Y + 210), angle: 42, alpha: 0,
      duration: 780, ease: 'quad.in', onComplete: () => w.img.destroy()
    });
  }

  function crossWalker(w) {
    if (!w.alive) return;
    w.alive = false;
    state.crossed++;
    scene.sfx('chime');
    scene.burst(w.x, M.Y(BRIDGE_Y - 20), 0xffd88e, 14, { life: 600, gravity: 90 });
    scene.tweens.add({ targets: w.img, x: w.x + 70, alpha: 0, duration: 620, onComplete: () => w.img.destroy() });
  }

  function resolve(x, free) {
    const zoneL = state.end + RIB_MIN;
    const zoneR = Math.min(state.end + RIB_MAX, RIGHT);
    const good = x >= zoneL - 2 && state.end < RIGHT;
    if (!free) {
      if (good) {
        state.ribs--;
      } else {
        state.ribs--;
        scene.sfx('bad');
        scene.shake(160, 0.008);
        scene.popText(clamp(x, 80, W - 80), M.Y(BRIDGE_Y - 64), 'too short', '#9fb4c8');
      }
    }
    if (good) {
      const landing = Math.min(RIGHT, x);
      addSpan(landing);
      scene.sfx('good');
      scene.shake(90, 0.004);
      scene.burst(landing, M.Y(BRIDGE_Y + 2), 0xdff3ff, 12, { life: 520, gravity: 130 });
      scene.popText(clamp(landing, 80, W - 80), M.Y(BRIDGE_Y - 52), 'span holds', '#ffe0a8');
    } else {
      // the loose rib tumbles into the ravine
      scene.burst(clamp(x, 40, W - 40), M.Y(BRIDGE_Y - 8), 0x9fb4c8, 8, { life: 600, gravity: 320, spin: true });
    }
    state.dropCD = 0.3;
    state.dropping = false;
  }

  let falling = null;
  function drop() {
    if (state.over || state.dropping || state.dropCD > 0) return;
    if (state.ribs <= 0) {
      scene.sfx('bad');
      return;
    }
    const x = state.marker;
    state.dropping = true;
    scene.sfx('whoosh');
    falling = scene.add.image(x, M.Y(BRIDGE_Y - 58), 'bb-rib').setDepth(23)
      .setScale(0.62 * K, K).setAngle(-12);
    falling._x = x;
    scene.tweens.add({
      targets: falling, y: M.Y(BRIDGE_Y), angle: 4, duration: 240, ease: 'quad.in',
      onComplete: () => {
        falling.destroy();
        falling = null;
        resolve(x);
      }
    });
  }

  scene.input.on('pointerdown', drop);
  scene.input.keyboard.on('keydown-SPACE', drop);
  scene.input.keyboard.on('keydown-UP', drop);
  scene.input.keyboard.on('keydown-W', drop);

  function leadWalker() {
    let lead = null;
    state.walkers.forEach((w) => { if (w.alive && (!lead || w.x > lead.x)) lead = w; });
    return lead;
  }

  function bridgeYAt(x) {
    for (const s of state.spans) {
      if (x >= s.x1 && x <= s.x2) {
        const t = (x - s.x1) / Math.max(1, s.x2 - s.x1);
        return BRIDGE_Y + s.sag * Math.sin(Math.PI * t);
      }
    }
    return BRIDGE_Y;
  }

  scene.hud({ score: 0, progress: 0, extra: MAX_RIBS + ' ribs' });
  scene.notice('Set the rib when it hangs over the pale span.', 3200);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.t += dt;
    state.dropCD = Math.max(0, state.dropCD - dt);

    // sweep the drop marker ahead of the bridge end
    const sweepL = state.end + 12;
    const sweepR = Math.min(state.end + 210, RIGHT);
    const span = Math.max(20, sweepR - sweepL);
    const ph = time / 1000 * 1.9;
    state.marker = sweepL + (0.5 + 0.5 * Math.sin(ph)) * span;
    if (state.complete) state.marker = RIGHT;

    // hold the rib under the crane arm
    heldRib.setVisible(!state.dropping && !state.complete && state.ribs > 0);
    if (heldRib.visible) {
      heldRib.x = state.marker;
      heldRib.y = M.Y(BRIDGE_Y - 58) + Math.sin(time / 260) * 2.5;
      heldRib.setScale(0.62 * K, K);
      heldRib.angle = Math.sin(time / 300) * 6;
    }
    endMarker.x = state.end;
    endMarker.y = M.Y(BRIDGE_Y - 22) + Math.sin(time / 380) * 2;
    endMarker.setAlpha(0.7 + Math.sin(time / 300) * 0.2);

    // the cable crane: a tripod on the near rim, a mast on the far rim,
    // and a trolley that rides the cable to carry each rib over the gap
    crane.clear();
    if (!state.complete && state.ribs > 0) {
      const apex = { x: 118, y: M.Y(BRIDGE_Y - 176) };
      const mastX = 930;
      const farBase = M.Y(BRIDGE_Y + 4);
      const rigBase = M.Y(BRIDGE_Y + 6);
      const legs = [[86, rigBase], [150, rigBase], [104, M.Y(BRIDGE_Y + 2)]];
      crane.lineStyle(6, 0x2f2218, 1);
      legs.forEach(([lx, ly]) => { crane.beginPath(); crane.moveTo(lx, ly); crane.lineTo(apex.x, apex.y + 2); crane.strokePath(); });
      crane.lineStyle(2, 0x6f5840, 0.9);
      legs.forEach(([lx, ly]) => { crane.beginPath(); crane.moveTo(lx - 1.6, ly); crane.lineTo(apex.x - 1.6, apex.y + 2); crane.strokePath(); });
      crane.lineStyle(3, 0x3e2e22, 0.95);
      crane.beginPath();
      crane.moveTo(96, M.Y(BRIDGE_Y - 58)); crane.lineTo(140, M.Y(BRIDGE_Y - 88));
      crane.moveTo(140, M.Y(BRIDGE_Y - 58)); crane.lineTo(98, M.Y(BRIDGE_Y - 88));
      crane.strokePath();
      crane.lineStyle(1.6, 0xc8b98e, 0.7);
      for (let i = 0; i < 3; i++) {
        crane.beginPath(); crane.moveTo(apex.x - 6, apex.y + 4 + i * 3); crane.lineTo(apex.x + 6, apex.y + 5 + i * 3); crane.strokePath();
      }
      // the far mast and its stay
      crane.lineStyle(5, 0x2f2218, 1);
      crane.beginPath(); crane.moveTo(mastX, farBase); crane.lineTo(mastX - 2, apex.y); crane.strokePath();
      crane.lineStyle(2, 0x6f5840, 0.9);
      crane.beginPath(); crane.moveTo(mastX - 1.6, farBase); crane.lineTo(mastX - 3.6, apex.y); crane.strokePath();
      crane.lineStyle(4, 0x2f2218, 1);
      crane.beginPath(); crane.moveTo(mastX - 12, apex.y + 5); crane.lineTo(mastX + 10, apex.y + 5); crane.strokePath();
      crane.lineStyle(1.4, 0xccd9d6, 0.45);
      crane.beginPath(); crane.moveTo(mastX - 2, apex.y + 6); crane.lineTo(mastX + 40, farBase); crane.strokePath();
      // cable between the two tops
      const cablePt = (t) => ({ x: apex.x + (mastX - 2 - apex.x) * t, y: apex.y + Math.sin(Math.PI * t) * 16 });
      crane.lineStyle(2, 0xccd9d6, 0.55);
      crane.beginPath();
      for (let s = 0; s <= 16; s++) {
        const p = cablePt(s / 16);
        if (s === 0) crane.moveTo(p.x, p.y); else crane.lineTo(p.x, p.y);
      }
      crane.strokePath();
      // trolley and the plumb rope
      const tt = clamp((state.marker - apex.x) / (mastX - 2 - apex.x), 0.02, 0.98);
      const trolley = cablePt(tt);
      const hookY = M.Y(BRIDGE_Y - 84);
      crane.lineStyle(1.4, 0xccd9d6, 0.7);
      crane.beginPath(); crane.moveTo(trolley.x, trolley.y + 3); crane.lineTo(state.marker, hookY); crane.strokePath();
      crane.fillStyle(0x2f2218, 1);
      crane.fillRoundedRect(trolley.x - 8, trolley.y - 5, 16, 10, 3);
      crane.fillStyle(0xc8b98e, 1);
      crane.fillCircle(trolley.x - 4, trolley.y, 2.2);
      crane.fillCircle(trolley.x + 4, trolley.y, 2.2);
      crane.fillStyle(0xd8d2b6, 0.9);
      crane.fillCircle(state.marker, hookY, 3.2);
      // the pale span where a rib will hold
      const zL = state.end + RIB_MIN;
      const zR = Math.min(state.end + RIB_MAX, RIGHT);
      if (state.end < RIGHT) {
        const gy = M.Y(BRIDGE_Y);
        crane.fillStyle(0xbfe8ff, 0.12);
        crane.fillRoundedRect(zL, gy - 5 * K, zR - zL, 10 * K, 5 * K);
        crane.lineStyle(1.7, 0x9fe6ff, 0.55);
        crane.strokeRoundedRect(zL, gy - 5 * K, zR - zL, 10 * K, 5 * K);
        crane.lineStyle(1.6, 0xbfe8ff, 0.5);
        crane.beginPath();
        crane.moveTo(zL, gy - 9 * K); crane.lineTo(zL, gy + 9 * K);
        crane.moveTo(zR, gy - 9 * K); crane.lineTo(zR, gy + 9 * K);
        crane.strokePath();
      }
      crane.lineStyle(1.3, 0xffd88e, 0.38);
      crane.beginPath(); crane.moveTo(state.marker, M.Y(BRIDGE_Y - 52)); crane.lineTo(state.marker, M.Y(BRIDGE_Y - 6)); crane.strokePath();
    }

    // update spans and their sag
    state.spans.forEach((s, i) => {
      let on = false;
      state.walkers.forEach((w) => { if (w.alive && w.x > s.x1 - 10 && w.x < s.x2 + 10) on = true; });
      const target = 5 + (on ? 8 : 0) + Math.sin(time / 420 + i) * 1.4;
      s.sag = lerp(s.sag, target, dt * 6);
      const half = (s.x2 - s.x1) / 2;
      const len = Math.sqrt(half * half + s.sag * s.sag);
      const a = Math.atan2(s.sag, half);
      s.left.x = s.x1; s.left.y = M.Y(BRIDGE_Y);
      s.left.setScale((len / 130) * 0.98, 0.62 * K);
      s.left.setAngle(a * 180 / Math.PI);
      s.right.x = s.x2; s.right.y = M.Y(BRIDGE_Y);
      s.right.setScale((len / 130) * 0.98, 0.62 * K);
      s.right.setAngle(-a * 180 / Math.PI);
      s.left.setVisible(true); s.right.setVisible(true);
      s.left.setDepth(15); s.right.setDepth(15);
    });

    // walkers
    state.spawnTimer += dt;
    const interval = state.complete ? 0.3 : 3.1;
    if (!state.over && state.spawned < HERD && state.spawnTimer > (state.spawned === 0 ? 2.4 : interval) && (state.complete || state.end > LEFT + 10)) {
      state.spawnTimer = 0;
      spawnWalker();
    }
    state.walkers.forEach((w) => {
      if (!w.alive) return;
      const speed = state.complete ? 124 : 66;
      w.x += speed * dt;
      w.bob += dt * 7;
      if (!state.complete && w.x > state.end - 4) {
        loseWalker(w);
        return;
      }
      if (state.complete && w.x > CROSS_X) {
        crossWalker(w);
        return;
      }
      const gy = bridgeYAt(w.x);
      w.img.x = w.x;
      w.img.y = M.Y(gy + 3) + Math.abs(Math.sin(w.bob)) * -2;
      w.img.setScale(0.62 * K);
      w.img.setAngle(Math.sin(w.bob * 0.6) * 1.4);
    });
    state.walkers = state.walkers.filter((w) => w.alive);

    // herd idles on the near rim
    waiters.forEach((q, i) => {
      if (!q.img.visible) return;
      q.ph += dt;
      q.img.y = M.Y(BRIDGE_Y + 3) + Math.sin(q.ph * 2.2) * 1.2;
      q.img.setScale(q.s * K);
      q.img.setAlpha(q.a + Math.sin(q.ph * 1.7) * 0.07);
    });

    // aurora drift
    aurora.forEach((a, i) => {
      a.alpha = 0.05 + Math.sin(time / 2600 + a._ph) * 0.025;
      a.x = W / 2 + Math.sin(time / 5200 + a._ph) * 40;
    });

    // tension rises as the lead walker nears the bone end
    const lead = leadWalker();
    state.lead = lead ? lead.x : 0;
    if (!state.complete) {
      const gap = lead ? state.end - lead.x : 999;
      const tension = clamp(1 - gap / 150, 0, 1) * 0.9;
      scene.audio.setTension(tension);
    } else {
      scene.audio.setTension(0.2);
    }

    const done = state.crossed + state.lost >= HERD && state.walkers.length === 0;
    const stranded = state.ribs <= 0 && !state.complete && state.walkers.length === 0 && state.spawned < HERD;
    if (done || stranded) {
      state.over = true;
      scene.finish(state.crossed > 0, {
        score: state.crossed,
        note: state.crossed >= HERD
          ? 'all six crossed on bone and nerve'
          : stranded
            ? `the ribs ran out with ${state.crossed} of 6 across`
            : `${state.crossed} of 6 crossed the ravine`
      });
      return;
    }

    scene.hud({
      score: state.crossed,
      progress: clamp((state.end - LEFT) / (RIGHT - LEFT), 0, 1),
      extra: state.complete ? 'the bridge holds' : `${state.ribs} ribs`
    });
  }

  return {
    update,
    state: () => ({
      ribs: state.ribs, end: Math.round(state.end), complete: state.complete,
      crossed: state.crossed, lost: state.lost, spawned: state.spawned,
      walkers: state.walkers.map((w) => ({ x: Math.round(w.x), alive: w.alive })),
      spans: state.spans.length, over: state.over, marker: Math.round(state.marker),
      lead: Math.round(state.lead), dropping: state.dropping
    }),
    setRibs: (n) => { state.ribs = n; },
    dropAt: (x) => { if (state.over) return; resolve(clamp(x, LEFT + 1, RIGHT), false); },
    forceBridge: () => {
      while (state.end < RIGHT - 2) {
        const step = Math.min(RIGHT - state.end, RIB_MIN + 24);
        addSpan(state.end + step);
      }
    },
    spawnWalker: () => spawnWalker(),
    clearWalkers: () => { state.walkers.forEach((w) => w.img.destroy()); state.walkers.length = 0; }
  };
}

export default {
  id: 'bone-bridge', unit: 'crossed', stars: STAR, mood: 'ice',
  backdropOpts: { ground: false, ridges: false },
  create,
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
