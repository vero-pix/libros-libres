-- ============================================================
-- Taxonomía de categorías orientada al mercado chileno
-- Fecha: 2026-05-05
-- ============================================================
-- Reemplaza la taxonomía genérica (ficcion/no-ficcion) por una
-- específica al mercado chileno: escolar, universitario, etc.
-- La tabla `categories` ya existe con columnas:
--   slug, name, parent_slug, sort_order
-- No se cambia el esquema — solo el contenido.
-- ============================================================

-- 1. Limpiar referencias en books antes de borrar categorías
-- (books.category y books.subcategory tienen FK → categories.slug)
-- Los libros existentes quedan sin categoría; se pueden reclasificar
-- manualmente o al editar cada publicación.
UPDATE public.books SET category = NULL, subcategory = NULL
WHERE category IS NOT NULL OR subcategory IS NOT NULL;

-- 2. Eliminar taxonomía anterior (ahora sin referencias activas)
DELETE FROM public.categories;

-- 2. Categorías raíz (parent_slug = null)
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('escolar',                'Escolar',                null, 1),
  ('lectura-complementaria', 'Lectura Complementaria', null, 2),
  ('universitario',          'Universitario',          null, 3),
  ('tecnico-cft',            'Técnico / CFT',          null, 4),
  ('general-adulto',         'General / Adulto',       null, 5),
  ('idiomas',                'Idiomas',                null, 6),
  ('otros',                  'Otros',                  null, 7);

-- 3. Subcategorías: Escolar
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('escolar-basica-1-6',  'Básica 1°–6°',         'escolar', 1),
  ('escolar-basica-7-8',  'Básica 7°–8°',         'escolar', 2),
  ('escolar-media',       'Media 1°–4°',          'escolar', 3),
  ('escolar-matematicas', 'Matemáticas',           'escolar', 4),
  ('escolar-lenguaje',    'Lenguaje y Literatura', 'escolar', 5),
  ('escolar-historia',    'Historia y Geografía',  'escolar', 6),
  ('escolar-ciencias',    'Ciencias',              'escolar', 7),
  ('escolar-ingles',      'Inglés',                'escolar', 8);

-- 4. Subcategorías: Lectura Complementaria
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('lectura-complementaria-mineduc',  'Lista MINEDUC',      'lectura-complementaria', 1),
  ('lectura-complementaria-infantil', 'Literatura Infantil', 'lectura-complementaria', 2),
  ('lectura-complementaria-juvenil',  'Literatura Juvenil',  'lectura-complementaria', 3);

-- 5. Subcategorías: Universitario
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('universitario-derecho',        'Derecho',                   'universitario', 1),
  ('universitario-ingenieria',     'Ingeniería',                'universitario', 2),
  ('universitario-medicina',       'Medicina y Salud',          'universitario', 3),
  ('universitario-administracion', 'Administración y Economía', 'universitario', 4),
  ('universitario-psicologia',     'Psicología',                'universitario', 5),
  ('universitario-arquitectura',   'Arquitectura y Diseño',     'universitario', 6),
  ('universitario-otros',          'Otras carreras',            'universitario', 7);

-- 6. Subcategorías: Técnico / CFT
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('tecnico-cft-administracion', 'Administración', 'tecnico-cft', 1),
  ('tecnico-cft-salud',          'Salud',          'tecnico-cft', 2),
  ('tecnico-cft-tecnologia',     'Tecnología',     'tecnico-cft', 3),
  ('tecnico-cft-gastronomia',    'Gastronomía',    'tecnico-cft', 4);

-- 7. Subcategorías: General / Adulto
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('general-adulto-novela',    'Novela y Ficción',      'general-adulto', 1),
  ('general-adulto-ensayo',    'Ensayo y No Ficción',   'general-adulto', 2),
  ('general-adulto-historia',  'Historia',              'general-adulto', 3),
  ('general-adulto-autoayuda', 'Autoayuda',             'general-adulto', 4),
  ('general-adulto-ciencia',   'Ciencia y Divulgación', 'general-adulto', 5),
  ('general-adulto-arte',      'Arte y Fotografía',     'general-adulto', 6);

-- 8. Subcategorías: Idiomas
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('idiomas-ingles',    'Inglés',        'idiomas', 1),
  ('idiomas-frances',   'Francés',       'idiomas', 2),
  ('idiomas-aleman',    'Alemán',        'idiomas', 3),
  ('idiomas-portugues', 'Portugués',     'idiomas', 4),
  ('idiomas-otros',     'Otros idiomas', 'idiomas', 5);

-- 9. Subcategorías: Otros
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('otros-revistas',      'Revistas',                     'otros', 1),
  ('otros-comics',        'Cómics y Manga',               'otros', 2),
  ('otros-enciclopedias', 'Enciclopedias y Diccionarios', 'otros', 3),
  ('otros-religion',      'Religión y Espiritualidad',    'otros', 4);
