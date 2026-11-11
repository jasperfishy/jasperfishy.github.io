/* Dino Park games 5–8: Memory, Size Parade, Counting, Dot-to-Dot. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, drag, hit, store, NAMES, SPECIES, COLORS, FX } = window.Park;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  /* Personal records live under hyphenated keys so the hub's /^dino_[a-z]+$/ star count never sees them. */
  const rec = {
    get: (k) => { const v = store.get('dino_x-rec-' + k, null); return typeof v === 'number' && isFinite(v) ? v : null; },
    hi(k, v) { const o = rec.get(k); if (o === null || v > o) { store.set('dino_x-rec-' + k, Math.round(v * 10) / 10); return true; } return false; },
    lo(k, v) { const o = rec.get(k); if (o === null || v < o) { store.set('dino_x-rec-' + k, Math.round(v * 10) / 10); return true; } return false; },
  };
  const ribbon = (html, bg) => { const r = el('div', 'col-goal', html); if (bg) r.style.background = bg; FX.pop(r); return r; };
  const recordBar = (txt) => ribbon('🏆 ' + txt, 'linear-gradient(90deg,#fdf1d4,#f6e2ae)');
  /* A few collectible stars drift in when the child does something wonderful. */
  const cheer = (n) => { if (window.DUWONDER && DUWONDER.mote) DUWONDER.mote(n); };

  /* ---------- premium furniture, shared by the four games in this file ---------- */
  /* The status strip every board hangs under: level, what is on it, your best, your collection. */
  function statusBar(bits, color) {
    const bar = el('div', 'du-bar');
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;font-weight:900;font-size:14px;color:#fff;background:linear-gradient(90deg,' + color + ',color-mix(in srgb,' + color + ' 55%,#fff));border-radius:16px;padding:5px 12px;box-shadow:0 4px 0 rgba(0,0,0,.16);position:relative;z-index:3';
    bits.forEach((t, i) => bar.append(el(i === 0 ? 'b' : 'span', 'du-bar-' + i, t)));
    return bar;
  }
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
  /* A post-win "keep going" invitation that can never wedge a round: if the child wanders off it closes itself. */
  function keepGoing(ctx, title, sub, label, color, build) {
    return new Promise((res) => {
      const card = el('div', 'du-keep');
      card.style.cssText = 'position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:60;display:flex;flex-direction:column;align-items:center;gap:8px;width:min(92vw,470px);background:#fffaf0;border:4px solid #ffcf33;border-radius:24px;padding:14px 18px 16px;box-shadow:0 10px 0 rgba(0,0,0,.22);text-align:center';
      card.innerHTML = '<b style="font-size:24px">' + title + '</b><span style="font-weight:800;font-size:15px;opacity:.8">' + sub + '</span>';
      const row = el('div'); row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center';
      const yes = el('button', 'btn', '✨ ' + label), no = el('button', 'btn ghost', 'No, I did enough!');
      row.append(yes, no); card.append(row);
      $('#game').append(card); FX.pop(card); FX.sfx.coin();
      let closed = false, started = false, timer = 0;
      const close = (v) => { if (closed) return; closed = true; clearTimeout(timer); clearInterval(watch); card.remove(); res(v); };
      const watch = setInterval(() => { if (!ctx.alive()) close(false); }, 1200);
      no.onclick = () => { FX.sfx.tap(); close(false); };
      yes.onclick = () => {
        if (started) return; started = true;
        row.remove(); FX.sfx.whoosh();
        const box = el('div'); box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;width:100%';
        card.append(box); build(box, () => close(true));
      };
      timer = setTimeout(() => close(started), started ? 40000 : 8000);
    });
  }

  /* ====================================================================== 5. Dino Memory */
  /* The "keep going" bonus: a tiny all-golden board that pays a big sparkle. */
  function bonusBoard(ctx, host, done) {
    const two = shuffle(SPECIES).slice(0, 2), deck = shuffle([...two, ...two]);
    host.innerHTML = '<p style="margin:0;font-weight:800;font-size:14px">Four cards, both pairs golden! +2⭐</p>';
    const found = el('div', 'bm-found'), grid = el('div', 'bm-grid');
    two.forEach((s) => { const f = el('span', 'bm-slot'); f.dataset.k = s; f.innerHTML = '<i>🥇</i>'; found.append(f); });
    let first = null, locked = true, got = 0;
    deck.forEach((s) => {
      const b = el('button', 'bm-card flipped');
      b.dataset.k = s; b.setAttribute('aria-label', 'Golden card');
      b.innerHTML = `<span class="mc-inner"><span class="mc-face mc-back"><i></i><i></i><i></i><em>⭐</em></span><span class="mc-face mc-front">${FX.dinoHTML(s, { color: COLORS[SPECIES.indexOf(s) % COLORS.length], state: 'happy' })}</span></span>`;
      b.onclick = async () => {
        if (locked || b.classList.contains('flipped') || b.classList.contains('matched')) return;
        b.classList.add('flipped'); FX.sfx.pop();
        if (!first) { first = b; return; }
        const a = first; first = null; locked = true;
        await sleep(480); if (!ctx.alive()) return;
        if (a.dataset.k === b.dataset.k) {
          [a, b].forEach((x) => { x.classList.add('matched'); x.classList.remove('flipped'); });
          const slot = [...found.children].find((q) => q.dataset.k === a.dataset.k && !q.classList.contains('got'));
          if (slot) { slot.classList.add('got'); slot.innerHTML = FX.dinoHTML(a.dataset.k, { color: COLORS[SPECIES.indexOf(a.dataset.k) % COLORS.length], state: 'happy' }); FX.pop(slot); }
          ctx.good(b); FX.sfx.coin();
          if (++got === 2) { ctx.bonus(2, grid, 'Golden board!'); FX.celebrate(); await sleep(950); if (ctx.alive()) done(); return; }
          locked = false;
        } else {
          ctx.bad(.34, b); FX.shake(a); FX.shake(b); FX.sfx.bad();
          ctx.say('Not a pair — look at the two pictures again!');
          await sleep(650); if (!ctx.alive()) return;
          a.classList.remove('flipped'); b.classList.remove('flipped'); locked = false;
        }
      };
      grid.append(b);
    });
    host.append(found, grid);
    setTimeout(() => { if (ctx.alive()) $$('.bm-card', grid).forEach((c) => c.classList.remove('flipped')); }, 1500);
  }

  window.Park.register({
    id: 'memory', name: 'Dino Memory', icon: 'trex', color: '#e08a2e', rounds: 5, helper: 'trex', ambient: 'meadow',
    desc: 'Remember where the dinosaurs hide!',
    round(ctx) {
      const pairs = [3, 4, 6, 8, 10][ctx.round - 1], peek = [2600, 2400, 3000, 3600, 4200][ctx.round - 1], mixUp = ctx.round >= 3, maxMix = ctx.round === 5 ? 2 : 1;
      const SP = { trex: 'T-rex', tricera: 'Triceratops', stego: 'Stegosaurus', bronto: 'Brontosaurus', raptor: 'Raptor', ptero: 'Pterosaur' };
      // Each card front gets a soft colour wash of its dinosaur colour, so pairs read differently at a glance.
      const TINT = { green: '#f0fbe8', teal: '#e6fafa', purple: '#f2e9fd', orange: '#fdf0e0', pink: '#fdeaf2', blue: '#e8f1fd', yellow: '#fef8dd', red: '#fceaea' };
      // The board only uses species that have a trophy-case slot, so every match stamps the shelf.
      const caseIds = SPECIES.slice(0, Math.min(SPECIES.length, 2 + ctx.round));
      const combos = shuffle(caseIds.flatMap((s) => shuffle(COLORS).slice(0, 2).map((c) => ({ s, c })))).slice(0, pairs);
      combos[rnd(pairs)].star = true;      // one golden pair hides extra sparkles
      const deck = shuffle([...combos, ...combos].map((d, i) => ({ ...d, k: d.s + d.c, id: i })));
      ctx.say('Look carefully! Remember where each dinosaur hides. One pair is golden!');
      const best = rec.get('memory' + pairs);
      ctx.area.append(recordBar(best === null ? `Find ${pairs} pairs to set your first Memory record!` : `Your best for ${pairs} pairs is <b>${best}</b> tries. Beat it!`));
      /* The trophy case: every dinosaur species you have ever matched keeps a place on it, for good. */
      const caseV = ledger('memory-case'), caseMap = caseV.all();
      const caseArt = (s, id) => { s.innerHTML = FX.dinoHTML(id, { color: COLORS[SPECIES.indexOf(id) % COLORS.length], state: 'happy' }); };
      const mmCase = collectRow('mm-case', 'sp', caseIds, caseMap, '<i>❔</i>', caseArt);
      const head = statusBar([`Level ${ctx.round}`, `${pairs} pairs · ${pairs * 2} cards`,
        best === null ? 'No record yet' : `Best ${best} tries`, `Trophy case ${mmCase.dataset.got}/${caseIds.length}`], '#e08a2e');
      ctx.area.append(head, mmCase);
      const caseBit = $('.du-bar-3', head);
      const wrap = el('div', 'mem-wrap');
      const found = el('div', 'mem-found');
      for (let i = 0; i < pairs; i++) found.append(el('span', 'mf-slot', '<i>🥚</i>'));
      const bar = el('div', 'mem-timer', '<i></i><b>Remember!</b>');
      const grid = el('div', 'mem-grid'); grid.style.setProperty('--cols', pairs === 3 ? 3 : pairs >= 8 ? 5 : 4);
      let first = null, locked = true, matched = 0, combo = 0, tries = 0, slips = 0, mixes = 0, taught = false;
      const cards = deck.map((d, ci) => {
        const b = el('button', 'mem-card flipped');
        b.dataset.k = d.k; b.dataset.s = d.s; b.dataset.c = d.c; b.dataset.star = d.star ? '1' : ''; b.setAttribute('aria-label', 'Hidden dinosaur card');
        b.innerHTML = `<span class="mc-inner"><span class="mc-face mc-back" style="${d.star ? 'background:radial-gradient(circle at 50% 34%,#fff3c0,#e0a42a 78%)' : ''}"><i></i><i></i><i></i><em>${d.star ? '⭐' : '🐾'}</em></span><span class="mc-face mc-front" style="background:radial-gradient(circle at 50% 38%,${TINT[d.c] || '#fff'},#ffffff 78%)">${FX.dinoHTML(d.s, { color: d.c, state: 'idle' })}</span></span>`;
        b.onclick = async () => {
          if (locked || b.classList.contains('flipped') || b.classList.contains('matched')) return;
          b.classList.add('flipped'); FX.sfx.pop(); FX.sfx.note(b.dataset.s === 'trex' ? 0 : SPECIES.indexOf(b.dataset.s) * 2 + 2, .12);
          if (!first) { first = b; return; }
          const a = first; first = null; locked = true; tries++;
          await sleep(520);
          if (!ctx.alive()) return;
          if (a.dataset.k === b.dataset.k) {
            combo++; matched++;
            [a, b].forEach((x) => { x.classList.add('matched'); FX.dinoState(x.querySelector('.du-dino'), 'happy'); });
            ctx.good(b);
            const c = centreOf(b); FX.burst(c.x, c.y, { kind: 'hearts', n: 8 }); if (combo > 1) FX.floatText(c.x, c.y - 30, combo + ' in a row!');
            (a.dataset.s === 'trex' ? FX.sfx.roar : FX.sfx.chirp)();
            if (a.dataset.star === '1') { FX.sfx.coin(); ctx.bonus(2, b, 'Golden pair!'); FX.burst(c.x, c.y, { kind: 'stars', n: 16 }); }
            // The pair flies up into the "found" row with its name.
            const slot = found.children[matched - 1];
            if (slot) { await Park.fly(b, slot, { emoji: '⭐', size: 30, duration: 600, burst: false }); slot.classList.add('got'); slot.innerHTML = `${FX.dinoHTML(a.dataset.s, { color: a.dataset.c, state: 'happy' })}<small>${SP[a.dataset.s]}</small>`; FX.pop(slot); }
            ctx.say(combo > 1 ? `${combo} in a row! You are amazing!` : `A match! That is the ${SP[a.dataset.s]}!`);
            // A species you have never met before takes a permanent place in the trophy case.
            if (caseV.set(a.dataset.s, ctx.round) && stampInto(mmCase, caseArt, a.dataset.s, ctx.round, 'New trophy!')) {
              if (caseBit) caseBit.textContent = `Trophy case ${mmCase.dataset.got}/${caseIds.length}`;
              ctx.say(`${SP[a.dataset.s]} joins your trophy case for good — ${mmCase.dataset.got} of ${caseIds.length} dinosaurs found!`);
              if (mmCase.classList.contains('full')) { ctx.bonus(2, mmCase, 'Case complete!'); cheer(2); }
            }
            if (matched === pairs) {
              FX.celebrate(); ctx.flutter(4);
              if (tries <= pairs) ctx.bonus(2, grid, 'Super memory!'); else if (tries <= pairs + 2) ctx.bonus(1, grid, 'Great memory!');
              const fresh = rec.lo('memory' + pairs, tries);
              if (fresh) { ctx.bonus(2, grid, 'Best ever!'); cheer(2); }
              const line = `${tries} ${tries === 1 ? 'try' : 'tries'} for ${pairs} pairs!` + (fresh ? ' A brand-new record!' : '');
              const last = ctx.round === ctx.rounds;
              if (last && await keepGoing(ctx, 'Keep going?', 'A tiny golden board, two pairs, just for fun.', 'One more board!', '#e08a2e', (host2, fin) => bonusBoard(ctx, host2, fin))) {
                ctx.done(line + ' And the golden board too!', 2100); return;
              }
              ctx.done(line, 2100); return;
            }
            // Later rounds: the hidden dinosaurs swap places, twice at the top level.
            if (mixUp && mixes < maxMix && matched >= Math.ceil(pairs * (mixes + 1) / (maxMix + 1))) { mixes++; await sleep(300); await mixRemaining(); }
            locked = false;
          } else {
            combo = 0; slips++; FX.shake(a); FX.shake(b); FX.sfx.bad();
            if (slips < 2 || taught) { ctx.bad(.34, b); ctx.say('Not a match. Remember where they are!'); }
            else {
              // No scolding: the board offers a second peek instead.
              taught = true; ctx.bad(.16, b); ctx.say('Nearly! Let us look at your friends one more time.');
              const rem = cards.filter((x) => !x.classList.contains('matched'));
              rem.forEach((x) => x.classList.add('flipped')); FX.sfx.sparkle();
              await sleep(1200); if (!ctx.alive()) return;
              rem.forEach((x) => x.classList.remove('flipped'));
            }
            await sleep(750);
            if (!ctx.alive()) return;
            a.classList.remove('flipped'); b.classList.remove('flipped'); FX.sfx.tap();
            locked = false;
          }
        };
        grid.append(b); return b;
      });
      // The face-down dinosaurs shuffle places while the child watches.
      async function mixRemaining() {
        const rem = cards.filter((c) => !c.classList.contains('matched'));
        if (rem.length < 3) return;
        ctx.say('Mix-up! The dinosaurs are swapping places!');
        FX.sfx.whoosh(); FX.shakeScreen(2);
        const before = rem.map((c) => c.getBoundingClientRect());
        const dom = [...grid.children], idx = dom.map((c, i) => (c.classList.contains('matched') ? -1 : i)).filter((i) => i >= 0), order = shuffle(rem), next = dom.slice();
        idx.forEach((di, k) => { next[di] = order[k]; });
        next.forEach((c) => grid.append(c));
        rem.forEach((c, i) => { const a = before[i], n = c.getBoundingClientRect(); FX.anim(c, [{ transform: `translate(${a.left - n.left}px,${a.top - n.top}px) rotate(${rnd(30) - 15}deg)` }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.3,.9,.4,1.15)' }); });
        await sleep(950);
        if (ctx.alive()) ctx.say('Now where is each one hiding?');
      }
      // After two slips the helper peeks at a pair for a moment — free, as many times as you like.
      const showMe = () => {
        const left = cards.filter((c) => !c.classList.contains('matched') && !c.classList.contains('flipped')); if (left.length < 2 || locked) return;
        const k = left[0].dataset.k, pair = left.filter((c) => c.dataset.k === k).slice(0, 2);
        pair.forEach((c) => c.classList.add('hint'));
        setTimeout(() => pair.forEach((c) => c.classList.remove('hint')), 1600);
        pair.forEach((c) => c.classList.add('flipped')); FX.sfx.sparkle();
        ctx.say(`This ${SP[pair[0].dataset.s]} has a twin — one of these two holds it!`);
        setTimeout(() => pair.forEach((c) => { if (!c.classList.contains('matched') && c !== first) c.classList.remove('flipped'); }), 1100);
      };
      ctx.hint(showMe);
      head.append(helpBtn(showMe));
      wrap.append(found, bar, grid); ctx.area.append(wrap);
      cards.forEach((c, i) => FX.anim(c, [{ opacity: 0, transform: 'translateY(-30px) rotate(-12deg) scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i * 60, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'backwards' }));
      (async () => {
        await sleep(300 + cards.length * 60);
        const fill = $('i', bar); fill.style.transition = `width ${peek}ms linear`; fill.style.width = '100%'; requestAnimationFrame(() => { fill.style.width = '0%'; });
        await sleep(peek);
        if (!ctx.alive()) return;
        bar.classList.add('off');
        cards.forEach((c, i) => setTimeout(() => c.classList.remove('flipped'), i * 70)); FX.sfx.whoosh();
        ctx.say('Now find the matching pairs!');
        await sleep(450 + cards.length * 70);
        locked = false;
      })();
    },
  });

  /* ====================================================================== 6. Size Parade */
  const SIZE_WORDS = { 3: ['Small', 'Medium', 'Big'], 4: ['Tiny', 'Small', 'Big', 'Huge'], 5: ['Tiny', 'Small', 'Medium', 'Big', 'Huge'] };
  const FLOATS = ['🎈', '🥁', '🎺', '🎠', '🎉'];
  /* The "keep going" bonus: three (or more) fresh friends who have to find their place in a longer line. */
  function bonusLine(ctx, host, done) {
    const n = Math.min(6, 2 + ctx.round);
    const base = [54, 72, 92, 114, 138, 164].slice(0, n), fit = Math.min(1, (340) / (base.reduce((a, b) => a + b, 0) + n * 16));
    const sizes = base.map((b) => Math.round(b * Math.max(.42, fit)));
    const sp = pick(SPECIES.filter((s) => s !== 'ptero')), col = pick(COLORS);
    host.innerHTML = `<p style="margin:0;font-weight:800;font-size:14px">${n} more friends want a place in the parade!</p>`;
    const line = el('div', 'spn-line'), tray = el('div', 'spn-tray');
    let placed = 0, sel = null;
    const slots = sizes.map((sz) => {
      const s = el('div', 'spn-slot'); s.dataset.size = sz; s.style.width = (sz + 14) + 'px'; s.style.height = (Math.round(sz * .8) + 18) + 'px';
      s.innerHTML = `<span class="ghost" style="width:${sz}px">${FX.dinoHTML(sp, { color: 'blue', state: 'idle' })}</span>`;
      line.append(s); return s;
    });
    const put = (d, slot) => {
      if (!slot || slot.querySelector('.spn-dino')) return false;
      const sz = Number(d.dataset.size);
      if (Number(slot.dataset.size) !== sz) {
        ctx.bad(.4, slot); FX.shake(slot); FX.sfx.scrape();
        const want = slots.find((q) => Number(q.dataset.size) === sz && !q.querySelector('.spn-dino'));
        if (want) { FX.pulse(want); want.classList.add('hint'); setTimeout(() => want.classList.remove('hint'), 1600); }
        ctx.say(want ? 'Feel the heights! This one is taller — the glowing spot is its size.' : 'That float is taken — try the next one!');
        return false;
      }
      d.classList.add('locked'); d.style.transform = ''; slot.append(d); slot.classList.add('filled');
      d.classList.remove('sel', 'hint'); ctx.good(slot); FX.sfx.boing();
      if (++placed === n) { ctx.bonus(2, line, 'Longer parade!'); FX.celebrate(); setTimeout(done, 1000); }
      return true;
    };
    shuffle(sizes).forEach((sz) => {
      const d = el('div', 'spn-dino'); d.dataset.size = sz; d.style.width = sz + 'px';
      d.innerHTML = FX.dinoHTML(sp, { color: col, state: 'idle' });
      drag(d, {
        over: (x, y) => slots.forEach((s) => s.classList.toggle('hot', s === hit(slots, x, y) && !s.querySelector('.spn-dino'))),
        drop: (x, y) => put(d, hit(slots, x, y, 6)),
        tap: () => { $$('.spn-dino', tray).forEach((q) => q.classList.remove('sel')); sel = d; d.classList.add('sel'); FX.sfx.tap(); },
      });
      tray.append(d);
    });
    slots.forEach((s) => s.addEventListener('click', () => { if (sel && !s.querySelector('.spn-dino') && put(sel, s)) sel = null; }));
    host.append(line, tray);
  }
  window.Park.register({
    id: 'sort', name: 'Size Parade', icon: 'bronto', color: '#3d9bd6', rounds: 5, helper: 'bronto', helperColor: 'blue', ambient: 'meadow',
    desc: 'Put the dinosaurs in a line, smallest to biggest!',
    round(ctx) {
      const R = ctx.round, k = [3, 4, 5, 5, 5][R - 1], desc = R >= 3, blind = R === 4, mixed = R === 5;
      const sp = pick(SPECIES.filter((s) => s !== 'ptero')), col = pick(COLORS);
      // The top level lines up five different species, so size alone has to carry the answer.
      const spList = mixed ? shuffle(SPECIES.filter((s) => s !== 'ptero')).slice(0, k) : Array(k).fill(sp);
      const colList = Array.from({ length: k }, (_, i) => COLORS[(COLORS.indexOf(col) + i * 2) % COLORS.length]);
      // Shrink everything a little on narrow screens so the whole line always fits, and keep the steps visibly different.
      const base = (mixed ? [62, 78, 95, 113, 132] : [58, 82, 108, 134, 160]).slice(0, k);
      const fit = Math.min(1.3, Math.max(.5, (ctx.area.clientWidth - 56) / (base.reduce((a, b) => a + b, 0) + k * 38)));
      const sizes = []; base.forEach((b) => sizes.push(Math.round(Math.max(b * fit, (sizes.length ? sizes[sizes.length - 1] : 0) + 10))));
      const words = SIZE_WORDS[k];
      ctx.say(blind ? 'No guide this time! The BIGGEST goes first!' : mixed ? 'Five different friends, no repeats. Biggest first!' : desc ? 'This time the BIGGEST goes first!' : 'Smallest first! Drag them into the line.');
      const best = rec.get('sort' + k);
      ctx.area.append(recordBar(best === null ? `Line up ${k} dinosaurs with as few mix-ups as you can!` : `Your best line of ${k}: <b>${best}</b> mix-up${best === 1 ? '' : 's'}. Beat it!`));
      /* The float shelf: every parade you march leaves a decorated float on it for good. */
      const floatV = ledger('sort-floats'), floatMap = floatV.all();
      const floatIds = Array.from({ length: ctx.rounds }, (_, i) => String(i + 1));
      const floatArt = (s, id) => { s.innerHTML = `<i>${FLOATS[Number(id) % FLOATS.length]}</i><small>L${id}</small>`; };
      const shelf = collectRow('sp-shelf', 'lvl', floatIds, floatMap, '<i>🎪</i>', floatArt);
      const head = statusBar([`Level ${R}`, `${k} dinosaurs`, best === null ? 'No record yet' : `Best ${best} mix-ups`, `Floats ${shelf.dataset.got}/${ctx.rounds}`], '#3d9bd6');
      const floatBit = $('.du-bar-3', head);
      ctx.area.append(head, shelf);
      const line = el('div', 'par-line');
      const order = desc ? [...sizes].reverse() : sizes;
      const slots = order.map((sz, i) => {
        const s = el('div', 'par-slot'); s.dataset.size = sz; s.style.width = (sz + 22) + 'px'; s.style.height = (Math.round(sz * .78) + 30) + 'px';
        s.innerHTML = `<b>${i + 1}</b>` + (!blind ? `<span class="ghost" style="width:${sz}px">${FX.dinoHTML(spList[sizes.indexOf(sz)], { color: 'blue', state: 'idle' })}</span>` : '');
        line.append(s); return s;
      });
      const guide = el('div', 'par-guide', desc ? '<span>BIG</span><i>➜</i><span>small</span>' : '<span>small</span><i>➜</i><span>BIG</span>');
      const tray = el('div', 'par-tray');
      let done = 0, slips = 0;
      const dinos = [];
      shuffle(sizes.map((sz, i) => ({ sz, i }))).forEach(({ sz, i }) => {
        const d = el('div', 'par-dino'); d.dataset.size = sz; d.style.width = sz + 'px';
        d.innerHTML = FX.dinoHTML(spList[i], { color: colList[i], state: 'idle' });
        const place = (slot) => {
          if (!slot || slot.firstElementChild && slot.querySelector('.par-dino')) return false;
          if (Number(slot.dataset.size) !== sz) {
            slips++; ctx.bad(.4, slot); FX.shake(slot); FX.sfx.scrape();
            // Teach instead of scolding: light up the spot this dinosaur really belongs to.
            const want = slots.find((q) => Number(q.dataset.size) === sz && !q.querySelector('.par-dino'));
            if (want) { FX.pulse(want); want.classList.add('hint'); setTimeout(() => want.classList.remove('hint'), 1800); }
            ctx.say(want ? 'So close! See the glowing spot? That one is your dinosaur\u2019s size!' : 'That spot is taken. Try another one!');
            return false;
          }
          d.classList.add('locked', 'placed'); d.classList.remove('sel', 'hint'); d.style.transform = ''; slot.append(d); slot.classList.add('filled');
          ctx.good(slot); const c = centreOf(slot); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 }); FX.sfx.boing();
          // Bigger dinosaurs land with a deeper stomp.
          const rank = sizes.indexOf(sz);
          FX.tone && FX.tone(220 - rank * 28, .2, 'sine', .2, 0, 70); FX.burst(c.x, c.y + sz * .3, { kind: 'dust', n: 3 + rank * 2, scale: .7 + rank * .15 }); if (rank >= 3) FX.shakeScreen(rank);
          const lbl = el('em', 'par-word', words[sizes.indexOf(sz)]); slot.append(lbl); FX.pop(lbl);
          ctx.say(`${words[sizes.indexOf(sz)]}! ${k - done - 1 > 0 ? `${k - done - 1} to go.` : ''}`);
          if (++done === k) quiz();
          return true;
        };
        drag(d, {
          over: (x, y) => slots.forEach((s) => s.classList.toggle('hot', s === hit(slots, x, y) && !s.querySelector('.par-dino'))),
          drop: (x, y) => place(hit(slots, x, y, 6)),
          tap: () => { $$('.par-dino', tray).forEach((q) => q.classList.remove('sel')); d.classList.add('sel'); tray._sel = { d, place }; FX.sfx.tap(); },
        });
        dinos.push({ d, place, sz }); tray.append(d);
      });
      slots.forEach((s) => s.addEventListener('click', () => { const sel = tray._sel; if (sel && !sel.d.classList.contains('locked') && sel.place(s)) tray._sel = null; }));
      const showMe = () => {
        // Glow the next dinosaur that fits the first empty spot — free, as many times as you like.
        const s = slots.find((q) => !q.querySelector('.par-dino')); if (!s) return;
        const want = dinos.find((x) => x.sz === Number(s.dataset.size) && !x.d.classList.contains('locked')); if (!want) return;
        s.classList.add('hint'); want.d.classList.add('hint'); FX.sfx.sparkle();
        ctx.say(`Spot ${slots.indexOf(s) + 1} wants this one — the glowing dinosaur is its size!`);
        setTimeout(() => { s.classList.remove('hint'); want.d.classList.remove('hint'); }, 2800);
      };
      ctx.hint(showMe);
      head.append(helpBtn(showMe));
      ctx.area.append(guide, line, tray);
      // A quick question while everyone is lined up, then the parade sets off.
      async function quiz() {
        await sleep(600);
        if (!ctx.alive()) return;
        guide.remove(); tray.remove();
        const sorted = [...sizes].sort((a, b) => a - b), mids = k % 2 ? [sorted[(k - 1) / 2]] : [sorted[k / 2 - 1], sorted[k / 2]];
        const q = pick(R >= 4 ? ['big', 'small', 'mid'] : ['big', 'small']);
        const ok = (sz) => q === 'mid' ? mids.includes(sz) : sz === (q === 'big' ? sorted[k - 1] : sorted[0]);
        const askTxt = { big: 'Quick! Tap the BIGGEST dinosaur!', small: 'Quick! Tap the smallest dinosaur!', mid: 'Quick! Tap a dinosaur in the MIDDLE of the line!' };
        ctx.say(askTxt[q]);
        const ds = $$('.par-dino', line); let answered = false;
        ds.forEach((d) => { d.classList.add('askable'); d.addEventListener('pointerdown', () => {
          if (answered) return;
          const sz = Number(d.dataset.size);
          if (ok(sz)) { answered = true; ds.forEach((x) => x.classList.remove('askable')); FX.dinoState(d.firstElementChild, 'roar', 900); FX.sfx.roar(); ctx.bonus(1, d, 'Sharp eyes!'); parade(); }
          else { slips++; ctx.bad(.3, d); FX.shake(d); ctx.say(q === 'big' ? 'Not the biggest yet — compare the two tallest!' : q === 'small' ? 'Not the smallest — look for the tiniest one!' : 'The middle is halfway along the line!', 'sad'); }
        }); });
        ctx.hint(() => { const d = ds.find((x) => ok(Number(x.dataset.size))); if (d && !answered) { FX.pulse(d); FX.sfx.sparkle(); } });
      }
      async function parade() {
        await sleep(900);
        if (!ctx.alive()) return;
        ctx.say('Parade time! Roar roar roar!');
        line.classList.add('marching');
        $$('.par-dino', line).forEach((d, i) => { FX.dinoState(d.firstElementChild, 'walk'); d.firstElementChild.setAttribute('data-base', 'walk'); d.style.animationDelay = i * .14 + 's'; });
        $$('.par-slot', line).forEach((s) => { s.style.borderColor = 'transparent'; });
        // A little drum band plays along.
        [0, 1, 0, 2, 0, 1, 0, 2].forEach((n, i) => setTimeout(() => { if (ctx.alive()) { FX.sfx.drum(n); if (i % 2 === 0) FX.sfx.note(i, .2); } }, i * 330));
        for (let i = 0; i < 5; i++) setTimeout(() => { if (!ctx.alive()) return; const r = line.getBoundingClientRect(); FX.burst(innerWidth * (.15 + i * .17), r.top, { kind: 'notes', n: 4 }); }, i * 500);
        // Friends wander in along the path to watch the procession.
        [0, 1, 2].forEach((i) => setTimeout(() => { if (ctx.alive()) ctx.life.visit(); }, i * 280));
        FX.celebrate(); ctx.flutter(5);
        const fresh = rec.lo('sort' + k, slips);
        if (fresh) { ctx.bonus(2, line, 'Smartest line ever!'); cheer(2); }
        // A float for the shelf, for good, and at the top level an invitation to a longer line.
        if (floatV.set(String(R), R) && stampInto(shelf, floatArt, String(R), R, 'A new float!')) {
          if (floatBit) floatBit.textContent = `Floats ${shelf.dataset.got}/${ctx.rounds}`;
          ctx.say(`Float ${shelf.dataset.got} joins your parade shelf for good!`);
          if (shelf.classList.contains('full')) ctx.bonus(2, shelf, 'Shelf of floats!');
        }
        const last = R === ctx.rounds;
        if (last && await keepGoing(ctx, 'Keep going?', 'Three more friends want a place in the line.', 'One longer line!', '#3d9bd6', (host2, fin) => bonusLine(ctx, host2, fin))) {
          ctx.done(`${k} dinosaurs lined up, then ${Math.min(6, 2 + R)} more after them — a real parade!`, 3000); return;
        }
        ctx.done(fresh ? `${k} dinosaurs lined up with only ${slips} mix-up${slips === 1 ? '' : 's'} — a new record!` : 'What a wonderful parade!', 3000);
      }
    },
  });

  /* ====================================================================== 7. Counting */
  const NUM_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const FRUIT = [['🍓', 'berries'], ['🍎', 'apples'], ['🍇', 'grapes'], ['🍌', 'bananas'], ['🍉', 'melon slices'], ['🍊', 'oranges'], ['🥕', 'carrot sticks']];
  const SILLY = ['🪨', '🧦', '👟', '🧊', '🪵'];
  const SP_NAME = { trex: 'Rexy', tricera: 'Tricera', stego: 'Stego', bronto: 'Bronto', raptor: 'Rapt', ptero: 'Ptero' };
  window.Park.register({
    id: 'count', name: 'Snack Time', icon: 'tricera', color: '#e05a7a', rounds: 6, helper: 'tricera', ambient: 'meadow',
    desc: 'Feed the hungry dinosaurs the right number of snacks!',
    round(ctx) {
      const R = ctx.round, two = R >= 5, tricky = R >= 3, hideDots = R >= 4;
      // Only ask for a snack that already has a bed in this level's garden, so every
      // tummy the child fills plants something they can actually watch grow.
      const ripe = FRUIT.slice(0, Math.min(FRUIT.length, 2 + R));
      const [F, fname] = pick(ripe);
      const nums = two ? (R === 6 ? [6, 5] : [3, 4]) : [[3], [5], [7], [10]][R - 1];
      const species = shuffle(SPECIES.filter((s) => s !== 'ptero'));
      const friendNames = shuffle(NAMES).slice(0, nums.length);
      ctx.say(two ? `Two hungry friends! Tap one, then feed them ${fname}.` : `${friendNames[0]} is hungry! Please give ${friendNames[0]} ${NUM_WORD[nums[0]]} ${fname}!`);
      const best = rec.get('count' + R);
      ctx.area.append(recordBar(best === null ? `Count out loud and fill every tummy to set a Snack record!` : `Fewest mix-ups on this level: <b>${best}</b>. Beat it!`));
      /* The snack garden: every food you ever count out loud grows into a plant that stays planted. */
      const gardV = ledger('count-garden'), gardMap = gardV.all();
      const gardIds = FRUIT.map((f) => f[0]).slice(0, Math.min(FRUIT.length, 2 + R));
      const gardArt = (s, id) => { const w = FRUIT.find((f) => f[0] === id); s.innerHTML = `<i>${id}</i><small>${w ? w[1].replace(/s$/, '') : ''}</small>`; };
      const garden = collectRow('cnt-garden', 'f', gardIds, gardMap, '<i>🕳️</i>', gardArt);
      const head = statusBar([`Level ${R}`, `${nums.join(' + ')} snacks`, best === null ? 'No record yet' : `Best ${best} mix-ups`, `Garden ${garden.dataset.got}/${gardIds.length}`], '#e05a7a');
      const gardBit = $('.du-bar-3', head);
      ctx.area.append(head, garden);
      const stage = el('div', 'cnt-stage cnt-' + nums.length);
      const eaters = nums.map((n, i) => {
        const box = el('div', 'cnt-eater' + (i === 0 ? ' sel' : ''));
        const bubble = el('div', 'cnt-bubble', `<b>${n}</b><span>${Array.from({ length: n }, () => `<i>${F}</i>`).join('')}</span>`);
        if (hideDots) $('span', bubble).style.display = 'none';
        const dinoBox = el('div', 'cnt-dino', FX.dinoHTML(species[i], { color: pick(COLORS), state: 'idle' }));
        const nameTag = el('div', 'cnt-name', friendNames[i]);
        nameTag.style.cssText = 'align-self:flex-start;font-size:13px;font-weight:700;opacity:.85;background:rgba(255,255,255,.72);border-radius:10px;padding:1px 8px';
        const counter = el('div', 'cnt-counter', '0');
        const line = el('div', 'cnt-line'); for (let j = 1; j <= n; j++) line.append(el('span', 'cnt-dot', String(j)));
        box.append(bubble, dinoBox, nameTag, counter, line);
        const e = { n, name: friendNames[i], fed: 0, box, dinoBox, counter, line, dEl: dinoBox.firstElementChild };
        box.addEventListener('pointerdown', () => { if (eaters.length > 1 && e.fed < e.n) select(e); });
        stage.append(box); return e;
      });
      let cur = eaters[0], busy = false, doneN = 0, slips = 0, cleared = false;
      const select = (e) => { cur = e; eaters.forEach((x) => x.box.classList.toggle('sel', x === e)); FX.sfx.tap(); FX.pop(e.box); ctx.say(`Feeding ${e.name}, who wants ${NUM_WORD[e.n]}!`); };
      const pile = el('div', 'cnt-pile');
      const total = eaters.reduce((a, e) => a + e.n, 0);
      const others = FRUIT.filter((x) => x[0] !== F).map((x) => x[0]);
      const yucks = shuffle(SILLY).slice(0, 2);
      const snack = hideDots ? ['⭐'] : [];
      const foods = shuffle([...snack, ...Array(total + 3).fill(F), ...(tricky ? [...Array(3).fill(0).map(() => pick(others)), ...yucks, yucks[0]] : [])]);
      const btns = foods.map((f) => {
        const b = el('button', 'cnt-food', f); b.dataset.f = f;
        b.setAttribute('aria-label', f === F ? fname.replace(/s$/, '') : f === '⭐' ? 'Sparkle snack' : 'Not food');
        b.style.setProperty('--r', (Math.random() * 20 - 10).toFixed(0) + 'deg');
        if (f === '⭐') b.style.background = 'radial-gradient(circle at 50% 38%,#fff6c8,#ffd970 72%,#f0b531)';
        b.onclick = async () => {
          if (busy || b.classList.contains('used')) return;
          // A hidden sparkle snack: pure delight, no counting involved.
          if (f === '⭐') {
            busy = true; b.classList.add('used'); FX.sfx.coin();
            const p = centreOf(b); FX.burst(p.x, p.y, { kind: 'stars', n: 14 }); FX.floatText(p.x, p.y - 26, 'Sparkle snack!', { size: 24 });
            ctx.bonus(2, b, 'Shiny!'); await sleep(260); busy = false; return;
          }
          if (cur.fed >= cur.n) return;
          const e = cur;
          if (f !== F) {
            busy = true; slips++; ctx.bad(.34, b); FX.dinoState(e.dEl, 'sad', 800);
            const fruit = others.includes(f);
            ctx.say(fruit ? `${e.name} only wants ${fname} today!` : 'Yuck! That is not food!');
            await Park.fly(b, { x: innerWidth * (Math.random() < .5 ? .1 : .9), y: -30 }, { emoji: f, lift: 40, duration: 500, burst: false });
            b.classList.add('used');
            // After three silly mistakes the pile tidies itself so counting is easy again.
            if (!cleared && slips >= 3) {
              cleared = true;
              const junk = btns.filter((x) => x.dataset.f !== F && x.dataset.f !== '⭐' && !x.classList.contains('used'));
              junk.forEach((x, i) => setTimeout(() => { if (!ctx.alive()) return; x.classList.add('used'); x.style.opacity = '.25'; FX.sfx.whoosh(); }, i * 130));
              setTimeout(() => { if (ctx.alive()) ctx.say('Silly things cleared away. Now just count the ' + fname + '!'); }, junk.length * 130 + 200);
            }
            busy = false; return;
          }
          busy = true; b.classList.add('used');
          FX.dinoState(e.dEl, 'eat');
          await Park.fly(b, e.dinoBox, { emoji: F, size: 40, duration: 520, burst: false });
          FX.sfx.chomp(); e.fed++;
          FX.sfx.note(e.fed, .18);
          const c = centreOf(e.dinoBox); FX.burst(c.x, c.y - 20, { kind: 'hearts', n: 3 });
          e.counter.textContent = e.fed; FX.pop(e.counter);
          $$('.cnt-dot', e.line).forEach((d, i) => d.classList.toggle('on', i < e.fed));
          e.dEl.style.setProperty('--belly', 1 + e.fed * .012);
          FX.floatText(c.x + 30, c.y - 40, NUM_WORD[e.fed], { size: 28 });
          ctx.good(e.dinoBox);
          ctx.say(e.fed < e.n - 1 ? `${NUM_WORD[e.fed]}! ${e.n - e.fed} more please!` : e.fed < e.n ? `One more! ${NUM_WORD[e.fed]} and 1 more makes ${NUM_WORD[e.n]}!` : `${NUM_WORD[e.n]}! Yum yum yum!`);
          if (e.fed === e.n) {
            // Full tummy: a happy wiggle and a burp.
            FX.dinoState(e.dEl, 'happy'); e.dEl.setAttribute('data-base', 'happy'); e.box.classList.add('full');
            FX.sfx.pop(); FX.tone && FX.tone(110, .35, 'sawtooth', .1, .1, 55);
            const burp = el('div', 'cnt-burp', 'Burp!'); e.box.append(burp); FX.pop(burp);
            FX.burst(c.x, c.y, { kind: 'stars', n: 10 });
            // A food counted out loud for the first time takes root in the garden for good.
            if (gardV.set(F, R) && stampInto(garden, gardArt, F, R, 'Planted!')) {
              if (gardBit) gardBit.textContent = `Garden ${garden.dataset.got}/${gardIds.length}`;
              ctx.say(`${fname} are planted in your snack garden — ${garden.dataset.got} of ${gardIds.length} growing!`);
              if (garden.classList.contains('full')) { ctx.bonus(2, garden, 'Garden in bloom!'); garden.classList.add('bloom'); cheer(2); }
            }
            if (++doneN === eaters.length) {
              FX.celebrate(); ctx.flutter(3);
              const fresh = rec.lo('count' + R, slips);
              if (fresh && slips === 0) { ctx.bonus(2, stage, 'Perfect counting!'); cheer(2); }
              ctx.done(`${e.name} counted all the way to ${NUM_WORD[e.n]}!` + (fresh ? ' A brand-new record!' : ''), 2100); busy = false; return;
            }
            const nxt = eaters.find((x) => x.fed < x.n); if (nxt) select(nxt);
          } else FX.dinoState(e.dEl, 'idle');
          busy = false;
        };
        pile.append(b); return b;
      });
      const showMe = () => {
        const b = btns.find((x) => x.dataset.f === F && !x.classList.contains('used')); if (!b) return;
        b.classList.add('glow'); FX.sfx.sparkle();
        // Count the dots out loud with the helper, then the answer glows.
        const dots = $$('.cnt-dot', cur.line);
        dots.forEach((d, i) => setTimeout(() => { if (ctx.alive()) { FX.pop(d); FX.sfx.note(i, .12); } }, i * 220));
        ctx.say(`Count with me! ${cur.fed} in the tummy, ${cur.n - cur.fed} still to find — the glowing snack is a ${fname.replace(/s$/, '')}!`);
        setTimeout(() => b.classList.remove('glow'), 2600);
      };
      ctx.hint(showMe);
      head.append(helpBtn(showMe));
      ctx.area.append(stage, pile);
    },
  });

  /* ====================================================================== 8. Dot to Dot */
  const eggPts = Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return [200 + 82 * Math.sin(t) * (1 - .12 * Math.cos(t)), 160 - 105 * Math.cos(t)]; });
  const starPts = Array.from({ length: 10 }, (_, i) => { const t = (i / 10) * Math.PI * 2, r = i % 2 ? 50 : 115; return [200 + r * Math.sin(t), 165 - r * Math.cos(t)]; });
  /* A crescent: seven dots sweep the left bulge, then a Bézier cuts back inside so the horns meet exactly. */
  const moonPts = (() => {
    const a = Array.from({ length: 7 }, (_, i) => { const t = (70 + i * 30) * Math.PI / 180; return [Math.round(190 + 104 * Math.cos(t)), Math.round(160 - 104 * Math.sin(t))]; });
    const P0 = a[0], P3 = a[6], C1 = [150, 120], C2 = [140, 200];
    [.25, .5, .75].forEach((t) => {
      const u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      a.push([Math.round(w[0] * P0[0] + w[1] * C1[0] + w[2] * C2[0] + w[3] * P3[0]), Math.round(w[0] * P0[1] + w[1] * C1[1] + w[2] * C2[1] + w[3] * P3[1])]);
    });
    return a;
  })();
  const SHAPES = {
    volcano: { pts: [[56, 262], [112, 176], [146, 104], [168, 58], [204, 96], [240, 58], [262, 104], [296, 176], [352, 262]], fill: '#8a5d44', title: 'A volcano!' },
    egg: { pts: eggPts, fill: '#ffe9b8', title: 'A dinosaur egg!' },
    star: { pts: starPts, fill: '#ffd54f', title: 'A shining star!' },
    dino: { pts: [[40, 236], [120, 208], [200, 180], [262, 160], [290, 100], [310, 58], [350, 50], [356, 72], [322, 96], [322, 200], [316, 254], [268, 254], [262, 222], [190, 222], [176, 254], [130, 254], [124, 222]], fill: '#8fd6a0', title: 'A Brontosaurus!' },
    moon: { pts: moonPts, fill: '#ffeeb0', title: 'A crescent moon!' },
  };
  window.Park.register({
    id: 'dots', name: 'Dot to Dot', icon: 'ptero', color: '#8e5bd1', rounds: 5, helper: 'ptero', ambient: 'night',
    desc: 'Join the dots in order and watch a surprise appear!',
    round(ctx) {
      const key = ['volcano', 'egg', 'star', 'dino', 'moon'][ctx.round - 1], S = SHAPES[key];
      // From round two the picture can appear back-to-front, so it never looks the twice.
      const flip = ctx.round >= 2 && Math.random() < .5;
      const pts = S.pts.map((p) => [flip ? 400 - p[0] : p[0], p[1]]);
      ctx.say('Touch the dots in order, starting at number 1!');
      const t0 = Date.now();
      const bestS = rec.get('dots' + key);
      ctx.area.append(recordBar(bestS === null ? `No time yet for this picture — be the first to finish it!` : `Your fastest ${S.title.replace('!', '')}: <b>${bestS}s</b>. Can you beat it?`));
      /* The night wall: every picture you join hangs there for good, lit like a little constellation. */
      const wallV = ledger('dots-wall'), wallMap = wallV.all();
      const wallIds = Object.keys(SHAPES);
      const wallArt = (s, id) => {
        const P = SHAPES[id], pp = P.pts.map((q) => `${(q[0] * .18).toFixed(1)},${(q[1] * .18).toFixed(1)}`).join(' ');
        s.innerHTML = `<svg viewBox="0 0 72 54"><polygon points="${pp}" fill="${P.fill}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
      };
      const ddWall = collectRow('dd-wall', 'p', wallIds, wallMap, '<i>✳️</i>', wallArt);
      const head = statusBar([`Level ${ctx.round}`, `${pts.length} dots · ${S.title}`, bestS === null ? 'No time yet' : `Best ${bestS}s`, `Wall ${ddWall.dataset.got}/${wallIds.length}`], '#8e5bd1');
      const wallBit = $('.du-bar-3', head);
      ctx.area.append(head, ddWall);
      const wrap = el('div', 'dots-wrap');
      const sky = el('div', 'dots-sky', '<i class="ds-moon">🌙</i><i class="ds-l1"></i><i class="ds-l2"></i>');
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 400 300'); svg.setAttribute('class', 'dots-svg');
      const fillEl = document.createElementNS(ns, 'polygon'); fillEl.setAttribute('class', 'dots-fill'); fillEl.setAttribute('fill', S.fill); fillEl.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
      // A faint dashed ghost of the answer sits behind the dots as a guide, then fades when the shape is finished.
      const ghost = document.createElementNS(ns, 'polygon');
      ghost.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
      ghost.setAttribute('fill', 'rgba(255,255,255,.05)'); ghost.setAttribute('stroke', 'rgba(255,255,255,.4)');
      ghost.setAttribute('stroke-width', '2'); ghost.setAttribute('stroke-dasharray', '6 9'); ghost.style.transition = 'opacity .6s';
      const lines = document.createElementNS(ns, 'g');
      const trail = document.createElementNS(ns, 'line'); trail.setAttribute('class', 'dots-trail');
      svg.append(ghost, fillEl, lines, trail);
      const dots = pts.map((p, i) => {
        const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'dot' + (i === 0 ? ' next' : '')); g.setAttribute('transform', `translate(${p[0]} ${p[1]})`); g.dataset.i = i;
        g.innerHTML = `<circle r="21" class="ring"/><circle r="16" class="body"/><text y="6" text-anchor="middle">${i + 1}</text>`;
        svg.append(g); return g;
      });
      const startTag = document.createElementNS(ns, 'text'); startTag.setAttribute('class', 'dots-start'); startTag.setAttribute('x', pts[0][0]); startTag.setAttribute('y', pts[0][1] - 26); startTag.setAttribute('text-anchor', 'middle'); startTag.textContent = 'Start here!'; svg.append(startTag);
      wrap.append(sky, svg); ctx.area.append(wrap);
      let next = 0, down = false, slips = 0, secs = 0;
      const toSvg = (e) => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * 400 / r.width, (e.clientY - r.top) * 300 / r.height]; };
      const line = (a, b) => { const l = document.createElementNS(ns, 'line'); l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]); l.setAttribute('class', 'dots-line'); const len = Math.hypot(b[0] - a[0], b[1] - a[1]); l.style.strokeDasharray = len; l.style.strokeDashoffset = len; lines.append(l); l.getBoundingClientRect(); l.style.strokeDashoffset = 0; };
      const connect = async () => {
        const i = next;
        dots[i].classList.remove('next'); dots[i].classList.add('on'); FX.sfx.note(i % 12, .25); ctx.good(dots[i]);
        const c = centreOf(dots[i]); FX.burst(c.x, c.y, { kind: 'sparkle', n: 6 });
        if (i === 0) startTag.remove();
        if (i > 0) line(pts[i - 1], pts[i]);
        next++;
        if (next < pts.length) { dots[next].classList.add('next'); trail.style.display = 'none'; ctx.say(next === 1 ? 'Now number 2!' : next === pts.length - 1 ? `Nearly there! Last one is ${next + 1}!` : `Great! Now ${next + 1}!`); return; }
        line(pts[pts.length - 1], pts[0]); down = false; trail.style.display = 'none';
        secs = Math.max(1, Math.round((Date.now() - t0) / 100) / 10);
        ghost.style.opacity = '0';
        await sleep(500); if (!ctx.alive()) return;
        fillEl.classList.add('show'); FX.sfx.win(); ctx.say(S.title);
        const fast = rec.lo('dots' + key, secs);
        const cw = centreOf(wrap); FX.floatText(cw.x, cw.y + 70, `${secs}s`, { size: 30 });
        if (fast) { ctx.bonus(2, wrap, 'Fastest ever!'); cheer(2); }
        await sleep(500); if (!ctx.alive()) return;
        reveal(fast);
      };
      const near = (e) => { const p = toSvg(e), t = pts[next]; return t && Math.hypot(p[0] - t[0], p[1] - t[1]) < 32; };
      /* Which dot is this finger really on? The <svg> takes the pointer capture, so this is where a
       * wrong tap has to be answered — the per-dot click below never sees it in a real browser. */
      const dotUnder = (e) => { const p = toSvg(e); let bi = -1, bd = 40; pts.forEach((q, k) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd) { bd = d; bi = k; } }); return bi; };
      let slipGuard = 0;
      const slip = (g) => {
        if (Date.now() - slipGuard < 700) return;   // one real tap arrives as pointerdown *and* click: charge it once
        slipGuard = Date.now();
        slips++; ctx.bad(.2, g); FX.shake(g); FX.sfx.bad();
        ctx.say(`Not yet! Number ${next + 1} is the next stop.`);
        if (slips >= 3) showWay();                   // after three slips the answer is pointed out every time
      };
      svg.addEventListener('pointerdown', (e) => {
        down = true; svg.setPointerCapture(e.pointerId);
        if (near(e)) { slipGuard = Date.now(); connect(); return; }
        const i = dotUnder(e); if (i > next) slip(dots[i]);
      });
      svg.addEventListener('pointermove', (e) => {
        if (!down || next >= pts.length) return;
        if (next > 0) { const p = toSvg(e), a = pts[next - 1]; trail.setAttribute('x1', a[0]); trail.setAttribute('y1', a[1]); trail.setAttribute('x2', p[0]); trail.setAttribute('y2', p[1]); trail.style.display = ''; }
        if (near(e)) connect();
      });
      svg.addEventListener('pointerup', () => { down = false; trail.style.display = 'none'; });
      // The helper makes the next dot bounce and shows the way.
      const showWay = () => {
        if (next >= pts.length) return;
        const g = dots[next]; g.classList.add('shout'); FX.sfx.sparkle(); const c = centreOf(g); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 });
        ctx.say(`Here is number ${next + 1}!`); setTimeout(() => g.classList.remove('shout'), 2400);
      };
      dots.forEach((g, i) => g.addEventListener('click', () => {
        if (i === next) connect();
        else if (i > next) slip(g);   // same charge as the pointer path, and the guard keeps a real tap at one slip
      }));
      ctx.hint(showWay);
      head.append(helpBtn(showWay));
      // Wishing stars streak across the sky: a quick tap makes a wish (bonus star).
      let wishes = 0;
      const wish = () => {
        if (!ctx.alive() || wishes >= (ctx.round >= 3 ? 3 : 2) || next >= pts.length) return;
        wishes++;
        const w = el('button', 'wish-star', '🌠'); w.setAttribute('aria-label', 'Wishing star');
        wrap.append(w);
        const a = FX.anim(w, [{ transform: 'translate(0,0) scale(.7)', opacity: 0 }, { transform: 'translate(120px,70px) scale(1)', opacity: 1, offset: .15 }, { transform: 'translate(520px,300px) scale(.9)', opacity: .9, offset: .95 }, { transform: 'translate(540px,320px)', opacity: 0 }], { duration: 3600, easing: 'ease-in' });
        let got = false;
        w.onpointerdown = (e) => { e.stopPropagation(); if (got) return; got = true; FX.sfx.sparkle(); ctx.bonus(1, w, 'Wish!'); ctx.say('You caught a wishing star! Make a wish!'); w.remove(); };
        if (a) a.onfinish = () => w.remove(); else setTimeout(() => w.remove(), 3000);
        setTimeout(wish, 6000 + rnd(5000));
      };
      setTimeout(wish, 3500 + rnd(3000));
      function reveal(fast) {
        const r = el('div', 'dots-reveal'); wrap.append(r);
        if (key === 'volcano') {
          r.innerHTML = `<div class="rv-ptero">${FX.dinoHTML('ptero', { color: 'pink' })}</div>`; FX.sfx.roar();
          let n = 0; const iv = setInterval(() => { if (!ctx.alive() || ++n > 14) return clearInterval(iv); const q = centreOf(dots[flip ? pts.length - 4 : 3]); FX.burst(q.x, q.y, { kind: 'embers', n: 14, angle: -Math.PI / 2, spread: .9, power: 2.2 }); }, 160);
        } else if (key === 'egg') {
          const baby = pick(SPECIES.filter((s) => s !== 'ptero'));
          r.innerHTML = `<div class="rv-baby">${FX.dinoHTML(baby, { color: pick(COLORS), state: 'happy' })}</div>`; FX.sfx.chirp();
          const q = centreOf(wrap); FX.burst(q.x, q.y, { kind: 'confetti', n: 30 });
        } else if (key === 'dino') {
          r.innerHTML = `<div class="rv-bronto">${FX.dinoHTML('bronto', { color: 'green', state: 'roar' })}</div>`; FX.sfx.roar(); FX.shakeScreen(4);
          const q = centreOf(wrap); FX.burst(q.x, q.y, { kind: 'confetti', n: 40 }); ctx.flutter(5);
          setTimeout(() => { const d = $('.du-dino', r); if (d) { d.setAttribute('data-base', 'happy'); FX.dinoState(d, 'happy'); } }, 1400);
        } else if (key === 'moon') {
          r.innerHTML = `<div class="rv-baby">${FX.dinoHTML(pick(['bronto', 'stego']), { color: 'purple', state: 'sleep' })}</div>`;
          FX.sfx.chirp(); ctx.say('Shhh — a dinosaur is asleep in the moon!');
          for (let i = 0; i < 5; i++) setTimeout(() => { if (!ctx.alive()) return; const q = centreOf(wrap); FX.burst(q.x + rnd(120) - 60, q.y, { kind: 'stars', n: 6, scale: .8 }); }, i * 220);
        } else { r.innerHTML = '<div class="rv-star">⭐</div>'; for (let i = 0; i < 4; i++) setTimeout(() => { const q = centreOf(wrap); FX.burst(q.x + rnd(80) - 40, q.y + rnd(80) - 40, { kind: 'stars', n: 10 }); FX.sfx.sparkle(); }, i * 260); }
        /* The joined picture goes up on the night wall for good — the wall is the same wall next time you play. */
        if (wallV.set(key, ctx.round) && stampInto(ddWall, wallArt, key, ctx.round, 'Hung on the wall!')) {
          if (wallBit) wallBit.textContent = `Wall ${ddWall.dataset.got}/${wallIds.length}`;
          ctx.say(`${S.title} Hangs on your night wall — ${ddWall.dataset.got} of ${wallIds.length} pictures joined!`);
          if (ddWall.classList.contains('full')) { ctx.bonus(2, ddWall, 'The whole wall is lit!'); cheer(2); }
        }
        /* From level three the finished scene is not a still picture any more: living dinosaurs wander into it. */
        if (ctx.round >= 3) {
          const crowd = Math.min(4, ctx.round - 1);
          const dio = el('div', 'dots-dio'); dio.dataset.count = crowd;
          const CREW = [['trex', 'Roar!'], ['ptero', 'Whee!'], ['stego', 'Hello!'], ['raptor', 'Fast!']];
          CREW.slice(0, crowd).forEach((c, i) => {
            const b = el('span', 'dio-buddy'); b.dataset.sp = c[0];
            b.innerHTML = FX.dinoHTML(c[0], { color: COLORS[SPECIES.indexOf(c[0]) % COLORS.length], state: 'happy' }) + `<em class="dio-tag">${c[1]}</em>`;
            b.style.animationDelay = (i * .22) + 's';
            dio.append(b);
            setTimeout(() => { if (!ctx.alive()) return; FX.pop(b); const q = centreOf(b); FX.burst(q.x, q.y, { kind: 'sparkle', n: 5 }); }, 700 + i * 260);
          });
          wrap.append(dio);
          ctx.flutter(Math.min(4, crowd));
        }
        ctx.done(`${S.title} In ${secs} seconds${fast ? ' — your fastest ever!' : '!'}`, 2900);
      }
    },
  });
})();
