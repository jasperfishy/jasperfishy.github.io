// Mummy's Cozy Corner — a little story game.
// Mummy Courtney comes home very tired. Grayson sends a dinosaur helper to fetch things so she can
// relax in the living room (a comfy chair, a cup of tea, some cake, a feather fan), then it is bedtime:
// she is tucked in, her pillow is fluffed, a bedtime story is read, a lullaby is played, a goodnight
// nuzzle is given and finally the light goes out. Wrong choices are funny, never punished.
const FX = window.DUFX;
const W = 800, H = 500;
const HELPERS = [
  { id: 'bronto', name: 'Bronto', color: 'orange' }, { id: 'tricera', name: 'Tricky', color: 'teal' },
  { id: 'stego', name: 'Stego', color: 'purple' }, { id: 'trex', name: 'Rexy', color: 'green' }, { id: 'raptor', name: 'Zippy', color: 'red' },
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------------------------------------------------------- the two rooms (800 x 500 SVG) */
function livingRoom() {
  return `<svg viewBox="0 0 800 500" class="mc-bg" aria-hidden="true"><defs>
    <linearGradient id="lw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe8cf"/><stop offset="1" stop-color="#ffd2a6"/></linearGradient>
    <linearGradient id="ls" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9f7a"/><stop offset=".6" stop-color="#ffd59c"/><stop offset="1" stop-color="#ffeec8"/></linearGradient>
    <radialGradient id="lg"><stop offset="0" stop-color="#fff2b8" stop-opacity=".95"/><stop offset="1" stop-color="#fff2b8" stop-opacity="0"/></radialGradient></defs>
    <rect width="800" height="500" fill="url(#lw)"/><rect y="300" width="800" height="12" fill="#e8a679"/><rect y="312" width="800" height="188" fill="#c98f58"/>
    <g stroke="#b57a45" stroke-width="3" opacity=".7"><path d="M0 345H800M0 385H800M0 430H800M0 478H800"/><path d="M120 312V345M300 345V385M520 312V345M690 345V385M210 385V430M440 385V430M610 430V478M90 430V478M360 430V478"/></g>
    <g class="mc-window"><rect x="60" y="56" width="200" height="196" rx="10" fill="url(#ls)" stroke="#fff" stroke-width="10"/>
      <circle cx="165" cy="214" r="40" fill="#ff8a5c"><animate attributeName="cy" values="214;206;214" dur="8s" repeatCount="indefinite"/></circle>
      <g class="mc-cloud"><ellipse cx="90" cy="110" rx="34" ry="12" fill="#fff" opacity=".85"/><ellipse cx="112" cy="102" rx="20" ry="12" fill="#fff" opacity=".85"/></g>
      <g class="mc-cloud mc-cloud2"><ellipse cx="170" cy="140" rx="26" ry="9" fill="#fff" opacity=".8"/></g>
      <path d="M160 56V252M60 154H260" stroke="#fff" stroke-width="7"/>
      <path d="M48 50 C80 90 80 190 48 262 L28 262 L28 50Z" fill="#e57f84" class="mc-curtain"/><path d="M272 50 C240 90 240 190 272 262 L292 262 L292 50Z" fill="#e57f84" class="mc-curtain mc-curtain2"/>
      <rect x="50" y="252" width="220" height="12" rx="4" fill="#fff"/></g>
    <g><rect x="330" y="70" width="110" height="84" rx="6" fill="#fff" stroke="#c98f58" stroke-width="6"/><rect x="342" y="82" width="86" height="60" fill="#bfe8ff"/><path d="M342 142 L370 110 L392 130 L408 114 L428 142Z" fill="#7bc88a"/><circle cx="410" cy="100" r="9" fill="#ffd45e"/>
      <rect x="470" y="86" width="64" height="64" rx="32" fill="#fff" stroke="#c98f58" stroke-width="6"/><path d="M502 118V100M502 118L516 126" stroke="#3b3b3b" stroke-width="4" stroke-linecap="round" class="mc-clock"/></g>
    <g><rect x="650" y="64" width="130" height="250" rx="6" fill="#a8683a"/><g fill="#8a4f28"><rect x="656" y="130" width="118" height="8"/><rect x="656" y="196" width="118" height="8"/><rect x="656" y="262" width="118" height="8"/></g>
      <g><rect x="662" y="86" width="14" height="44" fill="#e05a5a"/><rect x="678" y="94" width="12" height="36" fill="#4d96ff"/><rect x="692" y="80" width="16" height="50" fill="#ffd45e"/><rect x="710" y="92" width="12" height="38" fill="#6bcb77"/><rect x="724" y="86" width="14" height="44" fill="#9b6fe0"/>
      <rect x="664" y="156" width="16" height="40" fill="#ff9f43"/><rect x="684" y="150" width="12" height="46" fill="#2ec4b6"/><rect x="700" y="160" width="18" height="36" fill="#e05a5a"/><text x="740" y="190" font-size="30">🦖</text>
      <text x="670" y="256" font-size="28">🪴</text><text x="710" y="258" font-size="28">🧸</text></g></g>
    <g class="mc-lamp"><ellipse cx="590" cy="150" rx="120" ry="120" fill="url(#lg)" class="mc-glow"/><path d="M590 190V340M570 340H610" stroke="#8a5a30" stroke-width="8" stroke-linecap="round"/><path d="M552 190 L568 130 H612 L628 190Z" fill="#ffe08a" stroke="#e0b64a" stroke-width="4"/></g>
    <ellipse cx="400" cy="432" rx="260" ry="52" fill="#e58b8b"/><ellipse cx="400" cy="432" rx="210" ry="40" fill="none" stroke="#f7c6c6" stroke-width="6"/><ellipse cx="400" cy="432" rx="150" ry="27" fill="none" stroke="#f7c6c6" stroke-width="4"/>
    <g><rect x="500" y="352" width="112" height="14" rx="5" fill="#a8683a"/><rect x="512" y="366" width="12" height="62" fill="#8a4f28"/><rect x="588" y="366" width="12" height="62" fill="#8a4f28"/></g>
    <g><rect x="0" y="130" width="46" height="190" rx="6" fill="#d9eaf5" opacity=".0"/><text x="8" y="300" font-size="46" class="mc-doorsign">🍳</text></g>
  </svg>`;
}
function bedroom() {
  return `<svg viewBox="0 0 800 500" class="mc-bg" aria-hidden="true"><defs>
    <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46578f"/><stop offset="1" stop-color="#6d7fb8"/></linearGradient>
    <linearGradient id="bs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16214f"/><stop offset="1" stop-color="#34508f"/></linearGradient>
    <radialGradient id="bg2"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>
    <rect width="800" height="500" fill="url(#bw)"/><rect y="312" width="800" height="188" fill="#8a6a50"/><rect y="300" width="800" height="12" fill="#6f5640"/>
    <g stroke="#775a42" stroke-width="3" opacity=".7"><path d="M0 345H800M0 385H800M0 430H800M0 478H800"/></g>
    <g><rect x="70" y="60" width="190" height="190" rx="10" fill="url(#bs)" stroke="#e9eefc" stroke-width="10"/><path d="M165 60V250M70 155H260" stroke="#e9eefc" stroke-width="6"/>
      <g class="mc-bstars"><circle cx="100" cy="90" r="2.5" fill="#fff"/><circle cx="130" cy="120" r="2" fill="#fff"/><circle cx="215" cy="85" r="3" fill="#fff"/><circle cx="235" cy="130" r="2" fill="#fff"/><circle cx="110" cy="200" r="2.4" fill="#fff"/><circle cx="200" cy="215" r="2" fill="#fff"/></g>
      <circle cx="200" cy="105" r="26" fill="#fff6c9"/><circle cx="190" cy="98" r="5" fill="#e6dca8" opacity=".6"/><circle cx="208" cy="114" r="4" fill="#e6dca8" opacity=".6"/>
      <path d="M58 54 C90 96 90 196 58 256 L40 256 L40 54Z" fill="#7d6fb8" class="mc-curtain"/><path d="M272 54 C240 96 240 196 272 256 L290 256 L290 54Z" fill="#7d6fb8" class="mc-curtain mc-curtain2"/></g>
    <g><rect x="620" y="70" width="150" height="230" rx="6" fill="#6b4a33"/><g fill="#53381f"><rect x="626" y="130" width="138" height="8"/><rect x="626" y="196" width="138" height="8"/></g>
      <g><rect x="636" y="92" width="14" height="38" fill="#ff9f43"/><rect x="652" y="100" width="12" height="30" fill="#6bcb77"/><rect x="668" y="88" width="16" height="42" fill="#ff7aa8"/><rect x="686" y="96" width="14" height="34" fill="#4d96ff"/><text x="712" y="128" font-size="30">🦕</text><text x="640" y="190" font-size="28">🧸</text><text x="696" y="192" font-size="28">🚀</text></g></g>
    <g><rect x="296" y="196" width="26" height="40" rx="6" fill="#fff" stroke="#c5cee8" stroke-width="3" class="mc-switch-plate"/><rect x="304" y="204" width="10" height="24" rx="4" fill="#ffd45e" class="mc-switch-knob"/></g>
    <g><rect x="330" y="360" width="440" height="70" rx="12" fill="#9c6b3f"/><rect x="330" y="300" width="440" height="68" rx="16" fill="#f3f0ff"/><rect x="330" y="300" width="440" height="68" rx="16" fill="none" stroke="#d6cff0" stroke-width="3"/>
      <rect x="738" y="250" width="40" height="186" rx="12" fill="#8a5a30"/><rect x="340" y="428" width="16" height="30" fill="#8a5a30"/><rect x="744" y="428" width="16" height="30" fill="#8a5a30"/>
      <ellipse cx="700" cy="302" rx="62" ry="22" fill="#fff" stroke="#d6cff0" stroke-width="3" class="mc-pillow"/></g>
    <g><rect x="226" y="378" width="86" height="56" rx="6" fill="#a8683a"/><rect x="236" y="434" width="10" height="34" fill="#8a4f28"/><rect x="292" y="434" width="10" height="34" fill="#8a4f28"/>
      <g class="mc-bedlamp"><ellipse cx="270" cy="340" rx="90" ry="90" fill="url(#bg2)" class="mc-glow"/><rect x="266" y="352" width="8" height="26" fill="#8a5a30"/><path d="M250 354 L258 320 H282 L290 354Z" fill="#ffd9a0" stroke="#e0a85a" stroke-width="3"/></g></g>
    <ellipse cx="190" cy="462" rx="130" ry="26" fill="#6d5aa8" opacity=".7"/>
  </svg>`;
}
const armchairSVG = (w) => `<svg viewBox="0 0 160 150" width="${w}" aria-hidden="true"><rect x="22" y="26" width="116" height="78" rx="30" fill="#d9634a" stroke="#8a2f1f" stroke-width="5"/><rect x="6" y="64" width="40" height="64" rx="18" fill="#e57b62" stroke="#8a2f1f" stroke-width="5"/><rect x="114" y="64" width="40" height="64" rx="18" fill="#e57b62" stroke="#8a2f1f" stroke-width="5"/><rect x="34" y="84" width="92" height="40" rx="16" fill="#f0917a" stroke="#8a2f1f" stroke-width="5"/><rect x="22" y="124" width="14" height="22" rx="4" fill="#6b3a1f"/><rect x="124" y="124" width="14" height="22" rx="4" fill="#6b3a1f"/><circle cx="80" cy="50" r="5" fill="#8a2f1f"/><circle cx="56" cy="54" r="4" fill="#8a2f1f"/><circle cx="104" cy="54" r="4" fill="#8a2f1f"/></svg>`;
const blanketHTML = () => '<div class="mc-blanket"><i></i><i></i><i></i><i></i></div>';

/* ---------------------------------------------------------------- the story book */
const BOOK = [
  { text: 'Once upon a time, a sleepy little dinosaur yawned a great big yawn…', art: () => `<div class="bk-sky">🌙<div class="bk-dino">${FX.dinoHTML('stego', { state: 'sleep', color: 'purple' })}</div></div>` },
  { text: 'She looked up and counted the twinkling stars. One… two… three…', art: () => `<div class="bk-sky"><span class="bk-star s1">⭐</span><span class="bk-star s2">⭐</span><span class="bk-star s3">⭐</span><div class="bk-dino">${FX.dinoHTML('tricera', { color: 'teal' })}</div></div>` },
  { text: 'And the whole forest whispered, “Goodnight, sleepy dinosaur. Sweet dreams.”', art: () => `<div class="bk-sky bk-night">🌲<div class="bk-trio"><span>${FX.dinoHTML('bronto', { state: 'sleep', color: 'orange' })}</span><span>${FX.dinoHTML('trex', { state: 'sleep' })}</span><span>${FX.dinoHTML('raptor', { state: 'sleep', color: 'red' })}</span></div><i class="bk-ff"></i><i class="bk-ff f2"></i><i class="bk-ff f3"></i></div>` },
];

export function mountMummyCozyCorner(context) {
  const level = context.level;
  const helperPool = HELPERS.slice(0, Math.min(HELPERS.length, 3 + Math.floor((level - 1) / 2)));
  const name = context.playerName || '';
  let helper = null, left = false, room = 'living';
  const root = context.stage;
  const alive = () => document.contains(root) && !left;
  const A = () => { if (!alive()) throw new Error('left'); };
  const say = (t) => context.speak && context.speak(context.message(t));
  const mo = new MutationObserver(() => { if (!document.contains(root)) { left = true; mo.disconnect(); } });
  mo.observe(document.body, { childList: true, subtree: true });
  FX.ambient(null);

  // ------------------------------------------------------------ choose a helper
  root.innerHTML = `<div class="mc-pick"><div class="mc-pick-mum">${FX.personHTML('courtney', { state: 'tired', size: .55 })}</div>
    <div><h2>Mummy’s Cozy Corner</h2><p>Mummy Courtney has had a very long day and she is <b>so</b> tired. Pick a dinosaur helper to bring her everything she needs to relax, and then tuck her in for the night.</p></div></div>
    <div class="mc-helpers">${helperPool.map((h, i) => `<button class="mc-helper" data-i="${i}"><span class="mc-helper-art">${FX.dinoHTML(h.id, { color: h.color })}</span><b>${h.name}</b></button>`).join('')}</div>`;
  root.querySelectorAll('.mc-helper').forEach((b) => {
    b.addEventListener('pointerenter', () => FX.dinoState(b.querySelector('.du-dino'), 'happy', 800));
    b.addEventListener('click', () => { helper = helperPool[Number(b.dataset.i)]; FX.sfx.chirp(); begin().catch((e) => { if (e.message !== 'left') console.error(e); }); });
  });

  // ------------------------------------------------------------ scene plumbing
  let area, layer, bg, mum, mumWrap, dinoWrap, dino, items, bubble, panel, comfort = 0, hearts, fit = 1, dark;
  const need = level >= 3 ? 6 : level >= 2 ? 5 : 4;
  const fitScene = () => { if (area) { fit = area.clientWidth / W; layer.style.setProperty('--fit', fit); } };
  const put = (el, x, y, w, h, k = 1, extra = '') => { el.style.transform = `translate(${x - w * k / 2}px,${y - h * k}px) scale(${k}) ${extra}`; };
  const putMum = (x, y, k = .8) => put(mumWrap, x, y, 200, 330, k);
  const putDino = (x, y, k = 1, flip = false) => { dinoWrap.dataset.flip = flip ? 1 : 0; dinoWrap.firstElementChild.firstElementChild.classList.toggle('d-flip', flip); put(dinoWrap, x, y, 150, 112, k); };
  const glide = async (el, ms) => { el.style.transition = `transform ${ms}ms cubic-bezier(.45,.05,.4,1)`; await wait(ms + 40); A(); };
  function tell(text, who = 'mum', ms = 2400) {
    const ar = area.getBoundingClientRect(), r = (who === 'mum' ? mum : dino).getBoundingClientRect();
    bubble.textContent = text; bubble.className = 'mc-bubble ' + who + ' show';
    bubble.style.left = Math.max(120, Math.min(ar.width - 120, r.left - ar.left + r.width / 2)) + 'px'; bubble.style.top = Math.max(60, r.top - ar.top + 6) + 'px';
    clearTimeout(tell.t); tell.t = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  const mood = (n) => { comfort = Math.min(5, comfort + n); hearts.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < comfort ? 'on' : ''}">${i < comfort ? '💛' : '🤍'}</i>`).join(''); };

  async function begin() {
    root.innerHTML = `<div class="mc-wrap"><div class="mc-area"><div class="mc-layer"><div class="mc-bgbox"></div><div class="mc-items"></div>
      <div class="mc-mum"></div><div class="mc-dino"></div><div class="mc-dark"></div></div><div class="mc-hearts" aria-label="How cosy Mummy feels"></div><div class="mc-bubble"></div></div><div class="mc-panel"></div></div>`;
    area = root.querySelector('.mc-area'); layer = area.querySelector('.mc-layer'); bg = layer.querySelector('.mc-bgbox'); items = layer.querySelector('.mc-items');
    mumWrap = layer.querySelector('.mc-mum'); dinoWrap = layer.querySelector('.mc-dino'); dark = layer.querySelector('.mc-dark'); hearts = area.querySelector('.mc-hearts'); bubble = area.querySelector('.mc-bubble'); panel = root.querySelector('.mc-panel');
    bg.innerHTML = livingRoom();
    mumWrap.innerHTML = FX.personHTML('courtney', { state: 'walk', size: 1 }); mum = mumWrap.firstElementChild;
    dinoWrap.innerHTML = FX.dinoHTML(helper.id, { color: helper.color, state: 'idle', size: 150 });
    dino = dinoWrap.firstElementChild;
    panel.innerHTML = '<div class="mc-ask"><span class="mc-thought">🏠</span><b>Mummy Courtney is coming home…</b></div>';
    mumWrap.style.transform = 'translate(-260px,150px) scale(.8)'; dinoWrap.style.transform = 'translate(-300px,380px)';
    fitScene(); window.addEventListener('resize', fitScene); mood(0);
    await wait(120);
    // Mummy walks in, flops and yawns
    putMum(-80, 440); await wait(60); mumWrap.style.transition = 'none';
    putMum(-80, 440); void mumWrap.offsetWidth;
    mumWrap.style.transition = 'transform 2.6s ease-out'; putMum(300, 440); FX.sfx.tap();
    putDino(130, 452, 1); dinoWrap.style.transition = 'none';
    await wait(2700); A();
    FX.personState(mum, 'yawn'); mum.setAttribute('data-base', 'tired'); FX.sfx.chirp(); say('Phew, what a long day. I am so tired…');
    tell('Phew… what a long day. I’m so tired…', 'mum', 3200);
    await wait(2800); A(); FX.personState(mum, 'tired');
    await livingTasks();
    await bedtime();
  }

  // ------------------------------------------------------------ asking for / fetching things
  async function choose(prompt, thought, options) {
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">${thought}</span><b>${esc(context.message(prompt))}</b></div><div class="mc-opts">${options.map((o, i) => `<button class="mc-opt" data-i="${i}" data-right="${o.right ? 1 : 0}"><span class="mc-opt-art">${o.art || o.e}</span><small>${esc(o.label)}</small></button>`).join('')}</div>`;
    panel.classList.remove('busy');
    return new Promise((res) => panel.querySelectorAll('.mc-opt').forEach((b) => b.addEventListener('click', () => { panel.classList.add('busy'); FX.sfx.tap(); res(options[Number(b.dataset.i)]); }, { once: true })));
  }
  function itemEl(o, size) { const d = document.createElement('div'); d.className = 'mc-item'; d.innerHTML = o.art ? o.art.replace('width="' + 70 + '"', 'width="' + size + '"') : `<span style="font-size:${size}px">${o.e}</span>`; return d; }
  async function fetchTo(o, from, dest, size = 74) {
    const edge = from === 'left' ? -170 : W + 170, sx = from === 'left' ? 40 : W - 40;
    // run off to find it
    FX.dinoState(dino, 'run'); dinoWrap.style.transition = 'none'; const hx = Number(dinoWrap.dataset.hx || 130);
    putDino(edge, 452, 1, from === 'left'); await glide(dinoWrap, 1100); FX.sfx.whoosh();
    FX.dinoState(dino, 'idle'); await wait(700); A(); FX.sfx.pop();
    // come back holding it
    const held = itemEl(o, size); held.classList.add('held'); held.style.left = Math.max(0, (150 - size) / 2) + 'px'; held.style.top = -(size * .95) + 'px'; dinoWrap.append(held);
    dinoWrap.style.transition = 'none'; putDino(edge, 452, 1, from !== 'left'); void dinoWrap.offsetWidth;
    FX.dinoState(dino, 'walk'); putDino(dest.x, dest.y, 1, from !== 'left'); await glide(dinoWrap, 1500);
    FX.dinoState(dino, 'idle'); held.remove();
    const placed = itemEl(o, size); placed.classList.add('placed'); placed.style.transform = `translate(${dest.ix - size / 2}px,${dest.iy - size}px)`; items.append(placed); FX.pop(placed); FX.sfx.thud();
    return placed;
  }
  async function wrongGag(o, from, dest) {
    const placed = await fetchTo(o, from, dest);
    FX.personState(mum, 'tired'); tell(o.quip || 'Ha ha, no thank you, darling!', 'mum', 2200); FX.sfx.boing(); FX.dinoState(dino, 'sad', 1400);
    await wait(2200); A(); placed.remove(); FX.dinoState(dino, 'walk');
    dinoWrap.style.transition = 'none'; putDino(dest.x, dest.y, 1, from === 'left'); void dinoWrap.offsetWidth; putDino(from === 'left' ? -170 : W + 170, 452, 1, from === 'left'); await glide(dinoWrap, 1000);
    dinoWrap.style.transition = 'none'; putDino(from === 'left' ? -170 : W + 170, 452, 1, false); void dinoWrap.offsetWidth; FX.dinoState(dino, 'walk'); putDino(150, 452, 1, false); await glide(dinoWrap, 1000); FX.dinoState(dino, 'idle');
  }
  async function ask(t) {
    for (;;) {
      const o = await choose(t.prompt, t.thought, shuffle(t.options)); A();
      if (o.right) { tell('Ooh, yes please!', 'mum', 1400); const placed = await fetchTo(o, t.from, t.dest, t.size); return { o, placed }; }
      await wrongGag(o, t.from, t.dest);
    }
  }
  const happy = async (line, ms = 2400, heart = 1) => { FX.personState(mum, 'happy', 1300); FX.sfx.good(); FX.burst(...mumHead(), { kind: 'hearts', n: 8 }); tell(line, 'mum', ms); say(line); mood(heart); await wait(ms); A(); };
  const mumHead = () => { const r = mum.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * .15]; };

  // ------------------------------------------------------------ living room
  async function livingTasks() {
    const tasks = [
      { id: 'seat', from: 'right', prompt: 'Could we find somewhere comfy for Mummy to sit down?', thought: '🪑', dest: { x: 500, y: 452, ix: 330, iy: 398 }, size: 130,
        options: [{ art: armchairSVG(70), label: 'Comfy armchair', right: true }, { e: '🛁', label: 'Bathtub', quip: 'A bath? I’m not THAT tired!' }, { e: '🪣', label: 'Bucket', quip: 'A bucket? Hee hee, no thanks!' }] },
      { id: 'tea', from: 'left', prompt: 'Let’s make Mummy a nice hot cup of tea.', thought: '☕?', dest: { x: 470, y: 452, ix: 555, iy: 352 }, size: 56,
        options: [{ e: '☕', label: 'A cup of tea', right: true }, { e: '🥾', label: 'A smelly boot', quip: 'Pooey! That’s a boot, not a tea!' }, { e: '🧴', label: 'Shampoo', quip: 'I can’t drink shampoo!' }] },
      { id: 'cake', from: 'left', prompt: 'Perhaps Mummy is a little bit hungry. What could she nibble?', thought: '🍰?', dest: { x: 470, y: 452, ix: 520, iy: 352 }, size: 54,
        options: [{ e: '🍰', label: 'A slice of cake', right: true }, { e: '🧅', label: 'An onion', quip: 'An onion?! That would make me cry!' }, { e: '🧦', label: 'A sock', quip: 'Socks are for feet, silly!' }] },
      { id: 'fan', from: 'right', prompt: 'It is warm in here. Mummy needs a cooling breeze.', thought: '💨?', dest: { x: 500, y: 452, ix: 620, iy: 430 }, size: 84,
        options: [{ e: '🪶', label: 'A big soft feather', right: true }, { e: '🧹', label: 'A broom', quip: 'A broom? That’s for sweeping!' }, { e: '🔨', label: 'A hammer', quip: 'Bonk! Not a hammer please!' }] },
    ];
    if (need >= 5) tasks.push({ id: 'flowers', from: 'right', prompt: 'Something pretty would make Mummy smile.', thought: '💐?', dest: { x: 470, y: 452, ix: 590, iy: 352 }, size: 52, options: [{ e: '💐', label: 'Pretty flowers', right: true }, { e: '🌵', label: 'A prickly cactus', quip: 'Ouch, prickly! Not that one!' }, { e: '🥔', label: 'A potato', quip: 'A potato? I can’t smell a potato!' }] });
    if (need >= 6) tasks.push({ id: 'slippers', from: 'left', prompt: 'Her feet are tired. What would be cosy?', thought: '🥿?', dest: { x: 400, y: 452, ix: 300, iy: 462 }, size: 50, options: [{ e: '🥿', label: 'Soft slippers', right: true }, { e: '🩴', label: 'Flip flops', quip: 'Flip flops? In this weather?' }, { e: '🥾', label: 'Heavy boots', quip: 'Boots? No, no, no, my toes!' }] });
    for (const t of tasks) {
      const { placed } = await ask(t); A();
      if (t.id === 'seat') {
        FX.personState(mum, 'walk'); mumWrap.style.transition = 'transform 1.2s ease-in-out'; putMum(330, 440); await wait(1250); A();
        mumWrap.style.transition = 'transform .5s'; putMum(330, 428); FX.personState(mum, 'sit'); mum.setAttribute('data-base', 'sit'); FX.sfx.thud();
        placed.style.zIndex = 1; mumWrap.style.zIndex = 3;
        await happy('Ahhh, that’s so comfy. Thank you!', 2200);
      } else if (t.id === 'tea') { placed.insertAdjacentHTML('beforeend', '<i class="mc-steam"></i><i class="mc-steam s2"></i>'); await happy('Mmm, a lovely cup of tea. Just what I needed!', 2600); }
      else if (t.id === 'cake') { FX.personState(mum, 'happy', 1400); FX.sfx.chomp(); await wait(500); placed.style.opacity = .3; FX.burst(...mumHead(), { kind: 'sparkle', n: 14 }); await happy('Yum! Delicious cake. You’re so kind!', 2600); placed.remove(); }
      else if (t.id === 'fan') { await waft(placed); }
      else if (t.id === 'flowers') { await happy('Oh, flowers! They smell wonderful!', 2400); }
      else if (t.id === 'slippers') { await happy('Cosy toes! Ahh, thank you!', 2400); }
    }
    FX.personState(mum, 'happy', 1600); tell('I feel so much better! But now I’m SO sleepy…', 'mum', 3200); say('I feel so much better! But now I am so sleepy…');
    await wait(3400); A(); FX.personState(mum, 'yawn');
    await wait(2000); A();
  }
  async function waft(feather) {
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">💨</span><b>${esc(context.message('Tap the feather again and again to waft a cool breeze!'))}</b></div><div class="mc-meter"><i></i></div>`;
    panel.classList.remove('busy'); feather.style.pointerEvents = 'auto'; feather.classList.add('tap-me');
    let n = 0; const goal = 9, meter = panel.querySelector('.mc-meter i');
    await new Promise((res) => feather.addEventListener('pointerdown', function h() {
      n++; meter.style.width = n / goal * 100 + '%'; FX.sfx.whoosh(); FX.anim(feather, [{ transform: feather.style.transform + ' rotate(-25deg)' }, { transform: feather.style.transform + ' rotate(25deg)' }, { transform: feather.style.transform }], { duration: 280 });
      const r = feather.getBoundingClientRect(); FX.burst(r.left, r.top, { kind: 'leaves', n: 3, angle: Math.PI, spread: .5, power: .6 });
      mum.classList.add('breeze'); setTimeout(() => mum.classList.remove('breeze'), 300);
      if (n >= goal) { feather.removeEventListener('pointerdown', h); res(); }
    }));
    feather.classList.remove('tap-me'); feather.style.pointerEvents = 'none'; A();
    await happy('Ahhh… what a gorgeous cool breeze. I feel so relaxed!', 2800); feather.remove();
  }

  // ------------------------------------------------------------ bedtime
  async function curtain(fn) {
    const c = document.createElement('div'); c.className = 'mc-curtainwipe'; area.append(c); await wait(450); A();
    fn(); await wait(250); A(); c.classList.add('out'); await wait(500); c.remove();
  }
  async function bedtime() {
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">🌙</span><b>${esc(context.message('It is bedtime! Let’s help Mummy into bed.'))}</b></div>`;
    await curtain(() => { room = 'bed'; bg.innerHTML = bedroom(); items.innerHTML = ''; FX.personState(mum, 'tired'); mum.setAttribute('data-base', 'tired'); mum.classList.remove('sleeping'); mumWrap.style.transition = 'none'; putMum(190, 440); putDino(130, 452, 1); dinoWrap.style.transition = 'none'; });
    tell('Time for bed… I can barely keep my eyes open.', 'mum', 3000); say('Time for bed. I can barely keep my eyes open.'); await wait(3200); A();
    // Mummy walks to the bed and lies down
    FX.personState(mum, 'walk'); mumWrap.style.transition = 'transform 1.8s ease-in-out'; putMum(420, 420); await wait(1900); A();
    mumWrap.style.transition = 'none'; FX.personState(mum, 'lie'); mum.setAttribute('data-base', 'lie'); mum.classList.add('drowsy');
    mumWrap.style.transform = `translate(458px,252px)`; mumWrap.style.zIndex = 2; mumWrap.style.setProperty('--lk', 1);
    mum.style.setProperty('--k', .78); FX.sfx.thud(); await wait(600);
    // blanket
    const b = await ask({ id: 'blanket', from: 'left', prompt: 'A warm, cosy blanket would be perfect for Mummy.', thought: '🛏️?', dest: { x: 330, y: 452, ix: 540, iy: 372 }, size: 10,
      options: [{ e: '🛌', label: 'A warm blanket', right: true }, { e: '🪣', label: 'A bucket', quip: 'A bucket won’t keep me warm!' }, { e: '📰', label: 'A newspaper', quip: 'A newspaper? It’s all rustly!' }] });
    b.placed.remove(); mumWrap.insertAdjacentHTML('afterend', '<div class="mc-bedblanket"></div>'); FX.sfx.pop(); const bl = layer.querySelector('.mc-bedblanket'); FX.pop(bl);
    await happy('Ohh, so warm and snuggly. Thank you, my love!', 2600);
    // pillow
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">☁️</span><b>${esc(context.message('The pillow is squashed. Tap it to fluff it up!'))}</b></div><div class="mc-meter"><i></i></div>`;
    panel.classList.remove('busy');
    await new Promise((res) => { const hit = document.createElement('button'); hit.className = 'mc-hotspot'; hit.style.cssText = 'left:610px;top:262px;width:180px;height:70px'; hit.setAttribute('aria-label', 'Fluff the pillow'); layer.append(hit); let n = 0; hit.addEventListener('pointerdown', () => { n++; panel.querySelector('.mc-meter i').style.width = n / 4 * 100 + '%'; FX.sfx.pop(); const p = layer.querySelector('.mc-bg .mc-pillow') || null; const r = hit.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + 10, { kind: 'dust', n: 6 }); FX.anim(hit, [{ transform: 'scale(1)' }, { transform: 'scale(1.12,.86)' }, { transform: 'scale(1)' }], { duration: 240 }); const svgP = bg.querySelector('.mc-pillow'); if (svgP) { svgP.style.transformOrigin = '700px 302px'; FX.anim(svgP, [{ transform: 'scale(1)' }, { transform: 'scale(1.15,.8)' }, { transform: 'scale(1.06,1.1)' }, { transform: 'scale(1)' }], { duration: 300 }); } if (n >= 4) { hit.remove(); res(); } }); });
    A(); await happy('That’s perfect. So soft and fluffy…', 2400);
    // story
    const book = await ask({ id: 'book', from: 'right', prompt: 'A bedtime story would be lovely.', thought: '📖?', dest: { x: 420, y: 452, ix: 330, iy: 396 }, size: 56,
      options: [{ e: '📖', label: 'A story book', right: true }, { e: '🔧', label: 'A spanner', quip: 'A spanner? That’s a boring bedtime story!' }, { e: '🧱', label: 'A brick', quip: 'A brick is too heavy to read!' }] });
    await storyBook(); book.placed.remove();
    // lullaby
    await lullaby();
    // goodnight nuzzle
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">💋</span><b>${esc(context.message('Let’s give Mummy a goodnight nuzzle. Tap your dinosaur!'))}</b></div>`;
    panel.classList.remove('busy');
    dinoWrap.style.transition = 'transform 1.2s ease-in-out'; putDino(720, 480, 1, true); await wait(1300); A();
    await new Promise((res) => { const handler = () => { dinoWrap.removeEventListener('pointerdown', handler); res(); }; dinoWrap.style.pointerEvents = 'auto'; dinoWrap.classList.add('tap-me'); dinoWrap.addEventListener('pointerdown', handler); });
    dinoWrap.style.pointerEvents = 'none'; dinoWrap.classList.remove('tap-me'); A();
    FX.dinoState(dino, 'happy', 1600); FX.sfx.chirp(); const r = mum.getBoundingClientRect(); FX.burst(r.left + r.width * .8, r.top + r.height * .3, { kind: 'hearts', n: 16 });
    tell('Goodnight, my darling. I love you.', 'mum', 3000); say('Goodnight, my darling. I love you.'); mood(1); await wait(3200); A();
    await lightsOut();
  }
  async function storyBook() {
    const ov = document.createElement('div'); ov.className = 'mc-book'; area.append(ov); let p = 0;
    const show = () => { ov.innerHTML = `<div class="bk-page"><div class="bk-art">${BOOK[p].art()}</div><p>${esc(context.message(BOOK[p].text))}</p><button class="bk-next">${p < BOOK.length - 1 ? 'Turn the page ▶' : 'The end 💤'}</button></div>`; FX.pop(ov.firstElementChild); FX.sfx.whoosh(); say(BOOK[p].text); };
    show();
    await new Promise((res) => ov.addEventListener('click', function h(e) { if (!e.target.closest('.bk-next')) return; p++; if (p >= BOOK.length) { ov.removeEventListener('click', h); res(); } else { show(); } }));
    ov.remove(); A(); mum.classList.remove('drowsy'); mum.classList.add('sleeping'); await wait(300);
    tell('Mmm… what a lovely story… zzz', 'mum', 2400); await wait(2500); A();
  }
  async function lullaby() {
    const seq = [0, 0, 3, 3, 4, 4, 3], keyIdx = [0, 1, 2, 4, 5], cols = ['#ff7a7a', '#ffb347', '#ffe066', '#6bcb77', '#6aa6ff'];
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">🎵</span><b>${esc(context.message('Let’s play Mummy a lullaby! Tap the glowing note.'))}</b></div><div class="mc-keys">${cols.map((c, i) => `<button class="mc-key" data-k="${i}" style="--c:${c}" aria-label="Note ${i + 1}"></button>`).join('')}</div><div class="mc-dots">${seq.map(() => '<i></i>').join('')}</div>`;
    panel.classList.remove('busy');
    const keys = [...panel.querySelectorAll('.mc-key')], dots = [...panel.querySelectorAll('.mc-dots i')];
    for (let i = 0; i < seq.length; i++) {
      keys[seq[i]].classList.add('glow');
      await new Promise((res) => { const hs = keys.map((k, ki) => { const h = () => { FX.sfx.note(keyIdx[ki], .5); FX.anim(k, [{ transform: 'translateY(0)' }, { transform: 'translateY(6px)' }, { transform: 'translateY(0)' }], { duration: 200 }); const r = k.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top, { kind: 'notes', n: 2 }); if (ki === seq[i]) { keys.forEach((kk, j) => kk.removeEventListener('pointerdown', hs[j])); res(); } else FX.shake(k); }; k.addEventListener('pointerdown', h); return h; }); });
      keys[seq[i]].classList.remove('glow'); dots[i].classList.add('on'); A();
    }
    FX.dinoState(dino, 'happy', 1500); await happy('What a beautiful lullaby. My heart is so full…', 2800);
  }
  async function lightsOut() {
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">💡</span><b>${esc(context.message('Time to turn off the light. Tap the switch on the wall!'))}</b></div>`;
    panel.classList.remove('busy');
    await new Promise((res) => { const sw = document.createElement('button'); sw.className = 'mc-hotspot mc-switch'; sw.style.cssText = 'left:284px;top:184px;width:50px;height:66px'; sw.setAttribute('aria-label', 'Light switch'); layer.append(sw); sw.addEventListener('pointerdown', () => { sw.remove(); res(); }); });
    FX.sfx.thud(); FX.sfx.tap(); layer.classList.add('lights-off'); dark.innerHTML = '<span class="gs g1">✨</span><span class="gs g2">⭐</span><span class="gs g3">✨</span><span class="gs g4">⭐</span><span class="gs g5">✨</span><i class="bk-ff" style="left:30%;top:60%"></i><i class="bk-ff f2" style="left:60%;top:70%"></i><i class="bk-ff f3" style="left:80%;top:50%"></i>';
    mum.classList.add('sleeping'); FX.sfx.sparkle();
    FX.ambient('night', { front: false });
    await wait(1800); A();
    // the dinosaurs tiptoe over and curl up to sleep
    FX.dinoState(dino, 'walk'); putDino(330, 470, 1, true); await wait(1800); FX.dinoState(dino, 'sleep'); dino.setAttribute('data-base', 'sleep');
    tell('Zzz… goodnight, little dinosaurs…', 'mum', 3600); await wait(3800); A();
    panel.innerHTML = `<div class="mc-ask mc-end"><span class="mc-thought">💤</span><b>${esc(context.message('Goodnight, Mummy. Sweet dreams!'))}</b></div>`;
    FX.celebrate(); await wait(2200); A();
    window.removeEventListener('resize', fitScene); mo.disconnect();
    context.advance('you looked after Mummy Courtney so well and she is fast asleep. Sweet dreams!');
  }
}
