// Service Worker for offline support
const CACHE_NAME = 'fitness-guard-v1';
const urlsToCache = [
    '/',
    '/overview.html',
    '/workouts.html',
    '/analytics.html',
    '/goals.html',
    '/history.html',
    '/settings.html',
    '/dashboard.css',
    '/overview.js',
    '/workouts.js',
    '/analytics.js',
    '/goals.js',
    '/history.js',
    '/settings.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
