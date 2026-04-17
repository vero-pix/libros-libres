-- ═══════════════════════════════════════════════════════════════
-- Destacados top 10 + Coleccionables / Ediciones especiales
-- ═══════════════════════════════════════════════════════════════

-- 1. Columna para controlar el orden de los destacados
alter table public.listings
  add column if not exists featured_rank int;

-- 2. Columna para marcar ejemplares de colección / ediciones especiales
--    (propiedad del ejemplar físico, no del libro en abstracto)
alter table public.listings
  add column if not exists is_collectible boolean not null default false;

create index if not exists listings_collectible_idx
  on public.listings (is_collectible)
  where is_collectible = true;

-- 3. Limpiar featured actuales que no entran al nuevo top 10
update public.listings set featured = false, featured_rank = null where id in (
  'efb54ba3-f0aa-4eba-b82f-6a5da4b27c85', -- La puerta en el muro (H.G. Wells)
  'f20c37ae-619f-49e8-96a9-4a9621d398c9', -- Testimonio de un cacique mapuche
  '192117bc-7020-41d8-ba9a-ebb0ed1f0059', -- Oskar Kokoschka
  '576624c7-4021-4284-8716-4d1fda84acd4', -- Magallanes En Su Primer Centenario
  '19448795-ef3e-4283-b733-0efa6279a09a', -- El cardenal Napellus (Meyrink)
  '11dfd0a2-6679-4f49-acff-99251bb49a49', -- Auguste Rodin Cuadernos Eróticos
  '4d6ff005-21f3-4867-bae4-e68578e7ebc3', -- Bartleby el escribiente
  'd0d6c3f9-3050-4856-a127-4017ff34937c', -- Lecciones De Ciencias Ocultas
  '28d7d9c6-dc00-4fb4-8856-e73b18437bc2'  -- Paisaje de Otoño (Padura)
);

-- 4. Marcar los 10 destacados con orden
update public.listings set featured = true, featured_rank = 1  where id = 'bfead562-657b-4daa-b989-dc8dd6b94f64'; -- Poemas y Antipoemas (Parra)
update public.listings set featured = true, featured_rank = 2  where id = 'e23348d2-ad23-4446-a7a2-15dff9a28a1d'; -- Donde van a morir los elefantes (Donoso)
update public.listings set featured = true, featured_rank = 3  where id = '59fa0351-8a8c-46ec-ab07-dbcb121cfe37'; -- El Aleph (Borges)
update public.listings set featured = true, featured_rank = 4  where id = 'a3d2b63e-e493-4027-a45b-f2730e784d17'; -- El General en su Laberinto (GGM)
update public.listings set featured = true, featured_rank = 5  where id = '3973af2c-c84d-411d-98e8-d7f8d4a941cc'; -- Conversación en la Catedral I (Vargas Llosa)
update public.listings set featured = true, featured_rank = 6  where id = '60eb000b-5a57-416a-b978-025dc5d10a39'; -- La Región Más Transparente (Fuentes)
update public.listings set featured = true, featured_rank = 7  where id = '6a6f655b-fd11-4742-982a-5ee5035e23ee'; -- El fantasma de Canterville (Wilde)
update public.listings set featured = true, featured_rank = 8  where id = '4f4e3123-5f21-45d5-ae45-522551c863ad'; -- La vida está en otra parte (Kundera)
update public.listings set featured = true, featured_rank = 9  where id = 'e0e5ae06-00bb-4f74-8ece-98caf2137255'; -- La Letra E (Monterroso)
update public.listings set featured = true, featured_rank = 10 where id = '27bfafef-b8f5-4bbc-9a82-db0a4943da36'; -- Libertad (Franzen)

-- 5. Marcar el primer coleccionable: Parra 1972, edición Nascimento
update public.listings
set is_collectible = true
where id = 'bfead562-657b-4daa-b989-dc8dd6b94f64';
