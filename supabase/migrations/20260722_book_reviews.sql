-- Reseñas y rating a nivel de OBRA (books.id), independientes de la copia (listing).
-- Doblan como contenido SEO (AggregateRating en la ficha) y como identidad de lector.
-- NO reemplaza `reviews` (transaccional, por listing/vendedor): son cosas distintas.

CREATE TABLE IF NOT EXISTS public.book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL = reseña editorial
  author_label TEXT,             -- byline para editorial (ej. "Equipo tuslibros", "Vero")
  rating INT CHECK (rating >= 1 AND rating <= 5), -- NULL permitido (editorial puede no puntuar)
  title TEXT,
  body TEXT NOT NULL,
  is_editorial BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published', -- published | hidden
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, reviewer_id)  -- 1 reseña de usuario por obra; editoriales tienen reviewer_id NULL
);

CREATE INDEX book_reviews_book_idx ON public.book_reviews(book_id) WHERE status = 'published';

-- Decisión documentada: como UNIQUE(book_id, reviewer_id) NO restringe las
-- editoriales (Postgres trata cada NULL como distinto), forzamos "una editorial
-- por obra" con un índice parcial único. Si mañana se quisieran varias
-- editoriales por obra, se elimina este índice.
CREATE UNIQUE INDEX book_reviews_one_editorial_idx ON public.book_reviews(book_id) WHERE is_editorial;

ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;

-- Solo las publicadas son visibles (las 'hidden' quedan ocultas para el público).
CREATE POLICY "Reseñas de obra visibles" ON public.book_reviews
  FOR SELECT USING (status = 'published');

-- Un usuario solo puede crear su propia reseña (reviewer_id = él mismo).
-- Las editoriales (reviewer_id NULL, is_editorial true) NO pasan por RLS de
-- usuario: se insertan con el service role desde el endpoint admin.
CREATE POLICY "Usuario crea su reseña" ON public.book_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Un usuario solo puede editar su propia reseña.
CREATE POLICY "Usuario edita su reseña" ON public.book_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);
