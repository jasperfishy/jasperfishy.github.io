/* Hatchling Nursery — keep a speckled egg warm until it cracks, meet the baby, then look after it: a snack, a drink,
 * a toy, a tidy nest and a cuddle make it grow. Name it and it joins your nursery shelf (saved on this device).
 * Every round brings a different egg pattern, a different baby and one more thing to do; a free hint points at what the
 * baby is asking for, and a settled baby may stay for a game of peekaboo before goodnight. */
import { createPlay, shuffle, collect, collection, escapeText } from "../adv-kit.js?v=du-b206df16c491b071";

const BABIES = [["trex", "green", "T. rex"], ["tricera", "teal", "Triceratops"], ["stego", "purple", "Stegosaurus"], ["bronto", "orange", "Brontosaurus"], ["raptor", "red", "Velociraptor"], ["ptero", "blue", "Pteranodon"],
  ["tricera", "yellow", "Triceratops"], ["stego", "pink", "Stegosaurus"], ["raptor", "purple", "Velociraptor"], ["bronto", "teal", "Brontosaurus"], ["trex", "orange", "T. rex"], ["ptero", "orange", "Pteranodon"]];
const NAMES = ["Pip", "Dot", "Bean", "Pebble", "Sprout", "Mochi", "Nibbles", "Twig", "Biscuit", "Peanut", "Fern", "Button", "Clover", "Waffles", "Marbles", "Pudding"];
/* What a baby dinosaur is actually fed, played with and tidied up after —
 * every one of these is a specimen the universe has a photograph of. */
const SNACKS = [["🍓", "berries"], ["🍃", "a young leaf"], ["🌱", "a green sprout"], ["🌰", "a seed cone"], ["🐟", "a little fish"], ["🌾", "a seed head"], ["🌿", "a fern top"], ["🍄", "a soft mushroom"], ["☘️", "a moss cup"]];
const DRINKS = [["💧", "cool water"], ["🐚", "a shell of milk"], ["🍯", "honey water"], ["🌊", "a drink from the river"]];
const TOYS = [["🥌", "round stone", "bounce"], ["🪶", "feather", "flutter"], ["🦴", "bone", "chew"], ["🫧", "bubble", "float"], ["🎺", "bone flute", "toot"], ["🥁", "hide drum", "bang"], ["🪢", "knot on a cord", "swing"]];
const MESS = [["🍂", "a leaf"], ["🪵", "a twig"], ["🌿", "a fern"], ["🪨", "a pebble"], ["🥚", "the empty shell"], ["🍄", "a mushroom"]];
/* the egg's own pattern, so no two hatchings look the same */
const PATTERNS = [
  { name: "plain cream", bg: "" },
  { name: "spotted", bg: "radial-gradient(circle, rgba(255,255,255,.65) 11%, transparent 12%) 0 0/24px 24px" },
  { name: "striped", bg: "repeating-linear-gradient(115deg, rgba(120,90,40,.2) 0 7px, transparent 7px 20px)" },
  { name: "speckled", bg: "radial-gradient(circle, rgba(90,60,30,.3) 7%, transparent 8%) 0 0/16px 16px" },
  { name: "freeze-blue", bg: "linear-gradient(160deg, rgba(150,220,240,.55), rgba(255,255,255,.15))" },
  { name: "sunny", bg: "linear-gradient(20deg, rgba(255,220,120,.5), rgba(255,255,255,.1))" }
];

export function mountHatchling(context) {
  const F = window.DUFX;
  const level = Math.max(1, Number(context.level) || 1);
  const ch = Math.max(1, Number(context.challenge) || 1);
  const baby = BABIES[(level - 1) % BABIES.length];
  const color = baby[1];
  const pattern = PATTERNS[(level + ch) % PATTERNS.length];
  const tapsNeeded = Math.min(14, 5 + ch);
  const choices = ch >= 6 ? 5 : ch >= 3 ? 4 : 3;
  const stages = ["feed"];
  if (ch >= 3) stages.push("drink");
  stages.push("play");
  if (ch >= 5) stages.push("tidy");
  stages.push("cuddle");
  const play = createPlay(context, {
    emoji: "🥚", title: "Hatchling nursery", theme: "meadow", buddy: false, wander: false,
    instruction: "Tap the egg to keep it cosy and warm. Something is wiggling inside!",
    hint: "Tap, tap, tap! Every tap makes it warmer. This one is a " + pattern.name + " egg.", allowed: Math.max(2, stages.length)
  });
  const board = play.board;
  /* saved on this device so a child can see their whole nursery grow between visits */
  function shelfHTML() {
    const s = collection("nursery");
    const best = s.reduce(function (m, b) { return Math.max(m, Number(b.stars) || 0); }, 0);
    const runs = collection("hatch-runs");
    const fastest = runs.reduce(function (m, r) { return Math.min(m, Number(r.taps) || 99); }, 99);
    return '<span>Your nursery: <b>' + s.length + "</b> baby friends" + (best ? " · best care " + window.DUICONS.stars(best) : "") +
      (runs.length ? " · babies hatched <b>" + runs.length + "</b>" + (fastest < 99 ? " · warmest egg in " + fastest + " taps" : "") : "") + "</span>" +
      (s.length ? s.slice(-8).map(function (b) { return '<i title="' + escapeText(String(b.name || "")) + '">' + F.dinoHTML(b.species, { color: b.color, size: "100%" }) + "</i>"; }).join("") : "<em>Your first baby will live here!</em>");
  }
  /* the plan for this round, so a bigger child can see there is more to do */
  const PLAN_ICONS = { feed: "🍓", drink: "💧", play: "🪶", tidy: "🧺", cuddle: "🪹" };
  function planHTML() {
    return stages.map(function (s, i) {
      return '<span data-step="' + s + '" style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;background:' +
        (i < stepIndex ? "rgba(120,200,120,.35)" : i === stepIndex ? "rgba(255,209,102,.6)" : "rgba(255,255,255,.4)") +
        ";font-size:.78rem;" + (i < stepIndex ? "text-decoration:line-through;" : "") + '">' + PLAN_ICONS[s] + " " + s + "</span>";
    }).join("");
  }
  board.innerHTML = '<div class="hn-stage"><div class="hn-nest"><button type="button" class="hn-egg" id="hnEgg" aria-label="Tap the egg to warm it"><svg class="hn-cracks" viewBox="0 0 100 130" aria-hidden="true"></svg></button><span class="hn-glow"></span></div><div class="hn-baby" id="hnBaby" hidden></div><div class="hn-say" id="hnSay" hidden></div></div>' +
    '<div class="hn-heat"><span id="hnHeatLabel">Warmth</span><div class="progress-track"><span id="hnHeat" style="width:0%"></span></div></div>' +
    '<p id="hnPlan" style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:4px 0 0" aria-label="What is still to do"></p><div class="hn-options" id="hnOptions"></div>' +
    '<p style="text-align:center;margin:6px 0 0"><button type="button" class="tiny-button" id="hnHelp">💡 What does the baby want?</button></p>' +
    '<div class="hn-shelf" id="hnShelf" aria-label="Your nursery">' + shelfHTML() + "</div>";
  const egg = board.querySelector("#hnEgg"), cracks = board.querySelector(".hn-cracks"), babyEl = board.querySelector("#hnBaby"), options = board.querySelector("#hnOptions"), heat = board.querySelector("#hnHeat"), sayEl = board.querySelector("#hnSay"), helpBtn = board.querySelector("#hnHelp");
  const glowEl = board.querySelector(".hn-glow");
  const crackPaths = ["M50 8 L44 28 L54 40 L46 58", "M46 58 L62 66 L56 84 L70 96", "M46 58 L28 70 L36 88 L22 100", "M50 8 L60 24 L50 36"];
  let taps = 0, hatched = false, busy = false, hintFn = null, glowAnim = null, done = 0, stepIndex = -1, chosenName = "";
  if (pattern.bg) egg.style.backgroundImage = pattern.bg;
  if (F.anim) glowAnim = F.anim(glowEl, [{ opacity: .1 }, { opacity: .5 }, { opacity: .1 }], { duration: 1900, iterations: Infinity });
  helpBtn.addEventListener("click", function () { if (hintFn) hintFn(); });
  function askFor(el, text) {
    if (!el) return;
    clearGlows();
    el.style.boxShadow = "0 0 0 4px #ffd166, 0 6px 0 rgba(120,80,30,.28)";
    if (F.anim) F.anim(el, [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 620, easing: "ease-in-out" });
    if (F.sfx) F.sfx.star();
    play.hint(text, true);
    play.say(text, 3200);
  }
  function clearGlows() { board.querySelectorAll("[style*='box-shadow']").forEach(function (b) { b.style.boxShadow = ""; }); }

  function tell(text) { sayEl.hidden = false; sayEl.textContent = text; F.pop && F.pop(sayEl); }
  function renderPlan() { const p = board.querySelector("#hnPlan"); if (p) p.innerHTML = planHTML(); }
  function dino() { return babyEl.querySelector(".du-dino") || babyEl; }
  function mood(state, ms) { if (F.dinoState) F.dinoState(dino(), state, ms); }
  function sparkleOn(el, kind, n) { if (!F.burst || !el) return; const r = el.getBoundingClientRect(); F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: kind, n: n || 12 }); }
  function askRow(question) { options.innerHTML = '<p class="hn-q">' + question + '</p><div class="hn-row"></div>'; return options.querySelector(".hn-row"); }
  function chip(icon, text) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "pk-btn hn-opt";
    b.innerHTML = "<span>" + icon + "</span><small>" + text + "</small>";
    return b;
  }
  function lockAll(row) { row.querySelectorAll("button").forEach(function (x) { x.disabled = true; }); }
  renderPlan();
  /* every stage owns the free hint, so 💡 always points at something */
  hintFn = function () { askFor(egg, "Tap the egg to keep it cosy! " + Math.max(1, tapsNeeded - taps) + " more taps and it hatches."); };
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
    hatched = true; busy = true; hintFn = null;
    if (glowAnim && glowAnim.cancel) glowAnim.cancel();
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
      play.say("A baby " + baby[2] + " came out of a " + pattern.name + " egg! Hello, little one! ✨", 3200);
      board.querySelector("#hnHeatLabel").textContent = "Growing";
      heat.style.width = "0%"; glowEl.classList.add("on");
      busy = false;
      window.setTimeout(nextStage, 1400);
    }, 650);
  }

  /* one stage per round step: a Round 1 baby wants a snack and a cuddle, a Round 5 baby wants the lot */
  const STEPS = { feed: feedStage, drink: drinkStage, play: playStage, tidy: tidyStage, cuddle: cuddleStage };
  function nextStage() {
    if (hatched === false) return;
    stepIndex += 1;
    renderPlan();
    if (stepIndex >= stages.length) { namingStage(); return; }
    options.dataset.stage = stages[stepIndex];
    STEPS[stages[stepIndex]]();
  }
  function stageDone(label) {
    done += 1;
    heat.style.width = Math.round(done / stages.length * 100) + "%";
    babyEl.style.setProperty("--grow", (1 + done * (0.66 / stages.length)).toFixed(2));
    babyEl.classList.add("grown");
    play.say(label, 2200);
    window.setTimeout(function () { busy = false; nextStage(); }, 1700);
  }

  /* a "want this one" stage shared by snacks and drinks */
  function wantStage(items, beg, question, kindName, onRight) {
    const picks = shuffle(items).slice(0, Math.min(choices, items.length));
    const target = picks[0];
    mood("idle", 99999);
    tell(beg + " Please may I have " + target[1] + "?");
    const row = askRow(question);
    let rightBtn = null;
    shuffle(picks).forEach(function (s) {
      const b = chip(s[0], s[1]);
      row.appendChild(b);
      if (s === target) rightBtn = b;
      b.addEventListener("click", function () {
        if (busy) return;
        if (s !== target) {
          play.miss(b, "So close — the baby asked for " + target[1] + ". Try that one!");
          if (hintFn) hintFn();
          return;
        }
        busy = true; clearGlows(); lockAll(row);
        const go = F.flyTo ? F.flyTo(b, dino(), { emoji: s[0], size: 38, burst: false, duration: 520 }) : Promise.resolve();
        go.then(function () { onRight(target); }, function () { onRight(target); });
      });
    });
    hintFn = function () { askFor(rightBtn, "The baby would like " + target[1] + " — that is the " + kindName + " marked " + target[0] + "."); };
  }

  function feedStage() {
    wantStage(SNACKS, "I'm hungry!", "What did the baby ask for to eat?", "snack", function (target) {
      mood("eat", 1200);
      if (F.sfx) { F.sfx.chomp(); window.setTimeout(F.sfx.chomp, 350); }
      sparkleOn(babyEl, "sparkle", 12);
      play.good(babyEl, { text: "Yum!" });
      stageDone("Nom nom nom! All the " + target[1] + " is gone — the baby grew a little! 🌱");
    });
  }
  function drinkStage() {
    wantStage(DRINKS, "Glug, glug — I'm thirsty!", "Which drink did the baby ask for?", "drink", function (target) {
      mood("eat", 1100);
      if (F.sfx) { F.sfx.splash(); window.setTimeout(F.sfx.tap, 320); }
      sparkleOn(babyEl, "drops", 14);
      play.good(babyEl, { text: "Glug!" });
      stageDone("Ahh, " + target[1] + " went down nicely! 💧");
    });
  }
  function playStage() {
    mood("happy", 99999);
    tell("Now I want to play! Which toy shall it be?");
    const row = askRow("Pick any toy — every one makes the baby giggle!");
    const toyAnim = { bounce: "bounce", fly: "fly", hug: "hug", float: "float", toot: "toot" };
    shuffle(TOYS).slice(0, Math.min(choices + 1, TOYS.length)).forEach(function (t, i) {
      const b = chip(t[0], t[1]);
      row.appendChild(b);
      if (i === 0) b.dataset.first = "1";
      b.addEventListener("click", function () {
        if (busy) return;
        busy = true; clearGlows(); lockAll(row);
        const toy = document.createElement("span");
        toy.className = "hn-toy hn-" + (toyAnim[t[2]] || "bounce");
        toy.textContent = t[0];
        toy.style.cssText = "position:absolute;left:50%;top:12%;transform:translateX(-50%);font-size:2.1rem;pointer-events:none";
        board.querySelector(".hn-stage").appendChild(toy);
        if (F.anim) {
          const moves = t[2] === "fly" || t[2] === "float"
            ? [{ transform: "translate(-50%,0)" }, { transform: "translate(-10%,-46px) rotate(12deg)" }, { transform: "translate(-50%,-6px)" }]
            : t[2] === "toot" ? [{ transform: "translate(-50%,0) rotate(0)" }, { transform: "translate(-50%,0) rotate(-22deg)" }, { transform: "translate(-50%,-8px) rotate(16deg)" }]
              : [{ transform: "translate(-50%,0)" }, { transform: "translate(-50%,-40px)" }, { transform: "translate(-30%,4px)" }, { transform: "translate(-50%,0)" }];
          F.anim(toy, moves, { duration: 900, iterations: 2 });
        }
        mood("happy", 2400);
        if (F.sfx) { t[2] === "toot" ? F.sfx.note(4, 0.4) : t[2] === "fly" || t[2] === "float" ? F.sfx.whoosh() : F.sfx.boing(); }
        sparkleOn(toy, "confetti", 14);
        play.good(babyEl, { text: "Wheee!" });
        window.setTimeout(function () { toy.remove(); stageDone("Wheee! Playing with the " + t[1] + " is the best! 🎉"); }, 1900);
      });
    });
    hintFn = function () { askFor(row.querySelector("[data-first]") || row.querySelector("button"), "Any toy will do! Tap one and see what the baby does."); };
  }
  function tidyStage() {
    mood("idle", 99999);
    tell("Oh no, our nest is very messy. Shall we tidy up together?");
    options.innerHTML = '<p class="hn-q">Tap each bit of mess to tidy the nest.</p><div class="hn-row" id="hnMess"></div>';
    const row = options.querySelector("#hnMess");
    const bits = shuffle(MESS).slice(0, Math.min(MESS.length, 2 + Math.floor(ch / 2)));
    const chips = [];
    let left = bits.length;
    bits.forEach(function (m) {
      const b = chip(m[0], m[1]);
      b.classList.add("hn-mess");
      row.appendChild(b);
      chips.push(b);
      b.addEventListener("click", function () {
        if (busy || b.hidden) return;
        if (F.anim) F.anim(b, [{ transform: "scale(1)" }, { transform: "scale(1.3) rotate(18deg)" }, { transform: "scale(0)" }], { duration: 420 });
        if (F.sfx) { F.sfx.pop(); }
        sparkleOn(b, "dust", 10);
        window.setTimeout(function () { b.hidden = true; }, 400);
        left -= 1;
        play.good(b, { text: "Tidy!" });
        tell(left ? "Lovely! " + left + " more " + (left === 1 ? "bit" : "bits") + " to go." : "What a spic-and-span nest! ✨");
        if (!left) {
          busy = true; hintFn = null; clearGlows();
          window.setTimeout(function () { stageDone("The nest is clean and cosy! 🧺"); }, 700);
        } else if (hintFn) hintFn();
      });
    });
    hintFn = function () {
      const next = chips.filter(function (b) { return !b.hidden; })[0];
      askFor(next, next ? "Tap the " + next.querySelector("small").textContent + " to tidy it away." : "All tidy! One moment…"); // du-display the label is only read aloud
    };
  }
  function cuddleStage() {
    const need = Math.min(7, 3 + Math.floor(ch / 3));
    tell("I'm sleepy… can I have " + need + " gentle cuddles?");
    options.innerHTML = '<p class="hn-q">Tap the baby softly to cuddle it. 🪹</p><div class="hn-cuddles"></div>';
    let n = 0;
    const meter = options.querySelector(".hn-cuddles");
    meter.innerHTML = window.DUICONS.stars(0, { max: need, size: 22 });
    const onTap = function () {
      if (n >= need) return;
      n += 1;
      meter.innerHTML = window.DUICONS.stars(n, { max: need, size: 22 });
      if (F.sfx) { F.sfx.chirp(); if (n === need) window.setTimeout(F.sfx.star, 200); }
      sparkleOn(babyEl, "hearts", 6);
      mood("happy", 700);
      if (F.squish) F.squish(babyEl);
      play.hint(n >= need ? "All " + need + " cuddles given!" : (need - n) + " more gentle cuddle" + (need - n === 1 ? "" : "s") + "…", true);
      if (n >= need) {
        babyEl.removeEventListener("click", onTap);
        busy = true; hintFn = null; clearGlows();
        play.good(babyEl, { text: "Cuddles!" });
        window.setTimeout(function () { stageDone("So snuggly! The baby is big, calm and happy! 🪹"); }, 900);
      }
    };
    babyEl.addEventListener("click", onTap);
    babyEl.classList.add("hn-tappable");
    hintFn = function () { askFor(babyEl, "Tap the baby " + (need - n) + " more time" + (need - n === 1 ? "" : "s") + " to cuddle it."); };
  }
  function namingStage() {
    babyEl.classList.remove("hn-tappable");
    hintFn = null; clearGlows();
    mood("happy", 99999);
    tell("What shall my name be?");
    options.dataset.stage = "name";
    const row = askRow("Pick a name for your baby dinosaur.");
    shuffle(NAMES).slice(0, choices).forEach(function (nm) {
      const b = chip("🏷️", nm);
      row.appendChild(b);
      b.addEventListener("click", function () {
        if (busy) return;
        busy = true; clearGlows(); lockAll(row);
        chosenName = nm;
        collect("nursery", { species: baby[0], color: color, name: nm, stars: play.rating() });
        board.querySelector("#hnShelf").innerHTML = shelfHTML();
        if (F.sfx) F.sfx.win();
        sparkleOn(babyEl, "confetti", 34); sparkleOn(babyEl, "hearts", 12);
        play.good(babyEl, { text: nm + "!" });
        tell("My name is " + nm + "! Thank you for looking after me!");
        play.say(nm + " joins your nursery shelf! 🏠", 3000);
        window.setTimeout(offerPeekaboo, 1600);
      });
    });
    hintFn = function () { askFor(row.querySelector("button"), "Every name is a lovely name — tap the one you like best!"); };
  }
  /* optional bonus round after the baby is settled, always skippable */
  function offerPeekaboo() {
    busy = false;
    if (ch < 4) { finishNight(false); return; }
    options.dataset.stage = "offer";
    tell(chosenName + " is not sleepy yet… shall we play peekaboo? 👀");
    options.innerHTML = '<p class="hn-q">Bonus game: find the hidden baby three times!</p><div class="hn-row"></div>' +
      '<p style="text-align:center;margin:8px 0 0"><button type="button" class="tiny-button" id="hnGoodnight">No thank you — say goodnight 🌙</button></p>';
    const row = options.querySelector(".hn-row");
    const go = chip("👀", "Play peekaboo");
    row.appendChild(go);
    go.addEventListener("click", function () { if (!busy) peekaboo(); });
    options.querySelector("#hnGoodnight").addEventListener("click", function () { if (!busy) finishNight(false); });
    hintFn = function () { askFor(go, "Tap Play peekaboo for a bonus game, or goodnight if you are done."); };
  }
  function peekaboo() {
    hintFn = null; clearGlows();
    options.dataset.stage = "peek";
    const SPOTS = [["🌿", "fern"], ["🌴", "palm"], ["🍄", "toadstool"], ["🪨", "rock"]];
    const spots = ch >= 7 ? SPOTS : SPOTS.slice(0, 3);
    let found = 0;
    const need = 3;
    function hide() {
      busy = false;
      tell("Peekaboo! Where is " + chosenName + " hiding?");
      options.innerHTML = '<p class="hn-q">Found ' + found + " of " + need + "! Tap the hiding place.</p><div class='hn-row' id='hnHide'></div>" +
        '<p style="text-align:center;margin:8px 0 0"><button type="button" class="tiny-button" id="hnGoodnight">That is enough — goodnight 🌙</button></p>';
      const row = options.querySelector("#hnHide");
      const right = Math.floor(Math.random() * spots.length);
      const btns = spots.map(function (s, i) {
        const b = chip(s[0], s[1]);
        row.appendChild(b);
        b.addEventListener("click", function () {
          if (busy) return;
          if (i !== right) {
            play.miss(b, "So close — " + chosenName + " is not behind the " + s[1] + ". Look for the wiggly tail!");
            return;
          }
          busy = true; clearGlows(); lockAll(row);
          found += 1;
          b.innerHTML = F.dinoHTML(baby[0], { color: color, state: "happy", size: "54px" }) + "<small>found " + found + " of " + need + "!</small>";
          if (F.sfx) { F.sfx.chirp(); window.setTimeout(F.sfx.sparkle, 180); }
          sparkleOn(b, "stars", 14);
          play.good(b, { text: "Peekaboo!" });
          window.setTimeout(function () { if (found >= need) finishNight(true); else hide(); }, 1200);
        });
        return b;
      });
      hintFn = function () { askFor(btns[right], "Psst — that fern is wiggling!"); };
      options.querySelector("#hnGoodnight").addEventListener("click", function () { if (!busy) finishNight(found > 0); });
    }
    hide();
  }
  function finishNight(played) {
    hintFn = null; clearGlows();
    options.dataset.stage = "done";
    options.innerHTML = "";
    const stars = play.rating();
    collect("hatch-runs", { name: chosenName, taps: taps, stages: stages.length, stars: stars, peek: played ? 3 : 0 });
    board.querySelector("#hnShelf").innerHTML = shelfHTML();
    if (played) play.bonus();
    mood("happy", 99999);
    tell(chosenName + " is curled up asleep. Goodnight, little one! 🌙");
    play.say("You looked after " + chosenName + " the whole way! 🏠", 3200);
    window.setTimeout(function () {
      play.finish("You warmed a " + pattern.name + " egg with " + taps + " taps and did " + stages.length +
        " caring things for " + chosenName + " the baby " + baby[2] + (played ? ", plus three rounds of peekaboo" : "") +
        ". " + chosenName + " is safe on your nursery shelf now!");
    }, 1400);
  }
}
