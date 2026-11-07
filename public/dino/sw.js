// Dinosaur Universe — hub service worker.
// The ONLY service worker in the combined app; update-manager.js registers it.
// New releases wait until the player applies them (DU_SKIP_WAITING). The
// jasperfish.com release build stamps VERSION with a content hash.
const VERSION = "du-v25";
const ASSETS = [
  './',
  './version.json',
  './update-manager.js',
  './lib/phaser.min.js',
  './chapters/adventures/assets/daddy-face.svg',
  './chapters/adventures/assets/mummy-face.svg',
  './chapters/adventures/assets/real/manifest.json',
  './chapters/adventures/icon.svg',
  './chapters/adventures/index.html',
  './chapters/adventures/manifest.webmanifest',
  './chapters/adventures/src/adv-kit.js',
  './chapters/adventures/src/fx-games.css',
  './chapters/adventures/src/fx-kit.css',
  './chapters/adventures/src/fx-mummy.css',
  './chapters/adventures/src/fx-play.css',
  './chapters/adventures/src/fx-puzzle.css',
  './chapters/adventures/src/fx-quest.css',
  './chapters/adventures/src/main.js',
  './chapters/adventures/src/module-registry.js',
  './chapters/adventures/src/modules/builder.js',
  './chapters/adventures/src/modules/daddy-chase.js',
  './chapters/adventures/src/modules/dino-beat.js',
  './chapters/adventures/src/modules/dino-care.js',
  './chapters/adventures/src/modules/dino-constellations.js',
  './chapters/adventures/src/modules/dino-discoveries.js',
  './chapters/adventures/src/modules/dino-parade.js',
  './chapters/adventures/src/modules/dino-quest.js',
  './chapters/adventures/src/modules/fossil.js',
  './chapters/adventures/src/modules/habitat-builder.js',
  './chapters/adventures/src/modules/hatchling.js',
  './chapters/adventures/src/modules/jigsaw.js',
  './chapters/adventures/src/modules/memory.js',
  './chapters/adventures/src/modules/moonbeam-rescue.js',
  './chapters/adventures/src/modules/mummy-cozy-corner.js',
  './chapters/adventures/src/modules/picnic.js',
  './chapters/adventures/src/modules/shape-safari.js',
  './chapters/adventures/src/modules/storybook.js',
  './chapters/adventures/src/modules/trail.js',
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
  './chapters/meadow/engine.js',
  './chapters/meadow/games.js',
  './chapters/meadow/icon-192.png',
  './chapters/meadow/icon-512.png',
  './chapters/meadow/icon.svg',
  './chapters/meadow/index.html',
  './chapters/meadow/meadow.css',
  './chapters/meadow/play.css',
  './chapters/meadow/profile.js',
  './chapters/meadow/studio.js',
  './chapters/park/css/bones.css',
  './chapters/park/css/park.css',
  './chapters/park/index.html',
  './chapters/park/js/app.js',
  './chapters/park/js/bones.js',
  './chapters/park/js/core.js',
  './chapters/park/js/games1.js',
  './chapters/park/js/games2.js',
  './chapters/park/js/games3.js',
  './chapters.js',
  './chapters/car-studio-phaser/index.html',
  './chapters/car-studio-phaser/main.js',
  './chapters/phaser-kit.js',
  './chapters/dino-park-phaser/index.html',
  './chapters/dino-park-phaser/main.js',
  './chapters/meadow-phaser/index.html',
  './chapters/meadow-phaser/main.js',
  './chapters/adventures-phaser/index.html',
  './chapters/adventures-phaser/main.js',
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
