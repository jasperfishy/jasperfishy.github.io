// Dinosaur Universe — one app-wide service worker.
// The versioned Pages build writes the release id into VERSION.
const VERSION = "du-58eb19b6b425f48c";
const ASSETS = [
  './?v=du-58eb19b6b425f48c',
  './version.json?v=du-58eb19b6b425f48c',
  './update-manager.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/assets/courtney-head.webp?v=du-58eb19b6b425f48c',
  './chapters/adventures/assets/daddy-head.webp?v=du-58eb19b6b425f48c',
  './chapters/adventures/assets/real/manifest.json?v=du-58eb19b6b425f48c',
  './chapters/adventures/icon.svg?v=du-58eb19b6b425f48c',
  './chapters/adventures/index.html?v=du-58eb19b6b425f48c',
  './chapters/adventures/manifest.webmanifest?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/fx-games.css?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/fx-mummy.css?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/fx-quest.css?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/main.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/module-registry.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/daddy-chase.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/dino-beat.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/dino-care.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/dino-constellations.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/dino-discoveries.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/dino-parade.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/dino-quest.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/habitat-builder.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/hatchling.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/moonbeam-rescue.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/mummy-cozy-corner.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/shape-safari.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/storybook.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/modules/wonder-activities.js?v=du-58eb19b6b425f48c',
  './chapters/adventures/src/style.css?v=du-58eb19b6b425f48c',
  './chapters/adventures-phaser/index.html?v=du-58eb19b6b425f48c',
  './chapters/adventures-phaser/main.js?v=du-58eb19b6b425f48c',
  './chapters/adventures-phaser/adventures-pack.js?v=du-58eb19b6b425f48c',
  './chapters/drive/css/style.css?v=du-58eb19b6b425f48c',
  './chapters/drive/index.html?v=du-58eb19b6b425f48c',
  './chapters/drive/js/data-cars.js?v=du-58eb19b6b425f48c',
  './chapters/drive/js/data-scenes.js?v=du-58eb19b6b425f48c',
  './chapters/drive/js/main.js?v=du-58eb19b6b425f48c',
  './chapters/drive/js/render-car.js?v=du-58eb19b6b425f48c',
  './chapters/drive/js/screens/customize.js?v=du-58eb19b6b425f48c',
  './chapters/drive/js/screens/drive.js?v=du-58eb19b6b425f48c',
  './chapters/drive/js/screens/garage.js?v=du-58eb19b6b425f48c',
  './chapters/car-studio-phaser/index.html?v=du-58eb19b6b425f48c',
  './chapters/car-studio-phaser/main.js?v=du-58eb19b6b425f48c',
  './chapters/meadow-phaser/index.html?v=du-58eb19b6b425f48c',
  './chapters/meadow-phaser/main.js?v=du-58eb19b6b425f48c',
  './chapters/park-phaser/index.html?v=du-58eb19b6b425f48c',
  './chapters/park-phaser/main.js?v=du-58eb19b6b425f48c',
  './chapters/phaser-kit.js?v=du-58eb19b6b425f48c',
  './lib/phaser.min.js?v=du-58eb19b6b425f48c',
  './chapters/meadow/app.js?v=du-58eb19b6b425f48c',
  './chapters/meadow/art.js?v=du-58eb19b6b425f48c',
  './chapters/meadow/catalog.js?v=du-58eb19b6b425f48c',
  './chapters/meadow/icon-192.png?v=du-58eb19b6b425f48c',
  './chapters/meadow/icon-512.png?v=du-58eb19b6b425f48c',
  './chapters/meadow/icon.svg?v=du-58eb19b6b425f48c',
  './chapters/meadow/index.html?v=du-58eb19b6b425f48c',
  './chapters/meadow/meadow.css?v=du-58eb19b6b425f48c',
  './chapters/meadow/profile.js?v=du-58eb19b6b425f48c',
  './chapters/park/css/park.css?v=du-58eb19b6b425f48c',
  './chapters/park/index.html?v=du-58eb19b6b425f48c',
  './chapters/park/js/app.js?v=du-58eb19b6b425f48c',
  './chapters/park/js/core.js?v=du-58eb19b6b425f48c',
  './chapters/park/js/games1.js?v=du-58eb19b6b425f48c',
  './chapters/park/js/games2.js?v=du-58eb19b6b425f48c',
  './chapters/park/js/games3.js?v=du-58eb19b6b425f48c',
  './chapters.js?v=du-58eb19b6b425f48c',
  './fx/du-ambient.js?v=du-58eb19b6b425f48c',
  './fx/du-dino.js?v=du-58eb19b6b425f48c',
  './fx/du-fx.css?v=du-58eb19b6b425f48c',
  './fx/du-fx.js?v=du-58eb19b6b425f48c',
  './fx/du-people.css?v=du-58eb19b6b425f48c',
  './fx/du-people.js?v=du-58eb19b6b425f48c',
  './hub-art.js?v=du-58eb19b6b425f48c',
  './hub.css?v=du-58eb19b6b425f48c',
  './hub.js?v=du-58eb19b6b425f48c',
  './icon-192.png?v=du-58eb19b6b425f48c',
  './icon-512.png?v=du-58eb19b6b425f48c',
  './icon.svg?v=du-58eb19b6b425f48c',
  './index.html?v=du-58eb19b6b425f48c',
  './manifest.webmanifest?v=du-58eb19b6b425f48c'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // Existing du-vN caches predate the update control. Activate this one
    // migration so those cached pages can load the new updater; later hashed
    // releases remain staged until the player applies them.
    const previousCaches = await caches.keys();
    const needsUpdaterMigration = previousCaches.some((name) => /^du-v\d+$/.test(name));
    const cache = await caches.open(VERSION);
    await cache.addAll(ASSETS);
    if (needsUpdaterMigration) await self.skipWaiting();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DU_SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('du-') && key !== VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const versionPath = new URL('./version.json', self.registration.scope).pathname;
  if (url.pathname === versionPath) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).then((response) => {
        if (response.ok) caches.open(VERSION).then((cache) => cache.put(request, response.clone()));
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) =>
      cached || fetch(request).then((response) => {
        if (response.ok) caches.open(VERSION).then((cache) => cache.put(request, response.clone()));
        return response;
      })
    )
  );
});
