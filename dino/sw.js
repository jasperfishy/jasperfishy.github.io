// Dinosaur Universe — hub service worker.
// The ONLY service worker in the combined app; update-manager.js registers it.
// New releases wait until the player applies them (DU_SKIP_WAITING). The
// jasperfish.com release build stamps VERSION with a content hash.
const VERSION = "du-e3e2759ce3d75cba";
const ASSETS = [
  "./?v=du-e3e2759ce3d75cba",
  "./chapters.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures-phaser/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/adventures-phaser/main.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/assets/daddy-face.svg?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/assets/mummy-face.svg?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/assets/real/README.txt?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/assets/real/manifest.json?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/icon.svg?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/manifest.webmanifest?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/adv-kit.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/fx-games.css?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/fx-kit.css?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/fx-mummy.css?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/fx-play.css?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/fx-puzzle.css?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/fx-quest.css?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/fx-rescue.css?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/main.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/module-registry.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/builder.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/daddy-chase.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/dino-beat.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/dino-care.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/dino-constellations.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/dino-discoveries.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/dino-parade.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/dino-quest.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/dino-rescue.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/fossil.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/habitat-builder.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/hatchling.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/jigsaw.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/memory.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/moonbeam-rescue.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/mummy-cozy-corner.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/picnic.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/rescue/chapters-a.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/rescue/chapters-b.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/rescue/engine.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/shape-safari.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/storybook.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/trail.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/modules/wonder-activities.js?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/src/style.css?v=du-e3e2759ce3d75cba",
  "./chapters/adventures/sw.js?v=du-e3e2759ce3d75cba",
  "./chapters/car-studio-phaser/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/car-studio-phaser/main.js?v=du-e3e2759ce3d75cba",
  "./chapters/dino-park-phaser/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/dino-park-phaser/main.js?v=du-e3e2759ce3d75cba",
  "./chapters/drive/css/style.css?v=du-e3e2759ce3d75cba",
  "./chapters/drive/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/drive/js/data-cars.js?v=du-e3e2759ce3d75cba",
  "./chapters/drive/js/data-scenes.js?v=du-e3e2759ce3d75cba",
  "./chapters/drive/js/main.js?v=du-e3e2759ce3d75cba",
  "./chapters/drive/js/render-car.js?v=du-e3e2759ce3d75cba",
  "./chapters/drive/js/screens/customize.js?v=du-e3e2759ce3d75cba",
  "./chapters/drive/js/screens/drive.js?v=du-e3e2759ce3d75cba",
  "./chapters/drive/js/screens/garage.js?v=du-e3e2759ce3d75cba",
  "./chapters/egg-dash/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/egg-dash/main.js?v=du-e3e2759ce3d75cba",
  "./chapters/meadow-phaser/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/meadow-phaser/main.js?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/app.js?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/art.js?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/catalog.js?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/engine.js?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/games.js?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/icon-192.png?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/icon-512.png?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/icon.svg?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/meadow.css?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/play.css?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/profile.js?v=du-e3e2759ce3d75cba",
  "./chapters/meadow/studio.js?v=du-e3e2759ce3d75cba",
  "./chapters/park/css/bones.css?v=du-e3e2759ce3d75cba",
  "./chapters/park/css/park.css?v=du-e3e2759ce3d75cba",
  "./chapters/park/index.html?v=du-e3e2759ce3d75cba",
  "./chapters/park/js/app.js?v=du-e3e2759ce3d75cba",
  "./chapters/park/js/bones.js?v=du-e3e2759ce3d75cba",
  "./chapters/park/js/core.js?v=du-e3e2759ce3d75cba",
  "./chapters/park/js/games1.js?v=du-e3e2759ce3d75cba",
  "./chapters/park/js/games2.js?v=du-e3e2759ce3d75cba",
  "./chapters/park/js/games3.js?v=du-e3e2759ce3d75cba",
  "./chapters/phaser-kit.js?v=du-e3e2759ce3d75cba",
  "./fx/du-ambient.js?v=du-e3e2759ce3d75cba",
  "./fx/du-dino.js?v=du-e3e2759ce3d75cba",
  "./fx/du-fx.css?v=du-e3e2759ce3d75cba",
  "./fx/du-fx.js?v=du-e3e2759ce3d75cba",
  "./fx/du-journey.js?v=du-e3e2759ce3d75cba",
  "./fx/du-music.js?v=du-e3e2759ce3d75cba",
  "./fx/du-people.css?v=du-e3e2759ce3d75cba",
  "./fx/du-people.js?v=du-e3e2759ce3d75cba",
  "./fx/du-story.css?v=du-e3e2759ce3d75cba",
  "./fx/du-story.js?v=du-e3e2759ce3d75cba",
  "./fx/du-wonder.css?v=du-e3e2759ce3d75cba",
  "./fx/du-wonder.js?v=du-e3e2759ce3d75cba",
  "./games/dino-car-studio/index.html?v=du-e3e2759ce3d75cba",
  "./games/dino-car-studio/main.js?v=du-e3e2759ce3d75cba",
  "./games/dino-park/index.html?v=du-e3e2759ce3d75cba",
  "./games/dino-park/main.js?v=du-e3e2759ce3d75cba",
  "./hub-art.js?v=du-e3e2759ce3d75cba",
  "./hub.css?v=du-e3e2759ce3d75cba",
  "./hub.js?v=du-e3e2759ce3d75cba",
  "./icon-192.png?v=du-e3e2759ce3d75cba",
  "./icon-512.png?v=du-e3e2759ce3d75cba",
  "./icon.svg?v=du-e3e2759ce3d75cba",
  "./index.html?v=du-e3e2759ce3d75cba",
  "./lib/phaser.min.js?v=du-e3e2759ce3d75cba",
  "./manifest.webmanifest?v=du-e3e2759ce3d75cba",
  "./progress.js?v=du-e3e2759ce3d75cba",
  "./update-manager.js?v=du-e3e2759ce3d75cba",
  "./version.json?v=du-e3e2759ce3d75cba"
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
