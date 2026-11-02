const VERSION = 'dino-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL_FILES = [
  '/dino/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((res) => { const copy = res.clone(); caches.open(SHELL_CACHE).then((c) => c.put(request, copy)); return res; }).catch(() => caches.match(request).then((r) => r || caches.match('/dino/'))));
    return;
  }

  if (url.pathname.startsWith('/dino/games/') || url.pathname.startsWith('/dino/assets/')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((res) => { const copy = res.clone(); caches.open(ASSET_CACHE).then((c) => c.put(request, copy)); return res; })));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => {
    const network = fetch(request).then((res) => { const copy = res.clone(); caches.open(ASSET_CACHE).then((c) => c.put(request, copy)); return res; }).catch(() => cached);
    return cached || network;
  }));
});
