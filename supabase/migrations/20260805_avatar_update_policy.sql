-- Arreglar el cambio de foto de perfil: era de un solo uso.
--
-- Un vendedor reportó el 5 ago 2026 que intentó cambiar su foto CINCO veces
-- siguiendo el procedimiento correcto y nunca resultó. No era él: faltaban
-- políticas.
--
-- 1) `ProfileForm` sube con { upsert: true }. Un upsert sobre un archivo que YA
--    existe necesita UPDATE sobre storage.objects, y esa política nunca se
--    creó (ver 20260403_cover_storage.sql: solo select, insert y delete). Por
--    eso la primera foto subía —era INSERT— y ningún reemplazo funcionaba.
--
-- 2) La política de DELETE compara el uid contra `(storage.foldername(name))[1]`,
--    o sea el PRIMER segmento de la ruta. Para las portadas de libros eso
--    calza, porque van en `<uid>/<archivo>.jpg`. Pero los avatares van en
--    `avatars/<uid>.jpg`, así que el primer segmento es literalmente
--    "avatars" y la comparación nunca da verdadera: tampoco se podían borrar.
--
-- Afectaba a los 28 usuarios con foto.

-- Reemplazar la propia portada (ruta <uid>/…) o el propio avatar
-- (ruta avatars/<uid>.<ext>).
drop policy if exists "Usuario actualiza su portada" on storage.objects;
create policy "Usuario actualiza su portada"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'covers'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or name like 'avatars/' || auth.uid()::text || '.%'
    )
  )
  with check (
    bucket_id = 'covers'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or name like 'avatars/' || auth.uid()::text || '.%'
    )
  );

-- Misma corrección para el borrado: la política vieja dejaba fuera los avatares.
drop policy if exists "Usuario borra su portada" on storage.objects;
create policy "Usuario borra su portada"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'covers'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or name like 'avatars/' || auth.uid()::text || '.%'
    )
  );
