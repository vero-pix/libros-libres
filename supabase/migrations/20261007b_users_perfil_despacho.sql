-- Perfil de despacho del vendedor (PR 1.3 del plan de despacho propio, 07-10-2026).
--
-- Cada vendedor define con qué couriers trabaja, cuántos días hábiles necesita
-- para despachar, si ofrece despacho coordinado y, si quiere, sus propias
-- tarifas del coordinado en las cuatro zonas. La forma de entrega ya existía:
-- `users.shipit_dispatch_mode` ('dropoff' = punto o sucursal, 'pickup' = retiro).
--
-- Las columnas NO se conceden a anon ni a authenticated: `users` tiene permisos
-- por columna desde 20261004_users_sin_escalada_de_rol.sql, y estas se leen y
-- escriben solo con service role (lib/shipping/perfilDespacho.ts y
-- /api/perfil/despacho). No agregar grants.
--
-- El código funciona sin esta migración: si las columnas no existen, el perfil
-- se trata como vacío y el checkout queda como antes.
--
-- Se aplica a mano en el SQL Editor.

alter table public.users
  add column if not exists despacho_couriers text[] not null default '{}',
  add column if not exists despacho_dias smallint not null default 2,
  add column if not exists coordinado_activo boolean not null default true,
  add column if not exists coordinado_tarifas jsonb;

alter table public.users
  drop constraint if exists users_despacho_couriers_validos,
  add constraint users_despacho_couriers_validos
    check (despacho_couriers <@ array['bluexpress', 'starken', 'chilexpress']::text[]),
  drop constraint if exists users_despacho_dias_rango,
  add constraint users_despacho_dias_rango
    check (despacho_dias between 1 and 15),
  drop constraint if exists users_coordinado_tarifas_objeto,
  add constraint users_coordinado_tarifas_objeto
    check (coordinado_tarifas is null or jsonb_typeof(coordinado_tarifas) = 'object');

comment on column public.users.despacho_couriers is
  'Couriers con los que trabaja el vendedor (bluexpress, starken). Vacío = ninguno. Solo service role.';
comment on column public.users.despacho_dias is
  'Días hábiles que el vendedor necesita para despachar. Solo service role.';
comment on column public.users.coordinado_activo is
  'Si el vendedor ofrece despacho coordinado. Solo service role.';
comment on column public.users.coordinado_tarifas is
  'Tarifas propias del coordinado {santiago, misma_region, otra_region, extremos}. Null = las de site_config.envio_coordinado. Solo service role.';
