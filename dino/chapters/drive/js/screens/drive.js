// Shared arcade driving loop for every world and both play modes.

import { CARS } from "../data-cars.js";
import { SCENES } from "../data-scenes.js";
import { drawCarCanvas } from "../render-car.js";

const RACE_LAPS = 3;
const LAP_LENGTH = 2300;
const EXPLORE_GOAL = 20;

export function initDrive(root, state, goHome, onComplete) {
  const canvas = root.querySelector("#driveCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const hudStars = root.querySelector("#hudStars");
  const hudProgress = root.querySelector("#hudProgress");
  const hudMsg = root.querySelector("#hudMessage");

  let raf = 0;
  let running = false;
  let time = 0;
  let stars = 0;
  let ended = false;
  let mode = "explore";
  let scene = SCENES.island;
  let distance = 0;
  let boostSeconds = 0;
  let slowSeconds = 0;
  let completionSent = false;
  let spawnClock = 0;
  let items = [];
  let rivals = [];
  let particles = [], countdown = 0, shake = 0, lastCount = 4, dustClock = 0, flash = 0;
  const FX = () => window.DUFX;
  const sfx = (n) => { try { const F = FX(); F && F.sfx && F.sfx[n] && F.sfx[n](); } catch (e) { /* sound is optional */ } };
  const HORIZON_W = 0.2;
  const tAt = (y) => Math.max(0, Math.min(1, (y - ROAD_TOP) / (H - ROAD_TOP)));
  const xAt = (y, u) => W / 2 + (u - 0.5) * roadWidth * (HORIZON_W + (1 - HORIZON_W) * tAt(y));
  const playerU = () => (player.x - roadLeft) / roadWidth;
  function puff(x, y, color, n, speed, up, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * speed;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (up || 0), life: 0.5 + Math.random() * 0.5, age: 0, color, size: (size || 5) * (0.6 + Math.random() * 0.8) });
    }
  }

  const player = { x: W / 2, targetX: W / 2, tilt: 0 };
  const ROAD_TOP = H * 0.5;
  const roadLeft = W * 0.1;
  const roadWidth = W * 0.8;

  function reset(options = {}) {
    mode = options.mode === "race" ? "race" : "explore";
    scene = SCENES[options.scene] || SCENES.island;
    time = 0; stars = 0; ended = false; distance = 0; boostSeconds = 0; slowSeconds = 0;
    completionSent = false; spawnClock = 0; items = []; particles = []; countdown = 3.4; shake = 0; lastCount = 4; flash = 0;
    player.x = W / 2; player.targetX = W / 2; player.tilt = 0;
    hudStars.textContent = "⭐ 0";
    hudMsg.textContent = mode === "race" ? "Race 3 laps! Stars give you a boost." : `Collect ${EXPLORE_GOAL} ${scene.collectible} on the road!`;
    rivals = mode === "race" ? makeRivals() : [];
    updateProgress();
  }

  function makeRivals() {
    const colors = ["#ff704d", "#8b74e8", "#ffca52"];
    return colors.map((color, index) => {
      const rivalCar = CARS[(index * 9 + 6) % CARS.length];
      return {
        name: ["Pip", "Rexy", "Zoom"][index],
        x: roadLeft + roadWidth * (0.25 + index * 0.25),
        progress: 60 + Math.random() * 220,
        speed: 154 + Math.random() * 24,
        config: { body: rivalCar.body, paint: colors[index], name: "", stickers: ["⭐"] }
      };
    });
  }

  function updateProgress() {
    if (mode === "race") {
      const place = 1 + rivals.filter(rival => rival.progress > distance).length;
      const lap = Math.min(RACE_LAPS, Math.floor(distance / LAP_LENGTH) + 1);
      hudProgress.textContent = ended ? `Race finished · ${ordinal(place)} place` : `Lap ${lap}/${RACE_LAPS} · ${ordinal(place)} of ${rivals.length + 1}`;
    } else {
      hudProgress.textContent = `${scene.label} · ${Math.min(stars, EXPLORE_GOAL)}/${EXPLORE_GOAL}`;
    }
  }

  function spawnItem() {
    const isCollectible = Math.random() < 0.76;
    items.push({
      u: 0.12 + Math.random() * 0.76,
      y: ROAD_TOP + 2,
      vy: 120 + Math.random() * 30,
      kind: isCollectible ? "collectible" : "obstacle",
      taken: false
    });
  }

  function step(dt) {
    particles = particles.filter((p) => { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; return p.age < p.life; });
    shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt * 2);
    if (ended) return;
    if (countdown > 0) {
      countdown -= dt;
      const n = Math.ceil(countdown - 0.4);
      if (n !== lastCount) { lastCount = n; sfx(n > 0 ? 'tap' : 'win'); if (n <= 0) { hudMsg.textContent = mode === 'race' ? 'GO GO GO! 3 laps!' : hudMsg.textContent; puff(player.x, H - 80, '#fff', 24, 160, 40, 6); } }
      time += dt * 0.3;
      return;
    }
    time += dt;
    dustClock += dt;
    if (dustClock > (boostSeconds > 0 ? 0.03 : 0.07)) { dustClock = 0; puff(player.x + (Math.random() - 0.5) * 40, H - 62, boostSeconds > 0 ? '#ffb347' : scene.roadLine, 1, 40, 20, boostSeconds > 0 ? 7 : 4); }
    player.x += (player.targetX - player.x) * Math.min(1, dt * 6);
    player.x = Math.max(roadLeft + 48, Math.min(roadLeft + roadWidth - 48, player.x));
    player.tilt = (player.targetX - player.x) * 0.0015;
    if (Math.abs(player.targetX - player.x) < 1) player.targetX = player.x;

    spawnClock += dt;
    const spawnRate = mode === "race" ? 0.85 : 0.7;
    if (spawnClock >= spawnRate) { spawnClock = 0; spawnItem(); }

    boostSeconds = Math.max(0, boostSeconds - dt);
    slowSeconds = Math.max(0, slowSeconds - dt);
    const playerSpeed = (mode === "race" ? 164 : 172) + (boostSeconds > 0 ? 58 : 0) - (slowSeconds > 0 ? 45 : 0);
    if (mode === "race") {
      distance += playerSpeed * dt;
      rivals.forEach(rival => { rival.progress += rival.speed * dt; });
    }

    for (const item of items) {
      item.y += item.vy * dt * (0.55 + tAt(item.y) * 1.5);
      item.x = xAt(item.y, item.u);
      const nearCar = Math.abs(item.u - playerU()) < 0.085 && item.y > H - 150 && item.y < H - 80;
      if (!item.taken && nearCar) {
        item.taken = true;
        if (item.kind === "collectible") {
          stars++; puff(item.x, item.y - 20, '#ffe14d', 16, 170, 60, 5); sfx('sparkle'); flash = 0.35;
          boostSeconds = mode === "race" ? 2.5 : 0;
          hudStars.textContent = `${scene.collectible} ${stars}`;
          hudMsg.textContent = mode === "race" ? "Dino boost! Zoom ahead!" : `Lovely find! ${stars} of ${EXPLORE_GOAL}`;
        } else {
          slowSeconds = mode === "race" ? 1.2 : 0.25; shake = 10; puff(item.x, item.y - 20, '#fff', 10, 200, 40, 5); sfx('boing');
          for (let i = 0; i < 5; i++) particles.push({ x: player.x + (i - 2) * 14, y: H - 190, vx: (i - 2) * 25, vy: -60, life: 1, age: 0, color: '#ffd23f', size: 7, star: true });
          hudMsg.textContent = mode === "race" ? "Bumpy! Steer around the next one." : "A little bump—keep going!";
        }
      }
    }
    items = items.filter(item => item.y <= H + 24);
    updateProgress();

    if (mode === "explore" && stars >= EXPLORE_GOAL) finish();
    if (mode === "race" && distance >= RACE_LAPS * LAP_LENGTH) finish();
  }

  function finish() {
    if (ended) return;
    ended = true;
    const place = 1 + rivals.filter(rival => rival.progress > distance).length;
    const bonus = mode === "race" ? Math.max(3, 15 - (place - 1) * 4) : 5;
    const reward = stars + bonus;
    const message = mode === "race" ? `${ordinal(place)} place! ${RACE_LAPS} laps complete!` : "Amazing exploring! You found every treasure!";
    hudMsg.textContent = `${message} +${reward} stars`;
    updateProgress(); sfx("win"); try { FX() && FX().celebrate(); } catch (e) { /* optional */ }
    if (!completionSent) {
      completionSent = true;
      onComplete({ mode, scene: scene.id, stars: reward, collectibles: stars, place, message });
    }
  }

  function draw() {
    ctx.save(); if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, scene.sky[0]);
    gradient.addColorStop(1, scene.sky[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    scene.far(ctx, time * 100, W, H);
    ctx.fillStyle = scene.ground;
    ctx.fillRect(0, ROAD_TOP - 10, W, H - ROAD_TOP + 10);
    scene.mid(ctx, time * 100, W, H);
    ctx.fillStyle = scene.road;
    ctx.beginPath();
    ctx.moveTo(xAt(ROAD_TOP, 0), ROAD_TOP); ctx.lineTo(xAt(ROAD_TOP, 1), ROAD_TOP); ctx.lineTo(xAt(H, 1), H); ctx.lineTo(xAt(H, 0), H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = scene.roadLine; ctx.lineWidth = 7;
    for (const u of [0, 1]) { ctx.beginPath(); ctx.moveTo(xAt(ROAD_TOP, u), ROAD_TOP); ctx.lineTo(xAt(H, u), H); ctx.stroke(); }
    // dashes rush toward the camera
    ctx.fillStyle = scene.roadLine;
    const speedK = time * (boostSeconds > 0 ? 2.6 : 1.7);
    for (let i = 0; i < 12; i++) {
      const t0 = ((i / 12 + speedK) % 1), t1 = t0 + 0.04;
      const y0 = ROAD_TOP + Math.pow(t0, 1.9) * (H - ROAD_TOP), y1 = ROAD_TOP + Math.pow(Math.min(1, t1), 1.9) * (H - ROAD_TOP);
      for (const u of [0.335, 0.665]) {
        const w0 = 2 + 8 * tAt(y0);
        ctx.beginPath(); ctx.moveTo(xAt(y0, u) - w0 / 2, y0); ctx.lineTo(xAt(y0, u) + w0 / 2, y0); ctx.lineTo(xAt(y1, u) + w0, y1); ctx.lineTo(xAt(y1, u) - w0, y1); ctx.closePath(); ctx.fill();
      }
    }

    if (mode === "race") drawRivals();
    for (const item of items) {
      if (item.taken) continue;
      const k = 0.35 + tAt(item.y) * 0.95, bob = item.kind === "collectible" ? Math.sin(time * 6 + item.u * 9) * 4 * k : 0;
      ctx.font = Math.round(36 * k) + "px sans-serif";
      ctx.textAlign = "center";
      if (item.kind === "collectible") { ctx.shadowColor = "#fff6a0"; ctx.shadowBlur = 14 * k; }
      ctx.fillText(item.kind === "collectible" ? scene.collectible : scene.obstacle, item.x, item.y + bob);
      ctx.shadowBlur = 0;
    }
    if (boostSeconds > 0) {
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 3;
      for (let i = 0; i < 14; i++) { const a = (i * 97.3 + time * 400) % 360, x0 = W / 2 + Math.cos(a) * 160, y0 = H * 0.62 + Math.sin(a) * 90; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(W / 2 + Math.cos(a) * 330, H * 0.62 + Math.sin(a) * 190); ctx.stroke(); }
    }
    const bounce = Math.sin(time * 14) * (countdown > 0 ? 0 : 1.6);
    drawCarCanvas(ctx, state.config, player.x, H - 110 + bounce, 1.1, player.tilt);
    drawDino(ctx, player.x, H - 150 + bounce, time);
    if (boostSeconds > 0) { ctx.fillStyle = "rgba(255,150,40,.85)"; ctx.beginPath(); ctx.moveTo(player.x - 14, H - 62); ctx.lineTo(player.x, H - 62 + 26 + Math.random() * 14); ctx.lineTo(player.x + 14, H - 62); ctx.fill(); }
    for (const p of particles) {
      const a = 1 - p.age / p.life; ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = p.color;
      if (p.star) { ctx.font = Math.round(p.size * 3) + "px sans-serif"; ctx.fillText("⭐", p.x, p.y); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.6), 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (flash > 0) { ctx.fillStyle = "rgba(255,246,170," + (flash * 0.35) + ")"; ctx.fillRect(0, 0, W, H); }
    if (countdown > 0) {
      const n = Math.ceil(countdown - 0.4), txt = n > 0 ? String(n) : "GO!", frac = (countdown - 0.4) % 1;
      ctx.save(); ctx.translate(W / 2, H * 0.36); ctx.scale(1 + (1 - frac) * 0.35, 1 + (1 - frac) * 0.35);
      ctx.textAlign = "center"; ctx.font = "bold 120px system-ui, sans-serif"; ctx.lineWidth = 12; ctx.strokeStyle = "#17403a"; ctx.fillStyle = n > 0 ? "#fff" : "#ffe14d";
      ctx.strokeText(txt, 0, 0); ctx.fillText(txt, 0, 0); ctx.restore();
    }

    if (ended) drawFinish();
    ctx.restore();
  }

  function drawRivals() {
    const ordered = rivals.slice().sort((a, b) => a.progress - b.progress);
    ordered.forEach((rival, index) => {
      const delta = rival.progress - distance;
      const y = Math.max(H - 250, Math.min(H - 178, H - 215 - delta * 0.035));
      const scale = 0.72 + (y - (H - 250)) * 0.004;
      drawCarCanvas(ctx, rival.config, rival.x, y, scale, 0);
      drawDino(ctx, rival.x, y - 38, time + index);
      ctx.fillStyle = "rgba(31,45,70,.78)";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(rival.name, rival.x, y + 50);
    });
  }

  function drawFinish() {
    const place = 1 + rivals.filter(rival => rival.progress > distance).length;
    ctx.fillStyle = "rgba(20,32,54,.68)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.fillText(mode === "race" ? `${ordinal(place)} PLACE!` : "TREASURE TRAIL COMPLETE!", W / 2, H / 2 - 24);
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText(`+${stars + (mode === "race" ? Math.max(3, 15 - (place - 1) * 4) : 5)} stars · Tap Home to continue`, W / 2, H / 2 + 26);
  }

  function drawDino(context, x, y, t) {
    context.save();
    context.translate(x, y + Math.sin(t * 5) * 1.5);
    context.fillStyle = "#58c26a";
    context.beginPath(); context.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(0, -14, 11, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#fff"; context.beginPath(); context.arc(4, -16, 3, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#222"; context.beginPath(); context.arc(5, -16, 1.5, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#439f54"; context.beginPath(); context.moveTo(-11, 2); context.lineTo(-23, 9); context.lineTo(-9, 8); context.fill();
    context.restore();
  }

  function ordinal(n) { return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`; }

  let last = 0;
  function loop(timestamp) {
    if (!running) return;
    const dt = Math.min(0.05, (timestamp - last) / 1000 || 0.016);
    last = timestamp;
    step(dt);
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function start(options = {}) {
    stop();
    reset(options);
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function steer(direction) {
    player.targetX = Math.max(roadLeft + 48, Math.min(roadLeft + roadWidth - 48, player.targetX + direction * 90));
  }

  root.querySelector("#btnLeft").addEventListener("pointerdown", event => { event.preventDefault(); steer(-1); });
  root.querySelector("#btnRight").addEventListener("pointerdown", event => { event.preventDefault(); steer(1); });
  window.addEventListener("keydown", event => {
    if (!running) return;
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); steer(-1); }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); steer(1); }
  });
  canvas.addEventListener("pointerdown", event => {
    if (!running || ended) return;
    const rect = canvas.getBoundingClientRect();
    const pointerX = (event.clientX - rect.left) * (W / rect.width);
    player.targetX = Math.max(roadLeft + 48, Math.min(roadLeft + roadWidth - 48, pointerX));
  });

  return { start, stop, goHome };
}
