/* Dino Care Clinic — a waiting room of dinosaur patients. Pick one, read its little health bars (clean, thirst, hunger,
 * warmth, joy, rest, fresh, ochie, song) and give just the right care. Busy clinic days bring two patients in a row,
 * every care kind has its own sound and its own little show, a free hint points at the lowest bar, the clinic window
 * shows the weather outside, and a get-well flower garden blooms behind the desk while you work. Wrong tool? The
 * dinosaur kindly says what it really needs. */
import { PREHISTORIC_CREATURES } from "./dino-discoveries.js";
import { createPlay, shuffle, dragPiece, collect, collection } from "../adv-kit.js";

const PATIENTS = [
  { sp: "trex", color: "green", name: "Rexy", fact: "T. rex had strong legs, tiny arms and a powerful bite." },
  { sp: "tricera", color: "teal", name: "Trixie", fact: "Triceratops had three face horns and a big bony frill." },
  { sp: "stego", color: "purple", name: "Spike", fact: "Stegosaurus had large plates on its back and spikes on its tail." },
  { sp: "bronto", color: "orange", name: "Bronte", fact: "Long-necked dinosaurs could reach leaves high in the trees." },
  { sp: "raptor", color: "red", name: "Zippy", fact: "Velociraptor was about the size of a turkey, and it had feathers." },
  { sp: "ptero", color: "blue", name: "Skye", fact: "Pteranodon was a flying reptile, not a dinosaur." },
  { sp: "tricera", color: "yellow", name: "Sunny", fact: "Triceratops probably lived in groups called herds." },
  { sp: "stego", color: "pink", name: "Rosie", fact: "Stegosaurus had a very small brain compared to its big body." },
  { sp: "bronto", color: "teal", name: "Berry", fact: "Some long-necked dinosaurs swallowed stones to help them digest." },
  { sp: "raptor", color: "purple", name: "Pip", fact: "Raptor claws were curved and used for catching food." },
  { sp: "ptero", color: "orange", name: "Cloudy", fact: "Pterosaurs had hollow bones, which made flying easier." },
  { sp: "trex", color: "orange", name: "Grandpa Rex", fact: "Some of the biggest T. rex bones are longer than a car." }
];
const NEEDS = {
  brush: { icon: "🪥", tool: "Soft brush", meter: "Clean", ask: "I'm all dusty! Could I have a brush?", ok: "Sparkly clean!", sound: "sparkle" },
  water: { icon: "💧", tool: "Fresh water", meter: "Thirst", ask: "I'm so thirsty… a drink, please!", ok: "Gulp gulp, lovely!", sound: "splash" },
  fern: { icon: "🌿", tool: "Fern snack", meter: "Hunger", ask: "My tummy is rumbling. Something to eat?", ok: "Yum, crunchy ferns!", sound: "chomp" },
  cloth: { icon: "🧺", tool: "Cool cloth", meter: "Warmth", ask: "I feel a bit too warm. A cool cloth, please?", ok: "Ahh, so cool!", sound: "pop" },
  flowers: { icon: "🌼", tool: "Flower garland", meter: "Joy", ask: "I'm feeling a bit blue. Something cheerful?", ok: "I love my garland!", sound: "good" },
  shade: { icon: "🌳", tool: "Cosy shade", meter: "Rest", ask: "I'm sleepy… a shady place to rest?", ok: "Zzz… so cosy!", sound: "note" },
  bath: { icon: "🫧", tool: "Bubble bath", meter: "Fresh", ask: "There's sticky fern all over me! Bubbles, please?", ok: "Squeaky fresh!", sound: "splash" },
  plaster: { icon: "🩹", tool: "Little plaster", meter: "Ochie", ask: "My leg is a poorly bit. Something to cover it?", ok: "All better, thank you!", sound: "boing" },
  song: { icon: "🎵", tool: "Cheerful song", meter: "Song", ask: "I'd like to sing but I've lost the tune!", ok: "La la! What a voice!", sound: "note" }
};
const ALL = Object.keys(NEEDS);
const FLOWERS = ["🌼", "🌸", "🌷", "🌻", "🌺", "💐", "🍀"];
/* the view from the clinic window changes with the round, and the scene theme with it */
const SKIES = [
  { icon: "☀️", name: "a sunny morning", theme: "meadow", sk: ["#a8def2", "#eaf8dc"], clouds: 2, note: "Sunshine pours through the clinic windows!" },
  { icon: "🌤️", name: "a breezy midday", theme: "sky", sk: ["#9fd6ef", "#f2fae6"], clouds: 3, note: "Clouds drift past — open the window for fresh air." },
  { icon: "🌧️", name: "a drizzly afternoon", theme: "rain", sk: ["#9bb6c8", "#dfeaee"], clouds: 3, rain: true, note: "Pitter patter outside. A cosy day for getting better." },
  { icon: "🌙", name: "a quiet evening", theme: "night", sk: ["#2b3470", "#6b5c9e"], clouds: 1, stars: true, note: "The lamps are low and soft. Gentle care time." }
];
function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

export function mountDinoCare(context) {
  const F = window.DUFX;
  const ch = Math.max(1, Number(context.challenge) || 1);
  const visible = Math.min(PATIENTS.length, 4 + Math.floor(ch / 2));
  const needCount = Math.min(ALL.length, 3 + Math.floor(ch / 2));
  const queueLength = ch >= 5 ? 2 : 1;
  const sky = SKIES[(Math.max(1, Number(context.level) || 1) - 1) % SKIES.length];
  const play = createPlay(context, {
    emoji: "🧺", title: "Dino Care Clinic", theme: sky.theme, buddy: false, wander: false,
    instruction: "Pick a patient, look at the little health bars, and give just the care it needs.",
    hint: "Read the bars: the red ones are low. Tap the matching tool, or drag it onto the dinosaur.",
    allowed: Math.max(3, needCount)
  });
  const board = play.board;
  const clinic = collection("clinic");
  const bestStars = clinic.reduce(function (m, c) { return Math.max(m, Number(c.stars) || 0); }, 0);
  let patient = null, meters = {}, busy = false, gave = [], blooms = 0, fixedTotal = 0, queue = [], seat = 0;

  function waiting() {
    const seats = shuffle(PATIENTS.slice()).slice(0, visible);
    queue = seats.slice(0, Math.min(seats.length, queueLength)); seat = 0;
    board.innerHTML = '<h3 class="cc-q">Who needs care today?</h3><p class="hb-deco">' + sky.icon + " It is " + sky.name + ' over the clinic</p><div class="cc-room">' + seats.map(function (p, i) {
      const needs = shuffle(ALL.slice()).slice(0, 2);
      p.preview = needs;
      return '<button type="button" class="cc-bench" data-i="' + i + '"><span class="cc-bubble">' + needs.map(function (n) { return NEEDS[n].icon; }).join(" ") + '</span><span class="cc-pd">' + F.dinoHTML(p.sp, { color: p.color, state: i % 2 ? "sad" : "idle", size: "100%" }) + "</span><b>" + p.name + "</b></button>";
    }).join("") + "</div>" +
      '<p class="cc-certs">📜 Certificates earned: <b>' + clinic.length + "</b>" + (bestStars ? " · Best care " + "⭐".repeat(bestStars) : "") + (queue.length > 1 ? " · Two patients today!" : "") + "</p>" +
      '<p class="hb-deco">' + sky.note + "</p>";
    board.querySelectorAll(".cc-bench").forEach(function (b, i) {
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(20px) scale(.7)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: i * 60, fill: "backwards" });
      b.addEventListener("click", function () {
        if (busy) return;
        if (F.sfx) F.sfx.chirp();
        treat(seats[Number(b.dataset.i)]);
      });
    });
    play.hint("Tap a patient to read its bars. " + (queue.length > 1 ? "Two friends are waiting today!" : "One patient today — take your time."), true);
  }

  function treat(p) {
    patient = p; busy = false; gave = []; blooms = 0;
    const sick = shuffle(ALL.slice()).slice(0, needCount);
    meters = {};
    ALL.forEach(function (k) { meters[k] = sick.indexOf(k) >= 0 ? 15 + Math.floor(Math.random() * 30) : 100; });
    board.innerHTML = '<div class="cc-bar" id="ccBars"></div>' + windowStrip() +
      '<p class="hb-deco" id="ccGarden"><b>🌱 Get-well garden:</b> every bar you fix blooms a flower</p>' +
      '<div class="cc-stage" id="ccStage"><div class="cc-pat" id="ccPat">' + F.dinoHTML(p.sp, { color: p.color, state: "sad", size: "100%" }) + '<div class="cc-dust"></div><span class="cc-garland" hidden>🌼🌸🌼🌸🌼</span><span class="cc-cool" hidden>🧺</span><span class="cc-zzz" hidden>💤</span>' +
      '<span class="cc-bath" hidden style="position:absolute;left:30%;top:16%;font-size:26px">🫧🫧🫧</span>' +
      '<span class="cc-plaster" hidden style="position:absolute;left:58%;bottom:12%;font-size:30px">🩹</span>' +
      '<span class="cc-notes" hidden style="position:absolute;left:62%;top:26%;font-size:24px">🎵🎶🎵</span></div><div class="cc-speech" id="ccSpeech"></div></div>' +
      '<div class="cc-tools" id="ccTools"></div>' +
      '<p style="text-align:center;margin:8px 0 0"><button type="button" class="tiny-button" id="ccHelp">💡 Show me what is low</button></p>';
    animateWindow();
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
    board.querySelector("#ccHelp").addEventListener("click", showLowest);
    renderBars();
    say(p.name + ': "' + NEEDS[sick[0]].ask + '"');
    play.hint(sky.note + " " + p.name + " has " + sick.length + " low bars — the garden grows as you fix them.", true);
    updateMood();
    if (F.sfx) F.sfx.whoosh();
  }

  /* the clinic window: drifting clouds, rain or twinkles, changing with each round */
  function windowStrip() {
    let inside = '<b style="position:absolute;left:50%;top:4px;margin-left:-18px;font-size:30px">' + sky.icon + "</b>";
    for (let i = 0; i < (sky.clouds || 0); i++) inside += '<i class="cc-drift" style="position:absolute;left:' + (-10 + i * 34) + "%;top:" + (14 + i * 9) + 'px;font-size:' + (18 + i * 3) + 'px;font-style:normal;opacity:.85">☁️</i>';
    for (let d = 0; d < (sky.rain ? 7 : 0); d++) inside += '<i class="cc-drop" style="position:absolute;left:' + (8 + d * 13) + '%;top:-8px;font-size:13px;font-style:normal">💧</i>';
    for (let s = 0; s < (sky.stars ? 8 : 0); s++) inside += '<i class="cc-twinkle" style="position:absolute;left:' + (5 + s * 11) + "%;top:" + (6 + (s % 3) * 12) + 'px;font-size:13px;font-style:normal">' + (s % 3 === 0 ? "✨" : "⭐") + "</i>";
    return '<div id="ccWindow" aria-hidden="true" style="position:relative;height:56px;max-width:520px;margin:0 auto 8px;border-radius:18px;overflow:hidden;background:linear-gradient(' + sky.sk[0] + "," + sky.sk[1] + ');box-shadow:inset 0 0 0 4px rgba(255,255,255,.7)">' + inside + "</div>";
  }
  function animateWindow() {
    const win = board.querySelector("#ccWindow");
    if (!win || !F.anim) return;
    win.querySelectorAll(".cc-drift").forEach(function (c, i) { F.anim(c, [{ transform: "translateX(0)" }, { transform: "translateX(" + (40 + Math.floor(Math.random() * 40)) + "px)" }], { duration: 7000 + i * 1200, direction: i % 2 ? "alternate-reverse" : "alternate", iterations: Infinity, easing: "ease-in-out" }); });
    win.querySelectorAll(".cc-drop").forEach(function (d, i) { F.anim(d, [{ transform: "translateY(0)", opacity: 0.9 }, { transform: "translateY(58px)", opacity: 0.2 }], { duration: 1200 + i * 90, delay: i * 180, iterations: Infinity }); });
    win.querySelectorAll(".cc-twinkle").forEach(function (t, i) { F.anim(t, [{ opacity: 0.35, transform: "scale(.8)" }, { opacity: 1, transform: "scale(1.15)" }], { duration: 1600, delay: i * 200, direction: "alternate", iterations: Infinity }); });
  }
  function bloom() {
    const g = board.querySelector("#ccGarden");
    if (!g) return;
    const s = document.createElement("i");
    s.textContent = FLOWERS[blooms % FLOWERS.length];
    s.style.cssText = "font-style:normal;display:inline-block;margin-left:4px";
    blooms += 1;
    g.appendChild(s);
    if (F.anim) F.anim(s, [{ transform: "scale(.2) translateY(12px)" }, { transform: "scale(1.4) translateY(-4px)" }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.3,1.6,.5,1)" });
    if (F.sfx) F.sfx.pop();
  }
  /* a free hint that never marks the child wrong: it finds the lowest bar and glows its tool */
  function showLowest() {
    if (busy) return;
    const low = ALL.filter(function (k) { return meters[k] < 100; }).sort(function (a, b) { return meters[a] - meters[b]; })[0];
    board.querySelectorAll(".cc-tool").forEach(function (b) { b.style.boxShadow = ""; });
    const btn = board.querySelector('.cc-tool[data-k="' + low + '"]');
    if (!low || !btn) { play.hint("Every bar is full already — what lovely care!", true); return; }
    btn.style.boxShadow = "0 0 0 4px #ffd166, 0 5px 0 rgba(120,80,30,.3)";
    if (F.anim) F.anim(btn, [{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }], { duration: 620, easing: "ease-in-out" });
    if (F.sfx) F.sfx.star();
    say(patient.name + ': "' + NEEDS[low].ask + '"');
    play.hint("The " + NEEDS[low].meter.toLowerCase() + " bar is the lowest — reach for the " + NEEDS[low].tool.toLowerCase() + ".", true);
  }

  function say(t) { const s = board.querySelector("#ccSpeech"); if (s) { s.textContent = t; F.pop && F.pop(s); } }
  function renderBars() {
    const bars = board.querySelector("#ccBars");
    if (!bars) return;
    bars.innerHTML = ALL.map(function (k) {
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
      const lowest = ALL.filter(function (x) { return meters[x] < 100; }).sort(function (a, b) { return meters[a] - meters[b]; })[0];
      play.miss(btn, patient.name + " is already fine for " + n.meter.toLowerCase() + ". " + (lowest ? "So close — look for a lower bar: " + NEEDS[lowest].icon + " " + NEEDS[lowest].tool : "Nothing left to fix!"));
      say(patient.name + ": \"I'm all sorted for " + n.meter.toLowerCase() + "! " + (lowest ? NEEDS[lowest].ask : "") + "\"");
      return;
    }
    busy = true;
    const go = F.flyTo ? F.flyTo(btn, { x: r.left + r.width * 0.62, y: r.top + r.height * 0.35 }, { emoji: n.icon, size: 40, burst: false, duration: 450 }) : Promise.resolve();
    go.then(function () {
      if (!pat.isConnected) { busy = false; return; }
      const show = pat.querySelector(".cc-" + k);
      // every kind of care gets its own sound and its own little show
      if (k === "brush") {
        board.querySelectorAll(".cc-dust i").forEach(function (i, ix) { window.setTimeout(function () { i.classList.add("gone"); if (F.burst) { const rr = i.getBoundingClientRect(); F.burst(rr.left, rr.top, { kind: "sparkle", n: 4 }); } }, ix * 120); });
        if (F.sfx) F.sfx.sparkle();
      } else if (k === "water") {
        if (F.burst) F.burst(r.left + r.width * 0.68, r.top + r.height * 0.4, { kind: "drops", n: 10 });
        F.dinoState(d, "eat", 1100); if (F.sfx) F.sfx.splash();
      } else if (k === "fern") {
        F.dinoState(d, "eat", 1300); if (F.sfx) { F.sfx.chomp(); window.setTimeout(F.sfx.chomp, 300); }
      } else if (k === "cloth") {
        if (show) { show.hidden = false; if (F.anim) F.anim(show, [{ transform: "translateY(-30px) rotate(-12deg)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420 }); }
        if (F.sfx) F.sfx.pop(); window.setTimeout(function () { if (show) show.hidden = true; }, 1700);
      } else if (k === "flowers") {
        if (show) { show.hidden = false; if (F.anim) F.anim(show, [{ transform: "scale(.3)" }, { transform: "scale(1.25)" }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.3,1.6,.5,1)" }); }
        if (F.burst) F.burst(r.left + r.width * 0.6, r.top + r.height * 0.45, { kind: "leaves", n: 10 });
        if (F.sfx) F.sfx.good();
      } else if (k === "shade") {
        board.querySelector("#ccStage").classList.add("cc-shady");
        if (show) show.hidden = false;
        F.dinoState(d, "sleep", 1800); if (F.sfx) F.sfx.note(4);
        window.setTimeout(function () { const st = board.querySelector("#ccStage"); if (st) st.classList.remove("cc-shady"); if (show) show.hidden = true; }, 1900);
      } else if (k === "bath") {
        if (show) { show.hidden = false; if (F.anim) F.anim(show, [{ transform: "translateY(20px) scale(.5)", opacity: 0 }, { transform: "translateY(-14px) scale(1.1)", opacity: 1 }], { duration: 900, easing: "ease-out" }); }
        if (F.burst) F.burst(r.left + r.width * 0.55, r.top + r.height * 0.5, { kind: "bubbles", n: 14 });
        if (F.sfx) F.sfx.splash(); window.setTimeout(function () { if (show) show.hidden = true; }, 1800);
      } else if (k === "plaster") {
        if (show) { show.hidden = false; if (F.anim) F.anim(show, [{ transform: "scale(0) rotate(-30deg)" }, { transform: "scale(1.3)" }, { transform: "none" }], { duration: 560, easing: "cubic-bezier(.3,1.6,.5,1)" }); }
        if (F.burst) F.burst(r.left + r.width * 0.5, r.top + r.height * 0.72, { kind: "hearts", n: 8 });
        if (F.sfx) F.sfx.boing();
      } else if (k === "song") {
        if (show) { show.hidden = false; if (F.anim) F.anim(show, [{ transform: "translateY(0)", opacity: 0 }, { transform: "translateY(-32px) rotate(8deg)", opacity: 1 }, { transform: "translateY(-58px)", opacity: 0 }], { duration: 1500 }); }
        if (F.burst) F.burst(r.left + r.width * 0.5, r.top + r.height * 0.3, { kind: "notes", n: 9 });
        if (F.sfx) F.sfx.note(6); window.setTimeout(function () { if (show) show.hidden = true; }, 1600);
      }
      meters[k] = 100; renderBars(); bloom();
      gave.push(k); fixedTotal += 1;
      board.querySelectorAll(".cc-tool").forEach(function (b) { b.style.boxShadow = ""; });
      play.good({ x: r.left + r.width / 2, y: r.top + r.height * 0.3 }, { text: n.ok });
      say(patient.name + ": \"" + n.ok + "\"");
      window.setTimeout(function () {
        updateMood(); busy = false;
        const left = ALL.filter(function (x) { return meters[x] < 100; }).sort(function (a, b) { return meters[a] - meters[b]; });
        if (!left.length) healthy(); else say(patient.name + ": \"" + NEEDS[left[0]].ask + "\"");
      }, 1400);
    });
  }

  function healthy() {
    busy = true;
    const d = board.querySelector("#ccPat .du-dino");
    F.dinoState(d, "happy", 99999);
    const stars = play.rating();
    collect("clinic", { name: patient.name, sp: patient.sp, color: patient.color, stars: stars, care: gave.slice() });
    if (F.sfx) F.sfx.win();
    const r = board.getBoundingClientRect();
    if (F.burst) { F.burst(r.left + r.width / 2, r.top + 120, { kind: "hearts", n: 16 }); F.burst(r.left + r.width / 2, r.top + 120, { kind: "confetti", n: 30 }); }
    const cert = document.createElement("div");
    cert.className = "cc-cert";
    cert.innerHTML = '<b>📜 Health certificate</b><span>' + patient.name + " is " + gave.map(function (k) { return NEEDS[k].meter.toLowerCase(); }).join(", ") + " — all better!</span><small>" + "⭐".repeat(stars) + "</small><em>Fun fact: " + pick(PREHISTORIC_CREATURES).fact + "</em>";
    board.appendChild(cert); F.pop && F.pop(cert);
    const helpBtn = board.querySelector("#ccHelp"); if (helpBtn) helpBtn.disabled = true;
    board.querySelectorAll(".cc-tool").forEach(function (b) { b.disabled = true; });
    play.say(patient.name + " feels wonderful! 💚", 3000);
    window.setTimeout(function () {
      const next = queue[seat + 1];
      if (next) {
        seat += 1;
        play.say(next.name + " is next through the door! 🚪", 2600);
        if (F.sfx) F.sfx.drum(2);
        window.setTimeout(function () { treat(next); }, 1700);
      } else goHome(stars);
    }, 3200);
  }

  function goHome(stars) {
    const names = queue.slice(0, seat + 1).map(function (p) { return p.name; });
    play.bonus();
    play.say("A thank-you butterfly flew in for you! 🦋", 2800);
    window.setTimeout(function () {
      play.finish("You cared for " + names.join(" and ") + " — " + fixedTotal + " low bars all fixed" + (stars === 3 ? ", not one mix-up!" : "!"));
    }, 900);
  }

  waiting();
}
