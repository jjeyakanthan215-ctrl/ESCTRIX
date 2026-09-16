const CACHE_NAME = 'esctrix-v21-instant-quantum';
const OFFLINE_URL = '/offline.html';
const ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/webrtc.js',
    '/static/logo.png',
    '/static/icon-192.png',
    '/static/icon-512.png'
];

// ── Install: resilient pre-cache of core assets ──
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await Promise.allSettled(
                ASSETS.map((asset) =>
                    cache.add(asset).catch((err) => {
                        console.warn('[SW] Pre-cache skipped:', asset, err);
                    })
                )
            );
        })
    );
    self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: Stale-While-Revalidate with Instant Cache Delivery ──
// Never wait for Render cold starts: Return cached DOM instantly (0ms) and update in background!
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request);

            // Revalidation in background
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                })
                .catch(() => {
                    if (event.request.mode === 'navigate' && !cachedResponse) {
                        return cache.match(OFFLINE_URL);
                    }
                    return null;
                });

            // If we have cached copy, return it immediately (<5ms)!
            // Network fetch executes in the background to update cache for next load.
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise, wait for the network (first visit)
            return fetchPromise;
        })
    );
});

// ── Push Notifications ──
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'ESCTRIX';
    const options = {
        body: data.body || 'You have a new message.',
        icon: '/static/icon-192.png',
        badge: '/static/icon-192.png',
        data: { url: data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ──
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) return clientList[0].focus();
            return clients.openWindow(event.notification.data.url || '/');
        })
    );
});

// ── Background Sync ──
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-messages') {
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => client.postMessage({ type: 'sync-messages' }));
            })
        );
    }
});

// ── Periodic Background Sync ──
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'esctrix-periodic-sync') {
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => client.postMessage({ type: 'periodic-sync' }));
            })
        );
    }
});
