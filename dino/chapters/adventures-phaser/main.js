// Dino Adventures — Phaser 3 balloon flight: climb three skies, each with its
// own goal to reach before the next one opens.
const W = 960, H = 540;
const STORE_KEY = "dino-adventures-phaser-v1";
const EMBEDDED = window.self !== window.top;
// Tells the shared kit which story voice belongs to this scene: act.flight.
window.DU_WORLD_ID = "act";
const GAP = 190;
const STAR_STEPS = [5, 12, 25];
const HOME_X = 220;
// Three altitudes, three jobs: rings to thread, cloud tops to touch, then the
// gate that ends the flight. Each band's need is what the HUD counts up to.
const BANDS = [
  { name: "Meadow Sky", emoji: "🌼", need: 3, veil: 0x8fe0ff, say: "Glowing rings ahead — fly through three of them." },
  { name: "Cloud Peaks", emoji: "☁️", need: 3, veil: 0xaec8ff, say: "Big soft clouds! Touch the shiny top of three." },
  { name: "Star Gate", emoji: "🌟", need: 1, veil: 0x3b3f8f, say: "The star gate is out there. Find it and fly through!" },
];
const COMBO_WINDOW = 2.8;
let skipTitle = false;

// Stage callouts are asked for by the name say(); the story engine publishes the
// same thing as whisper(), so try that name first and fall back to the real one.
function callout(text, who) {
  const S = window.DUSTORY;
  if (!S) return;
  const fn = S.say || S.whisper;
  if (!fn) return;
  try { fn.call(S, text, who || "pip"); } catch (e) { /* narration is optional */ }
}

// The end panel used to show a private number nobody else in the universe
// agreed with. This says the same thing the campaign map says.
function bestLine(best) {
  const J = window.DUJourney;
  return "Best " + best + (J ? " · 🗺 " + J.total() + " stars" : "");
}

function loadBest() {
  try { return Math.max(0, Number(JSON.parse(localStorage.getItem(STORE_KEY)).best) || 0); } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ best: v })); } catch (e) { /* ok without storage */ }
}

class FlightScene extends Phaser.Scene {
  constructor() { super("flight"); }

  preload() {
    this.load.image("hangingDino", "../../assets/prehistoric/raptor-hang.webp");
    DUKit.textures(this);
    // Textures belong to the game, not the scene: a "play again" restart baked
    // them a second time and Phaser logged "Texture key already in use".
    if (this.textures.exists("flyer")) return;
    const g = this.make.graphics({ add: false });

    // Dino hanging from a balloon.
    g.fillStyle(0xff6b6b, 1);
    g.fillEllipse(40, 30, 56, 66);
    g.fillStyle(0xffffff, 0.45);
    g.fillEllipse(28, 18, 14, 20);
    g.lineStyle(2, 0x7a5a3a, 1);
    g.lineBetween(40, 62, 36, 90);
    g.lineBetween(40, 62, 56, 90);
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

    // A glowing ring to fly through.
    g.clear();
    g.lineStyle(16, 0xffffff, 0.5); g.strokeCircle(74, 74, 58);
    g.lineStyle(8, 0xffe14d, 1); g.strokeCircle(74, 74, 58);
    g.lineStyle(3, 0xffffff, 0.9); g.strokeCircle(74, 74, 46);
    g.generateTexture("ring", 148, 148);

    // Glowing seed — the combo collector.
    g.clear();
    g.fillStyle(0xffe9a1, 0.35); g.fillCircle(20, 20, 20);
    g.fillStyle(0xbfe86a, 1); g.fillEllipse(20, 21, 20, 26);
    g.fillStyle(0x6fae3f, 1); g.fillTriangle(20, 8, 26, 2, 14, 6);
    g.fillStyle(0xffffff, 0.85); g.fillEllipse(15, 15, 6, 9);
    g.generateTexture("seed", 40, 40);

    // Wind streak, stretched long by the emitter.
    g.clear();
    g.fillStyle(0xffffff, 0.9); g.fillRoundedRect(0, 0, 40, 8, 4);
    g.generateTexture("wisp", 40, 8);

    // Cliff: a rock tooth that grows out of the ground or the ceiling.
    g.clear();
    g.fillStyle(0x8a7b6a, 1); g.fillTriangle(0, 170, 45, 0, 90, 170);
    g.fillStyle(0x6f6152, 1); g.fillTriangle(45, 0, 90, 170, 60, 170);
    g.fillStyle(0xa89a86, 1); g.fillTriangle(20, 96, 44, 26, 62, 98);
    g.generateTexture("cliff", 90, 170);

    // Storm cloud with a lit top edge.
    g.clear();
    g.fillStyle(0x5b6788, 1);
    [[40, 52, 30], [80, 38, 34], [120, 50, 28], [150, 60, 18]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillStyle(0x3f4a66, 1); g.fillRoundedRect(22, 56, 140, 30, 12);
    g.fillStyle(0xcfe2ff, 0.55); g.fillRoundedRect(34, 24, 96, 12, 6);
    g.generateTexture("storm", 176, 96);

    // One bird; a flock is three of them in a V.
    g.clear();
    g.fillStyle(0xf6f9ff, 1); g.fillEllipse(23, 16, 24, 13);
    g.fillTriangle(30, 14, 45, 3, 34, 20); g.fillTriangle(15, 14, 1, 5, 13, 20);
    g.fillStyle(0x2b3a52, 1); g.fillCircle(33, 14, 2);
    g.generateTexture("bird", 46, 26);

    // Warm-air column: pale gold, brighter toward the ground.
    g.clear();
    for (let i = 0; i < 8; i++) { g.fillStyle(0xffd98a, 0.05 + i * 0.018); g.fillRect(0, i * 44, 90, 44); }
    g.lineStyle(3, 0xfff3c4, 0.5); g.lineBetween(2, 350, 2, 4); g.lineBetween(87, 350, 87, 4);
    g.generateTexture("thermal", 90, 352);

    // The star gate: two gold posts and an arch of light.
    g.clear();
    g.fillStyle(0xffd23f, 1); g.fillRoundedRect(0, 0, 24, 300, 12); g.fillRoundedRect(176, 0, 24, 300, 12);
    g.fillStyle(0xfff3b0, 0.9); g.fillRoundedRect(0, 0, 200, 28, 14);
    g.fillStyle(0xffe14d, 0.35); g.fillRect(24, 28, 152, 272);
    g.generateTexture("gate", 200, 300);
    g.destroy();

    /* These two used to be baked from a font glyph here, in code that was a
     * copy of the shared kit's. Asking the kit instead means the specimen
     * photograph turns up as soon as it decodes. */
    DUKit.emoji(this, "egg", "🥚", 36);
    DUKit.emoji(this, "star", "⭐", 36);
    /* The rock teeth are a photographed limestone spire now. It used to be the
     * wide boulder cut-out forced into this tall narrow box, which filled the
     * box by slicing a straight-edged strip out of the middle of a rock. */
    DUKit.prop(this, "cliff", "rock-spire");
    DUKit.specimen(this, "seed", "sprout");
    // A real cumulus, filled to the whole box and darkened: a storm you can
    // see, not a grey lollipop.
    DUKit.specimen(this, "storm", "cloud", { cover: true, darken: 0.42 });
  }

  create() {
    this.score = 0;
    this.best = loadBest();
    this.gameOver = false;
    this.started = false;
    this.ready = false;
    this.speed = 220;
    this.band = 0; this.bandGoal = 0; this.wave = 0; this.haz = 0;
    this.rings = 0; this.peaks = 0; this.seeds = 0; this.gateUp = false;
    this.combo = 1; this.comboT = 0;
    this.stamina = 1; this.gliding = false; this.tired = false; this.holdKey = false;
    this.wind = null; this.inThermal = null;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x69c8ff, 0x69c8ff, 0xfff1d6, 0xfff1d6, 1);
    sky.fillRect(0, 0, W, H);
    DUKit.scenery(DUKit.sunRays(this, 160, 90, 220), this.add.circle(160, 90, 42, 0xffe27a, 0.95));
    DUKit.sparkleField(this, 14, 40, 30, 920, 360, 0xffffff);
    // One tinted rectangle is how the whole sky changes colour between bands.
    this.skyVeil = this.add.rectangle(W / 2, H / 2, W, H, BANDS[0].veil, 0.1).setDepth(6);

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
    const ground = this.add.rectangle(W / 2, H - 10, W, 30, 0x4a9f4c);
    DUKit.scenery(sky, this.farClouds, this.farClouds2, this.hills, ground);

    DUKit.environment(this, 'jungle');
    this.physics.world.gravity.y = 1100;
    /* The envelope is a photograph and the passenger is a photograph, composited
     * into the same 86×126 box the hitbox was already written for. When the
     * balloon file decodes the kit repaints the envelope, so the dino is re-hung
     * on real cables instead of staying clipped to the drawn ones. */
    const hang = (top, tall) => {
      const tex = this.textures.get('photoFlyer'), c = tex.getContext();
      c.clearRect(0, 0, 86, 126);
      c.drawImage(this.textures.get('flyer').getSourceImage(), 0, 0, 86, 126);
      const img = this.textures.get('hangingDino').getSourceImage();
      const scale = Math.min(72 / img.width, tall / img.height);
      c.drawImage(img, 43 - img.width * scale / 2, top, img.width * scale, img.height * scale);
      tex.refresh();
    };
    if (!this.textures.exists('photoFlyer')) this.textures.createCanvas('photoFlyer', 86, 126);
    hang(68, 58);
    DUKit.prop(this, 'flyer', 'balloon').then((photo) => { if (photo) hang(84, 42); });
    this.player = this.physics.add.sprite(220, H / 2, "photoFlyer");
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
    this.hazards = this.physics.add.group();
    this.goals = this.physics.add.group();
    this.thermals = this.physics.add.group();
    this.physics.add.collider(this.player, this.walls, () => this.crash(), null, this);
    this.physics.add.overlap(this.player, this.pickups, (p, it) => this.collect(it), null, this);
    this.physics.add.overlap(this.player, this.hazards, () => this.crash(), null, this);
    this.physics.add.overlap(this.player, this.goals, (p, it) => this.goalHit(it), null, this);
    this.physics.add.overlap(this.player, this.thermals, (p, it) => this.soak(it), null, this);

    this.spawner = this.time.addEvent({ delay: 1700, loop: true, paused: true, callback: () => this.spawnWave() });
    this.gustTimer = this.time.addEvent({ delay: 7000, loop: true, paused: true, callback: () => this.gust() });

    const style = { fontSize: "30px", fontFamily: "system-ui,sans-serif", color: "#fff", stroke: "#17403a", strokeThickness: 6 };
    this.scoreText = this.add.text(66, 14, "0", style).setDepth(60);
    this.bestText = this.add.text(W - 18, 16, "Best " + this.best, { ...style, fontSize: "20px" }).setOrigin(1, 0);
    this.bandText = DUKit.label(this, 66, 52, { ...style, fontSize: "19px" }, null, { depth: 60 });
    this.comboText = DUKit.label(this, 66, 78, { ...style, fontSize: "19px", color: "#eaffce" }, null, { depth: 60 });
    this.meter = this.add.graphics().setDepth(60);
    this.meterLabel = this.add.text(W - 18, 62, "glide", { ...style, fontSize: "16px", color: "#ffe14d" }).setOrigin(1, 0).setDepth(60);
    this.hint = this.add.text(W / 2, H / 2 + 110, "TAP or SPACE to flap · hold to glide", { fontSize: "24px", fontFamily: "system-ui,sans-serif", color: "#fff", stroke: "#17403a", strokeThickness: 5 }).setOrigin(0.5);
    this.tweens.add({ targets: this.player, y: this.player.y - 14, duration: 700, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.sway = this.tweens.add({ targets: this.player, angle: { from: -5, to: 5 }, duration: 900, yoyo: true, repeat: -1, ease: "sine.inOut" });

    // An emoji star, not kit-star: the kit's star slots are what the suites count.
    this.starIcon = this.add.image(36, 36, "star").setScale(0.7).setDepth(60);
    // Space is both a flap and a hold-to-glide, so a key-repeat must not turn
    // into a machine-gun of flaps. The flap comes first: glide() only arms once
    // the run has started, and the very first press is the one that starts it.
    this.input.keyboard.on("keydown-SPACE", () => { if (this.holdKey) return; this.holdKey = true; this.flap(); this.glide(true); });
    this.input.keyboard.on("keyup-SPACE", () => { this.holdKey = false; this.glide(false); });
    this.input.on("pointerdown", () => { this.flap(); this.glide(true); });
    this.input.on("pointerup", () => this.glide(false));
    this.input.on("pointerupoutside", () => this.glide(false));

    this.ui();
    DUKit.ready();
    // "Play again" skips the card once; coming back later should still teach.
    if (skipTitle) { skipTitle = false; this.ready = true; }
    else DUKit.title(this, {
      // The balloon itself is drawn on the canvas, so it was never the problem;
      // this icon was a raw glyph. There is no photograph of a balloon in this
      // valley, so the card shows the cloud tops the child is flying up to.
      title: "Balloon Flight", emoji: "☁️", color: 0x4aa8ff, cssColor: "#3b8fe0", voiceId: "flight",
      hint: "Tap or press Space to flap, hold to glide. Fly through the glowing rings, touch the cloud tops, then find the star gate. Warm air refills your glide!",
    }, () => { this.ready = true; });
  }

  ui() {
    const b = BANDS[this.band];
    this.bandText.setText(b.emoji + " " + b.name + " · " + (this.band === 2
      ? (this.gateUp ? "fly through the gate!" : "finding the gate…")
      : this.bandGoal + "/" + b.need));
    this.comboText.setText(this.combo > 1 ? "🌱 x" + this.combo : "");
    this.scoreText.setText(String(this.score));
  }

  // Glide meter: a warm bar that empties while floating and fills in a thermal.
  drawMeter() {
    const g = this.meter, x = W - 218, y = 42, w = 200, h = 16;
    g.clear();
    g.fillStyle(0x17403a, 0.55); g.fillRoundedRect(x, y, w, h, 8);
    const s = Phaser.Math.Clamp(this.stamina, 0, 1);
    g.fillStyle(this.tired ? 0xff8a5c : 0xffd23f, 1); g.fillRoundedRect(x + 2, y + 2, Math.max(4, (w - 4) * s), h - 4, 6);
    g.lineStyle(2, 0xffffff, 0.7); g.strokeRoundedRect(x, y, w, h, 8);
  }

  glide(on) {
    this.gliding = !!on && this.started && !this.gameOver && this.stamina > 0;
  }

  flap() {
    if (!this.ready || this.gameOver) return;
    if (!this.started) {
      this.started = true;
      this.tweens.killTweensOf(this.player);
      if (this.sway) this.sway.stop();
      this.player.body.setAllowGravity(true);
      this.spawner.paused = false;
      this.gustTimer.paused = false;
      this.hint.destroy();
      this.spawnWave();
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
      this.walls.add(w);
      // Joining a physics group hands the body back to the group's defaults, so the
      // flags that keep a wall floating have to be set afterwards or the wall drops
      // out of the sky and the gap a child was aiming for simply vanishes.
      w.body.setAllowGravity(false).setImmovable(true);
      w.body.setVelocityX(-this.speed);
    };
    mkWall(0, topH, 0);
    mkWall(H - 40, botH, 1);
    const tex = Math.random() < 0.7 ? "egg" : "star";
    const it = this.pickups.create(x, gapY, tex);
    it.body.setAllowGravity(false);
    it.setVelocityX(-this.speed);
    it.value = tex === "star" ? 2 : 1;
    it.kind = tex;
    this.tweens.add({ targets: it, scale: 1.2, duration: 400, yoyo: true, repeat: -1 });
  }

  // The spawner clock decides what each wave is made of, so a band's goal never
  // competes with a hazard for the same tick.
  spawnWave() {
    if (this.gameOver || !this.started) return;
    this.wave++;
    if (this.band < 2) this.spawnBandGoal();
    else if (!this.gateUp && this.wave % 3 === 0) this.spawnStarGate();
    if (this.wave % 3 === 2) this.spawnSeedLine();
    if (this.wave % 4 === 1) this.spawnThermal();
    if (this.wave > 1 && this.wave % 3 === 0) this.spawnHazard();
    if (this.wave % 6 === 5) this.spawnGate();
    this.spawner.delay = Math.max(1150, 1700 - this.score * 6);
  }

  spawnBandGoal() {
    if (this.band === 1) return this.spawnPeak();
    return this.spawnRing();
  }

  spawnRing() {
    const y = Phaser.Math.Between(120, H - 150);
    const r = this.goals.create(W + 70, y, "ring");
    r.body.setAllowGravity(false).setCircle(50, 24, 24);
    r.setVelocityX(-this.speed).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9);
    r.goalKind = "ring";
    this.tweens.add({ targets: r, scaleX: 1.12, scaleY: 1.12, duration: 520, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.tweens.add({ targets: r, angle: { from: -10, to: 10 }, duration: 900, yoyo: true, repeat: -1 });
    return r;
  }

  // A soft cloud mound you can bump into harmlessly; only the shiny tip counts.
  spawnPeak() {
    const x = W + 90, top = Phaser.Math.Between(150, 300), h = H - 40 - top;
    const mound = this.add.tileSprite(x, top, 100, h, "cloudBlock").setOrigin(0.5, 0).setAlpha(0.95).setDepth(3);
    const tip = this.goals.create(x, top - 16, "kit-star");
    tip.body.setAllowGravity(false).setCircle(22, 12, 12);
    tip.setVelocityX(-this.speed).setScale(1.1).setTint(0xfff3b0).setBlendMode(Phaser.BlendModes.ADD);
    tip.goalKind = "peak";
    tip.mound = mound;
    this.tweens.add({ targets: tip, angle: 360, duration: 2600, repeat: -1 });
    return tip;
  }

  spawnStarGate() {
    this.gateUp = true;
    const y = Phaser.Math.Between(180, H - 220);
    const gate = this.goals.create(W + 150, y, "gate");
    gate.body.setAllowGravity(false).setSize(150, 250, false).setOffset(25, 30);
    gate.setVelocityX(-this.speed * 0.9);
    gate.goalKind = "gate";
    DUKit.banner(this, "The star gate!");
    DUKit.sfx("sparkle");
    callout("There it is — the star gate! Fly right through the middle.", "pip");
    return gate;
  }

  // Seeds come in an arc, so a combo is something you steer for, not luck.
  spawnSeedLine() {
    const n = Phaser.Math.Between(3, 5), up = Math.random() < 0.5;
    const baseY = Phaser.Math.Between(150, H - 180);
    for (let i = 0; i < n; i++) {
      const s = this.pickups.create(W + 70 + i * 74, baseY + (up ? -i * 34 : i * 34), "seed");
      s.body.setAllowGravity(false).setCircle(15, 8, 8);
      s.setVelocityX(-this.speed);
      s.kind = "seed"; s.value = 1;
      this.tweens.add({ targets: s, angle: { from: -14, to: 14 }, duration: 480, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: s, alpha: { from: 0.75, to: 1 }, duration: 400, yoyo: true, repeat: -1 });
    }
    return n;
  }

  spawnThermal() {
    const t = this.thermals.create(W + 120, H - 40 - 176, "thermal");
    t.body.setAllowGravity(false).setSize(84, 340, false).setOffset(3, 6);
    t.setVelocityX(-this.speed * 0.85).setAlpha(0.9);
    t.fx = this.add.particles(t.x, H - 60, "dot", {
      speed: { min: 60, max: 130 }, angle: { min: 340, max: 20 }, lifespan: 1100, scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 }, tint: 0xffd98a, frequency: 90, quantity: 1
    }).setDepth(3);
    return t;
  }

  // Three hazards, three behaviours: a flock that comes fast in a V, a cliff
  // that grows in, a storm that bobs, flashes and leans on the balloon.
  spawnHazard() {
    this.haz = (this.haz + 1) % 3;
    if (this.haz === 0) return this.spawnFlock();
    if (this.haz === 1) return this.spawnCliff();
    return this.spawnStorm();
  }

  spawnFlock() {
    const y = Phaser.Math.Between(130, H - 190), out = [];
    for (let i = 0; i < 3; i++) {
      const b = this.hazards.create(W + 80 + i * 62, y + (i === 0 ? 0 : i === 1 ? 46 : -46), "bird");
      b.body.setAllowGravity(false).setSize(34, 20, false).setOffset(6, 4);
      b.setVelocityX(-(this.speed * 1.5 + 60));
      b.hazKind = "flock"; b.phase = i * 1.4; b.baseY = b.y;
      out.push(b);
    }
    callout("Birds! Come about — wiggle between them.", "pip");
    return out;
  }

  spawnCliff() {
    const fromTop = Math.random() < 0.45, h = Phaser.Math.Between(150, 260);
    const c = this.add.image(W + 90, fromTop ? h / 2 : H - 40 - h / 2, "cliff");
    if (fromTop) c.setAngle(180);
    c.setDisplaySize(90, h);
    this.physics.add.existing(c);
    this.walls.add(c);
    // Same ordering rule as the cloud walls: the group reset the body when the
    // image joined it, which left the cliff falling out of the sky at 1000px/s.
    c.body.setAllowGravity(false).setImmovable(true);
    c.body.setVelocityX(-this.speed);
    c.hazKind = "cliff";
    // Grows in, so a child sees the rock arrive instead of appear full size.
    // The hitbox waits for the shape to finish, so it never bites early.
    const fullY = c.scaleY;
    c.setScale(c.scaleX, 0.05);
    // The spire photograph is narrower than the 90px box it lands in, so the
    // hitbox follows the rock the child can see instead of the box.
    c.body.setSize(48, 26, false);
    this.tweens.add({ targets: c, scaleY: fullY, duration: 700, ease: "quad.out", onComplete: () => { if (c.active) c.body.setSize(58, h, false); } });
    return c;
  }

  spawnStorm() {
    const s = this.hazards.create(W + 120, Phaser.Math.Between(150, 300), "storm");
    s.body.setAllowGravity(false).setSize(150, 70, false).setOffset(14, 16);
    s.setVelocityX(-this.speed * 0.8);
    s.hazKind = "storm"; s.baseY = s.y; s.swung = Phaser.Math.FloatBetween(1.6, 2.6);
    s.fx = this.add.particles(s.x, s.y + 40, "dot", {
      speed: { min: 90, max: 170 }, angle: { min: 80, max: 100 }, lifespan: 700, scale: { start: 0.28, end: 0 },
      alpha: { start: 0.7, end: 0 }, tint: 0xbcd0ff, frequency: 70, quantity: 1
    }).setDepth(4);
    s.bolt = this.time.addEvent({ delay: 1500, loop: true, callback: () => { if (s.active && !this.gameOver) this.flash(s); } });
    return s;
  }

  // Lightning flicker: the cloud lights itself and the screen blinks once.
  flash(s) {
    this.cameras.main.flash(110, 120, 130, 160);
    DUKit.sfx("drum");
    s.setTint(0xdfe8ff);
    this.time.delayedCall(140, () => { if (s.active) s.clearTint(); });
    DUKit.burst(this, s.x, s.y + 44, { texture: "kit-spark", tint: 0xfff3b0, n: 6, life: 320, min: 40, max: 120 });
  }

  // Wind arrives in two beats: streaks first, then the shove, so a child has a
  // moment to brace instead of being pushed into a cloud by surprise.
  gust() {
    if (this.gameOver || !this.started || this.wind) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const streaks = this.add.particles(dir > 0 ? -60 : W + 60, 0, "wisp", {
      y: { min: 50, max: H - 120 }, speedX: { min: dir * 520, max: dir * 760 }, lifespan: 780,
      alpha: { start: 0.55, end: 0 }, scaleX: { start: 2.6, end: 1.4 }, scaleY: 0.5, tint: 0xffffff,
      frequency: 40, quantity: 2
    }).setDepth(5);
    DUKit.sfx("whoosh");
    const label = DUKit.label(this, this.player.x, 96, { fontSize: "34px" }, null, { originX: 0.5, originY: 0.5, depth: 70 })
      .setText(dir > 0 ? "💨 →" : "← 💨").setAlpha(0.9);
    this.wind = { dir, warn: 0.9, push: 0, fx: streaks, label };
    this.time.delayedCall(900, () => {
      if (!this.wind || this.gameOver) return;
      this.wind.push = 1.15;
      DUKit.banner(this, dir > 0 ? "Tail wind!" : "Head wind!");
    });
  }

  // Warm air: the only way to refill the glide meter, so it is worth reaching.
  soak(t) {
    if (this.gameOver || !t.active) return;
    // An overlap can run before the first update, so always have a step to spend.
    const dt = this.dt || 0.016;
    if (this.inThermal !== t) {
      this.inThermal = t;
      DUKit.sfx("sparkle");
      DUKit.floatText(this, t.x, t.y - 120, "Warm air!", "#ffe14d");
    }
    this.stamina = Math.min(1, this.stamina + 0.55 * dt);
    if (this.stamina > 0.35) this.tired = false;
    // Stronger than gravity, or "warm air" would only slow the fall, which reads
    // as nothing at all to a child.
    this.player.body.setVelocityY(Math.max(this.player.body.velocity.y - 1500 * dt, -180));
  }

  goalHit(g) {
    if (this.gameOver || !g.active) return;
    if (g.goalKind === "gate") { g.destroy(); this.win(); return; }
    if (g.goalKind === "ring") {
      this.rings++;
      this.score += 2;
      DUKit.sfx("chirp");
      DUKit.burst(this, g.x, g.y, { texture: "kit-spark", tint: 0xffe14d, n: 16, scale: 1.1, life: 620 });
      DUKit.floatText(this, g.x, g.y - 60, "RING! +2", "#ffe14d");
    } else {
      this.peaks++;
      this.score += 3;
      DUKit.sfx("star");
      DUKit.burst(this, g.x, g.y, { texture: "kit-spark", tint: 0xffffff, n: 18, scale: 1.2, life: 700 });
      DUKit.floatText(this, g.x, g.y - 50, "Cloud top! +3", "#ffffff");
      if (g.mound) { g.mound.destroy(); g.mound = null; }
    }
    const cleared = ++this.bandGoal;
    this.popStar();
    g.destroy();
    this.ui();
    if (cleared >= BANDS[this.band].need) this.ascend();
  }

  ascend() {
    if (this.band >= 2) return;
    this.band++;
    this.bandGoal = 0;
    const b = BANDS[this.band];
    this.skyVeil.setFillStyle(b.veil, 0.42);
    this.tweens.add({ targets: this.skyVeil, fillAlpha: 0.12, duration: 900 });
    this.tweens.add({ targets: [this.farClouds, this.farClouds2], alpha: this.band === 2 ? 0.3 : 0.7, duration: 800 });
    DUKit.banner(this, "HIGHER!");
    DUKit.sfx("win");
    DUKit.celebrate(this);
    DUKit.shake(this, 120, 0.004);
    callout(b.say, "pip");
    this.ui();
    if (this.band === 2) this.time.delayedCall(1400, () => { if (!this.gameOver && !this.gateUp) this.spawnStarGate(); });
  }

  popStar() {
    this.tweens.add({ targets: this.starIcon, angle: 360, scale: 1.0, duration: 320, onComplete: () => this.starIcon.setAngle(0).setScale(0.7) });
    this.tweens.add({ targets: this.scoreText, scale: 1.3, duration: 120, yoyo: true });
  }

  collect(it) {
    if (!it.active) return;
    let value = it.value;
    if (it.kind === "seed") {
      // Seeds pay what the combo is worth right now, and push it one higher.
      value = this.combo;
      this.seeds++;
      this.combo = Math.min(9, this.combo + 1);
      this.comboT = COMBO_WINDOW;
      this.tweens.add({ targets: this.comboText, scale: 1.35, duration: 140, yoyo: true });
      DUKit.floatText(this, it.x, it.y - 34, "x" + value + " seed!", "#eaffce");
      DUKit.sfx("pop");
    } else {
      DUKit.sfx(value > 1 ? "star" : "chirp");
      DUKit.floatText(this, it.x, it.y - 20, "+" + value);
    }
    this.score += value;
    this.scoreText.setText(String(this.score));
    this.popStar();
    if (this.score % 10 < value && this.score >= 10) { DUKit.banner(this, "Wow! " + this.score); DUKit.sfx("sparkle"); }
    const e = this.add.particles(it.x, it.y, "dot", {
      speed: { min: 80, max: 240 }, lifespan: 450, scale: { start: 0.8, end: 0 },
      tint: it.kind === "seed" ? 0xbfe86a : 0xffd23f, quantity: 14, emitting: false
    });
    e.explode(14);
    this.time.delayedCall(500, () => e.destroy());
    it.destroy();
    this.speed = Math.min(400, 220 + this.score * 6);
    this.ui();
  }

  crash() {
    if (this.gameOver) return;
    this.player.setTint(0xff6666);
    this.cameras.main.shake(260, 0.014);
    DUKit.sfx("thud"); DUKit.sfx("bad");
    DUKit.burst(this, this.player.x, this.player.y, { tint: 0xffffff, n: 22, gravity: 500, life: 700 });
    this.finish(false);
  }

  win() {
    if (this.gameOver) return;
    this.score += 10;
    this.player.setTint(0xfff3b0);
    DUKit.sfx("roar");
    DUKit.celebrate(this);
    this.ui();
    this.finish(true);
  }

  // One ending for both ways down: the panel reads the flight back as rings,
  // cloud tops and seeds, which is what the child actually did up there.
  finish(win) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.gliding = false;
    this.physics.pause();
    this.spawner.paused = true;
    this.gustTimer.paused = true;
    this.trail.emitting = false;
    const stars = DUKit.rating(this.score, STAR_STEPS);
    const isBest = this.score > this.best;
    this.best = Math.max(this.best, this.score);
    saveBest(this.best);
    // A flight that earned stars has to reach the ledger, or the map never
    // learns the child ever left the ground.
    if (window.DUJourney) DUJourney.record("act.flight", { stars });
    const line = this.rings + " rings · " + this.peaks + " tops · " + this.seeds + " seeds"
      + (isBest && this.score > 0 ? "  ·  New best!" : "");
    this.time.delayedCall(600, () => {
      DUKit.endPanel(this, {
        title: win ? "STAR GATE!" : "OOPS!", line, best: bestLine(this.best), stars,
        again: "TAP TO FLY AGAIN", voiceId: "flight",
      }, () => { skipTitle = true; this.scene.restart(); });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.dt = dt;
    this.hills.tilePositionX += this.speed * 0.2 * dt;
    this.farClouds.tilePositionX += 14 * dt;
    this.farClouds2.tilePositionX += 7 * dt;
    this.drawMeter();
    if (this.gameOver || !this.started) return;

    if (this.player.y < -20 || this.player.y > H - 30) { this.crash(); return; }
    if (this.player.body.velocity.y > 200) this.player.setAngle(Math.min(25, this.player.angle + 1.2));

    // Glide: hold to float. The meter is the price, so warm air is the reward.
    if (this.gliding && this.stamina > 0 && this.player.body.velocity.y > 130) {
      this.player.body.setVelocityY(130);
      this.stamina = Math.max(0, this.stamina - 0.3 * dt);
      if (this.stamina === 0) { this.gliding = false; this.tired = true; DUKit.sfx("scrape"); DUKit.banner(this, "Tired! Find warm air"); }
    } else if (!this.gliding) {
      this.stamina = Math.min(1, this.stamina + 0.06 * dt);
      if (this.tired && this.stamina > 0.35) this.tired = false;
    }

    // Wind: a shove, then a spring back to the home spot on screen.
    let push = 0;
    if (this.wind) {
      this.wind.warn = Math.max(0, this.wind.warn - dt);
      if (this.wind.push > 0) {
        this.wind.push -= dt;
        push = this.wind.dir * 980;
        this.player.body.setVelocityY(this.player.body.velocity.y + this.wind.dir * 40 * dt);
        if (this.wind.push <= 0) { this.wind.fx.destroy(); this.wind.label.destroy(); this.wind = null; }
      }
    }
    const vx = this.player.body.velocity.x + ((HOME_X - this.player.x) * 5 + push) * dt;
    this.player.body.setVelocityX(Phaser.Math.Clamp(vx, -420, 420));
    this.player.x = Phaser.Math.Clamp(this.player.x, 90, 520);

    // The combo window shrinks one step at a time, so the loss is visible.
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) {
        if (this.combo > 1) { this.combo--; this.comboT = 0.9; DUKit.sfx("tap"); } else this.comboT = 0;
        this.ui();
      }
    }

    this.walls.getChildren().slice().forEach(w => { w.body.setVelocityX(-this.speed); if (w.x < -80) w.destroy(); });
    this.pickups.getChildren().slice().forEach(p => { if (p.x < -60) p.destroy(); });
    this.goals.getChildren().slice().forEach((g) => {
      g.setVelocityX(-this.speed * (g.goalKind === "gate" ? 0.9 : 1));
      if (g.x < -110) { if (g.mound) g.mound.destroy(); if (g.goalKind === "gate") this.gateUp = false; g.destroy(); }
    });
    this.hazards.getChildren().slice().forEach((b) => {
      if (b.hazKind === "flock") b.y = b.baseY + Math.sin(time / 220 + b.phase) * 34;
      else if (b.hazKind === "storm") {
        b.y = b.baseY + Math.sin(time / (620 / b.swung)) * 92;
        if (b.fx) b.fx.setPosition(b.x, b.y + 40);
        // A storm leans on the balloon, which is why you give it a wide berth.
        const d = this.player.x - b.x;
        if (Math.abs(d) < 260 && Math.abs(this.player.y - b.y) < 220) {
          this.player.body.setVelocityY(this.player.body.velocity.y + (d < 0 ? 40 : -30) * dt);
        }
      }
      if (b.x < -120) { if (b.fx) b.fx.destroy(); if (b.bolt) b.bolt.remove(); b.destroy(); }
    });
    this.thermals.getChildren().slice().forEach((t) => {
      if (this.inThermal === t && !t.active) this.inThermal = null;
      if (t.fx) t.fx.setPosition(t.x, H - 60);
      if (t.x < -110) { if (t.fx) t.fx.destroy(); t.destroy(); }
    });
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
