// Dinosaur Universe — hub service worker.
// The ONLY service worker in the combined app; update-manager.js registers it.
// New releases wait until the player applies them (DU_SKIP_WAITING). The
// jasperfish.com release build stamps VERSION with a content hash.
const VERSION = "du-f652baf3e7fda2b1";
const ASSETS = [
  "./?v=du-f652baf3e7fda2b1",
  "./chapters.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures-phaser/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/adventures-phaser/main.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/assets/daddy-face.svg?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/assets/mummy-face.svg?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/assets/real/README.txt?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/assets/real/manifest.json?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/icon.svg?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/manifest.webmanifest?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/adv-kit.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/fx-games.css?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/fx-kit.css?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/fx-mummy.css?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/fx-play.css?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/fx-puzzle.css?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/fx-quest.css?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/fx-rescue.css?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/main.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/module-registry.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/builder.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/daddy-chase.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/dino-beat.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/dino-care.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/dino-constellations.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/dino-discoveries.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/dino-parade.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/dino-quest.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/dino-rescue.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/fossil.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/habitat-builder.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/hatchling.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/jigsaw.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/memory.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/moonbeam-rescue.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/mummy-cozy-corner.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/picnic.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/rescue/chapters-a.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/rescue/chapters-b.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/rescue/engine.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/shape-safari.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/storybook.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/trail.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/modules/wonder-activities.js?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/src/style.css?v=du-f652baf3e7fda2b1",
  "./chapters/adventures/sw.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/arcade.css?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/catalog.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/emblems.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/engine.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/amber-cairn.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/bone-bridge.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/burrow-sense.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/cave-line.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/dawn-chorus.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/egg-tilt.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/fossil-brush.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/frost-hollow.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/geyser-leap.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/lantern-watch.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/meteor-herd.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/mud-wall.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/nest-gather.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/pack-draft.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/primal-rhythm.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/ptero-plunge.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/raptor-run.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/ridge-mirror.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/river-braid.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/spear-cast.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/star-path.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/starlight-stalk.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/stego-stand.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/tar-pit.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/thermal-soar.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/tide-causeway.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/trike-charge.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/vine-cannon.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/games/volcano-escape.js?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/arcade/main.js?v=du-f652baf3e7fda2b1",
  "./chapters/car-studio-phaser/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/car-studio-phaser/main.js?v=du-f652baf3e7fda2b1",
  "./chapters/dino-park-phaser/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/dino-park-phaser/main.js?v=du-f652baf3e7fda2b1",
  "./chapters/drive/css/style.css?v=du-f652baf3e7fda2b1",
  "./chapters/drive/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/drive/js/data-cars.js?v=du-f652baf3e7fda2b1",
  "./chapters/drive/js/data-scenes.js?v=du-f652baf3e7fda2b1",
  "./chapters/drive/js/main.js?v=du-f652baf3e7fda2b1",
  "./chapters/drive/js/render-car.js?v=du-f652baf3e7fda2b1",
  "./chapters/drive/js/screens/customize.js?v=du-f652baf3e7fda2b1",
  "./chapters/drive/js/screens/drive.js?v=du-f652baf3e7fda2b1",
  "./chapters/drive/js/screens/garage.js?v=du-f652baf3e7fda2b1",
  "./chapters/egg-dash/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/egg-dash/main.js?v=du-f652baf3e7fda2b1",
  "./chapters/meadow-phaser/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/meadow-phaser/main.js?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/app.js?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/art.js?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/catalog.js?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/engine.js?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/games.js?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/icon-192.png?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/icon-512.png?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/icon.svg?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/meadow.css?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/play.css?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/profile.js?v=du-f652baf3e7fda2b1",
  "./chapters/meadow/studio.js?v=du-f652baf3e7fda2b1",
  "./chapters/park/css/bones.css?v=du-f652baf3e7fda2b1",
  "./chapters/park/css/park.css?v=du-f652baf3e7fda2b1",
  "./chapters/park/index.html?v=du-f652baf3e7fda2b1",
  "./chapters/park/js/app.js?v=du-f652baf3e7fda2b1",
  "./chapters/park/js/bones.js?v=du-f652baf3e7fda2b1",
  "./chapters/park/js/core.js?v=du-f652baf3e7fda2b1",
  "./chapters/park/js/games1.js?v=du-f652baf3e7fda2b1",
  "./chapters/park/js/games2.js?v=du-f652baf3e7fda2b1",
  "./chapters/park/js/games3.js?v=du-f652baf3e7fda2b1",
  "./chapters/phaser-kit.js?v=du-f652baf3e7fda2b1",
  "./chapters/sky-mail/atlas.js?v=du-f652baf3e7fda2b1",
  "./chapters/sky-mail/audio.js?v=du-f652baf3e7fda2b1",
  "./chapters/sky-mail/flight.css?v=du-f652baf3e7fda2b1",
  "./chapters/sky-mail/flight.js?v=du-f652baf3e7fda2b1",
  "./chapters/sky-mail/index.html?v=du-f652baf3e7fda2b1",
  "./fx/du-ambient.js?v=du-f652baf3e7fda2b1",
  "./fx/du-dino.js?v=du-f652baf3e7fda2b1",
  "./fx/du-fx.css?v=du-f652baf3e7fda2b1",
  "./fx/du-fx.js?v=du-f652baf3e7fda2b1",
  "./fx/du-journey.js?v=du-f652baf3e7fda2b1",
  "./fx/du-music.js?v=du-f652baf3e7fda2b1",
  "./fx/du-people.css?v=du-f652baf3e7fda2b1",
  "./fx/du-people.js?v=du-f652baf3e7fda2b1",
  "./fx/du-story.css?v=du-f652baf3e7fda2b1",
  "./fx/du-story.js?v=du-f652baf3e7fda2b1",
  "./fx/du-wonder.css?v=du-f652baf3e7fda2b1",
  "./fx/du-wonder.js?v=du-f652baf3e7fda2b1",
  "./games/dino-car-studio/index.html?v=du-f652baf3e7fda2b1",
  "./games/dino-car-studio/main.js?v=du-f652baf3e7fda2b1",
  "./games/dino-park/index.html?v=du-f652baf3e7fda2b1",
  "./games/dino-park/main.js?v=du-f652baf3e7fda2b1",
  "./hub-art.js?v=du-f652baf3e7fda2b1",
  "./hub.css?v=du-f652baf3e7fda2b1",
  "./hub.js?v=du-f652baf3e7fda2b1",
  "./icon-192.png?v=du-f652baf3e7fda2b1",
  "./icon-512.png?v=du-f652baf3e7fda2b1",
  "./icon.svg?v=du-f652baf3e7fda2b1",
  "./index.html?v=du-f652baf3e7fda2b1",
  "./lib/phaser.min.js?v=du-f652baf3e7fda2b1",
  "./manifest.webmanifest?v=du-f652baf3e7fda2b1",
  "./progress.js?v=du-f652baf3e7fda2b1",
  "./update-manager.js?v=du-f652baf3e7fda2b1",
  "./version.json?v=du-f652baf3e7fda2b1"
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
