/* Dinosaur Universe — one shared journey (DUJourney).
 *
 * Before this, every world kept progress in its own key and the hub only knew
 * how to read four of them, so stars earned in the Phaser worlds and in Egg
 * Dash never appeared anywhere. This is the single ledger every world writes to
 * and the hub, the map and the story all read from.
 *
 *   DUJourney.record('park.puzzle', { stars: 2, level: 3 })
 *   DUJourney.stars('park.puzzle')      -> best stars, 0-3
 *   DUJourney.total()                   -> all stars earned
 *   DUJourney.badge('star-garden')      -> award, returns true the first time
 *   DUJourney.find('dino:tricera')      -> codex entry, true when newly found
 *   DUJourney.nextChapter()             -> story chapter currently unlocked
 *   DUJourney.changed(fn)               -> subscribe, for live HUD updates
 *
 * Legacy per-world keys are folded in once, so nobody loses an evening's play.
 * Broadcasts to the parent frame so the hub reacts without polling.
 */
(function () {
  'use strict';
  if (window.DUJourney && window.DUJourney.record) return;
  const KEY = 'du-journey-v1';
  const MIGRATED = 'du-journey-migrated-v1';

  function blank() {
    return { v: 1, stars: {}, plays: {}, levels: {}, badges: [], finds: [], chapter: 0, gems: 0, started: Date.now() };
  }
  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && raw.v === 1 && raw.stars) {
        // Tolerate anything an older build left half-written.
        raw.badges = Array.isArray(raw.badges) ? raw.badges : [];
        raw.finds = Array.isArray(raw.finds) ? raw.finds : [];
        raw.levels = raw.levels || {}; raw.plays = raw.plays || {};
        raw.chapter = Number(raw.chapter) || 0; raw.gems = Number(raw.gems) || 0;
        return raw;
      }
    } catch (e) { }
    return blank();
  }
  let data = read();
  const listeners = [];

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { }
    emit();
  }
  function emit() {
    for (const fn of listeners.slice()) { try { fn(data); } catch (e) { } }
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'du-journey', stars: J.total(), chapter: data.chapter }, window.__DU_ORIGIN || location.origin); } catch (e) { }
    }
  }

  /* ---------- fold in what each world already kept ---------- */
  function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
  // The classic Dino Park names for six games the Phaser park still plays.
  const PARK_ALIAS = { jigsaw: 'puzzle', lotto: 'footprint', assemble: 'mixer', sort: 'size', count: 'counting', dots: 'dot' };
  function migrate() {
    try {
      if (localStorage.getItem(MIGRATED)) return;
      const g = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || {}; } catch (e) { return {}; } };
      // Classic Dino Park kept one value per game id. Six of those games are the
      // Phaser park games under their old names, so fold them onto the keys the
      // games write today — otherwise one dinosaur puzzle is worth two map stars.
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!/^dino_[a-z]+$/.test(k)) continue;
        const id = k.slice(5);
        // dino_egg and dino_den are the park's house counters (core.js), not games:
        // folding them in would award phantom map stars no game ever paid.
        if (['stars', 'best', 'progress', 'name', 'settings', 'egg', 'den'].includes(id)) continue;
        J.award('park.' + (PARK_ALIAS[id] || id), Math.min(3, num(JSON.parse(localStorage.getItem(k)))));
      }
      // The four little arcades only ever kept their best score in their own
      // file. A child who already caught eggs or flew a balloon should not start
      // the campaign map as if they had never played, so convert those bests
      // with the same steps the games themselves use.
      const steps = (v, s) => (v >= s[2] ? 3 : v >= s[1] ? 2 : v >= s[0] ? 1 : 0);
      const catchBest = num(g('dino-park-phaser-v1').best);
      if (catchBest) J.award('park.arcade', steps(catchBest, [15, 40, 80]));
      const runBest = num(g('dino-car-studio-phaser-v1').best);
      if (runBest) J.award('drive.run', steps(runBest, [6, 15, 30]));
      const flightBest = num(g('dino-adventures-phaser-v1').best);
      if (flightBest) J.award('act.flight', steps(flightBest, [5, 12, 25]));
      const pairBest = num(g('dino-meadow-phaser-v1').best);
      if (pairBest) J.award('meadow.arcade', pairBest <= 8 ? 3 : pairBest <= 12 ? 2 : 1);
      const done = g('dm-completed');
      if (Array.isArray(done)) done.forEach((id) => { J.award('meadow.' + id, 1); data.plays['meadow.' + id] = (data.plays['meadow.' + id] || 0) + 1; });
      const car = g('dino-car-studio-v1');
      if (num(car.totalStars)) { data.gems += num(car.totalStars); J.award('drive.race', Math.min(3, num(car.bestStars))); }
      const adv = g('dinosaur-universe-player-v1');
      if (Array.isArray(adv.completed)) adv.completed.forEach((id) => { J.award('act.' + id, 1); data.levels['act.' + id] = num((adv.levels || {})[id]); });
      if (num(adv.stars)) data.gems += num(adv.stars);
      const egg = g('dino-egg-dash-v1');
      if (num(egg.best)) J.award('egg.dash', Math.min(3, Math.floor(num(egg.best) / 12) + 1));
      const res = g('du-rescue-v1');
      if (Array.isArray(res.badges)) res.badges.forEach((b) => J.badge('rescue-' + b));
      if (num(res.next)) data.chapter = Math.max(data.chapter, 1);
      localStorage.setItem(MIGRATED, '1');
      save();
    } catch (e) { }
  }

  /* An early build folded the classic park in under its own names, so a ledger
   * written by that build counts six games twice. Merge and drop those keys on
   * every load — cheap, and it keeps the star total honest. */
  function foldParkAliases() {
    let changed = false;
    for (const old in PARK_ALIAS) {
      const from = 'park.' + old, to = 'park.' + PARK_ALIAS[old];
      if (data.stars[from] === undefined) continue;
      data.stars[to] = Math.max(num(data.stars[to]), num(data.stars[from]));
      data.plays[to] = num(data.plays[to]) + num(data.plays[from]);
      delete data.stars[from]; delete data.plays[from]; delete data.levels[from];
      changed = true;
    }
    if (changed) save();
  }

  const J = window.DUJourney = {
    get data() { return data; },
    raw: () => data,
    load: () => data,

    /** Best-known star count for one game. Never lowers a previous best. */
    award(gameKey, stars) {
      const s = Math.max(0, Math.min(3, Math.round(num(stars))));
      const was = num(data.stars[gameKey]);
      if (s > was) { data.stars[gameKey] = s; save(); return s - was; }
      return 0;
    },
    /** The one call a game should make when a level finishes. */
    record(gameKey, o) {
      o = o || {};
      data.plays[gameKey] = (data.plays[gameKey] || 0) + 1;
      const gained = J.award(gameKey, o.stars);
      if (o.level !== undefined) data.levels[gameKey] = Math.max(num(data.levels[gameKey]), num(o.level));
      if (o.gems) data.gems = num(data.gems) + num(o.gems);
      save();
      return { gained, best: J.stars(gameKey), total: J.total() };
    },
    stars: (gameKey) => num(data.stars[gameKey]),
    level: (gameKey) => num(data.levels[gameKey]),
    played: (gameKey) => num(data.plays[gameKey]),
    /** Total stars across every game in the universe. */
    total() { let t = 0; for (const k in data.stars) t += num(data.stars[k]); return t; },
    /** Stars earned out of stars available, for progress bars. */
    outOf(possible) { return { have: J.total(), of: possible }; },

    badge(id) {
      if (data.badges.includes(id)) return false;
      data.badges.push(id); save(); return true;
    },
    has: (id) => data.badges.includes(id),
    badges: () => data.badges.slice(),

    /** Codex: a dinosaur, gem or friend the child has met. */
    find(id) {
      if (data.finds.includes(id)) return false;
      data.finds.push(id); save(); return true;
    },
    found: (id) => data.finds.includes(id),
    finds: () => data.finds.slice(),
    gems: () => num(data.gems),
    /** Loose treasures a child has picked up. Returns the new pouch total. */
    addGems(n) { data.gems = num(data.gems) + Math.max(0, num(n)); save(); return data.gems; },

    /* ---------- story chapters ---------- */
    chapter: () => num(data.chapter),
    /** A chapter stays unlocked once reached; finishing one advances the arc. */
    reach(n) {
      if (num(n) > data.chapter) { data.chapter = num(n); save(); return true; }
      return false;
    },
    unlocked: (n) => num(data.chapter) >= num(n),

    /** How many games in a world have at least one star, for map progress. */
    worldProgress(prefix) {
      let have = 0, best = 0;
      for (const k in data.stars) if (k.indexOf(prefix + '.') === 0) { best++; if (data.stars[k] > 0) have++; }
      return { have, best };
    },
    worldStars(prefix) {
      let t = 0;
      for (const k in data.stars) if (k.indexOf(prefix + '.') === 0) t += num(data.stars[k]);
      return t;
    },
    /** The chapter a child should be playing now: the furthest one reached. */
    nextChapter() { return Math.max(0, Math.min(6, num(data.chapter))); },

    changed(fn) { if (typeof fn === 'function') { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; } },
    save,
    reset() { data = blank(); try { localStorage.removeItem(MIGRATED); } catch (e) { } save(); },
    /** Reload from disk — the hub uses this after a chapter posts an update. */
    reload() { data = read(); foldParkAliases(); for (const fn of listeners.slice()) { try { fn(data); } catch (e) { } } return data; }
  };

  migrate();
  foldParkAliases();
  // A chapter lives in an iframe: tell the hub the moment anything changes.
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'du-journey-invalidate') return;
    if (e.origin !== location.origin) return;
    J.reload();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) J.reload(); });
})();
