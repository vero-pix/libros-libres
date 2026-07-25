-- Precio mínimo en las publicaciones — validación del lado del servidor.
--
-- El formulario escribe directo a Supabase desde el navegador (no hay un
-- endpoint intermedio), así que la única validación que NO se puede saltar
-- es esta: una restricción en la base.
--
-- Caso que la origina: "Historia de Mayta" publicado en $100 por un dedazo,
-- y encima destacado en el carrusel "Para regalar".
--
-- NOT VALID a propósito: las 3 publicaciones que hoy están bajo el mínimo
-- quedan intactas (Vero decide caso a caso, ver scripts/_audit_integridad.mjs).
-- La restricción aplica solo a inserts y updates nuevos.

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_price_minimo;

ALTER TABLE listings
  ADD CONSTRAINT listings_price_minimo
  CHECK (price IS NULL OR price >= 1000)
  NOT VALID;

COMMENT ON CONSTRAINT listings_price_minimo ON listings IS
  'Precio mínimo $1.000. Evita dedazos (ej: $100 en vez de $100.000). '
  'NOT VALID: no toca las filas históricas bajo el mínimo.';

-- Para validar también lo histórico, después de limpiar los 3 casos:
--   ALTER TABLE listings VALIDATE CONSTRAINT listings_price_minimo;
