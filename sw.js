// Nitros Bike - Service Worker (estrategia: network-first com fallback ao cache)
// Sintaxe ES5 de proposito (Android antigo). Ao mudar qualquer arquivo do app, suba o numero da versao.
var CACHE_PREFIX = 'nitros-bike-app-';
var CACHE_NAME = CACHE_PREFIX + 'v3';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo_site.png',
  './logo_os.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // add() individual: um arquivo ausente nao derruba a instalacao inteira
      return Promise.all(ASSETS.map(function(url) {
        return cache.add(url).catch(function() {});
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      // So apaga caches antigos DESTE app (o GitHub Pages divide a origem entre repositorios)
      return Promise.all(keys.map(function(key) {
        if (key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  if (req.url.indexOf('http') !== 0) return;

  event.respondWith(
    fetch(req).then(function(response) {
      if (response && response.status === 200 && response.type === 'basic') {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(req).then(function(cached) {
        if (cached) return cached;
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
