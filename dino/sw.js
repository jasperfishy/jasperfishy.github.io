// Dinosaur Universe — hub service worker.
// The ONLY service worker in the combined app. Chapter pages do not register
// their own when embedded (they check window.self === window.top).
const VERSION = 'du-v7';
const ASSETS = [
  './',
  './index.html',
  './hub.js',
  './hub.css',
  './chapters.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  // Dino Park chapter
  './chapters/park/index.html',
  './chapters/park/js/dino.js',
  './chapters/park/js/games.js',
  './chapters/park/css/park.css',
  // Dino Meadow chapter
  './chapters/meadow/index.html',
  './chapters/meadow/app.js',
  './chapters/meadow/art.js',
  './chapters/meadow/catalog.js',
  './chapters/meadow/profile.js',
  './chapters/meadow/meadow.css',
  './chapters/meadow/icon.svg',
  './chapters/meadow/icon-192.png',
  './chapters/meadow/icon-512.png',
  // Original play modules (the hub is their shared shell)
  './chapters/adventures/index.html',
  './chapters/adventures/manifest.webmanifest',
  './chapters/adventures/icon.svg',
  './chapters/adventures/sw.js',
  './chapters/adventures/src/main.js',
  './chapters/adventures/src/module-registry.js',
  './chapters/adventures/src/style.css',
  './chapters/adventures/src/modules/hatchling.js',
  './chapters/adventures/src/modules/shape-safari.js',
  './chapters/adventures/src/modules/dino-beat.js',
  './chapters/adventures/src/modules/habitat-builder.js',
  './chapters/adventures/src/modules/storybook.js',
  './chapters/adventures/src/modules/dino-discoveries.js',
  './chapters/adventures/src/modules/dino-care.js',
  './chapters/adventures/src/modules/mummy-cozy-corner.js',
  './chapters/adventures/src/modules/moonbeam-rescue.js',
  './chapters/adventures/src/modules/dino-parade.js',
  './chapters/adventures/src/modules/dino-constellations.js',
  './chapters/adventures/src/modules/wonder-activities.js',
  './chapters/adventures/assets/daddy-ellis.png',
  './chapters/adventures/assets/courtney-avatar.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
    )
  );
});
