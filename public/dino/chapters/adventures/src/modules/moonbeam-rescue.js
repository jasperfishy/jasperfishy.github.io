/* Moonbeam Rescue — a little baby dinosaur must cross a moonlit river on glowing stepping stones to reach its family.
 * Watch the moonbeams light the stones, then tap the same symbols in order: each right symbol makes the baby hop to the
 * next stone. Longer trails grow with the levels, and from level 4 there is a return trip where you tap the trail
 * BACKWARDS to bring a sleepy sibling home. A wrong symbol only makes the baby wobble: the trail is shown again.
 *
 * Two new things to do on every night:
 *   • AIM THE MOONBEAM — tap 🔦 and drag (or tap) your light across the dark banks. Lost friends only become tappable
 *     once your beam touches them, and each one you bring home is tallied on this device (du-adv-extras "rescues").
 *   • THE MOON IS FADED — moonlight slowly drains (faster while the lamp is out). When it runs out the moon simply
 *     takes a breath, the stones glow again and the meter refills. Nobody loses; the night just gets dimmer and
 *     busier as the rounds grow: more stones, more hidden friends, a faster-fading moon. */
import { createPlay, shuffle, getExtras, collect, collection } from "../adv-kit.js";

const STARS = [["moon", "🌙"], ["fern", "🌿"], ["pawprint", "🐾"], ["flower", "🌼"], ["crystal", "💎"], ["star", "⭐"], ["leaf", "🍃"], ["pebble", "🪨"], ["glowfly", "✨"], ["shell", "🐚"]];
const HELPERS = [["tricera", "teal", "Trixie"], ["stego", "purple", "Spike"], ["bronto", "orange", "Bronte"], ["raptor", "red", "Zippy"], ["trex", "green", "Rexy"]];
/* the friends who lost their way in the dark, found with the moonbeam */
const LOST = [["stego", "pink", "Tiny Plates"], ["raptor", "orange", "Feather"], ["bronto", "teal", "Pond"], ["tricera", "purple", "Hornlet"], ["trex", "blue", "Chomper"], ["ptero", "yellow", "Glider"]];

export function mountMoonbeamRescue(context) {
  const F = window.DUFX;
  const level = Math.max(1, Number(context.level) || 1);
  const tier = context.challenge <= 2 ? 1 : context.challenge <= 5 ? 2 : 3;
  const TIER = ["Paddling across", "The longer trail", "There and back"];
  const best = getExtras().best[(context.activity && context.activity.id) || "moonbeam"] || 0;
  const pathLength = Math.min(7, 3 + Math.floor(context.challenge / 1.5));
  const choiceCount = Math.min(6, Math.max(4, Math.min(6, pathLength)));
  const roundTrip = context.challenge >= 4;
  const helper = HELPERS[level % HELPERS.length];
  const nightRescues = collection("rescues");
  const hiddenPicks = shuffle(LOST).slice(0, Math.min(LOST.length, tier + (roundTrip ? 1 : 0)));
  const moonDrain = 1.6 + tier * 0.7;
  const symbols = shuffle(STARS.slice()).slice(0, choiceCount);
  const sequence = Array.from({ length: pathLength }, function (_, i) { return symbols[(i * 2 + Math.floor(Math.random() * 2)) % symbols.length]; });
  for (let i = 1; i < sequence.length; i++) if (sequence[i] === sequence[i - 1]) sequence[i] = symbols[(symbols.indexOf(sequence[i]) + 1) % symbols.length];
  const play = createPlay(context, {
    emoji: "🌙", title: "Moonbeam Rescue", theme: "night", buddy: false, wander: false,
    instruction: "Watch the moonbeams light the stones, then tap the same symbols in order to help the baby cross! And if a friend is lost in the dark, turn on the moonbeam and find them!", hint: "First watch the moonbeam trail. Then tap the same glowing symbols in order. 🔦 lets you sweep the light for lost friends.", allowed: 3
  });
  const chip = function (txt) { return '<span style="background:rgba(255,255,255,.92);border-radius:99px;padding:4px 12px;box-shadow:0 3px 0 rgba(24,62,64,.14);font-weight:900;font-size:12.5px;color:#245048">' + txt + "</span>"; };
  const board = play.board;
  board._mb = sequence.map(function (s) { return s[0]; });
  board._mbRT = roundTrip;
  board.innerHTML = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 auto 8px">' +
    chip("Tier " + tier + " · " + TIER[tier - 1]) + chip(pathLength + " glowing stones" + (roundTrip ? " · there AND back" : "")) + (best ? chip("Your best " + "⭐".repeat(best)) : "") +
    chip(hiddenPicks.length + " friend" + (hiddenPicks.length === 1 ? "" : "s") + ' lost in the dark 🆘') + chip(nightRescues.length ? "Home so far: " + nightRescues.length + " 🏠" : "Rescue log empty 🏠") + "</div>" +
    '<div class="mb-moonbar" id="mbMoon" data-moon="100" data-rests="0" role="img" aria-label="How much moonlight is left" style="display:flex;align-items:center;gap:8px;justify-content:center;margin:0 auto 6px;font-weight:900;font-size:11.5px;color:#245048">' +
    '<span>🌙 moonlight</span><span class="progress-track" style="flex:1;max-width:260px"><span id="mbMoonFill" style="display:block;height:100%;width:100%;border-radius:99px;background:linear-gradient(90deg,#fff3a8,#8fd6ff);transition:width .6s"></span></span></div>' +
    '<div class="mb-scene" id="mbScene" data-lamp="off" data-rescued="0"><span class="mb-moon">🌙</span><div class="mb-river"></div>' +
    (tier >= 2 ? '<i style="position:absolute;left:16%;top:12%;font-size:22px;pointer-events:none;opacity:.85">✨</i><i style="position:absolute;left:64%;top:8%;font-size:18px;pointer-events:none;opacity:.85">✨</i><i style="position:absolute;left:84%;top:22%;font-size:20px;pointer-events:none;opacity:.85">🪲</i>' : "") +
    (tier >= 3 ? '<i style="position:absolute;left:42%;top:6%;font-size:26px;pointer-events:none">🌠</i><i style="position:absolute;left:28%;top:18%;font-size:16px;pointer-events:none;opacity:.8">✨</i>' : "") +
    '<div class="mb-island left"><div class="mb-helper">' + F.dinoHTML(helper[0], { color: helper[1], state: "idle", size: "100%" }) + '<small>' + helper[2] + '</small></div></div>' +
    '<div class="mb-stones" id="mbStones"></div><div class="mb-island right"><div class="mb-family" id="mbFamily"></div></div>' +
    '<div id="mbHidden" aria-label="Friends lost in the dark" style="position:absolute;inset:0;z-index:5;pointer-events:none"></div>' +
    '<div id="mbRescued" aria-label="Rescued friends" style="position:absolute;right:1%;bottom:2%;display:flex;gap:2px;z-index:6;pointer-events:none"></div>' +
    '<div id="mbBeam" hidden aria-hidden="true" style="position:absolute;width:34%;aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:7;background:radial-gradient(circle,rgba(255,247,200,.55),rgba(190,225,255,.22) 55%,rgba(255,255,255,0) 72%)"></div>' +
    '<div class="mb-baby" id="mbBaby">' + F.dinoHTML("tricera", { color: "yellow", state: "idle", size: "100%" }) + '</div></div>' +
    '<div class="mb-info" id="mbInfo"></div><p id="mbNudge" style="text-align:center;font-weight:800;font-size:12.5px;min-height:18px;margin:0 0 4px;color:#fff;text-shadow:0 1px 3px rgba(0,0,40,.6)"></p>' +
    '<div class="mb-choices" id="mbChoices"></div><div class="bt-controls"><button type="button" class="pk-btn" id="mbWatch">✨ Watch the trail</button><button type="button" class="pk-btn" id="mbLamp" aria-pressed="false">🔦 Aim the moonbeam</button><button type="button" class="pk-btn" id="mbHelp">🌟 Light the next stone ×2</button></div>' +
    '<p id="mbTally" style="text-align:center;font-weight:900;font-size:12.5px;margin:8px 0 0;color:#fff;text-shadow:0 1px 3px rgba(0,0,40,.6)"></p>';
  const scene = board.querySelector("#mbScene"), stonesEl = board.querySelector("#mbStones"), baby = board.querySelector("#mbBaby"), info = board.querySelector("#mbInfo"), choicesEl = board.querySelector("#mbChoices"), watchBtn = board.querySelector("#mbWatch");
  const hiddenEl = board.querySelector("#mbHidden"), beamEl = board.querySelector("#mbBeam"), lampBtn = board.querySelector("#mbLamp"), nudge = board.querySelector("#mbNudge"), tallyEl = board.querySelector("#mbTally");
  const moonEl = board.querySelector("#mbMoon"), moonFill = board.querySelector("#mbMoonFill"), rescuedEl = board.querySelector("#mbRescued");
  let leg = 0, pos = -1, busy = true, lights = [], helps = 2, wrongRun = 0;
  let moon = 100, rests = 0, lampOn = false, rescued = 0, beamX = 50, beamY = 40;

  const stones = sequence.map(function (s, i) {
    const el = document.createElement("div");
    el.className = "mb-stone"; el.innerHTML = "<span>✧</span>";
    el.style.left = (22 + i * (56 / Math.max(1, pathLength - 1))) + "%";
    el.style.top = (52 + Math.sin(i * 1.3) * 7) + "%";
    stonesEl.appendChild(el); return el;
  });
  symbols.forEach(function (s, i) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "mb-choice"; b.innerHTML = "<span>" + s[1] + "</span>"; b.setAttribute("aria-label", s[0]);
    choicesEl.appendChild(b);
    b.addEventListener("click", function () { choose(s, b); });
  });
  function order() { return leg === 0 ? sequence.map(function (s, i) { return i; }) : sequence.map(function (s, i) { return pathLength - 1 - i; }); }
  function babyTo(i, hop) {
    // i = stone index, -1 = left island, pathLength = right island
    const left = i < 0 ? 12 : i >= pathLength ? 86 : parseFloat(stones[i].style.left);
    const top = i < 0 || i >= pathLength ? 62 : parseFloat(stones[i].style.top) - 3;
    baby.style.left = left + "%"; baby.style.top = top + "%";
    if (hop && F.sfx) F.sfx.boing();
  }
  babyTo(-1, false);
  function renderFamily(arrived) {
    board.querySelector("#mbFamily").innerHTML = (arrived ? F.dinoHTML("bronto", { color: "orange", state: "happy", size: "100%" }) + F.dinoHTML("stego", { color: "purple", state: "happy", size: "100%" }) : F.dinoHTML("bronto", { color: "orange", state: "idle", size: "100%" })) + '<small>Family</small>';
  }
  renderFamily(false);

  function showTrail(done) {
    busy = true; watchBtn.disabled = true;
    stones.forEach(function (s) { s.classList.remove("lit", "now"); s.firstChild.textContent = "✧"; });
    play.say("Watch the moonbeams… 👀", 2200);
    const seq = order();
    seq.forEach(function (idx, step) {
      window.setTimeout(function () {
        if (!board.isConnected) return;
        const st = stones[idx], sym = sequence[idx];
        st.classList.add("now"); st.firstChild.textContent = sym[1];
        if (F.sfx) F.sfx.note(step, .4);
        const r = st.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "sparkle", n: 6 });
        window.setTimeout(function () { st.classList.remove("now"); st.firstChild.textContent = "✧"; }, 520);
      }, 700 + step * 750);
    });
    window.setTimeout(function () {
      if (!board.isConnected) return;
      busy = false; watchBtn.disabled = false; pos = -1;
      babyTo(leg === 0 ? -1 : pathLength, false);
      info.textContent = leg === 0 ? "Your turn! Tap the symbols in the same order." : "Return trip! Tap the symbols BACKWARDS this time. 🔄";
      play.say(leg === 0 ? "Your turn! 🌟" : "Now backwards! 🔄", 2400);
      if (done) done();
    }, 700 + seq.length * 750 + 200);
  }
  watchBtn.addEventListener("click", function () { if (!busy) { clearStones(); showTrail(); } });
  function clearStones() { stones.forEach(function (s) { s.classList.remove("lit"); s.firstChild.textContent = "✧"; }); pos = -1; babyTo(leg === 0 ? -1 : pathLength, false); }

  function choose(sym, btn) {
    if (busy) return;
    const seq = order(), nextIdx = seq[pos + 1];
    if (nextIdx === undefined) return;
    if (sequence[nextIdx] !== sym) {
      busy = true; wrongRun += 1;
      const d = baby.querySelector(".du-dino"); F.dinoState(d, "sad", 900);
      if (F.shake) F.shake(baby);
      play.miss(btn, "Oops, the baby wobbled! Let's watch the moonbeams again. 💛");
      window.setTimeout(function () {
        clearStones();
        if (wrongRun >= 2) lightNext(850); // twice wrong in a row: light the next stone as a teaching nudge
        showTrail();
      }, 1400);
      return;
    }
    wrongRun = 0;
    pos += 1;
    const st = stones[nextIdx];
    st.classList.add("lit"); st.firstChild.textContent = sym[1];
    babyTo(nextIdx, true);
    if (F.sfx) { F.sfx.note(pos, .45); F.sfx.splash(); }
    const r = st.getBoundingClientRect();
    if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 8 }); F.burst(r.left + r.width / 2, r.top + r.height, { kind: "drops", n: 5 }); }
    ripple(r.left + r.width / 2, r.top + r.height);
    play.good({ x: r.left + r.width / 2, y: r.top }, { text: pos + 1 === seq.length ? "Across!" : null });
    F.dinoState(baby.querySelector(".du-dino"), "happy", 500);
    if (pos + 1 === seq.length) {
      busy = true;
      window.setTimeout(function () {
        babyTo(leg === 0 ? pathLength : -1, true);
        if (leg === 0 && roundTrip) {
          info.textContent = "Made it! A sleepy sibling is waiting back home…";
          play.say("Now bring the sleepy sibling back! 💤", 3000);
          leg = 1; window.setTimeout(function () { clearStones(); showTrail(); }, 2200);
        } else reunion();
      }, 700);
    }
  }
  // a little moonlit ring where a foot meets the river
  function ripple(x, y) {
    if (!F.motionOK || !F.motionOK() || !scene.animate) return;
    const d = document.createElement("i");
    d.style.cssText = "position:fixed;left:" + (x - 16) + "px;top:" + (y - 8) + "px;width:32px;height:16px;border-radius:50%;border:3px solid rgba(180,230,255,.85);pointer-events:none;z-index:5";
    document.body.appendChild(d);
    d.animate([{ transform: "scale(.4)", opacity: .9 }, { transform: "scale(1.8)", opacity: 0 }], { duration: 620, easing: "ease-out" }).onfinish = function () { d.remove(); };
  }
  // free hint: flash the next stone's symbol for a moment
  function lightNext(ms) {
    const ni = order()[pos + 1];
    if (ni === undefined) return false;
    const st = stones[ni];
    st.classList.add("now"); st.firstChild.textContent = sequence[ni][1];
    if (F.sfx) F.sfx.star();
    window.setTimeout(function () { st.classList.remove("now"); if (!st.classList.contains("lit")) st.firstChild.textContent = "✧"; }, ms || 1100);
    return true;
  }
  board.querySelector("#mbHelp").addEventListener("click", function () {
    if (busy || !helps) return;
    helps -= 1;
    const btn = board.querySelector("#mbHelp");
    btn.innerHTML = helps ? "🌟 Light the next stone ×" + helps : "🌟 No more wishes";
    if (!helps) btn.disabled = true;
    if (lightNext()) play.say("There it glows — tap that symbol! ✨", 2400);
  });
  /* ============================ the moonbeam lamp ============================
   * A pocket of the night the crossing does not need and no test can be stuck on: turn the lamp on, sweep your
   * light (drag, or tap) over the dark banks, and a lost friend only appears inside the beam. A second tap on the
   * friend you revealed brings them home, which pays a play.good and adds a line to the saved rescue log. */
  const lostFriends = hiddenPicks.map(function (who, i) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "mb-lost";
    b.dataset.name = who[2]; b.dataset.species = who[0]; b.dataset.seen = "0"; b.dataset.home = "0";
    b.setAttribute("aria-label", "Something is hiding in the dark");
    const x = 8 + Math.random() * 84;
    const y = i % 2 === 0 ? 9 + Math.random() * 18 : 72 + Math.random() * 16;
    b.style.cssText = "position:absolute;transform:translate(-50%,-50%);width:48px;height:48px;border:0;background:none;padding:0;" +
      "opacity:.05;pointer-events:none;cursor:default;transition:opacity .5s,filter .5s;filter:saturate(.4) brightness(.6)";
    b.style.left = x.toFixed(1) + "%"; b.style.top = y.toFixed(1) + "%";
    b.innerHTML = F.dinoHTML(who[0], { color: who[1], state: "idle", size: "100%" });
    hiddenEl.appendChild(b);
    const f = { el: b, name: who[2], sp: who[0], color: who[1], x: x, y: y, seen: false, home: false };
    b.addEventListener("click", function () { bringHome(f); });
    if (F.anim) F.anim(b, [{ opacity: 0 }, { opacity: .05 }], { duration: 600, delay: 200 + i * 120, fill: "backwards" });
    return f;
  });
  function seeFriend(f) {
    f.seen = true;
    f.el.dataset.seen = "1";
    f.el.style.opacity = "1"; f.el.style.pointerEvents = "auto"; f.el.style.cursor = "pointer"; f.el.style.filter = "";
    if (F.sfx) F.sfx.chirp();
    const r = f.el.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "sparkle", n: 8 });
    nudge.textContent = f.name + " is shining back at you! Tap them to bring them home. 🏠";
    play.say("There's " + f.name + " in the dark! Tap to help! ✨", 2800);
  }
  function bringHome(f) {
    if (!f.seen || f.home || !board.isConnected) return;
    f.home = true; rescued += 1;
    f.el.dataset.home = "1";
    scene.dataset.rescued = String(rescued);
    if (F.sfx) { F.sfx.star(); F.sfx.chirp(); }
    const r = f.el.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "hearts", n: 12 });
    const mark = document.createElement("span");
    mark.style.cssText = "display:inline-block;width:30px;height:30px";
    mark.innerHTML = F.dinoHTML(f.sp, { color: f.color, state: "happy", size: "100%" });
    rescuedEl.appendChild(mark);
    f.el.style.transition = "transform .9s cubic-bezier(.3,1.2,.4,1), opacity .9s";
    f.el.style.transform = "translate(" + (f.x > 60 ? 40 : -160) + "%,-160%) scale(.5)";
    window.setTimeout(function () { f.el.style.opacity = ".2"; }, 700);
    play.good(f.el, { text: f.name + "!" });
    const left = lostFriends.length - rescued;
    nudge.textContent = left ? f.name + " is safe! " + left + " friend" + (left === 1 ? "" : "s") + " still lost in the dark." : "Every last friend is home! What a night! 🎉";
    renderTally();
  }
  function aimBeam(clientX, clientY) {
    const r = scene.getBoundingClientRect();
    if (!r.width) return;
    const px = Math.max(0, Math.min(100, (clientX - r.left) / r.width * 100));
    const py = Math.max(0, Math.min(100, (clientY - r.top) / r.height * 100));
    beamX = px; beamY = py;
    if (!lampOn) return;
    beamEl.style.left = px.toFixed(1) + "%"; beamEl.style.top = py.toFixed(1) + "%";
    for (let i = 0; i < lostFriends.length; i++) {
      const f = lostFriends[i];
      if (f.seen || f.home) continue;
      if (Math.abs(f.x - px) < 12 && Math.abs(f.y - py) < 16) seeFriend(f);
    }
  }
  scene.addEventListener("pointermove", function (e) { aimBeam(e.clientX, e.clientY); });
  scene.addEventListener("pointerdown", function (e) { aimBeam(e.clientX, e.clientY); });
  lampBtn.addEventListener("click", function () {
    lampOn = !lampOn;
    scene.dataset.lamp = lampOn ? "on" : "off";
    lampBtn.setAttribute("aria-pressed", lampOn ? "true" : "false");
    lampBtn.innerHTML = lampOn ? "🔦 Moonbeam ON — sweep the dark" : "🔦 Aim the moonbeam";
    beamEl.hidden = !lampOn;
    if (lampOn) {
      beamEl.style.left = beamX + "%"; beamEl.style.top = beamY + "%";
      play.hint("Sweep the moonbeam: drag or tap inside the night scene, then tap a friend you can see.", true);
      play.say("Shine your moonbeam over the dark banks! 🔦", 3200);
      if (F.sfx) F.sfx.sparkle();
    } else {
      play.hint("First watch the moonbeam trail. Then tap the same glowing symbols in order.", true);
    }
  });
  function renderTally() {
    const total = collection("rescues").length;
    tallyEl.innerHTML = "🏠 Rescued tonight: <b data-k=\"tonight\">" + rescued + "</b> of " + lostFriends.length +
      (total ? " · <b>" + total + "</b> friends in your rescue log" : " · your rescue log starts tonight");
  }
  renderTally();
  /* ============================ the fading moon ============================
   * Urgency without losing: the moonlight meter only decides how dark the banks get. When it empties the moon
   * takes a breath, the meter refills and every stone you have not hopped yet is reminded with a soft glow. */
  function setMoon(v) {
    moon = Math.max(0, Math.min(100, v));
    moonEl.dataset.moon = String(Math.round(moon));
    moonFill.style.width = moon.toFixed(0) + "%";
    scene.style.filter = moon < 45 ? "brightness(" + (0.7 + moon / 45 * 0.3).toFixed(2) + ")" : "";
    const icon = scene.querySelector(".mb-moon");
    if (icon) icon.style.opacity = (0.3 + moon / 100 * 0.7).toFixed(2);
  }
  function moonRests() {
    rests += 1;
    moonEl.dataset.rests = String(rests);
    setMoon(100);
    stones.forEach(function (s, i) {
      if (s.classList.contains("lit")) return;
      window.setTimeout(function () {
        if (!board.isConnected) return;
        s.style.boxShadow = "0 0 20px 6px rgba(178,226,255,.75), 0 5px 0 rgba(0,0,0,.3)";
        window.setTimeout(function () { s.style.boxShadow = ""; }, 1600);
      }, i * 140);
    });
    if (F.sfx) F.sfx.sparkle();
    play.say("The moon takes a breath… and the stones light up again! 🌙", 3200);
    nudge.textContent = "The moon rested, so the stones are glowing again. Nothing was lost! 💛";
  }
  let journeyOver = false;
  const moonTick = window.setInterval(function () {
    if (!board.isConnected) { window.clearInterval(moonTick); return; }
    if (journeyOver) return;
    setMoon(moon - moonDrain * (lampOn ? 2.2 : 1));
    if (moon <= 0) moonRests();
  }, 700);
  setMoon(100);

  function reunion() {
    journeyOver = true;
    busy = true; watchBtn.hidden = true; choicesEl.hidden = true; board.querySelector("#mbHelp").hidden = true;
    lampOn = false; beamEl.hidden = true; lampBtn.disabled = true;
    renderFamily(true);
    scene.classList.add("mb-happy");
    info.textContent = helper[2] + " guided the little one safely home!";
    const r = scene.getBoundingClientRect();
    if (F.sfx) F.sfx.win();
    if (F.burst) { F.burst(r.left + r.width * 0.85, r.top + r.height * 0.6, { kind: "hearts", n: 18 }); F.burst(r.left + r.width / 2, r.top + 30, { kind: "confetti", n: 40 }); }
    F.dinoState(baby.querySelector(".du-dino"), "happy", 99999);
    play.say("The family is together again! 💚", 3500);
    play.bonus();
    /* the rescue log: every crossing is written on this device, hidden friends and all */
    collect("rescues", { night: level, hops: pathLength, there_and_back: roundTrip, saved: rescued, lost: lostFriends.length, rests: rests, helper: helper[2], stars: play.rating() });
    renderTally();
    window.setTimeout(function () {
      play.finish("You hopped " + pathLength + " glowing stones" + (roundTrip ? " there and back" : "") + " and brought the baby dinosaur home" +
        (rescued ? ", rescuing " + rescued + " lost friend" + (rescued === 1 ? "" : "s") + " with your moonbeam" : (lostFriends.length ? " — " + lostFriends.length + " friends were still hiding in the dark next time!" : "")) +
        "! " + (rests ? "The moon rested " + rests + " time" + (rests === 1 ? "" : "s") + " and nobody was worse for it." : "Not a single drop of moonlight wasted!"));
    }, 2800);
  }
  window.setTimeout(function () { showTrail(); }, 800);
}
