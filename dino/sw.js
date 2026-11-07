// Dinosaur Universe — hub service worker.
// The ONLY service worker in the combined app; update-manager.js registers it.
// New releases wait until the player applies them (DU_SKIP_WAITING). The
// jasperfish.com release build stamps VERSION with a content hash.
const VERSION = "du-2b5bf1340085b709";
const ASSETS = [
  './?v=du-2b5bf1340085b709',
  './version.json?v=du-2b5bf1340085b709',
  './update-manager.js?v=du-2b5bf1340085b709',
  './lib/phaser.min.js?v=du-2b5bf1340085b709',
  './chapters/adventures/assets/daddy-face.svg?v=du-2b5bf1340085b709',
  './chapters/adventures/assets/mummy-face.svg?v=du-2b5bf1340085b709',
  './chapters/adventures/assets/real/manifest.json?v=du-2b5bf1340085b709',
  './chapters/adventures/icon.svg?v=du-2b5bf1340085b709',
  './chapters/adventures/index.html?v=du-2b5bf1340085b709',
  './chapters/adventures/manifest.webmanifest?v=du-2b5bf1340085b709',
  './chapters/adventures/src/adv-kit.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/fx-games.css?v=du-2b5bf1340085b709',
  './chapters/adventures/src/fx-kit.css?v=du-2b5bf1340085b709',
  './chapters/adventures/src/fx-mummy.css?v=du-2b5bf1340085b709',
  './chapters/adventures/src/fx-play.css?v=du-2b5bf1340085b709',
  './chapters/adventures/src/fx-puzzle.css?v=du-2b5bf1340085b709',
  './chapters/adventures/src/fx-quest.css?v=du-2b5bf1340085b709',
  './chapters/adventures/src/main.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/module-registry.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/builder.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/daddy-chase.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/dino-beat.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/dino-care.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/dino-constellations.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/dino-discoveries.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/dino-parade.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/dino-quest.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/fossil.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/habitat-builder.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/hatchling.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/jigsaw.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/memory.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/moonbeam-rescue.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/mummy-cozy-corner.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/picnic.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/shape-safari.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/storybook.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/trail.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/modules/wonder-activities.js?v=du-2b5bf1340085b709',
  './chapters/adventures/src/style.css?v=du-2b5bf1340085b709',
  './chapters/drive/css/style.css?v=du-2b5bf1340085b709',
  './chapters/drive/index.html?v=du-2b5bf1340085b709',
  './chapters/drive/js/data-cars.js?v=du-2b5bf1340085b709',
  './chapters/drive/js/data-scenes.js?v=du-2b5bf1340085b709',
  './chapters/drive/js/main.js?v=du-2b5bf1340085b709',
  './chapters/drive/js/render-car.js?v=du-2b5bf1340085b709',
  './chapters/drive/js/screens/customize.js?v=du-2b5bf1340085b709',
  './chapters/drive/js/screens/drive.js?v=du-2b5bf1340085b709',
  './chapters/drive/js/screens/garage.js?v=du-2b5bf1340085b709',
  './chapters/meadow/app.js?v=du-2b5bf1340085b709',
  './chapters/meadow/art.js?v=du-2b5bf1340085b709',
  './chapters/meadow/catalog.js?v=du-2b5bf1340085b709',
  './chapters/meadow/engine.js?v=du-2b5bf1340085b709',
  './chapters/meadow/games.js?v=du-2b5bf1340085b709',
  './chapters/meadow/icon-192.png?v=du-2b5bf1340085b709',
  './chapters/meadow/icon-512.png?v=du-2b5bf1340085b709',
  './chapters/meadow/icon.svg?v=du-2b5bf1340085b709',
  './chapters/meadow/index.html?v=du-2b5bf1340085b709',
  './chapters/meadow/meadow.css?v=du-2b5bf1340085b709',
  './chapters/meadow/play.css?v=du-2b5bf1340085b709',
  './chapters/meadow/profile.js?v=du-2b5bf1340085b709',
  './chapters/meadow/studio.js?v=du-2b5bf1340085b709',
  './chapters/park/css/bones.css?v=du-2b5bf1340085b709',
  './chapters/park/css/park.css?v=du-2b5bf1340085b709',
  './chapters/park/index.html?v=du-2b5bf1340085b709',
  './chapters/park/js/app.js?v=du-2b5bf1340085b709',
  './chapters/park/js/bones.js?v=du-2b5bf1340085b709',
  './chapters/park/js/core.js?v=du-2b5bf1340085b709',
  './chapters/park/js/games1.js?v=du-2b5bf1340085b709',
  './chapters/park/js/games2.js?v=du-2b5bf1340085b709',
  './chapters/park/js/games3.js?v=du-2b5bf1340085b709',
  './chapters.js?v=du-2b5bf1340085b709',
  './chapters/car-studio-phaser/index.html?v=du-2b5bf1340085b709',
  './chapters/car-studio-phaser/main.js?v=du-2b5bf1340085b709',
  './chapters/phaser-kit.js?v=du-2b5bf1340085b709',
  './chapters/dino-park-phaser/index.html?v=du-2b5bf1340085b709',
  './chapters/dino-park-phaser/main.js?v=du-2b5bf1340085b709',
  './chapters/meadow-phaser/index.html?v=du-2b5bf1340085b709',
  './chapters/meadow-phaser/main.js?v=du-2b5bf1340085b709',
  './chapters/adventures-phaser/index.html?v=du-2b5bf1340085b709',
  './chapters/adventures-phaser/main.js?v=du-2b5bf1340085b709',
  './fx/du-ambient.js?v=du-2b5bf1340085b709',
  './fx/du-dino.js?v=du-2b5bf1340085b709',
  './fx/du-fx.css?v=du-2b5bf1340085b709',
  './fx/du-fx.js?v=du-2b5bf1340085b709',
  './fx/du-people.css?v=du-2b5bf1340085b709',
  './fx/du-people.js?v=du-2b5bf1340085b709',
  './hub-art.js?v=du-2b5bf1340085b709',
  './hub.css?v=du-2b5bf1340085b709',
  './hub.js?v=du-2b5bf1340085b709',
  './icon-192.png?v=du-2b5bf1340085b709',
  './icon-512.png?v=du-2b5bf1340085b709',
  './icon.svg?v=du-2b5bf1340085b709',
  './index.html?v=du-2b5bf1340085b709',
  './manifest.webmanifest?v=du-2b5bf1340085b709',
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
