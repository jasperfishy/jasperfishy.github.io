// Dino Car Studio — Phaser 3 endless runner: a four-biome day cycle, three ways to
// read the road, a combo that fades, a boost with a trail, and near misses worth a "phew!".
const W = 960, H = 540;
const GROUND_Y = 420;
const STORE_KEY = "dino-car-studio-phaser-v1";
const HUB_KEY = "dino-car-studio-v1";
const STAR_STEPS = [6, 15, 30];
// Biomes light the child's own chosen scene four different ways as they drive.
const BIOMES = [
  { name: "Sunrise", at: 0,    skyA: 1.06, skyB: 1.06, veil: 0,    rain: false, par: 1,    sun: 0xffe27a, star: 0,
    line: "Sunrise on the road. Everything is clear and golden!" },
  { name: "Rainy",   at: 250,  skyA: 0.7,  skyB: 0.84, veil: 0.16, rain: true,  par: 1.1,  sun: 0xd8e6f2, star: 0,
    line: "Rain! Watch for puddles and keep your eyes on the road." },
  { name: "Dusk",    at: 620,  skyA: 0.88, skyB: 0.56, veil: 0.24, rain: false, par: 1.22, sun: 0xff9f5c, star: 8,
    line: "The sun is going to bed. Dusk is warm and windy." },
  { name: "Night",   at: 1040, skyA: 0.34, skyB: 0.3,  veil: 0.46, rain: false, par: 1.34, sun: 0xdfe9ff, star: 30,
    line: "Night time! Your headlights are on — hop when you see a shape." }
];
// Each obstacle asks for a different answer: a small hop, a wide hop, or ducking flat
// (the leaf curtain hangs too low to clear with a jump).
const OB_KINDS = {
  rock:   { dy: 6,   scale: 0.72, bw: 52,  bh: 52  },
  log:    { dy: 6,   scale: 0.66, bw: 120, bh: 36  },
  branch: { dy: -12, scale: 1,    bw: 130, bh: 170 }
};
const DAY_SPAN = 1500;    // metres per full day cycle; the next lap drives faster
const COMBO_HOLD = 2300;  // ms a combo stays full before it starts fading away
let skipTitle = false;
// Tells the shared kit which story voice belongs to this scene: drive.run.
window.DU_WORLD_ID = "drive";

// The end panel used to show a private number nobody else in the universe
// agreed with. This says the same thing the campaign map says.
function bestLine(best, metres, sparks) {
  const J = window.DUJourney;
  return "Best " + best + (metres ? " · " + metres + " m" : "") + (sparks ? " · ✨ " + sparks : "") + (J ? " · 🗺 " + J.total() + " stars" : "");
}

// The studio's saved choices: car colour, stickers, name and the world picked on its home screen.
const SCENE_PALETTES = {
  island:   { label: "Island Road",     skyA: 0x69c8ff, skyB: 0xd7f5ff, ground: 0x78c86b, road: 0x586879, line: 0xfff2a6, hill: 0x56b975, mount: 0xffffff, trees: 0xffffff, sun: 0xffe27a },
  city:     { label: "Dino City",       skyA: 0x79bfff, skyB: 0xe6f2ff, ground: 0x74bd73, road: 0x546277, line: 0xffe081, hill: 0x8ea9c2, mount: 0xc4d6ea, trees: 0xb9c8d8, sun: 0xffe27a },
  mountain: { label: "Mountain Pass",   skyA: 0x6fb9ed, skyB: 0xe8f6ff, ground: 0x6ba96d, road: 0x606b72, line: 0xfff6d0, hill: 0x397c62, mount: 0xffffff, trees: 0xa8d6bd, sun: 0xffe27a },
  snow:     { label: "Snowy Valley",    skyA: 0x91ddff, skyB: 0xf7fdff, ground: 0xeaf8ff, road: 0x9cb9ca, line: 0xffffff, hill: 0xf8fdff, mount: 0xe8f4ff, trees: 0xbfe6df, sun: 0xfff6c8 },
  desert:   { label: "Amber Desert",    skyA: 0x75d5eb, skyB: 0xffefc7, ground: 0xedc175, road: 0xbd966c, line: 0xfff1bb, hill: 0xf3bd71, mount: 0xe8a56a, trees: 0xe0a46a, sun: 0xffd35f },
  space:    { label: "Moonbeam Circuit", skyA: 0x142652, skyB: 0x4d387b, ground: 0x43366e, road: 0x303b63, line: 0x91edff, hill: 0x5a4a95, mount: 0x7a68b4, trees: 0x6f5fb0, sun: 0xd68bff }
};
function readStudio() {
  const out = { paint: "#2ecc71", name: "", stickers: [], scene: "island" };
  try {
    const o = JSON.parse(localStorage.getItem(HUB_KEY)) || {};
    const c = o.config || {};
    if (/^#[0-9a-f]{6}$/i.test(c.paint || "")) out.paint = c.paint;
    out.name = String(c.name || "").slice(0, 12);
    if (Array.isArray(c.stickers)) out.stickers = c.stickers.slice(0, 4).map(String);
    if (SCENE_PALETTES[o.selectedScene]) out.scene = o.selectedScene;
  } catch (e) { /* use defaults */ }
  return out;
}
const STUDIO = readStudio();
const PAL = SCENE_PALETTES[STUDIO.scene];
const paintColor = (amt) => { const c = Phaser.Display.Color.HexStringToColor(STUDIO.paint); return amt < 0 ? c.darken(-amt).color : c.lighten(amt).color; };
// Biome light is the chosen scene's own colours dimmed or warmed, never replaced.
const shade = (c, k) => { const x = Phaser.Display.Color.IntegerToColor(c); return Phaser.Display.Color.GetColor(Math.min(255, Math.round(x.red * k)), Math.min(255, Math.round(x.green * k)), Math.min(255, Math.round(x.blue * k))); };
const mixInt = (a, b, k) => { const x = Phaser.Display.Color.IntegerToColor(a), y = Phaser.Display.Color.IntegerToColor(b); return Phaser.Display.Color.GetColor(Math.round(Phaser.Math.Linear(x.red, y.red, k)), Math.round(Phaser.Math.Linear(x.green, y.green, k)), Math.round(Phaser.Math.Linear(x.blue, y.blue, k))); };
// Stage callouts have no narration key of their own, so a friend says them live.
const say = (text, who) => { try { const S = window.DUSTORY; if (S && S.whisper) S.whisper(text, who || "zip"); } catch (e) { /* story is optional */ } };
// The runner's own key: { best: stars gathered, metres: how far the kart got }.
function readStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }

class PlayScene extends Phaser.Scene {
  constructor() { super("play"); }

  preload() {
    this.load.image("photoDriver", "../../assets/prehistoric/trex-head.png");
    DUKit.textures(this);
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Kart body (wheels and driver are separate so they can animate).
    g.fillStyle(paintColor(-30), 1); g.fillRoundedRect(0, 12, 14, 6, 2); g.fillRoundedRect(2, 14, 5, 18, 2);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(STUDIO.paint).color, 1); g.fillRoundedRect(6, 22, 78, 22, 9);
    g.fillStyle(paintColor(30), 1); g.fillRoundedRect(10, 24, 66, 5, 3);
    g.fillStyle(0xbfe6ff, 1); g.fillRoundedRect(32, 6, 34, 18, 7);
    g.fillStyle(0xffe27a, 1); g.fillCircle(82, 32, 4);
    g.generateTexture("carBody", 90, 46);

    g.clear();
    g.fillStyle(0x222222, 1); g.fillCircle(13, 13, 13);
    g.lineStyle(3, 0x666666, 1);
    for (let i = 0; i < 5; i++) { const a = (Math.PI * 2 / 5) * i; g.lineBetween(13, 13, 13 + Math.cos(a) * 10, 13 + Math.sin(a) * 10); }
    g.fillStyle(0xcfd8e3, 1); g.fillCircle(13, 13, 5);
    g.generateTexture("wheel", 26, 26);

    g.clear();
    g.fillStyle(0x439f54, 1); g.fillTriangle(4, 8, 8, 0, 12, 8); g.fillTriangle(12, 6, 17, 0, 21, 8);
    g.fillStyle(0x58c26a, 1); g.fillCircle(15, 17, 12);
    g.fillStyle(0xffffff, 1); g.fillCircle(20, 14, 5);
    g.fillStyle(0x222222, 1); g.fillCircle(22, 14, 2.4);
    g.generateTexture("dinoHead", 32, 32);

    // Rock, log, star, egg (outlined and high-contrast).
    g.clear();
    g.fillStyle(0x6b7079, 1); g.lineStyle(5, 0x23262c, 1);
    g.fillRoundedRect(4, 14, 68, 56, 18); g.strokeRoundedRect(4, 14, 68, 56, 18);
    g.fillStyle(0x8b919b, 1); g.fillRoundedRect(16, 4, 40, 36, 14); g.strokeRoundedRect(16, 4, 40, 36, 14);
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(24, 12, 14, 8, 4);
    g.generateTexture("rock", 76, 74);

    g.clear();
    g.fillStyle(0x7a4a24, 1); g.lineStyle(5, 0x2b1708, 1);
    g.fillRoundedRect(6, 12, 130, 44, 18); g.strokeRoundedRect(6, 12, 130, 44, 18);
    g.lineStyle(3, 0x4a2a10, 1); g.lineBetween(30, 22, 112, 22); g.lineBetween(24, 34, 118, 34); g.lineBetween(30, 46, 112, 46);
    g.fillStyle(0xd9a064, 1); g.lineStyle(5, 0x2b1708, 1); g.fillCircle(130, 34, 22); g.strokeCircle(130, 34, 22);
    g.lineStyle(3, 0x9a6431, 1); g.strokeCircle(130, 34, 13); g.strokeCircle(130, 34, 5);
    g.generateTexture("log", 156, 70);

    g.clear();
    g.fillStyle(0xffffff, 0.5); g.fillCircle(44, 44, 42);
    g.fillStyle(0xffd23f, 1); g.lineStyle(5, 0xc2610a, 1);
    const star = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 === 0 ? 32 : 14, an = (Math.PI / 5) * i - Math.PI / 2; star.push({ x: 44 + Math.cos(an) * r, y: 46 + Math.sin(an) * r }); }
    g.fillPoints(star, true); g.strokePoints(star, true);
    g.fillStyle(0xfff6b0, 1); g.fillCircle(44, 44, 6);
    g.generateTexture("star", 88, 88);

    g.clear();
    g.fillStyle(0xffffff, 0.5); g.fillCircle(44, 44, 42);
    g.fillStyle(0xfff0c8, 1); g.lineStyle(5, 0x8a5a2b, 1);
    g.fillEllipse(44, 48, 44, 56); g.strokeEllipse(44, 48, 44, 56);
    g.fillStyle(0xc9854a, 1); g.fillCircle(36, 40, 5); g.fillCircle(52, 54, 6); g.fillCircle(40, 60, 4);
    g.generateTexture("egg", 88, 88);

    // Coin (a gold ring) and a leafy curtain you have to duck under.
    g.clear();
    g.fillStyle(0xffffff, 0.45); g.fillCircle(32, 32, 30);
    g.fillStyle(0xffd23f, 1); g.lineStyle(4, 0xc2610a, 1);
    g.fillCircle(32, 32, 24); g.strokeCircle(32, 32, 24);
    g.fillStyle(0xffe9a0, 1); g.fillCircle(32, 32, 14);
    g.fillStyle(0xc2610a, 1); g.fillCircle(26, 26, 4); g.fillCircle(38, 30, 4); g.fillCircle(31, 40, 4);
    g.generateTexture("coin", 64, 64);

    g.clear();
    g.fillStyle(0x6b4a24, 1); g.lineStyle(4, 0x33200e, 1);
    g.fillRoundedRect(4, 4, 162, 30, 12); g.strokeRoundedRect(4, 4, 162, 30, 12);
    for (let i = 0; i < 6; i++) {
      const x = 12 + i * 26;
      g.fillStyle(i % 2 ? 0x3fae6c : 0x2f8f57, 1);
      g.fillEllipse(x, 62, 30, 54); g.fillEllipse(x + 12, 96, 26, 46); g.fillEllipse(x + 4, 128, 22, 38);
    }
    g.generateTexture("branch", 170, 150);

    // Night headlight cone, soft-edged by stacking three alpha triangles.
    g.clear();
    for (let i = 0; i < 3; i++) { g.fillStyle(0xfff2b0, 0.12); g.fillTriangle(0, 45, 210, 45 - (34 - i * 9), 210, 45 + (34 - i * 9)); }
    g.generateTexture("beam", 210, 90);

    // Parallax layers.
    g.clear();
    g.fillStyle(0x9ec7df, 1); g.fillTriangle(0, 140, 110, 30, 220, 140); g.fillTriangle(150, 140, 280, 10, 410, 140);
    g.fillStyle(0xffffff, 0.9); g.fillTriangle(95, 50, 110, 30, 125, 52); g.fillTriangle(262, 30, 280, 10, 298, 32);
    g.generateTexture("mountains", 410, 140);

    g.clear();
    g.fillStyle(PAL.hill, 1); g.fillEllipse(80, 80, 160, 90);
    g.generateTexture("hill", 160, 90);

    g.clear();
    g.fillStyle(0x7a5a3a, 1); g.fillRect(34, 74, 10, 40); g.fillRect(154, 82, 9, 32);
    g.fillStyle(0x2f8f57, 1); g.fillCircle(40, 56, 30); g.fillStyle(0x3fae6c, 1); g.fillCircle(160, 60, 26);
    g.generateTexture("trees", 200, 116);

    g.clear();
    g.fillStyle(0xffffff, 0.92); g.fillEllipse(30, 22, 60, 26); g.fillEllipse(62, 16, 44, 22);
    g.generateTexture("cloud", 94, 40);

    g.clear();
    g.fillStyle(PAL.road, 1); g.fillRect(0, 0, 120, 16);
    g.fillStyle(PAL.line, 1); g.fillRect(0, 6, 60, 4);
    g.generateTexture("track", 120, 16);
    g.destroy();
    // The boost pad is a bolt of lightning, painted like the rest of the road art.
    DUKit.emoji(this, "boost", "⚡", 56);
  }

  create() {
    this.speed = 320;
    this.score = 0;
    this.chain = 0;
    this.sparks = 0;
    this.best = DUKit.getBest(STORE_KEY);
    this.bestMetres = Number(readStore().metres) || 0;
    this.metres = 0;
    this.boost = 0;
    this.duckUntil = 0;
    this.chainUntil = 0;
    this.chainFade = 0;
    this.stageCount = 0;
    this.biome = 0;
    this.lap = 1;
    this.par = 1;
    this.phewUntil = 0;
    this.wasDucking = false;
    this.gameOver = false;
    this.ready = false;
    this.wasGrounded = true;

    // Sky, sun, rays, sparkles — the sky is repainted whenever setStage moves on.
    this.sky = this.add.graphics();
    this.skyCur = [PAL.skyA, PAL.skyB];
    this.skyFrom = [PAL.skyA, PAL.skyB];
    this.skyTo = [PAL.skyA, PAL.skyB];
    this.skyMix = 1;
    this.paintSky();
    this.rays = DUKit.sunRays(this, 820, 96, 200, PAL.sun);
    this.sun = this.add.circle(820, 96, 42, PAL.sun, 1).setDepth(0);
    this.tweens.add({ targets: this.sun, scale: 1.08, duration: 1800, yoyo: true, repeat: -1, ease: "sine.inOut" });
    DUKit.sparkleField(this, STUDIO.scene === "space" ? 40 : 10, STUDIO.scene === "space" ? 0 : 600, 20, 940, STUDIO.scene === "space" ? 300 : 170, 0xffffff);
    // A night sky full of twinkles, kept invisible until setStage asks for it.
    this.starField = [];
    for (let i = 0; i < 30; i++) {
      this.starField.push(this.add.image(Phaser.Math.Between(20, W - 20), Phaser.Math.Between(16, 250), "kit-spark")
        .setScale(Phaser.Math.FloatBetween(0.4, 0.9)).setAlpha(0).setDepth(1));
      this.tweens.add({ targets: this.starField[i], alpha: { from: 0, to: 0.9 }, angle: 40, duration: Phaser.Math.Between(600, 1500), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1800) });
    }

    this.mountains = this.add.tileSprite(W / 2, GROUND_Y - 112, W, 140, "mountains").setAlpha(0.9).setTint(PAL.mount);
    this.clouds = this.add.tileSprite(W / 2, 70, W, 40, "cloud").setAlpha(0.9);
    this.clouds2 = this.add.tileSprite(W / 2, 140, W, 40, "cloud").setAlpha(0.6);
    this.clouds2.tilePositionX = 40;
    this.hills = this.add.tileSprite(W / 2, GROUND_Y - 50, W, 90, "hill");
    this.trees = this.add.tileSprite(W / 2, GROUND_Y - 56, W, 116, "trees").setAlpha(0.95).setTint(PAL.trees);

    this.add.rectangle(W / 2, (GROUND_Y + H) / 2, W, H - GROUND_Y, PAL.ground);
    this.track = this.add.tileSprite(W / 2, GROUND_Y + 8, W, 16, "track");
    // One darkening rectangle is the whole "light" of a biome.
    this.veil = this.add.rectangle(W / 2, H / 2, W, H, 0x0d1436, 0).setDepth(42);
    this.beam = this.add.image(0, 0, "beam").setOrigin(0, 0.5).setDepth(43).setAlpha(0);

    // Physics: an invisible hitbox; the pretty kart follows it.
    this.physics.world.gravity.y = 2200;
    this.groundBody = this.physics.add.staticGroup();
    this.groundBody.add(this.add.rectangle(W / 2, GROUND_Y, W, 80, 0x000000, 0).setOrigin(0.5, 0));
    this.hit = this.physics.add.sprite(150, GROUND_Y - 20, "kit-dot").setVisible(false);
    this.hit.body.setSize(66, 40);
    this.physics.add.collider(this.hit, this.groundBody);

    // Visual kart.
    this.shadow = this.add.ellipse(150, GROUND_Y + 4, 84, 12, 0x0a121e, 0.28).setDepth(4);
    this.car = this.add.container(150, GROUND_Y).setDepth(5);
    this.wheelB = this.add.image(-28, -13, "wheel");
    this.wheelF = this.add.image(30, -13, "wheel");
    this.carBody = this.add.image(0, -10, "carBody").setOrigin(0.5, 1);
    this.driver = this.add.image(4, -50, "photoDriver").setDisplaySize(42,38).setOrigin(0.5, 0.7);
    this.car.add([this.wheelB, this.wheelF, this.carBody, this.driver]);
    STUDIO.stickers.forEach((e, i) => this.car.add(this.add.text(-33 + i * 22, -23, e, { fontSize: "15px" }).setOrigin(0.5)));
    if (STUDIO.name) this.car.add(this.add.text(0, -86, STUDIO.name, { fontSize: "14px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#17403a", strokeThickness: 4 }).setOrigin(0.5));
    this.tweens.add({ targets: this.driver, angle: { from: -6, to: 6 }, y: -53, duration: 420, yoyo: true, repeat: -1, ease: "sine.inOut" });

    // Dust behind the wheels, wind streaks at speed, rain, road splashes, boost trail.
    this.dust = this.add.particles(0, 0, "kit-dot", {
      speed: { min: 20, max: 70 }, angle: { min: 150, max: 210 }, scale: { start: 0.5, end: 0 },
      alpha: { start: 0.55, end: 0 }, lifespan: 320, frequency: 55, tint: 0xd9c49a
    }).setDepth(4);
    this.dust.startFollow(this.car, -44, -4);
    this.wind = this.add.particles(W + 20, 0, "kit-dot", {
      y: { min: 60, max: GROUND_Y - 30 }, speedX: { min: -1100, max: -800 }, lifespan: 600, scaleX: { start: 5, end: 3 }, scaleY: 0.12,
      alpha: { start: 0.45, end: 0 }, frequency: 40, tint: 0xffffff, emitting: false
    }).setDepth(2);
    this.rain = this.add.particles(W + 40, -30, "kit-dot", {
      x: { min: 0, max: W + 60 }, y: { min: -40, max: -10 }, speedX: { min: -360, max: -280 }, speedY: { min: 620, max: 860 },
      lifespan: 760, scaleX: { start: 0.16, end: 0.1 }, scaleY: { start: 3.2, end: 2.4 }, alpha: { start: 0.7, end: 0.15 },
      frequency: 24, tint: 0xcfe6ff, emitting: false
    }).setDepth(46);
    this.splash = this.add.particles(0, GROUND_Y + 2, "kit-dot", {
      speed: { min: 40, max: 130 }, angle: { min: 240, max: 300 }, lifespan: 320, scale: { start: 0.35, end: 0 },
      alpha: { start: 0.8, end: 0 }, frequency: 220, tint: 0xbfe3ff, emitting: false
    }).setDepth(46);
    this.trail = this.add.particles(0, 0, "kit-spark", {
      speed: { min: 30, max: 120 }, angle: { min: 160, max: 200 }, lifespan: 520, scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 }, quantity: 3, frequency: 26, tint: [0xffe14d, 0xff9f43, 0x7be0ff], emitting: false
    }).setDepth(48);
    this.trail.startFollow(this.car, -46, -18);

    // Gameplay groups.
    this.obstacles = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.physics.add.collider(this.hit, this.obstacles, () => this.crash(), (h, o) => this.canBump(h, o), this);
    this.physics.add.overlap(this.hit, this.collectibles, (p, item) => this.collect(item), null, this);
    this.spawnTimer = this.time.addEvent({ delay: 1500, callback: () => this.spawnObstacle(), loop: true, paused: true });
    this.itemTimer = this.time.addEvent({ delay: 1100, callback: () => this.spawnLine(), loop: true, paused: true });

    // HUD
    this.starIcon = this.add.image(36, 36, "kit-star").setScale(0.9).setDepth(60);
    this.scoreText = this.add.text(66, 16, "0", { fontSize: "34px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#17403a", strokeThickness: 6 }).setDepth(60);
    this.bestText = this.add.text(66, 58, this.best ? "Best " + this.best : "", { fontSize: "16px", fontFamily: DUKit.FONT, color: "#fff", stroke: "#17403a", strokeThickness: 4 }).setDepth(60);
    this.distText = this.add.text(W - 18, 16, "0 m", { fontSize: "30px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#17403a", strokeThickness: 6 }).setOrigin(1, 0).setDepth(60);
    this.biomeText = this.add.text(W - 18, 52, BIOMES[0].name, { fontSize: "17px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#ffe14d", stroke: "#17403a", strokeThickness: 4 }).setOrigin(1, 0).setDepth(60);
    this.comboText = this.add.text(W / 2, 20, "", { fontSize: "26px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", backgroundColor: "rgba(22,64,58,.6)", padding: { x: 12, y: 3 } }).setOrigin(0.5, 0).setDepth(60).setAlpha(0);
    this.comboBar = this.add.rectangle(W / 2, 62, 150, 9, 0xffe14d).setOrigin(0.5, 0).setDepth(60).setAlpha(0.85);
    this.comboBarBg = this.add.rectangle(W / 2, 62, 150, 9, 0x17403a, 0.4).setOrigin(0.5, 0).setDepth(59);

    // Input (registered before the title so the title's tap never also jumps).
    this.input.keyboard.on("keydown-SPACE", () => this.jump());
    this.input.keyboard.on("keydown-UP", () => this.jump());
    this.input.keyboard.on("keydown-DOWN", () => this.duck());
    this.input.keyboard.on("keydown-S", () => this.duck());
    this.input.on("pointerdown", (p) => { if (p.y > H - 100) this.duck(); else this.jump(); });

    DUKit.ready();
    // "Play again" skips the card once; coming back later should still teach.
    if (skipTitle) { skipTitle = false; this.begin(); }
    else DUKit.title(this, { title: "Dino Run", emoji: "🏎️", voiceId: "run", hint: PAL.label + " — tap or press Space to hop rocks and logs. Press Down (or tap the low strip) to duck under the leaves. Chase the stars!" }, () => this.begin());
  }

  begin() {
    this.ready = true;
    this.spawnTimer.paused = false;
    this.itemTimer.paused = false;
    this.spawnObstacle();
    this.setStage(0);
  }

  // One method owns a whole biome: sky gradient, rain particles, parallax speed and light.
  setStage(n) {
    this.stageCount = n;
    this.biome = n % BIOMES.length;
    this.lap = Math.floor(n / BIOMES.length) + 1;
    const b = BIOMES[this.biome];
    this.skyFrom = [this.skyCur[0], this.skyCur[1]];
    this.skyTo = [shade(PAL.skyA, b.skyA), shade(PAL.skyB, b.skyB)];
    this.skyMix = 0;
    this.par = b.par;
    this.rain.emitting = b.rain && !this.gameOver;
    this.splash.emitting = b.rain && !this.gameOver;
    this.starField.forEach((s, i) => s.setVisible(i < b.star));
    this.tweens.add({ targets: this.veil, alpha: b.veil, duration: 1100 });
    this.tweens.add({ targets: this.rays, alpha: 1 - b.veil, duration: 1100 });
    this.tweens.add({ targets: this.beam, alpha: (!this.gameOver && b.veil > 0.35) ? 0.75 : 0, duration: 900 });
    this.sun.setFillStyle(b.sun, 1);
    this.biomeText.setText(b.name);
    DUKit.banner(this, b.name + (this.lap > 1 ? " · Lap " + this.lap : ""));
    DUKit.sfx(b.rain ? "splash" : "whoosh");
    if (this.biome === 3) DUKit.sfx("roar");
    say(this.lap > 1 && this.biome === 0 ? "Lap " + this.lap + " around " + PAL.label + " — the road is quicker now!" : b.line, "zip");
  }

  // The next biome's distance mark, cycling into a faster lap after night.
  nextStageAt() {
    const n = this.stageCount + 1;
    return BIOMES[n % BIOMES.length].at + Math.floor(n / BIOMES.length) * DAY_SPAN;
  }

  paintSky() {
    const k = this.skyMix;
    this.skyCur = [mixInt(this.skyFrom[0], this.skyTo[0], k), mixInt(this.skyFrom[1], this.skyTo[1], k)];
    this.sky.clear();
    this.sky.fillGradientStyle(this.skyCur[0], this.skyCur[0], this.skyCur[1], this.skyCur[1], 1);
    this.sky.fillRect(0, 0, W, H);
  }

  jump() {
    if (!this.ready || this.gameOver) return;
    this.duckUntil = 0;
    if (this.hit.body.touching.down || this.hit.body.blocked.down) {
      this.hit.setVelocityY(-760);
      DUKit.sfx("boing");
      this.tweens.add({ targets: this.car, scaleY: 1.15, scaleX: 0.92, duration: 120, yoyo: true });
      DUKit.burst(this, this.car.x - 20, GROUND_Y, { tint: 0xd9c49a, n: 8, min: 40, max: 140, scale: 0.7, life: 380 });
    }
  }

  // Down (or a tap on the low strip) flattens the kart — the only way past a leaf curtain.
  duck() {
    if (!this.ready || this.gameOver) return;
    this.duckUntil = this.time.now + 720;
    DUKit.sfx("scrape");
    DUKit.burst(this, this.car.x - 26, GROUND_Y, { tint: 0xd9c49a, n: 7, min: 60, max: 190, scale: 0.6, life: 320 });
  }

  isDucking() { return this.ready && !this.gameOver && this.time.now < this.duckUntil; }

  mult() { return this.chain >= 8 ? 3 : this.chain >= 4 ? 2 : 1; }

  // A boosted kart shoves the road apart instead of stopping for it.
  canBump(hit, ob) {
    if (this.gameOver) return false;
    if (ob.kind === "branch" && this.isDucking()) return false;
    if (this.boost > 0) { this.shove(ob); return false; }
    return true;
  }

  shove(ob) {
    if (ob.shoved) return;
    ob.shoved = true;
    ob.body.enable = false;
    DUKit.sfx("scrape");
    DUKit.burst(this, ob.x, ob.y - 24, { texture: "kit-spark", tint: 0xffe14d, n: 14, scale: 0.9, life: 420, spin: true });
    this.tweens.add({ targets: ob, angle: 420, alpha: 0, duration: 520, onComplete: () => ob.destroy() });
    DUKit.floatText(this, ob.x, ob.y - 70, "Out of the way!", "#7be0ff");
  }

  spawnObstacle() {
    if (this.gameOver) return;
    const r = Math.random();
    let kind = r < 0.42 ? "rock" : r < 0.74 ? "log" : "branch";
    // Leaves wait until the child has had a good while hopping rocks.
    if (this.metres < 140 && kind === "branch") kind = "rock";
    const spec = OB_KINDS[kind];
    const ob = this.obstacles.create(W + 80, GROUND_Y + spec.dy, kind);
    ob.kind = kind; ob.passed = false;
    ob.setOrigin(0.5, 1).setScale(spec.scale);
    ob.body.setAllowGravity(false);
    ob.setVelocityX(-this.speed);
    ob.body.setSize(spec.bw, spec.bh, true);
    this.spawnTimer.delay = Math.max(640, 1500 - this.score * 6 - this.metres * 0.05);
  }

  // Collectibles come in short arcs that sit right on top of a good jump.
  spawnLine() {
    if (this.gameOver) return;
    if (Math.random() < 0.16) { this.spawnBoost(); return; }
    const high = Math.random() < 0.55;
    const n = Math.random() < 0.62 ? 1 : Math.random() < 0.7 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const bend = n === 1 ? 0 : Math.round(Math.sin(((i + 1) / (n + 1)) * Math.PI) * (high ? 42 : 20));
      this.spawnItem(high, W + 80 + i * 64, bend);
    }
  }

  spawnItem(high, x, bend) {
    const roll = Math.random();
    const tex = roll < 0.6 ? "star" : roll < 0.85 ? "coin" : "egg";
    const y = (high ? GROUND_Y - 150 : GROUND_Y - 60) - (bend || 0);
    const item = this.collectibles.create(x, y, tex);
    item.setScale(0.62);
    item.body.setAllowGravity(false);
    item.setVelocityX(-this.speed);
    item.value = tex === "egg" ? 3 : 1;
    this.tweens.add({ targets: item, y: y - 10, duration: 500, yoyo: true, repeat: -1, ease: "sine.inOut" });
    if (tex === "star") this.tweens.add({ targets: item, angle: 360, duration: 2400, repeat: -1 });
    if (tex === "coin") this.tweens.add({ targets: item, scaleX: { from: 0.62, to: 0.1 }, duration: 700, yoyo: true, repeat: -1 });
  }

  spawnBoost() {
    if (this.gameOver) return;
    const item = this.collectibles.create(W + 90, GROUND_Y - 112, "boost");
    item.setScale(0.9); item.kind = "boost"; item.value = 0;
    item.body.setAllowGravity(false);
    item.setVelocityX(-this.speed);
    this.tweens.add({ targets: item, y: item.y - 14, duration: 620, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.tweens.add({ targets: item, angle: { from: -12, to: 12 }, duration: 340, yoyo: true, repeat: -1 });
    DUKit.burst(this, item.x, item.y, { texture: "kit-spark", tint: 0x7be0ff, n: 10, scale: 0.9, life: 460, spin: true });
  }

  collect(item) {
    if (item.kind === "boost") { item.destroy(); this.boostNow(); return; }
    // Score keeps counting only what the road hands out, so the map's stars stay honest;
    // a live combo pays in sparks on top.
    this.score += item.value;
    this.sparks += item.value * this.mult();
    this.chain += 1;
    this.chainUntil = this.time.now + COMBO_HOLD;
    this.chainFade = 0;
    this.scoreText.setText(String(this.score));
    this.tweens.add({ targets: this.scoreText, scale: 1.35, duration: 120, yoyo: true });
    this.tweens.add({ targets: this.starIcon, angle: 360, scale: 1.3, duration: 320, onComplete: () => this.starIcon.setAngle(0).setScale(0.9) });
    DUKit.burst(this, item.x, item.y, { texture: "kit-spark", tint: 0xffe14d, n: 12, scale: 1.1 });
    DUKit.floatText(this, item.x, item.y - 20, "+" + item.value + (this.mult() > 1 ? "  ·  x" + this.mult() : ""));
    DUKit.sfx(item.value > 3 - item.value ? "chirp" : "coin");
    DUKit.sfx("star");
    if (this.chain === 4 || this.chain === 8) { DUKit.banner(this, "x" + this.mult() + " combo!"); DUKit.sfx("sparkle"); }
    if (this.chain % 12 === 0) { DUKit.banner(this, this.chain + " in a row!"); DUKit.sfx("drum"); }
    item.destroy();
  }

  boostNow() {
    this.boost = 2.6;
    this.sparks += 2;
    DUKit.sfx("whoosh"); DUKit.sfx("roar");
    DUKit.banner(this, "BOOST!");
    this.trail.emitting = true;
    this.tweens.add({ targets: this.car, scaleX: 1.14, duration: 170, yoyo: true });
    DUKit.shake(this, 150, 0.007);
    DUKit.burst(this, this.car.x + 10, GROUND_Y - 30, { texture: "kit-spark", tint: 0x7be0ff, n: 18, scale: 1.2, life: 520, spin: true });
    say("Hold on tight!", "zip");
  }

  // Passing close to something without touching it is worth a cheer of its own.
  phew(o) {
    if (this.time.now < this.phewUntil) return;
    this.phewUntil = this.time.now + 900;
    this.sparks += 1;
    DUKit.floatText(this, this.car.x + 44, this.car.y - 96, "Phew!", "#7be0ff");
    DUKit.sfx("chirp");
    DUKit.burst(this, this.car.x + 30, this.car.y - 40, { texture: "kit-spark", tint: 0x7be0ff, n: 8, scale: 0.8, life: 340, spin: true });
  }

  crash() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    this.spawnTimer.paused = true;
    this.itemTimer.paused = true;
    this.dust.emitting = false;
    this.wind.emitting = false;
    this.trail.emitting = false;
    this.rain.emitting = false;
    this.splash.emitting = false;
    // A biome still fading in must not leave the headlamps burning over the panel.
    this.tweens.killTweensOf(this.beam);
    this.beam.setAlpha(0);
    DUKit.sfx("thud"); DUKit.sfx("bad");
    DUKit.shake(this, 280, 0.016);
    this.carBody.setTint(0xff7777);
    this.tweens.add({ targets: this.car, angle: -18, y: this.car.y - 30, duration: 260, yoyo: true });
    DUKit.burst(this, this.car.x + 10, this.car.y - 20, { tint: 0x8a5a33, n: 26, gravity: 600, life: 700, scale: 1.1 });
    DUKit.burst(this, this.car.x + 10, this.car.y - 24, { texture: "kit-spark", tint: 0xffffff, n: 10, scale: 1.4 });

    const stars = DUKit.rating(this.score, STAR_STEPS);
    const isBest = this.score > this.best;
    this.best = Math.max(this.best, this.score);
    const far = Math.round(this.metres);
    this.bestMetres = Math.max(this.bestMetres, far);
    // The store keeps both numbers: the one the campaign map converts to stars,
    // and how far the child actually drove.
    DUKit.setKey(STORE_KEY, { best: this.best, metres: this.bestMetres });
    DUKit.mergeJSON(HUB_KEY, o => { o.totalStars = (Number(o.totalStars) || 0) + stars; o.bestStars = Math.max(Number(o.bestStars) || 0, stars); });
    // Book the run on the campaign map as well as in this page's own score, so
    // the hub knows the child drove today.
    if (window.DUJourney) DUJourney.record("drive.run", { stars });
    if (window.DUWONDER) DUWONDER.mote(stars >= 3 ? 3 : 1);
    this.time.delayedCall(650, () => {
      DUKit.endPanel(this, {
        title: "GAME OVER",
        line: "You reached " + BIOMES[this.biome].name + " — " + far + " m" + (isBest && this.score > 0 ? "  ·  New best!" : ""),
        best: bestLine(this.best, this.bestMetres, this.sparks), stars, again: "TAP TO RETRY", voiceId: "run"
      }, () => { skipTitle = true; this.scene.restart(); });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    const k = this.ready && !this.gameOver ? 1 : (this.gameOver ? 0 : 0.25);
    const par = (this.par || 1) * (1 + (this.lap - 1) * 0.08);
    if (this.skyMix < 1) { this.skyMix = Math.min(1, this.skyMix + dt * 0.8); this.paintSky(); }
    this.mountains.tilePositionX += this.speed * 0.05 * dt * k * par;
    this.clouds.tilePositionX += this.speed * 0.08 * dt * (this.gameOver ? 0 : 1) * par;
    this.clouds2.tilePositionX += this.speed * 0.04 * dt * (this.gameOver ? 0 : 1) * par;
    this.hills.tilePositionX += this.speed * 0.2 * dt * k * par;
    this.trees.tilePositionX += this.speed * 0.45 * dt * k * par;
    this.track.tilePositionX += this.speed * dt * k;

    const grounded = this.hit.body.touching.down || this.hit.body.blocked.down;
    if (!this.gameOver) {
      this.car.x = this.hit.x;
      this.car.y = this.hit.y + 20;
    }
    const ducking = this.isDucking();
    if (ducking !== this.wasDucking) {
      this.wasDucking = ducking;
      this.tweens.add({ targets: this.car, scaleY: ducking ? 0.62 : 1, scaleX: ducking ? 1.1 : 1, duration: 110 });
    }
    this.beam.setPosition(this.hit.x + 26, this.hit.y - 12);
    const lift = Phaser.Math.Clamp((GROUND_Y - (this.hit.y + 20)) / 180, 0, 1);
    this.shadow.setPosition(this.hit.x + 4, GROUND_Y + 4).setScale(1 - lift * 0.5).setAlpha(0.28 * (1 - lift * 0.6) * (ducking ? 0.8 : 1));
    if (!this.gameOver) {
      const spin = (grounded ? 1 : 0.35) * this.speed * dt * 0.09 * k;
      this.wheelB.rotation += spin; this.wheelF.rotation += spin;
      this.car.angle = grounded ? 0 : Phaser.Math.Clamp(this.hit.body.velocity.y / 90, -10, 10);
    }
    if (grounded && !this.wasGrounded && this.ready && !this.gameOver) {
      this.tweens.add({ targets: this.car, scaleY: 0.84, scaleX: 1.1, duration: 90, yoyo: true, ease: "sine.out" });
      DUKit.burst(this, this.car.x, GROUND_Y, { tint: 0xd9c49a, n: 10, min: 50, max: 160, scale: 0.8, life: 400 });
      if (BIOMES[this.biome].rain) { DUKit.sfx("splash"); DUKit.burst(this, this.car.x, GROUND_Y - 4, { tint: 0xbfe3ff, n: 8, min: 60, max: 180, scale: 0.6, life: 340 }); }
    }
    this.wasGrounded = grounded;
    this.dust.emitting = grounded && this.ready && !this.gameOver;
    this.wind.emitting = this.ready && !this.gameOver && (this.speed > 430 || this.boost > 0);

    if (this.boost > 0) {
      this.boost -= dt;
      if (this.boost <= 0) { this.boost = 0; this.trail.emitting = false; DUKit.sfx("whoosh"); }
    }

    // A combo fades with time rather than dying on a crash, so a good run
    // keeps its rhythm and a slow patch simply settles back to x1.
    if (this.chain > 0) {
      const left = this.chainUntil - this.time.now;
      if (left <= 0) {
        this.chainFade += dt;
        if (this.chainFade >= 0.45) { this.chainFade = 0; this.chain -= 1; }
      }
      this.comboBar.setScale(Phaser.Math.Clamp(left / COMBO_HOLD, 0, 1), 1);
      this.comboText.setText(this.chain > 1 ? "x" + this.mult() + "  ·  " + this.chain + " in a row" : "").setAlpha(this.chain > 1 ? 1 : 0);
    } else this.comboText.setAlpha(0);

    if (!this.ready || this.gameOver) return;
    const far = Math.round(this.metres);
    const dtext = far + " m";
    if (this.distText.text !== dtext) this.distText.setText(dtext);
    this.metres += this.speed * dt * 0.06;
    if (this.metres >= this.nextStageAt()) this.setStage(this.stageCount + 1);

    this.obstacles.getChildren().slice().forEach(o => {
      if (o.destroyed) return;
      if (o.x < -180) { o.destroy(); return; }
      if (o.passed || o.x > this.hit.x) return;
      o.passed = true;
      if (o.kind === "branch") { if (this.wasDucking) this.phew(o); return; }
      const gap = o.body.top - this.hit.body.bottom;
      if (gap > 0 && gap < 60) this.phew(o);
    });
    this.collectibles.getChildren().slice().forEach(o => { if (o.x < -90) o.destroy(); });
    this.speed = Math.min(620, 320 + this.score * 2.2 + this.metres * 0.06) * (this.boost > 0 ? 1.5 : 1);
    this.obstacles.getChildren().forEach(o => o.setVelocityX(-this.speed));
    this.collectibles.getChildren().forEach(o => o.setVelocityX(-this.speed));
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game-root",
  backgroundColor: "#69c8ff",
  physics: { default: "arcade", arcade: { gravity: { y: 2200 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [PlayScene]
});
