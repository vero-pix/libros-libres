-- Tokens de MercadoPago fuera de `users` — 27 jul 2026 (paso 2 de 2)
--
-- ⚠️ CORRER SOLO DESPUÉS de que el código que lee de `mp_credentials` esté EN
-- PRODUCCIÓN. Si se corre antes, el checkout de los vendedores con MP se cae:
-- las rutas seguirían buscando el token en una columna que ya no existe.
--
-- Orden correcto:
--   1. 20260727_mp_credentials_tabla_propia.sql  (crea y copia)
--   2. deploy del código                          (lee/escribe mp_credentials)
--   3. este archivo                               (borra y restaura el grant)

-- ── 1. Confirmar que la copia está completa antes de borrar nada ──
-- Si falta alguna credencial por copiar, aborta con error en vez de perder datos.
DO $$
DECLARE
  faltan INT;
BEGIN
  SELECT count(*) INTO faltan
    FROM public.users u
   WHERE u.mercadopago_access_token IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.mp_credentials c WHERE c.user_id = u.id
     );
  IF faltan > 0 THEN
    RAISE EXCEPTION 'Abortado: % credenciales sin copiar a mp_credentials. Correr primero el paso 1.', faltan;
  END IF;
END $$;

-- ── 2. Borrar las credenciales de `users` ──
ALTER TABLE public.users DROP COLUMN IF EXISTS mercadopago_access_token;
ALTER TABLE public.users DROP COLUMN IF EXISTS mercadopago_refresh_token;

-- ── 3. Devolver el GRANT de tabla a `users` ──
-- Ya no queda nada secreto en la tabla, así que el permiso por columna deja de
-- ser necesario. Esto quita la trampa que dejó 20260727_fix_revoke_tokens_mp.sql:
-- las columnas nuevas vuelven a heredar permiso solas y select("*") funciona.
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;

COMMENT ON COLUMN public.users.mercadopago_user_id IS
  'ID público del vendedor en MercadoPago. NO es una credencial: es la bandera de "tiene MP conectado" que usan la ficha, /publish, /mis-libros y el cron mp-nudge. Los tokens viven en public.mp_credentials.';
