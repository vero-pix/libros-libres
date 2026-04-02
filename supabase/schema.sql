-- ============================================================
-- Libros Libres — Schema inicial para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";  -- Para consultas geoespaciales

-- ─────────────────────────────────────────────
-- Tipos enumerados
-- ─────────────────────────────────────────────
create type modality as enum ('sale', 'loan', 'both');
create type listing_status as enum ('active', 'paused', 'completed');
create type book_condition as enum ('new', 'good', 'fair', 'poor');

-- ─────────────────────────────────────────────
-- Tabla: users
-- Espeja auth.users y agrega datos de perfil
-- ─────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  city        text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.users is 'Perfiles de usuario públicos, sincronizados con auth.users';

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url, city)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'city'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-actualizar updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────
-- Tabla: books
-- Catálogo de libros (cargados via ISBN / manual)
-- ─────────────────────────────────────────────
create table if not exists public.books (
  id              uuid primary key default uuid_generate_v4(),
  isbn            text unique,
  title           text not null,
  author          text not null,
  description     text,
  cover_url       text,
  genre           text,
  published_year  int check (published_year > 0 and published_year <= extract(year from now()) + 1),
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table public.books is 'Catálogo de libros, uno por ISBN. Los listings referencian a esta tabla.';

create index if not exists books_isbn_idx      on public.books(isbn);
create index if not exists books_title_idx     on public.books using gin(to_tsvector('spanish', title));
create index if not exists books_author_idx    on public.books using gin(to_tsvector('spanish', author));

-- ─────────────────────────────────────────────
-- Tabla: listings
-- Publicaciones de libros geolocalizadas
-- ─────────────────────────────────────────────
create table if not exists public.listings (
  id          uuid primary key default uuid_generate_v4(),
  book_id     uuid not null references public.books(id) on delete cascade,
  seller_id   uuid not null references public.users(id) on delete cascade,
  modality    modality not null,
  price       numeric(10, 2) check (price is null or price >= 0),
  condition   book_condition not null default 'good',
  notes       text,
  latitude    double precision check (latitude between -90 and 90),
  longitude   double precision check (longitude between -180 and 180),
  address     text,
  -- PostGIS point (opcional, para consultas geoespaciales avanzadas)
  location    geometry(Point, 4326) generated always as (
    case
      when latitude is not null and longitude is not null
      then st_setsrid(st_makepoint(longitude, latitude), 4326)
      else null
    end
  ) stored,
  cover_image_url text,
  status      listing_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.listings is 'Publicaciones de libros con geolocalización. Modalidades: venta, préstamo, ambas.';

create index if not exists listings_seller_idx    on public.listings(seller_id);
create index if not exists listings_book_idx      on public.listings(book_id);
create index if not exists listings_status_idx    on public.listings(status);
create index if not exists listings_modality_idx  on public.listings(modality);
create index if not exists listings_location_idx  on public.listings using gist(location);

create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────
-- Función: listings_within_radius
-- Busca publicaciones activas dentro de N km
-- ─────────────────────────────────────────────
create or replace function public.listings_within_radius(
  lat    double precision,
  lng    double precision,
  radius_km double precision default 10
)
returns setof public.listings
language sql
stable
as $$
  select *
  from public.listings
  where status = 'active'
    and location is not null
    and st_dwithin(
      location::geography,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
  order by location <-> st_setsrid(st_makepoint(lng, lat), 4326)::geography;
$$;

-- ─────────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────────
alter table public.users    enable row level security;
alter table public.books    enable row level security;
alter table public.listings enable row level security;

-- users: cada uno ve y edita su propio perfil; todos pueden ver perfiles
create policy "Perfiles visibles para todos"
  on public.users for select using (true);

create policy "Usuario edita su propio perfil"
  on public.users for update using (auth.uid() = id);

-- books: lectura pública, inserción para autenticados
create policy "Libros visibles para todos"
  on public.books for select using (true);

create policy "Autenticados pueden insertar libros"
  on public.books for insert with check (auth.uid() is not null);

create policy "Creador puede actualizar libro"
  on public.books for update using (auth.uid() = created_by);

-- listings: lectura pública, CRUD solo para el dueño
create policy "Publicaciones activas visibles para todos"
  on public.listings for select using (status = 'active' or auth.uid() = seller_id);

create policy "Autenticados pueden crear publicaciones"
  on public.listings for insert with check (auth.uid() = seller_id);

create policy "Vendedor puede actualizar su publicación"
  on public.listings for update using (auth.uid() = seller_id);

create policy "Vendedor puede eliminar su publicación"
  on public.listings for delete using (auth.uid() = seller_id);

-- ─────────────────────────────────────────────
-- Datos de ejemplo (seed)
-- ─────────────────────────────────────────────
-- Descomentá para insertar datos de prueba:
/*
insert into public.books (isbn, title, author, genre, published_year) values
  ('9789500728249', 'Ficciones', 'Jorge Luis Borges', 'Cuentos', 1944),
  ('9789876545556', 'El túnel', 'Ernesto Sabato', 'Novela', 1948),
  ('9789504912613', 'Rayuela', 'Julio Cortázar', 'Novela', 1963);
*/
