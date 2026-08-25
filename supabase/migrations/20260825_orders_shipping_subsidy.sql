-- Cuánto puso Vero de su bolsillo por el envío gratis.
--
-- `orders.shipping_cost` guarda lo que pagó el COMPRADOR. Con la promo de envío
-- gratis sobre $20.000 (lib/shipping-promo.ts) esa columna queda en 0 y el flete
-- real desaparece de la base: sin este campo no hay forma de saber si la promo
-- se paga sola o está comiendo margen.
--
-- Se llena solo en la cabeza del bundle, igual que shipping_cost y service_fee.
--
-- ⚠️ APLICAR EN EL SQL EDITOR DE SUPABASE antes de que la promo salga a
-- producción. Si la columna no existe, el insert de la orden falla y nadie
-- puede comprar. Es la única parte de este cambio que no puede esperar.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_subsidy NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.orders.shipping_subsidy IS
  'Parte del flete que absorbió la plataforma (promo de envío gratis). El comprador pagó shipping_cost.';
