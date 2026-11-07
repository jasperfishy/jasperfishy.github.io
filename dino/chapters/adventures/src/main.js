import { registerModule, getModule } from "./module-registry.js?v=du-2b5bf1340085b709";
import { awardSticker, albumHTML, getExtras, STICKERS } from "./adv-kit.js?v=du-2b5bf1340085b709";
import { mountBuilder } from "./modules/builder.js?v=du-2b5bf1340085b709";
import { mountJigsaw } from "./modules/jigsaw.js?v=du-2b5bf1340085b709";
import { mountFossil } from "./modules/fossil.js?v=du-2b5bf1340085b709";
import { mountMemory } from "./modules/memory.js?v=du-2b5bf1340085b709";
import { mountPicnic } from "./modules/picnic.js?v=du-2b5bf1340085b709";
import { mountTrail } from "./modules/trail.js?v=du-2b5bf1340085b709";
import { mountHatchling } from "./modules/hatchling.js?v=du-2b5bf1340085b709";
import { mountShapeSafari } from "./modules/shape-safari.js?v=du-2b5bf1340085b709";
import { mountDinoBeat } from "./modules/dino-beat.js?v=du-2b5bf1340085b709";
import { mountHabitatBuilder } from "./modules/habitat-builder.js?v=du-2b5bf1340085b709";
import { mountStorybook } from "./modules/storybook.js?v=du-2b5bf1340085b709";
import { mountDinoDiscoveries, PREHISTORIC_CREATURES } from "./modules/dino-discoveries.js?v=du-2b5bf1340085b709";
import { mountDinoCare } from "./modules/dino-care.js?v=du-2b5bf1340085b709";
import { mountMummyCozyCorner } from "./modules/mummy-cozy-corner.js?v=du-2b5bf1340085b709";
import { mountMoonbeamRescue } from "./modules/moonbeam-rescue.js?v=du-2b5bf1340085b709";
import { mountDinoParade } from "./modules/dino-parade.js?v=du-2b5bf1340085b709";
import { mountDaddyChase } from "./modules/daddy-chase.js?v=du-2b5bf1340085b709";
import { mountDinoQuest } from "./modules/dino-quest.js?v=du-2b5bf1340085b709";
import { mountDinoRescue } from "./modules/dino-rescue.js?v=du-2b5bf1340085b709";
import { mountDinoConstellations } from "./modules/dino-constellations.js?v=du-2b5bf1340085b709";
import { mountSkyMail, mountWeatherWorkshop } from "./modules/wonder-activities.js?v=du-2b5bf1340085b709";

const STORAGE_KEY = "dinosaur-universe-player-v1";
const EMBEDDED = window.self !== window.top;
const REQUESTED_ACTIVITY = new URLSearchParams(location.search).get("activity");
const defaultState = {
  name: "",
  nameAsked: false,
  difficulty: "curious",
  sound: true,
  speech: false,
  calmCelebrations: false,
  seenIntro: false,
  stars: 0,
  levels: {},
  completed: [],
  colorWork: {}
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Object.assign({}, defaultState, saved || {});
  } catch (error) {
    return Object.assign({}, defaultState);
  }
}

let state = loadState();
let activeFilter = "All";
let currentActivity = null;
let activeContext = null;
let activeColor = "#ef795f";
const app = document.getElementById("app");
const dialogLayer = document.getElementById("dialogLayer");
const soundButton = document.getElementById("soundButton");
const toast = document.getElementById("toast");

if (EMBEDDED) document.documentElement.classList.add("embedded-universe");

const DINOSAURS = PREHISTORIC_CREATURES.filter(function (creature) { return creature.kind === "Dinosaur"; });

const COLOR_PAGES = [
  { name: "Fern Garden", dino: "T-Rex", icon: "🌿", scene: "#e4f3dc" },
  { name: "Sunset Valley", dino: "Stegosaurus", icon: "🌅", scene: "#f8e4d5" },
  { name: "Rainbow River", dino: "Brachiosaurus", icon: "🌈", scene: "#deeff5" },
  { name: "Volcano Picnic", dino: "Triceratops", icon: "🌋", scene: "#f5dfd7" },
  { name: "Starry Meadow", dino: "Velociraptor", icon: "✨", scene: "#e6e1f3" },
  { name: "Flower Island", dino: "Pteranodon", icon: "🌼", scene: "#f5ecd0" },
  { name: "Cloud Forest", dino: "Ankylosaurus", icon: "☁️", scene: "#e2f1ef" },
  { name: "Berry Woods", dino: "Parasaurolophus", icon: "🍓", scene: "#f4e0e8" },
  { name: "Moonlit Lagoon", dino: "Spinosaurus", icon: "🌙", scene: "#dfe8f4" },
  { name: "Golden Savanna", dino: "Diplodocus", icon: "🌻", scene: "#f7ebc9" },
  { name: "Snowy Peaks", dino: "Carnotaurus", icon: "❄️", scene: "#e3f0f2" },
  { name: "Dino Parade", dino: "Therizinosaurus", icon: "🎈", scene: "#f4e5d7" },
  { name: "Moonbeam Meadow", dino: "T-Rex", icon: "🌙", scene: "#e8e5f2" },
  { name: "Citrus Canyon", dino: "Stegosaurus", icon: "🍊", scene: "#f2e9cc" },
  { name: "Tall Fern Trail", dino: "Brachiosaurus", icon: "🌳", scene: "#dff1e4" },
  { name: "Poppy Patch", dino: "Triceratops", icon: "🌺", scene: "#f5e2e7" },
  { name: "Meteor Shower", dino: "Velociraptor", icon: "☄️", scene: "#e5e1f3" },
  { name: "Seashell Shore", dino: "Pteranodon", icon: "🐚", scene: "#dff0f3" }
];

const ACTIVITIES = [
  { id: "rescue", title: "The Great Dino Rescue", icon: "🏇", category: "Adventures", tint: "#ffe3b8", description: "A big seven-chapter quest! Ride a dinosaur through forest, canyon, cave, lava and sky to save Mummy and Daddy." },
  { id: "builder", title: "Build a Dinosaur", icon: "🦖", category: "Puzzles", tint: "#e4f2dc", description: "Pick up each part and drop it into its place." },
  { id: "jigsaw", title: "Dino Picture Jigsaw", icon: "🧩", category: "Puzzles", tint: "#e6e3f5", description: "Piece together a colourful prehistoric scene." },
  { id: "fossil", title: "Fossil Explorer", icon: "🦴", category: "Discovery", tint: "#f6e9d7", description: "Brush away the earth and discover a dinosaur." },
  { id: "memory", title: "Memory Eggs", icon: "🥚", category: "Puzzles", tint: "#f2e4ed", description: "Find friendly dinosaur friends hiding in eggs." },
  { id: "picnic", title: "Dino Picnic", icon: "🍓", category: "Cozy play", tint: "#fae8d5", description: "Choose a tasty treat for a hungry dinosaur." },
  { id: "hatchling", title: "Hatchling Nursery", icon: "🥚", category: "Cozy play", tint: "#f7e5bc", description: "Help a baby dinosaur hatch and choose its first toy." },
  { id: "trail", title: "Footprint Trail", icon: "👣", category: "Learning", tint: "#e1edf5", description: "Follow the footprints and discover what is next." },
  { id: "shapes", title: "Shape Safari", icon: "🔎", category: "Learning", tint: "#e2eee4", description: "Spot shapes hiding around the dinosaur meadow." },
  { id: "beat", title: "Dino Beat Parade", icon: "🥁", category: "Creative", tint: "#ece3f7", description: "Watch a dinosaur rhythm, then play it back." },
  { id: "habitat", title: "Dino Habitat Builder", icon: "🌱", category: "Discovery", tint: "#dff0df", description: "Make a cosy prehistoric home for each dinosaur." },
  { id: "storybook", title: "Dino Storybook", icon: "📖", category: "Creative", tint: "#eee5f5", description: "Choose a dinosaur, a place and a magical surprise to make a story." },
  { id: "discoveries", title: "Prehistoric Discoveries", icon: "🦴", category: "Learning", tint: "#eee8d8", description: "Meet more than twenty dinosaurs and learn about other ancient creatures." },
  { id: "care", title: "Dino Care Clinic", icon: "🧺", category: "Cozy play", tint: "#f4e7d9", description: "Choose a dinosaur and help it feel cosy with gentle care." },
  { id: "mummy", title: "Mummy’s Cozy Corner", icon: "🌿", category: "Cozy play", tint: "#e4f0df", description: "Team up with dinosaur friends to help Mummy feel comfy and happy." },
  { id: "moonbeam", title: "Moonbeam Rescue", icon: "🌙", category: "Adventures", tint: "#e9e5f5", description: "Remember the glowing star path and guide a little dinosaur home." },
  { id: "parade", title: "Dinosaur Dress-up Parade", icon: "🎉", category: "Creative", tint: "#f8e5c9", description: "Choose a dinosaur, a parade look and a magical world for its show." },
  { id: "constellations", title: "Starry Dino Constellations", icon: "🌌", category: "Puzzles", tint: "#e5e8f6", description: "Watch the stars glow, then connect them to draw a dinosaur in the night sky." },
  { id: "skymail", title: "Prehistoric Sky Mail", icon: "📮", category: "Adventures", tint: "#dceef5", description: "Deliver little surprises to pterosaurs and other prehistoric flying friends." },
  { id: "weather", title: "Dino Weather Workshop", icon: "🌦️", category: "Discovery", tint: "#e2f0ec", description: "Notice the weather and help prehistoric friends find what they need." },
  { id: "coloring", title: "Coloring Studio", icon: "🎨", category: "Creative", tint: "#f7e1d7", description: "Colour dinosaur scenes and save your artwork." },
  { id: "quest", title: "Dino Quest: The Lost Egg", icon: "⛰️", category: "Adventures", tint: "#dcebd2", description: "Climb Mount Roar, find a cave and bring a lost egg home to its mummy." },
  { id: "daddy", title: "Naughty Daddy", icon: "🏃", category: "Adventures", tint: "#f5e4cb", description: "Pick a dinosaur and catch Daddy in a silly chase." }
];

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { showToast("This device is low on saved space."); }
  updateSoundButton();
}

function notifyHubSettings() {
  if (!EMBEDDED) return;
  window.parent.postMessage({
    type: "du-settings-update",
    name: state.name,
    sound: state.sound,
    difficulty: state.difficulty,
    speech: state.speech,
    calmCelebrations: state.calmCelebrations
  }, location.origin);
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function personalized(message) {
  if (!state.name) return message;
  return state.name + ", " + message.charAt(0).toLowerCase() + message.slice(1);
}

function speak(message) {
  if (!state.speech || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.9;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
  return true;
}

function sound(kind) {
  if (!state.sound) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = kind === "roar" ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(kind === "roar" ? 185 : 480, now);
    osc.frequency.exponentialRampToValueAtTime(kind === "roar" ? 76 : 710, now + (kind === "roar" ? 0.55 : 0.12));
    filter.type = "lowpass";
    filter.frequency.value = kind === "roar" ? 500 : 2200;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "roar" ? 0.09 : 0.045, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "roar" ? 0.62 : 0.19));
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + (kind === "roar" ? 0.65 : 0.21));
    osc.onended = function () { ctx.close(); };
  } catch (error) { /* Audio is an optional enhancement. */ }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(function () { toast.classList.remove("show"); }, 2100);
}

function updateSoundButton() {
  soundButton.textContent = state.sound ? "♫" : "♩";
  soundButton.setAttribute("aria-label", state.sound ? "Turn sounds off" : "Turn sounds on");
}

function heroDinoSvg() {
  const F = window.DUFX;
  if (!F || !F.dinoHTML) return '';
  return '<div class="adv-hero" aria-label="A friendly dinosaur in a sunny meadow with Daddy and Mummy waving">' +
    '<i class="ah-sun"></i><i class="ah-cloud c1"></i><i class="ah-cloud c2"></i>' +
    '<span class="ah-ptero">' + F.dinoHTML('ptero', { color: 'pink' }) + '</span>' +
    '<i class="ah-hill h1"></i><i class="ah-hill h2"></i>' +
    '<span class="ah-rex" data-pet>' + F.dinoHTML('trex', { state: 'idle' }) + '</span>' +
    '<span class="ah-tricera">' + F.dinoHTML('tricera', { state: 'walk' }) + '</span>' +
    '<span class="ah-mum">' + F.personHTML('mummy', { state: 'wave', size: .34 }) + '</span>' +
    '<span class="ah-dad">' + F.personHTML('daddy', { state: 'wave', size: .34 }) + '</span>' +
    '<i class="ah-fl" style="left:8%"></i><i class="ah-fl" style="left:44%;--d:-1s"></i><i class="ah-fl" style="left:92%;--d:-2s"></i></div>';
}

function levelOf(id) { return Math.max(1, Number(state.levels[id] || 1)); }
function challengeOf(id) {
  const base = levelOf(id);
  const offset = state.difficulty === "gentle" ? 0 : state.difficulty === "adventurer" ? 2 : 1;
  return Math.min(8, base + offset - 1);
}

function renderHome() {
  currentActivity = null;
  activeContext = null;
  app.innerHTML = '<section class="welcome">' +
    '<div class="welcome-copy">' +
      '<p class="eyebrow">Your next little adventure</p>' +
      '<h1>' + (state.name ? "Welcome back, " + escapeHtml(state.name) + "!" : "A whole world of dinosaurs") + '</h1>' +
      '<p>Build, colour, discover and play together. Every little adventure opens a new one.</p>' +
      '<div class="welcome-actions"><button class="primary-button" id="exploreButton">Choose an adventure <span aria-hidden="true">→</span></button>' +
      '<button class="soft-button" id="colorQuickButton">Open coloring studio 🎨</button></div>' +
    '</div><div class="welcome-art">' + heroDinoSvg() + '</div>' +
    '</section>' +
    '<section class="progress-panel" aria-label="Adventure progress">' +
      '<div class="progress-copy"><span class="progress-medal">🏅</span><span><strong>Your dino discoveries</strong><small>' + state.completed.length + ' activities tried · ' + state.stars + ' happy stars earned</small></span></div>' +
      '<button class="soft-button" id="albumButton" type="button">Sticker album 🌟 ' + getExtras().stickers.length + '/' + STICKERS.length + '</button>' +
      '<span class="progress-count">' + state.stars + ' ⭐</span></section>' +
    '<div class="section-heading" id="adventures"><h2>Pick a little adventure</h2><p>More levels, surprises and dinosaur friends are waiting as you play.</p></div>' +
    '<div class="filter-row" id="filterRow"></div><div class="activity-grid" id="activityGrid"></div>' +
    '<p class="footer-note">Made for curious little explorers · Grown-up settings are tucked safely away</p>';
  document.getElementById("exploreButton").addEventListener("click", function () { document.getElementById("adventures").scrollIntoView({ behavior: "smooth" }); });
  document.getElementById("colorQuickButton").addEventListener("click", function () { openActivity("coloring"); });
  document.getElementById("albumButton").addEventListener("click", function () { showDialog("Your sticker album", "Every round you finish and every butterfly you catch can win a new sticker.", albumHTML()); });
  renderFilters();
  renderActivityCards();
  if (window.DUFX && DUFX.dinoPets) { DUFX.dinoPets(app); DUFX.ambient('meadow'); }
}

function renderFilters() {
  const labels = ["All", "Puzzles", "Creative", "Discovery", "Cozy play", "Learning", "Adventures"];
  const row = document.getElementById("filterRow");
  row.innerHTML = labels.map(function (label) {
    return '<button class="filter-chip" aria-pressed="' + (activeFilter === label) + '" data-filter="' + escapeHtml(label) + '">' + escapeHtml(label) + '</button>';
  }).join("");
  row.querySelectorAll("[data-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter;
      renderFilters();
      renderActivityCards();
    });
  });
}

function renderActivityCards() {
  const grid = document.getElementById("activityGrid");
  const filtered = ACTIVITIES.filter(function (activity) {
    return activeFilter === "All" || activity.category === activeFilter;
  });
  grid.innerHTML = filtered.map(function (activity, index) {
    const level = levelOf(activity.id);
    return '<button class="activity-card" data-activity="' + activity.id + '" style="--card-bg:' + activity.tint + ';--icon-bg:rgba(255,255,255,.72);--card-orb:rgba(255,255,255,.42)">' +
      '<span class="card-top"><span class="activity-icon">' + activity.icon + '</span><span class="level-pill">LEVEL ' + level + '</span></span>' +
      '<h3>' + escapeHtml(activity.title) + '</h3><p>' + escapeHtml(activity.description) + '</p>' +
      '<span class="card-footer"><span>' + escapeHtml(activity.category) + '</span><span class="level-dots">' + "✦".repeat(Math.min(5, Math.ceil(level / 2))) + '</span></span></button>';
  }).join("");
  grid.querySelectorAll("[data-activity]").forEach(function (button) {
    button.addEventListener("click", function () { openActivity(button.dataset.activity); });
  });
}

function introMarkup() {
  return '<section class="intro-screen"><div class="intro-stars" aria-hidden="true">✦　·　✧　·　✦</div>' +
    '<div class="intro-scene"><div class="intro-sun"></div><div class="intro-hill hill-back"></div><div class="intro-hill hill-front"></div>' +
    '<div class="intro-trex" id="introTrex"><span class="intro-tail"></span><span class="intro-body"></span><span class="intro-neck"></span><span class="intro-head"></span><span class="intro-eye"></span><span class="intro-jaw"></span><span class="intro-arm"></span><span class="intro-leg one"></span><span class="intro-leg two"></span></div>' +
    '<div class="intro-leaf leaf-one">✿</div><div class="intro-leaf leaf-two">✦</div><div class="intro-roar" id="introRoar">ROAR!</div></div>' +
    '<p class="eyebrow">A tiny hello from the prehistoric world</p><h1>Ready for a dino-sized adventure?</h1>' +
    '<p class="intro-subtitle">Meet Rex, then explore your own Dinosaur Universe.</p>' +
    '<div class="welcome-actions intro-actions"><button class="primary-button" id="meetRex">Meet Rex 🦖</button><button class="soft-button" id="skipIntro">Skip welcome</button></div></section>';
}

function playIntro(replay) {
  app.innerHTML = introMarkup();
  document.getElementById("skipIntro").addEventListener("click", function () {
    state.seenIntro = true; saveState(); renderHome(); if (!state.nameAsked) askName();
  });
  document.getElementById("meetRex").addEventListener("click", function () {
    const trex = document.getElementById("introTrex");
    trex.classList.add("roaring");
    document.getElementById("introRoar").classList.add("show");
    sound("roar");
    speak("Roar! Welcome to Dinosaur Universe!");
    const button = document.getElementById("meetRex");
    button.textContent = "Let’s explore! ✨";
    button.onclick = function () {
      state.seenIntro = true; saveState(); renderHome(); if (!state.nameAsked) askName();
    };
  });
}

function showDialog(title, description, body, onReady) {
  dialogLayer.innerHTML = '<div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">' +
    '<button class="dialog-close" type="button" aria-label="Close">×</button><h2 id="dialogTitle">' + title + '</h2><p>' + description + '</p>' + body + '</div>';
  dialogLayer.querySelector(".dialog-close").addEventListener("click", closeDialog);
  dialogLayer.addEventListener("click", function outside(event) {
    if (event.target === dialogLayer) closeDialog();
    dialogLayer.removeEventListener("click", outside);
  });
  if (onReady) onReady(dialogLayer.querySelector(".dialog-card"));
}

function closeDialog() { dialogLayer.innerHTML = ""; }

function exitActivity() {
  if (EMBEDDED) window.parent.postMessage({ type: "du-back" }, location.origin);
  else renderHome();
}

function askName() {
  showDialog("What is your name?", "A dinosaur can use your name in its friendly instructions. This is optional and stays on this device.", '<form id="nameForm"><label class="form-label" for="playerName">Your name</label><input class="text-input" id="playerName" name="playerName" maxlength="24" autocomplete="given-name" placeholder="Your first name"><div class="dialog-actions"><button class="tiny-button" id="skipName" type="button">Maybe later</button><button class="primary-button" type="submit">Start playing</button></div></form>', function (card) {
    const input = card.querySelector("#playerName");
    input.focus();
    card.querySelector("#nameForm").addEventListener("submit", function (event) {
      event.preventDefault();
      state.name = input.value.trim().replace(/\s+/g, " ").slice(0, 24);
      state.nameAsked = true; saveState(); closeDialog(); renderHome();
    });
    card.querySelector("#skipName").addEventListener("click", function () {
      state.nameAsked = true; state.name = ""; saveState(); closeDialog();
    });
  });
}

function openParentGate() {
  const a = 3 + Math.floor(Math.random() * 6);
  const b = 2 + Math.floor(Math.random() * 5);
  showDialog("Grown-up corner", "Please solve this little sum to open the parent settings.", '<form id="gateForm"><label class="form-label" for="gateAnswer">' + a + ' + ' + b + ' = ?</label><input class="text-input" id="gateAnswer" inputmode="numeric" autocomplete="off"><p id="gateError" class="form-error" aria-live="polite"></p><div class="dialog-actions"><button class="primary-button" type="submit">Continue</button></div></form>', function (card) {
    const input = card.querySelector("#gateAnswer");
    input.focus();
    card.querySelector("#gateForm").addEventListener("submit", function (event) {
      event.preventDefault();
      if (Number(input.value) === a + b) { closeDialog(); openParentSettings(); }
      else { card.querySelector("#gateError").textContent = "That one was tricky. Have another go."; input.value = ""; input.focus(); }
    });
  });
}

function openParentSettings() {
  const difficulty = state.difficulty;
  showDialog("Parent settings", "Make the play experience feel just right. The name and progress are saved on this device.", '<form id="settingsForm">' +
    '<label class="form-label" for="settingsName">Child name</label><input class="text-input" id="settingsName" maxlength="24" value="' + escapeHtml(state.name) + '" placeholder="Optional">' +
    '<label class="form-label" for="difficulty">Starting challenge</label><select class="select-input" id="difficulty">' +
    '<option value="gentle"' + (difficulty === "gentle" ? " selected" : "") + '>Little Explorer</option><option value="curious"' + (difficulty === "curious" ? " selected" : "") + '>Curious Explorer</option><option value="adventurer"' + (difficulty === "adventurer" ? " selected" : "") + '>Dino Adventurer</option></select>' +
    '<label class="setting-check"><input id="speechSetting" type="checkbox"' + (state.speech ? " checked" : "") + '> Speak gentle instructions</label>' +
    '<label class="setting-check"><input id="calmSetting" type="checkbox"' + (state.calmCelebrations ? " checked" : "") + '> Use calmer celebrations</label>' +
    '<div class="settings-note">No timers or losing screens. New levels grow gradually as your child plays.</div>' +
    '<div class="dialog-actions"><button class="tiny-button" id="replayWelcome" type="button">Replay welcome</button><button class="primary-button" type="submit">Save settings</button></div></form>', function (card) {
    card.querySelector("#settingsForm").addEventListener("submit", function (event) {
      event.preventDefault();
      state.name = card.querySelector("#settingsName").value.trim().replace(/\s+/g, " ").slice(0, 24);
      state.difficulty = card.querySelector("#difficulty").value;
      state.speech = card.querySelector("#speechSetting").checked;
      state.calmCelebrations = card.querySelector("#calmSetting").checked;
      saveState(); notifyHubSettings(); closeDialog(); showToast("Settings saved for this device.");
    });
    card.querySelector("#replayWelcome").addEventListener("click", function () { closeDialog(); playIntro(true); });
  });
}

// The original short games now run as a journey of several rounds that grow harder, with a progress bar,
// a little celebration between rounds and one big reward at the end.
const ROUND_IDS = ["builder", "jigsaw", "fossil", "memory", "picnic", "hatchling", "trail", "shapes", "beat", "habitat", "discoveries", "care", "moonbeam", "parade", "constellations", "skymail", "weather"];
const AMBIENT = { constellations: "night", moonbeam: "night", fossil: "desert", weather: "rain", skymail: "wind", habitat: "meadow", picnic: "sun", hatchling: "sun", care: "sun" };
function roundsFor(level) { return Math.min(5, 3 + Math.floor((level - 1) / 2)); }

function openActivity(id) {
  const activity = ACTIVITIES.find(function (item) { return item.id === id; });
  if (!activity) return;
  currentActivity = id;
  const level = levelOf(id);
  app.innerHTML = '<div class="game-topline"><button class="back-button" id="backHome" aria-label="Back to adventures">←</button>' +
    '<div class="game-title-box"><h1>' + escapeHtml(activity.title) + '</h1><p>' + escapeHtml(personalized("Let’s see what we can discover!")) + '</p></div></div>' +
    '<div class="level-banner"><span>Adventure level <strong>' + level + '</strong></span><span>' + state.stars + ' stars collected ⭐</span></div>' +
    '<section class="game-stage" id="gameStage"></section>';
  document.getElementById("backHome").addEventListener("click", exitActivity);
  const context = {
    activity: activity,
    level: level,
    challenge: challengeOf(id),
    playerName: state.name,
    speechEnabled: state.speech,
    stage: document.getElementById("gameStage"),
    advance: finishLevel,
    message: personalized,
    sound: sound,
    speak: speak,
    notify: showToast
  };
  context.rate = function (n) { finishInfo.stars = Math.max(1, Math.min(3, Number(n) || 3)); };
  finishInfo = { stars: 3, ratings: [], sticker: null };
  activeContext = context; context.stage._ctx = context;
  const moduleMount = getModule(id);
  if (window.DUFX && DUFX.ambient) DUFX.ambient(AMBIENT[id] || "meadow");
  if (moduleMount && ROUND_IDS.indexOf(id) >= 0) runRounds(context, moduleMount, level);
  else if (moduleMount) moduleMount(context);
}

let finishInfo = { stars: 3, ratings: [], sticker: null };

function runRounds(context, mount, baseLevel) {
  const total = roundsFor(baseLevel);
  let round = 1, busy = false, pending = 0;
  const ratings = [];
  const banner = document.querySelector(".level-banner");
  const bar = document.createElement("div");
  bar.className = "round-bar"; bar.id = "roundBar";
  banner.insertAdjacentElement("afterend", bar);
  function paint() {
    let dots = "";
    for (let i = 1; i <= total; i++) dots += '<i class="rb-dot' + (i < round ? " done" : i === round ? " now" : "") + '">' + (i < round ? "⭐" : i === total ? "🏆" : i) + "</i>";
    bar.innerHTML = '<span class="rb-label">Round ' + round + " of " + total + "</span>" + dots;
  }
  paint();
  const finalAdvance = context.advance;
  context.rate = function (n) { pending = Math.max(1, Math.min(3, Number(n) || 3)); };
  context.advance = function (message) {
    if (busy) return;
    const got = pending || 3; pending = 0;
    ratings.push(got);
    if (round >= total) {
      bar.classList.add("all-done");
      finishInfo.ratings = ratings.slice();
      finishInfo.stars = Math.max(1, Math.round(ratings.reduce(function (a, b) { return a + b; }, 0) / ratings.length));
      finalAdvance(message); return;
    }
    busy = true;
    const F = window.DUFX;
    const sticker = awardSticker();
    if (F) { F.sfx.win(); const r = context.stage.getBoundingClientRect(); F.burst(r.left + r.width / 2, r.top + r.height / 3, { kind: state.calmCelebrations ? "sparkle" : "confetti", n: 30 }); F.burst(r.left + r.width / 2, r.top + r.height / 3, { kind: "stars", n: 22 }); F.floatText && F.floatText(r.left + r.width / 2, r.top + r.height / 2, "Round " + round + " done! ⭐"); }
    const done = round;
    round += 1; paint();
    const words = ["Super", "Brilliant", "Fantastic", "Dino-mite", "Roarsome"];
    const species = ["trex", "tricera", "stego", "bronto", "raptor"];
    context.stage.innerHTML = '<div class="round-interlude"><div class="ri-dino">' + (F && F.dinoHTML ? F.dinoHTML(species[round % 5], { state: "happy" }) : "🦖") + '</div>' +
      '<h2>' + words[round % 5] + '! Round ' + done + ' complete.</h2>' +
      '<div class="ri-stars" aria-label="' + got + ' stars">' + [1, 2, 3].map(function (n) { return '<i style="--i:' + n + '" class="' + (n <= got ? "" : "off") + '">' + (n <= got ? "⭐" : "☆") + "</i>"; }).join("") + '</div>' +
      (sticker ? '<div class="ri-sticker">New sticker <span>' + sticker + '</span></div>' : "") +
      '<p>Get ready for round ' + round + ' of ' + total + '…</p><button class="soft-button ri-skip" type="button">Go! →</button></div>';
    let gone = false;
    function go() {
      if (gone) return; gone = true;
      if (!document.contains(context.stage) || !context.stage.querySelector(".round-interlude")) return;
      context.stage.innerHTML = "";
      context.level = baseLevel + round - 1;
      busy = false;
      mount(context);
    }
    const skip = context.stage.querySelector(".ri-skip");
    if (skip) skip.addEventListener("click", go);
    window.setTimeout(go, 3200);
  };
  mount(context);
}

function finishLevel(message) {
  const id = currentActivity;
  if (!id) return;
  state.levels[id] = levelOf(id) + 1;
  state.stars += 1;
  if (!state.completed.includes(id)) state.completed.push(id);
  saveState();
  const dino = DINOSAURS[(state.stars - 1) % DINOSAURS.length];
  speak(personalized("You did it! A new dinosaur friend is cheering for you."));
  if (state.sound) sound("good");
  finishInfo.sticker = awardSticker();
  celebrate(dino, message, id);
  finishInfo = { stars: 3, ratings: [], sticker: null };
}

function celebrate(dino, message, id) {
  const old = document.querySelector(".celebration");
  if (old) old.remove();
  const layer = document.createElement("div");
  layer.className = "celebration";
  if (state.calmCelebrations) layer.classList.add("calm");
  layer.innerHTML = '<div class="celebration-dino" aria-hidden="true">' + dino.icon + '</div><div class="celebration-card" role="dialog" aria-modal="true">' +
    '<div class="big-prize" aria-hidden="true">' + [1, 2, 3].map(function (n) { return '<i class="cs-star' + (n <= finishInfo.stars ? "" : " off") + '" style="--i:' + n + '">' + (n <= finishInfo.stars ? "⭐" : "☆") + "</i>"; }).join("") + '</div><h2>' + escapeHtml(personalized(finishInfo.stars === 3 ? "Perfect, wonderful work!" : "Wonderful work!")) + '</h2>' +
    '<p>' + escapeHtml(personalized(message || dino.name + " " + dino.cheer + "!")) + '</p>' +
    '<span class="reward-badge">' + dino.icon + ' New friend: ' + escapeHtml(dino.name) + ' · Level ' + levelOf(id) + '</span>' +
    (finishInfo.sticker ? '<span class="reward-badge cs-sticker">New sticker: ' + finishInfo.sticker + '</span>' : "") +
    '<div class="win-actions"><button class="primary-button" id="nextLevelButton">Play next level →</button><button class="soft-button" id="chooseGameButton">Choose another game</button></div>' +
    '<p class="balloon-hint">Tap a balloon to pop it!</p></div>';
  const palette = ["#ef806f", "#ffd166", "#6ec7a0", "#8ab8ed", "#bd91d5", "#f3a75e"];
  for (let i = 0; i < 11; i++) {
    const balloon = document.createElement("button");
    balloon.className = "balloon";
    balloon.setAttribute("aria-label", "Pop a balloon");
    balloon.style.left = (4 + Math.random() * 92) + "%";
    balloon.style.setProperty("--balloon", palette[i % palette.length]);
    balloon.style.setProperty("--duration", (2.4 + Math.random() * 2.5) + "s");
    balloon.style.animationDelay = (Math.random() * 1.3) + "s";
    balloon.addEventListener("click", function () {
      balloon.classList.add("popped"); sound("pop");
      window.setTimeout(function () { balloon.remove(); }, 260);
    });
    layer.appendChild(balloon);
  }
  document.body.appendChild(layer);
  layer.querySelector("#nextLevelButton").addEventListener("click", function () { layer.remove(); openActivity(id); });
  layer.querySelector("#chooseGameButton").addEventListener("click", function () { layer.remove(); exitActivity(); });
  if (state.calmCelebrations) {
    layer.querySelectorAll(".balloon").forEach(function (balloon) { balloon.remove(); });
    layer.querySelector(".balloon-hint").textContent = "A new star is waiting in your collection.";
  }
}

function stageTitle(context, emoji, title, instruction) {
  return '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">' + emoji + '</span><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(context.message(instruction)) + '</p></div>';
}

function shuffle(list) {
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function svgForPage(index) {
  const page = COLOR_PAGES[index];
  const colors = state.colorWork[index] || {};
  const fill = function (id, base) { return escapeHtml(colors[id] || base); };
  const region = function (id, base, shape, extra) {
    return '<' + shape + ' fill="' + fill(id, base) + '" data-region="' + id + '" ' + (extra || "") + '/>';
  };
  const kinds = [
    {
      body: region("body", "#a8d9a7", "path", 'd="M98 170c0-44 34-73 80-73h67c37 0 61 19 61 43 0 18-12 31-34 35l-18 4v46h-22v-38h-25v38h-23v-38h-36c-30 0-50-8-50-17Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      tail: region("tail", "#a8d9a7", "path", 'd="m101 169-53-25 9 23 45 20Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b6e1ab", "ellipse", 'cx="280" cy="132" rx="46" ry="35" stroke="#235e51" stroke-width="4"'),
      plates: region("plates", "#ef9270", "path", 'd="m214 105 15-29 17 31m9-1 18-38 19 41m10-2 18-29 12 34Z" stroke="#235e51" stroke-width="3" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "path", 'd="M248 175q24 14 52 0v28q-26 9-52 0Z" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M166 208v34m61-34v34" fill="none" stroke="' + fill("legs", "#4d9b70") + '" stroke-width="17" stroke-linecap="round"/><path d="M155 242h25m38 0h24" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="294" cy="124" r="5" fill="#173f3d"/><circle cx="296" cy="122" r="1.8" fill="#fff"/><path d="M310 145q-13 9-24-1" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/><path d="m160 127 8 3m18-18 8 3m18 37 8 3" stroke="#fff8e2" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#9ccf98", "ellipse", 'cx="205" cy="165" rx="93" ry="48" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#9ccf98", "path", 'd="M116 165Q78 151 42 129q14 38 74 57Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b3dca8", "ellipse", 'cx="306" cy="145" rx="34" ry="24" stroke="#235e51" stroke-width="4"'),
      plates: region("plates", "#e98968", "path", 'm133 131 13-30 19 29m6-2 15-39 21 39m5 0 16-42 22 42m5 0 17-34 20 37" stroke="#235e51" stroke-width="3" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="207" cy="176" rx="47" ry="25" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M154 195v45m93-45v45" fill="none" stroke="' + fill("legs", "#4d9b70") + '" stroke-width="18" stroke-linecap="round"/><path d="M141 241h26m67 0h27" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="316" cy="140" r="4.5" fill="#173f3d"/><circle cx="318" cy="138" r="1.7" fill="#fff"/><path d="M332 153q-11 7-22 1" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/><path d="m98 166-12-7m29 8-12-7" stroke="#fff8e2" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#92c996", "ellipse", 'cx="180" cy="184" rx="78" ry="46" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#92c996", "path", 'd="M111 184Q72 172 41 151q12 36 73 50Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b5dda7", "ellipse", 'cx="292" cy="57" rx="37" ry="25" stroke="#235e51" stroke-width="4"'),
      plates: region("plates", "#e98968", "path", 'M222 159Q252 126 261 83l-5-16q24-18 49-8 8 10-2 18-17 4-19 19-5 46-28 91Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="181" cy="193" rx="42" ry="23" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M139 215v25m70-25v25" fill="none" stroke="' + fill("legs", "#4d9b70") + '" stroke-width="18" stroke-linecap="round"/><path d="M126 241h27m69 0h23" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="304" cy="51" r="4.5" fill="#173f3d"/><circle cx="306" cy="49" r="1.7" fill="#fff"/><path d="M325 67q-12 8-24 1" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/><path d="M274 43q18-19 36-9" fill="none" stroke="#235e51" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#9bd09b", "ellipse", 'cx="187" cy="173" rx="88" ry="45" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#9bd09b", "path", 'd="M109 173Q72 161 42 143q10 32 71 47Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b4dfa9", "ellipse", 'cx="287" cy="142" rx="42" ry="34" stroke="#235e51" stroke-width="4"'),
      plates: region("plates", "#f1c873", "path", 'M250 126q16-18 31-11l-6 28 8 27q-21 5-36-10Z" stroke="#235e51" stroke-width="3" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="188" cy="184" rx="46" ry="23" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M140 205v36m87-36v36" fill="none" stroke="' + fill("legs", "#4d9b70") + '" stroke-width="18" stroke-linecap="round"/><path d="M127 241h27m86 0h24" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="302" cy="134" r="4.5" fill="#173f3d"/><circle cx="304" cy="132" r="1.7" fill="#fff"/><path d="m284 117 5-24 9 23m7-4 18-16-4 27" fill="none" stroke="' + fill("horns", "#f5e7be") + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" data-region="horns"/><path d="M322 153q-13 8-25-1" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#9bd19c", "path", 'd="M91 174q18-54 81-58l71 18q28 12 21 43l-40 17h-83q-45 0-50-20Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      tail: region("tail", "#9bd19c", "path", 'd="M99 169Q59 157 30 133q12 37 71 53Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b8dfa9", "ellipse", 'cx="279" cy="125" rx="34" ry="25" stroke="#235e51" stroke-width="4"'),
      plates: region("plates", "#eca477", "path", 'd="M233 137q20-19 43-15l-5 18 15 10q-18 13-42 10Z" stroke="#235e51" stroke-width="3" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="176" cy="179" rx="44" ry="20" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M144 186v49m64-48v48" fill="none" stroke="' + fill("legs", "#4d9b70") + '" stroke-width="13" stroke-linecap="round"/><path d="M130 236h29m40 0h26" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="290" cy="119" r="4.5" fill="#173f3d"/><circle cx="292" cy="117" r="1.7" fill="#fff"/><path d="M306 135q-12 8-22 1m-88-27 17-7m18 14 17-5" fill="none" stroke="#235e51" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#9bd19c", "ellipse", 'cx="203" cy="174" rx="54" ry="31" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#9bd19c", "path", 'd="M159 174Q105 170 45 123q25 54 111 67Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b7e0aa", "path", 'd="M238 157Q273 132 302 87l27 1-18 16 24 1q-18 19-39 21-15 29-43 44Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      plates: region("plates", "#eca477", "path", 'd="M174 151Q120 83 73 80q24 36 42 70 30 1 59 17Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="204" cy="182" rx="28" ry="16" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M185 198v30m42-31v31" fill="none" stroke="' + fill("legs", "#4d9b70") + '" stroke-width="13" stroke-linecap="round"/><path d="M174 230h23m20 0h21" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="297" cy="96" r="4.5" fill="#173f3d"/><circle cx="299" cy="94" r="1.7" fill="#fff"/><path d="M98 100q25 8 41 32m-28-37q20 4 33 22m-35 3 18 19" fill="none" stroke="#fff8e2" stroke-width="4" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#9bcf99", "path", 'd="M103 169q10-48 66-51h91q43 1 54 37l-9 34q-18 20-61 19h-91q-48-1-50-39Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      tail: region("tail", "#9bcf99", "path", 'd="M108 164 61 144 43 151l13 15-15 12 22 10 46-1Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b7dfa9", "path", 'd="M285 151q14-28 42-18l17 15-13 22-38 5Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      plates: region("plates", "#e4b875", "path", 'd="m129 135 13-15 15 7-2 17-17 4Zm34-11 14-12 15 10-3 17-16 2Zm33-3 13-12 16 11-2 16-17 1Zm33 1 13-10 14 12-4 16-16-1Z" stroke="#235e51" stroke-width="3" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="210" cy="184" rx="46" ry="18" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M145 197v39m91-39v39" fill="none" stroke="' + fill("legs", "#57976d") + '" stroke-width="17" stroke-linecap="round"/><path d="M133 237h24m67 0h24" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="324" cy="146" r="4.5" fill="#173f3d"/><circle cx="326" cy="144" r="1.6" fill="#fff"/><path d="m45 163 9 3m-11 8 9 2" stroke="#fff8e2" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#96cf9d", "ellipse", 'cx="187" cy="175" rx="83" ry="43" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#96cf9d", "path", 'd="M109 171Q72 156 38 133q15 41 72 54Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b4dfa9", "path", 'd="M255 133q23-22 60-14l35 13-14 20-52 5Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      plates: region("crest", "#e7a676", "path", 'M276 122q-5-24-31-38l-35-25q-17-12-37-3l29 21q-11 6-2 15l36 26 30 13Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="189" cy="185" rx="44" ry="21" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M143 204v34m82-34v34" fill="none" stroke="' + fill("legs", "#57976d") + '" stroke-width="17" stroke-linecap="round"/><path d="M131 239h24m61 0h22" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="323" cy="130" r="4.5" fill="#173f3d"/><circle cx="325" cy="128" r="1.6" fill="#fff"/><path d="M339 147q-10 7-22 2" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#91c895", "ellipse", 'cx="181" cy="179" rx="83" ry="43" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#91c895", "path", 'd="M107 174Q62 160 28 139q18 37 82 50Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b1dba8", "path", 'd="M259 143q25-20 64-15l42 8-11 16-65 6Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      plates: region("sail", "#e58b70", "path", 'M129 146q4-53 31-76 16 23 31 6 13-22 28-3 16-20 28 3 13 21 22 76Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="183" cy="190" rx="44" ry="20" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M139 207v31m88-31v31" fill="none" stroke="' + fill("legs", "#57976d") + '" stroke-width="17" stroke-linecap="round"/><path d="M127 239h24m66 0h22" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="342" cy="137" r="4.5" fill="#173f3d"/><circle cx="344" cy="135" r="1.6" fill="#fff"/><path d="M354 150q-12 7-22 2" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#91c993", "ellipse", 'cx="171" cy="181" rx="73" ry="40" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#91c993", "path", 'd="M106 177Q69 164 28 137q18 42 78 55Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b3dda9", "ellipse", 'cx="297" cy="82" rx="25" ry="19" stroke="#235e51" stroke-width="4"'),
      plates: region("neck", "#a9d79f", "path", 'M229 166Q246 128 268 94l18 3-6 11 22-6q-13 18-32 19-12 31-27 59Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="172" cy="191" rx="40" ry="19" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M133 205v32m75-32v32" fill="none" stroke="' + fill("legs", "#57976d") + '" stroke-width="17" stroke-linecap="round"/><path d="M121 238h24m55 0h22" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="304" cy="78" r="4.5" fill="#173f3d"/><circle cx="306" cy="76" r="1.6" fill="#fff"/><path d="M315 91q-9 6-18 2" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/><path d="m281 104 5-16 6 14m6-1 11-12-2 16" fill="none" stroke="' + fill("spines", "#f3d58e") + '" stroke-width="5" stroke-linecap="round" data-region="spines"/>'
    },
    {
      body: region("body", "#96cb98", "ellipse", 'cx="190" cy="177" rx="77" ry="43" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#96cb98", "path", 'd="M118 168Q70 153 27 125q17 45 94 62Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b4dfa9", "path", 'd="M265 143q21-20 52-14l31 13-13 19-48 1Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      plates: region("horns", "#e7b27b", "path", 'M286 134q-5-16-3-31l-9-13q18-1 21 13l3 26m18 3q7-17 18-24l15-2q-9 18-24 29Z" stroke="#235e51" stroke-width="3" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="190" cy="188" rx="42" ry="19" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M145 205v33m84-33v33" fill="none" stroke="' + fill("legs", "#57976d") + '" stroke-width="16" stroke-linecap="round"/><path d="M133 239h23m62 0h23" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="321" cy="143" r="4.5" fill="#173f3d"/><circle cx="323" cy="141" r="1.6" fill="#fff"/><path d="M336 158q-10 6-20 1" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      body: region("body", "#9bcf99", "ellipse", 'cx="193" cy="174" rx="78" ry="44" stroke="#235e51" stroke-width="4"'),
      tail: region("tail", "#9bcf99", "path", 'd="M123 166Q78 153 34 124q18 44 93 63Z" stroke="#235e51" stroke-width="4" stroke-linejoin="round"'),
      head: region("head", "#b6dfa9", "ellipse", 'cx="298" cy="125" rx="30" ry="25" stroke="#235e51" stroke-width="4"'),
      plates: region("claws", "#f2cf8a", "path", 'M232 151q31-24 55-14l13 9-11 12-24-6-17 18Zm45-5q23-16 40-5l10 9-10 11-22-5-15 12Z" stroke="#235e51" stroke-width="3" stroke-linejoin="round"'),
      belly: region("belly", "#ffe8ad", "ellipse", 'cx="191" cy="185" rx="43" ry="20" stroke="#235e51" stroke-width="3"'),
      legs: '<path d="M148 205v34m82-34v34" fill="none" stroke="' + fill("legs", "#57976d") + '" stroke-width="17" stroke-linecap="round"/><path d="M136 240h24m60 0h24" fill="none" stroke="#235e51" stroke-width="4" stroke-linecap="round"/>',
      detail: '<circle cx="307" cy="120" r="4.5" fill="#173f3d"/><circle cx="309" cy="118" r="1.6" fill="#fff"/><path d="M321 139q-10 6-20 1" fill="none" stroke="#173f3d" stroke-width="3" stroke-linecap="round"/><path d="M259 143q21-22 44-11m-38 12-14-14m22 10-10-18m37 14 10-13m-2 15 15-11" fill="none" stroke="' + fill("claws", "#f2cf8a") + '" stroke-width="5" stroke-linecap="round" data-region="claws"/>'
    }
  ];
  const dino = kinds[index % kinds.length];
  return '<svg class="color-art" viewBox="0 0 420 300" role="img" aria-label="' + escapeHtml(page.dino + " in the " + page.name) + '">' +
    '<rect x="3" y="3" width="414" height="294" rx="30" fill="' + page.scene + '"/>' +
    '<circle cx="345" cy="55" r="27" fill="' + fill("sun", "#ffd36d") + '" data-region="sun"/>' +
    '<path d="M0 228q65-52 125-6t125-3 170 1v80H0Z" fill="' + fill("hill", "#b8d89d") + '" data-region="hill"/>' +
    coloringSceneDetails(index, fill) +
    '<path d="M57 212c4-21 11-35 20-44m-11 27q-24-2-27-18m37 7q20-9 20-24" fill="none" stroke="' + fill("plant", "#5d9c72") + '" stroke-width="8" stroke-linecap="round" data-region="plant"/>' +
    dino.tail + dino.body + dino.plates + dino.head + dino.belly + dino.legs + dino.detail +
    '<path d="M350 222q11-23 22 0m-318 4q10-20 20 0" fill="none" stroke="#fffdf4" stroke-width="6" stroke-linecap="round"/>' +
    (colors.__st || []).map(function (st) { return '<text x="' + st.x + '" y="' + st.y + '" font-size="30" text-anchor="middle" class="cw-sticker">' + st.e + '</text>'; }).join("") +
    '</svg>';
}

function coloringSceneDetails(index, fill) {
  const scenes = [
    '<path d="M359 227q-5-25 5-46m-4 20q-22-2-25-18m27 7q18-9 18-23m-21 54q18-3 25-17" fill="none" stroke="' + fill("fern", "#5d9c72") + '" stroke-width="6" stroke-linecap="round" data-region="fern"/>',
    '<path d="M17 92q29-22 55 0m-49 0q20-15 40 0m293-36q25-18 48 0" fill="none" stroke="' + fill("cloud", "#fffaf0") + '" stroke-width="8" stroke-linecap="round" data-region="cloud"/>',
    '<path d="M38 154a50 50 0 0 1 100 0m-83 0a33 33 0 0 1 66 0m-49 0a16 16 0 0 1 32 0" fill="none" stroke="' + fill("rainbow", "#e68180") + '" stroke-width="7" stroke-linecap="round" data-region="rainbow"/>',
    '<path d="m30 228 42-76 42 76Z" fill="' + fill("volcano", "#c78370") + '" stroke="#8b665c" stroke-width="3" stroke-linejoin="round" data-region="volcano"/><path d="M63 169q9 7 18 0" fill="none" stroke="' + fill("lava", "#f3a06f") + '" stroke-width="6" stroke-linecap="round" data-region="lava"/>',
    '<circle cx="52" cy="58" r="4" fill="' + fill("star", "#f4cb73") + '" data-region="star"/><circle cx="104" cy="91" r="5" fill="' + fill("star", "#f4cb73") + '" data-region="star"/><circle cx="382" cy="116" r="4" fill="' + fill("star", "#f4cb73") + '" data-region="star"/>',
    '<path d="M20 230q45-27 88 0m-90 10q42-20 82 0" fill="none" stroke="' + fill("shore", "#78b8bd") + '" stroke-width="6" stroke-linecap="round" data-region="shore"/><path d="M70 213v-20m0 10q-15-12-24-2m24-1q14-14 24-4" fill="none" stroke="' + fill("palm", "#629b70") + '" stroke-width="5" stroke-linecap="round" data-region="palm"/><circle cx="89" cy="183" r="7" fill="' + fill("petal", "#e8879a") + '" data-region="petal"/><circle cx="89" cy="183" r="3" fill="#f4c45e"/>',
    '<path d="M21 92q0-18 18-18 5-18 24-10 16-14 26 3 18-3 18 14 0 13-18 13H39q-18 0-18-12Zm257-22q0-16 16-16 5-16 21-9 14-12 23 3 17-2 17 13 0 12-16 12h-44q-17 0-17-11Z" fill="' + fill("cloud", "#fffaf0") + '" data-region="cloud"/>',
    '<path d="M21 225q11-34 34-23 14-27 39-11 17-24 33 2 28-4 30 32Z" fill="' + fill("bush", "#6da879") + '" data-region="bush"/><circle cx="53" cy="201" r="5" fill="' + fill("berry", "#d77a86") + '" data-region="berry"/><circle cx="103" cy="207" r="5" fill="' + fill("berry", "#d77a86") + '" data-region="berry"/>',
    '<path d="M9 232q35-15 70 0t70 0 70 0 70 0 120 0" fill="none" stroke="' + fill("water", "#74b9c3") + '" stroke-width="8" stroke-linecap="round" data-region="water"/><path d="M54 220q18-15 36 0-18 8-36 0Zm271 2q16-13 32 0-16 8-32 0Z" fill="' + fill("lily", "#6fae83") + '" data-region="lily"/>',
    '<path d="M14 226q26-35 52-1m12 4q25-47 54-3m205 4q25-38 50-2" fill="none" stroke="' + fill("grass", "#759b62") + '" stroke-width="6" stroke-linecap="round" data-region="grass"/>',
    '<path d="m18 228 42-70 47 70Zm266 0 38-89 50 89Z" fill="' + fill("mountain", "#9db8be") + '" stroke="#78949b" stroke-width="3" stroke-linejoin="round" data-region="mountain"/><path d="m44 185 16-27 18 27m253-13 9-33 20 33" fill="none" stroke="' + fill("snow", "#fffdf4") + '" stroke-width="7" stroke-linejoin="round" data-region="snow"/>',
    '<path d="M26 72q44 34 88 0m-74 11v21m24-8v24m24-25v22" fill="none" stroke="' + fill("string", "#a783bb") + '" stroke-width="3" data-region="string"/><path d="m39 85 15 0-7 20Zm24 5 15 0-7 20Zm24-5 15 0-7 20Z" fill="' + fill("flag", "#ed9878") + '" data-region="flag"/>'
  ];
  return scenes[index % scenes.length];
}

function mountColoring(context) {
  let pageIndex = 0;
  let undo = [];
  let stamp = null, magicIdx = 0, lastRegion = null;
  const celebrated = new Set();
  const RAINBOW = ["#ef795f", "#f5b64e", "#f7d76d", "#6fb881", "#65abd2", "#9182c7", "#d6789a"];
  const STICKERS = ["🦋", "⭐", "🌸", "🦴", "🌈", "🥚", "☀️", "💎", "🐞", "🎈"];
  function pageLimit() { return Math.min(COLOR_PAGES.length, 4 + Math.floor(state.stars / 2)); }
  function draw() {
    const unlocked = pageLimit();
    context.stage.innerHTML = stageTitle(context, "🎨", "Coloring studio", "Choose a picture, pick a colour and tap a part to paint it.") +
      '<div class="page-strip" id="pageStrip" aria-label="Coloring pages"></div>' +
      '<div class="color-layout"><div class="color-art-wrap" id="colorArtWrap">' + svgForPage(pageIndex) + '</div>' +
      '<aside class="palette-panel"><h3>Choose a colour</h3><div class="palette" id="palette"></div><p class="gentle-hint">Your picture saves on this device.</p></aside></div>' +
      '<div class="stage-controls"><button class="tiny-button" id="undoColor">Undo colour</button><button class="tiny-button secondary" id="clearColor">Start this page again</button><button class="soft-button" id="saveColor">Save picture</button><button class="soft-button" id="printColor">Print picture</button><button class="soft-button" id="galleryButton">My pictures</button></div>';
    const strip = context.stage.querySelector("#pageStrip");
    strip.innerHTML = COLOR_PAGES.slice(0, unlocked).map(function (page, index) {
      return '<button class="page-choice" aria-pressed="' + (index === pageIndex) + '" data-page="' + index + '" title="' + escapeHtml(page.name) + '">' + page.icon + '</button>';
    }).join("");
    strip.querySelectorAll("[data-page]").forEach(function (button) {
      button.addEventListener("click", function () { pageIndex = Number(button.dataset.page); undo = []; draw(); });
    });
    const colors = ["#ef795f", "#f5b64e", "#f7d76d", "#6fb881", "#65abd2", "#9182c7", "#d6789a", "#a77d5b", "#fffdf4", "#476268", "#bce4d1", "#f3b7a4"];
    const palette = context.stage.querySelector("#palette");
    palette.innerHTML = colors.map(function (color, index) {
      return '<button class="color-swatch' + (activeColor === color ? " selected" : "") + '" style="background:' + color + '" data-color="' + color + '" aria-label="Colour ' + (index + 1) + '" aria-pressed="' + (activeColor === color) + '"></button>';
    }).join("");
    palette.insertAdjacentHTML("beforeend", '<button class="color-swatch magic' + (activeColor === "magic" ? " selected" : "") + '" data-color="magic" aria-label="Rainbow magic paint" aria-pressed="' + (activeColor === "magic") + '">🌈</button>');
    palette.insertAdjacentHTML("afterend", '<h3 class="sticker-h">Stickers</h3><div class="sticker-row" id="stickerRow">' + STICKERS.map(function (e) { return '<button class="sticker-pick' + (stamp === e ? " selected" : "") + '" data-sticker="' + e + '" aria-label="Sticker ' + e + '" aria-pressed="' + (stamp === e) + '">' + e + '</button>'; }).join("") + '</div>');
    palette.querySelectorAll("[data-color]").forEach(function (button) {
      button.addEventListener("click", function () { activeColor = button.dataset.color; stamp = null; if (window.DUFX && DUFX.sfx) DUFX.sfx.pop(); draw(); });
    });
    context.stage.querySelectorAll("[data-sticker]").forEach(function (button) {
      button.addEventListener("click", function () { stamp = stamp === button.dataset.sticker ? null : button.dataset.sticker; if (window.DUFX && DUFX.sfx) DUFX.sfx.tap(); draw(); });
    });
    const artWrap = context.stage.querySelector("#colorArtWrap");
    artWrap.classList.toggle("stamping", !!stamp);
    artWrap.addEventListener("click", function (event) {
      if (!stamp) return;
      event.stopPropagation();
      const svg = artWrap.querySelector("svg"), box = svg.getBoundingClientRect();
      const x = Math.round((event.clientX - box.left) / box.width * 420), y = Math.round((event.clientY - box.top) / box.height * 300) + 10;
      if (!state.colorWork[pageIndex]) state.colorWork[pageIndex] = {};
      (state.colorWork[pageIndex].__st = state.colorWork[pageIndex].__st || []).push({ e: stamp, x: x, y: y });
      undo.push({ sticker: true });
      saveState();
      if (window.DUFX) { DUFX.sfx.pop(); DUFX.burst(event.clientX, event.clientY, { kind: "sparkle", n: 10 }); DUFX.floatText && DUFX.floatText(event.clientX, event.clientY - 10, "Nice!"); }
      draw();
    }, true);
    context.stage.querySelectorAll("[data-region]").forEach(function (part) {
      part.addEventListener("click", function (event) {
        const old = (state.colorWork[pageIndex] || {})[part.dataset.region] || "";
        undo.push({ region: part.dataset.region, value: old });
        if (!state.colorWork[pageIndex]) state.colorWork[pageIndex] = {};
        const paint = activeColor === "magic" ? RAINBOW[magicIdx++ % RAINBOW.length] : activeColor;
        state.colorWork[pageIndex][part.dataset.region] = paint;
        lastRegion = part.dataset.region;
        saveState();
        if (window.DUFX) { DUFX.sfx.pop(); DUFX.burst(event.clientX, event.clientY, { kind: activeColor === "magic" ? "confetti" : "sparkle", n: activeColor === "magic" ? 12 : 8 }); }
        else context.sound("tap");
        draw();
        checkComplete();
      });
    });
    context.stage.querySelector("#undoColor").addEventListener("click", function () {
      const last = undo.pop();
      if (!last) { context.notify("Choose a coloured part first."); return; }
      if (last.sticker) { (state.colorWork[pageIndex].__st || []).pop(); saveState(); draw(); return; }
      if (!last.value) delete state.colorWork[pageIndex][last.region];
      else state.colorWork[pageIndex][last.region] = last.value;
      saveState(); draw();
    });
    context.stage.querySelector("#clearColor").addEventListener("click", function () {
      state.colorWork[pageIndex] = {}; undo = []; saveState(); draw();
    });
    context.stage.querySelector("#galleryButton").addEventListener("click", showGallery);
    context.stage.querySelector("#saveColor").addEventListener("click", savePicture);
    context.stage.querySelector("#printColor").addEventListener("click", printPicture);
    if (lastRegion) {
      context.stage.querySelectorAll('#colorArtWrap [data-region="' + lastRegion + '"]').forEach(function (part) { part.classList.add("cw-flash"); });
      lastRegion = null;
    }
  }
  function checkComplete() {
    const names = new Set(Array.prototype.map.call(context.stage.querySelectorAll("#colorArtWrap [data-region]"), function (e) { return e.dataset.region; }));
    const done = Object.keys(state.colorWork[pageIndex] || {}).filter(function (k) { return names.has(k); }).length;
    if (done < names.size || celebrated.has(pageIndex)) return;
    celebrated.add(pageIndex);
    const page = COLOR_PAGES[pageIndex];
    if (window.DUFX) { DUFX.celebrate(); DUFX.sfx.win(); }
    context.notify("Every part is painted! A beautiful " + page.name + " picture!");
    window.setTimeout(function () { if (document.contains(context.stage) && currentActivity === "coloring") context.advance("You finished a beautiful " + page.name + " picture!"); }, 2600);
  }
  function savePicture() {
    const artwork = context.stage.querySelector("#colorArtWrap svg");
    if (!artwork) return;
    const blob = new Blob([new XMLSerializer().serializeToString(artwork)], { type: "image/svg+xml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = COLOR_PAGES[pageIndex].name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    link.href = href;
    link.download = "dinosaur-universe-" + fileName + ".svg";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(href); }, 1200);
    context.notify("Your picture is saved as a crisp, printable SVG file.");
  }
  function printPicture() {
    const artwork = context.stage.querySelector("#colorArtWrap svg");
    if (!artwork) return;
    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) { context.notify("Allow the print page to open, then try again."); return; }
    const page = COLOR_PAGES[pageIndex];
    const image = printWindow.document.createElement("img");
    image.alt = page.dino + " colouring page";
    image.style.cssText = "display:block;width:min(100%,1100px);height:auto;margin:4vh auto;";
    image.onload = function () { printWindow.focus(); printWindow.print(); };
    printWindow.document.title = "Dinosaur Universe — " + page.name;
    printWindow.document.body.style.cssText = "margin:0;background:white;";
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(artwork));
    printWindow.document.body.appendChild(image);
  }
  function showGallery() {
    const saved = Object.keys(state.colorWork).filter(function (key) { return Object.keys(state.colorWork[key] || {}).length > 0; });
    const gallery = document.createElement("div");
    gallery.className = "gallery-overlay";
    gallery.innerHTML = '<div class="gallery-card-panel"><button class="dialog-close" id="closeGallery" aria-label="Close gallery">×</button><h2>My pictures</h2><p>Your colourful creations stay right here on this device.</p>' +
      (saved.length ? '<div class="gallery-grid">' + saved.map(function (key) {
        return '<button class="gallery-card" data-gallery-page="' + key + '">' + svgForPage(Number(key)) + '<small>' + escapeHtml(COLOR_PAGES[Number(key)].name) + '</small></button>';
      }).join("") + '</div>' : '<div class="empty-note">Your gallery is ready for its first masterpiece!</div>') + '</div>';
    context.stage.appendChild(gallery);
    gallery.querySelector("#closeGallery").addEventListener("click", function () { gallery.remove(); });
    gallery.addEventListener("click", function (event) { if (event.target === gallery) gallery.remove(); });
    gallery.querySelectorAll("[data-gallery-page]").forEach(function (button) {
      button.addEventListener("click", function () { pageIndex = Number(button.dataset.galleryPage); undo = []; draw(); });
    });
  }
  draw();
}

registerModule("builder", mountBuilder);
registerModule("jigsaw", mountJigsaw);
registerModule("fossil", mountFossil);
registerModule("memory", mountMemory);
registerModule("picnic", mountPicnic);
registerModule("hatchling", mountHatchling);
registerModule("trail", mountTrail);
registerModule("shapes", mountShapeSafari);
registerModule("beat", mountDinoBeat);
registerModule("habitat", mountHabitatBuilder);
registerModule("storybook", mountStorybook);
registerModule("discoveries", mountDinoDiscoveries);
registerModule("care", mountDinoCare);
registerModule("mummy", mountMummyCozyCorner);
registerModule("quest", mountDinoQuest);
registerModule("rescue", mountDinoRescue);
registerModule("moonbeam", mountMoonbeamRescue);
registerModule("parade", mountDinoParade);
registerModule("constellations", mountDinoConstellations);
registerModule("skymail", mountSkyMail);
registerModule("weather", mountWeatherWorkshop);
registerModule("coloring", mountColoring);
registerModule("daddy", mountDaddyChase);

document.getElementById("homeButton").addEventListener("click", exitActivity);
document.getElementById("parentButton").addEventListener("click", openParentGate);
soundButton.addEventListener("click", function () { state.sound = !state.sound; saveState(); notifyHubSettings(); if (state.sound) sound("tap"); });
updateSoundButton();

if (EMBEDDED) {
  window.addEventListener("message", function (event) {
    if (event.origin !== location.origin || !event.data || event.data.type !== "du-settings") return;
    const nextName = String(event.data.name || "").trim().replace(/\s+/g, " ").slice(0, 24);
    const nextSound = typeof event.data.sound === "boolean" ? event.data.sound : state.sound;
    const nextDifficulty = ["gentle", "curious", "adventurer"].includes(event.data.difficulty) ? event.data.difficulty : state.difficulty;
    const nextSpeech = typeof event.data.speech === "boolean" ? event.data.speech : state.speech;
    const nextCalm = typeof event.data.calmCelebrations === "boolean" ? event.data.calmCelebrations : state.calmCelebrations;
    const changed = nextName !== state.name || nextSound !== state.sound || nextDifficulty !== state.difficulty || nextSpeech !== state.speech || nextCalm !== state.calmCelebrations;
    state.name = nextName;
    state.nameAsked = true;
    state.sound = nextSound;
    state.difficulty = nextDifficulty;
    state.speech = nextSpeech;
    state.calmCelebrations = nextCalm;
    if (changed) saveState();
    if (currentActivity && activeContext) {
      activeContext.playerName = state.name;
      const subtitle = app.querySelector(".game-title-box p");
      if (subtitle) subtitle.textContent = personalized("Let’s see what we can discover!");
    } else if (REQUESTED_ACTIVITY && getModule(REQUESTED_ACTIVITY)) openActivity(REQUESTED_ACTIVITY);
    else renderHome();
  });
  window.parent.postMessage({ type: "du-ready" }, location.origin);
}

if (!EMBEDDED && "serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js").catch(function () {}); });
}

if (EMBEDDED) app.innerHTML = '<p class="embedded-loading">Opening your dinosaur adventure…</p>';
else if (!state.seenIntro && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) playIntro(false);
else {
  state.seenIntro = true;
  renderHome();
  if (REQUESTED_ACTIVITY && getModule(REQUESTED_ACTIVITY)) openActivity(REQUESTED_ACTIVITY);
  else if (!state.nameAsked) window.setTimeout(askName, 180);
}
