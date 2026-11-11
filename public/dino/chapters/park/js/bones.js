/* Dino Park: Build-a-Dino.
 * Rebuild a dinosaur from its bones, give it skin and colour, name it, and watch it come alive in a diorama.
 * Every dinosaur the child builds moves into the Dino Museum (with the stars it earned). Skeleton art is drawn here, in code:
 * vertebrae follow a curve, ribs fan out, leg and wing bones are jointed chains, and each species has its own skull. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, drag, den, NAMES, SPECIES, COLORS, FX } = window.Park;
  const SP_NAME = { trex: 'T-rex', tricera: 'Triceratops', stego: 'Stegosaurus', bronto: 'Brontosaurus', raptor: 'Raptor', ptero: 'Pterosaur' };
  const PART_NAME = { tail: 'the tail', spine: 'the backbone', neck: 'the neck', ribs: 'the ribs', belly: 'the belly bones', chevron: 'the tail chevrons', skull: 'the skull', pelvis: 'the hips', legsB: 'the back legs', legsF: 'the front legs', legB: 'the back leg', legF: 'the front leg', legs: 'the legs', arms: 'the arms', plates: 'the back plates', body: 'the body', wingL: 'the near wing', wingR: 'the far wing' };
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const f1 = (n) => +n.toFixed(1);
  const f0 = (n) => Math.round(n);
  /* Best times go under a hyphenated key, so the hub's /^dino_[a-z]+$/ star count never sees them. */
  const bestMap = () => window.Park.store.get('x-best-bones', {}) || {};
  const beatBest = (round, secs) => {
    const all = bestMap(), was = Number(all[round]) || 0;
    if (was && secs >= was) return { was, best: was, isNew: false };
    all[round] = +secs.toFixed(1); window.Park.store.set('x-best-bones', all);
    return { was, best: all[round], isNew: !!was };
  };
  const bestLine = (round) => { const b = Number(bestMap()[round]) || 0; return b ? 'Best ⏱ ' + b + 's' : 'No time yet'; };
  /* A post-build "keep going" card that closes itself, so a wandering child can never wedge the runner. */
  function keepGoing(ctx, title, sub, label, color, build) {
    return new Promise((res) => {
      const card = el('div', 'du-keep');
      card.style.cssText = 'position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:60;display:flex;flex-direction:column;align-items:center;gap:8px;width:min(92vw,460px);background:#fffaf0;border:4px solid #ffcf33;border-radius:24px;padding:14px 18px 16px;box-shadow:0 10px 0 rgba(0,0,0,.22);text-align:center';
      card.innerHTML = '<b style="font-size:24px">' + title + '</b><span style="font-weight:800;font-size:15px;opacity:.8">' + sub + '</span>';
      const row = el('div'); row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center';
      const yes = el('button', 'btn', '✨ ' + label), no = el('button', 'btn ghost', 'No, I did enough!');
      row.append(yes, no); card.append(row); $('#game').append(card); FX.pop(card); FX.sfx.coin();
      let closed = false, started = false, timer = 0;
      const close = (v) => { if (closed) return; closed = true; clearTimeout(timer); card.remove(); res(v); };
      no.onclick = () => { FX.sfx.tap(); close(false); };
      yes.onclick = () => { if (started) return; started = true; row.remove(); FX.sfx.whoosh(); const box = el('div'); box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;width:100%'; card.append(box); build(box, () => close(true)); };
      timer = setTimeout(() => close(started), started ? 45000 : 18000);
    });
  }
  /* Every bone clicks home with its own sound, so a skull and a tail do not thunk alike. */
  const BONE_SFX = { skull: 'chomp', spine: 'thud', tail: 'boing', ribs: 'whoosh', neck: 'pop', pelvis: 'drum', legs: 'jump', legsB: 'jump', legsF: 'tap', legB: 'jump', legF: 'tap', arms: 'chirp', plates: 'sparkle', wingL: 'splash', wingR: 'splash', body: 'thud' };
  /* Four dig sites with their own light and litter: rebuilding never looks like the last time. */
  const SITES = [
    { name: 'Sunny quarry', sky: ['#cfeaff', '#f8e6b4'], far: '#dcc189', hill: '#e3b873', dig: '#cf9f58', ink: '#8a5a2a', props: ['🌵', '🪨', '⛏️', '🦖'], litter: 6 },
    { name: 'River bank', sky: ['#bfe9f2', '#eafbd9'], far: '#a8d3b8', hill: '#cfc08a', dig: '#a9b071', ink: '#5f6b3a', props: ['🪵', '🌾', '🐊', '🦴'], litter: 8 },
    { name: 'Red desert', sky: ['#ffd0a2', '#ffe9c4'], far: '#e08a5a', hill: '#d17a4a', dig: '#b2603a', ink: '#7a3a20', props: ['🌞', '🏜️', '🦂', '🪨'], litter: 7 },
    { name: 'Lantern site', sky: ['#2a2f6b', '#5b4a86'], far: '#3f3a6a', hill: '#4a3f63', dig: '#3a3050', ink: '#241f38', props: ['🏮', '🌙', '✨', '🦴'], litter: 9, dark: 1 },
  ];
  /* Rounds 3 and 4 grow the animal: more vertebrae, more ribs, more plates. */
  let RICH = 1, boneDeck = [], siteBank = [];
  const B = (n) => Math.max(3, Math.round(n * RICH));

  /* ---------- skeleton drawing helpers (400 x 260 box, dinosaur faces right, ground at y = 240) ---------- */
  function catmull(pts, n) {
    const out = [], seg = pts.length - 1;
    for (let i = 0; i <= n; i++) {
      const u = i / n * seg, k = Math.min(seg - 1, Math.floor(u)), t = u - k;
      const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
      const f = (a, b, c, d) => .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
    return out;
  }
  /* A row of vertebrae along a curve; sizes shrink or grow with `size(t)`; optional spiky processes on top. */
  function vertebrae(pts, want, size, spike) {
    const n = B(want);   /* later rounds grow extra vertebrae */
    const s = catmull(pts, n); let o = '';
    for (let i = 0; i <= n; i++) {
      const a = i < n ? Math.atan2(s[i + 1][1] - s[i][1], s[i + 1][0] - s[i][0]) : Math.atan2(s[i][1] - s[i - 1][1], s[i][0] - s[i - 1][0]);
      const z = size(i / n);
      o += `<g transform="translate(${f1(s[i][0])} ${f1(s[i][1])}) rotate(${f1(a * 180 / Math.PI)})">${spike ? `<path class="bn" d="M${f1(-z * .22)} ${f1(-z * .4)} L0 ${f1(-z * .4 - spike)} L${f1(z * .22)} ${f1(-z * .4)}Z"/>` : ''}<rect class="bn" x="${f1(-z * .62)}" y="${f1(-z * .45)}" width="${f1(z * 1.24)}" height="${f1(z * .9)}" rx="${f1(z * .36)}"/><circle class="hl" cx="${f1(-z * .12)}" cy="${f1(-z * .15)}" r="${f1(z * .12)}"/></g>`;
    }
    return o;
  }
  /* A jointed bone chain: an outlined bone with knobbly joints (legs, arms, wing fingers, horns). */
  function chain(pts, thick, joints) {
    const d = 'M' + pts.map((p) => p.join(' ')).join(' L');
    let o = `<path class="bo" d="${d}" stroke-width="${thick + 4.5}"/><path class="bi" d="${d}" stroke-width="${thick}"/>`;
    if (joints !== false) pts.forEach((p, i) => { if (i < pts.length - 1 || joints === 'all') o += `<circle class="bn" cx="${p[0]}" cy="${p[1]}" r="${f1(thick * (i === 0 ? .7 : .6))}"/>`; });
    return o;
  }
  const claw = (x, y, dx, dy) => { const L = Math.hypot(dx, dy) || 1, px = -dy / L * 3.4, py = dx / L * 3.4; return `<path class="bn" d="M${f1(x + px)} ${f1(y + py)} Q${f1(x + dx * .7 + px * .5)} ${f1(y + dy * .7 + py * .5)} ${f1(x + dx)} ${f1(y + dy)} Q${f1(x + dx * .5 - px * .3)} ${f1(y + dy * .5 - py * .3)} ${f1(x - px)} ${f1(y - py)}Z"/>`; };
  function ribs(x0, x1, y, depth, n, lean) {
    let o = '';
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? .5 : i / (n - 1), x = x0 + (x1 - x0) * t, d = depth * (1 - Math.pow((t - .4) * 1.2, 2) * .9), l = lean || 0;
      const p = `M${f1(x)} ${y} C${f1(x + 9 + l)} ${f1(y + d * .35)} ${f1(x + 12 + l)} ${f1(y + d * .8)} ${f1(x + 3 + l)} ${f1(y + d)}`;
      o += `<path class="bo" d="${p}" stroke-width="8"/><path class="bi" d="${p}" stroke-width="4"/>`;
    }
    return o + `<path class="bn" d="M${f1(x0 + 10)} ${f1(y + depth * .78)} Q${f1((x0 + x1) / 2)} ${f1(y + depth * 1.02)} ${f1(x1 + 6)} ${f1(y + depth * .85)} L${f1(x1 + 6)} ${f1(y + depth * .9)} Q${f1((x0 + x1) / 2)} ${f1(y + depth * 1.1)} ${f1(x0 + 10)} ${f1(y + depth * .86)}Z"/>`;
  }
  const pelvis = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><path class="bn" d="M-30 -8 Q-8 -28 26 -12 L18 12 L10 38 Q2 44 -6 36 L-8 10 Q-22 10 -30 -8Z"/><path class="ln" d="M-18 -6 Q0 -16 16 -6"/><circle class="bn" cx="4" cy="14" r="8"/><circle class="hl" cx="2" cy="12" r="2.4"/></g>`;
  const tooth = (x, y, h) => `<path class="bn tooth" d="M${x - 2.5} ${y} L${x} ${y + h} L${x + 2.5} ${y}Z"/>`;
  const teeth = (x0, x1, y, n, h) => Array.from({ length: n }, (_, i) => tooth(f1(x0 + (x1 - x0) * i / Math.max(1, n - 1)), y, h)).join('');
  const SKULL = {
    trex: () => `<path class="bn" d="M-8 -2 Q8 -18 36 -15 Q56 -13 68 -2 Q72 5 66 11 L54 13 L50 22 L20 27 Q2 29 -6 19 Q-12 6 -8 -2Z"/><path class="ln" d="M2 19 Q30 12 62 11"/><ellipse class="eye" cx="22" cy="-3" rx="8" ry="7"/><ellipse class="eye" cx="60" cy="-3" rx="2.6" ry="2"/><path class="ln" d="M30 -12 Q38 -4 34 6"/>${teeth(54, 24, 12, 6, 8)}`,
    tricera: () => `<path class="bn" d="M-34 8 Q-40 -44 8 -56 Q46 -52 44 -14 L34 8Z"/><path class="ln" d="M-24 4 Q-26 -30 6 -42 M-8 2 Q-8 -22 12 -34"/>${[-28, -20, -12, -4, 4, 12, 20, 28].map((a, i) => `<circle class="bn" cx="${f1(-6 + Math.cos((a - 100) * Math.PI / 100) * 40)}" cy="${f1(-6 + Math.sin((a - 100) * Math.PI / 100) * 44)}" r="3"/>`).join('')}<path class="bn" d="M30 -12 Q62 -10 80 6 Q84 14 74 15 L60 21 L30 24Z"/><path class="bn" d="M72 4 L92 12 L74 20Z"/><ellipse class="eye" cx="42" cy="-2" rx="6" ry="5.4"/>${chain([[52, -10], [74, -38]], 4.5, false)}${chain([[40, -14], [54, -46]], 4.5, false)}<path class="bn" d="M70 2 L76 -10 L80 4Z"/>`,
    stego: () => `<path class="bn" d="M0 0 Q20 -9 46 -3 Q56 2 50 9 L22 15 Q4 13 0 0Z"/><ellipse class="eye" cx="15" cy="-1" rx="4.6" ry="4"/><path class="ln" d="M4 11 Q26 8 48 7"/>${teeth(34, 46, 9, 4, 5)}`,
    bronto: () => `<path class="bn" d="M0 0 Q14 -11 32 -5 Q42 1 36 10 L10 13 Q-4 9 0 0Z"/><ellipse class="eye" cx="13" cy="-1" rx="4.4" ry="4"/><ellipse class="eye" cx="30" cy="-2" rx="2.2" ry="1.6"/><path class="ln" d="M2 9 Q20 6 36 8"/>${teeth(24, 34, 8, 3, 5)}`,
    raptor: () => `<path class="bn" d="M-6 -2 Q18 -15 54 -5 L68 2 L58 10 L18 17 Q-8 15 -6 -2Z"/><path class="ln" d="M2 12 Q30 9 60 7"/><ellipse class="eye" cx="16" cy="-1" rx="6" ry="5.4"/><ellipse class="eye" cx="56" cy="-1" rx="2.2" ry="1.8"/>${teeth(58, 22, 8, 7, 7)}`,
    ptero: () => `<path class="bn" d="M2 -2 Q-26 -16 -38 -2 Q-14 -2 8 7Z"/><path class="bn" d="M0 0 Q22 -8 74 6 L74 10 Q34 11 0 14 Q-7 7 0 0Z"/><ellipse class="eye" cx="16" cy="3" rx="5.4" ry="4.8"/><path class="ln" d="M10 11 Q40 9 72 9"/>${teeth(30, 66, 10, 5, 4)}`,
  };
  const skull = (type, x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s || 1})">${SKULL[type]()}</g>`;

  /* Each species returns its pieces in the order they are drawn, back to front. */
  const SK = {
    tricera() {
      const sp = [[22, 176], [68, 168], [110, 150], [180, 140], [248, 146], [292, 154]];
      return [
        { id: 'tail', svg: vertebrae(sp.slice(0, 3).concat([[140, 144]]), 11, (t) => 17 - t * 8 + (t > .85 ? 3 : 0), 0) },
        { id: 'spine', svg: vertebrae([[110, 150], [180, 140], [248, 146], [292, 154]], 12, (t) => 14 + Math.sin(t * 3) * 1.5, 7) },
        { id: 'ribs', svg: ribs(160, 252, 152, 56, 8, 2) },
        { id: 'pelvis', svg: pelvis(112, 154, 1.1) },
        { id: 'legsB', svg: chain([[126, 166], [140, 198], [134, 222], [142, 238]], 11) + chain([[110, 166], [98, 198], [106, 222], [112, 238]], 12) },
        { id: 'legsF', svg: chain([[238, 162], [228, 196], [234, 222], [238, 238]], 10) + chain([[254, 162], [264, 196], [258, 222], [264, 238]], 11) },
        { id: 'skull', svg: skull('tricera', 308, 162, 1, 6) },
      ];
    },
    stego() {
      const sp = [[22, 200], [70, 190], [120, 160], [170, 134], [220, 138], [270, 160], [310, 182]];
      const plates = [.3, .38, .46, .54, .62, .7, .78].map((t, i) => { const p = catmull(sp, 40)[Math.round(t * 40)], h = 20 + Math.sin(t * Math.PI) * 18; return `<path class="bn" d="M${f1(p[0] - 13)} ${f1(p[1] - 6)} L${f1(p[0] + 1)} ${f1(p[1] - 6 - h)} L${f1(p[0] + 15)} ${f1(p[1] - 6)}Z"/><path class="ln" d="M${f1(p[0])} ${f1(p[1] - 8)} L${f1(p[0] + 1)} ${f1(p[1] - h)}"/>`; }).join('');
      return [
        { id: 'tail', svg: vertebrae(sp.slice(0, 3), 11, (t) => 16 - t * 8, 0) + claw(30, 196, -22, -38) + claw(40, 196, -4, -44) + claw(18, 202, -34, -22) + claw(48, 194, 14, -40) },
        { id: 'spine', svg: vertebrae(sp.slice(2), 13, (t) => 13 + Math.sin(t * 3) * 2, 0) },
        { id: 'plates', svg: plates },
        { id: 'ribs', svg: ribs(128, 250, 150, 64, 9, 2) },
        { id: 'pelvis', svg: pelvis(118, 166, 1.15) },
        { id: 'legsB', svg: chain([[134, 172], [150, 204], [142, 226], [148, 238]], 12) + chain([[118, 172], [106, 206], [114, 226], [118, 238]], 13) },
        { id: 'legsF', svg: chain([[250, 168], [242, 198], [246, 222], [250, 238]], 9) + chain([[264, 168], [274, 198], [270, 222], [276, 238]], 10) },
        { id: 'skull', svg: skull('stego', 306, 176, .95, 22) },
      ];
    },
    bronto() {
      const sp = [[10, 178], [60, 172], [110, 152], [170, 142], [220, 146], [250, 140], [272, 100], [290, 62], [310, 38]];
      return [
        { id: 'tail', svg: vertebrae(sp.slice(0, 4), 13, (t) => 15 - t * 9, 0) },
        { id: 'spine', svg: vertebrae([[110, 152], [170, 142], [220, 146], [250, 140]], 9, (t) => 15, 5) },
        { id: 'neck', svg: vertebrae([[250, 140], [272, 100], [290, 62], [310, 38]], 11, (t) => 13 - t * 6, 4) },
        { id: 'ribs', svg: ribs(150, 238, 150, 62, 8, 2) },
        { id: 'pelvis', svg: pelvis(112, 156, 1.1) },
        { id: 'legsB', svg: chain([[124, 164], [136, 196], [132, 222], [138, 238]], 13) + chain([[108, 164], [100, 198], [104, 222], [108, 238]], 14) },
        { id: 'legsF', svg: chain([[238, 160], [232, 196], [238, 222], [244, 238]], 12) + chain([[222, 160], [214, 196], [218, 222], [224, 238]], 13) },
        { id: 'skull', svg: skull('bronto', 308, 34, .95, -8) },
      ];
    },
    trex() {
      const sp = [[14, 164], [60, 152], [110, 130], [150, 120], [210, 114], [258, 102], [292, 86], [312, 70]];
      return [
        { id: 'tail', svg: vertebrae(sp.slice(0, 4), 14, (t) => 17 - t * 9, 0) },
        { id: 'spine', svg: vertebrae([[150, 120], [210, 114], [258, 102]], 9, (t) => 14, 5) },
        { id: 'neck', svg: vertebrae([[258, 102], [292, 86], [312, 70]], 6, (t) => 13 - t * 3, 4) },
        { id: 'ribs', svg: ribs(172, 252, 112, 60, 8, 3) },
        { id: 'pelvis', svg: pelvis(142, 124, 1.2) },
        { id: 'legB', svg: chain([[150, 134], [180, 168], [158, 208], [162, 236], [192, 238]], 13) + claw(190, 232, 14, 8) + claw(186, 238, 14, 2) },
        { id: 'legF', svg: chain([[132, 134], [160, 170], [138, 208], [142, 236], [172, 238]], 14) + claw(170, 232, 14, 8) + claw(166, 238, 14, 2) },
        { id: 'arms', svg: chain([[256, 116], [272, 134], [286, 130]], 6) + claw(286, 130, 10, 4) + claw(286, 132, 9, 10) },
        { id: 'skull', svg: skull('trex', 304, 66, 1.18, -6) },
      ];
    },
    raptor() {
      const sp = [[12, 152], [60, 148], [110, 130], [150, 122], [200, 118], [246, 106], [274, 90], [292, 74]];
      return [
        { id: 'tail', svg: vertebrae(sp.slice(0, 4), 15, (t) => 12 - t * 6, 0) + chain([[14, 152], [100, 138]], 2.5, false) },
        { id: 'spine', svg: vertebrae([[150, 122], [200, 118], [246, 106]], 9, (t) => 12, 4) },
        { id: 'neck', svg: vertebrae([[246, 106], [274, 90], [292, 74]], 6, (t) => 11 - t * 2, 3) },
        { id: 'ribs', svg: ribs(168, 236, 116, 48, 7, 2) },
        { id: 'pelvis', svg: pelvis(140, 126, 1) },
        { id: 'legs', svg: chain([[148, 134], [172, 164], [150, 200], [154, 232], [180, 236]], 10) + claw(150, 226, -12, -20) + chain([[130, 134], [154, 166], [132, 202], [138, 232], [164, 236]], 11) + claw(134, 226, -12, -20) },
        { id: 'arms', svg: chain([[238, 120], [256, 140], [282, 144]], 6) + claw(282, 144, 14, 2) + claw(282, 146, 12, 8) + claw(280, 148, 8, 13) },
        { id: 'skull', svg: skull('raptor', 286, 68, 1, -8) },
      ];
    },
    ptero() {
      const wingL = '<path class="mem" d="M206 118 L166 68 L112 38 L40 14 L70 86 L96 96 L132 98Z"/>' + chain([[206, 118], [166, 68], [112, 38], [40, 14]], 8) + chain([[112, 38], [70, 86]], 4, false) + chain([[112, 38], [96, 96]], 4, false) + chain([[112, 38], [132, 98]], 4, false);
      const wingR = '<path class="mem" d="M216 126 L190 172 L150 208 L96 230 L110 176 L140 166 L176 170Z"/>' + chain([[216, 126], [190, 172], [150, 208], [96, 230]], 8) + chain([[150, 208], [110, 176]], 4, false) + chain([[150, 208], [140, 166]], 4, false) + chain([[150, 208], [176, 170]], 4, false);
      return [
        { id: 'wingR', svg: wingR },
        { id: 'tail', svg: vertebrae([[134, 130], [104, 140], [76, 150]], 6, (t) => 9 - t * 5, 0) },
        { id: 'body', svg: vertebrae([[134, 130], [170, 124], [220, 122], [250, 112]], 9, (t) => 13, 4) + ribs(176, 232, 128, 34, 6, 1) + pelvis(142, 134, .7) },
        { id: 'legs', svg: chain([[190, 150], [186, 176], [176, 198]], 5) + claw(176, 198, -8, 6) + chain([[204, 150], [208, 176], [214, 198]], 5) + claw(214, 198, 8, 6) },
        { id: 'neck', svg: vertebrae([[250, 112], [272, 94], [288, 78]], 6, (t) => 10 - t * 2, 0) },
        { id: 'wingL', svg: wingL },
        { id: 'skull', svg: skull('ptero', 290, 74, 1, -22) },
      ];
    },
  };
  window.Park.skeletons = SK;   // handy for a future museum view
  const WINGS = { ptero: ['wingL', 'wingR'] };
  /* After the last build: five golden bones into a tiny skeleton. Tap a bone, then tap the glow it fits. */
  function bonusGolden(ctx, host, done) {
    RICH = 1;
    const art = {
      skull: skull('trex', 34, 24, .42, 0),
      spine: vertebrae([[6, 26], [28, 20], [52, 24]], 4, () => 7, 3),
      ribs: ribs(16, 44, 14, 20, 3, 1),
      legs: chain([[26, 8], [32, 22], [24, 34]], 5) + claw(24, 34, 8, 4),
      tail: vertebrae([[54, 26], [30, 32], [6, 36]], 5, () => 6, 0),
    };
    const gold = (s) => s.replace(/class="bn"/g, 'class="bn" fill="#ffd864" stroke="#8a6112"')
      .replace(/class="bo"/g, 'class="bo" stroke="#8a6112"').replace(/class="bi"/g, 'class="bi" stroke="#ffeaa6"')
      .replace(/class="hl"/g, 'class="hl" fill="#fff8d8"').replace(/class="ln"/g, 'class="ln" stroke="#a47c1f"');
    host.innerHTML = '<p style="margin:0;font-weight:800;font-size:14px">Five golden bones! Tap a bone, then tap the glow it fits.</p>';
    const strip = el('div', 'gold-strip'), tray = el('div', 'gold-tray');
    strip.style.cssText = 'display:flex;gap:6px;justify-content:center;align-items:flex-end;flex-wrap:wrap;width:min(94vw,400px);background:linear-gradient(#5a4a2a,#382d1b);border-radius:18px;padding:8px;box-shadow:inset 0 4px 10px rgba(0,0,0,.45)';
    tray.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center';
    const ids = Object.keys(art), slots = {};
    ids.forEach((id) => {
      const s = el('button', 'gold-slot'); s.dataset.id = id; s.setAttribute('aria-label', 'Golden place: ' + PART_NAME[id]);
      s.style.cssText = 'width:66px;height:48px;border:3px dashed #d9b45f;border-radius:12px;background:rgba(255,238,180,.14);display:grid;place-items:center;cursor:pointer;padding:0;font-family:inherit';
      s.innerHTML = `<svg viewBox="0 0 60 44" width="54" height="38" opacity=".3">${gold(art[id])}</svg>`;
      strip.append(s); slots[id] = s;
    });
    let sel = null, got = 0;
    const clearSel = () => { $$('.gold-bone', tray).forEach((q) => { q.classList.remove('sel'); q.style.outline = ''; }); };
    const put = (b, s) => {
      if (!s || s.classList.contains('full')) return false;
      if (s.dataset.id !== b.dataset.id) { FX.sfx.thud(); FX.shake(s); FX.shake(b); ctx.say('Nearly! Look at the shape of the glow.'); return false; }
      s.classList.add('full'); s.style.borderStyle = 'solid'; s.style.background = 'rgba(255,238,180,.6)';
      b.remove(); FX.sfx.coin(); FX.sfx.note(got * 2 + 4, .18);
      const c = centreOf(s); FX.burst(c.x, c.y, { kind: 'stars', n: 10 });
      FX.anim(s, [{ transform: 'scale(1.32)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.3,1.5,.5,1)' });
      ctx.say(`${PART_NAME[b.dataset.id]} in gold! ${ids.length - got - 1} to go.`);
      if (++got === ids.length) { ctx.bonus(2, strip, 'Golden skeleton!'); FX.celebrate(); FX.sfx.win(); setTimeout(done, 1300); }
      return true;
    };
    shuffle(ids).forEach((id) => {
      const b = el('button', 'gold-bone'); b.dataset.id = id; b.setAttribute('aria-label', 'Golden bone: ' + PART_NAME[id]);
      b.style.cssText = 'width:72px;height:54px;border:0;border-radius:14px;background:#fff8e2;box-shadow:0 4px 0 rgba(0,0,0,.3);display:grid;place-items:center;cursor:pointer;padding:0;font-family:inherit';
      b.innerHTML = `<svg viewBox="0 0 60 44" width="62" height="44">${gold(art[id])}</svg>`;
      b.onclick = () => { clearSel(); sel = b; b.classList.add('sel'); b.style.outline = '4px solid #ffcf33'; FX.sfx.tap(); FX.pulse(b); ctx.say('Now tap the place it glows.'); };
      tray.append(b);
    });
    ids.forEach((id) => { slots[id].onclick = () => { if (!sel) { ctx.say('Choose a golden bone first!'); FX.sfx.tap(); return; } if (put(sel, slots[id])) { sel = null; clearSel(); } }; });
    host.append(strip, tray);
  }

  /* ---------- store: pieces already placed, per round, for the museum ---------- */
  window.Park.register({
    id: 'bones', name: 'Build-a-Dino', icon: 'trex', color: '#b07a3a', rounds: 4, helper: 'trex', helperColor: 'orange', ambient: 'desert',
    desc: 'Rebuild a dinosaur from its bones, then bring it to life!',
    round(ctx) {
      const R = ctx.round;
      RICH = [1, 1.1, 1.4, 1.7][R - 1];
      /* Triceratops first, T-rex last, and two species in between that change with every play. */
      if (R === 1) { boneDeck = ['tricera', ...shuffle(SPECIES.filter((s) => s !== 'tricera' && s !== 'trex')).slice(0, 2), 'trex']; siteBank = shuffle(SITES); }
      const species = boneDeck[R - 1], S = siteBank[(R - 1) % siteBank.length];
      const parts = SK[species](), spin = R >= 3, blind = R === 4;
      const t0 = Date.now(); let slips = 0, hints = 0, placed = 0, total = parts.length, stage = 'bones', selected = null;
      ctx.say(R === 1 ? `Dig site! Drag the bones to rebuild the ${SP_NAME[species]}.` : spin ? 'Some bones are upside down! Tap a bone to turn it, then drag it into place.' : `A new skeleton at the ${S.name.toLowerCase()}! Rebuild the ${SP_NAME[species]}.`);

      const wrap = el('div', 'bd-wrap');
      const steps = el('div', 'bd-steps', ['🦴 Bones', '🎨 Skin', '🏷️ Name', '🌿 Alive!'].map((t, i) => `<span class="${i === 0 ? 'now' : ''}">${t}</span>`).join(''));
      const stageBox = el('div', 'bd-stage');
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 400 260'); svg.setAttribute('class', 'bd-svg');
      /* Every site brings its own light, hills and litter, so the same bones never sit in the same place twice. */
      const hills = (() => { let d = 'M0 182'; for (let x = 0; x < 400; x += 50) d += ` Q${x + 25} ${150 - rnd(48)} ${x + 50} ${170 + rnd(20)}`; return d + ' V260 H0Z'; })();
      const litter = Array.from({ length: S.litter }, () => `<text x="${f0(8 + rnd(384))}" y="${f0(198 + rnd(54))}" font-size="${f0(12 + rnd(15))}" opacity="${S.dark ? .7 : .9}">${pick(S.props)}</text>`).join('');
      const night = S.dark ? `${Array.from({ length: 20 }, () => `<circle cx="${f0(rnd(400))}" cy="${f0(rnd(150))}" r="${f1(1 + Math.random() * 1.6)}" fill="#fff" opacity="${f1(.5 + Math.random() * .5)}"/>`).join('')}
        <circle cx="66" cy="44" r="20" fill="#fffbe0"/><circle cx="58" cy="38" r="18" fill="${S.sky[0]}"/><text x="318" y="206" font-size="26">🏮</text><circle cx="330" cy="196" r="26" fill="#ffdf8a" opacity=".2"/>`
        : `<circle cx="350" cy="40" r="22" fill="#ffd45a"/><circle cx="350" cy="40" r="32" fill="#ffd45a" opacity=".3"/>`;
      const stakes = R >= 2 ? `<g fill="none" stroke-linecap="round"><path d="M20 238 V212 M380 238 V212" stroke="#6b4a22" stroke-width="4"/><path d="M20 214 Q200 ${196 + rnd(14)} 380 214" stroke="#e9d69a" stroke-width="2.5" stroke-dasharray="6 5"/></g>` : '';
      svg.innerHTML = `<defs><linearGradient id="bdsky${R}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.sky[0]}"/><stop offset="1" stop-color="${S.sky[1]}"/></linearGradient></defs>
        <rect width="400" height="260" fill="url(#bdsky${R})"/>${night}
        <path d="${hills}" fill="${S.far}" opacity=".9"/>
        <path d="M0 214 Q80 196 160 212 T320 206 T400 214 V260 H0Z" fill="${S.hill}"/><path d="M0 238 Q120 226 240 240 T400 236 V260 H0Z" fill="${S.dig}"/>
        <path d="M18 238 q-4 -34 8 -50 M26 190 q-18 -4 -24 8 M26 190 q14 -14 28 -6" stroke="#4d7a3c" stroke-width="5" fill="none" stroke-linecap="round"/>
        <g fill="${S.ink}" opacity=".55"><ellipse cx="62" cy="250" rx="14" ry="5"/><ellipse cx="360" cy="248" rx="18" ry="6"/><ellipse cx="220" cy="252" rx="12" ry="4"/></g>
        ${stakes}<ellipse cx="206" cy="244" rx="150" ry="9" fill="${S.ink}" opacity=".22"/>${litter}`;
      const gGhost = document.createElementNS(ns, 'g'), gPlaced = document.createElementNS(ns, 'g');
      gGhost.setAttribute('class', 'bd-ghosts' + (blind ? ' faint' : '')); gPlaced.setAttribute('class', 'bd-placed');
      svg.append(gGhost, gPlaced);
      stageBox.append(svg);
      const tray = el('div', 'bd-tray');
      const bar = el('div', 'bd-progress', '<span>0 / 0 bones</span><i></i>');
      const hintBtn = el('button', 'btn small bd-hint', '💡 Show me');
      /* Peeking at the ghost shape is free, as often as you like; the helper's hint still counts. */
      const peekBtn = el('button', 'btn small bd-peek', '👻 Ghost bones');
      const top = el('div', 'bd-top');
      top.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;font-weight:900;font-size:14px;color:#fff;background:linear-gradient(90deg,#b07a3a,#e0b169);border-radius:16px;padding:5px 12px;box-shadow:0 4px 0 rgba(0,0,0,.16)';
      const topBones = el('span', 'bd-top-count'), topBest = el('span', 'bd-top-best');
      top.append(el('b', 'bd-top-level', `Level ${R} · ${S.name}`), topBones, topBest);
      wrap.append(steps, top, stageBox, bar, tray, hintBtn, peekBtn); ctx.area.append(wrap);
      const slotOf = {}, placedOf = {};
      const addGhost = (p) => {
        const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'ghost'); g.dataset.id = p.id; g.innerHTML = p.svg; gGhost.append(g); slotOf[p.id] = g;
        const q = document.createElementNS(ns, 'g'); q.setAttribute('class', 'put'); q.dataset.id = p.id; q.innerHTML = p.svg; gPlaced.append(q); placedOf[p.id] = q;
      };
      parts.forEach(addGhost);
      /* Later animals grow extra bones, measured out of the ribcage and tail the skeleton just drew. */
      if (R >= 3) {
        const rib = slotOf.ribs || slotOf.body, tail = slotOf.tail;
        let b = null, tb = null;
        try { b = rib && rib.getBBox(); tb = tail && tail.getBBox(); } catch (e) { /* needs the site on screen before it can measure */ }
        if (b && b.width > 10) {
          parts.push({ id: 'belly', svg: ribs(f0(b.x + b.width * .26), f0(b.x + b.width * .72), f0(b.y + b.height * .92), f0(b.height * .3), R >= 4 ? 4 : 3, -2) });
          addGhost(parts[parts.length - 1]);
          if (R >= 4 && tb && tb.width > 20) {
            parts.push({ id: 'chevron', svg: chain([[f0(tb.x + tb.width * .62), f0(tb.y + tb.height * .82)], [f0(tb.x + tb.width * .34), f0(tb.y + tb.height * 1.04)]], 4.5, false)
              + chain([[f0(tb.x + tb.width * .84), f0(tb.y + tb.height * .68)], [f0(tb.x + tb.width * .58), f0(tb.y + tb.height * .92)]], 4, false) });
            addGhost(parts[parts.length - 1]);
          }
        }
      }
      total = parts.length;
      const bump = (n) => { $('span', bar).textContent = `${n} / ${total} bones`; $('i', bar).style.width = (n / total * 100) + '%'; topBones.textContent = `${total} bones`; };
      bump(0); topBest.textContent = bestLine(R);

      // Each piece is cut from the same skeleton, cropped to its own bounds, so shapes stay in proportion.
      const pieces = parts.map((p, i) => {
        const bb = slotOf[p.id].getBBox(), pad = 10, w = bb.width + pad * 2, h = bb.height + pad * 2, k = Math.min(.6, 170 / Math.max(w, h));
        const d = el('div', 'bd-piece'); d.dataset.id = p.id;
        d.innerHTML = `<span class="pc-rot"><svg viewBox="${f1(bb.x - pad)} ${f1(bb.y - pad)} ${f1(w)} ${f1(h)}" width="${f1(Math.max(56, w * k))}" height="${f1(Math.max(40, h * k))}"><g>${p.svg}</g></svg></span>`;
        d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'Bone: ' + PART_NAME[p.id]);
        d.dataset.rot = spin ? [90, 180, 270][rnd(3)] : 0; $('.pc-rot', d).style.transform = `rotate(${d.dataset.rot}deg)`;
        FX.anim(d, [{ opacity: 0, transform: 'translateY(14px) scale(.8)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: i * 55, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'backwards' });
        return d;
      });
      const rotate = (d) => { d.dataset.rot = (+d.dataset.rot + 90) % 360; $('.pc-rot', d).style.transform = `rotate(${d.dataset.rot}deg)`; FX.sfx.scrape(); };
      const slotsAt = (x, y) => parts.map((p) => slotOf[p.id]).filter((g) => !g.classList.contains('done')).filter((g) => { const r = g.getBoundingClientRect(); return x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8; });
      const place = (d, x, y) => {
        const cands = slotsAt(x, y); if (!cands.length) return false;
        const own = slotOf[d.dataset.id];
        if (!cands.includes(own)) {
          slips++; ctx.bad(.5, cands[0]); FX.shake(cands[0]); FX.sfx.thud();
          const there = cands[0].dataset.id;
          /* A wrong drop names both bones, so the miss teaches instead of only buzzing. */
          ctx.say(R === 1 ? `You are holding ${PART_NAME[d.dataset.id]}. This shape is ${PART_NAME[there]} — see which way it curves?`
            : `So close! ${PART_NAME[there]} lives here, and your ${PART_NAME[d.dataset.id]} has a friend nearby.`, 'sad');
          return false;
        }
        if (+d.dataset.rot % 360 !== 0) { ctx.say('Right place! Now tap the bone to turn it the right way up.'); FX.pop(d); FX.sfx.tap(); return false; }
        snap(d); return true;
      };
      const snap = (d) => {
        const id = d.dataset.id, slot = slotOf[id], put = placedOf[id];
        slot.classList.add('done'); put.classList.add('on');
        FX.sfx[BONE_SFX[id] || 'thud'](); FX.sfx.note(placed * 2 + 3, .18);
        put.style.transformBox = 'fill-box'; put.style.transformOrigin = 'center'; FX.anim(put, [{ transform: 'scale(1.22)', opacity: .3 }, { transform: 'scale(.96)', opacity: 1, offset: .6 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
        const c = centreOf(slot); FX.burst(c.x, c.y, { kind: 'sparkle', n: 12 }); FX.burst(c.x, c.y, { kind: 'bones', n: 3, scale: .7 });
        const ring = el('div');
        ring.style.cssText = `position:fixed;left:${f0(c.x - 34)}px;top:${f0(c.y - 34)}px;width:68px;height:68px;border-radius:50%;border:5px solid #ffdf6b;pointer-events:none;z-index:60`;
        document.body.append(ring);
        FX.anim(ring, [{ transform: 'scale(.5)', opacity: 1 }, { transform: 'scale(1.9)', opacity: 0 }], { duration: 620, easing: 'ease-out' });
        setTimeout(() => ring.remove(), 700);
        // Blink the skull's eyes the moment the head clicks home — a skeleton should wink back.
        $$('ellipse.eye', put).forEach((e, i) => {
          e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
          FX.anim(e, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.1)', offset: .5 }, { transform: 'scaleY(1)' }], { duration: 480, delay: 220 + i * 90 });
        });
        d.classList.add('locked'); d.remove(); ctx.good(slot); placed++; bump(placed);
        ctx.say(placed < total ? `That is ${PART_NAME[id]}! ${total - placed} bone${total - placed === 1 ? '' : 's'} to go.` : `That is ${PART_NAME[id]}! The ${SP_NAME[species]} has every bone!`);
        if (placed === total) setTimeout(() => skinStage(), 700);
      };
      shuffle(pieces).forEach((d) => {
        drag(d, {
          over: (x, y) => { const s = slotsAt(x, y); parts.forEach((p) => slotOf[p.id].classList.toggle('hot', s.includes(slotOf[p.id]) && s[0] === slotOf[p.id])); },
          drop: (x, y) => { parts.forEach((p) => slotOf[p.id].classList.remove('hot')); return place(d, x, y); },
          tap: () => { if (spin) { rotate(d); return; } pieces.forEach((q) => q.classList.remove('sel')); selected = d; d.classList.add('sel'); FX.sfx.tap(); ctx.say(`That is ${PART_NAME[d.dataset.id]}. Now tap its shape on the bones.`); },
        });
        tray.append(d);
      });
      // Tap a piece, then tap the skeleton, for little fingers that do not like dragging.
      svg.addEventListener('pointerdown', (e) => { if (stage !== 'bones' || !selected || spin) return; const p = selected; if (place(p, e.clientX, e.clientY)) selected = null; });
      peekBtn.onclick = () => {
        if (stage !== 'bones') return;
        gGhost.classList.remove('gone', 'faint'); FX.sfx.whoosh();
        FX.anim(gGhost, [{ opacity: .12 }, { opacity: 1 }], { duration: 320 });
        ctx.say('There is the shape every bone wants to be!');
        setTimeout(() => { if (blind) gGhost.classList.add('faint'); }, 2600);
      };
      const showHint = () => {
        if (stage !== 'bones') return;
        const d = pieces.find((q) => q.isConnected && !q.classList.contains('locked')); if (!d) return;
        hints++; const s = slotOf[d.dataset.id]; d.classList.add('hint'); s.classList.add('hint'); gGhost.classList.remove('faint'); FX.sfx.sparkle();
        const c = centreOf(s); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 });
        if (spin && +d.dataset.rot % 360) ctx.say('Tap this bone to turn it, then drag it to the glowing spot.'); else ctx.say(`This bone is ${PART_NAME[d.dataset.id]}. Drag it to the glowing spot!`);
        setTimeout(() => { d.classList.remove('hint'); s.classList.remove('hint'); if (blind) gGhost.classList.add('faint'); }, 2800);
      };
      hintBtn.onclick = showHint; ctx.hint(showHint);

      /* ---------- stage 2: skin and colour ---------- */
      let colour = null, dinoBox = null;
      const stepTo = (i) => $$('span', steps).forEach((s, k) => { s.className = k < i ? 'done' : k === i ? 'now' : ''; });
      async function skinStage() {
        if (!ctx.alive()) return;
        stage = 'skin'; stepTo(1); tray.classList.add('hidden'); hintBtn.classList.add('hidden'); peekBtn.classList.add('hidden'); ctx.hint(null);
        FX.sfx.win(); FX.celebrate(); gGhost.classList.add('gone');
        const secs = (Date.now() - t0) / 1000;
        /* The bone-laying time is what gets beaten, and it shows on the site board right away. */
        const rec = beatBest(R, secs), rp = centreOf(stageBox);
        if (rec.isNew) { FX.floatText(rp.x, rp.y - 60, `New best bones! ${rec.best}s`, { size: 26 }); FX.sfx.coin(); }
        else if (!rec.was) FX.floatText(rp.x, rp.y - 60, `First dig: ${rec.best}s`, { size: 22 });
        topBest.textContent = bestLine(R);
        if (!slips && !hints && secs < total * 12) ctx.bonus(1, stageBox, 'Speedy builder!');
        ctx.say(R === 1 ? 'A whole skeleton! Now give it skin. Pick a colour!' : `Every one of the ${total} bones, in ${f0(secs)} seconds. Now pick a colour!`);
        dinoBox = el('div', 'bd-skin'); stageBox.append(dinoBox);
        const pal = el('div', 'bd-pal');
        const names = { green: 'Green', teal: 'Teal', purple: 'Purple', orange: 'Orange', pink: 'Pink', blue: 'Blue', yellow: 'Yellow', red: 'Red' };
        const hex = { green: '#91d09c', teal: '#7fd1c7', purple: '#b9a1e6', orange: '#f6b273', pink: '#f5a9c4', blue: '#8cc3ee', yellow: '#f3d56b', red: '#ee8a7c' };
        const ok = el('button', 'btn hidden', '✓ I love it!');
        COLORS.forEach((c) => {
          const b = el('button', 'swatch'); b.style.background = hex[c]; b.setAttribute('aria-label', names[c]);
          b.onclick = async () => {
            const first = !colour; colour = c; $$('.swatch', pal).forEach((x) => x.classList.toggle('on', x === b)); FX.sfx.splash(); FX.sfx.note(COLORS.indexOf(c), .15);
            dinoBox.innerHTML = FX.dinoHTML(species, { color: c, state: 'idle' });
            const r = centreOf(dinoBox); FX.burst(r.x, r.y, { kind: 'drops', n: 10, color: hex[c] });
            if (first) {
              // The skin sweeps over the bones from tail to head.
              FX.anim(dinoBox, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1100, easing: 'ease-in-out' });
              svg.classList.add('skinned'); FX.sfx.sparkle(); ctx.say(`${names[c]} looks wonderful! Pick another, or keep it.`);
              await sleep(900); ok.classList.remove('hidden'); FX.pop(ok);
            } else { FX.pop(dinoBox.firstElementChild); ctx.say(`${names[c]}! Which one is best?`); }
          };
          pal.append(b);
        });
        wrap.append(pal, ok);
        ok.onclick = () => { pal.remove(); ok.remove(); nameStage(); };
      }

      /* ---------- stage 3: the name card ---------- */
      function nameStage() {
        if (!ctx.alive()) return;
        stage = 'name'; stepTo(2); FX.sfx.pop();
        ctx.say(`Every dinosaur needs a name. What is this ${SP_NAME[species]} called?`);
        const names = shuffle(NAMES).slice(0, 5); let chosen = null;
        const row = el('div', 'mix-names'); const go = el('button', 'btn big wake', '✨ Wake it up!'); go.disabled = true;
        const card = el('div', 'bd-card hidden');
        const showCard = () => { card.classList.remove('hidden'); card.innerHTML = `<b>${chosen}</b><span>${SP_NAME[species]} · ${total} bones · ${S.name}</span>`; FX.pop(card); };
        names.forEach((n) => { const b = el('button', 'chip', n); b.onclick = () => { chosen = n; $$('.chip', row).forEach((x) => x.classList.toggle('on', x === b)); go.disabled = false; FX.sfx.chirp(); showCard(); ctx.say(`${n}! What a lovely name!`); }; row.append(b); });
        const dice = el('button', 'chip', '🎲'); dice.setAttribute('aria-label', 'Surprise me'); dice.onclick = () => { const n = pick(NAMES); chosen = n; $$('.chip', row).forEach((x) => x.classList.remove('on')); go.disabled = false; FX.sfx.coin(); showCard(); ctx.say(`Ooh, ${n}! A surprise name!`); }; row.append(dice);
        wrap.append(row, card, go);
        go.onclick = () => { if (!chosen) return; row.remove(); card.remove(); go.remove(); aliveStage(chosen); };
      }

      /* ---------- stage 4: it comes alive in a diorama ---------- */
      async function aliveStage(name) {
        if (!ctx.alive()) return;
        stage = 'alive'; stepTo(3);
        const stars = !slips && !hints ? 3 : slips <= 2 && hints <= 1 ? 2 : 1;
        /* A museum neighbour comes to greet the new animal, so the diorama differs every play. */
        const pals = window.Park.museum.all(), buddy = pals.length ? pals[pals.length - 1] : null;
        den.add({ s: species, c: colour, n: name }); window.Park.museum.add({ s: species, c: colour, n: name, st: stars, p: total });
        const dio = el('div', 'bd-dio');
        dio.style.background = `linear-gradient(${S.sky[0]}, ${S.sky[1]} 70%)`;
        dio.innerHTML = S.dark
          ? '<i class="bd-sun">🌙</i><i class="bd-cloud c1">⭐</i><i class="bd-cloud c2">✨</i><div class="bd-hills"></div><div class="bd-trees"><span>🌲</span><span>🏮</span><span>🌲</span><span>🌵</span><span>🏮</span></div><div class="bd-flowers">✨ 🌼 ✨ 🌼 ✨ 🌼</div><div class="bd-ground" style="background:linear-gradient(#3f5f5a,#2c4a46);box-shadow:inset 0 6px 0 #4e6f66"></div>'
          : '<i class="bd-sun">☀️</i><i class="bd-cloud c1">☁️</i><i class="bd-cloud c2">☁️</i><div class="bd-hills"></div><div class="bd-trees"><span>🌴</span><span>🌿</span><span>🌳</span><span>🌿</span><span>🌴</span></div><div class="bd-flowers">🌼 🌸 🌼 🌷 🌼 🌸</div><div class="bd-ground"></div>';
        if (buddy && buddy.s !== species) {
          const far = el('div', 'bd-buddy', FX.dinoHTML(buddy.s, { color: buddy.c, state: 'idle' }));
          far.style.cssText = 'position:absolute;right:4%;bottom:24%;width:20%;opacity:.85;filter:saturate(.85)';
          dio.append(far);
          FX.anim(far, [{ transform: 'translateY(0)' }, { transform: 'translateY(-7px)' }, { transform: 'translateY(0)' }], { duration: 2600, iterations: Infinity, easing: 'ease-in-out' });
        }
        const walker = el('div', 'bd-walker', FX.dinoHTML(species, { color: colour, state: 'walk' }));
        const tag = el('div', 'bd-tag', `<b>${name}</b><span>${[1, 2, 3].map((n) => `<i class="${n <= stars ? 'on' : ''}">★</i>`).join('')}</span>`);
        dio.append(walker, tag);
        stageBox.replaceWith(dio); $('.bd-tray', wrap) && tray.remove(); bar.remove(); hintBtn.remove(); peekBtn.remove(); top.remove();
        FX.celebrate(); ctx.flutter(6); FX.sfx.whoosh();
        const dEl = $('.du-dino', walker); dEl.setAttribute('data-base', 'walk');
        ctx.say(`${name} the ${SP_NAME[species]} is waking up…`);
        FX.pop(tag);
        // The dinosaur walks in, roars, then hops around happily while hearts and stars float up.
        walker.classList.add('go');
        await sleep(2300); if (!ctx.alive()) return;
        dEl.setAttribute('data-base', 'happy'); FX.dinoState(dEl, 'roar', 1300); FX.sfx.roar(); FX.shakeScreen(3);
        ctx.say(`${name} the ${SP_NAME[species]} is ALIVE! You built it from ${total} bones!`);
        for (let i = 0; i < 4; i++) setTimeout(() => { if (!ctx.alive()) return; const c = centreOf(walker); FX.burst(c.x, c.y - 20, { kind: i % 2 ? 'hearts' : 'stars', n: 6 }); FX.sfx.chirp(); }, 500 + i * 800);
        ctx.bonus(stars - 1 > 0 ? stars - 1 : 0, tag, stars === 3 ? 'Perfect build!' : 'Great build!');
        if (window.DUWONDER && DUWONDER.running && DUWONDER.running()) DUWONDER.mote(R === ctx.rounds ? 3 : 1);
        await sleep(3400);
        if (!ctx.alive()) return;
        const last = R === ctx.rounds;
        if (last && await keepGoing(ctx, 'Keep going?', 'Five golden bones are buried under the site.', 'Dig up the gold!', '#b07a3a', (host, done) => bonusGolden(ctx, host, done))) {
          ctx.done(`${name} and a golden skeleton — ${pals.length + 1} dinosaurs live in your museum now!`, 2200);
          return;
        }
        ctx.done(last ? `${name} is the ${pals.length + 1}th dinosaur in your museum, built bone by bone! ${'⭐'.repeat(stars)}`
          : `${name} moved into the Dino Museum! ${'⭐'.repeat(stars)}`, 1800);
      }
    },
  });
})();
