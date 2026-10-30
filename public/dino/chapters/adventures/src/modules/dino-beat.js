const DRUMS = [
  { id: "trex", icon: "🦖", name: "T-Rex stomp" },
  { id: "trike", icon: "🦏", name: "Triceratops tap" },
  { id: "longneck", icon: "🦕", name: "Long-neck bop" },
  { id: "wing", icon: "🪽", name: "Pteranodon flap" }
];

export function mountDinoBeat(context) {
  const sequenceLength = Math.min(9, 3 + context.challenge);
  const sequence = Array.from({ length: sequenceLength }, function () { return Math.floor(Math.random() * DRUMS.length); });
  let input = [];
  let playing = false;
  let activeIndex = -1;
  let activeStep = -1;
  context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🥁</span><h2>Dino beat parade</h2>' +
    '<p>' + escapeText(context.message("Watch the dinosaurs tap a rhythm, then play it back.")) + '</p></div>' +
    '<div class="beat-lights" id="beatLights"></div><div class="beat-buttons" id="beatButtons"></div>' +
    '<div class="stage-controls"><button class="tiny-button" id="replayBeat">Play the rhythm again</button></div>' +
    '<p class="gentle-hint" id="beatHint">' + escapeText(context.message("Listen and watch. There is no rush.")) + '</p>' +
    '<div class="progress-track"><span id="beatProgress" style="width:0%"></span></div>';
  const lights = context.stage.querySelector("#beatLights");
  const buttons = context.stage.querySelector("#beatButtons");
  lights.innerHTML = sequence.map(function (_, index) { return '<span class="beat-light" data-light="' + index + '">✦</span>'; }).join("");
  buttons.innerHTML = DRUMS.map(function (drum, index) {
    return '<button class="beat-pad" data-drum="' + index + '"><span>' + drum.icon + '</span><small>' + drum.name + '</small></button>';
  }).join("");
  function playSequence() {
    if (playing) return;
    playing = true; input = [];
    context.stage.querySelector("#beatHint").textContent = context.message("Watch the lights and listen to the rhythm.");
    buttons.querySelectorAll("button").forEach(function (button) { button.disabled = true; });
    let step = 0;
    function pulse() {
      if (step >= sequence.length) {
      activeIndex = -1; activeStep = -1; drawLights();
        playing = false;
        buttons.querySelectorAll("button").forEach(function (button) { button.disabled = false; });
        context.stage.querySelector("#beatHint").textContent = context.message("Your turn! Play the same dinosaurs in order.");
        return;
      }
      activeIndex = sequence[step]; activeStep = step; drawLights(); context.sound("tap");
      window.setTimeout(function () { activeIndex = -1; activeStep = -1; drawLights(); step += 1; window.setTimeout(pulse, 210); }, 390);
    }
    window.setTimeout(pulse, 320);
  }
  function drawLights() {
    lights.querySelectorAll("[data-light]").forEach(function (light) {
      light.classList.toggle("lit", Number(light.dataset.light) < input.length || (playing && Number(light.dataset.light) === activeStep));
    });
    buttons.querySelectorAll("[data-drum]").forEach(function (button) {
      button.classList.toggle("drum-active", playing && Number(button.dataset.drum) === activeIndex);
    });
  }
  buttons.querySelectorAll("[data-drum]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (playing) return;
      const value = Number(button.dataset.drum);
      input.push(value);
      button.classList.add("drum-active"); context.sound("tap");
      window.setTimeout(function () { button.classList.remove("drum-active"); }, 180);
      context.stage.querySelector("#beatProgress").style.width = (input.length / sequence.length * 100) + "%";
      const correctSoFar = input.every(function (item, index) { return item === sequence[index]; });
      if (!correctSoFar) {
        input = [];
        context.stage.querySelector("#beatProgress").style.width = "0%";
        context.stage.querySelector("#beatHint").textContent = context.message("Let’s listen again together. You can try as often as you like.");
        window.setTimeout(playSequence, 500);
      } else if (input.length === sequence.length) {
        context.sound("good");
        window.setTimeout(function () { context.advance("You played the whole dinosaur rhythm!"); }, 300);
      }
    });
  });
  context.stage.querySelector("#replayBeat").addEventListener("click", function () { playSequence(); });
  playSequence();
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
