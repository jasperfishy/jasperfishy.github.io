// Dino Car Studio driving engine: a curving, hilly pseudo-3D road shared by every
// world and both play modes. The road is a loop of short segments; each frame the
// segments in front of the camera are projected to the screen, far to near.

import { SCENES } from "../data-scenes.js?v=du-2b5bf1340085b709";
import { drawCarRear } from "../render-car.js?v=du-2b5bf1340085b709";

const RACE_LAPS = 3;
const EXPLORE_GOAL = 20;
const SEG = 200;              // segment length in world units
const RUMBLE = 3;             // segments per kerb stripe
const ROAD_W = 950;           // half-width of the road
const LANES = [-0.66, 0, 0.66];
const CAM_H = 1000;
const CAM_DEPTH = 1 / Math.tan((100 / 2) * Math.PI / 180);
const PLAYER_Z = 1000;          // depth of the player's car in front of the camera
const DRAW_DIST = 160;
const CRUISE = 4300;          // world units per second
const BOOST = 6400;
const CAR_WORLD_W = 375;

const RIVALS = [
  { name: "Pip", paint: "#ff704d", head: "#6fc7c9", spike: "#3f9c9e" },
  { name: "Rexy", paint: "#8b74e8", head: "#58c26a", spike: "#439f54" },
  { name: "Zoom", paint: "#ffca52", head: "#f08a5d", spike: "#c8623a" }
];

const DECO = {
  island: ["🌴", "🌺", "🌴", "🦕", "🌴", "🐢", "🌼"],
  city: ["🏢", "🚦", "🏬", "🌳", "🦖", "🏢", "🌳"],
  mountain: ["🌲", "🌲", "🪨", "🦖", "🌲", "🐐", "🌲"],
  snow: ["🌲", "⛄", "🌲", "🐧", "🌲", "❄️", "🦕"],
  desert: ["🌵", "🌵", "🦎", "🪨", "🌵", "🐪", "🦖"],
  space: ["🪐", "🌙", "🛸", "⭐", "☄️", "🪐", "👽"]
};
const SKY = { island: ["🦋", "🐦", "🦋"], city: ["🐦", "🕊️", "🎈"], mountain: ["🦅", "🐦", "☁️"], snow: ["❄️", "🕊️", "❄️"], desert: ["🦅", "🦋", "🐦"], space: ["🛸", "✨", "☄️"] };
const GRASS = {
  island: ["#7bcb6c", "#6fbf62"], city: ["#79c278", "#6db56c"], mountain: ["#6dab6f", "#619d63"],
  snow: ["#f1fbff", "#e2f3fb"], desert: ["#efc47a", "#e5b76c"], space: ["#47397a", "#3d316c"]
};

// Each world has its own track shape: [kind, length, curve, hill]
const LAYOUTS = {
  island: [["s", 30], ["c", 40, 2], ["s", 20], ["h", 40, 0, 30], ["c", 50, -2.5], ["s", 25], ["c", 35, 1.5, -20], ["s", 30], ["c", 45, -1.5, 10]],
  city: [["s", 30], ["c", 25, 3], ["s", 25], ["c", 25, -3], ["s", 20], ["h", 30, 0, 25], ["c", 40, 2.5, -25], ["s", 30], ["c", 25, -3], ["s", 25]],
  mountain: [["s", 25], ["h", 45, 1.5, 55], ["c", 40, -3, -30], ["h", 35, 0, 40], ["c", 45, 3, -50], ["s", 25], ["c", 40, -2, -15]],
  snow: [["s", 30], ["c", 50, 1.8, 20], ["s", 25], ["c", 50, -2, -20], ["h", 40, 0, 30], ["c", 40, 2.5, -30], ["s", 30]],
  desert: [["s", 40], ["h", 30, 0, 35], ["h", 30, 0, -35], ["c", 45, -2.5], ["s", 30], ["h", 30, 1, 30], ["c", 40, 3, -30], ["s", 30]],
  space: [["s", 25], ["c", 35, 4, 40], ["c", 35, -4, -40], ["s", 20], ["h", 30, 0, 60], ["c", 40, 3, -60], ["s", 25], ["c", 30, -3.5]]
};

const ease = { in: (a, b, p) => a + (b - a) * p * p, inOut: (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5) };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ordinal = (n) => n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

export function initDrive(root, state, goHome, onComplete) {
  const canvas = root.querySelector("#driveCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const hudStars = root.querySelector("#hudStars");
  const hudProgress = root.querySelector("#hudProgress");
  const hudMsg = root.querySelector("#hudMessage");
  const FX = () => window.DUFX;
  const sfx = (n) => { try { const F = FX(); F && F.sfx && F.sfx[n] && F.sfx[n](); } catch (e) { /* sound is optional */ } };

  let segments = [], trackLength = 0;
  let scene = SCENES.island, mode = "explore";
  let raf = 0, running = false, last = 0, time = 0;
  let position = 0, speed = 0, lap = 0, playerX = 0, targetLane = 1, steerTilt = 0;
  let boostT = 0, slowT = 0, jumpT = 0, shake = 0, flash = 0, countdown = 0, lastCount = 4;
  let stars = 0, bumps = 0, collected = 0, ended = false, finishT = 0, completionSent = false, result = null;
  let rivals = [], particles = [], floaters = [], critters = [], banner = null, skyOffset = 0;

  // ---------- track ----------
  function lastY() { return segments.length ? segments[segments.length - 1].p2.world.y : 0; }
  function addSegment(curve, y) {
    const n = segments.length;
    segments.push({
      index: n, curve, sprites: [], items: [], decal: null,
      p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} },
      p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} },
      dark: Math.floor(n / RUMBLE) % 2 === 1
    });
  }
  function addRoad(enter, hold, leave, curve, height) {
    const startY = lastY(), endY = startY + height * SEG / 10, total = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(ease.in(0, curve, n / enter), ease.inOut(startY, endY, n / total));
    for (let n = 0; n < hold; n++) addSegment(curve, ease.inOut(startY, endY, (enter + n) / total));
    for (let n = 0; n < leave; n++) addSegment(ease.inOut(curve, 0, n / leave), ease.inOut(startY, endY, (enter + hold + n) / total));
  }
  function buildTrack() {
    segments = [];
    const layout = LAYOUTS[scene.id] || LAYOUTS.island;
    for (const [kind, len, curve = 0, hill = 0] of layout) {
      if (kind === "s") addRoad(0, len, 0, 0, 0);
      else { const e = Math.round(len * 0.25); addRoad(e, len - 2 * e, e, curve, hill); }
    }
    // close the loop gently back to ground level
    const back = -lastY() * 10 / SEG;
    addRoad(10, 20, 10, 0, back);
    trackLength = segments.length * SEG;
    // start/finish line and arch
    for (let i = 2; i < 4; i++) segments[i].decal = { kind: "finish" };
    segments[3].sprites.push({ kind: "arch", x: 0 });
    // roadside scenery
    const deco = DECO[scene.id] || DECO.island;
    segments.forEach((s, i) => {
      const q = Math.floor(i / 4);
      if (i % 4 === 0) s.sprites.push({ kind: "emoji", e: deco[q % deco.length], x: -1.4 - (q % 3) * 0.35, size: 560 + (q % 5) * 60 });
      if (i % 4 === 2) s.sprites.push({ kind: "emoji", e: deco[(q + 3) % deco.length], x: 1.4 + (q % 4) * 0.3, size: 560 + (q % 4) * 70 });
      const ahead = segments[(i + 15) % segments.length].curve;
      if (i % 20 === 0 && Math.abs(s.curve) < 0.2 && Math.abs(ahead) > 0.5) s.sprites.push({ kind: "sign", x: ahead > 0 ? -1.25 : 1.25, dir: Math.sign(ahead) });
    });
    placeItems();
  }

  // Items are laid out along the loop and re-armed each lap.
  function placeItems() {
    const n = segments.length;
    const safe = 24;
    let i = safe;
    let k = 0;
    while (i < n - 12) {
      const pattern = k % 6;
      if (pattern === 0 || pattern === 3) {
        // an arc of collectibles that guides you across lanes
        const from = k % 3, to = (k + 1) % 3;
        for (let j = 0; j < 5; j++) addItem(i + j * 3, "collectible", LANES[from] + (LANES[to] - LANES[from]) * (j / 4));
        i += 18;
      } else if (pattern === 1) {
        const lane = k % 3;
        addItem(i, "obstacle", LANES[lane]);
        addItem(i, "collectible", LANES[(lane + 1) % 3]);
        if (mode === "explore" && k % 4 === 1) addItem(i + 6, "golden", LANES[(lane + 2) % 3]);
        i += 14;
      } else if (pattern === 2) {
        segments[i].decal = { kind: "boost", lane: k % 3 };
        addItem(i + 5, "collectible", LANES[k % 3]);
        addItem(i + 8, "collectible", LANES[k % 3]);
        i += 16;
      } else if (pattern === 4) {
        if (mode === "race") { segments[i].decal = { kind: "ramp", lane: (k + 1) % 3 }; addItem(i + 7, "collectible", LANES[(k + 1) % 3]); }
        else addItem(i, "golden", LANES[(k + 1) % 3]);
        const lane = (k + 2) % 3;
        addItem(i + 3, "obstacle", LANES[lane]);
        i += 16;
      } else {
        for (let j = 0; j < 3; j++) addItem(i + j * 3, "collectible", LANES[k % 3]);
        i += 14;
      }
      k++;
    }
  }
  function addItem(si, kind, x) {
    const s = segments[si % segments.length];
    s.items.push({ kind, x, taken: false, lap: -1 });
  }
  function findSegment(z) { return segments[Math.floor(((z % trackLength) + trackLength) % trackLength / SEG) % segments.length]; }

  // ---------- setup ----------
  function makeCritters() {
    const kinds = SKY[scene.id] || SKY.island;
    return Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * W, y: 30 + Math.random() * (H * 0.28), vx: 12 + Math.random() * 22, ph: Math.random() * 6.3, e: kinds[i % kinds.length], s: 20 + Math.random() * 10 }));
  }
  function makeRivals() {
    return RIVALS.map((r, i) => ({
      ...r, z: PLAYER_Z + 300 + i * 380, x: LANES[[0, 2, 0][i]], targetX: LANES[[0, 2, 0][i]], lap: 0, total: PLAYER_Z + 300 + i * 380,
      speed: 0, base: CRUISE * (0.93 + i * 0.03), laneClock: 2 + i, bumpT: 0, zoomT: 0, zoomClock: 5 + i * 3,
      config: { body: "race", paint: r.paint, name: r.name, stickers: [["⭐", "⚡", "🔥"][i]] }
    }));
  }
  function reset(options = {}) {
    mode = options.mode === "race" ? "race" : "explore";
    scene = SCENES[options.scene] || SCENES.island;
    buildTrack();
    position = 0; speed = 0; lap = 0; playerX = 0; targetLane = 1; steerTilt = 0;
    boostT = 0; slowT = 0; jumpT = 0; shake = 0; flash = 0; countdown = 3.6; lastCount = 4;
    stars = 0; bumps = 0; collected = 0; ended = false; finishT = 0; completionSent = false; result = null;
    rivals = mode === "race" ? makeRivals() : [];
    particles = []; floaters = []; critters = makeCritters(); banner = null; skyOffset = 0;
    hudStars.textContent = `${scene.collectible} 0`;
    hudMsg.textContent = mode === "race" ? "Race 3 laps! Boost pads and stars make you zoom." : `Collect ${EXPLORE_GOAL} ${scene.collectible} on the road!`;
    updateHud();
  }

  // ---------- progress ----------
  // distances are measured at the player's car, which sits PLAYER_Z ahead of the camera
  const carTotal = () => lap * trackLength + position + PLAYER_Z;
  const RACE_END = () => RACE_LAPS * trackLength + PLAYER_Z;
  function place() { return 1 + rivals.filter((r) => r.total > carTotal()).length; }
  function updateHud() {
    if (mode === "race") {
      hudProgress.textContent = ended ? `Race finished · ${ordinal(result ? result.place : place())} place` : `Lap ${Math.min(RACE_LAPS, lap + 1)}/${RACE_LAPS} · ${ordinal(place())} of ${rivals.length + 1}`;
    } else {
      hudProgress.textContent = `${scene.label} · ${Math.min(collected, EXPLORE_GOAL)}/${EXPLORE_GOAL}`;
    }
  }
  function showBanner(text, color) { banner = { text, color: color || "#ffe14d", t: 0 }; }

  // ---------- effects ----------
  function puff(x, y, color, n, spd, up, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * spd;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (up || 0), life: 0.5 + Math.random() * 0.5, age: 0, color, size: (size || 5) * (0.6 + Math.random() * 0.8) });
    }
  }
  const CAR_Y = H - 92;

  // ---------- update ----------
  function step(dt) {
    particles = particles.filter((p) => { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; return p.age < p.life; });
    floaters = floaters.filter((f) => { f.t += dt; f.y -= 50 * dt; return f.t < 1.1; });
    critters.forEach((c) => { c.x += c.vx * dt; c.ph += dt * 3; if (c.x > W + 40) { c.x = -40; c.y = 30 + Math.random() * (H * 0.28); } });
    shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt * 2);
    if (banner) { banner.t += dt; if (banner.t > 1.8) banner = null; }
    if (ended) { finishT += dt; speed = Math.max(0, speed - dt * 2500); position = (position + speed * dt) % trackLength; return; }
    if (countdown > 0) {
      countdown -= dt; time += dt * 0.2;
      const n = Math.ceil(countdown - 0.6);
      if (n !== lastCount) {
        lastCount = n;
        if (n > 0) sfx("tap");
        else { sfx("win"); hudMsg.textContent = mode === "race" ? "GO GO GO! 3 laps!" : hudMsg.textContent; puff(W / 2, CAR_Y + 40, "#fff", 26, 170, 40, 6); }
      }
      return;
    }
    time += dt;

    const seg = findSegment(position + PLAYER_Z);
    const target = boostT > 0 ? BOOST : CRUISE;
    const offRoad = Math.abs(playerX) > 1.05;
    let goal = target * (slowT > 0 ? 0.62 : 1) * (offRoad ? 0.7 : 1);
    speed += (goal - speed) * Math.min(1, dt * (speed < goal ? 1.6 : 3));
    boostT = Math.max(0, boostT - dt); slowT = Math.max(0, slowT - dt);

    // steering eases toward the chosen lane; curves push gently outward
    const tx = LANES[targetLane] ?? 0;
    const pull = (tx - playerX) * Math.min(1, dt * 7);
    playerX += pull - seg.curve * (speed / CRUISE) * dt * 0.085;
    playerX = clamp(playerX, -1.25, 1.25);
    steerTilt += ((tx - playerX) * 0.35 - steerTilt) * Math.min(1, dt * 8);
    skyOffset += seg.curve * (speed / CRUISE) * dt * 0.9;

    const before = position;
    position += speed * dt;
    if (position >= trackLength) {
      position -= trackLength; lap++;
      if (mode === "race") {
        if (lap >= RACE_LAPS) { finish(); return; }
        showBanner(lap === RACE_LAPS - 1 ? "FINAL LAP!" : `LAP ${lap + 1}!`, lap === RACE_LAPS - 1 ? "#ff9a5c" : "#ffe14d");
        sfx("good");
      }
    }
    if (jumpT > 0) jumpT = Math.max(0, jumpT - dt);

    // dust and boost flames
    if (Math.random() < (boostT > 0 ? 0.9 : 0.35)) puff(W / 2 + (Math.random() - 0.5) * 80, CAR_Y + 44, boostT > 0 ? "#ffb347" : offRoad ? GRASS[scene.id][0] : "rgba(255,255,255,.7)", 1, 50, 20, boostT > 0 ? 7 : 4);

    // decals and items in the segments we just crossed
    const fromIdx = Math.floor((before + PLAYER_Z) / SEG), toIdx = Math.floor((before + speed * dt + PLAYER_Z) / SEG);
    for (let si = fromIdx; si <= toIdx; si++) {
      const s = segments[((si % segments.length) + segments.length) % segments.length];
      if (s.decal && jumpT === 0) {
        const lx = LANES[s.decal.lane];
        if (s.decal.kind === "boost" && Math.abs(playerX - lx) < 0.34) { boostT = 1.8; sfx("whoosh"); flash = 0.25; showBanner("ZOOM!", "#7de1ff"); hudMsg.textContent = "Boost pad! Zoom zoom!"; }
        if (s.decal.kind === "ramp" && Math.abs(playerX - lx) < 0.34) { jumpT = 0.95; sfx("whoosh"); stars += 2; floaters.push({ x: W / 2, y: CAR_Y - 60, t: 0, text: "Big jump! +2" }); hudMsg.textContent = "Wheee! What a jump!"; }
      }
      for (const item of s.items) {
        if (item.lap === lap) continue;
        if (Math.abs(item.x - playerX) > 0.3) continue;
        if (item.kind === "obstacle") {
          if (jumpT > 0) continue;
          item.lap = lap; bumps++; slowT = mode === "race" ? 1.0 : 0.35; shake = 10; sfx("boing");
          puff(W / 2, CAR_Y - 10, "#fff", 12, 220, 40, 5);
          hudMsg.textContent = mode === "race" ? "Bumpy! Steer around the next one." : "A little bump. Keep going!";
        } else {
          item.lap = lap;
          const worth = item.kind === "golden" ? 3 : 1;
          stars += worth; collected += worth;
          sfx(item.kind === "golden" ? "sparkle" : "star"); flash = item.kind === "golden" ? 0.5 : 0.25;
          puff(W / 2, CAR_Y - 30, item.kind === "golden" ? "#ffd700" : "#ffe14d", 16, 180, 60, 5);
          floaters.push({ x: W / 2 + (item.x - playerX) * 200, y: CAR_Y - 70, t: 0, text: `+${worth}` });
          if (mode === "race" && item.kind !== "golden") boostT = Math.max(boostT, 0.9);
          hudStars.textContent = `${scene.collectible} ${stars}`;
          if (mode === "explore") hudMsg.textContent = item.kind === "golden" ? "A golden treasure! Worth 3!" : `Lovely find! ${Math.min(collected, EXPLORE_GOAL)} of ${EXPLORE_GOAL}`;
        }
      }
    }

    // rivals: friendly dinos that keep the race close
    for (const r of rivals) {
      const gap = carTotal() - r.total;
      const band = clamp(gap / (SEG * 40), -0.25, 0.45);
      r.zoomClock -= dt; r.zoomT = Math.max(0, r.zoomT - dt);
      if (r.zoomClock <= 0) { r.zoomClock = 6 + Math.random() * 6; r.zoomT = 1.3; }
      const want = r.base * (1 + band) * (r.bumpT > 0 ? 0.7 : 1) * (r.zoomT > 0 ? 1.25 : 1);
      r.speed += (want - r.speed) * Math.min(1, dt * 1.5);
      r.bumpT = Math.max(0, r.bumpT - dt);
      r.z += r.speed * dt;
      if (r.z >= trackLength) { r.z -= trackLength; r.lap++; }
      r.total = r.lap * trackLength + r.z;
      r.laneClock -= dt;
      if (r.laneClock <= 0 && countdown <= 0) { r.laneClock = 2.5 + Math.random() * 3; r.targetX = LANES[Math.floor(Math.random() * 3)]; }
      r.x += (r.targetX - r.x) * Math.min(1, dt * 2.5);
      // a rival catching you up pulls out to overtake instead of driving through you
      const behind = carTotal() - r.total;
      if (behind > 0 && behind < SEG * 3 && Math.abs(r.x - playerX) < 0.5) {
        const yourLane = LANES.reduce((best, l, i) => Math.abs(l - playerX) < Math.abs(LANES[best] - playerX) ? i : best, 0);
        if (Math.abs(r.targetX - LANES[yourLane]) < 0.1) r.targetX = LANES[yourLane === 1 ? (Math.random() < 0.5 ? 0 : 2) : 1];
        r.speed = Math.min(r.speed, Math.max(speed, CRUISE * 0.6));
      }
      // gentle bump if you drive into a rival from behind
      const dz = r.total - (carTotal() + PLAYER_Z);
      if (jumpT === 0 && dz > 0 && dz < SEG * 1.1 && Math.abs(r.x - playerX) < 0.42 && speed > r.speed) {
        speed = r.speed * 0.85; r.bumpT = 0.4; shake = 6; sfx("boing"); hudMsg.textContent = `Beep beep! Go around ${r.name}!`;
        r.targetX = LANES[(LANES.indexOf(r.targetX) + 1) % 3] ?? 0;
      }
    }
    if (mode === "race" && rivals.length) {
      const p = place();
      if (p !== step.lastPlace && step.lastPlace && p < step.lastPlace) { floaters.push({ x: W / 2, y: CAR_Y - 110, t: 0, text: `${ordinal(p)}!` }); sfx("good"); }
      step.lastPlace = p;
    }

    updateHud();
    if (mode === "explore" && collected >= EXPLORE_GOAL) finish();
  }

  function finish() {
    if (ended) return;
    ended = true;
    const p = mode === "race" ? place() : 1;
    const bonus = mode === "race" ? Math.max(3, 15 - (p - 1) * 4) : 5;
    const reward = (mode === "race" ? Math.round(stars * 0.4) : stars) + bonus;
    const rating = mode === "race" ? (p === 1 ? 3 : p === 2 ? 2 : 1) : (bumps === 0 ? 3 : bumps <= 3 ? 2 : 1);
    const message = mode === "race" ? `${ordinal(p)} place! ${RACE_LAPS} laps complete!` : `Amazing exploring! You found every treasure on ${scene.label}!`;
    result = { place: p, reward, rating, message }; result.order = standings();
    hudMsg.textContent = mode === "race" ? `${message} +${reward} stars` : `You found every treasure! +${reward} stars`;
    updateHud(); sfx("win"); if (p === 1) setTimeout(() => sfx("roar"), 600);
    try { FX() && FX().celebrate(); } catch (e) { /* optional */ }
    if (!completionSent) { completionSent = true; onComplete({ mode, scene: scene.id, stars: reward, collectibles: collected, place: p, message }); }
  }
  function standings() {
    const order = rivals.map((r) => ({ name: r.name, config: r.config, head: r.head, spike: r.spike, total: r.total })).sort((a, b) => b.total - a.total);
    order.splice((result ? result.place : place()) - 1, 0, { name: state.config.name || "You", you: true, config: state.config });
    return order;
  }

  // ---------- projection ----------
  function project(p, camX, camY, camZ, loopZ) {
    p.camera.x = (p.world.x || 0) - camX;
    p.camera.y = p.world.y - camY;
    p.camera.z = p.world.z - camZ + loopZ;
    const scale = CAM_DEPTH / p.camera.z;
    p.screen.scale = scale;
    p.screen.x = Math.round(W / 2 + scale * p.camera.x * W / 2);
    p.screen.y = Math.round(H / 2 - scale * p.camera.y * H / 2);
    p.screen.w = Math.round(scale * ROAD_W * W / 2);
  }
  function poly(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
  }

  // ---------- draw ----------
  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    g.addColorStop(0, scene.sky[0]); g.addColorStop(1, scene.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // parallax background drawn a little higher so the road meets it at the horizon
    ctx.save(); ctx.translate(0, -H * 0.1);
    scene.far(ctx, skyOffset * 260 + time * 8, W, H);
    ctx.restore();
    ctx.fillStyle = (GRASS[scene.id] || GRASS.island)[0]; ctx.fillRect(0, H * 0.485, W, H * 0.52);
    ctx.save(); ctx.translate(0, -H * 0.1);
    scene.mid(ctx, skyOffset * 520 + time * 14, W, H);
    ctx.restore();
    ctx.textAlign = "center";
    critters.forEach((c) => { ctx.font = Math.round(c.s) + "px sans-serif"; ctx.globalAlpha = 0.9; ctx.fillText(c.e, c.x, c.y + Math.sin(c.ph) * 10); });
    ctx.globalAlpha = 1;

    const base = findSegment(position);
    const basePct = (position % SEG) / SEG;
    const playerSeg = findSegment(position + PLAYER_Z);
    const playerPct = ((position + PLAYER_Z) % SEG) / SEG;
    const playerY = playerSeg.p1.world.y + (playerSeg.p2.world.y - playerSeg.p1.world.y) * playerPct;
    let maxy = H, x = 0, dx = -(base.curve * basePct);
    const grass = GRASS[scene.id] || GRASS.island;
    const drawn = [];

    for (let n = 0; n < DRAW_DIST; n++) {
      const s = segments[(base.index + n) % segments.length];
      const loopZ = s.index < base.index ? trackLength : 0;
      s.clip = maxy;
      project(s.p1, playerX * ROAD_W - x, playerY + CAM_H, position, loopZ);
      project(s.p2, playerX * ROAD_W - x - dx, playerY + CAM_H, position, loopZ);
      x += dx; dx += s.curve;
      if (s.p1.camera.z <= CAM_DEPTH || s.p2.screen.y >= s.p1.screen.y || s.p2.screen.y >= maxy) continue;
      const p1 = s.p1.screen, p2 = s.p2.screen;
      ctx.fillStyle = s.dark ? grass[1] : grass[0];
      ctx.fillRect(0, p2.y, W, p1.y - p2.y);
      const r1 = p1.w / 6, r2 = p2.w / 6;
      const kerb = s.dark ? "#ffffff" : "#e8473c";
      poly(p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, kerb);
      poly(p1.x + p1.w + r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w + r2, p2.y, kerb);
      poly(p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, s.dark ? shadeHex(scene.road, -0.06) : scene.road);
      if (s.dark) {
        const l1 = p1.w / 28, l2 = p2.w / 28;
        for (const lx of [-1 / 3, 1 / 3]) poly(p1.x + p1.w * lx * 2 - l1, p1.y, p1.x + p1.w * lx * 2 + l1, p1.y, p2.x + p2.w * lx * 2 + l2, p2.y, p2.x + p2.w * lx * 2 - l2, p2.y, scene.roadLine);
      }
      if (s.decal) drawDecal(s, p1, p2);
      maxy = p2.y;
      drawn.push(s);
    }

    // sprites, rivals and items, far to near
    const rivalBySeg = new Map(), nearRivals = [];
    for (const r of rivals) { const rs = findSegment(r.z); if (!rivalBySeg.has(rs.index)) rivalBySeg.set(rs.index, []); rivalBySeg.get(rs.index).push(r); }
    for (let n = drawn.length - 1; n >= 0; n--) {
      const s = drawn[n], sc = s.p1.screen.scale, sx = s.p1.screen.x, sy = s.p1.screen.y;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, s.clip); ctx.clip();
      for (const sp of s.sprites) drawSprite(sp, sc, sx, sy, s.p1.screen.w);
      const itemLap = s.index < base.index ? lap + 1 : lap;
      for (const item of s.items) if (item.lap !== itemLap) drawItem(item, sc, sx, sy, s.p1.screen.w, s.index);
      const rs = rivalBySeg.get(s.index);
      if (rs) rs.forEach((r) => { if (r.total >= carTotal() - SEG * 0.5) drawRival(r, sc, sx, sy, s.p1.screen.w); else nearRivals.push([r, sc, sx, sy, s.p1.screen.w]); });
      ctx.restore();
    }

    drawPlayer();
    nearRivals.forEach((args) => drawRival(...args));
    for (const p of particles) {
      const a = 1 - p.age / p.life; ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.6), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (boostT > 0) speedLines();
    floaters.forEach((f) => { ctx.globalAlpha = Math.max(0, 1 - f.t); outlined(f.text, f.x, f.y, Math.round(28 + f.t * 8), "#ffe14d"); });
    ctx.globalAlpha = 1;
    if (flash > 0) { ctx.fillStyle = `rgba(255,246,170,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
    if (mode === "race") drawRaceBar();
    else drawExploreBar();
    if (countdown > 0) drawLights();
    if (banner) drawBanner();
    if (ended) drawFinish();
    ctx.restore();
  }

  function outlined(text, x, y, size, fill, stroke) {
    ctx.font = `900 ${size}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(4, size / 6); ctx.strokeStyle = stroke || "#17403a"; ctx.strokeText(text, x, y);
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }

  function laneEdges(p1, p2, lx) {
    const half = 0.27;
    return [p1.x + p1.w * (lx - half), p1.x + p1.w * (lx + half), p2.x + p2.w * (lx + half), p2.x + p2.w * (lx - half)];
  }
  function drawDecal(s, p1, p2) {
    const d = s.decal;
    if (d.kind === "finish") {
      const cells = 8;
      for (let c = 0; c < cells; c++) for (let row = 0; row < 2; row++) {
        const u0 = -1 + (2 * c) / cells, u1 = -1 + (2 * (c + 1)) / cells;
        const ya = p1.y + (p2.y - p1.y) * (row / 2), yb = p1.y + (p2.y - p1.y) * ((row + 1) / 2);
        const wa = p1.w + (p2.w - p1.w) * (row / 2), wb = p1.w + (p2.w - p1.w) * ((row + 1) / 2);
        const xa = p1.x + (p2.x - p1.x) * (row / 2), xb = p1.x + (p2.x - p1.x) * ((row + 1) / 2);
        poly(xa + wa * u0, ya, xa + wa * u1, ya, xb + wb * u1, yb, xb + wb * u0, yb, (c + row + (s.index % 2)) % 2 ? "#222" : "#fff");
      }
      return;
    }
    const [a, b, c, e] = laneEdges(p1, p2, LANES[d.lane]);
    if (d.kind === "boost") {
      poly(a, p1.y, b, p1.y, c, p2.y, e, p2.y, "rgba(70,215,255,.85)");
      const mid = (p1.y + p2.y) / 2, cx1 = (a + b) / 2, cx2 = (c + e) / 2, cxm = (cx1 + cx2) / 2, w = (b - a) * 0.32;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(2, (p1.y - p2.y) * 0.25);
      ctx.beginPath(); ctx.moveTo(cx1 - w, p1.y - 1); ctx.lineTo(cxm, mid); ctx.lineTo(cx1 + w, p1.y - 1); ctx.stroke();
    } else if (d.kind === "ramp") {
      poly(a, p1.y, b, p1.y, c, p2.y - (p1.y - p2.y) * 0.8, e, p2.y - (p1.y - p2.y) * 0.8, "#ffcc33");
      const stripes = 4;
      for (let i = 0; i < stripes; i += 2) {
        const u0 = i / stripes, u1 = (i + 1) / stripes;
        poly(a + (b - a) * u0, p1.y, a + (b - a) * u1, p1.y, e + (c - e) * u1, p2.y - (p1.y - p2.y) * 0.8, e + (c - e) * u0, p2.y - (p1.y - p2.y) * 0.8, "#2b2b2b");
      }
    }
  }

  function drawSprite(sp, sc, sx, sy, sw) {
    const px = sx + sw * sp.x;
    if (sp.kind === "emoji") {
      const size = Math.min(sc * sp.size * W / 2, 250);
      if (size < 4) return;
      ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.beginPath(); ctx.ellipse(px, sy, size * 0.32, size * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      ctx.font = Math.round(size) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#000";
      ctx.fillText(sp.e, px, sy);
    } else if (sp.kind === "arch") {
      const left = sx - sw * 1.12, right = sx + sw * 1.12, top = sy - sc * 1250 * W / 2, post = Math.max(3, sw * 0.05);
      ctx.fillStyle = "#e8473c"; ctx.fillRect(left - post / 2, top, post, sy - top); ctx.fillRect(right - post / 2, top, post, sy - top);
      const bh = Math.max(6, sc * 260 * W / 2);
      const cells = 12;
      for (let c = 0; c < cells; c++) for (let row = 0; row < 2; row++) {
        ctx.fillStyle = (c + row) % 2 ? "#222" : "#fff";
        ctx.fillRect(left + (right - left) * (c / cells), top + (bh / 2) * row, (right - left) / cells + 1, bh / 2 + 1);
      }
      if (bh > 14) { const fs = Math.round(bh * 0.55); ctx.fillStyle = "#e8473c"; ctx.fillRect(sx - fs * 2.6, top + bh, fs * 5.2, fs * 1.2); outlined(mode === "race" ? "FINISH" : "START", sx, top + bh + fs, fs, "#fff", "#7a1d18"); }
    } else if (sp.kind === "sign") {
      const size = sc * 420 * W / 2;
      if (size < 6) return;
      ctx.fillStyle = "#7a5a3a"; ctx.fillRect(px - size * 0.04, sy - size * 0.9, size * 0.08, size * 0.9);
      ctx.fillStyle = "#ffcc33"; ctx.strokeStyle = "#2b2b2b"; ctx.lineWidth = Math.max(1, size * 0.04);
      ctx.beginPath(); ctx.rect(px - size * 0.45, sy - size * 1.3, size * 0.9, size * 0.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#2b2b2b"; ctx.font = `900 ${Math.round(size * 0.4)}px system-ui, sans-serif`; ctx.textAlign = "center";
      ctx.fillText(sp.dir < 0 ? "◀◀" : sp.dir > 0 ? "▶▶" : "▲", px, sy - size * 0.91);
    }
  }

  function drawItem(item, sc, sx, sy, sw, segIndex) {
    const px = sx + sw * item.x;
    const bob = Math.sin(time * 6 + segIndex) * sc * 40 * W / 2;
    if (item.kind === "obstacle") {
      const size = sc * 300 * W / 2;
      if (size < 4) return;
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(px, sy, size * 0.5, size * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      // warning ring makes obstacles easy to spot from far away
      ctx.strokeStyle = "rgba(255,80,60,.85)"; ctx.lineWidth = Math.max(2, size * 0.06);
      ctx.beginPath(); ctx.ellipse(px, sy - size * 0.02, size * 0.62, size * 0.16, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.font = Math.round(size) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#000";
      ctx.fillText(scene.obstacle, px, sy - size * 0.05);
      return;
    }
    const golden = item.kind === "golden";
    const size = sc * (golden ? 300 : 240) * W / 2;
    if (size < 3) return;
    const cy = sy - size * 0.75 + bob, r = size * 0.55 * (1 + Math.sin(time * 7 + segIndex) * 0.06);
    const grad = ctx.createRadialGradient(px, cy, 1, px, cy, r * 1.5);
    grad.addColorStop(0, "rgba(255,255,255,.95)"); grad.addColorStop(0.5, golden ? "rgba(255,215,0,.85)" : "rgba(255,240,150,.7)"); grad.addColorStop(1, "rgba(255,220,80,0)");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(px, cy, r * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = golden ? "#ff9d00" : "rgba(255,170,0,.95)"; ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.beginPath(); ctx.arc(px, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.font = Math.round(size * 0.8) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#000";
    ctx.fillText(golden ? "👑" : scene.collectible, px, cy + size * 0.28);
  }

  function drawRival(r, sc, sx, sy, sw) {
    const px = sx + sw * r.x, k = (sc * CAR_WORLD_W * W / 2) / 140;
    if (k < 0.08) return;
    drawCarRear(ctx, r.config, px, sy - 46 * k, k, 0, { t: time + r.base, spin: time * 3, head: r.head, spike: r.spike });
    if (k > 0.22) outlined(r.name, px, sy - 110 * k, Math.max(12, Math.round(26 * k)), "#fff");
  }

  function drawPlayer() {
    const jump = jumpT > 0 ? Math.sin((1 - jumpT / 0.95) * Math.PI) * 70 : 0;
    const bounce = countdown > 0 ? 0 : Math.sin(time * 16) * 1.5;
    if (jump > 0) { ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(W / 2, CAR_Y + 46, 60 - jump * 0.3, 9, 0, 0, Math.PI * 2); ctx.fill(); }
    drawCarRear(ctx, state.config, W / 2, CAR_Y + bounce - jump, 1.08, steerTilt * 0.25, { t: time, spin: time * (boostT > 0 ? 6 : 3), brake: slowT > 0 });
    if (boostT > 0) {
      for (const fx of [-30, 30]) {
        ctx.fillStyle = "rgba(255,150,40,.9)"; ctx.beginPath(); ctx.moveTo(W / 2 + fx - 10, CAR_Y + 40 - jump); ctx.lineTo(W / 2 + fx, CAR_Y + 66 + Math.random() * 18 - jump); ctx.lineTo(W / 2 + fx + 10, CAR_Y + 40 - jump); ctx.fill();
        ctx.fillStyle = "rgba(255,240,120,.9)"; ctx.beginPath(); ctx.moveTo(W / 2 + fx - 5, CAR_Y + 40 - jump); ctx.lineTo(W / 2 + fx, CAR_Y + 54 + Math.random() * 8 - jump); ctx.lineTo(W / 2 + fx + 5, CAR_Y + 40 - jump); ctx.fill();
      }
    }
  }

  function speedLines() {
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i * 97.3 + time * 500) % 360 * Math.PI / 180, x0 = W / 2 + Math.cos(a) * 300, y0 = H * 0.45 + Math.sin(a) * 150;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(W / 2 + Math.cos(a) * 480, H * 0.45 + Math.sin(a) * 260); ctx.stroke();
    }
  }

  function headDot(x, y, color, label, you) {
    ctx.fillStyle = color; ctx.strokeStyle = you ? "#fff" : "#17403a"; ctx.lineWidth = you ? 4 : 2.5;
    ctx.beginPath(); ctx.arc(x, y, you ? 15 : 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = `900 ${you ? 14 : 12}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.fillText(label, x, y + 5);
  }
  function drawRaceBar() {
    const x0 = W * 0.2, x1 = W * 0.8, y = 30, total = RACE_LAPS * trackLength;
    ctx.fillStyle = "rgba(23,64,58,.55)"; roundRect(x0 - 16, y - 16, x1 - x0 + 46, 32, 16); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.85)"; roundRect(x0, y - 4, x1 - x0, 8, 4); ctx.fill();
    for (let l = 1; l < RACE_LAPS; l++) { ctx.fillStyle = "rgba(23,64,58,.5)"; ctx.fillRect(x0 + (x1 - x0) * l / RACE_LAPS - 1, y - 8, 3, 16); }
    ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🏁", x1 + 16, y + 8);
    rivals.forEach((r) => headDot(x0 + (x1 - x0) * clamp(r.total / total, 0, 1), y, r.paint, r.name[0], false));
    headDot(x0 + (x1 - x0) * clamp(carTotal() / total, 0, 1), y, state.config.paint || "#e74c3c", "★", true);
    if (countdown <= 0 && !ended) outlined(ordinal(place()), 56, 62, 44, place() === 1 ? "#ffe14d" : "#fff");
  }
  function drawExploreBar() {
    const x0 = W * 0.25, x1 = W * 0.75, y = 30, pct = clamp(collected / EXPLORE_GOAL, 0, 1);
    ctx.fillStyle = "rgba(23,64,58,.55)"; roundRect(x0 - 16, y - 16, x1 - x0 + 46, 32, 16); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.85)"; roundRect(x0, y - 6, x1 - x0, 12, 6); ctx.fill();
    ctx.fillStyle = "#ffcf3f"; roundRect(x0, y - 6, Math.max(12, (x1 - x0) * pct), 12, 6); ctx.fill();
    ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🎁", x1 + 16, y + 8);
  }
  function drawLights() {
    const n = Math.ceil(countdown - 0.6), cx = W / 2, cy = H * 0.3;
    ctx.fillStyle = "#2b2b2b"; roundRect(cx - 120, cy - 40, 240, 80, 20); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const lit = n <= 0 ? "green" : (3 - n) >= i ? "red" : "off";
      ctx.fillStyle = lit === "green" ? "#4dff6a" : lit === "red" ? "#ff4040" : "#555";
      ctx.beginPath(); ctx.arc(cx - 70 + i * 70, cy, 26, 0, Math.PI * 2); ctx.fill();
      if (lit !== "off") { ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.arc(cx - 78 + i * 70, cy - 8, 8, 0, Math.PI * 2); ctx.fill(); }
    }
    outlined(n > 0 ? String(n) : "GO!", cx, cy + 112, 72, n > 0 ? "#fff" : "#7dff8a");
  }
  function drawBanner() {
    const t = banner.t, pop = Math.min(1, t * 4), fade = t > 1.3 ? Math.max(0, 1 - (t - 1.3) * 2) : 1;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(W / 2, H * 0.36); ctx.scale(0.5 + pop * 0.5, 0.5 + pop * 0.5);
    outlined(banner.text, 0, 0, 82, banner.color); ctx.restore();
  }

  function drawFinish() {
    const fade = Math.min(1, finishT * 2.5);
    ctx.fillStyle = `rgba(20,32,54,${0.7 * fade})`; ctx.fillRect(0, 0, W, H);
    const pop = Math.min(1, finishT * 3);
    ctx.save(); ctx.globalAlpha = pop;
    if (mode === "race") {
      outlined(result.place === 1 ? "YOU WON!" : `${ordinal(result.place)} PLACE!`, W / 2, 78, 54, "#ffe14d");
      // podium: 2nd, 1st, 3rd
      const slots = [{ rank: 2, x: W / 2 - 190, h: 90 }, { rank: 1, x: W / 2, h: 130 }, { rank: 3, x: W / 2 + 190, h: 64 }];
      const order = result.order;
      slots.forEach((slot) => {
        const racer = order[slot.rank - 1]; if (!racer) return;
        const rise = Math.min(1, Math.max(0, (finishT - 0.3 - (3 - slot.rank) * 0.25) * 3)), top = H - 70 - slot.h * rise;
        ctx.fillStyle = slot.rank === 1 ? "#ffcf3f" : slot.rank === 2 ? "#cfd8e3" : "#e3a36b";
        roundRect(slot.x - 80, top, 160, H - 70 - top + 40, 12); ctx.fill();
        outlined(String(slot.rank), slot.x, top + 46, 40, "#fff");
        const hop = slot.rank === 1 ? Math.abs(Math.sin(finishT * 5)) * 10 : 0;
        drawCarRear(ctx, racer.config, slot.x, top - 52 - hop, 0.78, 0, { t: finishT, head: racer.head, spike: racer.spike });
        outlined(racer.you ? (state.config.name || "You") : racer.name, slot.x, top - 118 - hop, 22, racer.you ? "#ffe14d" : "#fff");
      });
    } else {
      outlined(`Postcard from ${scene.label}!`, W / 2, 96, 44, "#ffe14d");
      ctx.fillStyle = "#fffdf4"; roundRect(W / 2 - 270, 130, 540, 220, 16); ctx.fill();
      ctx.strokeStyle = "#e8c36a"; ctx.lineWidth = 6; roundRect(W / 2 - 260, 140, 520, 200, 12); ctx.stroke();
      const g = ctx.createLinearGradient(0, 150, 0, 330); g.addColorStop(0, scene.sky[0]); g.addColorStop(1, scene.sky[1]);
      ctx.fillStyle = g; roundRect(W / 2 - 250, 150, 260, 180, 8); ctx.fill();
      ctx.fillStyle = (GRASS[scene.id] || GRASS.island)[0]; ctx.fillRect(W / 2 - 250, 270, 260, 60);
      drawCarRear(ctx, state.config, W / 2 - 120, 268, 0.62, 0, { t: finishT });
      ctx.font = "34px sans-serif"; ctx.textAlign = "center"; ctx.fillText((DECO[scene.id] || DECO.island)[0], W / 2 - 210, 300); ctx.fillText(scene.collectible, W / 2 - 50, 190);
      ctx.fillStyle = "#4a3a20"; ctx.textAlign = "left";
      const lines = ["Dear grown-ups,", `I found ${collected} treasures`, `on ${scene.label}!`, "Love from", `${state.config.name || "your dino driver"} 🦖`];
      lines.forEach((line, i) => {
        let fs = 18; ctx.font = `bold ${fs}px system-ui, sans-serif`;
        while (fs > 11 && ctx.measureText(line).width > 225) { fs--; ctx.font = `bold ${fs}px system-ui, sans-serif`; }
        ctx.fillText(line, W / 2 + 28, 184 + i * 30);
      });
    }
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      const t = clamp((finishT - 0.9 - i * 0.35) * 3, 0, 1), lit = i < result.rating;
      if (lit && t > 0 && !drawFinish["s" + i]) { drawFinish["s" + i] = true; sfx("star"); }
      ctx.globalAlpha = lit ? t : Math.min(0.35, t);
      ctx.font = Math.round(54 * (0.4 + 0.6 * t)) + "px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(lit ? "⭐" : "☆", W / 2 + (i - 1) * 70, mode === "race" ? 140 : 400);
    }
    ctx.globalAlpha = Math.min(1, Math.max(0, finishT - 1.8));
    ctx.fillStyle = "#fff"; ctx.font = "bold 20px system-ui, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`+${result.reward} stars · tap to play again`, W / 2, mode === "race" ? 176 : 440);
    ctx.globalAlpha = 1;
    if (finishT < 0.05) drawFinish.s0 = drawFinish.s1 = drawFinish.s2 = false;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---------- loop ----------
  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    step(dt); draw();
    if (running) raf = requestAnimationFrame(loop);
  }
  let lastOptions = {};
  function start(options = {}) {
    stop(); lastOptions = options; reset(options);
    step.lastPlace = 0;
    running = true; last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function steer(dir) { targetLane = clamp(targetLane + dir, 0, 2); sfx("tap"); }
  root.querySelector("#btnLeft").addEventListener("pointerdown", (e) => { e.preventDefault(); if (running && !ended) steer(-1); });
  root.querySelector("#btnRight").addEventListener("pointerdown", (e) => { e.preventDefault(); if (running && !ended) steer(1); });
  window.addEventListener("keydown", (e) => {
    if (!running || ended) return;
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") { e.preventDefault(); steer(-1); }
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") { e.preventDefault(); steer(1); }
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (!running) return;
    if (ended) { if (finishT > 1.5) start(lastOptions); return; }
    const rect = canvas.getBoundingClientRect(), px = (e.clientX - rect.left) * (W / rect.width);
    // tap the left, middle or right of the road to pick a lane
    targetLane = px < W * 0.38 ? 0 : px > W * 0.62 ? 2 : 1;
    if (targetLane !== 1) sfx("tap");
  });

  return { start, stop, goHome };
}

function shadeHex(hex, amt) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  return "#" + [m[1], m[2], m[3]].map((v) => { const n = parseInt(v, 16); const o = amt < 0 ? n * (1 + amt) : n + (255 - n) * amt; return clamp(Math.round(o), 0, 255).toString(16).padStart(2, "0"); }).join("");
}
