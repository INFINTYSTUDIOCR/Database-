/* Infinity Studio CR — PWA service worker (network-first HTML, cache static assets) */
var CACHE = 'infinity-pwa-v3';
var PRECACHE = [
  './icon-192.png',
  './icon-512.png',
  './css/daily-inspiration.css'
];

var SKIP_HOSTS = [
  'supabase.co',
  'onrender.com',
  'anthropic.com',
  'elevenlabs.io',
  'googleapis.com',
  'facebook.com',
  'graph.facebook.com'
];

function shouldSkip(url) {
  if (url.origin !== self.location.origin) {
    return SKIP_HOSTS.some(function(h) { return url.hostname.indexOf(h) !== -1; });
  }
  return false;
}

function isHtmlNav(req, url) {
  if (req.mode === 'navigate') return true;
  var p = url.pathname;
  return p.endsWith('.html') || p.endsWith('/') || (!p.split('/').pop().includes('.') && p.length > 1);
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function(cache) { return cache.addAll(PRECACHE); })
      .then(function() { return self.skipWaiting(); })
      .catch(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
      })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (shouldSkip(url)) return;

  if (url.origin !== self.location.origin) return;

  if (isHtmlNav(req, url)) {
    event.respondWith(
      fetch(req)
        .then(function(res) { return res; })
        .catch(function() { return caches.match(req); })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        var copy = res.clone();
        if (/\.(js|css|png|jpg|webp|woff2?|svg)$/i.test(url.pathname)) {
          caches.open(CACHE).then(function(cache) { cache.put(req, copy); });
        }
        return res;
      });
    })
  );
});
