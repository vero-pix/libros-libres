# Shipit automático v2 — arquitectura validada y plan de trabajo

**07-09-2026.** Reemplaza el plan de `shipit-automatico.md` (06-09). El diagnóstico de esa guía sigue vigente (API de Ventas crea borradores; se necesita la API de Envíos). Cambia el *cómo*: la v1 hacía el envío dentro del webhook de MercadoPago sin idempotencia; la v2 separa "registrar el pago" de "crear el envío" con una cola y un worker. Auditoría completa en el proyecto Claude: `claude/AUDITORIA_SHIPIT_Y_VENTAS_2026_09_07.md`.

---

## REGLA PARA CLAUDE CODE — leer antes de cualquier prompt de esta guía

> **No implementes nada hasta que hayamos validado la arquitectura.** Cada fase parte con un prompt de diagnóstico o diseño. Muestra código existente, propón, y espera aprobación explícita ("aprobado, implementa") antes de escribir migraciones, rutas o cambios en `lib/`. Si en el diagnóstico encuentras algo que contradice esta guía, dilo antes de seguir. No "aproveches" de arreglar cosas fuera del alcance del prompt.

---

## Decisiones tomadas (Vero, 07-09-2026)

| # | Decisión |
|---|---|
| D1 | El origen Shipit de un vendedor se crea **al conectar MercadoPago**, en el panel de Shipit, antes de habilitar courier para ese vendedor. Sin `shipit_origin_id` el checkout de ese vendedor **no ofrece courier**, solo entrega en persona. Vero sale del loop post-venta. |
| D2 | La cotización se hace con el `origin_id` real del vendedor (fase 0). Mientras se valida, colchón temporal de **+10%** sobre la cotización, configurable por env, con fecha de retiro a dos semanas. |
| D3 | La etiqueta se descarga en el servidor a Supabase Storage (bucket privado). Al vendedor le llega **adjunta por correo y con link firmado (7 días)** desde `/mis-ventas`. Nunca se persiste ni se envía la URL de Shipit. |
| D4 | Apertura a producción **por vendedor** (`users.shipit_auto_enabled`): Vero → Libro de Ocasión → resto. |
| D5 | Webhook de Shipit en **fase 2**. Fase 1 cubre tracking y etiqueta con el worker. (Pendiente de confirmar por Vero; se asume la recomendación.) |
| D6 | **El origen es variable por vendedor** (`users.shipit_origin_id`), nunca la cuenta de Vero. Un envío sin origen resuelto no se crea. |
| D7 | **La modalidad de despacho es elección del vendedor**, no de la plataforma: (a) *Retiro Héroe* — Shipit pasa a buscar el paquete (solo Región Metropolitana); (b) *Entrega en courier* — el vendedor imprime la etiqueta y deja el paquete en la sucursal del courier asignado. Se guarda como `users.shipit_dispatch_mode` (`pickup` / `dropoff`) con default según región del vendedor, y el vendedor puede cambiarlo por pedido desde `/mis-ventas` mientras el envío esté en `label_ready`. Los usuarios reportan que la falta de esta opción es limitante. |

**Nota sobre D7.** La guía v1 afirmaba que "el origen es siempre retiro a domicilio" y que dejar el paquete en sucursal "no existe". El centro de ayuda de Shipit dice otra cosa: el Retiro Héroe solo opera en la RM y, fuera de ella, el remitente **deja el paquete en la sucursal del courier asignado** con la etiqueta de Shipit. Es decir, el drop-off existe operativamente; lo que falta confirmar es cómo se expresa en `POST /v/shipments` (campo, o configuración de la cuenta/origen) y si un envío en la RM puede crearse sin agendar retiro. Eso es el PROMPT 0.3.

---

## Arquitectura

```
MP webhook (payment approved)
   ├─ UPDATE orders SET status='paid' … WHERE bundle_id=? AND status<>'paid'   (transición condicional)
   ├─ si cambió a paid y hay courier: INSERT shipments(bundle_id, status='pending') ON CONFLICT DO NOTHING
   └─ 200 OK. Sin llamadas a Shipit ni correos de etiqueta aquí.

Cron /api/cron/shipments  (cada 3 min, CRON_SECRET, SHIPIT_MODE)
   ├─ pending        → vendedor sin origen → needs_origin (gong + correo a Vero)   [no debería ocurrir por D1]
   │                  → POST /v/shipments (sandbox si SHIPIT_MODE≠live) → created
   ├─ created        → GET /v/shipments/{id} → tracking + pack_pdf → descargar PDF → Storage → label_ready
   ├─ label_ready    → correo vendedor (etiqueta adjunta + link firmado + ventana retiro) + correo comprador (tracking) → notified
   ├─ notified       → last_pickup con fecha → pickup_scheduled
   └─ cualquier estado > 24 h sin avanzar → stalled (gong); attempts ≥ 5 → failed (gong)

Fase 2: webhook Shipit → in_transit / delivered / failed
```

Tres capas de idempotencia: `shipments.bundle_id UNIQUE` + `ON CONFLICT DO NOTHING`; `reference` determinista (`TL-` + 12 chars del bundle_id) y `UNIQUE`; transición condicional de estado antes de cada llamada externa, y consulta por `reference`/`id` antes de reintentar una creación fallida.

`SHIPIT_MODE = dry-run | sandbox | live`. `dry-run` escribe en `shipit_events` lo que haría, sin llamar. `live` solo para vendedores con `shipit_auto_enabled = true`.

### Modelo de datos

- `shipments`: `id`, `bundle_id` UNIQUE, `order_head_id`, `seller_id`, `status` enum(`pending, created, label_ready, notified, pickup_scheduled, in_transit, delivered, needs_origin, stalled, failed`), `shipit_id`, `reference` UNIQUE, `tracking_number`, `label_path`, `pickup_date`, `pickup_window`, `quoted_cost`, `real_cost`, `attempts`, `last_error`, `created_at`, `updated_at`.
- `shipit_events`: `shipment_id`, `kind` (`create|get|webhook|email|dry-run`), `request` jsonb, `response` jsonb, `http_status`, `cost`, `created_at`. Auditoría y conciliación contra factura Shipit.
- `users`: `shipit_origin_id integer`, `shipit_origin_verified_at`, `shipit_auto_enabled boolean default false`, `shipit_dispatch_mode text check in ('pickup','dropoff')` (default `dropoff` fuera de la RM, `pickup` en la RM).
- `shipments.dispatch_mode` (`pickup` / `dropoff`), copiado del vendedor al crear y editable por el vendedor hasta `label_ready`. Determina el correo que recibe (ventana de retiro vs. "imprime y deja en sucursal {courier} más cercana") y si `pickup_date` aplica.
- `orders.tracking_code` / `shipping_status` / `shipping_label_url`: el worker los rellena desde `shipments` para no romper `/mis-pedidos` y `/mis-ventas`. `shipping_label_url` pasa a guardar el path de Storage, no una URL.

---

## Fases y prompts

Pegar uno por uno. Cada prompt cierra con su criterio de aceptación antes del siguiente.

### FASE 0 — reducir riesgo hoy (independiente del resto)

**PROMPT 0.1 — cotización con origen real**

```
Contexto: tuslibros.cl (Next.js + Supabase + MercadoPago + Shipit). Lee
docs/prompts/shipit-automatico-v2.md, sección "REGLA PARA CLAUDE CODE".
No implementes nada en este prompt.

PROBLEMA: getShipitQuotes() en lib/shipit.ts cotiza desde la comuna de
origen que le pasa el checkout. Necesito saber desde dónde cotiza HOY en
la práctica. Caso documentado: envío a Temuco cobrado $4.367, costo real
$5.986.

DIAGNÓSTICO:
1. Traza la llamada de cotización desde el checkout (app/(main)/checkout
   y app/api/shipping) hasta getShipitQuotes(). Muéstrame archivo y línea
   de dónde sale originCommune y qué valor toma cuando el listing no tiene
   comuna o el vendedor no tiene default_address.
2. Compara con el flujo de creación en app/api/webhooks/mercadopago/
   route.ts (resolverOrigen): ¿cotización y creación usan el mismo origen?
3. Lee lib/shipping-promo.ts y dime cómo interactúa el tope de envío
   gratis con una cotización subestimada: ¿quién absorbe la diferencia?
4. Propón el cambio mínimo para que la cotización use la comuna del
   origen real del vendedor (users.default_address → comuna, o
   shipit_origin_id cuando exista) y un colchón SHIPPING_QUOTE_BUFFER_PCT
   por env (default 10) que se pueda bajar a 0 sin deploy.

Entrega el diagnóstico con evidencia de código y la propuesta. Espera mi
aprobación para implementar.
```

Criterio de aceptación: 10 cotizaciones de prueba (5 pares de comunas, 2 vendedores) coinciden con el tarifario del panel de Shipit ±0 antes del colchón.

**PROMPT 0.2 — webhook idempotente y ruido IPN**

```
Lee docs/prompts/shipit-automatico-v2.md. No implementes nada en este
prompt.

DATOS: mp_webhook_log entre el 03 y el 06 de septiembre registra 156
'firma_invalida' y 10 'aplicado'. Todas las rechazadas tienen payload
{topic, resource} (formato IPN), sin type/action. MercadoPago las
reintenta en ráfagas porque respondemos 401.

Además, el branch status==='paid' de app/api/webhooks/mercadopago/
route.ts ejecuta en cada llamada: update de orders, listings, comisión,
Shipit y dos correos. Si MP reenvía payment.updated de un pago ya
aplicado, todo se ejecuta otra vez.

DIAGNÓSTICO:
1. Confirma con el log que cada pago aplicado recibió exactamente UN
   evento firmado (type=payment) y N notificaciones IPN. ¿Hubo algún caso
   de dos eventos firmados para el mismo payment_id? Muéstrame la query.
2. Diseña la transición idempotente: UPDATE orders SET status='paid' …
   WHERE bundle_id=? AND status<>'paid' RETURNING id. Solo si devuelve
   filas se ejecutan efectos (listings, comisión, correos). Muéstrame el
   diff propuesto sin aplicarlo.
3. Para IPN: propón responder 200 sin procesar (con log resultado=
   'ipn_ignorado') o verificarlas con data.id del query string según la
   doc de MP. Recomienda una y justifica.
4. Dime qué se rompe si el webhook responde 200 en menos de 2 s y deja
   correos y Shipit para después (esto prepara la FASE 1).

Espera mi aprobación.
```

Criterio de aceptación: replay manual de un `payment.updated` de un pago ya aplicado no produce correos ni cambios; el log deja de mostrar `firma_invalida` para IPN.

**PROMPT 0.3 — modalidad de despacho en la API de Shipit (bloquea D7)**

```
Lee docs/prompts/shipit-automatico-v2.md, decisión D7. No implementes nada.

Necesito saber cómo se le dice a Shipit que un envío NO lleva Retiro
Héroe porque el vendedor va a dejar el paquete en la sucursal del courier.

1. Descarga https://developers.shipit.cl/llms.txt y las páginas .md de
   crear envío, orígenes y retiros. Busca cualquier campo o endpoint
   relacionado con pickup/retiro/withdrawal/dropoff/"entrega en courier"
   en el body de POST /v/shipments, en la configuración del origen
   (GET /v/origins) o en un endpoint aparte.
2. Con SHIPIT_MODE=sandbox, crea dos envíos de prueba (reference TEST-…)
   desde el origen 100321 (RM) y dime qué devuelve last_pickup en cada
   uno y si hay forma de que venga sin agenda.
3. Si la API no lo expone, redacta la pregunta exacta para
   soporte@shipit.cl (con los ids de los envíos de prueba) y dime qué
   alternativa queda: dos cuentas/orígenes con configuración distinta, o
   cancelar el retiro después de crear.
4. Confirma si la etiqueta pack_pdf es aceptada en sucursal del courier
   sin retiro agendado (busca en el centro de ayuda de Shipit).

Entrega hallazgos con evidencia. Espera mi decisión.
```

Criterio de aceptación: sabemos, con evidencia de API o respuesta escrita de Shipit, cómo crear un envío en modalidad `dropoff` y otro en `pickup`, y qué ve el vendedor en cada caso.

**Manual (Vero, 2 minutos):** panel de Shipit → Configuración → Direcciones → dejar "TusLibros" (100321) como origen predeterminado.

### FASE 1 — cola, worker y etiqueta

**PROMPT 1.1 — diseño del modelo y del worker**

```
Lee docs/prompts/shipit-automatico-v2.md completo, secciones
"Arquitectura" y "Modelo de datos". No implementes nada en este prompt.

1. Revisa supabase/migrations/ y dime si algo de lo propuesto ya existe
   con otro nombre (tablas de envío, enums, columnas en orders).
2. Escribe la migración propuesta (shipments, shipit_events, columnas en
   users) como texto para revisión, con el enum de estados y los UNIQUE.
   Incluye RLS: shipments legible por seller_id y buyer del bundle;
   escritura solo service_role.
3. Diseña app/api/cron/shipments/route.ts: cómo toma filas con
   FOR UPDATE SKIP LOCKED desde Supabase (RPC en SQL, no desde JS),
   cómo avanza estados, cómo registra en shipit_events, cómo respeta
   SHIPIT_MODE y shipit_auto_enabled. Pseudocódigo por estado.
4. Diseña createShipitShipment() en lib/shipit.ts contra
   POST https://api.shipit.cl/v/shipments (Accept:
   application/vnd.shipit.v4). Documenta que courier.payable = pago
   contra entrega, siempre false.
5. Resuelve el problema abierto: GET /v/shipments/reference/{ref}
   devolvió {} en la prueba del 06-09. Prueba con las credenciales del
   repo GET /v/shipments/{id} usando el id de un envío existente y dime
   cuál de los dos usaremos para recuperar tracking y pack_pdf.
6. Etiqueta: descarga de pack_pdf en el servidor, bucket privado
   'labels', path shipments/{id}.pdf, URL firmada 7 días. Dime si
   pack_pdf requiere autenticación (pruébalo).

Entrega diseño + migración como texto. Espera mi aprobación.
```

**PROMPT 1.2 — implementación (solo después de "aprobado, implementa")**

```
Aprobado el diseño del prompt 1.1. Implementa en este orden y detente
después de cada paso para que lo revise:

a) Migración + tipos: aplicar la migración en producción y verificar
   con \d o pg_policies antes de seguir con b).
b) createShipitShipment() y getShipitShipment() en lib/shipit.ts, con
   registro en shipit_events. SHIPIT_MODE=dry-run por defecto en
   .env.local.
c) Webhook: al pasar a paid con courier, INSERT en shipments ON CONFLICT
   DO NOTHING. Quitar la llamada a createShipitOrder() del webhook
   (dejar la función, marcada @deprecated).
d) Cron /api/cron/shipments con la RPC de claim, máquina de estados,
   límite de 5 intentos, gong en needs_origin/stalled/failed.
e) Descarga de etiqueta a Storage y URL firmada; /mis-ventas muestra
   estado y botón "Descargar etiqueta"; /mis-pedidos muestra tracking.
f) Correos: vendedor (etiqueta adjunta + link + ventana de retiro,
   plantilla 5b de docs/MENSAJES-ONBOARDING-VENDEDOR.md) y comprador
   (tracking, plantilla 5c). Se envían desde el worker, una vez, con
   registro en shipit_events kind='email'.
g) Script scripts/shipit-origenes.mjs: lista GET /v/origins, propone
   match con users.default_address, y con --set user_id origin_id
   guarda shipit_origin_id. Vero = 100321.
h) Checkout: si el vendedor no tiene shipit_origin_id, no ofrecer
   courier (solo entrega en persona) con un aviso al vendedor en
   /mis-libros: "Para vender con despacho, escríbele a Vero".
i) Modalidad (D7): selector pickup/dropoff en /perfil del vendedor con
   default por región; en /mis-ventas, cambio por pedido mientras el
   envío esté en label_ready. El correo del vendedor cambia según la
   modalidad (ventana de retiro vs. "imprime la etiqueta y déjalo en la
   sucursal {courier} más cercana"). Depende del resultado del PROMPT 0.3.

Sin tests de concurrencia no se cierra el paso d): dos ejecuciones
simultáneas del cron sobre la misma fila deben producir UN solo envío.
```

Criterio de aceptación de FASE 1: con `SHIPIT_MODE=dry-run`, las 6 órdenes reales pagadas con courier de la semana del 01–06 de septiembre producen 6 filas en `shipments` y 6 eventos `dry-run` con el body exacto que se enviaría. Con `sandbox`, una venta de prueba de Vero y otra de Libro de Ocasión llegan a `label_ready` con PDF en Storage y correos enviados a buzones de prueba. Con `live` y `shipit_auto_enabled` solo para Vero, una venta real llega a `pickup_scheduled` sin intervención manual.

### FASE 1b — recuperar lo atrapado

```
Reescribe el script de recuperación del plan del 05-09 (PROMPT 2 de
claude/PLAN_POSTVENTA_2026_09_05.md) sobre la tabla shipments:
órdenes pagadas con courier sin tracking → insertar en shipments en
estado pending. --dry-run por defecto muestra la tabla con order, vendedor,
comuna, courier, cotización cobrada y costo estimado. Con --execute
inserta; el worker hace el resto. Antes de --execute dime el costo total
comprometido.
```

### FASE 2 — estados de tránsito

Webhook de Shipit (`/v/webhooks/package`): configuración, firma, endpoint `app/api/webhooks/shipit`, transición a `in_transit` / `delivered` / `failed`, correo al comprador en `delivered`, y cierre del ciclo de comisión (liberación) cuando aplique. Se diseña después de dos semanas de FASE 1 en producción.

---

## ¿Hay alternativa a Shipit?

Evaluación al 07-09-2026, sin cambiar de proveedor en esta etapa:

| Opción | Modelo | Drop-off en sucursal | Retiro a domicilio | Contrato / mínimos | Veredicto para tuslibros hoy |
|---|---|---|---|---|---|
| **Shipit** (actual) | Agregador, comisión por envío | Sí fuera de la RM (etiqueta Shipit en sucursal del courier); en RM por confirmar vía API (PROMPT 0.3) | Sí, Héroe solo RM | Sin contrato ni mínimos | Mantener. Integración ya hecha al 70%; el problema es de flujo, no de proveedor |
| **Envíame** | Agregador, comisión por envío | Sí, explícito ("entrega en sucursal" como modalidad) | Sí | Sin contrato ni mínimos | Plan B real si Shipit no expone drop-off en RM por API. Misma categoría, migración de `lib/shipit.ts` acotada |
| **Chilexpress directo** (developers.wschilexpress.com) | Cuenta corporativa, tarifa negociada | Sí, 1.300+ sucursales | Sí | Contrato; tarifas buenas desde ~50 envíos/mes | Fase posterior, cuando el volumen mensual lo justifique. Hoy tuslibros hace ~6 envíos/semana |
| **Starken / Blue directo** | Igual que Chilexpress | Sí / limitado a Santiago | Sí | Contrato | Igual que arriba |

Conclusión: con el volumen actual, cambiar de agregador no resuelve nada que no resuelva antes la arquitectura de esta guía. La única razón para mirar Envíame es si Shipit no permite crear un envío sin retiro en la RM; se sabrá con el PROMPT 0.3.

## Preguntas abiertas que la FASE 1 debe cerrar

- ¿Shipit agenda el retiro el mismo día si el envío se crea antes de cierta hora? Registrar `last_pickup.schedule` de los primeros 10 envíos reales en `shipit_events` y anotar el patrón aquí.
- ¿`pack_pdf` requiere sesión? (prompt 1.1, punto 6).
- ¿`GET /v/shipments/reference` o `GET /v/shipments/{id}`? (prompt 1.1, punto 5).

## Referencias

- https://developers.shipit.cl/reference/crear-un-envío.md — `reference` ≤ 15 chars, única por día de operación; `sandbox` boolean; `origin.origin_id` requiere multiorigen; la respuesta de creación trae `tracking_number` y `pack_pdf` en `null` al inicio.
- https://developers.shipit.cl/reference/configuración-webhook.md
- Soporte Shipit: WhatsApp +56 9 3230 2514 (L–V 9:00–18:00), soporte@shipit.cl
