-- Galería de imágenes por listing (portada, contraportada, estado, etc.)
CREATE TABLE IF NOT EXISTS public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_images_listing_idx ON public.listing_images(listing_id);

ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imágenes visibles para todos"
  ON public.listing_images FOR SELECT
  USING (true);

CREATE POLICY "Vendedor agrega imágenes"
  ON public.listing_images FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT seller_id FROM public.listings WHERE id = listing_id)
  );

CREATE POLICY "Vendedor elimina imágenes"
  ON public.listing_images FOR DELETE
  USING (
    auth.uid() = (SELECT seller_id FROM public.listings WHERE id = listing_id)
  );
