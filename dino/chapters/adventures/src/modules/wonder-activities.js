/* Wonder activities: Prehistoric Sky Mail and the Dino Weather Workshop. */
import { createPlay, shuffle, dragPiece, collect, collection } from "../adv-kit.js?v=du-04c80678fe526be4";

const SKY_ROUTES = [
  { creature: "Pteranodon", icon: "🪽", place: "Cloud Nest", placeIcon: "☁️", parcel: "Shiny shell", parcelIcon: "🐚", clue: "I live in a fluffy cloud nest." },
  { creature: "Quetzalcoatlus", icon: "🪽", place: "High Cliff", placeIcon: "⛰️", parcel: "Fern seeds", parcelIcon: "🌱", clue: "I live high up on a rocky cliff." },
  { creature: "Microraptor", icon: "🪶", place: "Rainbow Grove", placeIcon: "🌈", parcel: "Blue berries", parcelIcon: "🫐", clue: "I love rainbows and bright colours." },
  { creature: "Archaeopteryx", icon: "🪶", place: "Ancient Tree", placeIcon: "🌳", parcel: "Soft nest fluff", parcelIcon: "🪺", clue: "I live in a very, very old tree." },
  { creature: "Tapejara", icon: "🪽", place: "Sunny Lagoon", placeIcon: "🌊", parcel: "Pretty pebble", parcelIcon: "💎", clue: "I live beside the sunny water." },
  { creature: "Hatzegopteryx", icon: "🪽", place: "Fern Valley", placeIcon: "🌿", parcel: "Little flower", parcelIcon: "🌼", clue: "I live in a valley full of ferns." },
  { creature: "Rhamphorhynchus", icon: "🪽", place: "Moonlit Crag", placeIcon: "🌙", parcel: "Star map", parcelIcon: "🗺️", clue: "I come out when the moon is up." },
  { creature: "Yi qi", icon: "🪶", place: "Misty Woods", placeIcon: "🌲", parcel: "Warm scarf", parcelIcon: "🧣", clue: "I live in the misty pine woods." }
];

const WEATHER_MISSIONS = [
  { sky: "A sunny afternoon", skyIcon: "☀️", cls: "day", need: "The young plants need water", needIcon: "🌱", answer: "Rain cloud", fact: "Rain gives thirsty plants the water they need." },
  { sky: "A warm, bright day", skyIcon: "🌤️", cls: "day", need: "I need a cool, shady spot", needIcon: "🥵", answer: "Leafy shade", fact: "Leaves can make a cool shady place." },
  { sky: "A breezy morning", skyIcon: "🍃", cls: "wind", need: "My nest needs shelter from the wind", needIcon: "🪺", answer: "Fern windbreak", fact: "Plants can help shelter small places from the wind." },
  { sky: "A chilly evening", skyIcon: "🌙", cls: "chill", need: "I need a snug, warm nest", needIcon: "🥶", answer: "Soft nest leaves", fact: "A cosy nest helps a hatchling feel safe and warm." },
  { sky: "A rainy morning", skyIcon: "🌧️", cls: "rain", need: "I want to splash in a puddle", needIcon: "🦖", answer: "Rain pool", fact: "Rainwater gathers in little pools and puddles." },
  { sky: "A clear night", skyIcon: "🌌", cls: "night", need: "I need a calm, sleepy bedtime", needIcon: "😴", answer: "Quiet star glow", fact: "The night sky changes as Earth turns beneath the stars." }
];
const TOOLS = [
  { name: "Rain cloud", icon: "🌧️", fx: "rain" }, { name: "Leafy shade", icon: "🌿", fx: "shade" },
  { name: "Fern windbreak", icon: "🌾", fx: "wind" }, { name: "Soft nest leaves", icon: "🍂", fx: "nest" },
  { name: "Rain pool", icon: "💧", fx: "pool" }, { name: "Quiet star glow", icon: "✨", fx: "stars" }
];
const GUESTS = [["tricera", "teal"], ["stego", "purple"], ["bronto", "orange"], ["raptor", "red"], ["trex", "green"], ["tricera", "yellow"]];

/* ============================================================ Prehistoric Sky Mail */
export function mountSkyMail(context) {
  const F = window.DUFX;
  const count = Math.min(SKY_ROUTES.length, 4 + Math.floor(Math.max(0, context.challenge) / 2));
  const stops = Math.min(SKY_ROUTES.length, 3 + Math.floor(Math.max(0, context.challenge) / 2));
  const clueMode = context.challenge >= 5;
  const play = createPlay(context, {
    emoji: "📮", title: "Prehistoric Sky Mail", theme: "sky", buddy: false, wander: false,
    instruction: "Fly the mail! Take each parcel to the right sky friend: drag it to their home, or tap the home.", hint: "Read the address on the parcel, then choose the home that matches.", allowed: 3
  });
  const board = play.board;
  const routes = shuffle(SKY_ROUTES.slice()).slice(0, count);
  let n = 0, busy = false;
  const album = collection("postcards");

  function drawStops(route) {
    const pool = shuffle(SKY_ROUTES.filter(function (r) { return r !== route; })).slice(0, stops - 1).concat([route]);
    return shuffle(pool);
  }
  function next() {
    if (n >= routes.length) return end();
    const route = routes[n]; busy = false;
    const choices = drawStops(route);
    board.innerHTML = '<div class="sm-parcel" id="smParcel"><button type="button" class="sm-box" id="smBox" aria-label="The parcel">' + route.parcelIcon + '</button><div><b>' + route.parcel + '</b><br><small>' + (clueMode ? "Deliver to a friend who says: “" + route.clue + "”" : "For " + route.creature + " at the " + route.place) + '</small></div><span class="sm-count">' + (n + 1) + " / " + routes.length + "</span></div>" +
      '<div class="sm-map" id="smMap"><div class="sm-mail" id="smMail">' + F.dinoHTML("ptero", { color: "pink", state: "idle", size: "100%" }) + '<span class="sm-carry" id="smCarry">' + route.parcelIcon + '</span></div><div class="sm-homes"></div></div>' +
      '<div class="sm-album" aria-label="Postcards">📬 Postcards: <b>' + collection("postcards").length + "</b></div>";
    const homes = board.querySelector(".sm-homes");
    choices.forEach(function (r, i) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "sm-home"; b.innerHTML = "<span>" + r.placeIcon + "</span><strong>" + r.place + "</strong><small>" + (clueMode ? "" : "for " + r.creature) + "</small>";
      b.style.setProperty("--y", (i % 2 ? 14 : 0) + "px");
      homes.appendChild(b);
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(24px) scale(.6)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: i * 70, fill: "backwards" });
      b.addEventListener("click", function () { deliver(route, r, b); });
    });
    dragPiece(board.querySelector("#smBox"), {
      ghost: function () { const g = document.createElement("div"); g.className = "hb-ghost"; g.textContent = route.parcelIcon; g.style.fontSize = "48px"; return g; },
      onDrop: function (x, y) {
        const el = document.elementFromPoint(x, y), home = el && el.closest && el.closest(".sm-home");
        if (home) home.click(); else play.hint("Drop the parcel on a home, or tap the home!", true);
      }
    });
    play.hint(clueMode ? "Think about the clue, then choose the matching home." : "Find " + route.creature + "'s " + route.place + ".", true);
    play.say(clueMode ? "A friend says: " + route.clue : "A parcel for " + route.creature + "!", 3200);
  }
  function deliver(route, chosen, btn) {
    if (busy) return;
    busy = true;
    const mail = board.querySelector("#smMail"), map = board.querySelector("#smMap");
    const mr = mail.getBoundingClientRect(), br = btn.getBoundingClientRect(), pr = map.getBoundingClientRect();
    const dx = br.left + br.width / 2 - (mr.left + mr.width / 2), dy = br.top - mr.top - 30;
    const right = chosen === route;
    F.dinoState(mail.querySelector(".du-dino"), "walk");
    if (F.sfx) F.sfx.whoosh();
    const play1 = mail.animate && F.motionOK && F.motionOK() ? mail.animate([{ translate: "0 0" }, { translate: dx * 0.5 + "px " + (dy - 50) + "px", offset: .5 }, { translate: dx + "px " + dy + "px" }], { duration: 1100, easing: "ease-in-out", fill: "forwards" }) : null;
    const arrive = function () {
      if (right) {
        board.querySelector("#smCarry").remove();
        const guest = document.createElement("span"); guest.className = "sm-guest"; guest.textContent = route.icon; btn.appendChild(guest); F.pop && F.pop(guest);
        btn.classList.add("got");
        if (F.sfx) { F.sfx.chirp(); window.setTimeout(F.sfx.sparkle, 250); }
        const r = btn.getBoundingClientRect();
        if (F.burst) F.burst(r.left + r.width / 2, r.top, { kind: "hearts", n: 10 });
        play.good(btn, { text: "Thank you!" });
        play.say(route.creature + ": “Thank you for my " + route.parcel.toLowerCase() + "!” 💌", 3000);
        collect("postcards", { creature: route.creature, place: route.place });
        n += 1;
        window.setTimeout(next, 2200);
      } else {
        play.miss(btn, "Nobody's home at the " + chosen.place + " for this parcel! Let's fly back and try again. 💛");
        btn.classList.add("nope");
        const back = mail.animate ? mail.animate([{ translate: dx + "px " + dy + "px" }, { translate: "0 0" }], { duration: 900, easing: "ease-in-out", fill: "forwards" }) : null;
        window.setTimeout(function () { btn.classList.remove("nope"); F.dinoState(mail.querySelector(".du-dino"), "idle"); busy = false; }, 1000);
      }
    };
    if (play1) play1.onfinish = arrive; else arrive();
  }
  function end() {
    board.innerHTML = '<div class="sm-fin"><div class="sm-fin-art">' + F.dinoHTML("ptero", { color: "pink", state: "happy", size: "100%" }) + '</div><h3>Every parcel arrived! 📬</h3><p>You have <b>' + collection("postcards").length + '</b> thank-you postcards.</p></div>';
    if (F.sfx) F.sfx.win();
    const r = board.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + 40, { kind: "confetti", n: 40 });
    window.setTimeout(function () { play.finish("You delivered every parcel to its prehistoric friend!"); }, 1800);
  }
  next();
}

/* ============================================================ Dino Weather Workshop */
export function mountWeatherWorkshop(context) {
  const F = window.DUFX;
  const count = Math.min(WEATHER_MISSIONS.length, 4 + Math.floor(Math.max(0, context.challenge) / 2));
  const missions = shuffle(WEATHER_MISSIONS.slice()).slice(0, count);
  const play = createPlay(context, {
    emoji: "🌦️", title: "Dino Weather Workshop", theme: "rain", buddy: false, wander: false,
    instruction: "Look at the sky and listen to your dinosaur friend. Press a weather power and see what happens!", hint: "Every power is safe to try. Find the one that helps.", allowed: 3
  });
  const board = play.board;
  let n = 0, busy = false, tries = 0;

  function next() {
    if (n >= missions.length) return end();
    const m = missions[n], g = GUESTS[(n + context.level) % GUESTS.length]; busy = false; tries = 0;
    board.innerHTML = '<div class="wx-scene wx-' + m.cls + '" id="wxScene"><div class="wx-sky"><span class="wx-skyicon">' + m.skyIcon + '</span><b>' + m.sky + '</b></div><div class="wx-fx" id="wxFx"></div><div class="wx-plants">🌱🌱🌱</div>' +
      '<div class="wx-guest" id="wxGuest">' + F.dinoHTML(g[0], { color: g[1], state: "sad", size: "100%" }) + '</div><div class="wx-bubble"><span>' + m.needIcon + "</span> " + m.need + '</div><span class="wx-count">' + (n + 1) + " / " + missions.length + '</span></div>' +
      '<div class="wx-tools" id="wxTools"></div><p class="wx-fact" id="wxFact"></p>';
    const tools = board.querySelector("#wxTools");
    shuffle(TOOLS.slice()).forEach(function (t, i) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "wx-tool"; b.innerHTML = "<span>" + t.icon + "</span><small>" + t.name + "</small>";
      tools.appendChild(b);
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(20px) scale(.6)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: i * 60, fill: "backwards" });
      b.addEventListener("click", function () { use(t, m, b); });
    });
    play.say("Friend: “" + m.need + "”", 3200);
  }
  function use(t, m, btn) {
    if (busy) return;
    busy = true;
    const scene = board.querySelector("#wxScene"), fx = board.querySelector("#wxFx"), d = board.querySelector("#wxGuest .du-dino");
    effect(t.fx, scene, fx);
    const right = t.name === m.answer;
    window.setTimeout(function () {
      if (right) {
        F.dinoState(d, "happy", 99999);
        const r = scene.getBoundingClientRect();
        play.good({ x: r.left + r.width / 2, y: r.top + r.height * 0.5 }, { text: "That helped!" });
        if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height * 0.5, { kind: "hearts", n: 12 });
        board.querySelector("#wxFact").textContent = m.fact;
        board.querySelectorAll(".wx-tool").forEach(function (b) { b.disabled = true; });
        n += 1;
        window.setTimeout(next, 3200);
      } else {
        tries += 1;
        F.dinoState(d, "sad", 800);
        play.miss(btn, t.name + " is wonderful for another day! " + (tries >= 2 ? "Hint: think about " + m.needIcon + "." : "Try a different weather power."));
        window.setTimeout(function () { fx.innerHTML = ""; scene.classList.remove("wx-shaded", "wx-darker"); busy = false; }, 600);
      }
    }, 2200);
  }
  function effect(kind, scene, fx) {
    fx.innerHTML = "";
    const F2 = window.DUFX;
    if (kind === "rain") {
      fx.innerHTML = '<span class="wx-cloud">🌧️</span>' + Array.from({ length: 18 }, function (_, i) { return '<i class="wx-drop" style="left:' + (8 + i * 5) + '%;animation-delay:' + (-(i % 6) * 0.2) + 's"></i>'; }).join("");
      const p = scene.querySelector(".wx-plants"); p.classList.add("grow"); window.setTimeout(function () { p.textContent = "🌿🌻🌿"; }, 1400);
      if (F2.sfx) F2.sfx.splash();
    } else if (kind === "shade") {
      fx.innerHTML = '<span class="wx-canopy">🌿🌳🌿</span>'; scene.classList.add("wx-shaded"); if (F2.sfx) F2.sfx.whoosh();
    } else if (kind === "wind") {
      fx.innerHTML = '<span class="wx-wall">🌾🌾🌾</span>' + Array.from({ length: 5 }, function (_, i) { return '<i class="wx-gust" style="top:' + (22 + i * 11) + '%;animation-delay:' + (-i * 0.3) + 's"></i>'; }).join(""); if (F2.sfx) F2.sfx.whoosh();
    } else if (kind === "nest") {
      fx.innerHTML = '<span class="wx-nest">🪺</span>' + Array.from({ length: 6 }, function (_, i) { return '<i class="wx-leaf" style="left:' + (20 + i * 11) + '%;animation-delay:' + (i * 0.2) + 's">🍂</i>'; }).join(""); if (F2.sfx) F2.sfx.pop();
    } else if (kind === "pool") {
      fx.innerHTML = '<span class="wx-puddle"></span>'; if (F2.sfx) F2.sfx.splash(); if (F2.burst) { const r = scene.getBoundingClientRect(); F2.burst(r.left + r.width / 2, r.top + r.height * 0.8, { kind: "drops", n: 12 }); }
    } else if (kind === "stars") {
      scene.classList.add("wx-darker"); fx.innerHTML = Array.from({ length: 14 }, function () { return '<i class="wx-star" style="left:' + (Math.random() * 94).toFixed(0) + '%;top:' + (Math.random() * 50).toFixed(0) + '%;animation-delay:' + (-Math.random() * 2).toFixed(1) + 's"></i>'; }).join("") + '<span class="wx-zzz">💤</span>'; if (F2.sfx) { F2.sfx.sparkle(); F2.sfx.note(4, .8); }
    }
  }
  function end() {
    board.innerHTML = '<div class="sm-fin"><div class="sm-fin-art">' + F.dinoHTML("tricera", { color: "teal", state: "happy", size: "100%" }) + '</div><h3>Little nature helper! 🌈</h3><p>You helped every prehistoric friend feel just right.</p></div>';
    if (F.sfx) F.sfx.win();
    const r = board.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + 40, { kind: "confetti", n: 40 });
    window.setTimeout(function () { play.finish("You made a happy home for the dinosaurs!"); }, 1800);
  }
  next();
}
