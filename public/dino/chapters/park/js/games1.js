/* Dino Park games 1–4: Puzzle, Dig, Footprint Match, Dino Mixer. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, drag, hit, den, NAMES, SPECIES, COLORS, FX } = window.Park;
  const SPEC_NAME = { trex: 'T-rex', tricera: 'Triceratops', stego: 'Stegosaurus', bronto: 'Brontosaurus', raptor: 'Raptor', ptero: 'Pterosaur' };
  window.Park.SPEC_NAME = SPEC_NAME;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ====================================================================== 1. Dino Puzzle */
  function sceneSVG(species, color, uid) {
    const dino = FX.dinoSVG(species, { color }).replace('<svg class="du-dino-svg"', '<svg x="60" y="88" width="236" height="177" class="du-dino-svg"');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270">
      <defs><linearGradient id="sk${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0f2"/><stop offset="1" stop-color="#e9f8d4"/></linearGradient>
      <radialGradient id="sn${uid}"><stop offset="0" stop-color="#fff6c0"/><stop offset="1" stop-color="#ffcf4d"/></radialGradient></defs>
      <rect width="360" height="270" fill="url(#sk${uid})"/>
      <circle cx="300" cy="46" r="40" fill="#ffe27a" opacity=".35"/><circle cx="300" cy="46" r="26" fill="url(#sn${uid})"/>
      <g fill="#fff" opacity=".92"><ellipse cx="70" cy="48" rx="34" ry="12"/><ellipse cx="92" cy="40" rx="22" ry="14"/><ellipse cx="190" cy="30" rx="28" ry="10"/><ellipse cx="206" cy="24" rx="16" ry="10"/></g>
      <path d="M0 170 L50 110 L96 160 L150 96 L210 170 L260 128 L360 190 L360 270 L0 270Z" fill="#9ccfb0"/>
      <path d="M232 190 L276 92 Q298 78 320 92 L360 190Z" fill="#8a5d44"/><path d="M276 92 Q298 104 320 92 Q298 82 276 92Z" fill="#ff7a3d"/><path d="M292 100 q-4 26 -14 52 M304 100 q6 22 16 52" stroke="#ff9b50" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="298" cy="74" r="10" fill="#8b8484" opacity=".5"/><circle cx="306" cy="58" r="14" fill="#8b8484" opacity=".35"/>
      <path d="M0 214 Q90 186 190 212 T360 206 L360 270 L0 270Z" fill="#8fd18f"/><path d="M0 244 Q120 222 240 246 T360 240 L360 270 L0 270Z" fill="#5fb36f"/>
      <path d="M30 262 Q26 210 34 160" stroke="#7a5a3a" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M34 160 Q8 140 0 160 M34 160 Q60 136 76 156 M34 160 Q24 130 8 128 M34 160 Q50 128 66 130" stroke="#3f9a5e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <g class="scene-dino">${dino}</g>
      <circle cx="120" cy="256" r="5" fill="#ff8fb3"/><circle cx="218" cy="258" r="5" fill="#ffd54f"/><circle cx="330" cy="256" r="5" fill="#ff8fb3"/>
    </svg>`;
  }
  const dataUri = (svg) => 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';

  window.Park.register({
    id: 'jigsaw', name: 'Dino Puzzle', icon: 'tricera', color: '#7a6fd1', rounds: 3, helper: 'tricera', ambient: 'meadow',
    desc: 'Drag the pieces to build a picture!',
    round(ctx) {
      const grids = [[2, 2], [3, 2], [3, 3]], [cols, rows] = grids[ctx.round - 1];
      const species = SPECIES.filter((s) => s !== 'ptero'), sp = species[(ctx.round + rnd(3)) % species.length], color = pick(COLORS);
      const uid = Date.now() % 100000;
      const svg = sceneSVG(sp, color, uid), img = dataUri(svg);
      ctx.say(ctx.round === 3 ? 'No hints this time. Build the whole picture!' : 'Drag each piece to its place!');
      const wrap = el('div', 'puz-wrap');
      const board = el('div', 'puz-board'); wrap.style.setProperty('--cols', cols); wrap.style.setProperty('--rows', rows);
      const ghost = el('div', 'puz-ghost'); ghost.style.backgroundImage = img; if (ctx.round === 3) ghost.style.opacity = 0;
      board.append(ghost);
      const slots = [];
      for (let i = 0; i < cols * rows; i++) { const s = el('div', 'puz-slot'); s.dataset.i = i; board.append(s); slots.push(s); }
      const tray = el('div', 'puz-tray');
      let placed = 0, selected = null;
      const place = (p, slot) => {
        if (slot.dataset.i !== p.dataset.i) { ctx.bad(); FX.shake(slot); ctx.say('Hmm, not there. Try another spot!'); return false; }
        if (slot.firstChild) return false;
        p.classList.remove('dragging', 'sel'); p.classList.add('locked', 'placed'); p.style.transform = '';
        slot.append(p); slot.classList.add('filled'); ctx.good();
        const c = centreOf(slot); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 });
        FX.anim(p, [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 300 });
        if (++placed === cols * rows) complete();
        return true;
      };
      const pieces = [];
      for (let i = 0; i < cols * rows; i++) {
        const p = el('div', 'puz-piece'); p.dataset.i = i;
        const c = i % cols, r = Math.floor(i / cols);
        p.style.backgroundImage = img; p.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
        p.style.backgroundPosition = `${cols > 1 ? c / (cols - 1) * 100 : 0}% ${rows > 1 ? r / (rows - 1) * 100 : 0}%`;
        p.setAttribute('role', 'button'); p.setAttribute('aria-label', 'Puzzle piece ' + (i + 1));
        drag(p, {
          over: (x, y) => { const s = hit(slots, x, y); slots.forEach((q) => q.classList.toggle('hot', q === s && !q.firstChild)); },
          drop: (x, y) => { const s = hit(slots, x, y, 10); return s ? place(p, s) : false; },
          tap: () => { pieces.forEach((q) => q.classList.remove('sel')); selected = p; p.classList.add('sel'); },
        });
        pieces.push(p);
      }
      slots.forEach((s) => s.addEventListener('click', () => { if (selected && !s.firstChild && place(selected, s)) selected = null; }));
      shuffle(pieces).forEach((p) => tray.append(p));
      wrap.append(board, tray);
      if (ctx.round === 3) {
        const peek = el('button', 'btn small', '👁 Peek');
        peek.onclick = () => { ghost.style.opacity = .5; setTimeout(() => { ghost.style.opacity = 0; }, 1400); };
        wrap.append(peek);
      }
      ctx.area.append(wrap);
      const complete = async () => {
        await sleep(350);
        if (!ctx.alive()) return;
        board.classList.add('done'); ghost.style.opacity = 0;
        board.innerHTML = `<div class="du-dino puz-live" data-state="happy">${svg.replace('<svg xmlns="http://www.w3.org/2000/svg"', '<svg xmlns="http://www.w3.org/2000/svg" class="live"')}</div>`;
        FX.sfx.roar(); FX.celebrate();
        ctx.done('You built it! Look, the dinosaur is alive!', 2200);
      };
    },
  });

  /* ====================================================================== 2. Dig a Dino */
  window.Park.register({
    id: 'dig', name: 'Dig a Dino', icon: 'stego', color: '#c98b4f', rounds: 3, helper: 'stego', helperColor: 'orange', ambient: 'desert',
    desc: 'Dig up the fossil bones!',
    round(ctx) {
      const bones = [4, 5, 6][ctx.round - 1], sp = SPECIES[(ctx.round * 2 + rnd(2)) % 5], cells = 20;
      const items = shuffle([...Array(bones).fill('bone'), 'worm', 'beetle', 'rock', 'worm', 'rock', ...Array(cells - bones - 5).fill('dirt')]);
      ctx.say('Tap the dirt mounds to dig. Find ' + bones + ' bones!');
      const top = el('div', 'dig-top');
      const ghost = el('div', 'dig-ghost', FX.dinoHTML(sp, { color: pick(COLORS), state: 'idle' }));
      const slots = el('div', 'dig-slots'); for (let i = 0; i < bones; i++) slots.append(el('span', 'dig-slot', '🦴'));
      top.append(ghost, slots);
      const field = el('div', 'dig-field');
      let found = 0;
      const ghostEl = ghost.firstElementChild;
      const setReveal = () => { ghost.style.setProperty('--rev', found / bones); };
      setReveal();
      items.forEach((kind, i) => {
        const m = el('button', 'mound'); m.dataset.kind = kind; m.dataset.i = i; m.setAttribute('aria-label', 'Dirt mound');
        m.innerHTML = '<span class="dome"></span><span class="prize"></span>';
        let hits = 0;
        m.onclick = async () => {
          if (m.classList.contains('open') || m.classList.contains('busy')) return;
          const c = centreOf(m);
          hits++; FX.sfx.thud(); FX.burst(c.x, c.y, { kind: 'dust', n: 6 }); FX.shake(m);
          if (hits < 2) { m.classList.add('cracked'); ctx.say('Keep digging…'); return; }
          m.classList.add('open', 'busy');
          const prize = $('.prize', m);
          if (kind === 'bone') {
            prize.textContent = '🦴'; FX.sfx.star(); FX.burst(c.x, c.y, { kind: 'sparkle', n: 14 });
            await sleep(250);
            const slot = $$('.dig-slot:not(.got)', slots)[0];
            await FX.flyTo(prize, slot, { emoji: '🦴', size: 34, duration: 700 });
            slot.classList.add('got'); prize.textContent = '';
            found++; setReveal(); ctx.good();
            ctx.say(found < bones ? `A bone! ${bones - found} more to go!` : 'That is every bone!');
            if (found === bones) {
              ghost.classList.add('alive'); FX.dinoState(ghostEl, 'roar', 1400); FX.sfx.roar(); FX.celebrate();
              ctx.done('The fossil is a real dinosaur! Roar!', 2300);
            }
          } else if (kind === 'worm') { prize.textContent = '🪱'; prize.classList.add('wiggle'); FX.sfx.boing(); ctx.say('Wiggly worm! He says hello.'); }
          else if (kind === 'beetle') { prize.textContent = '🪲'; prize.classList.add('scuttle'); FX.sfx.chirp(); ctx.say('A beetle zooms away!'); }
          else if (kind === 'rock') { prize.textContent = '🪨'; FX.sfx.thud(); ctx.say('Just a rock. Keep looking!'); ctx.bad(.34); }
          else { prize.textContent = '✨'; ctx.say('Only dirt here. Try another mound!'); }
          m.classList.remove('busy');
        };
        field.append(m);
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
    id: 'lotto', name: 'Footprint Match', icon: 'raptor', color: '#d9694f', rounds: 3, helper: 'raptor', ambient: 'meadow',
    desc: 'Whose footprint is it? Drag the dino to match!',
    round(ctx) {
      const k = [3, 4, 5][ctx.round - 1], set = shuffle(SPECIES).slice(0, k).map((s) => ({ s, c: pick(COLORS) }));
      const FILL = { green: '#91d09c', teal: '#7fd1c7', purple: '#b9a1e6', orange: '#f6b273', pink: '#f5a9c4', blue: '#8cc3ee', yellow: '#f3d56b', red: '#ee8a7c' };
      ctx.say('Whose footprints are these? Drag each dino to its prints!');
      const mud = el('div', 'lot-mud');
      const prints = shuffle(set).map((d) => {
        const p = el('div', 'lot-print'); p.dataset.s = d.s;
        p.innerHTML = '<svg viewBox="0 0 80 80" aria-label="Footprint">' + FOOT[d.s] + '</svg><span class="lot-slot"></span>';
        mud.append(p); return p;
      });
      const pad = el('div', 'lot-dinos');
      let done = 0, selected = null;
      // One place-it function for both dragging and tapping.
      const tryPlace = (card, target) => {
        if (!target || target.classList.contains('solved')) return false;
        if (target.dataset.s !== card.dataset.s) { ctx.bad(); FX.shake(target); ctx.say('Not those prints. Look at the toes!', 'sad'); return false; }
        target.classList.add('solved'); target.style.setProperty('--fill', FILL[card.dataset.c]);
        card.classList.remove('sel', 'dragging'); card.classList.add('locked', 'placed'); card.style.transform = '';
        $('.lot-slot', target).append(card);
        const d = card.firstElementChild; FX.dinoState(d, 'happy'); d.setAttribute('data-base', 'happy');
        ctx.good(); const c = centreOf(target); FX.burst(c.x, c.y, { kind: 'stars', n: 8 }); FX.sfx.chirp();
        if (++done === k) { FX.celebrate(); ctx.done('You matched every footprint!', 1800); }
        return true;
      };
      const cards = shuffle(set).map((d) => {
        const c = el('div', 'lot-card'); c.dataset.s = d.s; c.dataset.c = d.c;
        c.innerHTML = FX.dinoHTML(d.s, { color: d.c, state: 'idle' });
        drag(c, {
          over: (x, y) => prints.forEach((p) => p.classList.toggle('hot', p === hit(prints, x, y) && !p.classList.contains('solved'))),
          drop: (x, y) => tryPlace(c, hit(prints, x, y, 8)),
          tap: () => { cards.forEach((q) => q.classList.remove('sel')); selected = c; c.classList.add('sel'); },
        });
        pad.append(c); return c;
      });
      prints.forEach((p) => p.addEventListener('click', () => { if (selected && !selected.classList.contains('locked') && tryPlace(selected, p)) selected = null; }));
      ctx.area.append(mud, pad);
    },
  });

  /* ====================================================================== 4. Dino Mixer */
  window.Park.register({
    id: 'assemble', name: 'Dino Mixer', icon: 'bronto', color: '#2fa58a', rounds: 4, helper: 'bronto', ambient: 'meadow',
    desc: 'Mix heads and bodies to invent new dinosaurs!',
    round(ctx) {
      const mission = ctx.round < 4;
      const names = shuffle(NAMES).slice(0, 4);
      const target = mission ? (() => { const b = pick(SPECIES), h = pick(SPECIES.filter((x) => x !== b)); return { b, h }; })() : null;
      const st = { b: SPECIES[rnd(SPECIES.length)], h: null, c: COLORS[rnd(COLORS.length)], name: null };
      st.h = st.b === 'trex' ? 'stego' : 'trex';
      ctx.say(mission ? 'Can you build the dinosaur in the picture?' : 'Invent your very own dinosaur, then give it a name!');
      const wrap = el('div', 'mix-wrap');
      if (mission) {
        const t = el('div', 'mix-target'); t.dataset.b = target.b; t.dataset.h = target.h;
        t.innerHTML = `<small>Build this one!</small><div class="mt-dino">${FX.dinoHTML(target.b, { head: target.h, color: 'blue', state: 'idle' })}</div><span>${SPEC_NAME[target.h]} head<br>${SPEC_NAME[target.b]} body</span>`;
        wrap.append(t);
      }
      const stageEl = el('div', 'mix-stage');
      const draw = () => { stageEl.dataset.b = st.b; stageEl.dataset.h = st.h; stageEl.innerHTML = FX.dinoHTML(st.b, { head: st.h, color: st.c, state: 'idle' }); FX.pop(stageEl.firstElementChild); };
      const ctrls = el('div', 'mix-ctrls');
      const cyc = (key, list) => () => { const i = list.indexOf(st[key]); st[key] = list[(i + 1) % list.length]; FX.sfx.pop(); draw(); if (key !== 'c') ctx.say(`${SPEC_NAME[st.h]} head on a ${SPEC_NAME[st.b]} body!`); };
      const mk = (cls, icon, label, fn) => { const b = el('button', 'mix-btn ' + cls, `<span>${icon}</span><b>${label}</b>`); b.onclick = fn; ctrls.append(b); return b; };
      mk('m-head', '🎭', 'Head', cyc('h', SPECIES));
      mk('m-body', '🦴', 'Body', cyc('b', SPECIES));
      mk('m-col', '🎨', 'Colour', cyc('c', COLORS));
      mk('m-dice', '🎲', 'Surprise', () => { st.b = pick(SPECIES); st.h = pick(SPECIES); st.c = pick(COLORS); FX.sfx.sparkle(); draw(); ctx.say(`Ooh! A ${SPEC_NAME[st.h]} head on a ${SPEC_NAME[st.b]} body!`); });
      const nameRow = el('div', 'mix-names');
      if (!mission) names.forEach((n) => { const b = el('button', 'chip', n); b.onclick = () => { st.name = n; $$('.chip', nameRow).forEach((x) => x.classList.toggle('on', x === b)); FX.sfx.tap(); }; nameRow.append(b); });
      const go = el('button', 'btn big wake', '✨ Wake it up!');
      go.onclick = async () => {
        if (mission && !(st.b === target.b && st.h === target.h)) { ctx.bad(); FX.shake(stageEl); ctx.say(`Not quite! You need a ${SPEC_NAME[target.h]} head and a ${SPEC_NAME[target.b]} body.`, 'sad'); return; }
        if (!mission && !st.name) { ctx.say('Pick a name for your dinosaur first!'); FX.shake(nameRow); return; }
        go.disabled = true; ctrls.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        const d = stageEl.firstElementChild; FX.dinoState(d, 'roar', 1100); FX.sfx.roar(); FX.shakeScreen(3);
        const c = centreOf(stageEl); FX.burst(c.x, c.y, { kind: 'sparkle', n: 24 }); FX.celebrate();
        if (!mission) { den.add({ s: st.b, h: st.h, c: st.c, n: st.name }); ctx.say(`${st.name} has moved into your Dino Den!`); }
        await sleep(1200); d.setAttribute('data-base', 'happy'); FX.dinoState(d, 'happy');
        ctx.done(mission ? 'You built it perfectly!' : `Meet ${st.name}!`, 2000);
      };
      wrap.append(stageEl, ctrls, nameRow, go);
      ctx.area.append(wrap);
      draw();
    },
  });
})();
