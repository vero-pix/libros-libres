-- ============================================================
-- Marketplace model: OAuth MP, arriendos, planes
-- ============================================================

-- Plan de comisión del vendedor
CREATE TYPE seller_plan AS ENUM ('free', 'librero', 'libreria');

-- Agregar campos marketplace a users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mercadopago_user_id TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan seller_plan NOT NULL DEFAULT 'free';

-- Agregar campos de arriendo a listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS rental_price NUMERIC(10,2) CHECK (rental_price IS NULL OR rental_price >= 0),
  ADD COLUMN IF NOT EXISTS rental_deposit NUMERIC(10,2) CHECK (rental_deposit IS NULL OR rental_deposit >= 0),
  ADD COLUMN IF NOT EXISTS rental_period_days INT CHECK (rental_period_days IS NULL OR rental_period_days IN (7, 14, 30));

-- Estado del arriendo
CREATE TYPE rental_status AS ENUM (
  'pending',      -- esperando pago
  'paid',         -- pagado, esperando entrega
  'active',       -- libro entregado, en préstamo
  'returning',    -- en proceso de devolución
  'completed',    -- devuelto y confirmado
  'overdue',      -- plazo vencido
  'defaulted'     -- no devuelto, garantía liberada al dueño
);

-- Forma de entrega
CREATE TYPE delivery_method AS ENUM (
  'in_person',    -- encuentro en persona
  'pickup_point', -- punto de retiro
  'courier'       -- envío por courier
);

-- Tabla de arriendos
CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  renter_id UUID NOT NULL REFERENCES public.users(id),
  owner_id UUID NOT NULL REFERENCES public.users(id),

  -- Período
  period_days INT NOT NULL CHECK (period_days IN (7, 14, 30)),
  start_date DATE,
  end_date DATE,

  -- Precios
  rental_price NUMERIC(10,2) NOT NULL,
  deposit NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,

  -- Estado
  status rental_status NOT NULL DEFAULT 'pending',

  -- Entrega
  delivery_method delivery_method NOT NULL DEFAULT 'in_person',
  delivery_address TEXT,

  -- MercadoPago
  mercadopago_preference_id TEXT,
  mercadopago_payment_id TEXT,
  deposit_payment_id TEXT,

  -- Extensiones
  extended_count INT NOT NULL DEFAULT 0,
  original_end_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rentals_renter_idx ON public.rentals(renter_id);
CREATE INDEX IF NOT EXISTS rentals_owner_idx ON public.rentals(owner_id);
CREATE INDEX IF NOT EXISTS rentals_listing_idx ON public.rentals(listing_id);
CREATE INDEX IF NOT EXISTS rentals_status_idx ON public.rentals(status);

CREATE TRIGGER rentals_updated_at
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS para arriendos
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Arrendatario ve sus arriendos"
  ON public.rentals FOR SELECT
  USING (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "Autenticados pueden crear arriendos"
  ON public.rentals FOR INSERT
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Participantes pueden actualizar arriendo"
  ON public.rentals FOR UPDATE
  USING (auth.uid() = renter_id OR auth.uid() = owner_id);

-- Admin ve todos los arriendos
CREATE POLICY "Admin ve todos los arriendos"
  ON public.rentals FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin actualiza arriendos"
  ON public.rentals FOR UPDATE
  USING (public.is_admin());

-- Tabla de comisiones (para tracking)
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  rental_id UUID REFERENCES public.rentals(id),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rental')),
  gross_amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  seller_plan seller_plan NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commissions_seller_idx ON public.commissions(seller_id);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve comisiones"
  ON public.commissions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Vendedor ve sus comisiones"
  ON public.commissions FOR SELECT
  USING (auth.uid() = seller_id);
