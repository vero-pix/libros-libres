-- Fix: permitir eliminar listings que tienen reviews, orders o page_views
-- Cambiar FK a ON DELETE CASCADE donde faltaba

-- reviews
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_listing_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_listing_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;

-- page_views
ALTER TABLE public.page_views DROP CONSTRAINT IF EXISTS page_views_listing_id_fkey;
ALTER TABLE public.page_views ADD CONSTRAINT page_views_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;

-- rentals
ALTER TABLE public.rentals DROP CONSTRAINT IF EXISTS rentals_listing_id_fkey;
ALTER TABLE public.rentals ADD CONSTRAINT rentals_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;

-- Agregar policy para que vendedores puedan eliminar sus propias publicaciones
CREATE POLICY "Vendedor elimina su publicación"
  ON public.listings FOR DELETE
  USING (auth.uid() = seller_id);
