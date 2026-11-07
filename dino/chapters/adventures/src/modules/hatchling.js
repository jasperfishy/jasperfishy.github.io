/* Hatchling Nursery — keep a speckled egg warm until it cracks, meet the baby, then look after it:
 * a snack, a toy and a cuddle make it grow. Name it and it joins your nursery shelf (saved on this device). */
import { createPlay, shuffle, collect, collection } from "../adv-kit.js?v=du-04c80678fe526be4";

const BABIES = [["trex", "green", "T. rex"], ["tricera", "teal", "Triceratops"], ["stego", "purple", "Stegosaurus"], ["bronto", "orange", "Brontosaurus"], ["raptor", "red", "Velociraptor"], ["ptero", "blue", "Pteranodon"]];
const COLORS = ["green", "teal", "purple", "orange", "pink", "blue", "yellow", "red"];
const NAMES = ["Pip", "Dot", "Bean", "Pebble", "Sprout", "Mochi", "Nibbles", "Twig", "Biscuit", "Peanut", "Fern", "Button"];
const SNACKS = [["🍓", "berries"], ["🥬", "leafy greens"], ["🍎", "an apple"], ["🥕", "a carrot"], ["🍌", "a banana"], ["🐟", "a little fish"]];
const TOYS = [["⚽", "ball", "bounce"], ["🪁", "kite", "fly"], ["🧸", "teddy", "hug"], ["🎈", "balloon", "float"], ["🎺", "horn", "toot"]];

export function mountHatchling(context) {
  const F = window.DUFX;
  const baby = BABIES[(context.level - 1) % BABIES.length];
  const color = baby[1];
  const tapsNeeded = Math.min(12, 6 + context.challenge);
  const play = createPlay(context, {
    emoji: "🥚", title: "Hatchling nursery", theme: "meadow", buddy: false, wander: false,
    instruction: "Tap the egg to keep it cosy and warm. Something is wiggling inside!", hint: "Tap, tap, tap! Every tap makes it warmer.", allowed: 1
  });
  const board = play.board;
  const shelf = collection("nursery");
  board.innerHTML = '<div class="hn-stage"><div class="hn-nest"><button type="button" class="hn-egg" id="hnEgg" aria-label="Tap the egg to warm it"><svg class="hn-cracks" viewBox="0 0 100 130" aria-hidden="true"></svg></button><span class="hn-glow"></span></div><div class="hn-baby" id="hnBaby" hidden></div><div class="hn-say" id="hnSay" hidden></div></div>' +
    '<div class="hn-heat"><span id="hnHeatLabel">Warmth</span><div class="progress-track"><span id="hnHeat" style="width:0%"></span></div></div><div class="hn-options" id="hnOptions"></div>' +
    '<div class="hn-shelf" aria-label="Your nursery"><span>Your nursery</span>' + (shelf.length ? shelf.slice(-8).map(function (b) { return '<i title="' + b.name + '">' + F.dinoHTML(b.species, { color: b.color, size: "100%" }) + "</i>"; }).join("") : "<em>Your first baby will live here!</em>") + "</div>";
  const egg = board.querySelector("#hnEgg"), cracks = board.querySelector(".hn-cracks"), babyEl = board.querySelector("#hnBaby"), options = board.querySelector("#hnOptions"), heat = board.querySelector("#hnHeat"), sayEl = board.querySelector("#hnSay");
  const crackPaths = ["M50 8 L44 28 L54 40 L46 58", "M46 58 L62 66 L56 84 L70 96", "M46 58 L28 70 L36 88 L22 100", "M50 8 L60 24 L50 36"];
  let taps = 0, hatched = false, stage = "egg";

  function tell(text) { sayEl.hidden = false; sayEl.textContent = text; F.pop && F.pop(sayEl); }
  egg.addEventListener("click", function () {
    if (hatched) return;
    taps += 1;
    if (F.anim) F.anim(egg, [{ transform: "rotate(0) scale(1)" }, { transform: "rotate(-9deg) scale(1.05)" }, { transform: "rotate(8deg) scale(1.05)" }, { transform: "rotate(-4deg)" }, { transform: "none" }], { duration: 420 });
    if (F.sfx) { F.sfx.tap(); if (taps % 2 === 0) F.sfx.chirp(); }
    const r = egg.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: taps % 3 === 0 ? "hearts" : "sparkle", n: 6 });
    heat.style.width = (taps / tapsNeeded * 100) + "%";
    const crackCount = Math.min(crackPaths.length, Math.floor(taps / tapsNeeded * (crackPaths.length + 1)));
    cracks.innerHTML = crackPaths.slice(0, crackCount).map(function (d) { return '<path d="' + d + '"/>'; }).join("");
    egg.classList.toggle("warm", taps > tapsNeeded / 2);
    const lines = ["Tap, tap! It is wiggling!", "Something tiny is peeping inside!", "Almost there. Keep it cosy!"];
    if (taps < tapsNeeded) play.say(lines[Math.min(2, Math.floor(taps / tapsNeeded * 3))], 1600);
    if (taps >= tapsNeeded) hatch();
  });

  function hatch() {
    hatched = true; stage = "baby";
    egg.disabled = true;
    const r = egg.getBoundingClientRect();
    if (F.sfx) { F.sfx.pop(); window.setTimeout(F.sfx.sparkle, 160); window.setTimeout(F.sfx.chirp, 400); }
    if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "confetti", n: 30 }); F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 16 }); }
    egg.classList.add("hatching");
    window.setTimeout(function () {
      egg.hidden = true;
      babyEl.hidden = false;
      babyEl.innerHTML = F.dinoHTML(baby[0], { color: color, state: "happy", size: "100%" });
      F.pop && F.pop(babyEl);
      F.dinoTrack && F.dinoTrack(babyEl.querySelector(".du-dino"));
      play.good(babyEl, { text: "It hatched!" });
      play.say("A baby " + baby[2] + "! Hello, little one! 💛", 3000);
      board.querySelector("#hnHeatLabel").textContent = "Happiness";
      heat.style.width = "0%"; board.querySelector(".hn-glow").classList.add("on");
      window.setTimeout(feed, 1500);
    }, 650);
  }
  const needs = { fed: false, played: false, hugged: false };
  function grow(label) {
    const done = Object.keys(needs).filter(function (k) { return needs[k]; }).length;
    heat.style.width = (done / 3 * 100) + "%";
    babyEl.style.setProperty("--grow", (1 + done * 0.22).toFixed(2));
    babyEl.classList.add("grown");
    play.say(label, 2200);
  }
  function feed() {
    const want = shuffle(SNACKS).slice(0, 3);
    const target = want[0];
    babyEl.querySelector(".du-dino").setAttribute("data-state", "idle");
    tell("I'm hungry! I would like " + target[1] + ", please!");
    options.innerHTML = '<p class="hn-q">What does the baby want to eat?</p><div class="hn-row"></div>';
    shuffle(want).forEach(function (s) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pk-btn hn-opt"; b.innerHTML = '<span>' + s[0] + "</span><small>" + s[1] + "</small>";
      options.querySelector(".hn-row").appendChild(b);
      b.addEventListener("click", function () {
        if (s !== target) { play.miss(b, "Not that one! The baby asked for " + target[1] + "."); return; }
        options.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
        const d = babyEl.querySelector(".du-dino");
        const go = F.flyTo ? F.flyTo(b, d, { emoji: s[0], size: 38, burst: false, duration: 520 }) : Promise.resolve();
        go.then(function () {
          F.dinoState(d, "eat", 1200); if (F.sfx) { F.sfx.chomp(); window.setTimeout(F.sfx.chomp, 350); }
          needs.fed = true; play.good(babyEl, { text: "Yum!" }); grow("Nom nom nom! The baby grew a little! 🌱");
          window.setTimeout(playTime, 1800);
        });
      });
    });
  }
  function playTime() {
    const want = shuffle(TOYS).slice(0, 3);
    tell("Now I want to play! Pick a toy for me.");
    options.innerHTML = '<p class="hn-q">Choose a toy to play with.</p><div class="hn-row"></div>';
    want.forEach(function (t) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pk-btn hn-opt"; b.innerHTML = '<span>' + t[0] + "</span><small>" + t[1] + "</small>";
      options.querySelector(".hn-row").appendChild(b);
      b.addEventListener("click", function () {
        options.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
        const toy = document.createElement("span");
        toy.className = "hn-toy hn-" + t[2]; toy.textContent = t[0];
        board.querySelector(".hn-stage").appendChild(toy);
        F.dinoState(babyEl.querySelector(".du-dino"), "happy", 2400);
        if (F.sfx) { t[2] === "toot" ? F.sfx.note(4, .4) : F.sfx.boing(); }
        needs.played = true; play.good(babyEl, { text: "Wheee!" }); grow("Wheee! Playing is the best! 🎉");
        window.setTimeout(function () { toy.remove(); cuddle(); }, 2400);
      });
    });
  }
  function cuddle() {
    tell("I'm sleepy… can I have a cuddle?");
    options.innerHTML = '<p class="hn-q">Tap the baby gently to give it cuddles. 💞</p><div class="hn-cuddles"></div>';
    let n = 0; const need = 4;
    const d = babyEl.querySelector(".du-dino");
    const meter = options.querySelector(".hn-cuddles");
    const onTap = function () {
      if (n >= need) return;
      n += 1; meter.textContent = "💚".repeat(n) + "🤍".repeat(need - n);
      if (F.sfx) F.sfx.chirp();
      const r = d.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: "hearts", n: 6 });
      F.dinoState(d, "happy", 700);
      if (F.squish) F.squish(babyEl);
      if (n >= need) { babyEl.removeEventListener("click", onTap); needs.hugged = true; play.good(babyEl, { text: "Cuddles!" }); grow("So snuggly! Now the baby is big and happy! 💚"); window.setTimeout(naming, 1700); }
    };
    meter.textContent = "🤍".repeat(need);
    babyEl.addEventListener("click", onTap);
    babyEl.classList.add("hn-tappable");
  }
  function naming() {
    babyEl.classList.remove("hn-tappable");
    F.dinoState(babyEl.querySelector(".du-dino"), "happy", 99999);
    tell("What shall my name be?");
    options.innerHTML = '<p class="hn-q">Pick a name for your baby dinosaur.</p><div class="hn-row"></div>';
    shuffle(NAMES).slice(0, 3).forEach(function (nm) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pk-btn hn-opt"; b.innerHTML = "<span>🏷️</span><small>" + nm + "</small>";
      options.querySelector(".hn-row").appendChild(b);
      b.addEventListener("click", function () {
        options.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
        collect("nursery", { species: baby[0], color: color, name: nm });
        if (F.sfx) { F.sfx.win(); }
        const r = babyEl.getBoundingClientRect(); if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "confetti", n: 34 }); F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "hearts", n: 12 }); }
        tell("My name is " + nm + "! Thank you for looking after me!");
        play.say(nm + " joins your nursery shelf! 🏠", 3000);
        window.setTimeout(function () { play.finish("Your new dinosaur friend " + nm + " is happy and healthy!"); }, 1800);
      });
    });
  }
}
