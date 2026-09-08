-- Pieza B, paso 1 de 2: el estado nuevo.
--
-- Va SOLO en este archivo y se aplica ANTES que 20260908d: Postgres no deja
-- usar un valor de enum recién agregado dentro de la misma transacción que lo
-- agregó ("unsafe use of new value"), y 20260908d lo nombra en claim_shipments.
--
-- `pickup_failed`: el retiro se agendó y no se concretó — venció la ventana,
-- el vendedor lo dejó en la sucursal, o alguien anuló el retiro en el panel.
-- No es un envío roto: es un envío esperando que el vendedor elija qué hacer.
alter type public.shipment_status add value if not exists 'pickup_failed' after 'pickup_scheduled';
