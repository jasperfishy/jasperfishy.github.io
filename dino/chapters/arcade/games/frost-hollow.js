// Frost Hollow — the frost line walks the hollow at noon.
// Everything small must be inside a warm shadow when the white arrives.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-1c099b1be40dab88';

const STAR = [9, 16, 25];
const TOP = 336;
const BOTTOM = 504;
const MIDY = (TOP + BOTTOM) / 2;

const ROUNDS = [
  { hatch: 8, speed: 46, drain: 1.0, meter: 1.0, wind: 12, collapse: 0.62 },
  { hatch: 9, speed: 58, drain: 1.3, meter: 0.96, wind: 166, collapse: 0.54 },
  { hatch: 10, speed: 72, drain: 1.6, meter: 0.92, wind: -24, collapse: 0.48 }
];

const KINDS = {
  rock: { cap: 2, len: 150, half: 44, tex: 'fh-rock', off: 26 },
  boulder: { cap: 3, len: 180, half: 52, tex: 'fh-boulder', off: 30 },
  trunk: { cap: 4, len: 216, half: 60, tex: 'fh-trunk', off: 34 }
};

const PROPS = [
  [['rock', 152, 372], ['trunk', 432, 414], ['boulder', 730, 368], ['rock', 872, 434], ['rock', 268, 484]],
  [['boulder', 208, 396], ['rock', 528, 364], ['trunk', 762, 450], ['rock', 352, 482]],
  [['trunk', 176, 442], ['boulder', 524, 398], ['rock', 762, 356], ['rock', 888, 472]]
];

const hexNum = (hex) => Phaser.Display.Color.HexStringToColor(hex).color;

function art(scene) {
  [0, 1].forEach((frame) => {
    canvasTex(scene, 'fh-mother-' + frame, 200, 152, (c) => {
      const bob = frame ? 0 : -3;
      c.lineCap = 'round';

      c.strokeStyle = '#27444f';
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(96, 106 + bob); c.lineTo(frame ? 82 : 92, 142);
      c.stroke();
      c.beginPath();
      c.moveTo(88, 144); c.lineTo(78, 148); c.moveTo(88, 144); c.lineTo(96, 149);
      c.stroke();

      const body = c.createLinearGradient(56, 40, 150, 118);
      body.addColorStop(0, '#7fa3b8');
      body.addColorStop(0.55, '#4e7691');
      body.addColorStop(1, '#2c4c62');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(102, 82 + bob, 48, 29, -0.06, 0, Math.PI * 2); c.fill();

      c.strokeStyle = 'rgba(10,26,34,0.4)';
      c.lineWidth = 2.4;
      for (let i = 0; i < 5; i++) {
        const x = 70 + i * 14;
        c.beginPath();
        c.moveTo(x, 58 + bob + (i % 2) * 3);
        c.quadraticCurveTo(x + 6, 68 + bob, x + 2, 78 + bob);
        c.stroke();
      }

      c.fillStyle = 'rgba(228,244,248,0.5)';
      c.beginPath(); c.ellipse(108, 96 + bob, 32, 11, -0.04, 0, Math.PI * 2); c.fill();

      c.strokeStyle = '#3a607a';
      c.lineWidth = 12;
      c.beginPath();
      c.moveTo(60, 76 + bob);
      c.quadraticCurveTo(34, 66 + bob, 18, 48 + bob);
      c.stroke();
      c.fillStyle = '#5d849c';
      c.beginPath();
      c.moveTo(20, 48 + bob); c.lineTo(2, 34 + bob); c.lineTo(6, 52 + bob); c.lineTo(24, 60 + bob);
      c.closePath(); c.fill();

      const wing = c.createLinearGradient(86, 66, 128, 100);
      wing.addColorStop(0, '#628ba3');
      wing.addColorStop(1, '#31566e');
      c.fillStyle = wing;
      c.beginPath(); c.ellipse(102, 84 + bob, 25, 14, 0.18, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(14,32,42,0.5)';
      c.lineWidth = 2;
      c.stroke();

      c.strokeStyle = '#5c8497';
      c.lineWidth = 14;
      c.beginPath();
      c.moveTo(136, 68 + bob);
      c.quadraticCurveTo(156, 54 + bob, 166, 42 + bob);
      c.stroke();

      c.fillStyle = '#7ba1b4';
      c.beginPath(); c.ellipse(174, 38 + bob, 16, 12, -0.18, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8dcb8';
      c.beginPath();
      c.moveTo(188, 36 + bob); c.lineTo(200, 41 + bob); c.lineTo(188, 46 + bob);
      c.closePath(); c.fill();

      c.strokeStyle = '#ffb56b';
      c.lineWidth = 3.4;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(168 - i * 5, 28 + bob);
        c.quadraticCurveTo(158 - i * 7, 16 + bob, 148 - i * 8, 14 + bob + i * 3);
        c.stroke();
      }

      c.fillStyle = '#f4fbff';
      c.beginPath(); c.arc(180, 35 + bob, 4.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#10262a';
      c.beginPath(); c.arc(181.4, 35.4 + bob, 2.1, 0, Math.PI * 2); c.fill();

      c.strokeStyle = '#2c4c5c';
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(112, 104 + bob); c.lineTo(frame ? 130 : 118, 142);
      c.stroke();
      c.beginPath();
      c.moveTo(frame ? 130 : 118, 144); c.lineTo(frame ? 142 : 128, 149);
      c.moveTo(frame ? 130 : 118, 144); c.lineTo(frame ? 124 : 114, 150);
      c.stroke();

      grain(c, 200, 152, 0.028, 61 + frame);
    });
  });

  const HATCH = [['#d8ecf4', '#7ea6ba'], ['#f6e8c6', '#c8a266'], ['#eccdb2', '#a67a5c']];
  ['a', 'b', 'c'].forEach((key, ki) => {
    canvasTex(scene, 'fh-hatch-' + key, 60, 52, (c) => {
      const pal = HATCH[ki];
      c.lineCap = 'round';
      const g = c.createLinearGradient(14, 10, 46, 44);
      g.addColorStop(0, pal[0]);
      g.addColorStop(1, pal[1]);
      c.fillStyle = g;
      c.beginPath(); c.ellipse(28, 30, 16, 13, 0, 0, Math.PI * 2); c.fill();

      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (0.15 + i * 0.28);
        c.beginPath();
        c.moveTo(28 + Math.cos(a) * 13, 30 + Math.sin(a) * 10);
        c.lineTo(28 + Math.cos(a) * 17, 30 + Math.sin(a) * 14);
        c.stroke();
      }

      c.fillStyle = pal[1];
      c.beginPath();
      c.moveTo(13, 28); c.lineTo(3, 21); c.lineTo(6, 32);
      c.closePath(); c.fill();

      c.fillStyle = pal[0];
      c.beginPath(); c.ellipse(42, 20, 9.6, 8.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f0c98a';
      c.beginPath();
      c.moveTo(50, 19); c.lineTo(58, 22); c.lineTo(50, 24);
      c.closePath(); c.fill();
      c.fillStyle = '#10262a';
      c.beginPath(); c.arc(44.6, 18.6, 1.9, 0, Math.PI * 2); c.fill();

      c.strokeStyle = '#c89a5e';
      c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(24, 42); c.lineTo(22, 49); c.stroke();
      c.beginPath(); c.moveTo(33, 42); c.lineTo(35, 49); c.stroke();

      grain(c, 60, 52, 0.03, 83 + ki);
    });
  });

  canvasTex(scene, 'fh-rock', 120, 92, (c) => {
    const g = c.createLinearGradient(14, 8, 106, 84);
    g.addColorStop(0, '#7c96a4');
    g.addColorStop(0.6, '#4a6675');
    g.addColorStop(1, '#263a47');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(8, 88); c.quadraticCurveTo(2, 50, 30, 28);
    c.quadraticCurveTo(62, 6, 94, 26);
    c.quadraticCurveTo(118, 44, 112, 88);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(236,248,252,0.82)';
    c.beginPath();
    c.moveTo(24, 32); c.quadraticCurveTo(56, 8, 96, 27);
    c.quadraticCurveTo(70, 34, 52, 40); c.quadraticCurveTo(36, 42, 24, 32);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(12,26,34,0.4)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(40, 52); c.lineTo(56, 74); c.stroke();
    c.beginPath(); c.moveTo(74, 44); c.lineTo(84, 66); c.stroke();
    grain(c, 120, 92, 0.045, 13);
  });

  canvasTex(scene, 'fh-boulder', 150, 116, (c) => {
    const g = c.createLinearGradient(16, 10, 134, 108);
    g.addColorStop(0, '#8aa2ae');
    g.addColorStop(0.55, '#54707e');
    g.addColorStop(1, '#20323d');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(10, 112); c.quadraticCurveTo(0, 58, 36, 26);
    c.quadraticCurveTo(78, -2, 118, 30);
    c.quadraticCurveTo(150, 58, 140, 112);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(214,236,244,0.18)';
    c.beginPath(); c.ellipse(56, 46, 30, 14, -0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(238,250,254,0.88)';
    c.beginPath();
    c.moveTo(30, 30); c.quadraticCurveTo(74, 2, 122, 32);
    c.quadraticCurveTo(86, 40, 62, 44); c.quadraticCurveTo(42, 46, 30, 30);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(10,24,32,0.42)';
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(52, 62); c.lineTo(66, 94); c.stroke();
    c.beginPath(); c.moveTo(96, 54); c.lineTo(104, 88); c.stroke();
    grain(c, 150, 116, 0.05, 17);
  });

  canvasTex(scene, 'fh-trunk', 230, 104, (c) => {
    const g = c.createLinearGradient(6, 24, 224, 92);
    g.addColorStop(0, '#7a6047');
    g.addColorStop(0.5, '#57422e');
    g.addColorStop(1, '#2e2116');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(12, 40);
    c.quadraticCurveTo(90, 20, 206, 32);
    c.quadraticCurveTo(226, 40, 220, 62);
    c.quadraticCurveTo(120, 92, 16, 74);
    c.quadraticCurveTo(2, 56, 12, 40);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(24,16,10,0.4)';
    c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const y = 40 + i * 7;
      c.beginPath();
      c.moveTo(22, y);
      c.quadraticCurveTo(110, y - 6 + (i % 2) * 4, 208, y - 2);
      c.stroke();
    }
    c.fillStyle = '#a58663';
    c.beginPath(); c.ellipse(214, 47, 9, 15, 0.1, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#6d5238';
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(214, 47, 5, 9, 0.1, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#4a3826';
    c.lineWidth = 7;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(120, 34); c.lineTo(146, 12); c.stroke();
    c.fillStyle = 'rgba(238,250,254,0.85)';
    c.beginPath();
    c.moveTo(24, 36); c.quadraticCurveTo(96, 14, 196, 28);
    c.quadraticCurveTo(110, 34, 60, 42); c.quadraticCurveTo(38, 44, 24, 36);
    c.closePath(); c.fill();
    grain(c, 230, 104, 0.05, 23);
  });

  canvasTex(scene, 'fh-shadow', 340, 210, (c) => {
    c.beginPath();
    c.moveTo(10, 105);
    c.bezierCurveTo(84, 26, 236, 30, 312, 105);
    c.bezierCurveTo(236, 180, 84, 184, 10, 105);
    c.closePath();
    const g = c.createRadialGradient(150, 105, 10, 150, 105, 178);
    g.addColorStop(0, 'rgba(255,197,122,0.55)');
    g.addColorStop(0.5, 'rgba(255,172,96,0.26)');
    g.addColorStop(1, 'rgba(255,150,80,0)');
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = 'rgba(255,214,150,0.32)';
    c.lineWidth = 3;
    c.stroke();
    c.strokeStyle = 'rgba(255,226,178,0.14)';
    c.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(24, 105);
      c.bezierCurveTo(90 + i * 18, 52 + i * 12, 210 - i * 12, 60 + i * 14, 296 - i * 16, 105);
      c.stroke();
    }
  });

  canvasTex(scene, 'fh-front', 150, 560, (c) => {
    const rand = rng(40217);
    const g = c.createLinearGradient(0, 0, 150, 0);
    g.addColorStop(0, 'rgba(233,246,250,0)');
    g.addColorStop(0.45, 'rgba(233,246,250,0.34)');
    g.addColorStop(0.86, 'rgba(244,252,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0.96)');
    c.fillStyle = g;
    c.fillRect(0, 0, 150, 560);
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const x = 30 + rand() * 100;
      const y = rand() * 560;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 8 + rand() * 10, y + 22 + rand() * 30);
      c.stroke();
    }
    c.fillStyle = 'rgba(252,255,255,0.95)';
    for (let y = 6; y < 560; y += 42) {
      const h = 16 + rand() * 22;
      c.beginPath();
      c.moveTo(150, y);
      c.lineTo(126 - rand() * 12, y + h * 0.5);
      c.lineTo(150, y + h);
      c.closePath(); c.fill();
    }
    grain(c, 150, 560, 0.02, 71);
  });

  canvasTex(scene, 'fh-frozen', 240, 560, (c) => {
    const rand = rng(51491);
    c.fillStyle = 'rgba(228,243,248,0.62)';
    c.fillRect(0, 0, 240, 560);
    c.strokeStyle = 'rgba(255,255,255,0.34)';
    c.lineWidth = 1.6;
    for (let i = 0; i < 46; i++) {
      const x = rand() * 240;
      const y = rand() * 560;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 14 + rand() * 18, y + 8 + rand() * 14);
      c.moveTo(x, y);
      c.lineTo(x - 10 - rand() * 12, y + 12 + rand() * 12);
      c.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const x = rand() * 240;
      const y = rand() * 560;
      const s = 14 + rand() * 22;
      c.strokeStyle = 'rgba(190,226,238,0.4)';
      c.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const px = x + Math.cos(a) * s;
        const py = y + Math.sin(a) * s * 0.7;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath(); c.stroke();
    }
    grain(c, 240, 560, 0.03, 91);
  });

  canvasTex(scene, 'fh-drift', 240, 80, (c) => {
    const g = c.createLinearGradient(0, 6, 0, 80);
    g.addColorStop(0, '#f6fcff');
    g.addColorStop(1, '#b9d4de');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(4, 80);
    c.quadraticCurveTo(20, 30, 78, 22);
    c.quadraticCurveTo(150, 12, 196, 38);
    c.quadraticCurveTo(228, 52, 236, 80);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(140,178,192,0.5)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(30, 62);
    c.quadraticCurveTo(110, 46, 200, 62);
    c.stroke();
    grain(c, 240, 80, 0.03, 33);
  });

  canvasTex(scene, 'fh-crest', 64, 120, (c) => {
    const g = c.createLinearGradient(0, 110, 0, 0);
    g.addColorStop(0, 'rgba(255,226,178,0.5)');
    g.addColorStop(0.6, 'rgba(255,187,110,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0.95)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(32, 0);
    c.quadraticCurveTo(48, 34, 44, 66);
    c.quadraticCurveTo(40, 100, 32, 118);
    c.quadraticCurveTo(24, 100, 20, 66);
    c.quadraticCurveTo(16, 34, 32, 0);
    c.closePath(); c.fill();
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene);
  const r = rng(11209);
  const bandY = (M.Y(540) - M.Y(0)) / 540;
  const warmNum = hexNum(MOODS.ice.accent);

  const state = {
    round: 0, score: 0, hearts: 3, meter: 1, over: false, phase: 'play', phaseT: 0,
    t: 0, wind: (ROUNDS[0].wind * Math.PI) / 180, windBase: (ROUNDS[0].wind * Math.PI) / 180,
    sway: 0, swayT: 2, frontX: -180, frontDir: 1, collapseDone: false,
    freezeFront: false, freezeMeter: false, zoneSeq: 0, resolved: 0, pending: 0
  };
  const mother = { x: 140, y: 470, tx: 140, ty: 470, px: 140, py: 470, speed: 0, face: 1, step: 0 };
  const zones = [];
  const hatch = [];
  const props = [];
  let calling = false;
  let pointerHeld = false;

  const frozen = scene.add.image(0, M.Y(0), 'fh-frozen')
    .setOrigin(1, 0).setDepth(28).setVisible(false);
  const frontEdge = scene.add.image(0, M.Y(270), 'fh-front').setOrigin(1, 0.5).setDepth(29);
  frontEdge.setDisplaySize(150, M.Y(540) - M.Y(0));
  const frontGlow = scene.add.rectangle(0, M.Y(270), 5, M.Y(540) - M.Y(0), 0xffffff, 0.8)
    .setDepth(30).setBlendMode(Phaser.BlendModes.ADD);

  scene.add.image(120, M.Y(524), 'fh-drift').setOrigin(0.5, 1).setDepth(7).setScale(1.3 * K).setAlpha(0.9);
  scene.add.image(660, M.Y(530), 'fh-drift').setOrigin(0.5, 1).setDepth(7).setScale(1.7 * K).setAlpha(0.85);
  scene.add.image(940, M.Y(520), 'fh-drift').setOrigin(0.5, 1).setDepth(7).setScale(1.05 * K).setAlpha(0.8);

  const snow = scene.add.particles(0, 0, 'arc-dot', {
    speedX: { min: -26, max: -70 }, speedY: { min: 12, max: 42 },
    lifespan: { min: 2600, max: 4600 }, scale: { start: 0.3, end: 0.12 },
    alpha: { start: 0.55, end: 0.1 }, tint: 0xeef8fd, quantity: 2, frequency: 90,
    emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, M.Y(-20), W + 120, 60) }
  }).setDepth(33);
  scene.events.once('shutdown', () => snow.destroy());

  const steps = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 12, max: 44 }, angle: { min: 200, max: 340 },
    lifespan: 420, scale: { start: 0.32, end: 0.02 }, alpha: { start: 0.6, end: 0 },
    tint: 0xf2fbff, emitting: false
  }).setDepth(24);
  const breath = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 14, max: 40 }, angle: { min: -50, max: 10 },
    lifespan: 900, scale: { start: 0.4, end: 0.04 }, alpha: { start: 0.45, end: 0 },
    tint: 0xe6f7ff, emitting: false
  }).setDepth(25);
  scene.events.once('shutdown', () => { steps.destroy(); breath.destroy(); });

  function buildRound(n) {
    if (n >= ROUNDS.length) {
      endRun(true);
      return;
    }
    state.round = n;
    const cfg = ROUNDS[n];
    state.phase = 'play';
    state.phaseT = 0;
    state.collapseDone = false;
    state.resolved = 0;
    state.pending = cfg.hatch;
    state.frontDir = n % 2 === 0 ? 1 : -1;
    state.frontX = state.frontDir > 0 ? -180 : W + 180;
    state.windBase = (cfg.wind * Math.PI) / 180;
    state.wind = state.windBase;
    state.meter = cfg.meter;

    frontEdge.setFlipX(state.frontDir < 0);
    frozen.setOrigin(state.frontDir > 0 ? 1 : 0, 0);

    for (const z of zones) {
      z.overlay.destroy();
      z.glow.destroy();
      if (z.motes) z.motes.destroy();
    }
    zones.length = 0;
    for (const p of props) p.img.destroy();
    props.length = 0;
    for (const h of hatch) h.img.destroy();
    hatch.length = 0;

    let doomedRock = -1;
    const rockIdx = [];
    PROPS[n].forEach((spec, i) => { if (spec[0] === 'rock') rockIdx.push(i); });
    if (rockIdx.length) doomedRock = rockIdx[rockIdx.length - 1];

    PROPS[n].forEach((spec, i) => {
      const kind = KINDS[spec[0]];
      const img = scene.add.image(spec[1], M.Y(spec[2]), kind.tex)
        .setOrigin(0.5, 0.92).setDepth(12 + spec[2] / 500).setScale(K);
      props.push({ img, doomed: i === doomedRock });
      const z = {
        id: 'z' + state.zoneSeq++,
        kind: spec[0], px: spec[1], py: spec[2],
        cap: kind.cap, len: kind.len, half: kind.half, off: kind.off,
        taken: 0, alive: true, doomed: i === doomedRock,
        wx: Math.cos(state.wind), wy: Math.sin(state.wind) * 0.55,
        cx: spec[1], cy: spec[2], fullT: 0,
        overlay: scene.add.image(spec[1], M.Y(spec[2]), 'fh-shadow')
          .setOrigin(0.04, 0.5).setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setScale(K),
        glow: scene.add.image(spec[1], M.Y(spec[2]), 'arc-glow')
          .setDepth(11).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8 * K)
      };
      z.motes = scene.add.particles(0, 0, 'arc-dot', {
        speed: { min: 6, max: 18 }, angle: { min: 230, max: 310 },
        lifespan: 1400, scale: { start: 0.22, end: 0.02 }, alpha: { start: 0.5, end: 0 },
        tint: warmNum, quantity: 1, frequency: 240,
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-z.half, -24, z.half * 2, 48) }
      }).setDepth(12);
      zones.push(z);
    });

    for (let i = 0; i < cfg.hatch; i++) addHatch(i, cfg.hatch, n);

    mother.x = mother.tx = state.frontDir > 0 ? 130 : W - 130;
    mother.y = mother.ty = 486;
    mother.px = mother.x;
    mother.py = mother.y;
    mother.speed = 0;
    calling = false;

    if (n === 0) {
      scene.notice('noon in the hollow — the frost walks, and the shadows are the whole plan', 2600);
    } else {
      scene.notice("the wind has turned — yesterday's rock is dead air now", 2200);
      scene.sfx('whoosh');
    }
  }

  function addHatch(i, total, round) {
    const variant = ['a', 'b', 'c'][i % 3];
    const spread = (i + 0.5) / total;
    const x = clamp(180 + spread * (W - 320) + (r() - 0.5) * 90, 120, W - 90);
    const y = clamp(TOP + 22 + r() * (BOTTOM - TOP - 52), TOP, BOTTOM);
    const img = scene.add.image(x, M.Y(y), 'fh-hatch-' + variant)
      .setOrigin(0.5, 0.88).setDepth(14 + y / 900).setScale((0.95 + r() * 0.2) * K);
    hatch.push({
      img, variant, x, y, homeX: x, homeY: y, panic: 0, zone: null,
      state: 'calm', face: r() < 0.5 ? -1 : 1, ph: r() * 6.28, step: r() * 2,
      boltT: 0, vx: 0, vy: 0, hop: 0
    });
  }

  function endRun(win, reason) {
    if (state.over) return;
    state.over = true;
    scene.finish(win, {
      score: state.score,
      note: win
        ? 'the hollow keeps its ' + state.score + ' warm hearts until thaw'
        : (reason || 'the white reached the last little one first')
    });
  }

  function updateZones() {
    for (const z of zones) {
      z.wx = Math.cos(state.wind);
      z.wy = Math.sin(state.wind) * 0.55;
      z.cx = z.px + z.wx * z.len * 0.52;
      z.cy = z.py + z.wy * z.len * 0.52;
      z.overlay.x = z.px + z.wx * z.off;
      z.overlay.y = M.Y(z.py + z.wy * z.off);
      z.overlay.rotation = Math.atan2(z.wy, z.wx);
      const sc = K * clamp(z.len / 320, 0.55, 1.05);
      z.overlay.setDisplaySize(340 * sc, 210 * sc * 0.86);
      if (z.motes) z.motes.setPosition(z.cx, M.Y(z.cy));
      const warm = z.alive ? 0.07 + Math.min(z.taken, z.cap) * 0.09 + Math.sin(state.t * 2.6) * 0.02 : 0;
      z.glow.setPosition(z.cx, M.Y(z.cy));
      z.glow.setAlpha(warm);
      z.glow.setScale((0.6 + z.cap * 0.14) * K * (1 + Math.sin(state.t * 2.2) * 0.04));
    }
  }

  function shelterOf(hx, hy, z) {
    if (!z.alive) return null;
    const dx = hx - (z.px + z.wx * z.off);
    const dy = hy - (z.py + z.wy * z.off);
    const along = dx * z.wx + dy * z.wy;
    if (along < -10 || along > z.len) return null;
    const lat = Math.abs(-dx * z.wy + dy * z.wx);
    const width = z.half * (0.5 + 0.5 * clamp(along / (z.len * 0.6), 0, 1));
    if (lat > width) return null;
    return along;
  }

  function assignZone(h) {
    for (const z of zones) {
      if (!z.alive || z.taken >= z.cap) {
        if (z.taken >= z.cap && shelterOf(h.x, h.y, z) !== null && state.t - z.fullT > 2) {
          z.fullT = state.t;
          scene.popText(z.cx, M.Y(z.cy - 34), 'shadow full', '#cfe9f2');
          scene.sfx('tick');
        }
        continue;
      }
      if (shelterOf(h.x, h.y, z) !== null) {
        if (h.zone) h.zone.taken = Math.max(0, h.zone.taken - 1);
        h.zone = z;
        z.taken++;
        h.state = 'shelter';
        return true;
      }
    }
    return false;
  }

  function unassign(h) {
    if (h.zone) h.zone.taken = Math.max(0, h.zone.taken - 1);
    h.zone = null;
  }

  function bolt(h, side) {
    const mdx = h.x - mother.x;
    const mdy = h.y - mother.y;
    const md = Math.max(1, Math.hypot(mdx, mdy));
    const ux = mdx / md;
    const uy = mdy / md;
    const perp = side * -uy;
    const perpv = side * ux;
    const sp = 190 + 130 * h.panic;
    h.vx = (perp * 0.78 + ux * 0.42) * sp;
    h.vy = (perpv * 0.78 + uy * 0.42) * sp * 0.6;
    h.state = 'bolt';
    h.boltT = 0.42 + r() * 0.5;
    unassign(h);
    if (h.panic > 0.9) scene.popText(h.x, M.Y(h.y - 34), 'spooked', '#cfe9f2');
  }

  function resolveFront(h) {
    if (h.resolved || state.over) return;
    h.resolved = true;
    state.resolved++;
    if (h.state === 'shelter' && h.zone && h.zone.alive) {
      state.score++;
      scene.sfx('pick');
      scene.burst(h.x, M.Y(h.y), 0xffcf8a, 10, { life: 520 });
      scene.popText(h.x, M.Y(h.y - 30), '+1 warmed', '#ffd9a0');
      h.state = 'warmed';
      scene.tweens.add({ targets: h.img, scaleY: h.img.scaleY * 0.7, scaleX: h.img.scaleX * 0.86, alpha: 0.5, duration: 420 });
    } else {
      unassign(h);
      state.hearts = Math.max(0, state.hearts - 1);
      h.state = 'lost';
      scene.sfx('hurt');
      scene.shake(240, 0.012);
      scene.cameras.main.flash(180, 190, 230, 255);
      scene.burst(h.x, M.Y(h.y), 0xe6f9ff, 18, { life: 700, spin: true, scale: 0.5 });
      scene.popText(h.x, M.Y(h.y - 34), 'one lost', '#bfe9ff');
      scene.tweens.add({ targets: h.img, alpha: 0, scale: 0.2, duration: 460, onComplete: () => h.img.destroy() });
      if (state.hearts <= 0) {
        endRun(false, 'the hollow goes quiet, one warm body at a time');
        return;
      }
      scene.notice('the white takes ' + (h.variant === 'b' ? 'the cream one' : 'a little one') + ' — keep them off the open ground', 1800);
    }
  }

  function collapseZone(z) {
    state.collapseDone = true;
    z.alive = false;
    const idx = zones.indexOf(z);
    const p = idx >= 0 ? props[idx] : null;
    if (p) {
      scene.tweens.add({ targets: p.img, rotation: 0.16, y: p.img.y + 10 * K, duration: 620, ease: 'bounce.out' });
      p.img.setTint(0x9fb6c2);
    }
    scene.tweens.add({ targets: z.overlay, alpha: 0.06, duration: 700 });
    if (z.motes) z.motes.destroy();
    z.motes = null;
    scene.sfx('boom');
    scene.shake(320, 0.014);
    scene.burst(z.px, M.Y(z.py), 0xffffff, 26, { life: 900, gravity: 200, scale: 0.8 });
    scene.popText(z.px, M.Y(z.py - 60), 'the snow takes it', '#cfe9f2');
    scene.notice('the little rock goes under its own snow — find them a new shadow', 2200);
    for (const h of hatch) {
      if (h.resolved) continue;
      if (h.zone === z) {
        unassign(h);
        h.panic = Math.max(h.panic, 0.85);
        bolt(h, h.face);
      }
    }
  }

  function updateMother(dt) {
    const easeRate = calling ? 2.4 : 5.0;
    const k = 1 - Math.exp(-dt * easeRate);
    mother.x += (mother.tx - mother.x) * k;
    mother.y += (mother.ty - mother.y) * k;
    const dx = mother.x - mother.px;
    const dy = mother.y - mother.py;
    const inst = clamp(Math.hypot(dx, dy) / Math.max(0.001, dt), 0, 1500);
    mother.speed = Math.max(inst, mother.speed * Math.exp(-dt * 4));
    mother.px = mother.x;
    mother.py = mother.y;
    if (Math.abs(dx) > 0.4) mother.face = dx > 0 ? 1 : -1;
    if (mother.speed > 30) mother.step += dt * (2.6 + mother.speed * 0.008);
  }

  function updateHatchlings(dt, time) {
    for (const h of hatch) {
      if (h.resolved) continue;
      const mdx = h.x - mother.x;
      const mdy = h.y - mother.y;
      const md = Math.hypot(mdx, mdy);

      h.startleCd = Math.max(0, (h.startleCd || 0) - dt);
      if (mother.speed > 165 && md < 92 && !calling) {
        h.panic += (mother.speed - 165) * 0.0034 * (1 - md / 92) * dt;
        if (mother.speed > 820 && md < 84 && h.startleCd <= 0) {
          h.startleCd = 0.3;
          h.panic += 0.42;
        }
      }
      if (md < 38 && mother.speed > 62) h.panic += 0.5 * dt;
      const calm = calling && md < 250 ? 0.85 : 0.3;
      h.panic = clamp(h.panic - calm * dt, 0, 1.2);

      if (h.panic >= 0.62 && h.state !== 'bolt') {
        h.face = r() < 0.5 ? -1 : 1;
        bolt(h, h.face);
      }

      if (h.state === 'bolt') {
        h.boltT -= dt;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.vx *= Math.exp(-dt * 2.4);
        h.vy *= Math.exp(-dt * 2.4);
        if (h.boltT <= 0) h.state = 'calm';
      } else if (h.state === 'calm') {
        const pull = calling && md < 300 ? 0.9 : md < 220 && mother.speed < 150 ? 0.5 : 0;
        if (pull > 0 && md > 60) {
          h.x -= (mdx / md) * pull * 46 * dt;
          h.y -= (mdy / md) * pull * 46 * dt;
        } else {
          h.x += Math.sin(time / 1300 + h.ph) * 7 * dt + (h.homeX - h.x) * dt * 0.12;
          h.y += Math.cos(time / 1700 + h.ph) * 5 * dt + (h.homeY - h.y) * dt * 0.12;
        }
        assignZone(h);
      } else if (h.state === 'follow') {
        const slotA = mother.face > 0 ? Math.PI + (h.ph - 3.14) * 0.36 : (h.ph - 3.14) * 0.36;
        const dist = 66 + ((h.ph * 10) % 3) * 28;
        const tx = mother.x + Math.cos(slotA) * dist;
        const ty = mother.y + Math.sin(slotA) * dist * 0.5;
        const d = Math.max(1, Math.hypot(tx - h.x, ty - h.y));
        const sp = 170 * (1 - h.panic * 0.4);
        h.x += ((tx - h.x) / d) * sp * dt;
        h.y += ((ty - h.y) / d) * sp * dt;
        if (!calling || md > 430 || h.panic > 0.62) h.state = 'calm';
      } else if (h.state === 'shelter') {
        if (h.zone && (!h.zone.alive || shelterOf(h.x, h.y, h.zone) === null)) {
          h.grace = (h.grace || 0) + dt;
          if (h.grace > 1.1) {
            unassign(h);
            h.state = 'calm';
            h.grace = 0;
            h.panic = Math.max(h.panic, 0.5);
          }
        } else h.grace = 0;
      }

      if (h.state !== 'shelter') {
        if (calling && md < 320 && h.state === 'calm' && h.panic < 0.45) h.state = 'follow';
      } else if (h.zone && h.zone.taken > h.zone.cap) {
        unassign(h);
        h.state = 'calm';
      }

      if (md > 14) h.face = mdx > 0 ? 1 : -1;
      h.x = clamp(h.x, 26, W - 26);
      h.y = clamp(h.y, TOP, BOTTOM);
      h.step += dt * (h.state === 'bolt' ? 9 : h.state === 'follow' ? 6 : 1.4);

      const bob = h.state === 'shelter' ? Math.sin(time / 420 + h.ph) * 1.2
        : Math.abs(Math.sin(h.step * 3)) * (h.state === 'bolt' ? 4.6 : 2.2);
      h.img.setPosition(h.x, M.Y(h.y) - bob);
      h.img.setFlipX(h.face < 0);
      h.img.setDepth(14 + h.y / 900);
      h.img.setAngle(h.state === 'bolt' ? Math.sin(h.step * 10) * 8 : 0);
    }
  }

  function updateFront(dt) {
    const cfg = ROUNDS[state.round];
    if (!state.freezeFront) state.frontX += state.frontDir * cfg.speed * dt;
    const span = W + 360;
    const progress = state.frontDir > 0
      ? (state.frontX + 180) / span
      : (W + 180 - state.frontX) / span;

    const ex = clamp(state.frontX, -40, W + 40);
    for (const h of hatch) {
      if (h.resolved) continue;
      const caught = state.frontDir > 0 ? h.x < ex : h.x > ex;
      if (caught) resolveFront(h);
    }

    if (!state.collapseDone) {
      const doomed = zones.find((z) => z.doomed);
      if (doomed && progress > cfg.collapse && state.pending > state.resolved) collapseZone(doomed);
    }

    frontEdge.setPosition(ex, M.Y(270));
    frontGlow.setPosition(ex, M.Y(270));
    const cover = state.frontDir > 0 ? ex : W - ex;
    frozen.setVisible(cover > 8);
    if (cover > 8) {
      frozen.setPosition(ex, M.Y(0));
      frozen.setDisplaySize(cover, M.Y(540) - M.Y(0));
      frozen.alpha = 0.65 + progress * 0.3;
    }
    const closeness = clamp(progress * 1.3, 0, 1);
    frontGlow.setAlpha(0.5 + closeness * 0.4);
    frontEdge.setScale(clamp(0.6 + closeness * 0.5, 0.6, 1.15), 1);

    const done = state.frontDir > 0 ? state.frontX > W + 210 : state.frontX < -210;
    if (done || state.resolved >= state.pending) {
      if (state.over) return;
      for (const h of hatch) if (!h.resolved) resolveFront(h);
      state.pending = state.resolved;
      state.phase = 'between';
      state.phaseT = 1.5;
      if (state.round + 1 < ROUNDS.length && !state.over) {
        scene.sfx('good');
        scene.notice(state.score + ' warmed so far — the wind shifts before the next walk', 2000);
      }
    }
  }

  function updateMeter(dt) {
    if (state.freezeMeter) return;
    let outside = 0;
    for (const h of hatch) if (!h.resolved && h.state !== 'shelter') outside++;
    if (outside > 0) state.meter -= (0.004 + outside * 0.0115) * ROUNDS[state.round].drain * dt;
    else state.meter = Math.min(1, state.meter + 0.05 * dt);
    if (state.meter <= 0) {
      state.meter = 0;
      scene.sfx('bad');
      scene.cameras.main.flash(400, 120, 170, 200);
      endRun(false, 'the hollow gives up its last warmth with nobody to thank');
    }
    return outside;
  }

  const keys = scene.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    w: 'W', a: 'A', s: 'S', d: 'D', space: 'SPACE', shift: 'SHIFT'
  });

  scene.input.on('pointermove', (p) => {
    mother.tx = clamp(p.x, 30, W - 30);
    mother.ty = clamp(scene.uY(p.y), TOP, BOTTOM);
  });
  scene.input.on('pointerdown', (p) => {
    pointerHeld = true;
    mother.tx = clamp(p.x, 30, W - 30);
    mother.ty = clamp(scene.uY(p.y), TOP, BOTTOM);
  });
  scene.input.on('pointerup', () => { pointerHeld = false; });
  scene.input.on('pointerupoutside', () => { pointerHeld = false; });

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'stay slow, stay warm' });

  buildRound(0);

  let footT = 0;

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.t += dt;
    calling = pointerHeld || keys.space.isDown || keys.shift.isDown;

    if (state.phase === 'between') {
      state.phaseT -= dt;
      if (state.phaseT <= 0) buildRound(state.round + 1);
      scene.hud({
        score: state.score,
        progress: clamp(state.meter, 0, 1),
        hearts: state.hearts,
        extra: 'the frost turns the corner'
      });
      return;
    }

    const drive = 320 * dt;
    if (keys.left.isDown || keys.a.isDown) mother.tx -= drive;
    if (keys.right.isDown || keys.d.isDown) mother.tx += drive;
    if (keys.up.isDown || keys.w.isDown) mother.ty -= drive * 0.6;
    if (keys.down.isDown || keys.s.isDown) mother.ty += drive * 0.6;
    mother.tx = clamp(mother.tx, 30, W - 30);
    mother.ty = clamp(mother.ty, TOP, BOTTOM);

    state.swayT -= dt;
    if (state.swayT <= 0) {
      state.swayT = 2.6 + r() * 3.4;
      state.sway = (r() - 0.5) * 0.3;
    }
    const windGoal = state.windBase + state.sway;
    state.wind += (windGoal - state.wind) * Math.min(1, dt * 1.6);

    updateMother(dt);
    updateZones();
    updateHatchlings(dt, time);
    updateFront(dt);
    if (state.over) return;
    const outside = updateMeter(dt);
    if (state.over) return;

    mother.img = mother.img || scene.add.image(mother.x, M.Y(mother.y), 'fh-mother-0')
      .setOrigin(0.5, 0.94).setDepth(16).setScale(1.15 * K);
    const mi = mother.img;
    mi.setPosition(mother.x, M.Y(mother.y));
    mi.setFlipX(mother.face < 0);
    mi.setTexture(mother.speed > 26 && Math.floor(mother.step * 4) % 2 ? 'fh-mother-1' : 'fh-mother-0');

    footT -= dt;
    if (footT <= 0 && mother.speed > 40) {
      footT = 0.22;
      steps.emitParticleAt(mother.x - mother.face * 14, M.Y(mother.y) - 2, 2);
    }
    const progress = state.frontDir > 0
      ? (state.frontX + 180) / (W + 360)
      : (W + 180 - state.frontX) / (W + 360);
    if (Math.random() < dt * (1.1 + progress * 3.4)) {
      breath.emitParticleAt(mother.x + mother.face * 44 * K, M.Y(mother.y) - 58 * K, 1);
    }

    scene.hud({
      score: state.score,
      progress: clamp(state.meter, 0, 1),
      hearts: state.hearts,
      extra: calling ? 'call them close' : outside > 0 ? outside + ' out in the cold' : 'all in shadow'
    });
    scene.audio.setTension(clamp(progress * 0.7 + (outside > 3 ? 0.2 : 0) + (state.hearts < 3 ? 0.15 : 0), 0, 1));
  }

  return {
    update,
    state: () => ({
      round: state.round,
      score: state.score,
      hearts: state.hearts,
      meter: Number(state.meter.toFixed(2)),
      frontX: Math.round(state.frontX),
      frontDir: state.frontDir,
      windDeg: Math.round((state.wind * 180) / Math.PI),
      phase: state.phase,
      over: state.over,
      calling,
      mother: { x: Math.round(mother.x), y: Math.round(mother.y), speed: Math.round(mother.speed) },
      zones: zones.map((z, i) => ({
        i, id: z.id, kind: z.kind, cap: z.cap, taken: z.taken, alive: z.alive, doomed: z.doomed,
        cx: Math.round(z.cx), cy: Math.round(z.cy)
      })),
      hatch: hatch.map((h, i) => ({
        i, x: Math.round(h.x), y: Math.round(h.y), panic: Number(clamp(h.panic, 0, 1).toFixed(2)),
        zone: h.zone ? h.zone.id : null, state: h.state, resolved: !!h.resolved,
        dist: Math.round(Math.hypot(h.x - mother.x, h.y - mother.y))
      }))
    }),
    moveTo(x, y) {
      mother.tx = clamp(x, 30, W - 30);
      mother.ty = clamp(y, TOP, BOTTOM);
      mother.x = mother.tx;
      mother.y = mother.ty;
    },
    hold(on) { pointerHeld = !!on; },
    aim(x, y) {
      mother.tx = clamp(x, 30, W - 30);
      mother.ty = clamp(y, TOP, BOTTOM);
    },
    spawnBatch(n) {
      for (let i = 0; i < n; i++) addHatch(hatch.length + i, ROUNDS[state.round].hatch, state.round);
      state.pending += n;
    },
    advanceFront(v) { state.frontX += v; },
    setFront(x) { state.frontX = x; },
    freezeFront(on) { state.freezeFront = !!on; },
    freezeMeter(on) { state.freezeMeter = !!on; },
    setHearts(n) { state.hearts = n; },
    setMeter(v) { state.meter = v; },
    setWind(deg) { state.windBase = (deg * Math.PI) / 180; state.wind = state.windBase; state.sway = 0; },
    calmAll() {
      for (const h of hatch) {
        if (h.resolved) continue;
        h.panic = 0;
        if (h.state === 'bolt') h.state = 'calm';
      }
    },
    teleportHatch(i, x, y) {
      const h = hatch[i];
      if (!h || h.resolved) return null;
      unassign(h);
      h.x = clamp(x, 26, W - 26);
      h.y = clamp(y, TOP, BOTTOM);
      h.state = 'calm';
      h.panic = 0;
      h.boltT = 0;
      return { x: Math.round(h.x), y: Math.round(h.y) };
    },
    warmAll() {
      let n = 0;
      for (const h of hatch) {
        if (h.resolved) continue;
        if (h.state === 'shelter') { n++; continue; }
        if (assignZone(h)) { n++; continue; }
        for (const z of zones) {
          if (!z.alive || z.taken >= z.cap) continue;
          h.x = z.cx;
          h.y = z.cy;
          if (assignZone(h)) { n++; break; }
        }
      }
      return n;
    }
  };
}

export default { id: 'frost-hollow', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
