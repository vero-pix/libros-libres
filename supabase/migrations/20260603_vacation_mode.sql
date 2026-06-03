-- Modo vacaciones para vendedores.
-- Cuando on_vacation = true, sus libros siguen VISIBLES pero no se pueden
-- comprar ni agregar al carrito; el perfil y la ficha muestran un aviso.
-- Pedido por Felipe Lazo (Libros De La Buhardilla, 1 jun 2026).

alter table public.users
  add column if not exists on_vacation boolean not null default false;

-- mensaje opcional con fecha de regreso ("Vuelvo el 15 de junio")
alter table public.users
  add column if not exists vacation_message text;
