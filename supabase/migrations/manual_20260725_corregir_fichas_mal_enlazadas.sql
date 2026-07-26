-- ══════════════════════════════════════════════════════════════════════════
-- CORRECCIÓN MANUAL — NO SE EJECUTA SOLA. Revisar antes de pegar en Supabase.
--
-- 4 listings quedaron colgando de la ficha de libro equivocada. El vendedor
-- escribió el título correcto (queda de testigo en el slug, que NO se toca),
-- pero el ISBN calzó con una ficha ya existente y el título escrito se
-- descartó en silencio.
--
-- Causa raíz corregida en código (rama fix/identificacion-libro): ahora, si el
-- título escrito no se parece al de la ficha encontrada por ISBN, se crea una
-- ficha nueva en vez de enlazar mal.
--
-- Los slugs NO se modifican: hay SEO indexado sobre ellos.
--
-- Detectado por: node scripts/_audit_ficha_slug.mjs
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── CASO 1 — @manuel · "La casa de los espíritus" ────────────────────────
-- La ficha correcta YA EXISTE (creada por otro vendedor, sin ISBN).
-- Solo hay que reapuntar el listing.
UPDATE listings
SET book_id = 'da126e2a-e206-4534-a13b-ef5a3a63fe90'  -- La casa de los espíritus · Isabel Allende
WHERE id = '9ab6db3a-aa00-4712-8d45-bba7b9f03fd6';    -- slug: la-casa-de-los-espiritus-lvwc


-- ── CASO 2 — @manuel · "Retrato en sepia" ────────────────────────────────
-- No existe ficha. Se crea.
-- OJO: isbn va NULL a propósito. El 7806611000322 de la ficha original NO es
-- un ISBN válido (no parte en 978/979): es el código de barras de la edición,
-- compartido por los cuatro tomos. Ese código es justamente el que causó todo
-- esto; no lo propagamos.
WITH nueva AS (
  INSERT INTO books (title, author, isbn, description, category, subcategory, tags, created_by)
  VALUES (
    'Retrato en sepia',
    'Isabel Allende',
    NULL,
    'Novela de Isabel Allende.',
    'ficcion',
    'ficcion-novela',
    ARRAY['clasicos'],
    '06784672-28dc-409a-b8b2-e33868c665fd'
  )
  RETURNING id
)
UPDATE listings SET book_id = (SELECT id FROM nueva)
WHERE id = 'db809edf-c929-45a5-9819-8174fc1717a5';     -- slug: retrato-en-sepia


-- ── CASO 3 — @manuel · "La hija de la fortuna" ───────────────────────────
WITH nueva AS (
  INSERT INTO books (title, author, isbn, description, category, subcategory, tags, created_by)
  VALUES (
    'La hija de la fortuna',
    'Isabel Allende',
    NULL,
    'Novela de Isabel Allende.',
    'ficcion',
    'ficcion-novela',
    ARRAY['clasicos'],
    '06784672-28dc-409a-b8b2-e33868c665fd'
  )
  RETURNING id
)
UPDATE listings SET book_id = (SELECT id FROM nueva)
WHERE id = 'cad7ca3d-e0a2-4d07-87fb-4d248ee8beee';     -- slug: la-hija-de-la-fortuna


-- ── CASO 4 — @rodrigo.olivero · "Libro de inglés Teen Club 1 medio" ──────
-- El ISBN 9789561519770 SÍ es válido y pertenece a "Historia y Geografía 1
-- medio", así que se queda en la ficha original. La nueva va sin ISBN.
WITH nueva AS (
  INSERT INTO books (title, author, isbn, description, category, subcategory, tags, created_by)
  VALUES (
    'Teen Club 1 medio — Inglés',
    'Varios autores',
    NULL,
    'Texto escolar de inglés para 1° medio.',
    'academico',
    'academico-escolar',
    ARRAY[]::text[],
    '304dab7b-c963-40fa-9406-3c05099949b4'
  )
  RETURNING id
)
UPDATE listings SET book_id = (SELECT id FROM nueva)
WHERE id = 'ec3bf307-5b71-4e4b-ba1c-7b2478d56db3';     -- slug: libro-de-ingles-teen-club-1-medio


-- ── LIMPIEZA DE LA FICHA ORIGEN ──────────────────────────────────────────
-- "El plan infinito" queda con su único listing correcto (el-plan-infinito) y
-- se le quita el código de barras que no es ISBN, para que no vuelva a
-- capturar otros libros de la misma edición.
UPDATE books
SET isbn = NULL
WHERE id = 'aa74c78a-7c34-486d-9171-f9ec25788802'
  AND isbn = '7806611000322';

-- También se le limpia el espacio final del título ("El plan infinito ").
UPDATE books
SET title = trim(title)
WHERE id = 'aa74c78a-7c34-486d-9171-f9ec25788802';


-- ── VERIFICACIÓN antes de confirmar ──────────────────────────────────────
-- Deben salir 5 filas, cada slug con SU título correcto.
SELECT l.slug, b.title, b.author, b.isbn
FROM listings l JOIN books b ON b.id = l.book_id
WHERE l.id IN (
  '726c428a-bbb5-4ac8-a625-692d061da4a4',  -- el-plan-infinito (ya estaba bien)
  '9ab6db3a-aa00-4712-8d45-bba7b9f03fd6',  -- la-casa-de-los-espiritus-lvwc
  'db809edf-c929-45a5-9819-8174fc1717a5',  -- retrato-en-sepia
  'cad7ca3d-e0a2-4d07-87fb-4d248ee8beee',  -- la-hija-de-la-fortuna
  'ec3bf307-5b71-4e4b-ba1c-7b2478d56db3'   -- libro-de-ingles-teen-club-1-medio
);

-- Si el SELECT se ve bien:   COMMIT;
-- Si algo no calza:          ROLLBACK;
ROLLBACK;  -- ← cambiar por COMMIT cuando estés conforme
