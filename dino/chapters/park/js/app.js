/* Dino Park — menu, Dino Den and hub bridge. */
(function () {
  'use strict';
  const { $, $$, el, pick, FX, den, stars, egg } = window.Park;
  const EMBEDDED = window.top && window.top !== window.self;
  let childName = '';

  function denDino(d, i) {
    const w = el('button', 'den-dino');
    const size = 78 + (i % 3) * 14;
    w.style.setProperty('--w', size + 'px');
    w.style.setProperty('--t', (22 + (i * 7) % 18) + 's');
    w.style.setProperty('--o', (-(i * 5.3) % 20).toFixed(1) + 's');
    w.style.setProperty('--r', (60 + (i * 31) % 150) + 'px');
    w.style.setProperty('--b', ((i * 9) % 26) + 'px');
    w.setAttribute('aria-label', d.n + ' the dinosaur');
    w.innerHTML = `<span class="dd-walk">${FX.dinoHTML(d.s, { color: d.c, head: d.h, state: 'walk' })}</span><em>${d.n}</em>`;
    w.onclick = () => {
      const dEl = $('.du-dino', w); FX.dinoState(dEl, d.s === 'trex' || d.h === 'trex' ? 'roar' : 'happy', 1200);
      (d.s === 'trex' ? FX.sfx.roar : FX.sfx.chirp)();
      const r = w.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + 8, { kind: 'hearts', n: 6 }); FX.floatText(r.left + r.width / 2, r.top, d.n + '!');
    };
    return w;
  }

  function renderMenu() {
    // Egg meter
    const e = egg.get();
    $('#eggCard').innerHTML = `<div class="ec-eggs">${[0, 1, 2].map((i) => `<span class="ec-egg${i < e ? ' warm' : ''}${i === e ? ' next' : ''}">🥚</span>`).join('')}</div><p>${e === 0 ? 'Win games to warm your next egg!' : `${3 - e} more win${3 - e === 1 ? '' : 's'} to hatch it!`}</p>`;
    // Den
    const all = den.all(), box = $('#den'); box.innerHTML = '';
    $('#denCount').textContent = all.length ? `(${all.length} friend${all.length === 1 ? '' : 's'})` : '';
    if (!all.length) box.append(el('div', 'den-empty', `<span class="nest">🪺</span><p>Your den is empty. Win three games to hatch your first dinosaur!</p>`));
    else all.slice(-12).forEach((d, i) => box.append(denDino(d, i)));
    // Games
    const grid = $('#gameGrid'); grid.innerHTML = '';
    let total = 0;
    window.Park.games.forEach((g, i) => {
      const s = stars.get(g.id); total += s;
      const b = el('button', 'tile'); b.style.setProperty('--gc', g.color); b.style.setProperty('--du-delay', (i * .05) + 's');
      b.dataset.game = g.id;
      b.innerHTML = `<span class="tile-art">${FX.dinoHTML(g.icon, { state: i % 2 ? 'idle' : 'idle', color: undefined })}</span><span class="name">${g.name}</span><span class="tile-desc">${g.desc}</span><span class="stars">${[1, 2, 3].map((n) => `<i class="${n <= s ? 'on' : ''}">★</i>`).join('')}</span>`;
      b.onclick = () => { FX.sfx.tap(); window.Park.start(g.id); };
      b.addEventListener('pointerenter', () => FX.dinoState($('.du-dino', b), 'happy', 900));
      grid.append(b);
    });
    $('#heroSub').textContent = `${window.Park.games.length} games · ${total} of ${window.Park.games.length * 3} stars${childName ? ' · ' + childName + '’s park' : ''}`;
  }
  window.Park.renderMenu = renderMenu;

  /* ----- buttons ----- */
  $('#homeBtn').onclick = () => {
    FX.sfx.tap();
    if (!$('#game').classList.contains('hidden')) return window.Park.toMenu();
    if (EMBEDDED) window.top.postMessage({ type: 'du-back' }, location.origin);
  };
  $('#backBtn').onclick = () => { FX.sfx.tap(); window.Park.toMenu(); };
  $('#menuBtn').onclick = () => { FX.sfx.tap(); window.Park.toMenu(); };
  $('#againBtn').onclick = () => { FX.sfx.tap(); window.Park.again(); };
  $('#nextBtn').onclick = () => { FX.sfx.tap(); window.Park.nextGame(); };
  function setSound(on, tell) {
    FX.configure({ sound: on });
    $('#soundBtn').textContent = on ? '🔊' : '🔇';
    $('#soundBtn').setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    if (tell && EMBEDDED) window.parent.postMessage({ type: 'du-settings-update', sound: on }, location.origin);
  }
  $('#soundBtn').onclick = () => { const on = !FX.settings.sound; setSound(on, true); if (on) FX.sfx.good(); };

  /* ----- hub bridge ----- */
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'du-settings' || e.origin !== location.origin) return;
    childName = e.data.name || '';
    $('#title').textContent = childName ? 'Dino Park · ' + childName : 'Dino Park';
    if (typeof e.data.sound === 'boolean') setSound(e.data.sound, false);
    if (!$('#menu').classList.contains('hidden')) renderMenu();
  });
  if (EMBEDDED) window.top.postMessage({ type: 'du-ready' }, location.origin);

  FX.ambient('meadow');
  renderMenu();
})();
