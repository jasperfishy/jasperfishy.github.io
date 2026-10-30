import { PREHISTORIC_CREATURES } from "./dino-discoveries.js";

const DINOSAURS = PREHISTORIC_CREATURES.filter(function (creature) { return creature.kind === "Dinosaur"; });
const STARS = [
  { name: "moon", icon: "🌙" },
  { name: "fern", icon: "🌿" },
  { name: "pawprint", icon: "🐾" },
  { name: "flower", icon: "🌼" },
  { name: "crystal", icon: "💎" },
  { name: "star", icon: "⭐" }
];
const PATTERNS = {
  2: [0, 2],
  3: [1, 3, 0],
  4: [2, 0, 3, 1],
  5: [0, 3, 1, 4, 2],
  6: [4, 1, 5, 0, 3, 2]
};

export function mountMoonbeamRescue(context) {
  const level = Math.max(1, Number(context.level) || 1);
  const pathLength = Math.min(6, 2 + Math.floor((level - 1) / 2));
  const choiceCount = Math.min(6, 3 + Math.floor((level - 1) / 2));
  const visibleDinos = Math.min(DINOSAURS.length, 5 + (level - 1) * 2);
  const dinosaur = DINOSAURS[(level * 3) % visibleDinos];
  const starOffset = (level - 1) % STARS.length;
  const choices = STARS.slice(starOffset).concat(STARS.slice(0, starOffset)).slice(0, choiceCount);
  const sequence = PATTERNS[pathLength].map(function (index) { return choices[index]; });
  let mode = "ready";
  let position = 0;
  let shown = [];
  let hint = "First, watch the moonbeam trail. Then tap the same glowing symbols in order.";
  let previewTimers = [];
  let previewId = 0;

  function clearPreview() {
    previewId += 1;
    previewTimers.forEach(window.clearTimeout);
    previewTimers = [];
  }

  function draw() {
    const rescued = mode === "rescued";
    const actionsDisabled = mode === "showing" || mode === "rescued";
    const helpers = rescued ? '<div class="moon-reunion" aria-label="The baby dinosaur is reunited with its family"><span class="moon-baby">🦖</span><span class="moon-hearts">♥　✦　♥</span></div>' : '<div class="moon-nest"><span class="moon-egg">🥚</span><small>Someone is waiting</small></div>';
    context.stage.innerHTML = '<div class="stage-heading moon-heading"><span class="stage-emoji" aria-hidden="true">🌙</span><h2>Moonbeam Rescue</h2><p>' + escapeMoon(context.message(rescued ? "You found the right trail! The little dinosaur is safe with its family." : "A baby dinosaur is waiting on the far side of the moonlit meadow. Can you light the way?")) + '</p></div>' +
      '<section class="moon-scene' + (rescued ? ' moon-scene-reunion' : '') + '" aria-label="A magical moonlit meadow with a dinosaur family across a star path">' +
        '<span class="moon-moon" aria-hidden="true">☾</span><span class="moon-scene-star star-a" aria-hidden="true">✦</span><span class="moon-scene-star star-b" aria-hidden="true">✧</span><span class="moon-scene-star star-c" aria-hidden="true">✦</span>' +
        '<div class="moon-island moon-island-home"><span class="moon-adult-dino" aria-hidden="true">' + dinosaur.icon + '</span><strong>' + escapeMoon(dinosaur.short) + '</strong><small>ready to help</small></div>' +
        '<div class="moon-bridge" aria-label="Moonbeam stepping-stone trail">' + sequence.map(function (star, index) {
          const lit = shown.indexOf(index) !== -1 || (rescued && index < sequence.length);
          return '<span class="moon-step' + (lit ? ' moon-step-lit' : '') + '" data-path-step="' + index + '">' + (lit ? star.icon : '✧') + '</span>';
        }).join('') + '</div>' +
        '<div class="moon-island moon-island-far">' + helpers + (rescued ? '<strong>Safe at home!</strong>' : '') + '</div>' +
      '</section>' +
      '<div class="moon-level-line"><span>Moon trail ' + level + '</span><span>' + (rescued ? 'family reunited ✨' : 'step ' + Math.min(position + 1, pathLength) + ' of ' + pathLength) + '</span></div>' +
      '<div class="moon-progress" role="progressbar" aria-label="Moonbeam trail progress" aria-valuemin="0" aria-valuemax="' + pathLength + '" aria-valuenow="' + (rescued ? pathLength : position) + '"><span style="width:' + ((rescued ? pathLength : position) / pathLength * 100) + '%"></span></div>' +
      (rescued ? '<p class="moon-hint">' + escapeMoon(context.message(dinosaur.short + ' guided the little one safely home. Listen to their happy reunion!')) + '</p><div class="moon-actions"><button class="tiny-button" id="moonReplay">Hear a happy dino sound 🔊</button><button class="primary-button" id="moonFinish">Celebrate and earn a star ✨</button></div>' :
        '<p class="moon-hint" id="moonHint" aria-live="polite">' + escapeMoon(context.message(hint)) + '</p>' +
        '<div class="moon-choices" aria-label="Moonbeam symbols">' + choices.map(function (star, index) {
          return '<button class="moon-choice" data-star-choice="' + index + '" aria-label="Choose ' + escapeMoon(star.name) + '"' + (actionsDisabled ? ' disabled' : '') + '><span>' + star.icon + '</span></button>';
        }).join('') + '</div>' +
        '<div class="moon-actions"><button class="soft-button" id="moonShow"' + (actionsDisabled ? ' disabled' : '') + '>✨ Watch the trail</button>' + (mode === 'playing' ? '<button class="tiny-button" id="moonStartOver">Start the trail again</button>' : '') + '</div>');

    context.stage.querySelectorAll('[data-star-choice]').forEach(function (button) {
      button.addEventListener('click', function () { chooseStar(Number(button.dataset.starChoice)); });
    });
    const show = context.stage.querySelector('#moonShow');
    if (show) show.addEventListener('click', playTrail);
    const startOver = context.stage.querySelector('#moonStartOver');
    if (startOver) startOver.addEventListener('click', function () { position = 0; shown = []; mode = 'ready'; hint = 'Let’s watch again, then follow the same stars.'; draw(); playTrail(); });
    const replay = context.stage.querySelector('#moonReplay');
    if (replay) replay.addEventListener('click', function () { context.sound('good'); context.speak(context.message('The little dinosaur is safe and happy with its family.')); });
    const finish = context.stage.querySelector('#moonFinish');
    if (finish) finish.addEventListener('click', function () { context.advance('A moonbeam trail brought the baby dinosaur safely home!'); });
  }

  function playTrail() {
    clearPreview();
    mode = 'showing';
    position = 0;
    shown = [];
    hint = 'Watch each moonbeam glow, one at a time.';
    draw();
    const thisPreview = previewId;
    sequence.forEach(function (star, index) {
      previewTimers.push(window.setTimeout(function () {
        if (thisPreview !== previewId || !context.stage.isConnected) return;
        shown = [index];
        context.sound('tap');
        context.stage.querySelectorAll('.moon-step-flash').forEach(function (activeStep) { activeStep.classList.remove('moon-step-flash'); });
        const step = context.stage.querySelector('[data-path-step="' + index + '"]');
        if (step) { step.textContent = star.icon; step.classList.add('moon-step-flash'); }
        const hintElement = context.stage.querySelector('#moonHint');
        if (hintElement) hintElement.textContent = context.message('Remember the ' + star.name + ' moonbeam.');
      }, index * 720));
    });
    previewTimers.push(window.setTimeout(function () {
      if (thisPreview !== previewId || !context.stage.isConnected) return;
      mode = 'playing';
      shown = [];
      hint = context.playerName ? context.playerName + ', tap the same symbols in the same order.' : 'Now tap the same symbols in the same order.';
      draw();
      context.speak(context.message('Now follow the same moonbeam symbols in order.'));
    }, sequence.length * 720 + 160));
  }

  function chooseStar(index) {
    if (mode !== 'playing') { context.sound('tap'); hint = 'Watch the trail first, then try those symbols.'; draw(); return; }
    const button = context.stage.querySelector('[data-star-choice="' + index + '"]');
    if (button) button.classList.add('moon-choice-picked');
    if (choices[index].name !== sequence[position].name) {
      context.sound('tap');
      position = 0;
      shown = [];
      hint = 'That’s okay. Let’s watch the glowing trail again and try together.';
      draw();
      return;
    }
    shown.push(position);
    position += 1;
    context.sound('good');
    if (position === sequence.length) {
      clearPreview();
      mode = 'rescued';
      shown = sequence.map(function (_, step) { return step; });
      context.speak(context.message('The baby dinosaur found its family! What a lovely moonbeam rescue.'));
      draw();
    } else {
      hint = 'Lovely! One more moonbeam to follow.';
      draw();
    }
  }

  context.speak(context.message('A little dinosaur is waiting across the moonlit meadow. Let’s help it find its family.'));
  draw();
}

function escapeMoon(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}
