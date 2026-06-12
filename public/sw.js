// Service worker mínimo para instalabilidade PWA (app shell).
// Em produção pode evoluir para cache de vídeos/offline.
const CACHE = "psico-cursos-v1";
const APP_SHELL = ["/", "/admin"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Nunca interceptar streaming de vídeo nem chamadas de API.
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }
  // Network-first para navegação; cache como fallback offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("/")))
  );
});
