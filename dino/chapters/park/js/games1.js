/* Dino Park games 1–4: Puzzle, Dig, Footprint Match, Dino Mixer. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, drag, hit, den, NAMES, SPECIES, COLORS, FX } = window.Park;
  const SPEC_NAME = { trex: 'T-rex', tricera: 'Triceratops', stego: 'Stegosaurus', bronto: 'Brontosaurus', raptor: 'Raptor', ptero: 'Pterosaur' };
  window.Park.SPEC_NAME = SPEC_NAME;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ====================================================================== 1. Dino Puzzle */
  /* The scene is HTML-parsed first and then serialised, because the dinosaur art repeats an attribute that a strict
   * XML image loader refuses (that left every puzzle piece blank). */
  const toXML = (svgHTML) => { const t = document.createElement('div'); t.innerHTML = svgHTML; return new XMLSerializer().serializeToString(t.firstElementChild); };
  const THEMES = {
    meadow: { sky: ['#7fd0f2', '#e9f8d4'], far: '#9ccfb0', hill1: '#8fd18f', hill2: '#5fb36f', glow: '#ffe27a' },
    sunset: { sky: ['#ff8f6b', '#ffe3a8'], far: '#c78a8a', hill1: '#b5c978', hill2: '#7fae5f', glow: '#fff0a8' },
    night: { sky: ['#1d1b5c', '#6a58b8'], far: '#3d3f8f', hill1: '#3f8f78', hill2: '#2c6e66', glow: '#fff6d0' },
  };
  function sceneSVG(species, color, uid, theme, species2) {
    const T = THEMES[theme] || THEMES.meadow, night = theme === 'night';
    const dino = FX.dinoSVG(species, { color }).replace('<svg class="du-dino-svg"', '<svg x="60" y="88" width="236" height="177" class="du-dino-svg"');
    const dino2 = species2 ? FX.dinoSVG(species2, { color: COLORS[(COLORS.indexOf(color) + 3) % COLORS.length] }).replace('<svg class="du-dino-svg"', '<svg x="-8" y="150" width="132" height="99" class="du-dino-svg"') : '';
    const stars = Array.from({ length: 16 }, (_, i) => `<circle class="sc-star" cx="${(i * 47 + 20) % 350}" cy="${(i * 31 + 12) % 120}" r="${1.4 + (i % 3) * .7}" fill="#fff" style="animation-delay:${(i % 5) * .4}s"/>`).join('');
    const sky = night
      ? `<g>${stars}</g><circle cx="300" cy="46" r="24" fill="#fffbe0"/><circle cx="310" cy="40" r="22" fill="#2a2870" opacity=".9"/>`
      : `<g class="sc-sun"><circle cx="300" cy="46" r="40" fill="${T.glow}" opacity=".35"/><circle cx="300" cy="46" r="26" fill="url(#sn${uid})"/></g>
         <g class="sc-clouds" fill="#fff" opacity=".92"><ellipse cx="70" cy="48" rx="34" ry="12"/><ellipse cx="92" cy="40" rx="22" ry="14"/><ellipse cx="190" cy="30" rx="28" ry="10"/><ellipse cx="206" cy="24" rx="16" ry="10"/></g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270">
      <defs><linearGradient id="sk${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset="1" stop-color="${T.sky[1]}"/></linearGradient>
      <radialGradient id="sn${uid}"><stop offset="0" stop-color="#fff6c0"/><stop offset="1" stop-color="#ffcf4d"/></radialGradient></defs>
      <rect width="360" height="270" fill="url(#sk${uid})"/>
      ${sky}
      <path d="M0 170 L50 110 L96 160 L150 96 L210 170 L260 128 L360 190 L360 270 L0 270Z" fill="${T.far}"/>
      <path d="M232 190 L276 92 Q298 78 320 92 L360 190Z" fill="#8a5d44"/><path d="M276 92 Q298 104 320 92 Q298 82 276 92Z" fill="#ff7a3d"/><path d="M292 100 q-4 26 -14 52 M304 100 q6 22 16 52" stroke="#ff9b50" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle class="sc-smoke" cx="298" cy="74" r="10" fill="#8b8484" opacity=".5"/><circle class="sc-smoke s2" cx="306" cy="58" r="14" fill="#8b8484" opacity=".35"/>
      <path d="M0 214 Q90 186 190 212 T360 206 L360 270 L0 270Z" fill="${T.hill1}"/><path d="M0 244 Q120 222 240 246 T360 240 L360 270 L0 270Z" fill="${T.hill2}"/>
      <path d="M30 262 Q26 210 34 160" stroke="#7a5a3a" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M34 160 Q8 140 0 160 M34 160 Q60 136 76 156 M34 160 Q24 130 8 128 M34 160 Q50 128 66 130" stroke="#3f9a5e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <g class="scene-dino">${dino}</g>${dino2 ? `<g class="scene-dino2">${dino2}</g>` : ''}
      <circle cx="120" cy="256" r="5" fill="#ff8fb3"/><circle cx="218" cy="258" r="5" fill="#ffd54f"/><circle cx="330" cy="256" r="5" fill="#ff8fb3"/><circle cx="170" cy="262" r="4" fill="#fff"/>
      ${night ? '<g class="sc-fly" fill="#fff6a0"><circle cx="90" cy="206" r="3"/><circle cx="260" cy="226" r="3"/><circle cx="150" cy="190" r="2.5"/></g>' : '<g class="sc-fly"><text x="100" y="196" font-size="16">🦋</text><text x="250" y="214" font-size="14">🦋</text></g>'}
    </svg>`;
  }
  const dataUri = (svg) => 'url("data:image/svg+xml;utf8,' + encodeURIComponent(toXML(svg)) + '")';
  let album = [], puzSpecies = [];

  window.Park.register({
    id: 'jigsaw', name: 'Dino Puzzle', icon: 'tricera', color: '#7a6fd1', rounds: 5, helper: 'tricera', ambient: 'meadow',
    desc: 'Drag the pieces to build a dinosaur picture!',
    round(ctx) {
      const grids = [[2, 2], [3, 2], [3, 3], [4, 3], [5, 4]], [cols, rows] = grids[ctx.round - 1], total = cols * rows;
      if (ctx.round === 1) { album = []; puzSpecies = shuffle(SPECIES.filter((s) => s !== 'ptero')); }
      const sp = puzSpecies[(ctx.round - 1) % puzSpecies.length], color = pick(COLORS), theme = ['meadow', 'sunset', 'night', 'meadow', 'sunset'][ctx.round - 1], sp2 = ctx.round === 5 ? puzSpecies[ctx.round % puzSpecies.length] : null;
      const uid = Date.now() % 100000;
      const svg = sceneSVG(sp, color, uid, theme, sp2), img = dataUri(svg);
      const blind = ctx.round >= 3, spin = ctx.round >= 4, t0 = Date.now();
      let slips = 0;
      ctx.say(ctx.round === 1 ? 'Drag each piece to its place!' : spin ? 'Some pieces are turned around! Tap a piece to spin it, then drag it in.' : blind ? 'No hints this time. Build the whole picture!' : 'A bigger picture! Find where each piece goes.');
      const wrap = el('div', 'puz-wrap');
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
        if (slot.dataset.i !== p.dataset.i) { slips++; ctx.bad(.5, slot); FX.shake(slot); ctx.say('Hmm, not there. Try another spot!'); return false; }
        if (slot.firstChild) return false;
        if (+p.dataset.rot % 360) { ctx.say('Right spot! Now tap the piece to turn it the right way up.'); FX.pop(p); return false; }
        p.classList.remove('dragging', 'sel', 'hint'); p.classList.add('locked', 'placed'); p.style.transform = '';
        slot.append(p); slot.classList.add('filled'); slot.classList.remove('hint'); ctx.good(slot);
        FX.sfx.note(placed * 2 + 2, .2);
        const c = centreOf(slot); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 });
        FX.anim(p, [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 300 });
        ctx.say(placed + 1 < total ? `${total - placed - 1} piece${total - placed - 1 === 1 ? '' : 's'} left!` : 'Last piece in!');
        if (++placed === total) complete();
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
            if (spin && !p.classList.contains('locked')) { p.dataset.rot = (+p.dataset.rot + 90) % 360; inn.style.transform = `rotate(${p.dataset.rot}deg)`; FX.sfx.tap(); return; }
            pieces.forEach((q) => q.classList.remove('sel')); selected = p; p.classList.add('sel'); FX.sfx.tap();
          },
        });
        pieces.push(p);
      }
      slots.forEach((s) => s.addEventListener('click', () => { if (!spin && selected && !s.firstChild && place(selected, s)) selected = null; }));
      shuffle(pieces).forEach((p) => tray.append(p));
      wrap.append(albumEl, board, tray);
      // The helper bounces the next piece and glows the spot it belongs in.
      ctx.hint(() => {
        const p = pieces.find((q) => !q.classList.contains('locked')); if (!p) return;
        const s = slots[+p.dataset.i]; p.classList.add('hint'); s.classList.add('hint'); FX.sfx.sparkle();
        setTimeout(() => { p.classList.remove('hint'); s.classList.remove('hint'); }, 2600);
      });
      if (blind) {
        const peek = el('button', 'btn small', '👁 Peek');
        peek.onclick = () => { FX.sfx.whoosh(); ghost.style.opacity = .55; setTimeout(() => { ghost.style.opacity = 0; }, 1400); };
        wrap.append(peek);
      }
      ctx.area.append(wrap);
      const complete = async () => {
        await sleep(350);
        if (!ctx.alive()) return;
        const secs = (Date.now() - t0) / 1000;
        board.classList.add('done'); wrap.classList.add('solved'); ghost.style.opacity = 0;
        board.innerHTML = `<div class="du-dino puz-live" data-state="happy">${svg.replace('<svg xmlns="http://www.w3.org/2000/svg"', '<svg xmlns="http://www.w3.org/2000/svg" class="live"')}</div>`;
        FX.sfx.roar(); FX.celebrate(); ctx.flutter(4);
        if (!slips && secs < total * 7) ctx.bonus(1, board, 'Speedy!');
        // The finished picture hops into the album.
        const frame = albumEl.children[ctx.round - 1];
        album[ctx.round - 1] = img;
        if (frame) { await sleep(900); FX.flyTo(board, frame, { emoji: '🖼️', size: 34, duration: 800 }); setTimeout(() => { frame.style.backgroundImage = img; frame.classList.add('full'); FX.pop(frame); }, 800); }
        ctx.done(ctx.round === ctx.rounds ? 'You built it! Look, the dinosaurs are alive!' : 'You built it! Look, the dinosaur is alive!', 2600);
      };
    },
  });

  /* ====================================================================== 2. Dig a Dino */
  let museum = [], digSpecies = [];
  window.Park.register({
    id: 'dig', name: 'Dig a Dino', icon: 'stego', color: '#c98b4f', rounds: 4, helper: 'stego', helperColor: 'orange', ambient: 'desert',
    desc: 'Dig up the fossil bones, gems and eggs!',
    round(ctx) {
      if (ctx.round === 1) { museum = []; digSpecies = shuffle(SPECIES.filter((s) => s !== 'ptero')); }
      const bones = [4, 5, 6, 7][ctx.round - 1], sp = digSpecies[(ctx.round - 1) % digSpecies.length], dcol = pick(COLORS);
      const cells = ctx.round === 4 ? 24 : 20, gems = [0, 1, 1, 2][ctx.round - 1], eggs = ctx.round >= 3 ? 1 : 0, lizards = ctx.round >= 3 ? 1 : 0;
      const specials = [...Array(bones).fill('bone'), ...Array(gems).fill('gem'), ...Array(eggs).fill('egg'), ...Array(lizards).fill('lizard'), 'worm', 'worm', 'beetle', 'rock', 'rock'];
      const items = shuffle([...specials, ...Array(cells - specials.length).fill('dirt')]);
      ctx.say(ctx.round === 1 ? 'Tap a dirt mound twice to dig. Find ' + bones + ' bones!' : `Dig! There are ${bones} bones hiding. Gems and eggs are bonus!`);
      const top = el('div', 'dig-top');
      const mus = el('div', 'dig-museum');
      for (let i = 0; i < ctx.rounds; i++) { const m = el('span', 'mus-slot' + (museum[i] ? ' full' : '')); m.innerHTML = museum[i] ? FX.dinoHTML(museum[i].s, { color: museum[i].c, state: 'idle' }) : '<i>🦕</i>'; mus.append(m); }
      const ghost = el('div', 'dig-ghost', FX.dinoHTML(sp, { color: dcol, state: 'idle' }));
      const slots = el('div', 'dig-slots'); for (let i = 0; i < bones; i++) slots.append(el('span', 'dig-slot', '🦴'));
      top.append(mus, ghost, slots);
      const field = el('div', 'dig-field'); field.style.gridTemplateColumns = `repeat(${ctx.round === 4 ? 6 : 5}, minmax(0, 1fr))`;
      let found = 0;
      const ghostEl = ghost.firstElementChild;
      const setReveal = () => { ghost.style.setProperty('--rev', found / bones); };
      setReveal();
      const mounds = [];
      const reveal = (m, kind) => {
        const prize = $('.prize', m);
        const c = centreOf(m);
        const emoji = { bone: '🦴', worm: '🪱', beetle: '🪲', rock: '🪨', gem: '💎', egg: '🥚', lizard: '🦎', dirt: '✨' }[kind];
        prize.textContent = emoji; prize.classList.add('rise');
        return c;
      };
      ctx.hint(() => {
        const m = mounds.find((q) => q.dataset.kind === 'bone' && !q.classList.contains('open')); if (!m) return;
        m.classList.add('glint'); FX.sfx.sparkle(); const c = centreOf(m); FX.burst(c.x, c.y, { kind: 'sparkle', n: 8 });
        ctx.say('Something is shining over here!'); setTimeout(() => m.classList.remove('glint'), 3200);
      });
      items.forEach((kind, i) => {
        const m = el('button', 'mound'); m.dataset.kind = kind; m.dataset.i = i; m.setAttribute('aria-label', 'Dirt mound');
        m.style.setProperty('--tone', (rnd(5) - 2) * 4 + '%');
        m.innerHTML = '<span class="dome"></span><span class="prize"></span>';
        let hits = 0;
        m.onclick = async () => {
          if (m.classList.contains('open') || m.classList.contains('busy')) return;
          const c = centreOf(m);
          hits++; FX.sfx.thud(); FX.sfx.tap(); FX.burst(c.x, c.y, { kind: 'dust', n: 6 }); FX.shake(m);
          if (hits < 2) { m.classList.add('cracked'); ctx.say(pick(['Keep digging…', 'Dig dig dig!', 'Something is down there!'])); return; }
          m.classList.add('open', 'busy');
          const prize = $('.prize', m);
          if (kind === 'bone') {
            reveal(m, kind); FX.sfx.star(); FX.burst(c.x, c.y, { kind: 'sparkle', n: 14 });
            await sleep(250);
            const slot = $$('.dig-slot:not(.got)', slots)[0];
            await Park.fly(prize, slot, { emoji: '🦴', size: 34, duration: 700 });
            slot.classList.add('got'); prize.textContent = '';
            found++; setReveal(); ctx.good(slot);
            ctx.say(found < bones ? `A bone! ${bones - found} more to go!` : 'That is every bone!');
            if (found === bones) {
              ghost.classList.add('alive'); FX.dinoState(ghostEl, 'roar', 1400); FX.sfx.roar(); FX.celebrate();
              museum[ctx.round - 1] = { s: sp, c: dcol };
              const slotM = mus.children[ctx.round - 1];
              if (slotM) { slotM.innerHTML = FX.dinoHTML(sp, { color: dcol, state: 'happy' }); slotM.classList.add('full'); FX.pop(slotM); }
              mounds.forEach((q) => { if (!q.classList.contains('open')) q.classList.add('relax'); });
              ctx.done(ctx.round === ctx.rounds ? 'Your museum is full of dinosaurs! Roar!' : 'The fossil is a real dinosaur! Roar!', 2400);
            }
          } else if (kind === 'gem') {
            reveal(m, kind); FX.sfx.sparkle(); FX.burst(c.x, c.y, { kind: 'stars', n: 12 }); ctx.say('A sparkly gem! Bonus star!');
            ctx.bonus(1, m, 'Gem!');
          } else if (kind === 'egg') {
            reveal(m, kind); prize.classList.add('wiggle'); FX.sfx.drum(0); ctx.say('A dinosaur egg! It is wobbling…');
            await sleep(900); if (!ctx.alive()) return;
            prize.classList.remove('wiggle'); prize.textContent = '🐣'; FX.sfx.chirp(); FX.burst(c.x, c.y, { kind: 'hearts', n: 8 });
            ctx.say('It hatched! Hello, baby!'); ctx.bonus(1, m, 'Egg!'); ctx.life.visit();
          } else if (kind === 'worm') { reveal(m, kind); prize.classList.add('wiggle'); FX.sfx.boing(); ctx.say('Wiggly worm! He says hello.'); }
          else if (kind === 'beetle') { reveal(m, kind); prize.classList.add('scuttle'); FX.sfx.chirp(); ctx.say('A beetle zooms away!'); }
          else if (kind === 'lizard') { reveal(m, kind); prize.classList.add('scuttle'); FX.sfx.whoosh(); ctx.say('A little lizard dashes off!'); }
          else if (kind === 'rock') { reveal(m, kind); FX.sfx.thud(); ctx.say('Just a rock. Keep looking!'); ctx.bad(.34, m); }
          else { reveal(m, kind); ctx.say('Only dirt here. Try another mound!'); }
          m.classList.remove('busy');
        };
        mounds.push(m); field.append(m);
      });
      ctx.area.append(top, field);
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
  window.Park.register({
    id: 'lotto', name: 'Footprint Match', icon: 'raptor', color: '#d9694f', rounds: 4, helper: 'raptor', ambient: 'meadow',
    desc: 'Whose footprint is it? Drag the dino to match!',
    round(ctx) {
      const shadows = ctx.round === 4, k = [3, 4, 5, 6][ctx.round - 1], set = shuffle(SPECIES).slice(0, k).map((s) => ({ s, c: pick(COLORS) }));
      const FILL = { green: '#91d09c', teal: '#7fd1c7', purple: '#b9a1e6', orange: '#f6b273', pink: '#f5a9c4', blue: '#8cc3ee', yellow: '#f3d56b', red: '#ee8a7c' };
      ctx.say(shadows ? 'Shadows! Which dinosaur makes which shadow?' : 'Whose footprints are these? Drag each dino to its prints!');
      const mud = el('div', 'lot-mud' + (shadows ? ' shadowy' : ''));
      const prints = shuffle(set).map((d, i) => {
        const p = el('div', 'lot-print'); p.dataset.s = d.s; p.style.setProperty('--i', i);
        // Each set of prints has a little trail leading in, and they stomp into the mud one after another.
        p.innerHTML = (shadows
          ? `<span class="lot-shadow">${FX.dinoHTML(d.s, { state: 'idle' })}</span>`
          : `<span class="lot-trail">${'<svg viewBox="0 0 80 80">' + FOOT[d.s] + '</svg>'}<svg viewBox="0 0 80 80">${FOOT[d.s]}</svg></span><svg class="lot-main" viewBox="0 0 80 80" aria-label="Footprint">${FOOT[d.s]}</svg>`) + '<span class="lot-slot"></span>';
        mud.append(p); return p;
      });
      if (!ctx.alive()) return;
      prints.forEach((p, i) => { setTimeout(() => { if (!ctx.alive()) return; FX.sfx.thud(); FX.anim(p, [{ transform: 'translateY(-18px) scale(1.2)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'backwards' }); const c = centreOf(p); FX.burst(c.x, c.y + 10, { kind: 'dust', n: 4, scale: .7 }); }, 250 + i * 260); });
      const pad = el('div', 'lot-dinos');
      let done = 0, selected = null;
      const roarFor = (s) => (s === 'trex' ? FX.sfx.roar : FX.sfx.chirp)();
      // One place-it function for both dragging and tapping.
      const tryPlace = (card, target) => {
        if (!target || target.classList.contains('solved')) return false;
        if (target.dataset.s !== card.dataset.s) {
          ctx.bad(.5, target); FX.shake(target); FX.shake(card);
          const c = centreOf(target); FX.burst(c.x, c.y, { kind: 'drops', n: 5, color: '#8a6a45' });
          ctx.say(shadows ? 'Not that shadow. Look at the shape!' : 'Not those prints. Look at the toes!', 'sad'); return false;
        }
        target.classList.add('solved'); target.style.setProperty('--fill', FILL[card.dataset.c]);
        card.classList.remove('sel', 'dragging'); card.classList.add('locked', 'placed'); card.style.transform = '';
        $('.lot-slot', target).append(card);
        const d = card.firstElementChild; FX.dinoState(d, 'happy'); d.setAttribute('data-base', 'happy');
        ctx.good(target); const c = centreOf(target); FX.burst(c.x, c.y, { kind: 'stars', n: 8 }); roarFor(card.dataset.s);
        const tag = el('b', 'lot-name', SPEC_NAME[card.dataset.s]); target.append(tag); FX.pop(tag);
        ctx.say(`Yes! That is the ${SPEC_NAME[card.dataset.s]}!`);
        if (++done === k) {
          FX.celebrate(); ctx.flutter(3);
          // The whole group does a happy stomp-dance before the round ends.
          $$('.lot-card', pad.parentNode).forEach((x, i) => setTimeout(() => { FX.bounce(x); FX.sfx.drum(i % 3); }, i * 140));
          ctx.done(shadows ? 'You matched every shadow!' : 'You matched every footprint!', 2000);
        }
        return true;
      };
      const cards = shuffle(set).map((d) => {
        const c = el('div', 'lot-card'); c.dataset.s = d.s; c.dataset.c = d.c;
        c.innerHTML = FX.dinoHTML(d.s, { color: d.c, state: 'idle' });
        drag(c, {
          over: (x, y) => prints.forEach((p) => p.classList.toggle('hot', p === hit(prints, x, y) && !p.classList.contains('solved'))),
          drop: (x, y) => tryPlace(c, hit(prints, x, y, 8)),
          tap: () => { cards.forEach((q) => q.classList.remove('sel')); selected = c; c.classList.add('sel'); FX.sfx.tap(); },
        });
        pad.append(c); return c;
      });
      prints.forEach((p) => p.addEventListener('click', () => { if (selected && !selected.classList.contains('locked') && tryPlace(selected, p)) selected = null; }));
      // A magnifying glass points at a pair that belongs together.
      ctx.hint(() => {
        const card = cards.find((q) => !q.classList.contains('locked')); if (!card) return;
        const pr = prints.find((q) => q.dataset.s === card.dataset.s); if (!pr) return;
        const g = el('div', 'lot-lens', '🔍'); pr.append(g); card.classList.add('glow'); FX.sfx.sparkle();
        setTimeout(() => { g.remove(); card.classList.remove('glow'); }, 3000);
      });
      ctx.area.append(mud, pad);
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
  window.Park.register({
    id: 'assemble', name: 'Dino Mixer', icon: 'bronto', color: '#2fa58a', rounds: 4, helper: 'bronto', ambient: 'meadow',
    desc: 'Mix heads and bodies to invent new dinosaurs!',
    round(ctx) {
      const mission = ctx.round < 4, needColour = ctx.round >= 2, memory = ctx.round === 3;
      const names = shuffle(NAMES).slice(0, 5);
      const target = mission ? (() => { const b = pick(SPECIES), h = pick(SPECIES.filter((x) => x !== b)); return { b, h, c: pick(COLORS) }; })() : null;
      const st = { b: SPECIES[rnd(SPECIES.length)], h: null, c: COLORS[rnd(COLORS.length)], name: null, acc: [] };
      st.h = st.b === 'trex' ? 'stego' : 'trex';
      if (mission && st.c === target.c) st.c = COLORS[(COLORS.indexOf(st.c) + 1) % COLORS.length];
      ctx.say(mission ? (memory ? 'Look closely! Then build it from memory.' : 'Can you build the dinosaur in the picture?') : 'Invent your very own dinosaur! Add a hat, then give it a name.');
      const wrap = el('div', 'mix-wrap');
      let tEl = null;
      const label = (t) => `${SPEC_NAME[t.h]} head · ${SPEC_NAME[t.b]} body${needColour ? ' · ' + t.c : ''}`;
      if (mission) {
        tEl = el('div', 'mix-target'); tEl.dataset.b = target.b; tEl.dataset.h = target.h; tEl.dataset.c = target.c;
        tEl.innerHTML = `<small>Build this one!</small><div class="mt-dino">${FX.dinoHTML(target.b, { head: target.h, color: needColour ? target.c : 'blue', state: 'idle' })}</div><span class="mt-txt">${label(target)}</span>`;
        wrap.append(tEl);
        if (memory) {
          const peek = el('button', 'btn small', '👁 Peek again'); peek.hidden = true;
          const hide = () => { tEl.classList.add('hiding'); $('.mt-txt', tEl).textContent = 'Can you remember?'; peek.hidden = false; };
          setTimeout(() => { if (ctx.alive()) hide(); }, 5200);
          peek.onclick = () => { FX.sfx.whoosh(); tEl.classList.remove('hiding'); $('.mt-txt', tEl).textContent = label(target); peek.hidden = true; setTimeout(() => { if (ctx.alive()) hide(); }, 2200); };
          wrap.append(peek);
        }
      }
      const stageEl = el('div', 'mix-stage');
      const draw = (pop) => {
        stageEl.dataset.b = st.b; stageEl.dataset.h = st.h; stageEl.innerHTML = FX.dinoHTML(st.b, { head: st.h, color: st.c, state: 'idle' });
        const d = stageEl.firstElementChild; dress(d, st.acc); if (pop) FX.pop(d);
        $$('.pick', wrap).forEach((b) => b.classList.toggle('on', (b.dataset.kind === 'h' && b.dataset.v === st.h) || (b.dataset.kind === 'b' && b.dataset.v === st.b) || (b.dataset.kind === 'c' && b.dataset.v === st.c) || (b.dataset.kind === 'a' && st.acc.includes(b.dataset.v))));
      };
      stageEl.onclick = () => { const d = stageEl.firstElementChild; FX.dinoState(d, st.h === 'trex' ? 'roar' : 'happy', 900); (st.h === 'trex' ? FX.sfx.roar : FX.sfx.chirp)(); };
      const describe = () => ctx.say(`${SPEC_NAME[st.h]} head on a ${SPEC_NAME[st.b]} body!`);
      const row = (title, cls) => { const r = el('div', 'pick-row ' + cls); r.append(el('b', 'pick-title', title)); const box = el('div', 'pick-box'); r.append(box); return [r, box]; };
      const pickBtn = (box, kind, v, html, label) => {
        const b = el('button', 'pick ' + (kind === 'c' ? 'swatch' : ''), html); b.dataset.kind = kind; b.dataset.v = v; b.setAttribute('aria-label', label);
        if (kind === 'c') b.style.background = COLOUR_HEX[v];
        b.onclick = () => {
          if (kind === 'a') { const i = st.acc.indexOf(v); if (i >= 0) st.acc.splice(i, 1); else st.acc.push(v); FX.sfx.sparkle(); }
          else { st[kind] = v; FX.sfx.pop(); if (kind !== 'c') describe(); }
          draw(true);
        };
        box.append(b); return b;
      };
      const [rowH, boxH] = row('Head', 'ph'), [rowB, boxB] = row('Body', 'pb'), [rowC, boxC] = row('Colour', 'pc');
      SPECIES.forEach((s) => { pickBtn(boxH, 'h', s, `<span class="mini">${FX.dinoHTML(s, { state: 'idle' })}</span>`, SPEC_NAME[s] + ' head'); pickBtn(boxB, 'b', s, `<span class="mini">${FX.dinoHTML(s, { state: 'idle' })}</span>`, SPEC_NAME[s] + ' body'); });
      COLORS.forEach((c) => pickBtn(boxC, 'c', c, '', 'Colour ' + c));
      const picks = el('div', 'mix-picks'); picks.append(rowH, rowB, rowC);
      const dice = el('button', 'mix-btn m-dice', '<span>🎲</span><b>Surprise</b>');
      dice.onclick = () => { st.b = pick(SPECIES); st.h = pick(SPECIES); st.c = pick(COLORS); FX.sfx.sparkle(); draw(true); ctx.say(`Ooh! A ${SPEC_NAME[st.h]} head on a ${SPEC_NAME[st.b]} body!`); const c = centreOf(stageEl); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 }); };
      const nameRow = el('div', 'mix-names');
      if (!mission) {
        const [rowA, boxA] = row('Style', 'pa'); ACCS.forEach((a) => pickBtn(boxA, 'a', a.k, a.e, a.n)); picks.append(rowA);
        names.forEach((n) => { const b = el('button', 'chip', n); b.onclick = () => { st.name = n; $$('.chip', nameRow).forEach((x) => x.classList.toggle('on', x === b)); FX.sfx.tap(); ctx.say(`${n} is a lovely name!`); }; nameRow.append(b); });
      }
      const go = el('button', 'btn big wake', '✨ Wake it up!');
      go.onclick = async () => {
        if (mission && !(st.b === target.b && st.h === target.h && (!needColour || st.c === target.c))) {
          ctx.bad(1, stageEl); FX.shake(stageEl);
          ctx.say(st.b !== target.b || st.h !== target.h ? `Not quite! You need a ${SPEC_NAME[target.h]} head and a ${SPEC_NAME[target.b]} body.` : `Nearly! This one needs to be ${target.c}.`, 'sad'); return;
        }
        if (!mission && !st.name) { ctx.say('Pick a name for your dinosaur first!'); FX.shake(nameRow); return; }
        go.disabled = true; dice.disabled = true; $$('.pick', wrap).forEach((b) => { b.disabled = true; });
        // A flash of light, a roar and then the dinosaur comes to life.
        const zap = el('div', 'mix-zap'); stageEl.append(zap);
        const d = stageEl.firstElementChild; FX.dinoState(d, 'roar', 1100); FX.sfx.roar(); FX.shakeScreen(3);
        const c = centreOf(stageEl); FX.burst(c.x, c.y, { kind: 'sparkle', n: 24 }); FX.celebrate(); ctx.good(stageEl); ctx.flutter(3);
        if (!mission) {
          den.add({ s: st.b, h: st.h, c: st.c, n: st.name }); ctx.say(`${st.name} has moved into your Dino Den!`);
          if (st.acc.length >= 2) ctx.bonus(1, stageEl, 'So fancy!');
          const tag = el('div', 'mix-card', `<b>${st.name}</b><span>${SPEC_NAME[st.h]} head · ${SPEC_NAME[st.b]} body</span>`); stageEl.append(tag); stageEl.classList.add('has-card'); FX.pop(tag);
        }
        await sleep(1200); d.setAttribute('data-base', 'happy'); FX.dinoState(d, 'happy');
        ctx.done(mission ? 'You built it perfectly!' : `Meet ${st.name}!`, 2200);
      };
      // The helper lights up the next thing that is not right yet.
      ctx.hint(() => {
        if (!mission) return;
        const want = st.h !== target.h ? ['h', target.h] : st.b !== target.b ? ['b', target.b] : needColour && st.c !== target.c ? ['c', target.c] : null;
        if (tEl) { tEl.classList.remove('hiding'); }
        const b = want && $$('.pick', wrap).find((x) => x.dataset.kind === want[0] && x.dataset.v === want[1]);
        if (b) { b.classList.add('glow'); FX.sfx.sparkle(); setTimeout(() => b.classList.remove('glow'), 2800); }
      });
      const act = el('div', 'mix-act'); act.append(dice, go);
      wrap.append(stageEl, picks, nameRow, act);
      ctx.area.append(wrap);
      draw();
    },
  });
})();
