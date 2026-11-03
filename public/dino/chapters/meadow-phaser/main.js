import { types, themes, tokens, colours, shuffle, mazeFor } from "../meadow/catalog.js";

const W = 960, H = 540, STORE_KEY = "dino-meadow-phaser-v1", ROUNDS = 5;
const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function readJSON(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value == null ? fallback : value; }
  catch { return fallback; }
}
const settings = { sound: true, easy: true, ...readJSON("dm-settings", {}) };
let completed = readJSON("dm-completed", []);
let favourites = readJSON("dm-favourites", []);
function saveProgress() {
  try {
    localStorage.setItem("dm-completed", JSON.stringify(completed));
    localStorage.setItem("dm-favourites", JSON.stringify(favourites));
  } catch { /* The games still work when storage is unavailable. */ }
}
function sfx(name) {
  if (settings.sound === false) return;
  if (window.DUKit?.sfx) window.DUKit.sfx(name);
  else if (window.DUFX?.sfx?.[name]) window.DUFX.sfx[name]();
}
function text(scene, x, y, value, size = 24, color = "#24445d", origin = 0.5) {
  return scene.add.text(x, y, String(value), {
    fontFamily: "system-ui, Segoe UI, sans-serif", fontSize: size + "px",
    color, fontStyle: "700", align: "center", wordWrap: { width: 800 }
  }).setOrigin(origin);
}
function addTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}
function meadowBackdrop(scene) {
  if (window.DUKit?.textures) window.DUKit.textures(scene);
  const sky = scene.add.graphics().setDepth(-20);
  sky.fillGradientStyle(0x76d0f5, 0x76d0f5, 0xe2f3d2, 0xe2f3d2, 1);
  sky.fillRect(0, 0, W, H);
  if (window.DUKit?.sunRays) window.DUKit.sunRays(scene, 820, 76, 190, 0xfff1ad);
  const sun = scene.add.circle(820, 76, 40, 0xffdd72).setDepth(-15);
  if (motionOK) scene.tweens.add({ targets: sun, scale: 1.08, duration: 1800, yoyo: true, repeat: -1, ease: "sine.inOut" });
  addTexture(scene, "meadow-far-trees", 240, 150, (g) => {
    g.fillStyle(0x78b6a0, 1);
    g.fillCircle(38, 66, 36); g.fillCircle(107, 49, 46); g.fillCircle(188, 67, 34);
    g.fillStyle(0x8d7655, 1); g.fillRect(33, 80, 10, 66); g.fillRect(103, 80, 11, 66); g.fillRect(184, 87, 9, 59);
  });
  addTexture(scene, "meadow-near-hills", 220, 120, (g) => {
    g.fillStyle(0x64b978, 1); g.fillEllipse(50, 100, 150, 80); g.fillEllipse(155, 100, 170, 90);
    g.fillStyle(0x8dd47b, 1); g.fillTriangle(6, 83, 22, 50, 38, 83); g.fillTriangle(65, 79, 81, 45, 97, 79);
  });
  const far = scene.add.tileSprite(W / 2, 314, W, 150, "meadow-far-trees").setAlpha(0.68).setDepth(-12);
  const near = scene.add.tileSprite(W / 2, 442, W, 140, "meadow-near-hills").setDepth(-10);
  for (let i = 0; i < 5; i++) {
    const cloud = scene.add.text(-100, 110 + i % 2 * 48, "☁️", { fontSize: (38 + i % 3 * 8) + "px" }).setAlpha(0.62).setDepth(-14);
    if (motionOK) scene.tweens.add({ targets: cloud, x: W + 120, duration: 25000 + i * 4300, repeat: -1, delay: -i * 2600 });
  }
  if (window.DUKit?.sparkleField) window.DUKit.sparkleField(scene, 14, 30, 25, 930, 330, 0xffffff);
  scene.events.on("update", (_time, delta) => {
    if (!motionOK) return;
    far.tilePositionX += delta * 0.004;
    near.tilePositionX += delta * 0.012;
  });
  return { far, near };
}
function button(scene, layer, x, y, width, height, label, callback, color = 0xfffbec, fontSize = 22) {
  const bg = scene.add.rectangle(x, y, width, height, color, 0.96).setStrokeStyle(2, 0xffffff, 0.94).setInteractive({ useHandCursor: true });
  const title = text(scene, x, y, label, fontSize, "#274956");
  layer.add([bg, title]);
  bg.on("pointerover", () => { if (motionOK) scene.tweens.add({ targets: [bg, title], scale: 1.04, duration: 90 }); });
  bg.on("pointerout", () => scene.tweens.add({ targets: [bg, title], scale: 1, duration: 100 }));
  bg.on("pointerdown", () => { sfx("tap"); callback({ bg, title }); });
  return { bg, title };
}
function typeColour(type) {
  return Phaser.Display.Color.HexStringToColor(type.colour || "#dceee4").color;
}

class MeadowMenuScene extends Phaser.Scene {
  constructor() { super("MeadowMenuScene"); }
  create() {
    meadowBackdrop(this);
    text(this, W / 2, 31, "Dino Meadow", 34, "#174e48");
    text(this, W / 2, 68, "20 playful games · 5 little worlds · 100 adventures", 17, "#356a64");
    text(this, W / 2, 101, "Choose a game", 21, "#24445d");
    const layer = this.add.container(0, 0).setDepth(5);
    types.forEach((game, index) => {
      const col = index % 4, row = Math.floor(index / 4);
      const x = 122 + col * 239, y = 153 + row * 65;
      const count = completed.filter((id) => id.startsWith(game.id + "-")).length;
      const label = game.icon + "  " + game.name + (count ? "  ⭐" + count : "");
      button(this, layer, x, y, 220, 56, label, () => this.scene.start("MeadowThemeScene", { typeId: game.id }), typeColour(game), 18);
    });
    button(this, layer, 315, 501, 280, 36, "🎨 Classic 120-picture studio", () => { window.location.href = "../meadow/index.html"; }, 0xffe9c9, 15);
    button(this, layer, 620, 501, 210, 36, settings.sound === false ? "🔇 Sound off" : "🔊 Sound on", ({ title }) => {
      settings.sound = settings.sound === false;
      try { localStorage.setItem("dm-settings", JSON.stringify(settings)); } catch {}
      title.setText(settings.sound ? "🔊 Sound on" : "🔇 Sound off");
    }, 0xe6f2f4, 15);
  }
}

class MeadowThemeScene extends Phaser.Scene {
  constructor() { super("MeadowThemeScene"); }
  init(data) { this.typeId = data.typeId; }
  create() {
    meadowBackdrop(this);
    this.type = types.find((item) => item.id === this.typeId) || types[0];
    text(this, W / 2, 35, this.type.icon + "  " + this.type.name, 32, "#174e48");
    text(this, W / 2, 78, this.type.hint + " · Pick a world", 18, "#356a64");
    const layer = this.add.container(0, 0).setDepth(5);
    themes.forEach((theme, level) => {
      const visited = completed.includes(this.typeId + "-" + level);
      const x = 112 + level * 184;
      const card = this.add.container(x, 282);
      const bg = this.add.rectangle(0, 0, 164, 250, typeColour(this.type), 0.96).setStrokeStyle(3, 0xffffff).setInteractive({ useHandCursor: true });
      const icon = this.add.text(0, -62, ["🌼", "🍓", "🌈", "🌟", "🌺"][level], { fontSize: "44px" }).setOrigin(0.5);
      const name = text(this, 0, 3, theme, 17, "#274956");
      const hint = text(this, 0, 48, visited ? "⭐ Visited" : "Tap to play", 14, "#52736d");
      card.add([bg, icon, name, hint]); layer.add(card);
      bg.on("pointerover", () => { if (motionOK) this.tweens.add({ targets: card, y: 270, duration: 100 }); });
      bg.on("pointerout", () => this.tweens.add({ targets: card, y: 282, duration: 120 }));
      bg.on("pointerdown", () => { sfx("tap"); this.scene.start("MeadowGameScene", { typeId: this.typeId, level }); });
    });
    button(this, layer, 150, 492, 190, 42, "← All games", () => this.scene.start("MeadowMenuScene"), 0xf5f6e7, 17);
    const fav = favourites.includes(this.typeId + "-0");
    button(this, layer, 380, 492, 230, 42, fav ? "❤️ Favourite" : "🤍 Save favourite", () => {
      const id = this.typeId + "-0";
      favourites = fav ? favourites.filter((value) => value !== id) : [...new Set([...favourites, id])];
      saveProgress();
      this.scene.restart({ typeId: this.typeId });
    }, 0xffe9ed, 16);
    button(this, layer, 690, 492, 190, 42, "🔊 Listen", () => sfx("good"), 0xe6f2f4, 17);
  }
}

class MeadowGameScene extends Phaser.Scene {
  constructor() { super("MeadowGameScene"); }
  init(data) {
    this.typeId = data.typeId;
    this.level = Math.max(0, Math.min(4, Number(data.level) || 0));
    this.round = 0;
    this.busy = false;
    this.firstCard = null;
    this.paintColor = colours[0][1];
  }
  create() {
    meadowBackdrop(this);
    this.type = types.find((item) => item.id === this.typeId) || types[0];
    this.header = text(this, W / 2, 30, this.type.icon + "  " + this.type.name, 28, "#174e48");
    this.progress = text(this, W - 24, 27, "1 / " + ROUNDS, 16, "#356a64", 1);
    this.prompt = text(this, W / 2, 84, "", 22, "#24445d");
    this.feedback = text(this, W / 2, 477, "", 18, "#356a64");
    this.roundLayer = this.add.container(0, 0).setDepth(8);
    this.drawGraphic = this.add.graphics().setDepth(10);
    this.drawingEnabled = false;
    this.drawLast = null;
    this.tracePoints = null;
    this.traceDots = null;
    this.traceNext = 0;
    this.traceDots = null;
    this.input.on("pointerdown", (pointer) => {
      if (!this.drawingEnabled || pointer.y < 210 || pointer.y > 446) return;
      this.drawLast = { x: pointer.x, y: pointer.y };
    });
    this.input.on("pointermove", (pointer) => {
      if (!this.drawingEnabled || !pointer.isDown || !this.drawLast) return;
      this.drawGraphic.lineStyle(9, Phaser.Display.Color.HexStringToColor(this.paintColor).color, 0.96);
      this.drawGraphic.lineBetween(this.drawLast.x, this.drawLast.y, pointer.x, pointer.y);
      this.drawLast = { x: pointer.x, y: pointer.y };
    });
    this.input.on("pointerup", () => { this.drawLast = null; });
    this.input.on("pointerdown", (pointer) => {
      if (!this.tracePoints) return;
      const point = this.tracePoints[this.traceNext];
      if (!point || Phaser.Math.Distance.Between(pointer.x, pointer.y, point.x, point.y) > 36) return;
      this.traceDots[this.traceNext].setFillStyle(0x188b72, 1);
      this.traceNext++;
      sfx("tap");
      if (this.traceNext === this.tracePoints.length) { this.tracePoints = null; this.winRound(); }
    });
    this.events.once("shutdown", () => { this.drawingEnabled = false; this.input.removeAllListeners(); });
    const controls = this.add.container(0, 0).setDepth(50);
    button(this, controls, 75, 30, 118, 38, "← Meadow", () => this.scene.start("MeadowMenuScene"), 0xf5f6e7, 16);
    button(this, controls, 104, 493, 154, 36, "↻ Try again", () => this.scene.restart({ typeId: this.typeId, level: this.level }), 0xf5f6e7, 15);
    this.renderRound();
    this.input.keyboard?.on("keydown-ESC", () => this.scene.start("MeadowMenuScene"));
  }
  setPrompt(value) { this.prompt.setText(value); }
  addLabel(x, y, value, size = 30, color = "#24445d") {
    return this.roundLayer.add(text(this, x, y, value, size, color));
  }
  addButton(x, y, width, height, label, callback, color = 0xfffbec, fontSize = 21) {
    return button(this, this.roundLayer, x, y, width, height, label, callback, color, fontSize);
  }
  choice(prompt, target, options, correct, labels = null, onCorrect = null) {
    this.setPrompt(prompt);
    this.addLabel(W / 2, 220, target, 46, "#285d57");
    const spacing = 224, start = W / 2 - ((options.length - 1) * spacing) / 2;
    options.forEach((option, index) => this.addButton(start + index * spacing, 370, 194, 90, labels ? labels[index] : option, () => {
      if (option === correct) (onCorrect || (() => this.winRound()))();
      else this.wrong();
    }, 0xfffbec, 23));
  }
  wrong() {
    if (this.busy) return;
    this.feedback.setText("A lovely try. Have another look!");
    sfx("bad");
    if (motionOK) this.cameras.main.shake(100, 0.002);
    this.time.delayedCall(700, () => this.feedback.setText(""));
  }
  winRound() {
    if (this.busy) return;
    this.busy = true;
    this.feedback.setText("Lovely! ⭐");
    sfx("good");
    if (window.DUKit?.burst) window.DUKit.burst(this, W / 2, 280, { tint: 0xffdc64, n: 18, life: 650 });
    if (window.DUKit?.sfx) window.DUKit.sfx("sparkle");
    this.time.delayedCall(720, () => {
      this.round += 1;
      this.busy = false;
      if (this.round >= ROUNDS) this.finish();
      else this.renderRound();
    });
  }
  finish() {
    const id = this.typeId + "-" + this.level;
    if (!completed.includes(id)) completed = [...completed, id];
    saveProgress();
    this.roundLayer.removeAll(true);
    this.drawGraphic.clear();
    this.drawingEnabled = false;
    this.tracePoints = null;
    this.traceDots = null;
    this.traceNext = 0;
    this.prompt.setText("A new meadow discovery!");
    this.feedback.setText("You did it! Your dinosaur friend is very happy.");
    this.progress.setText("⭐⭐⭐⭐⭐");
    const layer = this.add.container(0, 0).setDepth(30);
    const medal = this.add.circle(W / 2, 278, 76, 0xffd768).setStrokeStyle(5, 0xffffff);
    layer.add(medal);
    layer.add(text(this, W / 2, 278, "🌟", 62));
    this.addButton(W / 2 - 150, 400, 230, 60, "▶ Play again", () => this.scene.restart({ typeId: this.typeId, level: this.level }), 0xd9f2df, 20);
    this.addButton(W / 2 + 150, 400, 230, 60, "🏡 All games", () => this.scene.start("MeadowMenuScene"), 0xffe8c7, 20);
    if (window.DUKit?.celebrate) window.DUKit.celebrate();
  }
  renderRound() {
    this.roundLayer.removeAll(true);
    this.drawGraphic.clear();
    this.drawingEnabled = false;
    this.tracePoints = null;
    this.traceDots = null;
    this.traceNext = 0;
    this.feedback.setText("");
    this.progress.setText((this.round + 1) + " / " + ROUNDS);
    const n = this.level + this.round;
    const target = tokens[n % tokens.length];
    const distractors = shuffle(tokens.filter((item) => item !== target)).slice(0, settings.easy === false ? 3 : 2);
    const type = this.typeId;
    if (type === "match") return this.choice("Find the matching picture.", target, shuffle([target, ...distractors]), target);
    if (type === "count") {
      const count = 1 + n % (settings.easy === false ? 7 : 5);
      return this.choice("How many eggs can you see?", "🥚 ".repeat(count), shuffle([count, count + 1, Math.max(1, count - 1)]).map(String), String(count));
    }
    if (type === "colours") {
      const palette = colours.slice(0, 8), colour = palette[n % palette.length];
      const options = shuffle([colour, ...palette.filter((item) => item !== colour).slice(0, 2)]);
      return this.choice("Find " + colour[0].toLowerCase() + ".", "●", options, colour, options.map((item) => item[0]),
        () => { this.addLabel(W / 2, 220, colour[0] + "!", 34, colour[1]); this.winRound(); });
    }
    if (type === "shapes") {
      const shapes = [{ n: "circle", e: "●" }, { n: "triangle", e: "▲" }, { n: "square", e: "■" }, { n: "star", e: "★" }, { n: "heart", e: "♥" }];
      const shape = shapes[n % shapes.length];
      const options = shuffle([shape, ...shapes.filter((item) => item !== shape).slice(0, 2)]);
      return this.choice("Find the " + shape.n + ".", shape.e, options, shape, options.map((item) => item.e), () => this.winRound());
    }
    if (type === "size") {
      const sizes = shuffle([{ label: "Small", size: 35 }, { label: "Medium", size: 55 }, { label: "Big", size: 78 }]);
      const big = n % 2 === 0, correct = big ? "Big" : "Small";
      this.setPrompt("Tap the " + (big ? "biggest" : "smallest") + " dinosaur.");
      this.addLabel(W / 2, 210, "🦕", 56, "#285d57");
      sizes.forEach((item, index) => {
        const x = 190 + index * 290;
        this.addButton(x, 370, 230, 110, item.label === correct ? "🦕" : "🦕", () => item.label === correct ? this.winRound() : this.wrong(), 0xfffbec, item.size);
        this.addLabel(x, 438, item.label, 17);
      });
      return;
    }
    if (type === "pattern") {
      const other = tokens[(n + 1) % tokens.length];
      const pattern = this.level < 3 ? [target, other, target, other] : [target, target, other, target, target];
      return this.choice("What comes next?", pattern.join("  ") + "  ❔", shuffle([target, other, tokens[(n + 2) % tokens.length]]), this.level < 3 ? target : other);
    }
    if (type === "sort") {
      const left = tokens[n % tokens.length], right = tokens[(n + 3) % tokens.length], items = shuffle([left, right, left, right]);
      let step = 0;
      const update = () => {
        this.roundLayer.removeAll(true);
        this.setPrompt("Which basket is for " + items[step] + "?");
        this.addLabel(W / 2, 226, items[step], 52);
        this.addButton(335, 376, 210, 92, "🧺  " + left, () => pick(left), 0xe6f2f4, 23);
        this.addButton(625, 376, 210, 92, "🧺  " + right, () => pick(right), 0xf7e8c7, 23);
      };
      const pick = (value) => { if (value !== items[step]) return this.wrong(); step++; if (step === items.length) return this.winRound(); update(); };
      update(); return;
    }
    if (type === "order") {
      let next = 1;
      const nums = shuffle(Array.from({ length: settings.easy === false ? 6 : 4 }, (_v, i) => i + 1));
      this.setPrompt("Follow the numbers. Start with one.");
      this.addLabel(W / 2, 220, "Tap " + next, 30);
      nums.forEach((value, index) => {
        const item = this.addButton(245 + (index % 4) * 160, 340 + Math.floor(index / 4) * 92, 125, 72, String(value), ({ bg, title }) => {
          if (value !== next) return this.wrong();
          bg.setFillStyle(0xb8e4c5); title.setText("✓");
          bg.disableInteractive(); next++; this.addLabel(W / 2, 220, next > nums.length ? "Lovely!" : "Now tap " + next, 26);
          sfx("good"); if (next > nums.length) this.winRound();
        }, 0xfffbec, 28);
      });
      return;
    }
    if (type === "memory") {
      const faces = shuffle([...tokens.slice(n % 5, n % 5 + 3), ...tokens.slice(n % 5, n % 5 + 3)]);
      let found = 0, first = null, locked = false;
      this.setPrompt("Open the eggs. Find three pairs.");
      this.addLabel(W / 2, 177, "🥚  " + found + " / 3", 24);
      faces.forEach((face, index) => {
        const x = 310 + (index % 3) * 170, y = 270 + Math.floor(index / 3) * 108;
        const card = this.addButton(x, y, 142, 86, "🥚", () => {
          if (locked || card.matched || card.faceUp) return;
          card.faceUp = true; card.title.setText(face); card.bg.setFillStyle(0xfff9ed);
          if (first === null) { first = card; return; }
          if (first.face === face) {
            first.matched = card.matched = true; found++; first = null; sfx("good");
            if (found === 3) this.winRound();
          } else {
            locked = true; const prior = first; first = null;
            this.time.delayedCall(650, () => { prior.faceUp = card.faceUp = false; prior.title.setText("🥚"); card.title.setText("🥚"); locked = false; });
          }
        }, 0xfff1c9, 32);
        card.face = face; card.faceUp = false; card.matched = false;
      });
      return;
    }
    if (type === "maze") {
      const path = mazeFor(n), start = path[0], goal = 15, cells = [];
      let position = start;
      this.setPrompt("Tap each stepping stone to reach the nest.");
      this.addLabel(W / 2, 168, "🦕  →  🥚", 28);
      for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4), col = i % 4, x = 360 + col * 80, y = 260 + row * 54;
        const open = path.includes(i);
        const cell = this.addButton(x, y, 65, 42, i === start ? "🦕" : i === goal ? "🥚" : open ? "·" : "🌿", () => {
          const adjacent = Math.abs(i % 4 - position % 4) + Math.abs(Math.floor(i / 4) - Math.floor(position / 4)) === 1;
          if (!adjacent || !open) return this.wrong();
          const prior = cells[position]; if (prior) { prior.title.setText("·"); prior.bg.setFillStyle(0xc9ebcf); }
          position = i; cell.title.setText(i === goal ? "🥚" : "🦕"); cell.bg.setFillStyle(0xb8e4c5); sfx("tap");
          if (i === goal) this.winRound();
        }, open ? 0xf4f6df : 0xd8e8cb, 21);
        if (open) cells[i] = cell;
      }
      return;
    }
    if (type === "dig") {
      let brushed = 0;
      this.setPrompt("Brush away the soft soil to find the fossil.");
      this.addLabel(W / 2, 206, "🦴", 52);
      for (let i = 0; i < 12; i++) {
        const x = 300 + (i % 4) * 120, y = 300 + Math.floor(i / 4) * 60;
        const dirt = this.addButton(x, y, 96, 47, "🟫", ({ bg, title }) => {
          if (title.text === "✨") return;
          title.setText("✨"); bg.setFillStyle(0xf5dfbd); brushed++; sfx("scrape");
          if (brushed >= 8) { this.addLabel(W / 2, 216, "You found it! 🦴", 27); this.winRound(); }
        }, 0xe6c398, 22);
      }
      return;
    }
    if (type === "bubbles") {
      const wanted = ["🔵", "🟡", "🟣", "🟢"][n % 4];
      const bubbles = shuffle([wanted, wanted, "🔴", "🟠", "⚪", "🟣"]);
      this.choice("Pop the " + wanted + " bubbles!", "🫧", bubbles, wanted);
      return;
    }
    if (type === "feed") {
      const foods = ["🍓", "🍎", "🥕", "🍃", "🍌"];
      const wanted = foods[n % foods.length];
      this.choice("Your dinosaur is hungry. Pick " + wanted + "!", "🦕  😋", shuffle([wanted, ...foods.filter((item) => item !== wanted).slice(0, 2)]), wanted);
      return;
    }
    if (type === "wash") {
      let remaining = 5;
      this.setPrompt("Tap each muddy spot to wash your dinosaur.");
      this.addLabel(W / 2, 214, "🦕", 62);
      for (let i = 0; i < 5; i++) {
        const spot = this.addButton(300 + i * 90, 330 + (i % 2) * 30, 74, 60, "🟤", ({ bg, title }) => {
          if (title.text === "💧") return;
          title.setText("💧"); bg.setFillStyle(0xd4eff8); remaining--; sfx("splash");
          if (!remaining) this.winRound();
        }, 0xf3e3cc, 26);
      }
      return;
    }
    if (type === "cook") {
      const recipes = [["🍞", "🥬", "🧀"], ["🍌", "🍓", "🫐"], ["🍅", "🧀", "🌿"], ["🥛", "🍓", "🍌"], ["🍎", "🍐", "🍇"]];
      const recipe = recipes[this.level], meal = [];
      let step = 0;
      this.setPrompt("Let’s make a snack. Add " + recipe[step] + ".");
      const update = () => {
        const options = shuffle([...new Set(recipe)]);
        this.addLabel(W / 2, 226, meal.length ? meal.join("  ") + "  🍽️" : "🍽️", 38);
        options.forEach((item, index) => this.addButton(270 + index * 210, 332, 172, 70, item, () => {
          if (item !== recipe[step]) return this.wrong();
          meal.push(item); step++;
          if (step >= recipe.length) return this.winRound();
          this.setPrompt("Now add " + recipe[step] + ".");
          this.roundLayer.removeAll(true); this.addLabel(W / 2, 226, meal.join("  ") + "  🍽️", 31); update();
        }, 0xfffbec, 27));
      };
      update(); return;
    }
    if (type === "dress") {
      let hat = "", present = "";
      this.setPrompt("Choose a hat and a little present for your friend.");
      this.addLabel(W / 2, 216, "🦕", 72);
      this.addLabel(W / 2, 285, "Pick a hat", 17);
      ["👑", "👒", "🎩", "🎀"].forEach((item, index) => this.addButton(290 + index * 120, 326, 96, 54, item, () => { hat = item; this.addLabel(W / 2, 244, item + "  🦕", 38); }, 0xf8e4ee, 24));
      this.addLabel(W / 2, 390, "Pick a present", 17);
      ["🌼", "🎈", "🧸", "🎁"].forEach((item, index) => this.addButton(290 + index * 120, 426, 96, 54, item, () => { present = item; sfx("good"); }, 0xffe9cc, 24));
      this.addButton(W - 150, 493, 190, 36, "All dressed ✓", () => hat && present ? this.winRound() : this.wrong(), 0xd9f2df, 16);
      return;
    }
    if (type === "music") {
      const notes = ["🔴", "🟠", "🟡", "🟢", "🔵"];
      const tunes = [[0, 1, 2], [2, 1, 0], [0, 2, 0], [1, 3, 2], [0, 2, 4]];
      const tune = tunes[n % tunes.length]; let step = 0;
      this.setPrompt("Listen, then play the little tune.");
      this.addLabel(W / 2, 218, tune.map((value) => notes[value]).join("  "), 38);
      notes.forEach((note, index) => this.addButton(225 + index * 128, 365, 100, 86, note, () => {
        sfx(["tap", "good", "sparkle", "pop", "chirp"][index]);
        if (index !== tune[step]) { this.wrong(); step = 0; return; }
        step++;
        if (step >= tune.length) this.winRound();
        else this.feedback.setText("Lovely. " + step + " / " + tune.length);
      }, Phaser.Display.Color.HexStringToColor(colours[index][1]).color, 30));
      return;
    }
    if (type === "colouring") return this.colouringRound();
    if (type === "draw") return this.drawRound();
    if (type === "trace") return this.traceRound();
    this.choice("Find the matching picture.", target, shuffle([target, ...distractors]), target);
  }
  colouringRound() {
    this.setPrompt("Pick a paint colour, then tap your dinosaur to colour it.");
    this.addLabel(480, 239, "🦕", 92);
    const pieces = [
      this.addButton(398, 299, 116, 45, "Tail", () => paint(pieces[0]), 0xfff8ea, 14),
      this.addButton(508, 295, 116, 45, "Body", () => paint(pieces[1]), 0xfff8ea, 14),
      this.addButton(614, 250, 116, 45, "Head", () => paint(pieces[2]), 0xfff8ea, 14),
      this.addButton(486, 344, 116, 45, "Feet", () => paint(pieces[3]), 0xfff8ea, 14),
    ];
    let painted = new Set();
    const paint = (part) => {
      if (!this.paintColor) return;
      part.bg.setFillStyle(Phaser.Display.Color.HexStringToColor(this.paintColor).color);
      part.title.setColor("#21484e"); painted.add(part);
      if (painted.size === pieces.length) this.winRound();
    };
    colours.slice(0, 8).forEach((entry, index) => {
      this.addButton(255 + index * 64, 431, 48, 42, "", () => { this.paintColor = entry[1]; this.feedback.setText(entry[0]); }, Phaser.Display.Color.HexStringToColor(entry[1]).color, 12);
    });
    this.addLabel(W / 2, 173, "Picture " + (this.level * 24 + this.round * 4 + 1) + " · " + themes[this.level], 18);
  }
  drawRound() {
    this.setPrompt("Draw a little picture with your finger.");
    this.addLabel(W / 2, 196, "Draw here", 18);
    const area = this.add.rectangle(W / 2, 326, 650, 244, 0xffffff, 0.72).setStrokeStyle(3, 0xffffff);
    this.roundLayer.add(area);
    this.drawingEnabled = true;
    this.drawGraphic.clear();
    colours.slice(0, 8).forEach((entry, index) => this.addButton(256 + index * 64, 461, 48, 40, "", () => { this.paintColor = entry[1]; }, Phaser.Display.Color.HexStringToColor(entry[1]).color, 12));
    this.addButton(W - 150, 493, 190, 36, "Done drawing ✓", () => this.winRound(), 0xd9f2df, 15);
  }
  traceRound() {
    this.setPrompt("Follow the dotted trail with your finger.");
    const points = Array.from({ length: 13 }, (_value, index) => ({ x: 160 + index * 54, y: 325 + Math.sin(index * 0.48 + this.level) * 92, done: false }));
    const guide = this.add.graphics();
    this.roundLayer.add(guide);
    guide.lineStyle(5, 0x9bb9b2, 0.8);
    guide.beginPath();
    points.forEach((point, index) => index ? guide.lineTo(point.x, point.y) : guide.moveTo(point.x, point.y));
    guide.strokePath();
    const dots = points.map((point) => {
      const dot = this.add.circle(point.x, point.y, 9, 0xffd45c).setStrokeStyle(2, 0xffffff);
      this.roundLayer.add(dot); return dot;
    });
    this.tracePoints = points;
    this.traceDots = dots;
    this.traceNext = 0;
    this.drawingEnabled = false;
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game-root",
  backgroundColor: "#8fd3ff",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MeadowMenuScene, MeadowThemeScene, MeadowGameScene]
});
