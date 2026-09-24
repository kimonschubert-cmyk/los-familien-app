const CACHE_NAME = "los-app-shell-v4";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    fetch(request, { cache: "no-store" })
      .then(response => {
        if (response.ok) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseCopy);
          });
        }

        return response;
      })
      .catch(() => caches.match(request))
  );
});
