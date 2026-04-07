CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  asker_id UUID NOT NULL REFERENCES public.users(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX questions_listing_idx ON public.questions(listing_id);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver preguntas
CREATE POLICY "Questions visibles para todos" ON public.questions FOR SELECT USING (true);

-- Usuario logueado puede preguntar
CREATE POLICY "Usuario crea pregunta" ON public.questions FOR INSERT WITH CHECK (auth.uid() = asker_id);

-- Solo el vendedor del listing puede responder (update answer)
CREATE POLICY "Vendedor responde pregunta" ON public.questions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = questions.listing_id
    AND listings.seller_id = auth.uid()
  )
);
