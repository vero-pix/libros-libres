-- Ofertas de precio (23-09-2026). Idea de Carlos (cimlibros).
--
-- El vendedor marca "Se aceptan ofertas" en un libro; el comprador ofrece un
-- precio menor; el vendedor acepta o rechaza y el comprador recibe el aviso.
-- Si se acepta, el comprador paga el precio acordado dentro del sitio:
-- /api/orders lo lee de acá, nunca del cliente.
--
-- La oferta se anuncia como mensaje en /mensajes (messages.offer_id), así el
-- vendedor la ve con el badge y el correo que ya existen.

alter table public.listings
  add column if not exists acepta_ofertas boolean not null default false;

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.users (id) on delete cascade,
  seller_id uuid not null references public.users (id) on delete cascade,
  -- Mismo piso que listings.price (20260725_precio_minimo_listings.sql).
  amount integer not null check (amount >= 1000),
  -- Precio publicado al momento de ofertar: si el vendedor lo cambia después,
  -- la tarjeta sigue mostrando contra qué se ofertó.
  listing_price integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'expired', 'used')),
  conversation_id uuid references public.conversations (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  -- pending: caduca a los 3 días sin respuesta. accepted: 48 h para pagar.
  expires_at timestamptz not null default (now() + interval '3 days')
);

comment on table public.offers is
  'Ofertas de precio de un comprador por un libro. Escribe solo /api/offers (service role). /api/orders usa amount si hay una accepted vigente para (listing, comprador).';

create index if not exists offers_seller_idx on public.offers (seller_id, status);
create index if not exists offers_buyer_listing_idx on public.offers (buyer_id, listing_id, status);

-- Una sola oferta pendiente por comprador y libro.
create unique index if not exists offers_una_pendiente
  on public.offers (listing_id, buyer_id) where status = 'pending';

alter table public.offers enable row level security;

-- Comprador y vendedor leen las suyas. Sin policies de escritura a propósito:
-- amount y status solo los cambia el servidor.
drop policy if exists "Comprador o vendedor ve la oferta" on public.offers;
create policy "Comprador o vendedor ve la oferta" on public.offers for select
  using ((select auth.uid()) in (buyer_id, seller_id));

-- El mensaje de la conversación que anuncia la oferta.
alter table public.messages
  add column if not exists offer_id uuid references public.offers (id) on delete set null;

-- La order recuerda de qué oferta salió su precio.
alter table public.orders
  add column if not exists offer_id uuid references public.offers (id) on delete set null;
