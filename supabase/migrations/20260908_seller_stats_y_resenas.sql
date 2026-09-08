-- Librerías de confianza + reseñas — PROMPT 3, paso a).
-- Diseño: docs/prompts/librerias-confianza-resenas.md, sección "DISEÑO (PROMPT 2)".
--
-- Tres cosas:
--   1. seller_stats: agregados por vendedor, tabla escrita por cron (no vista
--      materializada: REFRESH bloquea lecturas salvo CONCURRENTLY, y el top de
--      portadas necesita filtrar bots de page_views).
--   2. reviews: se EXTIENDE la tabla que existe desde 20260407_reviews.sql.
--      No se crea otra. Se conserva listing_id/reviewer_id.
--   3. featured_seller_blocked en users y site_config para los dos slots de C4.

-- ─────────────────────────── 1. seller_stats ───────────────────────────

create table if not exists public.seller_stats (
  seller_id            uuid primary key references public.users(id) on delete cascade,
  paid_90d             int          not null default 0,
  -- Calculada desde ya, pero NO filtra todavía (C1): hoy solo 3 órdenes en la
  -- historia llegaron a 'delivered'. Se pasa a filtrar cuando la fase 2 de
  -- Shipit puebla el estado.
  delivered_90d        int          not null default 0,
  paid_total           int          not null default 0,
  active_listings      int          not null default 0,
  mp_connected         boolean      not null default false,
  shipit_auto_enabled  boolean      not null default false,
  reviews_count        int          not null default 0,
  reviews_avg          numeric(3,2),
  last_sale_at         timestamptz,
  -- Los 3 libros activos más vistos, ya resueltos por el cron.
  top_listing_ids      uuid[]       not null default '{}',
  trust_score          numeric(8,2) not null default 0,
  is_trusted           boolean      not null default false,
  updated_at           timestamptz  not null default now()
);

comment on table public.seller_stats is
  'Agregados por vendedor para "Librerías de confianza". Refrescada por /api/cron/seller-stats cada hora. Solo service_role escribe.';
comment on column public.seller_stats.delivered_90d is
  'Calculada pero sin uso en el filtro hasta la fase 2 de Shipit (decisión C1, 07-09-2026).';
comment on column public.seller_stats.trust_score is
  'paid_90d*3 + least(active_listings,250)/50 + coalesce(reviews_avg,0)*reviews_count. El catálogo va topado para que no domine el orden.';

create index if not exists seller_stats_trusted_idx
  on public.seller_stats (is_trusted, trust_score desc) where is_trusted;

alter table public.seller_stats enable row level security;

drop policy if exists "seller_stats visible para todos" on public.seller_stats;
create policy "seller_stats visible para todos"
  on public.seller_stats for select using (true);
-- Sin policy de INSERT/UPDATE/DELETE: solo service_role escribe.

-- ─────────────────────────── 2. reviews (ALTER) ───────────────────────────

alter table public.reviews
  add column if not exists order_id      uuid references public.orders(id) on delete set null,
  add column if not exists seller_id     uuid references public.users(id) on delete cascade,
  add column if not exists hidden_at     timestamptz,
  add column if not exists hidden_reason text;

comment on column public.reviews.order_id is
  'Una reseña por LÍNEA de compra. Un bundle tiene una fila de orders por libro (hay bundles de 3), así que la unicidad no puede ir por bundle: quien compra 3 libros deja 3 reseñas.';
comment on column public.reviews.hidden_at is
  'Ocultamiento a mano por Vero (C5). Nunca se borra la fila: se oculta con motivo.';

-- Parcial: las filas viejas sin order_id (hoy no hay ninguna) no chocarían.
create unique index if not exists reviews_order_id_key
  on public.reviews (order_id) where order_id is not null;

create index if not exists reviews_seller_idx
  on public.reviews (seller_id) where hidden_at is null;

-- RLS nueva. Los nombres son los que existen hoy: la migración 20260907_rls_perf
-- renombró "Reviews visibles para todos" a "Reviews visibles".
drop policy if exists "Reviews visibles"           on public.reviews;
drop policy if exists "Reviews visibles para todos" on public.reviews;
drop policy if exists "Usuario crea review"        on public.reviews;

create policy "Reseñas visibles si no están ocultas"
  on public.reviews for select
  using (hidden_at is null);

-- El comprador solo puede reseñar una orden suya, entregada, y el seller_id
-- que declara tiene que ser el de esa orden: no se puede falsear.
create policy "Comprador reseña su orden entregada"
  on public.reviews for insert
  with check (
    (select auth.uid()) = reviewer_id
    and exists (
      select 1 from public.orders o
      where o.id         = reviews.order_id
        and o.buyer_id   = (select auth.uid())
        and o.listing_id = reviews.listing_id
        and o.seller_id  = reviews.seller_id
        and o.status     = 'delivered'
    )
  );
-- Sin UPDATE ni DELETE: ocultar es potestad del service_role.

-- ─────────────────── 3. Bloqueo manual y configuración ───────────────────

alter table public.users
  add column if not exists featured_seller_blocked boolean not null default false;

comment on column public.users.featured_seller_blocked is
  'Saca a un vendedor de "Librerías de confianza" a mano, sin tocar el criterio automático (C1).';

create table if not exists public.site_config (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

comment on table public.site_config is
  'Configuración editable sin deploy. site_stats no sirve para esto: su columna value es bigint y acá se guardan UUID y frases.';

alter table public.site_config enable row level security;

drop policy if exists "site_config visible para todos" on public.site_config;
create policy "site_config visible para todos"
  on public.site_config for select using (true);

-- Semillas de los dos slots de C4. El slot de la casa es fijo (Vero); el de la
-- semana arranca vacío y cae al mejor trust_score hasta que Vero lo fije.
insert into public.site_config (key, value) values
  ('casa_slot', jsonb_build_object(
     'seller_id', '2201d163-4423-4971-91f0-f6cebd00d1bd',
     'frase', '',
     'activo', true)),
  ('tienda_semana', jsonb_build_object(
     'seller_id', null,
     'until', null,
     'frase', '',
     'anterior', null))
on conflict (key) do nothing;
