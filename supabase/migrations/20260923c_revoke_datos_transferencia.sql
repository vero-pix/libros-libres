-- 23-09-2026 · El sitio NO guarda ni muestra datos bancarios de nadie.
--
-- Regla de Vero: el pago por transferencia sigue existiendo, pero los datos se
-- los manda el vendedor al comprador por mensaje, una vez hecho el pedido
-- (app/api/orders/route.ts). Basta con `users.acepta_transferencia`, y el
-- código ya no lee ni escribe `datos_transferencia` en ninguna parte.
--
-- Por qué había que vaciarla: la política de lectura de `users` es `true` y el
-- rol `authenticated` tiene SELECT A NIVEL DE TABLA. Cualquier persona con
-- sesión podía leer los datos bancarios de un vendedor (verificado el 23-09
-- con scripts/_test_users_pii.mjs). La única fila con datos era la de @vero.
--
-- ⚠️ Los REVOKE por columna de abajo NO cierran la lectura para
-- `authenticated` mientras exista el GRANT de tabla: en Postgres un privilegio
-- de tabla cubre todas las columnas. Lo que protege es el UPDATE a null. Se
-- dejan igual porque sí quitan los GRANT por columna explícitos (anon).
-- Cerrarla de verdad = revocar SELECT de tabla y volver a conceder columna por
-- columna, que es el mismo arreglo pendiente para `email` y `phone`.
--
-- La columna se deja (borrarla es un cambio de esquema aparte).
update public.users set datos_transferencia = null where datos_transferencia is not null;

revoke select (datos_transferencia) on public.users from anon, authenticated;
revoke update (datos_transferencia) on public.users from anon, authenticated;
revoke insert (datos_transferencia) on public.users from anon, authenticated;
