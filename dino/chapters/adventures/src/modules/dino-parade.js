/* Dinosaur Dress-up Parade — dress a real animated dinosaur (hat, glasses, neck, back, tail), pick its colour and a
 * magical world, then CONDUCT the parade: the tempo you tap sets the real step order the line marches in, the line
 * itself grows a new dinosaur every round, and at the end of the march you have to echo the last three steps back
 * (call-and-response) to earn a bonus lap. The judges score Style, Sparkle, Smile and Rhythm, and you can take a
 * photo for the parade album (saved on this device). More dress-up items unlock as levels grow. */
import { createPlay, shuffle, collect, collection, getExtras } from "../adv-kit.js?v=du-9ab77cff6b9ebbf2";

const SVGNS = "http://www.w3.org/2000/svg";
const SPECIES = [["trex", "T. rex", "green"], ["tricera", "Trike", "teal"], ["stego", "Spike", "purple"], ["bronto", "Bronte", "orange"], ["raptor", "Zippy", "red"], ["ptero", "Skye", "blue"]];
const COLORS = [["green", "#91d09c"], ["teal", "#7fd1c7"], ["blue", "#8cc3ee"], ["purple", "#b9a1e6"], ["pink", "#f5a9c4"], ["red", "#ee8a7c"], ["orange", "#f6b273"], ["yellow", "#f3d56b"]];
const SLOTS = {
  hat: { label: "Hat", items: ["👑", "🎩", "🧢", "🌸", "🎓", "⛑️", "🎀", "🪖", "🦖", "🌻"] },
  face: { label: "Face", items: ["🕶️", "👓", "🥽", "🎭", "🥸"] },
  neck: { label: "Neck", items: ["🧣", "🎀", "📿", "🔔", "🏅", "🌼", "🍓"] },
  back: { label: "Back", items: ["🎒", "🪽", "🎈", "🦋", "⛱️", "🎺", "🪁", "🧺"] },
  tail: { label: "Tail", items: ["🎀", "🔔", "🌸", "🎈", "⭐", "🌈", "🍃"] }
};
const WORLDS = [
  { name: "Sunshine Meadow", cls: "pd-meadow", icon: "🌼", deco: ["🌼", "🐞", "🦋"] }, { name: "Starry Lagoon", cls: "pd-stars", icon: "🌙", deco: ["🌙", "✨", "🐟"] },
  { name: "Rainbow Valley", cls: "pd-rainbow", icon: "🌈", deco: ["🌈", "☁️", "🎈"] }, { name: "Fernwood Forest", cls: "pd-fern", icon: "🌿", deco: ["🌿", "🍄", "🦉"] },
  { name: "Firefly Wood", cls: "", icon: "✨", bg: "linear-gradient(#1d3b2a,#43715a 60%,#6ea87f)", deco: ["✨", "🪲", "🌲"] }, { name: "Sunset Sand", cls: "", icon: "🌅", bg: "linear-gradient(#ff9a62,#ffd49a 55%,#ffe9bf)", deco: ["🌅", "🏝️", "🐚"] }
];
const KEY = "dinosaur-universe-parade-v2";

/* --- the conductor's baton: the tempo you tap really does set the step order the line marches in, ---
 * --- and the child has to echo the last three steps back before the judges mark them out of ten.  --- */
const TEMPO_IDS = ["slow", "normal", "fast"];
const TEMPOS = {
  slow: { label: "🐢 Slow", ms: 980, march: 8200, pattern: ["L", "R"] },
  normal: { label: "🚶 Steady", ms: 680, march: 6500, pattern: ["L", "R", "L", "R"] },
  fast: { label: "🏃 Quick", ms: 430, march: 5400, pattern: ["L", "L", "R"] }
};
/* the dinosaurs that fall in behind the leader — one more joins the line every adventure level */
const MARCHERS = [["raptor", "yellow"], ["tricera", "pink"], ["stego", "teal"], ["bronto", "purple"], ["ptero", "orange"],
  ["trex", "red"], ["raptor", "blue"], ["tricera", "green"], ["stego", "orange"], ["bronto", "teal"]];
const FOOT = { L: "👣", R: "🦶" };
const COPY_MS = 11000; // the call-and-response window: it always lets the parade march on
const LAPS_KEY = "parade-lap"; // saved inside du-adv-extras-v1 via collect()

export function mountDinoParade(context) {
  const F = window.DUFX;
  const level = Math.max(1, Number(context.level) || 1);
  const tier = context.challenge <= 2 ? 1 : context.challenge <= 5 ? 2 : 3;
  const TIER = ["First steps", "Star of the show", "Grand marshal"];
  const best = getExtras().best[(context.activity && context.activity.id) || "parade"] || 0;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { /* fine */ }
  const st = { sp: Math.min(5, Number(saved.sp) || (level - 1) % 6), color: saved.color || "", world: Number(saved.world) || (level - 1) % WORLDS.length,
    tempo: TEMPO_IDS.indexOf(saved.tempo) >= 0 ? saved.tempo : "normal", outfit: saved.outfit || {} };
  const unlocked = (slot) => Math.min(SLOTS[slot].items.length, 3 + Math.floor(level / 2));
  const lineSize = Math.min(MARCHERS.length, 2 + Math.floor(level / 2)); // one more dinosaur in the line every couple of levels
  const stepBack = Math.min(4, 1 + tier); // round 1 asks for 2 steps back, the last round for the whole 4-step phrase
  const laps = collection(LAPS_KEY).length;
  const play = createPlay(context, {
    emoji: "🎉", title: "Dinosaur Dress-up Parade", theme: "party", buddy: false, wander: false,
    instruction: "Choose a dinosaur, dress it up and pick a magical world. Then start the parade!", hint: "Tap an item to wear it, tap it again to take it off. More items unlock as you level up.", allowed: 99
  });
  const chip = function (txt) { return '<span style="background:rgba(255,255,255,.92);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#245048">' + txt + "</span>"; };
  const board = play.board;
  let tab = "hat", parading = false, photos = 0;
  /* conducting state — trail is every step the parade really marched, in order */
  let trail = [], copyIdx = 0, copyDone = false, copyOver = false, copyTimer = 0, nextUp = null;

  board.innerHTML = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 auto 8px">' +
    chip("Tier " + tier + " · " + TIER[tier - 1]) + chip("Worlds: " + WORLDS.length + " · items grow each level") +
    chip('Line <b id="pdLineSize">' + lineSize + '</b> dinosaurs · Laps <b id="pdLaps">' + laps + "</b>") +
    (best ? chip("Your best " + "⭐".repeat(best)) : "") + "</div>" +
    '<div class="pd-world" id="pdWorld"><div class="pd-sparkle">✨</div><div id="pdDeco" style="position:absolute;inset:0;pointer-events:none" aria-hidden="true"></div><div class="pd-bunting">🎊🎉🎊🎉🎊🎉🎊🎉</div>' +
    '<div id="pdSteps" data-trail="" data-tail="" data-tailback="' + stepBack + '" style="position:absolute;left:2%;right:2%;top:11%;z-index:6;display:flex;gap:3px;justify-content:center;flex-wrap:wrap;pointer-events:none;font-size:20px" aria-label="The steps the parade marched"></div>' +
    '<div id="pdLine" data-size="' + lineSize + '" style="position:absolute;left:1%;right:1%;top:29%;z-index:2;display:flex;justify-content:center;gap:1px;pointer-events:none" aria-label="The parade line"></div>' +
    '<div class="pd-crowd" id="pdCrowd"></div><div class="pd-stage" id="pdStage"><div class="pd-dino" id="pdDino"></div></div><div class="pd-name" id="pdName"></div><div class="pd-judges" id="pdJudges" hidden></div>' +
    '<div id="pdBonus" hidden data-laps="' + laps + '" style="position:absolute;left:50%;top:56%;transform:translateX(-50%);z-index:7;background:#fff8dc;border-radius:16px;padding:5px 14px;font-weight:900;font-size:13px;box-shadow:0 4px 0 rgba(24,62,64,.18);white-space:nowrap">🏁 Bonus lap!</div>' +
    '<div id="pdCopy" hidden data-state="idle" data-call="" style="position:absolute;left:50%;top:44%;transform:translateX(-50%);z-index:8;display:flex;flex-direction:column;align-items:center;gap:5px;background:rgba(255,255,255,.95);border-radius:18px;padding:8px 12px;box-shadow:0 5px 0 rgba(24,62,64,.18)"></div></div>' +
    '<div class="pd-panel"><div class="pd-row" id="pdSpecies"></div><div class="pd-row" id="pdColors"></div><div class="pd-tabs" id="pdTabs"></div><div class="pd-row" id="pdItems"></div><div class="pd-row" id="pdWorlds"></div>' +
    '<div class="pd-row" id="pdConduct" data-tempo="' + st.tempo + '" data-call-len="' + stepBack + '" style="border-top:2px dashed rgba(24,62,64,.12);padding-top:6px"><b>Conduct</b><span id="pdTempo" role="group" aria-label="Parade tempo" style="display:flex;gap:4px;flex-wrap:wrap"></span><small id="pdStepOrder" style="font-size:11px;font-weight:800;color:#5c7a72"></small></div></div>' +
    '<div class="pd-actions"><button type="button" class="pk-btn" id="pdRandom">🎲 Surprise me</button><button type="button" class="pk-btn" id="pdIdea">💡 Give me an idea</button><button type="button" class="pk-btn" id="pdPhoto">📸 Photo <b id="pdPhotos">' + collection("parade").length + '</b></button><button type="button" class="pk-btn sb-next" id="pdGo">Start the parade! 🎺</button></div>';
  const world = board.querySelector("#pdWorld"), dinoEl = board.querySelector("#pdDino"), crowd = board.querySelector("#pdCrowd");
  const stepsEl = board.querySelector("#pdSteps"), lineEl = board.querySelector("#pdLine"), copyEl = board.querySelector("#pdCopy"), bonusEl = board.querySelector("#pdBonus");

  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* low space */ } }
  function colorName() { return st.color || SPECIES[st.sp][2]; }
  function render() {
    const w = WORLDS[st.world];
    world.className = "pd-world " + w.cls + (parading ? " going" : "");
    world.style.background = w.bg || ""; // custom-gradient worlds share no CSS class
    board.querySelector("#pdDeco").innerHTML = (w.deco || []).map(function (d, i) { return '<span style="position:absolute;font-size:' + (30 + (i % 2) * 12) + 'px;opacity:.85;left:' + (6 + i * 30) + '%;top:' + (58 + (i % 3) * 12) + '%">' + d + "</span>"; }).join("");
    const sp = SPECIES[st.sp];
    dinoEl.innerHTML = F.dinoHTML(sp[0], { color: colorName(), state: parading ? "walk" : "idle", size: "100%" });
    board.querySelector("#pdName").textContent = sp[1] + "’s parade";
    dress();
    board.querySelector("#pdSpecies").innerHTML = '<b>Dinosaur</b>' + SPECIES.map(function (s, i) { return '<button type="button" class="pd-chip' + (i === st.sp ? " on" : "") + '" data-sp="' + i + '" aria-label="' + s[1] + '">' + F.dinoHTML(s[0], { color: s[2], size: "100%" }) + "</button>"; }).join("");
    board.querySelector("#pdColors").innerHTML = '<b>Colour</b>' + COLORS.map(function (c) { return '<button type="button" class="bd-sw' + (c[0] === colorName() ? " on" : "") + '" data-color="' + c[0] + '" style="background:' + c[1] + '" aria-label="' + c[0] + '"></button>'; }).join("");
    board.querySelector("#pdTabs").innerHTML = Object.keys(SLOTS).map(function (k) { return '<button type="button" class="pd-tab' + (k === tab ? " on" : "") + '" data-tab="' + k + '">' + (st.outfit[k] || "·") + " " + SLOTS[k].label + "</button>"; }).join("");
    board.querySelector("#pdItems").innerHTML = SLOTS[tab].items.map(function (it, i) {
      const open = i < unlocked(tab);
      return '<button type="button" class="pd-item' + (st.outfit[tab] === it ? " on" : "") + (open ? "" : " locked") + '" data-item="' + i + '" aria-label="' + (open ? it : "Locked until a higher level") + '">' + (open ? it : "🔒") + "</button>";
    }).join("");
    board.querySelector("#pdWorlds").innerHTML = '<b>World</b>' + WORLDS.map(function (w, i) { return '<button type="button" class="pd-world-btn' + (i === st.world ? " on" : "") + '" data-world="' + i + '">' + w.icon + " <small>" + w.name + "</small></button>"; }).join("");
    const CROWD = [["raptor", "yellow"], ["tricera", "pink"], ["stego", "teal"], ["bronto", "purple"], ["ptero", "orange"], ["trex", "red"], ["raptor", "blue"], ["tricera", "green"]];
    crowd.innerHTML = shuffle(CROWD).slice(0, Math.min(CROWD.length, 5 + tier * 2)).map(function (c, i) { return '<span style="--i:' + i + '">' + F.dinoHTML(c[0], { color: c[1], state: parading ? "happy" : "idle", size: "100%" }) + "</span>"; }).join("");
    renderConduct();
    renderLine();
  }
  /* ---- the conductor's panel: a real tempo control that sets the step order ---- */
  function renderConduct() {
    const t = board.querySelector("#pdTempo"); if (!t) return;
    t.innerHTML = TEMPO_IDS.map(function (id) {
      return '<button type="button" class="pd-tab' + (id === st.tempo ? " on" : "") + '" data-tempo="' + id + '" aria-label="' + TEMPOS[id].label + ' tempo">' + TEMPOS[id].label + "</button>";
    }).join("");
    const row = board.querySelector("#pdConduct");
    row.dataset.tempo = st.tempo;
    row.dataset.step = TEMPOS[st.tempo].pattern.join(",");
    board.querySelector("#pdStepOrder").textContent = "Step order " + TEMPOS[st.tempo].pattern.join(" ") +
      " — then echo the last " + stepBack + " steps back to me!";
  }
  /* ---- the parade line: one more dinosaur every couple of levels ---- */
  function renderLine() {
    if (!lineEl) return;
    const hop = F.motionOK && F.motionOK();
    lineEl.dataset.size = String(lineSize);
    lineEl.innerHTML = MARCHERS.slice(0, lineSize).map(function (m, i) {
      return '<span class="pd-marcher" data-order="' + i + '" style="width:' + (Math.max(46 / lineSize, 6)).toFixed(1) + '%;display:inline-block' +
        (hop ? ";animation:hs-hop " + (TEMPOS[st.tempo].ms * 2 / 1000).toFixed(2) + "s ease-in-out infinite;animation-delay:" + (i * 0.13).toFixed(2) + "s;animation-play-state:" + (parading ? "running" : "paused") : "") + '">' +
        F.dinoHTML(m[0], { color: m[1], state: parading ? "walk" : "idle", size: "100%" }) + "</span>";
    }).join("");
  }
  /* ---- the step ticker: every footprint the parade actually marched, newest last ---- */
  function showSteps() {
    if (!stepsEl) return;
    const tailFrom = Math.max(0, trail.length - stepBack);
    stepsEl.innerHTML = trail.map(function (s, i) {
      return '<i class="pd-foot' + (i >= tailFrom ? " tail" : "") + '" data-foot="' + s + '" style="font-style:normal;transform:scaleX(' + (s === "L" ? "-1" : "1") + ')' +
        (i >= tailFrom ? ";filter:drop-shadow(0 0 6px #ffe35a)" : ";opacity:.5") + '">' + FOOT[s] + "</i>";
    }).join("");
    stepsEl.dataset.trail = trail.join(",");
    stepsEl.dataset.tail = trail.slice(tailFrom).join(",");
  }
  function pushStep(s) {
    trail.push(s);
    if (trail.length > 12) trail.shift();
    showSteps();
    if (parading && !copyOver && F.burst) {
      const r = world.getBoundingClientRect();
      F.burst(r.left + r.width * (s === "L" ? 0.38 : 0.62), r.top + r.height * 0.8, { kind: "dust", n: 2, scale: 0.6 });
    }
  }
  function addText(group, ch, x, y, size) {
    if (!group || !ch) return;
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", String(x)); t.setAttribute("y", String(y)); t.setAttribute("font-size", String(size)); t.setAttribute("text-anchor", "middle"); t.textContent = ch;
    group.appendChild(t);
  }
  function dress() {
    const svg = dinoEl.querySelector("svg"); if (!svg) return;
    const head = svg.querySelector(".d-head"), body = svg.querySelector(".d-body"), tail = svg.querySelector(".d-tail");
    const o = st.outfit, ptero = SPECIES[st.sp][0] === "ptero";
    if (head) {
      const b = head.getBBox();
      addText(head, o.hat, b.x + b.width * (ptero ? 0.7 : 0.52), b.y + 14, 40);
      addText(head, o.face, b.x + b.width * (ptero ? 0.78 : 0.62), b.y + b.height * 0.5, 28);
      addText(head, o.neck, b.x + b.width * 0.28, b.y + b.height * 0.98, 26);
    }
    if (body) { const b = body.getBBox(); addText(body, o.back, b.x + b.width * 0.46, b.y + 12, 36); }
    if (tail) { const b = tail.getBBox(); addText(tail, o.tail, b.x + 10, b.y + b.height * 0.55, 26); }
  }
  render();

  board.addEventListener("click", function (e) {
    const t = e.target.closest("button"); if (!t || parading) return;
    if (t.dataset.sp !== undefined) { st.sp = Number(t.dataset.sp); st.color = ""; if (F.sfx) F.sfx.chirp(); }
    else if (t.dataset.color) { st.color = t.dataset.color; if (F.sfx) F.sfx.sparkle(); }
    else if (t.dataset.tab) { tab = t.dataset.tab; if (F.sfx) F.sfx.tap(); }
    else if (t.dataset.item !== undefined) {
      const i = Number(t.dataset.item);
      if (i >= unlocked(tab)) { play.say("Keep playing to unlock this one! 🔒", 2200); if (F.sfx) F.sfx.boing(); return; }
      const it = SLOTS[tab].items[i]; st.outfit[tab] = st.outfit[tab] === it ? "" : it;
      if (F.sfx) F.sfx.pop(); const r = dinoEl.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: "sparkle", n: 10 });
    } else if (t.dataset.world !== undefined) { st.world = Number(t.dataset.world); if (F.sfx) F.sfx.whoosh(); }
    else if (t.dataset.tempo && TEMPOS[t.dataset.tempo]) {
      st.tempo = t.dataset.tempo;
      if (F.sfx) F.sfx[t.dataset.tempo === "fast" ? "sparkle" : t.dataset.tempo === "slow" ? "boing" : "tap"]();
      trail = []; showSteps();
      play.say(TEMPOS[t.dataset.tempo].label + " marching! The step order is " + TEMPOS[t.dataset.tempo].pattern.join(" ") + ".", 2800);
    }
    else return;
    save(); render();
  });
  board.querySelector("#pdRandom").addEventListener("click", function () {
    if (parading) return;
    st.sp = Math.floor(Math.random() * 6); st.color = COLORS[Math.floor(Math.random() * COLORS.length)][0]; st.world = Math.floor(Math.random() * WORLDS.length); st.outfit = {};
    Object.keys(SLOTS).forEach(function (k) { if (Math.random() < 0.75) st.outfit[k] = SLOTS[k].items[Math.floor(Math.random() * unlocked(k))]; });
    if (F.sfx) F.sfx.boing(); save(); render();
  });
  board.querySelector("#pdIdea").addEventListener("click", function () {
    if (parading) return;
    const empty = Object.keys(SLOTS).filter(function (k) { return !st.outfit[k]; });
    const slot = empty.length ? empty[Math.floor(Math.random() * empty.length)] : Object.keys(SLOTS)[Math.floor(Math.random() * 5)];
    const it = SLOTS[slot].items[Math.floor(Math.random() * unlocked(slot))];
    st.outfit[slot] = st.outfit[slot] === it ? "" : it; tab = slot;
    if (F.sfx) F.sfx.sparkle(); const r = dinoEl.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: "sparkle", n: 12 });
    play.say("How about a " + it + " on the " + SLOTS[slot].label.toLowerCase() + "? Tap again to take it off!", 2600);
    save(); render();
  });
  board.querySelector("#pdPhoto").addEventListener("click", function () {
    const flash = document.createElement("div"); flash.className = "bd-flash"; world.appendChild(flash); window.setTimeout(function () { flash.remove(); }, 600);
    collect("parade", { sp: SPECIES[st.sp][0], color: colorName(), outfit: Object.assign({}, st.outfit), world: st.world });
    board.querySelector("#pdPhotos").textContent = collection("parade").length; photos += 1;
    if (F.sfx) { F.sfx.sparkle(); } play.say("Click! A photo for the parade album 📸", 2200);
  });
  board.querySelector("#pdGo").addEventListener("click", function () {
    if (parading) return;
    parading = true; trail = []; copyIdx = 0; copyDone = false; copyOver = false; render(); showSteps();
    const tempo = TEMPOS[st.tempo];
    const worldRect = world.getBoundingClientRect(), stage = board.querySelector("#pdStage");
    const run = dinoEl.animate && F.motionOK && F.motionOK() ? dinoEl.animate([{ translate: -(worldRect.width * 0.55) + "px 0" }, { translate: "0 0", offset: .5 }, { translate: worldRect.width * 0.55 + "px 0" }], { duration: tempo.march, easing: "linear", fill: "forwards" }) : null;
    play.say("You're the conductor! Marching at " + tempo.label + " tempo — watch the footprints! 🎺", 3000);
    let beatN = 0;
    const beat = window.setInterval(function () {
      if (!board.isConnected || copyOver) { window.clearInterval(beat); return; }
      if (F.sfx) F.sfx.drum(beatN % 4);
      pushStep(tempo.pattern[beatN % tempo.pattern.length]); // the step order the child has to echo back
      beatN += 1;
      const r = world.getBoundingClientRect(); if (F.burst) F.burst(r.left + Math.random() * r.width, r.top + r.height * 0.3, { kind: "notes", n: 2 });
    }, tempo.ms);
    if (F.burst) { F.burst(worldRect.left + worldRect.width / 2, worldRect.top, { kind: "confetti", n: 40 }); }
    window.setTimeout(function () { // pose in the middle
      const d = dinoEl.querySelector(".du-dino"); F.dinoState(d, SPECIES[st.sp][0] === "trex" ? "roar" : "happy", 1500); if (F.sfx) (SPECIES[st.sp][0] === "trex" ? F.sfx.roar : F.sfx.chirp)();
      if (F.wiggle) F.wiggle(dinoEl);
      const r = dinoEl.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: "stars", n: 20 });
      if (F.floatText) F.floatText(r.left + r.width / 2, r.top - 10, "Ta-da! 💃");
    }, Math.round(tempo.march * 0.5));
    const end = function () {
      window.clearInterval(beat);
      const filled = Object.keys(SLOTS).filter(function (k) { return st.outfit[k]; }).length;
      const scores = [Math.min(3, 1 + Math.floor(filled / 2)), Math.min(3, filled >= 3 ? 3 : 2), 3];
      const judges = board.querySelector("#pdJudges"); judges.hidden = false;
      judges.innerHTML = ["Style", "Sparkle", "Smile"].map(function (n, i) { return "<span><b>" + n + "</b>" + "⭐".repeat(scores[i]) + "</span>"; }).join("") +
        "<span><b>Rhythm</b>" + (copyDone ? "⭐⭐⭐" : "—") + "</span>";
      F.pop && F.pop(judges); if (F.sfx) { F.sfx.win(); F.sfx.sparkle(); }
      const r = world.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + 60, { kind: "hearts", n: 14 });
      play.say(copyDone ? "The judges love it — and you kept the beat! 🎉" : "The judges love it! 🎉", 3000);
      const total = scores.reduce(function (a, b) { return a + b; }, 0) + (copyDone ? 3 : 0);
      if (total >= 8) play.bonus();
      /* the Rhythm judge is upside, but slipping really does bite: three wrong turns caps the round at 2 stars */
      let stars = total >= 8 ? 3 : total >= 6 ? 2 : 1;
      if (play.state.misses >= 3 && stars > 2) stars = 2;
      if (play.state.misses >= 6 && stars > 1) stars = 1;
      window.setTimeout(function () {
        play.finish("You dressed " + SPECIES[st.sp][1] + " in " + filled + " fancy " + (filled === 1 ? "thing" : "things") +
          " and led " + lineSize + " dinosaur" + (lineSize === 1 ? "" : "s") + " through " + WORLDS[st.world].name +
          (copyDone ? ", echoing all " + stepBack + " march steps back!" : "!"), { stars: stars });
      }, 3000);
    };
    /* the call-and-response lives between the march and the judges, and always lets the parade march on */
    const afterMarch = function () { window.clearInterval(beat); conductPhase(end); };
    if (run) run.onfinish = afterMarch; else { seedTrail(tempo); window.setTimeout(afterMarch, 800); }
  });
  /* reduce-motion: the footprints still march, they just do not slide across the field */
  function seedTrail(tempo) {
    for (let i = 0; i < 5; i++) trail.push(tempo.pattern[i % tempo.pattern.length]);
    showSteps();
  }

  /* ------------------------------------------------ the copy-the-steps call and response */
  function conductPhase(next) {
    const call = trail.slice(-stepBack);
    nextUp = next;
    if (!board.isConnected || call.length < 2) { marchOn("skipped"); return; }
    copyEl.hidden = false; copyEl.dataset.state = "asking";
    copyEl.dataset.call = call.join(",");
    copyEl.dataset.need = String(call.length);
    paintCopy();
    play.hint("Look at the " + call.length + " glowing footprints at the top — tap LEFT and RIGHT in that order!", true);
    play.say("Hold the line! Echo the last " + call.length + " steps and we get a bonus lap! 🥁", 3400);
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(function () {
      if (copyDone || copyOver) return;
      marchOn("skipped");
      play.say("That's okay — the parade marches on! 🎺", 1800);
    }, COPY_MS);
  }
  function paintCopy() {
    const call = (copyEl.dataset.call || "").split(",").filter(Boolean);
    copyEl.innerHTML = '<b style="font-size:12px;color:#245048">Copy the last ' + call.length + " steps!</b>" +
      '<span id="pdSlots" data-filled="' + copyIdx + '" style="display:flex;gap:5px">' + call.map(function (_, i) {
        return '<i class="pd-slot' + (i < copyIdx ? " on" : "") + '" data-slot="' + i + '" style="font-style:normal;width:26px;height:26px;border-radius:9px;background:' +
          (i < copyIdx ? "#ffd45e" : "rgba(24,62,64,.1)") + ";display:grid;place-items:center;font-weight:900" + '">' + (i < copyIdx ? FOOT[call[i]] : "·") + "</i>";
      }).join("") + "</span>" +
      '<span style="display:flex;gap:6px">' +
      '<button type="button" class="pd-item pd-step" data-step="L" aria-label="Step with the left foot">👣<small style="display:block;font-size:10px;font-weight:900">L</small></button>' +
      '<button type="button" class="pd-item pd-step" data-step="R" aria-label="Step with the right foot">🦶<small style="display:block;font-size:10px;font-weight:900">R</small></button></span>' +
      '<button type="button" class="tiny-button" id="pdWatch">👀 Show me the steps again</button>' +
      '<button type="button" class="tiny-button" id="pdSkip">That\'s hard — march on 🎺</button>';
    copyEl.querySelectorAll(".pd-step").forEach(function (b) { b.addEventListener("click", function () { tapStep(b.dataset.step, b); }); });
    const w = copyEl.querySelector("#pdWatch");
    if (w) w.addEventListener("click", function () {
      showSteps(); if (F.sfx) F.sfx.sparkle();
      play.hint("There they are! The " + stepBack + " glowing footprints on the right are the answer.", true);
      play.say("Left, right… watch the feet! 👀", 2600);
    });
    const s = copyEl.querySelector("#pdSkip");
    if (s) s.addEventListener("click", function () { if (!copyDone) marchOn("skipped"); });
  }
  function tapStep(side, btn) {
    if (copyOver || copyDone || (side !== "L" && side !== "R")) return;
    const call = (copyEl.dataset.call || "").split(",");
    if (side !== call[copyIdx]) {
      copyIdx = 0; paintCopy();
      play.miss(copyEl, "Nearly! Watch the footprints again — which foot came first?");
      play.hint("The answer is " + call.join(" → ") + " — take them one at a time 💛", true);
      return;
    }
    copyIdx += 1;
    if (F.sfx) F.sfx[side === "L" ? "thud" : "tap"]();
    paintCopy();
    if (copyIdx < call.length) { play.good(copyEl, { text: side === "L" ? "Left!" : "Right!" }); return; }
    copyDone = true;
    copyEl.dataset.state = "done";
    play.good(copyEl, { text: "Perfect march!" });
    play.say("You echoed every step! Bonus lap! 🏁", 2800);
    const n = collect(LAPS_KEY, { sp: SPECIES[st.sp][0], world: st.world, steps: call.length });
    bonusEl.hidden = false; bonusEl.dataset.laps = String(n);
    bonusEl.textContent = "🏁 Bonus lap " + n + " — you kept the beat!";
    const lap = board.querySelector("#pdLaps"); if (lap) lap.textContent = String(n);
    if (F.sfx) F.sfx.coin();
    if (F.wiggle) F.wiggle(dinoEl);
    const r = world.getBoundingClientRect();
    if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height * 0.5, { kind: "confetti", n: 26 }); F.burst(r.left + r.width / 2, r.top + r.height * 0.4, { kind: "notes", n: 10 }); }
    window.setTimeout(function () { marchOn("done"); }, 1600);
  }
  function marchOn(state) {
    if (copyOver) return;
    copyOver = true;
    window.clearTimeout(copyTimer);
    copyEl.dataset.state = state;
    window.setTimeout(function () {
      copyEl.hidden = true;
      const go = nextUp; nextUp = null;
      if (go && board.isConnected) go();
    }, state === "done" ? 300 : 700);
  }
}
