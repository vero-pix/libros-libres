# Shipit automático: de venta pagada a envío con retiro, etiqueta y tracking sin pasar por Vero

Documento de trabajo. Escrito el 06-09-2026 después de un fin de semana en que Vero creó nueve envíos a mano. Se usa como prompt para Claude Code / Claude Desktop y se va marcando a medida que avanza.

## El problema

Cuando MercadoPago confirma un pago, `app/api/webhooks/mercadopago/route.ts` llama a `createShipitOrder()` de `lib/shipit.ts`, que hace `POST https://orders.shipit.cl/v/orders`. Esa es la API de **Ventas** de Shipit: crea un **borrador** y ahí se queda. Todo lo que sigue lo hace Vero a mano en el panel de Shipit, por cada venta:

1. Abrir el borrador, elegir el origen correcto (la dirección del vendedor), confirmar cantidad y dimensiones, crear el envío.
2. Generar el número de seguimiento.
3. Solicitar el retiro a domicilio.
4. Descargar la etiqueta PDF y mandársela al vendedor por WhatsApp.
5. Escribirle al comprador con el número de seguimiento.
6. Pegar el tracking en `orders.tracking_code` para que aparezca en Mis Pedidos.

Con tres vendedores externos despachando la misma semana, son 15 minutos y varios mensajes por venta.

## Lo que ofrece la API de Envíos (verificado el 06-09-2026 con las credenciales del repo)

Headers: `Content-Type: application/json`, `Accept: application/vnd.shipit.v4`, `X-Shipit-Email`, `X-Shipit-Access-Token` (ya están en `.env.local` como `SHIPIT_EMAIL` / `SHIPIT_TOKEN`; `getShippingQuote()` los usa hoy contra `api.shipit.cl`).

### `POST https://api.shipit.cl/v/shipments` — crea el envío completo

Body (lo relevante):

```json
{
  "kind": 0,
  "platform": 2,
  "reference": "TL-xxxxxxxxxxxx",
  "items": 1,
  "courier": { "client": "starken", "selected": true, "payable": false },
  "destiny": {
    "street": "...", "number": 123, "complement": "depto 4",
    "commune_id": 304, "commune_name": "LA FLORIDA",
    "full_name": "...", "email": "...", "phone": "...",
    "kind": "home_delivery"
  },
  "sizes": { "width": 20, "height": 22, "length": 7, "weight": 0.5 },
  "insurance": { "ticket_number": "TL-xxxx", "ticket_amount": 10000, "detail": "Libro usado", "extra": false },
  "origin": { "origin_id": 121573 },
  "sandbox": true
}
```

- `reference`: máximo 15 caracteres. `"TL-" + orderId.slice(0, 12)` da exactamente 15. Para pruebas, prefijo `TEST-`.
- `origin.origin_id`: **obligatorio para que salga desde la casa del vendedor.** Solo acepta orígenes ya registrados en la cuenta (requiere "multiorigen" activado, que ya lo está: hay tres orígenes).
- `sandbox: true` para probar sin generar envíos reales.

Respuesta: `id`, `status` ("created"), `tracking_number` (puede venir `null` los primeros minutos), `pack_pdf` y `ticket_shipit_pdf_url` (etiqueta), `shipit_tracking_link`, y `last_pickup.schedule.{date, range_time}`: **el retiro a domicilio queda agendado solo.**

### `GET https://api.shipit.cl/v/origins` — orígenes registrados

Funciona. Al 06-09-2026 devuelve tres: `100321` "TusLibros" (Vero), `121573` "ocasion " (Libro de Ocasión), `121639` "Scarlett". **No hay endpoint para crear orígenes**: se crean en el panel de Shipit (Configuración → Direcciones), una vez por vendedor.

⚠️ El 05-09 "ocasion" quedó marcado como origen **default** de la cuenta. Hay que volver a dejar "TusLibros" como predeterminado en el panel.

### `GET https://api.shipit.cl/v/shipments/reference/{reference}` — consultar después

Devuelve tracking, etiqueta y `last_pickup`. En la prueba con `TL-50a9fa1d-206` devolvió `{}`: revisar si la referencia se guarda con otro formato o si los envíos creados desde el panel no se ven por API (`GET /v/orders` tampoco los listaba).

### Webhook de Shipit

`/v/webhooks/package` permite configurar una URL a la que Shipit avisa cambios de estado del paquete. Alternativa a consultar por cron.

### Lo que NO existe

- Que el vendedor deje el paquete en un punto o sucursal (lo pidió Carlos de CIM). `destiny.kind = "courier_branch_office"` es para que el **comprador** retire en sucursal. El origen es siempre retiro a domicilio.

## Plan

- [ ] **1. Mapear vendedores a orígenes.** Columna `users.shipit_origin_id integer` (migración en `supabase/migrations/`). Script `scripts/shipit-origenes.mjs` que lea `GET /v/origins` y proponga el match por dirección contra `users.default_address`. Vero confirma y se guarda. Vero = 100321.
- [ ] **2. Reemplazar el borrador por el envío directo.** Nueva función `createShipitShipment()` en `lib/shipit.ts` (dejar `createShipitOrder` como fallback). En el webhook de MP: si el vendedor tiene `shipit_origin_id` → envío directo; si no → borrador como hoy **y gong** "Falta crear origen en Shipit para {vendedor}: {dirección}". Así Vero lo crea una vez y no vuelve a intervenir.
- [ ] **3. Guardar lo que devuelve Shipit** en `orders`: `tracking_code`, `shipping_label_url` (`pack_pdf` o `ticket_shipit_pdf_url`), `shipping_status = "created"`, `shipit_order_id`, y dos columnas nuevas: `pickup_date date` y `pickup_window text`.
- [ ] **4. Completar lo que llega tarde.** Si `tracking_number` o la etiqueta vienen null: cron cada 10 minutos (`app/api/cron/shipit-sync`) que consulte los envíos con `shipping_status = "created"` sin tracking o sin etiqueta, o bien configurar el webhook de Shipit. Reintentar máximo 24 horas y luego gong de alerta.
- [ ] **5. Avisar solo.** Cuando el envío tenga etiqueta y ventana de retiro: correo al vendedor (etiqueta adjunta o enlace, día y ventana del retiro, dirección de retiro, contactos de Shipit) y correo al comprador con el tracking y la fecha estimada. Plantillas en `docs/MENSAJES-ONBOARDING-VENDEDOR.md`, secciones 5b y 5c. El correo de venta actual (`Nueva venta` / `Vendiste un libro`) ya explica el retiro a domicilio; este segundo correo trae la etiqueta.
- [ ] **6. Dimensiones por cantidad.** `estimateBookPackageSize(n)` ya existe; verificar que el bundle multi-libro mande `items = n` y un solo envío por bundle (hoy lo hace).
- [ ] **7. Cotización vs. costo real.** El checkout cobra al comprador la cotización de Shipit, pero el envío a Temuco costó $5.986 y se cobraron $4.367. Revisar `getShippingQuote()` con origen del vendedor (hoy cotiza desde Santiago) y el tope de la promo de envío gratis en `lib/shipping-promo.ts`.
- [ ] **8. Probar.** Con `sandbox: true` y referencia `TEST-...`, un vendedor con origen y otro sin origen. Verificar en el panel de Shipit que el sandbox no genera retiro real. Luego una venta real de Vero.
- [ ] **9. Documentar** en `CLAUDE.md` (tabla de fuentes) y actualizar `/como-despachar` si cambia algo del flujo para el vendedor.

## Preguntas abiertas

- ¿Shipit agenda el retiro el mismo día si el envío se crea antes de cierta hora, o siempre al día hábil siguiente? Lo dice `last_pickup.schedule.date` en la respuesta; anotar el comportamiento real.
- ¿La etiqueta PDF es pública o requiere sesión? Si requiere sesión, descargarla en el servidor y adjuntarla al correo.
- ¿Conviene mandar la etiqueta también por WhatsApp? Hoy no hay integración de WhatsApp saliente; solo `wa.me` con texto prellenado.

## Referencias

- Doc de Shipit: https://developers.shipit.cl/reference (cada página tiene versión `.md` agregando el sufijo).
- Crear envío: https://developers.shipit.cl/reference/crear-un-envío.md
- Consultar por referencia: https://developers.shipit.cl/reference/consultar-un-envío-por-reference.md
- Orígenes: https://developers.shipit.cl/reference/dirección-de-origen.md
- Webhook: https://developers.shipit.cl/reference/configuración-webhook.md
- Soporte Shipit: WhatsApp +56 9 3230 2514 (lunes a viernes 9:00 a 18:00), soporte@shipit.cl
