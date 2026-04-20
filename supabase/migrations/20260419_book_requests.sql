-- Economía inversa: los compradores piden libros que NO están en el catálogo.
-- Los vendedores ven la demanda y publican si tienen el libro.
-- 19 abril 2026.

create table if not exists public.book_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  isbn text,
  notes text,
  -- Contacto opcional de quien pide (privado, no se muestra público)
  requester_name text,
  requester_email text,
  requester_whatsapp text,
  requester_user_id uuid references public.users(id) on delete set null,
  -- Lifecycle
  fulfilled boolean not null default false,
  fulfilled_listing_id uuid references public.listings(id) on delete set null,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists book_requests_created_at_idx on public.book_requests (created_at desc);
create index if not exists book_requests_fulfilled_idx on public.book_requests (fulfilled) where fulfilled = false;

alter table public.book_requests enable row level security;

-- Leer público solo los campos safe (sin datos de contacto)
-- A nivel policy dejamos lectura abierta a all, la API se encarga de filtrar columnas.
drop policy if exists "book_requests_public_read" on public.book_requests;
create policy "book_requests_public_read" on public.book_requests
  for select using (true);

-- Insertar: cualquiera puede pedir un libro (no requiere login)
drop policy if exists "book_requests_public_insert" on public.book_requests;
create policy "book_requests_public_insert" on public.book_requests
  for insert with check (true);

-- Update: solo admin (marcar fulfilled, por ejemplo)
drop policy if exists "book_requests_admin_update" on public.book_requests;
create policy "book_requests_admin_update" on public.book_requests
  for update using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );
