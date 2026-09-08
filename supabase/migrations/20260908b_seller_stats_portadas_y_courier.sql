-- Dos correcciones sobre seller_stats, aplicadas el 08-09-2026 (paso d).
--
-- 1. El top 3 de portadas ordenaba solo por visitas, y las fichas SIN imagen que
--    tienen visitas se colaban: en el home se veían como un placeholder de texto.
--    Libro de Ocasión tiene 40 activos sin portada de 1.712 y le tocaban a él.
--    Ahora manda primero si hay imagen real (foto propia o portada de la obra).
--
-- 2. `courier_habitual`: la página pública de tienda mostraba el courier leyendo
--    `shipments`, pero esa tabla es privada por RLS (solo el vendedor y el
--    comprador del bundle). Para un visitante anónimo la consulta volvía vacía y
--    la línea no aparecía nunca. Se denormaliza al agregado, que sí es público.

alter table public.seller_stats
  add column if not exists courier_habitual text;

comment on column public.seller_stats.courier_habitual is
  'Courier del último envío real. Vive acá porque shipments es privado por RLS y la página pública de tienda no puede leerlo.';

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
  courier as (
    select distinct on (s.seller_id) s.seller_id, s.courier
    from public.shipments s
    where s.courier is not null
      and (p_seller_id is null or s.seller_id = p_seller_id)
    order by s.seller_id, s.created_at desc
  ),
  vistas as (
    select l.seller_id,
           l.id as listing_id,
           count(pv.id) as vistas,
           l.created_at,
           (l.cover_image_url is not null or b.cover_url is not null) as tiene_portada
    from public.listings l
    join public.books b on b.id = l.book_id
    left join public.page_views pv
           on pv.listing_id = l.id
          and pv.created_at >= now() - interval '90 days'
          and coalesce(pv.user_agent, '') !~* '(bot|crawl|spider|slurp|facebookexternalhit|meta-external|headless|python-requests|curl|wget|preview)'
    where l.status = 'active'
      and (p_seller_id is null or l.seller_id = p_seller_id)
    group by l.seller_id, l.id, l.created_at, l.cover_image_url, b.cover_url
  ),
  top3 as (
    select seller_id, array_agg(listing_id order by rn) as ids
    from (
      select seller_id, listing_id,
             row_number() over (partition by seller_id
                                order by tiene_portada desc, vistas desc, created_at desc) as rn
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
           c.courier                                              as courier_habitual,
           coalesce(t.ids, '{}'::uuid[])                          as top_listing_ids,
           round(
             coalesce(s.paid_90d, 0) * 3
             + least(coalesce(a.n, 0), 250) / 50.0
             + coalesce(rv.prom, 0) * coalesce(rv.n, 0)
           , 2)                                                   as trust_score,
           (v.mp
            and coalesce(s.paid_90d, 0) >= 1
            and coalesce(a.n, 0) >= 5
            and not v.bloqueado
            and coalesce(v.username, '') <> 'vero')               as is_trusted
    from vendedores v
    left join ventas  s  on s.seller_id  = v.id
    left join activos a  on a.seller_id  = v.id
    left join resenas rv on rv.seller_id = v.id
    left join courier c  on c.seller_id  = v.id
    left join top3    t  on t.seller_id  = v.id
  )
  insert into public.seller_stats as ss (
    seller_id, paid_90d, delivered_90d, paid_total, active_listings,
    mp_connected, shipit_auto_enabled, reviews_count, reviews_avg,
    last_sale_at, courier_habitual, top_listing_ids, trust_score, is_trusted, updated_at
  )
  select seller_id, paid_90d, delivered_90d, paid_total, active_listings,
         mp, shipit_auto, reviews_count, reviews_avg,
         last_sale_at, courier_habitual, top_listing_ids, trust_score, is_trusted, now()
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
    courier_habitual    = excluded.courier_habitual,
    top_listing_ids     = excluded.top_listing_ids,
    trust_score         = excluded.trust_score,
    is_trusted          = excluded.is_trusted,
    updated_at          = now();

  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

revoke execute on function public.refresh_seller_stats(uuid) from public, anon, authenticated;
