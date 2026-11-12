(function () {
  const KEY = 'dino-progress-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { games: {}, playtime: 0 }; } catch { return { games: {}, playtime: 0 }; } }
  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  window.DinoProgress = {
    get(gameId) { const d = load(); return d.games[gameId] || { stars: 0, plays: 0 }; },
    record(gameId, stars) {
      const d = load();
      const g = d.games[gameId] || { stars: 0, plays: 0 };
      g.plays += 1; g.stars = Math.max(g.stars, Math.min(5, Math.round(stars)));
      d.games[gameId] = g; save(d);
    },
    addPlaytime(seconds) { const d = load(); d.playtime += seconds; save(d); },
    reset() { localStorage.removeItem(KEY); }
  };
})();
