// Stego Stand — the nest at dusk.
// The hunters come from both sides of the clearing, coil, then spring for the
// eggs. Turn the spiked tail toward the threat and time the sweep. Every clean
// stand feeds the plate-sail; a full sail makes the next swing a hammer.

import { canvasTex, grain, rng, clamp, W } from '../engine.js?v=du-58e7197a7bd67562';

const GROUND = 468;
const FEET = 500;
const NEST_X = 480;
const NEST_Y = 508;
const GOAL = 32;
const STAR = [10, 20, 32];
const REACH = 224;
const HEAVY_REACH = 300;
const GLOW_MAX = 6;
const WIND = 0.1;
const ACT = 0.18;
const REC = 0.24;

function stegoArt(scene) {
  ['idle', 'swing'].forEach((pose) => {
    canvasTex(scene, 'ss-stego-' + pose, 300, 210, (c) => {
      const swing = pose === 'swing';
      const rand = rng(97);

      // spiked tail, drawn first so the body and plates sit over its root
      c.lineCap = 'round';
      c.strokeStyle = '#5a3f45';
      c.lineWidth = 27;
      c.beginPath();
      if (swing) {
        c.moveTo(112, 130);
        c.quadraticCurveTo(146, 46, 250, 26);
      } else {
        c.moveTo(112, 130);
        c.quadraticCurveTo(54, 112, 18, 76);
      }
      c.stroke();
      c.strokeStyle = '#7a565a';
      c.lineWidth = 16;
      c.beginPath();
      if (swing) {
        c.moveTo(118, 128);
        c.quadraticCurveTo(152, 58, 250, 30);
      } else {
        c.moveTo(118, 130);
        c.quadraticCurveTo(60, 114, 24, 82);
      }
      c.stroke();

      // thagomizer spikes
      const tip = swing ? [250, 30] : [22, 78];
      const dir = swing ? [0.94, -0.34] : [-0.94, -0.32];
      c.fillStyle = '#f3e3bd';
      for (let i = 0; i < 4; i++) {
        const bx = tip[0] - dir[0] * (i * 15 - 8);
        const by = tip[1] - dir[1] * (i * 15 - 8);
        const a = Math.atan2(dir[1], dir[0]) + (i - 1.5) * 0.42;
        const len = 30 + (i % 2) * 8;
        c.beginPath();
        c.moveTo(bx - Math.sin(a) * 8, by + Math.cos(a) * 8);
        c.lineTo(bx + Math.cos(a) * len, by + Math.sin(a) * len);
        c.lineTo(bx + Math.sin(a) * 8, by - Math.cos(a) * 8);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(120,86,50,0.4)';
        c.lineWidth = 1.4;
        c.stroke();
      }

      // legs
      const legs = [[146, 164, 130, 204], [210, 164, 220, 204]];
      legs.forEach(([hx, hy, fx, fy], i) => {
        c.strokeStyle = i ? '#5d4248' : '#6d4d52';
        c.lineWidth = 21;
        c.beginPath();
        c.moveTo(hx, hy);
        c.quadraticCurveTo((hx + fx) / 2 + 6, (hy + fy) / 2, fx, fy);
        c.stroke();
        c.fillStyle = '#3a2a2e';
        c.beginPath(); c.ellipse(fx + 4, fy, 15, 7, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#e9d9b4';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(fx + 12, fy - 2); c.lineTo(fx + 24, fy - 3);
        c.moveTo(fx + 12, fy + 1); c.lineTo(fx + 23, fy + 5);
        c.stroke();
      });

      // body
      const body = c.createLinearGradient(100, 70, 230, 180);
      body.addColorStop(0, '#7c565c');
      body.addColorStop(0.5, '#5f4148');
      body.addColorStop(1, '#3d2b31');
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(174, 126, 68, 51, -0.04, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(214,170,140,0.24)';
      c.beginPath(); c.ellipse(178, 148, 48, 18, -0.04, 0, Math.PI * 2); c.fill();

      // shoulder and haunch
      c.fillStyle = 'rgba(30,20,24,0.16)';
      c.beginPath(); c.ellipse(214, 120, 30, 38, 0.1, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(134, 124, 30, 40, -0.12, 0, Math.PI * 2); c.fill();

      // scaled hide
      c.strokeStyle = 'rgba(38,26,30,0.34)';
      c.lineWidth = 1.6;
      for (let i = 0; i < 22; i++) {
        const x = 118 + (i * 47) % 100;
        const y = 92 + (i * 31) % 58;
        c.beginPath();
        c.arc(x, y, 5 + (i % 3) * 2, 0.3, 2.5);
        c.stroke();
      }

      // dorsal plates
      const plates = [
        [128, 84, 22, 26], [152, 74, 30, 38], [178, 66, 36, 46],
        [204, 70, 32, 42], [228, 80, 24, 30], [246, 92, 16, 20]
      ];
      plates.forEach(([px, py, hw, hh], i) => {
        const g = c.createLinearGradient(px - hw, py - hh, px + hw, py + 8);
        g.addColorStop(0, '#f0a463');
        g.addColorStop(0.55, '#d0714a');
        g.addColorStop(1, '#8f4038');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(px - hw, py + 8);
        c.quadraticCurveTo(px - hw * 0.9, py - hh * 0.8, px - hw * 0.2 + i * 1.2, py - hh);
        c.quadraticCurveTo(px + hw * 0.55, py - hh * 0.55, px + hw, py + 8);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(255,214,150,0.42)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(px - hw * 0.55, py - hh * 0.1);
        c.quadraticCurveTo(px - hw * 0.3, py - hh * 0.7, px - hw * 0.05, py - hh * 0.92);
        c.stroke();
      });

      // neck + small head, watching the side the tail guards
      c.strokeStyle = '#6b4a50';
      c.lineWidth = 24;
      c.beginPath();
      c.moveTo(224, 108);
      c.quadraticCurveTo(244, 92, 258, 96);
      c.stroke();
      c.fillStyle = '#7a565c';
      c.beginPath(); c.ellipse(262, 96, 19, 14, -0.16, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#4a3338';
      c.beginPath();
      c.moveTo(270, 102); c.quadraticCurveTo(288, 106, 284, 112);
      c.quadraticCurveTo(276, 111, 268, 108); c.closePath(); c.fill();
      c.fillStyle = '#f8ecc8';
      c.beginPath(); c.arc(264, 91, 4.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1d1518';
      c.beginPath(); c.arc(265.2, 91, 2.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(263.6, 89.6, 1, 0, Math.PI * 2); c.fill();

      // beak tip and brow
      c.strokeStyle = '#3d2a2e';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(270, 88); c.quadraticCurveTo(280, 86, 284, 90); c.stroke();

      // warm rim from the setting sun
      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(70, 60, 260, 170);
      rim.addColorStop(0, 'rgba(255,206,150,0.3)');
      rim.addColorStop(0.5, 'rgba(255,206,150,0.02)');
      rim.addColorStop(1, 'rgba(255,150,90,0.16)');
      c.fillStyle = rim;
      c.fillRect(0, 0, 300, 210);
      c.globalCompositeOperation = 'source-over';
      grain(c, 300, 210, 0.03, 137 + rand() * 9);
    });
  });
}

function hunterArt(scene) {
  canvasTex(scene, 'ss-raptor-walk', 176, 124, (c) => {
    const rand = rng(53);
    // tail held high
    c.strokeStyle = '#46594a';
    c.lineWidth = 10;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(128, 80); c.quadraticCurveTo(158, 78, 168, 50); c.stroke();
    c.strokeStyle = '#33453a';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(140 + i * 7, 78); c.lineTo(146 + i * 7, 66 - i * 3); c.stroke();
    }

    // body
    const body = c.createLinearGradient(58, 40, 150, 104);
    body.addColorStop(0, '#8ba06c');
    body.addColorStop(0.55, '#5c7753');
    body.addColorStop(1, '#374c3c');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(100, 72, 43, 25, -0.12, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(206,220,160,0.28)';
    c.beginPath(); c.ellipse(104, 84, 30, 9, -0.08, 0, Math.PI * 2); c.fill();

    // stripes
    c.strokeStyle = 'rgba(28,46,34,0.55)';
    c.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(82 + i * 15, 50 + i * 2);
      c.quadraticCurveTo(88 + i * 15, 66, 84 + i * 15, 80);
      c.stroke();
    }

    // neck and long head
    c.strokeStyle = '#74905f';
    c.lineWidth = 13;
    c.beginPath(); c.moveTo(70, 60); c.quadraticCurveTo(54, 48, 46, 50); c.stroke();
    c.fillStyle = '#84a06a';
    c.beginPath(); c.ellipse(40, 52, 22, 12, 0.1, 0, Math.PI * 2); c.fill();
    c.beginPath();
    c.moveTo(28, 48); c.quadraticCurveTo(6, 50, 4, 58);
    c.quadraticCurveTo(16, 60, 28, 58); c.closePath(); c.fill();
    c.fillStyle = '#2a3323';
    c.beginPath();
    c.moveTo(20, 52); c.quadraticCurveTo(8, 53, 5, 57);
    c.quadraticCurveTo(14, 58, 21, 57); c.closePath(); c.fill();
    c.strokeStyle = '#efe3bd';
    c.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(10 + i * 4, 57); c.lineTo(11 + i * 4, 61); c.stroke();
    }

    // eye
    c.fillStyle = '#f6e6b4';
    c.beginPath(); c.arc(44, 47, 4.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a1d12';
    c.beginPath(); c.arc(43, 47, 2.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffb469';
    c.beginPath(); c.arc(42.6, 46.4, 1, 0, Math.PI * 2); c.fill();

    // arms
    c.strokeStyle = '#5a7551';
    c.lineWidth = 5;
    c.beginPath(); c.moveTo(76, 80); c.quadraticCurveTo(68, 92, 60, 90); c.stroke();
    c.strokeStyle = '#e8d8ae';
    c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(60, 90); c.lineTo(52, 92); c.stroke();

    // legs
    const legs = [[96, 90, 112, 112, 120], [78, 90, 66, 112, 76]];
    legs.forEach(([hx, hy, kx, ky, fx], i) => {
      c.strokeStyle = i ? '#4a6247' : '#5c7852';
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(hx, hy); c.quadraticCurveTo(kx, ky - 6, kx, ky); c.lineTo(fx, 118);
      c.stroke();
      c.strokeStyle = '#e8d8ae';
      c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(fx, 118); c.lineTo(fx + 10, 119); c.stroke();
    });
    c.strokeStyle = '#efe2bb';
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(112, 106); c.quadraticCurveTo(122, 108, 120, 116); c.stroke();

    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(0, 20, 120, 100);
    rim.addColorStop(0, 'rgba(255,206,150,0.26)');
    rim.addColorStop(0.6, 'rgba(255,206,150,0)');
    c.fillStyle = rim; c.fillRect(0, 0, 176, 124);
    c.globalCompositeOperation = 'source-over';
    grain(c, 176, 124, 0.04, 61 + rand() * 18);
  });

  canvasTex(scene, 'ss-raptor-leap', 200, 116, (c) => {
    const rand = rng(67);
    c.strokeStyle = '#46594a';
    c.lineWidth = 10;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(146, 58); c.quadraticCurveTo(182, 56, 196, 34); c.stroke();

    const body = c.createLinearGradient(60, 30, 160, 100);
    body.addColorStop(0, '#8ba06c');
    body.addColorStop(1, '#3a5040');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(112, 62, 52, 19, -0.14, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(28,46,34,0.5)';
    c.lineWidth = 3.5;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(94 + i * 15, 46 + i * 2); c.lineTo(90 + i * 15, 74); c.stroke();
    }

    // head thrust forward, jaws wide
    c.strokeStyle = '#74905f';
    c.lineWidth = 12;
    c.beginPath(); c.moveTo(76, 54); c.quadraticCurveTo(58, 46, 44, 44); c.stroke();
    c.fillStyle = '#87a36c';
    c.beginPath(); c.ellipse(36, 46, 22, 12, -0.12, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2c3624';
    c.beginPath();
    c.moveTo(24, 40); c.quadraticCurveTo(0, 34, 2, 44);
    c.quadraticCurveTo(14, 46, 24, 46); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(24, 48); c.quadraticCurveTo(4, 56, 8, 62);
    c.quadraticCurveTo(18, 58, 26, 54); c.closePath(); c.fill();
    c.strokeStyle = '#efe3bd'; c.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) {
      c.beginPath(); c.moveTo(8 + i * 4, 47); c.lineTo(9 + i * 4, 51); c.stroke();
    }
    c.fillStyle = '#f6e6b4';
    c.beginPath(); c.arc(40, 41, 4.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a1d12';
    c.beginPath(); c.arc(39, 41, 2.3, 0, Math.PI * 2); c.fill();

    // trailing legs
    [[126, 70, 168, 92], [112, 72, 148, 104]].forEach(([hx, hy, fx, fy], i) => {
      c.strokeStyle = i ? '#47603f' : '#587a4e';
      c.lineWidth = 9;
      c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + 22, hy + 8, fx, fy); c.stroke();
      c.strokeStyle = '#e8d8ae'; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 11, fy); c.stroke();
    });

    grain(c, 200, 116, 0.04, 71 + rand() * 12);
  });
}

function nestArt(scene) {
  canvasTex(scene, 'ss-nest', 270, 260, (c) => {
    const rand = rng(131);
    c.fillStyle = 'rgba(46,32,28,0.4)';
    c.beginPath(); c.ellipse(135, 248, 116, 16, 0, 0, Math.PI * 2); c.fill();

    // tall earthen mound, so the nest clears the hero's back and the eggs read
    const mound = c.createLinearGradient(30, 100, 240, 250);
    mound.addColorStop(0, '#7a5c3e');
    mound.addColorStop(0.45, '#563f2c');
    mound.addColorStop(1, '#2b2019');
    c.fillStyle = mound;
    c.beginPath();
    c.moveTo(14, 248);
    c.quadraticCurveTo(24, 170, 62, 146);
    c.quadraticCurveTo(106, 118, 135, 116);
    c.quadraticCurveTo(176, 116, 214, 148);
    c.quadraticCurveTo(248, 176, 256, 248);
    c.closePath(); c.fill();

    // rock faces in the mound
    c.strokeStyle = 'rgba(28,20,16,0.5)';
    c.lineWidth = 2.4;
    for (let i = 0; i < 7; i++) {
      const x = 40 + (i * 61) % 190;
      c.beginPath();
      c.moveTo(x, 168 + (i % 3) * 24);
      c.quadraticCurveTo(x + 12, 196 + (i % 4) * 10, x - 6, 236);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,206,140,0.08)';
    for (let i = 0; i < 10; i++) {
      const x = 34 + (i * 53) % 196;
      c.beginPath(); c.ellipse(x, 160 + (i * 37) % 76, 10 + (i % 4) * 4, 4, -0.2, 0, Math.PI * 2); c.fill();
    }

    // bowl
    c.fillStyle = '#2b201a';
    c.beginPath(); c.ellipse(135, 126, 88, 34, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(18,12,10,0.75)';
    c.beginPath(); c.ellipse(135, 130, 74, 27, 0, 0, Math.PI * 2); c.fill();

    // woven rim
    c.lineCap = 'round';
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const x = 135 + Math.cos(a) * 90;
      const y = 126 + Math.sin(a) * 35;
      const a2 = a + 0.42;
      c.strokeStyle = i % 3 ? '#94714a' : '#6b4c2e';
      c.lineWidth = 3.6;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(a2) * 22, y + Math.sin(a2) * 11 - 7, x + Math.cos(a + 0.9) * 30, y + Math.sin(a + 0.9) * 13);
      c.stroke();
    }
    c.strokeStyle = 'rgba(214,172,112,0.4)';
    c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(135, 122, 92, 35, 0, Math.PI, Math.PI * 2); c.stroke();

    // grass and ferns around the base
    c.strokeStyle = '#52683f';
    c.lineWidth = 3;
    for (let i = 0; i < 20; i++) {
      const x = 20 + (i * 67) % 232;
      const y = 210 + (i % 4) * 8;
      c.beginPath();
      c.moveTo(x, y + 22);
      c.quadraticCurveTo(x + 7, y - 2, x + (i % 2 ? -14 : 20), y - 26 - (i % 3) * 9);
      c.stroke();
    }
    c.fillStyle = 'rgba(244,196,120,0.1)';
    c.beginPath(); c.ellipse(112, 118, 44, 13, 0, 0, Math.PI * 2); c.fill();
    grain(c, 270, 260, 0.04, 141 + rand() * 20);
  });

  canvasTex(scene, 'ss-egg', 46, 62, (c) => {
    const g = c.createRadialGradient(16, 18, 2, 24, 34, 34);
    g.addColorStop(0, '#fff6d8');
    g.addColorStop(0.6, '#e8d5a4');
    g.addColorStop(1, '#b79d6c');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(23, 32, 18, 26, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(122,96,58,0.4)';
    for (let i = 0; i < 9; i++) {
      const x = 12 + (i * 23) % 24, y = 16 + (i * 31) % 30;
      c.beginPath(); c.ellipse(x, y, 1.8, 1.2, i, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.ellipse(16, 18, 4, 8, -0.4, 0, Math.PI * 2); c.fill();
  });

  canvasTex(scene, 'ss-fern', 150, 200, (c) => {
    c.strokeStyle = '#4a5c3e';
    c.lineWidth = 3;
    c.lineCap = 'round';
    for (let f = 0; f < 5; f++) {
      c.beginPath();
      c.moveTo(75, 200);
      c.quadraticCurveTo(40 + f * 18, 120, 30 + f * 24, 24);
      c.stroke();
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        const x = 75 + (30 + f * 24 - 75) * t;
        const y = 200 - 176 * t;
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x - 14, y - 4, x - 24 + i, y - 12);
        c.moveTo(x, y);
        c.quadraticCurveTo(x + 14, y - 4, x + 24 - i, y - 12);
        c.stroke();
      }
    }
  });

  canvasTex(scene, 'ss-swipe', 460, 240, (c) => {
    const cx = 230, cy = 120;
    const g = c.createRadialGradient(cx, cy, 74, cx, cy, 192);
    g.addColorStop(0, 'rgba(255,220,160,0)');
    g.addColorStop(0.35, 'rgba(255,206,140,0.08)');
    g.addColorStop(0.68, 'rgba(255,222,162,0.42)');
    g.addColorStop(0.88, 'rgba(255,248,220,0.96)');
    g.addColorStop(1, 'rgba(255,180,100,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, 192, -0.52, 0.52);
    c.arc(cx, cy, 74, 0.52, -0.52, true);
    c.closePath(); c.fill();

    c.strokeStyle = 'rgba(255,244,212,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      c.beginPath(); c.arc(cx, cy, 120 + i * 32, -0.44, -0.12); c.stroke();
    }

    c.fillStyle = 'rgba(255,242,208,0.92)';
    [-0.32, 0, 0.32].forEach((a) => {
      const x = cx + Math.cos(a) * 186, y = cy + Math.sin(a) * 186;
      c.save();
      c.translate(x, y);
      c.rotate(a);
      c.beginPath(); c.moveTo(-9, -10); c.lineTo(30, 0); c.lineTo(-9, 10); c.closePath(); c.fill();
      c.restore();
    });
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  stegoArt(scene);
  hunterArt(scene);
  nestArt(scene);

  const r = rng(8128);
  const state = {
    stands: 0, hearts: 3, glow: 0, facing: 1, combo: 0, comboT: 0,
    swingAge: -1, heavy: false, swipeShown: false, over: false,
    spawnT: 1.25, time: 0, chargedNote: false
  };

  // warm nest light behind the bowl
  const nestGlow = scene.add.image(NEST_X, M.Y(NEST_Y - 118), 'arc-glow')
    .setDepth(7.5).setScale(1.15 * K).setAlpha(0.26)
    .setTint(0xffc27a).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: nestGlow, alpha: 0.36, scale: 1.28 * K, duration: 2300, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  scene.add.image(NEST_X, M.Y(NEST_Y), 'ss-nest').setOrigin(0.5, 1).setDepth(7).setScale(0.98 * K);

  const eggs = [];
  [-44, 0, 44].forEach((ox, i) => {
    const egg = scene.add.image(NEST_X + ox, M.Y(NEST_Y - 130) + i * 2, 'ss-egg')
      .setOrigin(0.5, 1).setDepth(8).setScale((0.9 + (i === 1 ? 0.05 : 0)) * K);
    egg.rotation = (i - 1) * 0.14;
    scene.tweens.add({
      targets: egg, scaleX: egg.scaleX * 1.04, scaleY: egg.scaleY * 1.04,
      duration: 1500 + i * 210, yoyo: true, repeat: -1, ease: 'sine.inOut'
    });
    eggs.push(egg);
  });

  // soft fern silhouettes on the near edge of the clearing
  const ferns = [];
  for (let i = 0; i < 6; i++) {
    const x = 40 + i * 176 + r() * 40;
    if (Math.abs(x - NEST_X) < 130) continue;
    const f = scene.add.image(x, M.Y(506), 'ss-fern').setOrigin(0.5, 1).setAlpha(0.35);
    f.setScale((0.5 + r() * 0.24) * K).setDepth(13).setTint(0x86606a);
    ferns.push(f);
  }

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 40, max: 170 }, angle: { min: 190, max: 350 },
    lifespan: { min: 280, max: 620 }, scale: { start: 0.5, end: 0 },
    alpha: { start: 0.45, end: 0 }, tint: 0xd0b090, gravityY: 200, emitting: false
  }).setDepth(15);
  const sparks = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 90, max: 330 }, lifespan: 500, scale: { start: 0.55, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0xffcf80, gravityY: 380, emitting: false
  }).setDepth(16);
  const fireflies = scene.add.particles(0, 0, 'arc-dot', {
    x: { min: NEST_X - 150, max: NEST_X + 150 }, y: { min: M.Y(NEST_Y - 120), max: M.Y(NEST_Y + 20) },
    speedX: { min: -14, max: 14 }, speedY: { min: -20, max: -4 },
    lifespan: { min: 1600, max: 3200 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.7, end: 0 },
    tint: 0xffcf7a, frequency: 260, quantity: 1, blendMode: 'ADD'
  }).setDepth(14);

  const player = scene.add.image(NEST_X, M.Y(FEET), 'ss-stego-idle').setOrigin(0.5, 1).setDepth(18).setScale(0.95 * K);
  const sail = scene.add.image(NEST_X, M.Y(FEET) - 112 * K, 'arc-glow')
    .setDepth(17).setScale(0.9 * K).setAlpha(0).setTint(0xffa45c).setBlendMode(Phaser.BlendModes.ADD);
  const swipe = scene.add.image(NEST_X, M.Y(GROUND - 46), 'ss-swipe')
    .setDepth(19).setAlpha(0).setScale(0.86 * K).setTint(0xffd59a).setBlendMode(Phaser.BlendModes.ADD);

  const hunters = [];

  function facingName() { return state.facing > 0 ? 'right' : 'left'; }

  function face(dir) {
    if (state.over || dir === 0) return;
    if (state.swingAge >= 0 && state.swingAge < WIND + ACT) return;
    const next = dir > 0 ? 1 : -1;
    if (next === state.facing) return;
    state.facing = next;
    scene.sfx('tick');
    dust.emitParticleAt(player.x - state.facing * 50 * K, M.Y(FEET), 4);
  }

  function spawnHunter(side, distance) {
    if (state.over) return null;
    const fromRight = side ? side === 'right' : r() < 0.5;
    const d = distance === undefined ? 620 : distance;
    const x = fromRight ? NEST_X + d : NEST_X - d;
    const y = GROUND - 4 + (r() * 10 - 5);
    const img = scene.add.image(x, M.Y(y), 'ss-raptor-walk').setOrigin(0.5, 1);
    img.setDepth(9 + clamp(Math.round((y - 458) * 0.5), 0, 3));
    img.setFlipX(!fromRight);
    img.setScale(0.92 * K);
    const h = {
      img, x, y, fromRight, phase: 'walk', t: 0,
      speed: 56 + r() * 34, bob: r() * 6, dead: false, scaled: 0.92
    };
    hunters.push(h);
    return h;
  }

  function turnBack(h, perfect) {
    if (h.dead) return;
    h.dead = true;
    const idx = hunters.indexOf(h);
    if (idx >= 0) hunters.splice(idx, 1);
    state.stands++;
    state.combo = state.comboT > 0 ? state.combo + 1 : 1;
    state.comboT = 3.4;
    state.glow = Math.min(GLOW_MAX, state.glow + (perfect ? 2 : 1));
    if (state.glow >= GLOW_MAX && !state.chargedNote) {
      state.chargedNote = true;
      scene.notice('The sail is full. Your next swing is a hammer.', 1800);
      scene.sfx('chime');
    }
    const dir = h.x >= NEST_X ? 1 : -1;
    scene.sfx('good');
    scene.sfx(perfect ? 'drum3' : 'drum2');
    scene.popText(h.x, M.Y(h.y - 90 * K), perfect ? 'turned mid-air' : '+1 stand', perfect ? '#ffe6a8' : '#fff0cc');
    scene.burst(h.x, M.Y(h.y - 44 * K), 0xffd79a, perfect ? 20 : 14, { life: 560, gravity: 320, spin: true });
    scene.shake(perfect ? 170 : 100, 0.006);
    scene.tweens.add({
      targets: h.img, x: h.x + dir * 300, y: h.img.y - 140 * K, angle: dir * 230, alpha: 0,
      duration: 560, ease: 'cubic.out', onComplete: () => h.img.destroy()
    });
    if (state.stands >= GOAL) endRun(true);
  }

  function stealEgg(h) {
    if (state.over || state.hearts <= 0) return;
    state.hearts--;
    state.glow = 0;
    state.chargedNote = false;
    state.combo = 0;
    const egg = eggs.pop();
    scene.sfx('bad');
    scene.shake(300, 0.017);
    scene.cameras.main.flash(210, 150, 40, 24);
    scene.popText(NEST_X, M.Y(NEST_Y - 170), 'an egg is taken', '#ff9d7a');
    if (egg) {
      scene.tweens.killTweensOf(egg);
      egg.setDepth(20);
      egg.setScale(egg.scaleX, egg.scaleY);
      scene.tweens.add({
        targets: egg, x: h.x, y: M.Y(h.y - 60), angle: 260, alpha: 0, scale: 0.4,
        duration: 720, ease: 'cubic.in', onComplete: () => egg.destroy()
      });
    }
    const left = eggs.length;
    nestGlow.setAlpha(0.18);
    scene.tweens.add({ targets: nestGlow, alpha: 0.26, duration: 900, ease: 'sine.out' });
    if (state.hearts <= 0) endRun(false);
    else scene.notice(left === 1 ? 'One egg left. Keep the tail moving.' : 'An egg is gone. Turn to the next hunter sooner.', 1800);
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    scene.finish(win, {
      score: state.stands,
      note: win ? 'The nest held until dawn.' : `${state.stands} hunter${state.stands === 1 ? '' : 's'} turned before the nest fell`
    });
  }

  function doSwipe(dir) {
    if (state.over) return;
    if (state.swingAge >= 0) return;
    if (dir) {
      const next = dir > 0 ? 1 : -1;
      if (next !== state.facing) {
        state.facing = next;
        scene.sfx('tick');
      }
    }
    state.heavy = state.glow >= GLOW_MAX;
    if (state.heavy) { state.glow = 0; state.chargedNote = false; }
    state.swingAge = 0;
    state.swipeShown = false;
    scene.sfx('whoosh');
    dust.emitParticleAt(NEST_X - state.facing * 66 * K, M.Y(FEET), state.heavy ? 16 : 7);
  }

  function showSwipe() {
    swipe.setFlipX(state.facing < 0);
    swipe.x = NEST_X;
    swipe.y = M.Y(GROUND - 66);
    swipe.setScale((state.heavy ? 1.08 : 0.86) * K);
    swipe.setAlpha(state.heavy ? 1 : 0.9);
    swipe.setTint(state.heavy ? 0xffe8b4 : 0xffd59a);
    scene.tweens.add({
      targets: swipe, alpha: 0, scale: swipe.scale * 1.18, angle: state.facing * 10,
      duration: state.heavy ? 380 : 280, ease: 'cubic.out', onComplete: () => { swipe.angle = 0; }
    });
    if (state.heavy) {
      scene.sfx('boom');
      scene.shake(300, 0.016);
      scene.cameras.main.flash(160, 255, 190, 110);
      scene.burst(NEST_X + state.facing * 120 * K, M.Y(GROUND - 40), 0xffd08a, 30, { life: 760, gravity: 260, spin: true });
      scene.notice('The sail flares — the tail falls like a hammer.', 1500);
    }
  }

  const keys = scene.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', space: 'SPACE' });
  scene.input.keyboard.on('keydown-LEFT', () => face(-1));
  scene.input.keyboard.on('keydown-A', () => face(-1));
  scene.input.keyboard.on('keydown-RIGHT', () => face(1));
  scene.input.keyboard.on('keydown-D', () => face(1));
  scene.input.keyboard.on('keydown-SPACE', () => doSwipe(state.facing));

  scene.input.on('pointerdown', (pointer) => {
    doSwipe(pointer.x < W / 2 ? -1 : 1);
  });

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'tap the side to sweep' });
  scene.notice('Turn your tail to the hunters. Swing as they coil.', 2400);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.time += dt;
    if (state.comboT > 0) state.comboT = Math.max(0, state.comboT - dt);
    else state.combo = 0;

    // swing timeline — hits resolve through the whole active arc
    let active = false;
    if (state.swingAge >= 0) {
      state.swingAge += dt;
      if (state.swingAge >= WIND) {
        active = state.swingAge < WIND + ACT;
        if (!state.swipeShown) { state.swipeShown = true; showSwipe(); }
        if (active) {
          const reach = state.heavy ? HEAVY_REACH : REACH;
          for (let i = hunters.length - 1; i >= 0; i--) {
            const h = hunters[i];
            const dx = (h.x - NEST_X) * state.facing;
            if (dx > -46 && dx < reach) turnBack(h, h.phase === 'pounce');
          }
        }
      }
      if (state.swingAge >= WIND + ACT + REC) { state.swingAge = -1; state.heavy = false; }
    }

    // posed hero
    player.setTexture(active ? 'ss-stego-swing' : 'ss-stego-idle');
    player.setFlipX(state.facing < 0);
    player.setScale((active ? 0.98 : 0.95) * K);
    player.setAngle(active ? -state.facing * 0.055 : Math.sin(time / 760) * 0.012);
    player.x = NEST_X + (active ? state.facing * 9 : 0);

    const charge = state.glow / GLOW_MAX;
    sail.x = player.x;
    sail.y = player.y - 112 * K;
    sail.setAlpha(0.06 + charge * 0.5 + (state.heavy ? 0.22 : 0));
    sail.setScale((0.82 + charge * 0.46) * K);
    sail.rotation += dt * (0.4 + charge * 1.6);

    // spawns
    state.spawnT -= dt;
    if (state.spawnT <= 0 && hunters.length < 4) {
      spawnHunter(r() < 0.5 ? 'left' : 'right');
      if (state.stands > 6 && r() < Math.min(0.42, 0.1 + state.stands * 0.012) && hunters.length < 4) {
        spawnHunter(r() < 0.5 ? 'left' : 'right');
      }
      state.spawnT = Math.max(0.86, 2.15 - state.stands * 0.038);
    }

    // hunters
    for (let i = hunters.length - 1; i >= 0; i--) {
      const h = hunters[i];
      if (h.dead) { hunters.splice(i, 1); continue; }
      h.bob += dt;
      let lift = 0;

      if (h.phase === 'walk') {
        const dir = NEST_X > h.x ? 1 : -1;
        h.x += dir * h.speed * dt;
        const d = Math.abs(h.x - NEST_X);
        h.img.setTexture('ss-raptor-walk');
        h.img.setFlipX(!h.fromRight);
        h.img.setScale((0.92 + Math.sin(h.bob * 9) * 0.015) * K, (0.92 - Math.sin(h.bob * 9) * 0.02) * K);
        h.img.clearTint();
        if (d <= 152) {
          h.phase = 'wind';
          h.t = 0;
          scene.sfx('tick');
          dust.emitParticleAt(h.x, M.Y(h.y), 4);
        }
      } else if (h.phase === 'wind') {
        h.t += dt;
        const k = Math.min(1, h.t / 0.5);
        h.img.setScale((0.94 + k * 0.1) * K, (0.9 - k * 0.22) * K);
        h.img.setTint(0xffc9a0);
        h.img.x = h.x;
        h.img.y = M.Y(h.y);
        if (h.t >= 0.5) {
          h.phase = 'pounce';
          h.t = 0;
          h.startX = h.x;
          h.targetX = NEST_X + (h.fromRight ? 62 : -62);
          h.img.setTexture('ss-raptor-leap');
          h.img.setFlipX(!h.fromRight);
          scene.sfx('whoosh');
          dust.emitParticleAt(h.x, M.Y(h.y), 7);
        }
      } else if (h.phase === 'pounce') {
        h.t += dt;
        const k = clamp(h.t / 0.46, 0, 1);
        h.x = h.startX + (h.targetX - h.startX) * k;
        lift = Math.sin(Math.PI * k) * 118;
        h.img.setScale(1.02 * K);
        if (k >= 1) {
          h.phase = 'bite';
          h.t = 0;
          h.x = h.targetX;
        }
      } else if (h.phase === 'bite') {
        h.t += dt;
        h.img.setTexture('ss-raptor-walk');
        h.img.setFlipX(!h.fromRight);
        h.img.setScale(0.94 * K);
        h.img.clearTint();
        if (h.t > 0.14) {
          stealEgg(h);
          h.phase = 'flee';
          h.t = 0;
          h.fleeDir = h.x >= NEST_X ? 1 : -1;
        }
      } else if (h.phase === 'flee') {
        h.t += dt;
        h.x += h.fleeDir * 420 * dt;
        lift = Math.sin(Math.min(1, h.t / 0.5) * Math.PI) * 30;
        h.img.setAlpha(Math.max(0, 1 - h.t * 0.9));
        if (h.img.alpha <= 0.02) {
          h.img.destroy();
          hunters.splice(i, 1);
          continue;
        }
      }

      h.img.x = h.x;
      h.img.y = M.Y(h.y) - lift + (h.phase === 'walk' ? Math.sin(h.bob * 9) * 2 : 0);
      h.img.setDepth(9 + clamp(Math.round((h.y - 458) * 0.5), 0, 3));
      if (h.phase === 'walk' && Math.random() < dt * 2.2) dust.emitParticleAt(h.x - (h.fromRight ? 14 : -14), M.Y(h.y), 1);
    }

    // fireflies and drifting seed light
    if (Math.random() < dt * 2.4) dust.emitParticleAt(NEST_X + (r() - 0.5) * 120, M.Y(NEST_Y + 6), 1);

    scene.hud({
      score: state.stands,
      progress: Math.min(1, state.stands / GOAL),
      hearts: state.hearts,
      extra: state.glow >= GLOW_MAX ? 'hammer ready' : state.combo > 2 ? `chain ${state.combo}` : charge > 0.66 ? 'sail glowing' : ''
    });
    scene.audio.setTension(0.2 + (1 - state.hearts / 3) * 0.35 + (hunters.some((h) => h.phase === 'wind' || h.phase === 'pounce') ? 0.3 : 0));
  }

  return {
    update,
    swing: doSwipe,
    face,
    state: () => ({
      stands: state.stands, hearts: state.hearts, glow: state.glow, facing: state.facing,
      heavy: state.heavy, swinging: state.swingAge >= 0, age: state.swingAge, over: state.over,
      hunters: hunters.map((h) => ({ x: Math.round(h.x), phase: h.phase, dead: h.dead }))
    }),
    setStands: (v) => { state.stands = v; },
    setHearts: (v) => { state.hearts = v; },
    setGlow: (v) => { state.glow = clamp(v, 0, GLOW_MAX); state.chargedNote = v >= GLOW_MAX; },
    setFacing: (v) => { state.facing = v >= 0 ? 1 : -1; },
    spawnHunter,
    placeHunter: (side, distance) => spawnHunter(side, distance),
    clear: () => { hunters.forEach((h) => h.img.destroy()); hunters.length = 0; }
  };
}

export default { id: 'stego-stand', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
