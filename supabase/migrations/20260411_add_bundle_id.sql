-- Bundle checkout: agrupa múltiples orders del mismo carrito en una sola
-- transacción MercadoPago. Todas las orders de un bundle comparten bundle_id.

alter table public.orders add column if not exists bundle_id uuid;

create index if not exists idx_orders_bundle on public.orders(bundle_id);
