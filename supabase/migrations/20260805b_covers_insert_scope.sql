-- Cerrar el INSERT del bucket 'covers': cualquier autenticado podía escribir
-- en CUALQUIER ruta.
--
-- La política original (20260403_cover_storage.sql) era:
--     for insert with check (bucket_id = 'covers' and auth.uid() is not null)
--
-- O sea: estar logueado bastaba para subir un archivo en la carpeta de otro
-- usuario. Verificado el 5 ago 2026 con una cuenta de prueba: pudo crear
-- `avatars/<uid-ajeno>.jpg` sin ser esa persona. Un usuario podía plantarle una
-- foto de perfil a un vendedor que no tuviera una, o colar imágenes bajo la
-- carpeta de otro. El UPDATE ya quedó acotado en 20260805_avatar_update_policy;
-- faltaba el INSERT, que es por donde se creaban los archivos nuevos.
--
-- Desde el navegador solo se escriben dos formas de ruta (verificado en
-- ProfileForm, PublishForm e ImageUploadMultiple):
--     <uid>/...            → portadas de libros
--     avatars/<uid>.<ext>  → foto de perfil
-- Todo lo demás que hay en el bucket (p. ej. `photo-crops/`) lo suben scripts
-- con service role, que no pasa por RLS y no se ve afectado.

drop policy if exists "Autenticados suben portadas" on storage.objects;
create policy "Autenticados suben portadas"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'covers'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or name like 'avatars/' || auth.uid()::text || '.%'
    )
  );
