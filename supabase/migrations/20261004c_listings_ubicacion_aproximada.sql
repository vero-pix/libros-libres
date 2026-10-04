-- 04-10-2026 — La ficha, el mapa y la búsqueda muestran la ubicación
-- APROXIMADA del vendedor; la exacta queda solo para el servidor.
--
-- ORDEN: primero el deploy del código (lee `listing_locations` y, si no
-- existe, cae a `listings.address`), DESPUÉS esta migración. Al revés, los
-- envíos cotizarían desde la dirección del perfil en vez de la del libro
-- mientras el código nuevo no esté arriba.
--
-- Diseño (por qué así y no una vista):
--   `listings` se lee con `select("*")` y con `address`/`latitude`/`longitude`
--   desde decenas de lugares (tarjeta, ficha, mapa, búsqueda, landings de
--   ciudad, JSON-LD, feed, sitemap, listings_within_radius). Revocar el SELECT
--   de esas columnas rompería cada `select("*")` hecho con la clave pública y
--   obligaría a cambiar todas las consultas. En vez de eso, las columnas
--   públicas pasan a guardar lo aproximado y lo exacto se mueve a
--   `listing_locations`, una tabla sin grants para anon/authenticated:
--     - listings.address  → "Comuna, Región ..., Chile" (sin calle ni código
--       postal; el formato que ya usaba la carga masiva y que entienden
--       comunaDesdeAddress() y extractCommune()).
--     - listings.latitude / longitude → redondeadas a 2 decimales (~1 km).
--       `location` es columna generada desde ellas, así que también queda
--       aproximada, y listings_within_radius sigue funcionando igual.
--   Un trigger BEFORE INSERT/UPDATE hace la separación en cada escritura, así
--   que /publish (que inserta desde el navegador), /api/perfil/ubicacion, el
--   importador y los scripts no cambian.
--
-- Idempotente: se puede correr dos veces. El backfill usa ON CONFLICT DO
-- NOTHING, así que una segunda corrida NO pisa lo exacto con lo aproximado.

-- 1. Dirección pública a partir de la exacta ─────────────────────────────────
-- La comuna es el tramo anterior al que dice "Región" (misma regla que
-- lib/comuna.ts → comunaDesdeAddress). NO es split(',')[2]: la carga masiva
-- guarda "Comuna, Región" y ahí el índice cae en la región.
create or replace function public.listing_direccion_aproximada(p_address text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  partes text[];
  ri int;
  i int;
begin
  if p_address is null then
    return null;
  end if;

  -- Tramos sin espacios sobrantes, sin códigos postales (5+ dígitos) y sin
  -- tramos vacíos.
  select coalesce(array_agg(t order by n), '{}')
    into partes
    from (
      select n, btrim(regexp_replace(x, '\s*\d{5,}', '', 'g')) as t
        from unnest(string_to_array(p_address, ',')) with ordinality as u(x, n)
    ) s
   where t <> '';

  if coalesce(array_length(partes, 1), 0) = 0 then
    return null;
  end if;

  select min(k) into ri
    from generate_subscripts(partes, 1) as k
   where partes[k] ~* 'regi[oó]n';

  if ri is not null then
    -- Desde la comuna (el tramo antes de "Región") en adelante. Si ese tramo
    -- trae números es una calle, no una comuna: se parte desde la región.
    if ri > 1 and partes[ri - 1] !~ '\d' then
      return array_to_string(partes[ri - 1:], ', ');
    end if;
    return array_to_string(partes[ri:], ', ');
  end if;

  -- Sin "Región" (ej. "Los Muermos, Los Lagos"): se botan los tramos iniciales
  -- que traen números, que son calle, número o depto.
  i := 1;
  while i <= array_length(partes, 1) and partes[i] ~ '\d' loop
    i := i + 1;
  end loop;
  if i > array_length(partes, 1) then
    return 'Chile';
  end if;
  return array_to_string(partes[i:], ', ');
end;
$$;

-- 2. Tabla privada ───────────────────────────────────────────────────────────
create table if not exists public.listing_locations (
  listing_id uuid primary key
    references public.listings(id) on delete cascade
    deferrable initially deferred,  -- el trigger BEFORE INSERT escribe antes que exista la fila
  seller_id  uuid,
  address    text,
  latitude   double precision,
  longitude  double precision,
  updated_at timestamptz not null default now()
);

create index if not exists listing_locations_seller_idx on public.listing_locations (seller_id);
create index if not exists listing_locations_address_idx on public.listing_locations (address);

alter table public.listing_locations enable row level security;
-- Sin policies a propósito: solo service role (que se salta RLS) la lee.
revoke all on public.listing_locations from anon, authenticated, public;
grant select, insert, update, delete on public.listing_locations to service_role;

-- 3. Trigger que separa exacto / aproximado ──────────────────────────────────
-- SECURITY DEFINER porque /publish inserta con la sesión del vendedor, que no
-- tiene permisos sobre listing_locations.
create or replace function public.listings_separar_ubicacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prev public.listing_locations%rowtype;
  ex_address text;
  ex_lat double precision;
  ex_lng double precision;
begin
  if tg_op = 'UPDATE' then
    if new.address   is not distinct from old.address
       and new.latitude  is not distinct from old.latitude
       and new.longitude is not distinct from old.longitude
       and new.seller_id is not distinct from old.seller_id then
      return new;  -- editar el libro (precio, fotos…) no toca la ubicación
    end if;
    select * into prev from public.listing_locations where listing_id = new.id;
  end if;

  -- Campo por campo: lo que cambió en este UPDATE es lo nuevo exacto; lo que
  -- no cambió se conserva de la tabla privada (si no, un UPDATE que solo
  -- cambia la dirección guardaría como "exactas" las coordenadas redondeadas).
  if tg_op = 'INSERT' or new.address is distinct from old.address then
    ex_address := new.address;
  else
    ex_address := coalesce(prev.address, new.address);
  end if;
  if tg_op = 'INSERT' or new.latitude is distinct from old.latitude then
    ex_lat := new.latitude;
  else
    ex_lat := coalesce(prev.latitude, new.latitude);
  end if;
  if tg_op = 'INSERT' or new.longitude is distinct from old.longitude then
    ex_lng := new.longitude;
  else
    ex_lng := coalesce(prev.longitude, new.longitude);
  end if;

  insert into public.listing_locations as ll (listing_id, seller_id, address, latitude, longitude, updated_at)
  values (new.id, new.seller_id, ex_address, ex_lat, ex_lng, now())
  on conflict (listing_id) do update
    set seller_id = excluded.seller_id,
        address   = excluded.address,
        latitude  = excluded.latitude,
        longitude = excluded.longitude,
        updated_at = now();

  new.address   := public.listing_direccion_aproximada(ex_address);
  new.latitude  := round(ex_lat::numeric, 2)::double precision;
  new.longitude := round(ex_lng::numeric, 2)::double precision;
  return new;
end;
$$;

revoke all on function public.listings_separar_ubicacion() from public, anon, authenticated;

-- Se saca antes del backfill para que el UPDATE masivo no lo dispare (lo
-- dispararía con la dirección ya aproximada y la guardaría como exacta).
drop trigger if exists listings_separar_ubicacion on public.listings;

-- 4. Backfill ────────────────────────────────────────────────────────────────
-- Todas las filas, de cualquier estado (vendidas y pausadas también son
-- legibles por su dueño y las completadas por todos). En SQL no hay techo de
-- 1000 filas.
insert into public.listing_locations (listing_id, seller_id, address, latitude, longitude)
select id, seller_id, address, latitude, longitude
  from public.listings
on conflict (listing_id) do nothing;

-- Sin tocar updated_at: el backfill no es una edición del vendedor.
alter table public.listings disable trigger listings_updated_at;

update public.listings l
   set address   = public.listing_direccion_aproximada(ll.address),
       latitude  = round(ll.latitude::numeric, 2)::double precision,
       longitude = round(ll.longitude::numeric, 2)::double precision
  from public.listing_locations ll
 where ll.listing_id = l.id
   and (l.price is null or l.price >= 1000)  -- 2 filas viejas bajo el mínimo (CHECK NOT VALID) hacían fallar todo el UPDATE
   and (l.address   is distinct from public.listing_direccion_aproximada(ll.address)
     or l.latitude  is distinct from round(ll.latitude::numeric, 2)::double precision
     or l.longitude is distinct from round(ll.longitude::numeric, 2)::double precision);

alter table public.listings enable trigger listings_updated_at;

create trigger listings_separar_ubicacion
  before insert or update of address, latitude, longitude, seller_id
  on public.listings
  for each row
  execute function public.listings_separar_ubicacion();

notify pgrst, 'reload schema';

-- 5. Verificación (correr aparte; las tres deberían dar 0) ───────────────────
-- select count(*) from listings where status = 'active' and split_part(address, ',', 1) ~ '\d';
-- select count(*) from listings where status = 'active' and latitude is not null
--    and latitude <> round(latitude::numeric, 2)::double precision;
-- select count(*) from listings l left join listing_locations ll on ll.listing_id = l.id
--  where ll.listing_id is null;
