/* Moonbeam Rescue — a little baby dinosaur must cross a moonlit river on glowing stepping stones to reach its family.
 * Watch the moonbeams light the stones, then tap the same symbols in order: each right symbol makes the baby hop to the
 * next stone. Longer trails grow with the levels, and from level 4 there is a return trip where you tap the trail
 * BACKWARDS to bring a sleepy sibling home. A wrong symbol only makes the baby wobble: the trail is shown again. */
import { createPlay, shuffle } from "../adv-kit.js?v=du-5ee3d40e60884152";

const STARS = [["moon", "🌙"], ["fern", "🌿"], ["pawprint", "🐾"], ["flower", "🌼"], ["crystal", "💎"], ["star", "⭐"]];
const HELPERS = [["tricera", "teal", "Trixie"], ["stego", "purple", "Spike"], ["bronto", "orange", "Bronte"], ["raptor", "red", "Zippy"], ["trex", "green", "Rexy"]];

export function mountMoonbeamRescue(context) {
  const F = window.DUFX;
  const level = Math.max(1, Number(context.level) || 1);
  const pathLength = Math.min(7, 3 + Math.floor(context.challenge / 1.5));
  const choiceCount = Math.min(6, Math.max(4, Math.min(6, pathLength)));
  const roundTrip = context.challenge >= 4;
  const helper = HELPERS[level % HELPERS.length];
  const symbols = shuffle(STARS.slice()).slice(0, choiceCount);
  const sequence = Array.from({ length: pathLength }, function (_, i) { return symbols[(i * 2 + Math.floor(Math.random() * 2)) % symbols.length]; });
  for (let i = 1; i < sequence.length; i++) if (sequence[i] === sequence[i - 1]) sequence[i] = symbols[(symbols.indexOf(sequence[i]) + 1) % symbols.length];
  const play = createPlay(context, {
    emoji: "🌙", title: "Moonbeam Rescue", theme: "night", buddy: false, wander: false,
    instruction: "Watch the moonbeams light the stones, then tap the same symbols in order to help the baby cross!", hint: "First watch the moonbeam trail. Then tap the same glowing symbols in order.", allowed: 3
  });
  const board = play.board;
  board.innerHTML = '<div class="mb-scene" id="mbScene"><span class="mb-moon">🌙</span><div class="mb-river"></div>' +
    '<div class="mb-island left"><div class="mb-helper">' + F.dinoHTML(helper[0], { color: helper[1], state: "idle", size: "100%" }) + '<small>' + helper[2] + '</small></div></div>' +
    '<div class="mb-stones" id="mbStones"></div><div class="mb-island right"><div class="mb-family" id="mbFamily"></div></div>' +
    '<div class="mb-baby" id="mbBaby">' + F.dinoHTML("tricera", { color: "yellow", state: "idle", size: "100%" }) + '</div></div>' +
    '<div class="mb-info" id="mbInfo"></div><div class="mb-choices" id="mbChoices"></div><div class="bt-controls"><button type="button" class="pk-btn" id="mbWatch">✨ Watch the trail</button></div>';
  const scene = board.querySelector("#mbScene"), stonesEl = board.querySelector("#mbStones"), baby = board.querySelector("#mbBaby"), info = board.querySelector("#mbInfo"), choicesEl = board.querySelector("#mbChoices"), watchBtn = board.querySelector("#mbWatch");
  let leg = 0, pos = -1, busy = true, lights = [];

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
      busy = true;
      const d = baby.querySelector(".du-dino"); F.dinoState(d, "sad", 900);
      if (F.shake) F.shake(baby);
      play.miss(btn, "Oops, the baby wobbled! Let's watch the moonbeams again. 💛");
      window.setTimeout(function () { clearStones(); showTrail(); }, 1400);
      return;
    }
    pos += 1;
    const st = stones[nextIdx];
    st.classList.add("lit"); st.firstChild.textContent = sym[1];
    babyTo(nextIdx, true);
    if (F.sfx) F.sfx.note(pos, .45);
    const r = st.getBoundingClientRect();
    play.good({ x: r.left + r.width / 2, y: r.top }, { text: pos + 1 === seq.length ? "Across!" : null });
    if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 8 });
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
  function reunion() {
    busy = true; watchBtn.hidden = true; choicesEl.hidden = true;
    renderFamily(true);
    scene.classList.add("mb-happy");
    info.textContent = helper[2] + " guided the little one safely home!";
    const r = scene.getBoundingClientRect();
    if (F.sfx) F.sfx.win();
    if (F.burst) { F.burst(r.left + r.width * 0.85, r.top + r.height * 0.6, { kind: "hearts", n: 18 }); F.burst(r.left + r.width / 2, r.top + 30, { kind: "confetti", n: 40 }); }
    F.dinoState(baby.querySelector(".du-dino"), "happy", 99999);
    play.say("The family is together again! 💚", 3500);
    window.setTimeout(function () { play.finish("A moonbeam trail brought the baby dinosaur safely home!"); }, 2800);
  }
  window.setTimeout(function () { showTrail(); }, 800);
}
