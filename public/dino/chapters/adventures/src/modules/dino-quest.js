// Dino Quest: The Lost Egg of Mount Roar.
// A little story journey: a dinosaur friend finds a lost egg, walks through a meadow, climbs a mountain,
// spots a cave across the valley, explores it with a torch, and takes the egg home to its mother.
// Optional real photos/videos for the "real dinosaur moment" cards come from assets/real/manifest.json.
const FX = window.DUFX;
const DINOS = [
  { id: 'raptor', name: 'Velociraptor' }, { id: 'trex', name: 'T-rex' }, { id: 'tricera', name: 'Triceratops' },
  { id: 'stego', name: 'Stegosaurus' }, { id: 'bronto', name: 'Brontosaurus' },
];
const tile = (svg, w, h) => "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + svg + '</svg>') + "')";
const HILLS = tile('<path d="M0 100 L0 60 Q50 10 100 55 T200 50 T300 58 T400 60 L400 100Z" fill="#9ed7a6"/>', 400, 100);
const TREES = tile('<g fill="#3f9a62"><circle cx="40" cy="60" r="26"/><circle cx="150" cy="56" r="32"/><circle cx="270" cy="62" r="24"/><circle cx="350" cy="58" r="28"/></g><g fill="#7a5233"><rect x="37" y="80" width="6" height="20"/><rect x="146" y="82" width="8" height="18"/><rect x="267" y="82" width="6" height="18"/><rect x="346" y="82" width="8" height="18"/></g>', 400, 100);
const GRASS = tile('<rect y="30" width="400" height="70" fill="#6fc36f"/><g fill="#52a857"><path d="M20 30 l4 -16 l4 16Z M120 30 l4 -20 l4 20Z M230 30 l4 -14 l4 14Z M330 30 l4 -18 l4 18Z"/></g><g><circle cx="70" cy="48" r="4" fill="#ffd23f"/><circle cx="190" cy="52" r="4" fill="#ff7aa8"/><circle cx="300" cy="46" r="4" fill="#fff"/></g>', 400, 100);

export function mountDinoQuest(context) {
  const level = context.level || 1;
  const name = context.playerName || '';
  let alive = true, pickedDino = null;
  const obs = new MutationObserver(() => { if (!document.contains(context.stage)) { alive = false; obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const unlocked = DINOS.slice(0, Math.min(DINOS.length, 3 + Math.floor((level - 1) / 2)));

  // -------------------------------------------------------------- pick a companion
  context.stage.innerHTML = '<div class="dq-pick"><h2>The Lost Egg of Mount Roar</h2><p>A baby egg has rolled away from its mummy! Pick a dinosaur friend to go on a quest with you.</p>' +
    '<div class="dq-dinos">' + unlocked.map((d, i) => '<button class="dq-dino" data-i="' + i + '"><span>' + FX.dinoHTML(d.id, { state: 'idle' }) + '</span><b>' + d.name + '</b></button>').join('') + '</div></div>';
  context.stage.querySelectorAll('.dq-dino').forEach((b) => {
    b.addEventListener('pointerenter', () => FX.dinoState(b.querySelector('.du-dino'), 'roar', 700));
    b.addEventListener('click', () => { FX.sfx.roar(); pickedDino = unlocked[Number(b.dataset.i)]; begin(); });
  });

  // -------------------------------------------------------------- shared scene machinery
  let area, world, cap, capText, dino, dinoWrap, ctrl;
  function build() {
    context.stage.innerHTML = '<div class="dq"><div class="dq-area"><div class="dq-world"></div><div class="dq-cap" hidden><span class="dq-cap-t"></span></div></div></div>';
    area = context.stage.querySelector('.dq-area'); world = area.querySelector('.dq-world'); cap = area.querySelector('.dq-cap'); capText = area.querySelector('.dq-cap-t');
  }
  function makeDino(x, y, w) {
    dinoWrap = document.createElement('div'); dinoWrap.className = 'dq-dino-wrap';
    dinoWrap.style.cssText = 'left:' + x + '%;top:' + y + '%;width:' + w + '%';
    dinoWrap.innerHTML = FX.dinoHTML(pickedDino.id, { state: 'idle' });
    world.append(dinoWrap); dino = dinoWrap.querySelector('.du-dino'); return dinoWrap;
  }
  const moveDino = (x, y, ms) => { dinoWrap.style.transition = 'left ' + ms + 'ms linear, top ' + ms + 'ms linear'; dinoWrap.style.left = x + '%'; dinoWrap.style.top = y + '%'; };
  async function say(text, hold) {
    if (!alive) return;
    cap.hidden = false; cap.classList.remove('pop'); void cap.offsetWidth; cap.classList.add('pop');
    const t = (name && Math.random() < 0 ? name + ', ' : '') + text;
    capText.textContent = '';
    try { context.speak && context.speak(t); } catch (e) { /* speech is optional */ }
    for (let i = 1; i <= t.length && alive; i++) { capText.textContent = t.slice(0, i); await wait(22); }
    await wait(hold == null ? 900 + t.length * 14 : hold);
  }
  const hush = () => { cap.hidden = true; };
  async function walkTo(x, y, ms) {
    FX.dinoState(dino, 'walk'); world.classList.add('walking'); moveDino(x, y == null ? parseFloat(dinoWrap.style.top) : y, ms);
    await wait(ms); world.classList.remove('walking'); FX.dinoState(dino, 'idle');
  }
  // a short, big-button choice
  function choose(prompt, options) {
    return new Promise((resolve) => {
      const box = document.createElement('div'); box.className = 'dq-choice';
      box.innerHTML = '<p>' + prompt + '</p><div>' + options.map((o, i) => '<button data-i="' + i + '"><span>' + o.icon + '</span>' + o.label + '</button>').join('') + '</div>';
      area.append(box);
      box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { FX.sfx.pop(); box.remove(); resolve(Number(b.dataset.i)); }));
    });
  }
  // tap N glowing things placed on the scene
  function tapAll(spots, cls) {
    return new Promise((resolve) => {
      let left = spots.length;
      spots.forEach(([x, y, icon]) => {
        const el = document.createElement('button'); el.className = 'dq-spot ' + (cls || ''); el.textContent = icon;
        el.style.cssText = 'left:' + x + '%;top:' + y + '%'; el.setAttribute('aria-label', 'Tap me');
        el.addEventListener('click', () => { el.disabled = true; el.classList.add('got'); FX.sfx.sparkle(); const r = el.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', n: 14 }); setTimeout(() => el.remove(), 500); if (--left === 0) resolve(); });
        world.append(el);
      });
    });
  }
  // an optional real photo/video, with a friendly illustrated fallback
  async function realMoment(id, fallbackIcon, fact) {
    let m = null;
    try { const r = await fetch('assets/real/manifest.json', { cache: 'no-cache' }); if (r.ok) { const j = await r.json(); m = (j.moments || []).find((x) => x.id === id); } } catch (e) { /* no media dropped in yet */ }
    const card = document.createElement('div'); card.className = 'dq-real';
    let media = '<div class="dq-real-art">' + fallbackIcon + '</div>';
    if (m && m.src) media = m.type === 'video'
      ? '<video src="assets/real/' + m.src + '"' + (m.poster ? ' poster="assets/real/' + m.poster + '"' : '') + ' autoplay muted loop playsinline controls></video>'
      : '<img alt="' + (m.caption || 'A real dinosaur picture') + '" src="assets/real/' + m.src + '">';
    card.innerHTML = '<div class="dq-real-tag">DINO FACT</div>' + media + '<p>' + ((m && m.caption) || fact) + '</p>' + (m && m.credit ? '<small>' + m.credit + '</small>' : '') + '<button>Carry on ›</button>';
    area.append(card); FX.sfx.sparkle(); context.speak && context.speak((m && m.caption) || fact);
    await new Promise((r) => card.querySelector('button').addEventListener('click', r)); card.remove();
  }
  const bgLayers = (sky, far, mid, near) => '<div class="dq-sky" style="background:' + sky + '"></div>' +
    (far ? '<div class="dq-par far" style="background-image:' + far + '"></div>' : '') + (mid ? '<div class="dq-par mid" style="background-image:' + mid + '"></div>' : '') + (near ? '<div class="dq-par near" style="background-image:' + near + '"></div>' : '');

  // -------------------------------------------------------------- the story
  async function begin() {
    build();
    await sceneMeadow(); if (!alive) return;
    await sceneMountain(); if (!alive) return;
    await sceneCave(); if (!alive) return;
    await sceneHome(); if (!alive) return;
    context.advance('you and your dinosaur friend took the lost egg home. The baby dino is safe!');
  }

  async function sceneMeadow() {
    world.innerHTML = bgLayers('linear-gradient(#8fd8f0,#e8f8dc)', HILLS, TREES, GRASS) + '<div class="dq-sun"></div><i class="dq-cloud" style="top:10%;--w:90px"></i><i class="dq-cloud" style="top:22%;--w:64px;animation-delay:-12s"></i>';
    FX.ambient && FX.ambient('meadow');
    makeDino(-20, 56, 22); await wait(300);
    await walkTo(10, 56, 1800);
    await say('What a sunny morning! Let’s go for a walk in the meadow.');
    await walkTo(34, 56, 2600);
    FX.dinoState(dino, 'idle');
    const egg = document.createElement('button'); egg.className = 'dq-egg'; egg.textContent = '🥚'; egg.style.cssText = 'left:62%;top:66%'; egg.setAttribute('aria-label', 'Pick up the egg');
    world.append(egg); egg.animate([{ transform: 'rotate(-12deg)' }, { transform: 'rotate(12deg)' }], { duration: 700, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    await say('Wait… what is that wobbling in the grass? Tap it!', 300);
    await new Promise((r) => egg.addEventListener('click', r, { once: true }));
    FX.sfx.sparkle(); egg.remove(); hush(); FX.dinoState(dino, 'happy', 900);
    const carried = document.createElement('span'); carried.className = 'dq-carry'; carried.textContent = '🥚'; dinoWrap.append(carried);
    await say('It is a baby dinosaur egg! It has rolled away from its mummy. Let’s bring it home!');
    await say('The mummy lives past the big mountain. Off we go!', 700);
    FX.dinoState(dino, 'walk'); await walkTo(112, 56, 2400);
  }

  async function sceneMountain() {
    world.innerHTML = bgLayers('linear-gradient(#a8d8f5,#fff0d4)', null, null, null) +
      '<svg class="dq-mtn" viewBox="0 0 800 500" preserveAspectRatio="none"><path d="M0 500 L0 410 L180 330 L330 250 L470 150 L560 90 L620 150 L800 190 L800 500Z" fill="#a98a6e"/><path d="M0 500 L0 440 L200 380 L360 300 L500 215 L560 170 L640 210 L800 250 L800 500Z" fill="#8f7357"/><path d="M520 120 L560 90 L600 128 L575 122 L560 140 L545 124Z" fill="#fff"/></svg>' +
      '<i class="dq-cloud" style="top:8%;--w:100px"></i><i class="dq-bird" style="top:20%">🐦</i>';
    FX.ambient && FX.ambient('wind');
    makeDino(-18, 60, 14); dinoWrap.insertAdjacentHTML('beforeend', '<span class="dq-carry">🥚</span>');
    await walkTo(3, 60, 1400);
    await say('Wow, Mount Roar is so tall! We have to climb it to get across.');
    const pick = await choose('Which path shall we take?', [{ icon: '🌸', label: 'The flowery path' }, { icon: '🪨', label: 'The rocky path' }]);
    const bumps = Math.min(4, 1 + Math.floor(level / 2));
    const stops = [[17, 49], [29, 38], [41, 26], [53, 13]];
    for (let i = 0; i < stops.length; i++) {
      await walkTo(stops[i][0], stops[i][1], 1500);
      if (i === 1 || (i === 2 && bumps > 2)) {
        const b = document.createElement('div'); b.className = 'dq-boulder'; b.textContent = '🪨'; world.append(b);
        await say(pick === 1 ? 'Oh no! A boulder is rolling down the rocky path! Tap it to hop over it!' : 'A little boulder rolled out of the flowers! Tap it to hop over it!', 100);
        await new Promise((r) => { b.addEventListener('click', r, { once: true }); setTimeout(r, 9000); });
        FX.sfx.boing(); FX.dinoState(dino, 'happy', 700); dinoWrap.animate([{ translate: '0 0' }, { translate: '0 -60px' }, { translate: '0 0' }], { duration: 650, easing: 'ease-out' });
        b.classList.add('gone'); setTimeout(() => b.remove(), 900); hush(); await wait(700);
      }
    }
    await walkTo(62, 3, 1500);
    FX.dinoState(dino, 'roar', 900); FX.sfx.roar();
    FX.shakeScreen();
    await say('We did it! We are at the top! You can see the whole world from up here!');
    // pan to the cave
    const cave = document.createElement('div'); cave.className = 'dq-farcave'; cave.innerHTML = '<span>🕳️</span><b>?</b>';
    world.append(cave); await wait(500);
    await say('Look! Over there on the next mountain… there is a CAVE!', 600);
    cave.classList.add('glow');
    hush(); await realMoment('mountain', '🏔️', 'Real dinosaurs walked over mountains and hills millions of years ago. Their footprints are still found in rocks today!');
    cave.remove();
    await say('The mummy dinosaur might be in the cave. Let’s go and see!', 500);
  }

  async function sceneCave() {
    world.innerHTML = '<div class="dq-cavebg"></div><div class="dq-dark"></div>';
    FX.ambient && FX.ambient('night');
    area.classList.add('in-cave');
    makeDino(8, 58, 22); dinoWrap.insertAdjacentHTML('beforeend', '<span class="dq-carry">🥚</span>');
    dinoWrap.style.zIndex = 3;
    const dark = world.querySelector('.dq-dark');
    const light = (x, y) => { dark.style.setProperty('--lx', x + '%'); dark.style.setProperty('--ly', y + '%'); };
    light(18, 66);
    const onMove = (e) => { const r = area.getBoundingClientRect(); light(((e.clientX - r.left) / r.width * 100).toFixed(1), ((e.clientY - r.top) / r.height * 100).toFixed(1)); };
    area.addEventListener('pointermove', onMove); area.addEventListener('pointerdown', onMove);
    FX.sfx.whoosh();
    await say('Oooh, it is dark in here! Move your torch around by touching the screen.', 500);
    const n = Math.min(5, 3 + Math.floor((level - 1) / 3));
    const spots = [[20, 22, '💎'], [48, 70, '💎'], [72, 28, '💎'], [86, 62, '💎'], [34, 40, '💎']].slice(0, n).map((s) => s);
    await say('Find the glowing crystals! Tap all ' + n + ' of them to light the way.', 300); hush();
    await tapAll(spots, 'crystal');
    dark.classList.add('lit'); area.removeEventListener('pointermove', onMove); area.removeEventListener('pointerdown', onMove);
    FX.sfx.win();
    await say('The whole cave is shining! Look at the colours!', 700);
    area.classList.remove('in-cave');
    // bats
    for (let i = 0; i < 4; i++) { const b = document.createElement('i'); b.className = 'dq-bat'; b.textContent = '🦇'; b.style.cssText = 'top:' + (12 + i * 9) + '%;animation-delay:' + (i * -1.4) + 's'; world.append(b); }
    await say('Eeek, bats! They only want to say hello. Wave goodbye!', 800);
    await walkTo(52, 58, 2200);
    await say('What is that big shape at the back of the cave?', 700);
    hush(); await realMoment('cave', '🥚', 'Dinosaurs laid eggs, just like birds do. Real fossil nests with eggs have been found in the ground!');
    const nest = document.createElement('div'); nest.className = 'dq-nest'; nest.innerHTML = '<span class="dq-mum">' + FX.dinoHTML('bronto', { color: 'teal', state: 'idle' }) + '</span><i>🪹</i>';
    world.append(nest); await wait(600);
    await say('It is the mummy dinosaur! She is looking everywhere for her egg!', 600);
    await walkTo(54, 58, 1400);
  }

  async function sceneHome() {
    const carried = dinoWrap.querySelector('.dq-carry');
    const c = await choose('Give the egg back to the mummy dinosaur?', [{ icon: '🥚', label: 'Yes, put it in the nest' }, { icon: '🤗', label: 'Yes, with a hug' }]);
    FX.sfx.sparkle(); if (carried) carried.remove(); hush();
    const nestIcon = world.querySelector('.dq-nest i'); if (nestIcon) nestIcon.textContent = '🥚';
    FX.dinoState(world.querySelector('.dq-mum .du-dino'), 'happy', 1200);
    await say(c ? 'A great big dinosaur hug! The mummy is so happy!' : 'The egg is safe in the nest! The mummy is so happy!');
    await say('Shhh… the egg is starting to wobble…', 500);
    const nestEl = world.querySelector('.dq-nest'); nestEl.classList.add('wobble'); FX.sfx.drum();
    await tapAll([[50, 82, '🥚']], 'hatch');
    nestEl.classList.remove('wobble');
    FX.sfx.pop(); FX.celebrate(); FX.sfx.win();
    if (nestIcon) nestIcon.textContent = '🐣';
    const baby = document.createElement('div'); baby.className = 'dq-baby'; baby.innerHTML = FX.dinoHTML(pickedDino.id, { state: 'happy', color: 'yellow' });
    world.append(baby);
    await say('CRACK! It is a baby dinosaur! Hello, little one!', 800);
    hush(); await realMoment('hatch', '🐣', 'Baby dinosaurs hatched from eggs. Some looked like tiny copies of their parents, and some even had fluffy feathers!');
    FX.dinoState(dino, 'roar', 900); FX.sfx.roar(); FX.celebrate();
    await say('Quest complete! You are a real dinosaur explorer!', 1600);
  }
}
