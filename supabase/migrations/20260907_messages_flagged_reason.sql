-- Mensajería: registro de mensajes con señales de pago por fuera (teléfono,
-- transferencia, efectivo). El mensaje se envía igual; la columna solo deja
-- constancia para poder medir cuánto se coordina fuera de la plataforma.
-- Valores: 'telefono' | 'transferencia' | 'efectivo' | null.
-- Aplicar en el SQL Editor de Supabase.
alter table public.messages
  add column if not exists flagged_reason text;

create index if not exists messages_flagged_idx
  on public.messages (flagged_reason, created_at)
  where flagged_reason is not null;
