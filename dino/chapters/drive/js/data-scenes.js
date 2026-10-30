// Six hand-drawn worlds. Every scene shares the same driving rules and can be
// extended by adding a data entry; no scene-specific game logic is required.

function hill(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  ctx.quadraticCurveTo(x - width * 0.28, y - height, x, y - height * 0.72);
  ctx.quadraticCurveTo(x + width * 0.28, y - height * 1.12, x + width / 2, y);
  ctx.closePath();
  ctx.fill();
}

function pine(ctx, x, y, size, color) {
  ctx.fillStyle = "#74553b";
  ctx.fillRect(x - size * 0.06, y - size * 0.28, size * 0.12, size * 0.3);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const top = y - size * (0.9 - i * 0.22);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x - size * (0.38 - i * 0.06), y - size * (0.38 - i * 0.15));
    ctx.lineTo(x + size * (0.38 - i * 0.06), y - size * (0.38 - i * 0.15));
    ctx.closePath();
    ctx.fill();
  }
}

function cityFar(ctx, t, W, H) {
  ctx.fillStyle = "#c4dcf3";
  ctx.fillRect(0, H * 0.35, W, H * 0.23);
  for (let i = 0; i < 10; i++) {
    const w = 72 + (i % 3) * 22;
    const x = ((i * 130 - t * 0.2) % (W + 150)) - 75;
    const h = 80 + (i % 4) * 21;
    ctx.fillStyle = ["#9eb8d1", "#a9c7de", "#8ea9c2"][i % 3];
    ctx.fillRect(x, H * 0.58 - h, w, h);
    ctx.fillStyle = "#fff0a8";
    for (let wy = H * 0.58 - h + 14; wy < H * 0.56; wy += 22) {
      for (let wx = x + 12; wx < x + w - 8; wx += 22) ctx.fillRect(wx, wy, 8, 10);
    }
  }
}

function mountainFar(ctx, t, W, H) {
  ctx.fillStyle = "#d8edff";
  ctx.fillRect(0, H * 0.38, W, H * 0.2);
  for (let i = 0; i < 5; i++) {
    const x = ((i * 255 - t * 0.14) % (W + 300)) - 150;
    const peak = H * (0.25 + (i % 2) * 0.06);
    ctx.fillStyle = i % 2 ? "#91b6cf" : "#789fbf";
    ctx.beginPath(); ctx.moveTo(x - 190, H * 0.58); ctx.lineTo(x, peak); ctx.lineTo(x + 190, H * 0.58); ctx.fill();
    ctx.fillStyle = "#f7fcff";
    ctx.beginPath(); ctx.moveTo(x - 52, peak + 67); ctx.lineTo(x, peak); ctx.lineTo(x + 58, peak + 72); ctx.lineTo(x + 20, peak + 55); ctx.lineTo(x - 9, peak + 68); ctx.fill();
  }
}

function snowFar(ctx, t, W, H) {
  ctx.fillStyle = "#bde5f3";
  ctx.fillRect(0, H * 0.36, W, H * 0.23);
  for (let i = 0; i < 5; i++) hill(ctx, ((i * 250 - t * 0.15) % (W + 280)) - 100, H * 0.6, 330, 110 + (i % 2) * 26, i % 2 ? "#f8fdff" : "#e8f7ff");
}

function desertFar(ctx, t, W, H) {
  ctx.fillStyle = "#ffdda0";
  ctx.fillRect(0, H * 0.38, W, H * 0.22);
  ctx.fillStyle = "#ffd35f";
  ctx.beginPath(); ctx.arc(W * 0.78, H * 0.32, 34, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const x = ((i * 320 - t * 0.12) % (W + 360)) - 180;
    ctx.fillStyle = i % 2 ? "#d99757" : "#c98550";
    ctx.beginPath(); ctx.moveTo(x - 120, H * 0.6); ctx.lineTo(x - 90, H * 0.45); ctx.lineTo(x - 45, H * 0.45); ctx.lineTo(x - 12, H * 0.39); ctx.lineTo(x + 40, H * 0.4); ctx.lineTo(x + 70, H * 0.6); ctx.fill();
  }
  for (let i = 0; i < 6; i++) hill(ctx, ((i * 210 - t * 0.24) % (W + 240)) - 120, H * 0.62, 260, 48, i % 2 ? "#f3bd71" : "#edb066");
}

function spaceFar(ctx, t, W, H) {
  for (let i = 0; i < 65; i++) {
    const x = (i * 137 + (i % 5) * 19) % W;
    const y = (i * 71 + (i % 7) * 11) % Math.floor(H * 0.65);
    ctx.globalAlpha = 0.45 + ((Math.sin(t * 0.002 + i) + 1) * 0.25);
    ctx.fillStyle = i % 4 ? "#fff4bd" : "#a7e4ff";
    ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 2.5 : 1.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#d68bff"; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.28, 43, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffc4ed"; ctx.beginPath(); ctx.arc(W * 0.76, H * 0.26, 28, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#fff0bb"; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(W * 0.78, H * 0.28, 65, 16, -0.25, 0, Math.PI * 2); ctx.stroke();
}

function palm(ctx, x, y, size, color) {
  ctx.strokeStyle = "#9a6841"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - size * 0.7); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 5;
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + i * Math.PI / 4;
    ctx.beginPath(); ctx.moveTo(x + 3, y - size * 0.7); ctx.quadraticCurveTo(x + Math.cos(a) * size * 0.25, y - size * 0.9, x + Math.cos(a) * size * 0.6, y - size * (0.65 + Math.sin(a) * 0.14)); ctx.stroke();
  }
}

export const SCENES = {
  island: {
    id: "island", label: "Island Road", unlockStars: 0,
    sky: ["#69c8ff", "#d7f5ff"], ground: "#78c86b", road: "#586879", roadLine: "#fff2a6", collectible: "⭐", obstacle: "🪵",
    far(ctx, t, W, H) {
      ctx.fillStyle = "#40afd6"; ctx.fillRect(0, H * 0.42, W, H * 0.18);
      for (let i = 0; i < 5; i++) { const x = ((i * 280 - t * 0.18) % (W + 300)) - 150; ctx.fillStyle = i % 2 ? "#75c884" : "#56b975"; ctx.beginPath(); ctx.ellipse(x, H * 0.44, 130, 36, 0, 0, Math.PI * 2); ctx.fill(); }
    },
    mid(ctx, t, W, H) { for (let i = 0; i < 7; i++) palm(ctx, ((i * 190 - t * 0.42) % (W + 220)) - 110, H * 0.59, 55, "#248b57"); }
  },
  city: {
    id: "city", label: "Dino City", unlockStars: 8,
    sky: ["#79bfff", "#e6f2ff"], ground: "#74bd73", road: "#546277", roadLine: "#ffe081", collectible: "💎", obstacle: "🚧",
    far: cityFar,
    mid(ctx, t, W, H) { for (let i = 0; i < 8; i++) { const x = ((i * 170 - t * 0.45) % (W + 180)) - 90; ctx.fillStyle = "#b45f48"; ctx.fillRect(x - 8, H * 0.57 - 42, 16, 42); ctx.fillStyle = "#f9d77b"; ctx.beginPath(); ctx.arc(x, H * 0.57 - 45, 18, 0, Math.PI * 2); ctx.fill(); } }
  },
  mountain: {
    id: "mountain", label: "Mountain Pass", unlockStars: 16,
    sky: ["#6fb9ed", "#e8f6ff"], ground: "#6ba96d", road: "#606b72", roadLine: "#fff6d0", collectible: "🦴", obstacle: "🪨",
    far: mountainFar,
    mid(ctx, t, W, H) { for (let i = 0; i < 9; i++) pine(ctx, ((i * 150 - t * 0.48) % (W + 170)) - 85, H * 0.61, 60 + (i % 3) * 8, i % 2 ? "#397c62" : "#2f705c"); }
  },
  snow: {
    id: "snow", label: "Snowy Valley", unlockStars: 24,
    sky: ["#91ddff", "#f7fdff"], ground: "#eaf8ff", road: "#9cb9ca", roadLine: "#fff", collectible: "❄️", obstacle: "⛄",
    far: snowFar,
    mid(ctx, t, W, H) { for (let i = 0; i < 9; i++) { const x = ((i * 160 - t * 0.45) % (W + 180)) - 90; pine(ctx, x, H * 0.63, 54 + (i % 2) * 8, i % 2 ? "#64a99e" : "#4e968b"); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + 22, H * 0.59, 4, 0, Math.PI * 2); ctx.fill(); } }
  },
  desert: {
    id: "desert", label: "Amber Desert", unlockStars: 32,
    sky: ["#75d5eb", "#ffefc7"], ground: "#edc175", road: "#bd966c", roadLine: "#fff1bb", collectible: "🪙", obstacle: "🌵",
    far: desertFar,
    mid(ctx, t, W, H) { for (let i = 0; i < 7; i++) { const x = ((i * 180 - t * 0.43) % (W + 190)) - 95; ctx.fillStyle = "#378e68"; ctx.fillRect(x - 7, H * 0.61 - 40, 14, 40); ctx.fillRect(x - 20, H * 0.61 - 26, 14, 7); ctx.fillRect(x + 6, H * 0.61 - 32, 14, 7); } }
  },
  space: {
    id: "space", label: "Moonbeam Circuit", unlockStars: 40,
    sky: ["#142652", "#4d387b"], ground: "#43366e", road: "#303b63", roadLine: "#91edff", collectible: "🌟", obstacle: "🪐",
    far: spaceFar,
    mid(ctx, t, W, H) { for (let i = 0; i < 6; i++) { const x = ((i * 210 - t * 0.38) % (W + 220)) - 110; ctx.fillStyle = "#64deef"; ctx.beginPath(); ctx.ellipse(x, H * 0.59, 34, 12, -0.35, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#9f78de"; ctx.beginPath(); ctx.arc(x, H * 0.58, 17, 0, Math.PI * 2); ctx.fill(); } }
  }
};

export const SCENE_LIST = Object.values(SCENES);
