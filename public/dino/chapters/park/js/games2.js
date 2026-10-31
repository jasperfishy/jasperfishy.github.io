/* Dino Park games 5–8: Memory, Size Parade, Counting, Dot-to-Dot. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, drag, hit, SPECIES, COLORS, FX } = window.Park;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ====================================================================== 5. Dino Memory */
  window.Park.register({
    id: 'memory', name: 'Dino Memory', icon: 'trex', color: '#e08a2e', rounds: 3, helper: 'trex', ambient: 'meadow',
    desc: 'Remember where the dinosaurs hide!',
    round(ctx) {
      const pairs = [3, 4, 6][ctx.round - 1], peek = [2400, 2000, 2400][ctx.round - 1];
      const combos = shuffle(SPECIES.flatMap((s) => shuffle(COLORS).slice(0, 2).map((c) => ({ s, c })))).slice(0, pairs);
      const deck = shuffle([...combos, ...combos].map((d, i) => ({ ...d, k: d.s + d.c, id: i })));
      ctx.say('Look carefully! Remember where each dinosaur hides.');
      const grid = el('div', 'mem-grid'); grid.style.setProperty('--cols', pairs === 3 ? 3 : 4);
      let first = null, locked = true, matched = 0, combo = 0;
      const cards = deck.map((d) => {
        const b = el('button', 'mem-card flipped');
        b.dataset.k = d.k; b.setAttribute('aria-label', 'Hidden dinosaur card');
        b.innerHTML = `<span class="mc-inner"><span class="mc-face mc-back"><i></i><i></i><i></i></span><span class="mc-face mc-front">${FX.dinoHTML(d.s, { color: d.c, state: 'idle' })}</span></span>`;
        b.onclick = async () => {
          if (locked || b.classList.contains('flipped') || b.classList.contains('matched')) return;
          b.classList.add('flipped'); FX.sfx.pop();
          if (!first) { first = b; return; }
          const a = first; first = null; locked = true;
          await sleep(520);
          if (!ctx.alive()) return;
          if (a.dataset.k === b.dataset.k) {
            combo++; matched++;
            [a, b].forEach((x) => { x.classList.add('matched'); FX.dinoState(x.querySelector('.du-dino'), 'happy'); });
            ctx.good();
            const c = centreOf(b); FX.burst(c.x, c.y, { kind: 'hearts', n: 8 }); if (combo > 1) FX.floatText(c.x, c.y - 30, combo + ' in a row!');
            ctx.say(combo > 1 ? `${combo} in a row! You are amazing!` : 'A match! Great memory!');
            locked = false;
            if (matched === pairs) { FX.celebrate(); ctx.done('You found every pair!', 1700); }
          } else {
            combo = 0; ctx.bad(); FX.shake(a); FX.shake(b); ctx.say('Not a match. Remember where they are!');
            await sleep(750);
            if (!ctx.alive()) return;
            a.classList.remove('flipped'); b.classList.remove('flipped'); FX.sfx.tap();
            locked = false;
          }
        };
        grid.append(b); return b;
      });
      ctx.area.append(grid);
      (async () => {
        await sleep(peek);
        if (!ctx.alive()) return;
        cards.forEach((c) => c.classList.remove('flipped')); FX.sfx.whoosh();
        ctx.say('Now find the matching pairs!');
        await sleep(450);
        locked = false;
      })();
    },
  });

  /* ====================================================================== 6. Size Parade */
  window.Park.register({
    id: 'sort', name: 'Size Parade', icon: 'bronto', color: '#3d9bd6', rounds: 3, helper: 'bronto', helperColor: 'blue', ambient: 'meadow',
    desc: 'Put the dinosaurs in a line, smallest to biggest!',
    round(ctx) {
      const k = [3, 4, 5][ctx.round - 1], desc = ctx.round === 3;
      const sp = pick(SPECIES.filter((s) => s !== 'ptero')), col = pick(COLORS);
      const sizes = [58, 82, 108, 134, 160].slice(0, k);
      ctx.say(desc ? 'This time the BIGGEST goes first!' : 'Smallest first! Drag them into the line.');
      const line = el('div', 'par-line');
      const order = desc ? [...sizes].reverse() : sizes;
      const slots = order.map((sz, i) => {
        const s = el('div', 'par-slot'); s.dataset.size = sz; s.style.width = (sz + 22) + 'px'; s.style.height = (Math.round(sz * .78) + 30) + 'px';
        s.innerHTML = `<b>${i + 1}</b>` + (ctx.round < 3 ? `<span class="ghost" style="width:${sz}px">${FX.dinoHTML(sp, { color: 'blue', state: 'idle' })}</span>` : '');
        line.append(s); return s;
      });
      const tray = el('div', 'par-tray');
      let done = 0;
      shuffle(sizes).forEach((sz) => {
        const d = el('div', 'par-dino'); d.dataset.size = sz; d.style.width = sz + 'px';
        d.innerHTML = FX.dinoHTML(sp, { color: col, state: 'idle' });
        const place = (slot) => {
          if (!slot || slot.firstElementChild && slot.querySelector('.par-dino')) return false;
          if (Number(slot.dataset.size) !== sz) { ctx.bad(); FX.shake(slot); ctx.say(sz > Number(slot.dataset.size) ? 'That one is too big for this spot!' : 'That one is too small for this spot!', 'sad'); return false; }
          d.classList.add('locked', 'placed'); d.style.transform = ''; slot.append(d); slot.classList.add('filled');
          ctx.good(); const c = centreOf(slot); FX.burst(c.x, c.y, { kind: 'sparkle', n: 10 }); FX.sfx.boing();
          if (++done === k) parade();
          return true;
        };
        drag(d, {
          over: (x, y) => slots.forEach((s) => s.classList.toggle('hot', s === hit(slots, x, y) && !s.querySelector('.par-dino'))),
          drop: (x, y) => place(hit(slots, x, y, 6)),
          tap: () => { $$('.par-dino', tray).forEach((q) => q.classList.remove('sel')); d.classList.add('sel'); tray._sel = { d, place }; },
        });
        tray.append(d);
      });
      slots.forEach((s) => s.addEventListener('click', () => { const sel = tray._sel; if (sel && !sel.d.classList.contains('locked') && sel.place(s)) tray._sel = null; }));
      ctx.area.append(line, tray);
      async function parade() {
        await sleep(400);
        if (!ctx.alive()) return;
        ctx.say('Parade time! Roar roar roar!');
        line.classList.add('marching');
        $$('.par-dino', line).forEach((d, i) => { FX.dinoState(d.firstElementChild, 'walk'); d.firstElementChild.setAttribute('data-base', 'walk'); d.style.animationDelay = i * .12 + 's'; });
        FX.sfx.drum(0); setTimeout(() => FX.sfx.drum(1), 300); setTimeout(() => FX.sfx.drum(0), 600); setTimeout(() => FX.sfx.drum(2), 900);
        FX.celebrate();
        ctx.done('What a wonderful parade!', 2600);
      }
    },
  });

  /* ====================================================================== 7. Counting */
  window.Park.register({
    id: 'count', name: 'Snack Time', icon: 'tricera', color: '#e05a7a', rounds: 4, helper: 'tricera', ambient: 'meadow',
    desc: 'Feed the hungry dinosaur the right number of berries!',
    round(ctx) {
      const n = [3, 5, 7, 10][ctx.round - 1], sp = pick(SPECIES.filter((s) => s !== 'ptero')), tricky = ctx.round >= 3;
      ctx.say(`I'm hungry! Please give me ${n} berries!`);
      const stage = el('div', 'cnt-stage');
      const bubble = el('div', 'cnt-bubble', `<b>${n}</b><span>${Array.from({ length: n }, () => '<i>●</i>').join('')}</span>`);
      if (ctx.round === 4) $('span', bubble).style.display = 'none';
      const dinoBox = el('div', 'cnt-dino', FX.dinoHTML(sp, { color: pick(COLORS), state: 'idle' }));
      const counter = el('div', 'cnt-counter', '0');
      const line = el('div', 'cnt-line'); for (let i = 1; i <= n; i++) line.append(el('span', 'cnt-dot', String(i)));
      stage.append(bubble, dinoBox, counter);
      const pile = el('div', 'cnt-pile');
      const foods = tricky ? shuffle([...Array(n + 4).fill('🍓'), '🪨', '🧦', '🪨', '🧦']) : Array(n + 3).fill('🍓');
      let fed = 0, busy = false;
      foods.forEach((f) => {
        const b = el('button', 'cnt-food', f); b.setAttribute('aria-label', f === '🍓' ? 'Berry' : 'Not food');
        b.style.setProperty('--r', (Math.random() * 20 - 10).toFixed(0) + 'deg');
        b.onclick = async () => {
          if (busy || b.classList.contains('used') || fed >= n) return;
          const dEl = dinoBox.firstElementChild;
          if (f !== '🍓') {
            busy = true; ctx.bad(); FX.dinoState(dEl, 'sad', 800); ctx.say('Yuck! I only eat berries!'); FX.sfx.bad();
            await FX.flyTo(b, { x: innerWidth * (Math.random() < .5 ? .1 : .9), y: -30 }, { emoji: f, lift: 40, duration: 500, burst: false });
            b.classList.add('used'); busy = false; return;
          }
          busy = true; b.classList.add('used');
          FX.dinoState(dEl, 'eat');
          await FX.flyTo(b, dinoBox, { emoji: '🍓', size: 40, duration: 520, burst: false });
          FX.sfx.chomp(); fed++;
          const c = centreOf(dinoBox); FX.burst(c.x, c.y - 20, { kind: 'hearts', n: 3 });
          counter.textContent = fed; FX.pop(counter);
          $$('.cnt-dot', line).forEach((d, i) => d.classList.toggle('on', i < fed));
          dEl.style.setProperty('--belly', 1 + fed * .012);
          ctx.say(fed < n ? `${fed}! ${n - fed} more please!` : `${n}! Yum yum yum!`);
          if (fed === n) { FX.dinoState(dEl, 'happy'); dEl.setAttribute('data-base', 'happy'); FX.celebrate(); ctx.done(`You counted to ${n}! Thank you!`, 1800); }
          else FX.dinoState(dEl, 'idle');
          busy = false;
        };
        pile.append(b);
      });
      ctx.area.append(stage, line, pile);
    },
  });

  /* ====================================================================== 8. Dot to Dot */
  const eggPts = Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return [200 + 82 * Math.sin(t) * (1 - .12 * Math.cos(t)), 160 - 105 * Math.cos(t)]; });
  const starPts = Array.from({ length: 10 }, (_, i) => { const t = (i / 10) * Math.PI * 2, r = i % 2 ? 50 : 115; return [200 + r * Math.sin(t), 165 - r * Math.cos(t)]; });
  const SHAPES = {
    volcano: { pts: [[60, 262], [118, 168], [158, 96], [184, 64], [204, 86], [226, 64], [252, 98], [292, 168], [350, 262]], fill: '#8a5d44', title: 'A volcano!' },
    egg: { pts: eggPts, fill: '#ffe9b8', title: 'A dinosaur egg!' },
    star: { pts: starPts, fill: '#ffd54f', title: 'A shining star!' },
  };
  window.Park.register({
    id: 'dots', name: 'Dot to Dot', icon: 'ptero', color: '#8e5bd1', rounds: 3, helper: 'ptero', ambient: 'night',
    desc: 'Join the dots in order and watch a surprise appear!',
    round(ctx) {
      const key = ['volcano', 'egg', 'star'][ctx.round - 1], S = SHAPES[key], pts = S.pts;
      ctx.say('Touch the dots in order, starting at number 1!');
      const wrap = el('div', 'dots-wrap');
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 400 300'); svg.setAttribute('class', 'dots-svg');
      const fillEl = document.createElementNS(ns, 'polygon'); fillEl.setAttribute('class', 'dots-fill'); fillEl.setAttribute('fill', S.fill); fillEl.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
      const lines = document.createElementNS(ns, 'g');
      const trail = document.createElementNS(ns, 'line'); trail.setAttribute('class', 'dots-trail');
      svg.append(fillEl, lines, trail);
      const dots = pts.map((p, i) => {
        const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'dot' + (i === 0 ? ' next' : '')); g.setAttribute('transform', `translate(${p[0]} ${p[1]})`); g.dataset.i = i;
        g.innerHTML = `<circle r="19" class="ring"/><circle r="15" class="body"/><text y="6" text-anchor="middle">${i + 1}</text>`;
        svg.append(g); return g;
      });
      wrap.append(svg); ctx.area.append(wrap);
      let next = 0, down = false;
      const toSvg = (e) => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * 400 / r.width, (e.clientY - r.top) * 300 / r.height]; };
      const line = (a, b) => { const l = document.createElementNS(ns, 'line'); l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]); l.setAttribute('class', 'dots-line'); const len = Math.hypot(b[0] - a[0], b[1] - a[1]); l.style.strokeDasharray = len; l.style.strokeDashoffset = len; lines.append(l); l.getBoundingClientRect(); l.style.strokeDashoffset = 0; };
      const connect = async () => {
        const i = next;
        dots[i].classList.remove('next'); dots[i].classList.add('on'); FX.sfx.note(i * 2 % 12, .25); ctx.good();
        const c = centreOf(dots[i]); FX.burst(c.x, c.y, { kind: 'sparkle', n: 6 });
        if (i > 0) line(pts[i - 1], pts[i]);
        next++;
        if (next < pts.length) { dots[next].classList.add('next'); trail.style.display = 'none'; ctx.say(next === 1 ? 'Now number 2!' : `Great! Now ${next + 1}!`); return; }
        line(pts[pts.length - 1], pts[0]); down = false; trail.style.display = 'none';
        await sleep(500); if (!ctx.alive()) return;
        fillEl.classList.add('show'); FX.sfx.win(); ctx.say(S.title);
        await sleep(500); if (!ctx.alive()) return;
        reveal();
      };
      const near = (e) => { const p = toSvg(e), t = pts[next]; return t && Math.hypot(p[0] - t[0], p[1] - t[1]) < 30; };
      svg.addEventListener('pointerdown', (e) => { down = true; svg.setPointerCapture(e.pointerId); if (near(e)) connect(); });
      svg.addEventListener('pointermove', (e) => {
        if (!down || next >= pts.length) return;
        if (next > 0) { const p = toSvg(e), a = pts[next - 1]; trail.setAttribute('x1', a[0]); trail.setAttribute('y1', a[1]); trail.setAttribute('x2', p[0]); trail.setAttribute('y2', p[1]); trail.style.display = ''; }
        if (near(e)) connect();
      });
      svg.addEventListener('pointerup', () => { down = false; trail.style.display = 'none'; });
      dots.forEach((g, i) => g.addEventListener('click', () => { if (i === next) connect(); else if (i > next) { ctx.bad(.34); FX.shake(g); ctx.say(`Not yet! Find number ${next + 1} first.`); } }));
      function reveal() {
        const r = el('div', 'dots-reveal'); wrap.append(r);
        if (key === 'volcano') {
          r.innerHTML = `<div class="rv-ptero">${FX.dinoHTML('ptero', { color: 'pink' })}</div>`; FX.sfx.roar();
          let n = 0; const iv = setInterval(() => { if (!ctx.alive() || ++n > 14) return clearInterval(iv); const q = centreOf(dots[3]); FX.burst(q.x, q.y, { kind: 'embers', n: 14, angle: -Math.PI / 2, spread: .9, power: 2.2 }); }, 160);
        } else if (key === 'egg') {
          const baby = pick(SPECIES.filter((s) => s !== 'ptero'));
          r.innerHTML = `<div class="rv-baby">${FX.dinoHTML(baby, { color: pick(COLORS), state: 'happy' })}</div>`; FX.sfx.chirp();
          const q = centreOf(wrap); FX.burst(q.x, q.y, { kind: 'confetti', n: 30 });
        } else { r.innerHTML = '<div class="rv-star">⭐</div>'; for (let i = 0; i < 4; i++) setTimeout(() => { const q = centreOf(wrap); FX.burst(q.x + rnd(80) - 40, q.y + rnd(80) - 40, { kind: 'stars', n: 10 }); FX.sfx.sparkle(); }, i * 260); }
        ctx.done(S.title, 2600);
      }
    },
  });
})();
