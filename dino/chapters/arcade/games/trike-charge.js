// Trike Charge — the canyon line.
// Build force behind the frill, then release it all in one horn-first dash.
// Raiders come down three trails; the herd is behind you and nowhere to retreat.

import { canvasTex, grain, rng, clamp, W } from '../engine.js?v=du-316e7af9b57fa08e';

const GROUND = 470;
const HOME = 296;
const GOAL = 12;
const STAR = [16, 30, 46];
const LANE_GAP = 60;
const laneY = (l) => GROUND - l * LANE_GAP;

function trikeArt(scene) {
  ['idle', 'charge'].forEach((pose) => {
    canvasTex(scene, 'tc-trike-' + pose, 230, 150, (c) => {
      const charge = pose === 'charge';
      const lift = charge ? 10 : 0;
      const bx = 108, by = 78 + lift;
      const rand = rng(11);

      // tail
      c.strokeStyle = '#8f6234';
      c.lineWidth = 15;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(56, by + 4);
      c.quadraticCurveTo(26, by - 2, 10, by - 18);
      c.stroke();

      // far legs
      const farLegs = charge ? [[92, 118, 78, 144], [140, 116, 150, 142]] : [[96, 118, 84, 144], [138, 118, 148, 144]];
      farLegs.forEach(([hx, hy, fx, fy]) => {
        c.strokeStyle = '#6d4a26';
        c.lineWidth = 13;
        c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = '#4a3018';
        c.beginPath(); c.ellipse(fx, fy, 8, 4, 0, 0, Math.PI * 2); c.fill();
      });

      // body
      const body = c.createLinearGradient(40, by - 40, 176, by + 40);
      body.addColorStop(0, '#c89150');
      body.addColorStop(0.55, '#a9713b');
      body.addColorStop(1, '#7a4c28');
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(bx, by, 62, 40, -0.06, 0, Math.PI * 2);
      c.fill();

      // belly shading
      c.fillStyle = 'rgba(238,206,150,0.32)';
      c.beginPath(); c.ellipse(bx + 4, by + 20, 44, 14, -0.05, 0, Math.PI * 2); c.fill();

      // back frill
      const frillX = 152, frillY = by - 46;
      c.fillStyle = '#8f3f34';
      c.beginPath();
      c.moveTo(frillX - 30, frillY + 34);
      for (let i = 0; i < 7; i++) {
        const a = -1.5 + i * 0.38;
        const r = 46 + (i % 2) * 8;
        c.lineTo(frillX + Math.cos(a) * r * 0.4, frillY + Math.sin(a) * r);
      }
      c.quadraticCurveTo(frillX + 52, frillY + 22, frillX - 8, frillY + 48);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(60,20,16,0.45)';
      c.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(frillX - 12 + i * 10, frillY + 34);
        c.lineTo(frillX - 16 + i * 12, frillY + 4 + (i % 2) * 8);
        c.stroke();
      }
      c.fillStyle = '#b9624a';
      for (let i = 0; i < 6; i++) {
        const a = -1.35 + i * 0.34;
        c.beginPath();
        c.arc(frillX + Math.cos(a) * 30 * 0.5, frillY + Math.sin(a) * 34, 3.4, 0, Math.PI * 2);
        c.fill();
      }

      // head
      const hx = charge ? 186 : 180, hy = charge ? by + 22 : by - 16;
      c.fillStyle = '#b77f45';
      c.beginPath(); c.ellipse(hx, hy, 30, 24, charge ? 0.24 : -0.1, 0, Math.PI * 2); c.fill();

      // horns
      c.fillStyle = '#f0dfb2';
      const hornTilt = charge ? 0.5 : 0.1;
      c.beginPath();
      c.moveTo(hx + 8, hy - 16);
      c.quadraticCurveTo(hx + 34, hy - 30 - hornTilt * 6, hx + 46, hy - 6 + hornTilt * 8);
      c.quadraticCurveTo(hx + 30, hy - 10, hx + 8, hy - 6);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(hx - 4, hy - 18);
      c.quadraticCurveTo(hx + 6, hy - 40 - hornTilt * 4, hx + 22, hy - 26);
      c.quadraticCurveTo(hx + 12, hy - 18, hx + 4, hy - 8);
      c.closePath(); c.fill();

      // beak
      c.fillStyle = '#42342a';
      c.beginPath();
      c.moveTo(hx + 20, hy + 6);
      c.quadraticCurveTo(hx + 48, hy + (charge ? 10 : 4), hx + 40, hy + (charge ? 20 : 12));
      c.quadraticCurveTo(hx + 30, hy + 18, hx + 20, hy + 14);
      c.closePath(); c.fill();

      // eye
      c.fillStyle = '#fbeecb';
      c.beginPath(); c.arc(hx + 12, hy - 6, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1d2118';
      c.beginPath(); c.arc(hx + 13.5, hy - 6, 2.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(hx + 12, hy - 7.6, 1, 0, Math.PI * 2); c.fill();

      // near legs
      const nearLegs = charge ? [[96, 120, 86, 148], [142, 120, 154, 148]] : [[100, 120, 90, 148], [136, 120, 146, 148]];
      nearLegs.forEach(([hx2, hy2, fx, fy]) => {
        c.strokeStyle = '#95622f';
        c.lineWidth = 15;
        c.beginPath(); c.moveTo(hx2, hy2); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = '#3a2716';
        c.beginPath(); c.ellipse(fx, fy, 10, 5, 0, 0, Math.PI * 2); c.fill();
      });

      // horn dust glow while charging
      if (charge) {
        const g = c.createRadialGradient(hx + 40, hy + 8, 2, hx + 40, hy + 8, 44);
        g.addColorStop(0, 'rgba(255,196,110,0.5)');
        g.addColorStop(1, 'rgba(255,140,60,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(hx + 40, hy + 8, 44, 0, Math.PI * 2); c.fill();
      }

      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(60, 20, 190, 130);
      rim.addColorStop(0, 'rgba(255,226,170,0.24)');
      rim.addColorStop(0.55, 'rgba(255,226,170,0)');
      c.fillStyle = rim; c.fillRect(0, 0, 230, 150);
      c.globalCompositeOperation = 'source-over';
      grain(c, 230, 150, 0.03, 13 + rand() * 8);
    });
  });

  canvasTex(scene, 'tc-raider', 150, 104, (c) => {
    c.strokeStyle = '#4c6b4f';
    c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(44, 68); c.quadraticCurveTo(16, 60, 8, 42); c.stroke();
    const body = c.createLinearGradient(30, 30, 120, 90);
    body.addColorStop(0, '#7f9c63');
    body.addColorStop(1, '#425c44');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(76, 62, 38, 21, -0.12, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#5e7d55';
    c.lineWidth = 12;
    c.beginPath(); c.moveTo(106, 54); c.quadraticCurveTo(114, 40, 122, 34); c.stroke();
    c.fillStyle = '#88a068';
    c.beginPath(); c.ellipse(126, 32, 16, 11, -0.24, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#26301f';
    c.beginPath();
    c.moveTo(132, 26); c.quadraticCurveTo(148, 28, 148, 36);
    c.quadraticCurveTo(140, 34, 134, 34); c.closePath(); c.fill();
    c.fillStyle = '#f7e8bc';
    c.beginPath(); c.arc(127, 27, 3.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#142015';
    c.beginPath(); c.arc(128, 27, 1.9, 0, Math.PI * 2); c.fill();
    const legs = [[68, 78, 62, 98], [88, 78, 96, 98]];
    legs.forEach(([hx, hy, fx, fy], i) => {
      c.strokeStyle = i ? '#4a6547' : '#5d7a52';
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(hx, hy);
      c.quadraticCurveTo((hx + fx) / 2 + 4, (hy + fy) / 2, fx, fy);
      c.stroke();
      c.strokeStyle = '#e7d7aa'; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 8, fy); c.stroke();
    });
    c.strokeStyle = '#e7d7aa'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(104, 60); c.lineTo(112, 54); c.stroke();
    grain(c, 150, 104, 0.04, 21);
  });

  canvasTex(scene, 'tc-boulder', 132, 106, (c) => {
    const g = c.createLinearGradient(16, 12, 116, 98);
    g.addColorStop(0, '#a89070');
    g.addColorStop(0.55, '#7b6550');
    g.addColorStop(1, '#4b3a2d');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(8, 100); c.quadraticCurveTo(0, 62, 22, 36);
    c.quadraticCurveTo(52, 4, 92, 18); c.quadraticCurveTo(128, 34, 124, 74);
    c.quadraticCurveTo(118, 100, 86, 104); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(38,26,18,0.6)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(36, 82); c.quadraticCurveTo(50, 52, 44, 30); c.stroke();
    c.beginPath(); c.moveTo(72, 100); c.quadraticCurveTo(80, 66, 102, 50); c.stroke();
    c.fillStyle = 'rgba(255,220,160,0.18)';
    c.beginPath(); c.ellipse(46, 32, 24, 9, -0.35, 0, Math.PI * 2); c.fill();
    grain(c, 132, 106, 0.05, 27);
  });

  canvasTex(scene, 'tc-fence', 46, 92, (c) => {
    const g = c.createLinearGradient(0, 0, 46, 0);
    g.addColorStop(0, '#5b4228'); g.addColorStop(0.5, '#7d5c36'); g.addColorStop(1, '#4a3320');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(14, 92); c.lineTo(18, 12); c.lineTo(28, 0); c.lineTo(34, 12); c.lineTo(38, 92); c.closePath(); c.fill();
    c.fillStyle = 'rgba(30,20,12,0.4)';
    c.fillRect(22, 24, 3, 60);
    grain(c, 46, 92, 0.05, 33);
  });

  canvasTex(scene, 'tc-calf', 118, 78, (c) => {
    c.fillStyle = '#8a5f36';
    c.beginPath(); c.ellipse(62, 44, 32, 20, -0.05, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#a9794a';
    c.beginPath(); c.ellipse(88, 32, 18, 13, -0.15, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d8c08e';
    c.beginPath(); c.moveTo(96, 24); c.lineTo(104, 34); c.lineTo(96, 32); c.closePath(); c.fill();
    c.strokeStyle = '#6b4526'; c.lineWidth = 8;
    [[50, 58, 48, 74], [74, 58, 78, 74]].forEach(([hx, hy, fx, fy]) => {
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, fy); c.stroke();
    });
    c.fillStyle = '#231d12';
    c.beginPath(); c.arc(94, 30, 2.4, 0, Math.PI * 2); c.fill();
    grain(c, 118, 78, 0.04, 37);
  });
}

function create(scene) {
  const M = scene.M;
  const K = M.portrait ? 1.35 : 1;
  trikeArt(scene);

  const r = rng(4242);
  const floorTop = laneY(2) - 20;
  const fh = Math.ceil(M.H - M.Y(floorTop));
  canvasTex(scene, 'tc-floor-' + (M.portrait ? 'p' : 'w'), W, fh, (c) => {
    const g = c.createLinearGradient(0, 0, 0, fh);
    g.addColorStop(0, 'rgba(180,124,76,0)');
    g.addColorStop(0.12, 'rgba(180,124,76,0.9)');
    g.addColorStop(0.34, '#8f5c36');
    g.addColorStop(1, '#3c2416');
    c.fillStyle = g; c.fillRect(0, 0, W, fh);
    const rand = rng(99);
    for (let l = 0; l < 3; l++) {
      const yy = M.Y(laneY(l)) - M.Y(floorTop);
      c.fillStyle = 'rgba(244,198,140,0.15)';
      c.fillRect(0, yy - 2, W, 22);
      c.fillStyle = 'rgba(46,26,16,0.42)';
      c.fillRect(0, yy - 5, W, 4);
      c.fillStyle = 'rgba(255,226,172,0.1)';
      c.fillRect(0, yy + 20, W, 2);
    }
    for (let l = 0; l < 3; l++) {
      const yy = M.Y(laneY(l)) - M.Y(floorTop);
      for (let i = 0; i < 26; i++) {
        const x = rand() * W;
        c.fillStyle = 'rgba(58,34,20,' + (0.18 + rand() * 0.2) + ')';
        c.beginPath(); c.ellipse(x, yy - 7 - rand() * 3, 2 + rand() * 3, 1.6 + rand() * 1.4, 0, 0, Math.PI * 2); c.fill();
      }
    }
    for (let i = 0; i < 260; i++) {
      const x = rand() * W, y = 12 + rand() * (fh - 20);
      const s2 = 1 + rand() * 3;
      c.fillStyle = 'rgba(38,22,14,' + (0.1 + rand() * 0.2) + ')';
      c.beginPath(); c.ellipse(x, y, s2 * 1.7, s2, rand() * 3, 0, Math.PI * 2); c.fill();
    }
    for (let i = 0; i < 8; i++) {
      const x = rand() * W, y = 20 + rand() * fh * 0.8;
      c.fillStyle = 'rgba(255,196,130,0.05)';
      c.beginPath(); c.ellipse(x, y, 30 + rand() * 50, 6 + rand() * 10, 0, 0, Math.PI * 2); c.fill();
    }
    grain(c, W, fh, 0.04, 55);
  });
  scene.add.image(0, M.Y(floorTop), 'tc-floor-' + (M.portrait ? 'p' : 'w')).setOrigin(0).setDepth(1);
  const state = {
    force: 0, driven: 0, hearts: 3, lane: 1, charge: 0, power: 0, charging: false,
    x: HOME, dash: 0, iFrames: 0, combo: 0, comboT: 0, over: false,
    spawnT: 1.4, rockT: 4.2
  };

  // the herd at your back
  const herd = [];
  for (let i = 0; i < 4; i++) {
    const calf = scene.add.image(80 + i * 46, M.Y(GROUND - 4 + (i % 2) * 10), 'tc-calf')
      .setOrigin(0.5, 1).setDepth(6 + i).setAlpha(0.72).setScale((0.72 + r() * 0.16) * K);
    calf._ph = r() * 6;
    herd.push(calf);
  }
  for (let i = 0; i < 5; i++) {
    scene.add.image(24 + i * 52, M.Y(GROUND + 2), 'tc-fence').setOrigin(0.5, 1).setDepth(4 + i).setAlpha(0.85).setScale(K);
  }
  scene.add.rectangle(150, M.Y(GROUND + 2), 240 * K, 3, 0x2a1a10, 0.4).setDepth(2).setOrigin(0.5, 0);

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 40, max: 190 }, angle: { min: 190, max: 350 },
    lifespan: { min: 300, max: 620 }, scale: { start: 0.5, end: 0 },
    alpha: { start: 0.5, end: 0 }, tint: 0xd2b184, gravityY: 220, emitting: false
  }).setDepth(24);
  const sparks = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 90, max: 340 }, lifespan: 520, scale: { start: 0.6, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0xffcf7a, gravityY: 400, emitting: false
  }).setDepth(26);

  const player = scene.add.image(HOME, M.Y(laneY(1)), 'tc-trike-idle').setOrigin(0.5, 1).setDepth(18).setScale(1.02 * K);
  const ring = scene.add.image(HOME, M.Y(laneY(1)) - 60 * K, 'arc-ring').setDepth(17).setAlpha(0).setScale(0.7 * K);

  const raiders = [];
  const rocks = [];
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const l = scene.add.rectangle(W + r() * 200, M.Y(200 + r() * 220), 2, 26 + r() * 46, 0xffe2b0, 0).setDepth(9);
    l._s = 1.2 + r();
    lines.push(l);
  }

  function laneOf(y) { return clamp(Math.round((GROUND - y) / 57), 0, 2); }

  function spawnRaider(lane, x) {
    const l = lane === undefined ? Math.floor(r() * 3) : lane;
    const img = scene.add.image(x === undefined ? W + 70 : x, M.Y(laneY(l)), 'tc-raider')
      .setOrigin(0.5, 1).setDepth(9 + (2 - l) * 2).setScale((1 - l * 0.07) * K);
    if (l === 2) img.setTint(0xc9c6d8);
    raiders.push({ img, lane: l, x: x === undefined ? W + 70 : x, speed: 62 + r() * 34, dead: false });
  }

  function spawnRock(lane, x) {
    const l = lane === undefined ? Math.floor(r() * 3) : lane;
    const at = x === undefined ? 640 + r() * 180 : x;
    const img = scene.add.image(at, M.Y(laneY(l)), 'tc-boulder')
      .setOrigin(0.5, 1).setDepth(9 + (2 - l) * 2).setScale((1 - l * 0.07) * K);
    rocks.push({ img, lane: l, x: at, cracked: false });
  }

  function ram() {
    if (state.over || state.dash > 0 || state.charging) return;
    if (state.charge < 0.1) return;
    const power = state.charge;
    state.power = power;
    state.charge = 0;
    state.dash = 0.34 + power * 0.14;
    scene.sfx('whoosh');
    scene.shake(120, 0.004);
    dust.emitParticleAt(player.x - 30 * K, M.Y(laneY(state.lane)), 12);
    scene.burst(player.x, M.Y(laneY(state.lane)) - 40 * K, 0xffd9a0, 10, { life: 380 });
  }

  function hitHerd(raider) {
    raider.dead = true;
    raider.img.destroy();
    state.hearts--;
    state.combo = 0;
    state.iFrames = 1;
    scene.sfx('bad');
    scene.shake(260, 0.014);
    scene.cameras.main.flash(180, 160, 40, 20);
    scene.popText(150, M.Y(GROUND - 90), 'the line breaks', '#ff9d7a');
    if (state.hearts <= 0) endRun(false);
    else scene.notice(state.hearts === 1 ? 'The herd is exposed. Hold the line.' : 'A raider slipped through.', 1600);
  }

  function bounceOff(rock) {
    state.hearts--;
    state.dash = 0;
    state.iFrames = 1.1;
    state.combo = 0;
    scene.sfx('hurt');
    scene.shake(220, 0.012);
    scene.burst(rock.x - 30, M.Y(laneY(rock.lane)) - 40, 0xc9a173, 14, { life: 500, gravity: 260 });
    if (state.hearts <= 0) endRun(false);
    else scene.notice('Too little force behind the horns. Charge deeper.', 1700);
  }

  function driveOff(raider, power) {
    raider.dead = true;
    scene.sfx('good');
    state.combo = state.comboT > 0 ? state.combo + 1 : 1;
    state.comboT = 3.2;
    const bonus = 4 + Math.min(4, state.combo - 1);
    state.force += bonus;
    state.driven++;
    scene.popText(raider.x, M.Y(laneY(raider.lane)) - 70 * K, '+' + bonus, '#ffe6a8');
    scene.burst(raider.x, M.Y(laneY(raider.lane)) - 44 * K, 0xffdca0, 16, { life: 520, gravity: 300, spin: true });
    scene.shake(160, 0.008);
    scene.tweens.add({
      targets: raider.img, x: W + 200, y: raider.img.y - 150 * K, angle: 220, alpha: 0,
      duration: 520, ease: 'cubic.out', onComplete: () => raider.img.destroy()
    });
  }

  function endRun(win) {
    state.over = true;
    scene.finish(win, {
      score: state.force,
      note: win ? `${state.driven} raiders turned back` : `${state.driven} of ${GOAL} raiders turned`
    });
  }

  function setCharging(on) {
    if (state.over || state.dash > 0) return;
    if (on && !state.charging) {
      state.charging = true;
      state.charge = 0.06;
      scene.sfx('tick');
    } else if (!on && state.charging) {
      state.charging = false;
      ram();
    }
  }

  const keys = scene.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', w: 'W', s: 'S', space: 'SPACE' });
  function moveLane(dir) {
    if (state.over || state.dash > 0) return;
    const next = clamp(state.lane + dir, 0, 2);
    if (next === state.lane) return;
    state.lane = next;
    scene.sfx('tick');
    dust.emitParticleAt(player.x - 16 * K, M.Y(laneY(next)), 5);
  }
  scene.input.keyboard.on('keydown-UP', () => moveLane(1));
  scene.input.keyboard.on('keydown-W', () => moveLane(1));
  scene.input.keyboard.on('keydown-DOWN', () => moveLane(-1));
  scene.input.keyboard.on('keydown-S', () => moveLane(-1));
  scene.input.keyboard.on('keydown-SPACE', () => setCharging(true));
  scene.input.keyboard.on('keyup-SPACE', () => setCharging(false));

  let dragY = 0, dragging = false;
  scene.input.on('pointerdown', (p) => { dragging = true; dragY = p.y; setCharging(true); });
  scene.input.on('pointermove', (p) => {
    if (!dragging) return;
    const dy = p.y - dragY;
    if (Math.abs(dy) > 42) { moveLane(dy < 0 ? 1 : -1); dragY = p.y; }
  });
  scene.input.on('pointerup', () => { dragging = false; setCharging(false); });

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'hold to charge' });
  scene.notice('Hold to build force. Release at the horns.', 2100);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;

    state.iFrames = Math.max(0, state.iFrames - dt);
    state.comboT = Math.max(0, state.comboT - dt);
    if (state.charging) state.charge = Math.min(1, state.charge + dt / 0.95);

    // dash out, then walk home
    if (state.dash > 0) {
      state.dash -= dt;
      state.x += 980 * dt;
      if (Math.random() < 0.5) dust.emitParticleAt(state.x - 40 * K, M.Y(laneY(state.lane)), 1);
    } else {
      state.x = Math.max(HOME, state.x - 360 * dt);
    }
    state.x = Math.min(state.x, 760);

    // lane glide
    const target = laneY(state.lane);
    player.y += (M.Y(target) - player.y) * Math.min(1, dt * 12);
    player.x = state.x;
    player.setDepth(9 + (2 - state.lane) * 2 + 1);
    player.setTexture(state.charging || state.dash > 0 ? 'tc-trike-charge' : 'tc-trike-idle');
    player.setScale((1.02 + (state.charging ? state.charge * 0.04 : 0)) * (1 - state.lane * 0.07) * K);

    // charge ring
    ring.x = state.x;
    ring.y = player.y - 62 * K;
    ring.setVisible(state.charging);
    ring.setAlpha(0.25 + state.charge * 0.6);
    ring.setScale((0.5 + state.charge * 0.36) * K);
    ring.rotation += dt * (1 + state.charge * 4);

    if (state.charging && Math.random() < dt * 22) {
      dust.emitParticleAt(state.x - 44 * K, player.y, 1);
    }

    // speed lines while dashing
    lines.forEach((l) => {
      l.alpha = state.dash > 0 ? 0.12 + r() * 0.1 : 0;
      if (state.dash > 0) {
        l.x -= 1400 * l._s * dt;
        if (l.x < 480) { l.x = W + r() * 80; l.y = M.Y(170 + r() * 230); }
      }
    });

    // raiders
    for (let i = raiders.length - 1; i >= 0; i--) {
      const ra = raiders[i];
      if (ra.dead) { raiders.splice(i, 1); continue; }
      ra.x -= ra.speed * dt;
      ra.img.x = ra.x;
      ra.img.y = M.Y(laneY(ra.lane)) + Math.sin(time / 90 + ra.x * 0.02) * 2;
      if (state.dash > 0 && ra.lane === state.lane && Math.abs(ra.x - state.x) < 92 * K) {
        driveOff(ra, state.charge);
        raiders.splice(i, 1);
        continue;
      }
      if (ra.x < 132) {
        hitHerd(ra);
        raiders.splice(i, 1);
      }
    }

    // boulders
    for (let i = rocks.length - 1; i >= 0; i--) {
      const rock = rocks[i];
      rock.img.x = rock.x;
      if (state.dash > 0 && rock.lane === state.lane && Math.abs(rock.x - state.x) < 92 * K) {
        if (state.power >= 0.42) {
          rock.cracked = true;
          state.force += 3;
          scene.sfx('boom');
          scene.shake(200, 0.01);
          scene.burst(rock.x, M.Y(laneY(rock.lane)) - 30 * K, 0xc9a173, 22, { life: 700, gravity: 340, spin: true });
          scene.popText(rock.x, M.Y(laneY(rock.lane)) - 70 * K, '+3', '#ffe6a8');
          rock.img.destroy();
          rocks.splice(i, 1);
        } else {
          bounceOff(rock);
          state.x = Math.max(HOME, rock.x - 130);
          state.dash = 0;
        }
        continue;
      }
    }


    // spawns
    state.spawnT -= dt;
    if (state.spawnT <= 0) {
      spawnRaider();
      if (r() < 0.28) spawnRaider();
      state.spawnT = 1.5 + r() * 0.9 - Math.min(0.5, state.driven * 0.03);
    }
    state.rockT -= dt;
    if (state.rockT <= 0 && rocks.length < 2) {
      spawnRock();
      state.rockT = 4.5 + r() * 2.2;
    }

    // herd mood
    herd.forEach((c, i) => {
      c.y = M.Y(GROUND - 4 + (i % 2) * 10) + Math.sin(time / 520 + c._ph) * 2.4 * K;
      c.setTint(state.hearts <= 1 ? 0xffb49e : 0xffffff);
      c.rotation = Math.sin(time / 900 + c._ph) * 0.02;
    });

    scene.hud({
      score: state.force,
      progress: Math.min(1, state.driven / GOAL),
      hearts: state.hearts,
      extra: state.charge > 0.98 ? 'full force' : state.combo > 1 ? `chain ${state.combo}` : ''
    });
    scene.audio.setTension(state.charge > 0.8 ? 0.5 : 0.18);

    if (state.driven >= GOAL) endRun(true);
  }

  return {
    update,
    state: () => ({
      force: state.force, driven: state.driven, hearts: state.hearts, lane: state.lane,
      charge: Number(state.charge.toFixed(2)), x: Math.round(state.x), dash: state.dash > 0,
      over: state.over,
      raiders: raiders.map((o) => ({ lane: o.lane, x: Math.round(o.x) })),
      rocks: rocks.map((o) => ({ lane: o.lane, x: Math.round(o.x) }))
    }),
    setForce: (v) => { state.force = v; },
    setDriven: (v) => { state.driven = v; },
    setHearts: (v) => { state.hearts = v; },
    setLane: (v) => { state.lane = v; },
    spawnRaider,
    spawnRock,
    chargeTo: (v) => { state.charging = true; state.charge = v; },
    release: () => { state.charging = false; ram(); },
    clear: () => {
      raiders.forEach((o) => o.img.destroy()); raiders.length = 0;
      rocks.forEach((o) => o.img.destroy()); rocks.length = 0;
    }
  };
}

export default { id: 'trike-charge', stars: STAR, backdropOpts: { ground: false }, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
