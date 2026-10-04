-- 04-10-2026 — Cualquier usuario con sesión podía hacerse admin.
--
-- `anon` y `authenticated` tenían INSERT/UPDATE/DELETE/TRUNCATE a nivel de TABLA
-- sobre `users`, y la policy de UPDATE deja editar la fila propia: bastaba un
-- `update users set role = 'admin' where id = auth.uid()` desde el navegador, y
-- `is_admin()` lee justamente esa columna. Lo mismo con `featured`, `plan`,
-- `acepta_transferencia` y `mercadopago_user_id`.
--
-- Ojo: revocar una columna no sirve mientras exista el grant de tabla; hay que
-- quitar el de tabla y conceder columna por columna.
--
-- Revisado contra el código: todas las escrituras de columnas privilegiadas van
-- con service role (callback de MP, referidos, cron, borrado de cuenta, admin).
-- Desde el navegador solo se escriben: email, full_name, city (registro),
-- datos del perfil, teléfono/dirección (checkout), ubicación (publicar),
-- username, avatar, vacaciones y modo de despacho.

revoke insert, update, delete, truncate, trigger, references on public.users from anon, authenticated;

-- Registro: RegisterForm hace upsert de id, email, full_name y city.
grant insert (id, email, full_name, city) on public.users to authenticated;

-- `id` va en el UPDATE porque el upsert lo reescribe; la policy (id = auth.uid())
-- impide cambiarlo por otro.
grant update (
  id, email, full_name, city, username, avatar_url, bio, phone, public_email,
  instagram, pickup_points, default_address, default_latitude, default_longitude,
  on_vacation, vacation_message, shipit_dispatch_mode, shipit_auto_enabled,
  shipit_origin_commune, shipit_origin_id, shipit_origin_notified_at, updated_at
) on public.users to authenticated;

-- Quedan solo para service role: role, featured, featured_seller_blocked, plan,
-- acepta_transferencia, datos_transferencia, mercadopago_user_id,
-- mercadopago_connected_at, referral_code, referred_by, created_at.
