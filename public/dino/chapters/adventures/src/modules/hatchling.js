const HATCHLINGS = ["🦖", "🦕", "🐣", "🦎", "🦕", "🦖"];

export function mountHatchling(context) {
  const tapsNeeded = Math.min(10, 3 + context.challenge);
  let taps = 0;
  context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🥚</span>' +
    '<h2>Hatchling nursery</h2><p>' + escapeText(context.message("Help a tiny dinosaur hatch, then choose its first little toy.")) + '</p></div>' +
    '<div class="hatch-scene"><div class="hatch-glow"></div><button class="hatch-egg" id="hatchEgg" aria-label="Gently tap the dinosaur egg">🥚</button>' +
    '<span class="hatch-spark spark-one">✦</span><span class="hatch-spark spark-two">✧</span></div>' +
    '<p class="hatch-counter" id="hatchCounter">Gentle taps: 0 of ' + tapsNeeded + '</p>' +
    '<div class="progress-track"><span id="hatchProgress" style="width:0%"></span></div><div id="hatchReveal"></div>';
  const egg = context.stage.querySelector("#hatchEgg");
  egg.addEventListener("click", function () {
    if (taps >= tapsNeeded) return;
    taps += 1;
    egg.classList.add("egg-wiggle");
    window.setTimeout(function () { egg.classList.remove("egg-wiggle"); }, 260);
    egg.textContent = taps >= tapsNeeded ? "🐣" : taps >= Math.ceil(tapsNeeded * 0.65) ? "🥚" : "🥚";
    context.sound("tap");
    context.stage.querySelector("#hatchCounter").textContent = "Gentle taps: " + taps + " of " + tapsNeeded;
    context.stage.querySelector("#hatchProgress").style.width = (taps / tapsNeeded * 100) + "%";
    if (taps >= tapsNeeded) revealFriend();
  });
  function revealFriend() {
    const baby = HATCHLINGS[(context.level - 1) % HATCHLINGS.length];
    egg.disabled = true;
    context.stage.querySelector("#hatchCounter").textContent = context.message("A tiny new friend has hatched!");
    context.stage.querySelector("#hatchReveal").innerHTML = '<div class="baby-reveal"><span class="baby-dino">' + baby + '</span><strong>' + escapeText(context.message("Hello, little one!")) + '</strong>' +
      '<p>Choose a first toy for your baby dinosaur.</p><div class="toy-row">' +
      '<button class="toy-button" data-toy="🌿" aria-label="Choose a leaf toy">🌿</button><button class="toy-button" data-toy="⭐" aria-label="Choose a star toy">⭐</button><button class="toy-button" data-toy="🌼" aria-label="Choose a flower toy">🌼</button></div></div>';
    context.sound("good");
    context.speak(context.message("A little dinosaur hatched!"));
    context.stage.querySelectorAll("[data-toy]").forEach(function (toy) {
      toy.addEventListener("click", function () {
        context.stage.querySelectorAll("[data-toy]").forEach(function (other) { other.disabled = true; });
        toy.classList.add("toy-picked");
        context.sound("good");
        window.setTimeout(function () { context.advance("Your new dinosaur friend loves its first toy!"); }, 320);
      });
    });
  }
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
