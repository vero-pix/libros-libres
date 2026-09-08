// Service worker de tuslibros.cl
//
// ⚠️ NO CACHEAR HTML. La versión v2 guardaba en caché toda respuesta GET
// exitosa, incluido el HTML del home, y precacheaba "/" al instalarse. Como el
// nombre de la caché no cambiaba nunca, esa copia sobrevivía a los deploys: el
// 07-09-2026 le servía a un usuario recurrente una home de días atrás, con la
// sección de "Librerías de confianza" vieja, mientras el servidor ya devolvía
// la nueva. Desde afuera era indistinguible de un deploy que no salió.
//
// Regla desde v3: el service worker solo toca estáticos con hash en el nombre
// (/_next/static/), imágenes, fuentes y el manifest. Las navegaciones y los
// payloads RSC de Next pasan directo a la red, siempre.
const CACHE_NAME = "tuslibros-v3";

// "/" ya no se precachea: era la copia que quedaba pegada.
const PRECACHE = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Borra tuslibros-v2 (y cualquier anterior) en la primera visita de cada
  // usuario después de este deploy. Es lo que purga el HTML viejo.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Solo se cachea lo que lleva hash en el nombre o no cambia con un deploy. */
function esEstaticoCacheable(request, url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname === "/manifest.json") return true;
  return ["style", "script", "font", "image"].includes(request.destination);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Cross-origin (portadas de Google Books, Supabase Storage, analytics) pasa
  // directo: interceptarlas y que fallaran rompía con "Failed to convert value
  // to 'Response'".
  if (!request.url.startsWith(self.location.origin)) return;

  const url = new URL(request.url);

  // Navegaciones, payloads RSC de Next y cualquier cosa que pida HTML: NUNCA
  // se cachean ni se sirven desde caché. Sin esto, un deploy no llega a los
  // usuarios que ya visitaron el sitio.
  if (
    request.mode === "navigate" ||
    url.searchParams.has("_rsc") ||
    (request.headers.get("accept") || "").includes("text/html")
  ) {
    return;
  }

  if (!esEstaticoCacheable(request, url)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        // respondWith() exige un Response válido SIEMPRE: caches.match() puede
        // devolver undefined y no se retorna crudo.
        const cached = await caches.match(request);
        return cached || Response.error();
      })
  );
});
