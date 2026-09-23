-- 23-09-2026 — `users`: anon y authenticated leen SOLO columnas públicas.
--
-- Qué estaba abierto: `authenticated` tenía SELECT de TABLA sobre public.users y
-- la policy de lectura es `true`, así que cualquier persona con sesión podía
-- bajar el correo, el teléfono, la dirección y las coordenadas de todos los
-- usuarios. `anon` ya estaba limitado por columna desde 20260825, pero con el
-- teléfono incluido a propósito (botón de WhatsApp sin cuenta).
--
-- Desde ahora ninguno de los dos roles lee email, phone, direcciones, role,
-- referidos ni los campos de Shipit. Lo que el sitio necesita de eso lo lee el
-- servidor con service role, acotado a quien corresponde:
--   - el teléfono del vendedor que una página muestra → lib/telefonoVendedor.ts
--   - el perfil propio (/perfil, /publish, /mis-libros, checkout) → por user.id
--   - los datos de la contraparte de un pedido → verificando que es parte
--   - el chequeo de admin → public.is_admin() (SECURITY DEFINER)
--
-- OJO (lección del 28-07-2026): con permisos por columna, `select("*")` sobre
-- users falla entero y toda columna nueva nace SIN permiso de lectura. Si se
-- agrega una columna pública, concederla acá abajo en una migración nueva.

revoke select on public.users from anon, authenticated;

grant select (
  id,
  username,
  full_name,
  avatar_url,
  bio,
  city,
  created_at,
  public_email,
  instagram,
  featured,
  plan,
  on_vacation,
  vacation_message,
  pickup_points,
  mercadopago_user_id,
  mercadopago_connected_at,
  -- Un sí/no que la ficha ya muestra ("se paga por transferencia").
  acepta_transferencia
) on public.users to anon, authenticated;
