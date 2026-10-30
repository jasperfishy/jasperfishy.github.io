import { PREHISTORIC_CREATURES } from "./dino-discoveries.js";

const HELPERS = PREHISTORIC_CREATURES.filter(function (creature) { return creature.kind === "Dinosaur"; });
const TASKS = [
  { id: "chair", room: "lounge", target: "🪑", item: "🪑", label: "a soft chair", instruction: "Guide your dinosaur to the little chair, then take it to Mummy.", finish: "The dinosaur brings Mummy a comfy chair." },
  { id: "tidy", room: "lounge", target: "🧸", item: "🧸", label: "a toy for the basket", instruction: "Find the toy on the floor and carry it to the tidy basket.", finish: "The dinosaur tidies the toy into its basket." , basket: true },
  { id: "snack", room: "kitchen", target: "🍓", item: "🍓", label: "a bowl of berries", instruction: "Find a little bowl of berries and bring it to Mummy.", finish: "The dinosaur offers Mummy a yummy pretend snack." },
  { id: "tea", room: "kitchen", target: "☕", item: "☕", label: "a pretend cup of tea", instruction: "Find Mummy’s pretend tea and carefully bring it over.", finish: "Mummy enjoys her pretend cup. It is only a game, not a real hot drink." },
  { id: "fan", room: "garden", target: "🍃", item: "🍃", label: "a big leafy fan", instruction: "Find a big leaf and waft a cool breeze over Mummy.", finish: "The dinosaur gently fans Mummy with a big leaf." },
  { id: "blanket", room: "bedroom", target: "🧣", item: "🧣", label: "a cosy blanket", instruction: "Find a soft blanket and take it to Mummy’s bed.", finish: "The dinosaur tucks Mummy in with a light, cosy blanket." },
  { id: "burble", room: "bedroom", target: "🎵", item: "🎵", label: "a gentle dino song", instruction: "Bring your dinosaur beside Mummy and make a soft, soothing burble.", finish: "A gentle dinosaur burble helps Mummy relax." , burble: true },
  { id: "flowers", room: "garden", target: "🌼", item: "🌼", label: "a few meadow flowers", instruction: "Pick some bright flowers and bring them to Mummy.", finish: "The dinosaur brings Mummy flowers to make her smile." }
];

const DISTRACTORS = ["🧸", "🍃", "🌼", "☕", "🪑", "🧺"];

export function mountMummyCozyCorner(context) {
  const count = Math.min(6, 5 + Math.floor(Math.max(0, context.level - 1) / 2));
  const start = Math.max(0, (context.level - 1) % 3);
  const tasks = TASKS.slice(start).concat(TASKS.slice(0, start)).slice(0, count);
  const helper = HELPERS[(context.level * 3) % HELPERS.length] || HELPERS[0];
  let index = 0;
  let x = 12;
  let y = 75;
  let carrying = false;
  let locked = false;

  function dinoArt() {
    return '<svg viewBox="0 0 150 110" aria-hidden="true"><path d="M36 69Q12 53 8 35q-2 30 27 43" fill="#70b98a" stroke="#286552" stroke-width="4" stroke-linejoin="round"/><ellipse cx="70" cy="70" rx="43" ry="27" fill="#88cd96" stroke="#286552" stroke-width="4"/><path d="M84 60q5-35 28-40 24-5 31 17 4 15-11 21l-19 2-10 17" fill="#96d69b" stroke="#286552" stroke-width="4" stroke-linejoin="round"/><path d="M57 90v12m34-12v12" stroke="#438e67" stroke-width="12" stroke-linecap="round"/><path d="m50 35 7-15 10 15m8-2 8-16 10 21" fill="#f4c46d" stroke="#286552" stroke-width="3" stroke-linejoin="round"/><circle cx="126" cy="28" r="7" fill="white"/><circle cx="128" cy="29" r="3.5" fill="#173f3d"/><circle cx="129" cy="28" r="1.2" fill="white"/><path d="M136 46q5-3 8 1" fill="none" stroke="#286552" stroke-width="2.5" stroke-linecap="round"/></svg>';
  }

  function draw() {
    const finished = index >= tasks.length;
    const task = tasks[index];
    const distractors = task ? DISTRACTORS.filter(function (icon) { return icon !== task.target; }) : [];
    const sceneItems = finished ? [] : [
      { icon: task.target, x: 38, y: 70, target: true },
      { icon: distractors[index % distractors.length], x: 27, y: 43 },
      { icon: distractors[(index + 2) % distractors.length], x: 53, y: 48 }
    ];
    const destinationX = task && task.basket ? 59 : 78;
    const destinationY = task && task.basket ? 74 : 58;
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🌿</span><h2>Mummy’s Cozy Corner</h2><p>' + esc(context.message(finished ? "Mummy feels cosy, peaceful and happy again!" : task.instruction)) + '</p></div>' +
      '<div class="mummy-room room-' + (finished ? 'bedroom' : task.room) + '" id="mummyRoom" aria-label="An illustrated room where Mummy Courtney and a dinosaur are together">' +
        '<div class="room-window"><span>☀️</span></div><div class="room-shelf">🪴　📚　🌼</div><div class="room-rug"></div>' +
        '<div class="room-furniture" aria-hidden="true">' + (task && task.room === 'kitchen' ? '<span class="room-counter">🥣　🍯</span>' : task && task.room === 'bedroom' ? '<span class="room-bed">🛏️</span>' : '<span class="room-sofa">🛋️</span>') + '</div>' +
        '<div class="mummy-person' + (finished || index > 1 ? ' feeling-better' : '') + '" id="mummyTarget" style="left:' + destinationX + '%;top:' + destinationY + '%" aria-label="Mummy Courtney, waiting for help">' +
          '<div class="mummy-face"><img src="./assets/courtney-avatar.png" alt="Mummy Courtney"/><span class="mummy-expression">' + (finished ? '💛' : index > 1 ? '🙂' : '😴') + '</span></div><div class="mummy-body"></div><span class="mummy-name">Mummy Courtney</span></div>' +
        '<div class="mummy-drop-glow" style="left:' + destinationX + '%;top:' + destinationY + '%"></div>' + (task && task.basket ? '<div class="mummy-basket-target" style="left:' + destinationX + '%;top:' + destinationY + '%">🧺</div>' : '') +
        sceneItems.map(function (item, n) { return '<div class="mummy-room-item' + (item.target ? ' wanted' : '') + '" data-item="' + (item.target ? 'target' : 'distractor') + '" style="left:' + item.x + '%;top:' + item.y + '%" aria-label="' + (item.target ? 'The ' + esc(task.label) : 'A room decoration') + '">' + item.icon + '</div>'; }).join('') +
        '<div class="mummy-helper-dino' + (carrying ? ' carrying' : '') + '" id="mummyDino" role="img" aria-label="' + esc(helper.short) + ', your dinosaur helper" tabindex="0" style="left:' + x + '%;top:' + y + '%">' + dinoArt() + (carrying ? '<span class="mummy-cargo">' + task.item + '</span>' : '') + '<span class="dino-name-tag">' + esc(helper.short) + '</span></div>' +
        '<div class="mummy-room-message" id="mummyRoomMessage" aria-live="polite">' + (finished ? 'The room is cosy and Mummy is smiling.' : carrying ? 'Lovely! Guide your dinosaur to ' + (task.basket ? 'the basket' : 'Mummy') + '.' : 'Drag your dinosaur to ' + task.item + ' ' + esc(task.label) + '.') + '</div>' +
      '</div>' +
      '<div class="mummy-progress-label">' + (finished ? 'All done — every little job is complete!' : 'Little job ' + (index + 1) + ' of ' + tasks.length) + '</div>' +
      '<div class="care-progress" role="progressbar" aria-label="Mummy care jobs completed" aria-valuemin="0" aria-valuemax="' + tasks.length + '" aria-valuenow="' + index + '"><span style="width:' + (index / tasks.length * 100) + '%"></span></div>' +
      (finished ? '<aside class="mummy-note"><strong>What a thoughtful dinosaur team!</strong><br>' + esc(context.playerName ? context.playerName + ' helped Mummy Courtney rest.' : 'You helped Mummy Courtney rest.') + '</aside><button class="primary-button center-button" id="mummyFinish">Earn a happy star ✨</button>' :
        '<div class="mummy-move-controls" aria-label="Move the dinosaur"><button type="button" data-step="left" aria-label="Move dinosaur left">←</button><div><button type="button" data-step="up" aria-label="Move dinosaur up">↑</button><button type="button" data-step="down" aria-label="Move dinosaur down">↓</button></div><button type="button" data-step="right" aria-label="Move dinosaur right">→</button><span>Drag the dinosaur, or use the arrows</span></div>');

    const room = context.stage.querySelector('#mummyRoom');
    const dino = context.stage.querySelector('#mummyDino');
    const message = context.stage.querySelector('#mummyRoomMessage');
    const finish = context.stage.querySelector('#mummyFinish');
    if (finish) {
      finish.addEventListener('click', function () { context.advance('You and the dinosaur helpers made a lovely, peaceful home for Mummy Courtney!'); });
      return;
    }
    let dragging = false;
    function moveTo(nextX, nextY) {
      if (locked || finished) return;
      x = Math.max(6, Math.min(91, nextX));
      y = Math.max(22, Math.min(82, nextY));
      dino.style.left = x + '%'; dino.style.top = y + '%';
      if (!carrying && Math.abs(x - 38) < 14 && Math.abs(y - 70) < 22) {
        carrying = true;
        context.sound('good');
        message.textContent = 'You found ' + task.label + '! Now take it to ' + (task.basket ? 'the tidy basket' : 'Mummy') + '.';
        dino.classList.add('carrying');
        const cargo = document.createElement('span'); cargo.className = 'mummy-cargo'; cargo.textContent = task.item; dino.appendChild(cargo);
      }
      if (carrying && Math.abs(x - destinationX) < 15 && Math.abs(y - destinationY) < 20) deliver();
    }
    function deliver() {
      if (locked) return;
      locked = true;
      room.classList.add('mummy-delivery');
      const target = context.stage.querySelector('#mummyTarget');
      target.classList.add('feeling-better');
      target.querySelector('.mummy-expression').textContent = task.id === 'fan' ? '☺️' : '😊';
      message.textContent = task.finish;
      dino.classList.add('dino-cheer');
      context.sound('good');
      context.notify(task.finish);
      window.setTimeout(function () {
        if (currentActivity !== 'mummy') return;
        index += 1; x = 12; y = 75; carrying = false; locked = false;
        if (index === tasks.length) context.speak(context.message('Mummy is comfy and happy. Your dinosaur team did such kind, helpful jobs!'));
        draw();
      }, 1250);
    }
    function pointerPosition(event) {
      const rect = room.getBoundingClientRect();
      moveTo((event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100);
    }
    dino.addEventListener('pointerdown', function (event) { if (locked) return; dragging = true; dino.setPointerCapture(event.pointerId); event.preventDefault(); });
    dino.addEventListener('pointermove', function (event) { if (dragging) pointerPosition(event); });
    dino.addEventListener('pointerup', function (event) { dragging = false; if (dino.hasPointerCapture(event.pointerId)) dino.releasePointerCapture(event.pointerId); });
    dino.addEventListener('keydown', function (event) {
      const delta = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[event.key];
      if (delta) { event.preventDefault(); moveTo(x + delta[0], y + delta[1]); }
    });
    context.stage.querySelectorAll('[data-step]').forEach(function (button) {
      button.addEventListener('click', function () {
        const delta = { left: [-8,0], right: [8,0], up: [0,-8], down: [0,8] }[button.dataset.step];
        moveTo(x + delta[0], y + delta[1]); context.sound('tap');
      });
    });
  }

  context.speak(context.message('Mummy Courtney is resting in the ' + (tasks[0].room === 'lounge' ? 'living room' : tasks[0].room) + '. Drag your little dinosaur to the right things and bring them to her.'));
  draw();
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}
