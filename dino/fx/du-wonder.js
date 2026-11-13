/* DUWONDER — the ceremony layer, and nothing else.
 *
 *   window.DUWONDER.start()          begin watching the ledger (idempotent)
 *   window.DUWONDER.stop()           stop watching
 *   window.DUWONDER.check()          re-read the ledger, fire anything earned
 *   window.DUWONDER.celebrate(key)   fire one milestone by id
 *   window.DUWONDER.running()        a ceremony is on screen
 *
 * This module used to do a second job, and that job has been deleted: star
 * motes and "visitors" dropped at random positions on random timers over
 * whatever game the child was already playing, worth a gem if tapped. Random
 * objects appearing on a screen for no reason are not magic — they are a
 * placeholder standing in for the animation the world itself should have. So
 * there are no motes, no random visitors, and no reward for tapping something
 * that just appeared. What is left only speaks when the ledger says the child
 * has actually done something, and it says it once.
 *
 * Every milestone below is measured against DUJourney: stars won in a game,
 * gems paid for a performance, creatures met in a story. Surprise and motion
 * belong inside the worlds, where they answer what the child did.
 */
(function () {
  if (window.DUWONDER && window.DUWONDER.start) return;

  const FX = () => window.DUFX;
  const J = () => window.DUJourney;
  const S = () => window.DUSTORY;

  /* Crest art comes from assets/objects (an `object` slug) or the dinosaur
   * photographs (a `dino` species). Nothing here is an emoji.
   */
  const MILESTONES = [
    { key: 'valley-wakes', stars: 3, dino: 'bronto', title: 'The Valley Wakes',
      line: 'Three stars earned. Out past the lagoon, something is standing up to look at you.' },
    { key: 'track-walker', stars: 8, object: 'footprint', title: 'Track Walker',
      line: 'Eight stars. Your trail across the valley is easy to read now — even for something very large.' },
    { key: 'deep-time', stars: 15, object: 'ammonite', title: 'Deep Time',
      line: 'Fifteen stars. The stone is giving up what it has been keeping.' },
    { key: 'known-to-rex', stars: 24, dino: 'trex', title: 'Known to the Rex',
      line: 'Twenty-four stars. She has stopped announcing herself when you walk past. That is the highest praise there is.' },
    { key: 'five-stones', gems: 5, object: 'pyrite', title: 'Five Stones True',
      line: 'Five treasures, every one of them dug, flown or raced for.' },
    { key: 'amber-room', gems: 12, object: 'amber', title: 'The Amber Room',
      line: 'Twelve treasures. Hold one to the light and it is still, after a hundred million years, warm.' },
    { key: 'eight-names', finds: 8, object: 'feather', title: 'Eight Names',
      line: 'Your codex holds eight creatures you have met rather than read about.' },
  ];

  /* ------------------------------------------------------------------ plumbing */
  let timers = [], alive = false, offJourney = null;

  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function say(text) {
    let name = '';
    try { name = (localStorage.getItem('du-name') || '').trim(); } catch (e) { }
    return String(text).replace(/\bNAME\b/g, name || 'friend');
  }
  // A ceremony only ever arrives through a timer, so every one of them is
  // cancellable: a child who has moved on is never celebrated on the page they
  // left.
  function later(fn, ms) {
    const t = setTimeout(() => { if (!alive) return; if (document.hidden) { later(fn, ms); return; } fn(); }, ms);
    timers.push(t);
    return t;
  }
  // Something is already asking for the child's whole attention: a cutscene, a
  // ceremony of our own, or the win card of the game they just finished. Wonder
  // waits its turn rather than piling a second modal on top of the first.
  const busy = () => (S() && S().open()) || document.querySelector('.duw-big') || document.querySelector('.celebration-card');

  /* ------------------------------------------------------------- celebrations */
  let lastTotals = null, checking = false;
  function totals() {
    if (!J()) return { stars: 0, gems: 0, finds: 0 };
    return { stars: J().total(), gems: J().gems(), finds: J().finds().length };
  }
  function need(m) { return m.stars || m.gems || m.finds; }
  function have(m, t) { return m.stars ? t.stars : m.gems ? t.gems : t.finds; }
  function check() {
    if (!J() || checking) return;
    checking = true;
    try {
      const t = totals();
      // The first pass only takes a reading: a child who arrives already holding
      // three stars should not be interrupted before they have done anything.
      if (!lastTotals) { lastTotals = t; return; }
      for (const m of MILESTONES) {
        if (have(m, t) >= need(m) && !J().has('wonder:' + m.key)) {
          // The badge is taken at once so it cannot fire twice, but the ceremony
          // waits a beat: a child who has just earned three stars should watch
          // them fill before anything interrupts.
          J().badge('wonder:' + m.key);
          later(() => ceremony(m, 12), 2600);
          break;
        }
      }
      lastTotals = t;
    } finally { checking = false; }
  }
  // A child reading their own win card should not be interrupted, so the
  // ceremony keeps asking until the screen clears. It cannot wait forever:
  // after a couple of minutes of blocked screens it comes anyway, because the
  // child did earn it.
  function ceremony(m, tries) {
    if (busy() && tries > 0) { later(() => ceremony(m, tries - 1), 1500); return; }
    celebrate(m);
  }
  /* The crest is a photograph, never a glyph: either one of the dinosaur
   * images or a specimen cut from assets/objects. */
  function crestArt(m) {
    const O = FX() && FX().objects;
    if (m.dino && FX().dinoHTML) {
      return '<span class="duw-crest-art">' + FX().dinoHTML(m.dino, { state: 'happy', size: '190px' }) + '</span>';
    }
    if (m.object && O && O.known.has(m.object)) {
      return '<span class="duw-crest-art"><img class="du-obj" src="' + O.url(m.object) +
        '" width="170" height="170" alt="" decoding="async"></span>';
    }
    return '';
  }
  function celebrate(m) {
    if (typeof m === 'string') m = MILESTONES.find((x) => x.key === m);
    if (!m || document.querySelector('.duw-big')) return;
    const host = document.createElement('div');
    host.className = 'duw-big';
    host.innerHTML = '<div class="duw-inner">' + crestArt(m) +
      '<h3>' + esc(say(m.title)) + '</h3>' +
      '<p>' + esc(say(m.line)) + '</p>' +
      '<button class="pill primary" type="button">Go on</button></div>';
    document.body.appendChild(host);
    FX() && FX().sfx.win();
    FX() && FX().burst(innerWidth / 2, innerHeight * 0.4, { kind: 'sparkle', n: 30, color: '#ffd9a0' });
    const close = () => { host.remove(); document.removeEventListener('pointerdown', close); };
    host.querySelector('button').onclick = (e) => { e.stopPropagation(); close(); };
    host.addEventListener('pointerdown', close);
    // Never trap a child in a celebration: it closes on its own.
    setTimeout(() => { if (host.isConnected) close(); }, 9000);
  }

  /* ------------------------------------------------------------------- start */
  function start() {
    if (alive) return;
    alive = true;
    lastTotals = totals();
    if (J()) offJourney = J().changed(check);
    document.addEventListener('visibilitychange', onVisible);
  }
  function onVisible() { if (!document.hidden) check(); }
  function stop() {
    alive = false;
    timers.forEach(clearTimeout);
    timers = [];
    if (offJourney) { offJourney(); offJourney = null; }
    document.removeEventListener('visibilitychange', onVisible);
    document.querySelectorAll('.duw-big').forEach((n) => n.remove());
  }

  window.DUWONDER = { MILESTONES, start, stop, check, celebrate, running() { return alive; } };

  /* Every page that loads the module watches the ledger; nothing has to
   * remember to call start(). */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
