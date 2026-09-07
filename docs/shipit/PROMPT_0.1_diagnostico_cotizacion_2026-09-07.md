# PROMPT 0.1 — ¿Desde dónde cotiza el checkout? Diagnóstico (07-09-2026)

Solo lectura. Nada implementado. Espera aprobación de Vero.

## Hallazgo principal: el hoyo de Temuco no es el origen, son las medidas

La única venta a Temuco es la de Scarlett (`scarlett.santis`, La Florida),
orden `c1d1ac72…` del 28-08, Starken, **cobrada $5.433** al comprador
(`orders.shipping_cost`), subsidio 0. Las dos órdenes canceladas del 12-08
al mismo destino también cotizaron $5.433. (No aparece ningún $4.367 en
`orders` para Temuco: si ese número viene del panel de Shipit o de otra
venta, hay que ubicarlo aparte.)

Reproducido hoy contra `POST /v/rates`, La Florida → Temuco:

| Medidas | Quién las usa | Starken | vol. |
|---|---|---|---|
| 22 × 15 × 5 cm, 0,5 kg | **cotización** (defaults de `getShipitQuotes`, `lib/shipit.ts:104-108`) | **$5.433** | 0,50 |
| 7 × 20 × 22 cm, 0,5 kg | **creación** (`estimateBookPackageSize(1)`, `lib/shipit.ts:266-281`, llamado en `app/api/webhooks/mercadopago/route.ts:267`) | **$5.986** | 0,77 |
| 30 × 20 × 22 cm, 2,1 kg | creación con 5 libros | $7.877 | 3,30 |

**$5.986 es exactamente el "costo real" del caso documentado.** El origen
fue La Florida en las dos etapas. La diferencia ($553) sale de que el
checkout cotiza una caja de 22×15×5 y el webhook crea el envío con una de
20×22×7: Starken cobra por peso volumétrico (0,77 kg contra 0,50). Con un
bundle de varios libros la brecha crece (5 libros: $5.433 cotizados contra
$7.877 reales).

Dato al margen: el precio de Starken que ve el checkout ya trae un
`tcc_discount` de la cuenta de Vero ($8.907 de lista → $5.433). Chilexpress
y Bluexpress no tienen descuento. Por eso el envío de prueba del 07-09 por
Chilexpress salió $6.844 y el checkout ofrece Starken a $5.433.

## 1. Traza de la cotización

- `components/checkout/CheckoutForm.tsx:136-141` y
  `BundleCheckoutForm.tsx:141-146` → `POST /api/shipping/quote` con
  `{ listing_id, buyer_address }`. El bundle manda **solo el primer
  listing** (`firstListingId`, línea 124) y **no manda cuántos libros son**.
- `app/api/shipping/quote/route.ts:37-51`: lee `listings.address` y
  `originCommune = extractCommune(listing.address)` (línea 51). **No mira
  al vendedor.** Si el listing no tiene `address` responde 400 "El listing
  no tiene dirección de origen" (43-48); en la práctica no pasa: 0 listings
  activos sin `address` y 0 sin coma.
- `lib/chilexpress.ts:18-40` `extractCommune`: busca un tramo que calce con
  `COMUNAS_CHILE`; si no, el primer tramo que no sea región ni país; si no,
  el primer tramo (la calle).
- `lib/shipit.ts:99-215` `getShipitQuotes(originCommune, destCommune,
  weight=0.5, height=5, width=15, length=22)`: resuelve ids de comuna,
  `POST /v/rates` con `origin_id = id de comuna` (no el origen Shipit),
  filtra `price > 0 && available_to_shipping !== false` (líneas 185-186) y
  ordena por precio.
- Si no hay quotes y `unavailable` es false, el checkout cae a
  `FALLBACK_OPTIONS` de $2.900 (CheckoutForm 18-24, Bundle 15-23).

**Valor cuando el vendedor no tiene `default_address`:** irrelevante para
la cotización, que nunca lo lee. 35 de los 125 vendedores activos no tienen
`default_address`; sus listings igual cotizan desde `listings.address`.

## 2. Cotización vs creación: NO usan la misma regla

`app/api/webhooks/mercadopago/route.ts:19-23`:

```ts
function resolverOrigen(listingAddress, sellerAddress) {
  const conNumero = (a) => !!a && /^.+?\s+\d+/.test(a.split(",")[0]?.trim() ?? "");
  if (conNumero(listingAddress)) return listingAddress;
  return sellerAddress || listingAddress || null;
}
```

Creación (líneas 248-262 y su copia en 490-520): si el `address` del
listing tiene calle con número, usa el listing; **si no, usa
`users.default_address`**. La cotización usa siempre el listing. Divergen
cuando el listing no tiene número y el vendedor vive en otra comuna:
estimación gruesa por SQL, **197 de 3.759 listings activos** tienen una
comuna en `address` que no aparece en el `default_address` de su vendedor.
En el caso Temuco no divergieron (las dos dan La Florida), por eso el
hoyo ahí fue solo de medidas.

Además la creación manda `origin` como dirección suelta (calle, número,
comuna) al endpoint viejo `orders.shipit.cl/v/orders`, no `origin_id`.
Cuando exista `users.shipit_origin_id` (hoy la columna **no existe**), las
dos etapas deberían resolver el origen desde ahí.

## 3. Promo de envío gratis y cotización subestimada

`lib/shipping-promo.ts:60-99` `calcularEnvioPromo`: recibe `fleteCotizado`
(lo que eligió el comprador en el checkout, validado en
`app/api/orders/route.ts:218-221` solo con un piso de $2.900, línea 244) y
reparte: `subsidio = min(flete, 8000)`, `cobrarAlComprador = flete −
subsidio`.

- **Sin promo (Scarlett):** el comprador paga la cotización ($5.433); Shipit
  le cobra a la cuenta de Vero el real ($5.986). **La diferencia la absorbe
  Vero, siempre**, porque el cobro al comprador se fija al pagar y la
  creación ocurre después.
- **Con promo (libros de Vero, ≥ $20.000):** el subsidio se calcula sobre la
  cotización subestimada. Flete cotizado $5.433 → subsidio $5.433, comprador
  $0, real $5.986 → Vero pone $5.986, y `orders.shipping_subsidy` registra
  $5.433: **el registro contable también queda corto**. Con el tope: flete
  cotizado $7.500 → subsidio $7.500, comprador $0; real $8.300 → Vero paga
  $8.300 aunque el tope diga $8.000. El tope protege contra la cotización,
  no contra el costo.
- `orders.shipping_cost` guarda lo que pagó el comprador; no existe columna
  para el costo real de Shipit. Sin eso no hay conciliación posible
  (la guía v2 lo prevé en `shipments.real_cost`).

## 4. Propuesta (cambio mínimo)

1. **Una sola función de origen, compartida.** Sacar `resolverOrigen` del
   webhook a `lib/shipping-origin.ts` con la firma
   `resolverOrigenEnvio({ listingAddress, sellerDefaultAddress,
   shipitOriginId? })` que devuelva `{ address, commune }`. La usan
   `/api/shipping/quote` y el webhook. Cuando `shipit_origin_id` exista
   (fase 1), la comuna sale de `GET /v/origins` (cacheado en memoria como
   `communesCache`), y la dirección suelta deja de mandarse.
   - `/api/shipping/quote` pasa a leer `listings(address, seller_id,
     seller:users(default_address))`. RLS: `users.default_address` no es
     legible con la anon key desde el cierre de PII → la ruta ya usa el
     cliente de servidor con sesión; hay que confirmar que `authenticated`
     ve `default_address` de terceros o usar service role solo para ese
     campo.
2. **Cotizar con las medidas reales.** El checkout manda `item_count`
   (bundle: `listings.length`; single: 1) y la ruta llama
   `getShipitQuotes(origin, dest, ...estimateBookPackageSize(item_count))`.
   Esto solo cierra el hoyo de Temuco ($553) y el de los bundles.
3. **Colchón `SHIPPING_QUOTE_BUFFER_PCT`.** Se aplica en la ruta, no en
   `getShipitQuotes` (que debe seguir devolviendo el precio de Shipit para
   el worker): `price = ceil(price × (1 + pct/100))`, redondeado a $10.
   Fuente del valor, en orden: fila `site_stats.key =
   'shipping_quote_buffer_pct'` (tabla creada el 07-09; se cambia con un
   UPDATE, **sin deploy**), luego env `SHIPPING_QUOTE_BUFFER_PCT`, luego 10.
   Cacheado 5 min con `unstable_cache`. Ojo: en Vercel, cambiar una env
   **sí** exige redeploy; por eso el override en BD es lo que cumple "bajar
   a 0 sin deploy".
4. **Registro para medir.** En la respuesta de la ruta, `origin.commune`,
   `sizes` y `buffer_pct`, y un `console.info("[quote] …")` con origen,
   destino, medidas, precio Shipit y precio ofrecido. Con eso el criterio de
   aceptación (10 cotizaciones ±0 contra el panel antes del colchón) se
   verifica leyendo logs.

Fuera de alcance pero anotado: `app/api/orders/route.ts:218` confía en
`shipping_cost_override` del cliente con un piso de $2.900. Mientras no se
recotice en el servidor, el colchón se puede saltar con un curl. Va para el
PROMPT 0.2 o 1.x.

## 5. Filtro de couriers para modo dropoff (D7 revisada)

**Hoy no se filtra por courier en ninguna parte.** El único filtro es
`price > 0 && available_to_shipping !== false` en `lib/shipit.ts:185-186`.
El checkout muestra todo lo que llega (`quotes.map`, CheckoutForm 448,
Bundle 407). Los nombres que devuelve `/v/rates` son minúsculas:
`starken`, `bluexpress`, `chilexpress` (y en RM→RM aparecen `rayo`,
`recibelo`, `muvsmart`…). Los `courier` guardados en `orders` coinciden:
`bluexpress, chilexpress, starken`.

Propuesta:

- `getShipitQuotes` recibe un opcional `allowedCouriers?: string[]` y
  filtra por `p.courier.name` (minúsculas) después del filtro actual.
  `lib/shipit.ts` expone `DROPOFF_COURIERS = ["chilexpress", "starken",
  "bluexpress"]`.
- La ruta decide: `dispatchMode = seller.shipit_dispatch_mode ?? "dropoff"`
  (columna de la migración de fase 1; hasta que exista, `"dropoff"` para
  todos, que es lo que la fase 1 define). `pickup` → sin filtro.
- Si Shipit devolvió precios pero ninguno de los tres: responder
  `quotes: [], unavailable: true, reason: "Ningún courier con entrega en
  sucursal llega a esa comuna"` → el checkout ya muestra "cambia a
  encuentro en persona" y **no** cae al fallback de $2.900. Hoy no se dio
  ningún caso así en los pares probados (Temuco tiene los tres).
- El webhook crea el envío con `headOrder.courier`, que es el de la quote
  elegida, así que el filtro en la cotización basta para que la creación
  sea consistente. Para el worker de fase 1, `createShipitShipment` debe
  rechazar (no crear) un envío `dropoff` cuyo courier no esté en la lista.

## Evidencia usada

- `orders` + `listings` + `users` para Temuco (3 filas, todas $5.433).
- `POST /v/rates` La Florida→Temuco con tres juegos de medidas (tabla).
- `POST /v/rates` Providencia→Temuco y Santiago Centro→Temuco: mismos
  precios que La Florida (Starken $5.433, Bluexpress $9.124, Chilexpress
  $9.420) → dentro de la RM la comuna de origen no mueve la tarifa; sí la
  mueve el tamaño.
- 0 listings activos sin `address`; 35/125 vendedores activos sin
  `default_address`; ~197 listings con comuna distinta a la del vendedor.
- `users` no tiene ninguna columna `shipit_*`.
