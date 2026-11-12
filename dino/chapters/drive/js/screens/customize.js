// screens/customize.js — Car customization screen logic.

import { PAINTS, STICKERS, CARS } from "../data-cars.js?v=du-f652baf3e7fda2b1";
import { renderCarSVG } from "../render-car.js?v=du-f652baf3e7fda2b1";
import { isCarUnlocked } from "./garage.js?v=du-f652baf3e7fda2b1";

const FX = () => window.DUFX;
const fx = (name) => { try { const f = FX(); f && f.sfx && f.sfx[name] && f.sfx[name](); } catch (e) { /* sound is optional */ } };
function celebrate(el, kind, n) {
  try {
    const f = FX(); if (!f || !el) return;
    const r = el.getBoundingClientRect();
    f.burst(r.left + r.width / 2, r.top + r.height / 2, { kind, n: n || 14 });
  } catch (e) { /* effects are optional */ }
}

export function initCustomize(root, state, goDrive, onNameChange = () => {}) {
  const preview = root.querySelector("#carPreview");
  const swatches = root.querySelector("#colorSwatches");
  const tray = root.querySelector("#stickerTray");
  const nameInput = root.querySelector("#nameInput");

  // Color swatches
  PAINTS.forEach(color => {
    const b = document.createElement("button");
    b.className = "swatch";
    b.style.background = color;
    b.title = color;
    b.addEventListener("click", () => {
      state.config.paint = color;
      markSelected(swatches, b);
      refresh();
      fx("pop"); try { FX().bounce(preview.firstElementChild); } catch (e) { /* ok */ }
      celebrate(preview, "sparkle", 16);
    });
    swatches.appendChild(b);
  });

  // Sticker tray (toggle)
  STICKERS.forEach(s => {
    const b = document.createElement("button");
    b.className = "sticker";
    b.textContent = s;
    b.addEventListener("click", () => {
      const idx = state.config.stickers.indexOf(s);
      if (idx >= 0) state.config.stickers.splice(idx, 1);
      else if (state.config.stickers.length < 4) state.config.stickers.push(s);
      markSelected(tray, b);
      refresh();
      fx("pop"); try { FX().pop(b); } catch (e) { /* ok */ }
      celebrate(preview, "stars", 8);
    });
    tray.appendChild(b);
  });

  nameInput.addEventListener("input", () => {
    state.config.name = nameInput.value.trim();
    refresh();
    onNameChange();
  });

  root.querySelector("#btnShuffle").addEventListener("click", () => {
    const available = CARS.filter((_car, index) => isCarUnlocked(index, state));
    const car = available[Math.floor(Math.random() * available.length)] || CARS[0];
    state.config = {
      carId: car.id,
      body: car.body,
      paint: car.paint,
      name: state.config.name,
      stickers: STICKERS.sort(() => Math.random() - 0.5).slice(0, 2)
    };
    syncControls();
    refresh();
    fx("boing"); try { FX().bounce(preview.firstElementChild); } catch (e) { /* ok */ }
    celebrate(preview, "confetti", 30);
  });

  root.querySelector("#btnDriveFromCustomize").addEventListener("click", goDrive);

  function syncControls() {
    markSelected(swatches, [...swatches.children].find(b => b.title === state.config.paint));
    [...tray.children].forEach(b => {
      b.classList.toggle("selected", state.config.stickers.includes(b.textContent));
    });
    nameInput.value = state.config.name || "";
  }

  function refresh() {
    preview.innerHTML = renderCarSVG(state.config);
  }

  function markSelected(container, el) {
    [...container.children].forEach(c => c.classList.remove("selected"));
    if (el) el.classList.add("selected");
  }

  syncControls();
  refresh();
  return { refresh: () => { syncControls(); refresh(); } };
}
