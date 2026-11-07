/* Starry Dino Constellations — a night-sky dot-to-dot. Connect the stars in order (finger or mouse: a glowing thread
 * follows you) and every star chimes a higher note. Early skies show numbers; later skies glow once and you remember
 * the path. When the last star is joined the constellation lights up and a real dinosaur appears in the sky. */
import { createPlay, shuffle } from "../adv-kit.js?v=du-2b5bf1340085b709";

const SKIES = [
  { sp: "bronto", color: "orange", name: "The Great Long-neck", fact: "Long-necked dinosaurs could reach leaves high in the treetops.",
    pts: [[6, 52], [22, 46], [36, 38], [52, 38], [64, 38], [70, 24], [76, 10], [86, 12], [80, 18], [76, 30], [72, 48], [68, 60]] },
  { sp: "stego", color: "purple", name: "The Plated Dragon-Dino", fact: "Stegosaurus had big plates along its back and spikes on its tail.",
    pts: [[6, 50], [20, 48], [30, 40], [38, 28], [46, 38], [54, 24], [62, 36], [70, 28], [78, 40], [86, 46], [92, 52], [76, 60]] },
  { sp: "trex", color: "green", name: "The Mighty Rex", fact: "T. rex had tiny arms, strong legs and a very powerful bite.",
    pts: [[4, 52], [20, 46], [34, 32], [46, 28], [58, 26], [68, 14], [84, 20], [80, 30], [62, 38], [60, 48], [52, 60], [44, 66]] },
  { sp: "tricera", color: "teal", name: "The Three-Horn Star", fact: "Triceratops had three horns and a big bony frill.",
    pts: [[6, 50], [20, 42], [36, 34], [52, 34], [66, 18], [78, 12], [92, 32], [86, 42], [74, 46], [56, 54], [44, 62], [30, 60]] },
  { sp: "ptero", color: "blue", name: "The Sky Glider", fact: "Pteranodon was a flying reptile with huge skin wings.",
    pts: [[4, 22], [20, 32], [36, 38], [48, 40], [56, 52], [64, 38], [74, 30], [88, 20], [96, 36], [82, 40], [60, 28]] }
];
const SVGNS = "http://www.w3.org/2000/svg";

export function mountDinoConstellations(context) {
  const F = window.DUFX;
  const sky = SKIES[(context.level - 1) % SKIES.length];
  const count = Math.min(sky.pts.length, 6 + Math.floor(context.challenge / 2));
  const pts = sky.pts.slice(0, count);
  const numbered = context.challenge <= 4;
  const previewFirst = context.challenge >= 6;
  const play = createPlay(context, {
    emoji: "🌌", title: "Starry Dino Constellations", theme: "night", buddy: false, wander: false,
    instruction: numbered ? "Connect the stars in order, 1, 2, 3… and a dinosaur will appear in the sky!" : previewFirst ? "Watch the stars glow, then connect them in the same order." : "Connect the glowing stars in order to draw a dinosaur in the night sky.",
    hint: "Tap each star in turn. A little thread follows your finger.", allowed: 3
  });
  const board = play.board;
  board.innerHTML = '<div class="cn-sky" id="cnSky"><svg class="cn-lines" viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true"></svg><div class="cn-live" id="cnLive"></div></div><p class="cn-status" id="cnStatus"></p>';
  const skyEl = board.querySelector("#cnSky"), svg = board.querySelector(".cn-lines"), live = board.querySelector("#cnLive"), status = board.querySelector("#cnStatus");
  const rubber = document.createElementNS(SVGNS, "line"); rubber.setAttribute("class", "cn-rubber"); rubber.setAttribute("visibility", "hidden"); svg.appendChild(rubber);
  // faint background decoys
  for (let i = 0; i < 16; i++) { const d = document.createElement("i"); d.className = "cn-dot"; d.style.left = (Math.random() * 98).toFixed(1) + "%"; d.style.top = (Math.random() * 96).toFixed(1) + "%"; d.style.animationDelay = (-Math.random() * 4).toFixed(1) + "s"; skyEl.appendChild(d); }
  const stars = pts.map(function (p, i) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "cn-star"; b.style.left = p[0] + "%"; b.style.top = (p[1] / 70 * 100) + "%";
    b.innerHTML = "<span>✦</span>" + (numbered ? "<b>" + (i + 1) + "</b>" : "");
    b.setAttribute("aria-label", "Star " + (i + 1));
    skyEl.appendChild(b);
    if (F.anim) F.anim(b, [{ opacity: 0, transform: "translate(-50%,-50%) scale(0)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: 420, delay: i * 70, easing: "cubic-bezier(.2,.9,.3,1.5)", fill: "backwards" });
    return b;
  });
  let next = 0, locked = previewFirst, idleTimer = 0;
  const pos = (i) => [pts[i][0], pts[i][1]];
  function armHint() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(function () { if (!locked && next < count) { stars[next].classList.add("hint"); play.say(numbered ? "Look for star " + (next + 1) + "!" : "Try the pulsing star!", 2600); } }, 6000);
  }
  function begin() {
    locked = false;
    status.textContent = numbered ? "Start with star 1." : "Start with the star that glows.";
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
  }
  stars.forEach(function (s, i) {
    s.addEventListener("click", function () {
      if (locked || s.classList.contains("on")) return;
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
      else { window.clearTimeout(idleTimer); window.setTimeout(reveal, 700); }
    });
  });
  skyEl.addEventListener("pointermove", function (e) {
    if (next < 1 || next >= count || locked) return;
    const r = skyEl.getBoundingClientRect();
    rubber.setAttribute("x2", ((e.clientX - r.left) / r.width * 100).toFixed(1)); rubber.setAttribute("y2", ((e.clientY - r.top) / r.height * 70).toFixed(1));
  });

  function reveal() {
    locked = true;
    skyEl.classList.add("cn-won");
    svg.querySelectorAll(".cn-line").forEach(function (l) { l.classList.add("lit"); });
    // close the shape with a last line from the final star back to the first for a finished look
    live.innerHTML = '<div class="cn-dino">' + F.dinoHTML(sky.sp, { color: sky.color, state: "happy", size: "100%" }) + "</div>";
    if (F.sfx) { F.sfx.win(); window.setTimeout(F.sfx.sparkle, 300); (sky.sp === "trex" ? F.sfx.roar : F.sfx.chirp)(); }
    const r = skyEl.getBoundingClientRect();
    if (F.burst) { F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "stars", n: 30 }); F.burst(r.left + r.width / 2, r.top, { kind: "sparkle", n: 24 }); }
    status.innerHTML = "<b>" + sky.name + "</b><br>" + sky.fact + "<br><em>Make a wish on the first shooting star! 🌠</em>";
    play.say("A new constellation: " + sky.name + "! ✨", 3500);
    for (let k = 0; k < 3; k++) window.setTimeout(function () { const s = document.createElement("i"); s.className = "cn-shoot"; s.style.top = (8 + Math.random() * 30) + "%"; skyEl.appendChild(s); window.setTimeout(function () { s.remove(); }, 1400); }, 600 + k * 900);
    window.setTimeout(function () { play.finish("You drew the " + sky.name + " among the stars!"); }, 3800);
  }
}
