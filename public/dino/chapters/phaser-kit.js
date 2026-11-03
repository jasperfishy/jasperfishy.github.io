// Shared polish for the Phaser games: sound (via the hub's DUFX engine, so the hub's
// sound switch applies), animated title/end screens with star ratings, particles and
// sparkles, and hub progress hooks. Load after du-fx.js and Phaser.
(function () {
  "use strict";
  const Kit = (window.DUKit = {});
  const FX = () => window.DUFX;
  const EMBEDDED = window.self !== window.top;
  const motionOK = () => !(FX() && FX().settings && FX().settings.reduce);
  const calm = () => !!(FX() && FX().settings && FX().settings.calm);
  const FONT = "system-ui,'Segoe UI',sans-serif";

  Kit.FONT = FONT;
  Kit.motionOK = motionOK;
  Kit.sfx = (name, a, b) => { try { const f = FX(); if (f && f.sfx && f.sfx[name]) f.sfx[name](a, b); } catch (e) { /* sound is optional */ } };
  Kit.ready = () => { if (EMBEDDED) { try { window.parent.postMessage({ type: "du-ready" }, location.origin); } catch (e) { /* standalone */ } } };

  Kit.mergeJSON = (key, mutate) => {
    try {
      const raw = localStorage.getItem(key);
      const obj = raw ? JSON.parse(raw) : {};
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
      mutate(obj);
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) { /* progress is a bonus */ }
  };
  Kit.setKey = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ok */ } };
  Kit.getBest = (key) => { try { return Math.max(0, Number(JSON.parse(localStorage.getItem(key)).best) || 0); } catch (e) { return 0; } };
  Kit.rating = (score, t) => (score >= t[2] ? 3 : score >= t[1] ? 2 : score >= t[0] ? 1 : 0);

  // Textures every game can use: kit-dot, kit-star, kit-spark.
  Kit.textures = (scene) => {
    if (scene.textures.exists("kit-star")) return;
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8); g.generateTexture("kit-dot", 16, 16);
    g.clear();
    g.fillStyle(0xffd23f, 1); g.lineStyle(3, 0xc2610a, 1);
    const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 === 0 ? 20 : 9, a = (Math.PI / 5) * i - Math.PI / 2; pts.push({ x: 24 + Math.cos(a) * r, y: 25 + Math.sin(a) * r }); }
    g.fillPoints(pts, true); g.strokePoints(pts, true);
    g.generateTexture("kit-star", 48, 48);
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(10, 0, 13, 7, 7, 7); g.fillTriangle(10, 20, 13, 13, 7, 13);
    g.fillTriangle(0, 10, 7, 7, 7, 13); g.fillTriangle(20, 10, 13, 7, 13, 13);
    g.generateTexture("kit-spark", 20, 20);
    g.destroy();
  };

  Kit.emoji = (scene, key, emoji, size) => {
    if (scene.textures.exists(key)) return;
    const t = scene.add.text(0, 0, emoji, { fontSize: size + "px", fontFamily: "sans-serif" });
    t.setPadding(4);
    const rt = scene.make.renderTexture({ width: Math.ceil(t.width), height: Math.ceil(t.height), add: false });
    rt.draw(t, 0, 0); rt.saveTexture(key); t.destroy();
  };

  Kit.shake = (scene, ms, amount) => { if (motionOK() && !calm()) scene.cameras.main.shake(ms, amount); };

  Kit.burst = (scene, x, y, o) => {
    if (!motionOK()) return;
    o = o || {};
    const n = calm() ? Math.max(3, Math.round((o.n || 14) * 0.4)) : (o.n || 14);
    const e = scene.add.particles(x, y, o.texture || "kit-dot", {
      speed: { min: o.min || 90, max: o.max || 260 }, lifespan: o.life || 520, scale: { start: o.scale || 0.8, end: 0 },
      tint: o.tint !== undefined ? o.tint : 0xffffff, gravityY: o.gravity || 0, rotate: o.spin ? { min: 0, max: 360 } : 0,
      quantity: n, emitting: false
    });
    e.setDepth(o.depth || 50);
    e.explode(n);
    scene.time.delayedCall((o.life || 520) + 80, () => e.destroy());
  };

  Kit.floatText = (scene, x, y, text, color) => {
    const t = scene.add.text(x, y, text, { fontSize: "28px", fontFamily: FONT, fontStyle: "bold", color: color || "#ffe14d", stroke: "#17403a", strokeThickness: 6 }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({ targets: t, y: y - 60, alpha: 0, scale: 1.25, duration: 800, ease: "cubic.out", onComplete: () => t.destroy() });
  };

  Kit.banner = (scene, text, color) => {
    const W = scene.scale.width, H = scene.scale.height;
    const t = scene.add.text(W / 2, H * 0.3, text, { fontSize: "52px", fontFamily: FONT, fontStyle: "bold", color: color || "#fff", stroke: "#17403a", strokeThickness: 9 }).setOrigin(0.5).setDepth(70).setScale(0.2).setAlpha(0);
    scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: "back.out", yoyo: false });
    scene.tweens.add({ targets: t, alpha: 0, y: H * 0.26, delay: 900, duration: 420, onComplete: () => t.destroy() });
  };

  // Twinkling sparkles scattered over an area (sun glints, stars, magic dust).
  Kit.sparkleField = (scene, count, x0, y0, x1, y1, tint) => {
    for (let i = 0; i < count; i++) {
      const s = scene.add.image(Phaser.Math.Between(x0, x1), Phaser.Math.Between(y0, y1), "kit-spark").setTint(tint || 0xffffff).setAlpha(0).setScale(Phaser.Math.FloatBetween(0.3, 0.7)).setDepth(1);
      scene.tweens.add({ targets: s, alpha: { from: 0, to: 0.9 }, scale: s.scale * 1.5, angle: 45, duration: Phaser.Math.Between(700, 1400), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) });
    }
  };

  // Slowly turning sun rays behind a sun.
  Kit.sunRays = (scene, x, y, radius, color) => {
    const g = scene.add.graphics({ x, y });
    g.fillStyle(color || 0xfff2a8, 0.28);
    for (let i = 0; i < 12; i++) { const a = (Math.PI / 6) * i; g.fillTriangle(0, 0, Math.cos(a - 0.09) * radius, Math.sin(a - 0.09) * radius, Math.cos(a + 0.09) * radius, Math.sin(a + 0.09) * radius); }
    g.setDepth(0);
    if (motionOK()) scene.tweens.add({ targets: g, angle: 360, duration: 40000, repeat: -1 });
    return g;
  };

  // Animated title card; calls onStart on tap / Space / Enter.
  Kit.title = (scene, o, onStart) => {
    const W = scene.scale.width, H = scene.scale.height;
    const c = scene.add.container(W / 2, H / 2).setDepth(100);
    const veil = scene.add.rectangle(0, 0, W, H, 0x10243a, 0.55);
    const card = scene.add.rectangle(0, 0, 560, 270, 0xffffff, 0.95).setStrokeStyle(5, o.color || 0x2ecc71, 1);
    const icon = scene.add.text(0, -78, o.emoji || "🦖", { fontSize: "64px" }).setOrigin(0.5);
    const title = scene.add.text(0, -8, o.title, { fontSize: "44px", fontFamily: FONT, fontStyle: "bold", color: "#24407a" }).setOrigin(0.5);
    const hint = scene.add.text(0, 48, o.hint || "", { fontSize: "20px", fontFamily: FONT, color: "#52627f", align: "center", wordWrap: { width: 480 } }).setOrigin(0.5);
    const go = scene.add.text(0, 98, "TAP TO START", { fontSize: "26px", fontFamily: FONT, fontStyle: "bold", color: "#ffffff", backgroundColor: o.cssColor || "#2ecc71", padding: { x: 22, y: 8 } }).setOrigin(0.5);
    c.add([veil, card, icon, title, hint, go]);
    c.setScale(0.6).setAlpha(0);
    scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 380, ease: "back.out" });
    if (motionOK()) {
      scene.tweens.add({ targets: icon, y: icon.y - 12, angle: { from: -8, to: 8 }, duration: 600, yoyo: true, repeat: -1, ease: "sine.inOut" });
      scene.tweens.add({ targets: go, scale: 1.08, duration: 520, yoyo: true, repeat: -1 });
    }
    let started = false;
    const start = () => {
      if (started) return; started = true;
      Kit.sfx("good");
      scene.tweens.add({ targets: c, alpha: 0, scale: 1.15, duration: 220, onComplete: () => { c.destroy(); onStart(); } });
    };
    scene.time.delayedCall(250, () => {
      scene.input.once("pointerdown", start);
      scene.input.keyboard.once("keydown-SPACE", start);
      scene.input.keyboard.once("keydown-ENTER", start);
    });
    return c;
  };

  // End screen: panel pops in, stars fill one by one with rising notes, confetti on a good run.
  Kit.endPanel = (scene, o, onAgain) => {
    const W = scene.scale.width, H = scene.scale.height;
    const c = scene.add.container(W / 2, H / 2).setDepth(100);
    const veil = scene.add.rectangle(0, 0, W, H, 0x10243a, 0.45);
    const panel = scene.add.rectangle(0, 0, 460, 330, 0x14203a, 0.92).setStrokeStyle(4, 0xffffff, 0.35);
    const head = scene.add.text(0, -122, o.title, { fontSize: "40px", fontFamily: FONT, fontStyle: "bold", color: "#fff" }).setOrigin(0.5);
    const line = scene.add.text(0, -62, o.line || "", { fontSize: "22px", fontFamily: FONT, color: "#ffe14d" }).setOrigin(0.5);
    c.add([veil, panel, head, line]);
    const slots = [];
    for (let i = 0; i < 3; i++) {
      const s = scene.add.image((i - 1) * 90, 8, "kit-star").setScale(1.7).setTint(0x4a5675).setAlpha(0.8);
      slots.push(s); c.add(s);
    }
    const best = scene.add.text(0, 78, o.best || "", { fontSize: "18px", fontFamily: FONT, color: "#cfe0ff" }).setOrigin(0.5);
    const again = scene.add.text(0, 124, o.again || "TAP TO PLAY AGAIN", { fontSize: "22px", fontFamily: FONT, fontStyle: "bold", color: "#fff", backgroundColor: "#2ecc71", padding: { x: 18, y: 8 } }).setOrigin(0.5).setAlpha(0);
    c.add([best, again]);
    c.setScale(0.5).setAlpha(0);
    scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 340, ease: "back.out" });
    const stars = Math.max(0, Math.min(3, o.stars || 0));
    for (let i = 0; i < stars; i++) {
      scene.time.delayedCall(450 + i * 380, () => {
        slots[i].setTint(0xffffff).setAlpha(1);
        scene.tweens.add({ targets: slots[i], scale: { from: 0.4, to: 1.7 }, angle: { from: -40, to: 0 }, duration: 380, ease: "back.out" });
        Kit.sfx("note", 4 + i * 2, 0.35); Kit.sfx("star");
        Kit.burst(scene, W / 2 + (i - 1) * 90, H / 2 + 8, { texture: "kit-spark", tint: 0xffe14d, n: 12, depth: 120, scale: 1.2 });
      });
    }
    if (stars === 3) scene.time.delayedCall(450 + 3 * 380, () => { Kit.sfx("win"); for (let k = 0; k < 3; k++) Kit.burst(scene, Phaser.Math.Between(W * 0.25, W * 0.75), H * 0.3, { tint: [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff][k % 4], n: 22, gravity: 400, life: 1100, depth: 120 }); });
    scene.time.delayedCall(450 + stars * 380 + 250, () => {
      scene.tweens.add({ targets: again, alpha: 1, duration: 250 });
      if (motionOK()) scene.tweens.add({ targets: again, scale: 1.07, duration: 520, yoyo: true, repeat: -1 });
      const go = () => { Kit.sfx("tap"); onAgain(); };
      scene.input.once("pointerdown", go);
      scene.input.keyboard.once("keydown-SPACE", go);
    });
    return c;
  };
})();
