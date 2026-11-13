// Shared polish for the Phaser games: sound (via the hub's DUFX engine, so the hub's
// sound switch applies), animated title/end screens with star ratings, particles and
// sparkles, and hub progress hooks. Load after du-fx.js and Phaser.
(function () {
  "use strict";
  const Kit = (window.DUKit = {});
  const environmentModule = new URL('../photoreal-environments.js', document.currentScript.src).href;
  const vehicleModule = new URL('../photoreal-vehicles.js', document.currentScript.src).href;
  const texturesModule = new URL('../photoreal-textures.js', document.currentScript.src).href;

  /* The prop photographs — a mossy boulder, a speckled egg, a conifer, a nest
   * of sticks — are cut-outs, and every Phaser chapter still builds its props
   * out of fillRect triangles beside a real photographic backdrop. This swaps
   * the *contents* of a texture a game already made, so the key, the size, the
   * sprite and any collision against it all stay exactly where they are; if a
   * file is missing the triangle simply survives. */
  Kit.prop = (scene, key, name, options) => {
    if (!scene.textures.exists(key)) return Promise.resolve(false);
    return import(texturesModule)
      .then((m) => m.applyPropTexture(scene.textures.get(key), name, options || {}))
      .catch(() => false);
  };
  Kit.props = (scene, map) => {
    Object.keys(map).forEach((key) => Kit.prop(scene, key, map[key]));
  };
  Kit.vehicle = async (scene,config,target,hide=[]) => {
    let active=true;scene.events.once('shutdown',()=>{active=false;});
    try {
      const module=await import(vehicleModule),canvas=await module.vehicleCanvas(config);
      if(!active)return;
      const key='photo-vehicle-'+config.body+'-'+config.paint;
      if(!scene.textures.exists(key))scene.textures.addCanvas(key,canvas);
      target.setTexture(key).setDisplaySize(120,60).setOrigin(.5,1).setY(0);
      hide.forEach(item=>item.setVisible(false));
    } catch(error) { console.warn('Vehicle photo unavailable',error); }
  };
  /* Name the items that are only scenery — the drawn sky, the tiled hills — so
   * a photographic backdrop can step them out of the way. Hiding everything
   * shallow used to do this job, and it also hid Dino Park's nest, its flowers
   * and its butterflies, because a game object has no depth that means
   * "decoration". Now nothing disappears unless a page says it is scenery. */
  Kit.scenery = (...items) => {
    items.forEach((item) => { if (item) item.__duScenery = true; });
    return items[0];
  };
  Kit.environment = (scene, mood='jungle') => {
    const scenery = [...scene.children.list].filter(item=>item.__duScenery);
    return import(environmentModule).then(m=>m.addEnvironment(scene,scene.scale.width,scene.scale.height,mood,-1)).then(bg=>{
      if (bg) scenery.forEach(item=>{if(item.active)item.setVisible(false);});
    });
  };
  const photoBase = new URL('../assets/prehistoric/', document.currentScript.src).href;
  Kit.photo = (scene, key, species, width, height) => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, width, height);
    const img = new Image();
    img.onload = () => {
      if (!tex.context || !scene.textures.exists(key)) return;
      const ctx = tex.getContext(), scale = Math.min(width / img.width, height / img.height);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, (width - img.width * scale) / 2, height - img.height * scale, img.width * scale, img.height * scale);
      tex.refresh();
    };
    img.src = photoBase + species + '.webp';
  };
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

  /* A friend from the story speaks over the shared screens, so a game never
   * opens on a bare instruction and never ends in silence. A chapter opts in by
   * naming its ledger prefix (window.DU_WORLD_ID = "park"); without that, or
   * without the story engine on the page, this quietly does nothing. */
  Kit.voice = (scene, kind, id) => {
    const S = window.DUSTORY, world = window.DU_WORLD_ID;
    const key = id || (scene && scene.scene && scene.scene.key);
    if (!S || !S.voice || !world || !key) return "";
    try { return S.voice(world + "." + key, kind); } catch (e) { return ""; }
  };

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
    /* The reward star is what every chapter's HUD counter and end panel blits,
     * and a flat yellow polygon was the last piece of clip art left on an
     * otherwise photographed screen. The drawn star above stays as what shows
     * while the specimen photograph decodes. */
    Kit.specimen(scene, "kit-star", "star");
  };

  /* Repaint a texture a game already made with a specimen photograph. The
   * library behind fx/du-objects.js is keyed by emoji and holds a real picture
   * for every thing this universe can name, so a glyph ("🌲") and a specimen
   * name ("pine") are both accepted here. */
  Kit.specimen = (scene, key, nameOrGlyph, options) => {
    const O = window.DUFX && window.DUFX.objects;
    const name = O && O.slug(nameOrGlyph);
    if (!name || !scene.textures.exists(key)) return Promise.resolve(false);
    return import(texturesModule)
      .then((m) => m.applyPhotorealTexture(scene.textures.get(key), name, Object.assign({ library: 'objects' }, options || {})))
      .catch(() => false);
  };
  Kit.specimens = (scene, map) => {
    Object.keys(map).forEach((key) => Kit.specimen(scene, key, map[key]));
  };

  const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  function glyphBox(emoji, size) {
    if (!glyphBox.ctx) { try { glyphBox.ctx = document.createElement('canvas').getContext('2d'); } catch (e) { return null; } }
    if (!glyphBox.ctx) return null;
    glyphBox.ctx.font = size + 'px ' + EMOJI_FONT;
    return { w: Math.min(512, Math.ceil(glyphBox.ctx.measureText(emoji).width) + 8), h: Math.min(512, Math.ceil(size) + 8) };
  }

  /* Cars are the one thing the specimen library answers badly: every vehicle
   * glyph there resolves to `cart`, a woven two-wheeled dig-site cart, which is
   * how a prehistoric hand-cart came to sit on the "Dino Run" title card.
   * assets/vehicles holds the photographs of the real bodies, and its side view
   * is about 2.4 times as wide as it is tall, so the texture takes that shape
   * instead of the square a font glyph would have needed. "#e74c3c" is the paint
   * the vehicle module passes through with no visible change. */
  const CARS = {
    "\u{1F3CE}": "race", "\u{1F697}": "sport", "\u{1F699}": "pickup",
    "\u{1F69A}": "truck", "\u{1F69B}": "truck", "\u{1F68C}": "van", "\u{1F69C}": "monster"
  };
  const noVS = (s) => String(s).split("\uFE0F").join("");

  Kit.carBadge = (scene, key, body, size) => {
    const w = Math.ceil(size * 2.4), h = Math.ceil(size);
    scene.textures.createCanvas(key, w, h);
    const tex = scene.textures.get(key);
    const ctx = tex.getContext();
    if (ctx) {
      ctx.font = size + 'px ' + EMOJI_FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String.fromCodePoint(0x1F697), w / 2, h / 2);
      tex.refresh();
    }
    import(vehicleModule)
      .then((m) => m.vehicleCanvas({ body, paint: "#e74c3c" }, "side", w, h))
      .then((canvas) => {
        if (!scene.textures.exists(key)) return;
        const c = scene.textures.get(key).getContext();
        if (!c) return;
        c.clearRect(0, 0, w, h);
        c.drawImage(canvas, 0, 0);
        scene.textures.get(key).refresh();
      })
      .catch(() => { /* the glyph stays only if the photograph cannot load */ });
  };

  Kit.emoji = (scene, key, emoji, size) => {
    if (scene.textures.exists(key)) return;
    if (emoji === '🦖' || emoji === '🦕') {
      Kit.photo(scene, key, emoji === '🦖' ? 'trex' : 'bronto', Math.ceil(size * 1.4), Math.ceil(size));
      return;
    }
    const car = CARS[noVS(emoji)];
    if (car) { Kit.carBadge(scene, key, car, size); return; }
    /* This used to bake the glyph through a render texture. Phaser's WebGL
     * render textures have no canvas behind them at all, so nothing could ever
     * be painted into them afterwards — which is how every flower, butterfly
     * and snowflake in the Phaser chapters stayed a font glyph while the rocks
     * and eggs beside them became photographs. A canvas texture can be
     * repainted, so the glyph is drawn here only as what shows while the
     * specimen photograph decodes. People are not in the specimen library,
     * which keeps the drawn daddy and mummy faces a drawing. */
    const box = glyphBox(emoji, size) || { w: Math.ceil(size * 1.3), h: Math.ceil(size * 1.2) };
    const tex = scene.textures.createCanvas(key, box.w, box.h);
    const ctx = tex.getContext();
    if (ctx) {
      ctx.font = size + 'px ' + EMOJI_FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(emoji, box.w / 2, box.h / 2);
      tex.refresh();
    }
    Kit.specimen(scene, key, emoji);
  };

  /* A label is the one thing no picture layer can reach: Phaser writes its text
   * straight into a canvas, so a glyph inside a label stayed a font drawing
   * floating in front of a photographed valley — a clip-art egg next to a real
   * one. This lays the same label out as words in text plus a photograph for
   * every thing those words name. `icons` is the page's own dictionary of which
   * glyph means which specimen; a glyph with no photograph anywhere in this
   * universe is simply dropped, because the words beside it already say it. */
  /* One emoji, with the invisible variation selector and any family joined to
   * it — but never the next emoji too. A greedy "pictographic*" run swallows
   * "💚💚💚" as a single thing, which is no thing the library has a picture of,
   * and the whole row silently disappears from the label. */
  const GLYPH_ONE = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;
  // `test()` on a /g regex leaves lastIndex past the match, so the guard that
  // asks "does this string contain one" gets its own stateless copy.
  const HAS_GLYPH = new RegExp(GLYPH_ONE.source, "u");
  function labelTokens(text) {
    const all = String(text), parts = [];
    let last = 0, m;
    GLYPH_ONE.lastIndex = 0;
    while ((m = GLYPH_ONE.exec(all))) {
      if (m.index > last) parts.push({ word: all.slice(last, m.index) });
      parts.push({ glyph: m[0] });
      last = m.index + m[0].length;
    }
    if (last < all.length) parts.push({ word: all.slice(last) });
    return parts;
  }
  function labelIcon(scene, name) {
    const key = "kit-icon-" + String(name).replace(/[^a-z0-9_-]/gi, "");
    if (!scene.textures.exists(key)) {
      scene.textures.createCanvas(key, 128, 128);
      Kit.specimen(scene, key, name);
    }
    return key;
  }

  Kit.label = (scene, x, y, style, icons, options) => {
    const o = options || {};
    const size = parseFloat(style && style.fontSize) || 20;
    const box = Math.round(size * 1.12);
    const row = scene.add.container(x, y).setDepth(o.depth === undefined ? 8 : o.depth);
    const originX = o.originX === undefined ? 0 : o.originX;
    const originY = o.originY === undefined ? 0 : o.originY;
    // A weather glyph is often spelled with an invisible variation selector and
    // sometimes without; both spellings have to find the same photograph.
    const plain = (g) => String(g).split("\uFE0F").join("");
    const dict = {};
    Object.keys(icons || {}).forEach((g) => { dict[plain(g)] = icons[g]; });
    let current = "", width = 0;
    function paint(text) {
      current = String(text);
      row.removeAll(true);
      const made = [];
      let w = 0, line = size * 1.25;
      labelTokens(current).forEach((part) => {
        if (part.word !== undefined) {
          const t = scene.make.text({ x: 0, y: 0, text: part.word, style, add: false }).setOrigin(0, 0);
          line = Math.max(line, t.height);
          made.push({ obj: t, at: w, wide: t.width });
          w += t.width;
          return;
        }
        // A page may name a glyph the specimen library has no picture for —
        // a green heart means a feather here — and anything neither the page
        // nor the library can answer is dropped rather than drawn as a glyph.
        const name = dict[plain(part.glyph)] ||
          (FX() && FX().objects && FX().objects.slug(plain(part.glyph)));
        if (!name) return;
        const img = scene.make.image({ key: labelIcon(scene, name), x: 0, y: 0, add: false }).setOrigin(0, 0);
        img.setDisplaySize(box, box);
        made.push({ obj: img, at: w, wide: box, icon: true });
        w += box;
      });
      width = w;
      // Everything is laid out from the left and then slid into place, so a
      // label that used to sit centred or right-aligned still sits there.
      const shift = -width * originX;
      made.forEach((item) => {
        item.obj.x = item.at + shift;
        item.obj.y = (item.icon ? (line - box) / 2 : 0) - line * originY;
        row.add(item.obj);
      });
    }
    paint(o.text || "");
    // A label is returned as the container itself, so a game can tween, move or
    // fade it like any other Phaser object; setText keeps the words and the
    // photographs lined up when they change.
    row.setText = (text) => { if (String(text) !== current) paint(text); return row; };
    row.labelWidth = () => width;
    return row;
  };

  Kit.shake = (scene, ms, amount) => { if (motionOK() && !calm()) scene.cameras.main.shake(ms, amount); };

  Kit.burst = (scene, x, y, o) => {
    if (!motionOK()) return;
    // A world that forgets to build the kit textures used to spark green-and-
    // black missing-texture boxes instead of magic, so the kit makes its own
    // art whenever any part of it is asked for.
    Kit.textures(scene);
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

  Kit.banner = (scene, text, color, icons) => {
    const W = scene.scale.width, H = scene.scale.height;
    const style = { fontSize: "52px", fontFamily: FONT, fontStyle: "bold", color: color || "#fff", stroke: "#17403a", strokeThickness: 9 };
    // A banner that names a thing can now show it: "🌧️ Pitter Patter" used to
    // put a clip-art cloud in front of a photographed sky, because Phaser text
    // is painted into a canvas no picture layer can reach.
    const t = HAS_GLYPH.test(String(text))
      ? Kit.label(scene, W / 2, H * 0.3, style, icons, { originX: 0.5, originY: 0.5, depth: 70, text })
      : scene.add.text(W / 2, H * 0.3, text, style).setOrigin(0.5).setDepth(70);
    t.setScale(0.2).setAlpha(0);
    scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: "back.out", yoyo: false });
    scene.tweens.add({ targets: t, alpha: 0, y: H * 0.26, delay: 900, duration: 420, onComplete: () => t.destroy() });
  };

  const CELESTE = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xc77dff, 0xff9f43];
  // Meadow already called DUKit.celebrate() on a win; it did not exist, so the
  // best moment in the game was silent. Works from a Phaser scene (particles land
  // inside the letterboxed canvas) or from any page, via the hub's fireworks.
  Kit.celebrate = function (scene) {
    Kit.sfx("win");
    if (!motionOK()) return;
    if (scene && scene.add && scene.scale && scene.time) {
      const W = scene.scale.width, H = scene.scale.height, vol = calm() ? 2 : 5;
      for (let k = 0; k < vol; k++) {
        scene.time.delayedCall(k * 170, () => {
          Kit.burst(scene, Phaser.Math.Between(W * 0.15, W * 0.85), Phaser.Math.Between(H * 0.22, H * 0.6), {
            texture: "kit-spark", tint: CELESTE[k % CELESTE.length], n: calm() ? 10 : 26,
            gravity: 430, life: 1250, min: 130, max: 430, spin: true, depth: 130, scale: 1.15,
          });
        });
      }
      if (!calm()) Kit.shake(scene, 90, 0.0035);
    } else if (FX() && FX().celebrate) FX().celebrate();
  };

  // Twinkling sparkles scattered over an area (sun glints, stars, magic dust).
  Kit.sparkleField = (scene, count, x0, y0, x1, y1, tint) => {
    Kit.textures(scene);
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
    const iconEmoji = o.emoji || "🦖";
    // The badge on a title card is the same photograph the game itself uses, so
    // "Dino Run" opens on a real car and "Meadow Memory" on a real flower. This
    // used to be a 64px picture from the font for everything except the two
    // dinosaurs, which is how a clip-art race car came to sit on a card over a
    // photographed valley.
    const iconKey = 'kit-title-' + iconEmoji;
    Kit.emoji(scene, iconKey, iconEmoji, 74);
    const icon = scene.add.image(0, -78, iconKey).setOrigin(0.5);
    const title = scene.add.text(0, -8, o.title, { fontSize: "44px", fontFamily: FONT, fontStyle: "bold", color: "#24407a" }).setOrigin(0.5);
    const say = String(o.hint || "");
    const hint = scene.add.text(0, 0, say, { fontSize: say.length > 92 ? "18px" : "20px", fontFamily: FONT, color: "#52627f", align: "center", wordWrap: { width: 500 } }).setOrigin(0.5);
    const go = scene.add.text(0, 0, "TAP TO START", { fontSize: "26px", fontFamily: FONT, fontStyle: "bold", color: "#ffffff", backgroundColor: o.cssColor || "#2ecc71", padding: { x: 22, y: 8 } }).setOrigin(0.5);
    // A three-line instruction used to run straight through the button, so the
    // card now measures its words and grows around them instead of over them.
    hint.setY(34 + hint.height / 2);
    go.setY(Math.max(98, hint.y + hint.height / 2 + 20 + go.height / 2));
    card.setSize(560, Math.max(270, (go.y + go.height / 2 + 26) * 2));
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
    scene.time.delayedCall(560, () => Kit.voice(scene, "intro", o.voiceId));
    return c;
  };

  // End screen: panel pops in, stars fill one by one with rising notes, confetti on a good run.
  Kit.endPanel = (scene, o, onAgain) => {
    const W = scene.scale.width, H = scene.scale.height;
    Kit.textures(scene);
    const c = scene.add.container(W / 2, H / 2).setDepth(100);
    const veil = scene.add.rectangle(0, 0, W, H, 0x10243a, 0.45);
    const panel = scene.add.rectangle(0, 0, 460, 330, 0x14203a, 0.92).setStrokeStyle(4, 0xffffff, 0.35);
    // Every line on this panel is a label, so a run that ends in "3 eggs
    // caught · 🌧️ Pitter Patter" shows a photographed cloud, not a font
    // drawing, and the panel matches the world behind it.
    // The words ride in through options.text — a label paints nothing at all
    // without them, which is how a whole end panel came up empty once.
    const lab = (y, text, style) => Kit.label(scene, 0, y, style, null, { originX: 0.5, originY: 0.5, text });
    const head = lab(-122, o.title, { fontSize: "40px", fontFamily: FONT, fontStyle: "bold", color: "#fff" });
    const line = lab(-62, o.line || "", { fontSize: "22px", fontFamily: FONT, color: "#ffe14d" });
    c.add([veil, panel, head, line]);
    const slots = [];
    for (let i = 0; i < 3; i++) {
      // A star not yet earned is the same photograph left almost transparent:
      // tinting a photograph turns it to mud, and a ghost of the real thing
      // reads as "still to come" far better than a coloured slab does.
      const s = scene.add.image((i - 1) * 90, 8, "kit-star").setScale(1.7).setAlpha(0.22);
      slots.push(s); c.add(s);
    }
    const best = lab(78, o.best || "", { fontSize: "18px", fontFamily: FONT, color: "#cfe0ff" });
    const again = lab(124, o.again || "TAP TO PLAY AGAIN", { fontSize: "22px", fontFamily: FONT, fontStyle: "bold", color: "#fff", backgroundColor: "#2ecc71", padding: { x: 18, y: 8 } }).setAlpha(0);
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
    // Praise a good run, encourage a near one — in a friend's words, not a score.
    scene.time.delayedCall(700, () => Kit.voice(scene, stars >= 3 ? "win" : "lose", o.voiceId));
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
