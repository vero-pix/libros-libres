-- Envíos automáticos con Shipit — fase 1 (docs/prompts/shipit-automatico-v2.md,
-- PROMPT 1.1 aprobado el 07-09-2026; diseño en docs/shipit/PROMPT_1.1_diseno_2026-09-07.md).
--
-- Cola (`shipments`) + auditoría (`shipit_events`) + columnas del vendedor en
-- `users`. Las columnas de envío de `orders` se mantienen como espejo de
-- lectura para /mis-ventas y /mis-pedidos; la verdad vive en `shipments`.
--
-- Decisiones de Vero sobre el diseño:
--   · is_admin() se queda con EXECUTE para anon: un anónimo recibe 0 filas,
--     no un error. (No se toca acá.)
--   · buyer_id desnormalizado en shipments para que la RLS no haga subselect.
--   · El cron corre cada 5 minutos (vercel.json, paso d del PROMPT 1.2).
--   · Couriers de sucursal: chilexpress, starken y bluexpress (id 8 en
--     GET /v/couriers, nombre exacto "bluexpress").

begin;

-- 1. Vendedor ------------------------------------------------------------------
alter table public.users
  add column if not exists shipit_origin_id      integer,
  add column if not exists shipit_auto_enabled   boolean not null default false,
  add column if not exists shipit_dispatch_mode  text    not null default 'dropoff'
    constraint users_shipit_dispatch_mode_check check (shipit_dispatch_mode in ('dropoff', 'pickup'));

comment on column public.users.shipit_origin_id is
  'Id del origen en Shipit (GET /v/origins). Sin esto el checkout no ofrece courier (D1/D6).';
comment on column public.users.shipit_auto_enabled is
  'Apertura por vendedor de la creación automática en modo live (D4). Vero → Libro de Ocasión → resto.';
comment on column public.users.shipit_dispatch_mode is
  'Preferencia del vendedor (D7 revisada). Fase 1: solo cambia el texto del correo y muestra el botón de retiro.';

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
                        constraint shipments_dispatch_mode_check check (dispatch_mode in ('dropoff', 'pickup')),
  pickup_requested_at timestamptz,                -- botón "Pedir retiro a domicilio" (gong a Vero)
  shipit_id           bigint unique,              -- id en Shipit (POST /v/shipments)
  reference           text not null unique        -- 'TL-' || 12 chars del bundle_id (≤ 15, tope de Shipit)
                        constraint shipments_reference_len_check check (char_length(reference) <= 15),
  courier             text,                       -- chilexpress | starken | bluexpress
  tracking_number     text,
  label_path          text,                       -- Storage: labels/shipments/{id}.pdf
  pickup_date         date,                       -- fase 1.5
  pickup_window       text,                       -- fase 1.5, ej. '14:00 - 17:00'
  quoted_cost         numeric(10,2),              -- lo que cotizó el checkout (shipping_cost + subsidio)
  real_cost           numeric(10,2),              -- shipping_price / total_price de Shipit
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
create index shipments_order_head_idx on public.shipments (order_head_id);

create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute procedure public.set_updated_at();

comment on table public.shipments is
  'Cola de envíos Shipit. Una fila por bundle pagado con courier. La escribe solo el service role (webhook MP + cron).';

-- 4. Auditoría --------------------------------------------------------------------
create table public.shipit_events (
  id            bigint generated always as identity primary key,
  shipment_id   uuid not null references public.shipments(id) on delete cascade,
  kind          text not null
                  constraint shipit_events_kind_check check (kind in
                    ('create', 'get', 'delete', 'label', 'email', 'gong', 'webhook', 'dry-run', 'transition', 'error')),
  mode          text not null
                  constraint shipit_events_mode_check check (mode in ('dry-run', 'live')),
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

-- 6. Claim atómico para el worker -------------------------------------------------------
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

-- 7. Transición condicional --------------------------------------------------------------
-- Avanza SOLO si la fila sigue en el estado esperado. Devuelve true si cambió.
-- Tercera capa de idempotencia: antes de cada llamada externa se intenta la
-- transición; si otro proceso ya la hizo, este no llama a Shipit.
create or replace function public.transition_shipment(
  p_id    uuid,
  p_from  public.shipment_status,
  p_to    public.shipment_status,
  p_patch jsonb default '{}'::jsonb
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

-- 8. Storage: bucket privado de etiquetas -------------------------------------------------
-- Sin policies en storage.objects para 'labels': solo service role lee y escribe.
-- El vendedor recibe una URL firmada (7 días) generada en el servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('labels', 'labels', false, 2097152, array['application/pdf'])
on conflict (id) do nothing;

commit;
