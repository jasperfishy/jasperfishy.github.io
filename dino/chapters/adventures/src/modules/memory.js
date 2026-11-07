/* Memory Eggs — flip two wobbly eggs and find the matching baby dinosaurs. A golden pair hides a surprise, a quick
 * peek helps little explorers, and in bigger games the eggs shuffle after a few misses. */
import { createPlay, shuffle, enter } from "../adv-kit.js?v=du-04c80678fe526be4";

const FRIENDS = [
  ["trex", "green", "Rexy the T. rex"], ["tricera", "teal", "Trixie the Triceratops"], ["stego", "purple", "Spike the Stegosaurus"], ["bronto", "orange", "Bronte the Brontosaurus"],
  ["raptor", "red", "Zippy the Raptor"], ["ptero", "blue", "Skye the Pteranodon"], ["trex", "pink", "Rosie the T. rex"], ["tricera", "yellow", "Sunny the Triceratops"]
];
const SHELLS = ["#f7e6c4", "#e9f3d8", "#dcecf7", "#f6dfe9", "#f3ebc4", "#e5def5", "#fbe0cf", "#d9f2ee"];

export function mountMemory(context) {
  const F = window.DUFX;
  const pairs = context.challenge <= 2 ? 4 : context.challenge <= 5 ? 6 : 8;
  const play = createPlay(context, {
    emoji: "🥚", title: "Memory eggs", theme: "meadow", buddy: ["bronto", "tricera"][context.level % 2],
    instruction: "Tap two eggs to peek inside. Find the baby dinosaurs that are twins!",
    hint: "Take your time. The golden eggs hide a surprise!", allowed: Math.ceil(pairs * 0.8)
  });
  const friends = shuffle(FRIENDS).slice(0, pairs);
  const golden = Math.floor(Math.random() * pairs);
  const deck = shuffle(friends.concat(friends).map(function (f, i) { return { f: f, id: friends.indexOf(f), shell: SHELLS[friends.indexOf(f)], gold: friends.indexOf(f) === golden }; }));
  const cols = deck.length <= 8 ? 4 : deck.length <= 12 ? 4 : 4;
  const board = play.board;
  board.innerHTML = '<div class="me-grid" style="--me-cols:' + cols + '"></div><div class="me-nursery" aria-label="Hatched friends"><span class="me-nlabel">Nursery</span></div>';
  const grid = board.querySelector(".me-grid"), nursery = board.querySelector(".me-nursery");
  deck.forEach(function (d, i) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "me-egg" + (d.gold ? " gold" : ""); b.dataset.id = String(d.id);
    b.setAttribute("aria-label", "Mystery egg");
    b.style.setProperty("--shell", d.shell); b.style.setProperty("--w", (-Math.random() * 6).toFixed(2) + "s"); b.style.setProperty("--spot", ["#e9a97b", "#8fc59a", "#9bb9e0", "#e7a0bb"][i % 4]);
    b.innerHTML = '<span class="me-in"><span class="me-front"><i class="me-spots"></i></span><span class="me-back">' + F.dinoHTML(d.f[0], { color: d.f[1], state: "idle", size: "100%" }) + '<small>' + d.f[2].split(" ")[0] + '</small></span></span>';
    grid.appendChild(b); enter(b, i);
  });
  let first = null, locked = true, matched = 0, missRun = 0;
  const eggs = Array.prototype.slice.call(grid.children);

  // a quick peek for little explorers: everybody wobbles open, then closes
  function peek() {
    const ms = context.challenge <= 2 ? 2400 : context.challenge <= 4 ? 1400 : 0;
    if (!ms) { locked = false; return; }
    play.say("Look quickly! Remember who is hiding. 👀", ms);
    window.setTimeout(function () {
      eggs.forEach(function (e) { e.classList.add("open"); });
      if (F.sfx) F.sfx.pop();
      window.setTimeout(function () { eggs.forEach(function (e) { e.classList.remove("open"); }); locked = false; play.hint("Now find the twins!"); }, ms);
    }, 900);
  }
  peek();

  function shuffleBoard() {
    const rects = new Map();
    eggs.forEach(function (e) { rects.set(e, e.getBoundingClientRect()); });
    const loose = eggs.filter(function (e) { return !e.classList.contains("matched"); });
    const slots = loose.map(function (e) { return eggs.indexOf(e); });
    const mixed = shuffle(loose);
    slots.forEach(function (idx, k) { eggs[idx] = mixed[k]; });
    eggs.forEach(function (e) { grid.appendChild(e); });
    eggs.forEach(function (e) {
      const a = rects.get(e), b = e.getBoundingClientRect();
      if (F.anim && (a.left !== b.left || a.top !== b.top)) F.anim(e, [{ transform: "translate(" + (a.left - b.left) + "px," + (a.top - b.top) + "px)" }, { transform: "none" }], { duration: 620, easing: "cubic-bezier(.3,1.2,.5,1)" });
    });
    play.say("Whoosh! The eggs swapped places. 🌀", 2400);
    if (F.sfx) F.sfx.whoosh();
  }

  grid.addEventListener("click", function (ev) {
    const egg = ev.target.closest(".me-egg");
    if (!egg || locked || egg.classList.contains("matched") || egg.classList.contains("open")) return;
    egg.classList.add("open");
    if (F.sfx) F.sfx.pop();
    if (!first) { first = egg; return; }
    const a = first; first = null;
    if (a.dataset.id === egg.dataset.id) {
      locked = true; missRun = 0;
      window.setTimeout(function () {
        a.classList.add("matched"); egg.classList.add("matched");
        const d = friends[Number(a.dataset.id)];
        [a, egg].forEach(function (e) { F.dinoState(e.querySelector(".du-dino"), "happy", 1600); });
        play.good(egg, { text: a.classList.contains("gold") ? "Golden hatch! ✨" : null });
        play.say(d[2] + " says hi! 💚", 2200);
        // the pair hops into the nursery
        const chip = document.createElement("span");
        chip.className = "me-chip"; chip.innerHTML = F.dinoHTML(d[0], { color: d[1], state: "happy", size: "100%" });
        nursery.appendChild(chip); F.pop && F.pop(chip);
        if (a.classList.contains("gold")) { if (F.burst) { const r = egg.getBoundingClientRect(); F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "sparkle", n: 24 }); } window.setTimeout(function () { play.bonus(); }, 400); }
        matched += 1; locked = false;
        if (matched === pairs) window.setTimeout(function () { eggs.forEach(function (e) { F.dinoState(e.querySelector(".du-dino"), "happy", 2500); }); play.finish("You found every dinosaur friend!"); }, 700);
      }, 380);
    } else {
      locked = true; missRun += 1;
      window.setTimeout(function () {
        play.miss(egg, ["Not twins this time! Remember where they are 💭", "Oops! Try to remember that one.", "Almost! Peek again."][missRun % 3]);
        a.classList.remove("open"); egg.classList.remove("open");
        locked = false;
        if (context.challenge >= 5 && missRun >= 3) { missRun = 0; shuffleBoard(); }
      }, 900);
    }
  });
}
