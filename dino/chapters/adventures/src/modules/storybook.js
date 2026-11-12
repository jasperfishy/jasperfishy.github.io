import { PREHISTORIC_CREATURES } from "./dino-discoveries.js?v=du-8607dafbfd11334e";
import { createPlay, collect, collection, getExtras } from "../adv-kit.js?v=du-8607dafbfd11334e";

const STORY_HEROES = PREHISTORIC_CREATURES.map(function (creature) {
  return { name: creature.name, short: creature.short, icon: creature.icon, kind: creature.kind, fact: creature.fact };
});

const STORY_PLACES = [
  { name: "Fern Forest", icon: "🌿", phrase: "the ferny forest" },
  { name: "Moonlit Lagoon", icon: "🌙", phrase: "the moonlit lagoon" },
  { name: "Sunbeam Valley", icon: "🌼", phrase: "the sunny flower valley" },
  { name: "Cloud Castle", icon: "☁️", phrase: "the cloud castle above the sea" },
  { name: "Dinosaur Beach", icon: "🐚", phrase: "the warm dinosaur beach" },
  { name: "Crystal Caves", icon: "💎", phrase: "the quiet crystal caves" },
  { name: "Rainbow Marsh", icon: "🌈", phrase: "the rainbow-coloured marsh" },
  { name: "Firefly Meadow", icon: "✨", phrase: "the firefly meadow" }
];

const STORY_SURPRISES = [
  { name: "a tiny dragonfly orchestra", icon: "🎶" },
  { name: "a rainbow hidden inside a shell", icon: "🌈" },
  { name: "a shy baby dinosaur", icon: "🥚" },
  { name: "a fallen star that still glowed", icon: "⭐" },
  { name: "a map drawn in sparkling sand", icon: "🗺️" },
  { name: "a family of lost fireflies", icon: "🏮" },
  { name: "a little boat made from a leaf", icon: "🍃" },
  { name: "a giggling puddle that made bubbles", icon: "🫧" }
];

const OPENINGS = [
  "{child} was exploring {place} when {hero} waved from beside a little path.",
  "One gentle morning, {hero} invited {child} to visit {place}.",
  "With a tiny backpack and a big smile, {child} met {hero} in {place}.",
  "A soft breeze carried a friendly hello to {child} from {hero} in {place}.",
  "{child} and {hero} set off together to see what was waiting in {place}.",
  "The first star appeared just as {child} found {hero} in {place}.",
  "{hero} had a kind idea: take {child} on a little adventure through {place}.",
  "A trail of tiny footprints led {child} to {hero} in {place}.",
  "{child} heard a curious sound in {place}, and {hero} came to investigate too.",
  "Today felt like a perfect day for an adventure, so {child} and {hero} explored {place}.",
  "{hero} was looking for a friend to share a lovely surprise with. Then {child} arrived in {place}.",
  "Together, {child} and {hero} followed a trail of petals through {place}."
];

const DISCOVERIES = [
  "Near a quiet pool, they discovered {surprise}.",
  "Under a soft fern, they found {surprise} waiting for them.",
  "A friendly sparkle guided them to {surprise}.",
  "Behind a smooth, warm rock, they spotted {surprise}.",
  "Just then, a little rustle revealed {surprise}.",
  "At the end of the path, there was {surprise}.",
  "A gentle chime rang out, and there was {surprise}.",
  "The softest glow came from {surprise}.",
  "A tiny clue helped them find {surprise}.",
  "They stopped to listen and soon noticed {surprise}.",
  "A friendly butterfly showed them where to look: beside it was {surprise}.",
  "They took turns guessing what was behind the flowers. It was {surprise}!"
];

const KIND_ACTIONS = [
  "They listened carefully and found just the right way to help.",
  "They made a little song together, and soon everyone was smiling.",
  "They shared their snacks and made room for one more friend.",
  "They took turns, helped each other and made the discovery feel special.",
  "They followed the clues together, because teamwork made the path easier.",
  "They gave their new friend a quiet moment and a cosy place to rest.",
  "They made a tiny celebration with dancing feet and happy roars.",
  "They carried the surprise gently and showed it to all their friends."
];

const ENDINGS = {
  happy: [
    "When the stars came out, everyone went home smiling and already dreaming of tomorrow.",
    "The whole meadow joined their cheerful dance, and the friends promised to meet again soon.",
    "They watched the sunset together, feeling warm, safe and very glad to be friends.",
    "A soft rainbow appeared overhead, and the friends waved all the way home.",
    "Soon everyone was laughing together beneath the twinkling evening sky.",
    "They tucked the lovely memory away and skipped home beneath a sky full of stars."
  ],
  hopeful: [
    "The adventure was not quite finished, so they marked the path and planned to return together.",
    "They did not solve every little mystery that day, but they knew they could try again as a team.",
    "A new clue appeared in the distance. They smiled, rested, and saved it for their next adventure."
  ],
  tender: [
    "When the little song ended, everyone felt a bit sad. They sat close together and remembered the happy tune.",
    "The rainbow faded as evening came. They felt a little sad to see it go, but kept its lovely colours in their memories.",
    "It was time for friends to say goodbye. There were a few quiet tears, then a kind hug and a promise to meet again.",
    "The tiny visitor had to go home. They missed their new friend, but felt glad they had shared such a lovely day."
  ]
};

/* The middle of the story is a real branch: this choice writes the next page, sets the art
 * on it, and decides which kinds of ending the story can finish with. */
const TWISTS = [
  { name: "A new friend needs help", icon: "🤝", opens: "happy", art: "🐣",
    line: "Just then a small voice called out. {hero} found a brand new friend who needed a little help, and nobody else was near." },
  { name: "A wobbly bridge, a big idea", icon: "🌉", opens: "hopeful", art: "🪵",
    line: "The little bridge wobbled! {hero} counted to three, invented a clever way across, and it worked." },
  { name: "The lights go dim, and a song begins", icon: "🎵", opens: "tender", art: "🌙",
    line: "The sky hushed and every light went soft, so {hero} sang the quietest song ever sung." },
  { name: "A door in the hillside", icon: "🚪", opens: "happy", art: "✨",
    line: "Behind the waterfall they found a tiny round door. {child} knocked once — and something knocked back!" },
  { name: "The map blows away", icon: "🗺️", opens: "hopeful", art: "⭐",
    line: "Whoosh! The map flew off in a breeze. Instead of worrying, {child} and {hero} read the stars instead." }
];
const ENDING_ICONS = { happy: ["🎈", "🌈", "💛", "🎉", "⭐", "🌇"], hopeful: ["🔎", "🧭", "🗝️"], tender: ["🤗", "🕯️", "🌙", "💌"] };
const ENDING_LABELS = {
  happy: ["A joyful celebration", "A rainbow surprise", "Friends together", "A party under the stars", "A happy walk home", "Skipping home"],
  hopeful: ["A mystery for next time", "An adventure to continue", "One more clue"],
  tender: ["A little sad, then comforted", "Colours kept in memory", "A hug and a promise", "A friend goes home"]
};
/* Each place drifts its own little weather, so a story at the beach looks different to one in the caves. */
const PLACE_EXTRA = {
  "Fern Forest": ["🍃", "🦋"], "Moonlit Lagoon": ["🌙", "✨"], "Sunbeam Valley": ["🌼", "☀️"], "Cloud Castle": ["☁️", "🕊️"],
  "Dinosaur Beach": ["🌊", "🐚"], "Crystal Caves": ["💎", "✨"], "Rainbow Marsh": ["🌈", "💧"], "Firefly Meadow": ["✨", "🌟"]
};

const STEPS = ["hero", "place", "surprise", "twist", "ending"];
const COLLECTIONS = { hero: STORY_HEROES, place: STORY_PLACES, surprise: STORY_SURPRISES, twist: TWISTS };
const STEP_LABELS = {
  hero: "Who is in your story?",
  place: "Where does it happen?",
  surprise: "What do they discover?",
  twist: "But then — what happens next?",
  ending: "How does your story end?"
};
const STEP_SFX = { hero: "chirp", place: "whoosh", surprise: "sparkle", twist: "drum", ending: "star" };
const PLACE_THEME = { "Fern Forest": "meadow", "Moonlit Lagoon": "night", "Sunbeam Valley": "meadow", "Cloud Castle": "sky", "Dinosaur Beach": "water", "Crystal Caves": "cave", "Rainbow Marsh": "rain", "Firefly Meadow": "night" };
const COLORS = ["green", "teal", "purple", "orange", "pink", "blue", "yellow", "red"];

function speciesFor(creature) {
  const n = creature.name;
  if (creature.kind !== "Dinosaur" && creature.kind !== "Flying reptile") return null;
  if (creature.kind === "Flying reptile" || n === "Archaeopteryx") return "ptero";
  if (/Tyrannosaurus/.test(n)) return "trex";
  if (/Triceratops|Styracosaurus|Carnotaurus/.test(n)) return "tricera";
  if (/Stegosaurus|Ankylosaurus|Amargasaurus|Pachycephalosaurus/.test(n)) return "stego";
  if (/Velociraptor|Deinonychus|Coelophysis|Oviraptor|Allosaurus|Spinosaurus|Baryonyx/.test(n)) return "raptor";
  return "bronto";
}
function colorFor(name) { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997; return COLORS[h % COLORS.length]; }

export function mountStorybook(context) {
  const F = window.DUFX;
  const actId = (context.activity && context.activity.id) || "storybook";
  const bestStars = getExtras().best[actId] || 0;
  const play = createPlay(context, {
    emoji: "📖", title: "Dino Storybook", theme: "night", buddy: false, wander: false,
    instruction: "Choose a friend, a place, a surprise and what happens next. Then read your very own story!", hint: "There are no wrong choices in a story.", allowed: 99
  });
  const board = play.board;
  const picks = { hero: null, place: null, surprise: null, twist: null, ending: null };
  let stepIndex = 0, chapter = 1, weatherOff = null;
  const savedStories = collection("stories");

  function cast() {
    return '<div class="sb-cast" aria-label="Your story so far">' + STEPS.map(function (s) {
      const p = picks[s];
      return '<span class="sb-slot' + (p ? " on" : "") + '">' + (p ? p.icon : "?") + "</span>";
    }).join("") + "</div>";
  }
  function setThemeFor(placeName) {
    const t = PLACE_THEME[placeName];
    if (t) play.scene.className = "pk-scene pk-" + t;
    drift(placeName);
  }
  function resetPicks() { picks.hero = picks.place = picks.surprise = picks.twist = picks.ending = null; stepIndex = 0; }

  function banner(strong, small, ms) {
    const b = document.createElement("div");
    b.className = "pk-banner sb-part";
    b.innerHTML = "<strong>" + escapeText(strong) + "</strong><small>" + escapeText(small) + "</small>";
    play.scene.appendChild(b);
    if (F.sfx) F.sfx.drum(4);
    window.setTimeout(function () { b.remove(); }, ms || 2100);
  }

  /* drifting scenery for the place the child chose — inline spans, so no shared stylesheet is touched */
  function drift(placeName) {
    const glyphs = PLACE_EXTRA[placeName] || [];
    if (weatherOff) { weatherOff(); weatherOff = null; }
    if (!glyphs.length || (F.motionOK && !F.motionOK())) return;
    const box = document.createElement("div");
    box.setAttribute("aria-hidden", "true");
    box.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2";
    play.scene.appendChild(box);
    const anims = [];
    const h = play.scene.clientHeight || 320;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.textContent = glyphs[i % glyphs.length];
      s.style.cssText = "position:absolute;left:" + (Math.random() * 100).toFixed(1) + "%;top:-8%;font-size:" + (12 + Math.random() * 14).toFixed(0) + "px;opacity:" + (0.4 + Math.random() * 0.4).toFixed(2);
      box.appendChild(s);
      anims.push(s.animate([{ transform: "translateY(0) rotate(0deg)" }, { transform: "translateY(" + (h + 50).toFixed(0) + "px) translateX(" + (Math.random() * 90 - 45).toFixed(0) + "px) rotate(300deg)" }],
        { duration: 6000 + Math.random() * 7000, delay: Math.random() * 5000, iterations: Infinity, easing: "linear" }));
    }
    weatherOff = function () { anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* already gone */ } }); box.remove(); };
  }

  function drawChoices() {
    if (stepIndex >= STEPS.length) { revealStory(); return; }
    const step = STEPS[stepIndex];
    const options = step === "ending" ? endingChoices() : levelChoices(COLLECTIONS[step]);
    play.hint(step === "ending" ? "Happy endings are plentiful. Gentle endings always end with care." : "There are no wrong choices in a story.", true);
    board.innerHTML = cast() + '<h3 class="sb-q">' + escapeText(STEP_LABELS[step]) + '</h3>' +
      '<div class="sb-options' + (step === "ending" ? ' sb-endings' : '') + '">' + options.map(function (choice, index) {
        const label = choice.name || choice.label;
        return '<button type="button" class="sb-option' + (step === "ending" ? ' ' + choice.mood : "") + '" data-choice="' + index + '"><span>' + choice.icon + '</span><small>' + escapeText(label) + '</small></button>';
      }).join("") + '</div>' +
      '<div class="sb-ideas"><button type="button" class="pk-btn sb-idea">💡 An idea</button>' +
      '<span class="sb-shelf-note" style="font-weight:800;font-size:12px">' + savedStories.length + " book" + (savedStories.length === 1 ? "" : "s") + " on your shelf" +
      (bestStars ? " · best " + "⭐".repeat(bestStars) : "") + (chapter > 1 ? " · Part " + chapter : "") + "</span></div>" +
      (stepIndex === 0 && savedStories.length ? '<div class="sb-shelf"><b>Your bookshelf</b>' + savedStories.slice(-6).map(function (st, i, arr) { return '<button type="button" class="sb-spine" data-story="' + (savedStories.length - arr.length + i) + '" title="' + escapeText(st.title) + '">' + st.icons + '</button>'; }).join("") + '</div>' : "");
    board.querySelectorAll(".sb-option").forEach(function (b, i) {
      if (F.anim) F.anim(b, [{ opacity: 0, transform: "translateY(26px) scale(.7) rotate(-4deg)" }, { opacity: 1, transform: "none" }], { duration: 460, delay: i * 70, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "backwards" });
      b.addEventListener("click", function () {
        picks[step] = options[Number(b.dataset.choice)];
        if (F.sfx) { const sfxKind = STEP_SFX[step]; if (sfxKind === "drum") F.sfx.drum(3); else (F.sfx[sfxKind] || F.sfx.good)(); }
        const r = b.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: step === "twist" ? "confetti" : "sparkle", n: 12 });
        if (step === "place") setThemeFor(picks.place.name);
        play.say(step === "hero" ? "Great friend! 💚" : step === "place" ? "What a lovely place!" : step === "surprise" ? "Ooh, how exciting!" : step === "twist" ? "Ooh — and THEN it happens!" : "A perfect ending.", 1800);
        stepIndex += 1;
        window.setTimeout(drawChoices, 250);
      });
    });
    // a free idea, never a mark against you
    board.querySelector(".sb-idea").addEventListener("click", function () {
      const i = Math.floor(Math.random() * options.length);
      const target = board.querySelectorAll(".sb-option")[i];
      if (target && target.animate && F.motionOK && F.motionOK()) target.animate([{ transform: "scale(1)" }, { transform: "scale(1.14) rotate(-2deg)", offset: .5 }, { transform: "scale(1)" }], { duration: 900, iterations: 2 });
      if (F.sfx) F.sfx.chirp();
      play.say("An idea: what about " + (options[i].name || options[i].label).toLowerCase() + "? Only if you like it!", 3400);
    });
    board.querySelectorAll("[data-story]").forEach(function (b) { b.addEventListener("click", function () { readPages(savedStories[Number(b.dataset.story)], true); }); });
  }

  function endingChoices() {
    // the middle of the story decides which endings feel right now
    const prefer = picks.twist ? picks.twist.opens : "happy";
    const moods = ["happy", "hopeful", "tender"];
    const mk = function (mood) {
      return ENDINGS[mood].map(function (text, i) {
        return { mood: mood, icon: ENDING_ICONS[mood][i % ENDING_ICONS[mood].length], label: ENDING_LABELS[mood][i % ENDING_LABELS[mood].length], text: text };
      });
    };
    const first = mk(prefer).slice(0, 4);
    const rest = moods.filter(function (m) { return m !== prefer; }).reduce(function (a, m) { return a.concat(mk(m).slice(0, 2)); }, []);
    return first.concat(rest);
  }
  function levelChoices(collectionList) {
    const count = Math.min(collectionList.length, 4 + Math.floor(Math.max(0, context.challenge) / 2));
    const start = (Math.floor(Math.max(0, context.level - 1) / 2) * 4) % collectionList.length;
    return Array.from({ length: count }, function (_, index) { return collectionList[(start + index) % collectionList.length]; });
  }

  function revealStory() {
    const hero = picks.hero, place = picks.place, surprise = picks.surprise, twist = picks.twist;
    const child = context.playerName || "our little explorer";
    const fill = { child: child, hero: hero.name, place: place.phrase, surprise: surprise.name };
    const paragraphs = [
      interpolate(choose(OPENINGS), fill),
      interpolate(choose(DISCOVERIES), fill) + " " + choose(KIND_ACTIONS),
      interpolate(twist.line, fill),
      picks.ending.text
    ];
    readPages({
      title: titleFor(hero, place, picks.ending.mood) + (chapter > 1 ? " (Part " + chapter + ")" : ""),
      paragraphs: paragraphs, mood: picks.ending.mood, hero: hero.icon, heroName: hero.short, sp: speciesFor(hero), color: colorFor(hero.name),
      place: place.icon, placeName: place.name, surprise: surprise.icon, twist: twist.icon, twistArt: twist.art, twistName: twist.name,
      chapter: chapter, fact: hero.kind + ": " + hero.fact, icons: hero.icon + place.icon + surprise.icon + twist.icon
    }, false);
  }

  /* ---- a real picture book: four illustrated pages, word-by-word reading, hidden stars ---- */
  function readPages(story, replay) {
    let page = 0, stars = 0, readTimer = 0;
    setThemeFor(story.placeName);
    const kinds = story.paragraphs.length >= 4 ? ["hero", "surprise", "twist", "end"] : ["hero", "surprise", "end"];
    const last = story.paragraphs.length - 1;
    const pages = story.paragraphs.map(function (text, i) {
      return { text: text + (i === last ? " The End." : ""), art: kinds[Math.min(i, kinds.length - 1)] };
    });
    function art(kind) {
      const hero = story.sp && F.dinoHTML ? '<span class="sb-hero">' + F.dinoHTML(story.sp, { color: story.color, state: kind === "end" ? "happy" : "idle", size: "100%" }) + "</span>" : '<span class="sb-hero emoji">' + story.hero + "</span>";
      const star = replay ? "" : '<button type="button" class="sb-star" style="left:' + (8 + Math.random() * 78).toFixed(0) + '%;top:' + (8 + Math.random() * 40).toFixed(0) + '%" aria-label="A hidden star">⭐</button>';
      return '<div class="sb-art ' + story.mood + ' k-' + kind + '"><span class="sb-place">' + story.place + '</span><span class="sb-place p2">' + story.place + "</span>" + hero +
        (kind === "surprise" || kind === "end" ? '<span class="sb-surprise">' + story.surprise + "</span>" : "") +
        (kind === "twist" ? '<span class="sb-twist" style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-size:56px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.25))">' + (story.twistArt || story.twist || "❗") + "</span>" : "") +
        (kind === "end" ? '<span class="sb-end">' + (story.mood === "tender" ? "🤗" : story.mood === "hopeful" ? "🧭" : "🌈") + "</span>" : "") + star + "</div>";
    }
    function draw(dir) {
      window.clearInterval(readTimer);
      const pg = pages[page];
      board.innerHTML = '<article class="sb-book ' + story.mood + '"><h3 class="sb-title">' + escapeText(story.title) + '</h3><div class="sb-spread' + (dir ? " flip-" + dir : "") + '">' + art(pg.art) +
        '<div class="sb-text"><p>' + pg.text.split(" ").map(function (w) { return '<span class="sb-w">' + escapeText(w) + "</span>"; }).join(" ") + "</p>" +
        (page === 1 && story.twistName ? '<p class="sb-nextline" style="font-weight:800;opacity:.75">Then — ' + escapeText(story.twistName.toLowerCase()) + "…</p>" : "") +
        (page === last ? '<aside class="sb-note"><strong>Meet ' + escapeText(story.heroName) + "</strong><br>" + escapeText(story.fact) + "</aside>" : "") + "</div></div>" +
        '<div class="sb-nav"><button type="button" class="pk-btn" id="sbPrev"' + (page === 0 ? " disabled" : "") + '>◀ Back</button><span class="sb-dots">' + pages.map(function (_, i) { return '<i class="' + (i === page ? "on" : "") + '"></i>'; }).join("") + '</span>' +
        '<button type="button" class="pk-btn" id="sbRead">🔊 Read to me</button>' +
        (page < last ? '<button type="button" class="pk-btn sb-next" id="sbNext">Next ▶</button>' : '<button type="button" class="pk-btn sb-next" id="sbEnd">The End ✨</button>') + "</div></article>";
      // words light up one by one, like a reading finger
      const words = board.querySelectorAll(".sb-w");
      let wi = 0;
      readTimer = window.setInterval(function () {
        if (!board.isConnected) { window.clearInterval(readTimer); return; }
        words.forEach(function (w, i) { w.classList.toggle("now", i === wi); w.classList.toggle("done", i < wi); });
        wi += 1; if (wi > words.length + 1) window.clearInterval(readTimer);
      }, 420);
      words.forEach(function (w) { w.addEventListener("click", function () { context.speak(w.textContent); if (F.sfx) F.sfx.pop(); }); });
      const starEl = board.querySelector(".sb-star");
      if (starEl) starEl.addEventListener("click", function () {
        stars += 1;
        const r = starEl.getBoundingClientRect(); starEl.remove();
        if (F.burst) F.burst(r.left, r.top, { kind: "stars", n: 12 });
        if (F.sfx) F.sfx.star(); play.say("Found a hidden star! ⭐ " + stars, 1800);
      });
      board.querySelector("#sbRead").addEventListener("click", function () { context.speak(pg.text); if (!context.speechEnabled) play.say("Ask a grown-up to switch on spoken stories in settings.", 2600); });
      board.querySelector("#sbPrev").addEventListener("click", function () { if (page > 0) { page -= 1; if (F.sfx) F.sfx.whoosh(); draw("back"); } });
      const nxt = board.querySelector("#sbNext");
      if (nxt) nxt.addEventListener("click", function () { page += 1; if (F.sfx) F.sfx.whoosh(); draw("next"); });
      const end = board.querySelector("#sbEnd");
      if (end) end.addEventListener("click", theEnd);
      if (page === 0 && dir === undefined) context.speak(story.title + ". " + pg.text);
      if (page === last) { if (F.sfx) F.sfx.sparkle(); const r = board.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + 80, { kind: story.mood === "tender" ? "hearts" : "stars", n: 18 }); }
    }
    function theEnd() {
      window.clearInterval(readTimer);
      if (replay) { resetPicks(); setThemeFor("Moonlit Lagoon"); drawChoices(); return; }
      collect("stories", { title: story.title, icons: story.icons, paragraphs: story.paragraphs, mood: story.mood, hero: story.hero, heroName: story.heroName, sp: story.sp, color: story.color, place: story.place, placeName: story.placeName, surprise: story.surprise, twist: story.twist, twistName: story.twistName, chapter: story.chapter || 1, fact: story.fact });
      const hasNext = (context.challenge || 1) >= 2 || (story.chapter || 1) < 3;
      board.innerHTML = '<div class="sb-fin"><div class="sb-fin-book">📖</div><h3>The End</h3><p>Your story is on the bookshelf. You found <b>' + stars + '</b> hidden star' + (stars === 1 ? "" : "s") + "!</p>" +
        '<div class="bd-row">' + (hasNext ? '<button type="button" class="pk-btn" id="sbSequel">📚 Part 2 — the next chapter</button>' : "") +
        '<button type="button" class="pk-btn" id="sbAgain">✏️ Make another story</button><button type="button" class="pk-btn sb-next" id="sbDone">Finish ✨</button></div></div>';
      if (F.sfx) F.sfx.win();
      const r = board.getBoundingClientRect(); if (F.burst) F.burst(r.left + r.width / 2, r.top + 60, { kind: "confetti", n: 40 });
      const seq = board.querySelector("#sbSequel");
      if (seq) seq.addEventListener("click", function () {
        // the same friends, the same place — a new surprise, a new middle, a new ending
        chapter = (story.chapter || 1) + 1;
        picks.hero = { name: story.heroName, short: story.heroName, icon: story.hero, kind: "", fact: story.fact };
        picks.place = { name: story.placeName, icon: story.place, phrase: story.placeName };
        picks.surprise = picks.twist = picks.ending = null;
        stepIndex = 2;
        banner("Part 2 — the next chapter!", "Same friends, same place, brand new surprises 📚", 2400);
        drawChoices();
      });
      board.querySelector("#sbAgain").addEventListener("click", function () { chapter = 1; resetPicks(); drawChoices(); });
      board.querySelector("#sbDone").addEventListener("click", function () {
        play.finish("You made a " + story.mood + " story about " + story.heroName + " in " + story.placeName + ", with " + (story.twistName || "a lovely surprise") +
          ", and found " + stars + " hidden star" + (stars === 1 ? "" : "s") + "!", { stars: stars >= 2 ? 3 : 2 });
      });
    }
    draw();
  }

  drawChoices();
}

function titleFor(hero, place, mood) {
  const starts = mood === "tender" ? ["A Goodbye to Remember", "The Little Rainbow", "Friends for a Day"] :
    mood === "hopeful" ? ["The Next Great Mystery", "A Path for Tomorrow", "The Adventure Continues"] :
      ["A Wonderful Day Together", "The Brightest Surprise", "A Magical Meadow Day"];
  return choose(starts) + " with " + hero.short + " in " + place.name;
}
function choose(items) { return items[Math.floor(Math.random() * items.length)]; }
function interpolate(template, values) {
  return template.replace(/\{(child|hero|place|surprise)\}/g, function (_, key) { return values[key]; });
}
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
