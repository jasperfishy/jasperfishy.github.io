import { PREHISTORIC_CREATURES } from "./dino-discoveries.js";

const DINOSAURS = PREHISTORIC_CREATURES.filter(function (creature) { return creature.kind === "Dinosaur"; });
const COSTUMES = ["🌸", "🎩", "🦋", "🎀", "✨", "🌿"];
const WORLDS = [
  { name: "Sunshine Meadow", className: "parade-sunshine", icon: "🌼" },
  { name: "Starry Lagoon", className: "parade-stars", icon: "🌙" },
  { name: "Rainbow Valley", className: "parade-rainbow", icon: "🌈" },
  { name: "Fernwood Forest", className: "parade-fern", icon: "🌿" }
];
const KEY = "dinosaur-universe-parade-v1";

export function mountDinoParade(context) {
  const level = Math.max(1, Number(context.level) || 1);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
  let dinoIndex = Math.min(DINOSAURS.length - 1, Number(saved.dinoIndex) || (level - 1) % 6);
  let costumeIndex = Number(saved.costumeIndex) || 0;
  let worldIndex = Number(saved.worldIndex) || (level - 1) % WORLDS.length;
  let parading = false;

  function draw() {
    const dino = DINOSAURS[dinoIndex];
    const world = WORLDS[worldIndex];
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🎉</span><h2>Dinosaur Dress-up Parade</h2><p>' + esc(context.message("Choose a dinosaur, a parade look and a magical place for your show!")) + '</p></div>' +
      '<section class="parade-scene ' + world.className + (parading ? ' parade-in-motion' : '') + '" aria-label="' + esc(dino.short + " in " + world.name) + '">' +
        '<span class="parade-sun" aria-hidden="true">✦</span><span class="parade-dino" aria-hidden="true">' + dino.icon + '<span class="parade-costume">' + COSTUMES[costumeIndex] + '</span></span>' +
        '<span class="parade-nameplate">' + esc(dino.short) + '’s parade</span><span class="parade-confetti" aria-hidden="true">✦　·　✧　·　✦</span></section>' +
      '<div class="parade-controls"><section class="parade-choice-set"><h3>Choose a dinosaur friend</h3><div class="parade-choice-row">' + DINOSAURS.slice(0, Math.min(8, 4 + level)).map(function (creature, index) {
        return '<button class="parade-choice' + (index === dinoIndex ? ' selected' : '') + '" data-dino="' + index + '" aria-pressed="' + (index === dinoIndex) + '"><span>' + creature.icon + '</span><small>' + esc(creature.short) + '</small></button>';
      }).join("") + '</div></section>' +
      '<section class="parade-choice-set"><h3>Pick a parade sparkle</h3><div class="parade-choice-row costume-row">' + COSTUMES.map(function (costume, index) {
        return '<button class="parade-swatch' + (index === costumeIndex ? ' selected' : '') + '" data-costume="' + index + '" aria-label="Costume sparkle ' + (index + 1) + '" aria-pressed="' + (index === costumeIndex) + '">' + costume + '</button>';
      }).join("") + '</div></section>' +
      '<section class="parade-choice-set"><h3>Choose a parade world</h3><div class="parade-choice-row">' + WORLDS.map(function (place, index) {
        return '<button class="parade-world' + (index === worldIndex ? ' selected' : '') + '" data-world="' + index + '" aria-pressed="' + (index === worldIndex) + '"><span>' + place.icon + '</span><small>' + place.name + '</small></button>';
      }).join("") + '</div></section></div>' +
      '<div class="parade-actions"><button class="primary-button" id="paradeStart">' + (parading ? 'Parade again ✨' : 'Start the parade! 🎺') + '</button><span class="gentle-hint">' + (parading ? 'Lovely choices! The dinosaur friends are waving hello.' : 'Every parade is a happy little celebration.') + '</span></div>';

    context.stage.querySelectorAll("[data-dino]").forEach(function (button) { button.addEventListener("click", function () { dinoIndex = Number(button.dataset.dino); parading = false; save(); draw(); }); });
    context.stage.querySelectorAll("[data-costume]").forEach(function (button) { button.addEventListener("click", function () { costumeIndex = Number(button.dataset.costume); parading = false; save(); draw(); }); });
    context.stage.querySelectorAll("[data-world]").forEach(function (button) { button.addEventListener("click", function () { worldIndex = Number(button.dataset.world); parading = false; save(); draw(); }); });
    context.stage.querySelector("#paradeStart").addEventListener("click", function () {
      if (parading) { context.advance(dino.short + " led a sparkling parade through " + world.name + "!"); return; }
      parading = true; context.sound("good"); context.speak(context.message("Welcome to the " + world.name + " parade! Give a happy wave, " + dino.short + "!")); draw();
    });
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ dinoIndex: dinoIndex, costumeIndex: costumeIndex, worldIndex: worldIndex })); } catch {}
  }
  draw();
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}
