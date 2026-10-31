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
  const EGG_WINS = 3;

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
  const Park = window.Park = { games: [], $, $$, rnd, pick, shuffle, sleep, el, drag, hit, store, stars, den, egg, NAMES, SPECIES, COLORS, FX };
  Park.register = (g) => Park.games.push(g);

  let run = null;
  const area = () => $('#gameArea');

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

  function start(id) {
    const game = Park.games.find((g) => g.id === id);
    if (!game) return;
    run = { game, round: 0, mistakes: 0, token: 0, startedAt: Date.now() };
    $('#menu').classList.add('hidden');
    $('#game').classList.remove('hidden');
    $('#gameTitle').textContent = game.name;
    $('#game').dataset.game = id;
    $('#game').style.setProperty('--gc', game.color || '#4a8f3c');
    const h = $('#helper');
    h.innerHTML = FX.dinoHTML(game.helper || 'trex', { color: game.helperColor, state: 'idle' });
    run.helper = h.firstElementChild;
    hideWin();
    FX.ambient(game.ambient || 'meadow');
    nextRound();
  }

  async function nextRound() {
    if (!run) return;
    run.round++; run.token++;
    const a = area();
    a.innerHTML = '';
    a.className = 'game-area';
    pips();
    const mine = run.token;
    const ctx = {
      area: a, round: run.round, rounds: run.game.rounds, level: run.round,
      alive: () => run && run.token === mine,
      say, helper: run.helper,
      bad(n) { run.mistakes += n || 1; FX.sfx.bad(); FX.dinoState(run.helper, 'sad', 900); },
      good() { FX.sfx.good(); FX.dinoState(run.helper, 'happy', 900); },
      done(msg, delay) { if (run && run.token === mine && !ctx._d) { ctx._d = true; roundDone(msg, delay); } },
    };
    a.animate && FX.motionOK() && a.animate([{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
    try { await run.game.round(ctx); } catch (e) { console.error('round failed', e); }
  }

  async function roundDone(msg, delay) {
    if (!run) return;
    const last = run.round >= run.game.rounds;
    say(msg || 'Brilliant!', 'happy');
    FX.dinoState(run.helper, 'happy', 1400);
    const r = area().getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height * .35, { kind: 'stars', n: last ? 18 : 10 });
    FX.sfx.star();
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
    let e = egg.get() + 1, hatched = null;
    if (e >= EGG_WINS) { e = 0; hatched = { s: pick(SPECIES.filter((x) => x !== 'ptero' || Math.random() < .5)), c: pick(COLORS), n: pick(NAMES) }; den.add(hatched); }
    egg.set(e);
    showWin(g, got, e, hatched);
  }

  async function showWin(g, got, eggNow, hatched) {
    const ov = $('#winOverlay'), card = $('.win-card', ov);
    ov.classList.remove('hidden');
    $('#winText').textContent = got === 3 ? 'Perfect! Roar-some!' : got === 2 ? 'Great job!' : 'Well done!';
    const row = $('#winStars'); row.innerHTML = '';
    for (let i = 1; i <= 3; i++) row.append(el('span', 'wstar' + (i <= got ? ' on' : ''), '★'));
    $('#winDino').innerHTML = FX.dinoHTML(pick(SPECIES.filter((x) => x !== 'ptero')), { state: 'happy' });
    const m = $('#eggMeter'); m.innerHTML = '';
    for (let i = 0; i < EGG_WINS; i++) m.append(el('span', 'egg-dot' + (i < (hatched ? EGG_WINS : eggNow) ? ' on' : ''), '🥚'));
    $('#winNext').textContent = hatched ? '' : eggNow === 0 ? '' : `${EGG_WINS - eggNow} more win${EGG_WINS - eggNow === 1 ? '' : 's'} until your egg hatches!`;
    card.animate && FX.motionOK() && card.animate([{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
    FX.celebrate();
    const stEls = $$('.wstar.on', row);
    for (let i = 0; i < stEls.length; i++) { await sleep(380); stEls[i].classList.add('pop'); FX.sfx.star(); const r = stEls[i].getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'stars', n: 6, scale: .8 }); }
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
    run = null; hideWin();
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
