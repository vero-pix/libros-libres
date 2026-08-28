# Los doce lotes — cómo representarlos en el sitio (Etapa 1)

Escrito el 28-08-2026. **Decisión pendiente de Vero.** El spec de los lotes está
en `content/cards/lotes-vero.json`: 12 lotes, 59 libros, **$526.350 sueltos →
$304.500 en lote** (verificado contra los precios reales de la BD, 59/59 slugs
activos).

> Corrección aplicada al spec: las tres cajas sorpresa estaban en **$19.990**,
> diez pesos bajo el umbral de envío gratis. Subidas a **$20.000**: ahora los
> **12 de 12** gatillan el flete gratis (`PROMO_UMBRAL` en `lib/shipping-promo.ts`,
> con tope de subsidio de $8.000).

## Lo que ya existe y no hay que construir

`/checkout/bundle` acepta **N listings en una sola compra**: crea una orden por
libro con un `bundle_id` compartido, una única preferencia de MercadoPago y el
shipping cobrado una sola vez (`app/api/orders/route.ts`). Es exactamente la
mecánica de un lote. Lo que falta no es el pago: es **la vitrina** y **el bloqueo
de la venta suelta**.

## Las tres opciones

### A · Colección = URL con el checkout precargado

Una ruta `/lote/[slug]` que arma la página desde un JSON versionado y manda a
`/checkout/bundle?ids=...` con los cinco listings.

- **Toca:** 1 página nueva, 1 archivo de datos. **Cero migraciones.**
- **A favor:** es lo más barato y reversible; si un lote no funciona, se borra
  del JSON. Reusa el checkout que hoy está vendiendo.
- **En contra:** los lotes no existen en la BD — no se pueden buscar, no salen en
  el sitemap ni en el feed, y no hay forma de medir cuántos se vieron. El precio
  de lote hay que aplicarlo como descuento en el checkout, que hoy no sabe de eso.

### B · El lote es un listing más

Un `listing` normal con `is_bundle` y una tabla `bundle_items` que apunta a los
cinco libros.

- **Toca:** 1 migración chica, el checkout, la ficha, y el buscador.
- **A favor:** el lote hereda todo gratis — ficha, SEO, feed de Google, carrito,
  destacados, comisión del 8% sobre el precio del lote sin tocar
  `lib/commissions.ts`. Es la que mejor calza con lo que ya está construido.
- **En contra:** un `listing` que contiene otros listings es una excepción que
  hay que recordar en cada consulta (`status`, feed, sitemap). Riesgo de que se
  cuele en lugares donde no corresponde.

### C · Entidad propia `bundles`

Tabla `bundles` + `bundle_items`, con sus rutas y su checkout.

- **Toca:** 2 migraciones, rutas nuevas, checkout, admin.
- **A favor:** es lo correcto si los lotes se vuelven un producto permanente y de
  varios vendedores.
- **En contra:** es la más cara y hoy son **doce lotes de un solo vendedor**. No
  se justifica antes de saber si se venden.

## Recomendación

**Partir por A, con fecha de revisión.** Es una tarde de trabajo, no toca la
mesa de pago que hoy está facturando, y responde la única pregunta que importa:
¿alguien compra un lote? Si a las cuatro semanas se vendió aunque sea uno, se
migra a **B**, que es donde los lotes se ganan el SEO y el feed.

Construir **C** ahora es diseñar para un problema que todavía no se tiene.

## El problema que ninguna opción resuelve sola

**Un libro en lote no puede venderse suelto al mismo tiempo.** Dos salidas:

1. **Pausar los sueltos** (`status` distinto de `active`) mientras el lote esté
   publicado. Simple y a prueba de carreras, pero saca 59 libros del catálogo
   activo y del feed de Google — justo lo que se acaba de arreglar.
2. **Dejarlos activos y resolver al vender**: quien compre primero se lo lleva, y
   la otra vía se cierra. Mantiene los 59 libros visibles, pero hay que manejar
   la carrera entre dos compradores simultáneos.

Con el volumen de hoy —2 ventas pagadas en el día más movido— la carrera es
improbable y la visibilidad vale más. **Recomiendo la 2**, con el chequeo de
disponibilidad en el momento de crear la orden.
