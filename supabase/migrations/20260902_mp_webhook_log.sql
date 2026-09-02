-- Log de webhooks de MercadoPago.
--
-- Por qué: hoy el único rastro de que MP respondió es `orders.mercadopago_payment_id`.
-- Si esa columna está vacía no hay forma de distinguir "el comprador nunca pagó"
-- de "pagó y el webhook no actualizó la orden". Eso es ceguera contable: al
-- diagnosticar las 14 órdenes pendientes del 2 de septiembre de 2026 hubo que
-- inferirlo mirando la navegación posterior del usuario, no los datos del cobro.
--
-- Se registra TODO webhook recibido, incluso los que se descartan por firma
-- inválida o por no ser de tipo payment: el caso interesante es justamente el
-- que se descartó y no debía descartarse.

CREATE TABLE IF NOT EXISTS mp_webhook_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at      timestamptz NOT NULL DEFAULT now(),

  -- Lo que dijo MercadoPago
  payment_id       text,
  external_ref     text,               -- bundle_id u order.id
  mp_status        text,               -- approved / rejected / pending / in_process
  mp_status_detail text,
  amount           numeric,

  -- Qué hicimos con él
  resultado        text NOT NULL,      -- 'aplicado' | 'firma_invalida' | 'ignorado' | 'sin_orden' | 'error'
  orders_afectadas int  NOT NULL DEFAULT 0,
  detalle          text,               -- mensaje de error o motivo del descarte
  payload          jsonb               -- cuerpo crudo, para poder reprocesar
);

CREATE INDEX IF NOT EXISTS mp_webhook_log_payment_idx  ON mp_webhook_log (payment_id);
CREATE INDEX IF NOT EXISTS mp_webhook_log_ref_idx      ON mp_webhook_log (external_ref);
CREATE INDEX IF NOT EXISTS mp_webhook_log_recibido_idx ON mp_webhook_log (received_at DESC);

-- Solo el service role escribe y lee: el payload trae datos del pagador.
-- Sin ninguna policy de SELECT, la anon key no ve nada — que es lo que se
-- quiere (ver el incidente de PII de `users` del 25-08-2026).
ALTER TABLE mp_webhook_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE mp_webhook_log IS
  'Todo webhook de MercadoPago recibido, aplicado o descartado. Permite distinguir "no pagó" de "pagó y no se registró".';
