// Cave Line — the herd goes on the wall before the torch burns down.
// One continuous line per animal. Lift the charcoal early and the pigment smears;
// rush it and the ochre runs; creep and the flame stalls and eats itself.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-276e018775e133bb';

const STAR = [4, 7, 11];
const NIGHT = MOODS.night;

const ART_W = 230;
const ART_H = 130;
const SAMPLES = 172;

const OCHRE = '#c4552a';
const OCHRE_DEEP = '#7d2f16';
const OCHRE_PALE = '#e08d52';
const SPIRIT = '#bfe6ff';

/* ------------------------------------------------------------- line maths */
function segDist(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(x1 + dx * t - x, y1 + dy * t - y);
}

function smooth(anchors, step = 5) {
  const pts = [];
  const at = (i) => anchors[clamp(i, 0, anchors.length - 1)];
  for (let i = 0; i < anchors.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const n = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      pts.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
      ]);
    }
  }
  pts.push(anchors[anchors.length - 1].slice());
  return pts;
}

function resample(pts, n) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(l); total += l;
  }
  const out = [pts[0].slice()];
  const step = total / (n - 1);
  let acc = 0, si = 0;
  for (let k = 1; k < n - 1; k++) {
    const target = k * step;
    while (si < segs.length - 1 && acc + segs[si] < target) { acc += segs[si]; si++; }
    const a = pts[si], b = pts[si + 1];
    const f = segs[si] > 0 ? clamp((target - acc) / segs[si], 0, 1) : 0;
    out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]);
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

function polyLen(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

/* ------------------------------------------------------- the herd, by hand */
const ANIMALS = [
  {
    name: 'stegosaur',
    anchors: [[150, 42], [166, 28], [150, 12], [124, 6], [100, -8], [82, -28], [66, -76], [46, -36],
      [24, -84], [-2, -42], [-28, -78], [-52, -40], [-76, -62], [-94, -26], [-122, -16], [-170, 0],
      [-206, 14], [-212, 24], [-176, 22], [-140, 22], [-114, 28], [-104, 54], [-110, 88], [-122, 96],
      [-96, 96], [-86, 50], [-50, 42], [-18, 48], [-12, 78], [-22, 94], [6, 94], [14, 48], [50, 42],
      [86, 40], [118, 44], [142, 46]]
  },
  {
    name: 'raptor',
    anchors: [[200, -6], [178, -26], [148, -34], [116, -52], [64, -66], [-14, -62], [-72, -48],
      [-148, -66], [-206, -84], [-186, -44], [-130, -22], [-92, -4], [-76, 30], [-98, 70], [-124, 112],
      [-150, 126], [-114, 130], [-90, 88], [-64, 40], [-30, 22], [10, 30], [22, 84], [42, 90], [42, 34],
      [64, 12], [84, -12], [98, -2], [86, -24], [132, -22], [172, -14], [196, -8]]
  },
  {
    name: 'pterosaur',
    anchors: [[214, 36], [186, 22], [170, 4], [152, -20], [108, -50], [142, -20], [152, -2], [120, 16],
      [100, 20], [126, -30], [160, -74], [194, -116], [152, -112], [104, -92], [56, -66], [16, -48],
      [-18, -44], [-64, -52], [-112, -78], [-166, -110], [-146, -70], [-116, -34], [-86, -6], [-68, 16],
      [-84, 38], [-116, 52], [-88, 54], [-52, 36], [-20, 16], [14, 12], [46, 20], [58, 48], [70, 70],
      [84, 48], [88, 24], [122, 26], [160, 26], [196, 40]]
  },
  {
    name: 'trike',
    anchors: [[196, 34], [210, 20], [204, 2], [188, -4], [176, -8], [206, -40], [212, -46], [178, -28],
      [170, -16], [158, -42], [144, -26], [126, -54], [108, -32], [88, -56], [72, -36], [58, -28],
      [20, -36], [-32, -38], [-84, -28], [-140, -6], [-196, 14], [-208, 24], [-166, 22], [-122, 20],
      [-98, 26], [-88, 54], [-94, 92], [-112, 94], [-114, 102], [-86, 100], [-72, 54], [-32, 44],
      [12, 48], [32, 88], [26, 98], [52, 100], [58, 50], [92, 40], [128, 38], [158, 42], [184, 42]]
  },
  {
    name: 'sauropod',
    anchors: [[-208, 40], [-172, 22], [-130, 4], [-88, -16], [-40, -34], [12, -50], [62, -70],
      [118, -94], [166, -114], [198, -122], [220, -110], [206, -94], [180, -94], [138, -80], [94, -58],
      [54, -38], [26, -16], [14, 6], [28, 20], [32, 58], [26, 90], [46, 92], [52, 56], [56, 22],
      [36, 6], [-12, 10], [-50, 20], [-66, 54], [-72, 92], [-52, 94], [-50, 54], [-58, 26], [-108, 22],
      [-160, 30], [-200, 46]]
  },
  {
    name: 'great deer',
    anchors: [[202, 12], [188, -12], [172, -26], [182, -54], [206, -78], [226, -102], [198, -98],
      [190, -124], [172, -96], [156, -118], [150, -82], [136, -90], [118, -116], [126, -74], [144, -54],
      [148, -32], [122, -42], [110, -16], [76, -10], [26, -14], [-22, -4], [-58, 8], [-82, 16],
      [-104, 10], [-122, 24], [-98, 30], [-78, 32], [-72, 62], [-82, 114], [-102, 120], [-64, 122],
      [-56, 64], [-40, 42], [2, 40], [42, 44], [50, 90], [42, 118], [78, 120], [74, 86], [82, 42],
      [118, 26], [156, 24], [190, 20]]
  }
];
ANIMALS.forEach((a) => {
  a.path = resample(smooth(a.anchors, 5), SAMPLES);
  a.len = polyLen(a.path);
});

/* --------------------------------------------------------------- textures */
function art(scene) {
  const M = scene.M;

  canvasTex(scene, 'cl-wall', W, M.H, (c, w, h) => {
    const rand = rng('cl-wall-7');
    const g = c.createLinearGradient(0, 0, w * 0.42, h);
    g.addColorStop(0, '#162936');
    g.addColorStop(0.24, NIGHT.ridges[2]);
    g.addColorStop(0.58, '#2c4a5b');
    g.addColorStop(0.82, '#1d3644');
    g.addColorStop(1, '#0c1a23');
    c.fillStyle = g; c.fillRect(0, 0, w, h);

    // the ceiling catches the torch: a broad warm wash above the work keeps the
    // upper frame readable instead of falling into black
    const up = c.createRadialGradient(w * 0.46, h * (M.portrait ? 0.16 : 0.1), 10,
      w * 0.46, h * (M.portrait ? 0.16 : 0.1), Math.max(w, h) * (M.portrait ? 0.4 : 0.3));
    up.addColorStop(0, 'rgba(196,150,96,0.34)');
    up.addColorStop(0.5, 'rgba(126,104,84,0.13)');
    up.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = up; c.fillRect(0, 0, w, h);

    for (let i = 0; i < 32; i++) {
      const y = rand() * h;
      c.strokeStyle = `rgba(${138 + rand() * 80 | 0},${168 + rand() * 60 | 0},200,${0.03 + rand() * 0.05})`;
      c.lineWidth = 2 + rand() * 18;
      c.beginPath(); c.moveTo(-20, y);
      for (let x = 0; x <= w + 20; x += 70) c.lineTo(x, y + Math.sin(x * 0.006 + i) * (10 + rand() * 24));
      c.stroke();
    }

    const lit = c.createRadialGradient(w * 0.48, h * 0.44, 12, w * 0.48, h * 0.44, Math.max(w, h) * 0.44);
    lit.addColorStop(0, 'rgba(150,116,80,0.32)');
    lit.addColorStop(0.55, 'rgba(104,82,62,0.13)');
    lit.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = lit; c.fillRect(0, 0, w, h);

    for (let i = 0; i < 760; i++) {
      const x = rand() * w, y = rand() * h, r = 1 + rand() * 7;
      c.fillStyle = `rgba(6,14,20,${0.1 + rand() * 0.2})`;
      c.beginPath(); c.ellipse(x, y, r, r * (0.5 + rand() * 0.5), rand() * 3, 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(192,208,222,${0.02 + rand() * 0.07})`;
      c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.4, r * 0.7, r * 0.35, 0, 0, Math.PI * 2); c.fill();
    }

    c.lineCap = 'round';
    for (let i = 0; i < 15; i++) {
      let xx = rand() * w, yy = 0;
      c.strokeStyle = `rgba(206,224,238,${0.03 + rand() * 0.05})`;
      c.lineWidth = 1 + rand() * 3;
      c.beginPath(); c.moveTo(xx, yy);
      while (yy < h) { yy += 22 + rand() * 44; xx += (rand() - 0.5) * 12; c.lineTo(xx, yy); }
      c.stroke();
    }

    if (M.portrait) {
      // the way out hangs high above the painter: a broken arch of cold night
      const mx = w * 0.5, my = h * 0.185, mw = w * 0.3, mh = h * 0.045;
      const sky = c.createLinearGradient(0, my - mh, 0, my + mh * 1.6);
      sky.addColorStop(0, '#2a4c78');
      sky.addColorStop(0.5, '#18293f');
      sky.addColorStop(1, '#0c1622');
      c.globalAlpha = 0.9;
      c.fillStyle = sky;
      c.beginPath(); c.ellipse(mx, my, mw, mh, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      const rs = rng('cl-arch');
      for (let i = 0; i < 54; i++) {
        const a = rs() * Math.PI * 2, rr = Math.sqrt(rs());
        c.fillStyle = `rgba(253,246,218,${0.15 + rs() * 0.55})`;
        c.beginPath();
        c.arc(mx + Math.cos(a) * mw * rr, my + Math.sin(a) * mh * rr, rs() > 0.92 ? 2.2 : 1.4, 0, Math.PI * 2);
        c.fill();
      }
      c.strokeStyle = 'rgba(198,152,102,0.22)'; c.lineWidth = 11;
      c.beginPath(); c.ellipse(mx, my, mw + 6, mh + 6, 0, 0, Math.PI * 2); c.stroke();
      // rock teeth bite into the opening so it reads as a broken roof, not a lens
      c.fillStyle = '#101d27';
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.08 + 0.84 * (i / 8));
        const x = mx + Math.cos(a) * mw, y = my + Math.sin(a) * mh;
        const t = 16 + rs() * 30;
        c.beginPath();
        c.moveTo(x - 26 - rs() * 14, y);
        c.lineTo(x + 26 + rs() * 14, y);
        c.lineTo(x + (rs() - 0.5) * 20, y + t);
        c.closePath(); c.fill();
      }
    }

    const vig = c.createRadialGradient(w * 0.5, h * 0.46, Math.min(w, h) * (M.portrait ? 0.4 : 0.3), w * 0.5, h * 0.46, Math.max(w, h) * 0.78);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.72, 'rgba(4,10,15,0.22)');
    vig.addColorStop(1, 'rgba(2,6,10,0.62)');
    c.fillStyle = vig; c.fillRect(0, 0, w, h);
    grain(c, w, h, 0.055, 4107);
  });

  canvasTex(scene, 'cl-mouth', 190, M.H, (c, w, h) => {
    const rand = rng('cl-mouth');
    const g = c.createLinearGradient(0, 0, 0, h);
    for (const [s, col] of NIGHT.sky) g.addColorStop(s, col);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      c.fillStyle = `rgba(253,246,218,${0.2 + rand() * 0.6})`;
      c.beginPath(); c.arc(rand() * w, rand() * h * 0.6, rand() > 0.85 ? 1.7 : 1.1, 0, Math.PI * 2); c.fill();
    }
    const far = c.createLinearGradient(0, h * 0.52, 0, h);
    far.addColorStop(0, 'rgba(8,18,26,0)');
    far.addColorStop(1, NIGHT.ground[1]);
    c.fillStyle = far; c.fillRect(0, h * 0.52, w, h * 0.48);
    c.globalCompositeOperation = 'destination-in';
    const fade = c.createLinearGradient(0, 0, w, 0);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(0.4, 'rgba(0,0,0,0.4)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = fade; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, 0.04, 22);
  });

  canvasTex(scene, 'cl-hand', 100, 130, (c) => {
    const rand = rng('cl-hand');
    for (let i = 0; i < 420; i++) {
      const a = rand() * Math.PI * 2, r = 24 + rand() * 40;
      c.fillStyle = `rgba(152,58,30,${0.04 + rand() * 0.09})`;
      c.beginPath(); c.arc(50 + Math.cos(a) * r * 0.82, 76 + Math.sin(a) * r, 1 + rand() * 3, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(118,42,20,0.86)';
    c.beginPath(); c.ellipse(50, 84, 21, 24, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(118,42,20,0.86)'; c.lineCap = 'round';
    [[-24, -30], [-9, -42], [8, -40], [24, -28], [30, 4]].forEach(([dx, dy], i) => {
      c.lineWidth = i === 4 ? 12 : 10;
      c.beginPath(); c.moveTo(50 + dx * 0.5, 80 + dy * 0.4); c.lineTo(50 + dx, 80 + dy); c.stroke();
    });
    grain(c, 100, 130, 0.05, 8);
  });

  canvasTex(scene, 'cl-rock', 180, 110, (c) => {
    const rand = rng('cl-rock');
    const g = c.createLinearGradient(20, 8, 160, 106);
    g.addColorStop(0, '#2c4756');
    g.addColorStop(0.55, '#1b303c');
    g.addColorStop(1, '#0c1820');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(6, 106);
    let x = 6;
    while (x < 174) {
      const nx = Math.min(174, x + 18 + rand() * 26);
      c.lineTo(nx, 30 + rand() * 56);
      x = nx;
    }
    c.lineTo(174, 106);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(186,208,224,0.1)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(16, 92);
    for (let px = 16; px < 168; px += 22) c.lineTo(px, 88 + Math.sin(px * 0.09) * 6);
    c.stroke();
    grain(c, 180, 110, 0.05, 13);
  });

  canvasTex(scene, 'cl-torch', 76, 150, (c) => {
    const wood = c.createLinearGradient(20, 150, 56, 60);
    wood.addColorStop(0, '#3b2a1c');
    wood.addColorStop(0.5, '#5b402a');
    wood.addColorStop(1, '#2b1d14');
    c.fillStyle = wood;
    c.beginPath();
    c.moveTo(30, 148); c.lineTo(44, 148); c.lineTo(48, 62); c.lineTo(28, 62);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(206,168,116,0.38)'; c.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(27, 130 - i * 20); c.quadraticCurveTo(40, 124 - i * 20, 50, 132 - i * 20); c.stroke();
    }
    const rag = c.createRadialGradient(38, 52, 4, 38, 52, 30);
    rag.addColorStop(0, '#ffdf9c');
    rag.addColorStop(0.4, '#e08a3c');
    rag.addColorStop(1, 'rgba(120,52,20,0.18)');
    c.fillStyle = rag;
    c.beginPath(); c.ellipse(38, 52, 23, 21, 0, 0, Math.PI * 2); c.fill();
    grain(c, 76, 150, 0.04, 3);
  });

  canvasTex(scene, 'cl-flame', 110, 130, (c) => {
    const f = c.createRadialGradient(55, 80, 6, 55, 80, 58);
    f.addColorStop(0, 'rgba(255,246,214,0.95)');
    f.addColorStop(0.35, 'rgba(255,190,96,0.8)');
    f.addColorStop(0.7, 'rgba(226,110,40,0.4)');
    f.addColorStop(1, 'rgba(160,60,20,0)');
    c.fillStyle = f;
    c.beginPath();
    c.moveTo(55, 4);
    c.quadraticCurveTo(94, 58, 82, 98);
    c.quadraticCurveTo(70, 128, 55, 128);
    c.quadraticCurveTo(40, 128, 28, 98);
    c.quadraticCurveTo(16, 58, 55, 4);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,252,232,0.66)';
    c.beginPath();
    c.moveTo(55, 46);
    c.quadraticCurveTo(74, 80, 64, 108);
    c.quadraticCurveTo(55, 120, 46, 108);
    c.quadraticCurveTo(36, 80, 55, 46);
    c.closePath(); c.fill();
  });

  canvasTex(scene, 'cl-nub', 44, 44, (c) => {
    const g = c.createRadialGradient(22, 22, 2, 22, 22, 21);
    g.addColorStop(0, '#63646d');
    g.addColorStop(0.6, '#2f3037');
    g.addColorStop(1, 'rgba(20,20,26,0)');
    c.fillStyle = g; c.beginPath(); c.arc(22, 22, 21, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(220,232,244,0.26)';
    c.beginPath(); c.ellipse(17, 15, 6, 3.4, -0.6, 0, Math.PI * 2); c.fill();
    grain(c, 44, 44, 0.08, 9);
  });
}

/* ----------------------------------------------------------- the painter */
function create(scene) {
  const M = scene.M;
  const K = scene.k;
  const S = M.portrait ? 1.2 : 0.8;
  const HOME = 140;
  const EYE = M.portrait ? 268 : 292;
  let oyGame = HOME;

  /* the mural keeps one uniform pixel scale in both orientations: M.Y anchors
     it inside the stage band, so tracing a beast never stretches it */
  const art2px = (ax, ay, atOx, atOs) => ({ x: atOx + ax * atOs, y: M.Y(oyGame) + ay * atOs });

  art(scene);
  const rand = rng('cave-line-live');

  const st = {
    murals: 0, index: 0, hearts: 3, torch: 1, level: 0, time: 0, over: false, warned: false,
    bleed: 0, stall: 0, gust: 0, gustT: 3.6, wind: 0, crackOn: false,
    accepted: 0, ruined: 0, smudges: 0, blotch: 0, covered: 0, qsum: 0, crackHits: 0
  };

  scene.add.image(0, 0, 'cl-wall').setOrigin(0).setDepth(-12);
  // The photographed wall includes the cave opening.

  const hr = rng('cl-hands');
  for (let i = 0; i < 7; i++) {
    scene.add.image(66 + hr() * (W - 150), M.Y(70 + hr() * 400), 'cl-hand')
      .setDepth(-9).setAlpha(0.14 + hr() * 0.18).setScale((0.3 + hr() * 0.26) * K)
      .setAngle((hr() - 0.5) * 44).setTint(0xd76a3c);
  }

  const ceil = scene.add.graphics().setDepth(-10).setVisible(false);
  const cr = rng('cl-ceiling');
  // in portrait the rock above the stage band is a thin strip: the wall keeps
  // its own light there, so the mouth arch stays readable
  ceil.fillStyle(0x0e1c26, M.portrait ? 0.9 : 1).fillRect(0, 0, W, M.portrait ? 250 : M.Y(16));
  for (let i = 0; i < 22; i++) {
    const x = cr() * W, wdt = 12 + cr() * 26, len = M.Y(16) + (14 + cr() * 52) * K;
    ceil.fillStyle(cr() > 0.5 ? 0x22394a : 0x152836, 0.95);
    ceil.beginPath();
    ceil.moveTo(x - wdt / 2, M.Y(8));
    ceil.lineTo(x + wdt / 2, M.Y(8));
    ceil.lineTo(x + (cr() - 0.5) * 8, len);
    ceil.closePath(); ceil.fillPath();
    ceil.lineStyle(1.2, 0xa8c4d6, 0.1);
    ceil.beginPath(); ceil.moveTo(x - wdt / 2 + 1.5, M.Y(8)); ceil.lineTo(x, len - 4); ceil.strokePath();
  }
  ceil.lineStyle(1.5, 0x9fbccc, 0.08);
  for (let i = 0; i < 34; i++) {
    const x = cr() * W, y = M.Y(6) + cr() * 26 * K;
    ceil.beginPath(); ceil.moveTo(x, y);
    ceil.lineTo(x + (cr() - 0.5) * 28, y + 18 + cr() * 40 * K); ceil.strokePath();
  }

  const rr = rng('cl-rocks');
  for (let i = 0; i < 5; i++) {
    scene.add.image(60 + i * 200 + (rr() - 0.5) * 90, M.Y(536), 'cl-rock').setOrigin(0.5, 1)
      .setDepth(-4).setScale((0.5 + rr() * 0.6) * K).setAlpha(0.95).setAngle((rr() - 0.5) * 6);
  }
  scene.add.rectangle(0, M.Y(508), W, M.Y(540) - M.Y(508), 0x070f15, 0.5)
    .setOrigin(0, 0).setDepth(-5);

  const paintTex = canvasTex(scene, 'cl-paint', W, M.H, (c) => { c.clearRect(0, 0, W, M.H); });
  const pctx = paintTex.getContext();
  scene.add.image(0, 0, 'cl-paint').setOrigin(0).setDepth(-6);

  const crackG = scene.add.graphics().setDepth(1);
  const guideG = scene.add.graphics().setDepth(2);
  const tallyG = scene.add.graphics().setDepth(3);
  const liveG = scene.add.graphics().setDepth(4);

  const halo = scene.add.image(W / 2, M.Y(oyGame), 'arc-glow').setDepth(7).setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0.14);
  const warm = scene.add.image(W / 2, M.Y(oyGame), 'arc-glow').setDepth(28).setBlendMode(Phaser.BlendModes.ADD)
    .setTint(0xffb063).setAlpha(0.2);
  const shade = scene.add.rectangle(W / 2, M.H / 2, W * 3, M.H * 3, 0x04090f, 0.6).setOrigin(0.5).setDepth(27);
  const hole = scene.add.image(W / 2, M.Y(oyGame), 'arc-glow').setDepth(29).setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0.7).setTint(0xa8dcff);
  const torch = scene.add.image(W / 2, M.Y(oyGame), 'cl-torch').setDepth(30).setScale(0.56 * K)
    .setAngle(-16).setAlpha(0.95);
  const flame = scene.add.image(0, 0, 'cl-flame').setDepth(31).setBlendMode(Phaser.BlendModes.ADD)
    .setOrigin(0.5, 0.9).setScale(0.56 * K);
  const nub = scene.add.image(W / 2, M.Y(oyGame), 'cl-nub').setDepth(32).setScale(0.44 * K);

  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 6, max: 34 }, angle: { min: 200, max: 340 }, lifespan: { min: 320, max: 760 },
    scale: { start: 0.17, end: 0.01 }, alpha: { start: 0.36, end: 0 }, tint: [0xd9c19c, 0x9fb2c2],
    gravityY: 40, emitting: false
  }).setDepth(20);

  scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 0, max: W }, y: { min: M.Y(14), max: M.Y(526) },
    speedX: { min: 24, max: 90 }, speedY: { min: -14, max: 14 },
    lifespan: { min: 1600, max: 3000 }, scale: { start: 0.11, end: 0 },
    alpha: { start: 0.2, end: 0 }, tint: [0xcfe6f6, 0xe8d3ab], frequency: 520, quantity: 1
  }).setDepth(19);

  const light = { x: W / 2, y: M.Y(oyGame), tx: W / 2, ty: M.Y(oyGame) };

  /* -------------------------------------------------------- mural layout */
  const ORDER = [0, 1, 3, 2, 5, 4];
  const slots = [];
  const used = [];

  (function buildSlots() {
    const cols = M.portrait ? [300, 660] : [214, 480, 746];
    const rows = M.portrait ? [112, 268, 424] : [120, 292, 448];
    const perRow = M.portrait ? [1.04, 0.96, 0.86] : [0.98, 0.9, 0.8];
    const step = M.portrait ? 128 : 112;
    rows.forEach((gy, r) => cols.forEach((cx) => {
      for (let dx = -1; dx <= 1; dx++) slots.push({ ox: cx + dx * step, gy, sc: perRow[r] });
    }));
  })();

  let guide = [];
  let guideArt = [];
  let guidePx = [];
  let crack = [];
  let crackPx = [];
  let q = new Float32Array(SAMPLES);
  let hit = new Uint8Array(SAMPLES);
  let ox = W / 2, os = S, animal = ANIMALS[0];

  const minCov = () => Math.min(0.82, 0.6 + st.level * 0.012);
  const minFid = () => Math.min(0.68, 0.52 + st.level * 0.008);

  function pickSlot() {
    const shrink = Math.max(0.74, 1 - Math.floor(st.index / 7) * 0.08);
    let best = null, bestScore = Infinity;
    for (const sl of slots) {
      const s = sl.sc * shrink;
      const margin = 14 + ART_W * s * S;
      const ox = clamp(sl.ox, margin, W - margin);
      let score = Math.abs(sl.gy - EYE) * 0.1 + Math.abs(ox - W / 2) * 0.06 + Math.abs(ox - sl.ox) * 0.9;
      for (const u of used) {
        const dx = Math.abs(ox - u.ox) - (s + u.s) * ART_W;
        const dy = Math.abs(M.Y(sl.gy) - u.gy) - (s + u.s) * ART_H;
        if (dx < 0 && dy < 0) score += -dx * -dy * 0.012;
      }
      if (score < bestScore) { bestScore = score; best = { ox, gy: sl.gy, sc: s }; }
    }
    return best || { ox: W / 2, gy: HOME, sc: shrink };
  }

  function paintCrack() {
    crackG.clear();
    crackPx = [];
    if (!crack.length) return;
    const col = (p) => ({ x: ox + p[0] * os, y: M.Y(oyGame) + p[1] * os });
    const c0 = col(crack[0]);
    crackG.lineStyle(6 * os, 0x050b11, 0.9).beginPath().moveTo(c0.x, c0.y);
    for (let i = 1; i < crack.length; i++) { const c = col(crack[i]); crackG.lineTo(c.x, c.y); }
    crackG.strokePath();
    crackG.lineStyle(1.8 * os, 0xbcd6e4, 0.34).beginPath().moveTo(c0.x, c0.y);
    for (let i = 1; i < crack.length; i++) { const c = col(crack[i]); crackG.lineTo(c.x, c.y + 1.6 * os); }
    crackG.strokePath();
    const jr = rng(91 + st.index);
    for (let i = 3; i < crack.length; i += 8) {
      const c = col(crack[i]);
      crackG.lineStyle(1.4 * os, 0x0a1218, 0.5).beginPath().moveTo(c.x, c.y);
      crackG.lineTo(c.x + (jr() - 0.5) * 44 * os, c.y + (jr() - 0.5) * 30 * os).strokePath();
    }
    crackPx = crack.map(col);
    crackG.setAlpha(0);
    scene.tweens.add({ targets: crackG, alpha: 1, duration: 620 });
  }

  function placeCrack() {
    crack = [];
    crackG.clear();
    crackPx = [];
    if (!st.crackOn) return;
    const r = rng('crack-' + st.index);
    const GAP = 16;
    const clear = (x, y) => {
      let d = 1e9;
      for (let i = 0; i < guide.length; i += 2) {
        const q = Math.hypot(x - guide[i][0], y - guide[i][1]);
        if (q < d) d = q;
      }
      return d;
    };
    let sx = 0, sy = 0, best = -1;
    for (let gx = -ART_W; gx <= ART_W; gx += 11) {
      for (let gy = -ART_H; gy <= ART_H; gy += 11) {
        if (!inRing(gx, gy, guide)) continue;
        const c = clear(gx, gy);
        if (c > best) { best = c; sx = gx; sy = gy; }
      }
    }
    if (best < GAP + 3) return;
    const arm = (ang) => {
      const pts = [];
      let px = sx, py = sy, a = ang;
      for (let k = 0; k < 15; k++) {
        let bx = 0, by = 0, bc = -1, bs = -1e9;
        for (const da of [-0.44, -0.2, 0, 0.2, 0.44]) {
          const t = a + da + (r() - 0.5) * 0.16;
          const nx = px + Math.cos(t) * 14, ny = py + Math.sin(t) * 14;
          const c = Math.min(clear(nx, ny), GAP + 22);
          const s = c - Math.abs(da) * 4;
          if (s > bs) { bs = s; bx = nx; by = ny; bc = clear(nx, ny); }
        }
        if (bc < GAP) break;
        a = Math.atan2(by - py, bx - px);
        px = bx; py = by;
        pts.push([px, py]);
      }
      return pts;
    };
    const tilt = (r() - 0.5) * 0.9;
    crack = arm(tilt + Math.PI).reverse().concat([[sx, sy]], arm(tilt));
    paintCrack();
  }

  function drawGuide() {
    guideG.clear();
    const spirit = Phaser.Display.Color.HexStringToColor(SPIRIT).color;
    const pale = Phaser.Display.Color.HexStringToColor(OCHRE_PALE).color;
    guideG.lineStyle(2.4 * os, spirit, 0.6);
    guideG.beginPath();
    guideG.moveTo(guidePx[0].x, guidePx[0].y);
    for (let i = 1; i < guidePx.length; i++) {
      if (i % 2 === 1) guideG.lineTo(guidePx[i].x, guidePx[i].y);
      else guideG.moveTo(guidePx[i].x, guidePx[i].y);
    }
    guideG.strokePath();
    for (let i = 0; i < guidePx.length; i += 14) {
      guideG.fillStyle(spirit, 0.4).fillCircle(guidePx[i].x, guidePx[i].y, 2.4 * os);
    }
    const s = guidePx[0];
    guideG.fillStyle(0x0a1218, 0.66).fillCircle(s.x, s.y, 9 * os);
    guideG.fillStyle(spirit, 0.95).fillCircle(s.x, s.y, 6 * os);
    guideG.lineStyle(2 * os, pale, 0.45).strokeCircle(s.x, s.y, 13 * os);
    guideG.lineStyle(1.8 * os, spirit, 0.5);
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.55;
      guideG.lineBetween(s.x + Math.cos(a) * 18 * os, s.y + Math.sin(a) * 18 * os,
        s.x + Math.cos(a) * 25 * os, s.y + Math.sin(a) * 25 * os);
    }
  }

  function drawTally() {
    tallyG.clear();
    const cov = st.covered / SAMPLES;
    const fid = st.covered > 0 ? st.qsum / st.covered : 0;
    const w = 132 * os, h = 4 * os;
    const bx = ox - w / 2, by = M.Y(oyGame) + ART_H * os + 20 * os;
    tallyG.fillStyle(0x0a1218, 0.24).fillRect(bx - 2, by - 2, w + 4, h * 2.8 + 4);
    tallyG.fillStyle(Phaser.Display.Color.HexStringToColor(OCHRE_PALE).color, 0.8)
      .fillRect(bx, by, w * clamp(cov / 0.95, 0, 1), h);
    tallyG.fillStyle(Phaser.Display.Color.HexStringToColor(SPIRIT).color, 0.72)
      .fillRect(bx, by + h + 3, w * clamp(fid / 0.85, 0, 1), h * 0.7);
    tallyG.lineStyle(1.4, Phaser.Display.Color.HexStringToColor(OCHRE_PALE).color, 0.55);
    tallyG.lineBetween(bx + w * clamp(minCov() / 0.95, 0, 1), by - 3, bx + w * clamp(minCov() / 0.95, 0, 1), by + h + 3);
    for (let i = 0; i < 3; i++) {
      tallyG.fillStyle(i < st.hearts ? Phaser.Display.Color.HexStringToColor(SPIRIT).color : 0x2a3a45,
        i < st.hearts ? 0.85 : 0.3).fillCircle(bx + w + 16 * os + i * 13 * os, by + h, 4 * os);
    }
  }

  function nextMural() {
    const pick = ORDER[st.index % ORDER.length];
    const shift = Math.floor(st.index / ORDER.length);
    animal = ANIMALS[(pick + shift * 2) % ANIMALS.length];
    st.index++;
    const slot = pickSlot();
    ox = slot.ox; os = slot.sc * S; oyGame = slot.gy;
    used.push({ ox, gy: M.Y(slot.gy), s: slot.sc });
    if (used.length > 14) used.shift();
    const flip = st.index % 3 === 1 ? -1 : 1;
    guideArt = animal.path.map(([x, y]) => [x * flip, y]);
    guide = resample(guideArt, SAMPLES);
    guidePx = guide.map(([x, y]) => ({ x: ox + x * os, y: M.Y(oyGame) + y * os }));
    q = new Float32Array(SAMPLES);
    hit = new Uint8Array(SAMPLES);
    st.covered = 0; st.qsum = 0; st.hearts = 3; st.bleed = 0; st.stall = 0;
    st.crackOn = st.murals >= 2;
    liveG.clear();
    stroke.active = false; stroke.pts = [];
    drawGuide();
    placeCrack();
    drawTally();
    resetBounds();
  }

  /* ------------------------------------------------------- pigment on rock */
  function bake(pts, spoil) {
    if (pts.length < 2) return;
    const ctx = pctx;
    const jr = rng(pts.length * 31 + (spoil ? 7 : 1));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(88,34,16,0.17)';
    ctx.lineWidth = 13 * os;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const fq = clamp(b.q, 0, 1);
      const wob = (jr() - 0.5) * 1.8 * os;
      ctx.strokeStyle = `rgba(${158 + jr() * 24 | 0},${56 + jr() * 18 | 0},34,${0.3 + 0.44 * fq})`;
      ctx.lineWidth = (3 + 5.6 * fq) * os * (1 + b.bleed * 0.9);
      ctx.beginPath(); ctx.moveTo(a.x + wob, a.y + wob); ctx.lineTo(b.x - wob, b.y - wob); ctx.stroke();
      if (jr() < 0.5) {
        ctx.strokeStyle = `rgba(228,146,88,${0.08 + 0.16 * fq})`;
        ctx.lineWidth = 1.6 * os;
        ctx.beginPath();
        ctx.moveTo(a.x + wob * 2.4, a.y + wob * 2.4); ctx.lineTo(b.x + wob * 2.4, b.y + wob * 2.4);
        ctx.stroke();
      }
      if (b.bleed > 0.24 && jr() < 0.55) {
        ctx.fillStyle = `rgba(120,40,18,${0.1 + 0.2 * b.bleed})`;
        ctx.beginPath();
        ctx.ellipse(b.x + (jr() - 0.5) * 9 * os, b.y + (jr() - 0.2) * 10 * os,
          (3 + jr() * 9 * b.bleed) * os, (2.5 + jr() * 6 * b.bleed) * os, jr() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (spoil) {
      const last = pts[pts.length - 1];
      ctx.fillStyle = 'rgba(58,26,14,0.32)';
      ctx.beginPath(); ctx.ellipse(last.x, last.y, 11 * os, 7 * os, 0, 0, Math.PI * 2); ctx.fill();
      st.blotch++;
    }
    ctx.restore();
    paintTex.refresh();
  }

  function smudge(pts) {
    if (pts.length < 2) return;
    const ctx = pctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x + (Math.random() - 0.5) * 7 * os, pts[i].y + 4 * os + Math.random() * 3 * os);
    }
    ctx.strokeStyle = 'rgba(78,90,104,0.15)';
    ctx.lineWidth = 15 * os;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(156,126,102,0.07)';
    ctx.lineWidth = 24 * os;
    ctx.stroke();
    ctx.restore();
    paintTex.refresh();
    st.smudges++;
    st.blotch++;
  }

  /* ------------------------------------------------------------ the stroke */
  const stroke = {
    active: false, dead: false, ruined: false, onCrack: false,
    pts: [], len: 0, speed: 0, marked: 0, last: { x: 0, y: 0 }, ts: 0
  };
  let tol = 34 * S, lo = 110 * S, hi = 430 * S;

  function resetBounds() {
    const shrink = Math.max(0.76, 1 - st.level * 0.03);
    tol = 34 * os * shrink * (M.portrait ? 1.18 : 1);
    lo = 110 * os;
    hi = 430 * os;
  }

  function begin(px, py) {
    if (st.over) return;
    resetBounds();
    stroke.active = true;
    stroke.dead = false;
    stroke.ruined = false;
    stroke.onCrack = false;
    stroke.pts = [{ x: px, y: py, q: 0, bleed: 0 }];
    stroke.len = 0; stroke.speed = 0; stroke.marked = 0;
    stroke.last = { x: px, y: py };
    stroke.ts = performance.now();
    st.bleed = 0; st.stall = 0;
    light.tx = px; light.ty = py;
    nub.visible = true;
    dust.emitParticleAt(px, py, 4);
  }

  function give(i, val) {
    if (val <= q[i]) return;
    st.qsum += val - q[i];
    q[i] = val;
    if (!hit[i]) { hit[i] = 1; st.covered++; }
  }

  function mark(px, py) {
    const lx = stroke.last.x, ly = stroke.last.y;
    let dmin = 1e9, imin = -1;
    for (let i = 0; i < SAMPLES; i++) {
      const g = guidePx[i];
      const d = segDist(g.x, g.y, lx, ly, px, py);
      if (d < dmin) { dmin = d; imin = i; }
    }
    if (imin < 0 || dmin >= tol) return 0;
    const a = clamp(Math.pow(1 - dmin / tol, 0.72) * (1 - 0.5 * st.bleed), 0, 1);
    give(imin, a);
    const spacing = Math.max(1, animal.len / SAMPLES * os);
    const spread = Math.max(1, Math.round(tol / spacing));
    for (let k = 1; k <= spread; k++) {
      const fall = a * (1 - k / (spread + 1));
      for (const j of [imin + k, imin - k]) {
        if (j < 0 || j >= SAMPLES) continue;
        const g = guidePx[j];
        if (Math.hypot(g.x - px, g.y - py) > tol) continue;
        give(j, fall);
      }
    }
    stroke.marked += a > 0.4 ? 1 : 0.3;
    return a;
  }

  function redrawLive() {
    liveG.clear();
    if (stroke.pts.length < 2) return;
    liveG.lineStyle((4.4 + 3.4 * st.bleed) * os, Phaser.Display.Color.HexStringToColor(OCHRE).color, 0.88);
    liveG.beginPath();
    liveG.moveTo(stroke.pts[0].x, stroke.pts[0].y);
    for (let i = 1; i < stroke.pts.length; i++) liveG.lineTo(stroke.pts[i].x, stroke.pts[i].y);
    liveG.strokePath();
    if (st.bleed > 0.28) {
      liveG.fillStyle(Phaser.Display.Color.HexStringToColor(OCHRE_DEEP).color, 0.3 * st.bleed);
      for (let i = 4; i < stroke.pts.length; i += 6) {
        const p = stroke.pts[i];
        if (p.bleed < 0.28) continue;
        liveG.fillCircle(p.x + (Math.random() - 0.5) * 9 * os, p.y + Math.random() * 8 * os,
          (2.5 + Math.random() * 6 * p.bleed) * os);
      }
    }
  }

  function move(ptx, pty, dts) {
    if (!stroke.active || stroke.dead || st.over) return;
    const d = Math.hypot(ptx - stroke.last.x, pty - stroke.last.y);
    if (d < 0.8) return;
    const v = d / Math.max(0.004, dts);
    stroke.speed = lerp(stroke.speed || v, v, 0.45);

    if (v > hi) st.bleed = clamp(st.bleed + ((v - hi) / hi) * dts * 4.6, 0, 1);
    else st.bleed = Math.max(0, st.bleed - dts * 1.25);
    if (st.bleed > 0.7 && !stroke.ruined) {
      stroke.ruined = true;
      scene.sfx('bad');
      scene.shake(120, 0.004);
      scene.notice('too fast — the pigment runs', 1500);
    }

    if (crackPx.length > 1) {
      for (let i = 1; i < crackPx.length; i++) {
        if (segDist(ptx, pty, crackPx[i - 1].x, crackPx[i - 1].y, crackPx[i].x, crackPx[i].y) < 11 * os) {
          stroke.onCrack = true;
          break;
        }
      }
    }

    const qa = mark(ptx, pty);
    stroke.pts.push({ x: ptx, y: pty, q: qa, bleed: st.bleed });
    stroke.len += d;
    stroke.last = { x: ptx, y: pty };
    if (stroke.pts.length > 1400) stroke.pts.splice(0, 500);

    redrawLive();
    if (Math.random() < dts * 24) dust.emitParticleAt(ptx, pty, 1);
    light.tx = ptx; light.ty = pty;
    nub.x = ptx; nub.y = pty;

    if (stroke.onCrack) {
      stroke.onCrack = false;
      stroke.dead = true;
      st.crackHits++;
      scene.sfx('drum4');
      scene.shake(140, 0.005);
      scene.popText(ptx, pty - 26 * os, 'the crack takes it', '#a9cdf0');
      finishStroke(stroke.pts, 'crack');
    }
  }

  function finishStroke(pts, why) {
    const long = pts && pts.length > 1;
    if (why === 'crack') {
      if (long && stroke.len > 60 * os) { bake(pts, true); st.accepted++; }
      else if (long) smudge(pts);
      stroke.active = false; stroke.dead = false; stroke.pts = [];
      liveG.clear();
      drawGuide(); drawTally();
      checkBank();
      return;
    }
    if (!long) {
      stroke.active = false; stroke.pts = [];
      liveG.clear();
      return;
    }
    const avgQ = stroke.marked / pts.length;
    if (stroke.len > 120 * os && avgQ > 0.4 && !stroke.ruined) {
      bake(pts, false);
      st.accepted++;
      scene.sfx('chime');
      const mid = pts[Math.floor(pts.length / 2)];
      scene.popText(mid.x, mid.y - 26 * os, 'the line holds', '#e8c07a');
      scene.burst(mid.x, mid.y, 0xe8a860, 8, { life: 460, gravity: 40, scale: 0.26 });
    } else {
      smudge(pts);
      st.ruined++;
      st.hearts--;
      scene.sfx('bad');
      const mid = pts[Math.floor(pts.length / 2)];
      scene.popText(mid.x, mid.y - 22 * os, stroke.ruined ? 'run and lost' : 'lifted too soon', '#9fb6c6');
      if (!stroke.ruined && !st.warned) scene.notice('lift the charcoal too soon and it smears', 1800);
      stroke.active = false; stroke.pts = [];
      liveG.clear();
      if (st.hearts <= 0) { giveUp(); return; }
      drawGuide(); drawTally();
      return;
    }
    stroke.active = false; stroke.pts = [];
    liveG.clear();
    drawGuide();
    drawTally();
    checkBank();
  }

  function giveUp() {
    scene.notice('the wall will not hold this one', 1900);
    scene.sfx('hurt');
    scene.shake(200, 0.006);
    st.torch = Math.max(0.02, st.torch - 0.05);
    nextMural();
  }

  function checkBank() {
    const cov = st.covered / SAMPLES;
    const fid = st.covered > 0 ? st.qsum / st.covered : 0;
    if (cov < minCov() || fid < minFid()) return;
    st.murals++;
    st.level = st.murals;
    const fuel = 0.16 + 0.26 * fid + (cov > 0.9 ? 0.06 : 0);
    st.torch = Math.min(1, st.torch + fuel);
    const mid = guidePx[Math.floor(SAMPLES / 2)];
    scene.sfx('good');
    scene.cameras.main.flash(260, 70, 36, 10);
    scene.burst(mid.x, mid.y, 0xffd77a, 14, { life: 700, gravity: 120, spin: true, scale: 0.3 });
    scene.popText(ox, M.Y(oyGame) - ART_H * os - 16 * os, animal.name + ' accepted', '#ffe6a8');
    if (fid < 0.62) scene.notice('it is on the wall, patchy and honest', 1800);
    else if (st.murals === 1) scene.notice('the herd begins to fill the rock', 1900);
    else if (st.murals === 3) scene.notice('a crack runs where the wall moved', 2100);
    else if (st.murals === 6) scene.notice('the fat is low — paint from memory', 2000);
    nextMural();
  }

  /* a stroke drawn through art-space points at `speed` art units per second,
     used by the debug surface and by nothing in play */
  function paintAtSpeed(pts, opts = {}) {
    if (!pts || pts.length < 2) return Number((st.covered / SAMPLES).toFixed(3));
    const mps = Math.max(10, (opts.speed || 240) * os);
    const stride = opts.stride || 1;
    resetBounds();
    const s0 = art2px(pts[0][0], pts[0][1], ox, os);
    begin(s0.x, s0.y);
    let prev = pts[0];
    for (let i = stride; i < pts.length; i += stride) {
      const d = Math.hypot(pts[i][0] - prev[0], pts[i][1] - prev[1]) * os;
      const p = art2px(pts[i][0], pts[i][1], ox, os);
      move(p.x, p.y, d / mps);
      prev = pts[i];
      if (st.over || stroke.dead) break;
    }
    if (opts.lift !== false) finishStroke(stroke.pts, 'lift');
    return Number((st.covered / SAMPLES).toFixed(3));
  }

  /* --------------------------------------------------------------- input */
  scene.input.on('pointerdown', (p) => begin(p.x, p.y));
  scene.input.on('pointermove', (p) => {
    const now = performance.now();
    if (!stroke.active) {
      light.tx = p.x; light.ty = p.y;
      nub.x = p.x; nub.y = p.y;
      return;
    }
    const dts = clamp((now - stroke.ts) / 1000, 0.004, 0.12);
    stroke.ts = now;
    move(p.x, p.y, dts);
  });
  const onUp = (p) => {
    if (!stroke.active) return;
    const now = performance.now();
    const dts = clamp((now - stroke.ts) / 1000, 0.004, 0.12);
    stroke.ts = now;
    move(p.x, p.y, dts);
    finishStroke(stroke.pts, 'lift');
  };
  scene.input.on('pointerup', onUp);
  scene.input.on('pointerupoutside', onUp);
  const keys = scene.input.keyboard.addKeys({ space: 'SPACE', s: 'S' });

  nextMural();

  /* --------------------------------------------------------------- update */
  let tallyT = 0;

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (st.over) return;
    st.time += dt;

    const steady = keys.space.isDown || keys.s.isDown;

    st.gustT -= dt;
    if (st.gustT <= 0) {
      st.gust = 1;
      st.gustT = 7 - Math.min(3.4, st.level * 0.3) + rand() * 5;
      scene.sfx('whoosh');
      if (st.time > 7) scene.notice('wind in the cave — the light moves', 1500);
    }
    st.gust = Math.max(0, st.gust - dt * 0.62);
    const flick = 0.82 + Math.sin(time / 210) * 0.07 + Math.sin(time / 57) * 0.04 + st.gust * 0.26 * Math.sin(time / 33);
    st.wind = Math.sin(time / 900) * 0.4 + st.gust * Math.sin(time / 140);

    const slow = stroke.active && stroke.speed < lo * 0.6;
    st.stall = clamp(st.stall + (slow ? dt * 1.9 : -dt * 2.2), 0, 1);
    const burn = Math.min(0.076, 0.046 + st.level * 0.0042) * (1 + 1.6 * st.stall) * (steady ? 1.85 : 1);
    st.torch = clamp(st.torch - burn * dt, 0, 1);
    if (stroke.active && performance.now() - stroke.ts > 360) stroke.speed *= 0.88;

    const cov = st.covered / SAMPLES;
    const fid = st.covered > 0 ? st.qsum / st.covered : 0;

    guideG.setAlpha(clamp((0.16 + 0.86 * st.torch) * (steady ? 1.3 : 1) * flick, 0, 0.95));
    tallyG.setAlpha(0.42 + 0.4 * st.torch);
    nub.visible = stroke.active;

    light.x = lerp(light.x, light.tx, Math.min(1, dt * 7));
    light.y = lerp(light.y, light.ty, Math.min(1, dt * 7));
    nub.x = lerp(nub.x, light.tx, Math.min(1, dt * 12));
    nub.y = lerp(nub.y, light.ty, Math.min(1, dt * 12));

    const holeR = (M.portrait ? 300 : 210) * (0.42 + 0.58 * st.torch) * flick;
    hole.setPosition(light.x, light.y).setScale(clamp(holeR * 1.5 / 256, 0.3, 7)).setAlpha(0.2 + 0.2 * st.torch);
    warm.setPosition(light.x, light.y).setScale(clamp(holeR * 2.4 / 256, 0.4, 10)).setAlpha(0.1 + 0.16 * st.torch);
    shade.setAlpha(clamp(0.6 - 0.4 * st.torch, 0.14, 0.6) * (1 - st.gust * 0.1));
    halo.setPosition(ox, M.Y(oyGame))
      .setScale(clamp((1.3 + 0.5 * st.torch) * K * (os / S), 0.3, 8)).setAlpha(0.05 + 0.08 * st.torch);

    torch.setPosition(light.x + 24 * K, light.y + 52 * K);
    torch.setAngle(-16 + Math.sin(time / 420) * 3 + st.wind * 5);
    flame.setPosition(torch.x + Math.sin(torch.rotation) * 28 * K, torch.y - 42 * K);
    flame.setAngle(Math.sin(time / 180) * 4 + st.wind * 7);
    flame.setScale((0.46 + 0.14 * Math.sin(time / 90)) * K * (0.68 + 0.42 * st.torch));
    flame.setAlpha(0.7 + 0.3 * st.torch);

    tallyT += dt;
    if (tallyT > 0.18) { tallyT = 0; drawTally(); }

    if (!st.warned && st.time > 3.4) {
      st.warned = true;
      scene.notice('drag to lay the line — one stroke, no lifting', 2800);
    }

    scene.hud({
      score: st.murals,
      progress: st.torch,
      hearts: Math.max(0, st.hearts),
      extra: st.torch < 0.2 ? 'from memory'
        : stroke.ruined || st.bleed > 0.4 ? 'pigment running'
          : st.stall > 0.4 ? 'stalling'
            : steady ? 'torch close'
              : st.gust > 0.4 ? 'wind in the cave'
                : cov > minCov() && fid > minFid() ? 'almost the shape'
                  : 'steady and even'
    });
    scene.audio.setTension(st.torch < 0.25 ? 0.7 : st.torch < 0.5 ? 0.35 : 0.1);

    if (st.torch <= 0) {
      if (cov >= minCov() * 0.72 && fid >= minFid() * 0.8) st.murals++;
      else if (cov > 0.25) st.blotch++;
      end();
    }
  }

  function end() {
    if (st.over) return;
    st.over = true;
    stroke.active = false;
    stroke.pts = [];
    liveG.clear();
    const win = st.murals >= STAR[0];
    scene.finish(win, {
      score: st.murals,
      note: win
        ? `${st.murals} of the herd stand on the rock with the last of the light`
        : `${st.murals} on the wall and the rest still asleep in it`
    });
  }

  /* ----------------------------------------------------------- debug api */
  return {
    update,

    state: () => ({
      murals: st.murals, animal: animal.name, level: st.level, index: st.index,
      coverage: Number((st.covered / SAMPLES).toFixed(3)),
      fidelity: Number((st.covered > 0 ? st.qsum / st.covered : 0).toFixed(3)),
      hearts: st.hearts, torch: Number(st.torch.toFixed(3)),
      bleed: Number(st.bleed.toFixed(3)), stall: Number(st.stall.toFixed(2)),
      gust: Number(st.gust.toFixed(2)), wind: Number(st.wind.toFixed(2)),
      drawing: stroke.active, dead: stroke.dead, running: stroke.ruined,
      strokeLen: Math.round(stroke.len / os),
      strokeQ: Number(Math.min(1, stroke.marked / Math.max(1, stroke.pts.length)).toFixed(2)),
      speed: Math.round(stroke.speed / os),
      accepted: st.accepted, ruined: st.ruined, smudges: st.smudges, blotch: st.blotch,
      crack: st.crackOn, crackSegments: Math.max(0, crackPx.length - 1), crackHits: st.crackHits,
      guide: Number(guideG.alpha.toFixed(2)), over: st.over, time: Number(st.time.toFixed(2)),
      minCov: Number(minCov().toFixed(2)), minFid: Number(minFid().toFixed(2)),
      scale: Number(os.toFixed(3)), onWall: used.length,
      at: [Math.round(ox), Math.round(M.Y(oyGame))]
    }),

    guidePts: (stride = 8) => guide.filter((_, i) => i % stride === 0),
    guideFull: () => guide.slice(),
    crackPts: () => crack.slice(),
    muralInfo: () => ({ animal: animal.name, ox, oy: M.Y(oyGame), os, S, len: Math.round(animal.len) }),

    pageOf: (ax, ay) => {
      const p = art2px(ax, ay, ox, os);
      const cv = scene.game.canvas;
      const rect = cv.getBoundingClientRect();
      return { x: rect.left + p.x * (rect.width / cv.width), y: rect.top + p.y * (rect.height / cv.height) };
    },

    strokeThrough: (pts, opts = {}) => paintAtSpeed(pts, opts),

    traceGuide: (opts = {}) => paintAtSpeed(
      opts.offset ? guide.map(([x, y]) => [x + opts.offset, y + (opts.dy || 0)]) : guide,
      { speed: opts.speed || 260, stride: opts.stride || 2 }),

    lift: () => finishStroke(stroke.pts, 'lift'),
    setHearts: (n) => { st.hearts = n; drawTally(); },
    setTorch: (v) => { st.torch = clamp(v, 0, 1); },
    setMurals: (n) => { st.murals = n; st.level = n; },
    setCrack: (on) => { st.crackOn = !!on; placeCrack(); },
    abandon: () => giveUp(),
    newMural: () => nextMural(),
    finishGame: () => end()
  };
}

export default {
  id: 'cave-line', stars: STAR, unit: 'murals', backdrop: false,
  create, update: (scene, t, d) => scene.gameObj.update(t, d)
};
