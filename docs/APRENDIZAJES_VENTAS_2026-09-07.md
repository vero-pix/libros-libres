# Aprendizajes de las ventas del 28-08 al 06-09-2026

**Qué pasó, cómo hubo que ayudar a compradores y vendedores, y qué están pidiendo.** Fuentes: 45 órdenes, hilos de mensajería interna, `contact_messages`, `book_requests`, commits del período y los hilos de WhatsApp de Vero con vendedores. Sin datos personales de compradores.

---

## 1. El resumen en cinco líneas

1. En 10 días hubo 14 transacciones pagadas en plataforma; en los 4,5 meses anteriores hubo 4. La causa combinada: se cerró la salida por WhatsApp para vendedores con MercadoPago y se arreglaron fallas silenciosas del checkout.
2. Ninguna de esas ventas se completó sola: en todas Vero intervino a mano en el despacho, en la coordinación o en ambas.
3. El punto de quiebre no es vender, es **entregar**: etiquetas, retiros, contacto entre partes y avisos.
4. Los vendedores ya tienen su propia logística (Bluexpress, Starken en sucursal, entrega en metro) y quieren usarla. La plataforma hoy solo contempla el retiro a domicilio de Shipit.
5. La mensajería interna funciona como canal, pero se está usando para sacar la transacción de la plataforma (teléfono, transferencia, efectivo). Cerrar WhatsApp movió la fuga, no la eliminó.

---

## 2. Cómo hubo que ayudar

### A los vendedores

| Situación | Qué pasó | Qué tuvo que hacer Vero | Qué aprendimos |
|---|---|---|---|
| Venta pagada con courier | La orden Shipit queda en borrador; no hay etiqueta ni retiro | Entrar al panel de Shipit, elegir origen, crear envío, agendar retiro, descargar PDF, mandarlo por WhatsApp, pegar tracking a mano. 9 veces en un fin de semana, ~15 min cada una | Automatizar esto es la prioridad técnica (guía Shipit v2) |
| Origen equivocado | Un envío de Libro de Ocasión salió con la dirección de Vero como origen porque el listing tenía "Santiago, RM" sin número | Corregir en el panel; fix el 05-09 para usar la dirección del vendedor | El origen debe ser un registro por vendedor, no texto libre |
| "No sé dónde descargar la etiqueta" | El correo de venta decía "lleva el paquete a Starken" cuando en realidad el courier pasa a la casa | Explicar por WhatsApp; se reescribió el correo y `/como-despachar` el 06-09 | Las instrucciones deben describir el flujo real, no el deseado |
| Venta que no se vio | Scarlett perdió una venta 8 días porque el correo no llegó o no se leyó | Aviso manual | Un canal de aviso no basta: correo + panel con "requiere tu acción" + gong |
| Libro vendido dos y tres veces | El listing no se bloqueaba al reservar ni al vender | Cancelar y avisar a compradores | Reserva atómica con expiración (pendiente, D2 del plan post-venta) |
| Entrega en persona sin contacto | "No sé cómo contactar a la persona" | Explicar el botón Escribir en Mis Ventas | El botón existía pero nadie lo veía; ahora va en el correo |
| Regiones duplicadas en filtros | Carlos (CIM) reportó "Bío Bío" tres veces | Normalización el 05-09 | Reportes de vendedores activos son la mejor QA |
| 14 libros escaneados sin publicar (CIM) | Fotos subidas, ficha no terminada | Lista manual y ofrecimiento de retomarlos | Falta un "tienes N borradores" en Mis Libros |
| Cupón que cobraba precio lleno | Descuento aplicado en la orden pero no en MercadoPago | Reembolso/explicación; fix 02-09 con guarda que cancela la compra si no cuadra | Toda diferencia entre lo exhibido y lo cobrado es un bug bloqueante |

### A los compradores

| Situación | Qué pasó | Qué tuvo que hacer Vero | Qué aprendimos |
|---|---|---|---|
| Pago rechazado (`cc_rejected_high_risk`) | Compradora nueva quedó dando vueltas por el perfil del vendedor sin salida | Fix 04-09: pantalla explica el motivo y ofrece tres salidas | El rechazo es el momento de mayor fuga; hay que tratarlo como pantalla de primera clase |
| 5 intentos de pago en 8 minutos | El checkout creaba la orden y se quedaba mudo si MP no devolvía el link | Fix 27-08 | El 51% de órdenes "pendientes" era en parte el sitio, no el comprador |
| ¿Dónde está mi libro? | Sin tracking en Mis Pedidos hasta que Vero lo pegaba a mano | Mensaje manual con número de seguimiento | El comprador necesita tracking y fecha estimada sin preguntar |
| Ingreso con Google cortado en Android | 23 veces entre junio y septiembre; 6 de 10 usuarios no volvieron; uno con compra a medio pagar | Fix 02-09: aviso y reintento | Un login que falla en silencio cuesta compras reales |
| Quiere pagar en persona o por transferencia | Compradores preguntan "dónde pago", prefieren efectivo | Sin intervención: el vendedor lo resolvió fuera | El checkout debe explicar en la ficha que el pago es en línea y por qué (protección) |
| Solicita envío a Colombia | Dos consultas en una semana; la vendedora no sabía cómo | Sin respuesta estructurada | Decidir explícitamente: "solo Chile" visible en la ficha, o política internacional |

---

## 3. Qué están sugiriendo o haciendo por su cuenta

- **Dejar el paquete en sucursal en vez de esperar al Héroe** (Carlos, CIM). Libros de la Buhardilla ya despacha por Bluexpress con su propia etiqueta y ofrece envío gratis sobre $25.000 en la RM. La plataforma no contempla ninguna de las dos cosas. Decisión tomada: modalidad `pickup`/`dropoff` elegida por el vendedor (guía Shipit v2, D7).
- **Puntos de entrega en metro** para entrega en persona (Rojas Magallanes, Vicente Valdés, San Pablo, Moneda). Es el patrón dominante de coordinación. Sugerencia de producto: campo "punto de entrega habitual" en el perfil del vendedor, visible en la ficha cuando hay entrega en persona.
- **Compartir el teléfono** dentro de la mensajería interna, de ambos lados, para "conversar más fluidamente". La mensajería no reemplaza a WhatsApp en tiempo real; cumple para el primer contacto. Aceptar que el teléfono se comparte y registrar el consentimiento, o mejorar la mensajería con notificaciones push. No hay tercera opción.
- **Vender libros subrayados** (consulta por formulario de contacto, 25-08). Hoy la condición "usado con marcas" existe, pero la guía de publicación no lo dice. Copy pendiente.
- **Búsquedas por tema que devolvían cero** (filosofía, espiritualidad, esoterismo): se respondió con landings el 04-09. Los pedidos en `/solicitudes` (21 en dos semanas: Hellinger, Evola, Pessoa, Allende, golpe de 1973) son demanda documentada para orientar a vendedores.
- **Respuesta que no se ve** en mensajería ("le respondí pero no veo mi respuesta", 04-09): posible bug de visualización del hilo. Revisar.

---

## 4. Riesgos que dejan estos días

- **Fuga por mensajería interna.** Un vendedor ofreció pago por transferencia y despacho propio dentro del chat. El bloqueo de WhatsApp movió la fuga de canal; la regla de negocio ("si puedes cobrar por la plataforma, la venta va por la plataforma") no está escrita en ningún lugar visible para el vendedor. Hace falta un texto claro en Términos y en la bienvenida del vendedor, y detección simple (regex de teléfono/transferencia) que muestre un aviso, no que bloquee.
- **Spam en el formulario de contacto.** 5 de 9 mensajes desde el 05-09 son cadenas aleatorias: el honeypot no los detiene. Añadir validación mínima de longitud/contenido antes de que lleguen al buzón.
- **Volumen total a la baja.** Los libros marcados como vendidos cayeron ~25% tras el bloqueo. Si los vendedores grandes perciben "vendo menos", dejan de publicar. Métrica semanal: captura y volumen, juntas.
- **Dependencia de Vero.** Cada venta con courier hoy requiere entre 4 y 6 acciones manuales. Con 3 ventas/día el modelo no escala; con 10 se rompe.

---

## 5. Qué debe quedar disponible para los usuarios (documentación pública)

Contenido redactado en `docs/AYUDA_USUARIOS_2026-09-07.md`, listo para publicar como `/ayuda` con tres secciones (vendedor, comprador, preguntas frecuentes) y enlazar desde el footer, el correo de bienvenida, el correo de venta y `/como-despachar`.
