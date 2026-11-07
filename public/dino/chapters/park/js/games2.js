/* Dino Park games 5–8: Memory, Size Parade, Counting, Dot-to-Dot. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, drag, hit, SPECIES, COLORS, FX } = window.Park;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ====================================================================== 5. Dino Memory */
  window.Park.register({
    id: 'memory', name: 'Dino Memory', icon: 'trex', color: '#e08a2e', rounds: 4, helper: 'trex', ambient: 'meadow',
    desc: 'Remember where the dinosaurs hide!',
    round(ctx) {
      const pairs = [3, 4, 6, 8][ctx.round - 1], peek = [2600, 2400, 3000, 3600][ctx.round - 1], mixUp = ctx.round >= 3;
      const SP = { trex: 'T-rex', tricera: 'Triceratops', stego: 'Stegosaurus', bronto: 'Brontosaurus', raptor: 'Raptor', ptero: 'Pterosaur' };
      const combos = shuffle(SPECIES.flatMap((s) => shuffle(COLORS).slice(0, 2).map((c) => ({ s, c })))).slice(0, pairs);
      const deck = shuffle([...combos, ...combos].map((d, i) => ({ ...d, k: d.s + d.c, id: i })));
      ctx.say('Look carefully! Remember where each dinosaur hides.');
      const wrap = el('div', 'mem-wrap');
      const found = el('div', 'mem-found');
      for (let i = 0; i < pairs; i++) found.append(el('span', 'mf-slot', '<i>🥚</i>'));
      const bar = el('div', 'mem-timer', '<i></i><b>Remember!</b>');
      const grid = el('div', 'mem-grid'); grid.style.setProperty('--cols', pairs === 3 ? 3 : 4);
      let first = null, locked = true, matched = 0, combo = 0, tries = 0, mixed = false;
      const cards = deck.map((d, ci) => {
        const b = el('button', 'mem-card flipped');
        b.dataset.k = d.k; b.dataset.s = d.s; b.dataset.c = d.c; b.setAttribute('aria-label', 'Hidden dinosaur card');
        b.innerHTML = `<span class="mc-inner"><span class="mc-face mc-back"><i></i><i></i><i></i><em>🐾</em></span><span class="mc-face mc-front">${FX.dinoHTML(d.s, { color: d.c, state: 'idle' })}</span></span>`;
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
            // The pair flies up into the "found" row with its name.
            const slot = found.children[matched - 1];
            if (slot) { await Park.fly(b, slot, { emoji: '⭐', size: 30, duration: 600, burst: false }); slot.classList.add('got'); slot.innerHTML = `${FX.dinoHTML(a.dataset.s, { color: a.dataset.c, state: 'happy' })}<small>${SP[a.dataset.s]}</small>`; FX.pop(slot); }
            ctx.say(combo > 1 ? `${combo} in a row! You are amazing!` : `A match! That is the ${SP[a.dataset.s]}!`);
            if (matched === pairs) {
              FX.celebrate(); ctx.flutter(4);
              if (tries <= pairs) ctx.bonus(2, grid, 'Super memory!'); else if (tries <= pairs + 2) ctx.bonus(1, grid, 'Great memory!');
              ctx.done('You found every pair!', 1900); return;
            }
            // Later rounds: half way through, the hidden dinosaurs swap places!
            if (mixUp && !mixed && matched >= Math.floor(pairs / 2)) { mixed = true; await sleep(300); await mixRemaining(); }
            locked = false;
          } else {
            combo = 0; ctx.bad(.5, b); FX.shake(a); FX.shake(b); ctx.say('Not a match. Remember where they are!');
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
      // After two slips the helper peeks at a pair for a moment.
      ctx.hint(() => {
        const left = cards.filter((c) => !c.classList.contains('matched') && !c.classList.contains('flipped')); if (left.length < 2 || locked) return;
        const k = left[0].dataset.k, two = left.filter((c) => c.dataset.k === k).slice(0, 2);
        two.forEach((c) => c.classList.add('flipped')); FX.sfx.sparkle();
        setTimeout(() => two.forEach((c) => { if (!c.classList.contains('matched') && c !== first) c.classList.remove('flipped'); }), 1100);
      });
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
  window.Park.register({
    id: 'sort', name: 'Size Parade', icon: 'bronto', color: '#3d9bd6', rounds: 4, helper: 'bronto', helperColor: 'blue', ambient: 'meadow',
    desc: 'Put the dinosaurs in a line, smallest to biggest!',
    round(ctx) {
      const k = [3, 4, 5, 5][ctx.round - 1], desc = ctx.round >= 3, blind = ctx.round === 4;
      const sp = pick(SPECIES.filter((s) => s !== 'ptero')), col = pick(COLORS);
      // Shrink everything a little on narrow screens so the whole line always fits.
      const base = [58, 82, 108, 134, 160].slice(0, k), fit = Math.min(1.3, Math.max(.5, (ctx.area.clientWidth - 56) / (base.reduce((a, b) => a + b, 0) + k * 38)));
      const sizes = base.map((b) => Math.round(b * fit)), words = SIZE_WORDS[k];
      ctx.say(blind ? 'No guide this time! The BIGGEST goes first!' : desc ? 'This time the BIGGEST goes first!' : 'Smallest first! Drag them into the line.');
      const line = el('div', 'par-line');
      const order = desc ? [...sizes].reverse() : sizes;
      const slots = order.map((sz, i) => {
        const s = el('div', 'par-slot'); s.dataset.size = sz; s.style.width = (sz + 22) + 'px'; s.style.height = (Math.round(sz * .78) + 30) + 'px';
        s.innerHTML = `<b>${i + 1}</b>` + (!blind ? `<span class="ghost" style="width:${sz}px">${FX.dinoHTML(sp, { color: 'blue', state: 'idle' })}</span>` : '');
        line.append(s); return s;
      });
      const guide = el('div', 'par-guide', desc ? '<span>BIG</span><i>➜</i><span>small</span>' : '<span>small</span><i>➜</i><span>BIG</span>');
      const tray = el('div', 'par-tray');
      let done = 0;
      const dinos = [];
      shuffle(sizes).forEach((sz) => {
        const d = el('div', 'par-dino'); d.dataset.size = sz; d.style.width = sz + 'px';
        d.innerHTML = FX.dinoHTML(sp, { color: col, state: 'idle' });
        const place = (slot) => {
          if (!slot || slot.firstElementChild && slot.querySelector('.par-dino')) return false;
          if (Number(slot.dataset.size) !== sz) { ctx.bad(.5, slot); FX.shake(slot); ctx.say(sz > Number(slot.dataset.size) ? 'That one is too big for this spot!' : 'That one is too small for this spot!', 'sad'); return false; }
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
      ctx.hint(() => {
        // Glow the next dinosaur that fits the first empty spot.
        const s = slots.find((q) => !q.querySelector('.par-dino')); if (!s) return;
        const want = dinos.find((x) => x.sz === Number(s.dataset.size) && !x.d.classList.contains('locked')); if (!want) return;
        s.classList.add('hint'); want.d.classList.add('hint'); FX.sfx.sparkle();
        setTimeout(() => { s.classList.remove('hint'); want.d.classList.remove('hint'); }, 2800);
      });
      ctx.area.append(guide, line, tray);
      // A quick question while everyone is lined up, then the parade sets off.
      async function quiz() {
        await sleep(600);
        if (!ctx.alive()) return;
        guide.remove(); tray.remove();
        const askBig = Math.random() < .5, want = askBig ? Math.max(...sizes) : Math.min(...sizes);
        ctx.say(askBig ? 'Quick! Tap the BIGGEST dinosaur!' : 'Quick! Tap the smallest dinosaur!');
        const ds = $$('.par-dino', line); let answered = false;
        ds.forEach((d) => { d.classList.add('askable'); d.addEventListener('pointerdown', () => {
          if (answered) return;
          if (Number(d.dataset.size) === want) { answered = true; ds.forEach((x) => x.classList.remove('askable')); FX.dinoState(d.firstElementChild, 'roar', 900); FX.sfx.roar(); ctx.bonus(1, d, 'Sharp eyes!'); parade(); }
          else { ctx.bad(.34, d); FX.shake(d); ctx.say(askBig ? 'That is not the biggest. Look again!' : 'That is not the smallest. Look again!', 'sad'); }
        }); });
        ctx.hint(() => { const d = ds.find((x) => Number(x.dataset.size) === want); if (d && !answered) { FX.pulse(d); FX.sfx.sparkle(); } });
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
        FX.celebrate(); ctx.flutter(5);
        ctx.done('What a wonderful parade!', 3000);
      }
    },
  });

  /* ====================================================================== 7. Counting */
  const NUM_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const FRUIT = [['🍓', 'berries'], ['🍎', 'apples'], ['🍇', 'grapes'], ['🍌', 'bananas'], ['🍉', 'melon slices']];
  window.Park.register({
    id: 'count', name: 'Snack Time', icon: 'tricera', color: '#e05a7a', rounds: 5, helper: 'tricera', ambient: 'meadow',
    desc: 'Feed the hungry dinosaurs the right number of snacks!',
    round(ctx) {
      const two = ctx.round === 5, tricky = ctx.round >= 3, hideDots = ctx.round >= 4;
      const [F, fname] = FRUIT[ctx.round - 1];
      const nums = two ? [3, 4 + rnd(2)] : [[3], [5], [7], [10]][ctx.round - 1];
      const species = shuffle(SPECIES.filter((s) => s !== 'ptero'));
      ctx.say(two ? `Two hungry friends! Tap one, then feed them ${fname}.` : `I'm hungry! Please give me ${NUM_WORD[nums[0]]} ${fname}!`);
      const stage = el('div', 'cnt-stage cnt-' + nums.length);
      const eaters = nums.map((n, i) => {
        const box = el('div', 'cnt-eater' + (i === 0 ? ' sel' : ''));
        const bubble = el('div', 'cnt-bubble', `<b>${n}</b><span>${Array.from({ length: n }, () => `<i>${F}</i>`).join('')}</span>`);
        if (hideDots) $('span', bubble).style.display = 'none';
        const dinoBox = el('div', 'cnt-dino', FX.dinoHTML(species[i], { color: pick(COLORS), state: 'idle' }));
        const counter = el('div', 'cnt-counter', '0');
        const line = el('div', 'cnt-line'); for (let j = 1; j <= n; j++) line.append(el('span', 'cnt-dot', String(j)));
        box.append(bubble, dinoBox, counter, line);
        const e = { n, fed: 0, box, dinoBox, counter, line, dEl: dinoBox.firstElementChild };
        box.addEventListener('pointerdown', () => { if (eaters.length > 1 && e.fed < e.n) select(e); });
        stage.append(box); return e;
      });
      let cur = eaters[0], busy = false, doneN = 0;
      const select = (e) => { cur = e; eaters.forEach((x) => x.box.classList.toggle('sel', x === e)); FX.sfx.tap(); FX.pop(e.box); ctx.say(`Feeding the one who wants ${NUM_WORD[e.n]}!`); };
      const pile = el('div', 'cnt-pile');
      const total = eaters.reduce((a, e) => a + e.n, 0);
      const others = FRUIT.filter((x) => x[0] !== F).map((x) => x[0]);
      const foods = tricky ? shuffle([...Array(total + 3).fill(F), ...Array(3).fill(0).map(() => pick(others)), '🪨', '🧦', '🪨', '🧦']) : Array(total + 3).fill(F);
      const btns = foods.map((f) => {
        const b = el('button', 'cnt-food', f); b.dataset.f = f; b.setAttribute('aria-label', f === F ? fname.replace(/s$/, '') : 'Not food');
        b.style.setProperty('--r', (Math.random() * 20 - 10).toFixed(0) + 'deg');
        b.onclick = async () => {
          if (busy || b.classList.contains('used') || cur.fed >= cur.n) return;
          const e = cur;
          if (f !== F) {
            busy = true; ctx.bad(.34, b); FX.dinoState(e.dEl, 'sad', 800);
            const fruit = others.includes(f);
            ctx.say(fruit ? `I only want ${fname} today!` : 'Yuck! That is not food!');
            await Park.fly(b, { x: innerWidth * (Math.random() < .5 ? .1 : .9), y: -30 }, { emoji: f, lift: 40, duration: 500, burst: false });
            b.classList.add('used'); busy = false; return;
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
          ctx.say(e.fed < e.n ? `${NUM_WORD[e.fed]}! ${e.n - e.fed} more please!` : `${NUM_WORD[e.n]}! Yum yum yum!`);
          if (e.fed === e.n) {
            // Full tummy: a happy wiggle and a burp.
            FX.dinoState(e.dEl, 'happy'); e.dEl.setAttribute('data-base', 'happy'); e.box.classList.add('full');
            FX.sfx.pop(); FX.tone && FX.tone(110, .35, 'sawtooth', .1, .1, 55);
            const burp = el('div', 'cnt-burp', 'Burp!'); e.box.append(burp); FX.pop(burp);
            FX.burst(c.x, c.y, { kind: 'stars', n: 10 });
            if (++doneN === eaters.length) { FX.celebrate(); ctx.flutter(3); ctx.done(two ? 'Both friends are full! Thank you!' : `You counted to ${e.n}! Thank you!`, 2000); busy = false; return; }
            const nxt = eaters.find((x) => x.fed < x.n); if (nxt) select(nxt);
          } else FX.dinoState(e.dEl, 'idle');
          busy = false;
        };
        pile.append(b); return b;
      });
      ctx.hint(() => {
        const b = btns.find((x) => x.dataset.f === F && !x.classList.contains('used')); if (!b) return;
        b.classList.add('glow'); FX.sfx.sparkle(); setTimeout(() => b.classList.remove('glow'), 2600);
      });
      ctx.area.append(stage, pile);
    },
  });

  /* ====================================================================== 8. Dot to Dot */
  const eggPts = Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return [200 + 82 * Math.sin(t) * (1 - .12 * Math.cos(t)), 160 - 105 * Math.cos(t)]; });
  const starPts = Array.from({ length: 10 }, (_, i) => { const t = (i / 10) * Math.PI * 2, r = i % 2 ? 50 : 115; return [200 + r * Math.sin(t), 165 - r * Math.cos(t)]; });
  const SHAPES = {
    volcano: { pts: [[56, 262], [112, 176], [146, 104], [168, 58], [204, 96], [240, 58], [262, 104], [296, 176], [352, 262]], fill: '#8a5d44', title: 'A volcano!' },
    egg: { pts: eggPts, fill: '#ffe9b8', title: 'A dinosaur egg!' },
    star: { pts: starPts, fill: '#ffd54f', title: 'A shining star!' },
    dino: { pts: [[40, 236], [120, 208], [200, 180], [262, 160], [290, 100], [310, 58], [350, 50], [356, 72], [322, 96], [322, 200], [316, 254], [268, 254], [262, 222], [190, 222], [176, 254], [130, 254], [124, 222]], fill: '#8fd6a0', title: 'A Brontosaurus!' },
  };
  window.Park.register({
    id: 'dots', name: 'Dot to Dot', icon: 'ptero', color: '#8e5bd1', rounds: 4, helper: 'ptero', ambient: 'night',
    desc: 'Join the dots in order and watch a surprise appear!',
    round(ctx) {
      const key = ['volcano', 'egg', 'star', 'dino'][ctx.round - 1], S = SHAPES[key], pts = S.pts;
      ctx.say('Touch the dots in order, starting at number 1!');
      const wrap = el('div', 'dots-wrap');
      const sky = el('div', 'dots-sky', '<i class="ds-moon">🌙</i><i class="ds-l1"></i><i class="ds-l2"></i>');
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 400 300'); svg.setAttribute('class', 'dots-svg');
      const fillEl = document.createElementNS(ns, 'polygon'); fillEl.setAttribute('class', 'dots-fill'); fillEl.setAttribute('fill', S.fill); fillEl.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
      const lines = document.createElementNS(ns, 'g');
      const trail = document.createElementNS(ns, 'line'); trail.setAttribute('class', 'dots-trail');
      svg.append(fillEl, lines, trail);
      const dots = pts.map((p, i) => {
        const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'dot' + (i === 0 ? ' next' : '')); g.setAttribute('transform', `translate(${p[0]} ${p[1]})`); g.dataset.i = i;
        g.innerHTML = `<circle r="21" class="ring"/><circle r="16" class="body"/><text y="6" text-anchor="middle">${i + 1}</text>`;
        svg.append(g); return g;
      });
      const startTag = document.createElementNS(ns, 'text'); startTag.setAttribute('class', 'dots-start'); startTag.setAttribute('x', pts[0][0]); startTag.setAttribute('y', pts[0][1] - 26); startTag.setAttribute('text-anchor', 'middle'); startTag.textContent = 'Start here!'; svg.append(startTag);
      wrap.append(sky, svg); ctx.area.append(wrap);
      let next = 0, down = false;
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
        await sleep(500); if (!ctx.alive()) return;
        fillEl.classList.add('show'); FX.sfx.win(); ctx.say(S.title);
        await sleep(500); if (!ctx.alive()) return;
        reveal();
      };
      const near = (e) => { const p = toSvg(e), t = pts[next]; return t && Math.hypot(p[0] - t[0], p[1] - t[1]) < 32; };
      svg.addEventListener('pointerdown', (e) => { down = true; svg.setPointerCapture(e.pointerId); if (near(e)) connect(); });
      svg.addEventListener('pointermove', (e) => {
        if (!down || next >= pts.length) return;
        if (next > 0) { const p = toSvg(e), a = pts[next - 1]; trail.setAttribute('x1', a[0]); trail.setAttribute('y1', a[1]); trail.setAttribute('x2', p[0]); trail.setAttribute('y2', p[1]); trail.style.display = ''; }
        if (near(e)) connect();
      });
      svg.addEventListener('pointerup', () => { down = false; trail.style.display = 'none'; });
      dots.forEach((g, i) => g.addEventListener('click', () => { if (i === next) connect(); else if (i > next) { ctx.bad(.34, g); FX.shake(g); ctx.say(`Not yet! Find number ${next + 1} first.`); } }));
      // The helper makes the next dot bounce and shows the way.
      ctx.hint(() => {
        if (next >= pts.length) return;
        const g = dots[next]; g.classList.add('shout'); FX.sfx.sparkle(); const c = centreOf(g); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 });
        ctx.say(`Here is number ${next + 1}!`); setTimeout(() => g.classList.remove('shout'), 2400);
      });
      // Wishing stars streak across the sky: a quick tap makes a wish (bonus star).
      let wishes = 0;
      const wish = () => {
        if (!ctx.alive() || wishes >= 2 || next >= pts.length) return;
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
      function reveal() {
        const r = el('div', 'dots-reveal'); wrap.append(r);
        if (key === 'volcano') {
          r.innerHTML = `<div class="rv-ptero">${FX.dinoHTML('ptero', { color: 'pink' })}</div>`; FX.sfx.roar();
          let n = 0; const iv = setInterval(() => { if (!ctx.alive() || ++n > 14) return clearInterval(iv); const q = centreOf(dots[3]); FX.burst(q.x, q.y, { kind: 'embers', n: 14, angle: -Math.PI / 2, spread: .9, power: 2.2 }); }, 160);
        } else if (key === 'egg') {
          const baby = pick(SPECIES.filter((s) => s !== 'ptero'));
          r.innerHTML = `<div class="rv-baby">${FX.dinoHTML(baby, { color: pick(COLORS), state: 'happy' })}</div>`; FX.sfx.chirp();
          const q = centreOf(wrap); FX.burst(q.x, q.y, { kind: 'confetti', n: 30 });
        } else if (key === 'dino') {
          r.innerHTML = `<div class="rv-bronto">${FX.dinoHTML('bronto', { color: 'green', state: 'roar' })}</div>`; FX.sfx.roar(); FX.shakeScreen(4);
          const q = centreOf(wrap); FX.burst(q.x, q.y, { kind: 'confetti', n: 40 }); ctx.flutter(5);
          setTimeout(() => { const d = $('.du-dino', r); if (d) { d.setAttribute('data-base', 'happy'); FX.dinoState(d, 'happy'); } }, 1400);
        } else { r.innerHTML = '<div class="rv-star">⭐</div>'; for (let i = 0; i < 4; i++) setTimeout(() => { const q = centreOf(wrap); FX.burst(q.x + rnd(80) - 40, q.y + rnd(80) - 40, { kind: 'stars', n: 10 }); FX.sfx.sparkle(); }, i * 260); }
        ctx.done(S.title, 2800);
      }
    },
  });
})();
