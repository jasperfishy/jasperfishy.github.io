// Dinosaur Universe — hub service worker.
// The ONLY service worker in the combined app. Chapter pages do not register
// their own when embedded (they check window.self === window.top).
const VERSION = 'du-v14';
const ASSETS = [
  './',
  './chapters/adventures/assets/courtney-head.webp',
  './chapters/adventures/assets/daddy-head.webp',
  './chapters/adventures/assets/real/manifest.json',
  './chapters/adventures/icon.svg',
  './chapters/adventures/index.html',
  './chapters/adventures/manifest.webmanifest',
  './chapters/adventures/src/fx-games.css',
  './chapters/adventures/src/fx-mummy.css',
  './chapters/adventures/src/fx-quest.css',
  './chapters/adventures/src/main.js',
  './chapters/adventures/src/module-registry.js',
  './chapters/adventures/src/modules/daddy-chase.js',
  './chapters/adventures/src/modules/dino-beat.js',
  './chapters/adventures/src/modules/dino-care.js',
  './chapters/adventures/src/modules/dino-constellations.js',
  './chapters/adventures/src/modules/dino-discoveries.js',
  './chapters/adventures/src/modules/dino-parade.js',
  './chapters/adventures/src/modules/dino-quest.js',
  './chapters/adventures/src/modules/habitat-builder.js',
  './chapters/adventures/src/modules/hatchling.js',
  './chapters/adventures/src/modules/moonbeam-rescue.js',
  './chapters/adventures/src/modules/mummy-cozy-corner.js',
  './chapters/adventures/src/modules/shape-safari.js',
  './chapters/adventures/src/modules/storybook.js',
  './chapters/adventures/src/modules/wonder-activities.js',
  './chapters/adventures/src/style.css',
  './chapters/drive/css/style.css',
  './chapters/drive/index.html',
  './chapters/drive/js/data-cars.js',
  './chapters/drive/js/data-scenes.js',
  './chapters/drive/js/main.js',
  './chapters/drive/js/render-car.js',
  './chapters/drive/js/screens/customize.js',
  './chapters/drive/js/screens/drive.js',
  './chapters/drive/js/screens/garage.js',
  './chapters/meadow/app.js',
  './chapters/meadow/art.js',
  './chapters/meadow/catalog.js',
  './chapters/meadow/icon-192.png',
  './chapters/meadow/icon-512.png',
  './chapters/meadow/icon.svg',
  './chapters/meadow/index.html',
  './chapters/meadow/meadow.css',
  './chapters/meadow/profile.js',
  './chapters/park/css/park.css',
  './chapters/park/index.html',
  './chapters/park/js/app.js',
  './chapters/park/js/core.js',
  './chapters/park/js/games1.js',
  './chapters/park/js/games2.js',
  './chapters/park/js/games3.js',
  './chapters.js',
  './fx/du-ambient.js',
  './fx/du-dino.js',
  './fx/du-fx.css',
  './fx/du-fx.js',
  './fx/du-people.css',
  './fx/du-people.js',
  './hub-art.js',
  './hub.css',
  './hub.js',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  './index.html',
  './manifest.webmanifest',
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
