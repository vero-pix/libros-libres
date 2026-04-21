-- Tracking de búsquedas del buscador público
-- Permite identificar gaps del catálogo: qué busca la gente que NO encuentra
CREATE TABLE IF NOT EXISTS public.search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,         -- lowercase + trimmed para agrupar
  results_count INT NOT NULL DEFAULT 0,
  has_results BOOLEAN GENERATED ALWAYS AS (results_count > 0) STORED,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX search_queries_created_idx ON public.search_queries(created_at DESC);
CREATE INDEX search_queries_normalized_idx ON public.search_queries(normalized_query);
CREATE INDEX search_queries_no_results_idx ON public.search_queries(created_at DESC) WHERE results_count = 0;

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (tracking anónimo, como page_views)
CREATE POLICY "Anyone can log searches" ON public.search_queries
  FOR INSERT WITH CHECK (true);

-- Solo admin lee
CREATE POLICY "Admin reads searches" ON public.search_queries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

COMMENT ON TABLE public.search_queries IS
  'Log de búsquedas del buscador. Útil para detectar gaps del catálogo (queries con 0 resultados) y tendencias.';
