/* DUWONDER — the layer that keeps something happening while a child plays.
 *
 *   window.DUWONDER.start({ world: 'park' })   begin (idempotent)
 *   window.DUWONDER.ping()                     a world did something great: send a visitor now
 *   window.DUWONDER.mote(n)                    put n star motes on screen
 *   window.DUWONDER.visit(id)                  force one visitor by id (used by tests and worlds)
 *   window.DUWONDER.stop()                     tear everything down
 *
 * Everything here is additive: a child who ignores every mote and never catches
 * a visitor loses nothing, and a child who chases them earns gems for the
 * Journey map. The overlay is pointer-events:none except for the small
 * collectibles, so it can sit over a Phaser canvas without stealing its taps.
 */
(function () {
  if (window.DUWONDER && window.DUWONDER.start) return;

  const FX = () => window.DUFX;
  const J = () => window.DUJourney;
  const S = () => window.DUSTORY;
  const reduce = () => !!(FX() && FX().settings.reduce);
  const calm = () => !!(FX() && FX().settings.calm);
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const chance = (p) => Math.random() < p;

  /* ------------------------------------------------------------------ content
   * Each visitor is a discovery: the first time a child catches one it is written
   * into the Journey codex (DUJourney.find) and pays a gem. `when` keeps them in
   * character with the world and the time of day.
   */
  const VISITORS = [
    {
      id: 'pip-mail', body: 'ptero', colour: 'pink', size: 'small', flight: true,
      when: () => true,
      lines: [
        'Pip! I brought a letter from the Meadow! It says they miss you.',
        'Catch! I dropped a feather — keep it, they are lucky.',
        'I flew over every world today. You have been busy, NAME!',
      ],
    },
    {
      id: 'firefly-queen', emoji: '🧚', flight: true, glow: '#ffe98a',
      when: () => tod() === 'night' || tod() === 'dusk',
      lines: [
        'The fireflies only come out for children who are still playing.',
        'One wish, caught just in time. Blow it out when you are ready.',
        'I keep a lantern lit on the hill for you.',
      ],
    },
    {
      id: 'shooting-star', emoji: '💫', flight: true, fast: true, glow: '#fff6c8',
      when: () => tod() === 'night',
      lines: ['A star! Quick — make a wish!', 'That one was saved just for you.', 'Wish made. It is in the ledger now.'],
    },
    {
      id: 'baby-bronto', body: 'bronto', colour: 'orange',
      when: () => true,
      lines: ['I am only a little one, but I can reach the low branches.', 'Mum says I am too tall for my age. Hello!', 'Do you want to see my wobbly walk?'],
    },
    {
      id: 'wise-owl', body: 'ptero', colour: 'yellow', size: 'small', flight: true,
      when: () => true,
      riddle: true,
      lines: [
        'Riddle: I have a shell but I am not a snail, and I hatch into something enormous. What am I?',
        'Riddle: What has teeth but cannot bite, and keeps your place in a book?',
        'Riddle: The more of me you take, the more you leave behind. What am I?',
      ],
      answers: ['An egg!', 'A zip! (Well done — a comb works too!)', 'Footprints!'],
    },
    {
      id: 'gem-turtle', emoji: '🐢', glow: '#8fe3c0',
      when: () => tod() !== 'night',
      lines: ['I found this under a rock. It is yours now.', 'Slow is fine. I always get there.', 'Careful — my shell is heavy!'],
    },
    {
      id: 'butterfly-swarm', emoji: '🦋', flight: true, glow: '#c7a6ff',
      when: () => world() === 'meadow' || world() === 'park',
      lines: ['They followed the smell of the flower patch!', 'One landed on your hand. Did you see?', 'I am taking them to the Starlight Garden.'],
    },
    {
      id: 'grumble-sniff', body: 'trex', colour: 'blue',
      when: () => true,
      lines: ['*sniff sniff* … sorry. I am loud because I am lonely.', 'Did you know a grumble is just a roar that lost its way?', 'I brought you a pebble. It is a very good pebble.'],
    },
    {
      id: 'star-seed', emoji: '🌟', glow: '#ffe14d',
      when: () => true,
      lines: ['Plant this and something wonderful happens by Thursday.', 'Star seeds only grow where someone has laughed.', 'The Garden needs one more. This is it.'],
    },
    {
      id: 'shell-friend', emoji: '🐚',
      when: () => world() === 'drive' || world() === 'egg-dash',
      lines: ['Hold me to your ear. That is the sea, honestly.', 'I rolled all the way from the beach. Tiring!', 'You can keep me. I have nowhere better to be.'],
    },
    {
      id: 'rain-cloud', emoji: '🌈', flight: true, glow: '#9be7ff',
      when: () => tod() === 'day' && chance(0.5),
      lines: ['I brought the rain so the rainbow could come.', 'Sunshine and showers at the same time — perfect, isn’t it?'],
    },
    {
      id: 'midnight-train', emoji: '🚂', glow: '#ffd6a5',
      when: () => true,
      lines: ['All aboard! Next stop: anywhere you like.', 'I only run for children who are still awake playing.'],
    },
    {
      id: 'snow-egg', emoji: '🥚', glow: '#eaf6ff',
      when: () => world() === 'egg-dash' || tod() === 'night',
      lines: ['A frozen egg! If you warm it, something hatches.', 'Do not sit on it. Actually, do. It is soft.', 'This one has been waiting a very long time for you.'],
    },
    {
      id: 'footprints', emoji: '🐾',
      when: () => true,
      lines: ['Someone very large walked this way. Shall we follow?', 'These prints are fresh. And they are heading your way.'],
    },
  ];

  const MILESTONES = [
    { key: 'spark', stars: 3, crest: '✨', title: 'First Spark!', line: 'Three stars in your Journey. The Garden is starting to glow.' },
    { key: 'collector', stars: 8, crest: '🌟', title: 'Star Collector!', line: 'Eight stars! Pip has written your name down properly now.' },
    { key: 'guardian', stars: 15, crest: '🌷', title: 'Garden Guardian!', line: 'Fifteen stars — the flowers are opening all by themselves.' },
    { key: 'hero', stars: 24, crest: '👑', title: 'Starlight Hero!', line: 'Twenty-four stars. Something wonderful is waiting at the end of the road.' },
    { key: 'pouch', gems: 5, crest: '💎', title: 'A Pouch of Gems!', line: 'Five treasures. Wise Owl is impressed, and he is very hard to impress.' },
    { key: 'golden', gems: 12, crest: '🥚', title: 'The Golden Egg!', line: 'Twelve treasures! This egg has been asleep since the stars came down.' },
    { key: 'codex', finds: 8, crest: '📖', title: 'Eight New Friends!', line: 'Your codex is filling up. They all asked about you.' },
  ];

  /* ------------------------------------------------------------------ plumbing */
  let layer = null, timers = [], motes = 0, alive = false, cfg = { world: null }, offJourney = null;

  const world = () => cfg.world;
  function tod() {
    const b = document.body && document.body.dataset ? document.body.dataset.tod : null;
    if (b) return b;
    const h = new Date().getHours();
    return h >= 7 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'dusk' : h >= 19 || h < 5 ? 'night' : 'dawn';
  }
  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function say(text) {
    let name = '';
    try { name = (localStorage.getItem('du-name') || '').trim(); } catch (e) { }
    return String(text).replace(/\bNAME\b/g, name || 'friend');
  }
  function mount() {
    if (layer) return layer;
    layer = document.createElement('div');
    layer.className = 'duw-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    return layer;
  }
  function later(fn, ms) {
    const t = setTimeout(() => { if (!alive) return; if (document.hidden) { later(fn, ms); return; } fn(); }, ms);
    timers.push(t);
    return t;
  }
  // Something is already asking for the child's whole attention: a cutscene, a
  // ceremony of our own, or the win card of the game they just finished. Wonder
  // waits its turn rather than piling a second modal on top of the first.
  const busy = () => (S() && S().open()) || document.querySelector('.duw-big') || document.querySelector('.celebration-card');

  /* ------------------------------------------------------------------- motes */
  function moteSpot() {
    const W = innerWidth, H = innerHeight;
    const left = chance(0.5);
    return {
      x: left ? W * (0.04 + Math.random() * 0.11) : W * (0.84 + Math.random() * 0.11),
      y: H * (0.2 + Math.random() * 0.6),
    };
  }
  function addMote(kind) {
    if (!alive || busy()) return;
    const b = document.createElement('button');
    b.className = 'duw-mote';
    b.dataset.kind = kind || 'star';
    const p = moteSpot();
    b.style.left = Math.round(p.x) + 'px';
    b.style.top = Math.round(p.y) + 'px';
    b.setAttribute('aria-label', 'A star mote to collect');
    if (reduce()) b.style.animation = 'none';
    layer.appendChild(b);
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      collectMote(b);
    });
    // A mote that is never clicked drifts away after a while, so the screen
    // does not fill up with buttons a child has stopped noticing.
    later(() => { if (b.isConnected) fadeOut(b); }, 26000);
    return b;
  }
  function fadeOut(el) {
    if (!el || !el.isConnected) return;
    el.style.transition = 'opacity .8s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 900);
  }
  function collectMote(b) {
    motes++;
    const r = b.getBoundingClientRect();
    b.classList.add('go');
    setTimeout(() => b.remove(), 520);
    FX() && FX().sfx.star();
    FX() && FX().burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', n: calm() ? 5 : 12 });
    if (motes % 3 === 0) {
      FX() && FX().floatText(r.left + r.width / 2, r.top - 12, '+1 💎', { color: '#8fe3c0' });
      const pouch = J() ? J().addGems(1) : 0;
      if (J()) card(r.left + r.width / 2, r.top - 60, { who: 'Wonder', text: 'Three motes — one gem! That is ' + pouch + ' in your pouch.' });
    } else if (motes % 3 === 1) {
      FX() && FX().floatText(r.left + r.width / 2, r.top - 12, '✨', { color: '#ffe14d' });
    }
    later(() => addMote(pick(['star', 'petal', 'leaf', 'shell', 'gem'])), 5000 + rnd(9000));
  }

  /* --------------------------------------------------------------- speech card */
  function card(x, y, o) {
    if (!alive) return;
    const host = mount();
    const el = document.createElement('div');
    el.className = 'duw-card';
    el.innerHTML = '<b>' + esc(o.who || 'Friend') + '</b>' + esc(say(o.text));
    host.appendChild(el);
    const w = Math.min(360, innerWidth * 0.78);
    el.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)) + 'px';
    el.style.top = Math.max(8, Math.min(innerHeight - 120, y)) + 'px';
    setTimeout(() => fadeOut(el), (o.ms || 5200));
    return el;
  }

  /* ---------------------------------------------------------------- visitors */
  function visitorArt(v) {
    if (v.body && FX() && FX().dinoHTML) {
      return '<span class="duv-body">' + FX().dinoHTML(v.body, { state: v.flight ? 'happy' : 'walk', color: v.colour, size: '120px' }) + '</span>';
    }
    return '<span class="duv-emoji">' + (v.emoji || '✨') + '</span>';
  }
  function sendVisitor(forced) {
    if (!alive || busy()) return null;
    const pool = VISITORS.filter((v) => { try { return v.when(); } catch (e) { return false; } });
    const seen = (v) => J() && J().found('wonder:' + v.id);
    // Prefer something the codex has not recorded yet; fall back to anything in
    // season once every visitor in this world has been met.
    const fresh = pool.filter((v) => !seen(v));
    const v = forced || pick(fresh.length ? fresh : pool);
    if (!v) return null;

    const host = mount();
    const b = document.createElement('button');
    b.className = 'duw-visitor' + (v.size === 'small' ? ' small' : '');
    b.innerHTML = visitorArt(v);
    b.style.setProperty('--glow', v.glow || '#ffe14d');
    b.setAttribute('aria-label', 'A visiting friend — tap to say hello');
    const fromLeft = chance(0.5);
    const y = v.flight ? innerHeight * (0.12 + Math.random() * 0.3) : innerHeight * (0.55 + Math.random() * 0.22);
    b.style.top = Math.round(y) + 'px';
    b.style.left = fromLeft ? '-160px' : (innerWidth + 40) + 'px';
    if (v.emoji) b.style.fontSize = '44px';
    host.appendChild(b);

    const travel = innerWidth + 220;
    const dur = reduce() ? 1 : (v.fast ? 3200 : 6800);
    let done = false;
    if (reduce()) {
      b.style.left = Math.round(innerWidth * 0.35) + 'px';
      later(() => { if (!done) leave(); }, 9000);
    } else {
      const anim = b.animate(
        [
          { transform: 'translateX(0) translateY(0) scaleX(' + (fromLeft ? 1 : -1) + ')' },
          { transform: 'translateX(' + (fromLeft ? travel : -travel) + 'px) translateY(' + (v.flight ? '-26px' : '0') + ') scaleX(' + (fromLeft ? 1 : -1) + ')' },
        ],
        { duration: dur, easing: 'linear', fill: 'forwards' }
      );
      anim.onfinish = () => { if (!done) leave(); };
    }

    function leave() {
      done = true;
      b.style.transition = 'opacity .5s';
      b.style.opacity = '0';
      setTimeout(() => b.remove(), 560);
    }
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (done) return;
      done = true;
      b.classList.add('taken');
      const r = b.getBoundingClientRect();
      const isNew = J() ? J().find('wonder:' + v.id) : false;
      FX() && FX().sfx.sparkle();
      FX() && FX().burst(r.left + r.width / 2, r.top + r.height / 2, { kind: v.flight ? 'sparkle' : 'stars', n: calm() ? 6 : 16 });
      if (isNew) J().addGems(1);
      card(r.left, Math.max(20, r.top - 90), {
        who: (v.body && S() && S().FRIENDS ? helloName(v) : 'A visitor') + (isNew ? '  ★ new!' : ''),
        text: pick(v.lines) + (isNew ? ' (Found! +1 💎)' : ''),
        ms: v.riddle ? 9000 : 5600,
      });
      if (v.riddle) later(() => card(innerWidth * 0.3, innerHeight * 0.3, { who: 'Wise Owl', text: pick(v.answers), ms: 5200 }), 3600);
      leave();
      checkMilestones();
    });
    return b;
  }
  function helloName(v) {
    const F = S() && S().FRIENDS;
    if (!F) return 'A visitor';
    for (const k in F) if (F[k].species === v.body && (!v.colour || F[k].colour === v.colour)) return F[k].name;
    return 'A visitor';
  }

  /* ------------------------------------------------------------- celebrations */
  let lastTotals = null, checking = false;
  function totals() {
    if (!J()) return { stars: 0, gems: 0, finds: 0 };
    return { stars: J().total(), gems: J().gems(), finds: J().finds().length };
  }
  function need(m) { return m.stars || m.gems || m.finds; }
  function have(m, t) { return m.stars ? t.stars : m.gems ? t.gems : t.finds; }
  function checkMilestones() {
    if (!J() || checking) return;
    checking = true;
    try {
      const t = totals();
      // The first pass only takes a reading: a child who arrives already holding
      // three stars should not be interrupted before they have done anything.
      if (!lastTotals) { lastTotals = t; return; }
      for (const m of MILESTONES) {
        if (have(m, t) >= need(m) && !J().has('wonder:' + m.key)) {
          J().badge('wonder:' + m.key);
          // The badge is taken at once so it cannot fire twice, but the ceremony
          // waits a beat: a child who has just earned three stars should see them
          // fill before the universe interrupts with a big modal. `later` rather
          // than a bare timer, so a child who has already moved on to another
          // screen is never celebrated on a page they have left.
          later(() => ceremony(m, 12), 2600);
          break;
        }
      }
      lastTotals = t;
    } finally { checking = false; }
  }
  // A child reading their own win card should not be interrupted by the
  // universe, so the ceremony keeps asking until the screen clears. It cannot
  // wait forever: after a couple of minutes of blocked screens it comes anyway.
  function ceremony(m, tries) {
    if (busy() && tries > 0) { later(() => ceremony(m, tries - 1), 1500); return; }
    celebrate(m);
  }
  function celebrate(m) {
    const host = document.createElement('div');
    host.className = 'duw-big';
    host.innerHTML = '<div class="duw-inner">' +
      '<div class="duw-crest">' + m.crest + '</div>' +
      '<h3>' + esc(say(m.title)) + '</h3>' +
      (FX() && FX().dinoHTML ? FX().dinoHTML(pick(['trex', 'tricera', 'bronto', 'stego', 'ptero']), { state: 'happy', size: '150px' }) : '') +
      '<p>' + esc(say(m.line)) + '</p>' +
      '<button class="pill primary" type="button">Yay!</button></div>';
    document.body.appendChild(host);
    FX() && FX().sfx.win();
    FX() && FX().celebrate();
    const close = () => { host.remove(); document.removeEventListener('pointerdown', close); };
    host.querySelector('button').onclick = (e) => { e.stopPropagation(); close(); };
    host.addEventListener('pointerdown', close);
    // Never trap a child in a celebration: it closes on its own.
    setTimeout(() => { if (host.isConnected) close(); }, 9000);
  }

  /* -------------------------------------------------------------------- sky */
  function shootingStar() {
    if (!alive || reduce() || busy()) return;
    if (tod() !== 'night') return;
    const host = mount();
    const el = document.createElement('div');
    el.className = 'duw-shoot';
    const y0 = innerHeight * (0.08 + Math.random() * 0.25);
    el.style.left = '-20px';
    el.style.top = Math.round(y0) + 'px';
    host.appendChild(el);
    el.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + innerWidth + 'px,' + (innerHeight * 0.35) + 'px) scale(.4)', opacity: .2 },
    ], { duration: 2200, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }).onfinish = () => el.remove();
    FX() && FX().sfx.sparkle();
  }
  function rainbow() {
    if (!alive || reduce() || busy()) return;
    const host = mount();
    const el = document.createElement('div');
    el.className = 'duw-rainbow';
    host.appendChild(el);
    el.animate([{ opacity: 0 }, { opacity: .85, offset: .25 }, { opacity: .85, offset: .75 }, { opacity: 0 }],
      { duration: 7000, easing: 'ease-in-out' }).onfinish = () => el.remove();
    FX() && FX().sfx.chirp();
    card(innerWidth * 0.3, innerHeight * 0.12, { who: 'The sky', text: 'A rainbow! It only appears while somebody is playing.', ms: 6000 });
  }

  /* ------------------------------------------------------------------- start */
  function start(o) {
    if (alive) return;
    cfg = Object.assign({ world: null }, o || {});
    alive = true;
    lastTotals = totals();
    mount();
    // One mote almost immediately: a child should find out in the first minute
    // that this world has something extra hidden in it.
    later(() => { addMote('star'); addMote('petal'); }, 7000);
    later(() => sendVisitor(), 16000);
    later(() => { addMote(pick(['star', 'leaf', 'shell', 'gem'])); }, 24000);
    (function moteLoop() {
      later(() => { if (layer && layer.querySelectorAll('.duw-mote').length < 3) addMote(pick(['star', 'petal', 'leaf', 'shell', 'gem'])); moteLoop(); }, 14000 + rnd(9000));
    })();
    (function visitorLoop() {
      later(() => { sendVisitor(); visitorLoop(); }, 52000 + rnd(38000));
    })();
    (function skyLoop() {
      later(() => { shootingStar(); skyLoop(); }, 26000 + rnd(20000));
    })();
    if (J()) offJourney = J().changed(checkMilestones);
    document.addEventListener('visibilitychange', onVisible);
  }
  function onVisible() { if (!document.hidden) checkMilestones(); }
  function stop() {
    alive = false;
    timers.forEach(clearTimeout);
    timers = [];
    if (offJourney) { offJourney(); offJourney = null; }
    document.removeEventListener('visibilitychange', onVisible);
    if (layer) layer.remove();
    layer = null;
    document.querySelectorAll('.duw-big').forEach((n) => n.remove());
  }

  window.DUWONDER = {
    VISITORS, MILESTONES,
    start,
    stop,
    ping() { sendVisitor(); },
    visit(id) { return sendVisitor(VISITORS.find((v) => v.id === id)); },
    mote(n) { for (let i = 0; i < (n || 1); i++) addMote(pick(['star', 'petal', 'leaf', 'shell', 'gem'])); },
    celebrate(key) { const m = MILESTONES.find((x) => x.key === key); if (m) celebrate(m); },
    rainbow, shootingStar,
    // A world can ask for its own line of wonder without knowing any of this.
    cheer(text) { card(innerWidth * 0.5, innerHeight * 0.18, { who: 'Wonder', text: text }); },
    running() { return alive; },
  };

  /* Auto-start on every page that loads the module. The world name comes from the
   * folder, so nothing has to remember to call start(). */
  const here = (location.pathname.split('/').pop() || '').replace(/\.html?$/, '');
  const guessWorld = (() => {
    const m = location.pathname.match(/\/chapters\/([a-z-]+?)(?:-phaser)?\/?/);
    if (m) return m[1] === 'adventures' ? 'adventures' : m[1];
    return /index\.html?$/.test(location.pathname) || /\/dino\/?$/.test(location.pathname) ? 'hub' : null;
  })();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => start({ world: guessWorld || here }));
  } else start({ world: guessWorld || here });
})();
