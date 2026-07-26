# Base de conocimiento TusLibros.cl — Fase 0

**Fecha de verificación:** 25-07-2026
**Fuente:** páginas públicas de tuslibros.cl (`/como-funciona`, `/faq`, `/como-despachar`, `/devoluciones`)
**Uso:** fuente de verdad para el copy del sitio y para el system prompt del asistente. Todo dato fuera de este archivo es supuesto, no hecho.

---

## 1. Qué es TusLibros

Marketplace chileno de libros usados. Publicar es gratis, siempre. El catálogo se explora por búsqueda, categorías o mapa geolocalizado.

Se puede navegar sin cuenta. Se requiere cuenta para publicar o para escribirle a alguien.

---

## 2. Las tres vías de transacción — VERIFICADO

| Vía | Cómo opera | Comisión |
|---|---|---|
| **Directa por WhatsApp** | Comprador y vendedor se contactan y coordinan entrega en persona | Cero |
| **Pago con MercadoPago** | Compra desde la publicación, dinero protegido, vendedor cobra al confirmar entrega | Sí |
| **Despacho por courier (Shipit)** | Retiro a domicilio, envío a todo Chile | Sí |

**Regla de comisión (textual del FAQ):** *"Las comisiones solo aplican cuando usas nuestras herramientas integradas: pago con MercadoPago o despacho por courier. Si coordinas todo por WhatsApp y entregas en persona, no pagas nada."*

Las dos vías pagadas son combinables e independientes entre sí.

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

Los compradores contactan por WhatsApp al número registrado en `/perfil`, o compran directo con MercadoPago.

---

## 4. Despacho (Shipit) — VERIFICADO

- El courier **retira en el domicilio** del vendedor. No hay que ir a sucursal ni hacer fila.
- **El vendedor no le paga nada al courier.** El envío se factura a la cuenta de tuslibros.cl a fin de mes.
- Plazo para tener el paquete listo: **2 días hábiles** desde la venta.
- Corte diario de agendamiento: **11:00 AM**. Pago posterior a esa hora → retiro al día hábil siguiente.
- Etiqueta: se descarga desde `/mis-ventas` si está disponible. Si no aparece el botón, el courier trae el manifiesto impreso; el vendedor anota código de tracking y nombre del destinatario en el paquete.
- El vendedor firma un manifiesto de retiro y guarda su copia como respaldo hasta que el comprador confirme recepción.

---

## 5. Devoluciones — VERIFICADO

**Aplica solo a compras pagadas con MercadoPago.** Sin orden en la plataforma no hay devolución posible.

Causales admitidas:
- Libro dañado en el transporte
- Libro distinto al publicado
- Condición muy distinta a la descrita

Plazo: **7 días desde la recepción.**

Proceso:
1. Escribir a hola@tuslibros.cl con ID de orden y foto
2. Validación en **menos de 24 horas**
3. Si corresponde, se envía etiqueta de devolución
4. Se gestiona por **Chilexpress** (no Shipit), en sucursal, sin retiro a domicilio
5. Reembolso del monto del libro a la cuenta de MercadoPago del comprador

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
| Perfil | `/perfil` |
| Registro | `/register` |
| Login | `/login` |
| Recuperar clave | `/forgot-password` |
| Se busca | `/solicitudes` |
| Cómo funciona | `/como-funciona` |
| Cómo despachar | `/como-despachar` |
| Devoluciones | `/devoluciones` |
| FAQ | `/faq` |
| Contacto | `/contacto` |
| Tiendas | `/tiendas` |
| Categorías | `/categoria` |

WhatsApp oficial: **+56 9 9458 3067** (`wa.me/56994583067`)

---

## 8. Inconsistencias detectadas — REQUIEREN DECISIÓN

**8.1 Comisión — RESUELTO el 26-07-2026.**
La comisión es **8% sobre el precio del libro, para todos**. No hay tramos ni planes: los 202 usuarios tienen `plan = free` y no se van a asignar planes por ahora. Publicada en `/como-funciona` y en el FAQ.

**8.2 Cuatro puntos de contacto distintos.**
`hola@tuslibros.cl` (FAQ, devoluciones) · `vero@tuslibros.cl` (footer) · `/contacto` · `/sobre-nosotros#contacto` · WhatsApp del header.
El asistente necesita uno solo y canónico para escalar.

**8.3 La devolución existe pero no se menciona donde se decide.**
La protección de 7 días aparece en `/devoluciones`, no en `/como-funciona` — que es donde el comprador elige entre vía directa y MercadoPago. El beneficio más fuerte de la vía pagada está oculto en el pie de página.

**8.4 El retiro a domicilio sin costo para el vendedor tampoco se comunica.**
Que el courier pase a buscar y que el vendedor no le pague nada está solo en `/como-despachar`, página a la que se llega **después** de vender.

---

## 9. Pendientes no verificables desde el sitio público

- Flujos autenticados (`/publish`, checkout, `/mis-ventas`): requieren sesión o acceso al repo
- Costo del despacho para el comprador y cómo se calcula
- Cobertura geográfica real de Shipit
- Horario de atención del soporte humano
