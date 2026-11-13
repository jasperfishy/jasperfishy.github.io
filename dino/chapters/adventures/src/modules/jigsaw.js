/* Dino Picture Jigsaw — eight scenes, four puzzle sizes (6 to 24 pieces). Drag (or tap) pieces into the frame; they
 * snap with a sound. Every visit starts with two real choices: how the puzzle is played (a clue in the frame,
 * turned pieces, or no clue at all) and the light of the picture (morning to starlight, with drifting sky).
 * Then it goes in two parts — Part 1 is the border, Part 2 is the middle. When the picture is whole it comes alive,
 * and a bonus "Spot it!" round asks you to find the little things hidden in it. Finished pictures go into your
 * gallery with stars and a best time. */
import { createPlay, shuffle, enter, dragPiece, collect, collection, getExtras, escapeText } from "../adv-kit.js?v=du-58e7197a7bd67562";
import { photoPuzzle } from './photo-puzzles.js?v=du-58e7197a7bd67562';

const SKY = (id, a, b) => '<linearGradient id="' + id + '" x2="0" y2="1"><stop stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
const E = (ch, x, y, size, extra) => '<text x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle" ' + (extra || "") + '>' + ch + '</text>';
const F2 = (ch, x, y, size, name) => ({ ch: ch, x: x / 360, y: (y - size * 0.32) / 240, name: name || ch });

export const SCENES = [
  { name: "Dino Meadow", theme: "meadow", alive: ["🦋", "☁️"], finds: [F2("🌼", 40, 215, 30, "a flower"), F2("🌿", 322, 214, 30, "a fern"), F2("🐌", 150, 224, 26, "a snail"), F2("🦕", 200, 232, 26, "a little dinosaur")], svg: () =>
    '<defs>' + SKY("s", "#bce5ee", "#fff0c7") + '</defs><rect width="360" height="240" fill="url(#s)"/><circle cx="300" cy="49" r="26" fill="#ffd36d"/>' +
    '<path d="M0 157q74-67 148-4t120-10 92 6v91H0z" fill="#79bd82"/><path d="M0 197q84-50 176 0t184-9v52H0z" fill="#45896d"/>' +
    '<path d="M91 145c0-38 29-63 66-63h44c32 0 52 18 52 39 0 17-11 28-29 32v37h-19v-29h-23v29h-20v-30h-27c-27 0-44-6-44-15z" fill="#49a67d" stroke="#245f52" stroke-width="5"/>' +
    '<path d="m92 145-39-18 6 17 35 15" fill="#49a67d" stroke="#245f52" stroke-width="5"/><path d="m126 88 11-23 15 24m18-26 16-25 16 29" fill="#e98a62" stroke="#245f52" stroke-width="4"/>' +
    '<circle cx="240" cy="108" r="5" fill="#183e40"/><path d="M245 126q-11 9-21 0" fill="none" stroke="#183e40" stroke-width="3" stroke-linecap="round"/>' +
    E("🌼", 40, 215, 30) + E("🌿", 322, 214, 30) + E("🐌", 150, 224, 26) + E("🦕", 200, 232, 26) },
  { name: "Volcano Island", theme: "dig", alive: ["🔥", "💨"], finds: [F2("🌴", 56, 192, 54, "a palm tree"), F2("🦕", 292, 190, 64, "a brontosaurus"), F2("☁️", 300, 42, 40, "a cloud of ash"), F2("🪽", 330, 96, 26, "a feather")], svg: () =>
    '<defs>' + SKY("s", "#ffb199", "#ffe6a8") + '</defs><rect width="360" height="240" fill="url(#s)"/><circle cx="60" cy="52" r="22" fill="#fff3b0"/>' +
    '<path d="M110 190 170 70h30l60 120z" fill="#8a5a4d"/><path d="M168 74q17 12 34 0l-6-14h-22z" fill="#ff7b3a"/><path d="M183 74q-6 40 6 60t-4 56" stroke="#ff9a3a" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M0 190q90-20 180-4t180-8v62H0z" fill="#3fa1b8"/><path d="M0 214q90-18 180 0t180-4v30H0z" fill="#2c7f9e"/>' + E("🌴", 56, 192, 54) + E("🦕", 292, 190, 64) + E("☁️", 300, 42, 40) + E("🪽", 330, 96, 26) },
  { name: "Starry Night", theme: "night", alive: ["⭐", "🌙"], finds: [F2("🔮", 276, 168, 26, "a moonstone"), F2("🌠", 220, 130, 30, "the northern lights"), F2("🌲", 40, 200, 50, "a pine tree"), F2("🦕", 130, 196, 80, "a brontosaurus")], svg: () =>
    '<defs>' + SKY("s", "#141a4d", "#5a4b97") + '</defs><rect width="360" height="240" fill="url(#s)"/><circle cx="288" cy="52" r="28" fill="#fff6c9"/><circle cx="300" cy="46" r="24" fill="#3d3a82"/>' +
    '<g fill="#fffbd0"><circle cx="40" cy="40" r="3"/><circle cx="96" cy="76" r="2.4"/><circle cx="170" cy="30" r="3"/><circle cx="220" cy="84" r="2"/><circle cx="330" cy="120" r="2.6"/><circle cx="130" cy="120" r="2"/></g>' +
    '<path d="M0 170q90-50 180-10t180-14v94H0z" fill="#2b2f6a"/><path d="M0 206q100-40 190-4t170-6v44H0z" fill="#1f2457"/>' + E("🦕", 130, 196, 80) + E("🌲", 40, 200, 50) + E("🌵", 320, 204, 56) + E("🌠", 220, 130, 30) + E("🔮", 276, 168, 26) },
  { name: "The Old Sea", theme: "water", alive: ["🫧", "🐢"], finds: [F2("🐟", 250, 130, 44, "a fish"), F2("🥌", 140, 224, 28, "a round stone"), F2("🐚", 210, 224, 26, "a shell"), F2("🦈", 180, 90, 62, "a shark")], svg: () =>
    '<defs>' + SKY("s", "#7fd8f0", "#2f7fb0") + '</defs><rect width="360" height="240" fill="url(#s)"/>' +
    '<path d="M0 214q60-22 120 0t120 0 120-6v32H0z" fill="#e9cf93"/><path d="M40 214q-16-40 6-70m6 70q8-34-6-58m276 58q14-38-8-66" stroke="#2f9a63" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    '<g fill="none" stroke="#fff" stroke-width="2.4" opacity=".8"><circle cx="90" cy="60" r="9"/><circle cx="108" cy="36" r="6"/><circle cx="260" cy="70" r="8"/><circle cx="300" cy="40" r="5"/></g>' + E("🌀", 76, 205, 60) + E("🐟", 250, 130, 44) + E("🦈", 180, 90, 62) + E("🐢", 306, 205, 50) + E("🐚", 210, 224, 26) + E("🥌", 140, 224, 28) },
  { name: "Egg Nest", theme: "meadow", alive: ["🦋", "🐔"], finds: [F2("🍳", 192, 196, 52, "a clutch of eggs"), F2("🌿", 316, 160, 30, "a fern"), F2("🌰", 30, 200, 30, "a seed cone"), F2("🦕", 86, 168, 78, "mama dinosaur")], svg: () =>
    '<defs>' + SKY("s", "#ffd8a6", "#fff4d8") + '</defs><rect width="360" height="240" fill="url(#s)"/><circle cx="70" cy="56" r="30" fill="#ffc15e"/>' +
    '<path d="M0 168q90-40 180-6t180-10v88H0z" fill="#a8d57f"/><path d="M0 204q100-30 190 0t170-8v44H0z" fill="#7bb85f"/>' +
    '<ellipse cx="190" cy="186" rx="100" ry="30" fill="#b57b45"/><ellipse cx="190" cy="178" rx="84" ry="22" fill="#d9a066"/>' + E("🥚", 150, 190, 46) + E("🍳", 192, 196, 52) + E("🐔", 232, 190, 50) + E("🦕", 86, 168, 78) + E("🌿", 316, 160, 30) + E("🌰", 30, 200, 30) },
  { name: "Jungle Waterfall", theme: "meadow", alive: ["🌈", "💧"], finds: [F2("🪶", 300, 80, 36, "a feather"), F2("🌿", 190, 222, 28, "a fern"), F2("🌺", 250, 215, 28, "a flower"), F2("🦋", 320, 150, 24, "a dragonfly")], svg: () =>
    '<defs>' + SKY("s", "#9fe3b5", "#e8fbd0") + '</defs><rect width="360" height="240" fill="url(#s)"/>' +
    '<path d="M0 90q60-50 120-20v170H0z" fill="#3d9a5f"/><path d="M240 60q60-30 120 10v170H240z" fill="#2e8451"/><rect x="150" y="30" width="60" height="150" rx="10" fill="#d9f4ff"/><g stroke="#fff" stroke-width="4" opacity=".9"><path d="M165 34v140M180 30v146M195 36v138"/></g>' +
    '<path d="M0 184q90-20 180 0t180-6v62H0z" fill="#4eb7d6"/><path d="M0 214q90-16 180 0t180-4v30H0z" fill="#3c9cc0"/>' + E("🌴", 36, 170, 64) + E("🦕", 110, 200, 70) + E("🪶", 300, 80, 36) + E("🌺", 250, 215, 28) + E("🌿", 190, 222, 28) + E("🦋", 320, 150, 24) },
  { name: "Snowy Mountains", theme: "sky", alive: ["💨", "🌫️"], finds: [F2("🦴", 220, 205, 40, "an old bone"), F2("⛄", 300, 200, 50, "a snowman"), F2("🌠", 60, 60, 30, "the northern lights"), F2("🌲", 30, 200, 46, "a pine tree")], svg: () =>
    '<defs>' + SKY("s", "#bfe3f7", "#f4fbff") + '</defs><rect width="360" height="240" fill="url(#s)"/>' +
    '<path d="M20 190 110 50l90 140z" fill="#8fb1c9"/><path d="M150 190 250 30l110 160z" fill="#7ba0ba"/><path d="M110 50l-24 36 14-6 10 12 10-12 14 6z M250 30l-28 42 16-8 12 14 12-14 16 8z" fill="#fff"/>' +
    '<path d="M0 190q90-16 180 0t180-6v56H0z" fill="#ffffff"/><path d="M0 220q90-12 180 0t180-4v24H0z" fill="#e3f1fa"/>' + E("🦖", 110, 205, 70) + E("🦴", 220, 205, 40) + E("⛄", 300, 200, 50) + E("🌠", 60, 60, 30) + E("🌲", 30, 200, 46) },
  { name: "The Valley Feast", theme: "party", alive: ["🎊", "🌈"], finds: [F2("🍓", 180, 172, 56, "a bowl of berries"), F2("🎁", 150, 222, 30, "a gift"), F2("🫧", 40, 70, 40, "a bubble"), F2("✨", 320, 70, 40, "a sparkle")], svg: () =>
    '<defs>' + SKY("s", "#ffd4e6", "#fff3c7") + '</defs><rect width="360" height="240" fill="url(#s)"/>' +
    '<path d="M0 20q90 30 180 0t180 0" stroke="#d98aa8" stroke-width="3" fill="none"/><g><path d="M30 28l12 22 12-18z" fill="#ff8f8f"/><path d="M80 34l12 22 12-18z" fill="#ffd45e"/><path d="M130 36l12 22 12-18z" fill="#7bd0a0"/><path d="M200 36l12 22 12-18z" fill="#8cc3ee"/><path d="M250 34l12 22 12-18z" fill="#c9a0f0"/><path d="M300 28l12 22 12-18z" fill="#ff8f8f"/></g>' +
    '<rect x="0" y="196" width="360" height="44" fill="#f7a8b8"/><rect x="120" y="170" width="120" height="34" rx="6" fill="#fff" stroke="#d98aa8" stroke-width="3"/>' + E("🍓", 180, 172, 56) + E("🦖", 70, 205, 70) + E("🐢", 290, 205, 70) + E("🫧", 40, 70, 40) + E("✨", 320, 70, 40) + E("🎁", 150, 222, 30) + E("🪘", 215, 224, 28) }
];
const GRIDS = [[3, 2], [4, 3], [5, 3], [6, 4]];
const toImage = (scene) => "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="720" height="480">' + scene.svg() + "</svg>")));

async function openGallery(F) {
  const list = collection("gallery");
  const best = {};
  list.forEach(function (g) { best[g.scene] = Math.max(best[g.scene] || 0, g.stars || 1); });
  const photos=await Promise.all(SCENES.map((scene,i)=>best[i]?photoPuzzle(scene,i).catch(()=>toImage(scene)):null));
  const o = document.createElement("div");
  o.className = "bd-museum";
  o.innerHTML = '<div class="bd-museum-card"><button type="button" class="dialog-close" aria-label="Close">×</button><h2>🖼️ My puzzle gallery</h2><p>' + Object.keys(best).length + " of " + SCENES.length + ' pictures finished. Finish them all!</p><div class="bd-museum-grid">' +
    SCENES.map(function (s, i) { return best[i] ? '<figure class="bd-exhibit"><img class="jg-gal" src="' + photos[i] + '" alt="' + s.name + '"><figcaption><b>' + s.name + "</b><span>" + window.DUICONS.stars(best[i]) + "</span></figcaption></figure>" : '<figure class="bd-exhibit jg-locked"><div class="jg-q">?</div><figcaption><b>Not yet!</b></figcaption></figure>'; }).join("") + "</div></div>";
  document.body.appendChild(o);
  o.addEventListener("click", function (e) { if (e.target === o || e.target.closest(".dialog-close")) o.remove(); });
  F.sfx && F.sfx.pop();
}

/* The two branch choices, and what each one really changes about the build. */
const MODES = [
  { id: "clue", name: "Clue In The Frame", icon: "🧩", note: "The picture shows in the frame while you build.", guide: true, rotate: false, shrink: 0 },
  { id: "turned", name: "Turned Pieces", icon: "🔄", note: "Every piece starts on its side — tap it to spin.", guide: true, rotate: true, shrink: 0 },
  { id: "blind", name: "No Clue!", icon: "👀", note: "A blank frame, but one size easier. Peek any time.", guide: false, rotate: false, shrink: 1 }
];
const TIMES = [
  { id: "morning", name: "Morning", icon: "🌅", veil: ["rgba(255,236,170,.24)", "rgba(255,255,255,0)"], drift: ["☁️", "🪽"] },
  { id: "noon", name: "High Sun", icon: "☀️", veil: ["rgba(255,255,235,.14)", "rgba(150,215,255,.12)"], drift: ["✨", "☁️"] },
  { id: "sunset", name: "Sunset", icon: "🌇", veil: ["rgba(255,146,80,.26)", "rgba(120,60,140,.16)"], drift: ["🍂", "🌙"] },
  { id: "starlight", name: "Starlight", icon: "🌌", veil: ["rgba(26,30,92,.42)", "rgba(96,72,166,.22)"], drift: ["⭐", "🌙"] }
];

export function mountJigsaw(context) {
  const F = window.DUFX;
  const actId = (context.activity && context.activity.id) || "jigsaw";
  const sceneIndex = (context.level - 1) % SCENES.length;
  const scene = SCENES[sceneIndex];
  const log = collection("gallery");
  const mine = log.filter(function (g) { return Number(g.scene) === sceneIndex; });
  // time is "lower is better", and noteBest only grows star counts, so the best time comes out of the gallery log itself
  const bestTime = mine.reduce(function (m, g) { return g.seconds && (!m || g.seconds < m) ? g.seconds : m; }, 0);
  const bestStars = getExtras().best[actId] || 0;
  const finished = new Set(log.map(function (g) { return g.scene; })).size;
  const openModes = context.level >= 2 ? MODES : MODES.slice(0, 2);
  const openTimes = TIMES.slice(0, Math.min(TIMES.length, 2 + Math.floor((context.level - 1) / 2)));
  const play = createPlay(context, {
    emoji: "🧩", title: "Jigsaw: " + scene.name, theme: scene.theme, buddy: ["stego", "tricera", "bronto"][context.level % 3],
    instruction: "Choose how to play and what light to build in — then put the picture back together, border first!",
    hint: "Pick a card from each row, then press Start. Every piece has one special spot.", allowed: 99
  });
  const board = play.board;
  let picked = null, weatherOff = null;

  function banner(strong, small, ms) {
    const b = document.createElement("div");
    b.className = "pk-banner jg-part";
    b.innerHTML = "<strong>" + escapeText(strong) + "</strong><small>" + escapeText(small) + "</small>";
    play.scene.appendChild(b);
    if (F.sfx) F.sfx.drum(4);
    window.setTimeout(function () { b.remove(); }, ms || 1900);
  }

  /* ------------------------------------------------- the branch: how this puzzle is played */
  function showChoose() {
    board.innerHTML = '<div class="jg-choose"><p style="text-align:center;font-weight:900;margin:4px 0 8px">' + scene.name +
      " — how shall we build it?</p>" +
      '<div class="jg-pick-row" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">' + openModes.map(function (m, i) {
        return '<button type="button" class="pk-btn jg-mode" data-mode="' + m.id + '" style="max-width:170px;display:grid;gap:2px;justify-items:center;padding:10px 12px"><span style="font-size:28px">' + m.icon + "</span><b>" + m.name + '</b><small style="font-weight:700;opacity:.75;font-size:11px">' + m.note + "</small></button>";
      }).join("") + "</div>" +
      '<p style="text-align:center;font-weight:900;margin:12px 0 6px">And what light should the picture be in?</p>' +
      '<div class="jg-pick-row" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">' + openTimes.map(function (t) {
        return '<button type="button" class="pk-btn jg-time" data-time="' + t.id + '" style="padding:8px 12px"><span style="font-size:22px">' + t.icon + "</span> <b>" + t.name + "</b></button>";
      }).join("") + '</div><div style="text-align:center;margin-top:12px"><button type="button" class="pk-btn jg-go" disabled style="padding:12px 26px">▶ Start the puzzle</button></div>' +
      '<p class="fx-shelf-note" style="text-align:center;font-size:12px;font-weight:800;margin:10px 0 0">' +
      (bestStars ? "Your best here: " + window.DUICONS.stars(bestStars) : "No puzzle finished here yet!") + (bestTime ? " · fastest build " + fmt(bestTime) : "") +
      " · <b>" + finished + "</b> of " + SCENES.length + " pictures in your gallery</p></div>";
    const go = board.querySelector(".jg-go");
    let mode = null, time = null;
    board.querySelectorAll(".jg-mode, .jg-time").forEach(function (b, i) {
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(18px) scale(.8)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: i * 60, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "backwards" });
      b.addEventListener("click", function () {
        const isMode = b.classList.contains("jg-mode");
        if (isMode) mode = MODES.filter(function (m) { return m.id === b.dataset.mode; })[0];
        else time = TIMES.filter(function (t) { return t.id === b.dataset.time; })[0];
        b.parentElement.querySelectorAll("." + (isMode ? "jg-mode" : "jg-time")).forEach(function (x) { x.classList.toggle("on", x === b); });
        if (F.sfx) F.sfx.tap();
        if (mode && time) { go.disabled = false; play.hint("Nice pair! Press Start — border pieces first, then the middle."); }
        else play.hint(isMode ? "Now choose the light you like." : "Choose how the pieces come to you first.");
      });
    });
    go.addEventListener("click", function () {
      if (!mode || !time) return;
      if (F.sfx) F.sfx.drum(2);
      const r = go.getBoundingClientRect();
      if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 14 });
      play.say("A " + mode.name.toLowerCase() + " puzzle in the " + time.name.toLowerCase() + ". Let us build! 🧩");
      build(mode, time);
    });
  }

  function fmt(sec) { return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }

  async function build(mode, time) {
    picked = { mode: mode.id, time: time.id, modeName: mode.name, timeName: time.name };
    const gi = Math.max(0, (mode.shrink ? 1 : 0) + (context.challenge <= 2 ? 0 : context.challenge <= 4 ? 1 : context.challenge <= 6 ? 2 : 3));
    const grid = GRIDS[Math.min(GRIDS.length - 1, gi)];
    const cols = grid[0], rows = grid[1], total = cols * rows;
    const rotating = mode.rotate || context.challenge >= 4;
    const guide = mode.guide;
    const cellR = (360 / cols) / (240 / rows);
    const image = await photoPuzzle(scene,SCENES.indexOf(scene)).catch(()=>toImage(scene));
    if(!play.scene.isConnected) return;
    const bg = "url('" + image + "')";
    board.innerHTML = '<div class="jg-top"><figure class="jg-clue"><img src="' + image + '" alt="The finished picture: ' + scene.name + '"><figcaption>Picture clue</figcaption></figure>' +
      '<div class="jg-btns"><span class="jg-clock" style="padding:5px 11px;border-radius:99px;background:#fff3c9;font-weight:900">⏱ 0:00</span>' +
      '<span class="jg-part-chip" style="padding:5px 11px;border-radius:99px;background:#dff3e6;font-weight:900">Part 1 · the border</span>' +
      '<button type="button" class="pk-btn jg-peek">👀 Peek</button><button type="button" class="pk-btn jg-hintbtn">💡 Hint</button><button type="button" class="pk-btn jg-galbtn">🖼️ Gallery <b>' + new Set(log.map(function (g) { return g.scene; })).size + "</b></button></div></div>" +
      '<div class="jg-frame"><div class="jg-board" style="--c:' + cols + ';--r:' + rows + ';--ratio:' + cellR.toFixed(3) + '"></div><div class="jg-shine"></div>' +
      '<div class="jg-light" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(180deg,' + time.veil[0] + "," + time.veil[1] + ')"></div></div>' +
      '<div class="jg-tray" aria-label="Puzzle pieces"></div><p class="jg-name" hidden></p>';
    const clock = board.querySelector(".jg-clock"), partChip = board.querySelector(".jg-part-chip");
    const frame = board.querySelector(".jg-frame"), brd = board.querySelector(".jg-board"), tray = board.querySelector(".jg-tray");
    const peek = board.querySelector(".jg-peek"), hintBtn = board.querySelector(".jg-hintbtn");
    board.querySelector(".jg-galbtn").addEventListener("click", function () { openGallery(F); });
    const slices = function (index) {
      const x = index % cols, y = Math.floor(index / cols);
      return "background-image:" + bg + ";background-size:" + (cols * 100) + "% " + (rows * 100) + "%;background-position:" + (cols === 1 ? 0 : x / (cols - 1) * 100) + "% " + (rows === 1 ? 0 : y / (rows - 1) * 100) + "%";
    };
    for (let i = 0; i < total; i++) {
      const c = document.createElement("div");
      c.className = "jg-cell"; c.dataset.i = String(i);
      if (guide) { c.style.cssText = slices(i); c.classList.add("jg-guide"); }
      brd.appendChild(c);
    }
    const bw = () => brd.getBoundingClientRect().width;
    let selected = null, placed = 0;
    const rots = new Map();
    // Part 1 is the border, Part 2 the pieces inside it: the build now has two real halves
    const isEdge = function (i) { const x = i % cols, y = Math.floor(i / cols); return x === 0 || x === cols - 1 || y === 0 || y === rows - 1; };
    const all = Array.from({ length: total }, function (_, i) { return i; });
    const coreTotal = all.filter(function (i) { return !isEdge(i); }).length;
    const edgeTotal = total - coreTotal;
    const order = shuffle(all);
    const queue = coreTotal ? order.filter(isEdge).concat(order.filter(function (i) { return !isEdge(i); })) : order;
    let part = 1;
    const nudged = {};
    const pieces = queue.map(function (index, n) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "jg-piece"; b.dataset.p = String(index);
      b.dataset.edge = isEdge(index) ? "1" : "0";
      b.setAttribute("aria-label", "Puzzle piece " + (n + 1));
      b.style.cssText = slices(index);
      const rot = rotating ? [90, 180, 270][Math.floor(Math.random() * 3)] : 0;
      rots.set(b, rot); b.style.rotate = rot + "deg";
      tray.appendChild(b);
      if (!coreTotal || isEdge(index)) enter(b, n); else b.style.display = "none";
      return b;
    });
    function glow(cell) {
      if (!cell) return;
      cell.classList.add("jg-hintcell");
      if (cell.animate && F.motionOK && F.motionOK()) cell.animate([{ boxShadow: "0 0 0 0 rgba(255,205,80,0)" }, { boxShadow: "0 0 0 7px rgba(255,205,80,.95)", offset: .45 }, { boxShadow: "0 0 0 0 rgba(255,205,80,0)" }], { duration: 1300, iterations: 2 });
      window.setTimeout(function () { cell.classList.remove("jg-hintcell"); }, 2700);
    }
    function sizePieces() { const w = Math.max(50, Math.min(94, bw() / cols * 0.82)); pieces.forEach(function (b) { b.style.width = w + "px"; b.style.height = (w / cellR) + "px"; }); }
    sizePieces();
    const ro = window.ResizeObserver ? new ResizeObserver(sizePieces) : null; if (ro) ro.observe(brd);
    drift(time);
    const startedAt = Date.now();
    play.state.timers.push(window.setInterval(function () {
      if (!clock.isConnected) return;
      clock.textContent = "⏱ " + fmt(Math.round((Date.now() - startedAt) / 1000));
    }, 1000));

    function cellAt(x, y) {
      let best = null, bd = 1e9;
      brd.querySelectorAll(".jg-cell:not(.jg-done)").forEach(function (c) {
        const r = c.getBoundingClientRect();
        if (x < r.left - 8 || x > r.right + 8 || y < r.top - 8 || y > r.bottom + 8) return;
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < bd) { bd = d; best = c; }
      });
      return best;
    }
    function settle(piece, cell, fx, fy) {
      cell.classList.add("jg-done"); cell.classList.remove("jg-guide", "jg-hintcell");
      cell.style.cssText = slices(Number(piece.dataset.p));
      piece.classList.add("jg-used"); piece.disabled = true;
      selected = null; placed += 1;
      const r = cell.getBoundingClientRect();
      if (F.sfx) { F.sfx.thud(); window.setTimeout(F.sfx.good, 70); }
      if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "sparkle", n: 10 });
      play.good(cell, { text: placed === total ? "Complete!" : null });
      if (coreTotal && part === 1 && placed === edgeTotal) partTwo();
      if (placed === total) window.setTimeout(complete, 600);
    }
    function partTwo() {
      part = 2;
      partChip.textContent = "Part 2 · the middle";
      pieces.forEach(function (b, n) { if (b.dataset.edge === "0") { b.style.display = ""; enter(b, n); } });
      const rr = frame.getBoundingClientRect();
      if (F.burst) F.burst(rr.left + rr.width / 2, rr.top + rr.height / 2, { kind: "confetti", n: 20 });
      banner("Part 2 — the middle!", edgeTotal + " border pieces down — here are the " + coreTotal + " inside pieces", 2300);
      play.say("The border is finished! Fresh pieces have arrived in the tray.", 3200);
    }
    function drop(piece, cell, fx, fy) {
      if (!cell) { if (F.shake) F.shake(piece); play.hint("Drop the piece inside the frame."); return; }
      if (cell.dataset.i !== piece.dataset.p) {
        const here = Number(cell.dataset.i), want = Number(piece.dataset.p);
        if (coreTotal && part === 1 && !isEdge(here)) { play.say("Part 1 is the border — the middle squares open in Part 2!", 2600); if (F.sfx) F.sfx.chirp(); return; }
        const near = Math.abs((here % cols) - (want % cols)) + Math.abs(Math.floor(here / cols) - Math.floor(want / cols)) === 1;
        if (near && !nudged[piece.dataset.p]) {
          // nearly-right is teachable, so no miss is booked: light up the square next door instead
          nudged[piece.dataset.p] = 1;
          glow(brd.querySelector('.jg-cell[data-i="' + piece.dataset.p + '"]'));
          play.say("So close! That piece sits right next to here — see the glow? 👀", 2800);
          if (F.sfx) F.sfx.chirp();
          return;
        }
        play.miss(piece, "That piece fits somewhere else. Try another spot! 🧩");
        return;
      }
      if (rots.get(piece) % 360 !== 0) { play.say("Turn the piece the right way up first: tap it to spin! 🔄", 3000); if (F.shake) F.shake(piece); return; }
      // snap: the piece flies into its place
      const r = cell.getBoundingClientRect();
      const fly = document.createElement("div");
      fly.className = "pk-drag jg-fly"; fly.style.cssText = "background-image:" + bg + ";background-size:" + (cols * 100) + "% " + (rows * 100) + "%;background-position:" + piece.style.backgroundPosition + ";width:" + r.width + "px;height:" + r.height + "px;border-radius:6px";
      document.body.appendChild(fly);
      piece.style.visibility = "hidden";
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const fin = function () { fly.remove(); piece.style.visibility = ""; settle(piece, cell); };
      if (fly.animate && F.motionOK && F.motionOK()) {
        const a = fly.animate([{ left: fx + "px", top: fy + "px", transform: "translate(-50%,-55%) scale(1.12)" }, { left: cx + "px", top: cy + "px", transform: "translate(-50%,-50%) scale(1.15)", offset: .8 }, { left: cx + "px", top: cy + "px", transform: "translate(-50%,-50%) scale(1)" }], { duration: 280, easing: "cubic-bezier(.3,1.3,.5,1)" });
        a.onfinish = fin;
      } else fin();
    }
    pieces.forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        const rot = rots.get(b);
        if (rot % 360 !== 0) {
          rots.set(b, rot + 90); b.style.transition = "rotate .25s cubic-bezier(.3,1.5,.5,1)"; b.style.rotate = (rot + 90) + "deg";
          if (F.sfx) F.sfx.pop();
          if ((rot + 90) % 360 === 0) play.say("Right way up! Now put it in the frame. ✅", 2200);
        }
        pieces.forEach(function (x) { x.classList.toggle("sel", x === b && !x.classList.contains("sel")); x.classList.remove("jg-hinted"); });
        selected = b.classList.contains("sel") ? b : null;
        if (selected && rots.get(b) % 360 === 0) play.hint("Now tap the spot in the frame where it goes.");
      });
      dragPiece(b, {
        ghost: function () { const g = b.cloneNode(true); g.style.width = b.offsetWidth + "px"; g.style.height = b.offsetHeight + "px"; return g; },
        onDrop: function (x, y) { b.classList.remove("sel"); drop(b, cellAt(x, y), x, y); }
      });
    });
    brd.addEventListener("click", function (e) {
      if (!selected) return;
      const cell = e.target.closest && e.target.closest(".jg-cell");
      if (cell && !cell.classList.contains("jg-done")) { const p = selected; p.classList.remove("sel"); const r = p.getBoundingClientRect(); drop(p, cell, r.left + r.width / 2, r.top + r.height / 2); }
    });
    peek.addEventListener("click", function () {
      frame.classList.add("jg-peeking"); if (F.sfx) F.sfx.sparkle();
      window.setTimeout(function () { frame.classList.remove("jg-peeking"); }, 2200);
    });
    hintBtn.addEventListener("click", function () {
      const open = Array.prototype.slice.call(brd.querySelectorAll(".jg-cell:not(.jg-done)")).filter(function (c) { return !(coreTotal && part === 1) || isEdge(Number(c.dataset.i)); });
      if (!open.length) return;
      const cell = open[Math.floor(Math.random() * open.length)];
      const piece = pieces.find(function (p) { return !p.disabled && p.dataset.p === cell.dataset.i; });
      cell.classList.add("jg-hintcell"); if (piece) piece.classList.add("jg-hinted");
      if (F.sfx) F.sfx.sparkle();
      play.say("This piece goes in the glowing spot! ✨", 3000);
      window.setTimeout(function () { cell.classList.remove("jg-hintcell"); if (piece) piece.classList.remove("jg-hinted"); }, 3200);
    });

    /* ---- the picture is whole: it comes alive, then a bonus "Spot it!" round ---- */
    function complete() {
      frame.classList.add("jg-whole");
      tray.hidden = true; peek.hidden = true; hintBtn.hidden = true;
      const name = board.querySelector(".jg-name");
      name.hidden = false; name.textContent = scene.name + "! What a beautiful picture.";
      const r = frame.getBoundingClientRect();
      if (F.sfx) F.sfx.win();
      if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 26 }); F.burst(r.left + r.width / 2, r.bottom, { kind: "sparkle", n: 24 }); }
      if (!coreTotal) { partChip.textContent = "Part 2 · the secrets"; banner("Part 2 — the secret spots!", "The picture is whole. Now find what is hiding in it 🔍", 2300); }
      scene.alive.forEach(function (ch, i) {
        const s = document.createElement("span");
        s.className = "jg-alive"; s.textContent = ch; s.style.setProperty("--i", String(i));
        frame.appendChild(s);
      });
      window.setTimeout(spotIt, 2200);
    }
    function spotIt() {
      const finds = shuffle(scene.finds.slice()).slice(0, Math.min(scene.finds.length, context.challenge >= 5 ? 4 : 3));
      let n = 0, wrong = 0, done = false;
      const bar = document.createElement("div");
      bar.className = "jg-spot";
      board.insertBefore(bar, tray);
      frame.classList.add("jg-spotting");
      function ask() {
        if (n >= finds.length) return end();
        const f = finds[n];
        bar.innerHTML = '<span>Bonus: can you spot the <b class="jg-want">' + f.ch + '</b> ' + escapeText(f.name) + " in the picture?</span><i>" + (n + 1) + "/" + finds.length + "</i>";
        play.say("Bonus round! Spot " + f.name + " hiding in the picture!", 3500);
        wrong = 0;
      }
      function onTap(e) {
        if (done || n >= finds.length) return;
        const rr = frame.getBoundingClientRect();
        const x = (e.clientX - rr.left) / rr.width, y = (e.clientY - rr.top) / rr.height;
        const want = finds[n];
        const f = finds.slice(n).find(function (c) { return c.ch === want.ch && Math.hypot((x - c.x) * 1.5, y - c.y) < 0.12; });
        if (f) {
          finds.splice(finds.indexOf(f), 1); finds.splice(n, 0, f);
          const px = rr.left + f.x * rr.width, py = rr.top + f.y * rr.height;
          const ring = document.createElement("i"); ring.className = "jg-ring"; ring.style.left = (f.x * 100) + "%"; ring.style.top = (f.y * 100) + "%"; frame.appendChild(ring);
          play.good({ x: px, y: py }, { text: "Spotted!" });
          n += 1; window.setTimeout(ask, 900);
        } else {
          wrong += 1; play.miss(null, wrong >= 2 ? "Look near the glowing ring!" : "Not here… keep looking! 🔍");
          if (wrong >= 2) { const f2 = finds[n]; const ring = document.createElement("i"); ring.className = "jg-ring hint"; ring.style.left = (f2.x * 100) + "%"; ring.style.top = (f2.y * 100) + "%"; frame.appendChild(ring); window.setTimeout(function () { ring.remove(); }, 1800); }
        }
      }
      frame.addEventListener("click", onTap);
      function end() {
        done = true; frame.removeEventListener("click", onTap); frame.classList.remove("jg-spotting");
        bar.remove();
        if (weatherOff) weatherOff();
        const allow = Math.max(2, Math.ceil(total / 3));
        const stars = play.state.misses <= allow ? 3 : play.state.misses <= allow * 2 + 2 ? 2 : 1;
        const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const fastest = !bestTime || seconds < bestTime;
        collect("gallery", { scene: sceneIndex, stars: stars, seconds: seconds, pieces: total, mode: picked.mode, time: picked.time });
        play.say("Saved in your gallery! 🖼️" + (fastest ? " Your fastest build yet!" : ""), 3200);
        window.setTimeout(function () {
          play.finish("You built the whole " + scene.name + " picture in " + fmt(seconds) + " by the " + picked.timeName + " and spotted " + finds.length + " secret" + (finds.length === 1 ? "" : "s") + "!", { stars: stars });
        }, 1300);
      }
      ask();
    }

    /* the chosen light drifts over the scene: inline spans, so no shared stylesheet is touched */
    function drift(t) {
      if (weatherOff) weatherOff();
      weatherOff = null;
      if (F.motionOK && !F.motionOK()) return;
      const box = document.createElement("div");
      box.setAttribute("aria-hidden", "true");
      box.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:4";
      play.scene.appendChild(box);
      const anims = [];
      const h = play.scene.clientHeight || 320;
      for (let i = 0; i < 12; i++) {
        const sp = document.createElement("span");
        sp.textContent = t.drift[i % t.drift.length];
        sp.style.cssText = "position:absolute;left:" + (Math.random() * 100).toFixed(1) + "%;top:-8%;font-size:" + (12 + Math.random() * 14).toFixed(0) + "px;opacity:" + (0.45 + Math.random() * 0.4).toFixed(2);
        box.appendChild(sp);
        anims.push(sp.animate([{ transform: "translateY(0) rotate(0deg)" }, { transform: "translateY(" + (h + 60).toFixed(0) + "px) translateX(" + (Math.random() * 90 - 45).toFixed(0) + "px) rotate(300deg)" }],
          { duration: 6000 + Math.random() * 7000, delay: Math.random() * 4000, iterations: Infinity, easing: "linear" }));
      }
      weatherOff = function () { anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* already gone */ } }); box.remove(); };
    }
  }

  showChoose();
}
