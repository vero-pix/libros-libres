# PROMPT 0.3 — ¿Cómo se le dice a Shipit que un envío no lleva Retiro Héroe?

Hallazgos del 07-09-2026. No se implementó nada. Espera decisión de Vero.

## Respuesta corta

**No hay que decirle nada: la API no agenda retiro.** `POST /v/shipments`
crea el envío, el courier lo asigna y en segundos aparece la etiqueta
(`pack_pdf`) y el tracking. `last_pickup` queda en `null`; el retiro es una
**Solicitud de Retiro** aparte, que se hace en la plataforma de Shipit
(`app.shipit.cl`) antes de las 11:00. No existe endpoint documentado para
solicitarlo ni cancelarlo por API.

Es decir: el "dropoff" de D7 es el estado natural de un envío creado por
API. El "pickup" es el que requiere una acción extra, y hoy esa acción es
manual en el panel de Shipit.

## 1. Documentación (developers.shipit.cl)

Páginas revisadas en `.md`: `llms.txt`, crear un envío, crear envío y
retiro en bodega, dirección de origen, consulta tu configuración,
sucursales por courier, consultar envío por ID, autenticación, paso a paso.

- **Body de `POST /v/shipments`**: no tiene ningún campo de retiro. Los
  únicos campos con "pickup/retiro" son de **destino**, no de origen:
  `destiny.kind` = `home_delivery` | `courier_branch_office` (el comprador
  retira en sucursal) | `fulfillment_delivery`, y
  `destiny.courier_branch_office_id`. `courier.without_courier` ("indica si
  el envío necesita otro tipo de despachos") se probó y no cambia nada.
- **`GET /v/origins`**: el origen solo tiene dirección y contacto
  (`address_book`, `reverse_logistic`). Sin configuración de retiro.
- **`GET /v/integrations/seller/{email}`**: devuelve 404 para esta cuenta
  (es para tiendas Shopify/Woo, no para API directa).
- **`GET /v/couriers`**: cada courier trae `has_pickup_heroe` (true en
  Chilexpress, Starken, Rayo, Recíbelo; false en Recíbelo Priority) y
  `available_pickup_offices` (true solo en Chilexpress). Son capacidades del
  courier, no una opción por envío.
- **`/v/shipments/fulfillment_delivery`** (`delivery_id: 3`, "Retiro en
  bodega") es solo para clientes con servicio Fulfillment de Shipit.
  No aplica.
- **Respuesta del envío**: trae `request_pickup: true`, `schedulable: false`,
  `pickup_state: null`, `last_pickup: null`. Son campos de lectura;
  ninguno se acepta en el body.

## 2. Envíos de prueba (origen 100321, Providencia)

| | TEST-0907A | TEST-0907B |
|---|---|---|
| id Shipit | 8911837 | 8911838 |
| body | Chilexpress `selected`, `sandbox: true` | igual + `courier.without_courier: true` |
| respuesta inmediata | `status: created`, `last_pickup: null`, `pack_pdf: null` | idéntica |
| 20 s después (`GET /v/shipments/{id}`) | `in_preparation`, tracking `713129353775`, `pack_pdf` listo, `last_pickup: null`, `request_pickup: true`, `pickup_state: null`, precio $6.844 | `in_preparation`, tracking `713129353790`, resto idéntico |
| anulados | `DELETE /v/shipments/8911837` → "Envío eliminado" | `DELETE /v/shipments/8911838` → "Envío eliminado" |
| estado final | `canceled_shipment`, `billing_date: 2026-09-07` | igual |

**`last_pickup` viene sin agenda en los dos.** No hay que hacer nada para
que venga sin agenda: es lo que pasa por defecto. Lo que no probé (y no se
puede por API) es agendar el retiro.

⚠️ **Dos cosas para Vero:**

1. **`sandbox: true` no hizo nada**: los dos envíos volvieron con
   `is_sandbox: false`, tracking real de Chilexpress y precio. El README del
   gem oficial dice "By default sandbox is false. If you need to activate
   sandbox contact us" (integraciones@shipit.cl). El sandbox se activa **por
   cuenta**, no por envío. Hasta que Shipit lo active, `SHIPIT_MODE=sandbox`
   de la guía no puede existir: solo hay `dry-run` y `live`.
2. Los dos envíos quedaron cancelados por API en menos de 2 minutos, en
   estado `in_preparation` (nunca en manos del courier). Al cancelar,
   Shipit les puso `billing_date = 2026-09-07`. Revisar en la factura de
   septiembre que no aparezcan cobrados ($6.844 c/u). Si aparecen, es el
   argumento para pedir el sandbox.

`DELETE /v/shipments/{id}` no está en la documentación pero funciona y
deja el envío en `canceled_shipment`. Sirve para el worker (anular un envío
creado por error) y para las pruebas.

## 3. Centro de ayuda (shipitcl.zendesk.com)

- **"¿Qué es el servicio Retiro Héroe y Entrega a Courier?"** (artículo
  360007626113): el Retiro Héroe es "solo en RM"; el flujo es "1. Solicitar
  retiro en la plataforma, 2. un héroe recoge, 3. se entrega al courier el
  mismo día". Para regiones: "puedes ir a dejar tus productos a la sucursal
  del Courier asignado".
- **"¿En qué comunas de la RM retiramos?"** (360007479394): 34 comunas
  (Providencia, Santiago Centro, Las Condes, Ñuñoa, La Florida, Puente
  Alto…). Y la frase clave para D7: si prefieres no usar el retiro, puedes
  **"ir a dejar tus encomiendas directamente a la sucursal según el courier
  que se encuentre asignado (solo para Chilexpress, Starken y Bluexpress)"**.
- **"Horarios de Solicitud y Retiro"** (115004473767): corte a las 11:00;
  la solicitud se ingresa a mano en la plataforma; después del corte queda
  para el día hábil siguiente. Retiro entre 11:30 y 16:00.
- **"¿Shipit realiza retiros en todo el país?"** (3946646948623): el
  artículo está indexado pero devuelve 404 (borrado). Solo sobrevive el
  snippet del buscador: *"…previa solicitud de retiro Héroe desde la Suite
  de Shipit. ¿Cómo solicitar un retiro? Si te encuentras en regiones,
  puedes…"*. Confirma lo mismo: el retiro se **solicita** desde la Suite.
- **"Retiro Courier"** (1260806112530): es otra cosa. El courier retira en
  la tienda, con mínimo de 5 envíos diarios (Chilexpress/Starken). No
  aplica a vendedores individuales.
- **"¿Cómo cancelar un envío?"** (360044613253): desde la plataforma;
  instantáneo si no está en manos del courier. No menciona API (pero el
  DELETE funciona, ver arriba).

## 4. ¿La etiqueta `pack_pdf` sirve en sucursal sin retiro agendado?

**Sí, para Chilexpress, Starken y Bluexpress**, según el artículo de las
comunas de la RM. La etiqueta es la del courier (la URL de `pack_pdf` vive
en `printer-labels.s3…/CXP/…`, con el tracking de Chilexpress `7131…`), no
una etiqueta interna de Shipit, y el tracking existe antes de cualquier
retiro. El centro de ayuda no dice nada de plazos para dejarla en sucursal
ni de qué pasa si nunca se entrega. Eso va en la pregunta a soporte.

No aplica a Rayo, Recíbelo ni 99 Minutos (`available_pickup_offices:
false` y no aparecen en la lista del artículo): con esos couriers el
vendedor **tiene** que estar en la RM y pedir retiro. Para D7 eso implica
que un vendedor en modo `dropoff` solo puede recibir cotizaciones de
Chilexpress, Starken o Bluexpress. Hoy `getShipitQuotes()` no filtra por
courier.

## 5. Lo que queda sin resolver y la pregunta a soporte

La API no expone ni el agendamiento ni la cancelación del retiro. Las
alternativas, en orden de preferencia:

1. **No agendar nunca por API y dejar el retiro como acción del vendedor en
   la plataforma de Shipit.** Es lo que pasa hoy. Problema: el vendedor
   necesita cuenta en Shipit (o que Vero agende por él), lo que rompe D1/D6.
2. **Preguntar si existe endpoint de retiros** (la UI lo tiene; el campo
   `request_pickup` sugiere que hay algo detrás). Si existe, D7 se
   implementa completo desde el worker.
3. **Dos orígenes con configuración distinta**: no sirve. El origen no
   tiene configuración de retiro; el retiro es por solicitud, no por
   origen.
4. **Cancelar el retiro después de crear**: no hace falta, porque no se
   crea solo.

Correo propuesto (a soporte@shipit.cl con copia a integraciones@shipit.cl):

> Asunto: API — solicitud de retiro y modo sandbox (cuenta TusLibros)
>
> Hola, integramos la API de Shipit desde tuslibros.cl (cuenta
> {SHIPIT_EMAIL}, origen 100321). Hoy creamos dos envíos de prueba,
> ids 8911837 y 8911838 (referencias TEST-0907A y TEST-0907B, ya
> cancelados por API), y tenemos tres consultas:
>
> 1. Los envíos se crearon sin retiro (`last_pickup: null`,
>    `request_pickup: true`). ¿Existe un endpoint para **solicitar y
>    cancelar el Retiro Héroe** de un envío por API, equivalente a la
>    "Solicitud de Retiro" de la plataforma? Necesitamos que cada vendedor
>    elija por envío entre retiro en su domicilio (RM) o dejar el paquete
>    en la sucursal del courier.
> 2. Si el remitente deja el paquete en sucursal de Chilexpress o Starken
>    con la etiqueta `pack_pdf` y sin retiro agendado, ¿hay un plazo máximo
>    para entregarlo y qué pasa con el envío si nunca se entrega?
> 3. Enviamos `sandbox: true` en el body y los envíos volvieron con
>    `is_sandbox: false`, tracking real y precio $6.844. ¿Pueden **activar
>    el modo sandbox** en nuestra cuenta? Y confirmar que los ids 8911837 y
>    8911838, cancelados en estado "En Preparación", no se facturan.
>
> Gracias,
> Verónica Velásquez — tuslibros.cl

## Efecto en la guía v2 si Vero confirma

- D7 se mantiene como decisión de producto, pero el `pickup` no se puede
  automatizar hasta la respuesta de soporte. Fase 1 debería arrancar con
  **`dropoff` como único modo** (Chilexpress/Starken/Bluexpress) y el correo
  al vendedor diciendo "imprime la etiqueta y déjala en la sucursal más
  cercana". El `pickup` queda como fase 1.5 si aparece el endpoint.
- `SHIPIT_MODE=sandbox` no existe hasta que Shipit lo active por cuenta.
  Mientras tanto las pruebas en `live` se anulan con `DELETE` al tiro.
- `getShipitQuotes()` tiene que poder filtrar couriers cuando el vendedor
  está en `dropoff`.
