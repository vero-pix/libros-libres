CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  country TEXT,
  user_id UUID REFERENCES public.users(id),
  listing_id UUID REFERENCES public.listings(id),
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_views_created_idx ON public.page_views(created_at DESC);
CREATE INDEX page_views_path_idx ON public.page_views(path);
CREATE INDEX page_views_listing_idx ON public.page_views(listing_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can log views" ON public.page_views FOR INSERT WITH CHECK (true);

-- Only admin can read
CREATE POLICY "Admin reads views" ON public.page_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
