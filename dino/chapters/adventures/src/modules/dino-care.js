/* Dino Care Clinic — a waiting room of dinosaur patients. Pick one, read its little health bars (clean, thirst, hunger,
 * warmth, rest, joy) and give just the right care: brush off the dust, a drink, a snack, a cool cloth, a flower garland,
 * a shady nap. Wrong tool? The dinosaur kindly says what it really needs. Every patient leaves with a health certificate. */
import { PREHISTORIC_CREATURES } from "./dino-discoveries.js?v=du-04c80678fe526be4";
import { createPlay, shuffle, dragPiece, collect, collection } from "../adv-kit.js?v=du-04c80678fe526be4";

const PATIENTS = [
  { sp: "trex", color: "green", name: "Rexy", fact: "T. rex had strong legs, tiny arms and a powerful bite." },
  { sp: "tricera", color: "teal", name: "Trixie", fact: "Triceratops had three face horns and a big bony frill." },
  { sp: "stego", color: "purple", name: "Spike", fact: "Stegosaurus had large plates on its back and spikes on its tail." },
  { sp: "bronto", color: "orange", name: "Bronte", fact: "Long-necked dinosaurs could reach leaves high in the trees." },
  { sp: "raptor", color: "red", name: "Zippy", fact: "Velociraptor was about the size of a turkey, and it had feathers." },
  { sp: "ptero", color: "blue", name: "Skye", fact: "Pteranodon was a flying reptile, not a dinosaur." },
  { sp: "tricera", color: "yellow", name: "Sunny", fact: "Triceratops probably lived in groups called herds." },
  { sp: "stego", color: "pink", name: "Rosie", fact: "Stegosaurus had a very small brain compared to its big body." }
];
const NEEDS = {
  brush: { icon: "🪥", tool: "Soft brush", meter: "Clean", ask: "I'm all dusty! Could I have a brush?", ok: "Sparkly clean!", sound: "sparkle" },
  water: { icon: "💧", tool: "Fresh water", meter: "Thirst", ask: "I'm so thirsty… a drink, please!", ok: "Gulp gulp, lovely!", sound: "splash" },
  fern: { icon: "🌿", tool: "Fern snack", meter: "Hunger", ask: "My tummy is rumbling. Something to eat?", ok: "Yum, crunchy ferns!", sound: "chomp" },
  cloth: { icon: "🧺", tool: "Cool cloth", meter: "Warmth", ask: "I feel a bit too warm. A cool cloth, please?", ok: "Ahh, so cool!", sound: "pop" },
  flowers: { icon: "🌼", tool: "Flower garland", meter: "Joy", ask: "I'm feeling a bit blue. Something cheerful?", ok: "I love my garland!", sound: "good" },
  shade: { icon: "🌳", tool: "Cosy shade", meter: "Rest", ask: "I'm sleepy… a shady place to rest?", ok: "Zzz… so cosy!", sound: "note" }
};
const ALL = Object.keys(NEEDS);

export function mountDinoCare(context) {
  const F = window.DUFX;
  const visible = Math.min(PATIENTS.length, 4 + Math.max(0, context.level - 1));
  const needCount = Math.min(6, 3 + Math.floor(Math.max(0, context.challenge) / 2));
  const play = createPlay(context, {
    emoji: "🧺", title: "Dino Care Clinic", theme: "meadow", buddy: false, wander: false,
    instruction: "Pick a patient, look at the little health bars, and give just the care it needs.", hint: "More dinosaur friends join the clinic as levels grow. Everyone gets gentle care.", allowed: 3
  });
  const board = play.board;
  let patient = null, meters = {}, busy = false, certs = collection("clinic").length;

  function waiting() {
    const list = PATIENTS.slice(0, visible);
    board.innerHTML = '<h3 class="cc-q">Who needs care today?</h3><div class="cc-room">' + list.map(function (p, i) {
      const needs = shuffle(ALL.slice()).slice(0, 2);
      p.preview = needs;
      return '<button type="button" class="cc-bench" data-i="' + i + '"><span class="cc-bubble">' + needs.map(function (n) { return NEEDS[n].icon; }).join(" ") + '</span><span class="cc-pd">' + F.dinoHTML(p.sp, { color: p.color, state: i % 2 ? "sad" : "idle", size: "100%" }) + "</span><b>" + p.name + "</b></button>";
    }).join("") + '</div><p class="cc-certs">📜 Health certificates earned: <b>' + certs + "</b></p>";
    board.querySelectorAll(".cc-bench").forEach(function (b, i) {
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(20px) scale(.7)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: i * 60, fill: "backwards" });
      b.addEventListener("click", function () { treat(list[Number(b.dataset.i)]); });
    });
    play.hint("More dinosaur friends join the clinic as levels grow. Everyone gets gentle care.", true);
  }

  function treat(p) {
    patient = p; busy = false;
    const sick = shuffle(ALL.slice()).slice(0, needCount);
    meters = {};
    ALL.forEach(function (k) { meters[k] = sick.indexOf(k) >= 0 ? 15 + Math.floor(Math.random() * 30) : 100; });
    board.innerHTML = '<div class="cc-bar" id="ccBars"></div><div class="cc-stage" id="ccStage"><div class="cc-pat" id="ccPat">' + F.dinoHTML(p.sp, { color: p.color, state: "sad", size: "100%" }) + '<div class="cc-dust"></div><span class="cc-garland" hidden>🌼🌸🌼🌸🌼</span><span class="cc-cool" hidden>🧺</span><span class="cc-zzz" hidden>💤</span></div><div class="cc-speech" id="ccSpeech"></div></div>' +
      '<div class="cc-tools" id="ccTools"></div>';
    const dust = board.querySelector(".cc-dust");
    if (meters.brush < 100) dust.innerHTML = Array.from({ length: 7 }, function () { return '<i style="left:' + (10 + Math.random() * 78).toFixed(0) + '%;top:' + (22 + Math.random() * 58).toFixed(0) + '%;--s:' + (0.8 + Math.random() * 0.9).toFixed(2) + '"></i>'; }).join("");
    const tools = board.querySelector("#ccTools");
    shuffle(ALL.slice()).forEach(function (k, i) {
      const n = NEEDS[k], b = document.createElement("button");
      b.type = "button"; b.className = "cc-tool"; b.dataset.k = k; b.innerHTML = "<span>" + n.icon + "</span><small>" + n.tool + "</small>";
      b.setAttribute("aria-label", n.tool);
      tools.appendChild(b);
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(20px) scale(.6)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: i * 50, fill: "backwards" });
      b.addEventListener("click", function () { useTool(k, b); });
      dragPiece(b, {
        ghost: function () { const g = document.createElement("div"); g.className = "hb-ghost"; g.textContent = n.icon; g.style.fontSize = "46px"; return g; },
        onDrop: function (x, y) { const r = board.querySelector("#ccPat").getBoundingClientRect(); if (x > r.left - 30 && x < r.right + 30 && y > r.top - 30 && y < r.bottom + 30) useTool(k, b); else play.hint("Drop it on the dinosaur, or just tap the tool!", true); }
      });
    });
    renderBars();
    const first = sick[0];
    say(p.name + ": \"" + NEEDS[first].ask + "\"");
    play.hint("Look at the bars: the low ones need care. Tap or drag the matching tool to " + p.name + ".", true);
    updateMood();
  }
  function say(t) { const s = board.querySelector("#ccSpeech"); if (s) { s.textContent = t; F.pop && F.pop(s); } }
  function renderBars() {
    board.querySelector("#ccBars").innerHTML = ALL.map(function (k) {
      const v = meters[k];
      return '<span class="cc-m' + (v >= 100 ? " full" : v < 50 ? " low" : "") + '"><i>' + NEEDS[k].icon + '</i><em><u style="width:' + v + '%"></u></em></span>';
    }).join("");
  }
  function updateMood() {
    const d = board.querySelector("#ccPat .du-dino");
    if (!d) return;
    const low = ALL.filter(function (k) { return meters[k] < 100; }).length;
    d.setAttribute("data-base", low === 0 ? "happy" : low <= 2 ? "idle" : "sad");
    F.dinoState(d, low === 0 ? "happy" : low <= 2 ? "idle" : "sad");
  }

  function useTool(k, btn) {
    if (busy) return;
    const n = NEEDS[k], pat = board.querySelector("#ccPat"), d = pat.querySelector(".du-dino");
    const r = pat.getBoundingClientRect();
    if (meters[k] >= 100) {
      const lowest = ALL.filter(function (x) { return meters[x] < 100; })[0];
      play.miss(btn, patient.name + " doesn't need the " + n.tool.toLowerCase() + " right now. " + (lowest ? "Look for a low bar: " + NEEDS[lowest].icon : ""));
      say(patient.name + ": \"I'm fine for " + n.meter.toLowerCase() + "! " + (lowest ? NEEDS[lowest].ask : "") + "\"");
      return;
    }
    busy = true;
    const go = F.flyTo ? F.flyTo(btn, { x: r.left + r.width * 0.62, y: r.top + r.height * 0.35 }, { emoji: n.icon, size: 40, burst: false, duration: 450 }) : Promise.resolve();
    go.then(function () {
      // each kind of care has its own little show
      if (k === "brush") { board.querySelectorAll(".cc-dust i").forEach(function (i, ix) { window.setTimeout(function () { i.classList.add("gone"); if (F.burst) { const rr = i.getBoundingClientRect(); F.burst(rr.left, rr.top, { kind: "sparkle", n: 4 }); } }, ix * 120); }); if (F.sfx) F.sfx.sparkle(); }
      if (k === "water") { if (F.burst) F.burst(r.left + r.width * 0.68, r.top + r.height * 0.4, { kind: "drops", n: 10 }); F.dinoState(d, "eat", 1100); }
      if (k === "fern") { F.dinoState(d, "eat", 1300); if (F.sfx) { F.sfx.chomp(); window.setTimeout(F.sfx.chomp, 300); } }
      if (k === "cloth") { pat.querySelector(".cc-cool").hidden = false; window.setTimeout(function () { pat.querySelector(".cc-cool").hidden = true; }, 1600); }
      if (k === "flowers") { pat.querySelector(".cc-garland").hidden = false; if (F.burst) F.burst(r.left + r.width * 0.6, r.top + r.height * 0.45, { kind: "hearts", n: 8 }); }
      if (k === "shade") { board.querySelector("#ccStage").classList.add("cc-shady"); pat.querySelector(".cc-zzz").hidden = false; F.dinoState(d, "sleep", 1800); window.setTimeout(function () { pat.querySelector(".cc-zzz").hidden = true; board.querySelector("#ccStage").classList.remove("cc-shady"); }, 1900); }
      if (F.sfx && !["brush", "fern"].includes(k)) F.sfx[n.sound](k === "shade" ? 4 : undefined);
      meters[k] = 100; renderBars();
      play.good({ x: r.left + r.width / 2, y: r.top + r.height * 0.3 }, { text: n.ok });
      say(patient.name + ": \"" + n.ok + "\"");
      window.setTimeout(function () {
        updateMood(); busy = false;
        const left = ALL.filter(function (x) { return meters[x] < 100; });
        if (!left.length) healthy(); else say(patient.name + ": \"" + NEEDS[left[0]].ask + "\"");
      }, 1400);
    });
  }

  function healthy() {
    busy = true;
    const d = board.querySelector("#ccPat .du-dino");
    F.dinoState(d, "happy", 99999);
    const stars = play.rating();
    collect("clinic", { name: patient.name, sp: patient.sp, color: patient.color, stars: stars });
    if (F.sfx) F.sfx.win();
    const r = board.getBoundingClientRect();
    if (F.burst) { F.burst(r.left + r.width / 2, r.top + 100, { kind: "hearts", n: 16 }); F.burst(r.left + r.width / 2, r.top + 100, { kind: "confetti", n: 30 }); }
    const cert = document.createElement("div");
    cert.className = "cc-cert";
    cert.innerHTML = '<b>📜 Health certificate</b><span>' + patient.name + " is happy, clean, fed and cosy!</span><small>" + "⭐".repeat(stars) + "</small><em>Fun fact: " + patient.fact + "</em>";
    board.appendChild(cert); F.pop && F.pop(cert);
    play.say(patient.name + " feels wonderful! 💚", 3000);
    window.setTimeout(function () { play.finish("You gave " + patient.name + " a lovely caring visit!", { stars: stars }); }, 3200);
  }

  waiting();
}
