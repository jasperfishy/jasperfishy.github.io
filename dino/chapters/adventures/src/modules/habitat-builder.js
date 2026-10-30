const HABITATS = [
  { dino: "Brachiosaurus", icon: "🦕", place: "Fern Forest", base: ["water", "ferns", "tallTrees"], extras: ["sunnyRocks", "flowers"] },
  { dino: "Spinosaurus", icon: "🦖", place: "River Lagoon", base: ["water", "reeds", "shade"], extras: ["shells", "sunnyRocks"] },
  { dino: "Triceratops", icon: "🦏", place: "Open Meadow", base: ["ferns", "flowers", "sunnyRocks"], extras: ["water", "shade"] },
  { dino: "Stegosaurus", icon: "🦕", place: "Warm Valley", base: ["water", "ferns", "sunnyRocks"], extras: ["flowers", "shade"] },
  { dino: "Pteranodon", icon: "🪽", place: "Cliffside Coast", base: ["water", "sunnyRocks", "tallTrees"], extras: ["shells", "shade"] }
];

const FEATURES = [
  { id: "water", icon: "💧", name: "Fresh water" },
  { id: "ferns", icon: "🌿", name: "Soft ferns" },
  { id: "tallTrees", icon: "🌳", name: "Tall trees" },
  { id: "sunnyRocks", icon: "☀️", name: "Sunny rocks" },
  { id: "flowers", icon: "🌼", name: "Wild flowers" },
  { id: "reeds", icon: "🪷", name: "River reeds" },
  { id: "shade", icon: "🌴", name: "Cool shade" },
  { id: "shells", icon: "🐚", name: "Seashells" }
];

export function mountHabitatBuilder(context) {
  const habitat = HABITATS[(context.level - 1) % HABITATS.length];
  const extraCount = Math.min(habitat.extras.length, Math.max(0, Math.floor((context.level - 1) / 2)));
  const needed = habitat.base.concat(habitat.extras.slice(0, extraCount));
  const chosen = new Set();
  const distractors = FEATURES.filter(function (feature) { return !needed.includes(feature.id); }).slice(0, 3);
  const choices = shuffle(needed.map(featureById).concat(distractors));
  let message = context.message("Choose the things that will make a lovely home for our dinosaur.");

  function draw() {
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🌱</span>' +
      '<h2>Dino habitat builder</h2><p>' + escapeText(message) + '</p></div>' +
      '<div class="habitat-scene"><span class="habitat-sun">☀️</span><div class="habitat-home"><span class="habitat-dino" aria-hidden="true">' + habitat.icon + '</span>' +
      '<strong>' + escapeText(habitat.place) + '</strong><small>' + escapeText(habitat.dino) + ' is looking for a home</small></div>' +
      '<div class="habitat-slots" aria-label="Habitat items">' + needed.map(function (id) {
        const feature = featureById(id);
        return '<span class="habitat-slot' + (chosen.has(id) ? ' habitat-filled' : '') + '" aria-label="' + escapeText(feature.name) + '">' +
          (chosen.has(id) ? feature.icon : '·') + '</span>';
      }).join("") + '</div></div>' +
      '<p class="habitat-count">' + chosen.size + ' of ' + needed.length + ' habitat treasures found</p>' +
      '<div class="habitat-choices">' + choices.map(function (feature) {
        const done = chosen.has(feature.id);
        return '<button class="habitat-choice' + (done ? ' habitat-picked' : '') + '" data-feature="' + feature.id + '"' + (done ? ' disabled' : '') + '>' +
          '<span>' + feature.icon + '</span><small>' + escapeText(feature.name) + '</small></button>';
      }).join("") + '</div><p class="gentle-hint" id="habitatHint">' + escapeText(context.message("There is no rush. Explore the choices together.")) + '</p>';
    context.stage.querySelectorAll("[data-feature]").forEach(function (button) {
      button.addEventListener("click", function () { choose(button.dataset.feature); });
    });
  }

  function choose(id) {
    if (!needed.includes(id) || chosen.has(id)) {
      context.sound("tap");
      context.stage.querySelector("#habitatHint").textContent = context.message("That could be useful somewhere else. Let's look for another habitat treasure.");
      return;
    }
    chosen.add(id);
    context.sound("good");
    if (chosen.size === needed.length) {
      message = context.message("A beautiful home is ready! Our dinosaur can settle in.");
      draw();
      context.speak(message);
      window.setTimeout(function () { context.advance("A new prehistoric home is ready for " + habitat.dino + "!"); }, 500);
      return;
    }
    message = context.message("Lovely choice! What else might this place need?");
    draw();
  }

  draw();
}

function featureById(id) { return FEATURES.find(function (feature) { return feature.id === id; }); }
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
