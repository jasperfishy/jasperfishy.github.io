/* Dino Park games 9–12: Colouring, Dino Café, Dino Dash, Egg Catch. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, SPECIES, COLORS, FX } = window.Park;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ====================================================================== 9. Colouring */
  const PAINTS = ['#ff6b6b', '#ff9f43', '#ffd93d', '#6bcb77', '#2ec4b6', '#4d96ff', '#9b6fe0', '#ff8fc7', '#a0522d', '#ffffff'];
  window.Park.register({
    id: 'color', name: 'Dino Colouring', icon: 'stego', color: '#e0508f', rounds: 3, helper: 'stego', ambient: 'meadow',
    desc: 'Colour in a dinosaur and bring it to life!',
    round(ctx) {
      const sp = ['trex', 'stego', 'tricera'][ctx.round - 1];
      ctx.say('Pick a colour, then tap each part of the dinosaur!');
      const wrap = el('div', 'col-wrap');
      const stage = el('div', 'col-stage', FX.dinoHTML(sp, { color: 'green', state: 'idle' }));
      const dino = stage.firstElementChild;
      const skip = ['#fff', '#ffffff', '#163f42', '#ff8fa3', '#fff4d6'];
      const regions = $$('.d-all path, .d-all ellipse, .d-all circle', dino).filter((n) => {
        const f = (n.getAttribute('fill') || '').toLowerCase();
        return /^#/.test(f) && !skip.includes(f) && !n.closest('clipPath') && !n.closest('.d-eye') && !n.closest('.d-zzz') && !n.closest('.d-smile');
      });
      dino.style.animationPlayState = 'paused';
      $$('.d-all, .d-tail, .d-head, .d-plate, .d-arm, .d-eye', dino).forEach((n) => { n.style.animationPlayState = 'paused'; });
      let color = PAINTS[0], rainbow = false, ri = 0, painted = new Set();
      regions.forEach((r, i) => {
        r.dataset.orig = r.getAttribute('fill'); r.setAttribute('fill', '#f0f0f0'); r.classList.add('region'); r.style.transformBox = 'fill-box'; r.style.transformOrigin = 'center';
        r.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const c = rainbow ? PAINTS[ri++ % (PAINTS.length - 1)] : color;
          r.setAttribute('fill', c); FX.sfx.splash();
          FX.anim(r, [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 300 });
          FX.burst(e.clientX, e.clientY, { kind: 'drops', n: 7, color: c });
          if (!painted.has(i)) { painted.add(i); ctx.good(); }
          counter.textContent = `${painted.size} of ${regions.length} parts coloured`;
          if (painted.size === regions.length) finish();
        });
      });
      const pal = el('div', 'col-pal');
      PAINTS.forEach((c, i) => { const s = el('button', 'swatch' + (i === 0 ? ' on' : '')); s.style.background = c; s.setAttribute('aria-label', 'Colour ' + (i + 1)); s.onclick = () => { color = c; rainbow = false; $$('.swatch', pal).forEach((x) => x.classList.toggle('on', x === s)); FX.sfx.pop(); }; pal.append(s); });
      const rb = el('button', 'swatch rainbow', '🌈'); rb.setAttribute('aria-label', 'Rainbow colours');
      rb.onclick = () => { rainbow = true; $$('.swatch', pal).forEach((x) => x.classList.toggle('on', x === rb)); FX.sfx.sparkle(); }; pal.append(rb);
      const counter = el('div', 'col-count', `0 of ${regions.length} parts coloured`);
      wrap.append(stage, counter, pal); ctx.area.append(wrap);
      async function finish() {
        await sleep(450); if (!ctx.alive()) return;
        $$('.d-all, .d-tail, .d-head, .d-plate, .d-arm, .d-eye', dino).forEach((n) => { n.style.animationPlayState = ''; });
        dino.style.animationPlayState = '';
        FX.dinoState(dino, 'roar', 1200); FX.sfx.roar(); FX.celebrate();
        await sleep(1300); dino.setAttribute('data-base', 'happy'); FX.dinoState(dino, 'happy');
        ctx.done('What a colourful dinosaur! It is alive!', 2300);
      }
    },
  });

  /* ====================================================================== 10. Dino Café */
  const PLANTS = ['🍎', '🥕', '🍓', '🍌', '🥬', '🍇', '🍉', '🍐'], MEATS = ['🍖', '🐟', '🍗', '🥩', '🍤'];
  window.Park.register({
    id: 'feed', name: 'Dino Café', icon: 'raptor', color: '#e0762e', rounds: 3, helper: 'raptor', ambient: 'meadow',
    desc: 'Catch the right food as it rolls past!',
    round(ctx) {
      const need = [3, 4, 5][ctx.round - 1], dur = [9, 7.4, 6.2][ctx.round - 1];
      const sp = pick(SPECIES.filter((s) => s !== 'ptero')), meat = sp === 'trex' || sp === 'raptor';
      const mine = meat ? MEATS : PLANTS, other = meat ? PLANTS : MEATS;
      let want = pick(mine), fed = 0, spawnN = 0, busy = false, forceWant = true;
      ctx.say(`I'm hungry! Catch the ${want} for me!`);
      const cafe = el('div', 'cafe');
      const dinoBox = el('div', 'cafe-dino', FX.dinoHTML(sp, { color: pick(COLORS), state: 'idle' }));
      const order = el('div', 'cafe-order', `<span>I want</span><b>${want}</b>`);
      const hearts = el('div', 'cafe-hearts'); for (let i = 0; i < need; i++) hearts.append(el('i', '', '🤍'));
      const belt = el('div', 'belt'); const track = el('div', 'belt-track'); belt.append(track, el('div', 'belt-roller'));
      cafe.append(order, dinoBox, hearts, belt); ctx.area.append(cafe);
      const dEl = dinoBox.firstElementChild;
      const spawn = () => {
        if (!ctx.alive()) return;
        spawnN++;
        const f = (forceWant || spawnN % 2 === 1) ? want : (Math.random() < .55 ? pick(other) : pick([...mine, '🧦']));
        forceWant = false;
        const it = el('button', 'belt-item', f); it.dataset.f = f; it.style.animationDuration = dur + 's';
        it.setAttribute('aria-label', f === want ? 'The food I want' : 'Food');
        it.onclick = async () => {
          if (busy || it.classList.contains('gone')) return;
          it.classList.add('gone'); it.style.animationPlayState = 'paused';
          if (f !== want) {
            ctx.bad(); FX.dinoState(dEl, 'sad', 900); ctx.say(f === '🧦' ? 'Yuck, a sock!' : `Yuck! I wanted the ${want}!`);
            await FX.flyTo(it, { x: innerWidth * (Math.random() < .5 ? .05 : .95), y: -30 }, { emoji: f, lift: 30, duration: 520, burst: false });
            it.remove(); return;
          }
          busy = true; FX.dinoState(dEl, 'eat');
          await FX.flyTo(it, dinoBox, { emoji: f, size: 44, duration: 520, burst: false });
          it.remove(); FX.sfx.chomp(); fed++;
          $$('i', hearts).forEach((h, i) => { h.textContent = i < fed ? '💖' : '🤍'; });
          const c = centreOf(dinoBox); FX.burst(c.x, c.y - 30, { kind: 'hearts', n: 5 }); ctx.good();
          if (fed >= need) { FX.dinoState(dEl, 'happy'); dEl.setAttribute('data-base', 'happy'); FX.celebrate(); ctx.done('Yum! My tummy is full!', 1800); busy = false; return; }
          want = pick(mine.filter((x) => x !== want));
          forceWant = true; $('b', order).textContent = want; FX.pop(order); ctx.say(`Yum! Now I want a ${want}!`); FX.dinoState(dEl, 'idle');
          busy = false;
        };
        it.addEventListener('animationend', () => it.remove());
        track.append(it);
      };
      const iv = setInterval(() => { if (!ctx.alive()) return clearInterval(iv); spawn(); }, dur * 1000 / 3.6);
      spawn();
    },
  });

  /* ====================================================================== 11. Dino Dash */
  const DASH_THEMES = [
    { sky: ['#8fd8f0', '#e6f7d8'], m1: '#8cc4a6', m2: '#a6d6b4', ground: '#6bbf5f', ground2: '#58a84f', obs: ['🪨', '🌵', '🪵'], len: 3600, amb: 'meadow' },
    { sky: ['#ffb27a', '#ffe3a8'], m1: '#a8604a', m2: '#c4785a', ground: '#9a5b3c', ground2: '#84492f', obs: ['🪨', '🔥', '🌋'], len: 5000, amb: 'volcano' },
    { sky: ['#a6d4f5', '#f2fbff'], m1: '#9ab7d0', m2: '#bcd2e4', ground: '#e8f4fb', ground2: '#cfe6f4', obs: ['⛄', '🪨', '🧊'], len: 6400, amb: 'snow' },
  ];
  window.Park.register({
    id: 'dash', name: 'Dino Dash', icon: 'trex', color: '#2f9e5e', rounds: 3, helper: 'trex', ambient: 'meadow',
    desc: 'Run, jump over things, and collect stars!',
    round(ctx) {
      const T = DASH_THEMES[ctx.round - 1];
      FX.ambient(null);
      ctx.say('Tap anywhere or press Space to JUMP!');
      const wrap = el('div', 'dash-wrap');
      const cv = el('canvas', 'dash-cv'); cv.width = 720; cv.height = 300;
      const sprite = el('div', 'dash-dino', FX.dinoHTML(ctx.round === 2 ? 'raptor' : 'trex', { state: 'run', color: ctx.round === 3 ? 'blue' : 'green' }));
      const hud = el('div', 'dash-hud', '<span id="dStars">⭐ 0</span><div class="dash-prog"><i id="dProg"></i><b>🏁</b></div>');
      wrap.append(cv, sprite, hud); ctx.area.append(wrap);
      const c = cv.getContext('2d'), W = 720, H = 300, GY = 236;
      const dEl = sprite.firstElementChild;
      const P = { y: 0, vy: 0, jumps: 0, x: 0, speed: 250 + ctx.round * 18, stumble: 0, inv: 0, stars: 0 };
      let obs = [], picks = [], nextObs = 520, last = performance.now(), over = false, time = 0;
      const clouds = Array.from({ length: 5 }, () => ({ x: rnd(W), y: 20 + rnd(90), s: .6 + Math.random() }));
      const jump = () => {
        if (over) return;
        if (P.jumps >= 2) return;
        P.vy = P.jumps === 0 ? 560 : 470; P.jumps++; FX.sfx.boing();
        FX.dinoState(dEl, 'happy'); dEl.setAttribute('data-base', 'idle');
      };
      cv.addEventListener('pointerdown', jump); sprite.addEventListener('pointerdown', jump);
      const key = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); } };
      window.addEventListener('keydown', key);
      const stop = () => window.removeEventListener('keydown', key);
      const mtn = (col, off, h, step, sp) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, GY); for (let x = -step; x <= W + step; x += step) { const px = x - ((P.x * sp) % (step * 2)); c.lineTo(px + step / 2, GY - h - (((x / step) | 0) % 2 ? 0 : h * .55)); c.lineTo(px + step, GY - h * .35); } c.lineTo(W + step, GY); c.fill(); };
      function draw() {
        const g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.85)'; clouds.forEach((k) => { const x = ((k.x - P.x * .06 * k.s) % (W + 120) + W + 120) % (W + 120) - 60; c.beginPath(); c.ellipse(x, k.y, 38 * k.s, 13 * k.s, 0, 0, 6.3); c.ellipse(x + 20 * k.s, k.y - 8 * k.s, 24 * k.s, 12 * k.s, 0, 0, 6.3); c.fill(); });
        mtn(T.m1, 0, 90, 120, .15); mtn(T.m2, 0, 56, 90, .32);
        c.fillStyle = T.ground; c.fillRect(0, GY, W, H - GY); c.fillStyle = T.ground2;
        for (let i = -1; i < 18; i++) { const x = i * 48 - (P.x % 48); c.fillRect(x, GY + 14, 28, 5); c.fillRect(x + 20, GY + 40, 22, 4); }
        c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, GY, W, 4);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        obs.forEach((o) => { c.font = '46px serif'; c.fillText(o.e, o.x - P.x + 140, GY + 6); });
        picks.forEach((p) => { if (p.got) return; const bob = Math.sin(time * 5 + p.x) * 4; c.font = '34px serif'; c.fillText(p.e, p.x - P.x + 140, GY - p.h + bob); });
        const fx = T.len - P.x + 140; if (fx < W + 40) { c.fillStyle = '#fff'; c.fillRect(fx, GY - 90, 6, 90); c.fillStyle = '#ff5d5d'; c.fillRect(fx + 6, GY - 90, 40, 26); c.font = '28px serif'; c.fillText('🏁', fx + 26, GY - 66); }
      }
      function frame(now) {
        if (!ctx.alive() || over) { stop(); return; }
        const dt = Math.min(.04, (now - last) / 1000); last = now; time += dt;
        const sp = P.speed * (P.stumble > 0 ? .45 : 1);
        P.x += sp * dt; P.stumble = Math.max(0, P.stumble - dt); P.inv = Math.max(0, P.inv - dt);
        P.vy -= 1500 * dt; P.y += P.vy * dt;
        if (P.y <= 0) { P.y = 0; P.vy = 0; if (P.jumps) { P.jumps = 0; if (!P.stumble) { FX.dinoState(dEl, 'run'); dEl.setAttribute('data-base', 'run'); } } }
        if (P.x > nextObs && P.x < T.len - 500) {
          const e = pick(T.obs); obs.push({ x: P.x + 700, e, w: 30 });
          if (Math.random() < .75) { const st = 90 + rnd(140); picks.push({ x: P.x + 700 + st, e: pick(['⭐', '⭐', '🥚']), h: 70 + rnd(60), got: false }); }
          nextObs = P.x + 260 + rnd(240) - ctx.round * 12;
        }
        if (Math.random() < dt * .6) picks.push({ x: P.x + 700, e: '⭐', h: 30 + rnd(30), got: false });
        obs = obs.filter((o) => o.x - P.x > -200); picks = picks.filter((p) => p.x - P.x > -200);
        const dx = 140;
        obs.forEach((o) => {
          const ox = o.x - P.x + 140;
          if (!P.inv && Math.abs(ox - dx) < 30 && P.y < 38) {
            P.stumble = .8; P.inv = 1.3; ctx.bad(.5); FX.dinoState(dEl, 'sad', 800); FX.shakeScreen(3); FX.sfx.thud();
            ctx.say('Oops! Tap to jump over the next one!');
            const r = sprite.getBoundingClientRect(); FX.burst(r.left + r.width * .6, r.bottom - 10, { kind: 'dust', n: 7 });
            setTimeout(() => { if (ctx.alive() && !P.stumble) { FX.dinoState(dEl, 'run'); dEl.setAttribute('data-base', 'run'); } }, 850);
          }
        });
        picks.forEach((p) => {
          const px = p.x - P.x + 140;
          if (!p.got && Math.abs(px - dx) < 34 && Math.abs(p.h - (P.y + 30)) < 52) {
            p.got = true; P.stars++; $('#dStars').textContent = '⭐ ' + P.stars; FX.sfx.star();
            const r = sprite.getBoundingClientRect(); FX.floatText(r.left + r.width * .6, r.top, '+1'); FX.burst(r.left + r.width * .6, r.top + 10, { kind: 'sparkle', n: 8 });
          }
        });
        $('#dProg').style.width = Math.min(100, P.x / T.len * 100) + '%';
        const scale = cv.clientWidth / W;
        sprite.style.setProperty('--lift', (P.y * scale) + 'px'); sprite.style.setProperty('--sc', scale);
        draw();
        if (P.x >= T.len) { over = true; stop(); FX.dinoState(dEl, 'happy'); dEl.setAttribute('data-base', 'happy'); FX.celebrate(); ctx.done(`You made it to the flag! ${P.stars} stars!`, 2200); return; }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame((t) => { last = t; frame(t); });
    },
  });

  /* ====================================================================== 12. Egg Catch */
  window.Park.register({
    id: 'catch', name: 'Egg Catch', icon: 'ptero', color: '#d19a14', rounds: 3, helper: 'ptero', ambient: 'meadow',
    desc: 'Catch the falling eggs in your basket!',
    round(ctx) {
      const goal = [8, 12, 16][ctx.round - 1], fall = [150, 190, 230][ctx.round - 1];
      ctx.say('Move to catch the eggs! Watch out for rocks!');
      const field = el('div', 'catch-field');
      const fly = el('div', 'catch-flyer', FX.dinoHTML('ptero', { color: 'pink' }));
      const hero = el('div', 'catch-hero', FX.dinoHTML(pick(['stego', 'tricera', 'bronto']), { color: pick(COLORS), state: 'idle' }) + '<span class="catch-basket">🧺</span>');
      const hud = el('div', 'catch-hud', `🥚 <b id="cN">0</b> / ${goal}`);
      field.append(fly, hero, hud); ctx.area.append(field);
      const hEl = hero.querySelector('.du-dino');
      let fw = field.clientWidth, x = fw / 2, target = fw / 2, got = 0, items = [], spawnT = .5, last = performance.now(), over = false, pxFly = 0, dir = 1, still = 0;
      const place = (cx) => { target = Math.max(50, Math.min(field.clientWidth - 50, cx - field.getBoundingClientRect().left)); };
      field.addEventListener('pointermove', (e) => place(e.clientX)); field.addEventListener('pointerdown', (e) => place(e.clientX));
      const key = (e) => { if (e.key === 'ArrowLeft') target -= 70; if (e.key === 'ArrowRight') target += 70; target = Math.max(50, Math.min(field.clientWidth - 50, target)); };
      window.addEventListener('keydown', key);
      const EGGS = ['🥚', '🥚', '🥚', '🌟'];
      function frame(now) {
        if (!ctx.alive() || over) { window.removeEventListener('keydown', key); return; }
        const dt = Math.min(.04, (now - last) / 1000); last = now; fw = field.clientWidth; const fh = field.clientHeight;
        const prev = x; x += (target - x) * Math.min(1, dt * 8);
        const moving = Math.abs(x - prev) > .6;
        if (moving) { still = 0; hEl.setAttribute('data-state', 'walk'); hEl.classList.toggle('d-flip', x < prev); } else if (++still > 6) hEl.setAttribute('data-state', hEl.getAttribute('data-base') || 'idle');
        hero.style.transform = `translateX(${x - 55}px)`;
        pxFly += dir * dt * (110 + ctx.round * 20); if (pxFly > fw - 80) dir = -1; if (pxFly < 0) dir = 1;
        fly.style.transform = `translateX(${pxFly}px) scaleX(${dir})`;
        spawnT -= dt;
        if (spawnT <= 0) {
          const rock = Math.random() < .17 + ctx.round * .03, e = rock ? '🪨' : pick(EGGS);
          const n = el('div', 'catch-egg', e); n.dataset.rock = rock ? 1 : 0; const sx = pxFly + 40; n.style.transform = `translate(${sx}px,40px)`;
          field.append(n); items.push({ n, x: sx, y: 40, rock, e, vy: fall * (.85 + Math.random() * .3) }); spawnT = .62 - ctx.round * .06 + Math.random() * .4;
        }
        const catchY = fh - 120;
        items = items.filter((it) => {
          it.y += it.vy * dt; it.n.style.transform = `translate(${it.x - 18}px,${it.y}px) rotate(${it.y * .4}deg)`;
          if (it.y > catchY && it.y < catchY + 40 && Math.abs(it.x - x) < 52) {
            it.n.remove();
            const r = hero.getBoundingClientRect();
            if (it.rock) { ctx.bad(.5); FX.dinoState(hEl, 'sad', 700); FX.shakeScreen(3); FX.sfx.thud(); ctx.say('Ouch! A rock! Let it fall!'); FX.burst(r.left + r.width / 2, r.top, { kind: 'dust', n: 6 }); }
            else { got += it.e === '🌟' ? 2 : 1; $('#cN').textContent = Math.min(got, goal); FX.sfx.star(); FX.burst(r.left + r.width / 2, r.top, { kind: 'stars', n: it.e === '🌟' ? 10 : 5, scale: .8 }); FX.pop($('#cN').parentElement); if (got >= goal && !over) { over = true; FX.celebrate(); FX.dinoState(hEl, 'happy'); ctx.done('Basket full! What a great catch!', 1800); } }
            return false;
          }
          if (it.y > fh - 30) { it.n.remove(); if (!it.rock) { const r = field.getBoundingClientRect(); FX.burst(r.left + it.x, r.bottom - 20, { kind: 'dust', n: 3, scale: .6 }); } return false; }
          return true;
        });
        requestAnimationFrame(frame);
      }
      requestAnimationFrame((t) => { last = t; frame(t); });
    },
  });
})();
