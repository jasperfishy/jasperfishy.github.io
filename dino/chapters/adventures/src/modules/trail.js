/* Footprint Trail — follow a winding line of giant footprints in order (counting by ones, then twos, then with the
 * numbers hidden), and a little tracker dinosaur trots along behind you. At the end of the trail a shadowy mystery
 * dinosaur is hiding in the bush: who made these tracks? Big feet, small feet, three toes, round toes — look closely!
 * Three tiers grow with the rounds: more footprints, a duskier field, and a speed time kept for next time.
 * New this version: hazards really are in the way — mud, a river and a fallen log rise up ahead of you as you walk.
 * Tap one to lay a stepping stone and bank a footprint token (saved on this device); walk straight into it and you
 * get mud on your boots instead. The last badge you earn is read out when the trail ends. */
import { createPlay, shuffle, getExtras, collect, collection } from "../adv-kit.js?v=du-556d96214a55198f";

const MAKERS = [
  { sp: "trex", color: "green", name: "Tyrannosaurus", print: "toes", size: 64, fact: "Three big toes, just like a giant bird!" },
  { sp: "tricera", color: "teal", name: "Triceratops", print: "round", size: 58, fact: "Wide, round feet to carry a heavy body." },
  { sp: "stego", color: "purple", name: "Stegosaurus", print: "round", size: 52, fact: "Stegosaurus walked on four sturdy legs." },
  { sp: "bronto", color: "orange", name: "Brontosaurus", print: "round", size: 74, fact: "Enormous round feet, as big as a table!" },
  { sp: "raptor", color: "red", name: "Velociraptor", print: "toes", size: 42, fact: "Small, quick feet with a sneaky sickle claw." },
  { sp: "ptero", color: "blue", name: "Pteranodon", print: "toes", size: 38, fact: "Light, long toes — it even perched high in the trees." }
];
const PRINT = {
  toes: '<svg viewBox="0 0 40 48"><ellipse cx="20" cy="39" rx="10" ry="8"/><ellipse cx="20" cy="15" rx="5.6" ry="13"/><ellipse cx="8.5" cy="23" rx="5" ry="11" transform="rotate(-30 8.5 23)"/><ellipse cx="31.5" cy="23" rx="5" ry="11" transform="rotate(30 31.5 23)"/></svg>',
  round: '<svg viewBox="0 0 40 48"><ellipse cx="20" cy="30" rx="15" ry="14"/><ellipse cx="7" cy="12" rx="4.2" ry="5.4"/><ellipse cx="16" cy="7" rx="4.2" ry="5.6"/><ellipse cx="25" cy="7" rx="4.2" ry="5.6"/><ellipse cx="33" cy="12" rx="4.2" ry="5.4"/></svg>'
};

/* What is lying in the way: tap it to lay a safe crossing (and bank a footprint token),
 * or step straight in and get mud, water or bark all over the tracker. */
const HAZARDS = {
  mud: { icon: "🟤", fix: "🪨", word: "sticky mud", sfx: "splash", step: "Squelch! Sticky mud all over your boots 🥾" },
  river: { icon: "🌊", fix: "🪵", word: "a cold river", sfx: "splash", step: "Splosh! Cold river water in your socks 🌊" },
  log: { icon: "🪵", fix: "🌿", word: "a fallen log", sfx: "thud", step: "Oof! You tumbled over the fallen log 🪵" }
};
const HAZ_IDS = ["mud", "river", "log"];
const TOKENS_KEY = "trail-tokens"; // saved inside du-adv-extras-v1 via collect()

export function mountTrail(context) {
  const F = window.DUFX;
  const maker = MAKERS[(context.level - 1) % MAKERS.length];
  const count = Math.min(14, 6 + context.challenge);
  const step = context.challenge >= 5 && context.challenge < 8 ? 2 : 1;
  const hideNumbers = context.challenge >= 8;
  const tier = context.challenge <= 2 ? 1 : context.challenge <= 5 ? 2 : 3;
  const TIER = ["Walk the line", "Count by twos", "Shadow trail"];
  const best = getExtras().best[(context.activity && context.activity.id) || "trail"] || 0;
  const times = collection("trail-times");
  const bestTime = times.length ? Math.min.apply(null, times.map(function (t) { return t.s; })) : 0;
  const tokenBank = collection(TOKENS_KEY); // every footprint token this child has ever laid down
  const hazTotal = Math.min(4, 1 + Math.floor(context.challenge / 2)); // more the trail grows, more lies in the way
  const chip = function (txt) { return '<span style="background:rgba(255,255,255,.92);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#245048">' + txt + "</span>"; };
  const play = createPlay(context, {
    emoji: "👣", title: "Footprint trail", theme: "dig", buddy: false, wander: false,
    instruction: hideNumbers ? "Follow the trail of footprints from the start, one after another." : step === 2 ? "Count by twos! Tap 2, 4, 6… along the footprints." : "Tap the footprints in number order to follow the trail.",
    hint: "Start with the first footprint, near the little flag.", allowed: 2
  });
  const board = play.board;
  board.innerHTML = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 auto 8px">' +
    chip("Tier " + tier + " · " + TIER[tier - 1]) + chip(count + " footprints") +
    chip("Hazards <b id='trHazTotal'>" + hazTotal + "</b> · Tokens 🐾<b id='trTokenTotal'>" + tokenBank.length + "</b>") +
    (bestTime ? chip("Best time " + bestTime + "s") : "") + (best ? chip("Your best " + "⭐".repeat(best)) : "") + "</div>" +
    '<div id="trHaz" data-cleared="0" data-total="' + hazTotal + '" data-muddy="0" style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:0 auto 6px">' +
    '<span style="font-weight:900;font-size:12px;color:#245048">In the way: <b id="trHazLeft">' + hazTotal + "</b> to step around</span>" +
    '<span id="trTokens" aria-label="Footprint tokens" style="display:flex;gap:3px;align-items:center;min-height:22px"></span>' +
    '<span id="trBadge" hidden></span></div>' +
    '<div class="tr-field"><span class="tr-flag" aria-hidden="true">🚩</span><span class="tr-bush" aria-hidden="true">🌳</span><span class="tr-deco d1" aria-hidden="true">🪨</span><span class="tr-deco d2" aria-hidden="true">🌿</span><span class="tr-deco d3" aria-hidden="true">🪨</span><span class="tr-deco d4" aria-hidden="true">🌴</span>' +
    (tier >= 2 ? '<i style="position:absolute;left:52%;top:4%;font-size:30px;pointer-events:none">🍄</i><i style="position:absolute;left:70%;top:90%;font-size:26px;pointer-events:none">🌼</i><i style="position:absolute;left:14%;top:88%;font-size:26px;pointer-events:none">🦋</i>' : "") +
    (tier >= 3 ? '<i style="position:absolute;left:86%;top:6%;font-size:30px;pointer-events:none">🌙</i><i style="position:absolute;left:34%;top:6%;font-size:22px;pointer-events:none">✨</i><span style="position:absolute;inset:0;background:linear-gradient(rgba(50,44,104,.26),transparent 60%);pointer-events:none"></span>' : "") +
    '<div class="tr-tracker" id="trTracker"></div><div class="tr-mystery" id="trMystery" hidden></div></div><div class="tr-quiz" id="trQuiz" hidden></div>' +
    '<p style="text-align:center;margin:8px 0 0"><button type="button" class="pk-btn" id="trHelp">🔎 Show the next footprint ×3</button></p>';
  const field = board.querySelector(".tr-field"), tracker = board.querySelector("#trTracker"), quiz = board.querySelector("#trQuiz"), mystery = board.querySelector("#trMystery");
  const tokenBar = board.querySelector("#trTokens"), badgeEl = board.querySelector("#trBadge");
  tracker.innerHTML = F.dinoHTML("raptor", { color: "yellow", state: "idle", size: "100%" });
  // path points (percent of the field): a winding line, footprints evenly spaced along it
  const REF = 500, wantGap = Math.min(maker.size * 1.0, 60);
  let pts = [], gap = wantGap;
  for (let k = 1.1; k <= 5; k += 0.15) {
    const curve = []; let len = 0;
    for (let i = 0; i <= 400; i++) {
      const t = i / 400, x = 9 + t * 70, y = 50 + Math.sin(t * Math.PI * 2 * k + 0.4) * 30 * (1 - Math.abs(t - 0.5) * 0.3);
      if (curve.length) { const q = curve[curve.length - 1]; len += Math.hypot((x - q[0]) * REF / 100, (y - q[1]) * REF * 0.6667 / 100); }
      curve.push([x, y, len]);
    }
    if (len / (count - 1) >= wantGap * 1.1 || k > 4.9) {
      gap = Math.min(wantGap, len / (count - 1) / 1.1);
      pts = [];
      for (let i = 0; i < count; i++) { const target = len * i / (count - 1); const q = curve.find(function (c) { return c[2] >= target; }) || curve[curve.length - 1]; pts.push([q[0], q[1]]); }
      break;
    }
  }
  const prints = pts.map(function (p, i) {
    const a = pts[Math.min(count - 1, i + 1)], b = pts[Math.max(0, i - 1)];
    const ang = Math.atan2((a[1] - b[1]) * 0.66, a[0] - b[0]) * 180 / Math.PI + 90;
    const off = (i % 2 ? 1 : -1) * 3.6;
    const el = document.createElement("button");
    el.type = "button"; el.className = "tr-print" + (i % 2 ? " right" : " left");
    el.style.left = p[0] + "%"; el.style.top = (p[1] + off) + "%";
    el.style.setProperty("--rot", ang + "deg"); el.style.setProperty("--s", Math.max(30, gap) + "px");
    const num = (i + 1) * step;
    el.dataset.n = String(i);
    el.setAttribute("aria-label", "Footprint " + (hideNumbers ? "number " + (i + 1) : num));
    el.innerHTML = '<span class="tr-shape">' + PRINT[maker.print] + '</span>' + (hideNumbers ? "" : '<b class="tr-num">' + num + "</b>");
    field.appendChild(el);
    return el;
  });
  let next = 0, hintTimer = 0, helps = 3;
  const t0 = Date.now();
  board.querySelector("#trHelp").addEventListener("click", function () {
    if (!helps || next >= count) return;
    helps -= 1;
    const btn = board.querySelector("#trHelp");
    btn.innerHTML = helps ? "🔎 Show the next footprint ×" + helps : "🔎 No more peeks";
    if (!helps) btn.disabled = true;
    prints[next].classList.add("hint");
    F.sfx && F.sfx.tap();
    play.say(hideNumbers ? "This glowing one is next!" : "Look for number " + (next + 1) * step + "!", 2600);
  });
  function place(i, instant) {
    const p = pts[i]; if (!p) return;
    tracker.style.left = (p[0] - 4) + "%"; tracker.style.top = (p[1] - 14) + "%";
  }
  tracker.style.transition = "left .55s ease-in-out, top .55s ease-in-out";
  place(0);
  prints[0].classList.add("next");
  function armHint() {
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(function () {
      if (next < count) { prints[next].classList.add("hint"); play.say(hideNumbers ? "Try the glowing footprint!" : "Look for number " + (next + 1) * step + "!", 2800); }
    }, 6000);
  }
  armHint();
  /* ---- what lies in the way: hazards rise up ahead of the walker, one more every round ---- */
  const hazAt = [];
  for (let k = 0; k < hazTotal; k++) {
    let idx = Math.round(count * (k + 1) / (hazTotal + 1)) - 1 + (k % 2);
    idx = Math.max(1, Math.min(count - 2, idx));
    while (idx < count - 1 && hazAt.indexOf(idx) >= 0) idx += 1;
    if (idx <= count - 2 && hazAt.indexOf(idx) < 0) hazAt.push(idx);
  }
  const hazDefs = hazAt.map(function (idx, k) {
    return { i: idx, def: HAZARDS[HAZ_IDS[(idx + k) % HAZ_IDS.length]], shown: false, cleared: false, passed: false, btn: null };
  });
  let clearedHaz = 0, muddy = 0;
  function lookAhead() { return Math.max(1, 3 - Math.floor(next / 5)); } // the further you walk, the sooner you see what is coming
  function paintHaz() {
    const bar = board.querySelector("#trHaz");
    bar.dataset.cleared = String(clearedHaz);
    bar.dataset.muddy = String(muddy);
    bar.dataset.total = String(hazDefs.length);
    const cap = board.querySelector("#trHazTotal"); if (cap) cap.textContent = String(hazDefs.length);
    const left = board.querySelector("#trHazLeft");
    if (left) left.textContent = String(hazDefs.filter(function (h) { return !h.cleared && !h.passed; }).length);
  }
  function addToken(id) {
    const s = document.createElement("span");
    s.className = "tr-token"; s.dataset.token = id; s.textContent = "🐾"; s.setAttribute("aria-hidden", "true");
    s.style.cssText = "display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#fff;font-size:13px;box-shadow:0 2px 0 rgba(24,62,64,.18)";
    tokenBar.appendChild(s); F.pop && F.pop(s);
  }
  function spawnHaz(h) {
    const p = pts[h.i]; if (!p) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "tr-hazard";
    b.dataset.hazard = h.def.id; b.dataset.i = String(h.i); b.dataset.cleared = "0";
    b.setAttribute("aria-label", "Step around the " + h.def.word);
    b.textContent = h.def.icon;
    b.style.cssText = "position:absolute;left:" + (p[0] + 7).toFixed(1) + "%;top:" + (p[1] - 8).toFixed(1) +
      "%;transform:translate(-50%,-50%);width:32px;height:32px;padding:0;border:0;border-radius:50%;background:#fff;" +
      "box-shadow:0 3px 0 rgba(24,62,64,.22);font-size:19px;cursor:pointer;z-index:3";
    field.appendChild(b);
    h.btn = b; h.shown = true;
    F.pop && F.pop(b);
    b.addEventListener("click", function () { clearHaz(h); });
    play.say("Careful — " + h.def.word + " across the trail! Tap it to lay a crossing. " + h.def.icon, 2800);
    play.hint("Tap the " + h.def.icon + " " + h.def.word + " to step around it, then carry on walking!", true);
    if (F.sfx) F.sfx.chirp();
  }
  function clearHaz(h) {
    if (h.cleared || h.passed || !h.btn) return;
    h.cleared = true; clearedHaz += 1;
    h.btn.classList.add("cleared");
    h.btn.dataset.cleared = "1";
    h.btn.textContent = h.def.fix;
    h.btn.disabled = true;
    h.btn.style.pointerEvents = "none";
    h.btn.style.boxShadow = "0 0 0 3px #ffd45e, 0 3px 0 rgba(24,62,64,.22)";
    if (F.sfx) F.sfx[h.def.sfx]();
    const r = h.btn.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "sparkle", n: 12 });
    const n = collect(TOKENS_KEY, { h: h.def.id, at: h.i, maker: maker.sp });
    addToken(h.def.id);
    const tot = board.querySelector("#trTokenTotal"); if (tot) tot.textContent = String(n);
    play.good(h.btn, { text: "Safe!" });
    play.say("A " + (h.def.id === "river" ? "log bridge" : h.def.id === "log" ? "mossy step" : "dry stone") + "! Footprint token 🐾 " + n + " is yours.", 2800);
    paintHaz();
    if (hazDefs.length && clearedHaz === hazDefs.length) {
      showBadge("sure-footed", "🥾", "Sure-footed — every hazard stepped around!");
      play.bonus();
    }
  }
  function showBadge(kind, icon, words) {
    badgeEl.hidden = false; badgeEl.dataset.badge = kind;
    badgeEl.textContent = icon + " " + words;
    badgeEl.style.cssText = "font-weight:900;font-size:12px;color:#245048;background:#fff8dc;border-radius:99px;padding:3px 10px;box-shadow:0 3px 0 rgba(24,62,64,.14)";
    F.pop && F.pop(badgeEl);
  }
  function revealHazards() {
    hazDefs.forEach(function (h) {
      if (h.shown || h.i > next + lookAhead()) return;
      if (h.i < next) { h.shown = true; return; } // walked past it already
      spawnHaz(h);
    });
  }
  paintHaz();
  revealHazards();
  prints.forEach(function (el, i) {
    el.addEventListener("click", function () {
      if (el.classList.contains("done")) return;
      if (i !== next) {
        play.miss(el, hideNumbers ? "Follow the trail in order! 👣" : "That's number " + (i + 1) * step + ". Look for " + (next + 1) * step + "!");
        prints[next].classList.add("hint");
        return;
      }
      el.classList.remove("next", "hint"); el.classList.add("done"); el.disabled = true;
      next += 1;
      const r = el.getBoundingClientRect();
      /* did the walker step into something they could have stepped around? (kind, never a slip) */
      const hz = hazDefs.filter(function (x) { return x.i === i && !x.cleared; })[0];
      if (hz) {
        hz.passed = true; muddy += 1; paintHaz();
        if (F.sfx) F.sfx.boing();
        if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "dust", n: 7, scale: 0.8 });
        F.dinoState && F.dinoState(tracker.querySelector(".du-dino"), "sad", 900);
        play.say(hz.def.step, 2600);
        play.hint("Next time tap the " + hz.def.icon + " first — it lays a crossing and banks a 🐾 token!", true);
      }
      if (F.sfx) F.sfx.thud();
      F.pulse && F.pulse(el);
      if ((i + 1) % 5 === 0 && F.sfx) F.sfx.chirp();
      if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "dust", n: 8 });
      play.good(el, { text: next === count ? "The end of the trail!" : null });
      if (next === Math.ceil(count / 2)) { play.say("Halfway along the trail! 🎉", 2200); if (F.floatText) F.floatText(r.left + r.width / 2, r.top - 12, "½ way!"); }
      F.dinoState(tracker.querySelector(".du-dino"), "walk", 650);
      place(i);
      revealHazards();
      if (next < count) { prints[next].classList.add("next"); armHint(); }
      else {
        window.clearTimeout(hintTimer);
        hazDefs.forEach(function (h) { if (!h.cleared) h.passed = true; });
        paintHaz();
        if (muddy >= 2) showBadge("muddy-boots", "🥾", "Muddy boots — " + muddy + " squelchy steps!");
        else if (clearedHaz < hazDefs.length) showBadge("half-way", "👣", clearedHaz + " of " + hazDefs.length + " hazards stepped around");
        collect("trail-times", { s: Math.max(1, Math.round((Date.now() - t0) / 1000)), tokens: clearedHaz, muddy: muddy, hazards: hazDefs.length });
        window.setTimeout(mysteryTime, 900);
      }
    });
  });

  function mysteryTime() {
    play.say("The tracks stop at the bush… who is hiding there? 🤔", 3500);
    play.hint("Look at the footprints again. Who made them?", true);
    mystery.hidden = false;
    const bush = field.querySelector(".tr-bush");
    bush.classList.add("shake");
    if (F.sfx) F.sfx.whoosh();
    const decoys = context.challenge >= 4 ? 3 : 2;
    const options = shuffle(MAKERS.filter(function (m) { return m !== maker; })).slice(0, decoys).concat([maker]);
    quiz.hidden = false;
    quiz.innerHTML = '<p class="tr-q">Who made the footprints?</p><div class="tr-opts"></div>';
    quiz._makerSp = maker.sp; // verification hook: which silhouette is the answer
    shuffle(options).forEach(function (m) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tr-opt";
      b.innerHTML = '<span class="tr-sil">' + F.dinoHTML(m.sp, { color: m.color, state: "idle", size: "100%" }) + "</span><small>?</small>";
      b.setAttribute("aria-label", "A mystery dinosaur");
      quiz.querySelector(".tr-opts").appendChild(b);
      b.addEventListener("click", function () {
        if (m !== maker) { b.classList.add("tr-wrong"); play.miss(b, "Hmm, look at the toes and how big the prints are. Try another!"); window.setTimeout(function () { b.classList.remove("tr-wrong"); }, 600); return; }
        quiz.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
        b.classList.add("tr-right"); b.querySelector("small").textContent = m.name;
        play.good(b, { text: "You found it!" });
        mystery.innerHTML = F.dinoHTML(maker.sp, { color: maker.color, state: "happy", size: "100%" });
        mystery.classList.add("on");
        if (F.sfx) (maker.sp === "trex" ? F.sfx.roar : F.sfx.chirp)();
        play.say(maker.name + "! " + maker.fact, 4200);
        const r = mystery.getBoundingClientRect();
        if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "confetti", n: 30 }); F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 14 }); }
        window.setTimeout(function () { play.finish("You followed all " + count + " footprints, stepped around " + clearedHaz +
          " of " + hazDefs.length + " hazards" + (muddy ? " and got mud on your boots " + muddy + " time" + (muddy === 1 ? "" : "s") : "") +
          ", and found " + maker.name + " hiding in the bush!"); }, 2600);
      });
    });
  }
}
