-- Refresco de seller_stats. Aplicada el 07-09-2026 (paso b de
-- docs/prompts/librerias-confianza-resenas.md).
--
-- Todo el cálculo ocurre en la base: page_views tiene millones de filas y
-- traerla a JS por vendedor es justo lo que costó IO esta semana.
-- p_seller_id null = todos; con id = solo ese (lo usa el webhook tras una venta
-- para que el contador no quede viejo).
create or replace function public.refresh_seller_stats(p_seller_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_filas integer;
begin
  with vendedores as (
    select u.id,
           u.username,
           (u.mercadopago_user_id is not null)          as mp,
           coalesce(u.shipit_auto_enabled, false)       as shipit_auto,
           coalesce(u.featured_seller_blocked, false)   as bloqueado
    from public.users u
    where p_seller_id is null or u.id = p_seller_id
  ),
  ventas as (
    select o.seller_id,
           count(*) filter (where o.status in ('paid','delivered')
                              and o.created_at >= now() - interval '90 days') as paid_90d,
           count(*) filter (where o.status = 'delivered'
                              and o.created_at >= now() - interval '90 days') as delivered_90d,
           count(*) filter (where o.status in ('paid','delivered'))           as paid_total,
           max(o.created_at) filter (where o.status in ('paid','delivered'))  as last_sale_at
    from public.orders o
    where p_seller_id is null or o.seller_id = p_seller_id
    group by o.seller_id
  ),
  activos as (
    select l.seller_id, count(*) as n
    from public.listings l
    where l.status = 'active'
      and (p_seller_id is null or l.seller_id = p_seller_id)
    group by l.seller_id
  ),
  resenas as (
    select r.seller_id, count(*) as n, round(avg(r.rating), 2) as prom
    from public.reviews r
    where r.hidden_at is null
      and r.seller_id is not null
      and (p_seller_id is null or r.seller_id = p_seller_id)
    group by r.seller_id
  ),
  -- Los 3 libros activos más vistos. Se filtran los bots por user_agent: fueron
  -- el 64% del tráfico en agosto y sin este filtro el top lo decide un crawler.
  vistas as (
    select l.seller_id, l.id as listing_id, count(pv.id) as vistas, l.created_at
    from public.listings l
    left join public.page_views pv
           on pv.listing_id = l.id
          and pv.created_at >= now() - interval '90 days'
          and coalesce(pv.user_agent, '') !~* '(bot|crawl|spider|slurp|facebookexternalhit|meta-external|headless|python-requests|curl|wget|preview)'
    where l.status = 'active'
      and (p_seller_id is null or l.seller_id = p_seller_id)
    group by l.seller_id, l.id, l.created_at
  ),
  -- Mediana de dias entre publicar y vender. Ver el comentario de la columna:
  -- "1 venta" resta, "vendio en 3 dias" suma. Se pide un minimo de 2 ventas
  -- porque con una sola no hay mediana, hay anecdota.
  rapidez as (
    select o.seller_id,
           percentile_cont(0.5) within group (
             order by (o.created_at::date - l.created_at::date)
           )::integer as dias
    from public.orders o
    join public.listings l on l.id = o.listing_id
    where o.status in ('paid','delivered')
      and o.created_at >= now() - interval '180 days'
      and o.created_at::date >= l.created_at::date
      and (p_seller_id is null or o.seller_id = p_seller_id)
    group by o.seller_id
    having count(*) >= 2
  ),
  top3 as (
    select seller_id, array_agg(listing_id order by rn) as ids
    from (
      select seller_id, listing_id,
             row_number() over (partition by seller_id
                                order by vistas desc, created_at desc) as rn
      from vistas
    ) x
    where rn <= 3
    group by seller_id
  ),
  calculo as (
    select v.id as seller_id,
           coalesce(s.paid_90d, 0)                                as paid_90d,
           coalesce(s.delivered_90d, 0)                           as delivered_90d,
           coalesce(s.paid_total, 0)                              as paid_total,
           coalesce(a.n, 0)                                       as active_listings,
           v.mp, v.shipit_auto,
           coalesce(rv.n, 0)                                      as reviews_count,
           rv.prom                                                as reviews_avg,
           s.last_sale_at,
           coalesce(t.ids, '{}'::uuid[])                          as top_listing_ids,
           rap.dias                                               as dias_hasta_venta,
           -- C2, con el catálogo topado en 250 (5 puntos) para que el tamaño no
           -- domine el orden: sin el tope, 1.713 libros valen 34 puntos.
           round(
             coalesce(s.paid_90d, 0) * 3
             + least(coalesce(a.n, 0), 250) / 50.0
             + coalesce(rv.prom, 0) * coalesce(rv.n, 0)
           , 2)                                                   as trust_score,
           -- C1 de lanzamiento: NO exige delivered todavía.
           (v.mp
            and coalesce(s.paid_90d, 0) >= 1
            and coalesce(a.n, 0) >= 5
            and not v.bloqueado
            and coalesce(v.username, '') <> 'vero')               as is_trusted
    from vendedores v
    left join ventas  s  on s.seller_id  = v.id
    left join activos a  on a.seller_id  = v.id
    left join resenas rv on rv.seller_id = v.id
    left join top3    t  on t.seller_id  = v.id
    left join rapidez rap on rap.seller_id = v.id
  )
  insert into public.seller_stats as ss (
    seller_id, paid_90d, delivered_90d, paid_total, active_listings,
    mp_connected, shipit_auto_enabled, reviews_count, reviews_avg,
    last_sale_at, top_listing_ids, trust_score, is_trusted, dias_hasta_venta, updated_at
  )
  select seller_id, paid_90d, delivered_90d, paid_total, active_listings,
         mp, shipit_auto, reviews_count, reviews_avg,
         last_sale_at, top_listing_ids, trust_score, is_trusted, dias_hasta_venta, now()
  from calculo
  on conflict (seller_id) do update set
    paid_90d            = excluded.paid_90d,
    delivered_90d       = excluded.delivered_90d,
    paid_total          = excluded.paid_total,
    active_listings     = excluded.active_listings,
    mp_connected        = excluded.mp_connected,
    shipit_auto_enabled = excluded.shipit_auto_enabled,
    reviews_count       = excluded.reviews_count,
    reviews_avg         = excluded.reviews_avg,
    last_sale_at        = excluded.last_sale_at,
    top_listing_ids     = excluded.top_listing_ids,
    trust_score         = excluded.trust_score,
    is_trusted          = excluded.is_trusted,
    dias_hasta_venta    = excluded.dias_hasta_venta,
    updated_at          = now();

  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

comment on function public.refresh_seller_stats(uuid) is
  'Recalcula seller_stats. Sin argumento: todos los vendedores. Con uuid: solo ese. Devuelve filas escritas.';

-- Solo el service_role la ejecuta: escribe una tabla que el público solo lee.
revoke execute on function public.refresh_seller_stats(uuid) from public, anon, authenticated;
