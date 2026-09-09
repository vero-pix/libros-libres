-- La comuna desde la que el vendedor despacha, cuando NO es la del libro.
--
-- Caso que lo motivó (09-09-2026): Bárbara vende desde Algarrobo, donde ningún
-- courier retira ni recibe. Acordó dejar los paquetes en San Antonio y su origen
-- de Shipit quedó creado ahí. Pero /api/shipping/quote resolvía el origen
-- mirando `listings.address` ("Antumada 10, Algarrobo"), así que cotizaba desde
-- Algarrobo y Shipit respondía "sin servicio" — con el checkout ya ofreciendo
-- courier porque `shipit_origin_id` estaba puesto. Pantalla de compra trabada,
-- que es justo lo que pasó con la venta de Melipeuco el 5 de agosto.
--
-- `resolverOrigenEnvio()` en lib/shipping-quote.ts ya acepta esta comuna y le da
-- máxima prioridad; lo que faltaba era de dónde leerla.
--
-- Null = el vendedor despacha desde donde está el libro, que es el caso normal.
alter table users add column if not exists shipit_origin_commune text;

comment on column users.shipit_origin_commune is
  'Comuna desde donde el vendedor deja los paquetes, si es distinta a la del libro. Debe coincidir con la comuna del origen en Shipit (users.shipit_origin_id). Null = se usa la dirección del listing.';
