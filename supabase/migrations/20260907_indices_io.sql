-- Índices para bajar el Disk IO (Supabase Advisor, 07-09-2026).
--
-- ⚠️ CREATE INDEX CONCURRENTLY no puede correr dentro de una transacción:
-- en el SQL Editor de Supabase hay que ejecutar CADA sentencia por separado
-- (seleccionar una línea y correrla), no el archivo entero de una vez.
-- Si una falla a medias deja un índice INVALID: borrarlo con
-- `drop index concurrently if exists <nombre>` y repetir.

-- 1. /api/analytics consulta page_views por session_id en CADA vista de página
--    (update de user_id, count y select de los últimos 90 s). Sin índice era
--    un barrido completo por visita.
create index concurrently if not exists page_views_session_created_idx
  on public.page_views (session_id, created_at desc);

-- 2. Buscador, feeds y sitemap: filtran por status y ordenan por created_at.
--    Solo existía índice por status, así que cada búsqueda ordenaba todo el
--    catálogo activo.
create index concurrently if not exists listings_status_created_idx
  on public.listings (status, created_at desc);

-- 3. Filtros por categoría y subcategoría del buscador y de /categoria/*.
--    books no tenía índice para ninguna de las dos.
create index concurrently if not exists books_category_subcategory_idx
  on public.books (category, subcategory);

-- Pendiente de evaluar con pg_stat_statements después de estos tres:
-- un índice cubriente page_views (created_at desc) include (session_id, path,
-- referrer) para los reportes. NO por ahora: referrer es texto largo y
-- engordaría el índice en una tabla que crece por visita.
