/* Service Worker — アプリ本体と同梱データをキャッシュし、オフラインでも動かす。
 * 写真（Wikimedia Commons の遠隔画像）はキャッシュせず、オンライン時のみ表示する。
 * データを更新したら CACHE_VERSION を上げること。 */
var CACHE_VERSION = 'cka-static-v3';
var CORE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon.svg',
  './js/store.js',
  './js/engine.js',
  './js/terms.js',
  './js/map.js',
  './js/media.js',
  './js/app.js',
  './data/questions.json',
  './data/glossary.json',
  './data/choice_notes.json',
  './data/link_guards.json',
  './data/media_links.json',
  './data/tables.json',
  './data/producer_highlights.json',
  './data/photos.json',
  './data/world_countries.geojson',
  './data/cherry-cross-section.svg',
  './data/processing-flows.svg',
  './data/roast-curve.svg',
  './data/variety-lineage.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      /* 1件の失敗で全体を落とさないよう、個別に追加する */
      return Promise.all(CORE.map(function (u) {
        return cache.add(u).catch(function () { /* 取れないものはオンラインで補う */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  /* 写真などの外部リソースは素通し（オンライン時のみ） */
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(event.request).then(function (res) {
        if (event.request.method === 'GET' && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      });
    })
  );
});
