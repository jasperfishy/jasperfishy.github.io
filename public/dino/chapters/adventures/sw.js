const CACHE_NAME = "__DU_VERSION__";
const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/daddy-ellis.png",
  "./assets/courtney-avatar.png",
  "./src/style.css",
  "./src/main.js",
  "./src/module-registry.js",
  "./src/modules/hatchling.js",
  "./src/modules/shape-safari.js",
  "./src/modules/dino-beat.js",
  "./src/modules/habitat-builder.js",
  "./src/modules/storybook.js",
  "./src/modules/dino-discoveries.js",
  "./src/modules/dino-care.js",
  "./src/modules/mummy-cozy-corner.js",
  "./src/modules/moonbeam-rescue.js",
  "./src/modules/dino-parade.js",
  "./src/modules/dino-constellations.js",
  "./src/modules/wonder-activities.js",
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
    await cache.addAll(CORE_FILES);
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
  event.respondWith(caches.match(event.request).then(function (cached) {
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
      if (event.request.mode === "navigate") return caches.match("./index.html");
      throw new Error("This item is not available offline yet.");
    });
  }));
});
