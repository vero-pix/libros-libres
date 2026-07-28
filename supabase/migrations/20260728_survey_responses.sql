-- Encuesta a la base de usuarios — 28 julio 2026
--
-- POR QUÉ. Antes de construir el bot de avisos para vendedores hay que saber si
-- alguien lo quiere. Los datos de page_views ya dicen QUÉ se usa (el mapa 12
-- sesiones en 30 días, las solicitudes 224), pero no dicen por qué la gente NO
-- hace algo ni qué falta que todavía no existe. Eso solo se pregunta.
--
-- Dos grupos con preguntas distintas:
--   'vendedor'    → los 71 con libros activos: qué les falta para vender más
--   'no_publico'  → los 138 registrados que nunca publicaron: qué los detuvo
-- El segundo grupo es el 66% de la base y es el que explica la fuga de /publish.
--
-- Modelada sobre 20260419_book_requests.sql, que es el otro formulario público
-- con tabla propia. Diferencia importante: acá el SELECT es solo admin. Las
-- respuestas son opiniones sobre el producto, no contenido público como una
-- solicitud de libro.

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),

  -- Qué cuestionario respondió
  grupo text not null check (grupo in ('vendedor', 'no_publico')),

  -- Quién, si lo sabemos. El correo llega prellenado desde el link, pero la
  -- encuesta no exige login: pedirlo botaría a la mitad.
  user_id uuid references public.users(id) on delete set null,
  email text,

  -- Las de opción múltiple. En jsonb para no migrar la tabla cada vez que se
  -- ajusta una alternativa: { "falta": [...], "conocia": [...], "compraba": "si" }
  respuestas jsonb not null default '{}'::jsonb,

  -- Qué avisos querría recibir. Es la pregunta que decide si el bot se construye
  -- y cuál de los tres avisos vale la pena.
  interes_avisos text[],

  -- Texto libre: lo que no cabía en ninguna alternativa. Suele ser lo mejor.
  falta text,

  created_at timestamptz not null default now()
);

create index if not exists survey_responses_created_at_idx
  on public.survey_responses (created_at desc);
create index if not exists survey_responses_grupo_idx
  on public.survey_responses (grupo);

alter table public.survey_responses enable row level security;

-- Responder: cualquiera, sin login. El link del correo llega sin sesión.
drop policy if exists "survey_public_insert" on public.survey_responses;
create policy "survey_public_insert" on public.survey_responses
  for insert with check (true);

-- Leer: solo admin. Son opiniones sobre el producto, no contenido público.
drop policy if exists "survey_admin_read" on public.survey_responses;
create policy "survey_admin_read" on public.survey_responses
  for select using (public.is_admin());

comment on table public.survey_responses is
  'Respuestas de la encuesta de producto (jul 2026). Insert abierto, lectura solo admin. Se lee con scripts/_encuesta_resultados.mjs.';
