const CACHE_NAME = "dinosaur-universe-shell-v11";
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
  "./src/modules/wonder-activities.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(CORE_FILES);
  }).then(function () {
    return self.skipWaiting();
  }));
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
