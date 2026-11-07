/* Dino Park games 9–12: Colouring, Dino Café, Dino Dash, Egg Catch. */
(function () {
  'use strict';
  const { $, $$, rnd, pick, shuffle, sleep, el, SPECIES, COLORS, FX } = window.Park;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ====================================================================== 9. Colouring */
  const PAINTS = ['#ff6b6b', '#ff9f43', '#ffd93d', '#6bcb77', '#2ec4b6', '#4d96ff', '#9b6fe0', '#ff8fc7', '#a0522d', '#ffffff'];
  const PAINT_NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Teal', 'Blue', 'Purple', 'Pink', 'Brown', 'White'];
  const STICKERS = ['⭐', '🌸', '🦋', '🌈', '🍓', '☀️', '🎈', '💖', '🍄', '🐞'];
  let colSpecies = [], colGallery = [];
  window.Park.register({
    id: 'color', name: 'Dino Colouring', icon: 'stego', color: '#e0508f', rounds: 4, helper: 'stego', ambient: 'meadow',
    desc: 'Colour in a dinosaur, add stickers and bring it to life!',
    round(ctx) {
      if (ctx.round === 1) { colSpecies = shuffle(['trex', 'stego', 'tricera', 'bronto', 'raptor']).slice(0, 4); colGallery = []; }
      const sp = colSpecies[ctx.round - 1];
      // Rounds 2-4 each add a gentle painter's challenge for a bonus star.
      const target = ctx.round === 4 ? 6 + rnd(2) : -1;   // index of the colour to use everywhere
      const mission = [null, { n: 3, text: 'Bonus: use 3 different colours!' }, { n: 5, text: 'Bonus: make a rainbow dino with 5 colours!' }, { one: target, text: `Bonus: paint the whole dinosaur ${PAINT_NAMES[target] && PAINT_NAMES[target].toUpperCase()}!` }][ctx.round - 1];
      ctx.say('Pick a colour, then tap each part of the dinosaur!');
      const wrap = el('div', 'col-wrap');
      const gal = el('div', 'col-gallery');
      for (let i = 0; i < ctx.rounds; i++) { const f = el('span', 'cg-frame' + (colGallery[i] ? ' full' : '')); if (colGallery[i]) f.append(colGallery[i].cloneNode(true)); gal.append(f); }
      const stage = el('div', 'col-stage', FX.dinoHTML(sp, { color: 'green', state: 'idle' }));
      const dino = stage.firstElementChild;
      const skip = ['#fff', '#ffffff', '#163f42', '#ff8fa3', '#fff4d6'];
      const regions = $$('.d-all path, .d-all ellipse, .d-all circle', dino).filter((n) => {
        const f = (n.getAttribute('fill') || '').toLowerCase();
        return /^#/.test(f) && !skip.includes(f) && !n.closest('clipPath') && !n.closest('.d-eye') && !n.closest('.d-zzz') && !n.closest('.d-smile');
      });
      dino.style.animationPlayState = 'paused';
      $$('.d-all, .d-tail, .d-head, .d-plate, .d-arm, .d-eye', dino).forEach((n) => { n.style.animationPlayState = 'paused'; });
      let color = PAINTS[0], ci = 0, rainbow = false, ri = 0, eraser = false; const painted = new Map(), used = new Set(); let phase = 'paint', stickers = 0, stickerSel = null;
      const need = Math.ceil(regions.length * .85);   // the magic finishes the last few tiny parts
      const update = () => { counter.textContent = phase === 'paint' ? `${Math.min(100, Math.round(painted.size / need * 100))}% coloured` : `${stickers} sticker${stickers === 1 ? '' : 's'} placed`; if (bar) bar.style.width = Math.min(100, painted.size / need * 100) + '%'; };
      // One painting function for taps and for dragging the brush across the picture.
      const paintRegion = (r, x, y) => {
        const i = regions.indexOf(r); if (i < 0 || phase !== 'paint') return;
        if (eraser) { if (painted.has(i)) { r.setAttribute('fill', '#f0f0f0'); painted.delete(i); FX.sfx.whoosh(); update(); } return; }
        const idx = rainbow ? (ri++ % (PAINTS.length - 1)) : ci, c = PAINTS[idx];
        if (r.getAttribute('fill') === c && painted.has(i)) return;
        r.setAttribute('fill', c); FX.sfx.splash(); FX.sfx.note(idx, .12);
        FX.anim(r, [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 300 });
        FX.burst(x, y, { kind: 'drops', n: 5, color: c });
        const fresh = !painted.has(i); painted.set(i, idx); used.add(idx);
        if (fresh) ctx.good({ x, y });
        update();
        if (painted.size >= need) allPainted();
      };
      regions.forEach((r) => { r.dataset.orig = r.getAttribute('fill'); r.setAttribute('fill', '#f0f0f0'); r.classList.add('region'); r.style.transformBox = 'fill-box'; r.style.transformOrigin = 'center'; });
      let brush = false;
      let last = null;
      stage.addEventListener('pointerdown', (e) => { if (phase !== 'paint') return; brush = true; last = [e.clientX, e.clientY]; const t = e.target.closest && e.target.closest('.region'); if (t) { e.preventDefault(); paintRegion(t, e.clientX, e.clientY); } });
      // Sweep along the stroke in small steps so a quick swipe still paints every part it crosses.
      stage.addEventListener('pointermove', (e) => {
        if (!brush || phase !== 'paint') return;
        const a = last || [e.clientX, e.clientY], n = Math.max(1, Math.ceil(Math.hypot(e.clientX - a[0], e.clientY - a[1]) / 10));
        for (let k = 1; k <= n; k++) { const x = a[0] + (e.clientX - a[0]) * k / n, y = a[1] + (e.clientY - a[1]) * k / n, t = document.elementFromPoint(x, y); if (t && t.classList && t.classList.contains('region')) paintRegion(t, x, y); }
        last = [e.clientX, e.clientY];
      });
      window.addEventListener('pointerup', () => { brush = false; });
      const pal = el('div', 'col-pal');
      PAINTS.forEach((c, i) => { const s = el('button', 'swatch' + (i === 0 ? ' on' : '')); s.style.background = c; s.setAttribute('aria-label', PAINT_NAMES[i]); s.onclick = () => { color = c; ci = i; rainbow = false; eraser = false; $$('.swatch', pal).forEach((x) => x.classList.toggle('on', x === s)); FX.sfx.pop(); ctx.say(`${PAINT_NAMES[i]}! Tap a part to paint it.`); }; pal.append(s); });
      const rb = el('button', 'swatch rainbow', '🌈'); rb.setAttribute('aria-label', 'Rainbow colours');
      rb.onclick = () => { rainbow = true; eraser = false; $$('.swatch', pal).forEach((x) => x.classList.toggle('on', x === rb)); FX.sfx.sparkle(); ctx.say('Rainbow paint! Every tap is a new colour.'); }; pal.append(rb);
      const er = el('button', 'swatch eraser', '🧽'); er.setAttribute('aria-label', 'Rubber');
      er.onclick = () => { eraser = true; rainbow = false; $$('.swatch', pal).forEach((x) => x.classList.toggle('on', x === er)); FX.sfx.tap(); ctx.say('The rubber wipes a part clean.'); }; pal.append(er);
      const counter = el('div', 'col-count', '0% coloured'), barWrap = el('div', 'col-bar', '<i></i>'), bar = barWrap.firstChild;
      const goal = mission ? el('div', 'col-goal', '🎯 ' + mission.text) : null;
      const tray = el('div', 'col-stickers hidden');
      const doneBtn = el('button', 'btn small hidden', '✓ All done!');
      wrap.append(gal, ...(goal ? [goal] : []), stage, barWrap, counter, pal, tray, doneBtn); ctx.area.append(wrap);
      ctx.hint(() => {
        const left = regions.find((_, i) => !painted.has(i)); if (!left || phase !== 'paint') return;
        left.classList.add('pulse'); FX.sfx.sparkle(); setTimeout(() => left.classList.remove('pulse'), 2500);
      });
      // Stage 2: every part is coloured, so the child decorates with stickers.
      function allPainted() {
        if (phase !== 'paint') return;
        phase = 'stickers'; brush = false;
        // A wave of colour finishes any tiny parts that were left.
        const left = regions.filter((_, i) => !painted.has(i)), usedList = [...used];
        left.forEach((r, k) => setTimeout(() => { if (ctx.alive()) { r.setAttribute('fill', PAINTS[usedList[k % usedList.length]]); } }, 60 + k * 50));
        if (left.length) { FX.sfx.sparkle(); ctx.life.flutter(2); } $$('.swatch', pal).forEach((x) => { x.disabled = true; }); pal.classList.add('off');
        FX.sfx.win(); ctx.say('All coloured! Pick a sticker, then tap the picture to stick it.'); update(); ctx.hint(null);
        if (mission && (mission.n ? used.size >= mission.n : [...painted.values()].every((v) => v === mission.one))) ctx.bonus(1, stage, 'Painter bonus!');
        barWrap.classList.add('full');
        STICKERS.forEach((e) => { const b = el('button', 'sticker', e); b.onclick = () => { stickerSel = e; $$('.sticker', tray).forEach((x) => x.classList.toggle('on', x === b)); FX.sfx.pop(); }; tray.append(b); });
        tray.classList.remove('hidden'); FX.pop(tray); stickerSel = STICKERS[0]; tray.firstChild.classList.add('on');
        stage.classList.add('stick');
      }
      stage.addEventListener('pointerdown', (e) => {
        if (phase !== 'stickers' || !stickerSel) return;
        const r = stage.getBoundingClientRect(), s = el('span', 'placed-sticker', stickerSel);
        s.style.left = ((e.clientX - r.left) / r.width * 100) + '%'; s.style.top = ((e.clientY - r.top) / r.height * 100) + '%'; s.style.setProperty('--rot', (rnd(40) - 20) + 'deg');
        stage.append(s); FX.pop(s); FX.sfx.pop(); FX.sfx.note(stickers + 4, .15); FX.burst(e.clientX, e.clientY, { kind: 'sparkle', n: 6 });
        stickers++; update();
        if (stickers === 3) { doneBtn.classList.remove('hidden'); FX.pop(doneBtn); ctx.say('Lovely! Add more, or press All done!'); }
      });
      doneBtn.onclick = () => { if (phase === 'stickers') finish(); };
      async function finish() {
        phase = 'done'; tray.classList.add('hidden'); doneBtn.classList.add('hidden'); stage.classList.remove('stick');
        // A camera flash, then the dinosaur wakes up and walks into the gallery.
        FX.sfx.pop(); const flash = el('div', 'col-flash'); stage.append(flash);
        await sleep(350); if (!ctx.alive()) return;
        $$('.d-all, .d-tail, .d-head, .d-plate, .d-arm, .d-eye', dino).forEach((n) => { n.style.animationPlayState = ''; });
        dino.style.animationPlayState = '';
        FX.dinoState(dino, 'roar', 1200); FX.sfx.roar(); FX.celebrate(); ctx.flutter(4);
        await sleep(1300); dino.setAttribute('data-base', 'happy'); FX.dinoState(dino, 'happy');
        const frame = gal.children[ctx.round - 1], pic = stage.cloneNode(true); pic.classList.remove('stick'); $$('.col-flash', pic).forEach((n) => n.remove());
        colGallery[ctx.round - 1] = pic;
        if (frame) { FX.flyTo(stage, frame, { emoji: '🖼️', size: 34, duration: 800 }); setTimeout(() => { frame.append(pic.cloneNode(true)); frame.classList.add('full'); FX.pop(frame); }, 800); }
        ctx.done('What a colourful dinosaur! It is alive!', 2300);
      }
    },
  });

  /* ====================================================================== 10. Dino Café */
  const PLANTS = ['🍎', '🥕', '🍓', '🍌', '🥬', '🍇', '🍉', '🍐'], MEATS = ['🍖', '🐟', '🍗', '🥩', '🍤'];
  window.Park.register({
    id: 'feed', name: 'Dino Café', icon: 'raptor', color: '#e0762e', rounds: 4, helper: 'raptor', ambient: 'meadow',
    desc: 'Catch the right food as it rolls past!',
    round(ctx) {
      // The belt is moved by script (not a CSS animation) so it still plays for children who use "reduce motion".
      const R = ctx.round, two = R >= 3, need = [3, 4, 3, 4][R - 1], speed = [95, 115, 120, 145][R - 1];
      const sps = shuffle(SPECIES.filter((s) => s !== 'ptero'));
      const eaters = (two ? [0, 1] : [0]).map((i) => ({ i, sp: sps[i], mine: (sps[i] === 'trex' || sps[i] === 'raptor') ? MEATS : PLANTS, want: null, fed: 0 }));
      const pickWant = (e) => { const taken = eaters.filter((x) => x !== e).map((x) => x.want); return pick(e.mine.filter((f) => f !== e.want && !taken.includes(f))); };
      eaters.forEach((e) => { e.want = pickWant(e); });
      const sayOrder = () => ctx.say(two ? `Two hungry friends! Catch ${eaters.filter((e) => e.fed < need).map((e) => e.want).join(' and ')} for them!` : `I'm hungry! Catch the ${eaters[0].want} for me!`);
      sayOrder();
      const cafe = el('div', 'cafe' + (two ? ' two' : ''));
      cafe.append(el('div', 'cafe-sign', 'DINO CAFÉ'), el('div', 'cafe-lights', '<i></i><i></i><i></i><i></i><i></i><i></i>'));
      eaters.forEach((e) => {
        e.box = el('div', 'cafe-guest' + (e.i === 1 ? ' g2' : ''));
        e.order = el('div', 'cafe-order', `<span>I want</span><b>${e.want}</b>`);
        e.dinoBox = el('div', 'cafe-dino', FX.dinoHTML(e.sp, { color: pick(COLORS), state: 'idle' }));
        e.hearts = el('div', 'cafe-hearts'); for (let i = 0; i < need; i++) e.hearts.append(el('i', '', '🤍'));
        e.box.append(e.order, e.dinoBox, e.hearts); cafe.append(e.box);
        e.dEl = e.dinoBox.firstElementChild;
      });
      const belt = el('div', 'belt'); const track = el('div', 'belt-track'); belt.append(el('div', 'belt-roller'));
      cafe.append(belt, track); ctx.area.append(cafe);
      const live = [];             // items riding the belt: { el, x, f, kind }
      let spawnN = 0, sinceSpawn = 9999, busy = false, last = performance.now(), over = false;
      const beltW = () => cafe.clientWidth;
      const wantedNow = () => eaters.filter((e) => e.fed < need).map((e) => e.want);
      const spawn = () => {
        spawnN++;
        const open = eaters.filter((e) => e.fed < need);
        let f, kind = 'food';
        if (spawnN % 2 === 1 || spawnN === 2) f = pick(open).want;
        else if (R >= 2 && Math.random() < .16) { f = '🌟'; kind = 'gold'; }
        else if (Math.random() < .3) { f = '🧦'; kind = 'sock'; }
        else { const wants = wantedNow(); const pool = [...PLANTS, ...MEATS].filter((x) => !wants.includes(x)); f = pick(pool); }
        const it = el('button', 'belt-item' + (kind === 'gold' ? ' gold' : ''), f); it.dataset.f = f;
        it.setAttribute('aria-label', kind === 'gold' ? 'Golden star' : wantedNow().includes(f) ? 'Food someone wants' : 'Food');
        const o = { el: it, x: -90, f, kind };
        it.onclick = () => take(o);
        track.append(it); live.push(o); FX.pop(it);
      };
      const remove = (o) => { const i = live.indexOf(o); if (i >= 0) live.splice(i, 1); o.el.remove(); };
      async function take(o) {
        if (busy || !live.includes(o)) return;
        const eater = eaters.find((e) => e.fed < need && e.want === o.f);
        if (o.kind === 'gold') { remove(o); FX.sfx.sparkle(); ctx.bonus(1, o.el, 'Golden!'); return; }
        if (!eater) {
          // Not what anybody ordered: it hops off the belt with a kind word.
          busy = true; live.splice(live.indexOf(o), 1); o.el.style.visibility = 'hidden';
          const e0 = eaters.find((e) => e.fed < need);
          ctx.bad(.5, o.el); FX.dinoState(e0.dEl, 'sad', 900);
          ctx.say(o.kind === 'sock' ? 'Yuck, a sock! Dinosaurs do not eat socks!' : `Not that one! I wanted the ${wantedNow().join(' or the ')}!`);
          await Park.fly(o.el, { x: innerWidth * (Math.random() < .5 ? .05 : .95), y: -30 }, { emoji: o.f, lift: 30, duration: 520, burst: false });
          o.el.remove(); busy = false; return;
        }
        busy = true; live.splice(live.indexOf(o), 1); o.el.style.visibility = 'hidden';
        FX.dinoState(eater.dEl, 'eat');
        await Park.fly(o.el, eater.dinoBox, { emoji: o.f, size: 44, duration: 520, burst: false });
        o.el.remove(); FX.sfx.chomp(); eater.fed++;
        $$('i', eater.hearts).forEach((h, i) => { h.textContent = i < eater.fed ? '💖' : '🤍'; });
        const c = centreOf(eater.dinoBox); FX.burst(c.x, c.y - 30, { kind: 'hearts', n: 5 }); ctx.good(eater.dinoBox); FX.sfx.note(eater.fed * 2, .15);
        if (eaters.every((e) => e.fed >= need)) {
          over = true; eaters.forEach((e) => { FX.dinoState(e.dEl, 'happy'); e.dEl.setAttribute('data-base', 'happy'); });
          FX.celebrate(); ctx.flutter(3); ctx.done(two ? 'Yum! Everybody is full!' : 'Yum! My tummy is full!', 1900); busy = false; return;
        }
        if (eater.fed >= need) { FX.dinoState(eater.dEl, 'happy'); eater.dEl.setAttribute('data-base', 'happy'); eater.box.classList.add('full'); eater.order.innerHTML = '<span>Thank you!</span><b>💖</b>'; ctx.say('One friend is full! Now the other one!'); }
        else { eater.want = pickWant(eater); $('b', eater.order).textContent = eater.want; FX.pop(eater.order); ctx.say(`Yum! Now I want a ${eater.want}!`); FX.dinoState(eater.dEl, 'idle'); }
        spawnN = spawnN % 2 === 0 ? spawnN : spawnN - 1;     // make sure the next item is something they want
        busy = false;
      }
      ctx.hint(() => {
        const it = live.find((o) => wantedNow().includes(o.f)); const wanted = eaters.find((e) => e.fed < need);
        if (it) { it.el.classList.add('glow'); setTimeout(() => it.el.classList.remove('glow'), 2200); }
        if (wanted) FX.pulse(wanted.order); FX.sfx.sparkle();
      });
      function frame(now) {
        if (!ctx.alive() || over) return;
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        if (!busy) {
          const dx = speed * dt; sinceSpawn += dx;
          live.forEach((o) => { o.x += dx; o.el.style.transform = `translateX(${o.x}px)`; });
          for (let i = live.length - 1; i >= 0; i--) if (live[i].x > beltW() + 20) remove(live[i]);
          if (sinceSpawn > 215 + (R === 4 ? -25 : 0)) { sinceSpawn = 0; spawn(); }
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame((t) => { last = t; frame(t); });
    },
  });

  /* ====================================================================== 11. Dino Dash */
  const DASH_THEMES = [
    { name: 'Sunny Meadow', sky: ['#7fd0f2', '#e9f8d4'], m1: '#8cc4a6', m2: '#a6d6b4', ground: '#6bbf5f', ground2: '#4f9f47', obs: ['rock', 'log', 'bush'], len: 3400, amb: 'meadow', fx: 'flies', tree: 'round' },
    { name: 'Volcano Trail', sky: ['#ff9a6b', '#ffe3a8'], m1: '#a8604a', m2: '#c4785a', ground: '#a66a45', ground2: '#7d4b2c', obs: ['rock', 'fire', 'cactus'], len: 4400, amb: 'volcano', fx: 'embers', tree: 'dead' },
    { name: 'Snowy Hills', sky: ['#a6d4f5', '#f2fbff'], m1: '#9ab7d0', m2: '#bcd2e4', ground: '#eef6fb', ground2: '#c5dcec', obs: ['snowman', 'ice', 'rock'], len: 5400, amb: 'snow', fx: 'snow', tree: 'pine' },
    { name: 'Moonlight Run', sky: ['#1d1b5c', '#5b4fa8'], m1: '#3d3f8f', m2: '#4d50a3', ground: '#3a8a74', ground2: '#2c6e60', obs: ['mushroom', 'rock', 'log'], len: 6200, amb: 'night', fx: 'fireflies', tree: 'round', night: true },
  ];
  /* Bold, outlined shapes so every obstacle stands out against the scenery. Each draws itself sitting on y = 0 at x = 0. */
  const OB = {
    rock: { w: 52, h: 40, draw(c) { c.beginPath(); c.moveTo(-26, 0); c.lineTo(-22, -22); c.lineTo(-6, -38); c.lineTo(12, -34); c.lineTo(26, -14); c.lineTo(26, 0); c.closePath(); c.fillStyle = '#8f9aa8'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = '#2f3540'; c.stroke(); c.fillStyle = '#b9c2cd'; c.beginPath(); c.moveTo(-18, -20); c.lineTo(-6, -33); c.lineTo(4, -26); c.lineTo(-8, -14); c.fill(); } },
    log: { w: 70, h: 36, draw(c) { c.fillStyle = '#b5702f'; c.strokeStyle = '#3a2210'; c.lineWidth = 3.5; c.beginPath(); c.roundRect(-34, -34, 68, 34, 12); c.fill(); c.stroke(); c.strokeStyle = '#7d4719'; c.lineWidth = 2; for (let i = -18; i < 30; i += 14) { c.beginPath(); c.moveTo(i, -30); c.lineTo(i + 4, -4); c.stroke(); } c.fillStyle = '#e0aa6a'; c.strokeStyle = '#3a2210'; c.lineWidth = 3; c.beginPath(); c.ellipse(32, -17, 9, 16, 0, 0, 6.3); c.fill(); c.stroke(); c.strokeStyle = '#a8692f'; c.beginPath(); c.ellipse(32, -17, 4, 8, 0, 0, 6.3); c.stroke(); } },
    bush: { w: 56, h: 42, draw(c) { c.fillStyle = '#3f9a4a'; c.strokeStyle = '#1f4d26'; c.lineWidth = 3.5; c.beginPath(); c.arc(-14, -16, 16, 0, 6.3); c.arc(8, -22, 20, 0, 6.3); c.arc(20, -12, 13, 0, 6.3); c.fill(); c.stroke(); c.fillStyle = '#ff5d6c'; [[-10, -18], [10, -26], [18, -12]].forEach((p) => { c.beginPath(); c.arc(p[0], p[1], 4, 0, 6.3); c.fill(); }); } },
    cactus: { w: 40, h: 60, draw(c) { c.fillStyle = '#4caf5a'; c.strokeStyle = '#1d5a2a'; c.lineWidth = 3.5; c.beginPath(); c.roundRect(-9, -58, 18, 58, 9); c.fill(); c.stroke(); c.beginPath(); c.roundRect(-26, -40, 14, 8, 4); c.roundRect(-26, -48, 8, 16, 4); c.fill(); c.stroke(); c.beginPath(); c.roundRect(12, -34, 14, 8, 4); c.roundRect(18, -44, 8, 18, 4); c.fill(); c.stroke(); } },
    fire: { w: 44, h: 56, draw(c, t) { c.fillStyle = '#4a4040'; c.strokeStyle = '#1d1818'; c.lineWidth = 3; c.beginPath(); c.roundRect(-20, -12, 40, 12, 5); c.fill(); c.stroke(); const f = Math.sin(t * 14) * 3; c.fillStyle = '#ff6a1f'; c.strokeStyle = '#8a2a00'; c.lineWidth = 3; c.beginPath(); c.moveTo(-16, -12); c.quadraticCurveTo(-22, -34 + f, -4, -48 - f); c.quadraticCurveTo(-4, -32, 4, -30); c.quadraticCurveTo(10, -44 + f, 12, -52); c.quadraticCurveTo(26, -30, 16, -12); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(-6, -12); c.quadraticCurveTo(-10, -26, 0, -34 - f); c.quadraticCurveTo(10, -24, 6, -12); c.fill(); } },
    snowman: { w: 44, h: 64, draw(c) { c.fillStyle = '#fff'; c.strokeStyle = '#3a5a78'; c.lineWidth = 3.5; c.beginPath(); c.arc(0, -16, 17, 0, 6.3); c.fill(); c.stroke(); c.beginPath(); c.arc(0, -44, 12, 0, 6.3); c.fill(); c.stroke(); c.fillStyle = '#ff8a2a'; c.beginPath(); c.moveTo(2, -45); c.lineTo(15, -42); c.lineTo(2, -40); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(-4, -48, 1.8, 0, 6.3); c.arc(5, -48, 1.8, 0, 6.3); c.fill(); c.fillStyle = '#d6453d'; c.fillRect(-12, -35, 24, 5); } },
    ice: { w: 46, h: 52, draw(c) { c.fillStyle = '#9fe3ff'; c.strokeStyle = '#2d6d8e'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-22, 0); c.lineTo(-14, -30); c.lineTo(-6, -14); c.lineTo(2, -50); c.lineTo(12, -18); c.lineTo(18, -30); c.lineTo(24, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(0, -44); c.lineTo(5, -22); c.lineTo(-2, -26); c.fill(); } },
    mushroom: { w: 50, h: 48, draw(c) { c.fillStyle = '#f4ead2'; c.strokeStyle = '#4a2a2a'; c.lineWidth = 3.5; c.beginPath(); c.roundRect(-9, -24, 18, 24, 6); c.fill(); c.stroke(); c.fillStyle = '#e0414f'; c.beginPath(); c.moveTo(-26, -22); c.quadraticCurveTo(0, -62, 26, -22); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; [[-10, -32], [8, -38], [14, -26]].forEach((p) => { c.beginPath(); c.arc(p[0], p[1], 4.2, 0, 6.3); c.fill(); }); } },
  };
  window.Park.register({
    id: 'dash', name: 'Dino Dash', icon: 'trex', color: '#2f9e5e', rounds: 4, helper: 'trex', ambient: 'meadow',
    desc: 'Run, jump over things, and collect stars!',
    round(ctx) {
      const T = DASH_THEMES[ctx.round - 1];
      FX.ambient(null);
      ctx.say(T.name + '! Get ready to run!');
      const wrap = el('div', 'dash-wrap');
      const cv = el('canvas', 'dash-cv'); cv.width = 1080; cv.height = 450;
      const sprite = el('div', 'dash-dino', FX.dinoHTML(ctx.round === 2 ? 'raptor' : ctx.round === 4 ? 'tricera' : 'trex', { state: 'idle', color: ctx.round === 3 ? 'blue' : ctx.round === 4 ? 'purple' : 'green' }));
      const hud = el('div', 'dash-hud', '<span class="dh-stars">⭐ <b id="dStars">0</b></span><span class="dh-eggs" id="dEggs">🥚🥚🥚</span><div class="dash-prog"><i id="dProg"></i><em id="dMark">🦖</em><b>🏁</b></div><div class="dash-super" id="dSuper" title="Collect stars to fill the super meter"><i></i></div>');
      const count = el('div', 'dash-count', '3');
      wrap.append(cv, sprite, hud, count); ctx.area.append(wrap);
      const c = cv.getContext('2d'), W = 720, H = 300, GY = 236, DX = 140;
      c.setTransform(1.5, 0, 0, 1.5, 0, 0);
      const dEl = sprite.firstElementChild;
      const P = { y: 0, vy: 0, jumps: 0, x: 0, speed: 215 + ctx.round * 16, stumble: 0, inv: 0, stars: 0, eggs: 0, meter: 0, superT: 0, started: false };
      let obs = [], picks = [], nextObs = 560, last = performance.now(), over = false, time = 0, combo = 0, comboT = 0, rewarded = 0;
      const eggAt = [.3, .55, .8].map((f) => T.len * f);
      let eggIdx = 0;
      const sparks = [];      // rainbow trail and impact sparks, drawn on the canvas
      const clouds = Array.from({ length: 5 }, () => ({ x: rnd(W), y: 20 + rnd(80), s: .6 + Math.random() }));
      const birds = Array.from({ length: 3 }, (_, i) => ({ x: rnd(W), y: 40 + i * 24 + rnd(20), s: .5 + Math.random() * .5 }));
      const bits = Array.from({ length: 26 }, () => ({ x: rnd(W), y: rnd(H - 70), p: Math.random() * 6, s: .4 + Math.random() }));   // snow, embers, fireflies, butterflies
      const jump = () => {
        if (over || !P.started) return;
        if (P.jumps >= 2) return;
        P.vy = P.jumps === 0 ? 560 : 470; P.jumps++; FX.sfx.boing(); if (P.jumps === 2) FX.sfx.whoosh();
        FX.dinoState(dEl, 'happy'); dEl.setAttribute('data-base', 'idle');
        const r = sprite.getBoundingClientRect(); FX.burst(r.left + r.width * .4, r.bottom - 6, { kind: 'dust', n: 4, scale: .7 });
      };
      cv.addEventListener('pointerdown', jump); sprite.addEventListener('pointerdown', jump);
      const key = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); } };
      window.addEventListener('keydown', key);
      const stop = () => window.removeEventListener('keydown', key);

      /* ---- scenery ---- */
      const hills = (col, h, step, sp) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, GY); for (let x = -step * 2; x <= W + step * 2; x += step) { const px = x - ((P.x * sp) % (step * 2)); c.lineTo(px + step / 2, GY - h - (((Math.round(x / step)) % 2) ? 0 : h * .55)); c.lineTo(px + step, GY - h * .35); } c.lineTo(W + step * 2, GY); c.fill(); };
      const tree = (x, kind) => {
        const y = GY - 6;
        if (kind === 'pine') { c.fillStyle = '#4f7d6a'; [[26, 60], [20, 44], [14, 30]].forEach((t, i) => { c.beginPath(); c.moveTo(x - t[0], y - i * 18); c.lineTo(x, y - t[1] - i * 14); c.lineTo(x + t[0], y - i * 18); c.fill(); }); c.fillStyle = '#6b4a2e'; c.fillRect(x - 3, y, 6, 8); }
        else if (kind === 'dead') { c.strokeStyle = '#4a3226'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y - 40); c.moveTo(x, y - 24); c.lineTo(x - 14, y - 38); c.moveTo(x, y - 30); c.lineTo(x + 12, y - 44); c.stroke(); }
        else { c.fillStyle = '#6b4a2e'; c.fillRect(x - 4, y - 24, 8, 30); c.fillStyle = T.night ? '#2f8f70' : '#58b55f'; c.beginPath(); c.arc(x, y - 36, 20, 0, 6.3); c.arc(x - 12, y - 26, 13, 0, 6.3); c.arc(x + 12, y - 26, 13, 0, 6.3); c.fill(); }
      };
      const star = (x, y, r, spin) => { c.save(); c.translate(x, y); c.rotate(spin); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .46 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fillStyle = '#ffd21f'; c.fill(); c.lineWidth = 3.5; c.lineJoin = 'round'; c.strokeStyle = '#b36b00'; c.stroke(); c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.arc(-r * .18, -r * .22, r * .16, 0, 6.3); c.fill(); c.restore(); };
      const egg = (x, y, bob) => { c.save(); c.translate(x, y + bob); c.shadowColor = '#fff2a8'; c.shadowBlur = 18; c.fillStyle = '#fff6d8'; c.strokeStyle = '#a8742a'; c.lineWidth = 3.5; c.beginPath(); c.ellipse(0, 0, 17, 22, 0, 0, 6.3); c.fill(); c.shadowBlur = 0; c.stroke(); c.fillStyle = '#ffb347'; [[-6, -6], [6, 2], [-3, 9]].forEach((p) => { c.beginPath(); c.arc(p[0], p[1], 3.6, 0, 6.3); c.fill(); }); c.restore(); };
      function draw() {
        const g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
        if (T.night) { c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const sx = (i * 97) % W, sy = (i * 53) % 130, tw = .4 + .6 * Math.abs(Math.sin(time * 2 + i)); c.globalAlpha = tw; c.fillRect(sx, sy, 2, 2); } c.globalAlpha = 1; c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(610, 56, 26, 0, 6.3); c.fill(); c.fillStyle = T.sky[0]; c.beginPath(); c.arc(620, 50, 24, 0, 6.3); c.fill(); }
        else { c.fillStyle = 'rgba(255,240,160,.4)'; c.beginPath(); c.arc(620, 56, 46, 0, 6.3); c.fill(); c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(620, 56, 28, 0, 6.3); c.fill(); }
        c.fillStyle = T.night ? 'rgba(200,210,255,.35)' : 'rgba(255,255,255,.88)'; clouds.forEach((k) => { const x = ((k.x - P.x * .05 * k.s) % (W + 120) + W + 120) % (W + 120) - 60; c.beginPath(); c.ellipse(x, k.y, 38 * k.s, 13 * k.s, 0, 0, 6.3); c.ellipse(x + 20 * k.s, k.y - 8 * k.s, 24 * k.s, 12 * k.s, 0, 0, 6.3); c.fill(); });
        c.strokeStyle = T.night ? '#cfd8ff' : '#4a5a6a'; c.lineWidth = 2; birds.forEach((b) => { const x = ((b.x - P.x * .12 * b.s - time * 20) % (W + 80) + W + 80) % (W + 80) - 40, flap = Math.sin(time * 8 + b.x) * 4; c.beginPath(); c.moveTo(x - 8, b.y + flap); c.quadraticCurveTo(x - 4, b.y - 4, x, b.y); c.quadraticCurveTo(x + 4, b.y - 4, x + 8, b.y + flap); c.stroke(); });
        hills(T.m1, 90, 120, .1); hills(T.m2, 56, 90, .22);
        // Trees roll past at a medium speed behind the track.
        for (let i = -1; i < 8; i++) { const wx = Math.floor(P.x * .45 / 170 + i) * 170, sx = wx - P.x * .45 + 60 + ((wx / 170) % 3) * 22; tree(sx + 10, T.tree); }
        c.fillStyle = T.ground; c.fillRect(0, GY, W, H - GY); c.fillStyle = T.ground2;
        for (let i = -1; i < 18; i++) { const x = i * 48 - (P.x % 48); c.fillRect(x, GY + 14, 28, 5); c.fillRect(x + 20, GY + 40, 22, 4); }
        c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(0, GY, W, 4);
        // Weather and little creatures, each theme has its own.
        bits.forEach((b) => {
          const sp = T.fx === 'snow' ? 40 : T.fx === 'embers' ? -50 : 0, x = ((b.x - P.x * .3 * b.s + Math.sin(time * b.s + b.p) * 14) % W + W) % W, y = ((b.y + sp * time * b.s) % (H - 60) + (H - 60)) % (H - 60);
          if (T.fx === 'snow') { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x, y, 2 + b.s, 0, 6.3); c.fill(); }
          else if (T.fx === 'embers') { c.fillStyle = `rgba(255,${120 + (b.p * 20 | 0)},40,.85)`; c.beginPath(); c.arc(x, GY - 20 - (y % 160), 2 + b.s, 0, 6.3); c.fill(); }
          else if (T.fx === 'fireflies') { c.fillStyle = `rgba(255,248,150,${.4 + .6 * Math.abs(Math.sin(time * 2 + b.p))})`; c.shadowColor = '#fff59d'; c.shadowBlur = 10; c.beginPath(); c.arc(x, GY - 30 - (y % 110), 2.4, 0, 6.3); c.fill(); c.shadowBlur = 0; }
          else if (b.s > .95) { c.globalAlpha = 1; c.font = '20px serif'; c.textAlign = 'center'; c.fillText('🦋', x, 70 + (y % 110)); }
        });
        // Finish flag
        const fx = T.len - P.x + DX; if (fx < W + 60) { c.fillStyle = '#fff'; c.fillRect(fx, GY - 100, 6, 100); c.fillStyle = '#ff5d5d'; c.fillRect(fx + 6, GY - 100, 44, 28); c.fillStyle = '#fff'; c.fillRect(fx + 6, GY - 100, 14, 14); c.fillRect(fx + 34, GY - 86, 16, 14); }
        // Obstacles: big, outlined, with a bobbing warning arrow when they are coming up.
        obs.forEach((o) => {
          const ox = o.x - P.x + DX; if (ox < -80 || ox > W + 80) return;
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(ox, GY + 3, o.def.w * .6, 6, 0, 0, 6.3); c.fill();
          c.save(); c.translate(ox, GY + 2); o.def.draw(c, time); c.restore();
          const ahead = ox - DX; if (ahead > 40 && ahead < 380 && !P.superT) { const by = GY - o.def.h - 20 + Math.sin(time * 7) * 4; c.fillStyle = '#ff7a1a'; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(ox - 9, by - 10); c.lineTo(ox + 9, by - 10); c.lineTo(ox, by + 4); c.closePath(); c.fill(); c.stroke(); }
        });
        // Stars and eggs
        picks.forEach((p) => { if (p.got) return; const px = p.x - P.x + DX; if (px < -50 || px > W + 50) return; const py = GY - p.h + Math.sin(time * 5 + p.x * .05) * 4; if (p.egg) egg(px, py, 0); else { c.shadowColor = 'rgba(255,230,120,.9)'; c.shadowBlur = 14; star(px, py, 19, Math.sin(time * 3 + p.x) * .25); c.shadowBlur = 0; } });
        // Sparks: rainbow trail while super, bursts when a rock is smashed
        for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= .016; if (s.life <= 0) { sparks.splice(i, 1); continue; } s.x += s.vx; s.y += s.vy; c.globalAlpha = Math.max(0, s.life * 2); c.fillStyle = s.col; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.3); c.fill(); c.globalAlpha = 1; }
        // Dino shadow
        c.fillStyle = `rgba(0,0,0,${.28 - Math.min(.2, P.y / 600)})`; c.beginPath(); c.ellipse(DX + 6, GY + 4, 38 - Math.min(14, P.y / 8), 7, 0, 0, 6.3); c.fill();
        if (P.superT > 0) { c.strokeStyle = `rgba(255,255,255,${.5 + .4 * Math.sin(time * 20)})`; c.lineWidth = 4; c.beginPath(); c.arc(DX + 6, GY - P.y - 32, 52, 0, 6.3); c.stroke(); }
      }
      const rainbow = ['#ff5252', '#ffa726', '#ffee58', '#66bb6a', '#42a5f5', '#ab47bc'];
      const hudStars = () => { $('#dStars').textContent = P.stars; const m = $('#dSuper i'); if (m) m.style.width = (P.superT > 0 ? P.superT / 4 * 100 : P.meter / 8 * 100) + '%'; };
      function frame(now) {
        if (!ctx.alive() || over) { stop(); return; }
        const dt = Math.min(.04, (now - last) / 1000); last = now; time += dt;
        if (P.started) {
          P.superT = Math.max(0, P.superT - dt);
          const sp = P.speed * (P.stumble > 0 ? .5 : 1) * (P.superT > 0 ? 1.35 : 1);
          P.x += sp * dt; P.stumble = Math.max(0, P.stumble - dt); P.inv = Math.max(0, P.inv - dt); comboT = Math.max(0, comboT - dt); if (!comboT) combo = 0;
          P.vy -= 1500 * dt; P.y += P.vy * dt;
          if (P.y <= 0) { P.y = 0; P.vy = 0; if (P.jumps) { P.jumps = 0; FX.sfx.tap(); if (!P.stumble) { FX.dinoState(dEl, 'run'); dEl.setAttribute('data-base', 'run'); } } }
          // Lay out the next obstacle with a guiding arc of stars above it, plus rare eggs that need a double jump.
          if (P.x > nextObs && P.x < T.len - 520) {
            const def = OB[pick(T.obs)], gap = 300 + rnd(200) - ctx.round * 8, wx = P.x + 720;
            obs.push({ x: wx, def });
            const arc = Math.random() < .8 ? 5 : 3;
            for (let k = 0; k < arc; k++) { const f = (k - (arc - 1) / 2), h = 38 + (1 - Math.pow(f / ((arc - 1) / 2 || 1), 2)) * 62; picks.push({ x: wx + f * 34, h: Math.max(h, def.h + 14 * (k > 0 && k < arc - 1 ? 1 : 0)), got: false }); }
            if (Math.random() < .35) { const sx = wx + 190 + rnd(60); for (let k = 0; k < 4; k++) picks.push({ x: sx + k * 34, h: 40, got: false }); }
            nextObs = P.x + gap + 220;
          }
          if (eggIdx < 3 && P.x + 700 > eggAt[eggIdx]) { picks.push({ x: eggAt[eggIdx], h: 135, got: false, egg: true }); eggIdx++; }
          obs = obs.filter((o) => o.x - P.x > -200); picks = picks.filter((p) => p.x - P.x > -200);
          obs.forEach((o) => {
            const ox = o.x - P.x + DX, half = o.def.w * .42 + 10;
            if (Math.abs(ox - DX) < half && P.y < o.def.h * .75 && !o.hit) {
              o.hit = true;
              if (P.superT > 0) {
                // Smashed! The rock bursts into stars.
                for (let k = 0; k < 14; k++) sparks.push({ x: ox, y: GY - 20, vx: (Math.random() - .5) * 7, vy: -Math.random() * 6, r: 2 + Math.random() * 3, life: .6 + Math.random() * .4, col: pick(rainbow) });
                FX.sfx.thud(); FX.sfx.sparkle(); o.x = -9999; P.stars++; hudStars();
              } else if (!P.inv) {
                P.stumble = .8; P.inv = 1.3; ctx.bad(.4, sprite); FX.dinoState(dEl, 'sad', 800); FX.shakeScreen(3); FX.sfx.thud(); combo = 0; P.meter = Math.max(0, P.meter - 2); hudStars();
                ctx.say('Oops! Tap to jump over the next one!');
                for (let k = 0; k < 8; k++) sparks.push({ x: DX + 10, y: GY - 14, vx: (Math.random() - .3) * 5, vy: -Math.random() * 4, r: 2 + Math.random() * 2, life: .5, col: '#d8c8a8' });
                setTimeout(() => { if (ctx.alive() && !P.stumble) { FX.dinoState(dEl, 'run'); dEl.setAttribute('data-base', 'run'); } }, 850);
              }
            }
          });
          picks.forEach((p) => {
            const px = p.x - P.x + DX;
            if (!p.got && Math.abs(px - DX) < (p.egg ? 34 : 30) && Math.abs(p.h - (P.y + 30)) < (p.egg ? 46 : 44)) {
              p.got = true; const r = sprite.getBoundingClientRect();
              if (p.egg) {
                P.eggs++; FX.sfx.win(); FX.floatText(r.left + r.width * .6, r.top, 'Golden egg!', { size: 26 }); FX.burst(r.left + r.width * .6, r.top, { kind: 'confetti', n: 22 });
                const dots = $('#dEggs'); if (dots) dots.textContent = '🥚'.repeat(P.eggs) + '⚪'.repeat(3 - P.eggs); P.stars += 3; P.meter = Math.min(8, P.meter + 3);
              } else {
                P.stars++; P.meter++; combo++; comboT = 1.1; FX.sfx.note(Math.min(11, combo - 1), .14);
                FX.floatText(r.left + r.width * .6, r.top, combo > 2 ? `+1  x${combo}` : '+1'); FX.burst(r.left + r.width * .6, r.top + 10, { kind: 'sparkle', n: 6 });
              }
              // Every six stars is a bonus sparkle for the jar.
              while (Math.floor(P.stars / 6) > rewarded) { rewarded++; ctx.bonus(1, r.left ? { x: r.left + r.width * .6, y: r.top - 20 } : null, '6 stars!'); ctx.life.visit(); }
              if (P.meter >= 8 && P.superT <= 0) { P.meter = 0; P.superT = 4; ctx.say('SUPER DASH! Smash everything!'); FX.sfx.roar(); FX.dinoState(dEl, 'roar', 600); FX.shakeScreen(3); ctx.flutter(3); }
              hudStars();
            }
          });
          if (P.superT > 0 && Math.random() < .8) sparks.push({ x: DX - 20, y: GY - P.y - 18 + rnd(30), vx: -2.5 - Math.random() * 2, vy: (Math.random() - .5), r: 3 + Math.random() * 2, life: .5, col: pick(rainbow) });
          if (P.superT > 0 && P.superT - dt <= 0) { ctx.say('Super Dash is over. Keep going!'); hudStars(); }
          if (P.superT > 0) hudStars();
          const prog = Math.min(1, P.x / T.len); $('#dProg').style.width = prog * 100 + '%'; const mk = $('#dMark'); if (mk) mk.style.left = `calc(${prog * 100}% - 10px)`;
        }
        const scale = cv.clientWidth / W;
        sprite.style.setProperty('--lift', (P.y * scale) + 'px'); sprite.style.setProperty('--sc', scale);
        sprite.style.opacity = P.inv > 0 && P.superT <= 0 ? (Math.floor(time * 14) % 2 ? .45 : 1) : 1;
        draw();
        if (P.x >= T.len) {
          over = true; stop(); FX.dinoState(dEl, 'happy'); dEl.setAttribute('data-base', 'happy'); sprite.style.opacity = 1; FX.celebrate(); ctx.flutter(5);
          if (P.eggs === 3) ctx.bonus(2, sprite, 'All three eggs!');
          ctx.done(`You made it to the flag! ${P.stars} stars${P.eggs ? ' and ' + P.eggs + ' egg' + (P.eggs > 1 ? 's' : '') : ''}!`, 2400); return;
        }
        requestAnimationFrame(frame);
      }
      // 3, 2, 1, go! so nobody is surprised by the start.
      (async () => {
        for (const n of ['3', '2', '1']) { if (!ctx.alive()) return; count.textContent = n; FX.pop(count); FX.sfx.drum(n === '1' ? 2 : 0); await sleep(650); }
        if (!ctx.alive()) return;
        count.textContent = 'GO!'; FX.pop(count); FX.sfx.roar(); P.started = true; FX.dinoState(dEl, 'run'); dEl.setAttribute('data-base', 'run'); ctx.say('Tap anywhere or press Space to JUMP! Tap twice for a high jump!');
        await sleep(600); count.remove();
      })();
      requestAnimationFrame((t) => { last = t; frame(t); });
    },
  });

  /* ====================================================================== 12. Egg Catch */
  /* Eggs and rocks are drawn as bold outlined SVG so they are easy to see against the sky. */
  const EGG_ART = {
    cream: (f, s) => `<svg viewBox="0 0 40 52"><ellipse cx="20" cy="29" rx="15" ry="20" fill="${f}" stroke="#7a4a1c" stroke-width="3"/><circle cx="14" cy="22" r="3.4" fill="${s}"/><circle cx="25" cy="32" r="3.8" fill="${s}"/><circle cx="16" cy="38" r="2.8" fill="${s}"/><ellipse cx="13" cy="19" rx="3" ry="5" fill="#fff" opacity=".55" transform="rotate(-20 13 19)"/></svg>`,
    gold: () => '<svg viewBox="0 0 40 52"><defs><radialGradient id="gg"><stop offset="0" stop-color="#fff7b0"/><stop offset="1" stop-color="#ffb300"/></radialGradient></defs><ellipse cx="20" cy="29" rx="16" ry="21" fill="url(#gg)" stroke="#8a5a00" stroke-width="3"/><path d="M10 28 l5 -6 l5 6 l5 -6 l5 6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="13" cy="18" rx="3" ry="5" fill="#fff" opacity=".7" transform="rotate(-20 13 18)"/></svg>',
    rainbow: () => '<svg viewBox="0 0 40 52"><defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5252"/><stop offset=".25" stop-color="#ffee58"/><stop offset=".5" stop-color="#66bb6a"/><stop offset=".75" stop-color="#42a5f5"/><stop offset="1" stop-color="#ab47bc"/></linearGradient></defs><ellipse cx="20" cy="29" rx="16" ry="21" fill="url(#rg)" stroke="#4a2a6a" stroke-width="3"/><ellipse cx="13" cy="18" rx="3" ry="5" fill="#fff" opacity=".7" transform="rotate(-20 13 18)"/></svg>',
    rock: () => '<svg viewBox="0 0 50 46"><polygon points="4,42 8,20 22,6 40,12 47,30 44,42" fill="#5d6675" stroke="#1f2430" stroke-width="3.5" stroke-linejoin="round"/><polygon points="12,22 22,11 32,15 22,26" fill="#8791a3"/><circle cx="34" cy="31" r="3" fill="#434a57"/></svg>',
  };
  const EGG_TINTS = [['#fff1d0', '#f0a35a'], ['#d6efff', '#5aa8e0'], ['#ffe0ec', '#e8709a'], ['#e3f7d2', '#6cbf6a']];
  window.Park.register({
    id: 'catch', name: 'Egg Catch', icon: 'ptero', color: '#d19a14', rounds: 4, helper: 'ptero', ambient: 'meadow',
    desc: 'Catch the falling eggs in your basket!',
    round(ctx) {
      const goal = [8, 12, 16, 20][ctx.round - 1], fall = [150, 185, 215, 245][ctx.round - 1];
      ctx.say('Move to catch the eggs! Watch out for rocks!');
      const field = el('div', 'catch-field');
      const bg = el('div', 'catch-bg', '<i class="cb-sun">☀️</i><i class="cb-cloud c1">☁️</i><i class="cb-cloud c2">☁️</i><div class="cb-hills"></div><div class="cb-trees"><span>🌳</span><span>🌲</span><span>🌳</span><span>🌴</span><span>🌲</span><span>🌳</span></div><div class="cb-grass"></div>');
      const fly = el('div', 'catch-flyer', FX.dinoHTML('ptero', { color: 'pink' }));
      const hero = el('div', 'catch-hero', FX.dinoHTML(pick(['stego', 'tricera', 'bronto']), { color: pick(COLORS), state: 'idle' }));
      const basket = el('div', 'catch-basket', '<svg viewBox="0 0 100 64"><path d="M6 14 Q50 -4 94 14 L82 58 Q50 66 18 58Z" fill="#d9a05b" stroke="#6b4018" stroke-width="4" stroke-linejoin="round"/><path d="M14 26 Q50 36 86 26 M18 40 Q50 50 82 40" fill="none" stroke="#a8692f" stroke-width="3"/><ellipse cx="50" cy="14" rx="44" ry="9" fill="#8a5a28" stroke="#6b4018" stroke-width="4"/></svg>');
      const hud = el('div', 'catch-hud', `<span>🥚 <b id="cN">0</b> / ${goal}</span><div class="catch-bar"><i id="cBar"></i></div><span id="cBuff" class="catch-buff"></span>`);
      field.append(bg, fly, hero, basket, hud); ctx.area.append(field);
      const hEl = hero.querySelector('.du-dino');
      let fw = field.clientWidth, x = fw / 2, target = fw / 2, got = 0, items = [], spawnT = .8, last = performance.now(), over = false, pxFly = 40, dir = 1, still = 0, combo = 0, big = 0, magnet = 0, time = 0, rewarded = 0, misses = 0;
      const place = (cx) => { target = Math.max(60, Math.min(field.clientWidth - 60, cx - field.getBoundingClientRect().left)); };
      field.addEventListener('pointermove', (e) => place(e.clientX)); field.addEventListener('pointerdown', (e) => place(e.clientX));
      const key = (e) => { if (e.key === 'ArrowLeft') target -= 80; if (e.key === 'ArrowRight') target += 80; target = Math.max(60, Math.min(field.clientWidth - 60, target)); };
      window.addEventListener('keydown', key);
      ctx.hint(() => { FX.sfx.sparkle(); ctx.say('Slide your finger left and right to move the basket!'); FX.pulse(basket); });
      const cN = $('#cN'), bar = $('#cBar'), buff = $('#cBuff');
      const setBuff = () => { buff.textContent = big > 0 ? `🌈 Giant basket ${Math.ceil(big)}` : ''; };
      function kindNow() {
        const r = Math.random(), rock = .15 + ctx.round * .025;
        if (r < rock) return 'rock';
        if (r < rock + .05) return 'gold';
        if (r < rock + .05 + (ctx.round >= 2 ? .035 : 0)) return 'rainbow';
        return 'egg';
      }
      function addItem(kind, sx) {
        const tint = pick(EGG_TINTS), n = el('div', 'catch-egg ' + kind);
        n.innerHTML = kind === 'rock' ? EGG_ART.rock() : kind === 'gold' ? EGG_ART.gold() : kind === 'rainbow' ? EGG_ART.rainbow() : EGG_ART.cream(tint[0], tint[1]);
        n.style.transform = `translate(${sx}px,40px)`; field.append(n);
        items.push({ n, x: sx, y: 40, kind, vy: fall * (.85 + Math.random() * .3), spin: (Math.random() - .5) * 90 });
        FX.sfx.tap();
      }
      function hatchling(px, py) {
        // A missed egg is not a disaster: the baby hatches and scampers off.
        const b = el('div', 'catch-baby', pick(['🐣', '🐥'])); b.style.left = (px - 16) + 'px'; b.style.top = (py - 34) + 'px'; field.append(b);
        FX.sfx.chirp(); setTimeout(() => b.remove(), 1600);
      }
      function frame(now) {
        if (!ctx.alive() || over) { window.removeEventListener('keydown', key); return; }
        const dt = Math.min(.04, (now - last) / 1000); last = now; time += dt; fw = field.clientWidth; const fh = field.clientHeight;
        const prev = x; x += (target - x) * Math.min(1, dt * 9);
        const moving = Math.abs(x - prev) > .6;
        if (moving) { still = 0; hEl.setAttribute('data-state', 'walk'); hEl.classList.toggle('d-flip', x < prev); } else if (++still > 6) hEl.setAttribute('data-state', hEl.getAttribute('data-base') || 'idle');
        big = Math.max(0, big - dt); magnet = Math.max(0, magnet - dt); if (buff && Math.ceil(big) !== +(buff.dataset.s || -1)) { buff.dataset.s = Math.ceil(big); setBuff(); }
        const sc = big > 0 ? 1.55 : 1;
        hero.style.transform = `translateX(${x - 55}px)`;
        basket.style.transform = `translateX(${x - 50}px) scale(${sc})`; basket.style.bottom = (84 + (sc - 1) * 16) + 'px';
        bg.style.setProperty('--px', (-(x - fw / 2) * .06).toFixed(1) + 'px');
        pxFly += dir * dt * (110 + ctx.round * 22); if (pxFly > fw - 90) dir = -1; if (pxFly < 0) dir = 1;
        fly.style.transform = `translateX(${pxFly}px) translateY(${Math.sin(time * 3) * 6}px) scaleX(${dir})`;
        spawnT -= dt;
        if (spawnT <= 0) {
          const sx = pxFly + 44;
          if (Math.random() < .22 && ctx.round >= 2) { for (let k = 0; k < 3; k++) setTimeout(() => { if (ctx.alive() && !over) addItem(Math.random() < .12 ? 'rock' : 'egg', Math.max(30, Math.min(field.clientWidth - 30, pxFly + 44))); }, k * 230); spawnT = 1.5 - ctx.round * .1; }
          else { addItem(kindNow(), sx); spawnT = .78 - ctx.round * .07 + Math.random() * .4; }
        }
        const catchTop = fh - 84 - 66 * sc, half = 52 * sc;
        items = items.filter((it) => {
          // The rainbow magnet gently pulls eggs toward the basket.
          if (magnet > 0 && it.kind !== 'rock') it.x += (x - it.x) * Math.min(1, dt * 2.5);
          it.y += it.vy * dt; it.n.style.transform = `translate(${it.x - 24}px,${it.y}px) rotate(${(it.y * .5 * (it.spin > 0 ? 1 : -1)) % 360 * .12}deg)`;
          if (it.y > catchTop && it.y < catchTop + 46 && Math.abs(it.x - x) < half) {
            it.n.remove();
            const r = basket.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top;
            if (it.kind === 'rock') { combo = 0; ctx.bad(.4, { x: cx, y: cy }); FX.dinoState(hEl, 'sad', 700); FX.shakeScreen(3); FX.sfx.thud(); ctx.say('Ouch! A rock! Let the rocks fall!'); FX.burst(cx, cy, { kind: 'dust', n: 7 }); FX.anim(basket, [{ filter: 'brightness(1)' }, { filter: 'brightness(2.4)' }, { filter: 'brightness(1)' }], { duration: 300 }); }
            else {
              combo++;
              const val = it.kind === 'gold' ? 3 : 1;
              got += val; cN.textContent = Math.min(got, goal); bar.style.width = Math.min(100, got / goal * 100) + '%'; FX.sfx.star(); FX.sfx.note(Math.min(11, combo), .12);
              FX.burst(cx, cy, { kind: 'stars', n: it.kind === 'egg' ? 5 : 12, scale: .8 }); FX.pop(cN.parentElement); FX.anim(basket, [{ transform: `translateX(${x - 50}px) scale(${sc * 1.0})` }, { transform: `translateX(${x - 50}px) scale(${sc * 1.12}, ${sc * .9})` }, { transform: `translateX(${x - 50}px) scale(${sc})` }], { duration: 200 });
              if (it.kind === 'gold') { FX.floatText(cx, cy - 20, 'Golden egg! +3', { size: 26 }); FX.sfx.win(); }
              if (it.kind === 'rainbow') { big = 7; magnet = 7; FX.floatText(cx, cy - 20, 'Giant basket + magnet!', { size: 24 }); FX.sfx.roar(); FX.burst(cx, cy, { kind: 'confetti', n: 24 }); ctx.say('Rainbow egg! A giant basket and a magnet for 7 seconds!'); FX.dinoState(hEl, 'happy', 900); }
              else if (combo > 2 && combo % 3 === 0) FX.floatText(cx, cy - 36, combo + ' in a row!', { size: 24 });
              while (Math.floor(got / 6) > rewarded) { rewarded++; ctx.bonus(1, { x: cx, y: cy - 30 }, '6 eggs!'); ctx.life.visit(); }
              if (got >= goal && !over) {
                over = true; FX.celebrate(); ctx.flutter(5); FX.dinoState(hEl, 'happy'); hEl.setAttribute('data-base', 'happy');
                if (!misses) ctx.bonus(1, basket, 'Never dropped one!');
                ctx.done('Basket full! What a great catch!', 1900);
              }
            }
            return false;
          }
          if (it.y > fh - 44) {
            it.n.remove();
            if (it.kind !== 'rock') { combo = 0; misses++; const r = field.getBoundingClientRect(); FX.burst(r.left + it.x, r.bottom - 30, { kind: 'dust', n: 3, scale: .6 }); if (it.kind === 'egg' && Math.random() < .5) hatchling(it.x, fh - 30); }
            else { FX.burst(field.getBoundingClientRect().left + it.x, field.getBoundingClientRect().bottom - 30, { kind: 'dust', n: 3, scale: .7 }); }
            return false;
          }
          return true;
        });
        requestAnimationFrame(frame);
      }
      requestAnimationFrame((t) => { last = t; frame(t); });
    },
  });
})();
