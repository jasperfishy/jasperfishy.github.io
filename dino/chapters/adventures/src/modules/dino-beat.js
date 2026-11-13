/* Dino Beat Parade — four dinosaur drummers on little stages. Watch the rhythm, then play it back. Every success makes
 * the rhythm one beat longer and adds another dinosaur to the parade; mistakes just replay the tune (no starting over).
 * NEW: you also choose WHO carries the rhythm — tap a drummer in the roster and their beats ring out brighter, their
 * face leads the parade, and their voice opens the tune. A hot-streak meter counts the clean echoes in a row, and the
 * song ends with a call-and-response: the leader drums a short fill, you echo it back, and the parade plays your fill.
 * At the end the whole parade marches to the song you played. Replay and a slower "show me" button are always there. */
import { createPlay, getExtras, collect, collection } from "../adv-kit.js?v=du-7df8fa9b17a78b51";

const LEADS_KEY = "beat-leads"; // saved inside du-adv-extras-v1 via collect()
const FILLS_KEY = "beat-fills";
const FILL_MS = 9500; // the call-and-response window — the show always closes by itself

const DRUMS = [
  { sp: "trex", color: "green", name: "Rex", drum: 0, note: 0, tint: "#91d09c" },
  { sp: "tricera", color: "teal", name: "Trixie", drum: 1, note: 4, tint: "#7fd1c7" },
  { sp: "stego", color: "purple", name: "Spike", drum: 2, note: 7, tint: "#b9a1e6" },
  { sp: "bronto", color: "orange", name: "Bronte", drum: 3, note: 11, tint: "#f6b273" }
];
const PARADE = [["raptor", "red"], ["ptero", "blue"], ["tricera", "yellow"], ["stego", "pink"], ["trex", "teal"], ["bronto", "purple"], ["raptor", "orange"], ["stego", "green"], ["tricera", "pink"]];

export function mountDinoBeat(context) {
  const F = window.DUFX;
  const tier = context.challenge <= 2 ? 1 : context.challenge <= 5 ? 2 : 3;
  const TIER = ["Little beat", "Marching beat", "Whole-song maestro"];
  const best = getExtras().best[(context.activity && context.activity.id) || "beat"] || 0;
  const target = Math.min(9, 5 + Math.floor(context.challenge / 2));
  const start = Math.min(3, target - 1);
  const sequence = Array.from({ length: target }, function () { return Math.floor(Math.random() * DRUMS.length); });
  // no more than two of the same in a row feels friendlier
  for (let i = 2; i < sequence.length; i++) if (sequence[i] === sequence[i - 1] && sequence[i] === sequence[i - 2]) sequence[i] = (sequence[i] + 1) % DRUMS.length;
  // from tier 2 the parade sometimes drums an echo tune — the second half mirrors the first
  const echo = tier >= 2 && Math.random() < 0.5;
  if (echo) { const half = Math.ceil(target / 2); for (let i = half; i < target; i++) sequence[i] = sequence[target - 1 - i]; }
  const play = createPlay(context, {
    emoji: "🥁", title: "Dino beat parade", theme: "party", buddy: false, wander: false,
    instruction: "Choose who carries the rhythm in the roster, watch the dinosaurs drum, play it back in the same order — then echo the leader's fill!",
    hint: "Listen and watch first. There is no rush!", allowed: 3
  });
  const chip = function (txt) { return '<span style="background:rgba(255,255,255,.92);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#245048">' + txt + "</span>"; };
  const board = play.board;
  board._bt = sequence;
  let hero = (context.level - 1) % DRUMS.length; // who carries the rhythm — you may change it below
  const led = collection(LEADS_KEY);
  board.innerHTML = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 auto 8px">' +
    /* An "echo tune" is a rule about the music, not a thing in the world, so it
     * gets the replay mark rather than the 🪞 glyph nobody's library can draw. */
    chip("Tier " + tier + " · " + TIER[tier - 1]) + chip("The song is " + target + " beats" + (echo ? " — an echo tune! " + window.DUICONS.i("replay", { size: 15 }) : "")) +
    chip('Rhythm carrier <b id="btLeadName">' + DRUMS[hero].name + '</b> · songs led <b id="btLed">' + led.length + "</b>") + (best ? chip("Your best " + window.DUICONS.stars(best)) : "") + "</div>" +
    '<div class="bt-roster" id="btRoster" role="group" aria-label="Which dinosaur carries the rhythm?" style="display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap;margin:0 auto 6px"></div>' +
    '<div class="bt-heat" id="btHeat" data-streak="0" data-best="0" data-goal="0" data-hot="0" aria-label="Hot streak" style="display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap;margin:2px auto 8px"></div>' +
    '<div class="bt-lights" id="btLights"></div><div class="bt-stage" id="btStage"></div>' +
    '<div class="bt-controls"><button type="button" class="pk-btn" id="btReplay">🔁 Play it again</button><button type="button" class="pk-btn" id="btSlow">🐢 Slowly</button><button type="button" class="pk-btn" id="btHelp">👉 Point at the next beat ×2</button></div>' +
    '<div class="bt-call" id="btCall" hidden data-state="idle" data-call="" data-response="0" data-target="0" aria-live="polite" style="margin:8px auto 0;padding:8px 10px;border-radius:16px;background:rgba(255,255,255,.9);border:3px solid #f2b705;box-shadow:0 4px 0 rgba(24,62,64,.14);text-align:center;max-width:520px"></div>' +
    '<div class="bt-parade" id="btParade" aria-label="The parade"><span class="bt-plabel">Parade</span></div>';
  const lights = board.querySelector("#btLights"), stage = board.querySelector("#btStage"), parade = board.querySelector("#btParade");
  const roster = board.querySelector("#btRoster"), heat = board.querySelector("#btHeat"), callBox = board.querySelector("#btCall");
  let len = start, input = [], playing = false, done = false, slow = false, helps = 2;
  let streak = 0, bestStreak = 0, filling = false, fillSeq = [], fillIdx = 0, fillTimer = 0, fillDone = false, finished = false;

  stage.innerHTML = DRUMS.map(function (d, i) {
    return '<button type="button" class="bt-pad" data-i="' + i + '" style="--tint:' + d.tint + '" aria-label="' + d.name + ' the drummer"><span class="bt-ring"></span><span class="bt-dino">' + F.dinoHTML(d.sp, { color: d.color, state: "idle", size: "100%" }) + '</span><span class="bt-drum">🥁</span><small>' + d.name + "</small></button>";
  }).join("");
  const pads = Array.prototype.slice.call(stage.querySelectorAll(".bt-pad"));
  function drawLights(active) {
    lights.innerHTML = sequence.map(function (_, i) { return '<i class="' + (i < len ? "reach" : "") + (i < input.length ? " lit" : "") + (i === active ? " now" : "") + '">♪</i>'; }).join("");
  }
  /* THE RHYTHM CARRIER — a real choice the child makes: which dinosaur leads the song. The pick changes what
   * you see (crowned pad, gold outline, lead chip) and what you hear (the carrier's beats are doubled and
   * bigger) and it decides who drums the closing call-and-response fill. */
  /* The crown a child used to get as a font glyph is a rank mark, not a specimen,
   * so it is drawn in the app's own ink and stays legible at 14px. */
  const crown = function (size) { return window.DUICONS.i("medal", { size: size || 16 }); };
  const NAMES = DRUMS.map(function (d) { return d.name; });
  function paintRoster() {
    const d = DRUMS[hero];
    roster.innerHTML = '<span class="bt-lead" id="btLead" data-species="' + d.sp + '" data-color="' + d.color +
      '" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,214,87,.34);border:2px solid #f2b705;border-radius:999px;padding:2px 12px 2px 3px;font-weight:900;font-size:12.5px;color:#4a3208">' +
      '<span style="display:block;width:34px;height:30px">' + F.dinoHTML(d.sp, { color: d.color, state: "happy", size: "100%" }) + "</span>" + crown(17) + " " + d.name + " carries the rhythm</span>" +
      DRUMS.map(function (x, i) {
        const on = i === hero;
        return '<button type="button" class="bt-hero' + (on ? " on" : "") + '" data-i="' + i + '" data-species="' + x.sp +
          '" aria-pressed="' + (on ? "true" : "false") + '" title="Let ' + x.name + ' carry the rhythm" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;border:3px solid ' +
          (on ? "#f2b705" : "rgba(24,62,64,.16)") + ';background:rgba(255,255,255,.92);border-radius:999px;padding:2px 9px 2px 3px;font:inherit;font-weight:900;font-size:11.5px;color:#245048">' +
          '<span style="display:block;width:28px;height:25px">' + F.dinoHTML(x.sp, { color: x.color, state: on ? "happy" : "idle", size: "100%" }) + "</span>" +
          (on ? crown(14) + " " + x.name : x.name) + "</button>";
      }).join("");
    const leadName = board.querySelector("#btLeadName");
    if (leadName) leadName.textContent = d.name;
    pads.forEach(function (p, i) {
      const on = i === hero;
      p.classList.toggle("lead", on);
      p.dataset.lead = on ? "1" : "0";
      p.style.outline = on ? "4px solid rgba(255,214,87,.9)" : "";
      p.style.outlineOffset = on ? "2px" : "";
      const tag = p.querySelector("small");
      /* A rank mark has to be markup, not text: `textContent` cannot carry a
       * drawing, and NAMES are this module's own words, never the child's. */
      if (tag) tag.innerHTML = (on ? crown(13) + " " : "") + NAMES[i];
    });
  }
  roster.addEventListener("click", function (e) {
    const btn = e.target && e.target.closest ? e.target.closest(".bt-hero") : null;
    if (!btn || done || filling) return;
    const i = Number(btn.dataset.i);
    if (i === hero) return;
    hero = i;
    paintRoster();
    hit(i, false);
    play.say(NAMES[i] + " carries the rhythm now — listen how LOUD! 🥁", 2600);
  });

  /* HOT STREAK — five flames fill up as the child finishes rhythm after rhythm without a slip; filling the
   * goal for this tier sends a butterfly onto the stage. It resets on a wrong note, so it visibly rises and falls. */
  const FLAMES = 5;
  let hotAwarded = false;
  function heatGoal() { return Math.min(FLAMES, 2 + tier); }
  function paintHeat() {
    const goal = heatGoal();
    heat.dataset.streak = String(streak);
    heat.dataset.best = String(bestStreak);
    heat.dataset.goal = String(goal);
    heat.dataset.hot = streak >= goal ? "1" : "0";
    heat.innerHTML = '<span style="font-weight:900;font-size:12px;color:#245048">Hot streak</span>' +
      Array.from({ length: FLAMES }, function (_, n) {
        const lit = n < streak;
        return '<i class="bt-flame' + (lit ? " on" : "") + (n + 1 === goal ? " goal" : "") + '" data-n="' + (n + 1) +
          '" style="font-style:normal;font-size:' + (12 + n * 2) + "px;opacity:" + (lit ? "1" : ".3") + ";filter:" + (lit ? "none" : "grayscale(1)") + '">🔥</i>';
      }).join("") +
      '<span style="font-weight:900;font-size:11.5px;color:#245048">' +
      (streak >= goal ? "The drums are ON FIRE! 🔥" : "Clean echoes fill them up — " + goal + " brings a butterfly 🦋") + "</span>";
  }

  function hit(i, quiet) {
    const d = DRUMS[i], pad = pads[i], lead = i === hero;
    pad.classList.add("hit"); window.setTimeout(function () { pad.classList.remove("hit"); }, 320);
    F.dinoState(pad.querySelector(".du-dino"), d.sp === "trex" ? "roar" : "happy", 380);
    if (F.sfx) { F.sfx.drum(d.drum); if (lead) F.sfx.drum(d.drum); F.sfx.note(d.note, lead ? .55 : .4); }
    const r = pad.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: quiet ? "sparkle" : "notes", n: (quiet ? 4 : 3) + (lead ? 5 : 0), scale: lead ? 1.3 : 1 });
  }
  paintRoster(); paintHeat();
  function showTune() {
    if (playing || done) return;
    playing = true; input = []; drawLights(-1);
    pads.forEach(function (p) { p.disabled = true; });
    play.say("Listen… " + NAMES[hero] + " leads the beat 👂", 2400);
    const gap = slow ? 900 : 640;
    let step = 0;
    (function next() {
      if (!board.isConnected) return;
      if (step >= len) {
        playing = false; drawLights(-1);
        pads.forEach(function (p) { p.disabled = false; });
        play.say("Your turn! Play it back. 🎶", 2400); play.hint("Tap the dinosaurs in the same order. " + len + " beats!", true);
        return;
      }
      const idx = sequence[step];
      drawLights(step); hit(idx, true);
      step += 1;
      window.setTimeout(next, gap + (idx === hero ? 160 : 0)); // the carrier's beat hangs in the air a little longer
    })();
  }
  window.setTimeout(showTune, 900);
  board.querySelector("#btReplay").addEventListener("click", function () { slow = false; showTune(); });
  board.querySelector("#btSlow").addEventListener("click", function () { slow = true; showTune(); });
  board.querySelector("#btHelp").addEventListener("click", function () {
    if (playing || done || !helps) return;
    helps -= 1;
    const btn = board.querySelector("#btHelp");
    btn.innerHTML = helps ? "👉 Point at the next beat ×" + helps : "👉 No more pointers";
    if (!helps) btn.disabled = true;
    const d = DRUMS[sequence[input.length]];
    F.pulse && F.pulse(pads[sequence[input.length]]);
    if (F.sfx) F.sfx.tap();
    play.say("Shhh… " + d.name + " plays it next! 👂", 2400);
  });

  function addToParade() {
    const p = PARADE[(len - start) % PARADE.length];
    const chip = document.createElement("span");
    chip.className = "bt-chip"; chip.innerHTML = F.dinoHTML(p[0], { color: p[1], state: "walk", size: "100%" });
    parade.appendChild(chip); F.pop && F.pop(chip);
  }
  pads.forEach(function (pad) {
    pad.addEventListener("click", function () {
      const i = Number(pad.dataset.i);
      if (filling) { hit(i); echoFill(i, pad); return; } // the call-and-response finale: a brand new sequence to echo
      if (playing || done) return;
      hit(i);
      if (i !== sequence[input.length]) {
        streak = 0; paintHeat();
        input = []; drawLights(-1);
        pads.forEach(function (p) { p.disabled = true; });
        pads.forEach(function (p) { F.dinoState(p.querySelector(".du-dino"), "sad", 900); });
        play.miss(pad, "Oops! " + NAMES[hero] + " will play it again — listen for who is LOUDEST. ✨");
        window.setTimeout(function () { playing = false; pads.forEach(function (p) { p.disabled = false; }); showTune(); }, 1400);
        playing = true;
        return;
      }
      input.push(i); drawLights(-1);
      if (input.length === len) {
        playing = true;
        pads.forEach(function (p) { p.disabled = true; });
        streak += 1; bestStreak = Math.max(bestStreak, streak); paintHeat();
        if (streak >= heatGoal() && !hotAwarded) {
          hotAwarded = true;
          play.say("Hot streak " + streak + " — the drums are on fire! 🔥 A butterfly heard you! 🦋", 3000);
          play.bonus();
        }
        play.good(pad, { text: len >= target ? "The whole song!" : "Beat " + len + "! 🎵" });
        addToParade();
        if (len >= target) { window.setTimeout(finale, 900); return; }
        len += 1;
        if (F.sfx) F.sfx.star();
        window.setTimeout(function () { playing = false; play.say("A longer rhythm now: " + len + " beats!", 2000); showTune(); }, 1500);
      }
    });
  });

  function finale() {
    done = true;
    parade.classList.add("marching");
    play.say("Parade time! 🎉 The whole parade plays your song!", 4000);
    let k = 0;
    (function song() {
      if (!board.isConnected) return;
      if (k >= sequence.length) { window.setTimeout(callTime, 600); return; }
      hit(sequence[k], false); k += 1; window.setTimeout(song, 360);
    })();
    const r = parade.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "confetti", n: 40 });
    if (F.sfx) F.sfx.win();
  }

  /* CALL-AND-RESPONSE FINALE — the rhythm carrier drums a short fill (2 beats in tier 1, 3 in tier 2, 4 in
   * tier 3, so the stakes grow with every round) and the child echoes it back. Wrong taps cost a star exactly
   * like a wrong note in the tune; the free 👂 button replays it. The window always closes by FILL_MS on its
   * own, so a child who simply watches still finishes the round. */
  function callTime() {
    if (fillDone || finished) return;
    const fillLen = Math.max(2, Math.min(4, tier + 1));
    fillSeq = [hero];
    while (fillSeq.length < fillLen) {
      const c = Math.floor(Math.random() * DRUMS.length);
      if (c !== fillSeq[fillSeq.length - 1]) fillSeq.push(c);
    }
    filling = true; fillIdx = 0;
    callBox.hidden = false;
    callBox.dataset.state = "listen";
    callBox.dataset.call = fillSeq.map(function (n) { return NAMES[n]; }).join(" ");
    callBox.dataset.response = "0";
    callBox.dataset.target = String(fillSeq.length);
    paintCall();
    play.say(NAMES[hero] + " has a surprise fill for you! 👀", 2400);
    fillTimer = window.setTimeout(function () { closeCall("time"); }, FILL_MS);
    window.setTimeout(demoFill, 700);
  }
  function paintCall() {
    callBox.innerHTML = '<b class="bt-callask" style="display:block;font-size:13px;color:#245048;margin-bottom:4px">' +
      (fillIdx ? "Almost! Finish the echo…" : NAMES[hero] + " drums a FILL — copy it back! 🥁") + "</b>" +
      '<span class="bt-slots" style="display:inline-flex;gap:6px;justify-content:center;flex-wrap:wrap">' +
      fillSeq.map(function (n, k) {
        const lit = k < fillIdx;
        return '<i class="bt-slot' + (lit ? " lit" : "") + '" data-n="' + k + '" data-drummer="' + NAMES[n] +
          '" style="display:grid;place-items:center;width:36px;height:36px;border-radius:12px;font-style:normal;font-weight:900;font-size:14px;background:' +
          (lit ? "#8fe0a3" : "rgba(255,255,255,.86)") + ';border:2px ' + (lit ? "solid" : "dashed") +
          ' rgba(24,62,64,.32);color:#245048">' + (lit ? "👣" : "♪") + "</i>";
      }).join("") + "</span>" +
      '<span style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="pk-btn" id="btCallAgain">👂 Hear the fill again</button>' +
      '<button type="button" class="pk-btn" id="btCallSkip">That’s enough — finish the show</button></span>';
  }
  function demoFill() {
    if (!filling || fillDone) return;
    pads.forEach(function (p) { p.disabled = true; });
    callBox.dataset.state = "listen";
    play.say("Listen… " + fillSeq.map(function (n) { return NAMES[n]; }).join(", "), 2600);
    let k = 0;
    (function beat() {
      if (!board.isConnected || !filling || fillDone) return;
      if (k >= fillSeq.length) {
        callBox.dataset.state = "your-turn";
        pads.forEach(function (p) { p.disabled = false; });
        play.hint("Now tap " + NAMES[fillSeq[0]] + " first, then copy the rest! 👂", true);
        return;
      }
      const idx = fillSeq[k];
      hit(idx, false);
      const slot = callBox.querySelector('.bt-slot[data-n="' + k + '"]');
      if (slot) {
        slot.style.background = "rgba(255,214,87,.85)";
        window.setTimeout(function () { if (slot) slot.style.background = ""; }, 280);
      }
      k += 1;
      window.setTimeout(beat, slow ? 800 : 600);
    })();
  }
  function echoFill(i, pad) {
    if (!filling || fillDone) return;
    if (i === fillSeq[fillIdx]) {
      fillIdx += 1;
      callBox.dataset.response = String(fillIdx);
      paintCall();
      play.good(pad, { text: fillIdx >= fillSeq.length ? "You echoed the whole fill! 🥁" : NAMES[i] + "! ♪" });
      if (fillIdx >= fillSeq.length) {
        fillDone = true;
        callBox.dataset.state = "echoed";
        collect(FILLS_KEY, { n: fillSeq.length, lead: DRUMS[hero].sp, level: context.level });
        playFillBack();
      }
      return;
    }
    play.miss(pad, "Not quite — " + NAMES[hero] + " always starts the fill with " + NAMES[fillSeq[0]] + ". Hear it again! ✨");
    play.hint("The fill starts with " + NAMES[fillSeq[0]] + " — tap " + NAMES[fillSeq[0]] + "! 👂", true);
    fillIdx = 0; callBox.dataset.response = "0"; paintCall();
    demoFill();
  }
  // the parade answers back with the child's own fill, then the show closes
  function playFillBack() {
    filling = false;
    pads.forEach(function (p) { p.disabled = true; });
    play.say("The parade plays YOUR fill! 🎺", 2600);
    const r = parade.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "notes", n: 18 });
    let k = 0;
    (function beat() {
      if (!board.isConnected) { finishShow(); return; }
      if (k >= fillSeq.length) { window.setTimeout(finishShow, 450); return; }
      hit(fillSeq[k], false); k += 1;
      window.setTimeout(beat, 340);
    })();
  }
  function closeCall(how) {
    if (fillDone || finished) return;
    fillDone = true; filling = false;
    callBox.dataset.state = how; // "time" = watched it out, "skipped" = tapped finish
    pads.forEach(function (p) { p.disabled = true; });
    play.say(how === "skipped" ? "Okay — the show goes on! 🎉"
      : NAMES[hero] + " says well done for listening! The fill was " + fillSeq.map(function (n) { return NAMES[n]; }).join(", ") + ".", 2800);
    window.setTimeout(finishShow, 650);
  }
  callBox.addEventListener("click", function (e) {
    const btn = e.target && e.target.closest ? e.target.closest("button") : null;
    if (!btn || !filling || fillDone) return;
    if (btn.id === "btCallAgain") { play.say("Coming up! 👂", 1200); demoFill(); } // always free
    else if (btn.id === "btCallSkip") closeCall("skipped");
  });

  function finishShow() {
    if (finished) return;
    finished = true;
    window.clearTimeout(fillTimer);
    const ledCount = collect(LEADS_KEY, { lead: DRUMS[hero].sp, level: context.level });
    const ledChip = board.querySelector("#btLed");
    if (ledChip) ledChip.textContent = String(ledCount);
    const extra = callBox.dataset.state === "echoed" ? ", and " + NAMES[hero] + " taught you its " + fillSeq.length + "-beat fill" : "";
    play.finish("You played the whole " + target + "-beat song" + extra + " and " + Math.max(1, target - start) +
      " dinosaur friends marched behind you! " + NAMES[hero] + " led the band. 🥁");
  }
}
