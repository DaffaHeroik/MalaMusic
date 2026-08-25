const CACHE_STATIC_NAME = 'malamusic-static-v134';
const CACHE_DATA_NAME = 'malamusic-api-v52';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo-mark.png',
  '/banner.png',
  '/firebase.js?v=134',
  '/app.js?v=134',
  '/player.js?v=134',
  '/listen-together.js?v=134',
  '/fullplayer.js?v=134',
  '/miniplayer.js?v=134',
  '/home.js?v=134',
  '/library.js?v=134',
  '/liked.js?v=134',
  '/search.js?v=134',
  '/blend.js?v=134',
  '/album.js?v=134',
  '/artist.js?v=134',
  '/profile.js?v=134',
  '/streak.js?v=134',
  '/leaderboard.js?v=134',
  '/stats.js?v=134',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

// Install Event - Pre-cache Static Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => {
          return fetch(url).then((res) => {
            if (res.status === 200 || res.type === 'opaque') {
              return cache.put(url, res);
            }
          }).catch((err) => {
            console.warn('[SW] Failed to cache:', url, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DATA_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle Offline & Caching
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navigation requests -> Network first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html', { ignoreSearch: true }) || caches.match('/', { ignoreSearch: true });
      })
    );
    return;
  }

  // Offline binary audio is explicitly cached and must never fall back to network.
  if (url.pathname.startsWith('/offline-audio/')) {
    event.respondWith(caches.match(request).then((cached) => cached || new Response('Offline audio tidak tersedia', { status: 404 })));
    return;
  }

  // Audio proxy responses are ranged media streams, not JSON APIs. Pass them through
  // untouched so a partial-content response is consumed by the native audio element.
  if (url.pathname === '/api/proxy-audio') {
    event.respondWith(fetch(request));
    return;
  }

  // 2. API Routes -> cache only explicitly public catalog/content reads.
  // Auth, profile, library, stats, streak, rooms, resolver/audio, and all writes stay network-only.
  if (url.pathname.startsWith('/api/')) {
    const publicCatalogApi = /^\/api\/(search|suggest|artist|album|lyrics)$/.test(url.pathname);
    const privateApi = !publicCatalogApi || request.method !== 'GET' || request.headers.has('cookie');
    if (privateApi) {
      event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ status: false, offline: true, message: 'Anda sedang offline' }), { headers: { 'Content-Type': 'application/json' } })));
      return;
    }
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          try {
            const cache = await caches.open(CACHE_DATA_NAME);
            await cache.put(request, networkResponse.clone());
          } catch (_) {}
        }
        return networkResponse;
      } catch (_) {
        try {
          const cachedResponse = await caches.match(request, { ignoreSearch: true });
          if (cachedResponse) return cachedResponse;
        } catch (_) {}
        return new Response(
          JSON.stringify({ status: false, offline: true, message: 'Anda sedang offline (PWA Offline Mode)' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    })());
    return;
  }

  // 3. HTML dan JavaScript -> network first agar deploy terbaru selalu tampil saat online
  const isFreshAppAsset = url.pathname === '/' || url.pathname === '/index.html' || url.pathname.endsWith('.js');
  if (isFreshAppAsset) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_STATIC_NAME).then((cache) => cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => caches.match(request).then((cachedResponse) => cachedResponse || caches.match('/index.html', { ignoreSearch: true })))
    );
    return;
  }

  // 4. Other static assets -> cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache freshness if online
        if (navigator.onLine) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              caches.open(CACHE_STATIC_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_STATIC_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Jangan mengganti artwork dengan logo aplikasi. Biarkan caller memakai cover lama/FI.
        // Logo fallback membuat browser menganggap logo MalaMusic sebagai cover lagu aktif.
        if (request.headers.get('accept')?.includes('image')) {
          return new Response('', { status: 504, statusText: 'Artwork unavailable' });
        }
      });
    })
  );
});
