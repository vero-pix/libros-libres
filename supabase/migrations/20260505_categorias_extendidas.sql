-- ────────────────────────────────────────────────────────────
-- Ampliación de categorías literarias (Poesía, Policial, etc.)
-- ────────────────────────────────────────────────────────────

-- 1. Agregar nuevas subcategorías a 'general-adulto'
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('general-adulto-poesia',      'Poesía',                    'general-adulto', 7),
  ('general-adulto-policial',    'Novela Policial / Suspenso', 'general-adulto', 8),
  ('general-adulto-biografia',   'Biografías y Memorias',      'general-adulto', 9),
  ('general-adulto-teatro',      'Teatro y Dramaturgia',       'general-adulto', 10),
  ('general-adulto-humanidades', 'Humanidades y Soc.',         'general-adulto', 11),
  ('general-adulto-infantil-juvenil', 'Infantil y Juvenil',    'general-adulto', 12);

-- 2. Corregir algunos nombres para que se vean mejor en el dropdown
UPDATE public.categories SET name = 'Novela y Ficción' WHERE slug = 'general-adulto-novela';
UPDATE public.categories SET name = 'Ensayo y Divulgación' WHERE slug = 'general-adulto-ensayo';

-- 3. Mover espiritualidad a general si existe en otros (o agregarla)
DELETE FROM public.categories WHERE slug = 'otros-religion';
INSERT INTO public.categories (slug, name, parent_slug, sort_order) VALUES
  ('general-adulto-espiritualidad', 'Religión y Espiritualidad', 'general-adulto', 13);
