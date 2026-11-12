// Pack Draft — run at the back. Finish at the front.
// Eight runners, one trail, a wind that will not hold still, and a body that only
// gets its legs back inside somebody else's slipstream.

import { W, canvasTex, grain, rng, clamp, lerp, hashSeed, MOODS } from '../engine.js?v=du-316e7af9b57fa08e';

const COURSE = 460;                 // metres of trail
const DROP_M = 58;                  // this far off the leader and the run is over
const VMAX = 12.9;                  // m/s at a full effort in still air
const E_SETTLE = 0.34;              // pace when you are not holding on
const DRAIN_K = 11.8;               // stamina a second at a full effort, clean air
const REGEN_EASE = 0.46;            // under this effort the legs start coming back
const REGEN_K = 2.4;
const REGEN_DRAFT = 15.5;           // the pack is where the legs come back
const DRAFT_RELIEF = 0.84;          // a perfect pocket takes 84 percent of the cost
const POCKET_W = 0.21;              // how far off the line a pocket still works
const POCKET_MAX = 11.5;            // metres before the slipstream lets go
const LED_RATE = 0.12;              // paces a second per runner held behind
const PASS_PACES = 1.5;
const ME_LANE = 1.2;                // lanes a second under foot
const AI_LANE = 0.52;
const HEARTS = 3;
const ME_ID = 8;
const STAR = [12, 22, 34];
const TAU = Math.PI * 2;
const PAL = MOODS.dusk;
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];
const NAMES = ['Briar', 'Cinder', 'Gale', 'Marsh', 'Pell', 'Roan', 'Sable', 'Vane'];
const TINTS = [0xffffff, 0xd9c8b6, 0xc0c7cd, 0xe2cfa0, 0xcbb5c6, 0xb7c9ba, 0xd6bda8];
const SHAPES = [
  { bulk: 1.02, hide: ['#a08570', '#6e564a', '#3a2a26'], crest: '#e6ad66', mark: '#2a1d1c' },
  { bulk: 1.16, hide: ['#8d8d79', '#5e5f52', '#31332d'], crest: '#cfd8a6', mark: '#232620' },
  { bulk: 0.98, hide: ['#d59463', '#98552f', '#4c241c'], crest: '#ffd9a4', mark: '#3a1a12' }
];

/* how much of a slipstream a gap of g metres buys you — tuck in too close and there
   is no room left to work, drift away past POCKET_MAX and the air closes up again */
const gapCurve = (g) => {
  if (g < 0.85 || g > POCKET_MAX) return 0;
  const near = clamp((g - 0.45) / 0.55, 0, 1);
  const far = clamp((POCKET_MAX - g) / 5.5, 0, 1);
  return Math.min(near, far) * (0.62 + 0.38 * (1 - clamp(g / 8, 0, 1)));
};

/* ------------------------------------------------------------------- art */
function art(scene) {
  const rim = (c, w, h, rgb, seed, ga) => {
    c.globalCompositeOperation = 'source-atop';
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(' + rgb + ',0.3)'); g.addColorStop(0.62, 'rgba(' + rgb + ',0)');
    g.addColorStop(1, 'rgba(' + rgb + ',0.14)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    grain(c, w, h, ga, seed);
  };

  // profile view, three stride poses per body shape
  const side = (shape, pose) => {
    const S = SHAPES[shape];
    canvasTex(scene, 'pd-side-' + shape + '-' + pose, 124, 108, (c) => {
      const b = S.bulk;
      const bob = [0, -3.4, -0.8][pose];
      const lead = [1, 0, -1][pose];
      c.lineCap = 'round';
      const leg = (hx, kx, foot, colA, colB) => {
        c.strokeStyle = colB; c.lineWidth = 11 * b;
        c.beginPath(); c.moveTo(hx, 60 + bob);
        c.quadraticCurveTo(kx, 74 + bob, kx + (foot - kx) * 0.2, 82 + bob); c.stroke();
        c.strokeStyle = colA; c.lineWidth = 8 * b;
        c.beginPath(); c.moveTo(kx, 80 + bob); c.lineTo(foot, 99); c.stroke();
        c.fillStyle = colB;
        c.beginPath(); c.ellipse(foot + 5, 100, 9 * b, 3.6, 0, 0, TAU); c.fill();
      };
      leg(50, 42 - lead * 12, 28 - lead * 20, '#6b5347', '#43302a');
      leg(64, 70 + lead * 10, 86 + lead * 16, '#7d6355', '#4d372f');
      const g = c.createLinearGradient(8, 40, 60, 66);
      g.addColorStop(0, S.hide[1]); g.addColorStop(0.5, S.hide[0]); g.addColorStop(1, S.hide[2]);
      // tail
      c.fillStyle = g; c.beginPath();
      c.moveTo(58, 46 + bob);
      c.quadraticCurveTo(28, 40 + bob - lead * 5, 6, 24 + bob - lead * 10);
      c.quadraticCurveTo(26, 54 + bob - lead * 3, 58, 64 + bob);
      c.closePath(); c.fill();
      // barrel
      c.beginPath(); c.ellipse(68, 56 + bob, 25 * b, 17 * b, -0.1, 0, TAU); c.fill();
      c.fillStyle = 'rgba(244,226,196,0.2)';
      c.beginPath(); c.ellipse(72, 66 + bob, 17 * b, 6.2, -0.05, 0, TAU); c.fill();
      c.fillStyle = S.mark;
      for (let i = 0; i < 4; i++) {
        c.globalAlpha = 0.22;
        c.beginPath(); c.ellipse(58 + i * 8, 48 + bob + (i % 2) * 3, 2.6, 8.4, 0.2, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      // neck, head, crest, eye
      c.strokeStyle = S.hide[0]; c.lineWidth = 13 * b;
      c.beginPath(); c.moveTo(82, 50 + bob); c.quadraticCurveTo(96, 42 + bob, 101, 33 + bob); c.stroke();
      c.fillStyle = S.hide[0];
      c.beginPath(); c.ellipse(105, 30 + bob, 12, 8, -0.22, 0, TAU); c.fill();
      c.fillStyle = S.hide[2];
      c.beginPath(); c.moveTo(112, 29 + bob); c.quadraticCurveTo(123, 32 + bob, 117, 37 + bob);
      c.quadraticCurveTo(111, 38 + bob, 107, 35 + bob); c.closePath(); c.fill();
      c.fillStyle = S.crest;
      c.beginPath(); c.moveTo(99, 23 + bob); c.quadraticCurveTo(102, 10 + bob, 112, 17 + bob);
      c.quadraticCurveTo(106, 20 + bob, 105, 26 + bob); c.closePath(); c.fill();
      c.fillStyle = '#12100f'; c.beginPath(); c.arc(106, 29 + bob, 2.5, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(105.2, 28.2 + bob, 0.9, 0, TAU); c.fill();
      c.strokeStyle = S.hide[1]; c.lineWidth = 5;
      c.beginPath(); c.moveTo(82, 57 + bob); c.quadraticCurveTo(92, 63 + bob, 95, 58 + bob + lead * 3); c.stroke();
      rim(c, 124, 108, '255,214,170', 900 + shape * 31 + pose, 0.035);
    });
  };

  // chase view from behind, two stride poses per body shape
  const rear = (shape, pose) => {
    const S = SHAPES[shape];
    canvasTex(scene, 'pd-rear-' + shape + '-' + pose, 124, 112, (c) => {
      const b = S.bulk;
      const bob = [0, -3][pose];
      const kick = pose === 0 ? 1 : -1;
      c.lineCap = 'round';
      const leg = (hx, foot, wdt) => {
        c.strokeStyle = S.hide[2]; c.lineWidth = wdt * b;
        c.beginPath(); c.moveTo(hx, 68 + bob); c.quadraticCurveTo(hx + kick * 3, 84, foot, 101); c.stroke();
        c.fillStyle = '#2c1f1c';
        c.beginPath(); c.ellipse(foot + kick * 3, 102, 8 * b, 3.4, 0, 0, TAU); c.fill();
      };
      leg(44 - kick * 6, 36 - kick * 9, 12);
      leg(74 + kick * 6, 82 + kick * 9, 12);
      const g = c.createLinearGradient(30, 38, 88, 74);
      g.addColorStop(0, S.hide[0]); g.addColorStop(0.55, S.hide[1]); g.addColorStop(1, S.hide[2]);
      c.fillStyle = g;
      c.beginPath(); c.ellipse(59, 62 + bob, 26 * b, 19 * b, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(20,14,12,0.26)';
      c.beginPath(); c.ellipse(59, 76 + bob, 22 * b, 7.6, 0, 0, TAU); c.fill();
      c.fillStyle = S.mark;
      for (let i = 0; i < 5; i++) {
        c.beginPath(); c.moveTo(56, 44 + bob + i * 4.2); c.lineTo(59, 38 + bob + i * 4.2);
        c.lineTo(62, 44 + bob + i * 4.2); c.closePath(); c.fill();
      }
      c.strokeStyle = S.hide[1]; c.lineWidth = 9 * b;
      c.beginPath(); c.moveTo(59, 46 + bob); c.quadraticCurveTo(59 + kick * 4, 32 + bob, 58, 22 + bob); c.stroke();
      c.fillStyle = S.hide[0];
      c.beginPath(); c.ellipse(59, 22 + bob, 10.4, 8.4, 0, 0, TAU); c.fill();
      c.fillStyle = S.crest;
      c.beginPath(); c.moveTo(53, 16 + bob); c.quadraticCurveTo(59, 3 + bob, 66, 15 + bob); c.closePath(); c.fill();
      c.fillStyle = '#161110';
      c.beginPath(); c.arc(51, 22 + bob, 2, 0, TAU); c.arc(67, 22 + bob, 2, 0, TAU); c.fill();
      rim(c, 124, 112, '255,206,158', 1400 + shape * 17 + pose, 0.035);
    });
  };

  for (let s = 0; s < 3; s++) { side(s, 0); side(s, 1); side(s, 2); rear(s, 0); rear(s, 1); }

  canvasTex(scene, 'pd-dust', 44, 44, (c) => {
    const g = c.createRadialGradient(22, 22, 1, 22, 22, 22);
    g.addColorStop(0, 'rgba(255,228,192,0.85)'); g.addColorStop(0.45, 'rgba(226,178,132,0.4)');
    g.addColorStop(1, 'rgba(200,150,110,0)');
    c.fillStyle = g; c.fillRect(0, 0, 44, 44);
  });
  canvasTex(scene, 'pd-wind', 92, 10, (c) => {
    const g = c.createLinearGradient(0, 0, 92, 0);
    g.addColorStop(0, 'rgba(255,236,208,0)'); g.addColorStop(0.5, 'rgba(255,236,208,0.55)');
    g.addColorStop(1, 'rgba(255,236,208,0)');
    c.fillStyle = g; c.fillRect(0, 3, 92, 3.6);
  });
  const verge = (key, draw, seed) => canvasTex(scene, key, 68, 48, (c) => { draw(c); grain(c, 68, 48, 0.05, seed); });
  verge('pd-tuft', (c) => {
    const rand = rng(8821);
    c.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      const a = -1.62 + i * 0.13 + rand() * 0.08, len = 16 + rand() * 22;
      c.strokeStyle = i % 3 ? '#4a3a3c' : '#75593f';
      c.lineWidth = 1.6 + rand() * 1.8;
      c.beginPath(); c.moveTo(34, 46);
      c.quadraticCurveTo(34 + Math.cos(a) * len * 0.5, 46 + Math.sin(a) * len * 0.6,
        34 + Math.cos(a) * len, 46 + Math.sin(a) * len);
      c.stroke();
    }
  }, 313);
  verge('pd-stone', (c) => {
    const g = c.createLinearGradient(6, 6, 52, 44);
    g.addColorStop(0, '#7d6c70'); g.addColorStop(0.6, '#4a3c44'); g.addColorStop(1, '#241c24');
    c.fillStyle = g; c.beginPath();
    c.moveTo(8, 40); c.quadraticCurveTo(2, 22, 18, 13); c.quadraticCurveTo(36, 4, 52, 18);
    c.quadraticCurveTo(62, 30, 50, 40); c.quadraticCurveTo(28, 47, 8, 40); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,222,186,0.32)'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(14, 20); c.quadraticCurveTo(30, 10, 46, 20); c.stroke();
  }, 517);
  verge('pd-bush', (c) => {
    const rand = rng(4409);
    for (let i = 0; i < 16; i++) {
      const x = 14 + rand() * 40, y = 20 + rand() * 24, r = 6 + rand() * 9;
      c.fillStyle = i % 3 ? 'rgba(74,66,52,0.85)' : 'rgba(112,88,58,0.7)';
      c.beginPath(); c.ellipse(x, y, r, r * 0.72, rand(), 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(255,206,150,0.3)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(16, 20); c.quadraticCurveTo(34, 8, 52, 18); c.stroke();
  }, 733);
  canvasTex(scene, 'pd-post', 30, 140, (c) => {
    const g = c.createLinearGradient(4, 0, 26, 140);
    g.addColorStop(0, '#7d5c3e'); g.addColorStop(0.5, '#4e3626'); g.addColorStop(1, '#241a14');
    c.fillStyle = g; c.fillRect(9, 6, 13, 134);
    c.fillStyle = '#f0c88a';
    for (let i = 0; i < 3; i++) c.fillRect(8, 20 + i * 36, 15, 5);
    c.fillStyle = PAL.accent;
    c.beginPath(); c.moveTo(22, 8); c.lineTo(30, 24); c.lineTo(22, 34); c.closePath(); c.fill();
    grain(c, 30, 140, 0.04, 991);
  });
}

/* ---------------------------------------------------------------- create */
function create(scene) {
  const M = scene.M, K = scene.k;
  const col = (h) => Phaser.Display.Color.HexStringToColor(h).color;
  const accent = col(PAL.accent), moteCol = col(PAL.motes), dustCol = col('#e6b489');
  art(scene);

  // a fresh field every run, but the whole run replayable from the printed seed
  const seed = hashSeed('pack-draft-' + Math.floor(Math.random() * 1e9));
  const r = rng(seed);

  /* layout — the race axis is x across a wide plain in landscape, and runs away
     up a converging band in portrait. Lateral lanes follow the other axis. */
  const G = M.portrait
    ? { pin: 402, ahead: 348, behind: 128, k1: 0.088, k2: 0.134, lat0: 138, lat1: 822, far: 0.46 }
    : { pin: 302, ahead: 644, behind: 292, k1: 0.052, k2: 0.088, lat0: 346, lat1: 528, far: 1 };

  const off = (dm) => (dm >= 0
    ? G.ahead * (1 - Math.exp(-dm * G.k1))
    : -G.behind * (1 - Math.exp(dm * G.k2)));
  const axisScale = (dm) => (dm >= 0
    ? G.ahead * G.k1 * Math.exp(-dm * G.k1)
    : G.behind * G.k2 * Math.exp(dm * G.k2));
  const converge = (dm) => (M.portrait
    ? (dm >= 0 ? lerp(1, G.far, clamp(off(dm) / G.ahead, 0, 1)) : lerp(1, 1.14, clamp(-off(dm) / G.behind, 0, 1)))
    : 1);
  const laneLat = (lane) => lerp(G.lat0, G.lat1, lane);
  const halfLat = (G.lat1 - G.lat0) / 2, midLat = (G.lat0 + G.lat1) / 2;
  // stage point (x, y in 0..540 units) of a runner dm metres ahead on a lane
  const stageOf = (dm, lane) => {
    const a = off(dm), cv = converge(dm);
    return M.portrait
      ? { x: W / 2 + (laneLat(lane) - W / 2) * cv, y: G.pin - a, cv }
      : { x: G.pin + a, y: laneLat(lane), cv };
  };

  /* ------------------------------------------------------------- the field */
  const field = [];
  for (let i = 0; i < 8; i++) {
    field.push({
      id: i, name: NAMES[i], pos: 2.6 + i * 1.8 + r() * 1.2,
      lane: clamp(0.12 + i * 0.105 + (r() - 0.5) * 0.07, 0.05, 0.95),
      speed: 9.5 + r() * 0.6, e: 0.5, st: 86 + r() * 16, legs: 0,
      ballast: 0.32 + r() * 0.62, pref: 0.1 + r() * 0.8,
      jit: 0.6 + r() * 0.9, ph: r() * TAU, phase: r() * 3,
      shape: r() < 0.44 ? 1 : 0, tint: TINTS[(r() * TINTS.length) | 0],
      draft: 0, gapA: 99, ahead: -1, pocket: 0.5, boxed: false, cool: 0,
      drain: 0, net: 0, place: 8 + i, wasBehind: true, moved: false, lastPk: 0
    });
  }
  const me = {
    id: ME_ID, name: 'you', pos: 0, lane: 0.5, laneTarget: 0.5, speed: 9.3, e: E_SETTLE,
    st: 100, legs: 0, phase: 0, draft: 0, gapA: 99, ahead: -1, pocket: 0.5, cool: 0,
    drain: 0, net: 0, place: 9, scrolled: 0, hitCd: 0, lastPk: 0
  };
  const byId = (id) => (id === ME_ID ? me : field[id]);
  const list = field.concat([me]);
  const ranked = list.slice();

  const st = {
    score: 0, paces: 0, endBonus: 0, hearts: HEARTS, passes: 0, leadTime: 0, place: 9, led: 0,
    elapsed: 0, over: false, won: false, note: '', clock: 1, hadInput: false, hold: false,
    started: false, hundred: false
  };
  const wind = {
    t: 0, phase: r() * 6, head: 0.32, drift: 0, driftTarget: (r() - 0.5) * 0.2,
    gust: 0, gTarget: 0, gT: 0, gEvery: 7 + r() * 5
  };

  /* -------------------------------------------------------------- display */
  const plain = scene.add.graphics().setDepth(4);
  const trail = scene.add.graphics().setDepth(7);
  const finishG = scene.add.graphics().setDepth(9);
  const slipG = scene.add.graphics().setDepth(12);
  const smearG = scene.add.graphics().setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
  const shadeG = scene.add.graphics().setDepth(18);
  const railG = scene.add.graphics().setDepth(46);
  const gaugeG = scene.add.graphics().setDepth(45);
  const veil = scene.add.rectangle(0, 0, W, M.H, col('#2a1220'), 0).setOrigin(0).setDepth(44);

  const imgs = field.map((f) => scene.add.image(0, 0, 'pd-side-' + f.shape + '-0')
    .setOrigin(0.46, 0.93).setDepth(20).setScale(0.42 * K).setTint(f.tint));
  const meImg = scene.add.image(0, 0, 'pd-side-2-0').setOrigin(0.46, 0.93).setDepth(24).setScale(0.46 * K);
  const meGlow = scene.add.image(0, 0, 'arc-glow').setDepth(16).setScale(0.5 * K)
    .setTint(accent).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);

  const VERGE = ['pd-tuft', 'pd-stone', 'pd-bush', 'pd-tuft', 'pd-bush', 'pd-stone'];
  const props = [];
  for (let i = 0; i < 16; i++) {
    props.push({
      img: scene.add.image(0, 0, VERGE[i % VERGE.length]).setOrigin(0.5, 0.94).setDepth(10),
      q: 10 + r() * 34, s: 0.34 + r() * 0.24, sc: 0.72 + r() * 0.62,
      side: i % 2 ? 1 : -1, slot: i
    });
  }
  const posts = [0, 1].map(() => scene.add.image(0, 0, 'pd-post').setOrigin(0.5, 0.99)
    .setDepth(15).setScale(0.5 * K).setVisible(false));

  const dust = scene.add.particles(0, 0, 'pd-dust', {
    speed: { min: 22, max: 92 }, angle: { min: 190, max: 350 }, lifespan: { min: 320, max: 620 },
    scale: { start: 0.4, end: 0.02 }, alpha: { start: 0.5, end: 0 }, tint: [dustCol, moteCol],
    emitting: false
  }).setDepth(16);
  const windLayer = scene.add.particles(0, 0, 'pd-wind', {
    x: { min: -150, max: W + 150 },
    y: { min: M.Y(M.portrait ? 40 : G.lat0 - 40), max: M.Y(M.portrait ? 528 : G.lat1 + 26) },
    speedX: { min: 140, max: 320 }, speedY: M.portrait ? { min: 80, max: 180 } : { min: -16, max: 16 },
    lifespan: 1500, alpha: { start: 0.2, end: 0 }, scale: { start: 0.9, end: 1.5 },
    quantity: 1, frequency: 220
  }).setDepth(14);

  /* ---------------------------------------------------------------- input */
  const keys = scene.input.keyboard.addKeys({
    left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN',
    a: 'A', d: 'D', w: 'W', s: 'S', space: 'SPACE', enter: 'ENTER'
  });
  const mouse = scene.input.mousePointer;
  /* a mouse hovers for free, so on a desktop the pointer gives the lane and the
     button gives the surge. a finger has no hover: the only way to state a lane
     was to press, and pressing was also the surge, so on glass every lane change
     bought a surge and resting meant losing your line - the whole game is choosing
     when to spend, and the phone was spending to move. on glass the first finger to
     drag owns the lane, and a second finger anywhere is the surge. */
  scene.input.addPointer(2);
  const down = {};
  let steerId = -1;
  let fingers = 0;
  const heldDown = () => fingers > 1 || mouse.isDown;
  const laneAt = (p) => (M.portrait
    ? clamp((p.x - G.lat0) / (G.lat1 - G.lat0), 0, 1)
    : clamp((scene.uY(p.y) - G.lat0) / (G.lat1 - G.lat0), 0, 1));
  const steerBy = (p) => !p.wasTouch || steerId === p.id;
  scene.input.on('pointermove', (p) => {
    st.hadInput = true;
    /* a finger that arrives and sits is a thumb at rest; a finger that drags is
       steering, whichever of the two it is */
    if (p.wasTouch && steerId < 0 && fingers === 1 && down[p.id]) steerId = p.id;
    if (steerBy(p)) me.laneTarget = laneAt(p);
  });
  scene.input.on('pointerdown', (p) => {
    st.hadInput = true;
    if (!down[p.id]) { down[p.id] = true; if (p.wasTouch) fingers++; }
    if (!p.wasTouch) me.laneTarget = laneAt(p);
    scene.sfx('tick');
  });
  const lift = (p) => {
    if (!down[p.id]) return;
    down[p.id] = false;
    if (p.wasTouch) fingers = Math.max(0, fingers - 1);
    if (steerId === p.id) steerId = -1;
  };
  scene.input.on('pointerup', lift);
  scene.input.on('pointerupoutside', lift);
  scene.input.on('pointercancel', lift);
  scene.input.on('gameout', () => {
    for (const k in down) down[k] = false;
    fingers = 0; steerId = -1;
  });

  /* -------------------------------------------------------------- physics */
  function draftFor(p) {
    let best = 0, bestId = -1, bestGap = 99, bestLane = p.lane;
    for (const o of list) {
      if (o === p) continue;
      const g = o.pos - p.pos;
      if (g <= 0.18 || g > POCKET_MAX) continue;
      const pocket = clamp(o.lane + wind.drift, 0.02, 0.98);
      const d = clamp(1 - Math.abs(p.lane - pocket) / POCKET_W, 0, 1) * gapCurve(g);
      if (d > best) { best = d; bestId = o.id; bestGap = g; bestLane = pocket; }
    }
    return { draft: best, ahead: bestId, gap: bestGap, pocket: bestLane };
  }

  function spend(p, draft, h, laneRate) {
    const work = 1 + 0.24 * clamp(Math.abs(laneRate) / ME_LANE, 0, 1);
    const drain = DRAIN_K * Math.pow(p.e, 1.7) * (1 - DRAFT_RELIEF * draft) * work * (1 + 0.3 * wind.head);
    const ease = Math.max(0, (REGEN_EASE - p.e) / REGEN_EASE);
    const regen = ease * (REGEN_K + REGEN_DRAFT * draft) * (1 - 0.35 * wind.head);
    p.st = clamp(p.st + (regen - drain) * h, 0, 100);
    p.drain = drain; p.regen = regen; p.net = regen - drain;
    if (p.st < 22) p.legs = clamp(p.legs + h * 0.5 * (1 - p.st / 22), 0, 1);
    else if (p.st > 45) p.legs = clamp(p.legs - h * 0.16, 0, 1);
  }

  function drive(p, draft, h) {
    const vT = VMAX * (0.62 + 0.38 * p.e) * (1 + 0.16 * draft) * (1 - 0.26 * p.legs) * (1 - 0.055 * wind.head);
    p.speed += (vT - p.speed) * Math.min(1, (vT > p.speed ? 4.4 : 6.6) * h);
    p.pos += p.speed * h;
  }

  function aiThink(f, h) {
    const remaining = COURSE - f.pos;
    let e = 0.33 + 0.17 * f.ballast;
    if (f.boxed) e -= 0.13;
    if (f.draft > 0.55) e += 0.05;
    if (f.place === 1) e += 0.07;
    if (remaining < 120 && f.st > 44) { e += 0.24; f.moved = true; }
    if (f.st < 34) e = Math.min(e, 0.3);
    if (f.st < 12) e = 0.2;
    if (f.cool > 0) e = Math.min(e, 0.66);
    if (e > 0.82) f.cool = 3.4;
    f.cool = Math.max(0, f.cool - h);
    f.e = lerp(f.e, clamp(e, 0.16, 0.9), Math.min(1, h * 2.4));

    let target = f.pref + Math.sin(st.elapsed * 0.7 * f.jit + f.ph) * 0.055;
    if (f.ballast > 0.52 && f.ahead >= 0 && f.draft < 0.5) {
      target = lerp(target, byId(f.ahead).lane + wind.drift, 0.55);
    }
    for (const o of list) {
      if (o === f) continue;
      if (Math.abs(o.pos - f.pos) < 3.2 && Math.abs(o.lane - target) < 0.085) {
        target += (f.lane >= o.lane ? 0.13 : -0.13);
      }
    }
    target = clamp(target, 0.05, 0.95);
    const before = f.lane;
    f.lane = clamp(f.lane + Math.sign(target - f.lane) * Math.min(Math.abs(target - f.lane), AI_LANE * h), 0.03, 0.97);
    return (f.lane - before) / Math.max(h, 1e-4);
  }

  function hardBump(f) {
    me.hitCd = 1.5;
    st.hearts--;
    me.speed *= 0.52; f.speed *= 0.94;
    me.st = Math.max(0, me.st - 7); me.legs = clamp(me.legs + 0.12, 0, 1);
    scene.sfx('hurt'); scene.sfx('boom');
    scene.shake(300, 0.016);
    const s = stageOf(f.pos - me.pos, f.lane);
    scene.burst(s.x, M.Y(s.y) - 20, 0xffd2a1, 16, { life: 560, gravity: 320, scale: 0.55 });
    dust.explode(9, s.x, M.Y(s.y));
    scene.popText(s.x, M.Y(s.y - 52), 'bumped', '#ffb1a1');
    if (st.hearts <= 0) end(false, 'three clips on the trail and the legs went');
    else scene.notice(f.name + ' shut the door — that cost a feather', 1900);
  }

  function bumpCheck(h) {
    if (st.over) return;
    for (const f of field) {
      const d = f.pos - me.pos, dl = Math.abs(f.lane - me.lane);
      if (dl > 0.075) continue;
      if (d > 0.12 && d < 0.85) {
        me.speed = Math.min(me.speed, f.speed * 0.99);              // no room left: you have to lift
        const closing = Math.max(0, me.speed - f.speed + 0.25);
        if (me.hitCd <= 0 && me.e > 0.55 && Math.random() < closing * 0.42 * h) hardBump(f);
      } else if (d >= 0.85 && d < 1.5 && me.speed - f.speed > 1.6 && me.e > 0.6 && me.hitCd <= 0) {
        hardBump(f);                                                 // you run them down
      } else if (Math.abs(d) < 1.7 && dl < 0.062) {
        const push = (me.lane >= f.lane ? 1 : -1) * 0.42 * h;        // shoulders in
        me.lane = clamp(me.lane + push, 0.02, 0.98);
        f.lane = clamp(f.lane - push, 0.03, 0.97);
        me.speed *= 1 - 0.05 * h; f.speed *= 1 - 0.05 * h;
        if (me.hitCd <= 0 && me.e > 0.8 && Math.random() < h * 0.3) hardBump(f);
      }
    }
  }

  function windStep(h) {
    wind.t += h; wind.phase += h * 0.075;
    wind.gT -= h; wind.gEvery -= h;
    if (wind.gEvery <= 0) {
      wind.gEvery = 7.5 + r() * 6;
      wind.gTarget = 0.16 + r() * 0.3;
      wind.gT = 2.4 + r() * 2.2;
      wind.driftTarget = (r() - 0.5) * 0.3;
      scene.sfx('whoosh');
      scene.notice('the wind has shifted — the pockets have moved', 1700);
    }
    wind.gust = lerp(wind.gust, wind.gT > 0 ? wind.gTarget : 0, Math.min(1, h * 2.6));
    wind.head = clamp(0.26 + 0.16 * Math.sin(wind.phase) + 0.1 * Math.sin(wind.phase * 2.7 + 1.1) + wind.gust, 0.05, 1.1);
    wind.drift = clamp(lerp(wind.drift, wind.driftTarget * 0.7 + Math.sin(wind.phase * 0.63 + 0.4) * 0.075,
      Math.min(1, h * 1.4)), -0.14, 0.14);
  }

  function stepSim(h) {
    st.elapsed += h;
    windStep(h);

    // pointer steers, keys steer, holding surges, releasing settles
    const back = (keys.left.isDown || keys.up.isDown || keys.a.isDown || keys.w.isDown) ? -1 : 0;
    const fwd = (keys.right.isDown || keys.down.isDown || keys.d.isDown || keys.s.isDown) ? 1 : 0;
    if (back || fwd) {
      me.laneTarget = clamp((st.hadInput ? me.laneTarget : me.lane) + (fwd + back) * h * 1.15, 0, 1);
      st.hadInput = true;
    }
    st.hold = heldDown() || keys.space.isDown || keys.enter.isDown;
    let eMax = 1 - 0.3 * me.legs;
    if (me.cool > 0) eMax = Math.min(eMax, 0.66);
    const eT = st.hold ? eMax : E_SETTLE;
    const wasHeld = me.e > 0.8;
    me.e += (eT - me.e) * Math.min(1, h * (eT > me.e ? 3.4 : 2.3));
    if (me.e > 0.84) me.cool = 3.2;
    me.cool = Math.max(0, me.cool - h);
    if (!wasHeld && me.e > 0.8) scene.sfx('drum2');

    ranked.sort((a, b) => b.pos - a.pos);
    ranked.forEach((p, i) => { p.place = i + 1; });

    for (const f of field) {
      const d = draftFor(f);
      f.draft = d.draft; f.ahead = d.ahead; f.gapA = d.gap; f.pocket = d.pocket;
      f.boxed = f.gapA < 2.4 && f.draft > 0.22;
      const lr = aiThink(f, h);
      spend(f, f.draft, h, lr);
      drive(f, f.draft, h);
      f.phase += f.speed * h * 0.82;
    }

    const md = draftFor(me);
    const wasDraft = me.draft;
    me.draft = md.draft; me.ahead = md.ahead; me.gapA = md.gap; me.pocket = md.pocket;
    if (wasDraft < 0.45 && me.draft >= 0.45) scene.sfx('pick');
    const before = me.lane;
    me.lane = clamp(me.lane + Math.sign(me.laneTarget - me.lane) *
      Math.min(Math.abs(me.laneTarget - me.lane), ME_LANE * h), 0.02, 0.98);
    spend(me, me.draft, h, (me.lane - before) / Math.max(h, 1e-4));
    drive(me, me.draft, h);
    me.scrolled += me.speed * axisScale(0) * h;
    me.phase += me.speed * h * 0.82;
    me.hitCd = Math.max(0, me.hitCd - h);

    bumpCheck(h);

    st.led = field.filter((f) => f.pos < me.pos).length;
    st.place = me.place;
    st.paces += st.led * LED_RATE * h;
    for (const f of field) {
      const now = f.pos < me.pos;
      if (now && !f.wasBehind) {
        st.passes++; st.paces += PASS_PACES;
        const s = stageOf(f.pos - me.pos + 1.6, f.lane);
        scene.popText(s.x, M.Y(s.y - 56), '+pace', '#ffe6a8');
        scene.sfx('good');
        if (st.place === 1) {
          const m = stageOf(0, me.lane);
          scene.burst(m.x, M.Y(m.y) - 40, 0xffd77a, 22, { life: 760, gravity: 200, spin: true });
          scene.sfx('chime'); scene.sfx('drum4'); scene.shake(200, 0.007);
          scene.notice('clear of the pack — now hold it', 2100);
        }
      } else if (!now && f.wasBehind) {
        scene.sfx('bad');
        scene.notice(f.name + ' has come past on the ' + (f.lane > me.lane ? 'near' : 'far') + ' side', 1800);
      }
      f.wasBehind = now;
    }
    if (st.place === 1) st.leadTime += h;

    if (!st.hundred && me.pos > 100 && field.some((f) => f.pos > 100)) st.hundred = true;
    if (!st.started && st.elapsed > 0.4) { st.started = true; scene.sfx('drum1'); scene.sfx('jump'); }
    if (st.place === 1 && COURSE - me.pos < 100 && !st.final) {
      st.final = true;
      scene.sfx('drum3'); scene.notice('the last hundred — nobody comes past you here', 2200);
    }

    const leader = ranked[0];
    if (leader !== me && leader.pos - me.pos > DROP_M) {
      end(false, 'the pack was ' + Math.round(leader.pos - me.pos) + ' metres gone');
      return;
    }
    if (me.pos >= COURSE) finishLine();
  }

  function scoreNow() { return st.paces + st.endBonus; }

  function finishLine() {
    const second = ranked.filter((p) => p !== me).sort((a, b) => b.pos - a.pos)[0];
    const margin = Math.max(0, me.pos - second.pos);
    let bonus = 0;
    if (st.place === 1) bonus += 6; else if (st.place === 2) bonus += 3; else if (st.place === 3) bonus += 1;
    bonus += Math.min(9, st.leadTime * 0.4);
    if (st.place === 1) bonus += Math.min(6, margin * 0.6);
    st.endBonus = bonus;
    end(st.place === 1, st.place === 1
      ? 'won it by ' + margin.toFixed(1) + ' metres off the back of the draft'
      : 'home ' + ORD[clamp(st.place - 1, 0, 8)] + ', ' + Math.round(second.pos - me.pos) + ' metres off the pace');
  }

  function end(win, why) {
    if (st.over) return;
    st.over = true; st.won = win; st.note = why;
    st.score = Math.round(scoreNow());
    scene.finish(win, { score: st.score, note: why });
  }

  /* --------------------------------------------------------------- render */
  const oval = (g, x, y, rx, ry, filled) => {
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * TAU, px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    if (filled) { g.closePath(); g.fill(); } else g.strokePath();
  };

  function drawPlain(time) {
    plain.clear(); trail.clear(); finishG.clear();
    const yTop = M.Y(G.lat0), yBot = M.Y(G.lat1);
    const topStage = M.portrait ? 24 : 306;
    plain.fillStyle(col('#432f3e'), 1);
    plain.fillRect(0, M.Y(topStage), W, M.H - M.Y(topStage));
    plain.fillStyle(col('#5b4043'), 0.5);
    for (let i = 0; i < 26; i++) {
      const x = ((i * 79 - me.pos * (M.portrait ? 6 : 16)) % (W + 240) + W + 240) % (W + 240) - 120;
      plain.fillCircle(x, M.Y(topStage) + 4 + (i % 5) * 7, 20 + (i % 6) * 11);
    }

    // the trail, traced through the same mapping the runners are drawn with
    const edges = [];
    for (let k = 0; k <= 22; k++) {
      const dm = -15 + (k / 22) * 59;
      const s = stageOf(dm, 0.5);
      edges.push({ x: s.x, y: M.Y(s.y), half: M.portrait ? halfLat * s.cv : halfLat });
    }
    trail.fillStyle(col('#70544a'), 1);
    if (M.portrait) {
      const near = edges[0];
      trail.beginPath();
      trail.moveTo(Math.max(0, near.x - near.half - 90), M.H);
      for (const e of edges) trail.lineTo(e.x - e.half, e.y);
      for (let i = edges.length - 1; i >= 0; i--) trail.lineTo(edges[i].x + edges[i].half, edges[i].y);
      trail.lineTo(Math.min(W, near.x + near.half + 90), M.H);
      trail.closePath(); trail.fill();
      trail.fillStyle(col('#87665a'), 0.5);
      trail.beginPath();
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if (i === 0) trail.moveTo(e.x - e.half * 0.5, e.y); else trail.lineTo(e.x - e.half * 0.5, e.y);
      }
      for (let i = edges.length - 1; i >= 0; i--) trail.lineTo(edges[i].x + edges[i].half * 0.5, edges[i].y);
      trail.closePath(); trail.fill();
    } else {
      trail.fillRect(-20, yTop, W + 40, yBot - yTop);
      trail.fillStyle(col('#87665a'), 0.5);
      trail.fillRect(-20, yTop + (yBot - yTop) * 0.26, W + 40, (yBot - yTop) * 0.5);
    }

    // speckle and the stride line every fifty metres, pinned to the ground
    for (let k = 0; k < 34; k++) {
      const wm = Math.floor((me.pos - 12) / 5) * 5 + k * 5;
      const dm = wm - me.pos;
      if (dm < -14 || dm > 42) continue;
      const s = stageOf(dm, 0.5);
      const half = M.portrait ? halfLat * s.cv : halfLat;
      const mid = M.portrait ? M.Y(s.y) : (yTop + yBot) / 2;
      trail.fillStyle(col('#3b2a26'), 0.18);
      for (let j = 0; j < 3; j++) {
        const q = ((k * 7 + j * 13) % 17) / 17;
        const lat = M.portrait ? lerp(s.x - half, s.x + half, q) : mid + (q - 0.5) * (yBot - yTop) * 0.9;
        const px = M.portrait ? lat : s.x;
        const py = M.portrait ? mid + (j - 1) * 3 * s.cv : lat;
        trail.fillCircle(px, py, 2.4 * (M.portrait ? s.cv : 1));
      }
      if (wm % 50 === 0) {
        const cv = M.portrait ? s.cv : 1;
        trail.lineStyle(2.8 * K * cv, moteCol, 0.22);
        trail.beginPath();
        if (M.portrait) { trail.moveTo(s.x - half * 0.98, M.Y(s.y)); trail.lineTo(s.x + half * 0.98, M.Y(s.y)); }
        else { trail.moveTo(s.x, yTop - 4); trail.lineTo(s.x, yBot + 8); }
        trail.strokePath();
        trail.lineStyle(1.6 * K * cv, moteCol, 0.13);
        trail.beginPath();
        if (M.portrait) { trail.moveTo(s.x - half * 0.98, M.Y(s.y) + 5); trail.lineTo(s.x + half * 0.98, M.Y(s.y) + 5); }
        else { trail.moveTo(s.x + 7, yTop - 4); trail.lineTo(s.x + 7, yBot + 8); }
        trail.strokePath();
      }
    }

    // the line and its two posts
    const fd = COURSE - me.pos;
    if (fd > -4 && fd < 42) {
      const s = stageOf(fd, 0.5), half = M.portrait ? halfLat * s.cv : halfLat;
      const cv = M.portrait ? s.cv : 1;
      if (M.portrait) {
        for (let i = 0; i < 14; i++) {
          finishG.fillStyle(i % 2 ? 0xf6ecd8 : accent, 0.86);
          finishG.fillRect(s.x - half + (half * 2) * i / 14, M.Y(s.y) - 7 * cv, (half * 2) / 14, 14 * cv);
        }
        posts[0].setVisible(true).setPosition(s.x - half + 8, M.Y(s.y) + 4).setScale(0.42 * K * cv);
        posts[1].setVisible(true).setPosition(s.x + half - 8, M.Y(s.y) + 4).setScale(0.42 * K * cv);
      } else {
        for (let i = 0; i < 12; i++) {
          finishG.fillStyle(i % 2 ? 0xf6ecd8 : accent, 0.86);
          finishG.fillRect(s.x - 5, lerp(yTop - 6, yBot + 10, i / 12), 10, (yBot - yTop) / 12 + 1);
        }
        posts[0].setVisible(true).setPosition(s.x - 4, yTop - 4).setScale(0.4 * K);
        posts[1].setVisible(true).setPosition(s.x + 4, yBot + 10).setScale(0.5 * K);
      }
    } else { posts[0].setVisible(false); posts[1].setVisible(false); }

    // verge scenery, recycled in sixty-metre spans
    const SPAN = 60, base = Math.floor((me.pos - 16) / SPAN) * SPAN;
    props.forEach((pr, j) => {
      const dm = base + j * (SPAN / props.length) + (j % 3) - me.pos;
      if (dm < -14 || dm > 42) { pr.img.setVisible(false); return; }
      const s = stageOf(dm, 0.5);
      const half = M.portrait ? halfLat * s.cv : halfLat;
      const tex = VERGE[(j + Math.floor(base / 5)) % VERGE.length];
      if (pr.img.texture.key !== tex) pr.img.setTexture(tex);
      if (M.portrait) {
        const push = (half + 14 + pr.q) * pr.side;
        pr.img.setVisible(true).setPosition(s.x + push, M.Y(s.y) + 6)
          .setScale(pr.s * K * s.cv * pr.sc).setDepth(9 + Math.round(off(dm)));
      } else {
        const y = pr.side > 0 ? yBot + 10 + pr.q * 0.5 : yTop - 8 - pr.q * 0.5;
        pr.img.setVisible(true).setPosition(s.x, y)
          .setScale(pr.s * K * pr.sc * (pr.side > 0 ? 1.2 : 0.84))
          .setDepth(pr.side > 0 ? 26 : 6);
      }
    });
  }

  function drawSlip(time) {
    slipG.clear();
    if (me.draft <= 0.1 || me.ahead < 0) return;
    const f = byId(me.ahead);
    const a = stageOf(f.pos - me.pos, f.lane), b = stageOf(0.25, me.lane);
    const ax = a.x, ay = M.Y(a.y), bx = b.x, by = M.Y(b.y);
    const wob = Math.sin(time / 170) * 3;
    const aw = 30 * a.cv, bw = 38 * b.cv;
    slipG.fillStyle(accent, 0.08 + me.draft * 0.15);
    slipG.lineStyle(2 * K, accent, 0.3 + me.draft * 0.32);
    slipG.beginPath();
    if (M.portrait) {
      slipG.moveTo(ax - aw, ay); slipG.lineTo(bx - bw, by);
      slipG.lineTo(bx + bw, by); slipG.lineTo(ax + aw, ay);
    } else {
      slipG.moveTo(ax, ay - 34); slipG.lineTo(bx, by - 30);
      slipG.lineTo(bx, by + 2); slipG.lineTo(ax, ay - 8);
    }
    slipG.closePath(); slipG.fill(); slipG.strokePath();
    for (let i = 0; i < 3; i++) {
      const t = ((time / 430 + i / 3) % 1);
      const x = lerp(ax, bx, t), y = lerp(ay, by, t);
      slipG.lineStyle(2.4 * K, moteCol, clamp(0.55 * (1 - t) * me.draft * 2.2, 0, 0.8));
      slipG.beginPath();
      if (M.portrait) {
        slipG.moveTo(x - 15, y + 6 + wob * 0.2); slipG.lineTo(x, y - 4); slipG.lineTo(x + 15, y + 6);
      } else {
        slipG.moveTo(x + 12, y - 20 + wob); slipG.lineTo(x, y - 12 + wob); slipG.lineTo(x + 12, y - 4 + wob);
      }
      slipG.strokePath();
    }
  }

  function drawRunners(time) {
    shadeG.clear(); smearG.clear();
    for (const f of field) {
      const dm = f.pos - me.pos, a = off(dm);
      const view = (M.portrait ? G.ahead : G.ahead + 260);
      if (Math.abs(a) > view) { imgs[f.id].setVisible(false); continue; }
      const tex = M.portrait
        ? 'pd-rear-' + f.shape + '-' + ((((f.phase | 0) % 2) + 2) % 2)
        : 'pd-side-' + f.shape + '-' + ((((f.phase | 0) % 3) + 3) % 3);
      const img = imgs[f.id];
      if (img.texture.key !== tex) img.setTexture(tex);
      const s = stageOf(dm, f.lane);
      const laneScale = M.portrait ? 1 : lerp(0.9, 1.14, f.lane);
      img.setVisible(true).setPosition(s.x, M.Y(s.y) - 2)
        .setScale(0.42 * K * s.cv * laneScale)
        .setDepth((M.portrait ? 3000 - Math.round(a) : 20 + Math.round(f.lane * 40)))
        .setAngle(M.portrait ? 0 : Math.sin(time / 210 + f.ph) * 1.8);
      shadeG.fillStyle(0x1b1016, 0.3 * s.cv);
      oval(shadeG, s.x, M.Y(s.y), 24 * s.cv * laneScale, 5.4 * s.cv, true);
      if (f.place === 1) {
        shadeG.lineStyle(1.8 * K, accent, 0.5);
        oval(shadeG, s.x, M.Y(s.y), 28 * s.cv, 6.6 * s.cv, false);
      }
      if (f.e > 0.76) {
        smearG.lineStyle(3 * K * s.cv, moteCol, (f.e - 0.76) * 1.2);
        if (M.portrait) {
          smearG.beginPath(); smearG.moveTo(s.x - 18 * s.cv, M.Y(s.y) - 30); smearG.lineTo(s.x + 16 * s.cv, M.Y(s.y) - 34); smearG.strokePath();
        } else {
          smearG.beginPath(); smearG.moveTo(s.x - 60 * s.cv, M.Y(s.y) - 26); smearG.lineTo(s.x - 14 * s.cv, M.Y(s.y) - 26); smearG.strokePath();
          smearG.beginPath(); smearG.moveTo(s.x - 52 * s.cv, M.Y(s.y) - 12); smearG.lineTo(s.x - 10 * s.cv, M.Y(s.y) - 12); smearG.strokePath();
        }
      }
    }

    const mp = M.portrait
      ? 'pd-rear-2-' + ((((me.phase | 0) % 2) + 2) % 2)
      : 'pd-side-2-' + ((((me.phase | 0) % 3) + 3) % 3);
    if (meImg.texture.key !== mp) meImg.setTexture(mp);
    const s = stageOf(0, me.lane);
    meImg.setVisible(true).setPosition(s.x, M.Y(s.y) - 2).setDepth(M.portrait ? 3000 : 600)
      .setScale(0.46 * K * s.cv);
    meGlow.setPosition(s.x, M.Y(s.y) - 6).setAlpha(0.1 + me.e * 0.26);
    shadeG.fillStyle(0x1b1016, 0.36);
    oval(shadeG, s.x, M.Y(s.y), 26, 6, true);
    if (me.e > 0.7) {
      const k = (me.e - 0.7) * 1.7;
      smearG.lineStyle(3.6 * K, moteCol, Math.min(0.6, k));
      if (M.portrait) {
        smearG.beginPath(); smearG.moveTo(s.x - 30, M.Y(s.y) - 34); smearG.lineTo(s.x + 26, M.Y(s.y) - 38); smearG.strokePath();
      } else {
        smearG.beginPath(); smearG.moveTo(s.x - 96, M.Y(s.y) - 28); smearG.lineTo(s.x - 16, M.Y(s.y) - 28); smearG.strokePath();
        smearG.lineStyle(2.4 * K, moteCol, Math.min(0.4, k * 0.7));
        smearG.beginPath(); smearG.moveTo(s.x - 84, M.Y(s.y) - 44); smearG.lineTo(s.x - 22, M.Y(s.y) - 44); smearG.strokePath();
        smearG.beginPath(); smearG.moveTo(s.x - 78, M.Y(s.y) - 12); smearG.lineTo(s.x - 18, M.Y(s.y) - 12); smearG.strokePath();
      }
    }

    for (const p of list) {
      const dm = p.pos - me.pos;
      if (Math.abs(off(dm)) > (M.portrait ? G.ahead : G.ahead)) continue;
      const pk = Math.floor(p.phase);
      if (p.lastPk !== pk) {
        p.lastPk = pk;
        if (pk % 2 === 0) {
          const q = stageOf(dm, p.lane);
          dust.explode(M.portrait ? 2 : 1, q.x + (M.portrait ? 0 : -14), M.Y(q.y));
        }
      }
    }
  }

  function drawHud(time) {
    railG.clear(); gaugeG.clear();
    const r0 = M.portrait ? 150 : 190, r1 = W - (M.portrait ? 150 : 190);
    const ry = M.Y(M.portrait ? 62 : 128);
    railG.lineStyle(1.4 * K, col(PAL.mist), 0.3);
    railG.beginPath(); railG.moveTo(r0, ry); railG.lineTo(r1, ry); railG.strokePath();
    for (let m = 0; m <= COURSE; m += 115) {
      const x = lerp(r0, r1, m / COURSE);
      railG.beginPath(); railG.moveTo(x, ry - 5 * K); railG.lineTo(x, ry + 5 * K); railG.strokePath();
    }
    railG.fillStyle(accent, 0.95);
    oval(railG, r1 + 8 * K, ry, 4.4 * K, 4.4 * K, true);
    for (const f of field) {
      railG.fillStyle(f.place === 1 ? 0xffe6a8 : col('#cbb6a4'), 0.85);
      oval(railG, lerp(r0, r1, clamp(f.pos / COURSE, 0, 1.02)), ry, 2.8 * K, 2.8 * K, true);
    }
    const mx = lerp(r0, r1, clamp(me.pos / COURSE, 0, 1.02));
    railG.fillStyle(accent, 1);
    oval(railG, mx, ry, 5 * K, 5 * K, true);
    railG.lineStyle(1.6 * K, moteCol, 0.5 + Math.sin(time / 380) * 0.14);
    oval(railG, mx, ry, 9.4 * K, 9.4 * K, false);

    // wind vane
    const wx = r0 - 46 * K, ang = (M.portrait ? -Math.PI / 2 : Math.PI) + wind.drift * 3.2;
    railG.lineStyle(2.4 * K, moteCol, 0.28 + wind.head * 0.55);
    railG.beginPath();
    railG.moveTo(wx - Math.cos(ang) * 15 * K, ry - Math.sin(ang) * 15 * K);
    railG.lineTo(wx + Math.cos(ang) * 15 * K, ry + Math.sin(ang) * 15 * K);
    railG.strokePath();
    railG.fillStyle(moteCol, 0.34 + wind.head * 0.5);
    oval(railG, wx + Math.cos(ang) * 17 * K, ry + Math.sin(ang) * 17 * K, 3 * K, 3 * K, true);

    // the ring at your feet: what is left in the legs
    const s = stageOf(0, me.lane);
    const frac = clamp(me.st / 100, 0, 1);
    const ringCol = me.st < 22 ? col('#ff7a5e') : me.st > 68 ? col('#ffe6a8') : accent;
    gaugeG.lineStyle(3.4 * K, 0x1a1016, 0.4);
    oval(gaugeG, s.x, M.Y(s.y) + 2, 34 * K, 9.8 * K, false);
    gaugeG.lineStyle(3.4 * K, ringCol, me.st < 22 ? 0.55 + Math.sin(time / 110) * 0.3 : 0.86);
    gaugeG.beginPath();
    for (let i = 0; i <= 26; i++) {
      const a = -Math.PI / 2 + TAU * frac * (i / 26);
      const px = s.x + Math.cos(a) * 34 * K, py = M.Y(s.y) + 2 + Math.sin(a) * 9.8 * K;
      if (i === 0) gaugeG.moveTo(px, py); else gaugeG.lineTo(px, py);
    }
    gaugeG.strokePath();
    if (me.cool > 0) {
      gaugeG.lineStyle(1.6 * K, col('#9c8a92'), 0.55);
      oval(gaugeG, s.x, M.Y(s.y) + 2, 40 * K, 12 * K, false);
    }
    if (me.legs > 0.04) {
      gaugeG.fillStyle(col('#ff7a5e'), 0.2 + me.legs * 0.28);
      oval(gaugeG, s.x, M.Y(s.y) + 2, 32 * K * me.legs, 8 * K * me.legs, true);
    }
  }

  /* ------------------------------------------------------------- the loop */
  scene.hud({ score: 0, progress: 0, hearts: HEARTS, extra: 'settled at the back' });
  scene.notice('eight ahead. spend nothing you have not earned', 3200);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000) * st.clock;
    if (!st.over) {
      let rem = dt, guard = 0;
      while (rem > 1e-4 && guard++ < 40) {
        const h = Math.min(0.02, rem);
        stepSim(h);
        rem -= h;
        if (st.over) break;
      }
    }
    windLayer.setFrequency(Math.round(lerp(760, 90, clamp(wind.head, 0, 1))));
    drawPlain(time);
    drawSlip(time);
    drawRunners(time);
    drawHud(time);
    veil.setFillStyle(col('#2a1220'), clamp((1 - me.st / 100) * 0.1 + me.legs * 0.12, 0, 0.22));

    const gapLead = leaderGap();
    st.score = Math.round(scoreNow());
    const extra = st.over ? (st.won ? 'the front, held' : 'off the back')
      : st.place === 1 ? 'clear of the pack — hold it'
        : me.draft > 0.5 ? 'in the slipstream, legs coming back'
          : me.st < 26 ? 'legs going — get out of the wind'
            : me.cool > 0 ? 'surge spent — wait for it'
              : gapLead > 34 ? 'they are pulling away'
                : 'easing behind the pack';
    scene.hud({ score: st.score, progress: clamp(me.pos / COURSE, 0, 1), hearts: st.hearts, extra });
    scene.audio.setTension(clamp((COURSE - me.pos < 90 ? 0.45 : 0.1) + clamp(gapLead / DROP_M, 0, 1) * 0.3 +
      (1 - me.st / 100) * 0.2 + (HEARTS - st.hearts) * 0.08, 0, 1));
  }

  function leaderGap() {
    let top = me.pos;
    for (const f of field) if (f.pos > top) top = f.pos;
    return top - me.pos;
  }

  /* -------------------------------------------------------------- helpers */
  function pagePoint(sx, sy) {
    const rect = scene.game.canvas.getBoundingClientRect();
    return { x: rect.left + (sx / W) * rect.width, y: rect.top + (sy / M.H) * rect.height };
  }
  const laneScreen = (lane) => {
    const l = clamp(lane, 0, 1);
    // the exact inverse of laneAt: a finger on this pixel asks for this lane
    return M.portrait ? pagePoint(laneLat(l), M.Y(G.pin - 26)) : pagePoint(G.pin + 60, M.Y(laneLat(l)));
  };
  function bestPocket() {
    let best = { lane: me.lane, value: -1, gap: 99, name: '' };
    for (const f of field) {
      const g = f.pos - me.pos;
      if (g < 0.85 || g > POCKET_MAX) continue;             // no room this close, no air that far
      const v = gapCurve(g);
      if (v > best.value) best = { lane: clamp(f.lane + wind.drift, 0.03, 0.97), value: v, gap: g, name: f.name };
    }
    if (best.value < 0) best.value = 0;
    return best;
  }
  function cleanestLane() {
    let best = st.over ? 0.5 : clamp(1 - me.lane, 0.02, 0.98), bestScore = -1;
    for (let i = 0; i <= 40; i++) {
      const lane = 0.02 + (i / 40) * 0.96;
      let near = 1;
      for (const f of field) {
        const g = f.pos - me.pos;
        if (g <= 0.4 || g > POCKET_MAX) continue;
        near = Math.min(near, Math.abs(lane - clamp(f.lane + wind.drift, 0.02, 0.98)) / POCKET_W);
      }
      if (near > bestScore) { bestScore = near; best = lane; }
    }
    return best;
  }

  return {
    update,
    state: () => {
      const pk = bestPocket();
      const second = ranked.filter((p) => p !== me).slice().sort((a, b) => b.pos - a.pos)[0] || me;
      return {
        id: 'pack-draft', unit: 'paces led', seed: seed, over: st.over, won: st.won, note: st.note,
        score: Math.round(scoreNow()), paces: Number(st.paces.toFixed(2)), passes: st.passes,
        endBonus: Number(st.endBonus.toFixed(2)), leadTime: Number(st.leadTime.toFixed(1)),
        hearts: st.hearts, place: st.place, led: st.led, field: list.length, course: COURSE,
        remaining: Number(Math.max(0, COURSE - me.pos).toFixed(1)),
        progress: Number(clamp(me.pos / COURSE, 0, 1).toFixed(3)),
        elapsed: Number(st.elapsed.toFixed(2)), clock: st.clock,
        dropLimit: DROP_M, gapLeader: Number(leaderGap().toFixed(2)),
        droppedRatio: Number(clamp(leaderGap() / DROP_M, 0, 1).toFixed(3)),
        me: {
          id: ME_ID, pos: Number(me.pos.toFixed(2)), lane: Number(me.lane.toFixed(3)),
          laneTarget: Number(me.laneTarget.toFixed(3)), speed: Number(me.speed.toFixed(3)),
          scrollPxPerSec: Number((me.speed * axisScale(0)).toFixed(1)),
          scrolled: Math.round(me.scrolled), effort: Number(me.e.toFixed(3)),
          stamina: Number(me.st.toFixed(2)), draft: Number(me.draft.toFixed(3)),
          costMul: Number((1 - DRAFT_RELIEF * me.draft).toFixed(3)),
          gapAhead: Number(me.gapA.toFixed(2)), aheadName: me.ahead >= 0 ? byId(me.ahead).name : '',
          legs: Number(me.legs.toFixed(3)), cool: Number(me.cool.toFixed(2)),
          surgeReady: me.cool <= 0, held: st.hold, place: me.place || 9,
          drain: Number((me.drain || 0).toFixed(3)), regen: Number((me.regen || 0).toFixed(3)),
          netStamina: Number((me.net || 0).toFixed(3))
        },
        pocket: { lane: Number(pk.lane.toFixed(3)), value: Number(pk.value.toFixed(3)), gap: Number(pk.gap.toFixed(2)), name: pk.name },
        cleanLane: Number(cleanestLane().toFixed(3)),
        wind: { head: Number(wind.head.toFixed(3)), drift: Number(wind.drift.toFixed(3)), gust: Number(wind.gust.toFixed(3)) },
        runners: field.map((f) => ({
          id: f.id, name: f.name, pos: Number(f.pos.toFixed(2)), lane: Number(f.lane.toFixed(3)),
          speed: Number(f.speed.toFixed(3)), effort: Number(f.e.toFixed(3)),
          stamina: Number(f.st.toFixed(2)), draft: Number(f.draft.toFixed(3)),
          legs: Number(f.legs.toFixed(3)), place: f.place || 0, boxed: !!f.boxed, moved: !!f.moved
        })),
        gapToSecond: Number((me.pos - second.pos).toFixed(2)),
        layout: M.portrait ? 'portrait-band' : 'landscape-plain',
        touch: { fingers, steering: steerId >= 0, mouse: !!mouse.isDown },
        ppm: Number(axisScale(0).toFixed(2)), stars: STAR
      };
    },
    setClock: (v) => { st.clock = clamp(Number(v) || 1, 0.2, 8); },
    laneScreen: (lane) => laneScreen(lane),
    pocketScreen: () => laneScreen(bestPocket().lane),
    cleanScreen: () => laneScreen(cleanestLane()),
    bestPocket: () => bestPocket(),
    cleanLane: () => Number(cleanestLane().toFixed(3)),
    // pace the legs are actually spending, and the cost of the next game-second
    paceNow: () => Number(me.e.toFixed(3)),
    costAt: (draft) => Number((DRAIN_K * Math.pow(me.e, 1.7) * (1 - DRAFT_RELIEF * clamp(Number(draft) || 0, 0, 1))).toFixed(2)),
    fieldBrief: () => ranked.map((p) => ({
      id: p.id, name: p.name, pos: Number(p.pos.toFixed(2)), lane: Number(p.lane.toFixed(3)),
      stamina: Number(p.st.toFixed(1)), place: p.place, you: p === me
    })),
    finishDistance: COURSE
  };
}

export default {
  id: 'pack-draft', unit: 'paces led', mood: 'dusk', stars: STAR, create,
  backdropOpts: { ground: false },
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
