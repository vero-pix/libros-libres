-- Tabla de códigos de descuento
CREATE TABLE IF NOT EXISTS discount_codes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code          text UNIQUE NOT NULL,
  description   text,
  discount_pct  int NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  max_uses      int,           -- null = ilimitado
  uses_count    int DEFAULT 0,
  active        boolean DEFAULT true,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- Columnas en orders para registrar el descuento aplicado
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_code   text,
  ADD COLUMN IF NOT EXISTS discount_amount int DEFAULT 0;

-- Código inicial: vecinos del edificio
INSERT INTO discount_codes (code, description, discount_pct, max_uses, active)
VALUES ('VECINOS20', '20% dcto. vecinos del edificio', 20, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- RLS: solo admins pueden ver/modificar discount_codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_discount_codes" ON discount_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Cualquier usuario autenticado puede leer códigos activos (para validación en checkout)
CREATE POLICY "read_active_discount_codes" ON discount_codes
  FOR SELECT USING (active = true);
