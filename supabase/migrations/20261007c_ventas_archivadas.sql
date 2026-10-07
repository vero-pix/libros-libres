-- Ventas y carritos archivados por el vendedor en "Mis ventas" (07-10-2026).
--
-- Vero pidió una (x) para sacar de la vista lo que ya no le sirve: ventas
-- entregadas o canceladas, y carritos abandonados que no van a volver. Archivar
-- NO borra la orden ni el carrito: solo deja de mostrarse en Mis ventas.
--
-- `tipo = 'orden'`   → `ref` es orders.id
-- `tipo = 'carrito'` → `ref` es el buyer_id del carrito (un carrito por comprador)
--
-- Un carrito archivado vuelve a aparecer si el comprador agrega otro libro del
-- vendedor después de `created_at` (se compara en app/(main)/mis-ventas).
--
-- Se lee y escribe solo con service role (/api/ventas/archivar y la página),
-- siempre filtrando por el seller_id de la sesión. Mismo patrón que email_log.
--
-- Se aplica a mano en el SQL Editor. El código funciona sin esta tabla: la (x)
-- no aparece y Mis ventas se ve como antes.

create table if not exists public.ventas_archivadas (
  seller_id  uuid not null references public.users(id) on delete cascade,
  tipo       text not null check (tipo in ('orden', 'carrito')),
  ref        text not null,
  created_at timestamptz not null default now(),
  primary key (seller_id, tipo, ref)
);

-- Solo el service role escribe y lee. Sin políticas = nadie más.
alter table public.ventas_archivadas enable row level security;
revoke all on public.ventas_archivadas from anon, authenticated;
