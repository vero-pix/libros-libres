-- Orders table for tracking purchases and payments
create type order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
create type shipping_speed as enum ('standard', 'express');

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.users(id),
  seller_id uuid not null references public.users(id),

  -- Pricing breakdown
  book_price numeric(10,2) not null check (book_price >= 0),
  shipping_cost numeric(10,2) not null default 0 check (shipping_cost >= 0),
  service_fee numeric(10,2) not null default 0 check (service_fee >= 0),
  total numeric(10,2) not null check (total >= 0),

  -- Status
  status order_status not null default 'pending',

  -- Shipping
  shipping_speed shipping_speed not null default 'standard',
  courier text,
  tracking_code text,
  buyer_address text,
  buyer_latitude double precision,
  buyer_longitude double precision,

  -- MercadoPago
  mercadopago_preference_id text,
  mercadopago_payment_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_orders_buyer on public.orders(buyer_id);
create index idx_orders_seller on public.orders(seller_id);
create index idx_orders_listing on public.orders(listing_id);
create index idx_orders_status on public.orders(status);

-- RLS
alter table public.orders enable row level security;

-- Buyers can see their own orders
create policy "Buyers see own orders"
  on public.orders for select
  using (auth.uid() = buyer_id);

-- Sellers can see orders for their listings
create policy "Sellers see their orders"
  on public.orders for select
  using (auth.uid() = seller_id);

-- Authenticated users can create orders (as buyer)
create policy "Buyers create orders"
  on public.orders for insert
  with check (auth.uid() = buyer_id);

-- Only system (via service role) updates orders (webhook)
-- No update policy for anon/authenticated — webhook uses service_role key
