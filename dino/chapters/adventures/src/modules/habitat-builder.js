/* Dino Habitat Builder — design a real home. The dinosaur tells you what it needs (water, ferns, shade…).
 * Drag things from the toolbox onto the landscape (drag them again to move them, drag them out to put them away).
 * Needs tick off when you place the right thing; extra decorations earn a bonus star, a free hint points at whatever is
 * still missing, the weather drifts across the land, and every kind of thing lands with its own sound and sparkle.
 * When the home is ready the dinosaur moves in, sunset turns to starry night, you may catch the night stars, and then
 * it falls asleep. */
import { createPlay, shuffle, dragPiece, collect, collection } from "../adv-kit.js?v=du-e3e2759ce3d75cba";

const HABITATS = [
  { dino: "Brachiosaurus", sp: "bronto", color: "orange", place: "Fern Forest", cls: "hb-forest", base: ["water", "ferns", "tallTrees"], extras: ["sunnyRocks", "flowers"], note: "A long neck reaches the tallest leaves!" },
  { dino: "Spinosaurus", sp: "raptor", color: "blue", place: "River Lagoon", cls: "hb-lagoon", base: ["water", "reeds", "shade"], extras: ["shells", "sunnyRocks"], note: "Spinosaurus hunted fish in the rivers." },
  { dino: "Triceratops", sp: "tricera", color: "teal", place: "Open Meadow", cls: "hb-meadow", base: ["ferns", "flowers", "sunnyRocks"], extras: ["water", "shade"], note: "Three horns and a big frill — quite a face!" },
  { dino: "Stegosaurus", sp: "stego", color: "purple", place: "Warm Valley", cls: "hb-valley", base: ["water", "ferns", "sunnyRocks"], extras: ["flowers", "shade"], note: "Its back plates warmed up in the sun." },
  { dino: "Pteranodon", sp: "ptero", color: "pink", place: "Cliffside Coast", cls: "hb-coast", base: ["water", "sunnyRocks", "tallTrees"], extras: ["shells", "shade"], note: "A flying reptile, not a dinosaur — it loved the sea air." },
  { dino: "Ankylosaurus", sp: "stego", color: "green", place: "Armoured Ridge", cls: "hb-valley", base: ["water", "ferns", "shade"], extras: ["sunnyRocks", "shells"], note: "Bony armour and a clubby tail for keeping safe." },
  { dino: "Maiasaura", sp: "tricera", color: "yellow", place: "Nesting Grounds", cls: "hb-meadow", base: ["ferns", "tallTrees", "water"], extras: ["flowers", "sunnyRocks"], note: "Maiasaura looked after its babies in big nests." },
  { dino: "Diplodocus", sp: "bronto", color: "teal", place: "Riverbank Grove", cls: "hb-lagoon", base: ["water", "tallTrees", "ferns"], extras: ["reeds", "shade"], note: "A whip-long tail and a neck like a ladder." },
  { dino: "Oviraptor", sp: "raptor", color: "red", place: "Feathered Hollow", cls: "hb-forest", base: ["tallTrees", "shade", "water"], extras: ["nest", "flowers"], note: "It had feathers, and it sat on its own eggs." }
];
const FEATURES = [
  { id: "water", icon: "🌊", name: "fresh water", size: 64, group: "water" },
  { id: "ferns", icon: "🌿", name: "soft ferns", size: 40, group: "plant" },
  { id: "tallTrees", icon: "🌳", name: "tall trees", size: 72, group: "plant" },
  { id: "sunnyRocks", icon: "🪨", name: "sunny rocks", size: 46, group: "stone" },
  { id: "flowers", icon: "🌼", name: "wild flowers", size: 38, group: "plant" },
  { id: "reeds", icon: "🪷", name: "river reeds", size: 42, group: "plant" },
  { id: "shade", icon: "🌴", name: "cool shade", size: 68, group: "plant" },
  { id: "shells", icon: "🐚", name: "seashells", size: 32, group: "stone" },
  { id: "nest", icon: "🪺", name: "a family nest", size: 40, group: "stone" },
  { id: "d-mush", icon: "🍄", name: "mushrooms", size: 34, decor: true },
  { id: "d-frog", icon: "🐸", name: "a froggy friend", size: 34, decor: true },
  { id: "d-rainbow", icon: "🌈", name: "a rainbow", size: 66, decor: true },
  { id: "d-butter", icon: "🦋", name: "butterflies", size: 32, decor: true },
  { id: "d-lamp", icon: "🏮", name: "a glowing lantern", size: 36, decor: true },
  { id: "d-log", icon: "🪵", name: "a log pile", size: 38, decor: true },
  { id: "d-track", icon: "👣", name: "a footprint path", size: 34, decor: true },
  { id: "d-feather", icon: "🪶", name: "a soft feather", size: 32, decor: true },
  { id: "d-snail", icon: "🐌", name: "a slow snail", size: 30, decor: true },
  { id: "d-hatch", icon: "🐣", name: "a hatchling", size: 32, decor: true }
];
/* every sort of thing lands with its own noise, sparkle and happy word */
const GROUP_FX = {
  water: { sfx: "splash", burst: "drops", word: "Splish — fresh water!" },
  plant: { sfx: "whoosh", burst: "leaves", word: "Leafy and lovely!" },
  stone: { sfx: "thud", burst: "dust", word: "A proper solid spot!" },
  decor: { sfx: "sparkle", burst: "sparkle", word: "Ooh, that's pretty!" }
};
const WEATHERS = [
  { icon: "☀️", name: "bright and sunny", clouds: 1, note: "Warm sunshine — a basking rock feels lovely." },
  { icon: "🌤️", name: "breezy", clouds: 3, wind: true, note: "A breeze ripples through the ferns." },
  { icon: "🌧️", name: "showery", clouds: 3, rain: true, note: "Pitter patter! The water hole is filling up." },
  { icon: "🌫️", name: "misty", clouds: 2, mist: true, note: "Mist hides the far trees this morning." }
];
const byId = (id) => FEATURES.find(function (f) { return f.id === id; });

export function mountHabitatBuilder(context) {
  const F = window.DUFX;
  const level = Math.max(1, Number(context.level) || 1);
  const ch = Math.max(1, Number(context.challenge) || 1);
  const habitat = HABITATS[(level - 1) % HABITATS.length];
  const extraCount = Math.min(habitat.extras.length, 1 + Math.floor(ch / 3));
  const needs = habitat.base.concat(habitat.extras.slice(0, extraCount));
  const wantTwo = ch >= 6 ? needs[0] : null;
  const weather = WEATHERS[(level - 1) % WEATHERS.length];
  const homes = collection("homes");
  const bestDecor = homes.reduce(function (m, h) { return Math.max(m, Number(h.decor) || 0); }, 0);
  const play = createPlay(context, {
    emoji: "🌱", title: "Dino habitat builder", theme: weather.rain ? "rain" : "meadow", buddy: false, wander: false,
    instruction: "Build a home for " + habitat.dino + "! Drag things from the toolbox onto the land.",
    hint: "Listen to what the dinosaur needs, then drag those things in. You can add decorations too!", allowed: 99
  });
  const board = play.board;
  board.innerHTML = '<div class="hb-land ' + habitat.cls + '" id="hbLand"><div class="hb-sky"></div><span class="hb-sun">☀️</span><div class="hb-ground"></div>' + weatherLayer() +
    '<div class="hb-sprites" id="hbSprites"></div>' +
    '<div class="hb-dino" id="hbDino">' + F.dinoHTML(habitat.sp, { color: habitat.color, state: "idle", size: "100%" }) + '</div><div class="hb-needs" id="hbNeeds"></div><div class="hb-stars" id="hbStars"></div></div>' +
    '<div class="hb-box" id="hbBox" aria-label="Toolbox"></div><p class="hb-deco" id="hbDeco"></p>' +
    '<p style="text-align:center;margin:6px 0 0"><button type="button" class="tiny-button" id="hbHelp">💡 What is still missing?</button></p>';
  const land = board.querySelector("#hbLand"), sprites = board.querySelector("#hbSprites"), dino = board.querySelector("#hbDino"), needsEl = board.querySelector("#hbNeeds"), box = board.querySelector("#hbBox"), decoEl = board.querySelector("#hbDeco"), helpBtn = board.querySelector("#hbHelp");
  const decorChoices = shuffle(FEATURES.filter(function (f) { return f.decor; })).slice(0, 3 + Math.min(3, Math.floor(ch / 2)));
  const distract = shuffle(FEATURES.filter(function (f) { return !f.decor && needs.indexOf(f.id) < 0; })).slice(0, Math.min(3, 1 + Math.floor(ch / 3)));
  const tools = shuffle(needs.map(byId).concat(distract, decorChoices));
  let placed = [], doneAll = false, mode = "build", starTimer = 0, caught = 0;
  animateWeather();

  function weatherLayer() {
    let html = '<div id="hbWeather" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2">';
    for (let i = 0; i < (weather.clouds || 0); i++) html += '<i class="hb-wcloud" style="position:absolute;left:' + (-8 + i * 36) + "%;top:" + (6 + i * 7) + '%;font-size:' + (26 + i * 6) + 'px;font-style:normal;opacity:.8">☁️</i>';
    for (let d = 0; d < (weather.rain ? 10 : 0); d++) html += '<i class="hb-wdrop" style="position:absolute;left:' + (4 + d * 9.5) + '%;top:-8%;font-size:13px;font-style:normal">💧</i>';
    for (let g = 0; g < (weather.wind ? 5 : 0); g++) html += '<i class="hb-wgust" style="position:absolute;left:100%;top:' + (14 + g * 9) + '%;width:54px;height:3px;border-radius:3px;background:rgba(255,255,255,.85)"></i>';
    if (weather.mist) html += '<span style="position:absolute;left:-10%;right:-10%;top:44%;height:15%;background:rgba(255,255,255,.55);border-radius:50%"></span><span style="position:absolute;left:-10%;right:-10%;top:63%;height:11%;background:rgba(255,255,255,.4);border-radius:50%"></span>';
    return html + "</div>";
  }
  function animateWeather() {
    const w = board.querySelector("#hbWeather");
    if (!w || !F.anim) return;
    w.querySelectorAll(".hb-wcloud").forEach(function (c, i) { F.anim(c, [{ transform: "translateX(0)" }, { transform: "translateX(" + (30 + i * 14) + "px)" }], { duration: 9000 + i * 1500, direction: "alternate", iterations: Infinity, easing: "ease-in-out" }); });
    w.querySelectorAll(".hb-wdrop").forEach(function (d, i) { F.anim(d, [{ transform: "translateY(0)", opacity: .9 }, { transform: "translateY(240px)", opacity: .25 }], { duration: 1400 + i * 70, delay: i * 130, iterations: Infinity }); });
    w.querySelectorAll(".hb-wgust").forEach(function (g, i) { F.anim(g, [{ transform: "translateX(0)", opacity: .1 }, { transform: "translateX(-360px)", opacity: .9 }], { duration: 2200 + i * 260, delay: i * 320, iterations: Infinity }); });
  }

  function missing() { return needs.filter(function (id) { return placed.filter(function (s) { return s.id === id; }).length < (id === wantTwo ? 2 : 1); }); }
  function renderNeeds() {
    needsEl.innerHTML = '<b>I need:</b> ' + needs.map(function (id) {
      const f = byId(id), have = placed.filter(function (s) { return s.id === id; }).length, want = id === wantTwo ? 2 : 1, ok = have >= want;
      return '<span class="' + (ok ? "ok" : "") + '">' + f.icon + (ok ? "✔" : "") + " " + f.name + (want > 1 ? " ×" + want : "") + "</span>";
    }).join("") + '<span class="hb-when">' + weather.icon + " " + weather.name + "</span>";
  }
  function decorCount() { return placed.filter(function (s) { return byId(s.id).decor || needs.indexOf(s.id) < 0; }).length; }
  function renderDeco() {
    if (mode !== "build") return;
    const n = decorCount();
    decoEl.textContent = "Decorations: " + n + (n >= 3 ? " ⭐ lovely!" : " — add 3 for a bonus star!") +
      " · Still needed: " + missing().length + " · Homes you built: " + homes.length + (bestDecor ? " (best " + bestDecor + " decorations)" : "");
  }
  function allDone() { return missing().length === 0; }

  tools.forEach(function (f, i) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "hb-tool"; b.dataset.id = f.id;
    b.innerHTML = "<span>" + f.icon + "</span><small>" + f.name + "</small>";
    b.setAttribute("aria-label", f.name);
    box.appendChild(b);
    F.anim && F.anim(b, [{ opacity: 0, transform: "translateY(20px) scale(.6)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: i * 50, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "backwards" });
    let tapPos = 0;
    b.addEventListener("click", function () {
      // tap = drop it in a sensible spot (a friendly alternative to dragging)
      const r = land.getBoundingClientRect();
      const x = r.left + r.width * (0.12 + ((tapPos++ * 0.23 + Math.random() * 0.1) % 0.76)), y = r.top + r.height * (0.55 + Math.random() * 0.3);
      add(f, x, y);
    });
    dragPiece(b, {
      ghost: function () { const g = document.createElement("div"); g.className = "hb-ghost"; g.textContent = f.icon; g.style.fontSize = f.size + "px"; return g; },
      onDrop: function (x, y) { const r = land.getBoundingClientRect(); if (x > r.left && x < r.right && y > r.top && y < r.bottom) add(f, x, y); else play.hint("Drop it on the land!"); }
    });
  });

  function position(el, x, y) {
    const r = land.getBoundingClientRect();
    const px = Math.max(0.04, Math.min(0.96, (x - r.left) / r.width)), py = Math.max(0.3, Math.min(0.96, (y - r.top) / r.height));
    el.style.left = (px * 100) + "%"; el.style.top = (py * 100) + "%";
    el.style.zIndex = String(Math.round(py * 100));
    return [px, py];
  }
  function add(f, x, y) {
    if (doneAll) return;
    box.querySelectorAll(".hb-tool").forEach(function (b) { b.style.boxShadow = ""; });
    const el = document.createElement("button");
    el.type = "button"; el.className = "hb-sprite"; el.textContent = f.icon; el.style.fontSize = f.size + "px"; el.setAttribute("aria-label", f.name + " in the habitat");
    sprites.appendChild(el);
    position(el, x, y);
    const s = { id: f.id, el: el };
    placed.push(s);
    F.pop && F.pop(el);
    const r = el.getBoundingClientRect();
    const fxg = GROUP_FX[f.group] || GROUP_FX.decor;
    // decorations land with a pop; the useful things land with their own noise and sparkle
    if (F.sfx) F.sfx[f.decor ? "pop" : fxg.sfx]();
    if (F.anim) F.anim(el, [{ transform: "translateY(-26px) scale(.5)", opacity: 0 }, { transform: "translateY(4px) scale(1.15)", opacity: 1 }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.3,1.5,.5,1)" });
    const count = placed.filter(function (q) { return q.id === f.id; }).length;
    const wanted = needs.indexOf(f.id) >= 0 && count <= (f.id === wantTwo ? 2 : 1);
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: wanted ? "stars" : fxg.burst, n: wanted ? 12 : 8 });
    if (wanted) { play.good({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, { text: fxg.word }); renderNeeds(); F.dinoState(dino.querySelector(".du-dino"), "happy", 900); }
    else if (needs.indexOf(f.id) >= 0) { play.say("Even more " + f.name + "! " + habitat.dino + " is very pleased.", 2200); }
    else { play.say("So close — " + habitat.dino + " didn't ask for " + f.name + ", but it's welcome anyway! " + (missing()[0] ? "The next thing it needs is " + byId(missing()[0]).name + "." : ""), 2600); }
    renderDeco();
    dragPiece(el, {
      ghost: function () { const g = document.createElement("div"); g.className = "hb-ghost"; g.textContent = f.icon; g.style.fontSize = f.size + "px"; return g; },
      onDrop: function (dx, dy) {
        const lr = land.getBoundingClientRect();
        if (dx > lr.left && dx < lr.right && dy > lr.top && dy < lr.bottom) { position(el, dx, dy); if (F.sfx) F.sfx.tap(); }
        else { placed = placed.filter(function (q) { return q !== s; }); el.remove(); if (F.sfx) F.sfx.whoosh(); renderNeeds(); renderDeco(); }
      }
    });
    if (allDone() && !doneAll) { doneAll = true; helpBtn.disabled = true; window.setTimeout(moveIn, 900); }
    if (decorCount() === 3) { play.say("Three decorations — a bonus star! ⭐", 2600); window.setTimeout(function () { play.bonus(); }, 500); }
  }

  /* a free hint that never counts against you: it names the next need and glows the right toolbox item */
  helpBtn.addEventListener("click", function () {
    if (mode === "night") { window.clearTimeout(starTimer); finishHome(decorCount(), caught); return; }
    if (doneAll) return;
    const id = missing()[0];
    if (!id) { play.hint("Everything is here — " + habitat.dino + " is moving in!", true); return; }
    const f = byId(id);
    box.querySelectorAll(".hb-tool").forEach(function (b) { b.style.boxShadow = ""; });
    const btn = box.querySelector('.hb-tool[data-id="' + f.id + '"]');
    if (btn) {
      btn.style.boxShadow = "0 0 0 4px #ffd166, 0 5px 0 rgba(120,80,30,.3)";
      if (F.anim) F.anim(btn, [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 620, easing: "ease-in-out" });
      if (F.sfx) F.sfx.star();
    }
    play.say(habitat.dino + " still needs " + f.name + " — tap the " + f.icon + " in the toolbox!" + (f.id === wantTwo ? " Two of them, please." : ""), 3400);
    play.hint("Look for the " + f.icon + " " + f.name + ". Tap it, or drag it onto the land.", true);
  });

  function moveIn() {
    play.hint("The home is ready!", true);
    play.say(habitat.dino + " moves in! 🏡", 3000);
    if (F.sfx) F.sfx.win();
    const d = dino.querySelector(".du-dino");
    F.dinoState(d, "walk");
    let settled = false;
    // walk into the middle of the new home
    if (dino.animate && F.motionOK && F.motionOK()) {
      const a = dino.animate([{ translate: "0 0" }, { translate: "38% 0" }], { duration: 2200, easing: "ease-in-out", fill: "forwards" });
      /* The walk-on is the only thing between a finished home and the next round, so a
       * cancelled animation (detached node, backgrounded tab) must not strand the child
       * on a perfect habitat forever: a watchdog calls the same settle(). */
      a.onfinish = settle;
      window.setTimeout(settle, 3200);
    } else settle();
    function settle() {
      if (settled) return; settled = true;
      F.dinoState(d, "happy", 1500);
      const r = land.getBoundingClientRect();
      if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "hearts", n: 14 }); F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: "confetti", n: 30 }); }
      window.setTimeout(function () {
        land.classList.add("hb-night");
        play.say("Sunset… and now the stars come out. 🌙", 3000);
        F.dinoState(d, "sleep", 99999);
        const st = board.querySelector("#hbStars");
        st.innerHTML = Array.from({ length: 16 }, function () { return '<i style="left:' + (Math.random() * 96).toFixed(0) + '%;top:' + (Math.random() * 40).toFixed(0) + '%;animation-delay:' + (-Math.random() * 3).toFixed(1) + 's"></i>'; }).join("");
        placed.forEach(function (q) { if (q.id === "d-lamp") q.el.classList.add("glow"); });
        window.setTimeout(nightStars, 1600);
      }, 1500);
    }
  }

  /* optional bonus once night falls: catch the twinkling stars before saying goodnight (or just skip it) */
  function nightStars() {
    if (ch < 4) return finishHome(decorCount(), 0);
    mode = "night"; caught = 0;
    helpBtn.disabled = false; helpBtn.textContent = "Goodnight 🌙 →";
    decoEl.textContent = "✨ Optional: catch the night stars!";
    if (F.sfx) F.sfx.note(4);
    for (let i = 0; i < 3; i++) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "sb-star"; b.textContent = "⭐"; b.setAttribute("aria-label", "Catch this night star");
      b.style.left = (16 + i * 28) + "%"; b.style.top = (8 + (i % 2) * 13) + "%";
      land.appendChild(b);
      b.addEventListener("click", function () {
        if (b.disabled) return;
        b.disabled = true; b.textContent = "🌟"; caught += 1;
        const r = b.getBoundingClientRect();
        if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "stars", n: 12 });
        if (F.sfx) F.sfx.star();
        play.good(b, { text: "Sparkly!" });
        decoEl.textContent = "✨ Night stars caught: " + caught + " of 3";
        if (caught >= 3) window.setTimeout(function () { window.clearTimeout(starTimer); finishHome(decorCount(), caught); }, 800);
      });
    }
    starTimer = window.setTimeout(function () { finishHome(decorCount(), caught); }, 8000);
  }

  function finishHome(decor, starsGot) {
    if (mode === "done") return;
    mode = "done";
    helpBtn.disabled = true;
    const stars = decor >= 3 ? 3 : decor >= 1 ? 2 : 1;
    collect("homes", { place: habitat.place, dino: habitat.dino, decor: decor, stars: stars, night: starsGot, weather: weather.name });
    if (F.sfx) F.sfx.chirp();
    play.finish(habitat.dino + " sleeps soundly in your " + weather.name.toLowerCase() + " habitat — " + decor + " decorations" + (starsGot ? " and " + starsGot + " night stars" : "") + "! Goodnight 🌙", { stars: stars });
  }
  renderNeeds(); renderDeco();
  window.setTimeout(function () { play.say("Hello! I'm " + habitat.dino + ". " + habitat.note + " I need " + needs.map(function (id) { return byId(id).name; }).join(", ") + (wantTwo ? " — and twice as much " + byId(wantTwo).name + "!" : "") + ". It's " + weather.name + " today. Can you help? 🌱", 5200); }, 500);
}
