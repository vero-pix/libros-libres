-- Compras que se suman a un paquete que el vendedor todavía no despachó.
--
-- Caso Don Luis (09-09-2026): compró 3 veces a Casa Emunah en 3 días y pagó
-- flete las 3 ($16.230 sobre $75.000 en libros). Dos de esas compras tenían
-- 18 minutos de diferencia y el mismo retiro agendado: dos paquetes que
-- podían ser uno.
--
-- Cuando el checkout detecta un envío abierto del mismo vendedor a la misma
-- dirección, no cobra flete de nuevo y apunta acá al bundle al que hay que
-- sumar los libros. Sin esta columna el vendedor no tendría cómo enterarse:
-- vería una venta nueva sin despacho pagado y armaría un segundo paquete.
alter table orders
  add column if not exists merged_into_bundle_id uuid;

comment on column orders.merged_into_bundle_id is
  'Bundle del envío ya en preparación al que estos libros se suman. Cuando no es null, el comprador NO pagó flete y el vendedor debe meter estos libros en ese mismo paquete, sin generar una etiqueta nueva.';

create index if not exists orders_merged_into_bundle_id_idx
  on orders (merged_into_bundle_id)
  where merged_into_bundle_id is not null;
