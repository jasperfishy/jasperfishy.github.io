// Lantern Watch — one flame, one beam, one nest.
// You hold the light. Hunters will not cross lit ground, so the beam is a gate
// you must aim, and there are always more approaches than beam. Cup the flame
// and it gathers — while the dark walks closer.

import { canvasTex, grain, rng, clamp, lerp, MOODS, W } from '../engine.js?v=du-7ebd3d49aa7fa37b';

const STAR = [6, 11, 17];
const GOAL = 17;
const TAU = Math.PI * 2;
const PAL = MOODS.night;

const CX = 480;
const CY = 388;
const RX = 434;
const RY = 122;
const NEST_D = 0.185;
const MIN_HALF = 0.055;
const MAX_HALF = 0.62;
const BRAZEN_CORE = 0.42;
const LAMP_SCALE = 0.95;
const FLAME_LIFT = 96;
const CROWN_LIFT = 172;
const COLDNEST = { r: 148, g: 174, b: 196 };
const HOTNEST = { r: 255, g: 246, b: 232 };

function angDelta(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}
function arenaPos(a, d) {
  return { x: CX + Math.cos(a) * RX * d, y: CY + Math.sin(a) * RY * d };
}
function screenAngle(a) {
  return Math.atan2(Math.sin(a) * RY, Math.cos(a) * RX);
}

function lampArt(scene) {
  canvasTex(scene, 'lw-lamp', 150, 212, (c) => {
    const rand = rng(6611);
    c.lineCap = 'round';

    c.fillStyle = 'rgba(3,10,16,0.5)';
    c.beginPath(); c.ellipse(75, 205, 44, 8, 0, 0, TAU); c.fill();

    c.strokeStyle = '#1b2831';
    c.lineWidth = 7;
    [[-34, 0], [34, 0], [2, 5]].forEach(([fx, fy]) => {
      c.beginPath();
      c.moveTo(75, 122);
      c.quadraticCurveTo(75 + fx * 0.4, 166, 75 + fx, 200 + fy);
      c.stroke();
    });
    c.strokeStyle = 'rgba(150,186,212,0.3)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(72, 124);
    c.quadraticCurveTo(60, 166, 41, 198);
    c.stroke();

    c.fillStyle = '#16222b';
    c.beginPath(); c.ellipse(75, 128, 34, 9, 0, 0, TAU); c.fill();

    const glass = c.createRadialGradient(75, 96, 4, 75, 96, 46);
    glass.addColorStop(0, 'rgba(255,214,140,0.46)');
    glass.addColorStop(0.5, 'rgba(255,168,80,0.24)');
    glass.addColorStop(1, 'rgba(120,150,180,0.12)');
    c.fillStyle = glass;
    c.beginPath();
    c.moveTo(48, 62); c.lineTo(102, 62); c.lineTo(108, 122); c.lineTo(42, 122);
    c.closePath(); c.fill();

    c.strokeStyle = '#223038';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(48, 62); c.lineTo(102, 62); c.lineTo(108, 122); c.lineTo(42, 122);
    c.closePath(); c.stroke();
    c.lineWidth = 2.6;
    [58, 75, 92].forEach((x) => {
      c.beginPath();
      c.moveTo(x, 63);
      c.lineTo(x + (x - 75) * 0.12, 121);
      c.stroke();
    });

    c.fillStyle = '#1b272f';
    c.beginPath();
    c.moveTo(38, 122); c.lineTo(112, 122); c.lineTo(106, 134); c.lineTo(44, 134);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(160,196,224,0.18)';
    c.fillRect(40, 121, 70, 2);

    c.fillStyle = '#22303a';
    c.beginPath();
    c.moveTo(44, 62); c.quadraticCurveTo(75, 30, 106, 62);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(176,208,232,0.3)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(48, 58); c.quadraticCurveTo(75, 32, 102, 58); c.stroke();
    c.fillStyle = '#2b3a44';
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.ellipse(58 + i * 11, 52 - Math.abs(i - 1.5) * 3, 3.4, 1.8, 0, 0, TAU); c.fill();
    }
    c.strokeStyle = '#2b3a44';
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(75, 40); c.lineTo(75, 32); c.stroke();
    c.beginPath(); c.arc(75, 27, 6, 0, TAU); c.stroke();

    c.fillStyle = 'rgba(226,244,255,0.12)';
    for (let i = 0; i < 6; i++) {
      c.beginPath(); c.ellipse(50 + rand() * 50, 70 + rand() * 46, 1.6 + rand() * 4, 1 + rand() * 1.6, rand(), 0, TAU); c.fill();
    }
    grain(c, 150, 212, 0.03, 6621);
  });

  canvasTex(scene, 'lw-flame', 72, 108, (c) => {
    const halo = c.createRadialGradient(36, 62, 2, 36, 62, 34);
    halo.addColorStop(0, 'rgba(255,238,190,0.95)');
    halo.addColorStop(0.4, 'rgba(255,190,96,0.5)');
    halo.addColorStop(1, 'rgba(255,150,60,0)');
    c.fillStyle = halo;
    c.fillRect(0, 0, 72, 108);

    const body = c.createLinearGradient(36, 96, 36, 22);
    body.addColorStop(0, 'rgba(255,132,52,0.9)');
    body.addColorStop(0.34, 'rgba(255,196,92,0.96)');
    body.addColorStop(0.72, 'rgba(255,240,196,0.98)');
    body.addColorStop(1, 'rgba(255,255,236,0.85)');
    c.fillStyle = body;
    c.beginPath();
    c.moveTo(36, 100);
    c.quadraticCurveTo(18, 88, 20, 64);
    c.quadraticCurveTo(23, 44, 36, 18);
    c.quadraticCurveTo(49, 44, 52, 64);
    c.quadraticCurveTo(54, 88, 36, 100);
    c.closePath(); c.fill();

    c.fillStyle = 'rgba(255,252,232,0.95)';
    c.beginPath(); c.ellipse(36, 78, 8, 15, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,170,80,0.6)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(30, 40); c.quadraticCurveTo(34, 26, 33, 14); c.stroke();
  });

  canvasTex(scene, 'lw-pennant', 120, 46, (c) => {
    const g = c.createLinearGradient(0, 8, 118, 40);
    g.addColorStop(0, '#8a5c46');
    g.addColorStop(0.6, '#a87252');
    g.addColorStop(1, '#6d4433');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(2, 6);
    c.quadraticCurveTo(52, 2, 116, 16);
    c.quadraticCurveTo(88, 26, 112, 40);
    c.quadraticCurveTo(50, 32, 2, 30);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(240,220,190,0.22)';
    c.lineWidth = 1.6;
    for (let i = 1; i < 5; i++) {
      c.beginPath();
      c.moveTo(6 + i * 22, 8 + i);
      c.quadraticCurveTo(20 + i * 22, 20, 8 + i * 22, 30);
      c.stroke();
    }
    grain(c, 120, 46, 0.05, 6631);
  });

  canvasTex(scene, 'lw-cup', 300, 170, (c) => {
    const g = c.createLinearGradient(20, 30, 280, 150);
    g.addColorStop(0, 'rgba(140,106,70,0.92)');
    g.addColorStop(0.5, 'rgba(102,76,50,0.86)');
    g.addColorStop(1, 'rgba(62,46,30,0.8)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(10, 158);
    c.quadraticCurveTo(6, 60, 90, 22);
    c.quadraticCurveTo(150, 2, 212, 24);
    c.quadraticCurveTo(294, 58, 290, 158);
    c.quadraticCurveTo(150, 122, 10, 158);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,214,150,0.55)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(16, 148);
    c.quadraticCurveTo(10, 62, 92, 28);
    c.quadraticCurveTo(150, 10, 208, 30);
    c.quadraticCurveTo(288, 64, 284, 148);
    c.stroke();
    c.strokeStyle = 'rgba(38,26,16,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      c.moveTo(30 + i * 28, 150 - i * 3);
      c.quadraticCurveTo(34 + i * 28, 110, 44 + i * 26, 92);
      c.stroke();
    }
    grain(c, 300, 170, 0.05, 6641);
  });
}

function nestArt(scene) {
  canvasTex(scene, 'lw-nest', 440, 230, (c) => {
    const rand = rng(6701);
    c.fillStyle = 'rgba(4,10,16,0.55)';
    c.beginPath(); c.ellipse(220, 190, 206, 32, 0, 0, TAU); c.fill();

    const bowl = c.createRadialGradient(220, 150, 12, 220, 150, 210);
    bowl.addColorStop(0, '#212d28');
    bowl.addColorStop(0.55, '#16221f');
    bowl.addColorStop(1, '#0d1715');
    c.fillStyle = bowl;
    c.beginPath(); c.ellipse(220, 152, 196, 66, 0, 0, TAU); c.fill();

    c.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const a = rand() * TAU;
      const rr = 0.62 + rand() * 0.44;
      const bx = 220 + Math.cos(a) * 190 * rr;
      const by = 152 + Math.sin(a) * 62 * rr;
      const len = 26 + rand() * 46;
      const dir = a + Math.PI / 2 + (rand() - 0.5) * 1.1;
      c.strokeStyle = i % 5 === 0 ? '#4a3c28' : i % 5 === 1 ? '#3a2f20' : i % 5 === 2 ? '#2c2416' : '#332a1c';
      c.lineWidth = 2.4 + rand() * 3.4;
      c.beginPath();
      c.moveTo(bx, by);
      c.quadraticCurveTo(bx + Math.cos(dir) * len * 0.5, by + Math.sin(dir) * len * 0.4 - 6, bx + Math.cos(dir) * len, by + Math.sin(dir) * len * 0.6 - 10);
      c.stroke();
    }
    c.strokeStyle = 'rgba(184,214,236,0.2)';
    c.lineWidth = 1.8;
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI + (i / 26) * Math.PI;
      const bx = 220 + Math.cos(a) * (176 + rand() * 18);
      const by = 152 + Math.sin(a) * (56 + rand() * 8);
      c.beginPath();
      c.moveTo(bx, by);
      c.quadraticCurveTo(bx + 12, by - 12, bx + 26, by - 16);
      c.stroke();
    }
    c.fillStyle = 'rgba(96,132,104,0.3)';
    for (let i = 0; i < 40; i++) {
      const a = rand() * TAU;
      const rr = 0.7 + rand() * 0.36;
      c.beginPath();
      c.ellipse(220 + Math.cos(a) * 190 * rr, 152 + Math.sin(a) * 62 * rr, 6 + rand() * 12, 3 + rand() * 5, rand(), 0, TAU);
      c.fill();
    }

    const eggs = [[-104, 20], [-62, -16], [62, -14], [104, 22], [0, 34]];
    eggs.forEach(([ox, oy], i) => {
      c.save();
      c.translate(220 + ox, 150 + oy);
      c.rotate((rand() - 0.5) * 0.5);
      c.fillStyle = 'rgba(6,12,16,0.5)';
      c.beginPath(); c.ellipse(2, 14, 20, 6, 0, 0, TAU); c.fill();
      const sh = c.createRadialGradient(-5, -8, 3, 0, 4, 26);
      sh.addColorStop(0, '#c8b995');
      sh.addColorStop(0.55, '#9b8a68');
      sh.addColorStop(1, '#5b5138');
      c.fillStyle = sh;
      c.beginPath(); c.ellipse(0, 0, 16, 21, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(120,96,58,0.32)';
      for (let k = 0; k < 7; k++) {
        c.beginPath();
        c.ellipse(-8 + rand() * 16, -11 + rand() * 22, 1.4 + rand() * 2.2, 1 + rand() * 1.4, rand(), 0, TAU);
        c.fill();
      }
      c.fillStyle = 'rgba(255,252,236,0.16)';
      c.beginPath(); c.ellipse(-6, -9, 4, 7, -0.5, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(178,210,238,0.26)';
      c.lineWidth = 1.6;
      c.beginPath(); c.arc(0, 0, 20, Math.PI * 0.62, Math.PI * 1.1); c.stroke();
      c.restore();
      if (i === 2) {
        c.strokeStyle = 'rgba(214,166,110,0.44)';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(220 + ox - 7, 150 + oy - 13);
        c.lineTo(220 + ox + 3, 150 + oy - 3);
        c.lineTo(220 + ox - 2, 150 + oy + 7);
        c.stroke();
      }
    });
    grain(c, 440, 230, 0.035, 6711);
  });

  canvasTex(scene, 'lw-clearing', 960, 300, (c) => {
    const rand = rng(6801);
    const g = c.createRadialGradient(480, 150, 30, 480, 150, 470);
    g.addColorStop(0, 'rgba(34,50,48,0.82)');
    g.addColorStop(0.42, 'rgba(22,36,38,0.72)');
    g.addColorStop(0.78, 'rgba(12,24,28,0.5)');
    g.addColorStop(1, 'rgba(7,15,20,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(480, 150, 470, 148, 0, 0, TAU); c.fill();

    c.save();
    c.beginPath(); c.ellipse(480, 150, 466, 145, 0, 0, TAU); c.clip();
    for (let i = 0; i < 260; i++) {
      const x = rand() * 960;
      const y = 6 + rand() * 288;
      const near = 1 - Math.min(1, Math.hypot((x - 480) / 470, (y - 150) / 148));
      c.fillStyle = i % 4 === 0
        ? 'rgba(126,152,138,' + (0.05 + near * 0.1) + ')'
        : 'rgba(8,16,20,' + (0.06 + near * 0.14) + ')';
      c.beginPath(); c.ellipse(x, y, 3 + rand() * 16, 1.4 + rand() * 4, rand() * Math.PI, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(150,182,196,0.045)';
    for (let i = 0; i < 34; i++) {
      c.lineWidth = 1 + rand() * 1.6;
      const y = 20 + rand() * 260;
      const x0 = 120 + rand() * 300;
      c.beginPath();
      c.moveTo(x0, y);
      c.quadraticCurveTo(x0 + 120, y + (rand() - 0.5) * 18, x0 + 240 + rand() * 160, y + (rand() - 0.5) * 12);
      c.stroke();
    }
    c.restore();

    c.strokeStyle = 'rgba(158,196,222,0.14)';
    c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(480, 150, 452, 140, 0, Math.PI * 1.04, Math.PI * 1.96); c.stroke();
    grain(c, 960, 300, 0.03, 6811);
  });
}

function hunterArt(scene) {
  ['a', 'b', 'cower', 'dash'].forEach((pose) => {
    canvasTex(scene, 'lw-hunter-' + pose, 228, 172, (c) => {
      const rand = rng(6900 + pose.charCodeAt(0) * 37);
      const step = pose === 'b' ? 1 : -1;
      const cower = pose === 'cower';
      const dash = pose === 'dash';
      const drop = cower ? 18 : dash ? 8 : 0;
      const hipY = 118 + drop;

      c.fillStyle = 'rgba(3,9,14,0.45)';
      c.beginPath(); c.ellipse(116, 162, 58, 8, 0, 0, TAU); c.fill();

      c.strokeStyle = '#26363f';
      c.lineWidth = 13;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(96, hipY - 4);
      c.quadraticCurveTo(52, hipY - (dash ? 34 : 26) + drop, 20, hipY - (dash ? 52 : 46) + drop * 1.6);
      c.stroke();
      c.strokeStyle = '#3b5059';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(92, hipY - 8);
      c.quadraticCurveTo(54, hipY - 30 + drop, 24, hipY - 50 + drop * 1.6);
      c.stroke();

      c.strokeStyle = '#22303a';
      c.lineWidth = 11;
      [[78, 96], [112, 104]].forEach(([hx, fx], i) => {
        const kx = hx + (i ? step * 8 : -step * 8);
        c.beginPath();
        c.moveTo(hx, hipY + 4);
        c.quadraticCurveTo(kx, hipY + 24, kx, hipY + 30);
        c.lineTo(fx, 154);
        c.stroke();
        c.strokeStyle = '#c9bb8e';
        c.lineWidth = 3;
        c.beginPath(); c.moveTo(fx, 154); c.lineTo(fx + 14, 157); c.stroke();
        c.beginPath(); c.moveTo(fx - 2, 154); c.lineTo(fx - 10, 159); c.stroke();
        c.strokeStyle = '#22303a';
        c.lineWidth = 11;
      });

      const body = c.createLinearGradient(60, hipY - 46, 170, hipY + 12);
      body.addColorStop(0, '#46606d');
      body.addColorStop(0.5, '#2a3c47');
      body.addColorStop(1, '#16232c');
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(112, hipY - 14 - drop * 0.3, 58, dash ? 26 : 32, dash ? 0.24 : -0.06, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(148,186,206,0.1)';
      c.beginPath(); c.ellipse(116, hipY - 2, 40, 10, -0.05, 0, TAU); c.fill();

      c.fillStyle = '#2c4049';
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(86 + i * 15, hipY - 34 - drop * 0.4);
        c.quadraticCurveTo(80 + i * 15, hipY - 52 - drop * 0.5, 98 + i * 15, hipY - 48 - drop * 0.4);
        c.quadraticCurveTo(96 + i * 15, hipY - 36, 86 + i * 15, hipY - 34 - drop * 0.4);
        c.closePath(); c.fill();
      }
      c.strokeStyle = '#253640';
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(122, hipY - 6);
      c.quadraticCurveTo(132, hipY + 16, 122 + step * 10, hipY + 30);
      c.stroke();
      c.strokeStyle = '#c9bb8e';
      c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(122 + step * 10, hipY + 30); c.lineTo(132 + step * 14, hipY + 34); c.stroke();

      const headLift = cower ? 6 : dash ? 30 : 18;
      const headX = cower ? 158 : dash ? 176 : 168;
      const headY = hipY - 40 - headLift + (cower ? 26 : 0);
      c.strokeStyle = '#334854';
      c.lineWidth = 20;
      c.beginPath();
      c.moveTo(146, hipY - 26 - drop * 0.4);
      c.quadraticCurveTo(headX - 16, headY + 22, headX - 6, headY + 6);
      c.stroke();
      c.fillStyle = '#3d5460';
      c.beginPath(); c.ellipse(headX, headY, 22, 15, cower ? 0.34 : -0.2, 0, TAU); c.fill();
      c.fillStyle = '#4a626e';
      c.beginPath();
      c.moveTo(headX + 12, headY - 6);
      c.quadraticCurveTo(headX + 44, headY - (cower ? 0 : 4), headX + 40, headY + 6);
      c.quadraticCurveTo(headX + 24, headY + 10, headX + 12, headY + 6);
      c.closePath(); c.fill();
      c.fillStyle = '#22303a';
      c.beginPath();
      c.moveTo(headX + 12, headY + 6);
      c.quadraticCurveTo(headX + 36, headY + 8, headX + 32, headY + 14);
      c.quadraticCurveTo(headX + 20, headY + 14, headX + 12, headY + 10);
      c.closePath(); c.fill();
      c.strokeStyle = '#e6dcba';
      c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(headX + 16 + i * 6, headY + 5);
        c.lineTo(headX + 17 + i * 6, headY + 10);
        c.stroke();
      }
      c.fillStyle = '#ffd87a';
      c.beginPath(); c.ellipse(headX + 4, headY - 4, 5, 4, 0, 0, TAU); c.fill();
      c.fillStyle = '#2a1c08';
      c.beginPath(); c.arc(headX + 5.4, headY - 4, 2, 0, TAU); c.fill();
      if (cower) {
        c.strokeStyle = '#1a2830';
        c.lineWidth = 2.6;
        c.beginPath(); c.arc(headX + 4, headY - 4, 6, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
      }
      c.fillStyle = '#334854';
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(headX - 4 + i * 5, headY - 14);
        c.quadraticCurveTo(headX - 12 + i * 6, headY - 30, headX + 2 + i * 6, headY - 22);
        c.quadraticCurveTo(headX - 2 + i * 4, headY - 14, headX - 4 + i * 5, headY - 14);
        c.closePath(); c.fill();
      }

      c.strokeStyle = 'rgba(176,212,240,0.5)';
      c.lineWidth = 3.4;
      c.beginPath();
      c.moveTo(64, hipY - 30);
      c.quadraticCurveTo(96, hipY - 50 - drop * 0.5, 140, hipY - 34);
      c.quadraticCurveTo(headX - 18, headY + 24, headX - 8, headY + 4);
      c.stroke();
      c.strokeStyle = 'rgba(255,206,140,0.22)';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(148, hipY + 8);
      c.quadraticCurveTo(168, hipY - 6, headX + 6, headY + 12);
      c.stroke();
      c.strokeStyle = 'rgba(12,20,26,0.5)';
      c.lineWidth = 1.8;
      for (let i = 0; i < 12; i++) {
        const x = 74 + rand() * 84;
        const y = hipY - 30 + rand() * 34;
        c.beginPath(); c.arc(x, y, 3 + rand() * 4, 0.5, 2.4); c.stroke();
      }
      grain(c, 228, 172, 0.035, 6907 + rand() * 20);
    });
  });

  canvasTex(scene, 'lw-eyes', 72, 30, (c) => {
    [-16, 16].forEach((ox) => {
      const g = c.createRadialGradient(36 + ox, 15, 1, 36 + ox, 15, 15);
      g.addColorStop(0, 'rgba(255,232,168,0.95)');
      g.addColorStop(0.35, 'rgba(255,186,86,0.5)');
      g.addColorStop(1, 'rgba(255,150,50,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(36 + ox, 15, 15, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,246,214,0.98)';
      c.beginPath(); c.ellipse(36 + ox, 15, 4.4, 3.2, 0, 0, TAU); c.fill();
    });
  });
}

function propArt(scene) {
  canvasTex(scene, 'lw-grass', 140, 132, (c) => {
    const rand = rng(7101);
    for (let i = 0; i < 26; i++) {
      const bx = 70 + (rand() - 0.5) * 54;
      const tipX = bx + (rand() - 0.5) * 130;
      const tipY = 6 + rand() * 62;
      const w = 2.6 + rand() * 4.4;
      const midX = (bx + tipX) / 2 + (rand() - 0.5) * 16;
      const midY = (132 + tipY) / 2;
      c.fillStyle = i % 3 === 0 ? '#1d3130' : i % 3 === 1 ? '#16272a' : '#24403a';
      c.beginPath();
      c.moveTo(bx - w, 132);
      c.quadraticCurveTo(midX - w * 0.4, midY, tipX, tipY);
      c.quadraticCurveTo(midX + w * 0.4, midY, bx + w, 132);
      c.closePath(); c.fill();
      if (i % 4 === 0) {
        c.strokeStyle = 'rgba(170,208,224,0.24)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(bx, 132);
        c.quadraticCurveTo(midX, midY, tipX, tipY);
        c.stroke();
      }
    }
  });

  canvasTex(scene, 'lw-stone', 170, 110, (c) => {
    const rand = rng(7201);
    c.fillStyle = 'rgba(4,10,14,0.5)';
    c.beginPath(); c.ellipse(88, 100, 66, 9, 0, 0, TAU); c.fill();
    const g = c.createLinearGradient(30, 20, 140, 100);
    g.addColorStop(0, '#445860');
    g.addColorStop(0.55, '#2b3a42');
    g.addColorStop(1, '#16212a');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(14, 98); c.lineTo(30, 52); c.lineTo(66, 26); c.lineTo(112, 32);
    c.lineTo(150, 62); c.lineTo(156, 96); c.lineTo(120, 104); c.lineTo(40, 104);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(184,216,240,0.4)';
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(28, 56); c.lineTo(64, 28); c.lineTo(110, 34);
    c.stroke();
    c.strokeStyle = 'rgba(10,18,22,0.5)';
    c.lineWidth = 1.8;
    for (let i = 0; i < 8; i++) {
      const x = 34 + rand() * 100;
      const y = 44 + rand() * 50;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 8 + rand() * 18, y + 4 + rand() * 8);
      c.stroke();
    }
    grain(c, 170, 110, 0.05, 7211);
  });

  canvasTex(scene, 'lw-log', 250, 108, (c) => {
    c.fillStyle = 'rgba(4,10,14,0.45)';
    c.beginPath(); c.ellipse(128, 92, 112, 12, 0, 0, TAU); c.fill();
    const g = c.createLinearGradient(10, 20, 240, 96);
    g.addColorStop(0, '#4a3a2a');
    g.addColorStop(0.5, '#33291d');
    g.addColorStop(1, '#1d1810');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(16, 74);
    c.quadraticCurveTo(12, 34, 60, 26);
    c.lineTo(206, 20);
    c.quadraticCurveTo(244, 24, 242, 52);
    c.quadraticCurveTo(238, 82, 196, 86);
    c.lineTo(56, 92);
    c.quadraticCurveTo(20, 92, 16, 74);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(180,208,232,0.3)';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(52, 27); c.lineTo(206, 21);
    c.stroke();
    c.strokeStyle = 'rgba(122,98,64,0.4)';
    c.lineWidth = 1.8;
    for (let i = 0; i < 9; i++) {
      const y = 34 + i * 6;
      c.beginPath();
      c.moveTo(30 + i * 4, y);
      c.quadraticCurveTo(124, y - 4 + (i % 3) * 3, 226 - i * 3, y - 2);
      c.stroke();
    }
    c.fillStyle = '#5b4a34';
    c.beginPath(); c.ellipse(24, 60, 12, 22, 0.1, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(210,190,150,0.3)';
    c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(24, 60, 6, 12, 0.1, 0, TAU); c.stroke();
    grain(c, 250, 108, 0.05, 7301);
  });

  canvasTex(scene, 'lw-ash', 20, 20, (c) => {
    const g = c.createRadialGradient(10, 10, 1, 10, 10, 10);
    g.addColorStop(0, 'rgba(255,226,178,0.9)');
    g.addColorStop(0.5, 'rgba(255,170,80,0.35)');
    g.addColorStop(1, 'rgba(255,140,50,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(10, 10, 10, 0, TAU); c.fill();
  });
}

function shadeArt(scene, M) {
  canvasTex(scene, 'lw-wash', W, M.H, (c) => {
    const cy = M.Y(CY);
    const inner = M.portrait ? 210 : 104;
    const outer = M.portrait ? 1120 : 640;
    const g = c.createRadialGradient(CX, cy, inner, CX, cy, outer);
    g.addColorStop(0, 'rgba(4,12,20,0)');
    g.addColorStop(0.34, 'rgba(4,12,20,0.34)');
    g.addColorStop(0.66, 'rgba(3,10,18,0.66)');
    g.addColorStop(1, 'rgba(2,7,13,0.9)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, M.H);
    const top = c.createLinearGradient(0, M.Y(60), 0, M.Y(300));
    top.addColorStop(0, 'rgba(2,8,14,0.72)');
    top.addColorStop(1, 'rgba(2,8,14,0)');
    c.fillStyle = top;
    c.fillRect(0, 0, W, M.Y(300));
    grain(c, W, M.H, 0.012, 7401);
  });
}

function art(scene) {
  lampArt(scene);
  nestArt(scene);
  hunterArt(scene);
  propArt(scene);
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  const r = rng(9317);
  const accent = Phaser.Display.Color.HexStringToColor(PAL.accent).color;
  const moteTint = Phaser.Display.Color.HexStringToColor(PAL.motes).color;
  art(scene);
  shadeArt(scene, M);

  const watchLines = [
    'the watch is yours — keep the beam moving',
    'a wide beam drinks the flame dry',
    'cup before the gust, not after',
    'they will test the edge of the light',
    'nothing crosses a lit ring',
    'the dark is patient. so are you'
  ];

  const state = {
    watches: 0, hearts: 3, flame: 1, warmth: 1, cup: false, over: false,
    aim: -Math.PI / 2, aimWant: -Math.PI / 2, half: MAX_HALF * 0.6, halfWant: MAX_HALF * 0.6,
    bend: 0, reach: 1,
    wind: Math.PI * 0.15, windTarget: Math.PI * 0.15, windStrength: 0.4,
    windPhase: 'calm', windT: 6.5, gustT: 0,
    watchT: 11, watchLen: 11, spawnT: 2.2, interval: 4.6, alive: 3, sides: 2,
    time: 0, iFrames: 0, flick: 0, lowWarn: 0, auto: true, forceCup: null,
    held: 0, breaches: 0
  };

  scene.add.image(CX, M.Y(CY + 12), 'lw-clearing').setOrigin(0.5).setDepth(6.6).setScale(K).setAlpha(0.92);

  const props = [];
  function addProp(key, a, d, s, tint) {
    const p = arenaPos(a, d);
    const near = clamp((p.y - (CY - RY)) / (RY * 2), 0, 1);
    const img = scene.add.image(p.x, M.Y(p.y + (key === 'lw-grass' ? 8 : 5)), key)
      .setOrigin(0.5, 1).setScale(s * (0.6 + near * 0.55) * K)
      .setDepth(p.y < CY ? 8.4 : 17.6);
    img.setAlpha(0.62 + near * 0.3);
    if (tint) img.setTint(tint);
    props.push({ img, a, d, ph: r() * TAU, base: 0.62 + near * 0.3 });
  }
  for (let i = 0; i < 20; i++) {
    addProp('lw-grass', r() * TAU, 0.74 + r() * 0.26, 0.34 + r() * 0.3, r() < 0.4 ? 0x6d8a94 : 0x55707c);
  }
  for (let i = 0; i < 6; i++) addProp('lw-stone', r() * TAU, 0.8 + r() * 0.2, 0.28 + r() * 0.2, 0x5d707c);
  for (let i = 0; i < 3; i++) addProp('lw-log', r() * TAU, 0.84 + r() * 0.16, 0.26 + r() * 0.14, 0x6a5b44);
  for (let i = 0; i < 12; i++) addProp('lw-grass', r() * TAU, 1.0 + r() * 0.06, 0.4 + r() * 0.34, 0x4c6472);

  const nestGlow = scene.add.image(CX, M.Y(CY + 8), 'arc-glow').setDepth(13.4)
    .setScale(0.8 * K).setAlpha(0.1).setTint(0xffc478).setBlendMode(Phaser.BlendModes.ADD);
  const nest = scene.add.image(CX, M.Y(CY + 14), 'lw-nest').setOrigin(0.5).setDepth(13.6).setScale(0.66 * K);

  const beamFloor = scene.add.graphics().setDepth(22.2);
  const beamHaze = scene.add.graphics().setDepth(26.4);
  const ring = scene.add.graphics().setDepth(22.5);

  const lamp = scene.add.image(CX, M.Y(CY + 8), 'lw-lamp').setOrigin(0.5, 1).setDepth(15).setScale(LAMP_SCALE * K);
  const flame = scene.add.image(CX, M.Y(CY + 8) - FLAME_LIFT * LAMP_SCALE * K, 'lw-flame')
    .setOrigin(0.5, 1).setDepth(15.6).setScale(0.42 * K).setBlendMode(Phaser.BlendModes.ADD);
  const flameGlow = scene.add.image(flame.x, flame.y - 20 * K, 'arc-glow').setDepth(15.4)
    .setScale(0.5 * K).setAlpha(0.55).setTint(0xffd28a).setBlendMode(Phaser.BlendModes.ADD);
  const pennant = scene.add.image(CX + 3 * K, M.Y(CY + 8) - CROWN_LIFT * LAMP_SCALE * K, 'lw-pennant')
    .setOrigin(0, 0.5).setDepth(15.8).setScale(0.34 * K);
  const cupScreen = scene.add.image(CX, M.Y(CY + 44), 'lw-cup').setOrigin(0.5, 1)
    .setDepth(16.2).setScale(0.86 * K).setAlpha(0);

  const wash = scene.add.image(0, 0, 'lw-wash').setOrigin(0).setDepth(21);

  const motes = [];
  for (let i = 0; i < 26; i++) {
    const img = scene.add.circle(0, 0, 1.6, moteTint, 0.6).setDepth(27).setBlendMode(Phaser.BlendModes.ADD);
    motes.push({ img, t: r(), o: (r() - 0.5) * 2, sp: 0.12 + r() * 0.3, ph: r() * TAU });
  }
  const embers = [];
  for (let i = 0; i < 24; i++) {
    const img = scene.add.image(r() * W, M.Y(60 + r() * 440), 'lw-ash').setDepth(23)
      .setScale((0.24 + r() * 0.4) * K).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    embers.push({ img, life: r() * 4, max: 2.4 + r() * 3.2, jitter: r() * TAU });
  }

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 30, max: 130 }, angle: { min: 210, max: 350 }, lifespan: { min: 300, max: 620 },
    scale: { start: 0.4, end: 0 }, alpha: { start: 0.4, end: 0 }, tint: 0xa8b8b0,
    gravityY: 160, emitting: false
  }).setDepth(18);
  const flare = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 110, max: 330 }, lifespan: 620, scale: { start: 0.6, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0xffdca0, gravityY: 300, emitting: false, blendMode: 'ADD'
  }).setDepth(28);

  const hunters = [];
  function spawnSector() {
    const seg = TAU / state.sides;
    const k = Math.floor(r() * state.sides);
    return k * seg + (r() - 0.5) * seg * 0.72;
  }

  function addHunter(a, d, kind) {
    if (state.over) return null;
    const p = arenaPos(a, d);
    const img = scene.add.image(p.x, M.Y(p.y + 12), 'lw-hunter-' + (kind || 'creeper'))
      .setOrigin(0.5, 1).setScale(0.72 * K).setAlpha(0.2).setTint(0x7f9cb0).setDepth(12);
    const eyes = scene.add.image(p.x, M.Y(p.y - 30), 'lw-eyes').setDepth(19.2)
      .setScale(0.4 * K).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    const h = {
      img, eyes, a, d, kind: kind === 'dash' ? 'dash' : 'creeper',
      speed: (0.048 + state.watches * 0.0022) * (kind === 'dash' ? 1.3 : 1) * (0.86 + r() * 0.3),
      slide: (r() < 0.5 ? -1 : 1) * (0.12 + r() * 0.2),
      lit: false, held: false, t: r() * 6, step: r() * 2,
      minD: d, gone: false, retreat: 0, ph: r() * TAU, z: 12
    };
    hunters.push(h);
    return h;
  }

  function removeHunter(h) {
    const i = hunters.indexOf(h);
    if (i >= 0) hunters.splice(i, 1);
    h.img.destroy();
    h.eyes.destroy();
  }

  function dismiss(h) {
    h.gone = true;
    scene.tweens.add({ targets: h.img, alpha: 0, duration: 520 });
    scene.tweens.add({ targets: h.eyes, alpha: 0, duration: 340 });
  }

  function breach(h) {
    if (state.over) return;
    state.hearts--;
    state.iFrames = 1.6;
    state.flame = Math.max(0, state.flame - 0.3);
    state.warmth = 0;
    state.breaches++;
    scene.sfx('hurt');
    scene.sfx('bad');
    scene.shake(340, 0.018);
    scene.cameras.main.flash(220, 150, 40, 30);
    scene.popText(CX, M.Y(CY - 120), 'the dark reached the eggs', '#ffab84');
    scene.burst(CX, M.Y(CY - 10), 0xffb488, 20, { life: 700, gravity: 260, spin: true });
    dust.emitParticleAt(h.img.x, h.img.y, 8);
    dismiss(h);
    if (state.hearts <= 0) endRun(false);
    else scene.notice('warmth scattered — cup and let the flame come back', 2000);
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    scene.finish(win, {
      score: state.watches,
      note: win
        ? 'seventeen watches and the flame never went out'
        : state.watches === 1
          ? 'one watch kept before the light gave'
          : `${state.watches} watches kept before the light gave`
    });
  }

  function completeWatch() {
    state.watches++;
    scene.sfx('drum1');
    scene.sfx('chime');
    scene.popText(CX, M.Y(CY - 150), '+1 watch', '#ffe9b4');
    scene.burst(CX, M.Y(CY - 60), 0xffd88a, 16, { life: 760, gravity: 120, spin: true });
    state.watchLen = Math.max(7.5, 11 - state.watches * 0.28);
    state.watchT = state.watchLen;
    state.interval = Math.max(1.5, 4.6 - state.watches * 0.22);
    state.alive = Math.min(2 + Math.floor(state.watches / 2), 6);
    state.sides = Math.min(6, 2 + Math.floor(state.watches / 3));
    if (state.watches >= GOAL) { endRun(true); return; }
    if (state.watches === 3) scene.notice('one of them has learned to run through the edge', 2200);
    else if (state.watches === 7) scene.notice('they are coming from every side now', 2000);
    else scene.notice(watchLines[state.watches % watchLines.length], 1900);
  }

  function veerWind() {
    state.windTarget = state.wind + (r() - 0.5) * 2.4;
    state.windPhase = 'veering';
    state.windT = 1.9;
    scene.sfx('tick');
    scene.notice('the wind is veering — cup before it arrives', 1800);
  }

  function gust() {
    state.windPhase = 'gust';
    state.gustT = 2.2;
    state.windStrength = 1;
    scene.sfx('whoosh');
    scene.shake(180, 0.004);
  }

  let pointerHeld = false;
  let pointerSeen = false;
  function readPointer(px, py) {
    const nx = (px - CX) / RX;
    const ny = (py - CY) / RY;
    const radial = Math.hypot(nx, ny);
    if (radial < 0.06) return;
    state.aimWant = Math.atan2(ny, nx);
    const spread = clamp((radial - 0.2) / 0.62, 0, 1);
    state.halfWant = lerp(MIN_HALF + 0.04, MAX_HALF, spread);
    pointerSeen = true;
  }
  scene.input.on('pointermove', (p) => readPointer(p.x, scene.uY(p.y)));
  scene.input.on('pointerdown', (p) => { pointerHeld = true; readPointer(p.x, scene.uY(p.y)); });
  scene.input.on('pointerup', () => { pointerHeld = false; });
  scene.input.on('pointerupoutside', () => { pointerHeld = false; });

  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', up: 'UP', down: 'DOWN', w: 'W', s: 'S'
  });
  let keyCup = false;
  scene.input.keyboard.on('keydown-SPACE', () => { keyCup = true; });
  scene.input.keyboard.on('keyup-SPACE', () => { keyCup = false; });
  scene.input.keyboard.on('keydown-SHIFT', () => { keyCup = true; });
  scene.input.keyboard.on('keyup-SHIFT', () => { keyCup = false; });

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'move to turn the beam' });
  scene.notice('you hold the light. they will not cross it', 3000);

  function wedge(g, aim, half, reach, color, alpha, steps) {
    const inner = NEST_D - 0.02;
    g.fillStyle(color, alpha);
    g.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = arenaPos(aim - half + (half * 2 * i) / steps, reach);
      if (i === 0) g.moveTo(p.x, M.Y(p.y));
      else g.lineTo(p.x, M.Y(p.y));
    }
    for (let i = steps; i >= 0; i--) {
      const p = arenaPos(aim - half + (half * 2 * i) / steps, inner);
      g.lineTo(p.x, M.Y(p.y));
    }
    g.closePath();
    g.fillPath();
  }

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.time += dt;
    state.iFrames = Math.max(0, state.iFrames - dt);

    if (keys.left.isDown || keys.a.isDown) state.aimWant -= 1.5 * dt;
    if (keys.right.isDown || keys.d.isDown) state.aimWant += 1.5 * dt;
    if (keys.up.isDown || keys.w.isDown) state.halfWant = clamp(state.halfWant + 0.7 * dt, MIN_HALF, MAX_HALF);
    if (keys.down.isDown || keys.s.isDown) state.halfWant = clamp(state.halfWant - 0.7 * dt, MIN_HALF, MAX_HALF);
    if (!pointerSeen && (keys.left.isDown || keys.right.isDown || keys.a.isDown || keys.d.isDown)) pointerSeen = true;

    state.cup = state.forceCup === null ? (pointerHeld || keyCup) : state.forceCup;
    state.aim += angDelta(state.aimWant, state.aim) * Math.min(1, dt * (state.cup ? 4.5 : 8));
    state.half += ((state.cup ? MIN_HALF : state.halfWant) - state.half) * Math.min(1, dt * (state.cup ? 7 : 4.5));
    const spread = clamp((state.half - MIN_HALF) / (MAX_HALF - MIN_HALF), 0, 1);

    state.wind += angDelta(state.windTarget, state.wind) * Math.min(1, dt * (state.windPhase === 'gust' ? 2.4 : 0.9));
    state.windT -= dt;
    if (state.windPhase === 'calm' && state.windT <= 0) veerWind();
    else if (state.windPhase === 'veering' && state.windT <= 0) gust();
    else if (state.windPhase === 'gust') {
      state.gustT -= dt;
      if (state.gustT <= 0) { state.windPhase = 'calm'; state.windT = 6 + r() * 5; }
    }
    state.windStrength = state.windPhase === 'gust'
      ? lerp(state.windStrength, 1, Math.min(1, dt * 3))
      : lerp(state.windStrength, 0.36, Math.min(1, dt * 1.4));
    const windTo = state.wind + Math.PI;

    const intoWind = Math.max(0, Math.cos(angDelta(state.aim, state.wind)));
    state.bend = state.cup ? 0 : angDelta(windTo, state.aim) * state.windStrength * 0.1;
    const aimEff = state.aim + state.bend;
    if (state.cup) {
      state.flame = Math.min(1, state.flame + dt * 0.17);
    } else {
      const drain = 0.010 + spread * 0.055 + intoWind * state.windStrength * 0.058;
      state.flame = Math.max(0, state.flame - drain * dt);
      if (state.flame < 0.05) state.flame = Math.min(0.05, state.flame + dt * 0.02);
    }
    state.warmth = Math.min(1, state.warmth + dt * 0.28);
    state.reach = clamp(0.34 + state.flame * 0.66, 0, 1) * (state.cup ? 0.74 : 1);
    state.flick = state.flame < 0.24 ? 0.5 + Math.sin(time / 42) * 0.5 : 0;

    state.lowWarn -= dt;
    if (state.flame < 0.18 && state.lowWarn <= 0) {
      state.lowWarn = 5.5;
      scene.sfx('tick');
      scene.notice('the flame is low — cup it', 1500);
    }

    state.watchT -= dt;
    if (state.watchT <= 0) completeWatch();

    state.spawnT -= dt;
    if (state.auto && state.spawnT <= 0 && hunters.length < state.alive) {
      const kind = state.watches >= 3 && r() < clamp(0.16 + state.watches * 0.02, 0, 0.45) ? 'dash' : 'creeper';
      addHunter(spawnSector(), 1.04, kind);
      state.spawnT = state.interval * (0.6 + r() * 0.7);
    }

    for (let i = hunters.length - 1; i >= 0; i--) {
      const h = hunters[i];
      h.t += dt;
      h.step += dt * (h.lit ? 2 : 5.4);
      const off = angDelta(h.a, aimEff);
      const da = Math.abs(off);
      h.lit = state.flame > 0.05 && h.d <= state.reach + 0.02 && da <= state.half;
      h.held = h.lit && da <= state.half * (h.kind === 'dash' ? BRAZEN_CORE : 1);

      if (h.gone) {
        h.d += dt * 0.55;
        const p = arenaPos(h.a, h.d);
        h.img.x = p.x;
        h.img.y = M.Y(p.y + 12);
        h.eyes.x = p.x;
        h.eyes.y = M.Y(p.y - 30);
        if (h.d > 1.36) removeHunter(h);
        continue;
      }

      if (h.held) {
        h.d += dt * h.speed * 2.1;
        h.a += Math.sign(off || 1) * dt * (0.34 + h.slide * 0.4);
        h.retreat = 0.8;
        if (Math.random() < dt * 6) dust.emitParticleAt(h.img.x, h.img.y, 1);
      } else if (h.retreat > 0) {
        h.retreat -= dt;
        h.d += dt * h.speed * 1.7;
        h.a += Math.sign(off || 1) * dt * 0.2;
      } else if (h.lit) {
        h.d -= dt * h.speed * 0.8;
        h.a += Math.sign(off || 1) * dt * 0.16;
      } else {
        const lunge = h.d < 0.45 ? 1.35 : 1;
        const rush = state.flame <= 0.05 ? 1.9 : 1;
        h.d -= dt * h.speed * lunge * rush * (h.kind === 'dash' ? 1.15 : 1);
        h.a += Math.sin(h.t * 0.7 + h.ph) * dt * 0.22;
      }
      h.d = clamp(h.d, 0.02, 1.4);
      h.minD = Math.min(h.minD, h.d);
      if (!h.gone && h.d <= NEST_D) {
        if (state.iFrames > 0) h.d = 0.3;
        else breach(h);
      }

      if (h.d >= 1.02 && h.minD < 0.92) {
        if (h.minD < 0.44) {
          state.held++;
          state.flame = Math.min(1, state.flame + 0.06);
          scene.sfx('good');
          scene.popText(h.img.x, h.img.y - 128 * K, 'held', '#ffeab8');
          flare.explode(18, h.img.x, h.img.y - 60 * K);
          scene.shake(120, 0.004);
          if (state.held % 4 === 0) scene.notice('held off at the last — the flame thanks you', 1600);
        }
        dismiss(h);
      }

      const p = arenaPos(h.a, h.d);
      h.z = 9 + clamp((p.y - (CY - RY)) / (RY * 2), 0, 1) * 8;
      h.img.x = p.x;
      h.img.y = M.Y(p.y + 12);
      h.img.setDepth(h.z);
      h.img.setFlipX(Math.cos(h.a) < 0);
      const pose = h.held ? 'cower' : (h.kind === 'dash' && !h.lit ? 'dash' : (Math.floor(h.step) % 2 ? 'b' : 'a'));
      if (h.img.texture.key !== 'lw-hunter-' + pose) h.img.setTexture('lw-hunter-' + pose);
      const near = clamp(1 - (h.d - 0.2) / 0.9, 0, 1);
      if (!h.gone) {
        h.img.setAlpha(h.lit ? 1 : lerp(0.16, 0.66, near));
        h.img.setTint(h.lit ? 0xfff0d4 : (h.kind === 'dash' ? 0x9fc4d8 : 0x7f9cb0));
      }

      h.eyes.x = p.x;
      h.eyes.y = M.Y(p.y - 30);
      h.eyes.setDepth(h.z + 0.3);
      h.eyes.setAlpha(h.gone ? 0 : (h.lit ? 0.08 : lerp(0.2, 1, near)) * (0.7 + Math.sin(h.t * 3.1 + h.ph) * 0.3));
      h.eyes.setScale((0.34 + near * 0.12) * K);
    }

    beamFloor.clear();
    beamHaze.clear();
    if (state.flame > 0.02) {
      const half = state.half * (1 - state.flick * 0.14);
      const reach = state.reach;
      wedge(beamFloor, aimEff, half, reach, 0xffc98a, 0.07, 14);
      wedge(beamFloor, aimEff, half * 0.72, reach, 0xffd9a4, 0.085, 12);
      wedge(beamFloor, aimEff, half * 0.44, reach, 0xffe8c0, 0.11, 10);
      wedge(beamFloor, aimEff, half * 0.16, reach, 0xfff6dc, 0.15, 8);
      wedge(beamHaze, aimEff, half * 1.06, reach, 0xffd9a4, 0.05, 14);
      wedge(beamHaze, aimEff, half * 0.4, reach, 0xfff2d4, 0.045, 10);
      beamFloor.lineStyle(1.6 * K, 0xffe0b0, 0.16);
      [half, -half].forEach((o) => {
        const a = aimEff + o;
        const p0 = arenaPos(a, NEST_D - 0.02);
        const p = arenaPos(a, reach);
        beamFloor.beginPath();
        beamFloor.moveTo(p0.x, M.Y(p0.y));
        beamFloor.lineTo(p.x, M.Y(p.y));
        beamFloor.strokePath();
      });
      beamFloor.lineStyle(2.2 * K, 0xffd9a0, 0.08 + spread * 0.07);
      beamFloor.beginPath();
      for (let i = 0; i <= 26; i++) {
        const p = arenaPos(aimEff - half + (half * 2 * i) / 26, reach);
        if (i === 0) beamFloor.moveTo(p.x, M.Y(p.y));
        else beamFloor.lineTo(p.x, M.Y(p.y));
      }
      beamFloor.strokePath();
    }

    motes.forEach((m) => {
      m.t += dt * m.sp * 0.34;
      if (m.t > 1) {
        m.t -= 1;
        m.o = (r() - 0.5) * 2;
        m.sp = 0.12 + r() * 0.3;
      }
      const p = arenaPos(aimEff + m.o * state.half * 0.86, 0.08 + m.t * state.reach);
      m.img.x = p.x;
      m.img.y = M.Y(p.y) - Math.sin(m.t * 6 + m.ph) * 6 * K;
      m.img.setAlpha(state.flame > 0.02 ? (0.16 + Math.sin(m.t * 3 + m.ph) * 0.14) * (1 - m.t * 0.4) : 0);
      m.img.setScale((1 + m.t * 1.4) * K);
    });

    embers.forEach((e) => {
      e.life += dt;
      if (e.life > e.max || e.img.x < -30 || e.img.x > W + 30 || e.img.y < M.Y(24) || e.img.y > M.Y(534)) {
        e.life = 0;
        e.max = 2.4 + r() * 3.2;
        const p = arenaPos(state.wind + (r() - 0.5) * 1.6, 0.4 + r() * 0.66);
        e.img.x = p.x;
        e.img.y = M.Y(p.y);
        e.jitter = r() * TAU;
      }
      const v = 40 + state.windStrength * 190;
      e.img.x += Math.cos(state.wind) * v * dt;
      e.img.y += (Math.sin(state.wind) * v * 0.3 - 14) * dt;
      e.img.x += Math.sin(state.time * 2 + e.jitter) * 8 * dt;
      e.img.setAlpha(Math.sin((e.life / e.max) * Math.PI) * (0.24 + state.windStrength * 0.4));
    });

    ring.clear();
    const done = 1 - clamp(state.watchT / state.watchLen, 0, 1);
    ring.lineStyle(2.4 * K, 0xffd9a0, 0.13);
    ring.beginPath();
    for (let i = 0; i <= 40; i++) {
      const p = arenaPos(-Math.PI / 2 + (done * TAU * i) / 40, 0.3);
      if (i === 0) ring.moveTo(p.x, M.Y(p.y));
      else ring.lineTo(p.x, M.Y(p.y));
    }
    ring.strokePath();
    ring.lineStyle(1.6 * K, accent, 0.07 + state.windStrength * 0.12);
    ring.beginPath();
    for (let i = 0; i <= 18; i++) {
      const p = arenaPos(windTo + (i / 18 - 0.5) * 0.5, 0.94 + (i / 18) * 0.06);
      if (i === 0) ring.moveTo(p.x, M.Y(p.y));
      else ring.lineTo(p.x, M.Y(p.y));
    }
    ring.strokePath();

    props.forEach((p) => {
      const rip = Math.sin(state.time * 2.6 + p.ph + p.a * 2) * 0.06 * (0.4 + state.windStrength);
      p.img.rotation = Math.cos(windTo) * (0.1 + state.windStrength * 0.42) + rip;
      p.img.setAlpha(p.base * (0.72 + state.flame * 0.28));
    });

    const lampY = M.Y(CY + 8);
    flame.x = lamp.x + Math.cos(windTo) * state.windStrength * 5 * K * (state.cup ? 0.2 : 1);
    flame.y = lampY - FLAME_LIFT * LAMP_SCALE * K;
    const fs = (0.26 + state.flame * 0.2) * (1 - state.flick * 0.18);
    flame.setScale(fs * K);
    flame.setRotation(Math.cos(windTo) * state.windStrength * 0.16);
    flame.setAlpha(state.flame > 0.02 ? 0.85 + Math.sin(time / 90) * 0.1 : 0.12);
    flameGlow.x = flame.x;
    flameGlow.y = flame.y - 14 * K;
    flameGlow.setScale((0.32 + state.flame * 0.4) * K);
    flameGlow.setAlpha(0.2 + state.flame * 0.5 + Math.sin(time / 210) * 0.05);
    nestGlow.setAlpha(0.03 + state.flame * 0.07 + state.warmth * 0.03);
    nestGlow.setScale((0.7 + state.flame * 0.22) * K);
    pennant.x = lamp.x + 3 * K;
    pennant.y = lamp.y - CROWN_LIFT * LAMP_SCALE * K;
    pennant.setRotation(screenAngle(windTo) * 0.55 + Math.sin(state.time * 5) * 0.08 * state.windStrength);
    pennant.setScale((0.26 + state.windStrength * 0.12) * K);
    cupScreen.setAlpha(state.cup ? Math.min(0.95, cupScreen.alpha + dt * 4) : Math.max(0, cupScreen.alpha - dt * 4));
    cupScreen.setScale((0.85 + Math.sin(time / 400) * 0.01) * K);
    const warmMix = Phaser.Display.Color.Interpolate.ColorWithColor(COLDNEST, HOTNEST, 100, Math.round(clamp(state.warmth, 0, 1) * 100));
    nest.setTint(Phaser.Display.Color.GetColor(warmMix.r, warmMix.g, warmMix.b));
    wash.setAlpha(1 - state.flame * 0.18);

    const audio = scene.audio;
    if (audio && audio.air && audio.ctx) {
      try {
        audio.air.gain.gain.setTargetAtTime(0.02 + state.windStrength * 0.05, audio.ctx.currentTime, 0.3);
        audio.air.air.frequency.setTargetAtTime(620 + state.windStrength * 1500, audio.ctx.currentTime, 0.3);
      } catch { /* the air bed is optional */ }
    }

    const nearest = hunters.reduce((acc, h) => Math.min(acc, h.d), 9);
    scene.audio.setTension(clamp(1.25 - nearest * 1.1, 0, 1) * (0.5 + (1 - state.flame) * 0.5));

    scene.hud({
      score: state.watches,
      progress: state.flame,
      hearts: state.hearts,
      extra: state.cup ? 'cupped — the flame is gathering'
        : state.flame < 0.2 ? 'the flame is guttering'
        : state.windPhase === 'gust' && intoWind > 0.4 ? 'the wind is on the beam'
        : state.flame < 0.5 ? 'wide beam drinks the flame'
        : 'sweep the dark'
    });
  }

  return {
    update,
    state: () => ({
      time: Number(state.time.toFixed(2)),
      watches: state.watches,
      hearts: state.hearts,
      flame: Number(state.flame.toFixed(3)),
      cup: state.cup,
      aimDeg: Math.round((state.aim * 180) / Math.PI),
      halfDeg: Number(((state.half * 180) / Math.PI).toFixed(1)),
      reach: Number(state.reach.toFixed(2)),
      bend: Number(state.bend.toFixed(3)),
      windDeg: Math.round((state.wind * 180) / Math.PI),
      windStrength: Number(state.windStrength.toFixed(2)),
      windPhase: state.windPhase,
      watchT: Number(state.watchT.toFixed(1)),
      watchLen: Number(state.watchLen.toFixed(1)),
      sides: state.sides,
      alive: state.alive,
      held: state.held,
      breaches: state.breaches,
      over: state.over,
      hunters: hunters.map((h) => ({
        deg: Math.round((angDelta(h.a, 0) * 180) / Math.PI),
        d: Number(h.d.toFixed(3)),
        kind: h.kind,
        lit: h.lit,
        held: h.held,
        gone: h.gone,
        minD: Number(h.minD.toFixed(3))
      }))
    }),
    setAim: (deg) => {
      const a = (deg * Math.PI) / 180;
      state.aim = a;
      state.aimWant = a;
      pointerSeen = true;
    },
    setHalf: (deg) => {
      const a = clamp((deg * Math.PI) / 180, MIN_HALF, MAX_HALF);
      state.half = a;
      state.halfWant = a;
    },
    cup: (v) => { state.forceCup = v === null || v === undefined ? null : !!v; },
    setFlame: (v) => { state.flame = clamp(v, 0, 1); },
    setHearts: (v) => { state.hearts = v; },
    setWind: (deg) => {
      const a = (deg * Math.PI) / 180;
      state.wind = a;
      state.windTarget = a;
    },
    gust: () => gust(),
    setAuto: (v) => { state.auto = !!v; },
    forceWatch: () => completeWatch(),
    addHunterAt: (deg, d, kind) => {
      const h = addHunter((deg * Math.PI) / 180, d === undefined ? 0.8 : d, kind);
      return hunters.indexOf(h);
    },
    clearHunters: () => { while (hunters.length) removeHunter(hunters[hunters.length - 1]); },
    beamAt: (deg) => {
      const da = Math.abs(angDelta((deg * Math.PI) / 180, state.aim));
      return { lit: da <= state.half, headOn: da <= state.half * BRAZEN_CORE };
    }
  };
}

export default {
  id: 'lantern-watch',
  mood: 'night',
  unit: 'watches',
  stars: STAR,
  create,
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
