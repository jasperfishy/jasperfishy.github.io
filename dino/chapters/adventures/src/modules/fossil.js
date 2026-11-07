/* Fossil Explorer — a real dig site. Brush the soil away with your finger or mouse (it is a scratch-off canvas),
 * find every bone, spot the hidden treasures, then watch the skeleton wake up as the dinosaur it belonged to. */
import { createPlay } from "../adv-kit.js?v=du-5ee3d40e60884152";

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
  const key = ORDER[(context.level - 1) % ORDER.length];
  const data = SPECIES[key];
  const play = createPlay(context, {
    emoji: "🦴", title: "Fossil explorer", theme: "dig", buddy: ["raptor", "tricera", "stego"][context.level % 3],
    instruction: "Brush the soil away to find every bone. Something might be hiding underneath!",
    hint: "Drag your finger across the soil like a brush. Stuck? Tap the magnifying glass.", allowed: 99
  });
  const board = play.board;
  board.innerHTML = '<div class="fx-tools"><button type="button" class="pk-btn on" data-tool="34" aria-label="Big brush">🖌️ Big</button>' +
    '<button type="button" class="pk-btn" data-tool="18" aria-label="Little brush">✏️ Little</button>' +
    '<button type="button" class="pk-btn" data-tool="blow" aria-label="Blow the dust away">💨 Blow</button>' +
    '<button type="button" class="pk-btn fx-lens" aria-label="Magnifying glass hint">🔍</button></div>' +
    '<div class="fx-dig"><svg class="fx-rock" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true"></svg><canvas class="fx-soil" aria-label="Soil to brush away"></canvas><div class="fx-treasures"></div><div class="fx-ping" hidden></div></div>' +
    '<div class="fx-shelf" aria-live="polite"><span class="fx-found"><b>0</b> of <i></i> bones</span><span class="fx-trs">Treasures: <b>0</b></span></div>';
  const dig = board.querySelector(".fx-dig"), rock = board.querySelector(".fx-rock"), cv = board.querySelector(".fx-soil"), tre = board.querySelector(".fx-treasures"), ping = board.querySelector(".fx-ping");
  // rock face + skeleton
  rock.innerHTML = '<defs><linearGradient id="fxr" x2="0" y2="1"><stop stop-color="#8e6a50"/><stop offset="1" stop-color="#5e4334"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#fxr)"/>' +
    '<path d="M0 60q90-20 180 6t180-10M0 130q100-26 200 4t160-8M0 200q80-18 170 4t190-10" stroke="rgba(0,0,0,.18)" stroke-width="3" fill="none"/>';
  const sk = skeleton(key);
  rock.appendChild(sk.g);
  const pieces = sk.pieces;
  // treasures hidden away from bones
  const nTreasure = Math.min(4, 2 + Math.floor(context.challenge / 3));
  const spots = [[40, 40], [320, 40], [60, 200], [320, 210], [180, 36], [110, 215], [300, 120], [24, 130]];
  const picks = spots.sort(() => Math.random() - 0.5).slice(0, nTreasure);
  const gems = picks.map(function (s, i) {
    const t = TREASURES[(context.level + i * 2) % TREASURES.length];
    const b = document.createElement("button");
    b.type = "button"; b.className = "fx-gem"; b.textContent = t[0]; b.disabled = true; b.setAttribute("aria-label", "Hidden treasure: " + t[1]);
    b.style.left = (s[0] / W * 100) + "%"; b.style.top = (s[1] / H * 100) + "%";
    tre.appendChild(b);
    return { b: b, pt: s, got: false, name: t[1] };
  });
  board.querySelector(".fx-found i").textContent = pieces.length;

  // ---- the soil ----
  const ctx = cv.getContext("2d");
  let cw = 0, ch = 0, dpr = 1;
  function paintSoil() {
    const r = dig.getBoundingClientRect();
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    cw = Math.round(r.width); ch = Math.round(r.height);
    cv.width = cw * dpr; cv.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    const gr = ctx.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, "#c9a070"); gr.addColorStop(1, "#a97d50");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, cw, ch);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const tones = ["#b88c5c", "#9b6f43", "#d2ab7c", "#8a6038", "#c39a68"];
    for (let i = 0; i < cw * ch / 90; i++) { ctx.fillStyle = tones[i % tones.length]; ctx.globalAlpha = rnd(.25, .7); ctx.beginPath(); ctx.arc(rnd(0, cw), rnd(0, ch), rnd(1, 4.2), 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 26; i++) { const x = rnd(0, cw), y = rnd(0, ch), rr = rnd(5, 13); const pg = ctx.createRadialGradient(x - rr * .3, y - rr * .3, 1, x, y, rr); pg.addColorStop(0, "#d9d2c4"); pg.addColorStop(1, "#8d8578"); ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * .75, rnd(0, 3), 0, 6.3); ctx.fill(); }
    ctx.strokeStyle = "rgba(90,58,30,.5)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) { ctx.beginPath(); let x = rnd(0, cw), y = rnd(0, ch); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rnd(-30, 30); y += rnd(-22, 22); ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  paintSoil();
  let tool = 34;
  board.querySelectorAll("[data-tool]").forEach(function (b) {
    b.addEventListener("click", function () { tool = b.dataset.tool === "blow" ? "blow" : Number(b.dataset.tool); board.querySelectorAll("[data-tool]").forEach(function (x) { x.classList.toggle("on", x === b); }); if (F.sfx) F.sfx.tap(); });
  });
  let down = false, lx = 0, ly = 0, lastDust = 0, lastCheck = 0, dirty = false;
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
    if (F.sfx && Math.random() < 0.5) F.sfx.tap();
  }
  cv.addEventListener("pointerdown", function (e) { down = true; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } const p = pos(e); lx = p[0]; ly = p[1]; erase(lx, ly, lx, ly); dust(e, tool === "blow" ? 8 : 3); if (tool === "blow" && F.sfx) F.sfx.whoosh(); check(); });
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
    pieces.forEach(function (p) {
      if (p.found) return;
      const n = p.pts.filter(function (q) { return cleared(q[0], q[1]); }).length;
      if (n / p.pts.length >= 0.6) {
        p.found = true; found += 1;
        board.querySelector(".fx-found b").textContent = found;
        board.querySelector(".fx-found").classList.add("pop"); window.setTimeout(function () { board.querySelector(".fx-found").classList.remove("pop"); }, 400);
        play.good({ x: r.left + p.c[0] / W * r.width, y: r.top + p.c[1] / H * r.height }, { text: found === pieces.length ? "Every bone!" : "Found the " + p.label + "!" });
        ping.hidden = true;
      }
    });
    gems.forEach(function (g) {
      if (g.got || !g.b.disabled) return;
      if (cleared(g.pt[0], g.pt[1])) { g.b.disabled = false; g.b.classList.add("show"); if (F.sfx) F.sfx.sparkle(); const rr = g.b.getBoundingClientRect(); if (F.burst) F.burst(rr.left + rr.width / 2, rr.top + rr.height / 2, { kind: "sparkle", n: 10 }); play.say("Ooh! Something is shining. Tap it! ✨"); }
    });
    if (found === pieces.length) finish();
  }
  gems.forEach(function (g) {
    g.b.addEventListener("click", function () {
      if (g.got) return;
      g.got = true; trs += 1;
      board.querySelector(".fx-trs b").textContent = trs;
      g.b.classList.add("got");
      const to = board.querySelector(".fx-trs");
      if (F.flyTo) F.flyTo(g.b, to, { emoji: g.b.textContent, size: 34, kind: "stars" });
      if (F.sfx) F.sfx.star();
      play.say("You found " + g.name + "! 🌟");
      window.setTimeout(function () { g.b.style.visibility = "hidden"; }, 100);
    });
  });
  board.querySelector(".fx-lens").addEventListener("click", function () {
    const left = pieces.filter(function (p) { return !p.found; });
    if (!left.length || done) return;
    const p = left[0];
    const r = dig.getBoundingClientRect();
    ping.hidden = false;
    ping.style.left = (p.c[0] / W * 100) + "%"; ping.style.top = (p.c[1] / H * 100) + "%";
    ping.classList.remove("on"); void ping.offsetWidth; ping.classList.add("on");
    if (F.sfx) F.sfx.sparkle();
    play.say("Try brushing near the glow — a " + p.label + " is hiding there!", 3200);
    window.setTimeout(function () { ping.hidden = true; }, 3600);
  });

  // ---- it's the whole skeleton! ----
  function finish() {
    done = true;
    cv.style.pointerEvents = "none";
    cv.classList.add("fx-fade");
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
      cap.className = "fx-cap"; cap.innerHTML = "<b>" + data.name + "</b><br>" + data.fact;
      board.appendChild(cap);
      F.pop && F.pop(cap);
    }, 1300);
    const stars = trs >= gems.length ? 3 : trs >= Math.ceil(gems.length / 2) ? 2 : 1;
    window.setTimeout(function () { play.finish("You uncovered a whole " + data.name + " fossil!", { stars: stars }); }, 5200);
  }
}
