-- Mueve los tokens de MercadoPago a su propia tabla — 27 jul 2026 (paso 1 de 2)
--
-- POR QUÉ. Para cortar la fuga de los tokens hubo que pasar `users` a permisos
-- por columna (20260727_fix_revoke_tokens_mp.sql). Eso funcionó, pero dejó dos
-- trampas: toda columna NUEVA de `users` nace sin permiso para el cliente, y un
-- select("*") sobre la tabla falla (ya tumbó /vendedor/* una vez).
--
-- La solución durable es que las credenciales no vivan en una tabla que el
-- cliente lee. Con los tokens fuera, `users` recupera su GRANT de tabla y deja
-- de tener trampas: no hay nada secreto que proteger ahí.
--
-- ESTA MIGRACIÓN ES ADITIVA Y SEGURA: crea la tabla y copia los datos. Las
-- columnas viejas siguen en su lugar y el sitio sigue funcionando igual. El
-- DROP y la restauración del GRANT van en el paso 2, DESPUÉS de que el código
-- que lee de la tabla nueva esté en producción.

CREATE TABLE IF NOT EXISTS public.mp_credentials (
  user_id       UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mp_credentials IS
  'Tokens OAuth de MercadoPago por vendedor. SOLO service role: sin grants a anon/authenticated y con RLS activa sin policies. Nunca leer desde el cliente. La bandera pública de "tiene MP conectado" es users.mercadopago_user_id.';

-- Copiar lo que ya existe (idempotente: si se corre dos veces no duplica)
INSERT INTO public.mp_credentials (user_id, access_token, refresh_token)
SELECT id, mercadopago_access_token, mercadopago_refresh_token
  FROM public.users
 WHERE mercadopago_access_token IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- ── Cerrada a cal y canto ──
-- RLS activa sin policies: anon/authenticated no ven ni una fila.
-- El service role ignora RLS, que es como la leen las rutas del servidor.
ALTER TABLE public.mp_credentials ENABLE ROW LEVEL SECURITY;

-- Supabase tiene ALTER DEFAULT PRIVILEGES que otorga a anon/authenticated sobre
-- las tablas nuevas del schema public. Hay que revocarlo explícitamente.
REVOKE ALL ON public.mp_credentials FROM anon;
REVOKE ALL ON public.mp_credentials FROM authenticated;
