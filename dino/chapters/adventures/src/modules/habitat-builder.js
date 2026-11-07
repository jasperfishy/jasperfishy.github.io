/* Dino Habitat Builder — design a real home. The dinosaur tells you what it needs (water, ferns, shade…).
 * Drag things from the toolbox onto the landscape (drag them again to move them, drag them out to put them away).
 * Needs tick off when you place the right thing; extra decorations are welcome and earn bonus stars. When the home is
 * ready the dinosaur moves in, sunset turns to starry night, and it falls asleep. */
import { createPlay, shuffle, dragPiece } from "../adv-kit.js?v=du-5ee3d40e60884152";

const HABITATS = [
  { dino: "Brachiosaurus", sp: "bronto", color: "orange", place: "Fern Forest", cls: "hb-forest", base: ["water", "ferns", "tallTrees"], extras: ["sunnyRocks", "flowers"] },
  { dino: "Spinosaurus", sp: "raptor", color: "blue", place: "River Lagoon", cls: "hb-lagoon", base: ["water", "reeds", "shade"], extras: ["shells", "sunnyRocks"] },
  { dino: "Triceratops", sp: "tricera", color: "teal", place: "Open Meadow", cls: "hb-meadow", base: ["ferns", "flowers", "sunnyRocks"], extras: ["water", "shade"] },
  { dino: "Stegosaurus", sp: "stego", color: "purple", place: "Warm Valley", cls: "hb-valley", base: ["water", "ferns", "sunnyRocks"], extras: ["flowers", "shade"] },
  { dino: "Pteranodon", sp: "ptero", color: "pink", place: "Cliffside Coast", cls: "hb-coast", base: ["water", "sunnyRocks", "tallTrees"], extras: ["shells", "shade"] }
];
const FEATURES = [
  { id: "water", icon: "🌊", name: "fresh water", size: 64 },
  { id: "ferns", icon: "🌿", name: "soft ferns", size: 40 },
  { id: "tallTrees", icon: "🌳", name: "tall trees", size: 72 },
  { id: "sunnyRocks", icon: "🪨", name: "sunny rocks", size: 46 },
  { id: "flowers", icon: "🌼", name: "wild flowers", size: 38 },
  { id: "reeds", icon: "🪷", name: "river reeds", size: 42 },
  { id: "shade", icon: "🌴", name: "cool shade", size: 68 },
  { id: "shells", icon: "🐚", name: "seashells", size: 32 },
  { id: "d-mush", icon: "🍄", name: "mushrooms", size: 34, decor: true },
  { id: "d-frog", icon: "🐸", name: "a froggy friend", size: 34, decor: true },
  { id: "d-rainbow", icon: "🌈", name: "a rainbow", size: 66, decor: true },
  { id: "d-nest", icon: "🪺", name: "a cosy nest", size: 38, decor: true },
  { id: "d-butter", icon: "🦋", name: "butterflies", size: 32, decor: true },
  { id: "d-lamp", icon: "🏮", name: "a glowing lantern", size: 36, decor: true }
];
const byId = (id) => FEATURES.find(function (f) { return f.id === id; });

export function mountHabitatBuilder(context) {
  const F = window.DUFX;
  const habitat = HABITATS[(context.level - 1) % HABITATS.length];
  const extraCount = Math.min(habitat.extras.length, 1 + Math.floor((context.level - 1) / 2));
  const needs = habitat.base.concat(habitat.extras.slice(0, extraCount));
  const play = createPlay(context, {
    emoji: "🌱", title: "Dino habitat builder", theme: "meadow", buddy: false, wander: false,
    instruction: "Build a home for " + habitat.dino + "! Drag things from the toolbox onto the land.", hint: "Listen to what the dinosaur needs, then drag those things in. You can add decorations too!", allowed: 99
  });
  const board = play.board;
  board.innerHTML = '<div class="hb-land ' + habitat.cls + '" id="hbLand"><div class="hb-sky"></div><span class="hb-sun">☀️</span><div class="hb-ground"></div><div class="hb-sprites" id="hbSprites"></div>' +
    '<div class="hb-dino" id="hbDino">' + F.dinoHTML(habitat.sp, { color: habitat.color, state: "idle", size: "100%" }) + '</div><div class="hb-needs" id="hbNeeds"></div><div class="hb-stars" id="hbStars"></div></div>' +
    '<div class="hb-box" id="hbBox" aria-label="Toolbox"></div><p class="hb-deco" id="hbDeco"></p>';
  const land = board.querySelector("#hbLand"), sprites = board.querySelector("#hbSprites"), dino = board.querySelector("#hbDino"), needsEl = board.querySelector("#hbNeeds"), box = board.querySelector("#hbBox"), decoEl = board.querySelector("#hbDeco");
  const decorChoices = shuffle(FEATURES.filter(function (f) { return f.decor; })).slice(0, 3 + Math.min(2, Math.floor(context.challenge / 3)));
  const distract = shuffle(FEATURES.filter(function (f) { return !f.decor && needs.indexOf(f.id) < 0; })).slice(0, 2);
  const tools = shuffle(needs.map(byId).concat(distract, decorChoices));
  let placed = [], moved = false, doneAll = false;

  function renderNeeds() {
    needsEl.innerHTML = '<b>I need:</b> ' + needs.map(function (id) {
      const f = byId(id), ok = placed.some(function (s) { return s.id === id; });
      return '<span class="' + (ok ? "ok" : "") + '">' + f.icon + (ok ? "✔" : "") + " " + f.name + "</span>";
    }).join("");
  }
  function decorCount() { return placed.filter(function (s) { return byId(s.id).decor || needs.indexOf(s.id) < 0; }).length; }
  function renderDeco() {
    const n = decorCount();
    decoEl.textContent = n ? "Decorations: " + n + (n >= 3 ? " ⭐ lovely!" : " — add 3 for a bonus star!") : "Add some decorations for bonus stars!";
  }
  function allDone() { return needs.every(function (id) { return placed.some(function (s) { return s.id === id; }); }); }

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
    const el = document.createElement("button");
    el.type = "button"; el.className = "hb-sprite"; el.textContent = f.icon; el.style.fontSize = f.size + "px"; el.setAttribute("aria-label", f.name + " in the habitat");
    sprites.appendChild(el);
    position(el, x, y);
    const s = { id: f.id, el: el };
    placed.push(s);
    F.pop && F.pop(el);
    const r = el.getBoundingClientRect();
    if (F.sfx) F.sfx.pop();
    const need = needs.indexOf(f.id) >= 0 && placed.filter(function (q) { return q.id === f.id; }).length === 1;
    if (need) { play.good({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, { text: f.name + "! ✔" }); renderNeeds(); F.dinoState(dino.querySelector(".du-dino"), "happy", 900); }
    else { if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "sparkle", n: 8 }); play.say(needs.indexOf(f.id) >= 0 ? "Even more " + f.name + "!" : "Pretty! " + (f.decor ? "That's a lovely decoration." : "The dinosaur doesn't need that, but it's nice!"), 2200); }
    renderDeco();
    dragPiece(el, {
      ghost: function () { const g = document.createElement("div"); g.className = "hb-ghost"; g.textContent = f.icon; g.style.fontSize = f.size + "px"; return g; },
      onDrop: function (dx, dy) {
        const lr = land.getBoundingClientRect();
        if (dx > lr.left && dx < lr.right && dy > lr.top && dy < lr.bottom) { position(el, dx, dy); if (F.sfx) F.sfx.tap(); }
        else { placed = placed.filter(function (q) { return q !== s; }); el.remove(); if (F.sfx) F.sfx.whoosh(); renderNeeds(); renderDeco(); }
      }
    });
    if (allDone() && !doneAll) { doneAll = true; window.setTimeout(moveIn, 900); }
    if (decorCount() === 3) { play.say("Three decorations — a bonus star! ⭐", 2600); window.setTimeout(function () { play.bonus(); }, 500); }
  }

  function moveIn() {
    play.hint("The home is ready!", true);
    play.say(habitat.dino + " moves in! 🏡", 3000);
    if (F.sfx) F.sfx.win();
    const d = dino.querySelector(".du-dino");
    F.dinoState(d, "walk");
    // walk into the middle of the new home
    if (dino.animate && F.motionOK && F.motionOK()) {
      const a = dino.animate([{ translate: "0 0" }, { translate: "38% 0" }], { duration: 2200, easing: "ease-in-out", fill: "forwards" });
      a.onfinish = settle;
    } else settle();
    function settle() {
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
        window.setTimeout(function () {
          const n = decorCount();
          play.finish("A new prehistoric home is ready for " + habitat.dino + "!", { stars: n >= 3 ? 3 : n >= 1 ? 2 : 1 });
        }, 2800);
      }, 1500);
    }
  }
  renderNeeds(); renderDeco();
  window.setTimeout(function () { play.say("Hello! I need " + needs.slice(0, 3).map(function (id) { return byId(id).name; }).join(", ") + (needs.length > 3 ? " and more" : "") + ". Can you help? 🌱", 4500); }, 500);
}
