/* Dinosaur Universe — the world engine (DUWORLD).
 *
 * One photograph, and the layers that make it behave like a place instead of a
 * wallpaper: mist at three depths, dust catching the light, a herd that puts one
 * foot in front of the other, pteranodons thermalling across the sky, and a
 * camera that is never quite still.
 *
 * It was built for the opening cinematic (DUINTRO). The chapter cutscenes
 * (DUSTORY) were still a still image with one dinosaur popping in on top of it,
 * which is the difference between being told a story and being shown one, so the
 * engine came out here so both — and any game that wants a backdrop that is
 * alive — draw the same world the same way.
 *
 *   const layers = DUWORLD.make(scene, 3);
 *   DUWORLD.paint(ctx, { scene, layers, time, k, W, H, reduce });
 *
 * `k` is how far through the *shot* we are (0..1) and drives the camera push;
 * `time` is seconds of drift and drives everything that moves. Keeping them
 * apart is what lets a longer line be a slower camera without the mist also
 * slowing down.
 *
 * A scene is:
 *   { plate, plateBase, camera: { zoom: [a,b], pan: [[x,y],[x,y]] },
 *     grade: { tint, amount, vignette }, layers: [ … ] }
 *
 * Nothing here is required. A plate that has not arrived yet degrades into the
 * scene's own wash, a sprite that fails to decode is simply not drawn, and the
 * caller keeps running — a missing file must never be a black screen.
 */
(function () {
  'use strict';
  if (window.DUWORLD && window.DUWORLD.paint) return;

  const HERE = (document.currentScript && document.currentScript.src) || location.href;
  const CINEMA = new URL('../assets/cinema/', HERE).href;
  const DINO = new URL('../assets/prehistoric/', HERE).href;
  const ART = new URL('art/', HERE).href;

  const plates = new Map();   // url -> {img, ok}
  const arts = new Map();     // art key -> {img, ok}
  // frames the universe owns that are not species photographs
  const SCENE_ART = new Set(['brachiosaurus-step']);

  function loadPlate(name, base) {
    // A scene may name a bare plate ("star-seeds", which lives beside the
    // cinematic) or a photograph with its extension ("snow.jpg", which lives in
    // fx/art next to this file). Appending .webp to the second produced a 404.
    const qualified = /^(https?:|\.\/|\.\.\/|\/)/.test(name);
    const file = /\.(webp|png|jpe?g)$/i.test(name) ? name : name + '.webp';
    const url = qualified ? name : (base || CINEMA) + file;
    if (plates.has(url)) return plates.get(url);
    const img = new Image();
    const entry = { img, ok: false };
    plates.set(url, entry);
    img.onload = () => { entry.ok = true; };
    img.src = url;
    return entry;
  }

  /* Species photographs are shared with the rest of the collection so there is
   * only ever one rex on disk. They used to be 1.8 MB PNGs, which is fine for a
   * picture and impossible for a herd: an animated world puts four or five of
   * them in the same frame, so they are WebP at identical pixel size now. */
  function artURL(key) {
    return (SCENE_ART.has(key) ? CINEMA : DINO) + key + '.webp';
  }

  function loadArt(key) {
    if (arts.has(key)) return arts.get(key);
    const img = new Image();
    const entry = { img, ok: false };
    arts.set(key, entry);
    img.onload = () => { entry.ok = true; };
    img.src = artURL(key);
    return entry;
  }

  /* ------------------------------------------------------------- determinism
   * Every layer seeds its particles from a small counter so the same scene
   * looks the same on the second watch, and so a headless run can be compared
   * against a screenshot.
   */
  function rng(seed) {
    let s = (seed * 2654435761) >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function make(scene, seed) {
    const rand = rng(seed || 1);
    const out = [];
    if (!scene || !scene.layers) return out;
    for (const def of scene.layers) {
      if (def.type === 'motes' || def.type === 'twinkle') {
        const n = def.n || 60;
        const items = [];
        for (let i = 0; i < n; i++) {
          items.push({ x: rand(), y: rand(), p: rand() * 6.283, s: 0.4 + rand() * 0.9, v: 0.5 + rand() });
        }
        out.push({ def, items });
      } else if (def.type === 'herd' || def.type === 'flyers' || def.type === 'swim') {
        const items = [];
        if (def.sprites) {
          for (const sp of def.sprites) items.push(Object.assign({ t: 0, phase: sp.phase || rand() }, sp));
        } else {
          for (let i = 0; i < (def.n || 4); i++) {
            const size = def.size[0] + rand() * (def.size[1] - def.size[0]);
            items.push({
              art: def.art,
              at: [rand(), def.band[0] + rand() * (def.band[1] - def.band[0])],
              w: size, speed: def.speed[0] + rand() * (def.speed[1] - def.speed[0]),
              dir: rand() < 0.5 ? 1 : -1, depth: 0.3 + rand() * 0.4,
              phase: rand() * 6.283, flap: 0.5 + rand() * 0.5, t: 0
            });
          }
        }
        for (const it of items) {
          const keys = Array.isArray(it.art) ? it.art : [it.art];
          it.frames = keys.map(loadArt);
        }
        out.push({ def, items, kind: def.type });
      } else if (def.type === 'breath') {
        out.push({ def, puffs: [], clock: 0 });
      } else if (def.type === 'fall') {
        // rain, snow, ash, petals: one axis of travel, a depth for parallax
        const items = [];
        for (let i = 0; i < (def.n || 90); i++) {
          items.push({ x: rand(), y: rand(), v: 0.5 + rand() * 1.1, s: 0.35 + rand() * 0.9, p: rand() * 6.283 });
        }
        out.push({ def, items });
      } else if (def.type === 'shimmer') {
        const items = [];
        for (let i = 0; i < (def.n || 60); i++) {
          items.push({ x: rand(), y: rand(), p: rand() * 6.283, w: 0.004 + rand() * 0.02 });
        }
        out.push({ def, items });
      } else {
        out.push({ def, items: null });
      }
    }
    return out;
  }

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  const lerp = (pair, k) => pair[0] + (pair[1] - pair[0]) * k;

  /* The plate is drawn cover-fit under a camera, and everything composited on
   * top has to go through the same transform or a herd pinned to the screen
   * visibly slides off the ground as the shot pushes in.
   */
  function plateRect(entry, cam, W, H) {
    const img = entry.img;
    if (!img || !img.width) return { x: 0, y: 0, w: W, h: H };
    const s = Math.max(W / img.width, H / img.height) * cam.zoom;
    const dw = img.width * s, dh = img.height * s;
    // a pan must never outrun the photograph, or the shot gains a black gutter
    const x = Math.min(Math.max(W * cam.x - dw / 2, W - dw), 0);
    const y = Math.min(Math.max(H * cam.y - dh / 2, H - dh), 0);
    return { x, y, w: dw, h: dh };
  }

  function blob(ctx, x, y, r, rgb, a) {
    if (r <= 0 || a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.283);
    ctx.fill();
  }

  function drawLayers(ctx, layers, scene, time, W, H, reduce, r) {
    const drift = reduce ? 0 : time;
    /* Anything that is *in* the photograph — a herd, the sun, a nostril — is
     * placed in plate space so it keeps its footing while the camera moves.
     * Mist and dust are in front of the lens, so those stay in screen space. */
    const PX = (u) => r.x + u * r.w;
    const PY = (v) => r.y + v * r.h;
    const PS = (f) => f * r.w;
    for (const L of layers) {
      const d = L.def;
      if (d.type === 'mist') {
        for (const b of d.bands) {
          const off = (drift * b.s) % 1;
          const y = b.y * H;
          const h = b.h * H;
          for (let k = -1; k <= 1; k++) {
            const cx = ((k + off) % 1) * W;
            blob(ctx, cx, y + Math.sin(drift * 0.35 + k * 2.1) * h * 0.12, W * 0.55, b.colour || '236,244,252', b.a);
          }
        }
      } else if (d.type === 'glow') {
        d.points.forEach((p, i) => {
          const pulse = 0.55 + 0.45 * Math.sin(drift * d.rate + i * 1.7);
          blob(ctx, PX(p[0]), PY(p[1]), PS(d.r) * (0.85 + 0.3 * pulse), d.colour, d.pulse * pulse);
        });
      } else if (d.type === 'rays') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const ox = PX(d.at[0]), oy = PY(d.at[1]);
        for (let i = 0; i < d.n; i++) {
          const ang = -1.15 + i * (d.spread / d.n) + Math.sin(drift * 0.16 + i) * 0.02;
          const len = r.w * d.len;
          const wid = len * (0.02 + 0.05 * ((i % 3) + 1) / 3);
          const a = d.pulse * (0.35 + 0.3 * Math.sin(drift * 0.5 + i * 2.3));
          const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
          g.addColorStop(0, 'rgba(' + d.colour + ',' + (a * 0.9).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(' + d.colour + ',0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + Math.cos(ang) * len - Math.sin(ang) * wid, oy + Math.sin(ang) * len + Math.cos(ang) * wid);
          ctx.lineTo(ox + Math.cos(ang) * len + Math.sin(ang) * wid, oy + Math.sin(ang) * len - Math.cos(ang) * wid);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (d.type === 'twinkle') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const p of L.items) {
          const a = 0.25 + 0.75 * Math.pow(Math.sin(drift * p.v * 1.4 + p.p) * 0.5 + 0.5, 3);
          blob(ctx, PX(p.x), PY(p.y), p.s * 2.2, '220,235,255', a * 0.5);
        }
        ctx.restore();
      } else if (d.type === 'motes') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const p of L.items) {
          const y = (p.y - drift * d.speed * p.v) % 1;
          const x = p.x + Math.sin(drift * 0.4 + p.p) * 0.012;
          blob(ctx, ((x % 1) + 1) % 1 * W, ((y % 1) + 1) % 1 * H, p.s * 1.8, d.colour, 0.30 + 0.3 * Math.sin(drift + p.p));
        }
        ctx.restore();
      } else if (d.type === 'fall') {
        const wind = d.wind || 0;
        for (const p of L.items) {
          const y = (((p.y + drift * d.speed * p.v) % 1) + 1) % 1;
          const sway = d.sway ? Math.sin(drift * 1.3 + p.p) * d.sway : 0;
          const x = (((p.x + drift * wind + sway) % 1) + 1) % 1;
          if (d.kind === 'streak') {
            ctx.strokeStyle = 'rgba(' + d.colour + ',' + (0.16 + 0.24 * p.v).toFixed(3) + ')';
            ctx.lineWidth = Math.max(1, p.s * 0.9);
            ctx.beginPath();
            ctx.moveTo(x * W, y * H);
            ctx.lineTo(x * W + wind * 40, y * H + p.s * 26 * p.v);
            ctx.stroke();
          } else {
            blob(ctx, x * W, y * H, p.s * (d.r || 2.6), d.colour, 0.34 + 0.3 * Math.sin(drift * 2 + p.p));
          }
        }
      } else if (d.type === 'shimmer') {
        const [x0, y0, x1, y1] = d.at;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const p of L.items) {
          const a = Math.pow(Math.sin(drift * 1.6 + p.p) * 0.5 + 0.5, 4) * 0.5;
          if (a < 0.02) continue;
          ctx.fillStyle = 'rgba(' + d.colour + ',' + a.toFixed(3) + ')';
          const x = PX(x0 + p.x * x1), y = PY(y0 + p.y * y1);
          ctx.fillRect(x, y, PS(p.w) * (0.6 + a), Math.max(1, r.h * 0.0016));
        }
        ctx.restore();
      } else if (d.type === 'breath') {
        L.clock += 1 / 60;
        if (!reduce && L.clock > 1 / d.rate) {
          L.clock = 0;
          L.puffs.push({ x: d.at[0], y: d.at[1], t: 0, r: 0.006 + Math.random() * 0.006, vx: 0.012 + Math.random() * 0.02, vy: -0.02 });
        }
        L.puffs = L.puffs.filter((p) => p.t < d.life);
        for (const p of L.puffs) {
          p.t += 1 / 60;
          const k = p.t / d.life;
          p.x += p.vx / 60; p.y += (p.vy - d.rise * k) / 60;
          blob(ctx, PX(p.x), PY(p.y), PS(p.r + k * 0.05), d.colour, d.max * Math.sin(k * Math.PI));
        }
      } else if (L.kind === 'herd' || L.kind === 'swim') {
        for (const sp of L.items) {
          sp.t += 1 / 60;
          // the +0.2 is what lets an animal walk in from off-plate without the
          // margin being subtracted from the position the scene author wrote
          const x = ((sp.at[0] + 0.2 + sp.dir * sp.speed * sp.t) % 1.4 + 1.4) % 1.4 - 0.2;
          const bob = reduce ? 0 : Math.sin(sp.t * (Math.PI * 2 / (sp.stride || 1.2))) * (sp.bob || 0.006);
          const frames = sp.frames.filter((f) => f.ok);
          if (!frames.length) continue;
          // two decoded frames is a stride; one is a photograph that breathes
          const fi = sp.stride && frames.length > 1
            ? Math.floor((sp.t + (sp.phase || 0)) / (sp.stride / 2)) % frames.length
            : 0;
          const f = frames[fi];
          const w = PS(sp.w), h = w * (f.img.height / f.img.width);
          const fx = PX(x), fy = PY(sp.at[1] + bob);
          ctx.save();
          ctx.globalAlpha = 0.55 + 0.45 * sp.depth;
          // a wading animal is only believed if the water gives something back
          if (sp.reflect) {
            ctx.save();
            ctx.globalAlpha = 0.20;
            ctx.translate(fx, fy);
            ctx.scale(sp.dir < 0 ? -1 : 1, -0.45);
            ctx.drawImage(f.img, -w / 2, 0, w, h);
            ctx.restore();
          }
          ctx.translate(fx, fy);
          if (sp.dir < 0) ctx.scale(-1, 1);
          if (L.kind === 'swim') ctx.rotate(Math.sin(sp.t * 1.4 + (sp.phase || 0)) * 0.05);
          ctx.drawImage(f.img, -w / 2, -h, w, h);
          ctx.restore();
          // the same plate is hazier in the distance, so depth is sold with fog
          if (sp.depth < 0.5) blob(ctx, fx, fy - h * 0.4, w * 0.9, '226,238,248', 0.10);
        }
      } else if (L.kind === 'flyers') {
        for (const sp of L.items) {
          sp.t += 1 / 60;
          const x = ((sp.at[0] + sp.dir * sp.speed * sp.t) % 1.3 + 1.3) % 1.3 - 0.15;
          const y = sp.at[1] + Math.sin(sp.t * 0.9 + sp.phase) * 0.02;
          const f = sp.frames[0];
          if (!f || !f.ok) continue;
          const w = PS(sp.w), h = w * (f.img.height / f.img.width);
          const flap = reduce ? 0 : Math.sin(sp.t * 6 * sp.flap) * 0.16;
          ctx.save();
          ctx.globalAlpha = 0.65 + 0.3 * sp.depth;
          ctx.translate(PX(x), PY(y));
          if (sp.dir < 0) ctx.scale(-1, 1);
          ctx.scale(1, 1 - flap);
          ctx.drawImage(f.img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      }
    }
  }

  /** One frame of one shot. Safe to call before any asset has arrived.
   *  `backdrop: null` leaves the canvas transparent where the photograph has not
   *  decoded yet, so a page can keep its own CSS background underneath. */
  function paint(ctx, o) {
    const scene = o.scene, W = o.W, H = o.H, reduce = !!o.reduce;
    const k = Math.max(0, Math.min(1, o.k || 0));
    const passthrough = o.backdrop === null;
    ctx.clearRect(0, 0, W, H);
    if (!passthrough) {
      ctx.fillStyle = o.backdrop || '#05070c';
      ctx.fillRect(0, 0, W, H);
    }
    const e = ease(k);
    const cam = scene.camera
      ? { zoom: lerp(scene.camera.zoom, e), x: lerp(scene.camera.pan[0], e), y: lerp(scene.camera.pan[1], e) }
      : { zoom: 1.05, x: 0.5, y: 0.5 };
    if (reduce) { cam.zoom = scene.camera ? scene.camera.zoom[0] : 1.05; cam.x = 0.5; cam.y = 0.5; }
    const entry = loadPlate(scene.plate, scene.plateBase);
    const rect = plateRect(entry, cam, W, H);
    if (entry.ok) {
      ctx.drawImage(entry.img, rect.x, rect.y, rect.w, rect.h);
    } else if (!passthrough) {
      // no photograph yet: keep the layers moving so the screen is never dead
      const wash = scene.wash || ['#0a1424', '#132033'];
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, wash[0]); g.addColorStop(1, wash[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (o.layers) drawLayers(ctx, o.layers, scene, o.time || 0, W, H, reduce, rect);
    const grade = scene.grade || {};
    if (grade.tint) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = grade.amount == null ? 0.08 : grade.amount;
      ctx.fillStyle = grade.tint;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (grade.vignette) {
      const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,' + grade.vignette + ')');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }
    return rect;
  }

  /* Convenience for a page that just wants a backdrop: own the canvas, own the
   * clock. Returns a controller with .swap(scene, seed) and .stop(). */
  function stage(canvas, scene, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let layers = make(scene, opts.seed || 1), time = 0, raf = 0, alive = true, cur = scene, dur = opts.shot || 12;
    function frame() {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const reduce = opts.reduce ? opts.reduce() : (window.DUFX && window.DUFX.settings && window.DUFX.settings.reduce);
      const t = (time += reduce ? 0 : 1 / 60);
      paint(ctx, { scene: cur, layers, time: t, k: (t % dur) / dur, W: w, H: h, reduce });
    }
    frame();
    return {
      swap(scene2, seed) { cur = scene2; layers = make(scene2, seed || 1); time = 0; },
      stop() { alive = false; cancelAnimationFrame(raf); },
      get scene() { return cur; }
    };
  }

  window.DUWORLD = {
    paint, make, stage, loadPlate, loadArt, plateRect, blob, rng, ease, lerp,
    urls: { CINEMA, DINO, ART },
    /** Resolved URL for a species photograph, so DOM art and canvas agree. */
    artURL
  };
})();
