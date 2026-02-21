const CACHE_NAME = "roqucho-game-v2";
const ASSETS_TO_CACHE = [
  "./index.html",
  "./style.css",
  "./game.js",
  "./manifest.json",
  "./sprites/pet_idle.png",
  "./sprites/pet_tired.png",
  "./sprites/pet_hungry.png",
  "./sprites/pet_play.png",
  "./sprites/pet_happy.png",
  "./sprites/pet_sad.png",
  "./sprites/tim_front.png",
  "./sprites/fruit.png",
  "./sprites/plancton.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.method === "GET") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
