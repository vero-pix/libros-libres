-- Una sola comisión por orden.
--
-- Desde el 25 ago 2026 la comisión se registra en el webhook de MercadoPago,
-- cuando el pago queda aprobado (antes se escribía al crear la preferencia, y
-- por eso agosto figuraba con $4.800 cuando lo real eran $800).
--
-- MercadoPago reenvía el mismo webhook más de una vez. El código ya consulta
-- antes de insertar (`registrarComisionVenta` en lib/commissions.ts), pero eso
-- no cubre dos webhooks llegando a la vez. Este índice sí.
--
-- Parcial porque `order_id` es nullable: las comisiones de arriendo cuelgan de
-- `rental_id` y deben poder seguir existiendo con `order_id` en NULL.

-- Verificar duplicados antes de crear el índice (debe devolver 0 filas):
--   SELECT order_id, count(*) FROM public.commissions
--   WHERE order_id IS NOT NULL GROUP BY order_id HAVING count(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS commissions_order_id_unico
  ON public.commissions (order_id)
  WHERE order_id IS NOT NULL;
