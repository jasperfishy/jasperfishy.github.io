/* Starry Dino Constellations — a night-sky dot-to-dot in TWO acts. Act one: connect the stars in order (finger or mouse:
 * a glowing thread follows you) and every star chimes a higher note. Act two — "find it in the real sky": the thread is
 * hidden, wild stars crowd the sky and the child has to pick out only the stars belonging to the shape, against a faint
 * silhouette of the dinosaur. Getting it right re-draws the sky; a wild star costs a star but never ends the night.
 * Every finished sky blazes, pays a star-legend and puts a collectible star-map on the shelf (saved on this device).
 * Later nights bring more stars, more wild ones, memory skies and a different moon. */
import { createPlay, shuffle, getExtras, collect, collection, escapeText } from "../adv-kit.js?v=du-316e7af9b57fa08e";

const SKIES = [
  { sp: "bronto", color: "orange", name: "The Great Long-neck", fact: "Long-necked dinosaurs could reach leaves high in the treetops.",
    myth: "Sky farmers used to say a giant long-neck swims across the night, drinking the milky river up.",
    pts: [[6, 52], [22, 46], [36, 38], [52, 38], [64, 38], [70, 24], [76, 10], [86, 12], [80, 18], [76, 30], [72, 48], [68, 60]] },
  { sp: "stego", color: "purple", name: "The Plated Dragon-Dino", fact: "Stegosaurus had big plates along its back and spikes on its tail.",
    myth: "Sailors swore the twinkles were the plates of a sleeping star-dragon, stretched out along the sky.",
    pts: [[6, 50], [20, 48], [30, 40], [38, 28], [46, 38], [54, 24], [62, 36], [70, 28], [78, 40], [86, 46], [92, 52], [76, 60]] },
  { sp: "trex", color: "green", name: "The Mighty Rex", fact: "T. rex had tiny arms, strong legs and a very powerful bite.",
    myth: "The oldest tale tells of a king of stars who roars once a year, and that is why the night is so quiet.",
    pts: [[4, 52], [20, 46], [34, 32], [46, 28], [58, 26], [68, 14], [84, 20], [80, 30], [62, 38], [60, 48], [52, 60], [44, 66]] },
  { sp: "tricera", color: "teal", name: "The Three-Horn Star", fact: "Triceratops had three horns and a big bony frill.",
    myth: "Three shepherds looked up one night, saw three horns of light, and knew spring had finally come.",
    pts: [[6, 50], [20, 42], [36, 34], [52, 34], [66, 18], [78, 12], [92, 32], [86, 42], [74, 46], [56, 54], [44, 62], [30, 60]] },
  { sp: "ptero", color: "blue", name: "The Sky Glider", fact: "Pteranodon was a flying reptile with huge skin wings.",
    myth: "Children believed the sky-glider carries sleepy dreams from one edge of the night to the other.",
    pts: [[4, 22], [20, 32], [36, 38], [48, 40], [56, 52], [64, 38], [74, 30], [88, 20], [96, 36], [82, 40], [60, 28]] },
  { sp: "raptor", color: "red", name: "The Swift Raptor", fact: "Velociraptor was quick on its toes and clever as a crow.",
    myth: "Look up late: the swift raptor is chasing one little red star across the whole sky, and never catching it.",
    pts: [[5, 60], [15, 48], [26, 52], [36, 42], [48, 46], [58, 36], [70, 40], [80, 30], [90, 36], [84, 50], [70, 56], [56, 58], [42, 62]] }
];
const SVGNS = "http://www.w3.org/2000/svg";
/* wild stars: they crowd the real sky from act two on, and belong to somebody else's constellation */
const WILD = ["The Wobbly Spoon", "The Sky Kite", "The Fishy Fin", "The Lost Egg", "The Sleepy Cat", "The Little Boat",
  "The Big Wave", "The Lemon Slice", "The Crooked Hoop", "The Balloon", "The Tiny Hat", "The Shiny Shell"];
const MOONS = [["new", "🌑"], ["waxing crescent", "🌒"], ["half", "🌓"], ["gibbous", "🌔"], ["full", "🌕"],
  ["waning gibbous", "🌖"], ["last half", "🌗"], ["waning crescent", "🌘"]];

export function mountDinoConstellations(context) {
  const F = window.DUFX;
  const sky = SKIES[(context.level - 1) % SKIES.length];
  const count = Math.min(sky.pts.length, 6 + Math.floor(context.challenge / 2));
  const pts = sky.pts.slice(0, count);
  const numbered = context.challenge <= 4;
  const previewFirst = context.challenge >= 6;
  const tier = context.challenge <= 2 ? 1 : context.challenge <= 5 ? 2 : 3;
  const TIER = ["Numbered sky", "Glowing sky", "Memory sky"];
  const best = getExtras().best[(context.activity && context.activity.id) || "constellations"] || 0;
  /* the night grows with every round: a different moon, more wild stars, a longer hunt in act two */
  const night = Math.max(1, Number(context.level) || 1);
  const moon = MOONS[(night - 1) % MOONS.length];
  const maps = collection("star-maps");
  const decoyCount = tier >= 3 ? 4 : tier >= 2 ? 2 : 0;
  const wildCount = 4 + tier * 3;
  const play = createPlay(context, {
    emoji: "🌌", title: "Starry Dino Constellations", theme: "night", buddy: false, wander: false,
    instruction: numbered ? "Connect the stars in order, 1, 2, 3… and a dinosaur will appear in the sky! Then the real trick: find it in the crowded night." : previewFirst ? "Watch the stars glow, then connect them in the same order." : "Connect the glowing stars in order to draw a dinosaur in the night sky, then pick it out of the real one.",
    hint: "Tap each star in turn. A little thread follows your finger.", allowed: 3
  });
  const chip = function (txt) { return '<span style="background:rgba(255,255,255,.92);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#245048">' + txt + "</span>"; };
  const board = play.board;
  function mapsShelf() {
    const ms = collection("star-maps");
    const names = ms.slice(-6).map(function (m) { return '<i title="' + escapeText(String(m && m.name || "")) + '" style="font-style:normal;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,.9);color:#245048;font-weight:900;font-size:11.5px">🗺 ' + escapeText(String((m && m.name || "").replace(/^The /, ""))) + "</i>"; });
    return '<span style="font-weight:900;font-size:12.5px;color:#fff;text-shadow:0 1px 3px rgba(0,0,40,.6)">🗺 Star-map shelf: <b>' + ms.length + "</b></span> " +
      (names.length ? names.join(" ") : '<span style="font-size:12px;color:#fff;opacity:.85">Finish a sky and find it in the real night to earn your first star-map!</span>');
  }
  board.innerHTML = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 auto 8px">' +
    chip("Tier " + tier + " · " + TIER[tier - 1]) + chip("A sky of " + count + " stars") + (best ? chip("Your best " + "⭐".repeat(best)) : "") +
    chip("Night " + night + " · " + moon[0] + " moon " + moon[1]) + chip(maps.length ? "Shelf: " + maps.length + " maps 🗺" : "Shelf: no maps yet 🗺") + '<span id="cnActChip" style="background:rgba(255,243,168,.95);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#5d4a12">Act 1 of 2 · connect</span>' + "</div>" +
    '<div class="cn-sky" id="cnSky" data-phase="connect" data-found="0" data-night="' + night + '"><svg class="cn-lines" viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true"></svg><div class="cn-live" id="cnLive"></div></div><p class="cn-status" id="cnStatus"></p>' +
    '<p class="cn-status" id="cnPhase" style="font-size:12.5px;opacity:.9;margin-top:4px"></p>' +
    '<p id="cnMaps" style="text-align:center;margin:8px 0 0">' + mapsShelf() + "</p>" +
    '<p style="text-align:center;margin:8px 0 0"><button type="button" class="pk-btn" id="cnHelp">🌟 Show me the next star ×2</button></p>';
  const skyEl = board.querySelector("#cnSky"), svg = board.querySelector(".cn-lines"), live = board.querySelector("#cnLive"), status = board.querySelector("#cnStatus");
  const phaseLine = board.querySelector("#cnPhase");
  const rubber = document.createElementNS(SVGNS, "line"); rubber.setAttribute("class", "cn-rubber"); rubber.setAttribute("visibility", "hidden"); svg.appendChild(rubber);
  // the night itself grows: a wandering planet, then an aurora on the biggest skies
  if (tier >= 2) { const p = document.createElement("i"); p.textContent = moon[1]; p.style.cssText = "position:absolute;right:7%;top:7%;font-size:26px;opacity:.85;pointer-events:none"; skyEl.appendChild(p); }
  if (tier >= 3) { const au = document.createElement("span"); au.style.cssText = "position:absolute;left:0;right:0;top:0;height:30%;pointer-events:none;background:linear-gradient(180deg,rgba(126,255,212,.18),rgba(150,120,255,.1) 60%,transparent)"; skyEl.appendChild(au); }
  // faint background decoys — more of them as the nights get busier
  for (let i = 0; i < 12 + tier * 6; i++) { const d = document.createElement("i"); d.className = "cn-dot"; d.style.left = (Math.random() * 98).toFixed(1) + "%"; d.style.top = (Math.random() * 96).toFixed(1) + "%"; d.style.animationDelay = (-Math.random() * 4).toFixed(1) + "s"; skyEl.appendChild(d); }
  const stars = pts.map(function (p, i) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "cn-star"; b.style.left = p[0] + "%"; b.style.top = (p[1] / 70 * 100) + "%";
    b.innerHTML = "<span>✦</span>" + (numbered ? "<b>" + (i + 1) + "</b>" : "");
    b.setAttribute("aria-label", "Star " + (i + 1));
    skyEl.appendChild(b);
    if (F.anim) F.anim(b, [{ opacity: 0, transform: "translate(-50%,-50%) scale(0)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: 420, delay: i * 70, easing: "cubic-bezier(.2,.9,.3,1.5)", fill: "backwards" });
    return b;
  });
  /* a plain little star button, used by the wild stars in both acts — deliberately NOT .cn-star, so the
   * numbered path keeps its own identity and a test can tell "the path" from "the crowd" */
  function starButton(cls, size, glyph, tint) {
    const b = document.createElement("button");
    b.type = "button"; b.className = cls;
    b.style.cssText = "position:absolute;transform:translate(-50%,-50%);width:" + size + "px;height:" + size +
      "px;border:0;border-radius:50%;padding:0;cursor:pointer;display:grid;place-items:center;touch-action:manipulation;" +
      "background:radial-gradient(circle," + (tint || "rgba(255,255,255,.24)") + ",rgba(255,255,255,.04) 70%)";
    b.innerHTML = '<span style="font-size:' + Math.round(size * 0.6) + 'px;line-height:1;color:#fdfbe8;filter:drop-shadow(0 0 4px rgba(255,246,192,.85))">' + glyph + "</span>";
    skyEl.appendChild(b);
    return b;
  }
  /* busier nights: wild stars parked beside the path that must NOT be joined */
  const decoys = [];
  shuffle(WILD).slice(0, decoyCount).forEach(function (who, k) {
    const near = pts[Math.floor(Math.random() * pts.length)];
    const b = starButton("cn-decoy", 34, "✧", "rgba(255,196,214,.3)");
    b.style.left = Math.max(3, Math.min(97, near[0] + (Math.random() * 16 - 8))).toFixed(1) + "%";
    b.style.top = Math.max(4, Math.min(94, near[1] / 70 * 100 + (Math.random() * 18 - 9))).toFixed(1) + "%";
    b.dataset.decoy = who; b.dataset.tapped = "0";
    b.setAttribute("aria-label", "A wild star by the path");
    decoys.push(b);
    b.addEventListener("click", function () {
      if (phase !== "connect" || b.dataset.tapped === "1") return;
      b.dataset.tapped = "1";
      b.style.opacity = ".3";
      play.miss(b, "Ooh, that twinkle belongs to " + who + " — it is not on our path! Follow the pulsing star. ⭐");
      window.setTimeout(function () { b.dataset.tapped = "0"; if (phase === "connect") b.style.opacity = ""; }, 2500);
    });
    if (F.anim) F.anim(b, [{ opacity: 0, transform: "translate(-50%,-50%) scale(0)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: 380, delay: 500 + k * 90, fill: "backwards" });
  });
  let next = 0, locked = previewFirst, idleTimer = 0, phase = "connect", foundN = 0, findTimer = 0;
  const findBtns = [];
  const pos = (i) => [pts[i][0], pts[i][1]];
  function armHint() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(function () { if (!locked && phase === "connect" && next < count) { stars[next].classList.add("hint"); play.say(numbered ? "Look for star " + (next + 1) + "!" : "Try the pulsing star!", 2600); } }, 6000);
  }
  function begin() {
    locked = false;
    status.textContent = numbered ? "Start with star 1." : "Start with the star that glows.";
    phaseLine.textContent = "Act 1 · draw the shape — " + count + " stars, in order.";
    stars[0].classList.add("next"); armHint();
    play.hint("Tap each star in turn. A little thread follows your finger.", true);
  }
  if (previewFirst) {
    status.textContent = "Watch the stars glow in order… 👀";
    play.say("Remember the order!", 2200);
    stars.forEach(function (s, i) { window.setTimeout(function () { if (!board.isConnected) return; s.classList.add("glow"); if (F.sfx) F.sfx.note(i, .3); window.setTimeout(function () { s.classList.remove("glow"); }, 450); }, 900 + i * 600); });
    window.setTimeout(function () { if (board.isConnected) begin(); }, 900 + count * 600 + 300);
  } else begin();

  function connect(i) {
    const a = pos(i - 1), b = pos(i);
    const l = document.createElementNS(SVGNS, "line");
    l.setAttribute("x1", a[0]); l.setAttribute("y1", a[1]); l.setAttribute("x2", b[0]); l.setAttribute("y2", b[1]); l.setAttribute("class", "cn-line");
    svg.insertBefore(l, rubber);
    const r = skyEl.getBoundingClientRect(); // a sparkle where the thread meets the new star, to make the joining feel real
    if (F.burst) F.burst(r.left + ((a[0] + b[0]) / 2) / 100 * r.width, r.top + ((a[1] + b[1]) / 2) / 70 * r.height, { kind: "sparkle", n: 6 });
    if (F.sfx) F.sfx.whoosh();
  }
  stars.forEach(function (s, i) {
    s.addEventListener("click", function () {
      if (locked || phase !== "connect" || s.classList.contains("on")) return;
      if (i !== next) {
        play.miss(s, numbered ? "That's star " + (i + 1) + ". Look for star " + (next + 1) + "! ⭐" : "Not that star. Follow the path of the pulsing star! ⭐");
        stars[next].classList.add("hint"); return;
      }
      s.classList.remove("next", "hint"); s.classList.add("on");
      if (next > 0) connect(i);
      if (F.sfx) F.sfx.note(next, .45);
      const r = s.getBoundingClientRect();
      if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "sparkle", n: 10 });
      play.good(s, { text: next === count - 1 ? "Complete!" : null });
      next += 1;
      rubber.setAttribute("visibility", next < count ? "visible" : "hidden");
      if (next < count) { stars[next].classList.add("next"); status.textContent = numbered ? "Now star " + (next + 1) + "." : (count - next) + " more to go…"; armHint(); rubber.setAttribute("x1", pts[i][0]); rubber.setAttribute("y1", pts[i][1]); rubber.setAttribute("x2", pts[i][0]); rubber.setAttribute("y2", pts[i][1]); }
      else { window.clearTimeout(idleTimer); window.setTimeout(beginFind, 700); }
    });
  });
  skyEl.addEventListener("pointermove", function (e) {
    if (phase !== "connect" || next < 1 || next >= count || locked) return;
    const r = skyEl.getBoundingClientRect();
    rubber.setAttribute("x2", ((e.clientX - r.left) / r.width * 100).toFixed(1)); rubber.setAttribute("y2", ((e.clientY - r.top) / r.height * 70).toFixed(1));
  });

  let helps = 2;
  board.querySelector("#cnHelp").addEventListener("click", function () {
    if (phase !== "connect" || locked || helps <= 0 || next >= count) return;
    helps -= 1;
    const btn = board.querySelector("#cnHelp");
    btn.innerHTML = helps ? "🌟 Show me the next star ×" + helps : "🌟 No more wishes";
    if (!helps) btn.disabled = true;
    stars[next].classList.add("hint");
    if (F.sfx) F.sfx.star();
    play.say(numbered ? "Star " + (next + 1) + " glows for you!" : "The glowing one is next! ✨", 2600);
  });

  /* ---------------- act two: find it in the real sky ----------------
   * The thread vanishes, a faint silhouette of the dinosaur is all that is left, and the sky fills with wild
   * stars. The child must tap only the stars that belong to the shape: each one re-lights, and a segment of the
   * constellation redraws as soon as both its ends are found. Wild stars cost a star but never end the night, and
   * a child who wanders off is carried to the blaze by an idle timer, so the round always completes. */
  function beginFind() {
    phase = "find"; foundN = 0; locked = true;
    skyEl.dataset.phase = "find"; skyEl.dataset.found = "0";
    setAct(2, false);
    stars.forEach(function (s) { s.classList.remove("next", "hint"); s.style.opacity = ".14"; s.style.pointerEvents = "none"; });
    decoys.forEach(function (d) { d.style.opacity = ".35"; });
    svg.querySelectorAll(".cn-line").forEach(function (l) { l.style.transition = "opacity .35s"; l.style.opacity = "0"; });
    live.innerHTML = F.dinoHTML ? '<div class="cn-dino" id="cnGhost" style="animation:none;opacity:.2">' + F.dinoHTML(sky.sp, { color: sky.color, state: "idle", size: "100%" }) + "</div>" : "";
    status.textContent = "Now the real sky! The thread has gone — tap the stars that make the " + sky.name + ".";
    phaseLine.textContent = "Act 2 · find them in the real sky — 0 of " + count + " found.";
    play.say("Shhh — the sky is full of other stars now. Find YOUR dinosaur!", 3400);
    const fsz = tier >= 3 ? 30 : tier >= 2 ? 34 : 40;
    for (let i = 0; i < count; i++) {
      const b = starButton("cn-find", fsz, "✧");
      b.style.left = pts[i][0] + "%"; b.style.top = (pts[i][1] / 70 * 100).toFixed(1) + "%";
      b.dataset.idx = String(i); b.dataset.found = "0";
      b.setAttribute("aria-label", "A star in the real sky");
      b.addEventListener("click", function () { findTap(i, b); });
      findBtns.push(b);
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translate(-50%,-50%) scale(0)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: 320, delay: i * 45, fill: "backwards" });
    }
    // the crowd: wild stars that look exactly like the real ones, parked clear of the shape
    const taken = pts.map(function (p) { return [p[0], p[1] / 70 * 100]; });
    const names = shuffle(WILD);
    for (let k = 0; k < wildCount; k++) {
      let x = 0, y = 0, tries = 0;
      do { x = 4 + Math.random() * 92; y = 5 + Math.random() * 88; tries++; }
      while (tries < 30 && taken.some(function (t) { return Math.abs(t[0] - x) < 9 && Math.abs(t[1] - y) < 13; }));
      taken.push([x, y]);
      const who = names[k % names.length];
      const b = starButton("cn-wild", fsz, "✧");
      b.style.left = x.toFixed(1) + "%"; b.style.top = y.toFixed(1) + "%";
      b.dataset.wild = who; b.dataset.tapped = "0";
      b.setAttribute("aria-label", "A wild star");
      b.addEventListener("click", function () {
        if (phase !== "find" || b.dataset.tapped === "1") return;
        b.dataset.tapped = "1"; b.style.opacity = ".28";
        play.miss(b, "That one belongs to " + who + " — it is only wandering past! Tap the stars that sit on your dinosaur's shadow.");
        window.setTimeout(function () { b.dataset.tapped = "0"; b.style.opacity = ""; }, 2500);
      });
    }
    armFind(9000);
  }
  function findTap(i, b, quiet) {
    if (phase !== "find" || b.dataset.found === "1") return;
    b.dataset.found = "1"; b.classList.add("lit");
    b.style.background = "radial-gradient(circle,rgba(255,243,168,.95),rgba(255,243,168,.22) 70%)";
    b.firstChild.textContent = "✦";
    foundN += 1;
    skyEl.dataset.found = String(foundN);
    phaseLine.textContent = "Act 2 · find them in the real sky — " + foundN + " of " + count + " found.";
    redrawSegments();
    if (!quiet) {
      if (F.sfx) F.sfx.note(i, .45);
      const r = b.getBoundingClientRect();
      if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "sparkle", n: 10 });
      play.good(b, { text: "Yours!" });
      armFind(Math.max(5000, 9000 - foundN * 700));
    }
    if (foundN >= count) window.setTimeout(function () { if (phase === "find") blaze(); }, quiet ? 260 : 700);
  }
  /* line k joins star k to star k+1, so the shape redraws itself piece by piece as the sky is read */
  function redrawSegments() {
    const lines = svg.querySelectorAll(".cn-line");
    for (let k = 0; k < lines.length; k++) {
      const a = findBtns[k], c = findBtns[k + 1];
      if (a && c && a.dataset.found === "1" && c.dataset.found === "1") lines[k].style.opacity = "1";
    }
  }
  function armFind(ms) {
    window.clearTimeout(findTimer);
    findTimer = window.setTimeout(function () { if (phase === "find") autoFind(); }, ms || 9000);
  }
  function autoFind() { // nobody is left stuck in the dark — the sky finishes itself, kindly
    for (let i = 0; i < findBtns.length; i++) if (findBtns[i].dataset.found !== "1") findTap(i, findBtns[i], true);
    play.say("Look — there it is, hiding in the real sky!", 2600);
  }
  let mapsEarned = 0;
  function miniMap() {
    const line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
    const dots = pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.9" fill="#fff3a8"/>'; }).join("");
    return '<svg viewBox="0 0 100 70" style="width:66px;height:46px;flex:0 0 auto" aria-hidden="true"><path d="' + line +
      '" fill="none" stroke="#ffe35a" stroke-width="1.5" stroke-linecap="round"/>' + dots + "</svg>";
  }
  /* the collectible: a star-map for this constellation, saved on the device */
  function showMapCard() {
    mapsEarned = collect("star-maps", { name: sky.name, sp: sky.sp, stars: count, night: night, found: foundN });
    const card = document.createElement("div");
    card.className = "cn-mapcard";
    card.dataset.maps = String(mapsEarned); card.dataset.sky = sky.sp; card.dataset.myth = sky.myth;
    card.innerHTML = '<span class="cn-mapmini">' + miniMap() + '</span><div style="text-align:left"><b>Star-map #' + mapsEarned +
      " · " + escapeText(sky.name) + "</b><p style=\"margin:2px 0 0;font-weight:700;font-size:12.5px\">" + escapeText(sky.myth) + "</p></div>";
    card.style.cssText = "display:flex;gap:12px;align-items:center;justify-content:center;margin:10px auto 0;max-width:520px;padding:10px 14px;border-radius:18px;background:rgba(255,255,255,.94);box-shadow:0 5px 0 rgba(24,62,64,.18);color:#245048";
    board.appendChild(card);
    if (F.pop) F.pop(card);
    const shelf = board.querySelector("#cnMaps"); if (shelf) shelf.innerHTML = mapsShelf();
  }
  function setAct(n, done) {
    const c = board.querySelector("#cnActChip");
    if (c) c.textContent = done ? "Act 2 · found in the real sky!" : "Act " + n + " of 2 · " + (n === 1 ? "connect" : "real-sky hunt");
  }

  function blaze() {
    phase = "won"; locked = true;
    window.clearTimeout(findTimer); window.clearTimeout(idleTimer);
    skyEl.dataset.phase = "won";
    skyEl.classList.add("cn-won");
    svg.querySelectorAll(".cn-line").forEach(function (l) { l.classList.add("lit"); l.style.opacity = "1"; });
    stars.forEach(function (s) { s.style.opacity = ".5"; });
    findBtns.forEach(function (b) { b.style.pointerEvents = "none"; });
    decoys.forEach(function (d) { d.style.opacity = ""; });
    // close the shape with a last line from the final star back to the first for a finished look
    live.innerHTML = '<div class="cn-dino">' + F.dinoHTML(sky.sp, { color: sky.color, state: "happy", size: "100%" }) + "</div>";
    if (F.sfx) { F.sfx.win(); window.setTimeout(F.sfx.sparkle, 300); (sky.sp === "trex" ? F.sfx.roar : F.sfx.chirp)(); }
    const r = skyEl.getBoundingClientRect();
    if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 30 }); F.burst(r.left + r.width / 2, r.top, { kind: "sparkle", n: 24 }); }
    status.innerHTML = "<b>" + sky.name + "</b><br>" + sky.fact + "<br><em>Tap a shooting star to make a wish! 🌠</em>";
    play.say(sky.myth, 4200);
    phaseLine.textContent = "Act 2 done · all " + foundN + " stars found in the real sky!";
    setAct(2, true);
    showMapCard();
    for (let k = 0; k < 3; k++) window.setTimeout(function () {
      const s = document.createElement("i"); s.className = "cn-shoot"; s.style.top = (8 + Math.random() * 30) + "%"; skyEl.appendChild(s); window.setTimeout(function () { s.remove(); }, 1400);
    }, 600 + k * 900);
    // tappable wish stars: a tiny reward inside the win moment
    for (let w = 0; w < 3; w++) {
      const wish = document.createElement("button");
      wish.type = "button"; wish.className = "cn-star wish"; wish.innerHTML = "<span>🌠</span>";
      wish.style.left = (14 + Math.random() * 72) + "%"; wish.style.top = (10 + Math.random() * 34) + "%";
      wish.setAttribute("aria-label", "Make a wish");
      skyEl.appendChild(wish);
      if (F.anim) F.anim(wish, [{ opacity: 0, transform: "translate(-50%,-50%) scale(.2)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: 380, delay: 900 + w * 500, fill: "backwards" });
      wish.addEventListener("click", function () {
        if (wish.disabled) return;
        wish.disabled = true; wish.innerHTML = "<span>💫</span>";
        if (F.sfx) F.sfx.star();
        const wr = wish.getBoundingClientRect();
        if (F.burst) F.burst(wr.left + wr.width / 2, wr.top + wr.height / 2, { kind: "hearts", n: 10 });
        if (F.floatText) F.floatText(wr.left + wr.width / 2, wr.top, "Wish made! ✨");
        play.bonus();
      });
    }
    window.setTimeout(function () {
      play.finish("You joined all " + count + " stars, then picked the " + sky.name + " out of a crowded real night sky — star-map #" + mapsEarned + " is on your shelf!");
    }, 4200);
  }
}
