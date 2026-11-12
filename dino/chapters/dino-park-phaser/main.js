// Dino Park — Phaser 3 "catch the falling items": animated dino, combos, sound, star ratings.
const W = 960, H = 540;
const FLOOR_Y = 480;
const STORE_KEY = "dino-park-phaser-v1";
const HUB_KEY = "dino_catch";
const STAR_STEPS = [15, 40, 80];
let skipTitle = false;
// Tells the shared kit which story voice belongs to this scene: park.arcade.
window.DU_WORLD_ID = "park";

// The run is three weather stages, so a good catch day has a middle and an end.
// Stage 2 and 3 open on their own words, which the end panel reads back.
const STAGES = [
  { name: "Sunny morning", sky: [0xbfe8ff, 0xfff3d9], wash: 0x000000, washA: 0, rain: false, glow: 0xffffff, says: "The nest is empty. Fill it!" },
  { name: "The clouds come", sky: [0x9fc6e8, 0xe8dfc0], wash: 0x2b4a6b, washA: 0.14, rain: true, glow: 0xdfe9ff, says: "Rain! The eggs come faster now." },
  { name: "Dusk at the nest", sky: [0x6f7fc4, 0xffb27a], wash: 0x1b2350, washA: 0.30, rain: false, glow: 0xffe6a8, says: "Last light. The golden egg has come!" },
];

// The best score line quotes the same total the campaign map keeps, so the two
// screens never disagree out loud about how far the child has got.
function bestLine(best) {
  const J = window.DUJourney;
  return "Best " + best + (J ? " · 🗺 " + J.total() + " stars" : "");
}

class ParkScene extends Phaser.Scene {
  constructor() { super("park"); }

  preload() {
    this.load.image("rexWalkSheet", "../../assets/prehistoric/trex-walk.png");
    DUKit.textures(this);
    const g = this.make.graphics({ add: false });

    // Dino parts (drawn separately so legs, tail, head and eye can animate).
    g.fillStyle(0x439f54, 1); g.fillTriangle(0, 10, 40, 0, 40, 24);
    g.generateTexture("dTail", 40, 24);
    g.clear();
    g.fillStyle(0x58c26a, 1); g.fillEllipse(48, 34, 92, 62);
    g.fillStyle(0x8fe0a0, 1); g.fillEllipse(52, 44, 56, 32);
    g.fillStyle(0x439f54, 1);
    g.fillTriangle(22, 14, 30, -2, 38, 14); g.fillTriangle(40, 8, 49, -6, 58, 8); g.fillTriangle(58, 12, 66, 0, 74, 14);
    g.generateTexture("dBody", 96, 68);
    g.clear();
    g.fillStyle(0x58c26a, 1); g.fillCircle(30, 30, 26); g.fillRoundedRect(28, 26, 38, 22, 10);
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(24, 18, 22, 10);
    g.fillStyle(0x2f7a3d, 1); g.fillCircle(56, 34, 2.2); g.fillCircle(62, 34, 2.2);
    g.fillStyle(0xff8f8f, 1); g.fillCircle(14, 40, 5);
    g.generateTexture("dHead", 70, 56);
    g.clear();
    g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8);
    g.fillStyle(0x222222, 1); g.fillCircle(10, 8, 4);
    g.generateTexture("dEye", 16, 16);
    g.clear();
    g.fillStyle(0x439f54, 1); g.fillRoundedRect(0, 0, 16, 34, 6);
    g.fillStyle(0x2f7a3d, 1); g.fillRoundedRect(-4, 28, 24, 10, 5);
    g.generateTexture("dLeg", 24, 40);

    // Falling things: bold, outlined, glowing.
    g.clear();
    g.fillStyle(0xffffff, 0.5); g.fillCircle(40, 40, 38);
    g.fillStyle(0xfff0c8, 1); g.lineStyle(4, 0x8a5a2b, 1);
    g.fillEllipse(40, 44, 40, 52); g.strokeEllipse(40, 44, 40, 52);
    g.fillStyle(0xc9854a, 1); g.fillCircle(33, 37, 4); g.fillCircle(47, 50, 5); g.fillCircle(36, 55, 3);
    g.generateTexture("pEgg", 80, 80);
    g.clear();
    g.fillStyle(0xffffff, 0.5); g.fillCircle(40, 40, 38);
    g.fillStyle(0xffd23f, 1); g.lineStyle(4, 0xc2610a, 1);
    const star = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 === 0 ? 30 : 13, a = (Math.PI / 5) * i - Math.PI / 2; star.push({ x: 40 + Math.cos(a) * r, y: 42 + Math.sin(a) * r }); }
    g.fillPoints(star, true); g.strokePoints(star, true);
    g.generateTexture("pStar", 80, 80);
    g.clear();
    g.fillStyle(0xff6b6b, 0.35); g.fillCircle(40, 40, 38);
    g.fillStyle(0x3b3f4a, 1); g.lineStyle(4, 0x14161c, 1);
    for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i; g.fillTriangle(40 + Math.cos(a - 0.2) * 22, 40 + Math.sin(a - 0.2) * 22, 40 + Math.cos(a) * 36, 40 + Math.sin(a) * 36, 40 + Math.cos(a + 0.2) * 22, 40 + Math.sin(a + 0.2) * 22); }
    g.fillCircle(40, 40, 24); g.strokeCircle(40, 40, 24);
    g.fillStyle(0xff4d4d, 1); g.fillCircle(32, 36, 4); g.fillCircle(48, 36, 4);
    g.fillRect(30, 48, 20, 3);
    g.generateTexture("pBad", 80, 80);
    // The golden egg: the one every child waits for. Only ever drops late.
    g.clear();
    g.fillStyle(0xfff3b0, 0.55); g.fillCircle(40, 40, 39);
    g.fillStyle(0xffcf3f, 1); g.lineStyle(5, 0xa06a10, 1);
    g.fillEllipse(40, 44, 42, 54); g.strokeEllipse(40, 44, 42, 54);
    g.fillStyle(0xffffff, 0.75); g.fillEllipse(31, 32, 14, 20);
    g.fillStyle(0xa06a10, 1); g.fillCircle(46, 52, 3);
    g.generateTexture("pGolden", 80, 80);

    // Scenery.
    g.clear();
    g.fillStyle(0x9ed8a8, 1); g.fillEllipse(110, 90, 220, 110);
    g.generateTexture("pHills", 220, 90);
    g.clear();
    g.fillStyle(0x7a5a3a, 1); g.fillRect(34, 80, 12, 50); g.fillRect(154, 90, 10, 40);
    g.fillStyle(0x3f9d63, 1); g.fillCircle(40, 62, 36); g.fillStyle(0x56b975, 1); g.fillCircle(160, 66, 30);
    g.generateTexture("pTrees", 200, 130);
    g.clear();
    g.fillStyle(0xffffff, 0.92); g.fillEllipse(30, 22, 60, 26); g.fillEllipse(62, 16, 44, 22);
    g.generateTexture("pCloud", 94, 40);
    // The nest the eggs are falling into, drawn big so the floor reads as a place.
    g.clear();
    g.fillStyle(0x8a5a2b, 1); g.fillEllipse(120, 46, 240, 74);
    g.fillStyle(0x6f4520, 1); g.fillEllipse(120, 42, 200, 52);
    g.fillStyle(0xa9743c, 1);
    for (let i = 0; i < 9; i++) { g.fillRect(14 + i * 24, 30 + (i % 3) * 8, 22, 6); }
    g.generateTexture("pNest", 240, 74);
    g.destroy();

    DUKit.emoji(this, "chick", "🐣", 44);
    DUKit.emoji(this, "heart", "❤️", 30);
    DUKit.emoji(this, "heartOff", "🖤", 30);
    DUKit.emoji(this, "flower1", "🌼", 26);
    DUKit.emoji(this, "flower2", "🌸", 26);
    DUKit.emoji(this, "flower3", "🌷", 26);
    DUKit.emoji(this, "ice", "❄️", 44);
    DUKit.emoji(this, "magnet", "🧲", 44);
    DUKit.emoji(this, "butterfly", "🦋", 30);
  }

  create() {
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.perfects = 0;
    this.stage = 1;
    this.magnetT = 0;
    this.slowT = 0;
    this.best = DUKit.getBest(STORE_KEY);
    this.gameOver = false;
    this.ready = false;
    this.targetX = null;
    this.moving = 0;

    // Sky, sun with rays, sparkles, layered scenery.
    const sky = this.add.graphics();
    sky.fillGradientStyle(0xbfe8ff, 0xbfe8ff, 0xfff3d9, 0xfff3d9, 1);
    sky.fillRect(0, 0, W, H);
    DUKit.sunRays(this, 830, 90, 220);
    this.sun = this.add.circle(830, 90, 44, 0xffe27a, 1);
    DUKit.sparkleField(this, 12, 560, 30, 940, 180, 0xffffff);
    this.clouds = this.add.tileSprite(W / 2, 80, W, 40, "pCloud").setAlpha(0.9);
    this.hills = this.add.tileSprite(W / 2, FLOOR_Y - 56, W, 90, "pHills");
    this.trees = this.add.tileSprite(W / 2, FLOOR_Y - 42, W, 130, "pTrees");
    this.add.rectangle(W / 2, (FLOOR_Y + H) / 2 + 20, W, H - FLOOR_Y + 40, 0x6ec26a);
    this.add.rectangle(W / 2, FLOOR_Y + 4, W, 10, 0x4a8f3c);
    // A nest at the child's feet: the eggs are falling *somewhere*, which makes
    // a missed catch feel like a loss instead of a thing that left the screen.
    this.add.image(W / 2, FLOOR_Y + 26, "pNest").setDepth(2).setScale(1.1);
    for (let i = 0; i < 14; i++) {
      const f = this.add.image(30 + i * 68 + Phaser.Math.Between(-12, 12), FLOOR_Y + Phaser.Math.Between(14, 44), "flower" + (1 + (i % 3))).setOrigin(0.5, 1).setDepth(8);
      this.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: Phaser.Math.Between(900, 1500), yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 80 });
    }
    // Butterflies drift across the sunny stage; rain and dusk take them away.
    this.butterflies = [0, 1, 2].map(i => {
      const b = this.add.image(Phaser.Math.Between(60, W - 60), Phaser.Math.Between(140, 300), "butterfly").setDepth(9).setAlpha(0.9);
      this.tweens.add({ targets: b, x: { from: b.x - 90, to: b.x + 90 }, y: { from: b.y, to: b.y - 60 }, duration: Phaser.Math.Between(4200, 6800), yoyo: true, repeat: -1, ease: "sine.inOut" });
      return b;
    });
    this.add.particles(0, -10, "kit-dot", {
      x: { min: 0, max: W }, lifespan: 6000, speedY: { min: 20, max: 50 }, speedX: { min: -20, max: 20 },
      scale: { start: 0.3, end: 0.08 }, alpha: { start: 0.5, end: 0 }, tint: 0x8fd18f, frequency: 450
    });
    // Rain and the dusk wash are built once and switched on by setStage, so the
    // middle of a good run looks different from the start.
    this.rain = this.add.particles(0, -20, "kit-dot", {
      x: { min: 0, max: W }, lifespan: 1400, speedY: { min: 420, max: 620 }, speedX: { min: -40, max: -10 },
      scale: { start: 0.22, end: 0.1 }, alpha: { start: 0.7, end: 0.2 }, tint: 0xbfd8ff, frequency: 24, emitting: false
    }).setDepth(40);
    this.wash = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(41);

    // Hitbox (physics) + animated dino (visual).
    this.physics.world.gravity.y = 0;
    this.hit = this.physics.add.sprite(W / 2, FLOOR_Y - 46, "kit-dot").setVisible(false);
    this.hit.body.setSize(110, 60);
    this.hit.setCollideWorldBounds(true);
    this.hit.body.setAllowGravity(false);

    this.dino = this.add.container(W / 2, FLOOR_Y).setDepth(6);
    this.rig = this.add.container(0, 0);
    this.shadow = this.add.ellipse(0, 2, 110, 14, 0x0a2a14, 0.25);
    this.tail = this.add.image(-44, -58, "dTail").setOrigin(1, 0.5);
    this.legB = this.add.image(-16, -32, "dLeg").setOrigin(0.5, 0);
    this.legF = this.add.image(16, -32, "dLeg").setOrigin(0.5, 0);
    this.bodyImg = this.add.image(0, -30, "dBody").setOrigin(0.5, 1);
    this.head = this.add.image(44, -64, "dHead").setOrigin(0.3, 0.6);
    this.eye = this.add.image(58, -74, "dEye").setScale(0.9);
    this.rig.add([this.shadow, this.tail, this.legB, this.legF, this.bodyImg, this.head, this.eye]);
    this.dino.add(this.rig);
    const sheet = this.textures.get('rexWalkSheet');
    const source = sheet.getSourceImage();
    for (let i=0;i<4;i++) if (!sheet.has(String(i))) sheet.add(String(i),0,(i%2)*source.width/2,Math.floor(i/2)*source.height/2,source.width/2,source.height/2);
    this.photoDino = this.add.image(0, 0, 'rexWalkSheet', '0').setOrigin(.5,1).setDisplaySize(190,100);
    this.rig.add(this.photoDino);
    [this.tail,this.legB,this.legF,this.bodyImg,this.head,this.eye].forEach(p=>p.setVisible(false));
    // The magnet glows over the dino while it lasts, so a power-up you cannot see
    // is a power-up a child will never notice they had.
    this.magnetGlow = this.add.circle(0, -40, 74, 0xff6bd6, 0.18).setDepth(5).setVisible(false);
    this.tweens.add({ targets: this.magnetGlow, scale: 1.16, duration: 700, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.tail, angle: { from: -14, to: 16 }, duration: 380, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.tweens.add({ targets: [this.head, this.eye], y: "-=3", duration: 520, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.time.addEvent({ delay: 2800, loop: true, callback: () => { this.tweens.add({ targets: this.eye, scaleY: 0.1, duration: 90, yoyo: true }); } });

    this.items = this.physics.add.group();
    this.physics.add.overlap(this.hit, this.items, (d, item) => this.caught(item), null, this);
    this.spawnTimer = this.time.addEvent({ delay: 800, callback: () => this.spawnItem(), loop: true, paused: true });

    // HUD
    this.starIcon = this.add.image(36, 36, "kit-star").setScale(0.9).setDepth(60);
    this.scoreText = this.add.text(66, 16, "0", { fontSize: "34px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#2d5a24", strokeThickness: 6 }).setDepth(60);
    this.comboText = this.add.text(66, 58, "", { fontSize: "20px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#ffe14d", stroke: "#2d5a24", strokeThickness: 5 }).setDepth(60);
    this.hearts = [0, 1, 2].map(i => this.add.image(W - 30 - i * 40, 34, "heart").setDepth(60));
    this.pips = [1, 2, 3].map(i => this.add.circle(W / 2 - 34 + i * 34, 26, 9, 0xffffff, 0.28).setStrokeStyle(2, 0x2d5a24, 0.8).setDepth(60));
    this.stageText = this.add.text(W / 2, 46, STAGES[0].name, { fontSize: "17px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#ffffff", stroke: "#2d5a24", strokeThickness: 5 }).setOrigin(0.5).setDepth(60);
    this.powerText = this.add.text(W / 2, 74, "", { fontSize: "18px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#bfefff", stroke: "#1a3a5a", strokeThickness: 5 }).setOrigin(0.5).setDepth(60);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("A,D");
    this.input.on("pointerdown", p => { if (this.ready && !this.gameOver) this.targetX = p.worldX; });
    this.input.on("pointermove", p => { if (p.isDown && this.ready && !this.gameOver) this.targetX = p.worldX; });
    this.input.on("pointerup", () => { this.targetX = null; });

    DUKit.ready();
    if (skipTitle) { skipTitle = false; this.begin(); }
    else DUKit.title(this, { title: "Dino Park", emoji: "🥚", color: 0xf2a541, cssColor: "#e08a1e", voiceId: "arcade", hint: "Three weather stages, one hungry dino. Catch eggs and stars, grab ❄️ and 🧲, dodge the spiky balls! Use ← → or drag." }, () => this.begin());
  }

  begin() {
    this.ready = true;
    this.spawnTimer.paused = false;
    this.spawnItem();
  }

  // The fall table per stage: stage 1 teaches, stage 2 hurries, stage 3 is the
  // golden-egg light. Weights, not randomness, so the run always has a shape.
  table() {
    if (this.stage === 1) return [["pEgg", .62], ["pStar", .18], ["pBad", .16], ["ice", .03], ["magnet", .01]];
    if (this.stage === 2) return [["pEgg", .52], ["pStar", .20], ["pBad", .20], ["ice", .04], ["magnet", .03], ["heart", .01]];
    return [["pEgg", .44], ["pStar", .20], ["pBad", .24], ["pGolden", .05], ["ice", .04], ["magnet", .02], ["heart", .01]];
  }

  pick() {
    let r = Math.random(), acc = 0;
    for (const [kind, w] of this.table()) { acc += w; if (r <= acc) return kind; }
    return "pEgg";
  }

  spawnItem() {
    if (this.gameOver) return;
    const kind = this.pick();
    const bad = kind === "pBad";
    const item = this.items.create(Phaser.Math.Between(50, W - 50), -40, kind === "ice" ? "ice" : kind === "magnet" ? "magnet" : kind === "heart" ? "heart" : kind);
    item.setScale(kind === "heart" ? 0.8 : 0.7);
    item.bad = bad;
    item.kind = kind;
    item.value = kind === "pStar" ? 2 : kind === "pGolden" ? 5 : bad || kind === "ice" || kind === "magnet" || kind === "heart" ? 0 : 1;
    item.baseVy = Phaser.Math.Between(150, 230) + Math.min(180, this.score * 2) + (this.stage - 1) * 45;
    item.body.setAllowGravity(false);
    item.body.setCircle(26, 14, 14);
    item.setVelocityY(item.baseVy);
    if (kind === "pEgg") this.tweens.add({ targets: item, angle: { from: -14, to: 14 }, duration: 420, yoyo: true, repeat: -1, ease: "sine.inOut" });
    else if (kind === "pStar") this.tweens.add({ targets: item, angle: 360, duration: 1800, repeat: -1 });
    else if (kind === "pGolden") {
      this.tweens.add({ targets: item, angle: { from: -18, to: 18 }, duration: 380, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: item, scale: 0.82, duration: 420, yoyo: true, repeat: -1 });
      this.add.particles(item.x, item.y, "kit-spark", { lifespan: 500, speed: { min: 10, max: 50 }, scale: { start: 0.4, end: 0 }, tint: 0xffd23f, frequency: 90 }).setDepth(3).startFollow(item);
    } else if (kind === "ice" || kind === "magnet" || kind === "heart") {
      this.tweens.add({ targets: item, y: item.y, scaleX: { from: 0.62, to: 0.86 }, duration: 620, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: item, angle: { from: -12, to: 12 }, duration: 700, yoyo: true, repeat: -1 });
    } else this.tweens.add({ targets: item, angle: 360, scale: 0.78, duration: 1000, repeat: -1, yoyo: false });
    this.spawnTimer.delay = Math.max(300, (800 - this.score * 6) - (this.stage - 1) * 110);
  }

  // One method owns everything that changes between stages, so the sky, the rain,
  // the butterflies and the fall table can never disagree with the banner.
  setStage(n) {
    this.stage = n;
    const st = STAGES[n - 1];
    DUKit.banner(this, "Stage " + n + " · " + st.name, "#ffffff");
    DUKit.sfx("sparkle");
    if (window.DUWONDER) DUWONDER.mote(2);
    this.stageText.setText(st.name);
    this.pips.forEach((p, i) => p.setFillStyle(0xffffff, i < n ? 0.95 : 0.28));
    this.wash.setScale(1);
    this.tweens.add({ targets: this.wash, fillColor: st.wash, alpha: st.washA, duration: 1400 });
    this.rain.emitting = st.rain;
    this.tweens.add({ targets: this.clouds, alpha: st.rain ? 0.55 : 0.9, duration: 1200 });
    this.tweens.add({ targets: this.sun, alpha: n === 3 ? 0.25 : 1, y: n === 3 ? 150 : 90, duration: 1400 });
    this.butterflies.forEach(b => this.tweens.add({ targets: b, alpha: n === 2 ? 0 : 0.9, duration: 900 }));
    if (n === 3) DUKit.sparkleField(this, 16, 40, 20, W - 40, 200, 0xfff2b8);
    // The late stages say what changed, out loud, in the voice of the park.
    if (window.DUSTORY && DUSTORY.say) DUSTORY.say(st.says, "pip");
  }

  checkStage() {
    // Stage 3 opens on the two-star step, so the golden-egg dusk is the last
    // push a child makes rather than something they only reach by accident.
    const want = this.score >= STAR_STEPS[1] ? 3 : this.score >= STAR_STEPS[0] ? 2 : 1;
    if (want > this.stage) {
      this.score += 3;
      this.setStage(want);
      DUKit.floatText(this, this.hit.x, FLOOR_Y - 120, "+3 stage bonus!", "#ffe14d");
    }
  }

  setHearts() {
    this.hearts.forEach((h, i) => h.setTexture(i < this.lives ? "heart" : "heartOff"));
  }

  caught(item) {
    if (!item.active || this.gameOver) return;
    const x = item.x, y = item.y;
    this.tweens.add({ targets: this.head, scale: 1.18, duration: 90, yoyo: true });
    this.tweens.add({ targets: this.rig, scaleY: 0.9, scaleX: 1.08, duration: 90, yoyo: true });
    if (item.bad) {
      this.lives -= 1; this.combo = 0; this.comboText.setText(""); this.lastCatch = 0;
      this.setHearts();
      const h = this.hearts[this.lives];
      if (h) this.tweens.add({ targets: h, scale: 1.6, angle: 25, duration: 180, yoyo: true });
      DUKit.sfx("bad"); DUKit.sfx("thud");
      DUKit.shake(this, 200, 0.012);
      DUKit.burst(this, x, y, { tint: 0xff5a4a, n: 18, scale: 0.9 });
      const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xff3b3b, 0.28).setDepth(80);
      this.tweens.add({ targets: flash, alpha: 0, duration: 320, onComplete: () => flash.destroy() });
      this.tweens.add({ targets: this.rig, alpha: 0.35, duration: 80, yoyo: true, repeat: 3, onComplete: () => this.rig.setAlpha(1) });
      if (this.lives <= 0) this.endGame();
      item.destroy();
      return;
    }

    // A power-up is caught for what it does, not for points, so the score keeps
    // meaning "how good was my catching" and nothing else.
    if (item.kind === "ice") {
      this.slowT = 5;
      DUKit.sfx("splash");
      DUKit.burst(this, x, y, { tint: 0xbfefff, n: 16, scale: 1 });
      DUKit.floatText(this, x, y - 10, "Slow feathers!", "#bfefff");
      DUKit.banner(this, "❄️ Slow down!", "#bfefff");
      item.destroy();
      return;
    }
    if (item.kind === "magnet") {
      this.magnetT = 6;
      DUKit.sfx("sparkle");
      DUKit.burst(this, x, y, { texture: "kit-spark", tint: 0xff6bd6, n: 14, spin: true });
      DUKit.floatText(this, x, y - 10, "Egg magnet!", "#ff9ff0");
      DUKit.banner(this, "🧲 Magnet!", "#ff9ff0");
      item.destroy();
      return;
    }
    if (item.kind === "heart") {
      if (this.lives < 3) { this.lives += 1; this.setHearts(); DUKit.floatText(this, x, y - 10, "+1 life", "#ff8f8f"); }
      else { this.score += 2; DUKit.floatText(this, x, y - 10, "+2", "#ffe14d"); }
      DUKit.sfx("chirp");
      DUKit.burst(this, x, y, { tint: 0xff9fbc, n: 14 });
      this.checkStage();
      item.destroy();
      return;
    }

    this.combo += 1;
    this.lastCatch = this.time.now;
    const mult = Math.min(3, 1 + Math.floor(this.combo / 5));
    const golden = item.kind === "pGolden";
    // Landing an egg dead-centre on the snout is worth a shout, but not worth
    // points: it is a flourish, so it never quietly changes the star rating.
    const perfect = Math.abs(x - this.hit.x) < 24 && golden === false;
    const pts = item.value * mult;
    this.score += pts;
    this.scoreText.setText(String(this.score));
    this.tweens.add({ targets: this.scoreText, scale: 1.35, duration: 110, yoyo: true });
    this.tweens.add({ targets: this.starIcon, angle: 360, scale: 1.3, duration: 320, onComplete: () => this.starIcon.setAngle(0).setScale(0.9) });
    this.comboText.setText(this.combo >= 3 ? "Combo " + this.combo + (mult > 1 ? "  x" + mult : "") : "");
    DUKit.floatText(this, x, y - 10, "+" + pts + (perfect ? "  perfect!" : ""), golden ? "#ffd23f" : mult > 1 ? "#ff9f43" : "#ffe14d");
    DUKit.sfx("note", this.combo % 12, 0.25);
    if (perfect) { this.perfects += 1; DUKit.sfx("coin"); if (this.perfects % 5 === 0) DUKit.banner(this, this.perfects + " perfect catches!"); }
    if (golden) {
      DUKit.sfx("win"); DUKit.sfx("star");
      DUKit.burst(this, x, y, { texture: "kit-star", tint: 0xffd23f, n: 26, scale: 1, spin: true });
      DUKit.burst(this, x, y, { texture: "kit-spark", tint: 0xffffff, n: 18, scale: 1.2 });
      DUKit.banner(this, "GOLDEN EGG!", "#ffd23f");
      DUKit.shake(this, 160, 0.008);
      if (window.DUWONDER) DUWONDER.mote(3);
      const glow = this.add.circle(x, y, 30, 0xffe9a3, 0.55).setDepth(58);
      this.tweens.add({ targets: glow, scale: 5, alpha: 0, duration: 620, ease: "cubic.out", onComplete: () => glow.destroy() });
    } else if (item.kind === "pEgg") {
      DUKit.sfx("chirp");
      const chick = this.add.image(x, y, "chick").setDepth(55).setScale(0.3);
      this.tweens.add({ targets: chick, y: y - 90, scale: 1, alpha: 0, angle: 20, duration: 800, ease: "cubic.out", onComplete: () => chick.destroy() });
      DUKit.burst(this, x, y, { tint: 0xfff0c8, n: 14 });
    } else {
      DUKit.sfx("star");
      DUKit.burst(this, x, y, { texture: "kit-star", tint: 0xffffff, n: 12, scale: 0.7, spin: true });
      DUKit.burst(this, x, y, { texture: "kit-spark", tint: 0xffe14d, n: 10, scale: 1.1 });
    }
    if (this.combo > 0 && this.combo % 5 === 0) { DUKit.banner(this, "Combo x" + mult + "!"); DUKit.sfx("sparkle"); }
    this.checkStage();
    item.destroy();
  }

  endGame() {
    this.gameOver = true;
    this.spawnTimer.paused = true;
    this.physics.pause();
    this.items.getChildren().forEach(i => i.destroy());
    DUKit.sfx("bad");
    const stars = DUKit.rating(this.score, STAR_STEPS);
    const isBest = this.score > this.best;
    this.best = Math.max(this.best, this.score);
    DUKit.setKey(STORE_KEY, { best: this.best });
    try { const prev = Number(JSON.parse(localStorage.getItem(HUB_KEY))) || 0; if (stars > prev) DUKit.setKey(HUB_KEY, stars); } catch (e) { /* ok */ }
    // Book the catch on the campaign map as well as in this page's own score, so
    // the hub knows the child played today.
    if (window.DUJourney) DUJourney.record("park.arcade", { stars });
    if (window.DUWONDER) DUWONDER.mote(stars >= 3 ? 3 : 1);
    if (stars >= 3) DUKit.celebrate(this);
    const line = "Score " + this.score + " · " + STAGES[this.stage - 1].name +
      (this.perfects ? " · " + this.perfects + " perfect" : "") +
      (isBest && this.score > 0 ? "  ·  New best!" : "");
    this.time.delayedCall(500, () => {
      DUKit.endPanel(this, { title: this.stage === 3 ? "NEST FULL!" : "ALL DONE!", line, best: bestLine(this.best), stars, again: "TAP TO PLAY AGAIN", voiceId: "arcade" }, () => { skipTitle = true; this.scene.restart(); });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.clouds.tilePositionX += (this.stage === 2 ? 26 : 8) * dt;
    this.hills.tilePositionX += 3 * dt;
    this.trees.tilePositionX += (this.stage === 2 ? 10 : 6) * dt;

    // Power-ups and the combo chain both run on the clock, not on catches, so a
    // long clever pause lets a combo fade instead of banking it for free.
    if (this.magnetT > 0) {
      this.magnetT -= dt;
      this.magnetGlow.setVisible(true).setAlpha(0.14 + 0.1 * Math.sin(time / 140));
      this.powerText.setText("🧲 " + Math.ceil(this.magnetT));
      if (this.magnetT <= 0) { this.magnetGlow.setVisible(false); this.powerText.setText(""); }
    } else if (this.slowT > 0) {
      this.slowT -= dt;
      this.powerText.setText("❄️ " + Math.ceil(this.slowT));
      if (this.slowT <= 0) this.powerText.setText("");
    }
    if (this.combo >= 3 && this.lastCatch && time - this.lastCatch > 2600) {
      this.combo = 0; this.comboText.setText("");
    }

    if (!this.ready || this.gameOver) { this.legB.angle = 0; this.legF.angle = 0; return; }

    const speed = 470;
    let vx = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.keys.D.isDown) vx = speed;
    else if (this.targetX !== null) {
      const dx = this.targetX - this.hit.x;
      vx = Math.abs(dx) < 10 ? 0 : Phaser.Math.Clamp(dx * 6, -speed, speed);
    }
    this.hit.setVelocityX(vx);
    this.dino.x = this.hit.x;
    this.magnetGlow.x = this.hit.x;
    if (vx !== 0) {
      this.dino.scaleX = vx < 0 ? -1 : 1;
      const swing = Math.sin(time / 70) * 30;
      this.legB.angle = swing; this.legF.angle = -swing;
      this.photoDino.setFrame(String(Math.floor(time / 110) % 4));
      this.photoDino.setFlipX(vx < 0);
      this.rig.y = -Math.abs(Math.sin(time / 70)) * 5;
      this.bodyImg.angle = Math.sin(time / 140) * 2;
    } else {
      this.legB.angle *= 0.8; this.legF.angle *= 0.8;
      this.rig.y *= 0.8;
      this.bodyImg.angle *= 0.8;
    }

    this.items.getChildren().slice().forEach(i => {
      if (i.y > H + 40) { if (!i.bad) { this.combo = 0; this.comboText.setText(""); this.lastCatch = 0; } i.destroy(); }
      else if (i.body) {
        // Slow feathers is one number applied to everything falling, which keeps
        // the fall table honest while still letting a child think.
        i.setVelocityY(i.baseVy * (this.slowT > 0 ? 0.45 : 1));
        if (this.magnetT > 0 && !i.bad && Math.abs(i.x - this.hit.x) < 150 && i.y > 120) {
          i.x = Phaser.Math.Linear(i.x, this.hit.x, Math.min(0.9, 5 * dt));
          i.setVelocityX(0);
        }
      }
    });
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game-root",
  backgroundColor: "#bfe8ff",
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [ParkScene]
});
