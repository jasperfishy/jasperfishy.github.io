// render/car.js — Draws the player's car from its config.
// config = { body, paint, name, stickers: ["⭐", ...] }

import { BODIES } from "./data-cars.js";

export function renderCarSVG(config) {
  const body = BODIES[config.body] ? BODIES[config.body](config.paint) : BODIES.sport(config.paint);
  const stickers = (config.stickers || []).slice(0, 4).map((s, i) => {
    const x = 110 + i * 40;
    return `<text x="${x}" y="98" font-size="22" text-anchor="middle">${s}</text>`;
  }).join("");
  const name = config.name
    ? `<text x="160" y="128" font-size="16" font-weight="bold" text-anchor="middle" fill="#fff" stroke="#222" stroke-width="0.6">${escapeHtml(config.name)}</text>`
    : "";
  return `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your customized car">
    ${body}
    ${stickers}
    ${name}
  </svg>`;
}

export function drawCarCanvas(ctx, config, x, y, scale = 1, tilt = 0) {
  // Simplified top-down-ish side car for the drive scene, ~120px wide at scale 1.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  const c = config.paint;
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 34, 62, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = c;
  roundRect(ctx, -58, -18, 116, 40, 12);
  ctx.fill();
  // cabin
  ctx.fillStyle = "#bfe6ff";
  roundRect(ctx, -26, -30, 52, 22, 8);
  ctx.fill();
  // wheels
  ctx.fillStyle = "#222";
  [-38, 38].forEach(wx => {
    ctx.beginPath();
    ctx.arc(wx, 24, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cfd8e3";
    ctx.beginPath();
    ctx.arc(wx, 24, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
  });
  // name
  if (config.name) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(config.name, 0, 6);
  }
  // stickers
  (config.stickers || []).slice(0, 3).forEach((s, i) => {
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s, -30 + i * 30, -2);
  });
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}