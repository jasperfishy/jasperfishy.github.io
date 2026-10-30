import { PREHISTORIC_CREATURES } from "./dino-discoveries.js";

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

const STEPS = ["hero", "place", "surprise", "ending"];
const COLLECTIONS = { hero: STORY_HEROES, place: STORY_PLACES, surprise: STORY_SURPRISES };
const STEP_LABELS = {
  hero: "Choose a dinosaur friend",
  place: "Choose a magical place",
  surprise: "Choose a lovely surprise",
  ending: "Choose how your story feels"
};

export function mountStorybook(context) {
  const picks = { hero: null, place: null, surprise: null, ending: null };
  let stepIndex = 0;

  function drawChoices() {
    if (stepIndex >= STEPS.length) { revealStory(); return; }
    const step = STEPS[stepIndex];
    const options = step === "ending" ? endingChoices() : levelChoices(COLLECTIONS[step]);
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">📖</span>' +
      '<h2>Dino Storybook</h2><p>' + escapeText(context.message(STEP_LABELS[step])) + '</p></div>' +
      '<div class="story-progress" aria-label="Story choices">' + STEPS.map(function (name, index) {
        return (index ? '<i></i>' : '') + '<span class="story-step' + (index <= stepIndex ? ' active' : '') + '">' + (index + 1) + '</span>';
      }).join("") + '</div>' +
      '<div class="story-options' + (step === "ending" ? ' ending-options' : '') + '">' + options.map(function (choice, index) {
        const label = choice.name || choice.label;
        return '<button class="story-option' + (step === "ending" ? ' ending-' + choice.mood : '') + '" data-choice="' + index + '"><span>' + choice.icon + '</span><small>' + escapeText(label) + '</small></button>';
      }).join("") + '</div><p class="gentle-hint">' + escapeText(context.message(step === "ending" ? "Happy endings are plentiful. Gentle endings always end with care." : "There are no wrong choices in a story.")) + '</p>';
    context.stage.querySelectorAll("[data-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        picks[step] = options[Number(button.dataset.choice)];
        context.sound("tap");
        stepIndex += 1;
        drawChoices();
      });
    });
  }

  function endingChoices() {
    return [
      { mood: "happy", icon: "🎈", label: "A joyful celebration", text: ENDINGS.happy[0] },
      { mood: "happy", icon: "🌈", label: "A rainbow surprise", text: ENDINGS.happy[1] },
      { mood: "happy", icon: "💛", label: "Friends together", text: ENDINGS.happy[2] },
      { mood: "happy", icon: "🎉", label: "A party under the stars", text: ENDINGS.happy[3] },
      { mood: "happy", icon: "⭐", label: "A happy walk home", text: ENDINGS.happy[4] },
      { mood: "hopeful", icon: "🔎", label: "A mystery for next time", text: ENDINGS.hopeful[0] },
      { mood: "hopeful", icon: "🧭", label: "An adventure to continue", text: ENDINGS.hopeful[1] },
      { mood: "tender", icon: "🤗", label: "A little sad, then comforted", text: ENDINGS.tender[0] }
    ];
  }

  function levelChoices(collection) {
    const count = Math.min(collection.length, 4 + Math.floor(Math.max(0, context.challenge) / 2));
    const start = (Math.floor(Math.max(0, context.level - 1) / 2) * 4) % collection.length;
    return Array.from({ length: count }, function (_, index) { return collection[(start + index) % collection.length]; });
  }

  function revealStory() {
    const hero = picks.hero;
    const place = picks.place;
    const surprise = picks.surprise;
    const child = context.playerName || "our little explorer";
    const fill = { child: child, hero: hero.name, place: place.phrase, surprise: surprise.name };
    const opening = choose(OPENINGS);
    const discovery = choose(DISCOVERIES);
    const action = choose(KIND_ACTIONS);
    const ending = picks.ending.text;
    const paragraphs = [interpolate(opening, fill), interpolate(discovery, fill) + " " + action, ending];
    const story = paragraphs.join(" ");
    const narratedStory = story + " Here is a fun fact about " + hero.name + ". " + hero.fact;
    const title = titleFor(hero, place, picks.ending.mood);
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">✨</span><h2>Your Dino Story</h2><p>A little tale made just for you.</p></div>' +
      '<article class="storybook-page storybook-reveal ' + picks.ending.mood + '"><div class="storybook-cast"><span class="storybook-character">' + hero.icon + '</span><span>' + place.icon + '</span><span>' + surprise.icon + '</span></div>' +
      '<h3>' + escapeText(title) + '</h3><p>' + paragraphs.map(escapeText).join('</p><p>') + '</p><aside class="storybook-note"><strong>Meet ' + escapeText(hero.short) + '</strong><br>' + escapeText(hero.kind + ": " + hero.fact) + '</aside><button class="tiny-button" id="readStory">🔊 Read story and dino fact</button></article>' +
      '<div class="storybook-actions"><button class="tiny-button" id="newStory">Make another story</button><button class="primary-button" id="finishStory">Finish story</button></div>';
    const narrate = function () { context.speak(narratedStory); };
    context.stage.querySelector("#readStory").addEventListener("click", narrate);
    context.stage.querySelector("#newStory").addEventListener("click", function () {
      stepIndex = 0;
      picks.hero = null; picks.place = null; picks.surprise = null; picks.ending = null;
      context.sound("tap");
      drawChoices();
    });
    context.stage.querySelector("#finishStory").addEventListener("click", function () { context.advance("You created a magical new dinosaur story!"); });
    context.sound("good");
    narrate();
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
