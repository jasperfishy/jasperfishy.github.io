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

  const GAME_MAP = {
    puzzle: "puzzle",
    dig: "dig",
  };

  window.game = new Phaser.Game({
    type: Phaser.AUTO,
    width: W,
    height: H,
    parent: "game-root",
    backgroundColor: "#bfe8ff",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [MenuScene, PuzzleScene, DigScene],
  });
})();
