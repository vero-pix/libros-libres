-- Historial de slugs de una publicación (21-09-2026).
--
-- Hasta hoy, editar el título de un libro NO regeneraba su slug: la URL se
-- quedaba con el título anterior. Pía Cortés publicó con "Publicar uno igual",
-- corrigió los títulos, y "Nosotros en la luna" quedó viviendo en
-- /libro/pia.cortes.olivares/colgarse-de-la-luna-elisabet-benavent.
--
-- Ahora el slug se regenera al cambiar el título, y el anterior se guarda acá
-- para redirigir 301 — si no, cada corrección de título rompería los enlaces
-- ya compartidos y lo que Google tenga indexado.
create table if not exists listing_slug_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  -- Único GLOBAL, igual que listings.slug: un slug viejo no puede quedar
  -- disponible para otra publicación, porque seguiría redirigiendo al de antes.
  slug text not null unique,
  created_at timestamptz not null default now()
);

comment on table listing_slug_history is
  'Slugs anteriores de una publicación. La ficha los consulta para redirigir 301 a la URL actual. Escribe solo el endpoint de edición (service role).';

create index if not exists listing_slug_history_listing_idx
  on listing_slug_history (listing_id);

alter table listing_slug_history enable row level security;

-- Lectura pública: la ficha resuelve el redirect sin sesión, igual que lee
-- listings. No hay policy de escritura a propósito — solo el service role
-- escribe acá, desde PATCH /api/listings/[id].
drop policy if exists "listing_slug_history es de lectura publica" on listing_slug_history;
create policy "listing_slug_history es de lectura publica"
  on listing_slug_history for select
  using (true);
