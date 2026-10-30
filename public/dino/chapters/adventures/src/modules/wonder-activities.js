const SKY_ROUTES = [
  { creature: "Pteranodon", icon: "🪽", place: "Cloud Nest", placeIcon: "☁️", parcel: "Shiny shell", parcelIcon: "🐚" },
  { creature: "Quetzalcoatlus", icon: "🪽", place: "High Cliff", placeIcon: "⛰️", parcel: "Fern seeds", parcelIcon: "🌱" },
  { creature: "Microraptor", icon: "🪶", place: "Rainbow Grove", placeIcon: "🌈", parcel: "Blue berries", parcelIcon: "🫐" },
  { creature: "Archaeopteryx", icon: "🪶", place: "Ancient Tree", placeIcon: "🌳", parcel: "Soft nest fluff", parcelIcon: "🪺" },
  { creature: "Tapejara", icon: "🪽", place: "Sunny Lagoon", placeIcon: "🌊", parcel: "Pretty pebble", parcelIcon: "💎" },
  { creature: "Hatzegopteryx", icon: "🪽", place: "Fern Valley", placeIcon: "🌿", parcel: "Little flower", parcelIcon: "🌼" },
  { creature: "Rhamphorhynchus", icon: "🪽", place: "Moonlit Crag", placeIcon: "🌙", parcel: "Star map", parcelIcon: "🗺️" },
  { creature: "Yi qi", icon: "🪶", place: "Misty Woods", placeIcon: "🌲", parcel: "Warm scarf", parcelIcon: "🧣" }
];

const WEATHER_MISSIONS = [
  { sky: "A sunny afternoon", skyIcon: "☀️", need: "The young plants need water", needIcon: "🌱", answer: "Rain cloud", answerIcon: "🌧️", fact: "Rain gives thirsty plants the water they need." },
  { sky: "A warm, bright day", skyIcon: "🌤️", need: "A little dinosaur needs cool shade", needIcon: "🦕", answer: "Leafy shade", answerIcon: "🌿", fact: "Leaves can make a cool shady place." },
  { sky: "A breezy morning", skyIcon: "🍃", need: "A nest needs shelter from the wind", needIcon: "🪺", answer: "Fern windbreak", answerIcon: "🌾", fact: "Plants can help shelter small places from the wind." },
  { sky: "A chilly evening", skyIcon: "🌙", need: "A hatchling needs a snug nest", needIcon: "🥚", answer: "Soft nest leaves", answerIcon: "🍂", fact: "A cosy nest helps a hatchling feel safe and warm." },
  { sky: "A rainy morning", skyIcon: "🌧️", need: "The puddle-loving dinosaur wants a splash", needIcon: "🦖", answer: "Rain pool", answerIcon: "💧", fact: "Rainwater gathers in little pools and puddles." },
  { sky: "A clear night", skyIcon: "🌌", need: "A sleepy dinosaur needs a calm bedtime", needIcon: "😴", answer: "Quiet star glow", answerIcon: "✨", fact: "The night sky changes as Earth turns beneath the stars." }
];

export function mountSkyMail(context) {
  let delivered = 0;
  const count = Math.min(SKY_ROUTES.length, 2 + Math.ceil(Math.max(1, context.challenge) / 2));
  const routes = SKY_ROUTES.slice((context.level - 1) % SKY_ROUTES.length).concat(SKY_ROUTES).slice(0, count);

  function draw() {
    const route = routes[delivered];
    if (!route) {
      context.stage.innerHTML = '<div class="wonder-scene wonder-sky"><span class="wonder-sun">☀️</span><div class="wonder-medal">📬</div><h2>Every parcel arrived!</h2><p>' + escapeText(context.message("The sky friends are celebrating your kindness.")) + '</p><div class="wonder-celebration" aria-hidden="true">🎈　✦　🎈</div><button class="primary-button" id="mailFinish">Finish the sky-mail adventure</button></div>';
      context.stage.querySelector("#mailFinish").addEventListener("click", function () { context.advance("You delivered every parcel to its prehistoric friend!"); });
      return;
    }
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">📮</span><h2>Prehistoric Sky Mail</h2><p>' + escapeText(context.message("Can you bring the " + route.parcel.toLowerCase() + " to " + route.creature + "?")) + '</p></div>' +
      '<div class="wonder-scene wonder-sky"><span class="wonder-cloud">☁️</span><div class="wonder-mail-path"><span>' + route.parcelIcon + '</span><b aria-hidden="true">➜</b><span>' + route.icon + '</span></div><strong>' + escapeText(route.creature) + "'s " + escapeText(route.place) + '</strong><small>Parcel ' + (delivered + 1) + ' of ' + routes.length + '</small></div>' +
      '<div class="wonder-choice-grid">' + routes.map(function (option, index) { return '<button class="wonder-choice" data-route="' + index + '"><span>' + option.placeIcon + '</span><strong>' + escapeText(option.place) + '</strong><small>For ' + escapeText(option.creature) + '</small></button>'; }).join("") + '</div>' +
      '<p class="gentle-hint" id="mailHint">Choose the matching sky friend’s home.</p>';
    context.stage.querySelectorAll("[data-route]").forEach(function (button) {
      button.addEventListener("click", function () {
        const selected = routes[Number(button.dataset.route)];
        if (selected !== route) {
          context.sound("tap");
          context.stage.querySelector("#mailHint").textContent = "That is a lovely place. Look for " + route.creature + "'s " + route.place + ".";
          return;
        }
        delivered += 1;
        context.sound("good");
        context.speak(context.message("A lovely delivery for " + route.creature + "!"));
        draw();
      });
    });
  }
  draw();
}

export function mountWeatherWorkshop(context) {
  const count = Math.min(WEATHER_MISSIONS.length, 2 + Math.ceil(Math.max(1, context.challenge) / 2));
  const missions = WEATHER_MISSIONS.slice((context.level - 1) % WEATHER_MISSIONS.length).concat(WEATHER_MISSIONS).slice(0, count);
  let solved = 0;
  const tools = [
    { name: "Rain cloud", icon: "🌧️" }, { name: "Leafy shade", icon: "🌿" },
    { name: "Fern windbreak", icon: "🌾" }, { name: "Soft nest leaves", icon: "🍂" },
    { name: "Rain pool", icon: "💧" }, { name: "Quiet star glow", icon: "✨" }
  ];

  function draw() {
    const mission = missions[solved];
    if (!mission) {
      context.stage.innerHTML = '<div class="wonder-scene wonder-weather"><div class="wonder-medal">🌈</div><h2>Little nature helper!</h2><p>' + escapeText(context.message("You helped every prehistoric friend feel just right.")) + '</p><div class="wonder-celebration" aria-hidden="true">🦕　🌼　🦖</div><button class="primary-button" id="weatherFinish">Finish the weather workshop</button>';
      context.stage.querySelector("#weatherFinish").addEventListener("click", function () { context.advance("You made a happy home for the dinosaurs!"); });
      return;
    }
    context.stage.innerHTML = '<div class="stage-heading"><span class="stage-emoji" aria-hidden="true">🌦️</span><h2>Dino Weather Workshop</h2><p>' + escapeText(context.message("Look at the sky and choose what would help.")) + '</p></div>' +
      '<div class="wonder-scene wonder-weather"><div class="weather-sky"><span>' + mission.skyIcon + '</span><strong>' + escapeText(mission.sky) + '</strong></div><div class="weather-need"><span>' + mission.needIcon + '</span><strong>' + escapeText(mission.need) + '</strong></div><small>Weather mission ' + (solved + 1) + ' of ' + missions.length + '</small></div>' +
      '<div class="wonder-choice-grid">' + tools.map(function (tool, index) { return '<button class="wonder-choice" data-tool="' + index + '"><span>' + tool.icon + '</span><strong>' + escapeText(tool.name) + '</strong></button>'; }).join("") + '</div>' +
      '<p class="gentle-hint" id="weatherHint">Every choice is safe to explore. Try the one that helps.</p>';
    context.stage.querySelectorAll("[data-tool]").forEach(function (button) {
      button.addEventListener("click", function () {
        const tool = tools[Number(button.dataset.tool)];
        if (tool.name !== mission.answer) {
          context.sound("tap");
          context.stage.querySelector("#weatherHint").textContent = tool.name + " could help in another place. Think about what this friend needs.";
          return;
        }
        solved += 1;
        context.sound("good");
        context.speak(context.message(mission.fact));
        draw();
      });
    });
  }
  draw();
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
