-- claim_shipments también toma `in_transit` (14-09-2026).
--
-- Un envío en camino nunca se volvía a consultar: el cron no lo reclamaba, así
-- que ninguno pasaba a `delivered` ni disparaba el correo de reseña. Los cuatro
-- de Libro de Ocasión en `in_transit` tenían su último GET del 9 y 10 de sept.
-- El paso nuevo (pasoEnCamino en app/api/cron/shipments/route.ts) los mira cada
-- 6 horas hasta que Shipit diga `delivered`.

create or replace function public.claim_shipments(max_rows integer default 10)
 returns setof shipments
 language sql
 security definer
 set search_path to 'public'
as $function$
  with candidatos as (
    select id
    from public.shipments
    where status in ('pending', 'created', 'label_ready', 'notified', 'pickup_scheduled', 'in_transit')
      and next_attempt_at <= now()
      and (locked_until is null or locked_until < now())
      and attempts < 5
    order by next_attempt_at
    limit max_rows
    for update skip locked
  )
  update public.shipments s
     set locked_until = now() + interval '5 minutes'
    from candidatos c
   where s.id = c.id
  returning s.*;
$function$;
