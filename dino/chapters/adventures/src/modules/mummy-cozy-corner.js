// Mummy's Cozy Corner — a little story game.
// Mummy comes home very tired. The player sends a dinosaur helper to fetch things so she can
// relax in the living room (a comfy armchair, a clay cup of leaf tea, a bowl of berries, a feather fan), then it is bedtime:
// she is tucked in, her pillow is fluffed, a bedtime story is read, a lullaby is played, a goodnight
// nuzzle is given and finally the light goes out. Wrong choices are funny, never punished.
// Now a real two-part story with choices that change what happens: the weather outside (which brings
// an extra job), the order of the jobs, which settle-down comes first, who stars in the story and
// which tune is played — plus three hidden gems in each room and a shelf that remembers the
// cosiest evenings so far.
import { attachBonus, collect, collection } from "../adv-kit.js?v=du-7df8fa9b17a78b51";
const FX = window.DUFX;
const W = 800, H = 500;
const HELPERS = [
  { id: 'bronto', name: 'Bronto', color: 'orange' }, { id: 'tricera', name: 'Tricky', color: 'teal' },
  { id: 'stego', name: 'Stego', color: 'purple' }, { id: 'trex', name: 'Rexy', color: 'green' }, { id: 'raptor', name: 'Zippy', color: 'red' },
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* A glyph written inside an SVG <text> is a font drawing for the life of that
 * picture: no hydrator walks inside SVG text, so nothing can ever put a real
 * specimen there afterwards. These shelf toys are blitted from the object
 * library now, at the same place and size, and the emoji stays only as the
 * fallback for a specimen this valley has no photograph of. */
const specimen = (glyph, x, y, size, cls) => {
  const tag = cls ? ` class="${cls}"` : '';
  const O = FX.objects;
  if (!O || !O.has(glyph)) return `<text x="${x}" y="${y}" font-size="${size}"${tag}>${glyph}</text>`;
  const s = Math.round(size * 1.1);
  return `<image href="${O.url(glyph)}"${tag} x="${x}" y="${Math.round(y - s * 0.82)}" width="${s}" height="${s}"/>`;
};

/* ---------------------------------------------------------------- the evening choices */
// The weather is not decoration: it changes which extra job Mummy asks for, what falls past the
// window and what she says, so one evening is not the same story as the last.
const WEATHERS = [
  { id: 'rain', name: 'Wet and rainy', e: '🌧️', fall: '💧', ambient: 'rain', line: 'It is pitter-patter rain outside, so something warm to sip would be perfect.', job: 'soup' },
  { id: 'wind', name: 'Blustery', e: '💨', fall: '🍃', ambient: 'meadow', line: 'The wind is banging about, so let’s hang something across the doorway.', job: 'curtain' },
  { id: 'snow', name: 'Snowy', e: '❄️', fall: '❄', ambient: 'night', line: 'Snow is falling softly. Mummy needs something extra behind her back.', job: 'cushion' },
  { id: 'clear', name: 'Warm and clear', e: '🌙', fall: '✨', ambient: 'meadow', line: 'A warm, starry evening. Mummy could do with a cool drink by the window.', job: 'drink' },
];
const STARS = [{ id: 'stego', name: 'Stego', color: 'purple' }, { id: 'tricera', name: 'Tricky', color: 'teal' }, { id: 'bronto', name: 'Bronto', color: 'orange' }, { id: 'raptor', name: 'Zippy', color: 'red' }];
const TUNES = [
  { name: 'Twinkly Stars', icon: '🌟', seq: [0, 0, 3, 3, 4, 4, 3] },
  { name: 'Sleepy Log Drum', icon: '🪘', seq: [4, 3, 0, 0, 3, 4, 3] },
  { name: 'Stone Chime Waltz', icon: '🎹', seq: [0, 2, 4, 2, 0, 2, 4] },
];
// Extra jobs the weather brings along — more content in the same cosy shape.
// Every one of them is filled with something this valley can grow, make or find.
const WEATHER_JOBS = {
  soup: { id: 'soup', menu: '🍄 Broth', from: 'left', prompt: 'All that rain makes the mushrooms come up. A warm bowl of broth, shall we?', thought: '🍄?', dest: { x: 470, y: 452, ix: 560, iy: 398 }, size: 56, hint: 'Something warm you can sip from a bowl.', options: [{ e: '🍄', label: 'Mushroom broth', right: true }, { e: '🧊', label: 'A cold icicle', quip: 'Brr! Cold broth makes me shiver!' }, { e: '🥌', label: 'A round stone', quip: 'Stones are for skipping, not for soup!' }] },
  curtain: { id: 'curtain', menu: '🎋 Reeds', from: 'right', prompt: 'A draught is sneaking in past the door. Let’s hang something across it.', thought: '🎋?', dest: { x: 430, y: 452, ix: 610, iy: 420 }, size: 56, hint: 'Something long and leafy to shut the doorway with.', options: [{ e: '🎋', label: 'A bundle of reeds', right: true }, { e: '🎒', label: 'A school bag', quip: 'My school bag is full of rocks!' }, { e: '🦴', label: 'An old bone', quip: 'A bone won’t keep the wind out!' }] },
  cushion: { id: 'cushion', menu: '🟠 Cushion', from: 'right', prompt: 'Snowy days need a squishy cushion behind the back.', thought: '🟠?', dest: { x: 470, y: 452, ix: 470, iy: 400 }, size: 58, hint: 'Something soft you put behind your back on a chair.', options: [{ e: '🟠', label: 'A squishy amber cushion', right: true }, { e: '⬛', label: 'A slab of obsidian', quip: 'A stone slab would give me a sore back!' }, { e: '🌰', label: 'A seed cone', quip: 'A cone would go flat and prickly!' }] },
  drink: { id: 'drink', menu: '💧 Drink', from: 'left', prompt: 'A sunny evening wants a cool drink with a straw of reed.', thought: '💧?', dest: { x: 470, y: 452, ix: 505, iy: 352 }, size: 54, hint: 'Something cold to sip on a warm evening.', options: [{ e: '💧', label: 'A jar of cool water', right: true }, { e: '🍯', label: 'A pot of honey', quip: 'Honey is sticky, not drinky!' }, { e: '🪣', label: 'An empty bucket', quip: 'A bucket with nothing in it?' }] },
};
// Gems are hidden in the rooms — spot them and the evening gets cosier. `w` is what the
// free hint says, so a stuck child always gets an exact, useful answer.
const HIDES = {
  living: [{ x: 96, y: 300, w: 'behind the plant on your left' }, { x: 640, y: 252, w: 'on top of the book shelf' }, { x: 250, y: 470, w: 'down by the edge of the rug' }],
  bed: [{ x: 120, y: 122, w: 'up in the night sky by the window' }, { x: 700, y: 192, w: 'beside the bedtime books' }, { x: 420, y: 470, w: 'on the floor at the foot of the bed' }],
};

// How many living-room jobs an evening holds: the base list grows with the level,
// and whatever the weather asks for is one job more.
const needJobs = (level) => (level >= 3 ? 6 : level >= 2 ? 5 : 4) + 1;

// The shelf of cosiest evenings, remembered on this device.
function bestCozy() {
  const runs = collection('cozy-runs');
  const o = { hearts: 0, jobs: 0, comfort: 0, runs: runs.length };
  runs.forEach((r) => { if ((r.hearts || 0) > o.hearts) o.hearts = r.hearts; if ((r.jobs || 0) > o.jobs) o.jobs = r.jobs; if ((r.comfort || 0) > o.comfort) o.comfort = r.comfort; });
  return o;
}

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
      <rect x="664" y="156" width="16" height="40" fill="#ff9f43"/><rect x="684" y="150" width="12" height="46" fill="#2ec4b6"/><rect x="700" y="160" width="18" height="36" fill="#e05a5a"/>${specimen('🦖', 740, 190, 30)}
      ${specimen('🪴', 670, 256, 28)}${specimen('🐚', 710, 258, 28)}</g></g>
    <g class="mc-lamp"><ellipse cx="590" cy="150" rx="120" ry="120" fill="url(#lg)" class="mc-glow"/><path d="M590 190V340M570 340H610" stroke="#8a5a30" stroke-width="8" stroke-linecap="round"/><path d="M552 190 L568 130 H612 L628 190Z" fill="#ffe08a" stroke="#e0b64a" stroke-width="4"/></g>
    <ellipse cx="400" cy="432" rx="260" ry="52" fill="#e58b8b"/><ellipse cx="400" cy="432" rx="210" ry="40" fill="none" stroke="#f7c6c6" stroke-width="6"/><ellipse cx="400" cy="432" rx="150" ry="27" fill="none" stroke="#f7c6c6" stroke-width="4"/>
    <g><rect x="500" y="352" width="112" height="14" rx="5" fill="#a8683a"/><rect x="512" y="366" width="12" height="62" fill="#8a4f28"/><rect x="588" y="366" width="12" height="62" fill="#8a4f28"/></g>
    <g><rect x="0" y="130" width="46" height="190" rx="6" fill="#d9eaf5" opacity=".0"/>${specimen('🍳', 8, 300, 46, 'mc-doorsign')}</g>
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
      <g><rect x="636" y="92" width="14" height="38" fill="#ff9f43"/><rect x="652" y="100" width="12" height="30" fill="#6bcb77"/><rect x="668" y="88" width="16" height="42" fill="#ff7aa8"/><rect x="686" y="96" width="14" height="34" fill="#4d96ff"/>${specimen('🦕', 712, 128, 30)}${specimen('🌀', 640, 190, 28)}${specimen('🥚', 696, 192, 28)}</g></g>
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
// `star` is the dinosaur the child chose, so the book they read out is about their own helper.
const BOOK = [
  { text: 'Once upon a time, a sleepy little dinosaur yawned a great big yawn…', art: (s) => `<div class="bk-sky">🌙<div class="bk-dino">${FX.dinoHTML(s.id, { state: 'sleep', color: s.color })}</div></div>` },
  { text: 'She looked up and counted the twinkling stars. One… two… three…', art: (s) => `<div class="bk-sky"><span class="bk-star s1">⭐</span><span class="bk-star s2">⭐</span><span class="bk-star s3">⭐</span><div class="bk-dino">${FX.dinoHTML(s.id, { color: s.color })}</div></div>` },
  { text: 'And the whole forest whispered, “Goodnight, sleepy dinosaur. Sweet dreams.”', art: (s) => `<div class="bk-sky bk-night">🌲<div class="bk-trio"><span>${FX.dinoHTML(s.id, { state: 'sleep', color: s.color })}</span><span>${FX.dinoHTML('trex', { state: 'sleep' })}</span><span>${FX.dinoHTML('raptor', { state: 'sleep', color: 'red' })}</span></div><i class="bk-ff"></i><i class="bk-ff f2"></i><i class="bk-ff f3"></i></div>` },
];

export function mountMummyCozyCorner(context) {
  attachBonus(context.stage);
  const level = context.level;
  const helperPool = HELPERS.slice(0, Math.min(HELPERS.length, 3 + Math.floor((level - 1) / 2)));
  const name = context.playerName || '';
  let helper = null, weather = null, left = false, room = 'living';
  // Everything the evening is worth remembering, so the closing line can name it out loud.
  const run = { hearts: 0, jobs: 0, bed: 0, slips: 0, streak: 0, bestStreak: 0, comfort: 0, parts: 0, secs: 0, story: null, tune: null, started: 0, jobTotal: 0 };
  const shelf = bestCozy();
  const root = context.stage;
  const alive = () => document.contains(root) && !left;
  const A = () => { if (!alive()) throw new Error('left'); };
  const say = (t) => context.speak && context.speak(context.message(t));
  const mo = new MutationObserver(() => { if (!document.contains(root)) { left = true; mo.disconnect(); } });
  mo.observe(document.body, { childList: true, subtree: true });
  FX.ambient(null);

  // ------------------------------------------------------------ choose a helper and the weather
  root.innerHTML = `<div class="mc-pick"><div class="mc-pick-mum">${FX.personHTML('mummy', { state: 'tired', size: .55 })}</div>
    <div><h2>Mummy’s Cozy Corner</h2><p>Mummy has had a very long day and she is <b>so</b> tired. Pick a dinosaur helper <b>and</b> the weather outside, then look after her all evening — <b>${needJobs(level)} jobs</b> in the living room, then bedtime. There are <b>gems hidden</b> in every room, too!</p></div></div>
    <div class="mc-helpers">${helperPool.map((h, i) => `<button class="mc-helper" data-h="${i}"><span class="mc-helper-art">${FX.dinoHTML(h.id, { color: h.color })}</span><b>${h.name}</b></button>`).join('')}</div>
    <p style="font-weight:900;margin:12px 0 4px;text-align:center">What is the weather like outside?</p>
    <div class="mc-opts" id="mcWeather">${WEATHERS.map((w, i) => `<button class="mc-opt" data-w="${i}"><span class="mc-opt-art">${w.e}</span><small>${w.name}</small></button>`).join('')}</div>
    <p id="mcShelf" style="margin:12px 0;font-weight:800;color:#5b2b52;background:#fbe6f3;border-radius:16px;padding:6px 14px;text-align:center">${shelf.runs
      ? '🏆 Cosiest evenings so far: <b>' + shelf.hearts + ' 💎 gems</b> spotted · <b>' + shelf.jobs + ' jobs</b> done · ' + shelf.runs + ' evening' + (shelf.runs === 1 ? '' : 's') + ' tucked in'
      : '🌙 No evenings tucked in on this device yet — this is the very first one!'}</p>
    <button id="mcGo" style="margin:6px auto 0;border:0;border-radius:22px;background:#fff;padding:12px 26px;font:900 1.1rem system-ui;box-shadow:0 5px 0 rgba(0,0,0,.1);cursor:pointer;opacity:.45" disabled>Start the evening 🌙</button>
    <p class="gentle-hint" style="text-align:center;margin-top:10px">Pick a helper and a weather to start. Wrong things are only silly, never naughty — and the 💡 button always helps for free.</p>`;
  const go = root.querySelector('#mcGo');
  const ready = () => { go.disabled = !(helper && weather); go.style.opacity = go.disabled ? '.45' : '1'; };
  root.querySelectorAll('.mc-helper').forEach((b) => {
    b.addEventListener('pointerenter', () => FX.dinoState(b.querySelector('.du-dino'), 'happy', 800));
    b.addEventListener('click', () => {
      helper = helperPool[Number(b.dataset.h)]; root.querySelectorAll('.mc-helper').forEach((x) => x.style.outline = '');
      b.style.outline = '4px solid #ffd45e'; FX.sfx.chirp(); FX.pop(b); ready();
    });
  });
  root.querySelectorAll('#mcWeather .mc-opt').forEach((b) => {
    b.addEventListener('click', () => {
      weather = WEATHERS[Number(b.dataset.w)]; root.querySelectorAll('#mcWeather .mc-opt').forEach((x) => x.style.outline = '');
      b.style.outline = '4px solid #ffd45e'; FX.sfx.tap(); FX.pop(b); say(weather.line); ready();
    });
  });
  go.addEventListener('click', () => { if (go.disabled) return; FX.sfx.win(); run.started = Date.now(); begin().catch((e) => { if (e.message !== 'left') console.error(e); }); });

  // ------------------------------------------------------------ scene plumbing
  let area, layer, bg, mum, mumWrap, dinoWrap, dino, items, bubble, panel, comfort = 0, moodEl, fit = 1, dark;
  let hintFor = null, chips = {};
  const need = level >= 3 ? 6 : level >= 2 ? 5 : 4;
  // style.css is not ours on this pass, so the chips are inline-styled like the rest of the new UI
  const chipHTML = (id, style, text) => `<span id="${id}" style="padding:4px 10px;border-radius:14px;font-weight:900;font-size:clamp(.66rem,1.6vw,.86rem);box-shadow:0 2px 0 rgba(0,0,0,.12);${style}">${text}</span>`;
  const setChip = (el, text) => { if (el && el.textContent !== text) { el.textContent = text; FX.pop && FX.pop(el); } }; // du-own-text the chip only ever holds words this file wrote
  function setChips() {
    setChip(chips.part, 'Part ' + (run.parts + 1) + ' of 2 · ' + (room === 'living' ? 'Living room' : 'Bedroom'));
    setChip(chips.jobs, room === 'living' ? '🧺 Job ' + run.jobs + ' of ' + run.jobTotal : '🌙 Bedtime step ' + run.bed + ' of ' + run.jobTotal);
    setChip(chips.spots, '💎 ' + run.hearts + ' gem' + (run.hearts === 1 ? '' : 's') + ' spotted');
  }
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
  const mood = (n) => { comfort = Math.min(5, comfort + n); moodEl.innerHTML = window.DUICONS.stars(comfort, { max: 5, size: 22 }); };

  async function begin() {
    root.innerHTML = `<div class="mc-wrap"><div class="mc-area"><div class="mc-layer"><div class="mc-bgbox"></div><div class="mc-items"></div>
      <div class="mc-mum"></div><div class="mc-dino"></div><div class="mc-dark"></div></div><div class="mc-mood" aria-label="How cosy Mummy feels"></div><div class="mc-bubble"></div></div><div class="mc-panel"></div></div>`;
    area = root.querySelector('.mc-area'); layer = area.querySelector('.mc-layer'); bg = layer.querySelector('.mc-bgbox'); items = layer.querySelector('.mc-items');
    mumWrap = layer.querySelector('.mc-mum'); dinoWrap = layer.querySelector('.mc-dino'); dark = layer.querySelector('.mc-dark'); moodEl = area.querySelector('.mc-mood'); bubble = area.querySelector('.mc-bubble'); panel = root.querySelector('.mc-panel');
    bg.innerHTML = livingRoom();
    mumWrap.innerHTML = FX.personHTML('mummy', { state: 'walk', size: 1 }); mum = mumWrap.firstElementChild;
    dinoWrap.innerHTML = FX.dinoHTML(helper.id, { color: helper.color, state: 'idle', size: 150 });
    dino = dinoWrap.firstElementChild;
    panel.innerHTML = '<div class="mc-ask"><span class="mc-thought">🏠</span><b>Mummy is coming home…</b></div>';
    // chip row above the scene: which part of the evening we are in, jobs done, gems spotted, and the free hint
    root.querySelector('.mc-wrap').insertAdjacentHTML('afterbegin',
      `<div id="mcChips" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center">` +
      chipHTML('mcPart', 'background:#17403a;color:#fff', 'Part 1 of 2 · Living room') +
      chipHTML('mcJobs', 'background:#fff6d8;color:#5c3b00', '🧺 Job 0 of ' + (need + 1)) +
      chipHTML('mcSpots', 'background:#ffe9f0;color:#7a1030', '💎 0 gems spotted') +
      chipHTML('mcShelf', 'background:#e6f6ff;color:#08415c', shelf.hearts ? window.DUICONS.i('trophy', { size: 16 }) + ' best evening ' + shelf.hearts + ' ✨' : window.DUICONS.i('trophy', { size: 16 }) + ' first evening') +
      '<button id="mcHint" style="border:0;border-radius:14px;background:#fff;padding:5px 12px;font:900 clamp(.66rem,1.6vw,.86rem) system-ui;box-shadow:0 2px 0 rgba(0,0,0,.12);cursor:pointer">💡 Hint</button></div>');
    chips = { part: root.querySelector('#mcPart'), jobs: root.querySelector('#mcJobs'), spots: root.querySelector('#mcSpots'), shelf: root.querySelector('#mcShelf') };
    root.querySelector('#mcHint').addEventListener('click', giveHint);
    run.jobTotal = need + 1; setChips();
    dressWeather(); hideHearts();
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
    tell(weather.line, 'mum', 3400); say(weather.line); await wait(2200); A();
    await livingTasks();
    await bedtime();
  }

  // ------------------------------------------------------------ weather, hidden gems and hints
  // Weather falls past the window only, so it reads as "outside" without touching the room art.
  function dressWeather() {
    layer.querySelectorAll('.mc-weather').forEach((e) => e.remove());
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('i'); s.className = 'mc-weather'; s.textContent = weather.fall;
      s.style.cssText = 'position:absolute;z-index:1;left:' + (66 + i * 25) + 'px;top:' + (58 + (i % 3) * 18) + 'px;font-style:normal;font-size:' + (16 + (i % 3) * 6) + 'px;opacity:.75;pointer-events:none';
      layer.append(s);
      FX.anim(s, [{ transform: 'translateY(0)' }, { transform: 'translate(' + (i % 2 ? 12 : -12) + 'px,180px)' }], { duration: 2600 + i * 260, delay: i * 300, iterations: Infinity, easing: 'linear' });
    }
    FX.ambient(weather.ambient, { front: false });
  }
  // Three gems hide in every room. Finding one is never required, always cheered.
  function hideHearts() {
    layer.querySelectorAll('.mc-find').forEach((e) => e.remove());
    HIDES[room].forEach((h, i) => {
      const b = document.createElement('button'); b.className = 'mc-find'; b.textContent = '💎'; b.dataset.where = h.w;
      b.setAttribute('aria-label', 'Hidden gem');
      b.style.cssText = 'position:absolute;z-index:6;left:' + (h.x - 14) + 'px;top:' + (h.y - 14) + 'px;width:30px;height:30px;border:0;background:transparent;cursor:pointer;font-size:19px;opacity:.34;filter:saturate(.7);padding:0';
      layer.append(b);
      b.addEventListener('pointerdown', () => {
        if (b.dataset.got) return;
        b.dataset.got = '1'; run.hearts += 1; setChips();
        b.style.opacity = 1; b.style.filter = 'none'; FX.sfx.sparkle(); FX.bounce(b);
        const r = b.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top, { kind: 'sparkle', n: 10, color: '#dff3ff' }); FX.floatText(r.left + r.width / 2, r.top - 8, 'found one!');
        tell('You spotted a gem! ' + (run.hearts === 3 ? 'That is every single one in here!' : 'There is ' + (3 - run.hearts) + ' more hiding in this room.'), 'dino', 2400);
        FX.pop(moodEl);
      });
    });
  }
  // The hint button always answers something true, and never costs a star.
  function giveHint() {
    const left = [...layer.querySelectorAll('.mc-find')].filter((h) => !h.dataset.got);
    const line = hintFor ? hintFor
      : left.length ? 'One gem is hiding ' + left[0].dataset.where + '.'
        : 'Look at what Mummy says, then tap the thing that matches. Silly answers only make her giggle.';
    tell('💡 ' + line, 'dino', 4200); say(line); FX.sfx.note(); FX.sfx.pop();
    if (!hintFor && left.length) { left[0].style.opacity = 1; left[0].style.filter = 'drop-shadow(0 0 12px #ffe066)'; FX.pop(left[0]); }
  }


  // ------------------------------------------------------------ asking for / fetching things
  async function choose(prompt, thought, options) {
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">${thought}</span><b>${esc(context.message(prompt))}</b></div><div class="mc-opts">${options.map((o, i) => `<button class="mc-opt" data-i="${i}" data-right="${o.right ? 1 : 0}"><span class="mc-opt-art">${o.art || o.e}</span><small>${esc(o.label)}</small></button>`).join('')}</div>`;
    panel.classList.remove('busy');
    return new Promise((res) => panel.querySelectorAll('.mc-opt').forEach((b) => b.addEventListener('click', () => { panel.classList.add('busy'); FX.sfx.tap(); FX.pop(b); res(options[Number(b.dataset.i)]); }, { once: true })));
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
  async function wrongGag(o, t) {
    const { from, dest } = t;
    context.oops(); run.slips += 1;
    const placed = await fetchTo(o, from, dest);
    if (mum.getAttribute('data-base') !== 'lie') FX.personState(mum, 'tired'); tell(o.quip || 'Ha ha, no thank you, darling!', 'mum', 2200); FX.sfx.boing(); FX.dinoState(dino, 'sad', 1400);
    await wait(1800); A();
    // the nudge says what to look for next time — never what they did wrong
    tell('So close! ' + (t.hint || 'Have another go — you will know it when you see it.'), 'dino', 2600);
    const r = dino.getBoundingClientRect(); FX.floatText(r.left + r.width / 2, r.top, 'nearly!');
    await wait(1200); A(); placed.remove(); FX.dinoState(dino, 'walk');
    dinoWrap.style.transition = 'none'; putDino(dest.x, dest.y, 1, from === 'left'); void dinoWrap.offsetWidth; putDino(from === 'left' ? -170 : W + 170, 452, 1, from === 'left'); await glide(dinoWrap, 1000);
    dinoWrap.style.transition = 'none'; putDino(from === 'left' ? -170 : W + 170, 452, 1, false); void dinoWrap.offsetWidth; FX.dinoState(dino, 'walk'); putDino(150, 452, 1, false); await glide(dinoWrap, 1000); FX.dinoState(dino, 'idle');
  }
  const PRAISE = { 3: 'Three right in a row — you know Mummy so well!', 5: 'Five in a row! She married the cleverest dinosaur.', 7: 'SEVEN! Roars of applause for you!' };
  async function ask(t) {
    for (;;) {
      hintFor = t.hint || 'Tap the thing that matches what Mummy just said.';
      const o = await choose(t.prompt, t.thought, shuffle(t.options)); A();
      if (o.right) {
        hintFor = null; run.streak += 1; if (run.streak > run.bestStreak) run.bestStreak = run.streak;
        tell(PRAISE[run.streak] || 'Ooh, yes please!', 'mum', 1600);
        const h = mumHead(); FX.sfx.good(); FX.burst(h[0], h[1], { kind: 'sparkle', n: 10 });
        const placed = await fetchTo(o, t.from, t.dest, t.size);
        FX.bounce(placed);
        return { o, placed };
      }
      run.streak = 0;
      await wrongGag(o, t);
    }
  }
  const happy = async (line, ms = 2400, heart = 1) => { if (mum.getAttribute('data-base') !== 'lie') FX.personState(mum, 'happy', 1300); FX.sfx.good(); FX.burst(...mumHead(), { kind: 'hearts', n: 8 }); tell(line, 'mum', ms); say(line); mood(heart); await wait(ms); A(); };
  const mumHead = () => { const r = mum.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * .15]; };

  // ------------------------------------------------------------ living room
  // Each job carries a `menu` label (so the child can choose the order) and a `hint`
  // (so the free help button always has something true to say).
  async function livingTasks() {
    const tasks = [
      { id: 'seat', from: 'right', menu: 'Armchair', pickArt: armchairSVG(70), hint: 'Mummy needs something to sit on.', prompt: 'Could we find somewhere comfy for Mummy to sit down?', thought: armchairSVG(34), dest: { x: 500, y: 452, ix: 330, iy: 398 }, size: 130,
        options: [{ art: armchairSVG(70), label: 'Comfy armchair', right: true }, { e: '🪨', label: 'A boulder', quip: 'A boulder? I’m not THAT tired!' }, { e: '🪣', label: 'Bucket', quip: 'A bucket? Hee hee, no thanks!' }] },
      { id: 'tea', from: 'left', menu: '🏺 Tea', hint: 'Something hot to sip from a clay cup.', prompt: 'Let’s make Mummy a nice hot cup of leaf tea.', thought: '🏺?', dest: { x: 470, y: 452, ix: 555, iy: 352 }, size: 56,
        options: [{ e: '🏺', label: 'A clay cup of tea', right: true }, { e: '🦴', label: 'A smelly old bone', quip: 'Pooey! That’s a bone, not a drink!' }, { e: '🕯️', label: 'A waxy candle', quip: 'I can’t drink candlelight!' }] },
      { id: 'berries', from: 'left', menu: '🍓 Nibble', hint: 'Mummy is peckish — find something she can eat.', prompt: 'Perhaps Mummy is a little bit hungry. What could she nibble?', thought: '🍓?', dest: { x: 470, y: 452, ix: 520, iy: 352 }, size: 54,
        options: [{ e: '🍓', label: 'A bowl of berries', right: true }, { e: '🪨', label: 'A river stone', quip: 'A stone would crack my teeth!' }, { e: '🍂', label: 'A dry leaf', quip: 'Leaves are for the nest, silly!' }] },
      { id: 'fan', from: 'right', menu: '🪶 Breeze', hint: 'Something soft and light to wave the air with.', prompt: 'It is warm in here. Mummy needs a cooling breeze.', thought: '💨?', dest: { x: 500, y: 452, ix: 620, iy: 430 }, size: 84,
        options: [{ e: '🪶', label: 'A big soft feather', right: true }, { e: '🪵', label: 'A heavy branch', quip: 'A branch? That’s for the fire!' }, { e: '🪓', label: 'A flint axe', quip: 'Bonk! Not a flint axe please!' }] },
    ];
    if (need >= 5) tasks.push({ id: 'flowers', from: 'right', menu: '💐 Flowers', hint: 'Something that smells lovely in a vase.', prompt: 'Something pretty would make Mummy smile.', thought: '💐?', dest: { x: 470, y: 452, ix: 590, iy: 352 }, size: 52, options: [{ e: '💐', label: 'Pretty flowers', right: true }, { e: '🌵', label: 'A prickly cycad', quip: 'Ouch, prickly! Not that one!' }, { e: '🐟', label: 'A smelly fish', quip: 'Fish belongs in a pool, not a vase!' }] });
    if (need >= 6) tasks.push({ id: 'slippers', from: 'left', menu: '☘ Slippers', hint: 'Something cosy and mossy for her tired feet.', prompt: 'Her feet are tired. What would be cosy?', thought: '☘?', dest: { x: 400, y: 452, ix: 300, iy: 462 }, size: 50, options: [{ e: '☘', label: 'Moss slippers', right: true }, { e: '🐚', label: 'Two sea shells', quip: 'Shells are hard, my love!' }, { e: '🧊', label: 'A block of ice', quip: 'Ice? No, no, no, my toes!' }] });
    tasks.push(WEATHER_JOBS[weather.job]);   // the weather always brings one extra job
    run.jobTotal = tasks.length; setChips();
    await doJob(tasks.shift()); A();        // Mummy sits down before anything else
    while (tasks.length) {
      const t = await pickJob(tasks); A();
      tasks.splice(tasks.indexOf(t), 1);
      await doJob(t); A();
    }
    FX.personState(mum, 'happy', 1600); tell('I feel so much better! But now I’m SO sleepy…', 'mum', 3200); say('I feel so much better! But now I am so sleepy…');
    FX.burst(...mumHead(), { kind: 'confetti', n: 18 }); FX.sfx.win();
    await wait(3400); A(); FX.personState(mum, 'yawn');
    await wait(2000); A();
  }
  // The child reads the job list and decides what comes next — same jobs, different evening.
  async function pickJob(list) {
    hintFor = 'Any of these would make Mummy happy. Tap the one you would like to fetch first.';
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">🧺</span><b>${esc(context.message('What shall we fetch for Mummy next? You choose the order!'))}</b></div><div class="mc-opts">${list.map((t, i) => `<button class="mc-opt" data-i="${i}"><span class="mc-opt-art">${t.pickArt || esc(t.menu.split(' ')[0])}</span><small>${esc(t.menu)}</small></button>`).join('')}</div>`;
    panel.classList.remove('busy');
    return new Promise((res) => panel.querySelectorAll('.mc-opt').forEach((b) => b.addEventListener('click', () => {
      hintFor = null; FX.sfx.tap(); FX.pop(b); res(list[Number(b.dataset.i)]);
    }, { once: true })));
  }
  async function doJob(t) {
    const { placed } = await ask(t); A();
    run.jobs += 1; setChips();
    if (t.id === 'seat') {
      FX.personState(mum, 'walk'); mumWrap.style.transition = 'transform 1.2s ease-in-out'; putMum(330, 440); await wait(1250); A();
      mumWrap.style.transition = 'transform .5s'; putMum(330, 428); FX.personState(mum, 'sit'); mum.setAttribute('data-base', 'sit'); FX.sfx.thud();
      placed.style.zIndex = 1; mumWrap.style.zIndex = 3;
      await happy('Ahhh, that’s so comfy. Thank you!', 2200);
    } else if (t.id === 'tea') { placed.insertAdjacentHTML('beforeend', '<i class="mc-steam"></i><i class="mc-steam s2"></i>'); await happy('Mmm, a lovely clay cup of tea. Just what I needed!', 2600); }
    else if (t.id === 'berries') { FX.personState(mum, 'happy', 1400); FX.sfx.chomp(); await wait(500); placed.style.opacity = .3; FX.burst(...mumHead(), { kind: 'sparkle', n: 14 }); await happy('Yum! Sweet berries. You’re so kind!', 2600); placed.remove(); }
    else if (t.id === 'fan') { await waft(placed); }
    else if (t.id === 'flowers') { await happy('Oh, flowers! They smell wonderful!', 2400); }
    else if (t.id === 'slippers') { await happy('Cosy mossy toes! Ahh, thank you!', 2400); }
    else if (t.id === 'soup') { FX.sfx.chomp(); placed.insertAdjacentHTML('beforeend', '<i class="mc-steam"></i>'); await happy('Warm mushroom broth! That is exactly what rain needs.', 2600); }
    else if (t.id === 'curtain') { FX.sfx.whoosh(); await happy('Reeds in the doorway! The draught has gone straight out of the window.', 2400); }
    else if (t.id === 'cushion') { FX.sfx.boing(); await happy('What a squishy cushion. My back says thank you!', 2400); }
    else if (t.id === 'drink') { FX.sfx.splash(); await happy('Cool water with a reed straw! Perfect on a starry evening.', 2600); }
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
    run.jobTotal = 5;
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">🌙</span><b>${esc(context.message('It is bedtime! Part 2 of the evening: let’s help Mummy into bed.'))}</b></div>`;
    await curtain(() => { room = 'bed'; run.parts = 1; bg.innerHTML = bedroom(); items.innerHTML = ''; FX.personState(mum, 'tired'); mum.setAttribute('data-base', 'tired'); mum.classList.remove('sleeping'); mumWrap.style.transition = 'none'; putMum(190, 440); putDino(130, 452, 1); dinoWrap.style.transition = 'none'; hideHearts(); dressWeather(); setChips(); });
    tell('Time for bed… I can barely keep my eyes open.', 'mum', 3000); say('Time for bed. I can barely keep my eyes open.'); await wait(3200); A();
    // Mummy walks to the bed and lies down
    FX.personState(mum, 'walk'); mumWrap.style.transition = 'transform 1.8s ease-in-out'; putMum(420, 420); await wait(1900); A();
    mumWrap.style.transition = 'none'; FX.personState(mum, 'lie'); mum.setAttribute('data-base', 'lie'); mum.classList.add('drowsy');
    mumWrap.style.transform = `translate(458px,252px)`; mumWrap.style.zIndex = 2; mumWrap.style.setProperty('--lk', 1);
    mum.style.setProperty('--k', .78); FX.sfx.thud(); await wait(600);
    // blanket
    const b = await ask({ id: 'blanket', from: 'left', hint: 'Something warm to pull up over her toes.', prompt: 'A warm, woven blanket would be perfect for Mummy.', thought: '🧶?', dest: { x: 330, y: 452, ix: 540, iy: 372 }, size: 10,
      options: [{ e: '🧶', label: 'A warm woven blanket', right: true }, { e: '🪣', label: 'A bucket', quip: 'A bucket won’t keep me warm!' }, { e: '📰', label: 'A newspaper', quip: 'A newspaper? It’s all rustly!' }] });
    b.placed.remove(); mumWrap.insertAdjacentHTML('afterend', '<div class="mc-bedblanket"></div>'); FX.sfx.pop(); const bl = layer.querySelector('.mc-bedblanket'); FX.pop(bl);
    await happy('Ohh, so warm and snuggly. Thank you, my love!', 2600); step();
    // pillow
    hintFor = 'The pillow is the big soft one at the head of the bed. Tap it four times!';
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">☁️</span><b>${esc(context.message('The pillow is squashed. Tap it to fluff it up!'))}</b></div><div class="mc-meter"><i></i></div>`;
    panel.classList.remove('busy');
    await new Promise((res) => { const hit = document.createElement('button'); hit.className = 'mc-hotspot'; hit.style.cssText = 'left:610px;top:262px;width:180px;height:70px'; hit.setAttribute('aria-label', 'Fluff the pillow'); layer.append(hit); let n = 0; hit.addEventListener('pointerdown', () => { n++; panel.querySelector('.mc-meter i').style.width = n / 4 * 100 + '%'; FX.sfx.pop(); const p = layer.querySelector('.mc-bg .mc-pillow') || null; const r = hit.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + 10, { kind: 'dust', n: 6 }); FX.anim(hit, [{ transform: 'scale(1)' }, { transform: 'scale(1.12,.86)' }, { transform: 'scale(1)' }], { duration: 240 }); const svgP = bg.querySelector('.mc-pillow'); if (svgP) { svgP.style.transformOrigin = '700px 302px'; FX.anim(svgP, [{ transform: 'scale(1)' }, { transform: 'scale(1.15,.8)' }, { transform: 'scale(1.06,1.1)' }, { transform: 'scale(1)' }], { duration: 300 }); } if (n >= 4) { hintFor = null; hit.remove(); res(); } }); });
    A(); await happy('That’s perfect. So soft and fluffy…', 2400); step();
    // which settle-down comes first? the child decides, so bedtime has an order of its own
    const first = await settleOrder();
    if (first === 'story') { await storyPart(); await songPart(); } else { await songPart(); await storyPart(); }
    // goodnight nuzzle
    hintFor = 'Your dinosaur is the shiny one by the bed. Tap it for a goodnight nuzzle.';
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">⭐</span><b>${esc(context.message('Let’s give Mummy a goodnight nuzzle. Tap your dinosaur!'))}</b></div>`;
    panel.classList.remove('busy');
    dinoWrap.style.transition = 'transform 1.2s ease-in-out'; putDino(720, 480, 1, true); await wait(1300); A();
    await new Promise((res) => { const handler = () => { dinoWrap.removeEventListener('pointerdown', handler); hintFor = null; res(); }; dinoWrap.style.pointerEvents = 'auto'; dinoWrap.classList.add('tap-me'); dinoWrap.addEventListener('pointerdown', handler); });
    dinoWrap.style.pointerEvents = 'none'; dinoWrap.classList.remove('tap-me'); A();
    FX.dinoState(dino, 'happy', 1600); FX.sfx.chirp(); const r = mum.getBoundingClientRect(); FX.burst(r.left + r.width * .8, r.top + r.height * .3, { kind: 'hearts', n: 16 });
    tell('Goodnight, my darling. I love you.', 'mum', 3000); say('Goodnight, my darling. I love you.'); mood(1); await wait(3200); A(); step();
    await lightsOut();
  }
  const step = () => { run.bed += 1; setChips(); };
  // Two ways to settle down, and the evening goes in the order the child chooses.
  async function settleOrder() {
    hintFor = 'Either one is lovely. Choose what you would do first.';
    const picks = [{ k: 'story', e: '📖', l: 'A story first' }, { k: 'song', e: '🎵', l: 'A song first' }];
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">❓</span><b>${esc(context.message('What should we do first, a story or a song? You decide!'))}</b></div><div class="mc-opts">` +
      picks.map((o) => `<button class="mc-opt" data-k="${o.k}"><span class="mc-opt-art">${o.e}</span><small>${o.l}</small></button>`).join('') + '</div>';
    panel.classList.remove('busy');
    /* Mummy repeats the child's own words, taken from the choice list rather
     * than the button: the layer that paints these buttons has already turned
     * the label into a picture by the time it is tapped. */
    return new Promise((res) => panel.querySelectorAll('.mc-opt').forEach((b) => b.addEventListener('click', () => { hintFor = null; FX.sfx.tap(); FX.pop(b); const o = picks.find((p) => p.k === b.dataset.k); tell('Good plan — ' + ((o && o.l) || 'that') + '!', 'mum', 1800); res(b.dataset.k); }, { once: true })));
  }
  async function storyPart() {
    const book = await ask({ id: 'book', from: 'right', hint: 'Something with pages to read out loud.', prompt: 'A bedtime story would be lovely.', thought: '📖?', dest: { x: 420, y: 452, ix: 330, iy: 396 }, size: 56,
      options: [{ e: '📖', label: 'A story book', right: true }, { e: '🔧', label: 'A spanner', quip: 'A spanner? That’s a boring bedtime story!' }, { e: '🪨', label: 'A boulder', quip: 'A boulder is too heavy to read!' }] });
    // who stars in the story? the child picks, and the book is drawn with that dinosaur
    hintFor = 'Pick whichever dinosaur you would like to read about.';
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">🌟</span><b>${esc(context.message('Who should star in tonight’s story?'))}</b></div><div class="mc-opts">` +
      STARS.map((s, i) => `<button class="mc-opt" data-i="${i}"><span class="mc-opt-art">${FX.dinoHTML(s.id, { color: s.color, state: 'happy' })}</span><small>${s.name}</small></button>`).join('') + '</div>';
    panel.classList.remove('busy');
    await new Promise((res) => panel.querySelectorAll('.mc-opt').forEach((b) => b.addEventListener('click', () => {
      hintFor = null; run.story = STARS[Number(b.dataset.i)]; FX.sfx.chirp(); FX.pop(b);
      tell('“' + run.story.name + '” is tonight’s star! What a good choice.', 'mum', 2200); res();
    }, { once: true })));
    A(); await storyBook(); book.placed.remove(); step();
  }
  async function songPart() {
    hintFor = 'Any tune will do — Mummy loves them all.';
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">🎵</span><b>${esc(context.message('Which lullaby shall we play for Mummy?'))}</b></div><div class="mc-opts">` +
      TUNES.map((t, i) => `<button class="mc-opt" data-i="${i}"><span class="mc-opt-art">${t.icon}</span><small>${t.name}</small></button>`).join('') + '</div>';
    panel.classList.remove('busy');
    const t = await new Promise((res) => panel.querySelectorAll('.mc-opt').forEach((b) => b.addEventListener('click', () => { hintFor = null; FX.sfx.note(2, .5); FX.pop(b); res(TUNES[Number(b.dataset.i)]); }, { once: true })));
    A(); run.tune = t; await lullaby(t); step();
  }
  async function storyBook() {
    const star = run.story || STARS[0];
    const ov = document.createElement('div'); ov.className = 'mc-book'; area.append(ov); let p = 0;
    // the book is about the dinosaur the child picked, and it counts the pages as it goes
    const show = () => {
      const text = BOOK[p].text.replace('a sleepy little dinosaur', star.name + ' the little dinosaur');
      ov.innerHTML = `<div class="bk-page"><div class="bk-art">${BOOK[p].art(star)}</div><p>${esc(context.message(text))}</p>` +
        `<small style="display:block;font-weight:900;color:#7a4b78">Page ${p + 1} of ${BOOK.length}</small>` +
        `<button class="bk-next">${p < BOOK.length - 1 ? 'Turn the page ▶' : 'The end 💤'}</button></div>`;
      FX.pop(ov.firstElementChild); FX.sfx.whoosh(); say(text);
    };
    show();
    await new Promise((res) => ov.addEventListener('click', function h(e) {
      if (!e.target.closest('.bk-next')) return;
      p++; FX.sfx.tap(); FX.sfx.sparkle();
      const r = e.target.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top, { kind: 'stars', n: 6 });
      if (p >= BOOK.length) { ov.removeEventListener('click', h); res(); } else { show(); }
    }));
    ov.remove(); A(); mum.classList.remove('drowsy'); mum.classList.add('sleeping'); await wait(300);
    tell('Mmm… what a lovely story about ' + star.name + '… zzz', 'mum', 2400); await wait(2500); A();
  }
  async function lullaby(tune) {
    const seq = (tune && tune.seq) || [0, 0, 3, 3, 4, 4, 3], keyIdx = [0, 1, 2, 4, 5], cols = ['#ff7a7a', '#ffb347', '#ffe066', '#6bcb77', '#6aa6ff'];
    hintFor = 'Tap the note that is glowing brightest — it is the next one in ' + ((tune && tune.name) || 'the tune') + '.';
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">🎵</span><b>${esc(context.message('Let’s play Mummy ' + ((tune && tune.name) || 'a lullaby') + '! Tap the glowing note.'))}</b></div><div class="mc-keys">${cols.map((c, i) => `<button class="mc-key" data-k="${i}" style="--c:${c}" aria-label="Note ${i + 1}"></button>`).join('')}</div><div class="mc-dots">${seq.map(() => '<i></i>').join('')}</div>`;
    panel.classList.remove('busy');
    const keys = [...panel.querySelectorAll('.mc-key')], dots = [...panel.querySelectorAll('.mc-dots i')];
    for (let i = 0; i < seq.length; i++) {
      keys[seq[i]].classList.add('glow');
      await new Promise((res) => { const hs = keys.map((k, ki) => { const h = () => { FX.sfx.note(keyIdx[ki], .5); FX.anim(k, [{ transform: 'translateY(0)' }, { transform: 'translateY(6px)' }, { transform: 'translateY(0)' }], { duration: 200 }); const r = k.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top, { kind: 'notes', n: 2 }); if (ki === seq[i]) { keys.forEach((kk, j) => kk.removeEventListener('pointerdown', hs[j])); res(); } else { run.slips += 1; context.oops(); tell('So close! That was the ' + (ki + 1) + 'th note — the glowing one is the ' + (seq[i] + 1) + 'th.', 'dino', 2200); FX.shake(k); } }; k.addEventListener('pointerdown', h); return h; }); });
      keys[seq[i]].classList.remove('glow'); dots[i].classList.add('on');
      // the note meter is the child's progress bar through the tune
      panel.querySelector('.mc-ask b').textContent = context.message((tune && tune.name ? tune.name : 'Twinkly Stars') + ' — note ' + (i + 1) + ' of ' + seq.length + '!');
      A();
    }
    hintFor = null;
    FX.dinoState(dino, 'happy', 1500); FX.burst(...mumHead(), { kind: 'notes', n: 12 }); await happy('What a beautiful lullaby. My heart is so full…', 2800);
  }
  async function lightsOut() {
    panel.innerHTML = `<div class="mc-ask"><span class="mc-thought">💡</span><b>${esc(context.message('Time to turn off the light. Tap the switch on the wall!'))}</b></div>`;
    panel.classList.remove('busy');
    await new Promise((res) => { const sw = document.createElement('button'); sw.className = 'mc-hotspot mc-switch'; sw.style.cssText = 'left:284px;top:184px;width:50px;height:66px'; sw.setAttribute('aria-label', 'Light switch'); layer.append(sw); sw.addEventListener('pointerdown', () => { sw.remove(); res(); }); });
    FX.sfx.thud(); FX.sfx.tap(); layer.classList.add('lights-off'); dark.innerHTML = '<span class="gs g1">✨</span><span class="gs g2">✨</span><span class="gs g3">✨</span><span class="gs g4">✨</span><span class="gs g5">✨</span><i class="bk-ff" style="left:30%;top:60%"></i><i class="bk-ff f2" style="left:60%;top:70%"></i><i class="bk-ff f3" style="left:80%;top:50%"></i>';
    mum.classList.add('sleeping'); FX.sfx.sparkle();
    FX.ambient('night', { front: false });
    await wait(1800); A();
    // the dinosaurs tiptoe over and curl up to sleep
    FX.dinoState(dino, 'walk'); putDino(330, 470, 1, true); await wait(1800); FX.dinoState(dino, 'sleep'); dino.setAttribute('data-base', 'sleep');
    tell('Zzz… goodnight, little dinosaurs…', 'mum', 3600); await wait(3800); A();
    // the evening is written on the shelf, and the last line names what the child actually did
    run.secs = Math.max(1, Math.round((Date.now() - run.started) / 1000));
    run.comfort = comfort;
    const jobs = run.jobs + run.bed, heartsAll = run.hearts >= 6;
    collect('cozy-runs', { hearts: run.hearts, jobs, comfort, slips: run.slips, weather: weather.id, story: run.story ? run.story.name : null, tune: run.tune ? run.tune.name : null, secs: run.secs, level });
    panel.innerHTML = `<div class="mc-ask mc-end"><span class="mc-thought">💤</span><b>${esc(context.message('Goodnight, Mummy. Sweet dreams!'))}</b></div>` +
      `<p id="mcRun" style="margin:0;text-align:center;font-weight:800;color:#5b2b52;background:#fbe6f3;border-radius:16px;padding:8px 14px">` +
      `💎 <b>${run.hearts}</b> of 6 gems · 🧺 <b>${jobs}</b> jobs · ⏱ <b>${run.secs}s</b>` +
      (heartsAll ? '<br>✨ Every single gem found!' : shelf.hearts > run.hearts ? '<br>Best evening so far has ' + shelf.hearts + ' 💎 — you can beat that!' : '<br>A new best for gems!') +
      `<br><small style="font-weight:700">${weather.name} outside · a story about ${run.story ? run.story.name : 'a sleepy dinosaur'} · ${run.tune ? run.tune.name : 'a lullaby'}</small></p>`;
    FX.pop(panel.querySelector('#mcRun')); FX.burst(...mumHead(), { kind: 'hearts', n: 12 });
    FX.celebrate(); await wait(3400); A();
    window.removeEventListener('resize', fitScene); mo.disconnect();
    context.advance('You looked after Mummy through ' + jobs + ' jobs on a ' + weather.name.toLowerCase() + ' evening, spotted ' + run.hearts + ' hidden gems, read her a story about ' +
      (run.story ? run.story.name : 'a sleepy dinosaur') + ' and played ' + (run.tune ? run.tune.name : 'a lullaby') + '. She is fast asleep — all because of you. Sweet dreams!');
  }
}
