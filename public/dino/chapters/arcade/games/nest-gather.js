// Nest and Rain — the dawn beach.
// Everything weighs something. The nest shows, in its own rim, what it still
// lacks; the sky keeps its own time and does not negotiate.

import { canvasTex, grain, rng, clamp, lerp, W, MOODS } from '../engine.js';

const STAR = [10, 18, 27];
const KINDS = ['twig', 'fern', 'stone'];
const PAL = MOODS.dawn;

const SAND_TOP = 384;
const WALK_TOP = 400;
const WALK_BOT = 500;
const NEST_X = 480;
const NEST_Y = 484;
const NEST_TEX_W = 320;
const NEST_TEX_H = 170;
const BOWL_X = 160;
const BOWL_Y = 92;
const SAFE_R = 118;
const DROP_R = 96;
const REACH = 96;
const TIDE_BASE = 508;
const TIDE_AMP = 11;
const RAIN_LEN = 3.4;
const WAVE_GAP = [16, 15, 15, 15, 15, 15];
const BANK_BONUS = 2;

const WEIGHT = { twig: 1, fern: 2, stone: 3 };
const CARRY_SPEED = { twig: 218, fern: 172, stone: 128 };
const EMPTY_SPEED = 275;
const LIFT_TIME = { twig: 0.32, fern: 0.56, stone: 0.82 };
const LIFT_TEXT = {
  twig: 'light enough', fern: 'wet shell. heavy', stone: 'a stone. my back'
};
const NEED_BASE = { twig: 3, fern: 2, stone: 1 };
const NEED_CAP = { twig: 6, fern: 5, stone: 4 };

const needFor = (level, kind) => Math.min(NEED_CAP[kind], NEED_BASE[kind] + level);
const walkY = (v) => clamp(v, WALK_TOP, WALK_BOT);

function art(scene) {
  const M = scene.M;
  const sandTop = Math.round(M.Y(SAND_TOP));
  const sandH = Math.max(90, Math.round(M.H - sandTop));
  const wetAt = clamp((M.Y(492) - sandTop) / sandH, 0.2, 0.9);

  canvasTex(scene, 'ng-sand', W, sandH, (c, w, h) => {
    const rand = rng('ng-sand');
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5f5a4b');
    g.addColorStop(0.16, '#8b7154');
    g.addColorStop(0.5, '#a98b64');
    g.addColorStop(wetAt, '#c6a379');
    g.addColorStop(Math.min(1, wetAt + 0.14), '#8a6d4c');
    g.addColorStop(1, '#6b543d');
    c.fillStyle = g; c.fillRect(0, 0, w, h);

    const rake = c.createLinearGradient(0, 0, w, 0);
    rake.addColorStop(0, 'rgba(255,186,116,0.04)');
    rake.addColorStop(0.72, 'rgba(255,206,142,0.15)');
    rake.addColorStop(1, 'rgba(255,178,108,0.05)');
    c.fillStyle = rake; c.fillRect(0, 0, w, h);

    // ripple rows, tighter and brighter as the water gets closer
    for (let i = 0; i < 54; i++) {
      const t = i / 54;
      const y = h * (0.05 + t * 0.95);
      const amp = 2 + t * 7;
      const step = 40 + rand() * 60;
      c.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) {
        c.strokeStyle = pass
          ? `rgba(255,232,196,${0.03 + t * 0.07})`
          : `rgba(48,32,20,${0.05 + t * 0.08})`;
        c.lineWidth = pass ? 1.1 : 1.8 + t * 1.6;
        c.beginPath();
        c.moveTo(-20, y + (pass ? -2 : 0));
        for (let x = -20; x <= w + 20; x += step) {
          c.quadraticCurveTo(x + step * 0.5, y + Math.sin(x * 0.01 + i) * amp + (pass ? -2 : 0), x + step, y + (pass ? -2 : 0));
        }
        c.stroke();
      }
    }

    // wind rows in the dry upper sand
    c.strokeStyle = 'rgba(226,196,150,0.07)';
    for (let i = 0; i < 26; i++) {
      const y = 6 + rand() * h * 0.34;
      c.lineWidth = 1 + rand() * 2;
      c.beginPath();
      c.moveTo(rand() * w, y);
      c.lineTo(rand() * w, y + rand() * 5);
      c.stroke();
    }

    // shells, pebbles, broken twig
    const shell = (x, y, s, a, tone) => {
      c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
      const sg = c.createLinearGradient(-8, -6, 8, 6);
      sg.addColorStop(0, tone);
      sg.addColorStop(1, 'rgba(120,92,64,0.9)');
      c.fillStyle = sg;
      c.beginPath();
      c.moveTo(0, 7);
      c.quadraticCurveTo(-10, 2, -8, -6);
      c.quadraticCurveTo(0, -10, 8, -6);
      c.quadraticCurveTo(10, 2, 0, 7);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,50,34,0.4)'; c.lineWidth = 0.8;
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.moveTo(0, 6); c.lineTo(i * 4, -7); c.stroke();
      }
      c.restore();
    };
    for (let i = 0; i < 26; i++) {
      const y = h * (0.2 + rand() * 0.78);
      shell(12 + rand() * (w - 24), y, 0.5 + (y / h) * 1.1, rand() * 6.28,
        rand() < 0.4 ? '#f4e3c4' : '#e8cfae');
    }
    for (let i = 0; i < 40; i++) {
      const y = h * (0.12 + rand() * 0.86);
      const rx = 1.6 + (y / h) * 5;
      c.fillStyle = `rgba(${90 + rand() * 70},${72 + rand() * 50},${52 + rand() * 40},0.5)`;
      c.beginPath(); c.ellipse(rand() * w, y, rx, rx * 0.62, rand() * 3, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = 'rgba(96,66,40,0.45)';
    for (let i = 0; i < 16; i++) {
      const x = rand() * w, y = h * (0.25 + rand() * 0.7);
      c.lineWidth = 1 + rand() * 2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8 + rand() * 22, y + rand() * 6 - 3); c.stroke();
    }

    // wet sheen just above the wash
    c.fillStyle = 'rgba(255,244,220,0.07)';
    c.fillRect(0, h * wetAt - 12, w, 26);
    for (let i = 0; i < 130; i++) {
      const x = rand() * w;
      const y = h * wetAt + rand() * 22 - 6;
      c.fillStyle = `rgba(255,252,244,${0.1 + rand() * 0.3})`;
      c.beginPath(); c.arc(x, y, 0.7 + rand() * 1.9, 0, Math.PI * 2); c.fill();
    }
    grain(c, w, h, 0.03, 91);
  });

  const seaH = Math.round(M.H - M.Y(TIDE_BASE - TIDE_AMP - 26)) + 40;
  canvasTex(scene, 'ng-sea', W, Math.max(70, seaH), (c, w, h) => {
    const rand = rng('ng-sea');
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#7fb4ac');
    g.addColorStop(0.16, '#4d8b91');
    g.addColorStop(0.5, '#2a6068');
    g.addColorStop(1, '#153c47');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 14);
    for (let x = 0; x <= w; x += 48) c.quadraticCurveTo(x + 24, 8 + Math.sin(x * 0.03) * 6, x + 48, 14);
    c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();

    // dawn glare lying on the water
    const glare = c.createLinearGradient(0, 0, w, 0);
    glare.addColorStop(0, 'rgba(255,196,132,0)');
    glare.addColorStop(0.7, 'rgba(255,214,152,0.2)');
    glare.addColorStop(1, 'rgba(255,180,110,0.05)');
    c.fillStyle = glare; c.fillRect(0, 14, w, h - 14);

    // foam lip along the wash line
    c.lineCap = 'round';
    for (let pass = 0; pass < 3; pass++) {
      c.strokeStyle = `rgba(252,250,240,${0.5 - pass * 0.14})`;
      c.lineWidth = 5 - pass * 1.4;
      c.beginPath();
      for (let x = 0; x <= w; x += 40) {
        const y = 15 + pass * 5 + Math.sin(x * 0.028 + pass) * 3.4;
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
    for (let i = 0; i < 190; i++) {
      const y = 18 + rand() * (h - 22);
      c.fillStyle = `rgba(246,252,248,${0.06 + rand() * 0.3})`;
      c.beginPath(); c.arc(rand() * w, y, 0.8 + rand() * 2.6, 0, Math.PI * 2); c.fill();
    }
    for (let i = 0; i < 12; i++) {
      const y = 30 + rand() * (h - 34);
      c.strokeStyle = 'rgba(10,40,48,0.3)';
      c.lineWidth = 1.6 + rand() * 3;
      c.beginPath();
      c.moveTo(rand() * w, y);
      c.lineTo(rand() * w, y + rand() * 4);
      c.stroke();
    }
    grain(c, w, h, 0.022, 33);
  });

  ['a', 'b', 'lunge'].forEach((pose) => {
    canvasTex(scene, 'ng-builder-' + pose, 176, 128, (c) => {
      const rand = rng(pose === 'a' ? 21 : pose === 'b' ? 44 : 67);
      const s = pose === 'a' ? 1 : pose === 'b' ? -1 : 0;
      const lunge = pose === 'lunge';
      const bodyY = lunge ? 82 : 74;
      const hipF = lunge ? 126 : 116;
      const hipB = lunge ? 70 : 76;

      // tail braced against the sand
      c.lineCap = 'round';
      c.strokeStyle = '#6f5c40';
      c.lineWidth = 17;
      c.beginPath();
      c.moveTo(hipB - 14, bodyY + 4);
      c.quadraticCurveTo(34, bodyY + (lunge ? 22 : 8), lunge ? 8 : 14, bodyY + (lunge ? 30 : -6));
      c.stroke();
      c.strokeStyle = '#8b7452';
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(hipB - 12, bodyY + 2);
      c.quadraticCurveTo(36, bodyY + (lunge ? 20 : 4), lunge ? 10 : 16, bodyY + (lunge ? 28 : -8));
      c.stroke();

      // far legs
      const farLegs = lunge ? [[hipB + 4, bodyY + 14, 52, 118], [hipF - 8, bodyY + 12, 128, 118]]
        : [[hipB - 2, bodyY + 14, hipB - 6 - s * 12, 118], [hipF - 6, bodyY + 12, hipF - 10 - s * 12, 118]];
      farLegs.forEach(([hx, hy, fx, fy]) => {
        c.strokeStyle = '#5c4a33';
        c.lineWidth = 13;
        c.beginPath();
        c.moveTo(hx, hy);
        c.quadraticCurveTo((hx + fx) / 2, (hy + fy) / 2 + 6, fx, fy);
        c.stroke();
        c.fillStyle = '#3f3223';
        c.beginPath(); c.ellipse(fx + 3, fy, 10, 4.6, 0, 0, Math.PI * 2); c.fill();
      });

      // body
      const body = c.createLinearGradient(50, bodyY - 34, 130, bodyY + 30);
      body.addColorStop(0, '#c39c66');
      body.addColorStop(0.48, '#9b7a4e');
      body.addColorStop(1, '#63503a');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(96, bodyY, lunge ? 52 : 47, lunge ? 26 : 31, lunge ? 0.06 : -0.05, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(26,17,10,0.52)';
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = 'rgba(240,214,170,0.3)';
      c.beginPath(); c.ellipse(100, bodyY + 14, 36, 10, 0.02, 0, Math.PI * 2); c.fill();

      // banded hide
      c.strokeStyle = 'rgba(74,54,34,0.4)';
      c.lineWidth = 3.4;
      for (let i = 0; i < 5; i++) {
        const x = 66 + i * 15;
        c.beginPath();
        c.moveTo(x, bodyY - 22 + i);
        c.quadraticCurveTo(x + 4, bodyY - 4, x - 1, bodyY + 20 - i);
        c.stroke();
      }
      c.fillStyle = 'rgba(72,52,34,0.28)';
      for (let i = 0; i < 12; i++) {
        c.beginPath(); c.ellipse(62 + (i * 41) % 76, bodyY - 16 + (i * 29) % 34, 2.4, 1.8, i, 0, Math.PI * 2); c.fill();
      }

      // frill and head
      const hx = lunge ? 150 : 142;
      const hy = lunge ? 78 : 60;
      c.fillStyle = '#a8865a';
      c.beginPath();
      c.moveTo(hx - 22, hy - 6);
      c.quadraticCurveTo(hx - 34, hy - 30, hx - 6, hy - 26);
      c.quadraticCurveTo(hx + 6, hy - 12, hx - 2, hy + 4);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,206,140,0.4)';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(hx - 26, hy - 12); c.quadraticCurveTo(hx - 16, hy - 24, hx - 4, hy - 22); c.stroke();

      c.strokeStyle = '#b08d5f';
      c.lineWidth = 17;
      c.beginPath();
      c.moveTo(hipF + 8, bodyY - 8);
      c.quadraticCurveTo(hx - 16, hy + 16, hx - 8, hy + 4);
      c.stroke();
      c.fillStyle = '#c19a68';
      c.beginPath(); c.ellipse(hx + 6, hy, 21, 15, lunge ? 0.2 : -0.14, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(26,17,10,0.5)';
      c.lineWidth = 2.6;
      c.stroke();

      // beak
      c.fillStyle = '#4a3826';
      c.beginPath();
      c.moveTo(hx + 20, hy - 4);
      c.quadraticCurveTo(hx + 38, hy + 1, hx + 33, hy + 9);
      c.quadraticCurveTo(hx + 24, hy + 9, hx + 18, hy + 5);
      c.closePath(); c.fill();
      c.fillStyle = '#6b533a';
      c.beginPath();
      c.moveTo(hx + 19, hy + 7);
      c.quadraticCurveTo(hx + 32, hy + 10, hx + 28, hy + 15);
      c.quadraticCurveTo(hx + 21, hy + 14, hx + 17, hy + 11);
      c.closePath(); c.fill();

      // eye, tired and watchful
      c.fillStyle = '#fbeec6';
      c.beginPath(); c.arc(hx + 6, hy - 4, 4.8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1d1610';
      c.beginPath(); c.arc(hx + 7, hy - 4, 2.4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#6b533a';
      c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(hx, hy - 10); c.quadraticCurveTo(hx + 8, hy - 13, hx + 14, hy - 10); c.stroke();

      // near legs
      const nearLegs = lunge ? [[hipB + 12, bodyY + 12, 66, 118], [hipF + 6, bodyY + 10, 146, 116]]
        : [[hipB + 8, bodyY + 12, hipB + 12 + s * 14, 118], [hipF + 4, bodyY + 10, hipF + 8 + s * 14, 118]];
      nearLegs.forEach(([hx2, hy2, fx, fy]) => {
        c.strokeStyle = '#a17f55';
        c.lineWidth = 15;
        c.beginPath();
        c.moveTo(hx2, hy2);
        c.quadraticCurveTo((hx2 + fx) / 2 + 4, (hy2 + fy) / 2 + 8, fx, fy);
        c.stroke();
        c.fillStyle = '#4b3a27';
        c.beginPath(); c.ellipse(fx + 4, fy, 11, 5, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#e8d5ab'; c.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          c.beginPath(); c.moveTo(fx + 8, fy + i * 2); c.lineTo(fx + 17, fy + i * 3); c.stroke();
        }
      });

      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(30, 30, 160, 120);
      rim.addColorStop(0, 'rgba(255,214,158,0.3)');
      rim.addColorStop(0.55, 'rgba(255,214,158,0.02)');
      rim.addColorStop(1, 'rgba(120,80,50,0.16)');
      c.fillStyle = rim; c.fillRect(0, 0, 176, 128);
      c.globalCompositeOperation = 'source-over';
      grain(c, 176, 128, 0.035, 11 + rand() * 30);
    });
  });

  const loadArt = (key, draw) => canvasTex(scene, key, 96, 68, (c) => { draw(c); grain(c, 96, 68, 0.03, key.length * 7); });

  loadArt('ng-load-twig', (c) => {
    const rand = rng(301);
    c.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const y = 22 + (i % 4) * 9;
      c.strokeStyle = i % 2 ? '#9a7244' : '#7a5734';
      c.lineWidth = 3.4 + (i % 3);
      c.beginPath();
      c.moveTo(12 + rand() * 8, y + 16);
      c.quadraticCurveTo(46, y - 4, 84 - rand() * 8, y + 4);
      c.stroke();
    }
    c.strokeStyle = '#b58c56';
    c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(30, 52); c.quadraticCurveTo(48, 34, 70, 40); c.stroke();
    c.fillStyle = 'rgba(226,196,144,0.5)';
    c.beginPath(); c.ellipse(58, 26, 10, 3, -0.3, 0, Math.PI * 2); c.fill();
  });

  loadArt('ng-load-fern', (c) => {
    const rand = rng(307);
    c.lineCap = 'round';
    for (let f = 0; f < 3; f++) {
      const a = -0.5 + f * 0.42;
      c.save(); c.translate(18, 58); c.rotate(a);
      c.strokeStyle = '#4f6b42';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(28, -12, 62, -18); c.stroke();
      for (let i = 1; i < 9; i++) {
        const t = i / 9;
        const x = 62 * t, y = -18 * t - Math.sin(t * 3) * 3;
        c.strokeStyle = i % 2 ? '#688a52' : '#405d38';
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(x, y); c.quadraticCurveTo(x + 4, y - 9, x + 12, y - 11);
        c.moveTo(x, y); c.quadraticCurveTo(x + 4, y + 7, x + 12, y + 8);
        c.stroke();
      }
      // shell-heavy: the frond carries its cargo of little shells
      for (let i = 0; i < 4; i++) {
        const x = 14 + i * 13, y = -6 - i * 3;
        c.fillStyle = '#f2e2c2';
        c.beginPath(); c.arc(x, y, 4.4, 0.4, 3.4); c.fill();
        c.strokeStyle = 'rgba(120,92,60,0.55)'; c.lineWidth = 0.9;
        c.beginPath(); c.arc(x, y, 2.4, 0.4, 3.4); c.stroke();
      }
      c.restore();
    }
    c.fillStyle = 'rgba(210,232,180,0.16)';
    c.beginPath(); c.ellipse(44, 34, 30, 12, -0.2, 0, Math.PI * 2); c.fill();
    rand();
  });

  loadArt('ng-load-stone', (c) => {
    const stones = [[30, 46, 17, 12], [58, 44, 15, 11], [44, 28, 19, 13], [68, 30, 11, 8]];
    stones.forEach(([x, y, rx, ry], i) => {
      const g = c.createRadialGradient(x - rx * 0.4, y - ry * 0.6, 1, x, y, rx * 1.3);
      g.addColorStop(0, i % 2 ? '#cfd8dc' : '#b9c6cc');
      g.addColorStop(0.6, '#7f929b');
      g.addColorStop(1, '#455a62');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(x, y, rx, ry, i * 0.3, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(20,32,38,0.55)';
      c.lineWidth = 1.6;
      c.stroke();
      c.strokeStyle = 'rgba(30,46,52,0.35)';
      c.lineWidth = 1;
      c.beginPath(); c.ellipse(x + 1, y + 2, rx * 0.62, ry * 0.5, i * 0.3, 0.6, 2.6); c.stroke();
      c.fillStyle = 'rgba(255,246,224,0.34)';
      c.beginPath(); c.ellipse(x - rx * 0.3, y - ry * 0.5, rx * 0.4, ry * 0.2, i * 0.3, 0, Math.PI * 2); c.fill();
    });
    c.strokeStyle = 'rgba(24,38,44,0.4)';
    c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(44, 56, 34, 6, 0, 0, Math.PI * 2); c.stroke();
  });

  canvasTex(scene, 'ng-nest', NEST_TEX_W, NEST_TEX_H, (c) => {
    const rand = rng(401);
    c.fillStyle = 'rgba(40,28,18,0.34)';
    c.beginPath(); c.ellipse(BOWL_X, NEST_TEX_H - 12, 138, 16, 0, 0, Math.PI * 2); c.fill();

    const mound = c.createLinearGradient(30, 60, 300, 168);
    mound.addColorStop(0, '#a37e56');
    mound.addColorStop(0.42, '#78583a');
    mound.addColorStop(1, '#4c3724');
    c.fillStyle = mound;
    c.beginPath();
    c.moveTo(12, NEST_TEX_H - 6);
    c.quadraticCurveTo(20, 108, 58, 88);
    c.quadraticCurveTo(104, 62, BOWL_X, 58);
    c.quadraticCurveTo(218, 58, 262, 88);
    c.quadraticCurveTo(302, 110, 308, NEST_TEX_H - 6);
    c.closePath(); c.fill();

    // bowl interior — kept light enough that the empty slots still read
    c.fillStyle = '#6f5133';
    c.beginPath(); c.ellipse(BOWL_X, BOWL_Y, 104, 38, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(26,17,10,0.34)';
    c.beginPath(); c.ellipse(BOWL_X, BOWL_Y + 7, 88, 29, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,196,124,0.14)';
    c.beginPath(); c.ellipse(BOWL_X - 22, BOWL_Y - 6, 52, 14, 0, 0, Math.PI * 2); c.fill();

    // woven rim of twigs
    c.lineCap = 'round';
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * Math.PI * 2;
      const x = BOWL_X + Math.cos(a) * 108;
      const y = BOWL_Y + Math.sin(a) * 40;
      c.strokeStyle = i % 3 ? '#9c7749' : '#6d4f30';
      c.lineWidth = 3 + (i % 4) * 0.8;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(a + 1.1) * 16, y + Math.sin(a + 1.1) * 9 - 6,
        x + Math.cos(a + 0.7) * 26, y + Math.sin(a + 0.7) * 12);
      c.stroke();
    }
    c.strokeStyle = 'rgba(232,190,128,0.34)';
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(BOWL_X, BOWL_Y - 4, 110, 40, 0, Math.PI, Math.PI * 2); c.stroke();

    // pebble ring at the foot of the mound
    for (let i = 0; i < 22; i++) {
      const a = Math.PI * (0.06 + 0.88 * (i / 22));
      const x = BOWL_X + Math.cos(a) * 128;
      const y = BOWL_Y + 58 + Math.sin(a) * 16;
      c.fillStyle = i % 2 ? 'rgba(150,150,146,0.6)' : 'rgba(96,104,104,0.6)';
      c.beginPath(); c.ellipse(x, y, 5 + rand() * 3, 3 + rand() * 2, rand(), 0, Math.PI * 2); c.fill();
    }

    // dune grass on the two shoulders of the mound, never across the bowl
    c.strokeStyle = '#6f7a4c';
    c.lineWidth = 2.6;
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : 0;
      const x = side ? 236 + (i * 29) % 66 : 20 + (i * 31) % 66;
      const y = 126 + (i % 4) * 9;
      c.beginPath();
      c.moveTo(x, y + 16);
      c.quadraticCurveTo(x + 5, y - 2, x + (i % 2 ? -11 : 13), y - 16 - (i % 3) * 5);
      c.stroke();
    }
    grain(c, NEST_TEX_W, NEST_TEX_H, 0.035, 51);
  });

  const slotArt = (kind, filled) => {
    const key = `ng-${filled ? 'have' : 'slot'}-${kind}`;
    const size = kind === 'fern' ? [70, 46] : kind === 'twig' ? [64, 42] : [46, 40];
    canvasTex(scene, key, size[0], size[1], (c, w, h) => {
      c.save();
      c.translate(w / 2, h / 2);
      c.lineCap = 'round';
      if (!filled) {
        // what the rim still lacks reads as a hollow pocket with the shape of the load in it
        c.fillStyle = 'rgba(58,40,24,0.5)';
        c.beginPath(); c.ellipse(0, 2, w * 0.47, h * 0.47, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(196,152,100,0.3)';
        c.beginPath(); c.ellipse(0, -1, w * 0.42, h * 0.4, 0, 0, Math.PI * 2); c.fill();
        c.setLineDash([5, 4]);
        c.strokeStyle = 'rgba(255,231,182,0.95)';
        c.lineWidth = 2.3;
        c.beginPath(); c.ellipse(0, 1, w * 0.47, h * 0.47, 0, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        c.lineJoin = 'round';
        c.strokeStyle = 'rgba(255,240,206,0.96)';
        c.fillStyle = 'rgba(255,236,198,0.16)';
        c.lineWidth = 2.5;
        if (kind === 'twig') {
          c.beginPath();
          c.moveTo(-19, 11); c.quadraticCurveTo(-1, -12, 19, -10);
          c.moveTo(-17, 13); c.quadraticCurveTo(2, 13, 20, -7);
          c.stroke();
          c.beginPath(); c.ellipse(0, 1, 20, 10, -0.16, 0, Math.PI * 2); c.fill();
        } else if (kind === 'fern') {
          c.beginPath();
          c.moveTo(-23, 12); c.quadraticCurveTo(-3, 10, 23, -12);
          c.quadraticCurveTo(-1, -2, -23, 12);
          c.stroke(); c.fill();
        } else {
          [[-9, 7, 9, 6], [8, 5, 8, 5], [-1, -6, 10, 6]].forEach(([x, y, rx, ry], i) => {
            c.beginPath(); c.ellipse(x, y, rx, ry, i * 0.2, 0, Math.PI * 2); c.stroke(); c.fill();
          });
        }
        c.restore();
        return;
      }
      if (kind === 'twig') {
        for (let i = 0; i < 5; i++) {
          c.strokeStyle = i % 2 ? '#b0854c' : '#8a6438';
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(-24 + i * 3, 14 - i);
          c.quadraticCurveTo(0, -8 + i * 3, 24 - i * 2, -12 + i * 4);
          c.stroke();
        }
        c.fillStyle = 'rgba(255,214,150,0.34)';
        c.beginPath(); c.ellipse(4, -6, 14, 4, -0.3, 0, Math.PI * 2); c.fill();
      } else if (kind === 'fern') {
        for (let f = 0; f < 3; f++) {
          c.save(); c.rotate(-0.4 + f * 0.4);
          c.strokeStyle = '#5f8248';
          c.lineWidth = 3.4;
          c.beginPath(); c.moveTo(-26, 14); c.quadraticCurveTo(0, 2, 28, -12); c.stroke();
          for (let i = 1; i < 7; i++) {
            const t = i / 7, x = -26 + 54 * t, y = 14 - 26 * t;
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(x, y); c.quadraticCurveTo(x + 3, y - 7, x + 9, y - 8);
            c.moveTo(x, y); c.quadraticCurveTo(x + 3, y + 6, x + 9, y + 6);
            c.stroke();
          }
          c.fillStyle = '#f0e0bd';
          for (let i = 0; i < 3; i++) {
            c.beginPath(); c.arc(-12 + i * 15, 6 - i * 5, 3.4, 0.3, 3.5); c.fill();
          }
          c.restore();
        }
      } else {
        const rows = [[-11, 8, 11, 7], [9, 6, 10, 6], [-2, -7, 12, 8]];
        rows.forEach(([x, y, rx, ry], i) => {
          const g = c.createRadialGradient(x - 3, y - 4, 1, x, y, rx);
          g.addColorStop(0, '#d5dee2');
          g.addColorStop(0.6, '#8496a0');
          g.addColorStop(1, '#465b64');
          c.fillStyle = g;
          c.beginPath(); c.ellipse(x, y, rx, ry, i * 0.2, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(34,46,52,0.55)';
          c.lineWidth = 1.6;
          c.beginPath(); c.ellipse(x, y, rx, ry, i * 0.2, 0, Math.PI * 2); c.stroke();
          c.fillStyle = 'rgba(255,248,226,0.4)';
          c.beginPath(); c.ellipse(x - 3, y - 3, rx * 0.35, ry * 0.22, i * 0.2, 0, Math.PI * 2); c.fill();
        });
      }
      c.restore();
    });
  };
  KINDS.forEach((k) => { slotArt(k, false); slotArt(k, true); });

  ['up', 'down'].forEach((frame) => {
    canvasTex(scene, 'ng-gull-' + frame, 112, 72, (c) => {
      const flap = frame === 'up' ? -16 : 12;
      c.lineCap = 'round';
      c.strokeStyle = '#5b6a74';
      c.lineWidth = 5;
      c.beginPath(); c.moveTo(74, 44); c.lineTo(98, 50); c.stroke();
      const body = c.createLinearGradient(30, 26, 80, 52);
      body.addColorStop(0, '#fbf7ee');
      body.addColorStop(0.7, '#dfe4e4');
      body.addColorStop(1, '#a8b4b8');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(56, 40, 26, 12, -0.06, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f6f3ea';
      c.beginPath(); c.ellipse(28, 34, 12, 9, -0.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8b13c';
      c.beginPath();
      c.moveTo(18, 33); c.quadraticCurveTo(4, 32, 2, 37);
      c.quadraticCurveTo(10, 39, 18, 38); c.closePath(); c.fill();
      c.fillStyle = '#1d2326';
      c.beginPath(); c.arc(28, 31, 2, 0, Math.PI * 2); c.fill();
      const wing = c.createLinearGradient(40, 20, 80, 44 + flap);
      wing.addColorStop(0, 'rgba(250,248,240,0.96)');
      wing.addColorStop(1, 'rgba(122,138,146,0.96)');
      c.fillStyle = wing;
      c.beginPath();
      c.moveTo(50, 36);
      c.quadraticCurveTo(56, 18 + flap, 92, 12 + flap);
      c.quadraticCurveTo(74, 34 + flap * 0.4, 66, 44);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,86,92,0.5)';
      c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(54, 38); c.quadraticCurveTo(66, 26 + flap * 0.7, 86, 16 + flap); c.stroke();
      c.strokeStyle = '#3f4d55';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(48, 50); c.lineTo(44, 60); c.moveTo(58, 50); c.lineTo(58, 60); c.stroke();
      grain(c, 112, 72, 0.03, frame === 'up' ? 13 : 29);
    });
  });

  canvasTex(scene, 'ng-rain', 260, 200, (c) => {
    const rand = rng(607);
    c.lineCap = 'round';
    for (let i = 0; i < 74; i++) {
      const x = rand() * 300 - 20;
      const y = rand() * 200;
      const len = 34 + rand() * 58;
      c.strokeStyle = `rgba(232,246,252,${0.16 + rand() * 0.46})`;
      c.lineWidth = 1 + rand() * 1.8;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - len * 0.24, y + len);
      c.stroke();
    }
  });

  canvasTex(scene, 'ng-tuft', 96, 84, (c) => {
    const rand = rng(711);
    c.lineCap = 'round';
    for (let i = 0; i < 13; i++) {
      const x = 18 + rand() * 60;
      c.strokeStyle = i % 3 ? '#6d7a4a' : '#4d5c3a';
      c.lineWidth = 2 + rand() * 2.4;
      c.beginPath();
      c.moveTo(x, 82);
      c.quadraticCurveTo(x + (rand() - 0.5) * 16, 44, x + (rand() - 0.5) * 44, 8 + rand() * 20);
      c.stroke();
    }
    grain(c, 96, 84, 0.04, 17);
  });

  canvasTex(scene, 'ng-log', 210, 74, (c) => {
    const rand = rng(813);
    const g = c.createLinearGradient(10, 20, 200, 60);
    g.addColorStop(0, '#8d7050');
    g.addColorStop(0.5, '#61492f');
    g.addColorStop(1, '#3d2d1e');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(8, 58);
    c.quadraticCurveTo(20, 26, 74, 20);
    c.quadraticCurveTo(150, 12, 198, 30);
    c.quadraticCurveTo(206, 48, 186, 60);
    c.quadraticCurveTo(100, 72, 8, 58);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,20,14,0.5)';
    c.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) {
      const y = 26 + i * 4;
      c.beginPath(); c.moveTo(20 + rand() * 20, y); c.lineTo(170 + rand() * 20, y + rand() * 4); c.stroke();
    }
    c.fillStyle = 'rgba(255,214,150,0.22)';
    c.beginPath(); c.ellipse(96, 24, 58, 5, -0.05, 0, Math.PI * 2); c.fill();
    grain(c, 210, 74, 0.04, 23);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene);
  const r = rng('ng-dawn-beach');

  const state = {
    delivered: 0, banked: 0, hearts: 3, level: 0, wave: 0,
    waveT: WAVE_GAP[0], rainT: 0, time: 0, over: false, win: false,
    gullT: 9, scareCd: 0,
    taken: { tide: 0, gull: 0 }
  };
  const have = { twig: 0, fern: 0, stone: 0 };
  let weight = 0;
  let lastStep = 0;
  let tideY = TIDE_BASE;
  // qa-only: a loaded machine starves the frame clock, so the probe can scale simulated time
  let rate = 1;
  // qa-only: stop the daylight meter from advancing while a step is about something else
  let frozen = false;
  // a tap that lands out of reach walks first, then finishes the job by itself
  let pending = null;
  const p = {
    x: NEST_X + 96, y: NEST_Y - 44, tx: NEST_X + 96, ty: NEST_Y - 44,
    vx: 0, vy: 0, carry: null, lift: 0, liftKind: null, liftFrom: null,
    step: 0, winded: 0, lungeT: 0, lungeX: 0, lungeY: 0, face: 1, moving: false
  };

  // ---- beach
  scene.add.image(0, M.Y(SAND_TOP), 'ng-sand').setOrigin(0).setDepth(5);
  const sea = scene.add.image(0, M.Y(TIDE_BASE), 'ng-sea').setOrigin(0, 0).setDepth(8);
  const sheen = scene.add.rectangle(0, M.Y(TIDE_BASE - 10), W, 26, 0xffe6c0, 0.06)
    .setOrigin(0, 0.5).setDepth(8.4).setBlendMode(Phaser.BlendModes.ADD);

  for (let i = 0; i < 9; i++) {
    const t = scene.add.image(20 + r() * (W - 40), M.Y(WALK_TOP + r() * 22), 'ng-tuft')
      .setOrigin(0.5, 1).setDepth(10).setScale((0.34 + r() * 0.3) * K).setAlpha(0.72);
    t._ph = r() * 6;
  }
  scene.add.image(88, M.Y(474), 'ng-log').setOrigin(0.5, 1).setDepth(11).setScale(0.62 * K).setAlpha(0.95);
  scene.add.image(902, M.Y(440), 'ng-log').setOrigin(0.5, 1).setDepth(10).setScale(0.44 * K).setAlpha(0.8)
    .setFlipX(true);

  // ---- nest
  const accent = Phaser.Display.Color.HexStringToColor(PAL.accent).color;
  // the landscape beach is short, so the nest keeps a third of the frame, not half of it
  const NEST_K = (M.portrait ? 1 : 0.84) * K;
  const nestGlow = scene.add.image(NEST_X, M.Y(NEST_Y - 92), 'arc-glow').setDepth(11.8)
    .setScale(1.1 * NEST_K).setAlpha(0.16).setTint(accent).setBlendMode(Phaser.BlendModes.ADD);
  scene.add.image(NEST_X, M.Y(NEST_Y), 'ng-nest').setOrigin(0.5, 1).setDepth(12.2).setScale(NEST_K);
  const nestRing = scene.add.image(NEST_X, M.Y(NEST_Y - 78), 'arc-ring').setDepth(12.4)
    .setAlpha(0).setScale(1.5 * NEST_K).setTint(0xffd79a).setBlendMode(Phaser.BlendModes.ADD);

  const NEST_S = NEST_K;
  const slots = [];
  function layoutSlots() {
    slots.forEach((s) => s.img.destroy());
    slots.length = 0;
    KINDS.forEach((kind) => {
      const n = needFor(state.level, kind);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        let px, py, sc;
        if (kind === 'twig') {
          const a = Math.PI * (1.02 + 0.96 * t);
          px = BOWL_X + Math.cos(a) * 112; py = BOWL_Y + Math.sin(a) * 40; sc = 0.8;
        } else if (kind === 'fern') {
          const a = Math.PI * (1.08 + 0.84 * t);
          px = BOWL_X + Math.cos(a) * 76; py = BOWL_Y + Math.sin(a) * 26 + 8; sc = 0.74;
        } else {
          const a = Math.PI * (0.14 + 0.72 * t);
          px = BOWL_X + Math.cos(a) * 54; py = BOWL_Y + 16 + Math.sin(a) * 14; sc = 0.68;
        }
        const img = scene.add.image(
          NEST_X + (px - NEST_TEX_W / 2) * NEST_S,
          M.Y(NEST_Y) - (NEST_TEX_H - py) * NEST_S,
          'ng-slot-' + kind
        ).setDepth(12.35).setScale(sc * K);
        slots.push({ img, kind, i, sc });
      }
    });
    refreshSlots();
  }
  function refreshSlots() {
    slots.forEach((s) => {
      const filled = have[s.kind] > s.i;
      s.img.setTexture(`ng-${filled ? 'have' : 'slot'}-${s.kind}`);
      s.img.setScale((filled ? s.sc * 1.08 : s.sc) * K);
      s.img.setAlpha(filled ? 1 : 0.8);
    });
  }
  layoutSlots();

  // ---- piles
  const PILE_SPOTS = [
    ['twig', 162, 428], ['twig', 818, 468],
    ['fern', 792, 424], ['fern', 198, 486],
    ['stone', 642, 494], ['stone', 332, 496]
  ];
  const piles = PILE_SPOTS.map(([kind, x, y], i) => {
    const img = scene.add.image(x, M.Y(y), 'ng-load-' + kind).setOrigin(0.5, 1)
      .setDepth(11 + (y - WALK_TOP) / 300).setScale((0.9 + (i % 2) * 0.1) * K);
    img.setAlpha(0.98);
    return { kind, x, y, stock: 5, max: 5, refT: 4 + i * 1.4, img };
  });

  const stranded = [];
  const gulls = [];

  // ---- particles
  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 24, max: 110 }, angle: { min: 200, max: 340 },
    lifespan: { min: 260, max: 560 }, scale: { start: 0.44, end: 0 },
    alpha: { start: 0.42, end: 0 }, tint: 0xd8b98c, gravityY: 170, emitting: false
  }).setDepth(15);
  const spray = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 40, max: 150 }, angle: { min: 210, max: 330 },
    lifespan: { min: 300, max: 620 }, scale: { start: 0.5, end: 0 },
    alpha: { start: 0.7, end: 0 }, tint: 0xd8fbff, gravityY: 300, emitting: false
  }).setDepth(15);
  const rainSplash = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 20, max: 90 }, angle: { min: 220, max: 320 },
    lifespan: { min: 160, max: 340 }, scale: { start: 0.34, end: 0 },
    alpha: { start: 0.55, end: 0 }, tint: 0xcfeaf2, gravityY: 420, emitting: false
  }).setDepth(16);

  // ---- player
  const shadow = scene.add.ellipse(p.x, M.Y(p.y), 62 * K, 15 * K, 0x241608, 0.3).setDepth(12.05);
  const player = scene.add.image(p.x, M.Y(p.y), 'ng-builder-a').setOrigin(0.5, 1)
    .setDepth(12.6).setScale(0.7 * K);
  const loadImg = scene.add.image(p.x, M.Y(p.y) - 66 * K, 'ng-load-twig').setOrigin(0.5, 1)
    .setDepth(12.75).setScale(0.62 * K).setVisible(false);
  const sweat = scene.add.image(p.x, M.Y(p.y) - 96 * K, 'arc-dot').setDepth(20).setScale(0.5 * K)
    .setAlpha(0).setTint(0xbfe6ff);

  // ---- weather overlays
  const veil = scene.add.rectangle(0, 0, W, M.H, 0x0a1a24, 0).setOrigin(0).setDepth(28);
  const rainA = scene.add.tileSprite(0, 0, W, M.H, 'ng-rain').setOrigin(0).setDepth(29).setAlpha(0);
  const rainB = scene.add.tileSprite(0, 0, W, M.H, 'ng-rain').setOrigin(0).setDepth(29.1)
    .setAlpha(0).setTileScale(1.4, 1.4).setTilePosition(40, 90);
  const rainC = scene.add.tileSprite(0, 0, W, M.H, 'ng-rain').setOrigin(0).setDepth(30.2)
    .setAlpha(0).setTileScale(0.62, 0.7).setTilePosition(120, 30);

  // ---- helpers
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const nestDist = () => dist(p.x, p.y, NEST_X, NEST_Y - 34);
  const score = () => state.delivered + state.banked;
  const nestDone = () => KINDS.every((k) => have[k] >= needFor(state.level, k));
  const wantsKind = (kind) => have[kind] < needFor(state.level, kind);
  const firstNeed = () => KINDS.find((k) => wantsKind(k)) || 'stone';
  const daylight = () => (state.rainT > 0 ? 0 : clamp(state.waveT / (WAVE_GAP[Math.min(state.wave, WAVE_GAP.length - 1)] || 15), 0, 1));

  function beginLift(kind, strand, pile) {
    if (state.over || p.carry || p.lift > 0) return false;
    const src = strand || pile;
    if (!src) return false;
    if (pile && pile.stock <= 0) return false;
    p.lift = LIFT_TIME[kind] * (strand ? 0.6 : 1);
    p.liftKind = kind;
    p.liftFrom = src;
    p.tx = p.x; p.ty = p.y;
    pending = null;
    scene.sfx('tick');
    return true;
  }

  function completeLift() {
    const kind = p.liftKind;
    const src = p.liftFrom;
    p.liftFrom = null;
    p.liftKind = null;
    if (src && src.stock !== undefined) {
      src.stock = Math.max(0, src.stock - 1);
    } else if (src) {
      const idx = stranded.indexOf(src);
      if (idx >= 0) stranded.splice(idx, 1);
      src.img.destroy();
    }
    p.carry = kind;
    loadImg.setTexture('ng-load-' + kind).setVisible(true);
    scene.sfx('pick');
    scene.popText(p.x, M.Y(p.y) - 108 * K, '+1 ' + kind,
      kind === 'twig' ? '#e8c48a' : kind === 'fern' ? '#bfe0a4' : '#cfe3ee');
    scene.sfx('land');
    dust.emitParticleAt(p.x, M.Y(p.y), kind === 'stone' ? 9 : 5);
    if (kind !== 'twig') scene.notice(LIFT_TEXT[kind], 1400);
  }

  function deliver() {
    if (!p.carry || state.over) return false;
    pending = null;
    const kind = p.carry;
    if (nestDist() > DROP_R + 40) return false;
    if (nestDone()) { scene.notice('the nest is full. the rain will tell us.', 1500); return false; }
    if (!wantsKind(kind)) {
      scene.notice(`the nest has plenty of ${kind}s`, 1600);
      return false;
    }
    have[kind]++;
    state.delivered++;
    p.carry = null;
    loadImg.setVisible(false);
    scene.sfx('good');
    scene.burst(NEST_X, M.Y(NEST_Y - 96), kind === 'stone' ? 0xa9c8d8 : 0xffd79a, 12,
      { life: 520, gravity: 300, scale: 0.5 });
    scene.popText(NEST_X, M.Y(NEST_Y - 130), '+1 load', '#fff0cc');
    refreshSlots();
    if (nestDone()) {
      scene.sfx('chime');
      nestRing.setAlpha(0.5);
      scene.tweens.add({ targets: nestRing, alpha: 0, scale: 1.9 * K, duration: 900, ease: 'sine.out' });
      scene.notice('that is a nest. now we wait for the sky.', 2100);
    }
    return true;
  }

  function setDown() {
    if (!p.carry || state.over) return false;
    pending = null;
    dropAt(p.carry, p.x, p.y);
    p.carry = null;
    loadImg.setVisible(false);
    scene.sfx('land');
    scene.notice('set down. it will not wait for me.', 1500);
    return true;
  }

  function dropAt(kind, x, y) {
    const img = scene.add.image(x, M.Y(y), 'ng-load-' + kind).setOrigin(0.5, 1)
      .setDepth(12.5).setScale(0.6 * K).setAlpha(0.96);
    stranded.push({ kind, x, y: walkY(y), img, wet: 0, taken: false });
    dust.emitParticleAt(x, M.Y(y), 6);
    return img;
  }

  function bank() {
    state.banked += BANK_BONUS;
    state.level++;
    KINDS.forEach((k) => { have[k] = 0; });
    layoutSlots();
    scene.sfx('chime');
    scene.burst(NEST_X, M.Y(NEST_Y - 110), 0xffd77a, 22, { life: 820, gravity: 200, spin: true });
    scene.popText(NEST_X, M.Y(NEST_Y - 156), '+' + BANK_BONUS + ' banked', '#ffe6a8');
    scene.notice(`one nest kept. the next wants ${needFor(state.level, 'twig')} twig, ${needFor(state.level, 'fern')} shell, ${needFor(state.level, 'stone')} stone`, 2600);
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    state.win = win;
    scene.finish(win, {
      score: score(),
      note: win
        ? `${state.delivered} loads carried and ${state.level ? 'the last nest held' : 'the first nest held'}`
        : `${state.delivered} loads in the sand, and the rain found the nest short`
    });
  }

  function wave() {
    state.wave++;
    state.rainT = RAIN_LEN;
    const final = state.wave >= WAVE_GAP.length;
    scene.sfx('boom');
    scene.sfx('splash');
    scene.shake(460, 0.013);
    scene.cameras.main.flash(230, 226, 240, 255);
    const away = nestDist() > SAFE_R;
    if (away && p.carry) {
      const kind = p.carry;
      dropAt(kind, p.x, p.y);
      p.carry = null;
      loadImg.setVisible(false);
      state.hearts--;
      scene.sfx('hurt');
      scene.popText(p.x, M.Y(p.y) - 104 * K, 'a heart, and the load', '#ff9d7a');
      scene.notice(final
        ? 'the last wave takes it out of my hands'
        : 'soaked, and the load is where i stood. go back for it', 2300);
      if (state.hearts <= 0) { endRun(false); return; }
    } else if (away) {
      scene.notice('empty handed, so the rain only chills me', 1800);
    } else if (p.carry) {
      scene.notice('under the nest lip. this one i keep dry', 1700);
    }

    const done = nestDone();
    if (final) {
      if (done) { endRun(true); return; }
      endRun(false);
      return;
    }
    if (done) bank();
    state.waveT = WAVE_GAP[Math.min(state.wave, WAVE_GAP.length - 1)];
  }

  function lungeAt(tx, ty) {
    if (state.over || p.lungeT > 0 || state.scareCd > 0) return false;
    const d = dist(p.x, p.y, tx, ty) || 1;
    p.lungeX = (tx - p.x) / d;
    p.lungeY = (ty - p.y) / d;
    p.lungeT = 0.26;
    state.scareCd = 1.1;
    p.winded = 1.5;
    scene.sfx('whoosh');
    dust.emitParticleAt(p.x, M.Y(p.y), 10);
    let hit = null;
    gulls.forEach((g) => {
      if (g.phase === 'flee') return;
      if (dist(g.x, g.y, tx, ty) < 90 || dist(p.x + p.lungeX * 90, p.y + p.lungeY * 90, g.x, g.y) < 84) hit = g;
    });
    if (hit) {
      hit.phase = 'flee';
      hit.t = 0;
      hit.fleeDir = hit.x < NEST_X ? -1 : 1;
      scene.sfx('bad');
      scene.popText(hit.x, M.Y(hit.y) - 20, 'off you go', '#e8f4ee');
      scene.notice('one more thing to do before the rain', 1600);
    }
    return true;
  }

  function spawnGull(x, y) {
    const img = scene.add.image(x, M.Y(y), 'ng-gull-up').setDepth(24).setScale(0.62 * K);
    const g = {
      img, x, y, phase: 'circle', t: 0, target: null, bob: r() * 6,
      dir: r() < 0.5 ? 1 : -1, scale: 0.62, gone: false
    };
    gulls.push(g);
    return g;
  }
  for (let i = 0; i < 2; i++) spawnGull(220 + i * 500, 300 + i * 26);

  // ---- input
  const keys = scene.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    w: 'W', a: 'A', s: 'S', d: 'D', space: 'SPACE', shift: 'SHIFT', x: 'X'
  });

  function actAt(gx, gy) {
    if (state.over) return;
    let pile = null, pd = REACH;
    piles.forEach((q) => {
      if (q.stock <= 0) return;
      const d = dist(gx, gy, q.x, q.y - 14);
      if (d < pd) { pd = d; pile = q; }
    });
    let load = null, ld = 58;
    stranded.forEach((l) => {
      if (l.taken) return;
      const d = dist(gx, gy, l.x, l.y - 10);
      if (d < ld) { ld = d; load = l; }
    });
    let gull = null, gd = 96;
    gulls.forEach((g) => {
      if (g.phase === 'flee' || g.gone) return;
      const d = dist(gx, gy, g.x, g.y);
      if (d < gd) { gd = d; gull = g; }
    });

    if (gull) { lungeAt(gull.x, gull.y); return; }

    pending = null;
    if (load && !p.carry) {
      if (dist(p.x, p.y, load.x, load.y) < REACH) { beginLift(load.kind, load, null); return; }
      p.tx = load.x; p.ty = walkY(load.y - 6);
      pending = { type: 'load', ref: load };
      return;
    }
    if (pile && !p.carry) {
      if (dist(p.x, p.y, pile.x, pile.y) < REACH) { beginLift(pile.kind, null, pile); return; }
      p.tx = pile.x + 16; p.ty = walkY(pile.y - 8);
      pending = { type: 'pile', ref: pile };
      return;
    }
    if (dist(gx, gy, NEST_X, NEST_Y - 34) < DROP_R + 26) {
      if (p.carry && nestDist() <= DROP_R + 44) { deliver(); return; }
      p.tx = NEST_X; p.ty = NEST_Y - 40;
      if (p.carry) pending = { type: 'deliver', ref: null };
      return;
    }
    if (p.carry && dist(gx, gy, p.x, p.y) < 46 && Math.hypot(p.vx, p.vy) < 26) {
      setDown();
      return;
    }
    p.tx = clamp(gx, 34, W - 34);
    p.ty = walkY(gy);
  }

  scene.input.on('pointerdown', (pt) => actAt(pt.x, scene.uY(pt.y)));
  scene.input.on('pointermove', (pt) => {
    if (state.over || p.lift > 0 || pt.isDown) return;
    p.tx = clamp(pt.x, 34, W - 34);
    p.ty = walkY(scene.uY(pt.y));
  });

  function keyAct() {
    if (p.carry) {
      if (nestDist() <= DROP_R + 44) deliver();
      else setDown();
      return;
    }
    let best = null, bd = REACH;
    piles.forEach((q) => {
      if (q.stock <= 0) return;
      const d = dist(p.x, p.y, q.x, q.y);
      if (d < bd) { bd = d; best = q; }
    });
    let load = null, ld = REACH;
    stranded.forEach((l) => {
      if (l.taken) return;
      const d = dist(p.x, p.y, l.x, l.y);
      if (d < ld) { ld = d; load = l; }
    });
    if (load && (!best || ld < bd)) beginLift(load.kind, load, null);
    else if (best) beginLift(best.kind, null, best);
  }
  scene.input.keyboard.on('keydown-SPACE', keyAct);
  scene.input.keyboard.on('keydown-X', keyAct);
  scene.input.keyboard.on('keydown-SHIFT', () => {
    const g = gulls.filter((q) => q.phase !== 'flee' && !q.gone)
      .sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))[0];
    if (g) lungeAt(g.x, g.y);
  });

  scene.hud({ score: 0, progress: 1, hearts: 3, extra: 'twigs first' });
  scene.notice('the sky is already leaning grey. twig for the floor, shell for the wall, stone to hold it.', 3200);

  // ---- update
  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000) * rate;
    if (state.over) return;
    state.time += dt;
    state.scareCd = Math.max(0, state.scareCd - dt);

    tideY = TIDE_BASE + Math.sin(state.time * 0.32) * TIDE_AMP + Math.sin(state.time * 1.1) * 2.4;
    const tide = tideY;
    sea.setY(M.Y(tide) - 15 * K);
    sheen.setY(M.Y(tide - 14));
    sheen.setAlpha(0.04 + Math.max(0, 0.05 - daylight() * 0.05));

    // daylight and the coming rain
    if (state.rainT > 0) {
      state.rainT -= dt;
      if (state.rainT <= 0) {
        state.rainT = 0;
        scene.sfx('chime');
        scene.notice('it stops. the sand is mine again', 1500);
      }
      if (Math.random() < dt * 26) {
        rainSplash.emitParticleAt(r() * W, M.Y(WALK_TOP + r() * (WALK_BOT - WALK_TOP)), 1);
      }
    } else {
      state.waveT -= frozen ? 0 : dt;
      if (state.waveT <= 0) wave();
      if (state.over) return;
    }

    const raining = state.rainT > 0;
    const near = 1 - daylight();
    veil.setAlpha(lerp(veil.alpha, raining ? 0.34 : near * 0.14, Math.min(1, dt * 2.4)));
    rainA.setAlpha(raining ? 0.52 : 0);
    rainB.setAlpha(raining ? 0.36 : 0);
    rainC.setAlpha(raining ? 0.5 : 0);
    rainA.tilePositionY += dt * 1500;
    rainB.tilePositionY += dt * 2100;
    rainC.tilePositionY += dt * 3100;
    rainA.tilePositionX += dt * 130;
    rainB.tilePositionX += dt * 190;
    rainC.tilePositionX += dt * 260;
    nestGlow.setAlpha(0.14 + Math.sin(time / 900) * 0.03 + (nestDone() ? 0.14 : 0));
    slots.forEach((s, i) => {
      if (have[s.kind] > s.i) return;
      s.img.setAlpha(0.62 + Math.sin(state.time * 2.4 + i * 0.8) * 0.26);
    });

    // lifting
    if (p.lift > 0) {
      p.lift -= dt;
      p.vx *= 0.6; p.vy *= 0.6;
      if (p.lift <= 0) { p.lift = 0; completeLift(); }
    }

    // walking, and what the load does to it
    weight = p.carry ? WEIGHT[p.carry] : 0;
    let speed = p.carry ? CARRY_SPEED[p.carry] : EMPTY_SPEED;
    if (p.winded > 0) { p.winded -= dt; speed *= 0.58; }
    if (raining) speed *= 0.9;
    if (p.lift > 0) speed = 0;

    const turn = 9.4 - weight * 1.5;
    if (p.lungeT > 0) {
      p.lungeT -= dt;
      p.x += p.lungeX * 620 * dt;
      p.y = walkY(p.y + p.lungeY * 620 * dt);
      p.vx = p.lungeX * 620; p.vy = p.lungeY * 620;
    } else {
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      const want = d > 5 ? speed : 0;
      const ux = d > 0.01 ? dx / d : 0;
      const uy = d > 0.01 ? dy / d : 0;
      const ease = Math.min(1, dt * turn);
      p.vx = lerp(p.vx, ux * want, ease);
      p.vy = lerp(p.vy, uy * want, ease);
      p.x = clamp(p.x + p.vx * dt, 30, W - 30);
      p.y = walkY(p.y + p.vy * dt);
    }

    // a queued tap finishes itself once the walk is done
    if (pending && p.lift <= 0 && p.lungeT <= 0) {
      if (pending.type === 'pile') {
        const q = pending.ref;
        if (p.carry || q.stock <= 0 || q.takenOut) pending = null;
        else if (dist(p.x, p.y, q.x, q.y) < REACH) { pending = null; beginLift(q.kind, null, q); }
      } else if (pending.type === 'load') {
        const l = pending.ref;
        if (p.carry || l.taken) pending = null;
        else if (dist(p.x, p.y, l.x, l.y) < REACH) { pending = null; beginLift(l.kind, l, null); }
      } else if (pending.type === 'deliver') {
        if (!p.carry) pending = null;
        else if (nestDist() <= DROP_R + 44) { pending = null; deliver(); }
      }
    }

    const sp = Math.hypot(p.vx, p.vy);
    p.moving = sp > 22;
    if (p.moving && Math.abs(p.vx) > 12) p.face = p.vx < 0 ? -1 : 1;

    // steps, hop and the animation that carries the weight
    const stride = 30 + weight * 9;
    if (p.moving) p.step += (sp * dt) / stride;
    if (p.moving && Math.floor(p.step) !== lastStep) {
      lastStep = Math.floor(p.step);
      if (p.y > tide - 22) spray.emitParticleAt(p.x - p.face * 14 * K, M.Y(p.y), 3);
      else dust.emitParticleAt(p.x - p.face * 16 * K, M.Y(p.y), weight > 1 ? 4 : 2);
      if (weight === 3 && Math.random() < 0.4) scene.sfx('land');
    }
    const hopMax = 7 - weight * 1.7;
    const hop = p.moving ? Math.abs(Math.sin(p.step * Math.PI)) * hopMax : 0;
    const pose = p.lungeT > 0 ? 'lunge' : p.lift > 0 ? 'b'
      : (p.moving && Math.floor(p.step * 2) % 2 ? 'b' : 'a');
    player.setTexture('ng-builder-' + pose);
    player.setFlipX(p.face < 0);
    player.x = p.x;
    player.y = M.Y(p.y) - hop * K;
    player.setScale((0.7 - weight * 0.012) * K, (0.7 + (p.moving ? Math.sin(p.step * Math.PI * 2) * 0.014 : 0) - weight * 0.012) * K);
    player.setAngle((p.moving ? Math.sin(p.step * Math.PI * 2) * 1.6 : 0) + weight * 1.2 * p.face);
    const pDepth = 12 + (p.y - WALK_TOP) / 100 * 1.5;
    player.setDepth(pDepth);
    loadImg.setDepth(pDepth + 0.15);
    shadow.setDepth(pDepth - 0.5);
    shadow.setAlpha(0.3 - hop * 0.02);
    shadow.x = p.x;
    shadow.setSize((62 - weight * 4) * K, 15 * K);

    loadImg.x = p.x - p.face * 4 * K;
    loadImg.y = M.Y(p.y) - (66 - hop * 0.6) * K - Math.sin(time / 320) * 1.6;
    loadImg.setScale((0.62 + weight * 0.02) * K);
    loadImg.setAngle(-p.face * (2 + weight * 1.4) + Math.sin(time / 420) * 1.2);
    sweat.x = p.x + p.face * 26 * K;
    sweat.y = M.Y(p.y) - 96 * K;
    sweat.setAlpha(p.winded > 0 ? 0.5 + Math.sin(time / 120) * 0.3 : 0);

    // piles refill slowly, the beach keeps giving
    piles.forEach((q) => {
      q.refT -= dt;
      if (q.refT <= 0 && q.stock < q.max) {
        q.stock++;
        q.refT = 8 + r() * 5;
      }
      const s = (0.62 + 0.42 * (q.stock / q.max)) * K;
      q.img.setScale(s);
      q.img.setAlpha(q.stock > 0 ? 0.98 : 0.3);
    });

    // the tide takes stranded loads
    for (let i = stranded.length - 1; i >= 0; i--) {
      const l = stranded[i];
      if (l.taken) { stranded.splice(i, 1); continue; }
      if (l.y > tide - 12) {
        l.wet += dt;
        l.img.setTint(0x9fd0e0);
        l.img.setAlpha(0.9 - l.wet * 0.2);
        if (l.wet > 1.4) {
          l.taken = true;
          scene.tweens.add({
            targets: l.img, y: M.Y(l.y) + 26 * K, alpha: 0, scale: 0.2,
            duration: 460, ease: 'cubic.in', onComplete: () => l.img.destroy()
          });
          spray.emitParticleAt(l.x, M.Y(l.y), 12);
          scene.sfx('splash');
          state.taken.tide++;
          scene.notice('the tide took a load. it always takes something', 1900);
          stranded.splice(i, 1);
        }
      } else {
        l.wet = Math.max(0, l.wet - dt * 0.6);
        l.img.clearTint();
        l.img.setAlpha(0.96);
      }
      l.img.y = M.Y(l.y) - 2 * Math.abs(Math.sin(state.time * 1.4 + l.x));
    }

    // gulls
    state.gullT -= dt;
    if (state.gullT <= 0 && stranded.length && gulls.filter((g) => g.phase === 'circle').length) {
      const g = gulls.filter((q) => q.phase === 'circle')[0];
      const l = stranded.filter((s) => !s.taken).sort((a, b) => dist(g.x, g.y, a.x, a.y) - dist(g.x, g.y, b.x, b.y))[0];
      if (g && l) { g.phase = 'approach'; g.target = l; g.t = 0; scene.sfx('tick'); }
      state.gullT = 6 + r() * 5;
    }
    gulls.forEach((g, gi) => {
      g.bob += dt;
      if (g.phase === 'circle') {
        g.x += g.dir * (46 + gi * 12) * dt;
        if (g.x < 60 || g.x > W - 60) g.dir *= -1;
        g.y = 318 + gi * 34 + Math.sin(g.bob * 1.2) * 16;
        g.scale = 0.62;
      } else if (g.phase === 'approach') {
        const t = g.target;
        if (!t || t.taken) { g.phase = 'circle'; g.target = null; return; }
        const dx = t.x - g.x, dy = (t.y - 12) - g.y;
        const d = Math.hypot(dx, dy) || 1;
        g.x += (dx / d) * 150 * dt;
        g.y += (dy / d) * 120 * dt;
        g.dir = dx < 0 ? -1 : 1;
        if (d < 22) { g.phase = 'peck'; g.t = 0; scene.sfx('tick'); }
      } else if (g.phase === 'peck') {
        g.t += dt;
        g.y += Math.sin(g.t * 12) * 6 * dt;
        if (Math.random() < dt * 4) dust.emitParticleAt(g.x, M.Y(g.y + 12), 1);
        if (g.t > 2.4) {
          const t = g.target;
          if (t && !t.taken) {
            t.taken = true;
            g.carrying = t.kind;
            scene.tweens.add({ targets: t.img, alpha: 0, y: M.Y(t.y) - 30 * K, duration: 320, onComplete: () => t.img.destroy() });
            const idx = stranded.indexOf(t);
            if (idx >= 0) stranded.splice(idx, 1);
            scene.sfx('bad');
            scene.shake(180, 0.006);
            state.taken.gull++;
            scene.popText(g.x, M.Y(g.y) - 24, 'the gull has it', '#ff9d7a');
            scene.notice('the gulls have learned exactly what the nest wants', 2100);
          }
          g.phase = 'flee'; g.t = 0; g.fleeDir = g.dir;
        }
      } else if (g.phase === 'flee') {
        g.t += dt;
        g.x += g.fleeDir * 260 * dt;
        g.y -= 130 * dt;
        g.img.setAlpha(Math.max(0, 1 - g.t * 0.42));
        if (g.x < -80 || g.x > W + 80 || g.t > 3.4) {
          g.img.setAlpha(1);
          g.x = g.fleeDir > 0 ? -60 : W + 60;
          g.y = 318 + gi * 34;
          g.phase = 'circle';
          g.carrying = null;
          g.target = null;
          state.gullT = 8 + r() * 5;
        }
      }
      g.img.setTexture(Math.floor(g.bob * (g.phase === 'circle' ? 4 : 8)) % 2 ? 'ng-gull-up' : 'ng-gull-down');
      g.img.x = g.x;
      g.img.y = M.Y(g.y);
      g.img.setFlipX(g.dir < 0);
      g.img.setScale((g.scale + (g.phase === 'approach' ? 0.14 : 0)) * K);
      g.img.setAngle(Math.sin(g.bob * 3) * 4);
    });

    scene.hud({
      score: score(),
      progress: daylight(),
      hearts: state.hearts,
      extra: raining ? 'the rain is on us'
        : p.winded > 0 ? 'winded — breathe'
          : nestDone() ? 'nest is whole — hold for rain'
            : p.lift > 0 ? 'lifting'
              : p.carry ? `carry it home — ${p.carry}`
                : daylight() < 0.22 ? 'rain close'
                  : `the nest wants ${firstNeed()}`
    });
    scene.audio.setTension(clamp(0.12 + (1 - daylight()) * 0.5 + (raining ? 0.25 : 0) + (3 - state.hearts) * 0.08, 0, 1));
  }

  const nestSpec = () => KINDS.reduce((o, k) => { o[k] = needFor(state.level, k); return o; }, {});

  return {
    update,
    state: () => ({
      score: score(), delivered: state.delivered, banked: state.banked, hearts: state.hearts,
      level: state.level, wave: state.wave, finalWave: state.wave >= WAVE_GAP.length - 1,
      daylight: Number(daylight().toFixed(3)), raining: state.rainT > 0,
      carry: p.carry, weight: p.carry ? WEIGHT[p.carry] : 0,
      lift: Number(p.lift.toFixed(2)), queued: pending ? pending.type : null,
      time: Number(state.time.toFixed(2)), rate, frozen,
      speed: Math.round(p.carry ? CARRY_SPEED[p.carry] : EMPTY_SPEED),
      vx: Number(p.vx.toFixed(1)), vy: Number(p.vy.toFixed(1)),
      x: Math.round(p.x), y: Math.round(p.y),
      toNest: Math.round(nestDist()), safe: nestDist() <= SAFE_R,
      winded: p.winded > 0, over: state.over, win: state.win,
      nestNeed: nestSpec(), nestHave: { ...have }, nestFull: nestDone(),
      stranded: stranded.length, tideTaken: state.taken.tide, gullTaken: state.taken.gull,
      tide: Math.round(tideY),
      strands: stranded.map((l) => ({ kind: l.kind, x: Math.round(l.x), y: Math.round(l.y), wet: Number(l.wet.toFixed(1)) })),
      gulls: gulls.map((g) => ({ x: Math.round(g.x), y: Math.round(g.y), phase: g.phase })),
      piles: piles.map((q) => ({ kind: q.kind, stock: q.stock, x: q.x, y: q.y }))
    }),
    setHearts: (v) => { state.hearts = Math.max(0, Math.round(v)); if (state.hearts <= 0) endRun(false); },
    setRate: (v) => { rate = clamp(v, 1, 6); },
    setFrozen: (v) => { frozen = !!v; },
    setDaylight: (v) => {
      const gap = WAVE_GAP[Math.min(state.wave, WAVE_GAP.length - 1)];
      state.waveT = clamp(v, 0, 1) * gap;
    },
    forceWave: () => { if (!state.over) wave(); },
    moveTo: (x, y) => {
      pending = null;
      p.x = clamp(x, 30, W - 30); p.y = walkY(y);
      p.tx = p.x; p.ty = p.y; p.vx = 0; p.vy = 0;
    },
    walkTo: (x, y) => { pending = null; p.tx = clamp(x, 30, W - 30); p.ty = walkY(y); },
    liftKind: (kind) => {
      const pile = piles.filter((q) => q.kind === kind && q.stock > 0)
        .sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))[0];
      if (!pile) return false;
      p.x = pile.x + 20; p.y = pile.y;
      p.tx = p.x; p.ty = p.y; p.vx = 0; p.vy = 0;
      return beginLift(kind, null, pile);
    },
    deliver: () => deliver(),
    setDown: () => setDown(),
    lunge: (x, y) => lungeAt(x, y),
    finishNest: () => {
      let guard = 0;
      while (!nestDone() && guard++ < 40) {
        const k = KINDS.find(wantsKind);
        have[k]++;
        state.delivered++;
      }
      refreshSlots();
      scene.sfx('chime');
      return nestDone();
    },
    addStranded: (kind, x, y) => {
      dropAt(kind, x, y);
      return { x: Math.round(x), y: Math.round(y) };
    },
    clearStranded: () => {
      stranded.forEach((l) => l.img.destroy());
      stranded.length = 0;
      if (pending && pending.type === 'load') pending = null;
    },
    bringGull: (x, y) => {
      const g = gulls[0];
      g.x = x; g.y = y; g.dir = 1; g.t = 0;
      g.img.setAlpha(1);
      const l = stranded.filter((s) => !s.taken)[0] || null;
      g.target = l;
      g.phase = l ? 'approach' : 'circle';
      return { x: Math.round(x), y: Math.round(y), phase: g.phase };
    },
    clear: () => {
      stranded.forEach((l) => l.img.destroy());
      stranded.length = 0;
      pending = null;
      p.lift = 0; p.liftKind = null; p.liftFrom = null;
      if (p.carry) { p.carry = null; loadImg.setVisible(false); }
    }
  };
}

export default {
  id: 'nest-gather',
  stars: STAR,
  backdropOpts: { ground: false },
  create,
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
