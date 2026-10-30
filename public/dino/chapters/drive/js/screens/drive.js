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

  const player = { x: W / 2, targetX: W / 2, tilt: 0 };
  const ROAD_TOP = H * 0.55;
  const roadLeft = W * 0.1;
  const roadWidth = W * 0.8;

  function reset(options = {}) {
    mode = options.mode === "race" ? "race" : "explore";
    scene = SCENES[options.scene] || SCENES.island;
    time = 0; stars = 0; ended = false; distance = 0; boostSeconds = 0; slowSeconds = 0;
    completionSent = false; spawnClock = 0; items = [];
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
    const lane = roadLeft + roadWidth * (0.12 + Math.random() * 0.76);
    const isCollectible = Math.random() < 0.76;
    items.push({
      x: lane,
      y: ROAD_TOP - 28,
      vy: 175 + Math.random() * 45,
      kind: isCollectible ? "collectible" : "obstacle",
      taken: false
    });
  }

  function step(dt) {
    if (ended) return;
    time += dt;
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
      item.y += item.vy * dt;
      const nearCar = Math.abs(item.x - player.x) < 48 && item.y > H - 174 && item.y < H - 88;
      if (!item.taken && nearCar) {
        item.taken = true;
        if (item.kind === "collectible") {
          stars++;
          boostSeconds = mode === "race" ? 2.5 : 0;
          hudStars.textContent = `${scene.collectible} ${stars}`;
          hudMsg.textContent = mode === "race" ? "Dino boost! Zoom ahead!" : `Lovely find! ${stars} of ${EXPLORE_GOAL}`;
        } else {
          slowSeconds = mode === "race" ? 1.2 : 0.25;
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
    updateProgress();
    if (!completionSent) {
      completionSent = true;
      onComplete({ mode, scene: scene.id, stars: reward, collectibles: stars, place, message });
    }
  }

  function draw() {
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
    ctx.fillRect(roadLeft, ROAD_TOP, roadWidth, H - ROAD_TOP);
    ctx.fillStyle = scene.roadLine;
    ctx.fillRect(roadLeft, ROAD_TOP, 7, H - ROAD_TOP);
    ctx.fillRect(roadLeft + roadWidth - 7, ROAD_TOP, 7, H - ROAD_TOP);

    ctx.strokeStyle = scene.roadLine;
    ctx.lineWidth = 6;
    ctx.setLineDash([28, 28]);
    ctx.lineDashOffset = -(time * 100) % 56;
    ctx.beginPath(); ctx.moveTo(W / 2, ROAD_TOP); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    if (mode === "race") drawRivals();
    for (const item of items) {
      if (item.taken) continue;
      ctx.font = item.kind === "collectible" ? "34px sans-serif" : "31px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.kind === "collectible" ? scene.collectible : scene.obstacle, item.x, item.y);
    }

    drawCarCanvas(ctx, state.config, player.x, H - 110, 1.1, player.tilt);
    drawDino(ctx, player.x, H - 150, time);

    if (ended) drawFinish();
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
