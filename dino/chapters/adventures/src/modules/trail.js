/* Footprint Trail — follow a winding line of giant footprints in order (counting by ones, then twos), and a little
 * tracker dinosaur trots along behind you. At the end of the trail a shadowy mystery dinosaur is hiding in the bush:
 * who made these tracks? Big feet, small feet, three toes, round toes — look closely! */
import { createPlay, shuffle } from "../adv-kit.js?v=du-5ee3d40e60884152";

const MAKERS = [
  { sp: "trex", color: "green", name: "Tyrannosaurus", print: "toes", size: 64, fact: "Three big toes, just like a giant bird!" },
  { sp: "tricera", color: "teal", name: "Triceratops", print: "round", size: 58, fact: "Wide, round feet to carry a heavy body." },
  { sp: "stego", color: "purple", name: "Stegosaurus", print: "round", size: 52, fact: "Stegosaurus walked on four sturdy legs." },
  { sp: "bronto", color: "orange", name: "Brontosaurus", print: "round", size: 74, fact: "Enormous round feet, as big as a table!" },
  { sp: "raptor", color: "red", name: "Velociraptor", print: "toes", size: 42, fact: "Small, quick feet with a sneaky sickle claw." }
];
const PRINT = {
  toes: '<svg viewBox="0 0 40 48"><ellipse cx="20" cy="39" rx="10" ry="8"/><ellipse cx="20" cy="15" rx="5.6" ry="13"/><ellipse cx="8.5" cy="23" rx="5" ry="11" transform="rotate(-30 8.5 23)"/><ellipse cx="31.5" cy="23" rx="5" ry="11" transform="rotate(30 31.5 23)"/></svg>',
  round: '<svg viewBox="0 0 40 48"><ellipse cx="20" cy="30" rx="15" ry="14"/><ellipse cx="7" cy="12" rx="4.2" ry="5.4"/><ellipse cx="16" cy="7" rx="4.2" ry="5.6"/><ellipse cx="25" cy="7" rx="4.2" ry="5.6"/><ellipse cx="33" cy="12" rx="4.2" ry="5.4"/></svg>'
};

export function mountTrail(context) {
  const F = window.DUFX;
  const maker = MAKERS[(context.level - 1) % MAKERS.length];
  const count = Math.min(14, 6 + context.challenge);
  const step = context.challenge >= 5 && context.challenge < 8 ? 2 : 1;
  const hideNumbers = context.challenge >= 8;
  const play = createPlay(context, {
    emoji: "👣", title: "Footprint trail", theme: "dig", buddy: false, wander: false,
    instruction: hideNumbers ? "Follow the trail of footprints from the start, one after another." : step === 2 ? "Count by twos! Tap 2, 4, 6… along the footprints." : "Tap the footprints in number order to follow the trail.",
    hint: "Start with the first footprint, near the little flag.", allowed: 2
  });
  const board = play.board;
  board.innerHTML = '<div class="tr-field"><span class="tr-flag" aria-hidden="true">🚩</span><span class="tr-bush" aria-hidden="true">🌳</span><span class="tr-deco d1" aria-hidden="true">🪨</span><span class="tr-deco d2" aria-hidden="true">🌿</span><span class="tr-deco d3" aria-hidden="true">🪨</span><span class="tr-deco d4" aria-hidden="true">🌴</span>' +
    '<div class="tr-tracker" id="trTracker"></div><div class="tr-mystery" id="trMystery" hidden></div></div><div class="tr-quiz" id="trQuiz" hidden></div>';
  const field = board.querySelector(".tr-field"), tracker = board.querySelector("#trTracker"), quiz = board.querySelector("#trQuiz"), mystery = board.querySelector("#trMystery");
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
  let next = 0, hintTimer = 0;
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
      if (F.sfx) F.sfx.thud();
      const r = el.getBoundingClientRect();
      if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "dust", n: 8 });
      play.good(el, { text: next === count ? "The end of the trail!" : null });
      F.dinoState(tracker.querySelector(".du-dino"), "walk", 650);
      place(i);
      if (next < count) { prints[next].classList.add("next"); armHint(); }
      else { window.clearTimeout(hintTimer); window.setTimeout(mysteryTime, 900); }
    });
  });

  function mysteryTime() {
    play.say("The tracks stop at the bush… who is hiding there? 🤔", 3500);
    play.hint("Look at the footprints again. Who made them?", true);
    mystery.hidden = false;
    const bush = field.querySelector(".tr-bush");
    bush.classList.add("shake");
    if (F.sfx) F.sfx.whoosh();
    const options = shuffle(MAKERS.filter(function (m) { return m !== maker; })).slice(0, 2).concat([maker]);
    quiz.hidden = false;
    quiz.innerHTML = '<p class="tr-q">Who made the footprints?</p><div class="tr-opts"></div>';
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
        window.setTimeout(function () { play.finish("You followed the footprints all the way to " + maker.name + "!"); }, 2600);
      });
    });
  }
}
