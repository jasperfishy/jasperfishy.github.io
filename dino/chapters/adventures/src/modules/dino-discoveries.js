import { createPlay, collect, collection, getExtras } from "../adv-kit.js?v=du-316e7af9b57fa08e";

export const PREHISTORIC_CREATURES = [
  { name: "Tyrannosaurus rex", short: "T. rex", icon: "🦖", kind: "Dinosaur", diet: "Meat eater", fact: "T. rex had strong legs, tiny arms and a powerful bite." , cheer: "stomps a happy dance" },
  { name: "Velociraptor", short: "Velociraptor", icon: "🦖", kind: "Dinosaur", diet: "Meat eater", fact: "Velociraptor was much smaller than movie versions and had feathers." , cheer: "does a speedy spin" },
  { name: "Stegosaurus", short: "Stegosaurus", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "Stegosaurus had large plates on its back and spikes on its tail." , cheer: "wiggles its plates" },
  { name: "Triceratops", short: "Triceratops", icon: "🦏", kind: "Dinosaur", diet: "Plant eater", fact: "Triceratops had three face horns and a big bony frill." , cheer: "gives a proud little bow" },
  { name: "Brachiosaurus", short: "Brachiosaurus", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "Its front legs were longer than its back legs, helping its shoulders rise high." , cheer: "reaches up for the stars" },
  { name: "Ankylosaurus", short: "Ankylosaurus", icon: "🦖", kind: "Dinosaur", diet: "Plant eater", fact: "Ankylosaurus wore bony armour and had a heavy club at the end of its tail." , cheer: "gives a gentle tail wiggle" },
  { name: "Parasaurolophus", short: "Parasaurolophus", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "A long, hollow crest swept back over its head." , cheer: "plays a happy trumpet note" },
  { name: "Spinosaurus", short: "Spinosaurus", icon: "🦖", kind: "Dinosaur", diet: "Meat eater", fact: "It had a long, narrow snout and a tall sail on its back." , cheer: "makes a splashy spin" },
  { name: "Diplodocus", short: "Diplodocus", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "Diplodocus had a very long neck and a long, whip-like tail." , cheer: "swishes its long tail" },
  { name: "Allosaurus", short: "Allosaurus", icon: "🦖", kind: "Dinosaur", diet: "Meat eater", fact: "Allosaurus was a large Jurassic hunter with sharp, curved teeth." , cheer: "does a careful pounce" },
  { name: "Iguanodon", short: "Iguanodon", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "Iguanodon had a pointed thumb spike on each hand." , cheer: "waves its spiky thumbs" },
  { name: "Pachycephalosaurus", short: "Pachycephalosaurus", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "Its skull had a thick, rounded dome on top." , cheer: "bobs its domed head" },
  { name: "Therizinosaurus", short: "Therizinosaurus", icon: "🦕", kind: "Dinosaur", diet: "Probably a plant eater", fact: "It had enormous curved claws on its hands." , cheer: "gives a careful claw wave" },
  { name: "Carnotaurus", short: "Carnotaurus", icon: "🦖", kind: "Dinosaur", diet: "Meat eater", fact: "Two short horns sat above its eyes." , cheer: "does a tiny horned hop" },
  { name: "Coelophysis", short: "Coelophysis", icon: "🦖", kind: "Dinosaur", diet: "Meat eater", fact: "This slim dinosaur lived very early in dinosaur history." , cheer: "takes a quick little step" },
  { name: "Archaeopteryx", short: "Archaeopteryx", icon: "🪶", kind: "Dinosaur", diet: "Meat eater", fact: "It had feathers and a mix of dinosaur and bird-like features." , cheer: "flutters its feathered wings" },
  { name: "Styracosaurus", short: "Styracosaurus", icon: "🦏", kind: "Dinosaur", diet: "Plant eater", fact: "Its frill had several long spikes and a nose horn." , cheer: "gives a spiky little bow" },
  { name: "Deinonychus", short: "Deinonychus", icon: "🦖", kind: "Dinosaur", diet: "Meat eater", fact: "It had a large curved claw on each foot." , cheer: "shows off a careful footstep" },
  { name: "Corythosaurus", short: "Corythosaurus", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "A rounded, helmet-like crest sat on top of its head." , cheer: "taps its crest like a drum" },
  { name: "Baryonyx", short: "Baryonyx", icon: "🦖", kind: "Dinosaur", diet: "Meat eater", fact: "Baryonyx had a long snout and a very large claw on each hand." , cheer: "makes a gentle splash" },
  { name: "Amargasaurus", short: "Amargasaurus", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "Two rows of long spines ran along its neck and back." , cheer: "does a spiny little shimmy" },
  { name: "Oviraptor", short: "Oviraptor", icon: "🪶", kind: "Dinosaur", diet: "Probably an omnivore", fact: "Its name means egg thief, but the eggs in its first fossil find may have been its own nest." , cheer: "does a curious head tilt" },
  { name: "Maiasaura", short: "Maiasaura", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "Fossils of nests and young Maiasaura help scientists study dinosaur families." , cheer: "waves hello to its family" },
  { name: "Mamenchisaurus", short: "Mamenchisaurus", icon: "🦕", kind: "Dinosaur", diet: "Plant eater", fact: "Some kinds had an amazingly long neck made of many bones." , cheer: "reaches up to the clouds" },
  { name: "Pteranodon", short: "Pteranodon", icon: "🪽", kind: "Flying reptile", diet: "Fish eater", fact: "Pteranodon was a flying reptile, not a dinosaur. Its wings were made from skin stretched along a very long finger." , cheer: "flutters through the sky" },
  { name: "Quetzalcoatlus", short: "Quetzalcoatlus", icon: "🪽", kind: "Flying reptile", diet: "Meat eater", fact: "This giant pterosaur was a flying reptile, not a dinosaur." , cheer: "soars above the meadow" },
  { name: "Mosasaurus", short: "Mosasaurus", icon: "🐊", kind: "Marine reptile", diet: "Meat eater", fact: "Mosasaurus was a sea reptile with flippers, not a dinosaur." , cheer: "swishes its ocean tail" },
  { name: "Plesiosaurus", short: "Plesiosaurus", icon: "🌊", kind: "Marine reptile", diet: "Meat eater", fact: "This marine reptile swam with four flippers and a long neck." , cheer: "paddles a happy circle" },
  { name: "Ichthyosaurus", short: "Ichthyosaurus", icon: "🐬", kind: "Marine reptile", diet: "Meat eater", fact: "This sea reptile had a streamlined body and paddled with flippers." , cheer: "swims through a bubble ring" },
  { name: "Dimetrodon", short: "Dimetrodon", icon: "🦎", kind: "Other ancient animal", diet: "Meat eater", fact: "Dimetrodon had a large back sail and lived long before the dinosaurs." , cheer: "gives a sunny sail wiggle" }
];

/* Prehistoric Discoveries — a field guide of 30 ancient animals. Meet new friends (animated where we have a model),
 * answer a friendly Fact Finder question for a bonus, and collect a stamp for every animal (saved on this device).
 * Trips grow with the level: more friends to meet and trickier questions (what kind, what it ate, "was it really a
 * dinosaur?", which fact belongs to whom). A free hint crosses out one wrong answer instead of giving the game away. */
export function speciesFor(creature) {
  const aliases = {'Tyrannosaurus rex':'trex',Velociraptor:'raptor',Triceratops:'tricera',Stegosaurus:'stego',Pteranodon:'ptero'};
  const key = aliases[creature.name] || creature.name.toLowerCase();
  return window.DUFX.dinoPhotoURL(key) ? key : null;
}
const TINTS = ["green", "teal", "purple", "orange", "pink", "blue", "yellow", "red"];
function tintFor(name) { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997; return TINTS[h % TINTS.length]; }
function dietClass(d) { return /Plant/i.test(d) ? "Plant eater" : /Fish/i.test(d) ? "Fish eater" : /Meat/i.test(d) ? "Meat eater" : null; }
const KINDS = ["Dinosaur", "Flying reptile", "Marine reptile", "Other ancient animal"];

const DIETS = ["Plant eater", "Meat eater", "Fish eater"];
/* extra card detail, kept here so the exported creature list stays exactly as the hub expects */
const DETAILS = {
  "T. rex": { size: "about as long as a school bus", found: "North America", period: "the very end of the dinosaur age" },
  Velociraptor: { size: "about the size of a turkey", found: "Mongolia", period: "the Late Cretaceous" },
  Stegosaurus: { size: "as long as a small car", found: "North America", period: "the Jurassic" },
  Triceratops: { size: "as heavy as an elephant", found: "North America", period: "the very end of the dinosaur age" },
  Brachiosaurus: { size: "taller than a five-storey building", found: "Africa and North America", period: "the Jurassic" },
  Spinosaurus: { size: "longer than T. rex", found: "North Africa", period: "the Cretaceous rivers" },
  Diplodocus: { size: "as long as two school buses", found: "North America", period: "the Jurassic" },
  Ankylosaurus: { size: "as wide as a hippo", found: "North America", period: "the end of the dinosaur age" },
  Pteranodon: { size: "a wingspan wider than a car", found: "North America", period: "the Cretaceous seas" },
  Quetzalcoatlus: { size: "as tall as a giraffe when standing", found: "Texas", period: "the last part of the dinosaur age" },
  Mosasaurus: { size: "as long as a big bus", found: "oceans all over the world", period: "the Cretaceous seas" },
  Dimetrodon: { size: "about the length of a dolphin", found: "North America and Europe", period: "long, long before the dinosaurs" },
  Archaeopteryx: { size: "about the size of a magpie", found: "Germany", period: "the Jurassic" },
  Maiasaura: { size: "as long as a small car", found: "Montana", period: "the Cretaceous" }
};
const FALLBACK_DETAIL = { size: "bigger than a grown-up human", found: "rocks from long ago", period: "the age of dinosaurs" };
function detailFor(c) { return DETAILS[c.short] || FALLBACK_DETAIL; }
function askAbout(c) { return c.name + ". " + c.kind + ". " + c.diet + ". " + c.fact; }
// a wrong answer teaches: name what the child nearly matched, then point back at the card
function whyWrong(q, o) {
  if (q.type === "kind") return "Hmm, a " + o.toLowerCase() + " is a different sort of animal. Where did " + q.who + " live — in the sea, in the sky, or on the land?";
  if (q.type === "diet") return "Not quite! Look at the dinner picture again: " + q.who + "'s teeth and tummy say something else.";
  if (q.type === "not") return "Nearly! " + q.who + " belongs to the " + q.because + " group, so it was not a dinosaur.";
  return "That story belongs to another animal. Read " + q.who + "'s card one more time!";
}

export function mountDinoDiscoveries(context) {
  const F = window.DUFX;
  const ch = Math.max(1, Number(context.challenge) || 1);
  let selected = null;
  const visited = new Set();
  const required = Math.min(6, 3 + Math.floor(ch / 3));
  let filter = "All", asked = 0, right = 0, wrongTotal = 0, hinted = false, clues = 0, bonusOffered = false;
  const bestTrip = (getExtras().best || {})[context.activity ? context.activity.id : "discoveries"] || 0;
  const play = createPlay(context, {
    emoji: "🦴", title: "Prehistoric Discoveries", theme: "dig", buddy: false, wander: true,
    instruction: "Meet " + required + " new friends from long ago, then answer a Fact Finder question about each!",
    hint: "Discoveries stay here to explore. There are no quiz scores to worry about.", allowed: 99
  });
  const board = play.board;
  const stamps = function () { return new Set(collection("guide").map(function (g) { return g.name; })); };
  const trips = collection("trips");

  function ribbon() {
    const icons = [];
    visited.forEach(function (name) { const c = PREHISTORIC_CREATURES.find(function (x) { return x.name === name; }); if (c) icons.push(c.icon); });
    return icons.length ? icons.join(" ") : "…";
  }
  function drawGuide() {
    selected = null;
    const have = stamps();
    const creatures = PREHISTORIC_CREATURES.filter(function (c) { return filter === "All" || c.kind === filter; });
    board.innerHTML = '<div class="ds-bar"><span class="ds-prog">Friends met this trip: <b>' + visited.size + "</b> of " + required + '</span><span class="ds-stamps">📒 Stamps <b>' + have.size + "</b>/" + PREHISTORIC_CREATURES.length + "</span>" +
      (bestTrip ? "<span>🏅 Best trip: " + "⭐".repeat(bestTrip) + "</span>" : "") +
      '<span class="ds-ribbon" aria-label="Friends met this trip">' + ribbon() + "</span></div>" +
      '<div class="discovery-filters">' + ["All"].concat(KINDS).map(function (category) {
        return '<button type="button" class="discovery-filter' + (filter === category ? ' selected' : '') + '" data-filter="' + category + '">' + escapeText(category === "All" ? "All friends" : category + "s") + '</button>';
      }).join("") + '</div><div class="ds-grid">' + creatures.map(function (c) {
        const done = visited.has(c.name), stamp = have.has(c.name);
        return '<button type="button" class="ds-card' + (done ? " met" : "") + (stamp ? " stamped" : "") + '" data-creature="' + escapeText(c.name) + '"><span class="ds-ico">' + c.icon + '</span><strong>' + escapeText(c.short) + '</strong><small>' + escapeText(c.kind) + '</small>' + (stamp ? '<i class="ds-stamp" aria-label="Stamped">✔</i>' : "") + "</button>";
      }).join("") + "</div>" +
      (visited.size >= required ? '<p class="hb-deco" id="dsBonusNote">🦋 Bonus hunt! A fluttering friend drifts past the dig site — catch it for a sticker.</p>' : "") +
      (visited.size >= required ? '<button type="button" class="pk-btn sb-next ds-finish" id="finishDiscovery">Finish this discovery trip ✨</button>' : "");
    board.querySelectorAll("[data-filter]").forEach(function (b) { b.addEventListener("click", function () { filter = b.dataset.filter; if (F.sfx) F.sfx.tap(); drawGuide(); }); });
    board.querySelectorAll(".ds-card").forEach(function (b, i) {
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(16px) scale(.8)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: Math.min(i, 14) * 30, fill: "backwards" });
      b.addEventListener("click", function () { meet(PREHISTORIC_CREATURES.find(function (c) { return c.name === b.dataset.creature; })); });
    });
    if (visited.size >= required) {
      if (!bonusOffered) { bonusOffered = true; window.setTimeout(function () { play.bonus(); }, 700); }
      const fin = board.querySelector("#finishDiscovery");
      if (fin) fin.addEventListener("click", function () {
        const stars = asked ? (wrongTotal === 0 ? 3 : wrongTotal <= 2 ? 2 : 1) : 2;
        collect("trips", { met: visited.size, right: right, slips: wrongTotal, stars: stars, stamps: stamps().size });
        play.finish("You met " + visited.size + " prehistoric friends, answered " + right + " Fact Finder question" + (right === 1 ? "" : "s") + " right" + (clues ? " with " + clues + " clever clue" + (clues === 1 ? "" : "s") : "") + " — and your guide now has " + stamps().size + " stamps!", { stars: stars });
      });
    }
  }

  /* four kinds of friendly question, unlocking as the trip challenge grows */
  function question(c) {
    const diet = dietClass(c.diet);
    const types = ["kind"];
    if (diet && ch >= 4) types.push("diet");
    if (c.kind !== "Dinosaur") types.push("not");
    if (ch >= 6) types.push("fact");
    const type = types[Math.floor(Math.random() * types.length)];
    if (type === "diet") {
      const wrong = shuffle(DIETS.filter(function (d) { return d !== diet; })).slice(0, ch >= 6 ? 2 : 1);
      return { type: "diet", who: c.short, text: "What does " + c.short + " like to eat?", right: diet, options: shuffle(wrong.concat([diet])), clue: diet === "Plant eater" ? "It nibbled leaves and ferns." : diet === "Fish eater" ? "It snappy-snatched fish." : "It hunted for meat." };
    }
    if (type === "not") {
      return { type: "not", who: c.short, because: c.kind, text: "True or false: " + c.short + " was a dinosaur.", right: "False", options: shuffle(["True", "False"]), clue: c.kind + "s were not dinosaurs — they were a different sort of animal." };
    }
    if (type === "fact") {
      const others = shuffle(PREHISTORIC_CREATURES.filter(function (o) { return o.name !== c.name && o.fact !== c.fact; })).slice(0, 2);
      return { type: "fact", who: c.short, text: "Which of these is the true story about " + c.short + "?", right: c.fact, options: shuffle(others.map(function (o) { return o.fact; }).concat([c.fact])), clue: c.fact };
    }
    const wrong = shuffle(KINDS.filter(function (k) { return k !== c.kind; })).slice(0, ch >= 3 ? 3 : 2);
    return { type: "kind", who: c.short, text: "What kind of animal is " + c.short + "?", right: c.kind, options: shuffle(wrong.concat([c.kind])), clue: c.fact };
  }

  function meet(c) {
    selected = c; visited.add(c.name); hinted = false;
    const isNew = !stamps().has(c.name);
    if (isNew) collect("guide", { name: c.name });
    const sp = speciesFor(c), det = detailFor(c);
    const q = question(c);
    if (F.sfx) F.sfx.sparkle();
    board.innerHTML = '<article class="ds-detail"><button type="button" class="pk-btn" id="dsBack">← Field guide</button>' +
      '<div class="ds-stage">' + (sp ? '<div class="ds-dino">' + F.dinoHTML(sp, { color: tintFor(c.name), state: "idle", size: "100%" }) + "</div>" : '<div class="ds-emoji">' + c.icon + "</div>") + (isNew ? '<span class="ds-new">NEW! Stamp collected 📒</span>' : "") + '</div>' +
      '<h3>' + escapeText(c.name) + '</h3><div class="ds-chips"><span>' + escapeText(c.kind) + "</span><span>🍽️ " + escapeText(c.diet) + "</span><span>📏 " + escapeText(det.size) + "</span><span>🌍 " + escapeText(det.found) + "</span><span>⏳ " + escapeText(det.period) + "</span></div><p class=\"ds-fact\">" + escapeText(c.fact) + '</p>' +
      '<p class="hb-deco">🎗️ Friends met: ' + visited.size + " of " + required + " · 📒 Stamps: " + stamps().size + " of " + PREHISTORIC_CREATURES.length + (trips.length ? " · 🏅 Best trip " + "⭐".repeat(trips.reduce(function (m, t) { return Math.max(m, Number(t.stars) || 0); }, 0)) : "") + "</p>" +
      '<div class="ds-actions"><button type="button" class="pk-btn" id="speakCreature">🔊 Hear about ' + escapeText(c.short) + "</button>" + (sp ? '<button type="button" class="pk-btn" id="dsRoar">' + (sp === "ptero" ? "🪽 Flap" : "🦖 Say hello") + "</button>" : "") + '</div>' +
      '<div class="ds-quiz"><p class="ds-qtext">🔎 Fact Finder: ' + escapeText(q.text) + '</p><div class="ds-opts"></div>' +
      '<p style="text-align:center;margin:8px 0 0"><button type="button" class="tiny-button" id="dsHelp">💡 Need a clue?</button></p></div></article>';
    if (isNew) {
      const r = board.getBoundingClientRect();
      if (F.burst) { F.burst(r.left + r.width / 2, r.top + 100, { kind: "stars", n: 16 }); F.burst(r.left + r.width / 2, r.top + 120, { kind: "bones", n: 6 }); }
      if (F.sfx) F.sfx.coin();
      play.say("A new stamp for your field guide! 📒", 2600);
    }
    const d = board.querySelector(".du-dino");
    if (d) { F.dinoTrack && F.dinoTrack(d); d.setAttribute("data-base", "idle"); d.addEventListener("pointerdown", function () { F.dinoState(d, sp === "trex" ? "roar" : "happy", 1000); if (F.sfx) (sp === "trex" ? F.sfx.roar : F.sfx.chirp)(); }); }
    board.querySelector("#dsBack").addEventListener("click", function () { if (F.sfx) F.sfx.tap(); drawGuide(); });
    board.querySelector("#speakCreature").addEventListener("click", function () { context.speak(askAbout(c)); if (!context.speechEnabled) play.say(c.short + ": " + c.fact, 4000); });
    const roar = board.querySelector("#dsRoar");
    if (roar && d) roar.addEventListener("click", function () { F.dinoState(d, sp === "trex" ? "roar" : "happy", 1000); if (F.sfx) (sp === "trex" ? F.sfx.roar : F.sfx.chirp)(); });
    context.speak(c.name + ". " + c.fact);
    const opts = board.querySelector(".ds-opts");
    const helpBtn = board.querySelector("#dsHelp");
    let answered = false;
    shuffle(q.options.slice()).forEach(function (o) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pk-btn ds-opt"; b.textContent = o;
      if (q.type === "fact") b.style.cssText = "flex:1 1 100%;max-width:440px;font-size:.82rem;line-height:1.35;text-align:left;padding:8px 12px";
      opts.appendChild(b);
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(14px) scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: opts.children.length * 50, fill: "backwards" });
      b.addEventListener("click", function () {
        if (answered || b.disabled) return;
        if (o === q.right) {
          answered = true; asked += 1; right += 1;
          opts.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
          b.classList.add("ds-right");
          helpBtn.disabled = true;
          const rr = b.getBoundingClientRect();
          if (F.burst) F.burst(rr.left + rr.width / 2, rr.top, { kind: "sparkle", n: 10 });
          if (F.sfx) F.sfx.chirp();
          play.good(b, { text: "Yes!" });
          play.say(c.short + " " + c.cheer + "! " + q.clue, 3200);
          const stageEl = board.querySelector(".ds-stage");
          if (stageEl && F.anim) F.anim(stageEl, [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 520, easing: "ease-out" });
          if (right % 3 === 0) window.setTimeout(function () { play.bonus(); }, 400);
        } else {
          wrongTotal += 1; b.disabled = true; b.classList.add("ds-wrong");
          play.miss(b, whyWrong(q, o));
        }
      });
    });
    /* the clue costs the child nothing: it crosses out a wrong answer and reads the card again */
    helpBtn.addEventListener("click", function () {
      if (answered) return;
      const still = Array.prototype.filter.call(opts.querySelectorAll("button"), function (x) { return !x.disabled && x.textContent !== q.right; });
      if (still.length > 1) {
        const drop = still[Math.floor(Math.random() * still.length)];
        drop.disabled = true;
        drop.style.cssText += ";opacity:.35;text-decoration:line-through";
        if (F.sfx) F.sfx.pop();
      } else if (F.sfx) F.sfx.pop();
      const fact = board.querySelector(".ds-fact");
      if (fact && F.anim) F.anim(fact, [{ background: "#fff3c9" }, { background: "#ffd45e" }, { background: "#fff3c9" }], { duration: 1200 });
      if (F.sfx) F.sfx.star();
      play.hint("Clue: " + q.clue + " (crossed-out answers are gone — have another look!)", true);
      play.say("Here's a clue: " + q.clue, 3600);
      hinted = true; clues += 1;
      helpBtn.textContent = "💡 Clue " + clues + " used — have another look!";
    });
  }
  drawGuide();
}

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function escapeText(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}
