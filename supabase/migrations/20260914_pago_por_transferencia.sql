-- Pago por transferencia, como alternativa a MercadoPago.
--
-- Nace de un caso concreto: lo que entra a la cuenta de MercadoPago de Vero
-- queda abonando deudas antes de que ella lo vea, así que para SUS libros el
-- pago directo es la diferencia entre cobrar y no cobrar. Desconectar
-- MercadoPago no servía: `lib/product-feed.ts` excluye del feed de Google
-- Shopping a todo vendedor sin MP, y eso le sacaba ~200 libros de la vitrina.
--
-- Con esto la venta sigue ocurriendo DENTRO del sitio: queda la orden, queda el
-- registro y sigue contando para la tasa de captura, que es la métrica del
-- negocio. Solo cambia por dónde viaja la plata.
--
-- Es por vendedor y apagado por defecto: nadie lo ve salvo a quien se le active.

alter table public.users
  add column if not exists acepta_transferencia boolean not null default false,
  add column if not exists datos_transferencia text;

comment on column public.users.acepta_transferencia is
  'Si true, el checkout ofrece pagar por transferencia además de MercadoPago.';
comment on column public.users.datos_transferencia is
  'Datos bancarios en texto libre, tal como el vendedor quiere que los vea el comprador. Se muestran solo después de confirmar el pedido.';

-- Cómo se pagó cada orden. Las que ya existen son todas de MercadoPago.
alter table public.orders
  add column if not exists payment_method text not null default 'mercadopago';

alter table public.orders
  drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('mercadopago', 'transfer'));

comment on column public.orders.payment_method is
  'mercadopago = pago online con split. transfer = transferencia directa al vendedor, que la confirma a mano desde Mis Ventas.';

create index if not exists orders_payment_method_idx
  on public.orders (payment_method)
  where payment_method <> 'mercadopago';
