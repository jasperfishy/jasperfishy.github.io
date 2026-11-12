/* Memory Eggs — flip two wobbly eggs and find the matching baby dinosaurs. A golden pair hides a surprise, a quick
 * peek helps little explorers (every level gets one), and in the biggest games the eggs do a happy dance halfway.
 * NEW MECHANICS: every pair you solve hands you a "who lives here?" fact card — tap it to keep the note in your
 * notebook (saved, so notes pile up across the whole journey); a live moves/time tally sets a medal budget you can
 * beat; and when the last pair is found ONE friend hides under a basket — you deduce who from the fact clue, and a
 * wrong guess costs a star while the free clue button only helps you look again. */
import { createPlay, shuffle, enter, getExtras, collect, collection } from "../adv-kit.js?v=du-f652baf3e7fda2b1";

const NOTE_KEY = "memory-notes"; // saved inside du-adv-extras-v1 via collect()
const RUNS_KEY = "memory-runs";
const DUCE_MS = 9000; // the deduction window always closes by itself

/* one fact per species, two versions so round 2 and round 3 can show a different one */
const FACTS = {
  trex: ["had teeth as big as bananas 🍌", "could not scratch its nose — its arms were that short! 🦖"],
  tricera: ["had a big bony frill to keep its neck safe 🛡️", "had three horns: two long ones and a short nose horn 👃"],
  stego: ["had a brain the size of a walnut 🥜", "sunbathed its five-sided back plates ☀️"],
  bronto: ["had a neck as long as a bus 🚌", "whipped its tail faster than a thunderclap ⚡"],
  raptor: ["was only as big as a turkey 🦃", "had a big curved claw on each foot for climbing 🪝"],
  ptero: ["was a flying reptile, not a dinosaur 🪽", "had a long crest behind its head to balance its beak ⚖️"]
};

const FRIENDS = [
  ["trex", "green", "Rexy the T. rex"], ["tricera", "teal", "Trixie the Triceratops"], ["stego", "purple", "Spike the Stegosaurus"], ["bronto", "orange", "Bronte the Brontosaurus"],
  ["raptor", "red", "Zippy the Raptor"], ["ptero", "blue", "Skye the Pteranodon"], ["trex", "pink", "Rosie the T. rex"], ["tricera", "yellow", "Sunny the Triceratops"],
  ["stego", "blue", "Bramble the Stegosaurus"], ["bronto", "teal", "Bubbles the Brontosaurus"], ["raptor", "purple", "Pixel the Raptor"], ["ptero", "orange", "Gusty the Pteranodon"]
];
const SHELLS = ["#f7e6c4", "#e9f3d8", "#dcecf7", "#f6dfe9", "#f3ebc4", "#e5def5", "#fbe0cf", "#d9f2ee", "#e7f3c8", "#fadcd2", "#d8e7f5", "#f2d9f0"];

export function mountMemory(context) {
  const F = window.DUFX;
  // Six pairs (twelve eggs) is the most a little explorer should ever track at once.
  const pairs = context.challenge <= 2 ? 4 : 6;
  const play = createPlay(context, {
    emoji: "🥚", title: "Memory eggs", theme: "meadow", buddy: ["bronto", "tricera"][context.level % 2],
    instruction: "Tap two eggs to peek inside. Find the baby dinosaurs that are twins!",
    hint: "Take your time. The golden eggs hide a surprise!", allowed: Math.ceil(pairs * 0.8)
  });
  const friends = shuffle(FRIENDS).slice(0, pairs);
  const golden = Math.floor(Math.random() * pairs);
  const deck = shuffle(friends.concat(friends).map(function (f, i) { return { f: f, id: friends.indexOf(f), shell: SHELLS[friends.indexOf(f)], gold: friends.indexOf(f) === golden }; }));
  const cols = deck.length <= 8 ? 4 : deck.length <= 12 ? 4 : 4;
  const tier = context.challenge <= 2 ? 1 : context.challenge <= 5 ? 2 : 3;
  const TIER = ["Little clutch", "Big clutch", "Golden shuffle"];
  const best = getExtras().best[(context.activity && context.activity.id) || "memory"] || 0;
  const chip = function (txt) { return '<span style="background:rgba(255,255,255,.92);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#245048">' + txt + "</span>"; };
  const board = play.board;
  const notes = collection(NOTE_KEY);
  const budget = Math.max(pairs + 1, Math.round(pairs * 1.9)); // the medal budget: how many moves for three ⭐ of memory
  board.innerHTML = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 auto 8px">' +
    chip("Tier " + tier + " · " + TIER[tier - 1]) + chip(pairs + " pairs to find") + (best ? chip("Your best " + "⭐".repeat(best)) : chip("A first clutch — say hello!")) +
    '<span id="meTally" data-moves="0" data-secs="0" data-budget="' + budget + '" data-under="1" style="background:rgba(255,255,255,.92);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#245048">Moves <b id="meMoves">0</b>/' + budget + " · ⏱ <b id=\"meSecs\">0</b>s</span>" +
    chip('Notes 📔 <b id="meNotes">' + notes.length + "</b>") + "</div>" +
    '<div class="me-grid" style="--me-cols:' + cols + '"></div>' +
    // the fact card lives in its own row so it can never sit on top of an egg
    '<div class="me-factrow" id="meFact" data-state="idle" data-id="" data-species="" data-friend="" style="min-height:74px;display:grid;place-items:center;margin:6px auto 0"></div>' +
    '<div class="me-nursery" aria-label="Hatched friends"><span class="me-nlabel">Nursery</span></div>' +
    '<div class="me-notebook" id="meNote" data-count="' + notes.length + '" aria-label="Your dinosaur notebook" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;min-height:34px;margin-top:8px;padding:4px 10px;border-radius:16px;background:rgba(255,255,255,.45)"></div>' +
    // the basket finale: one friend hides again and you deduce who it is from its fact
    '<div class="me-duce" id="meDuce" hidden data-state="idle" data-need="0" data-hits="0" aria-live="polite" style="margin:8px auto 0;padding:9px 12px;border-radius:18px;background:rgba(255,255,255,.93);border:3px solid #f2b705;box-shadow:0 4px 0 rgba(24,62,64,.14);text-align:center;max-width:520px"></div>' +
    '<p style="text-align:center;margin:8px 0 0"><button type="button" class="pk-btn" id="mePeek">👀 Peek a pair ×2</button></p>';
  const grid = board.querySelector(".me-grid"), nursery = board.querySelector(".me-nursery");
  const factBox = board.querySelector("#meFact"), noteRow = board.querySelector("#meNote"), duceBox = board.querySelector("#meDuce");
  const tally = board.querySelector("#meTally");
  renderNotes();
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
  let moves = 0, secs = 0, tickTimer = 0, factTimer = 0, duceTimer = 0, ended = false, hidden = null, danced = false;

  /* MOVES / TIME RECORD — every two-egg flip is one move; the chip counts them live against the medal budget. */
  function paintTally() {
    tally.dataset.moves = String(moves);
    tally.dataset.secs = String(secs);
    tally.dataset.under = moves <= budget ? "1" : "0";
    const mv = board.querySelector("#meMoves"), sc = board.querySelector("#meSecs");
    if (mv) mv.textContent = String(moves);
    if (sc) sc.textContent = String(secs);
  }
  tickTimer = window.setInterval(function () {
    if (!board.isConnected) { window.clearInterval(tickTimer); return; }
    if (ended || locked) return;
    secs += 1; paintTally();
  }, 1000);

  /* THE NOTEBOOK — saved fact notes pile up across the whole journey (du-adv-extras-v1 → "memory-notes"). */
  function renderNotes() {
    const all = collection(NOTE_KEY).slice(-10);
    noteRow.innerHTML = '<span class="me-nlabel" style="align-self:center;font-weight:800;font-size:12px;color:#5d7b74">Notebook 📔</span>' +
      (all.length ? all.map(function (n) { return '<span class="me-note" data-species="' + n.sp + '" title="' + n.fact + '" style="display:inline-grid;place-items:center;width:34px;height:30px;background:rgba(255,255,255,.9);border-radius:10px;box-shadow:0 2px 0 rgba(24,62,64,.12)">' + F.dinoHTML(n.sp, { color: "teal", state: "idle", size: "100%" }) + "</span>"; }).join("")
        : '<small style="font-weight:800;font-size:11.5px;color:#5d7b74">Tap a fact card to keep a note here</small>');
    noteRow.dataset.count = String(collection(NOTE_KEY).length);
    const nc = board.querySelector("#meNotes");
    if (nc) nc.textContent = String(collection(NOTE_KEY).length);
  }

  /* FACT CARD — "who lives here?" appears under the grid each time a pair hatches. Tap the card to keep the note;
   * it also hides itself, so a child who just keeps matching is never blocked. */
  function showFact(id) {
    const d = friends[id];
    if (!d || !FACTS[d[0]]) return;
    const fact = FACTS[d[0]][(Number(id) + context.level) % FACTS[d[0]].length];
    factBox.dataset.state = "show";
    factBox.dataset.id = String(id);
    factBox.dataset.species = d[0];
    factBox.dataset.friend = d[2];
    factBox.innerHTML = '<button type="button" class="me-factcard" data-id="' + id + '" data-species="' + d[0] + '" data-friend="' + d[2] +
      '" style="cursor:pointer;display:flex;align-items:center;gap:10px;text-align:left;max-width:430px;border:3px solid #8fc59a;border-radius:18px;padding:6px 12px 6px 6px;background:rgba(255,255,255,.95);box-shadow:0 4px 0 rgba(24,62,64,.14);font:inherit;color:#245048">' +
      '<span class="me-factface" style="display:block;width:48px;height:44px;flex:0 0 auto">' + F.dinoHTML(d[0], { color: d[1], state: "happy", size: "100%" }) + "</span>" +
      '<span style="display:block"><b style="display:block;font-size:13px">' + d[2] + '</b><span class="me-facttext" style="display:block;font-weight:700;font-size:12px">' +
      "Did you know? It " + fact + '</span><small style="display:block;font-weight:900;font-size:11px;color:#5d7b74">Tap to keep this note 📔 (or it hides itself)</small></span></button>';
    if (F.sfx) F.sfx.chirp && F.sfx.chirp();
    window.clearTimeout(factTimer);
    factTimer = window.setTimeout(hideFact, 6200);
  }
  function hideFact() {
    window.clearTimeout(factTimer);
    factBox.dataset.state = "idle";
    factBox.innerHTML = "";
  }
  factBox.addEventListener("click", function (e) {
    const card = e.target && e.target.closest ? e.target.closest(".me-factcard") : null;
    if (!card) return;
    const id = Number(card.dataset.id), d = friends[id];
    if (!d) return;
    collect(NOTE_KEY, { sp: d[0], fact: FACTS[d[0]] ? FACTS[d[0]][(id + context.level) % FACTS[d[0]].length] : "" });
    renderNotes();
    if (F.sfx) F.sfx.sparkle();
    const r = card.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 10 });
    play.say("Note kept! " + d[2] + " is in your notebook 📔", 2400);
    hideFact();
  });

  // a quick peek for little explorers: everybody wobbles open, then closes.
  // Every level gets a look — even the biggest clutch never starts face-down with no preview.
  function peek() {
    const ms = context.challenge <= 2 ? 2400 : context.challenge <= 4 ? 1400 : 1200;
    play.say("Look quickly! Remember who is hiding. 👀", ms);
    window.setTimeout(function () {
      eggs.forEach(function (e) { e.classList.add("open"); });
      if (F.sfx) F.sfx.pop();
      window.setTimeout(function () { eggs.forEach(function (e) { e.classList.remove("open"); }); locked = false; play.hint("Now find the twins!"); }, ms);
    }, 900);
  }
  peek();

  // a free hint: open one still-hidden pair so a stuck child sees the game is winnable
  let peeks = 2;
  const peekBtn = board.querySelector("#mePeek");
  peekBtn.addEventListener("click", function () {
    if (locked || !peeks || matched >= pairs) return;
    const byId = {};
    eggs.forEach(function (e) { if (!e.classList.contains("matched")) (byId[e.dataset.id] = byId[e.dataset.id] || []).push(e); });
    const twin = Object.keys(byId).find(function (k) { return byId[k].length === 2 && byId[k].indexOf(first) < 0; });
    if (!twin) return;
    if (first) { first.classList.remove("open"); first = null; }
    peeks -= 1; peekBtn.innerHTML = peeks ? "👀 Peek a pair ×" + peeks : "👀 No peeks left";
    if (!peeks) peekBtn.disabled = true;
    locked = true; play.say("Look — these two are twins! 💛", 1500);
    if (F.sfx) F.sfx.sparkle();
    byId[twin].forEach(function (e) { e.classList.add("open"); F.pop && F.pop(e); });
    window.setTimeout(function () {
      byId[twin].forEach(function (e) { e.classList.remove("open"); });
      locked = false;
    }, 1400);
  });

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
    play.say("Halfway there — the eggs do a happy dance! 🌀", 2400);
    if (F.sfx) F.sfx.whoosh();
  }

  grid.addEventListener("click", function (ev) {
    const egg = ev.target.closest(".me-egg");
    if (!egg || locked || egg.classList.contains("matched") || egg.classList.contains("open")) return;
    egg.classList.add("open");
    if (F.sfx) F.sfx.pop();
    if (!first) { first = egg; return; }
    const a = first; first = null;
    moves += 1; paintTally();
    if (a.dataset.id === egg.dataset.id) {
      locked = true; missRun = 0;
      window.setTimeout(function () {
        a.classList.add("matched"); egg.classList.add("matched");
        const d = friends[Number(a.dataset.id)];
        [a, egg].forEach(function (e) { F.dinoState(e.querySelector(".du-dino"), "happy", 1600); F.bounce && F.bounce(e); });
        if (F.sfx) F.sfx.coin();
        play.good(egg, { text: a.classList.contains("gold") ? "Golden hatch! ✨" : null });
        play.say(d[2] + " says hi! 💚", 2200);
        showFact(Number(a.dataset.id));
        // the pair hops into the nursery
        const chip2 = document.createElement("span");
        chip2.className = "me-chip"; chip2.innerHTML = F.dinoHTML(d[0], { color: d[1], state: "happy", size: "100%" });
        nursery.appendChild(chip2); F.pop && F.pop(chip2);
        if (F.flyTo) F.flyTo(egg, chip2, { emoji: "🥚", size: 30, duration: 620 });
        if (a.classList.contains("gold")) { if (F.sfx) F.sfx.sparkle(); if (F.burst) { const r = egg.getBoundingClientRect(); F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "sparkle", n: 24 }); } window.setTimeout(function () { play.bonus(); }, 400); }
        matched += 1; locked = false;
        // The big-clutch twist is a reward, never a punishment: halfway through a top-tier
        // game the remaining eggs do one happy dance. A struggling child is never scrambled.
        if (context.challenge >= 5 && !danced && matched === Math.ceil(pairs / 2)) { danced = true; shuffleBoard(); }
        if (matched === pairs) window.setTimeout(function () {
          eggs.forEach(function (e) { F.dinoState(e.querySelector(".du-dino"), "happy", 2500); });
          const g = grid.getBoundingClientRect();
          if (F.burst) F.burst(g.left + g.width / 2, g.top + g.height / 2, { kind: "confetti", n: 30 });
          hideFact();
          deduce(); // the new finale: one friend hides under a basket and must be deduced
        }, 700);
      }, 380);
    } else {
      locked = true; missRun += 1;
      window.setTimeout(function () {
        play.miss(egg, ["Not twins this time! Remember where they are 💭", "Oops! Try to remember that one.", "Almost! Peek again."][missRun % 3]);
        a.classList.remove("open"); egg.classList.remove("open");
        locked = false;
      }, 900);
    }
  });

  /* THE BASKET FINALE — one hatched friend ducks back under a basket (a cover is laid over the egg, so the pair
   * stays matched and the board never un-solves itself). The clue is that friend's fact card; the child taps the
   * dinosaur the clue describes. A wrong pick costs a star, the 👂 clue button is free, and after DUCE_MS the
   * basket lifts on its own so a child who just watches still finishes the round. */
  let duceAnswer = -1, duceSp = "", duceClue = "", duceHits = 0;
  function kindName(f) { const p = String(f[2]).split(" the "); return p.length > 1 ? p[1] : f[2]; }
  function deduce() {
    const ids = friends.map(function (_, i) { return i; });
    duceAnswer = ids[Math.floor(Math.random() * ids.length)];
    const pair = eggs.filter(function (e) { return e.dataset.id === String(duceAnswer) && e.classList.contains("matched"); });
    if (pair.length < 2 || !FACTS[friends[duceAnswer][0]]) { finishRound("none"); return; }
    const f = friends[duceAnswer];
    duceSp = f[0];
    duceClue = FACTS[duceSp][(duceAnswer + context.level) % FACTS[duceSp].length];
    hidden = pair[Math.random() < 0.5 ? 0 : 1];
    const cover = document.createElement("span");
    cover.className = "me-cover"; cover.textContent = "🧺";
    cover.style.cssText = "position:absolute;inset:0;z-index:4;display:grid;place-items:center;font-size:32px;border-radius:22px;background:radial-gradient(circle at 42% 30%, #fff8e8, #e6cfa2 70%);box-shadow:inset 0 0 0 3px rgba(255,255,255,.7)";
    hidden.style.position = "relative";
    hidden.classList.add("hiding");
    hidden.appendChild(cover);
    if (F.pop) F.pop(cover);
    if (F.sfx) F.sfx.whoosh && F.sfx.whoosh();
    const pool = [];
    friends.forEach(function (x) { if (FACTS[x[0]] && x[0] !== duceSp && pool.indexOf(x[0]) < 0) pool.push(x[0]); });
    const nOpts = Math.min(5, tier === 1 ? 3 : tier === 2 ? 4 : 5);
    const opts = shuffle(pool).slice(0, nOpts - 1).concat([duceSp]);
    duceHits = 0;
    board._duce = String(duceAnswer);
    board._duceSp = duceSp;
    duceBox.hidden = false;
    duceBox.dataset.state = "ask";
    duceBox.dataset.need = duceSp;
    duceBox.dataset.hits = "0";
    duceBox.innerHTML = '<b class="me-duceask" style="display:block;font-size:13.5px;color:#245048">🧺 One friend hopped back under a basket!</b>' +
      '<span class="me-duceclue" style="display:block;font-weight:800;font-size:12.5px;margin:3px 0 7px">Clue: it ' + duceClue + "</span>" +
      '<span class="me-dueropts" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">' +
      shuffle(opts).map(function (sp) {
        const g = friends.filter(function (x) { return x[0] === sp; })[0];
        return '<button type="button" class="me-ducopt" data-id="' + friends.indexOf(g) + '" data-species="' + sp +
          '" aria-label="' + kindName(g) + '" style="cursor:pointer;border:3px solid rgba(24,62,64,.16);background:rgba(255,255,255,.95);border-radius:16px;padding:3px 8px 5px;display:inline-flex;flex-direction:column;align-items:center;gap:2px;font:inherit;font-weight:900;font-size:11px;color:#245048">' +
          '<span style="display:block;width:54px;height:48px">' + F.dinoHTML(sp, { color: "green", state: "idle", size: "100%" }) + "</span>" + kindName(g) + "</button>";
      }).join("") + "</span>" +
      '<span style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:7px">' +
      '<button type="button" class="pk-btn" id="meDuceClue">👂 Say the clue again</button>' +
      '<button type="button" class="pk-btn" id="meDuceLift">🧺 Lift the basket</button></span>';
    locked = true;
    play.say("Who is under the basket? It " + duceClue, 3400);
    play.hint("Listen to the clue, then tap the dinosaur it describes!", true);
    window.clearTimeout(duceTimer);
    duceTimer = window.setTimeout(function () { if (!board.isConnected) { ended = true; return; } finishRound("auto"); }, DUCE_MS);
  }
  function liftBasket() {
    window.clearTimeout(duceTimer);
    if (hidden) {
      const cov = hidden.querySelector(".me-cover");
      if (cov) cov.remove();
      hidden.classList.remove("hiding");
      F.dinoState && F.dinoState(hidden.querySelector(".du-dino"), "happy", 1800);
      F.bounce && F.bounce(hidden);
      hidden = null;
    }
    duceBox.hidden = true;
    locked = false;
  }
  function finishRound(how) {
    if (ended) return;
    if (!board.isConnected) { ended = true; return; } // the runtime already moved on — never advance twice
    if (how !== "answered") liftBasket();
    duceBox.dataset.state = how;
    const r = duceBox.getBoundingClientRect();
    if (how === "answered" || how === "lifted") { if (F.burst) F.burst(r.left + r.width / 2, r.top + 20, { kind: "stars", n: 14 }); }
    const under = moves <= budget;
    collect(RUNS_KEY, { m: moves, s: secs, p: pairs, d: how === "answered" ? 1 : 0, u: under ? 1 : 0 });
    ended = true;
    window.clearInterval(tickTimer);
    const medal = under ? " and only " + moves + " moves — a memory medal for you! 🎖️" : " in " + moves + " moves (" + budget + " would win the memory medal 🎖️)";
    const ded = how === "answered" ? ", found the basket friend " + (friends[duceAnswer] ? friends[duceAnswer][2] : "") + " by its clue 🧺"
      : how === "lifted" ? ", and peeked under the basket too 🧺" : "";
    play.finish("You remembered all " + pairs + " pairs — every friend is home in the nursery" + ded + medal + "!");
    if (under) window.setTimeout(function () { play.bonus(); }, 350);
  }

  duceBox.addEventListener("click", function (e) {
    const btn = e.target && e.target.closest ? e.target.closest("button") : null;
    if (!btn || ended || !hidden) return;
    if (btn.id === "meDuceClue") { // free: repeating the clue never costs anything
      play.say("The clue again: it " + duceClue, 3200);
      if (F.sfx) F.sfx.tap();
      return;
    }
    if (btn.id === "meDuceLift") {
      duceBox.dataset.state = "lifted";
      liftBasket();
      play.say("Peekaboo! It was " + friends[duceAnswer][2] + "! 🧺", 2600);
      finishRound("lifted");
      return;
    }
    if (!btn.classList.contains("me-ducopt")) return;
    duceHits += 1;
    duceBox.dataset.hits = String(duceHits);
    if (btn.dataset.species === duceSp) {
      duceBox.dataset.state = "answered";
      liftBasket();
      play.good(btn, { text: "You deduced it! 🧺" });
      play.say("Yes! It " + duceClue, 2600);
      finishRound("answered");
      return;
    }
    play.miss(btn, "Not that one under the basket! It " + duceClue + " — try again. 💛");
    play.hint("Read the clue again: it " + duceClue + ". The 👂 button says it out loud, free!", true);
    if (duceHits >= 2) { // never let a child be stuck: point at the right one
      const right = duceBox.querySelector('.me-ducopt[data-species="' + duceSp + '"]');
      if (right && F.pulse) F.pulse(right);
    }
  });
}
