const CACHE_NAME = 'ayexpress-cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache the application shell, which is the minimal HTML, CSS, and JS
      // required to power the user interface.
      return cache.addAll([
          '/',
          '/index.html'
      ]);
    })
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported.
      // This allows the browser to start fetching the page in parallel
      // with service worker startup.
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      // Clean up old caches to remove outdated assets.
      const cacheNames = await caches.keys();
      await Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })()
  );
  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener('fetch', event => {
    // For navigation requests (e.g., loading a new page), use a network-first strategy.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    // Try to use the preloaded response if available.
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                        return preloadResponse;
                    }
                    // Otherwise, fetch from the network.
                    const networkResponse = await fetch(event.request);
                    return networkResponse;
                } catch (error) {
                    // If the network fails, serve the cached root page as a fallback.
                    console.log('Fetch failed; returning offline page instead.', error);
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match('/'); 
                    return cachedResponse;
                }
            })()
        );
    } else {
        // For all other requests (assets, APIs), use a cache-first strategy.
        event.respondWith(
            (async () => {
                // Check the cache for a matching response.
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                try {
                    // If not in cache, fetch from the network.
                    const networkResponse = await fetch(event.request);
                    
                    // Do not cache non-GET requests (e.g., POST, PUT).
                    if (event.request.method !== 'GET') {
                        return networkResponse;
                    }

                    // Only cache valid responses.
                    if (networkResponse && networkResponse.status === 200) {
                        const cache = await caches.open(CACHE_NAME);
                        // Clone the response to store it in the cache.
                        await cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    // Handle failed fetches for assets.
                    console.log('Fetch failed for non-navigation request.', event.request.url);
                    return new Response('', { status: 503, statusText: 'Service Unavailable' });
                }
            })()
        );
    }
});
