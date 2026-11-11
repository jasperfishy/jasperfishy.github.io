// Dino Meadow — Phaser 3 memory match: three board levels, a bouncing buddy and
// nudges instead of buzzers, over a layered, drifting parallax meadow.
const W = 960, H = 540;
const STORE_KEY = "dino-meadow-phaser-v1";
const EMBEDDED = window.self !== window.top;
let skipTitle = false;
// Tells the shared kit which story voice belongs to this scene: meadow.arcade.
window.DU_WORLD_ID = "meadow";
const FACES = ["🦕", "🦖", "🌼", "🦋", "🥚", "🍓", "🌻", "🐢", "🐾", "🍄", "🐛", "🪨"];
const NAMES = ["dino", "hatchling", "flower", "butterfly", "egg", "berry", "sunflower", "turtle", "footprint", "mushroom", "caterpillar", "stone"];
// Six pairs is the scale the campaign map's 8/12 rule is written on, so every
// board is scored on that same scale and a bigger one never costs earned stars.
const TIERS = [
  { label: "Flower Meadow", cols: 4, size: 120, gap: 16, top: 120, faces: [2, 3, 5, 6, 0, 7] },
  { label: "Egg Hollow", cols: 4, size: 92, gap: 12, top: 104, faces: [4, 1, 8, 10, 3, 9, 6, 0] },
  { label: "Butterfly Hill", cols: 5, size: 84, gap: 12, top: 108, faces: [3, 11, 9, 0, 2, 4, 8, 10, 5, 1] }
];

// Moves are the wrong way round for DUKit.rating, so flip them into quality points
// that mean exactly what the old "8 moves / 12 moves" rule meant.
function rateMoves(adj) { return Math.max(1, DUKit.rating(Math.max(0, 20 - adj), [3, 8, 12])); }

// Stage callouts have no narration key of their own, so a friend says them live.
// hush first: the story band keeps a timer per line, and an older line's timer
// would otherwise blank a newer one early.
const hush = () => { try { const S = window.DUSTORY; if (S && S.hush) S.hush(); } catch (e) { /* story is optional */ } };
const say = (text, who) => { try { const S = window.DUSTORY; if (!S || !S.whisper) return; hush(); S.whisper(text, who || "pip"); } catch (e) { /* story is optional */ } };

// best stays "fewest moves on the six-pair scale" — the one number the ledger reads.
function loadStore() {
  try {
    const o = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    return {
      best: Number(o.best) > 0 ? Number(o.best) : 0,
      time: Number(o.time) > 0 ? Math.round(Number(o.time)) : 0,
      tier: Math.max(0, Math.min(TIERS.length - 1, Math.floor(Number(o.tier) || 0)))
    };
  } catch (e) { return { best: 0, time: 0, tier: 0 }; }
}
const STORE = loadStore();
function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); } catch (e) { /* ok without storage */ }
}
function loadBest() { return STORE.best; }
function saveBest(v) { STORE.best = v; saveStore(); }

// The best score line used to be a private number; now it shows the same total
// the campaign map keeps, so the two screens never disagree out loud.
function bestLine() {
  const J = window.DUJourney;
  return "Best " + STORE.best + " moves" + (STORE.time ? " · ⏱ " + STORE.time + "s" : "") +
    " · Level " + (STORE.tier + 1) + (J ? " · 🗺 " + J.total() + " stars" : "");
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
    g.fillStyle(0xffffff, 0.92);
    g.fillEllipse(30, 26, 62, 28); g.fillEllipse(62, 20, 46, 24); g.fillEllipse(46, 32, 74, 22);
    g.generateTexture("cloud", 96, 46);

    g.clear();
    g.fillStyle(0x2a9d8f, 1);
    g.fillRoundedRect(0, 0, 120, 120, 18);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(60, 60, 26);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(60, 60, 10);
    g.fillStyle(0xffffff, 0.28);
    for (let i = 0; i < 3; i++) g.fillRoundedRect(16, 14 + i * 36, 88, 9, 5);
    g.generateTexture("cardBack", 120, 120);

    g.clear();
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(0, 0, 120, 120, 18);
    g.lineStyle(7, 0xffe27a, 1);
    g.strokeRoundedRect(4, 4, 112, 112, 15);
    g.generateTexture("cardFront", 120, 120);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture("dot", 16, 16);
    g.destroy();

    // One painted texture per themed pair, so a match is a little picture, not a glyph.
    FACES.forEach((f, i) => DUKit.emoji(this, "face" + i, f, 64));
    DUKit.emoji(this, "butterfly", "🦋", 30);
    DUKit.emoji(this, "dragonfly", "🪰", 26);
    DUKit.emoji(this, "buddyBig", "🦕", 110);
  }

  create() {
    this.ready = false;
    this.best = STORE.best;
    this.moves = 0;
    this.matched = 0;
    this.busy = false;
    this.first = null;
    this.tier = STORE.tier;
    this.streak = 0;
    this.misses = 0;
    this.totalMoves = 0;
    this.totalTime = 0;
    this.tierStars = [];
    this.tierStart = this.time.now;

    // Layered parallax background: sky, sun, clouds, mountains, trees, grass.
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x8fd3ff, 0x8fd3ff, 0xe4f6c9, 0xe4f6c9, 1);
    sky.fillRect(0, 0, W, H);
    DUKit.sunRays(this, 840, 90, 220);
    const sun = this.add.circle(840, 90, 46, 0xffe27a, 0.95);
    DUKit.sparkleField(this, 14, 40, 30, 920, 300, 0xffffff);
    this.tweens.add({ targets: sun, scale: 1.08, duration: 1800, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.mountains = this.add.tileSprite(W / 2, 300, W, 140, "mountains").setAlpha(0.85);
    this.clouds = this.add.tileSprite(W / 2, 104, W, 46, "cloud").setAlpha(0.85);
    this.clouds2 = this.add.tileSprite(W / 2, 178, W, 46, "cloud").setAlpha(0.5);
    this.clouds2.tilePositionX = 48;
    this.trees = this.add.tileSprite(W / 2, 400, W, 130, "trees");
    this.grass = this.add.tileSprite(W / 2, H - 30, W, 80, "grass");

    // Ambient butterflies, dragonflies, pollen and drifting petals.
    for (let i = 0; i < 4; i++) {
      const b = this.add.image(Phaser.Math.Between(80, W - 80), Phaser.Math.Between(60, 200), i % 2 ? "butterfly" : "dragonfly");
      this.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-160, 160), y: b.y + Phaser.Math.Between(-40, 60), duration: Phaser.Math.Between(2600, 4200), yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
    this.add.particles(0, 0, "dot", {
      x: { min: 0, max: W }, y: { min: 0, max: H - 80 }, lifespan: 4000, speedX: { min: 8, max: 30 }, speedY: { min: -10, max: 10 },
      scale: { start: 0.25, end: 0 }, alpha: { start: 0.6, end: 0 }, tint: 0xfff3a8, frequency: 300
    });
    this.add.particles(0, -12, "dot", {
      x: { min: 40, max: W - 40 }, lifespan: 5200, speedX: { min: -24, max: 24 }, speedY: { min: 26, max: 52 },
      scale: { start: 0.32, end: 0.08 }, alpha: { start: 0.75, end: 0 }, tint: [0xffb1c6, 0xffe27a, 0xffffff], frequency: 700
    });

    // A meadow buddy who bounces whenever a pair turns up.
    this.buddy = this.add.image(56, 452, "buddyBig").setDepth(4);
    this.tweens.add({ targets: this.buddy, y: 446, angle: { from: -5, to: 5 }, duration: 1200, yoyo: true, repeat: -1, ease: "sine.inOut" });

    // HUD
    const style = { fontSize: "28px", fontFamily: "system-ui,sans-serif", color: "#fff", stroke: "#1f5d3a", strokeThickness: 6 };
    this.movesText = this.add.text(150, 14, "Moves 0", style).setDepth(60);
    this.timeText = this.add.text(W - 18, 46, "", { fontSize: "18px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#1f5d3a", strokeThickness: 5 }).setOrigin(1, 0).setDepth(60);
    this.bestText = this.add.text(W - 18, 16, this.best ? "Best " + this.best : "", { fontSize: "18px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#1f5d3a", strokeThickness: 5 }).setOrigin(1, 0).setDepth(60);

    // Swaying flowers along the bottom.
    ["🌼", "🌸", "🌷", "🌻"].forEach((e, k) => DUKit.emoji(this, "fl" + k, e, 30));
    for (let i = 0; i < 16; i++) {
      const f = this.add.image(20 + i * 60 + Phaser.Math.Between(-10, 10), H - 28 + Phaser.Math.Between(-6, 8), "fl" + (i % 4)).setOrigin(0.5, 1).setDepth(3);
      this.tweens.add({ targets: f, angle: { from: -9, to: 9 }, duration: Phaser.Math.Between(900, 1500), yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 70 });
    }
    this.starIcon = this.add.image(36, 34, "kit-star").setScale(0.9).setDepth(60);
    this.pairsText = this.add.text(150, 62, "", { fontSize: "18px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#1f5d3a", strokeThickness: 5 }).setDepth(60);
    this.levelText = this.add.text(66, 14, "Level 1", { fontSize: "30px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", stroke: "#1f5d3a", strokeThickness: 7 }).setDepth(60);
    this.ribbon = this.add.text(W / 2, 92, "", { fontSize: "20px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", backgroundColor: "rgba(42,157,143,.5)", padding: { x: 14, y: 4 } }).setOrigin(0.5).setDepth(60);

    this.deal();
    DUKit.ready();
    // "Play again" skips the card once; coming back later should still teach.
    if (skipTitle) { skipTitle = false; this.ready = true; }
    else DUKit.title(this, { title: "Meadow Memory", emoji: "🌼", color: 0x2a9d8f, cssColor: "#2a9d8f", voiceId: "arcade", hint: "Flip two cards at a time and find every pair. Clear a level and the next one opens!" }, () => { this.ready = true; });
  }

  cfg() { return TIERS[this.tier]; }

  // Moves counted on the six-pair scale, so all three levels are worth the same stars.
  scaled(moves) { return Math.max(1, (moves === undefined ? this.moves : moves) - (this.cfg().faces.length - 6)); }

  clock() { return Math.round((this.time.now - this.tierStart) / 1000); }

  deal() {
    if (this.cards) this.cards.forEach(c => c.destroy());
    const t = this.cfg();
    this.moves = 0; this.matched = 0; this.streak = 0; this.misses = 0;
    this.first = null; this.busy = false; this.tierStart = this.time.now;
    const deck = Phaser.Utils.Array.Shuffle([...t.faces, ...t.faces]);
    const cols = t.cols, size = t.size, gap = t.gap, iscale = size / 120;
    const startX = W / 2 - (cols * size + (cols - 1) * gap) / 2 + size / 2;
    const startY = t.top + size / 2;
    this.movesText.setText("Moves 0");
    this.pairsText.setText("Pairs 0 / " + t.faces.length);
    this.levelText.setText("Level " + (this.tier + 1));
    this.ribbon.setText(t.label + " · " + cols + " × " + Math.ceil(deck.length / cols));
    this.cards = deck.map((id, i) => {
      const x = startX + (i % cols) * (size + gap);
      const y = startY + Math.floor(i / cols) * (size + gap);
      const back = this.add.image(0, 0, "cardBack").setScale(iscale);
      const face = this.add.image(0, 0, "cardFront").setVisible(false).setScale(iscale);
      const icon = this.add.image(0, 0, "face" + id).setVisible(false).setScale(iscale);
      const c = this.add.container(x, y, [back, face, icon]).setSize(size, size).setInteractive({ useHandCursor: true });
      c.id = id; c.flipped = false; c.done = false; c.size = size; c.parts = { back, face, icon };
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, duration: 320, delay: i * 45, ease: "back.out" });
      c.on("pointerdown", () => this.flip(c));
      c.on("pointerover", () => { if (!c.done && !c.flipped && this.ready) this.tweens.add({ targets: c, scale: 1.07, duration: 100 }); });
      c.on("pointerout", () => { if (!c.done) this.tweens.add({ targets: c, scale: 1, duration: 100 }); });
      return c;
    });
    if (this.tier > 0 && this.ready) {
      // Step out of the way now, so the level's own line is the one on screen.
      hush();
      this.time.delayedCall(180, () => { DUKit.banner(this, this.cfg().label); say("Level " + (this.tier + 1) + " — " + this.cfg().label + "!", "pip"); });
    }
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
        // A turning card throws a little sparkle, so the flip itself feels alive.
        if (up) { DUKit.burst(this, c.x, c.y, { texture: "kit-spark", tint: 0xfff3a8, n: 7, min: 60, max: 170, scale: 0.75, life: 380, spin: true }); DUKit.sfx("pop"); }
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
      this.totalMoves += 1;
      this.movesText.setText("Moves " + this.moves);
      const a = this.first, b = c;
      this.first = null;
      if (a.id === b.id) this.match(a, b);
      else {
        this.busy = true;
        this.time.delayedCall(620, () => {
          this.wrong(a, b);
          this.flipTween(a, false, () => { a.flipped = false; });
          this.flipTween(b, false, () => {
            b.flipped = false; this.busy = false;
            // Three wobbles in a row and the meadow offers a free look.
            if (this.misses % 3 === 0) this.time.delayedCall(220, () => this.peek());
          });
        });
      }
    });
  }

  // Wrong is a nudge, never a buzz: kind words, a soft wind, nothing taken away.
  wrong(a, b) {
    this.misses += 1;
    this.streak = 0;
    this.tweens.add({ targets: [a, b], angle: { from: -6, to: 6 }, duration: 60, yoyo: true, repeat: 1 });
    DUKit.floatText(this, (a.x + b.x) / 2, (a.y + b.y) / 2, "Look again!", "#dff6ff");
    DUKit.sfx("whoosh");
    this.buddyHop(0xffb1c6);
  }

  // One free peek at a pair still hiding — encouragement, not a score.
  peek() {
    if (!this.ready || this.busy) return;
    const byId = {};
    this.cards.filter(c => !c.done && !c.flipped).forEach(c => { (byId[c.id] = byId[c.id] || []).push(c); });
    const pair = Object.keys(byId).map(k => byId[k]).find(v => v.length === 2);
    if (!pair) return;
    this.busy = true;
    pair.forEach(c => { c.flipped = true; this.flipTween(c, true); });
    DUKit.sfx("sparkle");
    DUKit.floatText(this, W / 2, 150, "Have a peek!", "#ffe14d");
    this.time.delayedCall(800, () => pair.forEach((c, i) => this.flipTween(c, false, () => {
      c.flipped = false;
      if (i === pair.length - 1) this.busy = false;
    })));
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
    this.streak += 1;
    this.pairsText.setText("Pairs " + this.matched + " / " + this.cfg().faces.length);
    DUKit.sfx("good"); DUKit.sfx("sparkle");
    DUKit.floatText(this, (a.x + b.x) / 2, (a.y + b.y) / 2, NAMES[a.id] + "!");
    if (this.streak >= 2) DUKit.floatText(this, (a.x + b.x) / 2, (a.y + b.y) / 2 - 32, this.streak + " in a row! ✨", "#ffe14d");
    if (this.streak === 3) { DUKit.banner(this, "3 in a row!"); DUKit.sfx("drum"); }
    if (this.streak >= 5) { DUKit.banner(this, this.streak + " in a row!"); DUKit.sfx("chirp"); }
    this.tweens.add({ targets: this.starIcon, angle: 360, scale: 1.3, duration: 320, onComplete: () => this.starIcon.setAngle(0).setScale(0.9) });
    this.buddyHop(0xffffff);
    if (this.matched === this.cfg().faces.length) this.clearLevel();
  }

  buddyHop(tint) {
    this.buddy.setTint(tint);
    this.tweens.add({ targets: this.buddy, y: 414, scaleY: 1.14, duration: 180, yoyo: true, ease: "quad.out", onComplete: () => this.buddy.setTint(0xffffff).setScale(1) });
  }

  // Clearing a level opens the next one and books the ledger for the level played.
  clearLevel() {
    const secs = this.clock();
    const adj = this.scaled();
    const stars = rateMoves(adj);
    this.tierStars.push(stars);
    if (!STORE.best || adj < STORE.best) { STORE.best = adj; this.best = adj; }
    if (!STORE.time || secs < STORE.time) STORE.time = secs;
    const next = this.tier + 1;
    if (next < TIERS.length) STORE.tier = Math.max(STORE.tier, next);
    saveStore();
    this.bestText.setText("Best " + STORE.best);
    // Book the match on the campaign map, and let a friend say how it went.
    if (window.DUJourney) DUJourney.record("meadow.arcade", { stars, level: this.tier + 1 });
    if (window.DUWONDER) DUWONDER.mote(stars >= 3 ? 3 : 1);
    this.busy = true;
    this.totalTime += secs;
    DUKit.celebrate(this);
    DUKit.banner(this, "Level " + (this.tier + 1) + " cleared! " + "⭐".repeat(stars));
    say("Every pair found in " + this.moves + " moves! " + (next < TIERS.length ? "On to " + TIERS[next].label + "." : "All three levels!"), "pip");
    this.time.delayedCall(2100, () => {
      this.busy = false;
      if (next < TIERS.length) { this.tier = next; this.deal(); DUKit.sfx("star"); }
      else this.win();
    });
  }

  win() {
    const stars = this.tierStars.length ? this.tierStars[this.tierStars.length - 1] : 1;
    // Let go of the level line before the panel's friend speaks, or its timer
    // would blank the ending a moment after it arrives.
    hush();
    this.bestText.setText("Best " + STORE.best);
    DUKit.floatText(this, W / 2, 152, "3 levels, all done!", "#ffe14d");
    this.time.delayedCall(700, () => {
      DUKit.endPanel(this, {
        title: "WELL DONE!",
        line: "All 3 levels · " + this.totalMoves + " moves · ⏱ " + this.totalTime + "s",
        best: bestLine(), stars, voiceId: "arcade"
      }, () => { skipTitle = true; this.scene.restart(); });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.mountains.tilePositionX += 6 * dt;
    this.clouds.tilePositionX += 3 * dt;
    this.clouds2.tilePositionX += 5 * dt;
    this.trees.tilePositionX += 14 * dt;
    this.grass.tilePositionX += 28 * dt;
    if (this.ready) {
      const s = "⏱ " + this.clock() + "s";
      if (this.timeText.text !== s) this.timeText.setText(s);
    }
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
