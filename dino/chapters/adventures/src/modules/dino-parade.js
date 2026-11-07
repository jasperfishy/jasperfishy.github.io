/* Dinosaur Dress-up Parade — dress a real animated dinosaur (hat, glasses, neck, back, tail), pick its colour and a
 * magical world, then watch it lead a parade past a cheering crowd. The judges score Style, Sparkle and Smile, and you
 * can take a photo for the parade album (saved on this device). More dress-up items unlock as levels grow. */
import { createPlay, shuffle, collect, collection } from "../adv-kit.js?v=du-2b5bf1340085b709";

const SVGNS = "http://www.w3.org/2000/svg";
const SPECIES = [["trex", "T. rex", "green"], ["tricera", "Trike", "teal"], ["stego", "Spike", "purple"], ["bronto", "Bronte", "orange"], ["raptor", "Zippy", "red"], ["ptero", "Skye", "blue"]];
const COLORS = [["green", "#91d09c"], ["teal", "#7fd1c7"], ["blue", "#8cc3ee"], ["purple", "#b9a1e6"], ["pink", "#f5a9c4"], ["red", "#ee8a7c"], ["orange", "#f6b273"], ["yellow", "#f3d56b"]];
const SLOTS = {
  hat: { label: "Hat", items: ["👑", "🎩", "🧢", "🌸", "🎓", "⛑️", "🎀", "🪖"] },
  face: { label: "Face", items: ["🕶️", "👓", "🥽", "🎭"] },
  neck: { label: "Neck", items: ["🧣", "🎀", "📿", "🔔", "🏅", "🌼"] },
  back: { label: "Back", items: ["🎒", "🪽", "🎈", "🦋", "⛱️", "🎺"] },
  tail: { label: "Tail", items: ["🎀", "🔔", "🌸", "🎈", "⭐"] }
};
const WORLDS = [
  { name: "Sunshine Meadow", cls: "pd-meadow", icon: "🌼" }, { name: "Starry Lagoon", cls: "pd-stars", icon: "🌙" },
  { name: "Rainbow Valley", cls: "pd-rainbow", icon: "🌈" }, { name: "Fernwood Forest", cls: "pd-fern", icon: "🌿" }
];
const KEY = "dinosaur-universe-parade-v2";

export function mountDinoParade(context) {
  const F = window.DUFX;
  const level = Math.max(1, Number(context.level) || 1);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { /* fine */ }
  const st = { sp: Math.min(5, Number(saved.sp) || (level - 1) % 6), color: saved.color || "", world: Number(saved.world) || (level - 1) % WORLDS.length, outfit: saved.outfit || {} };
  const unlocked = (slot) => Math.min(SLOTS[slot].items.length, 3 + Math.floor(level / 2));
  const play = createPlay(context, {
    emoji: "🎉", title: "Dinosaur Dress-up Parade", theme: "party", buddy: false, wander: false,
    instruction: "Choose a dinosaur, dress it up and pick a magical world. Then start the parade!", hint: "Tap an item to wear it, tap it again to take it off. More items unlock as you level up.", allowed: 99
  });
  const board = play.board;
  let tab = "hat", parading = false, photos = 0;

  board.innerHTML = '<div class="pd-world" id="pdWorld"><div class="pd-sparkle">✨</div><div class="pd-bunting">🎊🎉🎊🎉🎊🎉🎊🎉</div><div class="pd-crowd" id="pdCrowd"></div><div class="pd-stage" id="pdStage"><div class="pd-dino" id="pdDino"></div></div><div class="pd-name" id="pdName"></div><div class="pd-judges" id="pdJudges" hidden></div></div>' +
    '<div class="pd-panel"><div class="pd-row" id="pdSpecies"></div><div class="pd-row" id="pdColors"></div><div class="pd-tabs" id="pdTabs"></div><div class="pd-row" id="pdItems"></div><div class="pd-row" id="pdWorlds"></div></div>' +
    '<div class="pd-actions"><button type="button" class="pk-btn" id="pdRandom">🎲 Surprise me</button><button type="button" class="pk-btn" id="pdPhoto">📸 Photo <b id="pdPhotos">' + collection("parade").length + '</b></button><button type="button" class="pk-btn sb-next" id="pdGo">Start the parade! 🎺</button></div>';
  const world = board.querySelector("#pdWorld"), dinoEl = board.querySelector("#pdDino"), crowd = board.querySelector("#pdCrowd");

  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* low space */ } }
  function colorName() { return st.color || SPECIES[st.sp][2]; }
  function render() {
    world.className = "pd-world " + WORLDS[st.world].cls + (parading ? " going" : "");
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
    crowd.innerHTML = [["raptor", "yellow"], ["tricera", "pink"], ["stego", "teal"], ["bronto", "purple"], ["ptero", "orange"]].map(function (c, i) { return '<span style="--i:' + i + '">' + F.dinoHTML(c[0], { color: c[1], state: parading ? "happy" : "idle", size: "100%" }) + "</span>"; }).join("");
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
    else return;
    save(); render();
  });
  board.querySelector("#pdRandom").addEventListener("click", function () {
    if (parading) return;
    st.sp = Math.floor(Math.random() * 6); st.color = COLORS[Math.floor(Math.random() * COLORS.length)][0]; st.world = Math.floor(Math.random() * WORLDS.length); st.outfit = {};
    Object.keys(SLOTS).forEach(function (k) { if (Math.random() < 0.75) st.outfit[k] = SLOTS[k].items[Math.floor(Math.random() * unlocked(k))]; });
    if (F.sfx) F.sfx.boing(); save(); render();
  });
  board.querySelector("#pdPhoto").addEventListener("click", function () {
    const flash = document.createElement("div"); flash.className = "bd-flash"; world.appendChild(flash); window.setTimeout(function () { flash.remove(); }, 600);
    collect("parade", { sp: SPECIES[st.sp][0], color: colorName(), outfit: Object.assign({}, st.outfit), world: st.world });
    board.querySelector("#pdPhotos").textContent = collection("parade").length; photos += 1;
    if (F.sfx) { F.sfx.sparkle(); } play.say("Click! A photo for the parade album 📸", 2200);
  });
  board.querySelector("#pdGo").addEventListener("click", function () {
    if (parading) return;
    parading = true; render();
    const worldRect = world.getBoundingClientRect(), stage = board.querySelector("#pdStage");
    const run = dinoEl.animate && F.motionOK && F.motionOK() ? dinoEl.animate([{ translate: -(worldRect.width * 0.55) + "px 0" }, { translate: "0 0", offset: .5 }, { translate: worldRect.width * 0.55 + "px 0" }], { duration: 6500, easing: "linear", fill: "forwards" }) : null;
    play.say("Welcome to the " + WORLDS[st.world].name + " parade! 🎺", 3000);
    const beat = window.setInterval(function () { if (!board.isConnected) { window.clearInterval(beat); return; } if (F.sfx) F.sfx.drum(Math.floor(Math.random() * 4)); const r = world.getBoundingClientRect(); if (F.burst) F.burst(r.left + Math.random() * r.width, r.top + r.height * 0.3, { kind: "notes", n: 2 }); }, 700);
    if (F.burst) { F.burst(worldRect.left + worldRect.width / 2, worldRect.top, { kind: "confetti", n: 40 }); }
    window.setTimeout(function () { // pose in the middle
      const d = dinoEl.querySelector(".du-dino"); F.dinoState(d, SPECIES[st.sp][0] === "trex" ? "roar" : "happy", 1500); if (F.sfx) (SPECIES[st.sp][0] === "trex" ? F.sfx.roar : F.sfx.chirp)();
      const r = dinoEl.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: "stars", n: 20 });
    }, 3250);
    const end = function () {
      window.clearInterval(beat);
      const filled = Object.keys(SLOTS).filter(function (k) { return st.outfit[k]; }).length;
      const scores = [Math.min(3, 1 + Math.floor(filled / 2)), Math.min(3, filled >= 3 ? 3 : 2), 3];
      const judges = board.querySelector("#pdJudges"); judges.hidden = false;
      judges.innerHTML = ["Style", "Sparkle", "Smile"].map(function (n, i) { return "<span><b>" + n + "</b>" + "⭐".repeat(scores[i]) + "</span>"; }).join("");
      F.pop && F.pop(judges); if (F.sfx) F.sfx.win();
      const r = world.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + 60, { kind: "hearts", n: 14 });
      play.say("The judges love it! 🎉", 3000);
      const total = scores.reduce(function (a, b) { return a + b; }, 0);
      window.setTimeout(function () { play.finish(SPECIES[st.sp][1] + " led a sparkling parade through " + WORLDS[st.world].name + "!", { stars: total >= 8 ? 3 : total >= 6 ? 2 : 1 }); }, 2600);
    };
    if (run) run.onfinish = end; else window.setTimeout(end, 800);
  });
}
