// App entry: shared progression, scene selection, garage, and navigation.

import { CARS } from "./data-cars.js";
import { SCENE_LIST } from "./data-scenes.js";
import { initCustomize } from "./screens/customize.js";
import { initDrive } from "./screens/drive.js";
import { initGarage, unlockedCarCount } from "./screens/garage.js";
import { renderCarSVG } from "./render-car.js";

const STORAGE_KEY = "dino-car-studio-v1";
const EMBEDDED = window.self !== window.top;

function defaultState() {
  const car = CARS[0];
  return {
    config: { carId: car.id, body: car.body, paint: car.paint, name: "", stickers: [] },
    totalStars: 0,
    bestStars: 0,
    selectedScene: "island",
    selectedMode: "explore",
    sound: true
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.config) {
      const fallback = defaultState();
      const oldCar = CARS.find(car => car.id === saved.config.carId) || CARS.find(car => car.body === saved.config.body) || CARS[0];
      return {
        ...fallback,
        ...saved,
        config: { ...fallback.config, ...saved.config, carId: saved.config.carId || oldCar.id },
        totalStars: Math.max(0, Number(saved.totalStars) || Number(saved.bestStars) || 0),
        bestStars: Math.max(0, Number(saved.bestStars) || 0),
        selectedScene: SCENE_LIST.some(scene => scene.id === saved.selectedScene) ? saved.selectedScene : "island",
        selectedMode: saved.selectedMode === "race" ? "race" : "explore"
      };
    }
  } catch { /* use a fresh local profile if storage is unavailable */ }
  return defaultState();
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* play still works without saved progress */ }
}

const state = loadState();
const screens = {
  home: document.querySelector("#screen-home"),
  customize: document.querySelector("#screen-customize"),
  garage: document.querySelector("#screen-garage"),
  drive: document.querySelector("#screen-drive")
};
const homeHint = document.querySelector("#homeHint");
const homeCarSummary = document.querySelector("#homeCarSummary");
const scenePicker = document.querySelector("#scenePicker");
let driveHandle = null;
let garageHandle = null;
let customizeHandle = null;
let soundOn = state.sound !== false;

function syncHubSettings() {
  if (!EMBEDDED) return;
  saveState(state);
  window.parent.postMessage({ type: "du-settings-update", name: state.config.name || "", sound: soundOn }, location.origin);
}

function currentCar() {
  return CARS.find(car => car.id === state.config.carId) || CARS.find(car => car.body === state.config.body) || CARS[0];
}

function refreshHome() {
  const car = currentCar();
  homeCarSummary.innerHTML = `<div class="summary-preview">${renderCarSVG(state.config)}</div><div class="summary-copy"><span class="eyebrow">YOUR DINO DRIVER</span><strong>${car.name}${state.config.name ? ` · ${escapeHtml(state.config.name)}'s car` : ""}</strong><span>${unlockedCarCount(state)} of ${CARS.length} cars unlocked · ${state.totalStars} stars</span></div>`;
  scenePicker.innerHTML = SCENE_LIST.map(scene => {
    const unlocked = state.totalStars >= scene.unlockStars;
    const selected = state.selectedScene === scene.id;
    return `<button class="scene-choice${selected ? " selected" : ""}${unlocked ? "" : " locked"}" data-scene="${scene.id}" ${unlocked ? "" : "aria-disabled=\"true\""} aria-label="${scene.label}${unlocked ? (selected ? ", selected" : "") : `, unlock at ${scene.unlockStars} stars`}"><span>${sceneIcon(scene.id)}</span><strong>${scene.label}</strong><small>${unlocked ? (selected ? "Ready to explore" : "Choose this world") : `🔒 ${scene.unlockStars} stars`}</small></button>`;
  }).join("");
  scenePicker.querySelectorAll("[data-scene]").forEach(button => button.addEventListener("click", () => {
    const scene = SCENE_LIST.find(item => item.id === button.dataset.scene);
    if (!scene) return;
    if (state.totalStars < scene.unlockStars) {
      homeHint.textContent = `Collect ${scene.unlockStars - state.totalStars} more stars to open ${scene.label}.`;
      return;
    }
    state.selectedScene = scene.id;
    homeHint.textContent = `${scene.label} is ready. Choose Explore or Dino Race!`;
    saveState(state);
    refreshHome();
  }));
}

function sceneIcon(id) {
  return ({ island: "🌴", city: "🏙️", mountain: "⛰️", snow: "❄️", desert: "🌵", space: "🪐" })[id] || "🦕";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function show(name) {
  Object.entries(screens).forEach(([key, element]) => element.classList.toggle("hidden", key !== name));
  if (name === "home") refreshHome();
  if (name === "garage" && garageHandle) garageHandle.refresh();
  if (driveHandle) {
    if (name === "drive") driveHandle.start({ scene: state.selectedScene, mode: state.selectedMode });
    else driveHandle.stop();
  }
}

customizeHandle = initCustomize(screens.customize, state, () => {
  state.selectedMode = "explore";
  saveState(state);
  show("drive");
}, syncHubSettings);

garageHandle = initGarage(screens.garage, state, car => {
  state.config = { ...state.config, carId: car.id, body: car.body, paint: car.paint };
  saveState(state);
  refreshHome();
}, () => show("home"));

driveHandle = initDrive(screens.drive, state, () => show("home"), result => {
  const earned = Math.max(0, Number(result.stars) || 0);
  const previousTotal = state.totalStars;
  state.totalStars += earned;
  state.bestStars = Math.max(state.bestStars, earned);
  saveState(state);
  garageHandle.refresh();
  refreshHome();
  const newCars = unlockedCarCount(state);
  const openedScene = SCENE_LIST.find(scene => previousTotal < scene.unlockStars && state.totalStars >= scene.unlockStars);
  homeHint.textContent = `${result.message} ${earned} stars added to your collection. ${newCars} of ${CARS.length} cars unlocked.${openedScene ? ` ${openedScene.label} is now open!` : ""}`;
});

document.querySelector("#btnPaint").addEventListener("click", () => show("customize"));
document.querySelector("#btnGarage").addEventListener("click", () => show("garage"));
document.querySelector("#btnDrive").addEventListener("click", () => {
  state.selectedMode = "explore";
  saveState(state);
  show("drive");
});
document.querySelector("#btnRace").addEventListener("click", () => {
  state.selectedMode = "race";
  saveState(state);
  show("drive");
});
document.querySelector("#btnHome").addEventListener("click", () => {
  saveState(state);
  show("home");
});

const soundBtn = document.querySelector("#btnSound");
soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  state.sound = soundOn;
  soundBtn.classList.toggle("off", !soundOn);
  soundBtn.setAttribute("aria-label", soundOn ? "Mute sound" : "Turn sound on");
  saveState(state);
  syncHubSettings();
});

if (EMBEDDED) {
  window.addEventListener("message", event => {
    if (event.origin !== location.origin || event.source !== window.parent || !event.data || event.data.type !== "du-settings") return;
    const nextName = String(event.data.name || "").trim().replace(/\s+/g, " ").slice(0, 24);
    const nextSound = typeof event.data.sound === "boolean" ? event.data.sound : soundOn;
    const changed = nextName !== state.config.name || nextSound !== soundOn;
    state.config.name = nextName;
    soundOn = nextSound;
    state.sound = nextSound;
    soundBtn.classList.toggle("off", !soundOn);
    soundBtn.setAttribute("aria-label", soundOn ? "Mute sound" : "Turn sound on");
    if (customizeHandle) customizeHandle.refresh();
    if (changed) saveState(state);
    refreshHome();
  });
  window.parent.postMessage({ type: "du-ready" }, location.origin);
}

refreshHome();
show("home");
