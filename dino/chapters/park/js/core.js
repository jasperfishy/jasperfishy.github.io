/* Dino Park — core framework.
 * Games are small "round" machines: each game says how many rounds it has and how to play one round;
 * the framework runs the rounds, counts mistakes, awards 1–3 stars, grows the egg meter, hatches new
 * dinosaurs into the Dino Den and keeps everything in localStorage. */
(function () {
  'use strict';
  const FX = window.DUFX;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SPECIES = FX.dinoSpecies, COLORS = FX.dinoColors;
  const NAMES = ['Bubbles', 'Pip', 'Rexy', 'Nibbles', 'Zig', 'Zag', 'Mochi', 'Tango', 'Fern', 'Biscuit', 'Sprout', 'Pebble', 'Waffles', 'Comet', 'Dot', 'Peanut', 'Sunny', 'Mango', 'Ziggy', 'Clover'];

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* playable without saving */ } },
  };
  const stars = { get: (id) => Math.min(3, Number(store.get('dino_' + id, 0)) || 0), set(id, v) { if (v > this.get(id)) store.set('dino_' + id, v); } };
  const den = {
    all: () => (store.get('dino_den', []) || []).filter((d) => d && SPECIES.includes(d.s)),
    add(d) { const a = this.all(); a.push(d); store.set('dino_den', a.slice(-24)); return d; },
  };
  const egg = { get: () => Math.max(0, Math.min(2, Number(store.get('dino_egg', 0)) || 0)), set: (n) => store.set('dino_egg', n) };
  // The museum keeps every dinosaur the child has built, with the stars it earned. Hyphenated key: invisible to the hub's star count.
  const museum = { all: () => (store.get('dino_x-museum', []) || []).filter((d) => d && SPECIES.includes(d.s)), add(d) { const a = this.all(); a.push(d); store.set('dino_x-museum', a.slice(-30)); return d; } };
  const EGG_WINS = 3, JAR = 40;
  // Sparkles are bonus stars won inside games. The key has a hyphen so the hub's /^dino_[a-z]+$/ star count ignores it.
  const sparkles = { get: () => Math.max(0, Number(store.get('dino_x-sparkles', 0)) || 0), add(n) { store.set('dino_x-sparkles', this.get() + n); } };
  const jar = { get: () => Math.max(0, Math.min(JAR - 1, Number(store.get('dino_x-jar', 0)) || 0)), set: (n) => store.set('dino_x-jar', n) };

  /* ---------- dragging (pointer based: mouse, touch and pen) ---------- */
  function drag(node, o) {
    node.style.touchAction = 'none';
    node.classList.add('draggable');
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button > 0) return;
      if (node.classList.contains('locked')) return;
      const sx = e.clientX, sy = e.clientY;
      let moved = false, started = false;
      node.setPointerCapture(e.pointerId);
      const base = node.style.transform;
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved && Math.hypot(dx, dy) < 7) return;
        if (!started) { started = true; node.classList.add('dragging'); o.start && o.start(node, ev); FX.sfx.tap(); }
        moved = true;
        node.style.transform = `translate(${dx}px,${dy}px) scale(1.12) rotate(${Math.max(-12, Math.min(12, dx * .06))}deg)`;
        o.over && o.over(ev.clientX, ev.clientY, node);
      };
      const up = (ev) => {
        node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up);
        try { node.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
        node.classList.remove('dragging');
        if (!moved) { o.tap && o.tap(node, ev); return; }
        o.over && o.over(-9999, -9999, node);
        const ok = o.drop ? o.drop(ev.clientX, ev.clientY, node) : false;
        if (ok) { node.style.transform = base; return; }
        // Spring back to where it came from.
        const a = FX.anim(node, [{ transform: node.style.transform }, { transform: base || 'translate(0,0)' }], { duration: 420, easing: 'cubic-bezier(.3,1.7,.5,1)' });
        node.style.transform = base;
        if (!a) return;
      };
      node.addEventListener('pointermove', move); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
    });
  }
  /* Which element of `list` is under the pointer? */
  function hit(list, x, y, pad) {
    pad = pad || 0;
    for (const t of list) { const r = t.getBoundingClientRect(); if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return t; }
    return null;
  }

  /* ---------- the game runner ---------- */
  const Park = window.Park = { games: [], $, $$, rnd, pick, shuffle, sleep, el, drag, hit, store, stars, den, egg, museum, sparkles, jar, JAR, NAMES, SPECIES, COLORS, FX };
  Park.register = (g) => Park.games.push(g);
  /* flyTo that can never wedge a game: if the animation is paused (a background tab) it gives up after its duration. */
  Park.fly = (a, b, o) => Promise.race([FX.flyTo(a, b, o), sleep(((o && o.duration) || 650) + 500)]);

  let run = null;
  const area = () => $('#gameArea');

  /* ---------- life: friends who wander in, flowers that pop up, butterflies ---------- */
  const life = {
    friends: [], flowers: 0,
    path: () => $('#parkPath'),
    reset() {
      const p = this.path(); if (!p) return;
      p.innerHTML = '<i class="pp-sun">☀️</i><i class="pp-cloud">☁️</i><i class="pp-hint">Your friends gather here</i>';
      this.friends = []; this.flowers = 0;
    },
    /* A small dinosaur trots in to cheer the child on. */
    visit() {
      const p = this.path(); if (!p) return;
      if (this.friends.length >= 7) return this.cheer(this.friends[rnd(this.friends.length)]);
      const hint = $('.pp-hint', p); if (hint) hint.remove();
      const n = this.friends.length, sp = pick(SPECIES.filter((s) => s !== 'ptero' || n > 2));
      const f = el('div', 'pp-dino'); f.style.setProperty('--t', (16 + rnd(10)) + 's'); f.style.setProperty('--o', (-rnd(14)) + 's'); f.style.setProperty('--w', (40 + rnd(18)) + 'px'); f.style.setProperty('--x', (4 + rnd(80)) + '%');
      f.innerHTML = `<span class="pp-body">${FX.dinoHTML(sp, { color: pick(COLORS), state: 'walk' })}</span>`;
      f.addEventListener('pointerdown', () => { this.cheer(f); FX.sfx.chirp(); });
      p.append(f); this.friends.push(f);
      FX.pop(f.firstElementChild); FX.sfx.chirp();
    },
    cheer(f) {
      if (!f) return;
      const d = $('.du-dino', f); FX.dinoState(d, 'happy', 1100);
      const r = f.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + 6, { kind: 'hearts', n: 3, scale: .8 });
    },
    cheerAll() { this.friends.forEach((f, i) => setTimeout(() => this.cheer(f), i * 90)); },
    flower() {
      const p = this.path(); if (!p || this.flowers >= 16) return;
      this.flowers++;
      const f = el('i', 'pp-flower', pick(['🌼', '🌸', '🌷', '🌻', '🍄', '🌺']));
      f.style.left = (4 + rnd(90)) + '%'; f.style.fontSize = (14 + rnd(10)) + 'px';
      p.append(f); FX.pop(f);
    },
    /* Butterflies flutter across the whole screen. */
    flutter(n) {
      if (!FX.motionOK() || !document.body.animate) return;
      for (let i = 0; i < n; i++) {
        const b = el('div', 'butterfly', pick(['🦋', '🦋', '🐝', '🐞']));
        b.setAttribute('aria-hidden', 'true');
        const w = innerWidth, h = innerHeight, y0 = h * (.2 + Math.random() * .5), dir = Math.random() < .5 ? 1 : -1;
        const x0 = dir > 0 ? -50 : w + 50, x1 = dir > 0 ? w + 50 : -50, frames = [];
        for (let k = 0; k <= 10; k++) { const t = k / 10; frames.push({ transform: `translate(${x0 + (x1 - x0) * t}px,${y0 + Math.sin(t * 9 + i) * 60 - t * 40}px) rotate(${Math.sin(t * 14) * 18}deg) scaleX(${dir})`, opacity: t < .06 || t > .94 ? 0 : 1 }); }
        document.body.append(b);
        const a = b.animate(frames, { duration: 4200 + rnd(2400), delay: i * 260, easing: 'linear', fill: 'both' });
        a.onfinish = () => b.remove();
      }
    },
  };

  function pips() {
    const box = $('#pips'); if (!box || !run) return;
    box.innerHTML = '';
    for (let i = 1; i <= run.game.rounds; i++) box.append(el('i', 'pip' + (i < run.round ? ' done' : i === run.round ? ' now' : '')));
  }
  function say(text, state) {
    const s = $('#say'); if (!s) return;
    s.textContent = text; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop');
    if (run && run.helper && state) FX.dinoState(run.helper, state, 1100);
    if (run && run.speak && 'speechSynthesis' in window && run.speakOn) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = .9; speechSynthesis.speak(u); } catch (e) { /* no speech */ } }
  }
  const where = (at) => {
    if (!at) { const r = area().getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .3 }; }
    if (at.getBoundingClientRect) { const r = at.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    return at;
  };
  function banner(text, sub) {
    const g = $('#game'), b = el('div', 'round-banner', `<b>${text}</b>${sub ? `<span>${sub}</span>` : ''}`);
    g.append(b); FX.sfx.whoosh();
    const a = FX.anim(b, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.4) rotate(-6deg)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.08)', offset: .25 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .7 }, { opacity: 0, transform: 'translate(-50%,-80%) scale(.9)' }], { duration: 1250, easing: 'ease-out' });
    if (a) a.onfinish = () => b.remove(); else setTimeout(() => b.remove(), 900);
  }

  function start(id) {
    const game = Park.games.find((g) => g.id === id);
    if (!game) return;
    clearInterval(start._idle);
    run = { game, round: 0, mistakes: 0, token: 0, startedAt: Date.now(), bonus: 0, streak: 0, best: 0, roundMistakes: 0, idle: 0, hintFn: null };
    $('#menu').classList.add('hidden');
    $('#game').classList.remove('hidden');
    $('#gameTitle').textContent = game.name;
    $('#game').dataset.game = id;
    $('#game').style.setProperty('--gc', game.color || '#4a8f3c');
    const h = $('#helper');
    h.innerHTML = FX.dinoHTML(game.helper || 'trex', { color: game.helperColor, state: 'idle' });
    run.helper = h.firstElementChild;
    h.onclick = () => { FX.dinoState(run.helper, 'roar', 900); FX.sfx.roar(); if (run.hintFn) run.hintFn(); };
    hideWin(); life.reset();
    FX.ambient(game.ambient || 'meadow');
    // After a quiet moment the helper gently points the way.
    start._idle = setInterval(() => {
      if (!run || $('#game').classList.contains('hidden') || !$('#winOverlay').classList.contains('hidden')) return;
      if (++run.idle >= 10 && run.hintFn) { run.idle = 4; try { run.hintFn(); } catch (e) { /* hint is optional */ } }
    }, 1000);
    nextRound();
  }

  async function nextRound() {
    if (!run) return;
    run.round++; run.token++; run.roundMistakes = 0; run.idle = 0; run.hintFn = null;
    const a = area();
    a.innerHTML = '';
    a.className = 'game-area';
    pips();
    const mine = run.token;
    const ctx = {
      area: a, round: run.round, rounds: run.game.rounds, level: run.round,
      alive: () => run && run.token === mine,
      say, helper: run.helper, life,
      /* A wrong move: a gentle sound, a sad little face and, after a second slip, a hint. */
      bad(n, at) {
        run.mistakes += n || 1; run.roundMistakes += n || 1; run.streak = 0; run.idle = 0;
        FX.sfx.bad(); FX.dinoState(run.helper, 'sad', 900);
        const p = where(at || run.helper); FX.floatText(p.x, p.y - 10, pick(['Try again!', 'Nearly!', 'You can do it!', 'Have another go!']), { size: 20, color: '#ffffff' });
        if (run.roundMistakes >= 2 && run.hintFn && !ctx._hinted) { ctx._hinted = true; setTimeout(() => { if (ctx.alive() && run.hintFn) { say('Here is a little help!'); run.hintFn(); } }, 500); }
      },
      /* A right move: counts a streak, grows a bonus, invites a friend and plants a flower. */
      good(at) {
        FX.sfx.good(); FX.dinoState(run.helper, 'happy', 900); run.idle = 0; ctx._hinted = false;
        run.streak++; run.best = Math.max(run.best, run.streak);
        life.flower(); if (run.streak === 1 || run.streak % 2 === 0) life.visit(); else life.cheerAll();
        const s = run.streak;
        if (s === 3 || s === 5 || s === 8 || (s > 8 && s % 4 === 0)) {
          const p = where(at); ctx.bonus(s === 8 ? 3 : s === 5 ? 2 : 1, p, `${s} in a row!`);
          life.flutter(Math.min(5, s - 1)); FX.sfx.note(Math.min(11, s));
        }
      },
      bonus(n, at, label) {
        run.bonus += n; const p = where(at);
        FX.floatText(p.x, p.y - 24, label ? `${label} +${n}⭐` : `+${n}⭐`, { size: 24 });
        FX.burst(p.x, p.y, { kind: 'stars', n: 6 + n * 3, scale: .8 }); FX.sfx.star();
        const j = $('#sparkChip'); if (j) { j.textContent = `⭐ ${run.bonus}`; FX.pop(j); }
      },
      hint(fn) { run.hintFn = fn; },
      flutter: (n) => life.flutter(n),
      done(msg, delay) { if (run && run.token === mine && !ctx._d) { ctx._d = true; roundDone(msg, delay); } },
    };
    a.animate && FX.motionOK() && a.animate([{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
    if (run.game.rounds > 1) banner(run.round === run.game.rounds ? 'Last round!' : `Round ${run.round}`, run.round === 1 ? run.game.name : '');
    const sc = $('#sparkChip'); if (sc) sc.textContent = `⭐ ${run.bonus}`;
    try { await run.game.round(ctx); } catch (e) { console.error('round failed', e); }
  }

  async function roundDone(msg, delay) {
    if (!run) return;
    const last = run.round >= run.game.rounds;
    say(msg || 'Brilliant!', 'happy');
    FX.dinoState(run.helper, 'happy', 1400);
    const r = area().getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height * .35, { kind: 'stars', n: last ? 18 : 10 });
    FX.sfx.star(); life.cheerAll(); life.flutter(last ? 6 : 3);
    run.hintFn = null;
    // A clean round (no slips) earns a bonus star of its own.
    if (run.roundMistakes === 0) setTimeout(() => { if (!run) return; run.bonus += 1; FX.floatText(r.left + r.width / 2, r.top + r.height * .5, 'Perfect round! +1⭐', { size: 26 }); const j = $('#sparkChip'); if (j) j.textContent = `⭐ ${run.bonus}`; }, 300);
    pips();
    await sleep(delay || (last ? 1200 : 1500));
    if (!run) return;
    if (last) finish(); else nextRound();
  }

  function rating() {
    const per = run.mistakes / run.game.rounds;
    return per <= .35 ? 3 : per <= 1.4 ? 2 : 1;
  }

  function finish() {
    const g = run.game, got = rating();
    stars.set(g.id, got);
    const bonus = run.bonus, jarBefore = jar.get();
    let jarNow = jarBefore + bonus, jarFull = false;
    if (jarNow >= JAR) { jarNow -= JAR; jarFull = true; }
    jar.set(jarNow); sparkles.add(bonus);
    let e = egg.get() + 1 + (jarFull ? 1 : 0), hatched = null;
    if (e >= EGG_WINS) { e -= EGG_WINS; hatched = { s: pick(SPECIES.filter((x) => x !== 'ptero' || Math.random() < .5)), c: pick(COLORS), n: pick(NAMES) }; den.add(hatched); }
    egg.set(e);
    clearInterval(start._idle);
    showWin(g, got, e, hatched, { bonus, best: run.best, jarBefore, jarNow, jarFull });
  }

  async function showWin(g, got, eggNow, hatched, info) {
    const ov = $('#winOverlay'), card = $('.win-card', ov);
    ov.classList.remove('hidden');
    $('#winText').textContent = got === 3 ? 'Perfect! Roar-some!' : got === 2 ? 'Great job!' : 'Well done!';
    const row = $('#winStars'); row.innerHTML = '';
    for (let i = 1; i <= 3; i++) row.append(el('span', 'wstar' + (i <= got ? ' on' : ''), '★'));
    $('#winDino').innerHTML = FX.dinoHTML(pick(SPECIES.filter((x) => x !== 'ptero')), { state: 'happy' });
    $('#winStats').innerHTML = `<span>⭐ <b>${info.bonus}</b> sparkles</span>${info.best > 1 ? `<span>🔥 best streak <b>${info.best}</b></span>` : ''}`;
    const jf = $('#jarFill'); jf.classList.remove('full'); jf.style.width = (info.jarBefore / JAR * 100) + '%'; $('#jarTxt').textContent = `Sparkle jar ${info.jarBefore}/${JAR}`;
    const m = $('#eggMeter'); m.innerHTML = '';
    for (let i = 0; i < EGG_WINS; i++) m.append(el('span', 'egg-dot' + (i < (hatched ? EGG_WINS : eggNow) ? ' on' : ''), '🥚'));
    $('#winNext').textContent = hatched ? '' : eggNow === 0 ? '' : `${EGG_WINS - eggNow} more win${EGG_WINS - eggNow === 1 ? '' : 's'} until your egg hatches!`;
    card.animate && FX.motionOK() && card.animate([{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
    FX.celebrate();
    const stEls = $$('.wstar.on', row);
    for (let i = 0; i < stEls.length; i++) { await sleep(380); stEls[i].classList.add('pop'); FX.sfx.star(); const r = stEls[i].getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'stars', n: 6, scale: .8 }); }
    // The jar fills up with this game's sparkles; a full jar warms an extra egg.
    await sleep(300);
    jf.style.width = (info.jarFull ? 100 : info.jarNow / JAR * 100) + '%';
    $('#jarTxt').textContent = info.jarFull ? 'Jar full! Your egg glows warm!' : `Sparkle jar ${info.jarNow}/${JAR}`;
    if (info.bonus) FX.sfx.sparkle();
    if (info.jarFull) { jf.classList.add('full'); FX.sfx.win(); const r = jf.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top, { kind: 'stars', n: 16 }); }
    if (hatched) { await sleep(600); await hatchShow(hatched); }
  }

  /* An egg wobbles, cracks and a new friend hops out. */
  async function hatchShow(d) {
    const box = $('#hatch'); box.classList.remove('hidden');
    box.innerHTML = `<div class="hatch-card"><div class="hatch-egg">🥚</div><p id="hatchSay">Something is moving…</p></div>`;
    const egg = $('.hatch-egg', box);
    egg.classList.add('wobble'); FX.sfx.drum(0);
    await sleep(900); FX.sfx.drum(1); await sleep(700); FX.sfx.drum(2);
    egg.classList.remove('wobble'); egg.classList.add('crack');
    await sleep(500);
    const r = egg.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'confetti', n: 36, power: 1.1 });
    FX.sfx.win();
    $('.hatch-card', box).innerHTML = `<div class="hatch-dino">${FX.dinoHTML(d.s, { color: d.c, state: 'happy' })}</div><p><b>${d.n}</b> the baby ${d.s === 'trex' ? 'T-rex' : d.s === 'tricera' ? 'Triceratops' : d.s === 'stego' ? 'Stegosaurus' : d.s === 'bronto' ? 'Brontosaurus' : d.s === 'raptor' ? 'Raptor' : 'Pterosaur'} hatched!</p><p class="hatch-sub">Your new friend lives in the Dino Den.</p><button class="btn" id="hatchOk">Hooray!</button>`;
    FX.sfx.chirp();
    await new Promise((res) => { $('#hatchOk').onclick = () => { box.classList.add('hidden'); res(); }; });
  }

  function hideWin() { const o = $('#winOverlay'); if (o) o.classList.add('hidden'); const h = $('#hatch'); if (h) h.classList.add('hidden'); }

  function toMenu() {
    clearInterval(start._idle); run = null; hideWin();
    document.querySelectorAll('.butterfly').forEach((b) => b.remove());
    try { speechSynthesis.cancel(); } catch (e) { /* no speech */ }
    $('#game').classList.add('hidden');
    $('#menu').classList.remove('hidden');
    FX.ambient('meadow');
    if (Park.renderMenu) Park.renderMenu();
  }
  Park.start = start; Park.toMenu = toMenu; Park.say = say; Park.hideWin = hideWin;
  Park.again = () => { if (run) start(run.game.id); };
  Park.nextGame = () => {
    const i = run ? Park.games.findIndex((g) => g.id === run.game.id) : -1;
    const g = Park.games[(i + 1) % Park.games.length];
    start(g.id);
  };
  Park.current = () => run;
})();
