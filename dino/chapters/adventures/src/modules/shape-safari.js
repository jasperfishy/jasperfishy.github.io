const SHAPES = [
  { id: "circle", name: "circle", mark: "●" },
  { id: "star", name: "star", mark: "★" },
  { id: "triangle", name: "triangle", mark: "▲" },
  { id: "diamond", name: "diamond", mark: "◆" },
  { id: "heart", name: "heart", mark: "♥" },
  { id: "crescent", name: "moon shape", mark: "☾" },
  { id: "leaf", name: "leaf", mark: "❧" },
  { id: "flower", name: "flower", mark: "✿" }
];

export function mountShapeSafari(context) {
  const rounds = Math.min(9, 6 + context.challenge);
  const choiceCount = Math.min(SHAPES.length, 4 + Math.floor(context.challenge / 2));
  let round = 0;
  let target = null;
  let busy = false;
  function nextRound() {
    target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const choices = shuffle([target].concat(shuffle(SHAPES.filter(function (shape) { return shape.id !== target.id; })).slice(0, choiceCount - 1)));
    draw(choices);
  }
  function draw(choices) {
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🔎</span><h2>Shape safari</h2>' +
      '<p>' + escapeText(context.message("Find the " + target.name + " hiding in the meadow.")) + '</p></div>' +
      '<div class="safari-scene"><span class="safari-cloud">☁</span><span class="safari-dino" aria-hidden="true">🦕</span><span class="safari-flower">✿</span>' +
      '<span class="safari-target">' + target.mark + '</span></div>' +
      '<div class="shape-options" id="shapeOptions"></div><div class="dig-progress"><strong>' + round + '</strong> of ' + rounds + ' discoveries</div>' +
      '<div class="progress-track"><span style="width:' + (round / rounds * 100) + '%"></span></div><p class="gentle-hint" id="shapeHint">' + escapeText(context.message("Take your time and look carefully.")) + '</p>';
    const options = context.stage.querySelector("#shapeOptions");
    options.innerHTML = choices.map(function (shape) {
      return '<button class="shape-option" data-shape="' + shape.id + '" aria-label="' + shape.name + '"><span>' + shape.mark + '</span><small>' + shape.name + '</small></button>';
    }).join("");
    options.querySelectorAll("[data-shape]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (busy) return;
        if (button.dataset.shape === target.id) {
          busy = true; button.classList.add("shape-correct"); context.sound("good"); round += 1;
          if (round >= rounds) window.setTimeout(function () { context.advance("You spotted every shape in the dinosaur meadow!"); }, 300);
          else window.setTimeout(function () { busy = false; nextRound(); }, 430);
        } else {
          button.classList.add("shape-gentle-nudge"); context.sound("tap");
          context.stage.querySelector("#shapeHint").textContent = context.message("Look for the " + target.name + ". You can try another shape.");
          window.setTimeout(function () { button.classList.remove("shape-gentle-nudge"); }, 280);
        }
      });
    });
  }
  nextRound();
}

function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
