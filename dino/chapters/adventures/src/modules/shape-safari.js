/* Shape Safari — a hidden-object meadow. Three shape missions per game: find every circle, triangle, star… hiding
 * among the things in the meadow (some peek out from behind bushes). Found shapes fly into the shape basket.
 * Tap the wrong thing and a friendly dinosaur tells you what shape it really is. */
import { createPlay, shuffle } from "../adv-kit.js?v=du-04c80678fe526be4";

const SHAPES = {
  circle: { name: "circle", plural: "circles", sides: "round, no corners", path: '<circle cx="20" cy="20" r="15"/>', items: ["☀️", "🏀", "🍊", "🪙", "🍪", "🔴", "🌕", "🎾"] },
  triangle: { name: "triangle", plural: "triangles", sides: "3 corners", path: '<path d="M20 5 L36 34 H4Z"/>', items: ["⛺", "🌲", "🔺", "🍕", "🏔️"] },
  square: { name: "square", plural: "squares", sides: "4 equal sides", path: '<rect x="6" y="6" width="28" height="28" rx="2"/>', items: ["🎁", "📦", "🧊", "🟩", "🟦", "🧱"] },
  star: { name: "star", plural: "stars", sides: "5 pointy points", path: '<path d="M20 4 L24.6 15 L36 15.8 L27.4 23.4 L30 35 L20 28.8 L10 35 L12.6 23.4 L4 15.8 L15.4 15Z"/>', items: ["⭐", "🌟", "🌠", "💫"] },
  heart: { name: "heart", plural: "hearts", sides: "two bumps and a point", path: '<path d="M20 35 C2 22 4 8 14 8 C18 8 20 11 20 13 C20 11 22 8 26 8 C36 8 38 22 20 35Z"/>', items: ["❤️", "💚", "💛", "💜", "🩷", "💙"] },
  diamond: { name: "diamond", plural: "diamonds", sides: "4 sides, pointy top and bottom", path: '<path d="M20 3 L35 20 L20 37 L5 20Z"/>', items: ["💎", "🔷", "🔶", "🪁"] },
  crescent: { name: "crescent", plural: "crescents", sides: "a curved moon shape", path: '<path d="M26 5 A16 16 0 1 0 35 27 A13 13 0 1 1 26 5Z"/>', items: ["🌙", "🥐", "🍌", "🌜"] },
  rectangle: { name: "rectangle", plural: "rectangles", sides: "4 sides, two long and two short", path: '<rect x="3" y="11" width="34" height="18" rx="2"/>', items: ["🚪", "📕", "🍫", "📗", "🧈"] },
  oval: { name: "oval", plural: "ovals", sides: "round and stretched like an egg", path: '<ellipse cx="20" cy="20" rx="11" ry="16"/>', items: ["🥚", "🥑", "🥔", "🍆", "🫘"] }
};
const ORDER_EASY = ["circle", "triangle", "square", "star", "heart"];
const ORDER_ALL = Object.keys(SHAPES);
const outline = (key) => '<svg viewBox="0 0 40 40" class="ss-outline" aria-hidden="true">' + SHAPES[key].path + "</svg>";

export function mountShapeSafari(context) {
  const F = window.DUFX;
  const pool = context.challenge <= 2 ? ORDER_EASY : ORDER_ALL;
  const missions = shuffle(pool).slice(0, 3);
  const perMission = context.challenge <= 2 ? 3 : context.challenge <= 5 ? 4 : 5;
  const clutter = context.challenge <= 2 ? 9 : context.challenge <= 5 ? 12 : 15;
  const play = createPlay(context, {
    emoji: "🔎", title: "Shape safari", theme: "meadow", buddy: ["tricera", "bronto", "stego"][context.level % 3],
    instruction: "Look all around the meadow. Tap every thing that has the shape you are hunting for!",
    hint: "Take your time. Some shapes hide behind the bushes!", allowed: 3
  });
  const board = play.board;
  board.innerHTML = '<div class="ss-mission" id="ssMission"></div><div class="ss-meadow" id="ssMeadow"></div>';
  const mission = board.querySelector("#ssMission"), meadow = board.querySelector("#ssMeadow");
  let m = -1, found = 0, target = null, busy = false;

  function nextMission() {
    m += 1;
    if (m >= missions.length) return finish();
    target = missions[m]; found = 0; busy = false;
    const S = SHAPES[target];
    mission.innerHTML = '<span class="ss-badge">' + outline(target) + '</span><span class="ss-ask">Mission ' + (m + 1) + " of " + missions.length + ': find the <b>' + S.plural + "</b></span><span class=\"ss-dots\" id=\"ssDots\"></span>";
    drawDots();
    mission.classList.remove("pulse"); void mission.offsetWidth; mission.classList.add("pulse");
    play.hint("A " + S.name + " is " + S.sides + ".", true);
    play.say("Find the " + S.plural + "! They are " + S.sides + ".", 3200);
    layout();
  }
  function drawDots() { mission.querySelector("#ssDots").innerHTML = Array.from({ length: perMission }, function (_, i) { return '<i class="' + (i < found ? "on" : "") + '"></i>'; }).join(""); }

  function layout() {
    // targets of this shape + distractors of other shapes, on a jittered grid so nothing overlaps
    const targets = shuffle(SHAPES[target].items).slice(0, perMission);
    while (targets.length < perMission) targets.push(SHAPES[target].items[targets.length % SHAPES[target].items.length]);
    const others = [];
    shuffle(Object.keys(SHAPES).filter(function (k) { return k !== target; })).forEach(function (k) { shuffle(SHAPES[k].items).slice(0, 2).forEach(function (e) { others.push({ e: e, shape: k }); }); });
    const items = targets.map(function (e) { return { e: e, shape: target }; }).concat(others.slice(0, clutter));
    const cols = 6, rows = Math.ceil(items.length / cols) + 1;
    const cells = shuffle(Array.from({ length: cols * rows }, function (_, i) { return i; })).slice(0, items.length);
    meadow.innerHTML = '<span class="ss-sun">☀️</span><span class="ss-tree t1">🌳</span><span class="ss-tree t2">🌴</span>' +
      '<span class="ss-hill"></span><span class="ss-river"></span>';
    meadow.style.setProperty("--rows", rows);
    items.forEach(function (it, i) {
      const c = cells[i], cx = c % cols, cy = Math.floor(c / cols);
      const b = document.createElement("button");
      b.type = "button"; b.className = "ss-item"; b.dataset.shape = it.shape;
      b.textContent = it.e;
      b.setAttribute("aria-label", "A meadow thing");
      b.style.left = (1 + (cx + 0.1 + Math.random() * 0.7) / cols * 90) + "%";
      b.style.top = (1 + (cy + 0.05 + Math.random() * 0.55) / rows * 88) + "%";
      b.style.setProperty("--d", (-Math.random() * 4).toFixed(2) + "s");
      b.style.fontSize = (34 + Math.random() * 14).toFixed(0) + "px";
      if (context.challenge >= 3 && Math.random() < 0.3) { b.classList.add("peek"); }
      meadow.appendChild(b);
      F.anim && F.anim(b, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 420, delay: i * 40, easing: "cubic-bezier(.2,.9,.3,1.4)" });
      b.addEventListener("click", function () { tap(b, it); });
    });
  }
  function tap(b, it) {
    if (busy || b.classList.contains("got")) return;
    if (it.shape === target) {
      b.classList.add("got"); b.disabled = true; found += 1; drawDots();
      const dot = mission.querySelector(".ss-dots i:nth-child(" + found + ")");
      if (F.flyTo && dot) F.flyTo(b, dot, { emoji: it.e, size: 34, burst: false, duration: 520 });
      play.good(b, { text: found === perMission ? "All the " + SHAPES[target].plural + "!" : null });
      if (found >= perMission) { busy = true; window.setTimeout(function () { play.say("Mission complete! 🎉", 1800); nextMission(); }, 1300); }
    } else {
      const S = SHAPES[it.shape];
      b.classList.add("nope");
      window.setTimeout(function () { b.classList.remove("nope"); }, 500);
      play.miss(b, "That's a " + S.name + " (" + S.sides + "). Look for " + SHAPES[target].plural + "!");
    }
  }
  function finish() {
    meadow.querySelectorAll(".ss-item").forEach(function (x) { x.disabled = true; });
    const r = meadow.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "confetti", n: 40 });
    play.finish("You spotted every shape in the dinosaur meadow!");
  }
  nextMission();
}
