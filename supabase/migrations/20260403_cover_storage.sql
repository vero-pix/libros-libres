-- Crear bucket para fotos de portada subidas por usuarios
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Cualquiera puede ver las portadas
create policy "Portadas públicas"
  on storage.objects for select
  using (bucket_id = 'covers');

-- Usuarios autenticados pueden subir portadas
create policy "Autenticados suben portadas"
  on storage.objects for insert
  with check (bucket_id = 'covers' and auth.uid() is not null);

-- Usuarios pueden borrar sus propias portadas
create policy "Usuario borra su portada"
  on storage.objects for delete
  using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);
