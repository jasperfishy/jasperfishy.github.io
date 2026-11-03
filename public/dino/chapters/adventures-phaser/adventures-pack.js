(function () {
  "use strict";
  const W = 960, H = 540, SAVE_KEY = "dinosaur-universe-player-v1", COLOR_KEY = "du-adventures-coloring-v1";
  const activities = [
    ["rescue", "Great Dino Rescue", "🏇", 0xffe6bf], ["builder", "Build a Dinosaur", "🦖", 0xe2f0d9],
    ["jigsaw", "Dino Picture Jigsaw", "🧩", 0xe7e0f4], ["fossil", "Fossil Explorer", "🦴", 0xf2dfc2],
    ["memory", "Memory Eggs", "🥚", 0xf2e3eb], ["picnic", "Dino Picnic", "🍓", 0xf8e3d2],
    ["hatchling", "Hatchling Nursery", "🐣", 0xf5e2b9], ["trail", "Footprint Trail", "👣", 0xe1edf5],
    ["shapes", "Shape Safari", "🔎", 0xe0eee2], ["beat", "Dino Beat Parade", "🥁", 0xe9e0f4],
    ["habitat", "Habitat Builder", "🌱", 0xdff0df], ["storybook", "Dino Storybook", "📖", 0xeee5f4],
    ["discoveries", "Prehistoric Discoveries", "🔬", 0xeee8d8], ["care", "Dino Care Clinic", "🧺", 0xf2e5da],
    ["mummy", "Mummy’s Cozy Corner", "🌿", 0xe4f0df], ["moonbeam", "Moonbeam Rescue", "🌙", 0xe9e5f5],
    ["parade", "Dress-up Parade", "🎉", 0xf8e5c9], ["constellations", "Dino Constellations", "🌌", 0xe5e8f6],
    ["skymail", "Prehistoric Sky Mail", "📮", 0xdceef5], ["weather", "Weather Workshop", "🌦️", 0xe2f0ec],
    ["coloring", "Coloring Studio", "🎨", 0xf7e1d7], ["quest", "Dino Quest: Lost Egg", "⛰️", 0xdcebd2],
    ["daddy", "Naughty Daddy", "🏃", 0xf5e4cb]
  ].map(([id, title, icon, color]) => ({ id, title, icon, color }));
  const colors = [{ n: "Coral", c: 0xef795f }, { n: "Sunshine", c: 0xf7c84b }, { n: "Leaf green", c: 0x62b67c }, { n: "Sky blue", c: 0x56a9dc }, { n: "Violet", c: 0xa78ad3 }, { n: "Berry", c: 0xe785aa }];
  const playerState = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") || {}; } catch { return {}; } };
  function recordWin(id) {
    try {
      const state = playerState();
      state.completed = Array.isArray(state.completed) ? state.completed : [];
      state.levels = state.levels && typeof state.levels === "object" ? state.levels : {};
      if (!state.completed.includes(id)) state.completed.push(id);
      state.levels[id] = (Number(state.levels[id]) || 0) + 1;
      state.stars = (Number(state.stars) || 0) + 1;
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch { /* Play still works when storage is unavailable. */ }
  }
  function label(scene, x, y, value, size = 22, color = "#24445d", origin = 0.5) {
    return scene.add.text(x, y, String(value), { fontFamily: "system-ui, Segoe UI, sans-serif", fontSize: size + "px", fontStyle: "700", color, align: "center", wordWrap: { width: 850 } }).setOrigin(origin);
  }
  function cardButton(scene, layer, x, y, width, height, value, callback, color = 0xfffbef, size = 20) {
    const box = scene.add.rectangle(x, y, width, height, color, 0.96).setStrokeStyle(2, 0xffffff, 0.96).setInteractive({ useHandCursor: true });
    const title = label(scene, x, y, value, size, "#294b57");
    layer.add([box, title]);
    box.on("pointerover", () => { if (window.AdventuresPack.motionOK) scene.tweens.add({ targets: [box, title], scale: 1.04, duration: 100 }); });
    box.on("pointerout", () => scene.tweens.add({ targets: [box, title], scale: 1, duration: 100 }));
    box.on("pointerdown", () => { window.DUKit?.sfx("tap"); callback({ box, title }); });
    return { box, title };
  }
  function backdrop(scene, night = false) {
    if (window.DUKit?.textures) window.DUKit.textures(scene);
    const sky = scene.add.graphics().setDepth(-20);
    sky.fillGradientStyle(night ? 0x152b55 : 0x79d1f2, night ? 0x385a91 : 0x79d1f2, night ? 0x544879 : 0xe9f4d8, night ? 0x544879 : 0xe9f4d8, 1);
    sky.fillRect(0, 0, W, H);
    if (!night && window.DUKit?.sunRays) window.DUKit.sunRays(scene, 820, 82, 175, 0xffe58e);
    scene.add.circle(820, 82, 39, night ? 0xf4f0c8 : 0xffdc73).setDepth(-16);
    const g = scene.make.graphics({ add: false });
    if (!scene.textures.exists("adv-far-trees")) {
      g.fillStyle(night ? 0x566894 : 0x74b99a, 1); g.fillCircle(45, 88, 42); g.fillCircle(112, 62, 60); g.fillCircle(185, 92, 38); g.generateTexture("adv-far-trees", 230, 140);
    }
    if (!scene.textures.exists("adv-near-hills")) {
      g.clear(); g.fillStyle(night ? 0x405e78 : 0x62b978, 1); g.fillEllipse(72, 90, 180, 80); g.fillEllipse(170, 87, 170, 88); g.generateTexture("adv-near-hills", 240, 120);
    }
    g.destroy();
    const far = scene.add.tileSprite(W / 2, 330, W, 150, "adv-far-trees").setAlpha(0.8).setDepth(-12);
    const near = scene.add.tileSprite(W / 2, 460, W, 130, "adv-near-hills").setDepth(-10);
    for (let i = 0; i < 5; i++) {
      const cloud = scene.add.text(-80, 112 + i % 2 * 45, night ? "✨" : "☁️", { fontSize: "38px" }).setDepth(-14).setAlpha(0.55);
      if (window.AdventuresPack.motionOK) scene.tweens.add({ targets: cloud, x: W + 90, duration: 27000 + i * 3000, delay: -i * 4000, repeat: -1 });
    }
    if (window.DUKit?.sparkleField) window.DUKit.sparkleField(scene, 18, 25, 28, 935, 362, night ? 0xffedb0 : 0xffffff);
    scene.events.on("update", (_time, delta) => {
      if (!window.AdventuresPack.motionOK) return;
      far.tilePositionX += delta * 0.0035; near.tilePositionX += delta * 0.012;
    });
  }
  function shuffle(items) { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Phaser.Math.Between(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function noteFor(index) { window.DUKit?.sfx("note", 3 + index * 2, 0.35); }

  class AdventureMenuScene extends Phaser.Scene {
    constructor() { super("adventure-menu"); }
    create() {
      backdrop(this);
      const saved = playerState();
      label(this, W / 2, 28, "Dino Adventures", 34, "#174e48");
      label(this, W / 2, 63, "23 Phaser adventures · " + (saved.completed?.length || 0) + " discovered · " + (Number(saved.stars) || 0) + " happy stars", 16, "#356a64");
      const layer = this.add.container(0, 0).setDepth(5);
      activities.forEach((activity, index) => {
        const col = index % 4, row = Math.floor(index / 4), x = 122 + col * 239, y = 119 + row * 63;
        const done = (saved.completed || []).includes(activity.id);
        cardButton(this, layer, x, y, 220, 54, activity.icon + "  " + activity.title + (done ? "  ⭐" : ""), () => this.scene.start("adventure-activity", { id: activity.id }), activity.color, 15);
      });
      cardButton(this, layer, 839, 434, 220, 54, "🎈  Balloon Flight", () => this.scene.start("flight"), 0xcde8ff, 16);
      cardButton(this, layer, 340, 505, 300, 38, "📚  Classic full adventures", () => { window.location.href = "../adventures/index.html"; }, 0xffe6ca, 15);
      cardButton(this, layer, 675, 505, 240, 38, "🌳  Back to Dinosaur Universe", () => { window.location.href = "../../index.html"; }, 0xe3f2ea, 14);
    }
  }

  class AdventureActivityScene extends Phaser.Scene {
    constructor() { super("adventure-activity"); }
    init(data) { this.id = data.id; this.step = 0; this.busy = false; this.picked = new Set(); this.memory = { matched: new Set(), first: null }; this.story = []; this.painted = {}; this.colorChoice = colors[0]; }
    create() {
      const night = this.id === "moonbeam" || this.id === "constellations";
      backdrop(this, night);
      this.activity = activities.find((item) => item.id === this.id) || activities[0];
      const saved = playerState();
      const level = Number(saved.levels?.[this.id]) || 0;
      this.back = cardButton(this, this.add.container(0, 0).setDepth(30), 74, 31, 124, 38, "← All games", () => this.scene.start("adventure-menu"), 0xf7f5e8, 15);
      label(this, W / 2, 29, this.activity.icon + "  " + this.activity.title, 28, night ? "#f7f1d3" : "#174e48");
      this.levelText = label(this, W / 2, 61, "Adventure level " + (level + 1) + "  ·  " + (Number(saved.stars) || 0) + " stars collected ⭐", 15, night ? "#f8ecbf" : "#356a64");
      this.prompt = label(this, W / 2, 96, "", 21, night ? "#fff7d6" : "#24445d");
      this.status = label(this, W / 2, 480, "", 17, night ? "#fff3c0" : "#356a64");
      this.board = this.add.container(0, 0).setDepth(8);
      this.total = ({ builder: 6, jigsaw: 5, fossil: 8, memory: 3, picnic: 3, hatchling: 5, trail: 5, shapes: 3, beat: 6, habitat: 3, storybook: 3, discoveries: 3, care: 3, mummy: 3, moonbeam: 5, parade: 3, constellations: 5, skymail: 3, weather: 3, coloring: 3, quest: 3, rescue: 3, daddy: 3 })[this.id] || 3;
      this.progress = label(this, W - 22, 29, "1 / " + this.total, 15, night ? "#fff3c0" : "#356a64", 1);
      this.render();
      this.input.keyboard?.on("keydown-ESC", () => this.scene.start("adventure-menu"));
      this.events.once("shutdown", () => { window.DUKit?.removeCanvasButton(this, "dukit-activity-again"); });
    }
    say(value) { this.prompt.setText(value); }
    mark() { this.progress.setText(Math.min(this.step + 1, this.total) + " / " + this.total); }
    addText(x, y, value, size = 36, color) { return this.board.add(label(this, x, y, value, size, color || (this.id === "moonbeam" || this.id === "constellations" ? "#fff5cf" : "#285d57"))); }
    addButton(x, y, w, h, value, fn, color = 0xfffbef, size = 20) { return cardButton(this, this.board, x, y, w, h, value, fn, color, size); }
    options(items, correct, prompt, after = null) {
      this.say(prompt);
      this.addText(W / 2, 224, this.targetIcon || "🦕", 48);
      const shuffled = shuffle(items);
      shuffled.forEach((item, i) => this.addButton(260 + i * 220, 370, 190, 86, item.label, () => {
        if (after) return after(item);
        if (item.id === correct) this.advance("Lovely choice! ✨"); else this.wrong();
      }, item.color || 0xfffbef, 20));
    }
    wrong() { if (this.busy) return; this.status.setText("Good try! Have another look."); window.DUKit?.sfx("bad"); window.DUKit?.shake(this, 110, 0.002); this.time.delayedCall(700, () => this.status.setText("")); }
    advance(message) {
      if (this.busy) return;
      this.busy = true; this.status.setText(message || "Lovely! ⭐"); window.DUKit?.sfx("good"); window.DUKit?.burst(this, W / 2, 290, { tint: 0xffd765, n: 16, life: 620 });
      this.time.delayedCall(480, () => { this.step++; if (this.step >= this.total) this.finish(); else { this.busy = false; this.render(); } });
    }
    finish() {
      this.busy = true; recordWin(this.id); this.board.removeAll(true); this.progress.setText("⭐⭐⭐⭐⭐");
      this.say("You did it! A new discovery is yours."); this.status.setText("Your adventure is saved on this device.");
      this.board.add(this.add.circle(W / 2, 280, 70, 0xffd668).setStrokeStyle(5, 0xffffff));
      this.addText(W / 2, 280, "🌟", 56);
      if (window.DUKit?.burst) window.DUKit.burst(this, W / 2, 260, { tint: 0xffe369, n: 28, life: 950 });
      this.addButton(W / 2 - 155, 400, 230, 58, "▶ Play again", () => this.scene.restart({ id: this.id }), 0xd9f2df, 19);
      this.addButton(W / 2 + 155, 400, 230, 58, "🏡 All adventures", () => this.scene.start("adventure-menu"), 0xffe8c7, 19);
      window.DUKit?.canvasButton(this, "dukit-activity-again", "Play " + this.activity.title + " again", 74, 24, 9, () => this.scene.restart({ id: this.id }));
    }
    render() {
      this.board.removeAll(true); this.status.setText(""); this.mark();
      const s = this.step;
      const simpleChoices = (target, distractors, prompt, icon = target) => {
        this.targetIcon = icon;
        this.options([{ label: target, id: target }, ...distractors.map((label) => ({ label, id: label }))], target, prompt);
      };
      if (this.id === "builder") {
        const parts = ["🦴 Tail", "🦕 Body", "🙂 Friendly head", "🦶 Back feet", "🦶 Front feet", "🔺 Dino plates"];
        this.say("Tap each dinosaur part to build your new friend."); this.addText(W / 2, 211, "🦖", 78);
        parts.forEach((part, i) => this.addButton(300 + (i % 3) * 180, 320 + Math.floor(i / 3) * 82, 160, 66, this.picked.has(part) ? "✓ " + part : part, () => {
          if (this.picked.has(part)) return; this.picked.add(part); this.addText(W / 2, 432, this.picked.size + " of " + parts.length + " parts placed", 17); this.advance("A lovely part!");
        }, this.picked.has(part) ? 0xc4e9cc : 0xfff9ed, 16));
        return;
      }
      if (this.id === "jigsaw") {
        const picture = ["🥚", "🌿", "🦖", "🌈", "⭐"];
        this.say("Put the picture back together. Find the next piece."); this.addText(W / 2, 205, picture.join("  "), 42);
        const target = picture[s]; const choices = shuffle([target, picture[(s + 2) % 5], picture[(s + 3) % 5]]);
        choices.forEach((piece, i) => this.addButton(270 + i * 210, 360, 180, 100, piece, () => piece === target ? this.advance("Picture piece in the right place!") : this.wrong(), 0xf5efff, 36)); return;
      }
      if (this.id === "fossil") {
        this.say("Brush the soft soil away to uncover the dinosaur fossil."); this.addText(W / 2, 207, "🦴", 50);
        const found = this.picked.size;
        for (let i = 0; i < 8; i++) {
          const dug = this.picked.has(i), bone = [1, 3, 6].includes(i) && dug;
          this.addButton(344 + (i % 4) * 92, 300 + Math.floor(i / 4) * 74, 78, 60, dug ? (bone ? "🦴" : "✨") : "🟫", () => {
            if (dug) return; this.picked.add(i); this.advance([1, 3, 6].includes(i) ? "You found an ancient bone!" : "The earth is getting softer!");
          }, dug ? 0xf2dfc2 : 0xe3bd88, 27);
        }
        this.addText(W / 2, 448, this.picked.size + " of 8 patches brushed away", 16); return;
      }
      if (this.id === "memory") {
        this.say("Turn over the eggs and find three dinosaur pairs."); this.addText(W / 2, 190, this.memory.matched.size / 2 + " of 3 pairs found", 20);
        if (!this.memory.deck) this.memory.deck = shuffle(["🦕", "🦕", "🦖", "🦖", "🐊", "🐊"]);
        this.memory.deck.forEach((face, i) => {
          const matched = this.memory.matched.has(i), faceUp = this.memory.first === i;
          const cell = this.addButton(320 + (i % 3) * 160, 300 + Math.floor(i / 3) * 94, 134, 74, matched || faceUp ? face : "🥚", () => {
            if (matched || this.memory.second !== undefined) return;
            if (this.memory.first === undefined || this.memory.first === null) { this.memory.first = i; this.render(); return; }
            const first = this.memory.first; this.memory.second = i;
            if (this.memory.deck[first] === face) {
              this.memory.matched.add(first); this.memory.matched.add(i); this.memory.first = null; this.memory.second = undefined; this.advance("A matching pair!");
            } else {
              this.wrong(); this.time.delayedCall(650, () => { this.memory.first = null; this.memory.second = undefined; this.render(); });
            }
          }, matched ? 0xc6e9d0 : 0xfff0c4, 30);
        }); return;
      }
      if (this.id === "picnic") {
        const foods = [["🍓", "🥕", "🍌"], ["🍎", "🍃", "🧀"], ["🍌", "🍇", "🥬"]]; const food = foods[s][0];
        simpleChoices(food, foods[s].slice(1), "Your dinosaur friend is hungry. Pick " + food + "!", "🦕  😋"); return;
      }
      if (this.id === "hatchling") {
        if (s < 4) { this.say("Tap the egg gently to help your baby dinosaur hatch."); this.addText(W / 2, 242, s < 2 ? "🥚" : "🐣", 80); this.addButton(W / 2, 365, 220, 82, "Tap the egg gently", () => this.advance("A little crack appeared!"), 0xffefbd, 19); return; }
        this.say("Your hatchling is ready. Choose its first toy!"); this.addText(W / 2, 228, "🐣", 62); ["🧸", "🪇", "🧩"].forEach((toy, i) => this.addButton(300 + i * 180, 360, 150, 88, toy, () => this.advance("The hatchling loves its new toy!"), 0xfff2cf, 34)); return;
      }
      if (this.id === "trail" || this.id === "moonbeam") {
        const moon = this.id === "moonbeam"; this.say(moon ? "Follow the glowing star trail from one to five." : "Follow the footprints in number order.");
        this.addText(W / 2, 198, moon ? "🌙  →  🦕" : "Who left these tracks?", 30);
        const order = [1, 2, 3, 4, 5];
        shuffle([1, 2, 3, 4, 5]).forEach((number, i) => this.addButton(300 + (i % 5) * 90, 340 + Math.floor(i / 5) * 72, 74, 58, (moon ? "⭐ " : "👣 ") + number, () => {
          const expected = order[s]; if (number === expected) this.advance("Footprint " + number + " found!"); else this.wrong();
        }, moon ? 0x303d70 : 0xeaf1de, 26));
        this.addText(W / 2, 423, "Find number " + (s + 1), 18); return;
      }
      if (this.id === "shapes") {
        const shapes = [["●", "▲", "■"], ["▲", "★", "●"], ["■", "♥", "▲"]][s];
        simpleChoices(shapes[0], shapes.slice(1), "Find the " + ({ "●": "circle", "▲": "triangle", "■": "square" }[shapes[0]] || "shape") + ".", "🦖"); return;
      }
      if (this.id === "beat") {
        const seq = [0, 2, 1, 3, 2, 4], idx = s % 3, start = Math.floor(s / 3) * 3;
        this.say("Listen to the rhythm, then tap the next colour."); this.addText(W / 2, 225, seq.slice(start, start + 3).map(i => ["🔴", "🟠", "🟡", "🟢", "🔵"][i]).join("  "), 40);
        const target = seq[s]; ["🔴", "🟠", "🟡", "🟢", "🔵"].forEach((note, i) => this.addButton(190 + i * 145, 370, 110, 86, note, () => { noteFor(i); if (i === target) this.advance("Beautiful music!"); else { this.wrong(); this.step = start; this.mark(); } }, [0xffd6d6, 0xffe4c4, 0xfff3b7, 0xd4efd8, 0xd8edfa][i], 30)); return;
      }
      if (this.id === "habitat") {
        const needs = [["💧", "water", ["🪨", "🎈"]], ["🌿", "green plants", ["🧊", "🚗"]], ["🌳", "shade", ["🔥", "🪑"]]]; const [want, name, others] = needs[s];
        simpleChoices(want, others, "Add " + name + " to the dinosaur home.", "🏞️"); return;
      }
      if (this.id === "storybook") {
        const chapters = [["🦕", "🦖", "🐊"], ["🌋", "🌳", "🌙"], ["⭐", "🌈", "🎈"]]; const names = ["Choose a story friend.", "Choose a magical place.", "Choose a surprise."];
        this.say(names[s]); this.addText(W / 2, 220, this.story.join("  ") || "📖", 48);
        chapters[s].forEach((choice, i) => this.addButton(300 + i * 180, 360, 150, 90, choice, () => { this.story.push(choice); this.advance("A lovely story choice!"); }, 0xf3eafa, 34)); return;
      }
      if (this.id === "discoveries") {
        const q = [
          { p: "What did some plant-eating dinosaurs enjoy?", a: "🌿 Plants", b: ["🍕 Pizza", "🧁 Cupcakes"] },
          { p: "Which dinosaur could fly?", a: "🪽 Pteranodon", b: ["🦕 Brontosaurus", "🦖 T. rex"] },
          { p: "What can a fossil tell us about?", a: "🦴 The past", b: ["🚀 Space", "🌊 Tomorrow"] }
        ][s]; simpleChoices(q.a, q.b, q.p, "🔬"); return;
      }
      if (this.id === "care" || this.id === "mummy") {
        const tasks = this.id === "care" ? [["🪥", "brush gently", ["🪨", "🎈"]], ["🧼", "wash with bubbles", ["🔥", "📯"]], ["🩹", "cover the tiny scratch", ["🍭", "🪁"]]] : [["🛏️", "soft pillow", ["🪨", "🚲"]], ["🍵", "warm tea", ["🧊", "🏀"]], ["🌿", "a happy fern", ["🧹", "🛠️"]]];
        const [want, text, others] = tasks[s]; simpleChoices(want, others, (this.id === "care" ? "Help your dinosaur: " : "Help Mummy feel comfy: ") + text + ".", this.id === "care" ? "🦕" : "🦕 💚"); return;
      }
      if (this.id === "parade") {
        const looks = [["🦕", "🦖", "🐊"], ["👑", "🎀", "🎩"], ["🌼", "🌈", "🌟"]];
        this.say(["Choose a dinosaur for the parade.", "Pick a parade outfit.", "Choose a bright parade place."][s]); this.addText(W / 2, 224, this.story.join("  ") || "🎉", 46);
        looks[s].forEach((item, i) => this.addButton(300 + i * 180, 360, 150, 90, item, () => { this.story.push(item); this.advance("The parade is looking wonderful!"); }, 0xffefd1, 34)); return;
      }
      if (this.id === "constellations") {
        this.say("Connect the five stars in number order to draw a constellation.");
        const pts = [{ x: 300, y: 310 }, { x: 410, y: 250 }, { x: 520, y: 305 }, { x: 640, y: 245 }, { x: 720, y: 340 }];
        const graphics = this.add.graphics(); this.board.add(graphics); graphics.lineStyle(4, 0xffe875, 0.8); graphics.beginPath(); pts.slice(0, s + 1).forEach((p, i) => i ? graphics.lineTo(p.x, p.y) : graphics.moveTo(p.x, p.y)); graphics.strokePath();
        this.addText(W / 2, 190, "⭐  " + (s + 1) + " / 5", 24);
        pts.forEach((p, i) => this.addButton(p.x, p.y, 56, 56, i <= s ? "✨" : "⭐", () => i === s ? this.advance("A new star joined your picture!") : this.wrong(), 0x303d70, 22)); return;
      }
      if (this.id === "skymail") {
        const mail = [["🪽 Pteranodon", "📮 Feather card", ["🍎 Apple", "🧸 Toy"]], ["🦖 T. rex", "🥚 Egg postcard", ["🪁 Kite", "🌂 Umbrella"]], ["🦕 Brachiosaurus", "🌿 Leaf letter", ["🧀 Cheese", "🎈 Balloon"]]][s];
        simpleChoices(mail[1], mail[2], "Deliver the right mail to " + mail[0] + ".", "📮"); return;
      }
      if (this.id === "weather") {
        const weather = [["🌧️", "☂️ Umbrella", ["🕶️ Sunglasses", "🪁 Kite"]], ["☀️", "🧢 Sun hat", ["🧤 Mittens", "🪔 Lamp"]], ["❄️", "🧣 Warm scarf", ["🧴 Sunscreen", "🩱 Swimsuit"]]][s];
        simpleChoices(weather[1], weather[2], "It is " + weather[0] + ". What will help your dino friend?", weather[0]); return;
      }
      if (this.id === "coloring") {
        if (!this.paintSaved) { try { this.paintSaved = JSON.parse(localStorage.getItem(COLOR_KEY) || "{}"); } catch { this.paintSaved = {}; } }
        this.say("Pick a colour, then paint each part of your dinosaur."); this.addText(W / 2, 205, "🦕", 72);
        const parts = ["Tail", "Body", "Head"];
        parts.forEach((part, i) => {
          const c = this.paintSaved[part] || null;
          this.addButton(364 + i * 116, 302, 102, 56, (this.picked.has(part) ? "✓ " : "🎨 ") + part, () => {
            if (this.picked.has(part)) return;
            this.picked.add(part);
            this.paintSaved[part] = "#" + this.colorChoice.c.toString(16).padStart(6, "0");
            try { localStorage.setItem(COLOR_KEY, JSON.stringify(this.paintSaved)); } catch {}
            this.advance(part + " painted " + this.colorChoice.n + "!");
          }, c ? Phaser.Display.Color.HexStringToColor(c).color : 0xfff9ed, 16);
        });
        colors.forEach((color, i) => this.addButton(238 + i * 96, 402, 74, 46, color.n, () => { this.colorChoice = color; this.status.setText("Selected " + color.n); }, color.c, 13)); return;
      }
      if (this.id === "quest" || this.id === "rescue") {
        const steps = this.id === "quest" ? [
          ["Choose the safe path up Mount Roar.", "🌿 Fern trail", ["🔥 Lava rocks", "🪨 Steep cliff"]],
          ["Find a gentle way across the cave.", "💎 Light the lantern", ["🌑 Walk in the dark", "🪨 Push the wall"]],
          ["Help the lost egg get back home.", "🥚 Carry it carefully", ["🎈 Toss it", "🛷 Slide it"]]
        ] : [
          ["The forest path is blocked. Which way?", "🌳 Follow the fern trail", ["🔥 Go through fire", "🪨 Climb the cliff"]],
          ["The canyon needs a safe crossing.", "🌉 Use the sturdy bridge", ["🌋 Jump over lava", "🌊 Wade into the river"]],
          ["Mummy and Daddy are waiting. Bring help!", "🦕 Ride with your dino friends", ["🏃 Run alone", "🎈 Float away"]]
        ]; const [p, answer, others] = steps[s]; simpleChoices(answer, others, p, this.id === "quest" ? "⛰️" : "🏇"); return;
      }
      if (this.id === "daddy") {
        this.say("Daddy Ellis is being silly! Catch him three times."); this.addText(W / 2, 218, "🦖  🏃", 50);
        const x = [340, 620, 480][s]; this.addButton(x, 348, 200, 86, "Catch Daddy!", () => this.advance("Got you, Daddy! 😄"), 0xffe6c9, 20);
        if (window.AdventuresPack.motionOK) this.tweens.add({ targets: this.board.list[this.board.list.length - 1], angle: { from: -3, to: 3 }, duration: 260, yoyo: true, repeat: 3 }); return;
      }
      this.say("A new adventure is waiting!"); this.addButton(W / 2, 350, 210, 78, "✨ Start", () => this.advance(), 0xfff3c8, 22);
    }
  }
  window.AdventuresPack = { MenuScene: AdventureMenuScene, GameScene: AdventureActivityScene, motionOK: !window.matchMedia("(prefers-reduced-motion: reduce)").matches };
})();
