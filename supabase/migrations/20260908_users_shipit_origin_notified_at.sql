-- D1 revisada (07-09-2026): gong a Vero cuando un vendedor fuera de la RM sin
-- origen conecta MercadoPago o recibe una compra con courier. Esta columna
-- evita repetir el gong más de una vez al día por vendedor. Aplicada el 07-09.
alter table public.users add column if not exists shipit_origin_notified_at timestamptz;
comment on column public.users.shipit_origin_notified_at is
  'Último gong a Vero pidiendo crear el origen Shipit de este vendedor (fuera de la RM). Máximo uno al día.';
