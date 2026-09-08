-- Pieza B, paso 2 de 2: aplicar DESPUÉS de 20260908c.
--
-- Un retiro que no se concreta no puede dejar el envío colgado. Tres cambios:
--
-- 1. `pickup_id`: el id del retiro en Shipit. Sin él no se puede anular cuando
--    el vendedor decide dejar el paquete en la sucursal, y el chofer vuelve a
--    viajar al vacío (fue justo lo que pidió Casa Emunah el 08-09-2026).
-- 2. `claim_shipments` toma también `pickup_scheduled`: hasta ahora el worker
--    dejaba la fila ahí y no la volvía a mirar nunca.
-- 3. `transition_shipment` deja LIMPIAR los campos del retiro. El coalesce
--    original solo permitía escribirlos: al volver a dropoff, la fecha vieja
--    se quedaba pegada y /mis-ventas seguía anunciando un camión que no venía.

alter table public.shipments add column if not exists pickup_id bigint;
alter table public.shipments add column if not exists pickup_dismissed_id bigint;

comment on column public.shipments.pickup_id is
  'Id del retiro en Shipit (last_pickup.id). Necesario para anularlo.';
comment on column public.shipments.pickup_dismissed_id is
  'Retiro que el vendedor descartó al elegir "lo dejo en sucursal". El worker lo ignora: si el DELETE a Shipit no pasó, el retiro sigue vivo en la API y sin esta marca volvería a anunciar un camión que el vendedor ya no quiere.';

-- 2. Claim: pickup_scheduled vuelve al ciclo del worker.
--    pickup_failed queda FUERA a propósito: ahí manda el vendedor, no el cron.
create or replace function public.claim_shipments(max_rows integer default 10)
returns setof public.shipments
language sql
security definer
set search_path = public
as $$
  with candidatos as (
    select id
    from public.shipments
    where status in ('pending', 'created', 'label_ready', 'notified', 'pickup_scheduled')
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
$$;

revoke all on function public.claim_shipments(integer) from public, anon, authenticated;
grant execute on function public.claim_shipments(integer) to service_role;

drop index if exists shipments_status_next_idx;
create index shipments_status_next_idx on public.shipments (status, next_attempt_at)
  where status in ('pending', 'created', 'label_ready', 'notified', 'pickup_scheduled');

-- 3. Transición: `coalesce` escribe pero no borra. Con esto, una clave
--    presente en el patch manda aunque venga en null ({"pickup_date": null}
--    limpia la fecha); una clave ausente deja el valor como estaba.
create or replace function public.transition_shipment(
  p_id    uuid,
  p_from  public.shipment_status,
  p_to    public.shipment_status,
  p_patch jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.shipments
     set status          = p_to,
         shipit_id       = case when p_patch ? 'shipit_id'       then (p_patch->>'shipit_id')::bigint       else shipit_id end,
         courier         = case when p_patch ? 'courier'         then p_patch->>'courier'                   else courier end,
         tracking_number = case when p_patch ? 'tracking_number' then p_patch->>'tracking_number'           else tracking_number end,
         label_path      = case when p_patch ? 'label_path'      then p_patch->>'label_path'                else label_path end,
         real_cost       = case when p_patch ? 'real_cost'       then (p_patch->>'real_cost')::numeric      else real_cost end,
         pickup_date     = case when p_patch ? 'pickup_date'     then (p_patch->>'pickup_date')::date       else pickup_date end,
         pickup_window   = case when p_patch ? 'pickup_window'   then p_patch->>'pickup_window'             else pickup_window end,
         pickup_id       = case when p_patch ? 'pickup_id'       then (p_patch->>'pickup_id')::bigint       else pickup_id end,
         pickup_dismissed_id = case when p_patch ? 'pickup_dismissed_id' then (p_patch->>'pickup_dismissed_id')::bigint else pickup_dismissed_id end,
         dispatch_mode   = case when p_patch ? 'dispatch_mode'   then p_patch->>'dispatch_mode' else dispatch_mode end,
         pickup_requested_at = case when p_patch ? 'pickup_requested_at' then (p_patch->>'pickup_requested_at')::timestamptz else pickup_requested_at end,
         last_error      = null,
         attempts        = 0,
         locked_until    = null,
         next_attempt_at = now()
   where id = p_id and status = p_from;
  get diagnostics n = row_count;
  return n = 1;
end $$;

revoke all on function public.transition_shipment(uuid, public.shipment_status, public.shipment_status, jsonb) from public, anon, authenticated;
grant execute on function public.transition_shipment(uuid, public.shipment_status, public.shipment_status, jsonb) to service_role;
