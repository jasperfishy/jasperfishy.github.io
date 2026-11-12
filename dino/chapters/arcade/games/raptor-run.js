// Raptor Run — the fern corridor.
// A finite sprint: reach the nesting grounds before the light fails, leaping
// logs, ducking branches and gathering shed feathers for a tailwind.

import { canvasTex, grain, rng, clamp, W } from '../engine.js?v=du-316e7af9b57fa08e';

const GROUND = 430;
const TARGET = 9600;
const GRAVITY = 2650;
const STAR = [450, 720, 960];

function raptorArt(scene) {
  const frames = ['a', 'b', 'jump', 'slide'];
  frames.forEach((frame) => {
    canvasTex(scene, 'rr-raptor-' + frame, 190, 132, (c) => {
      const rand = rng(77);
      const slide = frame === 'slide';
      const air = frame === 'jump';
      const lift = slide ? 22 : 0;
      const bodyY = 66 + lift;
      const body = c.createLinearGradient(40, bodyY - 26, 138, bodyY + 30);
      body.addColorStop(0, '#6f9b72');
      body.addColorStop(0.55, '#4c7a5d');
      body.addColorStop(1, '#325544');

      // tail
      c.strokeStyle = '#48745a';
      c.lineWidth = 13;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(52, bodyY + 8);
      c.quadraticCurveTo(20, bodyY - 6, 8, bodyY - 26);
      c.stroke();
      c.strokeStyle = '#2f5042';
      c.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(42 - i * 8, bodyY + 4 - i * 4);
        c.lineTo(34 - i * 8, bodyY - 8 - i * 4);
        c.stroke();
      }

      // body
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(88, bodyY + 2, 46, 26, -0.08, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(185,205,150,0.55)';
      c.beginPath();
      c.ellipse(94, bodyY + 14, 32, 11, -0.05, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(28,54,44,0.5)';
      c.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(68 + i * 12, bodyY - 8 + i * 1.5);
        c.quadraticCurveTo(74 + i * 12, bodyY + 2, 70 + i * 12, bodyY + 12);
        c.stroke();
      }

      // neck + head
      c.strokeStyle = '#5d8a6a';
      c.lineWidth = 17;
      c.beginPath();
      c.moveTo(120, bodyY - 6);
      c.quadraticCurveTo(134, bodyY - 18, 144, bodyY - 22);
      c.stroke();
      c.fillStyle = '#67956f';
      c.beginPath();
      c.ellipse(150, bodyY - 24, 22, 14, -0.18, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(160, bodyY - 30);
      c.quadraticCurveTo(184, bodyY - 26, 186, bodyY - 18);
      c.quadraticCurveTo(176, bodyY - 10, 160, bodyY - 14);
      c.closePath();
      c.fill();
      c.fillStyle = '#1c2f2a';
      c.beginPath();
      c.moveTo(164, bodyY - 22);
      c.quadraticCurveTo(178, bodyY - 21, 183, bodyY - 19);
      c.quadraticCurveTo(176, bodyY - 16, 166, bodyY - 17);
      c.closePath();
      c.fill();

      // eye
      c.fillStyle = '#f7edd2';
      c.beginPath(); c.arc(152, bodyY - 27, 5.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#12231f';
      c.beginPath(); c.arc(153.4, bodyY - 27, 2.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.beginPath(); c.arc(151.8, bodyY - 28.6, 1.1, 0, Math.PI * 2); c.fill();

      // crest feathers
      c.strokeStyle = '#d78f4a';
      c.lineWidth = 3.4;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(140 + i * 3, bodyY - 34);
        c.quadraticCurveTo(130 + i * 2, bodyY - 48 - i * 3, 118 + i * 2, bodyY - 52 - i * 3);
        c.stroke();
      }

      // little arms
      c.strokeStyle = '#406b52';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(120, bodyY + 6);
      c.quadraticCurveTo(130, bodyY + 12, 133, bodyY + 4);
      c.stroke();
      c.strokeStyle = '#e6d6a8';
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(133, bodyY + 4); c.lineTo(137, bodyY + 1); c.stroke();

      // legs
      const legs = slide
        ? [[90, 104, 128, 120], [96, 104, 134, 116]]
        : air
          ? [[92, 96, 78, 108], [84, 96, 96, 112]]
          : frame === 'a'
            ? [[94, bodyY + 22, 116, 126], [82, bodyY + 22, 58, 126]]
            : [[94, bodyY + 22, 62, 126], [82, bodyY + 22, 108, 126]];
      legs.forEach(([hx, hy, fx, fy], i) => {
        c.strokeStyle = i ? '#3d6650' : '#54805f';
        c.lineWidth = 9;
        c.beginPath();
        c.moveTo(hx, hy);
        c.quadraticCurveTo((hx + fx) / 2 + 8, (hy + fy) / 2, fx, fy);
        c.stroke();
        c.strokeStyle = '#e6d6a8';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(fx, fy);
        c.lineTo(fx + 11, fy + (i ? -1 : 2));
        c.moveTo(fx, fy);
        c.lineTo(fx + 7, fy + 5);
        c.stroke();
      });

      // soft back light
      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(30, 30, 160, 120);
      rim.addColorStop(0, 'rgba(255,226,160,0.26)');
      rim.addColorStop(0.5, 'rgba(255,226,160,0)');
      c.fillStyle = rim;
      c.fillRect(0, 0, 190, 132);
      c.globalCompositeOperation = 'source-over';
      grain(c, 190, 132, 0.03, 7 + rand() * 10);
    });
  });
}

function propArt(scene) {
  canvasTex(scene, 'rr-log', 170, 64, (c) => {
    const g = c.createLinearGradient(0, 10, 0, 54);
    g.addColorStop(0, '#7a5a3c');
    g.addColorStop(1, '#3f2c1e');
    c.fillStyle = g;
    c.beginPath(); c.roundRect(6, 14, 158, 40, 18); c.fill();
    c.fillStyle = '#8d6a46';
    c.beginPath(); c.ellipse(14, 34, 11, 19, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(40,26,16,0.7)';
    c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      c.beginPath(); c.moveTo(30 + i * 22, 20); c.lineTo(22 + i * 22, 48); c.stroke();
    }
    c.fillStyle = '#4f7a4a';
    for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(34 + i * 28, 15, 12, 5, -0.2, 0, Math.PI * 2); c.fill(); }
    grain(c, 170, 64, 0.05, 9);
  });

  canvasTex(scene, 'rr-rock', 112, 88, (c) => {
    const g = c.createLinearGradient(18, 8, 92, 84);
    g.addColorStop(0, '#8b9084');
    g.addColorStop(0.55, '#636b62');
    g.addColorStop(1, '#3d4742');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(10, 82); c.quadraticCurveTo(2, 52, 22, 30);
    c.quadraticCurveTo(46, 4, 78, 16); c.quadraticCurveTo(106, 30, 102, 62);
    c.quadraticCurveTo(98, 84, 70, 86); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(24,34,30,0.55)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(30, 66); c.quadraticCurveTo(48, 44, 40, 24); c.stroke();
    c.beginPath(); c.moveTo(64, 82); c.quadraticCurveTo(72, 54, 92, 42); c.stroke();
    c.fillStyle = '#51814f';
    for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(30 + i * 17, 18 + (i % 2) * 3, 13, 5, 0.2, 0, Math.PI * 2); c.fill(); }
    grain(c, 112, 88, 0.05, 19);
  });

  canvasTex(scene, 'rr-branch', 200, 150, (c) => {
    c.strokeStyle = '#4a3a27';
    c.lineWidth = 12;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(100, -6); c.quadraticCurveTo(94, 54, 108, 88); c.stroke();
    c.lineWidth = 7;
    c.beginPath(); c.moveTo(102, 40); c.quadraticCurveTo(60, 36, 34, 58); c.stroke();
    c.beginPath(); c.moveTo(104, 58); c.quadraticCurveTo(146, 52, 176, 76); c.stroke();
    c.fillStyle = '#3e6b4b';
    for (let i = 0; i < 14; i++) {
      const x = 20 + (i * 53) % 164, y = 26 + (i * 37) % 92;
      c.beginPath(); c.ellipse(x, y, 12, 5, i * 0.7, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#6a9a63';
    for (let i = 0; i < 7; i++) {
      const x = 30 + (i * 71) % 150, y = 34 + (i * 43) % 84;
      c.beginPath(); c.ellipse(x, y, 7, 3, i * 0.9, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = '#37604a';
    c.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      c.beginPath(); c.moveTo(40 + i * 24, 60 + (i % 3) * 12); c.quadraticCurveTo(44 + i * 24, 92, 38 + i * 24, 110); c.stroke();
    }
    grain(c, 200, 150, 0.04, 29);
  });

  canvasTex(scene, 'rr-feather', 34, 58, (c) => {
    c.strokeStyle = '#c98a36';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(17, 54); c.quadraticCurveTo(16, 22, 12, 6); c.stroke();
    const g = c.createLinearGradient(0, 0, 30, 48);
    g.addColorStop(0, '#ffe6a3');
    g.addColorStop(1, '#e09a43');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(13, 4);
    c.quadraticCurveTo(34, 18, 26, 40);
    c.quadraticCurveTo(20, 48, 17, 54);
    c.quadraticCurveTo(12, 34, 6, 22);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(150,90,30,0.5)';
    c.lineWidth = 1;
    for (let i = 1; i < 7; i++) {
      c.beginPath(); c.moveTo(15, 6 + i * 7); c.lineTo(8 + i * 2.1, 12 + i * 5.4); c.stroke();
    }
  });

  canvasTex(scene, 'rr-fern', 150, 210, (c) => {
    c.strokeStyle = '#2f5c44';
    c.lineWidth = 4;
    c.lineCap = 'round';
    for (let f = 0; f < 5; f++) {
      const a = -1.15 + f * 0.34;
      c.save();
      c.translate(75, 208);
      c.rotate(a * 0.32);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(f * 4 - 8, -90, f * 10 - 20, -176 - (f % 2) * 18);
      c.stroke();
      for (let i = 1; i < 9; i++) {
        const t = i / 9;
        const x = (f * 10 - 20) * t * t * 0.5 + (f * 4 - 8) * t;
        const y = -176 * t;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x - 14, y - 6, x - 25 + i, y - 18);
        c.stroke();
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + 14, y - 6, x + 25 - i, y - 18);
        c.stroke();
      }
      c.restore();
    }
    grain(c, 150, 210, 0.03, 41);
  });

  canvasTex(scene, 'rr-trunk', 96, 430, (c) => {
    const g = c.createLinearGradient(20, 0, 90, 0);
    g.addColorStop(0, '#2e463b');
    g.addColorStop(0.55, '#3d5b47');
    g.addColorStop(1, '#22362f');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(22, 430); c.quadraticCurveTo(10, 280, 26, 150);
    c.quadraticCurveTo(38, 30, 52, 0); c.lineTo(92, 0);
    c.quadraticCurveTo(70, 220, 82, 430); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(16,30,25,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      c.beginPath(); c.moveTo(34 + i * 7, 20); c.quadraticCurveTo(26 + i * 8, 220, 46 + i * 7, 420); c.stroke();
    }
    c.fillStyle = '#3c6b4c';
    for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(36 + i * 12, 80 + i * 52, 16, 6, -0.3, 0, Math.PI * 2); c.fill(); }
    grain(c, 96, 430, 0.04, 51);
  });
}

function create(scene) {
  const M = scene.M;
  raptorArt(scene);
  propArt(scene);

  const r = rng(2026);
  const state = {
    travel: 0, speed: 330, hearts: 3, invuln: 0, feathers: 0,
    score: 0, over: false, wind: 0
  };
  const p = {
    x: 250, feet: GROUND, vy: 0, onGround: true, jumps: 0,
    slide: 0, coyote: 0, visual: 0
  };

  // ground scar line + parallax dressing
  const mid = scene.add.container(0, 0).setDepth(2);
  const ferns = [], trunks = [], lines = [];
  for (let i = 0; i < 7; i++) {
    const f = scene.add.image(r() * W, M.Y(GROUND) + 6, 'rr-fern').setOrigin(0.5, 1).setAlpha(0.55 + r() * 0.25);
    f.setScale(0.5 + r() * 0.4);
    f._x = r() * W; f._depth = 0.22 + r() * 0.1;
    mid.add(f); ferns.push(f);
  }
  for (let i = 0; i < 4; i++) {
    const t = scene.add.image(r() * W, M.Y(GROUND) + 10, 'rr-trunk').setOrigin(0.5, 1).setAlpha(0.4);
    t.setScale(0.7 + r() * 0.5);
    t._x = r() * W; t._depth = 0.12 + r() * 0.08;
    mid.add(t); trunks.push(t);
  }
  for (let i = 0; i < 7; i++) {
    const l = scene.add.rectangle(700 + r() * 260, M.Y(60 + r() * 300), 1 + r() * 2, 40 + r() * 120, 0xf6ecd6, 0)
      .setDepth(3);
    l._speed = 1.2 + r() * 0.8;
    lines.push(l);
  }

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 20, max: 110 }, angle: { min: 200, max: 340 },
    lifespan: { min: 260, max: 520 }, scale: { start: 0.44, end: 0 },
    alpha: { start: 0.55, end: 0 }, tint: 0xd9c9a0, gravityY: 160, emitting: false
  }).setDepth(5);
  const leaves = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 40, max: 150 }, lifespan: 700, scale: { start: 0.4, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0x7fb86a, gravityY: 260, emitting: false
  }).setDepth(5);

  const K = scene.k;
  const player = scene.add.image(p.x, M.Y(p.feet), 'rr-raptor-a').setOrigin(0.5, 1).setDepth(10);
  player.setScale(1.02 * K);

  const obstacles = [];
  const pickups = [];
  let nextSpawn = 900;
  let lastKind = '';

  function spawnObstacle() {
    const progress = state.travel / TARGET;
    const roll = r();
    let kind = 'log';
    if (progress > 0.12) {
      if (roll < 0.4) kind = 'log';
      else if (roll < 0.72) kind = 'rock';
      else kind = 'branch';
    }
    if (kind === 'branch' && (lastKind === 'log' || lastKind === 'rock')) kind = r() < 0.5 ? 'log' : 'rock';
    const x = W + 150;
    let img, box;
    if (kind === 'log') {
      img = scene.add.image(x, M.Y(GROUND) + 4, 'rr-log').setOrigin(0.5, 1).setDepth(8);
      box = { hw: 66, top: GROUND - 52, bottom: GROUND + 2 };
    } else if (kind === 'rock') {
      img = scene.add.image(x, M.Y(GROUND) + 4, 'rr-rock').setOrigin(0.5, 1).setDepth(8);
      box = { hw: 42, top: GROUND - 70, bottom: GROUND + 2 };
    } else {
      img = scene.add.image(x, M.Y(GROUND - 42), 'rr-branch').setOrigin(0.5, 1).setDepth(8);
      box = { hw: 78, top: GROUND - 138, bottom: GROUND - 48 };
    }
    obstacles.push({ kind, img, x, box, hit: false });
    lastKind = kind;
    nextSpawn = 330 + r() * 300 + (kind === 'branch' ? 120 : 0);
  }

  function spawnFeathers() {
    const count = 3 + Math.floor(r() * 3);
    const baseX = W + 120;
    const high = r() < 0.4;
    const baseY = high ? GROUND - 210 - r() * 70 : GROUND - 110 - r() * 60;
    for (let i = 0; i < count; i++) {
      const x = baseX + i * 54;
      const y = baseY + Math.sin(i * 0.8) * 26;
      const img = scene.add.image(x, M.Y(y), 'rr-feather').setDepth(9).setScale(0.86 * K);
      scene.tweens.add({ targets: img, angle: { from: -8, to: 8 }, duration: 900 + i * 90, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      pickups.push({ img, x, y, taken: false, phase: r() * 6 });
    }
  }

  function jump() {
    if (state.over) return;
    if (p.onGround || p.coyote > 0) {
      p.vy = -900; p.onGround = false; p.coyote = 0; p.jumps = 1; p.slide = 0;
      scene.sfx('jump');
      dust.emitParticleAt(p.x - 18, M.Y(p.feet), 7);
    } else if (p.jumps < 2) {
      p.vy = -800; p.jumps = 2;
      scene.sfx('whoosh');
      scene.burst(p.x, M.Y(p.feet - 80), 0xffe0a0, 9, { life: 420 });
    }
  }

  function slide() {
    if (state.over) return;
    if (p.onGround) {
      p.slide = 0.56;
      scene.sfx('land');
      dust.emitParticleAt(p.x - 26, M.Y(p.feet), 9);
    } else {
      p.vy = Math.max(p.vy, 900);
    }
  }

  function hurt() {
    if (state.invuln > 0 || state.over) return;
    state.hearts--;
    state.invuln = 1.15;
    state.speed = Math.max(300, state.speed - 55);
    scene.sfx('hurt');
    scene.shake(220, 0.012);
    scene.cameras.main.flash(180, 120, 30, 20);
    scene.popText(p.x, M.Y(p.feet - 110), 'a feather lost', '#ff9a7a');
    if (state.hearts <= 0) endRun(false);
    else scene.notice(state.hearts === 1 ? 'One feather left. The nest is close.' : 'A branch caught you. Keep low.', 1600);
  }

  function collect(item) {
    item.taken = true;
    item.img.destroy();
    state.feathers++;
    state.score = Math.floor(state.travel / 10) + state.feathers * 15;
    scene.sfx('pick');
    scene.burst(item.img.x, item.img.y, 0xffd77a, 7, { life: 420 });
    scene.popText(item.img.x, item.img.y - 12, '+15', '#ffe6a8');
    if (state.feathers % 5 === 0) {
      state.wind = 2.4;
      scene.notice('Tailwind — the corridor opens.', 1400);
      scene.sfx('whoosh');
    }
  }

  function endRun(win) {
    state.over = true;
    const score = Math.floor(state.travel / 10) + state.feathers * 15;
    scene.finish(win, {
      score,
      note: win ? `${state.feathers} feathers gathered` : `${Math.floor(state.travel / 10)} paces run`
    });
  }

  const keys = scene.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', space: 'SPACE', w: 'W', s: 'S'
  });
  scene.input.keyboard.on('keydown-UP', jump);
  scene.input.keyboard.on('keydown-W', jump);
  scene.input.keyboard.on('keydown-SPACE', jump);
  scene.input.keyboard.on('keydown-DOWN', slide);
  scene.input.keyboard.on('keydown-S', slide);

  let pointerStart = 0;
  scene.input.on('pointerdown', (pointer) => {
    pointerStart = pointer.y;
    if (pointer.y > M.H * 0.66) slide(); else jump();
  });
  scene.input.on('pointermove', (pointer) => {
    if (!pointer.isDown) return;
    if (pointer.y - pointerStart > 34) slide();
  });

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: '' });
  scene.notice('Follow the corridor to the nesting grounds.', 2100);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;

    state.speed = 330 + (state.travel / TARGET) * 250 + (state.wind > 0 ? 70 : 0);
    state.wind = Math.max(0, state.wind - dt);
    state.travel += state.speed * dt;
    if (state.invuln > 0) state.invuln -= dt;
    if (p.slide > 0) p.slide -= dt;

    // physics
    if (!p.onGround) {
      p.vy += GRAVITY * dt;
      p.feet += p.vy * dt;
      if (p.feet >= GROUND) {
        p.feet = GROUND; p.vy = 0; p.onGround = true; p.jumps = 0;
        scene.sfx('land');
        dust.emitParticleAt(p.x - 10, M.Y(p.feet), 6);
      }
    } else {
      p.coyote = 0.09;
    }
    if (!p.onGround) p.coyote = Math.max(0, p.coyote - dt);

    // animation + pose
    const sliding = p.slide > 0 && p.onGround;
    const tex = sliding ? 'rr-raptor-slide' : (!p.onGround ? 'rr-raptor-jump' : (Math.floor(time / 95) % 2 ? 'rr-raptor-b' : 'rr-raptor-a'));
    if (player.texture.key !== tex) player.setTexture(tex);
    player.y = M.Y(p.feet);
    player.x = p.x;
    player.rotation = p.onGround ? (sliding ? 0.03 : Math.sin(time / 110) * 0.012) : clamp(p.vy / 5000, -0.2, 0.2);
    player.setAlpha(state.invuln > 0 && Math.floor(time / 70) % 2 ? 0.35 : 1);
    if (sliding && p.onGround && Math.random() < 0.28) dust.emitParticleAt(p.x - 30, M.Y(p.feet), 1);

    // parallax
    ferns.forEach((f) => {
      f._x -= state.speed * f._depth * dt;
      if (f._x < -120) f._x = W + 120 + r() * 80;
      f.x = f._x;
    });
    trunks.forEach((t) => {
      t._x -= state.speed * t._depth * dt;
      if (t._x < -140) { t._x = W + 160 + r() * 120; t.y = M.Y(GROUND) + 10; }
      t.x = t._x;
    });
    lines.forEach((l) => {
      l.alpha = state.speed > 470 ? 0.1 + r() * 0.08 : 0;
      if (l.alpha > 0) {
        l.x -= state.speed * l._speed * dt;
        if (l.x < 620) { l.x = W + r() * 80; l.y = M.Y(40 + r() * 330); }
      }
    });

    // spawn
    nextSpawn -= state.speed * dt;
    if (nextSpawn <= 0) {
      spawnObstacle();
      if (r() < 0.34) spawnFeathers();
    }

    // obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= state.speed * dt;
      o.img.x = o.x;
      if (!o.hit && state.invuln <= 0) {
        const hw = sliding ? 28 : 24;
        const top = sliding ? p.feet - 30 : p.feet - 64;
        const bottom = p.feet;
        if (Math.abs(o.x - p.x) < o.box.hw + hw && bottom > o.box.top && top < o.box.bottom) {
          o.hit = true;
          hurt();
        }
      }
      if (o.x < -220) {
        o.img.destroy();
        obstacles.splice(i, 1);
      }
    }

    // feathers
    for (let i = pickups.length - 1; i >= 0; i--) {
      const it = pickups[i];
      it.x -= state.speed * dt;
      it.img.x = it.x;
      it.img.y = M.Y(it.y + Math.sin(time / 420 + it.phase) * 6);
      if (!it.taken && Math.abs(it.x - p.x) < 42 && Math.abs(it.img.y - M.Y(p.feet - 46)) < 70) collect(it);
      if (it.x < -60) { if (!it.taken) it.img.destroy(); pickups.splice(i, 1); }
    }

    // leaves kicked from ferns
    if (Math.random() < dt * 7) leaves.emitParticleAt(140 + r() * 620, M.Y(GROUND - 30 - r() * 120), 1);

    state.score = Math.floor(state.travel / 10) + state.feathers * 15;
    scene.hud({
      score: state.score,
      progress: Math.min(1, state.travel / TARGET),
      hearts: state.hearts,
      extra: state.hearts === 1 ? 'last feather' : ''
    });
    scene.audio.setTension(clamp(state.speed / 620, 0, 1) * 0.7);

    if (state.travel >= TARGET) endRun(true);
  }

  return {
    update,
    jump,
    slide,
    state: () => ({
      travel: Math.round(state.travel), speed: Math.round(state.speed), hearts: state.hearts,
      feathers: state.feathers, score: state.score, over: state.over,
      feet: Math.round(p.feet), onGround: p.onGround, slide: p.slide > 0,
      obstacles: obstacles.map((o) => ({ kind: o.kind, x: Math.round(o.x), hit: o.hit })),
      pickups: pickups.map((it) => ({ x: Math.round(it.x), taken: it.taken }))
    }),
    setTravel: (v) => { state.travel = v; },
    setHearts: (v) => { state.hearts = v; },
    setInvuln: (v) => { state.invuln = v; },
    spawn: (kind) => {
      const x = W - 40;
      if (kind === 'branch') {
        const img = scene.add.image(x, M.Y(GROUND - 42), 'rr-branch').setOrigin(0.5, 1).setDepth(8);
        obstacles.push({ kind, img, x, box: { hw: 78, top: GROUND - 138, bottom: GROUND - 48 }, hit: false });
      } else if (kind === 'rock') {
        const img = scene.add.image(x, M.Y(GROUND) + 4, 'rr-rock').setOrigin(0.5, 1).setDepth(8);
        obstacles.push({ kind, img, x, box: { hw: 42, top: GROUND - 70, bottom: GROUND + 2 }, hit: false });
      } else {
        const img = scene.add.image(x, M.Y(GROUND) + 4, 'rr-log').setOrigin(0.5, 1).setDepth(8);
        obstacles.push({ kind, img, x, box: { hw: 66, top: GROUND - 52, bottom: GROUND + 2 }, hit: false });
      }
    },
    clearObstacles: () => { obstacles.forEach((o) => o.img.destroy()); obstacles.length = 0; },
    clearPickups: () => { pickups.forEach((it) => it.img.destroy()); pickups.length = 0; }
  };
}

export default { id: 'raptor-run', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
