// Naughty Daddy — a 3-lane chase. Grayson's chosen dinosaur runs after Daddy Ellis through a garden,
// a street and a beach. Daddy throws banana peels, dodges, escapes on a skateboard and a giant duck,
// and when he is finally caught there is a full cartoon "gobble, burp, sorry!" cutscene.
// Everything is pretend and silly: nobody is ever really hurt, and there is no losing screen.
const FX = window.DUFX;
const W = 800, H = 500, HORIZON = 168;
const THEMES = [
  { name: 'Daddy’s Garden', sky: ['#7ad0f5', '#d9f4ff'], far: '#9fd6a8', ground: '#7bc96f', ground2: '#6dbb62', road: '#c8a56e', line: '#e8d4a6', side: ['🌳', '🌷', '🌻', '🪴'], obs: ['🪴', '🧸', '🐌'], ride: null, ambient: 'meadow', quip: ['“You can’t catch me, dinosaurs are slow!”', '“I only took ONE biscuit!”', '“Ha ha! Banana peel!”'] },
  { name: 'Silly Street', sky: ['#ffb27a', '#ffe9b8'], far: '#b9a4c9', ground: '#9aa0ab', ground2: '#8e95a1', road: '#59606c', line: '#ffffff', side: ['🏠', '🏢', '🚏', '🌳'], obs: ['🚧', '🛒', '📦'], ride: '🛹', ambient: 'meadow', quip: ['“Whee! Skateboard!”', '“Too fast for a dinosaur!”', '“Oops, wrong lane!”'] },
  { name: 'Sandy Beach', sky: ['#8fdcf7', '#fff2c9'], far: '#7fd0e8', ground: '#f2dca0', ground2: '#ead08c', road: '#e6c982', line: '#fff6d8', side: ['🌴', '⛱️', '🐚', '🏝️'], obs: ['🏰', '🪣', '🦀'], ride: '🦆', ambient: 'ocean', quip: ['“Quack quack, I’m a duck!”', '“You’ll never get me!”', '“Splash!”'] },
];
const DINOS = [
  { id: 'raptor', name: 'Velociraptor', speed: 1.2, tough: 1.0, blurb: 'The fastest runner!' },
  { id: 'trex', name: 'T-rex', speed: 1.0, tough: .85, blurb: 'Big, strong and loud.' },
  { id: 'tricera', name: 'Triceratops', speed: .9, tough: .5, blurb: 'Bumps barely slow him.' },
  { id: 'stego', name: 'Stegosaurus', speed: .85, tough: .6, blurb: 'Steady and swishy.' },
  { id: 'bronto', name: 'Brontosaurus', speed: .8, tough: .7, blurb: 'Gentle giant.' },
];

export function mountDaddyChase(context) {
  const level = context.level, theme = THEMES[(level - 1) % THEMES.length], hard = Math.min(1.6, 1 + (level - 1) * .08);
  const unlocked = DINOS.slice(0, Math.min(DINOS.length, 3 + Math.floor((level - 1) / 2)));
  const name = context.playerName ? context.playerName : 'you';
  let raf = 0, alive = true;
  const stop = () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); };
  context.stage.addEventListener('du-leave', stop);
  const obs = new MutationObserver(() => { if (!document.contains(context.stage)) { stop(); obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });

  // ------------------------------------------------------------------ pick a dinosaur
  context.stage.innerHTML = '<div class="dc-pick"><div class="dc-pick-head"><div class="dc-pick-daddy">' + FX.personHTML('daddy', { state: 'panic', size: .5 }) + '</div>' +
    '<div><h2>Naughty Daddy!</h2><p>Daddy Ellis has been very naughty and run away with the biscuits! Pick a dinosaur and chase him down in <b>' + theme.name + '</b>.</p></div></div>' +
    '<div class="dc-dinos">' + unlocked.map((d, i) => '<button class="dc-dino" data-i="' + i + '"><span class="dc-dino-art">' + FX.dinoHTML(d.id, { state: 'run' }) + '</span><b>' + d.name + '</b><small>' + d.blurb + '</small>' +
      '<span class="dc-stats"><i style="--v:' + d.speed / 1.3 + '"></i><i class="t" style="--v:' + (1.1 - d.tough) + '"></i></span></button>').join('') + '</div>' +
    '<p class="gentle-hint">Tap a dinosaur to start. Left and right change lane, jump over the banana peels, and grab drumsticks for a speed boost!</p></div>';
  context.stage.querySelectorAll('.dc-dino').forEach((b) => b.addEventListener('click', () => { FX.sfx.roar(); startChase(unlocked[Number(b.dataset.i)]); }));
  context.stage.querySelectorAll('.dc-dino').forEach((b) => b.addEventListener('pointerenter', () => FX.dinoState(b.querySelector('.du-dino'), 'roar', 700)));

  // ------------------------------------------------------------------ the chase
  let fitK = 1, area, cv, c, layer, dinoEl, daddyEl, rideEl, hud, gapFill, say;
  function fit() { if (!area) return; fitK = area.clientWidth / W; layer.style.setProperty('--fit', fitK); }
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); lane(-1); }
    if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); lane(1); }
    if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') { e.preventDefault(); jump(); }
  };
  const S = { lane: 1, laneX: 1, jumpT: -1, gap: .62, t: 0, items: [], scenery: [], daddyLane: 1, daddyX: 1, nextThrow: 2.2, nextSwap: 2.5, stun: 0, boost: 0, over: false, speed: 1, tough: 1, hits: 0, sayT: 0, offset: 0 };
  context.stage._chase = S;
  function lane(d) { if (S.over) return; const n = Math.max(0, Math.min(2, S.lane + d)); if (n !== S.lane) { S.lane = n; FX.sfx.whoosh(); } }
  function jump() { if (S.over || S.jumpT >= 0) return; S.jumpT = 0; FX.sfx.boing(); FX.dinoState(dinoEl.querySelector('.du-dino'), 'happy'); setTimeout(() => FX.dinoState(dinoEl.querySelector('.du-dino'), 'run'), 600); }

  // perspective helpers: depth z (0 far .. 1 near) -> screen
  const zt = (z) => Math.pow(z, 1.7);
  const proj = (z, laneF) => { const t = zt(z), spread = 30 + t * 205; return { x: W / 2 + (laneF - 1) * spread, y: HORIZON + (H - 40 - HORIZON) * t, s: .1 + t * .95 }; };

  function startChase(dino) {
    S.speed = dino.speed; S.tough = dino.tough;
    context.stage.innerHTML = '<div class="dc-wrap"><div class="dc-area"><canvas width="' + W + '" height="' + H + '" class="dc-cv"></canvas><div class="dc-layer"></div>' +
      '<div class="dc-hud"><div class="dc-gap"><span class="dc-gap-d"></span><div class="dc-gap-bar"><i></i></div><span class="dc-gap-me">' + FX.dinoHTML(dino.id, { size: 40 }) + '</span></div><div class="dc-say" aria-live="polite"></div></div>' +
      '<div class="dc-ctrls"><button class="dc-btn" data-a="l" aria-label="Move left">◀</button><button class="dc-btn dc-jump" data-a="j" aria-label="Jump">⤴ Jump</button><button class="dc-btn" data-a="r" aria-label="Move right">▶</button></div></div></div>';
    area = context.stage.querySelector('.dc-area'); cv = area.querySelector('canvas'); c = cv.getContext('2d'); layer = area.querySelector('.dc-layer');
    gapFill = area.querySelector('.dc-gap-bar i'); say = area.querySelector('.dc-say');
    layer.innerHTML = '<div class="dc-ride"></div><div class="dc-daddy">' + FX.personHTML('daddy', { state: 'run', size: 1 }) + '</div><div class="dc-dino-me">' + FX.dinoHTML(dino.id, { state: 'run', size: 190 }) + '</div>';
    dinoEl = layer.querySelector('.dc-dino-me'); daddyEl = layer.querySelector('.dc-daddy'); rideEl = layer.querySelector('.dc-ride');
    rideEl.textContent = theme.ride || '';
    area.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.dc-btn')) return;
      const r = area.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      if (y < .55) jump(); else if (x < .4) lane(-1); else if (x > .6) lane(1); else jump();
    });
    context.stage.querySelectorAll('.dc-btn').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); const a = b.dataset.a; if (a === 'l') lane(-1); else if (a === 'r') lane(1); else jump(); }));
    window.addEventListener('keydown', onKey); window.addEventListener('resize', fit);
    for (let i = 0; i < 14; i++) S.scenery.push({ z: i / 14, side: i % 2 ? 1 : -1, e: theme.side[i % theme.side.length], off: .5 + (i * .37 % 1) * .9 });
    fit(); FX.ambient(null); FX.ambient(theme.ambient);
    shout('Go go go! Catch Daddy Ellis!', 2600);
    let last = performance.now(); let foot = 0;
    const frame = (now) => {
      if (!alive) return;
      const dt = Math.min(.04, (now - last) / 1000); last = now;
      if (!S.over) { step(dt); foot += dt; if (foot > .32) { foot = 0; if (S.stun <= 0) FX.sfx.engine(); } }
      draw(); place();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function shout(t, ms) { say.textContent = t; say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop'); S.sayT = ms || 2200; }

  function step(dt) {
    S.t += dt; S.sayT -= dt * 1000; if (S.sayT < 0) say.classList.remove('pop');
    const world = .46 * hard * (S.boost > 0 ? 1.55 : 1) * (S.stun > 0 ? .5 : 1);
    S.offset += world * dt * 3;
    S.laneX += (S.lane - S.laneX) * Math.min(1, dt * 11);
    S.daddyX += (S.daddyLane - S.daddyX) * Math.min(1, dt * 8);
    if (S.jumpT >= 0) { S.jumpT += dt / .7; if (S.jumpT >= 1) S.jumpT = -1; }
    S.stun = Math.max(0, S.stun - dt); S.boost = Math.max(0, S.boost - dt);
    // gap: closes steadily, faster with speed and boosts
    const close = (.021 + level * .0012) * S.speed * (S.boost > 0 ? 2.6 : 1) * (S.stun > 0 ? .2 : 1);
    S.gap = Math.max(0, Math.min(1, S.gap - close * dt));
    // Daddy: dodges between lanes and throws things
    S.nextSwap -= dt; if (S.nextSwap <= 0) { S.daddyLane = Math.floor(Math.random() * 3); S.nextSwap = 1.6 + Math.random() * 2; }
    S.nextThrow -= dt;
    if (S.nextThrow <= 0) {
      const dz = daddyZ(); const l = Math.random() < .55 ? S.lane : Math.floor(Math.random() * 3);
      S.items.push({ kind: 'obs', z: dz + .02, lane: l, e: Math.random() < .5 ? '🍌' : pick(theme.obs), low: true, spin: 0 });
      FX.personState(daddyEl, 'run'); S.nextThrow = (2.4 - Math.min(.9, level * .09)) + Math.random() * 1.6;
      if (Math.random() < .4) shout(pick(theme.quip), 2400);
    }
    if (Math.random() < dt * .75) S.items.push({ kind: 'good', z: .02, lane: Math.floor(Math.random() * 3), e: '🍗' });
    if (Math.random() < dt * .35) S.items.push({ kind: 'good', z: .02, lane: Math.floor(Math.random() * 3), e: '⭐' });
    // move + collide
    const dz = world * dt * 1.15;
    for (const it of S.items) {
      it.z += dz * (it.kind === 'obs' ? 1 : .9); it.spin += dt * 5;
      if (!it.hit && it.z > .86 && it.z < 1.0 && Math.abs(it.lane - S.laneX) < .55) {
        if (it.kind === 'good') { it.hit = true; collect(it); }
        else if (S.jumpT < 0 || S.jumpT > .72 || S.jumpT < .12) { it.hit = true; bump(it); }
      }
    }
    S.items = S.items.filter((it) => it.z < 1.25 && !it.hit);
    S.scenery.forEach((s) => { s.z += dz * .85; if (s.z > 1.15) { s.z -= 1.15; s.e = pick(theme.side); } });
    // gap bar
    gapFill.style.width = (100 - S.gap * 100) + '%';
    if (S.gap <= .02) caught();
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const daddyZ = () => .92 - S.gap * .46;
  function collect(it) {
    const r = dinoEl.getBoundingClientRect();
    if (it.e === '🍗') { S.boost = 1.4; FX.sfx.star(); FX.burst(r.left + r.width / 2, r.top, { kind: 'sparkle', n: 12 }); FX.floatText(r.left + r.width / 2, r.top - 10, 'ZOOM!'); shout('Yum! Speed boost!', 1400); FX.dinoState(dinoEl.querySelector('.du-dino'), 'happy'); setTimeout(() => FX.dinoState(dinoEl.querySelector('.du-dino'), 'run'), 800); }
    else { S.gap = Math.max(0, S.gap - .05); FX.sfx.good(); FX.burst(r.left + r.width / 2, r.top, { kind: 'stars', n: 6 }); }
  }
  function bump(it) {
    S.stun = .9; S.hits++; S.gap = Math.min(1, S.gap + .12 * S.tough); FX.sfx.thud(); FX.shakeScreen(4);
    const r = dinoEl.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.bottom - 20, { kind: 'dust', n: 8 });
    FX.dinoState(dinoEl.querySelector('.du-dino'), 'sad', 900); shout(it.e === '🍌' ? 'Whoa, a banana peel! Daddy giggles…' : 'Oops! Jump or dodge next time!', 1800);
    setTimeout(() => FX.dinoState(dinoEl.querySelector('.du-dino'), 'run'), 950);
    FX.personState(daddyEl, 'run'); const d = daddyEl.querySelector('.du-person'); d.classList.add('blush');
  }

  // ------------------------------------------------------------------ drawing
  function draw() {
    const g = c.createLinearGradient(0, 0, 0, HORIZON + 20); g.addColorStop(0, theme.sky[0]); g.addColorStop(1, theme.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // distant hills
    c.fillStyle = theme.far; c.beginPath(); c.moveTo(0, HORIZON + 4);
    for (let x = 0; x <= W; x += 40) c.lineTo(x, HORIZON - 26 - Math.sin(x * .02 + 1) * 20 - Math.sin(x * .05) * 8); c.lineTo(W, HORIZON + 4); c.fill();
    c.fillStyle = theme.ground; c.fillRect(0, HORIZON, W, H - HORIZON);
    // grass stripes rushing toward us
    for (let i = 0; i < 14; i++) { const z = ((i / 14) + S.offset * .08) % 1, t0 = zt(z), t1 = zt(Math.min(1, z + .035)); c.fillStyle = i % 2 ? theme.ground2 : theme.ground; const y0 = HORIZON + (H - HORIZON) * t0, y1 = HORIZON + (H - HORIZON) * t1; c.fillRect(0, y0, W, Math.max(1, y1 - y0)); }
    // road
    const top = proj(0, 0), bot = proj(1.05, 0), sp0 = 30 + 0 * 205, sp1 = 30 + zt(1.05) * 205;
    c.fillStyle = theme.road; c.beginPath(); c.moveTo(W / 2 - sp0 * 1.6, HORIZON); c.lineTo(W / 2 + sp0 * 1.6, HORIZON); c.lineTo(W / 2 + sp1 * 1.6, bot.y); c.lineTo(W / 2 - sp1 * 1.6, bot.y); c.fill();
    c.strokeStyle = theme.line; c.lineWidth = 3; c.globalAlpha = .6;
    for (const f of [.5, 1.5]) for (let i = 0; i < 12; i++) { const z0 = ((i / 12) + S.offset * .09) % 1, z1 = Math.min(1, z0 + .04); const a = proj(z0, f), b = proj(z1, f); c.lineWidth = 1 + zt(z0) * 5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    c.globalAlpha = 1;
    // sorted draw list: scenery, obstacles, good stuff (far first)
    const list = [];
    S.scenery.forEach((s) => list.push({ z: s.z, f: () => { const p = proj(s.z, 1 + s.side * (2.1 + s.off)); drawEmoji(s.e, p.x, p.y, 120 * p.s); } }));
    S.items.forEach((it) => list.push({ z: it.z, f: () => { const p = proj(it.z, it.lane); if (it.kind === 'good') { const bob = Math.sin(S.t * 6 + it.lane) * 6 * p.s; c.save(); c.shadowColor = '#ffe066'; c.shadowBlur = 16; drawEmoji(it.e, p.x, p.y - 30 * p.s + bob, 58 * p.s + 8); c.restore(); } else { c.save(); c.translate(p.x, p.y); c.rotate(it.e === '🍌' ? Math.sin(it.spin) * .3 : 0); drawEmoji(it.e, 0, 0, 64 * p.s + 10); c.restore(); } } }));
    list.sort((a, b) => a.z - b.z).forEach((o) => o.f());
    // speed lines when boosting
    if (S.boost > 0) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const x = (i * 97 + S.t * 900) % W, y = HORIZON + ((i * 53) % (H - HORIZON)); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (x - W / 2) * .12, y + (y - HORIZON) * .12); c.stroke(); } }
  }
  function drawEmoji(e, x, y, size) { c.font = Math.max(8, size) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(e, x, y); }

  // DOM characters follow the same projection
  function place() {
    const dz = daddyZ(), dp = proj(dz, S.daddyX), k = dp.s * .78;
    daddyEl.style.transform = `translate(${dp.x - 100 * k}px,${dp.y - 322 * k}px) scale(${k})`;
    const bounce = Math.sin(S.t * 14) * 3 * k;
    daddyEl.style.marginTop = bounce + 'px';
    rideEl.style.transform = `translate(${dp.x - 40 * k * 1.6}px,${dp.y - 40 * k}px)`; rideEl.style.fontSize = (90 * k) + 'px';
    const mp = proj(.93, S.laneX), jh = S.jumpT >= 0 ? Math.sin(S.jumpT * Math.PI) * 120 : 0, ds = mp.s * .95 + .12;
    dinoEl.style.transform = `translate(${mp.x - 95 * ds}px,${mp.y - 150 * ds - jh}px) scale(${ds})`;
  }

  // ------------------------------------------------------------------ the catch!
  async function caught() {
    if (S.over) return; S.over = true; window.removeEventListener('keydown', onKey);
    const me = dinoEl.querySelector('.du-dino'), dad = daddyEl.querySelector('.du-person');
    const speech = (t, x, y, ms) => { const b = document.createElement('div'); b.className = 'dc-bubble'; b.textContent = t; b.style.left = x + '%'; b.style.top = y + '%'; layer.append(b); setTimeout(() => b.remove(), ms || 1800); };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    area.classList.add('dc-zoom'); FX.sfx.roar(); FX.shakeScreen(6); FX.dinoState(me, 'roar'); FX.personState(dad, 'panic');
    shout('GOTCHA!', 3200);
    // Daddy skids to a stop beside the dinosaur
    daddyEl.style.transition = 'transform .6s cubic-bezier(.3,.8,.3,1)'; dinoEl.style.transition = 'transform .6s ease-out';
    const dp = proj(.9, 1.2), k = .74;
    daddyEl.style.transform = `translate(${W / 2 + 30 - 100 * k}px,${dp.y - 322 * k}px) scale(${k})`;
    speech('Aaaahh! No no no!', 58, 22, 1500);
    await wait(1100);
    // GULP — Daddy jumps (is scooped) into the dino's mouth, shrinking as he goes
    FX.dinoState(me, 'eat'); FX.sfx.chomp();
    daddyEl.style.transition = 'transform .7s ease-in, opacity .7s';
    const mp = proj(.93, 1);
    daddyEl.style.transform = `translate(${mp.x - 20}px,${mp.y - 190}px) scale(.12) rotate(540deg)`; daddyEl.style.opacity = .9;
    await wait(720); FX.sfx.chomp(); daddyEl.style.opacity = 0;
    me.classList.add('dc-belly'); speech('Mmmphf!', 44, 40, 1400);
    const bump = document.createElement('div'); bump.className = 'dc-bump'; bump.innerHTML = '<img src="./assets/daddy-head.webp" alt="">'; dinoEl.append(bump);
    FX.floatText(innerWidth / 2, innerHeight / 2, 'gulp!');
    await wait(1700);
    // BURP — he comes flying out, dizzy and sorry
    FX.dinoState(me, 'roar'); FX.sfx.roar(); FX.shakeScreen(7); shout('BUUURP!', 1800); bump.remove(); me.classList.remove('dc-belly');
    dad.classList.add('blush'); FX.personState(dad, 'caught'); daddyEl.style.opacity = 1;
    daddyEl.style.transition = 'transform .9s cubic-bezier(.2,.8,.4,1)';
    const lp = proj(.8, -.35); daddyEl.style.transform = `translate(${lp.x - 100 * .62}px,${lp.y - 322 * .62}px) scale(.62) rotate(-14deg)`;
    const r = dinoEl.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + 30, { kind: 'confetti', n: 30 }); FX.sfx.win();
    await wait(1000); FX.dinoState(me, 'happy'); me.setAttribute('data-base', 'happy');
    speech('Okay okay! I’m sorry I was naughty!', 30, 24, 2600); FX.celebrate();
    await wait(2800);
    speech(name === 'you' ? 'Hugs for everyone?' : 'Hugs for ' + name + '?', 30, 24, 1800); FX.personState(dad, 'happy'); FX.burst(r.left + r.width / 2, r.top, { kind: 'hearts', n: 14 });
    await wait(1900);
    stop(); obs.disconnect();
    context.advance('You caught Daddy Ellis! He promised to be good… for at least five minutes.');
  }
}
