/* Dino Beat Parade — four dinosaur drummers on little stages. Watch the rhythm, then play it back. Every success makes
 * the rhythm one beat longer and adds another dinosaur to the parade; mistakes just replay the tune (no starting over).
 * At the end the whole parade marches to the song you played. Replay and a slower "show me" button are always there. */
import { createPlay } from "../adv-kit.js";

const DRUMS = [
  { sp: "trex", color: "green", name: "Rex", drum: 0, note: 0, tint: "#91d09c" },
  { sp: "tricera", color: "teal", name: "Trixie", drum: 1, note: 4, tint: "#7fd1c7" },
  { sp: "stego", color: "purple", name: "Spike", drum: 2, note: 7, tint: "#b9a1e6" },
  { sp: "bronto", color: "orange", name: "Bronte", drum: 3, note: 11, tint: "#f6b273" }
];
const PARADE = [["raptor", "red"], ["ptero", "blue"], ["tricera", "yellow"], ["stego", "pink"], ["trex", "teal"], ["bronto", "purple"], ["raptor", "orange"], ["stego", "green"], ["tricera", "pink"]];

export function mountDinoBeat(context) {
  const F = window.DUFX;
  const target = Math.min(9, 5 + Math.floor(context.challenge / 2));
  const start = Math.min(3, target - 1);
  const sequence = Array.from({ length: target }, function () { return Math.floor(Math.random() * DRUMS.length); });
  // no more than two of the same in a row feels friendlier
  for (let i = 2; i < sequence.length; i++) if (sequence[i] === sequence[i - 1] && sequence[i] === sequence[i - 2]) sequence[i] = (sequence[i] + 1) % DRUMS.length;
  const play = createPlay(context, {
    emoji: "🥁", title: "Dino beat parade", theme: "party", buddy: false, wander: false,
    instruction: "Watch the dinosaurs drum a rhythm, then play it back in the same order.", hint: "Listen and watch first. There is no rush!", allowed: 3
  });
  const board = play.board;
  board.innerHTML = '<div class="bt-lights" id="btLights"></div><div class="bt-stage" id="btStage"></div>' +
    '<div class="bt-controls"><button type="button" class="pk-btn" id="btReplay">🔁 Play it again</button><button type="button" class="pk-btn" id="btSlow">🐢 Slowly</button></div>' +
    '<div class="bt-parade" id="btParade" aria-label="The parade"><span class="bt-plabel">Parade</span></div>';
  const lights = board.querySelector("#btLights"), stage = board.querySelector("#btStage"), parade = board.querySelector("#btParade");
  let len = start, input = [], playing = false, done = false, slow = false;

  stage.innerHTML = DRUMS.map(function (d, i) {
    return '<button type="button" class="bt-pad" data-i="' + i + '" style="--tint:' + d.tint + '" aria-label="' + d.name + ' the drummer"><span class="bt-ring"></span><span class="bt-dino">' + F.dinoHTML(d.sp, { color: d.color, state: "idle", size: "100%" }) + '</span><span class="bt-drum">🥁</span><small>' + d.name + "</small></button>";
  }).join("");
  const pads = Array.prototype.slice.call(stage.querySelectorAll(".bt-pad"));
  function drawLights(active) {
    lights.innerHTML = sequence.map(function (_, i) { return '<i class="' + (i < len ? "reach" : "") + (i < input.length ? " lit" : "") + (i === active ? " now" : "") + '">♪</i>'; }).join("");
  }
  function hit(i, quiet) {
    const d = DRUMS[i], pad = pads[i];
    pad.classList.add("hit"); window.setTimeout(function () { pad.classList.remove("hit"); }, 320);
    F.dinoState(pad.querySelector(".du-dino"), d.sp === "trex" ? "roar" : "happy", 380);
    if (F.sfx) { F.sfx.drum(d.drum); F.sfx.note(d.note, .4); }
    const r = pad.getBoundingClientRect();
    if (F.burst && !quiet) F.burst(r.left + r.width / 2, r.top + r.height * 0.3, { kind: "notes", n: 3 });
  }
  function showTune() {
    if (playing || done) return;
    playing = true; input = []; drawLights(-1);
    pads.forEach(function (p) { p.disabled = true; });
    play.say("Listen to the rhythm… 👂", 2400);
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
      drawLights(step); hit(sequence[step], true);
      step += 1;
      window.setTimeout(next, gap);
    })();
  }
  window.setTimeout(showTune, 900);
  board.querySelector("#btReplay").addEventListener("click", function () { slow = false; showTune(); });
  board.querySelector("#btSlow").addEventListener("click", function () { slow = true; showTune(); });

  function addToParade() {
    const p = PARADE[(len - start) % PARADE.length];
    const chip = document.createElement("span");
    chip.className = "bt-chip"; chip.innerHTML = F.dinoHTML(p[0], { color: p[1], state: "walk", size: "100%" });
    parade.appendChild(chip); F.pop && F.pop(chip);
  }
  pads.forEach(function (pad) {
    pad.addEventListener("click", function () {
      if (playing || done) return;
      const i = Number(pad.dataset.i);
      hit(i);
      if (i !== sequence[input.length]) {
        input = []; drawLights(-1);
        pads.forEach(function (p) { p.disabled = true; });
        pads.forEach(function (p) { F.dinoState(p.querySelector(".du-dino"), "sad", 900); });
        play.miss(pad, "Oops! Let's listen to the tune again together. 💛");
        window.setTimeout(function () { playing = false; pads.forEach(function (p) { p.disabled = false; }); showTune(); }, 1400);
        playing = true;
        return;
      }
      input.push(i); drawLights(-1);
      if (input.length === len) {
        playing = true;
        pads.forEach(function (p) { p.disabled = true; });
        play.good(pad, { text: len >= target ? "The whole song!" : "Beat " + len + "! 🎵" });
        addToParade();
        if (len >= target) { window.setTimeout(finale, 900); return; }
        len += 1;
        window.setTimeout(function () { playing = false; play.say("A longer rhythm now: " + len + " beats!", 2000); showTune(); }, 1500);
      }
    });
  });

  function finale() {
    done = true;
    pads.forEach(function (p) { p.disabled = true; });
    parade.classList.add("marching");
    play.say("Parade time! 🎉 The whole parade plays your song!", 4000);
    let k = 0;
    (function song() {
      if (!board.isConnected) return;
      if (k >= sequence.length) { window.setTimeout(function () { play.finish("You played the whole dinosaur rhythm and led the parade!"); }, 600); return; }
      hit(sequence[k], false); k += 1; window.setTimeout(song, 360);
    })();
    const r = parade.getBoundingClientRect();
    if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "confetti", n: 40 });
    if (F.sfx) F.sfx.win();
  }
}
