/* Wonder activities: Prehistoric Sky Mail and the Dino Weather Workshop. */
import { createPlay, shuffle, dragPiece, collect, collection } from "../adv-kit.js?v=du-cd75bb4cc7df44ba";

const SKY_ROUTES = [
  { creature: "Pteranodon", icon: "🪽", place: "Cloud Nest", placeIcon: "🪹", parcel: "Shiny shell", parcelIcon: "🐚", clue: "I live in a fluffy cloud nest.", sky: "day" },
  { creature: "Quetzalcoatlus", icon: "🪽", place: "High Cliff", placeIcon: "⛰️", parcel: "Tender green shoots", parcelIcon: "🌱", clue: "I live high up on a rocky cliff.", sky: "day" },
  { creature: "Microraptor", icon: "🪶", place: "Rainbow Grove", placeIcon: "🌈", parcel: "Blue berries", parcelIcon: "🫐", clue: "I love rainbows and bright colours.", sky: "storm" },
  { creature: "Archaeopteryx", icon: "🪶", place: "Ancient Tree", placeIcon: "🌵", parcel: "Soft nest fluff", parcelIcon: "🪺", clue: "I live in a very, very old cycad tree.", sky: "day" },
  { creature: "Tapejara", icon: "🪽", place: "Sunny Lagoon", placeIcon: "🌊", parcel: "Pretty pebble", parcelIcon: "💎", clue: "I live beside the sunny water.", sky: "day" },
  { creature: "Hatzegopteryx", icon: "🪽", place: "Fern Valley", placeIcon: "🌿", parcel: "Little flower", parcelIcon: "🌼", clue: "I live in a valley full of ferns.", sky: "day" },
  { creature: "Rhamphorhynchus", icon: "🪽", place: "Moonlit Crag", placeIcon: "🔮", parcel: "Star map", parcelIcon: "🗺️", clue: "I come out when the moon is up.", sky: "night" },
  { creature: "Yi qi", icon: "🪶", place: "Misty Woods", placeIcon: "🌫️", parcel: "A pad of soft moss", parcelIcon: "☘️", clue: "I live where the mist sits between the trees.", sky: "dusk" },
  { creature: "Anhanguera", icon: "🪽", place: "Fisher's Rocks", placeIcon: "🪨", parcel: "Slippery fish", parcelIcon: "🐟", clue: "I fish from the rocks where the waves splash.", sky: "day" },
  { creature: "Nyctosaurus", icon: "🪶", place: "Twilight Tor", placeIcon: "🟧", parcel: "Glowing mushroom", parcelIcon: "🍄", clue: "I fly out when the sun is going down.", sky: "dusk" },
  { creature: "Istiodactylus", icon: "🪽", place: "Pine Ridge", placeIcon: "🌲", parcel: "Pine cone", parcelIcon: "🌰", clue: "I live on a ridge full of pine trees.", sky: "day" },
  { creature: "Tupandactylus", icon: "🪽", place: "Palm Grove", placeIcon: "🌴", parcel: "A drop of golden sap", parcelIcon: "🍯", clue: "I live in a grove of tall palms.", sky: "day" },
  { creature: "Thalassodromeus", icon: "🪽", place: "Windy Cliff", placeIcon: "🌪️", parcel: "Brave badge", parcelIcon: "🎖️", clue: "I fly highest when the storm rolls in.", sky: "storm" },
  { creature: "Dimorphodon", icon: "🪶", place: "Dragonfly Fen", placeIcon: "🎋", parcel: "Swirly snail shell", parcelIcon: "🐌", clue: "I live in a fen where the dragonflies dart.", sky: "dusk" }
];
/* the sky over the map changes with the route, so no two flights look the same */
const SKIES = {
  day: { bg: "linear-gradient(#8fd3f4 0%, #cdeefc 55%, #eafbe7 100%)", cloud: "☁️", sun: "🌞" },
  dusk: { bg: "linear-gradient(#ffb46f 0%, #d79ad0 55%, #5b4f98 100%)", cloud: "☁️", sun: "🌇" },
  night: { bg: "linear-gradient(#16204f 0%, #3f4a86 60%, #6f7bb5 100%)", cloud: "☁️", sun: "🌙" },
  storm: { bg: "linear-gradient(#5d7288 0%, #93a9bb 60%, #cfe0e6 100%)", cloud: "🌧️", sun: "💨" }
};
function skyScenery(sky) {
  const s = SKIES[sky] || SKIES.day;
  let html = '<i style="position:absolute;left:8%;top:6%;font-size:30px;animation:pk-sun 5s ease-in-out infinite">' + s.sun + "</i>";
  for (let i = 0; i < 3; i++) {
    html += '<i style="position:absolute;left:-20%;top:' + (12 + i * 16) + '%;font-size:' + (26 + i * 8) + 'px;opacity:.9;animation:pk-drift ' + (26 + i * 9) + 's linear infinite;animation-delay:-' + (i * 8) + 's">' + s.cloud + "</i>";
  }
  if (sky === "night" || sky === "dusk") {
    for (let i = 0; i < 10; i++) html += '<b style="position:absolute;left:' + (Math.random() * 96).toFixed(0) + '%;top:' + (Math.random() * 46).toFixed(0) + '%;font-size:12px;animation:pk-twinkle ' + (1.6 + Math.random() * 1.8).toFixed(1) + 's ease-in-out infinite;animation-delay:-' + (Math.random() * 2).toFixed(1) + 's">✦</b>';
  }
  if (sky === "storm") {
    for (let i = 0; i < 12; i++) html += '<i style="position:absolute;left:' + (6 + i * 7.5) + '%;top:18%;width:4px;height:13px;border-radius:4px;background:#5fb4ec;animation:wx-fall .8s linear infinite;animation-delay:-' + ((i % 5) * 0.16).toFixed(2) + 's"></i>';
    html += '<i style="position:absolute;left:62%;top:8%;font-size:26px;animation:pk-twinkle 3.4s ease-in-out infinite">⚡</i>';
  }
  return html;
}

const WEATHER_MISSIONS = [
  { sky: "A sunny afternoon", skyIcon: "☀️", cls: "day", need: "The young plants need water", needIcon: "🌱", answer: "Rain cloud", fact: "Rain gives thirsty plants the water they need.", also: { need: "Now the little one wants a splash!", needIcon: "💧", answer: "Rain pool", fact: "Rainwater gathers in little pools and puddles." } },
  { sky: "A warm, bright day", skyIcon: "🌤️", cls: "day", need: "I need a cool, shady spot", needIcon: "🔥", answer: "Leafy shade", fact: "Leaves can make a cool shady place." },
  { sky: "A breezy morning", skyIcon: "🍃", cls: "wind", need: "My nest needs shelter from the wind", needIcon: "🪺", answer: "Grass windbreak", fact: "Plants can help shelter small places from the wind." },
  { sky: "A chilly evening", skyIcon: "🌙", cls: "chill", need: "I need a snug, warm nest", needIcon: "❄️", answer: "Soft nest leaves", fact: "A cosy nest helps a hatchling feel safe and warm.", also: { need: "And a sleepy, starry sky, please", needIcon: "😴", answer: "Quiet star glow", fact: "The night sky changes as Earth turns beneath the stars." } },
  { sky: "A rainy morning", skyIcon: "🌧️", cls: "rain", need: "I want to splash in a puddle", needIcon: "🦖", answer: "Rain pool", fact: "Rainwater gathers in little pools and puddles." },
  { sky: "A clear night", skyIcon: "🌌", cls: "night", need: "I need a calm, sleepy bedtime", needIcon: "😴", answer: "Quiet star glow", fact: "The night sky changes as Earth turns beneath the stars." },
  { sky: "A grey, cloudy day", skyIcon: "☁️", cls: "day", need: "My little plants are not getting enough light", needIcon: "🌿", answer: "Sun mirror", fact: "Plants turn their leaves towards the light to grow." },
  { sky: "A frosty dawn", skyIcon: "🌄", cls: "chill", need: "My eggs are cold at both ends!", needIcon: "🥚", answer: "Warm moss blanket", fact: "A soft blanket of moss keeps eggs toasty." },
  { sky: "A hot, still afternoon", skyIcon: "🔥", cls: "day", need: "There is no breeze and I am panting", needIcon: "💨", answer: "Feather fan", fact: "Moving air helps big dinosaurs cool down." },
  { sky: "A dark, starless night", skyIcon: "🌑", cls: "night", need: "I cannot see my way home", needIcon: "🌫️", answer: "Glow torch", fact: "Some prehistoric friends glowed to find their family." },
  { sky: "A rumbly storm", skyIcon: "⛈️", cls: "rain", need: "The thunder is loud and I feel scared", needIcon: "⚡", answer: "Cosy cave", fact: "A cave keeps the noise of a storm far away." },
  { sky: "A blustery, sandy day", skyIcon: "🌪️", cls: "wind", need: "My eyes are full of swirling sand", needIcon: "🟧", answer: "Wall of sprouts", fact: "Sprouting roots hold the sand down so the air stays clear." }
];
const TOOLS = [
  { name: "Rain cloud", icon: "🌧️", fx: "rain" }, { name: "Leafy shade", icon: "🌿", fx: "shade" },
  { name: "Grass windbreak", icon: "🌾", fx: "wind" }, { name: "Soft nest leaves", icon: "🍂", fx: "nest" },
  { name: "Rain pool", icon: "💧", fx: "pool" }, { name: "Quiet star glow", icon: "✨", fx: "stars" },
  { name: "Sun mirror", icon: "🔆", fx: "sun" }, { name: "Warm moss blanket", icon: "☘️", fx: "blanket" },
  { name: "Feather fan", icon: "🪶", fx: "breeze" }, { name: "Glow torch", icon: "🪔", fx: "lantern" },
  { name: "Cosy cave", icon: "⛰️", fx: "cave" }, { name: "Wall of sprouts", icon: "🌱", fx: "grass" }
];
/* a helping of extra sky colours so each mission scene looks different */
const SKY_TINTS = { day: "", rain: "wx-rain", night: "wx-night", chill: "wx-chill", wind: "wx-wind" };
const GUESTS = [["tricera", "teal"], ["stego", "purple"], ["bronto", "orange"], ["raptor", "red"], ["trex", "green"], ["tricera", "yellow"], ["ptero", "pink"], ["stego", "teal"], ["bronto", "purple"], ["raptor", "orange"]];

/* ============================================================ Prehistoric Sky Mail */
export function mountSkyMail(context) {
  const F = window.DUFX;
  const ch = Math.max(1, Number(context.challenge) || 1);
  const count = Math.min(SKY_ROUTES.length, 4 + Math.floor(ch / 2));
  const stops = Math.min(SKY_ROUTES.length, 3 + Math.floor(ch / 2));
  const clueMode = ch >= 5;
  const play = createPlay(context, {
    emoji: "📮", title: "Prehistoric Sky Mail", theme: "sky", buddy: false, wander: false,
    instruction: "Fly the mail! Take each parcel to the right sky friend: drag it to their home, or tap the home.", hint: "Read the address on the parcel, then choose the home that matches.", allowed: 3
  });
  const board = play.board;
  const routes = shuffle(SKY_ROUTES.slice()).slice(0, count);
  let n = 0, busy = false, rush = false, rushAsked = false;
  let delivered = 0, mixups = 0;

  function ledger() {
    const runs = collection("mail-runs");
    const best = runs.reduce(function (m, r) { return Math.max(m, Number(r.delivered) || 0); }, 0);
    return '<div class="sm-album" aria-label="Your postbags">📬 Postcards: <b>' + collection("postcards").length + "</b>" +
      (runs.length ? " · best flight: <b>" + best + "</b> parcels" : "") + (ch >= 5 ? " · clue delivery!" : "") + "</div>";
  }
  function drawStops(route) {
    const pool = shuffle(SKY_ROUTES.filter(function (r) { return r !== route; })).slice(0, stops - 1).concat([route]);
    return shuffle(pool);
  }
  function askText(route) {
    return rush || clueMode ? "Deliver to a friend who says: “" + route.clue + "”" : "For " + route.creature + " at the " + route.place;
  }
  function next() {
    if (n >= routes.length) return rush ? end() : offerRush();
    const route = routes[n]; busy = false;
    const hides = rush || clueMode;
    const choices = drawStops(route);
    board.innerHTML = '<div class="sm-parcel" id="smParcel"><button type="button" class="sm-box" id="smBox" aria-label="The parcel">' + route.parcelIcon + '</button><div><b>' + route.parcel + '</b><br><small>' + askText(route) + '</small></div><span class="sm-count">' + (n + 1) + " / " + routes.length + "</span></div>" +
      (rush ? '<p style="text-align:center;margin:0 0 6px;font-weight:900;color:#fff;text-shadow:0 2px 0 rgba(30,60,90,.6)">🌟 Twilight rush — three more for the star badge!</p>' : "") +
      '<div class="sm-map" id="smMap" style="background:' + (SKIES[route.sky] || SKIES.day).bg + ';border-radius:22px;overflow:hidden;padding-bottom:10px">' +
      '<div style="position:absolute;inset:0;pointer-events:none">' + skyScenery(route.sky) + "</div>" +
      '<div class="sm-mail" id="smMail">' + F.dinoHTML("ptero", { color: "pink", state: "idle", size: "100%" }) + '<span class="sm-carry" id="smCarry">' + route.parcelIcon + '</span></div><div class="sm-homes"></div></div>' +
      '<p style="text-align:center;margin:8px 0 0"><button type="button" class="tiny-button" id="smHelp">💡 Where does this friend live?</button></p>' + ledger();
    const homes = board.querySelector(".sm-homes");
    let rightBtn = null;
    choices.forEach(function (r, i) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "sm-home"; b.innerHTML = "<span>" + r.placeIcon + "</span><strong>" + r.place + "</strong><small>" + (hides ? "" : "for " + r.creature) + "</small>";
      b.style.setProperty("--y", (i % 2 ? 14 : 0) + "px");
      homes.appendChild(b);
      if (r === route) rightBtn = b;
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(24px) scale(.6)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: i * 70, fill: "backwards" });
      b.addEventListener("click", function () { deliver(route, r, b); });
    });
    const helpBtn = board.querySelector("#smHelp");
    helpBtn.addEventListener("click", function () {
      if (!rightBtn) return;
      glow(rightBtn);
      if (F.sfx) F.sfx.star();
      play.hint("Follow the clue: “" + route.clue + "” — that home has the " + route.placeIcon + "!", true);
      play.say("Your friend lives at the " + route.place + ".", 3200);
    });
    dragPiece(board.querySelector("#smBox"), {
      ghost: function () { const g = document.createElement("div"); g.className = "hb-ghost"; g.textContent = route.parcelIcon; g.style.fontSize = "48px"; return g; },
      onDrop: function (x, y) {
        const el = document.elementFromPoint(x, y), home = el && el.closest && el.closest(".sm-home");
        if (home) home.click(); else play.hint("Drop the parcel on a home, or tap the home!", true);
      }
    });
    play.hint(hides ? "Think about the clue, then choose the matching home." : "Find " + route.creature + "'s " + route.place + ".", true);
    play.say(hides ? "A friend says: " + route.clue : "A parcel for " + route.creature + "!", 3200);
  }
  function glow(el) {
    board.querySelectorAll(".sm-home[data-hint]").forEach(function (b) { b.removeAttribute("data-hint"); b.style.boxShadow = ""; });
    el.setAttribute("data-hint", "1");
    el.style.boxShadow = "0 0 0 5px #ffd166, 0 6px 0 rgba(24,62,64,.2)";
    if (F.anim) F.anim(el, [{ transform: "scale(1) translateY(var(--y,0))" }, { transform: "scale(1.14) translateY(var(--y,0))" }, { transform: "scale(1) translateY(var(--y,0))" }], { duration: 620, easing: "ease-in-out" });
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
    if (play1 && F.motionOK && F.motionOK()) {
      let steps = 0;
      const trail = window.setInterval(function () {
        if (!board.isConnected) { window.clearInterval(trail); return; }
        steps += 1;
        if (F.burst) F.burst(mr.left + mr.width / 2 + dx * (steps / 8), mr.top + dy * (steps / 8) - 20, { kind: route.sky === "night" ? "stars" : "sparkle", n: 4 });
        if (steps >= 7) window.clearInterval(trail);
      }, 140);
      stateTrail = trail;
    }
    const arrive = function () {
      if (right) {
        board.querySelector("#smCarry").remove();
        const guest = document.createElement("span"); guest.className = "sm-guest"; guest.textContent = route.icon; btn.appendChild(guest); F.pop && F.pop(guest);
        btn.classList.add("got");
        stamp(btn, route.parcelIcon);
        if (F.sfx) { F.sfx.chirp(); window.setTimeout(F.sfx.sparkle, 250); window.setTimeout(function () { F.sfx.note(6, 0.5); }, 520); }
        const r = btn.getBoundingClientRect();
        if (F.burst) { F.burst(r.left + r.width / 2, r.top, { kind: "hearts", n: 10 }); F.burst(r.left + r.width / 2, r.top, { kind: "confetti", n: 12 }); }
        play.good(btn, { text: "Thank you!" });
        play.say(route.creature + ": “Thank you for my " + route.parcel.toLowerCase() + "!” ✨", 3000);
        collect("postcards", { creature: route.creature, place: route.place });
        delivered += 1; n += 1;
        if (rush && delivered % 3 === 0) play.bonus();
        window.setTimeout(next, 2200);
      } else {
        mixups += 1;
        play.miss(btn, "So close! Nobody at the " + chosen.place + " asked for this one. Your friend said: “" + route.clue + "” — try again! ✨");
        btn.classList.add("nope");
        if (F.sfx) F.sfx.thud();
        const back = mail.animate ? mail.animate([{ translate: dx + "px " + dy + "px" }, { translate: "0 0" }], { duration: 900, easing: "ease-in-out", fill: "forwards" }) : null;
        window.setTimeout(function () { btn.classList.remove("nope"); F.dinoState(mail.querySelector(".du-dino"), "idle"); busy = false; }, 1000);
      }
    };
    if (play1) play1.onfinish = arrive; else arrive();
  }
  let stateTrail = null;
  /* a thank-you stamp thumps onto the home so the child sees the delivery land */
  function stamp(btn, icon) {
    const s = document.createElement("i");
    s.textContent = icon;
    s.style.cssText = "position:absolute;left:-6px;top:-18px;font-size:26px;font-style:normal;transform:rotate(-14deg);animation:stamppop .6s cubic-bezier(.3,1.7,.5,1) both";
    btn.appendChild(s);
  }
  /* optional bonus leg after every parcel is delivered — always skippable */
  function offerRush() {
    if (rushAsked || ch < 3) return end();
    rushAsked = true;
    board.innerHTML = '<div class="sm-fin"><div class="sm-fin-art">' + F.dinoHTML("ptero", { color: "pink", state: "happy", size: "100%" }) + "</div><h3>All " + routes.length + ' parcels delivered! 📬</h3>' +
      "<p>Want a twilight rush? Three more parcels, found only by their clues.</p>" +
      '<p style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px"><button type="button" class="pk-btn" id="smRush">🌟 Fly the rush</button><button type="button" class="tiny-button" id="smDone">No thank you, I am done</button></p>' + ledger() + "</div>";
    if (F.sfx) F.sfx.win();
    const r = board.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + 40, { kind: "confetti", n: 40 });
    board.querySelector("#smRush").addEventListener("click", function () {
      rush = true;
      routes.length = 0;
      shuffle(SKY_ROUTES.slice()).slice(0, 3).forEach(function (x) { routes.push(x); });
      n = 0;
      play.say("Twilight rush! Three clue-only deliveries. 🌙", 3000);
      next();
    });
    board.querySelector("#smDone").addEventListener("click", function () { rush = false; end(); });
  }
  function end() {
    collect("mail-runs", { delivered: delivered, mixups: mixups, rush: rush ? 3 : 0, clue: rush || clueMode ? 1 : 0 });
    board.innerHTML = '<div class="sm-fin"><div class="sm-fin-art">' + F.dinoHTML("ptero", { color: "pink", state: "happy", size: "100%" }) + '</div><h3>Every parcel arrived! 📬</h3><p>You have <b>' + collection("postcards").length + '</b> thank-you postcards.</p>' +
      (mixups ? "<p>" + delivered + " delivered" + (rush ? " including the twilight rush" : "") + ".</p>" : "<p>Not one wrong door, " + delivered + " parcels delivered!</p>") + "</div>";
    if (F.sfx) { F.sfx.win(); window.setTimeout(F.sfx.drum, 400); }
    const r = board.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + 40, { kind: "confetti", n: 40 });
    if (rush) play.bonus();
    window.setTimeout(function () {
      play.finish("You flew " + delivered + " parcels over the " + (rush ? "twilight sky" : "sunny sky") + " to their prehistoric friends" + (rush ? ", and won the twilight rush badge 🌟" : "!"));
    }, 1800);
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
        window.setTimeout(function () { fx.innerHTML = ""; scene.classList.remove("wx-shaded", "wx-darker", "wx-brighter", "wx-warm", "wx-lit", "wx-sheltered"); busy = false; }, 600);
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
    } else if (kind === "sun") {
      // A mirror catches the sun and bends a warm beam down onto the light-starved plants.
      scene.classList.add("wx-brighter");
      fx.innerHTML = '<span class="wx-mirror">🔆</span>' + Array.from({ length: 5 }, function (_, i) { return '<i class="wx-ray" style="left:' + (30 + i * 9) + '%;animation-delay:' + (i * 0.12) + 's"></i>'; }).join("");
      const p = scene.querySelector(".wx-plants"); p.classList.add("grow"); window.setTimeout(function () { p.textContent = "🌿🌻🌿"; }, 1200);
      if (F2.sfx) { F2.sfx.sparkle(); F2.sfx.note(5, .6); }
    } else if (kind === "blanket") {
      // A soft moss blanket tucks the cold eggs in and the whole scene warms up.
      scene.classList.add("wx-warm");
      fx.innerHTML = '<span class="wx-eggs">🥚🥚🥚</span><span class="wx-blanket">☘️</span>' + Array.from({ length: 6 }, function (_, i) { return '<i class="wx-warmth" style="left:' + (26 + i * 9) + '%;animation-delay:' + (i * 0.25) + 's"></i>'; }).join("");
      if (F2.sfx) { F2.sfx.pop(); F2.sfx.note(2, .7); }
    } else if (kind === "breeze") {
      // A feather fan spins up a cool breeze so the panting friend can catch its breath.
      fx.innerHTML = '<span class="wx-fan">🪶</span>' + Array.from({ length: 7 }, function (_, i) { return '<i class="wx-gust wx-cool" style="top:' + (18 + i * 9) + '%;animation-delay:' + (-i * 0.22) + 's"></i>'; }).join("");
      if (F2.sfx) F2.sfx.whoosh();
    } else if (kind === "lantern") {
      // A glow torch lights the starless night so the friend can see its way home.
      scene.classList.add("wx-lit");
      fx.innerHTML = '<span class="wx-halo"></span><span class="wx-lantern">🪔</span>' + Array.from({ length: 8 }, function () { return '<i class="wx-firefly" style="left:' + (Math.random() * 90).toFixed(0) + '%;top:' + (30 + Math.random() * 50).toFixed(0) + '%;animation-delay:' + (-Math.random() * 2).toFixed(1) + 's"></i>'; }).join("");
      if (F2.sfx) { F2.sfx.sparkle(); F2.sfx.note(3, .7); }
    } else if (kind === "cave") {
      // A cosy cave arches over the friend and shuts the loud storm out.
      scene.classList.add("wx-sheltered");
      fx.innerHTML = '<span class="wx-caveglow"></span><span class="wx-cave">⛰️</span>' + Array.from({ length: 10 }, function (_, i) { return '<i class="wx-drop wx-far" style="left:' + (4 + i * 10) + '%;animation-delay:' + (-(i % 5) * 0.2) + 's"></i>'; }).join("");
      if (F2.sfx) { F2.sfx.pop(); F2.sfx.note(1, .8); }
    } else if (kind === "grass") {
      // A wall of sprouts rises and holds the swirling sand down so the air clears.
      fx.innerHTML = '<span class="wx-grasswall">🌱🌱🌱🌱🌱</span>' + Array.from({ length: 12 }, function (_, i) { return '<i class="wx-sand" style="left:' + (6 + i * 8) + '%;animation-delay:' + (i * 0.1) + 's"></i>'; }).join("");
      if (F2.sfx) { F2.sfx.whoosh(); F2.sfx.pop(); }
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
