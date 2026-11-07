/* Build a Dinosaur — the dino workshop. Every dinosaur is built in four stages:
 *   1. Bones   — assemble the skeleton on its ghost outline (bones snap into place)
 *   2. Skin    — the real animated dinosaur is taken apart; fit every part back (some pieces start turned the wrong way,
 *                and cheeky spare parts from other creatures are kindly refused). Bigger games mix a head from another species!
 *   3. Style   — pick a colour and something to wear
 *   4. Name    — name card, then the dinosaur wakes up in a living diorama and joins the museum (saved on this device)
 * A Hint button glows the next place; everything snaps with a sound and a sparkle. */
import { createPlay, shuffle, collect, collection } from "../adv-kit.js?v=du-2b5bf1340085b709";
import { skeleton } from "./fossil.js?v=du-2b5bf1340085b709";

const SVGNS = "http://www.w3.org/2000/svg";
const ORDER = ["trex", "tricera", "stego", "bronto", "raptor", "ptero"];
const NAMES = { trex: "Tyrannosaurus", tricera: "Triceratops", stego: "Stegosaurus", bronto: "Brontosaurus", raptor: "Velociraptor", ptero: "Pteranodon" };
const SHORT = { trex: "Rex", tricera: "Tricera", stego: "Stego", bronto: "Bronto", raptor: "Raptor", ptero: "Ptero" };
const KIND_LABEL = { tail: "tail", leg: "leg", head: "head", spikes: "spikes", plates: "back plates", arm: "little arm", wing: "wing" };
const COLORS = [["green", "#91d09c"], ["teal", "#7fd1c7"], ["blue", "#8cc3ee"], ["purple", "#b9a1e6"], ["pink", "#f5a9c4"], ["red", "#ee8a7c"], ["orange", "#f6b273"], ["yellow", "#f3d56b"]];
const HATS = ["", "👑", "🎩", "🎀", "😎", "🌸", "⭐", "🎈", "🧢", "🎓"];
const FIRST = ["Pip", "Dot", "Bean", "Pebble", "Sprout", "Mochi", "Nibbles", "Twig", "Biscuit", "Peanut", "Fern", "Button", "Rumble", "Zig", "Sunny", "Bubbles", "Mango", "Cookie"];

function kindOf(node) {
  const c = node.getAttribute("class") || "";
  if (c.indexOf("d-tail") >= 0) return "tail";
  if (c.indexOf("d-leg") >= 0) return "leg";
  if (c.indexOf("d-head") >= 0) return "head";
  if (c.indexOf("d-spikes") >= 0) return "spikes";
  if (c.indexOf("d-plate") >= 0) return "plates";
  if (c.indexOf("d-arm") >= 0) return "arm";
  if (c.indexOf("d-wing") >= 0) return "wing";
  if (node.querySelector && node.querySelector(":scope > .d-head")) return "head";   // a head swapped from another species
  return null;
}
function stripClasses(node) {
  node.removeAttribute("class"); node.removeAttribute("style");
  node.querySelectorAll("*").forEach(function (n) { n.removeAttribute("class"); n.removeAttribute("style"); });
  return node;
}
function dinoTitle(sp, head) { return head && head !== sp ? SHORT[head] + "-" + NAMES[sp].toLowerCase() : NAMES[sp]; }

export function openMuseum(F, parent) {
  const list = collection("museum");
  const o = document.createElement("div");
  o.className = "bd-museum";
  o.innerHTML = '<div class="bd-museum-card"><button type="button" class="dialog-close" aria-label="Close">×</button><h2>🏛️ My dinosaur museum</h2>' +
    '<p>' + (list.length ? list.length + " dinosaur" + (list.length === 1 ? "" : "s") + " built. Every one you build gets a place here!" : "Build your first dinosaur and it will live here!") + '</p><div class="bd-museum-grid">' +
    list.slice().reverse().map(function (d) {
      return '<figure class="bd-exhibit"><div class="bd-ex-art">' + F.dinoHTML(d.species, { color: d.color, head: d.head && d.head !== d.species ? d.head : undefined, headColor: d.color, size: "100%" }) + (d.hat ? '<span class="bd-ex-hat">' + d.hat + "</span>" : "") + '</div><figcaption><b>' + d.name + '</b><small>' + dinoTitle(d.species, d.head) + '</small><span>' + "⭐".repeat(d.stars || 3) + "</span></figcaption></figure>";
    }).join("") + (list.length ? "" : '<div class="bd-empty">🥚 Nothing here yet</div>') + "</div></div>";
  (parent || document.body).appendChild(o);
  o.addEventListener("click", function (e) { if (e.target === o || e.target.closest(".dialog-close")) o.remove(); });
  F.sfx && F.sfx.pop();
}

export function mountBuilder(context) {
  const F = window.DUFX;
  const idx = (context.level - 1) % ORDER.length;
  const species = ORDER[idx];
  const mixHead = context.challenge >= 3 && context.level % 2 === 0 ? shuffle(ORDER.filter(function (s) { return s !== species && s !== "ptero" && species !== "ptero"; }))[0] : null;
  const hasSkeleton = species !== "ptero" && !mixHead;
  const rotating = context.challenge >= 3;
  const decoyCount = context.challenge >= 5 ? 2 : context.challenge >= 3 ? 1 : 0;
  const play = createPlay(context, {
    emoji: "🦖", title: "Dino workshop", theme: "meadow", buddy: ORDER[(idx + 2) % ORDER.length],
    instruction: "Build a " + dinoTitle(species, mixHead) + " in four steps: bones, skin, style and a name!", hint: "", allowed: 3
  });
  const board = play.board;
  let color = ["green", "teal", "purple", "orange", "red", "blue"][idx];
  let hat = "";
  board.innerHTML = '<div class="bd-top"><ol class="bd-steps"><li data-s="0">1 Bones</li><li data-s="1">2 Skin</li><li data-s="2">3 Style</li><li data-s="3">4 Name</li></ol>' +
    '<button type="button" class="pk-btn bd-mini" id="bdHint">💡 Hint</button><button type="button" class="pk-btn bd-mini" id="bdMuseum">🏛️ Museum <b>' + collection("museum").length + '</b></button></div>' +
    '<div class="bd-wrap"><div class="bd-dino" id="bdDino"></div></div><div class="bd-tray" id="bdTray" aria-label="Parts"></div><div class="bd-dress" id="bdDress" hidden></div>';
  const stepEls = board.querySelectorAll(".bd-steps li");
  const dinoHost = board.querySelector("#bdDino"), tray = board.querySelector("#bdTray"), dress = board.querySelector("#bdDress"), hintBtn = board.querySelector("#bdHint");
  board.querySelector("#bdMuseum").addEventListener("click", function () { openMuseum(F); });
  function setStep(n) { stepEls.forEach(function (li, i) { li.classList.toggle("on", i === n); li.classList.toggle("done", i < n); }); }
  let currentAssembly = null;
  hintBtn.addEventListener("click", function () { if (currentAssembly) currentAssembly.hint(); });

  /* ---------------------------------------------------------------- generic assembly */
  function assemble(cfg) {
    const svg = cfg.svg, parts = cfg.parts;
    parts.forEach(function (p, i) {
      p.filled = false; p.id = i;
      const parent = p.nodes[0].parentNode;
      p.ghost = document.createElementNS(SVGNS, "g");
      p.ghost.setAttribute("class", "bd-ghost " + (cfg.ghostClass || ""));
      p.nodes.forEach(function (n) { p.ghost.appendChild(stripClasses(n.cloneNode(true))); });
      parent.insertBefore(p.ghost, p.nodes[0]);
      p.nodes.forEach(function (n) { n.style.visibility = "hidden"; });
    });
    tray.hidden = false; tray.innerHTML = "";
    const vbW = svg.viewBox.baseVal.width || 240;
    const scale = function () { return svg.getBoundingClientRect().width / vbW; };
    function pieceSVG(nodes) {
      const g = document.createElementNS(SVGNS, "g");
      nodes.forEach(function (n) { g.appendChild(stripClasses(n.cloneNode(true))); });
      const probe = document.createElementNS(SVGNS, "svg");
      probe.style.cssText = "position:absolute;visibility:hidden;width:10px;height:10px"; probe.appendChild(g);
      document.body.appendChild(probe);
      const b = g.getBBox(); probe.remove();
      const holder = document.createElementNS(SVGNS, "svg");
      holder.setAttribute("viewBox", [b.x - 3, b.y - 3, b.width + 6, b.height + 6].join(" "));
      holder.appendChild(g); holder.setAttribute("class", "bd-pc-svg");
      holder.dataset.w = String(b.width + 6);
      return holder;
    }
    const pieces = parts.map(function (p) { return { kind: p.kind, label: p.label || KIND_LABEL[p.kind] || p.kind, svg: pieceSVG(p.nodes), decoy: false, rot: 0 }; });
    (cfg.spare || []).forEach(function (s) { pieces.push({ kind: "decoy", label: "spare part", svg: s.svg, decoy: true, from: s.from, rot: 0 }); });
    const k = Math.max(0.5, scale());
    let placed = 0; const total = parts.length;
    let selected = null, drag = null, suppress = false;
    shuffle(pieces).forEach(function (pc, i) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "bd-piece" + (pc.decoy ? " bd-spare" : "") + (cfg.tileClass ? " " + cfg.tileClass : "");
      b.setAttribute("aria-label", pc.decoy ? "A spare part" : "Pick up the " + pc.label);
      b.appendChild(pc.svg); tray.appendChild(b); pc.btn = b;
      pc.svg.style.width = Math.max(50, Math.min(116, +pc.svg.dataset.w * k * 0.85)) + "px";
      if (cfg.rotate && !pc.decoy) { pc.rot = [90, 180, 270][Math.floor(Math.random() * 3)]; }
      pc.svg.style.transform = "rotate(" + pc.rot + "deg)";
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(24px) scale(.6)" }, { opacity: 1, transform: "none" }], { duration: 460, delay: i * 70, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "backwards" });
    });
    function glow(kind, on) { parts.forEach(function (p) { p.ghost.classList.toggle("bd-glow", on && !p.filled && p.kind === kind); }); }
    function select(pc) {
      pieces.forEach(function (x) { if (x.btn) x.btn.classList.remove("sel", "bd-hinted"); });
      selected = pc;
      if (pc) { pc.btn.classList.add("sel"); glow(pc.kind, true); } else glow("", false);
    }
    function slotAt(x, y) {
      let best = null, bd = 1e9;
      parts.forEach(function (p) {
        if (p.filled) return;
        const r = p.ghost.getBoundingClientRect(), pad = 26;
        if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) return;
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < bd) { bd = d; best = p; }
      });
      return best;
    }
    function snap(pc, slot, fromX, fromY) {
      slot.filled = true; pc.placed = true; placed += 1;
      pc.btn.classList.add("bd-used"); pc.btn.disabled = true;
      const r = slot.ghost.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const fly = document.createElement("div");
      fly.className = "pk-drag bd-fly";
      const clone = pc.svg.cloneNode(true); clone.style.transform = ""; clone.style.width = Math.max(40, r.width) + "px"; clone.style.height = "auto";
      fly.appendChild(clone); document.body.appendChild(fly);
      const reveal = function () {
        fly.remove();
        slot.nodes.forEach(function (n) { n.style.visibility = ""; if (F.anim) F.anim(n, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 }); });
        slot.ghost.remove();
        if (F.sfx) { F.sfx.thud(); window.setTimeout(F.sfx.good, 70); }
        if (F.burst) F.burst(cx, cy, { kind: "sparkle", n: 14 });
        play.good({ x: cx, y: cy }, { text: placed === total ? "All together!" : null });
        select(null);
        if (placed === total) window.setTimeout(cfg.done, 700);
      };
      if (fly.animate && F.motionOK && F.motionOK()) {
        const a = fly.animate([{ left: fromX + "px", top: fromY + "px", transform: "translate(-50%,-55%) scale(1.12) rotate(-3deg)" }, { left: cx + "px", top: cy + "px", transform: "translate(-50%,-50%) scale(1.18)", offset: .8 }, { left: cx + "px", top: cy + "px", transform: "translate(-50%,-50%) scale(1)" }], { duration: 300, easing: "cubic-bezier(.3,1.3,.5,1)" });
        a.onfinish = reveal;
      } else reveal();
    }
    function tryPlace(pc, slot, x, y) {
      if (!pc || !slot) return;
      if (pc.decoy) {
        play.miss(pc.btn, "That spare part belongs to a " + (pc.from || "different dinosaur") + "! Let's put it back.");
        pc.btn.classList.add("bd-away"); window.setTimeout(function () { pc.btn.remove(); }, 450);
        pieces.splice(pieces.indexOf(pc), 1); select(null); return;
      }
      if (slot.kind !== pc.kind) { play.miss(pc.btn, "That's the " + pc.label + ". Look for its own shadow shape!"); select(pc); return; }
      if (pc.rot % 360 !== 0) { play.say("Turn it the right way up first: tap the piece to spin it! 🔄", 3000); if (F.shake) F.shake(pc.btn); select(pc); return; }
      snap(pc, slot, x, y);
    }
    pieces.forEach(function (pc) {
      const btn = pc.btn;
      btn.addEventListener("click", function () {
        if (suppress) return;
        if (pc.rot % 360 !== 0) {
          pc.rot += 90; pc.svg.style.transition = "transform .25s cubic-bezier(.3,1.5,.5,1)"; pc.svg.style.transform = "rotate(" + pc.rot + "deg)";
          if (F.sfx) F.sfx.pop();
          if (pc.rot % 360 === 0) play.say("Right way up! Now drop it on its shadow. 👍", 2200);
          select(pc); return;
        }
        select(selected === pc ? null : pc);
        if (selected) play.hint("Now tap or drop it on the glowing shadow.");
      });
      btn.style.touchAction = "none";
      btn.addEventListener("pointerdown", function (e) { if (btn.disabled || e.button > 0) return; drag = { pc: pc, sx: e.clientX, sy: e.clientY, ghost: null }; try { btn.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } });
      btn.addEventListener("pointermove", function (e) {
        if (!drag || drag.pc !== pc) return;
        if (!drag.ghost) {
          if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) return;
          const g = btn.cloneNode(true); g.className = "pk-drag bd-dragging"; g.removeAttribute("aria-label");
          const sv = g.querySelector("svg"); sv.style.width = Math.max(pc.svg.getBoundingClientRect().width, 70) + "px";
          document.body.appendChild(g); drag.ghost = g; btn.classList.add("dragging"); glow(pc.kind, true);
          if (F.sfx) F.sfx.tap();
        }
        drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px";
      });
      function end(e) {
        if (!drag || drag.pc !== pc) return;
        const d = drag; drag = null;
        if (!d.ghost) return;
        suppress = true; window.setTimeout(function () { suppress = false; }, 90);
        d.ghost.remove(); btn.classList.remove("dragging");
        const slot = slotAt(e.clientX, e.clientY);
        if (slot) tryPlace(pc, slot, e.clientX, e.clientY);
        else { glow("", false); play.hint("Nearly! Drop the part right on its shadow."); if (F.shake) F.shake(btn); }
      }
      btn.addEventListener("pointerup", end); btn.addEventListener("pointercancel", end);
    });
    svg.addEventListener("click", function (e) {
      if (!selected) return;
      const slot = slotAt(e.clientX, e.clientY);
      const r = selected.btn.getBoundingClientRect();
      if (slot) tryPlace(selected, slot, r.left + r.width / 2, r.top + r.height / 2);
      else { play.hint("Tap the shadow that glows."); if (F.shake) F.shake(selected.btn); }
    });
    currentAssembly = {
      hint: function () {
        const slot = parts.find(function (p) { return !p.filled; });
        if (!slot) return;
        const pc = pieces.find(function (p) { return !p.decoy && !p.placed && p.kind === slot.kind; });
        if (pc) pc.btn.classList.add("bd-hinted");
        slot.ghost.classList.add("bd-glow"); window.setTimeout(function () { slot.ghost.classList.remove("bd-glow"); if (pc) pc.btn.classList.remove("bd-hinted"); }, 3000);
        if (F.sfx) F.sfx.sparkle();
        play.say("Look for the " + (pc ? pc.label : slot.kind) + " — its shadow is glowing! ✨", 3000);
      }
    };
  }

  /* ---------------------------------------------------------------- stage 1: bones */
  function stageBones() {
    setStep(0);
    const sk = skeleton(species);
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 360 240"); svg.setAttribute("class", "bd-sk-svg");
    svg.innerHTML = '<defs><linearGradient id="bdr" x2="0" y2="1"><stop stop-color="#8e6a50"/><stop offset="1" stop-color="#5e4334"/></linearGradient></defs><rect width="360" height="240" rx="18" fill="url(#bdr)"/><path d="M0 70q90-20 180 6t180-10M0 150q100-26 200 4t160-8M0 210q80-18 170 4t190-10" stroke="rgba(0,0,0,.2)" stroke-width="3" fill="none"/>';
    svg.appendChild(sk.g);
    dinoHost.innerHTML = ""; dinoHost.classList.add("bd-bones"); dinoHost.appendChild(svg);
    play.hint("Step 1: put the " + NAMES[species] + "'s bones back together. Drag each bone to its glowing shadow.", true);
    play.say("Let's find the skeleton first! 🦴", 2600);
    const parts = sk.pieces.map(function (p) { return { kind: p.label, label: p.label, nodes: [p.node] }; });
    assemble({ svg: svg, parts: parts, ghostClass: "light", tileClass: "bone", rotate: rotating && context.challenge >= 4, done: function () {
      F.sfx && F.sfx.win();
      const r = dinoHost.getBoundingClientRect(); F.burst && F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 24 });
      play.say("A whole skeleton! Now let's give it skin… ✨", 2600);
      window.setTimeout(stageSkin, 1500);
    } });
  }

  /* ---------------------------------------------------------------- stage 2: skin */
  function stageSkin() {
    setStep(1);
    dinoHost.classList.remove("bd-bones");
    dinoHost.innerHTML = F.dinoHTML(species, { color: color, state: "idle", head: mixHead || undefined, headColor: mixHead ? ["pink", "yellow", "blue", "orange"][context.level % 4] : undefined });
    const flash = document.createElement("div"); flash.className = "bd-flash"; dinoHost.appendChild(flash);
    window.setTimeout(function () { flash.remove(); }, 600);
    const svg = dinoHost.querySelector("svg"), all = svg.querySelector(".d-all");
    const parts = [], plateGroup = [];
    Array.prototype.slice.call(all.children).forEach(function (node) {
      const kind = kindOf(node);
      if (!kind) return;
      if (kind === "plates") { plateGroup.push(node); return; }
      parts.push({ nodes: [node], kind: kind });
    });
    if (plateGroup.length) parts.push({ nodes: plateGroup, kind: "plates" });
    const spare = [];
    const others = ORDER.filter(function (s) { return s !== species && s !== mixHead; });
    for (let i = 0; i < decoyCount; i++) {
      const other = others[(context.level + i * 2) % others.length];
      const host = document.createElement("div");
      host.innerHTML = F.dinoHTML(other, { color: "pink" }); host.style.cssText = "position:absolute;left:-999px;top:0;width:240px";
      document.body.appendChild(host);
      const found = Array.prototype.slice.call(host.querySelector(".d-all").children).filter(function (n) { const kk = kindOf(n); return kk === "head" || kk === "wing" || kk === "plates" || kk === "spikes"; });
      if (found[0]) {
        const g = document.createElementNS(SVGNS, "g"); g.appendChild(stripClasses(found[0].cloneNode(true)));
        const probe = document.createElementNS(SVGNS, "svg"); probe.style.cssText = "position:absolute;visibility:hidden;width:10px;height:10px"; probe.appendChild(g); document.body.appendChild(probe);
        const b = g.getBBox(); probe.remove();
        const holder = document.createElementNS(SVGNS, "svg"); holder.setAttribute("viewBox", [b.x - 3, b.y - 3, b.width + 6, b.height + 6].join(" ")); holder.appendChild(g); holder.setAttribute("class", "bd-pc-svg"); holder.dataset.w = String(b.width + 6);
        spare.push({ svg: holder, from: NAMES[other] });
      }
      host.remove();
    }
    play.hint(mixHead ? "Step 2: a mix-and-match! This dinosaur has a " + SHORT[mixHead] + " head. Fit every part onto its shadow." : "Step 2: give it skin! Fit each part onto its shadow.", true);
    play.say(mixHead ? "Wow, a mix-and-match dinosaur! 🤩" : "Now the skin! Pick up a part. 🦖", 2800);
    assemble({ svg: svg, parts: parts, spare: spare, rotate: rotating, done: wake });
  }

  /* ---------------------------------------------------------------- stage 3: style */
  function wake() {
    setStep(2);
    tray.hidden = true;
    const d = dinoHost.querySelector(".du-dino");
    play.say("It's alive! " + dinoTitle(species, mixHead) + " says hello!", 3000);
    if (F.sfx) (species === "trex" ? F.sfx.roar : F.sfx.chirp)();
    F.dinoState(d, species === "trex" ? "roar" : "happy", 1400);
    const r = dinoHost.getBoundingClientRect();
    F.burst && F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 26 });
    if (F.shakeScreen && species === "trex") F.shakeScreen(4);
    window.setTimeout(function () { F.dinoState(d, "happy", 900000); }, 1500);
    play.hint("Step 3: make it yours! Pick a colour and something to wear.", true);
    dress.hidden = false;
    dress.innerHTML = '<div class="bd-row" role="group" aria-label="Colour">' + COLORS.map(function (c) { return '<button type="button" class="bd-sw' + (c[0] === color ? " on" : "") + '" data-color="' + c[0] + '" style="background:' + c[1] + '" aria-label="' + c[0] + '"></button>'; }).join("") + '</div>' +
      '<div class="bd-row" role="group" aria-label="Dress up">' + HATS.map(function (h) { return '<button type="button" class="pk-btn bd-hat" data-hat="' + h + '" aria-label="' + (h ? "Wear " + h : "Wear nothing") + '">' + (h || "∅") + '</button>'; }).join("") + '</div>' +
      '<button type="button" class="pk-btn bd-done">Next: name card ➜</button>';
    F.pop && F.pop(dress);
    function repaint() {
      const state = dinoHost.querySelector(".du-dino").getAttribute("data-state");
      dinoHost.innerHTML = F.dinoHTML(species, { color: color, state: state || "happy", head: mixHead || undefined, headColor: mixHead ? ["pink", "yellow", "blue", "orange"][context.level % 4] : undefined });
      if (hat) putHat();
    }
    function putHat() {
      const headNode = dinoHost.querySelector(".d-head");
      const bb = headNode.getBBox();
      const t = document.createElementNS(SVGNS, "text");
      t.setAttribute("class", "bd-hat-on"); t.setAttribute("x", String(bb.x + bb.width * (species === "ptero" ? 0.7 : 0.52))); t.setAttribute("y", String(bb.y + 14));
      t.setAttribute("font-size", "40"); t.setAttribute("text-anchor", "middle"); t.textContent = hat;
      headNode.appendChild(t);
    }
    dress.querySelectorAll("[data-color]").forEach(function (b) {
      b.addEventListener("click", function () {
        color = b.dataset.color; dress.querySelectorAll("[data-color]").forEach(function (x) { x.classList.toggle("on", x === b); });
        repaint(); F.sfx && F.sfx.sparkle();
        const r2 = dinoHost.getBoundingClientRect(); F.burst && F.burst(r2.left + r2.width / 2, r2.top + r2.height / 2, { kind: "sparkle", n: 14 });
      });
    });
    dress.querySelectorAll("[data-hat]").forEach(function (b) {
      b.addEventListener("click", function () {
        hat = b.dataset.hat; repaint(); F.sfx && F.sfx.pop();
        dress.querySelectorAll("[data-hat]").forEach(function (x) { x.classList.toggle("on", x === b); });
        const r2 = dinoHost.getBoundingClientRect(); F.burst && F.burst(r2.left + r2.width / 2, r2.top + r2.height * 0.2, { kind: "hearts", n: 6 });
      });
    });
    dress.querySelector(".bd-done").addEventListener("click", stageName);
  }

  /* ---------------------------------------------------------------- stage 4: name card + diorama */
  function stageName() {
    setStep(3);
    dress.innerHTML = '<p class="bd-q">What is your dinosaur called?</p><div class="bd-row bd-names"></div>';
    play.hint("Step 4: choose a name for your " + dinoTitle(species, mixHead) + ".", true);
    shuffle(FIRST).slice(0, 4).forEach(function (nm) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pk-btn bd-name"; b.textContent = nm;
      dress.querySelector(".bd-names").appendChild(b);
      b.addEventListener("click", function () { named(nm); });
    });
  }
  function named(nm) {
    dress.hidden = true;
    const stars = play.rating();
    collect("museum", { species: species, head: mixHead || species, color: color, hat: hat, name: nm, stars: stars });
    board.querySelector("#bdMuseum b").textContent = collection("museum").length;
    board.querySelector(".bd-steps").classList.add("all");
    const wrap = board.querySelector(".bd-wrap");
    const card = document.createElement("div");
    card.className = "bd-card";
    card.innerHTML = '<span class="bd-card-stars">' + "⭐".repeat(stars) + "☆".repeat(3 - stars) + '</span><b>' + nm + '</b><small>' + dinoTitle(species, mixHead) + (hat ? " · wearing " + hat : "") + '</small>';
    wrap.appendChild(card);
    F.pop && F.pop(card);
    F.sfx && F.sfx.win();
    const r = dinoHost.getBoundingClientRect();
    if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "confetti", n: 40 }); F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "hearts", n: 10 }); }
    play.say(nm + " is now in your museum! 🏛️", 3500);
    play.hint("Tap " + nm + " to hear it roar!", true);
    wrap.classList.add("bd-diorama");
    dinoHost.classList.add("bd-walker");
    const d = dinoHost.querySelector(".du-dino");
    d.setAttribute("data-base", "idle");
    dinoHost.addEventListener("pointerdown", function () {
      F.dinoState(d, species === "trex" ? "roar" : "happy", 1000); if (F.sfx) (species === "trex" ? F.sfx.roar : F.sfx.chirp)();
      const rr = dinoHost.getBoundingClientRect(); F.burst && F.burst(rr.left + rr.width * 0.6, rr.top + rr.height * 0.3, { kind: "hearts", n: 6 });
    });
    let pos = 0, running = true;
    function stroll() {
      if (!running || !dinoHost.isConnected) return;
      const room = Math.max(0, wrap.clientWidth - dinoHost.clientWidth) / 2 - 8;
      const to = (Math.random() * 2 - 1) * room;
      const dist = Math.abs(to - pos);
      if (dist < 30 || !dinoHost.animate || (F.motionOK && !F.motionOK())) { window.setTimeout(stroll, 1200); return; }
      const dir = to > pos ? 1 : -1;
      d.style.transform = "scaleX(" + dir + ")"; F.dinoState(d, "walk");
      const a = dinoHost.animate([{ translate: pos + "px 0" }, { translate: to + "px 0" }], { duration: dist * 14, easing: "ease-in-out", fill: "forwards" });
      a.onfinish = function () { pos = to; F.dinoState(d, Math.random() < 0.4 ? "happy" : "idle", 1500); window.setTimeout(stroll, 1600 + Math.random() * 1600); };
    }
    window.setTimeout(stroll, 1500);
    const leaves = window.setInterval(function () { if (!board.isConnected) { window.clearInterval(leaves); running = false; return; } const rr = wrap.getBoundingClientRect(); F.burst && F.burst(rr.left + Math.random() * rr.width, rr.top, { kind: "leaves", n: 2, scale: 0.8 }); }, 2600);
    const fin = document.createElement("button");
    fin.type = "button"; fin.className = "pk-btn bd-done"; fin.textContent = "Done! 🎉";
    board.appendChild(fin);
    fin.addEventListener("click", function () { fin.disabled = true; running = false; window.clearInterval(leaves); play.finish("Your " + dinoTitle(species, mixHead) + " " + nm + " is all put together!", { stars: stars }); });
  }

  if (hasSkeleton) stageBones(); else stageSkin();
}
