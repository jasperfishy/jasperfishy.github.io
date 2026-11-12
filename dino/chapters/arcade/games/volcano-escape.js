// Volcano Escape — the caldera wall.
// The mountain wakes under your feet. Leap shelf to shelf while the lava line
// climbs behind you. Cracked vents throw a column of steam; old shelves crumble.

import { canvasTex, grain, rng, clamp, approach, W } from '../engine.js?v=du-a1454ea5250e1aa0';

const GOAL = 40;
const START_A = 240;
const GRAVITY = 1500;
const CLING_GRAVITY = 520;
const JUMP = 470;
const STAR = [14, 26, 40];

function playerArt(scene) {
  ['run', 'leap'].forEach((pose) => {
    canvasTex(scene, 've-player-' + pose, 150, 118, (c) => {
      const rand = rng(211);
      const leap = pose === 'leap';
      const by = leap ? 60 : 64;

      // tail
      c.strokeStyle = '#b96634';
      c.lineWidth = 10;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(44, by + 4);
      c.quadraticCurveTo(20, by - 6, 8, by - 30);
      c.stroke();
      c.strokeStyle = '#8a4526';
      c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.moveTo(38 - i * 7, by - 2 - i * 2); c.lineTo(30 - i * 7, by - 16 - i * 3); c.stroke();
      }

      // body
      const g = c.createLinearGradient(30, 30, 128, 100);
      g.addColorStop(0, '#e79a52');
      g.addColorStop(0.55, '#c37238');
      g.addColorStop(1, '#8d4a26');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(80, by + 2, 40, 24, -0.1, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,214,158,0.5)';
      c.beginPath(); c.ellipse(84, by + 15, 28, 9, -0.06, 0, Math.PI * 2); c.fill();

      // stripes
      c.strokeStyle = 'rgba(96,42,20,0.45)';
      c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.moveTo(64 + i * 14, by - 18 + i * 2); c.quadraticCurveTo(70 + i * 14, by - 4, 66 + i * 14, by + 8); c.stroke();
      }

      // neck and head
      c.strokeStyle = '#c77a3e';
      c.lineWidth = 14;
      c.beginPath(); c.moveTo(112, by - 6); c.quadraticCurveTo(124, by - 18, 130, by - 20); c.stroke();
      c.fillStyle = '#dd8d4a';
      c.beginPath(); c.ellipse(136, by - 22, 19, 13, -0.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5c3220';
      c.beginPath();
      c.moveTo(144, by - 29); c.quadraticCurveTo(166, by - 26, 166, by - 18);
      c.quadraticCurveTo(158, by - 12, 146, by - 15); c.closePath(); c.fill();
      c.fillStyle = '#f7edd2';
      c.beginPath(); c.arc(140, by - 27, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1e1510';
      c.beginPath(); c.arc(141.4, by - 27, 2.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(139.8, by - 28.6, 1.1, 0, Math.PI * 2); c.fill();

      // crest feathers
      c.strokeStyle = '#4fb3a4';
      c.lineWidth = 3.4;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(129 + i * 2, by - 32);
        c.quadraticCurveTo(120 + i * 3, by - 48 - i * 4, 106 + i * 2, by - 50 - i * 3);
        c.stroke();
      }

      // arms
      c.strokeStyle = '#a95c2e';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(104, by + 4); c.quadraticCurveTo(114, by + 10, 116, by + 2); c.stroke();
      c.strokeStyle = '#f0dfb2'; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(116, by + 2); c.lineTo(121, by - 1); c.stroke();

      // legs
      const legs = leap
        ? [[84, 96, 72, 112], [74, 96, 92, 108]]
        : [[86, by + 20, 108, 110], [74, by + 20, 54, 110]];
      legs.forEach(([hx, hy, fx, fy], i) => {
        c.strokeStyle = i ? '#a35a2e' : '#c0733c';
        c.lineWidth = 9;
        c.beginPath();
        c.moveTo(hx, hy);
        c.quadraticCurveTo((hx + fx) / 2 + 6, (hy + fy) / 2, fx, fy);
        c.stroke();
        c.strokeStyle = '#f0dfb2';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(fx, fy); c.lineTo(fx + 12, fy + (i ? -1 : 2));
        c.moveTo(fx, fy); c.lineTo(fx + 8, fy + 5);
        c.stroke();
      });

      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(30, 20, 140, 110);
      rim.addColorStop(0, 'rgba(255,214,150,0.3)');
      rim.addColorStop(0.6, 'rgba(255,214,150,0)');
      c.fillStyle = rim; c.fillRect(0, 0, 150, 118);
      c.globalCompositeOperation = 'source-over';
      grain(c, 150, 118, 0.03, 223 + rand() * 12);
    });
  });
}

function rockArt(scene) {
  const ledge = (key, seed, wide) => {
    const w = wide ? 248 : 226;
    canvasTex(scene, key, w, 66, (c) => {
      const rand = rng(seed);
      const top = 12;
      const g = c.createLinearGradient(0, top, 0, 66);
      g.addColorStop(0, '#6d5a52');
      g.addColorStop(0.4, '#4a3b3c');
      g.addColorStop(1, '#241b20');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(3, top + 4);
      c.quadraticCurveTo(w * 0.25, top - 3, w * 0.55, top + 2);
      c.quadraticCurveTo(w * 0.8, top + 6, w - 3, top + 3);
      c.lineTo(w - 12, 44);
      c.lineTo(w * 0.72, 54 + (seed % 3) * 4);
      c.lineTo(w * 0.55, 64);
      c.lineTo(w * 0.4, 52);
      c.lineTo(w * 0.18, 60);
      c.lineTo(8, 42);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,190,130,0.4)';
      c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(6, top + 4); c.quadraticCurveTo(w * 0.4, top - 2, w - 4, top + 4); c.stroke();
      c.strokeStyle = 'rgba(20,12,14,0.55)';
      c.lineWidth = 1.8;
      for (let i = 0; i < 5; i++) {
        const x = 20 + rand() * (w - 40);
        c.beginPath(); c.moveTo(x, top + 8); c.lineTo(x + 8 + rand() * 14, 40 + rand() * 18); c.stroke();
      }
      if (wide) {
        c.fillStyle = '#5e6d4e';
        for (let i = 0; i < 7; i++) {
          c.beginPath(); c.ellipse(20 + i * 32, top + 1, 12, 4, -0.2, 0, Math.PI * 2); c.fill();
        }
      }
      grain(c, w, 66, 0.05, seed + 31);
    });
  };
  ledge('ve-ledge-a', 313, false);
  ledge('ve-ledge-b', 419, true);

  canvasTex(scene, 've-vent', 228, 88, (c) => {
    const rand = rng(521);
    const g = c.createLinearGradient(0, 10, 0, 88);
    g.addColorStop(0, '#75564c');
    g.addColorStop(0.5, '#4c383a');
    g.addColorStop(1, '#251a1e');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(4, 14);
    c.quadraticCurveTo(70, 6, 128, 10);
    c.quadraticCurveTo(190, 14, 224, 10);
    c.lineTo(214, 56);
    c.lineTo(166, 78);
    c.lineTo(118, 66);
    c.lineTo(64, 84);
    c.lineTo(12, 58);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,196,120,0.5)';
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(6, 14); c.quadraticCurveTo(110, 6, 222, 12); c.stroke();

    // glowing fissures
    c.strokeStyle = 'rgba(255,126,52,0.9)';
    c.lineWidth = 3.2;
    c.shadowColor = 'rgba(255,120,40,0.9)';
    c.shadowBlur = 10;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(40 + i * 44, 20);
      c.quadraticCurveTo(48 + i * 44, 40, 36 + i * 44, 58 + (i % 2) * 8);
      c.stroke();
    }
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,190,90,0.35)';
    c.beginPath(); c.ellipse(114, 22, 96, 8, 0, 0, Math.PI * 2); c.fill();
    grain(c, 228, 88, 0.05, 533);
  });

  canvasTex(scene, 've-crumble', 210, 62, (c) => {
    const g = c.createLinearGradient(0, 10, 0, 62);
    g.addColorStop(0, '#6a5750');
    g.addColorStop(1, '#2a1f21');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(4, 14);
    c.quadraticCurveTo(60, 6, 110, 10);
    c.quadraticCurveTo(170, 14, 206, 10);
    c.lineTo(192, 44);
    c.lineTo(140, 58);
    c.lineTo(96, 46);
    c.lineTo(46, 60);
    c.lineTo(10, 40);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,186,130,0.32)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(6, 14); c.quadraticCurveTo(100, 6, 204, 12); c.stroke();
    c.strokeStyle = 'rgba(18,10,12,0.75)';
    c.lineWidth = 2.4;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(30 + i * 46, 12);
      c.lineTo(40 + i * 46, 30);
      c.lineTo(28 + i * 46, 46);
      c.stroke();
    }
    grain(c, 210, 62, 0.05, 547);
  });

  canvasTex(scene, 've-summit', 330, 96, (c) => {
    const g = c.createLinearGradient(0, 14, 0, 96);
    g.addColorStop(0, '#8d7248');
    g.addColorStop(0.4, '#5a463a');
    g.addColorStop(1, '#2b1f22');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(4, 18);
    c.quadraticCurveTo(120, 6, 210, 12);
    c.quadraticCurveTo(280, 16, 326, 12);
    c.lineTo(310, 66);
    c.lineTo(220, 88);
    c.lineTo(150, 70);
    c.lineTo(70, 90);
    c.lineTo(14, 62);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,224,160,0.85)';
    c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(6, 18); c.quadraticCurveTo(170, 4, 324, 14); c.stroke();

    // little stone cairn on the summit
    c.fillStyle = '#6b5847';
    [[252, 18, 16, 8], [256, 10, 12, 7], [259, 3, 8, 5]].forEach(([x, y, w, h]) => {
      c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill();
    });
    c.strokeStyle = '#f2dfa6';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(259, 2); c.lineTo(259, -18); c.stroke();
    c.fillStyle = '#ffcf6a';
    c.beginPath(); c.moveTo(259, -18); c.lineTo(286, -12); c.lineTo(259, -4); c.closePath(); c.fill();
    grain(c, 330, 96, 0.045, 563);
  });

  canvasTex(scene, 've-lava', 960, 260, (c) => {
    const rand = rng(607);
    const g = c.createLinearGradient(0, 0, 0, 260);
    g.addColorStop(0, '#fff0b0');
    g.addColorStop(0.02, '#ffd36a');
    g.addColorStop(0.12, '#ff9a3c');
    g.addColorStop(0.4, '#d4461c');
    g.addColorStop(0.75, '#6b1a12');
    g.addColorStop(1, '#2a0b0a');
    c.fillStyle = g;
    c.fillRect(0, 0, 960, 260);

    // crust islands drifting on the melt
    for (let i = 0; i < 26; i++) {
      const x = rand() * 960, y = 18 + rand() * 160;
      c.fillStyle = 'rgba(52,16,12,' + (0.25 + rand() * 0.4) + ')';
      c.beginPath(); c.ellipse(x, y, 14 + rand() * 40, 3 + rand() * 7, rand() * 3, 0, Math.PI * 2); c.fill();
    }
    // bright veins
    c.strokeStyle = 'rgba(255,236,170,0.5)';
    for (let i = 0; i < 22; i++) {
      c.lineWidth = 1 + rand() * 2;
      const x = rand() * 960, y = 12 + rand() * 130;
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x + 20 + rand() * 30, y + 8, x + 44 + rand() * 40, y - 4);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,250,220,0.9)';
    for (let i = 0; i < 30; i++) c.fillRect(rand() * 960, rand() * 5, 2 + rand() * 5, 1.6);
    grain(c, 960, 260, 0.03, 613);
  });

  canvasTex(scene, 've-wall', 120, 620, (c) => {
    const rand = rng(641);
    const g = c.createLinearGradient(0, 0, 120, 0);
    g.addColorStop(0, '#1d161a');
    g.addColorStop(0.55, '#3a2c30');
    g.addColorStop(1, '#241a1e');
    c.fillStyle = g;
    c.fillRect(0, 0, 120, 620);
    c.strokeStyle = 'rgba(14,9,12,0.6)';
    for (let i = 0; i < 14; i++) {
      const y = 20 + (i * 71) % 590;
      c.lineWidth = 1 + rand() * 2;
      c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(60, y + 10, 120, y - 6); c.stroke();
    }
    c.strokeStyle = 'rgba(255,130,60,0.32)';
    c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const y = 80 + i * 180;
      c.beginPath(); c.moveTo(30 + i * 20, y); c.lineTo(44 + i * 8, y + 36); c.lineTo(28, y + 72); c.stroke();
    }
    c.fillStyle = 'rgba(255,180,120,0.06)';
    for (let i = 0; i < 18; i++) {
      c.beginPath(); c.ellipse(rand() * 120, rand() * 620, 8 + rand() * 20, 3 + rand() * 6, rand() * 2, 0, Math.PI * 2); c.fill();
    }
    grain(c, 120, 620, 0.05, 647);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  rockArt(scene);
  playerArt(scene);

  const r = rng(3571);
  const state = {
    best: 0, hearts: 3, over: false, lavaSpeed: 26, surge: 0, surgeT: 16,
    iFrames: 0, overHeat: 0, camA: 0, lavaA: 0, time: 0
  };
  const p = { x: 480, a: START_A, vx: 0, va: 0, grounded: null, coyote: 0, face: 1 };

  const plats = [];
  let lastA = START_A;
  let lastX = 480;
  let nextIndex = 1;

  const screenY = (a) => M.Y(540 - (a - state.camA));

  function addPlatform(index, x, a, w, type) {
    const key = index >= GOAL ? 've-summit' : type === 'vent' ? 've-vent' : type === 'crumble' ? 've-crumble' : (index % 2 ? 've-ledge-a' : 've-ledge-b');
    const img = scene.add.image(x, screenY(a), key).setOrigin(0.5, 0).setDepth(5);
    img.setScale(1, M.portrait ? 1.7 : 1);
    const plat = {
      index, x, baseX: x, w, a, type, img, solid: true, used: false,
      move: type === 'moving', phase: r() * 6, amp: 54 + r() * 42, breakT: 0
    };
    if (type === 'moving') img.setTint(0xb9c3c8);
    plats.push(plat);
    return plat;
  }

  function addNext() {
    if (nextIndex > GOAL) return;
    const idx = nextIndex++;
    const step = idx >= GOAL ? 66 : 50 + r() * 18;
    let x = lastX + (r() - 0.5) * 300 + (480 - lastX) * 0.25;
    x = clamp(x, 150, 810);
    let type = 'normal';
    if (idx > 4 && idx < GOAL) {
      const roll = r();
      if (roll < 0.18) type = 'vent';
      else if (roll < 0.34) type = 'crumble';
      else if (roll < 0.48) type = 'moving';
    }
    const w = type === 'vent' ? 208 : type === 'crumble' ? 190 : type === 'moving' ? 214 : 226;
    lastA += step;
    lastX = x;
    addPlatform(idx, x, lastA, w, type);
  }

  addPlatform(0, 480, START_A, 236, 'normal');

  const player = scene.add.image(p.x, screenY(p.a), 've-player-run').setOrigin(0.5, 1).setDepth(10).setScale(0.72 * K);
  const playerGlow = scene.add.image(p.x, screenY(p.a) - 40, 'arc-glow').setDepth(9)
    .setScale(0.5 * K).setAlpha(0.22).setTint(0xffb070).setBlendMode(Phaser.BlendModes.ADD);

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 30, max: 150 }, angle: { min: 190, max: 350 },
    lifespan: { min: 240, max: 520 }, scale: { start: 0.45, end: 0 },
    alpha: { start: 0.5, end: 0 }, tint: 0xd7b28c, gravityY: 180, emitting: false
  }).setDepth(9);
  const steam = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 90, max: 260 }, angle: { min: 230, max: 310 },
    lifespan: { min: 420, max: 900 }, scale: { start: 0.9, end: 0 },
    alpha: { start: 0.75, end: 0 }, tint: 0xffe4c8, gravityY: -60, emitting: false
  }).setDepth(15);
  const sparks = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 80, max: 300 }, lifespan: 600, scale: { start: 0.55, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0xffae5e, gravityY: 300, emitting: false
  }).setDepth(15);
  const ash = scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 0, max: W }, y: { min: -20, max: 60 },
    speedY: { min: 14, max: 44 }, speedX: { min: -12, max: 12 },
    lifespan: { min: 5000, max: 9000 }, scale: { start: 0.42, end: 0.08 },
    alpha: { start: 0.28, end: 0 }, tint: 0xd9c4b4, frequency: 320, quantity: 1
  }).setDepth(7);

  const lava = scene.add.tileSprite(0, 0, 960, 2200, 've-lava').setOrigin(0, 0).setDepth(12);
  const lavaGlow = scene.add.image(480, 0, 'arc-glow').setDepth(11).setScale(6, 1.2).setAlpha(0.4)
    .setTint(0xff8a3c).setBlendMode(Phaser.BlendModes.ADD);
  const heat = scene.add.rectangle(0, 0, W, 160, 0xff7a30, 0).setOrigin(0, 1).setDepth(13)
    .setBlendMode(Phaser.BlendModes.ADD);

  const leftWall = scene.add.tileSprite(0, 0, 120, M.H, 've-wall').setOrigin(0, 0).setDepth(3).setAlpha(0.95);
  const rightWall = scene.add.tileSprite(840, 0, 120, M.H, 've-wall').setOrigin(0, 0).setDepth(3).setAlpha(0.95).setFlipX(true);

  let holding = false;
  let pointerDir = 0;

  function jump() {
    if (state.over) return;
    if (p.grounded || p.coyote > 0) {
      p.va = JUMP;
      p.coyote = 0;
      p.grounded = null;
      scene.sfx('jump');
      dust.emitParticleAt(p.x - 8, screenY(p.a), 6);
      scene.burst(p.x, screenY(p.a) - 10, 0xffd6a0, 5, { life: 320 });
    }
  }

  function land(plat) {
    p.a = plat.a;
    p.va = 0;
    p.grounded = plat;
    scene.sfx('land');
    dust.emitParticleAt(p.x, screenY(p.a), 5);
    if (plat.index > state.best) {
      state.best = plat.index;
      if (plat.index >= GOAL) return endRun(true);
    }
    if (plat.used) return;
    plat.used = true;
    if (plat.type === 'vent') {
      p.grounded = null;
      p.va = 640;
      scene.sfx('boom');
      scene.shake(180, 0.01);
      steam.emitParticleAt(plat.x, screenY(plat.a) - 6, 18);
      sparks.emitParticleAt(plat.x, screenY(plat.a) - 6, 10);
      scene.popText(plat.x, screenY(plat.a) - 80, 'steam climb', '#ffdca0');
      scene.cameras.main.flash(120, 255, 200, 130);
    } else if (plat.type === 'crumble') {
      plat.breakT = 0.6;
      scene.sfx('tick');
      scene.notice('The shelf is giving way — move.', 1200);
    }
  }

  function hurtLava() {
    if (state.over || state.iFrames > 0) return;
    state.hearts--;
    state.iFrames = 1.4;
    p.a = state.lavaA + 96;
    p.va = 620;
    p.grounded = null;
    scene.sfx('hurt');
    scene.shake(320, 0.018);
    scene.cameras.main.flash(240, 255, 90, 30);
    scene.burst(p.x, screenY(p.a) - 30, 0xff8a3c, 22, { life: 700, gravity: 200, spin: true });
    scene.popText(p.x, screenY(p.a) - 90, 'burned!', '#ffb08a');
    if (state.hearts <= 0) endRun(false);
    else scene.notice(state.hearts === 1 ? 'One more burn and the mountain wins.' : 'The lava caught you. Keep climbing.', 1700);
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    scene.finish(win, {
      score: state.best,
      note: win ? 'The summit cairn is in reach.' : `${state.best} ledges climbed before the heat won`
    });
  }

  const keys = scene.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', space: 'SPACE' });
  scene.input.keyboard.on('keydown-SPACE', () => { holding = true; jump(); });
  scene.input.keyboard.on('keyup-SPACE', () => { holding = false; });
  scene.input.keyboard.on('keydown-UP', jump);

  scene.input.on('pointerdown', (pointer) => {
    holding = true;
    pointerDir = pointer.x < W / 2 ? -1 : 1;
    jump();
  });
  scene.input.on('pointerup', () => { holding = false; pointerDir = 0; });

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'the lava is rising' });
  scene.notice('Climb. The caldera is filling beneath you.', 2400);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.time += dt;
    state.iFrames = Math.max(0, state.iFrames - dt);

    // input
    const kbDir = (keys.left.isDown || keys.a.isDown ? -1 : 0) + (keys.right.isDown || keys.d.isDown ? 1 : 0);
    const dir = kbDir || pointerDir;
    const speed = holding && !p.grounded ? 168 : 300;
    p.vx = approach(p.vx, dir * speed, 2400 * dt);
    if (p.grounded) p.vx = approach(p.vx, 0, 1400 * dt);
    p.x += p.vx * dt;
    if (p.x < 138) { p.x = 138; p.vx = 0; }
    if (p.x > 822) { p.x = 822; p.vx = 0; }

    const prevA = p.a;
    if (p.grounded) {
      const plat = p.grounded;
      if (!plat.solid || Math.abs(p.x - plat.x) > plat.w / 2 + 10) {
        p.grounded = null;
        p.coyote = 0.1;
      } else {
        p.a = plat.a;
        p.va = 0;
      }
    }
    if (!p.grounded) {
      p.coyote = Math.max(0, p.coyote - dt);
      const grav = holding ? CLING_GRAVITY : GRAVITY;
      p.va = Math.max(-920, p.va - grav * dt);
      p.a += p.va * dt;
      if (p.va <= 0) {
        for (const plat of plats) {
          if (!plat.solid) continue;
          if (prevA >= plat.a - 1 && p.a <= plat.a && p.a > plat.a - 30 && Math.abs(p.x - plat.x) < plat.w / 2 + 12) {
            land(plat);
            break;
          }
        }
      }
    }

    // camera follows the climb
    const camTarget = Math.max(0, p.a - 300);
    state.camA += (camTarget - state.camA) * Math.min(1, dt * 4.5);
    if (state.camA < 0) state.camA = 0;

    // generation while the camera climbs
    while (lastA < state.camA + 1100 && nextIndex <= GOAL) addNext();

    // lava
    state.surgeT -= dt;
    if (state.surgeT <= 0) {
      state.surge = 2.8;
      state.surgeT = 15 + r() * 6;
      scene.sfx('drum1');
      scene.shake(260, 0.008);
      scene.notice('The caldera surges. Climb now.', 1700);
    }
    state.surge = Math.max(0, state.surge - dt);
    state.lavaSpeed = 26 + state.best * 0.24 + (state.surge > 0 ? 46 : 0);
    state.lavaA += state.lavaSpeed * dt;
    if (p.a <= state.lavaA + 6) hurtLava();

    // platform poses
    plats.forEach((plat) => {
      if (plat.move && plat.solid) {
        plat.x = plat.baseX + Math.sin(time / 900 + plat.phase) * plat.amp;
      }
      if (plat.breakT > 0) {
        plat.breakT -= dt;
        plat.img.setAngle(Math.sin(time / 30) * 0.06);
        if (plat.breakT <= 0) {
          plat.solid = false;
          if (p.grounded === plat) p.grounded = null;
          scene.sfx('hurt');
          scene.burst(plat.x, screenY(plat.a) + 20, 0x9c8478, 16, { life: 700, gravity: 340, spin: true });
          scene.tweens.add({
            targets: plat.img, y: plat.img.y + 260, alpha: 0, angle: 26, duration: 900, ease: 'cubic.in',
            onComplete: () => plat.img.destroy()
          });
        }
      }
      plat.img.x = plat.x;
      plat.img.y = screenY(plat.a);
      plat.img.setVisible(plat.img.y < M.H + 90 && plat.img.y > -200);
    });

    // lava visuals
    const lavaY = Math.max(-40, screenY(state.lavaA));
    lava.y = lavaY;
    lava.tilePositionX = time * 0.03;
    lava.setVisible(lavaY < M.H);
    lavaGlow.y = lavaY;
    lavaGlow.setVisible(lavaY < M.H + 40);
    heat.y = M.H;
    const near = clamp(1 - (p.a - state.lavaA) / 260, 0, 1);
    heat.setFillStyle(0xff7a30, 0.06 + near * 0.16);
    state.overHeat = near;
    leftWall.tilePositionY = -state.camA * 0.9;
    rightWall.tilePositionY = -state.camA * 0.9;

    if (Math.random() < dt * 9 && lavaY < M.H) {
      sparks.emitParticleAt(r() * W, lavaY + 4, 1);
    }

    // hero
    const airborne = !p.grounded;
    const tex = airborne ? 've-player-leap' : 've-player-run';
    if (player.texture.key !== tex) player.setTexture(tex);
    player.x = p.x;
    player.y = screenY(p.a);
    player.setFlipX(p.vx < -20 ? true : p.vx > 20 ? false : player.flipX);
    player.setScale((0.72 + (p.grounded ? Math.sin(time / 150) * 0.006 : 0.02)) * K, (holding && airborne ? 0.86 : 0.72) * K);
    player.setRotation(airborne ? clamp(p.va / 4200, -0.18, 0.18) : Math.sin(time / 220) * 0.02);
    player.setAlpha(state.iFrames > 0 && Math.floor(time / 70) % 2 ? 0.4 : 1);
    playerGlow.x = p.x;
    playerGlow.y = player.y - 42 * K;
    playerGlow.setAlpha(0.16 + state.overHeat * 0.24);

    if (airborne && p.va < -300 && Math.random() < dt * 7) dust.emitParticleAt(p.x, player.y - 4, 1);
    if (p.grounded && Math.abs(p.vx) > 40 && Math.random() < dt * 4) dust.emitParticleAt(p.x - 10 * p.face, player.y, 1);

    scene.hud({
      score: state.best,
      progress: Math.min(1, state.best / GOAL),
      hearts: state.hearts,
      extra: state.surge > 0 ? 'surge!' : holding && airborne ? 'clinging' : near > 0.55 ? 'lava close' : ''
    });
    scene.audio.setTension(0.2 + state.overHeat * 0.5);
  }

  return {
    update,
    jump,
    state: () => ({
      best: state.best, hearts: state.hearts, a: Math.round(p.a), x: Math.round(p.x),
      grounded: !!p.grounded, va: Math.round(p.va), camA: Math.round(state.camA),
      lavaA: Math.round(state.lavaA), over: state.over,
      platforms: plats.filter((o) => o.solid).map((o) => ({ i: o.index, x: Math.round(o.x), a: Math.round(o.a), type: o.type }))
    }),
    setBest: (v) => { state.best = v; },
    setHearts: (v) => { state.hearts = v; },
    setPlayer: (x, a) => { p.x = x; p.a = a; p.va = 0; p.grounded = null; },
    setLava: (a) => { state.lavaA = a; },
    setCam: (a) => { state.camA = a; },
    place: (index) => {
      const plat = plats.find((o) => o.index === index && o.solid);
      if (plat) { p.x = plat.x; p.a = plat.a + 1; p.va = -1; p.grounded = null; }
      return plat;
    },
    clearLava: () => { state.lavaA = Math.min(state.lavaA, p.a - 600); }
  };
}

export default { id: 'volcano-escape', stars: STAR, backdropOpts: { ground: false }, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
