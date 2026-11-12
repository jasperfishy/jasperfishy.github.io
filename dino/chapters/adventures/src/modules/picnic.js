/* Dino Picnic — hungry dinosaur guests walk up to the picnic blanket and ask for something to eat.
 * Drag (or tap) the right food. Requests grow from names ("berries!") to kinds, colours, feels, drinks and puddings,
 * so a long table wants a dish, a sip and a sweet finish. The weather changes the table each round, a wrong dish
 * earns a teaching nudge, a free hint glows the right plate, and a fed table can unlock a dessert dash. */
import { createPlay, shuffle, dragPiece, collect, collection } from "../adv-kit.js?v=du-9ab77cff6b9ebbf2";

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
  { icon: "🍑", label: "a peach", color: "orange", feel: "juicy", kind: "plants" },
  { icon: "🍒", label: "cherries", color: "red", feel: "sweet", kind: "plants" },
  { icon: "🍄", label: "a mushroom", color: "brown", feel: "soft", kind: "plants" },
  { icon: "🥥", label: "a coconut", color: "brown", feel: "hard", kind: "plants" },
  { icon: "🌿", label: "a fern top", color: "green", feel: "leafy", kind: "plants" },
  { icon: "🦀", label: "a crab", color: "red", feel: "fishy", kind: "fish" },
  { icon: "💧", label: "cool water", color: "blue", feel: "sip", kind: "drink" },
  { icon: "🧃", label: "berry juice", color: "purple", feel: "sip", kind: "drink" },
  { icon: "🥛", label: "a milky shell", color: "white", feel: "sip", kind: "drink" },
  { icon: "🍯", label: "a pot of honey", color: "yellow", feel: "sticky", kind: "sweet" },
  { icon: "🍰", label: "a cake", color: "pink", feel: "soft", kind: "sweet" },
  { icon: "🍪", label: "a biscuit", color: "brown", feel: "crunchy", kind: "sweet" },
  { icon: "🍨", label: "ice cream", color: "white", feel: "cold", kind: "sweet" },
  { icon: "🥧", label: "a berry pie", color: "orange", feel: "warm", kind: "sweet" }
];
const POOLS = {
  main: FOODS.filter(function (f) { return f.kind === "plants" || f.kind === "fish"; }),
  drink: FOODS.filter(function (f) { return f.kind === "drink"; }),
  sweet: FOODS.filter(function (f) { return f.kind === "sweet"; })
};
const GUESTS = [["trex", "green", "Rexy"], ["tricera", "teal", "Trixie"], ["stego", "purple", "Spike"], ["bronto", "orange", "Bronte"], ["raptor", "red", "Zippy"], ["ptero", "blue", "Skye"], ["tricera", "yellow", "Sunny"], ["stego", "pink", "Rosie"],
  ["bronto", "teal", "Berry"], ["raptor", "purple", "Pip"], ["tricera", "red", "Ruby"], ["ptero", "orange", "Cloudy"]];
const SPECIES_NAME = { trex: "T. rex", tricera: "Triceratops", stego: "Stegosaurus", bronto: "Brontosaurus", raptor: "Raptor", ptero: "Pteranodon" };
// These two guests always have room for one more course, so a long table really does get longer.
const BIG_EATERS = { trex: 1, raptor: 1 };
const WEATHERS = [
  { icon: "☀️", name: "bright and sunny", theme: "meadow", note: "Perfect picnic weather — the flowers are wide open!" },
  { icon: "🌤️", name: "soft with clouds", theme: "meadow", note: "A cloudy day. The guests like sitting in the cool grass." },
  { icon: "🌧️", name: "a little showery", theme: "rain", note: "Pitter patter! Everyone is extra thirsty today.", drinks: true },
  { icon: "🌈", name: "rainbow after rain", theme: "rain", note: "A rainbow over the blanket — the puddle is full of fish!" }
];
const COURSE_ICON = { main: "💚", drink: "💧", sweet: "🍮" };
const SWEETS_ASK = ["Save me a pudding, please — something sweet!", "And now, may I have something sweet?"];

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
function sameAs(food, req) {
  if (req.by === "name") return food.label === req.value;
  if (req.by === "kind") return food.kind === req.value;
  if (req.by === "color") return food.color === req.value;
  return food.feel === req.value;
}
function whatItIs(value) {
  return value === "fish" ? "from the water" : value === "drink" ? "something to sip" : value === "sweet" ? "a pudding" : "a plant";
}
function makeRequest(level, type, pool) {
  const target = pool[Math.floor(Math.random() * pool.length)];
  let by = "name";
  if (type === "sweet") by = level >= 4 && Math.random() < 0.5 ? "kind" : "name";
  else if (type === "drink") by = Math.random() < 0.45 ? "kind" : "name";
  else if (level >= 3 && Math.random() < 0.55) by = "kind";
  if (type === "main" && level >= 5 && Math.random() < 0.7) by = Math.random() < 0.5 ? "color" : "feel";
  const value = by === "name" ? target.label : by === "kind" ? target.kind : target[by];
  const req = { by: by, value: value, target: target, type: type };
  req.text = by === "name" ? "Please may I have " + target.label + "?" :
    by === "kind" ? (value === "fish" ? "I love food from the water!" : value === "drink" ? "I'm hot and thirsty — something to sip!" :
      value === "sweet" ? pick(SWEETS_ASK) : "I only eat plants, yum!") :
    by === "color" ? "I would like something " + value + "!" : "I'm in the mood for something " + value + "!";
  return req;
}
// A wrong dish is a teaching moment, not a scold: name what was nearly right, then what the guest really asked for.
function nudge(guest, food, req) {
  if (req.by === "kind") {
    if (food.kind === req.value) return "That is " + req.value + "! Have another look — one of these is not.";
    return "Not quite — " + food.label + " isn't " + whatItIs(req.value) + ". Look again 💛";
  }
  if (req.by === "color" && food.color === req.value) return "Ooh, that IS " + req.value + " — but " + guest[2] + " wanted " + req.target.label + ".";
  if (req.by === "feel" && food.feel === req.value) return "That IS " + req.value + "! " + guest[2] + " is looking for " + req.target.label + ", though.";
  if (req.by === "name") return "Nearly! That's " + food.label + " — the guest asked for " + req.target.label + ".";
  return "Hmm, not " + req.value + ". " + guest[2] + " would love " + req.target.label + "!";
}

export function mountPicnic(context) {
  const F = window.DUFX;
  const ch = Math.max(1, Number(context.challenge) || 1);
  const guestsTotal = Math.min(GUESTS.length, 4 + Math.floor(ch / 2));
  const choices = ch >= 6 ? 6 : ch >= 4 ? 5 : 3;
  const withDrinks = ch >= 3;
  const weather = WEATHERS[(context.level + (ch >= 5 ? 1 : 0)) % WEATHERS.length];
  const best = collection("picnic-runs").reduce(function (b, r) { return r.mixups === 0 && r.fed > b ? r.fed : b; }, 0);
  const play = createPlay(context, {
    emoji: "🧺", title: "Dino picnic", theme: weather.theme, buddy: false, wander: false,
    instruction: "Hungry dinosaurs are coming to the picnic! Drag the right food to each guest.",
    hint: "Listen to what the guest asks for, then pick the matching food.", allowed: Math.max(2, guestsTotal - 1)
  });
  const board = play.board;
  board.innerHTML = '<div class="pn-table"><div class="pn-guest" id="pnGuest"></div><div class="pn-blanket"></div><div class="pn-bubble" id="pnBubble" hidden></div>' +
    '<div class="pn-meter" id="pnMeter" aria-label="Tummy"></div><p class="pn-basket-label" id="pnWeather"></p></div>' +
    '<div class="pn-basket"><span class="pn-basket-label" id="pnBasketLabel"></span><div class="pn-foods" id="pnFoods"></div>' +
    '<p style="text-align:center;margin:8px 0 0"><button type="button" class="tiny-button" id="pnHelp">💡 Need a hint?</button></p></div>' +
    '<div class="pn-fed" id="pnFed" aria-label="Fed friends"></div>';
  const guestEl = board.querySelector("#pnGuest"), bubble = board.querySelector("#pnBubble"), foodsEl = board.querySelector("#pnFoods"),
    meter = board.querySelector("#pnMeter"), fedEl = board.querySelector("#pnFed"), helpBtn = board.querySelector("#pnHelp"),
    basket = board.querySelector(".pn-basket"), weatherEl = board.querySelector("#pnWeather"), basketLabel = board.querySelector("#pnBasketLabel");
  const order = shuffle(GUESTS).slice(0, guestsTotal);
  let n = 0, course = 0, plan = [], req = null, guest = null, busy = false, hintUsed = false, mode = "eat";

  weatherEl.textContent = "Today the picnic is " + weather.name + " " + weather.icon;
  basketLabel.textContent = best ? "Your best picnic: " + best + " friends fed with no mix-ups! 🧺" : "Feed every guest their own choice!";
  play.hint(weather.note + (withDrinks ? " This table has more courses: a dish, a sip and a pudding." : ""), true);
  if (weather.drinks) play.say("It's warm today — some guests would love something to sip!", 3200);
  if (weather.icon === "🌧️" || weather.icon === "🌈") rainPuff();

  function rainPuff() {
    const strip = document.createElement("div");
    strip.setAttribute("aria-hidden", "true");
    strip.style.cssText = "position:absolute;left:0;right:0;top:0;height:100%;pointer-events:none;overflow:hidden;z-index:3";
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("i");
      d.textContent = "💧";
      d.style.cssText = "position:absolute;font-style:normal;font-size:14px;left:" + (6 + i * 10) + "%;top:-12%;opacity:.7";
      strip.appendChild(d);
      if (F.anim) F.anim(d, [{ transform: "translateY(0)" }, { transform: "translateY(230px)" }], { duration: 2200 + i * 170, delay: i * 240, iterations: 4 });
    }
    play.scene.appendChild(strip);
  }
  function coursesFor(sp) {
    let c = ch >= 6 ? 3 : ch >= 4 ? 2 : 1;
    if (BIG_EATERS[sp] && c < 3) c += 1;
    if (weather.drinks && c < 3) c += 1;
    const p = ["main"];
    if (c === 2) p.push(withDrinks && Math.random() < 0.5 ? "drink" : "sweet");
    if (c >= 3) { p.push(withDrinks ? "drink" : "main"); p.push("sweet"); }
    return p;
  }
  function nextGuest() {
    if (n >= order.length) return dessertDash();
    guest = order[n]; n += 1; course = 0; busy = true; hintUsed = false;
    plan = coursesFor(guest[0]);
    helpBtn.disabled = false; helpBtn.textContent = "💡 Need a hint?";
    guestEl.innerHTML = F.dinoHTML(guest[0], { color: guest[1], state: "walk", size: "100%" });
    const d = guestEl.querySelector(".du-dino");
    if (F.anim) F.anim(guestEl, [{ transform: "translateX(-140%)" }, { transform: "translateX(0)" }], { duration: 1100, easing: "ease-out" });
    if (F.sfx) F.sfx.chirp();
    play.hint(guest[2] + " the " + SPECIES_NAME[guest[0]] + " has arrived! Guest " + n + " of " + order.length + ", " + plan.length + " courses.", true);
    window.setTimeout(function () { F.dinoState(d, "idle"); busy = false; ask(); }, 1100);
  }
  function renderMeter() {
    meter.innerHTML = plan.map(function (t, i) { return '<i class="' + (i < course ? "on" : "") + '">' + (i < course ? COURSE_ICON[t] : "🤍") + "</i>"; }).join("") +
      '<span style="font-size:11px;font-weight:800;color:#5b6b5d;margin-left:6px">course ' + Math.min(course + 1, plan.length) + " of " + plan.length + "</span>";
  }
  function ask() {
    const type = plan[course];
    const pool = type === "sweet" ? POOLS.sweet : type === "drink" ? POOLS.drink : POOLS.main;
    req = makeRequest(ch, type, pool);
    const lead = course === 0 ? "" : type === "drink" ? "Now something to drink: " : type === "sweet" ? "And for pudding: " : "Mmm! Next: ";
    bubble.hidden = false; bubble.textContent = lead + req.text;
    F.pop && F.pop(bubble);
    play.say(lead + req.text, 3000);
    renderMeter();
    // the target plus decoys that do NOT match, drawn from this course's own pool
    const wrong = shuffle(pool.filter(function (f) { return !sameAs(f, req); })).slice(0, choices - 1);
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
  helpBtn.addEventListener("click", function () {
    if (mode === "dash") return finishDash();
    if (busy || !req || hintUsed) return;
    hintUsed = true; helpBtn.disabled = true; helpBtn.textContent = "💡 Hint used — you've got this!";
    if (F.sfx) F.sfx.star();
    Array.prototype.forEach.call(foodsEl.querySelectorAll(".pn-food"), function (b) {
      const food = FOODS.find(function (f) { return f.label === b.dataset.label; });
      if (!food || !sameAs(food, req)) return;
      b.style.boxShadow = "0 0 0 4px #ffd166, 0 5px 0 rgba(120,80,30,.3)";
      if (F.anim) F.anim(b, [{ transform: "scale(1)" }, { transform: "scale(1.16)" }, { transform: "scale(1)" }], { duration: 620, easing: "ease-in-out" });
    });
    play.say("Look for the one that matches: " + req.text, 3200);
    play.hint("A glow shows the dish " + guest[2] + " asked for 💛", true);
  });
  function choose(btn, food) {
    if (busy || btn.disabled) return;
    const d = guestEl.querySelector(".du-dino");
    if (sameAs(food, req)) {
      busy = true;
      foodsEl.querySelectorAll(".pn-food").forEach(function (b) { b.disabled = true; b.style.boxShadow = ""; });
      const go = F.flyTo ? F.flyTo(btn, d, { emoji: food.icon, size: 40, burst: false, duration: 520 }) : Promise.resolve();
      go.then(function () {
        F.dinoState(d, "eat", 1100);
        // a distinct noise for every kind of dish, so a pudding does not sound like a fish
        const crunch = food.kind === "drink" || food.kind === "fish" ? "splash" : food.kind === "sweet" ? "sparkle" : "chomp";
        if (F.sfx) { F.sfx[crunch](); if (crunch === "chomp") window.setTimeout(F.sfx.chomp, 320); }
        if (F.anim) F.anim(guestEl, [{ transform: "translateY(0)" }, { transform: "translateY(-14px)" }, { transform: "translateY(0)" }], { duration: 480, easing: "ease-out" });
        course += 1; renderMeter();
        const r = d.getBoundingClientRect();
        play.good({ x: r.left + r.width * 0.7, y: r.top + r.height * 0.3 }, { text: course >= plan.length ? "Yum!" : "Yum! More?" });
        if (F.burst) F.burst(r.left + r.width * 0.7, r.top + r.height * 0.35, { kind: food.kind === "sweet" ? "sparkle" : "hearts", n: 8 });
        bubble.hidden = true;
        if (course < plan.length) { window.setTimeout(function () { busy = false; play.say("Mmm! And what else, " + guest[2] + "?"); window.setTimeout(ask, 600); }, 1100); return; }
        window.setTimeout(function () {
          F.dinoState(d, "happy", 1200);
          play.say(guest[2] + " is full and happy! 💚");
          const chip = document.createElement("span"); chip.className = "pn-chip"; chip.innerHTML = F.dinoHTML(guest[0], { color: guest[1], state: "happy", size: "100%" }); fedEl.appendChild(chip); F.pop && F.pop(chip);
          // the plate the guest finished with, so the table fills up as the picnic goes on
          const plate = document.createElement("span");
          plate.textContent = food.icon; plate.title = food.label;
          plate.style.cssText = "display:block;width:34px;margin:0 auto;text-align:center;font-size:22px";
          chip.appendChild(plate);
          window.setTimeout(function () {
            F.dinoState(d, "walk");
            if (F.sfx) F.sfx.whoosh();
            if (F.anim) { const a = F.anim(guestEl, [{ transform: "translateX(0)" }, { transform: "translateX(150%)" }], { duration: 900, easing: "ease-in", fill: "forwards" }); if (a) a.onfinish = function () { guestEl.innerHTML = ""; nextGuest(); }; else { guestEl.innerHTML = ""; nextGuest(); } } else { guestEl.innerHTML = ""; nextGuest(); }
          }, 1300);
        }, 1000);
      });
    } else {
      btn.classList.add("pn-nope");
      F.dinoState(d, "sad", 900);
      play.miss(btn, guest[2] + ": \"" + nudge(guest, food, req) + "\"");
      window.setTimeout(function () { btn.classList.remove("pn-nope"); }, 500);
    }
  }
  /* Optional bonus once every guest has been fed: a fast pudding round. Skippable, so nobody feels stuck. */
  function dessertDash() {
    if (ch < 4) return party(false);
    mode = "dash";
    guestEl.innerHTML = ""; bubble.hidden = true; helpBtn.disabled = false;
    helpBtn.textContent = "Skip the dessert dash →";
    basket.hidden = false;
    basketLabel.textContent = "🍨 Dessert dash! Tap the pudding each guest points at.";
    const sweets = shuffle(POOLS.sweet.slice());
    let i = 0;
    function dash() {
      busy = true;
      const want = sweets[i % sweets.length];
      const others = shuffle(POOLS.sweet.filter(function (s) { return s !== want; })).slice(0, 2);
      meter.innerHTML = '<i class="on">🍨</i>'.repeat(i) + "<i>🤍</i>".repeat(Math.max(0, 3 - i));
      guestEl.innerHTML = F.dinoHTML(order[i % order.length][0], { color: "pink", state: "happy", size: "100%" });
      play.hint("Dessert " + (i + 1) + " of 3 — " + want.label + "!", true);
      play.say("I would love " + want.label + "!", 2600);
      if (F.sfx) F.sfx.star();
      foodsEl.innerHTML = "";
      shuffle(others.concat([want])).forEach(function (s, k) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "pn-food"; b.innerHTML = '<span>' + s.icon + "</span><small>" + s.label + "</small>";
        foodsEl.appendChild(b);
        if (F.anim) F.anim(b, [{ transform: "translateY(20px) scale(.7)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 360, delay: k * 60, fill: "backwards" });
        b.addEventListener("click", function () {
          if (s !== want) { play.miss(b, "That's a lovely " + s.label + ", but this guest wants " + want.label + "!"); return; }
          busy = false;
          b.disabled = true; foodsEl.querySelectorAll(".pn-food").forEach(function (x) { x.disabled = true; });
          if (F.sfx) F.sfx.sparkle();
          const r = b.getBoundingClientRect();
          if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "sparkle", n: 14 });
          play.good(b, { text: "Sweet!" });
          i += 1;
          window.setTimeout(function () { if (i >= 3) finishDash(); else dash(); }, 900);
        });
      });
    }
    dash();
  }
  function finishDash() {
    if (mode !== "dash") return;
    mode = "eat"; busy = true;
    meter.innerHTML = ""; helpBtn.disabled = true;
    party(true);
  }
  function party(dashed) {
    busy = true; guestEl.innerHTML = ""; bubble.hidden = true; foodsEl.innerHTML = ""; meter.innerHTML = "";
    helpBtn.disabled = true;
    basket.hidden = true;
    fedEl.classList.add("pn-party");
    if (F.sfx) F.sfx.win();
    fedEl.querySelectorAll(".du-dino").forEach(function (d, i) { window.setTimeout(function () { F.dinoState(d, "happy", 9999); }, i * 120); });
    play.say("Picnic party! 🎉🍰", 3000);
    const r = fedEl.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "confetti", n: 40 });
    collect("picnic-runs", { fed: order.length, mixups: play.state.misses, stars: play.rating(), dash: !!dashed });
    window.setTimeout(function () {
      play.finish("You fed " + order.length + " hungry friends" + (dashed ? " and won the dessert dash" : "") + " on a " + weather.name + " day!");
    }, 1800);
  }
  nextGuest();
}
