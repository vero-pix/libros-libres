-- Capa de proveedores de despacho, paso 1 (PR 1.1, 07-10-2026).
--
-- `shipments` y `shipit_events` dejan de ser solo de Shipit: cada fila dice qué
-- proveedor la maneja. Todo lo que existe hoy es de Shipit, y por eso el
-- default. El worker (app/api/cron/shipments) elige el adaptador con esta
-- columna (lib/despacho) y funciona igual sin ella: si la migración todavía no
-- está aplicada, la fila llega sin `provider` y se trata como Shipit.
--
-- `claim_shipments` devuelve `s.*`, así que la columna aparece en las filas que
-- toma el worker sin tocar la función.
--
-- Se aplica a mano en el SQL Editor. No hay orden que respetar con otras
-- migraciones.
alter table public.shipments
  add column if not exists provider text not null default 'shipit';

alter table public.shipit_events
  add column if not exists provider text not null default 'shipit';

comment on column public.shipments.provider is
  'Proveedor de despacho que maneja el envío (lib/despacho): shipit | fake. Shipit por defecto.';
comment on column public.shipit_events.provider is
  'Proveedor de despacho del evento. Shipit por defecto.';
