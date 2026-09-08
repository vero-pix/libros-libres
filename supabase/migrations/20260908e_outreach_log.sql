-- P16-A (08-09-2026): registro de correos de activación mandados por
-- scripts/outreach_activacion.mjs. Existe para una sola cosa: idempotencia.
-- El script salta a quien ya tenga fila con el mismo (user_id, cohort), así
-- una corrida cortada por el tope diario de Resend (100/día, el digest ya
-- consume ~87) continúa donde quedó sin volver a escribirle a nadie.
create table if not exists public.outreach_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  cohort text not null,
  template text not null,
  sent_at timestamptz not null default now(),
  resend_id text
);

-- La garantía de "una vez por persona y cohorte" vive acá, no en el script.
create unique index if not exists outreach_log_user_cohort_idx
  on public.outreach_log (user_id, cohort);

create index if not exists outreach_log_sent_at_idx on public.outreach_log (sent_at desc);

comment on table public.outreach_log is
  'Correos de activación enviados (P16-A). Solo service role: el script corre fuera de la app.';

-- Nadie desde el navegador. El script usa la service role key, que salta RLS.
alter table public.outreach_log enable row level security;
