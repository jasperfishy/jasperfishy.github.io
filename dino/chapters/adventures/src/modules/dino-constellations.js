const STARS = ["✦", "✧", "✶", "✷", "✹", "✸", "★", "✧", "✦", "✶", "✷", "✹"];
const POSITIONS = [
  [12, 23], [31, 13], [51, 22], [75, 15], [89, 36], [69, 43],
  [48, 40], [28, 51], [10, 68], [34, 79], [59, 69], [83, 82]
];
const SILHOUETTES = ["🦖", "🦕", "🪽", "🦏", "🐚", "🌙"];

export function mountDinoConstellations(context) {
  const level = Math.max(1, Number(context.level) || 1);
  const choiceCount = Math.min(STARS.length, 6 + Math.floor((level - 1) / 2));
  const pathLength = Math.min(8, 3 + Math.floor((level - 1) / 2));
  const start = (level * 2) % choiceCount;
  const sequence = Array.from({ length: choiceCount }, function (_, index) { return (start + index) % choiceCount; }).slice(0, pathLength);
  const picture = SILHOUETTES[(level - 1) % SILHOUETTES.length];
  let mode = "ready";
  let progress = 0;
  let glowIndex = -1;
  let timers = [];
  let token = 0;

  function clearTimers() {
    token += 1;
    timers.forEach(window.clearTimeout);
    timers = [];
  }

  function draw() {
    const won = mode === "won";
    const points = sequence.slice(0, progress).map(function (index) { return POSITIONS[index]; });
    const line = points.length > 1 ? '<polyline class="constellation-line" points="' + points.map(function (point) { return point[0] + "," + point[1]; }).join(" ") + '" />' : "";
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🌌</span><h2>Starry Dino Constellations</h2><p>' + esc(context.message(won ? "You connected the stars and made a dinosaur picture in the night sky!" : "Watch the stars glow, then tap them in the same order to draw a dinosaur constellation.")) + '</p></div>' +
      '<section class="constellation-scene" aria-label="A starry night sky with a hidden dinosaur constellation">' +
        '<span class="constellation-moon" aria-hidden="true">☾</span><span class="constellation-picture" aria-hidden="true">' + (won ? picture : "?") + '</span><svg class="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + line + '</svg>' +
        Array.from({ length: choiceCount }, function (_, index) {
          const point = POSITIONS[index];
          return '<button class="constellation-star' + (glowIndex === index ? ' glowing' : '') + (points.length && sequence.slice(0, progress).includes(index) ? ' connected' : '') + '" style="left:' + point[0] + '%;top:' + point[1] + '%" data-star="' + index + '" aria-label="Star ' + (index + 1) + '"' + (mode === "showing" || won || mode === "ready" ? ' disabled' : '') + '>' + STARS[index] + '</button>';
        }).join("") +
      '</section><div class="constellation-status" aria-live="polite">' + (mode === "won" ? 'A new constellation is shining bright ✨' : mode === "showing" ? 'Watch the glowing stars…' : mode === "playing" ? 'Star ' + (progress + 1) + ' of ' + pathLength : 'Constellation ' + level + ' · ' + pathLength + ' stars to connect') + '</div>' +
      '<div class="constellation-actions">' + (won ? '<button class="primary-button" id="constellationFinish">Earn a star and discover the next sky ✨</button>' : '<button class="primary-button" id="constellationShow"' + (mode === "showing" ? ' disabled' : '') + '>✨ Show me the star path</button>') + '</div>';

    context.stage.querySelectorAll("[data-star]").forEach(function (button) { button.addEventListener("click", function () { choose(Number(button.dataset.star)); }); });
    const show = context.stage.querySelector("#constellationShow");
    if (show) show.addEventListener("click", preview);
    const finish = context.stage.querySelector("#constellationFinish");
    if (finish) finish.addEventListener("click", function () { context.advance("You drew a lovely " + picture + " constellation among the stars!"); });
  }

  function preview() {
    clearTimers(); mode = "showing"; progress = 0; glowIndex = -1; draw();
    const currentToken = token;
    sequence.forEach(function (index, step) {
      timers.push(window.setTimeout(function () {
        if (currentToken !== token || !context.stage.isConnected) return;
        glowIndex = index; context.sound("tap"); draw();
      }, step * 620 + 180));
    });
    timers.push(window.setTimeout(function () {
      if (currentToken !== token || !context.stage.isConnected) return;
      mode = "playing"; glowIndex = -1; draw(); context.speak(context.message("Your turn! Tap each glowing star in the same order."));
    }, sequence.length * 620 + 260));
  }

  function choose(index) {
    if (mode !== "playing") return;
    if (index !== sequence[progress]) {
      clearTimers(); mode = "ready"; progress = 0; glowIndex = -1; draw();
      context.notify("Good try! Watch the star path again and we can do it together."); return;
    }
    progress += 1; context.sound("good");
    if (progress === sequence.length) { clearTimers(); mode = "won"; draw(); context.speak(context.message("A beautiful dinosaur constellation is glowing in the sky!")); }
    else draw();
  }

  context.speak(context.message("Let’s connect a dinosaur picture in the stars."));
  draw();
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}
