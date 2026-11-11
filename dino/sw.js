// Dinosaur Universe — hub service worker.
// The ONLY service worker in the combined app; update-manager.js registers it.
// New releases wait until the player applies them (DU_SKIP_WAITING). The
// jasperfish.com release build stamps VERSION with a content hash.
const VERSION = "du-556d96214a55198f";
const ASSETS = [
  "./?v=du-556d96214a55198f",
  "./chapters.js?v=du-556d96214a55198f",
  "./chapters/adventures-phaser/index.html?v=du-556d96214a55198f",
  "./chapters/adventures-phaser/main.js?v=du-556d96214a55198f",
  "./chapters/adventures/assets/daddy-face.svg?v=du-556d96214a55198f",
  "./chapters/adventures/assets/mummy-face.svg?v=du-556d96214a55198f",
  "./chapters/adventures/assets/real/README.txt?v=du-556d96214a55198f",
  "./chapters/adventures/assets/real/manifest.json?v=du-556d96214a55198f",
  "./chapters/adventures/icon.svg?v=du-556d96214a55198f",
  "./chapters/adventures/index.html?v=du-556d96214a55198f",
  "./chapters/adventures/manifest.webmanifest?v=du-556d96214a55198f",
  "./chapters/adventures/src/adv-kit.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/fx-games.css?v=du-556d96214a55198f",
  "./chapters/adventures/src/fx-kit.css?v=du-556d96214a55198f",
  "./chapters/adventures/src/fx-mummy.css?v=du-556d96214a55198f",
  "./chapters/adventures/src/fx-play.css?v=du-556d96214a55198f",
  "./chapters/adventures/src/fx-puzzle.css?v=du-556d96214a55198f",
  "./chapters/adventures/src/fx-quest.css?v=du-556d96214a55198f",
  "./chapters/adventures/src/fx-rescue.css?v=du-556d96214a55198f",
  "./chapters/adventures/src/main.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/module-registry.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/builder.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/daddy-chase.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/dino-beat.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/dino-care.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/dino-constellations.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/dino-discoveries.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/dino-parade.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/dino-quest.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/dino-rescue.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/fossil.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/habitat-builder.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/hatchling.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/jigsaw.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/memory.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/moonbeam-rescue.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/mummy-cozy-corner.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/picnic.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/rescue/chapters-a.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/rescue/chapters-b.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/rescue/engine.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/shape-safari.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/storybook.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/trail.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/modules/wonder-activities.js?v=du-556d96214a55198f",
  "./chapters/adventures/src/style.css?v=du-556d96214a55198f",
  "./chapters/adventures/sw.js?v=du-556d96214a55198f",
  "./chapters/car-studio-phaser/index.html?v=du-556d96214a55198f",
  "./chapters/car-studio-phaser/main.js?v=du-556d96214a55198f",
  "./chapters/dino-park-phaser/index.html?v=du-556d96214a55198f",
  "./chapters/dino-park-phaser/main.js?v=du-556d96214a55198f",
  "./chapters/drive/css/style.css?v=du-556d96214a55198f",
  "./chapters/drive/index.html?v=du-556d96214a55198f",
  "./chapters/drive/js/data-cars.js?v=du-556d96214a55198f",
  "./chapters/drive/js/data-scenes.js?v=du-556d96214a55198f",
  "./chapters/drive/js/main.js?v=du-556d96214a55198f",
  "./chapters/drive/js/render-car.js?v=du-556d96214a55198f",
  "./chapters/drive/js/screens/customize.js?v=du-556d96214a55198f",
  "./chapters/drive/js/screens/drive.js?v=du-556d96214a55198f",
  "./chapters/drive/js/screens/garage.js?v=du-556d96214a55198f",
  "./chapters/egg-dash/index.html?v=du-556d96214a55198f",
  "./chapters/egg-dash/main.js?v=du-556d96214a55198f",
  "./chapters/meadow-phaser/index.html?v=du-556d96214a55198f",
  "./chapters/meadow-phaser/main.js?v=du-556d96214a55198f",
  "./chapters/meadow/app.js?v=du-556d96214a55198f",
  "./chapters/meadow/art.js?v=du-556d96214a55198f",
  "./chapters/meadow/catalog.js?v=du-556d96214a55198f",
  "./chapters/meadow/engine.js?v=du-556d96214a55198f",
  "./chapters/meadow/games.js?v=du-556d96214a55198f",
  "./chapters/meadow/icon-192.png?v=du-556d96214a55198f",
  "./chapters/meadow/icon-512.png?v=du-556d96214a55198f",
  "./chapters/meadow/icon.svg?v=du-556d96214a55198f",
  "./chapters/meadow/index.html?v=du-556d96214a55198f",
  "./chapters/meadow/meadow.css?v=du-556d96214a55198f",
  "./chapters/meadow/play.css?v=du-556d96214a55198f",
  "./chapters/meadow/profile.js?v=du-556d96214a55198f",
  "./chapters/meadow/studio.js?v=du-556d96214a55198f",
  "./chapters/park/css/bones.css?v=du-556d96214a55198f",
  "./chapters/park/css/park.css?v=du-556d96214a55198f",
  "./chapters/park/index.html?v=du-556d96214a55198f",
  "./chapters/park/js/app.js?v=du-556d96214a55198f",
  "./chapters/park/js/bones.js?v=du-556d96214a55198f",
  "./chapters/park/js/core.js?v=du-556d96214a55198f",
  "./chapters/park/js/games1.js?v=du-556d96214a55198f",
  "./chapters/park/js/games2.js?v=du-556d96214a55198f",
  "./chapters/park/js/games3.js?v=du-556d96214a55198f",
  "./chapters/phaser-kit.js?v=du-556d96214a55198f",
  "./fx/du-ambient.js?v=du-556d96214a55198f",
  "./fx/du-dino.js?v=du-556d96214a55198f",
  "./fx/du-fx.css?v=du-556d96214a55198f",
  "./fx/du-fx.js?v=du-556d96214a55198f",
  "./fx/du-journey.js?v=du-556d96214a55198f",
  "./fx/du-music.js?v=du-556d96214a55198f",
  "./fx/du-people.css?v=du-556d96214a55198f",
  "./fx/du-people.js?v=du-556d96214a55198f",
  "./fx/du-story.css?v=du-556d96214a55198f",
  "./fx/du-story.js?v=du-556d96214a55198f",
  "./fx/du-wonder.css?v=du-556d96214a55198f",
  "./fx/du-wonder.js?v=du-556d96214a55198f",
  "./games/dino-car-studio/index.html?v=du-556d96214a55198f",
  "./games/dino-car-studio/main.js?v=du-556d96214a55198f",
  "./games/dino-park/index.html?v=du-556d96214a55198f",
  "./games/dino-park/main.js?v=du-556d96214a55198f",
  "./hub-art.js?v=du-556d96214a55198f",
  "./hub.css?v=du-556d96214a55198f",
  "./hub.js?v=du-556d96214a55198f",
  "./icon-192.png?v=du-556d96214a55198f",
  "./icon-512.png?v=du-556d96214a55198f",
  "./icon.svg?v=du-556d96214a55198f",
  "./index.html?v=du-556d96214a55198f",
  "./lib/phaser.min.js?v=du-556d96214a55198f",
  "./manifest.webmanifest?v=du-556d96214a55198f",
  "./progress.js?v=du-556d96214a55198f",
  "./update-manager.js?v=du-556d96214a55198f",
  "./version.json?v=du-556d96214a55198f"
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
