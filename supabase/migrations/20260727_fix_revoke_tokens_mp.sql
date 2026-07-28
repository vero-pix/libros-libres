-- Cierra de verdad la lectura pública de los tokens de MercadoPago — 27 jul 2026
--
-- POR QUÉ HAY UNA SEGUNDA MIGRACIÓN. La de ayer (20260726_rls_credenciales_mp.sql)
-- se aplicó sin error pero NO tuvo efecto sobre los tokens. Verificado contra
-- producción el 27 jul: con la anon key el token seguía saliendo entero
-- ('APP_USR-4252…', 74 chars).
--
-- La causa es de PostgreSQL: un REVOKE por columna NO hace nada si el rol ya
-- tiene SELECT a nivel de TABLA. Supabase por defecto hace
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated,
-- así que anon tenía SELECT sobre la tabla completa y el revoke por columna
-- pasó de largo, en silencio. El privilegio de tabla gana sobre el de columna.
--
-- La forma correcta es al revés: quitar el SELECT de tabla y volver a otorgarlo
-- explícitamente sobre las columnas permitidas.
--
-- (La parte 2 de la migración de ayer —ENABLE ROW LEVEL SECURITY en
-- discount_codes— sí funcionó: anon ve 0 filas, service role ve las suyas.)

-- ── 1. Quitar el SELECT de tabla, que es el que anulaba el revoke ──
REVOKE SELECT ON public.users FROM anon;
REVOKE SELECT ON public.users FROM authenticated;

-- ── 2. Devolverlo solo sobre las columnas que no son credenciales ──
-- Son las 27 columnas de users menos mercadopago_access_token y
-- mercadopago_refresh_token. Mantiene vivos los ~74 joins embebidos
-- seller:users(...) que muestran nombre y username en todo el sitio, y
-- mercadopago_user_id, que es el que decide si la ficha muestra el botón comprar.
GRANT SELECT (
  id,
  email,
  full_name,
  avatar_url,
  created_at,
  updated_at,
  city,
  phone,
  default_latitude,
  default_longitude,
  default_address,
  role,
  mercadopago_user_id,
  mercadopago_connected_at,
  plan,
  bio,
  public_email,
  instagram,
  referral_code,
  referred_by,
  featured,
  username,
  on_vacation,
  vacation_message,
  pickup_points
) ON public.users TO anon, authenticated;

COMMENT ON COLUMN public.users.mercadopago_access_token IS
  'CREDENCIAL. SELECT revocado a anon/authenticated el 27-07-2026 (revoke de tabla + grant por columna). Leer SOLO con service role.';
COMMENT ON COLUMN public.users.mercadopago_refresh_token IS
  'CREDENCIAL. SELECT revocado a anon/authenticated el 27-07-2026 (revoke de tabla + grant por columna). Leer SOLO con service role.';

-- ⚠️ OJO A FUTURO: desde ahora el GRANT de users es por columna. Toda columna
-- NUEVA que se agregue a la tabla nace SIN permiso para anon/authenticated y hay
-- que otorgarla a mano:
--     GRANT SELECT (nombre_nueva_columna) ON public.users TO anon, authenticated;
-- Si no, las lecturas desde el cliente fallan con "permission denied for column".
-- La alternativa durable es mover los dos tokens a su propia tabla sin grants;
-- ver la nota en la conversación del 27 jul.
