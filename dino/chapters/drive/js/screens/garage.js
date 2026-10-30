import { CARS } from "../data-cars.js";
import { renderCarSVG } from "../render-car.js";

export function carUnlockCost(index) {
  return index === 0 ? 0 : index * 3;
}

export function isCarUnlocked(index, state) {
  return (Number(state.totalStars) || 0) >= carUnlockCost(index);
}

export function unlockedCarCount(state) {
  return CARS.reduce((count, _car, index) => count + (isCarUnlocked(index, state) ? 1 : 0), 0);
}

export function initGarage(root, state, onSelect, onBack) {
  const grid = root.querySelector("#garageGrid");
  const progress = root.querySelector("#garageProgress");
  const stats = root.querySelector("#garageStats");

  root.querySelector("#btnGarageBack").addEventListener("click", onBack);

  function render() {
    const count = unlockedCarCount(state);
    progress.textContent = `${count} of ${CARS.length} cars ready · ${Number(state.totalStars) || 0} stars collected`;
    stats.innerHTML = `<div class="garage-stat"><strong>${count}</strong><span>cars ready</span></div><div class="garage-stat"><strong>${Number(state.totalStars) || 0}</strong><span>stars collected</span></div><div class="garage-stat"><strong>${Math.max(0, CARS.length - count)}</strong><span>cars to discover</span></div>`;

    grid.innerHTML = CARS.map((car, index) => {
      const unlocked = isCarUnlocked(index, state);
      const selected = state.config.carId === car.id;
      const preview = renderCarSVG({ ...state.config, body: car.body, paint: selected ? state.config.paint : car.paint, stickers: selected ? state.config.stickers : [] });
      return `<button class="garage-car${unlocked ? "" : " locked"}${selected ? " selected" : ""}" data-car-index="${index}" ${unlocked ? "" : "aria-disabled=\"true\""} aria-label="${car.name}${unlocked ? (selected ? ", selected" : ", unlocked") : `, unlock at ${carUnlockCost(index)} stars`}">
        <span class="garage-car-art">${preview}</span><strong>${car.name}</strong>
        <span class="garage-car-meta">${unlocked ? (selected ? "🚙 Your current car" : "Tap to choose") : `🔒 ${carUnlockCost(index)} stars to unlock`}</span>
      </button>`;
    }).join("");

    grid.querySelectorAll("[data-car-index]").forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.carIndex);
        if (!isCarUnlocked(index, state)) {
          progress.textContent = `Collect ${Math.max(0, carUnlockCost(index) - (Number(state.totalStars) || 0))} more stars to unlock ${CARS[index].name}.`;
          return;
        }
        onSelect(CARS[index]);
        render();
      });
    });
  }

  render();
  return { refresh: render };
}
