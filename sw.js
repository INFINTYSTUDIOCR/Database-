/* Infinity Studio CR — PWA service worker (network-first HTML + games shell, cache static assets) */
var CACHE = 'infinity-pwa-v92';
var PRECACHE = [
  '/icon-192.png',
  '/icon-512.png',
  '/css/daily-inspiration.css',
  '/css/pwa-install.css'
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

/** Game HTML/JS must never stick on cache-first — soft-lock fixes live there. */
function isGameShell(url) {
  var p = url.pathname;
  if (p.indexOf('/games/') !== 0) return false;
  return /\.(html|js)$/i.test(p) || /\/games\/[^/]+\/?$/.test(p);
}

function isBrandAsset(url) {
  var p = url.pathname;
  return p.indexOf('/assets/logos/') !== -1
    || p === '/icon-192.png'
    || p === '/icon-512.png';
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

  if (isHtmlNav(req, url) || isGameShell(url)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(function(res) { return res; })
        .catch(function() {
          return caches.match(req).then(function(cached) {
            return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  if (isBrandAsset(url)) {
    event.respondWith(
      fetch(req).then(function(res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function(cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function() { return caches.match(req); })
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

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = '/Infinity_Student_Portal.html?tab=alice&quick=companion';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url && c.url.indexOf('Student_Portal') !== -1 && 'focus' in c) {
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
