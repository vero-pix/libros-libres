-- Formulario de contacto: los mensajes que no pasan la validación (menos de 20
-- caracteres o sin espacios) se guardan igual, con el motivo, para poder ver qué
-- se está filtrando. No mandan correo y el panel de admin no los muestra.
-- Aplicar en el SQL Editor de Supabase.
alter table public.contact_messages
  add column if not exists discarded_reason text;

create index if not exists idx_contact_messages_discarded
  on public.contact_messages (discarded_reason)
  where discarded_reason is not null;
