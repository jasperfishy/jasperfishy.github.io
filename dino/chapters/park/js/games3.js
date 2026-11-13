/* Dino Park games 9–12: Colouring, Dino Café, Dino Dash, Egg Catch. */
(function () {
  'use strict';
  const environmentBase = new URL('../../../assets/environments/', document.currentScript.src).href;
  const { $, $$, rnd, pick, shuffle, sleep, el, store, NAMES, SPECIES, COLORS, FX } = window.Park;
  const centreOf = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  /* Personal records live under hyphenated keys so the hub's /^dino_[a-z]+$/ star count never sees them. */
  const rec = {
    get: (k) => { const v = store.get('dino_x-rec-' + k, null); return typeof v === 'number' && isFinite(v) ? v : null; },
    hi(k, v) { const o = rec.get(k); if (o === null || v > o) { store.set('dino_x-rec-' + k, Math.round(v * 10) / 10); return true; } return false; },
    lo(k, v) { const o = rec.get(k); if (o === null || v < o) { store.set('dino_x-rec-' + k, Math.round(v * 10) / 10); return true; } return false; },
  };
  const recordBar = (txt) => { const r = el('div', 'col-goal', window.DUICONS.i('trophy', { size: 18 }) + ' ' + txt); r.style.background = 'linear-gradient(90deg,#fdf1d4,#f6e2ae)'; FX.pop(r); return r; };
  /* The word for a photographed thing, so a spoken line or aria-label never reads a glyph:
   * a child hears "berry", never "red strawberry". */
  const objWord = (g) => (window.DUFX && window.DUFX.objects && window.DUFX.objects.word(g)) || String(g);
  /* An empty collectible slot is a drawn padlock, the same mark every wall in the park uses. */
  const lockedSlot = () => '<i>' + window.DUICONS.i('lock', { size: 16 }) + '</i>';
  /* A few collectible stars drift in when the child does something wonderful. */

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

  /* ====================================================================== 9. Colouring */
  const PAINTS = ['#ff6b6b', '#ff9f43', '#ffd93d', '#6bcb77', '#2ec4b6', '#4d96ff', '#9b6fe0', '#ff8fc7', '#a0522d', '#ffffff'];
  const PAINT_NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Teal', 'Blue', 'Purple', 'Pink', 'Brown', 'White'];
  const STICKERS = ['⭐', '🌸', '🦋', '🌈', '🍓', '☀️', '🐢', '🍄', '🐌', '🍀', '🪶', '💎'];
  // Each round opens up a bigger box of paints, and a background to paint onto.
  const SCENES = [['🌳', 'linear-gradient(#cdebbf,#8fd07a 65%,#5fa85a)'], ['🌊', 'linear-gradient(#bfe9ff,#79c6ef 60%,#3f9bd0)'], ['🌋', 'linear-gradient(#ffd7a8,#e08a4a 60%,#8a4326)'], ['🌙', 'linear-gradient(#2b2a63,#5753a8 65%,#8f7fd0)'], ['🌈', 'linear-gradient(#ffd6e8,#fff3c4 35%,#cdf7d0 62%,#cfe6ff)'], ['❄️', 'linear-gradient(#f2fbff,#cfe6f7 60%,#a9cde8)']];
  let colSpecies = [], colGallery = [];
  window.Park.register({
    id: 'color', name: 'Dino Colouring', icon: 'stego', color: '#e0508f', rounds: 5, helper: 'stego', ambient: 'meadow',
    desc: 'Colour in a dinosaur, add stickers and bring it to life!',
    round(ctx) {
      const R = ctx.round;
      if (R === 1) { colSpecies = shuffle(['trex', 'stego', 'tricera', 'bronto', 'raptor', 'ptero']).slice(0, 5); colGallery = []; }
      const sp = colSpecies[R - 1];
      // Each round adds a gentle painter's challenge for a bonus star.
      const target = R === 4 ? 6 + rnd(2) : -1;   // index of the colour to use everywhere
      const mission = [null, { n: 3, text: 'Bonus: use 3 different colours!' }, { n: 5, text: 'Bonus: make a rainbow dino with 5 colours!' }, { one: target, text: `Bonus: paint the whole dinosaur ${PAINT_NAMES[target] && PAINT_NAMES[target].toUpperCase()}!` }, { n: 7, text: 'Bonus: use ALL SEVEN colours on one dinosaur!' }][R - 1];
      const PAL = R === 1 ? PAINTS.slice(0, 6) : R === 2 ? PAINTS.slice(0, 8) : PAINTS;
      const glitterOn = R >= 3;
      ctx.say('Pick a colour, then tap each part of the dinosaur!');
      const bestPal = rec.get('color');
      ctx.area.append(recordBar(bestPal ? `Most colours used on one dinosaur: <b>${bestPal}</b>. Try to beat it!` : 'Your first picture! How many different colours can you use?'));
      /* The sticker book: every kind of sticker you have ever stuck down keeps a page, for good,
       * and the book grows a page every level. */
      const bookV = ledger('color-book'), bookMap = bookV.all();
      const bookIds = STICKERS.slice(0, Math.min(STICKERS.length, 3 + R));
      const bookArt = (s, id) => { s.innerHTML = '<i>' + id + '</i>'; };
      const book = collectRow('stk-book', 'st', bookIds, bookMap, lockedSlot(), bookArt);
      const head = statusBar([`Level ${R}`, `${PAL.length} paints · ${SCENES.length} scenes`,
        bestPal === null ? 'No record yet' : `Best ${bestPal} colours`, `Book ${book.dataset.got}/${bookIds.length}`], '#e0508f');
      ctx.area.append(head, book);
      const bookBit = $('.du-bar-3', head);
      const wrap = el('div', 'col-wrap');
      const gal = el('div', 'col-gallery');
      for (let i = 0; i < ctx.rounds; i++) { const f = el('span', 'cg-frame' + (colGallery[i] ? ' full' : '')); if (colGallery[i]) f.append(colGallery[i].cloneNode(true)); gal.append(f); }
      const stage = el('div', 'col-stage', FX.dinoHTML(sp, { paint: true, color: 'green', state: 'idle' }));
      const dino = stage.firstElementChild;
      const skip = ['#fff', '#ffffff', '#163f42', '#ff8fa3', '#fff4d6'];
      const regions = $$('.d-all path, .d-all ellipse, .d-all circle', dino).filter((n) => {
        const f = (n.getAttribute('fill') || '').toLowerCase();
        return /^#/.test(f) && !skip.includes(f) && !n.closest('clipPath') && !n.closest('.d-eye') && !n.closest('.d-zzz') && !n.closest('.d-smile');
      });
      dino.style.animationPlayState = 'paused';
      $$('.d-all, .d-tail, .d-head, .d-plate, .d-arm, .d-eye', dino).forEach((n) => { n.style.animationPlayState = 'paused'; });
      let color = PAL[0], ci = 0, rainbow = false, ri = 0, eraser = false, glit = false; const painted = new Map(), used = new Set(); let phase = 'paint', stickers = 0, stickerSel = null, wentBack = false;
      let rubGuard = 0;   // the eraser only costs once per stroke, never once per swept pixel
      const need = Math.ceil(regions.length * .85);   // the magic finishes the last few tiny parts
      const update = () => { counter.textContent = phase === 'paint' ? `${Math.min(100, Math.round(painted.size / need * 100))}% coloured` : `${stickers} sticker${stickers === 1 ? '' : 's'} placed`; if (bar) bar.style.width = Math.min(100, painted.size / need * 100) + '%'; };
      // Glitter paints leave tiny catchlights inside the shape itself.
      const sparkleIn = (r) => {
        const svg = r.ownerSVGElement; if (!svg || !r.getBBox) return;
        let bb; try { bb = r.getBBox(); } catch (e) { return; }
        for (let i = 0; i < 3; i++) {
          const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', (bb.x + Math.random() * bb.width).toFixed(1)); c.setAttribute('cy', (bb.y + Math.random() * bb.height).toFixed(1));
          c.setAttribute('r', (1.4 + Math.random() * 1.8).toFixed(1)); c.setAttribute('fill', '#ffffff'); c.setAttribute('opacity', '.85');
          svg.append(c);
        }
      };
      // One painting function for taps and for dragging the brush across the picture.
      const paintRegion = (r, x, y) => {
        const i = regions.indexOf(r); if (i < 0 || phase !== 'paint') return;
        if (eraser) {
          if (painted.has(i)) { r.setAttribute('fill', '#f0f0f0'); painted.delete(i); FX.sfx.whoosh(); update(); return; }
          // Rubbing a part that was never painted: a real slip, so it says why and costs a little.
          if (Date.now() - rubGuard > 1100) {
            rubGuard = Date.now();
            ctx.bad(.5, r); FX.shake(r);
            ctx.say('Nothing to rub here — this part is still clean! Pick a colour and fill it in first.');
          }
          return;
        }
        const idx = rainbow ? (ri++ % (PAL.length - 1)) : ci, c = PAINTS[idx];
        if (r.getAttribute('fill') === c && painted.has(i)) return;
        r.setAttribute('fill', c); FX.sfx.splash(); FX.sfx.note(idx, .12);
        FX.anim(r, [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 300 });
        FX.burst(x, y, { kind: 'drops', n: 5, color: c });
        const fresh = !painted.has(i); painted.set(i, idx); used.add(idx);
        if (glit) { sparkleIn(r); FX.burst(x, y, { kind: 'sparkle', n: 5 }); FX.sfx.sparkle(); }
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
      const pickSwatch = (btn) => $$('.swatch', pal).forEach((x) => x.classList.toggle('on', x === btn));
      PAL.forEach((c, i) => { const s = el('button', 'swatch' + (i === 0 ? ' on' : '')); s.style.background = c; s.setAttribute('aria-label', PAINT_NAMES[i]); s.onclick = () => { color = c; ci = i; rainbow = false; eraser = false; if (glit) { glit = false; } pickSwatch(s); FX.sfx.pop(); ctx.say(`${PAINT_NAMES[i]}! Tap a part to paint it.`); }; pal.append(s); });
      const rb = el('button', 'swatch rainbow', '🌈'); rb.setAttribute('aria-label', 'Rainbow colours');
      rb.onclick = () => { rainbow = true; eraser = false; glit = false; pickSwatch(rb); FX.sfx.sparkle(); ctx.say('Rainbow paint! Every tap is a new colour.'); }; pal.append(rb);
      const er = el('button', 'swatch eraser', '✕'); er.setAttribute('aria-label', 'Eraser');
      er.onclick = () => { eraser = true; rainbow = false; glit = false; pickSwatch(er); FX.sfx.tap(); ctx.say('The eraser wipes a part clean.'); }; pal.append(er);
      let gt = null;
      if (glitterOn) {
        gt = el('button', 'swatch glitter', '✨'); gt.setAttribute('aria-label', 'Glitter brush');
        gt.style.background = 'linear-gradient(135deg,#fff3b0,#ffd21f 45%,#ff8fc7)';
        gt.onclick = () => {
          glit = !glit; rainbow = false; eraser = false;
          if (glit) { pickSwatch(gt); FX.sfx.sparkle(); ctx.say('Glitter brush! Every part gets a sparkle.'); }
          else { pickSwatch(PAL[ci] === undefined ? rb : $$('.swatch', pal)[ci]); FX.sfx.tap(); ctx.say('Glitter off. Plain paint again!'); }
        };
        pal.append(gt);
      }
      const counter = el('div', 'col-count', '0% coloured'), barWrap = el('div', 'col-bar', '<i></i>'), bar = barWrap.firstChild;
      const goal = mission ? el('div', 'col-goal', window.DUICONS.i('star', { size: 17 }) + ' ' + mission.text) : null;
      // Backgrounds: pick a scene and the picture sits in front of it.
      const scenes = el('div', 'col-pal');
      scenes.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap';
      SCENES.forEach(([ic, bg], i) => { const s = el('button', 'sticker', ic); s.setAttribute('aria-label', 'Background ' + (i + 1)); s.onclick = () => { stage.style.background = bg; stage.style.borderRadius = '26px'; $$('.sticker', scenes).forEach((x) => x.classList.toggle('on', x === s)); FX.sfx.whoosh(); const q = centreOf(s); FX.burst(q.x, q.y, { kind: i === 5 ? 'snow' : i === 3 ? 'stars' : 'leaves', n: 8 }); ctx.say('New background! Now it matches your story.'); }; scenes.append(s); });
      const tray = el('div', 'col-stickers hidden');
      const doneBtn = el('button', 'btn small hidden', '✓ All done!');
      const moreBtn = el('button', 'btn small hidden', '🖌️ Paint more!');
      wrap.append(gal, ...(goal ? [goal] : []), stage, barWrap, counter, pal, scenes, tray, moreBtn, doneBtn); ctx.area.append(wrap);
      /* The free hint, in both halves of the game: it shows an unpainted part, or the next
       * sticker your book is still missing. A hint costs nothing — press it as often as you like. */
      const showMe = () => {
        if (phase === 'paint') {
          const left = regions.find((_, i) => !painted.has(i));
          if (!left) return;
          left.classList.add('pulse'); FX.sfx.sparkle();
          ctx.say('Here is a part you have not painted yet — tap it with your colour!');
          setTimeout(() => left.classList.remove('pulse'), 2500);
          return;
        }
        if (phase !== 'stickers') return;
        const have = bookV.all();
        const ask = bookIds.find((s) => !have[s]);
        const btn = ask ? [...tray.children].find((b) => b.dataset.st === ask) : null;
        if (btn) {
          btn.classList.add('on'); stickerSel = ask; FX.pulse(btn); FX.sfx.sparkle();
          ctx.say(`Your book is still missing ${ask}! Pick it, then tap your dinosaur.`);
        } else {
          FX.sfx.sparkle();
          if (!doneBtn.classList.contains('hidden')) { FX.pulse(doneBtn); ctx.say('Tap the picture to stick it on — or press All done!'); }
          else ctx.say('Tap your dinosaur to stick a sticker on it!');
        }
      };
      ctx.hint(showMe);
      head.append(helpBtn(showMe));
      // Stage 2: every part is coloured, so the child decorates with stickers.
      function allPainted() {
        if (phase !== 'paint') return;
        phase = 'stickers'; brush = false;
        // A wave of colour finishes any tiny parts that were left.
        const left = regions.filter((_, i) => !painted.has(i)), usedList = [...used];
        left.forEach((r, k) => setTimeout(() => { if (ctx.alive()) { r.setAttribute('fill', PAINTS[usedList[k % usedList.length]]); } }, 60 + k * 50));
        if (left.length) { FX.sfx.sparkle(); ctx.life.flutter(2); } $$('.swatch', pal).forEach((x) => { x.disabled = true; }); pal.classList.add('off');
        FX.sfx.win(); ctx.say('All coloured! Pick a sticker, then tap the picture to stick it.'); update();
        if (rec.hi('color', used.size)) ctx.bonus(1, stage, `${used.size} colours — a record!`);
        if (mission && (mission.n ? used.size >= mission.n : [...painted.values()].every((v) => v === mission.one))) ctx.bonus(1, stage, 'Painter bonus!');
        barWrap.classList.add('full');
        /* The tray always carries every sticker your book still has a page for, plus a few extras,
         * so the book can genuinely be filled — and the box of stickers gets bigger each level. */
        const extras = shuffle(STICKERS.filter((s) => !bookIds.includes(s))).slice(0, R >= 3 ? 4 : 2);
        const hand = shuffle([...bookIds, ...extras]);
        tray.innerHTML = '';
        hand.forEach((e) => { const b = el('button', 'sticker', e); b.dataset.st = e; b.onclick = () => { stickerSel = e; $$('.sticker', tray).forEach((x) => x.classList.toggle('on', x === b)); FX.sfx.pop(); }; tray.append(b); });
        tray.classList.remove('hidden'); FX.pop(tray);
        // Pre-select a sticker that has a book page, so a child's very first taps always
        // press something into the collection instead of a spare that leaves no page.
        const firstPage = hand.find((e) => bookIds.includes(e)) || hand[0];
        stickerSel = firstPage;
        $$('.sticker', tray).forEach((x) => x.classList.toggle('on', x.dataset.st === firstPage));
        moreBtn.classList.remove('hidden');
        stage.classList.add('stick');
      }
      stage.addEventListener('pointerdown', (e) => {
        if (phase !== 'stickers' || !stickerSel) return;
        const r = stage.getBoundingClientRect(), s = el('span', 'placed-sticker', stickerSel);
        s.style.left = ((e.clientX - r.left) / r.width * 100) + '%'; s.style.top = ((e.clientY - r.top) / r.height * 100) + '%'; s.style.setProperty('--rot', (rnd(40) - 20) + 'deg');
        stage.append(s); FX.pop(s); FX.sfx.pop(); FX.sfx.note(stickers + 4, .15); FX.burst(e.clientX, e.clientY, { kind: 'sparkle', n: 6 });
        stickers++; update();
        /* The first time you use a kind of sticker, it is pressed into the book for good. */
        if (bookIds.includes(stickerSel) && bookV.set(stickerSel, R) && stampInto(book, bookArt, stickerSel, R, 'Stuck in the book!')) {
          if (bookBit) bookBit.textContent = `Book ${book.dataset.got}/${bookIds.length}`;
          ctx.say(`A ${objWord(stickerSel)} keeps its page in your sticker book — ${book.dataset.got} of ${bookIds.length} collected!`);
          if (book.classList.contains('full')) { ctx.bonus(2, book, 'The whole book is filled!'); }
        }
        if (stickers === 3) { doneBtn.classList.remove('hidden'); FX.pop(doneBtn); ctx.say('Lovely! Add more, paint more, or press All done!'); }
      });
      moreBtn.onclick = () => {
        if (phase !== 'stickers' || wentBack) return;
        wentBack = true; phase = 'paint';
        $$('.swatch', pal).forEach((x) => { x.disabled = false; }); pal.classList.remove('off'); tray.classList.add('hidden'); doneBtn.classList.add('hidden'); moreBtn.classList.add('hidden');
        stage.classList.remove('stick');
        ctx.say('Paint more! Change any part you like, then come back to stickers.');
        ctx.hint(showMe);
      };
      doneBtn.onclick = () => { if (phase === 'stickers') finish(); };
      async function finish() {
        phase = 'done'; tray.classList.add('hidden'); doneBtn.classList.add('hidden'); moreBtn.classList.add('hidden'); stage.classList.remove('stick');
        // A camera flash, then the dinosaur wakes up and walks into the gallery.
        FX.sfx.pop(); const flash = el('div', 'col-flash'); stage.append(flash);
        await sleep(350); if (!ctx.alive()) return;
        $$('.d-all, .d-tail, .d-head, .d-plate, .d-arm, .d-eye', dino).forEach((n) => { n.style.animationPlayState = ''; });
        dino.style.animationPlayState = '';
        FX.dinoState(dino, 'roar', 1200); FX.sfx.roar(); FX.celebrate(); ctx.flutter(4);
        const tidy = stickers + painted.size;
        if (tidy >= 14) ctx.bonus(1, stage, 'Busy artist!');
        await sleep(1300); dino.setAttribute('data-base', 'happy'); FX.dinoState(dino, 'happy');
        const frame = gal.children[R - 1], pic = stage.cloneNode(true); pic.classList.remove('stick'); $$('.col-flash', pic).forEach((n) => n.remove());
        colGallery[R - 1] = pic;
        if (frame) { FX.flyTo(stage, frame, { emoji: '🖼️', size: 34, duration: 800 }); setTimeout(() => { frame.append(pic.cloneNode(true)); frame.classList.add('full'); FX.pop(frame); }, 800); }
        ctx.done(`What a colourful ${sp === 'ptero' ? 'Pterosaur' : 'dinosaur'} — ${used.size} colours and ${stickers} stickers!`, 2400);
      }
    },
  });

  /* What the café kitchen actually has: the valley's own plants, and for the meat
   * eaters river fish, a meaty bone, and eggs — one photograph each, never two
   * of the same kind on one menu. */
  const PLANTS = ['🍓', '🌿', '🍄', '🌰', '☘️', '🌱', '🌾', '🍂'], MEATS = ['🐟', '🦴', '🐔', '🍳', '🐚'];
  const SPNAME = { trex: 'T-rex', tricera: 'Triceratops', stego: 'Stegosaurus', bronto: 'Brontosaurus', raptor: 'Raptor', ptero: 'Pterosaur' };
  /* ---------------------------------------------------------------------------
   * 10. Dino Café — a live world. No rounds, no "Level 3", no belt that stops
   * between tables. Friends walk in, sit down and lose patience in real time;
   * more arrive at the door the longer the tables take. The one thing the child
   * is really doing all the way through is choosing *who to serve first* — the
   * friend closest to storming out gets the food — while the tea urn runs down
   * and only a finished table tops it back up.
   * ------------------------------------------------------------------------- */
  window.Park.register({
    id: 'feed', name: 'Dino Café', icon: 'raptor', color: '#e0762e', live: true, helper: 'raptor', ambient: 'meadow',
    desc: 'Friends walk in and lose patience — serve the hungriest one first!',
    async world(ctx) {
      const MEALS = 2, GOAL = 10, URN_SECONDS = 110, SEATS = 3;
      let riding = [], spawnLead = 140, last = performance.now(), speed = 92;
      let busy = false, served = 0, walkouts = 0, waiting = 0;

      /* Every friend who eats their whole meal leaves a washed plate on the wall
       * for good — the one thing in the café that outlives the visit. */
      const plateV = ledger('cafe-plates'), plateMap = plateV.all();
      const plateIds = SPECIES.filter((s) => s !== 'ptero');
      const plateArt = (slot, id) => { slot.innerHTML = FX.dinoHTML(id, { color: COLORS[SPECIES.indexOf(id) % COLORS.length], state: 'happy' }); };
      const wall = collectRow('cafe-wall', 'sp', plateIds, plateMap, lockedSlot(), plateArt);

      const cafe = el('div', 'cafe');
      cafe.append(el('div', 'cafe-sign', 'DINO CAFÉ'), el('div', 'cafe-lights', '<i></i><i></i><i></i><i></i><i></i><i></i>'));
      const belt = el('div', 'belt'); belt.append(el('div', 'belt-roller'));
      const track = el('div', 'belt-track');
      const queue = el('div', 'cafe-queue'); queue.setAttribute('aria-label', 'Friends waiting at the door');
      cafe.append(belt, track, queue);
      ctx.area.append(wall, cafe);

      const seats = [];
      for (let i = 0; i < SEATS; i++) {
        const box = el('div', 'cafe-guest empty');
        box.style.width = '29%'; box.style.left = (2 + i * 34) + '%'; box.style.right = 'auto';
        box.innerHTML = '<span class="cafe-chair">🪵</span>';
        cafe.append(box);
        seats.push({ i, box, guest: null });
      }

      const hud = (window.Park.liveHud && Park.liveHud()) || ctx.area;
      const queueChip = el('div', 'lv-chip', '🐾 0 waiting');
      ctx.goal('Friends served', GOAL);
      hud.append(queueChip, helpBtn(showMe));

      const urn = ctx.drain('Tea urn', URN_SECONDS, () => {
        if (!ctx.alive()) return;
        ctx.say('The tea urn has run dry — the café is closing for today!');
        ctx.end(`The café shuts up with ${served} of ${GOAL} friends served.`);
      });

      const seated = () => seats.filter((s) => s.guest && !s.guest.done);
      const wants = () => seated().map((s) => s.guest.want);
      const beltW = () => cafe.clientWidth;
      /* Half the time a new arrival asks for something already ordered at another
       * table. That is the whole point of the live café: one dish on the belt, two
       * friends who want it, and only one of them can be saved from storming out. */
      function sharedWant(mine) {
        const at = wants().filter((w) => mine.includes(w));
        return at.length && Math.random() < .5 ? pick(at) : null;
      }

      function renderQueue() {
        queue.innerHTML = '';
        for (let i = 0; i < waiting; i++) queue.append(el('i', 'cafe-foot', '🐾'));
        queueChip.textContent = `🐾 ${waiting} waiting`;
        queueChip.classList.toggle('low', waiting >= 3);
      }
      function clearSeat(s) {
        s.guest = null;
        s.box.className = 'cafe-guest empty';
        s.box.innerHTML = '<span class="cafe-chair">🪵</span>';
        s.box.removeAttribute('aria-label');
      }
      function seatGuest(s, sp) {
        const mine = (sp === 'trex' || sp === 'raptor') ? shuffle(MEATS).slice(0, 4) : shuffle(PLANTS).slice(0, 5);
        const patMax = Math.max(17, 30 - ctx.clock() / 1000 / 4);
        const g = { sp, mine, want: sharedWant(mine) || pick(mine), fed: 0, done: false, patience: patMax, patMax, grumbled: false };
        s.guest = g;
        s.box.className = 'cafe-guest arriving';
        s.box.innerHTML = '';
        g.order = el('div', 'cafe-order'); g.order.innerHTML = '<span>I want</span><b></b>';
        $('b', g.order).textContent = g.want;
        g.dinoBox = el('div', 'cafe-dino', FX.dinoHTML(sp, { color: pick(COLORS), state: 'walk' }));
        g.hearts = el('div', 'cafe-hearts');
        for (let i = 0; i < MEALS; i++) g.hearts.append(el('i', '', window.DUICONS.i('star', { size: 16 })));
        g.patEl = el('div', 'cafe-pat', '<i></i>');
        s.box.append(g.order, g.dinoBox, g.hearts, g.patEl);
        g.dEl = g.dinoBox.firstElementChild;
        s.box.setAttribute('aria-label', `${SPNAME[sp]} is sitting down and wants ${objWord(g.want)}`);
        setTimeout(() => { if (ctx.alive()) s.box.classList.remove('arriving'); }, 900);
        FX.sfx.chirp();
        ctx.say(`${SPNAME[sp]} walks in and sits at table ${s.i + 1} — they want ${objWord(g.want)}!`);
      }
      function servePlate(g) {
        if (!plateIds.includes(g.sp)) return;
        if (plateV.set(g.sp, served) && stampInto(wall, plateArt, g.sp, served, 'Plate washed!')) {
          ctx.say(`${SPNAME[g.sp]} is full and leaves a clean plate — ${wall.dataset.got} of ${plateIds.length} on the wall!`);
          if (wall.classList.contains('full')) { ctx.bonus(2, wall, 'The whole wall is set!'); }
        }
      }
      function finishTable(s) {
        const g = s.guest; g.done = true;
        served++;
        FX.dinoState(g.dEl, 'happy', 1400); g.dEl.setAttribute('data-base', 'happy');
        s.box.classList.add('full');
        g.order.innerHTML = '<span>Thank you!</span><b>' + window.DUICONS.i('check', { size: 18 }) + '</b>';
        servePlate(g);
        urn.add(9);
        ctx.good(s.box);
        ctx.progress(1, s.box);
        ctx.say(`${SPNAME[g.sp]} is full and happy! Table ${s.i + 1} is free.`);
        setTimeout(() => { if (ctx.alive()) clearSeat(s); }, 1700);
      }
      function walkOut(s) {
        const g = s.guest; if (!g) return;
        walkouts++;
        FX.shake(s.box); FX.sfx.bad();
        ctx.bad(1, s.box);
        ctx.say(`${SPNAME[g.sp]} waited too long and has stomped home! That is ${walkouts} walk-out today.`);
        clearSeat(s);
      }
      function drainGuest(s, dt) {
        const g = s.guest; if (!g || g.done) return;
        g.patience -= dt;
        const frac = Math.max(0, g.patience / g.patMax);
        g.patEl.firstElementChild.style.width = (frac * 100) + '%';
        s.box.classList.toggle('impatient', frac < .55);
        s.box.classList.toggle('grumpy', frac < .25);
        if (frac < .25 && !g.grumbled) {
          g.grumbled = true;
          FX.dinoState(g.dEl, 'sad', 900);
          ctx.say(`${SPNAME[g.sp]} is getting cross! ${objWord(g.want)}, please!`);
        }
        if (g.patience <= 0) walkOut(s);
      }
      function drop(o) { const i = riding.indexOf(o); if (i >= 0) riding.splice(i, 1); o.el.remove(); }
      function spawn() {
        const ordered = wants();
        let f, kind = 'food';
        const roll = Math.random();
        if (ordered.length && roll < .58) f = pick(ordered);
        else if (roll < .68) { f = '🌟'; kind = 'gold'; }
        else if (roll < .78) { f = '🪢'; kind = 'junk'; }
        else { const pool = [...PLANTS, ...MEATS].filter((x) => !ordered.includes(x)); f = pick(pool.length ? pool : PLANTS); }
        const it = el('button', 'belt-item' + (kind === 'gold' ? ' gold' : ''), f);
        it.dataset.f = f;
        it.setAttribute('aria-label', kind === 'gold' ? 'A golden star' : kind === 'junk' ? 'Not food — an old coil of rope' : ordered.includes(f) ? `Food somebody ordered: ${objWord(f)}` : 'Food nobody has ordered');
        const o = { el: it, x: -90, f, kind };
        it.onclick = () => take(o);
        track.append(it); riding.push(o); FX.pop(it);
      }
      async function take(o) {
        if (busy || !ctx.alive()) return;
        if (o.kind === 'gold') { drop(o); FX.sfx.sparkle(); ctx.bonus(1, o.el, 'Golden!'); return; }
        busy = true;
        const matching = seats.filter((s) => s.guest && !s.guest.done && s.guest.want === o.f);
        drop(o);
        o.el.style.visibility = 'hidden';
        if (!matching.length) {
          ctx.bad(o.kind === 'junk' ? 1 : .5, cafe);
          ctx.say(o.kind === 'junk' ? 'Yuck, a coil of old rope! Nobody in this café eats rope!' : 'Nobody ordered that one — read the cards!');
          await Park.fly(o.el, { x: innerWidth * (Math.random() < .5 ? .05 : .95), y: -30 }, { emoji: o.f, lift: 30, duration: 520, burst: false });
          o.el.remove(); busy = false; return;
        }
        /* The choice the whole café turns on: whoever is closest to storming out eats
         * first. Ranked by how much of *their own* patience is left, because that is
         * the only thing the bar on screen can show — a friend who sat down later has
         * a shorter fuse, and ranking by raw seconds would serve the one whose bar
         * looks calmer and confuse every child watching. */
        const low = (s) => s.guest.patience / s.guest.patMax;
        const s = matching.reduce((a, b) => (low(a) <= low(b) ? a : b));
        const g = s.guest;
        await Park.fly(o.el, g.dinoBox, { emoji: o.f, size: 44, duration: 520, burst: false });
        o.el.remove();
        FX.sfx.chomp(); FX.dinoState(g.dEl, 'eat');
        g.fed++;
        [...g.hearts.children].forEach((h, k) => { h.innerHTML = window.DUICONS.i('star', { size: 16, filled: k < g.fed }); });
        g.patience = Math.min(g.patMax, g.patience + g.patMax * .45);
        g.grumbled = false;
        s.box.classList.remove('grumpy', 'impatient');
        const c = centreOf(g.dinoBox); FX.burst(c.x, c.y - 30, { kind: 'hearts', n: 5 });
        if (g.fed >= MEALS) finishTable(s);
        else {
          const next = g.mine.filter((x) => x !== g.want);
          g.want = sharedWant(next.length ? next : g.mine) || (next.length ? pick(next) : g.want);
          $('b', g.order).textContent = g.want; FX.pop(g.order);
          s.box.setAttribute('aria-label', `${SPNAME[g.sp]} now wants ${objWord(g.want)}`);
          FX.dinoState(g.dEl, 'idle', 700);
          ctx.say(`${SPNAME[g.sp]} munches and asks for a ${objWord(g.want)} next!`);
        }
        busy = false;
      }
      /* The free hint: it lights the food the most impatient friend wants and says
       * who that is. It never costs anything, however often it is pressed. */
      function showMe() {
        if (!ctx.alive()) return;
        const at = seated();
        if (!at.length) { ctx.say('Every table is empty — the belt is still moving, so have a look!'); return; }
        const urgent = at.reduce((a, b) => (a.guest.patience / a.guest.patMax <= b.guest.patience / b.guest.patMax ? a : b));
        const it = riding.find((o) => o.f === urgent.guest.want);
        if (it) { it.el.classList.add('glow'); setTimeout(() => it.el.classList.remove('glow'), 2200); }
        FX.pulse(urgent.guest.order); FX.sfx.sparkle();
        ctx.say(it ? `Tap the glowing ${objWord(it.f)} — ${SPNAME[urgent.guest.sp]} at table ${urgent.i + 1} is the hungriest!` : `${SPNAME[urgent.guest.sp]} wants ${objWord(urgent.guest.want)} — watch the belt for it!`);
      }
      ctx.hint(showMe);

      function frame(now) {
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        if (busy) return;
        speed = 92 + Math.min(85, ctx.clock() / 1000 * .8);
        const dx = speed * dt; spawnLead += dx;
        riding.forEach((o) => { o.x += dx; o.el.style.transform = `translateX(${o.x}px)`; });
        for (let i = riding.length - 1; i >= 0; i--) if (riding[i].x > beltW() + 30) drop(riding[i]);
        if (spawnLead > 205) { spawnLead = 0; spawn(); }
        seats.forEach((s) => drainGuest(s, dt));
      }
      ctx.frame(frame);

      /* Arrivals: a free table takes the next friend from the door, and a full
       * café makes a queue that eventually gives up and goes home. */
      ctx.every(2300, () => {
        const free = seats.find((s) => !s.guest);
        if (free) {
          if (waiting > 0) waiting--;
          else if (Math.random() > .78) { renderQueue(); return; }
          const taken = seats.filter((s) => s.guest).map((s) => s.guest.sp);
          seatGuest(free, pick(SPECIES.filter((sp) => !taken.includes(sp))) || pick(SPECIES));
        } else if (waiting < 5) {
          waiting++;
          if (waiting === 3) ctx.say('Three friends are waiting at the door — somebody is going to give up!');
        } else {
          waiting = 0; walkouts++;
          ctx.bad(.5, queue);
          ctx.say('A friend gave up waiting outside and went home!');
        }
        renderQueue();
      });

      seatGuest(seats[0], pick(SPECIES));
      renderQueue();
      ctx.say('Welcome to the Dino Café! The belt never stops — read the cards and feed whoever is hungriest.');
    },
  });

  /* ====================================================================== 11. Dino Dash */
  const DASH_MARKS = ['🌿', '🌋', '❄️', '🌙', '🌈'];
  const DASH_THEMES = [
    { name: 'Sunny Meadow', sky: ['#7fd0f2', '#e9f8d4'], m1: '#8cc4a6', m2: '#a6d6b4', ground: '#6bbf5f', ground2: '#4f9f47', obs: ['rock', 'log', 'bush'], len: 3400, amb: 'meadow', fx: 'flies', tree: 'round' },
    { name: 'Volcano Trail', sky: ['#ff9a6b', '#ffe3a8'], m1: '#a8604a', m2: '#c4785a', ground: '#a66a45', ground2: '#7d4b2c', obs: ['rock', 'fire', 'cactus'], len: 4400, amb: 'volcano', fx: 'embers', tree: 'dead' },
    { name: 'Snowy Hills', sky: ['#a6d4f5', '#f2fbff'], m1: '#9ab7d0', m2: '#bcd2e4', ground: '#eef6fb', ground2: '#c5dcec', obs: ['snowman', 'ice', 'rock'], len: 5400, amb: 'snow', fx: 'snow', tree: 'pine' },
    { name: 'Moonlight Run', sky: ['#1d1b5c', '#5b4fa8'], m1: '#3d3f8f', m2: '#4d50a3', ground: '#3a8a74', ground2: '#2c6e60', obs: ['mushroom', 'rock', 'log'], len: 6200, amb: 'night', fx: 'fireflies', tree: 'round', night: true },
    { name: 'Rainbow Ridge', sky: ['#ffd6f2', '#d9f0ff'], m1: '#c9a0f0', m2: '#9fd8f5', ground: '#f3a8dd', ground2: '#d17cb8', obs: ['rock', 'bush', 'ice', 'mushroom', 'log'], len: 6900, amb: 'rainbow', fx: 'bubbles', tree: 'round' },
  ];
  /* Bold, outlined shapes so every obstacle stands out against the scenery. Each draws itself sitting on y = 0 at x = 0. */
  /* Every obstacle now stands as its photograph — the bold outlined shapes were
   * the last clip art left on the track. The declared w/h stays as the hitbox
   * and the picture is drawn to its own shape inside it: art a touch smaller
   * than the box reads as a generous game, never an unfair one. The park's
   * canvases are plain scripts, so the prop module arrives on its own; a
   * picture that is still decoding leaves the ground bare for a frame rather
   * than put a drawing back. */
  let drawProp = null;
  import('../../../photoreal-textures.js?v=du-7ebd3d49aa7fa37b').then((m) => { drawProp = m.drawProp; }).catch(() => {});
  const thing = (ctx, name, x, y, size, glow) => {
    if (glow) { ctx.shadowColor = 'rgba(255,230,120,.9)'; ctx.shadowBlur = 14; }
    window.DUFX.objects.draw(ctx, name, x, y, size);
    if (glow) ctx.shadowBlur = 0;
  };
  const OB = {
    rock: { w: 52, h: 40, draw(c) { if (drawProp) drawProp(c, 'boulder', -29, -28, 58, 28); } },
    log: { w: 70, h: 36, draw(c) { if (drawProp) drawProp(c, 'fallen-log', -36, -24, 72, 24); } },
    bush: { w: 56, h: 42, draw(c) { if (drawProp) drawProp(c, 'fern', -28, -38, 56, 38); } },
    cactus: { w: 40, h: 60, draw(c) { if (drawProp) drawProp(c, 'cactus', -20, -60, 40, 60); } },
    fire: { w: 44, h: 56, draw(c) { thing(c, 'flame', 0, -27, 54); } },
    snowman: { w: 44, h: 64, draw(c) { if (drawProp) drawProp(c, 'snowman', -22, -65, 44, 65); } },
    ice: { w: 46, h: 52, draw(c) { thing(c, 'snowflake', 0, -26, 52); } },
    mushroom: { w: 50, h: 48, draw(c) { thing(c, 'mushroom', 0, -24, 48); } },
  };
  window.Park.register({
    id: 'dash', name: 'Dino Dash', icon: 'trex', color: '#2f9e5e', rounds: 5, helper: 'trex', ambient: 'meadow',
    desc: 'Run, jump over things, and collect stars!',
    round(ctx) {
      const T = DASH_THEMES[ctx.round - 1];
      const landscape = new Image();
      landscape.src = environmentBase + ['jungle','volcanic','ice','night','mountain'][ctx.round-1] + '.webp';
      FX.ambient(null);
      ctx.say(T.name + '! Get ready to run!');
      const bestTime = rec.get('dash' + ctx.round);
      ctx.area.append(recordBar(bestTime === null ? `Run ${T.name} to the flag and set your very first time!` : `Your best ${T.name} run is <b>${bestTime}s</b>. Beat it!`));
      /* The track cabinet: every course you reach the flag on keeps a shelf here for good. */
      const trackV = ledger('dash-tracks'), trackMap = trackV.all();
      const trackIds = DASH_THEMES.map((_, i) => String(i + 1));
      const dashArt = (s, id) => { const i = Number(id) - 1; s.innerHTML = '<i>' + DASH_MARKS[i] + '</i><small>' + DASH_THEMES[i].name.split(' ')[0] + '</small>'; };
      const dashCase = collectRow('dash-case', 't', trackIds, trackMap, '<i>' + window.DUICONS.i('lock', { size: 16 }) + '</i>', dashArt);
      const head = statusBar([`Level ${ctx.round}`, T.name,
        bestTime === null ? 'No time yet' : `Best ${bestTime}s`, `Tracks ${dashCase.dataset.got}/${trackIds.length}`], '#2f9e5e');
      const trackBit = $('.du-bar-3', head);
      ctx.area.append(head, dashCase);
      const wrap = el('div', 'dash-wrap');
      const cv = el('canvas', 'dash-cv'); cv.width = 1080; cv.height = 450;
      const sprite = el('div', 'dash-dino', FX.dinoHTML(ctx.round === 2 ? 'raptor' : ctx.round === 4 ? 'tricera' : ctx.round === 5 ? 'stego' : 'trex', { state: 'idle', color: ctx.round === 3 ? 'blue' : ctx.round === 4 ? 'purple' : ctx.round === 5 ? 'pink' : 'green' }));
      const hud = el('div', 'dash-hud', '<span class="dh-stars">⭐ <b id="dStars">0</b></span><span class="dh-eggs" id="dEggs">🥚🥚🥚</span>' + (bestTime ? `<span id="dBest">⏱ ${bestTime}s</span>` : '<span id="dBest">⏱ new track</span>') + `<span id="dStreak" title="Clean jumps in a row — fill the bar for big-jump legs">⚡ 0/${[3, 4, 4, 5, 5][ctx.round - 1]}</span><div class="dash-prog"><i id="dProg"></i><em id="dMark">🦖</em><b>🏁</b></div><div class="dash-super" id="dSuper" title="Collect stars to fill the super meter"><i></i></div>`);
      const count = el('div', 'dash-count', '3');
      wrap.append(cv, sprite, hud, count); ctx.area.append(wrap);
      const c = cv.getContext('2d'), W = 720, H = 300, GY = 236, DX = 140;
      c.setTransform(1.5, 0, 0, 1.5, 0, 0);
      const dEl = sprite.firstElementChild;
      const P = { y: 0, vy: 0, jumps: 0, maxJumps: 2, x: 0, speed: 215 + ctx.round * 16, stumble: 0, inv: 0, stars: 0, eggs: 0, meter: 0, superT: 0, started: false, slow: 0, shield: 0, boosted: false };
      let obs = [], picks = [], nextObs = 560, last = performance.now(), over = false, time = 0, combo = 0, comboT = 0, rewarded = 0, stumbles = 0, nextBalloon = 900, balloonsGot = 0, runT = 0;
      /* Clean jumps in a row: land the required number without touching anything and this dinosaur
       * grows big-jump legs — a third jump, and a bigger sprite on the track. */
      const streakNeed = [3, 4, 4, 5, 5][ctx.round - 1];
      let clean = 0;
      const stEl = () => $('#dStreak');
      const showStreak = () => { const s = stEl(); if (s) s.textContent = P.boosted ? '⚡ BIG JUMPS!' : `⚡ ${Math.min(clean, streakNeed)}/${streakNeed}`; };
      const eggAt = [.3, .55, .8].map((f) => T.len * f);
      let eggIdx = 0;
      const sparks = [];      // rainbow trail and impact sparks, drawn on the canvas
      const clouds = Array.from({ length: 5 }, () => ({ x: rnd(W), y: 20 + rnd(80), s: .6 + Math.random() }));
      const birds = Array.from({ length: 3 }, (_, i) => ({ x: rnd(W), y: 40 + i * 24 + rnd(20), s: .5 + Math.random() * .5 }));
      const bits = Array.from({ length: 26 }, () => ({ x: rnd(W), y: rnd(H - 70), p: Math.random() * 6, s: .4 + Math.random() }));   // snow, embers, fireflies, butterflies
      const jump = () => {
        if (over || !P.started) return;
        if (P.jumps >= P.maxJumps) return;
        P.vy = P.jumps === 0 ? 560 : P.jumps === 1 ? 470 : 430; P.jumps++; FX.sfx.boing(); if (P.jumps >= 2) FX.sfx.whoosh();
        FX.dinoState(dEl, 'happy'); dEl.setAttribute('data-base', 'idle');
        const r = sprite.getBoundingClientRect(); FX.burst(r.left + r.width * .4, r.bottom - 6, { kind: 'dust', n: 4, scale: .7 });
      };
      cv.addEventListener('pointerdown', jump); sprite.addEventListener('pointerdown', jump);
      const key = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); } };
      window.addEventListener('keydown', key);
      const stop = () => window.removeEventListener('keydown', key);
      // The helper slows the world for a heartbeat and points out the next jump.
      const showMe = () => {
        if (over || !P.started) return;
        const o = obs.filter((q) => q.x - P.x > 10 && q.x - P.x < 620).sort((a, b) => a.x - b.x)[0];
        P.slow = 1.1; FX.sfx.sparkle();
        const r = sprite.getBoundingClientRect();
        if (o) {
          const px = r.left + (o.x - P.x) * (cv.clientWidth / W);
          FX.floatText(Math.min(innerWidth - 60, px), r.top + 30, 'JUMP NOW!', { size: 26, color: '#ffffff' });
          FX.burst(px, r.bottom - 30, { kind: 'stars', n: 8, scale: .8 });
          ctx.say(P.boosted ? 'Here it comes — tap three times for the biggest jump you have!' : 'Here it comes — tap to jump! Tap twice for a very high jump!');
        } else { ctx.say('Clear road! Look for the balloons floating down the track.'); FX.floatText(r.left + 200, r.top + 40, 'Balloon hunt!', { size: 22 }); }
      };
      ctx.hint(showMe);
      head.append(helpBtn(showMe));

      /* ---- scenery ---- */
      const hills = (col, h, step, sp) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, GY); for (let x = -step * 2; x <= W + step * 2; x += step) { const px = x - ((P.x * sp) % (step * 2)); c.lineTo(px + step / 2, GY - h - (((Math.round(x / step)) % 2) ? 0 : h * .55)); c.lineTo(px + step, GY - h * .35); } c.lineTo(W + step * 2, GY); c.fill(); };
      const tree = (x, kind) => {
        const y = GY - 6;
        if (kind === 'pine') { if (drawProp) drawProp(c, 'pine', x - 25, y - 72, 50, 78); }
        else if (kind === 'dead') thing(c, 'driftwood', x, y - 20, 50);
        else thing(c, 'pine', x, y - 30, 62);
      };
      const star = (x, y, r, spin) => { c.save(); c.translate(x, y); c.rotate(spin * .5); thing(c, 'star', 0, 0, r * 2.3, true); c.restore(); };
      const egg = (x, y, bob) => { c.save(); c.translate(x, y + bob); thing(c, 'egg', 0, 0, 48, true); c.restore(); };
      // Balloons drift along the track: grab three for a bonus sparkle.
      const balloon = (x, y, sway) => { if (drawProp) drawProp(c, 'balloon', x + sway - 26, y - 37, 52, 100); };
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
        if (landscape.complete && landscape.naturalWidth) {
          const k=Math.max(W/landscape.naturalWidth,H/landscape.naturalHeight)*1.03;
          const width=landscape.naturalWidth*k,height=landscape.naturalHeight*k;
          c.drawImage(landscape,(W-width)/2+Math.sin(P.x*.0003)*W*.01,(H-height)/2,width,height);
        }
        // Weather and little creatures, each theme has its own.
        bits.forEach((b) => {
          const sp = T.fx === 'snow' ? 40 : (T.fx === 'embers' || T.fx === 'bubbles') ? -50 : 0, x = ((b.x - P.x * .3 * b.s + Math.sin(time * b.s + b.p) * 14) % W + W) % W, y = ((b.y + sp * time * b.s) % (H - 60) + (H - 60)) % (H - 60);
          if (T.fx === 'snow') { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x, y, 2 + b.s, 0, 6.3); c.fill(); }
          else if (T.fx === 'embers') { c.fillStyle = `rgba(255,${120 + (b.p * 20 | 0)},40,.85)`; c.beginPath(); c.arc(x, GY - 20 - (y % 160), 2 + b.s, 0, 6.3); c.fill(); }
          else if (T.fx === 'fireflies') { c.fillStyle = `rgba(255,248,150,${.4 + .6 * Math.abs(Math.sin(time * 2 + b.p))})`; c.shadowColor = '#fff59d'; c.shadowBlur = 10; c.beginPath(); c.arc(x, GY - 30 - (y % 110), 2.4, 0, 6.3); c.fill(); c.shadowBlur = 0; }
          else if (T.fx === 'bubbles') { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.8; c.beginPath(); c.arc(x, y, 3 + b.s * 4, 0, 6.3); c.stroke(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fill(); }
          else if (b.s > .95) { c.globalAlpha = 1; window.DUFX.objects.draw(c, 'dragonfly', x, 70 + (y % 110) - 11, 22); }
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
        picks.forEach((p) => { if (p.got) return; const px = p.x - P.x + DX; if (px < -50 || px > W + 50) return; const py = GY - p.h + Math.sin(time * 5 + p.x * .05) * 4; if (p.egg) egg(px, py, 0); else if (p.balloon) balloon(px, py, Math.sin(time * 2 + p.x * .03) * 7); else { c.shadowColor = 'rgba(255,230,120,.9)'; c.shadowBlur = 14; star(px, py, 19, Math.sin(time * 3 + p.x) * .25); c.shadowBlur = 0; } });
        // Sparks: rainbow trail while super, bursts when a rock is smashed
        for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= .016; if (s.life <= 0) { sparks.splice(i, 1); continue; } s.x += s.vx; s.y += s.vy; c.globalAlpha = Math.max(0, s.life * 2); c.fillStyle = s.col; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.3); c.fill(); c.globalAlpha = 1; }
        // Dino shadow
        c.fillStyle = `rgba(0,0,0,${.28 - Math.min(.2, P.y / 600)})`; c.beginPath(); c.ellipse(DX + 6, GY + 4, 38 - Math.min(14, P.y / 8), 7, 0, 0, 6.3); c.fill();
        if (P.superT > 0) { c.strokeStyle = `rgba(255,255,255,${.5 + .4 * Math.sin(time * 20)})`; c.lineWidth = 4; c.beginPath(); c.arc(DX + 6, GY - P.y - 32, 52, 0, 6.3); c.stroke(); }
        // A soap-bubble shield after three stumbles keeps the run friendly.
        if (P.shield > 0) { c.strokeStyle = `rgba(150,235,255,${.5 + .35 * Math.sin(time * 9)})`; c.lineWidth = 5; c.beginPath(); c.arc(DX + 6, GY - P.y - 32, 60, 0, 6.3); c.stroke(); c.fillStyle = 'rgba(190,240,255,.15)'; c.fill(); }
        if (P.slow > 0) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 0, W, H); }
      }
      const rainbow = ['#ff5252', '#ffa726', '#ffee58', '#66bb6a', '#42a5f5', '#ab47bc'];
      const hudStars = () => { $('#dStars').textContent = P.stars; const m = $('#dSuper i'); if (m) m.style.width = (P.superT > 0 ? P.superT / 4 * 100 : P.meter / 8 * 100) + '%'; };
      function frame(now) {
        if (!ctx.alive() || over) { stop(); return; }
        const dt = Math.min(.04, (now - last) / 1000); last = now; time += dt;
        if (P.started) {
          P.superT = Math.max(0, P.superT - dt); P.slow = Math.max(0, P.slow - dt); P.shield = Math.max(0, P.shield - dt);
          const sp = P.speed * (P.stumble > 0 ? .5 : 1) * (P.superT > 0 ? 1.35 : 1) * (P.slow > 0 ? .6 : 1);
          P.x += sp * dt; P.stumble = Math.max(0, P.stumble - dt); P.inv = Math.max(0, P.inv - dt); comboT = Math.max(0, comboT - dt); if (!comboT) combo = 0; runT += dt;
          const bt = $('#dBest'); if (bt) bt.textContent = '⏱ ' + runT.toFixed(1) + 's';
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
          // Balloons drift past on the wind: a third little hunt along the track.
          if (P.x > nextBalloon && P.x < T.len - 340) { picks.push({ x: P.x + 780, h: 92 + rnd(64), got: false, balloon: true }); nextBalloon = P.x + 600 + rnd(430); }
          obs = obs.filter((o) => o.x - P.x > -200); picks = picks.filter((p) => p.x - P.x > -200);
          obs.forEach((o) => {
            const ox = o.x - P.x + DX, half = o.def.w * .42 + 10;
            if (Math.abs(ox - DX) < half && P.y < o.def.h * .75 && !o.hit) {
              o.hit = true;
              if (P.superT > 0) {
                // Smashed! The rock bursts into stars.
                for (let k = 0; k < 14; k++) sparks.push({ x: ox, y: GY - 20, vx: (Math.random() - .5) * 7, vy: -Math.random() * 6, r: 2 + Math.random() * 3, life: .6 + Math.random() * .4, col: pick(rainbow) });
                FX.sfx.thud(); FX.sfx.sparkle(); o.x = -9999; P.stars++; hudStars();
              } else if (P.shield > 0) {
                // The soap bubble pops instead of the child taking the bump.
                P.shield = 0; o.x = -9999; FX.sfx.whoosh(); FX.sfx.sparkle();
                for (let k = 0; k < 14; k++) sparks.push({ x: ox, y: GY - 26, vx: (Math.random() - .5) * 5, vy: -Math.random() * 5, r: 2 + Math.random() * 3, life: .8, col: '#bdf0ff' });
                const rr = sprite.getBoundingClientRect(); FX.floatText(rr.left + rr.width * .8, rr.top + 10, 'Shield popped!', { size: 22 });
                ctx.say('Your bubble took that one for you! Keep going!');
              } else if (!P.inv) {
                stumbles++; clean = 0; showStreak();
                P.stumble = .8; P.inv = 1.3; ctx.bad(.4, sprite); FX.dinoState(dEl, 'sad', 800); FX.shakeScreen(3); FX.sfx.thud(); combo = 0; P.meter = Math.max(0, P.meter - 2); hudStars();
                ctx.say('That was a rock! Tap just as it reaches you to hop right over it.');
                // Three bumps and a bubble shield joins the run, so nobody gets stuck losing.
                if (stumbles === 3) { P.shield = 5.5; FX.sfx.sparkle(); ctx.say('Here comes a bubble shield — it will take the next bump for you!'); }
                for (let k = 0; k < 8; k++) sparks.push({ x: DX + 10, y: GY - 14, vx: (Math.random() - .3) * 5, vy: -Math.random() * 4, r: 2 + Math.random() * 2, life: .5, col: '#d8c8a8' });
                setTimeout(() => { if (ctx.alive() && !P.stumble) { FX.dinoState(dEl, 'run'); dEl.setAttribute('data-base', 'run'); } }, 850);
              }
            }
            /* Past it without a touch: that is one clean jump on the streak bar. */
            if (!o.hit && !o.done && o.x - P.x < -60) {
              o.done = true; clean++; showStreak();
              if (!P.boosted && clean >= streakNeed) {
                P.boosted = true; P.maxJumps = 3; sprite.classList.add('boosted');
                ctx.bonus(1, sprite, 'Big-jump legs!'); FX.sfx.roar(); FX.shakeScreen(3); ctx.flutter(2);
                const s = stEl(); if (s) { FX.pulse(s); }
                ctx.say(`${clean} clean jumps in a row! Big-jump legs — tap three times for the highest leap yet!`);
              } else if (clean === streakNeed - 1) { ctx.say('One more clean jump for big-jump legs!'); }
            }
          });
          picks.forEach((p) => {
            const px = p.x - P.x + DX;
            if (!p.got && Math.abs(px - DX) < (p.egg ? 34 : 30) && Math.abs(p.h - (P.y + 30)) < (p.egg ? 46 : 44)) {
              p.got = true; const r = sprite.getBoundingClientRect();
              if (p.egg) {
                P.eggs++; FX.sfx.win(); FX.floatText(r.left + r.width * .6, r.top, 'Golden egg!', { size: 26 }); FX.burst(r.left + r.width * .6, r.top, { kind: 'confetti', n: 22 });
                const dots = $('#dEggs'); if (dots) dots.textContent = '🥚'.repeat(P.eggs) + '⚪'.repeat(3 - P.eggs); P.stars += 3; P.meter = Math.min(8, P.meter + 3);
              } else if (p.balloon) {
                balloonsGot++; P.stars += 2; P.meter = Math.min(8, P.meter + 2); FX.sfx.pop(); FX.sfx.chirp();
                FX.floatText(r.left + r.width * .6, r.top - 8, `Balloon ${balloonsGot}/3!`, { size: 24 });
                FX.burst(r.left + r.width * .6, r.top + 10, { kind: 'confetti', n: 12 });
                if (balloonsGot === 3) { balloonsGot = 0; ctx.bonus(2, { x: r.left + r.width * .6, y: r.top - 20 }, 'Balloon trio!'); ctx.say('Three balloons! A collecting champion!'); }
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
          /* The course you just ran takes its place in the track cabinet, for good. */
          if (trackV.set(String(ctx.round), ctx.round) && stampInto(dashCase, dashArt, String(ctx.round), ctx.round, 'Track won!')) {
            if (trackBit) trackBit.textContent = `Tracks ${dashCase.dataset.got}/${trackIds.length}`;
            ctx.say(`${T.name} stands in your track cabinet — ${dashCase.dataset.got} of ${trackIds.length} courses won!`);
            if (dashCase.classList.contains('full')) { ctx.bonus(2, dashCase, 'Every track in the park!'); }
          }
          const secs = Math.max(1, Math.round(runT * 10) / 10);
          const fresh = rec.lo('dash' + ctx.round, secs);
          if (fresh) { ctx.bonus(2, sprite, 'Fastest run ever!'); }
          ctx.done(`You made it to the flag in ${secs}s! ${P.stars} stars${P.eggs ? ' and ' + P.eggs + ' egg' + (P.eggs > 1 ? 's' : '') : ''}` + (P.boosted ? ' and big-jump legs' : '') + (fresh ? ' — a brand-new record!' : '!'), 2500); return;
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
  /* Every egg carries a pattern. The nest below asks for one at a time, and each pattern you
   * land in the nest keeps its place there for good — and more patterns join the sky each level. */
  const PAT = ['dots', 'stripes', 'zigzag', 'spots'];
  const EGG_PATTERNS = {
    dots: '<g fill="#ffffff" opacity=".85"><circle cx="12" cy="35" r="2.7"/><circle cx="22" cy="42" r="2.2"/><circle cx="28" cy="24" r="2.1"/></g>',
    stripes: '<g fill="none" stroke="#ffffff" stroke-width="3" opacity=".8" stroke-linecap="round"><path d="M8 23 q12 6 24 0"/><path d="M8 33 q12 6 24 0"/></g>',
    zigzag: '<path d="M7 30 l6 -6 l6 6 l6 -6 l6 6" fill="none" stroke="#ffffff" stroke-width="2.8" opacity=".9" stroke-linecap="round"/>',
    spots: '',
  };
  const EGG_ART = {
    cream: (f, s, pat) => `<svg viewBox="0 0 40 52"><ellipse cx="20" cy="29" rx="15" ry="20" fill="${f}" stroke="#7a4a1c" stroke-width="3"/><circle cx="14" cy="22" r="3.4" fill="${s}"/><circle cx="25" cy="32" r="3.8" fill="${s}"/><circle cx="16" cy="38" r="2.8" fill="${s}"/><ellipse cx="13" cy="19" rx="3" ry="5" fill="#fff" opacity=".55" transform="rotate(-20 13 19)"/>${(pat && EGG_PATTERNS[pat]) || ''}</svg>`,
    gold: () => '<svg viewBox="0 0 40 52"><defs><radialGradient id="gg"><stop offset="0" stop-color="#fff7b0"/><stop offset="1" stop-color="#ffb300"/></radialGradient></defs><ellipse cx="20" cy="29" rx="16" ry="21" fill="url(#gg)" stroke="#8a5a00" stroke-width="3"/><path d="M10 28 l5 -6 l5 6 l5 -6 l5 6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="13" cy="18" rx="3" ry="5" fill="#fff" opacity=".7" transform="rotate(-20 13 18)"/></svg>',
    rainbow: () => '<svg viewBox="0 0 40 52"><defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5252"/><stop offset=".25" stop-color="#ffee58"/><stop offset=".5" stop-color="#66bb6a"/><stop offset=".75" stop-color="#42a5f5"/><stop offset="1" stop-color="#ab47bc"/></linearGradient></defs><ellipse cx="20" cy="29" rx="16" ry="21" fill="url(#rg)" stroke="#4a2a6a" stroke-width="3"/><ellipse cx="13" cy="18" rx="3" ry="5" fill="#fff" opacity=".7" transform="rotate(-20 13 18)"/></svg>',
    rock: () => '<svg viewBox="0 0 50 46"><polygon points="4,42 8,20 22,6 40,12 47,30 44,42" fill="#5d6675" stroke="#1f2430" stroke-width="3.5" stroke-linejoin="round"/><polygon points="12,22 22,11 32,15 22,26" fill="#8791a3"/><circle cx="34" cy="31" r="3" fill="#434a57"/></svg>',
  };
  const EGG_TINTS = [['#fff1d0', '#f0a35a'], ['#d6efff', '#5aa8e0'], ['#ffe0ec', '#e8709a'], ['#e3f7d2', '#6cbf6a']];
  window.Park.register({
    id: 'catch', name: 'Egg Catch', icon: 'ptero', color: '#d19a14', rounds: 5, helper: 'ptero', ambient: 'meadow',
    desc: 'Catch the falling eggs in your basket!',
    round(ctx) {
      const R = ctx.round, gold = R === 5;    // the top level is a golden rain of special eggs
      const goal = [8, 12, 16, 20, 10][R - 1], fall = [150, 185, 215, 245, 178][R - 1];
      ctx.say(gold ? 'Golden rain! Catch the shiny ones — and dodge the rocks!' : 'Move to catch the eggs! Watch out for rocks!');
      const bestCombo = rec.get('catch');
      ctx.area.append(recordBar(bestCombo ? `Your best catch streak is <b>${bestCombo}</b> in a row. Beat it!` : 'Chain eggs without a miss to set your first catch record!'));
      /* The nest: each pattern of egg you land takes a place in it, and the nest gets roomier every level. */
      const nestV = ledger('catch-nest'), nestMap = nestV.all();
      const pats = PAT.slice(0, Math.min(4, 1 + R));
      const nestIds = [...pats, 'gold', 'rainbow'];
      const nestArt = (s, id) => {
        s.innerHTML = '<i>' + (id === 'gold' ? EGG_ART.gold() : id === 'rainbow' ? EGG_ART.rainbow() : EGG_ART.cream('#fff1d0', '#f0a35a', id)) + '</i>';
      };
      const nest = collectRow('catch-nest', 'p', nestIds, nestMap, '<i>🪺</i>', nestArt);
      const nextWant = () => { const have = nestV.all(); return nestIds.filter((p) => !have[p])[0] || pick(nestIds); };
      let want = nextWant();
      const setWant = () => {
        $$('.x-slot', nest).forEach((s) => s.classList.toggle('want', s.dataset.p === want));
        nest.dataset.want = want;
      };
      setWant();
      const head = statusBar([`Level ${R}`, `${goal} eggs · ${nestIds.length} patterns`,
        bestCombo === null ? 'No streak yet' : `Best ${bestCombo} in a row`, `Nest ${nest.dataset.got}/${nestIds.length}`], '#d19a14');
      const nestBit = $('.du-bar-3', head);
      ctx.area.append(head, nest);
      const field = el('div', 'catch-field');
      const bg = el('div', 'catch-bg', '<i class="cb-sun">☀️</i><i class="cb-cloud c1">☁️</i><i class="cb-cloud c2">☁️</i><div class="cb-hills"></div><div class="cb-trees"><span>🌳</span><span>🌲</span><span>🌳</span><span>🌴</span><span>🌲</span><span>🌳</span></div><div class="cb-grass"></div>');
      if (gold) bg.style.filter = 'sepia(.45) saturate(1.6) hue-rotate(-12deg)';
      const fly = el('div', 'catch-flyer', FX.dinoHTML('ptero', { color: 'pink' }));
      const hero = el('div', 'catch-hero', FX.dinoHTML(pick(['stego', 'tricera', 'bronto']), { color: pick(COLORS), state: 'idle' }));
      const basket = el('div', 'catch-basket', '<svg viewBox="0 0 100 64"><path d="M6 14 Q50 -4 94 14 L82 58 Q50 66 18 58Z" fill="#d9a05b" stroke="#6b4018" stroke-width="4" stroke-linejoin="round"/><path d="M14 26 Q50 36 86 26 M18 40 Q50 50 82 40" fill="none" stroke="#a8692f" stroke-width="3"/><ellipse cx="50" cy="14" rx="44" ry="9" fill="#8a5a28" stroke="#6b4018" stroke-width="4"/></svg>');
      const hud = el('div', 'catch-hud', `<span>🥚 <b id="cN">0</b> / ${goal}</span><span id="cStreak">🔥 0</span><div class="catch-bar"><i id="cBar"></i></div><span id="cBuff" class="catch-buff"></span>`);
      hud.style.cssText = 'display:flex;align-items:center;gap:10px';
      field.append(bg, fly, hero, basket, hud); ctx.area.append(field);
      const hEl = hero.querySelector('.du-dino');
      let fw = field.clientWidth, x = fw / 2, target = fw / 2, got = 0, items = [], spawnT = .8, last = performance.now(), over = false, pxFly = 40, dir = 1, still = 0, combo = 0, big = 0, magnet = 0, time = 0, rewarded = 0, misses = 0, best = 0, soft = 0, noRocks = 0;
      // From the third level a crosswind sways everything on the way down.
      const wind = R >= 3 ? 16 + (R - 2) * 12 : 0;
      const place = (cx) => { target = Math.max(60, Math.min(field.clientWidth - 60, cx - field.getBoundingClientRect().left)); };
      field.addEventListener('pointermove', (e) => place(e.clientX)); field.addEventListener('pointerdown', (e) => place(e.clientX));
      const key = (e) => { if (e.key === 'ArrowLeft') target -= 80; if (e.key === 'ArrowRight') target += 80; target = Math.max(60, Math.min(field.clientWidth - 60, target)); };
      window.addEventListener('keydown', key);
      // The free hint: it shows how to steer and, once, which falling egg the nest is asking for.
      const showMe = () => {
        FX.sfx.sparkle();
        const ask = items.find((it) => it.pat === want && it.kind !== 'rock');
        if (ask) {
          ask.n.classList.add('hint-me'); FX.pulse(ask.n);
          setTimeout(() => ask.n && ask.n.classList.remove('hint-me'), 2400);
          ctx.say(`Slide left and right! The nest wants the ${want} egg — that shining one is it!`);
          return;
        }
        ctx.say('Slide your finger left and right to move the basket!'); FX.pulse(basket);
      };
      ctx.hint(showMe);
      head.append(helpBtn(showMe));
      const cN = $('#cN'), bar = $('#cBar'), buff = $('#cBuff'), stN = $('#cStreak');
      const setBuff = () => { buff.textContent = (big > 0 ? `🌈 Giant basket ${Math.ceil(big)}  ` : '') + (soft > 0 ? `🪶 Floaty ${Math.ceil(soft)}` : ''); };
      function kindNow() {
        const r = Math.random();
        const rock = noRocks > 0 ? 0 : gold ? .08 : .15 + R * .025;
        if (r < rock) return 'rock';
        const goldChance = gold ? .3 : .05;
        if (r < rock + goldChance) return 'gold';
        if (r < rock + goldChance + .035 + (R >= 2 ? .025 : 0)) return 'feather';
        if (r < rock + goldChance + .06 + (R >= 2 ? .035 : 0)) return 'rainbow';
        return 'egg';
      }
      function addItem(kind, sx) {
        // A plain egg wears one of the patterns this level knows; gold and rainbow eggs carry their own.
        const pat = kind === 'rock' || kind === 'feather' ? null : kind === 'gold' ? 'gold' : kind === 'rainbow' ? 'rainbow' : pick(pats);
        const tint = gold ? ['#fff3cf', '#ffb300'] : pick(EGG_TINTS), n = el('div', 'catch-egg ' + kind);
        if (pat) n.dataset.p = pat;
        n.innerHTML = kind === 'rock' ? EGG_ART.rock() : kind === 'gold' ? EGG_ART.gold() : kind === 'rainbow' ? EGG_ART.rainbow() : kind === 'feather' ? '<span style="font-size:34px;line-height:1">🪶</span>' : EGG_ART.cream(tint[0], tint[1], pat);
        if (pat === want) n.classList.add('wanted');
        n.style.transform = `translate(${sx}px,40px)`; field.append(n);
        items.push({ n, x: sx, y: 40, kind, pat, vy: fall * (.85 + Math.random() * .3) * (kind === 'feather' ? .6 : 1), spin: (Math.random() - .5) * 90, ph: Math.random() * 6 });
        FX.sfx.tap();
      }
      /* A caught pattern goes into the nest for good, and an egg of the asked-for pattern pays a sparkle. */
      function toNest(pat) {
        if (!pat) return;
        if (pat === want) {
          ctx.bonus(1, nest, 'Nest order filled!');
          ctx.say(`The nest wanted a ${pat} egg and you brought one! +1⭐`);
          want = nextWant(); setWant();
        }
        if (nestV.set(pat, R) && stampInto(nest, nestArt, pat, R, 'In the nest!')) {
          if (nestBit) nestBit.textContent = `Nest ${nest.dataset.got}/${nestIds.length}`;
          ctx.say(`A ${pat} egg settles in your nest — ${nest.dataset.got} of ${nestIds.length} patterns kept!`);
          if (nest.classList.contains('full')) { ctx.bonus(2, nest, 'A beautiful full nest!'); }
          want = nextWant(); setWant();
        }
      }
      function hatchling(px, py) {
        // A missed egg is not a disaster: the baby hatches and scampers off.
        const b = el('div', 'catch-baby', '🦕'); b.style.left = (px - 16) + 'px'; b.style.top = (py - 34) + 'px'; field.append(b);
        FX.sfx.chirp(); setTimeout(() => b.remove(), 1600);
      }
      function frame(now) {
        if (!ctx.alive() || over) { window.removeEventListener('keydown', key); return; }
        const dt = Math.min(.04, (now - last) / 1000); last = now; time += dt; fw = field.clientWidth; const fh = field.clientHeight;
        const prev = x; x += (target - x) * Math.min(1, dt * 9);
        const moving = Math.abs(x - prev) > .6;
        if (moving) { still = 0; hEl.setAttribute('data-state', 'walk'); hEl.classList.toggle('d-flip', x < prev); } else if (++still > 6) hEl.setAttribute('data-state', hEl.getAttribute('data-base') || 'idle');
        big = Math.max(0, big - dt); magnet = Math.max(0, magnet - dt); soft = Math.max(0, soft - dt); noRocks = Math.max(0, noRocks - dt);
        if (buff && Math.ceil(big) + ':' + Math.ceil(soft) !== buff.dataset.s) { buff.dataset.s = Math.ceil(big) + ':' + Math.ceil(soft); setBuff(); }
        const sc = big > 0 ? 1.55 : 1;
        hero.style.transform = `translateX(${x - 55}px)`;
        basket.style.transform = `translateX(${x - 50}px) scale(${sc})`; basket.style.bottom = (84 + (sc - 1) * 16) + 'px';
        bg.style.setProperty('--px', (-(x - fw / 2) * .06).toFixed(1) + 'px');
        pxFly += dir * dt * (110 + ctx.round * 22); if (pxFly > fw - 90) dir = -1; if (pxFly < 0) dir = 1;
        fly.style.transform = `translateX(${pxFly}px) translateY(${Math.sin(time * 3) * 6}px) scaleX(${dir})`;
        spawnT -= dt;
        if (spawnT <= 0) {
          const sx = pxFly + 44;
          if (Math.random() < .22 && R >= 2) { for (let k = 0; k < 3; k++) setTimeout(() => { if (ctx.alive() && !over) addItem(noRocks <= 0 && Math.random() < .12 ? 'rock' : 'egg', Math.max(30, Math.min(field.clientWidth - 30, pxFly + 44))); }, k * 230); spawnT = 1.5 - R * .1; }
          else { addItem(kindNow(), sx); spawnT = .78 - ctx.round * .07 + Math.random() * .4; }
        }
        const catchTop = fh - 84 - 66 * sc, half = 52 * sc;
        items = items.filter((it) => {
          // The rainbow magnet gently pulls eggs toward the basket.
          if (magnet > 0 && it.kind !== 'rock') it.x += (x - it.x) * Math.min(1, dt * 2.5);
          // A crosswind sways the fall, and a feather-brake slows everything for a few seconds.
          if (wind && it.kind !== 'rock') it.x += Math.sin(time * 1.4 + it.ph) * wind * dt;
          if (wind) it.x = Math.max(18, Math.min(fw - 18, it.x));
          it.y += it.vy * (soft > 0 ? .55 : 1) * dt; it.n.style.transform = `translate(${it.x - 24}px,${it.y}px) rotate(${(it.y * .5 * (it.spin > 0 ? 1 : -1)) % 360 * .12}deg)`;
          if (it.y > catchTop && it.y < catchTop + 46 && Math.abs(it.x - x) < half) {
            it.n.remove();
            const r = basket.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top;
            if (it.kind === 'rock') { combo = 0; if (stN) stN.textContent = '🔥 0'; ctx.bad(.4, { x: cx, y: cy }); FX.dinoState(hEl, 'sad', 700); FX.shakeScreen(3); FX.sfx.thud(); ctx.say('Ouch! A rock! Let the rocks fall!'); FX.burst(cx, cy, { kind: 'dust', n: 7 }); FX.anim(basket, [{ filter: 'brightness(1)' }, { filter: 'brightness(2.4)' }, { filter: 'brightness(1)' }], { duration: 300 }); }
            else if (it.kind === 'feather') {
              // A feather softens the whole sky for a few seconds.
              soft = 5; FX.sfx.boing(); FX.burst(cx, cy, { kind: 'leaves', n: 10 }); FX.floatText(cx, cy - 22, 'Feather! Everything floats!', { size: 24 });
              ctx.bonus(1, { x: cx, y: cy - 20 }, 'Feather!'); FX.dinoState(hEl, 'happy', 800); setBuff();
              ctx.say('A feather! The eggs drift down slowly now — catch them all!');
            }
            else {
              combo++; best = Math.max(best, combo); if (stN) stN.textContent = '🔥 ' + combo;
              const val = it.kind === 'gold' ? 3 : 1;
              got += val; cN.textContent = Math.min(got, goal); bar.style.width = Math.min(100, got / goal * 100) + '%'; FX.sfx.star(); FX.sfx.note(Math.min(11, combo), .12);
              FX.burst(cx, cy, { kind: 'stars', n: it.kind === 'egg' ? 5 : 12, scale: .8 }); FX.pop(cN.parentElement); FX.anim(basket, [{ transform: `translateX(${x - 50}px) scale(${sc * 1.0})` }, { transform: `translateX(${x - 50}px) scale(${sc * 1.12}, ${sc * .9})` }, { transform: `translateX(${x - 50}px) scale(${sc})` }], { duration: 200 });
              if (it.kind === 'gold') { FX.floatText(cx, cy - 20, 'Golden egg! +3', { size: 26 }); FX.sfx.win(); }
              if (it.kind === 'rainbow') { big = 7; magnet = 7; FX.floatText(cx, cy - 20, 'Giant basket + magnet!', { size: 24 }); FX.sfx.roar(); FX.burst(cx, cy, { kind: 'confetti', n: 24 }); ctx.say('Rainbow egg! A giant basket and a magnet for 7 seconds!'); FX.dinoState(hEl, 'happy', 900); }
              else if (combo > 2 && combo % 3 === 0) FX.floatText(cx, cy - 36, combo + ' in a row!', { size: 24 });
              toNest(it.pat);
              while (Math.floor(got / 6) > rewarded) { rewarded++; ctx.bonus(1, { x: cx, y: cy - 30 }, '6 eggs!'); ctx.life.visit(); }
              if (got >= goal && !over) {
                over = true; FX.celebrate(); ctx.flutter(5); FX.dinoState(hEl, 'happy'); hEl.setAttribute('data-base', 'happy');
                if (!misses) ctx.bonus(1, basket, 'Never dropped one!');
                if (rec.hi('catch', best)) { ctx.bonus(2, basket, `Longest streak ever: ${best}!`); }
                ctx.done(`Basket full with ${got} eggs — best streak ${best}!`, 2000);
              }
            }
            return false;
          }
          if (it.y > fh - 44) {
            it.n.remove();
            if (it.kind !== 'rock' && it.kind !== 'feather') {
              combo = 0; if (stN) stN.textContent = '🔥 0'; misses++;
              const r = field.getBoundingClientRect(); FX.burst(r.left + it.x, r.bottom - 30, { kind: 'dust', n: 3, scale: .6 }); if (it.kind === 'egg' && Math.random() < .5) hatchling(it.x, fh - 30);
              // After three drops the rocks take a nap, so the child can get back in the groove.
              if (misses === 3 && noRocks <= 0) { noRocks = 5; FX.sfx.sparkle(); ctx.say('The rocks are having a nap — just gentle eggs for a while!'); }
            }
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
