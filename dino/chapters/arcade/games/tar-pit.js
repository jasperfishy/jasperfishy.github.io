// Tar Pit Lifeline — the amber pit.
// One vine hangs over a breathing tar sea. Swing out over the stones, let go
// at the top of the arc, and lift the hatchlings off the rocks before their
// bubbles stop rising.

import { canvasTex, grain, rng, clamp, W } from '../engine.js?v=du-276e018775e133bb';

const GOAL = 16;
const STAR = [6, 11, 16];
const URGENCY = 19;
const MAX_HATCH = 4;

const ISLES = [
  { x: 110, f: 0.64, art: 0 },
  { x: 300, f: 0.86, art: 1 },
  { x: 490, f: 0.72, art: 2 },
  { x: 680, f: 0.88, art: 0 },
  { x: 870, f: 0.66, art: 1 }
];

/* ------------------------------------------------------------------- art */
function leafShape(c, x, y, len, wid, angle, fill, vein) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(len * 0.42, -wid, len, 0);
  c.quadraticCurveTo(len * 0.42, wid, 0, 0);
  c.closePath();
  c.fill();
  if (vein) {
    c.strokeStyle = vein;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(2, 0); c.lineTo(len * 0.86, 0); c.stroke();
  }
  c.restore();
}

function branchArt(scene) {
  canvasTex(scene, 'tp-branch', 960, 150, (c) => {
    const rand = rng(1301);

    // the high limb the vine is tied to
    const g = c.createLinearGradient(0, 20, 0, 120);
    g.addColorStop(0, '#7a5834');
    g.addColorStop(0.32, '#5d4026');
    g.addColorStop(0.72, '#38251a');
    g.addColorStop(1, '#1d130e');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-12, 32);
    c.quadraticCurveTo(210, 18, 468, 38);
    c.quadraticCurveTo(724, 58, 972, 26);
    c.lineTo(972, 92);
    c.quadraticCurveTo(724, 122, 468, 106);
    c.quadraticCurveTo(210, 90, -12, 102);
    c.closePath();
    c.fill();

    // the limb forks up and out of frame
    c.fillStyle = '#4a3220';
    c.beginPath();
    c.moveTo(596, 44);
    c.quadraticCurveTo(648, 18, 690, -30);
    c.lineTo(742, -30);
    c.quadraticCurveTo(700, 26, 668, 58);
    c.closePath();
    c.fill();

    // bark ridges
    c.strokeStyle = 'rgba(24,14,8,0.55)';
    for (let i = 0; i < 42; i++) {
      const x = 20 + rand() * 920;
      const y = 40 + rand() * 54;
      c.lineWidth = 1 + rand() * 2.6;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 22 + rand() * 34, y + (rand() - 0.5) * 8, x + 52 + rand() * 50, y + (rand() - 0.5) * 6);
      c.stroke();
    }
    c.strokeStyle = 'rgba(226,186,126,0.18)';
    for (let i = 0; i < 16; i++) {
      const x = 30 + rand() * 900;
      const y = 30 + rand() * 20;
      c.lineWidth = 1 + rand() * 1.6;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40 + rand() * 80, y + rand() * 5); c.stroke();
    }

    // moss along the crown of the branch
    for (let i = 0; i < 34; i++) {
      const x = 10 + rand() * 940;
      const y = 22 + Math.sin(x * 0.012) * 8 + rand() * 22;
      const r = 4 + rand() * 11;
      c.fillStyle = i % 3 ? 'rgba(104,116,54,0.85)' : 'rgba(138,152,70,0.8)';
      c.beginPath(); c.ellipse(x, y, r, r * 0.62, rand() * 0.6, 0, Math.PI * 2); c.fill();
      if (i % 4 === 0) {
        c.strokeStyle = 'rgba(186,196,110,0.5)';
        c.lineWidth = 1.2;
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.moveTo(x + k * 4 - 4, y - 2);
          c.lineTo(x + k * 5 - 5, y - 8 - rand() * 6);
          c.stroke();
        }
      }
    }

    // short hanging twigs with leaves
    const twigs = [92, 268, 352, 742, 872];
    twigs.forEach((tx, i) => {
      const len = 34 + rand() * 34;
      const sway = (rand() - 0.5) * 26;
      c.strokeStyle = '#3f2b1c';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(tx, 84);
      c.quadraticCurveTo(tx + sway * 0.4, 84 + len * 0.6, tx + sway, 84 + len);
      c.stroke();
      for (let k = 1; k <= 3; k++) {
        const t = k / 4;
        const lx = tx + sway * t;
        const ly = 84 + len * t;
        const side = k % 2 ? 1 : -1;
        leafShape(c, lx, ly, 14 + rand() * 8, 4.5, side * 0.9 + 0.5, i % 2 ? '#5c6d34' : '#4d6030', 'rgba(180,196,120,0.4)');
      }
    });

    // foliage hiding the fork where it leaves the frame
    leafShape(c, 604, 12, 62, 16, 0.7, '#4e6030', 'rgba(180,196,120,0.3)');
    leafShape(c, 646, 6, 82, 19, 0.42, '#5d7033', 'rgba(190,206,130,0.32)');
    leafShape(c, 700, 4, 70, 17, 1.15, '#465a2c', 'rgba(180,196,120,0.28)');
    leafShape(c, 736, 16, 56, 14, 1.5, '#566a31', 'rgba(190,206,130,0.28)');
    leafShape(c, 580, 26, 50, 13, 0.2, '#5a6c31', 'rgba(190,206,130,0.3)');

    // broad leaves framing the corners
    leafShape(c, 12, 58, 92, 18, 0.34, '#54662f', 'rgba(180,196,120,0.35)');
    leafShape(c, 40, 40, 74, 15, 0.62, '#647536', 'rgba(190,206,130,0.35)');
    leafShape(c, 948, 54, 96, 18, Math.PI - 0.32, '#4e6030', 'rgba(180,196,120,0.3)');
    leafShape(c, 916, 36, 70, 14, Math.PI - 0.6, '#607133', 'rgba(190,206,130,0.3)');

    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(0, 0, 0, 130);
    rim.addColorStop(0, 'rgba(255,200,120,0.22)');
    rim.addColorStop(0.5, 'rgba(255,200,120,0.02)');
    rim.addColorStop(1, 'rgba(0,0,0,0.2)');
    c.fillStyle = rim; c.fillRect(0, 0, 960, 150);
    c.globalCompositeOperation = 'source-over';
    grain(c, 960, 150, 0.035, 19);
  });

  canvasTex(scene, 'tp-knot', 64, 64, (c) => {
    const rand = rng(77);
    c.lineCap = 'round';
    // wrapped loops of the vine around the limb
    for (let i = 0; i < 4; i++) {
      c.strokeStyle = i % 2 ? '#8a6736' : '#6d4f29';
      c.lineWidth = 5 - i * 0.5;
      c.beginPath();
      c.ellipse(32, 30 + i * 4.5, 17 - i * 1.2, 8 + i * 1.2, -0.2 + i * 0.12, 0, Math.PI * 2);
      c.stroke();
    }
    c.strokeStyle = '#3c2a18';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(22, 42); c.quadraticCurveTo(28, 52, 32, 58); c.stroke();
    c.strokeStyle = 'rgba(230,198,130,0.5)';
    c.lineWidth = 1.4;
    c.beginPath(); c.arc(30, 26, 12, 3.4, 5.4); c.stroke();
    c.fillStyle = '#a9814a';
    c.beginPath(); c.ellipse(44, 44, 6, 3, 0.7, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = i % 2 ? '#96855a' : '#7a6a44';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(32, 46);
      c.quadraticCurveTo(32 + (rand() - 0.5) * 18, 52 + rand() * 8, 32 + (rand() - 0.5) * 22, 61);
      c.stroke();
    }
    grain(c, 64, 64, 0.03, 29);
  });

  canvasTex(scene, 'tp-leaf', 32, 18, (c) => {
    c.fillStyle = '#68803c';
    c.beginPath();
    c.moveTo(2, 9);
    c.quadraticCurveTo(12, 1, 30, 4);
    c.quadraticCurveTo(20, 15, 2, 9);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(200,214,140,0.45)';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(4, 9); c.lineTo(26, 8); c.stroke();
  });

  const strand = (key, seed) => {
    canvasTex(scene, key, 96, 300, (c) => {
      const rand = rng(seed);
      const sx = 48 + (rand() - 0.5) * 12;
      c.strokeStyle = '#4c3a22';
      c.lineWidth = 3.4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(sx, 0);
      c.bezierCurveTo(sx + 18, 90, sx - 22, 190, sx + 6, 296);
      c.stroke();
      for (let i = 1; i < 9; i++) {
        const t = i / 9;
        const x = sx + Math.sin(t * 4.6 + seed) * 12;
        const y = t * 288;
        const side = i % 2 ? 1 : -1;
        leafShape(c, x, y, 18 + rand() * 9, 5.5, side * 0.85 + (t - 0.5) * 0.3, i % 3 ? '#5d7038' : '#4a5c2e', 'rgba(190,206,130,0.35)');
      }
    });
  };
  strand('tp-strand-a', 11);
  strand('tp-strand-b', 37);
}

function heroArt(scene) {
  canvasTex(scene, 'tp-hang', 150, 150, (c) => {
    const rand = rng(511);

    // tail feathers, fanned down
    for (let i = -1; i <= 1; i++) {
      c.save();
      c.translate(75, 98);
      c.rotate(i * 0.3);
      const g = c.createLinearGradient(0, 0, 0, 52);
      g.addColorStop(0, '#2c6b62');
      g.addColorStop(0.7, '#1f514c');
      g.addColorStop(1, '#8a6a3a');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-7, 0);
      c.quadraticCurveTo(-11, 28, 0, 50);
      c.quadraticCurveTo(11, 28, 7, 0);
      c.closePath();
      c.fill();
      c.restore();
    }

    // legs dangling, claws curled
    [[66, 92, 60, 116], [84, 92, 90, 114]].forEach(([hx, hy, fx, fy], i) => {
      c.strokeStyle = i ? '#c9a267' : '#dfba7c';
      c.lineWidth = 4.6;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + fx) / 2, hy + 12, fx, fy); c.stroke();
      c.strokeStyle = '#f0d9a4';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx - 5, fy + 6); c.moveTo(fx, fy); c.lineTo(fx + 4, fy + 7); c.stroke();
    });

    // gripping arms, drawn behind the head and body
    c.strokeStyle = '#24625a';
    c.lineWidth = 8;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(62, 54); c.quadraticCurveTo(58, 30, 66, 13); c.stroke();
    c.beginPath(); c.moveTo(88, 54); c.quadraticCurveTo(92, 30, 84, 13); c.stroke();
    c.strokeStyle = '#e2bd80';
    c.lineWidth = 3;
    [[66, 13], [84, 13]].forEach(([hx, hy]) => {
      c.beginPath();
      c.moveTo(hx - 6, hy + 3); c.lineTo(hx, hy - 3); c.lineTo(hx + 6, hy + 3);
      c.stroke();
    });

    // folded wings behind the body
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const y = 62 + i * 12;
        c.save();
        c.translate(75 + side * (17 + i * 2), y);
        c.rotate(side * (0.5 + i * 0.16));
        const g = c.createLinearGradient(0, 0, side * 30, 18);
        g.addColorStop(0, '#3d867a');
        g.addColorStop(1, '#1f4f4a');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(0, -6);
        c.quadraticCurveTo(side * 22, 2, side * 30, 16);
        c.quadraticCurveTo(side * 12, 14, 0, 8);
        c.closePath();
        c.fill();
        c.fillStyle = 'rgba(255,206,140,0.55)';
        c.beginPath(); c.ellipse(side * 26, 15, 4, 2.4, side * 0.7, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    });

    // body
    const body = c.createLinearGradient(52, 44, 102, 102);
    body.addColorStop(0, '#58a08e');
    body.addColorStop(0.5, '#31766c');
    body.addColorStop(1, '#194641');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(75, 72, 26, 31, 0, 0, Math.PI * 2); c.fill();

    // breast band
    c.fillStyle = 'rgba(232,201,138,0.9)';
    c.beginPath(); c.ellipse(75, 84, 14, 15, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,236,190,0.5)';
    c.beginPath(); c.ellipse(73, 80, 7, 8, -0.2, 0, Math.PI * 2); c.fill();

    // speckled feathers
    c.strokeStyle = 'rgba(16,44,42,0.4)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 10; i++) {
      const a = i * 1.7;
      c.beginPath();
      c.arc(75 + Math.cos(a) * 15, 70 + Math.sin(a) * 18, 4 + (i % 3), 0.4, 2.4);
      c.stroke();
    }

    // head
    c.fillStyle = '#3d8579';
    c.beginPath(); c.ellipse(75, 40, 21, 19, -0.05, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(120,190,168,0.5)';
    c.beginPath(); c.ellipse(72, 34, 12, 8, -0.25, 0, Math.PI * 2); c.fill();

    // beak
    c.fillStyle = '#d7a45e';
    c.beginPath();
    c.moveTo(83, 44); c.quadraticCurveTo(100, 47, 98, 53);
    c.quadraticCurveTo(90, 53, 82, 50); c.closePath(); c.fill();
    c.fillStyle = '#8a5a2c';
    c.beginPath(); c.moveTo(83, 49); c.quadraticCurveTo(92, 51, 97, 53); c.quadraticCurveTo(90, 53, 82, 51); c.closePath(); c.fill();

    // eye, bright and forward
    c.fillStyle = '#fff6dc';
    c.beginPath(); c.arc(80, 37, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#241a12';
    c.beginPath(); c.arc(81.4, 37, 3.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffcf6a';
    c.beginPath(); c.arc(80.6, 36, 1.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.arc(79.4, 34.6, 1.2, 0, Math.PI * 2); c.fill();

    // crest feathers
    c.strokeStyle = '#e0a44e';
    c.lineWidth = 3;
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(66 + i * 2, 26);
      c.quadraticCurveTo(56 + i * 3, 10 - i * 2, 42 + i * 4, 8 - i * 3);
      c.stroke();
    }
    c.strokeStyle = '#f4cd85';
    c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(64, 25); c.quadraticCurveTo(52, 12, 44, 10); c.stroke();

    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(40, 10, 120, 130);
    rim.addColorStop(0, 'rgba(255,214,150,0.34)');
    rim.addColorStop(0.55, 'rgba(255,214,150,0.03)');
    rim.addColorStop(1, 'rgba(60,20,8,0.16)');
    c.fillStyle = rim; c.fillRect(0, 0, 150, 150);
    c.globalCompositeOperation = 'source-over';
    grain(c, 150, 150, 0.028, 523);
  });

  canvasTex(scene, 'tp-glide', 220, 140, (c) => {
    const rand = rng(577);

    // tail fan trailing behind
    for (let i = -1; i <= 1; i++) {
      c.save();
      c.translate(70, 70);
      c.rotate(0.5 + i * 0.22);
      const g = c.createLinearGradient(0, 0, -44, 10);
      g.addColorStop(0, '#2f7169');
      g.addColorStop(1, '#8a6a3a');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, -6);
      c.quadraticCurveTo(-24, -2 + i * 6, -46, 6 + i * 10);
      c.quadraticCurveTo(-24, 12 + i * 8, 0, 6);
      c.closePath(); c.fill();
      c.restore();
    }

    // wings, spread wide
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 4; i++) {
        c.save();
        c.translate(110, 58 + i * 6);
        c.rotate(side * (0.02 + i * 0.09));
        const len = 92 - i * 12;
        const g = c.createLinearGradient(0, 0, side * len, 18);
        g.addColorStop(0, '#3f8c7e');
        g.addColorStop(0.72, '#25685f');
        g.addColorStop(1, '#9a763e');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(0, -9);
        c.quadraticCurveTo(side * len * 0.55, -8 - i * 3, side * len, 8 + i * 5);
        c.quadraticCurveTo(side * len * 0.5, 12 + i * 4, 0, 8);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,214,150,0.35)';
        c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(side * len * 0.6, 1, side * len * 0.92, 9 + i * 5); c.stroke();
        c.restore();
      }
    });

    // body
    const body = c.createLinearGradient(96, 40, 168, 96);
    body.addColorStop(0, '#58a08e');
    body.addColorStop(0.55, '#2f7169');
    body.addColorStop(1, '#183f3b');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(126, 68, 40, 20, -0.06, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(232,201,138,0.75)';
    c.beginPath(); c.ellipse(132, 76, 24, 8, -0.04, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(16,44,42,0.35)';
    c.lineWidth = 1.3;
    for (let i = 0; i < 7; i++) {
      c.beginPath();
      c.arc(112 + i * 6, 63 + (i % 2) * 7, 3.6, 0.4, 2.6);
      c.stroke();
    }

    // head forward
    c.fillStyle = '#3d8579';
    c.beginPath(); c.ellipse(172, 56, 24, 17, -0.12, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d7a45e';
    c.beginPath();
    c.moveTo(188, 58); c.quadraticCurveTo(212, 60, 210, 66);
    c.quadraticCurveTo(200, 68, 186, 64); c.closePath(); c.fill();
    c.fillStyle = '#8a5a2c';
    c.beginPath(); c.moveTo(188, 63); c.quadraticCurveTo(200, 65, 209, 66); c.quadraticCurveTo(198, 68, 186, 66); c.closePath(); c.fill();
    c.fillStyle = '#fff6dc';
    c.beginPath(); c.arc(176, 52, 6.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#241a12';
    c.beginPath(); c.arc(177.6, 52, 3.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffcf6a';
    c.beginPath(); c.arc(176.8, 50.8, 1.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.arc(175.4, 49.6, 1.2, 0, Math.PI * 2); c.fill();

    // crest streaming back
    c.strokeStyle = '#e0a44e';
    c.lineWidth = 3;
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(164 + i * 2, 42);
      c.quadraticCurveTo(148 - i * 4, 30 + i * 3, 128 - i * 5, 32 + i * 4);
      c.stroke();
    }

    // legs tucked
    c.strokeStyle = '#c9a267';
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(112, 82); c.quadraticCurveTo(96, 94, 78, 96); c.stroke();
    c.beginPath(); c.moveTo(120, 84); c.quadraticCurveTo(106, 98, 90, 102); c.stroke();

    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(20, 0, 210, 110);
    rim.addColorStop(0, 'rgba(255,214,150,0.3)');
    rim.addColorStop(0.6, 'rgba(255,214,150,0.02)');
    rim.addColorStop(1, 'rgba(60,20,8,0.14)');
    c.fillStyle = rim; c.fillRect(0, 0, 220, 140);
    c.globalCompositeOperation = 'source-over';
    grain(c, 220, 140, 0.028, 541);
  });
}

function hatchArt(scene) {
  canvasTex(scene, 'tp-hatch', 100, 104, (c) => {
    const rand = rng(881);

    // shell base
    const shell = c.createLinearGradient(18, 54, 82, 102);
    shell.addColorStop(0, '#fff1c8');
    shell.addColorStop(0.55, '#e5ce9c');
    shell.addColorStop(1, '#a8885a');
    c.fillStyle = shell;
    c.beginPath();
    c.moveTo(20, 100);
    c.quadraticCurveTo(14, 74, 26, 62);
    c.lineTo(36, 68); c.lineTo(44, 58); c.lineTo(53, 68); c.lineTo(62, 57);
    c.lineTo(72, 68); c.lineTo(80, 60);
    c.quadraticCurveTo(88, 76, 80, 100);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(120,90,50,0.35)';
    c.beginPath(); c.ellipse(50, 86, 22, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.ellipse(36, 76, 9, 12, -0.5, 0, Math.PI * 2); c.fill();

    // shell speckles
    c.fillStyle = 'rgba(126,94,54,0.5)';
    for (let i = 0; i < 14; i++) {
      const x = 24 + (i * 37) % 54;
      const y = 62 + (i * 29) % 32;
      c.beginPath(); c.ellipse(x, y, 1.8, 1.2, i, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = 'rgba(110,80,44,0.6)';
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(58, 70); c.lineTo(63, 76); c.lineTo(58, 80); c.stroke();

    // hatchling body rising out of the shell
    const body = c.createRadialGradient(50, 34, 4, 52, 44, 30);
    body.addColorStop(0, '#fff1c4');
    body.addColorStop(0.55, '#e9c983');
    body.addColorStop(1, '#b98a4a');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(50, 40, 21, 23, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,247,214,0.55)';
    c.beginPath(); c.ellipse(46, 34, 10, 12, -0.3, 0, Math.PI * 2); c.fill();

    // tiny crest and snout
    c.fillStyle = '#d9a45c';
    c.beginPath();
    c.moveTo(58, 42); c.quadraticCurveTo(72, 44, 70, 50);
    c.quadraticCurveTo(62, 50, 57, 48); c.closePath(); c.fill();
    c.strokeStyle = '#e8b86a';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(44, 22); c.quadraticCurveTo(40, 12, 34, 9); c.stroke();
    c.beginPath(); c.moveTo(50, 20); c.quadraticCurveTo(50, 10, 47, 5); c.stroke();

    // face
    c.fillStyle = '#2a1c12';
    c.beginPath(); c.ellipse(41, 37, 4.6, 5.4, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(59, 38, 4.6, 5.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fffdf2';
    c.beginPath(); c.arc(39.8, 35.4, 1.7, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(57.8, 36.4, 1.7, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd27a';
    c.beginPath(); c.arc(40.8, 38.9, 1.1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(58.8, 39.9, 1.1, 0, Math.PI * 2); c.fill();

    // tiny arms gripping the shell rim
    c.strokeStyle = '#d9b06c';
    c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(33, 54); c.quadraticCurveTo(26, 60, 27, 66); c.stroke();
    c.beginPath(); c.moveTo(67, 54); c.quadraticCurveTo(74, 60, 73, 66); c.stroke();

    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(20, 0, 80, 70);
    rim.addColorStop(0, 'rgba(255,244,204,0.35)');
    rim.addColorStop(0.6, 'rgba(255,244,204,0)');
    c.fillStyle = rim; c.fillRect(0, 0, 100, 104);
    c.globalCompositeOperation = 'source-over';
    grain(c, 100, 104, 0.025, 907 + rand() * 10);
  });
}

function rockArt(scene, key, seed, top, mid, base) {
  canvasTex(scene, key, 240, 280, (c) => {
    const rand = rng(seed);
    c.save();
    c.translate(0, 56);

    // squat pillar rising out of the tar
    c.beginPath();
    c.moveTo(14, 222);
    c.lineTo(24, 172);
    c.lineTo(38, 126);
    c.lineTo(54, 82);
    c.lineTo(72, 50);
    c.quadraticCurveTo(96, 30, 124, 34);
    c.lineTo(152, 44);
    c.lineTo(178, 78);
    c.lineTo(196, 128);
    c.lineTo(212, 178);
    c.lineTo(228, 222);
    c.closePath();
    const g = c.createLinearGradient(40, 30, 200, 222);
    g.addColorStop(0, top);
    g.addColorStop(0.45, mid);
    g.addColorStop(1, base);
    c.fillStyle = g;
    c.fill();

    // strata bands
    c.strokeStyle = 'rgba(24,16,10,0.32)';
    for (let i = 0; i < 8; i++) {
      const y = 66 + i * 18;
      c.lineWidth = 1.2 + (i % 3);
      c.beginPath();
      c.moveTo(30 + (i % 4) * 8, y);
      for (let x = 60; x < 220; x += 32) c.lineTo(x, y + Math.sin(x * 0.05 + i) * 5);
      c.stroke();
    }

    // cracked faces
    c.strokeStyle = 'rgba(18,12,8,0.42)';
    c.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) {
      const x = 52 + rand() * 140;
      const y = 60 + rand() * 100;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (rand() - 0.5) * 26, y + 18 + rand() * 26);
      c.lineTo(x + (rand() - 0.5) * 34, y + 44 + rand() * 20);
      c.stroke();
    }

    // lit rim on the sunward side
    c.strokeStyle = 'rgba(255,204,132,0.42)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(152, 44);
    c.lineTo(178, 78);
    c.lineTo(196, 128);
    c.lineTo(212, 178);
    c.lineTo(228, 222);
    c.stroke();
    c.strokeStyle = 'rgba(255,224,166,0.22)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(72, 50);
    c.quadraticCurveTo(96, 30, 124, 34);
    c.lineTo(152, 44);
    c.stroke();

    // moss crown on the plateau
    for (let i = 0; i < 16; i++) {
      const x = 66 + rand() * 92;
      const y = 32 + rand() * 16;
      c.fillStyle = i % 3 ? 'rgba(104,116,54,0.9)' : 'rgba(140,154,72,0.85)';
      c.beginPath(); c.ellipse(x, y, 5 + rand() * 9, 3 + rand() * 4, rand(), 0, Math.PI * 2); c.fill();
    }
    // grass tufts
    c.strokeStyle = '#7d8a42';
    c.lineWidth = 1.6;
    for (let i = 0; i < 10; i++) {
      const x = 68 + rand() * 90;
      c.beginPath();
      c.moveTo(x, 34);
      c.quadraticCurveTo(x + 4, 22, x + (i % 2 ? 10 : -8), 12 + rand() * 6);
      c.stroke();
    }

    // damp foot of the rock
    c.fillStyle = 'rgba(10,7,5,0.5)';
    c.beginPath(); c.ellipse(120, 222, 104, 12, 0, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-atop';
    const warm = c.createLinearGradient(0, 222, 0, 150);
    warm.addColorStop(0, 'rgba(255,150,60,0.26)');
    warm.addColorStop(1, 'rgba(255,150,60,0)');
    c.fillStyle = warm; c.fillRect(0, 150, 240, 72);
    c.globalCompositeOperation = 'source-over';
    c.restore();
    grain(c, 240, 280, 0.04, seed + 7);
  });
}

function tarArt(scene) {
  canvasTex(scene, 'tp-tar', 960, 720, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#4a3320');
    g.addColorStop(0.18, '#2a1c11');
    g.addColorStop(0.62, '#120b07');
    g.addColorStop(1, '#050302');
    c.fillStyle = g;
    c.fillRect(0, 0, 960, 720);

    const rand = rng(1707);

    // slow glossy swells
    c.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = rand() * 960;
      const y = 20 + rand() * 660;
      const r = 30 + rand() * 120;
      c.strokeStyle = i % 3 ? 'rgba(255,176,74,0.09)' : 'rgba(255,224,160,0.13)';
      c.lineWidth = 2 + rand() * 6;
      c.beginPath();
      c.arc(x, y, r, 0.2 + rand(), 1.4 + rand());
      c.stroke();
    }
    // fine ripples
    c.strokeStyle = 'rgba(0,0,0,0.4)';
    for (let i = 0; i < 30; i++) {
      const y = 10 + rand() * 700;
      c.lineWidth = 1 + rand() * 2;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= 960; x += 40) c.lineTo(x, y + Math.sin(x * 0.018 + i) * 4);
      c.stroke();
    }

    // trapped bubbles
    for (let i = 0; i < 46; i++) {
      const x = rand() * 960;
      const y = 16 + rand() * 680;
      const r = 2 + rand() * 11;
      c.fillStyle = 'rgba(72,46,22,0.92)';
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,206,130,0.42)';
      c.lineWidth = 1.4;
      c.beginPath(); c.arc(x, y, r, 2.4, 4.6); c.stroke();
      c.fillStyle = 'rgba(255,232,180,0.45)';
      c.beginPath(); c.arc(x - r * 0.32, y - r * 0.4, Math.max(0.7, r * 0.2), 0, Math.PI * 2); c.fill();
    }

    // warm breath from below
    c.globalCompositeOperation = 'screen';
    const warm = c.createLinearGradient(0, 500, 0, 720);
    warm.addColorStop(0, 'rgba(255,150,50,0)');
    warm.addColorStop(1, 'rgba(255,130,40,0.16)');
    c.fillStyle = warm; c.fillRect(0, 440, 960, 280);
    c.globalCompositeOperation = 'source-over';
    grain(c, 960, 720, 0.045, 1733);
  });
}

function airArt(scene) {
  canvasTex(scene, 'tp-haze', 960, 280, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 280);
    g.addColorStop(0, 'rgba(34,22,10,0)');
    g.addColorStop(0.5, 'rgba(44,28,12,0.34)');
    g.addColorStop(0.82, 'rgba(26,16,8,0.72)');
    g.addColorStop(1, 'rgba(14,9,5,0.9)');
    c.fillStyle = g; c.fillRect(0, 0, 960, 280);
  });

  canvasTex(scene, 'tp-canopy', 960, 520, (c) => {
    const rand = rng(1907);
    const g = c.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, 'rgba(16,26,18,0.96)');
    g.addColorStop(0.6, 'rgba(22,34,22,0.62)');
    g.addColorStop(1, 'rgba(22,34,22,0)');
    c.fillStyle = g; c.fillRect(0, 0, 960, 220);
    // hanging fronds
    for (let i = 0; i < 26; i++) {
      const x = 12 + rand() * 936;
      const len = 40 + rand() * 190;
      c.strokeStyle = 'rgba(38,54,32,0.85)';
      c.lineWidth = 2 + rand() * 3;
      c.beginPath();
      c.moveTo(x, 0);
      c.quadraticCurveTo(x + (rand() - 0.5) * 24, len * 0.6, x + (rand() - 0.5) * 40, len);
      c.stroke();
    }
    // big leaves at the crown
    for (let i = 0; i < 30; i++) {
      const x = rand() * 980 - 10;
      const y = rand() * 90;
      const a = Math.PI / 2 + (rand() - 0.5) * 1.1;
      leafShape(c, x, y, 40 + rand() * 54, 13 + rand() * 10, a, i % 3 ? '#31452c' : '#3d5433', 'rgba(130,150,90,0.22)');
    }
    // a few long loose vines
    [[80, 380], [250, 300], [470, 430], [690, 330], [880, 400]].forEach(([x, len], i) => {
      c.strokeStyle = 'rgba(40,56,34,0.9)';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(x, 30);
      c.quadraticCurveTo(x + 20, len * 0.5, x + (i % 2 ? 26 : -22), len);
      c.stroke();
      for (let k = 1; k < 7; k++) {
        const t = k / 7;
        const lx = x + (i % 2 ? 26 : -22) * t + Math.sin(t * 6) * 8;
        const ly = 30 + (len - 30) * t;
        leafShape(c, lx, ly, 16 + rand() * 10, 5, (k % 2 ? 0.9 : -0.9) + 1.2, '#3a5032', 'rgba(140,160,100,0.25)');
      }
    });
  });
}

function art(scene) {
  branchArt(scene);
  airArt(scene);
  heroArt(scene);
  hatchArt(scene);
  rockArt(scene, 'tp-rock-a', 1307, '#7d6242', '#513d29', '#261c13');
  rockArt(scene, 'tp-rock-b', 1319, '#6f5c46', '#463628', '#211811');
  rockArt(scene, 'tp-rock-c', 1327, '#85684a', '#57402b', '#291e14');
  tarArt(scene);
}

/* ---------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene);

  const Y0 = M.top;
  const anchorY = Y0 + (M.portrait ? 120 : 70);
  const R = M.portrait ? 470 : 270;
  const tarStart = anchorY + R + 78 * K + 36;
  const tarRise = M.portrait ? 60 : 40;

  const r = rng(4242);
  const state = {
    mode: 'grip', theta: 0, avel: 0, baseLen: R, coil: 0, coiling: false,
    ax: 480, aimX: 480, px: 480, py: anchorY + R, vx: 0, vy: 0,
    rescues: 0, hearts: 3, burns: 0, time: 0, tarT: 0, tarY: tarStart,
    over: false, inv: 1.2, burnT: 0
  };

  const rockTex = ['tp-rock-a', 'tp-rock-b', 'tp-rock-c'];
  const islands = ISLES.map((isle, i) => {
    const top = anchorY + isle.f * R;
    const sx = (M.portrait ? 0.68 : 0.74) + (i % 3) * 0.04;
    const sy = (M.portrait ? 1.9 : 1.2) * (0.94 + (i % 2) * 0.08);
    const img = scene.add.image(isle.x, top - 88 * sy, rockTex[isle.art])
      .setOrigin(0.5, 0)
      .setScale(sx, sy)
      .setDepth(12);
    return { ...isle, i, top, img };
  });

  if (M.portrait) scene.add.image(0, 0, 'tp-canopy').setOrigin(0, 0).setDepth(6.4).setAlpha(0.96);

  // the branch and its hanging strands
  scene.add.image(0, Y0, 'tp-branch').setOrigin(0, 0).setScale(1, K).setDepth(6);
  [[70, 0.7, 'tp-strand-a'], [258, 0.52, 'tp-strand-b'], [508, 0.8, 'tp-strand-a'], [762, 0.58, 'tp-strand-b'], [900, 0.66, 'tp-strand-a']]
    .forEach(([x, s, key], i) => {
      const img = scene.add.image(x, Y0 + 92 * K, key).setOrigin(0.5, 0).setScale(s * K).setDepth(5.8).setAlpha(0.92);
      scene.tweens.add({
        targets: img, angle: (i % 2 ? -1 : 1) * 2.6, duration: 3200 + i * 520,
        yoyo: true, repeat: -1, ease: 'sine.inOut'
      });
    });

  // the vine
  const rope = scene.add.graphics().setDepth(19);
  const knot = scene.add.image(480, anchorY, 'tp-knot').setDepth(19.6).setScale(0.95 * K);
  const leaves = [0.16, 0.31, 0.47, 0.63, 0.79].map((f, i) => {
    const img = scene.add.image(480, anchorY, 'tp-leaf').setDepth(19.2).setScale(1.05 * K);
    return { f, img, side: i % 2 ? 1 : -1, rot: (i % 2 ? -0.4 : 0.5) + (i - 2) * 0.12 };
  });

  // player
  const player = scene.add.image(state.px, state.py, 'tp-hang').setOrigin(0.5, 0.5).setDepth(20).setScale(K);
  const playerGlow = scene.add.image(state.px, state.py, 'arc-glow').setDepth(19)
    .setScale(0.9 * K).setAlpha(0).setTint(0xffcf7a).setBlendMode(Phaser.BlendModes.ADD);
  const rim = scene.add.image(state.px, state.py, 'arc-glow').setDepth(19.1)
    .setScale(1.15 * K).setAlpha(0.16).setTint(0xffb45e).setBlendMode(Phaser.BlendModes.ADD);
  const coilRing = scene.add.image(state.px, state.py, 'arc-ring').setDepth(19.5)
    .setScale(0.55 * K).setAlpha(0).setTint(0xffd98a).setBlendMode(Phaser.BlendModes.ADD);

  // the tar
  const haze = scene.add.image(0, state.tarY - 272, 'tp-haze').setOrigin(0, 0).setDepth(13.5);
  const tar = scene.add.tileSprite(0, state.tarY + 8, W, M.H - state.tarY, 'tp-tar')
    .setOrigin(0, 0).setDepth(15);
  const sheen = scene.add.rectangle(0, state.tarY + 8, W, 38 * K, 0xffa04a, 0.16)
    .setOrigin(0, 0).setDepth(15.1).setBlendMode(Phaser.BlendModes.ADD);
  const tarGlow = scene.add.rectangle(0, state.tarY, W, 110 * K, 0xffb04a, 0.07)
    .setOrigin(0, 0).setDepth(15.2).setBlendMode(Phaser.BlendModes.ADD);
  const lip = scene.add.graphics().setDepth(15.5);
  const bubble = scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 20, max: 940 }, y: 0,
    speedY: { min: -46, max: -16 }, speedX: { min: -6, max: 6 },
    lifespan: { min: 700, max: 1500 }, scale: { start: 0.5, end: 0.1 },
    alpha: { start: 0.55, end: 0 }, tint: [0xffcf7a, 0xff9d4a], frequency: 420, quantity: 1,
    blendMode: 'ADD'
  }).setDepth(16);
  const splashes = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 80, max: 300 }, angle: { min: 200, max: 340 },
    lifespan: { min: 400, max: 900 }, scale: { start: 0.75, end: 0 },
    tint: [0x6a4a24, 0x3a2614, 0xffc06a], gravityY: 620, emitting: false
  }).setDepth(22);
  const sparkles = scene.add.particles(0, 0, 'arc-spark', {
    speed: { min: 70, max: 280 }, lifespan: 620, scale: { start: 0.55, end: 0 },
    rotate: { min: 0, max: 360 }, tint: 0xffd98a, gravityY: 240, emitting: false
  }).setDepth(23);
  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 30, max: 130 }, angle: { min: 180, max: 360 },
    lifespan: { min: 300, max: 700 }, scale: { start: 0.4, end: 0 },
    tint: 0xd8b07a, alpha: { start: 0.4, end: 0 }, gravityY: 120, emitting: false
  }).setDepth(14);

  const embers = scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 10, max: 950 }, y: 0, speedY: { min: -34, max: -12 },
    speedX: { min: -12, max: 12 }, lifespan: { min: 1400, max: 3000 },
    scale: { start: 0.36, end: 0 }, alpha: { start: 0.6, end: 0 }, tint: [0xffc46a, 0xff8a3a],
    frequency: 380, quantity: 1, blendMode: 'ADD'
  }).setDepth(16.6);

  const pops = [];
  let popT = 0.8;

  function tarSurface() { return state.tarY + Math.sin(state.time * 1.7) * 3; }

  function popRing(x) {
    const img = scene.add.image(x, tarSurface() + 4, 'arc-ring').setDepth(16.4)
      .setScale(0.25 * K).setAlpha(0.55).setTint(0xffc270).setBlendMode(Phaser.BlendModes.ADD);
    pops.push({ img, t: 0, dur: 0.8 });
  }

  function drawRope() {
    rope.clear();
    const grip = state.mode === 'grip' || state.mode === 'burn';
    const handX = state.px - Math.sin(state.theta) * 63 * K;
    const handY = state.py - Math.cos(state.theta) * 63 * K;
    const glow = state.coiling ? 0.5 + 0.4 * Math.sin(state.time * 18) : 0;

    if (grip) {
      const dx = handX - state.ax;
      const dy = handY - anchorY;
      rope.lineStyle(10 * K, 0x241a10, 0.95);
      rope.beginPath(); rope.moveTo(state.ax, anchorY); rope.lineTo(handX, handY); rope.strokePath();
      rope.lineStyle(6 * K, glow > 0 ? 0xe2c07c : 0xa2804a, 1);
      rope.beginPath(); rope.moveTo(state.ax, anchorY); rope.lineTo(handX, handY); rope.strokePath();
      rope.lineStyle(2.2 * K, 0xffe8b8, 0.3 + glow * 0.55);
      rope.beginPath(); rope.moveTo(state.ax, anchorY); rope.lineTo(handX, handY); rope.strokePath();
      // knots along the vine
      for (let i = 1; i < 7; i++) {
        const t = i / 7;
        rope.fillStyle(0x5d4526, 1);
        rope.beginPath();
        rope.arc(state.ax + dx * t, anchorY + dy * t, 2.6 * K, 0, Math.PI * 2);
        rope.fillPath();
      }
      const lx = dx / Math.max(1, Math.hypot(dx, dy));
      const ly = dy / Math.max(1, Math.hypot(dx, dy));
      for (const lf of leaves) {
        const x = state.ax + dx * lf.f;
        const y = anchorY + dy * lf.f;
        const off = lf.side * 13 * K;
        lf.img.setVisible(true);
        lf.img.setPosition(x - ly * off, y + lx * off);
        lf.img.setRotation(Math.atan2(dy, dx) + lf.rot);
        lf.img.setAlpha(0.95);
      }
    } else {
      const sway = Math.sin(state.time * 1.6) * 4;
      const cx = state.ax + sway * 1.6;
      const cy = anchorY + 54 * K;
      const ex = state.ax + sway;
      const ey = anchorY + 30 * K;
      [6, 2.6].forEach((w, pass) => {
        rope.lineStyle(w * K, pass ? 0x8c6a3a : 0x2f2114, pass ? 0.9 : 0.9);
        rope.beginPath();
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          const u = 1 - t;
          const x = u * u * state.ax + 2 * u * t * cx + t * t * ex;
          const y = u * u * anchorY + 2 * u * t * cy + t * t * ey;
          if (i === 0) rope.moveTo(x, y); else rope.lineTo(x, y);
        }
        rope.strokePath();
      });
      leaves.forEach((lf) => lf.img.setVisible(false));
    }
    knot.x = state.ax;
    knot.y = anchorY;
    knot.setAlpha(glow > 0 ? 0.92 + glow * 0.08 : 1);
  }

  function drawLip() {
    const ty = tarSurface();
    lip.clear();
    lip.fillStyle(0x2b1d11, 1);
    lip.beginPath();
    lip.moveTo(0, ty + 12);
    for (let x = 0; x <= W; x += 16) {
      lip.lineTo(x, ty + Math.sin(x * 0.011 + state.time * 1.2) * 5 + Math.sin(x * 0.029 - state.time * 0.8) * 2.4);
    }
    lip.lineTo(W, ty + 54);
    lip.lineTo(0, ty + 54);
    lip.closePath();
    lip.fillPath();

    lip.lineStyle(2.4 * K, 0xffb14e, 0.45);
    lip.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const y = ty + Math.sin(x * 0.011 + state.time * 1.2) * 5 + Math.sin(x * 0.029 - state.time * 0.8) * 2.4 + 3;
      if (x === 0) lip.moveTo(x, y); else lip.lineTo(x, y);
    }
    lip.strokePath();
    lip.lineStyle(1.2 * K, 0xffe4b0, 0.34);
    lip.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const y = ty + Math.sin(x * 0.011 + state.time * 1.2) * 5 + Math.sin(x * 0.029 - state.time * 0.8) * 2.4 - 2.5;
      if (x === 0) lip.moveTo(x, y); else lip.lineTo(x, y);
    }
    lip.strokePath();
  }

  const hatchFresh = [];

  function spawnHatch(isleIndex) {
    if (state.over) return null;
    const taken = new Set(hatchFresh.filter((h) => h.alive).map((h) => h.isle));
    let pool = ISLES.map((_, i) => i).filter((i) => !taken.has(i));
    if (!pool.length) return null;
    let idx = isleIndex;
    if (idx === undefined || idx === null || taken.has(idx)) idx = pool[Math.floor(r() * pool.length)];
    const isle = islands[idx];
    const x = isle.x + (r() - 0.5) * 26;
    const gy = isle.top + 2;
    const cx = x;
    const cy = gy - 34 * K;
    const img = scene.add.image(x, gy + 6, 'tp-hatch').setOrigin(0.5, 1).setDepth(18)
      .setScale((0.63 + r() * 0.06) * K).setAlpha(0);
    const glow = scene.add.image(cx, cy, 'arc-glow').setDepth(17)
      .setScale(0.46 * K).setAlpha(0.2).setTint(0xffc46a).setBlendMode(Phaser.BlendModes.ADD);
    const ring = scene.add.graphics().setDepth(18.5);
    const h = {
      img, glow, ring, x: cx, y: cy, baseY: gy, isle: idx, alive: true,
      urgency: URGENCY, phase: r() * 6.2, pop: 0
    };
    hatchFresh.push(h);
    scene.tweens.add({ targets: img, alpha: 1, y: gy, duration: 420, ease: 'cubic.out' });
    scene.tweens.add({ targets: glow, alpha: 0.3, scale: 0.58 * K, duration: 1300, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    return h;
  }

  function removeHatch(h) {
    h.alive = false;
    h.ring.destroy();
    h.glow.destroy();
    scene.tweens.killTweensOf(h.img);
    scene.tweens.killTweensOf(h.glow);
    scene.tweens.add({
      targets: h.img, y: h.img.y + 26, alpha: 0, scale: h.img.scaleX * 0.6,
      duration: 380, ease: 'cubic.in', onComplete: () => h.img.destroy()
    });
    const idx = hatchFresh.indexOf(h);
    if (idx >= 0) hatchFresh.splice(idx, 1);
  }

  function rescue(h) {
    if (!h.alive || state.over) return;
    removeHatch(h);
    state.rescues++;
    scene.sfx('good');
    scene.sfx('chime');
    scene.popText(h.x, h.y - 26 * K, '+1 rescued', '#ffe9b6');
    scene.burst(h.x, h.y, 0xffd98a, 20, { life: 640, gravity: 240, spin: true });
    sparkles.explode(14, h.x, h.y);
    scene.tweens.killTweensOf(playerGlow);
    playerGlow.setAlpha(0.5).setScale(1.35 * K);
    scene.tweens.add({ targets: playerGlow, alpha: 0, scale: 0.9 * K, duration: 520, ease: 'cubic.out' });
    if (state.rescues >= GOAL) { endRun(true); return; }
    scene.time.delayedCall(900, () => { if (!state.over) spawnHatch(); });
  }

  function sink(h) {
    if (!h.alive) return;
    removeHatch(h);
    scene.sfx('splash');
    popRing(h.x);
    scene.burst(h.x, h.y, 0x8a6a3a, 18, { life: 700, gravity: 500, spin: true, scale: 0.55 });
    scene.popText(h.x, h.y, 'slipped under', '#e8b47a');
    scene.time.delayedCall(1500, () => { if (!state.over) spawnHatch(); });
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    scene.finish(win, {
      score: state.rescues,
      note: win ? 'Every hatchling came off the stones.' : `${state.rescues} hatchling${state.rescues === 1 ? '' : 's'} lifted before the vine went slack`
    });
  }

  function doLaunch() {
    if (state.mode !== 'grip' || state.over) return;
    const len = state.baseLen * (1 - 0.16 * state.coil);
    const mult = 1.05 + 0.5 * state.coil;
    state.vx = len * Math.cos(state.theta) * state.avel * mult;
    state.vy = -len * Math.sin(state.theta) * state.avel * mult - 34;
    state.mode = 'fly';
    state.coil = 0;
    state.coiling = false;
    scene.sfx('whoosh');
    dust.emitParticleAt(state.px, state.py + 22 * K, 8);
    scene.tweens.add({ targets: player, scale: K * 1.06, duration: 110, yoyo: true });
  }

  function cast() {
    if (state.mode !== 'fly' || state.over) return false;
    const dx = state.px - state.ax;
    const dy = state.py - anchorY;
    const d = Math.hypot(dx, dy);
    if (d > R * 1.22 || dy < 70 || Math.abs(Math.atan2(dx, dy)) > 1.3) {
      scene.sfx('tick');
      ropeTwinge();
      return false;
    }
    const th = Math.atan2(dx, dy);
    state.baseLen = clamp(d, R * 0.5, R * 1.22);
    state.theta = th;
    state.avel = (state.vx * Math.cos(th) - state.vy * Math.sin(th)) / state.baseLen;
    state.avel = clamp(state.avel, -3.6, 3.6);
    state.mode = 'grip';
    state.coil = 0;
    state.coiling = false;
    scene.sfx('pick');
    const handX = state.px - Math.sin(th) * 63 * K;
    const handY = state.py - Math.cos(th) * 63 * K;
    scene.burst(handX, handY, 0xffdca0, 8, { life: 420 });
    return true;
  }

  function ropeTwinge() {
    scene.tweens.add({ targets: knot, angle: 8, duration: 70, yoyo: true, repeat: 2 });
  }

  function burn() {
    if (state.over || state.inv > 0 || state.mode === 'burn') return;
    state.hearts--;
    state.burns++;
    state.mode = 'burn';
    state.burnT = 0;
    state.vx = 0;
    state.vy = 0;
    state.coiling = false;
    scene.sfx('splash');
    scene.sfx('hurt');
    scene.shake(320, 0.016);
    scene.cameras.main.flash(190, 120, 56, 16);
    splashes.explode(26, state.px, state.tarY + 6);
    scene.burst(state.px, state.tarY, 0xd8a45a, 20, { life: 760, gravity: 620, spin: true, scale: 0.7 });
    popRing(state.px);
    scene.popText(state.px, state.tarY - 44, 'the tar has you', '#ffab7a');
    if (state.hearts <= 0) {
      scene.time.delayedCall(1050, () => endRun(false));
    } else {
      scene.notice(state.hearts === 1 ? 'One chance left. The tar is rising.' : 'Tar takes a heart. Swing high.', 2000);
    }
  }

  function respawn() {
    state.mode = 'grip';
    state.theta = 0;
    state.avel = 0;
    state.baseLen = R;
    state.coil = 0;
    state.coiling = false;
    state.ax = 480;
    state.aimX = 480;
    state.px = 480;
    state.py = anchorY + R;
    state.vx = 0;
    state.vy = 0;
    state.inv = 1.6;
    player.setAlpha(1);
  }

  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D'
  });
  let spaceDown = false;
  let pointerDown = false;

  function press() {
    if (state.over) return;
    if (state.mode === 'fly') { cast(); return; }
    if (state.mode === 'grip') state.coiling = true;
  }
  function release() {
    if (state.over) return;
    if (state.mode === 'grip' && state.coiling) doLaunch();
  }

  scene.input.keyboard.on('keydown-SPACE', () => {
    if (spaceDown) return;
    spaceDown = true;
    press();
  });
  scene.input.keyboard.on('keyup-SPACE', () => {
    spaceDown = false;
    release();
  });
  scene.input.keyboard.on('keydown-UP', press);
  scene.input.keyboard.on('keyup-UP', release);

  scene.input.on('pointerdown', (p) => {
    pointerDown = true;
    state.aimX = clamp(p.x, 250, 710);
    press();
  });
  scene.input.on('pointerup', () => {
    pointerDown = false;
    release();
  });
  scene.input.on('pointermove', (p) => {
    state.aimX = clamp(p.x, 250, 710);
  });

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'hold to coil the vine' });
  scene.notice('Swing out and lift them off the stones before the bubbles stop.', 2600);
  spawnHatch(1);
  spawnHatch(2);
  spawnHatch(4);
  spawnHatch(0);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    if (state.rescues >= GOAL) { endRun(true); return; }
    state.time += dt;
    state.inv = Math.max(0, state.inv - dt);

    // tar level
    const prog = clamp((state.time * 0.42 + state.rescues * 2.3 - state.burns * 7) / 100, 0, 1);
    state.tarT = prog;
    const target = tarStart - prog * tarRise;
    state.tarY += (target - state.tarY) * Math.min(1, dt * 1.5);

    // anchor travel
    if (state.mode !== 'burn') {
      const left = keys.left.isDown || keys.a.isDown;
      const right = keys.right.isDown || keys.d.isDown;
      if (left || right) state.aimX = clamp(state.aimX + (right - left) * 430 * dt, 250, 710);
      state.ax += (state.aimX - state.ax) * Math.min(1, dt * 7.5);
      state.ax = clamp(state.ax, 250, 710);
    }

    if (state.mode === 'grip') {
      const left = keys.left.isDown || keys.a.isDown;
      const right = keys.right.isDown || keys.d.isDown;
      const steer = (right ? 1 : 0) - (left ? 1 : 0) + clamp((state.aimX - state.ax) * 0.02, -0.6, 0.6);
      const prevLen = state.baseLen * (1 - 0.16 * state.coil);
      state.coil += ((state.coiling ? 1 : 0) - state.coil) * Math.min(1, dt * 6);
      const len = state.baseLen * (1 - 0.16 * state.coil);

      state.avel += steer * 2.9 * dt;
      state.avel += (-2300 / len) * Math.sin(state.theta) * dt;
      state.avel *= Math.exp(-0.13 * dt);
      if (len > 1) state.avel *= prevLen / len;
      state.avel = clamp(state.avel, -3.9, 3.9);
      state.theta += state.avel * dt;

      if (Math.abs(state.theta) > 1.15) {
        state.theta = Math.sign(state.theta) * 1.15;
        state.avel *= -0.24;
      }

      state.px = state.ax + len * Math.sin(state.theta);
      state.py = anchorY + len * Math.cos(state.theta);

      // the screen edges are a wall the vine cannot pass
      if (state.px < 34 || state.px > 926) {
        const clipped = clamp(state.px, 34, 926);
        const th = Math.asin(clamp((clipped - state.ax) / len, -1, 1));
        state.theta = th;
        state.avel *= -0.3;
        state.px = state.ax + len * Math.sin(th);
        state.py = anchorY + len * Math.cos(th);
        dust.emitParticleAt(state.px, state.py, 3);
      }
    } else if (state.mode === 'fly') {
      const left = keys.left.isDown || keys.a.isDown;
      const right = keys.right.isDown || keys.d.isDown;
      state.vx += ((right ? 1 : 0) - (left ? 1 : 0)) * 360 * dt;
      if (pointerDown) state.vx += clamp((state.aimX - state.px) * 1.1, -300, 300) * dt;
      state.vy += 1500 * dt;
      state.vx *= Math.exp(-0.08 * dt);
      state.px += state.vx * dt;
      state.py += state.vy * dt;

      if (state.px < 34) { state.px = 34; state.vx = Math.abs(state.vx) * 0.4; }
      if (state.px > 926) { state.px = 926; state.vx = -Math.abs(state.vx) * 0.4; }
      if (state.py < Y0 + 40 && state.vy < 0) { state.py = Y0 + 40; state.vy = 0; }

      if (state.py + 55 * K > state.tarY) burn();
    } else if (state.mode === 'burn') {
      state.burnT += dt;
      state.py += 64 * dt;
      state.px += state.vx * dt;
      if (Math.random() < dt * 14) splashes.explode(1, state.px + (r() - 0.5) * 30, state.tarY + 4);
      player.setAlpha(Math.max(0, 1 - state.burnT * 0.8));
      if (state.burnT > 1.05) {
        if (state.hearts > 0) respawn();
      }
    }

    // hatchling urgency
    for (const h of hatchFresh.slice()) {
      if (!h.alive) continue;
      h.urgency -= dt;
      h.pop += dt;
      const urgent = h.urgency < 5;
      h.img.y = h.baseY + Math.sin(state.time * 3.1 + h.phase) * 2.6 * K;
      h.img.angle = Math.sin(state.time * 2.4 + h.phase) * (urgent ? 4.5 : 1.6);
      h.glow.x = h.x;
      h.glow.y = h.y;
      if (urgent) h.glow.setAlpha(0.28 + Math.sin(state.time * 9) * 0.14);
      h.ring.clear();
      if (h.urgency < 12) {
        const frac = clamp(h.urgency / URGENCY, 0, 1);
        h.ring.lineStyle(2.8 * K, urgent ? 0xff7a4a : 0xffce6a, urgent ? 0.85 + Math.sin(state.time * 9) * 0.1 : 0.24 + (12 - h.urgency) * 0.035);
        h.ring.beginPath();
        h.ring.arc(h.x, h.y - 2 * K, 30 * K, -Math.PI * 0.62, -Math.PI * 0.62 + Math.PI * 1.74 * frac);
        h.ring.strokePath();
      }
      if (urgent && Math.random() < dt * 2.2) scene.sfx('tick');

      if (h.urgency <= 0) { sink(h); continue; }

      if (state.mode === 'grip' || state.mode === 'fly') {
        const dd = Math.hypot(state.px - h.x, state.py - h.y);
        if (dd < 58 * K) rescue(h);
      }
    }

    // tar bubbles
    popT -= dt;
    if (popT <= 0) {
      popT = 1.4 + r() * 2.2;
      popRing(60 + r() * 840);
      if (r() < 0.45) scene.sfx('tick');
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t += dt;
      const k = p.t / p.dur;
      p.img.setScale((0.25 + k * 1.1) * K);
      p.img.setAlpha(0.55 * (1 - k));
      if (k >= 1) { p.img.destroy(); pops.splice(i, 1); }
    }

    // pose
    const flying = state.mode === 'fly';
    player.setTexture(flying ? 'tp-glide' : 'tp-hang');
    player.setFlipX(flying && state.vx < 0);
    player.x = state.px;
    player.y = state.py;
    if (flying) {
      player.setRotation(clamp(Math.atan2(state.vy, Math.abs(state.vx) || 1) * (state.vx < 0 ? -1 : 1), -0.9, 0.9));
      player.setScale(K * (0.98 + Math.min(0.1, Math.abs(state.vy) / 4000)));
    } else {
      player.setRotation(-state.theta);
      player.setScale(K * (1 - state.coil * 0.05));
    }
    if (state.inv > 0 && state.mode !== 'burn') {
      player.setAlpha(0.72 + Math.sin(state.time * 22) * 0.24);
    } else if (state.mode !== 'burn') {
      player.setAlpha(1);
    }

    playerGlow.x = state.px;
    playerGlow.y = state.py;
    rim.x = state.px;
    rim.y = state.py;
    coilRing.x = state.px;
    coilRing.y = state.py;
    coilRing.setAlpha(state.coiling ? 0.35 + state.coil * 0.5 : 0);
    coilRing.setScale((0.4 + state.coil * 0.5) * K);
    coilRing.rotation += dt * 2.4;

    drawRope();
    drawLip();
    haze.y = state.tarY - 272;
    sheen.y = state.tarY + 8;
    sheen.setAlpha(0.12 + Math.sin(state.time * 1.9) * 0.035);
    tar.y = state.tarY + 8;
    tar.height = Math.max(40, M.H - state.tarY - 8);
    tar.tilePositionY = -state.time * 5;
    tar.tilePositionX = Math.sin(state.time * 0.2) * 12;
    tarGlow.y = state.tarY;
    tarGlow.setAlpha(0.05 + Math.sin(state.time * 1.4) * 0.02 + prog * 0.05);
    bubble.y = state.tarY + 10;
    bubble.setAlpha(0.55 + prog * 0.35);
    embers.y = state.tarY + 6;

    // hurry-up glow when the pit is high
    if (prog > 0.75 && Math.random() < dt * 3) dust.emitParticleAt(r() * 960, state.tarY - 6, 1);

    scene.hud({
      score: state.rescues,
      progress: Math.min(1, state.rescues / GOAL),
      hearts: state.hearts,
      extra: state.coiling ? 'the vine is taut'
        : hatchFresh.some((h) => h.alive && h.urgency < 5) ? 'a bubble is rising'
        : prog > 0.66 ? 'the tar is at the stones' : ''
    });
    scene.audio.setTension(0.14 + prog * 0.5 + (state.hearts === 1 ? 0.16 : 0));
  }

  return {
    update,
    state: () => ({
      rescues: state.rescues, hearts: state.hearts, mode: state.mode,
      theta: Math.round(state.theta * 100) / 100, avel: Math.round(state.avel * 100) / 100,
      x: Math.round(state.px), y: Math.round(state.py),
      anchorX: Math.round(state.ax), tarY: Math.round(state.tarY), tarT: Math.round(state.tarT * 100) / 100,
      over: state.over,
      hatchlings: hatchFresh.filter((h) => h.alive).map((h) => ({
        x: Math.round(h.x), y: Math.round(h.y), isle: h.isle, urgency: Math.round(h.urgency * 10) / 10
      }))
    }),
    setRescues: (v) => { state.rescues = v; },
    setHearts: (v) => { state.hearts = clamp(v, 0, 3); },
    setTar: (v) => { state.tarY = clamp(v, anchorY + R, tarStart); },
    setAnchor: (x) => { state.ax = clamp(x, 250, 710); state.aimX = state.ax; },
    setSwing: (th, av) => {
      state.mode = 'grip'; state.theta = th; state.avel = av;
      state.baseLen = R; state.coil = 0; state.coiling = false;
    },
    setPlayer: (x, y, vx = 0, vy = 0) => {
      state.mode = 'fly'; state.px = x; state.py = y; state.vx = vx; state.vy = vy;
    },
    launch: doLaunch,
    cast,
    placeHatchling: (i) => spawnHatch(i),
    clearHatchlings: () => { hatchFresh.slice().forEach(removeHatch); },
    tarY: () => state.tarY
  };
}

export default { id: 'tar-pit', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
