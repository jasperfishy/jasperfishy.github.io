// Pterosaur Plunge — the bright reef.
// The water is full of silver and the air is full of clock. Dive, feed, rise.

import { canvasTex, grain, rng, clamp, lerp, W } from '../engine.js?v=du-a1454ea5250e1aa0';

const SURFACE = 84;
const FLOOR = 512;
const GOAL = 14;
const STAR = [6, 10, 14];
const swimY = (v) => clamp(v, SURFACE + 26, FLOOR - 24);

function art(scene) {
  ['up', 'down'].forEach((frame) => {
    canvasTex(scene, 'pp-ptero-' + frame, 210, 150, (c) => {
      const flap = frame === 'up' ? -26 : 18;
      // far wing
      c.fillStyle = 'rgba(38,94,104,0.75)';
      c.beginPath();
      c.moveTo(96, 74);
      c.quadraticCurveTo(40, 40 + flap, 8, 58 + flap);
      c.quadraticCurveTo(48, 92, 96, 88);
      c.closePath(); c.fill();

      // tail
      c.strokeStyle = '#2d6c74';
      c.lineWidth = 7;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(58, 82); c.quadraticCurveTo(32, 92, 16, 88); c.stroke();
      c.fillStyle = '#1f4f57';
      c.beginPath(); c.moveTo(16, 88); c.lineTo(2, 78); c.lineTo(10, 94); c.closePath(); c.fill();

      // body
      const body = c.createLinearGradient(50, 50, 160, 120);
      body.addColorStop(0, '#6fc0c2');
      body.addColorStop(0.5, '#3f9199');
      body.addColorStop(1, '#256a74');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(112, 82, 54, 30, -0.08, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(214,247,240,0.35)';
      c.beginPath(); c.ellipse(116, 96, 40, 12, -0.05, 0, Math.PI * 2); c.fill();

      // neck + head
      c.strokeStyle = '#58a7ab';
      c.lineWidth = 14;
      c.beginPath(); c.moveTo(152, 70); c.quadraticCurveTo(166, 58, 172, 50); c.stroke();
      c.fillStyle = '#6db9bb';
      c.beginPath(); c.ellipse(180, 46, 20, 13, -0.22, 0, Math.PI * 2); c.fill();

      // crest
      c.fillStyle = '#f2a65e';
      c.beginPath();
      c.moveTo(176, 34);
      c.quadraticCurveTo(158, 14, 138, 16);
      c.quadraticCurveTo(158, 28, 168, 42);
      c.closePath(); c.fill();

      // beak
      c.fillStyle = '#e9d9ac';
      c.beginPath();
      c.moveTo(194, 42);
      c.quadraticCurveTo(232, 50, 226, 58);
      c.quadraticCurveTo(218, 55, 194, 54);
      c.closePath(); c.fill();

      // eye
      c.fillStyle = '#ffefc4';
      c.beginPath(); c.arc(184, 44, 4.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#10262a';
      c.beginPath(); c.arc(185.4, 44, 2.3, 0, Math.PI * 2); c.fill();

      // near wing
      const wing = c.createLinearGradient(70, 40, 130, 120);
      wing.addColorStop(0, 'rgba(127,201,200,0.95)');
      wing.addColorStop(1, 'rgba(43,111,119,0.95)');
      c.fillStyle = wing;
      c.beginPath();
      c.moveTo(102, 74);
      c.quadraticCurveTo(58, 36 + flap, 12, 44 + flap);
      c.quadraticCurveTo(40, 82 + flap * 0.4, 94, 94);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,62,70,0.55)';
      c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(98, 80);
        c.quadraticCurveTo(62 - i * 4, 56 + flap + i * 8, 22 + i * 8, 46 + flap + i * 14);
        c.stroke();
      }

      // little feet
      c.strokeStyle = '#2b6b70';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(104, 108); c.quadraticCurveTo(98, 122, 90, 126); c.stroke();
      c.beginPath(); c.moveTo(122, 110); c.quadraticCurveTo(128, 124, 136, 126); c.stroke();

      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(40, 20, 190, 130);
      rim.addColorStop(0, 'rgba(210,255,250,0.3)');
      rim.addColorStop(0.5, 'rgba(210,255,250,0)');
      c.fillStyle = rim; c.fillRect(0, 0, 210, 150);
      c.globalCompositeOperation = 'source-over';
      grain(c, 210, 150, 0.03, 17);
    });
  });

  ['silver', 'gold', 'blue'].forEach((tone, ti) => {
    canvasTex(scene, 'pp-fish-' + tone, 58, 34, (c) => {
      const pal = [['#e8f4ee', '#9fc4c0'], ['#ffd98f', '#d7954f'], ['#a9d6ff', '#5c9ecd']][ti];
      const g = c.createLinearGradient(6, 4, 52, 30);
      g.addColorStop(0, pal[0]);
      g.addColorStop(1, pal[1]);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(50, 17);
      c.quadraticCurveTo(30, 2, 12, 8);
      c.quadraticCurveTo(2, 17, 12, 26);
      c.quadraticCurveTo(30, 32, 50, 17);
      c.closePath(); c.fill();
      c.fillStyle = pal[1];
      c.beginPath(); c.moveTo(10, 17); c.lineTo(1, 5); c.lineTo(3, 17); c.lineTo(1, 29); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.45)';
      c.beginPath(); c.ellipse(30, 12, 13, 3.4, -0.1, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#173038';
      c.beginPath(); c.arc(43, 15, 1.8, 0, Math.PI * 2); c.fill();
    });
  });

  canvasTex(scene, 'pp-jelly', 84, 104, (c) => {
    const bell = c.createRadialGradient(42, 34, 2, 42, 34, 38);
    bell.addColorStop(0, 'rgba(214,190,255,0.7)');
    bell.addColorStop(0.7, 'rgba(160,130,230,0.45)');
    bell.addColorStop(1, 'rgba(120,90,200,0.08)');
    c.fillStyle = bell;
    c.beginPath(); c.ellipse(42, 34, 34, 26, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(235,220,255,0.6)';
    c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(42, 34, 28, 20, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(210,180,255,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = 18 + i * 8;
      c.beginPath();
      c.moveTo(x, 50);
      c.quadraticCurveTo(x + Math.sin(i) * 8, 76, x + Math.cos(i * 2) * 6, 100);
      c.stroke();
    }
  });

  canvasTex(scene, 'pp-kelp', 100, 260, (c) => {
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const x = 24 + i * 14;
      const g = c.createLinearGradient(x, 260, x, 0);
      g.addColorStop(0, '#2c5a44');
      g.addColorStop(1, '#5f9a63');
      c.strokeStyle = g;
      c.lineWidth = 5 - i * 0.5;
      c.beginPath();
      c.moveTo(x, 260);
      c.quadraticCurveTo(x - 22 + i * 6, 170, x + 6, 80 - i * 8);
      c.stroke();
      for (let j = 0; j < 5; j++) {
        const t = j / 5;
        const lx = x - 22 * t + i * 6 * t, ly = 260 - 180 * t;
        c.strokeStyle = i % 2 ? '#4c8557' : '#376b4a';
        c.lineWidth = 3.4;
        c.beginPath();
        c.moveTo(lx, ly);
        c.quadraticCurveTo(lx - 18, ly - 6, lx - 24, ly - 20);
        c.stroke();
      }
    }
    grain(c, 100, 260, 0.03, 47);
  });

  canvasTex(scene, 'pp-rock', 190, 150, (c) => {
    const g = c.createLinearGradient(20, 10, 170, 140);
    g.addColorStop(0, '#3d6d70');
    g.addColorStop(1, '#16393e');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(8, 148); c.quadraticCurveTo(0, 80, 38, 44);
    c.quadraticCurveTo(80, 4, 138, 24); c.quadraticCurveTo(190, 48, 182, 108);
    c.quadraticCurveTo(176, 148, 130, 148); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,190,180,0.12)';
    c.beginPath(); c.ellipse(70, 40, 44, 12, -0.3, 0, Math.PI * 2); c.fill();
    grain(c, 190, 150, 0.04, 53);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene);
  const r = rng(7331);

  const state = {
    fish: 0, hearts: 3, breath: 1, deep: 0, over: false, combo: 0,
    iFrames: 0, jellyT: 3.2, spawnT: 0.4
  };
  const p = { x: 360, y: 150, tx: 360, ty: 150, flap: 0, dash: 0 };

  // light shafts
  const shafts = [];
  for (let i = 0; i < 5; i++) {
    const sh = scene.add.rectangle(110 + i * 180, M.Y(SURFACE), 90 + r() * 60, M.Y(FLOOR) - M.Y(SURFACE), 0xd6fbff, 0.045)
      .setOrigin(0.5, 0).setDepth(1).setAngle(-7).setBlendMode(Phaser.BlendModes.ADD);
    sh._ph = r() * 6;
    shafts.push(sh);
  }

  // depth veil
  const veil = scene.add.rectangle(0, M.Y(SURFACE), W, M.Y(FLOOR) - M.Y(SURFACE), 0x04222e, 0)
    .setOrigin(0, 0).setDepth(2);

  // seabed rocks and kelp
  for (let i = 0; i < 3; i++) {
    scene.add.image(90 + i * 340, M.Y(FLOOR + 6), 'pp-rock').setOrigin(0.5, 1).setDepth(3)
      .setScale((0.8 + r() * 0.5) * K).setAlpha(0.9).setTint(0x7fa6a8);
  }
  const kelp = [];
  for (let i = 0; i < 8; i++) {
    const k = scene.add.image(30 + r() * (W - 60), M.Y(FLOOR + 8), 'pp-kelp').setOrigin(0.5, 1)
      .setDepth(4 + (i % 3)).setScale((0.7 + r() * 0.6) * K).setAlpha(0.82);
    k._ph = r() * 6;
    kelp.push(k);
  }

  const bubbles = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 20, max: 60 }, angle: { min: 250, max: 290 },
    lifespan: { min: 900, max: 1700 }, scale: { start: 0.28, end: 0.06 },
    alpha: { start: 0.5, end: 0 }, tint: 0xd9fbff, frequency: 260, quantity: 1,
    emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(60, 100, W - 120, 380) }
  }).setDepth(5);

  const trail = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 6, max: 30 }, lifespan: 900, scale: { start: 0.24, end: 0.02 },
    alpha: { start: 0.5, end: 0 }, tint: 0xe8ffff, emitting: false
  }).setDepth(8);

  const player = scene.add.sprite(p.x, M.Y(p.y), 'pp-ptero-up').setDepth(14).setScale(0.92 * K);
  const glow = scene.add.image(p.x, M.Y(p.y), 'arc-glow').setDepth(9).setScale(1.1 * K).setAlpha(0.14)
    .setBlendMode(Phaser.BlendModes.ADD);

  const fish = [];
  const jellies = [];

  function spawnFish() {
    if (fish.length >= 5) return;
    const tone = ['silver', 'silver', 'gold', 'blue'][Math.floor(r() * 4)];
    const y = SURFACE + 70 + r() * (FLOOR - SURFACE - 140);
    const fromLeft = r() < 0.5;
    const img = scene.add.image(fromLeft ? -40 : W + 40, M.Y(y), 'pp-fish-' + tone)
      .setDepth(10).setScale((0.9 + r() * 0.3) * K).setFlipX(!fromLeft);
    fish.push({
      img, x: fromLeft ? -40 : W + 40, y, tower: y, vx: (fromLeft ? 1 : -1) * (38 + r() * 42),
      ph: r() * 6, tone, got: false
    });
  }

  function spawnJelly() {
    if (jellies.length >= 3) return;
    const x = 120 + r() * (W - 240);
    const y = 190 + r() * 230;
    const img = scene.add.image(x, M.Y(y), 'pp-jelly').setDepth(11).setAlpha(0.9).setScale((0.8 + r() * 0.4) * K);
    scene.tweens.add({ targets: img, scaleX: img.scaleX * 1.08, scaleY: img.scaleY * 0.94, duration: 1600 + r() * 800, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    jellies.push({ img, x, y, ph: r() * 6, drift: (r() - 0.5) * 26 });
  }

  function hurt(what) {
    if (state.iFrames > 0 || state.over) return;
    state.hearts--;
    state.iFrames = 1.4;
    state.breath = Math.max(0.08, state.breath - 0.12);
    scene.sfx('hurt');
    scene.shake(220, 0.012);
    scene.cameras.main.flash(200, 60, 20, 90);
    scene.burst(p.x, M.Y(p.y), 0xc9a6ff, 12, { life: 520 });
    scene.popText(p.x, M.Y(p.y - 50), 'stung', '#d7b8ff');
    if (state.hearts <= 0) endRun(false);
    else scene.notice(what, 1500);
  }

  function catchFish(f) {
    f.got = true;
    state.fish++;
    state.combo++;
    state.breath = Math.min(1, state.breath + 0.09);
    state.iFrames = Math.max(state.iFrames, 0.15);
    scene.sfx('pick');
    scene.burst(f.img.x, f.img.y, 0xd9f7ee, 10, { life: 480 });
    scene.popText(f.img.x, f.img.y - 18, '+1 fish', '#d8fff4');
    scene.tweens.add({
      targets: f.img, scale: 0, alpha: 0, duration: 240, ease: 'back.in',
      onComplete: () => f.img.destroy()
    });
  }

  function endRun(win) {
    state.over = true;
    scene.finish(win, {
      score: state.fish,
      note: win ? `${state.fish} silver fish taken` : `${state.fish} fish, and the reef goes quiet`
    });
  }

  function aim(px, py) {
    p.tx = clamp(px, 40, W - 40);
    p.ty = swimY(py);
  }

  let boost = false;
  scene.input.on('pointermove', (ptr) => aim(ptr.x, scene.uY(ptr.y)));
  scene.input.on('pointerdown', (ptr) => { boost = true; aim(ptr.x, scene.uY(ptr.y)); });
  scene.input.on('pointerup', () => { boost = false; });

  const keys = scene.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D', space: 'SPACE' });
  scene.input.keyboard.on('keydown-SPACE', () => { boost = true; });
  scene.input.keyboard.on('keyup-SPACE', () => { boost = false; });

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'breathe at the surface' });
  scene.notice('Dive for the silver. Surface before the breath runs out.', 2400);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;

    // steering
    const speed = 320 * (boost ? 1.65 : 1);
    if (keys.left.isDown || keys.a.isDown) p.tx -= speed * dt;
    if (keys.right.isDown || keys.d.isDown) p.tx += speed * dt;
    if (keys.up.isDown || keys.w.isDown) p.ty -= speed * dt;
    if (keys.down.isDown || keys.s.isDown) p.ty += speed * dt;
    p.tx = clamp(p.tx, 40, W - 40);
    p.ty = swimY(p.ty);

    const ease = Math.min(1, dt * (boost ? 7 : 4.6));
    p.x += (p.tx - p.x) * ease;
    p.y += (p.ty - p.y) * ease;
    p.x = clamp(p.x, 34, W - 34);
    p.y = swimY(p.y);

    state.iFrames = Math.max(0, state.iFrames - dt);
    state.deep = clamp((p.y - SURFACE) / (FLOOR - SURFACE), 0, 1);

    // breath
    const surface = p.y < SURFACE + 46;
    if (surface) {
      state.breath = Math.min(1, state.breath + dt * 0.42);
    } else {
      state.breath -= dt * (0.032 + state.deep * 0.075);
      if (state.breath <= 0) {
        state.breath = 0.45;
        state.hearts--;
        state.iFrames = 1.2;
        scene.sfx('bad');
        scene.shake(260, 0.014);
        scene.cameras.main.flash(260, 20, 60, 90);
        scene.notice(state.hearts > 0 ? 'Your lungs empty. Rise.' : 'The reef dims.', 1900);
        if (state.hearts <= 0) { endRun(false); return; }
      }
    }

    veil.setFillStyle(0x04222e, state.deep * 0.4);

    // player body
    player.x = p.x;
    player.y = M.Y(p.y);
    player.setTexture(Math.floor(time / 260) % 2 ? 'pp-ptero-up' : 'pp-ptero-down');
    player.rotation = Math.sin(time / 300) * 0.08 + (p.ty - p.y) * 0.004;
    player.setAlpha(state.iFrames > 0 && Math.floor(time / 70) % 2 ? 0.4 : 1);
    player.setScale((0.92 + (boost ? 0.05 : 0)) * K);
    glow.x = p.x; glow.y = M.Y(p.y);
    glow.setAlpha(0.1 + Math.sin(time / 400) * 0.03);
    if (Math.random() < dt * 6) trail.emitParticleAt(p.x - 42 * K, M.Y(p.y) + 6, 1);

    // light shafts breathe
    shafts.forEach((sh, i) => {
      sh.alpha = 0.032 + Math.sin(time / 2600 + sh._ph) * 0.014 + i * 0.002;
      sh.x += Math.sin(time / 4200 + i) * dt * 5;
    });
    kelp.forEach((k) => {
      k.rotation = Math.sin(time / 1500 + k._ph) * 0.05;
    });

    // fish
    if (fish.length < 5) { state.spawnT -= dt; if (state.spawnT <= 0) { spawnFish(); state.spawnT = 1.1 + r() * 1.4; } }
    for (let i = fish.length - 1; i >= 0; i--) {
      const f = fish[i];
      if (f.got) { fish.splice(i, 1); continue; }
      f.x += f.vx * dt;
      f.tower += Math.sin(time / 900 + f.ph) * dt * 22;
      f.img.x = f.x;
      f.img.y = M.Y(clamp(f.tower, SURFACE + 40, FLOOR - 30));
      f.img.setAngle(Math.sin(time / 420 + f.ph) * 5);
      if (Math.hypot(f.x - p.x, (f.img.y - M.Y(p.y)) / M.band) < 44 && state.iFrames < 0.6) catchFish(f);
      if (f.x < -70 || f.x > W + 70) { f.img.destroy(); fish.splice(i, 1); }
    }

    // jellyfish
    state.jellyT -= dt;
    if (state.jellyT <= 0) { spawnJelly(); state.jellyT = 4.2 + r() * 3.4; }
    for (let i = jellies.length - 1; i >= 0; i--) {
      const j = jellies[i];
      j.y += Math.sin(time / 1100 + j.ph) * dt * 14;
      j.img.x = j.x + Math.sin(time / 1700 + j.ph) * 26;
      j.img.y = M.Y(j.y);
      j.img.alpha = 0.75 + Math.sin(time / 700 + j.ph) * 0.15;
      if (Math.hypot(j.img.x - p.x, (j.img.y - M.Y(p.y)) / M.band) < 46) hurt('The jelly stings. Give it room.');
    }

    // surface shimmer line
    if (surface && Math.random() < dt * 8) {
      scene.burst(p.x + (r() - 0.5) * 70, M.Y(SURFACE + 8), 0xd9ffff, 2, { life: 500, gravity: 60 });
    }

    scene.hud({
      score: state.fish,
      progress: state.breath,
      hearts: state.hearts,
      extra: state.breath < 0.28 ? 'breathe — now' : state.deep > 0.7 ? 'deep water' : ''
    });
    scene.audio.setTension(state.breath < 0.3 ? 0.55 : 0.1);

    if (state.fish >= GOAL) endRun(true);
  }

  return {
    update,
    state: () => ({
      fish: state.fish, hearts: state.hearts, breath: Number(state.breath.toFixed(2)),
      x: Math.round(p.x), y: Math.round(p.y), deep: Number(state.deep.toFixed(2)), over: state.over,
      fishOnField: fish.length, jellies: jellies.length
    }),
    setFish: (v) => { state.fish = v; },
    setHearts: (v) => { state.hearts = v; },
    setBreath: (v) => { state.breath = v; },
    addFishAt: (x, y, tone) => {
      const img = scene.add.image(x, M.Y(y), 'pp-fish-' + (tone || 'silver')).setDepth(10).setScale(1.1 * K);
      fish.push({ img, x, y, tower: y, vx: 0, ph: 0, tone: tone || 'silver', got: false });
    },
    addJellyAt: (x, y) => {
      const img = scene.add.image(x, M.Y(y), 'pp-jelly').setDepth(11).setScale(1.1 * K);
      jellies.push({ img, x, y, ph: 0, drift: 0 });
    },
    clear: () => {
      fish.forEach((f) => f.img.destroy()); fish.length = 0;
      jellies.forEach((j) => j.img.destroy()); jellies.length = 0;
    },
    diveTo: (x, y) => { p.tx = x; p.ty = y; p.x = x; p.y = y; }
  };
}

export default { id: 'ptero-plunge', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
