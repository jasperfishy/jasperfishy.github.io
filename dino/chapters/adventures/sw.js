const CACHE_NAME = "dinosaur-universe-shell-du-a1454ea5250e1aa0";
const CORE_FILES = [
  "./?v=du-a1454ea5250e1aa0",
  "./assets/daddy-face.svg?v=du-a1454ea5250e1aa0",
  "./assets/mummy-face.svg?v=du-a1454ea5250e1aa0",
  "./assets/real/README.txt?v=du-a1454ea5250e1aa0",
  "./assets/real/manifest.json?v=du-a1454ea5250e1aa0",
  "./icon.svg?v=du-a1454ea5250e1aa0",
  "./index.html?v=du-a1454ea5250e1aa0",
  "./manifest.webmanifest?v=du-a1454ea5250e1aa0",
  "./src/adv-kit.js?v=du-a1454ea5250e1aa0",
  "./src/fx-games.css?v=du-a1454ea5250e1aa0",
  "./src/fx-kit.css?v=du-a1454ea5250e1aa0",
  "./src/fx-mummy.css?v=du-a1454ea5250e1aa0",
  "./src/fx-play.css?v=du-a1454ea5250e1aa0",
  "./src/fx-puzzle.css?v=du-a1454ea5250e1aa0",
  "./src/fx-quest.css?v=du-a1454ea5250e1aa0",
  "./src/fx-rescue.css?v=du-a1454ea5250e1aa0",
  "./src/main.js?v=du-a1454ea5250e1aa0",
  "./src/module-registry.js?v=du-a1454ea5250e1aa0",
  "./src/modules/builder.js?v=du-a1454ea5250e1aa0",
  "./src/modules/daddy-chase.js?v=du-a1454ea5250e1aa0",
  "./src/modules/dino-beat.js?v=du-a1454ea5250e1aa0",
  "./src/modules/dino-care.js?v=du-a1454ea5250e1aa0",
  "./src/modules/dino-constellations.js?v=du-a1454ea5250e1aa0",
  "./src/modules/dino-discoveries.js?v=du-a1454ea5250e1aa0",
  "./src/modules/dino-parade.js?v=du-a1454ea5250e1aa0",
  "./src/modules/dino-quest.js?v=du-a1454ea5250e1aa0",
  "./src/modules/dino-rescue.js?v=du-a1454ea5250e1aa0",
  "./src/modules/fossil.js?v=du-a1454ea5250e1aa0",
  "./src/modules/habitat-builder.js?v=du-a1454ea5250e1aa0",
  "./src/modules/hatchling.js?v=du-a1454ea5250e1aa0",
  "./src/modules/jigsaw.js?v=du-a1454ea5250e1aa0",
  "./src/modules/memory.js?v=du-a1454ea5250e1aa0",
  "./src/modules/moonbeam-rescue.js?v=du-a1454ea5250e1aa0",
  "./src/modules/mummy-cozy-corner.js?v=du-a1454ea5250e1aa0",
  "./src/modules/picnic.js?v=du-a1454ea5250e1aa0",
  "./src/modules/rescue/chapters-a.js?v=du-a1454ea5250e1aa0",
  "./src/modules/rescue/chapters-b.js?v=du-a1454ea5250e1aa0",
  "./src/modules/rescue/engine.js?v=du-a1454ea5250e1aa0",
  "./src/modules/shape-safari.js?v=du-a1454ea5250e1aa0",
  "./src/modules/storybook.js?v=du-a1454ea5250e1aa0",
  "./src/modules/trail.js?v=du-a1454ea5250e1aa0",
  "./src/modules/wonder-activities.js?v=du-a1454ea5250e1aa0",
  "./src/style.css?v=du-a1454ea5250e1aa0",
  "../../update-manager.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil((async function () {
    // The vN cache is from before the update control existed. Activate this
    // one migration so cached Adventures pages can load the shared updater;
    // future release caches wait for the player's choice.
    const previousCaches = await caches.keys();
    const needsUpdaterMigration = previousCaches.some(function (name) {
      return /^dinosaur-universe-shell-v\d+$/.test(name);
    });
    const cache = await caches.open(CACHE_NAME);
    // addAll() rejects as a unit: two renamed avatar files were enough to leave
    // this whole world without an offline copy. Cache each file on its own.
    const results = await Promise.allSettled(CORE_FILES.map(function (url) { return cache.add(url); }));
    const failed = results.map(function (r, i) { return r.status === "rejected" ? CORE_FILES[i] : null; }).filter(Boolean);
    if (failed.length) console.warn("[adventures-sw] not cached this release:", failed);
    if (needsUpdaterMigration) await self.skipWaiting();
  })());
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "DU_SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key.indexOf("dinosaur-universe-shell-") === 0 && key !== CACHE_NAME;
    }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
    if (cached) return cached;
    return fetch(event.request).then(function (response) {
      if (response.ok && event.request.destination !== "document") {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
      }
      return response;
    }).catch(function () {
      if (event.request.mode === "navigate") return caches.match("./index.html", { ignoreSearch: true });
      throw new Error("This item is not available offline yet.");
    });
  }));
});
