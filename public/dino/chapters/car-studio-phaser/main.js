// Dino Car Studio — Phaser 3 endless runner (arcade physics, parallax, particles, sound, stars).
const W = 960, H = 540;
const GROUND_Y = 420;
const STORE_KEY = "dino-car-studio-phaser-v1";
const HUB_KEY = "dino-car-studio-v1";
const STAR_STEPS = [6, 15, 30];
let skipTitle = false;

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

class PlayScene extends Phaser.Scene {
  constructor() { super("play"); }

  preload() {
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
  }

  create() {
    this.speed = 320;
    this.score = 0;
    this.chain = 0;
    this.best = DUKit.getBest(STORE_KEY);
    this.gameOver = false;
    this.ready = false;
    this.wasGrounded = true;

    // Sky, sun, rays, sparkles.
    const sky = this.add.graphics();
    sky.fillGradientStyle(PAL.skyA, PAL.skyA, PAL.skyB, PAL.skyB, 1);
    sky.fillRect(0, 0, W, H);
    DUKit.sunRays(this, 820, 96, 200, PAL.sun);
    const sun = this.add.circle(820, 96, 42, PAL.sun, 1).setDepth(0);
    this.tweens.add({ targets: sun, scale: 1.08, duration: 1800, yoyo: true, repeat: -1, ease: "sine.inOut" });
    DUKit.sparkleField(this, STUDIO.scene === "space" ? 40 : 10, STUDIO.scene === "space" ? 0 : 600, 20, 940, STUDIO.scene === "space" ? 300 : 170, 0xffffff);

    this.mountains = this.add.tileSprite(W / 2, GROUND_Y - 112, W, 140, "mountains").setAlpha(0.9).setTint(PAL.mount);
    this.clouds = this.add.tileSprite(W / 2, 70, W, 40, "cloud").setAlpha(0.9);
    this.clouds2 = this.add.tileSprite(W / 2, 140, W, 40, "cloud").setAlpha(0.6);
    this.clouds2.tilePositionX = 40;
    this.hills = this.add.tileSprite(W / 2, GROUND_Y - 50, W, 90, "hill");
    this.trees = this.add.tileSprite(W / 2, GROUND_Y - 56, W, 116, "trees").setAlpha(0.95).setTint(PAL.trees);

    this.add.rectangle(W / 2, (GROUND_Y + H) / 2, W, H - GROUND_Y, PAL.ground);
    this.track = this.add.tileSprite(W / 2, GROUND_Y + 8, W, 16, "track");

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
    this.driver = this.add.image(4, -50, "dinoHead").setOrigin(0.5, 0.7);
    this.car.add([this.wheelB, this.wheelF, this.carBody, this.driver]);
    STUDIO.stickers.forEach((e, i) => this.car.add(this.add.text(-33 + i * 22, -23, e, { fontSize: "15px" }).setOrigin(0.5)));
    if (STUDIO.name) this.car.add(this.add.text(0, -86, STUDIO.name, { fontSize: "14px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#17403a", strokeThickness: 4 }).setOrigin(0.5));
    this.tweens.add({ targets: this.driver, angle: { from: -6, to: 6 }, y: -53, duration: 420, yoyo: true, repeat: -1, ease: "sine.inOut" });

    // Dust behind the wheels, wind streaks at speed.
    this.dust = this.add.particles(0, 0, "kit-dot", {
      speed: { min: 20, max: 70 }, angle: { min: 150, max: 210 }, scale: { start: 0.5, end: 0 },
      alpha: { start: 0.55, end: 0 }, lifespan: 320, frequency: 55, tint: 0xd9c49a
    }).setDepth(4);
    this.dust.startFollow(this.car, -44, -4);
    this.wind = this.add.particles(W + 20, 0, "kit-dot", {
      y: { min: 60, max: GROUND_Y - 30 }, speedX: { min: -1100, max: -800 }, lifespan: 600, scaleX: { start: 5, end: 3 }, scaleY: 0.12,
      alpha: { start: 0.45, end: 0 }, frequency: 40, tint: 0xffffff, emitting: false
    }).setDepth(2);

    // Gameplay groups.
    this.obstacles = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.physics.add.collider(this.hit, this.obstacles, () => this.crash(), null, this);
    this.physics.add.overlap(this.hit, this.collectibles, (p, item) => this.collect(item), null, this);
    this.spawnTimer = this.time.addEvent({ delay: 1500, callback: () => this.spawnObstacle(), loop: true, paused: true });
    this.itemTimer = this.time.addEvent({ delay: 800, callback: () => this.spawnItem(), loop: true, paused: true });

    // HUD
    this.starIcon = this.add.image(36, 36, "kit-star").setScale(0.9).setDepth(60);
    this.scoreText = this.add.text(66, 16, "0", { fontSize: "34px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#17403a", strokeThickness: 6 }).setDepth(60);
    this.bestText = this.add.text(66, 58, this.best ? "Best " + this.best : "", { fontSize: "16px", fontFamily: DUKit.FONT, color: "#fff", stroke: "#17403a", strokeThickness: 4 }).setDepth(60);

    // Input (registered before the title so the title's tap never also jumps).
    this.input.keyboard.on("keydown-SPACE", () => this.jump());
    this.input.keyboard.on("keydown-UP", () => this.jump());
    this.input.on("pointerdown", () => this.jump());

    DUKit.ready();
    if (skipTitle) this.begin();
    else DUKit.title(this, { title: "Dino Run", emoji: "🏎️", hint: PAL.label + " — tap or press Space to jump over rocks and logs. Catch the stars!" }, () => this.begin());
  }

  begin() {
    this.ready = true;
    this.spawnTimer.paused = false;
    this.itemTimer.paused = false;
    this.spawnObstacle();
  }

  jump() {
    if (!this.ready || this.gameOver) return;
    if (this.hit.body.touching.down || this.hit.body.blocked.down) {
      this.hit.setVelocityY(-760);
      DUKit.sfx("boing");
      this.tweens.add({ targets: this.car, scaleY: 1.15, scaleX: 0.92, duration: 120, yoyo: true });
      DUKit.burst(this, this.car.x - 20, GROUND_Y, { tint: 0xd9c49a, n: 8, min: 40, max: 140, scale: 0.7, life: 380 });
    }
  }

  spawnObstacle() {
    if (this.gameOver) return;
    const kind = Math.random() < 0.55 ? "rock" : "log";
    const ob = this.obstacles.create(W + 80, GROUND_Y + 6, kind);
    ob.setOrigin(0.5, 1).setScale(kind === "rock" ? 0.72 : 0.66);
    ob.body.setAllowGravity(false);
    ob.setVelocityX(-this.speed);
    ob.body.setSize(kind === "rock" ? 52 : 120, kind === "rock" ? 52 : 36, true);
    this.spawnTimer.delay = Math.max(650, 1500 - this.score * 6);
  }

  spawnItem() {
    if (this.gameOver) return;
    const high = Math.random() < 0.5;
    const tex = Math.random() < 0.7 ? "star" : "egg";
    const y = high ? GROUND_Y - 150 : GROUND_Y - 60;
    const item = this.collectibles.create(W + 80, y, tex);
    item.setScale(0.62);
    item.body.setAllowGravity(false);
    item.setVelocityX(-this.speed);
    item.value = tex === "egg" ? 3 : 1;
    this.tweens.add({ targets: item, y: y - 10, duration: 500, yoyo: true, repeat: -1, ease: "sine.inOut" });
    if (tex === "star") this.tweens.add({ targets: item, angle: 360, duration: 2400, repeat: -1 });
  }

  collect(item) {
    this.score += item.value;
    this.chain += 1;
    this.scoreText.setText(String(this.score));
    this.tweens.add({ targets: this.scoreText, scale: 1.35, duration: 120, yoyo: true });
    this.tweens.add({ targets: this.starIcon, angle: 360, scale: 1.3, duration: 320, onComplete: () => this.starIcon.setAngle(0).setScale(0.9) });
    DUKit.burst(this, item.x, item.y, { texture: "kit-spark", tint: 0xffe14d, n: 12, scale: 1.1 });
    DUKit.floatText(this, item.x, item.y - 20, "+" + item.value);
    DUKit.sfx(item.value > 1 ? "chirp" : "star");
    if (this.chain % 5 === 0) { DUKit.banner(this, this.chain + " in a row!"); DUKit.sfx("sparkle"); }
    item.destroy();
  }

  crash() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    this.spawnTimer.paused = true;
    this.itemTimer.paused = true;
    this.dust.emitting = false;
    this.wind.emitting = false;
    DUKit.sfx("thud"); DUKit.sfx("bad");
    DUKit.shake(this, 280, 0.016);
    this.carBody.setTint(0xff7777);
    this.tweens.add({ targets: this.car, angle: -18, y: this.car.y - 30, duration: 260, yoyo: true });
    DUKit.burst(this, this.car.x + 10, this.car.y - 20, { tint: 0x8a5a33, n: 26, gravity: 600, life: 700, scale: 1.1 });
    DUKit.burst(this, this.car.x + 10, this.car.y - 24, { texture: "kit-spark", tint: 0xffffff, n: 10, scale: 1.4 });

    const stars = DUKit.rating(this.score, STAR_STEPS);
    const isBest = this.score > this.best;
    this.best = Math.max(this.best, this.score);
    DUKit.setKey(STORE_KEY, { best: this.best });
    DUKit.mergeJSON(HUB_KEY, o => { o.totalStars = (Number(o.totalStars) || 0) + stars; o.bestStars = Math.max(Number(o.bestStars) || 0, stars); });
    this.time.delayedCall(650, () => {
      DUKit.endPanel(this, { title: "GAME OVER", line: "Score " + this.score + (isBest && this.score > 0 ? "  ·  New best!" : ""), best: "Best " + this.best, stars, again: "TAP TO RETRY" }, () => { skipTitle = true; this.scene.restart(); });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    const k = this.ready && !this.gameOver ? 1 : (this.gameOver ? 0 : 0.25);
    this.mountains.tilePositionX += this.speed * 0.05 * dt * k;
    this.clouds.tilePositionX += this.speed * 0.08 * dt * (this.gameOver ? 0 : 1);
    this.clouds2.tilePositionX += this.speed * 0.04 * dt * (this.gameOver ? 0 : 1);
    this.hills.tilePositionX += this.speed * 0.2 * dt * k;
    this.trees.tilePositionX += this.speed * 0.45 * dt * k;
    this.track.tilePositionX += this.speed * dt * k;

    const grounded = this.hit.body.touching.down || this.hit.body.blocked.down;
    if (!this.gameOver) {
      this.car.x = this.hit.x;
      this.car.y = this.hit.y + 20;
    }
    const lift = Phaser.Math.Clamp((GROUND_Y - (this.hit.y + 20)) / 180, 0, 1);
    this.shadow.setPosition(this.hit.x + 4, GROUND_Y + 4).setScale(1 - lift * 0.5).setAlpha(0.28 * (1 - lift * 0.6));
    if (!this.gameOver) {
      const spin = (grounded ? 1 : 0.35) * this.speed * dt * 0.09 * k;
      this.wheelB.rotation += spin; this.wheelF.rotation += spin;
      this.car.angle = grounded ? 0 : Phaser.Math.Clamp(this.hit.body.velocity.y / 90, -10, 10);
    }
    if (grounded && !this.wasGrounded && this.ready && !this.gameOver) {
      this.tweens.add({ targets: this.car, scaleY: 0.84, scaleX: 1.1, duration: 90, yoyo: true, ease: "sine.out" });
      DUKit.burst(this, this.car.x, GROUND_Y, { tint: 0xd9c49a, n: 10, min: 50, max: 160, scale: 0.8, life: 400 });
    }
    this.wasGrounded = grounded;
    this.dust.emitting = grounded && this.ready && !this.gameOver;
    this.wind.emitting = this.ready && !this.gameOver && this.speed > 430;

    if (!this.ready || this.gameOver) return;
    this.obstacles.getChildren().slice().forEach(o => { if (o.x < -120) o.destroy(); });
    this.collectibles.getChildren().slice().forEach(o => { if (o.x < -80) { this.chain = 0; o.destroy(); } });
    this.speed = Math.min(620, 320 + this.score * 2.4);
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
