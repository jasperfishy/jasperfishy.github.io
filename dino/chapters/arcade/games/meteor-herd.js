// Meteor Herd — the burning plain.
// Six calves, one frill, and a sky that keeps falling. Stand under the shelter
// call when the shadows bloom, and gather the strays before the rock lands.

import { canvasTex, grain, rng, clamp, approach, W } from '../engine.js?v=du-9ab77cff6b9ebbf2';

const GROUND = 432;
const GOAL = 40;
const STAR = [14, 26, 40];
const DOME_R = 178;
const BLAST = 94;
const BIG_BLAST = 138;

function leadArt(scene) {
  ['a', 'b', 'call'].forEach((pose) => {
    canvasTex(scene, 'mh-lead-' + pose, 356, 236, (c) => {
      const rand = rng(314 + pose.charCodeAt(0));
      const step = pose === 'b' ? 1 : -1;
      const call = pose === 'call';
      // the frill rises above the shoulders, so the whole animal sits low in
      // the texture and the feet stay a few pixels off the bottom edge
      c.save();
      c.translate(0, 22);

      // tail
      c.strokeStyle = '#4c5d46';
      c.lineWidth = 16;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(74, 148); c.quadraticCurveTo(30, 150, 12, 126); c.stroke();
      c.strokeStyle = '#3b4a38';
      c.lineWidth = 8;
      c.beginPath(); c.moveTo(30, 148); c.quadraticCurveTo(16, 140, 6, 126); c.stroke();

      // far legs
      c.strokeStyle = '#3c4c3b';
      c.lineWidth = 16;
      [[112, 176, 100 + step * 10, 208], [178, 176, 164 - step * 8, 208]].forEach(([hx, hy, fx, fy]) => {
        c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + fx) / 2, hy + 12, fx, fy); c.stroke();
        c.fillStyle = '#2e3b2d';
        c.beginPath(); c.ellipse(fx + 3, fy, 13, 6, 0, 0, Math.PI * 2); c.fill();
      });

      // body
      const body = c.createLinearGradient(80, 88, 230, 186);
      body.addColorStop(0, '#7f8f63');
      body.addColorStop(0.5, '#5c6e4c');
      body.addColorStop(1, '#39472f');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(156, 140, 82, 46, -0.04, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(214,222,164,0.2)';
      c.beginPath(); c.ellipse(158, 160, 58, 15, -0.03, 0, Math.PI * 2); c.fill();

      // hide texture
      c.strokeStyle = 'rgba(38,50,30,0.4)';
      c.lineWidth = 1.8;
      for (let i = 0; i < 16; i++) {
        const x = 96 + (i * 43) % 116, y = 112 + (i * 29) % 46;
        c.beginPath(); c.arc(x, y, 4 + (i % 3) * 2, 0.4, 2.4); c.stroke();
      }

      // near legs
      c.strokeStyle = '#54654a';
      c.lineWidth = 18;
      [[126, 176, 132 - step * 12, 208], [192, 176, 204 + step * 10, 208]].forEach(([hx, hy, fx, fy]) => {
        c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + fx) / 2 + 4, hy + 14, fx, fy); c.stroke();
        c.fillStyle = '#2e3b2d';
        c.beginPath(); c.ellipse(fx + 4, fy, 14, 7, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#cdd3a4';
        c.lineWidth = 2.6;
        c.beginPath(); c.moveTo(fx + 12, fy - 2); c.lineTo(fx + 23, fy - 4); c.stroke();
        c.strokeStyle = '#54654a';
        c.lineWidth = 18;
      });

      // neck
      c.strokeStyle = '#6d7f55';
      c.lineWidth = 30;
      c.beginPath(); c.moveTo(216, 120); c.quadraticCurveTo(238, 104, 250, 96); c.stroke();

      // frill — the shelter itself, a fan of bone with a scalloped edge
      c.save();
      c.translate(238, 100);
      c.rotate(-0.18);
      const fg = c.createLinearGradient(-8, -70, 40, 40);
      fg.addColorStop(0, call ? '#ffd27a' : '#c9a268');
      fg.addColorStop(0.5, call ? '#e8984a' : '#9c7444');
      fg.addColorStop(1, '#5c4430');
      c.fillStyle = fg;
      c.beginPath();
      c.moveTo(2, 24);
      c.quadraticCurveTo(-38, -34, -18, -78);
      c.quadraticCurveTo(4, -104, 40, -96);
      c.quadraticCurveTo(70, -86, 72, -44);
      c.quadraticCurveTo(72, -4, 40, 20);
      c.closePath();
      c.fill();
      c.strokeStyle = call ? 'rgba(255,240,190,0.85)' : 'rgba(72,48,26,0.6)';
      c.lineWidth = 3;
      c.stroke();
      // scallops along the fan edge
      c.fillStyle = call ? '#ffcf80' : '#b98a52';
      for (let i = 0; i < 5; i++) {
        const a = -1.9 + i * 0.42;
        const ex = 26 + Math.cos(a) * 58;
        const ey = -40 + Math.sin(a) * 60;
        c.beginPath(); c.arc(ex, ey, 11, 0, Math.PI * 2); c.fill();
      }
      // frill veins
      c.strokeStyle = call ? 'rgba(255,248,215,0.7)' : 'rgba(88,58,32,0.45)';
      c.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = -1.7 + i * 0.36;
        c.beginPath();
        c.moveTo(16, -36);
        c.quadraticCurveTo(20 + Math.cos(a) * 30, -40 + Math.sin(a) * 30, 26 + Math.cos(a) * 54, -40 + Math.sin(a) * 56);
        c.stroke();
      }
      if (call) {
        const glow = c.createRadialGradient(26, -40, 6, 26, -40, 96);
        glow.addColorStop(0, 'rgba(255,226,150,0.5)');
        glow.addColorStop(1, 'rgba(255,190,90,0)');
        c.fillStyle = glow;
        c.beginPath(); c.arc(26, -40, 96, 0, Math.PI * 2); c.fill();
      }
      c.restore();

      // head, beak, horns
      c.fillStyle = '#7d8f60';
      c.beginPath(); c.ellipse(264, 92, 30, 22, 0.08, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5f7048';
      c.beginPath();
      c.moveTo(286, 86); c.quadraticCurveTo(312, 90, 306, 104);
      c.quadraticCurveTo(296, 112, 282, 108); c.closePath(); c.fill();
      c.strokeStyle = '#efe0b2';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(290, 84); c.quadraticCurveTo(302, 70, 310, 66); c.stroke();
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(284, 108); c.lineTo(300, 114); c.stroke();
      c.fillStyle = '#f6e9c0';
      c.beginPath(); c.arc(270, 86, 5.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#20281a';
      c.beginPath(); c.arc(271.5, 86, 2.7, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath(); c.arc(269.5, 84.4, 1.1, 0, Math.PI * 2); c.fill();

      c.restore();

      // rim light from the storm
      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(60, 40, 260, 200);
      rim.addColorStop(0, 'rgba(190,220,200,0.24)');
      rim.addColorStop(0.5, 'rgba(190,220,200,0)');
      rim.addColorStop(1, 'rgba(255,170,90,0.12)');
      c.fillStyle = rim; c.fillRect(0, 0, 356, 236);
      c.globalCompositeOperation = 'source-over';
      grain(c, 356, 236, 0.03, 61 + rand() * 12);
    });
  });
}

function calfArt(scene) {
  ['a', 'b'].forEach((pose) => {
    canvasTex(scene, 'mh-calf-' + pose, 132, 110, (c) => {
      const rand = rng(97 + pose.charCodeAt(0));
      const step = pose === 'b' ? 1 : -1;
      c.strokeStyle = '#4f6044';
      c.lineWidth = 8;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(40, 78); c.quadraticCurveTo(20, 80, 8, 66); c.stroke();

      c.strokeStyle = '#4b5b40';
      c.lineWidth = 8;
      [[56, 88, 50 + step * 6, 104], [86, 88, 90 - step * 6, 104]].forEach(([hx, hy, fx, fy]) => {
        c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + fx) / 2, hy + 6, fx, fy); c.stroke();
        c.fillStyle = '#33402f';
        c.beginPath(); c.ellipse(fx + 2, fy, 7, 3.4, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#4b5b40';
        c.lineWidth = 8;
      });

      const body = c.createLinearGradient(40, 42, 116, 96);
      body.addColorStop(0, '#8b9a6c');
      body.addColorStop(0.55, '#67785a');
      body.addColorStop(1, '#42513b');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(78, 70, 40, 23, -0.05, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(222,230,178,0.22)';
      c.beginPath(); c.ellipse(80, 80, 27, 8, -0.04, 0, Math.PI * 2); c.fill();

      // neck + small frill
      c.strokeStyle = '#74875e';
      c.lineWidth = 15;
      c.beginPath(); c.moveTo(108, 62); c.quadraticCurveTo(118, 54, 122, 50); c.stroke();
      c.fillStyle = '#b08a52';
      c.save();
      c.translate(120, 52);
      c.rotate(-0.2);
      c.beginPath();
      c.moveTo(0, 12);
      c.quadraticCurveTo(-16, -14, -4, -28);
      c.quadraticCurveTo(10, -38, 22, -26);
      c.quadraticCurveTo(30, -12, 20, 10);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(80,54,28,0.5)';
      c.lineWidth = 1.6; c.stroke();
      c.restore();

      c.fillStyle = '#87986a';
      c.beginPath(); c.ellipse(128, 52, 16, 12, 0.08, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6b7c54';
      c.beginPath();
      c.moveTo(140, 48); c.quadraticCurveTo(156, 52, 152, 60);
      c.quadraticCurveTo(144, 62, 138, 58); c.closePath(); c.fill();
      c.fillStyle = '#f2e6bc';
      c.beginPath(); c.arc(132, 48, 3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#25301d';
      c.beginPath(); c.arc(133, 48, 1.5, 0, Math.PI * 2); c.fill();

      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(20, 20, 120, 100);
      rim.addColorStop(0, 'rgba(196,222,204,0.24)');
      rim.addColorStop(1, 'rgba(196,222,204,0)');
      c.fillStyle = rim; c.fillRect(0, 0, 132, 110);
      c.globalCompositeOperation = 'source-over';
      grain(c, 132, 110, 0.035, 71 + rand() * 14);
    });
  });
}

function skyArt(scene) {
  canvasTex(scene, 'mh-meteor', 112, 132, (c) => {
    const glow = c.createRadialGradient(56, 66, 6, 56, 66, 64);
    glow.addColorStop(0, 'rgba(255,224,160,0.95)');
    glow.addColorStop(0.35, 'rgba(255,150,70,0.5)');
    glow.addColorStop(1, 'rgba(255,90,40,0)');
    c.fillStyle = glow; c.fillRect(0, 0, 112, 132);

    // flame tongues licking off the back of the rock
    c.fillStyle = 'rgba(255,160,80,0.4)';
    [[28, 44], [46, 30], [66, 28], [82, 46]].forEach(([x, y], i) => {
      c.beginPath();
      c.moveTo(x - 8, y + 14);
      c.quadraticCurveTo(x - 6 + i * 2, y - 12, x + 2, y - 22 - i * 3);
      c.quadraticCurveTo(x + 8, y - 8, x + 8, y + 14);
      c.closePath(); c.fill();
    });

    // molten rock with a hot cap
    const rock = c.createLinearGradient(30, 34, 82, 102);
    rock.addColorStop(0, '#ffd9a4');
    rock.addColorStop(0.25, '#e08a44');
    rock.addColorStop(0.6, '#9c4420');
    rock.addColorStop(1, '#4a1c10');
    c.fillStyle = rock;
    c.beginPath();
    c.moveTo(30, 64);
    c.lineTo(38, 44);
    c.lineTo(54, 36);
    c.lineTo(70, 40);
    c.lineTo(80, 56);
    c.lineTo(78, 78);
    c.lineTo(64, 94);
    c.lineTo(46, 92);
    c.lineTo(32, 82);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,206,130,0.95)';
    c.lineWidth = 3;
    c.stroke();

    // cracks and a bright leading edge
    c.strokeStyle = 'rgba(255,246,206,0.95)';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(40, 52); c.lineTo(52, 62); c.lineTo(46, 76); c.lineTo(58, 88);
    c.stroke();
    c.strokeStyle = 'rgba(255,170,90,0.8)';
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(66, 44); c.lineTo(60, 62); c.lineTo(70, 70); c.stroke();
    c.fillStyle = 'rgba(255,248,214,0.55)';
    c.beginPath(); c.ellipse(46, 48, 10, 5.5, -0.55, 0, Math.PI * 2); c.fill();

    // a few embers peeling off the trailing side
    c.fillStyle = 'rgba(255,214,150,0.85)';
    [[36, 30, 2], [70, 24, 1.4], [84, 60, 1.7], [28, 74, 1.5], [62, 100, 1.3]].forEach(([x, y, rr]) => {
      c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
    });
  });

  canvasTex(scene, 'mh-crater', 260, 110, (c) => {
    const g = c.createRadialGradient(130, 54, 6, 130, 54, 126);
    g.addColorStop(0, 'rgba(22,16,12,0.85)');
    g.addColorStop(0.55, 'rgba(40,28,20,0.55)');
    g.addColorStop(0.85, 'rgba(84,58,34,0.24)');
    g.addColorStop(1, 'rgba(84,58,34,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(130, 54, 126, 46, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,176,96,0.35)';
    c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      c.beginPath();
      c.moveTo(130 + Math.cos(a) * 30, 54 + Math.sin(a) * 12);
      c.lineTo(130 + Math.cos(a) * (60 + (i % 3) * 14), 54 + Math.sin(a) * (22 + (i % 2) * 8));
      c.stroke();
    }
  });

  canvasTex(scene, 'mh-plate', 96, 96, (c) => {
    c.strokeStyle = 'rgba(210,248,235,0.9)';
    c.lineWidth = 3;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = 48 + Math.cos(a) * 40, y = 48 + Math.sin(a) * 40;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
    c.stroke();
    c.strokeStyle = 'rgba(210,248,235,0.25)';
    c.lineWidth = 8; c.stroke();
  });

  canvasTex(scene, 'mh-stone', 120, 70, (c) => {
    const g = c.createLinearGradient(10, 8, 100, 64);
    g.addColorStop(0, '#5e6350');
    g.addColorStop(1, '#2c3028');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(8, 60); c.lineTo(22, 26); c.lineTo(62, 14); c.lineTo(104, 28);
    c.lineTo(112, 56); c.lineTo(84, 66); c.lineTo(30, 66);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(210,230,200,0.12)';
    c.beginPath(); c.ellipse(50, 30, 26, 8, -0.3, 0, Math.PI * 2); c.fill();
    grain(c, 120, 70, 0.05, 29);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  leadArt(scene);
  calfArt(scene);
  skyArt(scene);
  const r = rng(4417);

  const state = {
    score: 0, hearts: 3, energy: 1, domeP: 0, calling: false, exhausted: false, needsRelease: false,
    over: false, time: 0, interval: 2.5, spawnT: 2.2, dropped: 0, flashT: 4, auto: true
  };
  let forceCall = null;
  const lead = { x: 480, aim: 480, bob: 0, hitT: 0 };
  const slots = [-150, -105, -62, -18, 26, 70];
  const lanes = [-9, 6, -4, 9, -7, 4];
  const members = slots.map((off, i) => {
    const img = scene.add.image(lead.x + off, M.Y(GROUND + lanes[i]), 'mh-calf-a')
      .setOrigin(0.5, 1).setDepth(lanes[i] > 0 ? 17.4 : 15.4).setScale((0.76 + (i % 3) * 0.04) * K);
    return { img, off, dy: lanes[i], x: lead.x + off, stray: 0, strayT: 1 + r() * 3, downT: 0, ph: r() * 6, step: r() * 2 };
  });

  const leadSprite = scene.add.image(lead.x, M.Y(GROUND), 'mh-lead-a').setOrigin(0.5, 1).setDepth(18).setScale(0.92 * K);
  const leadGlow = scene.add.image(lead.x, M.Y(GROUND - 96), 'arc-glow').setDepth(14).setScale(0.9 * K).setAlpha(0)
    .setTint(0xffc46a).setBlendMode(Phaser.BlendModes.ADD);

  // shelter dome: a glow, a ring of plates and a low pulse
  const domeGlow = scene.add.image(lead.x, M.Y(GROUND - 40), 'arc-glow').setDepth(19.5)
    .setScale(2.5 * K).setAlpha(0).setTint(0x9fe8d4).setBlendMode(Phaser.BlendModes.ADD);
  const dome = scene.add.graphics().setDepth(19.6);
  const domeTint = 0x9fe8d4;
  const plates = [];
  for (let i = 0; i < 14; i++) {
    const img = scene.add.image(lead.x, M.Y(GROUND - 40), 'mh-plate').setDepth(19.7).setAlpha(0).setScale(0.5 * K);
    img._a = (i / 14) * Math.PI * 2;
    plates.push(img);
  }

  // ground props
  for (let i = 0; i < 7; i++) {
    const x = 40 + i * 148 + r() * 50;
    scene.add.image(x, M.Y(GROUND + 6), 'mh-stone').setOrigin(0.5, 1).setScale((0.6 + r() * 0.5) * K)
      .setDepth(12).setAlpha(0.85).setTint(0x7d8a74);
  }

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 40, max: 160 }, angle: { min: 200, max: 340 }, lifespan: { min: 300, max: 620 },
    scale: { start: 0.5, end: 0 }, alpha: { start: 0.4, end: 0 }, tint: 0xb8a888,
    gravityY: 240, emitting: false
  }).setDepth(17);
  const sparks = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 120, max: 420 }, lifespan: 620, scale: { start: 0.6, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0xffc880, gravityY: 520, emitting: false
  }).setDepth(24);
  const shieldSparks = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 120, max: 260 }, lifespan: 520, scale: { start: 0.5, end: 0 },
    alpha: { start: 0.9, end: 0 }, tint: 0xd8fff0, gravityY: 120, emitting: false, blendMode: 'ADD'
  }).setDepth(25);
  canvasTex(scene, 'mh-rain', 6, 44, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 44);
    g.addColorStop(0, 'rgba(210,235,238,0)');
    g.addColorStop(0.55, 'rgba(210,235,238,0.8)');
    g.addColorStop(1, 'rgba(210,235,238,0)');
    c.fillStyle = g;
    c.fillRect(1.5, 0, 3, 44);
  });
  scene.add.particles(0, 0, 'mh-rain', {
    x: { min: -80, max: W + 80 }, y: -60, speedX: { min: 90, max: 170 }, speedY: { min: 720, max: 980 },
    lifespan: 900, scale: { start: 1.1, end: 0.9 }, alpha: { start: 0.3, end: 0.08 },
    rotate: 12, frequency: 18, quantity: 1
  }).setDepth(9);

  const lightning = scene.add.graphics().setDepth(-10);
  const flashRect = scene.add.rectangle(0, 0, W, M.H, 0xffffff, 0.5).setOrigin(0).setDepth(44);
  flashRect.setAlpha(0);
  function flashScreen(color, strength) {
    flashRect.setFillStyle(color, strength);
    scene.tweens.killTweensOf(flashRect);
    flashRect.setAlpha(1);
    scene.tweens.add({ targets: flashRect, alpha: 0, duration: 300, ease: 'quad.out' });
  }

  const meteors = [];
  const craters = [];

  function chargeDome() {
    if (state.exhausted && state.energy > 0.3 && !state.calling) state.exhausted = false;
    return state.calling && !state.exhausted && !state.needsRelease;
  }

  function spawnMeteor(x, opts = {}) {
    const big = !!opts.big;
    const warn = opts.warn === undefined ? (big ? 1.5 : 1.15) : opts.warn;
    const img = scene.add.image(x, M.Y(-80), 'mh-meteor').setDepth(22).setScale((big ? 1.2 : 0.82) * K);
    img.setAlpha(0);
    const trail = scene.add.particles(x, img.y, 'arc-dot', {
      speed: { min: 20, max: 60 }, lifespan: 340, scale: { start: 0.7, end: 0 },
      alpha: { start: 0.65, end: 0 }, tint: [0xffd28a, 0xff8a4a], emitting: false, blendMode: 'ADD'
    }).setDepth(21);
    meteors.push({ img, trail, x, y0: img.y, t: 0, warn, big, power: big ? 2 : 1, impact: false, shadow: 0 });
    state.dropped++;
    scene.sfx('whoosh');
    return meteors[meteors.length - 1];
  }

  function impact(m) {
    if (m.impact) return;
    m.impact = true;
    const x = m.x;
    const domeOn = state.domeP > 0.55 && Math.hypot(x - lead.x, 0) < DOME_R * 0.94 + 30;
    const blast = m.big ? BIG_BLAST : BLAST;
    const victims = [];
    const inDome = (px) => state.domeP > 0.55 && Math.abs(px - lead.x) < DOME_R * 0.94;

    if (Math.abs(x - lead.x) < blast && !inDome(lead.x)) victims.push('lead');
    members.forEach((mb) => {
      if (mb.downT > 0) return;
      if (Math.abs(x - mb.x) < blast && !inDome(mb.x)) victims.push(mb);
    });

    scene.burst(x, M.Y(GROUND - 10), m.big ? 0xffb060 : 0xffcf90, m.big ? 26 : 16, { life: 720, gravity: 420, spin: true, depth: 23 });
    sparks.explode(m.big ? 20 : 12, x, M.Y(GROUND - 14));
    scene.shake(m.big ? 320 : 190, m.big ? 0.016 : 0.009);
    flashScreen(0xffb060, m.big ? 0.3 : 0.18);
    scene.sfx(m.big ? 'boom' : 'land');

    const crater = scene.add.image(x, M.Y(GROUND + 2), 'mh-crater').setOrigin(0.5, 1)
      .setDepth(11).setScale((m.big ? 1.05 : 0.72) * K).setAlpha(0.78);
    craters.push({ img: crater, t: 0 });
    if (craters.length > 8) craters.shift().img.destroy();

    if (domeOn) {
      shieldSparks.explode(16, x, M.Y(GROUND - 70));
      const ring = scene.add.image(x, M.Y(GROUND - 90), 'arc-ring').setDepth(24).setScale(0.4 * K).setAlpha(0.9)
        .setTint(domeTint).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: ring, scale: 1.8 * K, alpha: 0, duration: 460, ease: 'cubic.out', onComplete: () => ring.destroy() });
      scene.sfx('chime');
      state.score += m.power;
      scene.popText(x, M.Y(GROUND - 180), m.power > 1 ? '+2 sheltered' : '+1 sheltered', '#c9fff0');
      return;
    }

    if (victims.length) {
      state.hearts--;
      scene.sfx('hurt');
      scene.shake(320, 0.016);
      scene.popText(x, M.Y(GROUND - 160), 'scattered', '#ffb1a1');
      victims.forEach((v) => {
        if (v === 'lead') {
          lead.hitT = 0.75;
          scene.notice('The lead is struck. Gather the herd.', 1600);
        } else {
          v.downT = 2.4;
          v.stray = (v.x < lead.x ? -1 : 1) * 170;
        }
      });
      if (state.hearts <= 0) { endRun(false); return; }
    } else {
      state.score += m.power;
      scene.popText(x, M.Y(GROUND - 150), m.power > 1 ? '+2 weathered' : '+1 weathered', '#ffe0a8');
    }
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    scene.finish(win, {
      score: state.score,
      note: win
        ? `the whole herd under one frill`
        : `${state.score} rocks endured before the herd broke`
    });
  }

  function hitBolt() {
    lightning.clear();
    const x = 120 + r() * (W - 240);
    let y = -20;
    let px = x;
    lightning.lineStyle(3, 0xdff4ff, 0.75);
    lightning.beginPath(); lightning.moveTo(px, y);
    for (let i = 0; i < 7; i++) {
      px += (r() - 0.5) * 90;
      y += 34 + r() * 30;
      lightning.lineTo(px, y);
    }
    lightning.strokePath();
    lightning.lineStyle(1.2, 0xffffff, 0.9);
    lightning.strokePath();
    flashScreen(0xbfe0ff, 0.16);
    scene.time.delayedCall(140, () => lightning.clear());
  }

  // input
  let pointerHeld = false;
  let spaceHeld = false;
  scene.input.on('pointermove', (ptr) => { lead.aim = clamp(ptr.x, 90, W - 90); });
  scene.input.on('pointerdown', (ptr) => {
    pointerHeld = true;
    lead.aim = clamp(ptr.x, 90, W - 90);
  });
  scene.input.on('pointerup', () => { pointerHeld = false; });
  const keys = scene.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D' });
  scene.input.keyboard.on('keydown-SPACE', () => { spaceHeld = true; });
  scene.input.keyboard.on('keyup-SPACE', () => { spaceHeld = false; });
  const release = () => { spaceHeld = false; pointerHeld = false; };

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'hold to raise the shelter' });
  scene.notice('Hold when a shadow blooms. Gather the strays first.', 2800);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.time += dt;

    // steering
    const speed = 360;
    if (keys.left.isDown || keys.a.isDown) lead.aim -= speed * dt;
    if (keys.right.isDown || keys.d.isDown) lead.aim += speed * dt;
    lead.aim = clamp(lead.aim, 90, W - 90);
    const moveScale = state.domeP > 0.5 ? 0.32 : 1;
    lead.x = approach(lead.x, lead.aim, 420 * dt * moveScale);
    lead.x = clamp(lead.x, 90, W - 90);

    // shelter call
    state.calling = forceCall === null ? (spaceHeld || pointerHeld) : forceCall;
    if (forceCall !== null && forceCall === false) state.needsRelease = false;
    if (!state.calling) state.needsRelease = false;
    const wantDome = chargeDome();
    if (wantDome && state.energy > 0.02) {
      state.energy = Math.max(0, state.energy - dt * 0.30);
      state.domeP = approach(state.domeP, 1, dt * 5.5);
      if (state.energy <= 0.001) {
        state.exhausted = true;
        state.needsRelease = true;
        scene.sfx('bad');
        scene.shake(120, 0.005);
        scene.notice('The frill is spent. Release and let it warm again.', 1700);
      }
    } else {
      state.domeP = approach(state.domeP, 0, dt * 4.2);
      if (state.energy < 1) state.energy = Math.min(1, state.energy + dt * (state.exhausted ? 0.16 : 0.22));
    }
    if (state.domeP > 0.6 && Math.random() < dt * 14) {
      dust.emitParticleAt(lead.x + (r() - 0.5) * DOME_R, M.Y(GROUND), 1);
    }

    // herd
    members.forEach((mb, i) => {
      if (mb.downT > 0) {
        mb.downT = Math.max(0, mb.downT - dt);
        mb.img.setRotation(0.55);
        mb.img.y = M.Y(GROUND + mb.dy - 6);
        mb.img.setAlpha(0.7 + Math.sin(time / 90) * 0.2);
        if (mb.downT === 0) {
          mb.img.setRotation(0);
          scene.popText(mb.x, M.Y(GROUND - 110), 'on its feet', '#d8ffe4');
        }
        return;
      }
      mb.strayT -= dt;
      if (mb.strayT <= 0) {
        mb.strayT = 1.6 + r() * 2.8;
        mb.stray = clamp(mb.stray + (r() - 0.5) * 170, -150, 150);
      }
      const gather = state.domeP > 0.35 ? 5.2 : 1.6;
      mb.stray = approach(mb.stray, 0, dt * 40 * gather);
      const tx = clamp(lead.x + mb.off + mb.stray, 54, W - 54);
      const dx = tx - mb.x;
      mb.x = approach(mb.x, tx, Math.max(90, Math.abs(dx) * 2.6) * dt);
      const moving = Math.abs(dx) > 4;
      mb.step += dt * (moving ? 8 : 2.4);
      mb.img.setTexture(Math.floor(mb.step) % 2 ? 'mh-calf-b' : 'mh-calf-a');
      mb.img.x = mb.x;
      mb.img.y = M.Y(GROUND + mb.dy) + Math.sin(time / 220 + mb.ph) * 1.5;
      mb.img.setFlipX(dx < -2);
      mb.img.setScale((0.76 + (i % 3) * 0.04 + (moving ? 0.02 : 0)) * K);
      if (moving && Math.random() < dt * 5) dust.emitParticleAt(mb.x - 14, M.Y(GROUND + mb.dy), 1);
    });

    lead.bob += dt * 7;
    leadSprite.x = lead.x;
    leadSprite.y = M.Y(GROUND) + Math.sin(lead.bob) * 1.8 + (lead.hitT > 0 ? Math.sin(time / 30) * 4 : 0);
    lead.hitT = Math.max(0, lead.hitT - dt);
    leadSprite.setTexture(state.domeP > 0.4 ? 'mh-lead-call' : (Math.floor(lead.bob / 2) % 2 ? 'mh-lead-b' : 'mh-lead-a'));
    leadSprite.setFlipX(false);
    leadSprite.setScale((0.92 + state.domeP * 0.03) * K);
    leadGlow.x = lead.x + 18 * K;
    leadGlow.setAlpha(state.domeP * (0.24 + Math.sin(time / 220) * 0.05));

    // dome
    domeGlow.x = lead.x;
    domeGlow.setScale((2.3 + state.domeP * 0.5) * K);
    domeGlow.setAlpha(state.domeP * (0.42 + Math.sin(time / 260) * 0.07));
    dome.clear();
    if (state.domeP > 0.02) {
      const cy = M.Y(GROUND - 30);
      const rad = DOME_R * state.domeP;
      dome.fillStyle(domeTint, 0.085 * state.domeP);
      dome.fillCircle(lead.x, cy, rad);
      dome.lineStyle(3.4 * K, domeTint, 0.72 * state.domeP);
      dome.strokeCircle(lead.x, cy, rad);
      dome.lineStyle(1.8 * K, 0xffffff, 0.3 * state.domeP);
      dome.strokeCircle(lead.x, cy, rad * 0.72);
      dome.strokeCircle(lead.x, cy, rad * 0.44);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + time / 5200;
        dome.lineStyle(1.2 * K, domeTint, 0.14 * state.domeP);
        dome.beginPath();
        dome.moveTo(lead.x + Math.cos(a) * rad * 0.3, cy + Math.sin(a) * rad * 0.3);
        dome.lineTo(lead.x + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        dome.strokePath();
      }
      // energy arc along the rim
      dome.lineStyle(5 * K, state.energy > 0.3 ? 0x9fe8d4 : 0xffa878, 0.75 * state.domeP);
      dome.beginPath();
      dome.arc(lead.x, cy, rad + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.energy, false);
      dome.strokePath();
    }
    plates.forEach((pl) => {
      const a = pl._a + time / 5200;
      const rad = DOME_R * 0.99 * state.domeP;
      pl.x = lead.x + Math.cos(a) * rad;
      pl.y = M.Y(GROUND - 30) + Math.sin(a) * rad;
      pl.setAlpha(state.domeP * 0.5 * (0.6 + Math.sin(time / 300 + pl._a * 3) * 0.4));
      pl.setRotation(a + Math.PI / 2);
      pl.setScale((0.42 + state.domeP * 0.1) * K);
    });

    // meteors
    state.spawnT -= dt;
    if (state.auto && state.spawnT <= 0) {
      const target = members.length ? members[Math.floor(r() * members.length)] : { x: lead.x };
      const x = clamp(target.x + (r() - 0.5) * 220, 60, W - 60);
      const big = (state.dropped + 1) % 9 === 0;
      spawnMeteor(x, { big });
      state.interval = Math.max(1.05, 2.6 - state.score * 0.035);
      state.spawnT = state.interval * (0.72 + r() * 0.55);
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.t += dt;
      const fallP = Math.min(1, m.t / m.warn);
      const ease = fallP * fallP;
      m.img.y = m.y0 + (M.Y(GROUND - 40) - m.y0) * ease;
      m.img.setAlpha(fallP < 0.08 ? fallP / 0.08 : 1);
      m.img.rotation += dt * 1.8;
      m.img.setScale((m.big ? 1.2 : 0.82) * K * (1 + (1 - ease) * 0.45));
      m.trail.x = m.img.x;
      m.trail.y = m.img.y - 20;
      if (Math.random() < dt * 22) m.trail.emitParticleAt(m.img.x + (r() - 0.5) * 20, m.img.y + 18, 1);
      // shadow warning on the ground
      if (!m.impact) {
        const warnAlpha = 0.18 + fallP * 0.42;
        dome.lineStyle(2 * K, 0xff9a5a, warnAlpha * 0.8);
        dome.strokeCircle(m.x, M.Y(GROUND + 2), (m.big ? 70 : 46) * (1.2 - fallP * 0.5));
        dome.fillStyle(0x2a1610, 0.12 + fallP * 0.22);
        dome.fillCircle(m.x, M.Y(GROUND + 2), (m.big ? 70 : 48) * (0.5 + fallP * 0.6));
      }
      if (fallP >= 1) {
        impact(m);
        m.trail.destroy();
        m.img.destroy();
        meteors.splice(i, 1);
      }
    }

    // craters fade
    for (let i = craters.length - 1; i >= 0; i--) {
      const cr = craters[i];
      cr.t += dt;
      cr.img.setAlpha(Math.max(0, 0.9 - cr.t * 0.075));
      if (cr.t > 12) { cr.img.destroy(); craters.splice(i, 1); }
    }

    // storm dressing
    state.flashT -= dt;
    if (state.flashT <= 0) { state.flashT = 5.5 + r() * 6; hitBolt(); }
    if (state.over) return;

    scene.hud({
      score: state.score,
      progress: state.score / GOAL,
      hearts: state.hearts,
      extra: state.exhausted ? 'the frill is spent' : state.domeP > 0.4 ? 'shelter held' : state.energy < 0.35 ? 'shelter fading' : 'hold to raise the frill'
    });
    scene.audio.setTension(clamp(meteors.length ? 0.7 : 0.15 + (1 - state.energy) * 0.3, 0, 1));

    if (state.score >= GOAL) endRun(true);
  }

  return {
    update,
    state: () => ({
      score: state.score, hearts: state.hearts, energy: Number(state.energy.toFixed(2)),
      dome: Number(state.domeP.toFixed(2)), calling: state.calling, over: state.over,
      leadX: Math.round(lead.x),
      herd: members.map((m) => ({ x: Math.round(m.x), off: m.off, down: m.downT > 0 })),
      meteors: meteors.map((m) => ({ x: Math.round(m.x), t: Number(m.t.toFixed(2)), warn: m.warn, big: m.big }))
    }),
    setScore: (v) => { state.score = v; },
    setHearts: (v) => { state.hearts = v; },
    setAuto: (v) => { state.auto = v; },
    setEnergy: (v) => { state.energy = v; },
    setCalling: (v) => { forceCall = v; },
    setDome: (on) => {
      forceCall = on;
      state.needsRelease = false;
      state.exhausted = false;
      if (on) { state.energy = 1; state.domeP = 1; }
      else { state.domeP = 0; }
    },
    leadTo: (x) => { lead.x = clamp(x, 90, W - 90); lead.aim = lead.x; },
    placeHerd: (x) => {
      lead.x = clamp(x, 90, W - 90); lead.aim = lead.x;
      members.forEach((m, i) => { m.x = clamp(lead.x + slots[i], 54, W - 54); m.stray = 0; m.downT = 0; });
    },
    spawnMeteorAt: (x, opts) => spawnMeteor(clamp(x, 40, W - 40), opts || {}),
    scare: (x, warn) => spawnMeteor(clamp(x, 40, W - 40), { warn: warn || 0.3, big: false }),
    clearMeteors: () => {
      meteors.forEach((m) => { m.img.destroy(); m.trail.destroy(); });
      meteors.length = 0;
    }
  };
}

export default { id: 'meteor-herd', unit: 'survived', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
