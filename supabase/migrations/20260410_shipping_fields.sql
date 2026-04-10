-- Add shipping tracking fields to orders table
-- Needed for Shipit integration: label URL, shipping status, last update timestamp

alter table public.orders
  add column if not exists shipping_status text,
  add column if not exists shipping_label_url text,
  add column if not exists shipping_updated_at timestamptz,
  add column if not exists shipit_order_id bigint;

create index if not exists idx_orders_shipping_status on public.orders(shipping_status);
