-- Comisión única de 8% — 26 jul 2026
--
-- Decisión de Vero: se eliminan los tramos por plan (free 8% / librero 5% /
-- librería 3%). Nunca se usaron: los 202 usuarios tenían plan = 'free', así que
-- el 5% y el 3% no aplicaban a nadie y el copy del sitio prometía algo falso.
--
-- Esta migración NO borra columnas: las deja opcionales para que el código pueda
-- dejar de escribirlas sin romper inserts. La tabla commissions está vacía
-- (0 filas al 26 jul 2026), así que no hay datos históricos en riesgo.

-- 1) commissions.seller_plan era NOT NULL, lo que obligaba al código a seguir
--    escribiendo un plan en cada comisión registrada.
ALTER TABLE public.commissions
  ALTER COLUMN seller_plan DROP NOT NULL;

COMMENT ON COLUMN public.commissions.seller_plan IS
  'HEREDADO de los tramos por plan, eliminados el 26 jul 2026. No usar: la comisión es 8% para todos (ver lib/commissions.ts).';

-- 2) users.plan se conserva porque el home lo lee para destacar librerías
--    (app/(main)/page.tsx), pero ya no define comisión.
COMMENT ON COLUMN public.users.plan IS
  'NO define comisión (única, 8%, desde el 26 jul 2026). Hoy solo lo lee el home para destacar librerías. Todos los usuarios están en free.';
