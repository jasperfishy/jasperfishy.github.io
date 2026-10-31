/* Dinosaur Universe — living backgrounds.
 *   DUFX.ambient('meadow' | 'night' | 'volcano' | 'ocean' | 'snow' | 'desert' | 'space' | 'rain' | 'storm' | 'sun' | 'rainbow' | 'fog' | 'wind')
 *   DUFX.ambient(null)   stops it.
 * One lightweight canvas behind the page. It pauses when the tab is hidden and quietly thins itself
 * out on slow devices. Nothing here ever flashes (lightning is a soft glow, never a strobe).
 */
(function () {
  'use strict';
  if (window.DUFX && window.DUFX.ambient) return;
  const DUFX = window.DUFX = window.DUFX || {};
  const TAU = Math.PI * 2, doc = document;
  const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];

  let cv = null, c = null, W = 0, H = 0, dpr = 1, raf = 0, last = 0, T = 0, theme = null, scene = null, slow = 0, quality = 1, opts = {};

  function mount(front) {
    if (!cv) {
      cv = doc.createElement('canvas'); cv.id = 'du-ambient'; cv.setAttribute('aria-hidden', 'true');
      doc.body.insertBefore(cv, doc.body.firstChild);
      c = cv.getContext('2d');
      window.addEventListener('resize', resize);
      doc.addEventListener('visibilitychange', () => { if (!doc.hidden && theme) loopStart(); });
    }
    cv.style.zIndex = front ? '5' : '-1';
    resize();
  }
  function resize() {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (theme) scene = THEMES[theme].init();
  }

  /* ----- drawing helpers ----- */
  function cloud(x, y, s, a, col) {
    c.fillStyle = col || `rgba(255,255,255,${a})`;
    c.beginPath();
    c.arc(x, y, 22 * s, 0, TAU); c.arc(x + 24 * s, y - 10 * s, 28 * s, 0, TAU); c.arc(x + 54 * s, y, 24 * s, 0, TAU); c.arc(x + 28 * s, y + 8 * s, 26 * s, 0, TAU);
    c.fill();
  }
  function glow(x, y, r, inner, outer) {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, inner); g.addColorStop(1, outer);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  function butterfly(b) {
    const flap = Math.abs(Math.sin(T * 12 + b.ph)) * .9 + .1;
    c.save(); c.translate(b.x, b.y); c.rotate(Math.sin(T * 2 + b.ph) * .25);
    c.fillStyle = b.col;
    c.beginPath(); c.ellipse(-7 * flap, -3, 8 * flap, 10, -.4, 0, TAU); c.ellipse(7 * flap, -3, 8 * flap, 10, .4, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath(); c.ellipse(-5 * flap, 6, 5 * flap, 6, -.3, 0, TAU); c.ellipse(5 * flap, 6, 5 * flap, 6, .3, 0, TAU); c.fill();
    c.fillStyle = '#3b3b3b'; c.fillRect(-1, -8, 2, 17);
    c.restore();
  }
  function wander(o, dt, speed, margin = 40) {
    o.a += (Math.sin(T * .7 + o.ph) + Math.sin(T * 1.9 + o.ph * 2) * .5) * dt * 2.2;
    o.x += Math.cos(o.a) * speed * dt; o.y += Math.sin(o.a) * speed * dt * .7;
    if (o.x < -margin) o.x = W + margin; if (o.x > W + margin) o.x = -margin;
    if (o.y < margin) { o.y = margin; o.a = Math.abs(o.a); } if (o.y > H - margin) { o.y = H - margin; o.a = -Math.abs(o.a); }
  }
  function ptero(p) {
    const flap = Math.sin(T * 5 + p.ph);
    c.save(); c.translate(p.x, p.y + Math.sin(T * 1.2 + p.ph) * 8); c.scale(p.s * p.dir, p.s);
    c.fillStyle = p.col;
    c.beginPath(); c.moveTo(-6, 0);
    c.quadraticCurveTo(-30, -20 - flap * 22, -64, -4 - flap * 26); c.quadraticCurveTo(-36, -2, -12, 8); c.fill();
    c.beginPath(); c.moveTo(6, 0);
    c.quadraticCurveTo(30, -20 - flap * 22, 64, -4 - flap * 26); c.quadraticCurveTo(36, -2, 12, 8); c.fill();
    c.beginPath(); c.ellipse(0, 4, 11, 6, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(8, 2); c.lineTo(34, 4); c.lineTo(8, 8); c.fill();
    c.beginPath(); c.moveTo(-8, 5); c.lineTo(-24, 12); c.lineTo(-8, 8); c.fill();
    c.restore();
  }

  /* ----- themes ----- */
  const THEMES = {
    meadow: {
      init() {
        return {
          clouds: Array.from({ length: 6 }, () => ({ x: rnd(W), y: rnd(20, H * .45), s: rnd(.6, 1.5), v: rnd(6, 20), a: rnd(.35, .7) })),
          bf: Array.from({ length: Math.round(5 * quality) }, () => ({ x: rnd(W), y: rnd(H * .3, H * .9), a: rnd(TAU), ph: rnd(TAU), col: pick(['#ff9fc2', '#ffd36d', '#9fd0ff', '#c8a2ff', '#ff9f6b']) })),
          seeds: Array.from({ length: Math.round(22 * quality) }, () => ({ x: rnd(W), y: rnd(H), v: rnd(10, 30), ph: rnd(TAU), r: rnd(1.5, 3.5) })),
          fly: null, next: rnd(6, 14),
        };
      },
      draw(dt) {
        const s = scene;
        glow(W * .86, 70, 130 + Math.sin(T) * 8, 'rgba(255,230,140,.55)', 'rgba(255,230,140,0)');
        c.save(); c.translate(W * .86, 70); c.rotate(T * .05); c.strokeStyle = 'rgba(255,225,120,.2)'; c.lineWidth = 6; c.lineCap = 'round';
        for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(48, 0); c.lineTo(76 + Math.sin(T * 2 + i) * 6, 0); c.stroke(); } c.restore();
        s.clouds.forEach((k) => { k.x += k.v * dt; if (k.x > W + 100) { k.x = -140; k.y = rnd(20, H * .45); } cloud(k.x, k.y, k.s, k.a); });
        s.seeds.forEach((p) => { p.y -= p.v * dt * .5; p.x += Math.sin(T + p.ph) * 14 * dt + 8 * dt; if (p.y < -10) { p.y = H + 10; p.x = rnd(W); } if (p.x > W + 10) p.x = -10; c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); });
        s.bf.forEach((b) => { wander(b, dt, 46); butterfly(b); });
        s.next -= dt;
        if (s.next <= 0 && !s.fly) { const dir = Math.random() < .5 ? 1 : -1; s.fly = { x: dir > 0 ? -80 : W + 80, y: rnd(H * .1, H * .3), dir, s: rnd(.7, 1.1), ph: rnd(TAU), col: 'rgba(60,90,100,.28)' }; s.next = rnd(12, 24); }
        if (s.fly) { s.fly.x += s.fly.dir * 90 * dt; ptero(s.fly); if (s.fly.x < -120 || s.fly.x > W + 120) s.fly = null; }
      },
    },
    night: {
      init() {
        return {
          stars: Array.from({ length: Math.round(110 * quality) }, () => ({ x: rnd(W), y: rnd(H * .85), r: rnd(.6, 2), ph: rnd(TAU), sp: rnd(1, 3) })),
          ff: Array.from({ length: Math.round(16 * quality) }, () => ({ x: rnd(W), y: rnd(H * .4, H), a: rnd(TAU), ph: rnd(TAU) })),
          shoot: null, next: rnd(4, 9),
        };
      },
      draw(dt) {
        const s = scene;
        glow(W * .14, 90, 110, 'rgba(255,248,210,.5)', 'rgba(255,248,210,0)');
        c.fillStyle = '#fff6cf'; c.beginPath(); c.arc(W * .14, 90, 34, 0, TAU); c.fill();
        c.fillStyle = 'rgba(200,190,150,.35)'; c.beginPath(); c.arc(W * .14 - 10, 82, 7, 0, TAU); c.arc(W * .14 + 12, 100, 5, 0, TAU); c.fill();
        s.stars.forEach((st) => { const a = .35 + .65 * (Math.sin(T * st.sp + st.ph) * .5 + .5); c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); c.arc(st.x, st.y, st.r, 0, TAU); c.fill(); });
        s.ff.forEach((f) => { wander(f, dt, 24); const a = .35 + .65 * (Math.sin(T * 3 + f.ph) * .5 + .5); glow(f.x, f.y, 14, `rgba(255,240,120,${a})`, 'rgba(255,240,120,0)'); c.fillStyle = `rgba(255,255,200,${a})`; c.beginPath(); c.arc(f.x, f.y, 2, 0, TAU); c.fill(); });
        s.next -= dt;
        if (s.next <= 0 && !s.shoot) { s.shoot = { x: rnd(W * .3, W), y: rnd(0, H * .3), l: 0 }; s.next = rnd(5, 11); }
        if (s.shoot) { const k = s.shoot; k.x -= 520 * dt; k.y += 240 * dt; k.l += dt; const a = Math.max(0, 1 - k.l * 1.4); c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(k.x, k.y); c.lineTo(k.x + 90, k.y - 42); c.stroke(); if (a <= 0) s.shoot = null; }
      },
    },
    volcano: {
      init() { return { em: Array.from({ length: Math.round(38 * quality) }, () => ({ x: rnd(W), y: rnd(H), v: rnd(20, 70), ph: rnd(TAU), r: rnd(1.5, 3.5) })), smoke: Array.from({ length: 7 }, (_, i) => ({ x: W * .8 + rnd(-30, 30), y: H * .5 - i * 40, r: rnd(30, 60), v: rnd(10, 26), a: rnd(.12, .22) })) }; },
      draw(dt) {
        const s = scene, g = c.createLinearGradient(0, H * .6, 0, H); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, `rgba(255,100,30,${.22 + Math.sin(T * 1.7) * .05})`); c.fillStyle = g; c.fillRect(0, H * .6, W, H * .4);
        s.smoke.forEach((m) => { m.y -= m.v * dt; m.r += 6 * dt; m.x += 6 * dt; if (m.y < -60) { m.y = H * .55; m.x = W * .8 + rnd(-30, 30); m.r = rnd(30, 60); } c.fillStyle = `rgba(110,100,100,${m.a * Math.max(0, m.y / (H * .5))})`; c.beginPath(); c.arc(m.x, m.y, m.r, 0, TAU); c.fill(); });
        c.globalCompositeOperation = 'lighter';
        s.em.forEach((e) => { e.y -= e.v * dt; e.x += Math.sin(T * 2 + e.ph) * 12 * dt; if (e.y < -10) { e.y = H + 10; e.x = rnd(W); } const a = .4 + .6 * Math.abs(Math.sin(T * 5 + e.ph)); glow(e.x, e.y, e.r * 4, `rgba(255,170,60,${a})`, 'rgba(255,80,20,0)'); });
        c.globalCompositeOperation = 'source-over';
      },
    },
    ocean: {
      init() { return { bub: Array.from({ length: Math.round(34 * quality) }, () => ({ x: rnd(W), y: rnd(H), v: rnd(20, 70), ph: rnd(TAU), r: rnd(2, 9) })), fish: Array.from({ length: 5 }, () => ({ x: rnd(W), y: rnd(H * .2, H * .85), v: rnd(30, 70) * pick([1, -1]), s: rnd(.7, 1.5), col: pick(['#ffb347', '#ff7e8b', '#7fd6ff', '#ffe066']), ph: rnd(TAU) })) }; },
      draw(dt) {
        const s = scene;
        c.save(); c.globalAlpha = .1; c.fillStyle = '#fff';
        for (let i = 0; i < 4; i++) { const x = (W * (.15 + i * .25) + Math.sin(T * .3 + i) * 50); c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 90, 0); c.lineTo(x + 20 + Math.sin(T * .4 + i) * 40, H); c.lineTo(x - 80, H); c.fill(); } c.restore();
        s.fish.forEach((f) => { f.x += f.v * dt; if (f.v > 0 && f.x > W + 60) f.x = -60; if (f.v < 0 && f.x < -60) f.x = W + 60; const d = Math.sign(f.v); c.save(); c.translate(f.x, f.y + Math.sin(T * 2 + f.ph) * 8); c.scale(f.s * d, f.s); c.fillStyle = f.col; c.globalAlpha = .55; c.beginPath(); c.ellipse(0, 0, 18, 10, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-14, 0); c.lineTo(-30, -9 + Math.sin(T * 9 + f.ph) * 4); c.lineTo(-30, 9 + Math.sin(T * 9 + f.ph) * 4); c.fill(); c.restore(); });
        s.bub.forEach((b) => { b.y -= b.v * dt; b.x += Math.sin(T * 2 + b.ph) * 14 * dt; if (b.y < -10) { b.y = H + 10; b.x = rnd(W); } c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.6; c.fillStyle = 'rgba(190,235,255,.14)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(b.x - b.r * .3, b.y - b.r * .3, b.r * .22, 0, TAU); c.fill(); });
      },
    },
    snow: {
      init() { return { fl: Array.from({ length: Math.round(90 * quality) }, () => ({ x: rnd(W), y: rnd(H), v: rnd(26, 80), ph: rnd(TAU), r: rnd(1.4, 4.2) })) }; },
      draw(dt) { scene.fl.forEach((f) => { f.y += f.v * dt; f.x += Math.sin(T * 1.2 + f.ph) * 22 * dt + 6 * dt; if (f.y > H + 6) { f.y = -6; f.x = rnd(W); } if (f.x > W + 6) f.x = -6; c.fillStyle = `rgba(255,255,255,${.5 + f.r / 9})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill(); }); },
    },
    desert: {
      init() { return { dust: Array.from({ length: Math.round(34 * quality) }, () => ({ x: rnd(W), y: rnd(H * .3, H), v: rnd(20, 70), ph: rnd(TAU), r: rnd(1, 3) })), weed: null, next: rnd(5, 10) }; },
      draw(dt) {
        const s = scene;
        glow(W * .82, 80, 160 + Math.sin(T * .8) * 10, 'rgba(255,230,150,.55)', 'rgba(255,200,100,0)');
        s.dust.forEach((d) => { d.x += d.v * dt; d.y += Math.sin(T + d.ph) * 10 * dt; if (d.x > W + 10) d.x = -10; c.fillStyle = 'rgba(235,205,150,.5)'; c.beginPath(); c.arc(d.x, d.y, d.r, 0, TAU); c.fill(); });
        s.next -= dt; if (s.next <= 0 && !s.weed) { s.weed = { x: -40, y: H - 70 }; s.next = rnd(9, 16); }
        if (s.weed) { const w = s.weed; w.x += 120 * dt; w.y = H - 70 - Math.abs(Math.sin(T * 5)) * 24; c.save(); c.translate(w.x, w.y); c.rotate(T * 5); c.strokeStyle = 'rgba(150,110,60,.65)'; c.lineWidth = 2.5; for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.beginPath(); c.arc(0, 0, 14, 0, Math.PI * 1.4); c.stroke(); } c.restore(); if (w.x > W + 50) s.weed = null; }
      },
    },
    space: {
      init() { return { st: Array.from({ length: Math.round(120 * quality) }, () => ({ x: rnd(W), y: rnd(H), z: rnd(.2, 1), ph: rnd(TAU) })), com: null, next: rnd(4, 9) }; },
      draw(dt) {
        const s = scene;
        glow(W * .2, H * .25, 90, 'rgba(160,120,255,.4)', 'rgba(160,120,255,0)'); c.fillStyle = 'rgba(190,160,255,.5)'; c.beginPath(); c.arc(W * .2, H * .25, 38, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,220,160,.55)'; c.lineWidth = 5; c.beginPath(); c.ellipse(W * .2, H * .25, 66, 14, -.3, 0, TAU); c.stroke();
        s.st.forEach((p) => { p.x -= 10 * p.z * dt * 4; if (p.x < -4) p.x = W + 4; const a = .4 + .6 * (Math.sin(T * 2 * p.z + p.ph) * .5 + .5); c.fillStyle = `rgba(255,255,255,${a * p.z})`; c.beginPath(); c.arc(p.x, p.y, p.z * 2, 0, TAU); c.fill(); });
        s.next -= dt; if (s.next <= 0 && !s.com) { s.com = { x: W + 30, y: rnd(0, H * .5) }; s.next = rnd(6, 12); }
        if (s.com) { const k = s.com; k.x -= 260 * dt; k.y += 110 * dt; const g = c.createLinearGradient(k.x, k.y, k.x + 150, k.y - 70); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(160,200,255,0)'); c.strokeStyle = g; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(k.x, k.y); c.lineTo(k.x + 150, k.y - 70); c.stroke(); glow(k.x, k.y, 10, 'rgba(255,255,255,.9)', 'rgba(255,255,255,0)'); if (k.x < -160) s.com = null; }
      },
    },
    rain: {
      init() { return { dr: Array.from({ length: Math.round(150 * quality) }, () => ({ x: rnd(W), y: rnd(H), v: rnd(520, 820), l: rnd(10, 22) })), sp: [] }; },
      draw(dt) {
        const s = scene; c.strokeStyle = 'rgba(190,220,255,.55)'; c.lineWidth = 1.8; c.lineCap = 'round';
        s.dr.forEach((d) => { d.y += d.v * dt; d.x -= 80 * dt; if (d.y > H) { if (Math.random() < .25 && s.sp.length < 40) s.sp.push({ x: d.x, y: H - 4, r: 1, a: .6 }); d.y = -20; d.x = rnd(W + 100); } c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + 4, d.y - d.l); c.stroke(); });
        for (let i = s.sp.length - 1; i >= 0; i--) { const p = s.sp[i]; p.r += 40 * dt; p.a -= 1.6 * dt; if (p.a <= 0) { s.sp.splice(i, 1); continue; } c.strokeStyle = `rgba(200,225,255,${p.a})`; c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * .3, 0, 0, TAU); c.stroke(); }
      },
    },
    storm: {
      init() { const b = THEMES.rain.init(); b.glow = 0; b.next = rnd(3, 6); b.dr.forEach((d) => { d.v *= 1.2; }); return b; },
      draw(dt) {
        const s = scene; THEMES.rain.draw(dt);
        c.fillStyle = 'rgba(40,50,80,.22)'; c.fillRect(0, 0, W, H);
        s.next -= dt; if (s.next <= 0) { s.glow = 1; s.next = rnd(4, 8); }
        if (s.glow > 0) { s.glow = Math.max(0, s.glow - dt * .9); c.fillStyle = `rgba(230,235,255,${s.glow * .16})`; c.fillRect(0, 0, W, H); }
      },
    },
    sun: {
      init() { return { clouds: Array.from({ length: 3 }, () => ({ x: rnd(W), y: rnd(30, H * .3), s: rnd(.7, 1.2), v: rnd(8, 16), a: rnd(.5, .75) })) }; },
      draw(dt) {
        glow(W * .5, 80, 260 + Math.sin(T * 1.4) * 14, 'rgba(255,230,120,.65)', 'rgba(255,230,120,0)');
        c.save(); c.translate(W * .5, 80); c.rotate(T * .1); c.strokeStyle = 'rgba(255,215,90,.35)'; c.lineWidth = 8; c.lineCap = 'round'; for (let i = 0; i < 14; i++) { c.rotate(TAU / 14); c.beginPath(); c.moveTo(70, 0); c.lineTo(110 + Math.sin(T * 2 + i) * 10, 0); c.stroke(); } c.restore();
        scene.clouds.forEach((k) => { k.x += k.v * dt; if (k.x > W + 100) k.x = -140; cloud(k.x, k.y, k.s, k.a); });
      },
    },
    rainbow: {
      init() { return { t: 0, sp: Array.from({ length: 24 }, () => ({ x: rnd(W), y: rnd(H), ph: rnd(TAU) })) }; },
      draw(dt) {
        const s = scene; s.t = Math.min(1, s.t + dt * .35); const cols = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
        c.save(); c.lineWidth = 16; c.globalAlpha = .42 * s.t;
        cols.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(W / 2, H * .85, Math.min(W * .45, H * .7) - i * 15, Math.PI, Math.PI + Math.PI * s.t); c.stroke(); }); c.restore();
        s.sp.forEach((p) => { const a = (Math.sin(T * 2 + p.ph) * .5 + .5); c.fillStyle = `rgba(255,255,255,${a * .8})`; c.beginPath(); c.arc(p.x, p.y, 2.5, 0, TAU); c.fill(); });
      },
    },
    fog: {
      init() { return { f: Array.from({ length: 6 }, () => ({ x: rnd(W), y: rnd(H * .3, H), r: rnd(120, 260), v: rnd(6, 16) })) }; },
      draw(dt) { scene.f.forEach((p) => { p.x += p.v * dt; if (p.x > W + p.r) p.x = -p.r; glow(p.x, p.y, p.r, 'rgba(235,240,245,.4)', 'rgba(235,240,245,0)'); }); },
    },
    wind: {
      init() { return { lf: Array.from({ length: Math.round(26 * quality) }, () => ({ x: rnd(W), y: rnd(H), v: rnd(140, 320), ph: rnd(TAU), e: pick(['🍃', '🍂', '🌿']), s: rnd(14, 24) })), gust: [] }; },
      draw(dt) {
        const s = scene; c.textAlign = 'center'; c.textBaseline = 'middle';
        s.lf.forEach((l) => { l.x += l.v * dt; l.y += Math.sin(T * 3 + l.ph) * 60 * dt; if (l.x > W + 20) { l.x = -20; l.y = rnd(H); } c.save(); c.translate(l.x, l.y); c.rotate(T * 3 + l.ph); c.font = l.s + 'px serif'; c.fillText(l.e, 0, 0); c.restore(); });
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.lineCap = 'round';
        for (let i = 0; i < 4; i++) { const x = ((T * 260 + i * W / 4) % (W + 200)) - 100, y = H * (.2 + i * .2) + Math.sin(T + i) * 20; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 40, y - 14, x + 80, y); c.stroke(); }
      },
    },
  };

  /* ----- loop ----- */
  function loopStart() { if (raf || !theme || doc.hidden) return; last = performance.now(); raf = requestAnimationFrame(loop); }
  function loop(t) {
    raf = 0;
    if (!theme || doc.hidden) return;
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; T += dt;
    // On slow devices, thin the scene out once rather than stuttering.
    if (dt > .034) slow++; else slow = Math.max(0, slow - 1);
    if (slow > 90 && quality > .45) { quality *= .6; slow = 0; scene = THEMES[theme].init(); }
    c.clearRect(0, 0, W, H);
    try { THEMES[theme].draw(dt); } catch (e) { theme = null; return; }
    raf = requestAnimationFrame(loop);
  }

  DUFX.ambient = function (name, o) {
    opts = o || {};
    if (!name || !THEMES[name] || (DUFX.settings && DUFX.settings.reduce)) {
      theme = null; scene = null; cancelAnimationFrame(raf); raf = 0;
      if (cv) c.clearRect(0, 0, W, H);
      return false;
    }
    if (!doc.body) { doc.addEventListener('DOMContentLoaded', () => DUFX.ambient(name, o)); return true; }
    mount(!!opts.front);
    theme = name; scene = THEMES[name].init(); T = 0; slow = 0;
    cancelAnimationFrame(raf); raf = 0; loopStart();
    return true;
  };
  DUFX.ambientThemes = Object.keys(THEMES);
  DUFX.ambientName = () => theme;
})();
