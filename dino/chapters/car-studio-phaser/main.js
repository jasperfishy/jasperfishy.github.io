import { CARS, PAINTS, STICKERS } from "../drive/js/data-cars.js?v=du-58eb19b6b425f48c";
import { SCENE_LIST } from "../drive/js/data-scenes.js?v=du-58eb19b6b425f48c";

const W = 960, H = 540, STORAGE_KEY = "dino-car-studio-v1";
const ui = document.getElementById("game-ui");
const sceneById = Object.fromEntries(SCENE_LIST.map((scene) => [scene.id, scene]));
const icons = { island: "🌴", city: "🏙️", mountain: "⛰️", snow: "❄️", desert: "🌵", space: "🪐" };

function defaultState() {
  const car = CARS[0];
  return { config: { carId: car.id, body: car.body, paint: car.paint, name: "", stickers: [] }, totalStars: 0, bestStars: 0, selectedScene: "island", selectedMode: "explore", sound: true };
}
function loadState() {
  const base = defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !saved.config) return base;
    const legacyCar = CARS.find((car) => car.id === saved.config.carId) || CARS.find((car) => car.body === saved.config.body) || CARS[0];
    const paint = /^#[0-9a-f]{6}$/i.test(saved.config.paint || "") ? saved.config.paint : legacyCar.paint;
    return {
      ...base, ...saved,
      config: { ...base.config, ...saved.config, carId: saved.config.carId || legacyCar.id, body: saved.config.body || legacyCar.body, paint, name: String(saved.config.name || "").slice(0, 12), stickers: Array.isArray(saved.config.stickers) ? saved.config.stickers.slice(0, 4) : [] },
      totalStars: Math.max(0, Number(saved.totalStars) || Number(saved.bestStars) || 0),
      bestStars: Math.max(0, Number(saved.bestStars) || 0),
      selectedScene: sceneById[saved.selectedScene] ? saved.selectedScene : "island",
      selectedMode: saved.selectedMode === "race" ? "race" : "explore"
    };
  } catch { return base; }
}
const state = loadState();
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* local progress is optional */ }
  if (window.self !== window.top) {
    try { window.parent.postMessage({ type: "du-settings-update", name: state.config.name || "", sound: state.sound !== false }, location.origin); } catch { /* parent bridge is optional */ }
  }
}
function sound(on) {
  state.sound = !!on;
  if (window.DUFX && window.DUFX.settings) window.DUFX.settings.sound = state.sound;
  saveState();
}
function safeText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function carAt(index) { return CARS[Math.max(0, Math.min(CARS.length - 1, index))]; }
function carIndex() { return Math.max(0, CARS.findIndex((car) => car.id === state.config.carId)); }
function carUnlockCost(index) { return index === 0 ? 0 : index * 3; }
function unlockedCarCount() { return CARS.reduce((n, _car, i) => n + (state.totalStars >= carUnlockCost(i) ? 1 : 0), 0); }
function worldUnlocked(world) { return state.totalStars >= world.unlockStars; }
function worldTitle(id) { return sceneById[id] || sceneById.island; }
function motionOK() { return !window.DUFX || !window.DUFX.settings || !window.DUFX.settings.reduce; }

function createCanvasTexture(scene, key, draw) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, W, H);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, W, H);
  draw(ctx, W, H);
  texture.refresh();
}
function addWorldBackdrop(scene, worldId, horizonMode) {
  if (window.DUKit && DUKit.textures) DUKit.textures(scene);
  const world = worldTitle(worldId);
  const sky = scene.add.graphics().setDepth(-10);
  const top = Phaser.Display.Color.HexStringToColor(world.sky[0]).color;
  const bottom = Phaser.Display.Color.HexStringToColor(world.sky[1]).color;
  sky.fillGradientStyle(top, top, bottom, bottom, 1);
  sky.fillRect(0, 0, W, H);
  const farKey = "car-far-" + world.id;
  const midKey = "car-mid-" + world.id;
  createCanvasTexture(scene, farKey, (ctx, w, h) => world.far(ctx, 0, w, h));
  createCanvasTexture(scene, midKey, (ctx, w, h) => world.mid(ctx, 0, w, h));
  const far = scene.add.tileSprite(W / 2, H / 2, W, H, farKey).setDepth(-8).setAlpha(0.95);
  const cloudKey = "car-clouds";
  if (!scene.textures.exists(cloudKey)) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xffffff, 0.8); g.fillEllipse(48, 28, 76, 32); g.fillEllipse(92, 20, 72, 38); g.fillEllipse(136, 30, 62, 28);
    g.generateTexture(cloudKey, 184, 58); g.destroy();
  }
  const clouds = scene.add.tileSprite(W / 2, 86, W, 58, cloudKey).setDepth(-7).setAlpha(world.id === "space" ? 0 : 0.7);
  const mid = scene.add.tileSprite(W / 2, H / 2 + 12, W, H, midKey).setDepth(-1).setAlpha(0.95);
  if (world.id === "space") {
    const planet = scene.add.circle(805, 94, 42, 0xd68bff, 0.95).setDepth(-5);
    scene.add.ellipse(805, 94, 134, 30, 0x9ceaff, 0.75).setDepth(-4).setAngle(-16);
    scene.add.circle(792, 81, 20, 0xf6caff, 0.65).setDepth(-3);
    if (motionOK()) scene.tweens.add({ targets: planet, scale: 1.08, duration: 2200, yoyo: true, repeat: -1 });
  } else {
    if (window.DUKit && DUKit.sunRays) DUKit.sunRays(scene, 805, 90, 150, 0xfff0ad).setDepth(-5);
    const sun = scene.add.circle(805, 90, 31, 0xffe27a, 1).setDepth(-4);
    if (motionOK()) scene.tweens.add({ targets: sun, scale: 1.08, duration: 1800, yoyo: true, repeat: -1 });
  }
  if (window.DUKit && DUKit.sparkleField) DUKit.sparkleField(scene, world.id === "space" ? 32 : 10, 10, 28, 950, 210, 0xffffff);
  scene.events.on("update", (_time, delta) => {
    if (!motionOK() || scene.paused) return;
    const factor = horizonMode ? 1.2 : 0.45;
    clouds.tilePositionX += delta * 0.012 * factor;
    far.tilePositionX += delta * 0.004 * factor;
    mid.tilePositionX += delta * 0.009 * factor;
  });
  return world;
}
function drawRearCar(scene, x, y, config, scale, depth) {
  const bodyType = config.body || "sport";
  const width = bodyType === "monster" || bodyType === "truck" ? 94 : bodyType === "van" ? 84 : 76;
  const color = Phaser.Display.Color.HexStringToColor(config.paint || "#2ecc71").color;
  const lighter = Phaser.Display.Color.ValueToColor(color).lighten(28).color;
  const darker = Phaser.Display.Color.ValueToColor(color).darken(28).color;
  const car = scene.add.container(x, y).setScale(scale || 1).setDepth(depth || 10);
  const g = scene.add.graphics();
  g.fillStyle(0x101724, 0.28); g.fillEllipse(0, 47, width + 28, 18);
  g.fillStyle(0x171c24, 1);
  g.fillRoundedRect(-width / 2 - 7, -16, 14, 54, 6);
  g.fillRoundedRect(width / 2 - 7, -16, 14, 54, 6);
  g.fillStyle(0x8795a3, 1); g.fillCircle(-width / 2, 11, 5); g.fillCircle(width / 2, 11, 5);
  g.fillStyle(darker, 1);
  g.beginPath();
  g.moveTo(0, -68); g.lineTo(width * 0.34, -46); g.lineTo(width * 0.43, -10);
  g.lineTo(width * 0.5, 29); g.lineTo(width * 0.43, 50); g.lineTo(-width * 0.43, 50);
  g.lineTo(-width * 0.5, 29); g.lineTo(-width * 0.43, -10); g.lineTo(-width * 0.34, -46); g.closePath(); g.fillPath();
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(0, -65); g.lineTo(width * 0.32, -44); g.lineTo(width * 0.4, -8);
  g.lineTo(width * 0.46, 28); g.lineTo(width * 0.39, 45); g.lineTo(-width * 0.39, 45);
  g.lineTo(-width * 0.46, 28); g.lineTo(-width * 0.4, -8); g.lineTo(-width * 0.32, -44); g.closePath(); g.fillPath();
  g.lineStyle(3, lighter, 0.9); g.strokePath();
  g.fillStyle(0x162f47, 1);
  g.beginPath(); g.moveTo(-width * 0.27, -36); g.lineTo(0, -54); g.lineTo(width * 0.27, -36); g.lineTo(width * 0.3, -9); g.lineTo(-width * 0.3, -9); g.closePath(); g.fillPath();
  g.lineStyle(2, 0xffffff, 0.45); g.strokePath();
  g.fillStyle(0xf6d96f, 1); g.fillRoundedRect(-width * 0.22, -40, width * 0.1, 5, 2); g.fillRoundedRect(width * 0.12, -40, width * 0.1, 5, 2);
  g.fillStyle(0xff5b59, 1); g.fillRoundedRect(-width * 0.37, 31, 13, 11, 3); g.fillRoundedRect(width * 0.24, 31, 13, 11, 3);
  g.fillStyle(0x242a33, 1); g.fillRoundedRect(-width * 0.34, 45, width * 0.68, 7, 3);
  if (bodyType === "race") { g.fillStyle(0x20252c, 1); g.fillRoundedRect(-width * 0.42, -56, width * 0.84, 6, 2); }
  if (bodyType === "pickup" || bodyType === "truck") { g.lineStyle(2, lighter, 0.8); g.lineBetween(-width * 0.31, 10, width * 0.31, 10); g.lineBetween(-width * 0.31, 20, width * 0.31, 20); }
  if (bodyType === "van") { g.lineStyle(2, lighter, 0.8); g.lineBetween(0, -8, 0, 27); }
  car.add(g);
  if (config.stickers && config.stickers.length) {
    config.stickers.slice(0, 4).forEach((sticker, i) => {
      car.add(scene.add.text((i - (Math.min(4, config.stickers.length) - 1) / 2) * 18, 25, sticker, { fontSize: "13px" }).setOrigin(0.5));
    });
  }
  if (config.name) car.add(scene.add.text(0, 10, String(config.name).slice(0, 12), { fontSize: "8px", fontFamily: "system-ui,sans-serif", fontStyle: "bold", color: "#ffffff", stroke: "#162331", strokeThickness: 2 }).setOrigin(0.5));
  const dino = scene.add.container(0, -17);
  const dg = scene.add.graphics();
  dg.fillStyle(0x2f9f62, 1); dg.fillCircle(0, 0, 14); dg.fillTriangle(-11, -9, -7, -23, -2, -10); dg.fillTriangle(1, -10, 7, -25, 10, -7);
  dg.fillStyle(0xffffff, 1); dg.fillCircle(-5, -3, 4); dg.fillCircle(6, -3, 4);
  dg.fillStyle(0x173523, 1); dg.fillCircle(-4, -2, 1.8); dg.fillCircle(7, -2, 1.8);
  dg.fillStyle(0xfff5cf, 1); dg.fillEllipse(1, 6, 13, 6);
  dino.add(dg); car.add(dino);
  return car;
}
function bindClick(root, selector, handler) {
  root.querySelectorAll(selector).forEach((element) => element.addEventListener("click", handler));
}
function setUI(markup) { ui.innerHTML = markup; }

class HomeScene extends Phaser.Scene {
  constructor() { super("home"); }
  create() {
    addWorldBackdrop(this, state.selectedScene, false);
    const car = drawRearCar(this, 692, 394, state.config, 1.25, 4);
    if (motionOK()) this.tweens.add({ targets: car, y: 388, duration: 800, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const available = unlockedCarCount();
    setUI(
      '<section class="panel home-panel" aria-label="Dino Car Studio">' +
      '<header class="panel-heading"><div><p class="eyebrow">DINOSAUR UNIVERSE</p><h1>Dino Car Studio</h1><p class="subline">Build a car, pick a world, then hit the road.</p></div><button id="sound-toggle" class="sound-button" type="button" aria-label="Toggle sound">' + (state.sound === false ? "🔇" : "🔊") + '</button></header>' +
      '<h2 class="section-title">Choose your world</h2><div class="world-grid">' +
      SCENE_LIST.map((world) => {
        const open = worldUnlocked(world), selected = state.selectedScene === world.id;
        return '<button type="button" class="world-choice' + (selected ? " selected" : "") + (open ? "" : " locked") + '" data-world="' + world.id + '" aria-label="' + safeText(world.label) + (open ? (selected ? ", selected" : "") : ", unlock at " + world.unlockStars + " stars") + '">' +
          '<span class="world-icon">' + icons[world.id] + '</span><span><strong>' + safeText(world.label) + '</strong><small>' + (open ? (selected ? "Ready to explore" : "Choose this world") : "🔒 " + world.unlockStars + " stars") + '</small></span></button>';
      }).join("") +
      '</div><div class="action-grid"><button class="action-button paint-action" data-action="paint">🎨 Paint My Car</button><button class="action-button garage-action" data-action="garage">🚗 Dino Garage</button><button class="action-button drive-action" data-action="explore">🦖 Explore &amp; Collect</button><button class="action-button race-action" data-action="race">🏁 Dino Race</button></div>' +
      '<footer class="progress-line"><span>' + available + ' / ' + CARS.length + ' cars unlocked</span><span>⭐ ' + state.totalStars + ' stars</span><span>🏆 Best ' + state.bestStars + '</span></footer><p id="home-hint" class="hint">Your dino driver is ready for ' + safeText(worldTitle(state.selectedScene).label) + '.</p></section>'
    );
    bindClick(ui, "[data-world]", (event) => {
      const world = sceneById[event.currentTarget.dataset.world];
      if (!world) return;
      if (!worldUnlocked(world)) {
        const hint = ui.querySelector("#home-hint");
        hint.textContent = "Collect " + (world.unlockStars - state.totalStars) + " more stars to unlock " + world.label + ".";
        return;
      }
      state.selectedScene = world.id; saveState(); this.scene.restart();
    });
    bindClick(ui, "[data-action]", (event) => {
      const action = event.currentTarget.dataset.action;
      if (action === "paint") this.scene.start("customize");
      else if (action === "garage") this.scene.start("garage");
      else { state.selectedMode = action; saveState(); this.scene.start("drive", { mode: action, world: state.selectedScene }); }
    });
    const soundButton = ui.querySelector("#sound-toggle");
    soundButton.addEventListener("click", () => { sound(state.sound === false); soundButton.textContent = state.sound ? "🔊" : "🔇"; });
    this.events.once("shutdown", () => setUI(""));
    if (window.DUFX && window.DUFX.settings) window.DUFX.settings.sound = state.sound !== false;
  }
}

class CustomizeScene extends Phaser.Scene {
  constructor() { super("customize"); }
  create() {
    addWorldBackdrop(this, state.selectedScene, false);
    this.showCar = drawRearCar(this, 700, 390, state.config, 1.55, 4);
    if (motionOK()) this.tweens.add({ targets: this.showCar, y: 384, duration: 900, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.renderControls();
    this.events.once("shutdown", () => setUI(""));
  }
  redrawCar() {
    if (this.showCar) this.showCar.destroy();
    this.showCar = drawRearCar(this, 700, 390, state.config, 1.55, 4);
  }
  renderControls() {
    setUI(
      '<section class="panel customize-panel"><header class="panel-heading"><div><p class="eyebrow">MAKE IT YOURS</p><h1>Paint My Car</h1><p class="subline">Your car faces into the road ahead.</p></div><button class="small-button" id="custom-home">← Home</button></header>' +
      '<label class="section-title" for="paint-options">Pick a colour</label><div id="paint-options" class="paint-grid">' +
      PAINTS.map((paint) => '<button type="button" class="paint-chip' + (state.config.paint === paint ? " selected" : "") + '" data-paint="' + paint + '" style="--paint:' + paint + '" aria-label="Paint ' + paint + '"' + (state.config.paint === paint ? ' aria-pressed="true"' : "") + '></button>').join("") +
      '</div><h2 class="section-title">Add stickers <small>(up to 4)</small></h2><div class="sticker-grid">' +
      STICKERS.map((sticker) => '<button type="button" class="sticker-choice' + (state.config.stickers.includes(sticker) ? " selected" : "") + '" data-sticker="' + safeText(sticker) + '" aria-pressed="' + state.config.stickers.includes(sticker) + '">' + sticker + '</button>').join("") +
      '</div><label class="name-label" for="driver-name">Your name on the car</label><input id="driver-name" class="name-input" maxlength="12" autocomplete="off" value="' + safeText(state.config.name) + '" placeholder="Type your name">' +
      '<div class="action-row"><button class="small-button" id="shuffle-car">🎲 Surprise me!</button><button class="action-button drive-action" id="custom-drive">Drive now →</button></div></section>'
    );
    bindClick(ui, "[data-paint]", (event) => {
      state.config.paint = event.currentTarget.dataset.paint; saveState(); this.renderControls(); this.redrawCar();
    });
    bindClick(ui, "[data-sticker]", (event) => {
      const sticker = event.currentTarget.dataset.sticker;
      const index = state.config.stickers.indexOf(sticker);
      if (index >= 0) state.config.stickers.splice(index, 1);
      else if (state.config.stickers.length < 4) state.config.stickers.push(sticker);
      saveState(); this.renderControls(); this.redrawCar();
    });
    ui.querySelector("#driver-name").addEventListener("input", (event) => {
      state.config.name = event.currentTarget.value.trim().slice(0, 12); saveState(); this.redrawCar();
    });
    ui.querySelector("#custom-home").addEventListener("click", () => this.scene.start("home"));
    ui.querySelector("#shuffle-car").addEventListener("click", () => {
      const available = CARS.filter((_car, index) => state.totalStars >= carUnlockCost(index));
      const car = available[Math.floor(Math.random() * available.length)] || CARS[0];
      state.config = { carId: car.id, body: car.body, paint: PAINTS[Math.floor(Math.random() * PAINTS.length)], name: state.config.name, stickers: STICKERS.slice().sort(() => Math.random() - 0.5).slice(0, 2) };
      saveState(); this.renderControls(); this.redrawCar();
    });
    ui.querySelector("#custom-drive").addEventListener("click", () => { state.selectedMode = "explore"; saveState(); this.scene.start("drive", { mode: "explore", world: state.selectedScene }); });
  }
}

class GarageScene extends Phaser.Scene {
  constructor() { super("garage"); }
  create() {
    addWorldBackdrop(this, state.selectedScene, false);
    setUI(
      '<section class="panel garage-panel"><header class="panel-heading"><div><p class="eyebrow">YOUR COLLECTION</p><h1>Dino Garage</h1><p class="subline">' + unlockedCarCount() + ' of ' + CARS.length + ' cars ready · ' + state.totalStars + ' stars collected</p></div><button class="small-button" id="garage-home">← Home</button></header>' +
      '<div class="garage-grid">' + CARS.map((car, index) => {
        const unlocked = state.totalStars >= carUnlockCost(index), selected = state.config.carId === car.id;
        const color = selected ? state.config.paint : car.paint;
        return '<button type="button" class="garage-car' + (selected ? " selected" : "") + (unlocked ? "" : " locked") + '" data-car-index="' + index + '" aria-label="' + safeText(car.name) + (unlocked ? (selected ? ", your current car" : ", unlocked") : ", unlock at " + carUnlockCost(index) + " stars") + '">' +
          '<span class="garage-car-art" style="--car-colour:' + color + '">🚙</span><strong>' + safeText(car.name) + '</strong><small>' + (unlocked ? (selected ? "Your current car" : "Tap to choose") : "🔒 " + carUnlockCost(index) + " stars") + '</small></button>';
      }).join("") + '</div></section>'
    );
    ui.querySelector("#garage-home").addEventListener("click", () => this.scene.start("home"));
    bindClick(ui, "[data-car-index]", (event) => {
      const index = Number(event.currentTarget.dataset.carIndex), car = carAt(index);
      if (state.totalStars < carUnlockCost(index)) {
        event.currentTarget.querySelector("small").textContent = "Collect " + (carUnlockCost(index) - state.totalStars) + " more stars";
        return;
      }
      state.config = { ...state.config, carId: car.id, body: car.body, paint: car.paint };
      saveState(); this.scene.start("home");
    });
    this.events.once("shutdown", () => setUI(""));
  }
}

class DriveScene extends Phaser.Scene {
  constructor() { super("drive"); }
  init(options) { this.mode = options.mode === "race" ? "race" : "explore"; this.worldId = sceneById[options.world] ? options.world : state.selectedScene; }
  create() {
    this.world = addWorldBackdrop(this, this.worldId, true);
    this.roadTop = 274; this.roadStart = this.time.now; this.roadScroll = 0;
    this.items = []; this.rivals = []; this.collected = 0; this.distance = 0; this.speed = this.mode === "race" ? 168 : 174;
    this.boost = 0; this.slow = 0; this.spawnClock = 0; this.countdown = 3.1; this.lastCount = 4; this.paused = false; this.ended = false; this.steer = 0;
    this.playerU = 0.5; this.playerX = W / 2; this.playerCar = drawRearCar(this, this.playerX, 466, state.config, 1.04, 20);
    this.buildRoad();
    if (this.mode === "race") this.buildRivals();
    this.bindControls();
    if (motionOK()) this.tweens.add({ targets: this.playerCar, y: 462, duration: 180, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.events.once("shutdown", () => setUI(""));
  }
  buildRoad() {
    const horizon = this.roadTop, halfNear = 372, halfFar = 82;
    const ground = this.add.rectangle(W / 2, (horizon + H) / 2, W, H - horizon, Phaser.Display.Color.HexStringToColor(this.world.ground).color).setDepth(-2);
    const road = this.add.graphics().setDepth(2);
    const roadColor = Phaser.Display.Color.HexStringToColor(this.world.road).color;
    const lineColor = Phaser.Display.Color.HexStringToColor(this.world.roadLine).color;
    road.fillStyle(roadColor, 1);
    road.beginPath(); road.moveTo(W / 2 - halfFar, horizon); road.lineTo(W / 2 + halfFar, horizon); road.lineTo(W / 2 + halfNear, H); road.lineTo(W / 2 - halfNear, H); road.closePath(); road.fillPath();
    road.lineStyle(9, lineColor, 0.92);
    road.beginPath(); road.moveTo(W / 2 - halfFar, horizon); road.lineTo(W / 2 - halfNear, H); road.moveTo(W / 2 + halfFar, horizon); road.lineTo(W / 2 + halfNear, H); road.strokePath();
    road.fillStyle(0xffffff, 0.14); road.fillRect(0, horizon, 960, 5);
    this.roadShape = road;
    this.dashes = [];
    for (let i = 0; i < 12; i++) {
      for (let lane = 1; lane <= 2; lane++) {
        this.dashes.push({ sprite: this.add.rectangle(0, 0, 8, 22, lineColor, 0.9).setDepth(3), phase: i / 12, lane });
      }
    }
    this.roadDims = { halfNear, halfFar, horizon, ground };
  }
  buildRivals() {
    const paints = ["#ff704d", "#8b74e8", "#ffca52"];
    this.rivals = paints.map((paint, index) => ({
      name: ["Pip", "Rexy", "Zoom"][index],
      u: [0.28, 0.72, 0.48][index],
      progress: 250 + Math.random() * 260,
      speed: 154 + Math.random() * 28,
      car: drawRearCar(this, W / 2, 338, { body: CARS[(index * 9 + 6) % CARS.length].body, paint, stickers: ["⭐"] }, 0.56, 10)
    }));
  }
  bindControls() {
    const world = this.world;
    setUI(
      '<div class="drive-hud"><button class="small-button" id="drive-home">← Home</button><div class="hud-pill" id="hud-stars">⭐ 0</div><div class="hud-pill" id="hud-progress"></div><div class="hud-pill" id="hud-message"></div><button class="small-button" id="drive-pause">Ⅱ Pause</button></div>' +
      '<div id="countdown" class="countdown" aria-live="polite">3</div><div class="drive-controls"><button type="button" class="steer-button" data-steer="-1" aria-label="Steer left">◀</button><button type="button" class="steer-button" data-steer="1" aria-label="Steer right">▶</button></div>'
    );
    const hudProgress = ui.querySelector("#hud-progress"), hudMessage = ui.querySelector("#hud-message"), countdown = ui.querySelector("#countdown");
    hudMessage.textContent = this.mode === "race" ? "Race 3 laps! Stars give you a boost." : "Collect 20 " + world.collectible + " on the road!";
    this.updateHud = () => {
      ui.querySelector("#hud-stars").textContent = world.collectible + " " + this.collected;
      hudProgress.textContent = this.mode === "race" ? "Lap " + Math.min(3, Math.floor(this.distance / 2300) + 1) + "/3 · " + this.placeText() : world.label + " · " + Math.min(20, this.collected) + "/20";
      countdown.textContent = this.paused ? "PAUSED" : (this.countdown > 0 ? (Math.ceil(this.countdown) > 0 ? String(Math.ceil(this.countdown)) : "GO!") : "");
      countdown.classList.toggle("hidden", !this.paused && this.countdown <= 0);
    };
    ui.querySelector("#drive-home").addEventListener("click", () => this.scene.start("home"));
    ui.querySelector("#drive-pause").addEventListener("click", (event) => {
      this.paused = !this.paused;
      event.currentTarget.textContent = this.paused ? "▶ Resume" : "Ⅱ Pause";
      this.updateHud();
    });
    this.pointerHandlers = new AbortController();
    ui.querySelectorAll("[data-steer]").forEach((button) => {
      const direction = Number(button.dataset.steer);
      button.addEventListener("pointerdown", (event) => { event.preventDefault(); this.steer = direction; button.setPointerCapture(event.pointerId); }, { signal: this.pointerHandlers.signal });
      const stop = () => { if (this.steer === direction) this.steer = 0; };
      button.addEventListener("pointerup", stop, { signal: this.pointerHandlers.signal });
      button.addEventListener("pointercancel", stop, { signal: this.pointerHandlers.signal });
      button.addEventListener("lostpointercapture", stop, { signal: this.pointerHandlers.signal });
    });
    this.events.once("shutdown", () => this.pointerHandlers.abort());
    this.keys = this.input.keyboard.addKeys("LEFT,RIGHT,A,D");
    this.updateHud();
  }
  roadX(y, u) {
    const p = Phaser.Math.Clamp((y - this.roadTop) / (H - this.roadTop), 0, 1);
    const width = 164 + p * 582;
    return W / 2 + (u - 0.5) * width;
  }
  placeText() {
    if (!this.rivals.length) return "1st";
    const place = 1 + this.rivals.filter((rival) => rival.progress > this.distance).length;
    return ["1st", "2nd", "3rd", "4th"][place - 1];
  }
  spawnItem() {
    const collectible = Math.random() < 0.76;
    const u = Phaser.Math.FloatBetween(0.14, 0.86);
    const label = collectible ? this.world.collectible : this.world.obstacle;
    const object = this.add.text(this.roadX(this.roadTop + 4, u), this.roadTop + 5, label, { fontSize: "36px" }).setOrigin(0.5).setDepth(8).setScale(0.38);
    this.items.push({ object, u, y: this.roadTop + 4, collectible, hit: false, velocity: Phaser.Math.Between(118, 148) });
  }
  collectItem(item) {
    item.hit = true;
    item.object.destroy();
    if (item.collectible) {
      this.collected += 1;
      this.boost = this.mode === "race" ? 2.5 : 0;
      if (window.DUKit) {
        DUKit.burst(this, item.x, item.y, { texture: "kit-spark", tint: 0xffdf58, n: 18, scale: 1.15, life: 700 });
        DUKit.floatText(this, item.x, item.y - 14, "+1 " + this.world.collectible);
        DUKit.sfx("sparkle");
      }
      const label = ui.querySelector("#hud-message");
      if (label) label.textContent = this.mode === "race" ? "Dino boost! Zoom ahead!" : "Lovely find! " + this.collected + " of 20";
    } else {
      this.slow = this.mode === "race" ? 1.2 : 0.4;
      if (window.DUKit) { DUKit.burst(this, item.x, item.y, { tint: 0xffffff, n: 10, scale: 0.8 }); DUKit.sfx("boing"); }
      const label = ui.querySelector("#hud-message");
      if (label) label.textContent = "Bumpy! Steer around the next one.";
    }
    this.updateHud();
  }
  finish() {
    if (this.ended) return;
    this.ended = true; this.paused = true;
    const place = this.mode === "race" ? 1 + this.rivals.filter((rival) => rival.progress > this.distance).length : 1;
    const bonus = this.mode === "race" ? Math.max(3, 15 - (place - 1) * 4) : 5;
    const earned = this.collected + bonus;
    state.totalStars += earned; state.bestStars = Math.max(state.bestStars, earned); saveState();
    if (window.DUKit) {
      DUKit.sfx("win");
      DUKit.burst(this, W / 2, H * 0.35, { texture: "kit-spark", tint: 0xffe14d, n: 28, gravity: 450, life: 1000, depth: 50, scale: 1.2 });
      DUKit.banner(this, this.mode === "race" ? this.placeText() + " place!" : "Treasure trail complete!");
    }
    const label = this.mode === "race" ? this.placeText() + " place! Three laps complete." : "Amazing exploring! You found every treasure.";
    setUI('<section class="panel finish-panel"><p class="eyebrow">RACE COMPLETE</p><h1>' + safeText(label) + '</h1><p>You earned <strong>⭐ ' + earned + '</strong> stars. Your garage now has ' + unlockedCarCount() + ' of ' + CARS.length + ' cars ready.</p><div class="action-grid"><button class="action-button drive-action" id="finish-again">Play again</button><button class="action-button garage-action" id="finish-home">Back to studio</button></div></section>');
    ui.querySelector("#finish-again").addEventListener("click", () => this.scene.restart({ mode: this.mode, world: this.worldId }));
    ui.querySelector("#finish-home").addEventListener("click", () => this.scene.start("home"));
  }
  update(_time, delta) {
    if (this.paused || this.ended) return;
    const dt = Math.min(0.05, delta / 1000);
    if (this.countdown > 0) {
      this.countdown = Math.max(0, this.countdown - dt);
      this.updateHud();
      return;
    }
    this.distance += (this.speed + (this.boost > 0 ? 58 : 0) - (this.slow > 0 ? 45 : 0)) * dt;
    this.boost = Math.max(0, this.boost - dt); this.slow = Math.max(0, this.slow - dt);
    if (this.mode === "race") this.rivals.forEach((rival) => { rival.progress += rival.speed * dt; });
    const direction = (this.keys.RIGHT.isDown || this.keys.D.isDown ? 1 : 0) - (this.keys.LEFT.isDown || this.keys.A.isDown ? 1 : 0) || this.steer;
    const maxX = this.roadX(H - 55, 0.94), minX = this.roadX(H - 55, 0.06);
    this.playerX = Phaser.Math.Clamp(this.playerX + direction * 285 * dt, minX, maxX);
    this.playerCar.x = this.playerX; this.playerCar.angle = Phaser.Math.Clamp(direction * 4, -6, 6);
    this.roadScroll += dt * (this.speed + 130);
    this.dashes.forEach((dash) => {
      const phase = (dash.phase + (this.roadScroll / 760)) % 1;
      const y = this.roadTop + phase * (H - this.roadTop);
      const p = phase, laneU = dash.lane / 3;
      const x = this.roadX(y, laneU), width = 3 + p * 9, height = 8 + p * 25;
      dash.sprite.setPosition(x, y).setDisplaySize(width, height).setAlpha(0.35 + p * 0.6);
    });
    this.spawnClock += dt;
    if (this.spawnClock >= (this.mode === "race" ? 0.8 : 0.72)) { this.spawnClock = 0; this.spawnItem(); }
    this.items.forEach((item) => {
      item.y += item.velocity * dt * (0.58 + Phaser.Math.Clamp((item.y - this.roadTop) / (H - this.roadTop), 0, 1) * 1.55);
      const depth = Phaser.Math.Clamp((item.y - this.roadTop) / (H - this.roadTop), 0, 1);
      item.x = this.roadX(item.y, item.u);
      item.object.setPosition(item.x, item.y).setScale(0.35 + depth * 0.68);
      if (!item.hit && item.y > H - 112 && item.y < H - 42 && Math.abs(item.x - this.playerX) < 48) this.collectItem(item);
    });
    this.items = this.items.filter((item) => { if (item.y > H + 30) { if (!item.hit && item.collectible) this.collected = Math.max(0, this.collected); item.object.destroy(); return false; } return !item.hit; });
    this.rivals.forEach((rival) => {
      const gap = rival.progress - this.distance;
      const depth = Phaser.Math.Clamp(1 - Math.max(0, gap) / 950, 0.08, 0.8);
      const y = this.roadTop + 28 + depth * 98;
      rival.car.setPosition(this.roadX(y, rival.u), y).setScale(0.4 + depth * 0.34);
    });
    if (this.collected >= 20 && this.mode === "explore") this.finish();
    if (this.distance >= 6900 && this.mode === "race") this.finish();
    if (Math.floor(this.distance / 900) !== this.lastHudDistance || this.collected !== this.lastHudStars) {
      this.lastHudDistance = Math.floor(this.distance / 900); this.lastHudStars = this.collected; this.updateHud();
    }
  }
}

class ClassicScene extends Phaser.Scene {
  constructor() { super("classic"); }
  create() {
    addWorldBackdrop(this, "island", false);
    setUI('<section class="panel finish-panel"><p class="eyebrow">CLASSIC DINO CAR</p><h1>Classic studio</h1><p>Open the original car studio with its established controls and collection.</p><button class="action-button drive-action" id="classic-open">Open classic studio</button></section>');
    ui.querySelector("#classic-open").addEventListener("click", () => { window.location.href = "../drive/index.html"; });
    this.events.once("shutdown", () => setUI(""));
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game-root",
  backgroundColor: "#69c8ff",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [HomeScene, CustomizeScene, GarageScene, DriveScene, ClassicScene],
  render: { antialias: true, pixelArt: false, roundPixels: false }
});
