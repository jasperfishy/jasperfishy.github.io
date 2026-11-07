// Dino Meadow — Phaser 3 memory match over a layered, drifting parallax meadow.
const W = 960, H = 540;
const STORE_KEY = "dino-meadow-phaser-v1";
const EMBEDDED = window.self !== window.top;
let skipTitle = false;
const FACES = ["🦕", "🦖", "🌼", "🦋", "🥚", "🍓", "🌻", "🐢"];

function loadBest() {
  try { const v = Number(JSON.parse(localStorage.getItem(STORE_KEY)).best); return v > 0 ? v : 0; } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ best: v })); } catch (e) { /* ok without storage */ }
}

class MeadowScene extends Phaser.Scene {
  constructor() { super("meadow"); }

  preload() {
    DUKit.textures(this);
    const g = this.make.graphics({ add: false });

    // Distant mountains, mid-ground trees and foreground grass tiles (each seamless).
    g.fillStyle(0x9ec7df, 1);
    g.fillTriangle(0, 140, 110, 30, 220, 140);
    g.fillTriangle(150, 140, 280, 10, 410, 140);
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(95, 50, 110, 30, 125, 52);
    g.fillTriangle(262, 30, 280, 10, 298, 32);
    g.generateTexture("mountains", 410, 140);

    g.clear();
    g.fillStyle(0x7a5a3a, 1);
    g.fillRect(34, 80, 12, 50);
    g.fillRect(154, 90, 10, 40);
    g.fillStyle(0x3f9d63, 1);
    g.fillCircle(40, 62, 36);
    g.fillStyle(0x56b975, 1);
    g.fillCircle(160, 66, 30);
    g.generateTexture("trees", 200, 130);

    g.clear();
    g.fillStyle(0x6ec26a, 1);
    g.fillRect(0, 20, 120, 60);
    g.fillStyle(0x4a9f4c, 1);
    for (let i = 0; i < 8; i++) g.fillTriangle(i * 15, 20, i * 15 + 7, 0, i * 15 + 14, 20);
    g.generateTexture("grass", 120, 80);

    g.clear();
    g.fillStyle(0x2a9d8f, 1);
    g.fillRoundedRect(0, 0, 120, 120, 18);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(60, 60, 26);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(60, 60, 10);
    g.generateTexture("cardBack", 120, 120);

    g.clear();
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(0, 0, 120, 120, 18);
    g.generateTexture("cardFront", 120, 120);

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
    FACES.forEach((f, i) => mk("face" + i, f, 64));
    mk("butterfly", "🦋", 30);
  }

  create() {
    this.ready = false;
    this.best = loadBest();
    this.moves = 0;
    this.matched = 0;
    this.busy = false;
    this.first = null;

    // Layered parallax background: sky, sun, mountains, trees, grass.
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x8fd3ff, 0x8fd3ff, 0xe4f6c9, 0xe4f6c9, 1);
    sky.fillRect(0, 0, W, H);
    DUKit.sunRays(this, 840, 90, 220);
    const sun = this.add.circle(840, 90, 46, 0xffe27a, 0.95);
    DUKit.sparkleField(this, 14, 40, 30, 920, 300, 0xffffff);
    this.tweens.add({ targets: sun, scale: 1.08, duration: 1800, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.mountains = this.add.tileSprite(W / 2, 300, W, 140, "mountains").setAlpha(0.85);
    this.trees = this.add.tileSprite(W / 2, 400, W, 130, "trees");
    this.grass = this.add.tileSprite(W / 2, H - 30, W, 80, "grass");

    // Ambient butterflies and drifting pollen.
    for (let i = 0; i < 3; i++) {
      const b = this.add.image(Phaser.Math.Between(80, W - 80), Phaser.Math.Between(60, 200), "butterfly");
      this.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-160, 160), y: b.y + Phaser.Math.Between(-40, 60), duration: Phaser.Math.Between(2600, 4200), yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
    this.add.particles(0, 0, "dot", {
      x: { min: 0, max: W }, y: { min: 0, max: H - 80 }, lifespan: 4000, speedX: { min: 8, max: 30 }, speedY: { min: -10, max: 10 },
      scale: { start: 0.25, end: 0 }, alpha: { start: 0.6, end: 0 }, tint: 0xfff3a8, frequency: 300
    });

    // HUD
    const style = { fontSize: "28px", fontFamily: "system-ui,sans-serif", color: "#fff", stroke: "#1f5d3a", strokeThickness: 6 };
    this.movesText = this.add.text(66, 14, "Moves 0", style).setDepth(60);
    this.bestText = this.add.text(W - 18, 16, this.best ? "Best " + this.best : "", style).setOrigin(1, 0);

    // Swaying flowers along the bottom.
    ["🌼", "🌸", "🌷", "🌻"].forEach((e, k) => DUKit.emoji(this, "fl" + k, e, 30));
    for (let i = 0; i < 16; i++) {
      const f = this.add.image(20 + i * 60 + Phaser.Math.Between(-10, 10), H - 28 + Phaser.Math.Between(-6, 8), "fl" + (i % 4)).setOrigin(0.5, 1).setDepth(3);
      this.tweens.add({ targets: f, angle: { from: -9, to: 9 }, duration: Phaser.Math.Between(900, 1500), yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 70 });
    }
    this.starIcon = this.add.image(36, 34, "kit-star").setScale(0.9).setDepth(60);
    this.pairsText = this.add.text(66, 62, "Pairs 0 / 6", { fontSize: "18px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#1f5d3a", strokeThickness: 5 }).setDepth(60);

    this.deal();
    DUKit.ready();
    if (skipTitle) this.ready = true;
    else DUKit.title(this, { title: "Meadow Memory", emoji: "🌼", color: 0x2a9d8f, cssColor: "#2a9d8f", hint: "Flip two cards at a time and find every matching pair." }, () => { this.ready = true; });
  }

  deal() {
    const ids = Phaser.Utils.Array.Shuffle([...Array(FACES.length).keys()]).slice(0, 6);
    const deck = Phaser.Utils.Array.Shuffle([...ids, ...ids]);
    const cols = 4, size = 120, gap = 16;
    const startX = W / 2 - (cols * size + (cols - 1) * gap) / 2 + size / 2;
    const startY = 120 + size / 2;
    this.cards = deck.map((id, i) => {
      const x = startX + (i % cols) * (size + gap);
      const y = startY + Math.floor(i / cols) * (size + gap);
      const back = this.add.image(0, 0, "cardBack");
      const face = this.add.image(0, 0, "cardFront").setVisible(false);
      const icon = this.add.image(0, 0, "face" + id).setVisible(false);
      const c = this.add.container(x, y, [back, face, icon]).setSize(size, size).setInteractive({ useHandCursor: true });
      c.id = id; c.flipped = false; c.done = false; c.parts = { back, face, icon };
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, duration: 320, delay: i * 50, ease: "back.out" });
      c.on("pointerdown", () => this.flip(c));
      c.on("pointerover", () => { if (!c.done && !c.flipped && this.ready) this.tweens.add({ targets: c, scale: 1.07, duration: 100 }); });
      c.on("pointerout", () => { if (!c.done) this.tweens.add({ targets: c, scale: 1, duration: 100 }); });
      return c;
    });
  }

  setFace(c, up) {
    c.parts.back.setVisible(!up);
    c.parts.face.setVisible(up);
    c.parts.icon.setVisible(up);
  }

  flipTween(c, up, done) {
    this.tweens.add({
      targets: c, scaleX: 0, duration: 110,
      onComplete: () => {
        this.setFace(c, up);
        this.tweens.add({ targets: c, scaleX: 1, duration: 110, onComplete: done });
      }
    });
  }

  flip(c) {
    if (!this.ready || this.busy || c.flipped || c.done) return;
    c.flipped = true;
    DUKit.sfx("tap");
    this.flipTween(c, true, () => {
      if (!this.first) { this.first = c; return; }
      this.moves += 1;
      this.movesText.setText("Moves " + this.moves);
      const a = this.first, b = c;
      this.first = null;
      if (a.id === b.id) this.match(a, b);
      else {
        this.busy = true;
        this.time.delayedCall(650, () => {
          DUKit.sfx("bad");
          this.tweens.add({ targets: [a, b], angle: { from: -6, to: 6 }, duration: 60, yoyo: true, repeat: 1 });
          this.flipTween(a, false, () => { a.flipped = false; });
          this.flipTween(b, false, () => { b.flipped = false; this.busy = false; });
        });
      }
    });
  }

  match(a, b) {
    [a, b].forEach(c => {
      c.done = true;
      this.tweens.add({ targets: c, scale: 1.2, duration: 160, yoyo: true, ease: "back.out" });
      const e = this.add.particles(c.x, c.y, "dot", {
        speed: { min: 90, max: 260 }, lifespan: 520, scale: { start: 0.8, end: 0 }, tint: [0xffd23f, 0xff8fb1, 0x7fd16e], quantity: 16, emitting: false
      });
      e.explode(16);
      this.time.delayedCall(560, () => e.destroy());
    });
    this.matched += 1;
    this.pairsText.setText("Pairs " + this.matched + " / 6");
    DUKit.sfx("good"); DUKit.sfx("sparkle");
    DUKit.floatText(this, (a.x + b.x) / 2, (a.y + b.y) / 2, "Pair!");
    this.tweens.add({ targets: this.starIcon, angle: 360, scale: 1.3, duration: 320, onComplete: () => this.starIcon.setAngle(0).setScale(0.9) });
    if (this.matched === 6) this.win();
  }

  win() {
    const first = !this.best || this.moves < this.best;
    if (first) { this.best = this.moves; saveBest(this.best); }
    this.bestText.setText("Best " + this.best);
    const stars = this.moves <= 8 ? 3 : this.moves <= 12 ? 2 : 1;
    this.time.delayedCall(700, () => {
      DUKit.endPanel(this, { title: "WELL DONE!", line: "All pairs in " + this.moves + " moves" + (first ? "  ·  New best!" : ""), best: "Best " + this.best + " moves", stars }, () => { skipTitle = true; this.scene.restart(); });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.mountains.tilePositionX += 6 * dt;
    this.trees.tilePositionX += 14 * dt;
    this.grass.tilePositionX += 28 * dt;
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game-root",
  backgroundColor: "#8fd3ff",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MeadowScene]
});
