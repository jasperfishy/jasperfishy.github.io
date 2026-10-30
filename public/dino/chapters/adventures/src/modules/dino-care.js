import { PREHISTORIC_CREATURES } from "./dino-discoveries.js";

const DINOSAURS = PREHISTORIC_CREATURES.filter(function (creature) { return creature.kind === "Dinosaur"; });
const CARE_TASKS = [
  { id: "brush", icon: "🪥", name: "Soft brush", line: "Brush away the soft meadow dust." },
  { id: "water", icon: "💧", name: "Fresh water", line: "Offer a cool drink of fresh water." },
  { id: "fern", icon: "🌿", name: "Fern snack", line: "Find a crunchy fern snack." },
  { id: "cloth", icon: "🧺", name: "Cool cloth", line: "Place a cool cloth nearby for a little rest." },
  { id: "flowers", icon: "🌼", name: "Flower garland", line: "Make a flower garland for your new friend." },
  { id: "shade", icon: "🌳", name: "Cosy shade", line: "Find a shady spot to relax together." }
];

export function mountDinoCare(context) {
  const visibleCount = Math.min(DINOSAURS.length, 5 + Math.max(0, context.level - 1) * 2);
  let dinosaur = null;
  let tasks = [];
  let completed = new Set();
  let hint = "Choose a dinosaur friend who would like a little meadow care.";

  function drawChoices() {
    const available = DINOSAURS.slice(0, visibleCount);
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🧺</span><h2>Dino Care Clinic</h2><p>' + escapeText(context.message(hint)) + '</p></div>' +
      '<div class="care-choice-grid">' + available.map(function (creature, index) {
        return '<button class="care-dino-choice" data-dino="' + index + '"><span>' + creature.icon + '</span><strong>' + escapeText(creature.short) + '</strong></button>';
      }).join("") + '</div><p class="gentle-hint">More dinosaur friends join the clinic as levels grow. Everyone gets gentle care.</p>';
    context.stage.querySelectorAll("[data-dino]").forEach(function (button) {
      button.addEventListener("click", function () { beginCare(available[Number(button.dataset.dino)]); });
    });
  }

  function beginCare(creature) {
    dinosaur = creature;
    const count = Math.min(CARE_TASKS.length, 3 + Math.floor(Math.max(0, context.challenge) / 2));
    const offset = (context.level - 1) % CARE_TASKS.length;
    tasks = CARE_TASKS.slice(offset).concat(CARE_TASKS.slice(0, offset)).slice(0, count);
    completed = new Set();
    hint = creature.short + " would love a few gentle comforts.";
    drawCare();
  }

  function drawCare() {
    const finished = completed.size === tasks.length;
    const current = tasks.find(function (task) { return !completed.has(task.id); });
    const creatureFact = dinosaur.fact;
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🧺</span><h2>Dino Care Clinic</h2><p>' + escapeText(context.message(finished ? "Your dinosaur friend feels cosy and cared for!" : current.line)) + '</p></div>' +
      '<div class="care-scene' + (finished ? ' care-happy' : '') + '"><span class="care-spark care-spark-one">✦</span><span class="care-dino">' + dinosaur.icon + '</span><strong>' + escapeText(dinosaur.name) + '</strong>' +
      '<small>' + escapeText(completed.size + " of " + tasks.length + " kind touches") + '</small></div>' +
      '<div class="care-progress"><span style="width:' + (completed.size / tasks.length * 100) + '%"></span></div>' +
      (finished ? '<aside class="care-fact"><strong>A little dinosaur fact</strong><br>' + escapeText(creatureFact) + '</aside><div class="care-actions"><button class="tiny-button" id="careSpeak">🔊 Hear the fact</button><button class="primary-button" id="careFinish">Finish this kind visit</button></div>' :
        '<div class="care-task-grid">' + CARE_TASKS.map(function (task) {
          const done = completed.has(task.id);
          const expected = current && current.id === task.id;
          return '<button class="care-task' + (done ? ' care-task-done' : '') + (expected ? ' care-task-next' : '') + '" data-task="' + task.id + '"' + (done ? ' disabled' : '') + '><span>' + task.icon + '</span><small>' + escapeText(task.name) + '</small></button>';
        }).join("") + '</div><p class="gentle-hint" id="careHint">' + escapeText(context.message(hint)) + '</p>');

    context.stage.querySelectorAll("[data-task]").forEach(function (button) {
      button.addEventListener("click", function () { doCare(button.dataset.task); });
    });
    const finish = context.stage.querySelector("#careFinish");
    if (finish) finish.addEventListener("click", function () { context.advance("You gave " + dinosaur.short + " a lovely caring visit!"); });
    const speak = context.stage.querySelector("#careSpeak");
    if (speak) speak.addEventListener("click", function () { context.speak(dinosaur.name + ". " + creatureFact); });
  }

  function doCare(id) {
    const task = CARE_TASKS.find(function (item) { return item.id === id; });
    const current = tasks.find(function (item) { return !completed.has(item.id); });
    if (!current || id !== current.id) {
      context.sound("tap");
      const message = task.name + " is a lovely idea. First, " + current.name.toLowerCase() + ".";
      context.stage.querySelector("#careHint").textContent = context.message(message);
      return;
    }
    completed.add(id);
    context.sound("good");
    if (completed.size === tasks.length) context.speak(context.message("Your dinosaur friend feels happy and cared for."));
    else hint = task.line + " Lovely! Let's choose the next kind touch.";
    drawCare();
  }

  drawChoices();
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
