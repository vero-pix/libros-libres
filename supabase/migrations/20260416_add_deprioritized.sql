-- Flag para bajar en el catálogo listings que no queremos destacar
-- (libros polémicos, duplicados, contenido sensible) sin esconderlos.
-- Siguen siendo comprables vía búsqueda directa y perfil del vendedor.
alter table public.listings
  add column if not exists deprioritized boolean not null default false;

create index if not exists listings_deprioritized_idx
  on public.listings (deprioritized)
  where deprioritized = true;

-- Marcar el primer caso: Mein Kampf publicado por Nicolás Eltit
update public.listings
set deprioritized = true
where id = 'af7a5a9f-e76f-4555-b252-7230a7b8e2c5';
