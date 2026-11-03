// Dino Adventures — Phaser 3 balloon flight: flap through cloud gaps and collect eggs.
const W = 960, H = 540;
const STORE_KEY = "dino-adventures-phaser-v1";
const EMBEDDED = window.self !== window.top;
const GAP = 190;
const STAR_STEPS = [5, 12, 25];
let skipTitle = false;

function loadBest() {
  try { return Math.max(0, Number(JSON.parse(localStorage.getItem(STORE_KEY)).best) || 0); } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ best: v })); } catch (e) { /* ok without storage */ }
}

class FlightScene extends Phaser.Scene {
  constructor() { super("flight"); }

  preload() {
    DUKit.textures(this);
    const g = this.make.graphics({ add: false });

    // Dino hanging from a balloon.
    g.fillStyle(0xff6b6b, 1);
    g.fillEllipse(40, 30, 56, 66);
    g.fillStyle(0xffffff, 0.45);
    g.fillEllipse(28, 18, 14, 20);
    g.lineStyle(2, 0x7a5a3a, 1);
    g.lineBetween(40, 62, 36, 90);
    g.lineBetween(40, 62, 56, 90);
    g.fillStyle(0x58c26a, 1);
    g.fillEllipse(46, 106, 40, 30);
    g.fillCircle(66, 94, 14);
    g.fillStyle(0x439f54, 1);
    g.fillTriangle(22, 108, 30, 100, 30, 116);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(70, 90, 4);
    g.fillStyle(0x222222, 1);
    g.fillCircle(72, 90, 2);
    g.generateTexture("flyer", 86, 126);

    // Cloud pillar segment (tiled to build gates).
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, 90, 60, 28);
    g.fillStyle(0xdde9f5, 1);
    g.fillRoundedRect(8, 30, 74, 26, 14);
    g.generateTexture("cloudBlock", 90, 60);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture("dot", 16, 16);
    g.destroy();

    const mk = (key, emoji, size) => {
      const t = this.add.text(0, 0, emoji, { fontSize: size + "px", fontFamily: "sans-serif" });
      t.setPadding(4);
      const rt = this.make.renderTexture({ width: Math.ceil(t.width), height: Math.ceil(t.height), add: false });
      rt.draw(t, 0, 0);
      rt.saveTexture(key);
      t.destroy();
    };
    mk("egg", "🥚", 36);
    mk("star", "⭐", 36);
  }

  create() {
    this.score = 0;
    this.best = loadBest();
    this.gameOver = false;
    this.started = false;
    this.ready = false;
    this.speed = 220;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x69c8ff, 0x69c8ff, 0xfff1d6, 0xfff1d6, 1);
    sky.fillRect(0, 0, W, H);
    DUKit.sunRays(this, 160, 90, 220);
    this.add.circle(160, 90, 42, 0xffe27a, 0.95);
    DUKit.sparkleField(this, 14, 40, 30, 920, 360, 0xffffff);

    const hillTex = this.make.graphics({ add: false });
    hillTex.fillStyle(0x56b975, 1);
    hillTex.fillEllipse(100, 90, 200, 110);
    hillTex.generateTexture("hill", 200, 90);
    hillTex.destroy();
    const cl = this.make.graphics({ add: false });
    cl.fillStyle(0xffffff, 0.9); cl.fillEllipse(30, 22, 60, 26); cl.fillEllipse(62, 16, 44, 22);
    cl.generateTexture("farCloud", 94, 40); cl.destroy();
    this.farClouds = this.add.tileSprite(W / 2, 90, W, 40, "farCloud").setAlpha(0.85);
    this.farClouds2 = this.add.tileSprite(W / 2, 200, W, 40, "farCloud").setAlpha(0.55);
    this.farClouds2.tilePositionX = 50;
    this.hills = this.add.tileSprite(W / 2, H - 40, W, 90, "hill");
    this.add.rectangle(W / 2, H - 10, W, 30, 0x4a9f4c);

    this.physics.world.gravity.y = 1100;
    this.player = this.physics.add.sprite(220, H / 2, "flyer");
    this.player.body.setSize(54, 100).setOffset(16, 10);
    this.player.body.setAllowGravity(false);

    // Balloon trail.
    this.trail = this.add.particles(0, 0, "dot", {
      speed: { min: 10, max: 40 }, angle: { min: 160, max: 200 }, lifespan: 500, scale: { start: 0.45, end: 0 },
      alpha: { start: 0.7, end: 0 }, tint: 0xffffff, frequency: 70
    });
    this.trail.startFollow(this.player, -30, 40);

    this.walls = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.physics.add.collider(this.player, this.walls, () => this.crash(), null, this);
    this.physics.add.overlap(this.player, this.pickups, (p, it) => this.collect(it), null, this);

    this.spawner = this.time.addEvent({ delay: 1700, loop: true, paused: true, callback: () => this.spawnGate() });

    const style = { fontSize: "30px", fontFamily: "system-ui,sans-serif", color: "#fff", stroke: "#17403a", strokeThickness: 6 };
    this.scoreText = this.add.text(66, 14, "0", style).setDepth(60);
    this.bestText = this.add.text(W - 18, 16, "Best " + this.best, { ...style, fontSize: "20px" }).setOrigin(1, 0);
    this.hint = this.add.text(W / 2, H / 2 + 110, "TAP or SPACE to flap", { fontSize: "24px", fontFamily: "system-ui,sans-serif", color: "#fff", stroke: "#17403a", strokeThickness: 5 }).setOrigin(0.5);
    this.tweens.add({ targets: this.player, y: this.player.y - 14, duration: 700, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.sway = this.tweens.add({ targets: this.player, angle: { from: -5, to: 5 }, duration: 900, yoyo: true, repeat: -1, ease: "sine.inOut" });

    this.starIcon = this.add.image(36, 36, "kit-star").setScale(0.9).setDepth(60);
    this.input.keyboard.on("keydown-SPACE", () => this.flap());
    this.input.on("pointerdown", () => this.flap());

    DUKit.ready();
    if (skipTitle) this.ready = true;
    else DUKit.title(this, { title: "Balloon Flight", emoji: "🎈", color: 0x4aa8ff, cssColor: "#3b8fe0", hint: "Tap or press Space to flap. Float through the clouds and catch eggs and stars." }, () => { this.ready = true; });
  }

  flap() {
    if (!this.ready || this.gameOver) return;
    if (!this.started) {
      this.started = true;
      this.tweens.killTweensOf(this.player);
      if (this.sway) this.sway.stop();
      this.player.body.setAllowGravity(true);
      this.spawner.paused = false;
      this.hint.destroy();
      this.spawnGate();
    }
    this.player.setVelocityY(-390);
    DUKit.sfx("whoosh");
    this.tweens.add({ targets: this.player, angle: { from: -14, to: 0 }, duration: 240 });
    const puff = this.add.particles(this.player.x - 10, this.player.y + 20, "dot", {
      speed: { min: 30, max: 90 }, angle: { min: 70, max: 110 }, lifespan: 300, scale: { start: 0.5, end: 0 }, quantity: 6, emitting: false
    });
    puff.explode(6);
    this.time.delayedCall(350, () => puff.destroy());
  }

  spawnGate() {
    if (this.gameOver) return;
    const gapY = Phaser.Math.Between(150, H - 150);
    const x = W + 60;
    const topH = gapY - GAP / 2;
    const botH = H - 40 - (gapY + GAP / 2);
    const mkWall = (y, h, origin) => {
      const w = this.add.tileSprite(x, y, 90, Math.max(h, 10), "cloudBlock").setOrigin(0.5, origin);
      this.physics.add.existing(w);
      w.body.setAllowGravity(false).setImmovable(true);
      w.body.setVelocityX(-this.speed);
      this.walls.add(w);
    };
    mkWall(0, topH, 0);
    mkWall(H - 40, botH, 1);
    const tex = Math.random() < 0.7 ? "egg" : "star";
    const it = this.pickups.create(x, gapY, tex);
    it.body.setAllowGravity(false);
    it.setVelocityX(-this.speed);
    it.value = tex === "star" ? 2 : 1;
    this.tweens.add({ targets: it, scale: 1.2, duration: 400, yoyo: true, repeat: -1 });
  }

  collect(it) {
    this.score += it.value;
    this.scoreText.setText(String(this.score));
    this.tweens.add({ targets: this.scoreText, scale: 1.3, duration: 120, yoyo: true });
    this.tweens.add({ targets: this.starIcon, angle: 360, scale: 1.3, duration: 320, onComplete: () => this.starIcon.setAngle(0).setScale(0.9) });
    DUKit.sfx(it.value > 1 ? "star" : "chirp");
    DUKit.floatText(this, it.x, it.y - 20, "+" + it.value);
    if (this.score % 10 < it.value && this.score >= 10) { DUKit.banner(this, "Wow! " + this.score); DUKit.sfx("sparkle"); }
    const e = this.add.particles(it.x, it.y, "dot", {
      speed: { min: 80, max: 240 }, lifespan: 450, scale: { start: 0.8, end: 0 }, tint: 0xffd23f, quantity: 14, emitting: false
    });
    e.explode(14);
    this.time.delayedCall(500, () => e.destroy());
    it.destroy();
    this.speed = Math.min(400, 220 + this.score * 6);
  }

  crash() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    this.spawner.paused = true;
    this.player.setTint(0xff6666);
    this.cameras.main.shake(260, 0.014);
    DUKit.sfx("thud"); DUKit.sfx("bad");
    DUKit.burst(this, this.player.x, this.player.y, { tint: 0xffffff, n: 22, gravity: 500, life: 700 });
    const stars = DUKit.rating(this.score, STAR_STEPS);
    const isBest = this.score > this.best;
    this.best = Math.max(this.best, this.score);
    saveBest(this.best);
    this.time.delayedCall(600, () => {
      DUKit.endPanel(this, { title: "OOPS!", line: "Score " + this.score + (isBest && this.score > 0 ? "  ·  New best!" : ""), best: "Best " + this.best, stars, again: "TAP TO FLY AGAIN" }, () => { skipTitle = true; this.scene.restart(); });
    });
  }

  update(time, delta) {
    this.hills.tilePositionX += this.speed * 0.2 * (delta / 1000);
    this.farClouds.tilePositionX += 14 * (delta / 1000);
    this.farClouds2.tilePositionX += 7 * (delta / 1000);
    if (this.gameOver || !this.started) return;
    if (this.player.y < -20 || this.player.y > H - 30) this.crash();
    if (this.player.body.velocity.y > 200) this.player.setAngle(Math.min(25, this.player.angle + 1.2));
    this.walls.getChildren().slice().forEach(w => { w.body.setVelocityX(-this.speed); if (w.x < -80) w.destroy(); });
    this.pickups.getChildren().slice().forEach(p => { if (p.x < -60) p.destroy(); });
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game-root",
  backgroundColor: "#69c8ff",
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [FlightScene]
});
