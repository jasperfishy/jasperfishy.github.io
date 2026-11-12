// Dino Quest: The Lost Egg of Mount Roar.
// A little story journey in four labelled chapters: a baby egg is found in the meadow, the party climbs
// Mount Roar (two paths, one rockier than the other), searches a dark cave with a torch and carries the
// egg home to its mummy. Weather, path and torch direction change what happens, crystals are counted as
// gems, and every finished quest is remembered on this device so the next one has something to beat.
// Optional real photos/videos for the "real dinosaur moment" cards come from assets/real/manifest.json.
import { attachBonus, collect, collection } from "../adv-kit.js?v=du-8607dafbfd11334e";
const FX = window.DUFX;
const DINOS = [
  { id: 'raptor', name: 'Velociraptor' }, { id: 'trex', name: 'T-rex' }, { id: 'tricera', name: 'Triceratops' },
  { id: 'stego', name: 'Stegosaurus' }, { id: 'bronto', name: 'Brontosaurus' },
];
// Each weather dresses the scene differently, hides a different number of crystals and
// brings its own little creatures, so a foggy quest never plays like a sunny one.
const WEATHERS = [
  { id: 'sunny', name: 'Sunny', e: '☀️', dress: 'sun', drops: 0, gems: 4,
    line: 'What a sunny morning! The grass is warm and the bugs are awake.',
    friends: ['🦋', '🐞', '🌼'], hint: 'Sunny days are easy peasy — the crystals sparkle brightest in the sun.',
    mtn: 'The sun is toasty! What does a dinosaur egg like best?',
    opts: [{ icon: '🌳', label: 'A cool shady spot' }, { icon: '🔥', label: 'Right in the hot sun' }, { icon: '🧊', label: 'On top of some ice' }], right: 0 },
  { id: 'rainy', name: 'Showery', e: '🌦️', dress: 'rain', drops: 16, gems: 5,
    line: 'Drip drop! It is showery today, so let’s find that egg before it gets cold.',
    friends: ['☔', '🐌', '🌈'], hint: 'Tiptoe in the wet — slippery puddles are on the left of the path.',
    mtn: 'The rocks are all slippery and wet! What is the best way to carry the egg?',
    opts: [{ icon: '🏃', label: 'Run as fast as you can' }, { icon: '🤗', label: 'Hold it snug and walk slowly' }, { icon: '🤷', label: 'Balance it on my head' }], right: 1 },
  { id: 'foggy', name: 'Foggy', e: '🌫️', dress: 'fog', drops: 9, gems: 6,
    line: 'Ooh, foggy! Everything is muffled and quiet. Keep your eyes open!',
    friends: ['🍄', '🕸️', '💨'], hint: 'In the fog, look low and near the edges. That is where things hide!',
    mtn: 'We can hardly see a thing in this fog! What helps the most?',
    opts: [{ icon: '😴', label: 'Have a little nap here' }, { icon: '🎈', label: 'Fly a big balloon' }, { icon: '👀', label: 'Look and listen very slowly' }], right: 2 },
];
const CHEERS = ['Roarsome!', 'Dino-mite!', 'You spotted it!', 'Brilliant eyes!', 'Hooray for you!'];
const STREAKS = ['One treasure! Two in a row!', 'Ooh, a streak! Three finds!', 'Four in a row — you are a super scout!'];
const TILE = (svg, w, h) => "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + svg + '</svg>') + "')";
const HILLS = TILE('<path d="M0 100 L0 60 Q50 10 100 55 T200 50 T300 58 T400 60 L400 100Z" fill="#9ed7a6"/>', 400, 100);
const TREES = TILE('<g fill="#3f9a62"><circle cx="40" cy="60" r="26"/><circle cx="150" cy="56" r="32"/><circle cx="270" cy="62" r="24"/><circle cx="350" cy="58" r="28"/></g><g fill="#7a5233"><rect x="37" y="80" width="6" height="20"/><rect x="146" y="82" width="8" height="18"/><rect x="267" y="82" width="6" height="18"/><rect x="346" y="82" width="8" height="18"/></g>', 400, 100);
const GRASS = TILE('<rect y="30" width="400" height="70" fill="#6fc36f"/><g fill="#52a857"><path d="M20 30 l4 -16 l4 16Z M120 30 l4 -20 l4 20Z M230 30 l4 -14 l4 14Z M330 30 l4 -18 l4 18Z"/></g><g><circle cx="70" cy="48" r="4" fill="#ffd23f"/><circle cx="190" cy="52" r="4" fill="#ff7aa8"/><circle cx="300" cy="46" r="4" fill="#fff"/></g>', 400, 100);

// The quest shelf: gems, facts and the fastest trip home, all read off this device.
function bestQuest() {
  const runs = collection('quest-runs');
  const o = { gems: 0, facts: 0, runs: runs.length, secs: 0 };
  runs.forEach((r) => {
    if ((r.gems || 0) > o.gems) o.gems = r.gems;
    if ((r.facts || 0) > o.facts) o.facts = r.facts;
    if (!o.secs || (r.secs || 9e9) < o.secs) o.secs = r.secs;
  });
  return o;
}

export function mountDinoQuest(context) {
  attachBonus(context.stage); // a calm butterfly to catch for the shared sticker collection
  const level = context.level || 1;
  const name = context.playerName || '';
  let alive = true, pickedDino = null, weather = null, hintText = '', chips = null;
  const shelf = bestQuest();
  const state = { gems: 0, facts: 0, slips: 0, hops: 0, streak: 0, chapter: 0, started: 0 };
  const obs = new MutationObserver(() => { if (!document.contains(context.stage)) { alive = false; obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const unlocked = DINOS.slice(0, Math.min(DINOS.length, 3 + Math.floor((level - 1) / 2)));

  // -------------------------------------------------------------- pick a companion and the weather
  context.stage.innerHTML = '<div class="dq-pick"><h2>The Lost Egg of Mount Roar</h2><p>A baby egg has rolled away from its mummy! Pick a dinosaur friend and the weather, then follow the quest through <b>4 chapters</b>: the meadow, the mountain, the dark cave and home.</p>' +
    '<div class="dq-dinos">' + unlocked.map((d, i) => '<button class="dq-dino" data-i="' + i + '"><span>' + FX.dinoHTML(d.id, { state: 'idle' }) + '</span><b>' + d.name + '</b></button>').join('') + '</div>' +
    '<p id="dqWeather" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px">' + WEATHERS.map((w, i) => '<button class="dq-weather" data-i="' + i + '" style="border:3px solid #cfe6d4;background:#fff;border-radius:18px;padding:8px 14px;font:800 1rem system-ui;cursor:pointer">' + w.e + ' ' + w.name + '</button>').join('') + '</p>' +
    '<p id="dqShelf" style="margin:10px auto;max-width:560px;text-align:center;font-weight:800;color:#17403a;background:#e9f8e6;border-radius:16px;padding:6px 14px">' + (shelf.runs
      ? '🏆 Best quest so far: <b>' + shelf.gems + ' 💎 gems</b> · ' + shelf.facts + ' facts · fastest trip home ' + shelf.secs + 's · ' + shelf.runs + ' quest' + (shelf.runs === 1 ? '' : 's') + ' done'
      : '💎 Tap crystals and clues to collect gems. No quests saved on this device yet — this is your first!') + '</p>' +
    '<p id="dqWeatherLine" style="margin:6px auto;max-width:560px;text-align:center;font-weight:800;color:#08415c">Pick a weather to see what the day will be like.</p>' +
    '<p class="gentle-hint">Pick a dinosaur and the weather to set off. The 💡 button always helps for free, and a wrong turn only costs a “so close!”</p></div>';
  const weatherBtns = [...context.stage.querySelectorAll('.dq-weather')];
  // No stylesheet rule owns the "chosen" look, so the buttons paint their own.
  const markPick = (b) => { weatherBtns.forEach((x) => { x.style.outline = '0'; x.style.background = '#fff'; x.style.borderColor = '#cfe6d4'; });
    if (b) { b.style.outline = '3px solid #17403a'; b.style.background = '#e9f8e6'; } };
  weatherBtns.forEach((b) => b.addEventListener('click', () => {
    weather = WEATHERS[Number(b.dataset.i)]; markPick(b); FX.sfx.tap(); FX.pop(b);
    context.stage.querySelector('#dqWeatherLine').textContent = weather.e + ' ' + weather.line;
  }));
  const dinoBtns = [...context.stage.querySelectorAll('.dq-dino')];
  dinoBtns.forEach((b) => {
    b.addEventListener('pointerenter', () => FX.dinoState(b.querySelector('.du-dino'), 'roar', 700));
    b.addEventListener('click', () => {
      if (!weather) { weather = WEATHERS[0]; markPick(weatherBtns[0]); }
      dinoBtns.forEach((x) => { x.style.outline = '0'; }); b.style.outline = '3px solid #17403a';
      FX.sfx.roar(); pickedDino = unlocked[Number(b.dataset.i)]; state.started = Date.now(); begin();
    });
  });


  // -------------------------------------------------------------- shared scene machinery
  let area, world, cap, capText, dino, dinoWrap, ctrl, chipsEl;
  const chip = (id, style, text) => '<span id="' + id + '" style="padding:3px 10px;border-radius:14px;font-weight:900;font-size:clamp(.66rem,1.8cqw,.86rem);box-shadow:0 2px 0 rgba(0,0,0,.12);' + style + '">' + text + '</span>';
  const setChip = (id, text) => { const el = chipsEl && chipsEl.querySelector('#' + id); if (el && el.textContent !== text) { el.textContent = text; FX.pop && FX.pop(el); } };
  function build() {
    context.stage.innerHTML = '<div class="dq"><div class="dq-area"><div class="dq-world"></div>' +
      // the chapter label is the child's place-marker: it grows from 1 of 4 to 4 of 4
      '<div id="dqChips" style="position:absolute;left:2%;top:2%;z-index:8;display:flex;gap:6px;flex-wrap:wrap;align-items:center;max-width:96%">' +
      chip('dqChapter', 'background:#17403a;color:#fff', 'Chapter 1 of 4 · The Meadow') +
      chip('dqGems', 'background:#fff6d8;color:#5c3b00', '💎 0 gems') +
      chip('dqFacts', 'background:#e6f6ff;color:#08415c', '📖 0 facts') +
      chip('dqBest', 'background:#ffe9f0;color:#7a1030', shelf.gems ? '🏆 best ' + shelf.gems + ' 💎' : '🏆 first quest') +
      '<button id="dqHint" style="border:0;border-radius:14px;background:#fff;padding:4px 10px;font:900 clamp(.66rem,1.8cqw,.86rem) system-ui;box-shadow:0 2px 0 rgba(0,0,0,.12);cursor:pointer">💡 Hint</button>' +
      '</div><div class="dq-cap" hidden><span class="dq-cap-t"></span></div></div></div>';
    area = context.stage.querySelector('.dq-area'); world = area.querySelector('.dq-world'); cap = area.querySelector('.dq-cap'); capText = area.querySelector('.dq-cap-t');
    chipsEl = area.querySelector('#dqChips');
    chipsEl.querySelector('#dqHint').addEventListener('click', giveHint);
    chipsEl.addEventListener('click', (e) => e.stopPropagation());
  }
  function chapter(n, title) {
    state.chapter = n;
    setChip('dqChapter', 'Chapter ' + n + ' of 4 · ' + title);
    FX.sfx.drum(); FX.sfx.whoosh();
    const el = chipsEl && chipsEl.querySelector('#dqChapter'); if (el) FX.bounce && FX.bounce(el);
  }
  // Gems are the score, so every one is cheered in its own way.
  function gem(n, why) {
    state.gems += n || 1;
    setChip('dqGems', '💎 ' + state.gems + ' gem' + (state.gems === 1 ? '' : 's'));
    const r = (chipsEl.querySelector('#dqGems') || area).getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.bottom, { kind: 'sparkle', n: 10 });
    FX.floatText(r.left + r.width / 2, r.bottom + 12, '+' + (n || 1) + ' 💎');
    if (why) say(why, 900);
  }
  const factCount = () => { state.facts += 1; setChip('dqFacts', '📖 ' + state.facts + ' fact' + (state.facts === 1 ? '' : 's')); };
  // The hint button always answers the question the child is actually stuck on.
  function giveHint() {
    const line = hintText || 'Look around the scene for the thing that is shining — that is what to tap next.';
    say('💡 ' + line, 4200);
    try { context.speak && context.speak(line); } catch (e) { /* speech is optional */ }
    FX.sfx.note(); FX.sfx.pop();
    const el = chipsEl && chipsEl.querySelector('#dqHint'); if (el) FX.pop(el);
  }
  const cheer = () => STREAKS[state.streak] || CHEERS[Math.floor(Math.random() * CHEERS.length)];
  // Weather the child can actually see — falling drops or drifting fog — plus the
  // day's little creatures, so a second quest never looks like the first.
  function dress() {
    if (!weather) return;
    const sky = world.querySelector('.dq-sky');
    if (sky && weather.dress !== 'sun') sky.style.filter = weather.dress === 'rain' ? 'brightness(.87) saturate(.85)' : 'brightness(.93) contrast(.84)';
    const fall = world.clientHeight + 40;
    for (let i = 0; i < (weather.drops || 0); i++) {
      const fog = weather.dress === 'fog';
      const el = document.createElement('i');
      el.style.cssText = 'position:absolute;left:' + (Math.random() * 94).toFixed(1) + '%;top:-10%;z-index:4;pointer-events:none;font-style:normal;opacity:' + (fog ? '.5' : '.75') +
        ';font-size:' + (fog ? 'clamp(1.6rem,6cqw,3rem)' : 'clamp(.9rem,3cqw,1.3rem)');
      el.textContent = fog ? '🌫️' : '💧'; world.append(el);
      FX.anim && FX.anim(el, [{ translate: '0 0' }, { translate: '0 ' + fall + 'px' }], { duration: (fog ? 10000 : 2800) + i * 200, iterations: Infinity, easing: 'linear', delay: -i * 260 });
    }
    (weather.friends || []).forEach((f, i) => {
      const el = document.createElement('i');
      el.style.cssText = 'position:absolute;left:' + (10 + i * 31) + '%;top:' + (72 - i * 3) + '%;z-index:4;font-style:normal;font-size:clamp(1.1rem,4cqw,1.9rem);pointer-events:none';
      el.textContent = f; world.append(el);
      FX.anim && FX.anim(el, [{ translate: '0 0' }, { translate: '0 -14px' }, { translate: '0 0' }], { duration: 1500 + i * 260, iterations: Infinity, easing: 'ease-in-out' });
    });
  }
  // A thinking question with a teaching nudge: a wrong pick costs a slip, never a scold,
  // and the box simply stays open until the child gets it.
  function quiz(prompt, options, right, why) {
    return new Promise((resolve) => {
      hintText = why;
      const box = document.createElement('div'); box.className = 'dq-choice';
      box.innerHTML = '<p>' + prompt + '</p><div>' + options.map((o, i) => '<button data-i="' + i + '"><span>' + o.icon + '</span>' + o.label + '</button>').join('') + '</div>' +
        '<p id="dqQuizNote" style="min-height:1.3em;margin:8px 0 0;font-weight:900;color:#7a1030"></p>';
      area.append(box);
      box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.dataset.i);
        if (i === right) {
          hintText = ''; state.streak += 1; FX.sfx.good(); FX.sfx.sparkle();
          const r = b.getBoundingClientRect();
          FX.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'confetti', n: 16 });
          FX.floatText(r.left + r.width / 2, r.top, cheer());
          box.remove(); resolve(i); return;
        }
        state.slips += 1; context.oops(); FX.sfx.bad(); FX.shake && FX.shake(b);
        box.querySelector('#dqQuizNote').textContent = 'So close! ' + why;
        try { context.speak && context.speak('So close! ' + why); } catch (e) { /* speech is optional */ }
      }));
    });
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
    const t = (name && Math.random() < 0.34 ? name + ', ' : '') + text;
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
  // tap N glowing things placed on the scene; onTap lets each kind cheer differently
  function tapAll(spots, cls, onTap) {
    return new Promise((resolve) => {
      let left = spots.length;
      spots.forEach(([x, y, icon]) => {
        const el = document.createElement('button'); el.className = 'dq-spot ' + (cls || ''); el.textContent = icon;
        el.style.cssText = 'left:' + x + '%;top:' + y + '%'; el.setAttribute('aria-label', 'Tap me');
        el.addEventListener('click', () => { el.disabled = true; el.classList.add('got'); FX.sfx.sparkle(); const r = el.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', n: 14 }); if (onTap) onTap(el, r); setTimeout(() => el.remove(), 500); if (--left === 0) resolve(); });
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
    const btn = card.querySelector('button');
    await new Promise((r) => btn.addEventListener('click', r));
    // every card read is a fact on the tally, cheered on the spot
    factCount(); state.streak += 1;
    const rr = btn.getBoundingClientRect();
    FX.burst(rr.left + rr.width / 2, rr.top, { kind: 'confetti', n: 14 }); FX.floatText(rr.left + rr.width / 2, rr.top - 8, '📖 +1 fact');
    FX.sfx.good(); card.remove();
  }
  // Real scenery behind the painted foreground: the same photographs the story
  // cutscenes stand in front of. The gradient sky stays underneath, so a photo
  // that has not downloaded yet leaves the scene exactly as it used to look.
  const PLATE = '../../fx/art/';
  const bgLayers = (sky, far, mid, near, plate) => '<div class="dq-sky" style="background:' + sky + '"></div>' +
    (plate ? '<div class="dq-photo" style="background-image:url(' + PLATE + plate + '.jpg)"></div>' : '') +
    (far ? '<div class="dq-par far" style="background-image:' + far + '"></div>' : '') + (mid ? '<div class="dq-par mid" style="background-image:' + mid + '"></div>' : '') + (near ? '<div class="dq-par near" style="background-image:' + near + '"></div>' : '');

  // -------------------------------------------------------------- the story
  async function begin() {
    build();
    await sceneMeadow(); if (!alive) return;
    await sceneMountain(); if (!alive) return;
    await sceneCave(); if (!alive) return;
    await sceneHome(); if (!alive) return;
    // write the run down so the next quest has something to beat, then show it on our own screen
    const secs = Math.max(1, Math.round((Date.now() - state.started) / 1000));
    const isBest = state.gems > shelf.gems;
    collect('quest-runs', { gems: state.gems, facts: state.facts, secs, slips: state.slips, chapter: 4, weather: weather.id, dino: pickedDino.id, level });
    const panel = document.createElement('div'); panel.id = 'dqRecord';
    panel.style.cssText = 'position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:9;max-width:88%;background:rgba(255,255,255,.96);border-radius:20px;padding:10px 16px;box-shadow:0 6px 0 rgba(0,0,0,.16);text-align:center;font-weight:800;color:#17403a';
    panel.innerHTML = '💎 <b>' + state.gems + '</b> gems · 📖 <b>' + state.facts + '</b> facts · ⏱ <b>' + secs + 's</b> · 🏁 <b>4 chapters</b>' +
      (isBest ? '<br>✨ NEW BEST!' : shelf.gems ? '<br>Best so far: ' + shelf.gems + ' 💎' : '') +
      '<br><small style="font-weight:700">' + (state.slips ? state.slips + ' “so close!” — and you kept going. That is what explorers do.' : 'Not one wrong turn! What a clever scout!') + '</small>';
    area.append(panel); FX.pop && FX.pop(panel); FX.sfx.win(); FX.sfx.star();
    await wait(2600);
    context.advance('You and ' + pickedDino.name + ' carried the lost egg home through 4 chapters in ' + secs + ' seconds, collected ' + state.gems +
      ' gems and learned ' + state.facts + ' dinosaur facts on a ' + weather.name.toLowerCase() + ' day. The baby dino is safe — all because of you!');
  }

  async function sceneMeadow() {
    chapter(1, 'The Meadow');
    world.innerHTML = bgLayers('linear-gradient(#8fd8f0,#e8f8dc)', HILLS, TREES, GRASS, 'meadow') + '<div class="dq-sun"></div><i class="dq-cloud" style="top:10%;--w:90px"></i><i class="dq-cloud" style="top:22%;--w:64px;animation-delay:-12s"></i>';
    FX.ambient && FX.ambient('meadow');
    dress();
    makeDino(-20, 56, 22); await wait(300);
    await walkTo(10, 56, 1500);
    hintText = weather.hint;
    await say(weather.line + ' Let’s go for a walk in the meadow.');
    // the number of sparkles depends on the weather and the level, so no two meadows match
    const dew = [[26, 62, '✨'], [44, 70, '✨'], [58, 58, '✨'], [16, 72, '✨'], [70, 66, '✨']]
      .slice(0, 2 + (weather.dress === 'sun' ? 0 : 1) + (level >= 3 ? 1 : 0));
    hintText = 'Tap every sparkle in the grass — there are ' + dew.length + ' of them!';
    await say('Ooh, look! Sparkly things in the grass! Tap each one into your gem pouch.', 300);
    hush();
    await tapAll(dew, 'crystal', (el, r) => { state.streak += 1; gem(1); FX.floatText(r.left + r.width / 2, r.top, cheer()); });
    hintText = '';
    await walkTo(34, 56, 1700);
    FX.dinoState(dino, 'idle');
    const egg = document.createElement('button'); egg.className = 'dq-egg'; egg.textContent = '🥚'; egg.style.cssText = 'left:62%;top:66%'; egg.setAttribute('aria-label', 'Pick up the egg');
    world.append(egg); egg.animate([{ transform: 'rotate(-12deg)' }, { transform: 'rotate(12deg)' }], { duration: 700, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    hintText = 'That is it! Tap the wobbly white egg in the grass.';
    await say('Wait… what is that wobbling in the grass? Tap it!', 300);
    await new Promise((r) => egg.addEventListener('click', r, { once: true }));
    FX.sfx.chomp(); FX.bounce && FX.bounce(dinoWrap);
    egg.remove(); hush(); FX.dinoState(dino, 'happy', 900); hintText = '';
    gem(2);
    await say('Two gems for finding it! It is a baby dinosaur egg! It has rolled away from its mummy. Let’s bring it home!');
    const carried = document.createElement('span'); carried.className = 'dq-carry'; carried.textContent = '🥚'; dinoWrap.append(carried);
    await quiz('Where do you think this egg came from?', [{ icon: '🪹', label: 'A cosy nest' }, { icon: '⚽', label: 'A bouncing ball' }, { icon: '🌳', label: 'A tall tree' }], 0,
      'Dinosaurs laid their eggs in a nest, so a mummy dinosaur is looking for it!');
    hush();
    await say('The mummy lives past the big mountain. Off we go!', 700);
    FX.dinoState(dino, 'walk'); await walkTo(112, 56, 2200);
  }

  async function sceneMountain() {
    world.innerHTML = bgLayers('linear-gradient(#a8d8f5,#fff0d4)', null, null, null, 'mountain') +
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
