CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  reviewer_id UUID NOT NULL REFERENCES public.users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, reviewer_id)
);
CREATE INDEX reviews_listing_idx ON public.reviews(listing_id);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews visibles para todos" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Usuario crea review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
