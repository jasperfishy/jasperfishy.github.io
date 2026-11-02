// Dino Park — Phaser 3 "catch the falling items": animated dino, combos, sound, star ratings.
const W = 960, H = 540;
const FLOOR_Y = 480;
const STORE_KEY = "dino-park-phaser-v1";
const HUB_KEY = "dino_catch";
const STAR_STEPS = [15, 40, 80];
let skipTitle = false;

class ParkScene extends Phaser.Scene {
  constructor() { super("park"); }

  preload() {
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
    g.destroy();

    DUKit.emoji(this, "chick", "🐣", 44);
    DUKit.emoji(this, "heart", "❤️", 30);
    DUKit.emoji(this, "heartOff", "🖤", 30);
    DUKit.emoji(this, "flower1", "🌼", 26);
    DUKit.emoji(this, "flower2", "🌸", 26);
    DUKit.emoji(this, "flower3", "🌷", 26);
  }

  create() {
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
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
    this.add.circle(830, 90, 44, 0xffe27a, 1);
    DUKit.sparkleField(this, 12, 560, 30, 940, 180, 0xffffff);
    this.clouds = this.add.tileSprite(W / 2, 80, W, 40, "pCloud").setAlpha(0.9);
    this.hills = this.add.tileSprite(W / 2, FLOOR_Y - 56, W, 90, "pHills");
    this.trees = this.add.tileSprite(W / 2, FLOOR_Y - 42, W, 130, "pTrees");
    this.add.rectangle(W / 2, (FLOOR_Y + H) / 2 + 20, W, H - FLOOR_Y + 40, 0x6ec26a);
    this.add.rectangle(W / 2, FLOOR_Y + 4, W, 10, 0x4a8f3c);
    for (let i = 0; i < 14; i++) {
      const f = this.add.image(30 + i * 68 + Phaser.Math.Between(-12, 12), FLOOR_Y + Phaser.Math.Between(14, 44), "flower" + (1 + (i % 3))).setOrigin(0.5, 1).setDepth(8);
      this.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: Phaser.Math.Between(900, 1500), yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 80 });
    }
    this.add.particles(0, -10, "kit-dot", {
      x: { min: 0, max: W }, lifespan: 6000, speedY: { min: 20, max: 50 }, speedX: { min: -20, max: 20 },
      scale: { start: 0.3, end: 0.08 }, alpha: { start: 0.5, end: 0 }, tint: 0x8fd18f, frequency: 450
    });

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

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("A,D");
    this.input.on("pointerdown", p => { if (this.ready && !this.gameOver) this.targetX = p.worldX; });
    this.input.on("pointermove", p => { if (p.isDown && this.ready && !this.gameOver) this.targetX = p.worldX; });
    this.input.on("pointerup", () => { this.targetX = null; });

    DUKit.ready();
    if (skipTitle) this.begin();
    else DUKit.title(this, { title: "Dino Park", emoji: "🥚", color: 0xf2a541, cssColor: "#e08a1e", hint: "Catch eggs and stars. Dodge the spiky balls! Use ← → or drag." }, () => this.begin());
  }

  begin() {
    this.ready = true;
    this.spawnTimer.paused = false;
    this.spawnItem();
  }

  spawnItem() {
    if (this.gameOver) return;
    const bad = Math.random() < 0.26;
    const tex = bad ? "pBad" : (Math.random() < 0.6 ? "pEgg" : "pStar");
    const item = this.items.create(Phaser.Math.Between(50, W - 50), -40, tex);
    item.setScale(0.7);
    item.bad = bad;
    item.kind = tex;
    item.value = tex === "pStar" ? 2 : 1;
    item.body.setAllowGravity(false);
    item.body.setCircle(26, 14, 14);
    item.setVelocityY(Phaser.Math.Between(150, 230) + Math.min(180, this.score * 2));
    if (tex === "pEgg") this.tweens.add({ targets: item, angle: { from: -14, to: 14 }, duration: 420, yoyo: true, repeat: -1, ease: "sine.inOut" });
    else if (tex === "pStar") this.tweens.add({ targets: item, angle: 360, duration: 1800, repeat: -1 });
    else this.tweens.add({ targets: item, angle: 360, scale: 0.78, duration: 1000, repeat: -1, yoyo: false });
    this.spawnTimer.delay = Math.max(380, 800 - this.score * 6);
  }

  setHearts() {
    this.hearts.forEach((h, i) => h.setTexture(i < this.lives ? "heart" : "heartOff"));
  }

  caught(item) {
    if (!item.active || this.gameOver) return;
    const x = item.x, y = item.y;
    this.tweens.add({ targets: this.head, scale: 1.18, duration: 90, yoyo: true });
    if (item.bad) {
      this.lives -= 1; this.combo = 0; this.comboText.setText("");
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
    } else {
      this.combo += 1;
      const mult = Math.min(3, 1 + Math.floor(this.combo / 5));
      const pts = item.value * mult;
      this.score += pts;
      this.scoreText.setText(String(this.score));
      this.tweens.add({ targets: this.scoreText, scale: 1.35, duration: 110, yoyo: true });
      this.tweens.add({ targets: this.starIcon, angle: 360, scale: 1.3, duration: 320, onComplete: () => this.starIcon.setAngle(0).setScale(0.9) });
      this.comboText.setText(this.combo >= 3 ? "Combo " + this.combo + (mult > 1 ? "  x" + mult : "") : "");
      DUKit.floatText(this, x, y - 10, "+" + pts, mult > 1 ? "#ff9f43" : "#ffe14d");
      DUKit.sfx("note", this.combo % 12, 0.25);
      if (item.kind === "pEgg") {
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
    }
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
    this.time.delayedCall(500, () => {
      DUKit.endPanel(this, { title: "ALL DONE!", line: "Score " + this.score + (isBest && this.score > 0 ? "  ·  New best!" : ""), best: "Best " + this.best, stars, again: "TAP TO PLAY AGAIN" }, () => { skipTitle = true; this.scene.restart(); });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.clouds.tilePositionX += 8 * dt;
    this.hills.tilePositionX += 3 * dt;
    this.trees.tilePositionX += 6 * dt;
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
    if (vx !== 0) {
      this.dino.scaleX = vx < 0 ? -1 : 1;
      const swing = Math.sin(time / 70) * 30;
      this.legB.angle = swing; this.legF.angle = -swing;
      this.rig.y = -Math.abs(Math.sin(time / 70)) * 5;
      this.bodyImg.angle = Math.sin(time / 140) * 2;
    } else {
      this.legB.angle *= 0.8; this.legF.angle *= 0.8;
      this.rig.y *= 0.8;
      this.bodyImg.angle *= 0.8;
    }

    this.items.getChildren().slice().forEach(i => {
      if (i.y > H + 40) { if (!i.bad) { this.combo = 0; this.comboText.setText(""); } i.destroy(); }
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
