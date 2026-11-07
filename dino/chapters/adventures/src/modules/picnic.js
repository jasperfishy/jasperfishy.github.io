/* Dino Picnic — hungry dinosaur guests walk up to the picnic blanket and ask for something to eat.
 * Drag (or tap) the right food. Requests grow from names ("berries!") to kinds ("I only eat plants")
 * to clues ("something red", "something crunchy"). Big guests ask for two courses. Everyone dances at the end. */
import { createPlay, shuffle, dragPiece } from "../adv-kit.js?v=du-2b5bf1340085b709";

const FOODS = [
  { icon: "🥬", label: "leafy greens", color: "green", feel: "leafy", kind: "plants" },
  { icon: "🍓", label: "berries", color: "red", feel: "sweet", kind: "plants" },
  { icon: "🐟", label: "a fish", color: "silver", feel: "fishy", kind: "fish" },
  { icon: "🍎", label: "an apple", color: "red", feel: "crunchy", kind: "plants" },
  { icon: "🥕", label: "a carrot", color: "orange", feel: "crunchy", kind: "plants" },
  { icon: "🦐", label: "a shrimp", color: "pink", feel: "fishy", kind: "fish" },
  { icon: "🍌", label: "a banana", color: "yellow", feel: "sweet", kind: "plants" },
  { icon: "🍇", label: "grapes", color: "purple", feel: "sweet", kind: "plants" },
  { icon: "🥦", label: "broccoli", color: "green", feel: "crunchy", kind: "plants" },
  { icon: "🌽", label: "corn", color: "yellow", feel: "crunchy", kind: "plants" },
  { icon: "🍉", label: "watermelon", color: "red", feel: "juicy", kind: "plants" },
  { icon: "🍋", label: "a lemon", color: "yellow", feel: "sour", kind: "plants" },
  { icon: "🐠", label: "a little fish", color: "orange", feel: "fishy", kind: "fish" },
  { icon: "🍑", label: "a peach", color: "orange", feel: "juicy", kind: "plants" }
];
const GUESTS = [["trex", "green", "Rexy"], ["tricera", "teal", "Trixie"], ["stego", "purple", "Spike"], ["bronto", "orange", "Bronte"], ["raptor", "red", "Zippy"], ["ptero", "blue", "Skye"], ["tricera", "yellow", "Sunny"], ["stego", "pink", "Rosie"]];
const BIG_EATERS = { trex: "meat", raptor: "meat" };

function sameAs(food, req) {
  if (req.by === "name") return food.label === req.value;
  if (req.by === "kind") return food.kind === req.value;
  if (req.by === "color") return food.color === req.value;
  return food.feel === req.value;
}
function makeRequest(level, pool) {
  const target = pool[Math.floor(Math.random() * pool.length)];
  let by = "name";
  if (level >= 3 && Math.random() < 0.55) by = "kind";
  if (level >= 5 && Math.random() < 0.7) by = Math.random() < 0.5 ? "color" : "feel";
  const value = by === "name" ? target.label : by === "kind" ? target.kind : target[by];
  const req = { by: by, value: value, target: target };
  req.text = by === "name" ? "Please may I have " + target.label + "?" :
    by === "kind" ? (value === "fish" ? "I love food from the water!" : "I only eat plants, yum!") :
    by === "color" ? "I would like something " + value + "!" : "I'm in the mood for something " + value + "!";
  return req;
}

export function mountPicnic(context) {
  const F = window.DUFX;
  const guestsTotal = Math.min(8, 4 + Math.floor(context.challenge / 2));
  const choices = context.challenge >= 5 ? 5 : context.challenge >= 3 ? 4 : 3;
  const courses = context.challenge >= 4 ? 2 : 1;
  const play = createPlay(context, {
    emoji: "🧺", title: "Dino picnic", theme: "meadow", buddy: false, wander: false,
    instruction: "Hungry dinosaurs are coming to the picnic! Drag the right food to each guest.",
    hint: "Listen to what the guest asks for, then pick the matching food.", allowed: Math.max(2, guestsTotal - 1)
  });
  const board = play.board;
  board.innerHTML = '<div class="pn-table"><div class="pn-guest" id="pnGuest"></div><div class="pn-blanket"></div><div class="pn-bubble" id="pnBubble" hidden></div>' +
    '<div class="pn-meter" id="pnMeter" aria-label="Tummy"></div></div>' +
    '<div class="pn-basket"><span class="pn-basket-label">Picnic basket</span><div class="pn-foods" id="pnFoods"></div></div>' +
    '<div class="pn-fed" id="pnFed" aria-label="Fed friends"></div>';
  const guestEl = board.querySelector("#pnGuest"), bubble = board.querySelector("#pnBubble"), foodsEl = board.querySelector("#pnFoods"), meter = board.querySelector("#pnMeter"), fedEl = board.querySelector("#pnFed");
  const order = shuffle(GUESTS);
  let n = 0, course = 0, req = null, guest = null, busy = false;

  function nextGuest() {
    if (n >= guestsTotal) return party();
    guest = order[n % order.length]; n += 1; course = 0; busy = true;
    guestEl.innerHTML = F.dinoHTML(guest[0], { color: guest[1], state: "walk", size: "100%" });
    const d = guestEl.querySelector(".du-dino");
    if (F.anim) F.anim(guestEl, [{ transform: "translateX(-140%)" }, { transform: "translateX(0)" }], { duration: 1100, easing: "ease-out" });
    if (F.sfx) F.sfx.chirp();
    play.hint(guest[2] + " the " + (guest[0] === "tricera" ? "Triceratops" : guest[0] === "trex" ? "T. rex" : guest[0] === "stego" ? "Stegosaurus" : guest[0] === "bronto" ? "Brontosaurus" : guest[0] === "raptor" ? "Raptor" : "Pteranodon") + " has arrived!", true);
    window.setTimeout(function () { F.dinoState(d, "idle"); busy = false; ask(); }, 1100);
  }
  function renderMeter() { meter.innerHTML = Array.from({ length: courses }, function (_, i) { return '<i class="' + (i < course ? "on" : "") + '">' + (i < course ? "💚" : "🤍") + "</i>"; }).join(""); }
  function ask() {
    // pool: plant eaters and fish lovers mixed so kind requests make sense
    req = makeRequest(context.challenge, FOODS);
    bubble.hidden = false; bubble.textContent = req.text;
    F.pop && F.pop(bubble);
    play.say(req.text, 3000);
    renderMeter();
    // choose foods: the target plus others that do NOT match the request
    const wrong = shuffle(FOODS.filter(function (f) { return !sameAs(f, req); })).slice(0, choices - 1);
    const sel = shuffle(wrong.concat([req.target]));
    foodsEl.innerHTML = "";
    sel.forEach(function (f, i) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pn-food"; b.dataset.label = f.label;
      b.innerHTML = '<span>' + f.icon + "</span><small>" + f.label + "</small>";
      b.setAttribute("aria-label", f.label);
      foodsEl.appendChild(b);
      if (F.anim) F.anim(b, [{ transform: "translateY(24px) scale(.6)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, delay: i * 70, easing: "cubic-bezier(.2,.9,.3,1.3)" });
      b.addEventListener("click", function () { choose(b, f); });
      dragPiece(b, { ghost: function () { const g = document.createElement("div"); g.className = "pn-ghost"; g.textContent = f.icon; return g; }, onDrop: function (x, y) { const r = guestEl.getBoundingClientRect(); if (x > r.left - 30 && x < r.right + 30 && y > r.top - 40 && y < r.bottom + 50) choose(b, f); else { play.hint("Drop the food on the dinosaur's mouth."); } } });
    });
  }
  function choose(btn, food) {
    if (busy || btn.disabled) return;
    const d = guestEl.querySelector(".du-dino");
    if (sameAs(food, req)) {
      busy = true;
      foodsEl.querySelectorAll(".pn-food").forEach(function (b) { b.disabled = true; });
      const go = F.flyTo ? F.flyTo(btn, d, { emoji: food.icon, size: 40, burst: false, duration: 520 }) : Promise.resolve();
      go.then(function () {
        F.dinoState(d, "eat", 1100);
        if (F.sfx) F.sfx.chomp();
        window.setTimeout(function () { if (F.sfx) F.sfx.chomp(); }, 320);
        course += 1; renderMeter();
        const r = d.getBoundingClientRect();
        play.good({ x: r.left + r.width * 0.7, y: r.top + r.height * 0.3 }, { text: course >= courses ? "Yum!" : "Yum! More?" });
        if (F.burst) F.burst(r.left + r.width * 0.7, r.top + r.height * 0.35, { kind: "hearts", n: 8 });
        bubble.hidden = true;
        if (course < courses) { window.setTimeout(function () { busy = false; play.say("Mmm! And what else, " + guest[2] + "?"); window.setTimeout(ask, 600); }, 1100); return; }
        window.setTimeout(function () {
          F.dinoState(d, "happy", 1200);
          play.say(guest[2] + " is full and happy! 💚");
          const chip = document.createElement("span"); chip.className = "pn-chip"; chip.innerHTML = F.dinoHTML(guest[0], { color: guest[1], state: "happy", size: "100%" }); fedEl.appendChild(chip); F.pop && F.pop(chip);
          window.setTimeout(function () {
            F.dinoState(d, "walk");
            if (F.anim) { const a = F.anim(guestEl, [{ transform: "translateX(0)" }, { transform: "translateX(150%)" }], { duration: 900, easing: "ease-in", fill: "forwards" }); if (a) a.onfinish = function () { guestEl.innerHTML = ""; nextGuest(); }; else { guestEl.innerHTML = ""; nextGuest(); } } else { guestEl.innerHTML = ""; nextGuest(); }
          }, 1300);
        }, 1000);
      });
    } else {
      const isKindWrong = req.by === "kind";
      btn.classList.add("pn-nope");
      F.dinoState(d, "sad", 900);
      const why = req.by === "kind" ? (req.value === "fish" ? "That doesn't come from the water, silly!" : "That's not a plant! Try again.") : req.by === "name" ? "Not that one — " + req.target.label + ", please!" : "Hmm, that's not " + req.value + ". Look again!";
      play.miss(btn, guest[2] + ": \"" + why + "\"");
      window.setTimeout(function () { btn.classList.remove("pn-nope"); }, 500);
    }
  }
  function party() {
    busy = true; guestEl.innerHTML = ""; bubble.hidden = true; foodsEl.innerHTML = ""; meter.innerHTML = "";
    board.querySelector(".pn-basket").hidden = true;
    fedEl.classList.add("pn-party");
    if (F.sfx) F.sfx.win();
    fedEl.querySelectorAll(".du-dino").forEach(function (d, i) { window.setTimeout(function () { F.dinoState(d, "happy", 9999); }, i * 120); });
    play.say("Picnic party! 🎉🍰", 3000);
    const r = fedEl.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "confetti", n: 40 });
    window.setTimeout(function () { play.finish("Every dinosaur had a lovely picnic!"); }, 1800);
  }
  nextGuest();
}
