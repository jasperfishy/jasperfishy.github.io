/* Fossil Explorer — a real dig site. Brush the soil away with your finger or mouse (it is a scratch-off canvas),
 * find every bone, spot the hidden treasures, then watch the skeleton wake up as the dinosaur it belonged to. */
import { createPlay, collect, collection, getExtras, escapeText } from "../adv-kit.js?v=du-8607dafbfd11334e";

const SVGNS = "http://www.w3.org/2000/svg";
const W = 360, H = 240;
const BONE = 'fill="#fbf3dc" stroke="#a89468" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
const SPECIES = {
  trex: { name: "Tyrannosaurus rex", fact: "T. rex lived about 68 million years ago and had teeth as long as bananas!",
    tail: [[150, 138], [122, 148], [96, 158], [70, 166], [46, 170]], spine: [[150, 138], [170, 128], [190, 122], [208, 122]], neck: [[208, 122], [222, 108], [236, 94], [248, 84]],
    skull: [276, 78, 30, 20], legs: [[[168, 146], [150, 176], [158, 210]], [[188, 146], [202, 178], [198, 210]]], arm: [[214, 134], [226, 152]] },
  tricera: { name: "Triceratops", fact: "Triceratops had three horns and a big bony frill, and lived about 68 million years ago.",
    tail: [[110, 140], [84, 146], [60, 152], [40, 158]], spine: [[110, 140], [140, 132], [170, 128], [200, 128]], neck: [[200, 128], [216, 124]],
    skull: [246, 126, 30, 20], legs: [[[128, 148], [124, 178], [126, 210]], [[150, 150], [150, 180], [152, 210]], [[186, 150], [186, 180], [188, 210]], [[206, 148], [208, 178], [210, 210]]], horns: true },
  stego: { name: "Stegosaurus", fact: "Stegosaurus lived about 150 million years ago and had big plates along its back.",
    tail: [[110, 150], [86, 158], [62, 162], [40, 160]], spine: [[110, 150], [135, 132], [165, 122], [195, 128], [220, 140]], neck: [[220, 140], [236, 150], [248, 158]],
    skull: [268, 164, 18, 11], legs: [[[132, 150], [126, 180], [128, 210]], [[154, 146], [152, 178], [154, 210]], [[190, 146], [192, 178], [194, 210]], [[210, 148], [214, 180], [216, 210]]], plates: true },
  bronto: { name: "Brontosaurus", fact: "Brontosaurus had a very long neck and lived about 150 million years ago.",
    tail: [[120, 140], [92, 150], [64, 158], [36, 168]], spine: [[120, 140], [145, 128], [170, 126], [190, 134]], neck: [[190, 134], [206, 110], [218, 80], [230, 52], [244, 36]],
    skull: [260, 32, 17, 10], legs: [[[132, 148], [128, 180], [130, 212]], [[152, 148], [152, 180], [154, 212]], [[176, 150], [178, 182], [180, 212]], [[196, 148], [200, 180], [202, 212]]] },
  raptor: { name: "Velociraptor", fact: "Velociraptor was about the size of a turkey, and it had feathers!",
    tail: [[130, 130], [100, 134], [70, 142], [44, 150]], spine: [[130, 130], [155, 118], [180, 114]], neck: [[180, 114], [198, 100], [214, 88]],
    skull: [240, 82, 25, 13], legs: [[[148, 134], [136, 170], [146, 210]], [[168, 134], [180, 170], [172, 210]]], arm: [[188, 124], [204, 142]] }
};
const ORDER = ["trex", "tricera", "stego", "bronto", "raptor"];
const TREASURES = [["💎", "a sparkly gem"], ["🐚", "an ancient shell"], ["🦷", "a fossil tooth"], ["🟠", "a lump of amber"], ["🥚", "a tiny fossil egg"], ["🪨", "a shiny stone"]];
/* Each site is its own branch: different bones, different soil to brush, different sky above the pit. */
const SITES = [
  { id: "bone-bed", name: "Bone Bed Hill", icon: "🦴", species: ["trex", "stego"], buddy: "raptor",
    soil: ["#c9a070", "#a97d50"], tones: ["#b88c5c", "#9b6f43", "#d2ab7c", "#8a6038", "#c39a68"], pebble: ["#d9d2c4", "#8d8578"], rock: ["#8e6a50", "#5e4334"],
    tr: [0, 2, 3, 5], drift: ["🍃", "🌾"], weather: "dry", line: "Warm dusty hill — the bones are lying shallow here!" },
  { id: "amber-grotto", name: "Amber Grotto", icon: "🟠", species: ["raptor", "tricera"], buddy: "tricera",
    soil: ["#9c6a45", "#6d452c"], tones: ["#8a5a38", "#7a4a2a", "#b07a4c", "#5e3c24", "#96683f"], pebble: ["#e5c37a", "#8a6a30"], rock: ["#6d4c7a", "#3c2b52"],
    tr: [3, 0, 2, 4], drift: ["✨", "🕸️"], weather: "gloomy", line: "Cool and sticky in here — the deep bones are the good ones!" },
  { id: "shell-shore", name: "Shell Shore", icon: "🐚", species: ["bronto", "tricera"], buddy: "bronto",
    soil: ["#e4d3ab", "#c4ac82"], tones: ["#d8c69c", "#c0a878", "#efe0bd", "#b49a6c", "#e8d8b0"], pebble: ["#fff7e2", "#bfae8c"], rock: ["#7fa9b8", "#4c7386"],
    tr: [1, 5, 4, 0], drift: ["🐟", "💧"], weather: "breezy", line: "Sandy shore — the sea keeps washing new shells in!" },
  { id: "frost-hollow", name: "Frost Hollow", icon: "❄️", species: ["stego", "raptor", "trex"], buddy: "stego",
    soil: ["#cfe4f2", "#9dc0d8"], tones: ["#dbeaf6", "#bcd6e8", "#f0f8ff", "#a8c8dd", "#e6f2fa"], pebble: ["#ffffff", "#9fb8cc"], rock: ["#5f7fa8", "#33496b"],
    tr: [5, 0, 1, 2], drift: ["❄️", "⛄"], weather: "snow", line: "Frozen ground! You have to brush through the snow first." }
];

function el(name, attrs, text) { const n = document.createElementNS(SVGNS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); if (text) n.textContent = text; return n; }

/* returns { svg: group element, pieces: [{label, pts, c}] } in 360x240 units */
export function skeleton(key) {
  const d = SPECIES[key];
  const g = el("g", {});
  const pieces = [];
  const vert = (parent, x, y, r) => { parent.appendChild(el("ellipse", { cx: x, cy: y, rx: r, ry: r * .85, fill: "#fbf3dc", stroke: "#a89468", "stroke-width": 2.4 })); };
  const mid = (a) => a[Math.floor(a.length / 2)];
  // tail
  const tail = el("g", {});
  d.tail.forEach((p, i) => vert(tail, p[0], p[1], 6 - i * (4 / d.tail.length)));
  tail.insertBefore(el("path", { d: "M" + d.tail.map((p) => p.join(",")).join("L"), fill: "none", stroke: "#a89468", "stroke-width": 3 }), tail.firstChild);
  g.appendChild(tail); pieces.push({ label: "tail", node: tail, pts: d.tail.map((p) => p) });
  // legs
  const legGroup = (legs, label) => {
    const lg = el("g", {});
    legs.forEach((l) => {
      lg.appendChild(el("path", { d: "M" + l[0].join(",") + "L" + l[1].join(",") + "L" + l[2].join(","), fill: "none", stroke: "#a89468", "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      lg.appendChild(el("path", { d: "M" + l[0].join(",") + "L" + l[1].join(",") + "L" + l[2].join(","), fill: "none", stroke: "#fbf3dc", "stroke-width": 4.4, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      vert(lg, l[1][0], l[1][1], 5.4);
      lg.appendChild(el("path", { d: "M" + (l[2][0] - 7) + "," + l[2][1] + "L" + (l[2][0] + 11) + "," + l[2][1], stroke: "#a89468", "stroke-width": 6, "stroke-linecap": "round" }));
      lg.appendChild(el("path", { d: "M" + (l[2][0] - 7) + "," + l[2][1] + "L" + (l[2][0] + 11) + "," + l[2][1], stroke: "#fbf3dc", "stroke-width": 3, "stroke-linecap": "round" }));
    });
    g.appendChild(lg);
    pieces.push({ label: label, node: lg, pts: legs.reduce((a, l) => a.concat([l[1], mid([l[0], l[1], l[2]])]), []) });
  };
  const half = Math.ceil(d.legs.length / 2);
  legGroup(d.legs.slice(0, half), d.legs.length > 2 ? "back legs" : "leg");
  if (d.legs.length > 1) legGroup(d.legs.slice(half), d.legs.length > 2 ? "front legs" : "other leg");
  // spine + ribs
  const back = el("g", {});
  back.appendChild(el("path", { d: "M" + d.spine.map((p) => p.join(",")).join("L"), fill: "none", stroke: "#a89468", "stroke-width": 3 }));
  d.spine.forEach((p) => vert(back, p[0], p[1], 6.4));
  if (d.plates) d.spine.forEach((p, i) => { if (i > 0) back.appendChild(el("path", { d: "M" + (p[0] - 8) + "," + (p[1] - 6) + "l8,-28l9,28z", fill: "#f4e1b6", stroke: "#a89468", "stroke-width": 2.6, "stroke-linejoin": "round" })); });
  g.appendChild(back); pieces.push({ label: "backbone", node: back, pts: d.spine.map((p) => [p[0], p[1] - 4]) });
  const ribs = el("g", {});
  const s0 = d.spine[Math.min(1, d.spine.length - 1)], s1 = d.spine[d.spine.length - 1];
  const ribPts = [];
  for (let i = 0; i < 5; i++) {
    const t = (i + 1) / 6, x = s0[0] + (s1[0] - s0[0]) * t, y = s0[1] + (s1[1] - s0[1]) * t + 4;
    ribs.appendChild(el("path", { d: "M" + x + "," + y + "q-12,8 -10,32", fill: "none", stroke: "#a89468", "stroke-width": 7, "stroke-linecap": "round" }));
    ribs.appendChild(el("path", { d: "M" + x + "," + y + "q-12,8 -10,32", fill: "none", stroke: "#fbf3dc", "stroke-width": 3.6, "stroke-linecap": "round" }));
    ribPts.push([x - 7, y + 14]);
  }
  g.appendChild(ribs); pieces.push({ label: "ribs", node: ribs, pts: ribPts });
  // neck
  const neck = el("g", {});
  neck.appendChild(el("path", { d: "M" + d.neck.map((p) => p.join(",")).join("L"), fill: "none", stroke: "#a89468", "stroke-width": 3 }));
  d.neck.forEach((p, i) => vert(neck, p[0], p[1], 6 - Math.min(2, i * .4)));
  g.appendChild(neck); pieces.push({ label: "neck", node: neck, pts: d.neck.map((p) => p) });
  // arm
  if (d.arm) { const a = el("g", {}); a.appendChild(el("path", { d: "M" + d.arm[0].join(",") + "L" + d.arm[1].join(","), stroke: "#a89468", "stroke-width": 7, "stroke-linecap": "round" })); a.appendChild(el("path", { d: "M" + d.arm[0].join(",") + "L" + d.arm[1].join(","), stroke: "#fbf3dc", "stroke-width": 3.4, "stroke-linecap": "round" })); g.appendChild(a); }
  // skull
  const [sx, sy, rx, ry] = d.skull;
  const skull = el("g", {});
  if (d.horns) {
    skull.appendChild(el("path", { d: "M" + (sx - rx * .9) + "," + (sy - ry * .6) + "q-14,-38 18,-48 q34,10 22,42z", fill: "#f4e1b6", stroke: "#a89468", "stroke-width": 2.6, "stroke-linejoin": "round" }));
    skull.appendChild(el("path", { d: "M" + (sx + rx * .5) + "," + (sy - ry * .6) + "l26,-16l-6,24z M" + (sx + rx * .4) + "," + (sy + ry * .1) + "l30,14l-26,6z", fill: "#fbf3dc", stroke: "#a89468", "stroke-width": 2.6, "stroke-linejoin": "round" }));
  }
  skull.appendChild(el("ellipse", { cx: sx, cy: sy, rx: rx, ry: ry, fill: "#fbf3dc", stroke: "#a89468", "stroke-width": 2.8 }));
  skull.appendChild(el("circle", { cx: sx - rx * .15, cy: sy - ry * .15, r: Math.max(3, ry * .32), fill: "#6a5a3c" }));
  skull.appendChild(el("path", { d: "M" + (sx + rx * .25) + "," + (sy + ry * .55) + "h" + rx * .75 + "m-" + rx * .6 + ",0v4m" + rx * .2 + ",-4v4m" + rx * .2 + ",-4v4", stroke: "#a89468", "stroke-width": 2.2, fill: "none", "stroke-linecap": "round" }));
  g.appendChild(skull); pieces.push({ label: "skull", node: skull, pts: [[sx, sy], [sx - rx * .5, sy], [sx + rx * .5, sy]] });
  pieces.forEach((p) => { const xs = p.pts.map((q) => q[0]), ys = p.pts.map((q) => q[1]); p.c = [(Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2]; });
  return { g: g, pieces: pieces };
}

export function mountFossil(context) {
  const F = window.DUFX;
  const digs = collection("digs");
  const bestStars = getExtras().best[(context.activity && context.activity.id) || "fossil"] || 0;
  const layers = 1 + Math.min(2, Math.floor((context.challenge || 1) / 3));
  const open = SITES.slice(0, Math.min(SITES.length, 2 + Math.floor((context.level - 1) / 3)));
  const play = createPlay(context, {
    emoji: "🦴", title: "Fossil explorer", theme: "dig", buddy: "raptor",
    instruction: "Pick a dig site, then brush the soil away to find every bone. Something might be hiding underneath!",
    hint: "Drag your finger across the soil like a brush. Stuck? Tap the magnifying glass.", allowed: 99
  });
  const board = play.board;
  let weatherOff = null;

  /* the branch: which site a child digs changes the bones, the soil and the weather */
  function showSites() {
    board.innerHTML = '<div class="fx-sites"><p class="fx-sites-q" style="text-align:center;font-weight:900;margin:6px 0 10px">Choose where to dig today — every site hides different bones!</p>' +
      '<div class="fx-site-row" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">' + open.map(function (s, i) {
        return '<button type="button" class="pk-btn fx-site" data-site="' + i + '" style="max-width:190px;display:grid;gap:2px;justify-items:center;padding:12px 14px"><span style="font-size:34px">' + s.icon + "</span><b>" + s.name + '</b><small style="font-weight:700;opacity:.75;font-size:11px">' + s.line + "</small></button>";
      }).join("") + "</div>" +
      '<p class="fx-shelf-note" style="text-align:center;font-size:12px;font-weight:800;margin:10px 0 0">' + layers + " layer" + (layers > 1 ? "s" : "") + " of earth to get through · " +
      (bestStars ? "your best here: " + "⭐".repeat(bestStars) : "no dig finished here yet!") + (digs.length ? " · <b>" + digs.length + "</b> digs in your log" : "") + "</p></div>";
    play.hint("Tap a dig site to start. " + layers + " layers of soil, with treasures hidden in every one!", true);
    board.querySelectorAll(".fx-site").forEach(function (b, i) {
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(24px) scale(.7)" }, { opacity: 1, transform: "none" }], { duration: 440, delay: i * 90, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "backwards" });
      b.addEventListener("click", function () {
        if (F.sfx) F.sfx.drum(2);
        const r = b.getBoundingClientRect();
        if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 16 });
        play.say("To the " + open[Number(b.dataset.site)].name + "! 🚛");
        startDig(open[Number(b.dataset.site)]);
      });
    });
  }

  function banner(strong, small, ms) {
    const el = document.createElement("div");
    el.className = "pk-banner fx-part";
    el.innerHTML = "<strong>" + escapeText(strong) + "</strong><small>" + escapeText(small) + "</small>";
    play.scene.appendChild(el);
    if (F.sfx) F.sfx.drum(4);
    window.setTimeout(function () { el.remove(); }, ms || 1900);
  }

  /* ---------------------------------------------------- one dig, several layers */
  function startDig(site) {
    const key = site.species[(context.level - 1) % site.species.length];
    const data = SPECIES[key];
    board.innerHTML = '<div class="fx-tools"><button type="button" class="pk-btn on" data-tool="34" aria-label="Big brush">🖌️ Big</button>' +
      '<button type="button" class="pk-btn" data-tool="18" aria-label="Little brush">✏️ Little</button>' +
      '<button type="button" class="pk-btn" data-tool="blow" aria-label="Blow the dust away">💨 Blow</button>' +
      '<button type="button" class="pk-btn fx-lens" aria-label="Magnifying glass hint">🔍</button></div>' +
      '<div class="fx-dig"><svg class="fx-rock" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true"></svg><canvas class="fx-soil" aria-label="Soil to brush away"></canvas><div class="fx-treasures"></div><div class="fx-ping" hidden></div></div>' +
      '<div class="fx-shelf" aria-live="polite"><span class="fx-found"><b>0</b> of <i></i> bones</span><span class="fx-trs">Treasures: <b>0</b></span>' +
      '<span class="fx-layer-chip" style="padding:4px 12px;border-radius:99px;background:#fff3c9;font-weight:900">Layer <b>1</b> of ' + layers + "</span></div>";
    const dig = board.querySelector(".fx-dig"), rock = board.querySelector(".fx-rock"), cv = board.querySelector(".fx-soil"), tre = board.querySelector(".fx-treasures"), ping = board.querySelector(".fx-ping");
    const layerChip = board.querySelector(".fx-layer-chip b");
    rock.innerHTML = '<defs><linearGradient id="fxr" x2="0" y2="1"><stop stop-color="' + site.rock[0] + '"/><stop offset="1" stop-color="' + site.rock[1] + '"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#fxr)"/>' +
      '<path d="M0 60q90-20 180 6t180-10M0 130q100-26 200 4t160-8M0 200q80-18 170 4t190-10" stroke="rgba(0,0,0,.18)" stroke-width="3" fill="none"/>';
    const sk = skeleton(key);
    rock.appendChild(sk.g);
    const pieces = sk.pieces;
    // bones are shared out across the layers, so a deeper dig really is more digging
    const perLayer = Math.ceil(pieces.length / layers);
    pieces.forEach(function (p, i) { p.layer = Math.min(layers, 1 + Math.floor(i / perLayer)); });
    const treasuresLeft = site.tr.slice();
    const spots = [[40, 40], [320, 40], [60, 200], [320, 210], [180, 36], [110, 215], [300, 120], [24, 130], [140, 96], [250, 176]];
    const gemPts = spots.slice().sort(() => Math.random() - 0.5);
    const gems = [];
    function addGems(n) {
      for (let i = 0; i < n && gemPts.length; i++) {
        const s = gemPts.shift();
        const tid = treasuresLeft.shift();
        const t = TREASURES[tid == null ? i % TREASURES.length : tid];
        const b = document.createElement("button");
        b.type = "button"; b.className = "fx-gem"; b.textContent = t[0]; b.disabled = true; b.setAttribute("aria-label", "Hidden treasure: " + t[1]);
        b.style.left = (s[0] / W * 100) + "%"; b.style.top = (s[1] / H * 100) + "%";
        tre.appendChild(b);
        const g = { b: b, pt: s, got: false, shown: false, name: t[1] };
        gems.push(g);
        b.addEventListener("click", function () {
          if (g.got) return;
          g.got = true; trs += 1;
          board.querySelector(".fx-trs b").textContent = trs;
          b.classList.add("got");
          const to = board.querySelector(".fx-trs");
          if (F.flyTo) F.flyTo(b, to, { emoji: t[0], size: 34, kind: "stars" });
          if (F.sfx) F.sfx.coin();
          play.say("You found " + g.name + "! 🌟");
          window.setTimeout(function () { b.style.visibility = "hidden"; }, 100);
        });
      }
    }
    addGems(Math.min(4, 2 + Math.floor(context.challenge / 3)));
    board.querySelector(".fx-found i").textContent = pieces.length;
    drift(site);

    // ---- the soil ----
    const ctx = cv.getContext("2d");
    let cw = 0, ch = 0, dpr = 1, layer = 1, depth = 0;
    function paintSoil() {
      const r = dig.getBoundingClientRect();
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      cw = Math.round(r.width); ch = Math.round(r.height);
      cv.width = cw * dpr; cv.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      const gr = ctx.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, site.soil[0]); gr.addColorStop(1, site.soil[1]);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, cw, ch);
      const rnd = (a, b) => a + Math.random() * (b - a);
      const tones = site.tones;
      for (let i = 0; i < cw * ch / 90; i++) { ctx.fillStyle = tones[i % tones.length]; ctx.globalAlpha = rnd(.25, .7); ctx.beginPath(); ctx.arc(rnd(0, cw), rnd(0, ch), rnd(1, 4.2), 0, 6.3); ctx.fill(); }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 26; i++) { const x = rnd(0, cw), y = rnd(0, ch), rr = rnd(5, 13); const pg = ctx.createRadialGradient(x - rr * .3, y - rr * .3, 1, x, y, rr); pg.addColorStop(0, site.pebble[0]); pg.addColorStop(1, site.pebble[1]); ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * .75, rnd(0, 3), 0, 6.3); ctx.fill(); }
      ctx.strokeStyle = "rgba(90,58,30,.5)"; ctx.lineWidth = 3; ctx.lineCap = "round";
      for (let i = 0; i < 7; i++) { ctx.beginPath(); let x = rnd(0, cw), y = rnd(0, ch); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rnd(-30, 30); y += rnd(-22, 22); ctx.lineTo(x, y); } ctx.stroke(); }
      if (depth > 0) { ctx.fillStyle = "rgba(24,12,6," + (0.04 + depth * 0.05).toFixed(2) + ")"; ctx.fillRect(0, 0, cw, ch); }
      ctx.globalAlpha = 1;
    }
    paintSoil();
    let tool = 34;
    board.querySelectorAll("[data-tool]").forEach(function (b) {
      b.addEventListener("click", function () {
        tool = b.dataset.tool === "blow" ? "blow" : Number(b.dataset.tool);
        board.querySelectorAll("[data-tool]").forEach(function (x) { x.classList.toggle("on", x === b); });
        if (F.sfx) F.sfx[b.dataset.tool === "blow" ? "whoosh" : "tap"]();
      });
    });
    let down = false, lx = 0, ly = 0, lastDust = 0, lastCheck = 0, dirty = false, lastScrape = 0;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (cw / r.width), (e.clientY - r.top) * (ch / r.height)]; };
    function erase(x0, y0, x1, y1) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (tool === "blow") {
        const g = ctx.createRadialGradient(x1, y1, 4, x1, y1, 66); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(.7, "rgba(0,0,0,.9)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x1, y1, 66, 0, 6.3); ctx.fill();
      } else {
        ctx.lineWidth = tool; ctx.strokeStyle = "#000"; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1 + 0.01); ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      dirty = true;
    }
    function dust(e, n) {
      const now = performance.now();
      if (now - lastDust < 90) return;
      lastDust = now;
      if (F.burst) F.burst(e.clientX, e.clientY, { kind: "dust", n: n || 3, scale: 0.8 });
      if (F.sfx && now - lastScrape > 500) { lastScrape = now; F.sfx.scrape(); }
    }
    cv.addEventListener("pointerdown", function (e) { down = true; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } const p = pos(e); lx = p[0]; ly = p[1]; erase(lx, ly, lx, ly); dust(e, tool === "blow" ? 8 : 3); check(); });
    cv.addEventListener("pointermove", function (e) { if (!down) return; const p = pos(e); erase(lx, ly, p[0], p[1]); lx = p[0]; ly = p[1]; dust(e); if (performance.now() - lastCheck > 140) check(); });
    const up = function () { down = false; check(); };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("pointerleave", up);

    function cleared(ux, uy) {
      const x = Math.floor(ux / W * cw * dpr), y = Math.floor(uy / H * ch * dpr);
      if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return true;
      return ctx.getImageData(x, y, 1, 1).data[3] < 60;
    }
    let found = 0, trs = 0, done = false;
    function check() {
      lastCheck = performance.now();
      if (!dirty || done) return;
      dirty = false;
      const r = dig.getBoundingClientRect();
      const here = pieces.filter(function (p) { return p.layer === layer; });
      let near = null;
      here.forEach(function (p) {
        if (p.found) return;
        const n = p.pts.filter(function (q) { return cleared(q[0], q[1]); }).length;
        if (n / p.pts.length >= 0.6) {
          p.found = true; found += 1;
          board.querySelector(".fx-found b").textContent = found;
          board.querySelector(".fx-found").classList.add("pop"); window.setTimeout(function () { board.querySelector(".fx-found").classList.remove("pop"); }, 400);
          play.good({ x: r.left + p.c[0] / W * r.width, y: r.top + p.c[1] / H * r.height }, { text: found === pieces.length ? "Every bone!" : "Found the " + p.label + "!" });
          if (F.sfx) F.sfx.star();
          ping.hidden = true;
        } else if (n / p.pts.length >= 0.34 && !p.nudged) near = p;
      });
      // a teaching nudge, not a scold: a bone that is almost clear is worth pointing at
      if (near) {
        near.nudged = true;
        ping.hidden = false;
        ping.style.left = (near.c[0] / W * 100) + "%"; ping.style.top = (near.c[1] / H * 100) + "%";
        ping.classList.remove("on"); void ping.offsetWidth; ping.classList.add("on");
        play.say("So close! A little more brushing around the glow and the " + near.label + " is yours 🌟", 3000);
        if (F.sfx) F.sfx.chirp();
      }
      gems.forEach(function (g) {
        if (g.got || g.shown) return;
        if (cleared(g.pt[0], g.pt[1])) { g.shown = true; g.b.disabled = false; g.b.classList.add("show"); if (F.sfx) F.sfx.sparkle(); const rr = g.b.getBoundingClientRect(); if (F.burst) F.burst(rr.left + rr.width / 2, rr.top + rr.height / 2, { kind: "sparkle", n: 10 }); play.say("Ooh! Something is shining. Tap it! ✨"); }
      });
      if (found === pieces.length) finish();
      else if (here.length && here.every(function (p) { return p.found; })) nextLayer();
    }
    function nextLayer() {
      if (layer >= layers) return;
      layer += 1; depth = layer - 1;
      layerChip.textContent = String(layer);
      banner("Part " + layer + " — deeper down!", "Layer " + layer + " of " + layers + " at the " + site.name, 2100);
      const rr = dig.getBoundingClientRect();
      if (F.burst) F.burst(rr.left + rr.width / 2, rr.top + rr.height / 2, { kind: "bones", n: 12 });
      // fresh soil over everything, so the deeper bones and treasures must be brushed out again
      gems.forEach(function (g) { if (!g.got) { g.shown = false; g.b.disabled = true; g.b.classList.remove("show"); g.b.style.visibility = ""; } });
      addGems(1);
      paintSoil();
      play.say("New earth! Keep brushing — the " + site.name + " hides its best bones deep.", 3400);
    }
    board.querySelector(".fx-lens").addEventListener("click", function () {
      const left = pieces.filter(function (p) { return !p.found && p.layer === layer; });
      const hunt = left.length ? left : pieces.filter(function (p) { return !p.found; });
      if (!hunt.length || done) return;
      const p = hunt[Math.floor(Math.random() * hunt.length)];
      ping.hidden = false;
      ping.style.left = (p.c[0] / W * 100) + "%"; ping.style.top = (p.c[1] / H * 100) + "%";
      ping.classList.remove("on"); void ping.offsetWidth; ping.classList.add("on");
      if (F.sfx) F.sfx.sparkle();
      play.say("Try brushing near the glow — a " + p.label + " is hiding there! " + hunt.length + " bone" + (hunt.length === 1 ? "" : "s") + " still to find.", 3600);
      window.setTimeout(function () { ping.hidden = true; }, 3600);
    });

    // ---- it's the whole skeleton! ----
    function finish() {
      done = true;
      cv.style.pointerEvents = "none";
      cv.classList.add("fx-fade");
      if (weatherOff) weatherOff();
      const r = dig.getBoundingClientRect();
      if (F.sfx) F.sfx.win();
      if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 30 });
      play.say("You found every bone! It's a " + data.name + "!", 3600);
      window.setTimeout(function () {
        rock.classList.add("fx-lit");
        const live = document.createElement("div");
        live.className = "fx-live";
        live.innerHTML = F.dinoHTML(key, { state: "happy", color: ["green", "teal", "purple", "orange", "red"][ORDER.indexOf(key)] });
        dig.appendChild(live);
        if (F.sfx) (key === "trex" ? F.sfx.roar : F.sfx.chirp)();
        const cap = document.createElement("p");
        cap.className = "fx-cap"; cap.innerHTML = "<b>" + data.name + "</b> at the " + site.name + "<br>" + data.fact;
        board.appendChild(cap);
        F.pop && F.pop(cap);
      }, 1300);
      const all = gems.length;
      const stars = trs >= all ? 3 : trs >= Math.ceil(all / 2) ? 2 : 1;
      collect("digs", { site: site.id, dino: key, bones: pieces.length, treasures: trs, layers: layers, stars: stars });
      window.setTimeout(function () {
        play.finish("You brushed through " + layers + " layer" + (layers > 1 ? "s" : "") + " at the " + site.name + ", found all " + pieces.length + " bones and " + trs + " treasure" + (trs === 1 ? "" : "s") + "!", { stars: stars });
      }, 5400);
    }
  }

  /* drifting weather over the pit: inline spans, so no shared stylesheet is touched */
  function drift(site) {
    if (weatherOff) weatherOff();
    weatherOff = null;
    if (F.motionOK && !F.motionOK()) return;
    const box = document.createElement("div");
    box.className = "fx-weather";
    box.setAttribute("aria-hidden", "true");
    box.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:3";
    play.scene.appendChild(box);
    const anims = [];
    const drop = (play.scene.clientHeight || 320) + 40;
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span");
      s.textContent = site.drift[i % site.drift.length];
      s.style.cssText = "position:absolute;left:" + (Math.random() * 100).toFixed(1) + "%;top:-10%;font-size:" + (12 + Math.random() * 16).toFixed(0) + "px;opacity:" + (0.5 + Math.random() * 0.4).toFixed(2);
      box.appendChild(s);
      anims.push(s.animate([{ transform: "translateY(0) translateX(0) rotate(0deg)" }, { transform: "translateY(" + drop + "px) translateX(" + (Math.random() * 80 - 40).toFixed(0) + "px) rotate(320deg)" }],
        { duration: 5200 + Math.random() * 6000, delay: Math.random() * 3000, iterations: Infinity, easing: "linear" }));
    }
    weatherOff = function () { anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* already gone */ } }); box.remove(); };
  }

  showSites();
}
