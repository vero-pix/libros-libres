# Base de conocimiento TusLibros.cl

**Fecha de verificación:** 07-10-2026 (despacho, pago, comisión y contacto, contra el código). El resto se verificó el 25-07-2026.
**Fuente:** código del repo (`lib/shipping/coordinado.ts`, `lib/cargo-servicio.ts`, `lib/commissions.ts`, `app/api/orders/route.ts`) y páginas públicas (`/como-funciona`, `/ayuda/*`, `/como-despachar`, `/devoluciones`).
**Uso:** fuente de verdad para el copy del sitio y para el system prompt del asistente. Todo dato fuera de este archivo es supuesto, no hecho. Si el código y este archivo se contradicen, gana el código y se corrige este archivo.

---

## 1. Qué es TusLibros

Marketplace chileno de libros usados. Publicar es gratis, siempre. El catálogo se explora por búsqueda, categorías o mapa geolocalizado.

Se puede navegar sin cuenta. Se requiere cuenta para publicar o para escribirle a alguien.

---

## 2. Cómo se paga — VERIFICADO 07-10-2026

| Vía | Cómo opera | Cargo al comprador | Comisión al vendedor |
|---|---|---|---|
| **MercadoPago con despacho** | Compra desde la ficha; el pago se divide al momento (split): libro + despacho al vendedor, 8% a tuslibros | **8% del libro** como "cargo por servicio" | Nada: recibe libro y despacho completos |
| **MercadoPago con entrega en persona** | Compra desde la ficha; coordinan lugar y hora por mensaje | $0 | **8% del libro**, descontado de su pago |
| **Transferencia** (solo vendedores que la tienen activada) | El comprador confirma el pedido y el vendedor le manda sus datos por la mensajería del sitio | $0 | Nada |
| **Trato directo** (solo vendedores sin MercadoPago ni transferencia: se muestra su WhatsApp) | Se ponen de acuerdo fuera del sitio | — | Nada (no hay cómo cobrarla) |

- **No existe retención del pago hasta la entrega.** Con el split de MercadoPago el vendedor cobra cuando el comprador paga. No escribir "tu plata queda protegida hasta que recibes el libro" ni "el vendedor cobra al confirmar la entrega".
- El sitio no guarda datos bancarios (desde el 23-09-2026).
- Con MercadoPago conectado, el WhatsApp del vendedor no se muestra (`lib/whatsapp-policy.ts`).
- La transferencia no se activa desde el perfil: la activa Vero (`users.acepta_transferencia`).

**Regla de comisión para copy:** *"8% del precio del libro, igual para todos, solo cuando te pagan con MercadoPago. Por transferencia, nada."* Con despacho ese 8% lo paga el comprador como cargo; en persona se descuenta al vendedor.

> ⚠️ La formulación *"si coordinas todo por WhatsApp y entregas en persona, no pagas nada"* se retiró del copy el 25-08-2026 porque funcionaba como instructivo para saltarse la caja. **No volver a escribirla.**

---

## 3. Publicación

1. Iniciar sesión
2. Publicar libro → `/publish`
3. Escanear código de barras o ingresar ISBN
4. Completar precio y estado
5. Marcar ubicación en el mapa
6. Aparece en el catálogo al instante

Estados posibles: **Como nuevo · Buen estado · Estado regular · Con detalles**

Sin límite de publicaciones. Importador CSV disponible en `/mis-libros/importar`.
Pausar o eliminar publicaciones desde `/mis-libros`.

Los compradores compran directo en el sitio (MercadoPago o transferencia) o le escriben al vendedor por la mensajería interna.

---

## 4. Despacho — VERIFICADO 07-10-2026

**Shipit está apagado desde el 15-09-2026** y ya no opera para tuslibros, tampoco para ventas antiguas. No hay etiqueta automática, no hay retiro a domicilio por courier, no hay cotización automática.

**Despacho coordinado** (`lib/shipping/coordinado.ts`):
- El comprador paga una **tarifa fija por zona**: Santiago, misma región, otra región o zonas extremas (Arica y Parinacota, Tarapacá, Antofagasta, Aysén, Magallanes). Las tarifas viven en `site_config.envio_coordinado`; **no escribirlas a mano en el copy**.
- **Cada vendedor puede poner sus propias tarifas o apagar el despacho** en `/perfil` → "Tu despacho" (desde el 07-10-2026). Si lo apaga, sus libros solo se entregan en persona.
- La ficha muestra el **total con despacho** para la comuna que elige el comprador (libro + despacho + cargo), antes de comprar.
- Esa plata le llega al vendedor con la venta. El vendedor lleva el paquete a la sucursal del courier que elija (Starken, Chilexpress, Blue Express, Correos de Chile u otro), paga ahí, y registra el courier y el número de seguimiento en `/mis-ventas` → "Ya lo despaché". Con eso se le avisa al comprador por correo.
- Plazo del vendedor: **2 días hábiles** desde la venta. Plazo informado al comprador: **2 a 5 días hábiles desde que el vendedor despacha**.
- Varios libros del mismo vendedor en una sola compra pagan **un solo despacho**. Dos compras separadas pagan dos despachos (el "se suma al paquete abierto" existía solo con Shipit).
- No hay envío gratis: la promo sobre $20.000 terminó el 15-09-2026.
- En camino (no vigente aún): despacho propio con Blue Express como primer courier (repo `vero-pix/despacho`).

---

## 5. Devoluciones — según `/devoluciones` (pendiente de revisar)

> ⚠️ Pendiente de decisión de Vero (auditoría del 07-10-2026): la página promete una etiqueta de devolución por Chilexpress y no hay integración en el código que la genere; y `/ayuda/comprar` pide avisar dentro de 3 días mientras `/devoluciones` dice 7.

**Aplica solo a compras pagadas en el sitio.**

Causales admitidas:
- Libro dañado en el transporte
- Libro distinto al publicado
- Condición muy distinta a la descrita

Plazo publicado en `/devoluciones`: **7 días desde la recepción.**

Condiciones:
- El envío original **no se reembolsa**, salvo libro dañado o equivocado
- No se aceptan devoluciones por cambio de opinión
- **El vendedor está protegido:** TusLibros valida la legitimidad del reclamo antes de pedirle aceptar la devolución

---

## 6. Cuenta

- Registro en `/register` con nombre, correo y contraseña. Sin tarjeta.
- Recuperación de contraseña en `/forgot-password`, código por correo.

---

## 7. URLs canónicas

| Función | URL |
|---|---|
| Buscar / catálogo | `/search` |
| Mapa | `/mapa` |
| Publicar | `/publish` |
| Mis libros | `/mis-libros` |
| Importar CSV | `/mis-libros/importar` |
| Mis ventas | `/mis-ventas` |
| Mis compras | `/mis-pedidos` |
| Perfil (y "Tu despacho") | `/perfil` |
| Registro | `/register` |
| Login | `/login` |
| Recuperar clave | `/forgot-password` |
| Se busca | `/solicitudes` |
| Cómo funciona | `/como-funciona` |
| Ayuda (comprar / vender) | `/ayuda`, `/ayuda/comprar`, `/ayuda/vender` |
| Cómo despachar | `/como-despachar` |
| Devoluciones | `/devoluciones` |
| Contacto | `/contacto` |
| Tiendas | `/tiendas` |
| Categorías | `/categoria` |

## Contacto — VERIFICADO 07-10-2026

- **Contacto público: WhatsApp de soporte +56 9 9458 3067** (`wa.me/56994583067`). En código vive solo en `lib/soporte.ts`.
- Buzón de correo: **hola@tuslibros.cl** (`VERO_INBOX` de `lib/veroInbox.ts`). `vero@tuslibros.cl` no recibe.

---

## 8. Inconsistencias detectadas — REQUIEREN DECISIÓN

**8.1 Comisión — RESUELTO el 26-07-2026.** 8% sobre el precio del libro, para todos. Sin tramos ni planes.

**8.2 Contacto — RESUELTO el 04-09-2026.** El contacto público es el WhatsApp de soporte; el correo es hola@tuslibros.cl.

**8.3 Pago en efectivo — PENDIENTE (07-10-2026).** `/ayuda/preguntas` dice que no se puede pagar en efectivo; la ficha y `/libros-usados-baratos` dicen que sí al retirar; los términos dicen que coordinar pagos por fuera es causa de despublicación.

**8.4 Devoluciones — PENDIENTE (07-10-2026).** Ver sección 5.

---

## 9. Pendientes no verificables desde el sitio público

- Horario de atención del soporte humano
