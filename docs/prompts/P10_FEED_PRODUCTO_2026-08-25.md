# P10 · Feed de producto — Google Merchant + catálogo Meta

Contexto: el sitio **no tiene ningún feed de producto** (no hay archivo de feed en `app/`,
`public/` ni `scripts/`). Sí tiene JSON-LD de `Product` con `offers`, `price`, `availability`,
`itemCondition` y `shippingDetails` en `app/(main)/libro/[username]/[slug]/page.tsx`, y por eso
GA4 ya registra sesiones de "Organic Shopping". Está a medio camino: Google infiere productos
página por página, pero nadie le está entregando el catálogo completo.

Lo que desbloquea un feed:
- **Google Merchant Center** — fichas gratuitas en la pestaña Shopping, sin gastar en ads.
- **Catálogo de Meta** — hace *etiquetables* las 193 piezas de `ideas/instagram-feed/`: producto
  con precio dentro del post, en vez de "link en la bio".
- Es la única forma automatizable de estar en Facebook. Los grupos de compraventa no tienen API
  desde que Meta la cerró; eso es trabajo a mano y no escala.

```
El sitio no tiene feed de producto. Quiero uno, porque es lo único de Facebook/Google Shopping
que se puede automatizar (los grupos de compraventa de Meta no tienen API y no me interesa el
trabajo manual).

Ya existe la materia prima: la ficha emite JSON-LD de Product con offers, price, availability,
itemCondition y shippingDetails en app/(main)/libro/[username]/[slug]/page.tsx. Revísalo antes
de empezar y reutiliza esa misma lógica en vez de duplicarla.

Qué necesito:

1. Una ruta que sirva el catálogo como feed, cacheada y regenerada a diario (patrón de
   app/sitemap.ts o de los crons de vercel.json, lo que calce mejor). Formato: el que Google
   Merchant Center y el catálogo de Meta acepten sin transformación intermedia — dime cuál
   elegiste y por qué.

2. Campos por ítem: id, title, description, link (URL amigable /libro/[username]/[slug] con UTM
   utm_source=merchant o utm_source=meta según el feed), image_link, availability, price,
   condition, brand o autor, gtin/isbn cuando exista (books.isbn), y shipping con el costo real.
   Ojo: el JSON-LD hoy declara $3.500 fijo de despacho — verifica contra lib/shipit.ts y
   lib/chilexpress.ts si eso sigue siendo cierto, y si implementamos el umbral de envío gratis
   (P1), que el feed lo refleje.

3. REGLA IMPORTANTE — solo entran al feed los listings que se pueden comprar de verdad:
   status active Y vendedor con mercadopago_user_id. Hoy 458 de 2.024 listings activos (23%) son
   de vendedores sin MercadoPago: si entran al feed, Google y Meta mandan gente a una ficha donde
   no se puede pagar, y eso es motivo de suspensión de cuenta además de mala experiencia.

4. Imágenes: prioriza books.cover_url (tapa de catálogo) sobre listing_images. Ya sabemos que la
   foto principal de muchos listings es la contratapa. Si un ítem no tiene imagen usable, que
   quede fuera del feed y aparezca en un log de excluidos que yo pueda revisar.

5. Un script que valide el feed antes de publicarlo: cuántos ítems entran, cuántos se excluyen y
   por qué motivo, y si algún campo obligatorio viene vacío. Quiero ver ese resumen.

No configures nada en las consolas de Google ni de Meta — eso lo hago yo. Tu entrega es la URL
del feed funcionando y las instrucciones de qué pegar dónde.
```

---

## Lo que NO se automatiza, y por qué

Los grupos de compraventa de Facebook (tipo "AMIGA VENDE TU CLOSET CHILE") se publican a mano:
Meta cerró la API de publicación en grupos y no hay vuelta. Sirven, pero como trabajo manual.

Y hay una distinción que conviene tener clara antes de meterse:

- **Para los 198 libros propios de Vero:** los grupos funcionan bien. La venta se cierra por
  comentario y WhatsApp, y da lo mismo — la plata es suya entera, no hay comisión que capturar.
- **Para el marketplace:** son contraproducentes. Entrenan exactamente el hábito que el
  experimento de `lib/whatsapp-policy.ts` está tratando de romper. No promover el marketplace
  ahí mientras se mide la captura.
