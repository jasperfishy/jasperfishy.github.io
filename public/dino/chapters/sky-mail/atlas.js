// Generates every illustration the flight needs at boot, as canvas textures.
// No external art, no placeholders: layered shapes, gradients and texture grain.
import { applyPhotorealTexture } from '../../photoreal-textures.js';

/* The pines and ferns that crowd the ridges and the post stations are drawn as
 * canvas textures once, at boot — so their photographs are fetched the moment
 * this module loads and the drawn fronds below only show if a picture is still
 * arriving. */
const propImg = {};
['pine', 'fern'].forEach((n) => {
  const img = new Image();
  img.src = new URL('../../assets/props/' + n + '.webp', import.meta.url).href;
  img.decode().catch(() => {});
  propImg[n] = img;
});

const TAU = Math.PI * 2;

export const PALETTES = {
  dawn: {
    sky: ['#5f97a6', '#9cc3b5', '#f7d9a3'], sun: '#fff4c8', glow: 'rgba(255,224,160,0.55)',
    far: '#8ba79c', mid: '#668f86', near: '#35645f', dark: '#1d4448', leaf: '#4a8373', fog: '#f3d9b0', haze: '#ffd9a0'
  },
  dusk: {
    sky: ['#474f70', '#b57f84', '#ffcb86'], sun: '#ffe4a8', glow: 'rgba(255,178,120,0.5)',
    far: '#a08388', mid: '#87626c', near: '#4f3d4d', dark: '#332b3d', leaf: '#82636b', fog: '#f6c397', haze: '#ffb375'
  },
  night: {
    sky: ['#0b1630', '#223a5d', '#7c8ba6'], sun: '#f7ecc9', glow: 'rgba(190,214,255,0.32)',
    far: '#546683', mid: '#3d5271', near: '#23374d', dark: '#152538', leaf: '#3a5865', fog: '#8ca0b4', haze: '#a9c2d8'
  }
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function canvasTex(scene, key, w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d');
  c.lineCap = 'round'; c.lineJoin = 'round';
  draw(c);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.addCanvas(key, canvas);
  const flightMatch = key.match(/^ptero-(shadow-)?(\d+)$/);
  if (flightMatch) {
    const frame = Number(flightMatch[2]);
    applyPhotorealTexture(texture, 'ptero', {
      scaleY: frame % 2 ? 0.9 : 1.04,
      darken: flightMatch[1] ? 0.56 : 0
    });
  }
  return canvas;
}

function poly(c, pts, fill, stroke, width = 2) {
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function ellipse(c, x, y, rx, ry, fill, rot = 0) {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
  c.fill();
}

function grain(c, w, h, amount, seed) {
  const rand = rng(seed);
  c.globalAlpha = amount;
  for (let i = 0; i < w * h * 0.02; i++) {
    const v = rand() > 0.5 ? 255 : 0;
    c.fillStyle = `rgb(${v},${v},${v})`;
    c.fillRect(rand() * w, rand() * h, 2, 2);
  }
  c.globalAlpha = 1;
}

// ---- pterosaur -------------------------------------------------------------
function drawPterosaur(c, w, h, flap, shade) {
  const cx = w * 0.55, cy = h * 0.55;
  const body = shade ? '#a4503b' : '#c06448';
  const bodyDark = shade ? '#7d3a2c' : '#9a4a35';
  const bodyLight = shade ? '#c37a58' : '#dd8d64';
  const outline = '#35232a';

  const wing = (sign, ang, dark, sc = 1) => {
    c.save();
    c.translate(cx + sign * 10, cy - 12);
    c.rotate(sign * ang);
    c.scale(sc, sc);

    const grad = c.createLinearGradient(0, 0, -206, -46);
    grad.addColorStop(0, dark ? '#6f2f26' : '#a94734');
    grad.addColorStop(0.55, dark ? '#8c4031' : '#cf6d4c');
    grad.addColorStop(1, dark ? '#a2603f' : '#e3a473');

    // long narrow membrane with a pointed tip, as on a pterosaur
    c.beginPath();
    c.moveTo(4, 4);
    c.bezierCurveTo(-34, -26, -92, -44, -150, -50);
    c.quadraticCurveTo(-186, -46, -226, -29);
    c.quadraticCurveTo(-190, -12, -148, 3);
    c.quadraticCurveTo(-96, 20, -50, 21);
    c.quadraticCurveTo(-22, 20, -8, 11);
    c.closePath();
    c.fillStyle = grad;
    c.fill();
    c.strokeStyle = outline;
    c.lineWidth = 2.4;
    c.stroke();

    c.strokeStyle = dark ? 'rgba(52,22,20,0.8)' : 'rgba(92,38,30,0.72)';
    c.lineWidth = 2;
    [[-219, -27], [-176, -10], [-134, 5], [-88, 16], [-44, 21]].forEach(([x, y]) => {
      c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(x * 0.46, y * 0.4, x, y); c.stroke();
    });
    c.lineWidth = 1.2;
    c.strokeStyle = dark ? 'rgba(210,140,100,0.25)' : 'rgba(255,204,160,0.3)';
    c.beginPath(); c.moveTo(-30, 14); c.quadraticCurveTo(-124, 0, -206, -25); c.stroke();

    c.strokeStyle = outline;
    c.lineWidth = 5;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-58, -34, -150, -50); c.quadraticCurveTo(-188, -46, -224, -30); c.stroke();
    c.lineWidth = 1.6;
    c.strokeStyle = dark ? '#b06c48' : '#f0bc8f';
    c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(-58, -32, -148, -47); c.quadraticCurveTo(-186, -43, -220, -29); c.stroke();
    c.fillStyle = '#f2d9b2';
    c.beginPath(); c.arc(-150, -48, 3.4, 0, TAU); c.fill();

    // wrist claw at the leading tip
    c.strokeStyle = outline; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-221, -32); c.quadraticCurveTo(-232, -41, -238, -32); c.stroke();
    c.restore();
  };

  wing(1, flap * 0.62 + 0.30, true, 0.84);

  poly(c, [[cx - 42, cy + 4], [cx - 108, cy + 2], [cx - 100, cy + 12], [cx - 40, cy + 14]], bodyDark, outline, 2);

  c.save();
  c.translate(cx, cy);
  c.rotate(-0.06);
  ellipse(c, 0, 0, 50, 22, body);
  ellipse(c, 5, 8, 38, 12, bodyLight);
  c.strokeStyle = '#8f3b33'; c.lineWidth = 7;
  c.beginPath(); c.moveTo(-26, -16); c.lineTo(18, 12); c.stroke();
  c.strokeStyle = '#c95a44'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-26, -16); c.lineTo(18, 12); c.stroke();
  c.fillStyle = '#f0c17a';
  c.beginPath(); c.arc(16, 11, 3.2, 0, TAU); c.fill();
  c.restore();

  c.strokeStyle = outline;
  c.fillStyle = body;
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(cx + 30, cy - 8);
  c.quadraticCurveTo(cx + 66, cy - 30, cx + 84, cy - 34);
  c.quadraticCurveTo(cx + 98, cy - 37, cx + 104, cy - 26);
  c.quadraticCurveTo(cx + 88, cy - 18, cx + 76, cy - 10);
  c.quadraticCurveTo(cx + 60, cy - 1, cx + 34, cy + 4);
  c.closePath();
  c.fill(); c.stroke();

  poly(c, [[cx + 100, cy - 31], [cx + 152, cy - 17], [cx + 101, cy - 22]], '#e2b174', outline, 2);
  c.strokeStyle = 'rgba(90,54,30,0.6)'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(cx + 104, cy - 26); c.lineTo(cx + 146, cy - 19); c.stroke();

  c.beginPath();
  c.moveTo(cx + 82, cy - 34);
  c.quadraticCurveTo(cx + 66, cy - 62, cx + 26, cy - 58);
  c.quadraticCurveTo(cx + 46, cy - 44, cx + 58, cy - 26);
  c.closePath();
  c.fillStyle = '#d87650'; c.fill();
  c.strokeStyle = outline; c.lineWidth = 2.2; c.stroke();

  ellipse(c, cx + 92, cy - 29, 4.6, 4.6, '#2a2026');
  ellipse(c, cx + 93, cy - 30.6, 1.6, 1.6, '#fff6df');

  wing(-1, -flap * 1.1, false);

  c.strokeStyle = outline; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(cx - 6, cy + 19); c.quadraticCurveTo(cx - 14, cy + 32, cx - 28, cy + 34); c.stroke();
  c.beginPath(); c.moveTo(cx + 10, cy + 20); c.quadraticCurveTo(cx + 4, cy + 33, cx - 12, cy + 36); c.stroke();
}

// ---- rock / ridge helpers --------------------------------------------------
function ridgeBand(c, w, h, base, amp, color, rand, detail) {
  const pts = [[0, h]];
  const step = 60;
  let y = base;
  for (let x = 0; x <= w; x += step) {
    y = base + Math.sin(x * 0.006 + rand() * 0.4) * amp * 0.6 + (rand() - 0.5) * amp;
    pts.push([x, Math.max(20, y)]);
  }
  pts.push([w, h]);
  poly(c, pts, color);
  if (detail) {
    c.strokeStyle = 'rgba(20,40,40,0.18)';
    c.lineWidth = 1.5;
    for (let x = 30; x < w; x += 38) {
      const yy = base + Math.sin(x * 0.006) * amp * 0.6;
      c.beginPath(); c.moveTo(x, yy + 20); c.lineTo(x + 14, h); c.stroke();
    }
  }
}

function pine(c, x, y, h, color, lean = 0) {
  const img = propImg.pine;
  if (img.complete && img.naturalWidth) {
    const w = h * (img.naturalWidth / img.naturalHeight);
    c.drawImage(img, x - w / 2, y - h, w, h);
    return;
  }
  c.strokeStyle = color; c.fillStyle = color;
  c.lineWidth = Math.max(1.5, h * 0.02);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + lean * h, y - h * 0.55); c.stroke();
  for (let i = 0; i < 4; i++) {
    const baseY = y - h * (0.18 + i * 0.2);
    const half = h * 0.2 * (1 - i * 0.16);
    const apex = baseY - h * 0.34;
    c.beginPath();
    c.moveTo(x + lean * h * 0.4 - half, baseY);
    c.lineTo(x + lean * h * 0.7, apex);
    c.lineTo(x + lean * h * 0.4 + half, baseY);
    c.closePath();
    c.fill();
  }
}

function fern(c, x, y, s, color) {
  const img = propImg.fern;
  if (img.complete && img.naturalWidth) {
    const w = s * 96, h = w * (img.naturalHeight / img.naturalWidth);
    c.drawImage(img, x - w / 2, y - h, w, h);
    return;
  }
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let k = -2; k <= 2; k++) {
    c.save(); c.rotate(k * 0.38);
    c.strokeStyle = color; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -28, 4, -54); c.stroke();
    for (let j = 0; j < 7; j++) {
      const yy = -10 - j * 6, ww = 11 - j * 0.9;
      c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(1, yy); c.quadraticCurveTo(-ww, yy - 2, -ww - 1, yy - 8); c.stroke();
      c.beginPath(); c.moveTo(1, yy); c.quadraticCurveTo(ww, yy - 3, ww + 1, yy - 9); c.stroke();
    }
    c.restore();
  }
  c.restore();
}

function makeRidge(scene, key, pal, seed, opts = {}) {
  const w = 1400, h = 460;
  canvasTex(scene, key, w, h, (c) => {
    const rand = rng(seed);
    const base = opts.base ?? 300;
    const amp = opts.amp ?? 70;
    const ys = [];
    const step = 36;
    for (let x = 0; x <= w + step; x += step) {
      ys.push(base + (rand() - 0.5) * amp + Math.sin(x * 0.0042 + seed) * amp * 0.55 + Math.sin(x * 0.011 + seed * 2) * amp * 0.18);
    }
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, ys[0]);
    for (let i = 1; i < ys.length - 1; i++) {
      const x = i * step;
      c.quadraticCurveTo(x - step * 0.5, ys[i - 1], x, ys[i]);
    }
    c.lineTo(w, ys[ys.length - 1]);
    c.lineTo(w, h);
    c.closePath();
    c.fillStyle = opts.color;
    c.fill();
    c.save();
    c.clip();
    c.strokeStyle = 'rgba(12,30,34,0.16)';
    for (let i = 0; i < 9; i++) {
      c.lineWidth = 1 + rand() * 2;
      c.beginPath();
      const y0 = base + 30 + rand() * (h - base - 40);
      for (let x = 0; x <= w; x += 80) c.lineTo(x, y0 + Math.sin(x * 0.01 + i) * 8 + rand() * 5);
      c.stroke();
    }
    c.restore();
    if (opts.detail) {
      for (let i = 0; i < 22; i++) {
        const x = rand() * w;
        pine(c, x, h, 40 + rand() * 80, opts.leaf, (rand() - 0.5) * 0.14);
      }
      for (let i = 0; i < 24; i++) fern(c, rand() * w, h, 0.7 + rand() * 0.7, opts.leaf);
    }
    grain(c, w, h, 0.04, seed + 7);
  });
}

// ---- clouds ----------------------------------------------------------------
function makeCloud(scene, key, tint, seed, scale = 1) {
  // One canvas size for every cloud layer: the edge fades must survive whole,
  // otherwise a tile sprite crops them into a hard horizon line.
  const w = 420, h = 260;
  canvasTex(scene, key, w, h, (c) => {
    const rand = rng(seed);
    c.save();
    c.translate(w / 2, h * 0.48);
    c.scale(scale, scale);
    c.translate(-w / 2, -h * 0.48);
    for (let i = 0; i < 14; i++) {
      const x = w * (0.18 + rand() * 0.64);
      const y = h * (0.36 + rand() * 0.22);
      const r = w * (0.09 + rand() * 0.12);
      const g = c.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, tint.hi);
      g.addColorStop(0.6, tint.mid);
      g.addColorStop(1, tint.lo);
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    c.globalAlpha = 0.45;
    for (let i = 0; i < 6; i++) {
      const x = w * (0.25 + rand() * 0.5);
      const y = h * (0.32 + rand() * 0.12);
      const r = w * (0.06 + rand() * 0.05);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, tint.lit);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'destination-out';
    const top = c.createLinearGradient(0, 0, 0, h * 0.32);
    top.addColorStop(0, 'rgba(0,0,0,1)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = top; c.fillRect(0, 0, w, h * 0.32);
    const bottom = c.createLinearGradient(0, h * 0.62, 0, h);
    bottom.addColorStop(0, 'rgba(0,0,0,0)');
    bottom.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = bottom; c.fillRect(0, h * 0.62, w, h);
    const left = c.createLinearGradient(0, 0, w * 0.14, 0);
    left.addColorStop(0, 'rgba(0,0,0,1)');
    left.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = left; c.fillRect(0, 0, w * 0.14, h);
    const right = c.createLinearGradient(w * 0.86, 0, w, 0);
    right.addColorStop(0, 'rgba(0,0,0,0)');
    right.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = right; c.fillRect(w * 0.86, 0, w * 0.14, h);
    c.globalCompositeOperation = 'source-over';
  });
}

// ---- post station ----------------------------------------------------------
function drawPost(c, w, h, variant, pal) {
  const rand = rng(90 + variant * 17);
  const cliffTop = 258;
  const cliff = [[0, h], [0, cliffTop + 40], [w * 0.14, cliffTop + 16], [w * 0.3, cliffTop + 30],
    [w * 0.5, cliffTop], [w * 0.7, cliffTop + 24], [w * 0.88, cliffTop + 8], [w, cliffTop + 34], [w, h]];
  poly(c, cliff, pal.near);
  c.globalAlpha = 0.5;
  poly(c, [[w * 0.5, cliffTop], [w * 0.7, cliffTop + 24], [w * 0.68, h], [w * 0.42, h], [w * 0.44, cliffTop + 22]],
    pal.mid, null);
  c.globalAlpha = 1;
  c.strokeStyle = 'rgba(10,26,30,0.22)';
  for (let i = 0; i < 12; i++) {
    c.lineWidth = 1 + rand() * 2;
    c.beginPath();
    const y0 = cliffTop + 26 + rand() * (h - cliffTop - 30);
    c.moveTo(0, y0); c.bezierCurveTo(w * 0.3, y0 + 12, w * 0.6, y0 - 16, w, y0 + 6); c.stroke();
  }
  for (let i = 0; i < 12; i++) fern(c, w * (0.05 + rand() * 0.9), cliffTop + 10 + rand() * 20, 0.45 + rand() * 0.5, pal.leaf);

  const tx = w * (variant === 1 ? 0.42 : 0.52);
  const topY = 150;
  const hw = 88, hh = 64;

  c.strokeStyle = '#4a322a';
  c.lineWidth = 7;
  c.beginPath(); c.moveTo(tx - 27, cliffTop + 12); c.lineTo(tx - 17, topY); c.stroke();
  c.beginPath(); c.moveTo(tx + 27, cliffTop + 12); c.lineTo(tx + 17, topY); c.stroke();
  c.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const y = cliffTop - i * 27;
    c.beginPath(); c.moveTo(tx - 25 + i, y); c.lineTo(tx + 25 - i, y); c.stroke();
  }

  c.fillStyle = '#7a563c';
  c.fillRect(tx - hw / 2, topY - hh, hw, hh);
  c.fillStyle = '#8f6847';
  c.fillRect(tx - hw / 2 + 6, topY - hh + 8, hw - 12, hh - 8);

  poly(c, [[tx - hw / 2 - 16, topY - hh + 4], [tx, topY - hh - 34], [tx + hw / 2 + 16, topY - hh + 4]],
    '#5b3f34', '#33231f', 2.5);
  c.strokeStyle = 'rgba(30,18,16,0.4)'; c.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.moveTo(tx - 44 + i * 8, topY - hh + 2 - i * 6); c.lineTo(tx + 44 - i * 8, topY - hh + 2 - i * 6); c.stroke();
  }

  c.fillStyle = '#3c2a24';
  c.beginPath(); c.roundRect(tx - 14, topY - 38, 28, 38, [14, 14, 0, 0]); c.fill();
  c.fillStyle = '#e0b679';
  c.beginPath(); c.arc(tx + 7, topY - 19, 2.2, 0, TAU); c.fill();

  c.fillStyle = '#ffcf7d';
  c.fillRect(tx + 22, topY - 54, 15, 15);
  c.strokeStyle = '#4a322a'; c.lineWidth = 2; c.strokeRect(tx + 22, topY - 54, 15, 15);

  c.strokeStyle = '#4a322a'; c.lineWidth = 6;
  c.beginPath(); c.moveTo(tx - hw / 2, topY - 30); c.lineTo(tx - hw / 2 - 58, topY - 30); c.stroke();
  c.fillStyle = '#a4774d';
  c.fillRect(tx - hw / 2 - 76, topY - 42, 30, 22);
  c.fillStyle = '#33231f';
  c.fillRect(tx - hw / 2 - 68, topY - 36, 16, 4);

  c.strokeStyle = '#4a322a'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(tx + 38, topY - hh - 14); c.lineTo(tx + 38, topY - hh - 72); c.stroke();
  const wave = Math.sin(variant * 2) * 5;
  poly(c, [[tx + 38, topY - hh - 72], [tx + 100, topY - hh - 64 + wave], [tx + 80, topY - hh - 50],
    [tx + 38, topY - hh - 42]], '#d9784d', '#7a3a28', 2);

  const lx = tx - hw / 2 - 66, ly = topY - 8;
  c.strokeStyle = '#4a322a'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(lx, topY - 30); c.lineTo(lx, ly - 6); c.stroke();
  c.fillStyle = '#5b3f34';
  c.beginPath(); c.roundRect(lx - 8, ly - 6, 16, 26, 4); c.fill();
  c.fillStyle = '#ffd98d';
  c.fillRect(lx - 5, ly - 2, 10, 16);
  c.strokeStyle = 'rgba(90,60,30,0.5)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(lx, ly - 2); c.lineTo(lx, ly + 14); c.stroke();

  c.strokeStyle = '#6d4c35'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(tx + hw / 2 - 4, topY); c.lineTo(tx + hw / 2 + 22, cliffTop + 18); c.stroke();
  c.beginPath(); c.moveTo(tx + hw / 2 + 10, topY); c.lineTo(tx + hw / 2 + 38, cliffTop + 18); c.stroke();
  c.lineWidth = 1.4;
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    const x1 = tx + hw / 2 - 4 + 26 * t, x2 = tx + hw / 2 + 10 + 28 * t;
    const y = topY + (cliffTop + 18 - topY) * t;
    c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.stroke();
  }

  grain(c, w, h, 0.035, 11 + variant);
}

// ---- floating island -------------------------------------------------------
function makeSkyIsland(scene, key) {
  canvasTex(scene, key, 340, 470, (c) => {
    const rand = rng(613);
    const rock = () => {
      c.beginPath();
      c.moveTo(24, 96);
      c.quadraticCurveTo(50, 106, 70, 130);
      c.quadraticCurveTo(88, 196, 106, 306);
      c.quadraticCurveTo(126, 402, 152, 462);
      c.quadraticCurveTo(178, 388, 198, 344);
      c.quadraticCurveTo(222, 236, 240, 158);
      c.quadraticCurveTo(268, 116, 288, 98);
      c.closePath();
    };

    const body = c.createLinearGradient(24, 100, 300, 460);
    body.addColorStop(0, '#4d6b66');
    body.addColorStop(0.5, '#3d5858');
    body.addColorStop(1, '#2b4143');
    rock();
    c.fillStyle = body;
    c.fill();

    c.save();
    rock();
    c.clip();
    c.fillStyle = 'rgba(13,30,34,0.42)';
    c.beginPath();
    c.moveTo(176, 70);
    c.lineTo(320, 60);
    c.lineTo(320, 470);
    c.lineTo(152, 470);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(12,30,32,0.4)';
    for (let i = 0; i < 10; i++) {
      const y = 126 + i * 30;
      c.lineWidth = 1 + rand() * 2;
      c.beginPath();
      c.moveTo(40, y);
      c.quadraticCurveTo(150, y - 14 + rand() * 12, 280, y + 12);
      c.stroke();
    }
    c.strokeStyle = 'rgba(166,198,160,0.2)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 7; i++) {
      const x = 90 + rand() * 150;
      c.beginPath();
      c.moveTo(x, 110 + rand() * 100);
      c.lineTo(x - 14 + rand() * 28, 300 + rand() * 130);
      c.stroke();
    }
    c.restore();

    rock();
    c.strokeStyle = '#20383a';
    c.lineWidth = 2.6;
    c.stroke();
    c.strokeStyle = 'rgba(178,206,172,0.3)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(34, 104);
    c.quadraticCurveTo(90, 214, 146, 434);
    c.stroke();

    ellipse(c, 160, 86, 138, 32, '#46795f');
    ellipse(c, 148, 80, 108, 23, '#5f9877');
    ellipse(c, 116, 77, 42, 12, '#6ea585');

    c.strokeStyle = '#38604f';
    c.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const x = 60 + rand() * 200;
      const len = 18 + rand() * 58;
      c.beginPath();
      c.moveTo(x, 100);
      c.quadraticCurveTo(x - 8 + rand() * 16, 100 + len * 0.6, x + rand() * 10 - 5, 100 + len);
      c.stroke();
    }
    pine(c, 100, 86, 54, '#2f5b4b', -0.1);
    pine(c, 196, 84, 42, '#2f5b4b', 0.08);
    fern(c, 144, 90, 0.75, '#3c6f58');
    fern(c, 240, 88, 0.62, '#3c6f58');
    grain(c, 340, 470, 0.03, 613);
  });
}

// ---- export ----------------------------------------------------------------
export function makeAtlas(scene, stage = {}) {
  const skyHeight = stage.H || 540;
  // pterosaur flap frames
  const frames = 8;
  for (let i = 0; i < frames; i++) {
    const flap = Math.sin((i / frames) * TAU) * 0.52;
    canvasTex(scene, `ptero-${i}`, 440, 260, (c) => drawPterosaur(c, 440, 260, flap, false));
    canvasTex(scene, `ptero-shadow-${i}`, 440, 260, (c) => drawPterosaur(c, 440, 260, flap, true));
  }
  // enemy: storm heron? a rival flier silhouette (small, fast)
  canvasTex(scene, 'rival', 180, 120, (c) => {
    c.fillStyle = '#243743';
    c.beginPath();
    c.moveTo(20, 62); c.quadraticCurveTo(70, 30, 118, 44); c.quadraticCurveTo(146, 52, 160, 44);
    c.quadraticCurveTo(140, 62, 112, 66); c.quadraticCurveTo(66, 78, 20, 62);
    c.fill();
    c.beginPath(); c.moveTo(74, 50); c.quadraticCurveTo(46, 12, 10, 22);
    c.quadraticCurveTo(44, 36, 62, 58); c.fill();
    c.beginPath(); c.moveTo(80, 54); c.quadraticCurveTo(70, 92, 36, 108);
    c.quadraticCurveTo(66, 84, 66, 60); c.fill();
    c.fillStyle = '#f5d9a4'; c.beginPath(); c.arc(150, 48, 2.4, 0, TAU); c.fill();
  });

  // envelope
  canvasTex(scene, 'letter', 76, 52, (c) => {
    c.save(); c.translate(38, 26); c.rotate(-0.04);
    c.shadowColor = 'rgba(20,30,40,0.35)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    c.fillStyle = '#f7e8c8';
    c.beginPath(); c.roundRect(-32, -19, 64, 40, 3); c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = '#c9a877'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-32, -19); c.lineTo(0, 3); c.lineTo(32, -19); c.stroke();
    c.beginPath(); c.moveTo(-32, 21); c.lineTo(-6, 0); c.stroke();
    c.beginPath(); c.moveTo(32, 21); c.lineTo(6, 0); c.stroke();
    // wax seal with wing mark
    c.fillStyle = '#b8473a';
    c.beginPath(); c.arc(0, 15, 8.5, 0, TAU); c.fill();
    c.strokeStyle = '#7e2c26'; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = '#f1c9a8'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-4, 16); c.quadraticCurveTo(0, 10, 4, 16); c.stroke();
    c.restore();
  });

  // wind gate
  canvasTex(scene, 'gate', 260, 260, (c) => {
    const halo = c.createRadialGradient(130, 130, 48, 130, 130, 128);
    halo.addColorStop(0, 'rgba(255,240,190,0)');
    halo.addColorStop(0.6, 'rgba(255,238,187,0.05)');
    halo.addColorStop(0.82, 'rgba(255,232,168,0.22)');
    halo.addColorStop(1, 'rgba(255,226,150,0)');
    c.fillStyle = halo;
    c.beginPath(); c.arc(130, 130, 128, 0, TAU); c.fill();

    // faint complete ring so the gate reads at distance
    c.strokeStyle = 'rgba(255,243,205,0.26)';
    c.lineWidth = 2;
    c.beginPath(); c.arc(130, 130, 96, 0, TAU); c.stroke();

    // wind streaks trailing behind
    c.strokeStyle = 'rgba(255,245,211,0.28)';
    c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(18, 106 + i * 22);
      c.bezierCurveTo(56, 96 + i * 22, 76, 118 + i * 22, 104, 116 + i * 22);
      c.stroke();
    }

    c.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      c.strokeStyle = k === 0 ? 'rgba(255,201,120,0.45)' : k === 1 ? 'rgba(255,234,178,0.85)' : 'rgba(255,252,232,0.95)';
      c.lineWidth = k === 0 ? 16 : k === 1 ? 8 : 3;
      c.shadowColor = k === 2 ? 'rgba(255,240,190,0.8)' : 'transparent';
      c.shadowBlur = k === 2 ? 12 : 0;
      c.beginPath(); c.arc(130, 130, 96, -0.95, 0.95); c.stroke();
      c.beginPath(); c.arc(130, 130, 96, Math.PI - 0.95, Math.PI + 0.95); c.stroke();
    }
    c.shadowBlur = 0;

    c.strokeStyle = 'rgba(255,246,208,0.55)'; c.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU, r1 = 108, r2 = i % 2 ? 117 : 121;
      c.beginPath();
      c.moveTo(130 + Math.cos(a) * r1, 130 + Math.sin(a) * r1);
      c.lineTo(130 + Math.cos(a) * r2, 130 + Math.sin(a) * r2);
      c.stroke();
    }
  });

  // spire (bottom) and stalactite (top)
  const spireArt = (key, flip) => canvasTex(scene, key, 150, 330, (c) => {
    c.save();
    if (flip) { c.translate(0, 330); c.scale(1, -1); }
    const rand = rng(77);
    poly(c, [[10, 330], [30, 150], [58, 70], [86, 26], [104, 62], [126, 130], [144, 330]], '#3f5a5a');
    poly(c, [[86, 26], [104, 62], [126, 130], [144, 330], [96, 330], [88, 120], [70, 60]], '#4e6d68');
    c.save();
    c.beginPath();
    [[10, 330], [30, 150], [58, 70], [86, 26], [104, 62], [126, 130], [144, 330]].forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.clip();
    c.strokeStyle = 'rgba(12,30,32,0.5)'; c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const y = 80 + i * 34;
      c.beginPath(); c.moveTo(20, y); c.quadraticCurveTo(74, y - 10 + rand() * 10, 138, y + 8); c.stroke();
    }
    c.strokeStyle = 'rgba(150,190,150,0.3)'; c.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      c.beginPath(); c.moveTo(40 + rand() * 90, 60 + rand() * 200); c.lineTo(30 + rand() * 100, 220 + rand() * 90); c.stroke();
    }
    c.restore();
    // moss cap
    c.fillStyle = '#4e7f63';
    c.beginPath();
    c.ellipse(76, 32, 26, 8, -0.2, 0, TAU); c.fill();
    c.restore();
  });
  spireArt('spire-up', false);
  spireArt('spire-down', true);

  // storm cell
  canvasTex(scene, 'storm', 400, 240, (c) => {
    const rand = rng(303);
    for (let i = 0; i < 16; i++) {
      const x = 60 + rand() * 280, y = 100 + rand() * 70, r = 40 + rand() * 46;
      const g = c.createRadialGradient(x, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, 'rgba(74,86,104,0.95)');
      g.addColorStop(0.7, 'rgba(46,56,74,0.9)');
      g.addColorStop(1, 'rgba(30,38,54,0.55)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    c.globalAlpha = 0.4;
    for (let i = 0; i < 5; i++) {
      c.fillStyle = '#9fb0c4';
      c.beginPath(); c.ellipse(120 + rand() * 180, 86 + rand() * 20, 40, 12, 0, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  });

  // lightning bolt
  canvasTex(scene, 'bolt', 120, 220, (c) => {
    c.strokeStyle = '#fff3cf'; c.lineWidth = 5; c.shadowColor = '#ffe4a0'; c.shadowBlur = 24;
    c.beginPath(); c.moveTo(70, 6); c.lineTo(40, 92); c.lineTo(66, 96); c.lineTo(34, 206);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(70, 6); c.lineTo(40, 92); c.lineTo(66, 96); c.lineTo(34, 206); c.stroke();
  });

  // moon
  canvasTex(scene, 'moon', 170, 170, (c) => {
    const g = c.createRadialGradient(85, 85, 20, 85, 85, 84);
    g.addColorStop(0, '#fff8dd'); g.addColorStop(0.7, '#f3e6bd'); g.addColorStop(1, 'rgba(243,230,189,0)');
    c.fillStyle = g; c.beginPath(); c.arc(85, 85, 84, 0, TAU); c.fill();
    c.fillStyle = 'rgba(200,182,142,0.35)';
    [[60, 64, 12], [104, 92, 9], [76, 112, 6], [112, 58, 5]].forEach(([x, y, r]) => {
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    });
  });

  // soft particles
  canvasTex(scene, 'mote', 64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,246,210,0.55)');
    g.addColorStop(1, 'rgba(255,240,190,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  });
  canvasTex(scene, 'feather', 40, 18, (c) => {
    c.strokeStyle = '#f1d9b6'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(4, 9); c.quadraticCurveTo(20, 2, 36, 8); c.stroke();
    c.strokeStyle = 'rgba(255,240,214,0.7)'; c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      c.beginPath(); c.moveTo(9 + i * 4, 8); c.lineTo(6 + i * 4, 3); c.stroke();
      c.beginPath(); c.moveTo(9 + i * 4, 8); c.lineTo(7 + i * 4, 13); c.stroke();
    }
  });
  canvasTex(scene, 'star', 26, 26, (c) => {
    c.fillStyle = '#fff7d6';
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2;
      const r = i % 2 ? 4 : 12;
      c.lineTo(13 + Math.cos(a) * r, 13 + Math.sin(a) * r);
    }
    c.closePath(); c.fill();
  });
  canvasTex(scene, 'glow', 220, 220, (c) => {
    const g = c.createRadialGradient(110, 110, 0, 110, 110, 110);
    g.addColorStop(0, 'rgba(255,226,150,0.85)');
    g.addColorStop(0.35, 'rgba(255,214,130,0.35)');
    g.addColorStop(1, 'rgba(255,200,110,0)');
    c.fillStyle = g; c.fillRect(0, 0, 220, 220);
  });

  // clouds per palette
  const cloudTints = {
    dawn: { hi: 'rgba(255,249,232,0.95)', mid: 'rgba(250,232,204,0.85)', lo: 'rgba(244,220,192,0.0)', lit: 'rgba(255,252,240,0.9)' },
    dusk: { hi: 'rgba(255,214,182,0.95)', mid: 'rgba(232,176,162,0.86)', lo: 'rgba(210,150,150,0.0)', lit: 'rgba(255,232,190,0.9)' },
    night: { hi: 'rgba(150,170,198,0.5)', mid: 'rgba(104,126,156,0.42)', lo: 'rgba(90,110,140,0.0)', lit: 'rgba(200,216,240,0.35)' }
  };
  for (const [id, pal] of Object.entries(PALETTES)) {
    makeCloud(scene, `cloud-a-${id}`, cloudTints[id], 21, 1);
    makeCloud(scene, `cloud-b-${id}`, cloudTints[id], 57, 0.7);
    makeCloud(scene, `cloud-c-${id}`, cloudTints[id], 93, 1.35);
    makeRidge(scene, `ridge-far-${id}`, pal, 31 + id.length, { base: 320, amp: 90, color: pal.far });
    makeRidge(scene, `ridge-mid-${id}`, pal, 47 + id.length, { base: 350, amp: 70, color: pal.mid, detail: false });
    makeRidge(scene, `ridge-near-${id}`, pal, 63 + id.length, { base: 388, amp: 52, color: pal.near, detail: true, leaf: pal.leaf });
    for (let v = 0; v < 3; v++) canvasTex(scene, `post-${id}-${v}`, 300, 560, (c) => drawPost(c, 300, 560, v, pal));
    canvasTex(scene, `front-${id}`, 1400, 250, (c) => {
      const rand = rng(501 + id.length);
      c.fillStyle = pal.dark;
      c.beginPath();
      c.moveTo(0, 250);
      c.lineTo(0, 196);
      for (let x = 0; x <= 1400; x += 70) {
        c.quadraticCurveTo(x - 35, 188 + Math.sin(x * 0.02 + id.length) * 12, x, 196 + Math.sin(x * 0.013 + 2) * 8);
      }
      c.lineTo(1400, 250);
      c.closePath();
      c.fill();
      for (let i = 0; i < 30; i++) fern(c, rand() * 1400, 246, 0.9 + rand() * 1.1, pal.dark);
      for (let i = 0; i < 14; i++) pine(c, rand() * 1400, 250, 60 + rand() * 90, pal.dark, (rand() - 0.5) * 0.1);
      grain(c, 1400, 250, 0.05, 91 + id.length);
    });
    canvasTex(scene, `mist-${id}`, 960, 220, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 220);
      const col = pal.fog;
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, col);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 960, 220);
      c.globalAlpha = 0.35;
      c.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) {
        const rand = Math.random;
        const x = rand() * 960, y = 60 + rand() * 100, r = 40 + rand() * 90;
        const hole = c.createRadialGradient(x, y, 0, x, y, r);
        hole.addColorStop(0, 'rgba(0,0,0,0.9)');
        hole.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = hole;
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
    });
    canvasTex(scene, `sky-${id}`, 960, skyHeight, (c) => {
      const g = c.createLinearGradient(0, 0, 0, skyHeight);
      g.addColorStop(0, pal.sky[0]);
      g.addColorStop(0.56, pal.sky[1]);
      g.addColorStop(1, pal.sky[2]);
      c.fillStyle = g; c.fillRect(0, 0, 960, skyHeight);
      grain(c, 960, skyHeight, 0.03, 5 + id.length);
    });
  }
  makeSkyIsland(scene, 'island');
  canvasTex(scene, 'post-ink', 300, 560, (c) => drawPost(c, 300, 560, 1, PALETTES.dawn));
  makeRidge(scene, 'ridge-ink', PALETTES.dawn, 88, { base: 398, amp: 46, color: '#20383a', detail: true, leaf: '#2c4a45' });
}
