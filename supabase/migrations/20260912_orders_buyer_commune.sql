-- La comuna del comprador, como dato propio.
--
-- Hasta ahora la única pista de dónde estaba el comprador era `buyer_address`,
-- un string libre. Y cuando elegía retiro en persona ni siquiera eso: el
-- checkout guardaba ahí el literal "in_person" (CheckoutForm.tsx:317), así que
-- el sistema no sabía nada de él. Eso dejó dos agujeros:
--
--   1. No se puede avisar que el retiro es inviable (alguien en Ñuñoa compró
--      un libro que estaba en Concepción creyendo que lo iba a buscar).
--   2. La cotización de courier adivina la comuna parseando el string, y
--      cuando falla cae al fallback de $2.900, que casi siempre queda bajo el
--      costo real.
--
-- Se llena siempre, en persona o por courier. Nullable porque las órdenes
-- viejas no la tienen y porque el invitado puede no elegirla.
alter table public.orders
  add column if not exists buyer_commune text;

comment on column public.orders.buyer_commune is
  'Comuna del comprador elegida en el checkout (lista cerrada de lib/comunas.ts). Se llena también en retiro en persona.';

-- Para cruzar demanda por comuna sin escanear la tabla entera.
create index if not exists orders_buyer_commune_idx
  on public.orders (buyer_commune)
  where buyer_commune is not null;
