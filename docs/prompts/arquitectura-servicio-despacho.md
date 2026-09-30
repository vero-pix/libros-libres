# Prompt: arquitectura del servicio de despacho de tuslibros.cl

Para pegar en una sesión nueva de Claude (Claude Code en un repo nuevo, o un chat
de diseño). Pide un documento de arquitectura, no código.

---

Quiero diseñar un servicio de despacho propio para tuslibros.cl, un marketplace
chileno de libros usados. Necesito un documento de arquitectura, no código todavía.

## Contexto (verificado)

- El marketplace corre en Next.js 14 (App Router) + TypeScript + Supabase
  (Postgres, Auth, Storage), con deploy en Vercel. El repo es público.
- Cada vendedor despacha desde su casa o librería, en distintas comunas de Chile.
  Los paquetes son libros: casi siempre de 0,3 a 3 kg y de tamaño chico.
- Hasta mediados de septiembre de 2026 usábamos Shipit, un agregador chileno de
  couriers. Con Shipit la etiqueta salía sola y el courier pasaba a buscar el
  paquete a la casa del vendedor. **Casi todas las compras de ese período fueron
  con courier**, y cuando Shipit se apagó las compras cayeron. El valor no estaba
  en cotizar: estaba en que el vendedor no tuviera que ir a una sucursal.
- Shipit no se va a relanzar por ahora. Los agregadores SaaS revisados no
  sirven para nuestro volumen: Enviame exige mínimo 200 envíos al mes en su plan
  con tarifas propias y 10.000 en el plan con cuentas del cliente.
- El volumen actual es bajo: decenas de envíos al mes, no cientos.
- El checkout ya existe: órdenes agrupadas por `bundle_id`, pago con MercadoPago
  (split con el vendedor) o por transferencia. Hoy hay un "despacho coordinado"
  con tarifa fija que se paga en el checkout y se coordina a mano.

## Lo que se sabe de los couriers (30-09-2026)

- **Chilexpress:** única API REST con portal público
  (developers.wschilexpress.com). Keys de prueba con solo registrarse; producción
  exige cuenta empresa. Cubre cotizar, coberturas, emitir OT, etiqueta y tracking.
  Referencia: plugin oficial de WooCommerce y `vichinho/chilexpress-api` en GitHub.
- **Blue Express:** plugin oficial de WooCommerce (cotiza, OT, etiqueta,
  tracking, puntos de retiro). API sin documentación pública; exige contrato.
- **Starken:** app oficial en Shopify; API no pública.
- **Correos de Chile:** sin API pública conocida.
- No existe un SDK open source mantenido para ninguno de ellos, y Karrio (el
  agregador open source más usado) no tiene conectores chilenos.

Verifica tú lo que puedas. Si algo de esto no se puede confirmar, dilo en vez
de suponer.

## Lo que necesito que diseñes

1. **Capa de couriers:** una interfaz común (cotizar, crear envío, etiqueta,
   pedir retiro, tracking, cancelar) con un adaptador por courier. Chilexpress
   primero. Que agregar Blue Express o Starken después sea escribir un adaptador
   nuevo, no rehacer el sistema.
2. **Dónde vive:** compara dos opciones y recomienda una:
   (a) un módulo dentro del mismo Next.js de tuslibros;
   (b) un servicio aparte (su propio repo y deploy) que tuslibros llama por HTTP
   y que podría servir a otros proyectos más adelante.
   Considera el volumen bajo, que lo mantiene una sola persona con ayuda de IA,
   y que en Vercel las funciones tienen límites de tiempo.
3. **Modelo de datos en Supabase:** envíos, eventos de tracking, cotizaciones
   guardadas, orígenes por vendedor (comuna y dirección de retiro), credenciales
   por courier. Qué va en tablas y qué en variables de entorno. Row Level
   Security: el vendedor ve solo sus envíos; el comprador, el tracking de lo suyo.
4. **Flujo completo:** checkout (cotización real + margen configurable) → pago
   confirmado → emisión automática de la OT → etiqueta PDF al vendedor por correo
   y en su panel → retiro agendado → tracking → entregado → cierre del pedido.
   Qué pasa cuando algo falla en cada paso, y quién se entera.
5. **Plata:** quién paga el flete (el comprador, al precio cotizado más un margen
   que defino yo), cómo se concilia contra la factura del courier y cómo se evita
   subsidiar envíos sin darse cuenta. Esto último ya nos pasó.
6. **Operación:** qué se automatiza y qué queda manual al inicio; alertas para
   envíos detenidos (tuvimos uno 13 días parado sin que nadie lo viera);
   idempotencia de los webhooks; qué hacer si el courier agenda retiros solo.
7. **Plan por etapas:** qué se puede construir y probar solo con las keys de
   prueba de Chilexpress, antes de firmar ninguna cuenta empresa, y qué espera
   al contrato. Un piloto chico (Santiago → Santiago) antes de abrir a regiones.
8. **Riesgos y preguntas abiertas** que yo tengo que responder o negociar con los
   couriers: volumen mínimo, costo de la cuenta empresa, retiro a domicilio del
   vendedor, tarifas por peso y zona.

## Reglas

- Español de Chile, directo. Sin jerga corporativa.
- No inventes endpoints, precios, requisitos ni cifras. Si no está verificado,
  márcalo como supuesto.
- Prioriza lo simple que funcione con poco volumen por sobre lo escalable.
- Entregable: un documento de arquitectura en Markdown con un diagrama del flujo,
  el modelo de datos, la interfaz de la capa de couriers y el plan por etapas.
