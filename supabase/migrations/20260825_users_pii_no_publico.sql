-- Cortar la fuga de datos personales de `users` al rol anónimo.
--
-- 25 ago 2026 — Supabase avisó por correo ("Table publicly accessible") y al
-- auditar con la anon key —que va incrustada en el JavaScript público del
-- sitio, o sea la tiene cualquiera— se pudo descargar:
--
--     299 correos electrónicos
--     148 teléfonos
--     118 direcciones particulares
--
-- La RLS de `users` está habilitada, pero RLS filtra FILAS, no COLUMNAS: la
-- policy de lectura pública deja ver la fila entera. El corte correcto son
-- privilegios por columna.
--
-- ⚠️ APLICAR EN EL SQL EDITOR DE SUPABASE (no hay CLI en este proyecto).
--
-- ⚠️⚠️ ESTO YA TUMBÓ PRODUCCIÓN UNA VEZ (28 jul 2026). Al pasar `users` a
-- permisos por columna, todo `select("*")` sobre la tabla empieza a fallar y se
-- cayeron las páginas /vendedor/*. Verificado antes de escribir esta migración:
-- HOY NO QUEDA NINGÚN `select("*")` ni `users(*)` en el repo — todas las
-- lecturas nombran sus columnas. Si esto se aplica meses después, volver a
-- correr la verificación:
--
--   grep -rn 'from("users")' --include="*.ts" --include="*.tsx" app/ components/ lib/ \
--     | grep -E 'select\("\*"\)|users\(\*\)'
--
-- ⚠️ CONSECUENCIA PERMANENTE: con permisos por columna, toda columna que se
-- agregue a `users` de aquí en adelante nace SIN permiso para `anon`. Si una
-- página pública la pide, falla. Al agregar una columna pública, sumarla al
-- GRANT de abajo.
--
-- NO se revoca nada al rol `authenticated` a propósito: el checkout, el perfil y
-- las rutas de admin leen email/teléfono/dirección con la sesión del usuario y
-- tienen que seguir funcionando. Se verificó que ninguna lectura anónima toca
-- las columnas que quedan fuera.
--
-- Verificación previa — debe devolver la lista de columnas actuales:
--   SELECT column_name FROM information_schema.column_privileges
--   WHERE table_name = 'users' AND grantee = 'anon';
--
-- Verificación posterior — con la anon key, esto debe fallar:
--   curl "$URL/rest/v1/users?select=email&limit=1" -H "apikey: $ANON"

BEGIN;

-- 1. Cortar el acceso amplio del rol anónimo.
REVOKE SELECT ON public.users FROM anon;

-- 2. Devolver SOLO las columnas que el sitio usa sin sesión. La lista sale de
--    auditar todos los `users(...)` que pasan por `createPublicClient()` y por
--    el cliente de servidor cuando el visitante no tiene cuenta: home, search,
--    categoría, colección, autor, ciudad, novedades, tiendas y la ficha.
GRANT SELECT (
  id,
  full_name,
  avatar_url,
  username,
  bio,
  city,
  public_email,
  instagram,
  plan,
  featured,
  on_vacation,
  vacation_message,
  pickup_points,
  mercadopago_user_id,
  mercadopago_connected_at,
  created_at,
  -- El teléfono queda porque el botón "Contactar por WhatsApp" tiene que
  -- funcionar para un visitante sin cuenta (vendedores sin MercadoPago, ver
  -- lib/whatsapp-policy.ts). ⚠️ Esto todavía permite scrapear los 148
  -- teléfonos publicados. El arreglo de fondo es servirlo por una función que
  -- devuelva el teléfono de UN vendedor a la vez, no la columna entera.
  phone
) ON public.users TO anon;

-- 3. Lo que queda FUERA a propósito, y por qué:
--      email              → PII. Para mostrar contacto existe `public_email`.
--      default_address    → dirección particular de la persona.
--      default_latitude   → ídem, permite ubicar la casa.
--      default_longitude  → ídem.
--      role               → deja identificar quién es admin.
--      referral_code      → permite atribuirse referidos ajenos.
--      referred_by        → grafo social de quién invitó a quién.
--      updated_at         → no lo usa nadie sin sesión.

-- 4. `spatial_ref_sys` es de PostGIS y viene sin RLS: es la que probablemente
--    disparó el aviso de Supabase.
--
--    APLICADO EL 25 AGO Y NO SURTIÓ EFECTO: sigue siendo legible con la anon
--    key. PostGIS otorga la tabla a PUBLIC, y revocarle a `anon` no toca ese
--    grant. Lo que sí funcionaría es `REVOKE ALL ON public.spatial_ref_sys
--    FROM PUBLIC`, pero eso puede romper funciones de PostGIS que la consultan
--    con los permisos de quien invoca (ST_Transform y compañía), y este sitio
--    hace búsquedas por distancia.
--
--    DECISIÓN: se deja como está. Es el catálogo estándar de sistemas de
--    referencia geodésica —los mismos 8.500 SRIDs que trae cualquier
--    instalación de PostGIS—, no hay un solo dato de tuslibros ahí. El aviso de
--    Supabase se puede marcar como aceptado en el panel. No vale arriesgar el
--    buscador por una tabla de referencia pública.
REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;

COMMIT;
