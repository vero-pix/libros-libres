-- Cifras precalculadas del sitio (07-09-2026).
--
-- La home hacía un count(*) exacto de toda page_views cada 5 minutos para el
-- contador de visitas: un recorrido completo de la tabla más grande del
-- proyecto, por una cifra que cambia poco. Ahora el cron diario
-- (app/api/cron/daily-summary) la calcula una vez al día y la guarda acá.
-- Solo la escribe y lee el service role: RLS activa sin policies.
create table if not exists public.site_stats (
  key        text primary key,
  value      bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.site_stats enable row level security;

comment on table public.site_stats is
  'Cifras precalculadas (p. ej. page_views_total). Las escribe el cron diario; la home las lee en vez de contar.';
