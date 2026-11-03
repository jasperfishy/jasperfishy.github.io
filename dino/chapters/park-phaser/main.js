/* Dinosaur Universe — Dino Park Phaser edition (Stage 2).
 * Phaser shell + animated menu + playable games.
 * Reuses the classic dino art (window.DUFX.dinoSVG) and the shared DUKit polish.
 * Add more games to GAME_LIST, GAME_MAP and the scene list as stages land. */
(function () {
  "use strict";
  const W = 960, H = 540;
  const STORE_KEY = "dino-park-phaser-v2";
  const EMBEDDED = window.self !== window.top;
  const FX = () => window.DUFX;
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];

  /* ---------------------------------------------------------------- state */
  let progress = {};
  try { progress = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { progress = {}; }
  if (!progress.stars) progress.stars = {};
  const saveProgress = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {} };

  /* ---------------------------------------------------------------- art */
  const SPECIES = ["trex", "tricera", "stego", "bronto", "raptor", "ptero"];
  const COLORS = ["#e08a2e", "#2e9fd6", "#8a5ad6", "#d65a7a", "#4aa84a", "#d6a12e"];

  // Load the classic dino SVG as an image texture.
  function dinoTexture(scene, key, species, color, cb) {
    if (scene.textures.exists(key)) { cb(); return; }
    const img = new Image();
    img.onload = () => { scene.textures.addImage(key, img); cb(); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(FX().dinoSVG(species, { color }));
  }

  // Cut the dino into n x n tile textures so each tile shows exactly its piece.
  function cutTiles(scene, dinoKey, n, prefix) {
    const src = scene.textures.get(dinoKey).getSourceImage();
    const sw = src.width, sh = src.height;
    const tw = Math.ceil(sw / n), th = Math.ceil(sh / n);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const key = prefix + "_" + r + "_" + c;
        if (scene.textures.exists(key)) continue;
        const cv = document.createElement("canvas");
        cv.width = tw; cv.height = th;
        const ctx = cv.getContext("2d");
        ctx.drawImage(src, c * tw, r * th, tw, th, 0, 0, tw, th);
        scene.textures.addImage(key, cv);
      }
    }
  }

  // A friendly sky backdrop shared by every scene.
  function sky(scene, top, bottom) {
    const g = scene.add.graphics();
    g.fillGradientStyle(top, top, bottom, bottom, 1);
    g.fillRect(0, 0, W, H);
    DUKit.sunRays(scene, 838, 84, 200);
    scene.add.circle(838, 84, 40, 0xffe27a, 1);
    DUKit.sparkleField(scene, 8, 30, 30, 930, 200, 0xffffff);
  }

  /* ---------------------------------------------------------------- menu */
  const GAME_LIST = [
    { id: "puzzle", title: "Dino Puzzle", emoji: "🧩", color: 0xe08a2e, desc: "Tap two tiles to swap. Rebuild the dinosaur!" },
    { id: "dig", title: "Dig a Dino", emoji: "⛏", color: 0xc98b4f, desc: "Dig the mounds and find every bone!" },
    { id: "footprint", title: "Footprint Match", emoji: "🐾", color: 0xd9694f, desc: "Whose prints? Drag each dino to its footprints!" },
    { id: "mixer", title: "Dino Mixer", emoji: "🧬", color: 0x2fa58a, desc: "Mix heads and bodies to invent a brand-new dinosaur!" },
    { id: "memory", title: "Dino Memory", emoji: "🃏", color: 0xe05a7a, desc: "Remember where each dinosaur hides - find the pairs!" },
    { id: "size", title: "Size Parade", emoji: "📏", color: 0x3d9bd6, desc: "Line up the dinosaurs smallest to biggest, then parade!" },
    { id: "counting", title: "Snack Time", emoji: "🍓", color: 0xe0762e, desc: "Feed the dino the right number of berries!" },
    { id: "dot", title: "Dot-to-Dot", emoji: "🔢", color: 0x4d96ff, desc: "Join the dots in order and reveal a dinosaur!" },
    { id: "color",  emoji: "🎨", title: "Colouring", desc: "Paint the dino, part by part", color: 0xe0508f },
  ];

  class MenuScene extends Phaser.Scene {
    constructor() { super("menu"); }
    create() {
      DUKit.textures(this);
      sky(this, 0xbfe8ff, 0xfff3d9);
      this.add.text(W / 2, 36, "🦖 Dino Park", { fontSize: "46px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#1c4a3a", stroke: "#ffffff", strokeThickness: 8 }).setOrigin(0.5);
      this.add.text(W / 2, 78, "Pick a game to play", { fontSize: "18px", fontFamily: DUKit.FONT, color: "#3d6b5a" }).setOrigin(0.5);

      const cols = 2, rows = Math.ceil(GAME_LIST.length / cols);
      const tw = 400, th = 128, gx = 26, gy = 22;
      const gridW = cols * tw + (cols - 1) * gx;
      const x0 = (W - gridW) / 2, y0 = 116;
      this.add.rectangle(W / 2, (y0 + rows * (th + gy)) / 2 - 6, gridW + 40, rows * (th + gy) + 30, 0xffffff, 0.45).setStrokeStyle(3, 0x9ec7a0, 0.7).setDepth(2);

      GAME_LIST.forEach((g, i) => {
        const cx = x0 + (i % cols) * (tw + gx) + tw / 2;
        const cy = y0 + Math.floor(i / cols) * (th + gy) + th / 2;
        const card = this.add.container(cx, cy);
        const bg = this.add.rectangle(0, 0, tw, th, 0xffffff, 0.96).setStrokeStyle(5, g.color, 1);
        const icon = this.add.text(-tw / 2 + 54, 0, g.emoji, { fontSize: "64px" }).setOrigin(0.5);
        const title = this.add.text(-tw / 2 + 104, -26, g.title, { fontSize: "26px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#24407a" }).setOrigin(0, 0.5);
        const desc = this.add.text(-tw / 2 + 104, 12, g.desc, { fontSize: "13px", fontFamily: DUKit.FONT, color: "#5b6b80", wordWrap: { width: 220 } }).setOrigin(0, 0);
        const st = progress.stars[g.id];
        const starTxt = this.add.text(tw / 2 - 16, -40, st ? "🌟".repeat(st) : "", { fontSize: "20px" }).setOrigin(1, 0);
        card.add([bg, icon, title, desc, starTxt]);
        card.setDepth(5);
        card.setInteractive(new Phaser.Geom.Rectangle(-tw / 2, -th / 2, tw, th), false, false, { useHandCursor: true });
        card.on("pointerover", () => { card.setScale(1.04); bg.setAlpha(1); });
        card.on("pointerout", () => card.setScale(1));
        card.on("pointerdown", () => { DUKit.sfx("tap"); this.scene.start(GAME_MAP[g.id], { game: g.id }); });
      });

      if (EMBEDDED) DUKit.ready();
    }
  }

  /* ---------------------------------------------------------------- puzzle */
  class PuzzleScene extends Phaser.Scene {
    constructor() { super("puzzle"); }

    create(data) {
      DUKit.textures(this);
      this.species = pick(SPECIES);
      this.color = pick(COLORS);
      this.n = 3;
      this.moves = 0;
      this.selected = null;
      this.state = "title"; // title | play | won
      this.tiles = {};

      sky(this, 0xbfe8ff, 0xfff3d9);
      this.add.text(40, 22, "🧩 Dino Puzzle", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#1c4a3a" }).setOrigin(0, 0);
      this.hud = this.add.text(920, 22, "Moves: 0", { fontSize: "18px", fontFamily: DUKit.FONT, color: "#3d6b5a" }).setOrigin(1, 0);

      this.dinoKey = "puzzle_" + this.species + "_" + this.color.replace("#", "");
      this.prefix = "tile_" + this.species + "_" + this.color.replace("#", "");
      dinoTexture(this, this.dinoKey, this.species, this.color, () => {
        cutTiles(this, this.dinoKey, this.n, this.prefix);
        this.buildBoard();
        this.startTitle();
      });
    }

    buildBoard() {
      const n = this.n;
      const src = this.textures.get(this.dinoKey).getSourceImage();
      const side = 360;
      const tile = side / n;
      const gap = 6;
      const gridW = n * tile + (n - 1) * gap;
      this.x0 = (W - gridW) / 2;
      this.y0 = 100;
      this.tile = tile;
      this.gap = gap;

      const idx = [];
      for (let i = 0; i < n * n; i++) idx.push(i);
      do {
        for (let i = idx.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
      } while (idx.every((v, i) => v === i)); // ensure not already solved

      this.board = this.add.container(0, 0);
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const pos = r * n + c;
          const src = idx[pos];
          const x = this.x0 + c * (this.tile + this.gap) + this.tile / 2;
          const y = this.y0 + r * (this.tile + this.gap) + this.tile / 2;
          const frame = this.add.rectangle(0, 0, this.tile, this.tile, 0xffffff, 0.97).setStrokeStyle(4, 0xc8a06a, 1);
          const img = this.add.image(0, 0, this.prefix + "_" + Math.floor(src / n) + "_" + (src % n)).setScale(this.tile / (360 / n));
          const card = this.add.container(x, y, [frame, img]);
          card.setInteractive(new Phaser.Geom.Rectangle(-tw / 2, -th / 2, tw, th), false, false, { useHandCursor: true });
          card.on("pointerdown", () => this.select(card, pos));
          card.on("pointerover", () => frame.setStrokeStyle(6, 0xe08a2e, 1));
          card.on("pointerout", () => frame.setStrokeStyle(4, 0xc8a06a, 1));
          this.tiles[pos] = card;
          this.board.add(card);
        }
      }
      this.board.setDepth(1);
    }

    startTitle() {
      this.state = "title";
      this.board.setAlpha(0);
      DUKit.title(this, {
        emoji: "🧩",
        title: "Dino Puzzle",
        hint: "Tap two tiles to swap them. Rebuild the dinosaur in the fewest moves!",
        color: 0xe08a2e,
        cssColor: "#e08a2e",
      }, () => {
        this.state = "play";
        this.tweens.add({ targets: this.board, alpha: 1, duration: 300 });
        DUKit.banner(this, "Good luck!");
      });
    }

    select(card, pos) {
      if (this.state !== "play") return;
      if (!this.selected) {
        this.selected = { card, pos };
        card.setScale(1.07);
        DUKit.sfx("tap");
        return;
      }
      const other = this.selected;
      other.card.setScale(1);
      if (other.pos === pos) { this.selected = null; return; }
      const ax = other.card.x, ay = other.card.y;
      other.card.setPosition(card.x, card.y);
      card.setPosition(ax, ay);
      this.selected = null;
      this.moves++;
      this.hud.setText("Moves: " + this.moves);
      DUKit.sfx("pop");
      DUKit.burst(this, (ax + card.x) / 2, (ay + card.y) / 2, { tint: 0xffe14d, n: 8, scale: 0.7 });
      this.checkWin();
    }

    checkWin() {
      const n = this.n;
      for (let pos in this.tiles) {
        const r = Math.floor(pos / n), c = pos % n;
        const ex = this.x0 + c * (this.tile + this.gap) + this.tile / 2;
        const ey = this.y0 + r * (this.tile + this.gap) + this.tile / 2;
        if (Math.abs(this.tiles[pos].x - ex) > 1 || Math.abs(this.tiles[pos].y - ey) > 1) return;
      }
      this.win();
    }

    win() {
      this.state = "won";
      DUKit.sfx("win");
      for (let i = 0; i < 3; i++) DUKit.burst(this, Phaser.Math.Between(W * 0.25, W * 0.75), H * 0.3, { tint: [0xff6b6b, 0xffd93d, 0x6bcb77][i], n: 24, gravity: 400, life: 1100, depth: 120 });
      const stars = this.moves <= 6 ? 3 : this.moves <= 12 ? 2 : 1;
      progress.stars["puzzle"] = Math.max(progress.stars["puzzle"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        title: "PUZZLE SOLVED!",
        line: this.moves + " moves",
        best: "Best: " + (progress.stars["puzzle"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO PLAY AGAIN",
      }, () => { this.scene.restart(); });
    }
  }

  /* ---------------------------------------------------------------- dig */
  class DigScene extends Phaser.Scene {
    constructor() { super("dig"); }

    create(data) {
      DUKit.textures(this);
      this.BONES = 5;
      this.found = 0;
      this.misses = 0;
      this.state = "title"; // title | play | won

      sky(this, 0xf7d9a0, 0xf2c793); // desert dig site
      this.add.text(40, 22, "⛏ Dig a Dino", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#5a3a12" }).setOrigin(0, 0);
      this.hud = this.add.text(920, 22, "Bones: 0/" + this.BONES, { fontSize: "18px", fontFamily: DUKit.FONT, color: "#6b4a1a" }).setOrigin(1, 0);
      this.status = this.add.text(W / 2, H - 26, "", { fontSize: "18px", fontFamily: DUKit.FONT, color: "#5a3a12", fontStyle: "bold" }).setOrigin(0.5);

      // Bone slots across the top — light up as bones are found.
      this.slots = [];
      const slotW = 66, totalW = this.BONES * slotW - 10;
      const sx0 = (W - totalW) / 2;
      for (let i = 0; i < this.BONES; i++) {
        const s = this.add.text(sx0 + i * slotW + 28, 104, "🦴", { fontSize: "30px" }).setOrigin(0.5).setAlpha(0.25);
        this.slots.push(s);
      }

      // A faded fossil dino behind the dig field that fills in as bones are found.
      this.species = pick(SPECIES);
      this.color = pick(COLORS);
      this.ghostKey = "dig_" + this.species + "_" + this.color.replace("#", "");

      this.buildMounds();
      dinoTexture(this, this.ghostKey, this.species, this.color, () => {
        const gw = this.textures.get(this.ghostKey).getSourceImage().width;
        this.ghost = this.add.image(W / 2, 356, this.ghostKey).setScale(300 / gw).setAlpha(0.06).setDepth(0);
        this.startTitle();
      });
    }

    buildMounds() {
      // 20 cells: BONES bones + a mix of worms, beetles, rocks and dirt.
      const items = [];
      for (let i = 0; i < this.BONES; i++) items.push("bone");
      const others = ["worm", "beetle", "rock", "worm", "rock"];
      let oi = 0;
      while (items.length < 20) {
        if (oi < others.length) { items.push(others[oi++]); }
        else items.push("dirt");
      }
      for (let i = items.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = items[i]; items[i] = items[j]; items[j] = t; }
      this.items = items;

      const cols = 5, rows = 4, mw = 150, mh = 72, gx = 18, gy = 16;
      const gridW = cols * mw + (cols - 1) * gx;
      const x0 = (W - gridW) / 2, y0 = 190;
      this.mounds = [];

      for (let i = 0; i < 20; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        const x = x0 + c * (mw + gx) + mw / 2;
        const y = y0 + r * (mh + gy) + mh / 2;
        const mound = this.add.container(x, y);
        const body = this.add.ellipse(0, 6, mw * 0.92, mh * 0.92, 0xb5804a, 1);
        const top = this.add.ellipse(0, -10, mw * 0.66, mh * 0.5, 0xca9459, 1);
        const crack = this.add.graphics();
        crack.lineStyle(3, 0x6b4a26, 1);
        crack.beginPath(); crack.moveTo(-16, -8); crack.lineTo(-3, 0); crack.lineTo(-14, 9); crack.strokePath();
        crack.beginPath(); crack.moveTo(14, -10); crack.lineTo(2, -1); crack.lineTo(13, 8); crack.strokePath();
        crack.setVisible(false);
        const prize = this.add.text(0, 2, "", { fontSize: "38px" }).setOrigin(0.5).setVisible(false);
        mound.add([body, top, crack, prize]);
        mound.setDepth(2);
        mound.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-mw / 2, -mh / 2, mw, mh) });
        mound.on("pointerover", () => { if (mound.getData("open") === true) return; body.setStrokeStyle(5, 0x8a5d2e, 1); });
        mound.on("pointerout", () => body.clearStrokeStyle());
        mound.on("pointerdown", () => this.dig(mound, i));
        this.mounds.push({ mound, body, crack, prize, hits: 0, open: false, kind: this.items[i] });
      }
    }

    say(msg) {
      this.status.setText(msg);
      this.status.setAlpha(1);
      this.tweens.add({ targets: this.status, alpha: 0.15, delay: 1400, duration: 400 });
    }

    dig(m, i) {
      if (this.state !== "play" || this.mounds[i].open) return;
      const mdata = this.mounds[i];
      DUKit.sfx("tap");
      DUKit.shake(this, 140, 1.6);
      DUKit.burst(this, m.x, m.y, { tint: 0xc9a06a, n: 6, scale: 0.5 });
      mdata.hits++;
      if (mdata.hits < 2) {
        mdata.crack.setVisible(true);
        this.say("Keep digging…");
        return;
      }
      mdata.open = true;
      mdata.mound.setData("open", true);

      if (mdata.kind === "bone") {
        mdata.prize.setText("🦴").setVisible(true);
        DUKit.sfx("star");
        DUKit.burst(this, m.x, m.y, { tint: 0xffe14d, n: 14 });
        this.found++;
        this.hud.setText("Bones: " + this.found + "/" + this.BONES);
        this.slots[this.found - 1].setAlpha(1);
        this.tweens.add({ targets: this.slots[this.found - 1], scale: 1.5, duration: 120, yoyo: true });
        this.ghost.setAlpha(0.06 + (this.found / this.BONES) * 0.9);
        if (this.found < this.BONES) this.say("A bone! " + (this.BONES - this.found) + " more to go!");
        else {
          this.say("That's every bone!");
          DUKit.sfx("roar");
          this.tweens.add({ targets: this.ghost, scale: this.ghost.scale * 1.06, duration: 240, yoyo: true });
          this.win();
        }
      } else if (mdata.kind === "worm") {
        mdata.prize.setText("🪱").setVisible(true); this.misses++;
        DUKit.sfx("boing"); this.say("A wiggly worm! He says hello.");
      } else if (mdata.kind === "beetle") {
        mdata.prize.setText("🪲").setVisible(true); this.misses++;
        DUKit.sfx("chirp"); this.say("A beetle zooms away!");
      } else if (mdata.kind === "rock") {
        mdata.prize.setText("🪨").setVisible(true); this.misses++;
        DUKit.sfx("tap"); this.say("Just a rock. Keep looking!");
      } else {
        mdata.prize.setText("🕳").setVisible(true); this.misses++;
        this.say("Only dirt. Try another mound!");
      }
    }

    win() {
      this.state = "won";
      DUKit.sfx("win");
      for (let i = 0; i < 3; i++) DUKit.burst(this, Phaser.Math.Between(W * 0.25, W * 0.75), H * 0.3, { tint: [0xff6b6b, 0xffd93d, 0x6bcb77][i], n: 24, gravity: 400, life: 1100, depth: 120 });
      const stars = this.misses <= 2 ? 3 : this.misses <= 6 ? 2 : 1;
      progress.stars["dig"] = Math.max(progress.stars["dig"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        emoji: "🦴",
        title: "FOSSIL FOUND!",
        line: "All bones in " + (this.found + this.misses) + " digs",
        best: "Best: " + (progress.stars["dig"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO DIG AGAIN",
      }, () => { this.scene.restart(); });
    }

    startTitle() {
      this.state = "title";
      DUKit.title(this, {
        emoji: "⛏",
        title: "Dig a Dino",
        hint: "Tap a dirt mound twice to dig it open. Find all " + this.BONES + " bones and bring the dinosaur back to life!",
        color: 0xc98b4f,
        cssColor: "#c98b4f",
      }, () => {
        this.state = "play";
        this.say("Tap a mound twice to dig! Find " + this.BONES + " bones.");
        DUKit.sfx("tap");
      });
    }
  }


  /* ------------------------------------------------------ footprint match */
  class FootScene extends Phaser.Scene {
    constructor() { super("footprint"); }

    create(data) {
      DUKit.textures(this);
      this.species = ["trex", "tricera", "stego", "bronto", "raptor", "ptero"];
      this.colors = ["green", "teal", "purple", "orange", "pink", "blue"];
      this.count = Phaser.Math.Between(3, 5);
      this.done = 0;
      this.state = "title";

      sky(this, 0xbfe8ff, 0xfff3d9);
      this.add.text(40, 22, "🐾 Footprint Match", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#1c4a3a" }).setOrigin(0, 0);
      this.hud = this.add.text(920, 22, "Matched: 0/" + this.count, { fontSize: "18px", fontFamily: DUKit.FONT, color: "#3d6b5a" }).setOrigin(1, 0);
      this.status = this.add.text(W / 2, H - 26, "", { fontSize: "18px", fontFamily: DUKit.FONT, color: "#5a3a12", fontStyle: "bold" }).setOrigin(0.5);

      // Pick species + colours for this round.
      this.set = [];
      const used = new Set();
      for (let i = 0; i < this.count; i++) {
        let sp;
        do { sp = this.species[rnd(this.species.length)]; } while (used.has(sp));
        used.add(sp);
        this.set.push({ s: sp, c: this.colors[rnd(this.colors.length)] });
      }

      // Build footprint slot textures (from classic FOOT svg paths).
      const FOOT = {
        trex: '<ellipse cx="40" cy="60" rx="15" ry="13"/><path d="M40 8 q9 14 6 34 h-12 q-3 -20 6 -34z"/><path d="M14 22 q14 6 20 26 l-11 4 q-13 -12 -9 -30z"/><path d="M66 22 q-14 6 -20 26 l11 4 q13 -12 9 -30z"/>',
        tricera: '<ellipse cx="40" cy="58" rx="22" ry="16"/><circle cx="18" cy="30" r="10"/><circle cx="40" cy="22" r="10"/><circle cx="62" cy="30" r="10"/>',
        stego: '<ellipse cx="40" cy="54" rx="21" ry="19"/><circle cx="14" cy="30" r="6"/><circle cx="27" cy="19" r="6"/><circle cx="40" cy="15" r="6"/><circle cx="53" cy="19" r="6"/><circle cx="66" cy="30" r="6"/>',
        bronto: '<circle cx="40" cy="50" r="27"/><circle cx="14" cy="22" r="8"/><circle cx="31" cy="12" r="8"/><circle cx="49" cy="12" r="8"/><circle cx="66" cy="22" r="8"/>',
        raptor: '<ellipse cx="40" cy="62" rx="11" ry="10"/><ellipse cx="27" cy="34" rx="8" ry="20" transform="rotate(-10 27 34)"/><ellipse cx="53" cy="34" rx="8" ry="20" transform="rotate(10 53 34)"/><path d="M8 40 q-4 -16 10 -24 q-6 12 -2 26z"/>',
        ptero: '<ellipse cx="40" cy="62" rx="8" ry="9"/><ellipse cx="40" cy="30" rx="4" ry="26"/><ellipse cx="20" cy="38" rx="4" ry="22" transform="rotate(25 20 38)"/><ellipse cx="60" cy="38" rx="4" ry="22" transform="rotate(-25 60 38)"/>',
      };
      for (const d of this.set) {
        if (this.textures.exists("foot_" + d.s)) continue;
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><g fill="#7a6048" stroke="#5a3a1a" stroke-width="2">' + FOOT[d.s] + "</g></svg>";
        const img = new Image();
        img.onload = () => { this.textures.addImage("foot_" + d.s, img); };
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      }

      // Build dino card textures.
      for (const d of this.set) {
        const key = "footcard_" + d.s + "_" + d.c;
        dinoTexture(this, key, d.s, d.c, () => {});
      }

      // Layout: footprints in a grid on the left, dino cards in a row at the bottom.
      this.slots = [];
      this.cards = [];
      const cols = Math.ceil(this.count / 2);
      const fw = 130, fh = 130, fgx = 30, fgy = 24;
      const gridW = cols * fw + (cols - 1) * fgx;
      const fx0 = (W - gridW) / 2;
      const fy0 = 110;
      const shuffled = this.shuffleArr(this.set.map((_, i) => i));
      for (let i = 0; i < this.count; i++) {
        const d = this.set[shuffled[i]];
        const x = fx0 + (i % cols) * (fw + fgx) + fw / 2;
        const y = fy0 + Math.floor(i / cols) * (fh + fgy) + fh / 2;
        const slot = this.add.container(x, y);
        const mud = this.add.ellipse(0, 0, fw, fh, 0xc9a96a, 0.5).setStrokeStyle(4, 0x8a6030, 0.6);
        const foot = this.add.image(0, 0, "foot_" + d.s).setScale(100 / 80).setAlpha(0.35);
        slot.add([mud, foot]);
        slot.setDepth(1);
        this.slots.push({ slot, species: d.s, solved: false });
      }

      // Dino cards at the bottom.
      const cardW = 120, cardH = 100, cgap = 20;
      const totalCW = this.count * cardW + (this.count - 1) * cgap;
      const cx0 = (W - totalCW) / 2;
      const cy = H - 70;
      const cardOrder = this.shuffleArr(this.set.map((_, i) => i));
      for (let i = 0; i < this.count; i++) {
        const d = this.set[cardOrder[i]];
        const key = "footcard_" + d.s + "_" + d.c;
        const card = this.add.container(cx0 + i * (cardW + cgap) + cardW / 2, cy);
        const bg = this.add.rectangle(0, 0, cardW, cardH, 0xffffff, 0.9).setStrokeStyle(4, 0xd9694f, 1);
        const img = this.add.image(0, 4, key).setScale((cardH - 20) / 180);
        card.add([bg, img]);
        card.setDepth(10);
        card.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH) });
        card.setData({ species: d.s, home: { x: cx0 + i * (cardW + cgap) + cardW / 2, y: cy }, dragging: false });
        card.on("pointerdown", (p) => this.dragStart(card, p));
        card.on("pointermove", (p) => this.dragMove(card, p));
        card.on("pointerup", (p) => this.dragEnd(card, p));
        card.on("pointerout", (p) => { if (card.getData("dragging")) this.dragEnd(card, p); });
        this.cards.push(card);
      }

      this.startTitle();
    }

    shuffleArr(a) {
      for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }

    dragStart(card, p) {
      if (this.state !== "play" || card.getData("locked")) return;
      card.setData("dragging", true);
      card.setDepth(50);
      card.setScale(1.1);
      DUKit.sfx("tap");
    }

    dragMove(card, p) {
      if (!card.getData("dragging")) return;
      card.setPosition(p.x, p.y);
    }

    dragEnd(card, p) {
      if (!card.getData("dragging")) return;
      card.setData("dragging", false);
      card.setScale(1);
      card.setDepth(10);
      const cs = card.getData("species");
      // Find the slot under the pointer.
      let hitSlot = null;
      for (const s of this.slots) {
        if (s.solved) continue;
        const dx = p.x - s.slot.x, dy = p.y - s.slot.y;
        if (Math.abs(dx) < 70 && Math.abs(dy) < 70) { hitSlot = s; break; }
      }
      if (hitSlot && hitSlot.species === cs) {
        // Match!
        hitSlot.solved = true;
        hitSlot.slot.alpha = 0;
        card.setPosition(hitSlot.slot.x, hitSlot.slot.y - 10);
        card.setData("locked", true);
        card.setScale(1.05);
        DUKit.sfx("chirp");
        DUKit.burst(this, hitSlot.slot.x, hitSlot.slot.y, { tint: 0xffe14d, n: 14 });
        this.done++;
        this.hud.setText("Matched: " + this.done + "/" + this.count);
        this.say("A " + cs + " print! " + (this.count - this.done) + " to go!");
        if (this.done === this.count) this.win();
      } else {
        // Return to home.
        const home = card.getData("home");
        this.tweens.add({ targets: card, x: home.x, y: home.y, duration: 300, ease: "Quad.easeOut" });
        if (hitSlot) { DUKit.sfx("bad"); this.say("Not those prints. Look at the toes!"); }
      }
    }

    say(msg) {
      this.status.setText(msg);
      this.status.setAlpha(1);
      this.tweens.add({ targets: this.status, alpha: 0.15, delay: 1400, duration: 400 });
    }

    win() {
      this.state = "won";
      DUKit.sfx("win");
      for (let i = 0; i < 3; i++) DUKit.burst(this, Phaser.Math.Between(W * 0.25, W * 0.75), H * 0.3, { tint: [0xff6b6b, 0xffd93d, 0x6bcb77][i], n: 24, gravity: 400, life: 1100, depth: 120 });
      const stars = 3; // all matched = 3 stars
      progress.stars["footprint"] = Math.max(progress.stars["footprint"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        emoji: "🐾",
        title: "ALL PRINTS MATCHED!",
        line: this.count + " dinosaurs found",
        best: "Best: " + (progress.stars["footprint"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO PLAY AGAIN",
      }, () => { this.scene.restart(); });
    }

    startTitle() {
      this.state = "title";
      this.cards.forEach((c) => c.setAlpha(0));
      this.slots.forEach((s) => s.slot.setAlpha(0));
      DUKit.title(this, {
        emoji: "🐾",
        title: "Footprint Match",
        hint: "Whose footprints are these? Drag each dino to the prints that match its toes!",
        color: 0xd9694f,
        cssColor: "#d9694f",
      }, () => {
        this.state = "play";
        this.tweens.add({ targets: this.cards, alpha: 1, duration: 300 });
        this.tweens.add({ targets: this.slots.map((s) => s.slot), alpha: 1, duration: 300 });
        DUKit.banner(this, "Drag a dino to its prints!");
      });
    }
  }


  /* ---------------------------------------------------------------- dino mixer */
  class MixerScene extends Phaser.Scene {
    constructor() { super("mixer"); }

    create(data) {
      DUKit.textures(this);
      this.species = ["trex", "tricera", "stego", "bronto", "raptor", "ptero"];
      this.names = { trex: "T-rex", tricera: "Triceratops", stego: "Stegosaurus", bronto: "Brontosaurus", raptor: "Raptor", ptero: "Pterosaur" };
      this.colors = ["green", "teal", "purple", "orange", "pink", "blue", "yellow", "red"];
      this.state = "title";

      this.cur = { h: this.species[rnd(6)], b: this.species[(rnd(6) + 3) % 6], c: this.colors[rnd(8)] };
      if (this.cur.h === this.cur.b) this.cur.h = this.species[(this.species.indexOf(this.cur.b) + 1) % 6];
      this.target = { b: this.species[rnd(6)], h: this.species[rnd(6)], c: this.colors[rnd(8)] };
      if (this.target.h === this.target.b) this.target.h = this.species[(this.species.indexOf(this.target.b) + 1) % 6];

      sky(this, 0xbfe8ff, 0xfff3d9);
      this.add.text(40, 22, "🧬 Dino Mixer", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#1c4a3a" }).setOrigin(0, 0);
      this.status = this.add.text(W / 2, H - 24, "", { fontSize: "17px", fontFamily: DUKit.FONT, color: "#5a3a12", fontStyle: "bold" }).setOrigin(0.5);

      this.add.text(770, 110, "Build this one!", { fontSize: "16px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#24407a" }).setOrigin(0.5);
      this.targetKey = "mix_target_" + this.target.b + "_" + this.target.h + "_" + this.target.c;
      this.dinoTex(this, this.targetKey, this.target.b, this.target.h, this.target.c, () => {
        this.targetImg = this.add.image(770, 185, this.targetKey).setScale(140 / 240);
      });

      this.add.rectangle(300, 270, 420, 300, 0xffffff, 0.5).setStrokeStyle(4, 0x2fa58a, 0.6);
      this.add.text(300, 108, "Your dinosaur", { fontSize: "18px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#24407a" }).setOrigin(0.5);

      const bx = 610, bw = 300, bh = 54, gap = 16;
      this.buttons = [];
      this.buttons[0] = this.mkBtn(bx, 150, "Head", () => this.cycle("h"));
      this.buttons[1] = this.mkBtn(bx, 150 + (bh + gap), "Body", () => this.cycle("b"));
      this.buttons[2] = this.mkBtn(bx, 150 + 2 * (bh + gap), "Colour", () => this.cycle("c"));
      this.buttons[3] = this.mkBtn(bx, 150 + 3 * (bh + gap), "🎲 Surprise!", () => this.surprise());
      this.finishBtn = this.mkBtn(bx, 150 + 4 * (bh + gap), "✨ Wake it up!", () => this.finish(), 0x2fa58a);
      this.updateLabels();
      this.draw();
      this.startTitle();
    }

    dinoTex(scene, key, body, head, color, cb) {
      if (scene.textures.exists(key)) { cb(); return; }
      const img = new Image();
      img.onload = () => { scene.textures.addImage(key, img); cb(); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(FX().dinoSVG(body, { color, head }));
    }

    mkBtn(x, y, label, fn, fill) {
      const w = 300, h = 54;
      const c = this.add.container(x + w / 2, y + h / 2);
      const bg = this.add.rectangle(0, 0, w, h, fill || 0xffffff, 0.96).setStrokeStyle(4, 0x2fa58a, 1);
      const t = this.add.text(0, 0, label, { fontSize: "17px", fontFamily: DUKit.FONT, fontStyle: "bold", color: fill ? "#ffffff" : "#24407a" }).setOrigin(0.5);
      c.add([bg, t]);
      c.setDepth(5);
      c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), false, false, { useHandCursor: true });
      c.on("pointerover", () => bg.setAlpha(1));
      c.on("pointerout", () => bg.setAlpha(0.96));
      c.on("pointerdown", fn);
      c.setData({ t });
      return c;
    }

    setLabel(c, txt) { c.getData().t.setText(txt); }

    cycle(k) {
      if (this.state !== "play") return;
      const list = k === "c" ? this.colors : this.species;
      let i = list.indexOf(this.cur[k]);
      i = (i + 1) % list.length;
      this.cur[k] = list[i];
      DUKit.sfx("pop");
      this.updateLabels();
      this.draw();
      this.say(k === "c" ? "A " + this.cur.c + " dinosaur!" : this.names[this.cur.h] + " head on a " + this.names[this.cur.b] + " body!");
    }

    surprise() {
      if (this.state !== "play") return;
      this.cur.h = this.species[rnd(6)];
      this.cur.b = this.species[rnd(6)];
      this.cur.c = this.colors[rnd(8)];
      DUKit.sfx("sparkle");
      DUKit.burst(this, 300, 270, { tint: 0xffe14d, n: 16 });
      this.updateLabels();
      this.draw();
      this.say("Ooh! A " + this.names[this.cur.h] + " head on a " + this.names[this.cur.b] + " body!");
    }

    finish() {
      if (this.state !== "play") return;
      const ok = this.cur.b === this.target.b && this.cur.h === this.target.h;
      if (!ok) {
        DUKit.sfx("bad");
        DUKit.shake(this, 180, 2);
        this.say("Not quite! You need a " + this.names[this.target.h] + " head and a " + this.names[this.target.b] + " body.", true);
        return;
      }
      this.state = "won";
      DUKit.sfx("roar");
      DUKit.shake(this, 300, 3);
      DUKit.burst(this, 300, 270, { tint: 0xffd93d, n: 24 });
      DUKit.burst(this, 300, 220, { tint: 0xff6b6b, n: 16, gravity: 300 });
      DUKit.sfx("win");
      const stars = 3;
      progress.stars["mixer"] = Math.max(progress.stars["mixer"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        emoji: "🧬",
        title: "YOU BUILT IT!",
        line: this.names[this.cur.h] + " head + " + this.names[this.cur.b] + " body",
        best: "Best: " + (progress.stars["mixer"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO MIX AGAIN",
      }, () => { this.scene.restart(); });
    }

    updateLabels() {
      this.setLabel(this.buttons[0], "🎭  " + this.names[this.cur.h]);
      this.setLabel(this.buttons[1], "🦴  " + this.names[this.cur.b]);
      this.setLabel(this.buttons[2], "🎨  " + this.cur.c);
    }

    draw() {
      if (this.preview) this.preview.destroy();
      const key = "mix_cur_" + this.cur.b + "_" + this.cur.h + "_" + this.cur.c;
      this.dinoTex(this, key, this.cur.b, this.cur.h, this.cur.c, () => {
        this.preview = this.add.image(300, 270, key).setScale(220 / 240).setDepth(3);
        this.tweens.add({ targets: this.preview, scale: this.preview.scale * 1.06, duration: 140, yoyo: true });
      });
    }

    say(msg, sad) {
      this.status.setText(msg);
      this.status.setColor(sad ? "#b04040" : "#5a3a12");
      this.status.setAlpha(1);
      this.tweens.add({ targets: this.status, alpha: 0.15, delay: 1600, duration: 400 });
    }

    startTitle() {
      this.state = "title";
      DUKit.title(this, {
        emoji: "🧬",
        title: "Dino Mixer",
        hint: "Mix heads, bodies and colours to build the dinosaur in the picture, then press the Wake-it-up button!",
        color: 0x2fa58a,
        cssColor: "#2fa58a",
      }, () => {
        this.state = "play";
        this.say("Build the dino in the picture, then wake it up!");
      });
    }
  }


  /* ------------------------------------------------------ dino memory */
  class MemoryScene extends Phaser.Scene {
    constructor() { super("memory"); }

    create(data) {
      DUKit.textures(this);
      this.species = ["trex", "tricera", "stego", "bronto", "raptor", "ptero"];
      this.colors = ["green", "teal", "purple", "orange", "pink", "blue"];
      this.pairs = 3; // 6 cards, 3x2 grid
      this.state = "title"; // title | peek | play | won
      this.first = null;
      this.locked = true;
      this.matched = 0;
      this.moves = 0;
      this.combo = 0;

      sky(this, 0xbfe8ff, 0xfff3d9);
      this.add.text(40, 22, "🃏 Dino Memory", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#1c4a3a" }).setOrigin(0, 0);
      this.hud = this.add.text(920, 22, "Pairs: 0/" + this.pairs, { fontSize: "18px", fontFamily: DUKit.FONT, color: "#3d6b5a" }).setOrigin(1, 0);
      this.status = this.add.text(W / 2, H - 24, "", { fontSize: "17px", fontFamily: DUKit.FONT, color: "#5a3a12", fontStyle: "bold" }).setOrigin(0.5);

      // Build the deck: 3 species+colour combos, each twice.
      const combos = [];
      const used = new Set();
      while (combos.length < this.pairs) {
        const sp = this.species[rnd(6)], c = this.colors[rnd(6)];
        const k = sp + "_" + c;
        if (used.has(k)) continue;
        used.add(k);
        combos.push({ s: sp, c: c, k: k });
      }
      const deck = [];
      combos.forEach((d) => { deck.push({ ...d }); deck.push({ ...d }); });
      for (let i = deck.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = deck[i]; deck[i] = deck[j]; deck[j] = t; }

      // Build card textures.
      deck.forEach((d) => d.texKey = "mem_" + d.k);
      combos.forEach((d) => dinoTexture(this, "mem_" + d.k, d.s, d.c, () => {}));

      // Back texture.
      if (!this.textures.exists("mem_back")) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x2f6b5a, 1); g.fillRoundedRect(0, 0, 100, 130, 12);
        g.lineStyle(4, 0x1c4a3a, 1); g.strokeRoundedRect(0, 0, 100, 130, 12);
        g.generateTexture("mem_back", 100, 130);
        g.destroy();
      }

      // Layout: 3 columns x 2 rows.
      const cw = 150, ch = 195, gx = 24, gy = 20;
      const gridW = 3 * cw + 2 * gx;
      const x0 = (W - gridW) / 2, y0 = 110;
      this.cards = [];
      deck.forEach((d, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = x0 + col * (cw + gx) + cw / 2;
        const y = y0 + row * (ch + gy) + ch / 2;
        const card = this.add.container(x, y);
        const back = this.add.image(0, 0, "mem_back").setScale(cw / 100);
        const front = this.add.image(0, 0, d.texKey).setScale((ch - 30) / 180).setVisible(false);
        card.add([back, front]);
        card.setDepth(5);
        card.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-cw / 2, -ch / 2, cw, ch) });
        card.setData({ d, back, front, up: false, matched: false });
        card.on("pointerdown", () => this.tap(card));
        this.cards.push(card);
      });

      this.startTitle();
    }

    startTitle() {
      this.state = "title";
      this.cards.forEach((c) => { c.getData().back.setVisible(true); c.getData().front.setVisible(false); c.setVisible(true); });
      DUKit.title(this, {
        emoji: "🃏",
        title: "Dino Memory",
        hint: "Look at the dinosaurs, then find the matching pairs. Remember where they hide!",
        color: 0xe05a7a,
        cssColor: "#e05a7a",
      }, () => {
        this.peek();
      });
    }

    peek() {
      this.state = "peek";
      this.say("Look carefully! Remember where each dino hides...");
      this.cards.forEach((c) => { c.getData().back.setVisible(false); c.getData().front.setVisible(true); });
      DUKit.sfx("pop");
      this.time.delayedCall(2400, () => {
        this.cards.forEach((c) => { c.getData().back.setVisible(true); c.getData().front.setVisible(false); });
        DUKit.sfx("whoosh");
        this.state = "play";
        this.locked = false;
        this.say("Now find the matching pairs!");
      });
    }

    tap(card) {
      if (this.state !== "play" || this.locked) return;
      const d = card.getData();
      if (d.up || d.matched) return;
      d.back.setVisible(false);
      d.front.setVisible(true);
      d.up = true;
      DUKit.sfx("pop");
      if (!this.first) { this.first = card; return; }

      const a = this.first;
      this.first = null;
      this.locked = true;
      this.moves++;
      const da = a.getData();
      if (da.d.k === d.d.k) {
        this.combo++;
        this.matched++;
        [a, card].forEach((x) => { x.getData().matched = true; x.setScale(1.05); });
        DUKit.sfx("star");
        DUKit.burst(this, card.x, card.y, { tint: 0xff6b6b, n: 12 });
        this.hud.setText("Pairs: " + this.matched + "/" + this.pairs);
        this.say(this.combo > 1 ? this.combo + " in a row! Amazing!" : "A match! Great memory!");
        if (this.matched === this.pairs) { this.time.delayedCall(500, () => this.win()); return; }
        this.locked = false;
      } else {
        this.combo = 0;
        DUKit.sfx("bad");
        this.say("Not a match. Remember where they are!");
        this.time.delayedCall(750, () => {
          [a, card].forEach((x) => { const dd = x.getData(); dd.back.setVisible(true); dd.front.setVisible(false); dd.up = false; });
          this.locked = false;
        });
      }
    }

    win() {
      this.state = "won";
      DUKit.sfx("win");
      for (let i = 0; i < 3; i++) DUKit.burst(this, Phaser.Math.Between(W * 0.25, W * 0.75), H * 0.3, { tint: [0xff6b6b, 0xffd93d, 0x6bcb77][i], n: 24, gravity: 400, life: 1100, depth: 120 });
      const stars = this.moves <= this.pairs ? 3 : this.moves <= this.pairs * 2 ? 2 : 1;
      progress.stars["memory"] = Math.max(progress.stars["memory"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        emoji: "🃏",
        title: "EVERY PAIR FOUND!",
        line: this.moves + " guesses",
        best: "Best: " + (progress.stars["memory"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO PLAY AGAIN",
      }, () => { this.scene.restart(); });
    }

    say(msg) {
      this.status.setText(msg);
      this.status.setAlpha(1);
      this.tweens.add({ targets: this.status, alpha: 0.15, delay: 1500, duration: 400 });
    }
  }


  /* ------------------------------------------------------ size parade */
  class SizeScene extends Phaser.Scene {
    constructor() { super("size"); }

    create(data) {
      DUKit.textures(this);
      this.species = "bronto";
      this.color = "blue";
      this.k = 4; // 4 sizes
      this.sizes = [70, 95, 120, 145];
      this.state = "title";
      this.done = 0;

      sky(this, 0xbfe8ff, 0xfff3d9);
      this.add.text(40, 22, "📏 Size Parade", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#1c4a3a" }).setOrigin(0, 0);
      this.hud = this.add.text(920, 22, "Placed: 0/" + this.k, { fontSize: "18px", fontFamily: DUKit.FONT, color: "#3d6b5a" }).setOrigin(1, 0);
      this.status = this.add.text(W / 2, H - 24, "", { fontSize: "17px", fontFamily: DUKit.FONT, color: "#5a3a12", fontStyle: "bold" }).setOrigin(0.5);

      // Build dino textures for each size (same species, scaled).
      this.dinoTex = "size_" + this.species + "_" + this.color;
      dinoTexture(this, this.dinoTex, this.species, this.color, () => {
        // Slots: numbered, left to right, smallest to biggest.
        this.slots = [];
        const slotW = 170, slotGap = 14;
        const gridW = this.k * slotW + (this.k - 1) * slotGap;
        const x0 = (W - gridW) / 2, y0 = 150;
        for (let i = 0; i < this.k; i++) {
          const x = x0 + i * (slotW + slotGap) + slotW / 2;
          const y = y0 + 80;
          const slot = this.add.container(x, y);
          const size = this.sizes[i];
          const h = Math.round(size * 0.78) + 20;
          const bg = this.add.rectangle(0, 0, slotW, h, 0xffffff, 0.5).setStrokeStyle(4, 0x3d9bd6, 0.7);
          const num = this.add.text(0, -h / 2 + 14, String(i + 1), { fontSize: "22px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#24407a" }).setOrigin(0.5);
          slot.add([bg, num]);
          slot.setDepth(1);
          this.slots.push({ slot, x, y, size, filled: false });
        }

        // Tray: shuffled dino cards at the bottom.
        const tray = this.add.container(0, 0);
        this.dinos = [];
        const order = [0, 1, 2, 3];
        for (let i = order.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = order[i]; order[i] = order[j]; order[j] = t; }
        const tw = 130, tg = 30;
        const totalW = this.k * tw + (this.k - 1) * tg;
        const tx0 = (W - totalW) / 2;
        const ty = H - 80;
        order.forEach((si, i) => {
          const size = this.sizes[si];
          const x = tx0 + i * (tw + tg) + tw / 2;
          const card = this.add.container(x, ty);
          const img = this.add.image(0, 0, this.dinoTex).setScale((size * 0.78) / 180);
          card.add([img]);
          card.setDepth(10);
          card.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-tw / 2, -60, tw, 120) });
          card.setData({ size, home: { x, y: ty }, dragging: false });
          card.on("pointerdown", (pt) => this.dragStart(card, pt));
          card.on("pointermove", (pt) => this.dragMove(card, pt));
          card.on("pointerup", (pt) => this.dragEnd(card, pt));
          card.on("pointerout", (pt) => { if (card.getData("dragging")) this.dragEnd(card, pt); });
          this.dinos.push(card);
        });
        this.startTitle();
      });
    }

    dragStart(card, pt) {
      if (this.state !== "play") return;
      if (card.getData("placed")) return;
      card.setData("dragging", true);
      card.setDepth(50);
      card.setScale(1.1);
      DUKit.sfx("tap");
    }

    dragMove(card, pt) {
      if (!card.getData("dragging")) return;
      card.setPosition(pt.x, pt.y);
    }

    dragEnd(card, pt) {
      if (!card.getData("dragging")) return;
      card.setData("dragging", false);
      const cs = card.getData("size");
      // Find the slot under the pointer.
      let hitSlot = null;
      for (const sl of this.slots) {
        if (sl.filled) continue;
        const dx = pt.x - sl.x, dy = pt.y - sl.y;
        if (Math.abs(dx) < 90 && Math.abs(dy) < 90) { hitSlot = sl; break; }
      }
      if (hitSlot && hitSlot.size === cs) {
        // Correct placement.
        hitSlot.filled = true;
        card.setPosition(hitSlot.x, hitSlot.y);
        card.setScale((cs * 0.78) / 180);
        card.setData("placed", true);
        DUKit.sfx("boing");
        DUKit.burst(this, hitSlot.x, hitSlot.y, { tint: 0xffe14d, n: 10 });
        this.done++;
        this.hud.setText("Placed: " + this.done + "/" + this.k);
        if (this.done === this.k) this.parade();
        else this.say("Good! " + (this.k - this.done) + " to go!");
      } else {
        // Wrong or no slot: return home.
        const home = card.getData("home");
        this.tweens.add({ targets: card, x: home.x, y: home.y, duration: 300, ease: "Quad.easeOut" });
        card.setScale(1);
        if (hitSlot) {
          DUKit.sfx("bad");
          this.say(cs > hitSlot.size ? "That one is too big for this spot!" : "That one is too small for this spot!");
        }
      }
    }

    parade() {
      this.state = "parade";
      this.say("Parade time! Roar roar roar!");
      DUKit.sfx("drum");
      DUKit.burst(this, W / 2, H / 2, { tint: 0xffd93d, n: 30, gravity: 200 });
      DUKit.burst(this, W * 0.3, H * 0.4, { tint: 0xff6b6b, n: 16, gravity: 300 });
      DUKit.burst(this, W * 0.7, H * 0.4, { tint: 0x6bcb77, n: 16, gravity: 300 });
      DUKit.sfx("win");
      const stars = 3;
      progress.stars["size"] = Math.max(progress.stars["size"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        emoji: "📏",
        title: "WHAT A PARADE!",
        line: this.k + " dinosaurs in line",
        best: "Best: " + (progress.stars["size"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO PLAY AGAIN",
      }, () => { this.scene.restart(); });
    }

    say(msg) {
      this.status.setText(msg);
      this.status.setAlpha(1);
      this.tweens.add({ targets: this.status, alpha: 0.15, delay: 1500, duration: 400 });
    }

    startTitle() {
      this.state = "title";
      this.dinos.forEach((d) => d.setAlpha(0));
      this.slots.forEach((sl) => sl.slot.setAlpha(0));
      DUKit.title(this, {
        emoji: "📏",
        title: "Size Parade",
        hint: "Drag each dinosaur into its numbered slot - smallest to biggest - then the parade begins!",
        color: 0x3d9bd6,
        cssColor: "#3d9bd6",
      }, () => {
        this.state = "play";
        this.tweens.add({ targets: this.dinos, alpha: 1, duration: 300 });
        this.tweens.add({ targets: this.slots.map((sl) => sl.slot), alpha: 1, duration: 300 });
        this.say("Smallest first! Drag them into the line.");
      });
    }
  }


  /* ------------------------------------------------------ snack time (counting) */
  class CountingScene extends Phaser.Scene {
    constructor() { super("counting"); }

    create(data) {
      DUKit.textures(this);
      this.species = ["trex", "stego", "raptor"];
      this.state = "title";
      this.n = Phaser.Math.Between(3, 5);
      this.fed = 0;
      this.busy = false;
      this.sp = this.species[rnd(3)];
      this.col = ["green", "teal", "purple", "orange", "pink", "blue"][rnd(6)];
      this.dinoKey = "cnt_" + this.sp + "_" + this.col;
      this.texKey = "cnt_dino_" + this.sp + "_" + this.col;
      dinoTexture(this, this.texKey, this.sp, this.col, () => {});

      sky(this, 0xbfe8ff, 0xfff3d9);
      this.add.text(40, 22, "🍓 Snack Time", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#1c4a3a" }).setOrigin(0, 0);
      this.hud = this.add.text(920, 22, "0 / " + this.n, { fontSize: "20px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#3d6b5a" }).setOrigin(1, 0);
      this.status = this.add.text(W / 2, H - 22, "", { fontSize: "17px", fontFamily: DUKit.FONT, color: "#5a3a12", fontStyle: "bold" }).setOrigin(0.5);

      // Dino with speech bubble.
      this.add.rectangle(250, 240, 300, 240, 0xffffff, 0.5).setStrokeStyle(4, 0xe0762e, 0.6);
      this.dino = this.add.image(250, 270, this.texKey).setScale(180 / 240).setDepth(3);
      this.bubble = this.add.text(250, 120, "" + this.n + " 🍓", { fontSize: "34px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#fff", backgroundColor: "#e0762e", padding: 14 }).setOrigin(0.5).setDepth(4);

      // Pile of foods.
      const tricky = true;
      const foods = [];
      const berry = "🍓";
      for (let i = 0; i < this.n + 4; i++) foods.push(berry);
      foods.push("🪨", "🧦", "🪨", "🧦");
      for (let i = foods.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = foods[i]; foods[i] = foods[j]; foods[j] = t; }

      const cols = 6, cw = 70, ch = 70, gx = 16, gy = 18;
      const x0 = 470, y0 = 90;
      this.add.text(x0 + (cols * (cw + gx) - gx) / 2 - 20, 66, "Tap the berries (not the rocks or socks!)", { fontSize: "15px", fontFamily: DUKit.FONT, color: "#3d6b5a" }).setOrigin(0, 0);
      foods.forEach((f, i) => {
        const x = x0 + (i % cols) * (cw + gx) + cw / 2;
        const y = y0 + Math.floor(i / cols) * (ch + gy) + ch / 2;
        const b = this.add.container(x, y);
        const bg = this.add.circle(0, 0, 32, 0xffffff, 0.92).setStrokeStyle(3, 0xe0762e, 0.8);
        const t = this.add.text(0, 0, f, { fontSize: "34px" }).setOrigin(0.5);
        b.add([bg, t]);
        b.setDepth(5);
        b.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Circle(0, 0, 32) });
        b.setData({ f, used: false });
        b.on("pointerdown", () => this.tap(b));
      });

      this.startTitle();
    }

    tap(b) {
      if (this.state !== "play" || this.busy) return;
      const d = b.getData();
      if (d.used) return;
      d.used = true;
      b.setAlpha(0.3);
      if (d.f === "🍓") {
        this.busy = true;
        DUKit.sfx("chomp");
        this.tweens.add({ targets: b, x: 250, y: 250, scale: 0.4, duration: 400, ease: "Quad.easeIn", onComplete: () => b.destroy() });
        this.fed++;
        this.hud.setText(this.fed + " / " + this.n);
        this.say("Mmm! " + (this.n - this.fed) + " more!");
        this.busy = false;
        if (this.fed >= this.n) this.win();
      } else {
        DUKit.sfx("bad");
        DUKit.shake(this, 160, 2);
        this.say(d.f === "🧦" ? "Yuck, a sock!" : "That is a rock, not a berry!");
      }
    }

    win() {
      this.state = "won";
      DUKit.sfx("win");
      DUKit.burst(this, 250, 240, { tint: 0xffd93d, n: 24 });
      DUKit.burst(this, 250, 200, { tint: 0xff6b6b, n: 14, gravity: 300 });
      const stars = 3;
      progress.stars["counting"] = Math.max(progress.stars["counting"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        emoji: "🍓",
        title: "TUMMY FULL!",
        line: this.n + " berries",
        best: "Best: " + (progress.stars["counting"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO PLAY AGAIN",
      }, () => { this.scene.restart(); });
    }

    say(msg) {
      this.status.setText(msg);
      this.status.setAlpha(1);
      this.tweens.add({ targets: this.status, alpha: 0.15, delay: 1400, duration: 400 });
    }

    startTitle() {
      this.state = "title";
      DUKit.title(this, {
        emoji: "🍓",
        title: "Snack Time",
        hint: "Count the berries! Feed the dino exactly the number it asks for - skip the rocks and socks.",
        color: 0xe0762e,
        cssColor: "#e0762e",
      }, () => {
        this.state = "play";
        this.say("Feed me " + this.n + " berries!");
      });
    }
  }


  /* ------------------------------------------------------ dot-to-dot */
  class DotScene extends Phaser.Scene {
    constructor() { super("dot"); }

    create(data) {
      DUKit.textures(this);
      this.state = "title";
      // Pterosaur-ish outline, points in order.
      this.P = [
        [120, 150], [160, 120], [210, 105], [260, 95], [310, 100], [350, 120],
        [360, 150], [345, 185], [300, 210], [250, 225], [200, 230], [155, 220],
        [120, 200], [105, 175],
      ];
      // Add small jitter like the classic.
      this.P = this.P.map((pt) => [pt[0] + Phaser.Math.Between(-5, 5), pt[1] + Phaser.Math.Between(-5, 5)]);
      this.next = 0;
      this.hits = 0;

      sky(this, 0xbfe8ff, 0xfff3d9);
      this.add.text(40, 22, "🔢 Dot-to-Dot", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#1c4a3a" }).setOrigin(0, 0);
      this.hud = this.add.text(920, 22, "0 / " + this.P.length, { fontSize: "18px", fontFamily: DUKit.FONT, color: "#3d6b5a" }).setOrigin(1, 0);
      this.status = this.add.text(W / 2, H - 22, "", { fontSize: "17px", fontFamily: DUKit.FONT, color: "#5a3a12", fontStyle: "bold" }).setOrigin(0.5);

      this.g = this.add.graphics();
      this.g.setDepth(2);

      // Hidden dino to reveal.
      this.dinoKey = "dot_ptero_blue";
      dinoTexture(this, this.dinoKey, "ptero", "blue", () => {});
      this.dinoImg = this.add.image(W / 2, H / 2 - 20, this.dinoKey).setScale(240 / 240).setVisible(false).setDepth(1);

      this.dots = [];
      this.P.forEach((pt, i) => {
        const x = pt[0] + 180, y = pt[1] + 20; // offset into the 960-wide canvas
        const c = this.add.circle(x, y, 11, 0xffffff).setStrokeStyle(2, 0x4d96ff, 1).setDepth(3);
        const t = this.add.text(x, y, String(i + 1), { fontSize: "11px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#4d96ff" }).setOrigin(0.5).setDepth(4);
        c.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Circle(0, 0, 15) });
        c.on("pointerdown", () => this.tap(i, c, t));
        this.dots.push({ c, t, done: false, x, y });
      });

      this.startTitle();
    }

    tap(i, c, t) {
      if (this.state !== "play") return;
      if (i !== this.next) return;
      const d = this.dots[i];
      d.done = true;
      d.c.setFillStyle(0x4d96ff, 1);
      d.t.setColor("#ffffff");
      this.hits++;
      this.hud.setText(this.hits + " / " + this.P.length);
      DUKit.sfx("tap");
      // Draw line from previous completed dot to this one.
      if (i > 0) {
        const a = this.dots[i - 1];
        this.g.lineStyle(4, 0x4d96ff, 1);
        this.g.beginPath();
        this.g.moveTo(a.x, a.y);
        this.g.lineTo(d.x, d.y);
        this.g.strokePath();
      }
      if (this.hits % 3 === 0) this.say(["Nice line!", "Keep going!", "So close!"][this.hits % 3]);
      if (this.hits >= this.P.length) this.win();
    }

    win() {
      this.state = "won";
      DUKit.sfx("win");
      this.dinoImg.setVisible(true);
      DUKit.burst(this, W / 2, H / 2, { tint: 0xffd93d, n: 30, gravity: 200 });
      DUKit.burst(this, W * 0.35, H * 0.4, { tint: 0xff6b6b, n: 16, gravity: 300 });
      DUKit.burst(this, W * 0.65, H * 0.4, { tint: 0x6bcb77, n: 16, gravity: 300 });
      DUKit.sfx("roar");
      const stars = 3;
      progress.stars["dot"] = Math.max(progress.stars["dot"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        emoji: "🔢",
        title: "EVERY DOT JOINED!",
        line: "A dinosaur appears!",
        best: "Best: " + (progress.stars["dot"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO PLAY AGAIN",
      }, () => { this.scene.restart(); });
    }

    say(msg) {
      this.status.setText(msg);
      this.status.setAlpha(1);
      this.tweens.add({ targets: this.status, alpha: 0.15, delay: 1400, duration: 400 });
    }

    startTitle() {
      this.state = "title";
      DUKit.title(this, {
        emoji: "🔢",
        title: "Dot-to-Dot",
        hint: "Tap the dots in number order. Follow the lines and reveal the hidden dinosaur!",
        color: 0x4d96ff,
        cssColor: "#4d96ff",
      }, () => {
        this.state = "play";
        this.say("Start at dot 1, then 2, then 3...");
      });
    }
  }


  /* ------------------------------------------------------ colouring */
  class ColourScene extends Phaser.Scene {
    constructor() { super("color"); }

    create() {
      DUKit.textures(this);
      this.state = "title";
      const sp = "stego";
      this.color = pick(COLORS);
      this.parts = 6;

      sky(this, 0xfdf3ff, 0xffe9f3);
      this.add.text(40, 22, "🎨 Colouring", { fontSize: "24px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#7a2c57" }).setOrigin(0, 0);
      this.hud = this.add.text(920, 22, "0 / " + this.parts, { fontSize: "18px", fontFamily: DUKit.FONT, color: "#9a4a72" }).setOrigin(1, 0);

      this.dinoKey = "color_" + sp + "_" + this.color.replace("#", "");
      dinoTexture(this, this.dinoKey, sp, this.color, () => {});
      this.dinoImg = this.add.image(W / 2 - 120, H / 2 - 10, this.dinoKey).setScale(1.5).setDepth(1);

      // Palette
      const PAINTS = [0xff6b6b, 0xff9f43, 0xffd93d, 0x6bcb77, 0x2ec4b6, 0x4d96ff, 0x9b6fe0, 0xff8fc7, 0xa0522d, 0xffffff];
      this.selected = PAINTS[0];
      const palX0 = W / 2 + 40;
      this.swatches = [];
      PAINTS.forEach((c, i) => {
        const col = i % 5, row = Math.floor(i / 5);
        const x = palX0 + col * 54, y = 130 + row * 54;
        const sw = this.add.rectangle(x, y, 40, 40, c).setStrokeStyle(3, 0xffffff, 1).setDepth(3);
        sw.setInteractive({ useHandCursor: true });
        sw.on("pointerdown", () => { this.selected = c; DUKit.sfx("tap"); this.swatches.forEach((o) => o.setAlpha(0.5)); sw.setAlpha(1); sw.setStrokeStyle(4, 0x22334a, 1); });
        if (i === 0) { sw.setAlpha(1); sw.setStrokeStyle(4, 0x22334a, 1); } else sw.setAlpha(0.7);
        this.swatches.push(sw);
      });
      this.add.text(palX0 + 108, 90, "Pick a colour, then tap the parts!", { fontSize: "14px", fontFamily: DUKit.FONT, color: "#7a2c57" }).setOrigin(0.5);

      // Numbered parts overlaid on the dino
      this.partN = 0;
      const spots = [[-150, -70], [-150, -10], [-150, 60], [-110, 90], [-190, 90], [-200, 20]];
      this.partsArr = [];
      spots.forEach((p, i) => {
        const x = W / 2 - 120 + p[0], y = H / 2 - 10 + p[1];
        const c = this.add.circle(x, y, 14, 0xffffff).setStrokeStyle(3, 0xe0508f, 1).setDepth(3);
        const t = this.add.text(x, y, String(i + 1), { fontSize: "14px", fontFamily: DUKit.FONT, fontStyle: "bold", color: "#e0508f" }).setOrigin(0.5).setDepth(4);
        c.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Circle(0, 0, 18) });
        c.on("pointerdown", () => this.paint(i, c, t));
        this.partsArr.push({ c, t, done: false });
      });

      this.startTitle();
    }

    paint(i, c, t) {
      if (this.state !== "play") return;
      const d = this.partsArr[i];
      if (d.done) return;
      d.done = true;
      d.c.setFillStyle(this.selected, 1);
      d.t.setText("");
      this.partN++;
      this.hud.setText(this.partN + " / " + this.parts);
      DUKit.sfx("pop");
      DUKit.burst(this, c.x, c.y, { tint: this.selected, n: 8, gravity: 60 });
      if (this.partN >= this.parts) this.win();
    }

    win() {
      this.state = "won";
      DUKit.sfx("win");
      DUKit.sfx("roar");
      this.tweens.add({ targets: this.dinoImg, scale: 1.7, duration: 500, yoyo: true });
      DUKit.burst(this, W / 2 - 120, H / 2 - 10, { tint: 0xffd93d, n: 40, gravity: 150 });
      DUKit.burst(this, W / 2, H / 2, { tint: 0xff8fc7, n: 20, gravity: 200 });
      const stars = 3;
      progress.stars["color"] = Math.max(progress.stars["color"] || 0, stars);
      saveProgress();
      DUKit.endPanel(this, {
        emoji: "🎨",
        title: "BECAME ALIVE!",
        line: "Your dinosaur is fully coloured!",
        best: "Best: " + (progress.stars["color"] || 0) + " ⭐",
        stars: stars,
        again: "TAP TO PAINT AGAIN",
      }, () => { this.scene.restart(); });
    }

    startTitle() {
      this.state = "title";
      DUKit.title(this, {
        emoji: "🎨",
        title: "Dino Colouring",
        hint: "Pick a colour from the palette, then tap each numbered part of the dinosaur. When every part is painted, the dino comes alive!",
        color: 0xe0508f,
        cssColor: "#e0508f",
      }, () => { this.state = "play"; });
    }
  }

  const GAME_MAP = {
    puzzle: "puzzle",
    dig: "dig",
    footprint: "footprint",
    mixer: "mixer",
    memory: "memory",
    size: "size",
    counting: "counting",
    dot: "dot",
    color: "color",
  };

  window.game = new Phaser.Game({
    type: Phaser.AUTO,
    width: W,
    height: H,
    parent: "game-root",
    backgroundColor: "#bfe8ff",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [MenuScene, PuzzleScene, DigScene, FootScene, MixerScene, MemoryScene, SizeScene, CountingScene, DotScene, ColourScene],
  });
})();
