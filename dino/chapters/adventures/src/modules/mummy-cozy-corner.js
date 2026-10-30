import { PREHISTORIC_CREATURES } from "./dino-discoveries.js";

const DINOSAURS = PREHISTORIC_CREATURES.filter(function (creature) { return creature.kind === "Dinosaur"; });
const COMFORTS = [
  { id: "chair", icon: "🪑", label: "A comfy chair", line: "Mummy would love somewhere soft to sit.", done: "A little chair is ready for Mummy." },
  { id: "tidy", icon: "🧺", label: "Tidy the nook", line: "Let’s tidy the cosy corner so Mummy has room to rest.", done: "The cosy nook is neat, tidy and ready." },
  { id: "snack", icon: "🍓", label: "A little snack", line: "Mummy might enjoy a little bowl of meadow berries.", done: "A little pretend bowl of berries is ready for Mummy." },
  { id: "tea", icon: "☕", label: "Pretend tea", line: "Let’s bring Mummy a make-believe cup of tea.", done: "A pretend cup of tea is waiting. It is only a game, so there is no hot drink." },
  { id: "fan", icon: "🍃", label: "Leaf fan", line: "Mummy would like a gentle breeze from a big leaf.", done: "A soft leaf breeze is floating by." },
  { id: "burble", icon: "💤", label: "Soothing burbles", line: "A little dinosaur can make a quiet, soothing burble.", done: "A gentle dino burble helps Mummy feel peaceful." },
  { id: "blanket", icon: "🧣", label: "Cosy blanket", line: "Let’s find a light, cosy blanket for Mummy.", done: "A soft blanket is tucked nearby." },
  { id: "flowers", icon: "🌼", label: "Meadow flowers", line: "A few bright meadow flowers might make Mummy smile.", done: "Pretty meadow flowers make the nook feel lovely." },
  { id: "song", icon: "🎵", label: "Gentle lullaby", line: "A dinosaur friend can hum a tiny sleepy tune.", done: "A gentle little tune fills the cosy corner." },
  { id: "pillow", icon: "🛏️", label: "Soft pillow", line: "A soft pillow will make Mummy’s rest extra comfy.", done: "A soft pillow is ready for a peaceful rest." }
];

export function mountMummyCozyCorner(context) {
  const rounds = Math.min(6, 3 + Math.floor(Math.max(0, context.level - 1) / 2));
  const extras = COMFORTS.slice(3);
  const offset = (context.level - 1) % extras.length;
  const tasks = COMFORTS.slice(0, 3).concat(extras.slice(offset), extras.slice(0, offset)).slice(0, rounds);
  let completed = [];
  let chosenDinosaur = null;

  function draw() {
    const finished = completed.length === tasks.length;
    const current = tasks[completed.length];
    const visibleCount = Math.min(DINOSAURS.length, 4 + Math.floor((context.level - 1) / 2));
    const dinoOptions = chosenDinosaur ? [chosenDinosaur] : [0, 1, 2].map(function (n) {
      return DINOSAURS[(context.level * 3 + completed.length * 5 + n * 7) % visibleCount];
    }).filter(function (creature, index, list) { return list.indexOf(creature) === index; });

    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🌿</span><h2>Mummy’s Cozy Corner</h2><p>' + esc(context.message(finished ? "Mummy feels cosy, peaceful and happy again!" : current.line)) + '</p></div>' +
      '<div class="mummy-scene' + (finished ? ' mummy-resting' : '') + '">' +
        '<div class="mummy-sky-sparkle" aria-hidden="true">✦</div><div class="mummy-meadow" aria-hidden="true"></div>' +
        '<div class="mummy-portrait-wrap"><img class="mummy-portrait" src="./assets/courtney-avatar.png" alt="Illustration of Mummy Courtney" /><span class="mummy-mood" aria-hidden="true">' + (finished ? '💛' : completed.length ? '🙂' : '😴') + '</span></div>' +
      '<div class="mummy-props" aria-label="Comforts collected">' + tasks.map(function (task) { return '<span class="mummy-prop' + (completed.indexOf(task.id) !== -1 ? ' earned' : '') + '" title="' + esc(task.label) + '">' + (completed.indexOf(task.id) !== -1 ? task.icon : '·') + '</span>'; }).join('') + '</div>' +
        '<strong class="mummy-caption">' + (finished ? esc(context.playerName ? context.playerName + ' helped Mummy Courtney rest' : 'Mummy Courtney is resting') : 'Mummy Courtney’s cosy nook') + '</strong>' +
        (chosenDinosaur && !finished ? '<div class="mummy-helper" aria-hidden="true">' + chosenDinosaur.icon + '<span>' + current.icon + '</span></div>' : '') +
      '</div>' +
      '<div class="mummy-progress-label">' + (finished ? 'Every kind comfort is in place' : 'Comfort ' + (completed.length + 1) + ' of ' + tasks.length) + '</div>' +
      '<div class="care-progress" role="progressbar" aria-label="Comforts completed" aria-valuemin="0" aria-valuemax="' + tasks.length + '" aria-valuenow="' + completed.length + '"><span style="width:' + (completed.length / tasks.length * 100) + '%"></span></div>' +
      (finished ? '<aside class="mummy-note"><strong>What a caring dino team!</strong><br>Mummy can rest, and Grayson has helped make the meadow feel calm and happy.</aside><div class="care-actions"><button class="tiny-button" id="mummyReplay">Hear the gentle message 🔊</button><button class="primary-button" id="mummyFinish">Earn a happy star ✨</button></div>' :
        '<p class="gentle-hint mummy-hint">' + esc(context.message(chosenDinosaur ? chosenDinosaur.short + ' is ready to help!' : 'Choose a dinosaur helper. Every friend can help in their own way.')) + '</p>' +
        '<div class="mummy-dino-grid">' + dinoOptions.map(function (creature, index) { return '<button class="mummy-dino-choice' + (chosenDinosaur ? ' selected' : '') + '" data-helper="' + index + '"><span>' + creature.icon + '</span><strong>' + esc(creature.short) + '</strong><small>' + (chosenDinosaur ? 'Ready to help!' : 'Pick this friend') + '</small></button>'; }).join('') + '</div>' +
        (chosenDinosaur ? '<button class="soft-button mummy-help-button" id="mummyHelp">' + current.icon + ' ' + esc(current.label) + ' — let’s help!</button>' : ''));

    context.stage.querySelectorAll('[data-helper]').forEach(function (button) {
      button.addEventListener('click', function () {
        chosenDinosaur = dinoOptions[Number(button.dataset.helper)];
        context.sound('tap');
        draw();
      });
    });
    const help = context.stage.querySelector('#mummyHelp');
    if (help) help.addEventListener('click', function () {
      completed.push(current.id);
      context.notify(chosenDinosaur.short + ' helped! ' + current.done);
      context.sound('good');
      if (current.id === 'burble' || current.id === 'song') context.speak(context.message('A tiny dinosaur makes a soft, soothing sound.'));
      chosenDinosaur = null;
      if (completed.length === tasks.length) context.speak(context.message('Mummy feels cosy, peaceful and happy again. You were a kind helper!'));
      draw();
    });
    const replay = context.stage.querySelector('#mummyReplay');
    if (replay) replay.addEventListener('click', function () { context.speak(context.message('Mummy is comfy, calm and happy. Your dinosaur friends helped so gently.')); });
    const finish = context.stage.querySelector('#mummyFinish');
    if (finish) finish.addEventListener('click', function () { context.advance('You and your dinosaur friends made a lovely, peaceful place for Mummy Courtney to rest!'); });
  }

  context.speak(context.message('Mummy Courtney is a little tired. Let’s help her feel cosy with our dinosaur friends.'));
  draw();
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}
