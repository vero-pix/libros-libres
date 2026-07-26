-- Cortar la lectura pública de las credenciales de MercadoPago — 26 jul 2026
--
-- HALLAZGO. `public.users` tiene RLS activa, pero la policy "Perfiles visibles
-- para todos" es USING (true). RLS filtra FILAS, no COLUMNAS, así que cualquiera
-- con la anon key —que viaja en el bundle del navegador y es pública por diseño—
-- podía leer la tabla completa. Verificado el 26 jul contra producción: 206 filas
-- legibles, incluyendo `mercadopago_access_token` y `mercadopago_refresh_token`
-- de los 38 vendedores conectados. Esos son tokens OAuth vivos: con ellos se
-- puede operar sobre la cuenta de MercadoPago del vendedor. También quedaban
-- expuestos `email`, `default_address` y `role`.
--
-- QUÉ HACE ESTA MIGRACIÓN. Cierra lo más grave y de riesgo cero: revoca el
-- SELECT por columna sobre los dos tokens. El GRANT por columna se evalúa
-- independiente de RLS, así que corta la fuga sin tocar la policy y sin romper
-- los 74 joins embebidos `seller:users(...)` que muestran nombre y username en
-- todo el sitio.
--
-- El código ya quedó compatible en el commit que acompaña esta migración: las
-- únicas rutas que leían los tokens (`app/api/orders/route.ts` y
-- `app/api/rentals/route.ts`) ahora los piden con service role, que ignora RLS y
-- los GRANT. Las páginas que solo necesitaban saber "¿tiene MP conectado?"
-- (`/publish`, `/mis-libros`) pasaron a leer `mercadopago_user_id`, que además es
-- el campo que decide si la ficha muestra el botón de comprar.
--
-- LO QUE ESTA MIGRACIÓN NO CIERRA TODAVÍA: `email`, `default_address`,
-- `default_latitude/longitude` y `role` siguen legibles. Requieren mover ~5
-- lecturas de datos propios y las de admin a service role antes de revocarlas, o
-- la vista `public_profiles` + policy restringida. Ver el detalle en
-- docs_desde_claude/PROMPT_CLAUDE_CODE_RLS_USERS.md.

-- ── 1. Credenciales de MercadoPago: nadie las lee desde el cliente ──
REVOKE SELECT (mercadopago_access_token, mercadopago_refresh_token)
  ON public.users FROM anon;
REVOKE SELECT (mercadopago_access_token, mercadopago_refresh_token)
  ON public.users FROM authenticated;

COMMENT ON COLUMN public.users.mercadopago_access_token IS
  'CREDENCIAL. SELECT revocado a anon/authenticated el 26-07-2026. Leer SOLO con service role.';
COMMENT ON COLUMN public.users.mercadopago_refresh_token IS
  'CREDENCIAL. SELECT revocado a anon/authenticated el 26-07-2026. Leer SOLO con service role.';

-- ── 2. discount_codes: RLS activa sin policies ──
-- Solo se usa desde el servidor con service role (app/api/discount-codes y
-- app/api/orders), y el service role ignora RLS. Sin policies queda cerrada para
-- anon/authenticated, que es lo que corresponde: un código de descuento no
-- debería poder enumerarse desde el navegador.
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
