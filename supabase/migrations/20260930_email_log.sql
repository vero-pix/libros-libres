-- Registro de cada correo que sale del sitio (30-09-2026).
--
-- Con Resend en plan gratis la key es de solo envío: no hay forma de saber qué
-- salió, qué rebotó por cuota ni a quién. Desde ahora lib/email.ts escribe una
-- fila por intento, salga por Gmail (Workspace) o por Resend de respaldo.
--
-- Guarda destinatario y asunto, NO el cuerpo: el HTML trae datos de pedidos y
-- direcciones, y para eso está la copia en Enviados de hola@.

create table if not exists public.email_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  proveedor   text not null check (proveedor in ('gmail', 'resend', 'ninguno')),
  ok          boolean not null,
  to_email    text not null,
  subject     text not null,
  provider_id text,
  error       text
);

create index if not exists email_log_created_at_idx on public.email_log (created_at desc);

-- Solo el service role escribe y lee. Sin políticas = nadie más.
alter table public.email_log enable row level security;
revoke all on public.email_log from anon, authenticated;
