const CACHE = "super2s-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest-v2.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // Always check the live website first for the main page.
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Other local files can use the cache first.
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
