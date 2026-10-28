// Ruta de Estudio: funciona sin internet.
// Cuando subas una versión nueva de index.html, cambia el número de VERSION.
const VERSION = 'ruta-v2'; // v2: mascota Goliat e íconos nuevos
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'ruta-fonts').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fuentes de Google: se guardan la primera vez para usarlas sin internet.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open('ruta-fonts').then(cache =>
      cache.match(req).then(hit => hit || fetch(req).then(res => { cache.put(req, res.clone()); return res; }).catch(() => hit))
    ));
    return;
  }

  if (url.origin !== location.origin) return;

  // La página: primero internet (para recibir actualizaciones), si no hay, la copia guardada.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Íconos y demás: la copia guardada, o internet si no está.
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
