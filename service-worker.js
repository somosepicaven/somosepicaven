const CACHE_NAME = 'epica-os-deploy-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Si la ruta contiene peticiones a la nube (Firestore o la API PHP alterna) no cacheamos a la fuerza
    if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('api.php')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // Fallback a index.html en caso de desconexión sin caché
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
