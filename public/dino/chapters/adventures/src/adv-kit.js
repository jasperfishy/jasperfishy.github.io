/* Dino Adventures — shared play kit.
 *
 *   const play = createPlay(context, { emoji, title, instruction, theme, buddy });
 *   play.board                       the element the game draws into (sits on a living, layered scene)
 *   play.good(el, {text})            right answer: sparkles, sound that climbs with the streak, buddy cheers, streak grows
 *   play.miss(el, 'kind words')      wrong answer, kindly: a soft wobble, the buddy tilts its head and encourages
 *   play.say('words')                the buddy dinosaur says something
 *   play.finish('message')           star rating (1-3), flourish, then context.advance()
 * Also: sticker album and butterfly collection (saved on this device), roaming bonus butterflies,
 * little dinosaurs that wander along the ground and join in the cheering.
 * Everything quietly respects reduce-motion, the sound switch and the calmer-celebrations setting.
 */

const EXTRAS_KEY = "du-adv-extras-v1";

export const STICKERS = ["🦖", "🦕", "🐊", "🦎", "🐢", "🦴", "🥚", "🌋", "🌴", "🌿", "🍃", "🦋", "🐞", "🐝", "🌈", "☀️",
  "🌙", "⭐", "🌟", "💎", "🔮", "🪨", "🍓", "🍎", "🥕", "🐟", "🦐", "🐚", "🌸", "🌻", "🍄", "🎈",
  "🎁", "🎺", "🥁", "🎨", "🧩", "🔭", "🚀", "🛸", "🦜", "🦉", "🐙", "🦈", "🐳", "🦀", "🪽", "👑"];

function fx() { return window.DUFX || {}; }
function motionOK() { const F = fx(); return !F.motionOK || F.motionOK(); }
function calm() { const F = fx(); return !!(F.settings && F.settings.calm); }
function sfx(name, a) { const F = fx(); try { if (F.sfx && F.sfx[name]) F.sfx[name](a); } catch (e) { /* sound is optional */ } }
function burst(x, y, o) { const F = fx(); try { if (F.burst && motionOK()) F.burst(x, y, o); } catch (e) { /* particles are optional */ } }
function pickOne(list) { return list[Math.floor(Math.random() * list.length)]; }
function escapeText(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

export function shuffle(list) {
  const r = list.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; }
  return r;
}

/* ---------------------------------------------------------------- saved extras */
function loadExtras() {
  try {
    const raw = JSON.parse(localStorage.getItem(EXTRAS_KEY) || "null") || {};
    return { stickers: Array.isArray(raw.stickers) ? raw.stickers : [], butterflies: Number(raw.butterflies) || 0, best: raw.best || {}, col: raw.col || {} };
  } catch (e) { return { stickers: [], butterflies: 0, best: {}, col: {} }; }
}
function saveExtras(x) { try { localStorage.setItem(EXTRAS_KEY, JSON.stringify(x)); } catch (e) { /* low on space */ } }
export function getExtras() { return loadExtras(); }

/* A new sticker for the album; returns the sticker or null once the album is full. */
export function awardSticker() {
  const x = loadExtras();
  const left = STICKERS.filter(function (s) { return x.stickers.indexOf(s) < 0; });
  if (!left.length) return null;
  const s = pickOne(left);
  x.stickers.push(s); saveExtras(x);
  return s;
}
export function addButterfly() {
  const x = loadExtras();
  x.butterflies += 1;
  let sticker = null;
  saveExtras(x);
  if (x.butterflies % 5 === 0) sticker = awardSticker();
  return { total: x.butterflies, sticker: sticker };
}
/* little saved collections, e.g. hatched babies: collect("nursery", {species, color, name}) */
export function collect(key, item) {
  const x = loadExtras();
  const list = x.col[key] = x.col[key] || [];
  list.push(item);
  if (list.length > 24) list.shift();
  saveExtras(x);
  return list.length;
}
export function collection(key) { return loadExtras().col[key] || []; }
export function noteBest(id, stars) {
  const x = loadExtras();
  if ((x.best[id] || 0) < stars) { x.best[id] = stars; saveExtras(x); }
}
export function albumHTML() {
  const x = loadExtras();
  return '<div class="pk-album"><p class="pk-album-count"><b>' + x.stickers.length + '</b> of ' + STICKERS.length + ' stickers · <b>' + x.butterflies + '</b> butterflies caught 🦋</p>' +
    '<div class="pk-album-grid">' + STICKERS.map(function (s) {
      const got = x.stickers.indexOf(s) >= 0;
      return '<span class="pk-sticker' + (got ? " got" : "") + '" aria-label="' + (got ? "A sticker" : "A sticker still to find") + '">' + (got ? s : "?") + '</span>';
    }).join("") + '</div><p class="pk-album-tip">Finish rounds and catch the fluttering butterflies to fill your album!</p></div>';
}

/* ---------------------------------------------------------------- the living scene */
const THEMES = {
  meadow: { sun: "☀️", fly: "🦋", cls: "pk-meadow" },
  night: { sun: "🌙", fly: "✨", cls: "pk-night" },
  cave: { sun: "💎", fly: "🦇", cls: "pk-cave" },
  water: { sun: "🫧", fly: "🐟", cls: "pk-water" },
  sky: { sun: "☀️", fly: "🪁", cls: "pk-sky" },
  dig: { sun: "☀️", fly: "🦎", cls: "pk-dig" },
  rain: { sun: "🌧️", fly: "🌈", cls: "pk-rain" },
  party: { sun: "🎉", fly: "🎈", cls: "pk-party" }
};
const BUDDIES = ["tricera", "stego", "bronto", "raptor", "trex"];
const WANDERERS = ["tricera", "stego", "bronto", "raptor", "trex"];
const COLORS = ["green", "teal", "purple", "orange", "pink", "blue", "yellow"];
const KIND = ["Nearly! Try another 💛", "Oops, that one's shy. Have another go!", "So close! You can do it 🌟", "Hmm, not that one. Look again!", "That's okay, keep exploring!"];
const PRAISE = ["Yay!", "Great!", "Lovely!", "Super!", "Wow!", "Roarsome!", "Brilliant!", "Dino-mite!"];
const STREAK_WORDS = { 3: "Hat-trick! 🔥", 5: "On fire! 🔥🔥", 8: "Unstoppable! 🚀", 12: "Legend! 👑" };

export function createPlay(context, o) {
  o = o || {};
  const F = fx();
  const theme = THEMES[o.theme] || THEMES.meadow;
  const stage = context.stage;
  const state = { good: 0, misses: 0, streak: 0, best: 0, alive: true, finished: false, timers: [], wanderers: new Set(), butterfliesHere: 0 };
  const buddySpecies = o.buddy === false ? null : (o.buddy && o.buddy !== true ? o.buddy : BUDDIES[(context.level || 1) % BUDDIES.length]);

  stage.innerHTML =
    '<div class="pk-head"><span class="pk-emoji" aria-hidden="true">' + (o.emoji || "🦖") + '</span><div class="pk-headtext"><h2>' + escapeText(o.title || "") + '</h2><p>' + escapeText(context.message ? context.message(o.instruction || "") : (o.instruction || "")) + '</p></div></div>' +
    '<div class="pk-hud" aria-live="polite"><span class="pk-chip pk-chip-streak" title="Right in a row">🔥 <b data-k="streak">0</b></span>' +
    '<span class="pk-chip pk-chip-good" title="Things you got right">⭐ <b data-k="good">0</b></span>' +
    '<span class="pk-chip pk-chip-bf" title="Butterflies you have caught">🦋 <b data-k="bf">' + loadExtras().butterflies + '</b></span></div>' +
    '<div class="pk-scene ' + theme.cls + '">' +
      '<div class="pk-back" aria-hidden="true"><i class="pk-sun">' + theme.sun + '</i>' +
      '<i class="pk-cloud pc1"></i><i class="pk-cloud pc2"></i><i class="pk-cloud pc3"></i>' +
      '<i class="pk-hill ph1"></i><i class="pk-hill ph2"></i><i class="pk-hill ph3"></i><span class="pk-twinkles"></span></div>' +
      '<div class="pk-board"></div>' +
      '<div class="pk-ground" aria-hidden="true"><span class="pk-grass"></span><span class="pk-say"></span></div>' +
    '</div>' +
    '<p class="gentle-hint pk-hint"></p>';

  const scene = stage.querySelector(".pk-scene");
  const board = stage.querySelector(".pk-board");
  const ground = stage.querySelector(".pk-ground");
  const sayEl = stage.querySelector(".pk-say");
  const hintEl = stage.querySelector(".pk-hint");
  const hud = stage.querySelector(".pk-hud");
  const play = { board: board, scene: scene, state: state, stage: stage };

  // twinkles / fireflies
  const tw = stage.querySelector(".pk-twinkles");
  let dots = "";
  const dotCount = (o.theme === "night" || o.theme === "cave") ? 22 : 7;
  for (let i = 0; i < dotCount; i++) dots += '<b style="left:' + (Math.random() * 98).toFixed(1) + '%;top:' + (Math.random() * 62).toFixed(1) + '%;--d:' + (-Math.random() * 6).toFixed(2) + 's;--s:' + (0.6 + Math.random() * 1.1).toFixed(2) + '"></b>';
  tw.innerHTML = dots;

  // buddy
  let buddyEl = null;
  if (buddySpecies && F.dinoHTML) {
    buddyEl = document.createElement("span");
    buddyEl.className = "pk-buddy";
    buddyEl.innerHTML = F.dinoHTML(buddySpecies, { color: o.buddyColor || pickOne(COLORS), state: "idle", size: "100%" });
    ground.appendChild(buddyEl);
    if (motionOK()) {
      F.anim && F.anim(buddyEl, [{ transform: "translateX(120px) scale(.6)", opacity: 0 }, { transform: "translateX(0) scale(1)", opacity: 1 }], { duration: 700, easing: "cubic-bezier(.2,.9,.3,1.2)" });
    }
    buddyEl.addEventListener("pointerdown", function () {
      F.dinoState && F.dinoState(buddyEl, "happy", 900);
      sfx("chirp");
      const r = buddyEl.getBoundingClientRect();
      burst(r.left + r.width * 0.55, r.top + r.height * 0.3, { kind: "hearts", n: 6 });
      play.say(pickOne(["Hello, friend! 💚", "I'm cheering for you!", "You're doing great!", "Tickle tickle! 🦖"]));
    });
  }

  function later(fn, ms) { const t = window.setTimeout(function () { if (state.alive && scene.isConnected) fn(); }, ms); state.timers.push(t); return t; }
  const alive = function () { return state.alive && scene.isConnected; };

  play.hint = function (text, raw) { hintEl.textContent = (context.message && !raw) ? context.message(text) : text; };
  if (o.hint) play.hint(o.hint);

  let sayTimer = 0;
  play.say = function (text, ms) {
    sayEl.textContent = text;
    sayEl.classList.add("on");
    window.clearTimeout(sayTimer);
    sayTimer = window.setTimeout(function () { sayEl.classList.remove("on"); }, ms || 2300);
    if (context.speak && o.speak !== false && context.speechEnabled) context.speak(text);
  };
  function bump(key, value) {
    const b = hud.querySelector('[data-k="' + key + '"]');
    if (!b) return;
    b.textContent = value;
    F.pop && F.pop(b.parentElement);
  }
  function centreOf(el) {
    if (el && typeof el.getBoundingClientRect === "function") { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    if (el && typeof el.x === "number") return el;
    const r = scene.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function cheerAll(stateName, ms) {
    if (buddyEl) F.dinoState && F.dinoState(buddyEl, stateName, ms);
    state.wanderers.forEach(function (w) { F.dinoState && F.dinoState(w.el, stateName, ms); });
  }

  play.good = function (el, opt) {
    opt = opt || {};
    state.good += 1; state.streak += 1; state.best = Math.max(state.best, state.streak);
    bump("good", state.good); bump("streak", state.streak);
    const c = centreOf(el);
    sfx("good");
    if (state.streak >= 3) { sfx("note", state.streak % 12); }
    burst(c.x, c.y, { kind: "stars", n: 8 + Math.min(10, state.streak * 2) });
    if (F.floatText && motionOK()) F.floatText(c.x, c.y - 18, opt.text || (STREAK_WORDS[state.streak] || pickOne(PRAISE)));
    cheerAll("happy", 1000);
    if (STREAK_WORDS[state.streak]) {
      play.say(STREAK_WORDS[state.streak] + " " + state.streak + " in a row!");
      sfx("sparkle");
      if (!calm()) burst(c.x, c.y, { kind: "confetti", n: 22 });
      later(function () { play.bonus(); }, 500);
    } else if (opt.say) play.say(opt.say);
    return state.streak;
  };
  play.miss = function (el, text) {
    state.misses += 1; state.streak = 0;
    bump("streak", 0);
    sfx("boing");
    if (el && F.shake && motionOK()) F.shake(el);
    if (buddyEl) F.dinoState && F.dinoState(buddyEl, "sad", 1300);
    play.say(text || pickOne(KIND), 2600);
    const c = centreOf(el);
    burst(c.x, c.y, { kind: "dust", n: 5, scale: 0.7 });
  };

  /* roaming bonus: a butterfly (or friend) that flutters across the scene; tap it to collect */
  play.bonus = function () {
    if (!alive() || !motionOK() || scene.querySelector(".pk-bonus")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "pk-bonus"; b.setAttribute("aria-label", "Catch the butterfly");
    b.textContent = theme.fly;
    const fromLeft = Math.random() > 0.5;
    b.style.top = (14 + Math.random() * 46).toFixed(0) + "%";
    scene.appendChild(b);
    const w = scene.clientWidth;
    const frames = [];
    const y0 = Math.random() * 30;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      frames.push({ transform: "translate(" + ((fromLeft ? -50 + t * (w + 100) : w + 50 - t * (w + 100))).toFixed(0) + "px," + (Math.sin(t * 9 + y0) * 34).toFixed(0) + "px) scale(" + (1 + Math.sin(t * 20) * 0.12).toFixed(2) + ")" });
    }
    const an = b.animate(frames, { duration: 9000, easing: "linear", fill: "forwards" });
    an.onfinish = function () { b.remove(); };
    b.addEventListener("click", function () {
      an.cancel(); b.remove();
      const r = addButterfly();
      state.butterfliesHere += 1;
      bump("bf", r.total);
      sfx("sparkle");
      const c = centreOf(b);
      const rr = b.getBoundingClientRect();
      burst(rr.left + rr.width / 2, rr.top + rr.height / 2, { kind: "sparkle", n: 16 });
      if (F.floatText) F.floatText(rr.left + rr.width / 2, rr.top, "+1 " + theme.fly);
      if (r.sticker) play.say("A new sticker for your album: " + r.sticker, 3200);
      else play.say(pickOne(["Got it! 🦋", "What a catch!", "So fluttery!"]));
      cheerAll("happy", 900);
      return c;
    });
    later(function () { /* idle butterflies come back later */ }, 100);
  };

  /* little dinosaurs wander along the ground, now and then */
  function wanderOnce() {
    if (!alive() || !F.dinoHTML || !motionOK()) return;
    const sp = pickOne(WANDERERS);
    const el = document.createElement("span");
    el.className = "pk-wanderer";
    el.innerHTML = F.dinoHTML(sp, { color: pickOne(COLORS), state: "walk", size: "100%" });
    const flip = Math.random() > 0.5;
    ground.appendChild(el);
    const w = ground.clientWidth, size = 54 + Math.random() * 26;
    el.style.width = size + "px";
    const d = el.querySelector(".du-dino");
    const entry = { el: d };
    state.wanderers.add(entry);
    const dur = 11000 + Math.random() * 7000;
    const from = flip ? w + 40 : -size - 40, to = flip ? -size - 40 : w + 40;
    const an = el.animate([{ transform: "translateX(" + from + "px) scaleX(" + (flip ? -1 : 1) + ")" }, { transform: "translateX(" + to + "px) scaleX(" + (flip ? -1 : 1) + ")" }], { duration: dur, easing: "linear", fill: "forwards" });
    an.onfinish = function () { el.remove(); state.wanderers.delete(entry); };
    d && d.addEventListener("pointerdown", function () { F.dinoState(d, "happy", 900); sfx("chirp"); const r = d.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, { kind: "hearts", n: 5 }); });
  }
  function scheduleWander() {
    later(function () { wanderOnce(); scheduleWander(); }, 6000 + Math.random() * 9000);
  }
  if (o.wander !== false) { later(wanderOnce, 1500); scheduleWander(); }
  // a surprise butterfly now and then, even without a streak
  if (o.bonus !== false) { (function loop() { later(function () { play.bonus(); loop(); }, 22000 + Math.random() * 16000); })(); }

  // a gentle parallax with the pointer
  if (motionOK()) {
    const hills = scene.querySelectorAll(".pk-hill, .pk-sun");
    scene.addEventListener("pointermove", function (e) {
      const r = scene.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      hills.forEach(function (h, i) { h.style.setProperty("--px", (nx * (i + 1) * -6).toFixed(1) + "px"); });
    });
  }

  /* star rating: fewer slips = more stars */
  play.rating = function () {
    const allow = o.allowed != null ? o.allowed : 2;
    return state.misses <= allow ? 3 : state.misses <= allow * 2 + 2 ? 2 : 1;
  };
  play.finish = function (message, opt) {
    if (state.finished) return;
    state.finished = true;
    opt = opt || {};
    const stars = opt.stars || play.rating();
    if (context.rate) context.rate(stars);
    noteBest(context.activity ? context.activity.id : "x", stars);
    const r = board.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    sfx("win");
    cheerAll("happy", 1800);
    const banner = document.createElement("div");
    banner.className = "pk-banner";
    banner.innerHTML = '<div class="pk-banner-stars">' + [1, 2, 3].map(function (n) { return '<i class="' + (n <= stars ? "on" : "") + '" style="--i:' + n + '">' + (n <= stars ? "⭐" : "☆") + "</i>"; }).join("") + '</div>' +
      '<strong>' + escapeText(stars === 3 ? "Perfect!" : stars === 2 ? "Well done!" : "Good effort!") + '</strong>' +
      (state.best >= 3 ? '<small>Best streak: ' + state.best + ' 🔥</small>' : "");
    scene.appendChild(banner);
    for (let i = 0; i < stars; i++) later(function () { sfx("star"); burst(cx + (i - 1) * 70, cy, { kind: "stars", n: 10 }); }, 250 + i * 260);
    if (!calm()) burst(cx, cy, { kind: "confetti", n: 40 });
    window.setTimeout(function () { banner.remove(); if (alive()) context.advance(message); }, motionOK() ? 2100 : 600);
  };
  play.destroy = function () { state.alive = false; state.timers.forEach(window.clearTimeout); };
  return play;
}


/* Make a button draggable (mouse or touch) and still tappable.
 *   dragPiece(btn, { ghost: () => node, onDrop: (x, y) => void, onStart: () => void })
 * A plain tap is left to your own click handler (it is not suppressed); a real drag swallows the click that follows. */
export function dragPiece(btn, o) {
  let d = null, suppress = false;
  btn.style.touchAction = "none";
  btn.addEventListener("click", function (e) { if (suppress) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  btn.addEventListener("pointerdown", function (e) {
    if (btn.disabled || e.button > 0) return;
    d = { sx: e.clientX, sy: e.clientY, ghost: null };
    try { btn.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
  });
  btn.addEventListener("pointermove", function (e) {
    if (!d) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
      const g = o.ghost ? o.ghost() : btn.cloneNode(true);
      g.classList.add("pk-drag"); g.removeAttribute("id");
      document.body.appendChild(g); d.ghost = g;
      btn.classList.add("dragging");
      if (o.onStart) o.onStart();
      sfx("tap");
    }
    d.ghost.style.left = e.clientX + "px"; d.ghost.style.top = e.clientY + "px";
  });
  function end(e) {
    if (!d) return;
    const cur = d; d = null;
    if (!cur.ghost) return;
    suppress = true; window.setTimeout(function () { suppress = false; }, 90);
    cur.ghost.remove(); btn.classList.remove("dragging");
    if (o.onDrop && e.type !== "pointercancel") o.onDrop(e.clientX, e.clientY);
    else if (o.onCancel) o.onCancel();
  }
  btn.addEventListener("pointerup", end);
  btn.addEventListener("pointercancel", end);
}


/* A roaming butterfly for activities that are not built on createPlay (calm ones only): catch it for the
 * butterfly collection and the odd sticker. Call once per mount; it stops by itself when the stage is replaced. */
export function attachBonus(stage, ch) {
  const F = fx();
  function spawn() {
    if (!stage.isConnected) return;
    if (motionOK() && !stage.querySelector(".pk-bonus")) {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 200) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "pk-bonus pk-bonus-free"; b.textContent = ch || "🦋"; b.setAttribute("aria-label", "Catch the butterfly");
        b.style.top = (rect.top + window.scrollY + rect.height * (0.15 + Math.random() * 0.4)) + "px"; b.style.position = "absolute";
        document.body.appendChild(b);
        const fromLeft = Math.random() > 0.5, w = window.innerWidth;
        const frames = [];
        for (let i = 0; i <= 14; i++) { const t = i / 14; frames.push({ transform: "translate(" + (fromLeft ? -40 + t * (w + 80) : w + 40 - t * (w + 80)).toFixed(0) + "px," + (Math.sin(t * 9) * 34).toFixed(0) + "px)" }); }
        const an = b.animate(frames, { duration: 11000, easing: "linear", fill: "forwards" });
        an.onfinish = function () { b.remove(); };
        b.addEventListener("click", function () {
          an.cancel();
          const r = addButterfly(), bb = b.getBoundingClientRect(); b.remove();
          sfx("sparkle"); burst(bb.left + bb.width / 2, bb.top + bb.height / 2, { kind: "sparkle", n: 14 });
          if (F.floatText) F.floatText(bb.left + bb.width / 2, bb.top, r.sticker ? "New sticker " + r.sticker : "+1 🦋");
        });
        window.setTimeout(function () { if (!stage.isConnected) b.remove(); }, 12000);
      }
    }
    window.setTimeout(spawn, 24000 + Math.random() * 16000);
  }
  window.setTimeout(spawn, 9000);
}

/* shared little helper: animate an element in, with a delay (for staggered entrances) */
export function enter(el, i) {
  const F = fx();
  if (!el || !F.anim) return;
  F.anim(el, [{ opacity: 0, transform: "translateY(22px) scale(.7)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 480, delay: (i || 0) * 70, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "backwards" });
}

/* tiny confetti-free bit of text escape for modules */
export { escapeText };
