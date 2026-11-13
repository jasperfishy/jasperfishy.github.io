// Vine Cannon — the swinging canopy.
// Stretch the anchor vine back, read the swing, lead the basket. Baskets hang on
// real pendulums, the wind moves the whole arc, and the canopy never holds still.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-cd75bb4cc7df44ba';

const STAR = [7, 13, 21];
const GRAV = 640;
const MAXDRAG = 122;
const VMAX = 780;
const GAIN = VMAX / MAXDRAG;
const STEP = 1 / 120;
const FLOOR = 486;
const PAL = MOODS.jungle;

function leafShape(c, x, y, len, wid, rot, fill, vein) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const g = c.createLinearGradient(0, -wid, len, wid);
  g.addColorStop(0, fill[0]);
  g.addColorStop(1, fill[1]);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(len * 0.4, -wid, len, 0);
  c.quadraticCurveTo(len * 0.4, wid, 0, 0);
  c.closePath();
  c.fill();
  if (vein) {
    c.strokeStyle = vein;
    c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(3, 0); c.lineTo(len * 0.92, 0); c.stroke();
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      c.beginPath();
      c.moveTo(len * t, 0);
      c.lineTo(len * (t + 0.14), -wid * 0.5 * (1 - t));
      c.moveTo(len * t, 0);
      c.lineTo(len * (t + 0.14), wid * 0.5 * (1 - t));
      c.stroke();
    }
  }
  c.restore();
}

function bark(c, w, h, seed, base, dark) {
  const rand = rng(seed);
  c.strokeStyle = dark;
  for (let i = 0; i < 26; i++) {
    const x = rand() * w;
    const y = rand() * h;
    c.lineWidth = 1 + rand() * 2.4;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + (rand() - 0.5) * 18, y + 22 + rand() * 34, x + (rand() - 0.5) * 26, y + 54 + rand() * 44);
    c.stroke();
  }
  c.fillStyle = base;
  for (let i = 0; i < 10; i++) {
    c.beginPath();
    c.ellipse(rand() * w, rand() * h, 6 + rand() * 16, 3 + rand() * 7, rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
}

function art(scene) {
  canvasTex(scene, 'vc-trunk', 210, 540, (c, w, h) => {
    const g = c.createLinearGradient(20, 0, 170, h);
    g.addColorStop(0, '#6b4a2a');
    g.addColorStop(0.4, '#4b3220');
    g.addColorStop(1, '#22170f');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(58, h);
    c.quadraticCurveTo(48, h * 0.6, 62, h * 0.24);
    c.quadraticCurveTo(68, h * 0.08, 92, 4);
    c.lineTo(128, 8);
    c.quadraticCurveTo(140, h * 0.2, 142, h * 0.44);
    c.quadraticCurveTo(150, h * 0.78, 156, h);
    c.closePath();
    c.fill();
    // the stub the anchor vine is tied over
    c.fillStyle = '#513723';
    c.beginPath();
    c.moveTo(112, 236);
    c.quadraticCurveTo(160, 226, 208, 244);
    c.lineTo(208, 268);
    c.quadraticCurveTo(158, 254, 116, 266);
    c.closePath();
    c.fill();
    c.strokeStyle = '#33220f';
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(120, 244); c.quadraticCurveTo(168, 236, 206, 250); c.stroke();
    bark(c, w, h, 21, 'rgba(126,96,58,0.16)', 'rgba(20,12,6,0.5)');
    for (let i = 0; i < 12; i++) {
      const y = 40 + i * 40;
      leafShape(c, 66, y, 34 + (i % 3) * 10, 9, -0.5 + (i % 2) * 1.1, ['rgba(104,128,58,0.6)', 'rgba(60,92,44,0.5)'], 'rgba(190,206,130,0.3)');
    }
    c.strokeStyle = 'rgba(180,206,150,0.35)';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(150 + i * 14, 262);
      c.quadraticCurveTo(160 + i * 14, 300 + i * 22, 146 + i * 20, 336 + i * 40);
      c.stroke();
    }
    grain(c, w, h, 0.04, 11);
  });

  canvasTex(scene, 'vc-crown', 480, 320, (c, w, h) => {
    const rand = rng(4107);
    for (let i = 0; i < 46; i++) {
      const x = 40 + rand() * (w - 80);
      const y = 60 + rand() * (h - 90);
      leafShape(c, x, y, 58 + rand() * 62, 15 + rand() * 12, rand() * Math.PI * 2,
        ['#31584a', '#264a3a', '#3d6647', '#1e3d31'][i % 4] === '#1e3d31'
          ? ['#254434', '#16302a'] : ['#4e7a4a', '#284f3c'], 'rgba(180,200,120,0.22)');
    }
    for (let i = 0; i < 26; i++) {
      const x = 30 + rand() * (w - 60);
      const y = 40 + rand() * (h - 80);
      leafShape(c, x, y, 46 + rand() * 40, 12 + rand() * 8, rand() * Math.PI * 2,
        ['#6b8f4c', '#557a42'], 'rgba(206,222,150,0.3)');
    }
    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(0, 0, 0, h);
    rim.addColorStop(0, 'rgba(255,214,130,0.26)');
    rim.addColorStop(0.55, 'rgba(255,214,130,0.02)');
    rim.addColorStop(1, 'rgba(0,0,0,0.3)');
    c.fillStyle = rim; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, 0.03, 17);
  });

  canvasTex(scene, 'vc-canopy', 520, 190, (c, w, h) => {
    const rand = rng(8801);
    c.fillStyle = '#4a3220';
    c.beginPath();
    c.moveTo(-10, 54);
    c.quadraticCurveTo(150, 34, 300, 52);
    c.quadraticCurveTo(430, 66, 528, 44);
    c.lineTo(528, 84);
    c.quadraticCurveTo(420, 104, 300, 90);
    c.quadraticCurveTo(140, 76, -10, 94);
    c.closePath();
    c.fill();
    for (let i = 0; i < 34; i++) {
      const x = 10 + rand() * (w - 20);
      const y = 10 + rand() * 60;
      leafShape(c, x, y, 52 + rand() * 46, 13 + rand() * 9, rand() * Math.PI * 2,
        i % 3 ? ['#3f6a44', '#224536'] : ['#5d8149', '#31583c'], 'rgba(190,208,130,0.25)');
    }
    c.strokeStyle = 'rgba(70,50,30,0.85)';
    c.lineWidth = 2.4;
    for (let i = 0; i < 9; i++) {
      const x = 30 + i * 55 + rand() * 20;
      const len = 26 + rand() * 40;
      c.beginPath();
      c.moveTo(x, 88);
      c.quadraticCurveTo(x + 8, 88 + len * 0.6, x - 6, 88 + len);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-atop';
    const glow = c.createLinearGradient(0, 0, 0, 120);
    glow.addColorStop(0, 'rgba(255,220,140,0.22)');
    glow.addColorStop(1, 'rgba(0,0,0,0.28)');
    c.fillStyle = glow; c.fillRect(0, 0, w, 190);
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, 0.03, 23);
  });

  canvasTex(scene, 'vc-basket', 120, 104, (c, w, h) => {
    // mouth rim sits at y = 20 so the sprite can hang from it
    const weave = c.createLinearGradient(18, 20, 104, 96);
    weave.addColorStop(0, '#c99a56');
    weave.addColorStop(0.45, '#a4763c');
    weave.addColorStop(1, '#6b4622');
    c.fillStyle = weave;
    c.beginPath();
    c.moveTo(20, 24);
    c.quadraticCurveTo(24, 84, 60, 92);
    c.quadraticCurveTo(96, 84, 100, 24);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(70,44,20,0.6)';
    c.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(21 + i * 1.6, 34 + i * 12);
      c.quadraticCurveTo(60, 44 + i * 12, 99 - i * 1.6, 34 + i * 12);
      c.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const x = 26 + i * 11;
      c.beginPath();
      c.moveTo(x, 26);
      c.quadraticCurveTo(x + 3, 58, x - 2, 88);
      c.stroke();
    }
    c.fillStyle = 'rgba(30,18,8,0.85)';
    c.beginPath(); c.ellipse(60, 22, 41, 11, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e0b878';
    c.lineWidth = 5;
    c.beginPath(); c.ellipse(60, 21, 41, 11, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,236,190,0.5)';
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(60, 19, 36, 8, 0, Math.PI * 1.05, Math.PI * 1.85); c.stroke();
    c.strokeStyle = '#8a6534';
    c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(24, 26); c.quadraticCurveTo(6, 52, 30, 78); c.stroke();
    c.beginPath(); c.moveTo(96, 26); c.quadraticCurveTo(114, 52, 90, 78); c.stroke();
    leafShape(c, 44, 30, 30, 8, -0.4, ['#5c7a3c', '#3f5c30'], 'rgba(200,214,140,0.4)');
    grain(c, w, h, 0.045, 31);
  });

  ['calm', 'fright'].forEach((mood, mi) => {
    canvasTex(scene, 'vc-hatch-' + mood, 88, 76, (c, w, h) => {
      const g = c.createLinearGradient(16, 18, 74, 66);
      g.addColorStop(0, '#9fd7a2');
      g.addColorStop(0.55, '#5fae7c');
      g.addColorStop(1, '#2f6f5c');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(46, 46, 25, 20, 0.06, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#4d9a72';
      c.lineWidth = 8;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(64, 40); c.quadraticCurveTo(76, 34, mi ? 82 : 78, mi ? 22 : 28); c.stroke();
      c.fillStyle = '#7cc48f';
      c.beginPath(); c.ellipse(mi ? 80 : 76, mi ? 20 : 26, 14, 12, 0.1, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f0dfae';
      c.beginPath();
      c.moveTo(mi ? 88 : 84, mi ? 22 : 28);
      c.quadraticCurveTo(96, 26, 94, 32);
      c.quadraticCurveTo(88, 32, mi ? 86 : 82, 30);
      c.closePath(); c.fill();
      c.fillStyle = '#fffbe2';
      c.beginPath(); c.arc(mi ? 82 : 78, mi ? 17 : 22, mi ? 5.6 : 4.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#14261f';
      c.beginPath(); c.arc(mi ? 83 : 79, mi ? 17 : 22, mi ? 3 : 2.2, 0, Math.PI * 2); c.fill();
      // spine frills
      c.fillStyle = '#e8b45c';
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(30 + i * 9, 30 - (i === 0 ? 4 : 0));
        c.lineTo(34 + i * 9, 18 - i);
        c.lineTo(38 + i * 9, 30);
        c.closePath(); c.fill();
      }
      c.strokeStyle = '#3d7f66';
      c.lineWidth = 5;
      const leg = mi ? 0.5 : 0.15;
      c.beginPath(); c.moveTo(38, 62); c.quadraticCurveTo(32, 70, 24 - leg * 8, 68 + leg * 8); c.stroke();
      c.beginPath(); c.moveTo(52, 62); c.quadraticCurveTo(58, 72, 64 + leg * 8, 68 - leg * 6); c.stroke();
      c.strokeStyle = '#7bbf8c';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(24, 50); c.quadraticCurveTo(10, 54, 4, 46 - leg * 12); c.stroke();
      c.fillStyle = 'rgba(255,240,190,0.22)';
      c.beginPath(); c.ellipse(44, 40, 18, 9, 0.1, 0, Math.PI * 2); c.fill();
      grain(c, w, h, 0.04, 41 + mi);
    });
  });

  canvasTex(scene, 'vc-knot', 72, 72, (c, w, h) => {
    c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      c.strokeStyle = i % 2 ? '#8a6736' : '#5e4324';
      c.lineWidth = 5 - i * 0.4;
      c.beginPath();
      c.ellipse(36, 26 + i * 4, 18 - i * 1.4, 8 + i * 1.4, -0.18 + i * 0.1, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = '#6f8a3f';
    c.beginPath(); c.ellipse(36, 44, 15, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8fae4e';
    c.beginPath(); c.ellipse(34, 41, 10, 6, -0.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,226,160,0.5)';
    c.lineWidth = 1.8;
    c.beginPath(); c.arc(34, 30, 13, 3.5, 5.4); c.stroke();
    grain(c, w, h, 0.035, 51);
  });

  canvasTex(scene, 'vc-branch', 340, 110, (c, w, h) => {
    const rand = rng(9042);
    const g = c.createLinearGradient(0, 20, w, 90);
    g.addColorStop(0, '#5c4028');
    g.addColorStop(0.5, '#452e1c');
    g.addColorStop(1, '#2b1c11');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(4, 58);
    c.quadraticCurveTo(120, 34, 250, 44);
    c.quadraticCurveTo(320, 50, 338, 38);
    c.lineTo(338, 62);
    c.quadraticCurveTo(300, 78, 240, 72);
    c.quadraticCurveTo(110, 66, 4, 84);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(18,10,5,0.5)';
    for (let i = 0; i < 20; i++) {
      const x = 10 + rand() * 320;
      c.lineWidth = 1 + rand() * 2;
      c.beginPath(); c.moveTo(x, 46 + rand() * 26); c.lineTo(x + 20 + rand() * 30, 50 + rand() * 22); c.stroke();
    }
    c.strokeStyle = '#3a2617';
    c.lineWidth = 4;
    [70, 150, 236].forEach((x, i) => {
      c.beginPath();
      c.moveTo(x, 52);
      c.quadraticCurveTo(x + 16, 26 - i * 6, x + 40, 12);
      c.stroke();
      leafShape(c, x + 34, 14, 40, 11, -0.5 - i * 0.2, ['#4e7040', '#2f5036'], 'rgba(190,206,130,0.3)');
    });
    for (let i = 0; i < 5; i++) {
      leafShape(c, 40 + i * 66, 78, 46, 12, 0.6 + i * 0.2, ['#557a3e', '#33552f'], 'rgba(190,206,130,0.28)');
    }
    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(0, 20, 0, 90);
    rim.addColorStop(0, 'rgba(255,216,140,0.2)');
    rim.addColorStop(1, 'rgba(0,0,0,0.3)');
    c.fillStyle = rim; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, 0.04, 61);
  });

  canvasTex(scene, 'vc-broadleaf', 190, 130, (c, w, h) => {
    leafShape(c, 8, 66, 172, 52, -0.06, ['#5d8a44', '#274d33'], 'rgba(206,224,150,0.4)');
    c.strokeStyle = 'rgba(20,40,26,0.5)';
    c.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      c.beginPath();
      c.moveTo(8 + 172 * t, 66);
      c.lineTo(8 + 172 * (t + 0.1), 66 - 44 * (1 - t));
      c.moveTo(8 + 172 * t, 66);
      c.lineTo(8 + 172 * (t + 0.1), 66 + 44 * (1 - t));
      c.stroke();
    }
    c.globalCompositeOperation = 'source-atop';
    const g = c.createLinearGradient(0, 10, 0, 120);
    g.addColorStop(0, 'rgba(255,232,160,0.24)');
    g.addColorStop(1, 'rgba(0,0,0,0.26)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, 0.03, 71);
  });

  canvasTex(scene, 'vc-liana', 96, 330, (c, w, h) => {
    const rand = rng(3311);
    c.lineCap = 'round';
    c.strokeStyle = '#3b5b34';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(48, 0);
    c.bezierCurveTo(70, 90, 26, 200, 52, 300);
    c.stroke();
    c.strokeStyle = '#5c7f3f';
    c.lineWidth = 3.4;
    c.beginPath();
    c.moveTo(48, 0);
    c.bezierCurveTo(70, 90, 26, 200, 52, 300);
    c.stroke();
    for (let i = 0; i < 11; i++) {
      const t = i / 11;
      const x = 48 + Math.sin(t * 5.2) * 18;
      const y = 12 + t * 290;
      leafShape(c, x, y, 26 + rand() * 16, 8 + rand() * 4, (i % 2 ? 1 : -1) * 0.9 + 0.4,
        i % 2 ? ['#638a44', '#3b5c33'] : ['#4f7740', '#2e4d2e'], 'rgba(196,212,140,0.3)');
    }
    c.strokeStyle = '#4a6a3a';
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(52, 300); c.quadraticCurveTo(58, 316, 46, 328); c.stroke();
    grain(c, w, h, 0.03, 81);
  });

  canvasTex(scene, 'vc-fern', 250, 150, (c, w, h) => {
    const rand = rng(1220);
    c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const bx = 40 + rand() * 170;
      const len = 60 + rand() * 76;
      const ang = -1.3 + rand() * 2.6;
      c.strokeStyle = i % 2 ? '#2f5240' : '#3d6445';
      c.lineWidth = 3.4;
      const tx = bx + Math.cos(ang) * len;
      const ty = h - 6 + Math.sin(ang - Math.PI / 2) * len * 0.9;
      c.beginPath(); c.moveTo(bx, h - 4); c.quadraticCurveTo((bx + tx) / 2, (h + ty) / 2 - 14, tx, ty); c.stroke();
      for (let k = 1; k < 7; k++) {
        const t = k / 7;
        const x = bx + (tx - bx) * t;
        const y = (h - 4) + (ty - h + 4) * t - 14 * Math.sin(t * Math.PI);
        c.strokeStyle = 'rgba(96,132,80,0.75)';
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 14 * (1 - t), y - 10 * (1 - t));
        c.moveTo(x, y);
        c.lineTo(x + 12 * (1 - t), y - 9 * (1 - t));
        c.stroke();
      }
    }
    grain(c, w, h, 0.035, 91);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene);
  const r = rng('vine-cannon');
  const band = M.portrait ? M.band : 1;
  const gu = (units) => units * band;
  const fit = (texPx, units) => gu(units) / texPx;
  const ACCENT = Phaser.Display.Color.HexStringToColor(PAL.accent).color;

  const ANCHOR = { x: 216, y: 298 };

  const state = {
    landed: 0, hearts: 3, lost: 0, round: 1, light: 1, clock: 0,
    phase: 'aim', over: false, aiming: false, acc: 0,
    pull: { x: ANCHOR.x, y: ANCHOR.y },
    wind: 0, windTarget: 0, windHold: false, gustT: 4.2, saidWind: 0,
    saveWindow: 0, saveMax: 0.7, armed: 0, recoil: 0,
    swingScale: 1, freeze: false, diff: 0, last: null, creakTick: 0, kbPull: false,
    tumble: { x: 0, y: 0, vx: 0, vy: 0, spin: 0 }
  };

  const pr = { x: ANCHOR.x, y: ANCHOR.y, ox: ANCHOR.x, vx: 0, vy: 0, t: 0, peak: ANCHOR.y, nearest: 999, spin: 0 };
  let saveTarget = null;

  /* ---------------------------------------------------------------- world */
  scene.add.image(74, M.Y(524), 'vc-trunk').setOrigin(0.5, 1)
    .setScale(fit(540, 452)).setDepth(12);
  scene.add.image(128, M.Y(186), 'vc-crown').setOrigin(0.5, 0.5)
    .setScale(fit(480, 330)).setDepth(11).setAlpha(0.96);
  scene.add.image(206, M.Y(146), 'vc-crown').setOrigin(0.5, 0.5)
    .setScale(fit(480, 216)).setDepth(10).setAlpha(0.8).setTint(0xbfd08a);
  scene.add.image(548, M.Y(74), 'vc-canopy').setOrigin(0, 0)
    .setScale(fit(520, 412)).setDepth(16);
  scene.add.image(872, M.Y(116), 'vc-canopy').setOrigin(0.5, 0)
    .setScale(fit(520, 196)).setDepth(16).setAlpha(0.92).setTint(0xc8d69a);
  scene.add.image(ANCHOR.x, M.Y(ANCHOR.y - 6), 'vc-knot').setOrigin(0.5, 0.42)
    .setScale(fit(72, 50)).setDepth(13);
  for (let i = 0; i < 5; i++) {
    scene.add.image(60 + i * 210 + r() * 60, M.Y(500 + r() * 26), 'vc-fern')
      .setOrigin(0.5, 0.85).setScale(fit(250, 130 + r() * 60)).setDepth(19)
      .setAlpha(0.86 + r() * 0.14).setTint(i % 2 ? 0xffffff : 0xcfe3b0);
  }

  const ropes = scene.add.graphics().setDepth(14);
  const aimG = scene.add.graphics().setDepth(24);
  const catchG = scene.add.graphics().setDepth(25);
  const hatch = scene.add.image(pr.x, M.Y(pr.y), 'vc-hatch-calm').setDepth(26)
    .setScale(fit(88, 38)).setOrigin(0.5, 0.55).setVisible(false);
  const halo = scene.add.image(pr.x, M.Y(pr.y), 'arc-glow').setDepth(22).setScale(1.3 * K)
    .setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD).setTint(ACCENT);

  const trail = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 4, max: 26 }, lifespan: 620, scale: { start: 0.3, end: 0.02 },
    alpha: { start: 0.5, end: 0 }, tint: [0xf6eaa6, 0xbfd88a], emitting: false
  }).setDepth(21);

  const queue = [];
  function buildQueue() {
    queue.forEach((q) => q.destroy());
    queue.length = 0;
    for (let i = 0; i < Math.max(0, state.hearts); i++) {
      const img = scene.add.image(120 + i * 34, M.Y(300 + i * 5), 'vc-hatch-calm')
        .setDepth(13).setScale(fit(88, 26)).setAlpha(0.9);
      img._ph = r() * 6;
      img._y = 300 + i * 5;
      queue.push(img);
    }
  }
  buildQueue();

  const drift = [];
  for (let i = 0; i < 10; i++) {
    const img = scene.add.image(r() * W, M.Y(80 + r() * 380), 'vc-broadleaf').setDepth(5)
      .setAlpha(0.24 + r() * 0.2).setScale(fit(190, 22 + r() * 26));
    drift.push({ img, v: 7 + r() * 14, ph: r() * 6, spin: (r() - 0.5) * 0.5 });
  }

  /* -------------------------------------------------------------- baskets */
  const baskets = [];
  const obstacles = [];

  function clearBaskets() {
    baskets.forEach((b) => { b.img.destroy(); if (b.halo) b.halo.destroy(); });
    baskets.length = 0;
  }

  function hang(index, count) {
    const spread = count === 1 ? [742] : count === 2 ? [648, 856] : [600, 748, 898];
    const pivotX = clamp(spread[index] + (r() - 0.5) * 46, 556, 928);
    const pivotY = 118 + r() * 34;
    const L = lerp(212, 168, state.diff) + r() * 34;
    const baseAmp = lerp(0.3, 0.52, state.diff) + r() * 0.06;
    const b = {
      pivotX, pivotY, L, baseAmp, amp: baseAmp * state.swingScale, ph: r() * Math.PI * 2,
      omega: Math.sqrt(900 / L), halfW: lerp(31, 20, state.diff), x: pivotX, y: pivotY + L, ang: 0,
      tip: 0, img: null, halo: null
    };
    const mouthUnits = b.halfW * 2.35;
    b.img = scene.add.image(b.x, M.Y(b.y), 'vc-basket').setDepth(17)
      .setOrigin(0.5, 20 / 104).setScale(fit(120, mouthUnits));
    b.halo = scene.add.image(b.x, M.Y(b.y + 16), 'arc-glow').setDepth(16).setScale(1.1 * K)
      .setAlpha(0.1).setBlendMode(Phaser.BlendModes.ADD).setTint(ACCENT);
    baskets.push(b);
  }

  function addObstacle(o) {
    o.img = scene.add.image(0, 0, o.tex).setDepth(18).setScale(o.scale).setOrigin(o.ox, o.oy);
    o.bx1 = o.x1; o.by1 = o.y1; o.bx2 = o.x2; o.by2 = o.y2;
    obstacles.push(o);
    return o;
  }

  function clearObstacles() {
    obstacles.forEach((o) => o.img.destroy());
    obstacles.length = 0;
  }

  function makeObstacles() {
    const count = clamp(Math.floor((state.round - 1) / 2), 0, 4);
    for (let i = 0; i < count; i++) {
      const long = r() < 0.5;
      const len = long ? 150 + r() * 70 : 100 + r() * 44;
      const cx = clamp(330 + r() * 280, 306, 640);
      const cy = clamp(252 + r() * 150, 238, 404);
      const ang = (r() - 0.5) * 0.9;
      const dx = Math.cos(ang) * len / 2;
      const dy = Math.sin(ang) * len / 2;
      addObstacle({
        kind: long ? 'branch' : 'leaf', tex: long ? 'vc-branch' : 'vc-broadleaf',
        x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy,
        r: long ? 17 : 13, sway: 0, ph: r() * 6, ang, cx, cy,
        scale: fit(long ? 340 : 190, len * 1.08), ox: 0.5, oy: 0.5
      });
    }
    if (state.round >= 3) addLiana(388 + r() * 130, 250 + r() * 40, 104 + r() * 44);
    // never wall the canopy shut: drop the last obstacle until a route opens
    let guard = 10;
    while (guard-- > 0 && obstacles.length && !anyRoute()) {
      const dead = obstacles.pop();
      dead.img.destroy();
    }
  }

  function addLiana(x, yBottom, len) {
    return addObstacle({
      kind: 'liana', tex: 'vc-liana', x1: x, y1: yBottom - len, x2: x, y2: yBottom,
      r: 13, sway: 0, ph: r() * 6, ang: 0, cx: x, cy: yBottom - len / 2,
      scale: fit(330, len * 1.12), ox: 0.5, oy: 0
    });
  }

  function newRound() {
    state.round++;
    state.diff = clamp((state.round - 1) / 14, 0, 1);
    clearBaskets();
    clearObstacles();
    state.phase = 'aim';
    state.armed = 0;
    state.saveWindow = 0;
    saveTarget = null;
    const count = state.round < 4 ? 1 : state.round < 10 ? 2 : r() < 0.45 ? 3 : 2;
    for (let i = 0; i < count; i++) hang(i, count);
    makeObstacles();
    if (count > 1 && state.round === 4) scene.notice('two baskets up — pick the one you can lead', 2200);
    if (!state.windHold) pickGust(true);
  }

  /* --------------------------------------------------------------- flight */
  function integrate(h, o) {
    o.vy += GRAV * h;
    o.vx += state.wind * h;
    o.x += o.vx * h;
    o.y += o.vy * h;
    o.t += h;
  }

  function arcFrom(x, y, vx, vy, maxT, wind) {
    const pts = [{ x, y, t: 0 }];
    const o = { x, y, vx, vy, t: 0 };
    let n = 0;
    while (o.t < maxT && n < 900) {
      o.vy += GRAV * STEP;
      o.vx += wind * STEP;
      o.x += o.vx * STEP;
      o.y += o.vy * STEP;
      o.t += STEP;
      n++;
      if (n % 6 === 0) pts.push({ x: o.x, y: o.y, t: o.t });
      if (o.y > FLOOR || o.x > W + 30 || o.x < -30 || o.y < 6) break;
    }
    return pts;
  }

  // closed form for a constant wind, in the same frame of reference the
  // integrator uses: the vine pulls the launch origin along with it
  function solve(tx, ty, hintT, wind) {
    const w = wind === undefined ? state.wind : wind;
    let best = null;
    for (let t = 0.52; t <= 3.1; t += 0.03) {
      const d = t - 1 / GAIN;
      if (d < 0.06) continue;
      const vx = (tx - ANCHOR.x - 0.5 * w * t * t) / d;
      const vy = (ty - ANCHOR.y - 0.5 * GRAV * t * t) / d;
      const sp = Math.hypot(vx, vy);
      if (sp > VMAX || sp < 120 || vx < 60) continue;
      const ox = ANCHOR.x - vx / GAIN;
      const oy = ANCHOR.y - vy / GAIN;
      if (Math.hypot(ox - ANCHOR.x, oy - ANCHOR.y) > MAXDRAG * 1.002) continue;
      if (oy > 486 || oy < 118 || ox < 30) continue;
      const apex = vy < 0 ? oy - (vy * vy) / (2 * GRAV) : oy;
      if (apex < 24) continue;
      const cost = Math.abs(t - hintT);
      if (!best || cost < best.cost) best = { t, vx, vy, ox, oy, sp, cost };
    }
    return best;
  }

  function blocked(x, y) {
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (segHit(x, y, o.x1, o.y1, o.x2, o.y2, o.r)) return o;
    }
    return null;
  }

  function segHit(px, py, ax, ay, bx, by, rad) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)) < rad;
  }

  function routeClear(sol) {
    const pts = arcFrom(sol.ox, sol.oy, sol.vx, sol.vy, sol.t, state.wind);
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].t > sol.t - 0.14) break;
      if (blocked(pts[i].x, pts[i].y)) return false;
    }
    return true;
  }

  function basketAt(i, lead) {
    const b = baskets[i];
    if (!b) return null;
    const th = state.freeze ? b.ang : b.amp * Math.cos(b.omega * (state.clock + (lead || 0)) + b.ph);
    return { x: b.pivotX + Math.sin(th) * b.L, y: b.pivotY + Math.cos(th) * b.L, ang: th };
  }

  // the best lead that both reaches the basket and misses every leaf
  function bestRoute(i) {
    let fallback = null;
    for (let k = 0; k < 14; k++) {
      const hint = 0.7 + k * 0.11;
      let t = hint;
      let sol = null;
      for (let g = 0; g < 4; g++) {
        const pt = basketAt(i, t);
        sol = solve(pt.x, pt.y, t);
        if (!sol) break;
        t = sol.t;
      }
      if (!sol) continue;
      if (!fallback) fallback = { i, sol, clear: false };
      if (routeClear(sol)) return { i, sol, clear: true };
    }
    return fallback;
  }

  function anyRoute() {
    for (let i = 0; i < baskets.length; i++) if (bestRoute(i)) return true;
    return false;
  }

  function bestPick(i) {
    if (i === undefined || i === null) {
      const all = baskets.map((_, k) => bestRoute(k)).filter(Boolean);
      all.sort((a, b) => (b.clear ? 1 : 0) - (a.clear ? 1 : 0));
      return all[0] || null;
    }
    return bestRoute(i | 0);
  }

  function power() {
    return clamp(Math.hypot(state.pull.x - ANCHOR.x, state.pull.y - ANCHOR.y) / MAXDRAG, 0, 1);
  }

  function setPull(px, py) {
    const dx = px - ANCHOR.x, dy = py - ANCHOR.y;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, MAXDRAG / d);
    state.pull.x = clamp(ANCHOR.x + dx * k, 30, W - 30);
    state.pull.y = clamp(ANCHOR.y + dy * k, 118, 486);
  }

  function launch() {
    if (state.over || state.phase !== 'aim' || power() < 0.1) { state.aiming = false; return false; }
    const p = power();
    pr.ox = state.pull.x;
    pr.x = state.pull.x;
    pr.y = state.pull.y;
    pr.vx = (ANCHOR.x - state.pull.x) * GAIN;
    pr.vy = (ANCHOR.y - state.pull.y) * GAIN;
    pr.t = 0;
    pr.peak = pr.y;
    pr.nearest = 999;
    pr.spin = 0;
    state.phase = 'fly';
    state.aiming = false;
    state.acc = 0;
    state.recoil = 1;
    hatch.setTexture('vc-hatch-fright').setVisible(true);
    scene.sfx('jump');
    if (scene.audio.ctx) scene.audio.burst({ dur: 0.3, freq: 520, q: 0.8, gain: 0.07 + p * 0.05, sweep: 700 });
    scene.shake(110, 0.004 + p * 0.006);
    scene.burst(state.pull.x, M.Y(state.pull.y), ACCENT, 8, { life: 380, scale: 0.4 * K, gravity: 120 });
    return true;
  }

  function finishRun(win) {
    if (state.over) return;
    state.over = true;
    state.phase = 'over';
    scene.finish(win, {
      score: state.landed,
      note: win
        ? 'every basket is swinging, and not one of them is empty'
        : `${state.landed} hatchling${state.landed === 1 ? '' : 's'} down from the canopy, and the vine hangs slack`
    });
  }

  function recordLast(kind, b) {
    state.last = {
      kind,
      range: Math.round(pr.x - pr.ox),
      nearest: Math.round(pr.nearest),
      peak: Math.round(FLOOR - pr.peak),
      dx: b ? Math.round(pr.x - b.x) : null,
      basket: b ? baskets.indexOf(b) : -1
    };
  }

  function loseHatch(kind, msg, b) {
    recordLast(kind, b);
    state.lost++;
    state.hearts--;
    scene.sfx('hurt');
    scene.shake(240, 0.012);
    scene.cameras.main.flash(200, 90, 40, 20);
    scene.burst(pr.x, M.Y(clamp(pr.y, 20, FLOOR)), 0x8fae5e, 14, { life: 640, gravity: 340, spin: true, scale: 0.5 * K });
    scene.popText(clamp(pr.x, 60, W - 60), M.Y(clamp(pr.y, 40, 420)), 'lost', '#e2a98f');
    buildQueue();
    if (state.hearts <= 0) { finishRun(state.landed >= STAR[0]); return; }
    scene.notice(msg, 1800);
    newRound();
  }

  function land(b, tier) {
    const gain = tier === 'perfect' ? 2 : 1;
    state.landed += gain;
    state.light = Math.min(1, state.light + (tier === 'perfect' ? 0.2 : tier === 'clean' ? 0.14 : 0.07));
    recordLast(tier, b);
    scene.sfx(tier === 'perfect' ? 'good' : 'pick');
    scene.burst(b.x, M.Y(b.y + 10), tier === 'perfect' ? 0xffe6a8 : 0xc9e88f, tier === 'perfect' ? 20 : 12,
      { life: 640, gravity: 200, spin: tier === 'perfect', scale: 0.55 * K });
    scene.popText(b.x, M.Y(b.y - 34), tier === 'perfect' ? 'two safe' : tier === 'clean' ? 'one safe' : 'one saved',
      tier === 'rim' ? '#ffd7a0' : '#f4e9b0');
    if (tier === 'perfect') { scene.cameras.main.flash(180, 255, 220, 140); scene.shake(120, 0.005); }
    scene.tweens.add({
      targets: b.img, scaleY: b.img.scaleY * 0.86, scaleX: b.img.scaleX * 1.1,
      duration: 150, yoyo: true, ease: 'quad.out'
    });
    hatch.setVisible(false);
    if (state.landed >= STAR[2]) { finishRun(true); return; }
    newRound();
  }

  function rimHit(b) {
    saveTarget = b;
    state.phase = 'save';
    state.saveMax = Math.max(0.42, 0.72 - state.diff * 0.24);
    state.saveWindow = state.armed > 0 ? state.saveMax * 1.35 : state.saveMax;
    state.tumble.x = b.x + (pr.x > b.x ? b.halfW * 0.7 : -b.halfW * 0.7);
    state.tumble.y = b.y + 6;
    state.tumble.vx = (pr.x > b.x ? 1 : -1) * 30 + pr.vx * 0.1;
    state.tumble.vy = 30;
    state.tumble.spin = 0;
    b.tip = 1;
    scene.sfx('bad');
    scene.shake(150, 0.008);
    scene.popText(b.x, M.Y(b.y - 30), 'the basket tips', '#ffbe8e');
    if (state.armed > 0) doCatch(b, true);
  }

  function doCatch(b, pre) {
    if (state.phase !== 'save' || !b) return false;
    state.saveWindow = 0;
    state.armed = 0;
    b.tip = 0;
    scene.sfx('chime');
    if (scene.audio.ctx) {
      const n = 88 + Phaser.Math.Between(0, 2) * 7;
      scene.audio.bell(440 * Math.pow(2, (n - 69) / 12), scene.audio.ctx.currentTime, 0.045);
    }
    state.recoil = 0.6;
    land(b, 'rim');
    saveTarget = null;
    if (pre) scene.notice('the catcher vine was already out — good instinct', 1500);
    return true;
  }

  function saveMiss(b) {
    loseHatch('rim-lost', 'i have dropped one before. that is the sound of it.', b);
    saveTarget = null;
  }

  /* ---------------------------------------------------------------- input */
  scene.input.addPointer(2);

  scene.input.on('pointerdown', (p) => {
    if (state.over) return;
    const py = scene.uY(p.y);
    if (state.phase === 'save') {
      if (!doCatch(saveTarget || baskets[0])) state.armed = 0.4;
      return;
    }
    if (state.phase === 'fly') {
      state.armed = 0.85;
      scene.sfx('whoosh');
      return;
    }
    state.aiming = true;
    state.kbPull = false;
    setPull(p.x, py);
  });
  scene.input.on('pointermove', (p) => {
    if (state.over || !state.aiming || state.phase !== 'aim') return;
    setPull(p.x, scene.uY(p.y));
  });
  scene.input.on('pointerup', () => {
    if (state.aiming && state.phase === 'aim') launch();
    state.aiming = false;
  });

  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN',
    a: 'A', d: 'D', w: 'W', s: 'S', space: 'SPACE'
  });
  scene.input.keyboard.on('keydown-SPACE', () => {
    if (state.phase === 'save') doCatch(saveTarget || baskets[0]);
    else if (state.phase === 'fly') { state.armed = 0.85; scene.sfx('whoosh'); }
    else state.aiming = true;
  });
  scene.input.keyboard.on('keyup-SPACE', () => {
    if (state.phase === 'aim') { launch(); state.aiming = false; }
  });

  /* ----------------------------------------------------------------- wind */
  function pickGust(soft) {
    if (state.windHold) return;
    const mag = lerp(38, 118, state.diff) * (0.5 + r() * 0.9);
    state.windTarget = (r() < 0.5 ? -1 : 1) * mag;
    state.gustT = 3.4 + r() * 3.6;
    if (scene.audio.ctx) {
      scene.audio.burst({ dur: 0.5, freq: 420, q: 0.7, gain: soft ? 0.03 : 0.055, sweep: 260 });
    }
    if (state.saidWind < 3 && Math.abs(state.windTarget) > 60) {
      state.saidWind++;
      scene.notice('the canopy leans ' + (state.windTarget > 0 ? 'east' : 'west') + ' — the whole arc moves', 1700);
    }
  }

  function updateWind(dt) {
    if (!state.windHold) {
      state.gustT -= dt;
      if (state.gustT <= 0) pickGust(false);
      state.wind += (state.windTarget - state.wind) * Math.min(1, dt * 1.4);
    }
  }

  /* --------------------------------------------------------------- drawing */
  // phaser graphics paths have no quadratic curve, so every strand is sampled
  // into short straight segments before it is stroked
  function quad(g, x0, y0, cx, cy, x1, y1, segs) {
    const n = segs || 10;
    g.beginPath();
    g.moveTo(x0, y0);
    for (let i = 1; i <= n; i++) {
      const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t;
      g.lineTo(a * x0 + b * cx + t * t * x1, a * y0 + b * cy + t * t * y1);
    }
    g.strokePath();
  }

  function drawRopes(time) {
    ropes.clear();
    for (let i = 0; i < baskets.length; i++) {
      const b = baskets[i];
      const px = b.pivotX, py = M.Y(b.pivotY);
      const hx = b.x, hy = M.Y(b.y);
      const mx = (px + hx) / 2 + Math.sin(time / 900 + b.ph) * 5 * K;
      const my = (py + hy) / 2;
      ropes.lineStyle(gu(5.5), 0x3a2a16, 0.95);
      quad(ropes, px, py, mx, my, hx, hy);
      ropes.lineStyle(gu(2.4), 0x8b6a38, 1);
      quad(ropes, px, py, mx, my, hx, hy);
      ropes.fillStyle(0x5d4526, 1);
      for (let k = 1; k < 5; k++) {
        const t = k / 5;
        ropes.fillCircle(px + (hx - px) * t, py + (hy - py) * t, gu(2.4));
      }
      ropes.fillStyle(ACCENT, 0.5);
      ropes.fillCircle(px, py, gu(3.2));
    }
  }

  function drawAim(time) {
    aimG.clear();
    catchG.clear();
    const p = power();

    if (state.phase === 'aim') {
      const ax = ANCHOR.x, ay = M.Y(ANCHOR.y);
      const px = state.pull.x, py = M.Y(state.pull.y);
      const slack = (1 - p) * 26;
      const mx = (ax + px) / 2 + Math.sin(time / 420) * 3;
      const my = (ay + py) / 2 + slack * gu(1) * 0.7;
      aimG.lineStyle(gu(8 + p * 3), 0x2b1d10, 0.95);
      quad(aimG, ax, ay, mx, my, px, py);
      aimG.lineStyle(gu(4), p > 0.8 ? 0xffd06a : 0x6f8a3f, 1);
      quad(aimG, ax, ay, mx, my, px, py);
      if (p > 0.05) {
        aimG.lineStyle(gu(1.6), 0xf6eaa6, 0.2 + p * 0.5);
        quad(aimG, ax, ay, mx - 4, my - 4, px, py);
        // tension knots swell with the stretch
        for (let k = 1; k < 6; k++) {
          const t = k / 6;
          aimG.fillStyle(0x5d4526, 1);
          aimG.fillCircle(ax + (px - ax) * t, ay + (py - ay) * t, gu(2.2 + p * 1.6));
        }
        const vx = (ANCHOR.x - px) * GAIN;
        const vy = (ANCHOR.y - py) * GAIN;
        if (vx > 20) {
          const pts = arcFrom(px, py, vx, vy, 0.58, state.wind);
          for (let i = 1; i < pts.length; i++) {
            const a = 0.55 * (1 - i / pts.length);
            aimG.fillStyle(ACCENT, a);
            aimG.fillCircle(pts[i].x, M.Y(pts[i].y), gu(2.6 + (1 - i / pts.length) * 1.4));
          }
        }
        aimG.lineStyle(gu(1.6), ACCENT, 0.18 + p * 0.22);
        aimG.strokeCircle(ax, ay, gu(MAXDRAG));
      }
    } else {
      // slack vine swinging on the anchor after the throw
      const sway = Math.sin(time / 300) * 14 * state.recoil;
      const ay = M.Y(ANCHOR.y);
      aimG.lineStyle(gu(5), 0x3a2a16, 0.8);
      quad(aimG, ANCHOR.x, ay, ANCHOR.x + sway, ay + gu(28), ANCHOR.x + sway * 1.6, ay + gu(52), 6);
      state.recoil = Math.max(0, state.recoil - 0.02);
    }

    for (let i = 0; i < baskets.length; i++) {
      const b = baskets[i];
      if (b.tip <= 0) continue;
      catchG.lineStyle(gu(4), 0x7fa04a, 0.95);
      const hx = clamp(state.tumble.x, 40, W - 40);
      const hy = M.Y(clamp(state.tumble.y, 30, FLOOR));
      const topY = M.Y(b.pivotY + 10);
      const mx = (b.x + hx) / 2;
      const my = (topY + hy) / 2 + gu(18);
      quad(catchG, b.x, topY, mx, my, hx, hy);
      catchG.fillStyle(ACCENT, 0.9);
      catchG.fillCircle(hx, hy, gu(4));
      catchG.lineStyle(gu(2.4), ACCENT, 0.35 + 0.5 * Math.sin(time / 90));
      catchG.strokeCircle(hx, hy, gu(14 + 8 * (state.saveWindow / state.saveMax)));
    }
  }

  function hudAll() {
    const b = baskets[0];
    scene.hud({
      score: state.landed,
      progress: state.light,
      hearts: state.hearts,
      extra: state.phase === 'save' ? 'tap — the catcher vine'
        : state.light < 0.26 ? 'the light is going'
        : state.phase === 'fly' ? (state.armed > 0 ? 'catcher vine out' : 'in the air')
        : baskets.length > 1 ? 'two baskets — lead one'
        : power() > 0.75 ? 'easy, it will snap'
        : b ? '' : 'stretch back from the knot'
    });
    scene.audio.setTension(state.phase === 'save' ? 0.85
      : state.light < 0.28 ? 0.7 : 0.15 + power() * 0.4);
  }

  /* ---------------------------------------------------------------- update */
  function swingBaskets() {
    for (let i = 0; i < baskets.length; i++) {
      const b = baskets[i];
      const th = state.freeze ? b.ang : b.amp * Math.cos(b.omega * state.clock + b.ph);
      b.ang = th;
      b.x = b.pivotX + Math.sin(th) * b.L;
      b.y = b.pivotY + Math.cos(th) * b.L;
      b.img.x = b.x;
      b.img.y = M.Y(b.y);
      b.img.rotation = -th * 0.85 + (b.tip ? (pr.x > b.x ? 0.5 : -0.5) * b.tip : 0);
      b.halo.x = b.x;
      b.halo.y = M.Y(b.y + 16);
      b.halo.setAlpha(0.08 + Math.abs(Math.cos(b.omega * state.clock + b.ph)) * 0.05);
    }
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const lean = clamp(state.wind * 0.2 + Math.sin(state.clock * 1.5 + o.ph) * 5, -28, 28);
      if (o.kind === 'liana') {
        o.sway = lean;
        o.x1 = o.bx1; o.y1 = o.by1;
        o.x2 = o.bx1 + lean; o.y2 = o.by2;
        o.img.x = o.bx1;
        o.img.y = M.Y(o.by1);
        o.img.rotation = Math.atan2(lean, o.by2 - o.by1);
      } else {
        o.sway = lean * 0.18;
        o.x1 = o.bx1; o.x2 = o.bx2;
        o.y1 = o.by1 + o.sway; o.y2 = o.by2 + o.sway;
        o.img.x = (o.bx1 + o.bx2) / 2;
        o.img.y = M.Y((o.by1 + o.by2) / 2 + o.sway);
        o.img.rotation = o.ang;
      }
    }
  }

  function stepFlight(dt) {
    state.acc += dt;
    let guard = 8;
    while (state.acc >= STEP && guard-- > 0) {
      state.acc -= STEP;
      const x0 = pr.x, y0 = pr.y;
      integrate(STEP, pr);
      if (pr.y < pr.peak) pr.peak = pr.y;
      pr.spin = Math.atan2(pr.vy, pr.vx);
      if (pr.y < 12 && pr.vy < 0) {
        pr.vy = Math.abs(pr.vy) * 0.4;
        pr.y = 12;
        scene.burst(pr.x, M.Y(14), 0x86a857, 6, { life: 420, gravity: 200, scale: 0.35 * K });
        if (scene.audio.ctx) scene.audio.burst({ dur: 0.16, freq: 900, q: 1.4, gain: 0.04, sweep: -300 });
      }
      const hit = blocked(pr.x, pr.y);
      if (hit) {
        loseHatch(hit.kind === 'liana' ? 'liana' : 'branch',
          hit.kind === 'liana' ? 'a hatchling wrapped in a liana stops being a hatchling'
            : 'that branch was always going to win');
        scene.burst(pr.x, M.Y(pr.y), 0x9ec267, 18, { life: 700, gravity: 260, spin: true, scale: 0.55 * K });
        scene.sfx('bad');
        return;
      }
      for (let i = 0; i < baskets.length; i++) {
        const b = baskets[i];
        const dist = Math.hypot(pr.x - b.x, pr.y - b.y);
        if (dist < pr.nearest) pr.nearest = dist;
        if (pr.vy <= 0 || y0 > b.y || pr.y < b.y) continue;
        // measure at the mouth line itself, so the sub-step that happens to
        // land high in the band cannot borrow a tighter score than the arc earned
        const f = (b.y - y0) / (pr.y - y0);
        const ad = Math.abs(x0 + (pr.x - x0) * f - b.x);
        if (ad > b.halfW * 1.14) continue;
        if (ad <= b.halfW * 0.34) return land(b, 'perfect');
        if (ad <= b.halfW * 0.82) return land(b, 'clean');
        return rimHit(b);
      }
      if (pr.y >= FLOOR) {
        loseHatch('ground', 'the ferns take one. they always take one.');
        return;
      }
      if (pr.x > W + 24 || pr.x < -24) {
        loseHatch('out', 'that one went over the ridge and stayed gone');
        return;
      }
    }
    hatch.setVisible(true).setTexture('vc-hatch-fright');
    hatch.x = pr.x;
    hatch.y = M.Y(pr.y);
    hatch.rotation = pr.spin;
    halo.x = pr.x;
    halo.y = M.Y(pr.y);
    halo.setScale((1.2 + power() * 0.2) * K);
    if (Math.random() < dt * 30) trail.emitParticleAt(pr.x, M.Y(pr.y), 1);
  }

  function stepTumble(dt) {
    state.saveWindow -= dt;
    state.armed = Math.max(0, state.armed - dt);
    const t = state.tumble;
    t.vy += GRAV * 0.35 * dt;
    t.vx += state.wind * 0.3 * dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.spin += dt * 7;
    hatch.setVisible(true);
    hatch.x = t.x;
    hatch.y = M.Y(clamp(t.y, 20, FLOOR));
    hatch.rotation = t.spin;
    hatch.setTexture('vc-hatch-fright');
    halo.x = hatch.x;
    halo.y = hatch.y;
    if (t.y >= FLOOR - 6) { saveMiss(saveTarget); return; }
    if (state.saveWindow <= 0) saveMiss(saveTarget);
  }

  function drainLight(dt) {
    state.light -= dt * (0.046 + state.diff * 0.03);
    if (state.light <= 0) {
      state.light = 0.52;
      state.lost++;
      state.hearts--;
      buildQueue();
      scene.sfx('bad');
      scene.shake(240, 0.01);
      if (state.hearts <= 0) { finishRun(state.landed >= STAR[0]); return; }
      scene.notice('the canopy goes dark and a hatchling goes with it', 2000);
      if (state.phase === 'aim') newRound();
    }
  }

  function keyboardAim(dt) {
    if (state.phase !== 'aim') return;
    const step = 340 * dt;
    let moved = false;
    if (keys.left.isDown || keys.a.isDown) { state.pull.x -= step; moved = true; }
    if (keys.right.isDown || keys.d.isDown) { state.pull.x += step; moved = true; }
    if (keys.up.isDown || keys.w.isDown) { state.pull.y -= step; moved = true; }
    if (keys.down.isDown || keys.s.isDown) { state.pull.y += step; moved = true; }
    if (moved) {
      state.kbPull = true;
      state.aiming = true;
      setPull(state.pull.x, state.pull.y);
    }
  }

  function creak(time) {
    if (state.phase !== 'aim' || !state.aiming) return;
    const p = power();
    if (p > 0.55 && Math.floor(time / 150) !== state.creakTick) {
      state.creakTick = Math.floor(time / 150);
      if (scene.audio.ctx) {
        scene.audio.burst({ dur: 0.1, freq: 240 + p * 300, q: 3.2, gain: 0.02 + p * 0.03, sweep: -90 });
      }
    }
  }

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.clock += dt;
    updateWind(dt);
    swingBaskets();
    keyboardAim(dt);
    creak(time);
    drainLight(dt);

    if (state.phase === 'fly') stepFlight(dt);
    else if (state.phase === 'save') stepTumble(dt);
    else {
      hatch.setVisible(true);
      hatch.setTexture(power() > 0.6 ? 'vc-hatch-fright' : 'vc-hatch-calm');
      hatch.x = state.aiming ? state.pull.x : ANCHOR.x;
      hatch.y = M.Y(state.aiming ? state.pull.y : ANCHOR.y - 4 + Math.sin(time / 620) * 3);
      hatch.rotation = state.aiming ? Math.atan2(ANCHOR.y - state.pull.y, ANCHOR.x - state.pull.x) + Math.PI : Math.sin(time / 500) * 0.1;
      halo.x = hatch.x;
      halo.y = hatch.y;
      halo.setScale((1 + power() * 0.6) * K);
      halo.setAlpha(0.12 + power() * 0.2);
    }
    state.armed = Math.max(0, state.armed - (state.phase === 'fly' ? dt : 0));

    for (let i = 0; i < drift.length; i++) {
      const d = drift[i];
      d.img.x += (d.v + state.wind * 1.5) * dt;
      d.img.y += Math.sin(time / 1200 + d.ph) * dt * 10;
      d.img.rotation += d.spin * dt + state.wind * dt * 0.004;
      if (d.img.x > W + 120) d.img.x = -120;
      if (d.img.x < -120) d.img.x = W + 120;
    }
    for (let i = 0; i < queue.length; i++) {
      const q = queue[i];
      q.y = M.Y(q._y + Math.sin(time / 700 + q._ph) * 3);
      q.setAngle(Math.sin(time / 620 + q._ph) * 6);
    }

    drawRopes(time);
    drawAim(time);
    hudAll();
  }

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'stretch back from the knot' });
  scene.notice('hatchlings dislike flying. they like landing. lead the basket', 2800);

  return {
    update,
    state: () => ({
      landed: state.landed,
      hearts: state.hearts,
      lost: state.lost,
      round: state.round,
      phase: state.phase,
      light: Number(state.light.toFixed(3)),
      wind: Math.round(state.wind),
      power: Number(power().toFixed(2)),
      pull: { x: Math.round(state.pull.x), y: Math.round(state.pull.y) },
      flight: { x: Math.round(pr.x), y: Math.round(pr.y), t: Number(pr.t.toFixed(2)) },
      basket: baskets.map((b) => ({
        x: Math.round(b.x), y: Math.round(b.y), halfW: Math.round(b.halfW), angle: Number(b.ang.toFixed(3)),
        L: Math.round(b.L), swing: Number(b.amp.toFixed(3)), speed: Number((b.omega * b.amp).toFixed(2))
      })),
      saveWindow: Number(state.saveWindow.toFixed(2)),
      armed: Number(state.armed.toFixed(2)),
      obstacles: obstacles.map((o) => ({ kind: o.kind, x1: Math.round(o.x1), y1: Math.round(o.y1), x2: Math.round(o.x2), y2: Math.round(o.y2), r: o.r })),
      last: state.last,
      over: state.over
    }),
    params: () => ({ anchor: ANCHOR, gravity: GRAV, vmax: VMAX, maxDrag: MAXDRAG, gain: GAIN, floor: FLOOR, stars: STAR }),
    targets: () => baskets.map((b) => ({ x: b.x, y: b.y, halfW: b.halfW, pivotX: b.pivotX, pivotY: b.pivotY, L: b.L, amp: b.amp, omega: b.omega })),
    basketAt: (i, lead) => basketAt(i | 0, Number(lead) || 0),
    // the vine geometry for a launch that passes through (x, y) at the time solved
    stretchFor: (x, y, hintT) => {
      const sol = solve(Number(x), Number(y), Number(hintT) || 1.3);
      return sol ? { x: Math.round(sol.ox), y: Math.round(sol.oy), t: Number(sol.t.toFixed(2)), speed: Math.round(sol.sp) } : null;
    },
    // samples the arc the current stretch would take, using the flight integrator
    pathOf: (px, py, maxT) => {
      if (px !== undefined && py !== undefined) setPull(Number(px), Number(py));
      const vx = (ANCHOR.x - state.pull.x) * GAIN;
      const vy = (ANCHOR.y - state.pull.y) * GAIN;
      return arcFrom(state.pull.x, state.pull.y, vx, vy, Number(maxT) || 2.4, state.wind)
        .map((p) => ({ x: Math.round(p.x), y: Math.round(p.y), t: Number(p.t.toFixed(2)) }));
    },
    stretchTo: (x, y) => { setPull(Number(x), Number(y)); return { x: state.pull.x, y: state.pull.y, power: Number(power().toFixed(2)) }; },
    launch,
    // solve a static point, set the vine to it and throw — the probe leans on
    // this to put a hatchling exactly where it wants one
    shootAt: (x, y, hintT) => {
      const sol = solve(Number(x), Number(y), Number(hintT) || 1.3);
      if (!sol) return null;
      setPull(sol.ox, sol.oy);
      return launch() ? { t: Number(sol.t.toFixed(2)), speed: Math.round(sol.sp), power: Number(power().toFixed(2)) } : null;
    },
    // aims at the basket as if it were standing still (lead 0) or as if it will
    // still be there in lead seconds — the probe uses the gap between them
    serve: (i, lead, hint) => {
      const idx = i | 0;
      const lt = Number(lead);
      const ht = Number(hint) || 1.3;
      let t = lt > 0 ? lt : ht;
      let sol = null;
      if (lt > 0) {
        for (let g = 0; g < 9; g++) {
          const pt = basketAt(idx, t);
          if (!pt) return null;
          sol = solve(pt.x, pt.y, t);
          if (!sol) break;
          t = sol.t;
        }
      } else {
        const pt = basketAt(idx, 0);
        if (!pt) return null;
        sol = solve(pt.x, pt.y, ht);
      }
      if (!sol) return null;
      setPull(sol.ox, sol.oy);
      const ok = launch();
      return ok ? { t: Number(sol.t.toFixed(2)), x: Math.round(sol.ox), y: Math.round(sol.oy) } : null;
    },
    bestStretch: (i) => {
      const pick = bestPick(i);
      if (!pick) return null;
      return {
        x: Math.round(pick.sol.ox * 100) / 100, y: Math.round(pick.sol.oy * 100) / 100,
        t: Number(pick.sol.t.toFixed(2)), basket: pick.i, clear: pick.clear
      };
    },
    autoServe: (i) => {
      const pick = bestPick(i);
      if (!pick) return null;
      setPull(pick.sol.ox, pick.sol.oy);
      const ok = launch();
      return ok ? { x: pick.sol.ox, y: pick.sol.oy, t: Number(pick.sol.t.toFixed(2)), basket: pick.i, clear: pick.clear } : null;
    },
    tap: () => {
      if (state.phase === 'save') return doCatch(saveTarget || baskets[0]);
      if (state.phase === 'fly') { state.armed = 0.85; scene.sfx('whoosh'); return true; }
      return false;
    },
    setHearts: (n) => { state.hearts = clamp(Number(n), 0, 3); buildQueue(); },
    setLanded: (n) => { state.landed = clamp(Number(n), 0, 40); },
    setLight: (v) => { state.light = clamp(Number(v), 0, 1); },
    setWind: (v, hold) => {
      state.wind = Number(v) || 0;
      state.windTarget = state.wind;
      state.windHold = hold !== false;
    },
    setRound: (n) => {
      state.round = clamp(Number(n), 1, 40);
      state.diff = clamp((state.round - 1) / 14, 0, 1);
      clearBaskets();
      clearObstacles();
      const count = state.round < 4 ? 1 : 2;
      for (let i = 0; i < count; i++) hang(i, count);
      makeObstacles();
      state.phase = 'aim';
      state.aiming = false;
      state.saveWindow = 0;
      state.armed = 0;
      saveTarget = null;
      state.pull = { x: ANCHOR.x, y: ANCHOR.y };
      return { round: state.round, baskets: baskets.length, obstacles: obstacles.length };
    },
    // one still basket, hung exactly where the probe asks — for aim tests that
    // need the target not to move while a single variable changes
    hangAt: (x, y, amp, rope) => {
      clearBaskets();
      const baseAmp = amp === undefined ? 0 : clamp(Number(amp), 0, 1);
      const L = clamp(Number(rope) || 190, 90, 330);
      const b = {
        pivotX: Number(x), pivotY: clamp(Number(y) - L, 40, 220), L, baseAmp,
        amp: baseAmp * state.swingScale, ph: 0, omega: Math.sqrt(900 / L),
        halfW: 30, x: Number(x), y: Number(y), ang: 0, tip: 0
      };
      b.img = scene.add.image(b.x, M.Y(b.y), 'vc-basket').setDepth(17)
        .setOrigin(0.5, 20 / 104).setScale(fit(120, b.halfW * 2.35));
      b.halo = scene.add.image(b.x, M.Y(b.y + 16), 'arc-glow').setDepth(16).setScale(1.1 * K)
        .setAlpha(0.1).setBlendMode(Phaser.BlendModes.ADD).setTint(ACCENT);
      baskets.push(b);
      return { x: b.x, y: b.y, halfW: b.halfW };
    },
    addBranchAt: (x, y, len) => {
      const l = Number(len) || 170;
      addObstacle({
        kind: 'branch', tex: 'vc-branch', x1: Number(x) - l / 2, y1: Number(y),
        x2: Number(x) + l / 2, y2: Number(y), r: 17, sway: 0, ph: 0,
        cx: Number(x), cy: Number(y), ang: 0, scale: fit(340, l * 1.08), ox: 0.5, oy: 0.5
      });
      return { x: Number(x), y: Number(y), len: l, r: 17 };
    },
    addLianaAt: (x, y0, y1) => {
      addLiana(Number(x), Number(y1), Math.abs(Number(y1) - Number(y0)));
      return { x: Number(x), y0: Number(y0), y1: Number(y1) };
    },
    clearObstacles,
    clearBaskets,
    setSwing: (v) => {
      state.swingScale = clamp(Number(v), 0, 3);
      baskets.forEach((b) => { b.amp = b.baseAmp * state.swingScale; });
    },
    setFreeze: (on) => { state.freeze = !!on; },
    stars: STAR
  };
}

export default { id: 'vine-cannon', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
