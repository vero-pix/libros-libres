-- Reserva de ejemplares al comprar: cierra la venta doble (24-09-2026).
--
-- Antes: crear la orden no reservaba nada, dos compradores podían pagar el
-- mismo ejemplar por MercadoPago, y el pago por transferencia nunca marcaba el
-- libro como vendido. Ver docs_desde_claude/PLAN_IMPORTADOR_LIBRERIAS.md §0.
--
-- La reserva vive en una tabla aparte y NO en columnas de `listings`:
--   · `listings` se lee sin sesión (policy "Publicaciones activas y vendidas
--     visibles para todos"): un `reserved_by` ahí dejaba a la vista quién
--     está comprando qué.
--   · el vendedor tiene UPDATE sobre su fila completa: podría borrar o
--     alargar una reserva ajena.
-- Esta tabla tiene RLS sin políticas: solo la toca service_role, a través de
-- las funciones de abajo.

create table if not exists listing_reservations (
  listing_id     uuid primary key references listings(id) on delete cascade,
  bundle_id      uuid not null,
  buyer_id       uuid not null references users(id) on delete cascade,
  metodo         text not null check (metodo in ('mercadopago', 'transfer')),
  reserved_until timestamptz not null,
  created_at     timestamptz not null default now()
);
create index if not exists listing_reservations_buyer_idx  on listing_reservations (buyer_id);
create index if not exists listing_reservations_bundle_idx on listing_reservations (bundle_id);
alter table listing_reservations enable row level security;

-- Un registro por cobro que no se pudo aplicar porque el ejemplar ya era de
-- otro. `clave` = 'mp:<payment_id>' o 'transfer:<bundle_id>': los reintentos de
-- MercadoPago chocan con el UNIQUE y no generan un segundo aviso.
create table if not exists incidentes_cobro_doble (
  id          uuid primary key default gen_random_uuid(),
  clave       text not null unique,
  bundle_id   uuid not null,
  listing_ids uuid[] not null,
  origen      text not null check (origen in ('mercadopago', 'transfer')),
  resuelto    boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table incidentes_cobro_doble enable row level security;


-- reservar_listings: todo el carrito o nada.
--
-- · Quita duplicados de p_ids antes de contar.
-- · Transferencia: máximo 3 compras por transferencia con reserva vigente por
--   comprador (se cuentan bundles, no libros).
-- · Libera las reservas por MercadoPago que el mismo comprador dejó abiertas en
--   checkouts anteriores (sin pago en curso) y cancela esas órdenes pendientes.
--   Las reservas por transferencia NO se liberan: tienen su plazo y su tope.
-- · Una reserva vigente del MISMO comprador no bloquea: nunca 409 por la propia.
-- · Si falta un solo ejemplar, `raise` revierte todo (también la liberación).
create or replace function reservar_listings(
  p_ids uuid[], p_bundle uuid, p_buyer uuid, p_metodo text, p_minutos int
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[];
  n int;
begin
  select array_agg(distinct x) into v_ids from unnest(p_ids) as x;
  if v_ids is null then
    raise exception 'sin_ids';
  end if;

  if p_metodo = 'transfer' and (
    select count(distinct bundle_id) from listing_reservations
     where buyer_id = p_buyer and metodo = 'transfer' and reserved_until > now()
  ) >= 3 then
    raise exception 'max_transferencias';
  end if;

  with viejas as (
    delete from listing_reservations r
     where r.buyer_id = p_buyer
       and r.metodo = 'mercadopago'
       and r.bundle_id <> p_bundle
       and not exists (
         select 1 from orders o
          where o.bundle_id = r.bundle_id and o.mercadopago_payment_id is not null
       )
    returning r.bundle_id
  )
  update orders
     set status = 'cancelled', updated_at = now()
   where bundle_id in (select bundle_id from viejas)
     and status = 'pending'
     and mercadopago_payment_id is null;

  -- Bloquea los ejemplares contra cambios de estado mientras dura la transacción.
  select count(*) into n from (
    select id from listings where id = any(v_ids) and status = 'active' for update
  ) s;
  if n <> cardinality(v_ids) then
    raise exception 'no_disponible';
  end if;

  insert into listing_reservations as r (listing_id, bundle_id, buyer_id, metodo, reserved_until)
  select x, p_bundle, p_buyer, p_metodo, now() + make_interval(mins => p_minutos)
    from unnest(v_ids) as x
  on conflict (listing_id) do update
     set bundle_id = excluded.bundle_id,
         buyer_id = excluded.buyer_id,
         metodo = excluded.metodo,
         reserved_until = excluded.reserved_until,
         created_at = now()
   where r.reserved_until < now() or r.buyer_id = p_buyer;
  get diagnostics n = row_count;
  if n <> cardinality(v_ids) then
    raise exception 'no_disponible';
  end if;
end $$;


-- liberar_reserva: para los caminos donde el checkout falla después de reservar.
create or replace function liberar_reserva(p_bundle uuid) returns void
language sql security definer set search_path = public as $$
  delete from listing_reservations where bundle_id = p_bundle;
$$;


-- marcar_vendidos: lo llaman el webhook de MercadoPago y "Me llegó la transferencia".
--
-- Marca `completed` solo si el ejemplar está active/paused Y la reserva es de
-- este bundle o no hay reserva vigente de otro. Lo que no se pudo marcar va a
-- `incidentes_cobro_doble`. Devuelve `incidente_nuevo = true` solo la primera
-- vez para esa clave: el aviso de Telegram sale únicamente en ese caso.
create or replace function marcar_vendidos(
  p_bundle uuid, p_ids uuid[], p_clave text, p_origen text
) returns table (incidente_nuevo boolean, conflictos uuid[])
language plpgsql security definer set search_path = public as $$
declare
  v_ids  uuid[];
  v_ok   uuid[];
  v_conf uuid[];
  v_new  boolean := false;
begin
  select array_agg(distinct x) into v_ids from unnest(p_ids) as x;

  with ok as (
    update listings l
       set status = 'completed'
     where l.id = any(v_ids)
       and l.status in ('active', 'paused')
       and not exists (
         select 1 from listing_reservations r
          where r.listing_id = l.id
            and r.bundle_id <> p_bundle
            and r.reserved_until >= now()
       )
    returning l.id
  )
  select coalesce(array_agg(id), '{}') into v_ok from ok;

  delete from listing_reservations where listing_id = any(v_ok) or bundle_id = p_bundle;

  select coalesce(array_agg(x), '{}') into v_conf
    from unnest(v_ids) as x where x <> all(v_ok);

  if cardinality(v_conf) > 0 then
    insert into incidentes_cobro_doble (clave, bundle_id, listing_ids, origen)
    values (p_clave, p_bundle, v_conf, p_origen)
    on conflict (clave) do nothing;
    v_new := found;
  end if;

  return query select v_new, v_conf;
end $$;


revoke execute on function reservar_listings(uuid[], uuid, uuid, text, int) from public, anon, authenticated;
revoke execute on function liberar_reserva(uuid)                            from public, anon, authenticated;
revoke execute on function marcar_vendidos(uuid, uuid[], text, text)        from public, anon, authenticated;
grant  execute on function reservar_listings(uuid[], uuid, uuid, text, int) to service_role;
grant  execute on function liberar_reserva(uuid)                            to service_role;
grant  execute on function marcar_vendidos(uuid, uuid[], text, text)        to service_role;
