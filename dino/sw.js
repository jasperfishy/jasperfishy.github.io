// Dinosaur Universe — hub service worker.
// The ONLY service worker in the combined app; update-manager.js registers it.
// New releases wait until the player applies them (DU_SKIP_WAITING). The
// jasperfish.com release build stamps VERSION with a content hash.
const VERSION = "du-a6930f78f9a4718b";
const ASSETS = [
  "./?v=du-a6930f78f9a4718b",
  "./chapters.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures-phaser/index.html?v=du-a6930f78f9a4718b",
  "./chapters/adventures-phaser/main.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/assets/daddy-face.svg?v=du-a6930f78f9a4718b",
  "./chapters/adventures/assets/mummy-face.svg?v=du-a6930f78f9a4718b",
  "./chapters/adventures/assets/real/README.txt?v=du-a6930f78f9a4718b",
  "./chapters/adventures/assets/real/manifest.json?v=du-a6930f78f9a4718b",
  "./chapters/adventures/icon.svg?v=du-a6930f78f9a4718b",
  "./chapters/adventures/index.html?v=du-a6930f78f9a4718b",
  "./chapters/adventures/manifest.webmanifest?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/adv-kit.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/fx-games.css?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/fx-kit.css?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/fx-mummy.css?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/fx-play.css?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/fx-puzzle.css?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/fx-quest.css?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/fx-rescue.css?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/main.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/module-registry.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/builder.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/daddy-chase.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/dino-beat.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/dino-care.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/dino-constellations.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/dino-discoveries.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/dino-parade.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/dino-quest.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/dino-rescue.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/fossil.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/habitat-builder.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/hatchling.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/jigsaw.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/memory.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/moonbeam-rescue.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/mummy-cozy-corner.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/picnic.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/rescue/chapters-a.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/rescue/chapters-b.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/rescue/engine.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/shape-safari.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/storybook.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/trail.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/modules/wonder-activities.js?v=du-a6930f78f9a4718b",
  "./chapters/adventures/src/style.css?v=du-a6930f78f9a4718b",
  "./chapters/adventures/sw.js?v=du-a6930f78f9a4718b",
  "./chapters/car-studio-phaser/index.html?v=du-a6930f78f9a4718b",
  "./chapters/car-studio-phaser/main.js?v=du-a6930f78f9a4718b",
  "./chapters/dino-park-phaser/index.html?v=du-a6930f78f9a4718b",
  "./chapters/dino-park-phaser/main.js?v=du-a6930f78f9a4718b",
  "./chapters/drive/css/style.css?v=du-a6930f78f9a4718b",
  "./chapters/drive/index.html?v=du-a6930f78f9a4718b",
  "./chapters/drive/js/data-cars.js?v=du-a6930f78f9a4718b",
  "./chapters/drive/js/data-scenes.js?v=du-a6930f78f9a4718b",
  "./chapters/drive/js/main.js?v=du-a6930f78f9a4718b",
  "./chapters/drive/js/render-car.js?v=du-a6930f78f9a4718b",
  "./chapters/drive/js/screens/customize.js?v=du-a6930f78f9a4718b",
  "./chapters/drive/js/screens/drive.js?v=du-a6930f78f9a4718b",
  "./chapters/drive/js/screens/garage.js?v=du-a6930f78f9a4718b",
  "./chapters/egg-dash/index.html?v=du-a6930f78f9a4718b",
  "./chapters/egg-dash/main.js?v=du-a6930f78f9a4718b",
  "./chapters/meadow-phaser/index.html?v=du-a6930f78f9a4718b",
  "./chapters/meadow-phaser/main.js?v=du-a6930f78f9a4718b",
  "./chapters/meadow/app.js?v=du-a6930f78f9a4718b",
  "./chapters/meadow/art.js?v=du-a6930f78f9a4718b",
  "./chapters/meadow/catalog.js?v=du-a6930f78f9a4718b",
  "./chapters/meadow/engine.js?v=du-a6930f78f9a4718b",
  "./chapters/meadow/games.js?v=du-a6930f78f9a4718b",
  "./chapters/meadow/icon-192.png?v=du-a6930f78f9a4718b",
  "./chapters/meadow/icon-512.png?v=du-a6930f78f9a4718b",
  "./chapters/meadow/icon.svg?v=du-a6930f78f9a4718b",
  "./chapters/meadow/index.html?v=du-a6930f78f9a4718b",
  "./chapters/meadow/meadow.css?v=du-a6930f78f9a4718b",
  "./chapters/meadow/play.css?v=du-a6930f78f9a4718b",
  "./chapters/meadow/profile.js?v=du-a6930f78f9a4718b",
  "./chapters/meadow/studio.js?v=du-a6930f78f9a4718b",
  "./chapters/park/css/bones.css?v=du-a6930f78f9a4718b",
  "./chapters/park/css/park.css?v=du-a6930f78f9a4718b",
  "./chapters/park/index.html?v=du-a6930f78f9a4718b",
  "./chapters/park/js/app.js?v=du-a6930f78f9a4718b",
  "./chapters/park/js/bones.js?v=du-a6930f78f9a4718b",
  "./chapters/park/js/core.js?v=du-a6930f78f9a4718b",
  "./chapters/park/js/games1.js?v=du-a6930f78f9a4718b",
  "./chapters/park/js/games2.js?v=du-a6930f78f9a4718b",
  "./chapters/park/js/games3.js?v=du-a6930f78f9a4718b",
  "./chapters/phaser-kit.js?v=du-a6930f78f9a4718b",
  "./chapters/sky-mail/atlas.js?v=du-a6930f78f9a4718b",
  "./chapters/sky-mail/audio.js?v=du-a6930f78f9a4718b",
  "./chapters/sky-mail/flight.css?v=du-a6930f78f9a4718b",
  "./chapters/sky-mail/flight.js?v=du-a6930f78f9a4718b",
  "./chapters/sky-mail/index.html?v=du-a6930f78f9a4718b",
  "./fx/du-ambient.js?v=du-a6930f78f9a4718b",
  "./fx/du-dino.js?v=du-a6930f78f9a4718b",
  "./fx/du-fx.css?v=du-a6930f78f9a4718b",
  "./fx/du-fx.js?v=du-a6930f78f9a4718b",
  "./fx/du-journey.js?v=du-a6930f78f9a4718b",
  "./fx/du-music.js?v=du-a6930f78f9a4718b",
  "./fx/du-people.css?v=du-a6930f78f9a4718b",
  "./fx/du-people.js?v=du-a6930f78f9a4718b",
  "./fx/du-story.css?v=du-a6930f78f9a4718b",
  "./fx/du-story.js?v=du-a6930f78f9a4718b",
  "./fx/du-wonder.css?v=du-a6930f78f9a4718b",
  "./fx/du-wonder.js?v=du-a6930f78f9a4718b",
  "./games/dino-car-studio/index.html?v=du-a6930f78f9a4718b",
  "./games/dino-car-studio/main.js?v=du-a6930f78f9a4718b",
  "./games/dino-park/index.html?v=du-a6930f78f9a4718b",
  "./games/dino-park/main.js?v=du-a6930f78f9a4718b",
  "./hub-art.js?v=du-a6930f78f9a4718b",
  "./hub.css?v=du-a6930f78f9a4718b",
  "./hub.js?v=du-a6930f78f9a4718b",
  "./icon-192.png?v=du-a6930f78f9a4718b",
  "./icon-512.png?v=du-a6930f78f9a4718b",
  "./icon.svg?v=du-a6930f78f9a4718b",
  "./index.html?v=du-a6930f78f9a4718b",
  "./lib/phaser.min.js?v=du-a6930f78f9a4718b",
  "./manifest.webmanifest?v=du-a6930f78f9a4718b",
  "./progress.js?v=du-a6930f78f9a4718b",
  "./update-manager.js?v=du-a6930f78f9a4718b",
  "./version.json?v=du-a6930f78f9a4718b"
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
