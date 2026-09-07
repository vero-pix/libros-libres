# PROMPT 1.1 — Diseño del modelo y del worker de Shipit (07-09-2026)

Solo diseño. Nada implementado, nada aplicado. Espera aprobación de Vero.

## 1. Lo que ya existe (y lo que no)

Revisado `supabase/migrations/` y la BD viva:

| Propuesto en la guía | ¿Existe? | Dónde |
|---|---|---|
| tabla `shipments` | **No** | — |
| tabla `shipit_events` | **No** | — |
| enum de estados de envío | **No** | Solo `order_status` (`pending, paid, shipped, delivered, cancelled`), `shipping_speed` (`standard, express`) y `delivery_method` (`in_person, pickup_point, courier`). Ninguno sirve como máquina de estados del envío. |
| columnas de envío en `orders` | **Sí, parcial** | `20260410_shipping_fields.sql`: `shipping_status text` (valores reales hoy: `created`, `draft`, NULL), `shipping_label_url`, `shipping_updated_at`, `shipit_order_id bigint`. Más `tracking_code`, `courier`, `shipping_cost`, `shipping_subsidy` (`20260825`). Se **mantienen** como espejo de lectura: `/mis-ventas` y `/mis-pedidos` las leen hoy y el worker las seguirá escribiendo. |
| `users.shipit_*` | **No** | Ninguna columna `shipit_` en `users`. |
| RPC con `FOR UPDATE SKIP LOCKED` | **No** | Funciones propias: `is_admin`, `set_updated_at`, `listings_within_radius`, `handle_new_user`, `generate_username_from_name`. |
| bucket privado de etiquetas | **No** | Buckets: `covers` y `ig-content`, los dos públicos. |
| cron | Hay 7 en `vercel.json` (todos diarios) con el patrón `authorization: Bearer CRON_SECRET`. | `app/api/cron/*` |

Conclusión: no hay nada que renombrar ni reutilizar salvo las columnas espejo de `orders`. `shipit_order_id` hoy guarda ids del endpoint viejo `orders.shipit.cl/v/orders` (por ejemplo 11052296, que `GET /v/shipments/{id}` no encuentra). El worker escribirá ahí el id del endpoint nuevo; son espacios de ids distintos, pero ninguna consulta cruza los dos.

## 2. Migración propuesta (texto para revisión)

Archivo: `supabase/migrations/20260908_shipments.sql`. Aplicar en el SQL Editor y verificar con `pg_policies` antes de escribir código (regla del paso a) del PROMPT 1.2).

```sql
-- Envíos automáticos con Shipit (docs/prompts/shipit-automatico-v2.md, fase 1).
-- Cola + auditoría. Las columnas de envío de `orders` se mantienen como espejo
-- de lectura para /mis-ventas y /mis-pedidos; la verdad vive en `shipments`.

begin;

-- 1. Vendedor ------------------------------------------------------------------
alter table public.users
  add column if not exists shipit_origin_id      integer,
  add column if not exists shipit_auto_enabled   boolean not null default false,
  add column if not exists shipit_dispatch_mode  text    not null default 'dropoff'
    check (shipit_dispatch_mode in ('dropoff', 'pickup'));

comment on column public.users.shipit_origin_id is
  'Id del origen en Shipit (GET /v/origins). Sin esto el checkout no ofrece courier (D1/D6).';
comment on column public.users.shipit_auto_enabled is
  'Apertura por vendedor de la creación automática en modo live (D4). Vero → Libro de Ocasión → resto.';
comment on column public.users.shipit_dispatch_mode is
  'Preferencia del vendedor (D7 revisada). Fase 1: solo cambia el texto del correo y el botón de retiro.';

-- 2. Estados del envío ------------------------------------------------------------
create type public.shipment_status as enum (
  'pending',          -- pagado, en cola
  'created',          -- POST /v/shipments respondió con id
  'label_ready',      -- pack_pdf descargado a Storage
  'notified',         -- correos a vendedor y comprador enviados
  'pickup_scheduled', -- fase 1.5: last_pickup con fecha
  'in_transit',       -- fase 2 (webhook Shipit)
  'delivered',        -- fase 2
  'needs_origin',     -- vendedor sin shipit_origin_id (no debería pasar por D1)
  'stalled',          -- > 24 h sin avanzar
  'failed',           -- attempts >= 5
  'canceled'          -- DELETE /v/shipments/{id} o cancelación manual
);

-- 3. Cola --------------------------------------------------------------------------
create table public.shipments (
  id                  uuid primary key default gen_random_uuid(),
  bundle_id           uuid not null unique,
  order_head_id       uuid not null references public.orders(id) on delete restrict,
  seller_id           uuid not null references public.users(id)  on delete restrict,
  buyer_id            uuid not null references public.users(id)  on delete restrict,
  status              public.shipment_status not null default 'pending',
  dispatch_mode       text not null default 'dropoff'
                        check (dispatch_mode in ('dropoff', 'pickup')),
  pickup_requested_at timestamptz,                -- botón "Pedir retiro a domicilio"
  shipit_id           bigint unique,              -- id en Shipit (POST /v/shipments)
  reference           text not null unique,       -- 'TL-' || 12 chars del bundle_id (≤ 15)
  courier             text,                       -- chilexpress | starken | bluexpress
  tracking_number     text,
  label_path          text,                       -- Storage: labels/shipments/{id}.pdf
  pickup_date         date,                       -- fase 1.5
  pickup_window       text,                       -- fase 1.5, ej. '14:00 - 17:00'
  quoted_cost         numeric(10,2),              -- lo que cotizó el checkout (orders.shipping_cost + subsidio)
  real_cost           numeric(10,2),              -- shipping_price/total_price de Shipit
  attempts            integer not null default 0,
  last_error          text,
  locked_until        timestamptz,                -- claim del worker; nunca más de 5 min
  next_attempt_at     timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index shipments_status_next_idx on public.shipments (status, next_attempt_at)
  where status in ('pending', 'created', 'label_ready', 'notified');
create index shipments_seller_idx on public.shipments (seller_id, created_at desc);
create index shipments_buyer_idx  on public.shipments (buyer_id, created_at desc);

create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute procedure public.set_updated_at();

comment on table public.shipments is
  'Cola de envíos Shipit. Una fila por bundle pagado con courier. La escribe solo el service role (webhook MP + cron).';

-- 4. Auditoría --------------------------------------------------------------------
create table public.shipit_events (
  id            bigint generated always as identity primary key,
  shipment_id   uuid not null references public.shipments(id) on delete cascade,
  kind          text not null check (kind in ('create', 'get', 'delete', 'label', 'email', 'gong', 'webhook', 'dry-run', 'transition', 'error')),
  mode          text not null check (mode in ('dry-run', 'live')),
  request       jsonb,
  response      jsonb,
  http_status   integer,
  cost          numeric(10,2),
  note          text,
  created_at    timestamptz not null default now()
);

create index shipit_events_shipment_idx on public.shipit_events (shipment_id, created_at desc);

comment on table public.shipit_events is
  'Todo lo que el worker hizo o habría hecho (dry-run), con el body exacto. Conciliación contra la factura de Shipit.';

-- 5. RLS -----------------------------------------------------------------------------
alter table public.shipments     enable row level security;
alter table public.shipit_events enable row level security;

-- Lectura: el vendedor del envío y el comprador del bundle. Nada más.
-- Sin policies de INSERT/UPDATE/DELETE: solo el service role escribe.
create policy "Vendedor o comprador ve su envío" on public.shipments
  for select using ((select auth.uid()) in (seller_id, buyer_id));

-- shipit_events no se lee desde el cliente. Sin policies = solo service role.
-- (Cuando el admin quiera verlos, será desde una ruta con service role.)

-- 6. is_admin(): solo authenticated ---------------------------------------------------
-- Hoy anon también puede ejecutarla (grant del 07-09 en 20260907_rls_perf.sql).
-- Revocarla devuelve el comportamiento anterior: un anon que consulte orders,
-- commissions, rentals, survey_responses, page_views, contact_messages,
-- newsletter_subscribers o search_queries recibe "permission denied for
-- function is_admin" en vez de 0 filas. Ningún cliente del sitio hace esas
-- consultas con la anon key (se verificó el 07-09), y para anon el resultado
-- útil es el mismo: no ve nada.
revoke execute on function public.is_admin() from anon;
grant  execute on function public.is_admin() to authenticated;

-- 7. Claim atómico para el worker -------------------------------------------------------
-- Toma hasta `max_rows` envíos listos para avanzar, los bloquea 5 minutos y los
-- devuelve. FOR UPDATE SKIP LOCKED: dos ejecuciones simultáneas del cron nunca
-- toman la misma fila. SECURITY DEFINER + REVOKE: solo service role la llama.
create or replace function public.claim_shipments(max_rows integer default 10)
returns setof public.shipments
language sql
security definer
set search_path = public
as $$
  with candidatos as (
    select id
    from public.shipments
    where status in ('pending', 'created', 'label_ready', 'notified')
      and next_attempt_at <= now()
      and (locked_until is null or locked_until < now())
      and attempts < 5
    order by next_attempt_at
    limit max_rows
    for update skip locked
  )
  update public.shipments s
     set locked_until = now() + interval '5 minutes'
    from candidatos c
   where s.id = c.id
  returning s.*;
$$;

revoke all on function public.claim_shipments(integer) from public, anon, authenticated;
grant execute on function public.claim_shipments(integer) to service_role;

-- 8. Transición condicional --------------------------------------------------------------
-- Avanza SOLO si la fila sigue en el estado esperado. Devuelve true si cambió.
-- Es la tercera capa de idempotencia: antes de cada llamada externa se intenta
-- la transición; si otro proceso ya la hizo, este no llama a Shipit.
create or replace function public.transition_shipment(
  p_id       uuid,
  p_from     public.shipment_status,
  p_to       public.shipment_status,
  p_patch    jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.shipments
     set status          = p_to,
         shipit_id       = coalesce((p_patch->>'shipit_id')::bigint, shipit_id),
         courier         = coalesce(p_patch->>'courier', courier),
         tracking_number = coalesce(p_patch->>'tracking_number', tracking_number),
         label_path      = coalesce(p_patch->>'label_path', label_path),
         real_cost       = coalesce((p_patch->>'real_cost')::numeric, real_cost),
         pickup_date     = coalesce((p_patch->>'pickup_date')::date, pickup_date),
         pickup_window   = coalesce(p_patch->>'pickup_window', pickup_window),
         last_error      = null,
         attempts        = 0,
         locked_until    = null,
         next_attempt_at = now()
   where id = p_id and status = p_from;
  get diagnostics n = row_count;
  return n = 1;
end $$;

revoke all on function public.transition_shipment(uuid, public.shipment_status, public.shipment_status, jsonb) from public, anon, authenticated;
grant execute on function public.transition_shipment(uuid, public.shipment_status, public.shipment_status, jsonb) to service_role;

-- 9. Storage: bucket privado de etiquetas -------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('labels', 'labels', false, 2097152, array['application/pdf'])
on conflict (id) do nothing;
-- Sin policies en storage.objects para 'labels': solo service role lee y escribe.
-- El vendedor recibe una URL firmada (7 días) generada en el servidor.

commit;
```

Notas sobre decisiones del SQL:

- **`buyer_id` en `shipments`**: la guía no lo tenía. Sin él, la policy "buyer del bundle" obligaría a un subselect a `orders` por fila. Se copia del `order_head_id` al insertar.
- **`reference`**: `'TL-' || left(replace(bundle_id::text,'-',''), 12)` = 15 caracteres, el máximo de Shipit. Se calcula en el INSERT del webhook, no con default, para que quede explícito.
- **`locked_until` + `next_attempt_at`** en vez de un `claimed_at`: permite backoff (1, 5, 15, 60, 240 min) y que un lock viejo expire solo si el worker murió a mitad.
- **`canceled`** no estaba en la guía; hace falta porque `DELETE /v/shipments/{id}` existe y funciona.
- **`dispatch_mode` en `shipments`** copia el de `users` al crear: la preferencia del vendedor puede cambiar después sin tocar envíos ya creados.
- **`shipit_events.mode`** distingue dry-run de live en la misma tabla. El criterio de aceptación de fase 1 cuenta eventos `kind='dry-run'`.

## 3. Worker: `app/api/cron/shipments/route.ts`

Cron en `vercel.json`: `{ "path": "/api/cron/shipments", "schedule": "*/3 * * * *" }`. Ojo: Vercel Pro permite crons por minuto; hoy los 7 son diarios. Protección: `authorization: Bearer ${CRON_SECRET}` como en `mp-nudge`. Acepta `?dry=1` para forzar dry-run aunque `SHIPIT_MODE=live`. `maxDuration = 60`.

```
GET /api/cron/shipments
  autenticar CRON_SECRET → 401
  modo = query.dry ? 'dry-run' : (SHIPIT_MODE ?? 'dry-run')        // nunca live por omisión
  filas = rpc('claim_shipments', { max_rows: 10 })                   // service role
  para cada fila (secuencial; 10 × ~2 s cabe en 60 s):
    try:
      switch fila.status:
        'pending'     → pasoCrear(fila)
        'created'     → pasoEtiqueta(fila)
        'label_ready' → pasoNotificar(fila)
        'notified'    → pasoRetiro(fila)          // fase 1: solo detecta pickup_requested_at
    catch e:
      registrar(fila, 'error', { note: e.message })
      update shipments set attempts = attempts + 1, last_error = e.message,
             locked_until = null, next_attempt_at = now() + backoff(attempts)
      si attempts + 1 >= 5 → status = 'failed', gong("🔴 envío {reference} falló 5 veces: {e}")
  barrido de atascados (una vez por corrida):
    update shipments set status = 'stalled'
      where status in ('pending','created','label_ready','notified')
        and updated_at < now() - interval '24 hours' and status <> 'stalled'
      returning id → gong por cada uno
  responder { modo, procesados, por_estado, stalled }
```

Por estado:

```
pasoCrear(fila):                                   // pending → created
  vendedor = users(shipit_origin_id, shipit_auto_enabled, shipit_dispatch_mode, full_name, email, phone)
  si !vendedor.shipit_origin_id:
      transition(fila.id, 'pending', 'needs_origin'); gong("🟠 {vendedor} vendió con courier y no tiene origen Shipit"); return
  body = armarBodyShipit(fila, vendedor, headOrder, bundleOrders)   // ver §4
  si modo == 'dry-run' o !vendedor.shipit_auto_enabled:
      registrar(fila, 'dry-run', { request: body, note: modo=='dry-run' ? 'SHIPIT_MODE' : 'shipit_auto_enabled=false' })
      // NO se avanza de estado: la fila queda en pending, next_attempt_at = now()+1h para no
      // repetir el evento cada 3 minutos. Cuando se active live, se crea de verdad.
      update shipments set next_attempt_at = now() + interval '1 hour', locked_until = null
      return
  // live: transición ANTES de llamar, con el body ya armado
  ok = transition(fila.id, 'pending', 'created')      // si false, otro proceso ya lo hizo → return
  si !ok: return
  res = createShipitShipment(body)                    // POST /v/shipments
  registrar(fila, 'create', { request: body, response: res.raw, http_status: res.status })
  si res.error:
      // volver atrás: la transición fue optimista
      update shipments set status='pending', attempts=attempts+1, last_error=res.error,
             next_attempt_at = now()+backoff → throw
  update shipments set shipit_id = res.id, courier = res.courier, real_cost = res.total_price
  update orders set shipit_order_id = res.id, shipping_status = 'created', shipping_updated_at = now()
         where bundle_id = fila.bundle_id
```

Consulta previa a un reintento de creación (segunda capa): antes de `POST`, si `fila.attempts > 0`, buscar en `shipit_events` el último `create` con `response.id`; si existe, usar ese id en vez de crear de nuevo. `GET /v/shipments/reference/{ref}` **no sirve** para esto (ver §5), por eso el id se guarda en el evento aunque la transición posterior haya fallado.

```
pasoEtiqueta(fila):                                 // created → label_ready
  s = getShipitShipment(fila.shipit_id)             // GET /v/shipments/{id}
  registrar(fila, 'get', { response: s.raw })
  si !s.pack_pdf o !s.tracking_number:
      // Shipit tarda ~20 s en completar. Reintentar suave, sin contar como fallo.
      update shipments set next_attempt_at = now() + interval '3 minutes', locked_until = null; return
  pdf = fetch(s.pack_pdf) → Buffer                   // público, sin auth (ver §6)
  path = `shipments/${fila.id}.pdf`
  storage.from('labels').upload(path, pdf, { contentType: 'application/pdf', upsert: true })
  registrar(fila, 'label', { note: path, http_status: 200 })
  transition(fila.id, 'created', 'label_ready', { tracking_number, label_path: path, real_cost: s.total_price, courier: s.courier_for_client })
  update orders set tracking_code = s.tracking_number, shipping_label_url = null, shipping_status = 'label_ready'
         where bundle_id = fila.bundle_id
  // shipping_label_url queda null a propósito: la URL de Shipit no se persiste (D3).
  // /mis-ventas pide la URL firmada a /api/shipments/{id}/label.
```

```
pasoNotificar(fila):                                // label_ready → notified
  ok = transition(fila.id, 'label_ready', 'notified')   // primero, para que dos corridas no manden dos correos
  si !ok: return
  url = storage.from('labels').createSignedUrl(fila.label_path, 7*24*3600)
  pdf = storage.from('labels').download(fila.label_path)
  correoVendedor(plantilla 5b, adjunto pdf, link url, texto según fila.dispatch_mode:
      dropoff → "imprime la etiqueta y déjala en la sucursal de {courier} más cercana"
      pickup  → igual + "si prefieres que pasen a buscarlo, pídelo desde Mis Ventas")
  correoComprador(plantilla 5c, tracking + link de seguimiento del courier)
  registrar(fila, 'email', { note: 'vendedor+comprador' })
  gong("📦 etiqueta lista {reference} · {courier} · {vendedor} → {comuna destino}")
  update orders set shipping_status = 'notified' where bundle_id = fila.bundle_id
```

```
pasoRetiro(fila):                                   // notified → (fase 1) se queda; (1.5) pickup_scheduled
  si fila.pickup_requested_at y no hay evento 'gong' con note 'pickup' para esta fila:
      gong("🚚 {vendedor} pide RETIRO A DOMICILIO para {reference} ({direccion origen}). Pedirlo en Shipit antes de las 11:00.")
      registrar(fila, 'gong', { note: 'pickup' })
  // Fase 1.5: s = getShipitShipment(); si s.last_pickup?.schedule?.date →
  //   transition('notified','pickup_scheduled', { pickup_date, pickup_window })
  // Mientras tanto, para no recorrer la fila cada 3 min para siempre:
  update shipments set next_attempt_at = now() + interval '6 hours', locked_until = null
```

El botón "Pedir retiro a domicilio" (`/mis-ventas`, PROMPT 1.2 i) es una ruta `POST /api/shipments/{id}/pickup` con sesión: verifica `seller_id = auth.uid()`, `status in ('label_ready','notified')`, vendedor en RM, y hace `update shipments set pickup_requested_at = now(), next_attempt_at = now()` con service role. Sin llamadas a Shipit.

Registro (`registrar`) es un INSERT en `shipit_events` con `mode` = modo de la corrida. Nunca lanza: un fallo de auditoría no puede frenar un envío (mismo criterio que `logWebhook` del webhook MP).

Backoff: `[1, 5, 15, 60, 240]` minutos según `attempts`.

## 4. `createShipitShipment()` en `lib/shipit.ts`

Contra `POST https://api.shipit.cl/v/shipments`, headers `Accept: application/vnd.shipit.v4` (los mismos `HEADERS` que ya usa `/v/rates`). Reemplaza a `createShipitOrder()` (endpoint viejo `orders.shipit.cl`, `Accept: application/vnd.orders.v1`), que queda marcada `@deprecated` y deja de llamarse desde el webhook en el paso c) del PROMPT 1.2.

```ts
export interface ShipitShipmentInput {
  reference: string;                 // 'TL-…', ≤ 15 chars, único por día
  originId: number;                  // users.shipit_origin_id
  items: number;                     // libros del bundle
  sizes: { length; width; height; weight };   // estimateBookPackageSize(items)
  courier: 'chilexpress' | 'starken' | 'bluexpress';   // el que eligió el comprador
  destiny: { street; number; complement?; commune_id; commune_name; full_name; email?; phone? };
  sellerId?: string;                 // para el log
}

export interface ShipitShipmentResult {
  id: number | null;
  status: string | null;             // 'created' al crear; 'in_preparation' ~20 s después
  courier: string | null;            // courier_for_client
  tracking_number: string | null;
  pack_pdf: string | null;
  total_price: number | null;
  error?: string;
  httpStatus: number;
  raw: unknown;                      // se guarda entero en shipit_events.response
}

export function armarBodyShipit(input): Record<string, unknown> {
  return {
    kind: 0,                         // canal de venta: shipit
    platform: 2,                     // api
    reference: input.reference,
    items: input.items,
    sizes: input.sizes,
    sandbox: false,                  // inerte hasta que Shipit active sandbox por cuenta; se deja explícito
    seller: { id: input.sellerId, name: "tuslibros" },
    destiny: { ...input.destiny, kind: "home_delivery" },
    courier: {
      id: COURIER_IDS[input.courier],      // chilexpress 1, starken 2, bluexpress: buscar en GET /v/couriers al implementar
      client: input.courier,
      selected: true,                      // fuerza el courier que pagó el comprador
      // `payable` = PAGO CONTRA ENTREGA (el destinatario paga el flete al recibir, con recargo).
      // NO es "envío pagado". Siempre false: el comprador ya pagó el flete en el checkout.
      payable: false,
    },
    origin: { origin_id: input.originId }, // requiere multiorigen activo en la cuenta (lo está: 3 orígenes)
  };
}

export async function createShipitShipment(input): Promise<ShipitShipmentResult>
  // fetch POST, timeout 15 s, parsea; si !res.ok → { error: text, httpStatus, raw }
  // No reintenta por su cuenta: el reintento lo decide el worker con el estado.

export async function getShipitShipment(id: number): Promise<ShipitShipmentResult>
  // GET /v/shipments/{id}. Devuelve tracking_number, pack_pdf, status, total_price, last_pickup.

export async function deleteShipitShipment(id: number): Promise<{ ok: boolean; raw: unknown }>
  // DELETE /v/shipments/{id}. No documentado; verificado el 07-09 ("Envío eliminado").
  // Solo lo usa un humano vía script o la ruta admin de cancelación, nunca el worker solo.
```

`armarBodyShipit` es pura (sin I/O) para que el dry-run registre **exactamente** el body que se mandaría y para testearla sin red. El `destiny.commune_id` se resuelve antes con `findCommuneId` (ya existe) y `commune_name` va en mayúsculas como devuelve Shipit.

## 5. ¿`GET /v/shipments/reference/{ref}` o `GET /v/shipments/{id}`?

Probado el 07-09 con las credenciales del repo y el envío de prueba `TEST-0907A` (id 8911837):

| Llamada | Resultado |
|---|---|
| `GET /v/shipments/reference/TEST-0907A` (ruta documentada) | **HTTP 400**, cuerpo sin datos |
| `GET /v/shipments/reference?reference=TEST-0907A` | HTTP 400 |
| `GET /v/shipments?reference=TEST-0907A` | HTTP 200, lista vacía |
| `GET /v/shipments/8911837` | **HTTP 200** con `reference`, `status`, `tracking_number`, `pack_pdf`, `total_price`, `last_pickup` |

**Usamos `GET /v/shipments/{id}`.** El `id` lo devuelve el `POST` de inmediato (en la prueba: `id: 8911837, status: created` al instante; `tracking_number` y `pack_pdf` llegaron ~20 s después). Por eso el worker guarda `shipit_id` en `shipments` **y** el response completo en `shipit_events` antes de cualquier otra cosa: si se pierde el id, no hay forma de recuperar el envío por referencia.

## 6. Etiqueta

- `pack_pdf` es una URL de S3 (`printer-labels.s3.us-west-2.amazonaws.com/CXP/…/pack_{id}__{fecha}__{tracking}.pdf`). Probada el 07-09 **sin ningún header: HTTP 200, 20.444 bytes**. Con los headers de Shipit, igual. **No requiere autenticación**; es un objeto público sin firma ni expiración visible en la URL. Es la razón para no persistirla ni mandarla al vendedor (D3): cualquiera con el link ve nombre, dirección y teléfono del comprador.
- Flujo: el worker la baja con `fetch` en `pasoEtiqueta`, valida `content-type`/tamaño (> 1 KB, empieza con `%PDF`), la sube a `labels/shipments/{shipment.id}.pdf` con `upsert: true`, y guarda solo `label_path`.
- Entrega al vendedor: `GET /api/shipments/{id}/label` con sesión → verifica `seller_id = auth.uid()` → `createSignedUrl(path, 7*24*3600)` → redirect 302. `/mis-ventas` muestra "Descargar etiqueta" apuntando ahí. El correo lleva el PDF **adjunto** más ese link (que dura 7 días; después el botón de `/mis-ventas` genera otro).
- Retención: no se borra en fase 1. El bucket es privado, 20 KB por etiqueta, 15 ventas/mes con courier: irrelevante.

## 7. D7 revisada en el modelo

- `users.shipit_dispatch_mode` (default `dropoff`) es la preferencia; `shipments.dispatch_mode` es la foto al crear el envío.
- `shipments.pickup_requested_at`: lo escribe el botón de `/mis-ventas` (ruta con sesión, service role para el update). El worker, al verlo, manda **un** gong a Vero (idempotente por evento `kind='gong', note='pickup'`) con referencia, id de Shipit, dirección de origen y courier. Vero solicita el retiro en el panel antes de las 11:00. **Cero llamadas a Shipit** para el retiro en fase 1.
- Fase 1.5 (si soporte confirma endpoint): el mismo `pasoRetiro` pasa a llamar a la API y a leer `last_pickup.schedule` para `pickup_scheduled`. El modelo no cambia.

## 8. `SHIPIT_MODE = dry-run | live` y el dry-run

- Sin `sandbox`. Nada de envíos de prueba en vivo hasta que Shipit lo active por cuenta (correo enviado el 07-09 01:00).
- `SHIPIT_MODE` se lee en cada corrida del cron; **ausente = dry-run**. `?dry=1` fuerza dry-run en una corrida.
- En dry-run el worker hace **todo lo que no toca Shipit ni al usuario**: claim, resolución de origen, `armarBodyShipit`, y un `INSERT` en `shipit_events (kind='dry-run', mode='dry-run', request=body)`. No avanza el estado, no llama a la API, no sube etiqueta, no manda correos ni gong. La fila queda en `pending` con `next_attempt_at = now() + 1 h`.
- `live` además exige `users.shipit_auto_enabled = true` para ese vendedor; si no, se registra `dry-run` con `note = 'shipit_auto_enabled=false'`. Así la apertura por vendedor (D4) y el modo global son dos llaves independientes.
- Criterio de aceptación de fase 1 con dry-run: las 6 órdenes pagadas con courier del 01–06 de septiembre, insertadas en `shipments` por el script de la fase 1b, producen 6 eventos `dry-run` cuyo `request` se puede comparar a mano contra el body que hoy manda `createShipitOrder`.

## Preguntas para Vero antes del PROMPT 1.2

1. **`is_admin()` sin anon**: confirmo que aceptas que anon vuelva a recibir error (no 0 filas) en las tablas de solo-admin. Es el estado que había antes del 07-09.
2. **`buyer_id` en `shipments`**: lo agregué para que la RLS no haga subselect. ¿De acuerdo?
3. **Cron cada 3 minutos** = 480 invocaciones diarias de una función que casi siempre no hace nada. Alternativa: cada 5 minutos (288). El envío tardaría hasta 15 minutos en llegar a `notified` en vez de 9. ¿Cuál?
4. Los ids de courier para `courier.id`: Chilexpress 1 y Starken 2 están verificados; Bluexpress hay que buscarlo en `GET /v/couriers` al implementar (no salió en los 20 primeros de la lista).
