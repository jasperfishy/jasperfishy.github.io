/* Dino Park games 1–4: Puzzle, Dig, Footprint Match, Dino Mixer. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, drag, hit, den, store, NAMES, SPECIES, COLORS, FX } = window.Park;
  const SPEC_NAME = { trex: 'T-rex', tricera: 'Triceratops', stego: 'Stegosaurus', bronto: 'Brontosaurus', raptor: 'Raptor', ptero: 'Pterosaur' };
  window.Park.SPEC_NAME = SPEC_NAME;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const f0 = (n) => Math.round(n);
  const f1 = (n) => +n.toFixed(1);

  /* Best times live under a hyphenated key so the hub's /^dino_[a-z]+$/ star count never sees them. */
  const bestMap = (id) => window.Park.store.get('x-best-' + id, {}) || {};
  const beatBest = (id, round, secs) => {
    const all = bestMap(id), was = Number(all[round]) || 0;
    if (was && secs >= was) return { was, best: was, isNew: false };
    all[round] = +secs.toFixed(1); window.Park.store.set('x-best-' + id, all);
    return { was, best: all[round], isNew: !!was };
  };
  const bestLine = (id, round) => { const b = Number(bestMap(id)[round]) || 0; return b ? 'Best ⏱ ' + b + 's' : 'No time yet'; };

  /* ---------- premium furniture shared with games2/games3 (same copies, same behaviour) ---------- */
  /* A few collectible stars drift in when the child does something wonderful. */
  const cheer = (n) => { if (window.DUWONDER && DUWONDER.mote) DUWONDER.mote(n); };
  /* A free hint button on the board itself: a hint costs nothing, take as many as you like. */
  const helpBtn = (showMe) => { const b = el('button', 'btn small', '💡 Show me'); b.setAttribute('aria-label', 'Show me a hint'); b.onclick = () => showMe(); return b; };
  /* A collecting surface that outlives the tab: id -> the level it was first earned at.
     Hyphenated key, so the hub's /^dino_[a-z]+$/ star count never mistakes it for a game. */
  const ledger = (key) => ({
    all() { const m = store.get('dino_x-' + key, null); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; },
    earned() { return Object.keys(this.all()); },
    set(id, lvl) { const m = this.all(); if (m[id]) return false; m[id] = lvl; store.set('dino_x-' + key, m); return true; },
  });
  /* One row of wall slots. `attr` is the data-* name a test asserts, `map` what is already earned. */
  function collectRow(cls, attr, ids, map, empty, decorate) {
    const row = el('div', 'x-wall ' + cls);
    row.__ids = ids; row.dataset.cap = ids.length; row.dataset.got = 0;
    ids.forEach((id) => {
      const s = el('span', 'x-slot'); s.dataset[attr] = id;
      if (map[id]) { s.classList.add('got'); s.dataset.lvl = map[id]; row.dataset.got = Number(row.dataset.got) + 1; decorate(s, id); }
      else s.innerHTML = empty;
      row.append(s);
    });
    if (Number(row.dataset.got) >= ids.length) row.classList.add('full');
    return row;
  }
  /* Stamp a freshly earned collectible into its slot, with a pop and a sparkle. */
  function stampInto(row, decorate, id, lvl, label) {
    if (!row || !row.__ids) return false;
    const i = row.__ids.indexOf(id), slot = row.children[i];
    if (!slot || slot.classList.contains('got')) return false;
    slot.classList.add('got'); slot.dataset.lvl = lvl; decorate(slot, id);
    row.dataset.got = Number(row.dataset.got || 0) + 1;
    if (Number(row.dataset.got) >= row.__ids.length) row.classList.add('full');
    FX.pop(slot); FX.sfx.sparkle();
    const c = centreOf(slot); FX.burst(c.x, c.y, { kind: 'stars', n: 12 });
    if (label) FX.floatText(c.x, c.y - 26, label, { size: 22 });
    return true;
  }

  /* The little status bar every game in this file hangs over its board: level, contents, best time. */
  function statusBar(bits, color) {
    const bar = el('div', 'du-bar');
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;font-weight:900;font-size:14px;color:#fff;background:linear-gradient(90deg,' + color + ',color-mix(in srgb,' + color + ' 55%,#fff));border-radius:16px;padding:5px 12px;box-shadow:0 4px 0 rgba(0,0,0,.16);position:relative;z-index:3';
    bits.forEach((t, i) => bar.append(el(i === 0 ? 'b' : 'span', 'du-bar-' + i, t)));
    return bar;
  }

  /* A post-win "keep going" invitation that can never wedge a round: if the child wanders off, it closes itself. */
  function keepGoing(ctx, title, sub, label, color, build) {
    return new Promise((res) => {
      const card = el('div', 'du-keep');
      card.style.cssText = 'position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:60;display:flex;flex-direction:column;align-items:center;gap:8px;width:min(92vw,460px);background:#fffaf0;border:4px solid #ffcf33;border-radius:24px;padding:14px 18px 16px;box-shadow:0 10px 0 rgba(0,0,0,.22);text-align:center';
      card.innerHTML = '<b style="font-size:24px">' + title + '</b><span style="font-weight:800;font-size:15px;opacity:.8">' + sub + '</span>';
      const row = el('div'); row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center';
      const yes = el('button', 'btn', '✨ ' + label), no = el('button', 'btn ghost', 'No, I did enough!');
      row.append(yes, no); card.append(row);
      $('#game').append(card); FX.pop(card); FX.sfx.coin();
      let closed = false, started = false, timer = 0;
      const close = (v) => { if (closed) return; closed = true; clearTimeout(timer); card.remove(); res(v); };
      no.onclick = () => { FX.sfx.tap(); close(false); };
      yes.onclick = () => {
        if (started) return; started = true;
        row.remove(); FX.sfx.whoosh();
        const box = el('div'); box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;width:100%';
        card.append(box); build(box, () => close(true));
      };
      timer = setTimeout(() => close(started), started ? 45000 : 18000);
    });
  }

  /* ====================================================================== 1. Dino Puzzle */
  /* The scene is HTML-parsed first and then serialised, because the dinosaur art repeats an attribute that a strict
   * XML image loader refuses (that left every puzzle piece blank). */
  const toXML = (svgHTML) => { const t = document.createElement('div'); t.innerHTML = svgHTML; return new XMLSerializer().serializeToString(t.firstElementChild); };
  const THEMES = {
    meadow: { sky: ['#7fd0f2', '#e9f8d4'], far: '#9ccfb0', hill1: '#8fd18f', hill2: '#5fb36f', glow: '#ffe27a', prop: 'tree', life: '🦋' },
    sunset: { sky: ['#ff8f6b', '#ffe3a8'], far: '#c78a8a', hill1: '#b5c978', hill2: '#7fae5f', glow: '#fff0a8', prop: 'tree', life: '🐦' },
    night: { sky: ['#1d1b5c', '#6a58b8'], far: '#3d3f8f', hill1: '#3f8f78', hill2: '#2c6e66', glow: '#fff6d0', dark: 1, prop: 'pine', life: '✨' },
    lagoon: { sky: ['#79e0e6', '#eafcff'], far: '#8fd8cf', hill1: '#a9e58f', hill2: '#5fb36f', glow: '#ffe27a', water: '#4fc4de', prop: 'palm', life: '🐟' },
    blossom: { sky: ['#ffc3dd', '#fff3f7'], far: '#e8a6c4', hill1: '#a8d98a', hill2: '#6fb96f', glow: '#fff0b8', petal: 1, prop: 'blossom', life: '🐝' },
    dusk: { sky: ['#5a2f7a', '#ff9a6b'], far: '#6b4a8f', hill1: '#4f8f6f', hill2: '#2f6a5a', glow: '#ffd07a', dark: 1, dusk: 1, prop: 'pine', life: '🦇' },
  };
  const THEME_KEYS = Object.keys(THEMES);
  /* A tiny seeded generator, so one scene always redraws exactly the same way from its own number. */
  const rngOf = (n) => { let s = (n >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  function sceneSVG(species, color, uid, theme, species2, seed) {
    const T = THEMES[theme] || THEMES.meadow, dark = !!T.dark, R = rngOf(seed * 2654435761);
    const dw = 198 + R() * 58, dh = dw * .75, dx = 6 + R() * (354 - dw), dy = 206 + R() * 34 - dh;
    const dino = FX.dinoSVG(species, { color }).replace('<svg class="du-dino-svg"', `<svg x="${f0(dx)}" y="${f0(dy)}" width="${f0(dw)}" height="${f0(dh)}" class="du-dino-svg"`);
    const dw2 = 96 + R() * 30, dh2 = dw2 * .75, dx2 = R() < .5 ? 356 - dw2 : 4, dy2 = 244 - dh2;
    const dino2 = species2 ? FX.dinoSVG(species2, { color: COLORS[(COLORS.indexOf(color) + 3) % COLORS.length] }).replace('<svg class="du-dino-svg"', `<svg x="${f0(dx2)}" y="${f0(dy2)}" width="${f0(dw2)}" height="${f0(dh2)}" class="du-dino-svg"`) : '';
    const stars = Array.from({ length: dark ? 22 : 0 }, (_, i) => `<circle class="sc-star" cx="${f0(R() * 350)}" cy="${f0(R() * 140)}" r="${f1(1.2 + R() * 2)}" fill="#fff" style="animation-delay:${(i % 5) * .4}s"/>`).join('');
    const petals = T.petal ? Array.from({ length: 12 }, (_, i) => `<text class="sc-star" x="${f0(R() * 350)}" y="${f0(R() * 250)}" font-size="${f0(9 + R() * 8)}" style="animation-delay:${(i % 6) * .3}s">🌸</text>`).join('') : '';
    const sky = dark
      ? `<g>${stars}</g><circle cx="${f0(280 + R() * 40)}" cy="46" r="24" fill="#fffbe0"/><circle cx="${f0(290 + R() * 40)}" cy="40" r="22" fill="${T.dusk ? '#3a2050' : '#2a2870'}" opacity=".9"/>`
      : `<g class="sc-sun"><circle cx="300" cy="46" r="40" fill="${T.glow}" opacity=".35"/><circle cx="300" cy="46" r="26" fill="url(#sn${uid})"/></g>`;
    const clouds = Array.from({ length: 2 + f0(R() * 3) }, () => `<ellipse cx="${f0(R() * 340)}" cy="${f0(20 + R() * 40)}" rx="${f0(18 + R() * 22)}" ry="${f0(8 + R() * 8)}"/>`).join('');
    const ridge = (y, drop) => `M0 ${y + 8} L${f0(30 + R() * 30)} ${y - drop} L${f0(90 + R() * 20)} ${y + 4} L${f0(140 + R() * 30)} ${y - drop - 8} L${f0(210 + R() * 20)} ${y + 10} L${f0(260 + R() * 20)} ${y - drop * .6} L360 ${y + 16} L360 270 L0 270Z`;
    const water = T.water ? `<path d="M0 216 Q90 206 180 216 T360 212 V270 H0Z" fill="${T.water}"/><path d="M0 222 q30 -6 60 0 t60 0 t60 0 t60 0 t60 0" stroke="#eafcff" stroke-width="4" fill="none" opacity=".65"/><path d="M0 236 q24 -5 48 0 t48 0 t48 0 t48 0 t48 0 t48 0" stroke="#dff6ff" stroke-width="3" fill="none" opacity=".45"/>` : '';
    const vol = T.water ? '' : `<path d="M232 190 L276 92 Q298 78 320 92 L360 190Z" fill="#8a5d44"/><path d="M276 92 Q298 104 320 92 Q298 82 276 92Z" fill="#ff7a3d"/><path d="M292 100 q-4 26 -14 52 M304 100 q6 22 16 52" stroke="#ff9b50" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle class="sc-smoke" cx="298" cy="74" r="10" fill="#8b8484" opacity=".5"/><circle class="sc-smoke s2" cx="306" cy="58" r="14" fill="#8b8484" opacity=".35"/>`;
    const propX = f0(16 + R() * 40);
    const prop = T.prop === 'palm'
      ? `<path d="M${propX} 250 Q${propX - 6} 200 ${propX + 6} 168" stroke="#8a5a2a" stroke-width="9" fill="none" stroke-linecap="round"/>${[[0, -1], [1, 0], [-1, 0], [.6, -1], [-.6, -1]].map((d) => `<path d="M${propX + 6} 168 q${d[0] * 34} ${d[1] * 20 - 12} q${d[0] * 52} ${d[1] * 26 + 6}" stroke="#3f9a5e" stroke-width="9" fill="none" stroke-linecap="round"/>`).join('')}`
      : T.prop === 'blossom'
        ? `<path d="M${propX} 258 Q${propX - 4} 214 ${propX + 2} 186" stroke="#8a5a3a" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="${propX + 2}" cy="176" r="30" fill="#ffd2e6"/><circle cx="${propX - 16}" cy="188" r="18" fill="#ffc2dd"/><circle cx="${propX + 22}" cy="190" r="16" fill="#ffe0ee"/>`
        : T.prop === 'pine'
          ? `<path d="M${propX} 256 V218" stroke="#6a4a2a" stroke-width="7" stroke-linecap="round"/><path d="M${propX - 24} 224 L${propX} 176 L${propX + 24} 224Z" fill="#2f6a5a"/><path d="M${propX - 20} 206 L${propX} 164 L${propX + 20} 206Z" fill="#3f8f78"/>`
          : `<path d="M${propX} 262 Q${propX - 4} 210 ${propX + 8} 160" stroke="#7a5a3a" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M${propX + 8} 160 Q${propX - 18} 140 ${propX - 26} 160 M${propX + 8} 160 Q${propX + 34} 136 ${propX + 50} 156 M${propX + 8} 160 Q${propX - 2} 128 ${propX - 18} 126 M${propX + 8} 160 Q${propX + 24} 128 ${propX + 40} 130" stroke="#3f9a5e" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    const flowers = Array.from({ length: 7 }, () => `<circle cx="${f0(R() * 356)}" cy="${f0(250 + R() * 18)}" r="${f1(3 + R() * 3)}" fill="${pick(['#ff8fb3', '#ffd54f', '#fff', '#c78aff'])}"/>`).join('');
    const bugs = `<g class="sc-fly">${Array.from({ length: 3 }, () => `<text x="${f0(40 + R() * 280)}" y="${f0(170 + R() * 60)}" font-size="${f0(13 + R() * 8)}">${T.life}</text>`).join('')}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270">
      <defs><linearGradient id="sk${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset="1" stop-color="${T.sky[1]}"/></linearGradient>
      <radialGradient id="sn${uid}"><stop offset="0" stop-color="#fff6c0"/><stop offset="1" stop-color="#ffcf4d"/></radialGradient>
      <radialGradient id="vg${uid}"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? '.4' : '.22'}"/></radialGradient></defs>
      <rect width="360" height="270" fill="url(#sk${uid})"/>
      ${sky}
      ${T.dusk ? '' : `<g class="sc-clouds" fill="#fff" opacity=".92">${clouds}</g>`}
      <path d="${ridge(158, 44 + R() * 26)}" fill="${T.far}"/>
      ${vol}${water}
      <path d="M0 214 Q90 ${f0(190 + R() * 18)} 190 212 T360 206 L360 270 L0 270Z" fill="${T.hill1}"/>
      <path d="M0 244 Q120 ${f0(220 + R() * 16)} 240 246 T360 240 L360 270 L0 270Z" fill="${T.hill2}"/>
      ${prop}
      <g class="scene-dino">${dino}</g>${dino2 ? `<g class="scene-dino2">${dino2}</g>` : ''}
      ${flowers}${petals}${bugs}
      <rect width="360" height="270" fill="url(#vg${uid})"/>
    </svg>`;
  }
  const dataUri = (svg) => 'url("data:image/svg+xml;utf8,' + encodeURIComponent(toXML(svg)) + '")';
  let album = [], puzSpecies = [], themeDeck = [], puzOff = 0;
  /* Corners, edges and middles: knowing which kind a piece is lets a wrong try teach the shape. */
  const pieceKind = (i, cols, rows) => {
    const c = i % cols, r = Math.floor(i / cols), straight = (c === 0 || c === cols - 1) + (r === 0 || r === rows - 1);
    return straight === 2 ? 'corner' : straight === 1 ? 'edge' : 'middle';
  };
  const lesson = (pi, si, cols, rows) => {
    const a = pieceKind(+pi, cols, rows), b = pieceKind(+si, cols, rows);
    if (a === 'corner' && b === 'middle') return 'That piece has two straight sides — corners live on the outside!';
    if (a === 'middle' && b === 'corner') return 'This one has no straight side, so it is a middle piece. Corners last!';
    if (a !== b) return 'Follow the straight edges: the outside of the picture is all straight.';
    return 'So close! Look at the colours on both sides of this piece.';
  };
  /* The "keep going" bonus: four pieces of a picture the child has never seen. */
  function bonusPuzzle(ctx, host, done) {
    const cols = 2, rows = 2, total = 4;
    const sp = pick(puzSpecies), pal = pick(COLORS), theme = pick(THEME_KEYS), uid = (Date.now() % 88000) + 13;
    const img = dataUri(sceneSVG(sp, pal, uid, theme, pick(SPECIES.filter((s) => s !== sp)), rnd(99999)));
    host.innerHTML = `<p style="margin:0;font-weight:800;font-size:14px">${SPEC_NAME[sp]} in the ${theme} · 4 pieces · +2⭐</p>`;
    const mini = el('div', 'puz-wrap'); mini.style.setProperty('--cols', cols); mini.style.setProperty('--rows', rows);
    const board = el('div', 'puz-board'); const ghost = el('div', 'puz-ghost'); ghost.style.backgroundImage = img; ghost.style.opacity = .4;
    board.append(ghost);
    const slots = []; for (let i = 0; i < total; i++) { const s = el('div', 'puz-slot'); s.dataset.i = i; board.append(s); slots.push(s); }
    const tray = el('div', 'puz-tray'); let placed = 0, sel = null;
    const put = (p, slot) => {
      if (slot.firstChild) return false;
      if (slot.dataset.i !== p.dataset.i) { FX.sfx.thud(); FX.shake(slot); ctx.say('Nearly! Match the sky and the grass.', 'sad'); return false; }
      p.classList.add('locked'); slot.append(p); slot.classList.add('filled'); FX.sfx.coin();
      const c = centreOf(slot); FX.burst(c.x, c.y, { kind: 'stars', n: 12 });
      FX.anim(p, [{ transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 320 });
      if (++placed === total) { ctx.bonus(2, board, 'Bonus picture!'); FX.celebrate(); FX.sfx.win(); setTimeout(done, 1100); }
      return true;
    };
    const pieces = [];
    for (let i = 0; i < total; i++) {
      const p = el('div', 'puz-piece'); p.dataset.i = i;
      const c = i % cols, r = Math.floor(i / cols), inn = el('span', 'pz-in'); p.append(inn);
      inn.style.backgroundImage = img; inn.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
      inn.style.backgroundPosition = `${c / (cols - 1) * 100}% ${r / (rows - 1) * 100}%`;
      p.setAttribute('role', 'button'); p.setAttribute('aria-label', 'Bonus puzzle piece ' + (i + 1));
      drag(p, {
        over: (x, y) => { const s = hit(slots, x, y); slots.forEach((q) => q.classList.toggle('hot', q === s && !q.firstChild)); },
        drop: (x, y) => { const s = hit(slots, x, y, 10); return s ? put(p, s) : false; },
        tap: () => { pieces.forEach((q) => q.classList.remove('sel')); sel = p; p.classList.add('sel'); FX.sfx.tap(); },
      });
      pieces.push(p);
    }
    slots.forEach((s) => s.addEventListener('click', () => { if (sel && !s.firstChild && put(sel, s)) sel = null; }));
    shuffle(pieces).forEach((p) => tray.append(p));
    mini.append(board, tray); host.append(mini);
  }

  window.Park.register({
    id: 'jigsaw', name: 'Dino Puzzle', icon: 'tricera', color: '#7a6fd1', rounds: 5, helper: 'tricera', ambient: 'meadow',
    desc: 'Drag the pieces to build a dinosaur picture!',
    round(ctx) {
      const grids = [[2, 2], [3, 2], [3, 3], [4, 3], [5, 4]], [cols, rows] = grids[ctx.round - 1], total = cols * rows;
      if (ctx.round === 1) { album = []; puzSpecies = shuffle(SPECIES.filter((s) => s !== 'ptero')); themeDeck = shuffle(THEME_KEYS); puzOff = rnd(puzSpecies.length); }
      const sp = puzSpecies[(ctx.round - 1 + puzOff) % puzSpecies.length], color = pick(COLORS), theme = themeDeck[(ctx.round - 1) % themeDeck.length];
      const sp2 = ctx.round >= 3 ? puzSpecies[(ctx.round + 2 + puzOff) % puzSpecies.length] : null;
      const uid = Date.now() % 100000;
      const svg = sceneSVG(sp, color, uid, theme, sp2, uid + ctx.round * 977), img = dataUri(svg);
      const blind = ctx.round >= 3, spin = ctx.round >= 4, t0 = Date.now();
      let slips = 0;
      ctx.say(ctx.round === 1 ? 'Drag each piece to its place!' : spin ? 'Some pieces are turned around! Tap a piece to spin it, then drag it in.' : blind ? 'No ghost picture this time — your Peek button still helps!' : `A bigger picture: ${total} pieces this time!`);
      const wrap = el('div', 'puz-wrap');
      const head = statusBar([`Level ${ctx.round}`, `${cols} × ${rows} · ${total} pieces`, bestLine('jigsaw', ctx.round)], '#7a6fd1');
      const prog = el('div'); prog.style.cssText = 'width:min(94vw,520px);height:12px;border-radius:8px;background:rgba(0,0,0,.12);overflow:hidden';
      const fill = el('i'); fill.style.cssText = 'display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,#c7b6ff,#7a6fd1);transition:width .45s cubic-bezier(.3,.9,.4,1)'; prog.append(fill);
      const albumEl = el('div', 'puz-album');
      for (let i = 0; i < ctx.rounds; i++) { const f = el('span', 'alb-frame' + (album[i] ? ' full' : '')); if (album[i]) f.style.backgroundImage = album[i]; albumEl.append(f); }
      const board = el('div', 'puz-board'); wrap.style.setProperty('--cols', cols); wrap.style.setProperty('--rows', rows);
      const ghost = el('div', 'puz-ghost'); ghost.style.backgroundImage = img; if (blind) ghost.style.opacity = 0;
      board.append(ghost);
      const slots = [];
      for (let i = 0; i < total; i++) { const s = el('div', 'puz-slot'); s.dataset.i = i; board.append(s); slots.push(s); }
      const tray = el('div', 'puz-tray');
      let placed = 0, selected = null;
      const place = (p, slot) => {
        if (slot.firstChild) return false;
        if (slot.dataset.i !== p.dataset.i) { slips++; ctx.bad(.5, slot); FX.shake(slot); FX.sfx.thud(); ctx.say(lesson(p.dataset.i, slot.dataset.i, cols, rows)); return false; }
        if (+p.dataset.rot % 360) { ctx.say('Right spot! Now tap the piece to turn it the right way up.'); FX.pop(p); return false; }
        p.classList.remove('dragging', 'sel', 'hint'); p.classList.add('locked', 'placed'); p.style.transform = '';
        slot.append(p); slot.classList.add('filled'); slot.classList.remove('hint'); ctx.good(slot);
        FX.sfx.note(placed * 2 + 2, .2);
        const c = centreOf(slot); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 });
        FX.anim(p, [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 300 });
        const ring = el('i'); ring.style.cssText = 'position:absolute;inset:-8%;border-radius:16px;border:4px solid #ffdf6b;pointer-events:none;z-index:9';
        slot.append(ring);
        FX.anim(ring, [{ transform: 'scale(.6)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 620, easing: 'ease-out' });
        setTimeout(() => ring.remove(), 700);
        placed++; fill.style.width = (placed / total * 100) + '%';
        ctx.say(placed < total ? `${total - placed} piece${total - placed === 1 ? '' : 's'} left!` : 'Last piece in!');
        if (placed === total) complete();
        return true;
      };
      const pieces = [];
      for (let i = 0; i < total; i++) {
        const p = el('div', 'puz-piece'); p.dataset.i = i;
        const c = i % cols, r = Math.floor(i / cols);
        const inn = el('span', 'pz-in'); p.append(inn); p.dataset.rot = spin ? [90, 180, 270][rnd(3)] : 0; inn.style.transform = `rotate(${p.dataset.rot}deg)`;
        inn.style.backgroundImage = img; inn.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
        inn.style.backgroundPosition = `${cols > 1 ? c / (cols - 1) * 100 : 0}% ${rows > 1 ? r / (rows - 1) * 100 : 0}%`;
        p.setAttribute('role', 'button'); p.setAttribute('aria-label', 'Puzzle piece ' + (i + 1));
        drag(p, {
          over: (x, y) => { const s = hit(slots, x, y); slots.forEach((q) => q.classList.toggle('hot', q === s && !q.firstChild)); },
          drop: (x, y) => { const s = hit(slots, x, y, 10); return s ? place(p, s) : false; },
          tap: () => {
            if (spin && !p.classList.contains('locked')) { p.dataset.rot = (+p.dataset.rot + 90) % 360; inn.style.transform = `rotate(${p.dataset.rot}deg)`; FX.sfx.scrape(); return; }
            pieces.forEach((q) => q.classList.remove('sel')); selected = p; p.classList.add('sel'); FX.sfx.tap();
            ctx.say('Now tap the square where it belongs.');
          },
        });
        pieces.push(p);
      }
      slots.forEach((s) => s.addEventListener('click', () => { if (!spin && selected && !s.firstChild && place(selected, s)) selected = null; }));
      shuffle(pieces).forEach((p) => tray.append(p));
      wrap.append(head, prog, albumEl, board, tray);
      // The helper bounces the next piece and glows the spot it belongs in — free, as many times as you like.
      const showMe = () => {
        const p = pieces.find((q) => !q.classList.contains('locked')); if (!p) return;
        const s = slots[+p.dataset.i]; p.classList.add('hint'); s.classList.add('hint'); FX.sfx.sparkle();
        ctx.say(`${pieceKind(+p.dataset.i, cols, rows) === 'corner' ? 'A corner piece!' : pieceKind(+p.dataset.i, cols, rows) === 'edge' ? 'An edge piece!' : 'A middle piece!'} It glows where this one goes.`);
        setTimeout(() => { p.classList.remove('hint'); s.classList.remove('hint'); }, 2600);
      };
      ctx.hint(showMe);
      const help = el('button', 'btn small', '💡 Show me');
      help.onclick = () => { ctx.say('A hint costs nothing — take one!'); showMe(); };
      head.append(help);
      if (blind) {
        const peek = el('button', 'btn small', '👁 Peek');
        peek.onclick = () => { FX.sfx.whoosh(); ghost.style.opacity = .55; FX.anim(ghost, [{ opacity: 0 }, { opacity: .55 }], { duration: 260 }); setTimeout(() => { ghost.style.opacity = 0; }, 1400); };
        wrap.append(peek);
      }
      ctx.area.append(wrap);
      FX.anim(board, [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
      const complete = async () => {
        await sleep(350);
        if (!ctx.alive()) return;
        const secs = (Date.now() - t0) / 1000, last = ctx.round === ctx.rounds;
        board.classList.add('done'); wrap.classList.add('solved'); ghost.style.opacity = 0;
        board.innerHTML = `<div class="du-dino puz-live" data-state="happy">${svg.replace('<svg xmlns="http://www.w3.org/2000/svg"', '<svg xmlns="http://www.w3.org/2000/svg" class="live"')}</div>`;
        FX.sfx.roar(); FX.celebrate(); ctx.flutter(4);
        FX.anim(board, [{ filter: 'brightness(1.9)' }, { filter: 'none' }], { duration: 800 });
        if (window.DUWONDER && DUWONDER.running && DUWONDER.running()) DUWONDER.mote(last ? 3 : 1);
        const rec = beatBest('jigsaw', ctx.round, secs);
        const c = centreOf(board);
        if (rec.isNew) { FX.floatText(c.x, c.y - 46, `New best! ${rec.best}s`, { size: 24 }); FX.sfx.coin(); }
        else if (!rec.was) FX.floatText(c.x, c.y - 46, `First time: ${rec.best}s`, { size: 22 });
        if (!slips && secs < total * 7) ctx.bonus(1, board, 'Speedy!');
        // The finished picture hops into the album.
        const frame = albumEl.children[ctx.round - 1];
        album[ctx.round - 1] = img;
        if (frame) { await sleep(900); FX.flyTo(board, frame, { emoji: '🖼️', size: 34, duration: 800 }); setTimeout(() => { frame.style.backgroundImage = img; frame.classList.add('full'); FX.pop(frame); }, 800); }
        if (last && await keepGoing(ctx, 'Keep going?', 'Four pieces of a brand-new picture, just for fun.', 'One more puzzle!', '#7a6fd1', (host, done) => bonusPuzzle(ctx, host, done))) {
          ctx.done(`All ${ctx.rounds} pictures in your album, ${SPEC_NAME[sp]} last — best ${bestLine('jigsaw', ctx.round).replace('Best ⏱ ', '')}!`, 2400);
          return;
        }
        ctx.done(last ? `You built every picture in the album — ${total} pieces all by yourself!` : 'You built it! Look, the dinosaur is alive!', 2600);
      };
    },
  });

  /* ====================================================================== 2. Dig a Dino */
  /* The soils the trench cuts through, top to bottom: each has its own name, its
   * depth mark and its own band of colour, and the dig cycles through them. */
  const STRATA = [
    { name: 'Soft sand', depth: 2, band: ['#f6e0af', '#e3bb7d', '#c99a5c'] },
    { name: 'Red clay', depth: 7, band: ['#eec49a', '#cf8a60', '#a05f3f'] },
    { name: 'Old rock', depth: 15, band: ['#cbbfb0', '#a2978a', '#7a6f61'] },
    { name: 'Dinosaur bed', depth: 24, band: ['#c4aee0', '#9479bd', '#645096'] },
  ];
  const BONE_PARTS = ['the skull', 'the backbone', 'the ribs', 'the tail', 'a hip', 'a strong leg', 'a foot', 'a claw'];
  const FINDS = {
    bone: { e: '🦴', sfx: 'star', puff: 'sparkle', n: 14 },
    gem: { e: '💎', sfx: 'sparkle', puff: 'stars', n: 12 },
    amber: { e: '🟡', sfx: 'coin', puff: 'stars', n: 14 },
    shell: { e: '🐚', sfx: 'splash', puff: 'bubbles', n: 10 },
    fern: { e: '🌿', sfx: 'whoosh', puff: 'leaves', n: 10 },
    egg: { e: '🥚', sfx: 'drum', puff: 'hearts', n: 8 },
    worm: { e: '🪱', sfx: 'boing', puff: 'dust', n: 6 },
    beetle: { e: '🪲', sfx: 'chirp', puff: 'dust', n: 6 },
    lizard: { e: '🦎', sfx: 'jump', puff: 'dust', n: 6 },
    rock: { e: '🪨', sfx: 'thud', puff: 'dust', n: 8 },
    dirt: { e: '✨', sfx: 'tap', puff: 'dust', n: 5 },
  };
  /* The live excavation: one dig face that never resets between finds. The child
   * brushes the dust away with real strokes (hold and scrub — a tap helps too),
   * lifts every bone they uncover into the tray, and when a skeleton is complete
   * the whole stratum peels away and the dig goes deeper, new soil and all. The
   * world works while they play: scuttlers cross the trench, gusts of wind re-dust
   * the parts nobody took, and the day's light runs down — every bone found buys
   * the afternoon back a little. */
  window.Park.register({
    id: 'dig', name: 'Dig a Dino', icon: 'stego', color: '#c98b4f', live: true, helper: 'stego', helperColor: 'orange', ambient: 'desert',
    desc: 'Brush the dust away and excavate whole dinosaurs!',
    async world(ctx) {
      const GOAL = 12, DAY_SECONDS = 140, COLS = 9, ROWS = 6;
      const day = ctx.drain('Daylight', DAY_SECONDS, () => {
        if (!ctx.alive()) return;
        ctx.say('The sun sets on the trench. The bones will keep until tomorrow!');
        ctx.end(`The sun set on ${skeletons} whole skeleton${skeletons === 1 ? '' : 's'} and ${found} bones — what a dig!`);
      });

      /* Every dinosaur ever dug up takes a permanent place in the museum wall. */
      const musV = ledger('dig-museum'), musMap = musV.all();
      const musIds = SPECIES.filter((s) => s !== 'ptero');
      const musArt = (s, id) => { s.innerHTML = FX.dinoHTML(id, { color: COLORS[SPECIES.indexOf(id) % COLORS.length], state: 'happy' }); };
      const museum = collectRow('dg-museum', 'sp', musIds, musMap, '<i>🦕</i>', musArt);

      const chip = el('div', 'lv-chip', '⛏ Soft sand · 2 m');
      ctx.goal('Bones found', GOAL);
      const hud = (window.Park.liveHud && Park.liveHud()) || ctx.area;
      hud.append(chip, helpBtn(showMe));
      ctx.hint(showMe);

      const wrap = el('div', 'exc');
      const ghost = el('div', 'dig-ghost');
      const tray = el('div', 'dig-slots');
      wrap.append(ghost, tray);
      const face = el('div', 'exc-face');
      ctx.area.append(museum, wrap, face);

      let found = 0, skeletons = 0, depth = 0, stratumBones = 0, stratumGot = 0, flying = false;
      let bonesHere = [];        // [{ cell }] — the bone cells of the current stratum
      let species = 'trex', dcol = '#8fd964';
      ghost.innerHTML = FX.dinoHTML(species, { color: dcol, state: 'idle' });
      ghost.style.setProperty('--rev', 0);

      const openCell = (cell) => {
        if (cell.classList.contains('brushed')) return;
        cell.classList.add('brushed');
        const dust = $('.exc-dust', cell); if (dust) dust.remove();
        const kind = cell.dataset.kind, F = FINDS[kind] || FINDS.dirt;
        cell.setAttribute('aria-label', ({ bone: 'A bone! Tap to lift it out', rock: 'A heavy rock', gem: 'Something sparkly', egg: 'Something oval', dirt: 'Brushed dust' })[kind] || 'A find');
        if (kind === 'bone' || kind === 'gem' || kind === 'amber') FX.burst(centreOf(cell).x, centreOf(cell).y, { kind: kind === 'bone' ? 'sparkle' : 'stars', n: 6 });
        else FX.burst(centreOf(cell).x, centreOf(cell).y, { kind: 'dust', n: 4 });
      };

      const collect = async (cell) => {
        if (flying || cell.classList.contains('gone')) return;
        flying = true;
        cell.classList.add('gone');
        cell.setAttribute('aria-label', 'Lifted out');
        const slot = $$('.dig-slot:not(.got)', tray)[0];
        FX.sfx.star(); FX.burst(centreOf(cell).x, centreOf(cell).y, { kind: 'sparkle', n: 12 });
        if (slot) {
          await sleep(220); if (!ctx.alive()) { flying = false; return; }
          await Park.fly($('.exc-thing', cell), slot, { emoji: '🦴', size: 32, duration: 640 });
          if (!ctx.alive()) { flying = false; return; }
          slot.classList.add('got'); $('small', slot).textContent = BONE_PARTS[stratumGot % BONE_PARTS.length];
        }
        found++; stratumGot++; ctx.good(cell); ctx.progress(1, cell); day.add(7);
        ghost.style.setProperty('--rev', stratumGot / stratumBones);
        if (found >= GOAL) {
          FX.celebrate(); FX.sfx.roar();
          setTimeout(() => { if (ctx.alive()) ctx.win(`${GOAL} bones in one day — the museum is proud of you!`); }, 700);
          flying = false; return;
        }
        ctx.say(stratumGot < stratumBones ? `${BONE_PARTS[(stratumGot - 1) % BONE_PARTS.length]}! ${stratumBones - stratumGot} more in this layer.` : 'That is the whole skeleton!');
        if (stratumGot === stratumBones) { flying = false; peel(); return; }
        flying = false;
      };

      const tapCell = (cell) => {
        if (!ctx.alive() || cell.classList.contains('gone')) return;
        const kind = cell.dataset.kind;
        if (!cell.classList.contains('brushed')) {
          const dust = $('.exc-dust', cell);
          if (dust) {
            const op = Math.max(0, Number(dust.style.opacity || 1) - .5);
            dust.style.opacity = String(op);
            if (op <= .12) openCell(cell);
          }
          FX.sfx.tap();
          return;
        }
        if (kind === 'bone') { collect(cell); return; }
        if (kind === 'rock') {
          cell.classList.add('gone'); cell.setAttribute('aria-label', 'Broken rock');
          FX.sfx.thud(); FX.shake(cell); FX.burst(centreOf(cell).x, centreOf(cell).y, { kind: 'dust', n: 10 });
          ctx.bad(.34, cell);
          ctx.say('Rocks are round and heavy. A bone is white with knobbly ends!');
          return;
        }
        cell.classList.add('gone'); cell.setAttribute('aria-label', 'Taken');
        const c = centreOf(cell);
        if (kind === 'gem') { FX.sfx.sparkle(); FX.burst(c.x, c.y, { kind: 'stars', n: 12 }); ctx.say('A sparkly gem! Bonus star!'); ctx.bonus(1, cell, 'Gem!'); }
        else if (kind === 'amber') { FX.sfx.coin(); FX.burst(c.x, c.y, { kind: 'stars', n: 16 }); ctx.say('Golden amber — there is a tiny gnat stuck inside!'); ctx.bonus(2, cell, 'Amber!'); }
        else if (kind === 'shell') { FX.sfx.splash(); FX.burst(c.x, c.y, { kind: 'bubbles', n: 12 }); ctx.say('A sea shell! This desert was under water once.'); ctx.bonus(1, cell, 'Shell!'); }
        else if (kind === 'fern') { FX.sfx.whoosh(); FX.burst(c.x, c.y, { kind: 'leaves', n: 12 }); ctx.say('A leaf fossil! Something leafy grew here.'); ctx.bonus(1, cell, 'Fern!'); }
        else if (kind === 'egg') {
          if (cell.dataset.hatched) return;
          cell.dataset.hatched = '1';
          FX.sfx.drum(0); ctx.say('A dinosaur egg! It is wobbling…');
          setTimeout(() => {
            if (!ctx.alive()) return;
            const t = $('.exc-thing', cell); if (t) t.textContent = '🐣';
            FX.sfx.chirp(); FX.burst(centreOf(cell).x, centreOf(cell).y, { kind: 'hearts', n: 8 });
            ctx.say('It hatched! Hello, baby!'); ctx.bonus(1, cell, 'Egg!'); ctx.life.visit();
          }, 850);
        } else if (kind === 'worm' || kind === 'beetle' || kind === 'lizard') {
          const F = FINDS[kind]; FX.sfx[F.sfx]();
          ctx.say(kind === 'worm' ? 'Wiggly worm! He says hello.' : kind === 'beetle' ? 'A beetle zooms away!' : 'A little lizard dashes off!');
        } else { FX.sfx.tap(); FX.burst(c.x, c.y, { kind: 'dust', n: 4 }); ctx.say(pick(['Only dust here — keep brushing!', 'Empty sand. The bones are somewhere close!', 'Nothing this time. Brush on!'])); }
      };

      let brushing = false;
      const scrub = (e) => {
        const cell = e.target && e.target.closest && e.target.closest('.exc-cell');
        if (!cell || !cell.isConnected || cell.classList.contains('brushed') || cell.classList.contains('gone')) return;
        const dust = $('.exc-dust', cell);
        if (!dust) return;
        const op = Math.max(0, Number(dust.style.opacity || 1) - .24);
        dust.style.opacity = String(op);
        if (op <= .12) openCell(cell);
      };
      face.addEventListener('pointerdown', (e) => { brushing = true; scrub(e); });
      face.addEventListener('pointermove', (e) => { if (brushing) scrub(e); });
      window.addEventListener('pointerup', () => { brushing = false; });
      face.addEventListener('click', (e) => { const cell = e.target && e.target.closest && e.target.closest('.exc-cell'); if (cell) tapCell(cell); });

      /* One stratum: build the soil, hide the finds, and let the brushing begin. */
      const STRATUM_BONES = [4, 5, 6];
      async function stratum() {
        const S = STRATA[depth % STRATA.length];
        species = musIds[(depth + 1) % musIds.length];
        dcol = pick(COLORS);
        ghost.innerHTML = FX.dinoHTML(species, { color: dcol, state: 'idle' });
        ghost.style.setProperty('--rev', 0);
        chip.textContent = `⛏ ${S.name} · ${S.depth} m`;
        stratumBones = STRATUM_BONES[depth % STRATUM_BONES.length] + (depth >= STRATA.length ? 1 : 0);
        stratumGot = 0; bonesHere = [];
        const gems = 1 + (depth % 2), rocks = 4 + (depth % 3);
        const specials = [...Array(stratumBones).fill('bone'), ...Array(gems).fill('gem'), ...Array(depth % 2 === 0 ? 1 : 0).fill('egg'),
          ...Array(depth % 4 === 3 ? 1 : 0).fill('amber'), ...Array(depth % 2).fill('shell'), ...Array((depth + 1) % 2).fill('fern'),
          'worm', 'beetle', ...Array(rocks).fill('rock')];
        const cells = Math.max(specials.length, COLS * ROWS);
        const items = shuffle([...specials, ...Array(Math.max(0, cells - specials.length)).fill('dirt')]);
        face.style.background = `linear-gradient(${S.band[0]}, ${S.band[1]} 55%, ${S.band[2]})`;
        face.innerHTML = '';
        face.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
        items.forEach((kind, i) => {
          const cell = el('button', 'exc-cell');
          cell.dataset.kind = kind;
          cell.setAttribute('aria-label', 'Dust');
          cell.style.setProperty('--tone', (rnd(5) - 2) * 5 + '%');
          const F = FINDS[kind] || FINDS.dirt;
          cell.innerHTML = `<span class="exc-thing">${F.e}</span><span class="exc-dust"></span>`;
          FX.anim(cell, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, delay: i * 12, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'backwards' });
          if (kind === 'bone') bonesHere.push({ cell });
          face.append(cell);
        });
        tray.innerHTML = '';
        for (let i = 0; i < stratumBones; i++) {
          const s = el('span', 'dig-slot', '🦴');
          const lab = el('small'); lab.style.cssText = 'display:block;font-size:9px;font-weight:900;opacity:.7;letter-spacing:0'; lab.textContent = '?';
          s.append(lab); tray.append(s);
        }
        ctx.say(depth === 0 ? 'Hold and brush the dust away. Lift every bone you find!' : `Deeper! The ${S.name} layer hides another ${SPEC_NAME[species]}.`);
        if (depth > 0) FX.sfx.whoosh();
      }

      /* When a skeleton is complete the layer peels away and the dig goes deeper. */
      async function peel() {
        skeletons++;
        ghost.classList.add('alive'); FX.dinoState(ghost.firstChild, 'roar', 1500); FX.sfx.roar(); FX.celebrate();
        if (musV.set(species, skeletons) && stampInto(museum, musArt, species, skeletons, 'Dug up!')) {
          ctx.say(`${SPEC_NAME[species]} joins the museum — ${museum.dataset.got} of ${musIds.length} dug up!`);
          if (museum.classList.contains('full')) { ctx.bonus(2, museum, 'Every dinosaur dug!'); cheer(2); }
        }
        await sleep(1500); if (!ctx.alive()) return;
        const a = FX.anim(face, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(60%) scale(.92)', opacity: 0 }], { duration: 750, easing: 'ease-in' });
        await sleep(a ? 760 : 120); if (!ctx.alive()) return;
        depth++;
        const b = FX.anim(face, [{ transform: 'translateY(-40%) scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 620, easing: 'ease-out' });
        stratum(); await sleep(b ? 640 : 120);
      }

      /* Gusts re-dust the brushed sand nobody has taken anything from — gentle, no cost. */
      ctx.every(21000, () => {
        if (!ctx.alive() || !face.isConnected) return;
        const calm = $$('.exc-cell.brushed:not(.gone)', face).filter((c) => c.dataset.kind === 'dirt');
        if (!calm.length) return;
        const picked = shuffle(calm).slice(0, Math.min(5, calm.length));
        picked.forEach((c) => {
          const d = el('span', 'exc-dust');
          d.style.opacity = '1';
          c.classList.remove('brushed');
          c.setAttribute('aria-label', 'Dust');
          c.append(d);
        });
        if (picked.length) { FX.sfx.whoosh(); ctx.say('A gust of wind! Dust everywhere again.'); }
      });

      /* Scuttlers cross the trench on their own errands. */
      ctx.every(9000, () => {
        if (!ctx.alive() || !face.isConnected) return;
        const kind = pick(['worm', 'beetle', 'lizard']);
        const F = FINDS[kind];
        const s = el('span', 'exc-scuttler', F.e);
        s.setAttribute('aria-label', 'A little friend crossing the trench');
        const y = 12 + rnd(70);
        s.style.top = y + '%';
        face.append(s);
        const a = FX.anim(s, [{ left: '-8%' }, { left: '106%' }], { duration: 6500 + rnd(3000), easing: 'linear' });
        if (a) a.onfinish = () => s.remove(); else setTimeout(() => s.remove(), 9000);
        s.onclick = (e) => { e.stopPropagation(); FX.sfx[F.sfx](); FX.pop(s); a ? a.finish() : s.remove(); };
      });

      function showMe() {
        if (!ctx.alive()) return;
        const hidden = $$('.exc-cell:not(.brushed):not(.gone)', face).find((c) => c.dataset.kind === 'bone') ||
          [...bonesHere].map((b) => b.cell).find((c) => c.isConnected && !c.classList.contains('gone'));
        if (hidden) {
          hidden.classList.add('glint');
          setTimeout(() => hidden.classList.remove('glint'), 3200);
          const c = centreOf(hidden); FX.burst(c.x, c.y, { kind: 'sparkle', n: 8 });
          ctx.say('Something is shining over there!');
        } else if (bonesHere.length === 0) {
          ctx.say('Brush anywhere — the bones are close!');
        } else {
          const waiting = bonesHere.map((b) => b.cell).find((c) => c.isConnected && !c.classList.contains('gone'));
          if (waiting) { waiting.classList.add('glint'); setTimeout(() => waiting.classList.remove('glint'), 3200); ctx.say('That bone is ready — tap it to lift it out!'); }
          else ctx.say('Keep brushing — another skeleton is near!');
        }
      }

      await stratum();
    },
  });

  /* ====================================================================== 3. Footprint Match */
  const FOOT = {
    trex: '<ellipse cx="40" cy="60" rx="15" ry="13"/><path d="M40 8 q9 14 6 34 h-12 q-3 -20 6 -34z"/><path d="M14 22 q14 6 20 26 l-11 4 q-13 -12 -9 -30z"/><path d="M66 22 q-14 6 -20 26 l11 4 q13 -12 9 -30z"/>',
    tricera: '<ellipse cx="40" cy="58" rx="22" ry="16"/><circle cx="18" cy="30" r="10"/><circle cx="40" cy="22" r="10"/><circle cx="62" cy="30" r="10"/>',
    stego: '<ellipse cx="40" cy="54" rx="21" ry="19"/><circle cx="14" cy="30" r="6"/><circle cx="27" cy="19" r="6"/><circle cx="40" cy="15" r="6"/><circle cx="53" cy="19" r="6"/><circle cx="66" cy="30" r="6"/>',
    bronto: '<circle cx="40" cy="50" r="27"/><circle cx="14" cy="22" r="8"/><circle cx="31" cy="12" r="8"/><circle cx="49" cy="12" r="8"/><circle cx="66" cy="22" r="8"/>',
    raptor: '<ellipse cx="40" cy="62" rx="11" ry="10"/><ellipse cx="27" cy="34" rx="8" ry="20" transform="rotate(-10 27 34)"/><ellipse cx="53" cy="34" rx="8" ry="20" transform="rotate(10 53 34)"/><path d="M8 40 q-4 -16 10 -24 q-6 12 -2 26z"/>',
    ptero: '<ellipse cx="40" cy="62" rx="8" ry="9"/><ellipse cx="40" cy="30" rx="4" ry="26"/><ellipse cx="20" cy="38" rx="4" ry="22" transform="rotate(25 20 38)"/><ellipse cx="60" cy="38" rx="4" ry="22" transform="rotate(-25 60 38)"/>',
  };
  /* Four banks to walk across, each with its own soil, ink and litter, so no two plays look alike. */
  const GROUNDS = [
    { name: 'Riverside mud', bg: 'linear-gradient(#c69a63,#8d5f37)', ink: '#5e4430', litter: ['🌾', '💧', '🪨', '🌿'] },
    { name: 'Beach sand', bg: 'linear-gradient(#f4e3b2,#cbb177)', ink: '#8a6a3a', litter: ['🐚', '🌊', '🌴', '⭐'] },
    { name: 'Volcanic ash', bg: 'linear-gradient(#96929c,#4a4a55)', ink: '#2b2b33', litter: ['🌋', '🪨', '🔥', '🍂'] },
    { name: 'Moonlight bog', bg: 'radial-gradient(circle at 50% 24%, #4b3f8a, #241f52)', ink: '#dfe0ff', litter: ['🌙', '✨', '🪷', '🦟'], dark: 1 },
  ];
  /* How a print gives its animal away — used to teach after a wrong guess instead of just buzzing. */
  const TOES = {
    trex: { n: 3, t: 'three fat toes and a deep middle pad' },
    tricera: { n: 3, t: 'three stubby toes, wide as a dinner plate' },
    stego: { n: 5, t: 'five little toes, fanned out like fingers' },
    bronto: { n: 4, t: 'four round toes on a pillar foot' },
    raptor: { n: 3, t: 'three slim toes and a crescent claw mark' },
    ptero: { n: 3, t: 'three long skinny toes, like a bird' },
  };
  const heavy = (s) => s === 'trex' || s === 'bronto' || s === 'tricera' || s === 'stego';
  /* One animal, three prints, three guesses — the bonus trail after the last round. */
  function bonusTrail(ctx, host, done) {
    const sp = pick(SPECIES), prints = [], mud = el('div', 'lot-mud');
    mud.style.cssText = 'width:min(94vw,460px);background:linear-gradient(#c69a63,#7d5330);position:relative;overflow:hidden';
    host.innerHTML = '<p style="margin:0;font-weight:800;font-size:14px">A mystery trail! Three prints, one animal. Whose are they?</p>';
    for (let i = 0; i < 3; i++) {
      const p = el('div', 'lot-print'); p.dataset.s = sp;
      p.innerHTML = `<svg class="lot-main" viewBox="0 0 80 80" style="fill:#4d3826;transform:rotate(${-16 + i * 12}deg)">${FOOT[sp]}</svg><span class="lot-slot"></span>`;
      mud.append(p); prints.push(p);
      FX.anim(p, [{ opacity: 0, transform: 'translateY(-14px) scale(1.15)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: i * 200, fill: 'backwards', easing: 'cubic-bezier(.3,1.5,.5,1)' });
    }
    const pad = el('div', 'lot-dinos');
    const cands = shuffle([sp, ...shuffle(SPECIES.filter((x) => x !== sp)).slice(0, 2)]);
    let sel = null, over = false;
    const tryIt = (card, target) => {
      if (over || !target || target.classList.contains('solved')) return false;
      if (target.dataset.s !== card.dataset.s) {
        FX.sfx.thud(); FX.shake(card); FX.shake(target);
        ctx.say(TOES[sp].n === TOES[card.dataset.s].n
          ? 'Same number of toes! Look at the shape next — fat or skinny?'
          : `Count the toes. This print has ${TOES[sp].n}, the ${SPEC_NAME[card.dataset.s]} has ${TOES[card.dataset.s].n}.`);
        return false;
      }
      over = true;
      card.classList.remove('sel'); card.classList.add('locked', 'placed'); card.style.transform = '';
      $('.lot-slot', target).append(card);
      prints.forEach((q, i) => setTimeout(() => {
        q.classList.add('solved'); q.style.setProperty('--fill', '#f3d56b'); $('.lot-main', q).style.fill = '';
        FX.sfx.drum(i); const c = centreOf(q); FX.burst(c.x, c.y, { kind: 'dust', n: 9 });
      }, i * 230));
      // The animal itself strolls back along the trail it left.
      const walk = el('div', 'lot-walk');
      walk.style.cssText = 'position:absolute;left:-18%;top:26%;width:130px;pointer-events:none;z-index:7';
      walk.innerHTML = FX.dinoHTML(sp, { color: pick(COLORS), state: 'walk' });
      mud.append(walk);
      FX.anim(walk, [{ transform: 'translateX(0)' }, { transform: 'translateX(340%)' }], { duration: 2000, delay: 700, easing: 'linear' });
      setTimeout(() => { ctx.bonus(2, prints[1], 'Mystery solved!'); FX.sfx[sp === 'trex' ? 'roar' : 'chirp'](); }, 900);
      setTimeout(() => { FX.celebrate(); ctx.say(`It was a ${SPEC_NAME[sp]}! ${TOES[sp].t} gives it away.`); setTimeout(done, 1500); }, 2750);
      return true;
    };
    const cards = cands.map((s) => {
      const c = el('div', 'lot-card'); c.dataset.s = s; c.dataset.c = pick(COLORS);
      c.innerHTML = FX.dinoHTML(s, { color: c.dataset.c, state: 'idle' });
      drag(c, {
        over: (x, y) => prints.forEach((p) => p.classList.toggle('hot', p === hit(prints, x, y) && !p.classList.contains('solved'))),
        drop: (x, y) => tryIt(c, hit(prints, x, y, 12)),
        tap: () => { cards.forEach((q) => q.classList.remove('sel')); sel = c; c.classList.add('sel'); FX.sfx.tap(); },
      });
      pad.append(c); return c;
    });
    prints.forEach((p) => p.addEventListener('click', () => { if (sel && tryIt(sel, p)) sel = null; }));
    host.append(mud, pad);
  }
  let lotDeck = [], lotOff = 0, groundBank = [];
  window.Park.register({
    id: 'lotto', name: 'Footprint Match', icon: 'raptor', color: '#d9694f', rounds: 4, helper: 'raptor', ambient: 'meadow',
    desc: 'Whose footprint is it? Drag the dino to match!',
    round(ctx) {
      const R = ctx.round, shadows = R === 4, k = [3, 4, 5, 6][R - 1];
      if (R === 1) { lotDeck = shuffle(SPECIES); lotOff = rnd(lotDeck.length); groundBank = shuffle(GROUNDS); }
      const G = groundBank[(R - 1) % groundBank.length];
      /* A rotating deck: the same four rounds never show the same line-up of animals twice. */
      const set = Array.from({ length: k }, (_, i) => ({ s: lotDeck[(i + lotOff) % lotDeck.length], c: COLORS[(i * 3 + R * 2) % COLORS.length] }));
      const trail = R >= 3 ? 3 : R === 2 ? 2 : 1, FILL = { green: '#91d09c', teal: '#7fd1c7', purple: '#b9a1e6', orange: '#f6b273', pink: '#f5a9c4', blue: '#8cc3ee', yellow: '#f3d56b', red: '#ee8a7c' };
      const t0 = Date.now(); let slips = 0;
      ctx.say(shadows ? 'Shadows! No toes to count now — just the whole shape.'
        : R === 1 ? 'Whose footprints are these? Drag each dino to its prints!'
          : `${G.name}! ${k} animals walked through here.`);
      const head = statusBar([`Level ${R} · ${G.name}`, `${k} prints`, bestLine('lotto', R)], '#d9694f');
      const prog = el('div'); prog.style.cssText = 'width:min(94vw,520px);height:12px;border-radius:8px;background:rgba(0,0,0,.14);overflow:hidden';
      const fill = el('i'); fill.style.cssText = 'display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,#ffb08a,#d9694f);transition:width .4s cubic-bezier(.3,.9,.4,1)'; prog.append(fill);
      const mud = el('div', 'lot-mud' + (shadows ? ' shadowy' : ''));
      mud.style.background = G.bg;
      mud.style.boxShadow = 'inset 0 5px 14px rgba(30,15,0,.35), inset 0 -6px 0 rgba(0,0,0,.14)';
      /* Litter along the bank so the scene reads as a place, not a worksheet. */
      for (let i = 0; i < 5 + R * 2; i++) {
        const d = el('span', 'lot-litter', pick(G.litter));
        d.style.cssText = `position:absolute;left:${f0(2 + rnd(94))}%;top:${f0(2 + rnd(92))}%;font-size:${f0(10 + rnd(12))}px;opacity:${G.dark ? .5 : .38};transform:rotate(${f0(rnd(70) - 35)}deg);pointer-events:none`;
        mud.append(d);
      }
      mud.style.position = 'relative';
      const prints = shuffle(set).map((d, i) => {
        const p = el('div', 'lot-print'); p.dataset.s = d.s; p.style.setProperty('--i', i);
        const foot = `<svg viewBox="0 0 80 80">${FOOT[d.s]}</svg>`;
        p.innerHTML = (shadows
          ? `<span class="lot-shadow">${FX.dinoHTML(d.s, { state: 'idle' })}</span>`
          : `<span class="lot-trail">${foot.repeat(trail)}</span><svg class="lot-main" viewBox="0 0 80 80" aria-label="Footprint" style="fill:${G.ink};transform:rotate(${R >= 3 ? f0(rnd(24) - 12) : 0}deg)">${FOOT[d.s]}</svg>`) + '<span class="lot-slot"></span>';
        mud.append(p); return p;
      });
      if (!ctx.alive()) return;
      prints.forEach((p, i) => { setTimeout(() => { if (!ctx.alive()) return; const s = p.dataset.s; FX.sfx[heavy(s) ? 'thud' : 'tap'](); FX.anim(p, [{ transform: 'translateY(-18px) scale(1.2)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'backwards' }); const c = centreOf(p); FX.burst(c.x, c.y + 10, { kind: 'dust', n: heavy(s) ? 7 : 4, scale: .7 }); }, 250 + i * 260); });
      const pad = el('div', 'lot-dinos');
      let done = 0, selected = null;
      /* A different voice for every animal, so a match always sounds like that animal. */
      const voice = (s) => { if (s === 'trex') FX.sfx.roar(); else if (s === 'bronto') FX.sfx.engine(); else if (s === 'stego') FX.sfx.chomp(); else if (s === 'tricera') FX.sfx.drum(2); else if (s === 'ptero') FX.sfx.boing(); else FX.sfx.chirp(); };
      // One place-it function for both dragging and tapping.
      const tryPlace = (card, target) => {
        if (!target || target.classList.contains('solved')) return false;
        if (target.dataset.s !== card.dataset.s) {
          slips++; ctx.bad(.5, target); FX.shake(target); FX.shake(card); FX.sfx.splash();
          const c = centreOf(target); FX.burst(c.x, c.y, { kind: 'drops', n: 6, color: G.dark ? '#7f7fd0' : '#8a6a45' });
          const want = TOES[target.dataset.s], got = TOES[card.dataset.s];
          ctx.say(shadows ? 'Not that shadow. Turn it round in your head — which way does the tail go?'
            : want.n !== got.n ? `Count the toes! These prints have ${want.n}, the ${SPEC_NAME[card.dataset.s]} leaves ${got.n}.`
              : `Both have ${want.n} toes! ${SPEC_NAME[card.dataset.s]} makes ${got.t}. Look for ${want.t}.`, 'sad');
          return false;
        }
        target.classList.add('solved'); target.style.setProperty('--fill', FILL[card.dataset.c]);
        const main = $('.lot-main', target); if (main) main.style.fill = '';
        card.classList.remove('sel', 'dragging'); card.classList.add('locked', 'placed'); card.style.transform = '';
        $('.lot-slot', target).append(card);
        const d = card.firstElementChild; FX.dinoState(d, 'happy'); d.setAttribute('data-base', 'happy');
        FX.anim(target, [{ transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 340, easing: 'cubic-bezier(.3,1.6,.5,1)' });
        const ring = el('i'); ring.style.cssText = 'position:absolute;inset:6%;border-radius:18px;border:4px solid #ffdf6b;pointer-events:none;z-index:9';
        target.append(ring); FX.anim(ring, [{ transform: 'scale(.7)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 620, easing: 'ease-out' }); setTimeout(() => ring.remove(), 700);
        ctx.good(target); const c = centreOf(target); FX.burst(c.x, c.y, { kind: G.dark ? 'sparkle' : 'stars', n: 9 }); voice(card.dataset.s);
        const tag = el('b', 'lot-name', SPEC_NAME[card.dataset.s]); tag.style.cssText = 'position:relative;z-index:5'; target.append(tag); FX.pop(tag); FX.sfx.star();
        ctx.say(shadows ? `Yes! That shape is the ${SPEC_NAME[card.dataset.s]}!` : `Yes! ${TOES[card.dataset.s].t.charAt(0).toUpperCase() + TOES[card.dataset.s].t.slice(1)} — the ${SPEC_NAME[card.dataset.s]}!`);
        fill.style.width = (++done / k * 100) + '%';
        if (done === k) {
          FX.celebrate(); ctx.flutter(3);
          // The whole group does a happy stomp-dance before the round ends.
          cards.forEach((x, i) => setTimeout(() => { FX.bounce(x); FX.sfx.drum(i % 3); }, i * 140));
          finish();
        }
        return true;
      };
      const cards = shuffle(set).map((d) => {
        const c = el('div', 'lot-card'); c.dataset.s = d.s; c.dataset.c = d.c;
        c.innerHTML = FX.dinoHTML(d.s, { color: d.c, state: 'idle' });
        drag(c, {
          over: (x, y) => prints.forEach((p) => p.classList.toggle('hot', p === hit(prints, x, y) && !p.classList.contains('solved'))),
          drop: (x, y) => tryPlace(c, hit(prints, x, y, 8)),
          tap: () => { cards.forEach((q) => q.classList.remove('sel')); selected = c; c.classList.add('sel'); FX.sfx.tap(); ctx.say('Now tap the prints that match.'); },
        });
        pad.append(c); return c;
      });
      prints.forEach((p) => p.addEventListener('click', () => { if (selected && !selected.classList.contains('locked') && tryPlace(selected, p)) selected = null; }));
      // A magnifying glass points at a pair that belongs together.
      const showMe = () => {
        const card = cards.find((q) => !q.classList.contains('locked')); if (!card) return;
        const pr = prints.find((q) => q.dataset.s === card.dataset.s); if (!pr) return;
        const g = el('div', 'lot-lens', '🔍'); pr.append(g); card.classList.add('glow'); FX.sfx.sparkle();
        ctx.say(shadows ? `This shape is the ${SPEC_NAME[card.dataset.s]} — see the tail?` : `Here is one. ${TOES[card.dataset.s].t.charAt(0).toUpperCase() + TOES[card.dataset.s].t.slice(1)}.`);
        setTimeout(() => { g.remove(); card.classList.remove('glow'); }, 3000);
      };
      ctx.hint(showMe);
      const help = el('button', 'btn small', '💡 Show me');
      help.onclick = () => { ctx.say('Hints are free — take as many as you like!'); showMe(); };
      head.append(help);
      const finish = async () => {
        const secs = (Date.now() - t0) / 1000, last = ctx.round === ctx.rounds;
        const rec = beatBest('lotto', ctx.round, secs), c = centreOf(mud);
        if (rec.isNew) { FX.floatText(c.x, c.y - 30, `New best! ${rec.best}s`, { size: 24 }); FX.sfx.coin(); }
        else if (!rec.was) FX.floatText(c.x, c.y - 30, `First time: ${rec.best}s`, { size: 22 });
        if (!slips && secs < k * 9) ctx.bonus(1, mud, 'Quick feet!');
        if (window.DUWONDER && DUWONDER.running && DUWONDER.running()) DUWONDER.mote(last ? 3 : 1);
        if (last && await keepGoing(ctx, 'Keep going?', 'A mystery trail leads off into the reeds.', 'Follow the prints!', '#d9694f', (host, d2) => bonusTrail(ctx, host, d2))) {
          ctx.done(`You matched every shadow, then solved a mystery trail in ${bestLine('lotto', ctx.round).replace('Best ⏱ ', '')}!`, 2600);
          return;
        }
        ctx.done(last ? `Every footprint, every shadow — you know ${k} animals by their feet!` : `You matched all ${k} in the ${G.name.toLowerCase()}!`, 2400);
      };
      ctx.area.append(head, prog, mud, pad);
    },
  });

  /* ====================================================================== 4. Dino Mixer */
  const ACCS = [{ k: 'hat', e: '🎩', n: 'Top hat' }, { k: 'crown', e: '👑', n: 'Crown' }, { k: 'glasses', e: '🕶️', n: 'Sunglasses' }, { k: 'bow', e: '🎀', n: 'Bow' }, { k: 'flower', e: '🌸', n: 'Flower' }, { k: 'party', e: '🧢', n: 'Cap' }];
  // [dx, dy, size, rotation] relative to the eye, drawn inside the head so it moves with it.
  const ACC_POS = { hat: [-4, -38, 50, -10], crown: [-6, -36, 44, -8], glasses: [-14, 6, 40, 0], bow: [-14, 40, 32, 12], flower: [-10, -28, 34, 14], party: [-12, 8, 36, 0] };
  const COLOUR_HEX = { green: '#91d09c', teal: '#7fd1c7', purple: '#b9a1e6', orange: '#f6b273', pink: '#f5a9c4', blue: '#8cc3ee', yellow: '#f3d56b', red: '#ee8a7c' };
  const dress = (dinoEl, accs) => {
    const svg = dinoEl && dinoEl.querySelector('svg'); if (!svg) return;
    const eye = svg.querySelector('.d-eye circle'), head = eye && eye.closest('.d-head'); if (!head) return;
    const cx = +eye.getAttribute('cx'), cy = +eye.getAttribute('cy'), ns = 'http://www.w3.org/2000/svg';
    accs.forEach((k) => {
      const a = ACCS.find((x) => x.k === k), [dx, dy, size, rot] = ACC_POS[k];
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', cx + dx); t.setAttribute('y', cy + dy); t.setAttribute('font-size', size); t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('transform', `rotate(${rot} ${cx + dx} ${cy + dy})`); t.textContent = a.e; head.append(t);
    });
  };
  /* Four backdrops to mix in front of, each with its own drifting litter. */
  const STAGES = [
    { name: 'Meadow stage', bg: 'linear-gradient(#d8f3c9,#a2d68a)', litter: ['🌼', '🦋', '🍃', '🐞'] },
    { name: 'Lagoon stage', bg: 'linear-gradient(#c7f2f7,#7fc9dd)', litter: ['🐟', '🌴', '💧', '🪷'] },
    { name: 'Volcano stage', bg: 'linear-gradient(#f6c9a0,#c9714f)', litter: ['🌋', '🔥', '🪨', '🍂'] },
    { name: 'Starry stage', bg: 'linear-gradient(#3b3378,#1b1740)', litter: ['⭐', '🌙', '✨', '🪐'] },
  ];
  /* Free-play rounds give a silly wish to grant; matching it pays a bonus. */
  const WISHES = [
    { t: 'wear a hat or a crown', ok: (s) => s.acc.includes('hat') || s.acc.includes('crown') },
    { t: 'be pink or purple', ok: (s) => s.c === 'pink' || s.c === 'purple' },
    { t: 'have a tiny head on a big body', ok: (s) => (s.h === 'raptor' || s.h === 'ptero') && (s.b === 'bronto' || s.b === 'trex') },
    { t: 'mix two different dinosaurs', ok: (s) => s.h !== s.b },
    { t: 'wear two or more styles', ok: (s) => s.acc.length >= 2 },
  ];
  let mixStages = [], mixPairs = [];
  /* After the last round: spin a quick twin for the Dino Den. No rules, and no stars at stake. */
  function bonusTwin(ctx, host, done) {
    const st = { b: pick(SPECIES), h: pick(SPECIES), c: pick(COLORS), n: null, acc: [] };
    host.innerHTML = '<p style="margin:0;font-weight:800;font-size:14px">Mix a twin for your den! Spin, style it, name it, wake it up.</p>';
    const box = el('div', 'mix-stage');
    box.style.cssText = 'width:min(70vw,220px);min-height:130px';
    const paint = () => { box.innerHTML = FX.dinoHTML(st.b, { head: st.h, color: st.c, state: 'idle' }); const d = box.firstElementChild; dress(d, st.acc); FX.pop(d); };
    paint();
    const spin = el('button', 'mix-btn m-dice', '<span>🎲</span><b>Spin</b>');
    spin.onclick = () => { st.b = pick(SPECIES); st.h = pick(SPECIES); st.c = pick(COLORS); FX.sfx.coin(); paint(); const c = centreOf(box); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 }); };
    const styleRow = el('div', 'pick-box');
    shuffle(ACCS).slice(0, 4).forEach((a) => {
      const b = el('button', 'pick', a.e); b.setAttribute('aria-label', 'Twin ' + a.n);
      b.onclick = () => { const i = st.acc.indexOf(a.k); if (i >= 0) st.acc.splice(i, 1); else st.acc.push(a.k); FX.sfx.sparkle(); paint(); };
      styleRow.append(b);
    });
    const nameRow = el('div', 'mix-names');
    shuffle(NAMES).slice(0, 4).forEach((n) => {
      const b = el('button', 'chip', n);
      b.onclick = () => { st.n = n; $$('button', nameRow).forEach((x) => x.classList.toggle('on', x === b)); FX.sfx.chirp(); ctx.say(`${n}! A perfect twin name.`); };
      nameRow.append(b);
    });
    const wake = el('button', 'btn big wake', '✨ Wake it up!');
    wake.onclick = () => {
      if (wake.disabled) return;
      if (!st.n) { ctx.say('Give your twin a name first!'); FX.shake(nameRow); FX.sfx.bad(); return; }
      wake.disabled = true; spin.disabled = true;
      den.add({ s: st.b, h: st.h, c: st.c, n: st.n });
      const d = box.firstElementChild; FX.dinoState(d, 'roar', 1100); FX.sfx.roar();
      const c = centreOf(box); FX.burst(c.x, c.y, { kind: 'confetti', n: 18 });
      ctx.bonus(st.acc.length >= 2 ? 2 : 1, box, st.acc.length >= 2 ? 'A fancy twin!' : 'A twin!');
      FX.celebrate(); ctx.say(`${st.n} joined ${st.b === st.h ? 'the family' : 'the den'}!`);
      setTimeout(done, 1600);
    };
    host.append(box, styleRow, nameRow, wake);
  }
  window.Park.register({
    id: 'assemble', name: 'Dino Mixer', icon: 'bronto', color: '#2fa58a', rounds: 4, helper: 'bronto', ambient: 'meadow',
    desc: 'Mix heads and bodies to invent new dinosaurs!',
    round(ctx) {
      const R = ctx.round, mission = R < 4, needColour = R >= 2, memory = R === 3;
      /* Pair and backdrop decks are shuffled once per session, so a second play builds different animals. */
      if (R === 1) { mixStages = shuffle(STAGES); mixPairs = shuffle(SPECIES.flatMap((b) => SPECIES.filter((h) => h !== b).map((h) => ({ b, h })))); }
      const G = mixStages[(R - 1) % mixStages.length], names = shuffle(NAMES).slice(0, 5);
      const pair = mixPairs[(R - 1) % mixPairs.length];
      const target = mission ? { b: pair.b, h: pair.h, c: pick(COLORS) } : null;
      const wish = mission ? null : pick(WISHES);
      const st = { b: SPECIES[rnd(SPECIES.length)], h: null, c: COLORS[rnd(COLORS.length)], name: null, acc: [] };
      st.h = st.b === 'trex' ? 'stego' : 'trex';
      if (mission && st.c === target.c) st.c = COLORS[(COLORS.indexOf(st.c) + 1) % COLORS.length];
      const t0 = Date.now(); let slips = 0;
      ctx.say(mission ? (memory ? 'Look closely! Then build it from memory.' : R === 1 ? 'Can you build the dinosaur in the picture?' : 'A trickier one! Head, body and colour must all match.') : `Invent your very own dinosaur! This one wishes to ${wish.t}.`);
      const wrap = el('div', 'mix-wrap');
      const head = statusBar([`Level ${R}`, mission ? `Build a ${SPEC_NAME[target.h]} + ${SPEC_NAME[target.b]}` : 'Make your own', bestLine('assemble', R)], '#2fa58a');
      let tEl = null;
      const label = (t) => `${SPEC_NAME[t.h]} head · ${SPEC_NAME[t.b]} body${needColour ? ' · ' + t.c : ''}`;
      if (mission) {
        tEl = el('div', 'mix-target'); tEl.dataset.b = target.b; tEl.dataset.h = target.h; tEl.dataset.c = target.c;
        tEl.style.cssText = 'background:linear-gradient(#fff,#e6f7f1);box-shadow:0 5px 0 rgba(0,0,0,.14),inset 0 0 0 3px #bfe6d8';
        tEl.innerHTML = `<small>Build this one!</small><div class="mt-dino">${FX.dinoHTML(target.b, { head: target.h, color: needColour ? target.c : 'blue', state: 'idle' })}</div><span class="mt-txt">${label(target)}</span>`;
        wrap.append(tEl);
        FX.anim(tEl, [{ transform: 'translateY(-12px) scale(.92)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.9,.3,1.25)' });
        if (memory) {
          const peek = el('button', 'btn small', '👁 Peek again'); peek.hidden = true;
          const hide = () => { tEl.classList.add('hiding'); $('.mt-txt', tEl).textContent = 'Can you remember?'; peek.hidden = false; FX.sfx.tap(); };
          setTimeout(() => { if (ctx.alive()) hide(); }, 5200);
          peek.onclick = () => { FX.sfx.whoosh(); tEl.classList.remove('hiding'); $('.mt-txt', tEl).textContent = label(target); peek.hidden = true; setTimeout(() => { if (ctx.alive()) hide(); }, 2200); };
          wrap.append(peek);
        }
      } else {
        const w = el('div', 'mix-wish');
        w.style.cssText = 'display:flex;gap:8px;align-items:center;justify-content:center;background:#fffaf0;border:3px dashed #ffbf3a;border-radius:18px;padding:5px 14px;font-weight:900;font-size:14px;color:#6b4d12;box-shadow:0 4px 0 rgba(0,0,0,.12)';
        w.innerHTML = '<span style="font-size:22px">🌟</span><span>Wish: it must <b>' + wish.t + '</b></span>';
        wrap.append(w); FX.pop(w);
      }
      const stageEl = el('div', 'mix-stage');
      stageEl.style.background = G.bg;
      stageEl.style.borderRadius = '28px';
      stageEl.style.boxShadow = 'inset 0 -10px 0 rgba(0,0,0,.12), 0 7px 0 rgba(0,0,0,.14)';
      stageEl.style.overflow = 'visible';
      const sky = el('div', 'mix-sky');
      sky.style.cssText = 'position:absolute;inset:0;border-radius:28px;overflow:hidden;pointer-events:none;z-index:0';
      for (let i = 0; i < 5; i++) {
        const s = el('span', 'sky-bit', pick(G.litter));
        s.style.cssText = `position:absolute;left:${f0(rnd(84))}%;top:${f0(rnd(72))}%;font-size:${f0(11 + rnd(13))}px;opacity:${G.name === 'Starry stage' ? .85 : .5}`;
        sky.append(s);
        FX.anim(s, [{ transform: 'translate(0,0)' }, { transform: `translate(${f0(rnd(64) - 32)}px,${f0(-12 - rnd(16))}px)` }], { duration: 2400 + rnd(2000), delay: i * 240, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
      }
      const dinoBox = el('div', 'mix-body');
      dinoBox.style.cssText = 'position:relative;z-index:2;width:100%';
      stageEl.append(sky, dinoBox);
      const the = () => dinoBox.firstElementChild;
      const draw = (pop) => {
        stageEl.dataset.b = st.b; stageEl.dataset.h = st.h; stageEl.dataset.c = st.c;
        dinoBox.innerHTML = FX.dinoHTML(st.b, { head: st.h, color: st.c, state: 'idle' });
        const d = the(); dress(d, st.acc); if (pop) FX.pop(d);
        $$('.pick', wrap).forEach((b) => b.classList.toggle('on', (b.dataset.kind === 'h' && b.dataset.v === st.h) || (b.dataset.kind === 'b' && b.dataset.v === st.b) || (b.dataset.kind === 'c' && b.dataset.v === st.c) || (b.dataset.kind === 'a' && st.acc.includes(b.dataset.v))));
      };
      /* Pat the stage and the animal answers in its own voice. */
      stageEl.onclick = () => {
        const d = the(); FX.dinoState(d, st.h === 'trex' ? 'roar' : 'happy', 900);
        if (st.h === 'trex') FX.sfx.roar(); else if (st.h === 'bronto' || st.h === 'stego') FX.sfx.drum(1); else if (st.h === 'ptero') FX.sfx.boing(); else FX.sfx.chirp();
        const c = centreOf(stageEl); FX.burst(c.x, c.y, { kind: 'notes', n: 4, scale: .8 });
      };
      const describe = () => ctx.say(st.h === st.b ? `Same dinosaur all over — a proper ${SPEC_NAME[st.h]}!` : `${SPEC_NAME[st.h]} head on a ${SPEC_NAME[st.b]} body!`);
      const row = (title, cls) => { const r = el('div', 'pick-row ' + cls); r.append(el('b', 'pick-title', title)); const box = el('div', 'pick-box'); r.append(box); return [r, box]; };
      /* Every kind of choice gets its own sound, so a head click and a colour click do not sound alike. */
      const KIND_SFX = { h: 'pop', b: 'thud', c: 'splash', a: 'sparkle' };
      const pickBtn = (box, kind, v, html, label) => {
        const b = el('button', 'pick ' + (kind === 'c' ? 'swatch' : ''), html); b.dataset.kind = kind; b.dataset.v = v; b.setAttribute('aria-label', label);
        if (kind === 'c') b.style.background = COLOUR_HEX[v];
        b.onclick = () => {
          if (kind === 'a') { const i = st.acc.indexOf(v); if (i >= 0) st.acc.splice(i, 1); else st.acc.push(v); }
          else st[kind] = v;
          FX.sfx[KIND_SFX[kind]]();
          draw(true);
          const c = centreOf(b);
          FX.burst(c.x, c.y, kind === 'c' ? { kind: 'drops', n: 7, color: COLOUR_HEX[v] } : { kind: 'sparkle', n: kind === 'b' ? 9 : 6 });
          FX.pulse(b);
          const d = the();
          if (kind === 'c' && d) FX.anim(d, [{ filter: 'saturate(2.6) brightness(1.5)' }, { filter: 'none' }], { duration: 620 });
          if (kind === 'a' && d) FX.wiggle(d);
          if (kind !== 'c') describe(); else ctx.say(`${v}! ${st.h === st.b ? 'A whole ' + SPEC_NAME[st.h] : SPEC_NAME[st.h] + ' head, ' + SPEC_NAME[st.b] + ' body'} — that is my favourite.`);
        };
        box.append(b); return b;
      };
      const [rowH, boxH] = row('Head', 'ph'), [rowB, boxB] = row('Body', 'pb'), [rowC, boxC] = row('Colour', 'pc');
      SPECIES.forEach((s) => { pickBtn(boxH, 'h', s, `<span class="mini">${FX.dinoHTML(s, { state: 'idle' })}</span>`, SPEC_NAME[s] + ' head'); pickBtn(boxB, 'b', s, `<span class="mini">${FX.dinoHTML(s, { state: 'idle' })}</span>`, SPEC_NAME[s] + ' body'); });
      COLORS.forEach((c) => pickBtn(boxC, 'c', c, '', 'Colour ' + c));
      const picks = el('div', 'mix-picks'); picks.append(rowH, rowB, rowC);
      const dice = el('button', 'mix-btn m-dice', '<span>🎲</span><b>Surprise</b>');
      /* The dice flickers through three mixtures before it lands, so a spin looks like a slot machine. */
      dice.onclick = async () => {
        if (dice.disabled) return;
        FX.sfx.coin(); FX.sfx.whoosh();
        for (let i = 0; i < 3; i++) { st.b = pick(SPECIES); st.h = pick(SPECIES); st.c = pick(COLORS); draw(true); await sleep(130); }
        ctx.say(`Ooh! A ${SPEC_NAME[st.h]} head on a ${SPEC_NAME[st.b]} body in ${st.c}!`);
        const c = centreOf(stageEl); FX.burst(c.x, c.y, { kind: 'sparkle', n: 14 });
        if (!mission && wish.ok(st)) ctx.say('Hey — that spin already grants the wish!');
      };
      const nameRow = el('div', 'mix-names');
      if (!mission) {
        const [rowA, boxA] = row('Style', 'pa'); shuffle(ACCS).forEach((a) => pickBtn(boxA, 'a', a.k, a.e, a.n)); picks.append(rowA);
        names.forEach((n) => { const b = el('button', 'chip', n); b.onclick = () => { st.name = n; $$('.chip', nameRow).forEach((x) => x.classList.toggle('on', x === b)); FX.sfx.chirp(); ctx.say(`${n} is a lovely name! ${wish.ok(st) ? 'And it grants the wish!' : 'Now make it ' + wish.t + '.'}`); }; nameRow.append(b); });
      }
      const go = el('button', 'btn big wake', '✨ Wake it up!');
      go.onclick = async () => {
        if (mission) {
          const okH = st.h === target.h, okB = st.b === target.b, okC = !needColour || st.c === target.c;
          if (!(okH && okB && okC)) {
            slips++; ctx.bad(1, stageEl); FX.shake(stageEl); FX.sfx.thud();
            const right = [okH && 'head', okB && 'body', okC && 'colour'].filter(Boolean);
            // A near miss names the parts that are already right, instead of only saying "no".
            ctx.say(right.length >= 2
              ? `So close! Your ${right.join(' and ')} ${right.length > 1 ? 'are' : 'is'} spot on — now ${okC ? 'change the ' + (okB ? 'head' : 'body') + ' to a ' + SPEC_NAME[okB ? target.h : target.b] : 'make it ' + target.c}.`
              : `Not quite! You need a ${SPEC_NAME[target.h]} head, a ${SPEC_NAME[target.b]} body${needColour ? ' in ' + target.c : ''}.`, 'sad');
            return;
          }
        } else if (!st.name) { ctx.say('Pick a name for your dinosaur first!'); FX.shake(nameRow); FX.sfx.tap(); return; }
        go.disabled = true; dice.disabled = true; $$('.pick', wrap).forEach((b) => { b.disabled = true; });
        // A flash of light, a roar and then the dinosaur comes to life.
        const zap = el('div', 'mix-zap'); stageEl.append(zap);
        const d = the(); FX.dinoState(d, 'roar', 1100); FX.sfx.roar(); FX.shakeScreen(3);
        const c = centreOf(stageEl); FX.burst(c.x, c.y, { kind: 'sparkle', n: 24 }); FX.burst(c.x, c.y - 44, { kind: 'stars', n: 10 });
        FX.celebrate(); ctx.good(stageEl); ctx.flutter(3); FX.sfx.win();
        if (!mission) {
          den.add({ s: st.b, h: st.h, c: st.c, n: st.name }); ctx.say(`${st.name} has moved into your Dino Den!`);
          if (wish.ok(st)) { ctx.bonus(2, stageEl, 'Wish come true!'); FX.floatText(c.x, c.y - 74, '🌟 Wish granted!', { size: 26 }); FX.sfx.sparkle(); }
          else if (st.acc.length >= 2) ctx.bonus(1, stageEl, 'So fancy!');
          const tag = el('div', 'mix-card', `<b>${st.name}</b><span>${SPEC_NAME[st.h]} head · ${SPEC_NAME[st.b]} body</span>`); stageEl.append(tag); stageEl.classList.add('has-card'); FX.pop(tag);
        } else {
          const secs = (Date.now() - t0) / 1000, rec = beatBest('assemble', R, secs);
          if (rec.isNew) { FX.floatText(c.x, c.y - 74, `New best build! ${rec.best}s`, { size: 24 }); FX.sfx.coin(); }
          else if (!rec.was) FX.floatText(c.x, c.y - 74, `First build: ${rec.best}s`, { size: 22 });
          if (!slips && secs < 60) ctx.bonus(1, stageEl, 'Fast mixer!');
        }
        await sleep(1200); if (!ctx.alive()) return;
        d.setAttribute('data-base', 'happy'); FX.dinoState(d, 'happy');
        if (window.DUWONDER && DUWONDER.running && DUWONDER.running()) DUWONDER.mote(R === ctx.rounds ? 3 : 1);
        const last = R === ctx.rounds;
        if (last && await keepGoing(ctx, 'Keep going?', 'Spin a brand-new twin for your Dino Den and give it a fancy style.', 'Mix a twin!', '#2fa58a', (host, d2) => bonusTwin(ctx, host, d2))) {
          ctx.done(`You built every mission and filled the den — ${st.name} and its twin are awake!`, 2600);
          return;
        }
        ctx.done(mission ? 'You built it perfectly!' : `Meet ${st.name}! ${wish.ok(st) ? 'Wish granted, too!' : 'What a creature!'}`, 2200);
      };
      // The helper lights up the next thing that is not right yet.
      const showMe = () => {
        if (tEl) tEl.classList.remove('hiding');
        if (!mission) {
          if (!st.name) { const b = nameRow.firstElementChild; if (b) { FX.bounce(b); FX.sfx.chirp(); ctx.say('Start by giving your dinosaur a name!'); } return; }
          const b = $$('.pick', wrap).find((x) => (x.dataset.kind === 'a' && !x.classList.contains('on')) || (x.dataset.kind === 'c' && x.dataset.v !== st.c));
          if (b) { b.classList.add('glow'); b.style.filter = 'drop-shadow(0 0 8px #ffcf33)'; FX.sfx.sparkle(); setTimeout(() => { b.classList.remove('glow'); b.style.filter = ''; }, 2600); }
          ctx.say(`The wish is: ${wish.t}. ${wish.ok(st) ? 'You have granted it — wake it up!' : 'This button should help.'}`);
          return;
        }
        const want = st.h !== target.h ? ['h', target.h] : st.b !== target.b ? ['b', target.b] : needColour && st.c !== target.c ? ['c', target.c] : null;
        const b = want && $$('.pick', wrap).find((x) => x.dataset.kind === want[0] && x.dataset.v === want[1]);
        if (b) { b.classList.add('glow'); FX.sfx.sparkle(); setTimeout(() => b.classList.remove('glow'), 2800); ctx.say(`Here — this is the ${want[0] === 'c' ? 'colour' : SPEC_NAME[want[1]] + ' ' + want[0]} you still need.`); }
        else ctx.say('Every part matches! Pat the stage and wake it up!');
      };
      ctx.hint(showMe);
      const help = el('button', 'btn small', '💡 Show me');
      help.onclick = () => { ctx.say('Hints are free — take one any time!'); showMe(); };
      head.append(help);
      const act = el('div', 'mix-act'); act.append(dice, go);
      wrap.append(stageEl, picks, nameRow, act);
      ctx.area.append(head, wrap);
      FX.anim(stageEl, [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 460, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
      draw();
    },
  });
})();
