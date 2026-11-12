/* Shape Safari — a hidden-object meadow. Three to five shape missions per game (more as the rounds grow): find every
 * circle, triangle, star… hiding among the things in the meadow (some peek out from behind bushes). Found shapes fly
 * into the mission dots. Tap the wrong thing and a friendly dinosaur teaches you what shape it really is.
 *
 * The explorer kit is the part that grows: every round unlocks another tool (a magnifier that sweeps the grass, a
 * ghost outline to compare things against, a whistle that calls the shy golden critter), the rucksack fills up with
 * everything you found, and the meadow-watch line tells you how the weather is turning while you hunt. */
import { createPlay, shuffle, getExtras, collect, collection, escapeText } from "../adv-kit.js?v=du-8607dafbfd11334e";

const SHAPES = {
  circle: { name: "circle", plural: "circles", sides: "round, no corners", path: '<circle cx="20" cy="20" r="15"/>', items: ["☀️", "🏀", "🍊", "🪙", "🍪", "🔴", "🌕", "🎾", "⭕", "🧿"] },
  triangle: { name: "triangle", plural: "triangles", sides: "3 corners", path: '<path d="M20 5 L36 34 H4Z"/>', items: ["⛺", "🌲", "🔺", "🍕", "🏔️", "📐", "⛵"] },
  square: { name: "square", plural: "squares", sides: "4 equal sides", path: '<rect x="6" y="6" width="28" height="28" rx="2"/>', items: ["🎁", "📦", "🧊", "🟩", "🟦", "🧱", "🟨", "⬜"] },
  star: { name: "star", plural: "stars", sides: "5 pointy points", path: '<path d="M20 4 L24.6 15 L36 15.8 L27.4 23.4 L30 35 L20 28.8 L10 35 L12.6 23.4 L4 15.8 L15.4 15Z"/>', items: ["⭐", "🌟", "🌠", "💫", "✨", "🎆"] },
  heart: { name: "heart", plural: "hearts", sides: "two bumps and a point", path: '<path d="M20 35 C2 22 4 8 14 8 C18 8 20 11 20 13 C20 11 22 8 26 8 C36 8 38 22 20 35Z"/>', items: ["❤️", "💚", "💛", "💜", "🩷", "💙", "🤍", "🖤"] },
  diamond: { name: "diamond", plural: "diamonds", sides: "4 sides, pointy top and bottom", path: '<path d="M20 3 L35 20 L20 37 L5 20Z"/>', items: ["💎", "🔷", "🔶", "🪁", "💠", "♦️"] },
  crescent: { name: "crescent", plural: "crescents", sides: "a curved moon shape", path: '<path d="M26 5 A16 16 0 1 0 35 27 A13 13 0 1 1 26 5Z"/>', items: ["🌙", "🥐", "🍌", "🌜", "🌘", "🍤"] },
  rectangle: { name: "rectangle", plural: "rectangles", sides: "4 sides, two long and two short", path: '<rect x="3" y="11" width="34" height="18" rx="2"/>', items: ["🚪", "📕", "🍫", "📗", "🧈", "📱", "📏"] },
  oval: { name: "oval", plural: "ovals", sides: "round and stretched like an egg", path: '<ellipse cx="20" cy="20" rx="11" ry="16"/>', items: ["🥚", "🥑", "🥔", "🍆", "🫘", "🏈", "🍋"] }
};
const ORDER_EASY = ["circle", "triangle", "square", "star", "heart"];
const ORDER_ALL = Object.keys(SHAPES);
const outline = (key) => '<svg viewBox="0 0 40 40" class="ss-outline" aria-hidden="true">' + SHAPES[key].path + "</svg>";

export function mountShapeSafari(context) {
  const F = window.DUFX;
  const tier = context.challenge <= 2 ? 1 : context.challenge <= 5 ? 2 : 3;
  const TIER = ["Shape walk", "Shape scramble", "Safari expert"];
  const best = getExtras().best[(context.activity && context.activity.id) || "shapes"] || 0;
  const pool = context.challenge <= 2 ? ORDER_EASY : ORDER_ALL;
  const missions = shuffle(pool).slice(0, tier === 1 ? 3 : tier === 2 ? 4 : 5);
  const perMission = context.challenge <= 2 ? 3 : context.challenge <= 5 ? 4 : 5;
  const clutter = context.challenge <= 2 ? 9 : context.challenge <= 5 ? 12 : 15;
  /* the kit grows with the safari: tool N is unlocked from tier N onwards */
  const TOOLS = ["lens", "ghost", "call"];
  const unlocked = tier === 1 ? 1 : tier === 2 ? 2 : 3;
  const lensMax = tier === 1 ? 2 : tier === 2 ? 3 : 4;
  const goldWait = tier === 1 ? 8000 : tier === 2 ? 7000 : 6000;
  const journal = collection("safari").length;
  const play = createPlay(context, {
    emoji: "🔎", title: "Shape safari", theme: "meadow", buddy: ["tricera", "bronto", "stego"][context.level % 3],
    instruction: "Look all around the meadow. Tap every thing that has the shape you are hunting for!",
    hint: "Take your time. Some shapes hide behind the bushes!", allowed: 3
  });
  const chip = function (txt) { return '<span style="background:rgba(255,255,255,.92);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#245048">' + txt + "</span>"; };
  const board = play.board;
  /* kit buttons: the tools you have not reached yet are there but locked, so the growth is visible */
  const toolHTML = function (id, tool, emoji, name) {
    const open = TOOLS.indexOf(tool) < unlocked;
    return '<button type="button" class="pk-btn ss-tool" id="' + id + '" data-tool="' + tool + '" data-open="' + (open ? "1" : "0") +
      '" aria-pressed="false"' + (open ? "" : " disabled") + ' style="font-size:13px;padding:6px 11px;min-width:112px' +
      (open ? "" : ";opacity:.5") + '">' + (open ? emoji + " " + name : "🔒 " + name) + "</button>";
  };
  board.innerHTML = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 auto 8px">' +
    chip("Tier " + tier + " · " + TIER[tier - 1]) + chip(missions.length + " shape missions") + (best ? chip("Your best " + "⭐".repeat(best)) : chip("First safari — good luck!")) +
    chip("Explorer kit: " + unlocked + " of 3 tools 🧰") + (journal ? chip("Journal: " + journal + " safaris 📔") : "") + "</div>" +
    '<div class="ss-mission" id="ssMission"></div>' +
    '<div class="ss-kit" id="ssKit" data-tools="' + unlocked + '" data-lens-left="' + lensMax + '" data-alert="0" ' +
      'style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:0 auto 6px">' +
      toolHTML("ssLensBtn", "lens", "🔍", "Magnifier") + toolHTML("ssGhostBtn", "ghost", "👻", "Shape ghost") +
      toolHTML("ssCallBtn", "call", "🐛", "Critter whistle") +
      '<span class="ss-bag" id="ssBag" data-count="0" data-gold="0" aria-label="Your rucksack" ' +
        'style="display:inline-flex;gap:3px;align-items:center;background:rgba(255,255,255,.9);border-radius:14px;padding:4px 9px;font-size:17px;box-shadow:0 3px 0 rgba(24,62,64,.14)">🎒<b id="ssBagN" style="font-size:12.5px;color:#245048">0</b></span>' +
    "</div>" +
    '<div class="ss-replaycard" id="ssReplayCard" data-shape="" data-step="idle" ' +
      'style="min-height:56px;display:flex;gap:10px;align-items:center;justify-content:center;margin:0 auto 4px;max-width:540px"></div>' +
    '<div class="ss-meadow" id="ssMeadow"></div>' +
    '<p class="ss-watch" id="ssWatch" data-alert="0" style="text-align:center;margin:6px 0 0;font-weight:800;font-size:13px;color:#245048">🌤️ Meadow watch: bright, calm, everything in its place.</p>' +
    '<p class="ss-teach" id="ssTeach" data-shape="" data-target="" ' +
      'style="display:none;text-align:center;margin:6px auto 0;max-width:480px;background:#fff8e6;border-radius:16px;padding:8px 12px;font-weight:800;font-size:14px;color:#5a4a1f;box-shadow:0 4px 0 rgba(24,62,64,.12)"></p>' +
    '<p style="text-align:center;margin:8px 0 0"><button type="button" class="pk-btn" id="ssReplay">🔁 Show me that shape</button> ' +
      '<button type="button" class="pk-btn" id="ssHintBtn">💡 Show me one ×3</button></p>';
  const mission = board.querySelector("#ssMission"), meadow = board.querySelector("#ssMeadow");
  const kit = board.querySelector("#ssKit"), bag = board.querySelector("#ssBag"), bagN = board.querySelector("#ssBagN");
  const watchEl = board.querySelector("#ssWatch"), teachEl = board.querySelector("#ssTeach");
  const replayCard = board.querySelector("#ssReplayCard");
  const CARD_BASE = "min-height:56px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;margin:0 auto 4px;max-width:540px";
  let m = -1, found = 0, target = null, busy = false, hints = 3;
  let lensLeft = lensMax, lensTimer = 0, lensHits = 0, ghostOn = false;
  let alert = 0, bagCount = 0, goldCount = 0, goldEl = null, goldTimer = 0, goldLoop = 0;
  let teachTimer = 0, replayTimer = 0, whistleUsed = false;


  // the meadow wears a different face each tier: bees and a rainbow, then an owl and a dusky sky
  function scenery() {
    let s = '<span class="ss-sun">☀️</span><span class="ss-tree t1">🌳</span><span class="ss-tree t2">🌴</span><span class="ss-hill"></span><span class="ss-river"></span>';
    const abs = function (e, x, y, f) { return '<i style="position:absolute;left:' + x + '%;top:' + y + '%;font-size:' + f + 'px;opacity:.8;pointer-events:none">' + e + "</i>"; };
    if (tier >= 2) s += abs("🌈", 40, 3, 40) + abs("🐝", 20, 18, 24) + abs("🐝", 68, 12, 22) + abs("🍄", 6, 74, 26);
    if (tier >= 3) s += abs("🦉", 90, 8, 30) + abs("🌙", 80, 4, 30) + abs("🪨", 30, 80, 28) +
      '<span style="position:absolute;inset:0;background:linear-gradient(rgba(56,48,110,.24),transparent 55%);pointer-events:none"></span>';
    return s;
  }

  function nextMission() {
    m += 1;
    if (m >= missions.length) return finish();
    target = missions[m]; found = 0; busy = false;
    meadow._mission = target;
    mission.dataset.replays = "0";
    mission.dataset.mission = String(m + 1);
    lensLeft = lensMax; lensHits = 0; whistleUsed = false;
    stopLens(); setGhost(false); clearGold();
    kit.dataset.lensLeft = String(lensLeft);
    renderKit(); resetReplayCard();
    scheduleGold(goldWait);
    const S = SHAPES[target];
    mission.innerHTML = '<span class="ss-badge">' + outline(target) + '</span><span class="ss-ask">Mission ' + (m + 1) + " of " + missions.length + ': find the <b>' + S.plural + "</b></span><span class=\"ss-dots\" id=\"ssDots\"></span>";
    drawDots();
    mission.classList.remove("pulse"); void mission.offsetWidth; mission.classList.add("pulse");
    play.hint("A " + S.name + " is " + S.sides + ".", true);
    play.say("Find the " + S.plural + "! They are " + S.sides + ".", 3200);
    if (F.sfx && m > 0) F.sfx.chirp();
    layout();
  }
  function drawDots() { mission.querySelector("#ssDots").innerHTML = Array.from({ length: perMission }, function (_, i) { return '<i class="' + (i < found ? "on" : "") + '"></i>'; }).join(""); }

  function layout() {
    // targets of this shape + distractors of other shapes, on a jittered grid so nothing overlaps
    const targets = shuffle(SHAPES[target].items).slice(0, perMission);
    while (targets.length < perMission) targets.push(SHAPES[target].items[targets.length % SHAPES[target].items.length]);
    const others = [];
    shuffle(Object.keys(SHAPES).filter(function (k) { return k !== target; })).forEach(function (k) { shuffle(SHAPES[k].items).slice(0, 2).forEach(function (e) { others.push({ e: e, shape: k }); }); });
    const items = targets.map(function (e) { return { e: e, shape: target }; }).concat(others.slice(0, clutter));
    const cols = 6, rows = Math.ceil(items.length / cols) + 1;
    const cells = shuffle(Array.from({ length: cols * rows }, function (_, i) { return i; })).slice(0, items.length);
    meadow.innerHTML = scenery();
    meadow.style.setProperty("--rows", rows);
    items.forEach(function (it, i) {
      const c = cells[i], cx = c % cols, cy = Math.floor(c / cols);
      const b = document.createElement("button");
      b.type = "button"; b.className = "ss-item"; b.dataset.shape = it.shape;
      b.textContent = it.e;
      b.setAttribute("aria-label", "A meadow thing");
      b.style.left = (1 + (cx + 0.1 + Math.random() * 0.7) / cols * 90) + "%";
      b.style.top = (1 + (cy + 0.05 + Math.random() * 0.55) / rows * 88) + "%";
      b.style.setProperty("--d", (-Math.random() * 4).toFixed(2) + "s");
      b.style.fontSize = (34 + Math.random() * 14).toFixed(0) + "px";
      if (context.challenge >= 3 && Math.random() < 0.3) { b.classList.add("peek"); }
      meadow.appendChild(b);
      F.anim && F.anim(b, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 420, delay: i * 40, easing: "cubic-bezier(.2,.9,.3,1.4)" });
      b.addEventListener("click", function () { tap(b, it); });
    });
    overlays();
  }

  /* the meadow keeps three floating pieces of its own: a weather wash, the shape ghost and the magnifier glass.
     layout() rebuilds the grass each mission, so they are re-stamped on top every time. */
  let lensEl = null, ghostEl = null, weatherEl = null;
  function overlays() {
    weatherEl = document.createElement("i");
    weatherEl.className = "ss-weather"; weatherEl.id = "ssWeather"; weatherEl.dataset.alert = String(alert);
    weatherEl.style.cssText = "position:absolute;inset:0;z-index:1;pointer-events:none;transition:background .8s;" + weatherBg();
    meadow.appendChild(weatherEl);
    ghostEl = document.createElement("div");
    ghostEl.className = "ss-ghost"; ghostEl.id = "ssGhost"; ghostEl.dataset.shape = target || "";
    ghostEl.innerHTML = outline(target || "circle") + '<b style="display:block;font-size:12px;letter-spacing:.4px">compare me with the things you find</b>';
    ghostEl.style.cssText = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:190px;height:210px;z-index:6;" +
      "display:grid;place-items:center;gap:2px;pointer-events:none;opacity:0;transition:opacity .35s;color:#fff;text-align:center";
    ghostEl.querySelector(".ss-outline").style.cssText = "width:150px;height:150px;fill:rgba(255,255,255,.34);stroke:#fff;stroke-width:2.4;filter:drop-shadow(0 4px 6px rgba(0,60,40,.35))";
    meadow.appendChild(ghostEl);
    lensEl = document.createElement("div");
    lensEl.className = "ss-lens"; lensEl.id = "ssLens"; lensEl.dataset.on = "0";
    lensEl.style.cssText = "position:absolute;width:132px;height:132px;border-radius:50%;z-index:7;pointer-events:none;" +
      "left:-999px;top:-999px;opacity:0;transition:opacity .2s;background:radial-gradient(circle,rgba(255,255,255,.34) 0 62%,rgba(255,255,255,.06) 72%,transparent 74%);" +
      "box-shadow:0 0 0 5px rgba(255,255,255,.85),0 0 0 8px rgba(36,80,72,.35),0 10px 22px rgba(0,60,40,.3);transform:translate(-50%,-50%)";
    meadow.appendChild(lensEl);
    if (ghostOn) ghostEl.style.opacity = ".92";
  }
  function weatherBg() {
    if (alert >= 5) return "background:linear-gradient(rgba(40,44,90,.42),rgba(30,50,70,.3))";
    if (alert >= 4) return "background:linear-gradient(rgba(60,70,120,.32),rgba(40,60,80,.2))";
    if (alert >= 3) return "background:linear-gradient(rgba(70,90,130,.22),rgba(60,80,90,.12))";
    if (alert >= 2) return "background:linear-gradient(rgba(90,110,140,.14),transparent 60%)";
    return "background:none";
  }
  function setAlert(n) {
    alert = Math.max(0, Math.min(6, n));
    kit.dataset.alert = String(alert);
    watchEl.dataset.alert = String(alert);
    meadow.dataset.alert = String(alert);
    if (weatherEl) weatherEl.style.background = weatherBg();
    const lines = [
      "🌤️ Meadow watch: bright, calm, everything in its place.",
      "🌥️ Meadow watch: a cloud drifts by. Keep going!",
      "💨 Meadow watch: the grass is rustling — shapes are harder to spot.",
      "🌧️ Meadow watch: soft rain! The critters are huddling in.",
      "🌫️ Meadow watch: misty now. Use your kit, explorer!",
      "🌙 Meadow watch: nearly dark — but your torch still works. You are almost home."
    ];
    watchEl.innerHTML = lines[Math.min(lines.length - 1, alert)];
    if (alert >= 4) meadow.querySelectorAll(".ss-item.peek:not(.got)").forEach(function (x) { x.style.opacity = ".72"; });
  }

  function tap(b, it) {
    if (busy || b.classList.contains("got")) return;
    if (it.shape === target) {
      b.classList.add("got"); b.disabled = true; found += 1; drawDots();
      b.classList.remove("ss-under", "ss-hot", "peek");
      b.style.boxShadow = ""; b.style.opacity = ""; b.style.scale = ""; b.style.zIndex = ""; b.style.textShadow = "";
      addToBag(it.e, false);
      const dot = mission.querySelector(".ss-dots i:nth-child(" + found + ")");
      if (F.flyTo && dot) F.flyTo(b, dot, { emoji: it.e, size: 34, burst: false, duration: 520 });
      play.good(b, { text: found === perMission ? "All the " + SHAPES[target].plural + "!" : null });
      if (found >= perMission) {
        busy = true;
        if (F.sfx) F.sfx.sparkle();
        setAlert(alert - 1);
        clearGold();
        const br = mission.querySelector(".ss-badge").getBoundingClientRect();
        if (F.burst) F.burst(br.left + br.width / 2, br.top + br.height / 2, { kind: "stars", n: 12 });
        window.setTimeout(function () { play.say("Mission complete! 🎉", 1800); nextMission(); }, 1300);
      }
    } else {
      const S = SHAPES[it.shape];
      b.classList.add("nope");
      window.setTimeout(function () { b.classList.remove("nope"); }, 500);
      showTeach(it);
      setAlert(alert + 1);
      play.miss(b, "That's a " + S.name + " (" + S.sides + "). Look for " + SHAPES[target].plural + "!");
    }
  }

  /* ---- the rucksack: everything this safari has actually found, and the saved journal it goes into ---- */
  function addToBag(glyph, gold) {
    bagCount += 1;
    if (gold) goldCount += 1;
    bag.dataset.count = String(bagCount);
    bag.dataset.gold = String(goldCount);
    bagN.textContent = String(bagCount);
    const s = document.createElement("span");
    s.className = gold ? "ss-bagitem ss-baggold" : "ss-bagitem";
    s.dataset.shape = gold ? "golden" : target;
    s.textContent = glyph;
    if (gold) s.style.cssText = "filter:drop-shadow(0 0 5px #ffd45e)";
    bag.appendChild(s);
    F.pop && F.pop(bag);
    if (replayCard.dataset.step === "idle") resetReplayCard();
  }

  /* ---- the teaching card that pops up after a wrong guess: it names both shapes out loud ---- */
  function showTeach(it) {
    const W = SHAPES[it.shape], T = SHAPES[target];
    teachEl.dataset.shape = it.shape;
    teachEl.dataset.target = target;
    teachEl.dataset.glyph = it.e;
    teachEl.style.display = "block";
    teachEl.innerHTML = '<b>' + it.e + " is a " + W.name + "</b> — " + escapeText(W.sides) +
      '.<br>You are hunting <b>' + escapeText(T.plural) + "</b> — " + escapeText(T.sides) + ". 👀";
    window.clearTimeout(teachTimer);
    teachTimer = window.setTimeout(function () { teachEl.style.display = "none"; }, 4200);
  }

  board.querySelector("#ssHintBtn").addEventListener("click", function () {
    if (busy || !hints || !target) return;
    const hiding = Array.prototype.slice.call(meadow.querySelectorAll('.ss-item[data-shape="' + target + '"]:not(.got)'));
    if (!hiding.length) return;
    hints -= 1;
    const btn = board.querySelector("#ssHintBtn");
    btn.innerHTML = hints ? "💡 Show me one ×" + hints : "💡 No more hints";
    if (!hints) btn.disabled = true;
    const el = hiding[Math.floor(Math.random() * hiding.length)];
    F.wiggle && F.wiggle(el);
    const r = el.getBoundingClientRect();
    if (F.floatText) F.floatText(r.left + r.width / 2, r.top - 8, "👀");
    if (F.sfx) F.sfx.tap();
    play.say("Sneaky one! Look near the wiggly thing. 👀", 2400);
  });
  /* ============================ the explorer kit ============================ */
  function isOpen(tool) { return TOOLS.indexOf(tool) < unlocked; }
  function renderKit() {
    const lb = board.querySelector("#ssLensBtn");
    if (lb && isOpen("lens")) {
      lb.innerHTML = "🔍 Magnifier ×" + lensLeft;
      lb.disabled = lensLeft <= 0;
    }
    const cb = board.querySelector("#ssCallBtn");
    if (cb && isOpen("call")) {
      cb.innerHTML = whistleUsed ? "🐛 Whistle resting" : "🐛 Critter whistle";
      cb.disabled = whistleUsed || busy;
    }
    if (replayCard.dataset.step === "idle") resetReplayCard();
  }
  function startLens() {
    if (!isOpen("lens") || busy || !target || lensLeft <= 0) return;
    lensLeft -= 1;
    kit.dataset.lensLeft = String(lensLeft);
    if (lensEl) { lensEl.dataset.on = "1"; lensEl.style.opacity = "1"; }
    meadow.dataset.lens = "on";
    const lb = board.querySelector("#ssLensBtn");
    if (lb) lb.setAttribute("aria-pressed", "true");
    F.sfx && F.sfx.tap();
    play.say("Magnifier up! Sweep it over the grass — it clears the leaves and rings a bell on your shape!", 3000);
    renderKit();
    window.clearTimeout(lensTimer);
    lensTimer = window.setTimeout(stopLens, 7000);
  }
  function stopLens() {
    window.clearTimeout(lensTimer); lensTimer = 0;
    if (lensEl) { lensEl.dataset.on = "0"; lensEl.style.opacity = "0"; lensEl.style.left = "-999px"; lensEl.style.top = "-999px"; }
    meadow.dataset.lens = "off";
    const lb = board.querySelector("#ssLensBtn");
    if (lb) lb.setAttribute("aria-pressed", "false");
    eachItem(function (b) {
      if (b.classList.contains("ss-under")) { b.classList.remove("ss-under"); b.style.scale = ""; b.style.textShadow = ""; }
    });
  }
  /* the glass really does change the screen: under it the leaves are pushed aside and your own shape lights up */
  function sweepLens(clientX, clientY) {
    if (!lensEl || lensEl.dataset.on !== "1" || !target) return;
    const r = meadow.getBoundingClientRect();
    const x = clientX - r.left, y = clientY - r.top;
    lensEl.style.left = x + "px"; lensEl.style.top = y + "px";
    eachItem(function (b) {
      const br = b.getBoundingClientRect();
      const cx = br.left - r.left + br.width / 2, cy = br.top - r.top + br.height / 2;
      if (Math.abs(cx - x) < 64 && Math.abs(cy - y) < 64) {
        if (!b.classList.contains("ss-under")) {
          b.classList.add("ss-under"); b.classList.remove("peek");
          b.style.scale = "1.35"; b.style.zIndex = "3"; b.style.textShadow = "0 0 14px rgba(255,255,255,.95)";
        }
        if (b.dataset.shape === target && !b.classList.contains("ss-hot")) {
          b.classList.add("ss-hot");
          b.style.boxShadow = "0 0 0 4px rgba(255,212,94,.95), 0 0 20px rgba(255,190,50,.9)";
          b.style.borderRadius = "16px";
          lensHits += 1; meadow.dataset.lensHits = String(lensHits);
          if (F.sfx && F.sfx.star) F.sfx.star(); else if (F.sfx) F.sfx.pop();
          play.say("There it is! That is a " + SHAPES[target].name + " — " + SHAPES[target].sides + ". Tap it!", 2200);
        }
      } else if (b.classList.contains("ss-under")) {
        b.classList.remove("ss-under"); b.style.scale = ""; b.style.textShadow = "";
      }
    });
  }
  function eachItem(fn) {
    const list = meadow.querySelectorAll(".ss-item:not(.got)");
    for (let i = 0; i < list.length; i++) fn(list[i]);
  }
  /* the ghost: a big soft print of the mission shape you can hold up against anything in the meadow */
  function setGhost(on) {
    ghostOn = !!on && isOpen("ghost");
    meadow.dataset.ghost = ghostOn ? "on" : "off";
    if (ghostEl) ghostEl.style.opacity = ghostOn ? ".92" : "0";
    const gb = board.querySelector("#ssGhostBtn");
    if (gb) gb.setAttribute("aria-pressed", ghostOn ? "true" : "false");
  }
  /* "show me that shape" — replay the mission as a drawn outline. Free: it never costs a star. */
  function resetReplayCard() {
    window.clearTimeout(replayTimer);
    replayCard.dataset.shape = target || "";
    replayCard.dataset.step = "idle";
    replayCard.style.cssText = CARD_BASE;
    replayCard.innerHTML = target
      ? '<span style="font-weight:800;font-size:12.5px;color:#245048;opacity:.85">🎒 ' + bagCount +
        " in the bag · mission " + (m + 1) + " of " + missions.length +
        " · 🔍 " + lensLeft + " look" + (lensLeft === 1 ? "" : "s") + " left" +
        (ghostOn ? " · 👻 shape print up" : "") + "</span>"
      : "";
    replayCard.dataset.bag = String(bagCount);
  }
  function playReplay() {
    if (!target) return;
    const S = SHAPES[target];
    mission.dataset.replays = String(Number(mission.dataset.replays || 0) + 1);
    replayCard.dataset.shape = target;
    replayCard.dataset.step = "drawing";
    const example = S.items[Math.floor(Math.random() * S.items.length)];
    replayCard.innerHTML = '<span class="ss-replayglyph" style="font-size:34px">' + example + "</span>" + outline(target) +
      '<b class="ss-replaytext" style="font-size:15px;color:#245048">A ' + S.name + " is <u>" + S.sides + "</u></b>";
    replayCard.style.cssText = CARD_BASE + ";background:rgba(255,255,255,.92);border-radius:18px;padding:6px 12px;box-shadow:0 4px 0 rgba(24,62,64,.13)";
    const svg = replayCard.querySelector(".ss-outline");
    if (svg) {
      svg.style.cssText = "width:56px;height:56px;fill:rgba(255,212,94,.5);stroke:#e8952f;stroke-width:3";
      const bit = svg.firstElementChild;
      if (bit && F.anim) {
        bit.style.strokeDasharray = "150";
        F.anim(bit, [{ strokeDashoffset: 150 }, { strokeDashoffset: 0 }], { duration: 1200, easing: "ease-out" });
      }
    }
    if (F.sfx && F.sfx.chirp) F.sfx.chirp();
    play.say("Look! A " + S.name + " — " + S.sides + ". Like the " + example + "!", 2800);
    window.clearTimeout(replayTimer);
    replayTimer = window.setTimeout(resetReplayCard, 6500);
  }
  /* the shy golden critter: a bit of hurry that can only ever add something nice */
  function scheduleGold(ms) {
    window.clearTimeout(goldTimer);
    goldTimer = window.setTimeout(function () {
      if (!board.isConnected || !target) return;
      if (busy) { scheduleGold(1600); return; }
      spawnGold();
    }, ms);
  }
  function spawnGold() {
    if ((goldEl && goldEl.isConnected) || busy || !target) return;
    const who = ["🐞", "🦋", "🐌", "🦗", "🐛", "🪲", "🦎"][Math.floor(Math.random() * 7)];
    const b = document.createElement("button");
    b.type = "button"; b.className = "ss-gold"; b.dataset.tapped = "0"; b.dataset.critter = who;
    b.textContent = who;
    b.setAttribute("aria-label", "A shiny golden critter — tap it!");
    b.style.cssText = "position:absolute;z-index:8;border:0;cursor:pointer;width:58px;height:58px;border-radius:50%;font-size:31px;" +
      "background:rgba(255,248,214,.95);box-shadow:0 0 0 4px rgba(255,212,94,.95),0 0 22px rgba(255,190,50,.85),0 6px 12px rgba(0,60,40,.3);" +
      "left:" + (8 + Math.random() * 72).toFixed(1) + "%;top:" + (12 + Math.random() * 62).toFixed(1) + "%;transition:opacity .6s, transform .6s";
    b.addEventListener("click", function () { tapGold(b); });
    meadow.appendChild(b);
    goldEl = b;
    meadow.dataset.goldState = "here";
    if (F.sfx && F.sfx.chirp) F.sfx.chirp();
    play.say("Ooh — a shiny golden critter! Tap it before it scurries off!", 2400);
    window.clearTimeout(goldLoop);
    goldLoop = window.setTimeout(function () { scurryOff(b); }, 5200);
  }
  function scurryOff(b) {
    if (!b.isConnected || b.dataset.tapped === "1") return;
    b.style.opacity = "0"; b.style.transform = "translateY(-22px) scale(.55)";
    meadow.dataset.goldState = "gone";
    window.setTimeout(function () { if (b.isConnected) b.remove(); if (goldEl === b) goldEl = null; }, 700);
    play.say("It scurried into the grass — never mind, another one will come! 💨", 2200);
  }
  function tapGold(b) {
    if (b.dataset.tapped === "1") return;
    b.dataset.tapped = "1";
    window.clearTimeout(goldLoop);
    addToBag("✨", true);
    meadow.dataset.gold = String(goldCount);
    meadow.dataset.goldState = "caught";
    const r = b.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 16 });
    if (F.floatText && F.motionOK && F.motionOK()) F.floatText(r.left + r.width / 2, r.top - 10, "Golden!");
    play.good(b, { text: null });
    b.style.opacity = "0"; b.style.transform = "scale(.4) rotate(20deg)";
    window.setTimeout(function () { if (b.isConnected) b.remove(); if (goldEl === b) goldEl = null; }, 600);
  }
  function clearGold() {
    window.clearTimeout(goldTimer); window.clearTimeout(goldLoop);
    if (goldEl && goldEl.isConnected) goldEl.remove();
    goldEl = null;
  }

  board.querySelector("#ssLensBtn").addEventListener("click", startLens);
  board.querySelector("#ssGhostBtn").addEventListener("click", function () {
    if (!isOpen("ghost") || !target) return;
    setGhost(!ghostOn);
    F.sfx && F.sfx.sparkle();
    play.say(ghostOn ? "There is the " + SHAPES[target].name + " print! Hold it up against the things you see." : "Ghost away. Off you go!", 2600);
  });
  board.querySelector("#ssCallBtn").addEventListener("click", function () {
    if (!isOpen("call") || whistleUsed || busy) return;
    whistleUsed = true;
    renderKit();
    spawnGold();
  });
  board.querySelector("#ssReplay").addEventListener("click", playReplay);
  meadow.addEventListener("pointermove", function (e) { sweepLens(e.clientX, e.clientY); });
  meadow.addEventListener("pointerdown", function (e) { sweepLens(e.clientX, e.clientY); });

  function finish() {
    clearGold(); stopLens();
    window.clearTimeout(goldTimer); window.clearTimeout(lensTimer); window.clearTimeout(replayTimer); window.clearTimeout(teachTimer);
    meadow.querySelectorAll(".ss-item,.ss-gold").forEach(function (x) { if (x.classList.contains("ss-gold")) x.remove(); else x.disabled = true; });
    kit.dataset.lensLeft = "0";
    const lr = board.querySelector("#ssLensBtn"); if (lr) lr.disabled = true;
    const cr = board.querySelector("#ssCallBtn"); if (cr && isOpen("call")) cr.disabled = true;
    const rr = board.querySelector("#ssReplay"); if (rr) rr.disabled = true;
    const names = missions.map(function (k) { return SHAPES[k].plural; });
    let log = null;
    try {
      collect("safari", { tier: tier, level: context.level, shapes: names, found: bagCount - goldCount, gold: goldCount, alerts: alert, tools: unlocked });
      log = collection("safari");
    } catch (e) { /* a saved journal is a nice-to-have */ }
    const r = meadow.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "confetti", n: 40 });
    replayCard.dataset.step = "logged";
    replayCard.dataset.shape = names.join(",");
    replayCard.style.cssText = "min-height:56px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;margin:0 auto 4px;" +
      "max-width:540px;background:rgba(255,255,255,.94);border-radius:18px;padding:8px 14px;box-shadow:0 4px 0 rgba(24,62,64,.13);font-weight:800;color:#245048";
    replayCard.innerHTML = "🎒 " + bagCount + " in the bag" + (goldCount ? " · " + goldCount + " golden ✨" : "") +
      (log ? " · 📔 safari " + log.length + " saved" : "");
    play.finish("You hunted " + names.join(", ") + " — " + missions.length * perMission + " shapes in all" +
      (goldCount ? ", plus " + goldCount + " shy golden " + (goldCount === 1 ? "critter" : "critters") + "!" : "!") +
      " Your rucksack has " + bagCount + " things and the safari is in your journal. 📔");
  }
  nextMission();
}
