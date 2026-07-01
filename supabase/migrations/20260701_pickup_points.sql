-- Puntos de entrega en persona por vendedor (idea de Carlos / CIMLibros: "yo entrego
-- en varios lugares"). Array JSON de puntos { label, comuna } — es por TIENDA (vale
-- para todos sus libros). No toca la lógica de pago: es info para el comprador.
-- Backward-compatible: default [] y las columnas existentes no se afectan.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pickup_points JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.users.pickup_points IS
  'Puntos de entrega en persona del vendedor: [{ "label": "Metro Los Leones", "comuna": "Providencia" }]';
