// Chapters 1–3 of The Great Dino Rescue: The Call, the Whispering Forest, the Rickety Bridge.
import { wait, rnd, tile, MOUNTS, writeSave } from './engine.js';
const FX = window.DUFX;

const HILLS = tile('<path d="M0 100 L0 60 Q50 10 100 55 T200 50 T300 58 T400 60 L400 100Z" fill="#9ed7a6"/>', 400, 100);
const PINES = tile('<g fill="#2f7d57"><path d="M30 100 L55 20 L80 100Z"/><path d="M110 100 L140 10 L170 100Z"/><path d="M200 100 L222 30 L244 100Z"/><path d="M280 100 L310 15 L340 100Z"/><path d="M350 100 L372 36 L394 100Z"/></g>', 400, 100);
const GRASS = tile('<rect y="30" width="400" height="70" fill="#6fc36f"/><g fill="#52a857"><path d="M20 30 l4 -16 l4 16Z M120 30 l4 -20 l4 20Z M230 30 l4 -14 l4 14Z M330 30 l4 -18 l4 18Z"/></g><g><circle cx="70" cy="48" r="4" fill="#ffd23f"/><circle cx="190" cy="52" r="4" fill="#ff7aa8"/><circle cx="300" cy="46" r="4" fill="#fff"/></g>', 400, 100);
const par = (img, cls) => '<div class="rs-par ' + cls + '" style="background-image:' + img + '"></div>';

// A sing-along: every line has words and one note per word; the current word lights up.
export async function sing(E, title, lines, scale) {
  const box = E.add('<h3>🎵 ' + title + '</h3>' + lines.map((l, i) => '<p data-l="' + i + '">' + l.words.map((w) => '<span>' + w + '</span>').join(' ') + '</p>').join(''), 'rs-song');
  let skipped = false; box.addEventListener('pointerdown', () => { skipped = true; });
  await wait(500);
  for (let i = 0; i < lines.length && E.alive && !skipped; i++) {
    const spans = [...box.querySelectorAll('p[data-l="' + i + '"] span')];
    box.querySelector('p[data-l="' + i + '"]').classList.add('now');
    for (let w = 0; w < spans.length && !skipped; w++) {
      spans[w].classList.add('on'); E.playNote(lines[i].notes[w], scale || 'major', .5, .16, 'triangle'); await wait(lines[i].beat || 430);
    }
    box.querySelector('p[data-l="' + i + '"]').classList.remove('now'); await wait(160);
  }
  box.classList.add('out'); await wait(500); box.remove();
}
export const RIDER_SONG = [
  { words: ['Ride,', 'ride,', 'dino', 'ride!'], notes: [4, 4, 5, 7], beat: 380 },
  { words: ['Over', 'hill', 'and', 'mountain', 'wide!'], notes: [7, 5, 4, 5, 7], beat: 360 },
  { words: ['Mummy,', 'Daddy,', 'hold', 'on', 'tight,'], notes: [4, 2, 4, 5, 4], beat: 380 },
  { words: ['We', 'are', 'coming', 'through', 'the', 'night!'], notes: [2, 2, 4, 5, 7, 9], beat: 360 },
];

// ================================================================= CHAPTER 1
export async function chapter1(E) {
  E.setChapter(1, 'The Call');
  E.scene('<div class="rs-sky" style="background:linear-gradient(#ff9a62,#ffd49a 55%,#ffe9bf)"></div><div class="rs-sun set"></div>' +
    '<i class="rs-cloud" style="top:12%;--w:110px"></i><i class="rs-cloud" style="top:24%;--w:70px;animation-delay:-20s"></i>' +
    par(HILLS, 'far') + par(HILLS, 'mid dim') +
    '<svg class="rs-house" viewBox="0 0 220 180"><rect x="30" y="80" width="150" height="90" rx="6" fill="#fff3d6" stroke="#b9895a" stroke-width="5"/><path d="M14 86 L105 14 L196 86Z" fill="#d6604d" stroke="#8c3a2c" stroke-width="5" stroke-linejoin="round"/><rect x="90" y="115" width="34" height="55" rx="4" fill="#8f5d3b"/><rect x="44" y="100" width="32" height="30" fill="#aee1f5" stroke="#b9895a" stroke-width="4"/><rect x="138" y="100" width="32" height="30" fill="#ffe27a" stroke="#b9895a" stroke-width="4"/><rect x="140" y="20" width="22" height="40" fill="#b9895a"/></svg>' +
    par(GRASS, 'near') + '<div class="rs-storm"><i></i><i></i><i></i></div><div class="rs-flash"></div>', { ambient: 'meadow', music: 'home', cls: 'dusk' });
  E.hush();
  await E.titleCard(0, 'The Great Dino Rescue', 'A quest for Grayson');
  const mum = E.person('courtney', 38, 34, .72, 'idle'), dad = E.person('daddy', 50, 32, .72, 'idle');
  await E.say('One golden evening, Mummy and Daddy packed a picnic basket to take up to the Sky Nest, high on Mount Roar.');
  FX.personState(mum.el, 'wave'); FX.personState(dad.el, 'wave');
  await E.say('Bye bye, Grayson! We will be back before bedtime!', 'mummy');
  await E.say('Look after the dinosaurs for us, Grayson!', 'daddy');
  FX.personState(mum.el, 'walk'); FX.personState(dad.el, 'walk');
  await E.walk(mum, 112, 34, 5200 / 2); E.moveTo(dad, 112, 32, 2600);
  await wait(2600);
  mum.remove(); dad.remove();
  // the storm
  E.world.classList.add('stormy'); E.sfx.roar(); FX.shakeScreen();
  await E.say('But then… the sky turned dark. A huge, grumbly storm cloud swallowed the whole mountain!', 'narrator', 500);
  for (let i = 0; i < 3; i++) { E.world.querySelector('.rs-flash').animate([{ opacity: 0 }, { opacity: .9 }, { opacity: 0 }], { duration: 450 }); FX.sfx.drum(); await wait(700); }
  const pip = E.dino('ptero', -20, 22, 22, 'idle', 'pink');
  await E.moveTo(pip, 52, 30, 1500); FX.dinoState(pip.el, 'happy');
  await E.say('Grayson! Grayson! It is me, Pip the pterosaur!', 'pip');
  await E.say('Grumblecloud the storm has trapped Mummy and Daddy at the Sky Nest! Only a brave dino rider can reach them!', 'pip');
  await E.say('Will you save them?', 'pip', 400);
  const go = await E.choose('Will you save Mummy and Daddy?', [{ icon: '🦖', label: 'YES! Let’s go!' }, { icon: '💪', label: 'I am brave, I will!' }]);
  E.sfx.roar();
  // choose a dinosaur to ride
  const pick = await new Promise((resolve) => {
    const box = E.add('<h3>Choose your dinosaur to ride!</h3><div class="rs-mounts">' + MOUNTS.map((m, i) => '<button data-i="' + i + '"><span>' + FX.dinoHTML(m.id, { state: 'idle', color: m.color }) + '</span><b>' + m.name + '</b><small>' + m.blurb + '</small></button>').join('') + '</div>', 'rs-pick');
    box.querySelectorAll('button').forEach((b) => { b.addEventListener('pointerenter', () => FX.dinoState(b.querySelector('.du-dino'), 'roar', 700)); b.addEventListener('click', () => { E.sfx.roar(); box.remove(); resolve(MOUNTS[Number(b.dataset.i)]); }); });
    E.skip = () => { box.remove(); resolve(MOUNTS[0]); };
  });
  E.save.mount = pick.id; writeSave(E.save);
  pip.remove();
  const me = E.mount(30, 50, 26, 'happy');
  await E.say(pick.name + ' roars and lowers a big friendly head. Grayson climbs on, ready to ride!', 'narrator', 600);
  FX.dinoState(me.el, 'roar', 900); E.sfx.roar(); FX.celebrate();
  await sing(E, 'The Dino Riders Song', RIDER_SONG);
  await E.finishBadge('rider', '🏇', 'Dino Rider!', 'You chose ' + pick.name + ' and set out to rescue Mummy and Daddy.');
  E.save.next = Math.max(E.save.next, 1); writeSave(E.save);
}

// ================================================================= CHAPTER 2: forest runner
export async function chapter2(E) {
  E.setChapter(2, 'The Whispering Forest');
  E.scene('<div class="rs-sky" style="background:linear-gradient(#274c63,#4b7f6a 60%,#8bb88a)"></div><canvas class="rs-cv" width="800" height="500"></canvas>', { ambient: 'night', music: 'forest' });
  await E.titleCard(1, 'The Whispering Forest', 'Follow the glowing fireflies');
  await E.say('The Whispering Forest is dark and tall. Ride through it and catch the glowing fireflies, but steer around the logs!', 'narrator', 600);
  E.hush();
  const cv = E.world.querySelector('.rs-cv'), c = cv.getContext('2d'), W = 800, H = 500, HOR = 150;
  const FX_ = FX;
  const ride = E.mount(34, 60, 24, 'run');
  ride.style.transition = 'left .18s ease-out'; ride.style.zIndex = 3;
  const hud = E.add('<span class="rs-fly">✨ <b>0</b></span><div class="rs-prog"><i></i></div>', 'rs-hudbar');
  const ctrls = E.add('<button data-d="-1" aria-label="Left">◀</button><button data-d="1" aria-label="Right">▶</button>', 'rs-ctrls');
  const S = { lane: 1, items: [], t: 0, got: 0, stumble: 0, next: 1, over: false, dur: 52 };
  E.world._run = S;
  const laneLeft = (l) => 17 + l * 29;
  const setLane = (d) => { const n = Math.max(0, Math.min(2, S.lane + d)); if (n !== S.lane) { S.lane = n; E.sfx.whoosh(); ride.style.left = laneLeft(n) + '%'; } };
  ride.style.left = laneLeft(1) + '%';
  ctrls.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); setLane(Number(b.dataset.d)); }));
  const onKey = (e) => { if (e.key === 'ArrowLeft' || e.key === 'a') setLane(-1); if (e.key === 'ArrowRight' || e.key === 'd') setLane(1); };
  document.addEventListener('keydown', onKey);
  E.world.addEventListener('pointerdown', (e) => { if (e.target.closest('.rs-ctrls')) return; const r = E.area.getBoundingClientRect(); setLane((e.clientX - r.left) / r.width < .5 ? -1 : 1); });
  const zt = (z) => Math.pow(z, 1.7), proj = (z, l) => { const t = zt(z), sp = 36 + t * 200; return { x: W / 2 + (l - 1) * sp, y: HOR + (H - 60 - HOR) * t, s: .12 + t * .95 }; };
  const flies = Array.from({ length: 26 }, () => ({ x: rnd(0, W), y: rnd(60, 330), p: rnd(0, 6.3) }));
  let raf = 0, last = performance.now();
  await new Promise((resolve) => {
    const done = () => { if (S.over) return; S.over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); resolve(); };
    E.skip = () => { S.got = Math.max(S.got, 12); done(); };
    function frame(now) {
      if (!E.alive || S.over) { cancelAnimationFrame(raf); return; }
      const dt = Math.min(.05, (now - last) / 1000); last = now; S.t += dt; S.stumble = Math.max(0, S.stumble - dt);
      const sp = (S.stumble > 0 ? .25 : .42);
      S.next -= dt; if (S.next <= 0) { S.next = rnd(.55, 1.0); const lane = Math.floor(Math.random() * 3), good = Math.random() < .68; S.items.push({ z: 0, lane, kind: good ? 'fly' : 'log', ic: good ? '✨' : (Math.random() < .5 ? '🪵' : '🪨') }); if (good && Math.random() < .3) S.items.push({ z: -.12, lane: (lane + 1) % 3, kind: 'fly', ic: '✨' }); }
      for (const it of S.items) {
        it.z += sp * dt * (.4 + it.z * 1.6);
        if (!it.hit && it.z > .86 && it.z < 1.0 && it.lane === S.lane) {
          it.hit = true;
          if (it.kind === 'fly') { S.got++; hud.querySelector('b').textContent = S.got; const r = ride.getBoundingClientRect(); FX_.burst(r.left + r.width / 2, r.top, { kind: 'sparkle', n: 14, color: '#fff2a8' }); E.sfx.sparkle(); }
          else { S.stumble = 1.1; E.sfx.boing(); FX_.shakeScreen(); FX_.dinoState(ride.el, 'sad', 600); setTimeout(() => FX_.dinoState(ride.el, 'run'), 700); }
        }
      }
      S.items = S.items.filter((it) => it.z < 1.15);
      hud.querySelector('.rs-prog i').style.width = Math.min(100, S.t / S.dur * 100) + '%';
      // draw
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d3c55'); g.addColorStop(.35, '#3d6e6a'); g.addColorStop(1, '#79b085'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 24; i++) c.fillRect((i * 71 + 13) % W, (i * 37) % 120, 2, 2);
      c.fillStyle = '#3c7a63'; c.fillRect(0, HOR - 6, W, H);
      c.fillStyle = '#7a6a4a'; c.beginPath(); c.moveTo(W / 2 - 36, HOR); c.lineTo(W / 2 + 36, HOR); c.lineTo(W / 2 + 330, H); c.lineTo(W / 2 - 330, H); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,240,200,.35)'; c.lineWidth = 4; for (let k = 0; k < 9; k++) { const z = ((k / 9 + S.t * .5) % 1), p0 = proj(z, 1); c.beginPath(); c.moveTo(W / 2 - 36 - zt(z) * 290 + 36, p0.y); c.lineTo(W / 2 + 36 + zt(z) * 290 - 36, p0.y); c.stroke(); }
      for (let k = 0; k < 12; k++) { const z = ((k / 12 + S.t * .5) % 1); for (const side of [-1.9, 3.9]) { const p = proj(z, side + (k % 2) * (side < 0 ? -.5 : .5)); c.font = Math.round(110 * p.s) + 'px serif'; c.textAlign = 'center'; c.fillText(k % 3 ? '🌲' : '🌳', p.x, p.y); } }
      for (const f of flies) { f.p += dt * 2; c.fillStyle = 'rgba(255,240,150,' + (.4 + .5 * Math.sin(f.p)) + ')'; c.beginPath(); c.arc(f.x + Math.sin(f.p * .7) * 14, f.y + Math.cos(f.p * .5) * 10, 2.4, 0, 6.3); c.fill(); }
      for (const it of S.items.slice().sort((a, b) => a.z - b.z)) { if (it.hit || it.z < 0) continue; const p = proj(it.z, it.lane); c.font = Math.round(70 * p.s) + 'px serif'; c.textAlign = 'center'; if (it.kind === 'fly') { c.shadowColor = '#fff2a8'; c.shadowBlur = 22 * p.s; } c.fillText(it.ic, p.x, p.y); c.shadowBlur = 0; }
      if (S.t >= S.dur) { done(); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  });
  hud.remove(); ctrls.remove(); FX.dinoState(ride.el, 'idle');
  await E.say('You made it out of the dark trees! You caught ' + S.got + ' fireflies!', 'narrator', 500);
  E.addGems(Math.max(3, S.got));
  // the owl
  const owl = E.add('🦉', 'rs-owl', 'left:68%;top:14%');
  FX.dinoState(ride.el, 'idle');
  await E.say('Whoo-whoo! Stop, little rider! I am Wise Owl. Answer my riddle to pass.', 'owl');
  await E.say('I have three big toes. I stomp. I roar. And I am the king of the dinosaurs. Who am I?', 'owl', 300);
  let ok = false;
  while (!ok) {
    const a = await E.choose('Who is the king of the dinosaurs?', [{ icon: '🦆', label: 'A duck' }, { icon: '🦖', label: 'T-rex' }, { icon: '🐟', label: 'A fish' }]);
    if (a === 1) ok = true; else await E.say(a === 0 ? 'Quack? No, no! Think of the big roar!' : 'Glub glub! That is not a stomper. Try again!', 'owl');
  }
  E.sfx.win(); FX.celebrate();
  await E.say('Whoo-hoo! Correct! Take Pip with you. Pip knows the sky paths!', 'owl');
  if (!E.save.party.includes('pip')) E.save.party.push('pip');
  owl.remove();
  await E.finishBadge('forest', '🌲', 'Forest Explorer', 'You rode through the Whispering Forest and Pip the pterosaur joined your team!');
  E.save.next = Math.max(E.save.next, 2); writeSave(E.save);
}

// ================================================================= CHAPTER 3: rope bridge rhythm
export async function chapter3(E) {
  E.setChapter(3, 'The Rickety Bridge');
  E.scene('<div class="rs-sky" style="background:linear-gradient(#7fd0f0,#fbe7c0)"></div><i class="rs-cloud" style="top:10%;--w:100px"></i>' +
    '<svg class="rs-canyon" viewBox="0 0 800 500" preserveAspectRatio="none"><path d="M0 500V230L120 190 190 260 230 500Z" fill="#b5794f"/><path d="M800 500V220L690 180 610 250 570 500Z" fill="#b5794f"/><path d="M230 500L190 260 120 190 0 230V320L150 340 250 500Z" fill="#9a6340"/><path d="M570 500L610 250 690 180 800 220V320L650 340 550 500Z" fill="#9a6340"/><path d="M230 500H570V470Q400 430 230 470Z" fill="#3f8ad0"/></svg>' +
    '<div class="rs-bridge"><i></i></div>', { ambient: 'wind', music: null });
  E.stopMusic();
  await E.titleCard(2, 'The Rickety Bridge', 'Stomp in time to cross');
  await E.say('A wobbly rope bridge hangs over a deep canyon! Stomp on the glowing planks as they reach your dinosaur, in time with the music.', 'narrator', 600);
  E.hush();
  const me = E.mount(8, 40, 22, 'walk'); me.style.zIndex = 3;
  const hit = E.add('', 'rs-hitzone', 'left:22%;top:63%');
  const bar = E.add('<span class="rs-judge"></span><span class="rs-combo">0 / 16</span>', 'rs-hudbar rs-rhythm');
  const btn = E.add('🦶 STOMP!', 'rs-stomp'); btn.setAttribute('role', 'button');
  const TRAVEL = 2200, BEAT = 600;
  const tune = [0, 0, 4, 4, 5, 5, 4, null, 3, 3, 2, 2, 1, 1, 0, null].map((d, i) => ({ d, T: 3000 + i * BEAT }));
  const notes = tune.filter((n) => n.d != null).map((n) => ({ ...n, el: null, state: 0 }));
  const t0 = performance.now(); let hits = 0, raf = 0, over = false, lastBeat = -1;
  const judge = bar.querySelector('.rs-judge'), combo = bar.querySelector('.rs-combo');
  function stomp() {
    const now = performance.now() - t0; FX.dinoState(me.el, 'happy', 300); me.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-26px)' }, { transform: 'translateY(0)' }], { duration: 300 });
    let best = null, bd = 1e9; for (const n of notes) { if (n.state) continue; const d = Math.abs(n.T - now); if (d < bd) { bd = d; best = n; } }
    if (best && bd < 300) { best.state = 1; hits++; combo.textContent = hits + ' / ' + notes.length; E.playNote(best.d, 'major', .6, .2, 'triangle'); best.el.classList.add('hit'); judge.textContent = bd < 120 ? 'Perfect! ⭐' : 'Good!'; judge.classList.remove('pop'); void judge.offsetWidth; judge.classList.add('pop'); const r = hit.getBoundingClientRect(); FX.burst(r.left + 20, r.top + 10, { kind: 'sparkle', n: 10 }); }
    else { E.sfx.tap(); }
  }
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); stomp(); });
  const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stomp(); } }; document.addEventListener('keydown', onKey);
  for (const n of notes) { n.el = E.add('', 'rs-plank', 'left:110%;top:63%'); }
  await new Promise((resolve) => {
    const finish = () => { if (over) return; over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); resolve(); };
    E.skip = () => { hits = Math.max(hits, 12); finish(); };
    (function frame() {
      if (!E.alive || over) return;
      const now = performance.now() - t0, beatIdx = Math.floor(now / BEAT);
      if (beatIdx !== lastBeat && now > 1200) { lastBeat = beatIdx; FX.tone && FX.tone(110, .3, 'sine', .08); if (beatIdx % 2) FX.noise && FX.noise(.04, .02, 0, 6000, 8000); }
      for (const n of notes) { const x = 22 + (n.T - now) / TRAVEL * 80; n.el.style.left = x + '%'; if (!n.state && now > n.T + 300) { n.state = -1; n.el.classList.add('miss'); me.animate([{ rotate: '0deg' }, { rotate: '-4deg' }, { rotate: '4deg' }, { rotate: '0deg' }], { duration: 400 }); } }
      const progress = Math.min(1, now / (tune[tune.length - 1].T + 600)); me.style.left = (8 + progress * 60) + '%';
      if (now > tune[tune.length - 1].T + 1600) { finish(); return; }
      raf = requestAnimationFrame(frame);
    })();
  });
  [hit, bar, btn, ...notes.map((n) => n.el)].forEach((e) => e.remove());
  FX.dinoState(me.el, 'happy');
  const stars = hits >= 13 ? 3 : hits >= 9 ? 2 : 1;
  await E.say(hits >= 13 ? 'Wow! You stomped almost every plank. What a rhythm!' : hits >= 9 ? 'Great stomping! The bridge held steady.' : 'The bridge wobbled, but you crossed safely!', 'narrator', 500);
  E.addGems(Math.max(3, hits));
  await E.card({ tag: 'BRIDGE CROSSED', icon: '⭐'.repeat(stars), title: hits + ' of ' + notes.length + ' planks', body: 'You crossed the canyon!' });
  await E.finishBadge('bridge', '🌉', 'Bridge Master', 'You crossed the rickety bridge with a stomping beat!');
  E.save.next = Math.max(E.save.next, 3); writeSave(E.save);
}
