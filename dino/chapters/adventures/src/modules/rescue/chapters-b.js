// Chapters 4–7: the Crystal Cave, the River of Fire, the Sky Ride and Grumblecloud's Peak.
import { wait, rnd, MOUNTS, writeSave, kidName } from './engine.js?v=du-276e018775e133bb';
import { sing } from './chapters-a.js?v=du-276e018775e133bb';
const FX = window.DUFX;
// The four keys of the crystal song are four different stones — quartz, moonstone, jade,
// carnelian — so each photographs as itself. The green heart was the odd one out: hearts have
// no photograph, and the colour of that key has been jade all along.
const KEYS = [{ icon: '💎', deg: 0, color: '#4fd0ff' }, { icon: '🔮', deg: 1, color: '#c18bff' }, { icon: '🟢', deg: 2, color: '#5be39b' }, { icon: '🧡', deg: 3, color: '#ffb04d' }];
const seqOf = (n) => { const a = []; for (let i = 0; i < n; i++) a.push(Math.floor(Math.random() * 4)); return a; };
// No bat sits in the specimen library, and these fly past as DOM text no walker can turn into
// a photograph — so the cave draws its own, in em, which keeps them in scale with the tunnel.
const BAT = '<svg viewBox="0 0 40 22" width="2.2em" height="1.21em" aria-hidden="true" focusable="false" style="vertical-align:-0.15em">' +
  '<g fill="#2b2438"><ellipse cx="20" cy="12" rx="3.2" ry="4.8"/>' +
  '<path d="M17.4 7 15 3l4 3ZM22.6 7 25 3l-4 3Z"/>' +
  '<path d="M20 10c-4-5-10-7-17-5 3 2 5 5 4 9 3-3 7-2 9 2 1-3 3-5 4-6Z"/>' +
  '<path d="M20 10c4-5 10-7 17-5-3 2-5 5-4 9-3-3-7-2-9 2-1-3-3-5-4-6Z"/></g></svg>';

// ================================================================= CHAPTER 4: crystal cave
export async function chapter4(E) {
  E.setChapter(4, 'The Crystal Cave');
  E.scene('<div class="rs-cavebg"></div><div class="rs-dark"></div>', { ambient: 'night', music: 'cave', cls: 'in-cave' });
  await E.titleCard(3, 'The Crystal Cave', 'Light the way with your torch');
  const me = E.mount(8, 52, 22, 'walk'); me.style.zIndex = 3;
  const dark = E.world.querySelector('.rs-dark'), light = (x, y) => { dark.style.setProperty('--lx', x + '%'); dark.style.setProperty('--ly', y + '%'); };
  light(18, 66);
  const move = (e) => { const r = E.area.getBoundingClientRect(); light(((e.clientX - r.left) / r.width * 100).toFixed(1), ((e.clientY - r.top) / r.height * 100).toFixed(1)); };
  E.area.addEventListener('pointermove', move); E.area.addEventListener('pointerdown', move);
  await E.say('The only way to the mountain top is through this cave. It is very dark inside! Move your torch by touching the screen.', 'narrator', 400);
  await E.say('Find the glowing crystals and tap all five to light the way!', 'narrator', 300); E.hush();
  await E.tapAll([[20, 24, '💎'], [46, 74, '💎'], [70, 28, '💎'], [86, 62, '💎'], [34, 44, '💎']], 'crystal');
  dark.classList.add('lit'); E.area.removeEventListener('pointermove', move); E.area.removeEventListener('pointerdown', move);
  E.sfx.win(); E.addGems(3);
  await E.real('cave', '🥚', 'Real dinosaur eggs have been found in rock, just like a nest.');
  await E.say('The whole cave glitters like a rainbow!', 'narrator', 700);
  for (let i = 0; i < 4; i++) { const b = E.add(BAT, 'rs-bat', 'top:' + (12 + i * 9) + '%;animation-delay:' + (i * -1.4) + 's'); }
  const rock = E.add('🪨🪨🪨', 'rs-rockwall'); await wait(300);
  await E.say('Oh no! A great wall of rocks blocks the tunnel!', 'narrator', 500);
  const bump = E.dino('tricera', -20, 54, 18, 'walk', 'orange');
  await E.moveTo(bump, 60, 54, 1800); FX.dinoState(bump.el, 'idle');
  await E.say('Hello! I am Bumper the baby Triceratops! The cave door opens when you play the crystal song.', 'bumper');
  const rounds = [3, 4, 5];
  for (let i = 0; i < rounds.length; i++) {
    await E.melody(KEYS, seqOf(rounds[i]), 'Now you play the crystal song!', 'penta');
    E.sfx.sparkle(); FX.celebrate && i === 2 && FX.celebrate();
    if (i < 2) await E.say(i === 0 ? 'The rocks are rumbling!' : 'The door is almost open!', 'bumper', 300);
  }
  rock.classList.add('open'); FX.shakeScreen(); E.sfx.roar();
  await E.say('RUMBLE! The rock wall slides away, and a bright light shines from the other side!', 'narrator', 600);
  await E.say('Can I come too? I am very good at bumping!', 'bumper');
  FX.dinoState(bump.el, 'happy');
  if (!E.save.party.includes('bumper')) E.save.party.push('bumper');
  E.addGems(4);
  await E.finishBadge('cave', '💎', 'Crystal Keeper', 'You lit the crystal cave and made a friend: Bumper the Triceratops!');
  E.save.next = Math.max(E.save.next, 4); writeSave(E.save);
}

// ================================================================= CHAPTER 5: river of fire
export async function chapter5(E) {
  E.setChapter(5, 'The River of Fire');
  E.scene('<div class="rs-sky" style="background:linear-gradient(#4a1e2d,#b5412c 60%,#ff9a3c)"></div><div class="rs-volcano"><i class="rs-vface"><b class="rs-eye l"></b><b class="rs-eye r"></b><b class="rs-mouth"></b></i><i class="rs-zzz">Z z z</i></div><div class="rs-lava"></div><div class="rs-bank l"></div><div class="rs-bank r"></div>', { ambient: 'volcano', music: 'lava' });
  await E.titleCard(4, 'The River of Fire', 'Hop across the stepping stones');
  const me = E.mount(5, 40, 17, 'idle'); me.style.zIndex = 4;
  await E.say('A river of bubbling lava! Only the safe stones will hold you. Watch which ones glow, then remember the path!', 'narrator', 600);
  E.hush();
  const COLS = [4, 5, 5], ROWS = 3, X0 = 23, DX = 13, Y0 = 44, DY = 17;
  for (let round = 0; round < COLS.length; round++) {
    const cols = COLS[round], safe = Array.from({ length: cols }, () => Math.floor(Math.random() * ROWS));
    const stones = [];
    for (let c = 0; c < cols; c++) for (let r = 0; r < ROWS; r++) { const s = E.add('<span>?</span>', 'rs-stone', 'left:' + (X0 + c * DX * (4 / (cols - .2 * (cols - 4)))) + '%;top:' + (Y0 + r * DY) + '%'); s.c = c; s.r = r; stones.push(s); }
    const xOf = (c) => X0 + c * DX * (4 / (cols - .2 * (cols - 4)));
    me.style.transition = 'none'; me.style.left = '5%'; me.style.top = (Y0 + safe[0] * 0 + 4) + '%';
    await E.say('Round ' + (round + 1) + ' of 3. Look at the glowing stones!', 'narrator', 300); E.hush();
    const show = async (ms) => { stones.forEach((s) => s.classList.toggle('glow', s.r === safe[s.c])); await wait(ms); stones.forEach((s) => s.classList.remove('glow')); };
    await show(2600 + cols * 280);
    let step = 0, busy = false;
    await new Promise((resolve) => {
      E.skip = () => resolve();
      stones.forEach((s) => s.addEventListener('click', async () => {
        if (busy || s.c !== step) return; busy = true;
        if (s.r === safe[s.c]) {
          s.classList.add('safe'); me.style.transition = 'left .5s, top .5s'; me.style.left = (xOf(s.c) - 2) + '%'; me.style.top = (Y0 + s.r * DY - 8) + '%';
          me.animate([{ translate: '0 0' }, { translate: '0 -40px' }, { translate: '0 0' }], { duration: 500 }); E.playNote(step * 2, 'major', .4, .16); await wait(520); step++; s.querySelector('span').textContent = '✓';
          if (step >= cols) { resolve(); return; }
        } else {
          s.classList.add('hot'); E.slip(); E.sfx.boing(); FX.noise && FX.noise(.4, .1, 0, 1200, 3000); s.querySelector('span').textContent = '🔥'; me.animate([{ translate: '0 0' }, { translate: '0 -30px' }, { translate: '0 0' }], { duration: 400 });
          await wait(650); s.classList.remove('hot'); s.querySelector('span').textContent = '?';
          if ((s.wrongs = (s.wrongs || 0) + 1) && stones.filter((t) => t.c === step).some((t) => t.wrongs >= 2)) { E.say('Hot hot hot! Look again…', 'narrator', 200); stones.filter((t) => t.c === step && t.r === safe[step])[0].classList.add('glow'); setTimeout(() => stones.forEach((t) => t.classList.remove('glow')), 1200); }
        }
        busy = false;
      }));
    });
    E.sfx.win(); stones.forEach((s) => s.remove()); E.addGems(2);
    if (round < 2) { me.style.transition = 'none'; me.style.left = '5%'; }
  }
  me.style.transition = 'left 1s'; me.style.left = '84%'; me.style.top = '38%'; await wait(1100);
  FX.dinoState(me.el, 'happy');
  await E.say('You are across! But look… the volcano is rumbling. Grumble the Volcano is wide awake and very grumpy!', 'narrator', 500);
  const v = E.world.querySelector('.rs-volcano'); v.classList.add('angry'); FX.shakeScreen(); E.sfx.roar();
  await E.say('I cannot sleep! The storm is too loud! Rumble rumble!', 'volcano');
  await E.say('Maybe a lullaby will help him sleep. Play the crystal song, softly!', 'narrator', 300);
  await E.melody(KEYS, seqOf(5), 'Play the sleepy lullaby!', 'penta');
  v.classList.remove('angry'); v.classList.add('asleep'); E.sfx.sparkle(); E.world.querySelector('.rs-lava').classList.add('calm');
  await E.say('Zzzzz… Grumble the volcano falls fast asleep. The lava turns calm and quiet.', 'narrator', 600);
  E.addGems(5);
  await E.finishBadge('lava', '🌋', 'Lava Hopper', 'You crossed the River of Fire and sang the volcano to sleep!');
  E.save.next = Math.max(E.save.next, 5); writeSave(E.save);
}

// ================================================================= CHAPTER 6: sky ride
export async function chapter6(E) {
  E.setChapter(6, 'The Sky Ride');
  E.scene('<canvas class="rs-cv" width="800" height="500"></canvas>', { ambient: 'wind', music: 'sky' });
  await E.titleCard(5, 'The Sky Ride', 'Fly up to the Sky Nest');
  await E.say('The Sky Nest is much too high to climb! Pip and the pterosaurs will fly you up there. Touch the screen to steer, collect golden rings and dodge the grumpy clouds!', 'narrator', 600);
  E.hush();
  await E.real('mountain', '🏔️', 'Dinosaur footprints are still found in rocks today.');
  const cv = E.world.querySelector('.rs-cv'), c = cv.getContext('2d'), W = 800, H = 500;
  const fly = E.dino('ptero', 12, 42, 24, 'run', 'pink'); fly.style.zIndex = 3; fly.style.transition = 'none';
  const rider = E.add('🧒', 'rs-rider', 'left:19%;top:36%'); rider.style.zIndex = 4;
  // The chip counts the golden rings the canvas draws, so it shows one made the same way: a
  // font circle has no gold, no tilt, and nothing to do with what the child is catching.
  const hud = E.add('<span class="rs-fly"><svg viewBox="0 0 24 24" width="1.05em" height="1.05em" aria-hidden="true" focusable="false" style="vertical-align:-0.14em"><ellipse cx="12" cy="12" rx="5.5" ry="9" fill="none" stroke="#ffd23f" stroke-width="3"/></svg> <b>0</b></span><div class="rs-prog"><i></i></div>', 'rs-hudbar');
  const S = { y: 250, ty: 250, t: 0, rings: 0, items: [], next: 1, stun: 0, over: false, dur: 48 };
  const move = (e) => { const r = E.area.getBoundingClientRect(); S.ty = Math.max(60, Math.min(440, (e.clientY - r.top) / r.height * H)); };
  E.area.addEventListener('pointermove', move); E.area.addEventListener('pointerdown', move);
  const onKey = (e) => { if (e.key === 'ArrowUp' || e.key === 'w') S.ty = Math.max(60, S.ty - 70); if (e.key === 'ArrowDown' || e.key === 's') S.ty = Math.min(440, S.ty + 70); };
  document.addEventListener('keydown', onKey);
  const puffs = Array.from({ length: 9 }, (_, i) => ({ x: i * 110, y: rnd(40, 460), s: rnd(.6, 1.6) }));
  let raf = 0, last = performance.now();
  await new Promise((resolve) => {
    const done = () => { if (S.over) return; S.over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); E.area.removeEventListener('pointermove', move); resolve(); };
    E.skip = () => { S.rings = Math.max(S.rings, 14); done(); };
    (function frame(now) {
      if (!E.alive || S.over) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; S.t += dt; S.stun = Math.max(0, S.stun - dt);
      S.y += (S.ty - S.y) * Math.min(1, dt * 6); fly.style.top = ((S.y - 60) / H * 100) + '%'; rider.style.top = ((S.y - 90) / H * 100) + '%';
      S.next -= dt;
      if (S.next <= 0 && S.t < S.dur - 4) { S.next = rnd(.45, .9); const y = rnd(80, 430); if (Math.random() < .62) { S.items.push({ x: 860, y, k: 'ring' }); if (Math.random() < .5) S.items.push({ x: 940, y: y + rnd(-40, 40), k: 'ring' }); } else S.items.push({ x: 860, y, k: 'cloud', r: rnd(36, 58) }); }
      const spd = S.stun > 0 ? 190 : 300;
      for (const it of S.items) {
        it.x -= spd * dt; const dx = it.x - 170, dy = it.y - S.y;
        if (!it.hit && Math.abs(dx) < (it.k === 'ring' ? 40 : 54) && Math.abs(dy) < (it.k === 'ring' ? 54 : 62)) {
          it.hit = true;
          if (it.k === 'ring') { S.rings++; hud.querySelector('b').textContent = S.rings; E.sfx.sparkle(); const r = fly.getBoundingClientRect(); FX.burst(r.left + r.width * .6, r.top + r.height / 2, { kind: 'sparkle', n: 14, color: '#ffe14d' }); }
          else { S.stun = 1; E.slip(); E.sfx.boing(); FX.shakeScreen(); FX.dinoState(fly.el, 'sad', 600); setTimeout(() => FX.dinoState(fly.el, 'run'), 700); }
        }
      }
      S.items = S.items.filter((it) => it.x > -120);
      hud.querySelector('.rs-prog i').style.width = Math.min(100, S.t / S.dur * 100) + '%';
      const k = Math.min(1, S.t / S.dur), mix = (a, b) => Math.round(a + (b - a) * k);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgb(' + mix(40, 120) + ',' + mix(60, 190) + ',' + mix(110, 245) + ')'); g.addColorStop(1, 'rgb(' + mix(255, 255) + ',' + mix(150, 230) + ',' + mix(120, 190) + ')'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (const p of puffs) { p.x -= spd * dt * .4 * p.s; if (p.x < -120) { p.x = W + 80; p.y = rnd(30, 470); } c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(p.x, p.y, 70 * p.s, 22 * p.s, 0, 0, 6.3); c.ellipse(p.x + 30 * p.s, p.y - 14 * p.s, 40 * p.s, 20 * p.s, 0, 0, 6.3); c.fill(); }
      c.fillStyle = 'rgba(40,70,90,.5)'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 50) c.lineTo(x, H - 50 - 38 * Math.sin((x + S.t * 80) / 90)); c.lineTo(W, H); c.fill();
      drawEnvironment(c,W,H,'mountain',S.t*.03);
      for (const it of S.items) {
        if (it.hit) continue;
        if (it.k === 'ring') { c.strokeStyle = '#ffd23f'; c.lineWidth = 8; c.shadowColor = '#fff2a8'; c.shadowBlur = 16; c.beginPath(); c.ellipse(it.x, it.y, 20, 36, 0, 0, 6.3); c.stroke(); c.shadowBlur = 0; }
        else {
          c.fillStyle = '#56607a'; c.beginPath(); c.ellipse(it.x, it.y, it.r * 1.4, it.r * .8, 0, 0, 6.3); c.ellipse(it.x - it.r * .6, it.y - it.r * .5, it.r * .8, it.r * .6, 0, 0, 6.3); c.ellipse(it.x + it.r * .5, it.y - it.r * .5, it.r * .7, it.r * .55, 0, 0, 6.3); c.fill();
          // Pixels inside a canvas are beyond every DOM walker, so a glyph typed here is
          // whatever the operating system's font calls "angry". Grumpy's face is drawn with
          // the same strokes as his body and is the same face on every device.
          c.strokeStyle = c.fillStyle = '#2b2f45'; c.lineCap = 'round'; c.lineWidth = Math.max(2, it.r * .13);
          for (const sx of [-1, 1]) {
            c.beginPath(); c.arc(it.x + sx * it.r * .42, it.y - it.r * .02, it.r * .11, 0, 6.3); c.fill();
            c.beginPath(); c.moveTo(it.x + sx * it.r * .72, it.y - it.r * .44); c.lineTo(it.x + sx * it.r * .18, it.y - it.r * .2); c.stroke();
          }
          c.beginPath(); c.arc(it.x, it.y + it.r * .62, it.r * .3, Math.PI, 0); c.stroke();
        }
      }
      if (S.t > S.dur - 7) { const p = (S.t - (S.dur - 7)) / 7; c.fillStyle = 'rgba(25,25,45,' + (p * .85) + ')'; c.beginPath(); c.ellipse(W - 40 + (1 - p) * 300, 250, 220 * p + 20, 300, 0, 0, 6.3); c.fill(); if (Math.random() < .03) { c.fillStyle = 'rgba(255,255,200,.4)'; c.fillRect(0, 0, W, H); FX.sfx.drum(); } }
      if (S.t >= S.dur) { done(); return; }
      raf = requestAnimationFrame(frame);
    })(last);
  });
  hud.remove(); rider.remove(); fly.remove();
  await E.say('Straight ahead there is a huge dark cloud, crackling with lightning. That is Grumblecloud!', 'pip', 600);
  E.addGems(Math.max(3, S.rings));
  await E.finishBadge('sky', '☁️', 'Sky Rider', 'You flew through the clouds with ' + S.rings + ' golden rings! The Sky Nest is just ahead!');
  E.save.next = Math.max(E.save.next, 6); writeSave(E.save);
}

// ================================================================= CHAPTER 7: Grumblecloud and the rescue
export async function chapter7(E) {
  E.setChapter(7, 'Grumblecloud’s Peak');
  E.scene('<div class="rs-sky" style="background:linear-gradient(#1c1a3a,#4a3a6a 70%,#7a6a95)"></div><div class="rs-storm big"><i></i><i></i><i></i></div><div class="rs-flash"></div>' +
    '<div class="rs-cliff"></div><div class="rs-grumble"><i class="rs-gf"><b class="rs-eye l"></b><b class="rs-eye r"></b><b class="rs-mouth"></b></i></div>' +
    '<div class="rs-nest"><span class="rs-cage"></span></div>', { ambient: 'storm', music: 'storm' });
  await E.titleCard(6, 'Grumblecloud’s Peak', 'The final rescue');
  const me = E.mount(12, 56, 20, 'idle'); me.style.zIndex = 4;
  const mum = E.person('mummy', 70, 30, .66, 'panic'), dad = E.person('daddy', 81, 28, .66, 'panic'); mum.style.zIndex = 3; dad.style.zIndex = 3;
  const grumble = E.world.querySelector('.rs-grumble'), flash = E.world.querySelector('.rs-flash');
  await E.say('Mummy and Daddy are in the Sky Nest, trapped behind a cage of thorny vines!', 'narrator', 600);
  await E.say(kidName(E) ? kidName(E).toUpperCase() + '! Be careful! The storm is angry!' : 'Be careful, little one! The storm is angry!', 'mummy');
  await E.say('You can do it, my brave dino rider!', 'daddy');
  grumble.classList.add('roar'); E.sfx.roar(); FX.shakeScreen();
  await E.say('RUMBLE GRUMBLE! Nobody gets past Grumblecloud! I am too grumpy and my tummy is empty!', 'grumble');
  E.hush();

  // phase 1: dodge the lightning
  await E.say('Phase one: dodge the lightning! Slide your dinosaur left and right to get out of the way.', 'narrator', 500); E.hush();
  const lanes = [22, 42, 62]; let lane = 1; const move = (d) => { lane = Math.max(0, Math.min(2, lane + d)); me.style.transition = 'left .18s'; me.style.left = (lanes[lane] - 10) + '%'; };
  me.style.left = (lanes[1] - 10) + '%';
  const ctrls = E.add('<button data-d="-1">◀</button><button data-d="1">▶</button>', 'rs-ctrls');
  ctrls.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); move(Number(b.dataset.d)); E.sfx.whoosh(); }));
  const onKey = (e) => { if (e.key === 'ArrowLeft' || e.key === 'a') move(-1); if (e.key === 'ArrowRight' || e.key === 'd') move(1); }; document.addEventListener('keydown', onKey);
  let dodged = 0, strikes = 7, stop = false;
  E.skip = () => { stop = true; };
  for (let i = 0; i < strikes && !stop && E.alive; i++) {
    const l = Math.floor(Math.random() * 3), mark = E.add('', 'rs-mark', 'left:' + lanes[l] + '%;top:80%');
    E.sfx.tap(); await wait(1100);
    flash.animate([{ opacity: 0 }, { opacity: .9 }, { opacity: 0 }], { duration: 350 }); E.sfx.drum(); FX.shakeScreen();
    const bolt = E.add('⚡', 'rs-bolt', 'left:' + lanes[l] + '%'); setTimeout(() => bolt.remove(), 500);
    if (l === lane) { E.slip(); FX.dinoState(me.el, 'sad', 600); E.sfx.boing(); setTimeout(() => FX.dinoState(me.el, 'idle'), 700); } else { dodged++; }
    mark.remove(); await wait(450);
  }
  document.removeEventListener('keydown', onKey); ctrls.remove(); stop = false;
  FX.dinoState(me.el, 'happy'); E.addGems(dodged);
  await E.say('You dodged ' + dodged + ' lightning bolts! Grumblecloud is out of breath.', 'narrator', 500);

  // phase 2: feed it
  await E.say('Grumblecloud is only grumpy because it is hungry! Tap the juicy berries to throw them up to its mouth!', 'narrator', 500); E.hush();
  // family-ok: a mouthful of berries is density, not a menu — Grumblecloud is
  // hungry, and the child is throwing everything up at it, not choosing.
  await E.tapAll([[20, 30, '🍓'], [34, 18, '🍇'], [48, 34, '🍓'], [60, 20, '🍒'], [28, 48, '🍇'], [52, 52, '🍓']], 'berry', (i, el) => { FX.flyTo && FX.flyTo(el, grumble, { emoji: ['🍓', '🍇', '🍓', '🍒', '🍇', '🍓'][i] }); E.sfx.chomp && E.sfx.chomp(); grumble.classList.add('munch'); setTimeout(() => grumble.classList.remove('munch'), 400); });
  grumble.classList.remove('roar'); grumble.classList.add('soft');
  await E.say('Yum yum! Hee hee! That was delicious! I feel much better. But I am still a bit sleepy and cross…', 'grumble');

  // phase 3: lullaby
  await E.say('Let’s sing Grumblecloud a lullaby so that it can rest.', 'narrator', 400);
  await E.melody(KEYS, seqOf(5), 'Play the storm lullaby!', 'penta');
  grumble.classList.add('sleep'); E.world.querySelector('.rs-storm').classList.add('clear'); E.sfx.win();
  E.world.querySelector('.rs-sky').style.background = 'linear-gradient(#ffb36b,#ffe3a5 60%,#bfe3ff)';
  E.world.querySelector('.rs-sky').style.transition = 'background 3s';
  FX.ambient && FX.ambient('rainbow'); E.music('sky');
  await E.say('Zzzz… The storm cloud floats gently away, the sun comes out, and a beautiful rainbow shines over the mountain!', 'narrator', 800);

  // phase 4: free the parents
  await E.say('Quick! Cut the thorny vines to free Mummy and Daddy! Tap every vine.', 'narrator', 400); E.hush();
  FX.personState(mum.el, 'idle'); FX.personState(dad.el, 'idle');
  await E.tapAll([[70, 30, '🌿'], [76, 40, '🌿'], [82, 28, '🌿'], [88, 42, '🌿'], [72, 54, '🌿'], [80, 56, '🌿'], [90, 54, '🌿'], [78, 20, '🌿']], 'vine');
  E.world.querySelector('.rs-cage').classList.add('open'); E.sfx.roar(); FX.celebrate(); E.music('joy');
  FX.personState(mum.el, 'happy'); FX.personState(dad.el, 'happy');
  await E.say('THE CAGE IS OPEN! Mummy and Daddy are free!', 'narrator', 500);
  await E.walk(mum, 40, 36, 1500); E.moveTo(dad, 29, 34, 1500); await wait(1500);
  FX.personState(mum.el, 'happy'); FX.personState(dad.el, 'happy');
  await E.say((kidName(E) ? kidName(E).toUpperCase() + '! ' : '') + 'You came all this way to save us! Oh, my brave, brave explorer!', 'mummy', 600);
  await E.say('That was the best rescue ever! You are a real Dino Rider!', 'daddy', 600);
  await E.say('I love you both. Let’s go home!', 'child', 500);
  for (let i = 0; i < 5; i++) { const r = E.area.getBoundingClientRect(); FX.burst(r.left + r.width * (.2 + i * .15), r.top + r.height * .45, { kind: 'hearts', n: 8 }); await wait(250); }
  // the party
  E.hush();
  const party = [['bronto', 'blue', 4], ['stego', 'teal', 20], ['raptor', 'purple', 36], ['tricera', 'orange', 52], ['trex', 'green', 68], ['ptero', 'pink', 82]];
  party.forEach(([sp, col, x], i) => { const d = E.dino(sp, x, 70 + (i % 2) * 6, 14, 'happy', col); d.style.zIndex = 5; });
  await sing(E, 'We Saved The Day!', [
    { words: ['We', 'rode', 'across', 'the', 'forest', 'wide,'], notes: [4, 4, 5, 7, 5, 4], beat: 340 },
    { words: ['We', 'sang', 'the', 'volcano', 'to', 'sleep,'], notes: [4, 5, 7, 9, 7, 5], beat: 340 },
    { words: ['Mummy', 'and', 'Daddy', 'by', 'our', 'side,'], notes: [7, 7, 9, 7, 5, 4], beat: 340 },
    { words: ['Hooray', 'for', (kidName(E) || 'you') + ',', 'the', 'dino', 'star!'], notes: [9, 7, 9, 12, 9, 7], beat: 380 },
  ]);
  E.addGems(10);
  E.save.won += 1; E.save.next = 7; writeSave(E.save);
  // A crown is metalwork this universe never had; the app's own drawn trophy is the one mark
  // that says "top of the seven chapters" in the same ink as the buttons around it.
  await E.finishBadge('hero', window.DUICONS.i('trophy', { size: 74 }), 'Hero Dino Rider!', 'You rescued Mummy and Daddy from Grumblecloud’s Peak. The whole dino world is cheering!');
}
import { drawEnvironment } from '../../../../../photoreal-environments.js?v=du-276e018775e133bb';
