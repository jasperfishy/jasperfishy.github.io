/* Dinosaur Universe — Dino Egg Dash (original Phaser chapter).
 * A baby T-rex hops over rocks and catches sparkly eggs. Ages 3–8.
 * All art is drawn on canvas at boot (no copied assets). */
import { chapters } from "../../chapters.js?v=du-9ab77cff6b9ebbf2";

const W = 960, H = 540;
const STORE_KEY = "dino-egg-dash-v1";
// Which story voices and ledger keys belong to this chapter: egg.dash.
window.DU_WORLD_ID = "egg";
const FX = () => window.DUFX;
const KIT = () => window.DUKit;

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const GAME = () => window.__DD && window.__DD.game;

// How far along the dash each mood of weather starts, and what it looks like.
// One table, one setStage() — so the backdrop, the sky and the sound always
// change together instead of drifting apart across three places.
const STAGES = [
  { at: 0, name: "Sunny Meadow", emoji: "🌤️", say: "Sun first! The eggs glisten in the grass.",
    veil: 0xffe9a8, alpha: 0.05, mtn: 0xffffff, hill: 0xffffff, ground: 0xffffff, cloud: 0.95,
    rain: false, night: false, flies: false, pace: 1, sfx: "chirp" },
  { at: 1500, name: "Pitter Patter", emoji: "🌧️", say: "Rain! Slippery grass, but the eggs still shine.",
    veil: 0x6f8fc4, alpha: 0.3, mtn: 0xa8c4e4, hill: 0x94b4d8, ground: 0xa8bcd0, cloud: 0.5,
    rain: true, night: false, flies: false, pace: 1.14, sfx: "splash" },
  { at: 3400, name: "Firefly Night", emoji: "🌙", say: "Night falls — the fireflies light the eggs for you.",
    veil: 0x232a63, alpha: 0.55, mtn: 0x606aa8, hill: 0x4e5890, ground: 0x6c76a8, cloud: 0.22,
    rain: false, night: true, flies: true, pace: 1.22, sfx: "sparkle" },
];

// The three things a baby dino can find: each one ticks down on screen.
const POWERS = {
  shield: { emoji: "🛡️", word: "Shield!", say: "A bubble! One bump cannot stop you.", colour: "#5fd4ff", secs: 9 },
  double: { emoji: "✨", word: "Double!", say: "Every egg now shines twice as bright.", colour: "#ffd76b", secs: 9 },
  giant: { emoji: "⬆️", word: "Giant hop!", say: "Legs like springs — one big bounce.", colour: "#b6f27a", secs: 9 },
};

// Stage callouts are asked for by the name say(); the story engine publishes the
// same thing as whisper(), so try that name first and fall back to the real one.
function callout(text, who) {
  const S = window.DUSTORY;
  if (!S) return;
  const fn = S.say || S.whisper;
  if (!fn) return;
  try { fn.call(S, text, who || "rex"); } catch (e) { /* narration is optional */ }
}

/* ------------------------------------------------------- texture factory */
// createCanvas is the synchronous route: addBase64 has to wait for an Image to
// decode, so the first frame was not there yet when the animation was built and
// Phaser logged "Missing animation: dd-dino".
function makeTexture(key, w, h, draw) {
  const g = GAME();
  if (!g || g.textures.exists(key)) return;
  const tex = g.textures.createCanvas(key, w, h);
  draw(tex.getContext(), w, h);
  tex.refresh();
}

function dinoFrames() {
  const drawDino = (ctx, w, h, hop, crouch) => {
    ctx.clearRect(0, 0, w, h);
    // Ducking squashes the whole drawing about the feet, so the hitbox and the
    // grass line never move — a crouch that slides the dino underground reads as
    // a bug, not as a duck.
    const cy = h - 14 + (hop ? -4 : 0);
    if (crouch) { ctx.translate(0, cy); ctx.scale(1.16, 0.6); ctx.translate(0, -cy); }
    ctx.fillStyle = "#5cb85c";
    ctx.beginPath(); ctx.moveTo(20, cy - 18); ctx.quadraticCurveTo(4, cy - 26, 2, cy - 38); ctx.quadraticCurveTo(16, cy - 30, 26, cy - 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#4a9e4a";
    ctx.beginPath(); ctx.ellipse(58, cy - 4, 10, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(86, cy - 4, 10, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5cb85c";
    ctx.beginPath(); ctx.ellipse(70, cy - 26, 34, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d9f2c4";
    ctx.beginPath(); ctx.ellipse(72, cy - 18, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#4a9e4a";
    ctx.beginPath(); ctx.ellipse(96, cy - 26, 7, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5cb85c";
    ctx.beginPath(); ctx.ellipse(106, cy - 52, 26, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(124, cy - 46, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#2f6b2f"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(116, cy - 46, 8, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(108, cy - 58, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#22334a";
    ctx.beginPath(); ctx.arc(110, cy - 58, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(112, cy - 60, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#4a9e4a";
    [[50, cy - 34], [66, cy - 40], [84, cy - 32]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
  };
  makeTexture("dd-dino-0", 150, 110, (ctx, w, h) => drawDino(ctx, w, h, false, false));
  makeTexture("dd-dino-1", 150, 110, (ctx, w, h) => drawDino(ctx, w, h, true, false));
  makeTexture("dd-dino-duck", 150, 110, (ctx, w, h) => drawDino(ctx, w, h, false, true));
}

function eggTexture() {
  makeTexture("dd-egg", 64, 76, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff8e7";
    ctx.beginPath(); ctx.ellipse(32, 40, 24, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#e8d8b0"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#f2b8c6";
    [[22, 30], [40, 44], [28, 54], [44, 26]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.beginPath(); ctx.ellipse(24, 26, 6, 9, -0.5, 0, Math.PI * 2); ctx.fill();
  });
}

function rockTexture() {
  makeTexture("dd-rock", 72, 56, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#8d8a83";
    ctx.beginPath();
    ctx.moveTo(8, 50); ctx.lineTo(2, 30); ctx.lineTo(14, 12); ctx.lineTo(34, 4); ctx.lineTo(56, 10); ctx.lineTo(70, 28); ctx.lineTo(66, 50); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#a5a29a";
    ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(34, 4); ctx.lineTo(56, 10); ctx.lineTo(40, 22); ctx.lineTo(20, 24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#6f6c64"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(34, 22); ctx.lineTo(30, 38); ctx.lineTo(38, 48); ctx.stroke();
  });
}

function cloudTexture() {
  makeTexture("dd-cloud", 180, 90, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,.95)";
    [[45, 55, 26], [80, 42, 34], [120, 52, 28], [150, 60, 18]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
  });
}

function hillTexture(key, color, amp, base) {
  // 512x256 on purpose: a TileSprite can only wrap a power-of-two texture, and
  // Phaser silently falls back to CLAMP_TO_EDGE otherwise. At 960x200 the hills
  // and the soil stopped drawing halfway across the screen as soon as the world
  // started scrolling, because the tile could not repeat.
  // Only whole sine cycles across the tile width, so the seam joins level.
  makeTexture(key, 512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      const t = x / w;
      const y = base + Math.sin(t * Math.PI * 4) * amp + Math.sin(t * Math.PI * 10 + 1.7) * amp * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  });
}

function groundTexture() {
  makeTexture("dd-ground", 512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#d8a35c"; ctx.fillRect(0, 26, w, h - 26);
    ctx.fillStyle = "#79c860"; ctx.fillRect(0, 0, w, 30);
    ctx.fillStyle = "#8fd874";
    // 32 and 64 divide 512 exactly, so the tufts and pebbles do not stutter at
    // the point where one tile ends and the next begins.
    for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x + 6, 30); ctx.lineTo(x + 16, 12); ctx.lineTo(x + 26, 30); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = "rgba(120,80,40,.35)";
    for (let x = 0; x < w; x += 64) {
      ctx.beginPath(); ctx.ellipse(x + 20, 56, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 46, 82, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
  });
}

function sunTexture() {
  makeTexture("dd-sun", 160, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grd = ctx.createRadialGradient(80, 80, 10, 80, 80, 78);
    grd.addColorStop(0, "rgba(255,236,150,.95)"); grd.addColorStop(1, "rgba(255,236,150,0)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffd93d"; ctx.beginPath(); ctx.arc(80, 80, 34, 0, Math.PI * 2); ctx.fill();
  });
}

/* The new things a dash runs into: a log to clear, a puddle to skip, a bough to
 * duck, and three glowing finds. All canvas, all drawn once at boot. */
function propsTextures() {
  makeTexture("dd-log", 132, 48, (ctx) => {
    ctx.clearRect(0, 0, 132, 48);
    ctx.fillStyle = "#8a5a34"; ctx.beginPath(); ctx.roundRect(4, 8, 124, 34, 17); ctx.fill();
    ctx.fillStyle = "#a56f42"; ctx.beginPath(); ctx.roundRect(10, 12, 112, 12, 8); ctx.fill();
    ctx.fillStyle = "#c79963"; ctx.beginPath(); ctx.ellipse(122, 25, 12, 19, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8a5a34"; ctx.lineWidth = 2;
    [6, 11].forEach((r) => { ctx.beginPath(); ctx.ellipse(122, 25, r, r * 1.5, 0, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = "#6b4526";
    [[26, 30], [52, 34], [80, 30]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); });
  });

  makeTexture("dd-puddle", 150, 30, (ctx) => {
    ctx.clearRect(0, 0, 150, 30);
    ctx.fillStyle = "#4fa8dc"; ctx.beginPath(); ctx.ellipse(75, 18, 72, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#8ed0f0"; ctx.beginPath(); ctx.ellipse(75, 15, 60, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    [[40, 14, 58, 12], [86, 20, 110, 18]].forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
  });

  makeTexture("dd-branch", 176, 60, (ctx) => {
    ctx.clearRect(0, 0, 176, 60);
    ctx.strokeStyle = "#7a5230"; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(6, 6); ctx.quadraticCurveTo(90, 26, 170, 20); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(70, 18); ctx.lineTo(96, 42); ctx.stroke();
    ctx.fillStyle = "#57a856";
    [[30, 22], [58, 30], [96, 46], [124, 26], [152, 22], [80, 14]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.ellipse(x, y, 17, 10, -0.4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "#78c676";
    [[34, 18], [62, 26], [100, 42]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 8, 4, -0.4, 0, Math.PI * 2); ctx.fill(); });
  });

  makeTexture("dd-golden", 66, 80, (ctx) => {
    ctx.clearRect(0, 0, 66, 80);
    const grd = ctx.createRadialGradient(24, 30, 6, 33, 44, 40);
    grd.addColorStop(0, "#fff6c8"); grd.addColorStop(0.5, "#ffd23f"); grd.addColorStop(1, "#c2870a");
    ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(33, 44, 25, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8a5a12"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.ellipse(24, 30, 7, 11, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff3a8";
    [[46, 26], [52, 56], [20, 60]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); });
  });

  makeTexture("dd-bubble", 150, 120, (ctx) => {
    ctx.clearRect(0, 0, 150, 120);
    ctx.fillStyle = "rgba(120,214,255,.3)"; ctx.beginPath(); ctx.ellipse(75, 60, 72, 57, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.ellipse(40, 32, 16, 9, -0.5, 0, Math.PI * 2); ctx.fill();
  });

  makeTexture("dd-moon", 130, 130, (ctx) => {
    ctx.clearRect(0, 0, 130, 130);
    const grd = ctx.createRadialGradient(65, 65, 20, 65, 65, 64);
    grd.addColorStop(0, "rgba(226,236,255,.55)"); grd.addColorStop(1, "rgba(226,236,255,0)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 130, 130);
    ctx.fillStyle = "#f2f6ff"; ctx.beginPath(); ctx.arc(65, 65, 36, 0, Math.PI * 2); ctx.fill();
    // A darker disc nibbling the edge is what makes it read as a crescent moon.
    ctx.fillStyle = "rgba(90,104,150,.55)"; ctx.beginPath(); ctx.arc(80, 56, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(200,214,240,.7)"; ctx.beginPath(); ctx.arc(52, 70, 6, 0, Math.PI * 2); ctx.fill();
  });

  makeTexture("dd-drop", 6, 24, (ctx) => {
    ctx.clearRect(0, 0, 6, 24);
    const grd = ctx.createLinearGradient(0, 0, 0, 24);
    grd.addColorStop(0, "rgba(190,226,255,0)"); grd.addColorStop(1, "rgba(190,226,255,.9)");
    ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(3, 12, 3, 12, 0, 0, Math.PI * 2); ctx.fill();
  });

  const orb = (key, ring, draw) => makeTexture(key, 64, 64, (ctx) => {
    ctx.clearRect(0, 0, 64, 64);
    const grd = ctx.createRadialGradient(24, 22, 4, 32, 32, 30);
    grd.addColorStop(0, "rgba(255,255,255,.95)"); grd.addColorStop(1, ring);
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3; ctx.stroke();
    draw(ctx);
  });
  orb("dd-p-shield", "#5fd4ff", (ctx) => {
    ctx.fillStyle = "#2f7fb8"; ctx.beginPath();
    ctx.moveTo(32, 16); ctx.lineTo(46, 22); ctx.lineTo(44, 38); ctx.quadraticCurveTo(32, 50, 20, 38); ctx.lineTo(18, 22);
    ctx.closePath(); ctx.fill();
  });
  orb("dd-p-double", "#ffd76b", (ctx) => {
    ctx.fillStyle = "#b8791a"; ctx.font = "bold 30px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("x2", 32, 34);
  });
  orb("dd-p-giant", "#b6f27a", (ctx) => {
    ctx.fillStyle = "#3f8a2f"; ctx.beginPath();
    ctx.moveTo(32, 14); ctx.lineTo(46, 32); ctx.lineTo(37, 32); ctx.lineTo(37, 50); ctx.lineTo(27, 50); ctx.lineTo(27, 32); ctx.lineTo(18, 32);
    ctx.closePath(); ctx.fill();
  });
}

/* Everything this world draws is generated at boot, once. It has to run from a
 * scene, not from preBoot: the renderer does not exist yet that early, and
 * Phaser throws when a canvas texture tries to upload. It used to run after a
 * READY promise, which resolved a microtask too late — TitleScene.create() had
 * already called play("dd-dino") on an animation that did not exist yet. */
function buildArt() {
  const g = GAME();
  if (!g) return;
  dinoFrames();
  eggTexture();
  rockTexture();
  cloudTexture();
  hillTexture("dd-mtn", "#b9d7a4", 45, 70);
  hillTexture("dd-hill", "#8fce74", 40, 110);
  groundTexture();
  sunTexture();
  propsTextures();
  if (!g.anims.exists("dd-dino")) {
    g.anims.create({
      key: "dd-dino",
      frames: [{ key: "dd-dino-0" }, { key: "dd-dino-1" }],
      frameRate: 10, repeat: -1,
    });
  }
}

/* --------------------------------------------------------------- scenes */
class TitleScene extends Phaser.Scene {
  constructor() { super("egg-title"); }
  create() {
    buildArt();
    this.add.image(36, 52, "dd-sun").setOrigin(0).setDepth(0);
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(120 + i * 260, 60 + rnd(60), "dd-cloud").setDepth(1).setAlpha(0.9);
      this.tweens.add({ targets: c, y: c.y + 10, duration: 2600 + i * 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    // A TileSprite is centred on its x by default, so at x=0 half of each layer
    // hung off the left edge of the canvas and the right half of the screen was
    // bare sky. These layers are laid out from the left, so they want origin 0.
    this.mtn = this.add.tileSprite(0, H - 260, W, 256, "dd-mtn").setOrigin(0).setDepth(2);
    this.hill = this.add.tileSprite(0, H - 210, W, 256, "dd-hill").setOrigin(0).setDepth(3);
    this.ground = this.add.tileSprite(0, H - 90, W, 90, "dd-ground").setOrigin(0).setDepth(4);
    this.dino = this.add.sprite(480, H - 120, "dd-dino-0").setDepth(5).setScale(1.4);
    this.dino.play("dd-dino");
    this.add.text(W / 2, 96, "DINO EGG DASH", { fontSize: "58px", fontFamily: KIT().FONT, fontStyle: "bold", color: "#ff7b39", stroke: "#fff6e8", strokeThickness: 10 }).setOrigin(0.5).setDepth(6);
    this.add.text(W / 2, 156, "Hop the rocks, duck the branches, catch the sparkly eggs!", { fontSize: "23px", fontFamily: KIT().FONT, color: "#5b4a2f", stroke: "#fff", strokeThickness: 6 }).setOrigin(0.5).setDepth(6);
    // The call to action used to sit at y=400, directly on top of the dino.
    this.btn = this.add.text(W / 2, 252, "TAP TO PLAY", { fontSize: "40px", fontFamily: KIT().FONT, fontStyle: "bold", color: "#ffffff", stroke: "#3c7a3c", strokeThickness: 8 }).setOrigin(0.5).setDepth(6);
    this.tweens.add({ targets: this.btn, scale: 1.12, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const best = this.registry.get("best");
    const earned = window.DUJourney ? DUJourney.stars("egg.dash") : 0;
    const record = [];
    if (best > 0) record.push("Best: " + best + " eggs");
    // The journey stars are what the campaign map keeps, so the title shows them
    // too — a child sees the same score here as they do on the map.
    if (earned > 0) record.push("🗺 " + "⭐".repeat(earned));
    if (record.length) this.add.text(W / 2, 300, record.join("   ·   "), { fontSize: "22px", fontFamily: KIT().FONT, color: "#7a5b2f", stroke: "#fff", strokeThickness: 5 }).setOrigin(0.5).setDepth(6);
    this.input.on("pointerdown", () => { KIT().sfx("tap"); if (window.DUSTORY) DUSTORY.hush(); this.scene.start("egg-play"); });
    this.time.delayedCall(560, () => KIT().voice(this, "intro", "dash"));
    this.t = 0;
  }
  update(t, dt) {
    this.t += dt / 1000;
    this.mtn.tilePositionX += dt * 0.02;
    this.hill.tilePositionX += dt * 0.05;
    this.ground.tilePositionX += dt * 0.09;
    this.dino.y = H - 120 + Math.sin(this.t * 3) * 4;
  }
}

class PlayScene extends Phaser.Scene {
  constructor() { super("egg-play"); }
  create() {
    buildArt();
    KIT().textures(this);
    this.lives = 3; this.eggs = 0; this.hit = false; this.over = false;
    this.scrollX = 0; this.baseSpeed = 240;
    this.spawnX = 560; this.pattern = 0;
    // New per-run state: how far the dash has got, and what it has found on the way.
    this.stage = 0; this.pace = 1; this.spark = 0; this.near = 0; this.golden = 0;
    this.power = { shield: 0, double: 0, giant: 0 };
    this.nextPower = 900; this.nextGold = 2200; this.hudT = 0;
    this.branches = []; this.treasures = []; this.flies = []; this.rain = null;
    this.ducking = false;

    this.sun = this.add.image(36, 52, "dd-sun").setOrigin(0).setDepth(0);
    this.moon = this.add.image(840, 66, "dd-moon").setDepth(0).setVisible(false);
    // One soft beam is what makes a moon look like it is lighting the grass.
    this.beam = this.add.rectangle(720, 300, 300, 620, 0xdfe9ff, 0.1).setOrigin(0.5, 0).setRotation(0.42).setDepth(1).setVisible(false);
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(120 + i * 260, 60 + rnd(60), "dd-cloud").setDepth(1);
      this.clouds.push(c);
    }
    // A TileSprite is centred on its x by default, so at x=0 half of each layer
    // hung off the left edge of the canvas and the right half of the screen was
    // bare sky. These layers are laid out from the left, so they want origin 0.
    this.mtn = this.add.tileSprite(0, H - 260, W, 256, "dd-mtn").setOrigin(0).setDepth(2);
    this.hill = this.add.tileSprite(0, H - 210, W, 256, "dd-hill").setOrigin(0).setDepth(3);
    this.ground = this.add.tileSprite(0, H - 90, W, 90, "dd-ground").setOrigin(0).setDepth(4);

    this.dino = this.physics.add.sprite(150, H - 125, "dd-dino-0").setDepth(5);
    this.dino.setCollideWorldBounds(true);
    this.dino.body.setSize(110, 70).setOffset(20, 30);
    this.dino.play("dd-dino");
    this.wasDown = true;
    // The arcade world is the full canvas, but the grass strip only starts at
    // H-90; without this the dino sank out of sight through the ground and never
    // registered a landing, so it could not jump a second time.
    this.physics.world.setBounds(0, 0, W, H - 90);

    // The rocks and eggs scroll past on a fixed track, so they are plain images
    // measured against the dino by hand rather than arcade bodies: static bodies
    // ignore `x` unless re-synced every frame, and group bodies inherit gravity,
    // which would have dropped every egg into the grass.
    this.rocks = [];
    this.eggList = [];

    // One tinted rectangle carries the weather: rain and night are the same
    // grass with a different colour over it, which is how it reads to a child.
    this.veil = this.add.rectangle(W / 2, H / 2, W, H, STAGES[0].veil, STAGES[0].alpha).setDepth(7);
    this.bubble = this.add.image(this.dino.x, this.dino.y, "dd-bubble").setDepth(6).setVisible(false).setAlpha(0.9);

    this.scoreT = this.add.text(24, 20, "", { fontSize: "30px", fontFamily: KIT().FONT, fontStyle: "bold", color: "#3c7a3c", stroke: "#fff", strokeThickness: 7 }).setDepth(8);
    this.heartT = this.add.text(W - 24, 20, "", { fontSize: "30px", fontFamily: KIT().FONT }).setOrigin(1, 0).setDepth(8);
    this.stageT = this.add.text(W / 2, 22, "", { fontSize: "22px", fontFamily: KIT().FONT, color: "#5b4a2f", stroke: "#fff", strokeThickness: 5 }).setOrigin(0.5, 0).setDepth(8);
    this.powerT = this.add.text(24, 60, "", { fontSize: "21px", fontFamily: KIT().FONT, color: "#2f5a8a", stroke: "#fff", strokeThickness: 5 }).setDepth(8);
    this.bars = this.add.graphics().setDepth(8);
    this.ui();

    // Tap the sky to hop, hold the grass to duck: two verbs, one thumb.
    this.input.on("pointerdown", (p) => { if (p && p.y > H - 150) this.duckOn(); else this.tap(); });
    this.input.on("pointerup", () => this.duckOff());
    this.input.on("pointerupoutside", () => this.duckOff());
    const kb = this.input.keyboard;
    if (kb) {
      kb.on("keydown-SPACE", () => this.tap());
      kb.on("keydown-UP", () => this.tap());
      kb.on("keydown-DOWN", () => this.duckOn());
      kb.on("keydown-S", () => this.duckOn());
      kb.on("keyup-DOWN", () => this.duckOff());
      kb.on("keyup-S", () => this.duckOff());
    }
  }

  ui() {
    this.scoreT.setText("\u{1F95C} " + this.eggs);
    this.heartT.setText(this.lives > 0 ? "\u{1F49A}".repeat(this.lives) : "");
    const st = STAGES[this.stage];
    this.stageT.setText(st.emoji + " " + st.name);
    this.powerHud();
  }

  // The finds count themselves down where the child can watch them go.
  powerHud() {
    const on = Object.keys(this.power).filter((k) => this.power[k] > 0);
    this.powerT.setText(on.length ? on.map((k) => POWERS[k].emoji + " " + this.power[k].toFixed(1) + "s").join("   ") : "");
    this.bars.clear();
    on.forEach((k, i) => {
      const y = 92 + i * 15, pct = Math.max(0, Math.min(1, this.power[k] / POWERS[k].secs));
      this.bars.fillStyle(0x2f4b6b, 0.35); this.bars.fillRoundedRect(24, y, 150, 11, 5);
      this.bars.fillStyle(Phaser.Display.Color.HexStringToColor(POWERS[k].colour).color, 1);
      this.bars.fillRoundedRect(25, y + 1, Math.max(7, 148 * pct), 9, 4);
    });
  }

  duckOn() {
    if (this.over || this.ducking) return;
    this.ducking = true;
    this.dino.anims.stop();
    this.dino.setTexture("dd-dino-duck");
    KIT().sfx("whoosh");
    KIT().burst(this, this.dino.x + 46, this.dino.body.bottom - 6, { n: 5, speed: 90, life: 260, gravity: 340, tint: 0xd9f2c4 });
  }

  duckOff() {
    if (!this.ducking) return;
    this.ducking = false;
    this.dino.setTexture("dd-dino-0");
    this.dino.play("dd-dino");
  }

  // One method moves the whole dash from sun to rain to night, so the sky, the
  // weather, the creatures and the pace can never disagree with each other.
  setStage(n) {
    if (n === this.stage || n < 0 || n >= STAGES.length) return;
    const st = STAGES[n];
    this.stage = n;
    this.pace = st.pace;
    this.veil.setFillStyle(st.veil, this.veil.fillAlpha);
    this.tweens.add({ targets: this.veil, fillAlpha: st.alpha, duration: 1400 });
    this.mtn.setTint(st.mtn); this.hill.setTint(st.hill); this.ground.setTint(st.ground);
    this.sun.setVisible(!st.night);
    this.moon.setVisible(st.night); this.beam.setVisible(st.night);
    this.clouds.forEach((c) => c.setAlpha(st.cloud));
    if (st.rain) this.rainOn(); else this.rainOff();
    if (st.flies) this.fliesOn(); else this.fliesOff();
    KIT().banner(this, st.emoji + " " + st.name);
    KIT().sfx(st.sfx);
    callout(st.say, "rex");
    this.ui();
  }

  rainOn() {
    if (this.rain) return;
    this.rain = this.add.particles(0, -30, "dd-drop", {
      x: { min: 0, max: W }, lifespan: 760, speedY: { min: 620, max: 780 }, speedX: { min: -50, max: -18 },
      alpha: { start: 0.85, end: 0.35 }, frequency: 24, quantity: 2
    }).setDepth(6).start();
    KIT().floatText(this, W / 2, 120, "Pitter patter!", "#bfe3ff");
  }

  rainOff() { if (!this.rain) return; this.rain.destroy(); this.rain = null; }

  // Fireflies wander and blink, so night in this world is something to look at
  // rather than something to hurry through.
  fliesOn() {
    if (this.flies.length) return;
    for (let i = 0; i < 16; i++) {
      const f = this.add.image(Phaser.Math.Between(60, W - 60), Phaser.Math.Between(150, H - 130), "kit-spark")
        .setTint(0xffe98a).setBlendMode(Phaser.BlendModes.ADD).setScale(Phaser.Math.FloatBetween(0.8, 1.6)).setAlpha(0).setDepth(6);
      this.tweens.add({ targets: f, alpha: { from: 0.1, to: 1 }, duration: Phaser.Math.Between(600, 1300), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1600) });
      this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-70, 70), y: f.y + Phaser.Math.Between(-44, 44),
        duration: Phaser.Math.Between(2600, 5200), yoyo: true, repeat: -1, ease: "sine.inOut" });
      this.flies.push(f);
    }
  }

  fliesOff() { this.flies.forEach((f) => f.destroy()); this.flies = []; }

  // Powers are timed, not permanent: the bar emptying is the child's cue.
  give(kind, secs) {
    const p = POWERS[kind];
    if (!p) return;
    const s = secs || p.secs;
    this.power[kind] = s;
    const show = kind === "shield";
    this.bubble.setVisible(show);
    if (show) { this.bubble.setAlpha(0.9).setScale(1); }
    KIT().sfx("good");
    KIT().banner(this, p.word);
    KIT().floatText(this, this.dino.x, this.dino.y - 74, p.emoji + " " + Math.round(s) + "s", p.colour);
    callout(p.say, "rex");
    this.powerHud();
  }

  spend(dt) {
    Object.keys(this.power).forEach((k) => {
      if (this.power[k] <= 0) return;
      this.power[k] = Math.max(0, this.power[k] - dt);
      if (this.power[k] > 0) return;
      // Out of power is said out loud, so the empty bar has a meaning.
      KIT().sfx("tap");
      if (k === "shield") this.bubble.setVisible(false);
      if (k === "giant") KIT().floatText(this, this.dino.x, this.dino.y - 60, "Small legs again", "#7a5b2f");
    });
  }

  treasure(x, y, kind) {
    const t = this.add.image(x, y, kind === "golden" ? "dd-golden" : "dd-p-" + kind).setDepth(4);
    t.kind = kind; t.baseY = y; t.setData("ph", Math.random() * 6);
    if (kind === "golden") {
      this.tweens.add({ targets: t, angle: { from: -12, to: 12 }, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: t, scale: 1.16, duration: 420, yoyo: true, repeat: -1 });
    } else {
      this.tweens.add({ targets: t, angle: 360, duration: 2600, repeat: -1 });
    }
    this.treasures.push(t);
    return t;
  }

  take(t) {
    const kind = t.kind, x = t.x, y = t.y;
    t.destroy();
    if (kind === "golden") {
      // Worth five eggs, and it says so in words a child can read: a rare find
      // nobody notices is just another rock.
      this.golden++; this.eggs += 5; this.spark += 5;
      KIT().sfx("win"); KIT().sfx("coin");
      KIT().banner(this, "GOLDEN EGG! +5");
      KIT().celebrate(this);
      KIT().floatText(this, x, y - 44, "+5 eggs!", "#ffd23f");
      callout("A golden egg! That is five eggs in one hop.", "rex");
    } else {
      this.give(kind);
    }
    this.ui();
  }

  // Just outside the hit box, but past the dino's nose: the dodge was real.
  close(other, hw, hh) {
    const dx = Math.abs(this.dino.body.center.x - other.x);
    const dy = Math.abs(this.dino.body.center.y - other.y);
    return dx < 48 + hw + 20 && dy < 30 + hh + 18;
  }

  nearMiss(o) {
    if (o.nearDone || o.x > this.dino.body.center.x + 8 || this.over) return;
    o.nearDone = true;
    this.near++;
    KIT().sfx("chirp");
    KIT().floatText(this, o.x, o.y - 46, "So close!", "#ff8ac4");
  }

  // `onGround` is only maintained for body-vs-body collisions, so a jump taken
  // from the world floor never armed it again: the dino could hop exactly once
  // per run. `blocked.down` is the flag the floor actually sets, and the velocity
  // test stops a stale flag from handing out a free mid-air second jump.
  grounded() {
    const b = this.dino.body;
    return b.blocked.down && b.velocity.y >= -1;
  }

  tap() {
    if (this.over) return;
    // A hop always ends a duck, so the two verbs cannot leave the dino crouched
    // in mid-air.
    if (this.ducking) this.duckOff();
    if (!this.grounded()) return;
    const big = this.power.giant > 0;
    this.dino.setVelocityY(big ? -1290 : -950);
    KIT().sfx(big ? "boing" : "jump");
    this.tweens.add({ targets: this.dino, scaleX: 1.14, scaleY: 0.86, duration: 90, yoyo: true, ease: "Sine.easeOut" });
    KIT().burst(this, this.dino.x, this.dino.y + 40, { n: big ? 12 : 6, speed: big ? 200 : 120, life: 320, gravity: 300, tint: 0xd9f2c4 });
    if (big) KIT().floatText(this, this.dino.x, this.dino.y - 60, "Giant hop!", "#b6f27a");
  }

  // spawnX is the scroll distance at which the next pattern walks in. The old
  // guard compared it with `scrollX + W + 120` and returned while it was behind
  // that, which was always true — so Egg Dash never produced a single rock or egg.
  spawn() {
    if (this.scrollX < this.spawnX) return;
    const x = W + 90;
    const p = this.pattern % 8;
    if (p === 0) {
      this.rock(x, H - 90 - 28);
    } else if (p === 1) {
      this.egg(x, H - 210); this.egg(x + 90, H - 240); this.egg(x + 180, H - 210);
    } else if (p === 2) {
      this.rock(x + 130, H - 90 - 28); this.egg(x - 120, H - 230);
    } else if (p === 3) {
      this.egg(x, H - 190); this.egg(x + 150, H - 250);
    } else if (p === 4) {
      this.log(x, H - 90 - 18); this.egg(x + 66, H - 250);
    } else if (p === 5) {
      this.puddle(x, H - 90 + 4); this.egg(x + 70, H - 200); this.egg(x + 150, H - 240);
    } else if (p === 6) {
      this.branch(x, H - 168); this.egg(x + 26, H - 148);
    } else {
      this.rock(x, H - 90 - 28); this.branch(x + 300, H - 168); this.egg(x + 150, H - 250);
    }
    this.pattern++;
    this.spawnX = this.scrollX + 380 + rnd(240) + (p === 1 ? 190 : 0) + (p === 7 ? 150 : 0);
    // Finds run on their own clock, so a power or a golden egg never lands in
    // the middle of a pattern the child is already reading.
    if (this.scrollX > this.nextPower) {
      this.nextPower = this.scrollX + 1500 + rnd(900);
      this.treasure(W + 250, H - 250, pick(["shield", "double", "giant"]));
    }
    if (this.scrollX > this.nextGold) {
      this.nextGold = this.scrollX + 3400 + rnd(1400);
      this.treasure(W + 330, H - 300, "golden");
    }
  }

  rock(x, y) {
    const r = this.add.image(x, y, "dd-rock").setDepth(4);
    r.kind = "rock";
    this.rocks.push(r);
    return r;
  }

  // A log is wide and low, so it wants one long hop instead of a quick nibble.
  log(x, y) {
    const r = this.add.image(x, y, "dd-log").setDepth(4);
    r.kind = "log";
    this.rocks.push(r);
    return r;
  }

  // A puddle is flat: the only way over it is off the ground.
  puddle(x, y) {
    const r = this.add.image(x, y, "dd-puddle").setDepth(4);
    r.kind = "puddle";
    this.rocks.push(r);
    return r;
  }

  // A bough hangs at head height, so it is the one thing a hop cannot solve.
  branch(x, y) {
    const b = this.add.image(x, y, "dd-branch").setDepth(4);
    b.kind = "branch";
    this.branches.push(b);
    return b;
  }

  egg(x, y) {
    const e = this.add.image(x, y, "dd-egg").setDepth(4);
    e.baseY = y;
    e.setData("ph", Math.random() * 6);
    this.tweens.add({ targets: e, angle: 14, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.eggList.push(e);
  }

  // Boxes a little smaller than the art, so a near miss reads as a catch or a
  // dodge rather than a unfair bump — the usual courtesy in a game for small hands.
  touch(other, hw, hh) {
    const dx = this.dino.body.center.x - other.x;
    const dy = this.dino.body.center.y - other.y;
    return Math.abs(dx) < 48 + hw && Math.abs(dy) < 30 + hh;
  }

  checkHits() {
    for (let i = this.eggList.length - 1; i >= 0; i--) {
      const e = this.eggList[i];
      if (this.touch(e, 24, 30)) { this.grabEgg(e); this.eggList.splice(i, 1); }
    }
    for (let i = this.treasures.length - 1; i >= 0; i--) {
      const t = this.treasures[i];
      if (this.touch(t, t.kind === "golden" ? 24 : 28, 30)) { this.take(t); this.treasures.splice(i, 1); }
    }
    if (this.hit || this.over) return;
    // A bough only bites a dino that is standing up: the duck is the dodge.
    for (const b of this.branches) {
      if (!this.touch(b, 44, 16)) { if (this.close(b, 44, 16)) this.nearMiss(b); continue; }
      if (this.ducking) { this.nearMiss(b); continue; }
      this.hitRock(b);
      return;
    }
    for (const r of this.rocks) {
      if (this.touch(r, 28, 20)) { this.hitRock(r); return; }
      if (this.close(r, 28, 20)) this.nearMiss(r);
    }
  }

  grabEgg(e) {
    this.eggs++;
    const shine = this.power.double > 0 ? 2 : 1;
    this.spark += shine;
    this.ui();
    KIT().sfx(shine > 1 ? "star" : "coin");
    KIT().burst(this, e.x, e.y, { n: shine > 1 ? 26 : 18, speed: 200, life: 520, gravity: 220, tint: shine > 1 ? 0xffd76b : 0xffe14d });
    KIT().floatText(this, e.x, e.y - 30, shine > 1 ? "+1 egg, x2 shine!" : "+1 egg!", "#2f7a3f");
    e.destroy();
  }

  hitRock(r) {
    if (this.power.shield > 0) {
      // The bubble eats this bump and pops: the bar running out is the price,
      // and the child watched it being paid.
      this.power.shield = 0;
      this.hit = true;
      KIT().sfx("good"); KIT().sfx("pop");
      KIT().floatText(this, this.dino.x, this.dino.y - 74, "Shield held!", "#5fd4ff");
      this.tweens.add({ targets: this.bubble, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 220,
        onComplete: () => { this.bubble.setVisible(false).setScale(1).setAlpha(0.9); } });
      this.time.delayedCall(650, () => { this.hit = false; });
      this.powerHud();
      return;
    }
    this.hit = true;
    this.lives--;
    this.ui();
    // Water, wood and rock each sound different, so a bump is never mysterious.
    KIT().sfx(r.kind === "puddle" ? "splash" : r.kind === "log" ? "thud" : "bad");
    this.cameras.main.shake(220, 0.012);
    KIT().burst(this, this.dino.x, this.dino.y, { n: r.kind === "puddle" ? 20 : 14, speed: r.kind === "puddle" ? 220 : 180, life: 460, gravity: 260, tint: r.kind === "puddle" ? 0x8ed0f0 : 0xff6b6b });
    r.setTintFill(0xff9f9f);
    this.time.delayedCall(320, () => { if (r.active) r.clearTint(); });
    // Blink while the grace window is open so the free pass is visible, not magic.
    this.tweens.add({ targets: this.dino, alpha: 0.35, duration: 110, yoyo: true, repeat: 3 });
    this.time.delayedCall(700, () => { this.hit = false; this.dino.setAlpha(1); });
    if (this.lives <= 0) this.end();
  }

  end() {
    this.over = true;
    if (this.ducking) this.duckOff();
    this.rainOff();
    this.fliesOff();
    const best = Math.max(this.registry.get("best") || 0, this.eggs);
    this.registry.set("best", best);
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ best })); } catch (e) {}
    const stars = this.eggs >= 12 ? 3 : this.eggs >= 6 ? 2 : this.eggs >= 1 ? 1 : 0;
    KIT().sfx(stars > 0 ? "win" : "lose");
    // "egg-dash" was a key the campaign map could not read, so every egg caught
    // here stayed invisible on the journey.
    if (window.DUJourney) window.DUJourney.record("egg.dash", { stars });
    if (window.DUWONDER) DUWONDER.mote(stars >= 3 ? 3 : 1);
    const J = window.DUJourney;
    // The line tells the story of the run: how far the weather got, and the
    // things only a long dash turns up.
    const found = [];
    if (this.spark > this.eggs) found.push("✨ " + this.spark);
    if (this.golden) found.push("\u{1F31F} " + this.golden);
    if (this.near) found.push("💨 " + this.near);
    KIT().endPanel(this, {
      title: stars > 0 ? "EGGS HATCHED!" : "OH NO!",
      line: this.eggs + " egg" + (this.eggs === 1 ? "" : "s") + " caught · " + STAGES[this.stage].emoji + " " + STAGES[this.stage].name +
        (found.length ? " · " + found.join(" ") : ""),
      best: "Best: " + best + " 🥚" + (J ? " · 🗺 " + J.total() + " stars" : ""),
      stars,
      voiceId: "dash",
      again: "TAP TO PLAY AGAIN",
    }, () => this.scene.restart());
  }

  update(t, dt) {
    if (this.over) return;
    // The stage sets the pace, so rain and night feel like a push, not a new game.
    const s = (this.baseSpeed + Math.min(220, this.scrollX * 0.01)) * this.pace;
    this.scrollX += s * dt / 1000;
    this.mtn.tilePositionX = this.scrollX * 0.15;
    this.hill.tilePositionX = this.scrollX * 0.32;
    this.ground.tilePositionX = this.scrollX;
    this.clouds.forEach((c, i) => { c.x -= dt * 0.02 * (i % 2 ? 1.4 : 1); if (c.x < -100) c.x = W + 100; });

    const step = s * dt / 1000;
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.x -= step;
      if (r.x < -120) { r.destroy(); this.rocks.splice(i, 1); }
    }
    for (let i = this.eggList.length - 1; i >= 0; i--) {
      const e = this.eggList[i];
      e.x -= step;
      e.y = e.baseY + Math.sin(t / 260 + e.getData("ph")) * 9;
      if (e.x < -120) { e.destroy(); this.eggList.splice(i, 1); }
    }
    for (let i = this.branches.length - 1; i >= 0; i--) {
      const b = this.branches[i];
      b.x -= step;
      if (b.x < -140) { b.destroy(); this.branches.splice(i, 1); }
    }
    for (let i = this.treasures.length - 1; i >= 0; i--) {
      const o = this.treasures[i];
      o.x -= step;
      o.y = o.baseY + Math.sin(t / 300 + o.getData("ph")) * 12;
      if (o.x < -120) { o.destroy(); this.treasures.splice(i, 1); }
    }

    this.spawn();
    this.checkHits();

    if (this.stage + 1 < STAGES.length && this.scrollX > STAGES[this.stage + 1].at) this.setStage(this.stage + 1);
    this.spend(dt / 1000);
    if (this.bubble.visible) {
      this.bubble.setPosition(this.dino.x + 6, this.dino.body.bottom - 44);
    }
    // The find timers are read ten times a second: enough to see them go, not
    // enough to blur the digits or redraw the bars every frame.
    this.hudT += dt;
    if (this.hudT > 100) { this.hudT = 0; this.powerHud(); }

    const down = this.grounded();
    if (down && !this.wasDown) {
      this.tweens.add({ targets: this.dino, scaleX: 1.16, scaleY: 0.84, duration: 110, yoyo: true, ease: "Sine.easeOut" });
      KIT().burst(this, this.dino.x, this.dino.y + 34, { n: 4, speed: 90, life: 260, gravity: 400, size: 3, tint: 0xd9f2c4 });
    }
    this.wasDown = down;
  }
}

/* ----------------------------------------------------------------- boot */
async function main() {
  let best = 0;
  try { best = (JSON.parse(localStorage.getItem(STORE_KEY)) || {}).best || 0; } catch (e) {}
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: W, height: H,
    parent: "game-root",
    backgroundColor: "#bfe8ff",
    // The config had no physics world at all, so "TAP TO PLAY" threw
    // "Cannot read properties of undefined (reading 'add')" on the first frame of
    // the actual game — the title screen worked and nothing past it ever did.
    physics: { default: "arcade", arcade: { gravity: { y: 2600 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [TitleScene, PlayScene],
  });
  window.__DD = { game };
  game.registry.set("best", best);
  if (window.parent !== window) {
    const id = chapters.find((c) => c.id === "egg-dash");
    if (id) window.parent.postMessage({ type: "du-chapter", id: id.id, title: id.title }, location.origin);
  }
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && game.scene.isActive("egg-play")) {
      const m = game.scene;
      m.getScenes(true).forEach((s) => { if (s.sys.settings.key !== "egg-title") m.stop(s.sys.settings.key); });
      if (!m.isActive("egg-title")) m.start("egg-title");
    }
  });
}
main();
