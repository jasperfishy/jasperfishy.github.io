// Star Path — the herd walks the line a turning star draws.
// One true mark in a sky that wheels, cloud that wipes the stars out region by
// region, a called line the herd converges on with real weight, and miles that
// only count along the bearing you can actually see.

import { W, canvasTex, grain, rng, clamp, lerp, MOODS } from '../engine.js?v=du-cd75bb4cc7df44ba';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const PAL = MOODS.night;
const SPAN = 168;                  // degrees of azimuth shown across the stage
const PXDEG = W / SPAN;
const HOR = 414;                   // stage y of the horizon the line converges on
const FAR_Y = 436, NEAR_Y = 528;   // the herd band
const SKY_TOP = 12, SKY_BOT = 410; // stage y for altitude 1 and 0
const NEED = 26, RUN = 100, BASE = 0.36;
const STAR = [8, 15, 24];
const EDGE = 5.2, WARN = 3.4, PXMI = 58;
const REMEMBER = 7.4;              // seconds a bearing can be held without being seen
const TURN = 3.2, DAMP = 2.7, MAXV = 74;

const wrap180 = (d) => ((d + 540) % 360) - 180;
const norm360 = (d) => ((d % 360) + 360) % 360;

/* ---------------------------------------------------------------------- art */
function art(scene) {
  // own night sheet: the shared night backdrop bakes a low sun bloom into the
  // sky, and there is no sun in a sky you navigate by — this one is cold, deep
  // and brightest only where the plain meets the horizon
  const MM = scene.M, hy = (MM.top + HOR * MM.band) / MM.H;
  canvasTex(scene, 'sp-sky', W, MM.H, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#03070d');
    g.addColorStop(Math.max(0.05, hy * 0.4), '#071420');
    g.addColorStop(Math.max(0.2, hy * 0.72), '#0d2130');
    g.addColorStop(Math.max(0.3, hy * 0.94), '#173243');
    g.addColorStop(Math.min(0.99, hy + 0.01), '#1d3b4a');
    g.addColorStop(1, '#0a1720');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.save();
    c.translate(w * 0.4, h * hy * 0.42); c.rotate(-0.46);
    const bh = Math.max(26, h * 0.09);
    const band = c.createLinearGradient(0, -bh, 0, bh);
    band.addColorStop(0, 'rgba(126,166,188,0)');
    band.addColorStop(0.5, 'rgba(150,196,224,0.07)');
    band.addColorStop(1, 'rgba(126,166,188,0)');
    c.fillStyle = band; c.fillRect(-w, -bh, w * 2, bh * 2);
    c.restore();
    grain(c, w, h, 0.013, 991);
  });

  canvasTex(scene, 'sp-flare', 96, 96, (c) => {
    const core = c.createRadialGradient(48, 48, 0.5, 48, 48, 19);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(0.3, 'rgba(226,244,255,0.8)');
    core.addColorStop(0.7, 'rgba(160,206,240,0.22)');
    core.addColorStop(1, 'rgba(140,190,230,0)');
    c.fillStyle = core; c.beginPath(); c.arc(48, 48, 19, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter';
    [[48, 6, 48, 90, 2.4], [6, 48, 90, 48, 2.4], [20, 20, 76, 76, 1.3], [76, 20, 20, 76, 1.3]]
      .forEach(([x1, y1, x2, y2, lw]) => {
        const g = c.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, 'rgba(214,240,255,0)');
        g.addColorStop(0.5, 'rgba(236,250,255,0.9)');
        g.addColorStop(1, 'rgba(214,240,255,0)');
        c.strokeStyle = g; c.lineWidth = lw;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      });
    c.globalCompositeOperation = 'source-over';
  });

  // the bracket that says "this one is the mark the herd follows"
  canvasTex(scene, 'sp-mark', 72, 72, (c) => {
    c.strokeStyle = 'rgba(143,208,255,0.95)'; c.lineWidth = 3; c.lineCap = 'round';
    for (let q = 0; q < 4; q++) {
      const a = (q * Math.PI) / 2;
      const x = 36 + Math.cos(a) * 26, y = 36 + Math.sin(a) * 26;
      const t = a + Math.PI / 2;
      c.beginPath();
      c.moveTo(x - Math.cos(t) * 9, y - Math.sin(t) * 9);
      c.lineTo(x, y);
      c.lineTo(x + Math.cos(t) * 9, y + Math.sin(t) * 9);
      c.stroke();
    }
    c.strokeStyle = 'rgba(143,208,255,0.28)'; c.lineWidth = 1.4;
    c.beginPath(); c.arc(36, 36, 26, 0, TAU); c.stroke();
  });

  // a bank that really erases what is behind it: dense cold middle, feathered
  // edge, only a thin rim where the sky still shines through
  canvasTex(scene, 'sp-bank', 560, 240, (c, w, h) => {
    const rand = rng(8821);
    for (let i = 0; i < 52; i++) {
      const x = 36 + rand() * 488;
      const y = 122 + (rand() + rand() + rand() - 1.5) * 66;
      const rr = 24 + rand() * 54;
      const g = c.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, 'rgba(36,54,70,0.9)');
      g.addColorStop(0.5, 'rgba(27,43,58,0.55)');
      g.addColorStop(1, 'rgba(24,38,52,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const x = 60 + rand() * 440, y = 62 + rand() * 34, rr = 16 + rand() * 34;
      const g = c.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, 'rgba(150,206,252,0.12)');
      g.addColorStop(1, 'rgba(150,206,252,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'destination-out';
    [[0, 44], [200, 240]].forEach(([y0, y1]) => {
      const g = c.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, y0 === 0 ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)');
      g.addColorStop(1, y0 === 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)');
      c.fillStyle = g; c.fillRect(0, y0, w, y1 - y0);
    });
    [[0, 62], [w, w - 62]].forEach(([a, b]) => {
      const g = c.createLinearGradient(a, 0, b, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(Math.min(a, b), 0, Math.abs(b - a), h);
    });
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, 0.02, 441);
  });

  // the herd itself: long-necks in three gaits, rim-lit by the star they follow
  const beast = (key, w, h, stride, reach) => {
    canvasTex(scene, key, w, h, (c) => {
      const u = w / 160;
      c.lineCap = 'round';
      c.fillStyle = 'rgba(3,10,15,0.42)';
      c.beginPath(); c.ellipse(80 * u, 126 * u, 40 * u, 6 * u, 0, 0, TAU); c.fill();
      [[58, 86, 46 + stride * 14], [70, 88, 60 - stride * 10],
        [94, 88, 106 + stride * 10], [106, 86, 120 - stride * 14]].forEach(([hx, hy, fx]) => {
          c.strokeStyle = '#122a36'; c.lineWidth = 9 * u;
          c.beginPath(); c.moveTo(hx * u, hy * u);
          c.quadraticCurveTo((hx + 3) * u, (hy + 20) * u, fx * u, 124 * u); c.stroke();
          c.fillStyle = '#0a1720';
          c.beginPath(); c.ellipse(fx * u, 124 * u, 6 * u, 2.6 * u, 0, 0, TAU); c.fill();
        });
      const body = c.createLinearGradient(44 * u, 40 * u, 118 * u, 92 * u);
      body.addColorStop(0, '#1b3644'); body.addColorStop(0.55, '#122735'); body.addColorStop(1, '#08151d');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(80 * u, 66 * u, 36 * u, 23 * u, -0.06, 0, TAU); c.fill();
      c.fillStyle = '#1b3543';
      for (let i = 0; i < 4; i++) {
        const x = 58 + i * 13;
        c.beginPath(); c.moveTo(x * u, 49 * u);
        c.quadraticCurveTo((x + 5) * u, 37 * u, (x + 11) * u, 48 * u); c.closePath(); c.fill();
      }
      c.fillStyle = 'rgba(126,166,188,0.14)';
      c.beginPath(); c.ellipse(82 * u, 84 * u, 26 * u, 6 * u, 0, 0, TAU); c.fill();
      c.strokeStyle = '#152e3b'; c.lineWidth = 6 * u;
      c.beginPath(); c.moveTo(46 * u, 58 * u);
      c.quadraticCurveTo(26 * u, (64 + stride * 7) * u, 13 * u, 80 * u); c.stroke();
      const nx = 106 * u, ny = 52 * u, hx = (130 + reach * 7) * u, hy = (15 + reach * 19) * u;
      c.strokeStyle = '#1d3a49'; c.lineWidth = 12 * u;
      c.beginPath(); c.moveTo(nx, ny); c.quadraticCurveTo(126 * u, 30 * u, hx, hy); c.stroke();
      c.fillStyle = '#25485c';
      c.beginPath(); c.ellipse(hx + 4 * u, hy - 1 * u, 10 * u, 6.5 * u, -0.3 + reach * 0.3, 0, TAU); c.fill();
      c.fillStyle = '#0d2029';
      c.beginPath(); c.ellipse(hx + 11 * u, hy + 2 * u, 5 * u, 3 * u, 0.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(226,244,255,0.7)';
      c.beginPath(); c.arc(hx + 5 * u, hy - 3 * u, 1.6 * u, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(143,208,255,0.26)'; c.lineWidth = 1.8 * u;
      c.beginPath(); c.ellipse(80 * u, 66 * u, 35 * u, 22 * u, -0.06, Math.PI * 1.08, Math.PI * 1.78);
      c.stroke();
      c.strokeStyle = 'rgba(143,208,255,0.15)'; c.lineWidth = 1.6 * u;
      c.beginPath(); c.moveTo(nx, ny); c.quadraticCurveTo(126 * u, 30 * u, hx, hy); c.stroke();
      grain(c, w, h, 0.03, 17 + stride * 5 + reach);
    });
  };
  beast('sp-herd-a', 160, 130, 0, 0);
  beast('sp-herd-b', 160, 130, 1, 0);
  beast('sp-herd-c', 160, 130, 0, 1);
  beast('sp-calf', 96, 78, 1, 0);

  // the far edge of the plain: dunes that slide past as the herd turns. their
  // base is the ground colour and their ends feather out, so no wall appears
  canvasTex(scene, 'sp-dune', 320, 120, (c) => {
    const rand = rng(6051);
    const crest = [];
    for (let i = 0; i <= 16; i++) crest.push(46 + rand() * 34);
    const ridge = () => {
      c.moveTo(0, crest[0]);
      for (let i = 1; i <= 16; i++) {
        const px = i * 20;
        c.quadraticCurveTo(px - 10, (crest[i - 1] + crest[i]) / 2 - 5, px, crest[i]);
      }
    };
    const g = c.createLinearGradient(0, 40, 0, 120);
    g.addColorStop(0, '#182e3d'); g.addColorStop(0.5, '#132534'); g.addColorStop(1, '#1b323f');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, 120); ridge(); c.lineTo(320, 120); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(143,208,255,0.13)'; c.lineWidth = 1.4;
    c.beginPath(); ridge(); c.stroke();
    c.globalCompositeOperation = 'destination-out';
    [[0, 58], [320, 262]].forEach(([a, b]) => {
      const gg = c.createLinearGradient(a, 0, b, 0);
      gg.addColorStop(0, 'rgba(0,0,0,1)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gg; c.fillRect(Math.min(a, b), 0, Math.abs(b - a), 120);
    });
    c.globalCompositeOperation = 'source-over';
    grain(c, 320, 120, 0.03, 6052);
  });
}

/* ------------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M, K = scene.k, P = M.portrait;
  art(scene);
  scene.add.image(0, 0, 'sp-sky').setOrigin(0).setDepth(-19.5);
  const r = rng(20261127);
  const col = (h) => Phaser.Display.Color.HexStringToColor(h).color;
  const accent = col(PAL.accent), mistCol = col(PAL.mist), moteCol = col(PAL.motes);
  // the engine's decorative haze is atmosphere, not an occluder: it must never
  // read as a glowing fog bank in a sky where cloud cover is the real mechanic
  if (scene._clouds) scene._clouds.forEach((c) => { c.setAlpha(c.alpha * 0.26); c.setDepth(-19); });

  const altY = (a) => M.Y(lerp(SKY_BOT, SKY_TOP, clamp(a, 0, 1)));
  const altStage = (a) => lerp(SKY_BOT, SKY_TOP, clamp(a, 0, 1));

  /* ---- the sky: the mark turns, everything turns with it ---------------- */
  const mk = (off, alt, mag, kind) => ({ off, alt, mag, kind, tw: r() * TAU });
  const trueStar = mk(0, 0.66, 1, 'true');
  const marks = [mk(27, 0.6, 0.62, 'mark'), mk(-21, 0.75, 0.58, 'mark'), mk(9, 0.86, 0.52, 'mark')];
  const decoys = [
    mk(-54, 0.44, 0.86, 'decoy'), mk(63, 0.72, 0.78, 'decoy'), mk(118, 0.36, 0.72, 'decoy'),
    mk(-133, 0.68, 0.8, 'decoy'), mk(166, 0.58, 0.68, 'decoy'), mk(-8, 0.26, 0.64, 'decoy')
  ];
  const bright = [trueStar].concat(marks, decoys);
  const field = [];
  for (let i = 0; i < (P ? 200 : 150); i++) {
    field.push({ off: r() * 360, alt: 0.1 + r() * 0.88, mag: 0.12 + r() * 0.4, tw: r() * TAU });
  }

  /* ---- cloud banks: each sweeps the star field at its own rate ----------- */
  const banks = [
    { off: 118, rel: 9, alt: 0.66, hAlt: 0.14, wAz: 30, a: 0.95 },
    { off: 262, rel: -13, alt: 0.62, hAlt: 0.1, wAz: 21, a: 0.86 },
    { off: 44, rel: 6.2, alt: 0.9, hAlt: 0.12, wAz: 42, a: 0.7 },
    { off: 190, rel: -7.4, alt: 0.34, hAlt: 0.11, wAz: 34, a: 0.78 },
    { off: 320, rel: 5.2, alt: 0.13, hAlt: 0.09, wAz: 48, a: 0.62 }
  ];
  if (P) banks.push({ off: 8, rel: -16, alt: 0.82, hAlt: 0.1, wAz: 24, a: 0.8 });
  banks.forEach((b, i) => {
    b.img = scene.add.image(0, 0, 'sp-bank').setDepth(-13).setAlpha(b.a * 0.8)
      .setTint(i % 2 ? 0x9db8cc : 0x7f9db4).setFlipX(i % 3 === 1);
    b.wob = r() * TAU;
  });

  /* ---- herd, line, ground ------------------------------------------------- */
  const herd = { heading: 214, target: 214, hvel: 0 };
  const st = {
    t: 0, az: 214, omega: 3, err: 0, miles: 0, drift: 0, spread: 0, hearts: 3,
    cover: 0, observable: true, inFrame: true, memory: 1, remembered: 214, memErr: 0,
    calls: 0, turnLoad: 0, prevCall: -9, exposure: 0, warned: false, hazCd: 0,
    mark: 0, hazards: [], strayAt: 0, over: false, clock: 1, emerged: 0
  };
  const aim = { px: W / 2 };
  const crew = [];
  for (let i = 0; i < 9; i++) {
    const lane = (i % 3) - 1, row = Math.floor(i / 3);
    crew.push({
      lane, row, dist: clamp(0.94 - row * 0.26 - r() * 0.06, 0.05, 0.98),
      tau: 1.1 + r() * 3.4, h: herd.heading, peel: lane * 14, ph: r() * 6, calf: i === 8, img: null
    });
  }

  const gridG = scene.add.graphics().setDepth(-18);
  const fieldG = scene.add.graphics().setDepth(-17);
  const linkG = scene.add.graphics().setDepth(-16);
  const trailG = scene.add.graphics().setDepth(-15.8);
  const ghostG = scene.add.graphics().setDepth(-15.6);
  const lineG = scene.add.graphics().setDepth(8);
  const hazG = scene.add.graphics().setDepth(9);
  const hazeG = scene.add.graphics().setDepth(10);
  const flare = bright.map((s) => ({
    s, img: scene.add.image(0, 0, 'sp-flare').setDepth(-15).setBlendMode(Phaser.BlendModes.ADD)
  }));
  const halo = scene.add.image(0, 0, 'arc-glow').setDepth(-15.4).setBlendMode(Phaser.BlendModes.ADD)
    .setTint(accent).setAlpha(0.4).setScale(P ? 0.95 : 0.72);
  const ring = scene.add.image(0, 0, 'sp-mark').setDepth(-14.6).setAlpha(0.9)
    .setScale(P ? 1.5 : 1).setBlendMode(Phaser.BlendModes.ADD);
  const ghost = scene.add.image(0, 0, 'sp-mark').setDepth(-14.5).setAlpha(0)
    .setScale(P ? 1.3 : 0.9).setTint(mistCol).setBlendMode(Phaser.BlendModes.ADD);
  const camps = [0, 1].map((i) => scene.add.image(i ? W - 12 : 12, M.Y(HOR + 4), 'arc-glow')
    .setDepth(-11).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffb070).setAlpha(0)
    .setScale(P ? 0.7 : 0.5));
  const dunes = [];
  for (let i = 0; i < 5; i++) {
    dunes.push({
      off: r() * 360, img: scene.add.image(0, 0, 'sp-dune').setOrigin(0.5, 1).setDepth(-10.5)
        .setScale(P ? 1.4 : 1.05, P ? 1.05 : 0.52).setAlpha(0.94)
    });
  }
  crew.forEach((m) => {
    m.img = scene.add.image(0, 0, m.calf ? 'sp-calf' : 'sp-herd-a').setDepth(12)
      .setOrigin(0.5, 0.954).setScale(0.6 * K);
  });
  const dust = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 14, max: 62 }, angle: { min: 244, max: 296 }, lifespan: { min: 460, max: 1040 },
    scale: { start: 0.55, end: 0 }, alpha: { start: 0.26, end: 0 },
    tint: [mistCol, 0x2c4a58], emitting: false
  }).setDepth(11);
  const chev = scene.add.image(0, 0, 'sp-flare').setDepth(-14).setVisible(false)
    .setTint(accent).setScale(0.5).setBlendMode(Phaser.BlendModes.ADD);

  const labels = [];
  ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'].forEach((n, i) => {
    const el = scene.add.text(0, M.Y(HOR + 8), n, {
      fontFamily: "'Iowan Old Style','Palatino Linotype',Georgia,serif",
      fontSize: Math.round((P ? 16 : 13) * K) + 'px', color: '#9ec6dd',
      stroke: '#0a161f', strokeThickness: 3
    }).setOrigin(0.5, 0).setDepth(11.5).setAlpha(0.4);
    labels.push({ az: 90 + i * 45, el });
  });

  /* --------------------------------------------------------------- mapping */
  const sxOf = (off) => W / 2 + wrap180(st.az + off - herd.heading) * PXDEG;
  const sxOfAz = (az) => W / 2 + wrap180(az - herd.heading) * PXDEG;
  const coverOf = (off, alt) => {
    let clear = 1;
    for (let i = 0; i < banks.length; i++) {
      const b = banks[i];
      const dx = wrap180(b.off - off) / b.wAz, dy = (b.alt - alt) / b.hAlt;
      clear *= 1 - Math.pow(clamp(1 - Math.hypot(dx, dy), 0, 1), 0.8);
    }
    return 1 - clear;
  };
  const aimAz = () => norm360(herd.heading + (clamp(aim.px, 0, W) - W / 2) / PXDEG);
  const pagePoint = (gx, gy) => {
    const rect = scene.game.canvas.getBoundingClientRect();
    return { x: rect.left + (gx / W) * rect.width, y: rect.top + (M.Y(gy) / M.H) * rect.height };
  };

  /* ---------------------------------------------------------------- calls */
  function doCall(az) {
    if (st.over) return 0;
    const d = Math.abs(wrap180(az - herd.target));
    herd.target = norm360(az);
    st.calls++; st.turnLoad = Number(d.toFixed(2));
    const over = Math.max(0, d - 14);
    if (d > 9 && st.t - st.prevCall < 0.9) st.spread = clamp(st.spread + 0.02, 0, 1);
    st.prevCall = st.t;
    st.spread = clamp(st.spread + 0.00062 * over * over, 0, 1);
    if (d > 26) {
      scene.sfx('whoosh');
      crew.forEach((m) => { if (Math.abs(m.lane) > 0.4 || m.calf) m.peel += m.lane * (9 + r() * 15); });
      if (d > 44) scene.popText(W / 2 + st.drift * PXMI, M.Y(HOR + 70), 'the herd breaks', '#ffcfae');
    } else {
      scene.sfx(Math.abs(wrap180(az - st.az)) < 7 ? 'drum3' : 'tick');
    }
    const onDecoy = decoys.some((dc) => Math.abs(wrap180(st.az + dc.off - az)) < 4);
    if (onDecoy && Math.abs(wrap180(st.az - az)) > 12) {
      scene.notice('that one is brighter than the grass star, and it lies', 1900);
    }
    return d;
  }

  scene.input.on('pointermove', (p) => { aim.px = p.x; });
  scene.input.on('pointerdown', (p) => { aim.px = p.x; doCall(aimAz()); });
  scene.input.keyboard.on('keydown-SPACE', () => doCall(aimAz()));
  scene.input.keyboard.on('keydown-ENTER', () => doCall(aimAz()));
  const keys = scene.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D' });

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'the grass star wheels — keep it above the herd' });
  scene.notice('find the bracketed star, point at it, tap to call the turn', 3200);

  /* -------------------------------------------------------------- physics */
  function hazard(side) {
    st.hearts--; st.hazCd = 2.6; st.hazards.push(Math.round(st.t));
    st.miles = Math.max(0, st.miles - 2.5);
    st.drift = side * 2.1; st.spread = clamp(st.spread + 0.22, 0, 1);
    st.warned = false;
    const gx = W / 2 + side * (EDGE * PXMI - 30);
    scene.sfx(side > 0 ? 'splash' : 'boom'); scene.sfx('hurt');
    scene.shake(320, 0.016);
    scene.cameras.main.flash(240, side > 0 ? 70 : 150, side > 0 ? 130 : 110, side > 0 ? 150 : 110);
    scene.burst(gx, M.Y(HOR + 90), side > 0 ? accent : 0xc9b08a, 16,
      { life: 640, gravity: side > 0 ? -40 : 220, scale: 0.6 });
    scene.popText(gx, M.Y(HOR + 54), side > 0 ? 'the wash' : 'the scree', '#ffb1a1');
    if (st.hearts <= 0) finish(false, side);
    else scene.notice(side > 0
      ? 'the salt wash took the stragglers — ' + st.hearts + ' hearts left'
      : 'the scree slope broke the herd up — ' + st.hearts + ' hearts left', 2300);
  }

  function finish(win, side) {
    if (st.over) return;
    st.over = true;
    const m = Math.round(st.miles);
    scene.finish(win, {
      score: m,
      note: win
        ? m + ' miles on the star line and the grass is under them'
        : st.hearts <= 0
          ? 'led ' + m + ' miles before the ' + (side > 0 ? 'wash' : 'scree') + ' took the herd'
          : 'the night turned and ' + m + ' miles was all the line would give'
    });
  }

  function physics(h) {
    st.t += h;
    st.omega = 3 + 1.5 * clamp(st.miles / NEED, 0, 1);
    st.az = norm360(st.az + st.omega * h);
    banks.forEach((b) => { b.off = norm360(b.off + b.rel * h); });

    // the herd turns with weight: it leans into the called line, overshoots, settles
    const tErr = wrap180(herd.target - herd.heading);
    herd.hvel = clamp(herd.hvel + tErr * TURN * h - herd.hvel * DAMP * h, -MAXV, MAXV);
    herd.heading = norm360(herd.heading + herd.hvel * h);
    st.err = wrap180(st.az - herd.heading);

    const cov = coverOf(0, trueStar.alt);
    st.cover = Number(cov.toFixed(3));
    st.inFrame = Math.abs(st.err) < SPAN / 2 - 6;
    const obs = st.inFrame && cov < 0.5;
    if (obs !== st.observable) {
      if (obs) {
        scene.sfx('chime'); st.emerged = st.t;
        scene.popText(sxOf(0), altY(trueStar.alt) - 16 * M.band, 'there it is', '#dff0ff');
      } else scene.sfx('whoosh');
    }
    st.observable = obs;
    if (obs) { st.memory = 1; st.remembered = st.az; }
    else st.memory = clamp(st.memory - h / REMEMBER, 0, 1);
    st.memErr = Math.abs(wrap180(st.az - st.remembered));

    const coh = 1 - st.spread;
    const spd = BASE * (0.55 + 0.45 * coh);
    const ce = Math.cos(st.err * D2R), se = Math.sin(st.err * D2R);
    st.miles = Math.min(NEED, st.miles + Math.max(0, ce) * spd * h);
    // off the line the herd keeps leaving, mile for mile: only steering back onto
    // the star line claws it in, so a bad bearing is a slow slide into the edges
    st.drift = clamp(st.drift + se * spd * h
      - st.drift * (0.018 + (Math.abs(st.err) < 12 ? 0.4 * coh : 0)) * h, -EDGE * 1.2, EDGE * 1.2);
    st.spread = clamp(st.spread + Math.abs(herd.hvel) * h * 0.0055
      + (Math.abs(st.err) > 52 ? h * 0.05 : 0)
      - h * (0.16 + (Math.abs(herd.hvel) < 4 ? 0.26 : 0)), 0, 1);

    // every animal comes around on its own rein, so a hard call strings them out
    crew.forEach((m) => {
      const lag = wrap180(herd.heading - m.h);
      m.h = norm360(m.h + lag * Math.min(0.9, h / m.tau));
      m.peel = clamp(m.peel * (1 - h / (1.6 + m.tau * 0.5)) - m.lane * h * 3, -74, 74);
      if (Math.abs(m.peel) > 60 && st.t > st.strayAt) {
        st.strayAt = st.t + 3;
        st.miles = Math.max(0, st.miles - 0.5);
        scene.sfx('land');
      }
    });

    st.exposure = Math.abs(st.drift) + st.spread * 1.7;
    st.hazCd = Math.max(0, st.hazCd - h);
    if (st.exposure > WARN && !st.warned) {
      st.warned = true; scene.sfx('drum4');
      scene.notice(st.drift > 0 ? 'the salt wash is close — bring them back left'
        : 'the scree is close — bring them back right', 2100);
    }
    if (st.exposure < WARN * 0.7) st.warned = false;
    if (st.exposure >= EDGE && st.hazCd <= 0) hazard(st.drift >= 0 ? 1 : -1);

    if (Math.floor(st.miles / 5) > st.mark) {
      st.mark = Math.floor(st.miles / 5);
      scene.sfx('good');
      scene.popText(W / 2 + st.drift * PXMI, M.Y(HOR + 40), st.miles.toFixed(0) + ' miles', '#ffe6a8');
      scene.notice(st.mark * 5 + ' miles kept on the line', 1500);
    }
    scene.audio.setTension(clamp(st.exposure / EDGE * 0.6 + (1 - coh) * 0.35 +
      (st.observable ? 0 : 0.16) + (3 - st.hearts) * 0.07, 0, 1));
    if (st.miles >= NEED) { finish(true); return; }
    if (st.t >= RUN) finish(st.miles >= STAR[0]);
  }

  /* -------------------------------------------------------------- drawing */
  function drawSky(time) {
    fieldG.clear(); linkG.clear(); trailG.clear(); ghostG.clear(); gridG.clear();

    gridG.lineStyle(1, mistCol, 0.09);
    [0.25, 0.5, 0.75].forEach((a) => {
      gridG.beginPath(); gridG.moveTo(0, altY(a)); gridG.lineTo(W, altY(a)); gridG.strokePath();
    });
    for (let d = -80; d <= 80; d += 10) {
      const x = W / 2 + d * PXDEG, tall = d % 30 === 0;
      gridG.lineStyle(1, mistCol, tall ? 0.16 : 0.08);
      gridG.beginPath();
      gridG.moveTo(x, M.Y(HOR));
      gridG.lineTo(x, M.Y(HOR - (tall ? 15 : 8) * (P ? 1.5 : 1)));
      gridG.strokePath();
    }

    for (let i = 0; i < field.length; i++) {
      const s = field[i], dx = wrap180(st.az + s.off - herd.heading);
      if (Math.abs(dx) > SPAN / 2) continue;
      const tw = 0.62 + 0.38 * Math.sin(time / 620 + s.tw);
      fieldG.fillStyle(moteCol, clamp(0.16 + s.mag * 0.7, 0, 0.8) * tw * (1 - coverOf(s.off, s.alt)));
      fieldG.fillCircle(W / 2 + dx * PXDEG, altY(s.alt), 0.7 + s.mag * 2.2);
    }

    // where the mark has been in the last few seconds: the sky is turning
    const vis0 = st.cover < 0.5 && st.inFrame;
    if (vis0) {
      for (let k = 1; k <= 7; k++) {
        const past = k * 2.2;
        const dx = wrap180(st.az - st.omega * past - herd.heading);
        if (Math.abs(dx) > SPAN / 2) break;
        trailG.fillStyle(moteCol, (0.3 - k * 0.035) * (1 - st.cover));
        trailG.fillCircle(W / 2 + dx * PXDEG, altY(trueStar.alt), 1.8 - k * 0.14);
      }
    }

    banks.forEach((b, i) => {
      const dx = wrap180(st.az + b.off - herd.heading);
      const x = W / 2 + dx * PXDEG;
      b.img.x = x;
      b.img.y = altY(b.alt) + Math.sin(time / (3200 + i * 700) + b.wob) * (P ? 7 : 4) * M.band;
      b.img.setDisplaySize(Math.abs(2 * b.wAz * PXDEG * 1.45), 2 * b.hAlt * (SKY_BOT - SKY_TOP) * M.band * 2.1);
      b.img.setAlpha(b.a * (0.72 + 0.22 * Math.sin(time / 4200 + b.wob)));
    });

    dunes.forEach((d, i) => {
      const x = sxOf(d.off);
      d.img.x = x;
      d.img.y = M.Y(HOR + 6 + (i % 2) * 4);
      d.img.setAlpha(Math.abs(wrap180(st.az + d.off - herd.heading)) < SPAN / 2 + 22 ? 0.95 : 0);
    });

    flare.forEach((f) => {
      const s = f.s, dx = wrap180(st.az + s.off - herd.heading);
      const c = coverOf(s.off, s.alt);
      const vis = (1 - clamp(c * 1.06, 0, 1)) * (Math.abs(dx) < SPAN / 2 ? 1 : 0);
      const tw = 0.72 + 0.28 * Math.sin(time / (s.kind === 'true' ? 460 : 780) + s.tw);
      f.img.x = W / 2 + dx * PXDEG;
      f.img.y = altY(s.alt);
      f.img.visible = vis > 0.02;
      f.img.setAlpha(vis * (0.4 + s.mag * 0.6) * tw);
      const sc = (s.kind === 'true' ? 1.55 : 0.9 + s.mag * 0.5) * (P ? 1.5 : 1);
      f.img.setScale(sc * (s.kind === 'true' ? 1 + 0.05 * Math.sin(time / 700) : 1));
    });

    // the shape of the mark: three stars that turn rigidly with it, so a
    // covered one can be read off the neighbours
    marks.forEach((m) => {
      if (coverOf(m.off, m.alt) >= 0.5) return;
      const on = Math.abs(wrap180(st.az + m.off - herd.heading)) < SPAN / 2 && st.inFrame;
      if (!on) return;
      linkG.lineStyle(1.2, mistCol, 0.26);
      linkG.beginPath();
      linkG.moveTo(sxOf(0), altY(trueStar.alt));
      linkG.lineTo(sxOf(m.off), altY(m.alt));
      linkG.strokePath();
    });

    const tx = sxOf(0), ty = altY(trueStar.alt);
    // the bracket and the trail fade with the star itself, so an empty bracket
    // never claims a mark the sky is still wiping out
    const sv = (1 - clamp(st.cover * 1.06, 0, 1)) * (st.inFrame ? 1 : 0);
    halo.x = tx; halo.y = ty; halo.visible = sv > 0.02;
    halo.setAlpha(sv * (0.3 + 0.14 * Math.sin(time / 900)));
    ring.x = tx; ring.y = ty; ring.visible = sv > 0.02;
    ring.setAngle(time / 40);
    ring.setAlpha(sv * (0.62 + 0.22 * Math.sin(time / 620)));

    const gv = !st.observable && st.memory > 0.02 && st.inFrame;
    const rx = sxOfAz(st.remembered);
    ghost.visible = gv; ghost.x = rx; ghost.y = ty;
    ghost.setAlpha(gv ? st.memory * 0.55 : 0);
    ghost.setAngle(-time / 70);
    if (gv) {
      const fan = (1 - st.memory) * 24 * PXDEG + 12;
      ghostG.lineStyle(1.4, mistCol, 0.14 + 0.14 * (1 - st.memory));
      [-1, 1].forEach((k) => {
        ghostG.beginPath();
        ghostG.moveTo(rx + k * 10, ty - 24 * M.band);
        ghostG.lineTo(rx + k * fan, M.Y(HOR));
        ghostG.strokePath();
      });
    }

    if (!st.inFrame) {
      const side = wrap180(st.az - herd.heading) > 0 ? 1 : -1;
      chev.setVisible(true).setAlpha(0.45 + 0.3 * Math.sin(time / 300));
      chev.x = side > 0 ? W - 20 : 20;
      chev.y = altY(trueStar.alt);
      chev.setFlipX(side < 0);
    } else chev.setVisible(false);

    // the fire they left is behind the herd, so it sits at both ends of the tape
    camps.forEach((e) => {
      e.y = M.Y(HOR + 4);
      e.setAlpha(0.14 + 0.06 * Math.sin(time / 1500));
    });

    labels.forEach((l) => {
      const dx = wrap180(l.az - herd.heading);
      l.el.x = W / 2 + dx * PXDEG;
      l.el.setAlpha(Math.abs(dx) < SPAN / 2 - 4 ? 0.44 : 0);
    });
  }

  function drawGround(time) {
    lineG.clear(); hazG.clear(); hazeG.clear();
    const herdX = clamp(W / 2 + st.drift * PXMI, 44, W - 44);
    const footY = M.Y(NEAR_Y);
    const vx = W / 2 + st.err * PXDEG;                       // the star's own line
    const cx = W / 2 + wrap180(herd.target - herd.heading) * PXDEG;   // the line called
    const starY = altY(trueStar.alt);
    const vis = st.observable;

    // the way the herd is actually going, and the way being pointed
    lineG.lineStyle(1.6 * K, mistCol, 0.15);
    lineG.beginPath(); lineG.moveTo(herdX, footY); lineG.lineTo(W / 2, M.Y(HOR)); lineG.strokePath();
    const aimX = clamp(aim.px, 0, W);
    lineG.lineStyle(1.2 * K, mistCol, 0.24);
    lineG.beginPath(); lineG.moveTo(herdX, footY); lineG.lineTo(aimX, M.Y(HOR)); lineG.strokePath();
    if (Math.abs(wrap180(aimAz() - st.az)) < 7 && vis) {
      lineG.lineStyle(2.4 * K, accent, 0.45);
      lineG.beginPath(); lineG.moveTo(aimX, M.Y(HOR)); lineG.lineTo(aimX, starY); lineG.strokePath();
    }

    // where the mark actually stands right now, so the gap between that and the
    // line called is the staleness you have to correct for
    if (st.inFrame && st.cover < 0.86) {
      lineG.lineStyle(1.2 * K, moteCol, 0.22 * (1 - st.cover));
      lineG.beginPath(); lineG.moveTo(vx, M.Y(HOR)); lineG.lineTo(vx, starY); lineG.strokePath();
    }

    // the called line: a beam running from under the herd up the sky it was aimed at
    const beamA = vis ? 0.52 : 0.18 + st.memory * 0.24;
    lineG.fillStyle(accent, 0.09);
    lineG.beginPath();
    lineG.moveTo(cx - 3, M.Y(HOR)); lineG.lineTo(cx + 3, M.Y(HOR));
    lineG.lineTo(herdX + 34, footY); lineG.lineTo(herdX - 34, footY);
    lineG.closePath(); lineG.fill();
    lineG.lineStyle(2.2 * K, accent, beamA);
    lineG.beginPath();
    lineG.moveTo(herdX, footY); lineG.lineTo(clamp(cx, -60, W + 60), M.Y(HOR));
    lineG.lineTo(clamp(cx, -60, W + 60), starY);
    lineG.strokePath();
    lineG.fillStyle(accent, beamA * 0.7);
    const run = (time / 24) % 26;
    for (let k = 0; k < 9; k++) {
      const t0 = ((k * 26 + run) % 234) / 234;
      lineG.fillCircle(lerp(herdX, cx, t0), lerp(footY, M.Y(HOR), t0), 2.2 * K);
    }

    const near = clamp(st.exposure / EDGE, 0, 1.3);
    [1, -1].forEach((side) => {
      const inner = W / 2 + side * (EDGE * PXMI - 34 + (1 - clamp(near, 0, 1)) * 190);
      const tint = side > 0 ? 0x4f7f92 : 0x5d5346;
      hazG.fillStyle(tint, 0.22 + near * 0.18);
      hazG.beginPath();
      hazG.moveTo(inner, M.Y(HOR + 24));
      hazG.lineTo(side > 0 ? W : 0, M.Y(HOR + 2));
      hazG.lineTo(side > 0 ? W : 0, M.H);
      hazG.lineTo(inner + side * 40, M.H);
      hazG.closePath(); hazG.fill();
      const hot = side * st.drift > 0 ? near : near * 0.35;
      hazG.lineStyle(2.6 * K, side > 0 ? accent : 0xd8c08a, 0.16 + hot * 0.44);
      hazG.beginPath();
      for (let y = HOR + 28; y <= NEAR_Y + 12; y += 8) {
        const wob = side > 0 ? Math.sin(y * 0.12 + time / 210) * 6 : Math.sin(y * 0.2 + time / 760) * 3;
        const x = inner + wob * (P ? 1.4 : 1);
        if (y === HOR + 28) hazG.moveTo(x, M.Y(y)); else hazG.lineTo(x, M.Y(y));
      }
      hazG.strokePath();
      if (side > 0) {
        hazG.lineStyle(1.4 * K, accent, 0.1 + near * 0.2);
        for (let k = 0; k < 7; k++) {
          const yy = HOR + 44 + k * 17, xx = inner + 22 + ((time / 9 + k * 70) % 190);
          hazG.beginPath(); hazG.moveTo(xx, M.Y(yy)); hazG.lineTo(xx + 28, M.Y(yy)); hazG.strokePath();
        }
      } else {
        hazG.fillStyle(0x9fb0a8, 0.22);
        for (let k = 0; k < 18; k++) {
          const yy = HOR + 40 + (k * 47) % 120;
          hazG.fillCircle(inner + side * (18 + (k * 61) % 150), M.Y(yy), 2 + (k % 3) * 1.6);
        }
      }
    });

    hazeG.fillStyle(mistCol, 0.03 + st.spread * 0.06);
    hazeG.fillRect(0, M.Y(HOR + 16), W, M.H - M.Y(HOR + 16));

    // the wake: where the herd has already been walking on the line
    hazeG.lineStyle(2 * K, mistCol, 0.1);
    [-1, 1].forEach((k) => {
      hazeG.beginPath();
      hazeG.moveTo(herdX + k * 30 * K, M.Y(FAR_Y + 6));
      hazeG.lineTo(herdX + k * 78 * K, M.H);
      hazeG.strokePath();
    });
    // low ground detail, sliding past at the drift rate so turning reads on land too
    hazeG.fillStyle(0x0a161f, 0.85);
    for (let i = 0; i < 9; i++) {
      const depth = 0.35 + (i % 3) * 0.3;
      const bx = ((i * 137 + 30) % (W + 80)) - 40 - st.drift * PXMI * depth - herd.hvel * depth * 0.4;
      const by = M.Y(494 + (i % 4) * 14);
      const bw = (9 + (i % 5) * 5) * (P ? 1.5 : 1) * K;
      hazeG.beginPath();
      hazeG.moveTo(bx - bw, by);
      hazeG.lineTo(bx - bw * 0.4, by - bw * 0.5);
      hazeG.lineTo(bx + bw * 0.3, by - bw * 0.62);
      hazeG.lineTo(bx + bw, by);
      hazeG.closePath();
      hazeG.fill();
    }

    crew.forEach((m) => {
      const u = 1 - m.dist;                       // 0 = nearest the camera, 1 = ahead
      const y = lerp(M.Y(NEAR_Y), M.Y(FAR_Y), u);
      const x = lerp(herdX, W / 2, u);
      const lagPx = wrap180(herd.heading - m.h) * PXDEG * 0.4 * (1 - u * 0.5);
      const fan = (m.lane * 44 + m.peel * 0.55) * (0.42 + m.dist * 0.72) * (1 + st.spread * 2.6) * K;
      const px = clamp(x + fan + lagPx, 30, W - 30);
      const sc = (0.34 + m.dist * 0.2) * (m.calf ? 0.66 : 1) * K;
      const bob = Math.sin(time / (m.calf ? 250 : 340) + m.ph) * 2 * M.band;
      m.img.x = px; m.img.y = y + bob;
      m.img.setScale(sc);
      m.img.setDepth(12 + m.dist * 3);
      m.img.setTexture(m.calf ? 'sp-calf' : (Math.sin(time / 330 + m.ph) > 0 ? 'sp-herd-b' : 'sp-herd-a'));
      const lean = clamp(wrap180(herd.target - m.h) / 60, -1, 1);
      m.img.setAngle(lean * 4 + Math.sin(time / 900 + m.ph) * 0.8);
      m.img.setAlpha(st.spread > 0.7 && Math.abs(m.lane) > 0.4 ? 0.85 : 1);
      if (Math.random() < 0.08 * (0.5 + st.spread)) dust.explode(1, px, y + bob * 0.2);
    });
  }

  /* ---------------------------------------------------------------- update */
  function update(time, delta) {
    if (st.over) return;
    const step = Math.min(0.05, delta / 1000) * st.clock;
    const n = Math.max(1, Math.min(6, Math.ceil(step / 0.034)));
    for (let i = 0; i < n && !st.over; i++) physics(step / n);

    const sec = Math.min(0.05, delta / 1000);
    if (keys.left.isDown || keys.a.isDown) aim.px = clamp(aim.px - 430 * sec, 0, W);
    if (keys.right.isDown || keys.d.isDown) aim.px = clamp(aim.px + 430 * sec, 0, W);

    drawSky(time); drawGround(time);
    scene.hud({
      score: Math.round(st.miles),
      progress: clamp(st.miles / NEED, 0, 1),
      hearts: st.hearts,
      extra: st.exposure > WARN
        ? (st.drift > 0 ? 'off the line, and the wash is close' : 'off the line, and the scree is close')
        : !st.inFrame ? 'the grass star is clean out of the frame'
          : !st.observable ? (st.memory > 0.4 ? 'cloud over the mark — hold the bearing'
            : 'cloud over the mark, and the hold on it is gone')
            : st.spread > 0.55 ? 'the herd is strung out — call softer'
              : 'bearing ' + Math.round(st.az) + ' degrees, ' + Math.round(st.miles) + ' of ' + NEED + ' miles'
    });
  }

  return {
    update,
    state: () => ({
      score: Math.round(st.miles), miles: Number(st.miles.toFixed(2)), need: NEED,
      drift: Number(st.drift.toFixed(3)), spread: Number(st.spread.toFixed(3)),
      cohesion: Number((1 - st.spread).toFixed(3)), hearts: st.hearts,
      exposure: Number(st.exposure.toFixed(3)), edge: EDGE, warned: st.warned,
      heading: Number(herd.heading.toFixed(2)), target: Number(herd.target.toFixed(2)),
      hvel: Number(herd.hvel.toFixed(2)), aim: Number(aimAz().toFixed(2)),
      err: Number(st.err.toFixed(2)), turnLoad: st.turnLoad, calls: st.calls,
      trueStar: {
        az: Number(st.az.toFixed(2)), alt: trueStar.alt,
        x: Math.round(sxOf(0)), yStage: Math.round(altStage(trueStar.alt)),
        cover: st.cover, observable: st.observable, inFrame: st.inFrame
      },
      // the same reading, for the compass strip and the probe alike
      star: {
        az: Number(st.az.toFixed(2)), cover: st.cover, observable: st.observable,
        inFrame: st.inFrame
      },
      memory: { remembered: Number(st.remembered.toFixed(2)), held: Number(st.memory.toFixed(3)), staleBy: Number(st.memErr.toFixed(2)) },
      infer: (() => {
        const free = marks.filter((m) => coverOf(m.off, m.alt) < 0.5);
        return { possible: free.length > 0, neighbours: free.map((m) => Number(norm360(st.az + m.off).toFixed(2))) };
      })(),
      banks: banks.map((b) => ({
        az: Number(norm360(st.az + b.off).toFixed(1)), rel: b.rel, alt: b.alt,
        degFromStar: Number(Math.abs(wrap180(b.off)).toFixed(1))
      })),
      omega: Number(st.omega.toFixed(3)), t: Number(st.t.toFixed(2)),
      hazards: st.hazards.slice(), strays: Math.round(Math.max(0, st.t - st.strayAt) * 10) / 10,
      clouded: !st.observable, over: st.over, portrait: P, clock: st.clock
    }),
    setClock: (v) => { st.clock = clamp(Number(v) || 1, 0.2, 8); },
    trueBearing: () => Number(st.az.toFixed(2)),
    callTo: (az) => Number(doCall(norm360(Number(az) || 0)).toFixed(2)),
    aimTo: (az) => Math.round(clamp(W / 2 + wrap180((Number(az) || 0) - herd.heading) * PXDEG, 0, W)),
    starScreen: () => pagePoint(sxOf(0), altStage(trueStar.alt)),
    aimScreen: (az) => pagePoint(clamp(az === undefined ? aim.px
      : W / 2 + wrap180((Number(az) || 0) - herd.heading) * PXDEG, 0, W), HOR + 10),
    crewSpread: () => Number(st.spread.toFixed(4)),
    calm: () => st.spread < 0.14 && Math.abs(herd.hvel) < 5 && !st.over
  };
}

export default {
  id: 'star-path', unit: 'miles', stars: STAR, mood: 'night', create,
  backdropOpts: { noStars: true, sun: false, ridges: false },
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
