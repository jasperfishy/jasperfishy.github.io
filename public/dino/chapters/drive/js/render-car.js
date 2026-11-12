import { drawPhotoreal } from "../../../photoreal-textures.js";
// render/car.js — Draws the player's car from its config.
// config = { body, paint, name, stickers: ["⭐", ...] }

import { BODIES } from "./data-cars.js";

let svgUid = 0;

export function renderCarSVG(config) {
  const uid = svgUid++;
  const gradId = `carGrad-${uid}`;
  const shadowId = `carShadow-${uid}`;
  const highlight = shadeColor(config.paint, 38);
  const base = config.paint;
  const deep = shadeColor(config.paint, -28);
  const defs = `<defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${highlight}"/>
      <stop offset="48%" stop-color="${base}"/>
      <stop offset="100%" stop-color="${deep}"/>
    </linearGradient>
    <filter id="${shadowId}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#17203a" flood-opacity="0.32"/>
    </filter>
  </defs>`;
  const body = BODIES[config.body] ? BODIES[config.body](`url(#${gradId})`) : BODIES.sport(`url(#${gradId})`);
  const stickers = (config.stickers || []).slice(0, 4).map((s, i) => {
    const x = 110 + i * 40;
    return `<text x="${x}" y="98" font-size="22" text-anchor="middle">${s}</text>`;
  }).join("");
  const name = config.name
    ? `<text x="160" y="128" font-size="16" font-weight="bold" text-anchor="middle" fill="#fff" stroke="#222" stroke-width="0.6">${escapeHtml(config.name)}</text>`
    : "";
  return `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your customized car">
    ${defs}
    <g filter="url(#${shadowId})">${body}</g>
    ${stickers}
    ${name}
  </svg>`;
}

// Lightens (positive percent) or darkens (negative percent) a "#rrggbb" color.
function shadeColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp(Math.round(((num >> 16) & 0xff) * (100 + percent) / 100));
  const g = clamp(Math.round(((num >> 8) & 0xff) * (100 + percent) / 100));
  const b = clamp(Math.round((num & 0xff) * (100 + percent) / 100));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

export function drawCarCanvas(ctx, config, x, y, scale = 1, tilt = 0) {
  // Simplified top-down-ish side car for the drive scene, ~120px wide at scale 1.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  const c = config.paint;
  // soft grounding shadow (radial falloff so it reads as a shadow, not a flat patch)
  const groundShadow = ctx.createRadialGradient(0, 34, 4, 0, 34, 66);
  groundShadow.addColorStop(0, "rgba(10,14,24,0.34)");
  groundShadow.addColorStop(1, "rgba(10,14,24,0)");
  ctx.fillStyle = groundShadow;
  ctx.beginPath();
  ctx.ellipse(0, 34, 66, 13, 0, 0, Math.PI * 2);
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


// Rear view for the perspective road: the car is seen from behind, driving away.
// extra = { t, spin, brake, head, spike } (head/spike colour the dino driver)
export function drawCarRear(ctx, config, x, y, scale = 1, tilt = 0, extra = {}) {
  const t = extra.t || 0, spin = extra.spin || 0;
  const c = config.paint || "#e74c3c";
  const dark = shade(c, -0.35), light = shade(c, 0.25);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath(); ctx.ellipse(0, 46, 66, 10, 0, 0, Math.PI * 2); ctx.fill();
  // rear wheels with scrolling tread
  [-54, 54].forEach((wx) => {
    ctx.save();
    ctx.translate(wx, 22);
    ctx.fillStyle = "#1d1d22"; roundRect(ctx, -12, -22, 24, 44, 7); ctx.fill();
    ctx.strokeStyle = "#3b3b45"; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const ty = -18 + ((i * 11 + spin * 40) % 44); ctx.beginPath(); ctx.moveTo(-10, ty); ctx.lineTo(10, ty); ctx.stroke(); }
    ctx.restore();
  });
  // spoiler posts and wing
  ctx.fillStyle = dark;
  ctx.fillRect(-34, -30, 7, 28); ctx.fillRect(27, -30, 7, 28);
  roundRect(ctx, -52, -42, 104, 12, 5); ctx.fill();
  ctx.fillStyle = c; roundRect(ctx, -52, -42, 104, 6, 4); ctx.fill();
  // body
  ctx.fillStyle = c; roundRect(ctx, -52, -6, 104, 50, 16); ctx.fill();
  // roof / rear window
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.moveTo(-38, -4); ctx.lineTo(-28, -30); ctx.lineTo(28, -30); ctx.lineTo(38, -4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#bfe6ff";
  ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(-23, -26); ctx.lineTo(23, -26); ctx.lineTo(30, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath(); ctx.moveTo(-18, -8); ctx.lineTo(-12, -24); ctx.lineTo(-6, -24); ctx.lineTo(-12, -8); ctx.closePath(); ctx.fill();
  // dino driver, seen from behind, peeking over the roof
  const bob = Math.sin(t * 5) * 1.8;
  if (!drawPhotoreal(ctx, 'trex-head-rear', -18, -55 + bob, 36, 38)) {
    ctx.fillStyle = extra.head || '#58c26a';
    ctx.beginPath(); ctx.arc(0, -22 + bob, 15, 0, Math.PI * 2); ctx.fill();
  }
  // tail lights (brighter when braking), number plate, bumper
  ctx.fillStyle = extra.brake ? "#ff5a5a" : "#d82d2d";
  roundRect(ctx, -47, 6, 20, 11, 4); ctx.fill(); roundRect(ctx, 27, 6, 20, 11, 4); ctx.fill();
  ctx.fillStyle = "rgba(255,120,120,.5)"; roundRect(ctx, -45, 7, 8, 4, 2); ctx.fill(); roundRect(ctx, 29, 7, 8, 4, 2); ctx.fill();
  ctx.fillStyle = dark; roundRect(ctx, -48, 32, 96, 12, 6); ctx.fill();
  ctx.fillStyle = "#fff"; roundRect(ctx, -22, 20, 44, 16, 4); ctx.fill();
  ctx.fillStyle = "#222"; ctx.textAlign = "center"; ctx.font = "bold 11px sans-serif";
  ctx.fillText((config.name || "DINO").slice(0, 7).toUpperCase(), 0, 32);
  (config.stickers || []).slice(0, 3).forEach((st, i) => { ctx.font = "13px sans-serif"; ctx.fillText(st, -14 + i * 14, 18 - 8 + (i === 1 ? -2 : 0)); });
  ctx.restore();
}

function shade(hex, amt) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const adj = (v) => { const n = parseInt(v, 16); const out = amt < 0 ? n * (1 + amt) : n + (255 - n) * amt; return Math.max(0, Math.min(255, Math.round(out))); };
  return "#" + [m[1], m[2], m[3]].map((v) => adj(v).toString(16).padStart(2, "0")).join("");
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