-- 07-09-2026: 'sandbox' en mode (Shipit lo activó por cuenta, pero la API lo
-- ignora: quedó APAGADO) y 'origin_verified' en kind para anotar que el
-- origen de un vendedor se verificó por GET /v/origins. Aplicada el 07-09.
alter table public.shipit_events drop constraint shipit_events_mode_check;
alter table public.shipit_events add constraint shipit_events_mode_check check (mode in ('dry-run', 'sandbox', 'live'));
alter table public.shipit_events drop constraint shipit_events_kind_check;
alter table public.shipit_events add constraint shipit_events_kind_check check (kind in
  ('create', 'get', 'delete', 'label', 'email', 'gong', 'webhook', 'dry-run', 'transition', 'error', 'origin_verified'));
