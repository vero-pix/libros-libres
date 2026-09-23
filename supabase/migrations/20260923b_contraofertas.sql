-- Contraofertas (23-09-2026). Sigue a 20260923_ofertas.sql.
--
-- Una contraoferta es una fila nueva de `offers` encadenada a la anterior
-- (`parent_id`), que queda en estado 'countered'. `made_by` dice quién la hizo:
-- responde siempre la otra parte. `ronda` cuenta las contraofertas de la cadena
-- para cortar el ida y vuelta (tope en lib/offers.ts).
--
-- buyer_id y seller_id no cambian en la cadena, así que /api/orders sigue
-- encontrando el precio acordado igual: una 'accepted' vigente del comprador.

alter table public.offers
  add column if not exists made_by text not null default 'buyer'
    check (made_by in ('buyer', 'seller')),
  add column if not exists parent_id uuid references public.offers (id) on delete set null,
  add column if not exists ronda integer not null default 0;

alter table public.offers drop constraint if exists offers_status_check;
alter table public.offers add constraint offers_status_check
  check (status in ('pending', 'accepted', 'rejected', 'expired', 'used', 'countered'));
