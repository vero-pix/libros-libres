-- API keys para acceso externo al catálogo de vendedores
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key         TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL DEFAULT 'Mi API Key',
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_keys_key_idx ON api_keys(key);
CREATE INDEX IF NOT EXISTS api_keys_seller_idx ON api_keys(seller_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Solo el propio seller puede ver y eliminar sus keys
CREATE POLICY "sellers_select_own_keys" ON api_keys
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "sellers_delete_own_keys" ON api_keys
  FOR DELETE USING (auth.uid() = seller_id);

-- Insert lo hace el service role desde la API (no el cliente directo)
