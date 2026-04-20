-- Ubicación del solicitante. Permite que los vendedores vean "alguien cerca
-- está buscando esto" — la economía inversa se activa mejor con proximidad.
-- 19 abril 2026.

alter table public.book_requests
  add column if not exists requester_location text;

-- Index por ubicación para búsquedas futuras (listar por ciudad/región)
create index if not exists book_requests_location_idx
  on public.book_requests (requester_location)
  where requester_location is not null and fulfilled = false;
